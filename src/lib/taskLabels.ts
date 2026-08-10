import { createId } from "@/lib/utils";
import { getStorageItem, setStorageItem, STORAGE_KEYS } from "@/lib/storage";
import {
  DAILY_TASK_DEFS,
  TODAY_TASK_DEFS,
  type FixedTaskDef,
  type FixedTaskKey,
} from "@/data/taskDefs";

export type TaskLabelScope = "today-task" | "daily-report";

export interface TaskCatalogItem {
  key: string;
  title: string;
}

/** Legacy labels map — still read for migration */
type TaskLabelMap = Record<string, string>;

function labelsStorageKey(scope: TaskLabelScope): string {
  return scope === "today-task"
    ? STORAGE_KEYS.taskLabelsToday
    : STORAGE_KEYS.taskLabelsDaily;
}

function catalogStorageKey(scope: TaskLabelScope): string {
  return scope === "today-task"
    ? STORAGE_KEYS.taskCatalogToday
    : STORAGE_KEYS.taskCatalogDaily;
}

function defaultDefs(scope: TaskLabelScope): FixedTaskDef[] {
  return scope === "today-task" ? TODAY_TASK_DEFS : DAILY_TASK_DEFS;
}

export function isDefaultTaskKey(key: string | undefined): boolean {
  if (!key) {
    return false;
  }
  return (
    key === "feedback-last-day" ||
    key === "feedback-today" ||
    key === "remaining-last-day" ||
    key === "new-actual-today"
  );
}

export function isCustomTaskKey(key: string | undefined): boolean {
  return Boolean(key?.startsWith("custom-"));
}

function getLegacyLabels(scope: TaskLabelScope): TaskLabelMap {
  return getStorageItem<TaskLabelMap>(labelsStorageKey(scope), {});
}

function defaultCatalog(scope: TaskLabelScope): TaskCatalogItem[] {
  const labels = getLegacyLabels(scope);
  return defaultDefs(scope).map((def) => ({
    key: def.key,
    title: labels[def.key]?.trim() || def.title,
  }));
}

/**
 * Ordered task catalog for a tab.
 * Always includes built-in defaults first, then any user-added custom tasks.
 */
export function getTaskCatalog(scope: TaskLabelScope): TaskCatalogItem[] {
  const stored = getStorageItem<TaskCatalogItem[] | null>(
    catalogStorageKey(scope),
    null,
  );
  const labels = getLegacyLabels(scope);
  const defs = defaultDefs(scope);
  const defKeys = new Set(defs.map((d) => d.key));

  if (!stored || stored.length === 0) {
    return defaultCatalog(scope);
  }

  const storedByKey = new Map(
    stored
      .filter((item) => item.key?.trim() && item.title?.trim())
      .map((item) => [item.key, item.title.trim()] as const),
  );

  const defaults: TaskCatalogItem[] = defs.map((def) => ({
    key: def.key,
    title:
      storedByKey.get(def.key) || labels[def.key]?.trim() || def.title,
  }));

  const customs: TaskCatalogItem[] = stored
    .filter((item) => item.key && !defKeys.has(item.key as FixedTaskKey))
    .map((item) => ({
      key: item.key,
      title: item.title.trim() || "New task",
    }));

  return [...defaults, ...customs];
}

export function saveTaskCatalog(
  scope: TaskLabelScope,
  catalog: TaskCatalogItem[],
): void {
  setStorageItem(catalogStorageKey(scope), catalog);

  const labels: TaskLabelMap = {};
  for (const item of catalog) {
    if (item.key && item.title.trim()) {
      labels[item.key] = item.title.trim();
    }
  }
  setStorageItem(labelsStorageKey(scope), labels);
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
  const catalog = getTaskCatalog(scope);
  const next = catalog.map((item) =>
    item.key === key ? { ...item, title: trimmed } : item,
  );
  if (!next.some((item) => item.key === key)) {
    next.push({ key, title: trimmed });
  }
  saveTaskCatalog(scope, next);
}

export function addTaskToCatalog(
  scope: TaskLabelScope,
  title = "New task",
): TaskCatalogItem {
  const item: TaskCatalogItem = {
    key: `custom-${createId("task")}`,
    title: title.trim() || "New task",
  };
  const catalog = getTaskCatalog(scope);
  saveTaskCatalog(scope, [...catalog, item]);
  return item;
}

export function removeTaskFromCatalog(
  scope: TaskLabelScope,
  key: string,
): void {
  if (isDefaultTaskKey(key)) {
    return;
  }
  const catalog = getTaskCatalog(scope).filter((item) => item.key !== key);
  saveTaskCatalog(scope, catalog);
}

export function getTaskLabels(scope: TaskLabelScope): TaskLabelMap {
  return getLegacyLabels(scope);
}
