import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

/**
 * qaCreatePhoto — QA-only endpoint
 * מאפשר יצירת תמונת בדיקה עם created_by מוגדר ידנית.
 * גישה: אדמינים בלבד.
 *
 * Payload: {
 *   event_id: string,
 *   created_by: string,   // אימייל הדמה לבדיקה
 *   guest_name?: string,
 *   file_url?: string
 * }
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { event_id, created_by, guest_name, file_url } = await req.json();

    if (!event_id || !created_by) {
      return Response.json({ error: 'Missing required fields: event_id, created_by' }, { status: 400 });
    }

    // שלב 1: יצירת הרשומה עם service role
    const photo = await base44.asServiceRole.entities.Photo.create({
      event_id,
      guest_name: guest_name || created_by.split('@')[0],
      file_url: file_url || 'https://qa-placeholder.com/photo.jpg',
      is_approved: false,
    });

    // שלב 2: דריסת created_by ישירות לאחר היצירה
    const updated = await base44.asServiceRole.entities.Photo.update(photo.id, {
      created_by: created_by,
    });

    return Response.json({ success: true, photo: updated });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});