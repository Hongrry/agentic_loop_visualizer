import * as React from "react";
import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "think" | "act" | "observe" | "end" | "completed" | "error";

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-white/10 text-white/70 border-white/10",
  think: "bg-glow-cyan/12 text-glow-cyan border-glow-cyan/20",
  act: "bg-glow-amber/12 text-glow-amber border-glow-amber/20",
  observe: "bg-glow-green/12 text-glow-green border-glow-green/20",
  end: "bg-accent-500/15 text-accent-400 border-accent-500/20",
  completed: "bg-glow-green/12 text-glow-green border-glow-green/20",
  error: "bg-glow-rose/12 text-glow-rose border-glow-rose/20",
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
          "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors duration-300",
          variantStyles[variant],
          className
        )}
        {...props}
      />
    );
  }
);

Badge.displayName = "Badge";
