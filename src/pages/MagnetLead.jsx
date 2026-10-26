import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Loader2, Home, ArrowLeft, Check, ChevronLeft, ChevronRight,
  ImageIcon, Pencil, X,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import memoriaService from '@/components/memoriaService';
import LeadPhoneMockup from '@/components/magnet/lead/LeadPhoneMockup';
import StepHeader, { LEAD_HEADING_FONT } from '@/components/magnet/lead/StepHeader';
import { useKeyboardViewport } from '@/hooks/useKeyboardViewport';

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
  // Relative to the phone screen (see LeadPhoneMockup), so it survives phone resizes.
  const [imageTransform, setImageTransform] = useState({ x: 0, y: 0, zoom: 1 });
  const keyboard = useKeyboardViewport();

  // The wizard is a fixed, exactly-one-screen layout: stop the document behind
  // it from scrolling (iOS rubber-band / toolbar collapse).
  useEffect(() => {
    const els = [document.documentElement, document.body];
    els.forEach((el) => el.classList.add('overflow-hidden', 'overscroll-none'));
    return () => els.forEach((el) => el.classList.remove('overflow-hidden', 'overscroll-none'));
  }, []);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    setLocalPreviewUrl(objectUrl);
    setImageTransform({ x: 0, y: 0, zoom: 1 }); // a new cover starts centred, covering the screen
    setIsUploading(true);
    setErrors(prev => ({ ...prev, cover_image: null }));
    try {
      const compressed = await compressImage(file);
      const { file_url } = await memoriaService.storage.uploadLeadCover(compressed);
      handleInputChange('cover_image', file_url);
      URL.revokeObjectURL(objectUrl);
      setLocalPreviewUrl(null);
    } catch (err) {
      console.error('[MagnetLead] Upload failed:', err);
      URL.revokeObjectURL(objectUrl);
      setLocalPreviewUrl(null);
      setErrors(prev => ({ ...prev, cover_image: 'העלאת התמונה נכשלה — נסו שוב' }));
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
  const displayPreviewImage = localPreviewUrl || formData.cover_image;

  // ── Success screen ──────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="dark min-h-screen bg-gradient-to-br from-cool-950 via-cool-900 to-cool-950 text-foreground flex items-center justify-center px-6 font-heebo" dir="rtl">
        <div className="max-w-sm w-full text-center">
          <div className="w-14 h-14 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center mx-auto mb-5">
            <Check className="w-7 h-7 text-indigo-400" />
          </div>
          <h1 className={`${LEAD_HEADING_FONT} text-3xl text-foreground/90 mb-3`}>הבקשה התקבלה!</h1>
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
      className="dark fixed inset-x-0 top-0 flex flex-col w-full h-[100dvh] bg-gradient-to-br from-cool-950 via-cool-900 to-cool-950 text-foreground overflow-hidden font-heebo"
      style={keyboard.open ? { height: `${keyboard.height}px`, transform: `translateY(${keyboard.offsetTop}px)` } : undefined}
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

        {/* Phone mockup area — hidden on date step. Takes all the height the form
            panel leaves (the phone scales to fit it); fades out while typing. */}
        {!isDateStep && (
          <div className={`flex-1 min-h-0 w-full bg-card flex items-center justify-center relative z-0 border-b border-border lg:border-none overflow-hidden [container-type:size] transition-opacity duration-300 ${keyboard.open ? 'opacity-0' : 'opacity-100'}`}>
            <div className="absolute inset-0 bg-gradient-to-b from-secondary to-background" />
            <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 70% 60% at 50% 55%, rgba(124,134,225,0.06) 0%, transparent 70%)' }} />
            <LeadPhoneMockup
              coverImage={displayPreviewImage}
              eventName={formData.event_name}
              date={formData.event_date}
              imageTransform={imageTransform}
              isDesignMode={isDesignMode}
              isUploading={isUploading}
              showEmptyHint={currentStep <= 2}
              onImageTransformChange={setImageTransform}
            />
          </div>
        )}

        {/* Form area */}
        <div className={`${isDateStep ? 'flex-1' : 'flex-none lg:flex-1'} bg-background lg:rounded-none z-10 flex flex-col relative min-h-0 shadow-[0_-20px_40px_rgba(0,0,0,0.6)]`}>

          <div className={`overflow-hidden px-4 flex flex-col items-center ${isDateStep ? 'flex-1 justify-start pt-4' : 'py-3 lg:flex-1 lg:justify-center'}`}>
            <div className="w-full max-w-sm mx-auto flex flex-col justify-center items-center">

              {/* Step 1 — שם האירוע */}
              {currentStep === 1 && (
                <div className="animate-in fade-in slide-in-from-bottom-6 duration-300 text-center w-full flex flex-col gap-3">
                  <StepHeader title="מה שם האירוע?" subtitle="השם שיופיע לאורחים בממשק המגנט" />
                  <Input
                    value={formData.event_name}
                    onChange={e => handleInputChange('event_name', e.target.value)}
                    placeholder="למשל: יעל & דניאל"
                    style={{ fontSize: '16px' }}
                    className="bg-secondary border-border text-foreground h-10 text-center rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-inner placeholder:text-foreground/25 w-full"
                  />
                  {errors.event_name && <p className="text-destructive text-[10px] font-bold animate-pulse">{errors.event_name}</p>}
                </div>
              )}

              {/* Step 2 — תמונת רקע (image upload) */}
              {currentStep === 2 && (
                <div className="animate-in fade-in slide-in-from-bottom-6 duration-300 text-center w-full flex flex-col gap-3">
                  <StepHeader title="איך תיראה ההזמנה?" subtitle="הרקע שיופיע לאורחים לפני שהם פותחים מצלמה" />
                  <div className="grid grid-cols-2 gap-3 w-full">
                    <label htmlFor="add-photo" className="cursor-pointer group h-full">
                      <div className="bg-primary hover:brightness-110 text-primary-foreground transition-all rounded-xl py-2 px-2 text-center h-full flex flex-col justify-center items-center shadow-indigo-soft active:scale-95 border border-foreground/10">
                        {isUploading ? <Loader2 className="w-6 h-6 mb-1.5 animate-spin" /> : <ImageIcon className="w-6 h-6 mb-1.5" />}
                        <p className="text-[10px] font-black leading-tight">{isUploading ? 'מעלה...' : 'העלאה'}</p>
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
                      <p className={`text-[10px] font-black leading-tight ${isDesignMode ? 'text-white' : 'text-muted-foreground'}`}>
                        {isDesignMode ? 'סיום' : 'עיצוב'}
                      </p>
                    </button>
                  </div>
                  {errors.cover_image && <p className="text-destructive text-xs font-bold text-center">{errors.cover_image}</p>}
                </div>
              )}

              {/* Step 3 — תאריך + מיקום (calendar full screen) */}
              {currentStep === 3 && (
                <div className="animate-in fade-in slide-in-from-bottom-6 duration-300 w-full flex flex-col gap-2">
                  <StepHeader title="מתי ואיפה?" subtitle="תאריך ומיקום האירוע" />
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
                  <StepHeader title="כמות מוזמנים" subtitle="כמה אורחים צפויים באירוע?" />
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
                  <StepHeader title="כמעט שם" subtitle="נחזור אליכם לאישור וסגירת התאריך" />

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
