// pages/ProductPage.ts
import { type Locator, type Page, expect } from '@playwright/test';

export interface GiftCardDetails {
  recipientName?: string;
  recipientEmail?: string;
  senderName?: string;
  senderEmail?: string;
  message?: string;
}

export class ProductPage {
  readonly page: Page;
  readonly productName: Locator;
  readonly productPrice: Locator;
  readonly productImage: Locator;
  readonly quantityInput: Locator;
  readonly addToCartButton: Locator;
  readonly addToWishlistButton: Locator;
  readonly addToCompareButton: Locator;
  readonly emailAFriendLink: Locator;
  readonly reviewsTab: Locator;
  readonly reviewItems: Locator;
  readonly addReviewTitleInput: Locator;
  readonly addReviewTextInput: Locator;
  readonly submitReviewButton: Locator;
  readonly reviewValidationErrors: Locator;
  readonly relatedProducts: Locator;
  readonly notificationBar: Locator;

  readonly attributeErrorContainer: Locator;
  readonly tierPricesBlock: Locator;
  readonly recipientNameInput: Locator;
  readonly recipientEmailInput: Locator;
  readonly senderNameInput: Locator;
  readonly senderEmailInput: Locator;
  readonly giftCardMessageInput: Locator;

  constructor(page: Page) {
    this.page = page;
    this.productName = page.locator('.product-name h1');
    this.productPrice = page
      .locator('.product-price [itemprop="price"], .product-price span')
      .first();
    this.productImage = page.locator('.picture img').first();
    this.quantityInput = page.locator('.qty-input').first();
    this.addToCartButton = page
      .locator('.overview .add-to-cart-button')
      .or(page.locator('.overview').getByRole('button', { name: 'Add to cart' }));
    this.addToWishlistButton = page
      .locator('.overview .add-to-wishlist-button')
      .or(page.locator('.overview').getByRole('button', { name: 'Add to wishlist' }));
    this.addToCompareButton = page.getByRole('button', { name: 'Add to compare list' });
    this.emailAFriendLink = page.getByRole('link', { name: 'Email a friend' });
    this.reviewsTab = page.getByRole('link', { name: /reviews/i });
    this.reviewItems = page.locator('.product-review-item');
    this.addReviewTitleInput = page.locator('#AddReviewModel_Title, #Title');
    this.addReviewTextInput = page.locator('#AddReviewModel_ReviewText, #ReviewText');
    this.submitReviewButton = page.getByRole('button', { name: 'Submit review' });
    this.reviewValidationErrors = page.locator(
      '.field-validation-error, .validation-summary-errors, .message-error',
    );
    this.relatedProducts = page.locator('.related-products-grid .product-item');

    this.notificationBar = page.locator('#bar-notification .content');
    this.attributeErrorContainer = page.locator(
      '#bar-notification .content, .message-error, .attribute-required-selection, .field-validation-error',
    );
    this.tierPricesBlock = page.locator('.tier-prices');

    this.recipientNameInput = page.locator('input[id*="RecipientName"], .recipient-name');
    this.recipientEmailInput = page.locator('input[id*="RecipientEmail"], .recipient-email');
    this.senderNameInput = page.locator('input[id*="SenderName"], .sender-name');
    this.senderEmailInput = page.locator('input[id*="SenderEmail"], .sender-email');
    this.giftCardMessageInput = page.locator('textarea[id*="Message"], .message');
  }

  async openFromHomepage(productName: string): Promise<void> {
    await this.page.goto('/');
    await this.page.getByRole('link', { name: productName, exact: true }).click();
  }

  async setQuantity(quantity: number): Promise<void> {
    await this.quantityInput.fill(String(quantity));
  }

  async addToCart(quantity = 1): Promise<void> {
    if (quantity !== 1) {
      await this.setQuantity(quantity);
    }
    await this.addToCartButton.click();
    // Synchronize with server AJAX response before resolving
    await expect(this.notificationBar).toContainText(/added to your shopping cart/i);
  }

  async getPriceValue(): Promise<number> {
    const raw = await this.productPrice.innerText();
    const sanitized = raw.replace(/[^0-9.]/g, '');
    return Number.parseFloat(sanitized);
  }

  async selectAttributeOption(textOrPattern: string | RegExp): Promise<void> {
    const selectOption = this.page.locator('select option', { hasText: textOrPattern }).first();
    if ((await selectOption.count()) > 0) {
      const val = await selectOption.getAttribute('value');
      const select = selectOption.locator('..');
      await select.selectOption(val!);
      return;
    }

    const label = this.page.locator('label', { hasText: textOrPattern }).first();
    if ((await label.count()) > 0) {
      await label.click();
      return;
    }

    const option = this.page.getByLabel(textOrPattern).first();
    await option.check();
  }

  async fillGiftCardForm(details: GiftCardDetails): Promise<void> {
    if (details.recipientName !== undefined) {
      await this.recipientNameInput.fill(details.recipientName);
    }
    if (details.recipientEmail !== undefined) {
      await this.recipientEmailInput.fill(details.recipientEmail);
    }
    if (details.senderName !== undefined) {
      await this.senderNameInput.fill(details.senderName);
    }
    if (details.senderEmail !== undefined) {
      await this.senderEmailInput.fill(details.senderEmail);
    }
    if (details.message !== undefined) {
      await this.giftCardMessageInput.fill(details.message);
    }
  }
}
