import React from "react";

/**
 * Theme — Arch (warm sand gradient, fine arch frame, elegant serif)
 * (coverImage prop intentionally unused — kept light per design.)
 */
export default function CardBlurred({ eventName, eventDate, qrUrl, accentColor }) {
  return (
    <div style={{
      width: "450px", height: "636px",
      background: "linear-gradient(165deg, #fbf7f0 0%, #f3e9d9 100%)",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      fontFamily: "'David Libre', serif",
      position: "relative", overflow: "hidden", boxSizing: "border-box",
      padding: "0 56px",
    }}>
      {/* Arch frame */}
      <svg width="450" height="636" viewBox="0 0 450 636" fill="none"
        style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <path d="M28 612 L28 225 A197 197 0 0 1 422 225 L422 612 Z"
          stroke={accentColor} strokeWidth="1.3" fill="none" opacity="0.3" />
        <path d="M40 612 L40 225 A185 185 0 0 1 410 225 L410 612 Z"
          stroke={accentColor} strokeWidth="0.7" fill="none" opacity="0.2" />
      </svg>

      {/* Welcome eyebrow */}
      <p dir="rtl" style={{
        fontSize: "15px", color: "#a4977f", fontWeight: 400,
        fontFamily: "'Heebo', sans-serif", letterSpacing: "1.5px", margin: 0, zIndex: 1,
      }}>
        ברוכים הבאים לאירוע של
      </p>

      {/* Event name */}
      <h2 dir="rtl" style={{
        fontSize: "44px", fontWeight: 700, color: "#2f2820",
        textAlign: "center", lineHeight: 1.18, margin: "12px 0 0", zIndex: 1,
      }}>
        {eventName}
      </h2>

      {/* Date with side rules */}
      {eventDate && (
        <div style={{ display: "flex", alignItems: "center", gap: "12px", margin: "16px 0 0", zIndex: 1 }}>
          <div style={{ width: "28px", height: "1px", background: accentColor, opacity: 0.4 }} />
          <p style={{
            fontSize: "13px", color: "#ab9d83", letterSpacing: "4px",
            fontFamily: "'Heebo', sans-serif", fontWeight: 500, margin: 0,
          }}>
            {eventDate}
          </p>
          <div style={{ width: "28px", height: "1px", background: accentColor, opacity: 0.4 }} />
        </div>
      )}

      {/* QR */}
      <div style={{
        marginTop: "26px", zIndex: 1,
        background: "#fff",
        border: "1px solid #ece2d0",
        borderRadius: "10px",
        padding: "15px",
        boxShadow: "0 12px 30px rgba(140,110,60,0.12)",
      }}>
        <img src={qrUrl} alt="QR" style={{ width: "150px", height: "150px", display: "block" }} />
      </div>

      {/* Invitation */}
      <p dir="rtl" style={{
        marginTop: "22px", fontSize: "18px", color: "#463f33",
        textAlign: "center", lineHeight: 1.4, margin: "22px 0 0", zIndex: 1,
      }}>
        נשמח לחלוק עמכם את הזיכרונות
      </p>
      <p dir="rtl" style={{
        marginTop: "5px", fontSize: "12px", color: "#ab9d83",
        fontFamily: "'Heebo', sans-serif", fontWeight: 400, margin: "5px 0 0", zIndex: 1,
      }}>
        סרקו ושתפו — ניצור יחד אלבום אחד
      </p>

      {/* Brand footer */}
      <p style={{
        position: "absolute", bottom: "30px", zIndex: 1,
        fontSize: "9px", fontFamily: "'Montserrat', sans-serif", fontWeight: 700,
        letterSpacing: "4px", color: "#cdbfa3", textTransform: "uppercase", margin: 0,
      }}>
        MemoriaShare
      </p>
    </div>
  );
}
