import React from "react";
import { Loader2, Trash2, Clock, EyeOff, Check } from "lucide-react";

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
  isSelectionMode = false,
  isSelected = false,
  onToggleSelect,
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
      className={`relative aspect-square bg-gray-800/50 rounded-xl overflow-hidden cursor-pointer hover:scale-[1.02] active:scale-95 transition-all duration-300 shadow-lg animate-in fade-in zoom-in-95 border ${isSelectionMode && isSelected ? 'border-indigo-500 ring-2 ring-indigo-500' : 'border-white/5'}`}
      onClick={() => isSelectionMode ? onToggleSelect?.(photo.id) : setSelectedIndex(index)}
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

      {isDeleting && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-xl">
          <Loader2 className="w-5 h-5 text-white animate-spin" />
        </div>
      )}

      {/* Selection overlay */}
      {isSelectionMode && (
        <>
          <div className={`absolute inset-0 transition-colors duration-150 pointer-events-none ${isSelected ? 'bg-black/50' : 'bg-black/10'}`} />
          <div className={`absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-150 pointer-events-none ${
            isSelected
              ? 'bg-indigo-500 border-2 border-white scale-110'
              : 'bg-black/40 border-2 border-white/50'
          }`}>
            {isSelected && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
          </div>
        </>
      )}
    </div>
  );
}