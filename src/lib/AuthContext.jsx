import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

const AuthContext = createContext();

/**
 * Fetch the app-level profile (role, full_name, avatar_url) for a Supabase user
 * and merge it onto the user object so callers get user.email, user.full_name,
 * user.role etc. in one place.
 */
async function fetchUserWithProfile(supabaseUser) {
  if (!supabaseUser) return null;

  // Supabase OAuth stores name/picture in user_metadata
  const meta = supabaseUser.user_metadata || {};

  // Base user object — merge auth fields with metadata defaults
  const base = {
    ...supabaseUser,
    id: supabaseUser.id,                                          // UUID — use this for created_by comparisons
    email: supabaseUser.email,
    isAnonymous: supabaseUser.is_anonymous || false,             // true for Supabase Anonymous Sign-In guests
    full_name: meta.full_name || meta.name || supabaseUser.email?.split('@')[0] || '',
    avatar_url: meta.avatar_url || meta.picture || '',
    role: 'user', // default until profile row is loaded
  };

  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, full_name, avatar_url')
      .eq('id', supabaseUser.id)
      .maybeSingle();

    if (profile) {
      return {
        ...base,
        role: profile.role || 'user',
        full_name: profile.full_name || base.full_name,
        avatar_url: profile.avatar_url || base.avatar_url,
      };
    }
  } catch (err) {
    // Non-fatal: profile table might not exist yet
    console.warn('AuthContext: could not fetch profile', err.message);
  }

  return base;
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    // Resolve the current session immediately on mount
    supabase.auth.getSession().then(async ({ data: { session }, error }) => {
      if (error) {
        console.error('AuthContext: getSession failed', error);
        setAuthError({ type: 'unknown', message: error.message });
      }
      const enriched = await fetchUserWithProfile(session?.user ?? null);
      setUser(enriched);
      setIsAuthenticated(!!enriched);
      setIsLoadingAuth(false);
    });

    // Keep state in sync with Supabase auth events (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const enriched = await fetchUserWithProfile(session?.user ?? null);
      setUser(enriched);
      setIsAuthenticated(!!enriched);
      setIsLoadingAuth(false);
      setAuthError(null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const logout = async (shouldRedirect = true) => {
    setUser(null);
    setIsAuthenticated(false);
    await supabase.auth.signOut();
    if (shouldRedirect) {
      window.location.href = '/';
    }
  };

  const navigateToLogin = (returnUrl) => {
    supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: returnUrl || window.location.href,
      },
    });
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoadingAuth,
      isLoadingPublicSettings: false,
      authError,
      appPublicSettings: null,
      logout,
      navigateToLogin,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
