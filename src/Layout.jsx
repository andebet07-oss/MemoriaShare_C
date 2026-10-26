import React from "react";
import Header from "@/components/home/Header";

const PAGES_WITHOUT_HEADER = ["Home", "Event", "EventGallery", "EventSuccess", "CreateEvent", "CreateMagnetEvent"];

// Dark mode is applied once on <html> (index.html), so the Header and any
// portalled overlays (drawer, dialogs) always resolve the dark tokens.
export default function Layout({ children, currentPageName }) {
  const showHeader = !PAGES_WITHOUT_HEADER.includes(currentPageName);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col" dir="rtl">
      <style>{`
        body {
          overscroll-behavior: none;
          -webkit-overflow-scrolling: touch;
        }
        button, a, nav {
          -webkit-user-select: none;
          user-select: none;
          -webkit-tap-highlight-color: transparent;
        }
        * {
          font-family: 'Heebo', 'Assistant', -apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif;
        }
      `}</style>

      {/* Unified Header - shown on all pages except Home, CreateEvent, Event, EventGallery, EventSuccess */}
      {showHeader && <Header />}

      {/* Main Content */}
      <main className={`relative flex-1 flex flex-col ${showHeader ? 'pt-[72px]' : ''}`}>
        {children}
      </main>
    </div>
  );
}
