import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const now = new Date().toISOString();

    // שלוף את כל האירועים הפעילים
    const events = await base44.asServiceRole.entities.Event.filter({ is_active: true });

    const activeWindowEvents = [];

    for (const event of events) {
      // דלג על אירועים ללא תאריך סגירה
      if (!event.upload_closure_datetime) continue;

      const closureDatetime = new Date(event.upload_closure_datetime);
      const eventDate = new Date(event.date);

      // בדוק שאנחנו בתוך החלון הפעיל: אחרי תאריך האירוע ולפני תאריך הסגירה
      if (new Date(now) < eventDate || new Date(now) > closureDatetime) continue;

      // ספור תמונות לאירוע זה
      const photos = await base44.asServiceRole.entities.Photo.filter({ event_id: event.id });

      // הפעל בדיקה רק אם יש יותר מ-40 תמונות
      if (photos.length <= 40) continue;

      activeWindowEvents.push({
        event_id: event.id,
        event_name: event.name,
        photo_count: photos.length,
        closure_datetime: event.upload_closure_datetime
      });
    }

    return Response.json({
      scanned_at: now,
      active_events_count: activeWindowEvents.length,
      active_events: activeWindowEvents
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});