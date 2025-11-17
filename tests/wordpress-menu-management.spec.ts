import { test, expect } from '@playwright/test';

test.describe('WordPress Menu Management', () => {
  const siteUrl = process.env.SITE_URL || 'http://talk-ai-for-qa-in-wordpress.local';
  const wpUser = process.env.WP_USER || 'user';
  const wpPass = process.env.WP_PASS || 'password';

  test('should add and remove Promo page from Primary menu', async ({ page }) => {
    // Step 1: Log into WordPress admin
    await page.goto(`${siteUrl}/wp-login.php`);
    await page.getByRole('textbox', { name: 'Username or Email Address' }).fill(wpUser);
    await page.getByRole('textbox', { name: 'Password' }).fill(wpPass);
    await page.getByRole('button', { name: 'Log In' }).click();

    // Verify login successful
    await expect(page).toHaveURL(/wp-admin/);

    // Step 2: Create Promo page
    await page.goto(`${siteUrl}/wp-admin/post-new.php?post_type=page`);

    // Fill in the page title
    const editor = page.frameLocator('iframe[name="editor-canvas"]');
    await editor.getByRole('textbox', { name: 'Add title' }).fill('Promo');

    // Publish the page
    await page.getByRole('button', { name: 'Publish', exact: true }).click();
    await page.getByLabel('Editor publish').getByRole('button', { name: 'Publish', exact: true }).click();

    // Wait for publish confirmation
    await expect(page.getByText('is now live.')).toBeVisible();

    // Step 3: Navigate to Appearance → Menus
    await page.goto(`${siteUrl}/wp-admin/nav-menus.php`);

    // Step 4: Add Promo page to Primary menu
    await page.getByRole('checkbox', { name: 'Promo' }).check();
    await page.getByRole('button', { name: 'Add to Menu' }).click();

    // Wait for menu item to be added
    await expect(page.getByText('Menu item added')).toBeVisible();

    // Step 5: Assign menu to Primary Menu location
    await page.getByRole('checkbox', { name: 'Primary Menu' }).check();

    // Step 6: Save the menu
    await page.getByRole('button', { name: 'Save Menu' }).click();

    // Wait for save confirmation
    await expect(page.getByText('Primary has been updated')).toBeVisible();

    // Step 7: Verify Promo link appears on homepage
    await page.goto(siteUrl);

    // Verify Primary navigation landmark exists
    const primaryNav = page.getByRole('navigation', { name: 'Primary' });
    await expect(primaryNav).toBeVisible();

    // Verify Promo link is present in Primary navigation
    const promoLink = primaryNav.getByRole('link', { name: 'Promo' });
    await expect(promoLink).toBeVisible();

    // Step 8: Click Promo and verify page loads
    await promoLink.click();

    // Verify URL
    await expect(page).toHaveURL(`${siteUrl}/promo/`);

    // Verify h1 heading
    await expect(page.getByRole('heading', { level: 1, name: 'Promo' })).toBeVisible();

    // Step 9: Remove Promo from menu
    await page.goto(`${siteUrl}/wp-admin/nav-menus.php`);

    // Find the Promo menu item and click the edit toggle to expand the dropdown
    // Use .last() to get the most recently added menu item (highest ID)
    const promoMenuItem = page.locator('.menu-item').filter({ hasText: 'Promo' }).last();
    await promoMenuItem.locator('.item-edit').click();

    // Click Remove
    await page.getByRole('link', { name: 'Remove' }).click();

    // Wait for removal confirmation
    await expect(page.getByText('Menu item removed')).toBeVisible();

    // Save the menu
    await page.getByRole('button', { name: 'Save Menu' }).click();
    await expect(page.getByText('Primary has been updated')).toBeVisible();

    // Step 10: Verify Promo link is not present on homepage
    await page.goto(siteUrl);

    // Verify Primary navigation exists
    await expect(page.getByRole('navigation', { name: 'Primary' })).toBeVisible();

    // Verify Promo link is NOT present
    await expect(primaryNav.getByRole('link', { name: 'Promo' })).not.toBeVisible();
  });
});
