// The only sign-in on the site: shown by RequireAdmin on every /admin page.
// Signed out (or an anonymous guest session) → Google sign-in, back to the page that was asked for.
// Signed in without admin rights → says so and offers to sign out.
import { useLocation, Link } from 'react-router-dom';
import { LogIn, LogOut, ShieldAlert } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';

export default function AdminSignIn({ notAdmin = false }) {
  const { user, navigateToLogin, logout } = useAuth();
  const location = useLocation();
  const returnUrl = `${window.location.origin}${location.pathname}${location.search}`;

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
