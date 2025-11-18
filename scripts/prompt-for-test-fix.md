Context: The test WordPress Menu Management broke after an intentional UI change: the primary nav landmark label changed from “Primary” to “Main”, and the visible text for the “Promo” menu item changed to “Deals”. The business intent remains: a marketing page at /promo is linked from the main site navigation and opens correctly.
Task:

Patch the test in a way that does not change the business oracle. Only adjust the test expectations to be more resilient:

Prefer the stable test id I added (data-testid="primary-nav").
For the nav link, target the destination (href*="/promo") rather than the exact visible text.