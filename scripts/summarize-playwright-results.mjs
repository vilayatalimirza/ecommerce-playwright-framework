import { appendFile, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const reportDir = process.env.PLAYWRIGHT_JSON_DIR ?? 'playwright-json';
const metricsDir = process.env.METRICS_DIR ?? 'metrics';
const outputDir = process.env.CI_REPORT_DIR ?? 'ci-report';
const ansiCodePattern = new RegExp(String.fromCharCode(27) + '\\[[0-9;]*m', 'g');

const runId = process.env.GITHUB_RUN_ID ?? 'local';
const runNumber = Number(process.env.GITHUB_RUN_NUMBER ?? 0);
const repository = process.env.GITHUB_REPOSITORY ?? 'vilayatalimirza/ecommerce-playwright-framework';
const serverUrl = process.env.GITHUB_SERVER_URL ?? 'https://github.com';
const commitSha = process.env.GITHUB_SHA ?? 'unknown';
const branch = process.env.GITHUB_REF_NAME ?? 'local';
const runUrl = runId === 'local' ? null : serverUrl + '/' + repository + '/actions/runs/' + runId;

const emptyCounts = () => ({ passed: 0, failed: 0, flaky: 0, skipped: 0 });

function addCounts(target, source) {
  for (const key of Object.keys(target)) target[key] += Number(source[key] ?? 0);
}

function percentage(numerator, denominator) {
  return denominator === 0 ? null : Number(((numerator / denominator) * 100).toFixed(1));
}

function countStatuses(items) {
  const counts = emptyCounts();
  for (const item of items) {
    if (Object.hasOwn(counts, item.status)) counts[item.status] += 1;
  }
  return counts;
}

function testIdentity(test) {
  return [test.file, test.line ?? '', test.title, test.project].join('|');
}

function escapeMarkdown(value) {
  return String(value ?? '').replaceAll('|', '\\|').replaceAll('\n', ' ');
}

function collectTests(suites, inheritedFile = '') {
  const collected = [];
  const statuses = { expected: 'passed', unexpected: 'failed', flaky: 'flaky', skipped: 'skipped' };

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
          status: statuses[test.status] ?? 'unknown',
          retries: Math.max(0, attempts.length - 1),
          durationMs: Number(lastAttempt.duration ?? 0),
          error: String(error)
            .replace(ansiCodePattern, '')
            .replace(/\r/g, '')
            .slice(0, 1600),
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
    .filter((name) => /^results-\d+\.json$/i.test(name))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  if (files.length === 0) {
    throw new Error('No shard JSON reports (results-<shard>.json) found in ' + reportDir);
  }

  const shards = [];
  const allTests = [];

  for (const file of files) {
    const report = JSON.parse(await readFile(path.join(reportDir, file), 'utf8'));
    const shardTests = collectTests(report.suites);
    const businessTests = shardTests.filter((test) => test.project !== 'setup');
    const setupExecutions = shardTests.filter((test) => test.project === 'setup').length;
    const shardCounts = countStatuses(businessTests);

    shards.push({
      shard: file.replace(/^results-/, '').replace(/\.json$/i, ''),
      ...shardCounts,
      setupExecutions,
    });
    allTests.push(...shardTests);
  }

  // Exclude setup-project runs and deduplicate by spec identity. This reports business
  // test cases rather than repeated infrastructure setup or shard executions.
  const uniqueBusinessTests = [
    ...new Map(
      allTests
        .filter((test) => test.project !== 'setup')
        .map((test) => [testIdentity(test), test]),
    ).values(),
  ];
  const setupProjectExecutions = allTests.filter((test) => test.project === 'setup').length;
  const counts = countStatuses(uniqueBusinessTests);
  const totalScenarios = uniqueBusinessTests.length;
  const attempted = counts.passed + counts.failed + counts.flaky;
  const totalTestOutcomes = attempted + counts.skipped;
  const totalOutcomesIncludingSetup = totalTestOutcomes + setupProjectExecutions;
  const firstAttemptPassRate = percentage(counts.passed, attempted);
  const eventualSuccessRate = percentage(counts.passed + counts.flaky, attempted);
  const flakyRate = percentage(counts.flaky, attempted);
  const finalFailureRate = percentage(counts.failed, attempted);
  const failures = uniqueBusinessTests.filter((test) => test.status === 'failed');
  const flakyTests = uniqueBusinessTests.filter((test) => test.status === 'flaky');
  const generatedAt = new Date().toISOString();

  const metrics = {
    schemaVersion: 1,
    generatedAt,
    source: 'Playwright JSON reporter, aggregated from CI shards',
    run: {
      id: runId,
      number: runNumber || null,
      url: runUrl,
      branch,
      commit: commitSha,
    },
    shardCount: files.length,
    totalScenarios,
    totalTestOutcomes,
    setupProjectExecutions,
    totalOutcomesIncludingSetup,
    counts,
    rates: {
      firstAttemptPassRate,
      eventualSuccessRate,
      flakyRate,
      finalFailureRate,
      denominator: attempted,
      skippedExcluded: true,
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
    commit: commitSha,
    counts,
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
    'failed.json': makeBadge('failed after retries', String(counts.failed), counts.failed === 0 ? 'brightgreen' : 'red'),
    'flaky.json': makeBadge('flaky', String(counts.flaky), counts.flaky === 0 ? 'brightgreen' : 'yellow'),
    'total-scenarios.json': makeBadge('business scenarios', String(totalScenarios), 'blue'),
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
      ? '**Workflow:** Run #' + runNumber + ' · Branch: ' + branch + ' · Commit: ' + commitSha.slice(0, 7)
      : '**Workflow:** Local report aggregation',
    '',
    '**Overall result:** ' + (counts.failed > 0 ? 'FAILED' : counts.flaky > 0 ? 'PASSED WITH FLAKINESS' : 'PASSED'),
    '',
    '| Outcome | Count |',
    '|---|---:|',
    '| Passed on first attempt | ' + counts.passed + ' |',
    '| Failed after retries | ' + counts.failed + ' |',
    '| Flaky (passed on retry) | ' + counts.flaky + ' |',
    '| Skipped | ' + counts.skipped + ' |',
    '| **Business test scenarios** | **' + totalScenarios + '** |',
    '| **Business test outcomes** | **' + totalTestOutcomes + '** |',
    '| Setup project executions (excluded) | ' + setupProjectExecutions + ' |',
    '| Total outcomes including setup | ' + totalOutcomesIncludingSetup + ' |',
    '',
    '| Rate | Value |',
    '|---|---:|',
    '| First-attempt pass rate | ' + (firstAttemptPassRate === null ? 'n/a' : firstAttemptPassRate + '%') + ' |',
    '| Eventual success rate | ' + (eventualSuccessRate === null ? 'n/a' : eventualSuccessRate + '%') + ' |',
    '| Flaky rate | ' + (flakyRate === null ? 'n/a' : flakyRate + '%') + ' |',
    '| Final failure rate | ' + (finalFailureRate === null ? 'n/a' : finalFailureRate + '%') + ' |',
    '',
    '**Shards:** ' + files.length,
    '',
    '| Shard | Passed | Failed | Flaky | Skipped | Setup runs |',
    '|---:|---:|---:|---:|---:|---:|',
    ...shards.map((shard) => '| ' + shard.shard + ' | ' + shard.passed + ' | ' + shard.failed + ' | ' + shard.flaky + ' | ' + shard.skipped + ' | ' + shard.setupExecutions + ' |'),
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
    '> Business scenario metrics deduplicate by spec identity and exclude setup-project executions. Skipped scenarios are excluded from pass-rate denominators. Setup executions are displayed separately.'
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
