import { createClientFromRequest } from 'npm:@base44/sdk@0.5.0';
import JSZip from 'npm:jszip@3.10.1';
import { Buffer } from 'https://deno.land/std@0.160.0/node/buffer.ts';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const { eventId, eventName } = await req.json();

        // Check if user is authenticated
        let currentUser;
        try {
            currentUser = await base44.auth.me();
        } catch (_error) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
        }

        // Verify user owns the event or is admin
        let events;
        try {
            events = await base44.entities.Event.filter({ id: eventId });
        } catch (_error) {
            if (currentUser.role === 'admin') {
                events = await base44.asServiceRole.entities.Event.filter({ id: eventId });
            } else {
                return new Response(JSON.stringify({ error: 'Event not found or access denied' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
            }
        }

        if (!events || events.length === 0) {
            return new Response(JSON.stringify({ error: 'Event not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
        }

        const event = events[0];

        // Authorization check: Admin OR event creator (case-insensitive email match)
        if (currentUser.role !== 'admin' &&
            event.created_by?.toLowerCase() !== currentUser.email?.toLowerCase()) {
            return new Response(JSON.stringify({ error: 'Access denied' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
        }

        const photos = await base44.entities.Photo.filter({ event_id: eventId });

        if (photos.length === 0) {
            return new Response(JSON.stringify({ error: 'No photos to export' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
        }

        const zip = new JSZip();

        // Create a clean prefix for internal filenames by replacing spaces with hyphens
        const filePrefix = (eventName || 'event').replace(/\s+/g, '-');

        await Promise.all(photos.map(async (photo, index) => {
            try {
                const response = await fetch(photo.file_url);
                if (response.ok) {
                    const imageBlob = await response.arrayBuffer();
                    const fileExtension = photo.file_url.split('.').pop()?.split('?')[0] || 'jpg';
                    // Construct the new filename with the event name prefix and a padded number
                    const fileName = `${filePrefix}-${String(index + 1).padStart(4, '0')}.${fileExtension}`;
                    zip.file(fileName, imageBlob);
                }
            } catch (error) {
                console.error(`Error processing photo ${photo.id}:`, error);
            }
        }));

        // Generate zip as an ArrayBuffer
        const zipContent = await zip.generateAsync({ type: "arraybuffer" });

        // Convert ArrayBuffer to Base64 string
        const base64Content = Buffer.from(zipContent).toString('base64');
        
        // Sanitize filename for the ZIP file itself - CORRECTED LOGIC
        const safeEventName = (eventName || 'event').replace(/\s+/g, '_').replace(/[/\\?%*:|"<>]/g, '');
        const finalZipName = `${safeEventName}_photos.zip`;

        // Return Base64 content and filename in a JSON response
        return new Response(JSON.stringify({
            fileName: finalZipName,
            fileContent: base64Content
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Error exporting photos:', error);
        return new Response(JSON.stringify({ 
            error: 'Internal Server Error', 
            details: error.message 
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
});