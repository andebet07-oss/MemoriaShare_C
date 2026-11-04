// The only sign-in on the site: shown by RequireAdmin on every /admin page.
// Signed out (or an anonymous guest session) → Google sign-in, back to the page that was asked for.
// Signed in without admin rights → says so and offers to sign out.
// A refused sign-in (account not on public.signin_allowlist, or banned) comes back from Supabase
// with ?error=…&error_description=… (or the same in the #hash): say so instead of a bare button.
import { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { LogIn, LogOut, ShieldAlert } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';

const ERROR_KEYS = ['error', 'error_code', 'error_description'];
const ERROR_TEXT = {
  notAllowed: 'החשבון הזה לא מורשה להיכנס. הכניסה לניהול פתוחה רק לחשבונות של צוות Memoria.',
  failed: 'הכניסה לא הושלמה. אפשר לנסות שוב.',
};

function readSignInError() {
  const params = new URLSearchParams(window.location.hash.slice(1));
  new URLSearchParams(window.location.search).forEach((value, key) => params.set(key, value));
  if (!ERROR_KEYS.some(key => params.get(key))) return null;
  const detail = `${params.get('error_code') ?? ''} ${params.get('error_description') ?? ''}`.toLowerCase();
  return /not allowed|banned/.test(detail) ? 'notAllowed' : 'failed';
}

export default function AdminSignIn({ notAdmin = false }) {
  const { user, navigateToLogin, logout } = useAuth();
  const location = useLocation();
  const [signInError] = useState(readSignInError);

  // Drop the error from the address so a reload shows the plain sign-in again.
  useEffect(() => {
    if (!signInError) return;
    const url = new URL(window.location.href);
    ERROR_KEYS.forEach(key => url.searchParams.delete(key));
    url.hash = '';
    window.history.replaceState(window.history.state, '', url.toString());
  }, [signInError]);

  const search = new URLSearchParams(location.search);
  ERROR_KEYS.forEach(key => search.delete(key));
  const query = search.toString();
  const returnUrl = `${window.location.origin}${location.pathname}${query ? `?${query}` : ''}`;

  return (
    <main className="min-h-screen bg-background text-foreground flex items-center justify-center px-4" dir="rtl">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 flex flex-col items-center gap-6 text-center">
        <img src="/LOGO.png" alt="Memoria" className="h-10 w-auto object-contain" />
        {notAdmin ? (
          <>
            <div className="flex flex-col items-center gap-2">
              <ShieldAlert className="w-8 h-8 text-brand" />
              <h1 className="text-xl font-semibold">אין לחשבון הזה הרשאת ניהול</h1>
              {user?.email && <p className="text-sm text-muted-foreground break-all">{user.email}</p>}
            </div>
            <Button variant="secondary" className="w-full" onClick={() => logout(false)}>
              <LogOut />
              התנתקות וכניסה בחשבון אחר
            </Button>
          </>
        ) : (
          <>
            <div className="flex flex-col gap-2">
              <h1 className="text-xl font-semibold">כניסה לניהול</h1>
              <p className="text-sm text-muted-foreground">לצוות Memoria בלבד</p>
            </div>
            {signInError && (
              <p role="alert" className="w-full rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-foreground">
                {ERROR_TEXT[signInError]}
              </p>
            )}
            <Button className="w-full" onClick={() => navigateToLogin(returnUrl)}>
              <LogIn className="rtl:-scale-x-100" />
              כניסה עם Google
            </Button>
          </>
        )}
        <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          חזרה לאתר
        </Link>
      </div>
    </main>
  );
}
