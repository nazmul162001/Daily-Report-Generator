import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getTodayIsoDate } from "@/lib/date";
import { createId } from "@/lib/utils";
import {
  addBoardProject,
  completeTimedEntry,
  emptyStore,
  findRunningEntry,
  getWorkLogDay,
  loadWorkLogStore,
  pauseOthers,
  removeBoardProject,
  removeTimedEntry,
  saveWorkLogStore,
  setTimedMinutes,
  toggleTimedEntry,
  updateTodayLog,
} from "./storage";
import { startFreshEntry, setElapsedMinutes } from "./timer";
import type { TimedKind, WorkLogKind, WorkLogStore } from "./types";

function persist(store: WorkLogStore): WorkLogStore {
  return saveWorkLogStore(store);
}

export function useWorkLog() {
  const [store, setStore] = useState<WorkLogStore>(emptyStore);
  const [hydrated, setHydrated] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [today, setToday] = useState(() => getTodayIsoDate());
  const storeRef = useRef(store);
  storeRef.current = store;
  const hydratedRef = useRef(false);

  const commit = useCallback(
    (updater: (current: WorkLogStore) => WorkLogStore) => {
      if (!hydratedRef.current) {
        return;
      }
      setStore((current) => persist(updater(current)));
    },
    [],
  );

  useEffect(() => {
    const loaded = persist(loadWorkLogStore());
    storeRef.current = loaded;
    hydratedRef.current = true;
    setStore(loaded);
    setToday(getTodayIsoDate());
    setNow(Date.now());
    setHydrated(true);
  }, []);

  const day = useMemo(() => getWorkLogDay(store, today), [store, today]);
  const running = useMemo(() => findRunningEntry(store), [store]);

  useEffect(() => {
    if (!running) {
      return;
    }
    const tick = () => {
      const currentToday = getTodayIsoDate();
      if (currentToday !== today) {
        setToday(currentToday);
        commit((current) => current);
        return;
      }
      setNow(Date.now());
    };
    tick();
    const interval = window.setInterval(tick, 250);
    function onVisible() {
      if (document.visibilityState === "visible") {
        tick();
      }
    }
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", tick);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", tick);
    };
  }, [running, today, commit]);

  useEffect(() => {
    function flush() {
      if (!hydratedRef.current) {
        return;
      }
      saveWorkLogStore(storeRef.current);
    }
    window.addEventListener("pagehide", flush);
    window.addEventListener("beforeunload", flush);
    return () => {
      flush();
      window.removeEventListener("pagehide", flush);
      window.removeEventListener("beforeunload", flush);
    };
  }, []);

  const addProject = useCallback((name: string, kind: WorkLogKind) => {
    const trimmed = name.trim();
    if (!trimmed) {
      return;
    }
    commit((current) =>
      updateTodayLog(current, (log) => addBoardProject(log, kind, trimmed)),
    );
  }, [commit]);

  const removeProject = useCallback((name: string, kind: WorkLogKind) => {
    const key = name.trim().toLowerCase();
    if (!key) {
      return;
    }
    commit((current) =>
      updateTodayLog(current, (log) => {
        const withoutBoard = removeBoardProject(log, kind, name);
        if (kind === "review") {
          return {
            ...withoutBoard,
            reviews: withoutBoard.reviews.filter(
              (item) => item.projectName.trim().toLowerCase() !== key,
            ),
          };
        }
        return {
          ...withoutBoard,
          timed: withoutBoard.timed.filter(
            (entry) =>
              !(
                entry.kind === kind &&
                entry.label.trim().toLowerCase() === key
              ),
          ),
        };
      }),
    );
  }, [commit]);

  const addTimed = useCallback(
    (
      kind: TimedKind,
      label: string,
      taskNo: string,
      options?: { start?: boolean; minutes?: number },
    ) => {
      const trimmed = label.trim();
      if (!trimmed) {
        return;
      }
      const task = taskNo.trim();
      const minutes = Math.max(0, options?.minutes ?? 0);
      const startNow = Boolean(options?.start);
      const startedAt = Date.now();
      commit((current) => {
        const paused = startNow ? pauseOthers(current, null, startedAt) : current;
        return updateTodayLog(paused, (log) => {
          if (task) {
            const duplicate = log.timed.some(
              (entry) =>
                entry.kind === kind &&
                entry.label.trim().toLowerCase() === trimmed.toLowerCase() &&
                entry.taskNo.trim().toLowerCase() === task.toLowerCase(),
            );
            if (duplicate) {
              return log;
            }
          }
          let entry = {
            id: createId("log"),
            kind,
            label: trimmed,
            taskNo: task,
            status: "idle" as const,
            startedAt: null,
            elapsedMs: 0,
          };
          if (minutes > 0) {
            entry = setElapsedMinutes(entry, minutes);
          }
          if (startNow) {
            entry = startFreshEntry(entry, startedAt);
          }
          return {
            ...(kind === "revision" || kind === "feedback" || kind === "question"
              ? addBoardProject(log, kind, trimmed)
              : log),
            timed: [...log.timed, entry],
          };
        });
      });
    },
    [commit],
  );

  const togglePause = useCallback(
    (entryId: string) => {
      const stamp = Date.now();
      commit((current) => toggleTimedEntry(current, entryId, stamp));
    },
    [commit],
  );

  const complete = useCallback(
    (entryId: string) => {
      const stamp = Date.now();
      commit((current) => completeTimedEntry(current, entryId, stamp));
    },
    [commit],
  );

  const setMinutes = useCallback((entryId: string, minutes: number) => {
    commit((current) => setTimedMinutes(current, entryId, minutes));
  }, [commit]);

  const removeTimed = useCallback(
    (entryId: string) => {
      commit((current) => removeTimedEntry(current, entryId));
    },
    [commit],
  );

  const addReview = useCallback((projectName: string, minutes: number) => {
    const name = projectName.trim();
    if (!name || !Number.isFinite(minutes) || minutes < 0) {
      return;
    }
    commit((current) =>
      updateTodayLog(current, (log) => {
        const existing = log.reviews.find(
          (item) => item.projectName.toLowerCase() === name.toLowerCase(),
        );
        if (existing) {
          return {
            ...log,
            reviews: log.reviews.map((item) =>
              item.id === existing.id
                ? { ...item, minutes: item.minutes + minutes }
                : item,
            ),
          };
        }
        return {
          ...log,
          reviews: [
            ...log.reviews,
            { id: createId("rev"), projectName: name, minutes },
          ],
        };
      }),
    );
  }, [commit]);

  const updateReview = useCallback((entryId: string, minutes: number) => {
    commit((current) =>
      updateTodayLog(current, (log) => ({
        ...log,
        reviews: log.reviews.map((item) =>
          item.id === entryId ? { ...item, minutes: Math.max(0, minutes) } : item,
        ),
      })),
    );
  }, [commit]);

  const removeReview = useCallback((entryId: string) => {
    commit((current) =>
      updateTodayLog(current, (log) => ({
        ...log,
        reviews: log.reviews.filter((item) => item.id !== entryId),
      })),
    );
  }, [commit]);

  return {
    hydrated,
    today,
    now,
    day,
    store,
    running,
    addProject,
    removeProject,
    addTimed,
    togglePause,
    complete,
    setMinutes,
    removeTimed,
    addReview,
    updateReview,
    removeReview,
  };
}

export type WorkLogController = ReturnType<typeof useWorkLog>;
