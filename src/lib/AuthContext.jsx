import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

const AuthContext = createContext();

/**
 * Fetch the app-level profile (role, full_name, avatar_url) for a Supabase user
 * and merge it onto the user object so callers get user.email, user.full_name,
 * user.role etc. in one place.
 *
 * WHY anonymous short-circuit: anonymous guests never have a profile row.
 * Calling supabase.from('profiles').select() for them goes through _fetchWithAuth,
 * which can contend the auth mutex while AuthContext is still processing getSession().
 * Skipping it for anonymous users eliminates that contention entirely.
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
    role: 'user',
  };

  // Anonymous guests: no profile row, no DB call — return immediately
  if (supabaseUser.is_anonymous) {
    return { ...base, phone: '', needsOnboarding: false };
  }

  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, full_name, phone, avatar_url')
      .eq('id', supabaseUser.id)
      .maybeSingle();

    if (profile) {
      const merged = {
        ...base,
        role: profile.role || 'user',
        full_name: profile.full_name || base.full_name,
        phone: profile.phone || '',
        avatar_url: profile.avatar_url || base.avatar_url,
      };
      merged.needsOnboarding = !merged.full_name || !merged.phone;
      return merged;
    }
  } catch (err) {
    // Non-fatal: profile table might not exist yet or network is down
    console.warn('AuthContext: could not fetch profile', err.message);
  }

  // No profile row yet — host must complete onboarding
  return { ...base, phone: '', needsOnboarding: true };
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
      // getSession() is a synchronous localStorage read wrapped in a microtask —
      // it does NOT acquire the auth mutex and returns immediately.
      supabase.auth.getSession().then(async ({ data: { session } }) => {
        try {
          const enriched = await fetchUserWithProfile(session?.user ?? null);
          setUser(enriched);
          setIsAuthenticated(!!enriched);
          setAuthError(null);
        } catch (err) {
          console.warn('AuthContext: getSession profile fetch failed', err.message);
        }
        settle();
      }).catch((err) => {
        console.error('AuthContext: getSession threw', err);
        settle();
      });
    }

    // onAuthStateChange handles every subsequent auth event (SIGNED_IN after
    // OAuth, SIGNED_OUT, TOKEN_REFRESHED, etc.) and also fires INITIAL_SESSION
    // on OAuth callbacks so that path is fully covered.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      try {
        const enriched = await fetchUserWithProfile(session?.user ?? null);
        setUser(enriched);
        setIsAuthenticated(!!enriched);
        setAuthError(null);
        settle();
      } catch (err) {
        console.error('AuthContext: onAuthStateChange handler threw', err);
        settle();
      }
    });

    return () => {
      clearTimeout(safetyTimer);
      subscription.unsubscribe();
    };
  }, []);

  const refreshUser = async () => {
    const { data: { user: supabaseUser } } = await supabase.auth.getUser();
    const enriched = await fetchUserWithProfile(supabaseUser);
    setUser(enriched);
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
