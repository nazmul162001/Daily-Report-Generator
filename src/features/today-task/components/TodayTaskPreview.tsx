import { ReportPreview as SharedPreview } from "@/components/ui/ReportPreview";
import type { DraftStatus } from "@/types/common";

interface TodayTaskPreviewProps {
  content: string;
  htmlContent?: string;
  draftStatus?: DraftStatus;
  onSave?: () => void;
}

export function TodayTaskPreview({
  content,
  htmlContent,
  draftStatus,
  onSave,
}: TodayTaskPreviewProps) {
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
