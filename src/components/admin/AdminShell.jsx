import { Suspense } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { LogOut, Loader2 } from 'lucide-react';
import memoriaService from '@/components/memoriaService';

// Core workflow first: סקירה → לידים → מגנט → שיתוף → כלים → משתמשים
// מודרציה הוסרה מהניווט הראשי — נגישה דרך /admin/frames/moderation ישירות
const TABS = [
  { to: '/admin',               label: 'סקירה',       end: true },
  { to: '/admin/leads',         label: 'לידים',        badge: true },
  { to: '/admin/events/magnet', label: 'אירועי מגנט'  },
  { to: '/admin/events/share',  label: 'אירועי שיתוף' },
  { to: '/admin/frames',        label: 'כלים'          },
  { to: '/admin/users',         label: 'משתמשים'      },
];

export default function AdminShell() {
  const { user, logout } = useAuth();

  // Badge: count of new leads — lightweight, 60s staleTime
  const { data: leads = [] } = useQuery({
    queryKey: ['admin-leads-badge'],
    queryFn: () => memoriaService.leads.list(),
    staleTime: 60_000,
    select: (data) => data.filter(l => l.status === 'new'),
  });
  const newLeadsCount = leads.length;

  return (
    <div className="dark min-h-screen bg-gradient-to-br from-cool-950 via-cool-900 to-cool-950 text-foreground flex flex-col" dir="rtl">

      {/* Top accent line */}
      <div className="h-px w-full shrink-0" style={{ background: 'linear-gradient(90deg, transparent, rgba(124,58,237,0.7) 50%, transparent)' }} />

      {/* Admin top bar */}
      <div className="flex items-center justify-between px-5 pt-4 pb-2 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}>
            <span className="text-white text-xs font-black">M</span>
          </div>
          <span className="text-violet-400 text-[10px] font-bold tracking-[0.3em] uppercase">Admin</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-muted-foreground text-xs truncate max-w-[140px]">{user?.full_name || user?.email}</span>
          <button
            onClick={() => logout(true)}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-accent"
            aria-label="התנתק"
          >
            <LogOut className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
          </button>
        </div>
      </div>

      {/* Tab strip */}
      <nav className="flex items-end gap-1 px-4 border-b border-border overflow-x-auto shrink-0 pb-0">
        {TABS.map(({ to, label, end, badge }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `relative flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors ${
                isActive
                  ? 'border-violet-500 text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`
            }
          >
            {label}
            {badge && newLeadsCount > 0 && (
              <span className="flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full text-[9px] font-black bg-violet-500 text-white leading-none">
                {newLeadsCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Page content — local Suspense keeps the tab bar visible while a
          lazily-loaded tab chunk downloads (no full-screen flash). */}
      <div className="flex-1 overflow-y-auto">
        <Suspense fallback={<div className="flex justify-center py-20"><Loader2 className="w-6 h-6 text-violet-400/40 animate-spin" /></div>}>
          <Outlet />
        </Suspense>
      </div>
    </div>
  );
}
