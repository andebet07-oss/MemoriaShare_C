import React, { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/AuthContext";
import { Loader2 } from "lucide-react";

/**
 * Shown once after Google login when the host profile is incomplete
 * (missing full_name or phone). Blocks all app access until submitted.
 */
export default function HostOnboardingModal() {
  const { user, refreshUser } = useAuth();
  const [fullName, setFullName] = useState(user?.full_name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fullName.trim()) { setError("נא להזין שם מלא"); return; }
    if (!phone.trim())    { setError("נא להזין מספר טלפון"); return; }
    setError("");
    setIsLoading(true);
    try {
      const { error: dbErr } = await supabase
        .from("profiles")
        .upsert({ id: user.id, email: user.email, full_name: fullName.trim(), phone: phone.trim(), updated_at: new Date().toISOString() })
        .eq("id", user.id);
      if (dbErr) throw dbErr;
      await refreshUser();
    } catch (err) {
      console.error("HostOnboarding: failed to save profile", err);
      setError("שגיאה בשמירת הפרטים. נסה שוב.");
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4" dir="rtl">
      <div className="w-full max-w-sm bg-[#111] border border-white/10 rounded-3xl p-8 shadow-2xl">
        {/* Avatar + greeting */}
        <div className="flex flex-col items-center mb-6 gap-3">
          {user?.avatar_url ? (
            <img src={user.avatar_url} alt="avatar" className="w-16 h-16 rounded-full object-cover border-2 border-white/20" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-indigo-600/40 flex items-center justify-center text-2xl font-bold text-white">
              {(user?.email?.[0] || "?").toUpperCase()}
            </div>
          )}
          <div className="text-center">
            <h2 className="text-white text-xl font-bold">ברוך הבא!</h2>
            <p className="text-white/50 text-sm mt-1">לפני שממשיכים, נשלים את הפרופיל שלך</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-white/70 text-sm font-medium">שם מלא</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="ישראל ישראלי"
              dir="rtl"
              className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-3 text-white text-right text-sm placeholder:text-white/30 focus:outline-none focus:border-indigo-500/60 transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-white/70 text-sm font-medium">מספר טלפון</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="050-0000000"
              dir="ltr"
              className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-3 text-white text-left text-sm placeholder:text-white/30 focus:outline-none focus:border-indigo-500/60 transition-colors"
            />
          </div>

          {error && <p className="text-red-400 text-xs text-center">{error}</p>}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white font-bold py-3 rounded-xl transition-colors mt-2 flex items-center justify-center gap-2"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {isLoading ? "שומר..." : "בואו נתחיל →"}
          </button>
        </form>
      </div>
    </div>
  );
}
