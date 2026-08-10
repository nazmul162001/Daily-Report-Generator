import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createId } from "@/lib/utils";
import type { BulletItem } from "@/types/common";

interface BulletListEditorProps {
  title: string;
  items: BulletItem[];
  error?: string;
  addLabel?: string;
  onChange: (items: BulletItem[]) => void;
  idPrefix: string;
}

export function BulletListEditor({
  title,
  items,
  error,
  addLabel = "Add item",
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
    if (items.length <= 1) {
      return;
    }
    onChange(items.filter((item) => item.id !== id));
  }

  function moveItem(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= items.length) {
      return;
    }
    const next = [...items];
    const current = next[index];
    const neighbor = next[target];
    if (!current || !neighbor) {
      return;
    }
    next[index] = neighbor;
    next[target] = current;
    onChange(next);
  }

  return (
    <section>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-text">{title}</h3>
        <Button size="sm" variant="secondary" onClick={addItem}>
          {addLabel}
        </Button>
      </div>
      {error ? <p className="mb-2 text-xs text-danger">{error}</p> : null}
      <ul className="flex flex-col gap-3" aria-label={title}>
        {items.map((item, index) => (
          <li
            key={item.id}
            className="rounded-xl border border-border bg-background/60 p-3"
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-muted">
                Item {index + 1}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => moveItem(index, -1)}
                  disabled={index === 0}
                  aria-label={`Move item ${index + 1} up`}
                >
                  ↑
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => moveItem(index, 1)}
                  disabled={index === items.length - 1}
                  aria-label={`Move item ${index + 1} down`}
                >
                  ↓
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-danger hover:text-danger"
                  onClick={() => removeItem(item.id)}
                  disabled={items.length <= 1}
                  aria-label={`Remove item ${index + 1}`}
                >
                  Delete
                </Button>
              </div>
            </div>
            <Input
              id={`${idPrefix}-${item.id}`}
              label={`${title} text`}
              value={item.text}
              onChange={(event) => updateItem(item.id, event.target.value)}
              placeholder="Enter item text"
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
