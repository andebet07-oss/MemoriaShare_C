import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Loader2, Home, ArrowLeft, Camera,
  BatteryFull, Wifi, Signal, Check, ChevronLeft, ChevronRight,
  ImageIcon, Pencil, X,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import memoriaService from '@/components/memoriaService';

// ─── Image compression (mirror CreateEvent) ──────────────────────────────────
async function compressImage(file) {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const MAX = 1200;
      let { width, height } = img;
      if (width > MAX || height > MAX) {
        if (width > height) { height = Math.round(height * MAX / width); width = MAX; }
        else { width = Math.round(width * MAX / height); height = MAX; }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width; canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(url);
      canvas.toBlob((blob) => resolve(new File([blob], file.name, { type: 'image/jpeg' })), 'image/jpeg', 0.7);
    };
    img.src = url;
  });
}

// ─── Magnet Phone Mockup — mirrors Share PhoneMockup exactly, CTA only differs ─
function MagnetPhoneMockup({ coverImage, eventName, date, imageTransform, isDesignMode = false, onImageTransformChange, phoneH, phoneW }) {
  const formattedDate = date
    ? new Intl.DateTimeFormat('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' })
        .format(new Date(date + 'T00:00:00'))
    : '25.02.2026';

  const [imageError, setImageError] = useState(false);
  const [imgNaturalSize, setImgNaturalSize] = useState({ w: 0, h: 0 });
  const screenRef = useRef(null);
  const touchState = useRef({ isDragging: false, lastX: 0, lastY: 0, lastPinchDist: null });
  const didSetInitialTransform = useRef(false);

  useEffect(() => {
    setImageError(false);
    setImgNaturalSize({ w: 0, h: 0 });
    didSetInitialTransform.current = false;
  }, [coverImage]);

  useEffect(() => {
    if (imgNaturalSize.w > 0 && screenRef.current && !didSetInitialTransform.current && onImageTransformChange) {
      const screenW = screenRef.current.offsetWidth;
      const screenH = screenRef.current.offsetHeight;
      const scaleW = screenW / imgNaturalSize.w;
      const scaleH = screenH / imgNaturalSize.h;
      const initialScale = Math.max(scaleW, scaleH);
      onImageTransformChange({ x: 0, y: 0, scale: initialScale });
      didSetInitialTransform.current = true;
    }
  }, [imgNaturalSize, onImageTransformChange]);

  const displayImage = coverImage || '/mockup.jpg';
  const transform = imageTransform || { x: 0, y: 0, scale: 1 };

  const getMinScale = () => {
    if (!screenRef.current || imgNaturalSize.w === 0) return 0.3;
    const screenW = screenRef.current.offsetWidth;
    const screenH = screenRef.current.offsetHeight;
    const scaleW = screenW / imgNaturalSize.w;
    const scaleH = screenH / imgNaturalSize.h;
    return Math.min(scaleW, scaleH);
  };

  const handleImageLoad = (e) => {
    setImgNaturalSize({ w: e.target.naturalWidth, h: e.target.naturalHeight });
  };

  const getPinchDist = (touches) => {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleTouchStart = (e) => {
    if (!isDesignMode) return;
    e.preventDefault();
    if (e.touches.length === 1) {
      touchState.current.isDragging = true;
      touchState.current.lastX = e.touches[0].clientX;
      touchState.current.lastY = e.touches[0].clientY;
      touchState.current.lastPinchDist = null;
    } else if (e.touches.length === 2) {
      touchState.current.isDragging = false;
      touchState.current.lastPinchDist = getPinchDist(e.touches);
    }
  };

  const handleTouchMove = (e) => {
    if (!isDesignMode || !onImageTransformChange) return;
    e.preventDefault();
    if (e.touches.length === 1 && touchState.current.isDragging) {
      const dx = e.touches[0].clientX - touchState.current.lastX;
      const dy = e.touches[0].clientY - touchState.current.lastY;
      touchState.current.lastX = e.touches[0].clientX;
      touchState.current.lastY = e.touches[0].clientY;
      onImageTransformChange((prev) => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
    } else if (e.touches.length === 2 && touchState.current.lastPinchDist !== null) {
      const newDist = getPinchDist(e.touches);
      const ratio = newDist / touchState.current.lastPinchDist;
      touchState.current.lastPinchDist = newDist;
      const minScale = getMinScale();
      onImageTransformChange((prev) => ({ ...prev, scale: Math.min(4, Math.max(minScale, prev.scale * ratio)) }));
    }
  };

  const handleTouchEnd = () => {
    touchState.current.isDragging = false;
    touchState.current.lastPinchDist = null;
  };

  return (
    <div
      className="relative bg-cool-900 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8)] shrink-0 ring-1 ring-foreground/10 mx-auto"
      style={{
        width: phoneW || 'clamp(170px, 25dvh, 240px)',
        height: phoneH || 'clamp(145px, 54dvh, 480px)',
        borderRadius: 'clamp(1.8rem, 3.5dvh, 3rem)',
        padding: 'clamp(4px, 0.8dvh, 8px)',
        transition: 'width 0.5s ease-out, height 0.5s ease-out',
      }}
    >
      {isDesignMode && (
        <div className="absolute inset-0 ring-2 ring-primary z-[70] pointer-events-none animate-pulse" style={{ borderRadius: 'clamp(1.8rem, 3.5dvh, 3rem)' }} />
      )}

      {/* Dynamic Island */}
      <div
        className="absolute left-1/2 -translate-x-1/2 bg-black rounded-full z-[60] flex items-center justify-end shadow-inner"
        style={{ top: 'clamp(8px, 1.5dvh, 18px)', width: 'clamp(44px, 8.5dvh, 76px)', height: 'clamp(13px, 2.2dvh, 22px)', paddingRight: 'clamp(6px, 1dvh, 12px)' }}
      >
        <div className="rounded-full bg-cool-900 border border-foreground/5 shadow-sm" style={{ width: 'clamp(4px, 0.75dvh, 6px)', height: 'clamp(4px, 0.75dvh, 6px)' }} />
      </div>

      {/* Inner Screen */}
      <div
        ref={screenRef}
        className="relative w-full h-full bg-black overflow-hidden flex flex-col border border-black shadow-inner"
        style={{ borderRadius: 'clamp(1.6rem, 3dvh, 2.6rem)', touchAction: isDesignMode ? 'none' : 'auto' }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Status Bar */}
        <div
          className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between pointer-events-none opacity-90"
          style={{ height: 'clamp(28px, 4.5dvh, 42px)', paddingLeft: 'clamp(10px, 1.8dvh, 20px)', paddingRight: 'clamp(10px, 1.8dvh, 20px)' }}
        >
          <span className="font-bold text-white tracking-tight" style={{ fontSize: 'clamp(7px, 1.2dvh, 11px)' }}>9:41</span>
          <div className="flex items-center gap-1">
            <Signal size={8} fill="white" className="text-white" />
            <Wifi size={8} className="text-white" />
            <BatteryFull size={10} fill="white" className="text-white" />
          </div>
        </div>

        {/* Background Image — with graceful fallback when /mockup.jpg is missing */}
        {imageError ? (
          <div className="absolute inset-0 bg-gradient-to-br from-cool-900 to-cool-950 z-0" />
        ) : (
          <img
            src={displayImage}
            onError={() => setImageError(true)}
            onLoad={handleImageLoad}
            alt="Event Cover"
            className="absolute z-0 transition-opacity duration-300"
            style={imgNaturalSize.w > 0 ? {
              top: '50%', left: '50%',
              width: `${imgNaturalSize.w}px`,
              height: `${imgNaturalSize.h}px`,
              maxWidth: 'none', maxHeight: 'none',
              transform: `translate(calc(-50% + ${transform.x}px), calc(-50% + ${transform.y}px)) scale(${transform.scale})`,
              willChange: 'transform', userSelect: 'none', pointerEvents: 'none',
            } : {
              top: 0, left: 0,
              width: '100%', height: '100%',
              objectFit: 'cover', objectPosition: 'center',
              userSelect: 'none', pointerEvents: 'none',
            }}
          />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent z-10 pointer-events-none" />

        {/* Content */}
        <div
          className={`absolute bottom-0 left-0 right-0 z-20 flex flex-col items-center text-center pointer-events-none transition-opacity duration-300 ${isDesignMode ? 'opacity-20' : 'opacity-100'}`}
          dir="rtl"
          style={{ padding: 'clamp(8px, 1.3dvh, 24px)', paddingBottom: 'clamp(10px, 1.8dvh, 32px)' }}
        >
          <h1 className="text-white font-bold leading-tight mb-0.5 drop-shadow-2xl" style={{ fontSize: 'clamp(11px, 2dvh, 20px)', fontFamily: "'Inter', sans-serif" }}>
            {eventName || 'Sarah & Daniel'}
          </h1>
          <p className="text-white/70 font-medium tracking-[0.1em] drop-shadow-md" style={{ fontSize: 'clamp(7px, 1.2dvh, 11px)', marginBottom: 'clamp(8px, 1.5dvh, 20px)' }}>
            <bdi>{formattedDate}</bdi>
          </p>

          {/* CTA — only meaningful deviation from Share mockup */}
          <button
            className="w-[90%] bg-white text-black font-bold rounded-[0.6rem] flex items-center justify-center gap-1.5 shadow-[0_8px_20px_rgba(255,255,255,0.2)] pointer-events-none"
            style={{ fontSize: 'clamp(8px, 1.4dvh, 13px)', paddingTop: 'clamp(5px, 1dvh, 12px)', paddingBottom: 'clamp(5px, 1dvh, 12px)' }}
          >
            <Camera style={{ width: 'clamp(8px, 1.3dvh, 14px)', height: 'clamp(8px, 1.3dvh, 14px)' }} />
            צלמו ושלחו להדפסה
          </button>
        </div>

        {isDesignMode && (
          <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
            <p className="text-white/80 text-[9px] bg-black/60 px-3 py-1 rounded-full font-bold tracking-widest text-center">גרור • צבוט לזום</p>
          </div>
        )}

        {/* Home indicator */}
        <div className="absolute left-1/2 -translate-x-1/2 w-[35%] h-1 bg-white/40 rounded-full z-30 pointer-events-none" style={{ bottom: 'clamp(3px, 0.5dvh, 6px)' }} />
      </div>
    </div>
  );
}

// ─── Inline Calendar — indigo accent ─────────────────────────────────────────
function InlineCalendar({ value, onChange }) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const selected = value ? new Date(value + 'T00:00:00') : null;
  const [viewYear, setViewYear] = useState(selected ? selected.getFullYear() : today.getFullYear());
  const [viewMonth, setViewMonth] = useState(selected ? selected.getMonth() : today.getMonth());

  const hebrewDays = ['א','ב','ג','ד','ה','ו','ש'];
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
    <div className="bg-secondary border border-border rounded-2xl p-3 w-full" dir="ltr">
      <div className="flex items-center justify-between mb-2">
        <button type="button" onClick={prevMonth} className="w-7 h-7 flex items-center justify-center rounded-lg text-foreground/40 hover:text-foreground hover:bg-foreground/[0.06] transition-colors">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-foreground text-sm font-bold"><bdi>{hebrewMonths[viewMonth]}</bdi> <bdi>{viewYear}</bdi></span>
        <button type="button" onClick={nextMonth} className="w-7 h-7 flex items-center justify-center rounded-lg text-foreground/40 hover:text-foreground hover:bg-foreground/[0.06] transition-colors">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      <div className="grid grid-cols-7 mb-1">
        {hebrewDays.map(d => <div key={d} className="text-center text-foreground/30 text-[10px] font-bold py-0.5">{d}</div>)}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((day, i) => (
          <button key={i} type="button" onClick={() => handleDay(day)}
            className={`h-8 w-full flex items-center justify-center text-sm font-medium rounded-full transition-colors
              ${!day ? 'invisible pointer-events-none' : ''}
              ${day && isPast(day) ? 'text-foreground/20 pointer-events-none' : ''}
              ${day && isSel(day) ? 'bg-primary text-primary-foreground shadow-indigo-soft' : ''}
              ${day && isToday(day) && !isSel(day) ? 'ring-1 ring-primary/40 text-foreground' : ''}
              ${day && !isPast(day) && !isSel(day) ? 'text-foreground/75 hover:bg-foreground/[0.08]' : ''}
            `}>
            <bdi>{day || ''}</bdi>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Guest count options ──────────────────────────────────────────────────────
const GUEST_OPTIONS = [
  'עד 100 אורחים',
  'עד 150 אורחים',
  'עד 250 אורחים',
  'עד 400 אורחים',
  'עד 600 אורחים',
  'מעל 600 אורחים',
];

const TOTAL_STEPS = 5;

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function MagnetLead() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const [formData, setFormData] = useState({
    event_name: '',
    cover_image: '',
    event_date: '',
    location: '',
    guest_count: '',
    full_name: '',
    phone: '',
  });

  const [isUploading, setIsUploading] = useState(false);
  const [localPreviewUrl, setLocalPreviewUrl] = useState(null);
  const [isDesignMode, setIsDesignMode] = useState(false);
  const [imageTransform, setImageTransform] = useState({ x: 0, y: 0, scale: 1 });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    setLocalPreviewUrl(objectUrl);
    setIsUploading(true);
    try {
      const compressed = await compressImage(file);
      const { file_url } = await memoriaService.storage.upload(compressed);
      handleInputChange('cover_image', file_url);
      URL.revokeObjectURL(objectUrl);
      setLocalPreviewUrl(null);
    } catch (err) {
      console.error('[MagnetLead] Upload failed:', err);
      URL.revokeObjectURL(objectUrl);
      setLocalPreviewUrl(null);
    }
    setIsUploading(false);
  };

  const isCurrentStepValid = () => {
    if (currentStep === 1) return formData.event_name.trim().length > 0;
    if (currentStep === 2) return true; // cover image optional
    if (currentStep === 3) return !!(formData.event_date && formData.location.trim());
    if (currentStep === 4) return !!formData.guest_count;
    if (currentStep === 5) return formData.full_name.trim().length > 0 && /^05\d{8}$/.test(formData.phone.replace(/-/g, '').trim());
    return true;
  };

  const validateStep = (step) => {
    const newErrors = {};
    if (step === 1 && !formData.event_name.trim()) newErrors.event_name = 'שם האירוע הוא שדה חובה';
    if (step === 3) {
      if (!formData.event_date) newErrors.event_date = 'יש לבחור תאריך';
      if (!formData.location.trim()) newErrors.location = 'שם האולם / מיקום הוא שדה חובה';
    }
    if (step === 4 && !formData.guest_count) newErrors.guest_count = 'יש לבחור טווח אורחים';
    if (step === 5) {
      if (!formData.full_name.trim()) newErrors.full_name = 'שם מלא הוא שדה חובה';
      if (!/^05\d{8}$/.test(formData.phone.replace(/-/g, '').trim()))
        newErrors.phone = 'מספר טלפון לא תקין (05XXXXXXXX)';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => { if (validateStep(currentStep)) setCurrentStep(prev => Math.min(prev + 1, TOTAL_STEPS)); };
  const handleBack = () => { setCurrentStep(prev => Math.max(prev - 1, 1)); setErrors({}); };

  const handleSubmit = async () => {
    if (!validateStep(5)) return;
    setIsLoading(true);
    try {
      await memoriaService.leads.create({
        full_name: formData.full_name.trim(),
        phone: formData.phone.replace(/-/g, '').trim(),
        event_date: formData.event_date,
        details: `${formData.event_name} · ${formData.location} · ${formData.guest_count}${formData.cover_image ? ` · cover:${formData.cover_image}` : ''}`,
      });
      setSubmitted(true);
    } catch (err) {
      console.error('[MagnetLead] Failed to submit lead:', err);
      setErrors({ submit: 'שגיאה בשליחה, אנא נסו שוב' });
    } finally {
      setIsLoading(false);
    }
  };

  const progressPercentage = (currentStep / TOTAL_STEPS) * 100;
  const isDateStep = currentStep === 3;
  const phoneH = 'clamp(145px, 54dvh, 480px)';
  const phoneW = 'clamp(170px, 25dvh, 240px)';
  const displayPreviewImage = localPreviewUrl || formData.cover_image;

  // ── Success screen ──────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="dark min-h-screen bg-gradient-to-br from-cool-950 via-cool-900 to-cool-950 text-foreground flex items-center justify-center px-6 font-heebo" dir="rtl">
        <div className="max-w-sm w-full text-center">
          <div className="w-14 h-14 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center mx-auto mb-5">
            <Check className="w-7 h-7 text-indigo-400" />
          </div>
          <h1 className="font-playfair text-3xl text-foreground/90 mb-3">הבקשה התקבלה!</h1>
          <p className="text-muted-foreground text-sm leading-relaxed mb-8">
            בקשת השריון התקבלה! אנו בודקים את זמינות הצוותים שלנו לתאריך שלך וניצור קשר בהקדם לאישור וסגירה.
          </p>
          <button
            onClick={() => navigate('/')}
            className="w-full py-3 bg-card border border-border text-muted-foreground font-semibold rounded-xl hover:bg-accent hover:text-foreground transition-all text-sm"
          >
            חזרה לעמוד הבית
          </button>
        </div>
      </div>
    );
  }

  // ── Wizard ──────────────────────────────────────────────────────────────────
  return (
    <div
      className="dark flex flex-col w-full h-[100dvh] bg-gradient-to-br from-cool-950 via-cool-900 to-cool-950 text-foreground overflow-hidden font-heebo"
      dir="rtl"
    >
      {/* Progress Bar */}
      <div className="h-1 bg-border shrink-0 w-full z-50">
        <div
          className="h-full bg-primary transition-all duration-300 shadow-[0_0_10px_rgba(124,134,225,0.45)]"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      <div className="flex flex-col lg:flex-row flex-1 min-h-0 overflow-hidden">

        {/* Phone mockup area — hidden on date step */}
        {!isDateStep && (
          <div className="flex-none w-full h-[56dvh] lg:flex-1 lg:h-auto bg-card flex items-center justify-center relative z-0 shrink-0 border-b border-border lg:border-none overflow-hidden py-2">
            <div className="absolute inset-0 bg-gradient-to-b from-secondary to-background" />
            <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 70% 60% at 50% 55%, rgba(124,134,225,0.06) 0%, transparent 70%)' }} />
            <div className="h-full w-full flex items-center justify-center py-3 relative z-10">
              <div className="relative">
                <MagnetPhoneMockup
                  coverImage={displayPreviewImage}
                  eventName={formData.event_name}
                  date={formData.event_date}
                  imageTransform={imageTransform}
                  isDesignMode={isDesignMode}
                  onImageTransformChange={setImageTransform}
                  phoneH={phoneH}
                  phoneW={phoneW}
                />
                {isUploading && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 rounded-[2.2rem] md:rounded-[3rem] z-[80]">
                    <Loader2 className="w-8 h-8 text-white animate-spin mb-2" />
                    <p className="text-white text-[10px] font-bold tracking-widest">מעלה...</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Form area */}
        <div className="flex-1 bg-background lg:rounded-none z-10 flex flex-col relative min-h-0 shadow-[0_-20px_40px_rgba(0,0,0,0.6)]">

          <div className={`flex-1 overflow-hidden px-4 flex flex-col items-center ${isDateStep ? 'justify-start pt-4' : 'justify-center'}`}>
            <div className="w-full max-w-sm mx-auto flex flex-col justify-center items-center">

              {/* Step 1 — שם האירוע */}
              {currentStep === 1 && (
                <div className="animate-in fade-in slide-in-from-bottom-6 duration-300 text-center space-y-2 w-full">
                  <h2 className="font-playfair text-xl font-semibold tracking-tight mb-1 text-foreground">מה שם האירוע?</h2>
                  <p className="text-sm text-muted-foreground mb-2">השם שיופיע לאורחים בממשק המגנט</p>
                  <Input
                    value={formData.event_name}
                    onChange={e => handleInputChange('event_name', e.target.value)}
                    placeholder="למשל: Yael & Daniel"
                    style={{ fontSize: '16px' }}
                    className="bg-secondary border-border text-foreground h-10 text-center rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-inner placeholder:text-foreground/25 w-full"
                  />
                  {errors.event_name && <p className="text-destructive text-[10px] mt-2 font-bold animate-pulse">{errors.event_name}</p>}
                </div>
              )}

              {/* Step 2 — תמונת רקע (image upload) */}
              {currentStep === 2 && (
                <div className="animate-in fade-in slide-in-from-bottom-6 duration-300 text-center space-y-2 w-full">
                  <h2 className="font-playfair text-xl font-semibold tracking-tight mb-1 text-foreground">איך תיראה ההזמנה?</h2>
                  <p className="text-sm text-muted-foreground mb-2">הרקע שיופיע לאורחים לפני שהם פותחים מצלמה</p>
                  <div className="grid grid-cols-2 gap-3 w-full pt-2">
                    <label htmlFor="add-photo" className="cursor-pointer group h-full">
                      <div className="bg-primary hover:brightness-110 text-primary-foreground transition-all rounded-xl py-2 px-2 text-center h-full flex flex-col justify-center items-center shadow-indigo-soft active:scale-95 border border-foreground/10">
                        {isUploading ? <Loader2 className="w-6 h-6 mb-1.5 animate-spin" /> : <ImageIcon className="w-6 h-6 mb-1.5" />}
                        <p className="text-[10px] font-black uppercase tracking-widest leading-tight">{isUploading ? 'מעלה...' : 'העלאה'}</p>
                      </div>
                    </label>
                    <input type="file" id="add-photo" accept="image/*" onChange={handleFileChange} className="hidden" />
                    <button
                      type="button"
                      onClick={() => setIsDesignMode(prev => !prev)}
                      disabled={!formData.cover_image}
                      className={`transition-all rounded-xl py-2 px-2 text-center border flex flex-col justify-center items-center active:scale-95 h-full ${
                        isDesignMode
                          ? 'bg-primary border-primary text-primary-foreground shadow-indigo-soft'
                          : !formData.cover_image
                            ? 'bg-card border-border text-muted-foreground/40 cursor-not-allowed'
                            : 'bg-secondary hover:bg-accent border-border'
                      }`}
                    >
                      {isDesignMode ? <X className="w-6 h-6 mb-1.5" /> : <Pencil className="w-6 h-6 mb-1.5 text-muted-foreground" />}
                      <p className={`text-[10px] font-black uppercase tracking-widest leading-tight ${isDesignMode ? 'text-white' : 'text-muted-foreground'}`}>
                        {isDesignMode ? 'סיום' : 'עיצוב'}
                      </p>
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3 — תאריך + מיקום (calendar full screen) */}
              {currentStep === 3 && (
                <div className="animate-in fade-in slide-in-from-bottom-6 duration-300 w-full flex flex-col gap-2">
                  <div className="text-center space-y-1">
                    <h2 className="font-playfair text-xl font-semibold tracking-tight text-foreground">מתי ואיפה?</h2>
                    <p className="text-sm text-muted-foreground">תאריך ומיקום האירוע</p>
                  </div>
                  <InlineCalendar
                    value={formData.event_date}
                    onChange={v => handleInputChange('event_date', v)}
                  />
                  {errors.event_date && <p className="text-destructive text-xs font-bold text-center animate-pulse">{errors.event_date}</p>}

                  {/* Location block — visually separated from the date picker */}
                  <div className="mt-3 pt-3 border-t border-border/60 space-y-2">
                    <Input
                      value={formData.location}
                      onChange={e => handleInputChange('location', e.target.value)}
                      placeholder="שם האולם / מיקום האירוע"
                      style={{ fontSize: '16px' }}
                      className="bg-secondary border-border text-foreground h-10 text-center rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-inner placeholder:text-foreground/25 w-full"
                    />
                    {errors.location && <p className="text-destructive text-xs font-bold text-center">{errors.location}</p>}
                  </div>
                </div>
              )}

              {/* Step 4 — כמות מוזמנים */}
              {currentStep === 4 && (
                <div className="animate-in fade-in slide-in-from-bottom-6 duration-300 w-full flex flex-col gap-3">
                  <div className="text-center space-y-1">
                    <h2 className="font-playfair text-xl font-semibold tracking-tight text-foreground">כמות מוזמנים</h2>
                    <p className="text-sm text-muted-foreground">כמה אורחים צפויים באירוע?</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-secondary border border-border">
                    {GUEST_OPTIONS.map(opt => {
                      const selected = formData.guest_count === opt;
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => handleInputChange('guest_count', opt)}
                          className={`h-11 rounded-xl font-bold text-sm transition-all active:scale-95 border ${
                            selected
                              ? 'bg-transparent text-primary border-primary shadow-indigo-soft'
                              : 'bg-transparent text-muted-foreground border-transparent hover:text-foreground/80'
                          }`}
                        >
                          {opt.split(/(\d+)/).map((part, i) =>
                            /^\d+$/.test(part) ? <bdi key={i}>{part}</bdi> : part
                          )}
                        </button>
                      );
                    })}
                  </div>
                  {errors.guest_count && <p className="text-destructive text-xs font-bold text-center">{errors.guest_count}</p>}
                </div>
              )}

              {/* Step 5 — פרטי קשר (summary card removed to fit on screen) */}
              {currentStep === 5 && (
                <div className="animate-in fade-in slide-in-from-bottom-6 duration-300 w-full flex flex-col gap-2">
                  <div className="text-center space-y-1">
                    <h2 className="font-playfair text-xl font-semibold tracking-tight text-foreground">כמעט שם</h2>
                    <p className="text-sm text-muted-foreground">נחזור אליכם לאישור וסגירת התאריך</p>
                  </div>

                  <div>
                    <Input
                      value={formData.full_name}
                      onChange={e => handleInputChange('full_name', e.target.value)}
                      placeholder="שם מלא"
                      style={{ fontSize: '16px' }}
                      className="bg-secondary border-border text-foreground h-10 text-center rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-inner placeholder:text-foreground/25 w-full"
                    />
                    {errors.full_name && <p className="text-destructive text-[10px] mt-1 font-bold animate-pulse">{errors.full_name}</p>}
                  </div>
                  <div>
                    <Input
                      value={formData.phone}
                      onChange={e => handleInputChange('phone', e.target.value)}
                      placeholder="מספר טלפון"
                      type="tel"
                      inputMode="tel"
                      dir="ltr"
                      style={{ fontSize: '16px' }}
                      className="bg-secondary border-border text-foreground h-10 text-center rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-inner placeholder:text-foreground/25 w-full"
                    />
                    {errors.phone && <p className="text-destructive text-[10px] mt-1 font-bold animate-pulse">{errors.phone}</p>}
                  </div>
                  {errors.submit && <p className="text-destructive text-xs font-bold text-center">{errors.submit}</p>}
                </div>
              )}

            </div>
          </div>

          {/* Footer Navigation */}
          <div
            className="bg-cool-950/80 backdrop-blur-md px-4 flex-none border-t border-border w-full z-50 shrink-0"
            style={{ paddingTop: '0.25rem', paddingBottom: 'max(0.25rem, env(safe-area-inset-bottom))' }}
          >
            <div className="w-full max-w-sm mx-auto flex gap-3 items-center">
              {currentStep === 1 ? (
                <Link
                  to="/"
                  className="w-11 h-11 bg-card text-muted-foreground rounded-xl flex items-center justify-center transition-all active:scale-90 border border-border shrink-0 hover:text-foreground"
                >
                  <Home className="w-4 h-4" />
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={handleBack}
                  className="w-11 h-11 bg-card text-foreground rounded-xl flex items-center justify-center transition-all active:scale-90 border border-border shrink-0"
                >
                  <ArrowLeft className="w-5 h-5 rotate-180" />
                </button>
              )}

              <button
                type="button"
                onClick={currentStep === TOTAL_STEPS ? handleSubmit : handleNext}
                disabled={isLoading}
                className={`text-base font-black rounded-xl flex-1 h-12 transition-all duration-300 active:scale-95 flex items-center justify-center ${
                  isCurrentStepValid() || isLoading
                    ? 'bg-primary text-primary-foreground shadow-indigo-soft border border-white/10'
                    : 'bg-card text-muted-foreground border border-border'
                }`}
              >
                {isLoading
                  ? <Loader2 className="w-5 h-5 animate-spin" />
                  : currentStep === TOTAL_STEPS ? 'שליחת בקשה' : 'המשך'
                }
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
