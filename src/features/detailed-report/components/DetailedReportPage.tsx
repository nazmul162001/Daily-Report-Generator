import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import {
  DndContext,
  type DragEndEvent,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { ToastProvider, useToast } from "@/components/ui/Toast";
import {
  createDefaultDetailedReport,
  normalizeDetailedReport,
  resetUnlockedBreakdownMinutes,
  startOfDayWorkBreakdown,
} from "@/data/defaultTemplates";
import { isRevisionItem } from "@/features/time-tracking/revision";
import { applyLiveMinutes } from "@/features/work-log/totals";
import { useWorkLog } from "@/features/work-log/useWorkLog";
import { getDraft, setPreferences } from "@/lib/repository";
import { getTodayIsoDate } from "@/lib/date";
import { STORAGE_KEYS } from "@/lib/storage";
import { cn } from "@/lib/utils";
import { useDraftAutoSave } from "@/hooks/useDraftAutoSave";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { copyToClipboard } from "@/lib/clipboard";
import type { DetailedReportData } from "../types";
import {
  formatDetailedReport,
  formatDetailedReportHtml,
} from "../utils";
import {
  columnTrack,
  DEFAULT_COLUMN_ORDER,
  isReportColumnId,
  loadColumnOrder,
  MIN_COLUMN_PX,
  saveColumnOrder,
  type ColumnWidthMap,
  type ReportColumnId,
} from "../columnOrder";
import { ColumnDragHandle, ColumnDragPreview, SortableReportColumn } from "./SortableReportColumn";
import { DetailedReportForm } from "./DetailedReportForm";
import { DetailedReportPreview } from "./DetailedReportPreview";

function DetailedReportPageInner() {
  const { showToast } = useToast();
  const workLog = useWorkLog();
  const [report, setReport] = useState<DetailedReportData>(() =>
    createDefaultDetailedReport(),
  );
  const [hydrated, setHydrated] = useState(false);
  const [columnOrder, setColumnOrder] = useState<ReportColumnId[]>(
    DEFAULT_COLUMN_ORDER,
  );
  const [columnWidths, setColumnWidths] = useState<ColumnWidthMap | null>(null);
  const [activeColumn, setActiveColumn] = useState<ReportColumnId | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);
  const resizeSnapshot = useRef<ColumnWidthMap | null>(null);
  const columnDndId = useId();
  const [errors, setErrors] = useState<{
    recipients?: string;
    workBreakdown?: string;
    goalReview?: string;
    tomorrowGoals?: string;
  }>({});

  useEffect(() => {
    const today = getTodayIsoDate();
    const draft = getDraft<DetailedReportData>(STORAGE_KEYS.draftDetailedReport);
    const restored = draft
      ? normalizeDetailedReport(draft)
      : createDefaultDetailedReport();
    const isNewDay = restored.date !== today;
    const workBreakdown = (
      isNewDay
        ? startOfDayWorkBreakdown(restored.workBreakdown)
        : resetUnlockedBreakdownMinutes(restored.workBreakdown)
    ).map((item) =>
      isRevisionItem(item)
        ? { ...item, minutes: "0", isNA: false, minutesLocked: false }
        : item,
    );
    setReport({
      ...restored,
      date: today,
      workBreakdown,
      revisionManuallyEdited: isNewDay
        ? false
        : restored.revisionManuallyEdited,
    });
    if (draft) {
      showToast("Draft restored.", "info");
    }
    setPreferences({ lastReportType: "detailed-report" });
    setHydrated(true);
    setColumnOrder(loadColumnOrder());
    return () => {
      document.documentElement.classList.remove("col-resizing");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!hydrated || !workLog.hydrated) {
      return;
    }

    function syncLive() {
      const today = getTodayIsoDate();
      setReport((current) => {
        const rolled =
          current.date === today
            ? current
            : {
                ...current,
                date: today,
                revisionManuallyEdited: false,
                workBreakdown: startOfDayWorkBreakdown(current.workBreakdown),
              };
        const nextItems = applyLiveMinutes(
          rolled.workBreakdown,
          workLog.day,
          Date.now(),
        );
        if (nextItems === rolled.workBreakdown && rolled === current) {
          return current;
        }
        return { ...rolled, workBreakdown: nextItems };
      });
    }

    syncLive();
    function onVisibility() {
      if (document.visibilityState === "visible") {
        syncLive();
      }
    }
    window.addEventListener("focus", syncLive);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("focus", syncLive);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [hydrated, workLog.hydrated, workLog.day]);

  const draftStatus = useDraftAutoSave(
    STORAGE_KEYS.draftDetailedReport,
    report,
    hydrated,
  );

  const visibleColumns = useMemo(
    () => columnOrder.filter((id) => id !== "log"),
    [columnOrder],
  );

  const generated = useMemo(
    () => formatDetailedReport(report, workLog.day, workLog.now),
    [report, workLog.day, workLog.now],
  );
  const generatedHtml = useMemo(
    () => formatDetailedReportHtml(report, workLog.day, workLog.now),
    [report, workLog.day, workLog.now],
  );

  const validate = useCallback((): boolean => {
    const nextErrors: typeof errors = {};
    if (report.recipients.every((r) => !r.name.trim())) {
      nextErrors.recipients = "Recipients are missing.";
    }
    if (report.workBreakdown.every((item) => !item.category.trim())) {
      nextErrors.workBreakdown = "Add at least one work breakdown row.";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }, [report]);

  const resolveReportForOutput = useCallback((): DetailedReportData => {
    const workBreakdown = applyLiveMinutes(report.workBreakdown, workLog.day, workLog.now);
    const resolved = { ...report, workBreakdown };
    if (resolved !== report) {
      setReport(resolved);
    }
    return resolved;
  }, [report, workLog.day, workLog.now]);

  const handleCopy = useCallback(async () => {
    if (!validate()) {
      showToast("Please fix validation errors first.", "error");
      return;
    }
    const resolved = resolveReportForOutput();
    const result = await copyToClipboard(
      formatDetailedReport(resolved, workLog.day, workLog.now),
      formatDetailedReportHtml(resolved, workLog.day, workLog.now),
    );
    if (result.success) {
      showToast("Report copied to clipboard.");
    } else {
      showToast(result.error, "error");
    }
  }, [resolveReportForOutput, showToast, validate, workLog.day, workLog.now]);

  useKeyboardShortcuts({
    onCopy: handleCopy,
    enabled: hydrated,
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const xlColumns = visibleColumns
    .map((id) => columnTrack(id, false, columnWidths))
    .join(" ");

  const resizeNeighbors = useMemo(() => {
    const next = new Map<ReportColumnId, ReportColumnId>();
    for (let index = 0; index < visibleColumns.length - 1; index += 1) {
      next.set(visibleColumns[index], visibleColumns[index + 1]);
    }
    return next;
  }, [visibleColumns]);

  function measureColumn(id: ReportColumnId): number {
    const node = gridRef.current?.querySelector(`[data-report-column="${id}"]`);
    return node instanceof HTMLElement ? node.getBoundingClientRect().width : 0;
  }

  function handleResizeStart(leftId: ReportColumnId, rightId: ReportColumnId) {
    const formPx = Math.max(measureColumn("form"), 1);
    const previewPx = Math.max(measureColumn("preview"), 1);
    const logMeasured = measureColumn("log");
    const customizeLog =
      leftId === "log" || rightId === "log" || columnWidths?.log != null;
    const snapshot: ColumnWidthMap = {
      form: formPx,
      preview: previewPx,
      log: customizeLog ? Math.max(logMeasured, 1) : null,
    };
    resizeSnapshot.current = snapshot;
    setColumnWidths(snapshot);
    setIsResizing(true);
    document.documentElement.classList.add("col-resizing");
  }

  function handleResize(
    leftId: ReportColumnId,
    rightId: ReportColumnId,
    deltaX: number,
  ) {
    const start = resizeSnapshot.current;
    if (!start) {
      return;
    }
    const startLeft = leftId === "log" ? (start.log ?? 1) : start[leftId];
    const startRight = rightId === "log" ? (start.log ?? 1) : start[rightId];
    const pair = startLeft + startRight;
    const maxLeft = pair - MIN_COLUMN_PX[rightId];
    const nextLeft = Math.min(
      Math.max(startLeft + deltaX, MIN_COLUMN_PX[leftId]),
      maxLeft,
    );
    const nextRight = pair - nextLeft;
    const next: ColumnWidthMap = { ...start };
    if (leftId === "log") {
      next.log = nextLeft;
    } else {
      next[leftId] = nextLeft;
    }
    if (rightId === "log") {
      next.log = nextRight;
    } else {
      next[rightId] = nextRight;
    }
    setColumnWidths(next);
  }

  function handleResizeEnd() {
    setIsResizing(false);
    document.documentElement.classList.remove("col-resizing");
    resizeSnapshot.current = null;
  }

  function handleColumnDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveColumn(null);
    if (!over || active.id === over.id) {
      return;
    }
    const oldIndex = columnOrder.findIndex((id) => id === active.id);
    const newIndex = columnOrder.findIndex((id) => id === over.id);
    if (oldIndex < 0 || newIndex < 0) {
      return;
    }
    const next = arrayMove(columnOrder, oldIndex, newIndex);
    setColumnOrder(next);
    saveColumnOrder(next);
  }

  function renderColumn(
    id: ReportColumnId,
    drag: Parameters<typeof ColumnDragHandle>[0],
  ) {
    const handle = <ColumnDragHandle id={id} {...drag} />;
    if (id === "form") {
      return (
        <DetailedReportForm
          report={report}
          errors={errors}
          log={workLog}
          onChange={setReport}
          columnDrag={handle}
        />
      );
    }
    return (
      <DetailedReportPreview
        content={generated}
        htmlContent={generatedHtml}
        draftStatus={draftStatus}
        columnDrag={handle}
      />
    );
  }

  return (
    <>
      <DndContext
        id={columnDndId}
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={(event) => {
          const id = String(event.active.id);
          if (isReportColumnId(id)) {
            setActiveColumn(id);
          }
        }}
        onDragCancel={() => setActiveColumn(null)}
        onDragEnd={handleColumnDragEnd}
      >
        <SortableContext items={visibleColumns} strategy={horizontalListSortingStrategy}>
          <div
            ref={gridRef}
            className={cn(
              "report-columns grid items-start gap-6 lg:grid-cols-2",
              "xl:[grid-template-columns:var(--report-cols)]",
              isResizing && "select-none",
            )}
            style={{
              ["--report-cols" as string]: xlColumns,
            }}
          >
            {visibleColumns.map((id) => (
              <SortableReportColumn
                key={id}
                id={id}
                resizeNeighbor={
                  activeColumn ? null : (resizeNeighbors.get(id) ?? null)
                }
                onResizeStart={handleResizeStart}
                onResize={handleResize}
                onResizeEnd={handleResizeEnd}
                className={cn(
                  id === "form" && "self-start",
                  id === "preview" && "xl:self-stretch",
                )}
              >
                {(drag) => renderColumn(id, drag)}
              </SortableReportColumn>
            ))}
          </div>
        </SortableContext>
        <DragOverlay
          dropAnimation={{
            duration: 200,
            easing: "cubic-bezier(0.25, 1, 0.5, 1)",
          }}
        >
          {activeColumn ? <ColumnDragPreview id={activeColumn} /> : null}
        </DragOverlay>
      </DndContext>
    </>
  );
}

export function DetailedReportPage() {
  return (
    <ToastProvider>
      <DetailedReportPageInner />
    </ToastProvider>
  );
}
