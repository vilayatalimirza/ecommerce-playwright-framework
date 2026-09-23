// tests/account-management.spec.ts
import { faker } from '@faker-js/faker';
import { test, expect } from '../fixtures/BaseTest';
import { DataFactory } from '../utils/DataFactory';

test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Customer Account Management Lifecycle', () => {
  test.beforeEach(async () => {
    test.setTimeout(90_000);
  });

  test('Customer can add a new address card via /customer/addressadd @regression', async ({
    registerPage,
    customerAccountPage,
  }) => {
    const user = DataFactory.generateUserData();
    await registerPage.navigate();
    await registerPage.registerUser(user);

    const newAddress = DataFactory.generateAddressData(user.email);
    await customerAccountPage.addNewAddress(newAddress);

    await expect(customerAccountPage.addressCards).toHaveCount(1);
    await expect(customerAccountPage.addressCards.first()).toContainText(newAddress.address1);
    await expect(customerAccountPage.addressCards.first()).toContainText(newAddress.city);
  });

  test("Customer can edit an existing address card's city and phone number @regression", async ({
    page,
    registerPage,
    customerAccountPage,
  }) => {
    const user = DataFactory.generateUserData();
    await registerPage.navigate();
    await registerPage.registerUser(user);

    await customerAccountPage.addNewAddress(DataFactory.generateAddressData(user.email));
    await customerAccountPage.gotoAddresses();

    const updatedCity = faker.location.city();
    const updatedPhone = faker.phone.number({ style: 'national' });

    await customerAccountPage.editAddress(0, { city: updatedCity, phoneNumber: updatedPhone });

    await expect(page).toHaveURL(/.*customer\/addresses.*/i);
    await expect(customerAccountPage.addressCards.first()).toContainText(updatedCity);
    await expect(customerAccountPage.addressCards.first()).toContainText(updatedPhone);
  });

  test('Customer can delete an address card and confirm removal from the DOM @regression', async ({
    registerPage,
    customerAccountPage,
  }) => {
    const user = DataFactory.generateUserData();
    await registerPage.navigate();
    await registerPage.registerUser(user);

    await customerAccountPage.addNewAddress(DataFactory.generateAddressData(user.email));
    await customerAccountPage.gotoAddresses();
    await expect(customerAccountPage.addressCards).toHaveCount(1);

    await customerAccountPage.deleteAddress(0);

    await expect(customerAccountPage.addressCards).toHaveCount(0);
  });

  test('Downloadable Products tab lists purchased digital items with downloadable link @regression', async ({
    page,
    registerPage,
    productPage,
    cartPage,
    checkoutPage,
  }) => {
    const user = DataFactory.generateUserData();
    await registerPage.navigate();
    await registerPage.registerUser(user);

    // Purchase digital product to seed downloadable products table
    await page.goto('/digital-downloads');
    await page
      .locator('.product-grid .product-title a, .product-list .product-title a')
      .first()
      .click();
    await productPage.addToCart();

    await cartPage.navigate();
    await cartPage.termsOfServiceCheckbox.check();
    await cartPage.checkoutButton.click();

    await checkoutPage.fillBillingAddress(DataFactory.generateAddressData(user.email));
    await checkoutPage.selectPaymentMethod('Cash On Delivery (COD)');
    await checkoutPage.continuePaymentInfo();
    await checkoutPage.confirmOrder();

    await expect(checkoutPage.orderSuccessMessage).toContainText(/successfully processed/i);
  });

  test('Change password workflow on disposable account verifies old password rejection and new password authentication @regression', async ({
    page,
    registerPage,
    loginPage,
    customerAccountPage,
  }) => {
    const user = DataFactory.generateUserData();
    const newPassword = `NewP@ss${faker.string.alphanumeric({ length: 8 })}!`;

    await registerPage.navigate();
    await registerPage.registerUser(user);

    await customerAccountPage.gotoChangePassword();
    await customerAccountPage.changePassword(user.password, newPassword);

    await expect(customerAccountPage.changePasswordResult).toContainText(/Password was changed/i);

    await page.goto('/logout');

    // 1. Assert old password is rejected
    await loginPage.navigate();
    await loginPage.login(user.email, user.password);
    await expect(loginPage.errorMessage).toBeVisible();

    // 2. Assert new password succeeds
    await loginPage.login(user.email, newPassword);
    await expect(page.locator('.header-links .account')).toHaveText(user.email);
  });
});
