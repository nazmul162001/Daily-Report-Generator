import { tokenLines, type TokenKind } from "@/features/backup/highlight";
import { LANGUAGE_LABEL, type BackupLanguage } from "@/features/backup/language";
import { cn } from "@/lib/utils";

const TOKEN_CLASS: Record<TokenKind, string> = {
  plain: "text-[#d4d4d4]",
  comment: "text-[#6A9955]",
  string: "text-[#CE9178]",
  keyword: "text-[#569CD6]",
  number: "text-[#B5CEA8]",
  tag: "text-[#4EC9B0]",
  attr: "text-[#9CDCFE]",
  function: "text-[#DCDCAA]",
  variable: "text-[#9CDCFE]",
  punctuation: "text-[#808080]",
};

const DOT_CLASS: Record<BackupLanguage, string> = {
  html: "bg-[#ce9178]",
  css: "bg-[#569cd6]",
  javascript: "bg-[#dcdcaa]",
  php: "bg-[#c586c0]",
};

function HighlightedCode({
  code,
  language,
  withGutter = true,
}: {
  code: string;
  language: BackupLanguage;
  withGutter?: boolean;
}) {
  const lines = tokenLines(code || " ", language);
  const codeBlock = (
    <pre className="min-w-0 flex-1 px-4 py-3 font-mono text-[13px] leading-6 whitespace-pre">
      {lines.map((line, index) => (
        <div key={index} className="min-h-6">
          {line.length === 0
            ? " "
            : line.map((token, tokenIndex) => (
                <span key={tokenIndex} className={TOKEN_CLASS[token.kind]}>
                  {token.text}
                </span>
              ))}
        </div>
      ))}
    </pre>
  );
  if (!withGutter) {
    return codeBlock;
  }
  return (
    <div className="flex min-w-full">
      <div
        className="sticky left-0 select-none border-r border-white/10 bg-[#1e1e1e] px-3 py-3 text-right font-mono text-[13px] leading-6 text-[#858585]"
        aria-hidden
      >
        {lines.map((_, index) => (
          <div key={index}>{index + 1}</div>
        ))}
      </div>
      {codeBlock}
    </div>
  );
}

export function CodeFrame({
  code,
  language,
  title,
  className,
}: {
  code: string;
  language: BackupLanguage;
  title?: string;
  className?: string;
}) {
  return (
    <div className={cn("overflow-hidden rounded-xl border border-[#2d2d2d] bg-[#1e1e1e]", className)}>
      <div className="flex items-center gap-2 border-b border-white/10 bg-[#252526] px-3 py-2">
        <span className={cn("h-2.5 w-2.5 rounded-full", DOT_CLASS[language])} aria-hidden />
        <span className="text-xs font-medium text-[#cccccc]">{title || LANGUAGE_LABEL[language]}</span>
      </div>
      <div className="max-h-[min(52vh,36rem)] overflow-auto">
        <HighlightedCode code={code} language={language} />
      </div>
    </div>
  );
}

export function CodeEditor({
  code,
  language,
  onCodeChange,
  onPasteCode,
  label,
  fill = false,
}: {
  code: string;
  language: BackupLanguage;
  onCodeChange: (code: string) => void;
  onPasteCode: (code: string) => void;
  label: string;
  fill?: boolean;
}) {
  const lines = tokenLines(code || " ", language);

  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-xl border border-[#2d2d2d] bg-[#1e1e1e]",
        fill && "h-full min-h-64",
      )}
    >
      <div className="flex shrink-0 items-center gap-2 border-b border-white/10 bg-[#252526] px-3 py-2">
        <span className={cn("h-2.5 w-2.5 rounded-full", DOT_CLASS[language])} aria-hidden />
        <span className="text-xs font-medium text-[#cccccc]">{label}</span>
      </div>
      <div className={cn("flex min-h-48 overflow-auto", fill ? "min-h-0 flex-1" : "max-h-[min(42vh,28rem)]")}>
        <div
          className="sticky left-0 select-none border-r border-white/10 bg-[#1e1e1e] px-3 py-3 text-right font-mono text-[13px] leading-6 text-[#858585]"
          aria-hidden
        >
          {lines.map((_, index) => (
            <div key={index}>{index + 1}</div>
          ))}
        </div>
        <div className="relative min-h-full min-w-0 flex-1">
          <div className="pointer-events-none min-h-full" aria-hidden>
            <HighlightedCode code={code || " "} language={language} withGutter={false} />
          </div>
          <textarea
            value={code}
            aria-label={label}
            spellCheck={false}
            autoComplete="off"
            autoCorrect="off"
            placeholder="Paste HTML, CSS, JavaScript, or PHP"
            onChange={(event) => onCodeChange(event.target.value)}
            onPaste={(event) => {
              const pasted = event.clipboardData.getData("text");
              if (!pasted) {
                return;
              }
              event.preventDefault();
              const target = event.currentTarget;
              const start = target.selectionStart ?? code.length;
              const end = target.selectionEnd ?? code.length;
              onPasteCode(`${code.slice(0, start)}${pasted}${code.slice(end)}`);
            }}
            className="absolute inset-0 h-full w-full resize-none overflow-hidden bg-transparent px-4 py-3 font-mono text-[13px] leading-6 text-transparent caret-[#d4d4d4] outline-none placeholder:text-[#858585]/80"
          />
        </div>
      </div>
    </div>
  );
}
