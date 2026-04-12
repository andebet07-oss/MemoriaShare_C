import { useState } from 'react';
import { Loader2, CheckCircle, Upload, Copy } from 'lucide-react';
import memoriaService from '@/components/memoriaService';
import { useAuth } from '@/lib/AuthContext';

const INITIAL = { name: '', date: '', print_quota_per_device: 3, unique_code: '' };

export default function CreateMagnetEventForm() {
  const { user } = useAuth();
  const [form, setForm] = useState(INITIAL);
  const [overlayFile, setOverlayFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(null); // { event_code }
  const [error, setError] = useState('');

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: name === 'print_quota_per_device' ? Number(value) : value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.name.trim() || !form.date) { setError('נא למלא שם אירוע ותאריך.'); return; }
    setError('');
    setIsSubmitting(true);
    try {
      const unique_code = form.unique_code.trim() || Math.random().toString(36).substring(2, 10);
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

      if (overlayFile) {
        const { file_url } = await memoriaService.storage.uploadOverlay(overlayFile, event.id);
        await memoriaService.events.update(event.id, { overlay_frame_url: file_url });
      }

      setSuccess({ event_code: event.unique_code, pin_code: event.pin_code });
      setForm(INITIAL);
      setOverlayFile(null);
    } catch (err) {
      setError('שגיאה ביצירת האירוע. ייתכן שהקוד כבר קיים.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) return (
    <div className="text-center py-8" dir="rtl">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
        <CheckCircle className="w-8 h-8 text-emerald-400" />
      </div>
      <h3 className="text-xl font-bold text-white mb-2">אירוע מגנט נוצר!</h3>
      <div className="inline-flex items-center gap-2 mt-3 px-4 py-2 bg-white/8 border border-white/12 rounded-xl">
        <span className="text-white/50 text-sm">קוד אירוע:</span>
        <span className="text-white font-mono font-bold tracking-wider">{success.event_code}</span>
        <button onClick={() => navigator.clipboard?.writeText(success.event_code)}>
          <Copy className="w-3.5 h-3.5 text-white/40 hover:text-white/70 transition-colors" />
        </button>
      </div>
      <p className="text-white/40 text-sm mt-2">PIN: {success.pin_code}</p>
      <button onClick={() => setSuccess(null)} className="mt-6 px-5 py-2.5 bg-white/8 border border-white/10 text-white text-sm rounded-xl hover:bg-white/12 transition-colors">
        צור אירוע נוסף
      </button>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} dir="rtl" className="space-y-5 max-w-md">
      <div>
        <label className="block text-sm font-medium text-white/70 mb-1.5">שם האירוע *</label>
        <input name="name" value={form.name} onChange={handleChange} placeholder="חתונת כהן" required
          className="w-full bg-white/5 border border-white/10 text-white placeholder-white/25 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-violet-500/60 transition-all" />
      </div>

      <div>
        <label className="block text-sm font-medium text-white/70 mb-1.5">תאריך האירוע *</label>
        <input type="date" name="date" value={form.date} onChange={handleChange} required
          className="w-full bg-white/5 border border-white/10 text-white/80 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-violet-500/60 transition-all [color-scheme:dark]" />
      </div>

      <div>
        <label className="block text-sm font-medium text-white/70 mb-1.5">מכסת הדפסות לאורח</label>
        <input type="number" name="print_quota_per_device" value={form.print_quota_per_device} onChange={handleChange} min={1} max={20}
          className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-violet-500/60 transition-all" />
      </div>

      <div>
        <label className="block text-sm font-medium text-white/70 mb-1.5">קוד אירוע מותאם <span className="text-white/30">(אופציונלי)</span></label>
        <input name="unique_code" value={form.unique_code} onChange={handleChange} placeholder="יוצר אוטומטית אם ריק" dir="ltr"
          className="w-full bg-white/5 border border-white/10 text-white placeholder-white/25 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-violet-500/60 transition-all" />
      </div>

      <div>
        <label className="block text-sm font-medium text-white/70 mb-1.5">מסגרת Overlay (PNG) <span className="text-white/30">(אופציונלי)</span></label>
        <label className="flex items-center gap-3 w-full bg-white/5 border border-dashed border-white/15 hover:border-white/30 rounded-xl px-4 py-3 cursor-pointer transition-colors">
          <Upload className="w-4 h-4 text-white/40 shrink-0" />
          <span className="text-sm text-white/40 truncate">
            {overlayFile ? overlayFile.name : 'בחרו קובץ PNG להדפסה...'}
          </span>
          <input type="file" accept="image/png" className="hidden" onChange={e => setOverlayFile(e.target.files?.[0] || null)} />
        </label>
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <button type="submit" disabled={isSubmitting}
        className="w-full py-3.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-60 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2">
        {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'צור אירוע מגנט'}
      </button>
    </form>
  );
}
