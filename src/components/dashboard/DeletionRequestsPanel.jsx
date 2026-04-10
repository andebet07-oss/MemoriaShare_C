import React, { useState, useEffect } from "react";
import { resolvePhotoDeletion } from "@/functions/resolvePhotoDeletion";
import { supabase } from "@/lib/supabase";
import { Loader2, Check, X, EyeOff, ChevronDown, Trash2 } from "lucide-react";

export default function DeletionRequestsPanel({ eventId }) {
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingIds, setProcessingIds] = useState(new Set());
  const [expandedGroups, setExpandedGroups] = useState(new Set());

  useEffect(() => {
    if (!eventId) return;
    loadRequests();
  }, [eventId]);

  const loadRequests = async () => {
    setIsLoading(true);
    const { data: photos } = await supabase
      .from('photos')
      .select('*')
      .eq('event_id', eventId)
      .eq('deletion_status', 'requested');
    setRequests(photos || []);
    setIsLoading(false);
  };

  const handleResolve = async (photoId, action) => {
    setProcessingIds(prev => new Set(prev).add(photoId));
    await resolvePhotoDeletion({ photo_id: photoId, action });
    setRequests(prev => prev.filter(p => p.id !== photoId));
    setProcessingIds(prev => { const n = new Set(prev); n.delete(photoId); return n; });
  };

  const toggleGroup = (key) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center gap-2">
        <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
          <Check className="w-5 h-5 text-green-400" />
        </div>
        <p className="text-gray-500 text-sm">אין בקשות הסרה ממתינות</p>
      </div>
    );
  }

  // Group by guest identity
  const groups = requests.reduce((acc, photo) => {
    const key = photo.guest_name || photo.created_by || 'אורח לא מזוהה';
    if (!acc[key]) acc[key] = [];
    acc[key].push(photo);
    return acc;
  }, {});

  return (
    <div className="space-y-2" dir="rtl">
      <p className="text-xs text-gray-500 mb-3">
        {requests.length} בקשות הסרה · {Object.keys(groups).length} אורחים
      </p>

      {Object.entries(groups).map(([guestKey, photos]) => {
        const isOpen = expandedGroups.has(guestKey);
        return (
          <div key={guestKey} className="rounded-xl border border-white/8 overflow-hidden bg-white/[0.03]">
            {/* Accordion header */}
            <button
              onClick={() => toggleGroup(guestKey)}
              className="w-full flex items-center justify-between px-3 py-2.5 text-right hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-orange-500/20 flex items-center justify-center shrink-0">
                  <EyeOff className="w-3 h-3 text-orange-400" />
                </div>
                <span className="text-sm text-white font-medium">{guestKey}</span>
                <span className="text-xs text-gray-500 bg-white/8 px-1.5 py-0.5 rounded-full">
                  {photos.length} {photos.length === 1 ? 'בקשה' : 'בקשות'}
                </span>
              </div>
              <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Expanded content */}
            {isOpen && (
              <div className="px-3 pb-3 border-t border-white/5">
                <div className="flex gap-2 mt-3 overflow-x-auto pb-1 snap-x snap-mandatory">
                  {photos.map(photo => {
                    const thumbUrl = photo.file_urls?.thumbnail || photo.file_url;
                    const isProcessing = processingIds.has(photo.id);
                    return (
                      <div key={photo.id} className="shrink-0 snap-start w-24">
                        <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-gray-800">
                          {thumbUrl ? (
                            <img src={thumbUrl} alt="" className="w-full h-full object-cover opacity-70" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <EyeOff className="w-5 h-5 text-gray-600" />
                            </div>
                          )}
                          {isProcessing && (
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                              <Loader2 className="w-4 h-4 animate-spin text-white" />
                            </div>
                          )}
                        </div>
                        <div className="flex gap-1 mt-1.5">
                          <button
                            disabled={isProcessing}
                            onClick={() => handleResolve(photo.id, 'approve')}
                            className="flex-1 flex items-center justify-center gap-0.5 py-1 rounded-lg bg-red-600/80 hover:bg-red-600 text-white text-[10px] font-semibold transition-colors disabled:opacity-40"
                          >
                            <Trash2 className="w-2.5 h-2.5" />
                            מחק
                          </button>
                          <button
                            disabled={isProcessing}
                            onClick={() => handleResolve(photo.id, 'deny')}
                            className="flex-1 flex items-center justify-center py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 text-[10px] font-semibold transition-colors disabled:opacity-40"
                          >
                            <X className="w-2.5 h-2.5" />
                            דחה
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
