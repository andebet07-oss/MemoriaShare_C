import React from "react";

const MemoriaLogo = ({ color = "#111" }) => (
  <span style={{
    fontSize: "10px", fontFamily: "Montserrat, sans-serif", fontWeight: 700,
    letterSpacing: "4px", color, textTransform: "uppercase", opacity: 0.45,
  }}>
    MemoriaShare
  </span>
);

/**
 * Theme 1 — Minimalist / Modern
 */
export default function CardMinimalist({ eventName, eventDate, qrUrl, accentColor }) {
  return (
    <div style={{
      width: "450px", height: "636px",
      background: "#FAFAFA",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      fontFamily: "Montserrat, sans-serif",
      position: "relative", overflow: "hidden", boxSizing: "border-box",
      gap: 0,
    }}>
      {/* Top accent line */}
      <div style={{ position: "absolute", top: 0, width: "100%", height: "4px", background: accentColor }} />

      {/* Logo */}
      <MemoriaLogo color="#111" />

      {/* Thin rule */}
      <div style={{ width: "32px", height: "1px", background: accentColor, margin: "14px 0" }} />

      {/* Event name */}
      <h2 dir="rtl" style={{
        fontSize: "36px", fontWeight: 700, color: "#111",
        letterSpacing: "-0.5px", textAlign: "center",
        padding: "0 40px", lineHeight: 1.15, margin: 0,
      }}>
        {eventName}
      </h2>

      {/* Date */}
      <p style={{
        marginTop: "8px", fontSize: "12px", letterSpacing: "4px",
        color: "#999", fontWeight: 500, textTransform: "uppercase", marginBottom: 0,
      }}>
        {eventDate}
      </p>

      {/* QR */}
      <div style={{
        marginTop: "28px",
        background: "#fff",
        border: `2px solid ${accentColor}`,
        borderRadius: "12px",
        padding: "14px",
        boxShadow: "0 8px 24px rgba(0,0,0,0.07)",
      }}>
        <img src={qrUrl} alt="QR" style={{ width: "150px", height: "150px", display: "block" }} />
      </div>

      {/* CTA — tight below QR */}
      <p dir="rtl" style={{
        marginTop: "14px", fontSize: "14px", fontWeight: 600,
        color: "#444", textAlign: "center", marginBottom: 0,
      }}>
        סרקו ושתפו תמונות מהאירוע
      </p>
      <p style={{
        fontSize: "10px", color: "#bbb", marginTop: "3px",
        letterSpacing: "2px", textTransform: "uppercase",
      }}>
        No app required
      </p>

      {/* Bottom accent line */}
      <div style={{ position: "absolute", bottom: 0, width: "100%", height: "4px", background: accentColor }} />
    </div>
  );
}