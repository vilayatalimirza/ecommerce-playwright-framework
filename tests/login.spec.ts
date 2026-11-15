import { test, expect } from '../fixtures/BaseTest';
import { loadAuthUser } from '../utils/auth-user';

test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Authentication Tests', () => {
  test('Displays error message when logging in with invalid credentials', async ({
    loginPage,
  }) => {
    await loginPage.navigate();
    await loginPage.login('not-a-real-user@qa-automation-test.invalid', 'DefinitelyWrong123!');

    await expect(loginPage.errorMessage).toBeVisible();
    await expect(loginPage.errorMessage).toContainText('Login was unsuccessful');
  });

  test('User can log in with the disposable account created by setup', async ({
    page,
    loginPage,
  }) => {
    const user = await loadAuthUser();

    await loginPage.navigate();
    await loginPage.login(user.email, user.password);

    await expect(page.getByRole('link', { name: 'Log out' })).toBeVisible();
    await expect(page.getByRole('link', { name: user.email })).toBeVisible();
  });
});
