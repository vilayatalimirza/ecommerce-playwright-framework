// pages/CatalogPage.ts
import { type Locator, type Page, expect } from '@playwright/test';

export class CatalogPage {
  readonly page: Page;

  // Sorting & View Controls
  readonly sortBySelect: Locator;
  readonly pageSizeSelect: Locator;
  readonly viewModeSelect: Locator;

  // Catalog Products & Pricing
  readonly productCards: Locator;
  readonly productTitles: Locator;
  readonly productPrices: Locator;

  // Footer Newsletter
  readonly newsletterEmailInput: Locator;
  readonly newsletterSubscribeButton: Locator;
  readonly newsletterResult: Locator;

  // Community Poll
  readonly pollBlock: Locator;
  readonly pollOptions: Locator;
  readonly pollVoteButton: Locator;
  readonly pollResults: Locator;
  readonly pollErrorMessage: Locator;

  constructor(page: Page) {
    this.page = page;

    // Sorting & View Selectors
    this.sortBySelect = page.locator('#products-orderby');
    this.pageSizeSelect = page.locator('#products-pagesize');
    this.viewModeSelect = page.locator('#products-viewmode');

    // Catalog Products & Prices
    this.productCards = page.locator('.product-item, .item-box');
    this.productTitles = page.locator('.product-title a');
    this.productPrices = page.locator('.actual-price, .product-price');

    // Footer Newsletter
    this.newsletterEmailInput = page.locator('#newsletter-email');
    this.newsletterSubscribeButton = page.locator('#newsletter-subscribe-button');
    this.newsletterResult = page.locator('#newsletter-result-block');

    // Community Poll
    this.pollBlock = page.locator('#poll-block-1');
    this.pollOptions = page.locator('#poll-block-1 input[type="radio"]');
    this.pollVoteButton = page.locator('#vote-poll-1');
    this.pollResults = page.locator('#poll-block-1 .poll-results');
    this.pollErrorMessage = page.locator('#block-poll-vote-error-1');
  }

  async navigate(): Promise<void> {
    await this.page.goto('/', { waitUntil: 'domcontentloaded' });
  }

  // --- Category Browsing & Sorting Helpers ---

  async selectSortBy(sortOption: string): Promise<void> {
    await Promise.all([
      this.page.waitForURL(/.orderby=./i, { waitUntil: 'domcontentloaded' }),
      this.sortBySelect.selectOption({ label: sortOption }),
    ]);
  }

  async selectPageSize(size: string | number): Promise<void> {
    await Promise.all([
      this.page.waitForURL(/.pagesize=./i, { waitUntil: 'domcontentloaded' }),
      this.pageSizeSelect.selectOption({ label: String(size) }),
    ]);
  }

  async selectViewMode(mode: 'Grid' | 'List'): Promise<void> {
    await Promise.all([
      this.page.waitForURL(/.viewmode=./i, { waitUntil: 'domcontentloaded' }),
      this.viewModeSelect.selectOption({ label: mode }),
    ]);
  }

  async getAllPrices(): Promise<number[]> {
    const rawPrices = await this.productPrices.allInnerTexts();
    return rawPrices
      .map(text => Number.parseFloat(text.replace(/[^0-9.]/g, '')))
      .filter(price => !Number.isNaN(price));
  }

  async getAllProductTitles(): Promise<string[]> {
    return await this.productTitles.allInnerTexts();
  }

  // --- Global Utilities Helpers ---

  async subscribeNewsletter(email: string): Promise<void> {
    await this.newsletterEmailInput.fill(email);
    await this.newsletterSubscribeButton.click();
    await expect(this.newsletterResult).not.toBeEmpty();
  }

  async voteInCommunityPoll(
    optionLabel: 'Excellent' | 'Good' | 'Poor' | 'Very bad',
  ): Promise<void> {
    const radioOption = this.pollBlock
      .locator('li', { hasText: optionLabel })
      .locator('input[type="radio"]');
    await radioOption.check();
    await this.pollVoteButton.click();
    await expect(this.pollResults).toBeVisible();
  }
}
