import React from "react";
import { Button } from "@/components/ui/button";
import { Calendar, ArrowRight, Settings, Sun, Moon } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function GalleryHeader({ event, photosCount, participantsCount, isOwner, navigate, theme = 'dark', onToggleTheme }) {
  const isLight = theme === 'light';
  return (
    <>
      {/* Top nav bar — Instagram/VSCO username style */}
      <div className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-md border-b ${isLight ? 'bg-white/95 border-black/10' : 'bg-black/95 border-white/10'}`}>
        <div className="flex items-center justify-between px-4 sm:px-6" style={{ height: '52px' }}>
          <Button
            onClick={() => navigate(createPageUrl(`Event?code=${event.unique_code}`))}
            variant="ghost"
            size="icon"
            className={`w-10 h-10 rounded-full transition-all active:scale-95 shrink-0 ${isLight ? 'text-zinc-900 hover:bg-black/10' : 'text-white hover:bg-white/10'}`}
          >
            <ArrowRight className="w-5 h-5" />
          </Button>
          <div className="text-center flex-1 mx-3 min-w-0">
            <p className={`font-bold text-base tracking-tight leading-none truncate ${isLight ? 'text-zinc-900' : 'text-white'}`}>{event.name}</p>
            <p className={`text-[9px] font-semibold tracking-[0.3em] uppercase mt-0.5 ${isLight ? 'text-zinc-500' : 'text-white/35'}`}>MEMORIA</p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {onToggleTheme && (
              <button
                type="button"
                onClick={onToggleTheme}
                aria-label={isLight ? 'עבור למצב כהה' : 'עבור למצב בהיר'}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-95 ${isLight ? 'text-zinc-900 hover:bg-black/10' : 'text-white hover:bg-white/10'}`}
              >
                {isLight ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              </button>
            )}
            {isOwner ? (
              <Link
                to={createPageUrl(`Dashboard?id=${event.id}`)}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-95 ${isLight ? 'text-zinc-900 hover:bg-black/10' : 'text-white hover:bg-white/10'}`}
              >
                <Settings className="w-4 h-4" />
              </Link>
            ) : null}
          </div>
        </div>
      </div>

      {/* Hero image */}
      <div className="relative h-64 sm:h-72 md:h-80 overflow-hidden mt-[52px] rounded-b-3xl">
        <div className="absolute inset-0">
          <img
            src={event.cover_image || "https://images.unsplash.com/photo-1519741497674-611481863552?w=800&auto=format&fit=crop&q=60"}
            alt={event.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
        </div>
        <div className="absolute bottom-6 sm:bottom-8 left-4 right-4 sm:left-6 sm:right-6">
          <div className="flex items-center gap-2 text-white/90 text-sm sm:text-base mb-3">
            <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="font-medium">
              {new Date(event.date).toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-3 leading-tight">{event.name}</h2>
          <div className="flex items-center gap-4 text-white/80 text-sm sm:text-base font-medium">
            <span>{photosCount} תמונות</span>
            <span>•</span>
            <span>{participantsCount} משתתפים</span>
          </div>
        </div>
      </div>
    </>
  );
}