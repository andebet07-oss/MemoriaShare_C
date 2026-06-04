import React from "react";

/** Delicate olive sprig — curved stem with leaf ellipses. */
function Sprig({ color, mirror }) {
  return (
    <svg width="118" height="50" viewBox="0 0 110 46" fill="none"
      style={{ transform: mirror ? "scaleX(-1)" : "none", opacity: 0.55 }}>
      <path d="M6 42 C 34 34, 70 22, 104 6" fill="none" stroke={color} strokeWidth="1.1" strokeLinecap="round" />
      <g fill={color}>
        <ellipse cx="20" cy="36" rx="6"   ry="2.4" transform="rotate(-35 20 36)" />
        <ellipse cx="26" cy="33" rx="6"   ry="2.4" transform="rotate(25 26 33)" />
        <ellipse cx="40" cy="29" rx="6.5" ry="2.6" transform="rotate(-38 40 29)" />
        <ellipse cx="46" cy="26" rx="6.5" ry="2.6" transform="rotate(22 46 26)" />
        <ellipse cx="62" cy="21" rx="6.5" ry="2.6" transform="rotate(-40 62 21)" />
        <ellipse cx="68" cy="18" rx="6.5" ry="2.6" transform="rotate(20 68 18)" />
        <ellipse cx="84" cy="13" rx="6"   ry="2.4" transform="rotate(-42 84 13)" />
        <ellipse cx="90" cy="10" rx="6"   ry="2.4" transform="rotate(18 90 10)" />
        <ellipse cx="103" cy="6" rx="5"   ry="2"   transform="rotate(-45 103 6)" />
      </g>
    </svg>
  );
}

/**
 * Theme — Botanical (ivory, olive laurel, elegant serif)
 */
export default function CardElegant({ eventName, eventDate, qrUrl, accentColor }) {
  return (
    <div style={{
      width: "450px", height: "636px",
      background: "#fdfcf7",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      fontFamily: "'Frank Ruhl Libre', serif",
      position: "relative", overflow: "hidden", boxSizing: "border-box",
      padding: "0 46px",
    }}>
      {/* Olive laurel — two mirrored sprigs meeting at top centre */}
      <div style={{ display: "flex", justifyContent: "center", alignItems: "flex-end", marginBottom: "10px", gap: "0px" }}>
        <Sprig color={accentColor} />
        <Sprig color={accentColor} mirror />
      </div>

      {/* Welcome eyebrow */}
      <p dir="rtl" style={{
        fontSize: "15px", color: "#a89a7e", fontWeight: 400,
        fontFamily: "'Heebo', sans-serif", letterSpacing: "1.5px", margin: 0,
      }}>
        ברוכים הבאים לאירוע של
      </p>

      {/* Event name */}
      <h2 dir="rtl" style={{
        fontSize: "46px", fontWeight: 700, color: "#2b2620",
        textAlign: "center", lineHeight: 1.18, margin: "10px 0 0",
      }}>
        {eventName}
      </h2>

      {/* Sparkle divider */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", margin: "18px 0 14px" }}>
        <div style={{ width: "44px", height: "1px", background: accentColor, opacity: 0.4 }} />
        <span style={{ color: accentColor, fontSize: "14px", opacity: 0.75, lineHeight: 1 }}>&#10022;</span>
        <div style={{ width: "44px", height: "1px", background: accentColor, opacity: 0.4 }} />
      </div>

      {/* Date */}
      {eventDate && (
        <p style={{
          fontSize: "13px", color: "#b3a78d", letterSpacing: "5px",
          fontFamily: "'Heebo', sans-serif", fontWeight: 500, margin: 0,
        }}>
          {eventDate}
        </p>
      )}

      {/* QR with corner brackets */}
      <div style={{ position: "relative", marginTop: "26px", padding: "18px" }}>
        {[
          { top: 0, left: 0, bl: "1.5px", bt: "1.5px" },
          { top: 0, right: 0, br: "1.5px", bt: "1.5px" },
          { bottom: 0, left: 0, bl: "1.5px", bb: "1.5px" },
          { bottom: 0, right: 0, br: "1.5px", bb: "1.5px" },
        ].map((c, i) => (
          <div key={i} style={{
            position: "absolute", width: "16px", height: "16px",
            top: c.top, bottom: c.bottom, left: c.left, right: c.right,
            borderLeft: c.bl ? `${c.bl} solid ${accentColor}` : undefined,
            borderRight: c.br ? `${c.br} solid ${accentColor}` : undefined,
            borderTop: c.bt ? `${c.bt} solid ${accentColor}` : undefined,
            borderBottom: c.bb ? `${c.bb} solid ${accentColor}` : undefined,
            opacity: 0.55,
          }} />
        ))}
        <div style={{ background: "#fff", borderRadius: "6px", padding: "10px" }}>
          <img src={qrUrl} alt="QR" style={{ width: "150px", height: "150px", display: "block" }} />
        </div>
      </div>

      {/* Invitation */}
      <p dir="rtl" style={{
        marginTop: "22px", fontSize: "18px", color: "#4a4238",
        textAlign: "center", lineHeight: 1.4, margin: "22px 0 0",
      }}>
        הצטרפו אלינו לתיעוד הרגעים
      </p>
      <p dir="rtl" style={{
        marginTop: "5px", fontSize: "12px", color: "#b3a78d",
        fontFamily: "'Heebo', sans-serif", fontWeight: 400, margin: "5px 0 0",
      }}>
        סרקו את הקוד ושתפו את התמונות שלכם
      </p>

      {/* Brand footer */}
      <p style={{
        position: "absolute", bottom: "26px",
        fontSize: "9px", fontFamily: "'Montserrat', sans-serif", fontWeight: 700,
        letterSpacing: "4px", color: "#d6caa8", textTransform: "uppercase", margin: 0,
      }}>
        MemoriaShare
      </p>
    </div>
  );
}
