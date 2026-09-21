import { test, expect } from '../fixtures/BaseTest';

const PRODUCT_A_URL = '/computing-and-internet';
const PRODUCT_A_NAME = 'Computing and Internet';
const PRODUCT_B_URL = '/fiction';
const PRODUCT_B_NAME = 'Fiction';

test.describe('Product Comparison Lifecycle', () => {
  test('Adding a product to comparison list redirects to compare table @smoke @regression', async ({
    page,
    compareProductsPage,
  }) => {
    await page.goto(PRODUCT_A_URL);
    await page.locator('.overview').getByRole('button', { name: 'Add to compare list' }).click();

    await expect(page).toHaveURL(/\/compareproducts/i);
    await expect(page.locator('.page-title h1')).toHaveText('Compare products');
    await expect(compareProductsPage.compareTable).toBeVisible();
  });

  test('Comparison table renders both products side-by-side @sanity @regression', async ({
    page,
    compareProductsPage,
  }) => {
    await page.goto(PRODUCT_A_URL);
    await page.locator('.overview').getByRole('button', { name: 'Add to compare list' }).click();
    await expect(page).toHaveURL(/\/compareproducts/i);

    await page.goto(PRODUCT_B_URL);
    await page.locator('.overview').getByRole('button', { name: 'Add to compare list' }).click();
    await expect(page).toHaveURL(/\/compareproducts/i);
    await expect(compareProductsPage.compareTable).toBeVisible();
    await expect(compareProductsPage.compareTable).toContainText(PRODUCT_A_NAME);
    await expect(compareProductsPage.compareTable).toContainText(PRODUCT_B_NAME);
  });

  test('Removing single product from compare table leaves remaining item @regression', async ({
    page,
    compareProductsPage,
  }) => {
    await page.goto(PRODUCT_A_URL);
    await page.locator('.overview').getByRole('button', { name: 'Add to compare list' }).click();
    await page.goto(PRODUCT_B_URL);
    await page.locator('.overview').getByRole('button', { name: 'Add to compare list' }).click();
    await page.locator('.compare-products-table .button-2').first().click();
    await expect(compareProductsPage.compareTable).toBeVisible();
  });

  test('"Clear list" button removes all items from comparison table @regression', async ({
    page,
  }) => {
    await page.goto(PRODUCT_A_URL);
    await page.locator('.overview').getByRole('button', { name: 'Add to compare list' }).click();
    await page.getByRole('link', { name: 'Clear list' }).click();
    await expect(page.locator('.page-body')).toContainText(/you have no items to compare/i);
  });
});
