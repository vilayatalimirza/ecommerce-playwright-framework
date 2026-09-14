import { test as setup, expect } from '@playwright/test';
import userData from '../data/users.json';

const authFile = 'playwright/.auth/user.json';  
setup('authenticate', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email:').fill(userData.validUser.email);
  await page.getByLabel('Password:').fill(userData.validUser.password);
  await page.getByRole('button', { name: 'Log in' }).click();
  await expect(page.getByRole('link', { name: 'Log out' })).toBeVisible();
  await page.context().storageState({ path: authFile });
});