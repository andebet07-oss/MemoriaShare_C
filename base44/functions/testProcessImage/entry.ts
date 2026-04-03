/**
 * testProcessImage — בודק את processImage end-to-end ללא auth (inline)
 */
import { Image } from 'https://deno.land/x/imagescript@1.2.15/mod.ts';
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

async function resizeToJpegFile(bytes, maxWidth, fileName) {
  const img = await Image.decode(bytes);
  if (maxWidth && img.width > maxWidth) {
    const ratio = maxWidth / img.width;
    img.resize(maxWidth, Math.round(img.height * ratio));
  }
  const jpegBytes = await img.encodeJPEG(85);
  return new File([jpegBytes], fileName, { type: 'image/jpeg' });
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // 1. יצור תמונה JPEG תקנית 1200x900
    const img = new Image(1200, 900);
    for (let x = 0; x < 1200; x++) {
      for (let y = 0; y < 900; y++) {
        img.setPixelAt(x + 1, y + 1, Image.rgbaToColor(x % 255, y % 255, 128, 255));
      }
    }
    const jpegBytes = await img.encodeJPEG(85);

    // 2. Convert to base64 (simulate browser)
    let binary = '';
    for (let i = 0; i < jpegBytes.length; i++) {
      binary += String.fromCharCode(jpegBytes[i]);
    }
    const base64 = btoa(binary);

    // 3. Simulate processImage logic inline
    const binaryStr = atob(base64);
    const decoded = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      decoded[i] = binaryStr.charCodeAt(i);
    }

    const baseName = 'e2e_test';
    const [thumbFile, medFile, origFile] = await Promise.all([
      resizeToJpegFile(decoded, 300, `${baseName}_thumb.jpg`),
      resizeToJpegFile(decoded, 1080, `${baseName}_medium.jpg`),
      resizeToJpegFile(decoded, null, `${baseName}_original.jpg`),
    ]);

    const [thumbResult, medResult, origResult] = await Promise.all([
      base44.integrations.Core.UploadFile({ file: thumbFile }),
      base44.integrations.Core.UploadFile({ file: medFile }),
      base44.integrations.Core.UploadFile({ file: origFile }),
    ]);

    const allPresent = !!(thumbResult.file_url && medResult.file_url && origResult.file_url);
    const allDifferent = thumbResult.file_url !== medResult.file_url && medResult.file_url !== origResult.file_url;

    return Response.json({
      success: allPresent && allDifferent,
      thumbnail_url: thumbResult.file_url,
      medium_url: medResult.file_url,
      original_url: origResult.file_url,
      all_present: allPresent,
      all_different: allDifferent,
      message: allPresent && allDifferent ? '✅ processImage logic works perfectly!' : '❌ Something is wrong',
    });

  } catch (error) {
    console.error('Error:', error.message);
    return Response.json({ error: error.message, stack: error.stack?.slice(0, 500) }, { status: 500 });
  }
});