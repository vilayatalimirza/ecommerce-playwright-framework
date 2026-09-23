import { faker } from '@faker-js/faker';
import process from 'node:process';
import { type BillingAddress } from '../pages/CheckoutPage';

if (process.env.FAKER_SEED) {
  faker.seed(Number(process.env.FAKER_SEED));
}

export interface UserData {
  gender: 'Male' | 'Female';
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export class DataFactory {
  static generateUserData(overrides?: Partial<UserData>): UserData {
    const defaultUser: UserData = {
      gender: faker.helpers.arrayElement(['Male', 'Female']),
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      email: faker.internet.email({ provider: 'example.com' }).toLowerCase(),
      password: `P@ss${faker.string.alphanumeric({ length: 8 })}!`,
    };
    return { ...defaultUser, ...overrides };
  }

  static generateAddressData(email?: string, overrides?: Partial<BillingAddress>): BillingAddress {
    const defaultAddress: BillingAddress = {
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      email: email ?? faker.internet.email({ provider: 'example.com' }).toLowerCase(),
      country: 'United States',
      city: faker.location.city(),
      address1: faker.location.streetAddress(),
      postalCode: faker.location.zipCode('#####'),
      phoneNumber: faker.phone.number({ style: 'national' }),
    };
    return { ...defaultAddress, ...overrides };
  }
}

export function uniqueId(prefix = 'qa'): string {
  const timestamp = Date.now();
  const randomSuffix = faker.string.alphanumeric({ length: 5, casing: 'lower' });
  return `${prefix}-${timestamp}-${randomSuffix}`;
}

export function uniqueEmail(prefix = 'qa'): string {
  return `${uniqueId(prefix)}@qa-automation-test.com`;
}
