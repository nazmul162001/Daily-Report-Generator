import { useCallback, useEffect, useMemo, useState } from "react";
import { ToastProvider, useToast } from "@/components/ui/Toast";
import {
  createDefaultDetailedReport,
  normalizeDetailedReport,
} from "@/data/defaultTemplates";
import { applyTrackingRevisionDefault } from "@/features/time-tracking/revision";
import { getDraft, reportRepository, setPreferences } from "@/lib/repository";
import { getTodayIsoDate } from "@/lib/date";
import { STORAGE_KEYS } from "@/lib/storage";
import { createId } from "@/lib/utils";
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
  const [report, setReport] = useState<DetailedReportData>(() =>
    createDefaultDetailedReport(),
  );
  const [hydrated, setHydrated] = useState(false);
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
    // Restore once per mount; don't re-run if toast identity changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    function refreshRevisionDefault() {
      setReport((current) => applyTrackingRevisionDefault(current));
    }

    function onVisibility() {
      if (document.visibilityState === "visible") {
        refreshRevisionDefault();
      }
    }

    window.addEventListener("focus", refreshRevisionDefault);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("focus", refreshRevisionDefault);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [hydrated]);

  const draftStatus = useDraftAutoSave(
    STORAGE_KEYS.draftDetailedReport,
    report,
    hydrated,
  );
  const generated = useMemo(() => formatDetailedReport(report), [report]);
  const generatedHtml = useMemo(
    () => formatDetailedReportHtml(report),
    [report],
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
    // Goal Review / Goals for Tomorrow are optional — empty = omitted from copy
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }, [report]);

  const resolveReportForOutput = useCallback((): DetailedReportData => {
    const next = applyTrackingRevisionDefault(report);
    if (next !== report) {
      setReport(next);
    }
    return next;
  }, [report]);

  const handleCopy = useCallback(async () => {
    if (!validate()) {
      showToast("Please fix validation errors first.", "error");
      return;
    }
    const resolved = resolveReportForOutput();
    const result = await copyToClipboard(
      formatDetailedReport(resolved),
      formatDetailedReportHtml(resolved),
    );
    if (result.success) {
      showToast("Report copied to clipboard.");
    } else {
      showToast(result.error, "error");
    }
  }, [resolveReportForOutput, showToast, validate]);

  const handleSave = useCallback(async () => {
    if (!validate()) {
      showToast("Please fix validation errors first.", "error");
      return;
    }
    const resolved = resolveReportForOutput();
    const now = new Date().toISOString();
    const content = formatDetailedReport(resolved);
    const saved = await reportRepository.saveReport({
      id: createId("saved"),
      type: "detailed-report",
      title: "Detailed CMS Report",
      date: resolved.date,
      createdAt: now,
      updatedAt: now,
      content,
      payload: resolved,
    });
    if (!saved) {
      showToast("Couldn’t save to this browser. Storage may be full.", "error");
      return;
    }
    showToast("Report saved.");
  }, [resolveReportForOutput, showToast, validate]);

  useKeyboardShortcuts({
    onCopy: handleCopy,
    onSave: handleSave,
    enabled: hydrated,
  });

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <DetailedReportForm
        report={report}
        errors={errors}
        onChange={setReport}
      />
      <DetailedReportPreview
        content={generated}
        htmlContent={generatedHtml}
        draftStatus={draftStatus}
        onSave={handleSave}
      />
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
