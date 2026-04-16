# Memory System Index

This directory holds structured memory for the Memoria project across sessions.

## Files

- **recent-memory.md** — Rolling 48-hour context (last session's decisions, active tasks, design choices)
- **long-term-memory.md** — Distilled facts, patterns, rules, brand language, tech stack constraints
- **project-memory.md** — Active initiative state, deliverables, testing checklist, known issues

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
