import * as React from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "default" | "ghost" | "outline" | "accent" | "destructive";
type ButtonSize = "default" | "sm" | "lg" | "icon";

const variantStyles: Record<ButtonVariant, string> = {
  default: "bg-surface-600 text-white/80 hover:bg-surface-500 hover:text-white",
  ghost: "text-white/60 hover:text-white hover:bg-white/10",
  outline:
    "border border-white/15 bg-transparent text-white/70 hover:bg-white/10 hover:text-white hover:border-white/25",
  accent:
    "bg-accent-500 text-white hover:bg-accent-400 shadow-lg shadow-accent-500/20",
  destructive: "bg-red-600/15 text-red-400 border border-red-500/20 hover:bg-red-600/25",
};

const sizeStyles: Record<ButtonSize, string> = {
  default: "h-9 px-4 py-2 text-sm",
  sm: "h-8 px-3 text-xs rounded-lg",
  lg: "h-11 px-6 text-base rounded-xl",
  icon: "h-9 w-9 p-0",
};

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-300 ease-out",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-900",
          "disabled:pointer-events-none disabled:opacity-40",
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
