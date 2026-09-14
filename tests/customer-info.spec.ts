import { expect, test } from '@playwright/test';
import userData from '../data/users.json';

test.describe('Customer Account Management', () => {
  test('loads customer profile using authenticated storage state', async ({ page }) => {
    await page.goto('/customer/info');
    await expect(page).toHaveURL('/customer/info');
    await expect(
      page.getByRole('heading', { name: /customer info/i })
    ).toBeVisible();
    await expect(page.getByLabel('Email:')).toHaveValue(userData.validUser.email);
  });
});