import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

/**
 * resolvePhotoDeletion
 * Called by the event host/admin to approve or deny a deletion request.
 * - action: "approve" → deletes the photo permanently
 * - action: "deny"    → restores the photo (is_hidden = false, deletion_status = "denied")
 */
Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  const user = await base44.auth.me();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { photo_id, action } = await req.json();

  if (!photo_id || !action) {
    return Response.json({ error: 'photo_id and action are required' }, { status: 400 });
  }
  if (!['approve', 'deny'].includes(action)) {
    return Response.json({ error: 'action must be "approve" or "deny"' }, { status: 400 });
  }

  // Fetch the photo
  const photos = await base44.asServiceRole.entities.Photo.filter({ id: photo_id });
  if (!photos || photos.length === 0) {
    return Response.json({ error: 'Photo not found' }, { status: 404 });
  }
  const photo = photos[0];

  // Verify the caller is the event host, co-host, or admin
  const events = await base44.asServiceRole.entities.Event.filter({ id: photo.event_id });
  if (!events || events.length === 0) {
    return Response.json({ error: 'Event not found' }, { status: 404 });
  }
  const event = events[0];

  const isHost = event.created_by === user.email;
  const isCoHost = Array.isArray(event.co_hosts) && event.co_hosts.includes(user.email);
  const isAdmin = user.role === 'admin';

  if (!isHost && !isCoHost && !isAdmin) {
    return Response.json({ error: 'Forbidden: only the event host can resolve deletion requests' }, { status: 403 });
  }

  if (action === 'approve') {
    // Permanently delete the photo
    await base44.asServiceRole.entities.Photo.delete(photo_id);
    return Response.json({ success: true, message: 'Photo deleted permanently.' });
  } else {
    // Deny: restore visibility
    await base44.asServiceRole.entities.Photo.update(photo_id, {
      is_hidden: false,
      deletion_status: 'denied'
    });
    return Response.json({ success: true, message: 'Deletion request denied. Photo restored.' });
  }
});