import { type Locator, type Page } from '@playwright/test';

export interface CustomerAddress {
  firstName: string;
  lastName: string;
  email: string;
  country: string;
  city: string;
  address1: string;
  postalCode: string;
  phoneNumber: string;
}
export class CustomerAccountPage {
  readonly page: Page;
  readonly customerInfoLink: Locator;
  readonly addressesLink: Locator;
  readonly ordersLink: Locator;
  readonly downloadableProductsLink: Locator;
  readonly addNewAddressButton: Locator;
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly emailInput: Locator;
  readonly countrySelect: Locator;
  readonly cityInput: Locator;
  readonly address1Input: Locator;
  readonly postalCodeInput: Locator;
  readonly phoneNumberInput: Locator;
  readonly saveAddressButton: Locator;
  readonly addressItems: Locator;
  readonly ordersContainer: Locator;
  readonly orderItems: Locator;

  constructor(page: Page) {
    this.page = page;
    const sideNav = page.locator('.block-account-navigation');
    this.customerInfoLink = sideNav.getByRole('link', { name: 'Customer info' });
    this.addressesLink = sideNav.getByRole('link', { name: 'Addresses' });
    this.ordersLink = sideNav.getByRole('link', { name: 'Orders' });
    this.downloadableProductsLink = sideNav.getByRole('link', { name: 'Downloadable products' });
    this.addNewAddressButton = page.getByRole('button', { name: 'Add new' });
    this.firstNameInput = page.getByLabel('First name:');
    this.lastNameInput = page.getByLabel('Last name:');
    this.emailInput = page.getByLabel('Email:');
    this.countrySelect = page.getByLabel('Country:');
    this.cityInput = page.getByLabel('City:');
    this.address1Input = page.getByLabel('Address 1:');
    this.postalCodeInput = page.getByLabel('Zip / postal code:');
    this.phoneNumberInput = page.getByLabel('Phone number:');
    this.saveAddressButton = page.getByRole('button', { name: 'Save' });
    this.addressItems = page.locator('.address-item');
    this.ordersContainer = page.locator('.order-list');
    this.orderItems = page.locator('.order-item');
  }
  async gotoAddresses(): Promise<void> {
    await this.page.goto('/customer/addresses');
  }

  async gotoOrders(): Promise<void> {
    await this.page.goto('/customer/orders');
  }

  async addNewAddress(address: CustomerAddress): Promise<void> {
    await this.addNewAddressButton.click();
    await this.firstNameInput.fill(address.firstName);
    await this.lastNameInput.fill(address.lastName);
    await this.emailInput.fill(address.email);
    await this.countrySelect.selectOption({ label: address.country });
    await this.cityInput.fill(address.city);
    await this.address1Input.fill(address.address1);
    await this.postalCodeInput.fill(address.postalCode);
    await this.phoneNumberInput.fill(address.phoneNumber);
    await this.saveAddressButton.click();
  }

  getAddressCard(identifier: string): Locator {
    return this.addressItems.filter({ hasText: identifier });
  }
}
