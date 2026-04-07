import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";

/**
 * useRealtimeNotifications
 * Subscribes to Photo table changes for a given eventId via Supabase Realtime.
 * Calls onNewPhoto(photo) when a new photo is created for this event.
 * Calls onApprovedPhoto(photo) when a photo is approved (is_approved becomes true).
 *
 * Returns: { notifications, dismissNotification }
 */
export default function useRealtimeNotifications({ eventId, onNewPhoto, onApprovedPhoto, currentUserId } = {}) {
  const [notifications, setNotifications] = useState([]);
  const seenIds = useRef(new Set());

  const addNotification = useCallback(({ message, icon }) => {
    const id = Date.now() + Math.random();
    setNotifications(prev => [...prev, { id, message, icon }]);
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  }, []);

  const dismissNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  useEffect(() => {
    if (!eventId) return;

    const channel = supabase
      .channel(`photos-notifications-${eventId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'photos', filter: `event_id=eq.${eventId}` },
        (payload) => {
          const eventType = payload.eventType; // 'INSERT' | 'UPDATE' | 'DELETE'
          const photo = payload.new;
          if (!photo) return;

          if (eventType === 'INSERT') {
            // Avoid duplicate notifications
            if (seenIds.current.has(photo.id)) return;
            seenIds.current.add(photo.id);

            // Don't notify the uploader about their own photo (compare UUID to UUID)
            if (photo.created_by && photo.created_by === currentUserId) return;

            if (onNewPhoto) onNewPhoto(photo);
            const uploaderName = photo.guest_name || 'אורח';
            addNotification({ message: `תמונה חדשה הועלתה על ידי ${uploaderName}`, icon: '📸' });
          }

          if (eventType === 'UPDATE') {
            const oldData = payload.old;
            // Only notify when is_approved transitions false → true
            if (photo.is_approved && oldData && !oldData.is_approved) {
              if (onApprovedPhoto) onApprovedPhoto(photo);
              addNotification({ message: 'תמונה חדשה אושרה ועלתה לגלריה!', icon: '✅' });
            }
          }
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [eventId, currentUserId, addNotification, onNewPhoto, onApprovedPhoto]);

  return { notifications, dismissNotification };
}
