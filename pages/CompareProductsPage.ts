import { type Locator, type Page } from '@playwright/test';

export class CompareProductsPage {
  readonly page: Page;
  readonly compareTable: Locator;
  readonly productNames: Locator;
  readonly removeButtons: Locator;
  readonly clearListButton: Locator;
  readonly emptyListMessage: Locator;
  readonly notificationBar: Locator;

  constructor(page: Page) {
    this.page = page;
    this.compareTable = page.locator('table.compare-products-table');
    this.productNames = page.locator('table.compare-products-table tr.product-name td a');
    this.removeButtons = page.locator(
      'table.compare-products-table tr.remove-product input, table.compare-products-table tr.remove-product button',
    );
    this.clearListButton = page
      .getByRole('link', { name: 'Clear list' })
      .or(page.getByRole('button', { name: 'Clear list' }));
    this.emptyListMessage = page.locator('.page-body');
    this.notificationBar = page.locator('#bar-notification .content');
  }

  async navigate(): Promise<void> {
    await this.page.goto('/compareproducts');
  }

  async getProductColumnByName(productName: string): Promise<Locator> {
    return this.productNames.filter({ hasText: productName });
  }
}
