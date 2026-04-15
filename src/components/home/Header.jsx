import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from '@/lib/supabase';
import { LogIn, LogOut, LayoutDashboard, ShieldCheck, X, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export default function Header({ onOpenChooser }) {
  const { user, isAuthenticated } = useAuth();
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
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/10" dir="rtl">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          {/* Mobile menu button */}
          <button
            className="md:hidden text-white/60 hover:text-white z-[200] relative"
            onClick={() => setIsMenuOpen(true)}
            aria-label="פתח תפריט">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-5 text-sm font-medium">
            <a href="#features" onClick={(e) => scrollToSection(e, 'features')} className="text-white/50 hover:text-white transition-colors cursor-pointer">פיצ'רים</a>
            <a href="#testimonials" onClick={(e) => scrollToSection(e, 'testimonials')} className="text-white/50 hover:text-white transition-colors cursor-pointer">המלצות</a>
            <a href="#faq" onClick={(e) => scrollToSection(e, 'faq')} className="text-white/50 hover:text-white transition-colors cursor-pointer">שאלות נפוצות</a>
            {isAuthenticated && (
              <>
                <Link to={createPageUrl("MyEvents")} className="text-white/50 hover:text-white transition-colors flex items-center gap-2">
                  <LayoutDashboard className="w-4 h-4" />
                  האירועים שלי
                </Link>
                {user?.role === 'admin' && (
                  <Link to="/admin" className="text-violet-400 hover:text-violet-300 transition-colors flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4" />
                    ניהול
                  </Link>
                )}
              </>
            )}

            {/* CTA — opens product chooser */}
            <button
              onClick={onOpenChooser}
              className="px-4 py-2 bg-white text-black font-semibold text-sm rounded-full hover:bg-white/90 active:scale-[0.98] transition-all"
            >
              צרו אירוע
            </button>

            {isAuthenticated ? (
              <Button onClick={handleLogout} variant="ghost" className="text-white/40 hover:text-white transition-colors p-2 h-auto">
                <LogOut className="w-4 h-4" />
              </Button>
            ) : (
              <Button onClick={handleLogin} variant="ghost" className="text-white/50 hover:text-white text-sm px-3 py-2 h-auto">
                <LogIn className="ml-1.5 w-4 h-4" />
                כניסה
              </Button>
            )}
          </nav>

          {/* Logo */}
          <Link to="/" className="flex items-center hover:opacity-80 transition-opacity">
            <img src="/LOGO.png" alt="MemoriaShare" className="h-10 w-auto object-contain" />
          </Link>
        </div>
      </header>

      {/* Mobile Side Drawer */}
      <div className={`fixed inset-0 z-[999] md:hidden transition-all duration-300 ease-in-out ${isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeMenu} />

        <div className={`absolute top-0 right-0 w-[85%] max-w-sm h-full bg-black/95 backdrop-blur-xl border-l border-white/10 flex flex-col shadow-2xl transition-transform duration-300 ease-in-out ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'}`} dir="rtl">

          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <img src="/LOGO.png" alt="MemoriaShare" className="h-8 w-auto object-contain" />
            <button onClick={closeMenu} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>

          {isAuthenticated && user && (
            <div className="px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center border border-white/20 shrink-0">
                  <User className="w-5 h-5 text-white/60" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-white font-semibold text-sm truncate">{user.full_name || user.email}</span>
                  <span className="text-white/35 text-xs truncate">{user.email}</span>
                </div>
              </div>
              <Separator className="mt-4 bg-white/10" />
            </div>
          )}

          <nav className="flex-1 flex flex-col px-6 space-y-1 overflow-y-auto">
            {/* Create Event CTA */}
            <button
              onClick={() => { closeMenu(); onOpenChooser?.(); }}
              className="w-full text-right text-lg font-bold text-white py-3.5 px-2 rounded-lg bg-white/5 border border-white/10 mb-2 flex items-center gap-3"
            >
              <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
              צרו אירוע
            </button>

            <a href="#features" onClick={(e) => scrollToSection(e, 'features')} className="text-lg font-medium text-white/60 hover:text-white transition-colors py-3.5 px-2 rounded-lg hover:bg-white/5 flex items-center gap-4 border-b border-white/5">פיצ'רים</a>
            <a href="#testimonials" onClick={(e) => scrollToSection(e, 'testimonials')} className="text-lg font-medium text-white/60 hover:text-white transition-colors py-3.5 px-2 rounded-lg hover:bg-white/5 flex items-center gap-4 border-b border-white/5">המלצות</a>
            <a href="#faq" onClick={(e) => scrollToSection(e, 'faq')} className="text-lg font-medium text-white/60 hover:text-white transition-colors py-3.5 px-2 rounded-lg hover:bg-white/5 flex items-center gap-4 border-b border-white/5">שאלות נפוצות</a>

            {isAuthenticated && (
              <>
                <Link to={createPageUrl("MyEvents")} onClick={closeMenu} className="flex items-center gap-4 text-lg font-medium text-white/60 hover:text-white transition-colors py-3.5 px-2 rounded-lg hover:bg-white/5 border-b border-white/5">
                  <LayoutDashboard className="w-5 h-5 shrink-0" />
                  האירועים שלי
                </Link>
                {user?.role === 'admin' && (
                  <>
                    <Link to="/admin" onClick={closeMenu} className="flex items-center gap-4 text-lg font-medium text-violet-400 hover:text-violet-300 transition-colors py-3.5 px-2 rounded-lg hover:bg-white/5 border-b border-white/5">
                      <ShieldCheck className="w-5 h-5 shrink-0" />
                      ניהול
                    </Link>
                  </>
                )}
              </>
            )}
          </nav>

          <div className="p-6 border-t border-white/10">
            {isAuthenticated ? (
              <Button
                onClick={() => { handleLogout(); closeMenu(); }}
                variant="ghost"
                className="w-full justify-start p-4 h-auto text-lg font-medium text-red-400 hover:text-red-300 transition-colors flex items-center gap-4 rounded-lg hover:bg-white/5 border border-white/5">
                <LogOut className="w-5 h-5" />
                התנתקות
              </Button>
            ) : (
              <Button
                onClick={() => { handleLogin(); closeMenu(); }}
                variant="ghost"
                className="w-full justify-start p-4 h-auto text-lg font-medium text-white/60 hover:text-white flex items-center gap-4 rounded-lg hover:bg-white/5 border border-white/10">
                <LogIn className="w-5 h-5" />
                כניסה
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
