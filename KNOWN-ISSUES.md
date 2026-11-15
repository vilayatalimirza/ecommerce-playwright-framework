# Known Test Findings

This file records observable findings from the portfolio-readiness validation. It distinguishes target-application behaviour from automation/environment problems. Findings are not silently converted into passing tests.

## Validation run

- GitHub Actions run: [#29](https://github.com/vilayatalimirza/ecommerce-playwright-framework/actions/runs/43759189266)
- Pull request: [#7](https://github.com/vilayatalimirza/ecommerce-playwright-framework/pull/7)
- Date: 15 November 2026
- Browser: Chromium
- Execution: 4 CI shards
- Outcome: 92 passed, 2 failed, 0 flaky, 1 skipped
- First-attempt pass rate: 97.9% (92 / 94 non-skipped outcomes)
- Eventual success rate: 97.9% (92 / 94 non-skipped outcomes)

The report counts one authentication setup execution per shard. Therefore, 95 outcomes are not 95 unique business scenarios.

## Findings

### 1. Address deletion navigation does not complete

| Field | Observation |
|---|---|
| Test | `tests/account-management.spec.ts` — customer can delete an address card |
| Result | Failed after retry |
| Observed behaviour | The browser follows the Delete confirmation handler to `/customer/addressdelete/{id}`, but the navigation does not complete or return to `/customer/addresses` within 45 seconds |
| Classification | Shared demo application / endpoint availability issue is suspected; root cause is not confirmed |
| Evidence | [Run #29](https://github.com/vilayatalimirza/ecommerce-playwright-framework/actions/runs/43759189266) |

The test uses the actual browser confirmation path. It does not bypass the UI with a direct HTTP request. The failure remains visible because the application never completes the resulting navigation in the observed run.

### 2. Empty Purchase Order number allows checkout to reach confirmation

| Field | Observation |
|---|---|
| Test | `tests/checkout-validation.spec.ts` — Purchase Order blocks submission when PO number is empty |
| Result | Failed after retry |
| Observed behaviour | After clearing the Purchase Order number and continuing, the `Confirm order` accordion becomes active and its Confirm button is present |
| Expected behaviour | The empty PO number should be rejected before the order can reach confirmation |
| Classification | Potential target-application validation defect; reproduce manually before treating it as a confirmed product bug |
| Evidence | [Run #29](https://github.com/vilayatalimirza/ecommerce-playwright-framework/actions/runs/43759189266) |

The assertion is intentionally retained. Weakening it would hide the behaviour the test was written to detect.

### 3. Volume-tier pricing test is skipped by design

| Field | Observation |
|---|---|
| Test | `tests/configurable-products.spec.ts` — product detail displays volume tier pricing |
| Result | Skipped |
| Reason | The test checks whether the tier-pricing block is configured on `/fiction`; when it is absent, it calls `test.skip` with the reason “Volume tier pricing is not configured on this product in Demo Web Shop” |
| Classification | Test-data / target configuration limitation, not an automation failure |

## How to interpret the dashboard

- **Passed:** completed without needing a retry.
- **Flaky:** failed on an earlier attempt but passed on retry.
- **Failed:** remained unsuccessful after the configured retry.
- **Skipped:** did not execute because the test explicitly detected an unavailable scenario or configuration.
- **First-attempt pass rate:** passed ÷ (passed + flaky + failed).
- **Eventual success rate:** (passed + flaky) ÷ (passed + flaky + failed).

Skipped tests are excluded from both rate denominators. A failed workflow remains failed even when the eventual success rate is high.
