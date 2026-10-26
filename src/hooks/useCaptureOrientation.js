import { useState, useEffect, useCallback } from 'react';

const LANDSCAPE_QUERY = '(orientation: landscape)';
const isLandscapeScreen = () =>
  typeof window !== 'undefined' && !!window.matchMedia?.(LANDSCAPE_QUERY).matches;

/**
 * The magnet orientation for the guest camera.
 * Follows how the phone is held (the screen orientation) and switches live
 * when it rotates. `toggle` flips it by hand — for phones with rotation lock
 * and desktops — until the next rotation.
 * @returns {{ orientation: 'portrait'|'landscape', screenLandscape: boolean, toggle: () => void }}
 */
export function useCaptureOrientation() {
  const [screenLandscape, setScreenLandscape] = useState(isLandscapeScreen);
  const [orientation, setOrientation] = useState(() => (isLandscapeScreen() ? 'landscape' : 'portrait'));

  useEffect(() => {
    const mq = window.matchMedia?.(LANDSCAPE_QUERY);
    if (!mq) return undefined;
    const onChange = (e) => {
      setScreenLandscape(e.matches);
      setOrientation(e.matches ? 'landscape' : 'portrait');
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const toggle = useCallback(() => setOrientation(o => (o === 'landscape' ? 'portrait' : 'landscape')), []);

  return { orientation, screenLandscape, toggle };
}
