export type NoteSummary = {
  id: string;
  title: string;
  icon: string | null;
  editedAt: string;
  url: string;
  parent?: string;
};

export type RichSpan = {
  text: string;
  href?: string;
  bold?: boolean;
  italic?: boolean;
  code?: boolean;
  strike?: boolean;
  underline?: boolean;
};

export type NoteBlock = {
  id: string;
  type: string;
  text: RichSpan[];
  checked?: boolean;
  language?: string;
  url?: string;
  caption?: string;
  cells?: RichSpan[][];
  children?: NoteBlock[];
};

export type NoteDetail = NoteSummary & {
  blocks: NoteBlock[];
};

const NOTION_VERSION = "2022-06-28";

function token(): string {
  const value = import.meta.env.NOTION_TOKEN;
  if (!value) {
    throw new Error("Add NOTION_TOKEN to .env.local, then restart the dev server.");
  }
  return value;
}

function isNotionId(id: string): boolean {
  return /^[0-9a-f]{32}$/i.test(id.replace(/-/g, ""));
}

async function notionFetch(path: string, init?: RequestInit, attempt = 0): Promise<unknown> {
  const response = await fetch(`https://api.notion.com/v1${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token()}`,
      "Notion-Version": NOTION_VERSION,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (response.status === 429 && attempt < 2) {
    const wait = Math.min(Number(response.headers.get("retry-after") ?? "1") * 1000, 4000);
    await new Promise((resolve) => setTimeout(resolve, Number.isFinite(wait) ? wait : 1000));
    return notionFetch(path, init, attempt + 1);
  }

  const body: unknown = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message =
      body && typeof body === "object" && "message" in body && typeof body.message === "string"
        ? body.message
        : `Notion request failed (${response.status}).`;
    throw new Error(message);
  }
  return body;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function richSpans(value: unknown): RichSpan[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.flatMap((item) => {
    const record = asRecord(item);
    if (!record || typeof record.plain_text !== "string" || !record.plain_text) {
      return [];
    }
    const annotations = asRecord(record.annotations);
    const span: RichSpan = { text: record.plain_text };
    if (typeof record.href === "string") {
      span.href = record.href;
    }
    if (annotations?.bold === true) span.bold = true;
    if (annotations?.italic === true) span.italic = true;
    if (annotations?.code === true) span.code = true;
    if (annotations?.strikethrough === true) span.strike = true;
    if (annotations?.underline === true) span.underline = true;
    return [span];
  });
}

function pageTitle(page: Record<string, unknown>): string {
  const properties = asRecord(page.properties);
  if (!properties) {
    return "Untitled";
  }
  for (const value of Object.values(properties)) {
    const property = asRecord(value);
    if (property?.type === "title") {
      const text = richSpans(property.title)
        .map((span) => span.text)
        .join("")
        .trim();
      return text || "Untitled";
    }
  }
  return "Untitled";
}

function pageIcon(page: Record<string, unknown>): string | null {
  const icon = asRecord(page.icon);
  return icon?.type === "emoji" && typeof icon.emoji === "string" ? icon.emoji : null;
}

function toSummary(page: Record<string, unknown>): NoteSummary | null {
  if (typeof page.id !== "string" || page.archived === true || page.in_trash === true) {
    return null;
  }
  return {
    id: page.id,
    title: pageTitle(page),
    icon: pageIcon(page),
    editedAt: typeof page.last_edited_time === "string" ? page.last_edited_time : new Date().toISOString(),
    url: typeof page.url === "string" ? page.url : `https://www.notion.so/${page.id.replace(/-/g, "")}`,
  };
}

let notesCache: { at: number; notes: NoteSummary[] } | null = null;

export async function listNotes(): Promise<NoteSummary[]> {
  if (notesCache && Date.now() - notesCache.at < 45_000) {
    return notesCache.notes;
  }
  const notes: NoteSummary[] = [];
  let cursor: string | undefined;

  do {
    const body = asRecord(
      await notionFetch("/search", {
        method: "POST",
        body: JSON.stringify({
          filter: { property: "object", value: "page" },
          sort: { direction: "descending", timestamp: "last_edited_time" },
          page_size: 100,
          ...(cursor ? { start_cursor: cursor } : {}),
        }),
      }),
    );
    const results = Array.isArray(body?.results) ? body.results : [];
    for (const result of results) {
      const page = asRecord(result);
      if (!page || page.object !== "page") {
        continue;
      }
      const summary = toSummary(page);
      if (summary) {
        notes.push(summary);
      }
    }
    cursor = body?.has_more === true && typeof body.next_cursor === "string" ? body.next_cursor : undefined;
  } while (cursor && notes.length < 400);

  await includeChildPages(notes);
  notes.sort((left, right) => {
    if (left.editedAt && right.editedAt) {
      return right.editedAt.localeCompare(left.editedAt);
    }
    if (left.editedAt) {
      return -1;
    }
    if (right.editedAt) {
      return 1;
    }
    return left.title.localeCompare(right.title);
  });
  notesCache = { at: Date.now(), notes };
  return notes;
}

type ChildRef = { id: string; title: string; editedAt: string };

async function childPages(blockId: string, depth = 0): Promise<ChildRef[]> {
  if (depth > 6) {
    return [];
  }
  const refs: ChildRef[] = [];
  let cursor: string | undefined;

  do {
    const params = new URLSearchParams({ page_size: "100" });
    if (cursor) {
      params.set("start_cursor", cursor);
    }
    const body = asRecord(await notionFetch(`/blocks/${blockId}/children?${params.toString()}`));
    const results = Array.isArray(body?.results) ? body.results : [];
    for (const result of results) {
      const block = asRecord(result);
      if (!block || typeof block.id !== "string") {
        continue;
      }
      if (block.type === "child_page") {
        const data = asRecord(block.child_page);
        const title = typeof data?.title === "string" ? data.title.trim() : "";
        refs.push({
          id: block.id,
          title: title || "Untitled",
          editedAt: typeof block.last_edited_time === "string" ? block.last_edited_time : "",
        });
        continue;
      }
      const holdsPages =
        block.type === "column_list" ||
        block.type === "column" ||
        block.type === "synced_block" ||
        block.type === "toggle";
      if (block.has_children === true && holdsPages) {
        refs.push(...(await childPages(block.id, depth + 1)));
      }
    }
    cursor = body?.has_more === true && typeof body.next_cursor === "string" ? body.next_cursor : undefined;
  } while (cursor);

  return refs;
}

async function includeChildPages(notes: NoteSummary[]): Promise<void> {
  const seen = new Set(notes.map((note) => note.id));
  const queue = notes.map((note) => note);

  while (queue.length > 0 && notes.length < 400) {
    const parent = queue.shift();
    if (!parent) {
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, 200));
    const children = await childPages(parent.id);
    for (const child of children) {
      const existing = notes.find((note) => note.id === child.id);
      if (existing) {
        if (!existing.parent) {
          existing.parent = parent.title;
        }
        continue;
      }
      if (seen.has(child.id)) {
        continue;
      }
      seen.add(child.id);
      const summary: NoteSummary = {
        id: child.id,
        title: child.title,
        icon: null,
        editedAt: child.editedAt,
        url: `https://www.notion.so/${child.id.replace(/-/g, "")}`,
        parent: parent.title,
      };
      notes.push(summary);
      queue.push(summary);
    }
  }
}

function mapBlock(raw: Record<string, unknown>): NoteBlock | null {
  if (typeof raw.id !== "string" || typeof raw.type !== "string") {
    return null;
  }
  const data = asRecord(raw[raw.type]) ?? {};
  const block: NoteBlock = {
    id: raw.id,
    type: raw.type,
    text: richSpans(data.rich_text ?? data.title),
  };
  if (typeof data.checked === "boolean") {
    block.checked = data.checked;
  }
  if (typeof data.language === "string") {
    block.language = data.language;
  }
  const file = asRecord(data.file) ?? asRecord(data.external);
  if (typeof file?.url === "string") {
    block.url = file.url;
  } else if (typeof data.url === "string") {
    block.url = data.url;
  }
  const caption = richSpans(data.caption)
    .map((span) => span.text)
    .join("")
    .trim();
  if (caption) {
    block.caption = caption;
  }
  if (raw.type === "child_page" && typeof data.title === "string") {
    block.text = [{ text: data.title || "Untitled" }];
  }
  if (raw.type === "child_database" && typeof data.title === "string") {
    block.text = [{ text: data.title || "Database" }];
  }
  if (Array.isArray(data.cells)) {
    block.cells = data.cells.map((cell) => richSpans(cell));
  }
  return block;
}

async function loadBlocks(id: string, depth: number): Promise<NoteBlock[]> {
  if (depth > 4) {
    return [];
  }
  const blocks: NoteBlock[] = [];
  let cursor: string | undefined;

  do {
    const params = new URLSearchParams({ page_size: "100" });
    if (cursor) {
      params.set("start_cursor", cursor);
    }
    const body = asRecord(await notionFetch(`/blocks/${id}/children?${params.toString()}`));
    const results = Array.isArray(body?.results) ? body.results : [];
    for (const result of results) {
      const raw = asRecord(result);
      if (!raw) {
        continue;
      }
      const block = mapBlock(raw);
      if (!block) {
        continue;
      }
      if (raw.has_children === true && block.type !== "child_page" && block.type !== "child_database") {
        block.children = await loadBlocks(block.id, depth + 1);
      }
      blocks.push(block);
    }
    cursor = body?.has_more === true && typeof body.next_cursor === "string" ? body.next_cursor : undefined;
  } while (cursor);

  return blocks;
}

export async function getNote(id: string): Promise<NoteDetail> {
  if (!isNotionId(id)) {
    throw new Error("That note could not be found.");
  }
  const page = asRecord(await notionFetch(`/pages/${id}`));
  if (!page) {
    throw new Error("That note could not be found.");
  }
  const summary = toSummary(page);
  if (!summary) {
    throw new Error("That note is in the trash.");
  }
  return {
    ...summary,
    blocks: await loadBlocks(id, 0),
  };
}
