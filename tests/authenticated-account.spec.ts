import { test, expect } from '../fixtures/BaseTest';
import { type CustomerAddress } from '../pages/CustomerAccountPage';
import { DataFactory } from '../utils/DataFactory';

test.describe('Authenticated Customer Account Management', () => {
  test('adds a new address to the customer address book', async ({ customerAccountPage }) => {
    const user = DataFactory.generateUserData();
    const newAddress: CustomerAddress = {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      country: 'United States',
      city: 'Austin',
      address1: '404 Automation Blvd',
      postalCode: '78701',
      phoneNumber: '512-555-0199',
    };
    await customerAccountPage.gotoAddresses();
    await customerAccountPage.addNewAddress(newAddress);
    const addressCard = customerAccountPage.getAddressCard(newAddress.email);
    await expect(addressCard).toBeVisible();
    await expect(addressCard).toContainText(`${newAddress.firstName} ${newAddress.lastName}`);
    await expect(addressCard).toContainText(newAddress.city);
    await expect(addressCard).toContainText(newAddress.address1);
  });

  test('verifies order history page renders correctly', async ({ page, customerAccountPage }) => {
    await customerAccountPage.gotoOrders();
    await expect(page.getByRole('heading', { name: 'My account - Orders' })).toBeVisible();
    await expect(customerAccountPage.ordersContainer.or(page.getByText('No orders'))).toBeVisible();
  });
});
