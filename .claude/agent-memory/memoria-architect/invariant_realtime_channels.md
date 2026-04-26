---
name: Realtime channel inventory
description: All supabase.channel() subscriptions in the codebase, their scoping and cleanup status
type: project
---

Four realtime channels in repo at 2026-04-22. All scoped by event_id, all return supabase.removeChannel cleanup.

**Why:** Unscoped or unclean channels are a memory-leak class-of-bug; tracking the full set prevents duplicate subscriptions and lets me flag regressions fast.

**How to apply:** Before approving a new realtime subscription, verify it: (a) includes a unique channel name with an ID in it, (b) filters `event_id=eq.${id}`, (c) cleans up with removeChannel in the effect return.

| File | Channel name template | Table | Filter | Cleanup |
|------|-----------------------|-------|--------|---------|
| `src/hooks/useEventGallery.js` | `photos-realtime-${eventId}` | photos | `event_id=eq.${eventId}` | ✓ removeChannel |
| `src/hooks/useRealtimeNotifications.js` | `photos-notifications-${eventId}` | photos | `event_id=eq.${eventId}` | ✓ removeChannel |
| `src/pages/MagnetGuestPage.jsx` | `guest-prints-${event.id}-${user.id}` | print_jobs | `event_id=eq.${event.id}` (guest_user_id checked client-side) | ✓ removeChannel |
| `src/components/magnet/PrintQueue.jsx` | `print-jobs-${event.id}` | print_jobs | `event_id=eq.${event.id}` | ✓ removeChannel |

Note: useEventGallery and useRealtimeNotifications both subscribe to the same table for the same event. Dashboard mounts both (useRealtimeNotifications for host notifications + EventGallery which mounts useEventGallery). This means two open websockets for the same stream when the host is viewing their own gallery. Not a bug, but a coalescing opportunity if realtime quota becomes a concern.
