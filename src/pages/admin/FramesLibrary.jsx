import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Layers, Pencil, ClipboardCheck } from 'lucide-react';
import memoriaService from '@/components/memoriaService';
import FramePngPreview from '@/components/admin/frames/FramePngPreview';
import FrameTextEditor from '@/components/admin/frames/FrameTextEditor';
import AdminFilterBar from '@/components/admin/AdminFilterBar';
import { STYLE_LABELS, CATEGORY_LABELS } from '@/lib/framesMeta';

const STATUS_HE = { approved: 'פעיל', draft: 'טיוטה', archived: 'ארכיון' };

function StatusBadge({ status }) {
  const map = {
    approved: { cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25', label: 'פעיל' },
    draft:    { cls: 'bg-cool-700/40 text-cool-400 border-cool-600/30',          label: 'טיוטה' },
    archived: { cls: 'bg-red-500/10 text-red-400 border-red-500/20',             label: 'ארכיון' },
  };
  const { cls, label } = map[status] ?? map.draft;
  return (
    <span className={`inline-flex items-center gap-1 text-[9px] font-bold tracking-[0.15em] uppercase px-2 py-0.5 rounded-full border ${cls}`}>
      {status === 'approved' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />}
      {label}
    </span>
  );
}

function FrameCard({ frame, isEditing, onEdit }) {
  const categoryLabel = CATEGORY_LABELS[frame.category] ?? frame.category ?? '';
  const styleLabel    = STYLE_LABELS[frame.style]       ?? frame.style    ?? '';

  return (
    <div className="group relative bg-cool-900/40 border rounded-2xl overflow-hidden flex flex-col transition-all duration-200"
      style={{ borderColor: isEditing ? 'rgba(124,58,237,0.5)' : 'rgba(255,255,255,0.06)' }}>

      {/* Preview */}
      <div className="relative flex items-center justify-center overflow-hidden"
        style={{
          aspectRatio: '776 / 1031',
          background: `linear-gradient(135deg, #2a2a35 0%, #1e1e28 100%),
            repeating-conic-gradient(#2e2e3a 0% 25%, #252530 0% 50%) 0 0 / 16px 16px`,
        }}>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-3/4 h-3/4 rounded-full bg-white/[0.03] blur-2xl" />
        </div>
        <FramePngPreview
          frame={{ image_url: frame.image_url, hole_bbox: frame.hole_bbox, text_config: frame.text_config }}
          eventName="שרה ודוד"
          eventDate="12.06.2026"
          className="relative z-10 w-[88%] h-auto"
          style={{ filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.55)) drop-shadow(0 2px 6px rgba(0,0,0,0.35))' }}
        />
      </div>

      {/* Info strip */}
      <div className="px-4 py-3 border-t border-white/[0.05] flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <span className="text-[13px] font-semibold text-foreground leading-tight">
            {frame.display_name || frame.frame_id}
          </span>
          <StatusBadge status={frame.status} />
        </div>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-muted-foreground/50">
          {categoryLabel && <span>{categoryLabel}</span>}
          {styleLabel    && <><span className="opacity-30">·</span><span>{styleLabel}</span></>}
          {frame.aspect  && <><span className="opacity-30">·</span><span className="capitalize">{frame.aspect}</span></>}
        </div>
        <button
          onClick={() => onEdit(frame.frame_id)}
          className="mt-1 flex items-center justify-center gap-1.5 w-full py-1.5 rounded-lg text-xs font-semibold transition-all active:scale-[0.97]"
          style={{
            background: isEditing ? 'rgba(124,58,237,0.25)' : 'rgba(255,255,255,0.04)',
            border: isEditing ? '1px solid rgba(124,58,237,0.4)' : '1px solid rgba(255,255,255,0.07)',
            color: isEditing ? '#c4b5fd' : 'rgba(255,255,255,0.4)',
          }}>
          <Pencil className="w-3 h-3" />
          {isEditing ? 'עורך...' : 'עריכת טקסט'}
        </button>
      </div>
    </div>
  );
}

export default function FramesLibrary() {
  const navigate = useNavigate();
  const [editingId, setEditingId] = useState(null);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: frames = [], isLoading, error } = useQuery({
    queryKey: ['frames-library'],
    queryFn: memoriaService.frameMeta.listPngFrames,
    staleTime: 30_000,
  });

  const activeCount  = frames.filter(f => f.status === 'approved').length;
  const editingFrame = frames.find(f => f.frame_id === editingId) ?? null;
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
    <div className="min-h-full p-5 md:p-8" dir="rtl">

      <div className="flex items-start justify-between gap-3 mb-6">
        <div>
          <p className="text-violet-400 text-[10px] font-bold tracking-[0.35em] uppercase mb-1.5">Admin · כלים</p>
          <h1 className="font-playfair text-3xl text-foreground leading-tight">ספריית מסגרות</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isLoading
              ? 'טוען...'
              : activeCount > 0
                ? `${activeCount} מסגרת${activeCount === 1 ? '' : 'ות'} פעיל${activeCount === 1 ? 'ה' : 'ות'}`
                : 'אין מסגרות פעילות'}
          </p>
        </div>
        <button
          onClick={() => navigate('/admin/frames/moderation')}
          className="flex items-center gap-1.5 shrink-0 px-3 py-2 rounded-xl text-xs font-semibold text-violet-300 hover:text-violet-200 transition-colors"
          style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.25)' }}
        >
          <ClipboardCheck className="w-3.5 h-3.5" />
          תור מודרציה
        </button>
      </div>

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

      {isLoading && (
        <div className="flex items-center justify-center py-32">
          <div className="w-6 h-6 border-2 border-violet-500/30 border-t-violet-400 rounded-full animate-spin" />
        </div>
      )}

      {!isLoading && error && (
        <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-center">
          שגיאה בטעינת המסגרות — נסה לרענן
        </div>
      )}

      {!isLoading && !error && frames.length === 0 && (
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <div className="w-16 h-16 rounded-2xl bg-cool-800/60 border border-border flex items-center justify-center mb-4">
            <Layers className="w-7 h-7 text-muted-foreground/30" />
          </div>
          <p className="text-sm text-muted-foreground mb-1">ספריית המסגרות ריקה</p>
          <p className="text-xs text-muted-foreground/40">מסגרות חדשות יתווספו כאן</p>
        </div>
      )}

      {!isLoading && !error && frames.length > 0 && visibleFrames.length === 0 && (
        <p className="text-muted-foreground/50 text-sm py-12 text-center">אין מסגרות תואמות</p>
      )}

      {!isLoading && !error && visibleFrames.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {visibleFrames.map(frame => (
            <FrameCard
              key={frame.frame_id}
              frame={frame}
              isEditing={editingId === frame.frame_id}
              onEdit={handleEdit}
            />
          ))}
        </div>
      )}

      {/* Edit modal — overlay, opens centered on click (not buried at page bottom) */}
      {editingFrame && (
        <FrameTextEditor
          frame={editingFrame}
          onClose={() => setEditingId(null)}
        />
      )}
    </div>
  );
}
