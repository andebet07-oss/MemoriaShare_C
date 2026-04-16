import React from "react";
import { cn } from "@/lib/utils";

/**
 * SegmentedControl — iOS-style segmented picker.
 * Selected segment uses OUTLINE accent (no fill), matching POV's lightweight pattern.
 *
 * RTL: Grid order flips automatically via <html dir="rtl">.
 * Numerals inside labels should be wrapped in <bdi> by the caller if embedded in Hebrew.
 *
 * @param {{
 *   value: string | number,
 *   onChange: (v: string | number) => void,
 *   options: { value: string | number, label: React.ReactNode }[],
 *   ariaLabel?: string,
 *   className?: string
 * }} props
 */
export default function SegmentedControl({ value, onChange, options, ariaLabel, className }) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn(
        "flex w-full p-1 rounded-lg bg-secondary border border-border",
        className
      )}
    >
      {options.map((opt) => {
        const selected = opt.value === value;
        return (
          <button
            key={String(opt.value)}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(opt.value)}
            className={cn(
              "flex-1 py-2 text-center text-sm font-medium rounded-md border transition-all duration-300 ease-out",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
              selected
                ? "bg-transparent text-primary border-primary shadow-gold-soft"
                : "bg-transparent text-muted-foreground border-transparent hover:text-foreground/80"
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
