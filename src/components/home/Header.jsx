import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { supabase } from '@/lib/supabase';
import { LogIn, LogOut, LayoutDashboard, X, User, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export default function Header({ onlyMenu: _onlyMenu = false }) {
  const [user, setUser] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
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
    setUser(null);
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
          {/* Mobile menu button - right side in RTL */}
          <button
            className="md:hidden text-gray-300 hover:text-white z-[200] relative"
            onClick={() => setIsMenuOpen(true)}
            aria-label="פתח תפריט">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Desktop nav - center */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <a href="#features" onClick={(e) => scrollToSection(e, 'features')} className="text-gray-300 hover:text-white transition-colors cursor-pointer">פיצ'רים</a>
            <a href="#testimonials" onClick={(e) => scrollToSection(e, 'testimonials')} className="text-gray-300 hover:text-white transition-colors cursor-pointer">המלצות</a>
            <a href="#faq" onClick={(e) => scrollToSection(e, 'faq')} className="text-gray-300 hover:text-white transition-colors cursor-pointer">שאלות נפוצות</a>
            {user ? (
              <>
                <Link to={createPageUrl("MyEvents")} className="text-gray-300 hover:text-white transition-colors flex items-center gap-2">
                  <LayoutDashboard className="w-4 h-4" />
                  האירועים שלי
                </Link>
                {user.role === 'admin' && (
                  <Link to={createPageUrl("AdminUsers")} className="text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    משתמשים
                  </Link>
                )}
                <Button onClick={handleLogout} variant="ghost" className="text-gray-300 hover:text-white transition-colors p-2">
                  <LogOut className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <Button onClick={handleLogin} className="luxury-button text-sm px-4 py-2 rounded-lg">
                <LogIn className="ml-2 w-4 h-4" />
                התחברות
              </Button>
            )}
          </nav>

          {/* Logo - left side in RTL (visually right) */}
          <Link to="/" className="flex items-center hover:opacity-80 transition-opacity">
            <img src="/LOGO.png" alt="MemoriaShare" className="h-10 w-auto object-contain" />
          </Link>
        </div>
      </header>

      {/* Side Drawer */}
      <div className={`fixed inset-0 z-[999] md:hidden transition-all duration-300 ease-in-out ${isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeMenu} />

        <div className={`absolute top-0 right-0 w-[85%] max-w-sm h-full bg-black/95 backdrop-blur-xl border-l border-white/10 flex flex-col shadow-2xl transition-transform duration-300 ease-in-out ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'}`} dir="rtl">

          {/* Drawer Header: Logo + Close */}
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <div className="flex items-center">
              <img src="/LOGO.png" alt="MemoriaShare" className="h-8 w-auto object-contain" />
            </div>
            <button onClick={closeMenu} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* User Info Section */}
          {user && (
            <div className="px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center border border-white/20 shrink-0">
                  <User className="w-5 h-5 text-gray-300" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-white font-semibold text-sm truncate">{user.full_name || user.email}</span>
                  <span className="text-gray-500 text-xs truncate">{user.email}</span>
                </div>
              </div>
              <Separator className="mt-4 bg-white/10" />
            </div>
          )}

          {/* Nav Links */}
          <nav className="flex-1 flex flex-col px-6 space-y-1 overflow-y-auto">
            <a href="#features" onClick={(e) => scrollToSection(e, 'features')} className="text-lg font-medium text-gray-300 hover:text-white transition-colors py-3.5 px-2 rounded-lg hover:bg-white/5 flex items-center gap-4 border-b border-white/5">פיצ'רים</a>
            <a href="#testimonials" onClick={(e) => scrollToSection(e, 'testimonials')} className="text-lg font-medium text-gray-300 hover:text-white transition-colors py-3.5 px-2 rounded-lg hover:bg-white/5 flex items-center gap-4 border-b border-white/5">המלצות</a>
            <a href="#faq" onClick={(e) => scrollToSection(e, 'faq')} className="text-lg font-medium text-gray-300 hover:text-white transition-colors py-3.5 px-2 rounded-lg hover:bg-white/5 flex items-center gap-4 border-b border-white/5">שאלות נפוצות</a>

            {user && (
              <>
                <Link to={createPageUrl("MyEvents")} onClick={closeMenu} className="flex items-center gap-4 text-lg font-medium text-gray-300 hover:text-white transition-colors py-3.5 px-2 rounded-lg hover:bg-white/5 border-b border-white/5">
                  <LayoutDashboard className="w-5 h-5 shrink-0" />
                  האירועים שלי
                </Link>
                {user.role === 'admin' && (
                  <Link to={createPageUrl("AdminUsers")} onClick={closeMenu} className="flex items-center gap-4 text-lg font-medium text-amber-400 hover:text-amber-300 transition-colors py-3.5 px-2 rounded-lg hover:bg-white/5 border-b border-white/5">
                    <Users className="w-5 h-5 shrink-0" />
                    משתמשים
                  </Link>
                )}
              </>
            )}
          </nav>

          {/* Bottom: Login / Logout */}
          <div className="p-6 border-t border-white/10">
            {user ? (
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
                className="w-full luxury-button h-12 flex items-center justify-center gap-3 rounded-xl text-base font-semibold">
                <LogIn className="w-5 h-5" />
                התחברות
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}