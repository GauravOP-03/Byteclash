"use client";

import { forwardRef } from "react";
import { cn } from "./lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "outline" | "default";
}

const variants: Record<NonNullable<ButtonProps["variant"]>, string> = {
  outline: "ui-btn-outline",
  default: "ui-btn",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", type = "button", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(variants[variant], className)}
        type={type}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
