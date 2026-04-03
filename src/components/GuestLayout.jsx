import React from "react";

/**
 * GuestLayout - עטיפה מינימלית לחוויית האורח
 * אין כאן Header, Footer, או ניווט לאתר השיווקי.
 * האורח רואה אך ורק את תוכן האירוע.
 */
export default function GuestLayout({ children }) {
  return (
    <div className="min-h-screen bg-black text-white">
      {children}
    </div>
  );
}