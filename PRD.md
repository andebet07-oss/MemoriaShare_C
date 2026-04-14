# מסמך אפיון מוצר (PRD) — MemoriaShare
**גרסה:** 1.0  
**תאריך:** אפריל 2026  
**סטטוס:** פעיל בייצור

---

## 1. סיכום מנהלים

### מה זה MemoriaShare?
MemoriaShare היא אפליקציית Web App לשיתוף תמונות באירועים בזמן אמת. הפלטפורמה מאפשרת למארגן אירוע ליצור אלבום דיגיטלי ייחודי, ולשתף אותו עם האורחים באמצעות קישור ייחודי או קוד QR — ללא צורך בהתקנת אפליקציה.

### הבעיה שאנו פותרים
אירועים כמו חתונות, בר/בת מצוות, ימי הולדת ואירועי חברה מייצרים מאות תמונות שמפוזרות בין עשרות טלפונים. איסוף התמונות שאחרי האירוע הוא תהליך מייגע: שיחות WhatsApp, בקשות חוזרות, כפילויות, ותמונות שהולכות לאיבוד.

**MemoriaShare פותרת את הבעיה בזמן האירוע עצמו** — הצלמו, הועלו, ואתם כבר שם.

### הצעת הערך המרכזית
> **"האורחים מצלמים, הכל באלבום אחד."**

---

## 2. לוגיקה עסקית ומיצוב שוק

### קהל יעד

| סגמנט | תיאור | כאב עיקרי |
|---|---|---|
| **מארגני אירועים** | זוגות, הורים, מנהלי אירועים, HR | "איך אאסוף את כל התמונות אחרי?" |
| **אורחים** | כל מי שמגיע עם טלפון | "רוצה לשתף, אבל לא לעבוד קשה" |
| **צלמים מקצועיים** | פוטוגרפים שרוצים גלריה ממותגת | "לקוחות מבקשים גישה מיידית לתמונות" |

### יתרון תחרותי
- **ללא הורדה:** גלישה לקישור מספיקה
- **מיידי:** התמונה מופיעה בגלריה תוך שניות
- **פרטיות מובנית:** RLS מבטיח שכל אורח רואה רק מה שמותר לו
- **אפס חיכוך:** אורחים לא מחויבים להתחברות — העלאה אנונימית אפשרית

---

## 3. תכונות מוצר — מקצה לקצה

### 3.1 דף הנחיתה (Landing Page)

**מטרה:** המרת מבקרים ליוצרי אירועים.

**תוכן:**
- כותרת ראשית: "Memoria" עם אפקט גרדיאנט
- תת-כותרת: "האורחים מצלמים, הכל באלבום אחד"
- **Fan של 3 אייפונים:** הדמיית ממשק האפליקציה עם תמונות אמיתיות מאירועים — מציגה ויזואלית את חוויית הגלריה
- שני CTAs: "צור אירוע חדש" ו"צפו בהדגמה"
- אנימציית floating על האייפונים לתחושת חיים

**טריגרים:**
- משתמש מחובר → ניווט לדשבורד
- משתמש לא מחובר → ניווט לאימות Google

---

### 3.2 יצירת אירוע (CreateEvent)

**מארגן ממלא:**

| שדה | חובה | פירוט |
|---|---|---|
| שם האירוע | ✅ | טקסט חופשי |
| תאריך האירוע | ✅ | date picker |
| תמונת שער | ✅ | העלאה עם תצוגה מקדימה בתוך מוק-אפ אייפון |
| מס׳ תמונות מקסימלי לאורח | ⬜ | ברירת מחדל: 15 |
| זמן סגירת העלאות | ⬜ | datetime לאחריו העלאות נחסמות |
| אישור אוטומטי לתמונות | ⬜ | toggle: מיידי / ממתין לאישור מארגן |

**תצוגה מקדימה:**
- מוק-אפ אייפון חי מתעדכן בזמן אמת בזמן שהמארגן ממלא את הפרטים
- תמיכה בגרירת תמונת השער בתוך המסך

**לאחר יצירה:**
- ניווט אוטומטי לעמוד EventSuccess
- יצירת קישור ייחודי + QR Code

---

### 3.3 עמוד ההצלחה (EventSuccess)

- הצגת ה-QR Code להדפסה/שיתוף
- כפתור "העתק קישור" לשיתוף ישיר ב-WhatsApp
- כפתור מעבר לדשבורד האירוע
- אנימציית קונפטי לחגיגיות

---

### 3.4 חוויית האורח — גלריה (EventGallery)

**כניסה לאירוע — מודל "ספר האורחים":**
- אורח סורק QR או לוחץ על קישור → `memoriashare.com/EventGallery?code=XXXX`
- מופיע מודל "ספר האורחים" (Guest Book) המבקש:
  - **שם** (חובה) — השם שיופיע על התמונות
  - **ברכה לבעל האירוע** (אופציונלי) — טקסט חופשי
- עם אישור הטופס, המערכת מבצעת **Supabase Anonymous Sign-In**
- האורח מקבל `auth.uid()` אמיתי — RLS עובד בדיוק כמו למשתמשים מחוברים
- **אורחים אינם נדרשים לחשבון Google** — כניסה אנונימית בלבד
- מארגני אירועים בלבד משתמשים ב-Google OAuth

> **הערה טכנית:** `device_uuid` מדור קודם אינו בשימוש. זהות האורח מנוהלת אך ורק דרך `auth.uid()` מ-Supabase Anonymous Auth. שם האורח נשמר בעמודת `guest_name` ב-`photos`, הברכה ב-`guest_greeting`.

**העלאת תמונות:**
- כפתור "העלו מהגלריה" → בחירת קבצים מרובים
- דחיסה אוטומטית בצד הלקוח לפני שידור (Canvas API, max 1920px)
- תמיכה בפילטרים על תמונות לפני שליחה
- מד התקדמות בזמן העלאת batch

**מצלמת POV נייטיב (`CameraCapture.jsx`):**
- כפתור "צלמו עכשיו" → פתיחת מצלמת WebRTC ב-full-screen
- ממשק מצלמה: שכבות `absolute` צפות על גבי וידאו `inset-0` — **לא** `flex flex-col` (שגורם לתצוגה מוצצת ב-landscape)
- פילטר וינטג׳ בזמן אמת: CSS `filter:` על ה-`<video>` בלבד (ביצועים מלאים גם ב-Android mid-range)
- פילטר מוצמד לתמונה השמורה: pixel manipulation (Canvas) רק ברגע הצילום — לא ב-live feed
- אפקט תריס מכני: black frame (25ms) → white flash — מחקה תחושת מצלמה פיזית
- פלאש קדמי: overlay `bg-[#FFF5EC]` עם `transitionDuration` דינמי
- פלאש אחורי: Hardware torch דרך `videoTrack.applyConstraints({ advanced: [{ torch }] })` עם guard `getCapabilities()`
- Fallback אוטומטי ל-`OverconstrainedError`: ניסיון ראשון עם constraints אידיאליים, retry עם `facingMode` בלבד
- תמיכה מלאה ב-iOS Safari: `autoPlay playsInline muted` + `.play().catch()`
- כפתור Volume Down מפעיל צילום (Android/Desktop)
- גלריה מהירה (bottom sheet) לסקירת תמונות ממתינות לפני העלאה

**גלריה מפוצלת לשתי לשוניות:**

| לשונית | מה מוצג |
|---|---|
| **התמונות שלי** | כל תמונות האורח הנוכחי (`auth.uid() = created_by`), כולל ממתינות לאישור |
| **גלריה משותפת** | תמונות מאושרות + לא מוסתרות (או כל תמונה אם `auto_publish = true`) |

- ספירת תמונות בתג על כל לשונית
- PhotoViewer מלא עם ניווט swipe ומקלדת
- אפשרות לבקש מחיקת תמונה (`deletion_status = 'requested'`)

**אימות לפי סוג משתמש:**

| סוג | שיטת כניסה | הרשאות |
|---|---|---|
| מארגן אירוע | Google OAuth (Supabase Auth) | יצירת אירועים, ניהול גלריה מלא |
| אורח | Supabase Anonymous Sign-In | העלאה, צפייה, בקשת מחיקה |

**מגבלות קוטה בזמן אמת:**
1. `guest_tier` — מגבלת מספר משתמשים ייחודיים לאירוע (10 / 100 / 250 / 400 / 600 / 800 / ∞)
2. `max_uploads_per_user` — תמונות מקסימליות לאורח (ברירת מחדל: 15)
3. `upload_closure_datetime` — חסימה אוטומטית לאחר זמן שנקבע
4. בעל האירוע ו-co-hosts פטורים מכל מגבלה

---

### 3.5 דשבורד המארגן (Dashboard)

**לשונית: ניהול גלריה**
- תצוגת כל התמונות (כולל לא מאושרות)
- אישור / דחיית תמונות בודדות
- מחיקה ישירה
- מאזן בקשות מחיקה מאורחים

**לשונית: הגדרות אירוע**
- עריכת שם, תאריך, תמונת שער
- toggle: אישור אוטומטי של תמונות (auto_publish_guest_photos)
- ניהול co-hosts: הוספת מארגנים משותפים לפי אימייל
- הדפסת כרטיסי שיתוף (PrintableShareCards)

**לשונית: ייצוא**
- הורדת כל תמונות האירוע כ-ZIP (JSZip, עם progress bar)

**התראות Realtime:**
- כשאורח מעלה תמונה — התראה חיה בממשק המארגן

---

## 4. מסלול משתמש — User Journey

```
┌─────────────────────────────────────────────────────────────────┐
│                      LANDING PAGE                               │
│  Fan של אייפונים • CTA "צור אירוע חדש"                         │
└─────────────┬───────────────────────────────────────────────────┘
              │ לחיצה על CTA
              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    GOOGLE OAUTH (Supabase)                       │
│  כניסה חד-פעמית • יצירת פרופיל אוטומטית                       │
└─────────────┬───────────────────────────────────────────────────┘
              │ הצלחה
              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     CREATE EVENT                                 │
│  שם • תאריך • תמונת שער • הגדרות quota                        │
└─────────────┬───────────────────────────────────────────────────┘
              │ שמירה
              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     EVENT SUCCESS                                │
│  QR Code + קישור שיתוף • כפתור WhatsApp                        │
└──────┬──────────────────────────────────────────────┬───────────┘
       │ מארגן ←                          → אורחים   │
       ▼                                              ▼
┌──────────────────┐                    ┌─────────────────────────┐
│    DASHBOARD     │                    │    EVENT GALLERY        │
│ ניהול + ייצוא   │◄─── Realtime ──────│ צלמו • העלו • צפו       │
└──────────────────┘                    └─────────────────────────┘
```

---

## 5. ארכיטקטורה טכנית

### 5.1 Frontend

| טכנולוגיה | שימוש |
|---|---|
| **React 18** | UI framework, hooks, context |
| **Vite 6** | Build tool, dev server, HMR |
| **Tailwind CSS 3** | Utility-first styling, responsive design |
| **shadcn/ui + Radix UI** | רכיבי UI נגישים (Tabs, Dialog, Switch...) |
| **Framer Motion** | אנימציות (modal transitions, floating phones) |
| **React Router v6** | ניתוב SPA |
| **canvas-confetti** | אנימציית הצלחה ביצירת אירוע |
| **JSZip** | ייצוא תמונות כ-ZIP בצד הלקוח |
| **Canvas API** | דחיסת תמונות, פילטר וינטג׳ baked-in לתמונה שמורה, חותמת תאריך |
| **MediaDevices WebRTC API** | גישה למצלמה, `getUserMedia`, Hardware Torch, `OverconstrainedError` fallback |

**ארכיטקטורת שכבות בפרונטאנד:**

```
src/
  pages/          ← עמודים ראשיים (route-level components)
  components/     ← רכיבי UI ורכיבים משותפים
  hooks/          ← לוגיקת state (useEventGallery, useRealtimeNotifications)
  functions/      ← לוגיקה עסקית (checkGuestQuota, getMyPhotos)
  lib/            ← תשתית (supabase client, AuthContext)
```

---

### 5.2 Backend — Supabase

**אימות (Auth)**
- Google OAuth 2.0 דרך Supabase Auth
- Trigger אוטומטי: `handle_new_user()` — עם יצירת משתמש חדש ב-`auth.users`, נוצרת שורה ב-`public.profiles`
- תמיכה ב-PKCE flow לאבטחה מקסימלית

**מסד נתונים (PostgreSQL)**

```
profiles        → id, email, full_name, avatar_url, role
events          → id, name, date, cover_image, created_by, co_hosts,
                  auto_publish_guest_photos, max_uploads_per_user,
                  guest_tier, upload_closure_datetime, is_active
photos          → id, event_id, file_url, path, created_by, device_uuid,
                  is_approved, is_hidden, guest_name, deletion_status
```

**אחסון (Storage)**
- Bucket: `photos`
- מבנה path: `{event_id}/{timestamp}_{filename}`
- Public URLs לגישה ישירה לתמונות מאושרות

**Realtime**
- `REPLICA IDENTITY FULL` על טבלת `photos`
- Subscription מסונן לפי `event_id` — כל לקוח מאזין רק לאירוע שלו
- אירועים: `INSERT` (התראה על העלאה חדשה), `UPDATE` (אישור/הסתרה), `DELETE`

---

### 5.3 אבטחה — Row Level Security (RLS)

| פוליסה | טבלה | כלל |
|---|---|---|
| `events_select_public` | events | כל אחד יכול לקרוא אירועים פעילים |
| `events_insert_auth` | events | רק משתמשים מחוברים יכולים ליצור אירוע |
| `events_update_owner` | events | רק `created_by` יכול לערוך |
| `photos_select_public` | photos | כל אחד רואה תמונות מאושרות + לא מוסתרות |
| `photos_select_owner` | photos | בעל האירוע רואה את כל התמונות |
| `photos_insert_any` | photos | כל אחד יכול להעלות תמונה |
| `photos_update_owner` | photos | רק בעל האירוע יכול לשנות סטטוס |
| `photos_delete_owner` | photos | רק בעל האירוע יכול למחוק |

---

### 5.4 פריסה (Deployment)

- **Vercel** — CI/CD אוטומטי מ-GitHub
- `vercel.json` — Rewrite rule לטיפול ב-SPA routing: כל בקשה → `index.html`
- **משתני סביבה:** `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_SITE_URL`
- **PWA:** `manifest.json` עם שם, צבע, ותמיכה ב-Add to Home Screen

---

## 6. מדדי הצלחה (KPIs)

| מדד | יעד |
|---|---|
| אירועים שנוצרו לחודש | 100+ |
| תמונות שהועלו לאירוע (ממוצע) | 50+ |
| שיעור אורחים שמעלים | >40% מהנוכחים |
| זמן מעלה תמונה ← מופיעה בגלריה | <3 שניות |
| אחוז שגיאות העלאה | <2% |

---

## 7. מפת דרכים — Roadmap

### הושלם (אפריל 2026)
- [x] **עיצוב מחדש של מצלמת POV** — ממשק full-screen floating עם שכבות `absolute`, פילטר וינטג׳ בזמן אמת (CSS), אפקט תריס מכני, תמיכה ב-iOS Safari + Android Chrome
- [x] **Bulk Moderation** — בחירה מרובה ואישור/מחיקה של תמונות ב-Dashboard
- [x] **גלריה Instagram-style** — תצוגת תמונות `aspect-[4/5]`, `gap-px`, לשוניות נייטיב במקום shadcn Tabs
- [x] **תיקון Auth refresh** — מניעת deadlock ב-Supabase mutex, two-phase auth עם `buildBaseUser` + `enrichWithProfile`

### פאזה 2 — חוויה עשירה יותר
- [ ] **תגיות פנים (Face Tagging):** זיהוי אוטומטי של אנשים בתמונות לסינון אישי
- [ ] **הדפסה מהגלריה:** יצירת עמוד PDF מוכן להדפסה עם תמונות נבחרות
- [ ] **ממשק מארגן מובייל מוקדש:** ניהול אישורים בזמן האירוע ממסך קטן
- [ ] **הגבלת גישה בסיסמה:** הגנה נוספת על גלריות פרטיות

### פאזה 3 — מוניטיזציה
- [ ] **תוכניות מנוי:** Free (1 אירוע), Pro (ללא הגבלה), Business (white-label)
- [ ] **מיתוג מותאם:** לוגו בעל האירוע על הגלריה וה-QR
- [ ] **אינטגרציה עם Stripe:** ניהול תשלומים ומנויים
- [ ] **API ציבורי:** אינטגרציה עם Wolt Events, Eventbrite וכו׳

### פאזה 4 — סקאלה ותפעול
- [ ] **Edge Functions לעיבוד תמונות:** resize, watermark, EXIF stripping בשרת
- [ ] **CDN מבוזר:** Supabase Storage + CloudFront לזמני טעינה מהירים יותר בעולם
- [ ] **אנליטיקס מארגן:** כמה אורחים צפו, איזו שעה הכי הרבה תמונות הועלו
- [ ] **Webhook notifications:** התראה למארגן ב-WhatsApp / אימייל על תמונות חדשות

---

## 8. MemoriaMagnet — חוויית מגנטים (פרמיום)

### 8.1 סיכום מוצר

MemoriaMagnet הוא שירות מנוהל (לא self-service): אדמין Memoria מגיע לאירוע עם מדפסת, יוצר אירוע מראש, והאורחים מצלמים דרך הממשק ושולחים להדפסת מגנט פיזי.

**ערך לאורח:** מזכרת פיזית ממוקדת — מגנט מודפס מהאירוע, ללא לחץ ("לא רוצה לרדוף אחרי הצלם ולאסוף כולם").
**ערך למזמין האירוע:** "Wow moment" שאורחים לא ישכחו — נקודות זכות אדירות.

### 8.2 ניתוח תחרות — getmemo.co.il

| פרמטר | memo | Memoria |
|---|---|---|
| **מחיר** | ₪2,500 רגיל / ₪1,800 הנחת מלחמה | ₪2,200–₪2,500 |
| **מצלמה** | טלפון של האורח דרך QR על השולחן | טלפון של האורח דרך QR |
| **פרסום הקישור** | בוקר האירוע | ✅ יכול להיות בזמן אמת (בהחלטת המארח) |
| **כמות הדפסות** | ללא הגבלה | קווטה מוגדרת מראש (מגמישות לפי חבילה) |
| **קובץ דיגיטלי** | יום למחרת האירוע | גלריה חיה בזמן אמת (אם המארח מאפשר MemoriaShare) |
| **מדבקות על תמונה** | ✅ (feature בולט) | ✅ (מיושם) |
| **עיצוב ממשק** | בסיסי | ✅ יתרון מוצהר — איכות גבוהה יותר |

**הבידול העיקרי של Memoria:**
- אחת + אחד: מגנטים + גלריה דיגיטלית חיה (MemoriaShare) = שתי חוויות במחיר דומה
- איכות ממשק המצלמה ואיכות תמונות האורח כיתרון
- ה-QR יכול להיות הן על השולחן והן בפתח האולם

> **חשוב:** גלריה דיגיטלית בזמן אמת היא feature של MemoriaShare ונשלטת ע"י המארח — היא לא תכונה אוטומטית של MemoriaMagnet.

### 8.3 תמחור מומלץ

| גודל אירוע | משך | מחיר | מה כלול |
|---|---|---|---|
| עד 150 אורחים | 3 שעות | ₪2,000–₪2,500 | מפעיל, מדפסת, 1 מגנט לאורח |
| 150–300 אורחים | 4–5 שעות | ₪2,500–₪3,500 | מפעיל, מדפסת, 1–2 מגנטים לאורח |
| 300–600 אורחים | 5–7 שעות | ₪3,500–₪5,000 | מפעיל + עוזר, מדפסת, 2 מגנטים לאורח |

### 8.4 זרימת האורח

```
סריקת QR / לינק
     ↓
MagnetGuestPage (landing — הנחיות + כפתור פתיחת מצלמה)
     ↓
MagnetCamera (full-screen camera mode)
  [שלוש אפשרויות: כפתור flash | שאטר w-20 h-20 | היפוך מצלמה]
  [V vintage mode (אופציונלי)]
     ↓
handleCapture → canvas.toDataURL → setMode('review')
     ↓
MagnetReview (full-screen review mode)
  [תמונה מלאה + overlay של שם האירוע + תאריך]
  [מדבקות גרירה (draggable emoji + text stickers)]
  [Trash2 | "שלח להדפסה" | Smile sticker picker]
     ↓
compositeAndSubmit: canvas composite → compressImage → upload → printJob
     ↓
onPrintJobCreated → remainingPrints-- → הודעת אישור
```

### 8.5 רכיבי Frontend — MemoriaMagnet

| קובץ | תפקיד |
|---|---|
| `src/pages/MagnetLead.jsx` | Wizard לידים 4 שלבים (שם אירוע, תאריך, כמות אורחים, פרטי קשר) — שלב 4 מציג summary card |
| `src/pages/MagnetGuestPage.jsx` | דף הנחיתה לאורח (QR → landing) |
| `src/components/magnet/MagnetCamera.jsx` | מצלמה full-screen: camera mode + review delegation |
| `src/components/magnet/MagnetReview.jsx` | מסך review: תמונה + מדבקות + שליחה להדפסה |
| `src/components/magnet/stickerPacks.js` | חבילות מדבקות לפי סוג אירוע (חתונה/ב"מ/יום הולדת/כללי) |
| `src/pages/PrintStation.jsx` | ממשק מפעיל — תור הדפסה בזמן אמת |
| `src/pages/AdminDashboard.jsx` | CRM לידים + ניהול אירועים |
| `src/pages/CreateMagnetEvent.jsx` | יצירת אירוע מגנט (צד אדמין) |

### 8.6 מערכת המדבקות (Sticker System)

- **stickerPacks.js:** auto-detect סוג אירוע מהשם (חתונה/ב"מ/יום הולדת/כללי)
- **סוגי מדבקות:** `emoji` (single emoji char) | `text` (bold Hebrew/Latin עם stroke outline)
- **גרירה:** pointer events — fractional (x,y) מ-0 עד 1 → mapped לפיקסלים של canvas בשליחה
- **Compositing:** בעת שליחה בלבד — `drawOverlay()` (gradient + event name/date) + `drawSticker()` loop
- **גודל:** emoji: 13% canvas width, text: 5.5% canvas width

### 8.7 Quota — ניהול בזמן אמת

- קווטה מוגדרת ב-event (`magnet_prints_per_guest`)
- מוצגת ב-MagnetCamera header: "נותרו X הדפסות"
- **אין איסוף מידע על האורח** — קווטה נמדדת לפי print jobs מ-session ה-userId האנונימי
- `remainingPrints` מחושב ב-MagnetGuestPage ועובר כ-prop ל-MagnetCamera

### 8.8 פרטים טכניים

- **Supabase Project:** `esjprtvfijyjjxpufjho`
- **Test Event:** `unique_code = magnet-test`, URL: `https://memoriashare.com/Event?code=magnet-test`
- **event object fields:** `event.id`, `event.name`, `event.date` (string YYYY-MM-DD), `event.unique_code`
- **Canvas composite:** `canvas.toDataURL('image/jpeg', 0.92)` → `compressImage()` → `memoriaService.storage.upload()`
- **printJobs table:** `event_id`, `photo_id`, `guest_user_id`, `status` (pending/printing/ready/rejected)

### 8.9 פערים טכניים פתוחים (אפריל 2026)

**עדיפות גבוהה:**
- [ ] **איכות ממשק המצלמה** — המימוש הנוכחי זוהה כ"חובבני". נדרש redesign מקצועי (Figma-driven)
- [ ] **Admin CRM** — status tracking + notes + כפתור "צור אירוע" מהליד
- [ ] **Admin notification** — מייל/WhatsApp עם כניסת ליד חדש
- [ ] **Print Station** — תצוגת תור חי — קיים חלקית

**עדיפות בינונית:**
- [ ] **QR codes על שולחנות** — תכונה בולטת אצל המתחרה memo, עדיין לא ממומשת
- [ ] **Morning link** — שליחת קישור לאירוע בבוקר האירוע (feature של memo)
- [ ] **Bundle option** — הצעת MemoriaShare + MemoriaMagnet יחד
- [ ] **Price quote template** — יצירת הצעת מחיר מה-AdminDashboard

---

## נספח — קבצי תצורה קריטיים

| קובץ | תפקיד |
|---|---|
| `CLEAN_RESET_SCHEMA.sql` | סכמת מסד הנתונים המלאה עם RLS |
| `public/manifest.json` | הגדרות PWA |
| `vercel.json` | Rewrite לטיפול בנתיבי SPA |
| `.env.local` | משתני סביבה (לא מועלה ל-Git) |
| `src/lib/supabase.js` | אתחול הלקוח הגלובלי |
| `src/lib/AuthContext.jsx` | ניהול session + פרופיל משתמש |
| `src/components/memoriaService.jsx` | Service layer — כל קריאות Supabase |

---

*מסמך זה מתעדכן בהתאם לגרסאות המוצר. כל שינוי ארכיטקטוני משמעותי צריך להשתקף כאן.*
