import React, { useState, useRef, useEffect } from "react";
import {
  Loader2, ArrowLeft, Home, Check,
  ChevronLeft, ChevronRight,
  Upload, Copy, Monitor, X
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useNavigate, useLocation, Link } from "react-router-dom";
import memoriaService from "@/components/memoriaService";
import { useAuth } from "@/lib/AuthContext";
import { FRAME_PACKS, LABEL_H_RATIO } from "@/components/magnet/framePacks";

// Polaroid-style magnet preview
function MagnetPreview({ eventData = {}, overlayPreview = null, previewH, previewW }) {
  const formattedDate = eventData.date
    ? new Intl.DateTimeFormat('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' })
        .format(new Date(eventData.date + 'T00:00:00'))
    : "02.25.2026";

  // Polaroid ratio: 3:4 (width:height = 0.75). 37.5/50 = 0.75 ✓
  const cardH = previewH || 'clamp(145px, 50dvh, 420px)';
  const cardW = previewW || 'clamp(109px, 37.5dvh, 315px)';

  return (
    <div className="relative flex items-center justify-center h-full w-full">
      {/* Polaroid frame */}
      <div
        className="relative bg-white shadow-[0_20px_50px_rgba(0,0,0,0.7)] flex flex-col"
        style={{
          width: cardW,
          height: cardH,
          padding: '6px 6px 0 6px',
          borderRadius: '2px',
          transition: 'width 0.5s ease-out, height 0.5s ease-out',
        }}
      >
        {/* Photo area */}
        <div className="relative flex-1 bg-zinc-900 overflow-hidden">
          {overlayPreview ? (
            <img src={overlayPreview} alt="Overlay" className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-violet-900/60 to-zinc-900 flex items-center justify-center">
              <span className="text-white/20 text-[7px] font-bold tracking-widest uppercase">overlay</span>
            </div>
          )}
        </div>
        {/* Polaroid label strip */}
        <div className="flex-none flex flex-col items-center justify-center py-1.5 gap-0.5">
          <span className="text-black text-[9px] font-bold tracking-tight leading-none truncate w-full text-center">
            {eventData.name || "שם האירוע"}
          </span>
          <span className="text-black/40 text-[7px]">{formattedDate}</span>
        </div>
      </div>
      {/* MAGNET label */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2">
        <span className="text-violet-400/50 text-[8px] font-black tracking-[0.2em] uppercase">Magnet</span>
      </div>
    </div>
  );
}

// Compact inline calendar — violet accent for Magnet branding
function InlineCalendar({ value, onChange }) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const selected = value ? new Date(value + 'T00:00:00') : null;
  const [viewYear, setViewYear] = useState(selected ? selected.getFullYear() : today.getFullYear());
  const [viewMonth, setViewMonth] = useState(selected ? selected.getMonth() : today.getMonth());

  const hebrewDays = ['א׳','ב׳','ג׳','ד׳','ה׳','ו׳','ש׳'];
  const hebrewMonths = ['ינואר','פברואר','מרץ','אפריל','מאי','יוני','יולי','אוגוסט','ספטמבר','אוקטובר','נובמבר','דצמבר'];

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const prevMonth = () => { if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); } else setViewMonth(m => m - 1); };
  const nextMonth = () => { if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); } else setViewMonth(m => m + 1); };

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const isPast = (d) => new Date(viewYear, viewMonth, d) < today;
  const isSel = (d) => selected && selected.getFullYear() === viewYear && selected.getMonth() === viewMonth && selected.getDate() === d;
  const isToday = (d) => today.getFullYear() === viewYear && today.getMonth() === viewMonth && today.getDate() === d;

  const handleDay = (d) => {
    if (!d || isPast(d)) return;
    onChange(`${viewYear}-${String(viewMonth + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`);
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-4 w-full" dir="ltr">
      <div className="flex items-center justify-between mb-3">
        <button type="button" onClick={prevMonth} className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="font-playfair text-foreground text-lg">{hebrewMonths[viewMonth]} {viewYear}</span>
        <button type="button" onClick={nextMonth} className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
      <div className="grid grid-cols-7 mb-1">
        {hebrewDays.map(d => <div key={d} className="text-center text-muted-foreground/60 text-xs font-bold py-1">{d}</div>)}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((day, i) => (
          <button key={i} type="button" onClick={() => handleDay(day)}
            className={`h-9 w-full flex items-center justify-center text-base font-medium rounded-full transition-colors
              ${!day ? 'invisible pointer-events-none' : ''}
              ${day && isPast(day) ? 'text-muted-foreground/40 pointer-events-none' : ''}
              ${day && isSel(day) ? 'bg-violet-600 text-white shadow-md' : ''}
              ${day && isToday(day) && !isSel(day) ? 'ring-1 ring-violet-500/40 text-foreground' : ''}
              ${day && !isPast(day) && !isSel(day) ? 'text-foreground/80 hover:bg-accent' : ''}
            `}>
            {day || ''}
          </button>
        ))}
      </div>
    </div>
  );
}

// Thumbnail dimensions
const THUMB_W = 88;
const THUMB_PHOTO_H = Math.round(THUMB_W * (4 / 3));    // 117px
const THUMB_LABEL_H = Math.round(THUMB_W * LABEL_H_RATIO); // ~20px
const THUMB_TOTAL_H = THUMB_PHOTO_H + THUMB_LABEL_H;    // ~137px

// Extract first hex color from previewBg gradient string for the photo area
function previewBgToPhotoColor(previewBg = '') {
  const match = previewBg.match(/#[0-9a-fA-F]{6}/);
  return match ? match[0] : '#1a1410';
}

// Draws a frame onto a given canvas element
function drawOnCanvas(el, frame, eventData) {
  if (!el) return;
  const ctx = el.getContext('2d');
  const w = el.width;
  const pH = el.height - Math.round(w * LABEL_H_RATIO);
  const tH = el.height;
  const photoColor = previewBgToPhotoColor(frame.previewBg);
  // Photo area: gradient from the frame's own palette
  const grad = ctx.createLinearGradient(0, 0, w, pH);
  grad.addColorStop(0, photoColor);
  grad.addColorStop(1, '#0d0d0d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, tH);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, pH);
  frame.drawFrame(ctx, w, tH, pH,
    { name: eventData?.name || 'שם האירוע', date: eventData?.date || null });
}

// Canvas thumbnail — redraws after fonts are ready
function FrameThumbnail({ frame, isSelected, onSelect, eventData }) {
  const cvs = useRef(null);

  useEffect(() => {
    document.fonts.ready.then(() => drawOnCanvas(cvs.current, frame, eventData));
  }, [frame, eventData?.name, eventData?.date]);

  return (
    <button
      type="button"
      onClick={() => onSelect(frame.id)}
      className="flex flex-col items-center gap-1.5 shrink-0 transition-transform duration-150 active:scale-95"
      style={{ outline: 'none' }}
    >
      <div style={{
        position: 'relative',
        borderRadius: '4px',
        border: isSelected ? '2.5px solid #7c3aed' : '2px solid rgba(255,255,255,0.08)',
        boxShadow: isSelected
          ? '0 0 18px -2px rgba(124,58,237,0.7), 0 4px 16px rgba(0,0,0,0.5)'
          : '0 3px 12px rgba(0,0,0,0.55)',
        transition: 'border-color 0.15s, box-shadow 0.15s',
        overflow: 'hidden',
      }}>
        <canvas ref={cvs} width={THUMB_W} height={THUMB_TOTAL_H} style={{ display: 'block' }} />
        {isSelected && (
          <div style={{
            position: 'absolute', top: 5, right: 5,
            width: 16, height: 16, borderRadius: '50%',
            background: '#7c3aed',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
              <path d="M1.5 4.5L3.5 6.5L7.5 2.5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        )}
      </div>
      <span style={{
        fontFamily: 'Heebo, sans-serif', fontSize: '10px', whiteSpace: 'nowrap',
        color: isSelected ? '#a78bfa' : 'rgba(255,255,255,0.4)',
        fontWeight: isSelected ? 700 : 400,
        transition: 'color 0.15s',
        userSelect: 'none',
      }}>
        {frame.name}
      </span>
    </button>
  );
}

// Full-size frame preview modal
const MODAL_W = 220;
const MODAL_PHOTO_H = Math.round(MODAL_W * (4 / 3)); // 293px
const MODAL_LABEL_H = Math.round(MODAL_W * LABEL_H_RATIO); // ~50px
const MODAL_TOTAL_H = MODAL_PHOTO_H + MODAL_LABEL_H;

function FramePreviewModal({ frame, eventData, onClose, onSelect, isSelected }) {
  const cvs = useRef(null);

  useEffect(() => {
    document.fonts.ready.then(() => drawOnCanvas(cvs.current, frame, eventData));
  }, [frame, eventData?.name, eventData?.date]);

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      <div
        className="flex flex-col items-center pb-8 pt-6 px-6 gap-5 w-full max-w-xs"
        onClick={e => e.stopPropagation()}
      >
        {/* Frame name */}
        <p className="text-white/60 text-xs tracking-widest uppercase">{frame.name}</p>

        {/* Large canvas preview */}
        <div style={{ borderRadius: '6px', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.8)' }}>
          <canvas ref={cvs} width={MODAL_W} height={MODAL_TOTAL_H} style={{ display: 'block' }} />
        </div>

        {/* Actions */}
        <div className="flex gap-3 w-full">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 h-11 rounded-xl text-sm font-semibold text-white/50 border border-white/10 hover:border-white/20 transition-colors"
          >
            ביטול
          </button>
          <button
            type="button"
            onClick={() => { onSelect(frame.id); onClose(); }}
            className="flex-1 h-11 rounded-xl text-sm font-bold text-white transition-colors"
            style={{ background: isSelected ? 'rgba(124,58,237,0.4)' : '#7c3aed' }}
          >
            {isSelected ? '✓ נבחרה' : 'בחר מסגרת'}
          </button>
        </div>
      </div>
    </div>
  );
}

const FRAME_CATEGORIES = [
  { key: 'wedding',     label: 'חתונה' },
  { key: 'bar_mitzvah', label: 'בר / בת מצווה' },
  { key: 'brit',        label: 'ברית' },
  { key: 'birthday',    label: 'יום הולדת' },
  { key: 'corporate',   label: 'אירוע חברה' },
  { key: 'general',     label: 'כללי' },
];

export default function CreateMagnetEvent() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // Pre-fill from lead if navigated via "צור אירוע" in LeadsPanel
  const fromLead = location.state?.fromLead ?? null;

  const [currentStep, setCurrentStep] = useState(fromLead?.eventName ? 2 : 1);
  const totalSteps = 4;

  const [form, setForm] = useState({
    name: fromLead?.eventName ?? '',
    date: fromLead?.eventDate ?? '',
    print_quota_per_device: 5,
    selectedFrameId: null,  // frame_id from framePacks, stored in overlay_frame_url
    overlayFile: null,       // custom PNG upload (overrides selectedFrameId if set)
  });
  const [overlayPreview, setOverlayPreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(null);
  const [previewFrame, setPreviewFrame] = useState(null); // frame object shown in preview modal

  const quotaOptions = [1, 3, 5, 10, 20];
  const todayStr = new Date().toISOString().split('T')[0];

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
  };

  const handleOverlayFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    handleChange('overlayFile', file);
    setOverlayPreview(URL.createObjectURL(file));
  };

  const isCurrentStepValid = () => {
    if (currentStep === 1) return form.name.trim().length > 0;
    if (currentStep === 2) return !!(form.date && form.date >= todayStr);
    return true;
  };

  const validateStep = (step) => {
    const newErrors = {};
    if (step === 1 && !form.name.trim()) newErrors.name = "שדה חובה";
    if (step === 2) {
      if (!form.date) newErrors.date = "שדה חובה";
      else if (form.date < todayStr) newErrors.date = "יש לבחור תאריך מהיום ועתידי";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => { if (validateStep(currentStep)) setCurrentStep(p => Math.min(p + 1, totalSteps)); };
  const handleBack = () => { setCurrentStep(p => Math.max(p - 1, 1)); setErrors({}); };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;
    setIsLoading(true);
    try {
      const unique_code = Math.random().toString(36).substring(2, 10);
      const pin_code = Math.floor(1000 + Math.random() * 9000).toString();
      const event = await memoriaService.events.create({
        name: form.name.trim(),
        date: form.date,
        unique_code,
        pin_code,
        created_by: user.id,
        event_type: 'magnet',
        print_quota_per_device: form.print_quota_per_device,
        guest_tier: 0,
        max_uploads_per_user: 999,
        auto_publish_guest_photos: false,
        is_active: true,
      });
      if (form.overlayFile) {
        // Custom PNG upload takes priority
        const { file_url } = await memoriaService.storage.uploadOverlay(form.overlayFile, event.id);
        await memoriaService.events.update(event.id, { overlay_frame_url: file_url });
      } else if (form.selectedFrameId) {
        // Store frame id directly — MagnetReview resolves it via ALL_FRAMES lookup
        await memoriaService.events.update(event.id, { overlay_frame_url: form.selectedFrameId });
      }
      setSuccess({ event_code: event.unique_code, pin_code: event.pin_code, event_id: event.id });
    } catch (err) {
      console.error('CreateMagnetEvent: submit failed', err);
      setErrors({ submit: 'שגיאה ביצירת האירוע. ייתכן שהקוד כבר קיים.' });
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    const eventUrl = `${window.location.origin}/magnet/${success.event_code}`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&format=png&color=0a0a0a&bgcolor=ffffff&data=${encodeURIComponent(eventUrl)}`;
    return (
      <div className="dark fixed inset-0 bg-gradient-to-br from-cool-950 via-cool-900 to-cool-950 flex items-center justify-center" dir="rtl">
        <div className="text-center px-6 max-w-sm w-full">
          {/* Check circle */}
          <div className="w-14 h-14 mx-auto mb-5 rounded-full bg-violet-500/15 border border-violet-500/30 flex items-center justify-center">
            <Check className="w-7 h-7 text-violet-400" />
          </div>
          <p className="text-violet-400 text-[10px] font-bold tracking-[0.3em] uppercase mb-3">Magnet · מוכן</p>
          <h3 className="font-playfair text-3xl text-foreground/90 mb-2">אירוע מגנט נוצר</h3>
          <p className="text-muted-foreground text-sm mb-6">שתפו את הקישור או ה-QR עם האורחים</p>

          {/* QR code */}
          <div className="mx-auto w-fit bg-white rounded-2xl p-3 mb-5 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
            <img src={qrUrl} alt="QR" width={160} height={160} className="block rounded-lg" />
          </div>

          {/* Event URL copy row */}
          <div className="flex items-center gap-2 bg-card border border-border rounded-xl px-4 py-3 mb-6">
            <span className="text-foreground/75 text-xs font-mono truncate flex-1 text-right" dir="ltr">
              {eventUrl}
            </span>
            <button
              onClick={() => navigator.clipboard?.writeText(eventUrl)}
              className="shrink-0 p-1.5 rounded-lg hover:bg-accent transition-colors"
              title="העתק קישור"
            >
              <Copy className="w-4 h-4 text-muted-foreground hover:text-foreground transition-colors" />
            </button>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <button
              onClick={() => navigate(`/PrintStation/${success.event_id}`)}
              className="flex items-center justify-center gap-2 w-full px-5 py-3 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              <Monitor className="w-4 h-4" />
              פתח Print Station
            </button>
            <button
              onClick={() => navigate('/AdminDashboard')}
              className="w-full px-5 py-3 bg-card border border-border text-muted-foreground text-sm rounded-xl hover:bg-accent transition-colors"
            >
              חזרה לדשבורד
            </button>
          </div>
        </div>
      </div>
    );
  }

  const progressPercentage = currentStep / totalSteps * 100;

  // On the calendar step (step 2), hide the preview entirely.
  const isCalendarStep = currentStep === 2;
  // On step 4, also hide the large top preview — frame picker is the focus
  const hideTopPreview = isCalendarStep || currentStep === 4;
  const previewH = 'clamp(145px, 50dvh, 420px)';
  const previewW = 'clamp(109px, 37.5dvh, 315px)';

  return (
    <div className="dark flex flex-col w-full h-[100dvh] bg-gradient-to-br from-cool-950 via-cool-900 to-cool-950 text-foreground overflow-hidden font-heebo" dir="rtl">

      {/* Frame preview modal */}
      {previewFrame && (
        <FramePreviewModal
          frame={previewFrame}
          eventData={form}
          onClose={() => setPreviewFrame(null)}
          isSelected={form.selectedFrameId === previewFrame.id}
          onSelect={(id) => {
            handleChange('selectedFrameId', id);
            handleChange('overlayFile', null);
            setOverlayPreview(null);
          }}
        />
      )}

      {/* Progress bar */}
      <div className="h-1 bg-border shrink-0 w-full z-50">
        <div className="h-full bg-violet-500 transition-all duration-500 shadow-[0_0_10px_rgba(139,92,246,0.5)]"
          style={{ width: `${progressPercentage}%` }} />
      </div>

      <div className="flex flex-col lg:flex-row flex-1 min-h-0 overflow-hidden">

        {/* Preview area — hidden on calendar/frame steps to give full screen */}
        {!hideTopPreview && (
          <div className="flex-none w-full h-[56dvh] lg:flex-1 lg:h-auto flex items-center justify-center relative z-0 shrink-0 border-b border-border lg:border-none overflow-hidden py-2">
            <div className="absolute inset-0 bg-gradient-to-b from-cool-900 to-cool-950" />
            <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 70% 60% at 50% 55%, rgba(139,92,246,0.06) 0%, transparent 70%)' }} />
            <div className="relative z-10 w-full flex items-center justify-center h-full">
              <MagnetPreview eventData={form} overlayPreview={overlayPreview} previewH={previewH} previewW={previewW} />
            </div>
          </div>
        )}

        {/* Form area */}
        <div className="flex-1 z-10 flex flex-col relative min-h-0 shadow-[0_-20px_40px_rgba(0,0,0,0.6)]">
          <div className={`flex-1 px-4 flex flex-col items-center ${isCalendarStep || currentStep === 4 ? 'overflow-y-auto justify-start pt-6' : 'overflow-hidden justify-center'}`}>
            <div className="w-full max-w-sm mx-auto flex flex-col justify-center items-center">

              {/* Step 1 — Name */}
              {currentStep === 1 && (
                <div className="animate-in fade-in slide-in-from-bottom-6 duration-300 text-center space-y-2 w-full">
                  <p className="text-violet-400 text-[10px] font-bold tracking-[0.3em] uppercase mb-2"><bdi>01</bdi> · שם האירוע</p>
                  <h2 className="font-playfair text-2xl font-semibold tracking-tight mb-1 text-foreground">מה שם האירוע?</h2>
                  <p className="text-sm text-muted-foreground mb-2">השם שיופיע על המגנט ובממשק האורחים</p>
                  <Input
                    value={form.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder="למשל: Yael & Daniel"
                    style={{ fontSize: '16px' }}
                    className="bg-card border-border text-foreground h-10 text-center rounded-xl focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all shadow-inner placeholder:text-muted-foreground/60 w-full"
                  />
                  {errors.name && <p className="text-red-400 text-[10px] mt-2 font-bold animate-pulse">{errors.name}</p>}
                </div>
              )}

              {/* Step 2 — Date */}
              {currentStep === 2 && fromLead && (
                <div className="animate-in fade-in duration-300 w-full mb-2">
                  <div className="flex items-center justify-between px-3 py-2 bg-violet-500/10 border border-violet-500/25 rounded-xl">
                    <span className="text-violet-300 text-xs font-semibold truncate">{fromLead.eventName}</span>
                    <span className="text-violet-400/60 text-xs shrink-0 mr-2">מליד · {fromLead.contactName}</span>
                  </div>
                </div>
              )}
              {currentStep === 2 && (
                <div className="animate-in fade-in slide-in-from-bottom-6 duration-300 w-full flex flex-col gap-2">
                  <div className="text-center space-y-1">
                    <p className="text-violet-400 text-[10px] font-bold tracking-[0.3em] uppercase mb-1"><bdi>02</bdi> · תאריך</p>
                    <h2 className="font-playfair text-2xl font-semibold tracking-tight text-foreground">מתי האירוע?</h2>
                    <p className="text-sm text-muted-foreground">תאריך האירוע שיופיע על המגנטים</p>
                  </div>
                  <InlineCalendar value={form.date} onChange={(d) => handleChange('date', d)} />
                  {errors.date && <p className="text-red-400 text-sm font-bold text-center animate-pulse">{errors.date}</p>}
                </div>
              )}

              {/* Step 3 — Print quota */}
              {currentStep === 3 && (
                <div className="animate-in fade-in slide-in-from-bottom-6 duration-300 w-full flex flex-col gap-3">
                  <div className="text-center space-y-1">
                    <p className="text-violet-400 text-[10px] font-bold tracking-[0.3em] uppercase mb-1"><bdi>03</bdi> · מכסה</p>
                    <h2 className="font-playfair text-2xl font-semibold tracking-tight text-foreground">כמה הדפסות לאורח?</h2>
                    <p className="text-sm text-muted-foreground">כל אורח יוכל להדפיס עד המספר שתבחרו</p>
                  </div>
                  <div className="grid grid-cols-5 gap-2">
                    {quotaOptions.map((n) => (
                      <button
                        key={n} type="button"
                        onClick={() => handleChange('print_quota_per_device', n)}
                        className={`h-12 rounded-xl font-bold text-base transition-all active:scale-95 ${
                          form.print_quota_per_device === n
                            ? 'bg-violet-600 text-white shadow-md border border-white/20'
                            : 'bg-card text-muted-foreground border border-border hover:border-foreground/20'
                        }`}
                      ><bdi>{n}</bdi></button>
                    ))}
                  </div>
                  <div className="bg-gradient-to-r from-cool-900 to-cool-950 rounded-xl p-3 flex items-center gap-3 border border-border">
                    <div className="w-8 h-8 rounded-full bg-violet-500/10 flex items-center justify-center text-violet-400 shrink-0 border border-violet-500/20">
                      <Check size={16} strokeWidth={3} />
                    </div>
                    <p className="text-foreground font-semibold text-[13px]"><bdi>{form.print_quota_per_device}</bdi> הדפסות לכל אורח</p>
                  </div>
                </div>
              )}

              {/* Step 4 — Frame selection */}
              {currentStep === 4 && (
                <div className="animate-in fade-in slide-in-from-bottom-6 duration-300 w-full flex flex-col gap-3">
                  <div className="text-center space-y-1">
                    <p className="text-violet-400 text-[10px] font-bold tracking-[0.3em] uppercase mb-1"><bdi>04</bdi> · מסגרת</p>
                    <h2 className="font-playfair text-2xl font-semibold tracking-tight text-foreground">בחרו מסגרת</h2>
                    <p className="text-sm text-muted-foreground">המסגרת תוטבע על כל מגנט באירוע — אופציונלי</p>
                  </div>

                  {/* "None" option */}
                  <button
                    type="button"
                    onClick={() => handleChange('selectedFrameId', null)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl border transition-all text-sm"
                    style={{
                      background: form.selectedFrameId === null ? 'rgba(124,58,237,0.12)' : 'rgba(255,255,255,0.04)',
                      border: form.selectedFrameId === null ? '1px solid rgba(124,58,237,0.45)' : '1px solid rgba(255,255,255,0.08)',
                      color: form.selectedFrameId === null ? '#a78bfa' : 'rgba(255,255,255,0.4)',
                    }}
                  >
                    {form.selectedFrameId === null && <Check className="w-3.5 h-3.5 shrink-0" />}
                    <span>ללא מסגרת</span>
                  </button>

                  {/* Frame categories */}
                  {FRAME_CATEGORIES.map(cat => (
                    <div key={cat.key}>
                      <p className="text-[9px] font-semibold mb-2 tracking-widest uppercase" style={{ color: 'rgba(167,139,250,0.5)' }}>
                        {cat.label}
                      </p>
                      <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }} dir="ltr">
                        {FRAME_PACKS[cat.key].map(frame => (
                          <FrameThumbnail
                            key={frame.id}
                            frame={frame}
                            isSelected={form.selectedFrameId === frame.id}
                            onSelect={() => setPreviewFrame(frame)}
                            eventData={form}
                          />
                        ))}
                      </div>
                    </div>
                  ))}

                  {/* Custom PNG upload (advanced) */}
                  <div>
                    <p className="text-[9px] font-semibold mb-2 tracking-widest uppercase text-muted-foreground/60">
                      מותאם אישית
                    </p>
                    <label className="flex items-center gap-3 w-full bg-card border border-dashed border-border hover:border-violet-500/40 rounded-xl px-4 py-3 cursor-pointer transition-colors">
                      <Upload className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span className="text-xs text-muted-foreground truncate">
                        {form.overlayFile ? form.overlayFile.name : 'העלאת PNG מותאם...'}
                      </span>
                      {form.overlayFile && (
                        <button type="button" className="mr-auto shrink-0" onClick={(e) => { e.preventDefault(); handleChange('overlayFile', null); setOverlayPreview(null); }}>
                          <X className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
                        </button>
                      )}
                      <input type="file" accept="image/png" className="hidden" onChange={(e) => { handleOverlayFile(e); handleChange('selectedFrameId', null); }} />
                    </label>
                  </div>

                  {errors.submit && <p className="text-red-400 text-sm text-center">{errors.submit}</p>}
                </div>
              )}

            </div>
          </div>

          {/* Footer nav */}
          <div className="px-4 flex-none border-t border-border w-full z-50 shrink-0 bg-cool-950/80 backdrop-blur-md"
            style={{ paddingTop: '0.25rem', paddingBottom: 'max(0.25rem, env(safe-area-inset-bottom))' }}>
            <div className="w-full max-w-sm mx-auto flex gap-3 items-center">
              {currentStep === 1 ? (
                <Link to="/AdminDashboard"
                  className="w-11 h-11 bg-card text-muted-foreground rounded-xl flex items-center justify-center transition-all active:scale-90 border border-border shrink-0 hover:text-foreground">
                  <Home className="w-4 h-4" />
                </Link>
              ) : (
                <button type="button" onClick={handleBack}
                  className="w-11 h-11 bg-card text-foreground rounded-xl flex items-center justify-center transition-all active:scale-90 border border-border shrink-0">
                  <ArrowLeft className="w-5 h-5 rotate-180" />
                </button>
              )}

              <button
                type="button"
                onClick={currentStep === totalSteps ? handleSubmit : handleNext}
                disabled={isLoading}
                className={`text-base font-semibold rounded-xl flex-1 h-12 transition-all duration-300 active:scale-95 flex items-center justify-center relative ${
                  isCurrentStepValid() || isLoading
                    ? 'bg-violet-600 text-white shadow-lg shadow-violet-900/40 border border-white/10'
                    : 'bg-card text-muted-foreground border border-border'
                }`}
              >
                {isLoading
                  ? <Loader2 className="w-5 h-5 animate-spin" />
                  : <span>{currentStep === totalSteps ? 'יצירת אירוע' : 'המשך'}</span>
                }
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
