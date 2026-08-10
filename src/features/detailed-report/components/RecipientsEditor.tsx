import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createId } from "@/lib/utils";
import type { Recipient } from "@/types/common";

interface RecipientsEditorProps {
  recipients: Recipient[];
  error?: string;
  onChange: (recipients: Recipient[]) => void;
}

export function RecipientsEditor({
  recipients,
  error,
  onChange,
}: RecipientsEditorProps) {
  function updateRecipient(id: string, name: string) {
    onChange(
      recipients.map((recipient) =>
        recipient.id === id ? { ...recipient, name } : recipient,
      ),
    );
  }

  function addRecipient() {
    onChange([
      ...recipients,
      { id: createId("recipient"), name: "" },
    ]);
  }

  function removeRecipient(id: string) {
    if (recipients.length <= 1) {
      return;
    }
    onChange(recipients.filter((recipient) => recipient.id !== id));
  }

  return (
    <section>
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-text">People</h3>
          <p className="text-xs text-muted">
            Output uses @Name san format (Slack IDs ready later)
          </p>
        </div>
        <Button size="sm" variant="secondary" onClick={addRecipient}>
          Add person
        </Button>
      </div>
      {error ? <p className="mb-2 text-xs text-danger">{error}</p> : null}
      <ul className="flex flex-col gap-3" aria-label="Recipients">
        {recipients.map((recipient, index) => (
          <li
            key={recipient.id}
            className="flex flex-col gap-2 rounded-xl border border-border bg-background/60 p-3 sm:flex-row sm:items-end"
          >
            <div className="flex-1">
              <Input
                id={`recipient-${recipient.id}`}
                label={`Recipient ${index + 1}`}
                value={recipient.name}
                onChange={(event) =>
                  updateRecipient(recipient.id, event.target.value)
                }
                placeholder="Full name"
              />
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="text-danger hover:text-danger sm:mb-0.5"
              onClick={() => removeRecipient(recipient.id)}
              disabled={recipients.length <= 1}
              aria-label={`Remove recipient ${index + 1}`}
            >
              Remove
            </Button>
          </li>
        ))}
      </ul>
    </section>
  );
}
