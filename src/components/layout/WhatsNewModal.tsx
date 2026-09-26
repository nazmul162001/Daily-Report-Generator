import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { getStorageItem, setStorageItem, STORAGE_KEYS } from "@/lib/storage";
import { hasUserName, USER_NAME_CHANGED_EVENT } from "@/lib/userName";

const UPDATES = [
  {
    title: "Count time from the project",
    body: "Now you can add a project under Revision, Feedback, or Others and count time directly from that row.",
  },
  {
    title: "Hours Calculator",
    body: "Convert hours to minutes or minutes to hours. Add several values with Enter, then copy the final number.",
  },
  {
    title: "Backup",
    body: "Save HTML, CSS, JavaScript, and PHP under a project title so you can open, edit, or copy them later.",
  },
  {
    title: "Notes",
    body: "Open the Notes tab to see the pages from Notion account. Search by title and read a note in the same tab.",
  },
  {
    title: "Home",
    body: "UI Update: The home page now shows every feature at a glance, with a short explanation of what each one does.",
  },
];

function hasSeenWhatsNew(): boolean {
  return getStorageItem<boolean>(STORAGE_KEYS.whatsNew, false) === true;
}

function markWhatsNewSeen(): void {
  setStorageItem(STORAGE_KEYS.whatsNew, true);
}

export function WhatsNewModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function maybeOpen() {
      if (hasUserName() && !hasSeenWhatsNew()) {
        setOpen(true);
      }
    }

    maybeOpen();
    window.addEventListener(USER_NAME_CHANGED_EVENT, maybeOpen);
    return () => window.removeEventListener(USER_NAME_CHANGED_EVENT, maybeOpen);
  }, []);

  function dismiss() {
    markWhatsNewSeen();
    setOpen(false);
  }

  return (
    <Modal
      open={open}
      title="What's new"
      onClose={dismiss}
      panelClassName="flex max-h-[min(92dvh,44rem)] w-full max-w-xl flex-col overflow-hidden"
      bodyClassName="min-h-0 flex-1 overflow-y-auto"
      footer={<Button onClick={dismiss}>Got it</Button>}
    >
      <div className="space-y-4 text-text">
        <p className="leading-relaxed text-muted">
          A few updates are ready. This note shows once, then stays closed.
        </p>
        <ol className="space-y-2.5">
          {UPDATES.map((item, index) => (
            <li
              key={item.title}
              className="feature-in flex gap-3 rounded-xl border border-border bg-background/70 px-3 py-3"
              style={{ animationDelay: `${index * 60}ms` }}
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-sm font-semibold text-primary">
                {index + 1}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-text">{item.title}</span>
                <span className="mt-0.5 block text-sm leading-relaxed text-muted">{item.body}</span>
              </span>
            </li>
          ))}
        </ol>
      </div>
    </Modal>
  );
}
