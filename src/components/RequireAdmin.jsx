import { useAuth } from '@/lib/AuthContext';
import AdminSignIn from '@/components/admin/AdminSignIn';

/**
 * Route guard for admin-only routes, and the site's only sign-in.
 * - While auth is loading: shows a spinner
 * - Signed out, or only an anonymous guest session: the admin sign-in (Google)
 * - Signed in but not admin: says so, with sign-out
 * - Admin: renders children
 */
export default function RequireAdmin({ children }) {
  const { user, isLoadingAuth, isAuthenticated, profileReady } = useAuth();

  if (isLoadingAuth || !profileReady) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="w-7 h-7 border-2 border-border border-t-brand rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || !user || user.isAnonymous) return <AdminSignIn />;
  if (user.role !== 'admin') return <AdminSignIn notAdmin />;
  return children;
}
