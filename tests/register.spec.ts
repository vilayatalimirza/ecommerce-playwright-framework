import { test, expect } from '../fixtures/BaseTest';
import { DataFactory } from '../utils/DataFactory';

test.describe('Customer Registration Flow', () => {
  test('registers a new customer using custom POM fixtures', async ({ registerPage, page }) => {
    const newUser = DataFactory.generateUserData();

    await registerPage.navigate();
    await registerPage.registerUser(newUser);

    await expect(registerPage.resultMessage).toBeVisible();
    await expect(registerPage.resultMessage).toHaveText('Your registration completed');
    await expect(page.getByRole('link', { name: newUser.email })).toBeVisible();
  });
});
