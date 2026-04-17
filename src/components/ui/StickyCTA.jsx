import React from "react";
import { cn } from "@/lib/utils";
import GlassBackButton from "./GlassBackButton";

/**
 * StickyCTA — bottom dock with primary CTA + optional glass back button.
 * Back sits on the INLINE-START side (= right in RTL), primary CTA flexes to fill.
 *
 * Default `floating={true}` renders as `fixed inset-x-0 bottom-0` with
 * safe-area-inset-bottom padding — use for pages where content scrolls beneath.
 *
 * For in-flow layouts (flex-column pages where the footer is already the last
 * item in a `flex-1 min-h-0` column), pass `floating={false}` — no fixed
 * positioning, just the CTA row with border-top.
 *
 * @param {{
 *   primaryLabel: React.ReactNode,
 *   onPrimary: () => void,
 *   primaryDisabled?: boolean,
 *   primaryType?: "button" | "submit",
 *   onBack?: () => void,
 *   backAriaLabel?: string,
 *   backIcon?: React.ReactNode,
 *   BackIcon?: React.ComponentType<{ className?: string; strokeWidth?: number }>,
 *   floating?: boolean,
 *   className?: string
 * }} props
 */
export default function StickyCTA({
  primaryLabel,
  onPrimary,
  primaryDisabled = false,
  primaryType = "button",
  onBack,
  backAriaLabel = "חזור",
  backIcon,
  BackIcon,
  floating = true,
  className,
}) {
  const row = (
    <div className="w-full max-w-md mx-auto flex items-center gap-3">
      {onBack && (
        <GlassBackButton
          onClick={onBack}
          ariaLabel={backAriaLabel}
          icon={backIcon}
          Icon={BackIcon}
        />
      )}
      <button
        type={primaryType}
        onClick={onPrimary}
        disabled={primaryDisabled}
        className={cn(
          "flex-1 h-11 rounded-lg text-base font-bold transition-all duration-300 ease-out",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
          "active:scale-[0.98]",
          primaryDisabled
            ? "bg-foreground/[0.06] text-foreground/30 border border-foreground/[0.08] cursor-not-allowed active:scale-100"
            : "bg-primary text-primary-foreground border border-primary/40 shadow-indigo-soft hover:brightness-110"
        )}
      >
        {primaryLabel}
      </button>
    </div>
  );

  if (!floating) {
    return (
      <div
        className={cn("bg-background border-t border-border px-4 shrink-0 w-full", className)}
        style={{
          paddingTop: "0.75rem",
          paddingBottom: "max(0.75rem, env(safe-area-inset-bottom, 0px))",
        }}
      >
        {row}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 px-6",
        "bg-background/85 backdrop-blur-md border-t border-border",
        className
      )}
      style={{
        paddingTop: "0.75rem",
        paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 0.75rem)",
      }}
    >
      {row}
    </div>
  );
}
