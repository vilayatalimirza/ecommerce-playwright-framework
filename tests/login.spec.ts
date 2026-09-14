import { expect, test } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage'; 
import users from '../data/users.json';


test.describe('Authentication Tests', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.navigate();
  });

  test('Displays error message when logging in with invalid credentials', async () => {
    await loginPage.login(
      users.invalidUser.email,
      users.invalidUser.password
    );

    // Assert using the encapsulated errorMessage locator
    await expect(loginPage.errorMessage).toBeVisible();
    await expect(loginPage.errorMessage).toContainText('Login was unsuccessful');
  });

  test('User can log in with valid credentials', async ({ page }) => {
    await loginPage.login(
      users.validUser.email,
      users.validUser.password
    );

    await expect(page).toHaveURL(/.*demowebshop.*/);
    await expect(page.getByRole('link', { name: 'Log out' })).toBeVisible();
    await expect(page.getByRole('link', { name: users.validUser.email })).toBeVisible();
  });
});