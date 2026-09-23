import { test, expect } from '../fixtures/BaseTest';
import { type BillingAddress } from '../pages/CheckoutPage';
import { uniqueEmail } from '../utils/test-data';

test.use({ storageState: { cookies: [], origins: [] } });

function createSampleAddress(email: string): BillingAddress {
  return {
    firstName: 'QA',
    lastName: 'Automation',
    email,
    country: 'United States',
    state: 'Washington',
    city: 'Seattle',
    address1: '789 Test Parkway',
    postalCode: '98101',
    phoneNumber: '206-555-0123',
  };
}

test.describe('E-Commerce Checkout Workflows', () => {
  // Allow multi-step OPC flows sufficient time across slow demo instances
  test.setTimeout(90000);

  test('Guest completes order with Cash On Delivery (COD) @smoke @regression', async ({
    page,
    checkoutPage,
  }) => {
    const address = createSampleAddress(uniqueEmail('guest-cod'));
    await page.goto('/141-inch-laptop');
    await page.locator('.overview').getByRole('button', { name: 'Add to cart' }).click();
    await expect(page.locator('#bar-notification')).toContainText(/added to your shopping cart/i);

    await page.goto('/cart');
    await page.locator('#termsofservice').check();
    await page.getByRole('button', { name: 'Checkout' }).click();
    await page.getByRole('button', { name: 'Checkout as Guest' }).click();

    await checkoutPage.fillBillingAddress(address);
    await checkoutPage.continueShippingAddress();
    await checkoutPage.selectShippingMethod('Ground');
    await checkoutPage.selectPaymentMethod('Cash On Delivery (COD)');
    await checkoutPage.continuePaymentInfo();
    await checkoutPage.confirmOrder();

    await expect(checkoutPage.orderSuccessMessage).toBeVisible({ timeout: 15000 });
    await expect(checkoutPage.orderNumberLink).toBeVisible();
  });

  test('Guest completes order with Check / Money Order @regression', async ({
    page,
    checkoutPage,
  }) => {
    const address = createSampleAddress(uniqueEmail('guest-check'));
    await page.goto('/141-inch-laptop');
    await page.locator('.overview').getByRole('button', { name: 'Add to cart' }).click();
    await expect(page.locator('#bar-notification')).toContainText(/added to your shopping cart/i);

    await page.goto('/cart');
    await page.locator('#termsofservice').check();
    await page.getByRole('button', { name: 'Checkout' }).click();
    await page.getByRole('button', { name: 'Checkout as Guest' }).click();

    await checkoutPage.fillBillingAddress(address);
    await checkoutPage.continueShippingAddress();
    await checkoutPage.selectShippingMethod('Ground');
    await checkoutPage.selectPaymentMethod('Check / Money Order');
    await checkoutPage.continuePaymentInfo();
    await checkoutPage.confirmOrder();

    await expect(checkoutPage.orderSuccessMessage).toBeVisible({ timeout: 15000 });
    await expect(checkoutPage.orderNumberLink).toBeVisible();
  });

  test('In-Store Pickup bypasses shipping address and method steps @regression', async ({
    page,
    checkoutPage,
  }) => {
    const address = createSampleAddress(uniqueEmail('pickup'));
    await page.goto('/141-inch-laptop');
    await page.locator('.overview').getByRole('button', { name: 'Add to cart' }).click();
    await expect(page.locator('#bar-notification')).toContainText(/added to your shopping cart/i);

    await page.goto('/cart');
    await page.locator('#termsofservice').check();
    await page.getByRole('button', { name: 'Checkout' }).click();
    await page.getByRole('button', { name: 'Checkout as Guest' }).click();

    // 1. Submit Billing Address
    await checkoutPage.fillBillingAddress(address);

    // 2. Wait for Shipping Address section to open, check In-Store Pickup, and continue
    await expect(checkoutPage.inStorePickupCheckbox).toBeVisible({ timeout: 15000 });
    await checkoutPage.inStorePickupCheckbox.check();
    const shippingContinueBtn = checkoutPage.shippingSection.locator(
      '#shipping-buttons-container input[value="Continue"], input.new-address-next-step-button',
    );
    await shippingContinueBtn.click();

    // 3. Shipping method is bypassed; verify Payment Method content becomes active
    const paymentContinueBtn = checkoutPage.paymentMethodSection.locator(
      '#payment-method-buttons-container input[value="Continue"], input.payment-method-next-step-button',
    );
    await expect(paymentContinueBtn).toBeVisible({ timeout: 15000 });
  });

  // tests/checkout-order.spec.ts (Test: Digital download checkout)
  test('Digital download checkout bypasses shipping panels completely @sanity @regression', async ({
    page,
    productPage,
    cartPage,
    checkoutPage,
  }) => {
    // 1. Dynamic product discovery from category catalog
    await page.goto('/digital-downloads', { waitUntil: 'domcontentloaded' });
    await page.locator('.product-item .product-title a').first().click();

    // 2. Add to cart & synchronize with server bar-notification
    await productPage.addToCart();

    // 3. Checkout progression
    await cartPage.navigate();
    await cartPage.termsOfServiceCheckbox.check();
    await cartPage.checkoutButton.click();
    await page.locator('.checkout-as-guest-button').click();

    await checkoutPage.fillBillingAddress(createSampleAddress(uniqueEmail('digital-guest')));

    // 4. Validate shipping bypass
    await expect(checkoutPage.shippingSection).toBeHidden();
    await expect(checkoutPage.shippingMethodSection).toBeHidden();
    await expect(checkoutPage.paymentMethodSection).toBeVisible();

    await checkoutPage.selectPaymentMethod('Cash On Delivery (COD)');
    await checkoutPage.continuePaymentInfo();
    await checkoutPage.confirmOrder();

    await expect(checkoutPage.orderSuccessMessage).toContainText(/successfully processed/i);
  });

  test('Authenticated checkout fast-path with saved address @smoke @regression', async ({
    page,
    registerPage,
    customerAccountPage,
    checkoutPage,
  }) => {
    const userEmail = uniqueEmail('auth-fast');
    await registerPage.navigate();
    await registerPage.registerUser({
      gender: 'Female',
      firstName: 'Fast',
      lastName: 'Checkout',
      email: userEmail,
      password: 'StrongPassword1',
    });
    await expect(page).toHaveURL(/.*registerresult.*/);

    // Pre-save address in account
    await customerAccountPage.gotoAddresses();
    await customerAccountPage.addNewAddress(createSampleAddress(userEmail));

    // Add item and proceed directly as authenticated user
    await page.goto('/141-inch-laptop');
    await page.locator('.overview').getByRole('button', { name: 'Add to cart' }).click();
    await expect(page.locator('#bar-notification')).toContainText(/added to your shopping cart/i);

    await page.goto('/cart');
    await page.locator('#termsofservice').check();
    await page.getByRole('button', { name: 'Checkout' }).click();

    // Select pre-saved address and progress through accordion
    const billingContinueBtn = checkoutPage.billingSection.locator(
      '#billing-buttons-container input[value="Continue"], input.new-address-next-step-button',
    );
    await expect(billingContinueBtn).toBeVisible({ timeout: 15000 });
    await billingContinueBtn.click();

    await checkoutPage.continueShippingAddress();
    await checkoutPage.selectShippingMethod('Ground');
    await checkoutPage.selectPaymentMethod('Cash On Delivery (COD)');
    await checkoutPage.continuePaymentInfo();
    await checkoutPage.confirmOrder();

    await expect(checkoutPage.orderSuccessMessage).toBeVisible({ timeout: 15000 });
  });

  test('Authenticated user enters new address inline during checkout @regression', async ({
    page,
    registerPage,
    checkoutPage,
  }) => {
    const userEmail = uniqueEmail('auth-newaddr');
    await registerPage.navigate();
    await registerPage.registerUser({
      gender: 'Female',
      firstName: 'Inline',
      lastName: 'Customer',
      email: userEmail,
      password: 'StrongPassword1',
    });
    await expect(page).toHaveURL(/.*registerresult.*/);

    await page.goto('/141-inch-laptop');
    await page.locator('.overview').getByRole('button', { name: 'Add to cart' }).click();
    await expect(page.locator('#bar-notification')).toContainText(/added to your shopping cart/i);

    await page.goto('/cart');
    await page.locator('#termsofservice').check();
    await page.getByRole('button', { name: 'Checkout' }).click();

    await checkoutPage.fillBillingAddress(createSampleAddress(userEmail));
    await checkoutPage.continueShippingAddress();
    await checkoutPage.selectShippingMethod('Ground');
    await checkoutPage.selectPaymentMethod('Cash On Delivery (COD)');
    await checkoutPage.continuePaymentInfo();
    await checkoutPage.confirmOrder();

    await expect(checkoutPage.orderSuccessMessage).toBeVisible({ timeout: 15000 });
  });
});
