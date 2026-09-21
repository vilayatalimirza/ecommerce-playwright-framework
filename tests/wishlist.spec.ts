import { test, expect } from '../fixtures/BaseTest';

test.use({ storageState: { cookies: [], origins: [] } });

const PRODUCT_NAME = 'Black & White Diamond Heart';
const PRODUCT_URL = '/black-white-diamond-heart';

test.describe('Wishlist Lifecycle', () => {
  test('Adding an item updates the header wishlist quantity counter @smoke @regression', async ({
    page,
    wishlistPage,
  }) => {
    await page.goto(PRODUCT_URL);
    await expect(wishlistPage.headerWishlistQty).toHaveText('(0)');
    await page.locator('.add-to-wishlist-button').click();
    await expect(wishlistPage.notificationBar).toContainText(/added to your wishlist/i);

    await expect(wishlistPage.headerWishlistQty).toHaveText('(1)');
  });

  test('Wishlist table renders product details accurately @sanity @regression', async ({
    page,
    wishlistPage,
  }) => {
    await page.goto(PRODUCT_URL);
    await page.locator('.add-to-wishlist-button').click();
    await expect(wishlistPage.notificationBar).toContainText(/added to your wishlist/i);

    await wishlistPage.navigate();
    const row = await wishlistPage.getRowByProductName(PRODUCT_NAME);
    await expect(row).toBeVisible();
    await expect(row.locator('.product-unit-price')).toBeVisible();
    await expect(row.locator('.qty-input')).toHaveValue('1');
  });

  test('Updating item quantity in wishlist reflects new value @regression', async ({
    page,
    wishlistPage,
  }) => {
    await page.goto(PRODUCT_URL);
    await page.locator('.add-to-wishlist-button').click();
    await expect(wishlistPage.notificationBar).toContainText(/added to your wishlist/i);

    await wishlistPage.navigate();
    const row = await wishlistPage.getRowByProductName(PRODUCT_NAME);
    await wishlistPage.setRowQuantity(row, 4);
    await wishlistPage.updateWishlistButton.click();

    const updatedRow = await wishlistPage.getRowByProductName(PRODUCT_NAME);
    await expect(updatedRow.locator('.qty-input')).toHaveValue('4');
  });

  test('Removing an item deletes row from wishlist table @regression', async ({
    page,
    wishlistPage,
  }) => {
    await page.goto(PRODUCT_URL);
    await page.locator('.add-to-wishlist-button').click();
    await expect(wishlistPage.notificationBar).toContainText(/added to your wishlist/i);

    await wishlistPage.navigate();
    const row = await wishlistPage.getRowByProductName(PRODUCT_NAME);
    await wishlistPage.removeRow(row);

    await expect(row).not.toBeAttached();
    await expect(wishlistPage.emptyWishlistMessage).toContainText(/wishlist is empty/i);
  });

  test('Moving an item from wishlist to cart migrates line item @sanity @regression', async ({
    page,
    wishlistPage,
    cartPage,
  }) => {
    await page.goto(PRODUCT_URL);
    await page.locator('.add-to-wishlist-button').click();
    await expect(wishlistPage.notificationBar).toContainText(/added to your wishlist/i);

    await wishlistPage.navigate();
    const row = await wishlistPage.getRowByProductName(PRODUCT_NAME);
    await wishlistPage.moveToCart(row);
    await expect(page).toHaveURL(/.*cart/);
    const cartRow = await cartPage.getRowByProductName(PRODUCT_NAME);
    await expect(cartRow).toBeVisible();

    await expect(wishlistPage.headerWishlistQty).toHaveText('(0)');
  });

  test('Wishlist sharing link loads public view @regression', async ({ page, wishlistPage }) => {
    await page.goto(PRODUCT_URL);
    await page.locator('.add-to-wishlist-button').click();
    await expect(wishlistPage.notificationBar).toContainText(/added to your wishlist/i);

    await wishlistPage.navigate();
    await expect(wishlistPage.shareLink).toBeVisible();

    const publicUrl = wishlistPage.shareLink;
    await expect(publicUrl).toHaveAttribute('href', );

    await page.goto(publicUrl as string);
    const publicRow = await wishlistPage.getRowByProductName(PRODUCT_NAME);
    await expect(publicRow).toBeVisible();
  });
});
