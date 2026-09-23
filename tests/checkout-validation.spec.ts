// tests/checkout-validation.spec.ts
import { test, expect } from '../fixtures/BaseTest';
import { type BillingAddress } from '../pages/CheckoutPage';
import { uniqueEmail } from '../utils/test-data';

test.use({ storageState: { cookies: [], origins: [] } });

const SIMPLE_PRODUCT_URL = '/141-inch-laptop';

function createSampleAddress(email: string): BillingAddress {
  return {
    firstName: 'QA',
    lastName: 'Validation',
    email,
    country: 'United States',
    city: 'Chicago',
    address1: '456 Assertion Way',
    postalCode: '60601',
    phoneNumber: '312-555-0188',
  };
}

test.describe('Checkout Constraints & Calculations', () => {
  test('Checkout without Terms of Service triggers warning modal @smoke @regression', async ({
    page,
    productPage,
    cartPage,
  }) => {
    await page.goto(SIMPLE_PRODUCT_URL);
    await productPage.addToCart();

    await cartPage.navigate();
    // eslint-disable-next-line playwright/no-conditional-in-test
    if (await cartPage.termsOfServiceCheckbox.isChecked()) {
      await cartPage.termsOfServiceCheckbox.uncheck();
    }
    await cartPage.checkoutButton.click();

    const tosModal = page.locator('#terms-of-service-warning-box');
    await expect(tosModal).toBeVisible();
    await expect(tosModal).toContainText(/Please accept the terms of service|read and accept/i);
  });

  test('Payment method Purchase Order blocks submission when PO number is empty @regression', async ({
    page,
    productPage,
    cartPage,
    checkoutPage,
  }) => {
    await page.goto(SIMPLE_PRODUCT_URL);
    await productPage.addToCart();

    await cartPage.navigate();
    await cartPage.termsOfServiceCheckbox.check();
    await cartPage.checkoutButton.click();
    await page.locator('.checkout-as-guest-button').click();

    await checkoutPage.fillBillingAddress(createSampleAddress(uniqueEmail('po-validation')));
    await checkoutPage.continueShippingAddress();
    await checkoutPage.selectShippingMethod('Ground');
    await checkoutPage.selectPaymentMethod('Purchase Order');

    await checkoutPage.poNumberInput.clear();
    await checkoutPage.continuePaymentInfo();

    // Verify confirm section is not active and payment info retains focus
    await expect(checkoutPage.confirmOrderSection).not.toHaveClass(/active/);
    await expect(checkoutPage.paymentInfoSection).toHaveClass(/active/);
  });

  test('Payment method Credit Card blocks progression on missing card inputs @regression', async ({
    page,
    productPage,
    cartPage,
    checkoutPage,
  }) => {
    await page.goto(SIMPLE_PRODUCT_URL);
    await productPage.addToCart();

    await cartPage.navigate();
    await cartPage.termsOfServiceCheckbox.check();
    await cartPage.checkoutButton.click();
    await page.locator('.checkout-as-guest-button').click();

    await checkoutPage.fillBillingAddress(createSampleAddress(uniqueEmail('cc-validation')));
    await checkoutPage.continueShippingAddress();
    await checkoutPage.selectShippingMethod('Ground');
    await checkoutPage.selectPaymentMethod('Credit Card');

    await checkoutPage.continuePaymentInfo();

    await expect(checkoutPage.confirmOrderSection).not.toHaveClass(/active/);
    await expect(checkoutPage.paymentInfoSection).toHaveClass(/active/);
  });

  test('Order confirmation verifies Subtotal + Shipping + Tax equals Order Total @sanity @regression', async ({
    page,
    productPage,
    cartPage,
    checkoutPage,
  }) => {
    await page.goto(SIMPLE_PRODUCT_URL);
    await productPage.addToCart();

    await cartPage.navigate();
    await cartPage.termsOfServiceCheckbox.check();
    await cartPage.checkoutButton.click();
    await page.locator('.checkout-as-guest-button').click();

    await checkoutPage.fillBillingAddress(createSampleAddress(uniqueEmail('math-validation')));
    await checkoutPage.continueShippingAddress();
    await checkoutPage.selectShippingMethod('Ground');
    await checkoutPage.selectPaymentMethod('Cash On Delivery (COD)');
    await checkoutPage.continuePaymentInfo();

    await expect(checkoutPage.confirmOrderSection).toHaveClass(/active/);

    const subtotal = await checkoutPage.getSubtotal();
    const shipping = await checkoutPage.getShippingCost();
    const tax = await checkoutPage.getTaxCost();
    const orderTotal = await checkoutPage.getOrderTotal();
    const additionalFee = await checkoutPage.getAdditionalFee();

    expect(orderTotal).toBeCloseTo(subtotal + shipping + tax + additionalFee, 2);
  });
});
