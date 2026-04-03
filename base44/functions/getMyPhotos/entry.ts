import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

/**
 * getMyPhotos
 * שולף את כל תמונות האירוע של המשתמש הנוכחי — כולל לא מאושרות.
 * משתמש ב-service role כדי לעקוף את פילטר is_approved של ה-SDK.
 *
 * Supports two identification strategies:
 *   1. Authenticated user — filter by created_by (email)
 *   2. device_uuid fallback — when the caller is unauthenticated but
 *      provides a device_uuid, we filter photos that match it.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Try to identify the caller via auth token first
    let user = null;
    try { user = await base44.auth.me(); } catch (_) { /* unauthenticated */ }

    const { event_id, device_uuid } = await req.json();

    if (!event_id) {
      return Response.json({ error: 'Missing event_id' }, { status: 400 });
    }

    const identifier = user?.email || null;

    // Must have at least one identifier
    if (!identifier && !device_uuid) {
      return Response.json({ error: 'Unauthorized — no email or device_uuid' }, { status: 401 });
    }

    let photos;
    if (identifier) {
      // Primary path: fetch by authenticated email
      photos = await base44.asServiceRole.entities.Photo.filter({
        event_id,
        created_by: identifier,
      }, '-created_date');
    } else {
      // Fallback path: fetch by device_uuid
      photos = await base44.asServiceRole.entities.Photo.filter({
        event_id,
        device_uuid,
      }, '-created_date');
    }

    return Response.json({ photos });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});