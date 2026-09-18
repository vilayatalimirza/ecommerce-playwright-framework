import { test as base } from '@playwright/test';
import { RegisterPage } from '../pages/RegisterPage';
import { LoginPage } from '../pages/LoginPage';
import { CheckoutPage } from '../pages/CheckoutPage';
import { CustomerAccountPage } from '../pages/CustomerAccountPage';
import { CatalogPage } from '../pages/CatalogPage';

type MyFixtures = {
  loginPage: LoginPage;
  registerPage: RegisterPage;
  checkoutPage: CheckoutPage;
  customerAccountPage: CustomerAccountPage;
  catalogPage: CatalogPage;
};

export const test = base.extend<MyFixtures>({
  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await use(loginPage);
  },

  registerPage: async ({ page }, use) => {
    const registerPage = new RegisterPage(page);
    await use(registerPage);
  },

  checkoutPage: async ({ page }, use) => {
    const checkoutPage = new CheckoutPage(page);
    await use(checkoutPage);
  },

  customerAccountPage: async ({ page }, use) => {
    const customerAccountPage = new CustomerAccountPage(page);
    await use(customerAccountPage);
  },

  catalogPage: async ({ page }, use) => {
    const catalogPage = new CatalogPage(page);
    await use(catalogPage);
  },
});

export { expect } from '@playwright/test';
