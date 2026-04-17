import React, { useState } from "react";
import { supabase } from '@/lib/supabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Users, Search, Shield, User, ChevronRight, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

const SUPER_ADMIN_EMAIL = 'effitag@gmail.com';

const ROLE_LABELS = {
  admin: 'מנהל',
  user: 'משתמש',
};

const ROLE_COLORS = {
  admin: 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30',
  user: 'bg-white/5 text-gray-400 border border-white/10',
};

function UserRolePicker({ user, onClose, onSave }) {
  const [selectedRole, setSelectedRole] = useState(user.role || 'user');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (selectedRole === user.role) { onClose(); return; }
    setIsSaving(true);
    await onSave(user.id, selectedRole);
    setIsSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-[#1a1a1a] rounded-t-3xl p-6 pb-10 border-t border-white/10 animate-in slide-in-from-bottom"
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        {/* Handle */}
        <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-6" />

        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-full bg-gray-700 flex items-center justify-center text-lg font-bold text-white">
            {(user.full_name || user.email || '?')[0].toUpperCase()}
          </div>
          <div>
            <p className="text-white font-semibold text-sm">{user.full_name || 'ללא שם'}</p>
            <p className="text-gray-500 text-xs">{user.email}</p>
          </div>
        </div>

        <p className="text-xs text-gray-500 mb-3 font-semibold uppercase tracking-wider">בחר תפקיד</p>

        <div className="space-y-2 mb-6">
          {['user', 'admin'].map((role) => (
            <button
              key={role}
              onClick={() => setSelectedRole(role)}
              className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all ${
                selectedRole === role
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white/5 text-gray-300 hover:bg-white/10'
              }`}
            >
              <span className="font-semibold">{ROLE_LABELS[role]}</span>
              {selectedRole === role && <Check className="w-5 h-5" />}
            </button>
          ))}
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full bg-white text-black font-bold py-4 rounded-2xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-50"
        >
          {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'שמור שינויים'}
        </button>
      </div>
    </div>
  );
}

export default function AdminUsers() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUser, setEditingUser] = useState(null);

  // Auth check
  const { data: currentUser, isLoading: isAuthLoading } = useQuery({
    queryKey: ['current-user-admin'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
    retry: false,
  });

  const isSuperAdmin = currentUser?.email === SUPER_ADMIN_EMAIL;

  const { data: users = [], isLoading: isUsersLoading } = useQuery({
    queryKey: ['all-users'],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: isSuperAdmin,
    staleTime: 2 * 60 * 1000,
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }) => {
      const { error } = await supabase.from('profiles').update({ role }).eq('id', userId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['all-users'] }),
  });

  const filteredUsers = users.filter((u) => {
    const term = searchTerm.toLowerCase();
    return (
      !term ||
      (u.full_name && u.full_name.toLowerCase().includes(term)) ||
      (u.email && u.email.toLowerCase().includes(term))
    );
  });

  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <Loader2 className="w-10 h-10 animate-spin text-gray-500" />
      </div>
    );
  }

  if (!isSuperAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0a0a] text-white text-center px-6" dir="rtl">
        <Shield className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold mb-2">אין הרשאה</h1>
        <p className="text-gray-500 text-sm mb-6">עמוד זה מיועד לסופר אדמין בלבד.</p>
        <button onClick={() => navigate(createPageUrl('MyEvents'))} className="bg-white text-black font-bold px-6 py-3 rounded-2xl">
          חזרה לאירועים
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white" dir="rtl">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-[#0a0a0a]/95 backdrop-blur-md border-b border-white/5 px-4 pt-safe">
        <div className="max-w-lg mx-auto flex items-center justify-between h-16">
          <button
            onClick={() => navigate(createPageUrl('MyEvents'))}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 active:scale-90 transition-transform"
          >
            <ChevronRight className="w-5 h-5 text-white" />
          </button>
          <h1 className="text-base font-bold text-white">ניהול משתמשים</h1>
          <div className="flex items-center gap-1.5 bg-white/5 rounded-full px-3 py-1">
            <Users className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-xs text-gray-400 font-semibold">{users.length}</span>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4">
        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <Input
            placeholder="חפש לפי שם או אימייל..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-[#1a1a1a] border-gray-800 text-white pr-10 h-11 rounded-xl focus:border-indigo-600"
          />
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="bg-[#1a1a1a] rounded-2xl p-4">
            <p className="text-2xl font-black text-white">{users.length}</p>
            <p className="text-xs text-gray-500 mt-0.5">סה"כ משתמשים</p>
          </div>
          <div className="bg-[#1a1a1a] rounded-2xl p-4">
            <p className="text-2xl font-black text-indigo-400">{users.filter(u => u.role === 'admin').length}</p>
            <p className="text-xs text-gray-500 mt-0.5">מנהלים</p>
          </div>
        </div>

        {/* Users List */}
        {isUsersLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
          </div>
        ) : (
          <div className="space-y-2">
            {filteredUsers.map((u) => (
              <button
                key={u.id}
                onClick={() => setEditingUser(u)}
                className="w-full bg-[#1a1a1a] hover:bg-[#222] active:scale-[0.98] transition-all rounded-2xl p-4 flex items-center gap-3 text-right"
              >
                {/* Avatar */}
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center text-base font-bold text-white flex-shrink-0">
                  {(u.full_name || u.email || '?')[0].toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 text-right">
                  <p className="text-white font-semibold text-sm truncate">
                    {u.full_name || 'ללא שם'}
                    {u.email === SUPER_ADMIN_EMAIL && (
                      <span className="mr-1.5 text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full px-1.5 py-0.5">SUPER</span>
                    )}
                  </p>
                  <p className="text-gray-500 text-xs truncate">{u.email}</p>
                </div>

                {/* Role badge */}
                <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full flex-shrink-0 ${ROLE_COLORS[u.role] || ROLE_COLORS.user}`}>
                  {ROLE_LABELS[u.role] || u.role}
                </span>
              </button>
            ))}

            {filteredUsers.length === 0 && (
              <div className="text-center py-12 text-gray-600">
                <User className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">לא נמצאו משתמשים</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Role Picker Bottom Sheet */}
      {editingUser && (
        <UserRolePicker
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSave={(userId, role) => updateRoleMutation.mutateAsync({ userId, role })}
        />
      )}
    </div>
  );
}