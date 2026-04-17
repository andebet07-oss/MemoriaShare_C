import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { LogOut } from 'lucide-react';

const TABS = [
  { to: '/admin',                  label: 'סקירה',        end: true },
  { to: '/admin/events/share',     label: 'אירועי שיתוף' },
  { to: '/admin/events/magnet',    label: 'אירועי מגנט'  },
  { to: '/admin/leads',            label: 'לידים'         },
  { to: '/admin/users',            label: 'משתמשים'       },
];

export default function AdminShell() {
  const { user, logout } = useAuth();

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
        {TABS.map(({ to, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `px-3.5 py-2.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors ${
                isActive
                  ? 'border-violet-500 text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`
            }
          >
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Page content */}
      <div className="flex-1 overflow-y-auto">
        <Outlet />
      </div>
    </div>
  );
}
