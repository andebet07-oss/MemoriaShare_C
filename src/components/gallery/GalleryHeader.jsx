import React from "react";
import { Button } from "@/components/ui/button";
import { Calendar, ArrowRight, Settings } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function GalleryHeader({ event, photosCount, participantsCount, isOwner, navigate }) {
  return (
    <>
      {/* Top nav bar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-md border-b border-white/5">
        <div className="flex items-center justify-between px-4 sm:px-6 py-4">
          <Button
            onClick={() => navigate(createPageUrl(`Event?code=${event.unique_code}`))}
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/10 w-11 h-11 rounded-full transition-all active:scale-95"
          >
            <ArrowRight className="w-5 h-5" />
          </Button>
          <div className="text-center flex-1 mx-4">
            <h1 className="text-xl sm:text-2xl font-bold text-white truncate">{event.name}</h1>
          </div>
          {isOwner ? (
            <Link
              to={createPageUrl(`Dashboard?id=${event.id}`)}
              className="text-white hover:bg-white/10 w-11 h-11 rounded-full flex items-center justify-center transition-all active:scale-95"
            >
              <Settings className="w-5 h-5" />
            </Link>
          ) : (
            <div className="w-11 h-11" />
          )}
        </div>
      </div>

      {/* Hero image */}
      <div className="relative h-64 sm:h-72 md:h-80 overflow-hidden mt-[72px] rounded-b-3xl">
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