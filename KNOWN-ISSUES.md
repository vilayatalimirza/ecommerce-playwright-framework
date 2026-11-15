# Known Test Findings

This file records observable findings from the latest portfolio-readiness validation. It distinguishes target-application behaviour from automation/environment problems. Findings are not silently converted into passing tests.

## Latest validation run

- GitHub Actions: [run #51](https://github.com/vilayatalimirza/ecommerce-playwright-framework/actions/runs/43764634104)
- Pull request: [#7](https://github.com/vilayatalimirza/ecommerce-playwright-framework/pull/7)
- Date: 15 November 2026
- Browser: Chromium
- CI distribution: 4 shards
- Unique business scenarios: 91
- Outcome: 89 passed, 1 failed, 0 flaky, 1 skipped
- Setup project: 4 executions, excluded from business metrics
- First-attempt pass rate: 98.9% (89 / 90 non-skipped scenarios)
- Eventual success rate: 98.9% (89 / 90 non-skipped scenarios)

The merged CI report has 95 total outcomes when the four setup-project executions are included. The business metrics exclude those infrastructure runs.

## Finding 1: Address deletion request does not remove the saved address

| Field | Observation |
|---|---|
| Test | `tests/account-management.spec.ts` — Customer can delete an address card |
| Result | Failed after retry |
| Observed behaviour | The browser accepts the Delete confirmation and issues a request to `/customer/addressdelete/{id}`. The test then returns to `/customer/addresses`, but the address card is still present |
| Expected behaviour | The selected address should be deleted and the customer address list should contain zero cards |
| Classification | Target application behaviour / demo data service issue suspected; root cause is not confirmed |
| Evidence | [Run #51](https://github.com/vilayatalimirza/ecommerce-playwright-framework/actions/runs/43764634104) |

The test uses the actual UI confirmation and observes the outgoing request. It does not bypass the application by issuing a direct HTTP request. The failure is retained because the application did not remove the address in the observed run.

## Intentional skip: Volume-tier pricing is not configured

| Field | Observation |
|---|---|
| Test | `tests/configurable-products.spec.ts` — product detail displays volume tier pricing |
| Result | Skipped |
| Reason | The test checks whether the tier-pricing block is configured on `/fiction`; when it is absent, it calls `test.skip` with the reason “Volume tier pricing is not configured on this product in Demo Web Shop” |
| Classification | Test-data / target configuration limitation, not an automation failure |

## Previously observed behaviour that did not recur in run #51

- The empty Purchase Order submission and missing Credit Card detail checks passed in run #51 after separating validation-only submissions from the success-path checkout helper.
- Digital-product checkout now supports the path that skips shipping and proceeds directly to payment.
- The old checkout “Loading next step” locator ambiguity is no longer reported in the current CI run.

These changes are kept in the branch because they are supported by the latest validation, not merely because the tests were made to pass.

## How to interpret the dashboard

- **Passed:** completed without needing a retry.
- **Flaky:** failed on an earlier attempt but passed on retry.
- **Failed:** remained unsuccessful after the configured retry.
- **Skipped:** did not execute because the test explicitly detected unavailable scenario configuration.
- **First-attempt pass rate:** passed ÷ (passed + flaky + failed).
- **Eventual success rate:** (passed + flaky) ÷ (passed + flaky + failed).

Skipped scenarios are excluded from both rate denominators. A failed workflow remains failed even when the pass percentage is high.
