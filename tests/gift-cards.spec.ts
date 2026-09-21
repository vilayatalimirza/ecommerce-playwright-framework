// tests/gift-cards.spec.ts
import { test, expect } from '../fixtures/BaseTest';
import { uniqueEmail } from '../utils/test-data';

test.use({ storageState: { cookies: [], origins: [] } });

const VIRTUAL_GIFT_CARD_URL = '/5-virtual-gift-card';
const PHYSICAL_GIFT_CARD_URL = '/100-physical-gift-card';

test.describe('Gift Card Attribute Validations', () => {
  test('Virtual gift card blocks submission when recipient name is missing @regression', async ({
    page,
    productPage,
  }) => {
    await page.goto(VIRTUAL_GIFT_CARD_URL);
    await productPage.fillGiftCardForm({
      recipientEmail: uniqueEmail('recipient'),
      senderName: 'QA Tester',
      senderEmail: uniqueEmail('sender'),
    });

    await productPage.addToCartButton.click();

    await expect(productPage.attributeErrorContainer.first()).toBeVisible();
    await expect(productPage.attributeErrorContainer.first()).toContainText(
      /enter valid recipient name|recipient name is required/i,
    );
  });

  test('Virtual gift card blocks submission when sender name is missing @regression', async ({
    page,
    productPage,
  }) => {
    await page.goto(VIRTUAL_GIFT_CARD_URL);
    await productPage.fillGiftCardForm({
      recipientName: 'Gift Recipient',
      recipientEmail: uniqueEmail('recipient'),
      senderEmail: uniqueEmail('sender'),
    });

    await productPage.addToCartButton.click();

    await expect(productPage.attributeErrorContainer.first()).toBeVisible();
    await expect(productPage.attributeErrorContainer.first()).toContainText(
      /enter valid sender name|sender name is required/i,
    );
  });

  test('Virtual gift card validates invalid recipient email address format @regression', async ({
    page,
    productPage,
  }) => {
    await page.goto(VIRTUAL_GIFT_CARD_URL);
    await productPage.fillGiftCardForm({
      recipientName: 'Gift Recipient',
      recipientEmail: 'not-an-email',
      senderName: 'QA Tester',
      senderEmail: uniqueEmail('sender'),
    });

    await productPage.addToCartButton.click();

    await expect(productPage.attributeErrorContainer.first()).toBeVisible();
    await expect(productPage.attributeErrorContainer.first()).toContainText(
      /enter valid recipient email|wrong email/i,
    );
  });

  test('Physical gift card with valid details adds to shopping cart @sanity @regression', async ({
    page,
    productPage,
    cartPage,
  }) => {
    await page.goto(PHYSICAL_GIFT_CARD_URL);
    await productPage.fillGiftCardForm({
      recipientName: 'VIP Client',
      senderName: 'QA Automation Lead',
      message: 'Congratulations on the release!',
    });

    await productPage.addToCartButton.click();

    await expect(productPage.notificationBar).toBeVisible();
    await expect(productPage.notificationBar).toContainText(/added to your shopping cart/i);

    await cartPage.navigate();
    const row = await cartPage.getRowByProductName('$100 Physical Gift Card');
    await expect(row).toBeVisible();
  });
});
