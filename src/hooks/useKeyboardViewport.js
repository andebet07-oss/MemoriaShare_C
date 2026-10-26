import { useEffect, useState } from 'react';

// The on-screen keyboard leaves at least this much of the layout viewport covered.
const KEYBOARD_MIN_PX = 120;

/**
 * Tracks the on-screen keyboard through `window.visualViewport`.
 *
 * On iOS Safari (and Android Chrome's default resizes-visual mode) opening the
 * keyboard shrinks only the *visual* viewport: 100dvh and window.innerHeight stay
 * the same, so a full-height layout ends up behind the keyboard. While `open`,
 * size the layout to `height` and shift it by `offsetTop` (the visual viewport's
 * scroll inside the layout viewport) to keep it inside the visible area.
 * Page zoom is ignored so a pinch-zoom is never mistaken for a keyboard.
 */
export function useKeyboardViewport() {
  const [state, setState] = useState({ open: false, height: 0, offsetTop: 0 });

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return undefined;
    let frame = 0;

    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const open = vv.scale <= 1.01 && window.innerHeight - vv.height > KEYBOARD_MIN_PX;
        const height = Math.round(vv.height);
        const offsetTop = Math.round(vv.offsetTop);
        setState((prev) =>
          prev.open === open && prev.height === height && prev.offsetTop === offsetTop
            ? prev
            : { open, height, offsetTop });
      });
    };

    update();
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    return () => {
      cancelAnimationFrame(frame);
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
    };
  }, []);

  return state;
}
