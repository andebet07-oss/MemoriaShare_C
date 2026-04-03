import React from "react";
import Header from "@/components/home/Header";

const PAGES_WITHOUT_HEADER = ["Home", "Event", "EventGallery", "EventSuccess"];

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
        @media (prefers-color-scheme: dark) {
          :root {
            --background: 0 0% 3.9%;
            --foreground: 0 0% 98%;
            --border: 0 0% 14.9%;
            --input: 0 0% 14.9%;
            --ring: 0 0% 83.1%;
          }
        }

        :root {
          --premium-silver: linear-gradient(135deg, #f3f3f3 0%, #e5e5e5 45%, #c4c4c4 55%, #f3f3f3 100%);
          --dark-chrome: linear-gradient(135deg, #f0f2f3 0%, #bfc8d0 45%, #9da9b2 55%, #f0f2f3 100%);
          --metallic-highlight: rgba(255, 255, 255, 0.4);
          --metallic-shadow: rgba(0, 0, 0, 0.3);
        }
        
        * {
          font-family: 'Inter', 'Assistant', 'DM Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        }
        
        .dark-chrome-text {
          background: var(--dark-chrome);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.15));
          text-shadow: 0 0 10px rgba(191, 200, 208, 0.3);
        }
        
        .metallic-glow {
          box-shadow: 
            0 0 20px rgba(229, 229, 229, 0.2),
            0 0 40px rgba(229, 229, 229, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 0.2);
        }
        
        .premium-silver-gradient {
          background: var(--premium-silver);
          position: relative;
          overflow: hidden;
        }
        
        .premium-silver-gradient::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
          animation: shimmer 2s infinite;
        }
        
        @keyframes shimmer {
          0% { left: -100%; }
          100% { left: 100%; }
        }
        
        .animate-fade-in {
          animation: fadeIn 0.8s ease-out;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .glass-effect {
          background: rgba(17, 24, 39, 0.5);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(55, 65, 81, 0.5);
        }
        
        .luxury-button {
          background: linear-gradient(180deg, #f9fafb, #e5e7eb);
          color: #1f2937;
          font-weight: 600;
          border: 1px solid #d1d5db;
          box-shadow: 0 1px 2px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.4);
          transition: all 0.2s ease-in-out;
        }

        .luxury-button:hover {
          transform: translateY(-1px);
          background: linear-gradient(180deg, #ffffff, #f3f4f6);
          box-shadow: 0 4px 10px rgba(229, 231, 235, 0.25),
                      0 1px 2px rgba(0,0,0,0.05), 
                      inset 0 1px 0 rgba(255,255,255,0.5);
        }

        .premium-submit-button {
          background: linear-gradient(135deg, #f3f3f3 0%, #e5e5e5 45%, #c4c4c4 55%, #f3f3f3 100%);
          color: #1a1a1a;
          font-weight: 600;
          font-size: 18px;
          padding: 0.75rem 1.5rem;
          border-radius: 9999px;
          transition: all 0.3s ease;
          border: 1px solid rgba(255, 255, 255, 0.2);
          box-shadow: 
            0 4px 15px rgba(229, 229, 229, 0.15),
            inset 0 1px 0 rgba(255, 255, 255, 0.4);
          position: relative;
          overflow: hidden;
        }
        
        .premium-submit-button::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
          transition: left 0.5s ease;
        }
        
        .premium-submit-button:hover:not(:disabled) {
          transform: scale(1.05);
          background: linear-gradient(135deg, #ffffff 0%, #f3f3f3 45%, #e5e5e5 55%, #ffffff 100%);
          box-shadow: 
            0 8px 25px rgba(229, 229, 229, 0.25),
            0 0 0 1px rgba(255, 255, 255, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 0.5);
        }
        
        .premium-submit-button:hover:not(:disabled)::before {
          left: 100%;
        }
        
        .premium-submit-button:disabled {
          opacity: 0.5;
          transform: none;
          cursor: not-allowed;
          box-shadow: none;
        }
        
        .premium-submit-button:disabled::before {
          display: none;
        }
      `}</style>

      {/* Unified Header - shown on all pages except Home, CreateEvent, Event, EventGallery, EventSuccess */}
      {showHeader && <Header />}

      {/* Main Content */}
      <main className={`relative flex-1 flex flex-col ${showHeader ? 'pt-[72px]' : ''}`}>
        {children}
      </main>



      {/* Footer */}
      <footer className="bg-black border-t border-gray-800 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <p className="text-gray-400">
            © {new Date().getFullYear()} Memoria. כל הזכויות שמורות.
          </p>
        </div>
      </footer>
    </div>
  );
}