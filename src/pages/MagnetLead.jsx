import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle, Magnet, Loader2 } from 'lucide-react';
import memoriaService from '@/components/memoriaService';

const INITIAL_FORM = { full_name: '', phone: '', event_date: '', details: '' };

export default function MagnetLead() {
  const navigate = useNavigate();
  const [form, setForm] = useState(INITIAL_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.full_name.trim() || !form.phone.trim()) {
      setError('נא למלא שם מלא וטלפון.');
      return;
    }
    setError('');
    setIsSubmitting(true);
    try {
      await memoriaService.leads.create({
        full_name: form.full_name.trim(),
        phone: form.phone.trim(),
        event_date: form.event_date || null,
        details: form.details.trim() || null,
      });
      setIsSuccess(true);
    } catch (err) {
      setError('אירעה שגיאה בשליחת הפרטים, אנא נסו שוב.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4" dir="rtl">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">הפרטים התקבלו בהצלחה!</h2>
          <p className="text-white/60 text-lg mb-8">ניצור קשר בהקדם לתיאום הפרטים.</p>
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 border border-white/15 text-white rounded-full hover:bg-white/15 transition-all"
          >
            <ArrowRight className="w-4 h-4" />
            חזרה לעמוד הבית
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4 py-16" dir="rtl">
      <div className="w-full max-w-lg">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-violet-500/15 border border-violet-500/30 mb-5">
            <Magnet className="w-8 h-8 text-violet-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">מגנטים מודפסים לאירוע</h1>
          <p className="text-white/50">מלאו את הפרטים ונחזור אליכם לתיאום</p>
        </div>

        {/* Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8">
          <form onSubmit={handleSubmit} className="space-y-5">

            <div>
              <label className="block text-sm font-medium text-white/70 mb-1.5">שם מלא *</label>
              <input
                type="text"
                name="full_name"
                value={form.full_name}
                onChange={handleChange}
                placeholder="ישראל ישראלי"
                required
                className="w-full bg-white/5 border border-white/10 text-white placeholder-white/25 rounded-xl px-4 py-3 text-base focus:outline-none focus:border-violet-500/60 focus:bg-white/8 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/70 mb-1.5">טלפון *</label>
              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="050-0000000"
                required
                dir="ltr"
                className="w-full bg-white/5 border border-white/10 text-white placeholder-white/25 rounded-xl px-4 py-3 text-base focus:outline-none focus:border-violet-500/60 focus:bg-white/8 transition-all text-right"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/70 mb-1.5">תאריך האירוע</label>
              <input
                type="date"
                name="event_date"
                value={form.event_date}
                onChange={handleChange}
                className="w-full bg-white/5 border border-white/10 text-white/80 rounded-xl px-4 py-3 text-base focus:outline-none focus:border-violet-500/60 transition-all [color-scheme:dark]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/70 mb-1.5">פרטים נוספים</label>
              <textarea
                name="details"
                value={form.details}
                onChange={handleChange}
                placeholder="סוג האירוע, מספר אורחים משוער, בקשות מיוחדות..."
                rows={4}
                className="w-full bg-white/5 border border-white/10 text-white placeholder-white/25 rounded-xl px-4 py-3 text-base focus:outline-none focus:border-violet-500/60 transition-all resize-none"
              />
            </div>

            {error && (
              <p className="text-red-400 text-sm text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 bg-violet-600 hover:bg-violet-500 disabled:opacity-60 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 text-base"
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                'שלחו פרטים ונחזור אליכם'
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-white/30 text-sm mt-6">
          שירות פרימיום מנוהל · הזמנות מוגבלות
        </p>
      </div>
    </div>
  );
}
