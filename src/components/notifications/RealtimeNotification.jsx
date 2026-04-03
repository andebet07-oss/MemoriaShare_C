import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

/**
 * RealtimeNotification
 * Shows a toast-style notification that auto-dismisses after `duration` ms.
 * Props:
 *   notifications: [{ id, message, icon }]
 *   onDismiss: (id) => void
 */
export default function RealtimeNotification({ notifications, onDismiss }) {
  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none" dir="rtl">
      <AnimatePresence>
        {notifications.map((n) => (
          <motion.div
            key={n.id}
            initial={{ opacity: 0, x: 60, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 60, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 340, damping: 28 }}
            className="pointer-events-auto flex items-center gap-3 bg-[#1a1a1a] border border-white/10 rounded-2xl px-4 py-3 shadow-2xl max-w-xs"
          >
            <span className="text-xl shrink-0">{n.icon}</span>
            <p className="text-white text-sm font-medium flex-1 leading-snug">{n.message}</p>
            <button
              onClick={() => onDismiss(n.id)}
              className="text-gray-500 hover:text-white transition-colors shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}