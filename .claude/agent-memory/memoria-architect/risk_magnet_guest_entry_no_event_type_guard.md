---
name: MagnetGuestEntry does not verify event_type before rendering
description: App.jsx:52-71 renders MagnetGuestPage for any event fetched by unique_code, regardless of event_type
type: project
---

`App.jsx` defines `MagnetGuestEntry` (lines 52-71) as the route component for `/magnet/:code`. It calls `memoriaService.events.getByCode(code)` via react-query and renders `<MagnetGuestPage event={event}/>` whenever the query resolves — with no check that `event.event_type === 'magnet'`.

**Why:** `unique_code` is generated for both Share and Magnet events. A user who guesses or shares a Share event's code to the `/magnet/:code` URL would see the Magnet guest UI (print quota, camera-to-print flow) instead of the Share gallery. Cross-product bleed.

**How to apply:** Any route wrapper that fetches an event by code should guard `event.event_type` before rendering the product-specific page. The same risk exists in reverse for `/event/:code` (Event.jsx:31) if a Magnet event is ever accessed via that URL. When building new product-scoped routes, add an event_type guard component or extend RequireAdmin pattern with RequireEventType.
