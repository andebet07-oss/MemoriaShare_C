import { lazy, Suspense } from 'react';
import { Toaster } from "@/components/ui/toaster"
import { LoadingState } from '@/components/ui/LoadingState'
import GlobalErrorBoundary from '@/components/GlobalErrorBoundary'
import OfflineBanner from '@/components/OfflineBanner'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import NavigationTracker from '@/lib/NavigationTracker'
import { BrowserRouter as Router, Route, Routes, Navigate, useParams, useLocation } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import HostOnboardingModal from '@/components/HostOnboardingModal';
import GuestLayout from '@/components/GuestLayout';
import RequireAdmin from '@/components/RequireAdmin';
import CreateEventRedirect from '@/components/CreateEventRedirect';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { useQuery } from '@tanstack/react-query';
import memoriaService from '@/components/memoriaService';
import GuestSkeleton from '@/components/magnet/guest/GuestSkeleton';
import { GuestNotFound } from '@/components/magnet/guest/GuestMessage';

// Pages — lazy-loaded so each route ships its own chunk instead of one
// monolithic bundle every visitor must download up front.
const Home            = lazy(() => import('@/pages/Home'));
const Event           = lazy(() => import('@/pages/Event'));
const EventGallery    = lazy(() => import('@/pages/EventGallery'));
const EventSuccess    = lazy(() => import('@/pages/EventSuccess'));
const Dashboard       = lazy(() => import('@/pages/Dashboard'));
const MyEvents        = lazy(() => import('@/pages/MyEvents'));
const MagnetLead      = lazy(() => import('@/pages/MagnetLead'));
const MagnetGuestPage = lazy(() => import('@/pages/MagnetGuestPage'));
const PrintStation    = lazy(() => import('@/pages/PrintStation'));

// Admin pages
const AdminDashboard       = lazy(() => import('@/pages/AdminDashboard'));
const CreateMagnetEvent    = lazy(() => import('@/pages/CreateMagnetEvent'));
const MagnetEventDashboard = lazy(() => import('@/pages/MagnetEventDashboard'));
const AdminUsers           = lazy(() => import('@/pages/AdminUsers'));

// Admin tab content
const AdminOverview   = lazy(() => import('@/components/admin/AdminOverview'));
const AdminEventsList = lazy(() => import('@/components/admin/AdminEventsList'));
const LeadsPanel      = lazy(() => import('@/components/admin/LeadsPanel'));

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

  if (isLoading) return <GuestSkeleton />;
  if (!event) return <GuestNotFound />;
  // Guard: only magnet events belong here. A share-event code lands on the
  // share gallery instead of wrongly opening the magnet print UI.
  if (event.event_type && event.event_type !== 'magnet') {
    return <Navigate to={`/event/${code}`} replace />;
  }
  return <MagnetGuestPage event={event} />;
}

// A guest who scans the event QR lands on /magnet/:code: while the app boots,
// show the landing's own skeleton there instead of a spinner.
const GUEST_LANDING = /^\/magnet\/(?!lead\/?$)[^/]+\/?$/;

function RouteLoading() {
  const { pathname } = useLocation();
  return GUEST_LANDING.test(pathname) ? <GuestSkeleton /> : <LoadingState fullScreen />;
}

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin, user } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return <RouteLoading />;
  }

  if (authError) {
    if (authError.type === 'user_not_registered') return <UserNotRegisteredError />;
    if (authError.type === 'auth_required') { navigateToLogin(); return null; }
  }

  return (
    <>
      {user?.needsOnboarding && <HostOnboardingModal />}
      <Suspense fallback={<RouteLoading />}>
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
        <Route path="/host/events/create" element={<CreateEventRedirect />} />
        <Route path="/host/events/:id" element={<LayoutWrapper currentPageName="Dashboard"><Dashboard /></LayoutWrapper>} />
        <Route path="/host/events/:id/success" element={<LayoutWrapper currentPageName="EventSuccess"><EventSuccess /></LayoutWrapper>} />

        {/* ── Admin: full-screen routes (no shell) ── */}
        <Route path="/admin/events/magnet/:eventId/print" element={<RequireAdmin><PrintStation /></RequireAdmin>} />

        {/* ── Admin: tabbed shell with nested routes ── */}
        <Route path="/admin" element={<RequireAdmin><AdminDashboard /></RequireAdmin>}>
          <Route index element={<AdminOverview />} />
          <Route path="events/magnet"         element={<AdminEventsList />} />
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

        <Route path="*" element={<PageNotFound />} />
      </Routes>
      </Suspense>
    </>
  );
};

function App() {
  return (
    <GlobalErrorBoundary>
      <AuthProvider>
        <QueryClientProvider client={queryClientInstance}>
          <OfflineBanner />
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
