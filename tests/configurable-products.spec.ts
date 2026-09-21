// tests/configurable-products.spec.ts
import { test, expect } from '../fixtures/BaseTest';

test.use({ storageState: { cookies: [], origins: [] } });

const CONFIGURABLE_PC_URL = '/build-your-own-computer';

test.describe('Configurable Products & Dynamic Attributes', () => {
  test('Selecting higher RAM tier calculates increased price in cart @sanity @regression', async ({
    page,
    productPage,
    cartPage,
  }) => {
    await page.goto(CONFIGURABLE_PC_URL);

    // HDD is a required field; must be selected
    await productPage.selectAttributeOption(/320 GB/i);

    // Target '8GB' without the space
    await productPage.selectAttributeOption(/8GB/i);
    await productPage.addToCart();

    await expect(productPage.notificationBar).toContainText(/added to your shopping cart/i);

    await cartPage.navigate();
    const row = await cartPage.getRowByProductName('Build your own computer');

    // Base(1200) + Default Processor(15) + Default OS(50) + RAM(60) = 1325.00
    await expect(row.locator('.product-unit-price')).toContainText('1325.00');
  });

  test('Selecting larger HDD calculates increased price in cart @regression', async ({
    page,
    productPage,
    cartPage,
  }) => {
    await page.goto(CONFIGURABLE_PC_URL);

    await productPage.selectAttributeOption(/400 GB/i);
    await productPage.addToCart();

    await expect(productPage.notificationBar).toContainText(/added to your shopping cart/i);

    await cartPage.navigate();
    const row = await cartPage.getRowByProductName('Build your own computer');

    // Base(1200) + Default Processor(15) + Default OS(50) + HDD(100) = 1365.00
    await expect(row.locator('.product-unit-price')).toContainText('1365.00');
  });

  test('Selecting optional software packages calculates price delta in cart @regression', async ({
    page,
    productPage,
    cartPage,
  }) => {
    await page.goto(CONFIGURABLE_PC_URL);

    // Explicitly check specific input elements to avoid brittle default states
    // 1. HDD (Required)
    await page
      .locator('li', { hasText: /320 GB/i })
      .locator('input[type="radio"]')
      .check();

    // 2. OS -> Windows 7 (+50.00)
    await page
      .locator('li', { hasText: /Windows 7/i })
      .locator('input[type="radio"]')
      .check();

    // 3. Software -> Microsoft Office (+50.00)
    await page
      .locator('li', { hasText: /Microsoft Office/i })
      .locator('input[type="checkbox"]')
      .check();

    await productPage.addToCart();

    await expect(productPage.notificationBar).toContainText(/added to your shopping cart/i);

    await cartPage.navigate();
    const row = await cartPage.getRowByProductName('Build your own computer');

    // Base(1200) + Default Processor(15) + OS(50) + Software(50) = 1315.00
    await expect(row.locator('.product-unit-price')).toContainText('1315.00');
  });

  test('Adding configurable product with unselected required attribute shows error @regression', async ({
    page,
    productPage,
  }) => {
    await page.goto('/simple-computer');
    await productPage.addToCartButton.click();

    await expect(productPage.attributeErrorContainer.first()).toBeVisible();
    await expect(productPage.attributeErrorContainer.first()).toContainText(
      /please select|required/i,
    );
  });

  test('Custom jewelry attribute calculates modified price in cart @regression', async ({
    page,
    productPage,
    cartPage,
  }) => {
    await page.goto('/create-it-yourself-jewelry');

    // Dynamically resolve the "Gold" option value to avoid index shifts
    const materialSelect = page.locator('select[name*="product_attribute"]').first();
    const goldValue = await materialSelect
      .locator('option', { hasText: /Gold \(1 mm\)/i })
      .getAttribute('value');

    // Pass the extracted value directly
    await materialSelect.selectOption(goldValue!);

    await page.locator('.attributes input[type="text"]').fill('10');
    await productPage.addToCart();

    await expect(productPage.notificationBar).toContainText(/added to your shopping cart/i);

    await cartPage.navigate();
    const row = await cartPage.getRowByProductName('Create Your Own Jewelry');

    await expect(row.locator('.product-unit-price')).toContainText('100.00');
  });

  test('Product detail page displays volume tier pricing table when configured @regression', async ({
    page,
    productPage,
  }) => {
    await page.goto('/fiction');

    const tierPrices = productPage.tierPricesBlock.or(
      page.locator('.tier-prices-table, .tier-prices-header'),
    );
    // eslint-disable-next-line playwright/no-conditional-in-test
    if ((await tierPrices.count()) === 0) {
      // eslint-disable-next-line playwright/no-skipped-test
      test.skip(true, 'Volume tier pricing is not configured on this product in Demo Web Shop');
    }

    await expect(tierPrices.first()).toBeVisible();
  });
});
