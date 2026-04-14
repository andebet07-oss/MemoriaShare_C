import React, { useState } from 'react';

const faqItems = [
  {
    question: "מה זה Memoria ואיך זה עובד?",
    answer: "Memoria היא פלטפורמה לשיתוף תמונות באירועים. אתם יוצרים אירוע ומקבלים קוד QR ייחודי. האורחים סורקים את הקוד, מצלמים ומעלים תמונות ישירות מהטלפון שלהם. כל התמונות מתרכזות באלבום דיגיטלי אחד, זמין לכם ולאורחים."
  },
  {
    question: "האם האורחים צריכים להוריד אפליקציה?",
    answer: "ממש לא. כל התהליך מתבצע דרך דפדפן האינטרנט בטלפון, ללא צורך בהתקנת אפליקציה. זה מה שהופך את Memoria לפשוטה ונגישה לכולם."
  },
  {
    question: "מהי איכות התמונות שעולות לאלבום?",
    answer: "התמונות נשמרות באיכות גבוהה. המערכת מבצעת אופטימיזציה קלה כדי להבטיח טעינה מהירה, אך שומרת על איכות מספקת להדפסה ולשיתוף ברשתות חברתיות."
  },
  {
    question: "האם אני יכול לשלוט בפרטיות התמונות?",
    answer: "בהחלט. יש לכם שליטה מלאה. בעת יצירת האירוע, תוכלו לבחור אם התמונות יוצגו מיידית, לאחר זמן מסוים, או רק לאחר אישור ידני שלכם. כמו כן, תוכלו להחליט אם הגלריה תהיה פרטית (רק לכם) או פתוחה לצפייה של כל האורחים."
  },
  {
    question: "כמה עולה להשתמש בשירות?",
    answer: "התמחור שלנו גמיש ומבוסס על כמות האורחים באירוע. תוכלו לראות את כל החבילות בעמוד יצירת האירוע. יש לנו חבילות שמתאימות לאירועים קטנים וגדולים כאחד."
  },
  {
    question: "האם ניתן להוריד את כל התמונות בסיום האירוע?",
    answer: "כן! בפאנל הניהול של האירוע, יש לכם אפשרות להוריד את כל התמונות המאושרות בקליק אחד, כקובץ ZIP מסודר."
  },
  {
    question: "מה ההבדל בין אלבום דיגיטלי לשירות המגנטים?",
    answer: "האלבום הדיגיטלי הוא שירות עצמאי — יוצרים אירוע, מקבלים QR, האורחים מצלמים ומעלים תמונות. שירות המגנטים הוא חוויה פרמיום מנוהלת: צוות שלנו מגיע עם עמדת הדפסה, והאורחים מקבלים מגנטים מודפסים במקום. תוכלו לבחור את מה שמתאים לכם כשתלחצו על 'צרו אירוע'."
  }
];

export default function FAQ() {
  const [openIdx, setOpenIdx] = useState(null);

  return (
    <section id="faq" className="py-24 md:py-32 border-t border-white/5" dir="rtl">
      <div className="container mx-auto px-6">
        <div className="max-w-6xl mx-auto grid md:grid-cols-[1fr_2fr] gap-12 md:gap-20 items-start">

          {/* Left header */}
          <div className="md:sticky md:top-32 self-start">
            <p className="text-[#b8945f] text-[10px] font-bold tracking-[0.3em] uppercase mb-6">04 · שאלות</p>
            <h2 className="font-editorial text-4xl md:text-5xl leading-[1.1] text-[#e8e2d5]">
              כל מה
              <br />
              <span className="italic text-[#a89a85]">שצריך לדעת.</span>
            </h2>
          </div>

          {/* Accordion — hairline dividers, no cards */}
          <div>
            {faqItems.map((item, index) => (
              <div
                key={index}
                className="border-b border-white/[0.08] last:border-b-0"
              >
                <button
                  type="button"
                  onClick={() => setOpenIdx(openIdx === index ? null : index)}
                  className="w-full text-right py-6 flex justify-between items-start gap-4 group"
                >
                  <span className="font-editorial text-[#e8e2d5] text-lg leading-snug group-hover:text-white transition-colors text-right flex-1">
                    {item.question}
                  </span>
                  <span
                    className="text-[#a89a85] text-xl leading-none shrink-0 mt-0.5 transition-transform duration-300 select-none"
                    style={{ transform: openIdx === index ? 'rotate(45deg)' : 'none' }}
                  >
                    +
                  </span>
                </button>
                {openIdx === index && (
                  <div className="pb-6 pr-0">
                    <p className="text-[#a89a85] text-base leading-relaxed">{item.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}
