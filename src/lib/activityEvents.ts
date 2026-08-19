/** Fired when activity data changes (work log or time tracking). */
export const ACTIVITY_CHANGED_EVENT = "drg:activity-changed";

export function dispatchActivityChanged(): void {
  if (typeof window === "undefined") {
    return;
  }
  window.dispatchEvent(new CustomEvent(ACTIVITY_CHANGED_EVENT));
}

export function subscribeActivityChanged(listener: () => void): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }
  window.addEventListener(ACTIVITY_CHANGED_EVENT, listener);
  return () => window.removeEventListener(ACTIVITY_CHANGED_EVENT, listener);
}
