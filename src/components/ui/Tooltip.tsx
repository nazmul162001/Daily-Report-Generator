import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface TooltipProps {
  label: string;
  children: ReactNode;
  className?: string;
}

export function Tooltip({ label, children, className }: TooltipProps) {
  return (
    <span className={cn("group relative inline-flex", className)}>
      {children}
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg px-2 py-1 text-xs opacity-0 shadow-md transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
        style={{
          backgroundColor: "var(--c-tooltip-bg)",
          color: "var(--c-tooltip-fg)",
        }}
      >
        {label}
      </span>
    </span>
  );
}
