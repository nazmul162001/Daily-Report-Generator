import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { copyToClipboard } from "@/lib/clipboard";
import { cn } from "@/lib/utils";
import { Card } from "./Card";
import { useToast } from "./Toast";

interface ReportPreviewProps {
  title: string;
  content: string;
  /** Optional HTML for rich paste (Slack compositor). */
  htmlContent?: string;
  draftStatus?: "idle" | "saving" | "saved" | "error";
  columnDrag?: ReactNode;
}

function CopyIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-[1.15rem] w-[1.15rem]" aria-hidden>
      <rect x="9" y="9" width="11" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" className="h-[1.15rem] w-[1.15rem]" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12.5l4.2 4.2L19 7.5" />
    </svg>
  );
}

export function ReportPreview({
  title,
  content,
  htmlContent,
  draftStatus = "idle",
  columnDrag,
}: ReportPreviewProps) {
  const { showToast } = useToast();
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<number | null>(null);
  const charCount = content.length;
  const canCopy = content.trim().length > 0;

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  async function handleCopy() {
    if (!canCopy) {
      showToast("Nothing to copy.", "error");
      return;
    }
    const result = await copyToClipboard(content, htmlContent);
    if (!result.success) {
      showToast(result.error, "error");
      return;
    }
    setCopied(true);
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
    }
    timerRef.current = window.setTimeout(() => setCopied(false), 1800);
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
        <div className="flex items-center gap-1.5">
          {columnDrag ? <div className="hidden shrink-0 xl:block">{columnDrag}</div> : null}
          {draftStatus === "saving" ? (
            <span className="rounded-full bg-background px-2 py-1">Saving…</span>
          ) : null}
          {draftStatus === "saved" ? (
            <span className="rounded-full bg-success/10 px-2 py-1 text-success">
              Saved locally
            </span>
          ) : null}
          {draftStatus === "error" ? (
            <span className="rounded-full bg-danger/10 px-2 py-1 text-danger">
              Couldn’t save locally
            </span>
          ) : null}
        </div>
      </div>

      <div
        className={cn(
          "relative min-h-0 flex-1 overflow-hidden rounded-xl border bg-background",
          copied ? "copy-preview-flash border-success/40" : "border-border",
        )}
      >
        <pre
          className="max-h-full min-h-0 overflow-auto whitespace-pre-wrap break-words p-4 pb-14 font-mono text-[13px] leading-relaxed text-text sm:p-4 sm:pb-16 sm:text-sm"
          aria-label="Generated report preview"
        >
          {content || "Your report preview will appear here."}
        </pre>

        <button
          type="button"
          onClick={handleCopy}
          disabled={!canCopy}
          aria-label={copied ? "Copied to clipboard" : "Copy report to clipboard"}
          title="Copy report (Ctrl/Cmd + Enter)"
          className={cn(
            "copy-icon-btn z-10 inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border shadow-sm backdrop-blur-md transition-all duration-200",
            copied
              ? "border-success/35 bg-success/15 text-success"
              : "border-border bg-surface/88 text-muted hover:border-primary/35 hover:bg-primary/10 hover:text-primary active:scale-95",
            "disabled:cursor-not-allowed disabled:opacity-40",
          )}
        >
          <span key={copied ? "check" : "copy"} className="copy-icon-swap">
            {copied ? <CheckIcon /> : <CopyIcon />}
          </span>
          {copied ? (
            <>
              <span className="copy-burst" aria-hidden />
              <span className="copy-spark copy-spark-1" aria-hidden />
              <span className="copy-spark copy-spark-2" aria-hidden />
              <span className="copy-spark copy-spark-3" aria-hidden />
              <span className="copy-spark copy-spark-4" aria-hidden />
            </>
          ) : null}
        </button>
        {copied ? (
          <span className="copy-chip pointer-events-none z-10 rounded-full bg-success/15 px-2 py-1 text-[11px] font-semibold text-success">
            Copied
          </span>
        ) : null}
      </div>
    </Card>
  );
}
