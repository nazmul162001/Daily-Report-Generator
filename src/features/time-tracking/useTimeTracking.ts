import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getTodayIsoDate } from "@/lib/date";
import { createId } from "@/lib/utils";
import {
  emptyStore,
  findRunningTask,
  getDay,
  loadTimeTrackingStore,
  saveTimeTrackingStore,
  updateTodayProjects,
} from "./storage";
import {
  applyEditedMinutes,
  completeTaskFromTimestamps,
  startTaskRun,
} from "./timer";
import { getProjectDurationMs, getProjectsDurationMs } from "./totals";
import type {
  RunningTaskRef,
  TimeTrackingStore,
} from "./types";

export interface PendingSwitch {
  from: RunningTaskRef;
  projectId: string;
  taskId: string;
  taskNumber: string;
}

function persist(store: TimeTrackingStore): TimeTrackingStore {
  return saveTimeTrackingStore(store);
}

export function useTimeTracking() {
  const [store, setStore] = useState<TimeTrackingStore>(emptyStore);
  const [hydrated, setHydrated] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [today, setToday] = useState(() => getTodayIsoDate());
  const [pendingSwitch, setPendingSwitch] = useState<PendingSwitch | null>(
    null,
  );
  const storeRef = useRef(store);
  storeRef.current = store;
  const hydratedRef = useRef(false);

  const commit = useCallback(
    (updater: (current: TimeTrackingStore) => TimeTrackingStore) => {
      if (!hydratedRef.current) {
        return;
      }
      setStore((current) => persist(updater(current)));
    },
    [],
  );

  useEffect(() => {
    const loaded = persist(loadTimeTrackingStore());
    storeRef.current = loaded;
    hydratedRef.current = true;
    setStore(loaded);
    setToday(getTodayIsoDate());
    setNow(Date.now());
    setHydrated(true);
  }, []);

  const running = useMemo(() => findRunningTask(store), [store]);
  const projects = useMemo(
    () => getDay(store, today).projects,
    [store, today],
  );

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
      saveTimeTrackingStore(storeRef.current);
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
  }, []);

  const todayTotalMs = useMemo(
    () => getProjectsDurationMs(projects, now, true),
    [projects, now],
  );

  const addProject = useCallback(
    (name: string, caseNo: string) => {
      const trimmedName = name.trim();
      if (!trimmedName) {
        return;
      }
      commit((current) =>
        updateTodayProjects(current, (list) => [
          ...list,
          {
            id: createId("project"),
            name: trimmedName,
            caseNo: caseNo.trim(),
            createdAt: Date.now(),
            tasks: [],
            note: null,
            noteUpdatedAt: null,
          },
        ]),
      );
    },
    [commit],
  );

  const addTask = useCallback(
    (projectId: string, number: string) => {
      const trimmed = number.trim();
      if (!trimmed) {
        return;
      }
      commit((current) =>
        updateTodayProjects(current, (list) =>
          list.map((project) =>
            project.id === projectId
              ? {
                  ...project,
                  tasks: [
                    ...project.tasks,
                    {
                      id: createId("task"),
                      number: trimmed,
                      status: "idle",
                      startedAt: null,
                      completedAt: null,
                      durationMs: 0,
                      editedMinutes: null,
                    },
                  ],
                }
              : project,
          ),
        ),
      );
    },
    [commit],
  );

  const completeTask = useCallback(
    (projectId: string, taskId: string) => {
      const completedAt = Date.now();
      commit((current) =>
        updateTodayProjects(current, (list) =>
          list.map((project) =>
            project.id === projectId
              ? {
                  ...project,
                  tasks: project.tasks.map((task) =>
                    task.id === taskId && task.status === "running"
                      ? completeTaskFromTimestamps(task, completedAt)
                      : task,
                  ),
                }
              : project,
          ),
        ),
      );
    },
    [commit],
  );

  const startTaskNow = useCallback(
    (projectId: string, taskId: string) => {
      const startedAt = Date.now();
      commit((current) => {
        const active = findRunningTask(current);
        let next = current;
        if (active) {
          next = updateTodayProjects(
            next,
            (list) =>
              list.map((project) =>
                project.id === active.projectId
                  ? {
                      ...project,
                      tasks: project.tasks.map((task) =>
                        task.id === active.taskId && task.status === "running"
                          ? completeTaskFromTimestamps(task, startedAt)
                          : task,
                      ),
                    }
                  : project,
              ),
            active.date,
          );
        }

        return updateTodayProjects(next, (list) =>
          list.map((project) =>
            project.id === projectId
              ? {
                  ...project,
                  tasks: project.tasks.map((task) =>
                    task.id === taskId && task.status === "idle"
                      ? startTaskRun(task, startedAt)
                      : task,
                  ),
                }
              : project,
          ),
        );
      });
      setPendingSwitch(null);
    },
    [commit],
  );

  const requestStart = useCallback(
    (projectId: string, taskId: string): "started" | "needs-confirm" | "ignored" => {
      const project = projects.find((item) => item.id === projectId);
      const task = project?.tasks.find((item) => item.id === taskId);
      if (!project || !task || task.status !== "idle") {
        return "ignored";
      }

      if (running && (running.taskId !== taskId || running.date !== today)) {
        setPendingSwitch({
          from: running,
          projectId,
          taskId,
          taskNumber: task.number,
        });
        return "needs-confirm";
      }

      startTaskNow(projectId, taskId);
      return "started";
    },
    [projects, running, startTaskNow, today],
  );

  const confirmSwitchAndStart = useCallback(() => {
    if (!pendingSwitch) {
      return;
    }
    startTaskNow(pendingSwitch.projectId, pendingSwitch.taskId);
  }, [pendingSwitch, startTaskNow]);

  const cancelSwitch = useCallback(() => {
    setPendingSwitch(null);
  }, []);

  const editTaskMinutes = useCallback(
    (projectId: string, taskId: string, minutes: number) => {
      commit((current) =>
        updateTodayProjects(current, (list) =>
          list.map((project) =>
            project.id === projectId
              ? {
                  ...project,
                  tasks: project.tasks.map((task) =>
                    task.id === taskId
                      ? applyEditedMinutes(task, minutes)
                      : task,
                  ),
                }
              : project,
          ),
        ),
      );
    },
    [commit],
  );

  const saveProjectNote = useCallback(
    (projectId: string, note: string) => {
      const trimmed = note.trim();
      commit((current) =>
        updateTodayProjects(current, (list) =>
          list.map((project) =>
            project.id === projectId
              ? {
                  ...project,
                  note: trimmed || null,
                  noteUpdatedAt: trimmed ? Date.now() : null,
                }
              : project,
          ),
        ),
      );
    },
    [commit],
  );

  const deleteProject = useCallback(
    (projectId: string) => {
      commit((current) =>
        updateTodayProjects(current, (list) =>
          list.filter((project) => project.id !== projectId),
        ),
      );
    },
    [commit],
  );

  const deleteTask = useCallback(
    (projectId: string, taskId: string) => {
      commit((current) =>
        updateTodayProjects(current, (list) =>
          list.map((project) =>
            project.id === projectId
              ? {
                  ...project,
                  tasks: project.tasks.filter((task) => task.id !== taskId),
                }
              : project,
          ),
        ),
      );
    },
    [commit],
  );

  const projectTotalMs = useCallback(
    (projectId: string) => {
      const project = projects.find((item) => item.id === projectId);
      if (!project) {
        return 0;
      }
      return getProjectDurationMs(project, now, true);
    },
    [projects, now],
  );

  return {
    hydrated,
    today,
    now,
    projects,
    running,
    pendingSwitch,
    todayTotalMs,
    addProject,
    addTask,
    requestStart,
    confirmSwitchAndStart,
    cancelSwitch,
    completeTask,
    editTaskMinutes,
    saveProjectNote,
    deleteProject,
    deleteTask,
    projectTotalMs,
  };
}

export type TimeTrackingController = ReturnType<typeof useTimeTracking>;
