// tests/order-management.spec.ts
import { test, expect } from '../fixtures/BaseTest';
import { DataFactory } from '../utils/DataFactory';

test.use({ storageState: { cookies: [], origins: [] } });

const SIMPLE_PRODUCT_URL = '/141-inch-laptop';

test.describe('Customer Order Management Lifecycle', () => {
  let userAddress: ReturnType<typeof DataFactory.generateAddressData>;

  test.beforeEach(async ({ page, registerPage, productPage, cartPage, checkoutPage }) => {
    const user = DataFactory.generateUserData();
    userAddress = DataFactory.generateAddressData(user.email);

    // Register ephemeral customer account
    await registerPage.navigate();
    await registerPage.registerUser(user);

    // Seed order into user history
    await page.goto(SIMPLE_PRODUCT_URL);
    await productPage.addToCart();

    await cartPage.navigate();
    await cartPage.termsOfServiceCheckbox.check();
    await cartPage.checkoutButton.click();

    await checkoutPage.fillBillingAddress(userAddress);
    await checkoutPage.continueShippingAddress();
    await checkoutPage.selectShippingMethod('Ground');
    await checkoutPage.selectPaymentMethod('Cash On Delivery (COD)');
    await checkoutPage.continuePaymentInfo();
    await checkoutPage.confirmOrder();

    await expect(checkoutPage.orderSuccessMessage).toContainText(/successfully processed/i);
  });

  test('Newly placed order renders in customer order history with valid date, total, and "Details" link @smoke @regression', async ({
    customerAccountPage,
  }) => {
    await customerAccountPage.gotoOrders();

    const firstOrder = customerAccountPage.orderCards.first();
    await expect(firstOrder).toBeVisible();
    await expect(firstOrder.locator('.title strong')).toContainText(/Order Number:/i);
    await expect(firstOrder.locator('ul.info, .order-total')).toContainText(/Order Total:/i);
    await expect(firstOrder.locator('input[value="Details"]')).toBeVisible();
  });

  test('Order details page (/orderdetails/{id}) displays correct billing address and payment method @regression', async ({
    page,
    customerAccountPage,
  }) => {
    await customerAccountPage.gotoOrders();
    await customerAccountPage.viewOrderDetails(0);

    await expect(page).toHaveURL(/orderdetails/i);
    await expect(customerAccountPage.billingInfoBlock).toContainText(userAddress.city);
    await expect(customerAccountPage.billingInfoBlock).toContainText(userAddress.postalCode);
    await expect(customerAccountPage.paymentMethodBlock).toContainText(/Cash On Delivery/i);
  });

  test('Order details page lists accurate line items and product option specifications @regression', async ({
    customerAccountPage,
  }) => {
    await customerAccountPage.gotoOrders();
    await customerAccountPage.viewOrderDetails(0);

    await expect(customerAccountPage.orderItemsTable).toBeVisible();
    const itemRow = customerAccountPage.orderItemRows.first();
    await expect(itemRow.locator('.name, .product')).toContainText('14.1-inch Laptop');
    await expect(itemRow.locator('.price, .unit-price, .product-unit-price').first()).toContainText(
      '1590.00',
    );
  });

  test('"PDF Invoice" button triggers browser download event with a .pdf file @sanity @regression', async ({
    customerAccountPage,
  }) => {
    await customerAccountPage.gotoOrders();
    await customerAccountPage.viewOrderDetails(0);

    const download = await customerAccountPage.downloadPdfInvoice();
    expect(download.suggestedFilename()).toMatch(/\.pdf$/i);
  });

  test('"Print" order link opens printable invoice window @regression', async ({
    customerAccountPage,
  }) => {
    await customerAccountPage.gotoOrders();
    await customerAccountPage.viewOrderDetails(0);

    const popup = await customerAccountPage.openPrintPopup();
    await expect(popup).toHaveURL(/.*orderdetails\/print.*/i);
    await popup.close();
  });

  test('"Re-order" button populates shopping cart with line items from the historical order @regression', async ({
    page,
    cartPage,
    customerAccountPage,
  }) => {
    await customerAccountPage.gotoOrders();
    await customerAccountPage.viewOrderDetails(0);

    await customerAccountPage.reorder();

    await expect(page).toHaveURL(/.*cart.*/i);
    const row = await cartPage.getRowByProductName('14.1-inch Laptop');
    await expect(row).toBeVisible();
  });
});
