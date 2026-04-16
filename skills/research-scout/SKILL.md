# research-scout Skill

**Purpose:** Hunt for new information that challenges or updates Memoria's existing knowledge. Validate findings, discard redundancy, feed validated learnings into memory.

**Runs:** 3x nightly (6 PM, 11 PM, 3 AM UTC) + weekly review/promotion (Sunday 6 AM UTC)

---

## Nightly Scout (Runs 3x/day)

### Search Query Strategy
Hunt across 5 domains for findings relevant to Memoria:

1. **React 18 + Hooks patterns**
   - Query: `React 18 hooks best practices 2026`
   - Sites: Reddit r/reactjs, HackerNews, dev.to
   - Looking for: new hook patterns, performance gotchas, SSR changes

2. **Tailwind CSS edge cases**
   - Query: `Tailwind CSS responsive design utilities 2026`
   - Sites: HackerNews, dev.to, Tailwind Discord discussion summaries
   - Looking for: new utility classes, responsive strategies, dark mode patterns

3. **Supabase JS v2 updates & gotchas**
   - Query: `Supabase JavaScript client v2 2026 RLS auth realtime`
   - Sites: Reddit r/supabase, HackerNews, Supabase Discord/forums
   - Looking for: breaking changes, performance improvements, security fixes, new patterns

4. **Canvas 2D API edge cases**
   - Query: `HTML5 canvas drawImage font rendering performance 2026`
   - Sites: HackerNews, dev.to, MDN discussions
   - Looking for: font loading gotchas, ImageData performance, memory leaks

5. **WebRTC/getUserMedia on iOS & Android**
   - Query: `WebRTC getUserMedia iOS Safari Android camera constraints 2026`
   - Sites: Reddit r/webdev, dev.to, caniuse blog
   - Looking for: new capability constraints, permission model changes, performance tips

### Validation Algorithm
For each finding:

1. **Confirm it's not already in long-term-memory.md**
   - Read long-term-memory.md (relevant section)
   - Does this fact/pattern already exist? → **DISCARD (redundant)**
   - Does it contradict existing doc? → **FLAG for review, keep if new**

2. **Confirm it's actionable for Memoria**
   - Is it about Memoria's tech stack? (React, Tailwind, Supabase, Canvas, WebRTC)
   - Is it a new best practice, gotcha, or workflow change?
   - Would ignoring it cause a bug or inefficiency?
   - If "no" to all → **DISCARD (not relevant)**

3. **Extract one-line insight**
   - What's the new fact? (e.g., "Supabase JS v2 now auto-retries auth token refresh")
   - What does it change/add? (e.g., "removes need for manual session retry logic")

### Storage Format
Store validated findings in `long-term-memory.md` section `## new_learnings`:

```markdown
## new_learnings (Staging Area)
**Last refreshed:** 2026-04-16T22:00Z | Next review: 2026-04-20T06:00Z (Sunday weekly)

### Finding: {Date} — {Technology}
- **Source:** {URL}
- **Finding:** One-sentence statement of the new fact
- **Relevance:** How does it affect Memoria? One-sentence explanation
- **Action:** What changes? (e.g., "Update X rule in long-term-memory.md")
- **Status:** `pending-review` (waiting for weekly promotion)

---
```

---

## Weekly Promotion (Runs Sunday 6 AM UTC)

### Review Workflow
1. **Read new_learnings section** in long-term-memory.md
2. For each finding:
   - Is it confirmed? (check source URL once more, validate claim)
   - Is it contradicted by recent work? (read recent-memory.md, check git log)
   - Should it be promoted? (does it deserve a permanent place in rules/patterns?)

3. **Promote confirmed findings:**
   - If it's a new rule → add to "Tech Stack Rules" or "Component Structure Rules"
   - If it's a gotcha → add to "Common Pitfalls"
   - If it's a pattern → add to relevant section (Design Language, Auth Model, etc.)
   - Update timestamp: `updated: YYYY-MM-DDTHH:00Z`

4. **Discard invalidated findings:**
   - If contradicted or proven wrong → delete from new_learnings

5. **Clear staging:**
   - Archive old findings (>7 days, not promoted) to a dated `.archive` section
   - Reset new_learnings to empty (ready for next week's hunt)

---

## Example Finding (Validation & Promotion)

**Nightly hunt discovers:**
```
Reddit r/reactjs: "Avoid useCallback with empty deps array — it prevents memoization gains"
Source: https://reddit.com/r/reactjs/posts/xyz
```

**Validation:**
1. ✅ Not in long-term-memory.md
2. ✅ Relevant to Memoria (we use useCallback extensively)
3. ✅ Actionable (code review needed)

**Stored in new_learnings:**
```markdown
### Finding: 2026-04-16 — React useCallback
- **Source:** https://reddit.com/r/reactjs/posts/xyz
- **Finding:** useCallback with empty deps prevents compiler optimization in React 18.3+
- **Relevance:** Memoria has several useCallback(fn, []) calls that may be blocking memoization
- **Action:** Review src/hooks/*.js for empty-deps useCallback; replace with useMemo(fn) or move to module scope
- **Status:** `pending-review`
```

**Weekly promotion (Sunday):**
- Verify claim: Check React 18.3 release notes ✅
- Promote to "Common Pitfalls":
  ```markdown
  - **useCallback empty deps:** React 18.3+ doesn't memoize `useCallback(fn, [])`. Either use `useMemo(() => fn, [])` or move `fn` to module scope.
  ```
- Add code review task to project-memory.md
- Delete from new_learnings

---

## Implementation Notes

### Search Sources
- **Reddit:** Use `site:reddit.com/r/{subreddit}` queries (r/reactjs, r/supabase, r/webdev, r/learnprogramming)
- **HackerNews:** `site:news.ycombinator.com`
- **Dev.to:** `site:dev.to`
- **Quora:** `site:quora.com` (last resort, often lower signal)
- **MDN:** `site:developer.mozilla.org` (for Canvas, WebRTC)

### Deduplication
- Before storing, search new_learnings for similar findings (same tech, same month)
- If duplicate → merge into single entry, update sources list

### False Positive Prevention
- Ignore opinionated blog posts ("why I prefer X over Y") unless backed by data
- Ignore outdated posts (>6 months old unless re-confirmed by new source)
- Ignore "how to" tutorials (unless they reveal a gotcha or new pattern)
- Verify claims in official docs before promoting

### Frequency Tuning
- 3x nightly allows breadth; Sunday weekly review allows depth
- If new_learnings accumulates >10 findings per week → reduce search scope
- If <2 findings per month → expand search terms or add new domains

---

## Checklist (Weekly Review)

- [ ] Read all findings in new_learnings
- [ ] Verify source URL for each
- [ ] Check if contradicted by recent work (recent-memory.md, git log)
- [ ] Promote confirmed findings to main memory sections
- [ ] Delete invalidated findings
- [ ] Archive unpromoted findings >7 days old
- [ ] Clear new_learnings staging section
- [ ] Update "Last refreshed" timestamp in header
- [ ] Notify Efi if any finding requires code changes

---

*Research-scout skill v1. Runs autonomously. Weekly human review layer.*
