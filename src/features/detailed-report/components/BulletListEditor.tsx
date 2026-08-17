import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  SortableList,
  SortableRowLayout,
} from "@/components/ui/SortableList";
import { createId } from "@/lib/utils";
import type { BulletItem } from "@/types/common";

interface BulletListEditorProps {
  title: string;
  items: BulletItem[];
  error?: string;
  addLabel?: string;
  placeholder?: string;
  onChange: (items: BulletItem[]) => void;
  idPrefix: string;
}

export function BulletListEditor({
  title,
  items,
  error,
  addLabel = "Add item",
  placeholder = "Enter goal",
  onChange,
  idPrefix,
}: BulletListEditorProps) {
  function updateItem(id: string, text: string) {
    onChange(items.map((item) => (item.id === id ? { ...item, text } : item)));
  }

  function addItem() {
    onChange([...items, { id: createId("bullet"), text: "" }]);
  }

  function removeItem(id: string) {
    onChange(items.filter((item) => item.id !== id));
  }

  return (
    <section>
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-text">{title}</h3>
          {items.length === 0 ? (
            <p className="mt-0.5 text-xs text-muted">
              Empty — this section is hidden when copied.
            </p>
          ) : (
            <p className="mt-0.5 text-xs text-muted">
              Drag the grip to reorder items.
            </p>
          )}
        </div>
        <Button
          size="sm"
          variant="secondary"
          onClick={addItem}
          className="w-full shrink-0 sm:w-auto"
        >
          {addLabel}
        </Button>
      </div>
      {error ? <p className="mb-2 text-xs text-danger">{error}</p> : null}
      <SortableList
        items={items}
        onReorder={onChange}
        ariaLabel={title}
        className="gap-2.5 sm:gap-2"
        renderItem={(item, index, drag) => (
          <SortableRowLayout drag={drag}>
            <div className="flex items-center gap-2 rounded-xl border border-border bg-background/50 p-2.5 sm:border-0 sm:bg-transparent sm:p-0">
              <Input
                id={`${idPrefix}-${item.id}`}
                value={item.text}
                onChange={(event) => updateItem(item.id, event.target.value)}
                placeholder={placeholder}
                aria-label={`${title} ${index + 1}`}
              />
              <button
                type="button"
                onClick={() => removeItem(item.id)}
                className="inline-flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-xl text-danger transition-colors hover:bg-danger/10"
                aria-label={`Remove ${title} item ${index + 1}`}
                title="Remove"
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
          </SortableRowLayout>
        )}
      />
    </section>
  );
}
