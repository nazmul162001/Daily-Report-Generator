import { useCallback, useEffect, useMemo, useState } from "react";
import { ToastProvider, useToast } from "@/components/ui/Toast";
import {
  createDefaultDetailedReport,
  normalizeDetailedReport,
} from "@/data/defaultTemplates";
import { getDraft, reportRepository, setPreferences } from "@/lib/repository";
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
    if (draft) {
      setReport(normalizeDetailedReport(draft));
      showToast("Draft restored.", "info");
    } else {
      setReport(createDefaultDetailedReport());
    }
    setPreferences({ lastReportType: "detailed-report" });
    setHydrated(true);
  }, [showToast]);

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
    if (report.goalReview.every((item) => !item.text.trim())) {
      nextErrors.goalReview = "Add at least one goal review item.";
    }
    if (report.tomorrowGoals.every((item) => !item.text.trim())) {
      nextErrors.tomorrowGoals = "Add at least one goal for tomorrow.";
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
    await reportRepository.saveReport({
      id: createId("saved"),
      type: "detailed-report",
      title: "Detailed CMS Report",
      date: report.date,
      createdAt: now,
      updatedAt: now,
      content: generated,
      payload: report,
    });
    showToast("Report saved.");
  }, [generated, report, showToast, validate]);

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
