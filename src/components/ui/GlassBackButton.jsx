import React from "react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * GlassBackButton — 44×44 glass square with chevron, RTL-aware.
 * In RTL, "back" semantically goes forward-in-reading (to the right),
 * so we use ArrowRight by default (which points right, toward the reading start).
 *
 * Callers can pass a custom `icon` node (e.g. Home icon for "exit wizard")
 * or a React component type via `Icon` — either is fine.
 * If you embed this inside an LTR island, add `dir="ltr"` on the parent.
 *
 * @param {{
 *   onClick: () => void,
 *   ariaLabel?: string,
 *   disabled?: boolean,
 *   icon?: React.ReactNode,
 *   Icon?: React.ComponentType<{ className?: string; strokeWidth?: number }>,
 *   className?: string
 * }} props
 */
export default function GlassBackButton({
  onClick,
  ariaLabel = "חזור",
  disabled = false,
  icon,
  Icon,
  className,
}) {
  const renderedIcon = icon
    ? icon
    : Icon
    ? <Icon className="w-5 h-5" strokeWidth={2.25} />
    : <ArrowRight className="w-5 h-5" strokeWidth={2.25} />;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={cn(
        "shrink-0 w-11 h-11 rounded-lg flex items-center justify-center",
        "bg-foreground/10 border border-foreground/15 backdrop-blur-xl",
        "text-foreground/80 transition-all duration-300 ease-out",
        "hover:bg-foreground/15 hover:text-foreground active:scale-95",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
        "disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100",
        className
      )}
    >
      {renderedIcon}
    </button>
  );
}
