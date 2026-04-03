import React from "react";

/**
 * Theme 3 — Event-Specific (Blurred cover image as background)
 */
export default function CardBlurred({ eventName, eventDate, qrUrl, accentColor, coverImage }) {
  const hasCover = !!coverImage;

  return (
    <div style={{
      width: "450px", height: "636px",
      position: "relative", overflow: "hidden",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      fontFamily: "Montserrat, sans-serif", boxSizing: "border-box",
      background: hasCover ? "transparent" : "#1a1a2e",
    }}>
      {/* Blurred background */}
      {hasCover && (
        <>
          <img src={coverImage} alt="" style={{
            position: "absolute", inset: 0,
            width: "100%", height: "100%",
            objectFit: "cover",
            filter: "blur(20px) brightness(0.4) saturate(1.2)",
            transform: "scale(1.1)",
            pointerEvents: "none",
          }} />
          <div style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(180deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.65) 100%)",
          }} />
        </>
      )}

      {/* Content — vertically centered as a block */}
      <div style={{
        position: "relative", zIndex: 2,
        display: "flex", flexDirection: "column", alignItems: "center",
        gap: "0px", padding: "0 40px", textAlign: "center",
      }}>
        {/* Accent pill */}
        <div style={{
          display: "inline-block",
          background: accentColor,
          borderRadius: "100px",
          padding: "4px 16px",
          marginBottom: "16px",
        }}>
          <span style={{
            fontSize: "9px", fontWeight: 700, letterSpacing: "3px",
            color: "#fff", textTransform: "uppercase",
          }}>
            MemoriaShare
          </span>
        </div>

        {/* Event name */}
        <h2 dir="rtl" style={{
          fontSize: "38px", fontWeight: 700,
          color: "#FFFFFF", lineHeight: 1.2, margin: 0,
          fontFamily: "'Playfair Display', serif",
          textShadow: "0 2px 12px rgba(0,0,0,0.7)",
        }}>
          {eventName}
        </h2>

        {/* Date */}
        <p style={{
          marginTop: "8px", fontSize: "12px",
          color: "rgba(255,255,255,0.65)",
          letterSpacing: "4px", fontWeight: 500,
        }}>
          {eventDate}
        </p>

        {/* Frosted glass QR — sized to content only */}
        <div style={{
          marginTop: "24px",
          background: "rgba(255,255,255,0.13)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          border: "1px solid rgba(255,255,255,0.28)",
          borderRadius: "18px",
          padding: "16px",
          boxShadow: "0 10px 36px rgba(0,0,0,0.5)",
          display: "inline-flex",
        }}>
          <div style={{ background: "#fff", borderRadius: "8px", padding: "8px" }}>
            <img src={qrUrl} alt="QR" style={{ width: "148px", height: "148px", display: "block" }} />
          </div>
        </div>

        {/* CTA — tight below glass card */}
        <p dir="rtl" style={{
          marginTop: "14px", fontSize: "13px",
          color: "rgba(255,255,255,0.75)",
          fontWeight: 500,
          textShadow: "0 1px 4px rgba(0,0,0,0.5)",
        }}>
          סרקו ושתפו תמונות מהאירוע
        </p>
      </div>

      {/* Bottom gradient line */}
      <div style={{
        position: "absolute", bottom: 0, zIndex: 2,
        width: "100%", height: "4px",
        background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`,
      }} />
    </div>
  );
}