# Framework Architecture

## Test execution path

```mermaid
flowchart TD
    A["Playwright test specs"] --> B["Custom fixtures: fixtures/BaseTest.ts"]
    B --> C["Page objects: pages/"]
    B --> D["Generated data: utils/DataFactory.ts"]
    B --> E["Generated auth state: tests/auth/auth.setup.ts"]
    C --> F["Demo Web Shop UI"]
    C --> G["Playwright APIRequestContext"]
    A --> H["Network interception and axe-core"]
    F --> I["Assertions and diagnostics"]
    G --> I
    H --> I
    I --> J["JSON / Blob / HTML reports"]
    J --> K["Shard aggregation script"]
    K --> L["Metrics, badges and CI job summary"]
    K --> M["Persistent failure issue automation"]
```

## CI pipeline

```mermaid
flowchart TD
    A["Push or pull request"] --> B["Install dependencies"]
    B --> C["ESLint"]
    C --> D["TypeScript type-check"]
    D --> E["Four Chromium shards"]
    E --> F["Upload JSON and Blob artifacts"]
    F --> G["Merge reports"]
    G --> H["Aggregate business scenario metrics"]
    H --> I["Publish CI summary and report artifacts"]
    I --> J{"Push to main?"}
    J -- "Yes" --> K["Publish metrics and badges"]
    J -- "Yes, failures remain" --> M["Create or update GitHub issues"]
    J -- "No" --> L["Leave pull request evidence attached"]
```

## Responsibilities

| Component | Responsibility |
|---|---|
| `tests/` | Scenario intent and business-level assertions |
| `fixtures/BaseTest.ts` | Constructs page objects for each Playwright test |
| `pages/` | Locators and reusable UI workflows |
| `utils/DataFactory.ts` | UUID-backed disposable test identities and Faker data |
| `utils/auth-user.ts` | Reads the generated setup account without committing credentials |
| `playwright.config.ts` | Browser project, setup dependency, retries and reporters |
| `scripts/summarize-playwright-results.mjs` | Aggregates unique business tests across sharded JSON reports |
| `scripts/create-playwright-issues.mjs` | Creates or updates GitHub issues for persistent test failures |

## Isolation model

Playwright creates a new browser context for each test. Guest tests override the default storage state with an empty context. Authenticated tests use the storage state created by the setup project. The setup account and storage-state files live under `playwright/.auth/`, which is ignored by Git.

## Metric model

The headline dashboard counts unique business test scenarios by spec identity. The `setup` project is excluded from pass-rate denominators and shown separately. A scenario is classified as passed, failed, flaky or skipped. Retries do not convert a final failure into a pass.

See [KNOWN-ISSUES.md](KNOWN-ISSUES.md) for currently observed behaviour that still fails validation.
