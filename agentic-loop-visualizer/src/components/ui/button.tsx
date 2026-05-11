import * as React from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "default" | "ghost" | "outline" | "accent" | "destructive";
type ButtonSize = "default" | "sm" | "lg" | "icon";

const variantStyles: Record<ButtonVariant, string> = {
  default: "bg-surface-600 text-slate-200 hover:bg-surface-500",
  ghost: "hover:bg-surface-700 text-slate-300 hover:text-slate-100",
  outline:
    "border border-surface-500 bg-transparent text-slate-300 hover:bg-surface-700 hover:text-slate-100",
  accent:
    "bg-accent-500 text-white hover:bg-accent-400 shadow-lg shadow-accent-500/25",
  destructive: "bg-red-600/20 text-red-400 border border-red-500/30 hover:bg-red-600/30",
};

const sizeStyles: Record<ButtonSize, string> = {
  default: "h-9 px-4 py-2 text-sm",
  sm: "h-8 px-3 text-xs rounded-md",
  lg: "h-11 px-6 text-base rounded-lg",
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
          "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-900",
          "disabled:pointer-events-none disabled:opacity-50",
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
