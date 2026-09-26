import type { BackupLanguage } from "./language";

export type TokenKind =
  | "plain"
  | "comment"
  | "string"
  | "keyword"
  | "number"
  | "tag"
  | "attr"
  | "function"
  | "variable"
  | "punctuation";

export type Token = {
  kind: TokenKind;
  text: string;
};

const JS_KEYWORDS = new Set([
  "const",
  "let",
  "var",
  "function",
  "return",
  "if",
  "else",
  "for",
  "while",
  "do",
  "switch",
  "case",
  "break",
  "continue",
  "new",
  "class",
  "extends",
  "import",
  "export",
  "from",
  "default",
  "async",
  "await",
  "try",
  "catch",
  "finally",
  "throw",
  "typeof",
  "instanceof",
  "of",
  "in",
  "this",
  "true",
  "false",
  "null",
  "undefined",
]);

const PHP_KEYWORDS = new Set([
  ...JS_KEYWORDS,
  "echo",
  "print",
  "public",
  "private",
  "protected",
  "static",
  "namespace",
  "use",
  "require",
  "include",
  "require_once",
  "include_once",
  "foreach",
  "elseif",
  "endif",
  "endforeach",
  "array",
  "as",
  "isset",
  "empty",
  "unset",
  "global",
  "trait",
  "interface",
  "implements",
  "abstract",
  "final",
  "fn",
]);

function push(tokens: Token[], kind: TokenKind, text: string) {
  if (text) {
    tokens.push({ kind, text });
  }
}

function tokenizeTag(tag: string): Token[] {
  const tokens: Token[] = [];
  let index = 0;
  if (tag.startsWith("</")) {
    push(tokens, "punctuation", "</");
    index = 2;
  } else if (tag.startsWith("<")) {
    push(tokens, "punctuation", "<");
    index = 1;
  }

  const name = /^[a-zA-Z][\w:-]*/.exec(tag.slice(index));
  if (name) {
    push(tokens, "tag", name[0]);
    index += name[0].length;
  }

  while (index < tag.length) {
    const char = tag[index] ?? "";
    if (/\s/.test(char)) {
      const start = index;
      while (index < tag.length && /\s/.test(tag[index] ?? "")) {
        index += 1;
      }
      push(tokens, "plain", tag.slice(start, index));
      continue;
    }
    if (tag.startsWith("/>", index)) {
      push(tokens, "punctuation", "/>");
      index += 2;
      continue;
    }
    if (char === ">") {
      push(tokens, "punctuation", ">");
      index += 1;
      continue;
    }
    const attr = /^[^\s=/>][^\s=/>]*/.exec(tag.slice(index));
    if (attr && char !== "=" && char !== '"' && char !== "'") {
      push(tokens, "attr", attr[0]);
      index += attr[0].length;
      continue;
    }
    if (char === "=") {
      push(tokens, "punctuation", "=");
      index += 1;
      continue;
    }
    if (char === '"' || char === "'") {
      let end = index + 1;
      while (end < tag.length && tag[end] !== char) {
        end += 1;
      }
      if (end < tag.length) {
        end += 1;
      }
      push(tokens, "string", tag.slice(index, end));
      index = end;
      continue;
    }
    push(tokens, "plain", char);
    index += 1;
  }
  return tokens;
}

function tokenizeHtml(source: string): Token[] {
  const tokens: Token[] = [];
  let index = 0;
  while (index < source.length) {
    if (source.startsWith("<!--", index)) {
      const end = source.indexOf("-->", index + 4);
      const next = end === -1 ? source.length : end + 3;
      push(tokens, "comment", source.slice(index, next));
      index = next;
      continue;
    }
    if (source[index] === "<") {
      const end = source.indexOf(">", index + 1);
      const next = end === -1 ? source.length : end + 1;
      tokens.push(...tokenizeTag(source.slice(index, next)));
      index = next;
      continue;
    }
    const nextTag = source.indexOf("<", index);
    const next = nextTag === -1 ? source.length : nextTag;
    push(tokens, "plain", source.slice(index, next));
    index = next;
  }
  return tokens;
}

function readQuoted(source: string, index: number): number {
  const quote = source[index];
  let cursor = index + 1;
  while (cursor < source.length) {
    if (source[cursor] === "\\") {
      cursor += 2;
      continue;
    }
    if (source[cursor] === quote) {
      return cursor + 1;
    }
    if (quote !== "`" && source[cursor] === "\n") {
      break;
    }
    cursor += 1;
  }
  return cursor;
}

function tokenizeScript(source: string, keywords: Set<string>, phpVars: boolean): Token[] {
  const tokens: Token[] = [];
  let index = 0;
  while (index < source.length) {
    if (source.startsWith("//", index) || source.startsWith("#", index)) {
      const end = source.indexOf("\n", index);
      const next = end === -1 ? source.length : end;
      push(tokens, "comment", source.slice(index, next));
      index = next;
      continue;
    }
    if (source.startsWith("/*", index)) {
      const end = source.indexOf("*/", index + 2);
      const next = end === -1 ? source.length : end + 2;
      push(tokens, "comment", source.slice(index, next));
      index = next;
      continue;
    }
    const char = source[index] ?? "";
    if (char === '"' || char === "'" || char === "`") {
      const next = readQuoted(source, index);
      push(tokens, "string", source.slice(index, next));
      index = next;
      continue;
    }
    if (/[0-9]/.test(char)) {
      const match = /^[0-9]+(?:\.[0-9]+)?/.exec(source.slice(index));
      const text = match?.[0] ?? char;
      push(tokens, "number", text);
      index += text.length;
      continue;
    }
    if (phpVars && char === "$") {
      const match = /^\$[A-Za-z_][\w]*/.exec(source.slice(index));
      const text = match?.[0] ?? "$";
      push(tokens, "variable", text);
      index += text.length;
      continue;
    }
    if (/[A-Za-z_]/.test(char)) {
      const match = /^[A-Za-z_][\w]*/.exec(source.slice(index));
      const word = match?.[0] ?? char;
      const rest = source.slice(index + word.length);
      const kind = keywords.has(word) ? "keyword" : /^\s*\(/.test(rest) ? "function" : "plain";
      push(tokens, kind, word);
      index += word.length;
      continue;
    }
    if ("{}()[];,.".includes(char)) {
      push(tokens, "punctuation", char);
      index += 1;
      continue;
    }
    push(tokens, "plain", char);
    index += 1;
  }
  return tokens;
}

function tokenizeCss(source: string): Token[] {
  const tokens: Token[] = [];
  let index = 0;
  while (index < source.length) {
    if (source.startsWith("/*", index)) {
      const end = source.indexOf("*/", index + 2);
      const next = end === -1 ? source.length : end + 2;
      push(tokens, "comment", source.slice(index, next));
      index = next;
      continue;
    }
    const char = source[index] ?? "";
    if (char === '"' || char === "'") {
      const next = readQuoted(source, index);
      push(tokens, "string", source.slice(index, next));
      index = next;
      continue;
    }
    if (char === "@") {
      const match = /^@[a-zA-Z-]+/.exec(source.slice(index));
      const text = match?.[0] ?? "@";
      push(tokens, "keyword", text);
      index += text.length;
      continue;
    }
    if (/[0-9]/.test(char)) {
      const match = /^[0-9]+(?:\.[0-9]+)?(?:px|em|rem|%|vh|vw|s|ms)?/.exec(source.slice(index));
      const text = match?.[0] ?? char;
      push(tokens, "number", text);
      index += text.length;
      continue;
    }
    if (/[.#]/.test(char)) {
      const match = /^[.#][A-Za-z_-][\w-]*/.exec(source.slice(index));
      if (match) {
        push(tokens, "variable", match[0]);
        index += match[0].length;
        continue;
      }
    }
    if (/[A-Za-z_-]/.test(char)) {
      const match = /^[A-Za-z_-][\w-]*/.exec(source.slice(index));
      const word = match?.[0] ?? char;
      const rest = source.slice(index + word.length);
      const isPseudo = /^:[a-z-]+/.test(rest);
      const isProperty = /^\s*:/.test(rest) && !isPseudo;
      const kind = word === "important" ? "keyword" : isProperty ? "attr" : "tag";
      push(tokens, kind, word);
      index += word.length;
      continue;
    }
    if ("{}();:,".includes(char)) {
      push(tokens, "punctuation", char);
      index += 1;
      continue;
    }
    push(tokens, "plain", char);
    index += 1;
  }
  return tokens;
}

function tokenizePhp(source: string): Token[] {
  const tokens: Token[] = [];
  let index = 0;
  while (index < source.length) {
    const match = /<\?(?:php|=)?/i.exec(source.slice(index));
    if (!match || match.index === undefined) {
      tokens.push(...tokenizeHtml(source.slice(index)));
      break;
    }
    if (match.index > 0) {
      tokens.push(...tokenizeHtml(source.slice(index, index + match.index)));
    }
    const start = index + match.index;
    const close = source.indexOf("?>", start + match[0].length);
    const end = close === -1 ? source.length : close + 2;
    const inner = source.slice(start, end);
    push(tokens, "keyword", match[0]);
    const bodyEnd = inner.endsWith("?>") ? inner.length - 2 : inner.length;
    tokens.push(...tokenizeScript(inner.slice(match[0].length, bodyEnd), PHP_KEYWORDS, true));
    if (inner.endsWith("?>")) {
      push(tokens, "keyword", "?>");
    }
    index = end;
  }
  return tokens;
}

export function tokenize(source: string, language: BackupLanguage): Token[] {
  if (!source) {
    return [];
  }
  if (language === "html") {
    return tokenizeHtml(source);
  }
  if (language === "css") {
    return tokenizeCss(source);
  }
  if (language === "php") {
    return tokenizePhp(source);
  }
  return tokenizeScript(source, JS_KEYWORDS, false);
}

export function tokenLines(source: string, language: BackupLanguage): Token[][] {
  const lines: Token[][] = [[]];
  for (const token of tokenize(source, language)) {
    const parts = token.text.split("\n");
    parts.forEach((part, index) => {
      if (index > 0) {
        lines.push([]);
      }
      if (part) {
        lines[lines.length - 1]?.push({ kind: token.kind, text: part });
      }
    });
  }
  if (source.endsWith("\n")) {
    lines.push([]);
  }
  return lines.length > 0 ? lines : [[]];
}
