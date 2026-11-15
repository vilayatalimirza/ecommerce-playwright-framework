# Test Suite Map

This directory is kept intentionally simple, but the specs are grouped here by business capability so a reviewer can navigate the coverage without guessing from filenames.

## Authentication

| Spec | What it covers |
|---|---|
| `auth-validation.spec.ts` | Empty/malformed login, remembered session state and password recovery |
| `login.spec.ts` | Invalid login and login using the disposable account created by setup |
| `register.spec.ts` | Successful customer registration |
| `registration-validation.spec.ts` | Required fields, password mismatch, short password and duplicate email |

`auth.setup.ts` is the Playwright setup project. It creates a disposable account and saves isolated browser state and credentials under the ignored `playwright/.auth/` directory.

## Catalog and product discovery

| Spec | What it covers |
|---|---|
| `catalog.spec.ts` | Product listing sort order |
| `configurable-products.spec.ts` | Product attributes, price changes and unavailable tier-pricing configuration |
| `compare-products.spec.ts` | Compare list add/remove/clear and side-by-side product details |
| `gift-cards.spec.ts` | Virtual/physical gift-card field validation |
| `search.spec.ts`, `search-parallel.spec.ts` | Autocomplete, exact/no-result searches, advanced filters and parameterized searches |
| `wishlist.spec.ts` | Wishlist lifecycle, quantities, removal, moving to cart and sharing |

## Cart

| Spec | What it covers |
|---|---|
| `shopping-cart.spec.ts` | Cart badge, mini-cart, quantities, removal and coupon/gift-card errors |
| `cart-api.spec.ts` | API-assisted cart setup and UI verification |
| `cart-race-conditions.spec.ts` | Network synchronization and cart UI consistency |

## Checkout

| Spec | What it covers |
|---|---|
| `checkout-order.spec.ts` | Guest/authenticated order flows, shipping, payment and digital products |
| `guest-checkout.spec.ts` | Guest checkout lifecycle |
| `checkout-validation.spec.ts` | Terms-of-service validation, payment constraints and order-total arithmetic |

## Customer account and orders

| Spec | What it covers |
|---|---|
| `account-management.spec.ts` | Address add/edit/delete, digital purchases and password changes |
| `authenticated-account.spec.ts` | Address book and order-history access with the setup account |
| `customer-info.spec.ts` | Profile mutation/restore and logout |
| `order-management.spec.ts` | Order history, details, invoices, print and reorder |

## Cross-cutting quality

| Spec | What it covers |
|---|---|
| `global-utilities.spec.ts` | Newsletter and community poll interactions |
| `network-mock.spec.ts` | Autocomplete stubbing and simulated service failure |
| `visual-a11y.spec.ts` | Visual snapshot and axe-core WCAG 2A/2AA scan |

## Execution model

- Every test receives a new Playwright browser context.
- Guest scenarios explicitly use empty storage state.
- Authenticated scenarios use the setup project's generated storage state.
- DataFactory creates unique account emails using UUID-based identifiers.
- CI runs Chromium across four shards with one retry; local runs default to no retries.
- On failure/retry, screenshots, video and traces are retained by Playwright.

See the root [README](../README.md) for setup commands, CI metrics and the known limitations. See [KNOWN-ISSUES.md](../KNOWN-ISSUES.md) for the latest reproducible findings.
