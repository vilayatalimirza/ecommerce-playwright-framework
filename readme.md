# Enterprise Playwright TypeScript Automation Framework

[![Playwright Tests](https://github.com/your-org/ecommerce-playwright-framework/actions/workflows/playwright.yml/badge.svg)](https://github.com/your-org/ecommerce-playwright-framework/actions)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Playwright](https://img.shields.io/badge/Playwright-v1.40+-2EAD33?logo=playwright&logoColor=white)](https://playwright.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-LTS-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Code Style: Prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?logo=prettier&logoColor=white)](https://github.com/prettier/prettier)
[![Linting: ESLint v9](https://img.shields.io/badge/linting-eslint_v9-4B32C3?logo=eslint&logoColor=white)](https://eslint.org/)
[![Git Hooks: Husky](https://img.shields.io/badge/git_hooks-husky-brown?logo=git&logoColor=white)](https://typicode.github.io/husky/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A production-grade, hardened end-to-end (E2E) automation testing suite targeting the [Tricentis Demo Web Shop](https://demowebshop.tricentis.com/). Built on modern architectural principles, this framework implements custom test fixture dependency injection, ephemeral dynamic data generation, strict shift-left quality gates, and scoped accordion locator handling for deterministic execution across CI/CD pipelines.

---

## 📑 Table of Contents

- [Architectural Highlights](#-architectural-highlights)
- [Tech Stack](#-tech-stack)
- [Project Architecture](#-project-architecture)
- [Getting Started](#-getting-started)
- [Test Execution Matrix](#-test-execution-matrix)
- [Core Design Patterns](#-core-design-patterns)
- [Code Quality & Git Hooks](#-code-quality--git-hooks)
- [CI/CD & Observability](#-cicd--observability)

---

## 🏛️ Architectural Highlights

* **Dependency-Injected Custom Fixtures (`test.extend`):** Replaces repetitive `new PageObject(page)` boilerplate with lazily evaluated fixtures. Page Objects are instantiated and torn down automatically only when explicitly declared in test signatures.
* **Collision-Free Data Generation (`@faker-js/faker`):** Features a dynamic `DataFactory` with seed reproducibility (`FAKER_SEED`) to provision unique users, addresses, and form payloads on demand, eliminating parallel test data collisions.
* **Scoped Accordion Locators:** Resolves Playwright strict mode violations on single-page checkout flows (`#opc-billing`, `#opc-shipping`, etc.) by chaining actions within explicit DOM boundaries.
* **Zero-Sleep Synchronization:** Fully utilizes Playwright's auto-waiting actionability checks and Web-First assertions (`expect(locator).toBeVisible()`) without relying on arbitrary `waitForTimeout` calls.
* **Session Caching (`storageState`):** Uses Playwright Project Dependencies to authenticate once during a global setup routine, passing cached cookies and local storage tokens to downstream suites.
* **Hybrid UI/API Orchestration:** Pre-seeds application state (e.g., shopping cart items, address entries) through backend endpoints via `APIRequestContext`, reducing execution overhead.
* **Zero-Cost Network Fault Injection (`page.route`):** Intercepts browser-level network traffic to mock microservice outages (`HTTP 500`) and network edge cases deterministically without live server configuration.
* **Multi-Layer Quality Audits:** Incorporates automated WCAG 2.1 AA accessibility scans (`@axe-core/playwright`) alongside pixel-perfect visual regression testing (`toHaveScreenshot`).

---

## 🛠️ Tech Stack

| Category | Technology | Purpose |
| :--- | :--- | :--- |
| **Engine** | [Playwright Test](https://playwright.dev/) | Cross-browser runner communicating via native WebSocket protocols |
| **Language** | [TypeScript](https://www.typescriptlang.org/) | Strict static typing, custom interfaces, and compile-time validation |
| **Data Generation** | [@faker-js/faker](https://fakerjs.dev/) | Dynamic, seed-reproducible test data generation |
| **Linting & Formatting** | [ESLint v9](https://eslint.org/) & [Prettier](https://prettier.io/) | Flat-config static analysis, anti-pattern prevention, and unified formatting |
| **Git Hooks** | [Husky](https://typicode.github.io/husky/) & [lint-staged](https://github.com/lint-staged/lint-staged) | Shift-left pre-commit execution of linters and formatters on staged diffs |
| **Accessibility** | [@axe-core/playwright](https://github.com/dequelabs/axe-core-npm) | Automated WCAG 2.1 AA accessibility checks |
| **CI/CD** | [GitHub Actions](https://github.com/features/actions) | Matrix test orchestration, blob report merging, and trace artifact uploads |

---

## 📂 Project Architecture

```text
.
├── .github/
│   └── workflows/
│       └── playwright.yml         # GitHub Actions matrix CI/CD workflow
├── .husky/
│   └── pre-commit                 # Git hook script executing lint-staged
├── data/
│   └── users.json                 # Static credentials and fallback datasets
├── fixtures/
│   └── BaseTest.ts                # Custom fixture definitions (test.extend)
├── pages/
│   ├── CheckoutPage.ts            # Scoped One-Page Checkout (OPC) POM
│   ├── CustomerAccountPage.ts     # Customer portal, addresses, and order history POM
│   ├── LoginPage.ts               # Authentication and login navigation POM
│   └── RegisterPage.ts            # Registration form interactions and locators
├── playwright/
│   └── .auth/                     # Serialized session state files (.gitignore)
├── tests/
│   ├── auth.setup.ts              # Global authentication setup project
│   ├── authenticated-account.spec.ts # Account mutation and address book validation
│   ├── cart-api.spec.ts           # Hybrid API & UI shopping cart tests
│   ├── cart-race-condition.spec.ts# Network synchronization and event handling
│   ├── customer-info.spec.ts      # Profile verification utilizing storageState
│   ├── guest-checkout.spec.ts     # E2E unauthenticated accordion purchase flow
│   ├── login.spec.ts              # Login authentication workflows
│   ├── network-mock.spec.ts       # Network interception and error injection
│   ├── register.spec.ts           # Registration flow with dynamic data injection
│   ├── search-parallel.spec.ts    # Parameterized multi-worker catalog search
│   └── visual-a11y.spec.ts        # Visual diffing and Deque Axe accessibility audits
├── utils/
│   └── DataFactory.ts             # Faker factory with PRNG seed support
├── .env                           # Local environment variables (.gitignore)
├── .eslint.config.mjs             # ESLint v9 flat config with Playwright rules
├── .prettierrc                    # Prettier formatting rules
├── package.json                   # Project scripts and dependency declarations
├── package-lock.json              # Deterministic dependency lockfile
└── playwright.config.ts           # Framework configuration, projects, and reporting
```

---

## 🚀 Getting Started

### Prerequisites
* **Node.js**: Active LTS (`v18.x` or `v20.x+`)
* **npm**: Version `9.x+`

### 1. Installation
Clone the repository and install all dependencies:
```bash
git clone [https://github.com/your-org/ecommerce-playwright-framework.git](https://github.com/your-org/ecommerce-playwright-framework.git)
cd ecommerce-playwright-framework
npm ci
```

### 2. Browser Engine Setup
Download the required browser binaries along with OS-level dependencies:
```bash
npx playwright install --with-deps chromium
```
*(To install all supported browsers: `npx playwright install --with-deps`)*

### 3. Environment Configuration
Create a `.env` file at the root of the project:
```env
BASE_URL=[https://demowebshop.tricentis.com](https://demowebshop.tricentis.com)
CI=false
FAKER_SEED=12345
```

---

## 🧪 Test Execution Matrix

### Command Line Interface

```bash
# Run all tests across configured projects
npx playwright test

# Run tests targeting only Chromium
npx playwright test --project=chromium

# Launch interactive UI mode with time-travel inspection
npx playwright test --ui

# Run in headed mode
npx playwright test --headed

# Run a specific test suite
npx playwright test tests/guest-checkout.spec.ts

# Execute tests with custom worker concurrency
npx playwright test --workers=4

# Update visual regression comparison snapshots
npx playwright test -u

# Open the standalone HTML report
npx playwright show-report

# Inspect an execution trace archive
npx playwright show-trace playwright-report/data/<trace-id>.zip
```

---

## 🧩 Core Design Patterns

### 1. Dependency Injection via Custom Fixtures
Page Objects are registered in `fixtures/BaseTest.ts` using `base.extend<T>()`. Tests declare the exact Page Objects they require as destructured arguments, avoiding explicit class instantiations:

```typescript
// fixtures/BaseTest.ts
import { test as base, expect } from '@playwright/test';
import { CheckoutPage } from '../pages/CheckoutPage';

type MyFixtures = {
  checkoutPage: CheckoutPage;
};

export const test = base.extend<MyFixtures>({
  checkoutPage: async ({ page }, use) => {
    await use(new CheckoutPage(page));
  },
});

export { expect };
```

### 2. Scoped Container Locators (Accordion Handling)
Multi-step checkout forms often duplicate input names and button labels across collapsed accordion panes. We eliminate strict mode collisions by scoping locators to container elements:

```typescript
// pages/CheckoutPage.ts
export class CheckoutPage {
  readonly billingSection: Locator;

  constructor(page: Page) {
    this.billingSection = page.locator('#opc-billing');
  }

  async fillBillingAddress(address: BillingAddress): Promise<void> {
    await this.billingSection.getByLabel('First name:').fill(address.firstName);
    await this.billingSection.getByRole('button', { name: 'Continue' }).click();
  }
}
```

### 3. Dynamic Data Factory with PRNG Seeding
Unique user entities are generated at runtime to allow fully isolated parallel execution, while an optional seed enables exact reproduction of edge-case failures:

```typescript
// utils/DataFactory.ts
import { faker } from '@faker-js/faker';

if (process.env.FAKER_SEED) {
  faker.seed(Number(process.env.FAKER_SEED));
}

export class DataFactory {
  static generateUserData(overrides?: Partial<UserData>): UserData {
    return {
      gender: faker.helpers.arrayElement(['Male', 'Female']),
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      email: faker.internet.email({ provider: 'example.com' }).toLowerCase(),
      password: faker.internet.password({ length: 12 }),
      ...overrides,
    };
  }
}
```

---

## 🛡️ Code Quality & Git Hooks

The repository enforces formatting and static code quality rules before commits can be finalized:

* **ESLint v9 Flat Config:** Prohibits Playwright anti-patterns (e.g., `playwright/no-wait-for-timeout`, `playwright/expect-expect`) and enforces clean TypeScript practices.
* **Prettier:** Formats quotes, spacing, line widths, and semicolons consistently.
* **Husky & lint-staged:** Intercepts `git commit` and runs formatting/linting solely on staged TypeScript files, keeping commit histories clean.

```bash
# Manually run static linting
npm run lint

# Manually run automated formatting
npm run format
```

---

## 🔄 CI/CD & Observability

The GitHub Actions workflow (`.github/workflows/playwright.yml`) automates test execution on all pull requests targeting `main`.

```text
[ Push / PR ] 
      │
      ├──> [ Setup Node.js & Restore Dependency Cache ]
      ├──> [ Install Dependencies via npm ci ]
      ├──> [ Install Chromium Binary with OS Dependencies ]
      ├──> [ Run Playwright Test Suite ]
      └──> [ Upload HTML Report & Trace Artifacts (Retention: 30 Days) ]
```

### Diagnostic Tracing & Artifacts
* **Traces:** Configured with `trace: 'on-first-retry'` to record comprehensive zip archives—including DOM snapshots, console output, and network payloads—only when a test encounters an initial failure.
* **Screenshots:** Captured on failure (`screenshot: 'only-on-failure'`) and embedded directly into the HTML report for fast visual inspection.
* **CI Annotations:** Uses the `github` reporter in CI to surface assertion failures inline within the pull request diff.