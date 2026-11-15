# Test Suite Map

The Playwright specs are physically grouped by business capability. Run one domain at a time with the matching npm script from the root package.

## Authentication — `tests/auth/`

| Spec | Coverage |
|---|---|
| `auth.setup.ts` | Creates a disposable account and stores isolated auth state |
| `auth-validation.spec.ts` | Empty/malformed login, remembered session and password recovery |
| `login.spec.ts` | Invalid login and login with the generated account |
| `register.spec.ts` | Successful customer registration |
| `registration-validation.spec.ts` | Required fields, password mismatch, short password and duplicate email |

## Catalog and product discovery — `tests/catalog/`

| Spec | Coverage |
|---|---|
| `catalog.spec.ts` | Product listing sort order |
| `compare-products.spec.ts` | Compare list add/remove/clear and comparison details |
| `configurable-products.spec.ts` | Product attributes, cart price changes and tier-pricing configuration |
| `gift-cards.spec.ts` | Virtual/physical gift-card field validation |
| `search.spec.ts`, `search-parallel.spec.ts` | Autocomplete, no-result search, advanced filters and parameterized searches |

## Cart — `tests/cart/`

| Spec | Coverage |
|---|---|
| `shopping-cart.spec.ts` | Cart badge, mini-cart, quantities, removal, coupon and gift-card errors |
| `cart-api.spec.ts` | API-assisted cart setup and UI verification |
| `cart-race-conditions.spec.ts` | Network synchronization and cart UI consistency |

## Checkout — `tests/checkout/`

| Spec | Coverage |
|---|---|
| `checkout-order.spec.ts` | Guest/authenticated orders, shipping, payment and digital products |
| `checkout-validation.spec.ts` | Terms-of-service validation, payment constraints and order-total arithmetic |
| `guest-checkout.spec.ts` | Guest checkout lifecycle |

## Customer account and orders — `tests/account/`

| Spec | Coverage |
|---|---|
| `account-management.spec.ts` | Address add/edit/delete, digital purchases and password changes |
| `authenticated-account.spec.ts` | Address book and order-history access |
| `customer-info.spec.ts` | Profile mutation/restore and logout |
| `order-management.spec.ts` | Order history, details, invoices, print and reorder |
| `wishlist.spec.ts` | Wishlist lifecycle, quantities, removal, moving to cart and sharing |

## Cross-cutting quality — `tests/quality/`

| Spec | Coverage |
|---|---|
| `global-utilities.spec.ts` | Newsletter and community poll interactions |
| `network-mock.spec.ts` | Autocomplete stubbing and simulated service failure |
| `visual-a11y.spec.ts` | Visual snapshot and axe-core WCAG 2A/2AA scan |

## Execution model

- Each test receives a new Playwright browser context.
- Guest scenarios explicitly use empty storage state.
- Authenticated scenarios use the generated storage state from the auth setup project.
- `DataFactory` creates unique account emails using UUID-backed identifiers.
- CI runs Chromium across four shards with one retry; local runs default to no retries.
- Failure/retry diagnostics include screenshots, video and traces.
- `npm run test:auth`, `test:catalog`, `test:cart`, `test:checkout`, `test:account` and `test:quality` run the matching domain.

See the root [README](../README.md) for installation, commands, CI metrics and known limitations. See [KNOWN-ISSUES.md](../KNOWN-ISSUES.md) for the latest observed finding.
