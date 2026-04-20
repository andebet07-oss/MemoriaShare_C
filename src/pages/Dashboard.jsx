import React, { useState, useEffect } from "react";
import memoriaService from "@/components/memoriaService";
import { useAuth } from '@/lib/AuthContext';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import JSZip from 'jszip';


import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  Lock,
  AlertTriangle,
  Copy,
  ExternalLink,
  Trash2,
  Share2,
  Settings,
  Image,
  Users,
  Download,
  ImageIcon,
  Check,
  Eye,
  EyeOff,
  ShieldCheck,
  Archive,
  X
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import EventGallery from "../pages/EventGallery";
import PrintableShareCards from "../components/dashboard/PrintableShareCards";
import CoHostsManager from "../components/dashboard/CoHostsManager";
import useRealtimeNotifications from "@/hooks/useRealtimeNotifications";
import RealtimeNotification from "@/components/notifications/RealtimeNotification";
import DeletionRequestsPanel from "@/components/dashboard/DeletionRequestsPanel";
import PhotoCard from "@/components/gallery/PhotoCard";

function ExportArchiveCard({ eventId, eventName }) {
  const [status, setStatus] = useState('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [zipObjectUrl, setZipObjectUrl] = useState(null);

  useEffect(() => {
    return () => {
      if (zipObjectUrl) window.URL.revokeObjectURL(zipObjectUrl);
    };
  }, [zipObjectUrl]);

  const handleExport = async () => {
    setStatus('running');
    setError(null);
    setProgress(0);
    setZipObjectUrl(null);

    try {
      const photos = await memoriaService.photos.getByEvent(eventId, {}, '-created_date', { limit: 9999, offset: 0 });

      if (photos.length === 0) {
        setError('אין תמונות לייצוא באירוע זה.');
        setStatus('idle');
        return;
      }

      const zip = new JSZip();
      const CHUNK_SIZE = 5;
      let done = 0;
      let fileIndex = 0;

      for (let i = 0; i < photos.length; i += CHUNK_SIZE) {
        const chunk = photos.slice(i, i + CHUNK_SIZE);
        await Promise.all(chunk.map(async (photo) => {
          if (!photo.file_url) return;
          try {
            const res = await fetch(photo.file_url);
            if (!res.ok) return;
            const blob = await res.blob();
            const ext = photo.file_url.split('.').pop().split('?')[0] || 'jpg';
            zip.file(`photo_${++fileIndex}.${ext}`, blob, { compression: 'STORE' });
          } catch (e) {
            console.warn('Skipping photo:', photo.file_url, e.message);
          }
        }));
        done += chunk.length;
        setProgress(Math.round((done / photos.length) * 95));
      }

      setProgress(98);
      const zipBlob = await zip.generateAsync({ type: 'blob', compression: 'STORE' });
      const url = window.URL.createObjectURL(zipBlob);
      setZipObjectUrl(url);
      setProgress(100);
      setStatus('completed');
    } catch (err) {
      console.error('Export error:', err);
      setError('שגיאה בתהליך הייצוא. נסה שוב.');
      setStatus('idle');
    }
  };

  const handleDownload = () => {
    if (!zipObjectUrl) return;
    const a = document.createElement('a');
    a.href = zipObjectUrl;
    a.download = `${eventName || 'photos'}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(zipObjectUrl);
    setZipObjectUrl(null);
    setStatus('idle');
    setProgress(0);
  };

  return (
    <div className="bg-card rounded-xl p-4 space-y-3">
      <div className="text-right">
        <h2 className="text-sm font-semibold text-foreground/80">הורדת כל התמונות</h2>
        <p className="text-xs text-muted-foreground mt-0.5">אריזת כל תמונות האירוע לקובץ ZIP ישירות בדפדפן</p>
      </div>

      {status === 'completed' && zipObjectUrl ? (
        <Button onClick={handleDownload} className="w-full bg-green-600 hover:bg-green-500 text-white font-bold h-12 rounded-xl transition-all shadow-[0_0_15px_rgba(22,163,74,0.3)]">
          <Download className="w-4 h-4 mr-2" />
          קובץ ה-ZIP מוכן! לחץ להורדה
        </Button>
      ) : status === 'running' ? (
        <div className="bg-black/50 rounded-xl p-3 border border-white/5">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" />
              {progress < 96 ? 'מוריד תמונות...' : 'אורז קובץ ZIP...'}
            </span>
            <span className="text-xs font-bold text-indigo-400">{progress}%</span>
          </div>
          <div className="w-full bg-border rounded-full h-1.5 overflow-hidden">
            <div className="bg-indigo-500 h-full transition-all duration-300" style={{ width: `${Math.max(5, progress)}%` }}>
              <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
            </div>
          </div>
        </div>
      ) : (
        <Button onClick={handleExport} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold h-12 rounded-xl transition-all">
          <Archive className="w-4 h-4 mr-2" /> התחל אריזת תמונות
        </Button>
      )}

      {error && <p className="text-red-400 text-[10px] text-center font-bold bg-red-900/20 p-2 rounded-lg">{error}</p>}
    </div>
  );
}

function EventSettingsTab({ event, onEventUpdate }) {
  const [name, setName] = useState(event?.name || "");
  const [coverImage, setCoverImage] = useState(event?.cover_image || "");
  const [autoPublish, setAutoPublish] = useState(event?.auto_publish_guest_photos ?? false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploading(true);
    const { file_url } = await memoriaService.storage.upload(file);
    setCoverImage(file_url);
    setIsUploading(false);
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setIsSaving(true);
    await memoriaService.events.update(event.id, { name: name.trim(), cover_image: coverImage, auto_publish_guest_photos: autoPublish });
    onEventUpdate({ ...event, name: name.trim(), cover_image: coverImage, auto_publish_guest_photos: autoPublish });
    setIsSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-4 mt-2">
      {/* שם האירוע */}
      <div className="bg-card rounded-xl p-4 space-y-3">
        <div className="text-right">
          <h2 className="text-sm font-semibold text-foreground/80">שם האירוע</h2>
          <p className="text-xs text-muted-foreground mt-0.5">הכותרת שתופיע לאורחים</p>
        </div>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="שם האירוע"
          className="bg-secondary border-border text-white text-right rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30"
          dir="rtl"
        />
      </div>

      {/* תמונת כריכה */}
      <div className="bg-card rounded-xl p-4 space-y-3">
        <div className="text-right">
          <h2 className="text-sm font-semibold text-foreground/80">תמונת כריכה</h2>
          <p className="text-xs text-muted-foreground mt-0.5">הרקע שיופיע לאורחים כשהם נכנסים לאירוע</p>
        </div>

        {/* תצוגה מקדימה */}
        {coverImage && (
          <div className="w-full h-40 rounded-lg overflow-hidden bg-secondary">
            <img src={coverImage} alt="תמונת כריכה" className="w-full h-full object-cover" />
          </div>
        )}

        <label htmlFor="settings-cover-upload" className="cursor-pointer block">
          <div className="w-full bg-secondary hover:bg-secondary/80 border border-border border-dashed rounded-lg py-4 flex flex-col items-center justify-center gap-2 transition-all">
            {isUploading ? (
              <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
            ) : (
              <ImageIcon className="w-5 h-5 text-muted-foreground" />
            )}
            <span className="text-xs text-muted-foreground font-medium">
              {isUploading ? 'מעלה...' : coverImage ? 'החלפת תמונה' : 'העלאת תמונה'}
            </span>
          </div>
        </label>
        <input type="file" id="settings-cover-upload" accept="image/*" onChange={handleFileChange} className="hidden" />
      </div>

      {/* הגדרת פרטיות גלריה */}
      <div className="bg-card rounded-xl p-4">
        <div className="flex items-center justify-between">
          <Switch
            checked={autoPublish}
            onCheckedChange={setAutoPublish}
            id="auto-publish-toggle"
            className="data-[state=checked]:bg-indigo-500 data-[state=unchecked]:bg-muted [&>span]:bg-white shrink-0"
          />
          <div className="text-right flex-1 mr-3">
            <label htmlFor="auto-publish-toggle" className="text-sm font-semibold text-foreground/80 cursor-pointer flex items-center justify-end gap-2">
              {autoPublish ? <Eye className="w-4 h-4 text-indigo-400" /> : <EyeOff className="w-4 h-4 text-muted-foreground" />}
              גלריה ציבורית
            </label>
            <p className="text-xs text-white/50 mt-1 leading-relaxed">
              כשהגלריה ציבורית, כל האורחים יכולים לראות את התמונות של כולם. כשהיא כבויה, כל אורח יראה רק את התמונות שלו.
            </p>
          </div>
        </div>
      </div>

      {/* כפתור שמירה */}
      <Button
        onClick={handleSave}
        disabled={isSaving || isUploading || !name.trim()}
        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl h-12 text-sm transition-all disabled:opacity-50"
      >
        {isSaving ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : saved ? (
          <span className="flex items-center gap-2"><Check className="w-4 h-4" /> נשמר!</span>
        ) : (
          'שמירת שינויים'
        )}
      </Button>

      <ExportArchiveCard eventId={event.id} eventName={event.name} />

      {/* Delete Account Dialog */}
      <Dialog open={showDeleteAccount} onOpenChange={setShowDeleteAccount}>
        <DialogContent className="bg-background/95 backdrop-blur-md border border-red-900/30 text-white w-[90vw] max-w-md rounded-2xl" dir="rtl">
          <DialogHeader className="text-center">
            <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <DialogTitle className="text-xl font-bold text-red-400">מחיקת חשבון</DialogTitle>
            <DialogDescription className="text-muted-foreground pt-2 text-sm">
              האם אתה בטוח שברצונך למחוק את חשבונך? פעולה זו אינה הפיכה וכל הנתונים יימחקו לצמיתות.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-3 pt-4 flex-col sm:flex-row">
            <Button
              onClick={async () => {
                setIsDeletingAccount(true);
                await memoriaService.auth.logout();
              }}
              disabled={isDeletingAccount}
              className="w-full bg-red-700 hover:bg-red-600 text-white font-bold min-h-[44px] rounded-xl"
            >
              {isDeletingAccount ? <Loader2 className="w-4 h-4 animate-spin" /> : 'כן, מחק חשבון'}
            </Button>
            <DialogClose asChild>
              <Button variant="ghost" className="w-full min-h-[44px] border border-white/10 hover:bg-white/10">ביטול</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Account */}
      <div className="bg-card rounded-xl p-4 border border-red-900/30">
        <div className="text-right mb-3">
          <h2 className="text-sm font-semibold text-red-400">מחיקת חשבון</h2>
          <p className="text-xs text-muted-foreground mt-0.5">פעולה זו תמחק את החשבון לצמיתות</p>
        </div>
        <Button
          onClick={() => setShowDeleteAccount(true)}
          className="w-full bg-red-900/30 hover:bg-red-800/50 border border-red-700/40 text-red-400 font-bold h-12 rounded-xl transition-all"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          מחק חשבון
        </Button>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user: currentUser, isLoadingAuth } = useAuth();
  const [event, setEvent] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [pageError, setPageError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [qrFgColor, setQrFgColor] = useState("#000000");
  const [selectedModerationIds, setSelectedModerationIds] = useState(new Set());

  useEffect(() => {
    if (isLoadingAuth) return;
    window.scrollTo(0, 0);
    loadDashboardData();
  }, [isLoadingAuth, currentUser]);

  const loadDashboardData = async () => {
    setIsLoading(true);
    setPageError(null);
    const urlParams = new URLSearchParams(window.location.search);
    const eventId = urlParams.get('id');

    if (eventId === 'demo') {
      const demoEvent = {
        id: "demo",
        name: "החתונה של יוני ועדן",
        date: new Date().toISOString().split('T')[0],
        location: null,
        description: "חגיגה משפחתית מרגשת",
        is_active: true,
        unique_code: "demo123",
        event_type: "wedding",
        created_by: "demo@example.com"
      };

      setEvent(demoEvent);
      setPhotos([]);
      setIsAuthorized(true);
      setIsLoading(false);
      return;
    }

    if (!eventId) {
      console.error('Dashboard Error: No event ID provided');
      setPageError('NO_EVENT_ID');
      setIsLoading(false);
      return;
    }

    if (!currentUser) {
      setPageError('AUTH_REQUIRED');
      setIsAuthorized(false);
      setIsLoading(false);
      return;
    }

    try {
      const currentEvent = await memoriaService.events.get(eventId);

      if (currentEvent) {
        const isAdmin = currentUser.role === 'admin';
        const isEventCreator = currentEvent.created_by === currentUser.id;  // UUID comparison
        const isCoHost = Array.isArray(currentEvent.co_hosts) && currentEvent.co_hosts.includes(currentUser.email); // email (legacy)

        const hasAccess = isAdmin || isEventCreator || isCoHost;

        if (!hasAccess) {
          setIsAuthorized(false);
        } else {
          setIsAuthorized(true);
          setEvent(currentEvent);

          const allEventPhotos = await memoriaService.photos.getByEvent(currentEvent.id, {}, '-created_date');
          setPhotos(allEventPhotos);
        }
      } else {
        setPageError('EVENT_NOT_FOUND');
        setIsAuthorized(false);
      }

    } catch (error) {
      console.error('Dashboard Error:', error);
      setPageError('GENERIC_ERROR');
      setIsAuthorized(false);
    }
    setIsLoading(false);
  };

  const BASE_URL = import.meta.env.VITE_SITE_URL || window.location.origin;

  const handleCopyLink = () => {
    const eventUrl = `${BASE_URL}${createPageUrl(`Event?code=${event.unique_code}`)}&pin=${event.pin_code}`;
    navigator.clipboard.writeText(eventUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const generateQRCode = () => {
    if (!event) return '';
    const eventUrl = `${BASE_URL}${createPageUrl(`Event?code=${event.unique_code}`)}&pin=${event.pin_code}`;
    const fg = qrFgColor;
    const bg = qrFgColor === "#ffffff" ? "#000000" : "#ffffff";
    return `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(eventUrl)}&bgcolor=${bg.substring(1)}&color=${fg.substring(1)}&margin=10`;
  };

  const handleDownloadQR = () => {
    const qrUrl = generateQRCode();
    const link = document.createElement('a');
    link.href = qrUrl;
    link.download = `qr-${event.name}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDeleteEvent = async () => {
    if (!event || event.id === 'demo') return;
    
    if (window.confirm('האם אתה בטוח שברצונך למחוק את האירוע? פעולה זו אינה הפיכה.')) {
      try {
        await memoriaService.events.delete(event.id);
        navigate(createPageUrl("MyEvents"));
      } catch (error) {
        console.error("Error deleting event:", error);
        window.alert('שגיאה במחיקת האירוע. אנא נסה שוב.');
      }
    }
  };

  const toggleModerationPhoto = (photoId) => {
    setSelectedModerationIds(prev => {
      const next = new Set(prev);
      if (next.has(photoId)) next.delete(photoId);
      else next.add(photoId);
      return next;
    });
  };

  const handleBulkModerationAction = async (actionType) => {
    const ids = [...selectedModerationIds];
    if (!ids.length) return;

    // Optimistic UI
    if (actionType === 'approve') {
      setPhotos(prev => prev.map(p => ids.includes(p.id) ? { ...p, is_approved: true } : p));
    } else if (actionType === 'delete') {
      setPhotos(prev => prev.filter(p => !ids.includes(p.id)));
    }
    setSelectedModerationIds(new Set());

    // Chunked concurrent DB calls (max 50 per batch)
    const CHUNK = 50;
    try {
      for (let i = 0; i < ids.length; i += CHUNK) {
        const chunk = ids.slice(i, i + CHUNK);
        if (actionType === 'approve') {
          await Promise.all(chunk.map(id => memoriaService.photos.approve(id)));
        } else if (actionType === 'delete') {
          await Promise.all(chunk.map(id => memoriaService.photos.delete(id)));
        }
      }
    } catch (err) {
      console.error('[BulkModeration] Failed:', err.message);
    }
  };

  const isAdmin = currentUser?.role === 'admin';
  const isEventCreator = event && currentUser && event.created_by === currentUser.id;  // UUID comparison
  const canDelete = isAdmin || isEventCreator;

  // Real-time notifications for the host
  const { notifications, dismissNotification } = useRealtimeNotifications({
    eventId: event?.id,
    currentUserId: currentUser?.id,
    onNewPhoto: (photo) => {
      // Add the new photo to the moderation queue
      setPhotos(prev => [photo, ...prev]);
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cool-950">
        <Loader2 className="w-12 h-12 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (pageError) {
    if (pageError === 'NO_EVENT_ID') {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-cool-950 text-white text-center px-4" dir="rtl">
          <AlertTriangle className="w-16 h-16 text-yellow-400 mb-4" />
          <h1 className="text-3xl font-bold mb-2">לא צוין אירוע</h1>
          <p className="text-muted-foreground mb-6 max-w-md">כדי לנהל אירוע, יש לגשת לדף זה דרך "האירועים שלי".</p>
          <Button onClick={() => navigate(createPageUrl("MyEvents"))} className="bg-indigo-600 hover:bg-indigo-700 min-h-[44px]">
            חזרה לאירועים שלי
          </Button>
        </div>
      );
    }
    if (pageError === 'AUTH_REQUIRED') {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-cool-950 text-white text-center px-4" dir="rtl">
          <Lock className="w-16 h-16 text-yellow-400 mb-4" />
          <h1 className="text-3xl font-bold mb-2">נדרשת התחברות</h1>
          <p className="text-muted-foreground mb-6 max-w-md">יש להתחבר כדי לנהל אירוע.</p>
          <Button onClick={() => navigate(createPageUrl("Home"))} className="bg-indigo-600 hover:bg-indigo-700 min-h-[44px]">
            חזרה לדף הבית
          </Button>
        </div>
      );
    }
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-cool-950 text-white text-center px-4" dir="rtl">
        <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-3xl font-bold mb-2">אירוע לא נמצא</h1>
        <p className="text-muted-foreground mb-6">לא מצאנו אירוע התואם לקישור.</p>
        <Button onClick={() => navigate(createPageUrl("MyEvents"))} className="bg-indigo-600 hover:bg-indigo-700 min-h-[44px]">
          חזרה לאירועים שלי
        </Button>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-cool-950 text-white text-center px-4" dir="rtl">
        <Lock className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-3xl font-bold mb-2">אין לך הרשאת גישה</h1>
        <p className="text-muted-foreground mb-6">עמוד זה זמין רק למנהל האירוע או למנהל המערכת.</p>
        <Button onClick={() => navigate(createPageUrl("Home"))} className="bg-indigo-600 hover:bg-indigo-700 min-h-[44px]">
          חזרה לדף הבית
        </Button>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-cool-950 text-white text-center px-4" dir="rtl">
        <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-3xl font-bold mb-2">אירוע לא נמצא</h1>
        <p className="text-muted-foreground mb-6">לא מצאנו אירוע התואם לקישור.</p>
        <Button onClick={() => navigate(createPageUrl("MyEvents"))} className="bg-indigo-600 hover:bg-indigo-700 min-h-[44px]">
          חזרה לאירועים שלי
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] w-full bg-cool-950 text-white" dir="rtl">
      <RealtimeNotification notifications={notifications} onDismiss={dismissNotification} />

      {/* Admin inspection banner — shown only when admin views another host's event */}
      {isAdmin && event.created_by !== currentUser?.id && (
        <div className="flex items-center justify-between px-4 py-2.5 text-xs font-semibold"
          style={{ background: 'rgba(124,58,237,0.15)', borderBottom: '1px solid rgba(124,58,237,0.3)' }}>
          <button
            onClick={() => navigate('/admin/events/share')}
            className="flex items-center gap-1.5 text-violet-300 hover:text-violet-100 transition-colors"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            חזרה לניהול
          </button>
          <span className="text-violet-400">צופה בתור אדמין</span>
        </div>
      )}

      <div className="max-w-md mx-auto px-4 pt-6 pb-6">
          {/* Tabs */}
          <Tabs defaultValue="share" className="mb-4">
            <TabsList className="grid w-full grid-cols-5 bg-card rounded-xl p-1 h-auto">
              <TabsTrigger value="cohosts" className="flex flex-col h-auto py-2 text-muted-foreground data-[state=active]:bg-cool-950 data-[state=active]:text-white data-[state=active]:shadow-sm rounded-lg transition-all">
                <Users className="w-5 h-5 mb-1" />
                <span className="text-xs">צוות</span>
              </TabsTrigger>
              <TabsTrigger value="gallery" className="flex flex-col h-auto py-2 text-muted-foreground data-[state=active]:bg-cool-950 data-[state=active]:text-white data-[state=active]:shadow-sm rounded-lg transition-all">
                <Image className="w-5 h-5 mb-1" />
                <span className="text-xs">גלריה</span>
              </TabsTrigger>
              <TabsTrigger value="share" className="flex flex-col h-auto py-2 text-indigo-400 data-[state=active]:bg-cool-950 data-[state=active]:text-indigo-400 data-[state=active]:shadow-sm rounded-lg transition-all">
                <Share2 className="w-5 h-5 mb-1" />
                <span className="text-xs">שיתוף</span>
              </TabsTrigger>
              <TabsTrigger value="moderation" className="flex flex-col h-auto py-2 text-muted-foreground data-[state=active]:bg-cool-950 data-[state=active]:text-white data-[state=active]:shadow-sm rounded-lg transition-all">
                <ShieldCheck className="w-5 h-5 mb-1" />
                <span className="text-xs">ניהול</span>
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex flex-col h-auto py-2 text-muted-foreground data-[state=active]:bg-cool-950 data-[state=active]:text-white data-[state=active]:shadow-sm rounded-lg transition-all">
                <Settings className="w-5 h-5 mb-1" />
                <span className="text-xs">הגדרות</span>
              </TabsTrigger>
            </TabsList>

{/* Event Header */}
            <div className="text-center my-4">
              <h1 className="text-4xl font-black text-white tracking-tight" style={{ fontFamily: "'Impact', 'Arial Black', 'Helvetica', sans-serif", letterSpacing: '-0.02em' }}>{event.name}</h1>
            </div>

            {/* Share Tab Content */}
            <TabsContent value="share" className="space-y-4">
              
              {/* Share Link Section */}
              <div className="bg-card rounded-xl p-4">
                <h2 className="text-sm font-semibold text-foreground/80 mb-1 text-right">קישור</h2>
                <p className="text-xs text-muted-foreground mb-3 text-right">כל אחד עם הקישור יכול לפתוח את האירוע</p>
                
                <div className="bg-secondary rounded-lg p-3 mb-3">
                  <p className="text-xs text-muted-foreground break-all text-right">
                    {`${BASE_URL}${createPageUrl(`Event?code=${event.unique_code}`)}&pin=${event.pin_code}`}
                  </p>
                </div>
                
                <Button
                  onClick={handleCopyLink}
                  className="w-full bg-secondary hover:bg-secondary/80 text-white px-4 py-2 h-auto rounded-full text-sm font-medium transition-all"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  {copied ? "הועתק!" : "העתק קישור"}
                </Button>
              </div>

              {/* QR Code Section */}
              <div className="bg-card rounded-xl p-4">
                <div className="flex items-start gap-4 mb-4">
                  {/* Left - Color pickers */}
                  <div className="flex flex-col items-center gap-2 pt-1">
                    <Label className="text-xs text-muted-foreground">צבע</Label>
                    <button
                      onClick={() => setQrFgColor("#000000")}
                      className={`w-8 h-8 rounded-full border-2 ${qrFgColor === "#000000" ? "border-indigo-400 ring-2 ring-indigo-500/30" : "border-border"} flex items-center justify-center transition-all`}
                    >
                      <div className="w-5 h-5 rounded-full bg-black" />
                    </button>
                    <button
                      onClick={() => setQrFgColor("#ffffff")}
                      className={`w-8 h-8 rounded-full border-2 ${qrFgColor === "#ffffff" ? "border-indigo-400 ring-2 ring-indigo-500/30" : "border-border"} flex items-center justify-center transition-all`}
                    >
                      <div className="w-5 h-5 rounded-full bg-white" />
                    </button>
                  </div>

                  {/* Right - Title, description, QR code */}
                  <div className="flex-1 flex flex-col items-end gap-2">
                    <div className="text-right">
                      <h2 className="text-sm font-semibold text-foreground/80">קוד QR</h2>
                      <p className="text-xs text-muted-foreground mt-0.5">כל מי שסורק יכול לפתוח את האירוע</p>
                    </div>
                    <div className={`p-2 rounded-lg ${qrFgColor === "#ffffff" ? "bg-black" : "bg-white"}`}>
                      <img
                        src={generateQRCode()}
                        alt={`קוד QR עבור ${event.name}`}
                        className="w-28 h-28"
                      />
                    </div>
                  </div>
                </div>
                
                <Button 
                  onClick={handleDownloadQR}
                  className="w-full bg-secondary hover:bg-secondary/80 text-white font-semibold px-4 py-2.5 rounded-full text-sm transition-all"
                >
                  הורדה
                  <Download className="w-4 h-4 ml-2" />
                </Button>
              </div>

              {/* Printable Share Cards */}
              <PrintableShareCards event={event} generateQRCode={generateQRCode} />

              {/* Action Buttons */}
              <div className="flex flex-col gap-3 pt-2">
                <Link to={createPageUrl(`EventGallery?code=${event.unique_code}`)} className="w-full">
                  <Button className="w-full bg-secondary hover:bg-secondary/80 text-white font-semibold text-sm h-10 rounded-lg transition-all">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    צפייה בגלריה
                  </Button>
                </Link>

                {canDelete && (
                  <Button
                    onClick={handleDeleteEvent}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold text-sm h-10 rounded-lg transition-all"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    מחיקת אירוע
                  </Button>
                )}
              </div>
              </TabsContent>

            <TabsContent value="moderation">
              {(() => {
                const unapprovedPhotos = photos.filter(p => !p.is_approved && p.deletion_status !== 'requested');
                return (
                  <div className="space-y-4 mt-2">

                    {/* בקשות הסרה */}
                    <div className="bg-card rounded-xl p-4">
                      <div className="text-right mb-2">
                        <h2 className="text-sm font-semibold text-foreground/80">בקשות הסרת תמונות</h2>
                        <p className="text-xs text-muted-foreground mt-0.5">אורחים שביקשו להסיר תמונות מהגלריה</p>
                      </div>
                      <DeletionRequestsPanel eventId={event?.id} />
                    </div>

                    <div className="bg-card rounded-xl p-4">
                      <div className="text-right mb-4">
                        <h2 className="text-sm font-semibold text-foreground/80">ניהול תמונות</h2>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {unapprovedPhotos.length} תמונות ממתינות לאישור
                        </p>
                      </div>
                      {unapprovedPhotos.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 text-center">
                          <ShieldCheck className="w-12 h-12 text-green-500 mb-3" />
                          <p className="text-sm text-muted-foreground">אין תמונות הממתינות לאישור</p>
                        </div>
                      ) : (
                        <>
                          <p className="text-xs text-muted-foreground text-right mb-3">הקש על תמונות לבחירה, ולאחר מכן בחר פעולה</p>
                          <div className="grid grid-cols-3 gap-2">
                            {unapprovedPhotos.map((photo, index) => (
                              <PhotoCard
                                key={photo.id}
                                photo={photo}
                                index={index}
                                setSelectedIndex={() => {}}
                                isAdminView={false}
                                confirmDeleteId={null}
                                setConfirmDeleteId={() => {}}
                                deletingId={null}
                                handleAdminDelete={() => {}}
                                handleGuestDeletePhoto={() => {}}
                                handleRequestDeletion={() => {}}
                                currentUser={currentUser}
                                getDisplayUploaderName={() => ''}
                                isSelectionMode={true}
                                isSelected={selectedModerationIds.has(photo.id)}
                                onToggleSelect={toggleModerationPhoto}
                              />
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Bulk moderation sticky bar */}
              {selectedModerationIds.size > 0 && (
                <div
                  className="fixed bottom-0 left-0 w-full z-50 bg-background/95 backdrop-blur-md border-t border-white/10 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] animate-in slide-in-from-bottom duration-200"
                  dir="rtl"
                >
                  <div className="flex items-center justify-between max-w-lg mx-auto">
                    <span className="text-white/70 text-sm font-medium">{selectedModerationIds.size} נבחרו</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleBulkModerationAction('approve')}
                        className="flex items-center gap-1 px-3 py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold active:scale-95 transition-transform"
                      >
                        <Check className="w-4 h-4" />
                        אישור
                      </button>
                      <button
                        onClick={() => handleBulkModerationAction('delete')}
                        className="flex items-center gap-1 px-3 py-2 rounded-xl bg-red-600 text-white text-sm font-semibold active:scale-95 transition-transform"
                      >
                        <Trash2 className="w-4 h-4" />
                        מחיקה
                      </button>
                      <button
                        onClick={() => setSelectedModerationIds(new Set())}
                        className="p-2 rounded-xl bg-white/10 text-white/70 active:scale-95 transition-transform"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="settings">
              <EventSettingsTab event={event} onEventUpdate={(updated) => setEvent(updated)} />
            </TabsContent>

            <TabsContent value="gallery">
              {event && <EventGallery eventCode={event.unique_code} isAdminView={true} adminPhotos={photos.filter(p => p.is_approved)} onAdminPhotosChange={(updated) => setPhotos(prev => [...prev.filter(p => !p.is_approved), ...updated])} />}
            </TabsContent>

            <TabsContent value="cohosts">
              <div className="mt-2">
                <CoHostsManager event={event} onEventUpdate={(updated) => setEvent(updated)} />
              </div>
            </TabsContent>
          </Tabs>
        </div>
    </div>
  );
}