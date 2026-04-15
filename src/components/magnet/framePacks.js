/**
 * framePacks.js — Memoria Magnet frame system
 *
 * Each frame:
 *   id          — unique string
 *   name        — Hebrew display label
 *   previewBg   — CSS background for the picker thumbnail
 *   drawFrame(ctx, w, h, event) — draws ON TOP of the already-painted photo canvas
 *
 * event: { name: string, date: string | null }  (date = "YYYY-MM-DD")
 */

// ─── Shared helpers ────────────────────────────────────────────────────────────

function drawEventText(ctx, w, h, event, opts = {}) {
  const {
    nameColor  = 'rgba(255,255,255,0.93)',
    dateColor  = 'rgba(255,255,255,0.52)',
    nameFont   = `bold ${Math.round(w * 0.064)}px 'Playfair Display',Georgia,serif`,
    dateFont   = `${Math.round(w * 0.037)}px 'Heebo',sans-serif`,
    gradientOpacity = 0.82,
  } = opts;

  const oh = h * 0.22;
  const g  = ctx.createLinearGradient(0, h - oh, 0, h);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, `rgba(0,0,0,${gradientOpacity})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, h - oh, w, oh);

  ctx.textAlign = 'center';
  ctx.font      = nameFont;
  ctx.fillStyle = nameColor;
  ctx.fillText(event?.name || '', w / 2, h - oh * 0.38);

  if (event?.date) {
    ctx.font      = dateFont;
    ctx.fillStyle = dateColor;
    ctx.fillText(
      new Intl.DateTimeFormat('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' })
        .format(new Date(event.date + 'T00:00:00')),
      w / 2, h - oh * 0.14,
    );
  }
}

function drawGoldBorder(ctx, w, h, inset = 0.032, alpha = 0.65, lineW = 0.009) {
  ctx.strokeStyle = `rgba(201,169,110,${alpha})`;
  ctx.lineWidth   = w * lineW;
  ctx.strokeRect(w * inset, h * inset, w * (1 - 2 * inset), h * (1 - 2 * inset));
}

function drawBotanicalCorners(ctx, w, h) {
  const s = w * 0.24;
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.38)';
  ctx.lineWidth   = w * 0.0045;
  ctx.lineCap     = 'round';

  const drawOne = () => {
    ctx.beginPath();
    ctx.moveTo(s * 0.06, s * 0.35);
    ctx.bezierCurveTo(s * 0.06, s * 0.17, s * 0.17, s * 0.06, s * 0.35, s * 0.06);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(s * 0.06, s * 0.21);
    ctx.bezierCurveTo(s * 0.1, s * 0.11, s * 0.18, s * 0.07, s * 0.25, s * 0.1);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(s * 0.14, s * 0.08);
    ctx.bezierCurveTo(s * 0.21, s * 0.03, s * 0.3, s * 0.07, s * 0.28, s * 0.16);
    ctx.bezierCurveTo(s * 0.24, s * 0.22, s * 0.14, s * 0.18, s * 0.14, s * 0.08);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.42)';
    [[s * 0.06, s * 0.35], [s * 0.35, s * 0.06], [s * 0.19, s * 0.07], [s * 0.08, s * 0.21]].forEach(([x, y]) => {
      ctx.beginPath(); ctx.arc(x, y, w * 0.016, 0, Math.PI * 2); ctx.fill();
    });
  };

  const corners = [[0, 0, 1, 1], [w, 0, -1, 1], [0, h, 1, -1], [w, h, -1, -1]];
  corners.forEach(([tx, ty, sx2, sy2]) => {
    ctx.save(); ctx.translate(tx, ty); ctx.scale(sx2, sy2); drawOne(); ctx.restore();
  });
  ctx.restore();
}

function drawNeonBorder(ctx, w, h, color, glowColor, inset = 0.025) {
  ctx.save();
  const ix = w * inset, iy = h * inset;
  ctx.shadowColor = glowColor;
  ctx.shadowBlur  = w * 0.07;
  ctx.strokeStyle = color;
  ctx.lineWidth   = w * 0.008;
  ctx.strokeRect(ix, iy, w - 2 * ix, h - 2 * iy);
  ctx.shadowBlur  = w * 0.025;
  ctx.strokeRect(ix, iy, w - 2 * ix, h - 2 * iy);
  ctx.restore();
}

function drawFilmStrip(ctx, w, h) {
  const strip = w * 0.068;
  const holeW = strip * 0.62, holeH = strip * 0.42, holeR = strip * 0.12;
  const holeCount = 9;
  ctx.fillStyle = 'rgba(0,0,0,0.72)';
  ctx.fillRect(0, 0, strip, h);
  ctx.fillRect(w - strip, 0, strip, h);
  ctx.fillStyle = 'rgba(22,22,22,0.95)';
  for (let i = 0; i < holeCount; i++) {
    const y = (h / holeCount) * (i + 0.5);
    [w * 0.008, w - strip + w * 0.012].forEach(x => {
      ctx.beginPath();
      ctx.roundRect(x, y - holeH / 2, holeW, holeH, holeR);
      ctx.fill();
    });
  }
  ctx.fillStyle = 'rgba(160,110,40,0.14)';
  ctx.fillRect(strip, 0, w - 2 * strip, h);
}

function drawStarOfDavid(ctx, cx, cy, r, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth   = r * 0.14;
  ctx.lineJoin    = 'round';
  for (const [startAngle] of [[-Math.PI / 2], [Math.PI / 2]]) {
    ctx.beginPath();
    for (let i = 0; i < 3; i++) {
      const a = startAngle + (i * 2 * Math.PI) / 3;
      i === 0 ? ctx.moveTo(cx + r * Math.cos(a), cy + r * Math.sin(a))
              : ctx.lineTo(cx + r * Math.cos(a), cy + r * Math.sin(a));
    }
    ctx.closePath();
    ctx.stroke();
  }
  ctx.restore();
}

function drawConfetti(ctx, w, h) {
  const colors = ['#ff6b9d', '#ffd93d', '#6bcb77', '#4d96ff', '#ff9f43', '#a29bfe', '#ff6348'];
  let rng = 42;
  const rand = () => { rng = (rng * 1664525 + 1013904223) >>> 0; return rng / 0xffffffff; };
  for (let i = 0; i < 46; i++) {
    const x = rand() * w, y = rand() * h;
    const r = (rand() * 0.022 + 0.007) * w;
    ctx.globalAlpha = 0.55 + rand() * 0.4;
    ctx.fillStyle   = colors[Math.floor(rand() * colors.length)];
    if (rand() > 0.45) {
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    } else {
      ctx.save(); ctx.translate(x, y); ctx.rotate(rand() * Math.PI);
      ctx.fillRect(-r * 1.6, -r * 0.6, r * 3.2, r * 1.2); ctx.restore();
    }
  }
  ctx.globalAlpha = 1;
}

function drawCinemaLetterbox(ctx, w, h, event) {
  const barH = h * 0.13;
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, w, barH);
  ctx.fillRect(0, h - barH, w, barH);
  ctx.textAlign = 'center';
  ctx.font = `300 ${Math.round(w * 0.038)}px 'Montserrat','Heebo',sans-serif`;
  ctx.fillStyle = 'rgba(255,255,255,0.72)';
  ctx.letterSpacing = `${w * 0.008}px`;
  const t = event?.name?.toUpperCase() || '';
  ctx.fillText(t, w / 2, h - barH * 0.42);
  if (event?.date) {
    ctx.font = `${Math.round(w * 0.03)}px 'Montserrat','Heebo',sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.38)';
    ctx.fillText(
      new Intl.DateTimeFormat('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' })
        .format(new Date(event.date + 'T00:00:00')),
      w / 2, h - barH * 0.18,
    );
  }
  ctx.letterSpacing = '0px';
}

// ─── Frame definitions ─────────────────────────────────────────────────────────

const WEDDING_FRAMES = [
  {
    id: 'wedding-classic',
    name: 'קלאסי',
    previewBg: 'linear-gradient(160deg,#1a1410 0%,#0d0a08 100%)',
    drawFrame(ctx, w, h, event) {
      drawEventText(ctx, w, h, event);
      drawGoldBorder(ctx, w, h);
    },
  },
  {
    id: 'wedding-botanical',
    name: 'בוטני',
    previewBg: 'linear-gradient(160deg,#0d2215 0%,#07100b 100%)',
    drawFrame(ctx, w, h, event) {
      ctx.fillStyle = 'rgba(10,35,18,0.32)';
      ctx.fillRect(0, 0, w, h);
      const vg = ctx.createRadialGradient(w / 2, h * 0.45, h * 0.18, w / 2, h * 0.45, h * 0.72);
      vg.addColorStop(0, 'transparent');
      vg.addColorStop(1, 'rgba(0,18,8,0.68)');
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, w, h);
      drawBotanicalCorners(ctx, w, h);
      drawEventText(ctx, w, h, event, { nameColor: 'rgba(255,255,255,0.92)', gradientOpacity: 0.78 });
    },
  },
  {
    id: 'wedding-arch',
    name: 'קשת זהב',
    previewBg: 'linear-gradient(160deg,#110e06 0%,#08070a 100%)',
    drawFrame(ctx, w, h, event) {
      const margin = w * 0.038;
      ctx.strokeStyle = 'rgba(201,169,110,0.68)';
      ctx.lineWidth = w * 0.008;
      ctx.strokeRect(margin, margin, w - 2 * margin, h - 2 * margin);
      ctx.strokeStyle = 'rgba(201,169,110,0.28)';
      ctx.lineWidth = w * 0.0025;
      const m2 = margin + w * 0.018;
      ctx.strokeRect(m2, m2, w - 2 * m2, h - 2 * m2);
      ctx.strokeStyle = 'rgba(201,169,110,0.60)';
      ctx.lineWidth = w * 0.007;
      ctx.beginPath();
      ctx.arc(w / 2, margin, (w - 2 * margin) * 0.32, Math.PI, 0);
      ctx.stroke();
      const cs = w * 0.038;
      ctx.fillStyle = 'rgba(201,169,110,0.52)';
      [[margin, margin], [w - margin, margin], [margin, h - margin], [w - margin, h - margin]].forEach(([cx, cy]) => {
        ctx.save(); ctx.translate(cx, cy); ctx.rotate(Math.PI / 4);
        ctx.fillRect(-cs / 2, -cs / 2, cs, cs); ctx.restore();
      });
      drawEventText(ctx, w, h, event, { nameColor: 'rgba(224,196,140,0.95)', dateColor: 'rgba(201,169,110,0.6)' });
    },
  },
  {
    id: 'wedding-film',
    name: 'פילם וינטג׳',
    previewBg: 'linear-gradient(160deg,#1a1208 0%,#0e0c07 100%)',
    drawFrame(ctx, w, h, event) {
      drawFilmStrip(ctx, w, h);
      const strip = w * 0.068;
      const oh = h * 0.2;
      const g  = ctx.createLinearGradient(0, h - oh, 0, h);
      g.addColorStop(0, 'rgba(0,0,0,0)');
      g.addColorStop(1, 'rgba(0,0,0,0.84)');
      ctx.fillStyle = g;
      ctx.fillRect(strip, h - oh, w - 2 * strip, oh);
      ctx.textAlign = 'center';
      ctx.font      = `italic bold ${Math.round(w * 0.058)}px 'Playfair Display',Georgia,serif`;
      ctx.fillStyle = 'rgba(255,235,180,0.9)';
      ctx.fillText(event?.name || '', w / 2, h - oh * 0.38);
      if (event?.date) {
        ctx.font      = `${Math.round(w * 0.034)}px 'Montserrat',sans-serif`;
        ctx.fillStyle = 'rgba(255,220,140,0.5)';
        ctx.letterSpacing = `${w * 0.006}px`;
        ctx.fillText(
          new Intl.DateTimeFormat('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' })
            .format(new Date(event.date + 'T00:00:00')),
          w / 2, h - oh * 0.14,
        );
        ctx.letterSpacing = '0px';
      }
    },
  },
];

const BAR_MITZVAH_FRAMES = [
  {
    id: 'bar-jerusalem',
    name: 'ירושלים',
    previewBg: 'linear-gradient(160deg,#1a1208 0%,#100c06 100%)',
    drawFrame(ctx, w, h, event) {
      ctx.fillStyle = 'rgba(80,48,8,0.22)';
      ctx.fillRect(0, 0, w, h);
      drawGoldBorder(ctx, w, h, 0.036, 0.55, 0.0075);
      drawStarOfDavid(ctx, w / 2, h * 0.1, w * 0.062, 'rgba(201,169,110,0.75)');
      drawEventText(ctx, w, h, event, {
        nameColor: 'rgba(230,200,140,0.94)',
        dateColor:  'rgba(201,169,110,0.58)',
        gradientOpacity: 0.85,
      });
    },
  },
  {
    id: 'bar-electric',
    name: 'אנרגיה',
    previewBg: 'linear-gradient(160deg,#07071a 0%,#04040f 100%)',
    drawFrame(ctx, w, h, event) {
      drawNeonBorder(ctx, w, h, '#7c6fff', 'rgba(100,80,255,0.9)');
      const g2 = ctx.createLinearGradient(0, h * 0.7, 0, h);
      g2.addColorStop(0, 'rgba(30,10,80,0)');
      g2.addColorStop(1, 'rgba(20,5,60,0.75)');
      ctx.fillStyle = g2; ctx.fillRect(0, 0, w, h);
      drawEventText(ctx, w, h, event, {
        nameColor: 'rgba(200,190,255,0.95)',
        dateColor:  'rgba(160,148,255,0.55)',
        gradientOpacity: 0.0,
      });
    },
  },
  {
    id: 'bar-retro',
    name: 'רטרו',
    previewBg: 'linear-gradient(160deg,#1a0818 0%,#100610 100%)',
    drawFrame(ctx, w, h, event) {
      const tg = ctx.createLinearGradient(0, 0, w, h);
      tg.addColorStop(0, 'rgba(180,0,180,0.18)');
      tg.addColorStop(0.5, 'rgba(0,180,200,0.10)');
      tg.addColorStop(1, 'rgba(180,0,180,0.18)');
      ctx.fillStyle = tg; ctx.fillRect(0, 0, w, h);
      const gridAlpha = 0.12;
      ctx.strokeStyle = `rgba(0,200,255,${gridAlpha})`;
      ctx.lineWidth = 0.5;
      const gridH = h * 0.22;
      const rows = 8, cols = 10;
      for (let r = 0; r <= rows; r++) {
        const y = h - gridH + (r / rows) * gridH;
        const vp = w / 2;
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(vp, h - gridH * 0.05); ctx.lineTo(w, y); ctx.stroke();
      }
      for (let c = 0; c <= cols; c++) {
        const x = (c / cols) * w;
        ctx.beginPath(); ctx.moveTo(w / 2, h - gridH * 0.05); ctx.lineTo(x, h); ctx.stroke();
      }
      ctx.fillStyle = `rgba(0,200,255,${gridAlpha * 0.5})`;
      ctx.fillRect(0, h - gridH * 0.05, w, 0.5);
      drawNeonBorder(ctx, w, h, 'rgba(255,80,220,0.7)', 'rgba(255,0,200,0.8)', 0.028);
      drawEventText(ctx, w, h, event, {
        nameColor: 'rgba(255,200,255,0.95)',
        dateColor:  'rgba(0,220,255,0.65)',
        gradientOpacity: 0.0,
      });
    },
  },
];

const BIRTHDAY_FRAMES = [
  {
    id: 'birthday-party',
    name: 'מסיבה',
    previewBg: 'linear-gradient(160deg,#14081e 0%,#0a050f 100%)',
    drawFrame(ctx, w, h, event) {
      drawConfetti(ctx, w, h);
      const g = ctx.createLinearGradient(0, h * 0.65, 0, h);
      g.addColorStop(0, 'rgba(0,0,0,0)');
      g.addColorStop(1, 'rgba(10,4,20,0.88)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = 'rgba(255,107,157,0.5)';
      ctx.lineWidth = w * 0.007;
      const m = w * 0.03;
      ctx.strokeRect(m, m, w - 2 * m, h - 2 * m);
      drawEventText(ctx, w, h, event, {
        nameColor: '#ffffff',
        nameFont:  `bold ${Math.round(w * 0.065)}px 'Heebo','Assistant',sans-serif`,
        gradientOpacity: 0,
      });
    },
  },
  {
    id: 'birthday-neon',
    name: 'ניאון',
    previewBg: 'linear-gradient(160deg,#0f0614 0%,#07040a 100%)',
    drawFrame(ctx, w, h, event) {
      drawNeonBorder(ctx, w, h, '#ff6bda', 'rgba(255,60,210,0.95)');
      const g = ctx.createLinearGradient(0, h * 0.72, 0, h);
      g.addColorStop(0, 'rgba(40,0,50,0)');
      g.addColorStop(1, 'rgba(30,0,40,0.82)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      drawEventText(ctx, w, h, event, {
        nameColor: 'rgba(255,210,255,0.96)',
        dateColor:  'rgba(255,130,230,0.60)',
        gradientOpacity: 0,
      });
    },
  },
  {
    id: 'birthday-pastel',
    name: 'פסטל',
    previewBg: 'linear-gradient(160deg,#0e0c1a 0%,#08060f 100%)',
    drawFrame(ctx, w, h, event) {
      const tg = ctx.createLinearGradient(0, 0, 0, h);
      tg.addColorStop(0, 'rgba(140,90,255,0.18)');
      tg.addColorStop(0.5, 'rgba(255,140,200,0.10)');
      tg.addColorStop(1, 'rgba(80,200,255,0.18)');
      ctx.fillStyle = tg; ctx.fillRect(0, 0, w, h);
      const m = w * 0.032;
      ctx.strokeStyle = 'rgba(200,160,255,0.55)';
      ctx.lineWidth = w * 0.006;
      ctx.strokeRect(m, m, w - 2 * m, h - 2 * m);
      ctx.strokeStyle = 'rgba(255,180,220,0.3)';
      ctx.lineWidth = w * 0.003;
      const m2 = m + w * 0.015;
      ctx.strokeRect(m2, m2, w - 2 * m2, h - 2 * m2);
      drawEventText(ctx, w, h, event, {
        nameColor: 'rgba(230,200,255,0.95)',
        dateColor:  'rgba(200,180,255,0.55)',
        gradientOpacity: 0.75,
      });
    },
  },
];

const CORPORATE_FRAMES = [
  {
    id: 'corp-executive',
    name: 'מקצועי',
    previewBg: 'linear-gradient(160deg,#0c0c0e 0%,#080808 100%)',
    drawFrame(ctx, w, h, event) {
      const vg = ctx.createRadialGradient(w / 2, h * 0.4, 0, w / 2, h * 0.4, h * 0.8);
      vg.addColorStop(0, 'transparent');
      vg.addColorStop(1, 'rgba(0,0,0,0.65)');
      ctx.fillStyle = vg; ctx.fillRect(0, 0, w, h);
      drawGoldBorder(ctx, w, h, 0.028, 0.48, 0.006);
      drawEventText(ctx, w, h, event, {
        nameFont:  `300 ${Math.round(w * 0.054)}px 'Montserrat','Heebo',sans-serif`,
        nameColor: 'rgba(255,255,255,0.92)',
        dateColor:  'rgba(201,169,110,0.58)',
        gradientOpacity: 0.88,
      });
    },
  },
  {
    id: 'corp-gradient',
    name: 'מודרני',
    previewBg: 'linear-gradient(160deg,#0a0c14 0%,#06080e 100%)',
    drawFrame(ctx, w, h, event) {
      const m = w * 0.025;
      const lw = w * 0.009;
      const grad = ctx.createLinearGradient(m, m, w - m, h - m);
      grad.addColorStop(0,    'rgba(100,120,255,0.75)');
      grad.addColorStop(0.33, 'rgba(201,169,110,0.75)');
      grad.addColorStop(0.66, 'rgba(255,100,180,0.75)');
      grad.addColorStop(1,    'rgba(100,220,255,0.75)');
      ctx.save();
      ctx.shadowColor = 'rgba(120,120,255,0.35)';
      ctx.shadowBlur  = w * 0.04;
      ctx.strokeStyle = grad;
      ctx.lineWidth   = lw;
      ctx.strokeRect(m, m, w - 2 * m, h - 2 * m);
      ctx.restore();
      drawEventText(ctx, w, h, event, { gradientOpacity: 0.86 });
    },
  },
];

const GENERAL_FRAMES = [
  {
    id: 'general-cinema',
    name: 'קולנוע',
    previewBg: 'linear-gradient(160deg,#0a0a0a 0%,#050505 100%)',
    drawFrame(ctx, w, h, event) {
      drawCinemaLetterbox(ctx, w, h, event);
    },
  },
  {
    id: 'general-minimal',
    name: 'מינימל',
    previewBg: 'linear-gradient(160deg,#111111 0%,#0a0a0a 100%)',
    drawFrame(ctx, w, h, event) {
      const vg = ctx.createRadialGradient(w / 2, h / 2, h * 0.2, w / 2, h / 2, h * 0.75);
      vg.addColorStop(0, 'transparent');
      vg.addColorStop(1, 'rgba(0,0,0,0.6)');
      ctx.fillStyle = vg; ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = 'rgba(255,255,255,0.2)';
      ctx.lineWidth = w * 0.004;
      const m = w * 0.025;
      ctx.strokeRect(m, m, w - 2 * m, h - 2 * m);
      drawEventText(ctx, w, h, event, { gradientOpacity: 0.72 });
    },
  },
];

// ─── Exports ───────────────────────────────────────────────────────────────────

export const FRAME_PACKS = {
  wedding:     WEDDING_FRAMES,
  bar_mitzvah: BAR_MITZVAH_FRAMES,
  birthday:    BIRTHDAY_FRAMES,
  corporate:   CORPORATE_FRAMES,
  general:     GENERAL_FRAMES,
};

/** Returns the most relevant frame pack based on event name. */
export function getFramePack(eventName = '') {
  const n = eventName.toLowerCase();
  if (n.includes('חתונה') || n.includes('wedding'))                                             return WEDDING_FRAMES;
  if (n.includes('בר מצווה') || n.includes('בת מצווה') || n.includes('ברית') || n.includes('bar mitzvah')) return BAR_MITZVAH_FRAMES;
  if (n.includes('יום הולדת') || n.includes('birthday'))                                        return BIRTHDAY_FRAMES;
  if (n.includes('חברה') || n.includes('corporate') || n.includes('company') || n.includes('עסקי')) return CORPORATE_FRAMES;
  return GENERAL_FRAMES;
}

/** Returns ALL frames flat — for admin "preview all" view. */
export const ALL_FRAMES = [
  ...WEDDING_FRAMES,
  ...BAR_MITZVAH_FRAMES,
  ...BIRTHDAY_FRAMES,
  ...CORPORATE_FRAMES,
  ...GENERAL_FRAMES,
];
