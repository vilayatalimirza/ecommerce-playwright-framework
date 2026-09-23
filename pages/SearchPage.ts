// pages/SearchPage.ts
import { type Locator, type Page, expect } from '@playwright/test';

export interface AdvancedSearchCriteria {
  query?: string;
  category?: string;
  includeSubcategories?: boolean;
  manufacturer?: string;
  priceFrom?: string | number;
  priceTo?: string | number;
  inDescriptions?: boolean;
}

export class SearchPage {
  readonly page: Page;

  // Global Header Search
  readonly searchInput: Locator;
  readonly searchButton: Locator;
  readonly autocompleteDropdown: Locator;
  readonly autocompleteItems: Locator;

  // Advanced Search Section (/search)
  readonly searchKeywordInput: Locator;
  readonly advancedSearchCheckbox: Locator;
  readonly categorySelect: Locator;
  readonly subcategoriesCheckbox: Locator;
  readonly manufacturerSelect: Locator;
  readonly priceFromInput: Locator;
  readonly priceToInput: Locator;
  readonly searchInDescriptionsCheckbox: Locator;
  readonly advancedSearchButton: Locator;

  // Search Results
  readonly searchResultsContainer: Locator;
  readonly searchResultCards: Locator;
  readonly searchResultTitles: Locator;
  readonly searchResultPrices: Locator;
  readonly noResultsMessage: Locator;
  readonly searchWarningMessage: Locator;

  constructor(page: Page) {
    this.page = page;

    // Header Search
    this.searchInput = page.locator('#small-searchterms');
    this.searchButton = page.locator('input[type="submit"].search-box-button, .search-box-button');
    this.autocompleteDropdown = page.locator('ul.ui-autocomplete');
    this.autocompleteItems = page.locator('ul.ui-autocomplete li.ui-menu-item');

    // Advanced Search Controls
    this.searchKeywordInput = page.locator('#Q');
    this.advancedSearchCheckbox = page.locator('#As');
    this.categorySelect = page.locator('#Cid');
    this.subcategoriesCheckbox = page.locator('#Isc');
    this.manufacturerSelect = page.locator('#Mid');
    this.priceFromInput = page.locator('#Pf');
    this.priceToInput = page.locator('#Pt');
    this.searchInDescriptionsCheckbox = page.locator('#Sid');
    this.advancedSearchButton = page.locator('input.button-1.search-button');

    this.searchResultsContainer = page.locator('.search-results');
    this.searchResultCards = page.locator('.search-results .product-item');
    this.searchResultTitles = page.locator('.search-results .product-title a');
    this.searchResultPrices = page.locator('.search-results .actual-price');
    this.noResultsMessage = page.locator('.search-results .result');
    this.searchWarningMessage = page.locator(
      '.search-results .warning, .search-page .warning, .warning',
    );
  }

  async navigate(): Promise<void> {
    await this.page.goto('/search', { waitUntil: 'domcontentloaded' });
  }

  async quickSearch(term: string): Promise<void> {
    await this.searchInput.fill(term);
    await this.searchButton.click();
    await this.page.waitForLoadState('domcontentloaded');
  }

  async triggerAutocomplete(term: string): Promise<void> {
    await this.searchInput.focus();
    await this.searchInput.pressSequentially(term, { delay: 120 });
    await expect(this.autocompleteDropdown).toBeVisible({ timeout: 5000 });
  }

  async performAdvancedSearch(criteria: AdvancedSearchCriteria): Promise<void> {
    if (!(await this.advancedSearchCheckbox.isChecked())) {
      await this.advancedSearchCheckbox.check();
    }

    if (criteria.query !== undefined) {
      await this.searchKeywordInput.fill(criteria.query);
    }
    if (criteria.category !== undefined) {
      await this.categorySelect.selectOption({ label: criteria.category });
    }
    if (criteria.includeSubcategories !== undefined) {
      if (criteria.includeSubcategories) {
        await this.subcategoriesCheckbox.check();
      } else {
        await this.subcategoriesCheckbox.uncheck();
      }
    }
    if (criteria.manufacturer !== undefined) {
      await this.manufacturerSelect.selectOption({ label: criteria.manufacturer });
    }
    if (criteria.priceFrom !== undefined) {
      await this.priceFromInput.fill(String(criteria.priceFrom));
    }
    if (criteria.priceTo !== undefined) {
      await this.priceToInput.fill(String(criteria.priceTo));
    }
    if (criteria.inDescriptions !== undefined) {
      if (criteria.inDescriptions) {
        await this.searchInDescriptionsCheckbox.check();
      } else {
        await this.searchInDescriptionsCheckbox.uncheck();
      }
    }

    await this.advancedSearchButton.click();
    await this.page.waitForLoadState('domcontentloaded');
  }
}
