import { getStorageItem, setStorageItem, STORAGE_KEYS } from "@/lib/storage";
import { BACKUP_LANGUAGES, type BackupLanguage } from "./language";

export type BackupSnippet = {
  id: string;
  language: BackupLanguage;
  code: string;
  /** Custom tab name. Built-in HTML, CSS, JS, and PHP tabs leave this empty. */
  label?: string;
};

export type BackupEntry = {
  id: string;
  title: string;
  snippets: BackupSnippet[];
  updatedAt: number;
};

function isLanguage(value: unknown): value is BackupLanguage {
  return BACKUP_LANGUAGES.includes(value as BackupLanguage);
}

function normalizeSnippet(value: unknown): BackupSnippet | null {
  if (!value || typeof value !== "object") {
    return null;
  }
  const snippet = value as Partial<BackupSnippet>;
  if (typeof snippet.id !== "string" || typeof snippet.code !== "string" || !isLanguage(snippet.language)) {
    return null;
  }
  const label = typeof snippet.label === "string" ? snippet.label.trim() : "";
  return {
    id: snippet.id,
    language: snippet.language,
    code: snippet.code,
    ...(label ? { label } : {}),
  };
}

function normalizeEntry(value: unknown): BackupEntry | null {
  if (!value || typeof value !== "object") {
    return null;
  }
  const entry = value as Partial<BackupEntry>;
  if (typeof entry.id !== "string" || typeof entry.title !== "string") {
    return null;
  }
  const snippets = Array.isArray(entry.snippets)
    ? entry.snippets.map(normalizeSnippet).filter((snippet): snippet is BackupSnippet => snippet !== null)
    : [];
  if (!entry.title.trim() || snippets.length === 0) {
    return null;
  }
  return {
    id: entry.id,
    title: entry.title,
    snippets,
    updatedAt: typeof entry.updatedAt === "number" ? entry.updatedAt : Date.now(),
  };
}

export function loadBackups(): BackupEntry[] {
  const raw = getStorageItem<unknown>(STORAGE_KEYS.codeBackups, []);
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw
    .map(normalizeEntry)
    .filter((entry): entry is BackupEntry => entry !== null)
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

export function saveBackups(entries: BackupEntry[]): boolean {
  return setStorageItem(STORAGE_KEYS.codeBackups, entries);
}
