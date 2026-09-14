import { Page, Locator } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly errorMessage: Locator;
  private readonly loginLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByLabel('Email:');
    this.passwordInput = page.getByLabel('Password:');
    this.loginButton = page.getByRole('button', { name: 'Log in' });
    this.errorMessage = page.locator('.validation-summary-errors');
    this.loginLink = page.getByRole('link', { name: 'Log in' });
  }

  async enterEmail(email: string) {
    await this.emailInput.fill(email);
  }

  async navigate()  {
    await this.page.goto('/login');
  }


  async login(email: string, password: string) {
  await this.enterEmail(email);
  await this.passwordInput.fill(password);
  await this.loginButton.click();
  }
}