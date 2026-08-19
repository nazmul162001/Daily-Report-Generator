import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import {
  getUserName,
  hasUserName,
  setUserName,
  USER_NAME_CHANGED_EVENT,
} from "@/lib/userName";

export function WelcomeNameModal() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!hasUserName()) {
      setOpen(true);
      setName("");
      setError("");
      return;
    }
    setOpen(false);
  }, []);

  function save() {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Please enter your name.");
      return;
    }
    setUserName(trimmed);
    setError("");
    setOpen(false);
  }

  return (
    <Modal
      open={open}
      title="Welcome to Daily Report Generator"
      onClose={() => {
        if (hasUserName()) {
          setOpen(false);
        }
      }}
      panelClassName="max-w-lg"
      footer={
        <Button onClick={save} disabled={!name.trim()}>
          Save and continue
        </Button>
      }
    >
      <div className="space-y-4 text-text">
        <p className="leading-relaxed">
          Create, preview, and copy Slack-ready daily reports in seconds. Track
          activity, log detailed work, and generate reports — all saved in
          your browser.
        </p>
        <p className="leading-relaxed">
          Add your name once and it will appear in your Daily Report as{" "}
          <span className="font-medium text-text">Daily Report Of [your name]</span>.
          You can change it anytime on the Daily Report page.
        </p>
        <Input
          id="welcome-user-name"
          label="Your name"
          placeholder="e.g. Nazmul Hassan"
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            if (error) {
              setError("");
            }
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              save();
            }
          }}
          error={error}
          required
          autoFocus
          autoComplete="name"
        />
      </div>
    </Modal>
  );
}

export function useUserName(): string {
  const [name, setName] = useState(() => getUserName());

  useEffect(() => {
    function sync() {
      setName(getUserName());
    }
    sync();
    window.addEventListener(USER_NAME_CHANGED_EVENT, sync);
    return () => window.removeEventListener(USER_NAME_CHANGED_EVENT, sync);
  }, []);

  return name;
}
