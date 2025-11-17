#!/usr/bin/env python3
"""
vr_pack_for_claude.py

Runs BackstopJS against your local WP site, parses results, and produces a
Claude-ready Markdown packet containing:
- The task markdown (copied verbatim)
- A compact diff summary by page
- Optional embedded Backstop JSON (full)
- A copy‑paste prompt for Claude to classify severity:
    BLOCK | WARN | PARTIAL_WARN
- Pointers to the Backstop HTML report(s)

Usage:
  python3 vr_pack_for_claude.py \
    --task task-descriptions/task-1-non-visual-refactor.md \
    [--site-url http://talk-ai-for-qa-in-wordpress.local] \
    [--backstop-config backstop.config.js] \
    [--include-full-json]

Outputs:
  out/ai-packet.md
  out/diff-summary.json
"""
import argparse
import json
import os
import re
import sys
import subprocess
import pathlib
import glob
from datetime import datetime
from typing import Dict, Any

DEFAULT_SITE_URL = "http://talk-ai-for-qa-in-wordpress.local"
DEFAULT_BACKSTOP_CONFIG = "backstop.json"
DEFAULT_REPORT_DIR = "backstop/backstop_data/json_report"
DEFAULT_HTML_REPORT_DIR = "backstop/backstop_data/html_report"

SYSTEM_PROMPT = """You are a visual regression triage assistant. Given a TASK description (title, labels, body),
and a visual diff summary from BackstopJS, return a JSON object:

{
 "severity": "BLOCK" | "WARN" | "OK",
 "expected_pages": string[],
 "unexpected_pages": string[],
 "reason": string
}

Rules:
- If the task description implies NO visual change (backend/API/refactor/docs), if there are visual differences reported by backstop → BLOCK.
- If the task implies SCOPED visual change (specific page/section), allow diffs only on those pages. 
    - If there are extra pages with diffs → WARN and list them in unexpected_pages.
    - If only the scoped pages have diffs -> OK.
- If the task implies visual changes across the whole websites -> OK regardless of diffs.

Infer scope from the task text: explicit routes ("/pricing"), component names ("Pricing table"), or labels.
Be concise in reason. Return ONLY the JSON with the required keys.
"""

TASK_FIELD_RE = {
    "title": re.compile(r"(?im)^#?\s*Title:\s*(.+)$"),
    "labels": re.compile(r"(?im)^Labels:\s*(.+)$"),
    "expected": re.compile(r"(?im)^Expected pages:\s*(.*)$"),
    "body": re.compile(r"(?is)Body:\s*(.*)$")
}

def sh(cmd: str, env: Dict[str, str] | None = None, allow_fail: bool = False) -> int:
    print(f"+ {cmd}")
    res = subprocess.run(cmd, shell=True, env=env)
    if res.returncode != 0 and not allow_fail:
        print(f"Command failed with code {res.returncode}", file=sys.stderr)
    return res.returncode

def run_backstop(site_url: str, backstop_config: str) -> None:
    env = os.environ.copy()
    env["SITE_URL"] = site_url
    # Backstop returns non-zero when diffs exist; we allow failure here to still parse reports.
    code = sh(f"cd backstop  && backstop test --config={backstop_config}", env=env, allow_fail=True)
    if code not in (0, 1):
        print(f"Backstop returned unexpected exit code: {code}", file=sys.stderr)

def collect_diffs(report_dir: str = DEFAULT_REPORT_DIR) -> Dict[str, Any]:
    files = sorted(glob.glob(os.path.join(report_dir, "*.json")))
    if not files:
        return {"pages": [], "totalFailed": 0}

    failed_items = []
    for fpath in files:
        try:
            with open(fpath, "r", encoding="utf-8") as f:
                data = json.load(f)
        except Exception as e:
            print(f"Failed to read report {fpath}: {e}", file=sys.stderr)
            continue

        for test in data.get("tests", []) or []:
            if test.get("status") == "fail":
                pair = test.get("pair", {})
                failed_items.append({
                    "label": pair.get("label") or "unknown",
                    "url": pair.get("url") or "",
                    "fileName": pair.get("fileName"),
                    "mismatch": (pair.get("diff") or {}).get("misMatchPercentage"),
                    "selectors": pair.get("selectors"),
                })

    by_page = {}
    for it in failed_items:
        p = it["label"]
        by_page.setdefault(p, {"page": p, "count": 0, "samples": []})
        by_page[p]["count"] += 1
        if len(by_page[p]["samples"]) < 5 and it.get("fileName"):
            by_page[p]["samples"].append(it["fileName"])

    summary = {
        "pages": list(by_page.values()),
        "totalFailed": len(failed_items)
    }
    with open("out/diff-summary.json", "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2)
    return summary

def parse_task_markdown(path: str) -> Dict[str, Any]:
    text = pathlib.Path(path).read_text(encoding="utf-8")
    def find(rx, default=""):
        m = rx.search(text)
        return (m.group(1).strip() if m else default)
    title = find(TASK_FIELD_RE["title"], "(no title)")
    labels_line = find(TASK_FIELD_RE["labels"], "")
    labels = [s.strip() for s in labels_line.split(",") if s.strip()]
    expected_line = find(TASK_FIELD_RE["expected"], "")
    expected_pages = [p.strip() for p in re.split(r"[,\s]+", expected_line) if p.strip()]
    body = find(TASK_FIELD_RE["body"], text)
    return {
        "title": title,
        "labels": labels,
        "expected_pages": expected_pages,
        "body": body,
        "raw": text
    }

def read_backstop_full_json(report_dir: str = DEFAULT_REPORT_DIR) -> dict:
    """Merge all Backstop JSON reports into one object for embedding (optional)."""
    merged = {"files": []}
    for fpath in sorted(glob.glob(os.path.join(report_dir, "*.json"))):
        try:
            with open(fpath, "r", encoding="utf-8") as f:
                merged["files"].append({
                    "file": os.path.basename(fpath),
                    "content": json.load(f)
                })
        except Exception as e:
            merged["files"].append({
                "file": os.path.basename(fpath),
                "error": str(e)
            })
    return merged

def build_packet_md(
    task_path: str,
    task_info: Dict[str, Any],
    diff_summary: Dict[str, Any],
    backstop_html_dir: str,
    include_full_json: bool,
    full_json_obj: Dict[str, Any] | None
) -> str:

    # Pretty code blocks
    task_block = f"```md\n{task_info['raw'].strip()}\n```"
    diff_block = "```json\n" + json.dumps(diff_summary, indent=2) + "\n```"
    prompt_block = "```text\n" + SYSTEM_PROMPT.strip() + "\n```"
    full_block = ""
    if include_full_json and full_json_obj:
        full_block = "```json\n" + json.dumps(full_json_obj, indent=2) + "\n```"

    html_tip = (
        f"- Open Backstop HTML report: `npx backstop openReport`\n"
        f"- Or browse: `{backstop_html_dir}/index.html` (local file path)\n"
    )

    md = f"""
{prompt_block}

---

## Task (Markdown)
{task_block}

---

## Diff Summary (JSON)
{diff_block}

---

## Backstop Report
{html_tip}

---

## Optional: Full Backstop JSON (all files)
{full_block if full_block else "_(not included—re-run with --include-full-json to embed)_"}

---
"""
    return md

def main():
    ap = argparse.ArgumentParser(description="Prepare a Claude-ready .md with task + Backstop results (no API calls)")
    ap.add_argument("--task", required=True, help="Path to task markdown (e.g., task-descriptions/task-1-*.md)")
    ap.add_argument("--site-url", default=DEFAULT_SITE_URL, help=f"Base site URL (default: {DEFAULT_SITE_URL})")
    ap.add_argument("--backstop-config", default=DEFAULT_BACKSTOP_CONFIG, help="Path to backstop.json")
    ap.add_argument("--include-full-json", action="store_true", help="Embed all Backstop JSON files into the packet")
    ap.add_argument("--open-report", action="store_true", help="Open Backstop HTML report after run")
    args = ap.parse_args()

    # Ensure out dir
    out_dir = pathlib.Path("out")
    out_dir.mkdir(exist_ok=True)

    # Validate task file
    task_path = args.task
    if not os.path.exists(task_path):
        print(f"Task file not found: {task_path}", file=sys.stderr)
        sys.exit(2)

    # 1) Parse task
    task_info = parse_task_markdown(task_path)

    # 2) Run Backstop
    run_backstop(args.site_url, args.backstop_config)

    # 3) Collect diffs
    diff_summary = collect_diffs(DEFAULT_REPORT_DIR)
    with open("out/diff-summary.json", "w", encoding="utf-8") as f:
        json.dump(diff_summary, f, indent=2)

    # 4) Optional: grab full JSON
    full_json_obj = read_backstop_full_json(DEFAULT_REPORT_DIR) if args.include_full_json else None

    # 5) Build packet .md
    packet = build_packet_md(
        task_path=task_path,
        task_info=task_info,
        diff_summary=diff_summary,
        backstop_html_dir=DEFAULT_HTML_REPORT_DIR,
        include_full_json=args.include_full_json,
        full_json_obj=full_json_obj
    )

    out_md = out_dir / "ai-packet.md"
    out_md.write_text(packet, encoding="utf-8")
    print(f"Wrote: {out_md}")

    if args.open_report:
        # Best-effort open report (Backstop writes an index.html)
        sh("npx backstop openReport", allow_fail=True)

if __name__ == "__main__":
    main()