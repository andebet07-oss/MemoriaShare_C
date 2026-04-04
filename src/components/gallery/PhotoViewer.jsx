import React, { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Share2, Upload, Trash2, Loader2, User, EyeOff } from "lucide-react";

const DIRECT_DELETE_WINDOW_MINUTES = 15;

export default function PhotoViewer({
  // Uploaded photos viewer
  selectedIndex, setSelectedIndex, displayedPhotos, selectedPhoto,
  handlePrevPhoto, handleNextPhoto,
  handleTouchStart, handleTouchMove, handleTouchEnd,
  isAdminView, deletingId, handleDeleteFromFullScreen,
  getDisplayUploaderName, isProcessingAction, sharePhoto, handleDownloadPhoto,
  currentUser, handleGuestDeletePhoto, handleRequestDeletion,
  // Pending photos viewer
  selectedPendingIndex, setSelectedPendingIndex, pendingPhotos,
  changePhotoFilter, processingFilterId,
}) {
  const [guestConfirmDelete, setGuestConfirmDelete] = useState(false);
  const [requestingDeletion, setRequestingDeletion] = useState(false);

  const isOwnPhoto = !isAdminView && selectedPhoto && selectedPhoto.created_by === currentUser?.id;  // UUID comparison
  const uploadedAt = selectedPhoto?.created_date ? new Date(selectedPhoto.created_date) : null;
  const minutesAgo = uploadedAt ? (Date.now() - uploadedAt.getTime()) / 60000 : Infinity;
  const canDirectDelete = isOwnPhoto && !selectedPhoto?.is_approved && minutesAgo <= DIRECT_DELETE_WINDOW_MINUTES;
  const canRequestDeletion = isOwnPhoto && !canDirectDelete && selectedPhoto?.deletion_status === 'none';
  const isPendingDeletion = selectedPhoto?.deletion_status === 'requested';
  return (
    <>
      {/* ── Pending photos full-screen dialog ── */}
      <Dialog open={selectedPendingIndex !== null} onOpenChange={(open) => { if (!open) setSelectedPendingIndex(null); }}>
        <DialogContent className="max-w-4xl w-[92vw] h-[82vh] rounded-[32px] md:h-[90vh] md:w-[95vw] bg-black/95 border-none p-0 overflow-hidden backdrop-blur-xl">
          <div className="relative w-full h-full flex items-center justify-center">
            {selectedPendingIndex !== null && pendingPhotos[selectedPendingIndex] && (
              <>
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-black/40 backdrop-blur-md border border-white/10 rounded-full px-3 py-1.5">
                  <span className="text-xs text-white/70">{selectedPendingIndex + 1} / {pendingPhotos.length} • ממתינה להעלאה</span>
                </div>
                {selectedPendingIndex < pendingPhotos.length - 1 && (
                  <button onClick={() => setSelectedPendingIndex(i => i + 1)} className="absolute left-4 z-40 text-white bg-black/50 backdrop-blur-md p-3 rounded-full border border-white/10 active:scale-90 hidden sm:flex">
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                )}
                {selectedPendingIndex > 0 && (
                  <button onClick={() => setSelectedPendingIndex(i => i - 1)} className="absolute right-4 z-40 text-white bg-black/50 backdrop-blur-md p-3 rounded-full border border-white/10 active:scale-90 hidden sm:flex">
                    <ChevronRight className="w-6 h-6" />
                  </button>
                )}
                <img src={pendingPhotos[selectedPendingIndex].previewUrl} alt="תצוגה מקדימה" className="max-w-full max-h-full object-contain pointer-events-none select-none" />
                <div className="absolute bottom-8 left-4 right-4 flex justify-center gap-2 z-50">
                  {[{ id: 'none', label: 'רגיל' }, { id: 'vintage', label: '🎞 וינטג׳' }, { id: 'black_white', label: 'B&W' }].map(f => {
                    const current = pendingPhotos[selectedPendingIndex];
                    const isProc = processingFilterId === current.id;
                    return (
                      <button key={f.id} disabled={isProc} onClick={() => changePhotoFilter(current.id, f.id)}
                        className={`px-4 py-2 rounded-full text-sm font-bold transition-all active:scale-95 ${current.filter === f.id ? 'bg-white text-black' : 'bg-white/15 text-white border border-white/20'}`}>
                        {isProc && current.filter !== f.id ? <Loader2 className="w-4 h-4 animate-spin inline mr-1" /> : null}{f.label}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Uploaded photos full-screen dialog ── */}
      <Dialog open={selectedIndex !== null} onOpenChange={(open) => { if (!open) setSelectedIndex(null); }}>
        <DialogContent className="max-w-4xl w-[92vw] h-[82vh] rounded-[32px] md:h-[90vh] md:w-[95vw] bg-black/95 md:bg-black border-none md:border-gray-800 p-0 overflow-hidden backdrop-blur-xl">
          <div
            className="relative w-full h-full flex items-center justify-center"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {isAdminView && selectedPhoto && (
              <button
                onClick={handleDeleteFromFullScreen}
                disabled={deletingId === selectedPhoto?.id}
                className="absolute top-6 left-4 md:top-4 md:left-4 z-50 w-10 h-10 rounded-full bg-red-600/70 hover:bg-red-600 backdrop-blur-md border border-red-400/30 flex items-center justify-center transition-all active:scale-90 shadow-lg shadow-red-900/40 disabled:opacity-50"
              >
                {deletingId === selectedPhoto?.id ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Trash2 className="w-4 h-4 text-white" />}
              </button>
            )}

            {/* כפתור מחיקה ישירה (עד 15 דקות) */}
            {canDirectDelete && !guestConfirmDelete && (
              <button onClick={() => setGuestConfirmDelete(true)} disabled={deletingId === selectedPhoto?.id}
                className="absolute top-6 left-4 z-50 w-10 h-10 rounded-full bg-red-600/70 hover:bg-red-600 backdrop-blur-md border border-red-400/30 flex items-center justify-center transition-all active:scale-90 shadow-lg disabled:opacity-50">
                {deletingId === selectedPhoto?.id ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Trash2 className="w-4 h-4 text-white" />}
              </button>
            )}
            {canDirectDelete && guestConfirmDelete && (
              <div className="absolute top-6 left-4 z-50 bg-black/80 backdrop-blur-md border border-white/10 rounded-2xl p-3 flex flex-col gap-2 shadow-xl">
                <p className="text-white text-xs font-bold text-center">למחוק תמונה זו?</p>
                <div className="flex gap-2">
                  <button onClick={() => { handleGuestDeletePhoto(selectedPhoto.id); setGuestConfirmDelete(false); }}
                    className="bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-full active:scale-95">מחק</button>
                  <button onClick={() => setGuestConfirmDelete(false)}
                    className="bg-white/20 text-white text-xs font-bold px-3 py-1.5 rounded-full active:scale-95">ביטול</button>
                </div>
              </div>
            )}

            {/* כפתור בקשת הסרה (אחרי 15 דקות) */}
            {canRequestDeletion && !requestingDeletion && (
              <button onClick={async () => { setRequestingDeletion(true); await handleRequestDeletion(selectedPhoto.id); setRequestingDeletion(false); setSelectedIndex(null); }}
                className="absolute top-6 left-4 z-50 flex items-center gap-2 bg-orange-600/80 hover:bg-orange-600 backdrop-blur-md border border-orange-400/30 text-white text-xs font-bold px-4 py-2.5 rounded-full transition-all active:scale-90 shadow-lg">
                <EyeOff className="w-4 h-4" /> בקש הסרה
              </button>
            )}
            {requestingDeletion && (
              <div className="absolute top-6 left-4 z-50 flex items-center gap-2 bg-black/70 backdrop-blur-md px-4 py-2.5 rounded-full">
                <Loader2 className="w-4 h-4 text-white animate-spin" />
                <span className="text-white text-xs">שולח בקשה...</span>
              </div>
            )}
            {isPendingDeletion && (
              <div className="absolute top-6 left-4 z-50 flex items-center gap-2 bg-orange-500/50 backdrop-blur-md border border-orange-400/20 px-4 py-2.5 rounded-full">
                <EyeOff className="w-4 h-4 text-orange-200" />
                <span className="text-orange-200 text-xs font-medium">בקשת הסרה ממתינה</span>
              </div>
            )}

            {selectedPhoto && (
              <>
                {isAdminView && (
                  <div className="absolute top-6 md:top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1.5 bg-black/40 backdrop-blur-md border border-white/10 rounded-full px-3 py-1.5 shadow-lg">
                    <User className="w-3 h-3 text-white/60 shrink-0" />
                    <span className="text-xs text-white/90 font-medium whitespace-nowrap max-w-[160px] truncate">{getDisplayUploaderName(selectedPhoto)}</span>
                    <span className="text-white/30 text-xs mx-0.5">·</span>
                    <span className="text-xs text-white/50 whitespace-nowrap">{selectedIndex + 1} / {displayedPhotos.length}</span>
                  </div>
                )}

                {selectedIndex < displayedPhotos.length - 1 && (
                  <button onClick={handleNextPhoto} className="absolute left-4 z-40 text-white bg-black/50 backdrop-blur-md p-3 rounded-full hover:bg-white/20 transition-all border border-white/10 active:scale-90 shadow-lg hidden sm:flex">
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                )}
                {selectedIndex > 0 && (
                  <button onClick={handlePrevPhoto} className="absolute right-4 z-40 text-white bg-black/50 backdrop-blur-md p-3 rounded-full hover:bg-white/20 transition-all border border-white/10 active:scale-90 shadow-lg hidden sm:flex">
                    <ChevronRight className="w-6 h-6" />
                  </button>
                )}

                <img src={selectedPhoto.file_url} alt="תמונה מוגדלת" className="max-w-full max-h-full object-contain pointer-events-none select-none" />

                {!isAdminView && (
                  <div className="absolute bottom-12 left-4 right-4 flex justify-center gap-3 z-50">
                    <Button disabled={isProcessingAction} onClick={(e) => { e.stopPropagation(); sharePhoto(selectedPhoto); }}
                      className="bg-white/15 hover:bg-white/25 text-white backdrop-blur-md rounded-full px-5 py-2.5 font-semibold border border-white/10 shadow-lg">
                      <Share2 className="ml-2 w-4 h-4" /> שתף
                      {isProcessingAction && <Loader2 className="w-4 h-4 animate-spin ml-2" />}
                    </Button>
                    <Button disabled={isProcessingAction} onClick={(e) => { e.stopPropagation(); handleDownloadPhoto(selectedPhoto); }}
                      className="bg-white/15 hover:bg-white/25 text-white backdrop-blur-md rounded-full px-5 py-2.5 font-semibold border border-white/10 shadow-lg">
                      <Upload className="ml-2 w-4 h-4" /> הורד
                      {isProcessingAction && <Loader2 className="w-4 h-4 animate-spin ml-2" />}
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}