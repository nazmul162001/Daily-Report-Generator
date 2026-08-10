import {
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DraggableAttributes,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  type CSSProperties,
  type ReactNode,
  useId,
  useMemo,
  useState,
} from "react";
import { cn } from "@/lib/utils";
import { DragHandle } from "./DragHandle";

export type DragHandleBind = {
  attributes: DraggableAttributes;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  listeners: Record<string, any> | undefined;
};

interface SortableListProps<T extends { id: string }> {
  items: T[];
  onReorder: (items: T[]) => void;
  renderItem: (item: T, index: number, drag: DragHandleBind) => ReactNode;
  renderOverlay?: (item: T) => ReactNode;
  className?: string;
  ariaLabel?: string;
}

function SortableRow<T extends { id: string }>({
  item,
  index,
  renderItem,
}: {
  item: T;
  index: number;
  renderItem: (item: T, index: number, drag: DragHandleBind) => ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: transition ?? "transform 200ms cubic-bezier(0.25, 1, 0.5, 1)",
    zIndex: isDragging ? 20 : undefined,
    position: "relative",
    opacity: isDragging ? 0.35 : 1,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={cn(
        "list-none touch-manipulation will-change-transform",
        isDragging && "scale-[0.99]",
      )}
    >
      {renderItem(item, index, { attributes, listeners })}
    </li>
  );
}

/**
 * Smooth vertical sortable list. Attach drag listeners to a DragHandle
 * inside each row so inputs and buttons stay clickable.
 */
export function SortableList<T extends { id: string }>({
  items,
  onReorder,
  renderItem,
  renderOverlay,
  className,
  ariaLabel,
}: SortableListProps<T>) {
  const dndId = useId();
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const ids = useMemo(() => items.map((item) => item.id), [items]);
  const activeItem = activeId
    ? items.find((item) => item.id === activeId)
    : undefined;

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);
    if (!over || active.id === over.id) {
      return;
    }
    const oldIndex = items.findIndex((item) => item.id === active.id);
    const newIndex = items.findIndex((item) => item.id === over.id);
    if (oldIndex < 0 || newIndex < 0) {
      return;
    }
    onReorder(arrayMove(items, oldIndex, newIndex));
  }

  if (items.length === 0) {
    return null;
  }

  return (
    <DndContext
      id={dndId}
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={(event) => setActiveId(String(event.active.id))}
      onDragCancel={() => setActiveId(null)}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <ul
          className={cn("flex flex-col", className)}
          aria-label={ariaLabel}
        >
          {items.map((item, index) => (
            <SortableRow
              key={item.id}
              item={item}
              index={index}
              renderItem={renderItem}
            />
          ))}
        </ul>
      </SortableContext>

      <DragOverlay
        dropAnimation={{
          duration: 200,
          easing: "cubic-bezier(0.25, 1, 0.5, 1)",
        }}
      >
        {activeItem ? (
          <div className="scale-[1.02] cursor-grabbing rounded-xl shadow-lg ring-2 ring-primary/20">
            {renderOverlay
              ? renderOverlay(activeItem)
              : renderItem(activeItem, 0, {
                  attributes: {} as DraggableAttributes,
                  listeners: undefined,
                })}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

export function SortableRowLayout({
  drag,
  children,
  className,
}: {
  drag: DragHandleBind;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start gap-1.5 sm:gap-2", className)}>
      <DragHandle
        className="mt-1 shrink-0"
        {...drag.attributes}
        {...drag.listeners}
      />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
