import { Link } from 'react-router-dom';
import LegalPage, { LegalSection, Todo } from '@/components/legal/LegalPage';

// DRAFT for the owner's review (2026-10-28). Not legal advice: have it checked.
export default function Terms() {
  return (
    <LegalPage title="תנאי שימוש" updated={<Todo>תאריך האישור</Todo>}>
      <LegalSection title="על השירות">
        <p>
          Memoria מגיעה לאירועים עם עמדת הדפסה וצוות. האורחים סורקים QR, מצלמים מהטלפון ושולחים תמונה,
          ואנחנו מדפיסים אותה כמגנט בעיצוב של האירוע. השימוש באתר ובשירות כפוף לתנאים האלה.
        </p>
        <p>מפעילת השירות: <Todo>שם העסק, מספר עוסק או ח״פ, וכתובת</Todo></p>
      </LegalSection>

      <LegalSection title="שריון תאריך">
        <p>טופס השריון באתר הוא בקשה בלבד. התאריך שמור לכם רק אחרי שאישרנו את הזמינות וסיכמנו את פרטי האירוע והמחיר.</p>
        <p><Todo>תנאי תשלום, מקדמה וביטול, או הפניה להסכם שנחתם מול הלקוח</Todo></p>
      </LegalSection>

      <LegalSection title="שימוש של אורחים">
        <ul>
          <li>שלחו להדפסה רק תמונות שמותר לכם לצלם ולשתף.</li>
          <li>אין לשלוח תוכן פוגעני, תוכן שמפר זכויות של אחרים, או תמונה של מי שביקש לא להצטלם.</li>
          <li>מספר המגנטים לכל אורח נקבע מראש עם בעלי האירוע.</li>
        </ul>
        <p>הצוות שלנו רשאי לא להדפיס תמונה שאינה מתאימה לאירוע.</p>
      </LegalSection>

      <LegalSection title="זכויות בתמונות ובעיצובים">
        <p>התמונות שלכם נשארות שלכם. בשליחת תמונה להדפסה אתם מרשים לנו לשמור אותה, לעבד אותה ולהדפיס אותה כדי לתת את השירות.</p>
        <p>עיצובי המגנטים, האתר והתוכנה שייכים ל־Memoria, ואין להעתיק אותם.</p>
      </LegalSection>

      <LegalSection title="זמינות ואחריות">
        <p>
          אנחנו עושים הכל כדי שהשירות יעבוד היטב לאורך כל האירוע. עם זאת, הוא תלוי גם בדברים שאינם בשליטתנו,
          כמו הטלפון של האורח, החיבור לאינטרנט באולם ותנאי המקום.
        </p>
        <p><Todo>הגבלת אחריות: לנסח עם עורך דין</Todo></p>
      </LegalSection>

      <LegalSection title="פרטיות">
        <p>איך אנחנו שומרים על המידע שלכם מוסבר ב<Link to="/privacy" className="text-brand underline underline-offset-4 hover:text-foreground">מדיניות הפרטיות</Link>.</p>
      </LegalSection>

      <LegalSection title="דין וסמכות שיפוט">
        <p>על התנאים חלים דיני מדינת ישראל. <Todo>העיר שבה לבתי המשפט תהיה סמכות השיפוט</Todo></p>
      </LegalSection>

      <LegalSection title="יצירת קשר">
        <p><Todo>אימייל וטלפון לפניות</Todo></p>
      </LegalSection>
    </LegalPage>
  );
}
