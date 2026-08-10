import { cn } from "@/lib/utils";
import type { TextareaHTMLAttributes } from "react";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  id: string;
}

export function Textarea({
  label,
  error,
  hint,
  id,
  className,
  ...props
}: TextareaProps) {
  return (
    <div className="flex w-full flex-col gap-1.5">
      {label ? (
        <label htmlFor={id} className="text-sm font-medium text-text">
          {label}
          {props.required ? <span className="ml-0.5 text-danger">*</span> : null}
        </label>
      ) : null}
      <textarea
        id={id}
        className={cn(
          "w-full min-h-[96px] rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-text shadow-sm transition-colors placeholder:text-muted/70 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:bg-background resize-y",
          error && "border-danger focus:border-danger focus:ring-danger/20",
          className,
        )}
        {...props}
      />
      {error ? <p className="text-xs text-danger">{error}</p> : null}
      {!error && hint ? <p className="text-xs text-muted">{hint}</p> : null}
    </div>
  );
}
