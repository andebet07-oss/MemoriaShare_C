import { supabase } from '@/lib/supabase';

const GUEST_TIER_LIMITS = [10, 100, 250, 400, 600, 800, Infinity];

/**
 * checkGuestQuota({ event_id, user_id })
 *
 * Enforces guest-tier and per-user upload limits before allowing a photo upload.
 * Returns { data: { allowed, reason?, quota_type?, remaining_slots? } }
 *
 * IMPORTANT: user_id must be passed by the caller (from AuthContext or getSession).
 * This function intentionally does NOT call supabase.auth.getUser() — that call
 * contends with the Supabase v2 auth mutex and hangs when signInAnonymously() is
 * still in flight at mount time.
 */
export async function checkGuestQuota({ event_id, user_id }) {
  try {
    if (!event_id) {
      return { data: { allowed: false, reason: 'חסר מזהה אירוע.' } };
    }

    // Fetch event — DB query uses the JWT from localStorage, unaffected by auth mutex
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('id', event_id)
      .maybeSingle();

    if (eventError || !event) {
      return { data: { allowed: false, reason: 'האירוע לא נמצא.' } };
    }

    // user_id is supplied by the caller — no auth client call needed
    const uid = user_id ?? null;

    // Exempt: super-admin (handled via email on the enriched user object in the caller),
    // event owner (UUID match), or co-host (email array — legacy)
    // Note: email-based exemptions are handled upstream; here we only check UUID ownership
    if (uid && uid === event.created_by) {
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

    // Fetch all photos for this event to check tier + per-user limits
    const { data: allPhotos = [] } = await supabase
      .from('photos')
      .select('id, created_by')
      .eq('event_id', event_id);

    // Rule 1: guest_tier — unique uploaders
    const guestTier = event.guest_tier ?? 1;
    const maxGuests = GUEST_TIER_LIMITS[Math.min(guestTier, GUEST_TIER_LIMITS.length - 1)];

    if (maxGuests !== Infinity && uid) {
      const uniqueUsers = new Set(allPhotos.map(p => p.created_by).filter(Boolean));
      const userAlreadyRegistered = uniqueUsers.has(uid);

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

    // Rule 2: max_uploads_per_user
    const maxUploads = event.max_uploads_per_user || 15;
    if (uid) {
      const userUploads = allPhotos.filter(p => p.created_by === uid).length;
      if (userUploads >= maxUploads) {
        return {
          data: {
            allowed: false,
            reason: `הגעת למגבלת ${maxUploads} התמונות לאירוע זה.`,
            quota_type: 'per_user',
            user_uploads: userUploads,
            max_user_uploads: maxUploads,
          },
        };
      }
    }

    // All checks passed
    let remainingSlots = null;
    if (maxGuests !== Infinity && uid) {
      const uniqueUsers = new Set(allPhotos.map(p => p.created_by).filter(Boolean));
      remainingSlots = Math.max(0, maxGuests - uniqueUsers.size);
    }

    return { data: { allowed: true, remaining_slots: remainingSlots } };

  } catch (error) {
    console.error('checkGuestQuota error:', error);
    // On network error allow the upload — quota is a UX guard, not a security gate
    return { data: { allowed: true } };
  }
}
