import { useEffect, useSyncExternalStore } from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

// Screens that explain the offline state inline (the guest landing) hide the
// global banner while they are on screen, so the guest never sees it twice.
let inlineCount = 0;
const listeners = new Set();
const notify = () => listeners.forEach((l) => l());
const subscribe = (l) => { listeners.add(l); return () => listeners.delete(l); };
const isSuppressed = () => inlineCount > 0;

/** Hide the global banner while `active` (the caller shows its own offline notice). */
export function useInlineOfflineNotice(active) {
  useEffect(() => {
    if (!active) return undefined;
    inlineCount += 1;
    notify();
    return () => { inlineCount -= 1; notify(); };
  }, [active]);
}

/**
 * Global connectivity banner. Slides in from the top when the browser goes
 * offline so a guest mid-capture or an operator at the station knows why
 * things stopped responding, instead of facing a silently stuck UI.
 */
export default function OfflineBanner() {
  const online = useOnlineStatus();
  const suppressed = useSyncExternalStore(subscribe, isSuppressed, isSuppressed);

  if (online || suppressed) return null;

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
