import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from '@/lib/supabase';
import { LogIn, LogOut, ShieldCheck, X, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

// The home page's sections, in page order (ids in Features / HowItWorks / Designs / FAQ).
const SECTIONS = [
  { id: 'features', label: 'למה Memoria' },
  { id: 'how-it-works', label: 'איך זה עובד' },
  { id: 'designs', label: 'עיצובים' },
  { id: 'faq', label: 'שאלות' },
];

export default function Header({ onCreateEvent }) {
  const { user, isAuthenticated: hasSession } = useAuth();
  // Anonymous sessions (magnet guests, lead visitors) are not a sign-in: keep
  // the login button so an admin can still sign in from the same device.
  const isAuthenticated = hasSession && !user?.isAnonymous;
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  React.useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMenuOpen]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const closeMenu = () => setIsMenuOpen(false);

  const handleLogin = () => {
    supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.href },
    });
  };

  const scrollToSection = (e, sectionId) => {
    e.preventDefault();
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    closeMenu();
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border" dir="rtl">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          {/* Mobile menu button */}
          <button
            className="md:hidden text-foreground/60 hover:text-foreground z-[200] relative"
            onClick={() => setIsMenuOpen(true)}
            aria-label="פתח תפריט">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-5 text-sm font-medium">
            {SECTIONS.map(({ id, label }) => (
              <a key={id} href={`#${id}`} onClick={(e) => scrollToSection(e, id)} className="text-foreground/50 hover:text-foreground transition-colors cursor-pointer">{label}</a>
            ))}
            {isAuthenticated && user?.role === 'admin' && (
              <Link to="/admin" className="text-indigo-300 hover:text-indigo-200 transition-colors flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                ניהול
              </Link>
            )}

            {/* CTA — starts the magnet lead wizard. */}
            <button
              onClick={onCreateEvent}
              className="px-4 py-2 bg-primary text-primary-foreground font-semibold text-sm rounded-full hover:brightness-110 active:scale-[0.98] transition-all shadow-indigo-soft"
            >
              שריינו תאריך
            </button>

            {isAuthenticated ? (
              <Button onClick={handleLogout} variant="ghost" className="text-foreground/40 hover:text-foreground transition-colors p-2 h-auto">
                <LogOut className="w-4 h-4" />
              </Button>
            ) : (
              <Button onClick={handleLogin} variant="ghost" className="text-foreground/50 hover:text-foreground text-sm px-3 py-2 h-auto">
                <LogIn className="ml-1.5 w-4 h-4 rtl:-scale-x-100" />
                כניסה
              </Button>
            )}
          </nav>

          {/* Logo */}
          <Link to="/" className="flex items-center hover:opacity-80 transition-opacity">
            <img src="/LOGO.png" alt="Memoria" className="h-10 w-auto object-contain" />
          </Link>
        </div>
      </header>

      {/* Mobile Side Drawer */}
      <div className={`fixed inset-0 z-[999] md:hidden transition-all duration-300 ease-in-out ${isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" onClick={closeMenu} />

        <div className={`absolute top-0 right-0 w-[85%] max-w-sm h-full bg-background/95 backdrop-blur-xl border-l border-border flex flex-col shadow-card-dark transition-transform duration-300 ease-in-out ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'}`} dir="rtl">

          <div className="flex items-center justify-between p-6 border-b border-border">
            <img src="/LOGO.png" alt="Memoria" className="h-8 w-auto object-contain" />
            <button onClick={closeMenu} aria-label="סגור תפריט" className="w-10 h-10 flex items-center justify-center rounded-full bg-foreground/5 hover:bg-foreground/10 text-foreground/40 hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40">
              <X className="w-6 h-6" />
            </button>
          </div>

          {isAuthenticated && user && (
            <div className="px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-foreground/10 flex items-center justify-center border border-foreground/20 shrink-0">
                  <User className="w-5 h-5 text-foreground/60" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-foreground font-semibold text-sm truncate">{user.full_name || user.email}</span>
                  <span className="text-foreground/35 text-xs truncate">{user.email}</span>
                </div>
              </div>
              <Separator className="mt-4 bg-border" />
            </div>
          )}

          <nav className="flex-1 flex flex-col px-6 space-y-1 overflow-y-auto">
            {/* Booking CTA */}
            <button
              onClick={() => { closeMenu(); onCreateEvent?.(); }}
              className="w-full text-right text-lg font-bold text-foreground py-3.5 px-2 rounded-lg bg-foreground/5 border border-border mb-2 flex items-center gap-3"
            >
              <span className="w-2 h-2 rounded-full bg-brand animate-pulse" />
              שריינו תאריך
            </button>

            {SECTIONS.map(({ id, label }) => (
              <a key={id} href={`#${id}`} onClick={(e) => scrollToSection(e, id)} className="text-lg font-medium text-foreground/60 hover:text-foreground transition-colors py-3.5 px-2 rounded-lg hover:bg-foreground/5 flex items-center gap-4 border-b border-border">{label}</a>
            ))}

            {isAuthenticated && user?.role === 'admin' && (
              <Link to="/admin" onClick={closeMenu} className="flex items-center gap-4 text-lg font-medium text-indigo-300 hover:text-indigo-200 transition-colors py-3.5 px-2 rounded-lg hover:bg-foreground/5 border-b border-border">
                <ShieldCheck className="w-5 h-5 shrink-0" />
                ניהול
              </Link>
            )}
          </nav>

          <div className="p-6 border-t border-border">
            {isAuthenticated ? (
              <Button
                onClick={() => { handleLogout(); closeMenu(); }}
                variant="ghost"
                className="w-full justify-start p-4 h-auto text-lg font-medium text-destructive hover:brightness-110 transition-colors flex items-center gap-4 rounded-lg hover:bg-foreground/5 border border-border">
                <LogOut className="w-5 h-5" />
                התנתקות
              </Button>
            ) : (
              <Button
                onClick={() => { handleLogin(); closeMenu(); }}
                variant="ghost"
                className="w-full justify-start p-4 h-auto text-lg font-medium text-foreground/60 hover:text-foreground flex items-center gap-4 rounded-lg hover:bg-foreground/5 border border-border">
                <LogIn className="w-5 h-5 rtl:-scale-x-100" />
                כניסה
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
