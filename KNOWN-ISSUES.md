# Known Test Findings and Run History

This file preserves failures observed during portfolio-readiness work. A finding is not deleted simply because a later public-demo run happens to pass; its current reproduction status is recorded separately.

## Latest validation

- Workflow: [#55](https://github.com/vilayatalimirza/ecommerce-playwright-framework/actions/runs/43766242370)
- Pull request: [#7](https://github.com/vilayatalimirza/ecommerce-playwright-framework/pull/7)
- Date: 15 November 2026
- Browser: Chromium
- Execution: 4 CI shards
- Workflow result: **SUCCESS**

| Functional outcome | Count |
|---|---:|
| Passed on first attempt | 90 |
| Failed after retries | 0 |
| Flaky (passed on retry) | 0 |
| Skipped | 1 |
| **Total functional outcomes** | **91** |

Four authentication setup executions also passed. They are not included in the functional totals or the pass-rate denominator.

| Functional rate | Value |
|---|---:|
| First-attempt pass rate | 100% |
| Eventual success rate | 100% |
| Flaky rate | 0% |
| Final failure rate | 0% |
| Passed outcomes with the skip included in the denominator | 98.9% |

The one skipped test is intentional: the volume-tier pricing test detects that the selected public demo product does not have tier pricing configured.

## Historical failures: runs #29 and #30

Both [run #29](https://github.com/vilayatalimirza/ecommerce-playwright-framework/actions/runs/43759189266) and [run #30](https://github.com/vilayatalimirza/ecommerce-playwright-framework/actions/runs/43760122956) recorded the same functional outcomes:

| Functional outcome | Count |
|---|---:|
| Passed on first attempt | 88 |
| Failed after retries | 2 |
| Flaky | 0 |
| Skipped | 1 |
| Authentication setup passed | 4 |

The two failures below were reproduced in both runs. Neither reproduced in run #55. Because the target is a shared public demo site, one successful run is not enough to declare the underlying behaviour permanently fixed. These remain watch-list items until they have been stable across repeated runs.

### 1. Customer address deletion navigation stalled

| Field | Observation |
|---|---|
| Test | `tests/account-management.spec.ts` — customer can delete an address card |
| Historical result | Failed in runs #29 and #30 |
| Observed behaviour | After accepting the browser confirmation, navigation remained at `/customer/addressdelete/{id}` and did not return to `/customer/addresses` before the 45-second assertion timeout |
| Current status | **Not reproduced in run #55** |
| Evidence | [Run #29](https://github.com/vilayatalimirza/ecommerce-playwright-framework/actions/runs/43759189266), [Run #30](https://github.com/vilayatalimirza/ecommerce-playwright-framework/actions/runs/43760122956), [latest run #55](https://github.com/vilayatalimirza/ecommerce-playwright-framework/actions/runs/43766242370) |

The helper now uses the browser's real delete button and confirmation dialog, and avoids waiting for navigation inside the click action. It still asserts that the browser returns to the address list and that the address card count decreases. The earlier navigation stall is retained as historical evidence.

### 2. Empty Purchase Order validation did not block checkout

| Field | Observation |
|---|---|
| Test | `tests/checkout-validation.spec.ts` — Purchase Order blocks submission when PO number is empty |
| Historical result | Failed in runs #29 and #30 |
| Observed behaviour | The test's assertion timed out because the confirmation accordion remained active after the Purchase Order number was cleared |
| Expected behaviour | Checkout should reject the empty Purchase Order number before allowing the order to reach confirmation |
| Current status | **Not reproduced in run #55** |
| Evidence | [Run #29](https://github.com/vilayatalimirza/ecommerce-playwright-framework/actions/runs/43759189266), [Run #30](https://github.com/vilayatalimirza/ecommerce-playwright-framework/actions/runs/43760122956), [latest run #55](https://github.com/vilayatalimirza/ecommerce-playwright-framework/actions/runs/43766242370) |

The checkout page object now waits for the loading indicator belonging to the active checkout step instead of using a page-wide text locator. The latest run passed the validation scenario. Continue monitoring it before claiming the application behaviour is permanently fixed.

## How to interpret the metrics

- **Passed:** functional test passed on its first attempt.
- **Flaky:** failed at least once, then passed on retry.
- **Failed:** remained unsuccessful after configured retries.
- **Skipped:** did not execute because the test explicitly detected an unavailable scenario or configuration.
- **First-attempt pass rate:** passed ÷ (passed + flaky + failed).
- **Eventual success rate:** (passed + flaky) ÷ (passed + flaky + failed).
- **Setup executions:** authentication setup runs required to prepare an authenticated session. They are reported separately and excluded from functional test rates.

Skipped tests are excluded from both pass-rate denominators. The separate “passed outcomes with the skip included” figure is a completion-inclusive ratio, not the pass-rate badge.

A workflow is successful only when the required quality checks and all CI shards complete successfully.
