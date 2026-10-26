import { useState, useEffect } from 'react';
import { renderOverlay } from '@/lib/polaroid/renderPolaroid';
import { reportError } from '@/lib/sentry';

/**
 * The event's template frame with a transparent photo window, rendered for the
 * live viewfinder at `widthPx` CSS pixels (× device pixel ratio for sharpness).
 * Returns { url, orientation } of the last finished render — callers show it
 * only when it matches the current orientation — or null while none is ready.
 */
export function usePolaroidOverlay(spec, orientation, widthPx) {
  const [overlay, setOverlay] = useState(null);
  const optionsKey = JSON.stringify(spec.options);

  useEffect(() => {
    if (!widthPx) return undefined;
    let cancelled = false;
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    renderOverlay({ ...spec, orientation }, Math.round(widthPx * dpr))
      .then((canvas) => {
        if (!cancelled) setOverlay({ url: canvas.toDataURL('image/png'), orientation });
      })
      .catch((err) => reportError('usePolaroidOverlay.render', err, { templateId: spec.templateId }));
    return () => { cancelled = true; };
  }, [spec.templateId, optionsKey, spec.name, spec.date, orientation, widthPx]);

  return overlay;
}
