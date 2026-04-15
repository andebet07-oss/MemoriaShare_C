import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { LayoutDashboard, Image, Magnet, Users, MessageSquare, LogOut } from 'lucide-react';

const TABS = [
  { to: '/admin',                  label: 'סקירה',         icon: LayoutDashboard, end: true },
  { to: '/admin/events/share',     label: 'אירועי שיתוף',  icon: Image },
  { to: '/admin/events/magnet',    label: 'אירועי מגנט',   icon: Magnet },
  { to: '/admin/leads',            label: 'לידים',          icon: MessageSquare },
  { to: '/admin/users',            label: 'משתמשים',        icon: Users },
];

export default function AdminShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0a0a0e] flex flex-col" dir="rtl">

      {/* Top accent line */}
      <div className="h-px w-full shrink-0" style={{ background: 'linear-gradient(90deg, transparent, rgba(124,58,237,0.7) 50%, transparent)' }} />

      {/* Admin top bar */}
      <div className="flex items-center justify-between px-5 pt-4 pb-2 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}>
            <span className="text-white text-xs font-black">M</span>
          </div>
          <span className="text-white/60 text-xs font-semibold tracking-widest uppercase">Admin</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-white/35 text-xs truncate max-w-[140px]">{user?.full_name || user?.email}</span>
          <button
            onClick={() => logout(true)}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-white/10"
            aria-label="התנתק"
          >
            <LogOut className="w-3.5 h-3.5 text-white/40 hover:text-white/70" />
          </button>
        </div>
      </div>

      {/* Tab strip */}
      <nav className="flex items-end gap-1 px-4 border-b border-white/[0.07] overflow-x-auto shrink-0 pb-0">
        {TABS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors ${
                isActive
                  ? 'border-violet-500 text-white'
                  : 'border-transparent text-white/40 hover:text-white/70'
              }`
            }
          >
            <Icon className="w-3.5 h-3.5 shrink-0" />
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
