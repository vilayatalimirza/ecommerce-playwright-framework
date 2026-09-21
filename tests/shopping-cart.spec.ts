import { test, expect } from '../fixtures/BaseTest';

test.use({ storageState: { cookies: [], origins: [] } });

const STANDARD_PRODUCT = '14.1-inch Laptop';
const PRODUCT_URL = '/141-inch-laptop';

test.describe('Shopping Cart & Mini-Cart Operations', () => {
  test('Adding an item updates the header cart quantity badge @smoke @regression', async ({
    page,
    cartPage,
  }) => {
    await page.goto(PRODUCT_URL);
    await expect(cartPage.headerCartQty).toHaveText('(0)');
    await page.locator('.overview').getByRole('button', { name: 'Add to cart' }).click();
    await expect(cartPage.notificationBar).toContainText(/added to your shopping cart/i);
    await expect(cartPage.headerCartQty).toHaveText('(1)');
  });

  test('Hovering header cart link reveals the mini-cart flyout @sanity @regression', async ({
    page,
    cartPage,
  }) => {
    await page.goto(PRODUCT_URL);
    await page.locator('.overview').getByRole('button', { name: 'Add to cart' }).click();
    await expect(cartPage.notificationBar).toContainText(/added to your shopping cart/i);

    await cartPage.headerCartLink.hover();
    await expect(cartPage.miniCartFlyout).toBeVisible();
    await expect(cartPage.miniCartFlyout).toContainText(STANDARD_PRODUCT);
  });

  test('Updating item quantity recalculates line item subtotal @sanity @regression', async ({
    page,
    cartPage,
  }) => {
    await page.goto(PRODUCT_URL);
    await page.locator('.overview').getByRole('button', { name: 'Add to cart' }).click();
    await expect(cartPage.notificationBar).toContainText(/added to your shopping cart/i);

    await cartPage.navigate();
    const row = await cartPage.getRowByProductName(STANDARD_PRODUCT);
    await expect(row).toBeVisible();

    const unitPrice = await cartPage.parsePrice(row.locator('.product-unit-price'));
    await cartPage.setRowQuantity(row, 2);
    await cartPage.updateCartButton.click();

    const updatedRow = await cartPage.getRowByProductName(STANDARD_PRODUCT);
    const subtotal = await cartPage.parsePrice(updatedRow.locator('.product-subtotal'));
    expect(subtotal).toBeCloseTo(unitPrice * 2, 2);
  });

  test('Quantity input allows numeric entry and updates cart value @regression', async ({
    page,
    cartPage,
  }) => {
    await page.goto(PRODUCT_URL);
    await page.locator('.overview').getByRole('button', { name: 'Add to cart' }).click();
    await expect(cartPage.notificationBar).toContainText(/added to your shopping cart/i);

    await cartPage.navigate();
    const row = await cartPage.getRowByProductName(STANDARD_PRODUCT);
    await cartPage.setRowQuantity(row, 3);
    await cartPage.updateCartButton.click();

    const updatedRow = await cartPage.getRowByProductName(STANDARD_PRODUCT);
    await expect(updatedRow.locator('.qty-input')).toHaveValue('3');
  });

  test('Removing an item via checkbox detaches line item row @smoke @regression', async ({
    page,
    cartPage,
  }) => {
    await page.goto(PRODUCT_URL);
    await page.locator('.overview').getByRole('button', { name: 'Add to cart' }).click();
    await expect(cartPage.notificationBar).toContainText(/added to your shopping cart/i);

    await cartPage.navigate();
    const row = await cartPage.getRowByProductName(STANDARD_PRODUCT);
    await expect(row).toBeVisible();

    await cartPage.removeRow(row);
    await expect(row).not.toBeAttached();
  });

  test('Removing all cart items renders empty cart state @regression', async ({
    page,
    cartPage,
  }) => {
    await page.goto(PRODUCT_URL);
    await page.locator('.overview').getByRole('button', { name: 'Add to cart' }).click();
    await expect(cartPage.notificationBar).toContainText(/added to your shopping cart/i);

    await cartPage.navigate();
    const row = await cartPage.getRowByProductName(STANDARD_PRODUCT);
    await cartPage.removeRow(row);

    await expect(cartPage.emptyCartMessage).toBeVisible();
    await expect(cartPage.emptyCartMessage).toContainText(/your shopping cart is empty/i);
  });

  test('Applying invalid discount coupon code displays error notice @regression', async ({
    page,
    cartPage,
  }) => {
    await page.goto(PRODUCT_URL);
    await page.locator('.overview').getByRole('button', { name: 'Add to cart' }).click();
    await expect(cartPage.notificationBar).toContainText(/added to your shopping cart/i);

    await cartPage.navigate();
    await cartPage.discountCouponInput.fill('INVALID-COUPON-999');
    await cartPage.applyDiscountButton.click();

    await expect(cartPage.couponMessage.first()).toBeVisible();
    await expect(cartPage.couponMessage.first()).toContainText(/couldn't be applied/i);
  });

  test('Applying invalid gift card code displays error notice @regression', async ({
    page,
    cartPage,
  }) => {
    await page.goto(PRODUCT_URL);
    await page.locator('.overview').getByRole('button', { name: 'Add to cart' }).click();
    await expect(cartPage.notificationBar).toContainText(/added to your shopping cart/i);
    await cartPage.navigate();
    await cartPage.giftCardInput.fill('FAKE-GIFT-CARD-123');
    await cartPage.applyGiftCardButton.click();
    await expect(cartPage.giftCardMessage).toBeVisible();
    await expect(cartPage.giftCardMessage).toContainText(
      /couldn't be applied|cannot be found|not found/i,
    );
  });

  test('Cart contents persist across category navigations and page reloads @regression', async ({
    page,
    cartPage,
  }) => {
    await page.goto(PRODUCT_URL);
    await page.locator('.overview').getByRole('button', { name: 'Add to cart' }).click();
    await expect(cartPage.notificationBar).toContainText(/added to your shopping cart/i);
    await page.goto('/books');
    await page.goto('/desktops');
    await page.reload();
    await cartPage.navigate();
    const row = await cartPage.getRowByProductName(STANDARD_PRODUCT);
    await expect(row).toBeVisible();
    await expect(row.locator('.qty-input')).toHaveValue('1');
  });

  test('Standard product can be added directly from catalog category card @smoke @regression', async ({
    page,
    cartPage,
  }) => {
    await page.goto('/books');
    const bookCard = page.locator('.product-item').filter({ hasText: 'Computing and Internet' });
    await bookCard.getByRole('button', { name: 'Add to cart' }).click();

    await expect(cartPage.notificationBar).toBeVisible();
    await expect(cartPage.notificationBar).toContainText(/added to your shopping cart/i);
    await expect(cartPage.headerCartQty).toHaveText('(1)');
  });
});
