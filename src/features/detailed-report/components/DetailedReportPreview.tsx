import type { ReactNode } from "react";
import { ReportPreview as SharedPreview } from "@/components/ui/ReportPreview";
import type { DraftStatus } from "@/types/common";

interface DetailedReportPreviewProps {
  content: string;
  htmlContent?: string;
  draftStatus?: DraftStatus;
  columnDrag?: ReactNode;
}

export function DetailedReportPreview({
  content,
  htmlContent,
  draftStatus,
  columnDrag,
}: DetailedReportPreviewProps) {
  return (
    <SharedPreview
      title="Generated report"
      content={content}
      htmlContent={htmlContent}
      draftStatus={draftStatus}
      columnDrag={columnDrag}
    />
  );
}
