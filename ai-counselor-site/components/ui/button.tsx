import * as React from "react";

import { cn } from "@/lib/utils";

type Variant = "default" | "ghost" | "outline" | "secondary";
type Size = "default" | "sm" | "icon";

const variantClasses: Record<Variant, string> = {
  default:
    "bg-slate-900 text-white hover:bg-slate-800 border border-slate-900",
  ghost:
    "text-slate-700 hover:bg-slate-100 border border-transparent",
  outline:
    "border border-slate-200 text-slate-800 hover:bg-slate-50",
  secondary:
    "bg-orange-50 text-orange-700 border border-orange-100 hover:bg-orange-100",
};

const sizeClasses: Record<Size, string> = {
  default: "h-11 px-4 py-2",
  sm: "h-9 px-3 text-sm",
  icon: "h-10 w-10 p-0 flex items-center justify-center",
};

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-full font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-orange-200 disabled:opacity-50 disabled:cursor-not-allowed",
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        {...props}
      />
    );
  },
);

Button.displayName = "Button";

export default Button;
