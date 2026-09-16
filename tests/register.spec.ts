import { test, expect } from '@playwright/test';
import { DataFactory } from '../utils/DataFactory';

test.describe('Customer Registration', () => {
  test('should successfully register a new user with dynamically generated data', async ({
    page,
  }) => {
    const newUser = DataFactory.generateUserData();
    await page.goto('/register');
    await page.getByRole('radio', { name: newUser.gender, exact: true }).check();
    await page.getByLabel('First name:').fill(newUser.firstName);
    await page.getByLabel('Last name:').fill(newUser.lastName);
    await page.getByLabel('Email:').fill(newUser.email);
    await page.getByLabel('Password:', { exact: true }).fill(newUser.password);
    await page.getByLabel('Confirm password:').fill(newUser.password);
    await page.getByRole('button', { name: 'Register' }).click();
    const resultMessage = page.locator('.result');
    await expect(resultMessage).toBeVisible();
    await expect(resultMessage).toHaveText('Your registration completed');
    await expect(page.getByRole('link', { name: newUser.email })).toBeVisible();
  });
});
