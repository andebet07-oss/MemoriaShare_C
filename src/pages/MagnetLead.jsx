import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Loader2, Home, ArrowLeft, Camera, Magnet,
  BatteryFull, Wifi, Signal, Check, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import memoriaService from '@/components/memoriaService';

// ─── Magnet Phone Mockup — dvh-based scaling ─────────────────────────────────
function MagnetPhoneMockup({ eventName, date, phoneH, phoneW }) {
  const formattedDate = date
    ? new Intl.DateTimeFormat('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' })
        .format(new Date(date + 'T00:00:00'))
    : '02.08.2026';

  return (
    <div
      className="relative bg-zinc-900 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8)] shrink-0 ring-1 ring-white/10 mx-auto"
      style={{
        width: phoneW || 'clamp(170px, 25dvh, 240px)',
        height: phoneH || 'clamp(145px, 54dvh, 480px)',
        borderRadius: 'clamp(1.8rem, 3.5dvh, 3rem)',
        padding: 'clamp(4px, 0.8dvh, 8px)',
        transition: 'width 0.5s ease-out, height 0.5s ease-out',
      }}
    >
      {/* Dynamic Island */}
      <div
        className="absolute left-1/2 -translate-x-1/2 bg-black rounded-full z-[60] flex items-center justify-end shadow-inner"
        style={{ top: 'clamp(8px, 1.5dvh, 18px)', width: 'clamp(44px, 8.5dvh, 76px)', height: 'clamp(13px, 2.2dvh, 22px)', paddingRight: 'clamp(6px, 1dvh, 12px)' }}
      >
        <div className="rounded-full bg-[#111] border border-white/5 shadow-sm" style={{ width: 'clamp(4px, 0.75dvh, 6px)', height: 'clamp(4px, 0.75dvh, 6px)' }} />
      </div>

      {/* Inner Screen */}
      <div
        className="relative w-full h-full bg-black overflow-hidden border border-black shadow-inner"
        style={{ borderRadius: 'clamp(1.6rem, 3dvh, 2.6rem)' }}
        dir="rtl"
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

        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-violet-950 to-black z-0" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/20 z-10 pointer-events-none" />

        {/* Content */}
        <div
          className="absolute bottom-0 left-0 right-0 z-20 flex flex-col items-center text-center pointer-events-none"
          style={{ padding: 'clamp(8px, 1.3dvh, 20px)', paddingBottom: 'clamp(10px, 1.8dvh, 32px)' }}
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-500/20 border border-violet-500/30 mb-1.5">
            <Magnet style={{ width: 'clamp(8px, 1.2dvh, 12px)', height: 'clamp(8px, 1.2dvh, 12px)' }} className="text-violet-400" />
            <span className="text-violet-300 font-semibold" style={{ fontSize: 'clamp(6px, 1dvh, 9px)' }}>מגנטים · פרימיום</span>
          </div>

          <h1 className="text-white font-bold leading-tight mb-0.5 drop-shadow-2xl transition-all duration-300" style={{ fontSize: 'clamp(11px, 2dvh, 18px)' }}>
            {eventName || 'שם האירוע שלכם'}
          </h1>
          <p className="text-white/60 tracking-wide mb-1.5" style={{ fontSize: 'clamp(7px, 1.2dvh, 11px)' }}>{formattedDate}</p>
          <p className="text-white/70 font-semibold mb-2" style={{ fontSize: 'clamp(7px, 1.1dvh, 10px)' }}>
            נותרו לך <span className="text-white font-black">5</span> הדפסות
          </p>
          <button
            className="w-[90%] bg-white text-black font-bold rounded-[0.6rem] flex items-center justify-center gap-1 shadow-[0_8px_20px_rgba(255,255,255,0.15)] pointer-events-none"
            style={{ fontSize: 'clamp(8px, 1.4dvh, 12px)', paddingTop: 'clamp(5px, 1dvh, 10px)', paddingBottom: 'clamp(5px, 1dvh, 10px)' }}
          >
            <Camera style={{ width: 'clamp(8px, 1.3dvh, 14px)', height: 'clamp(8px, 1.3dvh, 14px)' }} />
            צלמו ושלחו להדפסה
          </button>
        </div>

        {/* Home indicator */}
        <div className="absolute left-1/2 -translate-x-1/2 w-[35%] h-1 bg-white/40 rounded-full z-30 pointer-events-none" style={{ bottom: 'clamp(3px, 0.5dvh, 6px)' }} />
      </div>
    </div>
  );
}

// ─── Inline Calendar — violet accent ─────────────────────────────────────────
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
    <div className="bg-[#161616] border border-white/10 rounded-2xl p-4 w-full" dir="ltr">
      <div className="flex items-center justify-between mb-3">
        <button type="button" onClick={prevMonth} className="w-8 h-8 flex items-center justify-center rounded-lg text-white/40 hover:text-white hover:bg-white/[0.06] transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="text-white text-base font-bold">{hebrewMonths[viewMonth]} {viewYear}</span>
        <button type="button" onClick={nextMonth} className="w-8 h-8 flex items-center justify-center rounded-lg text-white/40 hover:text-white hover:bg-white/[0.06] transition-colors">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
      <div className="grid grid-cols-7 mb-1">
        {hebrewDays.map(d => <div key={d} className="text-center text-white/30 text-xs font-bold py-1">{d}</div>)}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((day, i) => (
          <button key={i} type="button" onClick={() => handleDay(day)}
            className={`h-9 w-full flex items-center justify-center text-base font-medium rounded-full transition-colors
              ${!day ? 'invisible pointer-events-none' : ''}
              ${day && isPast(day) ? 'text-white/20 pointer-events-none' : ''}
              ${day && isSel(day) ? 'bg-violet-600 text-white shadow-md' : ''}
              ${day && isToday(day) && !isSel(day) ? 'ring-1 ring-violet-500/40 text-white' : ''}
              ${day && !isPast(day) && !isSel(day) ? 'text-white/75 hover:bg-white/[0.08]' : ''}
            `}>
            {day || ''}
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

const TOTAL_STEPS = 4;

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function MagnetLead() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const [formData, setFormData] = useState({
    event_name: '',
    event_date: '',
    location: '',
    guest_count: '',
    full_name: '',
    phone: '',
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
  };

  const isCurrentStepValid = () => {
    if (currentStep === 1) return formData.event_name.trim().length > 0;
    if (currentStep === 2) return !!(formData.event_date && formData.location.trim());
    if (currentStep === 3) return !!formData.guest_count;
    if (currentStep === 4) return formData.full_name.trim().length > 0 && /^05\d{8}$/.test(formData.phone.replace(/-/g, '').trim());
    return true;
  };

  const validateStep = (step) => {
    const newErrors = {};
    if (step === 1 && !formData.event_name.trim()) newErrors.event_name = 'שם האירוע הוא שדה חובה';
    if (step === 2) {
      if (!formData.event_date) newErrors.event_date = 'יש לבחור תאריך';
      if (!formData.location.trim()) newErrors.location = 'שם האולם / מיקום הוא שדה חובה';
    }
    if (step === 3 && !formData.guest_count) newErrors.guest_count = 'יש לבחור טווח אורחים';
    if (step === 4) {
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
    if (!validateStep(4)) return;
    setIsLoading(true);
    try {
      await memoriaService.leads.create({
        full_name: formData.full_name.trim(),
        phone: formData.phone.replace(/-/g, '').trim(),
        event_date: formData.event_date,
        details: `${formData.event_name} · ${formData.location} · ${formData.guest_count}`,
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
  // Step 2 has the date calendar — hide phone to give full screen to the form
  const isDateStep = currentStep === 2;
  const phoneH = 'clamp(145px, 54dvh, 480px)';
  const phoneW = 'clamp(170px, 25dvh, 240px)';

  // ── Success screen ──────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-6" dir="rtl"
        style={{ fontFamily: "'Heebo', 'Assistant', sans-serif" }}>
        <div className="max-w-sm w-full text-center">
          <div className="w-16 h-16 rounded-2xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center mx-auto mb-6">
            <Check className="w-8 h-8 text-violet-400" />
          </div>
          <h1 className="text-white font-black text-2xl mb-3">הבקשה התקבלה!</h1>
          <p className="text-white/60 text-sm leading-relaxed mb-8">
            בקשת השריון התקבלה! אנו בודקים את זמינות הצוותים שלנו לתאריך שלך וניצור קשר בהקדם לאישור וסגירה.
          </p>
          <button
            onClick={() => navigate('/')}
            className="w-full py-3 bg-white/5 border border-white/10 text-white/70 font-semibold rounded-xl hover:bg-white/10 transition-all text-sm"
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
      className="flex flex-col w-full h-[100dvh] bg-[#0a0a0a] text-white overflow-hidden"
      dir="rtl"
      style={{ fontFamily: "'Heebo', 'Assistant', sans-serif" }}
    >
      {/* Progress Bar */}
      <div className="h-1 bg-gray-800 shrink-0 w-full z-50">
        <div
          className="h-full bg-violet-600 transition-all duration-300 shadow-[0_0_10px_rgba(139,92,246,0.5)]"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      <div className="flex flex-col lg:flex-row flex-1 min-h-0 overflow-hidden">

        {/* Phone mockup area — hidden on date step */}
        {!isDateStep && (
          <div className="flex-none w-full h-[56dvh] lg:flex-1 lg:h-auto bg-[#111] flex items-center justify-center relative z-0 shrink-0 border-b border-white/5 lg:border-none overflow-hidden py-2">
            <div className="absolute inset-0 bg-gradient-to-b from-[#161616] to-[#0a0a0a]" />
            <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 70% 60% at 50% 55%, rgba(139,92,246,0.06) 0%, transparent 70%)' }} />
            <div className="h-full w-full flex items-center justify-center py-3 relative z-10">
              <MagnetPhoneMockup
                eventName={formData.event_name}
                date={formData.event_date}
                phoneH={phoneH}
                phoneW={phoneW}
              />
            </div>
          </div>
        )}

        {/* Form area */}
        <div className="flex-1 bg-[#0a0a0a] lg:rounded-none z-10 flex flex-col relative min-h-0 shadow-[0_-20px_40px_rgba(0,0,0,0.6)]">

          <div className={`flex-1 overflow-hidden px-4 flex flex-col items-center ${isDateStep ? 'justify-start pt-6' : 'justify-center'}`}>
            <div className="w-full max-w-sm mx-auto flex flex-col justify-center items-center">

              {/* Step 1 — שם האירוע */}
              {currentStep === 1 && (
                <div className="animate-in fade-in slide-in-from-bottom-6 duration-300 text-center space-y-2 w-full">
                  <h2 className="text-lg font-bold tracking-tight mb-1">מה שם האירוע?</h2>
                  <p className="text-sm text-white/45 mb-2">השם שיופיע לאורחים בממשק המגנט</p>
                  <Input
                    value={formData.event_name}
                    onChange={e => handleInputChange('event_name', e.target.value)}
                    placeholder="למשל: חתונת יעל ודניאל"
                    style={{ fontSize: '16px' }}
                    className="bg-[#161616] border-gray-800 text-white h-10 text-center rounded-xl focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all shadow-inner placeholder:text-gray-700 w-full"
                  />
                  {errors.event_name && <p className="text-red-500 text-xs mt-2 font-bold animate-pulse">{errors.event_name}</p>}
                </div>
              )}

              {/* Step 2 — תאריך + מיקום (calendar full screen) */}
              {currentStep === 2 && (
                <div className="animate-in fade-in slide-in-from-bottom-6 duration-300 w-full flex flex-col gap-3">
                  <div className="text-center space-y-1">
                    <h2 className="text-lg font-bold tracking-tight">תאריך ומיקום</h2>
                    <p className="text-sm text-white/45">מתי ואיפה יתקיים האירוע?</p>
                  </div>
                  <InlineCalendar
                    value={formData.event_date}
                    onChange={v => handleInputChange('event_date', v)}
                  />
                  {errors.event_date && <p className="text-red-500 text-xs font-bold text-center animate-pulse">{errors.event_date}</p>}
                  <Input
                    value={formData.location}
                    onChange={e => handleInputChange('location', e.target.value)}
                    placeholder="שם האולם / מיקום האירוע"
                    style={{ fontSize: '16px' }}
                    className="bg-[#161616] border-gray-800 text-white h-10 text-center rounded-xl focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all shadow-inner placeholder:text-gray-700 w-full"
                  />
                  {errors.location && <p className="text-red-500 text-xs font-bold text-center">{errors.location}</p>}
                </div>
              )}

              {/* Step 3 — כמות מוזמנים */}
              {currentStep === 3 && (
                <div className="animate-in fade-in slide-in-from-bottom-6 duration-300 w-full flex flex-col gap-3">
                  <div className="text-center space-y-1">
                    <h2 className="text-lg font-bold tracking-tight">כמות מוזמנים</h2>
                    <p className="text-sm text-white/45">כמה אורחים צפויים באירוע?</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {GUEST_OPTIONS.map(opt => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => handleInputChange('guest_count', opt)}
                        className={`h-11 rounded-xl font-bold text-sm transition-all active:scale-95 border ${
                          formData.guest_count === opt
                            ? 'bg-violet-600 text-white border-violet-400 shadow-md'
                            : 'bg-[#161616] text-white/40 border-white/10 hover:border-white/20'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                  {errors.guest_count && <p className="text-red-500 text-xs font-bold text-center">{errors.guest_count}</p>}
                  <p className="text-white/25 text-[10px] text-center">המחיר משתנה בהתאם לכמות. הצוות שלנו יציג הצעה מותאמת.</p>
                </div>
              )}

              {/* Step 4 — פרטי קשר */}
              {currentStep === 4 && (
                <div className="animate-in fade-in slide-in-from-bottom-6 duration-300 w-full flex flex-col gap-3">
                  {/* Event summary */}
                  <div className="bg-[#141414] border border-white/[0.07] rounded-2xl px-4 py-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-white/30 text-xs">אירוע</span>
                      <span className="text-white/85 text-xs font-semibold truncate max-w-[65%] text-left">{formData.event_name}</span>
                    </div>
                    {formData.event_date && (
                      <div className="flex items-center justify-between">
                        <span className="text-white/30 text-xs">תאריך</span>
                        <span className="text-white/85 text-xs font-semibold">
                          {new Intl.DateTimeFormat('he-IL', { day: '2-digit', month: 'long', year: 'numeric' })
                            .format(new Date(formData.event_date + 'T00:00:00'))}
                        </span>
                      </div>
                    )}
                    {formData.guest_count && (
                      <div className="flex items-center justify-between">
                        <span className="text-white/30 text-xs">מוזמנים</span>
                        <span className="text-white/85 text-xs font-semibold">{formData.guest_count}</span>
                      </div>
                    )}
                  </div>

                  <div className="text-center space-y-1">
                    <h2 className="text-lg font-bold tracking-tight">כמעט שם</h2>
                    <p className="text-sm text-white/45">נחזור אליכם לאישור וסגירת התאריך</p>
                  </div>

                  <div>
                    <Input
                      value={formData.full_name}
                      onChange={e => handleInputChange('full_name', e.target.value)}
                      placeholder="שם מלא"
                      style={{ fontSize: '16px' }}
                      className="bg-[#161616] border-gray-800 text-white h-10 text-center rounded-xl focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all shadow-inner placeholder:text-gray-700 w-full"
                    />
                    {errors.full_name && <p className="text-red-500 text-xs mt-1 font-bold animate-pulse">{errors.full_name}</p>}
                  </div>
                  <div>
                    <Input
                      value={formData.phone}
                      onChange={e => handleInputChange('phone', e.target.value)}
                      placeholder="מספר טלפון (05XXXXXXXX)"
                      type="tel"
                      inputMode="tel"
                      dir="ltr"
                      style={{ fontSize: '16px' }}
                      className="bg-[#161616] border-gray-800 text-white h-10 text-center rounded-xl focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all shadow-inner placeholder:text-gray-700 w-full"
                    />
                    {errors.phone && <p className="text-red-500 text-xs mt-1 font-bold animate-pulse">{errors.phone}</p>}
                  </div>
                  {errors.submit && <p className="text-red-500 text-xs font-bold text-center">{errors.submit}</p>}
                </div>
              )}

            </div>
          </div>

          {/* Footer Navigation */}
          <div
            className="bg-[#0a0a0a] px-4 flex-none border-t border-white/5 w-full z-50 shrink-0"
            style={{ paddingTop: '0.25rem', paddingBottom: 'max(0.25rem, env(safe-area-inset-bottom))' }}
          >
            <div className="w-full max-w-sm mx-auto flex gap-3 items-center">
              {currentStep === 1 ? (
                <Link
                  to="/"
                  className="w-11 h-11 bg-[#161616] text-white/40 rounded-xl flex items-center justify-center transition-all active:scale-90 border border-white/10 shrink-0 hover:text-white"
                >
                  <Home className="w-4 h-4" />
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={handleBack}
                  className="w-11 h-11 bg-[#161616] text-white rounded-xl flex items-center justify-center transition-all active:scale-90 border border-white/10 shrink-0"
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
                    ? 'bg-violet-600 text-white shadow-lg shadow-violet-900/40 border border-white/10'
                    : 'bg-white/[0.06] text-white/30 border border-white/[0.08]'
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
