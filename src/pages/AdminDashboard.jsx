import React from 'react';
import { useAuth } from '@/lib/AuthContext';
import { ShieldOff, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import LeadsPanel from '@/components/admin/LeadsPanel';

export default function AdminDashboard() {
  const { user, isLoadingAuth } = useAuth();
  const navigate = useNavigate();

  if (isLoadingAuth) return (
    <div className="fixed inset-0 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
    </div>
  );

  if (user?.role !== 'admin') return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center" dir="rtl">
      <div className="text-center">
        <ShieldOff className="w-12 h-12 text-white/20 mx-auto mb-4" />
        <h2 className="text-white font-bold text-xl mb-1">אין הרשאת גישה</h2>
        <p className="text-white/40 text-sm">עמוד זה מיועד למנהלים בלבד.</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] px-4 py-10" dir="rtl">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-white">לוח בקרה מנהל</h1>
            <p className="text-white/40 text-sm mt-1">MemoriaMagnet — ניהול לידים ואירועים</p>
          </div>
          <button
            onClick={() => navigate('/CreateMagnetEvent')}
            className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" />
            אירוע חדש
          </button>
        </div>

        {/* Leads panel */}
        <div className="bg-white/4 border border-white/8 rounded-3xl p-6">
          <LeadsPanel />
        </div>
      </div>
    </div>
  );
}
