import React, { useState } from "react";
import memoriaService from "@/components/memoriaService";
import { Trash2, User, ImageIcon, Loader2 } from "lucide-react";

export default function AdminGallery({ photos, onPhotosChange }) {
  const [deletingId, setDeletingId] = useState(null);
  const [confirmId, setConfirmId] = useState(null);

  const handleDeleteRequest = (photoId) => {
    setConfirmId(photoId);
  };

  const handleConfirmDelete = async (photoId) => {
    setDeletingId(photoId);
    setConfirmId(null);
    await memoriaService.photos.delete(photoId);
    onPhotosChange(photos.filter(p => p.id !== photoId));
    setDeletingId(null);
  };

  const handleCancelDelete = () => {
    setConfirmId(null);
  };

  if (photos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-6">
        <ImageIcon className="w-14 h-14 text-gray-700 mb-4" />
        <p className="text-gray-500 text-sm font-medium">עדיין לא הועלו תמונות לאירוע</p>
      </div>
    );
  }

  return (
    <div className="mt-3">
      {/* Stats bar */}
      <div className="flex items-center justify-between mb-4 px-1">
        <span className="text-xs text-gray-500">{photos.length} תמונות</span>
        <span className="text-xs text-gray-500">
          {new Set(photos.map(p => p.created_by)).size} משתתפים
        </span>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {photos.map((photo) => {
          const isDeleting = deletingId === photo.id;
          const isConfirming = confirmId === photo.id;
          const uploaderName = photo.created_by?.split('@')[0] || "אורח";

          return (
            <div key={photo.id} className="relative aspect-[9/16] bg-[#1a1a1a] rounded-xl overflow-hidden shadow-md">
              <img
                src={photo.file_url}
                alt="תמונה"
                loading="lazy"
                className={`w-full h-full object-cover ${isDeleting ? 'opacity-40' : ''}`}
              />

              {/* Overlay with uploader + delete */}
              {!isDeleting && !isConfirming && (
                <div className="absolute inset-0 bg-black/0 group-active:bg-black/40 transition-all duration-150 flex flex-col justify-between p-1.5">
                  {/* Uploader badge - always visible */}
                  <div className="self-end">
                    <div className="bg-black/60 backdrop-blur-sm rounded-full px-2 py-0.5 flex items-center gap-1">
                      <User className="w-2.5 h-2.5 text-white/70" />
                      <span className="text-[10px] text-white/80 font-medium max-w-[60px] truncate">{uploaderName}</span>
                    </div>
                  </div>

                  {/* Delete button - bottom left */}
                  <div className="self-start opacity-0 group-active:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleDeleteRequest(photo.id)}
                      className="w-7 h-7 bg-red-500/90 backdrop-blur-sm rounded-full flex items-center justify-center active:scale-90 transition-transform shadow-lg"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-white" />
                    </button>
                  </div>
                </div>
              )}

              {/* Loading state */}
              {isDeleting && (
                <div className="absolute inset-0 bg-black/70 flex items-center justify-center rounded-xl">
                  <Loader2 className="w-5 h-5 text-white animate-spin" />
                </div>
              )}

              {/* Confirm delete overlay */}
              {isConfirming && (
                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center gap-2 p-2 rounded-xl">
                  <p className="text-white text-[10px] font-bold text-center leading-tight">למחוק?</p>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => handleConfirmDelete(photo.id)}
                      className="bg-red-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-full active:scale-95 transition-transform"
                    >
                      מחק
                    </button>
                    <button
                      onClick={handleCancelDelete}
                      className="bg-white/20 text-white text-[10px] font-bold px-3 py-1.5 rounded-full active:scale-95 transition-transform"
                    >
                      ביטול
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}