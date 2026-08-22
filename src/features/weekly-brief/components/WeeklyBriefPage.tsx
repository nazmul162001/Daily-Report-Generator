import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { ToastProvider, useToast } from "@/components/ui/Toast";
import { formatDisplayDate, formatShortMonthDay } from "@/lib/date";
import { formatHoursFromMinutes, formatMinutesShort } from "@/lib/duration";
import { subscribeActivityChanged } from "@/lib/activityEvents";
import { copyToClipboard } from "@/lib/clipboard";
import { getUserName } from "@/lib/userName";
import { cn } from "@/lib/utils";
import { formatWeeklyBrief, formatWeeklyBriefHtml } from "../formatBrief";
import { loadWeeklyBrief } from "../loadBrief";
import type { BriefPeriod, BriefSignal, WeeklyBriefData } from "../types";

const PERIODS: { id: BriefPeriod; label: string }[] = [
  { id: "this-week", label: "This week" },
  { id: "last-week", label: "Last week" },
  { id: "7d", label: "7 days" },
  { id: "14d", label: "14 days" },
];

const NOTE_KEY = "drg:weekly-brief:note";

function readNote(): string {
  try {
    return sessionStorage.getItem(NOTE_KEY) ?? "";
  } catch {
    return "";
  }
}

function writeNote(value: string) {
  try {
    sessionStorage.setItem(NOTE_KEY, value);
  } catch {
    /* ignore */
  }
}

function Metric({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="min-w-0 rounded-xl border border-border bg-background/50 px-3.5 py-3">
      <p className="text-xs font-medium text-muted">{label}</p>
      <p className="mt-0.5 text-xl font-bold tabular-nums text-text sm:text-2xl">
        {value}
      </p>
      <p className="mt-0.5 text-xs text-muted">{hint}</p>
    </div>
  );
}

function SignalCard({ signal }: { signal: BriefSignal }) {
  const tone =
    signal.tone === "positive"
      ? "border-success/30 bg-success/10"
      : signal.tone === "attention"
        ? "border-warning/30 bg-warning/10"
        : "border-primary/30 bg-primary/10";

  return (
    <div className={cn("rounded-xl border px-3.5 py-3", tone)}>
      <p className="text-sm font-semibold text-text">{signal.label}</p>
      <p className="mt-1 text-xs leading-snug text-muted">{signal.detail}</p>
    </div>
  );
}

function BarList({
  title,
  empty,
  items,
}: {
  title: string;
  empty: string;
  items: {
    key: string;
    label: string;
    value: string;
    percent: number;
    meta?: string;
  }[];
}) {
  if (items.length === 0) {
    return (
      <div>
        <h3 className="text-sm font-semibold text-text">{title}</h3>
        <p className="mt-2 text-xs text-muted">{empty}</p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-sm font-semibold text-text">{title}</h3>
      <ul className="mt-3 flex flex-col gap-3" aria-label={title}>
        {items.map((item) => (
          <li key={item.key}>
            <div className="mb-1 flex items-baseline justify-between gap-2">
              <span className="min-w-0 truncate text-sm font-medium text-text">
                {item.label}
              </span>
              <span className="shrink-0 text-xs tabular-nums text-muted">
                {item.value}
                {item.meta ? ` · ${item.meta}` : ""}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-background">
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-300"
                style={{
                  width: `${Math.max(item.percent, item.percent > 0 ? 4 : 0)}%`,
                }}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function CopyIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-[1.15rem] w-[1.15rem]"
      aria-hidden
    >
      <rect x="9" y="9" width="11" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      className="h-[1.15rem] w-[1.15rem]"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M5 12.5l4.2 4.2L19 7.5"
      />
    </svg>
  );
}

/** Attractive document-style preview — no markdown asterisks. */
function BriefDocumentPreview({
  brief,
  userName,
  note,
  plainText,
  htmlText,
}: {
  brief: WeeklyBriefData;
  userName: string;
  note: string;
  plainText: string;
  htmlText: string;
}) {
  const { showToast } = useToast();
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<number | null>(null);
  const displayName = userName.trim() || "Team member";
  const canCopy = plainText.trim().length > 0;

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  async function handleCopy() {
    if (!canCopy) {
      showToast("Nothing to copy.", "error");
      return;
    }
    const result = await copyToClipboard(plainText, htmlText);
    if (!result.success) {
      showToast(result.error, "error");
      return;
    }
    setCopied(true);
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
    }
    timerRef.current = window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <Card className="sticky top-[4.75rem] z-20 flex h-fit max-h-[calc(100vh-5.5rem)] flex-col overflow-hidden bg-surface sm:top-20 sm:max-h-[calc(100vh-6rem)]">
      <div className="mb-3 flex shrink-0 flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold text-text sm:text-lg">
            Brief copy
          </h2>
          <p className="mt-0.5 text-xs text-muted">
            Full detail · {plainText.length} characters
          </p>
        </div>
      </div>

      <div
        className={cn(
          "relative min-h-0 flex-1 overflow-hidden rounded-xl border bg-background",
          copied ? "copy-preview-flash border-success/40" : "border-border",
        )}
      >
        <div
          className="max-h-full min-h-0 space-y-4 overflow-auto p-4 pb-14 sm:p-5 sm:pb-16"
          aria-label="Weekly brief preview"
        >
          <header className="border-b border-border pb-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">
              Weekly Brief
            </p>
            <p className="mt-1 text-lg font-semibold text-text">{displayName}</p>
            <p className="mt-0.5 text-sm text-muted">
              {formatDisplayDate(brief.from)}
              {brief.from !== brief.to
                ? ` → ${formatDisplayDate(brief.to)}`
                : ""}
            </p>
          </header>

          {!brief.hasActivity ? (
            <p className="text-sm text-muted">
              No tracked activity in this period yet.
            </p>
          ) : (
            <>
              <section>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Snapshot
                </h3>
                <ul className="mt-2 space-y-1.5 text-sm text-text">
                  <li>
                    <span className="text-muted">Hours logged:</span>{" "}
                    <span className="font-semibold tabular-nums">
                      {formatHoursFromMinutes(brief.minutes)} h
                    </span>{" "}
                    <span className="text-muted">
                      ({formatMinutesShort(brief.minutes)})
                    </span>
                  </li>
                  <li>
                    <span className="text-muted">Avg / active day:</span>{" "}
                    <span className="font-semibold tabular-nums">
                      {brief.avgHoursPerActiveDay} h
                    </span>
                    <span className="text-muted">
                      {" "}
                      · calendar avg {brief.avgHoursPerDay} h
                    </span>
                  </li>
                  <li>
                    <span className="text-muted">Active days:</span>{" "}
                    <span className="font-semibold tabular-nums">
                      {brief.activeDays}/{brief.totalDays}
                    </span>
                    <span className="text-muted">
                      {" "}
                      ({brief.consistencyPercent}% consistency)
                    </span>
                  </li>
                  <li>
                    <span className="text-muted">Tasks:</span>{" "}
                    <span className="font-semibold">
                      {brief.completedTasks} completed · {brief.openTasks} open
                    </span>
                    <span className="text-muted">
                      {" "}
                      ({brief.completionRate}% done)
                    </span>
                  </li>
                  <li>
                    <span className="text-muted">Projects:</span>{" "}
                    <span className="font-semibold">
                      {brief.projects} touched
                    </span>
                    <span className="text-muted">
                      {" "}
                      · {brief.finishedProjects} finished ·{" "}
                      {brief.inProgressProjects} in progress
                    </span>
                  </li>
                </ul>
              </section>

              <section>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Daily breakdown
                </h3>
                <ul className="mt-2 divide-y divide-border overflow-hidden rounded-xl border border-border">
                  {brief.days.map((day) => {
                    const empty =
                      day.minutes <= 0 &&
                      day.completedTasks <= 0 &&
                      day.openTasks <= 0;
                    return (
                      <li
                        key={day.date}
                        className={cn(
                          "flex items-center justify-between gap-3 px-3 py-2 text-sm",
                          day.isPeak && "bg-primary/8",
                        )}
                      >
                        <span className="min-w-0 font-medium text-text">
                          {formatShortMonthDay(day.date)}
                          {day.isToday ? (
                            <span className="ml-1.5 text-[10px] font-semibold uppercase text-primary">
                              Today
                            </span>
                          ) : null}
                          {day.isPeak ? (
                            <span className="ml-1.5 text-[10px] font-semibold uppercase text-accent-warm">
                              Peak
                            </span>
                          ) : null}
                        </span>
                        {empty ? (
                          <span className="text-xs text-muted">—</span>
                        ) : (
                          <span className="shrink-0 text-right text-xs tabular-nums text-muted">
                            <span className="font-semibold text-text">
                              {formatMinutesShort(day.minutes)}
                            </span>
                            <span className="mx-1 text-border">·</span>
                            {day.completedTasks}d / {day.openTasks}o
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </section>

              {brief.categories.length > 0 ? (
                <section>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">
                    Where time went
                  </h3>
                  <ul className="mt-2 space-y-2">
                    {brief.categories.map((slice) => (
                      <li key={slice.kind}>
                        <div className="mb-1 flex justify-between gap-2 text-sm">
                          <span className="font-medium text-text">
                            {slice.label}
                          </span>
                          <span className="tabular-nums text-muted">
                            {formatMinutesShort(slice.minutes)} · {slice.percent}%
                          </span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-surface">
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{
                              width: `${Math.max(slice.percent, 3)}%`,
                            }}
                          />
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              {brief.topProjects.length > 0 ? (
                <section>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">
                    Projects
                  </h3>
                  <ul className="mt-2 space-y-1.5 text-sm">
                    {brief.topProjects.map((project) => (
                      <li
                        key={project.name}
                        className="flex items-baseline justify-between gap-2"
                      >
                        <span className="min-w-0 truncate font-medium text-text">
                          {project.name}
                        </span>
                        <span className="shrink-0 tabular-nums text-muted">
                          {formatMinutesShort(project.minutes)}
                          {project.completedTasks + project.openTasks > 0
                            ? ` · ${project.completedTasks}/${project.completedTasks + project.openTasks}`
                            : ""}
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              {brief.signals.length > 0 ? (
                <section>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">
                    Key signals
                  </h3>
                  <ul className="mt-2 space-y-2">
                    {brief.signals.map((signal) => (
                      <li
                        key={signal.id}
                        className="rounded-lg border border-border/80 bg-surface/60 px-3 py-2"
                      >
                        <p className="text-sm font-semibold text-text">
                          {signal.label}
                        </p>
                        <p className="mt-0.5 text-xs text-muted">
                          {signal.detail}
                        </p>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              {(brief.peakDay || brief.quietDay) && (
                <section className="flex flex-wrap gap-x-4 gap-y-1 border-t border-border pt-3 text-xs text-muted">
                  {brief.peakDay ? (
                    <span>
                      Peak:{" "}
                      <span className="font-medium text-text">
                        {formatShortMonthDay(brief.peakDay.date)}
                      </span>{" "}
                      ({formatMinutesShort(brief.peakDay.minutes)})
                    </span>
                  ) : null}
                  {brief.quietDay ? (
                    <span>
                      Lightest:{" "}
                      <span className="font-medium text-text">
                        {formatShortMonthDay(brief.quietDay.date)}
                      </span>{" "}
                      ({formatMinutesShort(brief.quietDay.minutes)})
                    </span>
                  ) : null}
                </section>
              )}

              {note.trim() ? (
                <section className="rounded-xl border border-primary/25 bg-primary/8 px-3.5 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                    Note
                  </p>
                  <p className="mt-1 text-sm text-text">{note.trim()}</p>
                </section>
              ) : null}
            </>
          )}
        </div>

        <button
          type="button"
          onClick={handleCopy}
          disabled={!canCopy}
          aria-label={copied ? "Copied to clipboard" : "Copy brief to clipboard"}
          title="Copy brief"
          className={cn(
            "copy-icon-btn z-10 inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border shadow-sm backdrop-blur-md transition-all duration-200",
            copied
              ? "border-success/35 bg-success/15 text-success"
              : "border-border bg-surface/88 text-muted hover:border-primary/35 hover:bg-primary/10 hover:text-primary active:scale-95",
            "disabled:cursor-not-allowed disabled:opacity-40",
          )}
        >
          <span key={copied ? "check" : "copy"} className="copy-icon-swap">
            {copied ? <CheckIcon /> : <CopyIcon />}
          </span>
          {copied ? (
            <>
              <span className="copy-burst" aria-hidden />
              <span className="copy-spark copy-spark-1" aria-hidden />
              <span className="copy-spark copy-spark-2" aria-hidden />
              <span className="copy-spark copy-spark-3" aria-hidden />
              <span className="copy-spark copy-spark-4" aria-hidden />
            </>
          ) : null}
        </button>
        {copied ? (
          <span className="copy-chip pointer-events-none z-10 rounded-full bg-success/15 px-2 py-1 text-[11px] font-semibold text-success">
            Copied
          </span>
        ) : null}
      </div>
    </Card>
  );
}

function BriefBody({
  brief,
  period,
  onPeriod,
  note,
  onNote,
  userName,
  plainText,
  htmlText,
}: {
  brief: WeeklyBriefData;
  period: BriefPeriod;
  onPeriod: (id: BriefPeriod) => void;
  note: string;
  onNote: (value: string) => void;
  userName: string;
  plainText: string;
  htmlText: string;
}) {
  const maxDayMinutes = Math.max(...brief.days.map((d) => d.minutes), 1);

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
      <div className="flex flex-col gap-4">
        <Card>
          <CardHeader
            title="Weekly Brief"
            description="Full weekly report from your tracked work — hours, daily breakdown, focus, projects, and signals. Copy for Slack or email."
          />

          <div
            className="mb-4 flex flex-wrap gap-1.5"
            role="tablist"
            aria-label="Brief period"
          >
            {PERIODS.map((option) => (
              <button
                key={option.id}
                type="button"
                role="tab"
                aria-selected={period === option.id}
                onClick={() => onPeriod(option.id)}
                className={cn(
                  "rounded-xl px-3 py-1.5 text-sm font-medium transition-colors",
                  period === option.id
                    ? "bg-primary text-on-primary shadow-sm"
                    : "bg-background text-muted hover:text-text",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>

          <p className="mb-4 text-xs text-muted">
            {formatDisplayDate(brief.from)}
            {brief.from !== brief.to ? ` → ${formatDisplayDate(brief.to)}` : ""}
            {" · "}
            {brief.periodLabel}
          </p>

          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            <Metric
              label="Hours"
              value={formatHoursFromMinutes(brief.minutes)}
              hint={formatMinutesShort(brief.minutes)}
            />
            <Metric
              label="Avg / active day"
              value={`${brief.avgHoursPerActiveDay}`}
              hint={`${brief.activeDays}/${brief.totalDays} days`}
            />
            <Metric
              label="Completion"
              value={`${brief.completionRate}%`}
              hint={`${brief.completedTasks} done · ${brief.openTasks} open`}
            />
            <Metric
              label="Consistency"
              value={`${brief.consistencyPercent}%`}
              hint={`${brief.projects} project${brief.projects === 1 ? "" : "s"}`}
            />
          </div>
        </Card>

        <Card>
          <h3 className="text-sm font-semibold text-text">Daily breakdown</h3>
          <p className="mt-1 text-xs text-muted">
            Minutes and tasks for each day in this range.
          </p>
          <ul className="mt-3 flex flex-col gap-2" aria-label="Daily breakdown">
            {brief.days.map((day) => {
              const empty =
                day.minutes <= 0 &&
                day.completedTasks <= 0 &&
                day.openTasks <= 0;
              const width = empty
                ? 0
                : Math.max((day.minutes / maxDayMinutes) * 100, 6);
              return (
                <li
                  key={day.date}
                  className={cn(
                    "rounded-xl border border-border px-3 py-2.5",
                    day.isPeak && "border-primary/40 bg-primary/5",
                  )}
                >
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-text">
                      {formatShortMonthDay(day.date)}
                      {day.isToday ? (
                        <span className="ml-1.5 text-[10px] font-semibold uppercase text-primary">
                          Today
                        </span>
                      ) : null}
                      {day.isPeak ? (
                        <span className="ml-1.5 text-[10px] font-semibold uppercase text-accent-warm">
                          Peak
                        </span>
                      ) : null}
                    </span>
                    <span className="text-xs tabular-nums text-muted">
                      {empty
                        ? "No activity"
                        : `${formatMinutesShort(day.minutes)} · ${day.completedTasks} done / ${day.openTasks} open`}
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-background">
                    <div
                      className={cn(
                        "h-full rounded-full transition-[width]",
                        day.isPeak ? "bg-accent-warm" : "bg-primary",
                      )}
                      style={{ width: `${width}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>

        <Card>
          <div className="grid gap-6 sm:grid-cols-2">
            <BarList
              title="Where time went"
              empty="No category time logged yet. Use Detailed Report timers."
              items={brief.categories.map((c) => ({
                key: c.kind,
                label: c.label,
                value: formatMinutesShort(c.minutes),
                percent: c.percent,
                meta: `${c.percent}%`,
              }))}
            />
            <BarList
              title="Projects"
              empty="No projects in this range. Track work on Activity or Detailed Report."
              items={brief.topProjects.map((p) => ({
                key: p.name,
                label: p.name,
                value: formatMinutesShort(p.minutes),
                percent: p.percent,
                meta:
                  p.completedTasks + p.openTasks > 0
                    ? `${p.completedTasks}/${p.completedTasks + p.openTasks} done`
                    : undefined,
              }))}
            />
          </div>
        </Card>

        <Card>
          <h3 className="text-sm font-semibold text-text">Key signals</h3>
          <p className="mt-1 text-xs text-muted">
            Auto insights for a quick manager skim.
          </p>
          <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
            {brief.signals.map((signal) => (
              <SignalCard key={signal.id} signal={signal} />
            ))}
          </div>
          {(brief.peakDay || brief.quietDay) && (
            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 border-t border-border pt-3 text-xs text-muted">
              {brief.peakDay ? (
                <span>
                  Peak:{" "}
                  <span className="font-medium text-text">
                    {formatShortMonthDay(brief.peakDay.date)}
                  </span>{" "}
                  ({formatMinutesShort(brief.peakDay.minutes)})
                </span>
              ) : null}
              {brief.quietDay ? (
                <span>
                  Lightest:{" "}
                  <span className="font-medium text-text">
                    {formatShortMonthDay(brief.quietDay.date)}
                  </span>{" "}
                  ({formatMinutesShort(brief.quietDay.minutes)})
                </span>
              ) : null}
            </div>
          )}
        </Card>

        <Card>
          <label htmlFor="brief-note" className="block">
            <span className="text-sm font-semibold text-text">
              Note for manager
            </span>
            <span className="mt-1 block text-xs text-muted">
              Optional one-liner: a win, risk, or ask. Included in the copy.
            </span>
          </label>
          <textarea
            id="brief-note"
            value={note}
            onChange={(event) => onNote(event.target.value)}
            rows={3}
            maxLength={280}
            placeholder="e.g. Blocked on design review for Project X — need decision by Thursday."
            className="mt-3 w-full resize-y rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-text placeholder:text-muted/70 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <p className="mt-1.5 text-right text-[11px] tabular-nums text-muted">
            {note.length}/280
          </p>
        </Card>
      </div>

      <BriefDocumentPreview
        brief={brief}
        userName={userName}
        note={note}
        plainText={plainText}
        htmlText={htmlText}
      />
    </div>
  );
}

function WeeklyBriefInner() {
  const [period, setPeriod] = useState<BriefPeriod>("this-week");
  const [brief, setBrief] = useState<WeeklyBriefData | null>(null);
  const [note, setNote] = useState("");
  const [userName, setUserNameState] = useState("");

  const refresh = useCallback(() => {
    setBrief(loadWeeklyBrief(period));
    setUserNameState(getUserName());
  }, [period]);

  useEffect(() => {
    setNote(readNote());
    refresh();
  }, [refresh]);

  useEffect(() => {
    return subscribeActivityChanged(() => refresh());
  }, [refresh]);

  useEffect(() => {
    function onVis() {
      if (document.visibilityState === "visible") {
        refresh();
      }
    }
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("focus", refresh);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("focus", refresh);
    };
  }, [refresh]);

  function handleNote(value: string) {
    setNote(value);
    writeNote(value);
  }

  const plainText = useMemo(() => {
    if (!brief) {
      return "";
    }
    return formatWeeklyBrief(brief, { userName, note });
  }, [brief, userName, note]);

  const htmlText = useMemo(() => {
    if (!brief) {
      return "";
    }
    return formatWeeklyBriefHtml(brief, { userName, note });
  }, [brief, userName, note]);

  if (!brief) {
    return (
      <Card className="p-6">
        <p className="text-sm text-muted">Loading brief…</p>
      </Card>
    );
  }

  return (
    <BriefBody
      brief={brief}
      period={period}
      onPeriod={setPeriod}
      note={note}
      onNote={handleNote}
      userName={userName}
      plainText={plainText}
      htmlText={htmlText}
    />
  );
}

export function WeeklyBriefPage() {
  return (
    <ToastProvider>
      <WeeklyBriefInner />
    </ToastProvider>
  );
}

export function WeeklyBriefTeaser({ className }: { className?: string }) {
  return (
    <a
      href="/weekly-brief"
      className={cn(
        "group flex items-start gap-3 rounded-2xl border border-border bg-surface p-4 shadow-sm transition-colors hover:border-primary/40 hover:bg-primary/5 [box-shadow:var(--c-shadow)]",
        className,
      )}
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="h-5 w-5"
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4 19V5M4 19h16M8 15V9M12 15v-4M16 15V7"
          />
        </svg>
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-text group-hover:text-primary">
          Weekly Brief
        </span>
        <span className="mt-0.5 block text-xs text-muted">
          Full weekly report — hours, daily breakdown, focus, and signals.
        </span>
      </span>
    </a>
  );
}
