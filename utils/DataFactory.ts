import { faker } from '@faker-js/faker';
import process from 'node:process';
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
      password: faker.internet.password({
        length: 12,
        memorable: false,
        pattern: /[A-Za-z0-9!@#$%]/,
      }),
    };
    return { ...defaultUser, ...overrides };
  }
}
