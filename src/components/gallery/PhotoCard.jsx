import React from "react";
import { Loader2, Trash2, User, Clock, EyeOff } from "lucide-react";

export default function PhotoCard({
  photo,
  index,
  setSelectedIndex,
  isAdminView,
  confirmDeleteId,
  setConfirmDeleteId,
  deletingId,
  handleAdminDelete,
  handleGuestDeletePhoto,
  handleRequestDeletion,
  currentUser,
  getDisplayUploaderName,
}) {
  const isDeleting = deletingId === photo.id;
  const isConfirming = confirmDeleteId === photo.id;
  const isOwnPhoto = !isAdminView && photo.created_by === currentUser?.id;   // UUID comparison

  // Smart deletion: unapproved → direct delete (frees quota); approved → request deletion
  const canDirectDelete = isOwnPhoto && !photo.is_approved;
  const canRequestDeletion = isOwnPhoto && photo.is_approved && photo.deletion_status === 'none';
  const isPendingDeletion = photo.deletion_status === 'requested';

  const thumbnailUrl = photo.file_urls?.thumbnail || photo.file_url;

  return (
    <div
      className="relative aspect-square bg-gray-800/50 rounded-xl overflow-hidden cursor-pointer hover:scale-[1.02] active:scale-95 transition-all duration-300 shadow-lg border border-white/5 animate-in fade-in zoom-in-95"
      onClick={() => setSelectedIndex(index)}
    >
      <img
        src={thumbnailUrl}
        alt={`תמונה ${index + 1}`}
        loading="lazy"
        className={`w-full h-full object-cover ${isDeleting ? "opacity-40" : ""}`}
      />

      {/* אייקון "ממתינה לאישור" */}
      {isOwnPhoto && !photo.is_approved && !isPendingDeletion && !isDeleting && !isConfirming && (
        <div className="absolute top-2 right-2 w-6 h-6 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center" title="ממתינה לאישור">
          <Clock className="w-3 h-3 text-white/80" />
        </div>
      )}

      {/* אייקון "ממתינה לבדיקת הסרה" */}
      {isPendingDeletion && !isDeleting && (
        <div className="absolute top-2 right-2 w-6 h-6 bg-orange-500/80 backdrop-blur-sm rounded-full flex items-center justify-center" title="בקשת הסרה ממתינה">
          <EyeOff className="w-3 h-3 text-white" />
        </div>
      )}

      {/* כפתור מחיקה ישירה (עד 15 דקות) */}
      {canDirectDelete && !isDeleting && !isConfirming && (
        <div className="absolute bottom-2 left-2">
          <button onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(photo.id); }}
            className="w-7 h-7 bg-red-500/80 backdrop-blur-sm rounded-full flex items-center justify-center active:scale-90 transition-transform shadow-lg">
            <Trash2 className="w-3.5 h-3.5 text-white" />
          </button>
        </div>
      )}

      {/* כפתור בקשת הסרה (אחרי 15 דקות) */}
      {canRequestDeletion && !isDeleting && !isConfirming && (
        <div className="absolute bottom-2 left-2">
          <button onClick={(e) => { e.stopPropagation(); handleRequestDeletion(photo.id); }}
            className="w-7 h-7 bg-orange-500/80 backdrop-blur-sm rounded-full flex items-center justify-center active:scale-90 transition-transform shadow-lg">
            <EyeOff className="w-3.5 h-3.5 text-white" />
          </button>
        </div>
      )}

      {/* אישור מחיקה ישירה */}
      {canDirectDelete && isConfirming && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center gap-2 p-2 rounded-xl">
          <p className="text-white text-[10px] font-bold text-center">למחוק תמונה זו?</p>
          <div className="flex gap-1.5">
            <button onClick={(e) => { e.stopPropagation(); handleGuestDeletePhoto(photo.id); }}
              className="bg-red-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-full active:scale-95">מחק</button>
            <button onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(null); }}
              className="bg-white/20 text-white text-[10px] font-bold px-3 py-1.5 rounded-full active:scale-95">ביטול</button>
          </div>
        </div>
      )}

      {/* Admin overlay */}
      {isAdminView && !isDeleting && !isConfirming && (
        <div className="absolute inset-0 flex flex-col justify-between p-1.5">
          <div className="self-end">
            <div className="bg-black/60 backdrop-blur-sm rounded-full px-2 py-0.5 flex items-center gap-1">
              <User className="w-2.5 h-2.5 text-white/70" />
              <span className="text-[10px] text-white/80 font-medium max-w-[60px] truncate">
                {getDisplayUploaderName(photo)}
              </span>
            </div>
          </div>
          <div className="self-start">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setConfirmDeleteId(photo.id);
              }}
              className="w-7 h-7 bg-red-500/80 backdrop-blur-sm rounded-full flex items-center justify-center active:scale-90 transition-transform shadow-lg"
            >
              <Trash2 className="w-3.5 h-3.5 text-white" />
            </button>
          </div>
        </div>
      )}

      {/* Admin delete confirmation */}
      {isAdminView && isConfirming && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center gap-2 p-2 rounded-xl">
          <p className="text-white text-[10px] font-bold text-center">למחוק תמונה זו?</p>
          <div className="flex gap-1.5">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleAdminDelete(photo.id);
              }}
              className="bg-red-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-full active:scale-95"
            >
              מחק
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setConfirmDeleteId(null);
              }}
              className="bg-white/20 text-white text-[10px] font-bold px-3 py-1.5 rounded-full active:scale-95"
            >
              ביטול
            </button>
          </div>
        </div>
      )}

      {isDeleting && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-xl">
          <Loader2 className="w-5 h-5 text-white animate-spin" />
        </div>
      )}
    </div>
  );
}