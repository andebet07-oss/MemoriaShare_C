import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, UserPlus, Users } from "lucide-react";
import memoriaService from "@/components/memoriaService";

const MAX_CO_HOSTS = 5;

export default function CoHostsManager({ event, onEventUpdate }) {
  const [email, setEmail] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  const coHosts = Array.isArray(event?.co_hosts) ? event.co_hosts : [];

  const handleAdd = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) return;

    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError("כתובת אימייל לא תקינה");
      return;
    }
    if (coHosts.includes(trimmed)) {
      setError("משתמש זה כבר ברשימה");
      return;
    }
    if (trimmed === event.created_by) {
      setError("בעל האירוע כבר מנהל");
      return;
    }
    if (coHosts.length >= MAX_CO_HOSTS) {
      setError(`ניתן להוסיף עד ${MAX_CO_HOSTS} מנהלי משנה`);
      return;
    }

    setError(null);
    setIsSaving(true);
    const updated = [...coHosts, trimmed];
    await memoriaService.events.update(event.id, { co_hosts: updated });
    onEventUpdate({ ...event, co_hosts: updated });
    setEmail("");
    setIsSaving(false);
  };

  const handleRemove = async (emailToRemove) => {
    const updated = coHosts.filter(e => e !== emailToRemove);
    await memoriaService.events.update(event.id, { co_hosts: updated });
    onEventUpdate({ ...event, co_hosts: updated });
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleAdd();
  };

  return (
    <div className="bg-[#1a1a1a] rounded-xl p-4 space-y-4">
      <div className="text-right">
        <h2 className="text-sm font-semibold text-gray-200 flex items-center justify-end gap-2">
          <Users className="w-4 h-4 text-indigo-400" />
          מנהלי משנה (Co-hosts)
        </h2>
        <p className="text-xs text-gray-500 mt-0.5">
          מנהלי משנה יכולים לאשר ולמחוק תמונות ולהעלות ללא מגבלת כמות ({coHosts.length}/{MAX_CO_HOSTS})
        </p>
      </div>

      {/* Input row */}
      <div className="flex gap-2">
        <Button
          onClick={handleAdd}
          disabled={isSaving || !email.trim() || coHosts.length >= MAX_CO_HOSTS}
          className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg px-4 h-10 shrink-0 disabled:opacity-40"
        >
          <UserPlus className="w-4 h-4" />
        </Button>
        <Input
          value={email}
          onChange={(e) => { setEmail(e.target.value); setError(null); }}
          onKeyDown={handleKeyDown}
          placeholder="אימייל של מנהל משנה"
          dir="ltr"
          className="bg-[#2a2a2a] border-gray-700 text-white text-left rounded-lg focus:border-indigo-500 flex-1 h-10"
          disabled={coHosts.length >= MAX_CO_HOSTS}
        />
      </div>

      {error && (
        <p className="text-red-400 text-xs text-right">{error}</p>
      )}

      {/* Co-hosts list */}
      {coHosts.length > 0 && (
        <ul className="space-y-2">
          {coHosts.map((h) => (
            <li key={h} className="flex items-center justify-between bg-[#2a2a2a] rounded-lg px-3 py-2">
              <button
                onClick={() => handleRemove(h)}
                className="text-gray-500 hover:text-red-400 transition-colors p-0.5 rounded"
              >
                <X className="w-4 h-4" />
              </button>
              <span className="text-sm text-gray-300 font-mono">{h}</span>
            </li>
          ))}
        </ul>
      )}

      {coHosts.length === 0 && (
        <p className="text-center text-xs text-gray-600 py-2">אין מנהלי משנה עדיין</p>
      )}
    </div>
  );
}