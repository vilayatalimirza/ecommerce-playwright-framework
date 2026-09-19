import { faker } from '@faker-js/faker';

/**
 * Test data generation helpers backed by @faker-js/faker.
 * Resolves SonarQube Rule S2245 by delegating PRNG operations to Faker.
 */
export function uniqueId(prefix = 'qa'): string {
  const timestamp = Date.now();
  const randomSuffix = faker.string.alphanumeric({ length: 5, casing: 'lower' });
  return `${prefix}-${timestamp}-${randomSuffix}`;
}

export function uniqueEmail(prefix = 'qa'): string {
  return `${uniqueId(prefix)}@qa-automation-test.com`;
}
