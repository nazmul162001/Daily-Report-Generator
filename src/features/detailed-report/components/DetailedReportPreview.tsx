import { ReportPreview as SharedPreview } from "@/components/ui/ReportPreview";
import type { DraftStatus } from "@/types/common";

interface DetailedReportPreviewProps {
  content: string;
  htmlContent?: string;
  draftStatus?: DraftStatus;
  onSave?: () => void;
}

export function DetailedReportPreview({
  content,
  htmlContent,
  draftStatus,
  onSave,
}: DetailedReportPreviewProps) {
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
