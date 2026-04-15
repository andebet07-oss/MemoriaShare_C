/**
 * framePacks.js — Memoria Magnet frame system v2
 *
 * ARCHITECTURE:
 *   The label strip BELOW the photo is the frame design surface.
 *   The photo itself is clean — at most a subtle vignette or hairline corner accent.
 *   This matches the premium magnet aesthetic from reference prints.
 *
 * drawFrame(ctx, w, totalH, photoH, event)
 *   ctx    — 2D canvas context (canvas = photo + label combined)
 *   w      — canvas / photo width
 *   totalH — full canvas height (photo + label)
 *   photoH — photo height (y where label starts)
 *   event  — { name: string, date: string | null }  (date = "YYYY-MM-DD")
 *
 * LABEL_H_RATIO — multiply by canvas width to get label height.
 * Export and use in compositeAndSubmit to size the canvas correctly.
 */

export const LABEL_H_RATIO = 0.225; // label = 22.5% of width (e.g. 243px for 1080px wide)

// ─── Label zone ────────────────────────────────────────────────────────────────

function lz(photoH, totalH) {
  return { y: photoH, h: totalH - photoH };
}

// ─── Shared photo decorations (always subtle — never block faces) ─────────────

/** Soft radial vignette over the photo edges only */
function photoVignette(ctx, w, photoH, strength = 0.32) {
  const g = ctx.createRadialGradient(w / 2, photoH / 2, photoH * 0.28, w / 2, photoH / 2, photoH * 0.78);
  g.addColorStop(0, 'transparent');
  g.addColorStop(1, `rgba(0,0,0,${strength})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, photoH);
}

/** Hairline border around the photo area only */
function photoBorder(ctx, w, photoH, color = 'rgba(255,255,255,0.12)', lw = 1) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = lw;
  ctx.strokeRect(lw / 2, lw / 2, w - lw, photoH - lw);
  ctx.restore();
}

// ─── Label helpers ─────────────────────────────────────────────────────────────

function fillLabel(ctx, w, photoH, totalH, color = '#ffffff') {
  const z = lz(photoH, totalH);
  ctx.fillStyle = color;
  ctx.fillRect(0, z.y, w, z.h);
}

/** Thin horizontal rule at the very top of the label */
function labelRuleTop(ctx, w, photoH, color = 'rgba(201,169,110,0.4)', lw = 1) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = lw;
  ctx.beginPath();
  ctx.moveTo(0, photoH + lw / 2);
  ctx.lineTo(w, photoH + lw / 2);
  ctx.stroke();
  ctx.restore();
}

/** Pair of thin horizontal rules flanking the name */
function labelDoubleRule(ctx, w, photoH, totalH, opts = {}) {
  const z = lz(photoH, totalH);
  const { color = 'rgba(0,0,0,0.12)', lw = 0.5, yRatio = 0.44, pad = 0.08 } = opts;
  const y = z.y + z.h * yRatio;
  const x1 = w * pad, x2 = w * (1 - pad);
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = lw;
  const gap = Math.round(w * 0.042) + 4;
  ctx.beginPath(); ctx.moveTo(x1, y - gap); ctx.lineTo(x2, y - gap); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x1, y + gap); ctx.lineTo(x2, y + gap); ctx.stroke();
  ctx.restore();
}

/**
 * Draw the event name in the label zone with auto-shrink.
 * Uses Playfair Display (English glyphs) → Heebo fallback (Hebrew glyphs).
 */
function drawName(ctx, w, photoH, totalH, event, opts = {}) {
  if (!event?.name) return;
  const z = lz(photoH, totalH);
  const {
    baseFontSize = w * 0.062,
    font = (sz) => `600 ${Math.round(sz)}px 'Playfair Display','Heebo','Assistant',Georgia,serif`,
    color = '#1a1a1a',
    yRatio = 0.44,
    maxWidthRatio = 0.86,
    letterSpacing = 0,
  } = opts;

  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.direction = 'rtl';
  const maxW = w * maxWidthRatio;
  let sz = baseFontSize;
  ctx.font = font(sz);
  while (ctx.measureText(event.name).width > maxW && sz > w * 0.028) {
    sz -= 0.5;
    ctx.font = font(sz);
  }
  ctx.fillStyle = color;
  if (letterSpacing) ctx.letterSpacing = `${letterSpacing}px`;
  ctx.fillText(event.name, w / 2, z.y + z.h * yRatio);
  ctx.letterSpacing = '0px';
  ctx.restore();
}

/**
 * Draw a formatted date string (DD.MM.YYYY) in the label zone.
 */
function drawDate(ctx, w, photoH, totalH, event, opts = {}) {
  if (!event?.date) return;
  const z = lz(photoH, totalH);
  const {
    fontSize = w * 0.026,
    font = (sz) => `300 ${Math.round(sz)}px 'Montserrat','Heebo',sans-serif`,
    color = 'rgba(0,0,0,0.33)',
    yRatio = 0.80,
    letterSpacing = w * 0.005,
  } = opts;
  const d = new Date(event.date + 'T00:00:00');
  const str = `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.direction = 'ltr';
  ctx.font = font(fontSize);
  ctx.fillStyle = color;
  ctx.letterSpacing = `${letterSpacing}px`;
  ctx.fillText(str, w / 2, z.y + z.h * yRatio);
  ctx.letterSpacing = '0px';
  ctx.restore();
}

/** Small ornament glyph centered horizontally */
function ornament(ctx, x, y, char = '✦', size = null, color = 'rgba(201,169,110,0.75)') {
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `${size || 11}px serif`;
  ctx.fillStyle = color;
  ctx.fillText(char, x, y);
  ctx.restore();
}

/** Star of David shape */
function starOfDavid(ctx, cx, cy, r, color = 'rgba(201,169,110,0.55)') {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = r * 0.16;
  ctx.lineJoin = 'round';
  for (const startA of [-Math.PI / 2, Math.PI / 2]) {
    ctx.beginPath();
    for (let i = 0; i < 3; i++) {
      const a = startA + (i * 2 * Math.PI) / 3;
      i === 0 ? ctx.moveTo(cx + r * Math.cos(a), cy + r * Math.sin(a))
              : ctx.lineTo(cx + r * Math.cos(a), cy + r * Math.sin(a));
    }
    ctx.closePath();
    ctx.stroke();
  }
  ctx.restore();
}

/** Delicate botanical corner marks (two bezier curves + dot, mirrored 4 corners) */
function botanicalCorners(ctx, w, photoH, opacity = 0.22) {
  const s = w * 0.18;
  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = w * 0.004;
  ctx.lineCap = 'round';

  const drawOne = () => {
    ctx.beginPath();
    ctx.moveTo(s * 0.06, s * 0.32);
    ctx.bezierCurveTo(s * 0.06, s * 0.14, s * 0.14, s * 0.06, s * 0.32, s * 0.06);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(s * 0.06, s * 0.17);
    ctx.bezierCurveTo(s * 0.10, s * 0.08, s * 0.22, s * 0.06, s * 0.27, s * 0.10);
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(s * 0.06, s * 0.32, w * 0.009, 0, Math.PI * 2);
    ctx.fill();
  };

  [[0, 0, 1, 1], [w, 0, -1, 1], [0, photoH, 1, -1], [w, photoH, -1, -1]].forEach(([tx, ty, sx2, sy2]) => {
    ctx.save(); ctx.translate(tx, ty); ctx.scale(sx2, sy2); drawOne(); ctx.restore();
  });
  ctx.restore();
}

/** Sepia-warm tint over the photo */
function sepiaOverlay(ctx, w, photoH, alpha = 0.18) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = '#7a5c2e';
  ctx.fillRect(0, 0, w, photoH);
  ctx.restore();
}

/** Very subtle film grain texture using canvas noise */
function filmGrain(ctx, w, photoH, alpha = 0.04) {
  const grainCanvas = document.createElement('canvas');
  grainCanvas.width = w; grainCanvas.height = photoH;
  const gctx = grainCanvas.getContext('2d');
  const imgData = gctx.createImageData(w, photoH);
  let seed = 1234567;
  const rand = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  for (let i = 0; i < imgData.data.length; i += 4) {
    const v = Math.round(rand() * 255);
    imgData.data[i] = imgData.data[i + 1] = imgData.data[i + 2] = v;
    imgData.data[i + 3] = Math.round(rand() * 40);
  }
  gctx.putImageData(imgData, 0, 0);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.drawImage(grainCanvas, 0, 0);
  ctx.restore();
}

/** Confetti pattern (deterministic RNG, stays in photo area) */
function confetti(ctx, w, photoH) {
  const colors = ['#ff6b9d', '#ffd93d', '#6bcb77', '#4d96ff', '#ff9f43', '#a29bfe'];
  let rng = 42;
  const rand = () => { rng = (rng * 1664525 + 1013904223) >>> 0; return rng / 0xffffffff; };
  ctx.save();
  for (let i = 0; i < 36; i++) {
    const x = rand() * w, y = rand() * photoH;
    const r = (rand() * 0.018 + 0.005) * w;
    ctx.globalAlpha = 0.45 + rand() * 0.4;
    ctx.fillStyle = colors[Math.floor(rand() * colors.length)];
    if (rand() > 0.45) {
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    } else {
      ctx.save(); ctx.translate(x, y); ctx.rotate(rand() * Math.PI);
      ctx.fillRect(-r * 1.5, -r * 0.5, r * 3, r); ctx.restore();
    }
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

// ─── Extended helpers: ornate icons & decorative elements ─────────────────────

/** Small tagline text (e.g. "Mr & Mrs", "Together Forever") above or below name */
function drawTagline(ctx, w, photoH, totalH, text, opts = {}) {
  if (!text) return;
  const z = lz(photoH, totalH);
  const {
    fontSize = w * 0.021,
    font = (sz) => `400 ${Math.round(sz)}px 'Montserrat','Heebo',sans-serif`,
    color = 'rgba(201,169,110,0.85)',
    yRatio = 0.20,
    letterSpacing = w * 0.011,
    direction = 'ltr',
  } = opts;
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.direction = direction;
  ctx.font = font(fontSize);
  ctx.fillStyle = color;
  ctx.letterSpacing = `${letterSpacing}px`;
  ctx.fillText(text, w / 2, z.y + z.h * yRatio);
  ctx.letterSpacing = '0px';
  ctx.restore();
}

/** Minimal crown outline — elegant, not cartoonish */
function drawCrownIcon(ctx, cx, cy, size, color = 'rgba(201,169,110,0.7)') {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = size * 0.08;
  ctx.lineJoin = 'round';
  const s = size;
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.5, cy + s * 0.35);
  ctx.lineTo(cx - s * 0.5, cy - s * 0.05);
  ctx.lineTo(cx - s * 0.25, cy + s * 0.12);
  ctx.lineTo(cx, cy - s * 0.32);
  ctx.lineTo(cx + s * 0.25, cy + s * 0.12);
  ctx.lineTo(cx + s * 0.5, cy - s * 0.05);
  ctx.lineTo(cx + s * 0.5, cy + s * 0.35);
  ctx.closePath();
  ctx.stroke();
  // Crown base line
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.5, cy + s * 0.25);
  ctx.lineTo(cx + s * 0.5, cy + s * 0.25);
  ctx.stroke();
  // Three gem dots
  for (const dx of [-0.5, 0, 0.5]) {
    ctx.beginPath();
    ctx.arc(cx + dx * s, dx === 0 ? cy - s * 0.32 : cy - s * 0.05, s * 0.06, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/** Two interlocking wedding rings */
function drawRingsIcon(ctx, cx, cy, r, color = 'rgba(201,169,110,0.75)') {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = r * 0.18;
  ctx.beginPath(); ctx.arc(cx - r * 0.45, cy, r, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.arc(cx + r * 0.45, cy, r, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();
}

/** Simple pacifier/baby icon for brit events */
function drawBabyIcon(ctx, cx, cy, size, color = 'rgba(140,170,210,0.75)') {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = size * 0.08;
  const s = size;
  // Head
  ctx.beginPath(); ctx.arc(cx, cy - s * 0.15, s * 0.45, 0, Math.PI * 2); ctx.stroke();
  // Small pacifier base
  ctx.beginPath(); ctx.arc(cx, cy + s * 0.45, s * 0.18, 0, Math.PI * 2); ctx.stroke();
  // Connector
  ctx.beginPath(); ctx.moveTo(cx, cy + s * 0.27); ctx.lineTo(cx, cy + s * 0.37); ctx.stroke();
  ctx.restore();
}

/** Stylized Torah scroll icon */
function drawTorahIcon(ctx, cx, cy, size, color = 'rgba(201,169,110,0.7)') {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = size * 0.08;
  const s = size;
  // Two vertical rollers
  ctx.beginPath(); ctx.moveTo(cx - s * 0.45, cy - s * 0.45); ctx.lineTo(cx - s * 0.45, cy + s * 0.45); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx + s * 0.45, cy - s * 0.45); ctx.lineTo(cx + s * 0.45, cy + s * 0.45); ctx.stroke();
  // Top & bottom caps
  ctx.beginPath(); ctx.arc(cx - s * 0.45, cy - s * 0.45, s * 0.1, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + s * 0.45, cy - s * 0.45, s * 0.1, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx - s * 0.45, cy + s * 0.45, s * 0.1, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + s * 0.45, cy + s * 0.45, s * 0.1, 0, Math.PI * 2); ctx.fill();
  // Scroll body
  ctx.lineWidth = size * 0.05;
  ctx.beginPath(); ctx.moveTo(cx - s * 0.35, cy - s * 0.3); ctx.lineTo(cx + s * 0.35, cy - s * 0.3); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx - s * 0.35, cy); ctx.lineTo(cx + s * 0.35, cy); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx - s * 0.35, cy + s * 0.3); ctx.lineTo(cx + s * 0.35, cy + s * 0.3); ctx.stroke();
  ctx.restore();
}

/** Delicate floral wreath — semicircle of small leaves on each side of a center */
function drawFloralWreath(ctx, cx, cy, r, color = 'rgba(120,150,90,0.55)') {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = r * 0.05;
  ctx.lineCap = 'round';
  // Left arc
  for (let i = 0; i < 6; i++) {
    const a = Math.PI * (0.55 + i * 0.08);
    const x = cx + r * Math.cos(a);
    const y = cy + r * Math.sin(a);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(a + Math.PI / 2);
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 0.18, r * 0.06, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  // Right arc (mirrored)
  for (let i = 0; i < 6; i++) {
    const a = Math.PI * (0.45 - i * 0.08);
    const x = cx + r * Math.cos(a);
    const y = cy + r * Math.sin(a);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(a + Math.PI / 2);
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 0.18, r * 0.06, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}

/** Circular monogram: large initial letter inside a gold ring */
function drawMonogramCircle(ctx, cx, cy, r, letter, color = 'rgba(201,169,110,0.85)') {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = r * 0.04;
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.arc(cx, cy, r * 0.88, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `italic 400 ${Math.round(r * 1.15)}px 'Cormorant Garamond','Playfair Display',Georgia,serif`;
  ctx.fillText(letter || '', cx, cy + r * 0.03);
  ctx.restore();
}

// ─── Frame definitions ─────────────────────────────────────────────────────────

const WEDDING_FRAMES = [
  {
    id: 'wedding-classic',
    name: 'קלאסי',
    previewBg: 'linear-gradient(180deg,#2a2018 65%,#ffffff 65%)',
    drawFrame(ctx, w, totalH, photoH, event) {
      photoVignette(ctx, w, photoH, 0.28);
      fillLabel(ctx, w, photoH, totalH, '#ffffff');
      labelRuleTop(ctx, w, photoH, 'rgba(201,169,110,0.45)', 1);
      // Gold ornament dot centered at rule
      ornament(ctx, w / 2, photoH + (totalH - photoH) * 0.14, '✦', Math.round(w * 0.02), 'rgba(201,169,110,0.6)');
      drawName(ctx, w, photoH, totalH, event, { yRatio: 0.46 });
      drawDate(ctx, w, photoH, totalH, event, { yRatio: 0.80 });
    },
  },
  {
    id: 'wedding-editorial',
    name: 'עורכי',
    previewBg: 'linear-gradient(180deg,#1e1410 65%,#f8f6f2 65%)',
    drawFrame(ctx, w, totalH, photoH, event) {
      photoVignette(ctx, w, photoH, 0.22);
      fillLabel(ctx, w, photoH, totalH, '#f8f6f2');
      // Thin double rule flanking name
      labelDoubleRule(ctx, w, photoH, totalH, { color: 'rgba(0,0,0,0.1)', lw: 0.5, yRatio: 0.44, pad: 0.1 });
      drawName(ctx, w, photoH, totalH, event, {
        font: (sz) => `600 ${Math.round(sz)}px 'Playfair Display','Heebo',Georgia,serif`,
        color: '#111111',
        yRatio: 0.44,
        letterSpacing: w * 0.001,
      });
      drawDate(ctx, w, photoH, totalH, event, {
        color: 'rgba(0,0,0,0.3)',
        letterSpacing: w * 0.007,
        yRatio: 0.80,
      });
    },
  },
  {
    id: 'wedding-arch',
    name: 'קשת זהב',
    previewBg: 'linear-gradient(180deg,#100e08 65%,#ffffff 65%)',
    drawFrame(ctx, w, totalH, photoH, event) {
      // Subtle gold arch in top area of photo
      photoVignette(ctx, w, photoH, 0.3);
      ctx.save();
      ctx.strokeStyle = 'rgba(201,169,110,0.35)';
      ctx.lineWidth = w * 0.006;
      ctx.beginPath();
      ctx.arc(w / 2, photoH * 0.05, w * 0.38, 0, Math.PI);
      ctx.stroke();
      // Diamond corner marks
      const dm = w * 0.032;
      ctx.fillStyle = 'rgba(201,169,110,0.4)';
      [[w * 0.04, photoH * 0.04], [w * 0.96, photoH * 0.04]].forEach(([cx, cy]) => {
        ctx.save(); ctx.translate(cx, cy); ctx.rotate(Math.PI / 4);
        ctx.fillRect(-dm / 2, -dm / 2, dm, dm); ctx.restore();
      });
      ctx.restore();
      fillLabel(ctx, w, photoH, totalH, '#ffffff');
      labelRuleTop(ctx, w, photoH, 'rgba(201,169,110,0.5)', 1);
      drawName(ctx, w, photoH, totalH, event, {
        font: (sz) => `600 ${Math.round(sz)}px 'Playfair Display','Heebo',Georgia,serif`,
        color: '#111111',
        yRatio: 0.46,
      });
      drawDate(ctx, w, photoH, totalH, event, {
        color: 'rgba(201,169,110,0.75)',
        fontSize: w * 0.024,
        letterSpacing: w * 0.008,
        yRatio: 0.82,
      });
    },
  },
  {
    id: 'wedding-emerald',
    name: 'אמרלד',
    previewBg: 'linear-gradient(180deg,#0a1f16 65%,#0f3a28 65%)',
    drawFrame(ctx, w, totalH, photoH, event) {
      photoVignette(ctx, w, photoH, 0.24);
      // Emerald label
      fillLabel(ctx, w, photoH, totalH, '#0f3a28');
      // Gold hairline at top of label
      labelRuleTop(ctx, w, photoH, 'rgba(223,195,140,0.75)', 1);
      drawTagline(ctx, w, photoH, totalH, 'MR & MRS', {
        color: 'rgba(223,195,140,0.85)',
        yRatio: 0.20,
        letterSpacing: w * 0.014,
      });
      drawName(ctx, w, photoH, totalH, event, {
        font: (sz) => `italic 500 ${Math.round(sz * 1.05)}px 'Cormorant Garamond','Playfair Display','Heebo',Georgia,serif`,
        color: '#f5ecd6',
        yRatio: 0.54,
      });
      drawDate(ctx, w, photoH, totalH, event, {
        color: 'rgba(223,195,140,0.65)',
        letterSpacing: w * 0.008,
        yRatio: 0.84,
      });
    },
  },
  {
    id: 'wedding-burgundy',
    name: 'בורדו ורד',
    previewBg: 'linear-gradient(180deg,#1a0a0c 65%,#4a1822 65%)',
    drawFrame(ctx, w, totalH, photoH, event) {
      photoVignette(ctx, w, photoH, 0.28);
      fillLabel(ctx, w, photoH, totalH, '#4a1822');
      // Rose gold rule
      labelRuleTop(ctx, w, photoH, 'rgba(232,184,160,0.7)', 1);
      ornament(ctx, w / 2, photoH + (totalH - photoH) * 0.17, '❧', Math.round(w * 0.024), 'rgba(232,184,160,0.8)');
      drawName(ctx, w, photoH, totalH, event, {
        font: (sz) => `400 ${Math.round(sz)}px 'Bodoni Moda','Playfair Display','Heebo',Georgia,serif`,
        color: '#f7e6d9',
        yRatio: 0.52,
      });
      drawDate(ctx, w, photoH, totalH, event, {
        color: 'rgba(232,184,160,0.6)',
        letterSpacing: w * 0.008,
        yRatio: 0.84,
      });
    },
  },
  {
    id: 'wedding-romance',
    name: 'רומנטי',
    previewBg: 'linear-gradient(180deg,#2a1810 65%,#fdf5ec 65%)',
    drawFrame(ctx, w, totalH, photoH, event) {
      photoVignette(ctx, w, photoH, 0.22);
      fillLabel(ctx, w, photoH, totalH, '#fdf5ec');
      drawTagline(ctx, w, photoH, totalH, 'Forever & Always', {
        color: 'rgba(180,130,90,0.85)',
        font: (sz) => `400 ${Math.round(sz * 1.4)}px 'Great Vibes',cursive`,
        yRatio: 0.22,
        letterSpacing: 0,
      });
      drawName(ctx, w, photoH, totalH, event, {
        font: (sz) => `400 ${Math.round(sz * 1.1)}px 'Parisienne','Great Vibes','Heebo',cursive`,
        color: '#3a2416',
        yRatio: 0.55,
      });
      drawDate(ctx, w, photoH, totalH, event, {
        color: 'rgba(120,80,50,0.5)',
        font: (sz) => `300 ${Math.round(sz * 0.9)}px 'Cormorant Garamond','Montserrat',serif`,
        letterSpacing: w * 0.008,
        yRatio: 0.86,
      });
    },
  },
  {
    id: 'wedding-monogram',
    name: 'מונוגרמה',
    previewBg: 'linear-gradient(180deg,#141010 65%,#f6f1e9 65%)',
    drawFrame(ctx, w, totalH, photoH, event) {
      photoVignette(ctx, w, photoH, 0.3);
      fillLabel(ctx, w, photoH, totalH, '#f6f1e9');
      const z = lz(photoH, totalH);
      // Monogram circle on left side of label
      const firstChar = (event?.name || '').trim().charAt(0) || 'M';
      const cr = z.h * 0.32;
      drawMonogramCircle(ctx, w * 0.14, z.y + z.h * 0.5, cr, firstChar, 'rgba(178,140,78,0.9)');
      // Name centered in remaining space
      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.direction = 'rtl';
      const maxW = w * 0.68;
      let sz = w * 0.055;
      const font = (s) => `600 ${Math.round(s)}px 'Playfair Display','Heebo',Georgia,serif`;
      ctx.font = font(sz);
      while (ctx.measureText(event?.name || '').width > maxW && sz > w * 0.028) {
        sz -= 0.5; ctx.font = font(sz);
      }
      ctx.fillStyle = '#1a1a1a';
      ctx.fillText(event?.name || '', w * 0.58, z.y + z.h * 0.44);
      ctx.restore();
      drawDate(ctx, w, photoH, totalH, event, {
        color: 'rgba(178,140,78,0.7)',
        letterSpacing: w * 0.01,
        yRatio: 0.78,
      });
    },
  },
  {
    id: 'wedding-botanical',
    name: 'בוטני',
    previewBg: 'linear-gradient(180deg,#0d2215 65%,#f4f0eb 65%)',
    drawFrame(ctx, w, totalH, photoH, event) {
      photoVignette(ctx, w, photoH, 0.25);
      botanicalCorners(ctx, w, photoH, 0.24);
      fillLabel(ctx, w, photoH, totalH, '#f4f0eb');
      // Thin olive rule
      labelRuleTop(ctx, w, photoH, 'rgba(60,80,40,0.18)', 1);
      // Small leaf ornament
      ornament(ctx, w / 2, photoH + (totalH - photoH) * 0.20, '✿', Math.round(w * 0.022), 'rgba(80,110,60,0.45)');
      drawName(ctx, w, photoH, totalH, event, {
        font: (sz) => `400 ${Math.round(sz)}px 'Playfair Display','Heebo',Georgia,serif`,
        color: '#2a3020',
        yRatio: 0.52,
      });
      drawDate(ctx, w, photoH, totalH, event, {
        color: 'rgba(42,48,32,0.4)',
        yRatio: 0.82,
      });
    },
  },
];

const BAR_MITZVAH_FRAMES = [
  {
    id: 'bar-jerusalem',
    name: 'ירושלים',
    previewBg: 'linear-gradient(180deg,#120e06 65%,#fdf8ee 65%)',
    drawFrame(ctx, w, totalH, photoH, event) {
      photoVignette(ctx, w, photoH, 0.3);
      // Subtle Star of David in top-center photo area
      starOfDavid(ctx, w / 2, photoH * 0.11, w * 0.055, 'rgba(201,169,110,0.32)');
      fillLabel(ctx, w, photoH, totalH, '#fdf8ee');
      labelRuleTop(ctx, w, photoH, 'rgba(201,169,110,0.55)', 1);
      ornament(ctx, w / 2, photoH + (totalH - photoH) * 0.16, '✡', Math.round(w * 0.019), 'rgba(201,169,110,0.65)');
      drawName(ctx, w, photoH, totalH, event, {
        font: (sz) => `600 ${Math.round(sz)}px 'Playfair Display','Heebo',Georgia,serif`,
        color: '#2a1f08',
        yRatio: 0.48,
      });
      drawDate(ctx, w, photoH, totalH, event, {
        color: 'rgba(201,169,110,0.8)',
        letterSpacing: w * 0.006,
        yRatio: 0.82,
      });
    },
  },
  {
    id: 'bar-electric',
    name: 'אנרגיה',
    previewBg: 'linear-gradient(180deg,#07071a 65%,#0e0e22 65%)',
    drawFrame(ctx, w, totalH, photoH, event) {
      photoVignette(ctx, w, photoH, 0.32);
      // Neon border on photo only (inner)
      ctx.save();
      ctx.shadowColor = 'rgba(120,80,255,0.85)';
      ctx.shadowBlur = w * 0.04;
      ctx.strokeStyle = 'rgba(130,90,255,0.65)';
      ctx.lineWidth = w * 0.006;
      const m = w * 0.025;
      ctx.strokeRect(m, m, w - 2 * m, photoH - 2 * m);
      ctx.restore();
      // Dark label
      fillLabel(ctx, w, photoH, totalH, '#0e0e22');
      // Violet accent rule
      const z = lz(photoH, totalH);
      ctx.save();
      ctx.strokeStyle = 'rgba(130,90,255,0.6)';
      ctx.lineWidth = 1.5;
      ctx.shadowColor = 'rgba(130,90,255,0.8)';
      ctx.shadowBlur = 6;
      ctx.beginPath(); ctx.moveTo(0, photoH + 1); ctx.lineTo(w, photoH + 1); ctx.stroke();
      ctx.restore();
      drawName(ctx, w, photoH, totalH, event, {
        font: (sz) => `700 ${Math.round(sz)}px 'Heebo','Assistant',sans-serif`,
        color: 'rgba(210,195,255,0.96)',
        yRatio: 0.46,
      });
      drawDate(ctx, w, photoH, totalH, event, {
        color: 'rgba(160,140,255,0.6)',
        font: (sz) => `300 ${Math.round(sz)}px 'Montserrat',sans-serif`,
        letterSpacing: w * 0.007,
        yRatio: 0.82,
      });
    },
  },
  {
    id: 'bar-retro',
    name: 'רטרו',
    previewBg: 'linear-gradient(180deg,#1a0818 65%,#fff0f8 65%)',
    drawFrame(ctx, w, totalH, photoH, event) {
      // Synthwave color tint on photo
      ctx.save();
      ctx.globalAlpha = 0.15;
      const tg = ctx.createLinearGradient(0, 0, w, photoH);
      tg.addColorStop(0, '#ff00cc');
      tg.addColorStop(1, '#3300ff');
      ctx.fillStyle = tg;
      ctx.fillRect(0, 0, w, photoH);
      ctx.restore();
      photoVignette(ctx, w, photoH, 0.28);
      // Neon pink border on photo
      ctx.save();
      ctx.strokeStyle = 'rgba(255,80,200,0.45)';
      ctx.lineWidth = w * 0.005;
      const m = w * 0.022;
      ctx.strokeRect(m, m, w - 2 * m, photoH - 2 * m);
      ctx.restore();
      fillLabel(ctx, w, photoH, totalH, '#fff0f8');
      labelRuleTop(ctx, w, photoH, 'rgba(255,80,200,0.45)', 1.5);
      drawName(ctx, w, photoH, totalH, event, {
        font: (sz) => `800 ${Math.round(sz)}px 'Heebo','Assistant',sans-serif`,
        color: '#2a0020',
        yRatio: 0.46,
      });
      drawDate(ctx, w, photoH, totalH, event, {
        color: 'rgba(200,0,150,0.5)',
        letterSpacing: w * 0.007,
        yRatio: 0.82,
      });
    },
  },
  {
    id: 'bar-royal',
    name: 'מלכותי',
    previewBg: 'linear-gradient(180deg,#070c1c 65%,#0f1a38 65%)',
    drawFrame(ctx, w, totalH, photoH, event) {
      photoVignette(ctx, w, photoH, 0.3);
      fillLabel(ctx, w, photoH, totalH, '#0f1a38');
      labelRuleTop(ctx, w, photoH, 'rgba(218,180,108,0.8)', 1.2);
      const z = lz(photoH, totalH);
      drawCrownIcon(ctx, w / 2, z.y + z.h * 0.18, w * 0.03, 'rgba(218,180,108,0.85)');
      drawTagline(ctx, w, photoH, totalH, 'בר מצווה', {
        color: 'rgba(218,180,108,0.85)',
        font: (sz) => `500 ${Math.round(sz)}px 'Heebo','Frank Ruhl Libre',sans-serif`,
        yRatio: 0.32,
        letterSpacing: w * 0.008,
        direction: 'rtl',
      });
      drawName(ctx, w, photoH, totalH, event, {
        font: (sz) => `700 ${Math.round(sz)}px 'Frank Ruhl Libre','Heebo',Georgia,serif`,
        color: '#f6ecd4',
        yRatio: 0.58,
      });
      drawDate(ctx, w, photoH, totalH, event, {
        color: 'rgba(218,180,108,0.6)',
        letterSpacing: w * 0.008,
        yRatio: 0.86,
      });
    },
  },
  {
    id: 'bar-hebrew-classic',
    name: 'הקלאסי העברי',
    previewBg: 'linear-gradient(180deg,#120a04 65%,#f5ecd6 65%)',
    drawFrame(ctx, w, totalH, photoH, event) {
      photoVignette(ctx, w, photoH, 0.3);
      fillLabel(ctx, w, photoH, totalH, '#f5ecd6');
      labelRuleTop(ctx, w, photoH, 'rgba(143,102,40,0.6)', 1);
      const z = lz(photoH, totalH);
      drawTorahIcon(ctx, w / 2, z.y + z.h * 0.19, w * 0.028, 'rgba(143,102,40,0.75)');
      drawName(ctx, w, photoH, totalH, event, {
        font: (sz) => `700 ${Math.round(sz)}px 'Frank Ruhl Libre','Heebo',Georgia,serif`,
        color: '#3d2610',
        yRatio: 0.58,
      });
      drawDate(ctx, w, photoH, totalH, event, {
        color: 'rgba(143,102,40,0.7)',
        font: (sz) => `400 ${Math.round(sz)}px 'Bellefair','Montserrat',serif`,
        letterSpacing: w * 0.008,
        yRatio: 0.87,
      });
    },
  },
  {
    id: 'bat-rose',
    name: 'ורד בת',
    previewBg: 'linear-gradient(180deg,#2a0f1a 65%,#fce4ee 65%)',
    drawFrame(ctx, w, totalH, photoH, event) {
      photoVignette(ctx, w, photoH, 0.2);
      // Soft rose tint
      ctx.save();
      ctx.globalAlpha = 0.08;
      ctx.fillStyle = '#ff9ec7';
      ctx.fillRect(0, 0, w, photoH);
      ctx.restore();
      fillLabel(ctx, w, photoH, totalH, '#fce4ee');
      labelRuleTop(ctx, w, photoH, 'rgba(220,130,170,0.6)', 1);
      const z = lz(photoH, totalH);
      drawFloralWreath(ctx, w / 2, z.y + z.h * 0.44, w * 0.08, 'rgba(190,100,140,0.5)');
      drawName(ctx, w, photoH, totalH, event, {
        font: (sz) => `400 ${Math.round(sz * 1.05)}px 'Parisienne','Great Vibes','Heebo',cursive`,
        color: '#4a1530',
        yRatio: 0.48,
      });
      drawDate(ctx, w, photoH, totalH, event, {
        color: 'rgba(190,100,140,0.7)',
        letterSpacing: w * 0.008,
        yRatio: 0.86,
      });
    },
  },
];

const BRIT_FRAMES = [
  {
    id: 'brit-boy',
    name: 'ברית בן',
    previewBg: 'linear-gradient(180deg,#0a1420 65%,#dde8f2 65%)',
    drawFrame(ctx, w, totalH, photoH, event) {
      photoVignette(ctx, w, photoH, 0.22);
      fillLabel(ctx, w, photoH, totalH, '#dde8f2');
      labelRuleTop(ctx, w, photoH, 'rgba(100,140,180,0.6)', 1);
      const z = lz(photoH, totalH);
      drawBabyIcon(ctx, w / 2, z.y + z.h * 0.20, w * 0.025, 'rgba(100,140,180,0.8)');
      drawTagline(ctx, w, photoH, totalH, 'ברוך הבא', {
        color: 'rgba(80,115,160,0.85)',
        font: (sz) => `500 ${Math.round(sz)}px 'Frank Ruhl Libre','Heebo',serif`,
        yRatio: 0.37,
        letterSpacing: w * 0.004,
        direction: 'rtl',
      });
      drawName(ctx, w, photoH, totalH, event, {
        font: (sz) => `700 ${Math.round(sz)}px 'Frank Ruhl Libre','Heebo',Georgia,serif`,
        color: '#0a1a35',
        yRatio: 0.62,
      });
      drawDate(ctx, w, photoH, totalH, event, {
        color: 'rgba(80,115,160,0.7)',
        letterSpacing: w * 0.008,
        yRatio: 0.88,
      });
    },
  },
  {
    id: 'brit-elegant',
    name: 'אלגנט לבן',
    previewBg: 'linear-gradient(180deg,#0d0d18 65%,#faf7f0 65%)',
    drawFrame(ctx, w, totalH, photoH, event) {
      photoVignette(ctx, w, photoH, 0.26);
      fillLabel(ctx, w, photoH, totalH, '#faf7f0');
      labelRuleTop(ctx, w, photoH, 'rgba(40,55,90,0.35)', 0.8);
      const z = lz(photoH, totalH);
      drawCrownIcon(ctx, w / 2, z.y + z.h * 0.18, w * 0.025, 'rgba(40,55,90,0.7)');
      drawTagline(ctx, w, photoH, totalH, 'בן שמונה ימים', {
        color: 'rgba(60,75,110,0.75)',
        font: (sz) => `400 ${Math.round(sz)}px 'Frank Ruhl Libre','Heebo',serif`,
        yRatio: 0.33,
        letterSpacing: w * 0.003,
        direction: 'rtl',
      });
      drawName(ctx, w, photoH, totalH, event, {
        font: (sz) => `500 ${Math.round(sz)}px 'Bodoni Moda','Playfair Display','Heebo',Georgia,serif`,
        color: '#101e3b',
        yRatio: 0.60,
      });
      drawDate(ctx, w, photoH, totalH, event, {
        color: 'rgba(40,55,90,0.55)',
        letterSpacing: w * 0.009,
        yRatio: 0.88,
      });
    },
  },
  {
    id: 'brit-mint',
    name: 'מנטה רך',
    previewBg: 'linear-gradient(180deg,#0a1815 65%,#e5f2ea 65%)',
    drawFrame(ctx, w, totalH, photoH, event) {
      photoVignette(ctx, w, photoH, 0.22);
      fillLabel(ctx, w, photoH, totalH, '#e5f2ea');
      labelRuleTop(ctx, w, photoH, 'rgba(90,140,110,0.55)', 1);
      const z = lz(photoH, totalH);
      drawFloralWreath(ctx, w / 2, z.y + z.h * 0.4, w * 0.07, 'rgba(90,140,110,0.55)');
      drawName(ctx, w, photoH, totalH, event, {
        font: (sz) => `400 ${Math.round(sz)}px 'Cormorant Garamond','Playfair Display','Heebo',Georgia,serif`,
        color: '#0f2d20',
        yRatio: 0.48,
      });
      drawDate(ctx, w, photoH, totalH, event, {
        color: 'rgba(90,140,110,0.7)',
        letterSpacing: w * 0.008,
        yRatio: 0.86,
      });
    },
  },
];

const BIRTHDAY_FRAMES = [
  {
    id: 'birthday-party',
    name: 'מסיבה',
    previewBg: 'linear-gradient(180deg,#12081e 65%,#ffffff 65%)',
    drawFrame(ctx, w, totalH, photoH, event) {
      confetti(ctx, w, photoH);
      // Confetti fade — top of photo stays relatively clean
      const fg = ctx.createLinearGradient(0, 0, 0, photoH);
      fg.addColorStop(0, 'rgba(0,0,0,0.38)');
      fg.addColorStop(0.25, 'rgba(0,0,0,0)');
      fg.addColorStop(0.8, 'rgba(0,0,0,0)');
      fg.addColorStop(1, 'rgba(0,0,0,0.22)');
      ctx.fillStyle = fg;
      ctx.fillRect(0, 0, w, photoH);
      fillLabel(ctx, w, photoH, totalH, '#ffffff');
      labelRuleTop(ctx, w, photoH, 'rgba(255,107,157,0.55)', 1.5);
      drawName(ctx, w, photoH, totalH, event, {
        font: (sz) => `700 ${Math.round(sz)}px 'Heebo','Assistant',sans-serif`,
        color: '#1a1a1a',
        yRatio: 0.46,
      });
      drawDate(ctx, w, photoH, totalH, event, {
        color: 'rgba(255,107,157,0.7)',
        yRatio: 0.82,
      });
    },
  },
  {
    id: 'birthday-neon',
    name: 'ניאון',
    previewBg: 'linear-gradient(180deg,#0f0614 65%,#120820 65%)',
    drawFrame(ctx, w, totalH, photoH, event) {
      photoVignette(ctx, w, photoH, 0.3);
      ctx.save();
      ctx.shadowColor = 'rgba(255,60,210,0.9)';
      ctx.shadowBlur = w * 0.05;
      ctx.strokeStyle = 'rgba(255,80,220,0.6)';
      ctx.lineWidth = w * 0.006;
      const m = w * 0.025;
      ctx.strokeRect(m, m, w - 2 * m, photoH - 2 * m);
      ctx.restore();
      fillLabel(ctx, w, photoH, totalH, '#120820');
      const z = lz(photoH, totalH);
      ctx.save();
      ctx.strokeStyle = 'rgba(255,80,220,0.7)';
      ctx.lineWidth = 1.5;
      ctx.shadowColor = 'rgba(255,60,210,0.9)';
      ctx.shadowBlur = 8;
      ctx.beginPath(); ctx.moveTo(0, photoH + 1); ctx.lineTo(w, photoH + 1); ctx.stroke();
      ctx.restore();
      drawName(ctx, w, photoH, totalH, event, {
        font: (sz) => `700 ${Math.round(sz)}px 'Heebo','Assistant',sans-serif`,
        color: 'rgba(255,210,255,0.97)',
        yRatio: 0.46,
      });
      drawDate(ctx, w, photoH, totalH, event, {
        color: 'rgba(255,130,230,0.65)',
        yRatio: 0.82,
      });
    },
  },
  {
    id: 'birthday-pastel',
    name: 'פסטל',
    previewBg: 'linear-gradient(180deg,#1a0e22 65%,#f5f0ff 65%)',
    drawFrame(ctx, w, totalH, photoH, event) {
      photoVignette(ctx, w, photoH, 0.2);
      // Lavender tint
      ctx.save();
      ctx.globalAlpha = 0.1;
      ctx.fillStyle = '#b09aff';
      ctx.fillRect(0, 0, w, photoH);
      ctx.restore();
      // Pastel border on photo
      ctx.save();
      ctx.strokeStyle = 'rgba(180,150,255,0.5)';
      ctx.lineWidth = w * 0.005;
      const m = w * 0.022;
      ctx.strokeRect(m, m, w - 2 * m, photoH - 2 * m);
      ctx.restore();
      fillLabel(ctx, w, photoH, totalH, '#f5f0ff');
      labelRuleTop(ctx, w, photoH, 'rgba(160,130,230,0.45)', 1);
      ornament(ctx, w / 2, photoH + (totalH - photoH) * 0.18, '✿', Math.round(w * 0.02), 'rgba(160,130,230,0.55)');
      drawName(ctx, w, photoH, totalH, event, {
        font: (sz) => `600 ${Math.round(sz)}px 'Playfair Display','Heebo',Georgia,serif`,
        color: '#2a1a40',
        yRatio: 0.50,
      });
      drawDate(ctx, w, photoH, totalH, event, {
        color: 'rgba(130,100,200,0.55)',
        yRatio: 0.83,
      });
    },
  },
];

const CORPORATE_FRAMES = [
  {
    id: 'corp-executive',
    name: 'מקצועי',
    previewBg: 'linear-gradient(180deg,#0c0c0e 65%,#ffffff 65%)',
    drawFrame(ctx, w, totalH, photoH, event) {
      photoVignette(ctx, w, photoH, 0.35);
      fillLabel(ctx, w, photoH, totalH, '#ffffff');
      // Minimal: just a hairline rule
      labelRuleTop(ctx, w, photoH, 'rgba(0,0,0,0.12)', 0.5);
      drawName(ctx, w, photoH, totalH, event, {
        font: (sz) => `300 ${Math.round(sz)}px 'Montserrat','Heebo',sans-serif`,
        color: '#111111',
        yRatio: 0.44,
        letterSpacing: w * 0.004,
      });
      drawDate(ctx, w, photoH, totalH, event, {
        color: 'rgba(201,169,110,0.8)',
        letterSpacing: w * 0.008,
        yRatio: 0.82,
      });
    },
  },
  {
    id: 'corp-gradient',
    name: 'מודרני',
    previewBg: 'linear-gradient(180deg,#0a0c14 65%,#f4f6ff 65%)',
    drawFrame(ctx, w, totalH, photoH, event) {
      photoVignette(ctx, w, photoH, 0.28);
      // Subtle gradient border on photo
      ctx.save();
      const m = w * 0.022;
      const lw = w * 0.007;
      const grad = ctx.createLinearGradient(m, m, w - m, photoH - m);
      grad.addColorStop(0, 'rgba(80,120,255,0.5)');
      grad.addColorStop(0.5, 'rgba(201,169,110,0.5)');
      grad.addColorStop(1, 'rgba(80,200,255,0.5)');
      ctx.strokeStyle = grad;
      ctx.lineWidth = lw;
      ctx.shadowColor = 'rgba(100,150,255,0.3)';
      ctx.shadowBlur = w * 0.03;
      ctx.strokeRect(m, m, w - 2 * m, photoH - 2 * m);
      ctx.restore();
      fillLabel(ctx, w, photoH, totalH, '#f4f6ff');
      // Gradient rule
      const z = lz(photoH, totalH);
      ctx.save();
      const rg = ctx.createLinearGradient(0, 0, w, 0);
      rg.addColorStop(0, 'rgba(80,120,255,0.4)');
      rg.addColorStop(0.5, 'rgba(201,169,110,0.4)');
      rg.addColorStop(1, 'rgba(80,200,255,0.4)');
      ctx.strokeStyle = rg;
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(0, photoH + 1); ctx.lineTo(w, photoH + 1); ctx.stroke();
      ctx.restore();
      drawName(ctx, w, photoH, totalH, event, {
        font: (sz) => `600 ${Math.round(sz)}px 'Montserrat','Heebo',sans-serif`,
        color: '#0a0c1e',
        letterSpacing: w * 0.003,
        yRatio: 0.44,
      });
      drawDate(ctx, w, photoH, totalH, event, {
        color: 'rgba(80,120,255,0.6)',
        letterSpacing: w * 0.007,
        yRatio: 0.82,
      });
    },
  },
];

const GENERAL_FRAMES = [
  {
    id: 'general-cinema',
    name: 'קולנוע',
    previewBg: 'linear-gradient(180deg,#050505 65%,#0a0a0a 65%)',
    drawFrame(ctx, w, totalH, photoH, event) {
      // Letterbox bars on photo
      const barH = photoH * 0.12;
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, w, barH);
      ctx.fillRect(0, photoH - barH, w, barH);
      // Photo vignette in remaining area
      photoVignette(ctx, w, photoH, 0.22);
      // Dark label
      fillLabel(ctx, w, photoH, totalH, '#0a0a0a');
      labelRuleTop(ctx, w, photoH, 'rgba(255,255,255,0.08)', 1);
      drawName(ctx, w, photoH, totalH, event, {
        font: (sz) => `300 ${Math.round(sz)}px 'Montserrat','Heebo',sans-serif`,
        color: 'rgba(255,255,255,0.88)',
        letterSpacing: w * 0.008,
        yRatio: 0.46,
      });
      drawDate(ctx, w, photoH, totalH, event, {
        color: 'rgba(255,255,255,0.3)',
        letterSpacing: w * 0.01,
        yRatio: 0.82,
      });
    },
  },
  {
    id: 'general-minimal',
    name: 'מינימל',
    previewBg: 'linear-gradient(180deg,#111111 65%,#fafafa 65%)',
    drawFrame(ctx, w, totalH, photoH, event) {
      photoVignette(ctx, w, photoH, 0.22);
      fillLabel(ctx, w, photoH, totalH, '#fafafa');
      // Pure hairline
      labelRuleTop(ctx, w, photoH, 'rgba(0,0,0,0.1)', 0.5);
      drawName(ctx, w, photoH, totalH, event, {
        font: (sz) => `400 ${Math.round(sz)}px 'Playfair Display','Heebo',Georgia,serif`,
        color: '#111111',
        yRatio: 0.44,
      });
      drawDate(ctx, w, photoH, totalH, event, {
        color: 'rgba(0,0,0,0.28)',
        letterSpacing: w * 0.007,
        yRatio: 0.80,
      });
    },
  },
];

// ─── Exports ───────────────────────────────────────────────────────────────────

export const FRAME_PACKS = {
  wedding:     WEDDING_FRAMES,
  bar_mitzvah: BAR_MITZVAH_FRAMES,
  brit:        BRIT_FRAMES,
  birthday:    BIRTHDAY_FRAMES,
  corporate:   CORPORATE_FRAMES,
  general:     GENERAL_FRAMES,
};

/** Returns the most relevant frame pack based on event name. */
export function getFramePack(eventName = '') {
  const n = eventName.toLowerCase();
  if (n.includes('ברית') || n.includes('brit') || n.includes('circumcision'))                   return BRIT_FRAMES;
  if (n.includes('חתונה') || n.includes('wedding'))                                             return WEDDING_FRAMES;
  if (n.includes('בר מצווה') || n.includes('בת מצווה') || n.includes('bar mitzvah') || n.includes('bat mitzvah')) return BAR_MITZVAH_FRAMES;
  if (n.includes('יום הולדת') || n.includes('birthday'))                                        return BIRTHDAY_FRAMES;
  if (n.includes('חברה') || n.includes('corporate') || n.includes('company') || n.includes('עסקי')) return CORPORATE_FRAMES;
  return GENERAL_FRAMES;
}

/** Returns ALL frames flat — for admin frame picker. */
export const ALL_FRAMES = [
  ...WEDDING_FRAMES,
  ...BAR_MITZVAH_FRAMES,
  ...BRIT_FRAMES,
  ...BIRTHDAY_FRAMES,
  ...CORPORATE_FRAMES,
  ...GENERAL_FRAMES,
];
