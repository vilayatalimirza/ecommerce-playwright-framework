import { test, expect } from '../fixtures/BaseTest';

test.describe('Shopping Cart API', () => {
  test('adds 14.1-inch Laptop to cart directly via POST request', async ({ request }) => {
    const response = await request.post('/addproducttocart/catalog/31/1/1');
    await expect(response).toBeOK();
    const responseBody = await response.json();
    expect(responseBody.success).toBe(true);
    expect(responseBody.message).toContain('The product has been added to your');
  });

  test('seeds cart via API and verifies via UI', async ({ page }) => {
    const response = await page.request.post('/addproducttocart/catalog/31/1/1');
    expect(response.ok()).toBeTruthy();
    await page.goto('/cart');
    await expect(page.locator('.cart-item-row')).toBeVisible();
    await expect(page.getByRole('link', { name: '14.1-inch Laptop' })).toBeVisible();
  });
});
