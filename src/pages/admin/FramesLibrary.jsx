import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Layers, Pencil, ClipboardCheck, Crop, Plus } from 'lucide-react';
import memoriaService from '@/components/memoriaService';
import FramePngPreview from '@/components/admin/frames/FramePngPreview';
import FrameTextEditor from '@/components/admin/frames/FrameTextEditor';
import FrameUploadDialog from '@/components/admin/frames/FrameUploadDialog';
import AdminFilterBar from '@/components/admin/AdminFilterBar';
import { CardGridSkeleton } from '@/components/ui/skeletons';
import { STYLE_LABELS, CATEGORY_LABELS } from '@/lib/framesMeta';
import { Button } from '@/components/ui/button';
import PageHeader from '@/components/system/PageHeader';
import { TONE } from '@/components/system/statusStyles';

const STATUS_HE = { approved: 'פעיל', draft: 'טיוטה', archived: 'ארכיון' };

// Frame lifecycle → the shared status tones (CLAUDE.md §0.6).
const FRAME_TONE = { approved: 'ready', draft: 'muted', archived: 'rejected' };

function FrameStatus({ status }) {
  const tone = TONE[FRAME_TONE[status] ?? 'muted'];
  return (
    <span className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full border text-xs font-semibold shrink-0 ${tone.pill}`}>
      {status === 'approved' && <span className={`w-1.5 h-1.5 rounded-full ${tone.dot}`} />}
      {STATUS_HE[status] ?? STATUS_HE.draft}
    </span>
  );
}

// Transparency checkerboard behind the PNG frame preview.
const CHECKERBOARD = { background: 'repeating-conic-gradient(hsl(var(--secondary)) 0% 25%, hsl(var(--card)) 0% 50%) 0 0 / 16px 16px' };

function FrameCard({ frame, isEditing, onEdit, onEditHole }) {
  const categoryLabel = CATEGORY_LABELS[frame.category] ?? frame.category ?? '';
  const styleLabel    = STYLE_LABELS[frame.style]       ?? frame.style    ?? '';

  return (
    <div className={`group relative bg-card border rounded-2xl overflow-hidden flex flex-col transition-colors ${isEditing ? 'border-brand/50' : 'border-border'}`}>

      {/* Preview */}
      <div className="relative flex items-center justify-center overflow-hidden" style={{ aspectRatio: '776 / 1031', ...CHECKERBOARD }}>
        <FramePngPreview
          frame={{ image_url: frame.image_url, hole_bbox: frame.hole_bbox, text_config: frame.text_config }}
          eventName="שרה ודוד"
          eventDate="12.06.2026"
          className="relative z-10 w-[88%] h-auto drop-shadow-2xl"
        />
      </div>

      {/* Info strip */}
      <div className="p-4 border-t border-border flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <span className="text-base font-semibold text-foreground leading-tight">
            {frame.display_name || frame.frame_id}
          </span>
          <FrameStatus status={frame.status} />
        </div>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
          {categoryLabel && <span>{categoryLabel}</span>}
          {styleLabel    && <><span className="opacity-40">·</span><span>{styleLabel}</span></>}
          {frame.aspect  && <><span className="opacity-40">·</span><span className="capitalize">{frame.aspect}</span></>}
        </div>
        <div className="mt-1 flex gap-2">
          <Button variant="secondary" size="sm" className={`flex-1 ${isEditing ? '!bg-brand/15 !border-brand/30 !text-brand' : ''}`} onClick={() => onEdit(frame.frame_id)}>
            <Pencil />
            {isEditing ? 'עורך...' : 'טקסט'}
          </Button>
          <Button variant="secondary" size="sm" className="flex-1" onClick={() => onEditHole(frame.frame_id)} title="הגדרת חלון התמונה">
            <Crop />
            חלון תמונה
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function FramesLibrary() {
  const navigate = useNavigate();
  const [editingId, setEditingId] = useState(null);
  const [holeId, setHoleId] = useState(null);   // frame whose photo-window is being edited
  const [uploadOpen, setUploadOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: frames = [], isLoading, error } = useQuery({
    queryKey: ['frames-library'],
    queryFn: memoriaService.frameMeta.listPngFrames,
    staleTime: 30_000,
  });

  const activeCount  = frames.filter(f => f.status === 'approved').length;
  const editingFrame = frames.find(f => f.frame_id === editingId) ?? null;
  const holeFrame    = frames.find(f => f.frame_id === holeId) ?? null;
  const handleEdit = (id) => setEditingId(prev => prev === id ? null : id);

  // Search + status filter (client-side)
  const q = query.trim().toLowerCase();
  const visibleFrames = frames.filter(f => {
    if (statusFilter !== 'all' && f.status !== statusFilter) return false;
    if (!q) return true;
    return (
      (f.display_name || '').toLowerCase().includes(q) ||
      (f.frame_id || '').toLowerCase().includes(q)
    );
  });

  const statusCounts = ['approved', 'draft', 'archived'].reduce((acc, s) => {
    acc[s] = frames.filter(f => f.status === s).length;
    return acc;
  }, {});
  const chips = [
    { key: 'all', label: 'הכל', count: frames.length },
    ...['approved', 'draft', 'archived']
      .filter(s => statusCounts[s] > 0)
      .map(s => ({ key: s, label: STATUS_HE[s], count: statusCounts[s] })),
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-8 pt-6 md:pt-10 pb-16 animate-in fade-in slide-in-from-bottom-2 duration-500" dir="rtl">

      <PageHeader
        label="ניהול · כלים"
        title="ספריית מסגרות"
        subtitle={isLoading
          ? 'טוען...'
          : activeCount > 0
            ? `${activeCount} מסגרת${activeCount === 1 ? '' : 'ות'} פעיל${activeCount === 1 ? 'ה' : 'ות'}`
            : 'אין מסגרות פעילות'}
        action={
          <div className="flex items-center gap-2">
            <Button onClick={() => setUploadOpen(true)}>
              <Plus />
              מסגרת חדשה
            </Button>
            <Button variant="secondary" onClick={() => navigate('/admin/frames/moderation')}>
              <ClipboardCheck />
              תור מודרציה
            </Button>
          </div>
        }
      />

      {!isLoading && !error && frames.length > 0 && (
        <AdminFilterBar
          search={query}
          onSearch={setQuery}
          placeholder="חיפוש מסגרת לפי שם..."
          chips={chips}
          active={statusFilter}
          onChip={setStatusFilter}
        />
      )}

      {isLoading && <CardGridSkeleton count={8} />}

      {!isLoading && error && (
        <div className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-xl p-4 text-center">
          שגיאה בטעינת המסגרות — נסה לרענן
        </div>
      )}

      {!isLoading && !error && frames.length === 0 && (
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <div className="w-16 h-16 rounded-2xl bg-secondary border border-border flex items-center justify-center mb-4">
            <Layers className="w-7 h-7 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground mb-1">ספריית המסגרות ריקה</p>
          <p className="text-xs text-muted-foreground">מסגרות חדשות יתווספו כאן</p>
        </div>
      )}

      {!isLoading && !error && frames.length > 0 && visibleFrames.length === 0 && (
        <p className="text-muted-foreground text-sm py-12 text-center">אין מסגרות תואמות</p>
      )}

      {!isLoading && !error && visibleFrames.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {visibleFrames.map(frame => (
            <FrameCard
              key={frame.frame_id}
              frame={frame}
              isEditing={editingId === frame.frame_id}
              onEdit={handleEdit}
              onEditHole={setHoleId}
            />
          ))}
        </div>
      )}

      {/* Text editor modal */}
      {editingFrame && (
        <FrameTextEditor
          frame={editingFrame}
          onClose={() => setEditingId(null)}
        />
      )}

      {/* New-frame upload modal */}
      {uploadOpen && (
        <FrameUploadDialog onClose={() => setUploadOpen(false)} />
      )}

      {/* Photo-window (hole) editor modal for an existing frame */}
      {holeFrame && (
        <FrameUploadDialog frame={holeFrame} onClose={() => setHoleId(null)} />
      )}
    </div>
  );
}
