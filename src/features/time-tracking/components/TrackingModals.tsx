import { useEffect, useId, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { formatDurationLabel, parseMinutes } from "@/lib/duration";

interface AddProjectModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (name: string, caseNo: string) => void;
}

export function AddProjectModal({
  open,
  onClose,
  onSubmit,
}: AddProjectModalProps) {
  const nameId = useId();
  const caseId = useId();
  const [name, setName] = useState("");
  const [caseNo, setCaseNo] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setName("");
      setCaseNo("");
      setError("");
    }
  }, [open]);

  function handleSubmit() {
    if (!name.trim()) {
      setError("Project name is required.");
      return;
    }
    onSubmit(name.trim(), caseNo.trim());
    onClose();
  }

  return (
    <Modal
      open={open}
      title="Add Project"
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Add</Button>
        </>
      }
    >
      <form
        className="flex flex-col gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          handleSubmit();
        }}
      >
        <Input
          id={nameId}
          label="Project Name"
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            setError("");
          }}
          placeholder="Website Renewal"
          autoFocus
          required
          error={error}
        />
        <Input
          id={caseId}
          label="Case No"
          value={caseNo}
          onChange={(event) => setCaseNo(event.target.value)}
          placeholder="241"
        />
      </form>
    </Modal>
  );
}

interface AddTaskModalProps {
  open: boolean;
  projectName?: string;
  onClose: () => void;
  onSubmit: (number: string) => void;
}

export function AddTaskModal({
  open,
  projectName,
  onClose,
  onSubmit,
}: AddTaskModalProps) {
  const numberId = useId();
  const [number, setNumber] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setNumber("");
      setError("");
    }
  }, [open]);

  function handleSubmit() {
    if (!number.trim()) {
      setError("Task number is required.");
      return;
    }
    onSubmit(number.trim());
    onClose();
  }

  return (
    <Modal
      open={open}
      title={projectName ? `Add Task · ${projectName}` : "Add Task"}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Add</Button>
        </>
      }
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          handleSubmit();
        }}
      >
        <Input
          id={numberId}
          label="Task Number"
          value={number}
          onChange={(event) => {
            setNumber(event.target.value);
            setError("");
          }}
          placeholder="1-1"
          autoFocus
          required
          error={error}
          hint="Stored as text. Examples: 1-1, 1-2, 4, 6"
        />
      </form>
    </Modal>
  );
}

interface EditMinutesModalProps {
  open: boolean;
  taskNumber: string;
  currentMinutes: number;
  onClose: () => void;
  onSubmit: (minutes: number) => void;
}

export function EditMinutesModal({
  open,
  taskNumber,
  currentMinutes,
  onClose,
  onSubmit,
}: EditMinutesModalProps) {
  const minutesId = useId();
  const [value, setValue] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setValue(String(Math.round(currentMinutes)));
      setError("");
    }
  }, [open, currentMinutes]);

  function handleSubmit() {
    const parsed = parseMinutes(value);
    if (parsed === null) {
      setError("Enter minutes as a number.");
      return;
    }
    onSubmit(parsed);
    onClose();
  }

  return (
    <Modal
      open={open}
      title={`Edit time · ${taskNumber}`}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Save</Button>
        </>
      }
    >
      <form
        className="flex flex-col gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          handleSubmit();
        }}
      >
        <p className="text-sm text-text">
          Current:{" "}
          <span className="font-medium">
            {formatDurationLabel(String(Math.round(currentMinutes)), false)}
          </span>
        </p>
        <Input
          id={minutesId}
          label="Minutes"
          inputMode="numeric"
          value={value}
          onChange={(event) => {
            setValue(event.target.value.replace(/[^\d.]/g, ""));
            setError("");
          }}
          placeholder="30"
          autoFocus
          required
          error={error}
          hint="Enter minutes only. Hours are calculated automatically."
        />
      </form>
    </Modal>
  );
}
