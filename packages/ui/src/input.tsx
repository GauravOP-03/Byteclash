import * as React from "react";
import { cn } from "./lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "h-[38px] bg-bg-elevated border-[0.5px] border-border-default px-sm font-code text-code text-on-surface placeholder:text-text-ghost focus:border-[1px] focus:border-accent-blue-dim focus:ring-0 focus:outline-none transition-all shadow-[inset_0_0_10px_rgba(0,0,0,0.5)]",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
