# MEMORIA V2 — Dual-Product Architecture

> **Status: Awaiting approval. No functional code will be written until this document is approved.**

---

## Acknowledgement

This document confirms understanding of the dual-product business logic:

- **MemoriaShare (Product A)** — Self-service. Users create digital photo albums. Existing flow is stable and must not be altered.
- **MemoriaMagnet (Product B)** — Managed premium B2B service. Admin creates events. Guests send photos to print (not to a digital gallery). Strict per-device print quotas. Real-time status tracking. Operator Print Station dashboard.

All UI text remains in Hebrew. All code, variables, and documentation in English. Tailwind CSS + iOS aesthetic maintained throughout.

---

## 1. Database Schema Changes

### 1a. Alter `events` table — 3 new columns

```sql
ALTER TABLE events
  ADD COLUMN event_type TEXT NOT NULL DEFAULT 'share'
    CHECK (event_type IN ('share', 'magnet')),
  ADD COLUMN overlay_frame_url TEXT,
  ADD COLUMN print_quota_per_device INTEGER NOT NULL DEFAULT 3;
```

- `DEFAULT 'share'` ensures zero existing rows break.
- `overlay_frame_url` — storage path to the PNG frame composited at print time (Magnet only).
- `print_quota_per_device` — max print jobs per anonymous guest user (Magnet only).
- **Required code patch:** `memoriaService.events.create()` currently strips `event_type` as a form-only field. It must be allowed through for Magnet event creation.

---

### 1b. New table: `leads`

```sql
CREATE TABLE leads (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name   TEXT        NOT NULL,
  phone       TEXT        NOT NULL,
  event_date  DATE,
  details     TEXT,
  status      TEXT        NOT NULL DEFAULT 'new'
                CHECK (status IN ('new', 'contacted', 'converted', 'closed')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Anyone (including anonymous guests) can submit a lead
CREATE POLICY leads_insert_public ON leads FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Only admin can read or update leads
CREATE POLICY leads_select_admin ON leads FOR SELECT USING (is_admin());
CREATE POLICY leads_update_admin ON leads FOR UPDATE USING (is_admin());
```

---

### 1c. New table: `print_jobs`

```sql
CREATE TABLE print_jobs (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id       UUID        NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  photo_id       UUID        NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
  guest_user_id  UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  status         TEXT        NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending', 'printing', 'ready', 'rejected')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_print_jobs_event_id ON print_jobs(event_id);
CREATE INDEX idx_print_jobs_guest    ON print_jobs(event_id, guest_user_id);

ALTER TABLE print_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE print_jobs REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE print_jobs;

-- Guest can submit their own print job
CREATE POLICY print_jobs_insert_guest ON print_jobs FOR INSERT
  WITH CHECK (auth.uid() = guest_user_id);

-- Guest can read their own jobs
CREATE POLICY print_jobs_select_own ON print_jobs FOR SELECT
  USING (auth.uid() = guest_user_id);

-- Admin/operator can read all jobs
CREATE POLICY print_jobs_select_admin ON print_jobs FOR SELECT
  USING (is_admin());

-- Only admin can update job status
CREATE POLICY print_jobs_update_admin ON print_jobs FOR UPDATE
  USING (is_admin());
```

**Quota logic:** Guest's remaining prints = `print_quota_per_device - COUNT(print_jobs WHERE guest_user_id = auth.uid() AND event_id = X AND status != 'rejected')`. Computed via a pure client-side function from in-memory state (same pattern as `checkGuestQuota.js`). No separate quota table needed.

---

### 1d. Storage — Overlay Frames

Overlay PNGs are stored in the existing `photos` bucket under a protected sub-path:
- **Path:** `overlays/{event_id}/frame.png`
- **Access:** Admin-only upload. Read at print time from the Print Station (admin session).

---

## 2. Routing Strategy

### New routes (added to `src/App.jsx`)

| Path | Component | Layout | Auth Guard |
|---|---|---|---|
| `/MagnetLead` | `MagnetLead` | `GuestLayout` | None (public) |
| `/AdminDashboard` | `AdminDashboard` | `Layout` | Inline `is_admin()` check |
| `/PrintStation` | `PrintStation` | None (full-screen, no nav) | Inline `is_admin()` check |

### Dynamic guest routing (existing `/Event?code=X`)

After `EventPage` fetches the event by code, it branches on `event.event_type`:

```
event_type === 'share'  →  existing redirect to /EventGallery?code=X  (unchanged)
event_type === 'magnet' →  render <MagnetGuestPage event={event} />   (new)
```

No new route is needed — the branch lives inside the existing `EventPage` component.

---

## 3. Component Breakdown

### 3a. Modified existing files

| File | Change |
|---|---|
| `src/components/home/HeroSection.jsx` | Replace single "Create Event" CTA with two product cards: Share (→ `/CreateEvent`) and Magnet (→ `/MagnetLead`) |
| `src/pages/Home.jsx` | Minor layout adjustment to accommodate the new dual-funnel HeroSection |
| `src/pages/EventPage.jsx` | Add `event_type` branch after event fetch (see Section 2) |
| `src/components/memoriaService.jsx` | (1) Allow `event_type` through the `events.create()` strip list; (2) Add `leads` and `printJobs` namespaces |
| `CLEAN_RESET_SCHEMA.sql` | Append all SQL from Section 1 |

---

### 3b. New — Lead Form

| File | Responsibility |
|---|---|
| `src/pages/MagnetLead.jsx` | Public form: name, phone, event date, details → `memoriaService.leads.create()` → success confirmation screen |

---

### 3c. New — Admin Dashboard

| File | Responsibility |
|---|---|
| `src/pages/AdminDashboard.jsx` | Two-tab layout: **Leads** and **Create Magnet Event**. Guards with inline `is_admin()` check. |
| `src/components/admin/LeadsPanel.jsx` | Table of leads with status badges and inline status-update actions |
| `src/components/admin/CreateMagnetEventForm.jsx` | Form: event name, date, auto-generated `unique_code` (overridable), `print_quota_per_device`, overlay PNG upload |

---

### 3d. New — Magnet Guest Flow

| File | Responsibility |
|---|---|
| `src/pages/MagnetGuestPage.jsx` | Top-level Magnet guest experience: quota display, camera entry point, print status tab |
| `src/components/magnet/MagnetCamera.jsx` | Extends CameraCapture: "Send to Print" replaces upload; quota badge overlay; no gallery tab |
| `src/components/magnet/PrintStatusModal.jsx` | Guest-facing real-time list of own print jobs with status pills (Pending / Printing / Ready) |
| `src/hooks/usePrintStatus.js` | Realtime subscription to `print_jobs` filtered by `guest_user_id + event_id` |
| `src/functions/checkPrintQuota.js` | Pure function: `(printJobs, quota) → { remaining, isExhausted }` (no Supabase calls) |
| `src/functions/submitPrintJob.js` | Calls `memoriaService.printJobs.create()` + returns optimistic state |

---

### 3e. New — Operator Print Station

| File | Responsibility |
|---|---|
| `src/pages/PrintStation.jsx` | Full-screen operator dashboard, no Layout wrapper, protected by `is_admin()` |
| `src/components/magnet/PrintQueue.jsx` | Real-time queue of pending print jobs via `usePrintQueue` |
| `src/components/magnet/PrintJobCard.jsx` | Single job card: guest photo thumbnail, guest name, status badge, Print / Reject buttons |
| `src/hooks/usePrintQueue.js` | Realtime subscription to `print_jobs` for `event_id`, sorted by `created_at ASC` |
| `src/functions/applyOverlayFrame.js` | Canvas utility: composites guest photo + overlay PNG frame → returns blob for `window.print()` |

---

## 4. Service Layer Changes

### New namespaces in `memoriaService.jsx`

```js
// leads namespace
memoriaService.leads.create({ full_name, phone, event_date, details })
memoriaService.leads.list()                           // admin only
memoriaService.leads.update(id, { status })           // admin only

// printJobs namespace
memoriaService.printJobs.create({ event_id, photo_id, guest_user_id })
memoriaService.printJobs.getByEvent(eventId)          // admin / operator
memoriaService.printJobs.getByUser(eventId, userId)   // guest own jobs
memoriaService.printJobs.updateStatus(id, status)     // admin / operator

// storage addition
memoriaService.storage.uploadOverlay(file, eventId)   // path: overlays/{eventId}/frame.png
```

All new methods follow the existing `native fetch()` pattern (not `supabase-js` client calls) to maintain consistency with the auth-mutex avoidance strategy already in use.

---

## 5. Security Model

| Surface | Mechanism |
|---|---|
| Lead submission | RLS INSERT open to all; SELECT/UPDATE locked to `is_admin()` |
| Print job submission | RLS INSERT requires `auth.uid() = guest_user_id`; guests SELECT own rows only |
| Print status update | RLS UPDATE locked to `is_admin()` |
| Overlay frame upload | Inline admin check in `CreateMagnetEventForm` before upload call |
| AdminDashboard | Inline `is_admin()` guard (same pattern as `/AdminUsers`) |
| PrintStation | Inline `is_admin()` guard |
| Magnet event creation | Admin-only via AdminDashboard. `CreateEvent` wizard never sets `event_type = 'magnet'`. |

---

## 6. Implementation Phases

### Phase 1 — Schema (non-breaking)
- Alter `events` table (3 columns)
- Create `leads` table + RLS policies
- Create `print_jobs` table + RLS policies + realtime publication
- Update `CLEAN_RESET_SCHEMA.sql`

### Phase 2 — Homepage Dual Funnel + Lead Form
- Rework `HeroSection.jsx` with two product cards
- Build `MagnetLead.jsx`
- Add `/MagnetLead` route

### Phase 3 — Admin Dashboard
- Build `AdminDashboard.jsx`, `LeadsPanel.jsx`, `CreateMagnetEventForm.jsx`
- Patch `memoriaService.events.create()` to pass `event_type` through
- Add `/AdminDashboard` route + header link for admin role
- Add `memoriaService.leads.*` and `memoriaService.storage.uploadOverlay()`

### Phase 4 — Magnet Guest Flow
- Patch `EventPage` with `event_type` routing branch
- Build `MagnetGuestPage`, `MagnetCamera`, `PrintStatusModal`
- Add `checkPrintQuota.js`, `submitPrintJob.js`, `usePrintStatus.js`
- Add `memoriaService.printJobs.*`

### Phase 5 — Operator Print Station
- Build `PrintStation.jsx`, `PrintQueue.jsx`, `PrintJobCard.jsx`
- Build `applyOverlayFrame.js` canvas compositor
- Add `usePrintQueue.js` realtime hook
- Add `/PrintStation` route

---

## 7. Open Decisions (requires product input before Phase 4+)

1. **Guest photo storage:** Does the Magnet guest's photo get stored in the `photos` table before being queued for print? → Recommended: yes — reuses the existing upload pipeline. `print_jobs.photo_id` links to the photo record.

2. **Overlay compositing location:** Client-side canvas (`applyOverlayFrame.js` at Print Station) or server-side Edge Function? → Recommended: client-side. Simpler, no server cost. Operator downloads guest photo + frame to their machine.

3. **Print trigger mechanism:** Does clicking "Print" trigger `window.print()` with a print-ready layout, or does the operator manually send to printer? → Recommended: `window.print()` on a formatted print layout; status set to `'printing'` on click, `'ready'` after operator confirms.

4. **Magnet event `unique_code`:** Auto-generated (same `Math.random().toString(36)` logic as Share) or manually set by admin? → Recommended: auto-generated with an optional override field.

---

*Document generated: April 2026. Update when any architectural decision changes.*
