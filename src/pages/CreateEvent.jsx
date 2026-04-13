import React, { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import {
  Pencil,
  Loader2,
  ArrowLeft,
  ImageIcon,
  BatteryFull,
  Signal,
  Wifi,
  Check,
  ChevronRight,
  ChevronLeft,
  X,
  Home } from
"lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import memoriaService from "@/components/memoriaService";
import { useAuth } from "@/lib/AuthContext";

/**
 * Compress an image file using canvas — max 1200px, JPEG 0.7 quality
 */
async function compressImage(file) {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const MAX = 1200;
      let { width, height } = img;
      if (width > MAX || height > MAX) {
        if (width > height) {height = Math.round(height * MAX / width);width = MAX;} else
        {width = Math.round(width * MAX / height);height = MAX;}
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(url);
      canvas.toBlob((blob) => resolve(new File([blob], file.name, { type: 'image/jpeg' })), 'image/jpeg', 0.7);
    };
    img.src = url;
  });
}

/**
 * --- קומפוננטת אייפון יוקרתית ---
 * מידות קשיחות כדי לשמור על הפרופורציה המושלמת של המכשיר
 */
function PhoneMockup({ eventData = {}, imageTransform, isDesignMode = false, onImageTransformChange }) {
  const formattedDate = eventData.date ?
  new Intl.DateTimeFormat('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(eventData.date)).replace(/\./g, '.') :
  "02.25.2026";

  const [imageError, setImageError] = useState(false);
  const [imgNaturalSize, setImgNaturalSize] = useState({ w: 0, h: 0 });
  const screenRef = useRef(null);

  const touchState = useRef({
    isDragging: false, lastX: 0, lastY: 0,
    lastPinchDist: null
  });
  const didSetInitialTransform = useRef(false);

  useEffect(() => {
    setImageError(false);
    setImgNaturalSize({ w: 0, h: 0 });
    didSetInitialTransform.current = false;
  }, [eventData.cover_image]);

  useEffect(() => {
    if (imgNaturalSize.w > 0 && screenRef.current && !didSetInitialTransform.current) {
      const screenW = screenRef.current.offsetWidth;
      const screenH = screenRef.current.offsetHeight;
      const scaleW = screenW / imgNaturalSize.w;
      const scaleH = screenH / imgNaturalSize.h;
      const initialScale = Math.max(scaleW, scaleH);
      onImageTransformChange({ x: 0, y: 0, scale: initialScale });
      didSetInitialTransform.current = true;
    }
  }, [imgNaturalSize, onImageTransformChange]);

  const displayImage = eventData.cover_image || "/mockup.jpg";
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
    if (!isDesignMode) return;
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
    // גודל האייפון מבוסס dvh — פרופורציונלי לגובה המסך כדי שלא יהיה צורך בגלילה
    <div className="relative bg-zinc-900 p-[5px] md:p-[8px] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8)] shrink-0 ring-1 ring-white/10 mx-auto transition-transform duration-500"
      style={{ width: 'clamp(97px, 18.5dvh, 200px)', height: 'clamp(200px, 38dvh, 410px)', borderRadius: 'clamp(1.5rem, 3.5dvh, 3rem)' }}>
      
      {isDesignMode &&
      <div className="absolute inset-0 rounded-[2.2rem] md:rounded-[3rem] ring-2 ring-indigo-500 z-[70] pointer-events-none animate-pulse" />
      }

      {/* Dynamic Island */}
      <div className="absolute top-2.5 md:top-4 left-1/2 -translate-x-1/2 w-14 md:w-20 h-3.5 md:h-6 bg-black rounded-full z-[60] flex items-center justify-end px-2 md:px-3 shadow-inner">
         <div className="w-1 h-1 md:w-1.5 md:h-1.5 rounded-full bg-[#111] border border-white/5 shadow-sm"></div>
      </div>
      
      {/* Inner Screen */}
      <div
        ref={screenRef}
        className="relative w-full h-full bg-black rounded-[1.9rem] md:rounded-[2.6rem] overflow-hidden flex flex-col border border-black shadow-inner"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ touchAction: isDesignMode ? 'none' : 'auto' }}>

        
        {/* iOS Status Bar */}
        <div className="absolute top-0 left-0 right-0 h-8 md:h-10 z-50 flex items-center justify-between px-4 md:px-5 pointer-events-none opacity-90">
          <span className="text-[9px] md:text-[11px] font-bold text-white tracking-tight">9:41</span>
          <div className="flex items-center gap-1">
            <Signal size={9} fill="white" className="text-white" />
            <Wifi size={9} className="text-white" />
            <BatteryFull size={11} fill="white" className="text-white" />
          </div>
        </div>
        
        {/* Background Image */}
        {imageError ?
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 to-black z-0"></div> :

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
            willChange: 'transform', userSelect: 'none', pointerEvents: 'none'
          } : {
            // Before natural size is known: instant object-cover fallback
            top: 0, left: 0,
            width: '100%', height: '100%',
            objectFit: 'cover', objectPosition: 'center',
            userSelect: 'none', pointerEvents: 'none'
          }} />

        }
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent z-10 pointer-events-none"></div>
        
        {/* Content */}
        <div className={`absolute bottom-0 left-0 right-0 p-3 md:p-6 pb-5 md:pb-8 z-20 flex flex-col items-center text-center pointer-events-none transition-opacity duration-300 ${isDesignMode ? 'opacity-20' : 'opacity-100'}`} dir="rtl">
          <h1 className="text-white font-bold text-[13px] md:text-[20px] leading-tight mb-0.5 drop-shadow-2xl" style={{ fontFamily: "'Inter', sans-serif" }}>
            {eventData.name || "Sarah & Daniel"}
          </h1>
          <p className="text-white/70 font-medium text-[8px] md:text-[11px] mb-3 md:mb-5 tracking-[0.1em] drop-shadow-md">
            {formattedDate}
          </p>
          
          <button className="w-[90%] bg-white text-black font-bold text-[10px] md:text-[13px] py-2 md:py-3 rounded-[0.6rem] flex items-center justify-center gap-1.5 shadow-[0_8px_20px_rgba(255,255,255,0.2)] pointer-events-none">
             Take Photos
            <ChevronRight className="w-2.5 h-2.5 opacity-70" />
          </button>
        </div>

        {isDesignMode &&
        <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
            <p className="text-white/80 text-[9px] bg-black/60 px-3 py-1 rounded-full font-bold tracking-widest text-center">גרור • צבוט לזום</p>
          </div>
        }

        <div className="absolute bottom-1 md:bottom-1.5 left-1/2 -translate-x-1/2 w-[35%] h-1 bg-white/40 rounded-full z-30 pointer-events-none"></div>
      </div>
    </div>);

}

/**
 * Custom inline calendar — fully dark-themed, replaces native <input type="date">
 */
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
              ${day && isSel(day) ? 'bg-indigo-600 text-white shadow-md' : ''}
              ${day && isToday(day) && !isSel(day) ? 'ring-1 ring-indigo-500/40 text-white' : ''}
              ${day && !isPast(day) && !isSel(day) ? 'text-white/75 hover:bg-white/[0.08]' : ''}
            `}>
            {day || ''}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 5;

  const [eventData, setEventData] = useState({
    name: "", date: "", event_type: "wedding", description: "",
    cover_image: "",
    is_active: true, max_uploads_per_user: 15, privacy_mode: "manual", guest_tier: 0, price: 0
  });

  const [isUploading, setIsUploading] = useState(false);
  const [coverImagePreview, setCoverImagePreview] = useState(eventData.cover_image);
  const [localPreviewUrl, setLocalPreviewUrl] = useState(null);
  const [errors, setErrors] = useState({});
  const [isDesignMode, setIsDesignMode] = useState(false);
  const [imageTransform, setImageTransform] = useState({ x: 0, y: 0, scale: 1 });

  const pricingTiers = [
  { guests: 10, price: 0, label: "10", displayLabel: "עד 10 אורחים" },
  { guests: 100, price: 360, label: "100", displayLabel: "עד 100 אורחים" },
  { guests: 250, price: 540, label: "250", displayLabel: "עד 250 אורחים" },
  { guests: 400, price: 720, label: "400", displayLabel: "עד 400 אורחים" },
  { guests: 600, price: 900, label: "600", displayLabel: "עד 600 אורחים" },
  { guests: 800, price: 1080, label: "800", displayLabel: "עד 800 אורחים" },
  { guests: 801, price: null, label: "801+", displayLabel: "מעל 800 אורחים" }];


  const photosPerPersonOptions = [5, 10, 15, 25];

  const handleInputChange = (field, value) => {
    setEventData((prev) => ({ ...prev, [field]: value }));
    if (field === 'cover_image') {setCoverImagePreview(value);}
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    // Instant local preview — no lag
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
      console.error('Upload failed:', err);
      URL.revokeObjectURL(objectUrl);
      setLocalPreviewUrl(null);
    }
    setIsUploading(false);
  };

  const todayStr = new Date().toISOString().split('T')[0];

  const isCurrentStepValid = () => {
    if (currentStep === 1) return eventData.name.trim().length > 0;
    if (currentStep === 3) return !!(eventData.date && eventData.date >= todayStr);
    return true;
  };

  const validateStep = (step) => {
    const newErrors = {};
    if (step === 1 && !eventData.name) newErrors.name = "שדה חובה";
    if (step === 3) {
      if (!eventData.date) newErrors.date = "שדה חובה";
      else if (eventData.date < todayStr) newErrors.date = "יש לבחור תאריך מהיום ועתידי";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // step 4 הפך לגודל אירוע (5), step 3 = תאריך, step 4 = מגבלת תמונות

  const handleNext = () => {if (validateStep(currentStep)) setCurrentStep((prev) => Math.min(prev + 1, totalSteps));};
  const handleBack = () => {setCurrentStep((prev) => Math.max(prev - 1, 1));setErrors({});};

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!user?.id) {
      alert('יש להתחבר לפני יצירת אירוע');
      return;
    }
    setIsLoading(true);
    try {
      const uniqueCode = Math.random().toString(36).substring(2, 10);
      const generatedPin = Math.floor(1000 + Math.random() * 9000).toString();
      const newEvent = await memoriaService.events.create({
        ...eventData,
        unique_code: uniqueCode, qr_code: `qr-${uniqueCode}.png`,
        max_uploads_per_user: parseInt(eventData.max_uploads_per_user) || 15,
        guest_tier: parseInt(eventData.guest_tier) || 0,
        price: parseInt(eventData.price) || 0,
        pin_code: generatedPin, created_by: user.id, photo_filter: 'none'
      });
      navigate(createPageUrl(`EventSuccess?id=${newEvent.id}`));
    } catch (error) {
      console.error('Error creating event:', error);
      alert('שגיאה ביצירת האירוע: ' + (error?.message || 'נסה שוב'));
      setIsLoading(false);
    }
  };

  const displayPreviewImage = localPreviewUrl || coverImagePreview;
  const progressPercentage = currentStep / totalSteps * 100;

  return (
    // הוספת 100dvh קריטית כדי למנוע את קפיצות ה-Scrollbar בדפדפן הנייד. overflow-hidden נועל את המסך.
    <div className="flex flex-col w-full h-[100dvh] bg-[#0a0a0a] text-white overflow-hidden" dir="rtl" style={{ fontFamily: "'Heebo', 'Assistant', sans-serif" }}>
      
      {/* Progress Bar (דק יותר) */}
      <div className="h-1 bg-gray-800 shrink-0 w-full z-50">
        <div className="h-full bg-indigo-600 transition-all duration-500 shadow-[0_0_10px_rgba(79,70,229,0.5)]" style={{ width: `${progressPercentage}%` }} />
      </div>

      <div className="flex flex-col lg:flex-row flex-1 min-h-0 overflow-hidden">
        
        {/* אזור עליון - אייפון. flex-none מונע ממנו להידחס */}
        <div className="flex-none w-full h-[40dvh] lg:flex-1 lg:h-auto bg-[#111] flex items-center justify-center relative z-0 shrink-0 border-b border-white/5 lg:border-none overflow-hidden py-2">
          <div className="absolute inset-0 bg-gradient-to-b from-[#161616] to-[#0a0a0a]"></div>
          <div className="h-full w-full flex items-center justify-center py-3 relative z-10">
            <div className="relative">
              <PhoneMockup
                eventData={{ ...eventData, cover_image: displayPreviewImage }}
                imageTransform={imageTransform}
                isDesignMode={isDesignMode}
                onImageTransformChange={setImageTransform} />
              {/* Upload progress overlay */}
              {isUploading &&
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 rounded-[2.2rem] md:rounded-[3rem] z-[80]">
                  <Loader2 className="w-8 h-8 text-white animate-spin mb-2" />
                  <p className="text-white text-[10px] font-bold tracking-widest">מעלה...</p>
                </div>
              }
            </div>
          </div>
        </div>

        {/* אזור הטופס - הפתרון לבעיית החיתוך */}
        {/* אנחנו משתמשים ב-overflow-hidden כאן. במקום לתת לכפתורים לדרוס את האייפון,
                                 אנחנו מכריחים את התוכן הפנימי להתכווץ ולתפוס את כל השטח שנותר.
                              */}
        <div className="flex-1 bg-[#0a0a0a] lg:rounded-none z-10 flex flex-col relative min-h-0 shadow-[0_-20px_40px_rgba(0,0,0,0.6)]">
          
          {/* אמצע: הטופס עצמו מתמרכז בצורה מושלמת ב-View-port הנותר.
                                   צמצמנו דרמטית את כל ה-pt/pb וה-space-y כדי שכל המידע ייכנס.
                                */}
          <div className="flex-1 overflow-hidden px-4 flex flex-col justify-center items-center">
            <div className="w-full max-w-sm mx-auto w-full flex flex-col justify-center items-center py-0">
              
              {/* Step 1 */}
              {currentStep === 1 &&
              <div className="animate-in fade-in slide-in-from-bottom-6 duration-500 text-center space-y-2 w-full">
                  <h2 className="text-lg font-bold tracking-tight mb-1">מה האירוע שאתם חוגגים?</h2>
                  <p className="text-sm text-white/45 mb-2">השם שיופיע לאורחים כשיפתחו את המצלמה</p>
                  <div className="w-full">
                    <Input
                    value={eventData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="למשל: Yael & Daniel"
                    style={{ fontSize: '16px' }}
                    className="bg-[#161616] border-gray-800 text-white h-10 text-center rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-inner placeholder:text-gray-700 w-full" />

                    {errors.name && <p className="text-red-500 text-[10px] mt-2 font-bold animate-pulse">{errors.name}</p>}
                  </div>
                </div>
              }

              {/* Step 2 */}
              {currentStep === 2 &&
              <div className="animate-in fade-in slide-in-from-bottom-6 duration-500 text-center space-y-2 w-full">
                  <h2 className="text-lg font-bold tracking-tight mb-1">איך תיראה ההזמנה?</h2>
                  <p className="text-sm text-white/45 mb-2">הרקע שיופיע לאורחים לפני שהם פותחים מצלמה</p>
                  <div className="grid grid-cols-2 gap-3 w-fullpt-2">
                    <label htmlFor="add-photo" className="cursor-pointer group h-full">
                      <div className="bg-indigo-600 hover:bg-indigo-500 transition-all rounded-xl py-2 px-2 text-center h-full flex flex-col justify-center items-center shadow-lg shadow-indigo-900/40 active:scale-95 border border-white/10">
                        {isUploading ? <Loader2 className="w-6 h-6 mb-1.5 animate-spin" /> : <ImageIcon className="w-6 h-6 mb-1.5" />}
                        <p className="text-[10px] font-black uppercase tracking-widest leading-tight">{isUploading ? 'מעלה...' : 'העלאה'}</p>
                      </div>
                    </label>
                    <input type="file" id="add-photo" accept="image/*" onChange={handleFileChange} className="hidden" />
                    <button
                    type="button"
                    onClick={() => setIsDesignMode((prev) => !prev)}
                    className={`transition-all rounded-xl py-2 px-2 text-center border flex flex-col justify-center items-center active:scale-95 h-full ${
                    isDesignMode ? 'bg-indigo-600 border-indigo-400 shadow-lg shadow-indigo-900/40' : 'bg-[#161616] hover:bg-[#1a1a1a] border-gray-800'}`
                    }>

                      {isDesignMode ? <X className="w-6 h-6 mb-1.5 text-white" /> : <Pencil className="w-6 h-6 mb-1.5 text-gray-400" />}
                      <p className={`text-[10px] font-black uppercase tracking-widest leading-tight ${isDesignMode ? 'text-white' : 'text-gray-500'}`}>
                        {isDesignMode ? 'סיום' : 'עיצוב'}
                      </p>
                    </button>
                  </div>
                </div>
              }

              {/* Step 3 - תאריך ושעת סגירת העלאות */}
              {currentStep === 3 &&
              <div className="animate-in fade-in slide-in-from-bottom-6 duration-500 w-full flex flex-col gap-2">
                  <div className="text-center space-y-1">
                    <h2 className="text-lg font-bold tracking-tight">מתי חוגגים?</h2>
                    <p className="text-sm text-white/45">בחרו תאריך — העלאת תמונות תיסגר אוטומטית אחריו</p>
                  </div>

                  {/* Custom inline calendar — no native browser chrome */}
                  <InlineCalendar
                    value={eventData.date}
                    onChange={(newDate) => {
                      handleInputChange('date', newDate);
                      if (newDate) {
                        const d = new Date(newDate + 'T00:00:00');
                        d.setDate(d.getDate() + 1);
                        const iso = d.toISOString().slice(0, 16);
                        handleInputChange('upload_closure_datetime', iso);
                      }
                    }}
                  />
                  {errors.date && <p className="text-red-500 text-sm font-bold text-center animate-pulse">{errors.date}</p>}
                </div>
              }

              {/* Step 4 - מגבלת תמונות */}
              {currentStep === 4 &&
              <div className="animate-in fade-in slide-in-from-bottom-6 duration-500 w-full flex flex-col gap-2">
                  <div className="text-center space-y-1">
                    <h2 className="text-lg font-bold tracking-tight">כמה תמונות לכל אורח?</h2>
                    <p className="text-sm text-white/45">כל אורח יוכל להעלות עד המספר שתבחרו</p>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {photosPerPersonOptions.map((num) =>
                  <button
                    key={num} type="button" onClick={() => handleInputChange('max_uploads_per_user', num)}
                    className={`h-10 rounded-xl font-black text-base transition-all active:scale-95 ${
                    eventData.max_uploads_per_user === num ?
                    'bg-indigo-600 text-white shadow-md border border-white/20' :
                    'bg-[#161616] text-gray-400 border border-gray-800 hover:border-gray-600'}`
                    }>
                        {num}
                      </button>
                  )}
                  </div>
                </div>
              }

              {/* Step 5 */}
              {currentStep === 5 &&
              <div className="animate-in fade-in slide-in-from-bottom-6 duration-500 text-center w-full">
                  <h2 className="text-lg font-bold tracking-tight mb-1">כמה אורחים מגיעים?</h2>
                  <div className="grid grid-cols-7 gap-1 mb-2" dir="ltr">
                    {pricingTiers.map((tier, index) =>
                  <button
                    key={index} type="button"
                    onClick={() => {handleInputChange('guest_tier', index);handleInputChange('price', tier.price || 0);}}
                    className="flex flex-col items-center gap-1 group">
                        <div className={`w-full rounded-[3px] transition-all duration-300 ${index <= eventData.guest_tier ? 'bg-indigo-600 h-8 shadow-[0_0_5px_rgba(79,70,229,0.3)]' : 'bg-gray-800 h-6 opacity-40'}`} />
                        <span className={`text-[8px] sm:text-[9px] font-black tracking-tighter ${index === eventData.guest_tier ? 'text-indigo-400' : 'text-gray-600'}`}>{tier.label}</span>
                      </button>
                  )}
                  </div>
                  
                  <div className="bg-gradient-to-r from-[#141414] to-[#0a0a0a] rounded-xl p-3 flex items-center justify-between border border-white/10 shadow-xl">
                    <div className="flex items-center gap-3 text-right">
                      <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400 shrink-0 border border-indigo-500/20">
                        <Check size={16} strokeWidth={3} />
                      </div>
                      <div>
                        <p className="text-white font-black text-[13px] leading-tight uppercase tracking-wide">{pricingTiers[eventData.guest_tier].displayLabel}</p>
                        <p className="text-gray-600 text-[9px] uppercase font-bold tracking-widest mt-0.5">Premium Hosting</p>
                      </div>
                    </div>
                    <span className="text-base font-black text-white shrink-0">
                      {pricingTiers[eventData.guest_tier].price === null ? 'צור קשר' : pricingTiers[eventData.guest_tier].price === 0 ? 'חינם' : `₪${pricingTiers[eventData.guest_tier].price}`}
                    </span>
                  </div>
                </div>
              }
            </div>
          </div>

          {/* Fixed Footer Navigation - קשיח למטה וצמוד לכפתור */}
          <div className="bg-[#0a0a0a] px-4 flex-none border-t border-white/5 w-full z-50 shrink-0"
          style={{ paddingTop: '0.25rem', paddingBottom: 'max(0.25rem, env(safe-area-inset-bottom))' }}>
            
            <div className="w-full max-w-sm mx-auto flex gap-3 items-center">
              {currentStep === 1 ?
              <Link to="/" className="w-9 h-9 bg-[#161616] text-gray-400 rounded-xl flex items-center justify-center transition-all active:scale-90 border border-gray-800 shrink-0 hover:text-white">
                  <Home className="w-4 h-4" />
                </Link> :

              <button
                type="button" onClick={handleBack}
                className="w-11 h-11 bg-[#161616] text-white rounded-xl flex items-center justify-center transition-all active:scale-90 border border-gray-800 shrink-0">
                  <ArrowLeft className="w-5 h-5 rotate-180" />
                </button>
              }

              <button
                type={currentStep === totalSteps ? "submit" : "button"}
                onClick={currentStep === totalSteps ? handleSubmit : handleNext}
                disabled={isLoading}
                className={`text-base font-black rounded-xl flex-1 h-12 transition-all duration-300 active:scale-95 flex items-center justify-center relative ${isCurrentStepValid() || isLoading ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/40 border border-white/10' : 'bg-white/[0.06] text-white/30 border border-white/[0.08]'}`}>

                
                {isLoading ?
                <Loader2 className="w-5 h-5 animate-spin" /> :

                <span className="flex items-center gap-2">
                    {currentStep === totalSteps ? 'סיום ויצירה' : 'המשך'}
                  </span>
                }
              </button>
            </div>
          </div>

        </div>
      </div>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
@keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>);

}