import { supabase } from '@/lib/supabase';

const GUEST_TIER_LIMITS = [10, 100, 250, 400, 600, 800, Infinity];

/**
 * checkGuestQuota({ event_id })
 * Enforces guest-tier and per-user upload limits before allowing a photo upload.
 * Returns { data: { allowed, reason?, quota_type?, remaining_slots? } }
 */
export async function checkGuestQuota({ event_id }) {
  try {
    if (!event_id) {
      return { data: { allowed: false, reason: 'חסר מזהה אירוע.' } };
    }

    // Fetch event
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('id', event_id)
      .maybeSingle();

    if (eventError || !event) {
      return { data: { allowed: false, reason: 'האירוע לא נמצא.' } };
    }

    // Get current user (optional — guests can upload anonymously)
    const { data: { user } } = await supabase.auth.getUser();

    // Exempt: event owner / co-host
    if (user) {
      const isSuperAdmin = user.email === 'effitag@gmail.com';
      const isCreator = event.created_by === user.email;
      const isCoHost = Array.isArray(event.co_hosts) && event.co_hosts.includes(user.email);
      if (isSuperAdmin || isCreator || isCoHost) {
        return { data: { allowed: true, exempt: true } };
      }
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

    // Fetch all photos for this event
    const { data: allPhotos = [] } = await supabase
      .from('photos')
      .select('id, created_by')
      .eq('event_id', event_id);

    // Rule 1: guest_tier — unique users
    const guestTier = event.guest_tier ?? 1;
    const maxGuests = GUEST_TIER_LIMITS[Math.min(guestTier, GUEST_TIER_LIMITS.length - 1)];

    if (maxGuests !== Infinity && user?.email) {
      const uniqueUsers = new Set(allPhotos.map(p => p.created_by).filter(Boolean));
      const userAlreadyRegistered = uniqueUsers.has(user.email);

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
    if (user?.email) {
      const userUploads = allPhotos.filter(p => p.created_by === user.email).length;
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
    if (maxGuests !== Infinity && user?.email) {
      const uniqueUsers = new Set(allPhotos.map(p => p.created_by).filter(Boolean));
      remainingSlots = Math.max(0, maxGuests - uniqueUsers.size);
    }

    return { data: { allowed: true, remaining_slots: remainingSlots } };

  } catch (error) {
    console.error('checkGuestQuota error:', error);
    // On error, allow entry — don't block users due to network issues
    return { data: { allowed: true } };
  }
}
