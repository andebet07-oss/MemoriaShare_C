import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';
import JSZip from 'npm:jszip@3.10.1';

Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);
    let export_task_id = null;

    try {
        const payload = await req.json();
        // Automation sends: { event: { entity_id }, data: { ... } }
        export_task_id = payload?.event?.entity_id || payload?.export_task_id;

        if (!export_task_id) {
            return Response.json({ error: 'export_task_id is required' }, { status: 400 });
        }

        const exportTask = await base44.asServiceRole.entities.ExportTask.get(export_task_id);
        if (!exportTask) {
            return Response.json({ error: 'ExportTask not found' }, { status: 404 });
        }

        // Only process pending tasks (avoid double-processing)
        if (exportTask.status !== 'pending') {
            return Response.json({ message: `Task already in status: ${exportTask.status}` });
        }

        await base44.asServiceRole.entities.ExportTask.update(export_task_id, {
            status: 'processing',
            progress_percentage: 0
        });

        // Fetch all photos for the event
        const photos = await base44.asServiceRole.entities.Photo.filter(
            { event_id: exportTask.event_id },
            '-created_date',
            500
        );

        if (photos.length === 0) {
            await base44.asServiceRole.entities.ExportTask.update(export_task_id, {
                status: 'failed',
                error_message: 'No photos found for this event.'
            });
            return Response.json({ message: 'No photos found' });
        }

        const zip = new JSZip();
        const CHUNK_SIZE = 10;
        let processedCount = 0;
        let fileIndex = 0;

        for (let i = 0; i < photos.length; i += CHUNK_SIZE) {
            const chunk = photos.slice(i, i + CHUNK_SIZE);

            await Promise.all(chunk.map(async (photo) => {
                try {
                    const response = await fetch(photo.file_url);
                    if (!response.ok) throw new Error(`HTTP ${response.status}`);

                    const buffer = await response.arrayBuffer();
                    const ext = photo.file_url.split('.').pop().split('?')[0] || 'jpg';
                    const idx = ++fileIndex;
                    const filename = `photo_${idx}.${ext}`;

                    // STORE instead of DEFLATE — JPEGs are already compressed.
                    zip.file(filename, buffer, { compression: 'STORE' });
                } catch (fetchErr) {
                    console.warn(`Skipping photo ${photo.id}: ${fetchErr.message}`);
                }
            }));

            processedCount += chunk.length;
            const pct = Math.round((processedCount / photos.length) * 90);
            await base44.asServiceRole.entities.ExportTask.update(export_task_id, {
                progress_percentage: pct
            });
        }

        // Generate ZIP using STORE compression (critical for memory efficiency)
        const zipUint8 = await zip.generateAsync({
            type: 'uint8array',
            compression: 'STORE'
        });

        const zipFile = new File([zipUint8], `event_${exportTask.event_id}_photos.zip`, { type: 'application/zip' });

        // Upload to private storage
        const uploadResult = await base44.asServiceRole.integrations.Core.UploadPrivateFile({
            file: zipFile
        });

        // Generate signed URL valid for 24 hours
        const signedResult = await base44.asServiceRole.integrations.Core.CreateFileSignedUrl({
            file_uri: uploadResult.file_uri,
            expires_in: 86400
        });

        await base44.asServiceRole.entities.ExportTask.update(export_task_id, {
            status: 'completed',
            signed_url: signedResult.signed_url,
            progress_percentage: 100
        });

        return Response.json({ message: 'Export completed', signed_url: signedResult.signed_url });

    } catch (error) {
        console.error('processExportJob error:', error);
        if (export_task_id) {
            await base44.asServiceRole.entities.ExportTask.update(export_task_id, {
                status: 'failed',
                error_message: error.message
            });
        }
        return Response.json({ error: error.message }, { status: 500 });
    }
});