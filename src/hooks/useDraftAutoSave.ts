import { useEffect, useRef, useState } from "react";
import type { DraftStatus } from "@/types/common";
import { setDraft } from "@/lib/repository";

/**
 * Persist form drafts to localStorage (with sessionStorage backup).
 * Flushes immediately on tab hide, page unload, and ClientRouter navigation
 * so a long session / quick route change cannot drop the last edits.
 */
export function useDraftAutoSave<T>(
  storageKey: string,
  data: T,
  enabled = true,
): DraftStatus {
  const [status, setStatus] = useState<DraftStatus>("idle");
  const skipNextSave = useRef(true);
  const timerRef = useRef<number | null>(null);
  const dataRef = useRef(data);
  const lastSavedRef = useRef<string | null>(null);
  const enabledRef = useRef(enabled);
  const keyRef = useRef(storageKey);

  dataRef.current = data;
  enabledRef.current = enabled;
  keyRef.current = storageKey;

  function serialize(value: T): string | null {
    try {
      return JSON.stringify(value);
    } catch {
      return null;
    }
  }

  function persist(value: T): boolean {
    const serialized = serialize(value);
    if (serialized === null) {
      return false;
    }
    if (serialized === lastSavedRef.current) {
      return true;
    }
    const ok = setDraft(keyRef.current, value);
    if (ok) {
      lastSavedRef.current = serialized;
    }
    return ok;
  }

  // Debounced save while typing / editing
  useEffect(() => {
    if (!enabled) {
      return;
    }

    if (skipNextSave.current) {
      skipNextSave.current = false;
      lastSavedRef.current = serialize(data);
      return;
    }

    setStatus("saving");

    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
    }

    timerRef.current = window.setTimeout(() => {
      const ok = persist(data);
      setStatus(ok ? "saved" : "error");
    }, 250);

    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [data, storageKey, enabled]);

  // Flush on leave so debounce cannot drop the last change
  useEffect(() => {
    if (!enabled) {
      return;
    }

    function flush() {
      if (!enabledRef.current) {
        return;
      }
      persist(dataRef.current);
    }

    function onVisibility() {
      if (document.visibilityState === "hidden") {
        flush();
      }
    }

    window.addEventListener("pagehide", flush);
    window.addEventListener("beforeunload", flush);
    document.addEventListener("visibilitychange", onVisibility);
    document.addEventListener("astro:before-preparation", flush);
    document.addEventListener("astro:before-swap", flush);

    return () => {
      flush();
      window.removeEventListener("pagehide", flush);
      window.removeEventListener("beforeunload", flush);
      document.removeEventListener("visibilitychange", onVisibility);
      document.removeEventListener("astro:before-preparation", flush);
      document.removeEventListener("astro:before-swap", flush);
    };
  }, [enabled, storageKey]);

  return status;
}
