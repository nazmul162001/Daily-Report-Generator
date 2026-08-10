import { DEFAULT_RECIPIENTS } from "@/data/defaultTemplates";

interface RecipientsEditorProps {
  error?: string;
}

/** Fixed recipients — names are constant and not editable. */
export function RecipientsEditor({ error }: RecipientsEditorProps) {
  return (
    <section>
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-text">People</h3>
        <p className="text-xs text-muted">
          Fixed recipients — mention format is applied automatically on copy.
        </p>
      </div>
      {error ? <p className="mb-2 text-xs text-danger">{error}</p> : null}
      <ul className="flex flex-col gap-2" aria-label="Recipients">
        {DEFAULT_RECIPIENTS.map((name) => (
          <li
            key={name}
            className="rounded-xl border border-border bg-background/60 px-3 py-2.5 text-sm text-text"
          >
            <span className="font-medium text-primary">@{name}</span>
            <span className="text-muted"> san</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
