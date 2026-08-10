import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type DragHandleProps = HTMLAttributes<HTMLButtonElement>;

/** Grip handle for drag-and-drop rows. */
export function DragHandle({ className, ...props }: DragHandleProps) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex h-9 w-8 shrink-0 cursor-grab items-center justify-center rounded-lg text-muted transition-colors hover:bg-background hover:text-text active:cursor-grabbing touch-none",
        className,
      )}
      aria-label="Drag to reorder"
      title="Drag to reorder"
      {...props}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        className="h-4 w-4"
        aria-hidden
      >
        <path d="M7 4a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0ZM7 10a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0ZM7 16a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0ZM16 4a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0ZM16 10a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0ZM16 16a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z" />
      </svg>
    </button>
  );
}
