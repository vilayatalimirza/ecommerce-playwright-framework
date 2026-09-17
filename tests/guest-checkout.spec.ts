import { test, expect } from '../fixtures/BaseTest';
import { type BillingAddress } from '../pages/CheckoutPage';
import { DataFactory } from '../utils/DataFactory';

test.use({ storageState: { cookies: [], origins: [] } });

test.describe('E-Commerce Guest Checkout Workflow', () => {
  test('completes guest order successfully via accordion checkout', async ({
    page,
    checkoutPage,
  }) => {
    const customer = DataFactory.generateUserData();
    const guestBillingAddress: BillingAddress = {
      firstName: customer.firstName,
      lastName: customer.lastName,
      email: customer.email,
      country: 'United States',
      city: 'Boston',
      address1: '123 Test Avenue',
      postalCode: '02108',
      phoneNumber: '555-019-2834',
    };
    await page.goto('/141-inch-laptop');
    await page.locator('.overview').getByRole('button', { name: 'Add to cart' }).click();
    await expect(page.locator('#bar-notification')).toContainText(
      'The product has been added to your shopping cart',
    );
    await page.goto('/cart');
    await page.locator('#termsofservice').check();
    await page.getByRole('button', { name: 'Checkout' }).click();
    await page.getByRole('button', { name: 'Checkout as Guest' }).click();
    await checkoutPage.fillBillingAddress(guestBillingAddress);
    await checkoutPage.continueShippingAddress();
    await checkoutPage.selectShippingMethod('Ground');
    await checkoutPage.selectPaymentMethod('Cash On Delivery (COD)');
    await checkoutPage.continuePaymentInfo();
    await checkoutPage.confirmOrder();
    await expect(checkoutPage.orderSuccessMessage).toBeVisible();
    await expect(checkoutPage.orderNumberLink).toBeVisible();
  });
});
