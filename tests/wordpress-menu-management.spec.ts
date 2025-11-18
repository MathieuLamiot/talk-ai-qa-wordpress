import { test, expect } from '@playwright/test';

/**
 * WordPress Menu Management Test
 *
 * This test verifies the complete workflow of:
 * 1. Creating a page
 * 2. Adding it to a menu
 * 3. Verifying it appears on the front-end
 * 4. Removing it from the menu
 * 5. Trashing the page
 */

test.describe('WordPress Menu Management', () => {
  test('should create a page, add it to menu, verify on front-end, then undo changes', async ({ page }) => {
    // Login to WordPress
    await test.step('Login to WordPress admin', async () => {
      await page.goto('http://talk-ai-for-qa-in-wordpress.local/wp-login.php');
      await expect(page.getByRole('heading', { name: 'Log In' })).toBeVisible();

      await page.getByRole('textbox', { name: 'Username or Email Address' }).fill('user');
      await page.getByRole('textbox', { name: 'Password' }).fill('password');
      await page.getByRole('button', { name: 'Log In' }).click();

      await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
    });

    // Create a new "Promo" page
    await test.step('Create a new Promo page', async () => {
      await page.goto('http://talk-ai-for-qa-in-wordpress.local/wp-admin/post-new.php?post_type=page');

      // Wait for the editor to load
      await expect(page.getByRole('heading', { name: 'Add Page' })).toBeVisible();

      // WordPress Block Editor (Gutenberg) content is in an iframe
      const frame = page.frameLocator('iframe[name="editor-canvas"]');
      await frame.getByRole('textbox', { name: 'Add title' }).fill('Promo');

      // Publish the page
      await page.getByRole('button', { name: 'Publish', exact: true }).click();

      // Confirm publish in the panel
      await page.getByLabel('Editor publish').getByRole('button', { name: 'Publish', exact: true }).click();

      // Wait for success message
      await expect(page.getByText('is now live.')).toBeVisible();
    });

    // Add Promo page to Primary menu
    await test.step('Add Promo page to Primary menu', async () => {
      await page.goto('http://talk-ai-for-qa-in-wordpress.local/wp-admin/nav-menus.php');

      await expect(page.getByRole('heading', { name: 'Menus' })).toBeVisible();

      // Check the Promo page checkbox in the Pages section
      await page.getByRole('checkbox', { name: 'Promo' }).click();

      // Click "Add to Menu" button
      await page.getByRole('button', { name: 'Add to Menu' }).click();

      // Verify the menu item was added
      await expect(page.getByText('Menu item added')).toBeVisible();

      // Save the menu
      await page.getByRole('button', { name: 'Save Menu' }).click();

      // Verify save confirmation
      await expect(page.getByText(/has been updated/)).toBeVisible();
    });

    // Verify Promo link appears on the home page
    await test.step('Verify Promo link appears on home page', async () => {
      await page.goto('http://talk-ai-for-qa-in-wordpress.local/');

      // Verify the Primary navigation landmark exists
      const primaryNav = page.getByRole('navigation', { name: 'Primary' });
      await expect(primaryNav).toBeVisible();

      // Verify the Promo link is present in the Primary navigation
      const promoLink = primaryNav.getByRole('link', { name: 'Promo' });
      await expect(promoLink).toBeVisible();
    });

    // Click Promo and verify the page loads
    await test.step('Click Promo link and verify page loads', async () => {
      const primaryNav = page.getByRole('navigation', { name: 'Primary' });
      await primaryNav.getByRole('link', { name: 'Promo' }).click();

      // Verify we're on the Promo page
      await page.waitForURL(/\/promo\/?$/);

      // Verify the h1 heading is visible
      await expect(page.getByRole('heading', { name: 'Promo', level: 1 })).toBeVisible();
    });

    // Remove Promo from menu
    await test.step('Remove Promo from Primary menu', async () => {
      await page.goto('http://talk-ai-for-qa-in-wordpress.local/wp-admin/nav-menus.php');

      await expect(page.getByRole('heading', { name: 'Menus' })).toBeVisible();

      // Find the Promo menu item and expand it
      // WordPress menu items must be expanded before the Remove link appears
      // Using .last() in case there are duplicates from previous test runs
      const menuItem = page.locator('.menu-item').filter({ hasText: 'Promo' }).last();

      // Click .item-edit to expand the menu item
      await menuItem.locator('.item-edit').click();

      // Wait for the Remove link to be visible
      const removeLink = menuItem.getByRole('link', { name: 'Remove' });
      await expect(removeLink).toBeVisible();

      // Click Remove
      await removeLink.click();

      // Verify removal
      await expect(page.getByText('Menu item removed')).toBeVisible();

      // Save the menu
      await page.getByRole('button', { name: 'Save Menu' }).click();

      // Verify save confirmation
      await expect(page.getByText(/has been updated/)).toBeVisible();
    });

    // Verify Promo link is not present on home page
    await test.step('Verify Promo link is not present on home page', async () => {
      await page.goto('http://talk-ai-for-qa-in-wordpress.local/');

      const primaryNav = page.getByRole('navigation', { name: 'Primary' });
      await expect(primaryNav).toBeVisible();

      // Verify the Promo link is NOT present
      const promoLink = primaryNav.getByRole('link', { name: 'Promo' });
      await expect(promoLink).not.toBeVisible();
    });

    // Trash the Promo page
    await test.step('Trash the Promo page', async () => {
      await page.goto('http://talk-ai-for-qa-in-wordpress.local/wp-admin/edit.php?post_type=page');

      await expect(page.getByRole('heading', { name: 'Pages', level: 1 })).toBeVisible();

      // Navigate to the edit page first, then trash from there
      // This is more reliable than hover-based approach
      const pageRow = page.getByRole('row').filter({ hasText: 'Promo' });
      const editLink = pageRow.getByRole('link').filter({ hasText: 'Promo' }).first();
      await editLink.click();

      // Wait for edit page to load
      await expect(page.getByRole('heading', { name: 'Promo', level: 2 })).toBeVisible();

      // Click the "Move to trash" button
      await page.getByRole('button', { name: 'Move to trash' }).click();

      // Wait for the confirmation dialog to appear
      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();
      await expect(dialog.getByText(/Are you sure you want to move.*to the trash/)).toBeVisible();

      // Click the confirmation button within the dialog
      await dialog.getByRole('button', { name: 'Move to trash' }).click();

      // Wait for redirect back to pages list
      await page.waitForURL(/edit\.php\?post_type=page/);

      // Verify deletion message
      await expect(page.getByText(/1 (page|item) moved to the Trash/)).toBeVisible();
    });
  });
});
