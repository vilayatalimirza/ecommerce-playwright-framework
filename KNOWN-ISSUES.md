# Known Test Findings and Run History

This file preserves failures observed during portfolio-readiness work. It distinguishes a final failure, a retry-recovered flaky test, and an intentional skip. Findings are not deleted simply because a later run happens to pass.

## Latest validation

- Workflow: [#58](https://github.com/vilayatalimirza/ecommerce-playwright-framework/actions/runs/43767353876)
- Pull request: [#7](https://github.com/vilayatalimirza/ecommerce-playwright-framework/pull/7)
- Date: 15 November 2026
- Browser: Chromium
- Execution: 4 CI shards
- Workflow result: **SUCCESS WITH FLAKINESS**

| Functional outcome | Count |
|---|---:|
| Passed on first attempt | 89 |
| Flaky (failed once, passed on retry) | 1 |
| Failed after retries | 0 |
| Skipped | 1 |
| **Total functional outcomes** | **91** |

Four authentication setup executions also passed. They are not included in the functional totals or the pass-rate denominator.

| Functional rate | Value |
|---|---:|
| First-attempt pass rate | 98.9% |
| Eventual success rate | 100% |
| Flaky rate | 1.1% |
| Final failure rate | 0% |

The flaky test was the address-deletion scenario. It failed its first attempt because the address card remained on the page after the deletion action and reload, then passed on retry. The one skipped test is intentional: the volume-tier pricing test detects that the selected public demo product does not have tier pricing configured.

## Recent validation history

| Run | Passed first try | Flaky | Failed after retries | Skipped | Setup passed | First-attempt pass rate |
|---|---:|---:|---:|---:|---:|---:|
| [#29](https://github.com/vilayatalimirza/ecommerce-playwright-framework/actions/runs/43759189266) | 88 | 0 | 2 | 1 | 4 | 97.8% |
| [#30](https://github.com/vilayatalimirza/ecommerce-playwright-framework/actions/runs/43760122956) | 88 | 0 | 2 | 1 | 4 | 97.8% |
| [#55](https://github.com/vilayatalimirza/ecommerce-playwright-framework/actions/runs/43766242370) | 90 | 0 | 0 | 1 | 4 | 100% |
| [#57](https://github.com/vilayatalimirza/ecommerce-playwright-framework/actions/runs/43766907910) | 89 | 0 | 1 | 1 | 4 | 98.9% |
| [#58](https://github.com/vilayatalimirza/ecommerce-playwright-framework/actions/runs/43767353876) | 89 | 1 | 0 | 1 | 4 | 98.9% |

## Findings

### 1. Customer address deletion is intermittent

| Field | Observation |
|---|---|
| Test | `tests/account/account-management.spec.ts` — customer can delete an address card |
| Historical results | Final failure in runs #29, #30 and #57; passed cleanly in #55; flaky in #58 |
| Observed behaviour | The browser accepts the confirmation and triggers the delete flow. In run #57 the test returned to `/customer/addresses`, but the address card remained present. In run #58 the same assertion failed first time and passed on retry |
| Current status | **Intermittent; still under observation** |
| Evidence | [Run #29](https://github.com/vilayatalimirza/ecommerce-playwright-framework/actions/runs/43759189266), [#30](https://github.com/vilayatalimirza/ecommerce-playwright-framework/actions/runs/43760122956), [#55](https://github.com/vilayatalimirza/ecommerce-playwright-framework/actions/runs/43766242370), [#57](https://github.com/vilayatalimirza/ecommerce-playwright-framework/actions/runs/43766907910), [#58](https://github.com/vilayatalimirza/ecommerce-playwright-framework/actions/runs/43767353876) |

The helper uses the browser's real Delete button and confirmation dialog. It waits for the delete request, returns to the address list, and asserts that the address card is removed. The observed inconsistency could be caused by the shared demo service or the delete flow itself; the available trace does not establish a definitive root cause.

Do not count this scenario as stable based on one successful retry. Keep its first-attempt failure and retry result visible in the CI dashboard.

### 2. Empty Purchase Order validation did not block checkout in earlier runs

| Field | Observation |
|---|---|
| Test | `tests/checkout/checkout-validation.spec.ts` — Purchase Order blocks submission when PO number is empty |
| Historical result | Failed in runs #29 and #30 |
| Observed behaviour | The confirmation accordion remained active after the Purchase Order number was cleared |
| Expected behaviour | Checkout should reject the empty Purchase Order number before allowing the order to reach confirmation |
| Current status | **Not reproduced in runs #55, #57 or #58** |
| Evidence | [Run #29](https://github.com/vilayatalimirza/ecommerce-playwright-framework/actions/runs/43759189266), [#30](https://github.com/vilayatalimirza/ecommerce-playwright-framework/actions/runs/43760122956), [#55](https://github.com/vilayatalimirza/ecommerce-playwright-framework/actions/runs/43766242370), [#57](https://github.com/vilayatalimirza/ecommerce-playwright-framework/actions/runs/43766907910), [#58](https://github.com/vilayatalimirza/ecommerce-playwright-framework/actions/runs/43767353876) |

The checkout page object now waits for the loading indicator belonging to the active checkout step instead of using a page-wide text locator. The latest three validations passed this scenario. Continue monitoring it before claiming the external application's behaviour is permanently fixed.

## How to interpret the metrics

- **Passed:** functional test passed on its first attempt.
- **Flaky:** failed at least once, then passed on retry.
- **Failed:** remained unsuccessful after configured retries.
- **Skipped:** did not execute because the test explicitly detected an unavailable scenario or configuration.
- **First-attempt pass rate:** passed ÷ (passed + flaky + failed).
- **Eventual success rate:** (passed + flaky) ÷ (passed + flaky + failed).
- **Setup executions:** authentication setup runs required to prepare an authenticated session. They are reported separately and excluded from functional test rates.

Skipped tests are excluded from both pass-rate denominators. Any “completion-inclusive pass ratio” should be labelled separately because it includes skipped cases.

A successful workflow can still contain flaky tests. A flaky outcome is not counted as a first-attempt pass.
