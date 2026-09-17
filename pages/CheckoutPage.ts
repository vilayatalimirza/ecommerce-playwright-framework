import { type Locator, type Page } from '@playwright/test';

export type ShippingMethod = 'Ground' | 'Next Day Air' | '2nd Day Air';
export type PaymentMethod =
  'Cash On Delivery (COD)' | 'Check / Money Order' | 'Credit Card' | 'Purchase Order';

export interface BillingAddress {
  firstName: string;
  lastName: string;
  email: string;
  country: string;
  city: string;
  address1: string;
  postalCode: string;
  phoneNumber: string;
}

export class CheckoutPage {
  readonly page: Page;
  readonly billingSection: Locator;
  readonly shippingSection: Locator;
  readonly shippingMethodSection: Locator;
  readonly paymentMethodSection: Locator;
  readonly paymentInfoSection: Locator;
  readonly confirmOrderSection: Locator;
  readonly orderSuccessMessage: Locator;
  readonly orderNumberLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.billingSection = page.locator('#opc-billing');
    this.shippingSection = page.locator('#opc-shipping');
    this.shippingMethodSection = page.locator('#opc-shipping_method');
    this.paymentMethodSection = page.locator('#opc-payment_method');
    this.paymentInfoSection = page.locator('#opc-payment_info');
    this.confirmOrderSection = page.locator('#opc-confirm_order');
    this.orderSuccessMessage = page.getByText('Your order has been successfully processed!');
    this.orderNumberLink = page.locator('a[href*="/orderdetails/"]');
  }

  async fillBillingAddress(address: BillingAddress): Promise<void> {
    await this.billingSection.getByLabel('First name:').fill(address.firstName);
    await this.billingSection.getByLabel('Last name:').fill(address.lastName);
    await this.billingSection.getByLabel('Email:').fill(address.email);
    await this.billingSection.getByLabel('Country:').selectOption({ label: address.country });
    await this.billingSection.getByLabel('City:').fill(address.city);
    await this.billingSection.getByLabel('Address 1:').fill(address.address1);
    await this.billingSection.getByLabel('Zip / postal code:').fill(address.postalCode);
    await this.billingSection.getByLabel('Phone number:').fill(address.phoneNumber);
    await this.billingSection.getByRole('button', { name: 'Continue' }).click();
  }

  async continueShippingAddress(): Promise<void> {
    await this.shippingSection.getByRole('button', { name: 'Continue' }).click();
  }

  async selectShippingMethod(methodName: ShippingMethod): Promise<void> {
    await this.shippingMethodSection.getByRole('radio', { name: methodName }).check();
    await this.shippingMethodSection.getByRole('button', { name: 'Continue' }).click();
  }

  async selectPaymentMethod(methodName: PaymentMethod): Promise<void> {
    await this.paymentMethodSection.getByRole('radio', { name: methodName }).check();
    await this.paymentMethodSection.getByRole('button', { name: 'Continue' }).click();
  }

  async continuePaymentInfo(): Promise<void> {
    await this.paymentInfoSection.getByRole('button', { name: 'Continue' }).click();
  }

  async confirmOrder(): Promise<void> {
    await this.confirmOrderSection.getByRole('button', { name: 'Confirm' }).click();
  }
}
