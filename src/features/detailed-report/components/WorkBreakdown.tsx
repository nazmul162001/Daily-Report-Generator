import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  SortableList,
  SortableRowLayout,
} from "@/components/ui/SortableList";
import { createId } from "@/lib/utils";
import type { WorkBreakdownItem } from "@/types/common";

interface WorkBreakdownProps {
  items: WorkBreakdownItem[];
  error?: string;
  onChange: (items: WorkBreakdownItem[]) => void;
}

function WorkBreakdownRow({
  item,
  index,
  total,
  onUpdate,
  onRemove,
}: {
  item: WorkBreakdownItem;
  index: number;
  total: number;
  onUpdate: (patch: Partial<WorkBreakdownItem>) => void;
  onRemove: () => void;
}) {
  return (
    <div className="grid grid-cols-[1fr_minmax(5.5rem,7rem)_auto_auto] items-center gap-2">
      <Input
        id={`wb-category-${item.id}`}
        value={item.category}
        onChange={(event) => onUpdate({ category: event.target.value })}
        placeholder="Category"
        aria-label={`Category ${index + 1}`}
      />
      <Input
        id={`wb-minutes-${item.id}`}
        inputMode="numeric"
        value={item.isNA ? "" : item.minutes}
        onChange={(event) => {
          const raw = event.target.value.replace(/[^\d.]/g, "");
          onUpdate({ minutes: raw, isNA: false });
        }}
        placeholder="Minutes"
        disabled={item.isNA}
        aria-label={`Minutes ${index + 1}`}
      />
      <label className="flex min-h-11 cursor-pointer items-center gap-1.5 rounded-xl border border-border bg-surface px-2.5 text-sm text-text">
        <input
          type="checkbox"
          checked={item.isNA}
          onChange={(event) => onUpdate({ isNA: event.target.checked })}
          className="h-4 w-4 cursor-pointer rounded border-border text-primary focus:ring-primary"
        />
        N/A
      </label>
      <button
        type="button"
        onClick={onRemove}
        disabled={total <= 1}
        className="inline-flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-xl text-danger transition-colors hover:bg-danger/10 disabled:cursor-not-allowed disabled:opacity-40"
        aria-label={`Remove row ${index + 1}`}
        title="Remove row"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="h-5 w-5"
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 6h18M9 6V4h6v2m-8 0v14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V6"
          />
          <path strokeLinecap="round" d="M10 11v6M14 11v6" />
        </svg>
      </button>
    </div>
  );
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
            Drag to reorder. Minutes convert to hours automatically.
          </p>
        </div>
        <Button size="sm" variant="secondary" onClick={addRow}>
          Add row
        </Button>
      </div>
      {error ? <p className="mb-2 text-xs text-danger">{error}</p> : null}

      <SortableList
        items={items}
        onReorder={onChange}
        ariaLabel="Work breakdown items"
        className="gap-2"
        renderItem={(item, index, drag) => (
          <SortableRowLayout drag={drag} className="items-center">
            <WorkBreakdownRow
              item={item}
              index={index}
              total={items.length}
              onUpdate={(patch) => updateItem(item.id, patch)}
              onRemove={() => removeRow(item.id)}
            />
          </SortableRowLayout>
        )}
      />
    </section>
  );
}
