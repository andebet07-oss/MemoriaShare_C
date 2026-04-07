# MemoriaShare — Architecture Specification (Source of Truth)

**Authority:** This document defines the canonical architecture for user identity, authentication, and the guest upload flow. All code, database policies, and future AI-assisted development MUST align with this specification.

**Last updated:** 2026-04-07
**Owner:** Lead Architect

---

## 1. TWO DISTINCT USER ROLES

### 1.1 Hosts / Admins

| Property | Value |
|---|---|
| **Auth method** | Email/Password OR Magic Link (Supabase `signInWithOtp` / `signInWithPassword`) |
| **Identity** | Full entry in `auth.users` with a verified email address |
| **Session type** | Standard authenticated session |
| **Capabilities** | Create events, manage gallery, approve/deny deletion requests, export photos |
| **Key constraint** | Email is REQUIRED. A host without an email is an invalid state. |

### 1.2 Guests (EventGallery users)

| Property | Value |
|---|---|
| **Auth method** | **Anonymous Authentication ONLY** (`supabase.auth.signInAnonymously()`) |
| **Identity** | An anonymous UUID in `auth.users` with NO email |
| **Session type** | Anonymous authenticated session |
| **Capabilities** | View gallery, upload photos (subject to quota), request own-photo deletion |
| **Key constraint** | Guests NEVER provide an email. Email is FORBIDDEN in the guest flow. |

> **Critical rule:** No code path, RLS policy, trigger, or UI component may require or check for an email address on a guest user. Any such check is a bug.

---

## 2. THE EXACT GUEST FLOW (Steps A–F)

### Step A — Entry
- Guest scans QR code → lands on `EventGallery` page.
- If no valid Supabase session exists for this event, the upload button is visible but triggers the identity modal.

### Step B — Identity Request
- A modal prompts the guest for **Name only** (First name, required).
- An optional **greeting/message** field may be present.
- There is **no email field**. Rendering an email field in this modal is a bug.

### Step C — Auth Handshake (background, invisible to user)
- On modal submit, the system calls:
  ```js
  const { data, error } = await supabase.auth.signInAnonymously();
  ```
- This returns a valid `UUID` (stored in `data.user.id`).
- This step MUST complete before Step D. No race conditions permitted.

### Step D — Identity Registration
- After obtaining the UUID, the system:
  1. Calls `supabase.auth.updateUser({ data: { display_name: enteredName } })` to attach the name to the anonymous user's metadata.
  2. Saves the name to `localStorage` under a scoped key (e.g., `guest_name_{eventId}`) for instant UI rendering on future visits.
- The UUID and name are now permanently linked.

### Step E — Upload
- Guest selects a photo.
- The upload call attaches the anonymous UUID as `created_by`:
  ```js
  // photos table INSERT
  { event_id, storage_path, created_by: supabase.auth.getUser().id, ... }
  ```
- RLS policy on `photos` allows INSERT where `auth.uid() = created_by` for any authenticated user (including anonymous).
- No email check occurs at any point during upload.

### Step F — Display
- Gallery reads `created_by` UUID for each photo.
- Looks up the display name from:
  1. `auth.users` metadata (`raw_user_meta_data->>'display_name'`) via a join or RPC, OR
  2. A `profiles` table keyed on `user_id`, OR
  3. `localStorage` cache as a fallback for the current session.
- **The display name shown is ALWAYS the entered guest name.**
- Hardcoded strings like `"guest"`, `"אורח"`, or `"Anonymous"` in the photo attribution UI are bugs.

---

## 3. DATABASE CONSTRAINTS (Source of Truth)

### `photos` table — RLS policies

| Operation | Policy |
|---|---|
| **SELECT** | Allow if event is public OR `auth.uid()` matches event owner |
| **INSERT** | Allow if `auth.uid() = created_by` AND user is authenticated (anonymous counts) |
| **UPDATE** | Restricted to event owner or matching `created_by` |
| **DELETE** | Soft-delete only; restricted to event owner |

> **Zero email requirements:** No RLS policy, trigger, or check constraint on `photos` (or any table touched in the guest flow) may reference `auth.email()` or require a non-null email.

---

## 4. BANNED PATTERNS

| Pattern | Reason |
|---|---|
| `if (user.email)` gating upload in guest flow | Guests have no email — this silently blocks all uploads |
| `signInWithOtp(email)` for guests | Guests must use `signInAnonymously()` |
| Hardcoding `"אורח"` or `"guest"` as display name | Must use real name from metadata/localStorage |
| Checking `user.email` to determine if user is a "real" user | Use `user.is_anonymous` flag from Supabase instead |
| Direct `supabase.from('photos')` calls inside React components | All DB calls go through `memoriaService` |

---

## 5. SEQUENCE DIAGRAM

```
Guest               Browser (EventGallery)        Supabase Auth         Supabase DB
  |                        |                            |                    |
  |--- scans QR ---------->|                            |                    |
  |                        |--- check session --------->|                    |
  |                        |<-- no session -------------|                    |
  |--- clicks Upload ----->|                            |                    |
  |                        |--- show Name modal ------->|                    |
  |--- enters Name ------->|                            |                    |
  |                        |--- signInAnonymously() --->|                    |
  |                        |<-- { user: { id: UUID } }--|                    |
  |                        |--- updateUser(display_name)|                    |
  |                        |--- localStorage.set(name) -|                    |
  |--- selects photo ----->|                            |                    |
  |                        |--- INSERT photos (created_by=UUID) ------------>|
  |                        |<-- success -----------------------------------------|
  |<-- photo in gallery ---|                            |                    |
```

---

*This file is the single source of truth for guest authentication architecture. Update it before implementing any change to the auth or upload flow.*
