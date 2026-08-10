import { useEffect, useRef, useState } from "react";
import type { DraftStatus } from "@/types/common";
import { setDraft } from "@/lib/repository";

export function useDraftAutoSave<T>(
  storageKey: string,
  data: T,
  enabled = true,
): DraftStatus {
  const [status, setStatus] = useState<DraftStatus>("idle");
  const isFirstRender = useRef(true);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    setStatus("saving");

    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
    }

    timerRef.current = window.setTimeout(() => {
      const ok = setDraft(storageKey, data);
      setStatus(ok ? "saved" : "idle");
    }, 400);

    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, [data, storageKey, enabled]);

  return status;
}
