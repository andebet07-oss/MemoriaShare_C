// /admin/studio — the frame studio's template library (a tab of the admin shell).
import { useNavigate } from 'react-router-dom';
import '@/studio/fonts/studio-fonts.css';
import '@/studio/fonts/symbols.css';
import LibraryScreen from '@/studio/screens/library/LibraryScreen';
import { STUDIO_FONT, useStudioRepo } from '@/studio/useStudioRepo';

export default function StudioLibrary() {
  const navigate = useNavigate();
  const repo = useStudioRepo();
  return (
    <div className={STUDIO_FONT}>
      <LibraryScreen repo={repo} onOpen={(id) => navigate(`/admin/studio/${id}`)} />
    </div>
  );
}
