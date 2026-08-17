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
  onStartTask: (taskId: string) => void;
  onCompleteTask: (taskId: string) => void;
  onEditTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
}

export function ProjectCard({
  project,
  now,
  onAddTask,
  onDeleteProject,
  onStartTask,
  onCompleteTask,
  onEditTask,
  onDeleteTask,
}: ProjectCardProps) {
  const totalMs = getProjectDurationMs(project, now, true);
  const totalMinutes = durationMsToMinutes(totalMs);

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
          <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
            <Button size="sm" variant="secondary" onClick={onAddTask}>
              Add Task
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={onDeleteProject}
              className="text-danger hover:bg-danger/10 hover:text-danger"
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
