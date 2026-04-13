import React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Plus } from "lucide-react";

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
  return (
    <section id="faq" className="py-16 md:py-24" dir="rtl">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <p className="text-violet-400 text-xs font-bold tracking-widest uppercase mb-3">שאלות נפוצות</p>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">כל מה שצריך לדעת</h2>
          <p className="text-white/40 text-base max-w-2xl mx-auto">כל מה שרציתם לדעת על Memoria במקום אחד.</p>
        </div>

        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="w-full">
            {faqItems.map((item, index) => (
              <AccordionItem key={index} value={`item-${index}`} className="group bg-neutral-900/50 backdrop-blur-sm border border-white/10 rounded-2xl mb-4 transition-all duration-300 hover:border-white/[0.12] data-[state=open]:bg-neutral-800/60 data-[state=open]:border-white/15">
                <AccordionTrigger className="w-full text-right text-base font-semibold text-white p-6 hover:no-underline">
                  <div className="flex justify-between items-center w-full">
                    <span>{item.question}</span>
                    <div className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 group-data-[state=open]:bg-white/20 transition-all duration-300 shrink-0 mr-3">
                      <Plus className="w-5 h-5 text-white transition-transform duration-300 group-data-[state=open]:rotate-45" />
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-white/60 text-sm leading-relaxed px-6 pb-6">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
