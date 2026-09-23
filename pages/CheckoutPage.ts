import { expect, type Locator, type Page } from '@playwright/test';

export type ShippingMethod = 'Ground' | 'Next Day Air' | '2nd Day Air';
export type PaymentMethod =
  'Cash On Delivery (COD)' | 'Check / Money Order' | 'Credit Card' | 'Purchase Order';

export interface BillingAddress {
  firstName: string;
  lastName: string;
  email: string;
  country: string;
  state?: string;
  city: string;
  address1: string;
  postalCode: string;
  phoneNumber: string;
}

export class CheckoutPage {
  readonly page: Page;

  // Accordion Sections
  readonly billingSection: Locator;
  readonly shippingSection: Locator;
  readonly shippingMethodSection: Locator;
  readonly paymentMethodSection: Locator;
  readonly paymentInfoSection: Locator;
  readonly confirmOrderSection: Locator;

  // Step Action Buttons
  readonly billingContinueButton: Locator;
  readonly shippingContinueButton: Locator;
  readonly paymentMethodContinueButton: Locator;
  readonly paymentInfoContinueButton: Locator;
  readonly confirmOrderButton: Locator;

  // Confirmation Elements
  readonly orderSuccessMessage: Locator;
  readonly orderNumberLink: Locator;

  // Form Fields & Controls
  readonly billingAddressSelect: Locator;
  readonly shippingAddressSelect: Locator;
  readonly inStorePickupCheckbox: Locator;
  readonly poNumberInput: Locator;
  readonly cardholderNameInput: Locator;
  readonly cardNumberInput: Locator;
  readonly cardCodeInput: Locator;
  readonly paymentInfoError: Locator;

  // Price Calculation Elements
  readonly subtotalText: Locator;
  readonly shippingFeeText: Locator;
  readonly taxText: Locator;
  readonly orderTotalText: Locator;
  readonly additionalFeeText: Locator;

  constructor(page: Page) {
    this.page = page;

    // Accordion Sections
    this.billingSection = page.locator('#opc-billing');
    this.shippingSection = page.locator('#opc-shipping');
    this.shippingMethodSection = page.locator('#opc-shipping_method');
    this.paymentMethodSection = page.locator('#opc-payment_method');
    this.paymentInfoSection = page.locator('#opc-payment_info');
    this.confirmOrderSection = page.locator('#opc-confirm_order');

    // Action Buttons
    this.billingContinueButton = page.locator(
      '#billing-buttons-container input[value="Continue"], #opc-billing input.new-address-next-step-button',
    );
    this.shippingContinueButton = page.locator(
      '#shipping-buttons-container input[value="Continue"], #opc-shipping input.new-address-next-step-button',
    );
    this.paymentMethodContinueButton = page.locator(
      '#payment-method-buttons-container input[value="Continue"], #opc-payment_method input.payment-method-next-step-button',
    );
    this.paymentInfoContinueButton = page.locator(
      '#payment-info-buttons-container input[value="Continue"], #opc-payment_info input.payment-info-next-step-button',
    );
    this.confirmOrderButton = page.locator(
      '#confirm-order-buttons-container input[value="Confirm"], #opc-confirm_order input.confirm-order-next-step-button',
    );

    // Success State
    this.orderSuccessMessage = page.getByText('Your order has been successfully processed!');
    this.orderNumberLink = page.locator('a[href*="/orderdetails/"]');

    // Controls
    this.billingAddressSelect = page.locator('#billing-address-select');
    this.shippingAddressSelect = page.locator('#shipping-address-select');
    this.inStorePickupCheckbox = page.locator('#PickUpInStore');
    this.poNumberInput = page.locator('#PurchaseOrderNumber');
    this.cardholderNameInput = page.locator('#CardholderName');
    this.cardNumberInput = page.locator('#CardNumber');
    this.cardCodeInput = page.locator('#CardCode');
    this.paymentInfoError = page.locator(
      '#opc-payment_info .message-error, #opc-payment_info .field-validation-error',
    );

    this.subtotalText = this.rowValueByLabel('Sub-Total:');
    this.shippingFeeText = this.rowValueByLabel('Shipping:');
    this.taxText = this.rowValueByLabel('Tax:');
    this.additionalFeeText = this.rowValueByLabel('Additional fee:');
    this.orderTotalText = this.rowValueByLabel('Total:');
  }

  private rowValueByLabel(labelText: string): Locator {
    return this.page
      .locator('#opc-confirm_order tr')
      .filter({ has: this.page.getByText(labelText, { exact: true }) })
      .locator('td')
      .last();
  }
  async fillBillingAddress(address: BillingAddress): Promise<void> {
    await this.billingSection.getByLabel('First name:').fill(address.firstName);
    await this.billingSection.getByLabel('Last name:').fill(address.lastName);
    await this.billingSection.getByLabel('Email:').fill(address.email);
    await this.billingSection.getByLabel('Country:').selectOption({ label: address.country });

    if (address.state) {
      const stateSelect = this.billingSection.locator(
        '#BillingNewAddress_StateProvinceId, select[name*="StateProvinceId"]',
      );
      await expect(async () => {
        const count = await stateSelect.locator('option').count();
        expect(count).toBeGreaterThan(1);
      }).toPass({ timeout: 10000 });
      await stateSelect.selectOption({ label: address.state });
    }

    await this.billingSection.getByLabel('City:').fill(address.city);
    await this.billingSection.getByLabel('Address 1:').fill(address.address1);
    await this.billingSection.getByLabel('Zip / postal code:').fill(address.postalCode);
    await this.billingSection.getByLabel('Phone number:').fill(address.phoneNumber);

    await this.billingContinueButton.click();
  }

  async selectSavedBillingAddress(optionLabel: string): Promise<void> {
    await this.billingAddressSelect.selectOption({ label: optionLabel });
    await this.billingContinueButton.click();
  }

  async continueShippingAddress(): Promise<void> {
    await expect(this.shippingContinueButton).toBeVisible({ timeout: 15000 });
    await this.shippingContinueButton.click();
  }

  async selectShippingMethod(methodName: ShippingMethod): Promise<void> {
    const label = this.shippingMethodSection.locator('label').filter({ hasText: methodName });
    await expect(label.first()).toBeVisible({ timeout: 15000 });
    await label.first().click();
    await this.shippingMethodSection
      .locator(
        '#shipping-method-buttons-container input[value="Continue"], input.shipping-method-next-step-button',
      )
      .click();
  }

  async selectPaymentMethod(methodName: PaymentMethod): Promise<void> {
    const label = this.paymentMethodSection.locator('label').filter({ hasText: methodName });
    await expect(label.first()).toBeVisible({ timeout: 15000 });
    await label.first().click();
    await this.paymentMethodContinueButton.click();
  }

  async continuePaymentInfo(): Promise<void> {
    await expect(this.paymentInfoContinueButton).toBeVisible({ timeout: 15000 });
    await this.paymentInfoContinueButton.click();
  }

  async confirmOrder(): Promise<void> {
    await expect(this.confirmOrderButton).toBeVisible({ timeout: 15000 });
    await this.confirmOrderButton.click();
  }

  async parsePrice(locator: Locator): Promise<number> {
    const raw = await locator.innerText();
    const sanitized = raw.replace(/[^0-9.]/g, '');
    return Number.parseFloat(sanitized);
  }

  async getSubtotal(): Promise<number> {
    await expect(this.subtotalText.first()).toBeVisible({ timeout: 10000 });
    return this.parsePrice(this.subtotalText.first());
  }

  async getShippingCost(): Promise<number> {
    if ((await this.shippingFeeText.count()) === 0) return 0;
    return this.parsePrice(this.shippingFeeText.first());
  }

  async getTaxCost(): Promise<number> {
    if ((await this.taxText.count()) === 0) return 0;
    return this.parsePrice(this.taxText.first());
  }

  async getOrderTotal(): Promise<number> {
    await expect(this.orderTotalText.first()).toBeVisible({ timeout: 10000 });
    return this.parsePrice(this.orderTotalText.first());
  }

  async getAdditionalFee(): Promise<number> {
    const feeLocator = this.page.locator(
      '#opc-confirm_order tr:has-text("Additional fee") .product-price, #opc-confirm_order .additional-fee-value',
    );
    if ((await feeLocator.count()) === 0) return 0;
    return this.parsePrice(feeLocator.first());
  }
}
