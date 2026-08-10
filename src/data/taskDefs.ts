/** Shared built-in task definitions (no storage imports). */

export type FixedTaskKey =
  | "feedback-last-day"
  | "feedback-today"
  | "remaining-last-day"
  | "new-actual-today";

export interface FixedTaskDef {
  key: FixedTaskKey;
  title: string;
  included: boolean;
  status: "completed" | "ongoing";
}

/** Full checklist used by Daily Report (current defaults). */
export const DAILY_TASK_DEFS: FixedTaskDef[] = [
  {
    key: "feedback-last-day",
    title: "Feedback of last day.",
    included: true,
    status: "completed",
  },
  {
    key: "feedback-today",
    title: "Feedback of today.",
    included: false,
    status: "completed",
  },
  {
    key: "remaining-last-day",
    title: "Remaining cases of last day.",
    included: true,
    status: "completed",
  },
  {
    key: "new-actual-today",
    title: "New actual cases today.",
    included: true,
    status: "ongoing",
  },
];

/** Today's Task list — no “Feedback of today”. */
export const TODAY_TASK_DEFS: FixedTaskDef[] = DAILY_TASK_DEFS.filter(
  (task) => task.key !== "feedback-today",
);
