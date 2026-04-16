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
        <h2 className="text-xl font-bold text-foreground">מה תרצו ליצור?</h2>
        <p className="text-sm text-muted-foreground mt-1">בחרו את החוויה שמתאימה לאירוע שלכם</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Digital Album — neutral (standard tier) */}
        <button
          onClick={handleDigitalAlbum}
          className="flex flex-col items-center text-center p-5 bg-foreground/[0.04] border border-border rounded-2xl hover:bg-foreground/[0.06] hover:border-foreground/20 transition-all active:scale-[0.97] group"
        >
          <div className="w-14 h-14 rounded-2xl bg-foreground/10 border border-foreground/15 flex items-center justify-center mb-3 group-hover:bg-foreground/15 transition-colors">
            <Camera className="w-7 h-7 text-foreground/70" />
          </div>
          <span className="text-foreground font-bold text-sm leading-tight mb-1">אלבום דיגיטלי</span>
          <p className="text-muted-foreground text-xs leading-snug">גלריה חיה לכל האורחים</p>
        </button>

        {/* Magnet Experience — gold (premium tier) */}
        <button
          onClick={handleMagnet}
          className="flex flex-col items-center text-center p-5 bg-foreground/[0.04] border border-gold-500/20 rounded-2xl hover:bg-gold-950/20 hover:border-gold-500/40 transition-all active:scale-[0.97] group relative overflow-hidden shadow-gold-soft"
        >
          <span className="absolute top-2.5 left-2.5 text-[9px] font-black tracking-wider uppercase text-gold-400 bg-gold-500/10 px-1.5 py-0.5 rounded-full">פרמיום</span>
          <div className="w-14 h-14 rounded-2xl bg-gold-500/10 border border-gold-500/25 flex items-center justify-center mb-3 group-hover:bg-gold-500/20 transition-colors">
            <Magnet className="w-7 h-7 text-gold-400" />
          </div>
          <span className="text-foreground font-bold text-sm leading-tight mb-1">חוויית מגנטים</span>
          <p className="text-muted-foreground text-xs leading-snug">הדפסה חיה ממש באירוע</p>
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
        <DrawerContent className="bg-background border-border rounded-t-[1.5rem]">
          {/* Custom drag handle */}
          <div className="mx-auto mt-3 mb-1 h-1.5 w-12 rounded-full bg-foreground/20" />
          <ChooserContent onClose={() => onOpenChange(false)} />
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-background border-border rounded-2xl max-w-md p-0 overflow-hidden [&>button]:text-foreground/40 [&>button]:hover:text-foreground/80 [&>button]:hover:bg-foreground/10 [&>button]:rounded-full">
        <DialogTitle className="sr-only">בחירת סוג אירוע</DialogTitle>
        <ChooserContent onClose={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
