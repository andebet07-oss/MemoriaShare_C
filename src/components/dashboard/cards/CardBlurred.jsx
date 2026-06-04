import React from "react";

/**
 * Theme 3 — Bordered (light, framed, elegant serif)
 * Soft off-white with a delicate inset border + corner ticks.
 * (coverImage prop intentionally unused — kept light per design.)
 */
export default function CardBlurred({ eventName, eventDate, qrUrl, accentColor }) {
  return (
    <div style={{
      width: "450px", height: "636px",
      background: "#faf9f6",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      fontFamily: "'David Libre', serif",
      position: "relative", overflow: "hidden", boxSizing: "border-box",
      padding: "0 50px",
    }}>
      {/* Delicate inset frame */}
      <div style={{
        position: "absolute", top: "18px", bottom: "18px", left: "18px", right: "18px",
        border: `1px solid ${accentColor}`, opacity: 0.28, borderRadius: "3px",
        pointerEvents: "none",
      }} />
      {/* Corner ticks */}
      {[{ top: 10, left: 10 }, { top: 10, right: 10 }, { bottom: 10, left: 10 }, { bottom: 10, right: 10 }].map((pos, i) => (
        <div key={i} style={{
          position: "absolute", ...pos, width: "14px", height: "14px",
          border: `1px solid ${accentColor}`, opacity: 0.35,
        }} />
      ))}

      {/* Welcome eyebrow */}
      <p dir="rtl" style={{
        fontSize: "15px", color: "#9c9c93", fontWeight: 400,
        fontFamily: "'Heebo', sans-serif", letterSpacing: "1px", margin: 0,
      }}>
        ברוכים הבאים לאירוע של
      </p>

      {/* Event name */}
      <h2 dir="rtl" style={{
        fontSize: "42px", fontWeight: 700, color: "#28282a",
        textAlign: "center", lineHeight: 1.2, margin: "14px 0 0",
      }}>
        {eventName}
      </h2>

      {/* Date */}
      {eventDate && (
        <p style={{
          marginTop: "14px", fontSize: "13px", color: "#a8a89e", letterSpacing: "4px",
          fontFamily: "'Heebo', sans-serif", fontWeight: 500, margin: "14px 0 0",
        }}>
          {eventDate}
        </p>
      )}

      {/* QR */}
      <div style={{
        marginTop: "26px",
        background: "#fff",
        border: "1px solid #e8e7e1",
        borderRadius: "10px",
        padding: "16px",
        boxShadow: "0 10px 28px rgba(0,0,0,0.06)",
      }}>
        <img src={qrUrl} alt="QR" style={{ width: "150px", height: "150px", display: "block" }} />
      </div>

      {/* Invitation */}
      <p dir="rtl" style={{
        marginTop: "22px", fontSize: "17px", color: "#3f3f42",
        textAlign: "center", lineHeight: 1.4, margin: "22px 0 0",
      }}>
        נשמח לחלוק עמכם את הזיכרונות
      </p>
      <p dir="rtl" style={{
        marginTop: "4px", fontSize: "12px", color: "#a8a89e",
        fontFamily: "'Heebo', sans-serif", fontWeight: 400, margin: "4px 0 0",
      }}>
        סרקו ושתפו — ניצור יחד אלבום אחד
      </p>

      {/* Brand footer */}
      <p style={{
        position: "absolute", bottom: "26px",
        fontSize: "9px", fontFamily: "'Montserrat', sans-serif", fontWeight: 700,
        letterSpacing: "4px", color: "#cdcdc4", textTransform: "uppercase", margin: 0,
      }}>
        MemoriaShare
      </p>
    </div>
  );
}
