# Playwright Test Generation Guidelines for WordPress

## Critical Rules for Generating Accurate WordPress Tests

### 1. **ALWAYS Inspect the Actual Page Structure First**

**❌ WRONG:** Assuming how UI elements work based on their visual appearance or common patterns
**✅ CORRECT:** Navigate to the actual page and inspect the DOM structure before writing selectors

When generating tests:
- Visit the actual URL in a browser
- Use browser DevTools to inspect the exact HTML structure
- Identify the actual element types (div, button, link, etc.) and their classes
- Note whether elements use ARIA roles and semantic HTML

### 2. **Don't Assume Clickable Elements are Links**

**❌ WRONG:**
```typescript
// Assuming "Edit" is a link just because it looks clickable
await menuItem.getByRole('link', { name: /Edit.*Promo/i }).click();
```

**✅ CORRECT:**
```typescript
// Check the actual element - WordPress menu handles are divs, not links
await menuItem.locator('.menu-item-handle').click();
```

**Why this matters:**
- WordPress admin uses many non-semantic clickable elements (divs with click handlers)
- Using `getByRole('link')` will fail if the element isn't actually an `<a>` tag
- CSS class selectors (`.menu-item-handle`) are often more reliable for admin interfaces

### 3. **Understand WordPress-Specific UI Patterns**

Common WordPress admin patterns you should know:

#### Menu Management (`/wp-admin/nav-menus.php`)
- Menu items collapse/expand using `.menu-item-handle` divs (NOT links)
- The "Remove" link only appears when an item is expanded
- Menu items are `<li class="menu-item">` elements

#### Post/Page Lists (`/wp-admin/edit.php`)
- Row actions (Edit, Trash, View) appear on hover
- These are links but may have complex accessible names
- Use regex patterns for names: `/Move.*to the Trash/i`

#### Block Editor (Gutenberg)
- Editor content is in an iframe (`iframe[name="editor-canvas"]`)
- Must use `frameLocator()` to interact with content
- Publish buttons exist in multiple places (toolbar and panel)

### 4. **Verify Selector Specificity**

**❌ WRONG:**
```typescript
// Too vague - might match multiple elements
await page.getByText('Edit').click();
```

**✅ CORRECT:**
```typescript
// Scoped to specific container, with fallback strategy
const menuItem = page.locator('li.menu-item').filter({ hasText: 'Promo' }).last();
await menuItem.locator('.menu-item-handle').click();
```

**Best practices:**
- Scope selectors to parent containers first
- Use `.filter()` to narrow down by text content
- Use `.first()` or `.last()` when multiple matches are expected
- Combine multiple strategies (role + name, locator + filter)

### 5. **Handle Dynamic Content and Race Conditions**

**❌ WRONG:**
```typescript
await page.goto(url);
await page.click('.some-element'); // Might not be ready yet
```

**✅ CORRECT:**
```typescript
await page.goto(url);
await expect(page.getByRole('heading', { name: 'Page Title' })).toBeVisible();
await page.click('.some-element');
```

**Best practices:**
- Always wait for a key element to be visible after navigation
- Use `await expect(...).toBeVisible()` before interactions
- Use `waitForLoadState('networkidle')` for complex AJAX pages
- Don't rely on fixed timeouts; use Playwright's auto-waiting

### 6. **Use Semantic Selectors When Available, Class Selectors When Necessary**

**Priority order:**
1. ✅ ARIA roles: `getByRole('button', { name: 'Save' })`
2. ✅ Labels: `getByLabel('Username')`
3. ✅ Placeholder: `getByPlaceholder('Enter email')`
4. ✅ Test IDs: `getByTestId('submit-button')` (rare in WordPress)
5. ⚠️ CSS classes: `.menu-item-handle` (when semantic options fail)
6. ❌ Complex CSS paths: avoid unless absolutely necessary

**When to use class selectors:**
- WordPress admin interfaces often lack semantic HTML
- Stable WordPress core classes (`.menu-item-handle`, `.wp-list-table`) are reliable
- Document WHY you used a class selector in a comment

### 7. **Test Your Selectors Interactively**

Before committing test code:

```bash
# Run Playwright in debug mode
npx playwright test --debug your-test.spec.ts

# Or use codegen to record interactions
npx playwright codegen http://your-wordpress-site.local/wp-admin
```

**Validation checklist:**
- [ ] Does the selector work on the first try?
- [ ] Does it work when run multiple times (test idempotency)?
- [ ] Does it handle expected variations (empty states, multiple items)?
- [ ] Is the selector robust against minor WordPress updates?

### 8. **Handle WordPress-Specific Timing Issues**

**Common issues:**
- Admin notices/confirmations may disappear automatically
- AJAX operations complete without page reload
- Menu save operations trigger JavaScript validation

**Solutions:**
```typescript
// Wait for confirmation messages
await expect(page.getByText('Menu item added')).toBeVisible();

// For transient messages, capture them quickly
await expect(page.getByText(/has been updated/)).toBeVisible({ timeout: 5000 });

// After AJAX operations, verify the result state
await page.getByRole('button', { name: 'Save Menu' }).click();
await expect(page.getByText(/has been updated/)).toBeVisible();
```

### 9. **Document Assumptions and Quirks**

**❌ WRONG:**
```typescript
await menuItem.locator('.menu-item-handle').click();
```

**✅ CORRECT:**
```typescript
// Click the menu item handle to expand the settings
// WordPress menu items use a .menu-item-handle div to toggle expand/collapse
// Note: This is NOT a semantic <button> or <a> tag, but a <div> with a click handler
await menuItem.locator('.menu-item-handle').click();
```

## Summary: Pre-Generation Checklist

Before generating ANY Playwright test for WordPress:

1. [ ] Navigate to the actual page URL in a browser
2. [ ] Inspect the DOM structure with DevTools
3. [ ] Identify element types (link vs button vs div)
4. [ ] Check for ARIA roles and semantic HTML
5. [ ] Note WordPress-specific UI patterns (handles, panels, iframes)
6. [ ] Test selectors in browser console first
7. [ ] Consider idempotency (can the test run multiple times?)
8. [ ] Document non-obvious selector choices

## Common WordPress Mistakes to Avoid

| Mistake | Why It Fails | Correct Approach |
|---------|--------------|------------------|
| `getByRole('link', { name: /Edit/ })` on menu items | Menu handles are divs, not links | Use `.menu-item-handle` locator |
| Clicking before page is ready | Race condition | Use `await expect(...).toBeVisible()` |
| Assuming all buttons have role="button" | WordPress uses divs/spans as buttons | Inspect actual HTML first |
| Not scoping selectors | Multiple matches cause flakiness | Filter by container, use `.first()`/`.last()` |
| Hardcoded waits (`page.waitForTimeout`) | Brittle and slow | Use built-in auto-waiting and assertions |
| Ignoring iframes in Gutenberg | Editor content is isolated | Use `frameLocator()` |

---

**Remember:** When in doubt, INSPECT THE PAGE FIRST. Never assume. Always verify.
