# Memoria Architect Memory Index

## Architecture Snapshots
- [architecture_snapshot_2026_04_22.md](architecture_snapshot_2026_04_22.md) — Domain map, routing tree, god files, boundary analysis as of 2026-04-22

## Verified Invariants
- [invariant_service_layer.md](invariant_service_layer.md) — Only memoriaService.jsx + 2 pages (AdminUsers, EventSuccess) call supabase.from directly; service layer mostly intact
- [invariant_realtime_channels.md](invariant_realtime_channels.md) — 4 realtime channels in repo, all properly scoped and cleaned up

## Known Risks
- [risk_god_files_2026_04.md](risk_god_files_2026_04.md) — Dashboard (753), CreateMagnetEvent (741), useEventGallery (741), MagnetLead (615), memoriaService (600), CreateEvent (555)
- [risk_auth_mutex_workarounds.md](risk_auth_mutex_workarounds.md) — memoriaService uses raw fetch + localStorage JWT reading to bypass Supabase v2 auth mutex deadlock
- [risk_triple_array_fanout.md](risk_triple_array_fanout.md) — useEventGallery has 3 parallel photo arrays (photos/myPhotos/sharedPhotos) that must be mutated together in every realtime handler
- [risk_useAuth_profileReady_gap.md](risk_useAuth_profileReady_gap.md) — Several useAuth consumers skip profileReady gate, causing admin role flicker during 6s enrichment window
- [risk_orphan_storage_on_db_insert_failure.md](risk_orphan_storage_on_db_insert_failure.md) — storage.upload + photos.create is non-atomic; DB-insert failure orphans the storage object with no cleanup
- [risk_quota_ceiling_duplicated.md](risk_quota_ceiling_duplicated.md) — Per-user upload ceiling (200/50/15) computed in 3 sites; checkGuestQuota only knows the 15 tier
- [risk_magnet_guest_entry_no_event_type_guard.md](risk_magnet_guest_entry_no_event_type_guard.md) — /magnet/:code route renders MagnetGuestPage for any event_type — cross-product bleed risk
