import { type Locator, type Page } from '@playwright/test';
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
  }

  async navigate(): Promise<void> {
    await this.page.goto('/register');
  }

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
  }
}
