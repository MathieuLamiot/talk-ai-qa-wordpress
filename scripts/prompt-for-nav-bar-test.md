Using Playwright MCP against http://talk-ai-for-qa-in-wordpress.local:

Log into /wp-login.php with admin credentials:
    - username is "user"
    - password is "password"

Go to Appearance → Menus (or Appearance → Editor → Navigation if running a block theme; for our custom theme, Menus is available).
In the Primary menu, add a new page to be linked:

URL: /promo
Link text: Promo
If the Promo page doesn’t exist, create a Page “Promo” (published) first and then add it by searching Pages in the menu editor.


Save the menu.
Go to the home page (/) and verify there is a Primary nav landmark and a link named Promo.
Click Promo and verify the front-end loads the Promo page (<h1>Promo</h1> visible).
Undo: Go back to Appearance → Menus, remove the Promo item from Primary, and save.
Return to home page, verify the Promo link is not present in the primary nav.
Trash the Promo page.
---
Generate a Playwright test (TypeScript) implementing this flow with role-based locators. Refer to and apply the guidelines in PLAYWRIGHT_GUIDELINES.md file.