import { getStorageItem, setStorageItem, STORAGE_KEYS } from "@/lib/storage";

export type TaskLabelScope = "today-task" | "daily-report";

/** key → custom title overrides (defaults used when missing). */
export type TaskLabelMap = Record<string, string>;

function storageKeyFor(scope: TaskLabelScope): string {
  return scope === "today-task"
    ? STORAGE_KEYS.taskLabelsToday
    : STORAGE_KEYS.taskLabelsDaily;
}

export function getTaskLabels(scope: TaskLabelScope): TaskLabelMap {
  return getStorageItem<TaskLabelMap>(storageKeyFor(scope), {});
}

export function setTaskLabel(
  scope: TaskLabelScope,
  key: string,
  title: string,
): void {
  const trimmed = title.trim();
  if (!key || !trimmed) {
    return;
  }
  const current = getTaskLabels(scope);
  setStorageItem(storageKeyFor(scope), {
    ...current,
    [key]: trimmed,
  });
}

export function resolveTaskTitle(
  scope: TaskLabelScope,
  key: string,
  defaultTitle: string,
  draftTitle?: string,
): string {
  const labels = getTaskLabels(scope);
  if (labels[key]?.trim()) {
    return labels[key].trim();
  }
  if (draftTitle?.trim()) {
    return draftTitle.trim();
  }
  return defaultTitle;
}
