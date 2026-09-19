// tests/registration-validation.spec.ts
import { test, expect } from '../fixtures/BaseTest';
import users from '../data/users.json';
import { uniqueEmail } from '../utils/test-data';

test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Registration Form Validation', () => {
  test('Submitting empty registration form triggers required field validations @regression', async ({
    registerPage,
  }) => {
    await registerPage.navigate();
    await registerPage.registerButton.click();

    await expect(registerPage.firstNameError).toContainText(/first name is required/i);
    await expect(registerPage.lastNameError).toContainText(/last name is required/i);
    await expect(registerPage.emailError).toContainText(/email is required/i);
    await expect(registerPage.passwordError).toContainText(/password is required/i);
    await expect(registerPage.confirmPasswordError).toContainText(/password is required/i);
  });

  test('Registration displays error when password confirmation mismatches @regression', async ({
    registerPage,
  }) => {
    await registerPage.navigate();
    await registerPage.firstNameInput.fill('QA');
    await registerPage.lastNameInput.fill('Tester');
    await registerPage.emailInput.fill(uniqueEmail('mismatch'));
    await registerPage.passwordInput.fill('ValidPassword1');
    await registerPage.confirmPasswordInput.fill('DifferentPassword2');
    await registerPage.registerButton.click();

    await expect(registerPage.confirmPasswordError).toBeVisible();
    await expect(registerPage.confirmPasswordError).toContainText(/do not match|does not match/i);
  });

  /**
   * Assumes default nopCommerce minimum password length of 6 characters.
   */
  test('Registration displays error when password is under 6 characters @regression', async ({
    registerPage,
  }) => {
    await registerPage.navigate();
    await registerPage.firstNameInput.fill('QA');
    await registerPage.lastNameInput.fill('Tester');
    await registerPage.emailInput.fill(uniqueEmail('shortpass'));
    await registerPage.passwordInput.fill('123');
    await registerPage.confirmPasswordInput.fill('123');
    await registerPage.registerButton.click();

    await expect(registerPage.passwordError).toBeVisible();
    await expect(registerPage.passwordError).toContainText(/at least 6 characters|length/i);
  });

  test('Registration with an already existing email is rejected @regression', async ({
    registerPage,
  }) => {
    await registerPage.navigate();
    await registerPage.firstNameInput.fill('Duplicate');
    await registerPage.lastNameInput.fill('Account');
    await registerPage.emailInput.fill(users.validUser.email);
    await registerPage.passwordInput.fill('Password123!');
    await registerPage.confirmPasswordInput.fill('Password123!');
    await registerPage.registerButton.click();

    await expect(registerPage.errorMessage).toBeVisible();
    await expect(registerPage.errorMessage).toContainText(/email already exists/i);
  });
});
