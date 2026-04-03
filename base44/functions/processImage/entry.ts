import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import { Image } from 'https://deno.land/x/imagescript@1.2.15/mod.ts';

/**
 * processImage — Backend Image Processing Function
 *
 * מקבל תמונה מקורית (base64 של JPEG או PNG), מבצע Resize ל-3 גרסאות,
 * ומעלה כל גרסה ל-Storage בנפרד.
 *
 * Payload: { file_base64: string, file_name: string }
 * Returns: { thumbnail_url, medium_url, original_url }
 */

async function resizeToJpegFile(bytes, maxWidth, fileName) {
  const img = await Image.decode(bytes);

  if (maxWidth && img.width > maxWidth) {
    const ratio = maxWidth / img.width;
    const newHeight = Math.round(img.height * ratio);
    img.resize(maxWidth, newHeight);
  }

  const jpegBytes = await img.encodeJPEG(85);
  return new File([jpegBytes], fileName, { type: 'image/jpeg' });
}

Deno.serve(async (req) => {
  console.log("🟢 processImage called at", new Date().toISOString());
  try {
    const base44 = createClientFromRequest(req);

    const { file_base64, file_name } = await req.json();
    console.log("📦 processImage payload received — file_name:", file_name, "| base64 length:", file_base64?.length);

    if (!file_base64 || !file_name) {
      return Response.json({ error: 'חסרים פרמטרים: file_base64, file_name' }, { status: 400 });
    }

    // Decode base64
    const binaryStr = atob(file_base64);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }

    const baseName = file_name.replace(/\.[^.]+$/, '');

    // Generate all 3 versions in parallel
    const [thumbnailFile, mediumFile, originalFile] = await Promise.all([
      resizeToJpegFile(bytes, 300, `${baseName}_thumb.jpg`),
      resizeToJpegFile(bytes, 1080, `${baseName}_medium.jpg`),
      resizeToJpegFile(bytes, null, `${baseName}_original.jpg`),
    ]);

    // Upload all 3 versions in parallel (service role — works for unauthenticated guests too)
    const [thumbnailResult, mediumResult, originalResult] = await Promise.all([
      base44.asServiceRole.integrations.Core.UploadFile({ file: thumbnailFile }),
      base44.asServiceRole.integrations.Core.UploadFile({ file: mediumFile }),
      base44.asServiceRole.integrations.Core.UploadFile({ file: originalFile }),
    ]);

    return Response.json({
      thumbnail_url: thumbnailResult.file_url,
      medium_url: mediumResult.file_url,
      original_url: originalResult.file_url,
    });

  } catch (error) {
    console.error('processImage error:', error.message, error.stack?.slice(0, 500));
    return Response.json({ error: error.message }, { status: 500 });
  }
});