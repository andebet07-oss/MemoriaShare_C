import React, { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Camera, Upload, Sparkles, CheckCircle, ImageIcon, Users, EyeOff } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import useEventGallery from "@/hooks/useEventGallery";
import GalleryHeader from "@/components/gallery/GalleryHeader";
import PhotoGrid from "@/components/gallery/PhotoGrid";
import UploadManager from "@/components/gallery/UploadManager";
import PhotoViewer from "@/components/gallery/PhotoViewer";
import PullToRefresh from "@/components/PullToRefresh";
import RealtimeNotification from "@/components/notifications/RealtimeNotification";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabase";

const GUEST_NAME_KEY = 'ms_guest_name';

// ── Module-level gate ────────────────────────────────────────────────────────
// This variable lives OUTSIDE the React component tree and survives any
// re-mount triggered by AuthContext's onAuthStateChange firing after
// signInAnonymously() or updateUser(). Even if EventGallery is torn down and
// re-created by React's scheduler, this flag remains true and the new instance
// initialises showGuestBook=false immediately — no async required.
let _guestBookDismissed = false;

function EmptyState({ isAdminView, onUpload, disabled, title, subtitle }) {
  return (
    <div className="text-center py-24 sm:py-32 px-4">
      <Camera className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-6 text-gray-600" />
      <h3 className="text-2xl sm:text-3xl font-bold text-white mb-3">{title || "עדיין לא הועלו תמונות"}</h3>
      <p className="text-gray-400 text-base sm:text-lg mb-8 max-w-md mx-auto">{subtitle || "היו הראשונים להעלות תמונה מהאירוע!"}</p>
      {!isAdminView && onUpload && (
        <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
          <Button onClick={() => onUpload('camera')} disabled={disabled}
            className="bg-white text-black hover:bg-gray-100 font-bold px-8 py-4 rounded-2xl flex items-center justify-center gap-3 text-lg transition-all active:scale-95 shadow-xl">
            <Camera className="w-5 h-5" /> צלמו עכשיו
          </Button>
          <Button onClick={() => onUpload('gallery')} disabled={disabled} variant="outline"
            className="bg-white/10 text-white px-8 py-4 border-white/20 hover:bg-white/20 rounded-2xl font-bold flex items-center justify-center gap-3 text-lg transition-all active:scale-95 shadow-xl">
            <Upload className="w-5 h-5" /> העלו מהגלריה
          </Button>
        </div>
      )}
    </div>
  );
}

export default function EventGallery({ eventCode: propEventCode, isAdminView = false, adminPhotos, onAdminPhotosChange }) {
  const g = useEventGallery({ propEventCode, isAdminView, adminPhotos, onAdminPhotosChange });
  const { user: currentUser, isLoadingAuth } = useAuth();

  // Lazy initializer checks the module-level flag first, then localStorage.
  // On any re-mount (e.g. triggered by onAuthStateChange), if _guestBookDismissed
  // is already true the modal never flickers back open — no async needed.
  const [showGuestBook, setShowGuestBook] = useState(() => {
    if (isAdminView || _guestBookDismissed) return false;
    return !localStorage.getItem(GUEST_NAME_KEY);
  });
  const [guestName, setGuestName] = useState('');
  const [guestGreeting, setGuestGreeting] = useState('');
  const [isSavingGuest, setIsSavingGuest] = useState(false);
  const [guestSaveError, setGuestSaveError] = useState('');

  // Single close function: sets both the module-level gate and React state.
  const closeGuestBook = useCallback(() => {
    _guestBookDismissed = true;
    setIsSavingGuest(false);
    setShowGuestBook(false);
  }, []);

  // ── Anonymous sign-in on mount ─────────────────────────────────────────────
  const hasAttemptedAnonSignIn = useRef(false);
  useEffect(() => {
    if (isAdminView || hasAttemptedAnonSignIn.current) return;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session || hasAttemptedAnonSignIn.current) {
        hasAttemptedAnonSignIn.current = true;
        return;
      }
      hasAttemptedAnonSignIn.current = true;
      supabase.auth.signInAnonymously()
        .catch(err => console.error('[GuestAuth] Anonymous sign-in failed:', err));
    });
  }, [isAdminView]);

  // ── Fail-safe polling ──────────────────────────────────────────────────────
  // Runs every 500ms for the first 3 seconds after mount.
  // If GUEST_NAME_KEY appears in localStorage (written by this or a parallel
  // instance), the gate is force-closed even if React state was reset by a
  // concurrent auth event. This is the last line of defence.
  useEffect(() => {
    if (isAdminView) return;
    const iv = setInterval(() => {
      if (localStorage.getItem(GUEST_NAME_KEY)) {
        closeGuestBook();
      }
    }, 500);
    const t = setTimeout(() => clearInterval(iv), 3000);
    return () => { clearInterval(iv); clearTimeout(t); };
  }, [isAdminView, closeGuestBook]);

  // ── Identity restoration ───────────────────────────────────────────────────
  // When a returning anonymous guest has display_name in their auth metadata
  // (set during a previous visit) but ms_guest_name is missing from localStorage
  // (e.g., localStorage was cleared, different tab, or OS eviction), we restore
  // it from user_metadata so the guest book never shows again for this session.
  // This preserves the same auth.uid() → same My Photos + same quota.
  useEffect(() => {
    if (isAdminView || !currentUser?.isAnonymous) return;
    const storedName = localStorage.getItem(GUEST_NAME_KEY);
    if (storedName) return; // already set — nothing to restore

    const metaName =
      currentUser.user_metadata?.display_name ||
      currentUser.user_metadata?.full_name;
    if (!metaName) return; // first-time visitor — let the guest book show normally

    // Returning guest: sync metadata → localStorage and dismiss the modal
    localStorage.setItem(GUEST_NAME_KEY, metaName);
    const greeting = currentUser.user_metadata?.guest_greeting;
    if (greeting) localStorage.setItem('ms_guest_greeting', greeting);
    closeGuestBook();
  }, [currentUser?.id, isAdminView, closeGuestBook]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleGuestBookSubmit = async (/** @type {any} */ e) => {
    e.preventDefault();
    const name = guestName.trim();
    if (!name) return;

    setIsSavingGuest(true);
    setGuestSaveError('');

    try {
      // Ensure an active session exists before calling updateUser (prevents 403).
      let { data: { session }, error: sessionErr } = await supabase.auth.getSession();
      if (sessionErr) throw sessionErr;

      if (!session) {
        const { data: signInData, error: anonErr } = await supabase.auth.signInAnonymously();
        if (anonErr) throw anonErr;
        session = signInData.session;
      }

      const greetingTrimmed = guestGreeting.trim();

      // 1. Commit to localStorage — source of truth for the gate.
      localStorage.setItem(GUEST_NAME_KEY, name);
      if (greetingTrimmed) localStorage.setItem('ms_guest_greeting', greetingTrimmed);

      // 2. Close the modal synchronously via the module-level gate.
      //    This runs BEFORE updateUser so onAuthStateChange cannot race it.
      closeGuestBook();

      // 3. Background server sync — non-blocking for the UI.
      supabase.auth.updateUser({
        data: { full_name: name, display_name: name, guest_greeting: greetingTrimmed || null },
      }).catch(err => console.error('[GuestBook] Background sync failed:', err.message));

    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[GuestBook] Submit error:', msg);
      setGuestSaveError(msg || 'שגיאה ברישום לשרת. נסה שוב.');
      setIsSavingGuest(false);
    }
  };

  if (showGuestBook) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex items-center justify-center p-4 sm:p-6" dir="rtl"
        style={{ backdropFilter: 'blur(20px)' }}>
        <motion.div
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          className="w-full max-w-sm bg-[#111] border border-white/10 rounded-[28px] overflow-hidden shadow-2xl"
        >
          <div className="h-1 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
          <form onSubmit={handleGuestBookSubmit} dir="rtl" className="p-7 flex flex-col gap-5">
            <div className="text-center">
              <div className="text-3xl mb-2">📸</div>
              <h2 className="text-white text-xl font-black">{g.event?.name || "ברוכים הבאים!"}</h2>
              <p className="text-white/50 text-sm mt-1">שמחים שבאתם! רק שם וברכה קטנה ואנחנו מתחילים.</p>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-white/70 text-sm font-medium">השם שלך <span className="text-red-400">*</span></label>
              <input
                type="text"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="ישראל ישראלי"
                dir="rtl"
                autoFocus
                maxLength={40}
                autoComplete="name"
                enterKeyHint="next"
                className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-white text-right text-sm placeholder:text-white/30 focus:outline-none focus:border-indigo-500/60 transition-colors"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-white/70 text-sm font-medium">ברכה לזוג <span className="text-white/30">(אופציונלי)</span></label>
              <textarea
                value={guestGreeting}
                onChange={(e) => setGuestGreeting(e.target.value)}
                placeholder="מאחלים לכם אהבה אין סופית... ✨"
                rows={2}
                dir="rtl"
                maxLength={500}
                className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-white text-right text-sm placeholder:text-white/30 focus:outline-none focus:border-indigo-500/60 transition-colors resize-none"
              />
            </div>
            {guestSaveError && (
              <p className="text-red-400 text-xs text-center -mb-1">{guestSaveError}</p>
            )}
            <button
              type="submit"
              disabled={isSavingGuest || !guestName.trim()}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold py-3.5 rounded-2xl transition-colors flex items-center justify-center gap-2 text-base active:scale-95"
            >
              {isSavingGuest
                ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />שומר...</>
                : 'בואו נצלם! 🎉'
              }
            </button>
            <p className="text-center text-white/20 text-xs mt-1">Powered by MemoriaShare</p>
          </form>
        </motion.div>
      </div>
    );
  }

  if (g.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-600 border-t-transparent mx-auto mb-4" />
          <p className="text-gray-300 font-medium">טוען גלריה...</p>
        </div>
      </div>
    );
  }

  if (g.pageError === 'LOAD_ERROR') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black text-center px-4" dir="rtl">
        <div className="text-5xl mb-4">⚠️</div>
        <h1 className="text-2xl font-bold text-white mb-2">שגיאה בטעינת הגלריה</h1>
        <p className="text-gray-400 mb-6">{"לא ניתן היה לטעון את נתוני האירוע.\nאנא בדוק את החיבור לאינטרנט ונסה שוב."}</p>
        <Button onClick={() => { g.loadEventAndPhotos(); }} className="bg-indigo-600 hover:bg-indigo-700 text-white min-h-[44px]">נסה שוב</Button>
      </div>
    );
  }

  if (!g.event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">אירוע לא נמצא</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0f0f] via-[#1a1a1a] to-[#0f0f0f] text-white" dir="rtl">

      {!isAdminView && g.liveNotification && (
        <RealtimeNotification
          notifications={[g.liveNotification]}
          onDismiss={() => g.setLiveNotification(null)}
        />
      )}

      <input type="file" accept="image/*" ref={g.fileInputRef} onChange={g.handleFileChange} multiple className="hidden" />

      <AnimatePresence>
        {g.uploadSuccess && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-6"
            style={{ backdropFilter: 'blur(8px)', backgroundColor: 'rgba(0,0,0,0.6)' }}
            onClick={() => g.setUploadSuccess(false)}
          >
            <motion.div
              initial={{ scale: 0.8, y: 40, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.85, y: 20, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 320, damping: 26 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-sm bg-[#111111] border border-white/10 rounded-[32px] overflow-hidden shadow-[0_32px_80px_rgba(0,0,0,0.9)]"
            >
              <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, #25D366, #128C7E, #25D366)' }} />
              <div className="p-7 flex flex-col items-center gap-5 text-center">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: 'radial-gradient(circle, rgba(37,211,102,0.18) 0%, rgba(37,211,102,0.04) 100%)' }}>
                    <CheckCircle className="w-10 h-10 text-[#25D366]" strokeWidth={1.5} />
                  </div>
                  <div className="absolute inset-0 rounded-full animate-ping" style={{ background: 'rgba(37,211,102,0.08)', animationDuration: '2s' }} />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-2xl font-black text-white tracking-tight">הועלו בהצלחה!</h3>
                  <p className="text-gray-400 text-sm">כל התמונות עלו לאלבום</p>
                </div>
                <button onClick={() => g.setUploadSuccess(false)}
                  className="px-8 py-3 rounded-2xl text-sm font-bold text-white/70 hover:text-white hover:bg-white/5 border border-white/5">
                  חזרה לגלריה
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <GalleryHeader
        event={g.event}
        photosCount={g.photos.length}
        participantsCount={new Set(g.photos.map(p => p.created_by).filter(Boolean)).size}
        isOwner={g.isOwner}
        navigate={g.navigate}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="py-5 text-center">
          <p className="text-zinc-400 text-sm">
            {g.userUploadedCount}/{g.eventMaxPhotos} תמונות • {localStorage.getItem('ms_guest_name') || g.currentUser?.user_metadata?.display_name || g.currentUser?.full_name || "אורח"}
          </p>
          {g.isQuotaExhausted && (
            <p className="mt-1.5 text-amber-500 font-medium text-base flex items-center justify-center gap-1.5">
              <Sparkles className="w-4 h-4 shrink-0" />
              איזה רגעים יפים! הגעת למכסה המקסימלית
            </p>
          )}
        </div>

        {!g.isQuotaExhausted && !isAdminView && (
          <div className="py-2 -mx-4 sm:-mx-6">
            <div className="flex gap-3 sm:gap-4 justify-center px-4">
              <Button onClick={() => g.handleUploadClick('camera')} disabled={g.isUploadingBatch}
                className="bg-gradient-to-r from-white/15 to-white/10 hover:from-white/25 hover:to-white/20 text-white border border-white/20 rounded-2xl flex items-center gap-2 px-6 sm:px-8 py-4 font-semibold text-base sm:text-lg transition-all active:scale-95 shadow-lg">
                <Camera className="w-5 h-5" /> צלמו עכשיו
              </Button>
              <Button onClick={() => g.handleUploadClick('gallery')} disabled={g.isUploadingBatch}
                className="bg-gradient-to-r from-white/15 to-white/10 hover:from-white/25 hover:to-white/20 text-white border border-white/20 rounded-2xl flex items-center gap-2 px-6 sm:px-8 py-4 font-semibold text-base sm:text-lg transition-all active:scale-95 shadow-lg">
                <Upload className="w-5 h-5" /> העלו מהגלריה
              </Button>
            </div>
          </div>
        )}

        <UploadManager
          pendingPhotos={g.pendingPhotos} isUploadingBatch={g.isUploadingBatch}
          uploadProgress={g.uploadProgress} isPreparingFiles={g.isPreparingFiles}
          processingFilterId={g.processingFilterId} setSelectedPendingIndex={g.setSelectedPendingIndex}
          removeFromPendingPhotos={g.removeFromPendingPhotos} clearAllPendingPhotos={g.clearAllPendingPhotos}
          changePhotoFilter={g.changePhotoFilter} uploadAllPendingPhotos={g.uploadAllPendingPhotos}
          handleUploadClick={g.handleUploadClick} showCamera={g.showCamera} setShowCamera={g.setShowCamera}
          handleCameraCapture={g.handleCameraCapture} handleFinalUploadFromCamera={g.handleFinalUploadFromCamera}
          cameraMaxPhotos={g.cameraMaxPhotos} eventName={g.event.name}
          eventDate={g.getCameraFormattedDate(g.event.date)}
        />

        <div className="pb-8 mt-6">
          <PullToRefresh onRefresh={g.loadEventAndPhotos} disabled={isAdminView}>
            {isAdminView || g.isOwner ? (
              g.displayedPhotos.length > 0 ? (
                <PhotoGrid displayedPhotos={g.displayedPhotos} setSelectedIndex={g.setSelectedIndex}
                  isAdminView={isAdminView} confirmDeleteId={g.confirmDeleteId} setConfirmDeleteId={g.setConfirmDeleteId}
                  deletingId={g.deletingId} handleAdminDelete={g.handleAdminDelete}
                  handleGuestDeletePhoto={g.handleGuestDeletePhoto} handleRequestDeletion={g.handleRequestDeletion}
                  currentUser={g.currentUser} getDisplayUploaderName={g.getDisplayUploaderName}
                  hasMore={g.hasMore} isFetchingMore={g.isFetchingMore} fetchNextPage={g.fetchNextPage} />
              ) : (
                <EmptyState isAdminView={isAdminView} onUpload={g.handleUploadClick} disabled={g.isUploadingBatch} />
              )
            ) : !g.event.auto_publish_guest_photos ? (
              /* Public gallery is OFF — guests see only their own photos */
              <>
                <div className="flex items-center justify-center gap-2 mb-5 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white/50 text-sm">
                  <EyeOff className="w-4 h-4 shrink-0" />
                  <span>הגלריה הציבורית מושבתת. תוכל לראות רק את התמונות שלך.</span>
                </div>
                {g.myPhotos.length > 0 ? (
                  <PhotoGrid displayedPhotos={g.myPhotos} setSelectedIndex={g.setSelectedIndex}
                    isAdminView={false} confirmDeleteId={g.confirmDeleteId} setConfirmDeleteId={g.setConfirmDeleteId}
                    deletingId={g.deletingId} handleAdminDelete={g.handleAdminDelete}
                    handleGuestDeletePhoto={g.handleGuestDeletePhoto} handleRequestDeletion={g.handleRequestDeletion}
                    currentUser={g.currentUser} getDisplayUploaderName={g.getDisplayUploaderName}
                    hasMore={false} isFetchingMore={false} fetchNextPage={undefined} />
                ) : (
                  <EmptyState isAdminView={false} onUpload={g.handleUploadClick} disabled={g.isUploadingBatch}
                    title="עדיין לא העלית תמונות" subtitle="צלמו או העלו תמונות מהאירוע — הן יופיעו כאן" />
                )}
              </>
            ) : (
              <Tabs value={g.activeTab} onValueChange={g.setActiveTab} dir="rtl">
                <TabsList className="w-full bg-white/5 border border-white/10 rounded-2xl p-1 mb-6" aria-label="תצוגת גלריה">
                  <TabsTrigger value="my-photos" aria-label="התמונות שלי"
                    className="flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all data-[state=active]:bg-white/10 data-[state=active]:text-white data-[state=inactive]:text-zinc-500">
                    <ImageIcon className="w-4 h-4 ml-1.5 inline-block" />
                    התמונות שלי
                    {g.myPhotos.length > 0 && <span className="mr-1.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold bg-white/20 text-white">{g.myPhotos.length}</span>}
                  </TabsTrigger>
                  <TabsTrigger value="shared" aria-label="גלריה משותפת"
                    className="flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all data-[state=active]:bg-white/10 data-[state=active]:text-white data-[state=inactive]:text-zinc-500">
                    <Users className="w-4 h-4 ml-1.5 inline-block" />
                    גלריה משותפת
                    {g.sharedPhotos.length > 0 && <span className="mr-1.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold bg-white/20 text-white">{g.sharedPhotos.length}</span>}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="my-photos">
                  {g.myPhotos.length > 0 ? (
                    <PhotoGrid displayedPhotos={g.myPhotos} setSelectedIndex={g.setSelectedIndex}
                      isAdminView={false} confirmDeleteId={g.confirmDeleteId} setConfirmDeleteId={g.setConfirmDeleteId}
                      deletingId={g.deletingId} handleAdminDelete={g.handleAdminDelete}
                      handleGuestDeletePhoto={g.handleGuestDeletePhoto} handleRequestDeletion={g.handleRequestDeletion}
                      currentUser={g.currentUser} getDisplayUploaderName={g.getDisplayUploaderName}
                      hasMore={false} isFetchingMore={false} fetchNextPage={undefined} />
                  ) : (
                    <EmptyState isAdminView={false} onUpload={g.handleUploadClick} disabled={g.isUploadingBatch}
                      title="עדיין לא העלית תמונות" subtitle="צלמו או העלו תמונות מהאירוע — הן יופיעו כאן" />
                  )}
                </TabsContent>

                <TabsContent value="shared">
                  {g.sharedPhotos.length > 0 ? (
                    <PhotoGrid displayedPhotos={g.sharedPhotos} setSelectedIndex={g.setSelectedIndex}
                      isAdminView={false} confirmDeleteId={g.confirmDeleteId} setConfirmDeleteId={g.setConfirmDeleteId}
                      deletingId={g.deletingId} handleAdminDelete={g.handleAdminDelete}
                      handleGuestDeletePhoto={g.handleGuestDeletePhoto} handleRequestDeletion={g.handleRequestDeletion}
                      currentUser={g.currentUser} getDisplayUploaderName={g.getDisplayUploaderName}
                      hasMore={g.sharedHasMore} isFetchingMore={g.isFetchingMore} fetchNextPage={g.fetchNextPage} />
                  ) : (
                    <div className="text-center py-24 sm:py-32 px-4">
                      <Users className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-6 text-gray-600" />
                      <h3 className="text-2xl sm:text-3xl font-bold text-white mb-3">עדיין אין תמונות בגלריה הציבורית</h3>
                      <p className="text-gray-400 text-base sm:text-lg max-w-md mx-auto">תמונות שיאושרו על ידי מנהל האירוע יופיעו כאן</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            )}
          </PullToRefresh>
        </div>
      </div>

      <PhotoViewer
        selectedIndex={g.selectedIndex} setSelectedIndex={g.setSelectedIndex}
        displayedPhotos={g.displayedPhotos} selectedPhoto={g.selectedPhoto}
        handlePrevPhoto={g.handlePrevPhoto} handleNextPhoto={g.handleNextPhoto}
        handleTouchStart={g.handleTouchStart} handleTouchMove={g.handleTouchMove} handleTouchEnd={g.handleTouchEnd}
        isAdminView={isAdminView} deletingId={g.deletingId}
        handleDeleteFromFullScreen={g.handleDeleteFromFullScreen}
        getDisplayUploaderName={g.getDisplayUploaderName}
        isProcessingAction={g.isProcessingAction} sharePhoto={g.sharePhoto}
        handleDownloadPhoto={g.handleDownloadPhoto}
        selectedPendingIndex={g.selectedPendingIndex} setSelectedPendingIndex={g.setSelectedPendingIndex}
        pendingPhotos={g.pendingPhotos} changePhotoFilter={g.changePhotoFilter}
        processingFilterId={g.processingFilterId} currentUser={g.currentUser}
        handleGuestDeletePhoto={g.handleGuestDeletePhoto} handleRequestDeletion={g.handleRequestDeletion}
      />

      {!isAdminView && !g.isQuotaExhausted && !g.showCamera && g.pendingPhotos.length === 0 && g.selectedIndex === null && (
        <div className={`fixed left-1/2 -translate-x-1/2 z-40 transition-all duration-500 ${g.showFAB ? 'translate-y-0 opacity-100' : 'translate-y-24 opacity-0 pointer-events-none'}`}
          style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 2rem)' }}>
          <div className="bg-black/70 backdrop-blur-xl border border-white/20 p-1.5 rounded-[24px] flex items-center gap-1.5 shadow-[0_20px_40px_rgba(0,0,0,0.8)]">
            <Button onClick={() => g.handleUploadClick('camera')} disabled={g.isUploadingBatch}
              className="bg-white text-black hover:bg-gray-200 rounded-[20px] px-6 py-3 h-auto text-sm font-bold flex items-center gap-2 active:scale-95 transition-all shadow-lg">
              <Camera className="w-5 h-5" /> צילום
            </Button>
            <Button onClick={() => g.handleUploadClick('gallery')} disabled={g.isUploadingBatch} variant="ghost"
              className="text-white hover:bg-white/10 rounded-[20px] px-5 py-3 h-auto text-sm font-bold flex items-center gap-2 active:scale-95 transition-all">
              <Upload className="w-5 h-5" /> גלריה
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
