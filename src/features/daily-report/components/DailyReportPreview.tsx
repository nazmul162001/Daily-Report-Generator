import { ReportPreview as SharedPreview } from "@/components/ui/ReportPreview";
import type { DraftStatus } from "@/types/common";

interface DailyReportPreviewProps {
  content: string;
  htmlContent?: string;
  draftStatus?: DraftStatus;
}

export function DailyReportPreview({
  content,
  htmlContent,
  draftStatus,
}: DailyReportPreviewProps) {
  return (
    <SharedPreview
      title="Generated report"
      content={content}
      htmlContent={htmlContent}
      draftStatus={draftStatus}
    />
  );
}
