import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/Modal";
import { ToastProvider, useToast } from "@/components/ui/Toast";
import { formatDisplayDate } from "@/lib/date";
import { formatDurationLabel, formatMinutesShort } from "@/lib/duration";
import { durationMsToMinutes, getTaskDurationMs } from "../timer";
import { useTimeTracking } from "../useTimeTracking";
import { ProjectCard } from "./ProjectCard";
import {
  AddProjectModal,
  AddTaskModal,
  EditMinutesModal,
  TaskNoteModal,
} from "./TrackingModals";

function TimeTrackingPageInner() {
  const { showToast } = useToast();
  const tracking = useTimeTracking();
  const [addProjectOpen, setAddProjectOpen] = useState(false);
  const [addTaskFor, setAddTaskFor] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [editTask, setEditTask] = useState<{
    projectId: string;
    taskId: string;
    number: string;
    minutes: number;
  } | null>(null);
  const [noteProject, setNoteProject] = useState<{
    projectId: string;
    projectName: string;
    note: string;
    mode: "add" | "view";
  } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<
    | { type: "project"; id: string; name: string }
    | { type: "task"; projectId: string; taskId: string; number: string }
    | null
  >(null);

  const todayMinutes = durationMsToMinutes(tracking.todayTotalMs);
  const addTaskProjectName = addTaskFor?.name;

  const pendingDescription = useMemo(() => {
    if (!tracking.pendingSwitch) {
      return "";
    }
    const from = tracking.pendingSwitch.from;
    return `“${from.taskNumber}” on ${from.projectName} is still running. Completing it will save elapsed time, then “${tracking.pendingSwitch.taskNumber}” will start.`;
  }, [tracking.pendingSwitch]);

  function openProjectNote(projectId: string, mode: "add" | "view") {
    const project = tracking.projects.find((item) => item.id === projectId);
    if (!project) {
      return;
    }
    setNoteProject({
      projectId,
      projectName: project.name,
      note: project.note ?? "",
      mode,
    });
  }

  return (
    <div className="space-y-5">
      <Card className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-primary">
            Today · {formatDisplayDate(tracking.today)}
          </p>
          <h2 className="mt-1 text-lg font-semibold text-text sm:text-xl">
            Today&apos;s Total Tracking Time
          </h2>
          <p className="mt-1 text-sm text-muted">
            {tracking.hydrated
              ? `${formatMinutesShort(todayMinutes)} · ${formatDurationLabel(String(Math.round(todayMinutes)), false)}`
              : "Loading today's totals…"}
          </p>
        </div>
        <Button
          onClick={() => setAddProjectOpen(true)}
          className="w-full shrink-0 sm:w-auto"
          disabled={!tracking.hydrated}
        >
          Add Project
        </Button>
      </Card>

      {!tracking.hydrated ? (
        <Card className="h-40 animate-pulse bg-background/60" />
      ) : tracking.projects.length === 0 ? (
        <EmptyState
          title="No projects yet"
          description="Create a project, add task numbers, and start a timer. Totals feed today's Detailed Report revision by default."
          actionLabel="Add Project"
          onAction={() => setAddProjectOpen(true)}
        />
      ) : (
        <div className="flex flex-col gap-4">
          {tracking.projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              now={tracking.now}
              onAddTask={() =>
                setAddTaskFor({ id: project.id, name: project.name })
              }
              onDeleteProject={() =>
                setDeleteTarget({
                  type: "project",
                  id: project.id,
                  name: project.name,
                })
              }
              onAddNote={() => openProjectNote(project.id, "add")}
              onViewNote={() => openProjectNote(project.id, "view")}
              onStartTask={(taskId) => {
                const result = tracking.requestStart(project.id, taskId);
                if (result === "started") {
                  showToast("Timer started.", "info");
                }
              }}
              onCompleteTask={(taskId) => {
                tracking.completeTask(project.id, taskId);
                showToast("Task completed.");
              }}
              onEditTask={(taskId) => {
                const task = project.tasks.find((item) => item.id === taskId);
                if (!task) {
                  return;
                }
                setEditTask({
                  projectId: project.id,
                  taskId,
                  number: task.number,
                  minutes: durationMsToMinutes(
                    getTaskDurationMs(task, tracking.now),
                  ),
                });
              }}
              onDeleteTask={(taskId) => {
                const task = project.tasks.find((item) => item.id === taskId);
                if (!task) {
                  return;
                }
                setDeleteTarget({
                  type: "task",
                  projectId: project.id,
                  taskId,
                  number: task.number,
                });
              }}
            />
          ))}
        </div>
      )}

      <AddProjectModal
        open={addProjectOpen}
        onClose={() => setAddProjectOpen(false)}
        onSubmit={(name, caseNo) => {
          tracking.addProject(name, caseNo);
          showToast("Project added.");
        }}
      />

      <AddTaskModal
        open={Boolean(addTaskFor)}
        projectName={addTaskProjectName}
        onClose={() => setAddTaskFor(null)}
        onSubmit={(number) => {
          if (!addTaskFor) {
            return;
          }
          tracking.addTask(addTaskFor.id, number);
          showToast("Task added.");
        }}
      />

      <EditMinutesModal
        open={Boolean(editTask)}
        taskNumber={editTask?.number ?? ""}
        currentMinutes={editTask?.minutes ?? 0}
        onClose={() => setEditTask(null)}
        onSubmit={(minutes) => {
          if (!editTask) {
            return;
          }
          tracking.editTaskMinutes(
            editTask.projectId,
            editTask.taskId,
            minutes,
          );
          showToast("Time updated.");
        }}
      />

      <TaskNoteModal
        open={Boolean(noteProject)}
        mode={noteProject?.mode ?? "add"}
        projectName={noteProject?.projectName ?? ""}
        note={noteProject?.note ?? ""}
        onClose={() => setNoteProject(null)}
        onSave={(note) => {
          if (!noteProject) {
            return;
          }
          tracking.saveProjectNote(noteProject.projectId, note);
          showToast(note ? "Note saved." : "Note removed.");
        }}
      />

      <ConfirmDialog
        open={Boolean(tracking.pendingSwitch)}
        title="A task is already running"
        description={pendingDescription}
        confirmLabel="Complete & start"
        cancelLabel="Cancel"
        danger={false}
        onConfirm={() => {
          tracking.confirmSwitchAndStart();
          showToast("Switched timer.");
        }}
        onCancel={tracking.cancelSwitch}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title={
          deleteTarget?.type === "project" ? "Delete project?" : "Delete task?"
        }
        description={
          deleteTarget?.type === "project"
            ? `Delete “${deleteTarget.name}” and all of its tasks for today? This cannot be undone.`
            : `Delete task “${deleteTarget?.number ?? ""}”? Tracked time for it will be removed from today's total.`
        }
        confirmLabel="Delete"
        onConfirm={() => {
          if (!deleteTarget) {
            return;
          }
          if (deleteTarget.type === "project") {
            tracking.deleteProject(deleteTarget.id);
            showToast("Project deleted.");
          } else {
            tracking.deleteTask(deleteTarget.projectId, deleteTarget.taskId);
            showToast("Task deleted.");
          }
          setDeleteTarget(null);
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

export function TimeTrackingPage() {
  return (
    <ToastProvider>
      <TimeTrackingPageInner />
    </ToastProvider>
  );
}
