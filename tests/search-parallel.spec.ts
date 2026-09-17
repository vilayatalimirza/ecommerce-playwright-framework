import { test, expect } from '../fixtures/BaseTest';

const searchTerms = ['Laptop', 'Computer', 'Phone'];

test.describe('Parameterized Catalog Searches', () => {
  test.describe.configure({ mode: 'parallel' });
  for (const term of searchTerms) {
    test(`searches for keyword: "${term}" and displays results`, async ({ page }) => {
      await page.goto('/');
      await page.locator('#small-searchterms').fill(term);
      await page.getByRole('button', { name: 'Search' }).click();
      await expect(page).toHaveURL(new RegExp(`/search\\?q=${term}`, 'i'));
      await expect(page.locator('.search-results')).toBeVisible();
      await expect(page.locator('.product-item').first()).toBeVisible();
    });
  }
});
