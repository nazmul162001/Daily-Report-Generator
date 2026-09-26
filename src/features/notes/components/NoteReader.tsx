import { useEffect, useState, type ReactNode } from "react";
import { readFreshNoteBody, saveNoteBody } from "@/features/notes/cache";
import type { NoteBlock, NoteDetail, RichSpan } from "@/features/notes/notion";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

function RichText({ spans }: { spans: RichSpan[] }) {
  if (spans.length === 0) {
    return null;
  }
  return (
    <>
      {spans.map((span, index) => {
        let node: ReactNode = span.text;
        if (span.code) {
          node = <code className="rounded bg-background px-1 py-0.5 font-mono text-[0.9em]">{node}</code>;
        }
        if (span.bold) {
          node = <strong className="font-semibold">{node}</strong>;
        }
        if (span.italic) {
          node = <em>{node}</em>;
        }
        if (span.strike) {
          node = <s>{node}</s>;
        }
        if (span.underline) {
          node = <span className="underline">{node}</span>;
        }
        if (span.href) {
          node = (
            <a href={span.href} target="_blank" rel="noopener noreferrer" className="text-primary underline">
              {node}
            </a>
          );
        }
        return <span key={index}>{node}</span>;
      })}
    </>
  );
}

function Blocks({ blocks }: { blocks: NoteBlock[] }) {
  const nodes: ReactNode[] = [];
  for (let index = 0; index < blocks.length; index += 1) {
    const block = blocks[index];
    if (block.type === "bulleted_list_item" || block.type === "numbered_list_item") {
      const type = block.type;
      const items: NoteBlock[] = [];
      while (index < blocks.length && blocks[index].type === type) {
        items.push(blocks[index]);
        index += 1;
      }
      index -= 1;
      const List = type === "numbered_list_item" ? "ol" : "ul";
      nodes.push(
        <List
          key={items[0]?.id ?? index}
          className={cn("my-3 space-y-1 pl-5 text-text", type === "numbered_list_item" ? "list-decimal" : "list-disc")}
        >
          {items.map((item) => (
            <li key={item.id}>
              <RichText spans={item.text} />
              {item.children?.length ? <Blocks blocks={item.children} /> : null}
            </li>
          ))}
        </List>,
      );
      continue;
    }
    nodes.push(<BlockView key={block.id} block={block} />);
  }
  return <>{nodes}</>;
}

function BlockView({ block }: { block: NoteBlock }) {
  const children = block.children?.length ? <Blocks blocks={block.children} /> : null;

  if (block.type === "heading_1") {
    return <h2 className="mt-8 mb-3 text-2xl font-semibold tracking-tight text-text"><RichText spans={block.text} /></h2>;
  }
  if (block.type === "heading_2") {
    return <h3 className="mt-6 mb-2 text-xl font-semibold tracking-tight text-text"><RichText spans={block.text} /></h3>;
  }
  if (block.type === "heading_3") {
    return <h4 className="mt-5 mb-2 text-lg font-semibold text-text"><RichText spans={block.text} /></h4>;
  }
  if (block.type === "quote") {
    return (
      <blockquote className="my-4 border-l-2 border-primary/50 pl-4 text-muted">
        <RichText spans={block.text} />
        {children}
      </blockquote>
    );
  }
  if (block.type === "callout") {
    return (
      <div className="my-4 rounded-2xl border border-border bg-background px-4 py-3 text-text">
        <RichText spans={block.text} />
        {children}
      </div>
    );
  }
  if (block.type === "code") {
    return (
      <pre className="my-4 overflow-x-auto rounded-xl bg-[#1e1e1e] px-4 py-3 font-mono text-[13px] leading-6 text-[#d4d4d4]">
        {block.language ? <div className="mb-2 text-[11px] uppercase tracking-wide text-[#858585]">{block.language}</div> : null}
        <RichText spans={block.text} />
      </pre>
    );
  }
  if (block.type === "divider") {
    return <hr className="my-6 border-border" />;
  }
  if (block.type === "to_do") {
    return (
      <label className="my-1 flex items-start gap-2 text-text">
        <input type="checkbox" checked={block.checked === true} readOnly className="mt-1" />
        <span className={block.checked ? "text-muted line-through" : undefined}>
          <RichText spans={block.text} />
        </span>
      </label>
    );
  }
  if (block.type === "toggle") {
    return (
      <details className="my-2 rounded-xl border border-border px-3 py-2">
        <summary className="cursor-pointer font-medium text-text">
          <RichText spans={block.text} />
        </summary>
        <div className="pt-2">{children}</div>
      </details>
    );
  }
  if (block.type === "image" && block.url) {
    return (
      <figure className="my-4">
        <img src={block.url} alt={block.caption || ""} className="max-h-[32rem] w-full rounded-xl object-contain" />
        {block.caption ? <figcaption className="mt-2 text-center text-xs text-muted">{block.caption}</figcaption> : null}
      </figure>
    );
  }
  if ((block.type === "bookmark" || block.type === "embed" || block.type === "file" || block.type === "pdf" || block.type === "video") && block.url) {
    return (
      <a href={block.url} target="_blank" rel="noopener noreferrer" className="my-3 block truncate rounded-xl border border-border px-3 py-2 text-sm text-primary hover:bg-background">
        {block.caption || block.url}
      </a>
    );
  }
  if (block.type === "child_page" || block.type === "child_database") {
    return (
      <a
        href={`/notes/read?id=${encodeURIComponent(block.id)}`}
        className="my-2 flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm font-medium text-text hover:border-primary/40"
      >
        <span aria-hidden>{block.type === "child_database" ? "▦" : "✦"}</span>
        <RichText spans={block.text} />
      </a>
    );
  }
  if (block.type === "table" && children) {
    return <div className="my-4 overflow-x-auto">{children}</div>;
  }
  if (block.type === "table_row" && block.cells) {
    return (
      <div className="grid border-b border-border text-sm text-text" style={{ gridTemplateColumns: `repeat(${block.cells.length || 1}, minmax(8rem, 1fr))` }}>
        {block.cells.map((cell, index) => (
          <div key={index} className="border-r border-border px-3 py-2 last:border-r-0">
            <RichText spans={cell} />
          </div>
        ))}
      </div>
    );
  }
  if (block.type === "column_list" || block.type === "column" || block.type === "synced_block") {
    return <div className={block.type === "column_list" ? "my-4 flex flex-col gap-4 md:flex-row" : "min-w-0 flex-1"}>{children}</div>;
  }
  if (block.text.length === 0 && !children) {
    return null;
  }
  return (
    <p className="my-3 leading-7 text-text">
      <RichText spans={block.text} />
      {children}
    </p>
  );
}

export function NoteReader() {
  const [note, setNote] = useState<NoteDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("id");
    if (!id) {
      setError("This note link is missing an id.");
      return;
    }
    const cached = readFreshNoteBody(id);
    if (cached) {
      setNote(cached);
      document.title = `${cached.title} | Daily Report Generator`;
      return;
    }
    let active = true;
    fetch(`/api/notion?id=${encodeURIComponent(id)}`)
      .then(async (response) => {
        const body = (await response.json()) as NoteDetail | { error?: string };
        if (!response.ok) {
          throw new Error("error" in body && body.error ? body.error : "Could not open this note.");
        }
        return body as NoteDetail;
      })
      .then((next) => {
        if (active) {
          saveNoteBody(next);
          setNote(next);
          document.title = `${next.title} | Daily Report Generator`;
        }
      })
      .catch((reason: unknown) => {
        if (active) {
          setError(reason instanceof Error ? reason.message : "Could not open this note.");
        }
      });
    return () => {
      active = false;
    };
  }, []);

  if (error) {
    return (
      <Card className="mx-auto max-w-3xl px-6 py-10">
        <p className="text-base font-semibold text-text">Could not open this note</p>
        <p className="mt-2 text-sm text-muted">{error}</p>
      </Card>
    );
  }

  if (!note) {
    return (
      <div className="mx-auto max-w-3xl animate-pulse space-y-3">
        <div className="h-8 w-2/3 rounded-lg bg-surface" />
        <div className="h-4 w-1/3 rounded bg-surface" />
        <div className="h-40 rounded-2xl bg-surface" />
      </div>
    );
  }

  const edited = new Date(note.editedAt).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <article className="mx-auto w-full min-w-0 max-w-3xl animate-[fadeIn_0.35s_ease-out]">
      <header className="mb-6 border-b border-border pb-5">
        <p className="text-3xl leading-none">{note.icon ?? "✦"}</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-text sm:text-4xl">{note.title}</h1>
        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-muted">
          <span>{edited}</span>
          <a href={note.url} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline">
            Open in Notion
          </a>
        </div>
      </header>
      {note.blocks.length === 0 ? (
        <p className="text-sm text-muted">This page has no content yet.</p>
      ) : (
        <Blocks blocks={note.blocks} />
      )}
    </article>
  );
}
