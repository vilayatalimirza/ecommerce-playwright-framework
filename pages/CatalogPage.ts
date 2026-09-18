import { type Locator, type Page } from '@playwright/test';

export class CatalogPage {
  readonly page: Page;
  readonly sortBySelect: Locator;
  readonly pageSizeSelect: Locator;
  readonly viewModeSelect: Locator;
  readonly productCards: Locator;
  readonly prices: Locator;
  readonly productTitles: Locator;

  constructor(page: Page) {
    this.page = page;
    this.sortBySelect = page.locator('#products-orderby');
    this.pageSizeSelect = page.locator('#products-pagesize');
    this.viewModeSelect = page.locator('#products-viewmode');
    this.productCards = page.locator('.product-item');
    this.prices = page.locator('.prices .actual-price');
    this.productTitles = page.locator('.product-title a');
  }

  async selectSortBy(optionLabel: string): Promise<void> {
    await Promise.all([
      this.page.waitForURL(/orderby=\d+/i),
      this.sortBySelect.selectOption({ label: optionLabel }),
    ]);
    await this.page.waitForLoadState('domcontentloaded');
  }

  async getAllPrices(): Promise<number[]> {
    const rawPrices = await this.prices.allInnerTexts();
    return rawPrices.map(priceText => {
      const sanitized = priceText.replace(/[^0-9.]/g, '');
      return Number.parseFloat(sanitized);
    });
  }

  async getAllProductTitles(): Promise<string[]> {
    const rawTitles = await this.productTitles.allInnerTexts();
    return rawTitles.map(title => title.trim());
  }
}
