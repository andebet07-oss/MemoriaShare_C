# Memoria Memory System

Persistent memory layer for cross-session context continuity. Automatically consolidates daily.

## Quick Start

**At session start:**
1. Read `recent-memory.md` (last 48 hours of context)
2. Skim `long-term-memory.md` (rules & patterns)
3. Check `project-memory.md` (current task status)

**During work:**
- Make decisions → log them immediately in recent-memory.md under the current session
- Discover patterns → add to long-term-memory.md
- Reach milestone → update project-memory.md with progress (✓)

**After each day:**
- Run manual consolidation (see Consolidation section below)
- OR let the nightly task handle it automatically at 10 PM

---

## Files Explained

### recent-memory.md
**Rolling 48-hour context.** Captures decisions, designs, and active tasks from the last session(s).

Example:
```markdown
## Session 2026-04-16 — Architecture Planning
- User rejected 10-day estimate, wants 3-day plan
- Compressed timeline: Day 1 routes, Day 2 admin hub, Day 3 polish
- Frame redesign complete (24 frames, premium fonts)
```

**When to update:** After completing a feature or making a key decision.  
**When to archive:** If entry is >48 hours old, move to long-term-memory.md.

### long-term-memory.md
**Distilled facts, patterns, rules.** This is the knowledge base.

Sections:
- **User Collaboration Style** — Efi's preferences (fast execution, quality-focused, Hebrew UI, English code)
- **Product Architecture** — Dual product (Share + Magnet), separation principle, RLS as security
- **Design Language** — Brand colors, typography, aesthetic rules
- **Tech Stack Rules** — React, Tailwind, Supabase, auth patterns (NON-NEGOTIABLE)
- **Component Structure** — 200-line max, custom hooks, error handling patterns
- **Common Pitfalls** — Canvas rendering, camera full-screen, memory leaks, frame design
- **Deploy & Git** — Branch strategy, commit messages, Vercel auto-deploy
- **File Map** — Key paths (PRD, schema, service files)

**When to update:** When a new rule emerges or a pattern is discovered.  
**Immutable rules:** Tech stack, component structure, security patterns.

### project-memory.md
**Active initiative state.** Task breakdowns, deliverables, testing checklists.

Sections:
- **Current Initiative** — Goal, timeline, status
- **Day-by-day breakdown** — What files to modify, routes to define, deliverables
- **Completed work** — Checkmarks (✅) for finished features
- **Known issues & TODOs** — Blockers, edge cases, RLS verification tasks
- **Testing scenarios** — QA checklist (guests, admins, RLS, mobile, offline)

**When to update:** 
- Before starting a day (review plan)
- After completing a day (update deliverable status, note blockers)
- When discovering a new issue (add to TODOs)

---

## Consolidation Workflow

### Automatic (Nightly, 10 PM)
Scheduled task `consolidate-memoria-memory` runs every night:
1. Reviews past 24 hours of decisions & designs
2. Extracts new patterns
3. Updates recent-memory.md with fresh session summary
4. Promotes key facts to long-term-memory.md
5. Updates project-memory.md with progress

You'll get a notification when it completes.

### Manual (After Major Work Blocks)
When you finish a feature or day's work:

1. **Extract decisions**
   - What did I build? (specific files, logic)
   - Why did I build it that way? (constraints, user request, pattern)
   - What did I learn? (new rule, gotcha, optimization)

2. **Update recent-memory.md**
   - Add session header: `## Session YYYY-MM-DD — {Feature Name}`
   - List decisions under that session
   - Example:
     ```markdown
     ## Session 2026-04-16 — Architecture Refactor Day 1
     - Created App.jsx routes (explicit <Routes>, not dynamic)
     - Built ProtectedRoute component (checks role + event_type)
     - Renamed Dashboard.jsx → HostDashboard.jsx
     - Pattern: Use type-aware conditionals, not separate code paths
     ```

3. **Promote to long-term-memory.md** (if pattern is new or important)
   - Is this a rule? → Add to "Tech Stack Rules" or "Component Structure Rules"
   - Is this a gotcha? → Add to "Common Pitfalls"
   - Is this a user preference? → Add to "User Collaboration Style"

4. **Update project-memory.md**
   - Mark completed tasks with ✅
   - Add new blockers to "Known Issues & TODOs"
   - Update timeline if estimates change

5. **Clean up old entries**
   - Remove items >48 hours old from recent-memory.md (move to long-term if important)
   - Delete outdated TODOs from project-memory.md

---

## Memory Decay Prevention

**Why consolidation matters:**
- **Without it:** Memory context decays. Future sessions forget why decisions were made. Patterns repeat. Knowledge spreads across multiple files.
- **With it:** Each session starts with fresh context. Rules stay consistent. Patterns are recognized early.

**Consolidation prevents:**
- Hallucinating past decisions
- Forgetting user preferences
- Breaking established tech patterns
- Repeating solved problems
- Losing decision rationale

---

## Example: Consolidation in Action

**Before (session ends, memory is scattered):**
```
Chat history: "Created ProtectedRoute, moved Dashboard to HostDashboard, defined routes..."
Recent memory: Generic session notes
Long-term memory: Outdated info about old component structure
```

**Consolidation runs (10 PM task):**
- Extracts: "ProtectedRoute pattern for role-based access, type-aware routing (event_type=share vs magnet)"
- Updates recent-memory.md: Clear session summary with decisions
- Promotes to long-term: "Pattern: Use ProtectedRoute for role + type checks" → long-term-memory.md
- Updates project-memory.md: "Day 1 routing foundation ✅ complete"

**Next session starts:**
- Reads recent-memory.md: "Oh, Day 1 is done. ProtectedRoute is live. Now starting Day 2 (admin hub)."
- Skims long-term: Sees new pattern about type-aware routing, doesn't repeat old mistakes
- Reads project-memory.md: "Today's task is AdminHub + AdminEventDetail. Here's the checklist."
- Execution is fast, decisions are informed, no context loss.

---

## When Memory Is Stale

**Signs:**
- A fact in memory contradicts current code → code changed, memory didn't
- A pattern isn't being applied → rule wasn't clear or wasn't promoted well
- You're re-solving a problem → pattern wasn't distilled to long-term
- Entries are >48 hours old → need consolidation

**Fix:**
1. Update the memory file to match reality
2. Run manual consolidation (or wait for nightly task)
3. Re-read the updated memory file to refresh context

---

## Files to Modify (Never edit these directly into memory — let consolidation handle it)
- CLAUDE.md (project rules, already updated to reference memory)
- PRD.md (product spec, linked from memory, not copied)
- CLEAN_RESET_SCHEMA.sql (DB schema, linked from memory, not copied)

**Memory files are the ONLY place to record decisions & patterns.**

---

*Memory system created: 2026-04-16. Consolidated nightly. Last updated by automated task.*
