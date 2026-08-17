import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { formatDurationLabel, formatMinutesShort } from "@/lib/duration";
import { durationMsToMinutes } from "../timer";
import { getProjectDurationMs } from "../totals";
import type { TrackingProject } from "../types";
import { TaskRow } from "./TaskRow";

interface ProjectCardProps {
  project: TrackingProject;
  now: number;
  onAddTask: () => void;
  onDeleteProject: () => void;
  onAddNote: () => void;
  onViewNote: () => void;
  onStartTask: (taskId: string) => void;
  onCompleteTask: (taskId: string) => void;
  onEditTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
}

function InfoIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-4 w-4"
      aria-hidden
    >
      <circle cx="12" cy="12" r="9" />
      <path strokeLinecap="round" d="M12 11v6M12 8h.01" />
    </svg>
  );
}

function NoteIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="hidden h-4 w-4 sm:block"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M7 4h8l4 4v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"
      />
      <path strokeLinecap="round" d="M15 4v4h4M8 12h8M8 16h5" />
    </svg>
  );
}

export function ProjectCard({
  project,
  now,
  onAddTask,
  onDeleteProject,
  onAddNote,
  onViewNote,
  onStartTask,
  onCompleteTask,
  onEditTask,
  onDeleteTask,
}: ProjectCardProps) {
  const totalMs = getProjectDurationMs(project, now, true);
  const totalMinutes = durationMsToMinutes(totalMs);
  const hasNote = Boolean(project.note?.trim());

  return (
    <Card as="article">
      <CardHeader
        title={project.name}
        description={
          project.caseNo
            ? `Case No ${project.caseNo} · ${formatMinutesShort(totalMinutes)}`
            : formatMinutesShort(totalMinutes)
        }
        action={
          <div className="flex w-full shrink-0 flex-wrap gap-2 sm:w-auto sm:justify-end">
            {hasNote ? (
              <button
                type="button"
                onClick={onViewNote}
                className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-primary/40 bg-primary/15 text-primary shadow-sm ring-2 ring-primary/20 transition-colors hover:bg-primary/25"
                aria-label={`View note for ${project.name}`}
                title="View project note"
              >
                <InfoIcon />
              </button>
            ) : (
              <Button
                size="sm"
                onClick={onAddNote}
                className="flex-1 whitespace-nowrap shadow-sm ring-2 ring-primary/30 sm:flex-none"
              >
                <NoteIcon />
                Add Note
              </Button>
            )}
            <Button size="sm" variant="secondary" onClick={onAddTask} className="flex-1 sm:flex-none">
              Add Task
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={onDeleteProject}
              className="flex-1 ring-2 ring-danger/35 sm:flex-none"
            >
              Delete
            </Button>
          </div>
        }
      />

      <p className="mb-3 text-sm text-muted">
        Project total:{" "}
        <span className="font-medium text-text">
          {formatDurationLabel(String(Math.round(totalMinutes)), false)}
        </span>
      </p>

      {project.tasks.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border bg-background/50 px-3 py-6 text-center text-sm text-muted">
          No tasks yet. Add a task number to start tracking.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {project.tasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              now={now}
              onStart={() => onStartTask(task.id)}
              onComplete={() => onCompleteTask(task.id)}
              onEdit={() => onEditTask(task.id)}
              onDelete={() => onDeleteTask(task.id)}
            />
          ))}
        </div>
      )}
    </Card>
  );
}
