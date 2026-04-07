const GUEST_TIER_LIMITS = [10, 100, 250, 400, 600, 800, Infinity];

/**
 * checkGuestQuota({ event, user_id, user_upload_count, photos })
 *
 * Pure quota-enforcement function — ZERO Supabase calls.
 *
 * All inputs are supplied by the caller from already-loaded React state:
 *   - event            : the full event object already in useEventGallery state
 *   - user_id          : resolved UUID from AuthContext (no getUser() needed)
 *   - user_upload_count: accurate per-user count from getMyPhotos() (already fetched)
 *   - photos           : the loaded photos array (used for guest-tier unique-user count)
 *
 * WHY pure: the Supabase JS v2 client attaches the session JWT before every DB
 * request, which acquires the same auth mutex that signInAnonymously() holds at
 * mount time. Any supabase.from(...) call here would hang for the same reason as
 * supabase.auth.getUser(). Passing state from the hook eliminates all network calls
 * from this path.
 *
 * Returns { data: { allowed, reason?, quota_type?, remaining_slots? } }
 */
export function checkGuestQuota({ event, user_id, user_upload_count = 0, photos = [] }) {
  try {
    if (!event) {
      return { data: { allowed: false, reason: 'האירוע לא נמצא.' } };
    }

    // Exempt: event owner (UUID match)
    if (user_id && user_id === event.created_by) {
      return { data: { allowed: true, exempt: true } };
    }

    // Rule 0: Event closure datetime
    if (event.upload_closure_datetime && new Date() > new Date(event.upload_closure_datetime)) {
      return {
        data: {
          allowed: false,
          reason: 'העלאת התמונות לאירוע זה הסתיימה. תודה על השתתפותכם! 🙏',
          quota_type: 'event_closed',
        },
      };
    }

    // Rule 1: guest_tier — unique uploaders (uses already-loaded photos array)
    const guestTier = event.guest_tier ?? 1;
    const maxGuests = GUEST_TIER_LIMITS[Math.min(guestTier, GUEST_TIER_LIMITS.length - 1)];

    if (maxGuests !== Infinity && user_id) {
      const uniqueUsers = new Set(photos.map(p => p.created_by).filter(Boolean));
      const userAlreadyRegistered = uniqueUsers.has(user_id);

      if (!userAlreadyRegistered && uniqueUsers.size >= maxGuests) {
        return {
          data: {
            allowed: false,
            reason: `האירוע הגיע למכסת האורחים המקסימלית (${maxGuests} משתמשים).`,
            quota_type: 'guest_tier',
            current_guests: uniqueUsers.size,
            max_guests: maxGuests,
            remaining_slots: 0,
          },
        };
      }
    }

    // Rule 2: max_uploads_per_user — uses accurate count from getMyPhotos()
    const maxUploads = event.max_uploads_per_user || 15;
    if (user_id && user_upload_count >= maxUploads) {
      return {
        data: {
          allowed: false,
          reason: `הגעת למגבלת ${maxUploads} התמונות לאירוע זה.`,
          quota_type: 'per_user',
          user_uploads: user_upload_count,
          max_user_uploads: maxUploads,
        },
      };
    }

    // All checks passed
    const remainingSlots = maxGuests !== Infinity && user_id
      ? Math.max(0, maxGuests - new Set(photos.map(p => p.created_by).filter(Boolean)).size)
      : null;

    return { data: { allowed: true, remaining_slots: remainingSlots } };

  } catch (error) {
    console.error('checkGuestQuota error:', error);
    return { data: { allowed: true } };
  }
}
