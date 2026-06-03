import { useState, useRef, useEffect } from 'react';

// Splits "Keren & Tomer" / "מיכל ותומר" / "A + B" into two parts.
// Mirror of splitNames() in compositePngFrame.js so the live camera preview
// and the final printed JPEG render the name identically.
function splitNames(name) {
  let p = name.split(/\s*&\s*/);   if (p.length === 2) return p;
  p = name.split(/\s+ו/);          if (p.length === 2) return p;
  p = name.split(/\s*\+\s*/);      if (p.length === 2) return p;
  return null;
}

/**
 * Renders a PNG frame's text_config (event name + date + icon) as an HTML
 * overlay that fills its positioned parent. Used by the camera WYSIWYG
 * viewfinder so the guest sees the full design (name, date, ♥) before capture
 * instead of a blank white strip.
 *
 * Font sizes mirror compositePngFrame.js: fontSizePx = cfg.size * frameHeightPx.
 * The parent must be position:relative with the frame's natural aspect ratio.
 *
 * @param {object} textConfig  - frame.text_config
 * @param {string} eventName   - event name (for inline-icon split)
 * @param {string} dateFmt     - already-formatted date label (he-IL)
 */
export default function FrameStripText({ textConfig, eventName, dateFmt }) {
  const [h, setH] = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([e]) => setH(e.contentRect.height));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);

  if (!textConfig) return null;

  const px = (size) => Math.max(7, Math.round((size || 0.028) * h));
  const en = textConfig.event_name;
  const dt = textConfig.date;
  const ic = textConfig.icon;
  const name  = eventName || 'Memoria';
  const parts = en?.inline_icon ? splitNames(name) : null;

  return (
    <div ref={ref} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      {/* Stacked icon (♡ above the name) */}
      {ic?.emoji && (
        <span style={{
          position: 'absolute', left: `${(ic.x ?? 0.5) * 100}%`, top: `${(ic.y || 0.78) * 100}%`,
          transform: 'translate(-50%, -50%)', fontFamily: 'serif',
          fontSize: Math.max(10, Math.round(0.045 * h)), lineHeight: 1,
        }}>{ic.emoji}</span>
      )}

      {/* Event name — inline-icon ("מיכל ♥ תומר") or plain centered */}
      {en && (
        <div style={{
          position: 'absolute', left: '50%', top: `${(en.y || 0.88) * 100}%`,
          transform: 'translate(-50%, -50%)', display: 'flex', alignItems: 'center',
          gap: Math.round(px(en.size) * 0.45), whiteSpace: 'nowrap',
          fontFamily: `'${en.font || 'Heebo'}', sans-serif`, fontWeight: en.weight || 'normal',
          fontSize: px(en.size), color: en.color || '#1a1a1a', lineHeight: 1,
        }}>
          {parts ? (
            <>
              <span>{parts[0].trim()}</span>
              <span style={{ fontFamily: 'serif', color: en.inline_icon_color || en.color }}>{en.inline_icon}</span>
              <span>{parts[1].trim()}</span>
            </>
          ) : name}
        </div>
      )}

      {/* Date */}
      {dt && dateFmt && (
        <div style={{
          position: 'absolute', left: '50%', top: `${(dt.y || 0.95) * 100}%`,
          transform: 'translate(-50%, -50%)', whiteSpace: 'nowrap',
          fontFamily: `'${dt.font || 'Heebo'}', sans-serif`, fontWeight: dt.weight || '400',
          fontSize: px(dt.size), color: dt.color || '#666666', lineHeight: 1,
        }}>{dateFmt}</div>
      )}
    </div>
  );
}
