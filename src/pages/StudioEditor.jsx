// /admin/studio/:templateId — the frame editor, full screen. It needs a wide screen (a computer,
// or a tablet in landscape); on a phone it explains that instead (plan decision D4).
import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import '@/studio/fonts/studio-fonts.css';
import '@/studio/fonts/symbols.css';
import EditorScreen from '@/studio/screens/editor/EditorScreen';
import { STUDIO_FONT, useStudioRepo } from '@/studio/useStudioRepo';

const WIDE = '(min-width: 1024px)';

function useWideScreen() {
  const [wide, setWide] = useState(() => window.matchMedia(WIDE).matches);
  useEffect(() => {
    const query = window.matchMedia(WIDE);
    const onChange = () => setWide(query.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);
  return wide;
}

export default function StudioEditor() {
  const { templateId } = useParams();
  const navigate = useNavigate();
  const repo = useStudioRepo();
  const wide = useWideScreen();
  const close = useCallback(() => navigate('/admin/studio'), [navigate]);

  if (!wide) {
    return (
      <main className="min-h-screen bg-background text-foreground grid place-items-center px-4 text-center" dir="rtl">
        <div className="flex flex-col items-center gap-4 max-w-sm">
          <h1 className="text-xl font-semibold">פתח במחשב</h1>
          <p className="text-sm text-muted-foreground">עורך המסגרות עובד במילימטרים ודורש מסך רחב: מחשב, או טאבלט כשהוא לרוחב.</p>
          <Link to="/admin/studio" className="text-brand text-sm">חזרה לסטודיו</Link>
        </div>
      </main>
    );
  }
  return (
    <div className={`bg-background text-foreground ${STUDIO_FONT}`} dir="rtl">
      <EditorScreen key={templateId} repo={repo} templateId={templateId} onClose={close} />
    </div>
  );
}
