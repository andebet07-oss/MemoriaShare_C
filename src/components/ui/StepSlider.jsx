import React from "react";
import { cn } from "@/lib/utils";

/**
 * StepSlider — horizontal tier picker with fill up to selected index.
 * In RTL, fill naturally grows right-to-left (inline-start = right).
 * Optional priceTicker slot renders above the track — animates via caller.
 *
 * @param {{
 *   tiers: { value: any, label: React.ReactNode }[],
 *   value: any,
 *   onChange: (v: any) => void,
 *   priceTicker?: React.ReactNode,
 *   ariaLabel?: string,
 *   className?: string
 * }} props
 */
export default function StepSlider({ tiers, value, onChange, priceTicker, ariaLabel, className }) {
  const selectedIdx = tiers.findIndex((t) => t.value === value);

  return (
    <div className={cn("w-full", className)}>
      {priceTicker && (
        <div className="flex items-end justify-center mb-6 min-h-[60px]">{priceTicker}</div>
      )}

      {/* Segmented track */}
      <div
        role="slider"
        aria-label={ariaLabel}
        aria-valuenow={selectedIdx + 1}
        aria-valuemin={1}
        aria-valuemax={tiers.length}
        className="flex gap-1 w-full"
      >
        {tiers.map((t, i) => {
          const filled = i <= selectedIdx;
          return (
            <button
              key={String(t.value)}
              type="button"
              onClick={() => onChange(t.value)}
              aria-label={typeof t.label === "string" ? t.label : `tier-${i + 1}`}
              className={cn(
                "flex-1 h-8 rounded transition-all duration-300 ease-out",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                filled ? "bg-primary shadow-indigo-soft" : "bg-border hover:bg-foreground/20"
              )}
            />
          );
        })}
      </div>

      {/* Tick labels */}
      <div className="flex gap-1 mt-3">
        {tiers.map((t, i) => (
          <div
            key={String(t.value)}
            className={cn(
              "flex-1 text-xs text-center transition-colors duration-300",
              i === selectedIdx
                ? "text-primary font-bold"
                : "text-muted-foreground"
            )}
          >
            <bdi>{t.label}</bdi>
          </div>
        ))}
      </div>
    </div>
  );
}
