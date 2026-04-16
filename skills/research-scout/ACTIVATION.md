# Research Scout — Activation Log

**Status:** 🟢 Active (2026-04-16T20:00Z)

Research-scout skill is now hunting for new information that challenges or updates Memoria's documented knowledge.

---

## Schedule

| Task | Time | Frequency | Purpose |
|------|------|-----------|---------|
| `research-scout-nightly` | 10:03 PM daily | Every day | Hunt for new findings across React, Tailwind, Supabase, Canvas, WebRTC |
| `research-scout-weekly-promotion` | 6:03 AM | Sunday only | Review week's findings, promote to main memory, clear staging |

---

## Search Domains (Daily)

1. **React 18 + Hooks** — r/reactjs, HackerNews, dev.to
2. **Tailwind CSS** — HackerNews, dev.to, Tailwind forums
3. **Supabase JS v2** — r/supabase, HackerNews, Supabase forums
4. **Canvas 2D API** — HackerNews, dev.to, MDN discussions
5. **WebRTC/getUserMedia** — r/webdev, dev.to, caniuse

---

## Findings Storage

**Location:** `memory/long-term-memory.md` → `## new_learnings` section

**Entry format:**
```markdown
### Finding: YYYY-MM-DD — {Technology}
- **Source:** {URL}
- **Finding:** One-sentence fact
- **Relevance:** One-sentence impact on Memoria
- **Action:** What should change?
- **Status:** pending-review
```

**Validation rules:**
- ❌ Already in long-term-memory.md
- ❌ Not actionable for Memoria
- ❌ Opinionated without data
- ❌ >6 months old (unless re-confirmed)
- ✅ From credible source (official docs, HackerNews, Reddit, dev.to)
- ✅ New fact or pattern discovered in last week

---

## Weekly Promotion Workflow (Sunday 6 AM)

1. **Verify** each finding against source + recent work
2. **Promote** confirmed findings to main sections (Rules, Pitfalls, Patterns)
3. **Archive** unpromoted findings >7 days old
4. **Clear** new_learnings staging section
5. **Report** to Efi: findings promoted, any urgent code changes, contradictions resolved

---

## Quality Gates

**Before promoting a finding:**
- [ ] Source URL verified (claim still accurate)
- [ ] Not contradicted by recent work (check recent-memory.md + git)
- [ ] Coherent with existing rules (no conflicts)
- [ ] Actionable for Memoria (not just trivia)

**Before deleting a finding:**
- [ ] Source marked as stale (>6 months, not re-confirmed)
- [ ] OR contradicted by recent work + verified
- [ ] OR found to be opinionated without data

---

## Examples (Activation Phase)

### Example Finding (Will Come Naturally)
```markdown
### Finding: 2026-04-20 — React useCallback
- **Source:** https://reddit.com/r/reactjs/posts/xyz
- **Finding:** useCallback with empty deps prevents compiler optimization in React 18.3+
- **Relevance:** Memoria has several useCallback(fn, []) patterns that block memoization
- **Action:** Code review src/hooks/*.js; replace with useMemo or move to module scope
- **Status:** pending-review
```

**Weekly promotion:**
- Verify claim in React 18.3 release notes ✅
- Promote to "Common Pitfalls" in long-term-memory.md
- Add code review task to project-memory.md
- Delete from new_learnings

---

## Metrics & Tuning

**Target:** 2-4 validated findings per nightly hunt (quality > quantity)

**Adjustments:**
- If findings >10/week: reduce search scope (fewer queries)
- If findings <2/week: expand search terms (new domains/keywords)
- If false positive rate >20%: tighten validation rules

---

## Current Week's Findings

*Activation: 2026-04-16T20:00Z*
*First nightly hunt: 2026-04-16 at 10:03 PM*
*First weekly review: 2026-04-20 at 6:03 AM (Sunday)*

(Findings will populate after first nightly hunt)

---

## Integration with Memory System

Research-scout feeds into the 3-layer memory system:
- **new_learnings** (this week's raw findings)
- → **long-term-memory.md** (promoted patterns, rules, gotchas)
- ← **recent-memory.md** (context for validation: recent work, decisions, code changes)

**Nightly:** Scout hunts, stores validated findings in new_learnings
**Weekly:** Promotion task validates, promotes, clears
**Daily (10 PM):** consolidate-memoria-memory task extracts session decisions, updates recent-memory
**Manual:** Efi adds findings during sessions as they work

---

## Coordinator Pattern

Both `consolidate-memoria-memory` (10 PM) and `research-scout-nightly` (10 PM) run at the same time:
- Consolidate extracts **internal** knowledge (session decisions, design choices)
- Scout hunts **external** knowledge (industry patterns, breaking changes, new tools)

Together, they keep memory fresh and prevents knowledge decay.

---

*Research-scout activated 2026-04-16 by @Dev during memory system buildout.*
