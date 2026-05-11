import * as React from "react";
import { cn } from "@/lib/utils";

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <select
        className={cn(
          "flex h-9 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white/80",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500/50",
          "disabled:cursor-not-allowed disabled:opacity-40",
          "transition-all duration-300 ease-out cursor-pointer",
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </select>
    );
  }
);

Select.displayName = "Select";
