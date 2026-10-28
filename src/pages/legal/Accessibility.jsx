import LegalPage, { LegalSection, Todo } from '@/components/legal/LegalPage';

// DRAFT for the owner's review (2026-10-28). The Israeli accessibility
// regulations (2013) list what a statement must include: check it against them.
export default function Accessibility() {
  return (
    <LegalPage title="הצהרת נגישות" updated={<Todo>תאריך האישור</Todo>}>
      <LegalSection title="המחויבות שלנו">
        <p>
          אנחנו רוצים שכל אחד ואחת יוכלו להשתמש באתר ובשירות שלנו, כולל אנשים עם מוגבלות.
          אנחנו פועלים להתאים את האתר לתקן הישראלי ת״י 5568, שמבוסס על הנחיות WCAG 2.0 ברמה AA.
        </p>
        <p><Todo>האם בוצעה בדיקת נגישות מקצועית, מתי ועל ידי מי</Todo></p>
      </LegalSection>

      <LegalSection title="מה עשינו באתר">
        <p>בדף הבית ובדפי המידע (נגישות, פרטיות ותנאי שימוש):</p>
        <ul>
          <li>אפשר לנווט במקלדת, כולל קישור לדילוג לתוכן, והרכיב שנבחר מסומן במסגרת.</li>
          <li>לתמונות יש טקסט חלופי, ותמונות קישוטיות מוסתרות מקוראי מסך.</li>
          <li>הטקסט עומד ביחסי הניגודיות שהתקן דורש מול הרקע.</li>
          <li>לכל שדה בטופס יש תווית, ולשאלות הנפוצות יש כפתורים שמודיעים אם התשובה פתוחה.</li>
          <li>התוכן כתוב בעברית מימין לשמאל, עם מבנה כותרות מסודר.</li>
        </ul>
      </LegalSection>

      <LegalSection title="מה עוד לא נגיש">
        <ul>
          <li>המצלמה של האורח והמגנט המודפס הם חזותיים מטבעם. אורח שמתקשה לצלם יכול לפנות לצוות בעמדה, ונעזור לו.</li>
          <li>טופס השריון ומסכי האורח באירוע עוד לא עברו בדיקה מלאה.</li>
          <li><Todo>הגדלת תצוגה בצביטה חסומה כרגע בטלפונים (הגדרת viewport של כל האתר). להחליט אם לתקן</Todo></li>
        </ul>
      </LegalSection>

      <LegalSection title="נגישות באירוע">
        <p>הצוות שלנו נמצא בעמדת ההדפסה לאורך כל האירוע ועוזר לכל מי שצריך: סריקה, צילום ואיסוף המגנט. הנגישות הפיזית של המקום עצמו היא באחריות האולם.</p>
      </LegalSection>

      <LegalSection title="נתקלתם בבעיה?">
        <p>אם משהו באתר או בשירות לא נגיש לכם, נשמח לשמוע ולתקן.</p>
        <ul>
          <li>רכז/ת הנגישות: <Todo>שם</Todo></li>
          <li>טלפון: <Todo>טלפון</Todo></li>
          <li>אימייל: <Todo>אימייל</Todo></li>
        </ul>
      </LegalSection>
    </LegalPage>
  );
}
