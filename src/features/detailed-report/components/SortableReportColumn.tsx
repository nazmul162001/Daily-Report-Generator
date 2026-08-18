import { type DraggableAttributes, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { CSSProperties, ReactNode } from "react";
import { DragHandle } from "@/components/ui/DragHandle";
import { cn } from "@/lib/utils";
import { columnLabel, type ReportColumnId } from "../columnOrder";

export type ColumnDragProps = {
  attributes: DraggableAttributes;
  listeners: Record<string, unknown> | undefined;
};

interface SortableReportColumnProps {
  id: ReportColumnId;
  disabled?: boolean;
  className?: string;
  children: ReactNode | ((drag: ColumnDragProps) => ReactNode);
}

export function ColumnDragHandle({
  id,
  attributes,
  listeners,
  className,
}: ColumnDragProps & { id: ReportColumnId; className?: string }) {
  const label = `Drag to move ${columnLabel(id)}`;
  return (
    <DragHandle
      className={cn("h-8 w-8 shrink-0", className)}
      title={label}
      aria-label={label}
      {...attributes}
      {...listeners}
    />
  );
}

export function SortableReportColumn({
  id,
  disabled = false,
  className,
  children,
}: SortableReportColumnProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: transition ?? "transform 220ms cubic-bezier(0.25, 1, 0.5, 1)",
    zIndex: isDragging ? 30 : undefined,
    opacity: isDragging ? 0.4 : 1,
  };

  const drag: ColumnDragProps = { attributes, listeners };
  const content = typeof children === "function" ? children(drag) : children;

  return (
    <section
      ref={setNodeRef}
      style={style}
      className={cn("relative min-w-0", className)}
      aria-label={columnLabel(id)}
    >
      {content}
    </section>
  );
}

export function ColumnDragPreview({ id }: { id: ReportColumnId }) {
  return (
    <div className="rounded-2xl border border-primary/30 bg-surface px-4 py-3 shadow-lg ring-2 ring-primary/20">
      <p className="text-sm font-semibold text-text">{columnLabel(id)}</p>
      <p className="mt-0.5 text-xs text-muted">Drop to place this column</p>
    </div>
  );
}
