import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Loader2, Home, ArrowLeft, Camera, Magnet,
  BatteryFull, Wifi, Signal, Check, Calendar,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import memoriaService from '@/components/memoriaService';

// ─── Magnet Phone Mockup ──────────────────────────────────────────────────────
// Shows the MagnetGuestPage UI inside an iPhone shell.
// eventName and date update live as the user fills in step 1 & 2.
function MagnetPhoneMockup({ eventName, date }) {
  const formattedDate = date
    ? new Intl.DateTimeFormat('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' })
        .format(new Date(date + 'T00:00:00'))
    : '02.08.2026';

  return (
    <div className="relative w-[150px] h-[310px] sm:w-[170px] sm:h-[350px] md:w-[260px] md:h-[530px] bg-zinc-900 rounded-[2.2rem] md:rounded-[3rem] p-[5px] md:p-[8px] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8)] shrink-0 ring-1 ring-white/10 mx-auto">

      {/* Dynamic Island */}
      <div className="absolute top-2.5 md:top-4 left-1/2 -translate-x-1/2 w-14 md:w-20 h-3.5 md:h-6 bg-black rounded-full z-[60] flex items-center justify-end px-2 md:px-3 shadow-inner">
        <div className="w-1 h-1 md:w-1.5 md:h-1.5 rounded-full bg-[#111] border border-white/5 shadow-sm" />
      </div>

      {/* Inner Screen */}
      <div className="relative w-full h-full bg-black rounded-[1.9rem] md:rounded-[2.6rem] overflow-hidden border border-black shadow-inner" dir="rtl">

        {/* iOS Status Bar */}
        <div className="absolute top-0 left-0 right-0 h-8 md:h-10 z-50 flex items-center justify-between px-4 md:px-5 pointer-events-none opacity-90">
          <span className="text-[9px] md:text-[11px] font-bold text-white tracking-tight">9:41</span>
          <div className="flex items-center gap-1">
            <Signal size={9} fill="white" className="text-white" />
            <Wifi size={9} className="text-white" />
            <BatteryFull size={11} fill="white" className="text-white" />
          </div>
        </div>

        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-violet-950 to-black z-0" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/20 z-10 pointer-events-none" />

        {/* Content */}
        <div className="absolute bottom-0 left-0 right-0 px-3 md:px-5 pb-5 md:pb-8 z-20 flex flex-col items-center text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-500/20 border border-violet-500/30 mb-2 md:mb-3">
            <Magnet className="w-2.5 h-2.5 md:w-3 md:h-3 text-violet-400" />
            <span className="text-violet-300 text-[7px] md:text-[9px] font-semibold">מגנטים · פרימיום</span>
          </div>

          <h1 className="text-white font-bold text-[12px] md:text-[18px] leading-tight mb-0.5 drop-shadow-2xl transition-all duration-300">
            {eventName || 'שם האירוע שלכם'}
          </h1>
          <p className="text-white/60 text-[8px] md:text-[11px] mb-2 md:mb-3 tracking-wide">{formattedDate}</p>

          <p className="text-white/70 text-[8px] md:text-[10px] font-semibold mb-2 md:mb-3">
            נותרו לך <span className="text-white font-black">5</span> הדפסות
          </p>

          <button className="w-[90%] bg-white text-black font-bold text-[9px] md:text-[12px] py-1.5 md:py-2.5 rounded-[0.6rem] flex items-center justify-center gap-1 shadow-[0_8px_20px_rgba(255,255,255,0.15)] pointer-events-none">
            <Camera className="w-2.5 h-2.5 md:w-3.5 md:h-3.5" />
            צלמו ושלחו להדפסה
          </button>
        </div>

        {/* Home indicator */}
        <div className="absolute bottom-1 md:bottom-1.5 left-1/2 -translate-x-1/2 w-[35%] h-1 bg-white/40 rounded-full z-30 pointer-events-none" />
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

  const handleNext = () => {
    if (validateStep(currentStep)) setCurrentStep(prev => Math.min(prev + 1, TOTAL_STEPS));
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    setErrors({});
  };

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
  const todayStr = new Date().toISOString().split('T')[0];

  // ── Success screen ─────────────────────────────────────────────────────────
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

  // ── Wizard ─────────────────────────────────────────────────────────────────
  return (
    <div
      className="flex flex-col w-full h-[100dvh] bg-[#0a0a0a] text-white overflow-hidden"
      dir="rtl"
      style={{ fontFamily: "'Heebo', 'Assistant', sans-serif" }}
    >
      {/* Progress Bar */}
      <div className="h-1 bg-gray-800 shrink-0 w-full z-50">
        <div
          className="h-full bg-violet-600 transition-all duration-500 shadow-[0_0_10px_rgba(139,92,246,0.5)]"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      <div className="flex flex-col lg:flex-row flex-1 min-h-0 overflow-hidden">

        {/* ── Left — Phone Mockup ── */}
        <div className="flex-none lg:flex-1 w-full lg:w-[45%] bg-[#111] flex items-center justify-center relative z-0 shrink-0 border-b border-white/5 lg:border-none overflow-hidden pt-3 pb-2">
          <div className="absolute inset-0 bg-gradient-to-b from-[#161616] to-[#0a0a0a]" />
          <div className="h-full w-full flex items-center justify-center py-3 relative z-10">
            <MagnetPhoneMockup eventName={formData.event_name} date={formData.event_date} />
          </div>
        </div>

        {/* ── Right — Form ── */}
        <div className="flex-1 bg-[#0a0a0a] lg:rounded-none z-10 flex flex-col relative min-h-0 shadow-[0_-20px_40px_rgba(0,0,0,0.6)]">

          <div className="flex-1 overflow-y-auto px-4 flex flex-col justify-center items-center">
            <div className="w-full max-w-sm mx-auto flex flex-col justify-center items-center py-0">

              {/* Step 1 — שם האירוע */}
              {currentStep === 1 && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 text-center space-y-2 w-full">
                  <h2 className="text-base font-black tracking-tight mb-1">איך תרצו לקרוא לאירוע?</h2>
                  <p className="text-gray-500 text-[10px] font-light mb-2 tracking-tight">השם שיופיע לאורחים בממשק המגנט</p>
                  <Input
                    value={formData.event_name}
                    onChange={e => handleInputChange('event_name', e.target.value)}
                    placeholder="למשל: חתונת יעל ודניאל"
                    style={{ fontSize: '16px' }}
                    className="bg-[#161616] border-gray-800 text-white h-10 text-center rounded-xl focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all shadow-inner placeholder:text-gray-700 w-full"
                  />
                  {errors.event_name && <p className="text-red-500 text-[10px] mt-2 font-bold animate-pulse">{errors.event_name}</p>}
                </div>
              )}

              {/* Step 2 — תאריך + מיקום */}
              {currentStep === 2 && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 w-full flex flex-col gap-3">
                  <div className="text-center space-y-1">
                    <h2 className="text-base font-black tracking-tight">תאריך ומיקום</h2>
                    <p className="text-gray-500 text-[10px] font-light">מתי ואיפה יתקיים האירוע?</p>
                  </div>

                  {/* Date picker */}
                  <div className="relative group">
                    <div className={`w-full h-10 bg-[#161616] border ${errors.event_date ? 'border-red-500' : 'border-gray-800'} rounded-xl flex items-center justify-center gap-3 transition-all group-hover:border-gray-600 shadow-inner`}>
                      <Calendar className={`w-4 h-4 ${formData.event_date ? 'text-violet-400' : 'text-gray-600'}`} />
                      <span className={`text-sm font-bold ${formData.event_date ? 'text-white' : 'text-gray-600'}`}>
                        {formData.event_date
                          ? new Date(formData.event_date + 'T00:00:00').toLocaleDateString('he-IL')
                          : 'בחירת תאריך אירוע'}
                      </span>
                    </div>
                    <input
                      type="date"
                      value={formData.event_date}
                      min={todayStr}
                      onChange={e => handleInputChange('event_date', e.target.value)}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      style={{ colorScheme: 'dark' }}
                    />
                  </div>
                  {errors.event_date && <p className="text-red-500 text-[10px] font-bold text-center">{errors.event_date}</p>}

                  {/* Location */}
                  <Input
                    value={formData.location}
                    onChange={e => handleInputChange('location', e.target.value)}
                    placeholder="שם האולם / מיקום האירוע"
                    style={{ fontSize: '16px' }}
                    className="bg-[#161616] border-gray-800 text-white h-10 text-center rounded-xl focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all shadow-inner placeholder:text-gray-700 w-full"
                  />
                  {errors.location && <p className="text-red-500 text-[10px] font-bold text-center">{errors.location}</p>}
                </div>
              )}

              {/* Step 3 — כמות מוזמנים */}
              {currentStep === 3 && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 w-full flex flex-col gap-3">
                  <div className="text-center space-y-1">
                    <h2 className="text-base font-black tracking-tight">כמות מוזמנים</h2>
                    <p className="text-gray-500 text-[10px] font-light">כמה אורחים צפויים באירוע?</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {GUEST_OPTIONS.map(opt => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => handleInputChange('guest_count', opt)}
                        className={`h-10 rounded-xl font-bold text-sm transition-all active:scale-95 border ${
                          formData.guest_count === opt
                            ? 'bg-violet-600 text-white border-violet-400 shadow-md'
                            : 'bg-[#161616] text-gray-400 border-gray-800 hover:border-gray-600'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                  {errors.guest_count && <p className="text-red-500 text-[10px] font-bold text-center">{errors.guest_count}</p>}
                  <p className="text-gray-600 text-[9px] text-center">המחיר משתנה בהתאם לכמות. הצוות שלנו יציג הצעה מותאמת.</p>
                </div>
              )}

              {/* Step 4 — פרטי קשר */}
              {currentStep === 4 && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 w-full flex flex-col gap-3">
                  <div className="text-center space-y-1">
                    <h2 className="text-base font-black tracking-tight">פרטי יצירת קשר</h2>
                    <p className="text-gray-500 text-[10px] font-light">נחזור אליכם לאישור וסגירת התאריך</p>
                  </div>
                  <div>
                    <Input
                      value={formData.full_name}
                      onChange={e => handleInputChange('full_name', e.target.value)}
                      placeholder="שם מלא"
                      style={{ fontSize: '16px' }}
                      className="bg-[#161616] border-gray-800 text-white h-10 text-center rounded-xl focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all shadow-inner placeholder:text-gray-700 w-full"
                    />
                    {errors.full_name && <p className="text-red-500 text-[10px] mt-1 font-bold animate-pulse">{errors.full_name}</p>}
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
                    {errors.phone && <p className="text-red-500 text-[10px] mt-1 font-bold animate-pulse">{errors.phone}</p>}
                  </div>
                  {errors.submit && <p className="text-red-500 text-[10px] font-bold text-center">{errors.submit}</p>}
                </div>
              )}

            </div>
          </div>

          {/* Fixed Footer Navigation */}
          <div
            className="bg-[#0a0a0a] px-4 flex-none border-t border-white/5 w-full z-50 shrink-0"
            style={{ paddingTop: '0.25rem', paddingBottom: 'max(0.25rem, env(safe-area-inset-bottom))' }}
          >
            <div className="w-full max-w-sm mx-auto flex gap-3 items-center">
              {currentStep === 1 ? (
                <Link
                  to="/"
                  className="w-9 h-9 bg-[#161616] text-gray-400 rounded-xl flex items-center justify-center transition-all active:scale-90 border border-gray-800 shrink-0 hover:text-white"
                >
                  <Home className="w-4 h-4" />
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={handleBack}
                  className="w-9 h-9 bg-[#161616] text-white rounded-xl flex items-center justify-center transition-all active:scale-90 border border-gray-800 shrink-0"
                >
                  <ArrowLeft className="w-5 h-5 rotate-180" />
                </button>
              )}

              <button
                type="button"
                onClick={currentStep === TOTAL_STEPS ? handleSubmit : handleNext}
                disabled={isLoading}
                className="bg-violet-600 text-white text-sm font-black rounded-xl flex-1 h-10 hover:bg-violet-500 disabled:opacity-60 shadow-lg transition-all active:scale-95 border border-white/10 flex items-center justify-center"
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

      <style>{`
        input[type="date"]::-webkit-calendar-picker-indicator {
          width: 100%; height: 100%; position: absolute; top: 0; left: 0; opacity: 0; cursor: pointer;
        }
      `}</style>
    </div>
  );
}
