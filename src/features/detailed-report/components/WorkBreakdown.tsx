import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createId } from "@/lib/utils";
import type { WorkBreakdownItem } from "@/types/common";
import {
  formatDurationLabel,
  formatHoursFromMinutes,
  parseMinutes,
} from "../duration";

interface WorkBreakdownProps {
  items: WorkBreakdownItem[];
  error?: string;
  onChange: (items: WorkBreakdownItem[]) => void;
}

export function WorkBreakdown({ items, error, onChange }: WorkBreakdownProps) {
  function updateItem(id: string, patch: Partial<WorkBreakdownItem>) {
    onChange(
      items.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
  }

  function addRow() {
    onChange([
      ...items,
      {
        id: createId("wb"),
        category: "",
        minutes: "",
        isNA: false,
      },
    ]);
  }

  function removeRow(id: string) {
    if (items.length <= 1) {
      return;
    }
    onChange(items.filter((item) => item.id !== id));
  }

  return (
    <section>
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-text">Work Breakdown</h3>
          <p className="text-xs text-muted">
            Enter minutes only — hours are calculated automatically.
          </p>
        </div>
        <Button size="sm" variant="secondary" onClick={addRow}>
          Add row
        </Button>
      </div>
      {error ? <p className="mb-2 text-xs text-danger">{error}</p> : null}

      <ul className="flex flex-col gap-3" aria-label="Work breakdown items">
        {items.map((item, index) => {
          const minutes = parseMinutes(item.minutes);
          const hint =
            !item.isNA && minutes !== null
              ? `Copy output: ${formatDurationLabel(item.minutes, false)}`
              : item.isNA
                ? "Marked as N/A"
                : "e.g. 45 minutes → 0.75 hours";

          return (
            <li
              key={item.id}
              className="rounded-xl border border-border bg-background/60 p-3"
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-medium text-muted">
                  Row {index + 1}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-danger hover:text-danger"
                  onClick={() => removeRow(item.id)}
                  disabled={items.length <= 1}
                  aria-label={`Remove work breakdown row ${index + 1}`}
                >
                  Delete
                </Button>
              </div>
              <div className="grid gap-3 sm:grid-cols-[1fr_140px_auto]">
                <Input
                  id={`wb-category-${item.id}`}
                  label="Category"
                  value={item.category}
                  onChange={(event) =>
                    updateItem(item.id, { category: event.target.value })
                  }
                  placeholder="e.g. Revision"
                />
                <Input
                  id={`wb-minutes-${item.id}`}
                  label="Minutes"
                  inputMode="numeric"
                  value={item.isNA ? "" : item.minutes}
                  onChange={(event) => {
                    const raw = event.target.value.replace(/[^\d.]/g, "");
                    updateItem(item.id, {
                      minutes: raw,
                      isNA: false,
                    });
                  }}
                  placeholder="70"
                  disabled={item.isNA}
                  hint={
                    !item.isNA && minutes !== null
                      ? `${formatHoursFromMinutes(minutes)} hours`
                      : undefined
                  }
                />
                <div className="flex items-end">
                  <label className="flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-border bg-surface px-3 text-sm text-text">
                    <input
                      type="checkbox"
                      checked={item.isNA}
                      onChange={(event) =>
                        updateItem(item.id, {
                          isNA: event.target.checked,
                          minutes: event.target.checked ? "" : item.minutes,
                        })
                      }
                      className="h-4 w-4 cursor-pointer rounded border-border text-primary focus:ring-primary"
                    />
                    N/A
                  </label>
                </div>
              </div>
              <p className="mt-2 text-xs text-muted">{hint}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
