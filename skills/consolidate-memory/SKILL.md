# Skill: consolidate-memory

Reads the last 24 hours of conversation logs, extracts key decisions and facts,
and updates the three memory files in `memory/`.

---

## Steps

### 1. Find recent logs

```bash
# On Windows (Git Bash / bash)
LOG_DIR="$HOME/.claude/projects/c--Users-tagab-MemoriaShare"
CUTOFF=$(date -d '24 hours ago' +%s 2>/dev/null || date -v-24H +%s)

# List JSONL files modified in the last 24 hours
find "$LOG_DIR" -name "*.jsonl" -newer <(date -d '24 hours ago') 2>/dev/null \
  || find "$LOG_DIR" -name "*.jsonl" -mmin -1440
```

### 2. Extract conversation text

Read the JSONL files. Each line is a JSON object. Extract entries where
`role == "user"` or `role == "assistant"` and collect the `content` text.

Filter to only entries from the last 24 hours (check `timestamp` field if present).

### 3. Analyze with this extraction prompt

Send the collected text to Claude with this prompt:

```
You are a memory consolidation agent. Read this conversation excerpt and extract:

1. KEY DECISIONS — architectural, design, or product choices made
2. USER PREFERENCES — explicit likes/dislikes, style choices, workflow preferences
3. FACTS LEARNED — new technical facts, constraints, or capabilities discovered
4. PROBLEMS SOLVED — bugs fixed, issues resolved, workarounds found
5. PENDING WORK — tasks explicitly deferred or left incomplete
6. FILES CHANGED — list of files modified and what changed

Be concise. Use short bullet points. Only include non-obvious things worth remembering.
Do not include things already well-known (basic React patterns, Tailwind usage, etc.).

CONVERSATION:
[paste conversation text here]
```

### 4. Update recent-memory.md

- Prepend a new `## Session YYYY-MM-DD` section with today's extracted facts
- Keep only the last 48 hours of sessions (remove older entries)
- Format:
  ```markdown
  ## Session 2026-04-17

  ### [Category from extraction]
  - bullet point
  - bullet point
  ```

### 5. Promote to long-term-memory.md

For each extracted item, decide if it should be promoted to long-term:

**Promote if:**
- A preference was expressed (UI, code style, workflow)
- An anti-pattern was discovered (something that failed/looked bad)
- A hard technical constraint was found
- A recurring pattern was validated

**Do NOT promote if:**
- It's a one-time task detail
- It's already captured in long-term memory
- It's about a specific file path or function name (too volatile)

Merge into the appropriate section of `long-term-memory.md`. Do not duplicate.

### 6. Update project-memory.md

- Update "Last build" status
- Update "Recent File Changes" table with today's changes
- Update "Known Issues" — mark resolved items, add new ones
- Update stage completion status in the Active Plan table

### 7. Report

Print a summary:
```
✅ Memory consolidated (YYYY-MM-DD HH:MM)
   Recent: N new facts added, X sessions kept
   Long-term: N items promoted
   Project: build status updated, N issues updated
```

---

## Invocation

Run interactively:
```
/consolidate-memory
```

Run via script (requires ANTHROPIC_API_KEY):
```bash
cd /c/Users/tagab/MemoriaShare
python scripts/consolidate-memory.py
```
