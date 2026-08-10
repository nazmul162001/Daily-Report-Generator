import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createId } from "@/lib/utils";
import type { WorkBreakdownItem } from "@/types/common";

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
        hours: "",
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
        <h3 className="text-sm font-semibold text-text">Work Breakdown</h3>
        <Button size="sm" variant="secondary" onClick={addRow}>
          Add row
        </Button>
      </div>
      {error ? <p className="mb-2 text-xs text-danger">{error}</p> : null}

      <ul className="flex flex-col gap-3" aria-label="Work breakdown items">
        {items.map((item, index) => (
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
            <div className="grid gap-3 sm:grid-cols-[1fr_120px_auto]">
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
                id={`wb-hours-${item.id}`}
                label="Hours"
                value={item.isNA ? "" : item.hours}
                onChange={(event) =>
                  updateItem(item.id, {
                    hours: event.target.value,
                    isNA: false,
                  })
                }
                placeholder="4.9"
                disabled={item.isNA}
              />
              <div className="flex items-end">
                <label className="flex min-h-11 items-center gap-2 rounded-xl border border-border bg-surface px-3 text-sm text-text">
                  <input
                    type="checkbox"
                    checked={item.isNA}
                    onChange={(event) =>
                      updateItem(item.id, {
                        isNA: event.target.checked,
                        hours: event.target.checked ? "" : item.hours,
                      })
                    }
                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                  />
                  N/A
                </label>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
