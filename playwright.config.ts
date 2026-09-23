import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  /* 1. Run tests sequentially per file to avoid thread collisions on the demo store */
  fullyParallel: false,

  /* 2. Cap workers to 2 (or 1 during local troubleshooting) */
  workers: 2,

  /* 3. Increase test timeout to 60s for multi-step checkout/account flows */
  timeout: 60_000,

  /* 4. Increase assertion timeout to 10s for slow AJAX updates */
  expect: {
    timeout: 40_000,
  },

  use: {
    baseURL: 'https://demowebshop.tricentis.com',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    /* 5. Wait for DOM content rather than full networkidle to avoid hanging */
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
