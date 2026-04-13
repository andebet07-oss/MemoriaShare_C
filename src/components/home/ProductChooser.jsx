import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Magnet } from 'lucide-react';
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
  DialogTitle,
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
    <div className="px-5 pt-4 pb-[max(2rem,env(safe-area-inset-bottom,2rem))]" dir="rtl">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-white">מה תרצו ליצור?</h2>
        <p className="text-sm text-white/45 mt-1">בחרו את החוויה שמתאימה לאירוע שלכם</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Digital Album */}
        <button
          onClick={handleDigitalAlbum}
          className="flex flex-col items-center text-center p-5 bg-white/[0.04] border border-white/[0.08] rounded-2xl hover:bg-indigo-950/30 hover:border-indigo-500/20 transition-all active:scale-[0.97] group"
        >
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/15 flex items-center justify-center mb-3 group-hover:bg-indigo-500/15 transition-colors">
            <Camera className="w-7 h-7 text-indigo-300/70" />
          </div>
          <span className="text-white font-bold text-sm leading-tight mb-1">אלבום דיגיטלי</span>
          <p className="text-white/35 text-xs leading-snug">גלריה חיה לכל האורחים</p>
        </button>

        {/* Magnet Experience */}
        <button
          onClick={handleMagnet}
          className="flex flex-col items-center text-center p-5 bg-white/[0.04] border border-violet-500/15 rounded-2xl hover:bg-violet-950/30 hover:border-violet-500/30 transition-all active:scale-[0.97] group relative overflow-hidden"
        >
          <span className="absolute top-2.5 left-2.5 text-[9px] font-black tracking-wider uppercase text-violet-400/80 bg-violet-500/10 px-1.5 py-0.5 rounded-full">פרמיום</span>
          <div className="w-14 h-14 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mb-3 group-hover:bg-violet-500/15 transition-colors">
            <Magnet className="w-7 h-7 text-violet-400/70" />
          </div>
          <span className="text-white font-bold text-sm leading-tight mb-1">חוויית מגנטים</span>
          <p className="text-white/35 text-xs leading-snug">הדפסה חיה ממש באירוע</p>
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
        <DialogTitle className="sr-only">בחירת סוג אירוע</DialogTitle>
        <ChooserContent onClose={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
