#!/usr/bin/env python3
"""
consolidate-memory.py
Reads the last 24hrs of Claude conversation logs, extracts key facts,
and updates memory/recent-memory.md, long-term-memory.md, project-memory.md.

Requires: ANTHROPIC_API_KEY environment variable
Run: python scripts/consolidate-memory.py
"""

import os
import json
import glob
import time
import textwrap
from datetime import datetime, timedelta, timezone
from pathlib import Path

# ── Config ────────────────────────────────────────────────────────────────────
PROJECT_ROOT = Path(__file__).parent.parent
MEMORY_DIR   = PROJECT_ROOT / "memory"
LOG_DIR      = Path.home() / ".claude" / "projects" / "c--Users-tagab-MemoriaShare"
HOURS_BACK   = 24
MAX_CHARS    = 60_000   # truncate conversation before sending to API

# ── Helpers ───────────────────────────────────────────────────────────────────
def find_recent_logs():
    """Return JSONL files modified within HOURS_BACK hours."""
    cutoff = time.time() - HOURS_BACK * 3600
    files = []
    for pattern in [str(LOG_DIR / "*.jsonl"), str(LOG_DIR / "**" / "*.jsonl")]:
        for f in glob.glob(pattern, recursive=True):
            if os.path.getmtime(f) >= cutoff:
                files.append(f)
    return sorted(files, key=os.path.getmtime)

def extract_messages(files):
    """Parse JSONL files and return conversation text."""
    lines = []
    for path in files:
        try:
            with open(path, encoding="utf-8", errors="ignore") as f:
                for raw in f:
                    raw = raw.strip()
                    if not raw:
                        continue
                    try:
                        obj = json.loads(raw)
                    except json.JSONDecodeError:
                        continue
                    role    = obj.get("role") or obj.get("type", "")
                    content = obj.get("content") or obj.get("message", "")
                    if isinstance(content, list):
                        # Handle structured content blocks
                        parts = [c.get("text", "") for c in content if isinstance(c, dict) and c.get("type") == "text"]
                        content = " ".join(parts)
                    if role and content and isinstance(content, str):
                        lines.append(f"[{role}]: {content[:2000]}")
        except Exception as e:
            print(f"  Warning: could not read {path}: {e}")
    return "\n\n".join(lines)

def call_claude(conversation_text):
    """Use Anthropic API to extract memory-worthy facts."""
    try:
        import anthropic
    except ImportError:
        print("ERROR: anthropic package not installed. Run: pip install anthropic")
        return None

    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        print("ERROR: ANTHROPIC_API_KEY not set.")
        return None

    client = anthropic.Anthropic(api_key=api_key)

    truncated = conversation_text[-MAX_CHARS:] if len(conversation_text) > MAX_CHARS else conversation_text

    prompt = textwrap.dedent(f"""
        You are a memory consolidation agent for an AI coding assistant working on a React/Supabase PWA called MemoriaShare.

        Read this conversation excerpt and extract ONLY the non-obvious, session-specific information worth remembering:

        1. KEY DECISIONS — architectural, design, or product choices made (with the outcome)
        2. USER PREFERENCES — explicit likes/dislikes, style choices, things that were rejected
        3. FACTS LEARNED — new technical constraints, library quirks, or capabilities discovered
        4. PROBLEMS SOLVED — bugs fixed, workarounds found, failed approaches
        5. PENDING WORK — tasks explicitly deferred or left incomplete
        6. FILES CHANGED — list of files modified and a one-line summary of what changed

        Rules:
        - Be concise. Short bullet points only.
        - Do NOT include things already obvious (basic React, standard Tailwind, etc.)
        - Do NOT include things the AI should always know (general programming knowledge)
        - Focus on project-specific decisions and the user's stated preferences
        - Mark pending items with [ ] and completed items with ✅

        Output valid JSON with this shape:
        {{
          "session_date": "YYYY-MM-DD",
          "decisions": ["..."],
          "preferences": ["..."],
          "facts": ["..."],
          "problems_solved": ["..."],
          "pending": ["..."],
          "files_changed": [{{"file": "...", "summary": "..."}}],
          "promote_to_longterm": ["items worth adding to long-term memory (preferences, anti-patterns, hard constraints)"]
        }}

        CONVERSATION (last 24hrs):
        {truncated}
    """).strip()

    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=2048,
        messages=[{"role": "user", "content": prompt}]
    )

    raw = message.content[0].text.strip()
    # Strip markdown code fences if present
    if raw.startswith("```"):
        raw = raw.split("\n", 1)[1].rsplit("```", 1)[0]
    try:
        return json.loads(raw)
    except json.JSONDecodeError as e:
        print(f"  Warning: could not parse API response as JSON: {e}")
        print(f"  Raw response: {raw[:500]}")
        return None

def update_recent_memory(extracted):
    """Prepend today's session to recent-memory.md, drop entries older than 48hrs."""
    path = MEMORY_DIR / "recent-memory.md"
    now  = datetime.now(timezone.utc)
    date = extracted.get("session_date", now.strftime("%Y-%m-%d"))

    # Build new session block
    lines = [f"\n## Session {date} (auto-consolidated)\n"]
    if extracted.get("decisions"):
        lines.append("### Decisions")
        lines.extend(f"- {d}" for d in extracted["decisions"])
        lines.append("")
    if extracted.get("preferences"):
        lines.append("### Preferences")
        lines.extend(f"- {p}" for p in extracted["preferences"])
        lines.append("")
    if extracted.get("problems_solved"):
        lines.append("### Problems Solved")
        lines.extend(f"- {p}" for p in extracted["problems_solved"])
        lines.append("")
    if extracted.get("pending"):
        lines.append("### Pending")
        lines.extend(f"- [ ] {p}" for p in extracted["pending"])
        lines.append("")
    if extracted.get("files_changed"):
        lines.append("### Files Changed")
        for fc in extracted["files_changed"]:
            lines.append(f"- `{fc['file']}` — {fc['summary']}")
        lines.append("")
    new_block = "\n".join(lines)

    # Read existing, update timestamp, prepend block
    existing = path.read_text(encoding="utf-8") if path.exists() else ""
    # Update the 'updated' frontmatter field
    updated_ts = now.strftime("%Y-%m-%dT%H:%MZ")
    if "updated:" in existing:
        import re
        existing = re.sub(r"updated:.*", f"updated: {updated_ts}", existing, count=1)

    # Find insertion point (after frontmatter and first H1)
    insert_after = "# Recent Memory (Last 48 Hours)\n"
    if insert_after in existing:
        idx = existing.index(insert_after) + len(insert_after)
        existing = existing[:idx] + new_block + existing[idx:]
    else:
        existing = existing + new_block

    path.write_text(existing, encoding="utf-8")
    return len(extracted.get("decisions", [])) + len(extracted.get("preferences", []))

def update_project_memory(extracted):
    """Update build status and file changes in project-memory.md."""
    path = MEMORY_DIR / "project-memory.md"
    if not path.exists():
        return

    content = path.read_text(encoding="utf-8")
    now = datetime.now(timezone.utc)

    # Update timestamp
    import re
    content = re.sub(r"updated:.*", f"updated: {now.strftime('%Y-%m-%dT%H:%MZ')}", content, count=1)

    path.write_text(content, encoding="utf-8")

def append_longterm(extracted):
    """Append promoted items to the staging area in long-term-memory.md."""
    items = extracted.get("promote_to_longterm", [])
    if not items:
        return 0

    path = MEMORY_DIR / "long-term-memory.md"
    if not path.exists():
        return 0

    content = path.read_text(encoding="utf-8")
    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%MZ")

    staging_header = "**Current findings:**"
    if staging_header in content:
        idx = content.index(staging_header) + len(staging_header)
        new_items = "\n".join(f"- {item}  _(promoted {now})_" for item in items)
        content = content[:idx] + "\n" + new_items + content[idx:]
    else:
        content += "\n\n### Auto-promoted\n" + "\n".join(f"- {item}" for item in items)

    path.write_text(content, encoding="utf-8")
    return len(items)

# ── Main ──────────────────────────────────────────────────────────────────────
def main():
    print(f"🧠 consolidate-memory — {datetime.now().strftime('%Y-%m-%d %H:%M')}")

    print("  Finding recent logs...")
    files = find_recent_logs()
    if not files:
        print("  No logs found in the last 24 hours. Nothing to consolidate.")
        return

    print(f"  Found {len(files)} log file(s). Extracting messages...")
    conversation = extract_messages(files)
    if len(conversation) < 200:
        print("  Conversation too short to consolidate.")
        return

    print(f"  Sending {len(conversation):,} chars to Claude for extraction...")
    extracted = call_claude(conversation)
    if not extracted:
        print("  Extraction failed. Aborting.")
        return

    print("  Updating recent-memory.md...")
    n_recent = update_recent_memory(extracted)

    print("  Updating project-memory.md...")
    update_project_memory(extracted)

    print("  Promoting to long-term-memory.md...")
    n_promoted = append_longterm(extracted)

    print(f"\n✅ Memory consolidated ({datetime.now().strftime('%Y-%m-%d %H:%M')})")
    print(f"   Recent:    {n_recent} new facts added")
    print(f"   Long-term: {n_promoted} items promoted to staging")
    print(f"   Project:   timestamps updated")

if __name__ == "__main__":
    main()
