import { useState, useMemo, useEffect, useCallback } from 'react';
import { Search, X as XIcon, Layers } from 'lucide-react';
import { FRAME_PACKS } from '@/components/magnet/framePacks';
import { STYLE_LABELS, CATEGORY_LABELS } from '@/lib/framesMeta';
import { useFramesMeta } from '@/hooks/useFramesMeta';
import FrameCard from '@/components/admin/frames/FrameCard';
import FrameDetailPanel from '@/components/admin/frames/FrameDetailPanel';

// Flatten FRAME_PACKS into a list with category attached — drawing data only, no metadata
const ENRICHED = Object.entries(FRAME_PACKS).flatMap(([cat, frames]) =>
  frames.map(f => ({ ...f, category: cat }))
);

const CATEGORIES = [{ key: 'all', label: 'הכל' }, ...Object.keys(FRAME_PACKS).map(k => ({ key: k, label: CATEGORY_LABELS[k] ?? k }))];
const STYLES     = [{ key: 'all', label: 'כל הסגנונות' }, ...Object.keys(STYLE_LABELS).map(k => ({ key: k, label: STYLE_LABELS[k] }))];
const SORTS      = [{ value: 'curated', label: 'מאורגן' }, { value: 'quality', label: 'ניקוד איכות' }, { value: 'newest', label: 'חדש ביותר' }];

export default function FramesLibrary() {
  const [search,      setSearch]      = useState('');
  const [catFilter,   setCatFilter]   = useState('all');
  const [styleFilter, setStyleFilter] = useState('all');
  const [sortBy,      setSortBy]      = useState('curated');
  const [selected,    setSelected]    = useState(null);

  const { meta, isLoading } = useFramesMeta();

  const approvedTotal = useMemo(() => ENRICHED.filter(f => meta[f.id]?.status === 'approved').length, [meta]);
  const archivedTotal = useMemo(() => ENRICHED.filter(f => meta[f.id]?.status === 'archived').length, [meta]);

  // Escape closes detail panel
  useEffect(() => {
    if (!selected) return;
    const onKey = e => { if (e.key === 'Escape') setSelected(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selected]);

  // Refresh selected frame's meta when DB data updates
  useEffect(() => {
    if (!selected || !meta[selected.id]) return;
    setSelected(prev => prev ? { ...prev, _metaKey: Date.now() } : prev);
  }, [meta]); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = ENRICHED.filter(f => {
      const m = meta[f.id];
      if (catFilter !== 'all' && f.category !== catFilter)       return false;
      if (styleFilter !== 'all' && m?.style !== styleFilter)      return false;
      if (q && !f.name.toLowerCase().includes(q) && !f.id.includes(q) &&
          !(CATEGORY_LABELS[f.category] ?? '').includes(q))       return false;
      return true;
    });

    if (sortBy === 'curated') list.sort((a, b) => (meta[b.id]?.sortWeight ?? 0)   - (meta[a.id]?.sortWeight ?? 0));
    if (sortBy === 'quality') list.sort((a, b) => (meta[b.id]?.quality ?? 0)       - (meta[a.id]?.quality ?? 0));
    if (sortBy === 'newest')  list.sort((a, b) => (b.isNew ? 1 : 0)               - (a.isNew ? 1 : 0));
    return list;
  }, [search, catFilter, styleFilter, sortBy, meta]);

  const reset = useCallback(() => { setSearch(''); setCatFilter('all'); setStyleFilter('all'); }, []);

  return (
    <div className="min-h-full p-6 md:p-8" dir="rtl">

      {/* ── Page header ── */}
      <div className="mb-7">
        <p className="text-violet-400 text-[10px] font-bold tracking-[0.35em] uppercase mb-1.5">Admin · 01</p>
        <h1 className="font-playfair text-3xl text-foreground leading-tight">ספריית מסגרות</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {isLoading ? '…' : `${approvedTotal} מסגרות מאושרות\u2005·\u2005${archivedTotal} בארכיון`}
        </p>
      </div>

      {/* ── Category pill strip ── */}
      <div className="flex gap-2 overflow-x-auto pb-1 mb-5 hide-scrollbar">
        {CATEGORIES.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setCatFilter(key)}
            className={[
              'shrink-0 px-4 py-1.5 rounded-full text-xs font-bold transition-all',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500',
              catFilter === key
                ? 'bg-violet-600 text-white shadow-[0_0_14px_rgba(124,58,237,0.4)]'
                : 'bg-cool-800/60 text-muted-foreground hover:text-foreground border border-border hover:border-violet-500/30',
            ].join(' ')}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Filter row ── */}
      <div className="flex flex-wrap gap-3 mb-2 items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/50 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="חיפוש מסגרת..."
            aria-label="חיפוש מסגרות"
            className="w-full bg-cool-900/80 border border-border rounded-xl pr-9 pl-8 py-2 text-sm text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:ring-1 focus:ring-violet-500 text-right"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              aria-label="נקה חיפוש"
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-foreground"
            >
              <XIcon className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Style filter */}
        <div className="flex gap-1.5 flex-wrap">
          {STYLES.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setStyleFilter(key)}
              className={[
                'px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500',
                styleFilter === key
                  ? 'bg-cool-700 text-foreground border border-cool-500'
                  : 'bg-transparent text-muted-foreground hover:text-foreground border border-border',
              ].join(' ')}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Sort */}
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value)}
          className="bg-cool-900/80 border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-violet-500 cursor-pointer"
          dir="rtl"
          aria-label="מיון"
        >
          {SORTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {/* ── Result count ── */}
      <p className="text-[11px] text-muted-foreground/40 mb-5 mt-3" aria-live="polite" aria-atomic="true">
        {isLoading ? '...' : `${filtered.length} מסגרות`}
      </p>

      {/* ── Grid ── */}
      {!isLoading && filtered.length === 0 ? (
        <Empty onReset={reset} />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 pb-12">
          {filtered.map(f => (
            <FrameCard
              key={f.id}
              frame={f}
              meta={meta[f.id]}
              category={f.category}
              isSelected={selected?.id === f.id}
              onClick={frame => setSelected(frame)}
            />
          ))}
        </div>
      )}

      {/* ── Detail panel overlay ── */}
      {selected && (
        <>
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={() => setSelected(null)}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`פרטי מסגרת ${selected.name}`}
            className="fixed top-0 right-0 h-full w-full sm:w-[420px] bg-cool-950 border-l border-border z-50 shadow-2xl flex flex-col"
            style={{ animation: 'slideInRight 0.22s cubic-bezier(0.16,1,0.3,1)' }}
          >
            <FrameDetailPanel
              frame={selected}
              meta={meta[selected.id]}
              category={selected.category}
              onClose={() => setSelected(null)}
            />
          </div>
        </>
      )}

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to   { transform: translateX(0); }
        }
        .hide-scrollbar { scrollbar-width: none; }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}

function Empty({ onReset }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-16 h-16 rounded-2xl bg-cool-800/60 border border-border flex items-center justify-center mb-4">
        <Layers className="w-7 h-7 text-muted-foreground/30" />
      </div>
      <p className="text-sm text-muted-foreground mb-1">לא נמצאו מסגרות</p>
      <p className="text-xs text-muted-foreground/40 mb-4">נסה לשנות את הסינון או החיפוש</p>
      <button
        onClick={onReset}
        className="text-xs text-violet-400 hover:text-violet-300 transition-colors underline underline-offset-2"
      >
        אפס את כל הסינונים
      </button>
    </div>
  );
}
