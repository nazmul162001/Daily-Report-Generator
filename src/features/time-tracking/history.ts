import { formatDurationLabel, formatHoursFromMinutes, formatMinutesShort } from "@/lib/duration";
import { formatDisplayDate } from "@/lib/date";
import { toCsv } from "@/lib/csv";
import { getTaskDurationMs, durationMsToMinutes } from "./timer";
import type { TimeTrackingStore, TrackingProject, TrackingTask } from "./types";

export interface HistoryTask {
  id: string;
  number: string;
  minutes: number;
  durationLabel: string;
}

export interface HistoryProject {
  date: string;
  projectId: string;
  name: string;
  caseNo: string;
  note: string | null;
  tasks: HistoryTask[];
  totalMinutes: number;
  totalLabel: string;
}

export interface HistoryDayGroup {
  date: string;
  projects: HistoryProject[];
  taskCount: number;
  totalMinutes: number;
  totalLabel: string;
}

export interface HistoryResult {
  days: HistoryDayGroup[];
  projectCount: number;
  taskCount: number;
  totalMinutes: number;
  totalLabel: string;
}

function toHistoryTask(task: TrackingTask): HistoryTask | null {
  if (task.status !== "completed") {
    return null;
  }
  const minutes = durationMsToMinutes(getTaskDurationMs(task));
  return {
    id: task.id,
    number: task.number,
    minutes,
    durationLabel: formatDurationLabel(String(Math.round(minutes)), false),
  };
}

function toHistoryProject(
  date: string,
  project: TrackingProject,
): HistoryProject | null {
  const tasks = project.tasks
    .map(toHistoryTask)
    .filter((task): task is HistoryTask => task !== null);
  if (tasks.length === 0) {
    return null;
  }
  const totalMinutes = tasks.reduce((sum, task) => sum + task.minutes, 0);
  return {
    date,
    projectId: project.id,
    name: project.name,
    caseNo: project.caseNo,
    note: project.note,
    tasks,
    totalMinutes,
    totalLabel: formatDurationLabel(String(Math.round(totalMinutes)), false),
  };
}

export function listCompletedHistory(
  store: TimeTrackingStore,
  fromIso: string,
  toIso: string,
): HistoryResult {
  const from = fromIso <= toIso ? fromIso : toIso;
  const to = fromIso <= toIso ? toIso : fromIso;
  const days: HistoryDayGroup[] = [];

  for (const [date, day] of Object.entries(store.days)) {
    if (date < from || date > to) {
      continue;
    }
    const projects = day.projects
      .map((project) => toHistoryProject(date, project))
      .filter((project): project is HistoryProject => project !== null);
    if (projects.length === 0) {
      continue;
    }
    projects.sort((a, b) => a.name.localeCompare(b.name));
    const totalMinutes = projects.reduce(
      (sum, project) => sum + project.totalMinutes,
      0,
    );
    const taskCount = projects.reduce(
      (sum, project) => sum + project.tasks.length,
      0,
    );
    days.push({
      date,
      projects,
      taskCount,
      totalMinutes,
      totalLabel: formatMinutesShort(totalMinutes),
    });
  }

  days.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

  const projectCount = days.reduce((sum, day) => sum + day.projects.length, 0);
  const taskCount = days.reduce((sum, day) => sum + day.taskCount, 0);
  const totalMinutes = days.reduce((sum, day) => sum + day.totalMinutes, 0);

  return {
    days,
    projectCount,
    taskCount,
    totalMinutes,
    totalLabel: formatDurationLabel(String(Math.round(totalMinutes)), false),
  };
}

export function historyDayToCsv(day: HistoryDayGroup): string {
  const rows: Array<Array<string | number>> = [
    [
      "Date",
      "Project",
      "Case No",
      "Task Number",
      "Status",
      "Minutes",
      "Hours",
      "Duration",
      "Note",
    ],
  ];

  for (const project of day.projects) {
    for (const task of project.tasks) {
      rows.push([
        formatDisplayDate(day.date),
        project.name,
        project.caseNo,
        task.number,
        "Completed",
        Math.round(task.minutes * 100) / 100,
        formatHoursFromMinutes(task.minutes),
        task.durationLabel,
        project.note ?? "",
      ]);
    }
  }

  return toCsv(rows);
}
