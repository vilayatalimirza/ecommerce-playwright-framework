import { defineConfig, devices } from '@playwright/test';
import 'dotenv/config';

const isCI = process.env.CI === 'true';

export default defineConfig({
  testDir: './tests',

  // Run tests sequentially within a file to reduce state collisions
  // against the shared demo store.
  fullyParallel: false,

  // Use 2 workers locally.
  // Can be overridden with PLAYWRIGHT_WORKERS when troubleshooting.
  workers: process.env.PLAYWRIGHT_WORKERS ? Number(process.env.PLAYWRIGHT_WORKERS) : 2,

  // Retry failed tests once in CI.
  retries: isCI ? 1 : 0,

  timeout: 60_000,

  expect: {
    timeout: 40_000,
  },

  use: {
    baseURL: process.env.BASE_URL ?? 'https://demowebshop.tricentis.com',

    // Use the generated authenticated session by default.
    storageState: 'playwright/.auth/user.json',

    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',

    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },

  projects: [
    // Generate authentication state before the main test project.
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
    },

    {
      name: 'chromium',
      dependencies: ['setup'],

      use: {
        ...devices['Desktop Chrome'],
      },
    },
  ],
});
