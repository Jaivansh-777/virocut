"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  children: React.ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", loading = false, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#06070a] touch-manipulation",
          {
            "bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:from-primary-600 hover:to-primary-700 shadow-md shadow-primary-500/15 hover:shadow-lg hover:shadow-primary-500/25 hover:scale-[1.02]":
              variant === "primary",
            "bg-white/[0.04] backdrop-blur-md border border-white/[0.08] text-slate-200 hover:bg-white/[0.06] hover:border-white/[0.12] hover:scale-[1.02] shadow-sm":
              variant === "secondary",
            "text-slate-400 hover:text-white hover:bg-white/[0.04]":
              variant === "ghost",
            "bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 shadow-md shadow-red-500/15 hover:shadow-lg hover:shadow-red-500/25 hover:scale-[1.02]":
              variant === "danger",
            "px-3.5 py-2.5 text-sm min-h-[44px]": size === "sm",
            "px-5 py-2.5 text-sm min-h-[44px]": size === "md",
            "px-7 py-3 text-sm min-h-[48px]": size === "lg",
          },
          className
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Loader2 className="w-3.5 h-3.5 animate-spin flex-shrink-0" />}
        <span className="truncate">{children}</span>
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button };
