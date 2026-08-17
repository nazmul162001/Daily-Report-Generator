import { useCallback, useEffect, useMemo, useState } from "react";
import { ToastProvider, useToast } from "@/components/ui/Toast";
import {
  createDefaultTodayTask,
  normalizeFixedTasks,
} from "@/data/defaultTemplates";
import { getDraft, reportRepository, setPreferences } from "@/lib/repository";
import { getTodayIsoDate } from "@/lib/date";
import { STORAGE_KEYS } from "@/lib/storage";
import { createId } from "@/lib/utils";
import { useDraftAutoSave } from "@/hooks/useDraftAutoSave";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { copyToClipboard } from "@/lib/clipboard";
import type { TodayTaskReport } from "../types";
import { formatTodayTaskReport, formatTodayTaskReportHtml } from "../utils";
import { TodayTaskForm } from "./TodayTaskForm";
import { TodayTaskPreview } from "./TodayTaskPreview";

function TodayTaskPageInner() {
  const { showToast } = useToast();
  const [report, setReport] = useState<TodayTaskReport>(() =>
    createDefaultTodayTask(),
  );
  const [hydrated, setHydrated] = useState(false);
  const [errors, setErrors] = useState<{
    section?: string;
    tasks?: string;
  }>({});

  useEffect(() => {
    const draft = getDraft<TodayTaskReport>(STORAGE_KEYS.draftTodayTask);
    if (draft) {
      setReport({
        ...draft,
        date: getTodayIsoDate(),
        tasks: normalizeFixedTasks(draft.tasks, false, "today-task"),
      });
      showToast("Draft restored.", "info");
    } else {
      setReport(createDefaultTodayTask());
    }
    setPreferences({ lastReportType: "today-task" });
    setHydrated(true);
    // Restore once per mount; don't re-run if toast identity changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const draftStatus = useDraftAutoSave(
    STORAGE_KEYS.draftTodayTask,
    report,
    hydrated,
  );

  const generated = useMemo(() => formatTodayTaskReport(report), [report]);
  const generatedHtml = useMemo(
    () => formatTodayTaskReportHtml(report),
    [report],
  );

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
      type: "today-task",
      title: "Today's Task",
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
      <TodayTaskForm report={report} errors={errors} onChange={setReport} />
      <TodayTaskPreview
        content={generated}
        htmlContent={generatedHtml}
        draftStatus={draftStatus}
        onSave={handleSave}
      />
    </div>
  );
}

export function TodayTaskPage() {
  return (
    <ToastProvider>
      <TodayTaskPageInner />
    </ToastProvider>
  );
}
