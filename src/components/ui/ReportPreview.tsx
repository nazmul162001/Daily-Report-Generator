import { useState } from "react";
import { copyToClipboard } from "@/lib/clipboard";
import { Button } from "./Button";
import { Card } from "./Card";
import { useToast } from "./Toast";

interface ReportPreviewProps {
  title: string;
  content: string;
  /** Optional HTML for rich paste (Slack compositor). */
  htmlContent?: string;
  draftStatus?: "idle" | "saving" | "saved";
  onSave?: () => void;
  saveLabel?: string;
}

export function ReportPreview({
  title,
  content,
  htmlContent,
  draftStatus = "idle",
  onSave,
  saveLabel = "Save Report",
}: ReportPreviewProps) {
  const { showToast } = useToast();
  const [copied, setCopied] = useState(false);
  const charCount = content.length;

  async function handleCopy() {
    const result = await copyToClipboard(content, htmlContent);
    if (result.success) {
      setCopied(true);
      showToast("Report copied to clipboard.");
      window.setTimeout(() => setCopied(false), 2000);
      return;
    }
    showToast(result.error, "error");
  }

  return (
    <Card className="sticky top-4 flex h-fit flex-col">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold text-text sm:text-lg">
            {title}
          </h2>
          <p className="mt-0.5 text-xs text-muted">
            Live preview · {charCount} characters
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted">
          {draftStatus === "saving" ? (
            <span className="rounded-full bg-background px-2 py-1">Saving…</span>
          ) : null}
          {draftStatus === "saved" ? (
            <span className="rounded-full bg-success/10 px-2 py-1 text-success">
              Saved locally
            </span>
          ) : null}
        </div>
      </div>

      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <Button
          onClick={handleCopy}
          variant={copied ? "success" : "primary"}
          fullWidth
          aria-label="Copy report to clipboard"
          title="Copy report (Ctrl/Cmd + Enter)"
        >
          {copied ? "Copied ✓" : "Copy Report"}
        </Button>
        {onSave ? (
          <Button
            variant="secondary"
            onClick={onSave}
            fullWidth
            title="Save report (Ctrl/Cmd + S)"
          >
            {saveLabel}
          </Button>
        ) : null}
      </div>

      <pre
        className="max-h-[min(60vh,520px)] overflow-auto whitespace-pre-wrap break-words rounded-xl border border-border bg-white p-4 font-mono text-[13px] leading-relaxed text-text sm:text-sm"
        aria-label="Generated report preview"
      >
        {content || "Your report preview will appear here."}
      </pre>
    </Card>
  );
}
