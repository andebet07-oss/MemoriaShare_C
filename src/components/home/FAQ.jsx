import { useState } from 'react';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import Reveal from './Reveal';

// `todo`: a fact we don't have yet. Shown as a marked note until answered.
const FAQ_ITEMS = [
  { q: 'איך זה עובד באירוע?', a: 'אנחנו מגיעים עם עמדת הדפסה וצוות. האורחים סורקים QR, מצלמים מהטלפון ושולחים להדפסה, והמגנט מחכה להם בעמדה.' },
  { q: 'האורחים צריכים להוריד אפליקציה?', a: 'לא. הכל עובד בדפדפן של הטלפון, בלי הרשמה ובלי סיסמה.' },
  { q: 'גם אורחים מבוגרים יסתדרו?', a: 'כן. אין מה להוריד ואין מה למלא: סורקים, מצלמים ושולחים. ומי שמעדיף עזרה, הצוות שלנו נמצא בעמדה לאורך כל האירוע ושמח לעזור.' },
  { q: 'כמה מגנטים כל אורח מקבל?', a: 'אתם קובעים מראש כמה מגנטים כל אורח יכול להדפיס, והאורח רואה בטלפון כמה נשארו לו.' },
  {
    q: 'כמה זמן לוקח להדפיס מגנט?',
    a: 'המגנט מגיע לעמדה ברגע שהאורח שולח אותו, והאורח מקבל עדכון בטלפון כשהוא מוכן לאיסוף.',
    todo: 'כמה זמן לוקחת הדפסה של מגנט אחד, וכמה זמן מחכים בשעות העומס?',
  },
  {
    q: 'אפשר לצלם כבר בהתארגנות?',
    a: 'כן. אפשר לפתוח את הקישור עוד לפני האירוע, כך שגם הרגעים של ההתארגנות יכולים להפוך למגנטים.',
    todo: 'מתי מודפסים המגנטים מההתארגנות: העמדה מגיעה כבר להתארגנות, או שהם מחכים בתור עד שהעמדה נפתחת?',
  },
  {
    q: 'מה צריך מהאולם?',
    a: 'מקום לעמדת ההדפסה ושקע חשמל קרוב.',
    todo: 'כמה מקום העמדה צריכה, כמה שקעים, האם צריך שולחן מהאולם, והאם העמדה צריכה אינטרנט מהאולם?',
  },
  { q: 'אפשר לבחור את עיצוב המגנט?', a: 'כן. בוחרים עיצוב מתוך המבחר שלנו, והשמות והתאריך שלכם מודפסים על כל מגנט.' },
  { q: 'מה גודל המגנט?', a: '7.5 × 10 ס״מ, בגודל של תמונת פולרואיד.' },
  { q: 'באילו אירועים זה מתאים?', a: 'חתונות, בר ובת מצווה, בריתות, ימי הולדת ואירועי חברה.' },
  { q: 'כמה זה עולה?', a: 'המחיר תלוי במספר האורחים ובאורך האירוע. השאירו פרטים ונחזור אליכם עם הצעה.' },
];

export default function FAQ() {
  const [openIdx, setOpenIdx] = useState(null);

  return (
    <section id="faq" className="scroll-mt-20 bg-page-alt py-24 md:py-32" dir="rtl">
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-start gap-10 px-6 md:grid-cols-[2fr_3fr] md:gap-16 md:px-12">

        <Reveal className="self-start md:sticky md:top-32">
          <h2 className="text-balance text-[2.25rem] font-bold leading-[1.1] text-foreground md:text-[clamp(3rem,5vw,4.5rem)] md:leading-[1.05]">מה שצריך לדעת.</h2>
        </Reveal>

        <div className="flex flex-col">
          {FAQ_ITEMS.map((item, i) => {
            const open = openIdx === i;
            return (
              <div key={item.q}>
                <h3>
                  <button
                    type="button"
                    id={`faq-q-${i}`}
                    aria-expanded={open}
                    aria-controls={`faq-a-${i}`}
                    onClick={() => setOpenIdx(open ? null : i)}
                    className="group -mx-3 flex w-[calc(100%+1.5rem)] items-start justify-between gap-4 rounded-xl px-3 py-5 text-right transition-colors hover:bg-foreground/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60"
                  >
                    <span className="flex-1 text-lg font-semibold leading-snug text-foreground/90 transition-colors group-hover:text-foreground md:text-xl">
                      {item.q}
                    </span>
                    <Plus aria-hidden className={cn('mt-1 size-5 shrink-0 text-brand transition-transform duration-300 motion-reduce:transition-none', open && 'rotate-45')} />
                  </button>
                </h3>
                {/* Opens smoothly (grid rows 0fr → 1fr); hidden from AT and focus while closed. */}
                <div
                  id={`faq-a-${i}`}
                  role="region"
                  aria-labelledby={`faq-q-${i}`}
                  {...(open ? {} : { inert: '', 'aria-hidden': true })}
                  className={cn('grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none', open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]')}
                >
                  <div className="overflow-hidden">
                    <div className="pb-6 pt-1">
                      <p className="max-w-2xl text-[17px] leading-relaxed text-muted-foreground">{item.a}</p>
                      {item.todo && (
                        <p className="mt-3 rounded-lg border border-dashed border-destructive px-3 py-2 text-sm text-foreground">TODO: {item.todo}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
