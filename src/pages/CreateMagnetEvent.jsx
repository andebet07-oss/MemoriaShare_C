import React, { useState } from "react";
import {
  Loader2, ArrowLeft, Home, Check,
  ChevronLeft, ChevronRight,
  Upload, Copy, Monitor
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useNavigate, Link } from "react-router-dom";
import memoriaService from "@/components/memoriaService";
import { useAuth } from "@/lib/AuthContext";

// Polaroid-style magnet preview
function MagnetPreview({ eventData = {}, overlayPreview = null }) {
  const formattedDate = eventData.date
    ? new Intl.DateTimeFormat('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' })
        .format(new Date(eventData.date + 'T00:00:00'))
    : "02.25.2026";

  return (
    <div className="relative flex items-center justify-center" style={{ height: 'clamp(180px, 36dvh, 320px)' }}>
      {/* Polaroid frame */}
      <div
        className="relative bg-white shadow-[0_20px_50px_rgba(0,0,0,0.7)] flex flex-col"
        style={{
          width: 'clamp(120px, 22dvh, 200px)',
          height: 'clamp(148px, 28dvh, 248px)',
          padding: '6px 6px 0 6px',
          borderRadius: '2px',
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
    <div className="bg-[#161616] border border-white/10 rounded-2xl p-3" dir="ltr">
      <div className="flex items-center justify-between mb-2">
        <button type="button" onClick={prevMonth} className="w-7 h-7 flex items-center justify-center rounded-lg text-white/40 hover:text-white hover:bg-white/[0.06] transition-colors">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-white text-sm font-bold">{hebrewMonths[viewMonth]} {viewYear}</span>
        <button type="button" onClick={nextMonth} className="w-7 h-7 flex items-center justify-center rounded-lg text-white/40 hover:text-white hover:bg-white/[0.06] transition-colors">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      <div className="grid grid-cols-7 mb-0.5">
        {hebrewDays.map(d => <div key={d} className="text-center text-white/25 text-[10px] font-bold py-0.5">{d}</div>)}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((day, i) => (
          <button key={i} type="button" onClick={() => handleDay(day)}
            className={`h-7 w-full flex items-center justify-center text-sm font-medium rounded-full transition-colors
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

export default function CreateMagnetEvent() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  const [form, setForm] = useState({
    name: '',
    date: '',
    print_quota_per_device: 5,
    overlayFile: null,
  });
  const [overlayPreview, setOverlayPreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(null);

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
        const { file_url } = await memoriaService.storage.uploadOverlay(form.overlayFile, event.id);
        await memoriaService.events.update(event.id, { overlay_frame_url: file_url });
      }
      setSuccess({ event_code: event.unique_code, pin_code: event.pin_code, event_id: event.id });
    } catch (err) {
      console.error('CreateMagnetEvent: submit failed', err);
      setErrors({ submit: 'שגיאה ביצירת האירוע. ייתכן שהקוד כבר קיים.' });
    } finally {
      setIsLoading(false);
    }
  };

  if (success) return (
    <div className="fixed inset-0 bg-[#0a0a0a] flex items-center justify-center" dir="rtl">
      <div className="text-center px-6">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-violet-500/15 border border-violet-500/30 flex items-center justify-center">
          <Check className="w-8 h-8 text-violet-400" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">אירוע מגנט נוצר!</h3>
        <div className="inline-flex items-center gap-2 mt-3 px-4 py-2 bg-white/[0.06] border border-white/10 rounded-xl">
          <span className="text-white/50 text-sm">קוד אירוע:</span>
          <span className="text-white font-mono font-bold tracking-wider">{success.event_code}</span>
          <button onClick={() => navigator.clipboard?.writeText(success.event_code)}>
            <Copy className="w-3.5 h-3.5 text-white/40 hover:text-white/70 transition-colors" />
          </button>
        </div>
        <p className="text-white/40 text-sm mt-2">PIN: {success.pin_code}</p>
        <div className="mt-6 flex flex-col sm:flex-row gap-2 justify-center">
          <button
            onClick={() => navigate(`/PrintStation/${success.event_id}`)}
            className="flex items-center justify-center gap-2 px-5 py-3 bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold rounded-xl transition-colors"
          >
            <Monitor className="w-4 h-4" />
            פתח Print Station
          </button>
          <button
            onClick={() => navigate('/AdminDashboard')}
            className="px-5 py-3 bg-white/[0.06] border border-white/10 text-white text-sm rounded-xl hover:bg-white/[0.08] transition-colors"
          >
            חזרה לדשבורד
          </button>
        </div>
      </div>
    </div>
  );

  const progressPercentage = currentStep / totalSteps * 100;

  return (
    <div className="flex flex-col w-full h-[100dvh] bg-[#0a0a0a] text-white overflow-hidden" dir="rtl"
      style={{ fontFamily: "'Heebo', 'Assistant', sans-serif" }}>

      {/* Progress bar */}
      <div className="h-1 bg-gray-800 shrink-0 w-full z-50">
        <div className="h-full bg-violet-600 transition-all duration-500 shadow-[0_0_10px_rgba(139,92,246,0.5)]"
          style={{ width: `${progressPercentage}%` }} />
      </div>

      <div className="flex flex-col lg:flex-row flex-1 min-h-0 overflow-hidden">

        {/* Preview area */}
        <div className="flex-none w-full h-[40dvh] lg:flex-1 lg:h-auto bg-[#111] flex items-center justify-center relative z-0 shrink-0 border-b border-white/5 lg:border-none overflow-hidden py-2">
          <div className="absolute inset-0 bg-gradient-to-b from-[#161616] to-[#0a0a0a]" />
          <div className="relative z-10 w-full flex items-center justify-center h-full">
            <MagnetPreview eventData={form} overlayPreview={overlayPreview} />
          </div>
        </div>

        {/* Form area */}
        <div className="flex-1 bg-[#0a0a0a] z-10 flex flex-col relative min-h-0 shadow-[0_-20px_40px_rgba(0,0,0,0.6)]">
          <div className="flex-1 overflow-hidden px-4 flex flex-col justify-center items-center">
            <div className="w-full max-w-sm mx-auto flex flex-col justify-center items-center">

              {/* Step 1 — Name */}
              {currentStep === 1 && (
                <div className="animate-in fade-in slide-in-from-bottom-6 duration-500 text-center space-y-2 w-full">
                  <h2 className="text-lg font-bold tracking-tight mb-1">מה שם האירוע?</h2>
                  <p className="text-sm text-white/45 mb-2">השם שיופיע על המגנט ובממשק האורחים</p>
                  <Input
                    value={form.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder="למשל: חתונת כהן"
                    style={{ fontSize: '16px' }}
                    className="bg-[#161616] border-gray-800 text-white h-10 text-center rounded-xl focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all shadow-inner placeholder:text-gray-700 w-full"
                  />
                  {errors.name && <p className="text-red-500 text-[10px] mt-2 font-bold animate-pulse">{errors.name}</p>}
                </div>
              )}

              {/* Step 2 — Date */}
              {currentStep === 2 && (
                <div className="animate-in fade-in slide-in-from-bottom-6 duration-500 w-full flex flex-col gap-2">
                  <div className="text-center space-y-1">
                    <h2 className="text-lg font-bold tracking-tight">מתי האירוע?</h2>
                    <p className="text-sm text-white/45">תאריך האירוע שיופיע על המגנטים</p>
                  </div>
                  <InlineCalendar value={form.date} onChange={(d) => handleChange('date', d)} />
                  {errors.date && <p className="text-red-500 text-sm font-bold text-center animate-pulse">{errors.date}</p>}
                </div>
              )}

              {/* Step 3 — Print quota */}
              {currentStep === 3 && (
                <div className="animate-in fade-in slide-in-from-bottom-6 duration-500 w-full flex flex-col gap-3">
                  <div className="text-center space-y-1">
                    <h2 className="text-lg font-bold tracking-tight">כמה הדפסות לאורח?</h2>
                    <p className="text-sm text-white/45">כל אורח יוכל להדפיס עד המספר שתבחרו</p>
                  </div>
                  <div className="grid grid-cols-5 gap-2">
                    {quotaOptions.map((n) => (
                      <button
                        key={n} type="button"
                        onClick={() => handleChange('print_quota_per_device', n)}
                        className={`h-12 rounded-xl font-black text-base transition-all active:scale-95 ${
                          form.print_quota_per_device === n
                            ? 'bg-violet-600 text-white shadow-md border border-white/20'
                            : 'bg-[#161616] text-gray-400 border border-gray-800 hover:border-gray-600'
                        }`}
                      >{n}</button>
                    ))}
                  </div>
                  <div className="bg-gradient-to-r from-[#141414] to-[#0a0a0a] rounded-xl p-3 flex items-center gap-3 border border-white/10">
                    <div className="w-8 h-8 rounded-full bg-violet-500/10 flex items-center justify-center text-violet-400 shrink-0 border border-violet-500/20">
                      <Check size={16} strokeWidth={3} />
                    </div>
                    <p className="text-white font-black text-[13px]">{form.print_quota_per_device} הדפסות לכל אורח</p>
                  </div>
                </div>
              )}

              {/* Step 4 — Overlay design (optional) */}
              {currentStep === 4 && (
                <div className="animate-in fade-in slide-in-from-bottom-6 duration-500 w-full flex flex-col gap-3">
                  <div className="text-center space-y-1">
                    <h2 className="text-lg font-bold tracking-tight">הוסיפו מסגרת עיצוב</h2>
                    <p className="text-sm text-white/45">קובץ PNG שיוטבע על כל מגנט — אופציונלי</p>
                  </div>
                  <label className="flex items-center gap-3 w-full bg-[#161616] border border-dashed border-white/15 hover:border-violet-500/30 rounded-xl px-4 py-4 cursor-pointer transition-colors">
                    <Upload className="w-5 h-5 text-white/40 shrink-0" />
                    <span className="text-sm text-white/40 truncate">
                      {form.overlayFile ? form.overlayFile.name : 'בחרו קובץ PNG להדפסה...'}
                    </span>
                    <input type="file" accept="image/png" className="hidden" onChange={handleOverlayFile} />
                  </label>
                  {errors.submit && <p className="text-red-400 text-sm text-center">{errors.submit}</p>}
                </div>
              )}

            </div>
          </div>

          {/* Footer nav */}
          <div className="bg-[#0a0a0a] px-4 flex-none border-t border-white/5 w-full z-50 shrink-0"
            style={{ paddingTop: '0.25rem', paddingBottom: 'max(0.25rem, env(safe-area-inset-bottom))' }}>
            <div className="w-full max-w-sm mx-auto flex gap-3 items-center">
              {currentStep === 1 ? (
                <Link to="/AdminDashboard"
                  className="w-11 h-11 bg-[#161616] text-gray-400 rounded-xl flex items-center justify-center transition-all active:scale-90 border border-gray-800 shrink-0 hover:text-white">
                  <Home className="w-4 h-4" />
                </Link>
              ) : (
                <button type="button" onClick={handleBack}
                  className="w-11 h-11 bg-[#161616] text-white rounded-xl flex items-center justify-center transition-all active:scale-90 border border-gray-800 shrink-0">
                  <ArrowLeft className="w-5 h-5 rotate-180" />
                </button>
              )}

              <button
                type="button"
                onClick={currentStep === totalSteps ? handleSubmit : handleNext}
                disabled={isLoading}
                className={`text-base font-black rounded-xl flex-1 h-12 transition-all duration-300 active:scale-95 flex items-center justify-center relative ${
                  isCurrentStepValid() || isLoading
                    ? 'bg-violet-600 text-white shadow-lg shadow-violet-900/40 border border-white/10'
                    : 'bg-white/[0.06] text-white/30 border border-white/[0.08]'
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
