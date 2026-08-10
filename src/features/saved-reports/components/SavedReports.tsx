import { useCallback, useEffect, useState } from "react";
import { ConfirmDialog } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { ToastProvider, useToast } from "@/components/ui/Toast";
import { reportRepository, setDraft } from "@/lib/repository";
import { copyToClipboard } from "@/lib/clipboard";
import { STORAGE_KEYS } from "@/lib/storage";
import type { ReportType, SavedReportMeta } from "@/types/common";
import { SavedReportCard } from "./SavedReportCard";

const draftKeyByType: Record<ReportType, string> = {
  "today-task": STORAGE_KEYS.draftTodayTask,
  "daily-report": STORAGE_KEYS.draftDailyReport,
  "detailed-report": STORAGE_KEYS.draftDetailedReport,
};

const routeByType: Record<ReportType, string> = {
  "today-task": "/today-task",
  "daily-report": "/daily-report",
  "detailed-report": "/detailed-report",
};

function SavedReportsInner() {
  const { showToast } = useToast();
  const [reports, setReports] = useState<SavedReportMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingDelete, setPendingDelete] = useState<SavedReportMeta | null>(
    null,
  );

  const loadReports = useCallback(async () => {
    const items = await reportRepository.getReports();
    setReports(items);
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadReports();
  }, [loadReports]);

  async function handleCopy(report: SavedReportMeta) {
    const result = await copyToClipboard(report.content);
    if (result.success) {
      showToast("Report copied successfully.");
    } else {
      showToast(result.error, "error");
    }
  }

  function handleLoad(report: SavedReportMeta) {
    if (!report.payload) {
      showToast("This report cannot be loaded into the editor.", "error");
      return;
    }
    const ok = setDraft(draftKeyByType[report.type], report.payload);
    if (!ok) {
      showToast("Unable to load report into storage.", "error");
      return;
    }
    showToast("Report loaded. Opening editor…");
    window.location.href = routeByType[report.type];
  }

  async function confirmDelete() {
    if (!pendingDelete) {
      return;
    }
    await reportRepository.deleteReport(pendingDelete.id);
    setPendingDelete(null);
    showToast("Report deleted.");
    await loadReports();
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-8 text-center text-sm text-muted">
        Loading saved reports…
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <EmptyState
        title="No saved reports yet."
        description="Create your first report to see it here."
        actionLabel="Create Report"
        actionHref="/today-task"
      />
    );
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        {reports.map((report) => (
          <SavedReportCard
            key={report.id}
            report={report}
            onCopy={handleCopy}
            onLoad={handleLoad}
            onDelete={setPendingDelete}
          />
        ))}
      </div>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete this report?"
        description="This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </>
  );
}

export function SavedReports() {
  return (
    <ToastProvider>
      <SavedReportsInner />
    </ToastProvider>
  );
}
