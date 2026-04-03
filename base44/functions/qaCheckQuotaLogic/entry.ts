import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

/**
 * qaCheckQuotaLogic — בדיקת יחידה של אלגוריתם checkGuestQuota
 * 
 * מדמה את הלוגיקה המלאה עם נתונים מוזרקים ידנית — ללא גישה ל-DB.
 * מאפשר לבדוק guest_tier ו-max_uploads_per_user עם כל מספר אורחים.
 * גישה: אדמינים בלבד.
 *
 * Payload:
 * {
 *   guest_tier: number,            // tier האירוע (1-6)
 *   max_uploads_per_user: number,  // מקסימום תמונות לאורח
 *   current_user_email: string,    // האימייל של האורח הנוכחי
 *   simulated_photos: [            // תמונות קיימות (מדומות)
 *     { created_by: string }
 *   ]
 * }
 */

const GUEST_TIER_LIMITS = [10, 100, 250, 400, 600, 800, Infinity];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { guest_tier, max_uploads_per_user, current_user_email, simulated_photos } = await req.json();

    if (guest_tier === undefined || !max_uploads_per_user || !current_user_email || !simulated_photos) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const allPhotos = simulated_photos; // נתונים מוזרקים — לא מה-DB

    // ── Rule 1: guest_tier — unique users ────────────────────────────────
    const maxGuests = GUEST_TIER_LIMITS[Math.min(guest_tier, GUEST_TIER_LIMITS.length - 1)];
    const uniqueUsers = new Set(allPhotos.map(p => p.created_by).filter(Boolean));
    const userAlreadyRegistered = uniqueUsers.has(current_user_email);

    if (maxGuests !== Infinity && !userAlreadyRegistered && uniqueUsers.size >= maxGuests) {
      return Response.json({
        allowed: false,
        reason: `האירוע הגיע למכסת האורחים המקסימלית (${maxGuests} משתמשים). לא ניתן להצטרף יותר.`,
        quota_type: 'guest_tier',
        current_guests: uniqueUsers.size,
        max_guests: maxGuests,
        remaining_slots: 0,
        // debug
        debug: { uniqueUsers: uniqueUsers.size, maxGuests, userAlreadyRegistered }
      });
    }

    // ── Rule 2: max_uploads_per_user ─────────────────────────────────────
    const userUploads = allPhotos.filter(p => p.created_by === current_user_email).length;
    if (userUploads >= max_uploads_per_user) {
      return Response.json({
        allowed: false,
        reason: `הגעת למגבלת ${max_uploads_per_user} התמונות לאירוע זה.`,
        quota_type: 'per_user',
        user_uploads: userUploads,
        max_user_uploads: max_uploads_per_user,
        debug: { userUploads, max_uploads_per_user }
      });
    }

    // ── Allowed ──────────────────────────────────────────────────────────
    const remainingSlots = maxGuests === Infinity ? null : Math.max(0, maxGuests - uniqueUsers.size);
    return Response.json({
      allowed: true,
      remaining_slots: remainingSlots,
      debug: {
        uniqueUsers: uniqueUsers.size,
        maxGuests,
        userAlreadyRegistered,
        userUploads,
        max_uploads_per_user
      }
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});