import React from "react";

/**
 * Theme 1 — Minimal / Modern (light, airy, sans-serif)
 * Pure white, generous whitespace, a single hairline accent.
 */
export default function CardMinimalist({ eventName, eventDate, qrUrl, accentColor }) {
  return (
    <div style={{
      width: "450px", height: "636px",
      background: "#ffffff",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      fontFamily: "'Heebo', sans-serif",
      position: "relative", overflow: "hidden", boxSizing: "border-box",
      padding: "0 46px",
    }}>
      {/* Welcome eyebrow */}
      <p dir="rtl" style={{
        fontSize: "15px", color: "#9a9a9a", fontWeight: 500,
        letterSpacing: "0.5px", margin: 0,
      }}>
        ברוכים הבאים לאירוע של
      </p>

      {/* Event name */}
      <h2 dir="rtl" style={{
        fontSize: "40px", fontWeight: 800, color: "#1c1c1c",
        letterSpacing: "-0.5px", textAlign: "center",
        lineHeight: 1.15, margin: "14px 0 0",
      }}>
        {eventName}
      </h2>

      {/* Date */}
      {eventDate && (
        <p style={{
          marginTop: "12px", fontSize: "12px", letterSpacing: "5px",
          color: "#c0c0c0", fontWeight: 600, margin: "12px 0 0",
        }}>
          {eventDate}
        </p>
      )}

      {/* Hairline accent */}
      <div style={{ width: "40px", height: "2px", background: accentColor, opacity: 0.85, margin: "26px 0" }} />

      {/* QR */}
      <div style={{
        background: "#fff",
        border: "1px solid #ececec",
        borderRadius: "16px",
        padding: "16px",
        boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
      }}>
        <img src={qrUrl} alt="QR" style={{ width: "156px", height: "156px", display: "block" }} />
      </div>

      {/* Invitation */}
      <p dir="rtl" style={{
        marginTop: "22px", fontSize: "16px", fontWeight: 600,
        color: "#3a3a3a", textAlign: "center", margin: "22px 0 0",
      }}>
        סרקו ושתפו את התמונות שלכם
      </p>
      <p dir="rtl" style={{
        marginTop: "5px", fontSize: "12px", color: "#aeaeae",
        fontWeight: 400, margin: "5px 0 0",
      }}>
        ללא צורך באפליקציה · מצטרפים בסריקה אחת
      </p>

      {/* Brand footer */}
      <p style={{
        position: "absolute", bottom: "26px",
        fontSize: "9px", fontFamily: "'Montserrat', sans-serif", fontWeight: 700,
        letterSpacing: "4px", color: "#cfcfcf", textTransform: "uppercase", margin: 0,
      }}>
        MemoriaShare
      </p>
    </div>
  );
}
