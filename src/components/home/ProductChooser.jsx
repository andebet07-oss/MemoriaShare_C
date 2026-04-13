import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Magnet, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';
import { createPageUrl } from '@/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Drawer,
  DrawerContent,
} from '@/components/ui/drawer';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';

function ChooserContent({ onClose }) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const handleDigitalAlbum = () => {
    onClose();
    if (isAuthenticated) {
      navigate(createPageUrl('CreateEvent'));
    } else {
      const returnUrl = `${window.location.origin}${createPageUrl('CreateEvent')}`;
      supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: returnUrl } });
    }
  };

  const handleMagnet = () => {
    onClose();
    navigate('/MagnetLead');
  };

  return (
    <div className="px-6 pt-4 pb-[max(2rem,env(safe-area-inset-bottom,2rem))]" dir="rtl">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-white">מה תרצו ליצור?</h2>
        <p className="text-sm text-white/50 mt-1">בחרו את החוויה שמתאימה לאירוע שלכם</p>
      </div>

      <div className="flex flex-col gap-3">
        {/* Digital Album */}
        <button
          onClick={handleDigitalAlbum}
          className="w-full px-5 py-5 bg-white/[0.04] border border-white/[0.08] rounded-2xl hover:bg-white/[0.07] hover:border-white/[0.15] transition-all active:scale-[0.98] text-right flex items-center gap-4"
        >
          <div className="w-11 h-11 rounded-xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center shrink-0">
            <Camera className="w-5 h-5 text-white/70" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-white font-semibold text-base leading-tight">אלבום דיגיטלי</span>
              <span className="text-[10px] font-bold tracking-wider uppercase text-violet-400/80 bg-violet-500/10 px-2 py-0.5 rounded-full shrink-0">חינם</span>
            </div>
            <p className="text-white/40 text-sm leading-snug">האורחים מצלמים, הכל מתכנס לגלריה אחת</p>
          </div>
          <ArrowLeft className="w-4 h-4 text-white/20 shrink-0" />
        </button>

        {/* Magnet Experience */}
        <button
          onClick={handleMagnet}
          className="w-full px-5 py-5 bg-white/[0.04] border border-violet-500/15 rounded-2xl hover:bg-white/[0.06] hover:border-violet-500/30 transition-all active:scale-[0.98] text-right flex items-center gap-4"
        >
          <div className="w-11 h-11 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0">
            <Magnet className="w-5 h-5 text-violet-400/70" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-white font-semibold text-base leading-tight">חוויית מגנטים מלאה</span>
              <span className="text-[10px] font-bold tracking-wider uppercase text-violet-400/80 bg-violet-500/10 px-2 py-0.5 rounded-full shrink-0">פרמיום</span>
            </div>
            <p className="text-white/40 text-sm leading-snug">הצוות שלנו מגיע — מגנטים מודפסים ממש באירוע</p>
          </div>
          <ArrowLeft className="w-4 h-4 text-violet-400/30 shrink-0" />
        </button>
      </div>
    </div>
  );
}

export default function ProductChooser({ open, onOpenChange }) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="bg-[#0F0F0F] border-white/10 rounded-t-[1.5rem]">
          {/* Custom drag handle */}
          <div className="mx-auto mt-3 mb-1 h-1.5 w-12 rounded-full bg-white/20" />
          <ChooserContent onClose={() => onOpenChange(false)} />
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0F0F0F] border-white/10 rounded-2xl max-w-md p-0 overflow-hidden [&>button]:text-white/40 [&>button]:hover:text-white/80 [&>button]:hover:bg-white/10 [&>button]:rounded-full">
        <ChooserContent onClose={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
