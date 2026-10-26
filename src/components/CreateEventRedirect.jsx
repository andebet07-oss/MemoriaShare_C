import { Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { LoadingState } from '@/components/ui/LoadingState';

/**
 * Event creation is admin-only (single product, MemoriaMagnet): admins go to
 * the magnet event wizard, everyone else to the lead wizard. Waits for the
 * profile so an admin is never routed as a plain user while their role loads.
 * Mounted on /host/events/create, so MyEvents' "new event" buttons and the
 * legacy /CreateEvent URL land here too.
 */
export default function CreateEventRedirect() {
  const { user, isLoadingAuth, profileReady } = useAuth();
  if (isLoadingAuth || !profileReady) return <LoadingState fullScreen />;
  const isAdmin = !user?.isAnonymous && user?.role === 'admin';
  return <Navigate to={isAdmin ? '/admin/events/magnet/create' : '/magnet/lead'} replace />;
}
