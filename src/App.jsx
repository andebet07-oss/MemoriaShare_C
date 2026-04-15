import { Toaster } from "@/components/ui/toaster"
import GlobalErrorBoundary from '@/components/GlobalErrorBoundary'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import NavigationTracker from '@/lib/NavigationTracker'
import { BrowserRouter as Router, Route, Routes, Navigate, useParams } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import HostOnboardingModal from '@/components/HostOnboardingModal';
import GuestLayout from '@/components/GuestLayout';
import RequireAdmin from '@/components/RequireAdmin';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { useQuery } from '@tanstack/react-query';
import memoriaService from '@/components/memoriaService';

// Pages
import Home           from '@/pages/Home';
import Event          from '@/pages/Event';
import EventGallery   from '@/pages/EventGallery';
import EventSuccess   from '@/pages/EventSuccess';
import CreateEvent    from '@/pages/CreateEvent';
import Dashboard      from '@/pages/Dashboard';
import MyEvents       from '@/pages/MyEvents';
import MagnetLead     from '@/pages/MagnetLead';
import MagnetGuestPage from '@/pages/MagnetGuestPage';
import PrintStation   from '@/pages/PrintStation';

// Admin pages
import AdminDashboard       from '@/pages/AdminDashboard';
import CreateMagnetEvent    from '@/pages/CreateMagnetEvent';
import MagnetEventDashboard from '@/pages/MagnetEventDashboard';
import AdminUsers           from '@/pages/AdminUsers';

// Admin tab content
import AdminOverview    from '@/components/admin/AdminOverview';
import AdminEventsList  from '@/components/admin/AdminEventsList';
import LeadsPanel       from '@/components/admin/LeadsPanel';

import __Layout from './Layout.jsx';

const LayoutWrapper = ({ children, currentPageName }) =>
  __Layout ? <__Layout currentPageName={currentPageName}>{children}</__Layout> : <>{children}</>;

/**
 * Wrapper that reads /magnet/:code from the URL, fetches the event,
 * then renders MagnetGuestPage with the event prop.
 */
function MagnetGuestEntry() {
  const { code } = useParams();
  const { data: event, isLoading } = useQuery({
    queryKey: ['magnet-event-code', code],
    queryFn: () => memoriaService.events.getByCode(code),
    enabled: !!code,
  });

  if (isLoading) return (
    <div className="fixed inset-0 flex items-center justify-center bg-[#0a0a0e]">
      <div className="w-6 h-6 border-2 border-white/10 border-t-violet-500 rounded-full animate-spin" />
    </div>
  );
  if (!event) return (
    <div className="fixed inset-0 flex items-center justify-center bg-[#0a0a0e]">
      <p className="text-white/30 text-sm">אירוע לא נמצא</p>
    </div>
  );
  return <MagnetGuestPage event={event} />;
}

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin, user } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') return <UserNotRegisteredError />;
    if (authError.type === 'auth_required') { navigateToLogin(); return null; }
  }

  return (
    <>
      {user?.needsOnboarding && <HostOnboardingModal />}
      <Routes>

        {/* ── Public / Landing ── */}
        <Route path="/" element={<LayoutWrapper currentPageName="Home"><Home /></LayoutWrapper>} />

        {/* ── Guest routes (anonymous auth, GuestLayout) ── */}
        <Route path="/event/:code" element={<GuestLayout><Event /></GuestLayout>} />
        <Route path="/event/:code/gallery" element={<GuestLayout><EventGallery /></GuestLayout>} />
        <Route path="/magnet/lead" element={<GuestLayout><MagnetLead /></GuestLayout>} />
        <Route path="/magnet/:code" element={<GuestLayout><MagnetGuestEntry /></GuestLayout>} />

        {/* ── Host routes (authenticated, standard layout) ── */}
        <Route path="/host" element={<LayoutWrapper currentPageName="MyEvents"><MyEvents /></LayoutWrapper>} />
        <Route path="/host/events/create" element={<LayoutWrapper currentPageName="CreateEvent"><CreateEvent /></LayoutWrapper>} />
        <Route path="/host/events/:id" element={<LayoutWrapper currentPageName="Dashboard"><Dashboard /></LayoutWrapper>} />
        <Route path="/host/events/:id/success" element={<LayoutWrapper currentPageName="EventSuccess"><EventSuccess /></LayoutWrapper>} />

        {/* ── Admin: full-screen routes (no shell) ── */}
        <Route path="/admin/events/magnet/:eventId/print" element={<RequireAdmin><PrintStation /></RequireAdmin>} />

        {/* ── Admin: tabbed shell with nested routes ── */}
        <Route path="/admin" element={<RequireAdmin><AdminDashboard /></RequireAdmin>}>
          <Route index element={<AdminOverview />} />
          <Route path="events/share"          element={<AdminEventsList type="share" />} />
          <Route path="events/magnet"         element={<AdminEventsList type="magnet" />} />
          <Route path="events/magnet/create"  element={<CreateMagnetEvent />} />
          <Route path="events/magnet/:eventId" element={<MagnetEventDashboard />} />
          <Route path="leads"                 element={<LeadsPanel />} />
          <Route path="users"                 element={<AdminUsers />} />
        </Route>

        {/* ── Legacy redirects (backwards compatibility) ── */}
        <Route path="/AdminDashboard"      element={<Navigate to="/admin" replace />} />
        <Route path="/AdminUsers"          element={<Navigate to="/admin/users" replace />} />
        <Route path="/CreateMagnetEvent"   element={<Navigate to="/admin/events/magnet/create" replace />} />
        <Route path="/PrintStation/:id"    element={<Navigate to="/admin" replace />} />
        <Route path="/MyEvents"            element={<Navigate to="/host" replace />} />
        <Route path="/CreateEvent"         element={<Navigate to="/host/events/create" replace />} />
        <Route path="/EventSuccess"        element={<Navigate to="/host" replace />} />

        {/* Legacy query-param event routes (keep working) */}
        <Route path="/Event"              element={<GuestLayout><Event /></GuestLayout>} />
        <Route path="/EventGallery"       element={<GuestLayout><EventGallery /></GuestLayout>} />
        <Route path="/MagnetLead"         element={<GuestLayout><MagnetLead /></GuestLayout>} />
        <Route path="/Dashboard"          element={<LayoutWrapper currentPageName="Dashboard"><Dashboard /></LayoutWrapper>} />

        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </>
  );
};

function App() {
  return (
    <GlobalErrorBoundary>
      <AuthProvider>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <NavigationTracker />
            <AuthenticatedApp />
          </Router>
          <Toaster />
          <SpeedInsights />
        </QueryClientProvider>
      </AuthProvider>
    </GlobalErrorBoundary>
  );
}

export default App;
