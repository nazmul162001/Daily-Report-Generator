import { ReportPreview as SharedPreview } from "@/components/ui/ReportPreview";
import type { DraftStatus } from "@/types/common";

interface DailyReportPreviewProps {
  content: string;
  htmlContent?: string;
  draftStatus?: DraftStatus;
  onSave?: () => void;
}

export function DailyReportPreview({
  content,
  htmlContent,
  draftStatus,
  onSave,
}: DailyReportPreviewProps) {
  return (
    <SharedPreview
      title="Generated report"
      content={content}
      htmlContent={htmlContent}
      draftStatus={draftStatus}
      onSave={onSave}
    />
  );
}
