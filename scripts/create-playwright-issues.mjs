import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const REPORT_DIR =
  process.env.PLAYWRIGHT_JSON_DIR ?? 'playwright-json';

const repository = process.env.GITHUB_REPOSITORY;
const serverUrl =
  process.env.GITHUB_SERVER_URL ?? 'https://github.com';
const runId = process.env.GITHUB_RUN_ID;
const commitSha = process.env.GITHUB_SHA;
const branch =
  process.env.GITHUB_REF_NAME ?? 'unknown';

const dryRun = process.env.DRY_RUN === 'true';

const projectOwner =
  process.env.BUG_TRACKER_PROJECT_OWNER ??
  'vilayatalimirza';

const projectNumber =
  process.env.BUG_TRACKER_PROJECT_NUMBER ??
  '1';

const projectTitle =
  process.env.BUG_TRACKER_PROJECT_TITLE ??
  'Bug Tracker';

const bugStatus =
  process.env.BUG_TRACKER_STATUS ??
  'To triage';

const bugPriority =
  process.env.BUG_TRACKER_PRIORITY ?? '';

if (!repository && !dryRun) {
  throw new Error(
    'GITHUB_REPOSITORY is not available.',
  );
}

const GH_CLI_PATH =
  process.platform === 'win32'
    ? String.raw`C:\Program Files\GitHub CLI\gh.exe`
    : '/usr/bin/gh';

function runGh(args) {
  return execFileSync(GH_CLI_PATH, args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

function stripAnsi(value) {
  if (!value) {
    return '';
  }
  // eslint-disable-next-line no-control-regex
  const ansiEscape = /\x1b\[[0-9;]*[A-Za-z]/g;
  return String(value).replace(ansiEscape, '');
}

function truncate(value, maxLength = 5000) {
  const cleanValue = stripAnsi(value);

  if (!cleanValue) {
    return '';
  }

  return cleanValue.length > maxLength
    ? `${cleanValue.slice(0, maxLength)}\n...[truncated]`
    : cleanValue;
}

function formatOutput(value) {
  if (!value) {
    return '';
  }

  if (Array.isArray(value)) {
    return value
      .map((entry) => {
        if (typeof entry === 'string') {
          return entry;
        }

        return JSON.stringify(entry);
      })
      .join('\n');
  }

  return String(value);
}

function getSuiteTitles(suite, parentTitles) {
  const title = suite.title?.trim();

  return title
    ? [...parentTitles, title]
    : parentTitles;
}

function createFailureFromTest(
  spec,
  test,
  suiteTitles,
  file,
) {
  const results = test.results ?? [];
  const finalResult = results.at(-1);

  if (
    !finalResult ||
    !['failed', 'timedOut'].includes(
      finalResult.status,
    )
  ) {
    return null;
  }

  return {
    title: spec.title.replace(/\[@[^\]]+\]\s*$/, '').trimEnd(),
    suite: suiteTitles.join(' › '),
    titlePath: [...suiteTitles, spec.title],
    file,
    line: spec.line,
    column: spec.column,
    projectName:
      test.projectName ?? 'chromium',
    status: finalResult.status,
    duration: finalResult.duration ?? 0,
    retryCount: Math.max(
      0,
      results.length - 1,
    ),
    retry: finalResult.retry ?? 0,
    workerIndex:
      finalResult.workerIndex ?? 'N/A',
    parallelIndex:
      finalResult.parallelIndex ?? 'N/A',
    errors: finalResult.errors ?? [],
    stdout: formatOutput(
      finalResult.stdout,
    ),
    stderr: formatOutput(
      finalResult.stderr,
    ),
    attachments:
      finalResult.attachments ?? [],
  };
}

function collectFailedTests(
  suites,
  parentTitles = [],
  inheritedFile = '',
) {
  return (suites ?? []).flatMap((suite) => {
    const suiteTitles = getSuiteTitles(
      suite,
      parentTitles,
    );

    const file =
      suite.file ?? inheritedFile;

    const currentFailures = (
      suite.specs ?? []
    )
      .flatMap((spec) =>
        (spec.tests ?? [])
          .map((test) =>
            createFailureFromTest(
              spec,
              test,
              suiteTitles,
              file,
            ),
          )
          .filter(Boolean),
      );

    const nestedFailures =
      collectFailedTests(
        suite.suites,
        suiteTitles,
        file,
      );

    return [
      ...currentFailures,
      ...nestedFailures,
    ];
  });
}

function createFingerprint(failure) {
  const source = [
    failure.file,
    failure.line ?? '',
    failure.column ?? '',
    failure.projectName,
    failure.titlePath.join(' › '),
  ].join('|');

  return createHash('sha256')
    .update(source)
    .digest('hex')
    .slice(0, 16);
}

function getWorkflowUrl() {
  if (!repository) {
    return null;
  }

  if (!runId) {
    return `${serverUrl}/${repository}/actions`;
  }

  return `${serverUrl}/${repository}/actions/runs/${runId}`;
}

function getSourceUrl(failure) {
  if (!repository || !failure.file || !commitSha) {
    return null;
  }

  const cleanFile = failure.file
  .replaceAll('\\', '/')
  .replace(/^\.\//, '');

  const repositoryFile = cleanFile.startsWith('tests/')
    ? cleanFile
    : `tests/${cleanFile}`;

  const lineAnchor = failure.line
    ? `#L${failure.line}`
    : '';

  return `${serverUrl}/${repository}/blob/${commitSha}/${repositoryFile}${lineAnchor}`;
}

function getReproductionCommand(failure) {
  if (!failure.file) {
    return null;
  }

  const line = failure.line
    ? `:${failure.line}`
    : '';

  return `npx playwright test ${failure.file}${line} --project=${failure.projectName}`;
}

function buildErrorDetails(failure) {
  if (!failure.errors.length) {
    return 'No structured error information was provided by Playwright.';
  }

  return failure.errors
    .map((error, index) => {
      const message =
        error.message ??
        'No error message available.';

      const stack = error.stack ?? '';

      return [
        `### Error ${index + 1}`,
        '',
        '```text',
        truncate(message, 4000),
        '```',
        '',
        stack
          ? [
              '### Stack Trace',
              '',
              '```text',
              truncate(stack, 7000),
              '```',
            ].join('\n')
          : '',
      ]
        .filter(Boolean)
        .join('\n');
    })
    .join('\n\n');
}

function buildIssueBody(
  failure,
  fingerprint,
) {
  const workflowUrl = getWorkflowUrl();
  const sourceUrl = getSourceUrl(failure);
  const reproductionCommand =
    getReproductionCommand(failure);

  const attachmentNames =
    failure.attachments
      .map((attachment) => attachment.name)
      .filter(Boolean);

  const stdout = truncate(
    failure.stdout,
    3000,
  );

  const stderr = truncate(
    failure.stderr,
    3000,
  );

  return [
    '<!-- automated-playwright-failure -->',
    `<!-- playwright-fingerprint: ${fingerprint} -->`,
    '',
    '# Automated Playwright Test Failure',
    '',
    'This bug was automatically created from a Playwright test that remained failed after retry.',
    '',
    '## Test Details',
    '',
    '| Field | Value |',
    '|---|---|',
    `| Test | ${failure.title} |`,
    `| Suite | ${failure.suite || 'N/A'} |`,
    `| Spec | \`${failure.file || 'N/A'}\` |`,
    `| Line | ${failure.line ?? 'N/A'} |`,
    `| Column | ${failure.column ?? 'N/A'} |`,
    `| Playwright Project | ${failure.projectName} |`,
    `| Final Status | ${failure.status} |`,
    `| Duration | ${failure.duration} ms |`,
    `| Retries | ${failure.retryCount} |`,
    `| Worker | ${failure.workerIndex} |`,
    `| Parallel Index | ${failure.parallelIndex} |`,
    `| Branch | ${branch} |`,
    `| Commit | \`${commitSha ?? 'N/A'}\` |`,
    `| Base URL | ${process.env.BASE_URL ?? 'N/A'} |`,
    `| Node.js | ${process.version} |`,
    '',
    '## Failure Details',
    '',
    buildErrorDetails(failure),
    '',
    stdout
      ? [
          '## Standard Output',
          '',
          '```text',
          stdout,
          '```',
        ].join('\n')
      : '',
    '',
    stderr
      ? [
          '## Standard Error',
          '',
          '```text',
          stderr,
          '```',
        ].join('\n')
      : '',
    '',
    attachmentNames.length
      ? [
          '## Captured Test Attachments',
          '',
          'The following artifacts were captured by Playwright and are available through the workflow artifacts:',
          '',
          ...attachmentNames.map(
            (name) => `- \`${name}\``,
          ),
        ].join('\n')
      : '',
    '',
    reproductionCommand
      ? [
          '## Local Reproduction',
          '',
          '```bash',
          reproductionCommand,
          '```',
        ].join('\n')
      : '',
    '',
    '## CI Information',
    '',
    workflowUrl
      ? `- [Open workflow run](${workflowUrl})`
      : '- Workflow URL unavailable.',
    sourceUrl
      ? `- [Open failing test in source](${sourceUrl})`
      : '- Source link unavailable.',
    '',
    '## Investigation Guidance',
    '',
    '- Reproduce the failure locally.',
    '- Review the Playwright HTML report.',
    '- Review trace, screenshot, and video artifacts when available.',
    '- Determine whether the root cause is a product defect, automation defect, environment issue, or flaky test.',
    '',
    `**Failure Fingerprint:** \`${fingerprint}\``,
  ]
    .filter(Boolean)
    .join('\n');
}

function findExistingIssue(fingerprint) {
  const searchQuery =
    `"playwright-fingerprint: ${fingerprint}" in:body`;

  const output = runGh([
    'issue',
    'list',
    '--repo',
    repository,
    '--state',
    'open',
    '--search',
    searchQuery,
    '--limit',
    '1',
    '--json',
    'number,url,title',
  ]);

  if (!output) {
    return null;
  }

  const issues = JSON.parse(output);

  return issues.length > 0
    ? issues[0]
    : null;
}

function createIssue(
  failure,
  fingerprint,
) {
  const title =
    `[Playwright Failure] ${failure.title}`;

  const body = buildIssueBody(
    failure,
    fingerprint,
  );

  return runGh([
    'issue',
    'create',
    '--repo',
    repository,
    '--title',
    title,
    '--body',
    body,
    '--label',
    'bug',
    '--project',
    projectTitle,
  ]);
}

function addFailureComment(
  issueNumber,
  failure,
  fingerprint,
) {
  const workflowUrl = getWorkflowUrl();

  const body = [
    `## Recurring Failure — ${new Date().toISOString()}`,
    '',
    'The same automated test failed again.',
    '',
    `- Workflow: ${workflowUrl ?? 'N/A'}`,
    `- Branch: ${branch}`,
    `- Commit: \`${commitSha ?? 'N/A'}\``,
    `- Status: ${failure.status}`,
    `- Retries: ${failure.retryCount}`,
    `- Fingerprint: \`${fingerprint}\``,
    '',
    '### Latest Error',
    '',
    '```text',
    truncate(
      failure.errors[0]?.message ??
        'No structured error message.',
      4000,
    ),
    '```',
  ].join('\n');

  runGh([
    'issue',
    'comment',
    String(issueNumber),
    '--repo',
    repository,
    '--body',
    body,
  ]);
}

function configureProjectItem(
  issueUrl,
) {
  runGh([
    'project',
    'item-edit',
    projectNumber,
    '--owner',
    projectOwner,
    '--url',
    issueUrl,
    '--field',
    'Status',
    '--value',
    bugStatus,
  ]);

  if (!bugPriority) {
    return;
  }

  runGh([
    'project',
    'item-edit',
    projectNumber,
    '--owner',
    projectOwner,
    '--url',
    issueUrl,
    '--field',
    'Priority',
    '--value',
    bugPriority,
  ]);
}

async function loadJsonReports() {
  let entries;

  try {
    entries = await readdir(REPORT_DIR);
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log(
        `Report directory "${REPORT_DIR}" does not exist. Nothing to process.`,
      );

      return [];
    }

    throw error;
  }

  const files = entries
    .filter((entry) =>
      entry.endsWith('.json'),
    )
    .map((entry) =>
      path.join(REPORT_DIR, entry),
    );

  if (files.length === 0) {
    console.log(
      `No JSON reports found in "${REPORT_DIR}".`,
    );

    return [];
  }

  const failures = [];

  for (const file of files) {
    console.log(`Reading ${file}`);

    const report = JSON.parse(
      await readFile(file, 'utf8'),
    );

    failures.push(
      ...collectFailedTests(
        report.suites,
      ),
    );
  }

  return failures;
}

function printDryRunFailure(
  failure,
  fingerprint,
) {
  console.log('');
  console.log(
    '========== DRY RUN =========='
  );
  console.log(`Test: ${failure.title}`);
  console.log(`Suite: ${failure.suite}`);
  console.log(`Spec: ${failure.file}`);
  console.log(`Line: ${failure.line ?? 'N/A'}`);
  console.log(
    `Project: ${failure.projectName}`,
  );
  console.log(`Status: ${failure.status}`);
  console.log(
    `Retries: ${failure.retryCount}`,
  );
  console.log(
    `Fingerprint: ${fingerprint}`,
  );
  console.log(
    `Would add to project: ${projectTitle} #${projectNumber}`,
  );
  console.log(
    `Would set status: ${bugStatus}`,
  );
  console.log(
    `Priority: ${bugPriority || 'not set'}`,
  );
  console.log(
    '============================='
  );
}

async function main() {
  const allFailures =
    await loadJsonReports();

  // Multiple CI shards can report the same test failure.
  // Deduplicate them before creating/updating GitHub issues.
  const failures = [
    ...new Map(
      allFailures.map((failure) => [
        createFingerprint(failure),
        failure,
      ]),
    ).values(),
  ];

  console.log(
    `Found ${allFailures.length} failure report entries.`,
  );

  console.log(
    `Found ${failures.length} unique persistent Playwright failure(s).`,
  );

  for (const failure of failures) {
    const fingerprint =
      createFingerprint(failure);

    if (dryRun) {
      printDryRunFailure(
        failure,
        fingerprint,
      );

      continue;
    }

    const existingIssue =
      findExistingIssue(fingerprint);

    if (existingIssue) {
      console.log(
        `Existing issue #${existingIssue.number} found for "${failure.title}".`,
      );

      addFailureComment(
        existingIssue.number,
        failure,
        fingerprint,
      );

      continue;
    }

    const issueUrl =
      createIssue(
        failure,
        fingerprint,
      );

    console.log(
      `Created issue for "${failure.title}": ${issueUrl}`,
    );

    configureProjectItem(issueUrl);

    console.log(
      `Added issue to ${projectTitle} #${projectNumber} with status "${bugStatus}".`,
    );
  }
}

try {
  await main();
} catch (error) {
  console.error(error);
  process.exitCode = 1;
}