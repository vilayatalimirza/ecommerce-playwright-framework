// tests/global-utilities.spec.ts
import { test, expect } from '../fixtures/BaseTest';
import { DataFactory, uniqueEmail } from '../utils/DataFactory';

test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Global Utilities, Newsletter & Community Polls', () => {
  test('Submitting dynamic email to newsletter subscription box renders success confirmation @regression', async ({
    catalogPage,
  }) => {
    await catalogPage.navigate();

    const dynamicEmail = uniqueEmail('newsletter-sub');
    await catalogPage.subscribeNewsletter(dynamicEmail);

    await expect(catalogPage.newsletterResult).toContainText(
      /Thank you for signing up!|verification email has been sent/i,
    );
  });

  test('Authenticated customer can submit community poll vote and display poll results @regression', async ({
    registerPage,
    catalogPage,
  }) => {
    // 1. Establish disposable customer account
    const user = DataFactory.generateUserData();
    await registerPage.navigate();
    await registerPage.registerUser(user);

    // 2. Cast vote on community poll from homepage
    await catalogPage.navigate();
    await catalogPage.voteInCommunityPoll('Excellent');

    // 3. Confirm voting results and percentage bars are displayed
    await expect(catalogPage.pollResults).toContainText(/vote\(s\)/i);
  });
});
