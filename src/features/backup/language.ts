export type BackupLanguage = "html" | "css" | "javascript" | "php";

export const BACKUP_LANGUAGES: BackupLanguage[] = ["html", "css", "javascript", "php"];

export const LANGUAGE_LABEL: Record<BackupLanguage, string> = {
  html: "HTML",
  css: "CSS",
  javascript: "JavaScript",
  php: "PHP",
};

export const LANGUAGE_SHORT: Record<BackupLanguage, string> = {
  html: "HTML",
  css: "CSS",
  javascript: "JS",
  php: "PHP",
};

export function detectLanguage(source: string): BackupLanguage {
  const code = source.trim();
  if (!code) {
    return "html";
  }
  if (/<\?(?:php|=)/i.test(code)) {
    return "php";
  }

  const htmlHits = (code.match(/<\/?[a-z][\w:-]*(?:\s|>|\/)/gi) || []).length;
  const looksLikeHtml = /<!doctype|<html\b|<head\b|<body\b|<div\b|<span\b|<section\b|<p\b|<a\b/i.test(
    code,
  );
  const looksLikeCss =
    /(margin|padding|color|display|font|background|border|width|height|content)\s*:/i.test(code) &&
    /[{}]/.test(code);
  const looksLikeJs = /\b(function|const|let|var|import|export|return|document|console|window|class)\b|=>/.test(
    code,
  );

  if ((looksLikeHtml || htmlHits >= 2) && !looksLikeCss) {
    return "html";
  }
  if (looksLikeHtml && htmlHits >= 1 && !looksLikeJs) {
    return "html";
  }
  if (looksLikeCss && !looksLikeJs && htmlHits < 2) {
    return "css";
  }
  if (looksLikeJs) {
    return "javascript";
  }
  if (looksLikeCss) {
    return "css";
  }
  if (htmlHits >= 1) {
    return "html";
  }
  if (/\$[A-Za-z_]/.test(code)) {
    return "php";
  }
  return "javascript";
}

function shouldFormat(source: string): boolean {
  const lines = source.split("\n");
  if (lines.length <= 2) {
    return /[;{}]|><|<\//.test(source);
  }
  return lines.some((line) => line.length > 160);
}

function tidy(source: string): string {
  return source
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.replace(/[ \t]+$/g, ""))
    .join("\n")
    .trim();
}

function indentLines(lines: string[], opens: (line: string) => boolean, closes: (line: string) => boolean): string {
  let depth = 0;
  return lines
    .map((raw) => {
      const line = raw.trim();
      if (!line) {
        return "";
      }
      if (closes(line)) {
        depth = Math.max(0, depth - 1);
      }
      const indented = `${"  ".repeat(depth)}${line}`;
      if (opens(line) && !closes(line)) {
        depth += 1;
      }
      return indented;
    })
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

const VOID_TAGS = new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr",
]);

function beautifyHtml(source: string): string {
  const broken = source.replace(/>\s*</g, ">\n<");
  return indentLines(
    broken.split("\n"),
    (line) => {
      const name = /^<([a-zA-Z][\w:-]*)/.exec(line)?.[1]?.toLowerCase();
      if (!name || VOID_TAGS.has(name) || line.startsWith("</") || line.startsWith("<!") || line.startsWith("<?")) {
        return false;
      }
      return !/\/>$/.test(line) && !line.includes(`</${name}`);
    },
    (line) => /^<\/[a-zA-Z]/.test(line),
  );
}

function beautifyCss(source: string): string {
  const flat = source.replace(/\s+/g, " ").trim();
  const broken = flat
    .replace(/\s*\{\s*/g, " {\n")
    .replace(/;\s*/g, ";\n")
    .replace(/\s*\}\s*/g, "\n}\n");
  return indentLines(
    broken.split("\n"),
    (line) => line.endsWith("{"),
    (line) => line.startsWith("}"),
  )
    .split("\n")
    .map((line) => (line.includes("://") ? line : line.replace(/:(?=\S)/g, ": ")))
    .join("\n");
}

function beautifyBraces(source: string): string {
  const broken = source
    .replace(/\s*\{\s*/g, " {\n")
    .replace(/;(?!\s*})/g, ";\n")
    .replace(/\s*\}(\s*;)?/g, (_match, semicolon: string | undefined) => (semicolon ? "\n};" : "\n}"));
  return indentLines(
    broken.split("\n"),
    (line) => line.endsWith("{"),
    (line) => line.startsWith("}"),
  );
}

export function formatCode(source: string, language: BackupLanguage): string {
  const normalized = tidy(source);
  if (!normalized || !shouldFormat(normalized)) {
    return normalized;
  }
  if (language === "css") {
    return beautifyCss(normalized);
  }
  if (language === "javascript" || language === "php") {
    return beautifyBraces(normalized);
  }
  return beautifyHtml(normalized);
}
