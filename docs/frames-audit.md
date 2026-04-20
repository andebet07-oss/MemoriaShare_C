# Frames Library — Rubric Audit Baseline
**Date:** 2026-04-20  
**Scope:** All 30 frames in `framePacks.js` / `frames_meta` table  
**Rubric:** 7 criteria × 5 pts = 35 max · Publish threshold ≥ 26 · Hard-fail: score = 0 on any of {composition, typography, print_safety, originality, export_readiness}

---

## Before / After Summary

| State | Approved (status) | Archived (status) | Has rubric_scores |
|-------|:-----------------:|:-----------------:|:-----------------:|
| **Before** (2026-04-20 pre-hardening) | 25 | 5 | 5 (archived only) |
| **After** (2026-04-20 post-hardening) | 25 | 5 | **30 (all)** |

No status changes resulted from this audit. All 25 currently-approved frames score ≥ 26 with no hard-fail zeros.  
All 5 currently-archived frames score < 26 with no hard-fail zeros (archived for quality, not catastrophic failure).

---

## Methodology

Approved frames received **uniform baseline rubric scores** computed from the known editorial aggregate:

```
base = floor(Q / 7)
remainder = Q mod 7
criteria bumped: composition → typography → print_safety → originality → export_readiness → aesthetic → event_fit
```

These are *editorial baseline* scores. Each frame should be independently scored via the moderation queue (`/admin/frames/moderation`) before the baseline label is removed.  
DB column `notes` is set to `'baseline_uniform — ממתין לסקירה בתור המודרציה'` for all backfilled rows.

Archived frames received **hand-assigned per-criterion scores** reflecting documented failure reasons (see Section 3).

---

## Section 1 — Approved Frames (25)

All pass: total ≥ 26, no hard-fail criterion scored 0.

| Frame ID | Category | Style | Q | Pass? | Notes |
|----------|----------|-------|:-:|:-----:|-------|
| wedding-editorial | wedding | minimal_luxury | 33 | ✓ | Top editorial score [5,5,5,5,5,4,4] |
| wedding-monogram | wedding | modern_editorial | 31 | ✓ | Baseline [5,5,5,4,4,4,4] |
| wedding-hairline-crest | wedding | minimal_luxury | 31 | ✓ | Baseline [5,5,5,4,4,4,4] |
| bar-hebrew-classic | bar_mitzvah | modern_editorial | 31 | ✓ | Baseline [5,5,5,4,4,4,4] |
| wedding-emerald | wedding | modern_editorial | 30 | ✓ | Baseline [5,5,4,4,4,4,4] |
| wedding-burgundy | wedding | modern_editorial | 30 | ✓ | Baseline [5,5,4,4,4,4,4] |
| bar-royal | bar_mitzvah | modern_editorial | 30 | ✓ | Baseline [5,5,4,4,4,4,4] |
| bar-tallit | bar_mitzvah | modern_editorial | 30 | ✓ | Baseline [5,5,4,4,4,4,4] |
| brit-elegant | brit | minimal_luxury | 30 | ✓ | Baseline [5,5,4,4,4,4,4] |
| corp-executive | corporate | minimal_luxury | 30 | ✓ | Baseline [5,5,4,4,4,4,4] |
| wedding-arch | wedding | modern_editorial | 29 | ✓ | Baseline [5,4,4,4,4,4,4] |
| wedding-botanical | wedding | minimal_luxury | 29 | ✓ | Baseline [5,4,4,4,4,4,4] |
| wedding-polaroid-tape | wedding | festive_chic | 29 | ✓ | Baseline [5,4,4,4,4,4,4] |
| wedding-deco-gold | wedding | festive_chic | 29 | ✓ | Baseline [5,4,4,4,4,4,4] |
| bar-jerusalem | bar_mitzvah | modern_editorial | 29 | ✓ | Baseline [5,4,4,4,4,4,4] |
| general-cinema | general | modern_editorial | 29 | ✓ | Baseline [5,4,4,4,4,4,4] |
| wedding-classic | wedding | minimal_luxury | 28 | ✓ | Baseline [4,4,4,4,4,4,4] |
| bat-rose | bar_mitzvah | modern_editorial | 28 | ✓ | Baseline [4,4,4,4,4,4,4] |
| brit-boy | brit | modern_editorial | 28 | ✓ | Baseline [4,4,4,4,4,4,4] |
| brit-mint | brit | minimal_luxury | 28 | ✓ | Baseline [4,4,4,4,4,4,4] |
| general-minimal | general | minimal_luxury | 28 | ✓ | Baseline [4,4,4,4,4,4,4] |
| general-filmstrip | general | festive_chic | 28 | ✓ | Baseline [4,4,4,4,4,4,4] |
| birthday-scrapbook | birthday | festive_chic | 27 | ✓ | Baseline [4,4,4,4,4,4,3] |
| corp-gradient | corporate | modern_editorial | 27 | ✓ | Baseline [4,4,4,4,4,4,3] |
| birthday-party | birthday | festive_chic | 26 | ✓ | Borderline pass [4,4,4,4,4,3,3] — recommend per-criterion review |

---

## Section 2 — Archived Frames (5)

All fail: total < 26. No hard-fail zeros (archived for quality deficit, not catastrophic failure).

| Frame ID | Q | Total < 26? | Failure reason |
|----------|:-:|:-----------:|----------------|
| bar-retro | 16 | ✓ (16 < 26) | Retro aesthetic off-brand; weak composition (2) and typography (2); export quality marginal (2). Scores: [2,2,3,2,2,2,3] |
| bar-electric | 18 | ✓ (18 < 26) | Electric/neon palette doesn't fit Magnet brand; weak composition (2) and originality (2); aesthetic (2) poor. Scores: [2,3,3,2,3,2,3] |
| birthday-neon | 19 | ✓ (19 < 26) | Neon color scheme conflicts with brand palette; low aesthetic (2) and originality (2). Scores: [3,3,3,2,3,2,3] |
| wedding-romance | 20 | ✓ (20 < 26) | Generic composition (3) and weak typography (2); low originality (2); doesn't differentiate from stock. Scores: [3,2,3,2,3,4,3] |
| birthday-pastel | 22 | ✓ (22 < 26) | Closest to threshold. Weak originality (3) and composition (3); acceptable but not distinctive enough for premium service. Scores: [3,3,3,3,3,4,3] |

> **Rehabilitation path:** Any archived frame can be re-evaluated via `/admin/frames/moderation`. A per-criterion rescore ≥ 26 with no hard-fail zeros enables promotion to `in_review` → `approved`. The rubric tool enforces this gate; manual status override to `approved` without a passing rubric is blocked in `FrameDetailPanel`.

---

## Section 3 — Completeness Check

Expected complete archive set based on quality scores < 26 in editorial baseline:

| Should be archived (Q < 26) | Status | ✓/✗ |
|---------------------------|--------|-----|
| bar-retro (16) | archived | ✓ |
| bar-electric (18) | archived | ✓ |
| birthday-neon (19) | archived | ✓ |
| wedding-romance (20) | archived | ✓ |
| birthday-pastel (22) | archived | ✓ |

No other frames have Q < 26. The archived set is complete and correct.

---

## Section 4 — RLS Enforcement

| User type | Rows visible | Policy |
|-----------|:-----------:|--------|
| Anonymous / non-admin | 25 (approved only) | `frames_meta_select_approved`: `USING (status = 'approved')` |
| Admin (`is_admin() = true`) | 30 (all) | `frames_meta_select_admin`: `USING (is_admin())` |

RLS policies are OR'd by Postgres. Admin satisfies policy 2 and sees all rows.

---

## Section 5 — Source-of-Truth Boundaries

| Path | Primary source | Fallback |
|------|---------------|---------|
| Admin FramesLibrary | `frames_meta` table via `useFramesMeta()` | `framesMeta.js` (on DB error) |
| Admin FrameDetailPanel | `frames_meta` table via `meta` prop | `framesMeta.js` (on DB error) |
| Admin ModerationQueue | `frames_meta` table via `useFramesMeta()` | `framesMeta.js` (on DB error) |
| Guest MagnetReview (frame resolve) | `frames_meta` table via `memoriaService.frameMeta.getById()` | `framesMeta.js` (on DB error) |
| Guest MagnetReview (drawing) | `framePacks.js` `drawFrame()` functions (always code) | — (no fallback; code is authoritative) |
| Frame rendering definitions | `framePacks.js` (always code) | never moved to DB |

`framesMeta.js` is a **read-only fallback seed**. Admin writes go to DB only.
