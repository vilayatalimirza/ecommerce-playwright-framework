import { appendFile, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const reportDir = process.env.PLAYWRIGHT_JSON_DIR ?? 'playwright-json';
const metricsDir = process.env.METRICS_DIR ?? 'metrics';
const outputDir = process.env.CI_REPORT_DIR ?? 'ci-report';

const runId = process.env.GITHUB_RUN_ID ?? 'local';
const runNumber = Number(process.env.GITHUB_RUN_NUMBER ?? 0);
const repository = process.env.GITHUB_REPOSITORY ?? 'vilayatalimirza/ecommerce-playwright-framework';
const serverUrl = process.env.GITHUB_SERVER_URL ?? 'https://github.com';
const commitSha = process.env.GITHUB_SHA ?? 'unknown';
const branch = process.env.GITHUB_HEAD_REF || process.env.GITHUB_REF_NAME || 'local';
const event = process.env.GITHUB_EVENT_NAME ?? 'local';
const runUrl = runId === 'local' ? null : serverUrl + '/' + repository + '/actions/runs/' + runId;

const emptyCounts = () => ({ passed: 0, failed: 0, flaky: 0, skipped: 0 });

const statusToOutcome = {
  expected: 'passed',
  unexpected: 'failed',
  flaky: 'flaky',
  skipped: 'skipped',
};

function addCounts(target, source) {
  for (const key of Object.keys(target)) target[key] += Number(source[key] ?? 0);
}

function countOutcomes(testResults) {
  const counts = emptyCounts();

  for (const test of testResults) {
    const outcome = statusToOutcome[test.status];
    if (outcome) counts[outcome] += 1;
  }

  return counts;
}

function totalCounts(counts) {
  return counts.passed + counts.failed + counts.flaky + counts.skipped;
}

function percentage(numerator, denominator) {
  return denominator === 0 ? null : Number(((numerator / denominator) * 100).toFixed(1));
}

function escapeMarkdown(value) {
  return String(value ?? '').replaceAll('|', '\\|').replaceAll('\n', ' ');
}

function stripAnsi(value) {
  const escape = String.fromCharCode(27);

  return String(value)
    .split(escape)
    .map((part, index) => (index === 0 ? part : part.replace(/^[0-9;]*m/, '')))
    .join('');
}

function collectTests(suites, inheritedFile = '') {
  const collected = [];

  for (const suite of suites ?? []) {
    const file = suite.file ?? inheritedFile;

    for (const spec of suite.specs ?? []) {
      for (const test of spec.tests ?? []) {
        const attempts = test.results ?? [];
        const lastAttempt = attempts.at(-1) ?? {};
        const lastErrorAttempt = [...attempts].reverse().find((attempt) => (attempt.errors ?? []).length > 0);
        const error = lastAttempt.errors?.[0]?.message ?? lastErrorAttempt?.errors?.[0]?.message ?? '';

        collected.push({
          title: spec.title ?? 'Untitled test',
          file: spec.file ?? file,
          line: spec.line ?? null,
          project: test.projectName ?? 'unknown',
          status: test.status ?? 'unknown',
          retries: Math.max(0, attempts.length - 1),
          durationMs: Number(lastAttempt.duration ?? 0),
          error: stripAnsi(error).slice(0, 1600),
        });
      }
    }

    collected.push(...collectTests(suite.suites, file));
  }

  return collected;
}

function makeBadge(label, message, color) {
  return { schemaVersion: 1, label, message, color };
}

async function readHistory(historyPath) {
  try {
    const parsed = JSON.parse(await readFile(historyPath, 'utf8'));
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
}

async function main() {
  const entries = await readdir(reportDir);
  const files = entries
    .filter((name) => /^results(?:-\d+)?\.json$/i.test(name))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  if (files.length === 0) {
    throw new Error('No Playwright JSON reports found in ' + reportDir);
  }

  const functionalCounts = emptyCounts();
  const setupCounts = emptyCounts();
  const shards = [];
  const functionalTests = [];
  const setupTests = [];

  for (const file of files) {
    const report = JSON.parse(await readFile(path.join(reportDir, file), 'utf8'));
    const shardTests = collectTests(report.suites);
    const shardFunctionalTests = shardTests.filter((test) => test.project !== 'setup');
    const shardSetupTests = shardTests.filter((test) => test.project === 'setup');
    const shardFunctionalCounts = countOutcomes(shardFunctionalTests);
    const shardSetupCounts = countOutcomes(shardSetupTests);

    addCounts(functionalCounts, shardFunctionalCounts);
    addCounts(setupCounts, shardSetupCounts);
    functionalTests.push(...shardFunctionalTests);
    setupTests.push(...shardSetupTests);

    shards.push({
      shard: file.replace(/^results-/, '').replace(/\.json$/i, '') || 'local',
      ...shardFunctionalCounts,
      setupPassed: shardSetupCounts.passed,
      setupFailed: shardSetupCounts.failed,
      setupSkipped: shardSetupCounts.skipped,
      totalOutcomes: totalCounts(shardFunctionalCounts) + totalCounts(shardSetupCounts),
    });
  }

  // The setup project creates a session used by tests. Its runs are reported
  // separately and excluded from the functional test pass-rate denominator.
  const functionalOutcomes = totalCounts(functionalCounts);
  const setupOutcomes = totalCounts(setupCounts);
  const attempted = functionalCounts.passed + functionalCounts.failed + functionalCounts.flaky;
  const firstAttemptPassRate = percentage(functionalCounts.passed, attempted);
  const eventualSuccessRate = percentage(functionalCounts.passed + functionalCounts.flaky, attempted);
  const flakyRate = percentage(functionalCounts.flaky, attempted);
  const finalFailureRate = percentage(functionalCounts.failed, attempted);
  const failures = functionalTests.filter((test) => test.status === 'unexpected');
  const flakyTests = functionalTests.filter((test) => test.status === 'flaky');
  const generatedAt = new Date().toISOString();

  const metrics = {
    schemaVersion: 2,
    generatedAt,
    source: 'Playwright JSON reporter; functional tests separated from setup project',
    run: {
      id: runId,
      number: runNumber || null,
      url: runUrl,
      branch,
      event,
      commit: commitSha,
    },
    shardCount: files.length,
    totalFunctionalOutcomes: functionalOutcomes,
    totalSetupExecutions: setupOutcomes,
    totalOutcomesIncludingSetup: functionalOutcomes + setupOutcomes,
    counts: functionalCounts,
    setup: setupCounts,
    rates: {
      firstAttemptPassRate,
      eventualSuccessRate,
      flakyRate,
      finalFailureRate,
      denominator: attempted,
      skippedExcluded: true,
      setupProjectExcluded: true,
    },
    failures,
    flakyTests,
    shards,
  };

  await mkdir(metricsDir, { recursive: true });
  await mkdir(outputDir, { recursive: true });

  const historyPath = path.join(metricsDir, 'history.json');
  const history = await readHistory(historyPath);
  const historyEntry = {
    runId,
    runNumber: runNumber || null,
    runUrl,
    generatedAt,
    branch,
    event,
    commit: commitSha,
    counts: functionalCounts,
    setup: setupCounts,
    firstAttemptPassRate,
    eventualSuccessRate,
    flakyRate,
  };
  const nextHistory = [...history.filter((entry) => entry.runId !== runId), historyEntry].slice(-30);

  await writeFile(path.join(metricsDir, 'latest.json'), JSON.stringify(metrics, null, 2) + '\n');
  await writeFile(historyPath, JSON.stringify(nextHistory, null, 2) + '\n');
  await writeFile(path.join(outputDir, 'summary.json'), JSON.stringify(metrics, null, 2) + '\n');

  const passColor = firstAttemptPassRate === null ? 'lightgrey'
    : firstAttemptPassRate >= 95 ? 'brightgreen'
    : firstAttemptPassRate >= 85 ? 'yellow' : 'red';
  const successColor = eventualSuccessRate === null ? 'lightgrey'
    : eventualSuccessRate >= 98 ? 'brightgreen'
    : eventualSuccessRate >= 90 ? 'yellow' : 'red';

  const badges = {
    'pass-rate.json': makeBadge('first-attempt pass', firstAttemptPassRate === null ? 'n/a' : firstAttemptPassRate + '%', passColor),
    'final-success.json': makeBadge('eventual success', eventualSuccessRate === null ? 'n/a' : eventualSuccessRate + '%', successColor),
    'failed.json': makeBadge('failed after retries', String(functionalCounts.failed), functionalCounts.failed === 0 ? 'brightgreen' : 'red'),
    'flaky.json': makeBadge('flaky', String(functionalCounts.flaky), functionalCounts.flaky === 0 ? 'brightgreen' : 'yellow'),
    'total-scenarios.json': makeBadge('business scenarios', String(functionalOutcomes), 'blue'),
  };

  for (const [file, data] of Object.entries(badges)) {
    await writeFile(path.join(metricsDir, file), JSON.stringify(data, null, 2) + '\n');
  }

  const failedRows = failures.length
    ? failures.slice(0, 30).map((test) => '| ' + escapeMarkdown(test.file) + ':' + (test.line ?? '?') + ' | ' + escapeMarkdown(test.title) + ' | ' + test.retries + ' | ' + escapeMarkdown(test.error || 'No error message captured') + ' |')
    : ['| — | No final failures in this run | — | — |'];

  const flakyRows = flakyTests.length
    ? flakyTests.slice(0, 30).map((test) => '| ' + escapeMarkdown(test.file) + ':' + (test.line ?? '?') + ' | ' + escapeMarkdown(test.title) + ' | ' + test.retries + ' |')
    : ['| — | No flaky tests in this run | — |'];

  const lines = [
    '## Playwright execution summary',
    '',
    runUrl
      ? '**Workflow:** Run #' + runNumber + ' · **Branch:** ' + branch + ' · **Event:** ' + event + ' · **Commit:** ' + commitSha.slice(0, 7)
      : '**Workflow:** Local report aggregation',
    '',
    '**Overall result:** ' + (functionalCounts.failed > 0 ? 'FAILED' : functionalCounts.flaky > 0 ? 'PASSED WITH FLAKINESS' : 'PASSED'),
    '',
    '### Functional test outcomes (setup excluded)',
    '',
    '| Outcome | Count |',
    '|---|---:|',
    '| Passed on first attempt | ' + functionalCounts.passed + ' |',
    '| Failed after retries | ' + functionalCounts.failed + ' |',
    '| Flaky (passed on retry) | ' + functionalCounts.flaky + ' |',
    '| Skipped | ' + functionalCounts.skipped + ' |',
    '| **Total functional outcomes** | **' + functionalOutcomes + '** |',
    '',
    '### Authentication setup executions',
    '',
    '| Outcome | Count |',
    '|---|---:|',
    '| Passed | ' + setupCounts.passed + ' |',
    '| Failed | ' + setupCounts.failed + ' |',
    '| Skipped | ' + setupCounts.skipped + ' |',
    '| **Total setup executions** | **' + setupOutcomes + '** |',
    '',
    '| Functional rate | Value |',
    '|---|---:|',
    '| First-attempt pass rate | ' + (firstAttemptPassRate === null ? 'n/a' : firstAttemptPassRate + '%') + ' |',
    '| Eventual success rate | ' + (eventualSuccessRate === null ? 'n/a' : eventualSuccessRate + '%') + ' |',
    '| Flaky rate | ' + (flakyRate === null ? 'n/a' : flakyRate + '%') + ' |',
    '| Final failure rate | ' + (finalFailureRate === null ? 'n/a' : finalFailureRate + '%') + ' |',
    '',
    '**Total outcomes including setup:** ' + (functionalOutcomes + setupOutcomes),
    '**Shards:** ' + files.length,
    '',
    '| Shard | Functional pass | Failed | Flaky | Skipped | Setup pass |',
    '|---:|---:|---:|---:|---:|---:|',
    ...shards.map((shard) => '| ' + shard.shard + ' | ' + shard.passed + ' | ' + shard.failed + ' | ' + shard.flaky + ' | ' + shard.skipped + ' | ' + shard.setupPassed + ' |'),
    '',
    '### Final failures',
    '',
    '| Test file | Test | Retries | Last error |',
    '|---|---|---:|---|',
    ...failedRows,
    '',
    '### Flaky tests',
    '',
    '| Test file | Test | Retries |',
    '|---|---|---:|---|',
    ...flakyRows,
    '',
    '> Rates are calculated from functional test outcomes only. Skipped tests and setup-project executions are excluded from rate denominators. Setup executions are reported separately.',
    '',
  ];

  const markdown = lines.join('\n');
  await writeFile(path.join(outputDir, 'summary.md'), markdown);

  if (process.env.GITHUB_STEP_SUMMARY) {
    await appendFile(process.env.GITHUB_STEP_SUMMARY, markdown);
  }

  console.log(markdown);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
