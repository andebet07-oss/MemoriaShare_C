import { Search, X } from 'lucide-react';

/**
 * Shared admin list toolbar: a search box + optional filter chips.
 * Presentational only — the parent owns the search/filter state and does the
 * actual client-side filtering. Matches the admin violet styling and is RTL.
 *
 * @param {string}   search       current search text
 * @param {Function} onSearch     (value) => void
 * @param {string}   placeholder  search placeholder
 * @param {Array}    chips        optional [{ key, label, count? }]
 * @param {string}   active       active chip key
 * @param {Function} onChip       (key) => void
 */
export default function AdminFilterBar({
  search = '', onSearch, placeholder = 'חיפוש...',
  chips = null, active, onChip,
}) {
  return (
    <div className="flex flex-col gap-2.5 mb-5" dir="rtl">
      {/* Search box */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder={placeholder}
          className="w-full h-10 pr-9 pl-9 rounded-xl text-sm text-foreground placeholder:text-muted-foreground/40 bg-card border border-border focus:border-violet-500/50 focus:outline-none focus:ring-1 focus:ring-violet-500/30 transition-colors"
        />
        {search && (
          <button
            onClick={() => onSearch('')}
            aria-label="נקה חיפוש"
            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            <X className="w-3.5 h-3.5 text-muted-foreground/60" />
          </button>
        )}
      </div>

      {/* Filter chips */}
      {chips && chips.length > 0 && (
        <div className="flex gap-1.5 flex-wrap">
          {chips.map((c) => {
            const isActive = active === c.key;
            return (
              <button
                key={c.key}
                type="button"
                onClick={() => onChip(c.key)}
                className="flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-full transition-all active:scale-95"
                style={{
                  background: isActive ? 'rgba(124,58,237,0.18)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${isActive ? 'rgba(124,58,237,0.45)' : 'rgba(255,255,255,0.07)'}`,
                  color: isActive ? '#c4b5fd' : 'rgba(255,255,255,0.4)',
                }}
              >
                {c.label}
                {c.count != null && (
                  <span className="tabular-nums opacity-70">{c.count}</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
