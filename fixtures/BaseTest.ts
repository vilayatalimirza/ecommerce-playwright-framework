import { test as base } from '@playwright/test';
import { RegisterPage } from '../pages/RegisterPage';
import { LoginPage } from '../pages/LoginPage';
import { CheckoutPage } from '../pages/CheckoutPage';
import { CustomerAccountPage } from '../pages/CustomerAccountPage';
import { CatalogPage } from '../pages/CatalogPage';
import { CartPage } from '../pages/CartPage';
import { WishlistPage } from '../pages/WishlistPage';
import { CompareProductsPage } from '../pages/CompareProductsPage';
import { ProductPage } from '../pages/ProductPage';
import { SearchPage } from '../pages/SearchPage';

type MyFixtures = {
  loginPage: LoginPage;
  registerPage: RegisterPage;
  checkoutPage: CheckoutPage;
  customerAccountPage: CustomerAccountPage;
  catalogPage: CatalogPage;
  cartPage: CartPage;
  wishlistPage: WishlistPage;
  compareProductsPage: CompareProductsPage;
  productPage: ProductPage;
  searchPage: SearchPage;
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

  cartPage: async ({ page }, use) => {
    const cartPage = new CartPage(page);
    await use(cartPage);
  },

  wishlistPage: async ({ page }, use) => {
    const wishlistPage = new WishlistPage(page);
    await use(wishlistPage);
  },

  compareProductsPage: async ({ page }, use) => {
    const compareProductsPage = new CompareProductsPage(page);
    await use(compareProductsPage);
  },

  productPage: async ({ page }, use) => {
    const productPage = new ProductPage(page);
    await use(productPage);
  },

  searchPage: async ({ page }, use) => {
    const searchPage = new SearchPage(page);
    await use(searchPage);
  },
});

export { expect } from '@playwright/test';
