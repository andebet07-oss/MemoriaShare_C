import { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';

/**
 * Global connectivity banner. Slides in from the top when the browser goes
 * offline so a guest mid-capture or an operator at the station knows why
 * things stopped responding, instead of facing a silently stuck UI.
 */
export default function OfflineBanner() {
  const [offline, setOffline] = useState(() =>
    typeof navigator !== 'undefined' && navigator.onLine === false
  );

  useEffect(() => {
    const goOffline = () => setOffline(true);
    const goOnline = () => setOffline(false);
    window.addEventListener('offline', goOffline);
    window.addEventListener('online', goOnline);
    return () => {
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('online', goOnline);
    };
  }, []);

  if (!offline) return null;

  return (
    <div
      dir="rtl"
      className="fixed top-0 inset-x-0 z-[9999] flex items-center justify-center gap-2 py-2 px-4 text-sm font-semibold text-white animate-in slide-in-from-top duration-300"
      style={{ background: 'rgba(220,38,38,0.95)', backdropFilter: 'blur(8px)' }}
      role="status"
    >
      <WifiOff className="w-4 h-4" />
      אין חיבור לאינטרנט — בודקים את הרשת...
    </div>
  );
}
