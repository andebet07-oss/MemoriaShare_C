import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Camera, Upload, Sparkles, CheckCircle, ImageIcon, Users, Loader2 } from "lucide-react";
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
  const { isLoadingAuth } = useAuth();

  // ─── Guest Anonymous Auth + Guest Book ────────────────────────────────────
  const [showGuestBook, setShowGuestBook] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [guestGreeting, setGuestGreeting] = useState('');
  const [isSavingGuest, setIsSavingGuest] = useState(false);
  // Ref (not state) to prevent the effect from re-firing after the async sign-in completes
  const hasAttemptedAnonSignIn = useRef(false);

  useEffect(() => {
    if (isAdminView || isLoadingAuth) return;
    if (!g.currentUser) {
      if (hasAttemptedAnonSignIn.current) return; // already fired — wait for onAuthStateChange
      hasAttemptedAnonSignIn.current = true;
      supabase.auth.signInAnonymously()
        .catch(err => console.error('Anonymous sign-in failed:', err));
    } else if (g.currentUser.isAnonymous && !localStorage.getItem(GUEST_NAME_KEY)) {
      // Anonymous user who hasn't filled in their name yet — show Guest Book
      setShowGuestBook(true);
    }
  }, [isAdminView, isLoadingAuth, g.currentUser]);

  const handleGuestBookSubmit = async (e) => {
    e.preventDefault();
    if (!guestName.trim()) return;
    setIsSavingGuest(true);
    try {
      localStorage.setItem(GUEST_NAME_KEY, guestName.trim());
      // Update anonymous user metadata so currentUser.full_name is populated
      await supabase.auth.updateUser({ data: { full_name: guestName.trim(), guest_greeting: guestGreeting.trim() || null } });
      setShowGuestBook(false);
    } catch (err) {
      console.error('Guest Book save failed:', err);
    } finally {
      setIsSavingGuest(false);
    }
  };

  // ─── Loading / Error / Not Found states ───────────────────────────────────
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
        <p className="text-gray-400 mb-6">לא ניתן היה לטעון את נתוני האירוע. אנא בדוק את החיבור לאינטרנט ונסה שוב.</p>
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

      {/* Real-time notifications for guests */}
      {!isAdminView && g.liveNotification && (
        <RealtimeNotification
          notifications={[g.liveNotification]}
          onDismiss={() => g.setLiveNotification(null)}
        />
      )}

      {/* Hidden file input */}
      <input type="file" accept="image/*" ref={g.fileInputRef} onChange={g.handleFileChange} multiple className="hidden" />

      {/* ── Upload success modal ── */}
      <AnimatePresence>
        {g.uploadSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-6"
            style={{ backdropFilter: 'blur(8px)', backgroundColor: 'rgba(0,0,0,0.6)' }}
            onClick={() => g.setUploadSuccess(false)}
          >
            <motion.div
              initial={{ scale: 0.8, y: 40, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
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
                  <h3 className="text-2xl font-black text-white tracking-tight">הועלו בהצלחה! 🎉</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">התמונות שלכם כבר באלבום.<br />שתפו עם החברים שלכם!</p>
                </div>
                {(() => {
                  const galleryUrl = window.location.href;
                  const msg = `היי! תראו את התמונות שצילמנו ב${g.event?.name || "האירוע"} 📸\n${galleryUrl}`;
                  const waLink = `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
                  return (
                    <a href={waLink} target="_blank" rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-bold text-white text-base transition-all active:scale-95 shadow-xl"
                      style={{ background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)', boxShadow: '0 8px 24px rgba(37,211,102,0.3)' }}
                    >
                      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white shrink-0">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                        <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.533 5.858L.057 23.59a.75.75 0 0 0 .91.91l5.732-1.476A11.944 11.944 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.725 9.725 0 0 1-4.952-1.352l-.355-.211-3.682.947.967-3.573-.232-.368A9.718 9.718 0 0 1 2.25 12C2.25 6.615 6.615 2.25 12 2.25S21.75 6.615 21.75 12 17.385 21.75 12 21.75z"/>
                      </svg>
                      שתפו עם חברים
                    </a>
                  );
                })()}
                <button onClick={() => g.setUploadSuccess(false)}
                  className="w-full py-3.5 rounded-2xl font-semibold text-gray-400 text-sm transition-all active:scale-95 hover:text-white hover:bg-white/5 border border-white/5">
                  חזרה לגלריה
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Header ── */}
      <GalleryHeader
        event={g.event}
        photosCount={g.photos.length}
        participantsCount={new Set(g.photos.map(p => p.created_by).filter(Boolean)).size}
        isOwner={g.isOwner}
        navigate={g.navigate}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6">

        {/* Status bar */}
        <div className="py-5 text-center">
          <p className="text-zinc-400 text-sm">
            {g.userUploadedCount}/{g.eventMaxPhotos} תמונות • {g.currentUser?.full_name || g.currentUser?.email || "אורח"}
          </p>
          {g.isQuotaExhausted && (
            <p className="mt-1.5 text-amber-500 font-medium text-base flex items-center justify-center gap-1.5">
              <Sparkles className="w-4 h-4 shrink-0" />
              איזה רגעים יפים! כל התמונות עלו לאלבום
            </p>
          )}
        </div>

        {/* Upload buttons */}
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

        {/* ── Upload manager (pending, camera, modals) ── */}
        <UploadManager
          pendingPhotos={g.pendingPhotos}
          isUploadingBatch={g.isUploadingBatch}
          uploadProgress={g.uploadProgress}
          isPreparingFiles={g.isPreparingFiles}
          processingFilterId={g.processingFilterId}
          setSelectedPendingIndex={g.setSelectedPendingIndex}
          removeFromPendingPhotos={g.removeFromPendingPhotos}
          clearAllPendingPhotos={g.clearAllPendingPhotos}
          changePhotoFilter={g.changePhotoFilter}
          uploadAllPendingPhotos={g.uploadAllPendingPhotos}
          handleUploadClick={g.handleUploadClick}
          showCamera={g.showCamera}
          setShowCamera={g.setShowCamera}
          handleCameraCapture={g.handleCameraCapture}
          handleFinalUploadFromCamera={g.handleFinalUploadFromCamera}
          cameraMaxPhotos={g.cameraMaxPhotos}
          eventName={g.event.name}
          eventDate={g.getCameraFormattedDate(g.event.date)}
        />

        {/* ── Tabbed photo grid (guests) / flat grid (admin/owner) ── */}
        <div className="pb-8 mt-6">
          <PullToRefresh onRefresh={g.loadEventAndPhotos} disabled={isAdminView}>
            {isAdminView || g.isOwner ? (
              /* Admin / Owner: flat grid — no tabs needed */
              g.displayedPhotos.length > 0 ? (
                <PhotoGrid
                  displayedPhotos={g.displayedPhotos}
                  setSelectedIndex={g.setSelectedIndex}
                  isAdminView={isAdminView}
                  confirmDeleteId={g.confirmDeleteId}
                  setConfirmDeleteId={g.setConfirmDeleteId}
                  deletingId={g.deletingId}
                  handleAdminDelete={g.handleAdminDelete}
                  handleGuestDeletePhoto={g.handleGuestDeletePhoto}
                  handleRequestDeletion={g.handleRequestDeletion}
                  currentUser={g.currentUser}
                  getDisplayUploaderName={g.getDisplayUploaderName}
                  hasMore={g.hasMore}
                  isFetchingMore={g.isFetchingMore}
                  fetchNextPage={g.fetchNextPage}
                />
              ) : (
                <EmptyState isAdminView={isAdminView} onUpload={g.handleUploadClick} disabled={g.isUploadingBatch} />
              )
            ) : (
              /* Guest: tabbed gallery */
              <Tabs value={g.activeTab} onValueChange={g.setActiveTab} dir="rtl">
                <TabsList className="w-full bg-white/5 border border-white/10 rounded-2xl p-1 mb-6" aria-label="תצוגת גלריה">
                  <TabsTrigger
                    value="my-photos"
                    aria-label="התמונות שלי"
                    className="flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all data-[state=active]:bg-white/10 data-[state=active]:text-white data-[state=inactive]:text-zinc-500"
                  >
                    <ImageIcon className="w-4 h-4 ml-1.5 inline-block" />
                    התמונות שלי
                    {g.myPhotos.length > 0 && (
                      <span className="mr-1.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold bg-white/20 text-white">
                        {g.myPhotos.length}
                      </span>
                    )}
                  </TabsTrigger>
                  <TabsTrigger
                    value="shared"
                    aria-label="גלריה משותפת"
                    className="flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all data-[state=active]:bg-white/10 data-[state=active]:text-white data-[state=inactive]:text-zinc-500"
                  >
                    <Users className="w-4 h-4 ml-1.5 inline-block" />
                    גלריה משותפת
                    {g.sharedPhotos.length > 0 && (
                      <span className="mr-1.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold bg-white/20 text-white">
                        {g.sharedPhotos.length}
                      </span>
                    )}
                  </TabsTrigger>
                </TabsList>

                {/* ── My Photos tab ── */}
                <TabsContent value="my-photos">
                  {g.myPhotos.length > 0 ? (
                    <PhotoGrid
                      displayedPhotos={g.myPhotos}
                      setSelectedIndex={g.setSelectedIndex}
                      isAdminView={false}
                      confirmDeleteId={g.confirmDeleteId}
                      setConfirmDeleteId={g.setConfirmDeleteId}
                      deletingId={g.deletingId}
                      handleAdminDelete={g.handleAdminDelete}
                      handleGuestDeletePhoto={g.handleGuestDeletePhoto}
                      handleRequestDeletion={g.handleRequestDeletion}
                      currentUser={g.currentUser}
                      getDisplayUploaderName={g.getDisplayUploaderName}
                      hasMore={false}
                      isFetchingMore={false}
                      fetchNextPage={undefined}
                    />
                  ) : (
                    <EmptyState isAdminView={false} onUpload={g.handleUploadClick} disabled={g.isUploadingBatch}
                      title="עדיין לא העלית תמונות"
                      subtitle="צלמו או העלו תמונות מהאירוע — הן יופיעו כאן"
                    />
                  )}
                </TabsContent>

                {/* ── Shared Gallery tab ── */}
                <TabsContent value="shared">
                  {g.sharedPhotos.length > 0 ? (
                    <PhotoGrid
                      displayedPhotos={g.sharedPhotos}
                      setSelectedIndex={g.setSelectedIndex}
                      isAdminView={false}
                      confirmDeleteId={g.confirmDeleteId}
                      setConfirmDeleteId={g.setConfirmDeleteId}
                      deletingId={g.deletingId}
                      handleAdminDelete={g.handleAdminDelete}
                      handleGuestDeletePhoto={g.handleGuestDeletePhoto}
                      handleRequestDeletion={g.handleRequestDeletion}
                      currentUser={g.currentUser}
                      getDisplayUploaderName={g.getDisplayUploaderName}
                      hasMore={g.sharedHasMore}
                      isFetchingMore={g.isFetchingMore}
                      fetchNextPage={g.fetchNextPage}
                    />
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

      {/* ── Photo viewers (dialogs) ── */}
      <PhotoViewer
        selectedIndex={g.selectedIndex}
        setSelectedIndex={g.setSelectedIndex}
        displayedPhotos={g.displayedPhotos}
        selectedPhoto={g.selectedPhoto}
        handlePrevPhoto={g.handlePrevPhoto}
        handleNextPhoto={g.handleNextPhoto}
        handleTouchStart={g.handleTouchStart}
        handleTouchMove={g.handleTouchMove}
        handleTouchEnd={g.handleTouchEnd}
        isAdminView={isAdminView}
        deletingId={g.deletingId}
        handleDeleteFromFullScreen={g.handleDeleteFromFullScreen}
        getDisplayUploaderName={g.getDisplayUploaderName}
        isProcessingAction={g.isProcessingAction}
        sharePhoto={g.sharePhoto}
        handleDownloadPhoto={g.handleDownloadPhoto}
        selectedPendingIndex={g.selectedPendingIndex}
        setSelectedPendingIndex={g.setSelectedPendingIndex}
        pendingPhotos={g.pendingPhotos}
        changePhotoFilter={g.changePhotoFilter}
        processingFilterId={g.processingFilterId}
        currentUser={g.currentUser}
        handleGuestDeletePhoto={g.handleGuestDeletePhoto}
        handleRequestDeletion={g.handleRequestDeletion}
      />

      {/* ── Guest Book Modal ── */}
      <AnimatePresence>
        {showGuestBook && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center p-4 sm:p-6"
            style={{ backdropFilter: 'blur(12px)', backgroundColor: 'rgba(0,0,0,0.75)' }}
          >
            <motion.div
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              className="w-full max-w-sm bg-[#111] border border-white/10 rounded-[28px] overflow-hidden shadow-2xl"
            >
              <div className="h-1 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
              <form onSubmit={handleGuestBookSubmit} dir="rtl" className="p-7 flex flex-col gap-5">
                <div className="text-center">
                  <div className="text-3xl mb-2">📸</div>
                  <h2 className="text-white text-xl font-black">ברוכים הבאים!</h2>
                  <p className="text-white/50 text-sm mt-1">ספרו לנו קצת עליכם לפני שתעלו תמונות</p>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-white/70 text-sm font-medium">השם שלך <span className="text-red-400">*</span></label>
                  <input
                    type="text"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="ישראל ישראלי"
                    autoFocus
                    className="w-full bg-white/8 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-indigo-500/60 transition-colors text-sm"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-white/70 text-sm font-medium">ברכה לזוג <span className="text-white/30">(אופציונלי)</span></label>
                  <textarea
                    value={guestGreeting}
                    onChange={(e) => setGuestGreeting(e.target.value)}
                    placeholder="מאחלים לכם אהבה אין סופית... ✨"
                    rows={2}
                    className="w-full bg-white/8 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-indigo-500/60 transition-colors text-sm resize-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSavingGuest || !guestName.trim()}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold py-3.5 rounded-2xl transition-colors flex items-center justify-center gap-2 text-base"
                >
                  {isSavingGuest ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {isSavingGuest ? "שומר..." : "בואו נצלם! 🎉"}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── FAB ── */}
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