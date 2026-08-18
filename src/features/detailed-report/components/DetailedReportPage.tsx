import { useCallback, useEffect, useMemo, useState } from "react";
import { ToastProvider, useToast } from "@/components/ui/Toast";
import {
  createDefaultDetailedReport,
  normalizeDetailedReport,
} from "@/data/defaultTemplates";
import { applyTrackingRevisionDefault } from "@/features/time-tracking/revision";
import { kindFromCategory } from "@/features/work-log/categories";
import { applyLiveMinutes } from "@/features/work-log/totals";
import { useWorkLog } from "@/features/work-log/useWorkLog";
import { WorkLogPanel } from "@/features/work-log/WorkLogPanel";
import { getDraft, setPreferences } from "@/lib/repository";
import { getTodayIsoDate } from "@/lib/date";
import { STORAGE_KEYS } from "@/lib/storage";
import { cn } from "@/lib/utils";
import { useDraftAutoSave } from "@/hooks/useDraftAutoSave";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { copyToClipboard } from "@/lib/clipboard";
import type { DetailedReportData } from "../types";
import { parseMinutes } from "../duration";
import {
  formatDetailedReport,
  formatDetailedReportHtml,
} from "../utils";
import { DetailedReportForm } from "./DetailedReportForm";
import { DetailedReportPreview } from "./DetailedReportPreview";

function DetailedReportPageInner() {
  const { showToast } = useToast();
  const workLog = useWorkLog();
  const [report, setReport] = useState<DetailedReportData>(() =>
    createDefaultDetailedReport(),
  );
  const [hydrated, setHydrated] = useState(false);
  const [selectedBreakdownId, setSelectedBreakdownId] = useState<string | null>(
    null,
  );
  const [errors, setErrors] = useState<{
    recipients?: string;
    workBreakdown?: string;
    goalReview?: string;
    tomorrowGoals?: string;
  }>({});

  useEffect(() => {
    const draft = getDraft<DetailedReportData>(STORAGE_KEYS.draftDetailedReport);
    const base = draft
      ? {
          ...normalizeDetailedReport(draft),
          date: getTodayIsoDate(),
        }
      : createDefaultDetailedReport();
    setReport(applyTrackingRevisionDefault(base));
    if (draft) {
      showToast("Draft restored.", "info");
    }
    setPreferences({ lastReportType: "detailed-report" });
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!hydrated || !workLog.hydrated) {
      return;
    }

    function syncLive() {
      setReport((current) => {
        const withRevision = applyTrackingRevisionDefault(current);
        const nextItems = applyLiveMinutes(
          withRevision.workBreakdown,
          workLog.day,
          Date.now(),
        );
        if (nextItems === withRevision.workBreakdown && withRevision === current) {
          return current;
        }
        return { ...withRevision, workBreakdown: nextItems };
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

  const selectedItem = report.workBreakdown.find(
    (item) => item.id === selectedBreakdownId,
  );
  const panelOpen = Boolean(selectedItem);

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
    const invalidMinutes = report.workBreakdown.some(
      (item) =>
        item.category.trim() &&
        !item.isNA &&
        parseMinutes(item.minutes) === null,
    );
    if (invalidMinutes) {
      nextErrors.workBreakdown =
        "Enter minutes or mark as N/A for each active category.";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }, [report]);

  const resolveReportForOutput = useCallback((): DetailedReportData => {
    const next = applyTrackingRevisionDefault(report);
    const workBreakdown = applyLiveMinutes(next.workBreakdown, workLog.day, workLog.now);
    const resolved = { ...next, workBreakdown };
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

  return (
    <div
      className={cn(
        "grid gap-6",
        panelOpen
          ? "xl:grid-cols-[minmax(0,1fr)_minmax(22rem,26rem)_minmax(0,0.95fr)] lg:grid-cols-2"
          : "lg:grid-cols-2",
      )}
    >
      <DetailedReportForm
        report={report}
        errors={errors}
        selectedBreakdownId={selectedBreakdownId}
        logDay={workLog.day}
        now={workLog.now}
        onSelectBreakdown={(id) => {
          if (!id) {
            setSelectedBreakdownId(null);
            return;
          }
          setSelectedBreakdownId((current) => (current === id ? null : id));
        }}
        onChange={setReport}
      />

      {selectedItem ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-30 bg-black/40 xl:hidden"
            aria-label="Close log"
            onClick={() => setSelectedBreakdownId(null)}
          />
          <div className="max-xl:fixed max-xl:inset-x-0 max-xl:bottom-0 max-xl:z-40 max-xl:p-3 xl:contents">
            <WorkLogPanel
              kind={kindFromCategory(selectedItem.category)}
              category={selectedItem.category}
              log={workLog}
              onClose={() => setSelectedBreakdownId(null)}
            />
          </div>
        </>
      ) : null}

      <div className={cn(panelOpen && "lg:col-span-2 xl:col-span-1")}>
        <DetailedReportPreview
          content={generated}
          htmlContent={generatedHtml}
          draftStatus={draftStatus}
        />
      </div>
    </div>
  );
}

export function DetailedReportPage() {
  return (
    <ToastProvider>
      <DetailedReportPageInner />
    </ToastProvider>
  );
}
