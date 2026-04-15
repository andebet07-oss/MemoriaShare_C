import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';

/**
 * Route guard for admin-only routes.
 * - While auth is loading: shows a spinner
 * - Not authenticated: redirects to /
 * - Authenticated but not admin: redirects to /
 * - Admin: renders children
 */
export default function RequireAdmin({ children }) {
  const { user, isLoadingAuth, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoadingAuth) return;
    if (!isAuthenticated || user?.role !== 'admin') {
      navigate('/', { replace: true });
    }
  }, [isLoadingAuth, isAuthenticated, user?.role, navigate]);

  if (isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#0a0a0e]">
        <div className="w-7 h-7 border-2 border-white/10 border-t-violet-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== 'admin') return null;

  return children;
}
