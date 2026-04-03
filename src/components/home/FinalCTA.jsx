import React from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { ArrowRight, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function FinalCTA() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleCreateEventClick = () => {
    if (isAuthenticated) {
      navigate(createPageUrl("CreateEvent"));
    } else {
      // יפנה להתחברות ויחזור לעמוד היצירה בצורה חלקה
      const returnUrl = `${window.location.origin}${createPageUrl("CreateEvent")}`;
      base44.auth.redirectToLogin(returnUrl);
    }
  };

  return (
    <section id="contact" className="py-24" dir="rtl">
      <div className="container mx-auto px-6">
        <div className="bg-gradient-to-br from-neutral-900/80 to-neutral-950/70 backdrop-blur-sm rounded-3xl p-12 text-center border border-white/10 shadow-2xl">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-100">מוכנים להתחיל?</h2>
          <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">צרו את האירוע הראשון שלכם בחינם ותראו כמה זה פשוט.</p>
          
          <Button 
            onClick={handleCreateEventClick}
            size="lg" 
            className="luxury-button text-black font-bold text-xl px-12 py-4 rounded-full transition-all duration-300 hover:scale-105 h-auto"
          >
            יוצרים אירוע עכשיו
            <ArrowRight className="mr-3 w-6 h-6" />
          </Button>
          
          <div className="flex flex-wrap items-center justify-center gap-8 mt-8 text-gray-400">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-gray-300" />
              <span className="font-medium">הקמה בחינם</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-gray-300" />
              <span className="font-medium">התקנה מיידית</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-gray-300" />
              <span className="font-medium">תמיכה מלאה</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}