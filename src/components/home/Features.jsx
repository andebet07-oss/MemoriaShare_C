import React from "react";
import { QrCode, Camera, Users, Download } from "lucide-react";

export default function Features() {
  const steps = [
    {
      icon: QrCode,
      title: "סריקת QR",
      description: "האורחים סורקים וניגשים לאלבום"
    },
    {
      icon: Camera,
      title: "צילום והעלאה",
      description: "מעלים תמונות ישירות מהטלפון"
    },
    {
      icon: Users,
      title: "אלבום משותף",
      description: "כל התמונות במקום אחד"
    },
    {
      icon: Download,
      title: "הורדה מהירה",
      description: "מורידים הכל בקליק אחד"
    }
  ];

  return (
    <section id="features" className="py-12 md:py-16" dir="rtl">
      <div className="container mx-auto px-6">
        <div className="text-center mb-8 md:mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-3 text-gray-100">איך זה עובד?</h2>
          <p className="text-gray-400 text-base md:text-lg">פשוט, מהיר ויעיל</p>
        </div>
        
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {steps.map((step, idx) => (
              <div key={idx} className="flex items-center gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-200">
                <div className="w-12 h-12 bg-gradient-to-br from-gray-300 to-gray-500 rounded-xl p-2.5 flex items-center justify-center flex-shrink-0">
                  <step.icon className="w-6 h-6 text-black" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-lg mb-1">{step.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="text-center mt-8">
          <p className="text-gray-500 text-sm">זה באמת פשוט כמו שזה נשמע</p>
        </div>
      </div>
    </section>
  );
}