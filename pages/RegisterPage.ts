// pages/RegisterPage.ts
import { expect, type Locator, type Page } from '@playwright/test';
import { type UserData } from '../utils/DataFactory';

export class RegisterPage {
  readonly page: Page;
  readonly maleRadio: Locator;
  readonly femaleRadio: Locator;
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly registerButton: Locator;
  readonly resultMessage: Locator;
  readonly errorMessage: Locator;

  // Field validation message locators
  readonly firstNameError: Locator;
  readonly lastNameError: Locator;
  readonly emailError: Locator;
  readonly passwordError: Locator;
  readonly confirmPasswordError: Locator;

  constructor(page: Page) {
    this.page = page;
    this.maleRadio = page.getByRole('radio', { name: 'Male', exact: true });
    this.femaleRadio = page.getByRole('radio', { name: 'Female', exact: true });
    this.firstNameInput = page.getByLabel('First name:');
    this.lastNameInput = page.getByLabel('Last name:');
    this.emailInput = page.getByLabel('Email:');
    this.passwordInput = page.getByLabel('Password:', { exact: true });
    this.confirmPasswordInput = page.getByLabel('Confirm password:');
    this.registerButton = page.getByRole('button', { name: 'Register' });
    this.resultMessage = page.locator('.result');
    this.errorMessage = page.locator('.validation-summary-errors');

    // Scoped field validations
    this.firstNameError = page.locator('[data-valmsg-for="FirstName"]');
    this.lastNameError = page.locator('[data-valmsg-for="LastName"]');
    this.emailError = page.locator('[data-valmsg-for="Email"]');
    this.passwordError = page.locator('[data-valmsg-for="Password"]');
    this.confirmPasswordError = page.locator('[data-valmsg-for="ConfirmPassword"]');
  }

  async navigate(): Promise<void> {
    await this.page.goto('/register');
  }

  // pages/RegisterPage.ts
  async registerUser(user: UserData): Promise<void> {
    if (user.gender === 'Male') {
      await this.maleRadio.check();
    } else {
      await this.femaleRadio.check();
    }

    await this.firstNameInput.fill(user.firstName);
    await this.lastNameInput.fill(user.lastName);
    await this.emailInput.fill(user.email);
    await this.passwordInput.fill(user.password);
    await this.confirmPasswordInput.fill(user.password);
    await this.registerButton.click();

    // Guarantee the registration transaction finished and session cookie is set
    await expect(this.resultMessage).toContainText(/Your registration completed/i);
  }
}
