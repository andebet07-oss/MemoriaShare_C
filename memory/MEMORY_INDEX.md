# Memory System Index

Last consolidation: **2026-04-17T00:00Z** (manual — POV brand pivot lock-in)

This directory holds structured memory for the Memoria project across sessions.

## Files

- **recent-memory.md** — Rolling 48-hour context (last session's decisions, active tasks, design choices)
- **long-term-memory.md** — Distilled facts, patterns, rules, brand language, tech stack constraints
- **project-memory.md** — Active initiative state, deliverables, testing checklist, known issues

## Critical Facts (at-a-glance)

- **BRAND LOCKED (2026-04-17):** POV.camera cool-dark aesthetic. Background `#1e1e1e` (cool-900), primary accent `#7c86e1` (indigo-500), text `#fcfcfe`. Typography: Playfair Display serif headers + Heebo Hebrew body + Montserrat editorial labels. See long-term-memory.md §Design Language.
- **Sub-brand:** Violet `#7c3aed` reserved for MemoriaMagnet admin/print UI only (AdminShell, CreateMagnetEvent, PrintStation, MagnetReview). Share product uses indigo.
- **Dark-mode activation:** Every dark page root MUST include `dark` class. Semantic tokens default to light without it — caused the 2026-04-16 silvery home-page bug.
- **Open HIGH-priority blocker:** `linked_event_id` column still missing from `CLEAN_RESET_SCHEMA.sql` (Stage 1 of wobbly-wobbling-crab plan)
- **Newest subsystem:** Magnet frame system v2 — `framePacks.js` (6 packs) + `FramePicker.jsx`, label-below-photo architecture, `LABEL_H_RATIO = 0.225`

## Usage

At session start, load recent-memory.md into context for continuity.  
Reference long-term-memory.md for rules & patterns.  
Update project-memory.md after each day's work.

## Consolidation

Every night, the `consolidate-memory` task:
1. Reads the day's conversation logs
2. Extracts decisions & facts
3. Updates recent-memory.md
4. Promotes key facts to long-term-memory.md
5. Updates project-memory.md with progress

This keeps memory fresh and prevents context decay across sessions.
