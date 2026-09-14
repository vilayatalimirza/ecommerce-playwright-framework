# Enterprise Playwright TypeScript Automation Framework

[![Playwright Tests](https://github.com/your-org/ecommerce-playwright-framework/actions/workflows/playwright.yml/badge.svg)](https://github.com/your-org/ecommerce-playwright-framework/actions)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Playwright](https://img.shields.io/badge/Playwright-v1.40+-green.svg)](https://playwright.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-LTS-brightgreen.svg)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A scalable, production-grade end-to-end (E2E) testing framework targeting [Tricentis Demo Web Shop](https://demowebshop.tricentis.com/). Built from the ground up using **TypeScript** and **Playwright**, this repository demonstrates modern enterprise automation patterns designed to eliminate test flakiness, maximize execution velocity, and support continuous deployment gates.

---

## 🏛️ Architectural Highlights

Unlike legacy Selenium/WebDriver architectures relying on HTTP REST roundtrips and custom explicit wait wrappers, this framework leverages Playwright's native WebSocket protocol and browser context isolation:

* **Zero-Sleep Synchronization:** Replaces brittle `Thread.sleep` and custom polling with Playwright's native auto-waiting and Web-First assertions (`expect(locator).toBeVisible()`).
* **Process-Level Worker Isolation:** Parallel tests run across independent OS-level worker processes with dedicated V8 heaps and clean browser contexts—preventing memory leaks and static state pollution.
* **Global Session Caching (`storageState`):** Uses Playwright Project Dependencies to authenticate once during setup and inject authenticated sessions across functional suites, bypassing repetitive UI login overhead.
* **Hybrid UI/API Orchestration:** Seeds test states (such as cart contents or user sessions) via `page.request` and `APIRequestContext` before navigating, reducing end-to-end execution times by up to 70%.
* **Zero-Infrastructure Network Mocking:** Intercepts, modifies, and fulfills HTTP requests at the network layer (`page.route()`) to deterministically test backend failure states (`500 Internal Server Error`, offline services) without backend modifications.
* **Multi-Layer Quality Gates:** Incorporates automated WCAG 2.1 AA accessibility scans (`@axe-core/playwright`) and pixel-level visual regression diffing (`toHaveScreenshot`).
* **Time-Travel Triage:** Configured with `trace: 'on-first-retry'` to capture complete execution archives (DOM snapshots, network waterfall, console logs, screencast) only when a test encounters an intermittent failure.

---

## 📂 Project Structure

```text
ecommerce-playwright-framework/
├── .github/
│   └── workflows/
│       └── playwright.yml         # GitHub Actions CI pipeline configuration
├── data/
│   └── users.json                 # Externalized test credentials and datasets
├── pages/
│   └── LoginPage.ts               # Encapsulated Page Object Model classes
├── playwright/
│   └── .auth/                     # Cached session storage state artifacts (git-ignored)
├── tests/
│   ├── auth.setup.ts              # Global authentication setup project
│   ├── cart-api.spec.ts           # Standalone and hybrid UI/API tests
│   ├── cart-race-condition.spec.ts# Network synchronization and event-driven waits
│   ├── customer-info.spec.ts      # Authenticated functional regression tests
│   ├── login.spec.ts              # Authentication workflows (POM + JSON data)
│   ├── network-mock.spec.ts       # Network interception and error injection
│   ├── search-parallel.spec.ts    # Parameterized parallel catalog searches
│   └── visual-a11y.spec.ts        # Visual diffing and Deque Axe accessibility audits
├── .env                           # Environment-specific configuration (git-ignored)
├── .gitignore                     # Git exclusion rules
├── package.json                   # Dependencies, dev tooling, and execution scripts
├── package-lock.json              # Deterministic dependency lockfile
└── playwright.config.ts           # Central framework runtime configuration
```

---

## ⚙️ Prerequisites

* **Node.js**: Active LTS version (`v18.x` or `v20.x+`)
* **npm**: Version `9.x+` (bundled with Node.js)
* **Operating System**: macOS, Linux, or Windows (WSL2 recommended)

---

## 🚀 Getting Started

### 1. Clone the Repository
```bash
git clone [https://github.com/your-org/ecommerce-playwright-framework.git](https://github.com/your-org/ecommerce-playwright-framework.git)
cd ecommerce-playwright-framework
```

### 2. Install Dependencies
Run a clean install to match the exact dependency lockfile:
```bash
npm ci
```

### 3. Install Browser Binaries
Install the required browser binaries along with system dependencies:
```bash
npx playwright install --with-deps chromium
```

*(Optional: Run `npx playwright install --with-deps` without arguments to install Firefox and WebKit as well).*

### 4. Configure Environment Variables
Create a `.env` file at the project root:
```env
BASE_URL=[https://demowebshop.tricentis.com](https://demowebshop.tricentis.com)
CI=false
```

---

## 🧪 Test Execution

### Common CLI Commands

| Command | Purpose |
| :--- | :--- |
| `npx playwright test` | Executes all test suites across configured browser projects |
| `npx playwright test --project=chromium` | Runs tests exclusively against the Chromium engine |
| `npx playwright test --ui` | Launches Playwright Interactive UI Mode with time-travel debugging |
| `npx playwright test --headed` | Runs tests in a visible browser window |
| `npx playwright test --debug` | Opens the Playwright Inspector for step-by-step execution |
| `npx playwright test tests/login.spec.ts` | Runs a targeted spec file |
| `npx playwright test --workers=3` | Overrides worker allocation for local parallel execution |
| `npx playwright test -u` | Updates visual regression baseline snapshots (`--update-snapshots`) |
| `npx playwright show-report` | Serves the generated HTML report locally |
| `npx playwright show-trace <trace-zip>` | Opens the execution trace archive in the Trace Viewer |

---

## 🧩 Architectural Design Patterns

### 1. Page Object Model (POM) Without Stale Elements
Page Objects define `readonly Locator` properties in the constructor. Because Playwright locators are lazy queries evaluated only at action dispatch time, elements are dynamically re-queried, eliminating `StaleElementReferenceException`s:

```typescript
// pages/LoginPage.ts
import { Page, Locator } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly errorMessage: Locator;
  private readonly loginLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByLabel('Email:');
    this.passwordInput = page.getByLabel('Password:');
    this.loginButton = page.getByRole('button', { name: 'Log in' });
    this.errorMessage = page.locator('.validation-summary-errors');
    this.loginLink = page.getByRole('link', { name: 'Log in' });
  }

  async navigate(): Promise<void> {
    await this.page.goto('/');
    await this.loginLink.click();
  }

  async login(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }
}
```

### 2. Session Management via Project Dependencies
Authentication runs once via `auth.setup.ts`, outputting a serialized JSON session. Downstream browser projects declare a dependency on `setup` and consume this snapshot directly:

```typescript
// playwright.config.ts (Excerpt)
projects: [
  {
    name: 'setup',
    testMatch: /\.setup\.ts$/,
  },
  {
    name: 'chromium',
    use: {
      ...devices['Desktop Chrome'],
      storageState: 'playwright/.auth/user.json',
    },
    dependencies: ['setup'],
  },
]
```

### 3. Network Interception and Fault Injection
Tests modify browser-level network traffic using `page.route()` to validate frontend failure handling without requiring backend intervention:

```typescript
// tests/network-mock.spec.ts (Excerpt)
await page.route('**/addproducttocart/**', async (route) => {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      success: false,
      message: 'Inventory service is offline.',
    }),
  });
});
```

---

## 🔄 Continuous Integration (CI/CD) Pipeline

The framework is pre-configured for GitHub Actions via `.github/workflows/playwright.yml`.

### Pipeline Characteristics
* **Trigger Gates:** Runs on every `push` and `pull_request` targeting the `main` branch.
* **Deterministic Installation:** Uses `npm ci` paired with GitHub Actions dependency caching.
* **Targeted Browser Installation:** Limits binary installation to `chromium` to minimize container provisioning time.
* **Failure Diagnostics:** Uploads test reports as artifacts retained for 30 days using `if: ${{ !cancelled() }}`.

```yaml
name: Playwright Tests
on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    timeout-minutes: 60
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: lts/*
          cache: 'npm'
      - name: Install dependencies
        run: npm ci
      - name: Install Playwright Browsers
        run: npx playwright install --with-deps chromium
      - name: Run Playwright tests
        run: npx playwright test --project=chromium
      - uses: actions/upload-artifact@v4
        if: ${{ !cancelled() }}
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30
```

---

## 📊 Reporting & Diagnostics

The framework outputs a multi-tier reporting suite on every run:
1. **HTML Reporter (`playwright-report/`):** Self-contained, interactive dashboard displaying execution metadata, failure steps, embedded screenshots, and downloadable trace bundles.
2. **List Reporter:** Real-time, streamlined terminal output during execution.
3. **GitHub Annotations:** Automatically maps assertion failures directly onto the pull request diff when running in CI.

To inspect a failure trace locally:
```bash
npx playwright show-trace playwright-report/data/<trace-id>.zip
```

---

## 🛡️ Coding Standards & Guidelines

* **Locators:** Prioritize accessible, user-facing locators (`getByRole`, `getByLabel`, `getByPlaceholder`) over CSS or XPath selectors.
* **Assertions:** Exclusively use auto-retrying Web-First assertions (`await expect(locator)...`). Avoid hardcoded timeouts (`page.waitForTimeout()`).
* **Encapsulation:** Never expose raw selectors inside `*.spec.ts` files. All page locators must remain encapsulated inside `pages/` Page Objects.
* **Data Independence:** Isolate test execution by seeding required preconditions using API fixtures (`page.request`) or ephemeral data factories to prevent parallel state collisions.