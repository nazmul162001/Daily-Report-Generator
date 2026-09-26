import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CodeEditor, CodeFrame } from "@/features/backup/components/CodeView";
import {
  BACKUP_LANGUAGES,
  detectLanguage,
  formatCode,
  LANGUAGE_SHORT,
  type BackupLanguage,
} from "@/features/backup/language";
import { loadBackups, saveBackups, type BackupEntry, type BackupSnippet } from "@/features/backup/storage";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { ConfirmDialog, Modal } from "@/components/ui/Modal";
import { copyToClipboard } from "@/lib/clipboard";
import { createId, cn } from "@/lib/utils";

type DraftSnippet = BackupSnippet;

const modalPanel =
  "flex !h-[90dvh] w-full max-w-none flex-col overflow-hidden p-4 sm:p-6 md:!w-[80vw]";

const DAYS_PER_PAGE = 3;

function dayKey(timestamp: number): string {
  const date = new Date(timestamp);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function dayLabel(key: string): string {
  const [year, month, day] = key.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  const today = new Date();
  const startToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const diff = Math.round((startToday - date.getTime()) / 86_400_000);
  const formatted = date.toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  if (diff === 0) {
    return `Today · ${formatted}`;
  }
  if (diff === 1) {
    return `Yesterday · ${formatted}`;
  }
  return formatted;
}

function groupByDay(entries: BackupEntry[]): { key: string; label: string; entries: BackupEntry[] }[] {
  const groups = new Map<string, BackupEntry[]>();
  for (const entry of entries) {
    const key = dayKey(entry.updatedAt);
    const list = groups.get(key) ?? [];
    list.push(entry);
    groups.set(key, list);
  }
  return [...groups.entries()]
    .sort(([left], [right]) => right.localeCompare(left))
    .map(([key, items]) => ({
      key,
      label: dayLabel(key),
      entries: [...items].sort((left, right) => right.updatedAt - left.updatedAt),
    }));
}

function pageWindow(current: number, count: number): (number | "gap")[] {
  if (count <= 7) {
    return Array.from({ length: count }, (_, index) => index);
  }
  const pages = [0, count - 1, current - 1, current, current + 1].filter(
    (page, index, list) => page >= 0 && page < count && list.indexOf(page) === index,
  );
  pages.sort((left, right) => left - right);
  const window: (number | "gap")[] = [];
  pages.forEach((page, index) => {
    if (index > 0 && page - pages[index - 1] > 1) {
      window.push("gap");
    }
    window.push(page);
  });
  return window;
}

function tabLabel(snippet: Pick<DraftSnippet, "language" | "label">): string {
  return snippet.label?.trim() || LANGUAGE_SHORT[snippet.language];
}

function builtinDrafts(): DraftSnippet[] {
  return BACKUP_LANGUAGES.map((language) => ({
    id: createId("snippet"),
    language,
    code: "",
  }));
}

function editorDrafts(existing: BackupSnippet[]): DraftSnippet[] {
  const claimed = new Set<string>();
  const builtins = BACKUP_LANGUAGES.map((language) => {
    const match = existing.find(
      (snippet) => snippet.language === language && !snippet.label && !claimed.has(snippet.id),
    );
    if (!match) {
      return { id: createId("snippet"), language, code: "" };
    }
    claimed.add(match.id);
    return { ...match };
  });
  const extras = existing
    .filter((snippet) => !claimed.has(snippet.id))
    .map((snippet, index) => ({
      ...snippet,
      label: snippet.label?.trim() || `${LANGUAGE_SHORT[snippet.language]} ${index + 2}`,
    }));
  return [...builtins, ...extras];
}

function pastedInto(snippet: DraftSnippet, raw: string): Pick<DraftSnippet, "language" | "code"> {
  if (snippet.label) {
    const language = detectLanguage(raw);
    return { language, code: formatCode(raw, language) };
  }
  return { language: snippet.language, code: formatCode(raw, snippet.language) };
}

function tabClass(selected: boolean): string {
  return cn(
    "cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
    selected ? "bg-primary text-on-primary shadow-sm" : "bg-background text-muted hover:bg-primary/10 hover:text-text",
  );
}

function ViewTabs({
  entry,
  activeId,
  editingId,
  inlineCode,
  inlineLanguage,
  copiedId,
  formError,
  onSelect,
  onEdit,
  onCopy,
  onCodeChange,
  onPaste,
  onCancelEdit,
  onSave,
}: {
  entry: BackupEntry;
  activeId: string | null;
  editingId: string | null;
  inlineCode: string;
  inlineLanguage: BackupLanguage;
  copiedId: string | null;
  formError: string | null;
  onSelect: (id: string) => void;
  onEdit: (snippet: BackupSnippet) => void;
  onCopy: (snippet: BackupSnippet) => void;
  onCodeChange: (code: string) => void;
  onPaste: (raw: string) => void;
  onCancelEdit: () => void;
  onSave: () => void;
}) {
  const active = entry.snippets.find((snippet) => snippet.id === activeId) ?? entry.snippets[0];
  if (!active) {
    return null;
  }
  const editing = editingId === active.id;
  const copied = copiedId === active.id;
  const name = tabLabel(active);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto pb-1" role="tablist" aria-label="Saved code">
          {entry.snippets.map((snippet) => (
            <button
              key={snippet.id}
              type="button"
              role="tab"
              aria-selected={snippet.id === active.id}
              onClick={() => onSelect(snippet.id)}
              className={cn(tabClass(snippet.id === active.id), "shrink-0")}
            >
              {tabLabel(snippet)}
            </button>
          ))}
        </div>
        <div className="flex shrink-0 justify-end gap-1">
          <button
            type="button"
            onClick={() => onEdit(active)}
            className="cursor-pointer rounded-lg px-2.5 py-1.5 text-xs font-semibold text-primary hover:bg-primary/10"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => onCopy(active)}
            aria-label={copied ? "Copied to clipboard" : `Copy ${name}`}
            className={cn(
              "relative cursor-pointer rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors",
              copied ? "bg-success/15 text-success" : "text-muted hover:bg-background hover:text-text",
            )}
          >
            <span key={copied ? "check" : "copy"} className="copy-icon-swap inline-flex">
              {copied ? "Copied" : "Copy"}
            </span>
            {copied ? <span className="copy-burst" aria-hidden /> : null}
          </button>
        </div>
      </div>
      {editing ? (
        <div className="flex flex-col gap-2">
          <CodeEditor
            code={inlineCode}
            language={inlineLanguage}
            label={name}
            onCodeChange={onCodeChange}
            onPasteCode={onPaste}
          />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={onCancelEdit}>
              Cancel
            </Button>
            <Button onClick={onSave}>Save</Button>
          </div>
        </div>
      ) : (
        <CodeFrame code={active.code} language={active.language} title={name} />
      )}
      {formError && editing ? <p className="text-sm text-danger">{formError}</p> : null}
    </div>
  );
}

function BackupDays({
  entries,
  pageIndex,
  onPageChange,
  onOpen,
  onDelete,
}: {
  entries: BackupEntry[];
  pageIndex: number;
  onPageChange: (page: number) => void;
  onOpen: (entry: BackupEntry) => void;
  onDelete: (id: string) => void;
}) {
  const groups = groupByDay(entries);
  const pageCount = Math.max(1, Math.ceil(groups.length / DAYS_PER_PAGE));
  const page = Math.min(pageIndex, pageCount - 1);
  const visible = groups.slice(page * DAYS_PER_PAGE, page * DAYS_PER_PAGE + DAYS_PER_PAGE);
  const pages = pageWindow(page, pageCount);

  return (
    <div className="flex flex-col gap-8">
      <div key={page} className="flex flex-col gap-8 animate-[fadeIn_0.35s_ease-out]">
        {visible.map((group) => (
          <section key={group.key} aria-labelledby={`backup-day-${group.key}`}>
            <div className="mb-3 flex items-center gap-3">
              <h2 id={`backup-day-${group.key}`} className="shrink-0 text-sm font-semibold text-text">
                {group.label}
              </h2>
              <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                {group.entries.length}
              </span>
              <span className="h-px min-w-8 flex-1 bg-border" aria-hidden />
            </div>
            <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {group.entries.map((entry) => (
                <li key={entry.id}>
                  <div className="flex h-full flex-col rounded-2xl border border-border bg-surface shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md [box-shadow:var(--c-shadow)]">
                    <button
                      type="button"
                      onClick={() => onOpen(entry)}
                      className="flex min-h-0 flex-1 cursor-pointer flex-col p-4 text-left"
                    >
                      <span className="truncate text-base font-semibold text-text">{entry.title}</span>
                      <span className="mt-3 flex flex-wrap gap-1.5">
                        {entry.snippets.map((snippet) => (
                          <span
                            key={snippet.id}
                            className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary"
                          >
                            {tabLabel(snippet)}
                          </span>
                        ))}
                      </span>
                      <span className="mt-4 text-xs text-muted">
                        {`${entry.snippets.length} code ${entry.snippets.length === 1 ? "block" : "blocks"} · ${new Date(entry.updatedAt).toLocaleTimeString(undefined, {
                          hour: "numeric",
                          minute: "2-digit",
                        })}`}
                      </span>
                    </button>
                    <div className="flex justify-end border-t border-border px-3 py-2">
                      <button
                        type="button"
                        onClick={() => onDelete(entry.id)}
                        className="cursor-pointer rounded-lg px-2.5 py-1 text-xs font-semibold text-danger transition-colors hover:bg-danger/10"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      {pageCount > 1 ? (
        <nav className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between" aria-label="Backup days">
          <p className="text-xs text-muted">
            {`Days ${page * DAYS_PER_PAGE + 1}–${page * DAYS_PER_PAGE + visible.length} of ${groups.length}`}
          </p>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onPageChange(page - 1)}
              disabled={page === 0}
              className="cursor-pointer rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-text transition-colors hover:bg-background disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>
            <div className="flex items-center gap-1">
              {pages.map((item, index) =>
                item === "gap" ? (
                  <span key={`gap-${index}`} className="px-1 text-xs text-muted">
                    …
                  </span>
                ) : (
                  <button
                    key={item}
                    type="button"
                    aria-current={item === page ? "page" : undefined}
                    onClick={() => onPageChange(item)}
                    className={cn(
                      "inline-flex h-9 min-w-9 cursor-pointer items-center justify-center rounded-xl px-2 text-xs font-semibold transition-colors",
                      item === page
                        ? "bg-primary text-on-primary shadow-sm"
                        : "border border-border bg-surface text-text hover:bg-background",
                    )}
                  >
                    {item + 1}
                  </button>
                ),
              )}
            </div>
            <button
              type="button"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= pageCount - 1}
              className="cursor-pointer rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-text transition-colors hover:bg-background disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </nav>
      ) : null}
    </div>
  );
}

export function BackupPage() {
  const titleId = useId();
  const nameInputId = useId();
  const [ready, setReady] = useState(false);
  const [entries, setEntries] = useState<BackupEntry[]>([]);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [snippets, setSnippets] = useState<DraftSnippet[]>(() => builtinDrafts());
  const [activeId, setActiveId] = useState<string | null>(null);
  const [nameOpen, setNameOpen] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [viewId, setViewId] = useState<string | null>(null);
  const [openSnippetId, setOpenSnippetId] = useState<string | null>(null);
  const [inlineEditId, setInlineEditId] = useState<string | null>(null);
  const [inlineCode, setInlineCode] = useState("");
  const [inlineLanguage, setInlineLanguage] = useState<BackupLanguage>("html");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const copyTimer = useRef<number | null>(null);
  const nameOpenRef = useRef(false);

  const viewing = entries.find((entry) => entry.id === viewId) ?? null;
  const activeSnippet = snippets.find((snippet) => snippet.id === activeId) ?? snippets[0] ?? null;
  nameOpenRef.current = nameOpen;

  useEffect(() => {
    setEntries(loadBackups());
    setReady(true);
    return () => {
      if (copyTimer.current) {
        window.clearTimeout(copyTimer.current);
      }
    };
  }, []);

  function persist(next: BackupEntry[]) {
    const saved = saveBackups(next);
    if (!saved) {
      setFormError("Could not save. Browser storage is full.");
      return false;
    }
    setEntries(next);
    setFormError(null);
    return true;
  }

  useEffect(() => {
    if (!nameOpen) {
      return;
    }
    const frame = window.requestAnimationFrame(() => {
      document.getElementById(nameInputId)?.focus();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [nameOpen, nameInputId]);

  function closeNamePopup() {
    setNameOpen(false);
    setNameDraft("");
    setNameError(null);
  }

  function closeEditor() {
    if (nameOpenRef.current) {
      closeNamePopup();
      return;
    }
    setEditorOpen(false);
  }

  function openCreate() {
    const drafts = builtinDrafts();
    setEditingId(null);
    setTitle("");
    setSnippets(drafts);
    setActiveId(drafts[0]?.id ?? null);
    setFormError(null);
    closeNamePopup();
    setEditorOpen(true);
  }

  function openEdit(entry: BackupEntry) {
    const drafts = editorDrafts(entry.snippets);
    setEditingId(entry.id);
    setTitle(entry.title);
    setSnippets(drafts);
    setActiveId(drafts.find((snippet) => snippet.code.trim())?.id ?? drafts[0]?.id ?? null);
    setFormError(null);
    setInlineEditId(null);
    closeNamePopup();
    setEditorOpen(true);
  }

  function openView(entry: BackupEntry) {
    setViewId(entry.id);
    setOpenSnippetId(entry.snippets[0]?.id ?? null);
    setInlineEditId(null);
  }

  function updateSnippet(id: string, patch: Partial<DraftSnippet>) {
    setSnippets((current) => current.map((snippet) => (snippet.id === id ? { ...snippet, ...patch } : snippet)));
  }

  function saveCustomTab() {
    const nextName = nameDraft.trim();
    if (!nextName) {
      setNameError("Enter a name for this code.");
      return;
    }
    const taken = snippets.some((snippet) => tabLabel(snippet).toLowerCase() === nextName.toLowerCase());
    if (taken) {
      setNameError("That name is already a tab.");
      return;
    }
    const snippet: DraftSnippet = {
      id: createId("snippet"),
      language: "javascript",
      code: "",
      label: nextName,
    };
    setSnippets((current) => [...current, snippet]);
    setActiveId(snippet.id);
    closeNamePopup();
  }

  function removeCustomTab(id: string) {
    setSnippets((current) => current.filter((snippet) => snippet.id !== id));
    if (activeId === id) {
      setActiveId(snippets.find((snippet) => snippet.id !== id)?.id ?? null);
    }
  }

  function saveEditor() {
    const nextTitle = title.trim();
    const nextSnippets = snippets
      .map((snippet) => ({ ...snippet, code: snippet.code.replace(/\s+$/g, "") }))
      .filter((snippet) => snippet.code.trim());
    if (!nextTitle) {
      setFormError("Add a project title, like Test-1.");
      return;
    }
    if (nextSnippets.length === 0) {
      setFormError("Paste at least one code block.");
      return;
    }
    const entry: BackupEntry = {
      id: editingId ?? createId("backup"),
      title: nextTitle,
      snippets: nextSnippets,
      updatedAt: Date.now(),
    };
    const next = editingId
      ? entries.map((item) => (item.id === editingId ? entry : item))
      : [entry, ...entries];
    next.sort((a, b) => b.updatedAt - a.updatedAt);
    if (persist(next)) {
      setPageIndex(0);
      setEditorOpen(false);
    }
  }

  async function copySnippet(snippet: BackupSnippet) {
    const result = await copyToClipboard(snippet.code);
    if (!result.success) {
      return;
    }
    setCopiedId(snippet.id);
    if (copyTimer.current) {
      window.clearTimeout(copyTimer.current);
    }
    copyTimer.current = window.setTimeout(() => setCopiedId(null), 1800);
  }

  function saveInline(entry: BackupEntry) {
    if (!inlineEditId) {
      return;
    }
    const code = inlineCode.replace(/\s+$/g, "");
    if (!code.trim()) {
      setFormError("Code cannot be empty.");
      return;
    }
    const next = entries.map((item) =>
      item.id === entry.id
        ? {
            ...item,
            updatedAt: Date.now(),
            snippets: item.snippets.map((snippet) =>
              snippet.id === inlineEditId ? { ...snippet, code, language: inlineLanguage } : snippet,
            ),
          }
        : item,
    );
    if (persist(next)) {
      setPageIndex(0);
      setInlineEditId(null);
    }
  }

  function removeEntry(id: string) {
    const next = entries.filter((entry) => entry.id !== id);
    if (persist(next)) {
      if (viewId === id) {
        setViewId(null);
      }
      setDeleteId(null);
    }
  }

  return (
    <div className="mx-auto w-full min-w-0 max-w-6xl">
      <div className="mb-5 flex items-start justify-between gap-3 sm:mb-6">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight text-text sm:text-2xl">Backup</h1>
          <p className="mt-1 max-w-xl text-sm text-muted">
            Keep HTML, CSS, JavaScript, and PHP for a project under one title.
          </p>
        </div>
        <Button className="shrink-0" onClick={openCreate}>
          Add Backup
        </Button>
      </div>

      {formError && !editorOpen && !inlineEditId ? (
        <p className="mb-3 text-sm text-danger">{formError}</p>
      ) : null}

      {!ready ? null : entries.length === 0 ? (
        <Card className="px-6 py-14 text-center">
          <p className="text-base font-semibold text-text">No backups yet</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">
            Add a project title, paste your code, and keep HTML, CSS, JavaScript, and PHP together.
          </p>
        </Card>
      ) : (
        <BackupDays
          entries={entries}
          pageIndex={pageIndex}
          onPageChange={setPageIndex}
          onOpen={openView}
          onDelete={setDeleteId}
        />
      )}

      <Modal
        open={editorOpen}
        title={editingId ? "Edit backup" : "Add backup"}
        onClose={closeEditor}
        panelClassName={modalPanel}
        bodyClassName="flex min-h-0 flex-1 flex-col overflow-hidden"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditorOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveEditor}>{editingId ? "Save changes" : "Save backup"}</Button>
          </>
        }
      >
        <div className="flex min-h-0 flex-1 flex-col gap-4 text-text">
          <Input
            id={titleId}
            label="Project title"
            value={title}
            placeholder="Test-1"
            autoComplete="off"
            onChange={(event) => setTitle(event.target.value)}
          />
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1" role="tablist" aria-label="Code blocks">
            {snippets.map((snippet) => {
              const selected = snippet.id === activeSnippet?.id;
              const name = tabLabel(snippet);
              return (
                <div
                  key={snippet.id}
                  className={cn(
                    "flex shrink-0 items-stretch overflow-hidden rounded-lg transition-colors",
                    selected ? "bg-primary text-on-primary shadow-sm" : "bg-background text-muted",
                  )}
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    onClick={() => setActiveId(snippet.id)}
                    className={cn(
                      "cursor-pointer px-3 py-1.5 text-xs font-semibold",
                      !selected && "hover:text-text",
                    )}
                  >
                    {name}
                  </button>
                  {snippet.label ? (
                    <button
                      type="button"
                      aria-label={`Remove ${name}`}
                      onClick={() => removeCustomTab(snippet.id)}
                      className={cn(
                        "cursor-pointer px-1.5 text-xs font-semibold",
                        selected ? "hover:bg-primary-hover" : "hover:bg-danger/10 hover:text-danger",
                      )}
                    >
                      ×
                    </button>
                  ) : null}
                </div>
              );
            })}
            <button
              type="button"
              onClick={() => {
                setNameDraft("");
                setNameError(null);
                setNameOpen(true);
              }}
              className="ml-1 shrink-0 cursor-pointer rounded-lg border border-dashed border-primary/50 px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/10"
            >
              + Add More
            </button>
          </div>
          {activeSnippet ? (
            <div className="min-h-0 flex-1">
              <CodeEditor
                fill
                code={activeSnippet.code}
                language={activeSnippet.language}
                label={tabLabel(activeSnippet)}
                onCodeChange={(code) => updateSnippet(activeSnippet.id, { code })}
                onPasteCode={(raw) => updateSnippet(activeSnippet.id, pastedInto(activeSnippet, raw))}
              />
            </div>
          ) : null}
          {formError ? <p className="text-sm text-danger">{formError}</p> : null}
        </div>
      </Modal>

      <Modal
        open={viewing !== null}
        title={viewing?.title ?? "Backup"}
        onClose={() => {
          setViewId(null);
          setInlineEditId(null);
        }}
        panelClassName={modalPanel}
        bodyClassName="min-h-0 flex-1 overflow-y-auto pr-1"
        footer={
          viewing ? (
            <>
              <Button variant="danger" onClick={() => setDeleteId(viewing.id)}>
                Delete
              </Button>
              <Button variant="secondary" onClick={() => openEdit(viewing)}>
                Edit all
              </Button>
            </>
          ) : null
        }
      >
        {viewing ? (
          <ViewTabs
            entry={viewing}
            activeId={openSnippetId}
            editingId={inlineEditId}
            inlineCode={inlineCode}
            inlineLanguage={inlineLanguage}
            copiedId={copiedId}
            formError={formError}
            onSelect={(id) => {
              setOpenSnippetId(id);
              setInlineEditId(null);
            }}
            onEdit={(snippet) => {
              setOpenSnippetId(snippet.id);
              setInlineEditId(snippet.id);
              setInlineCode(snippet.code);
              setInlineLanguage(snippet.language);
              setFormError(null);
            }}
            onCopy={copySnippet}
            onCodeChange={setInlineCode}
            onPaste={(raw) => {
              const language = inlineLanguage;
              const snippet = viewing.snippets.find((item) => item.id === inlineEditId);
              if (snippet?.label) {
                const next = pastedInto(snippet, raw);
                setInlineLanguage(next.language);
                setInlineCode(next.code);
                return;
              }
              setInlineCode(formatCode(raw, language));
            }}
            onCancelEdit={() => setInlineEditId(null)}
            onSave={() => saveInline(viewing)}
          />
        ) : null}
      </Modal>

      {nameOpen && typeof document !== "undefined"
        ? createPortal(
            <div className="fixed inset-0 z-[220] flex items-center justify-center p-4">
              <button
                type="button"
                className="absolute inset-0 cursor-default bg-scrim/45"
                aria-label="Close"
                onClick={closeNamePopup}
              />
              <form
                className="relative w-full max-w-sm animate-[modalIn_200ms_cubic-bezier(0.22,1,0.36,1)] rounded-2xl border border-border bg-surface p-5 shadow-2xl"
                onSubmit={(event) => {
                  event.preventDefault();
                  saveCustomTab();
                }}
              >
                <h2 className="text-base font-semibold text-text">Add more</h2>
                <p className="mt-1 text-sm text-muted">Name this code, then paste it in the box.</p>
                <div className="mt-4">
                  <Input
                    id={nameInputId}
                    label="Name"
                    value={nameDraft}
                    placeholder="API helper"
                    autoComplete="off"
                    error={nameError ?? undefined}
                    onChange={(event) => {
                      setNameDraft(event.target.value);
                      setNameError(null);
                    }}
                  />
                </div>
                <div className="mt-5 flex justify-end gap-2">
                  <Button variant="secondary" onClick={closeNamePopup}>
                    Cancel
                  </Button>
                  <Button type="submit">Save</Button>
                </div>
              </form>
            </div>,
            document.body,
          )
        : null}

      <ConfirmDialog
        open={deleteId !== null}
        title="Delete this backup?"
        description="This removes the project and every code block saved under it."
        confirmLabel="Delete"
        onCancel={() => setDeleteId(null)}
        onConfirm={() => {
          if (deleteId) {
            removeEntry(deleteId);
          }
        }}
      />
    </div>
  );
}
