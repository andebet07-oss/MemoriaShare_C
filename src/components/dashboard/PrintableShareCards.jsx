import React, { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Check } from "lucide-react";
import { useColorExtractor } from "./useColorExtractor";
import CardMinimalist from "./cards/CardMinimalist";
import CardElegant from "./cards/CardElegant";
import CardBlurred from "./cards/CardBlurred";

const THEMES = [
  { id: "minimalist", label: "מינימליסטי", desc: "נקי ומודרני עם אקסנט צבע" },
  { id: "elegant",    label: "אלגנטי",     desc: "רקע כהה, מסגרות אינדיגו, סריף" },
  { id: "blurred",    label: "מותאם אירוע",desc: "תמונת הכריכה כרקע מטושטש" },
];

// High-res QR for printing: 600×600, black on white, no margin
function buildPrintQrUrl(rawQrUrl) {
  if (!rawQrUrl) return "";
  // Replace size param with 600x600 for crisp print output
  return rawQrUrl.replace(/size=\d+x\d+/, "size=600x600").replace(/margin=\d+/, "margin=12");
}

export default function PrintableShareCards({ event = {}, generateQRCode = () => "" }) {
  const exportRef = useRef(null);
  const [activeTheme, setActiveTheme] = useState("minimalist");
  const [isExporting, setIsExporting] = useState(false);
  const [html2canvasReady, setHtml2canvasReady] = useState(false);

  const safeEventName = typeof event?.name === "string" ? event.name : "שם האירוע";
  const safeEventDate = event?.date
    ? (() => {
        const d = new Date(event.date);
        if (isNaN(d)) return "";
        return `${String(d.getDate()).padStart(2,"0")}.${String(d.getMonth()+1).padStart(2,"0")}.${d.getFullYear()}`;
      })()
    : "";

  const { accentColor } = useColorExtractor(event?.cover_image, "#6366f1");
  const printQrUrl = buildPrintQrUrl(generateQRCode());

  // Load html2canvas once
  useEffect(() => {
    if (window.html2canvas) { setHtml2canvasReady(true); return; }
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
    s.async = true;
    s.onload = () => setHtml2canvasReady(true);
    document.head.appendChild(s);
  }, []);

  const handleDownload = async () => {
    if (!exportRef.current || !window.html2canvas) return;
    setIsExporting(true);
    try {
      await document.fonts.ready;
      await new Promise(r => setTimeout(r, 400));
      const canvas = await window.html2canvas(exportRef.current, {
        scale: 4,            // 4× → ~1800px wide — crisp on home printers
        backgroundColor: null,
        useCORS: true,
        logging: false,
      });
      const link = document.createElement("a");
      link.download = `${safeEventName}-${activeTheme}.png`;
      link.href = canvas.toDataURL("image/png", 1.0);
      link.click();
    } catch (e) {
      console.error("Export error:", e);
    }
    setIsExporting(false);
  };

  const cardProps = {
    eventName: safeEventName,
    eventDate: safeEventDate,
    qrUrl: printQrUrl,
    accentColor,
    coverImage: event?.cover_image,
  };

  const renderActiveCard = () => {
    switch (activeTheme) {
      case "minimalist": return <CardMinimalist {...cardProps} />;
      case "elegant":    return <CardElegant    {...cardProps} />;
      case "blurred":    return <CardBlurred    {...cardProps} />;
      default:           return <CardMinimalist {...cardProps} />;
    }
  };

  return (
    <div className="bg-[#1a1a1a] rounded-2xl p-6 mt-4 border border-gray-800" dir="rtl">
      <h2 className="text-lg font-black text-white mb-1">כרטיסיות שולחן להדפסה</h2>
      <p className="text-gray-400 text-xs mb-5">בחרו תבנית, הורידו PNG ברזולוציה גבוהה.</p>

      {/* Theme selector */}
      <div className="flex gap-2 mb-6">
        {THEMES.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTheme(t.id)}
            className={`flex-1 rounded-xl p-3 text-right transition-all border ${
              activeTheme === t.id
                ? "bg-indigo-600/20 border-indigo-500 text-white"
                : "bg-[#111] border-gray-800 text-gray-400 hover:border-gray-600"
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-bold">{t.label}</span>
              {activeTheme === t.id && <Check className="w-4 h-4 text-indigo-400" />}
            </div>
            <p className="text-[10px] text-gray-500 leading-tight">{t.desc}</p>
          </button>
        ))}
      </div>

      {/* Live preview — scaled down to fit the panel */}
      <div className="flex justify-center items-center bg-[#111] rounded-2xl mb-5 overflow-hidden border border-gray-800"
           style={{ height: "360px" }}>
        <div style={{ transform: "scale(0.54)", transformOrigin: "center center", flexShrink: 0 }}>
          {renderActiveCard()}
        </div>
      </div>

      {/* Hidden full-size element for html2canvas */}
      <div style={{ position: "absolute", left: "-9999px", top: 0, pointerEvents: "none" }}>
        <div ref={exportRef}>{renderActiveCard()}</div>
      </div>

      {/* Download button */}
      <Button
        onClick={handleDownload}
        disabled={isExporting || !html2canvasReady}
        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 h-auto rounded-xl flex items-center justify-center gap-2 transition-all"
      >
        {isExporting ? (
          <span className="animate-pulse">מייצא...</span>
        ) : (
          <>
            <Download size={18} />
            הורדה ברזולוציה גבוהה (PNG ×4)
          </>
        )}
      </Button>

      {/* A4 / Table-tent print CSS */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #print-card-area, #print-card-area * { visibility: visible !important; }
          #print-card-area {
            position: fixed !important;
            inset: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            background: white;
          }
          /* A4 page — 210mm × 297mm */
          @page {
            size: A4 portrait;
            margin: 15mm;
          }
        }
        /* Table-tent fold line — visible only on print */
        .fold-line {
          display: none;
        }
        @media print {
          .fold-line {
            display: block;
            width: 100%;
            border-top: 1px dashed #999;
            margin: 8mm 0;
          }
        }
      `}</style>
    </div>
  );
}