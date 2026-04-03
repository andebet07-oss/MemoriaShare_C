import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    const photoId = payload?.event?.entity_id;
    const photoData = payload?.data;

    if (!photoId) {
      return Response.json({ error: 'No photo ID in payload' }, { status: 400 });
    }

    const hasFileUrls = !!(photoData?.file_urls?.thumbnail || photoData?.file_urls?.medium || photoData?.file_urls?.original);
    const hasFileUrl = !!photoData?.file_url;

    let diagnosis = 'ok';
    if (!hasFileUrls && !hasFileUrl) diagnosis = 'missing_both';
    else if (!hasFileUrls) diagnosis = 'missing_file_urls';

    await base44.asServiceRole.entities.UploadDiagnostic.create({
      photo_id: photoId,
      event_id: photoData?.event_id || null,
      has_file_urls: hasFileUrls,
      has_file_url: hasFileUrl,
      file_urls_snapshot: photoData?.file_urls ? JSON.stringify(photoData.file_urls) : null,
      file_url_snapshot: photoData?.file_url || null,
      guest_name: photoData?.guest_name || null,
      diagnosis,
    });

    console.log(`📊 Diagnosis for photo ${photoId}: ${diagnosis} | has_file_urls=${hasFileUrls} | has_file_url=${hasFileUrl}`);

    return Response.json({ ok: true, diagnosis });
  } catch (error) {
    console.error('diagPhotoUpload error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});