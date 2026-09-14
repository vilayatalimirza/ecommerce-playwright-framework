import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Visual Regression & Accessibility Audits', () => {
  test('Captures and validates visual snapshot of header logo', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.header-logo')).toHaveScreenshot('header-logo.png');
  });

  test('Validates login page accessibility against WCAG 2A/2AA', async ({ page }) => {
    await page.goto('/login');
    const accessibilityScanResults = await new AxeBuilder({ page }).include('.customer-blocks').withTags(['wcag2a', 'wcag2aa'])
      .analyze();    
    expect(accessibilityScanResults.violations).toEqual([]);
  });
});