import React, { useState, useEffect } from "react";
import { resolvePhotoDeletion } from "@/functions/resolvePhotoDeletion";
import { base44 } from "@/api/base44Client";
import { Loader2, Check, X, EyeOff, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DeletionRequestsPanel({ eventId }) {
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    if (!eventId) return;
    loadRequests();
  }, [eventId]);

  const loadRequests = async () => {
    setIsLoading(true);
    const photos = await base44.entities.Photo.filter({
      event_id: eventId,
      deletion_status: 'requested'
    });
    setRequests(photos);
    setIsLoading(false);
  };

  const handleResolve = async (photoId, action) => {
    setProcessingId(photoId);
    await resolvePhotoDeletion({ photo_id: photoId, action });
    setRequests(prev => prev.filter(p => p.id !== photoId));
    setProcessingId(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
        <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
          <Check className="w-6 h-6 text-green-400" />
        </div>
        <p className="text-gray-400 text-sm">אין בקשות הסרה ממתינות</p>
      </div>
    );
  }

  return (
    <div className="space-y-3" dir="rtl">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="w-4 h-4 text-orange-400" />
        <span className="text-orange-400 text-sm font-medium">{requests.length} בקשות הסרה ממתינות</span>
      </div>

      {requests.map(photo => {
        const thumbUrl = photo.file_urls?.thumbnail || photo.file_url;
        const isProcessing = processingId === photo.id;

        return (
          <div key={photo.id} className="bg-white/5 border border-white/10 rounded-2xl p-3 flex items-center gap-3">
            {/* Thumbnail */}
            <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-gray-800 relative">
              {thumbUrl ? (
                <img src={thumbUrl} alt="" className="w-full h-full object-cover opacity-60" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <EyeOff className="w-5 h-5 text-gray-500" />
                </div>
              )}
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <EyeOff className="w-4 h-4 text-orange-300" />
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-semibold truncate">
                {photo.guest_name || 'אורח לא מזוהה'}
              </p>
              <p className="text-gray-400 text-xs mt-0.5">ביקש להסיר תמונה זו</p>
              <p className="text-gray-600 text-[10px] mt-0.5">
                {photo.created_date ? new Date(photo.created_date).toLocaleDateString('he-IL') : ''}
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-1.5 shrink-0">
              <Button
                size="sm"
                disabled={isProcessing}
                onClick={() => handleResolve(photo.id, 'approve')}
                className="bg-red-600/80 hover:bg-red-600 text-white rounded-xl text-xs px-3 h-8 gap-1"
              >
                {isProcessing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2Icon />}
                אשר מחיקה
              </Button>
              <Button
                size="sm"
                variant="ghost"
                disabled={isProcessing}
                onClick={() => handleResolve(photo.id, 'deny')}
                className="bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs px-3 h-8 gap-1"
              >
                <X className="w-3 h-3" />
                דחה
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Trash2Icon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
    </svg>
  );
}