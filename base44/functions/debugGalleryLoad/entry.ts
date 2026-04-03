import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

/**
 * debugGalleryLoad
 * בודק את לוגיקת טעינת תמונות גלריה:
 * - האם האירוע נמצא?
 * - כמה תמונות יש בסך הכל?
 * - כמה תמונות שייכות לאורח הספציפי?
 * - האם הגלריה פרטית או ציבורית?
 *
 * גישה: אדמינים בלבד.
 *
 * Payload: {
 *   event_code: string,
 *   simulate_user_email?: string
 * }
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { event_code, simulate_user_email } = await req.json();

    if (!event_code) {
      return Response.json({ error: 'Missing required field: event_code' }, { status: 400 });
    }

    // ── שלב 1: מצא את האירוע לפי קוד ────────────────────────────────────
    const events = await base44.asServiceRole.entities.Event.filter({ unique_code: event_code });
    if (!events || events.length === 0) {
      return Response.json({
        event_found: false,
        event_code,
        error: 'אירוע לא נמצא עבור הקוד הנתון'
      });
    }
    const event = events[0];

    // ── שלב 2: שלוף את כל תמונות האירוע ──────────────────────────────────
    const allPhotos = await base44.asServiceRole.entities.Photo.filter({ event_id: event.id });

    // ── שלב 3: מצא תמונות של האורח הספציפי ───────────────────────────────
    const emailUsed = simulate_user_email || null;
    const myPhotos = emailUsed
      ? allPhotos.filter(p => p.created_by === emailUsed)
      : [];

    // ── שלב 4: בדוק האם יש שאריות device_uuid ────────────────────────────
    const photosWithDeviceUuid = allPhotos.filter(p => p.device_uuid && p.device_uuid !== '');
    const uniqueUploaders = [...new Set(allPhotos.map(p => p.created_by).filter(Boolean))];

    // ── שלב 5: בדוק מאפייני האירוע ────────────────────────────────────────
    const isPrivateGallery = !event.auto_publish_guest_photos;

    return Response.json({
      event_found: true,
      event_id: event.id,
      event_name: event.name,
      event_code: event.unique_code,
      is_private_gallery: isPrivateGallery,
      auto_publish_guest_photos: event.auto_publish_guest_photos,

      // נתוני תמונות
      photos_count: allPhotos.length,
      approved_photos_count: allPhotos.filter(p => p.is_approved).length,
      hidden_photos_count: allPhotos.filter(p => p.is_hidden).length,

      // נתוני האורח הספציפי
      email_used: emailUsed,
      my_photos_count: myPhotos.length,
      my_photos_ids: myPhotos.map(p => p.id),

      // בדיקת שאריות device_uuid
      device_uuid_leftovers: photosWithDeviceUuid.length,
      device_uuid_warning: photosWithDeviceUuid.length > 0
        ? `נמצאו ${photosWithDeviceUuid.length} תמונות עם device_uuid — שאריות של לוגיקה ישנה`
        : 'נקי — אין שאריות device_uuid',

      // מידע נוסף
      unique_uploaders_count: uniqueUploaders.length,
      guest_tier: event.guest_tier ?? 1,
      max_uploads_per_user: event.max_uploads_per_user || 15,
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});