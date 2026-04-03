import { useState, useEffect } from "react";

/**
 * Extracts the dominant color from an image URL using a canvas.
 * Returns { accentColor, isLight } — accentColor is a hex string, isLight indicates
 * whether the extracted color is light (useful for choosing text contrast).
 */
export function useColorExtractor(imageUrl, fallback = "#6366f1") {
  const [accentColor, setAccentColor] = useState(fallback);
  const [isLight, setIsLight] = useState(false);

  useEffect(() => {
    if (!imageUrl) {
      setAccentColor(fallback);
      return;
    }

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        // Sample a small version for speed
        canvas.width = 50;
        canvas.height = 50;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, 50, 50);
        const data = ctx.getImageData(0, 0, 50, 50).data;

        let r = 0, g = 0, b = 0, count = 0;
        // Sample every 4th pixel, ignore very dark or very white pixels
        for (let i = 0; i < data.length; i += 16) {
          const pr = data[i], pg = data[i + 1], pb = data[i + 2];
          const brightness = (pr + pg + pb) / 3;
          if (brightness > 30 && brightness < 240) {
            r += pr; g += pg; b += pb; count++;
          }
        }

        if (count === 0) { setAccentColor(fallback); return; }
        r = Math.round(r / count);
        g = Math.round(g / count);
        b = Math.round(b / count);

        // Boost saturation: push away from grey
        const avg = (r + g + b) / 3;
        const BOOST = 1.4;
        r = Math.min(255, Math.round(avg + (r - avg) * BOOST));
        g = Math.min(255, Math.round(avg + (g - avg) * BOOST));
        b = Math.min(255, Math.round(avg + (b - avg) * BOOST));

        const hex = `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
        // Perceived luminance
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        setAccentColor(hex);
        setIsLight(luminance > 0.55);
      } catch {
        setAccentColor(fallback);
      }
    };
    img.onerror = () => setAccentColor(fallback);
    img.src = imageUrl;
  }, [imageUrl, fallback]);

  return { accentColor, isLight };
}