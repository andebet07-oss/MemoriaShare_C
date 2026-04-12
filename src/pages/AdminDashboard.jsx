import { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { ShieldOff } from 'lucide-react';
import LeadsPanel from '@/components/admin/LeadsPanel';
import CreateMagnetEventForm from '@/components/admin/CreateMagnetEventForm';

const TABS = [
  { key: 'leads', label: 'ניהול לידים' },
  { key: 'create', label: 'יצירת אירוע מגנט' },
];

export default function AdminDashboard() {
  const { user, isLoadingAuth } = useAuth();
  const [activeTab, setActiveTab] = useState('leads');

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
        <div className="mb-8">
          <h1 className="text-2xl font-extrabold text-white">לוח בקרה מנהל</h1>
          <p className="text-white/40 text-sm mt-1">MemoriaMagnet — ניהול לידים ואירועים</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-white/5 border border-white/8 rounded-2xl mb-8 w-fit">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                activeTab === tab.key
                  ? 'bg-white text-black shadow'
                  : 'text-white/50 hover:text-white/80'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bg-white/4 border border-white/8 rounded-3xl p-6">
          {activeTab === 'leads' && <LeadsPanel />}
          {activeTab === 'create' && <CreateMagnetEventForm />}
        </div>
      </div>
    </div>
  );
}
