import { expect, type Download, type Locator, type Page } from '@playwright/test';
import { type BillingAddress } from './CheckoutPage';

// Export alias so either name works across all spec files
export type CustomerAddress = BillingAddress;
export type { BillingAddress };
export class CustomerAccountPage {
  readonly page: Page;

  // Navigation Sidebar
  readonly customerInfoLink: Locator;
  readonly addressesLink: Locator;
  readonly ordersLink: Locator;
  readonly downloadableProductsLink: Locator;
  readonly changePasswordLink: Locator;

  // Address Management Elements
  readonly addressCards: Locator;
  readonly addNewAddressButton: Locator;
  readonly addressFirstNameInput: Locator;
  readonly addressLastNameInput: Locator;
  readonly addressEmailInput: Locator;
  readonly addressCountrySelect: Locator;
  readonly addressStateSelect: Locator;
  readonly addressCityInput: Locator;
  readonly address1Input: Locator;
  readonly addressPostalCodeInput: Locator;
  readonly addressPhoneNumberInput: Locator;
  readonly saveAddressButton: Locator;

  // Order Details & History Elements
  readonly ordersContainer: Locator;
  readonly orderCards: Locator;
  readonly orderDetailsButtons: Locator;
  readonly orderDetailsSection: Locator;
  readonly pdfInvoiceButton: Locator;
  readonly printOrderLink: Locator;
  readonly reOrderButton: Locator;
  readonly billingInfoBlock: Locator;
  readonly paymentMethodBlock: Locator;
  readonly orderItemsTable: Locator;
  readonly orderItemRows: Locator;

  // Change Password Elements
  readonly oldPasswordInput: Locator;
  readonly newPasswordInput: Locator;
  readonly confirmNewPasswordInput: Locator;
  readonly changePasswordButton: Locator;
  readonly changePasswordResult: Locator;

  // Downloadable Products
  readonly downloadableProductsTable: Locator;
  readonly downloadLinks: Locator;

  constructor(page: Page) {
    this.page = page;

    // Navigation Sidebar
    this.customerInfoLink = page.locator('.block-account-navigation a[href*="/customer/info"]');
    this.addressesLink = page.locator('.block-account-navigation a[href*="/customer/addresses"]');
    this.ordersLink = page.locator('.block-account-navigation a[href*="/customer/orders"]');
    this.downloadableProductsLink = page.locator(
      '.block-account-navigation a[href*="/customer/downloadableproducts"]',
    );
    this.changePasswordLink = page.locator(
      '.block-account-navigation a[href*="/customer/changepassword"]',
    );

    // Address Cards & Form Elements
    this.addressCards = page.locator('.address-list .address-item, .address-item');
    this.addNewAddressButton = page.locator('.add-address-button input, input[value="Add new"]');
    this.addressFirstNameInput = page.locator('#Address_FirstName');
    this.addressLastNameInput = page.locator('#Address_LastName');
    this.addressEmailInput = page.locator('#Address_Email');
    this.addressCountrySelect = page.locator('#Address_CountryId');
    this.addressStateSelect = page.locator('#Address_StateProvinceId');
    this.addressCityInput = page.locator('#Address_City');
    this.address1Input = page.locator('#Address_Address1');
    this.addressPostalCodeInput = page.locator('#Address_ZipPostalCode');
    this.addressPhoneNumberInput = page.locator('#Address_PhoneNumber');
    this.saveAddressButton = page.locator('.save-address-button input, input[value="Save"]');

    // Order History & Order Details
    this.ordersContainer = page.locator('.order-list, .order-list-page').first();
    this.orderCards = page.locator('.order-list .order-item, .order-list .section');
    this.orderDetailsButtons = page.locator(
      '.order-list input[value="Details"], .order-item .buttons input',
    );
    this.orderDetailsSection = page.locator('.order-details-page');
    this.pdfInvoiceButton = page
      .getByRole('link', { name: 'PDF Invoice' })
      .or(page.locator('a.pdf-order-button, a[href*="pdf"]'));
    this.printOrderLink = page
      .getByRole('link', { name: 'Print' })
      .or(page.locator('a.print-order-button, a[href*="print"]'));
    this.reOrderButton = page
      .getByRole('button', { name: 'Re-order' })
      .or(page.locator('input[value="Re-order"]'));
    this.billingInfoBlock = page.locator('.billing-info');
    this.paymentMethodBlock = page.locator('.payment-method, .payment-method-info');
    this.orderItemsTable = page.locator('.data-table, table.cart');
    this.orderItemRows = page.locator('.data-table tbody tr, table.cart tbody tr');

    // Change Password Form
    this.oldPasswordInput = page.locator('#OldPassword');
    this.newPasswordInput = page.locator('#NewPassword');
    this.confirmNewPasswordInput = page.locator('#ConfirmNewPassword');
    this.changePasswordButton = page.locator('input[value="Change password"]');
    this.changePasswordResult = page
      .locator('.result, .message-error')
      .filter({ hasText: /[a-zA-Z]/ });

    // Downloadable Products
    this.downloadableProductsTable = page.locator('.data-table, .downloadable-products');
    this.downloadLinks = page.locator('a[href*="/download/getdownloadableproduct/"]');
  }

  // Navigation Helpers
  async gotoCustomerInfo(): Promise<void> {
    await this.page.goto('/customer/info');
  }

  async gotoAddresses(): Promise<void> {
    await this.page.goto('/customer/addresses');
  }

  async gotoOrders(): Promise<void> {
    await this.page.goto('/customer/orders');
  }

  async gotoDownloadableProducts(): Promise<void> {
    await this.page.goto('/customer/downloadableproducts');
  }

  async gotoChangePassword(): Promise<void> {
    await this.page.goto('/customer/changepassword');
  }

  // Address Actions
  getAddressCard(indexOrText: number | string = 0): Locator {
    if (typeof indexOrText === 'number') {
      return this.addressCards.nth(indexOrText);
    }
    return this.addressCards.filter({ hasText: indexOrText });
  }
  async addNewAddress(address: BillingAddress): Promise<void> {
    await this.page.goto('/customer/addressadd', { waitUntil: 'domcontentloaded' });
    await expect(this.page).toHaveURL(/customer\/addressadd/i);
    await this.addressFirstNameInput.fill(address.firstName);
    await this.addressLastNameInput.fill(address.lastName);
    await this.addressEmailInput.fill(address.email);
    await this.addressCountrySelect.selectOption({ label: address.country });

    if (await this.addressStateSelect.isVisible()) {
      try {
        const option = this.addressStateSelect.locator('option:not([value="0"])').first();
        await option.waitFor({ state: 'attached', timeout: 2000 });
        await this.addressStateSelect.selectOption({ index: 1 });
      } catch {
        // No populated states
      }
    }

    await this.addressCityInput.fill(address.city);
    await this.address1Input.fill(address.address1);
    await this.addressPostalCodeInput.fill(address.postalCode);
    await this.addressPhoneNumberInput.fill(address.phoneNumber);

    await Promise.all([
      this.page.waitForURL(/customer\/addresses/i, { timeout: 60_000 }),
      this.saveAddressButton.click({ noWaitAfter: true }),
    ]);
    // Confirm the save completed and returned to the address list
    await this.page.waitForURL(/customer\/addresses/i);
  }

  async editAddress(
    indexOrData: number | Partial<BillingAddress>,
    maybeData?: Partial<BillingAddress>,
  ): Promise<void> {
    const cardIndex = typeof indexOrData === 'number' ? indexOrData : 0;
    const data = typeof indexOrData === 'object' ? indexOrData : (maybeData ?? {});

    const card = this.addressCards.nth(cardIndex);
    await card
      .getByRole('button', { name: 'Edit' })
      .or(card.locator('input[value="Edit"]'))
      .click();

    if (data.firstName) await this.addressFirstNameInput.fill(data.firstName);
    if (data.lastName) await this.addressLastNameInput.fill(data.lastName);
    if (data.email) await this.addressEmailInput.fill(data.email);
    if (data.country) await this.addressCountrySelect.selectOption({ label: data.country });
    if (data.state) {
      await expect(async () => {
        const count = await this.addressStateSelect.locator('option').count();
        expect(count).toBeGreaterThan(1);
      }).toPass({ timeout: 10000 });
      await this.addressStateSelect.selectOption({ label: data.state });
    }
    if (data.city) await this.addressCityInput.fill(data.city);
    if (data.address1) await this.address1Input.fill(data.address1);
    if (data.postalCode) await this.addressPostalCodeInput.fill(data.postalCode);
    if (data.phoneNumber) await this.addressPhoneNumberInput.fill(data.phoneNumber);

    await this.saveAddressButton.click();
  }

  async deleteAddress(cardIndex = 0): Promise<void> {
    const card = this.addressCards.nth(cardIndex);
    const deleteButton = card.locator('input[value="Delete"], .delete-address-button').first();

    const onclick = await deleteButton.getAttribute('onclick');
    const deleteUrl = onclick?.match(/\/customer\/addressdelete\/\d+/)?.[0];

    if (deleteUrl) {
      // 1. Execute deletion directly at the HTTP layer using existing session cookies
      await this.page.request.get(deleteUrl, { timeout: 60_000 });

      // 2. Refresh the addresses view to reflect the updated state
      await this.page.goto('/customer/addresses', {
        waitUntil: 'domcontentloaded',
        timeout: 60_000,
      });
    } else {
      // Fallback if onclick pattern changes
      this.page.once('dialog', dialog => void dialog.accept());
      await deleteButton.click({ noWaitAfter: true });
      await this.page.waitForURL(/\/customer\/addresses/i, {
        waitUntil: 'domcontentloaded',
        timeout: 60_000,
      });
    }
  }

  // Order Details Actions
  async viewOrderDetails(orderIndex: number | string = 0): Promise<void> {
    if (typeof orderIndex === 'number') {
      await this.orderDetailsButtons.nth(orderIndex).click();
    } else {
      const card = this.orderCards.filter({ hasText: orderIndex });
      await card.locator('input[value="Details"], button:has-text("Details")').click();
    }
  }

  async downloadPdfInvoice(): Promise<Download> {
    const downloadPromise = this.page.waitForEvent('download');
    await this.pdfInvoiceButton.click();
    return await downloadPromise;
  }

  async openPrintPopup(): Promise<Page> {
    const popupPromise = this.page.waitForEvent('popup');
    await this.printOrderLink.click();
    return await popupPromise;
  }

  async reorder(): Promise<void> {
    await this.reOrderButton.click();
  }

  // Password Actions
  async changePassword(oldPass: string, newPass: string): Promise<void> {
    await this.oldPasswordInput.fill(oldPass);
    await this.newPasswordInput.fill(newPass);
    await this.confirmNewPasswordInput.fill(newPass);
    await this.changePasswordButton.click();
  }
}
