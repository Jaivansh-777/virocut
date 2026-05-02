import { HTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: "glass" | "elevated" | "plain";
  hover?: boolean;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = "glass", hover = true, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-2xl",
          {
            "bg-white/[0.03] backdrop-blur-md border border-white/[0.06] shadow-[0_8px_32px_rgba(0,0,0,0.2)]":
              variant === "glass",
            "bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.25)]":
              variant === "elevated",
            "border border-white/[0.06]":
              variant === "plain",
            "transition-all duration-300 hover:scale-[1.01] hover:shadow-lg hover:border-white/[0.1]":
              hover,
          },
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";

export { Card };
