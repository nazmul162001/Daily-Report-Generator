import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "success";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
  fullWidth?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-on-primary hover:bg-primary-hover shadow-sm ring-1 ring-primary/25 disabled:bg-primary/50",
  secondary:
    "bg-surface text-text border border-border hover:bg-background shadow-sm disabled:opacity-50",
  ghost: "bg-transparent text-muted hover:bg-background hover:text-text",
  danger:
    "bg-danger text-on-primary hover:bg-danger/90 shadow-sm disabled:opacity-50",
  success:
    "bg-success text-on-primary hover:bg-success/90 shadow-sm disabled:opacity-50",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-sm min-h-9",
  md: "px-4 py-2.5 text-sm min-h-11",
  lg: "px-5 py-3 text-base min-h-12",
};

export function Button({
  variant = "primary",
  size = "md",
  fullWidth = false,
  className,
  children,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl font-medium transition-colors duration-150 disabled:cursor-not-allowed",
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && "w-full",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
