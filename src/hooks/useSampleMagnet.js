import { useEffect, useState } from 'react';
import { renderComposite, loadImage } from '@/lib/polaroid/renderPolaroid';
import { getTemplate, resolveOptions } from '@/lib/polaroid/templates';
import { reportError } from '@/lib/sentry';

const photos = new Map(); // src → Promise<HTMLImageElement>, shared by every sample
function samplePhoto(src) {
  if (!photos.has(src)) {
    const p = loadImage(src);
    photos.set(src, p);
    p.catch(() => photos.delete(src));
  }
  return photos.get(src);
}

/**
 * A finished magnet rendered by the template renderer (the same code as the
 * print), as a JPEG data URL — or null until it is ready, or while `enabled`
 * is false. `scale` is pixels per design unit (1 → 300 × 400 portrait).
 * Returns { url, failed }.
 */
export function useSampleMagnet({ templateId, options, orientation, name, date, photo, crop, scale = 1, enabled = true }) {
  const [state, setState] = useState({ url: null, failed: false });
  const optionsKey = JSON.stringify(options ?? {});
  const cropKey = JSON.stringify(crop ?? null);

  useEffect(() => {
    if (!enabled) return undefined;
    let cancelled = false;
    samplePhoto(photo)
      .then((img) => renderComposite({
        templateId,
        options: resolveOptions(getTemplate(templateId), JSON.parse(optionsKey)),
        orientation, name, date, photo: img, crop: JSON.parse(cropKey),
      }, scale))
      .then((canvas) => { if (!cancelled) setState({ url: canvas.toDataURL('image/jpeg', 0.9), failed: false }); })
      .catch((err) => {
        reportError('useSampleMagnet.render', err, { templateId, orientation });
        if (!cancelled) setState({ url: null, failed: true });
      });
    return () => { cancelled = true; };
  }, [enabled, templateId, optionsKey, orientation, name, date, photo, cropKey, scale]);

  return state;
}
