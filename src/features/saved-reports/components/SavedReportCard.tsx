import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { formatDateTime, formatDisplayDate } from "@/lib/date";
import type { SavedReportMeta } from "@/types/common";

interface SavedReportCardProps {
  report: SavedReportMeta;
  onCopy: (report: SavedReportMeta) => void;
  onLoad: (report: SavedReportMeta) => void;
  onDelete: (report: SavedReportMeta) => void;
}

const typeLabels: Record<SavedReportMeta["type"], string> = {
  "today-task": "Today's Task",
  "daily-report": "Daily Report",
  "detailed-report": "Detailed Report",
};

const typeBadge: Record<
  SavedReportMeta["type"],
  "info" | "success" | "warning"
> = {
  "today-task": "info",
  "daily-report": "success",
  "detailed-report": "warning",
};

export function SavedReportCard({
  report,
  onCopy,
  onLoad,
  onDelete,
}: SavedReportCardProps) {
  return (
    <Card as="article" className="flex flex-col">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-base font-semibold text-text">{report.title}</h3>
          <p className="mt-1 text-sm text-muted">
            {formatDisplayDate(report.date)}
          </p>
        </div>
        <Badge variant={typeBadge[report.type]}>
          {typeLabels[report.type]}
        </Badge>
      </div>

      <p className="mb-3 text-xs text-muted">
        Saved {formatDateTime(report.createdAt)}
      </p>

      <pre className="mb-4 max-h-36 overflow-auto whitespace-pre-wrap break-words rounded-xl border border-border bg-background p-3 font-mono text-xs text-text">
        {report.content}
      </pre>

      <div className="mt-auto flex flex-wrap gap-2">
        <Button size="sm" onClick={() => onCopy(report)}>
          Copy
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => onLoad(report)}
          disabled={!report.payload}
          title={
            report.payload
              ? "Load into editor"
              : "Structured data unavailable for this save"
          }
        >
          Load
        </Button>
        <Button size="sm" variant="danger" onClick={() => onDelete(report)}>
          Delete
        </Button>
      </div>
    </Card>
  );
}
