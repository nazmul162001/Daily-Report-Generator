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
    <Card className="sticky top-[4.75rem] z-20 flex h-fit max-h-[calc(100vh-5.5rem)] flex-col overflow-hidden bg-surface sm:top-20 sm:max-h-[calc(100vh-6rem)]">
      <div className="mb-3 shrink-0 flex flex-wrap items-center justify-between gap-2 bg-surface">
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

      <div className="mb-4 shrink-0 flex flex-col gap-2 sm:flex-row">
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
        className="min-h-0 flex-1 overflow-auto whitespace-pre-wrap break-words rounded-xl border border-border bg-white p-4 font-mono text-[13px] leading-relaxed text-text sm:text-sm"
        aria-label="Generated report preview"
      >
        {content || "Your report preview will appear here."}
      </pre>
    </Card>
  );
}
