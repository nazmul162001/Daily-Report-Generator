import { useEffect, useState } from "react";
import { readFreshNoteList, readStoredNoteList, saveNoteList } from "@/features/notes/cache";
import type { NoteSummary } from "@/features/notes/notion";
import { Card } from "@/components/ui/Card";

function formatEdited(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function withoutFolders(notes: NoteSummary[]): NoteSummary[] {
  const parentTitles = new Set(
    notes.flatMap((note) => (note.parent?.trim() ? [note.parent.trim().toLowerCase()] : [])),
  );
  return notes.filter((note) => !( !note.parent && parentTitles.has(note.title.trim().toLowerCase())));
}

const LOADING_LINES = [
  "Collecting your Notion pages",
  "Opening notes inside each folder",
  "Saving them in this browser for today",
];

function NotesLoading() {
  const [line, setLine] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setLine((current) => (current + 1) % LOADING_LINES.length);
    }, 2200);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div role="status" aria-live="polite">
      <div className="note-rise mb-5 flex items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-4 shadow-sm [box-shadow:var(--c-shadow)]">
        <span
          className="note-spin h-9 w-9 shrink-0 rounded-full border-[3px] border-primary/20 border-t-primary"
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-text">Loading your notes</p>
          <p key={line} className="note-rise mt-0.5 text-xs text-muted">
            {LOADING_LINES[line]}
          </p>
        </div>
        <span className="flex shrink-0 items-center gap-1.5" aria-hidden>
          {LOADING_LINES.map((_, index) => (
            <span
              key={index}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                index === line ? "w-5 bg-primary" : "w-1.5 bg-primary/25"
              }`}
            />
          ))}
        </span>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <li
            key={index}
            className="note-rise h-28 overflow-hidden rounded-2xl border border-border bg-surface p-4"
            style={{ animationDelay: `${120 + index * 70}ms` }}
            aria-hidden
          >
            <div className="note-shimmer h-5 w-4/5 rounded-md bg-border/80" />
            <div className="note-shimmer mt-3 h-5 w-3/5 rounded-md bg-border/70" />
            <div className="note-shimmer mt-5 h-3 w-24 rounded-md bg-border/60" />
          </li>
        ))}
      </ul>
    </div>
  );
}

function NoteGrid({ notes, query }: { notes: NoteSummary[]; query: string }) {
  const term = query.trim().toLowerCase();
  const visible = term ? notes.filter((note) => note.title.toLowerCase().includes(term)) : notes;

  if (visible.length === 0) {
    return (
      <Card className="note-rise px-6 py-14 text-center">
        <p className="text-base font-semibold text-text">No matching notes</p>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted">Try a different title.</p>
      </Card>
    );
  }

  return (
    <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {visible.map((note, index) => {
        const edited = formatEdited(note.editedAt);
        return (
          <li
            key={note.id}
            className="note-rise"
            style={{ animationDelay: `${Math.min(index, 16) * 42}ms` }}
          >
            <a
              href={`/notes/read?id=${encodeURIComponent(note.id)}`}
              className="group flex h-full flex-col rounded-2xl border border-border bg-surface p-4 shadow-sm transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md [box-shadow:var(--c-shadow)]"
            >
              <span className="line-clamp-3 text-lg font-semibold leading-snug tracking-tight text-text transition-colors duration-300 group-hover:text-primary">
                {note.title}
              </span>
              {edited ? <span className="mt-3 text-xs text-muted">{edited}</span> : null}
            </a>
          </li>
        );
      })}
    </ul>
  );
}

export function NotesPage() {
  const [notes, setNotes] = useState<NoteSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [headerOffset, setHeaderOffset] = useState(64);
  const listed = notes ? withoutFolders(notes) : null;

  useEffect(() => {
    const fresh = readFreshNoteList();
    if (fresh) {
      setNotes(fresh);
      return;
    }

    const stored = readStoredNoteList();
    if (stored) {
      setNotes(stored);
    }

    let active = true;
    fetch("/api/notion")
      .then(async (response) => {
        const body = (await response.json()) as NoteSummary[] | { error?: string };
        if (!response.ok) {
          throw new Error("error" in body && body.error ? body.error : "Could not load notes.");
        }
        return body as NoteSummary[];
      })
      .then((next) => {
        if (!active) {
          return;
        }
        saveNoteList(next);
        setNotes(next);
        setError(null);
      })
      .catch((reason: unknown) => {
        if (active && !stored) {
          setError(reason instanceof Error ? reason.message : "Could not load notes.");
        }
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const header = document.getElementById("site-header");
    if (!header) {
      return;
    }
    const update = () => setHeaderOffset(header.getBoundingClientRect().height);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(header);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="mx-auto w-full min-w-0 max-w-6xl">
      <div className="mb-5 flex flex-col gap-4 sm:mb-6">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-text sm:text-2xl">Notes</h1>
          <p className="mt-1 max-w-xl text-sm text-muted">Pages from your Notion workspace. Open one to read it.</p>
        </div>
      </div>
      {listed && listed.length > 0 ? (
        <div
          className="sticky z-30 -mx-4 mb-4 border-b border-border bg-background/95 px-4 py-3 backdrop-blur-md sm:-mx-6 sm:px-6"
          style={{ top: headerOffset }}
        >
          <label className="mx-auto block max-w-6xl">
            <span className="sr-only">Search notes</span>
            <input
              type="search"
              value={query}
              placeholder="Search notes"
              autoComplete="off"
              onChange={(event) => setQuery(event.target.value)}
              className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-base text-text shadow-sm transition-colors placeholder:text-muted/70 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 sm:text-sm"
            />
          </label>
        </div>
      ) : null}

      {error ? (
        <Card className="px-6 py-10">
          <p className="text-base font-semibold text-text">Could not load Notion</p>
          <p className="mt-2 max-w-lg text-sm text-muted">{error}</p>
        </Card>
      ) : listed === null ? (
        <NotesLoading />
      ) : listed.length === 0 ? (
        <Card className="px-6 py-14 text-center">
          <p className="text-base font-semibold text-text">No notes yet</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">
            The connection can sign in, but it cannot see any pages yet. On the connection page, open Content access, choose Edit access, and add the top-level page that holds your notes. Pages inside it are included. Then reload.
          </p>
        </Card>
      ) : (
        <NoteGrid notes={listed} query={query} />
      )}
    </div>
  );
}
