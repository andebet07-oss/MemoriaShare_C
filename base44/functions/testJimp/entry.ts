import { Jimp } from 'npm:jimp@1.6.0';
import { Buffer } from 'node:buffer';

Deno.serve(async (req) => {
  try {
    // Step 1: Create a valid JPEG via Jimp
    const image = new Jimp({ width: 100, height: 100, color: 0xff0000ff });
    const jpegBuf = await image.getBuffer('image/jpeg', { quality: 85 });

    // Step 2: Convert to base64
    const base64 = Buffer.from(jpegBuf).toString('base64');

    // Step 3: Decode back and resize (simulate processImage flow)
    const decoded = Buffer.from(base64, 'base64');
    const image2 = await Jimp.fromBuffer(decoded);
    image2.resize({ w: 50 });
    const resizedBuf = await image2.getBuffer('image/jpeg', { quality: 85 });

    return Response.json({ 
      success: true, 
      original_size: jpegBuf.length,
      resized_size: resizedBuf.length,
      base64_length: base64.length,
      message: 'Full pipeline works!'
    });
  } catch (error) {
    return Response.json({ error: error.message, stack: error.stack?.slice(0,500) }, { status: 500 });
  }
});