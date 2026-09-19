import { test, expect } from '../fixtures/BaseTest';
import users from '../data/users.json';
import { uniqueEmail } from '../utils/test-data';

/**
 * Runs unauthenticated to isolate login and recovery forms from the
 * default storageState session.
 */
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Authentication & Password Recovery Validation', () => {
  test('Submitting empty login form displays failure message @regression', async ({
    loginPage,
  }) => {
    await loginPage.navigate();
    await loginPage.loginButton.click();

    await expect(loginPage.errorMessage).toBeVisible();
    await expect(loginPage.errorMessage).toContainText(/unsuccessful|correct the errors/i);
  });

  test('Logging in with non-existent credentials displays error banner @regression', async ({
    loginPage,
  }) => {
    const nonexistentEmail = uniqueEmail('ghost');
    await loginPage.navigate();
    await loginPage.login(nonexistentEmail, 'Password123!');

    await expect(loginPage.errorMessage).toBeVisible();
    await expect(loginPage.errorMessage).toContainText(
      /no customer account found|credentials provided are incorrect/i,
    );
  });

  test('Entering a malformed email displays client validation error @regression', async ({
    loginPage,
  }) => {
    await loginPage.navigate();
    await loginPage.emailInput.fill('invalid-email-format');
    await loginPage.passwordInput.fill('ValidPassword1');
    await loginPage.loginButton.click();

    await expect(loginPage.emailValidationError).toBeVisible();
    await expect(loginPage.emailValidationError).toContainText(/wrong email|valid email/i);
  });

  test('"Remember me" checkbox toggles correctly @regression', async ({ loginPage }) => {
    await loginPage.navigate();
    await expect(loginPage.rememberMeCheckbox).not.toBeChecked();

    await loginPage.rememberMeCheckbox.check();
    await expect(loginPage.rememberMeCheckbox).toBeChecked();

    await loginPage.rememberMeCheckbox.uncheck();
    await expect(loginPage.rememberMeCheckbox).not.toBeChecked();
  });

  /**
   * NEEDS SPOT-CHECK: The exact success notification text on password recovery
   * is assumed to follow standard nopCommerce wording ("Email with instructions has been sent to you.").
   */
  test('Password recovery with registered email submits successfully @sanity @regression', async ({
    page,
    loginPage,
  }) => {
    await loginPage.navigate();
    await loginPage.forgotPasswordLink.click();

    await expect(page).toHaveURL(/.*passwordrecovery/);
    await page.getByLabel(/email/i).fill(users.validUser.email);
    await page.getByRole('button', { name: 'Recover' }).click();

    const resultMessage = page.locator('.result, .message-error');
    await expect(resultMessage).toBeVisible();
    await expect(resultMessage).toContainText(/instructions has been sent|sent/i);
  });

  /**
   * NEEDS SPOT-CHECK: nopCommerce can be configured to show "Email not found"
   * or a generic success notice to prevent user enumeration.
   */
  test('Password recovery with unregistered email displays error or notice @regression', async ({
    page,
    loginPage,
  }) => {
    await loginPage.navigate();
    await loginPage.forgotPasswordLink.click();

    const unregisteredEmail = uniqueEmail('unregistered');
    await page.getByLabel(/email/i).fill(unregisteredEmail);
    await page.getByRole('button', { name: 'Recover' }).click();

    const outcomeNotice = page.locator('.result, .message-error');
    await expect(outcomeNotice).toBeVisible();
    await expect(outcomeNotice).toContainText(/not found|instructions|sent/i);
  });

  test('Password recovery with empty email field triggers validation @regression', async ({
    page,
    loginPage,
  }) => {
    await loginPage.navigate();
    await loginPage.forgotPasswordLink.click();

    await page.getByRole('button', { name: 'Recover' }).click();
    const validationError = page.locator('[data-valmsg-for="Email"], .field-validation-error');
    await expect(validationError).toBeVisible();
    await expect(validationError).toContainText(/enter your email|required/i);
  });
});
