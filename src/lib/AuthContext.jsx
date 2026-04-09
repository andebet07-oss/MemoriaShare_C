import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

const AuthContext = createContext();

/**
 * Build a base user object from a Supabase auth user — NO database calls.
 * Uses only the data already present in the JWT / user_metadata.
 * This is safe to call while the auth mutex may be held (token refresh in progress).
 */
function buildBaseUser(supabaseUser) {
  if (!supabaseUser) return null;
  const meta = supabaseUser.user_metadata || {};
  return {
    ...supabaseUser,
    id: supabaseUser.id,
    email: supabaseUser.email,
    isAnonymous: supabaseUser.is_anonymous || false,
    full_name: meta.full_name || meta.name || supabaseUser.email?.split('@')[0] || '',
    avatar_url: meta.avatar_url || meta.picture || '',
    role: 'user',
    phone: '',
    needsOnboarding: false,
  };
}

/**
 * Enrich a base user with DB profile data (role, phone, full_name override).
 * Called in the background AFTER the auth state has already settled.
 * Uses an AbortController so it never hangs indefinitely.
 */
async function enrichWithProfile(baseUser, setUser) {
  if (!baseUser || baseUser.isAnonymous) return;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6000);

  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, full_name, phone, avatar_url')
      .eq('id', baseUser.id)
      .maybeSingle()
      .abortSignal(controller.signal);

    clearTimeout(timer);

    if (profile) {
      setUser(prev => {
        // Guard: don't overwrite if a newer auth event already changed the user
        if (!prev || prev.id !== baseUser.id) return prev;
        const enriched = {
          ...prev,
          role: profile.role || 'user',
          full_name: profile.full_name || prev.full_name,
          phone: profile.phone || '',
          avatar_url: profile.avatar_url || prev.avatar_url,
        };
        enriched.needsOnboarding = !enriched.full_name || !enriched.phone;
        return enriched;
      });
    }
  } catch (err) {
    clearTimeout(timer);
    if (err.name !== 'AbortError') {
      console.warn('AuthContext: background profile fetch failed', err.message);
    }
  }
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    // settle() fires exactly once — whichever path resolves first wins.
    // The safety timer is the last resort.
    let settled = false;
    const settle = () => {
      if (!settled) {
        settled = true;
        clearTimeout(safetyTimer);
        setIsLoadingAuth(false);
      }
    };

    // Safety net: unblock the app if nothing resolves within 10 seconds.
    const safetyTimer = setTimeout(() => {
      console.warn('AuthContext: session resolution timed out — unblocking app');
      settle();
    }, 10000);

    // Detect an in-progress OAuth redirect (hash contains the token Supabase
    // is about to consume). In this case we must NOT call getSession() because
    // initialize() already holds the auth mutex to process the hash — a
    // concurrent getSession() would deadlock. For OAuth we rely solely on
    // onAuthStateChange INITIAL_SESSION, which fires after initialize() finishes.
    const isOAuthCallback = window.location.hash.includes('access_token');

    if (!isOAuthCallback) {
      // Normal page load / refresh: read the persisted session from localStorage.
      // buildBaseUser() makes NO DB calls and NO mutex acquisitions — instant.
      // Profile enrichment happens in the background after settle().
      supabase.auth.getSession().then(({ data: { session } }) => {
        const base = buildBaseUser(session?.user ?? null);
        setUser(base);
        setIsAuthenticated(!!base);
        setAuthError(null);
        settle();
        // Enrich with DB profile data in the background (non-blocking)
        if (base) enrichWithProfile(base, setUser);
      }).catch((err) => {
        console.error('AuthContext: getSession threw', err);
        settle();
      });
    }

    // onAuthStateChange handles SIGNED_IN (after OAuth), SIGNED_OUT,
    // TOKEN_REFRESHED, and INITIAL_SESSION on OAuth callbacks.
    // Same pattern: settle immediately with base user, enrich in background.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const base = buildBaseUser(session?.user ?? null);
      setUser(base);
      setIsAuthenticated(!!base);
      setAuthError(null);
      settle();
      // Enrich with DB profile data in the background (non-blocking)
      if (base) enrichWithProfile(base, setUser);
    });

    return () => {
      clearTimeout(safetyTimer);
      subscription.unsubscribe();
    };
  }, []);

  const refreshUser = async () => {
    const { data: { user: supabaseUser } } = await supabase.auth.getUser();
    const base = buildBaseUser(supabaseUser);
    setUser(base);
    if (base) await enrichWithProfile(base, setUser);
  };

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
      refreshUser,
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
