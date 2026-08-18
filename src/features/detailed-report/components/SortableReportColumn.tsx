import { type DraggableAttributes, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useRef, type CSSProperties, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import { DragHandle } from "@/components/ui/DragHandle";
import { cn } from "@/lib/utils";
import { columnLabel, type ReportColumnId } from "../columnOrder";

export type ColumnDragProps = {
  attributes: DraggableAttributes;
  listeners: Record<string, unknown> | undefined;
};

export type ColumnRenderExtras = {
  resizeHandleRight: ReactNode | null;
};

interface SortableReportColumnProps {
  id: ReportColumnId;
  disabled?: boolean;
  className?: string;
  resizeNeighbor?: ReportColumnId | null;
  onResizeStart?: (leftId: ReportColumnId, rightId: ReportColumnId) => void;
  onResize?: (leftId: ReportColumnId, rightId: ReportColumnId, deltaX: number) => void;
  onResizeEnd?: () => void;
  children: ReactNode | ((drag: ColumnDragProps, extras: ColumnRenderExtras) => ReactNode);
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
  resizeNeighbor = null,
  onResizeStart,
  onResize,
  onResizeEnd,
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

  const style: CSSProperties = isDragging
    ? {
        transform: CSS.Transform.toString(transform),
        transition: transition ?? "transform 220ms cubic-bezier(0.25, 1, 0.5, 1)",
        zIndex: 30,
        opacity: 0.4,
      }
    : {};

  const drag: ColumnDragProps = { attributes, listeners };
  const canResize = Boolean(resizeNeighbor && onResizeStart && onResize && onResizeEnd);

  const formRightHandle =
    canResize && id === "form" ? (
      <ColumnResizeHandle
        leftId={id}
        rightId={resizeNeighbor!}
        onStart={onResizeStart!}
        onMove={onResize!}
        onEnd={onResizeEnd!}
      />
    ) : null;

  const logRightHandle =
    canResize && id === "log" && resizeNeighbor === "preview" ? (
      <ColumnResizeHandle
        leftId={id}
        rightId={resizeNeighbor}
        onStart={onResizeStart!}
        onMove={onResize!}
        onEnd={onResizeEnd!}
      />
    ) : null;

  const extras: ColumnRenderExtras = {
    resizeHandleRight: logRightHandle,
  };
  const content = typeof children === "function" ? children(drag, extras) : children;

  return (
    <section
      ref={setNodeRef}
      style={style}
      data-report-column={id}
      className={cn("relative min-w-0", className)}
      aria-label={columnLabel(id)}
    >
      {formRightHandle ? (
        <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-0 xl:block">
          <div className="pointer-events-auto sticky top-20 flex h-[calc(100vh-6rem)] items-center -translate-x-1/2">
            {formRightHandle}
          </div>
        </div>
      ) : null}
      {content}
    </section>
  );
}

function ColumnResizeHandle({
  leftId,
  rightId,
  onStart,
  onMove,
  onEnd,
}: {
  leftId: ReportColumnId;
  rightId: ReportColumnId;
  onStart: (leftId: ReportColumnId, rightId: ReportColumnId) => void;
  onMove: (leftId: ReportColumnId, rightId: ReportColumnId, deltaX: number) => void;
  onEnd: () => void;
}) {
  const dragging = useRef(false);
  const startX = useRef(0);
  const label = `Resize ${columnLabel(leftId)} and ${columnLabel(rightId)}`;

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    dragging.current = true;
    startX.current = event.clientX;
    event.currentTarget.setPointerCapture(event.pointerId);
    onStart(leftId, rightId);
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!dragging.current) {
      return;
    }
    onMove(leftId, rightId, event.clientX - startX.current);
  }

  function stopDrag() {
    if (!dragging.current) {
      return;
    }
    dragging.current = false;
    onEnd();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      onStart(leftId, rightId);
      onMove(leftId, rightId, event.key === "ArrowLeft" ? -24 : 24);
      onEnd();
    }
  }

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label={label}
      title="Drag to resize"
      tabIndex={0}
      className="group/resize cursor-col-resize touch-none p-1"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={stopDrag}
      onPointerCancel={stopDrag}
      onKeyDown={handleKeyDown}
    >
      <span
        className="block h-10 w-1.5 rounded-full bg-border shadow-sm transition-colors group-hover/resize:bg-primary group-focus-visible/resize:bg-primary"
        aria-hidden
      />
    </div>
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
