import { useCallback, useEffect, useMemo, useState } from "react";
import { ToastProvider, useToast } from "@/components/ui/Toast";
import {
  createDefaultDailyReport,
  normalizeFixedTasks,
} from "@/data/defaultTemplates";
import { getTodayIsoDate } from "@/lib/date";
import { getDraft, reportRepository, setPreferences } from "@/lib/repository";
import { STORAGE_KEYS } from "@/lib/storage";
import { createId } from "@/lib/utils";
import { useDraftAutoSave } from "@/hooks/useDraftAutoSave";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { copyToClipboard } from "@/lib/clipboard";
import type { DailyReportData } from "../types";
import { formatDailyReport, formatDailyReportHtml } from "../utils";
import { DailyReportForm } from "./DailyReportForm";
import { DailyReportPreview } from "./DailyReportPreview";

function DailyReportPageInner() {
  const { showToast } = useToast();
  const [report, setReport] = useState<DailyReportData>(() =>
    createDefaultDailyReport(),
  );
  const [hydrated, setHydrated] = useState(false);
  const [errors, setErrors] = useState<{
    section?: string;
    tasks?: string;
  }>({});

  useEffect(() => {
    const draft = getDraft<DailyReportData>(STORAGE_KEYS.draftDailyReport);
    if (draft) {
      setReport({
        ...draft,
        date: getTodayIsoDate(),
        tasks: normalizeFixedTasks(draft.tasks, true, "daily-report"),
      });
      showToast("Draft restored.", "info");
    } else {
      setReport(createDefaultDailyReport());
    }
    setPreferences({ lastReportType: "daily-report" });
    setHydrated(true);
    // Restore once per mount; don't re-run if toast identity changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const draftStatus = useDraftAutoSave(
    STORAGE_KEYS.draftDailyReport,
    report,
    hydrated,
  );
  const generated = useMemo(() => formatDailyReport(report), [report]);
  const generatedHtml = useMemo(() => formatDailyReportHtml(report), [report]);

  const validate = useCallback((): boolean => {
    const nextErrors: typeof errors = {};
    if (!report.section.trim()) {
      nextErrors.section = "Section cannot be empty.";
    }
    if (report.tasks.every((task) => task.included === false)) {
      nextErrors.tasks = "Include at least one task in the report.";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }, [report]);

  const handleCopy = useCallback(async () => {
    if (!validate()) {
      showToast("Please fix validation errors first.", "error");
      return;
    }
    const result = await copyToClipboard(generated, generatedHtml);
    if (result.success) {
      showToast("Report copied to clipboard.");
    } else {
      showToast(result.error, "error");
    }
  }, [generated, generatedHtml, showToast, validate]);

  const handleSave = useCallback(async () => {
    if (!validate()) {
      showToast("Please fix validation errors first.", "error");
      return;
    }
    const now = new Date().toISOString();
    const saved = await reportRepository.saveReport({
      id: createId("saved"),
      type: "daily-report",
      title: "Daily Report",
      date: report.date,
      createdAt: now,
      updatedAt: now,
      content: generated,
      payload: report,
    });
    if (!saved) {
      showToast("Couldn’t save to this browser. Storage may be full.", "error");
      return;
    }
    showToast("Report saved.");
  }, [generated, report, showToast, validate]);

  useKeyboardShortcuts({
    onCopy: handleCopy,
    onSave: handleSave,
    enabled: hydrated,
  });

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <DailyReportForm report={report} errors={errors} onChange={setReport} />
      <DailyReportPreview
        content={generated}
        htmlContent={generatedHtml}
        draftStatus={draftStatus}
        onSave={handleSave}
      />
    </div>
  );
}

export function DailyReportPage() {
  return (
    <ToastProvider>
      <DailyReportPageInner />
    </ToastProvider>
  );
}
