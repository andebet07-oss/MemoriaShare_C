import { useEffect, useState } from 'react';

/**
 * True while the element behind `ref` intersects the viewport (grown by
 * `rootMargin`). With `once`, it stays true after the first time.
 * Without IntersectionObserver it reports true, so content is never held back.
 */
export function useInView(ref, { rootMargin = '0px', once = false } = {}) {
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    if (typeof IntersectionObserver === 'undefined') { setInView(true); return undefined; }
    const observer = new IntersectionObserver(([entry]) => {
      setInView(entry.isIntersecting);
      if (once && entry.isIntersecting) observer.disconnect();
    }, { rootMargin });
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, rootMargin, once]);

  return inView;
}
