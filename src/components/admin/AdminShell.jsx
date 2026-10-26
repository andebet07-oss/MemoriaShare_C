import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { LogOut, Loader2 } from 'lucide-react';
import memoriaService from '@/components/memoriaService';
import TabNav from '@/components/system/TabNav';
import { Button } from '@/components/ui/button';

// Core workflow first: סקירה → לידים → מגנט → כלים → משתמשים (Magnet-only; no Share events in admin)
// מודרציה הוסרה מהניווט הראשי — נגישה דרך /admin/frames/moderation ישירות
const TABS = [
  { to: '/admin',               label: 'סקירה',       end: true },
  { to: '/admin/leads',         label: 'לידים',        badge: true },
  { to: '/admin/events/magnet', label: 'אירועי מגנט'  },
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
    <div className="min-h-screen bg-background text-foreground flex flex-col" dir="rtl">
      {/* Top bar + tabs share the page content width */}
      <div className="border-b border-border bg-background/80 backdrop-blur-xl sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 md:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-xl bg-primary text-primary-foreground text-sm font-semibold flex items-center justify-center">M</span>
              <span className="text-base font-semibold">ניהול</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground truncate max-w-[160px]">{user?.full_name || user?.email}</span>
              <Button variant="ghost" size="icon-sm" onClick={() => logout(true)} aria-label="התנתק">
                <LogOut />
              </Button>
            </div>
          </div>
          <TabNav items={TABS.map((t) => ({ ...t, badge: t.badge ? newLeadsCount : 0 }))} className="border-b-0 -mx-3" />
        </div>
      </div>

      {/* Page content — local Suspense keeps the tab bar visible while a
          lazily-loaded tab chunk downloads (no full-screen flash). */}
      <div className="flex-1 overflow-y-auto">
        <Suspense fallback={<div className="flex justify-center py-20"><Loader2 className="w-6 h-6 text-brand/40 animate-spin" /></div>}>
          <Outlet />
        </Suspense>
      </div>
    </div>
  );
}
