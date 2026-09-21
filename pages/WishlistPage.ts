import { type Locator, type Page } from '@playwright/test';

export class WishlistPage {
  readonly page: Page;
  readonly wishlistTable: Locator;
  readonly wishlistRows: Locator;
  readonly updateWishlistButton: Locator;
  readonly addToCartButton: Locator;
  readonly emptyWishlistMessage: Locator;
  readonly shareLink: Locator;
  readonly headerWishlistQty: Locator;
  readonly notificationBar: Locator;

  constructor(page: Page) {
    this.page = page;
    this.wishlistTable = page.locator('table.cart');
    this.wishlistRows = page.locator('table.cart tbody tr.cart-item-row');
    this.updateWishlistButton = page.getByRole('button', { name: 'Update wishlist' });
    this.addToCartButton = page.getByRole('button', { name: 'Add to cart' });
    this.emptyWishlistMessage = page.locator('.wishlist-content, .order-summary-content');
    this.shareLink = page.locator('.share-info a');
    this.headerWishlistQty = page.locator('.header-links .wishlist-qty');
    this.notificationBar = page.locator('#bar-notification');
  }

  async navigate(): Promise<void> {
    await this.page.goto('/wishlist');
  }

  async getRowByProductName(productName: string): Promise<Locator> {
    return this.wishlistRows.filter({ hasText: productName });
  }

  async setRowQuantity(row: Locator, quantity: number): Promise<void> {
    const qtyInput = row.locator('.qty-input');
    await qtyInput.fill(String(quantity));
  }

  async removeRow(row: Locator): Promise<void> {
    await row.locator('input[name="removefromcart"]').check();
    await this.updateWishlistButton.click();
  }

  async moveToCart(row: Locator): Promise<void> {
    await row.locator('input[name="addtocart"]').check();
    await this.addToCartButton.click();
  }
}
