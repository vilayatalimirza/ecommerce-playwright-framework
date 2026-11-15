import { defineConfig, devices } from '@playwright/test';
import 'dotenv/config';

const isCI = process.env.CI === 'true';
const parsedWorkers = Number(process.env.PLAYWRIGHT_WORKERS ?? 2);
const workers = Number.isInteger(parsedWorkers) && parsedWorkers > 0 ? parsedWorkers : 2;

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  workers,
  retries: isCI ? 1 : 0,
  forbidOnly: isCI,
  timeout: 60_000,

  expect: {
    timeout: 40_000,
  },

  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['blob', { outputDir: 'blob-report' }],
    [
      'json',
      {
        outputFile: process.env.PLAYWRIGHT_JSON_OUTPUT_FILE ?? 'playwright-json/results.json',
      },
    ],
  ],

  use: {
    baseURL: process.env.BASE_URL ?? 'https://demowebshop.tricentis.com',
    storageState: 'playwright/.auth/user.json',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },

  projects: [
    {
      name: 'setup',
      testMatch: /auth\\.setup\\.ts/,
      use: {
        storageState: {
          cookies: [],
          origins: [],
        },
      },
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
