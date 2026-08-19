import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { DateRangePicker } from "@/components/ui/DateRangePicker";
import {
  formatDisplayDate,
  getLocalRetentionCutoffIso,
  getTodayIsoDate,
} from "@/lib/date";
import { formatHoursFromMinutes, formatMinutesShort } from "@/lib/duration";
import { cn } from "@/lib/utils";
import { subscribeActivityChanged } from "@/lib/activityEvents";
import { STORAGE_KEYS } from "@/lib/storage";
import { TIME_TRACKING_RETENTION_DAYS } from "@/features/time-tracking/types";
import { ActivityChart } from "./ActivityChart";
import {
  loadHomeInsights,
  resolveInsightRange,
  type HomeInsightsData,
  type InsightRange,
} from "../insights";

const RANGE_OPTIONS: { id: InsightRange; label: string }[] = [
  { id: "7d", label: "7 Days" },
  { id: "30d", label: "30 Days" },
  { id: "month", label: "This Month" },
  { id: "all", label: "All Time" },
  { id: "custom", label: "Custom Range" },
];

function percent(part: number, total: number): string {
  if (total <= 0) {
    return "0%";
  }
  return `${Math.round((part / total) * 1000) / 10}%`;
}

function ChartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5" aria-hidden>
      <path strokeLinecap="round" d="M4 19V9M10 19V5M16 19v-7M22 19H2" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function FolderIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
    </svg>
  );
}

function RateIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 15l6-6 4 4 6-6" />
    </svg>
  );
}

function RefreshIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={cn("h-4 w-4", className)}
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v6h6M20 20v-6h-6" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 9A8 8 0 006.3 6.3M4 15a8 8 0 0013.7 2.7" />
    </svg>
  );
}

function MetricCard({
  label,
  value,
  hint,
  icon,
  tone,
}: {
  label: string;
  value: string;
  hint: string;
  icon: ReactNode;
  tone: string;
}) {
  return (
    <Card className="flex items-start gap-3 p-4 sm:p-4">
      <div
        className={cn(
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
          tone,
        )}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-muted">{label}</p>
        <p className="mt-0.5 text-2xl font-bold tabular-nums text-text">{value}</p>
        <p className="mt-0.5 text-xs text-muted">{hint}</p>
      </div>
    </Card>
  );
}

function readInsights(
  range: InsightRange,
  custom: { from: string; to: string } | null,
  today = getTodayIsoDate(),
): HomeInsightsData {
  const bounds = resolveInsightRange(range, today, custom);
  return loadHomeInsights(bounds.from, bounds.to, today);
}

export function HomeInsights() {
  const [today, setToday] = useState(() => getTodayIsoDate());
  const cutoff = getLocalRetentionCutoffIso(TIME_TRACKING_RETENTION_DAYS, today);
  const [range, setRange] = useState<InsightRange>("30d");
  const [custom, setCustom] = useState<{ from: string; to: string } | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [data, setData] = useState<HomeInsightsData>(() => readInsights("30d", null));
  const [refreshTick, setRefreshTick] = useState(0);

  const bounds = useMemo(
    () => resolveInsightRange(range, today, custom),
    [range, today, custom],
  );

  const reload = useCallback(() => {
    const currentToday = getTodayIsoDate();
    setToday(currentToday);
    setData(readInsights(range, custom, currentToday));
  }, [range, custom]);

  function refresh() {
    reload();
    setRefreshTick((tick) => tick + 1);
  }

  useEffect(() => {
    reload();
  }, [reload]);

  useEffect(() => {
    document.addEventListener("astro:page-load", reload);
    const unsubscribe = subscribeActivityChanged(reload);
    function onStorage(event: StorageEvent) {
      if (
        event.key === STORAGE_KEYS.timeTracking ||
        event.key === STORAGE_KEYS.workLog
      ) {
        reload();
      }
    }
    window.addEventListener("storage", onStorage);
    function onVisible() {
      if (document.visibilityState === "visible") {
        reload();
      }
    }
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      document.removeEventListener("astro:page-load", reload);
      unsubscribe();
      window.removeEventListener("storage", onStorage);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [reload]);

  const taskTotal = data.taskRatio.completed + data.taskRatio.open;

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-text">Activity at a glance</h2>
          <p className="text-sm text-muted">
            Everything tracked in this browser · {formatDisplayDate(data.from)}
            {data.from !== data.to ? ` – ${formatDisplayDate(data.to)}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {RANGE_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => {
                setRange(option.id);
                if (option.id === "custom") {
                  setPickerOpen(true);
                }
              }}
              className={cn(
                "min-h-9 cursor-pointer rounded-xl px-3 text-sm font-medium transition-colors",
                range === option.id
                  ? "bg-primary text-on-primary shadow-sm"
                  : "bg-background text-muted ring-1 ring-border hover:bg-surface hover:text-text",
              )}
            >
              {option.label}
            </button>
          ))}
          <Button
            key={refreshTick}
            size="sm"
            variant="secondary"
            onClick={refresh}
            aria-label="Refresh activity"
            className={refreshTick > 0 ? "refresh-btn-pulse" : undefined}
          >
            <RefreshIcon className={refreshTick > 0 ? "refresh-spin" : undefined} />
            Refresh
          </Button>
        </div>
      </div>

      {range === "custom" ? (
        <div className="max-w-lg">
          <DateRangePicker
            id="activity-custom-range"
            from={custom?.from ?? bounds.from}
            to={custom?.to ?? bounds.to}
            min={cutoff}
            max={today}
            today={today}
            open={pickerOpen}
            onOpenChange={setPickerOpen}
            onChange={(from, to) => setCustom({ from, to })}
          />
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Hours tracked"
          value={`${formatHoursFromMinutes(data.minutes)} hrs`}
          hint={`${formatMinutesShort(data.minutes)} across the range`}
          icon={<ChartIcon />}
          tone="bg-primary/15 text-primary"
        />
        <MetricCard
          label="Tasks completed"
          value={String(data.completedTasks)}
          hint={`${data.openTasks} still open`}
          icon={<CheckIcon />}
          tone="bg-success/15 text-success"
        />
        <MetricCard
          label="Projects worked"
          value={String(data.projects)}
          hint={`${data.projectRatio.inProgress} still in progress`}
          icon={<FolderIcon />}
          tone="bg-accent-warm/15 text-accent-warm"
        />
        <MetricCard
          label="Completion rate"
          value={percent(data.taskRatio.completed, taskTotal)}
          hint={`${taskTotal} task${taskTotal === 1 ? "" : "s"} in this range`}
          icon={<RateIcon />}
          tone="bg-accent-cool/15 text-accent-cool"
        />
      </div>

      <Card>
        <ActivityChart days={data.days} />
        {!data.hasActivity ? (
          <p className="mt-3 rounded-xl bg-background px-3 py-2 text-sm text-muted">
            No activity in this range yet. Track time or complete tasks and it
            will show up here.
          </p>
        ) : null}
      </Card>
    </section>
  );
}
