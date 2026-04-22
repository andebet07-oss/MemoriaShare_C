import React from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Camera, Upload, X, Loader2, Film, ImageIcon } from "lucide-react";
import CameraCapture from "@/components/camera/CameraCapture";

const FILTERS = [
  { id: 'none',        label: 'רגיל' },
  { id: 'vintage',     icon: Film   },
  { id: 'black_white', label: 'B&W' },
];

export default function UploadManager({
  pendingPhotos,
  isUploadingBatch,
  uploadProgress,
  isPreparingFiles,
  processingFilterId,
  setSelectedPendingIndex,
  removeFromPendingPhotos,
  clearAllPendingPhotos,
  changePhotoFilter,
  uploadAllPendingPhotos,
  handleUploadClick,
  showCamera,
  setShowCamera,
  handleCameraCapture,
  handleFinalUploadFromCamera,
  cameraMaxPhotos,
  eventName,
  eventDate,
}) {
  const progressPercent = uploadProgress.total > 0
    ? Math.round((uploadProgress.current / uploadProgress.total) * 100)
    : 0;

  return (
    <>
      {/* ── Camera ── */}
      {showCamera && (
        <CameraCapture
          onCapture={handleCameraCapture}
          onClose={() => setShowCamera(false)}
          onFinalUpload={handleFinalUploadFromCamera}
          pendingPhotos={pendingPhotos}
          onRemovePhoto={removeFromPendingPhotos}
          maxPhotos={cameraMaxPhotos}
          isFrontCamera={true}
          eventName={eventName}
          eventDate={eventDate}
        />
      )}

      {/* ── Preparing files modal ── */}
      {isPreparingFiles && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[100] flex items-center justify-center">
          <div className="rounded-2xl p-8 text-center max-w-[260px] mx-4 shadow-2xl"
            style={{ background: 'rgba(18,18,20,0.96)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="w-12 h-12 rounded-full mx-auto mb-5 flex items-center justify-center"
              style={{ background: 'rgba(124,134,225,0.12)', border: '1px solid rgba(124,134,225,0.25)' }}>
              <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
            </div>
            <p className="text-white font-bold text-base mb-1 font-heebo">מעבד תמונות</p>
            <p className="text-white/40 text-xs font-heebo">אנא המתן...</p>
          </div>
        </div>
      )}

      {/* ── Upload progress modal ── */}
      {isUploadingBatch && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center">
          <div className="rounded-2xl p-8 text-center max-w-[260px] mx-4 shadow-2xl min-w-[240px]"
            style={{ background: 'rgba(18,18,20,0.96)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="w-12 h-12 rounded-full mx-auto mb-5 flex items-center justify-center"
              style={{ background: 'rgba(124,134,225,0.12)', border: '1px solid rgba(124,134,225,0.25)' }}>
              <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
            </div>
            <p className="text-white font-bold text-base mb-1 font-heebo">מעלה תמונות</p>
            <p className="text-white/40 text-xs font-heebo mb-5">
              {uploadProgress.current} מתוך {uploadProgress.total}
            </p>
            <div className="h-1 w-full rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%`, background: 'linear-gradient(90deg, #7c86e1, #6d76d1)' }}
              />
            </div>
            <p className="text-indigo-400 text-[11px] font-bold mt-2">{progressPercent}%</p>
          </div>
        </div>
      )}

      {/* ── Pending gallery ── */}
      {!showCamera && pendingPhotos.length > 0 && (
        <div className="mb-8 mt-6 rounded-2xl overflow-hidden"
          style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.07)',
            backdropFilter: 'blur(12px)',
          }}>

          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-5 pb-4"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(124,134,225,0.12)', border: '1px solid rgba(124,134,225,0.2)' }}>
                <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
              </div>
              <div>
                <p className="text-[9px] font-bold tracking-[0.25em] uppercase text-indigo-400 font-heebo mb-0.5">
                  ממתינות להעלאה
                </p>
                <p className="text-sm font-bold text-white font-heebo leading-none">
                  {pendingPhotos.length} תמונות נבחרו
                </p>
              </div>
            </div>
            {/* Count badge */}
            <span className="text-xs font-black text-indigo-300 tabular-nums px-2.5 py-1 rounded-full"
              style={{ background: 'rgba(124,134,225,0.12)', border: '1px solid rgba(124,134,225,0.22)' }}>
              {pendingPhotos.length}
            </span>
          </div>

          {/* Photo grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 p-4 max-h-[52vh] overflow-y-auto">
            {pendingPhotos.map((pendingPhoto) => {
              const isProcessing = processingFilterId === pendingPhoto.id;
              return (
                <div key={pendingPhoto.id} className="flex flex-col gap-1.5">

                  {/* Photo thumb */}
                  <div className="relative aspect-square group cursor-pointer"
                    onClick={() => setSelectedPendingIndex(pendingPhotos.findIndex(p => p.id === pendingPhoto.id))}>
                    <img
                      src={pendingPhoto.previewUrl}
                      alt={pendingPhoto.originalName}
                      className="w-full h-full object-cover transition-opacity duration-200"
                      style={{
                        borderRadius: 14,
                        opacity: isProcessing ? 0.35 : 1,
                        boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
                        border: '1px solid rgba(255,255,255,0.08)',
                      }}
                    />
                    {isProcessing && (
                      <div className="absolute inset-0 flex items-center justify-center rounded-[14px]">
                        <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
                      </div>
                    )}
                    {/* Remove button */}
                    <button
                      onClick={e => { e.stopPropagation(); removeFromPendingPhotos(pendingPhoto.id); }}
                      className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full active:scale-90 transition-transform"
                      style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.15)' }}>
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>

                  {/* Filter pills */}
                  <div className="flex gap-1" dir="ltr">
                    {FILTERS.map(f => {
                      const active = pendingPhoto.filter === f.id;
                      return (
                        <button
                          key={f.id}
                          disabled={isProcessing}
                          onClick={() => changePhotoFilter(pendingPhoto.id, f.id)}
                          className="flex-1 flex items-center justify-center py-1 rounded-lg text-[10px] font-bold transition-all active:scale-95 min-h-[28px] gap-0.5"
                          style={{
                            background: active ? 'rgba(124,134,225,0.18)' : 'rgba(255,255,255,0.05)',
                            border: `1px solid ${active ? 'rgba(124,134,225,0.4)' : 'rgba(255,255,255,0.07)'}`,
                            color: active ? '#a5acee' : 'rgba(255,255,255,0.35)',
                          }}>
                          {f.icon
                            ? <f.icon className="w-3 h-3" />
                            : f.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer actions */}
          <div className="px-4 pb-4 pt-3 flex flex-col gap-2"
            style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>

            {/* Primary: upload */}
            <button
              onClick={uploadAllPendingPhotos}
              disabled={isUploadingBatch || pendingPhotos.length === 0}
              className="w-full py-3.5 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-40 font-heebo"
              style={{
                background: 'linear-gradient(135deg, #7c86e1, #6368c7)',
                boxShadow: '0 4px 20px rgba(124,134,225,0.3)',
              }}>
              {isUploadingBatch
                ? <><Loader2 className="w-4 h-4 animate-spin" /> מעלה...</>
                : <><Upload className="w-4 h-4" /> העלה {pendingPhotos.length} תמונות</>}
            </button>

            {/* Secondary row */}
            <div className="flex gap-2">
              <button
                onClick={() => handleUploadClick('camera')}
                disabled={isUploadingBatch}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 font-heebo"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }}>
                <Camera className="w-3.5 h-3.5" /> צלם
              </button>
              <button
                onClick={() => handleUploadClick('gallery')}
                disabled={isUploadingBatch}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 font-heebo"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }}>
                <Upload className="w-3.5 h-3.5" /> גלריה
              </button>
              <button
                onClick={() => {
                  if (window.confirm('האם אתה בטוח שרוצה לבטל את כל התמונות שנבחרו?')) {
                    clearAllPendingPhotos();
                  }
                }}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center transition-all active:scale-95 font-heebo"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.3)' }}>
                בטל הכל
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
