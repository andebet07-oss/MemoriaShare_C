import React from 'react';
import { useAuth } from '@/lib/AuthContext';
import { ShieldOff, Plus, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import LeadsPanel from '@/components/admin/LeadsPanel';

export default function AdminDashboard() {
  const { user, isLoadingAuth } = useAuth();
  const navigate = useNavigate();

  if (isLoadingAuth) return (
    <div className="fixed inset-0 flex items-center justify-center bg-[#0a0a0a]">
      <div className="w-8 h-8 border-2 border-white/10 border-t-violet-500 rounded-full animate-spin" />
    </div>
  );

  if (user?.role !== 'admin') return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center" dir="rtl">
      <div className="text-center">
        <ShieldOff className="w-10 h-10 text-white/15 mx-auto mb-4" />
        <h2 className="text-white font-bold text-lg mb-1">אין הרשאת גישה</h2>
        <p className="text-white/35 text-sm">עמוד זה מיועד למנהלים בלבד.</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a]" dir="rtl">
      {/* Top gradient accent */}
      <div className="h-px w-full" style={{ background: 'linear-gradient(90deg, transparent, rgba(124,58,237,0.6) 50%, transparent)' }} />

      <div className="max-w-2xl mx-auto px-4 pt-8 pb-20">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-4 h-4 text-violet-400" />
              <span className="text-violet-400 text-xs font-bold tracking-widest uppercase">MemoriaMagnet</span>
            </div>
            <h1 className="text-2xl font-extrabold text-white leading-none">לוח בקרה</h1>
          </div>
          <button
            onClick={() => navigate('/CreateMagnetEvent')}
            className="flex items-center gap-2 px-4 py-2.5 text-white text-sm font-bold rounded-xl transition-all active:scale-95 shadow-lg"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', boxShadow: '0 4px 20px rgba(124,58,237,0.35)' }}
          >
            <Plus className="w-4 h-4" />
            אירוע חדש
          </button>
        </div>

        {/* Leads panel */}
        <div className="rounded-3xl p-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <LeadsPanel />
        </div>

      </div>
    </div>
  );
}
