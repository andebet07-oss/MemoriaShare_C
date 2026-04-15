import { useAuth } from '@/lib/AuthContext';

/**
 * Returns true when the current authenticated user has the 'admin' role.
 * Role is sourced from profiles.role via AuthContext — never from client-side assumptions.
 */
export default function useIsAdmin() {
  const { user } = useAuth();
  return user?.role === 'admin';
}
