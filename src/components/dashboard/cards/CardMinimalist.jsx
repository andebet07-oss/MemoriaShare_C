import React from "react";

/** Initials from the event name (strips the Hebrew "ו" connector). */
function getInitials(name = "") {
  const words = name.split(/\s+/).filter(Boolean).map(w => w.replace(/^ו/, "")).filter(Boolean);
  if (words.length === 0) return "✢"; // ✢ fallback
  if (words.length === 1) return words[0][0];
  return `${words[0][0]} · ${words[words.length - 1][0]}`;
}

/**
 * Theme — Monogram (white, modern-luxe, initials medallion on a hairline)
 */
export default function CardMinimalist({ eventName, eventDate, qrUrl, accentColor }) {
  const initials = getInitials(eventName);

  return (
    <div style={{
      width: "450px", height: "636px",
      background: "#ffffff",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      fontFamily: "'Suez One', serif",
      position: "relative", overflow: "hidden", boxSizing: "border-box",
      padding: "0 48px",
    }}>
      {/* Monogram medallion on a hairline */}
      <div style={{ position: "relative", width: "100%", display: "flex", justifyContent: "center", marginBottom: "30px" }}>
        <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: "1px", background: "#e7e7e7" }} />
        <div style={{
          position: "relative", width: "66px", height: "66px", borderRadius: "50%",
          background: "#fff", border: `1px solid ${accentColor}`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <span dir="rtl" style={{ fontSize: "22px", color: accentColor, fontWeight: 400, lineHeight: 1 }}>
            {initials}
          </span>
        </div>
      </div>

      {/* Welcome eyebrow */}
      <p dir="rtl" style={{
        fontSize: "14px", color: "#a7a7a7", fontWeight: 400,
        fontFamily: "'Heebo', sans-serif", letterSpacing: "1.5px", margin: 0,
      }}>
        ברוכים הבאים לאירוע של
      </p>

      {/* Event name */}
      <h2 dir="rtl" style={{
        fontSize: "40px", fontWeight: 400, color: "#1c1c1c",
        textAlign: "center", lineHeight: 1.2, margin: "12px 0 0",
      }}>
        {eventName}
      </h2>

      {/* Date */}
      {eventDate && (
        <p style={{
          marginTop: "14px", fontSize: "12px", letterSpacing: "5px",
          color: "#bdbdbd", fontFamily: "'Heebo', sans-serif", fontWeight: 600, margin: "14px 0 0",
        }}>
          {eventDate}
        </p>
      )}

      {/* QR */}
      <div style={{
        marginTop: "28px",
        background: "#fff",
        border: "1px solid #ededed",
        borderRadius: "14px",
        padding: "16px",
        boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
      }}>
        <img src={qrUrl} alt="QR" style={{ width: "152px", height: "152px", display: "block" }} />
      </div>

      {/* Invitation */}
      <p dir="rtl" style={{
        marginTop: "24px", fontSize: "17px", fontWeight: 400,
        color: "#333", textAlign: "center", fontFamily: "'Suez One', serif", margin: "24px 0 0",
      }}>
        סרקו ושתפו את התמונות שלכם
      </p>
      <p dir="rtl" style={{
        marginTop: "6px", fontSize: "12px", color: "#b0b0b0",
        fontFamily: "'Heebo', sans-serif", fontWeight: 400, margin: "6px 0 0",
      }}>
        ללא צורך באפליקציה · מצטרפים בסריקה אחת
      </p>

      {/* Brand footer */}
      <p style={{
        position: "absolute", bottom: "28px",
        fontSize: "9px", fontFamily: "'Montserrat', sans-serif", fontWeight: 700,
        letterSpacing: "4px", color: "#d0d0d0", textTransform: "uppercase", margin: 0,
      }}>
        MemoriaShare
      </p>
    </div>
  );
}
