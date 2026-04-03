
import React from 'react';
import { Slider } from "@/components/ui/slider";
import { Sparkles, ArrowRight } from 'lucide-react';

const tiers = [
  { label: "עד 50", price: 100, guests: "עד 50 אורחים" },
  { label: "עד 100", price: 149, guests: "עד 100 אורחים" },
  { label: "עד 250", price: 199, guests: "עד 250 אורחים" },
  { label: "עד 400", price: 299, guests: "עד 400 אורחים" },
  { label: "עד 600", price: 399, guests: "עד 600 אורחים" },
  { label: "עד 800", price: 599, guests: "עד 800 אורחים" },
  { label: "800+", price: null, guests: "מעל 800 אורחים" },
];

export default function PricingSlider({ value, onChange }) {
  const currentTier = tiers[value];
  const isContactTier = value === tiers.length - 1;

  const handleTierClick = (index) => {
    onChange(index, tiers[index].price);
  };

  return (
    <div className="bg-[#151515] rounded-3xl p-6 border border-[#2A2A2A] shadow-xl">
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg sm:text-xl font-bold text-white">כמה אורחים צפויים באירוע?</h3>
          {isContactTier ? (
            <a href="#" className="text-sm font-semibold text-gray-400 hover:text-white flex items-center gap-1 transition-colors">
              צרו קשר להצעה
              <ArrowRight className="w-4 h-4" />
            </a>
          ) : (
            <div className="text-right">
              <div className="text-xl sm:text-2xl font-bold text-white">₪{currentTier.price}</div>
              <div className="text-sm text-gray-400">{currentTier.guests}</div>
            </div>
          )}
        </div>
      </div>
      
      <div dir="ltr" className="relative">
        <Slider
          value={[value]}
          onValueChange={(val) => handleTierClick(val[0])}
          max={tiers.length - 1}
          step={1}
          className="mb-4 [&>span:first-child]:h-3 [&>span:first-child]:bg-gray-800 [&>span:first-child]:rounded-full [&>span:first-child>span]:h-3 [&>span:first-child>span]:bg-gradient-to-r [&>span:first-child>span]:from-gray-400 [&>span:first-child>span]:to-gray-200 [&>span:first-child>span]:rounded-full [&>span:first-child>span]:shadow-lg [&>a]:bg-white [&>a]:w-7 [&>a]:h-7 [&>a]:border-4 [&>a]:border-gray-300 [&>a]:shadow-xl [&>a]:hover:scale-110 [&>a]:transition-transform"
        />
        
        <div className="flex justify-between text-[10px] sm:text-xs text-gray-400 px-1">
          {tiers.map((tier, index) => (
            <div
              key={index}
              className={`text-center cursor-pointer transition-all duration-200 ${
                index === value 
                  ? 'text-white font-bold transform scale-110' 
                  : 'hover:text-white'
              }`}
              onClick={() => handleTierClick(index)}
            >
              <div className={`px-1 sm:px-2 py-1 rounded-lg ${
                index === value 
                  ? 'bg-gray-700 text-white' 
                  : 'hover:bg-gray-700/30'
              }`}>
                {tier.label}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {isContactTier && (
        <div className="mt-6 text-center text-sm text-gray-400 p-4 bg-gradient-to-r from-gray-800/30 to-gray-700/30 rounded-2xl border border-gray-700/50">
          <Sparkles className="w-5 h-5 mx-auto mb-2 text-gray-400"/>
          <p className="font-medium">לאירועים גדולים, אנו מציעים חבילות מותאמות אישית.</p>
        </div>
      )}
    </div>
  );
}
