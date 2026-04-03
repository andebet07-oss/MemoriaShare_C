import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

/**
 * checkGuestQuota — v3 (email-based enforcement)
 *
 * אכיפה מבוססת created_by (אימייל) בלבד:
 *
 * 1. guest_tier  — כמה משתמשים ייחודיים מותר לאירוע
 * 2. max_uploads_per_user — כמה תמונות משתמש בודד מורשה להעלות
 *
 * Payload: { event_id: string }
 */

const GUEST_TIER_LIMITS = [10, 100, 250, 400, 600, 800, Infinity];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Auth optional — exemption check only
    let user = null;
    try { user = await base44.auth.me(); } catch (_) {}

    const { event_id } = await req.json();

    if (!event_id) {
      return Response.json({ allowed: false, reason: 'חסר מזהה אירוע.' }, { status: 400 });
    }

    // ── Fetch event ────────────────────────────────────────────────────────
    const events = await base44.asServiceRole.entities.Event.filter({ id: event_id });
    if (!events?.length) {
      return Response.json({ allowed: false, reason: 'האירוע לא נמצא.' }, { status: 404 });
    }
    const event = events[0];

    // ── Exempt: event owner / co-host / super-admin ────────────────────────
    if (user) {
      const isSuperAdmin = user.email === 'effitag@gmail.com';
      const isCreator   = event.created_by === user.email;
      const isCoHost    = Array.isArray(event.co_hosts) && event.co_hosts.includes(user.email);
      if (isSuperAdmin || isCreator || isCoHost) {
        return Response.json({ allowed: true, exempt: true });
      }
    }

    // ── Rule 0: Event closure datetime ────────────────────────────────────
    if (event.upload_closure_datetime && new Date() > new Date(event.upload_closure_datetime)) {
      return Response.json({
        allowed: false,
        reason: 'העלאת התמונות לאירוע זה הסתיימה. תודה על השתתפותכם! 🙏',
        quota_type: 'event_closed',
      });
    }

    // ── Fetch all photos for this event ───────────────────────────────────
    const allPhotos = await base44.asServiceRole.entities.Photo.filter({ event_id });

    // ── Rule 1: guest_tier — unique users ────────────────────────────────
    const guestTier = event.guest_tier ?? 1;
    const maxGuests = GUEST_TIER_LIMITS[Math.min(guestTier, GUEST_TIER_LIMITS.length - 1)];

    if (maxGuests !== Infinity && user?.email) {
      const uniqueUsers = new Set(
        allPhotos.map(p => p.created_by).filter(Boolean)
      );

      const userAlreadyRegistered = uniqueUsers.has(user.email);

      if (!userAlreadyRegistered && uniqueUsers.size >= maxGuests) {
        return Response.json({
          allowed: false,
          reason: `האירוע הגיע למכסת האורחים המקסימלית (${maxGuests} משתמשים). לא ניתן להצטרף יותר.`,
          quota_type: 'guest_tier',
          current_guests: uniqueUsers.size,
          max_guests: maxGuests,
          remaining_slots: 0,
        });
      }
    }

    // ── Rule 2: max_uploads_per_user — per user email ─────────────────────
    const maxUploads = event.max_uploads_per_user || 15;

    if (user?.email) {
      const userUploads = allPhotos.filter(p => p.created_by === user.email).length;
      if (userUploads >= maxUploads) {
        return Response.json({
          allowed: false,
          reason: `הגעת למגבלת ${maxUploads} התמונות לאירוע זה.`,
          quota_type: 'per_user',
          user_uploads: userUploads,
          max_user_uploads: maxUploads,
        });
      }
    }

    // ── All checks passed ──────────────────────────────────────────────────
    let remainingSlots = null;
    if (maxGuests !== Infinity && user?.email) {
      const uniqueUsers = new Set(allPhotos.map(p => p.created_by).filter(Boolean));
      remainingSlots = Math.max(0, maxGuests - uniqueUsers.size);
    }

    return Response.json({ allowed: true, remaining_slots: remainingSlots });

  } catch (error) {
    return Response.json({ allowed: false, reason: 'שגיאת שרת. נסה שוב.' }, { status: 500 });
  }
});