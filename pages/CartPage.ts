import { type Locator, type Page } from '@playwright/test';

export class CartPage {
  readonly page: Page;
  readonly cartTable: Locator;
  readonly cartRows: Locator;
  readonly updateCartButton: Locator;
  readonly continueShoppingButton: Locator;
  readonly emptyCartMessage: Locator;
  readonly termsOfServiceCheckbox: Locator;
  readonly checkoutButton: Locator;
  readonly headerCartLink: Locator;
  readonly headerCartQty: Locator;
  readonly miniCartFlyout: Locator;
  readonly discountCouponInput: Locator;
  readonly applyDiscountButton: Locator;
  readonly giftCardInput: Locator;
  readonly applyGiftCardButton: Locator;
  readonly couponMessage: Locator;
  readonly countrySelect: Locator;
  readonly stateSelect: Locator;
  readonly zipCodeInput: Locator;
  readonly estimateShippingButton: Locator;
  readonly shippingOptionsContainer: Locator;
  readonly notificationBar: Locator;
  readonly giftCardMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.cartTable = page.locator('table.cart');
    this.cartRows = page.locator('table.cart tbody tr.cart-item-row');
    this.updateCartButton = page.getByRole('button', { name: 'Update shopping cart' });
    this.continueShoppingButton = page.getByRole('button', { name: 'Continue shopping' });
    this.emptyCartMessage = page.locator('.order-summary-content');
    this.termsOfServiceCheckbox = page.locator('#termsofservice');
    this.checkoutButton = page.getByRole('button', { name: 'Checkout' });
    this.headerCartLink = page.locator('#topcartlink');
    this.headerCartQty = page.locator('#topcartlink .cart-qty');
    this.miniCartFlyout = page.locator('#flyout-cart');
    this.discountCouponInput = page.locator('input[name="discountcouponcode"]');
    this.applyDiscountButton = page.locator('input[name="applydiscountcouponcode"]');
    this.giftCardInput = page.locator('input[name="giftcardcouponcode"]');
    this.applyGiftCardButton = page.locator('input[name="applygiftcardcouponcode"]');
    this.couponMessage = page.locator('.message-failure, .message-error, .coupon-box .message');
    this.countrySelect = page.locator('#CountryId');
    this.stateSelect = page.locator('#StateProvinceId');
    this.zipCodeInput = page.locator('#ZipPostalCode');
    this.estimateShippingButton = page.locator('input[name="estimateshipping"]');
    this.shippingOptionsContainer = page.locator('.shipping-options, .estimate-shipping-result');
    this.notificationBar = page.locator('#bar-notification');
    this.couponMessage = page.locator(
      '.message-failure, .message-error, .coupon-box .message, .giftcard-box .message',
    );
    this.giftCardMessage = page.locator('.giftcard-box .message');
  }

  async navigate(): Promise<void> {
    await this.page.goto('/cart');
  }

  async getRowByProductName(productName: string): Promise<Locator> {
    return this.cartRows.filter({ hasText: productName });
  }

  async setRowQuantity(row: Locator, quantity: number): Promise<void> {
    const qtyInput = row.locator('.qty-input');
    await qtyInput.fill(String(quantity));
  }

  async removeRow(row: Locator): Promise<void> {
    await row.locator('input[name="removefromcart"]').check();
    await this.updateCartButton.click();
  }

  async parsePrice(locator: Locator): Promise<number> {
    const text = await locator.innerText();
    const sanitized = text.replace(/[^0-9.]/g, '');
    return Number.parseFloat(sanitized);
  }
}
