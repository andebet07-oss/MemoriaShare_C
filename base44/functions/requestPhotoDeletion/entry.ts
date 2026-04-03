import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

/**
 * requestPhotoDeletion
 * Called by a guest to request removal of their photo.
 * - Verifies ownership via device_uuid or created_by
 * - Sets is_hidden = true immediately (safe by default)
 * - Sets deletion_status = "requested"
 * - Sends email notification to the event host
 */
Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  const { photo_id, device_uuid } = await req.json();

  if (!photo_id) {
    return Response.json({ error: 'photo_id is required' }, { status: 400 });
  }

  // Fetch the photo
  const photos = await base44.asServiceRole.entities.Photo.filter({ id: photo_id });
  if (!photos || photos.length === 0) {
    return Response.json({ error: 'Photo not found' }, { status: 404 });
  }
  const photo = photos[0];

  // Verify ownership: device_uuid or authenticated user
  let user = null;
  try { user = await base44.auth.me(); } catch (_) {}

  const isOwnerByDevice = device_uuid && photo.device_uuid === device_uuid;
  const isOwnerByEmail = user?.email && photo.created_by === user.email;

  if (!isOwnerByDevice && !isOwnerByEmail) {
    return Response.json({ error: 'Unauthorized: you did not upload this photo' }, { status: 403 });
  }

  // Already requested or approved
  if (photo.deletion_status === 'requested' || photo.deletion_status === 'approved') {
    return Response.json({ success: true, message: 'Deletion already requested', already_pending: true });
  }

  // Hide photo immediately + mark deletion requested
  await base44.asServiceRole.entities.Photo.update(photo_id, {
    is_hidden: true,
    deletion_status: 'requested'
  });

  // Notify event host via email
  try {
    const events = await base44.asServiceRole.entities.Event.filter({ id: photo.event_id });
    if (events && events.length > 0) {
      const event = events[0];
      const hostEmail = event.created_by;
      if (hostEmail) {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: hostEmail,
          subject: `בקשת הסרת תמונה - ${event.name}`,
          body: `
שלום,

אורח ביקש להסיר תמונה מהאירוע "${event.name}".

פרטים:
• שם האורח: ${photo.guest_name || 'לא ידוע'}
• מזהה התמונה: ${photo_id}

התמונה הוסתרה אוטומטית מהגלריה הציבורית עד להחלטתך.

כדי לאשר או לדחות את הבקשה, היכנס ללוח הבקרה של האירוע.

בברכה,
צוות Memoria
          `.trim()
        });
      }

      // Also notify co-hosts
      if (Array.isArray(event.co_hosts)) {
        for (const coHostEmail of event.co_hosts) {
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: coHostEmail,
            subject: `בקשת הסרת תמונה - ${event.name}`,
            body: `שלום, אורח ביקש להסיר תמונה מהאירוע "${event.name}". התמונה הוסתרה אוטומטית. נא היכנס ללוח הבקרה לאישור/דחייה.`
          });
        }
      }
    }
  } catch (emailErr) {
    console.error('Failed to send notification email:', emailErr.message);
    // Non-fatal - deletion request was still saved
  }

  return Response.json({ success: true, message: 'Deletion requested. Photo hidden immediately.' });
});