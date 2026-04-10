# MemoriaShare

אפליקציית שיתוף תמונות לאירועים בזמן אמת. האורחים מצלמים, הכל באלבום אחד.

## פיצ'רים עיקריים

- **גלריה בזמן אמת** — Supabase Realtime מעדכן את הגלריה ללא רענון עמוד
- **העלאת תמונות** — מצלמה ישירה או בחירה מהגלריה, דחיסה בצד הלקוח לפני העלאה
- **מצלמת POV נייטיב** — ממשק מצלמה full-screen עם שכבות glassmorphism צפות, פילטר וינטג׳ בזמן אמת (CSS filter), אפקט תריס מכני (black frame → white flash), פלאש קדמי ופלאש torch, תמיכה ב-iOS Safari וב-Android Chrome, תיקון אוטומטי ל-OverconstrainedError
- **אימות Google** — כניסה מהירה עם חשבון Google דרך Supabase Auth
- **הרשאות RLS** — Row Level Security מגן על נתוני כל אירוע
- **קישורי שיתוף + QR** — כל אירוע מקבל קישור ייחודי וקוד QR לאורחים
- **גלריה פרטית / ציבורית** — לשונית "התמונות שלי" ו"גלריה משותפת" עם עדכון realtime
- **מובייל ראשון** — עיצוב רספונסיבי מותאם לחוויית מובייל חלקה

## טכנולוגיות

| שכבה | טכנולוגיה |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, shadcn/ui |
| Auth | Supabase Auth (Google OAuth) |
| Database | Supabase (PostgreSQL + RLS) |
| Storage | Supabase Storage |
| Realtime | Supabase Realtime (postgres_changes) |
| Deployment | Vercel |

## הרצה מקומית

```bash
git clone <repo-url>
cd MemoriaShare
npm install
```

צור קובץ `.env.local` עם המשתנים הבאים:

```
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
VITE_SITE_URL=http://localhost:5173
```

```bash
npm run dev
```

## פריסה ל-Vercel

1. דחוף את הקוד ל-GitHub
2. חבר את ה-repo ב-[Vercel](https://vercel.com)
3. הגדר את משתני הסביבה בלוח הבקרה של Vercel
4. הוסף את כתובת ה-Vercel כ-Redirect URL ב-Supabase → Authentication → URL Configuration

## מבנה תיקיות

```
src/
  components/    # רכיבי UI כלליים וספציפיים לגלריה
  functions/     # לוגיקה צד-לקוח (quota, upload, deletion)
  hooks/         # React hooks (useEventGallery, useRealtimeNotifications)
  lib/           # Supabase client, AuthContext
  pages/         # עמודים ראשיים (Home, CreateEvent, EventGallery, Dashboard)
public/
  manifest.json  # PWA manifest
  favicon.png
```
