import type { NoteDetail, NoteSummary } from "@/features/notes/notion";
import { getStorageItem, setStorageItem, STORAGE_KEYS } from "@/lib/storage";

type ListCache = {
  day: string;
  notes: NoteSummary[];
};

type BodyCache = {
  day: string;
  notes: Record<string, NoteDetail>;
};

export function localDay(date = new Date()): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function isSummary(value: unknown): value is NoteSummary {
  if (!value || typeof value !== "object") {
    return false;
  }
  const note = value as Partial<NoteSummary>;
  return typeof note.id === "string" && typeof note.title === "string";
}

function readListCache(): ListCache | null {
  const cached = getStorageItem<ListCache | null>(STORAGE_KEYS.notionNotes, null);
  if (!cached || typeof cached.day !== "string" || !Array.isArray(cached.notes)) {
    return null;
  }
  const notes = cached.notes.filter(isSummary);
  if (notes.length === 0) {
    return null;
  }
  return { day: cached.day, notes };
}

export function readFreshNoteList(): NoteSummary[] | null {
  const cached = readListCache();
  if (!cached || cached.day !== localDay()) {
    return null;
  }
  return cached.notes;
}

export function readStoredNoteList(): NoteSummary[] | null {
  return readListCache()?.notes ?? null;
}

export function saveNoteList(notes: NoteSummary[]): void {
  const day = localDay();
  setStorageItem<ListCache>(STORAGE_KEYS.notionNotes, { day, notes });
  const bodies = getStorageItem<BodyCache | null>(STORAGE_KEYS.notionNoteBodies, null);
  if (!bodies || bodies.day !== day) {
    setStorageItem<BodyCache>(STORAGE_KEYS.notionNoteBodies, { day, notes: {} });
  }
}

function readBodyCache(): BodyCache {
  const day = localDay();
  const cached = getStorageItem<BodyCache | null>(STORAGE_KEYS.notionNoteBodies, null);
  if (!cached || cached.day !== day || !cached.notes || typeof cached.notes !== "object") {
    return { day, notes: {} };
  }
  return cached;
}

export function readFreshNoteBody(id: string): NoteDetail | null {
  const note = readBodyCache().notes[id];
  if (!note || note.id !== id || !Array.isArray(note.blocks)) {
    return null;
  }
  return note;
}

export function saveNoteBody(note: NoteDetail): void {
  const cached = readBodyCache();
  cached.notes[note.id] = note;
  setStorageItem<BodyCache>(STORAGE_KEYS.notionNoteBodies, cached);
}
