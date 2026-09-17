import { test, expect } from '../fixtures/BaseTest';

test.use({ storageState: { cookies: [], origins: [] } });

test('Deterministically waits for cart update via network and UI state', async ({ page }) => {
  await page.goto('/');
  const responsePromise = page.waitForResponse(
    response => response.url().includes('/addproducttocart') && response.status() === 200,
  );
  await page
    .locator('.product-item', { hasText: '14.1-inch Laptop' })
    .getByRole('button', { name: 'Add to cart' })
    .click();
  const response = await responsePromise;
  expect(response.status()).toBe(200);
  await expect(page.locator('#bar-notification')).toBeVisible();
  await expect(page.locator('#bar-notification')).toContainText(
    'The product has been added to your',
  );
  await expect(page.locator('.cart-qty')).toContainText('(1)');
});
