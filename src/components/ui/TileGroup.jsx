import React from "react";
import { cn } from "@/lib/utils";

/**
 * TileGroup — N-column grid of selectable tiles with accent-on-select.
 * Matches POV's 2×2 "Reveal Photos" tile pattern.
 *
 * Each tile accepts an optional `icon` React node rendered above the label,
 * and an optional `caption` below.
 *
 * @param {{
 *   value: any,
 *   onChange: (v: any) => void,
 *   options: { value: any, label: React.ReactNode, caption?: React.ReactNode, icon?: React.ReactNode }[],
 *   cols?: number,
 *   ariaLabel?: string,
 *   className?: string
 * }} props
 */
export default function TileGroup({ value, onChange, options, cols = 2, ariaLabel, className }) {
  const gridColsClass =
    cols === 3 ? "grid-cols-3" : cols === 4 ? "grid-cols-4" : "grid-cols-2";

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn("grid gap-3 w-full", gridColsClass, className)}
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
              "flex flex-col items-center justify-center gap-2 p-4 aspect-square rounded-lg",
              "border transition-all duration-300 ease-out",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
              "active:scale-[0.98]",
              selected
                ? "bg-primary/15 border-primary text-primary shadow-indigo-soft"
                : "bg-foreground/[0.04] border-border text-foreground/80 hover:bg-foreground/[0.08] hover:border-foreground/20"
            )}
          >
            {opt.icon && (
              <span className={cn("shrink-0", selected ? "text-primary" : "text-foreground/60")}>
                {opt.icon}
              </span>
            )}
            <span className="text-sm font-semibold leading-tight text-center">
              {opt.label}
            </span>
            {opt.caption && (
              <span
                className={cn(
                  "text-xs leading-snug text-center",
                  selected ? "text-primary/80" : "text-muted-foreground"
                )}
              >
                {opt.caption}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
