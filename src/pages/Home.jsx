import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { X, Play, ArrowRight } from 'lucide-react';
import { Button } from "@/components/ui/button";

import Header from '../components/home/Header';
import HeroSection from '../components/home/HeroSection';
import Features from '../components/home/Features';
import Testimonials from '../components/home/Testimonials';
import FAQ from '../components/home/FAQ';
import FinalCTA from '../components/home/FinalCTA';

export default function Home() {
  const [showDemo, setShowDemo] = useState(false);

  return (
    <div className="bg-gradient-to-br from-[#0F0F0F] via-[#1a1a1a] to-[#0F0F0F] text-white min-h-screen">
      <div className="relative z-10">
        <Header />
        <main>
          {/* העברת הפונקציה לפתיחת הדגמה לרכיבים */}
          <HeroSection onOpenDemo={() => setShowDemo(true)} />
          <Features />
          <Testimonials />
          <FAQ />
          <FinalCTA />
        </main>
        <footer className="py-8 border-t border-white/5">
          <div className="flex items-center justify-center gap-4 text-sm text-slate-500">
            <a href="/privacy.html" className="hover:text-slate-300 transition-colors">Privacy Policy</a>
            <span>·</span>
            <a href="/terms.html" className="hover:text-slate-300 transition-colors">Terms of Service</a>
          </div>
        </footer>
      </div>

      {/* חלון הדגמה מרכזי ואחיד */}
      {showDemo && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setShowDemo(false)} dir="rtl">
          <div className="bg-gradient-to-br from-zinc-900 to-black rounded-[2rem] overflow-hidden max-w-4xl w-full max-h-[80vh] border border-white/10 shadow-2xl animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>  
            <div className="flex justify-between items-center p-6 border-b border-white/5">
              <h3 className="text-2xl font-bold text-white tracking-tight">הדגמת Memoria</h3>
              <Button onClick={() => setShowDemo(false)} variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-white/10 rounded-full w-10 h-10">
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="p-8">
              <div className="aspect-video bg-gradient-to-br from-zinc-800 to-black rounded-2xl flex items-center justify-center border border-white/5 shadow-inner">
                <div className="text-center">
                  <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Play className="w-8 h-8 text-gray-400 ml-1" />
                  </div>
                  <p className="text-gray-300 text-lg mb-8 font-medium">וידאו הדגמה יתווסף בקרוב</p>
                  <Link to={createPageUrl("CreateEvent")} onClick={() => setShowDemo(false)}>
                    <Button className="luxury-button px-8 py-6 rounded-full font-bold text-lg w-full sm:w-auto shadow-xl">
                      התחילו ליצור אירוע
                      <ArrowRight className="mr-2 w-5 h-5" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}