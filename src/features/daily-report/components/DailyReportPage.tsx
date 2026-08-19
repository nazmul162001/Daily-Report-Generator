import { useCallback, useEffect, useMemo, useState } from "react";
import { ToastProvider, useToast } from "@/components/ui/Toast";
import {
  createDefaultDailyReport,
  normalizeFixedTasks,
} from "@/data/defaultTemplates";
import { getTodayIsoDate } from "@/lib/date";
import { getDraft, setPreferences } from "@/lib/repository";
import { STORAGE_KEYS } from "@/lib/storage";
import { useDraftAutoSave } from "@/hooks/useDraftAutoSave";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useUserName } from "@/components/layout/WelcomeNameModal";
import { copyToClipboard } from "@/lib/clipboard";
import { setUserName } from "@/lib/userName";
import type { DailyReportData } from "../types";
import { formatDailyReport, formatDailyReportHtml } from "../utils";
import { DailyReportForm } from "./DailyReportForm";
import { DailyReportPreview } from "./DailyReportPreview";

function DailyReportPageInner() {
  const { showToast } = useToast();
  const storedName = useUserName();
  const [userName, setUserNameDraft] = useState(storedName);
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

  useEffect(() => {
    setUserNameDraft(storedName);
  }, [storedName]);

  function handleUserNameChange(value: string) {
    setUserNameDraft(value);
  }

  function handleUserNameBlur() {
    const trimmed = userName.trim();
    if (trimmed) {
      setUserName(trimmed);
    }
  }

  const draftStatus = useDraftAutoSave(
    STORAGE_KEYS.draftDailyReport,
    report,
    hydrated,
  );
  const generated = useMemo(
    () => formatDailyReport(report, userName),
    [report, userName],
  );
  const generatedHtml = useMemo(
    () => formatDailyReportHtml(report, userName),
    [report, userName],
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

  useKeyboardShortcuts({
    onCopy: handleCopy,
    enabled: hydrated,
  });

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <DailyReportForm
        report={report}
        errors={errors}
        userName={userName}
        onUserNameChange={handleUserNameChange}
        onUserNameBlur={handleUserNameBlur}
        onChange={setReport}
      />
      <DailyReportPreview
        content={generated}
        htmlContent={generatedHtml}
        draftStatus={draftStatus}
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
