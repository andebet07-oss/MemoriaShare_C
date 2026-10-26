import { Search, X } from 'lucide-react';

/**
 * Shared admin list toolbar: a search box + optional filter chips.
 * Presentational only — the parent owns the search/filter state and does the
 * actual client-side filtering. RTL; chips follow the design system (brand accent).
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
    <div className="flex flex-col gap-3 mb-6" dir="rtl">
      {/* Search box */}
      <div className="relative">
        <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder={placeholder}
          className="w-full h-11 pr-10 pl-10 rounded-xl text-base md:text-sm text-foreground placeholder:text-muted-foreground bg-secondary border border-border focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 transition-colors"
        />
        {search && (
          <button
            onClick={() => onSearch('')}
            aria-label="נקה חיפוש"
            className="absolute left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center text-muted-foreground hover:bg-foreground/10 hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Filter chips */}
      {chips && chips.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {chips.map((c) => {
            const isActive = active === c.key;
            return (
              <button
                key={c.key}
                type="button"
                onClick={() => onChip(c.key)}
                className={`flex items-center gap-1.5 h-8 px-3 rounded-full border text-xs font-semibold transition-colors active:scale-95 ${
                  isActive
                    ? 'bg-brand/15 border-brand/30 text-brand'
                    : 'bg-secondary border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                {c.label}
                {c.count != null && <span className="tabular-nums opacity-80">{c.count}</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
