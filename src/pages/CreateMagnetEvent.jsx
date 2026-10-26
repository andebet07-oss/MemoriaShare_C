import React, { useState } from "react";
import { Loader2, ArrowLeft, Home } from "lucide-react";
import { useLocation, Link } from "react-router-dom";
import memoriaService from "@/components/memoriaService";
import { useAuth } from "@/lib/AuthContext";
import { DEFAULT_TEMPLATE_ID, getTemplate, resolveOptions } from "@/lib/polaroid/templates";
import PolaroidPreview from "@/components/magnet/templates/PolaroidPreview";
import EventCreatedScreen from "@/components/magnet/create/EventCreatedScreen";
import { NameStep, DateStep, QuotaStep, TemplateStep } from "@/components/magnet/create/WizardSteps";

const TOTAL_STEPS = 4;

export default function CreateMagnetEvent() {
  const location = useLocation();
  const { user } = useAuth();

  // Pre-fill from lead if navigated via "צור אירוע" in LeadsPanel
  const fromLead = location.state?.fromLead ?? null;

  const [currentStep, setCurrentStep] = useState(fromLead?.eventName ? 2 : 1);
  const [form, setForm] = useState({
    name: fromLead?.eventName ?? '',
    date: fromLead?.eventDate ?? '',
    print_quota_per_device: 5,
    template: { templateId: DEFAULT_TEMPLATE_ID, options: resolveOptions(getTemplate(DEFAULT_TEMPLATE_ID)) },
    coverImageFile: null,    // new File selected by admin in this wizard
    coverImageUrl: fromLead?.coverImageUrl ?? '',  // pre-existing URL from lead submission
  });
  const [coverImagePreview, setCoverImagePreview] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(null);

  const todayStr = new Date().toISOString().split('T')[0];

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
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

  const handleNext = () => { if (validateStep(currentStep)) setCurrentStep(p => Math.min(p + 1, TOTAL_STEPS)); };
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
        template_id: form.template.templateId,
        template_options: form.template.options,
        guest_tier: 0,
        max_uploads_per_user: 999,
        auto_publish_guest_photos: false,
        is_active: true,
      });
      if (form.coverImageFile) {
        // Admin uploaded a new file in this wizard — upload it
        const { file_url } = await memoriaService.storage.uploadCoverImage(form.coverImageFile, event.id);
        await memoriaService.events.update(event.id, { cover_image: file_url });
      } else if (form.coverImageUrl) {
        // URL came from the lead form — already uploaded, write it directly
        await memoriaService.events.update(event.id, { cover_image: form.coverImageUrl });
      }
      setSuccess({ event_code: event.unique_code, pin_code: event.pin_code, event_id: event.id });
    } catch (err) {
      console.error('CreateMagnetEvent: submit failed', err);
      const msg = err?.message || err?.code || 'שגיאה לא ידועה';
      setErrors({ submit: `שגיאה ביצירת האירוע: ${msg}` });
    } finally {
      setIsLoading(false);
    }
  };

  if (success) return <EventCreatedScreen success={success} />;

  const progressPercentage = currentStep / TOTAL_STEPS * 100;

  // The calendar and template steps take the full screen (the template step
  // has its own previews); the others show the live magnet on top.
  const isFullScreenStep = currentStep === 2 || currentStep === 4;
  const previewSpec = {
    ...form.template,
    name: form.name.trim() || 'שרה & דניאל',
    date: form.date,
  };

  return (
    <div className="flex flex-col w-full h-[100dvh] bg-gradient-to-br from-cool-950 via-cool-900 to-cool-950 text-foreground overflow-hidden font-heebo" dir="rtl">

      {/* Progress bar */}
      <div className="h-1 bg-border shrink-0 w-full z-50">
        <div className="h-full bg-primary transition-all duration-500 shadow-[0_0_10px_hsl(var(--brand)/0.45)]"
          style={{ width: `${progressPercentage}%` }} />
      </div>

      <div className="flex flex-col lg:flex-row flex-1 min-h-0 overflow-hidden">

        {/* Live magnet preview — the real template with the names and date */}
        {!isFullScreenStep && (
          <div className="flex-none w-full h-[56dvh] lg:flex-1 lg:h-auto flex items-center justify-center relative z-0 shrink-0 border-b border-border lg:border-none overflow-hidden py-2">
            <div className="absolute inset-0 bg-gradient-to-b from-cool-900 to-cool-950" />
            <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 70% 60% at 50% 55%, rgba(124,134,225,0.06) 0%, transparent 70%)' }} />
            <PolaroidPreview spec={previewSpec} orientation="portrait" label="תצוגה מקדימה של המגנט"
              className="z-10 w-[clamp(109px,37.5dvh,315px)]" />
          </div>
        )}

        {/* Form area */}
        <div className="flex-1 z-10 flex flex-col relative min-h-0 shadow-[0_-20px_40px_rgba(0,0,0,0.6)]">
          <div className={`flex-1 px-4 flex flex-col items-center ${isFullScreenStep ? 'overflow-y-auto justify-start pt-6' : 'overflow-hidden justify-center'}`}>
            <div className="w-full max-w-sm mx-auto flex flex-col justify-center items-center">
              {currentStep === 1 && (
                <NameStep form={form} errors={errors} onChange={handleChange} coverPreview={coverImagePreview}
                  onCoverFile={(file) => { handleChange('coverImageFile', file); setCoverImagePreview(URL.createObjectURL(file)); }} />
              )}
              {currentStep === 2 && <DateStep form={form} errors={errors} onChange={handleChange} fromLead={fromLead} />}
              {currentStep === 3 && <QuotaStep form={form} onChange={handleChange} />}
              {currentStep === 4 && <TemplateStep form={form} onChange={handleChange} error={errors.submit} />}
            </div>
          </div>

          {/* Footer nav */}
          <div className="px-4 flex-none border-t border-border w-full z-50 shrink-0 bg-cool-950/80 backdrop-blur-md"
            style={{ paddingTop: '0.25rem', paddingBottom: 'max(0.25rem, env(safe-area-inset-bottom))' }}>
            <div className="w-full max-w-sm mx-auto flex gap-3 items-center">
              {currentStep === 1 ? (
                <Link to="/AdminDashboard" aria-label="חזרה לניהול"
                  className="w-11 h-11 bg-card text-muted-foreground rounded-xl flex items-center justify-center transition-all active:scale-90 border border-border shrink-0 hover:text-foreground">
                  <Home className="w-4 h-4" />
                </Link>
              ) : (
                <button type="button" onClick={handleBack} aria-label="חזרה"
                  className="w-11 h-11 bg-card text-foreground rounded-xl flex items-center justify-center transition-all active:scale-90 border border-border shrink-0">
                  <ArrowLeft className="w-5 h-5 rotate-180" />
                </button>
              )}

              <button
                type="button"
                onClick={currentStep === TOTAL_STEPS ? handleSubmit : handleNext}
                disabled={isLoading}
                className={`text-base font-semibold rounded-xl flex-1 h-12 transition-all duration-300 active:scale-95 flex items-center justify-center relative ${
                  isCurrentStepValid() || isLoading
                    ? 'bg-primary text-primary-foreground shadow-indigo-soft border border-foreground/10'
                    : 'bg-card text-muted-foreground border border-border'
                }`}
              >
                {isLoading
                  ? <Loader2 className="w-5 h-5 animate-spin" />
                  : <span>{currentStep === TOTAL_STEPS ? 'יצירת אירוע' : 'המשך'}</span>
                }
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
