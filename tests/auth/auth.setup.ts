import { mkdir, writeFile } from 'node:fs/promises';

import { test as setup, expect } from '../../fixtures/BaseTest';
import { DataFactory } from '../../utils/DataFactory';

const authDirectory = 'playwright/.auth';
const authFile = authDirectory + '/user.json';
const credentialsFile = authDirectory + '/credentials.json';

setup('register a disposable account and save authenticated state', async ({
  page,
  registerPage,
}) => {
  setup.setTimeout(90_000);

  const user = DataFactory.generateUserData();

  await registerPage.navigate();
  await registerPage.registerUser(user);

  await expect(page.getByRole('link', { name: user.email })).toBeVisible();

  await mkdir(authDirectory, { recursive: true });
  await writeFile(credentialsFile, JSON.stringify(user, null, 2), 'utf8');
  await page.context().storageState({ path: authFile });
});
