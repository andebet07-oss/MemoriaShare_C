import React from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Camera, Upload, X, Loader2 } from "lucide-react";
import CameraCapture from "@/components/camera/CameraCapture";

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
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center">
          <div className="bg-gray-900 rounded-3xl p-8 text-center max-w-xs mx-4 shadow-2xl border border-white/10 animate-in zoom-in-95">
            <Loader2 className="w-12 h-12 animate-spin text-indigo-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">מעבד תמונות...</h3>
            <p className="text-gray-400 text-sm">מכין את הקבצים, אנא המתן</p>
          </div>
        </div>
      )}

      {/* ── Upload progress modal ── */}
      {isUploadingBatch && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-gray-900 rounded-2xl p-8 text-center max-w-xs mx-4 shadow-2xl border border-white/10 min-w-[260px]">
            <Loader2 className="w-12 h-12 animate-spin text-white mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-1">מעלה תמונות...</h3>
            <p className="text-gray-400 font-bold mb-4">
              {uploadProgress.current} מתוך {uploadProgress.total}
            </p>
            <Progress value={progressPercent} className="h-2 bg-gray-700" />
            <p className="text-gray-500 text-xs mt-2">{progressPercent}%</p>
          </div>
        </div>
      )}

      {/* ── Pending gallery ── */}
      {!showCamera && pendingPhotos.length > 0 && (
        <div className="mb-8 bg-gradient-to-br from-gray-900/70 to-gray-800/50 border border-white/10 rounded-3xl pt-6 sm:pt-8 mt-8 backdrop-blur-sm shadow-2xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-6 px-6 sm:px-8">
            <h3 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-3">
              <Camera className="w-6 h-6" />
              תמונות מוכנות להעלאה ({pendingPhotos.length})
            </h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4 mb-6 px-6 sm:px-8 max-h-[50vh] overflow-y-auto pb-4">
            {pendingPhotos.map((pendingPhoto) => {
              const isProcessing = processingFilterId === pendingPhoto.id;
              return (
                <div key={pendingPhoto.id} className="relative flex flex-col gap-2">
                  <div className="relative aspect-square group">
                    <img
                      src={pendingPhoto.previewUrl}
                      alt={pendingPhoto.originalName}
                      className={`w-full h-full object-cover rounded-xl border-2 border-white/10 cursor-pointer ${isProcessing ? 'opacity-40' : ''}`}
                      onClick={() => setSelectedPendingIndex(pendingPhotos.findIndex(p => p.id === pendingPhoto.id))}
                    />
                    {isProcessing && <div className="absolute inset-0 flex items-center justify-center rounded-xl"><Loader2 className="w-7 h-7 text-white animate-spin" /></div>}
                    <button onClick={() => removeFromPendingPhotos(pendingPhoto.id)} className="absolute top-2 left-2 w-8 h-8 bg-black/70 backdrop-blur-sm rounded-full flex items-center justify-center active:scale-90 transition-transform border border-white/20 shadow-lg">
                      <X className="w-4 h-4 text-white" />
                    </button>
                  </div>
                  <div className="flex gap-1 justify-center" dir="ltr">
                    {[{ id: 'none', label: 'רגיל' }, { id: 'vintage', label: '🎞' }, { id: 'black_white', label: 'B&W' }].map(f => (
                      <button key={f.id} disabled={isProcessing} onClick={() => changePhotoFilter(pendingPhoto.id, f.id)}
                        className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold transition-all active:scale-95 min-h-[36px] ${pendingPhoto.filter === f.id ? 'bg-white text-black shadow-md' : 'bg-white/10 text-white/60 hover:bg-white/20'}`}>
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="sticky bottom-0 z-[60] flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center bg-gray-900/90 backdrop-blur-xl p-4 sm:p-5 border-t border-white/10">
            <Button onClick={uploadAllPendingPhotos} disabled={isUploadingBatch || pendingPhotos.length === 0}
              className="bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 text-white font-bold px-8 py-4 rounded-2xl flex-1 sm:flex-none text-lg transition-all active:scale-95 shadow-xl border border-white/10">
              {isUploadingBatch
                ? <div className="flex items-center justify-center gap-2"><Loader2 className="w-5 h-5 animate-spin" /> מעלה תמונות...</div>
                : <div className="flex items-center justify-center gap-2"><Upload className="w-5 h-5 ml-1" /> העלה {pendingPhotos.length} תמונות</div>}
            </Button>
            <Button variant="outline" onClick={() => {
              if (window.confirm('האם אתה בטוח שרוצה לבטל את כל התמונות שנבחרו?')) {
                clearAllPendingPhotos();
              }
            }} className="bg-gray-800/50 border-gray-600 hover:bg-gray-700/50 text-gray-300 flex-1 sm:flex-none px-6 py-3 rounded-full">
              בטל הכל
            </Button>
            <div className="flex gap-2 flex-1 sm:flex-none">
              <Button onClick={() => handleUploadClick('camera')} disabled={isUploadingBatch} variant="outline" className="bg-gray-800/50 border-gray-600 hover:bg-gray-700/50 text-gray-300 px-4 py-3 rounded-full flex items-center gap-2 flex-1"><Camera className="w-4 h-4" /> צלם</Button>
              <Button onClick={() => handleUploadClick('gallery')} disabled={isUploadingBatch} variant="outline" className="bg-gray-800/50 border-gray-600 hover:bg-gray-700/50 text-gray-300 px-4 py-3 rounded-full flex items-center gap-2 flex-1"><Upload className="w-4 h-4" /> גלריה</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}