import React from "react";

/**
 * Theme 2 — Elegant / Indigo
 */
export default function CardElegant({ eventName, eventDate, qrUrl, accentColor }) {
  const accent = accentColor;

  return (
    <div style={{
      width: "450px", height: "636px",
      background: "#1e1e1e",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      fontFamily: "'Playfair Display', serif",
      position: "relative", overflow: "hidden", boxSizing: "border-box",
    }}>
      {/* Decorative border — inset from edges, not affecting flow */}
      <div style={{
        position: "absolute", top: "16px", bottom: "16px",
        left: "16px", right: "16px",
        border: `1px solid ${accent}`, opacity: 0.55,
        borderRadius: "2px", pointerEvents: "none",
      }} />

      {/* Corner ornaments */}
      {[{ top: 8, left: 8 }, { top: 8, right: 8 }, { bottom: 8, left: 8 }, { bottom: 8, right: 8 }].map((pos, i) => (
        <div key={i} style={{
          position: "absolute", ...pos,
          width: "16px", height: "16px",
          border: `1px solid ${accent}`, opacity: 0.6,
        }} />
      ))}

      {/* Brand */}
      <p style={{
        fontSize: "9px", letterSpacing: "6px",
        color: accent, fontFamily: "Montserrat, sans-serif",
        fontWeight: 600, textTransform: "uppercase", opacity: 0.65,
        margin: 0,
      }}>
        MemoriaShare
      </p>

      {/* Ornamental rule */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", margin: "12px 0" }}>
        <div style={{ width: "44px", height: "1px", background: accent, opacity: 0.35 }} />
        <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: accent, opacity: 0.55 }} />
        <div style={{ width: "44px", height: "1px", background: accent, opacity: 0.35 }} />
      </div>

      {/* Event name */}
      <h2 dir="rtl" style={{
        fontSize: "40px", fontWeight: 700,
        color: "#fcfcfe", textAlign: "center",
        padding: "0 48px", lineHeight: 1.2, margin: 0,
      }}>
        {eventName}
      </h2>

      {/* Date */}
      <p style={{
        marginTop: "10px", fontSize: "12px",
        color: accent, letterSpacing: "4px",
        fontFamily: "Montserrat, sans-serif",
        fontWeight: 500, opacity: 0.75, margin: "10px 0 0",
      }}>
        {eventDate}
      </p>

      {/* QR */}
      <div style={{
        marginTop: "28px",
        background: "#fff",
        padding: "12px",
        borderRadius: "4px",
        border: `2px solid ${accent}`,
        boxShadow: `0 0 28px ${accent}1A`,
      }}>
        <img src={qrUrl} alt="QR" style={{ width: "148px", height: "148px", display: "block" }} />
      </div>

      {/* CTA — directly below QR */}
      <p dir="rtl" style={{
        marginTop: "14px", fontSize: "13px",
        color: "#b4b4b4", textAlign: "center",
        fontFamily: "Montserrat, sans-serif", fontWeight: 400, letterSpacing: "1px",
        margin: "14px 0 0",
      }}>
        סרקו ושתפו את הרגעים שלכם
      </p>
    </div>
  );
}