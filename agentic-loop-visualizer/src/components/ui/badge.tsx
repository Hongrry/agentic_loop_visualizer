import * as React from "react";
import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "think" | "act" | "observe" | "end" | "completed" | "error";

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-surface-600 text-slate-300 border-surface-500",
  think: "bg-glow-cyan/15 text-glow-cyan border-glow-cyan/30",
  act: "bg-glow-amber/15 text-glow-amber border-glow-amber/30",
  observe: "bg-glow-green/15 text-glow-green border-glow-green/30",
  end: "bg-accent-500/15 text-accent-400 border-accent-500/30",
  completed: "bg-glow-green/15 text-glow-green border-glow-green/30",
  error: "bg-glow-rose/15 text-glow-rose border-glow-rose/30",
};

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
};

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = "default", ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
          variantStyles[variant],
          className
        )}
        {...props}
      />
    );
  }
);

Badge.displayName = "Badge";
