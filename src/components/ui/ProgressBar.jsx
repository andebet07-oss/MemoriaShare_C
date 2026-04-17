import React from "react";
import { cn } from "@/lib/utils";

/**
 * ProgressBar — thin horizontal bar with percentage fill.
 * In RTL context, fill naturally grows from the right edge (inline-start).
 * Matches POV's top-of-wizard 3px bar.
 *
 * @param {{
 *   value: number,
 *   max: number,
 *   className?: string,
 *   ariaLabel?: string
 * }} props
 */
export default function ProgressBar({ value, max, className, ariaLabel = "התקדמות" }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div
      role="progressbar"
      aria-label={ariaLabel}
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      className={cn("h-1 bg-border w-full overflow-hidden", className)}
    >
      <div
        className="h-full bg-primary shadow-indigo-glow transition-all duration-500 ease-out"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
