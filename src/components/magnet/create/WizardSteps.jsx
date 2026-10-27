import { Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import InlineCalendar from "./InlineCalendar";
import TemplatePicker from "@/components/magnet/templates/TemplatePicker";

const QUOTA_OPTIONS = [1, 3, 5, 10, 20];

function StepHeading({ n, label, title, subtitle }) {
  return (
    <div className="text-center space-y-1">
      <p className="text-brand text-xs font-semibold mb-1"><bdi>{n}</bdi> · {label}</p>
      <h2 className="font-heebo text-2xl font-semibold text-foreground">{title}</h2>
      <p className="text-sm text-muted-foreground">{subtitle}</p>
    </div>
  );
}

/** Step 1 — event name + optional landing-page cover. */
export function NameStep({ form, errors, onChange, coverPreview, onCoverFile }) {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-6 duration-300 text-center space-y-2 w-full">
      <StepHeading n="01" label="שם האירוע" title="מה שם האירוע?" subtitle="השם שיופיע על המגנט ובממשק האורחים" />
      <Input
        value={form.name}
        onChange={(e) => onChange('name', e.target.value)}
        placeholder="למשל: יעל & דניאל"
        style={{ fontSize: '16px' }}
        className="bg-card border-border text-foreground h-10 text-center rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-inner placeholder:text-muted-foreground/60 w-full"
      />
      <p className="text-xs text-muted-foreground">לזוג — הפרידו בין השמות ב־&</p>
      {errors.name && <p className="text-destructive text-xs mt-2 font-semibold animate-pulse">{errors.name}</p>}

      {/* Optional cover photo */}
      <div className="mt-4 w-full">
        <p className="text-muted-foreground text-xs font-semibold mb-2">תמונת רקע לדף הנחיתה (אופציונלי)</p>
        <label className="cursor-pointer block">
          <input type="file" accept="image/*" className="hidden"
            onChange={(e) => { const file = e.target.files?.[0]; if (file) onCoverFile(file); }} />
          {coverPreview ? (
            <div className="relative w-full h-28 rounded-xl overflow-hidden border border-primary/40">
              <img src={coverPreview} className="w-full h-full object-cover" alt="cover" />
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <span className="text-foreground text-xs font-semibold">לחץ להחלפה</span>
              </div>
            </div>
          ) : (
            <div className="w-full h-20 rounded-xl border border-dashed border-primary/30 bg-primary/5 flex items-center justify-center gap-2 hover:bg-primary/10 transition-colors">
              <span className="text-brand/80 text-xs">+ העלה תמונת רקע</span>
            </div>
          )}
        </label>
      </div>
    </div>
  );
}

/** Step 2 — event date (shown on every magnet). */
export function DateStep({ form, errors, onChange, fromLead }) {
  return (
    <>
      {fromLead && (
        <div className="animate-in fade-in duration-300 w-full mb-2">
          <div className="flex items-center justify-between px-3 py-2 bg-primary/10 border border-primary/25 rounded-xl">
            <span className="text-brand text-xs font-semibold truncate">{fromLead.eventName}</span>
            <span className="text-brand/70 text-xs shrink-0 mr-2">מליד · {fromLead.contactName}</span>
          </div>
        </div>
      )}
      <div className="animate-in fade-in slide-in-from-bottom-6 duration-300 w-full flex flex-col gap-2">
        <StepHeading n="02" label="תאריך" title="מתי האירוע?" subtitle="תאריך האירוע שיופיע על המגנטים" />
        <InlineCalendar value={form.date} onChange={(d) => onChange('date', d)} />
        {errors.date && <p className="text-destructive text-sm font-semibold text-center animate-pulse">{errors.date}</p>}
      </div>
    </>
  );
}

/** Step 3 — prints per guest. */
export function QuotaStep({ form, onChange }) {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-6 duration-300 w-full flex flex-col gap-3">
      <StepHeading n="03" label="מכסה" title="כמה הדפסות לאורח?" subtitle="כל אורח יוכל להדפיס עד המספר שתבחרו" />
      <div className="grid grid-cols-5 gap-2">
        {QUOTA_OPTIONS.map((n) => (
          <button
            key={n} type="button"
            onClick={() => onChange('print_quota_per_device', n)}
            className={`h-12 rounded-xl font-bold text-base transition-all active:scale-95 ${
              form.print_quota_per_device === n
                ? 'bg-primary text-primary-foreground shadow-indigo-soft border border-foreground/20'
                : 'bg-card text-muted-foreground border border-border hover:border-foreground/20'
            }`}
          ><bdi>{n}</bdi></button>
        ))}
      </div>
      <div className="bg-gradient-to-r from-cool-900 to-cool-950 rounded-xl p-3 flex items-center gap-3 border border-border">
        <div className="w-8 h-8 rounded-full bg-brand/10 flex items-center justify-center text-brand shrink-0 border border-brand/20">
          <Check size={16} strokeWidth={3} />
        </div>
        <p className="text-foreground font-semibold text-sm"><bdi className="tabular-nums">{form.print_quota_per_device}</bdi> הדפסות לכל אורח</p>
      </div>
    </div>
  );
}

/** Step 4 — the magnet template, previewed with the event's names and date. */
export function TemplateStep({ form, onChange, error }) {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-6 duration-300 w-full flex flex-col gap-4 pb-4">
      <StepHeading n="04" label="עיצוב" title="בחרו עיצוב למגנט" subtitle="העיצוב יודפס על כל המגנטים באירוע, לאורך או לרוחב" />
      <TemplatePicker value={form.template} onChange={(t) => onChange('template', t)} name={form.name} date={form.date} />
      {error && <p className="text-destructive text-sm text-center">{error}</p>}
    </div>
  );
}
