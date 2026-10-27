import { useEffect, useRef, useState } from 'react';
import { TEMPLATES, TEMPLATE_IDS } from '@/lib/polaroid/templates';
import { useSampleMagnet } from '@/hooks/useSampleMagnet';
import SectionHeading from './SectionHeading';
import { SAMPLE_NAMES, SAMPLE_DATE, COUPLE_PHOTO, CROPS, TEMPLATE_CAPTIONS } from './homeSamples';

/** One sample magnet from the template renderer; a quiet placeholder until it is ready. */
function SampleMagnet({ templateId, orientation, name, enabled, alt }) {
  const { url } = useSampleMagnet({
    templateId, options: {}, orientation, name, date: SAMPLE_DATE,
    photo: COUPLE_PHOTO, crop: CROPS.couple[orientation], enabled,
  });
  const size = orientation === 'portrait' ? 'aspect-[3/4] w-[40%]' : 'aspect-[4/3] w-[54%]';
  return (
    <div className={`${size} shrink-0 overflow-hidden rounded-[2px] bg-foreground/5 shadow-lg`}>
      {url && <img src={url} alt={alt} loading="lazy" className="h-full w-full duration-300 animate-in fade-in" />}
    </div>
  );
}

/** Section 03: every template, portrait with Hebrew names and landscape with Latin names. */
export default function Designs() {
  const ref = useRef(null);
  const [near, setNear] = useState(false);

  // Render only when the section comes near: twelve magnets need the photo and the template fonts.
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') { setNear(true); return undefined; }
    const io = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { setNear(true); io.disconnect(); } }, { rootMargin: '600px 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section ref={ref} id="designs" className="scroll-mt-20 border-t border-border py-24 md:py-32" dir="rtl">
      <div className="container mx-auto px-6">
        <div className="mx-auto max-w-6xl">
          <SectionHeading number="03" label="עיצובים" title="בוחרים עיצוב, אנחנו מדפיסים." className="mb-16" />

          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {TEMPLATE_IDS.map((id) => {
              const { label } = TEMPLATES[id];
              return (
                <li key={id} className="rounded-2xl border border-border bg-card p-4 md:p-5">
                  <div className="flex items-end justify-center gap-[6%] px-1 pb-1 pt-2">
                    <SampleMagnet templateId={id} orientation="portrait" name={SAMPLE_NAMES.he} enabled={near}
                      alt={`מגנט לאורך בעיצוב ${label}, עם השמות ${SAMPLE_NAMES.he}`} />
                    <SampleMagnet templateId={id} orientation="landscape" name={SAMPLE_NAMES.en} enabled={near}
                      alt={`מגנט לרוחב בעיצוב ${label}, עם השמות ${SAMPLE_NAMES.en}`} />
                  </div>
                  <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                    <span className="font-semibold text-foreground">{label}</span> · {TEMPLATE_CAPTIONS[id]}
                  </p>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
