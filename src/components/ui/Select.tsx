import { cn } from "@/lib/utils";
import type { SelectHTMLAttributes } from "react";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: SelectOption[];
  id: string;
}

export function Select({
  label,
  error,
  options,
  id,
  className,
  ...props
}: SelectProps) {
  return (
    <div className="flex w-full flex-col gap-1.5">
      {label ? (
        <label htmlFor={id} className="text-sm font-medium text-text">
          {label}
        </label>
      ) : null}
      <select
        id={id}
        className={cn(
          "w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-base text-text shadow-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-11 sm:text-sm",
          error && "border-danger",
          className,
        )}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error ? <p className="text-xs text-danger">{error}</p> : null}
    </div>
  );
}
