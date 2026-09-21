import { faker } from '@faker-js/faker';

export function uniqueId(prefix = 'qa'): string {
  const timestamp = Date.now();
  const randomSuffix = faker.string.alphanumeric({ length: 5, casing: 'lower' });
  return `${prefix}-${timestamp}-${randomSuffix}`;
}

export function uniqueEmail(prefix = 'qa'): string {
  return `${uniqueId(prefix)}@qa-automation-test.com`;
}
