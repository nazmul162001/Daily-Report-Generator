import type { WorkBreakdownItem } from "@/types/common";
import type { TimedKind, WorkLogKind } from "./types";

export const TASK_KINDS: TimedKind[] = ["revision", "feedback", "question"];

export function isTaskKind(kind: WorkLogKind): kind is "revision" | "feedback" | "question" {
  return kind === "revision" || kind === "feedback" || kind === "question";
}

export function kindFromCategory(category: string): WorkLogKind {
  const name = category.trim().toLowerCase();
  if (!name) {
    return "custom";
  }
  if (name === "revision") {
    return "revision";
  }
  if (name.includes("feedback")) {
    return "feedback";
  }
  if (name.includes("meeting")) {
    return "meeting";
  }
  if (name.includes("question") || name.includes("support")) {
    return "question";
  }
  if (name === "review") {
    return "review";
  }
  if (name.includes("investigation")) {
    return "investigation";
  }
  return "custom";
}

export function kindLabel(kind: WorkLogKind): string {
  switch (kind) {
    case "revision":
      return "Revision";
    case "feedback":
      return "Feedback Response";
    case "question":
      return "Question Response";
    case "meeting":
      return "Meeting";
    case "review":
      return "Review";
    case "investigation":
      return "Investigation";
    default:
      return "Other";
  }
}

export function panelHint(kind: WorkLogKind): string {
  switch (kind) {
    case "revision":
    case "feedback":
    case "question":
      return "Projects and tasks. Add custom minutes or start a timer.";
    case "meeting":
      return "Add each meeting. Type minutes or start a timer.";
    case "review":
      return "Self-check minutes per project. Totals fill this row.";
    case "investigation":
      return "Add topics. Type minutes or start a timer.";
    default:
      return "Add items with custom minutes or a timer.";
  }
}

export function findItemKind(item: WorkBreakdownItem): WorkLogKind {
  return kindFromCategory(item.category);
}
