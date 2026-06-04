import React from "react";

/**
 * Theme 2 — Classic (light ivory, elegant Hebrew serif)
 * Warm off-white, Frank Ruhl Libre, a delicate dotted rule.
 */
export default function CardElegant({ eventName, eventDate, qrUrl, accentColor }) {
  return (
    <div style={{
      width: "450px", height: "636px",
      background: "#fffdf8",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      fontFamily: "'Frank Ruhl Libre', serif",
      position: "relative", overflow: "hidden", boxSizing: "border-box",
      padding: "0 48px",
    }}>
      {/* Welcome eyebrow */}
      <p dir="rtl" style={{
        fontSize: "15px", color: "#a99f8e", fontWeight: 400,
        fontFamily: "'Heebo', sans-serif", letterSpacing: "1px", margin: 0,
      }}>
        ברוכים הבאים לאירוע של
      </p>

      {/* Event name */}
      <h2 dir="rtl" style={{
        fontSize: "44px", fontWeight: 700, color: "#2c2620",
        textAlign: "center", lineHeight: 1.2, margin: "14px 0 0",
      }}>
        {eventName}
      </h2>

      {/* Ornamental dotted rule */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", margin: "20px 0" }}>
        <div style={{ width: "50px", height: "1px", background: accentColor, opacity: 0.4 }} />
        <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: accentColor, opacity: 0.6 }} />
        <div style={{ width: "50px", height: "1px", background: accentColor, opacity: 0.4 }} />
      </div>

      {/* Date */}
      {eventDate && (
        <p style={{
          fontSize: "13px", color: "#b3a690", letterSpacing: "4px",
          fontFamily: "'Heebo', sans-serif", fontWeight: 500, margin: 0,
        }}>
          {eventDate}
        </p>
      )}

      {/* QR */}
      <div style={{
        marginTop: "26px",
        background: "#fff",
        border: "1px solid #ece5d8",
        borderRadius: "10px",
        padding: "16px",
        boxShadow: "0 10px 30px rgba(120,100,60,0.08)",
      }}>
        <img src={qrUrl} alt="QR" style={{ width: "152px", height: "152px", display: "block" }} />
      </div>

      {/* Invitation */}
      <p dir="rtl" style={{
        marginTop: "22px", fontSize: "17px", color: "#4a4238",
        textAlign: "center", lineHeight: 1.4, margin: "22px 0 0",
      }}>
        הצטרפו אלינו לתיעוד הרגעים
      </p>
      <p dir="rtl" style={{
        marginTop: "4px", fontSize: "12px", color: "#b3a690",
        fontFamily: "'Heebo', sans-serif", fontWeight: 400, margin: "4px 0 0",
      }}>
        סרקו את הקוד ושתפו את התמונות שלכם
      </p>

      {/* Brand footer */}
      <p style={{
        position: "absolute", bottom: "26px",
        fontSize: "9px", fontFamily: "'Montserrat', sans-serif", fontWeight: 700,
        letterSpacing: "4px", color: "#d8cdb8", textTransform: "uppercase", margin: 0,
      }}>
        MemoriaShare
      </p>
    </div>
  );
}
