import { test, expect } from '../fixtures/BaseTest';

/**
 * Runs authenticated using default storageState.
 */
test.use({ storageState: 'playwright/.auth/user.json' });

test.describe('Customer Profile & Session Lifecycle', () => {
  /**
   * MUTATION-SAFETY: Reads the current FirstName, updates it with a test suffix,
   * asserts the updated value persists, and then restores the original value
   * to keep the shared account clean.
   */
  test('Customer can update first name and restore original state @smoke @regression', async ({
    page,
  }) => {
    await page.goto('/customer/info');
    const firstNameInput = page.locator('#FirstName, input[name*="FirstName"]');
    const saveButton = page.getByRole('button', { name: 'Save' });

    await expect(firstNameInput).toBeVisible();
    const originalFirstName = await firstNameInput.inputValue();
    const temporaryFirstName = `${originalFirstName}Mod`;

    // 1. Mutate state
    await firstNameInput.fill(temporaryFirstName);
    await saveButton.click();

    // 2. Reload and assert mutated state
    await page.goto('/customer/info');
    await expect(firstNameInput).toHaveValue(temporaryFirstName);

    // 3. Restore original state
    await firstNameInput.fill(originalFirstName);
    await saveButton.click();

    // 4. Assert restored state
    await page.goto('/customer/info');
    await expect(firstNameInput).toHaveValue(originalFirstName);
  });

  test('Customer can log out to terminate authenticated session @smoke @regression', async ({
    page,
  }) => {
    await page.goto('/');
    const logoutLink = page.getByRole('link', { name: 'Log out' });
    await expect(logoutLink).toBeVisible();

    await logoutLink.click();

    // Verify session termination on current context
    await expect(page.getByRole('link', { name: 'Log in' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Register' })).toBeVisible();
    await expect(logoutLink).toBeHidden();
  });
});
