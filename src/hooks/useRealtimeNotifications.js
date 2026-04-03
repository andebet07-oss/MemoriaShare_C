import { useEffect, useRef, useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";

/**
 * useRealtimeNotifications
 * Subscribes to Photo entity changes for a given eventId.
 * Calls onNewPhoto(photo) when a new photo is created for this event.
 * Calls onApprovedPhoto(photo) when a photo is approved (is_approved becomes true).
 *
 * Returns: { notifications, dismissNotification }
 */
export default function useRealtimeNotifications({ eventId, onNewPhoto, onApprovedPhoto, currentUserEmail } = {}) {
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

    const unsubscribe = base44.entities.Photo.subscribe((event) => {
      const photo = event.data;
      if (!photo || photo.event_id !== eventId) return;

      if (event.type === "create") {
        // Avoid duplicate notifications
        if (seenIds.current.has(photo.id)) return;
        seenIds.current.add(photo.id);

        // Don't notify the uploader about their own photo
        if (photo.created_by && photo.created_by === currentUserEmail) return;

        if (onNewPhoto) onNewPhoto(photo);
        const uploaderName = photo.guest_name || (photo.created_by ? photo.created_by.split("@")[0] : "אורח");
        addNotification({ message: `תמונה חדשה הועלתה על ידי ${uploaderName}`, icon: "📸" });
      }

      if (event.type === "update") {
        const oldData = event.old_data;
        // Only notify when is_approved transitions false → true
        if (photo.is_approved && oldData && !oldData.is_approved) {
          if (onApprovedPhoto) onApprovedPhoto(photo);
          addNotification({ message: "תמונה חדשה אושרה ועלתה לגלריה!", icon: "✅" });
        }
      }
    });

    return () => unsubscribe();
  }, [eventId, currentUserEmail, addNotification, onNewPhoto, onApprovedPhoto]);

  return { notifications, dismissNotification };
}