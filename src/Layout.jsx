import React from "react";
import Header from "@/components/home/Header";

const PAGES_WITHOUT_HEADER = ["Home", "Event", "EventGallery", "EventSuccess", "CreateEvent", "CreateMagnetEvent"];
const PAGES_WITHOUT_FOOTER = ["Home", "Event", "EventGallery", "EventSuccess", "CreateEvent", "CreateMagnetEvent"];

export default function Layout({ children, currentPageName }) {
  const showHeader = !PAGES_WITHOUT_HEADER.includes(currentPageName);
  const showFooter = !PAGES_WITHOUT_FOOTER.includes(currentPageName);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col" dir="rtl">
       <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Frank+Ruhl+Libre:wght@400;500;700;900&family=Heebo:wght@300;400;600;700;900&display=swap');

        :root {
          --ink: #1e1e1e;
          --paper: #fcfcfe;
          --paper-muted: #b4b4b4;
          --accent: #7c86e1;
          --premium-silver: linear-gradient(135deg, #f3f3f3 0%, #e5e5e5 45%, #c4c4c4 55%, #f3f3f3 100%);
          --dark-chrome: linear-gradient(135deg, #f0f2f3 0%, #bfc8d0 45%, #9da9b2 55%, #f0f2f3 100%);
          --metallic-highlight: rgba(255, 255, 255, 0.4);
          --metallic-shadow: rgba(0, 0, 0, 0.3);
        }

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

        * {
          font-family: 'Heebo', 'Assistant', -apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif;
        }

        .font-editorial {
          font-family: 'Frank Ruhl Libre', Georgia, serif !important;
          font-feature-settings: "ss01" on;
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
        
      `}</style>

      {/* Unified Header - shown on all pages except Home, CreateEvent, Event, EventGallery, EventSuccess */}
      {showHeader && <Header />}

      {/* Main Content */}
      <main className={`relative flex-1 flex flex-col ${showHeader ? 'pt-[72px]' : ''}`}>
        {children}
      </main>



      {/* Footer */}
      {showFooter && (
        <footer className="bg-black border-t border-gray-800 mt-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
            <p className="text-gray-400">
              © {new Date().getFullYear()} Memoria. כל הזכויות שמורות.
            </p>
          </div>
        </footer>
      )}
    </div>
  );
}