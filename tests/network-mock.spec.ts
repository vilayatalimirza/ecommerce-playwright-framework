import { expect, test } from '@playwright/test';

test.describe('Network Mocking', () => {
    test('Mocks search autocomplete suggestions', async ({ page }) => {
    await page.route('**/catalog/searchtermautocomplete*', async (route) => {
      const mockedSuggestions = [
        {
          label: 'Custom Enterprise QA Laptop',
          producturl: '/qa-laptop',
        },
      ];
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockedSuggestions),
      });
    });
    await page.goto('/');
    const searchInput = page.locator('#small-searchterms');        
    await searchInput.fill('comp');
    const autocompleteDropdown = page.locator('.ui-autocomplete');
    await expect(autocompleteDropdown).toBeVisible();
    await expect(autocompleteDropdown.getByText('Custom Enterprise QA Laptop')).toBeVisible();
    });

    test('Handles server failure on add-to-cart', async ({ page }) => {
    await page.route('**/addproducttocart/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          message: 'Inventory service is offline.',
        }),
      });
    });
    await page.goto('/');
    const laptopAddToCart = page
      .locator('.product-item', { hasText: '14.1-inch Laptop' })
      .getByRole('button', { name: 'Add to cart' });
    await laptopAddToCart.click();
    const errorBar = page.locator('#bar-notification');
    await expect(errorBar).toBeVisible();
    await expect(errorBar).toHaveClass(/error/);
    await expect(errorBar).toContainText('Inventory service is offline.');
  });
});