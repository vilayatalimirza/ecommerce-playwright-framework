import { test, expect } from '../fixtures/BaseTest';

test.describe('Product Catalog Sorting and Display', () => {
  test('sorts products by price from low to high', async ({ page, catalogPage }) => {
    await page.goto('/desktops');
    await catalogPage.selectSortBy('Price: Low to High');
    const prices = await catalogPage.getAllPrices();
    expect(prices.length).toBeGreaterThan(1);
    for (let i = 0; i < prices.length - 1; i++) {
      expect(prices[i]).toBeLessThanOrEqual(prices[i + 1]);
    }
  });

  test('sorts products alphabetically from A to Z', async ({ page, catalogPage }) => {
    await page.goto('/desktops');
    await catalogPage.selectSortBy('Name: A to Z');
    const titles = await catalogPage.getAllProductTitles();
    expect(titles.length).toBeGreaterThan(1);
    const expectedSortedTitles = [...titles].sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: 'base' }),
    );
    expect(titles).toEqual(expectedSortedTitles);
  });
});
