// tests/search.spec.ts
import { test, expect } from '../fixtures/BaseTest';

test.describe('Search Engine & Advanced Filtering', () => {
  test('Typing >= 3 characters triggers autocomplete suggestions dropdown @smoke @regression', async ({
    page,
    searchPage,
  }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await searchPage.triggerAutocomplete('comp');

    await expect(searchPage.autocompleteDropdown).toBeVisible();
    await expect(searchPage.autocompleteItems.first()).toBeVisible();
    await expect(searchPage.autocompleteItems.first()).toContainText(/computer/i);
  });

  test('Submitting a valid product title navigates to search results and displays matching card @smoke @regression', async ({
    page,
    searchPage,
  }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await searchPage.quickSearch('14.1-inch Laptop');

    await expect(page).toHaveURL(/.*search\?q=14\.1-inch\+Laptop.*/i);
    await expect(searchPage.searchResultCards).toHaveCount(1);
    await expect(searchPage.searchResultTitles.first()).toContainText('14.1-inch Laptop');
  });

  test('Submitting a non-existent search query renders "No products were found" message @regression', async ({
    page,
    searchPage,
  }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await searchPage.quickSearch('NonExistentProductQueryXYZ987');

    await expect(searchPage.noResultsMessage).toBeVisible();
    await expect(searchPage.noResultsMessage).toContainText(
      /No products were found that matched your criteria/i,
    );
    await expect(searchPage.searchResultCards).toHaveCount(0);
  });

  test('Search term below minimum character length (< 3 chars) displays warning or modal alert @regression', async ({
    page,
    searchPage,
  }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    // Submitting < 3 chars navigates to /search and renders an inline warning banner
    await searchPage.searchInput.fill('ab');
    await searchPage.searchButton.click();

    const warning = page.locator('.warning, .search-results .warning, .search-page .warning');
    await expect(warning).toBeVisible();
    await expect(warning).toContainText(/minimum.*3.*characters|Search term minimum length/i);
  });

  test('Advanced search filters products by category with subcategories enabled @sanity @regression', async ({
    searchPage,
  }) => {
    await searchPage.navigate();

    await searchPage.performAdvancedSearch({
      query: 'Computer',
      category: 'Computers',
      includeSubcategories: true,
    });

    await expect(searchPage.searchResultCards.first()).toBeVisible();
    const resultCount = await searchPage.searchResultCards.count();
    expect(resultCount).toBeGreaterThan(0);
  });

  test('Advanced search filters products within specified price range bounds @regression', async ({
    searchPage,
  }) => {
    await searchPage.navigate();

    await searchPage.performAdvancedSearch({
      query: 'Computer',
      priceFrom: '1000',
      priceTo: '1500',
    });

    await expect(searchPage.searchResultCards.first()).toBeVisible();
    const count = await searchPage.searchResultCards.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const card = searchPage.searchResultCards.nth(i);
      const rawPrice = await card.locator('.actual-price, .price').innerText();
      const price = Number.parseFloat(rawPrice.replace(/[^0-9.]/g, ''));
      expect(price).toBeGreaterThanOrEqual(1000);
      expect(price).toBeLessThanOrEqual(1500);
    }
  });

  test('Advanced search "Search in product descriptions" finds query text inside product body @regression', async ({
    searchPage,
  }) => {
    await searchPage.navigate();

    await searchPage.performAdvancedSearch({
      query: 'computer',
      inDescriptions: true,
    });

    await expect(searchPage.searchResultCards.first()).toBeVisible();
    const count = await searchPage.searchResultCards.count();
    expect(count).toBeGreaterThan(0);
  });
});
