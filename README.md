# talk-ai-qa-wordpress

The talk description and slides are available at https://mathieulamiot.com/ai-driven-qa-wcnl-2025/

## Scenario 1: True positive E2E regression

Prepare backstop baseline from main branch with:

```bash
backstop test
backstop approve
```

Checkout the branch `global-visual-regression`.

Run:

```bash
python3 scripts/vr_pack_for_claude.py --task task-descriptions/task-1-refactor-api-error-handling-for-checkout.md
```

Then copy/paste `out/ai-packet.md` to an AI and observe the answer.

## Scenario 2: False positive E2E regression

Prepare backstop baseline from main branch with:

```bash
backstop test
backstop approve
```

Checkout the branch `global-visual-regression`.

Run:

```bash
python3 scripts/vr_pack_for_claude.py --task task-descriptions/task-2-restyle-header-cta-to-brand-blue.md
```

Then copy/paste `out/ai-packet.md` to an AI and observe the answer.

## Scenario 3: True positive for partially correct E2E regression

Prepare backstop baseline from main branch with:

```bash
backstop test
backstop approve
```

Checkout the branch `global-visual-regression`.

Run:

```bash
python3 scripts/vr_pack_for_claude.py --task task-descriptions/task-3-adjust-pricing-table-card-spacing.md
```

Then copy/paste `out/ai-packet.md` to an AI and observe the answer.

Checkout the branch `scoped-change-pricing`.

```bash
python3 scripts/vr_pack_for_claude.py --task task-descriptions/task-3-adjust-pricing-table-card-spacing.md
```

Then copy/paste `out/ai-packet.md` to an AI and observe the answer.