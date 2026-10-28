import { useState } from 'react';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import SectionHeading from './SectionHeading';

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
    <section id="faq" className="scroll-mt-20 border-t border-border py-24 md:py-32" dir="rtl">
      <div className="container mx-auto px-6">
        <div className="mx-auto grid max-w-6xl items-start gap-12 md:grid-cols-[1fr_2fr] md:gap-20">

          <SectionHeading number="04" label="שאלות" title="מה שצריך לדעת." className="self-start md:sticky md:top-32" />

          <div>
            {FAQ_ITEMS.map((item, i) => {
              const open = openIdx === i;
              return (
                <div key={item.q} className="border-b border-border last:border-b-0">
                  <h3>
                    <button
                      type="button"
                      id={`faq-q-${i}`}
                      aria-expanded={open}
                      aria-controls={`faq-a-${i}`}
                      onClick={() => setOpenIdx(open ? null : i)}
                      className="group flex w-full items-start justify-between gap-4 py-6 text-right"
                    >
                      <span className="flex-1 text-lg font-semibold leading-snug text-foreground/90 transition-colors group-hover:text-foreground">
                        {item.q}
                      </span>
                      <Plus aria-hidden className={cn('mt-1 size-5 shrink-0 text-muted-foreground transition-transform duration-300', open && 'rotate-45')} />
                    </button>
                  </h3>
                  {open && (
                    <div id={`faq-a-${i}`} role="region" aria-labelledby={`faq-q-${i}`} className="pb-6">
                      <p className="text-base font-light leading-relaxed text-muted-foreground">{item.a}</p>
                      {item.todo && (
                        <p className="mt-3 rounded-lg border border-dashed border-destructive px-3 py-2 text-sm text-foreground">TODO: {item.todo}</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>
      </div>
    </section>
  );
}
