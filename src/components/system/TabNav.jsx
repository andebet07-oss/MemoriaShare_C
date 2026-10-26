import { NavLink } from 'react-router-dom';

/** Underline tabs for section navigation; scrolls horizontally on narrow screens. */
export default function TabNav({ items, className = '' }) {
  return (
    <nav className={`flex gap-1 overflow-x-auto border-b border-border ${className}`}>
      {items.map(({ to, label, end, badge }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) => `relative flex items-center gap-1.5 px-3 py-3 -mb-px text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
            isActive ? 'border-brand text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          {label}
          {badge > 0 && (
            <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold tabular-nums flex items-center justify-center">{badge}</span>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
