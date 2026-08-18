import { useEffect, useId, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatDisplayDate, formatShortMonthDay } from "@/lib/date";
import { formatHoursFromMinutes } from "@/lib/duration";
import { cn } from "@/lib/utils";
import type { InsightDay } from "../insights";

export const SERIES = [
  { key: "projects" as const, label: "Projects", color: "#2dd4bf" },
  { key: "completedTasks" as const, label: "Tasks completed", color: "#fbbf24" },
] as const;

type SeriesKey = (typeof SERIES)[number]["key"];

interface ChartRow {
  date: string;
  label: string;
  projects: number;
  completedTasks: number;
  openTasks: number;
  minutes: number;
  isToday: boolean;
}

interface ThemeTokens {
  muted: string;
  grid: string;
}

function readTheme(): ThemeTokens {
  if (typeof document === "undefined") {
    return { muted: "#64748b", grid: "rgba(148,163,184,0.28)" };
  }
  const root = document.documentElement;
  const styles = getComputedStyle(root);
  const muted = styles.getPropertyValue("--color-muted").trim() || "#64748b";
  const isDark = root.getAttribute("data-theme") === "dark";
  return {
    muted,
    grid: isDark ? "rgba(168,180,208,0.22)" : "rgba(148,163,184,0.35)",
  };
}

function dayRate(day: Pick<ChartRow, "completedTasks" | "openTasks">): string {
  const total = day.completedTasks + day.openTasks;
  if (total <= 0) {
    return "0%";
  }
  return `${Math.round((day.completedTasks / total) * 1000) / 10}%`;
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduced(media.matches);
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, []);
  return reduced;
}

function GlowCursor({ points }: { points?: Array<{ x: number; y: number }> }) {
  const start = points?.[0];
  const end = points?.[1];
  if (!start || !end) {
    return null;
  }
  const x = start.x;
  const top = Math.min(start.y, end.y);
  const height = Math.abs(end.y - start.y);
  return (
    <g pointerEvents="none">
      <defs>
        <linearGradient id="activityCursorBeam" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0" />
          <stop offset="45%" stopColor="var(--color-primary)" stopOpacity="0.2" />
          <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect
        x={x - 20}
        y={top}
        width={40}
        height={height}
        rx={20}
        fill="url(#activityCursorBeam)"
      />
      <line
        x1={x}
        y1={top}
        x2={x}
        y2={top + height}
        stroke="var(--color-primary)"
        strokeOpacity={0.65}
        strokeWidth={1.5}
        strokeDasharray="3 8"
        strokeLinecap="round"
      />
    </g>
  );
}

function SeriesDot({
  cx,
  cy,
  fill,
  payload,
  r = 4,
  active = false,
}: {
  cx?: number;
  cy?: number;
  fill?: string;
  payload?: ChartRow;
  r?: number;
  active?: boolean;
}) {
  if (cx == null || cy == null || !fill) {
    return null;
  }
  const pulse = Boolean(payload?.isToday);
  const radius = active ? r + 1.5 : r;
  return (
    <g>
      {pulse ? (
        <circle
          cx={cx}
          cy={cy}
          r={radius + 5}
          fill={fill}
          className="activity-pulse-ring"
        />
      ) : null}
      <circle
        cx={cx}
        cy={cy}
        r={radius + 3}
        fill={fill}
        opacity={active ? 0.22 : 0.12}
      />
      <circle
        cx={cx}
        cy={cy}
        r={radius}
        fill={fill}
        stroke="var(--color-surface)"
        strokeWidth={2}
      />
    </g>
  );
}

function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload?: ChartRow }>;
}) {
  if (!active || !payload?.length) {
    return null;
  }
  const day = payload[0]?.payload as ChartRow | undefined;
  if (!day) {
    return null;
  }

  return (
    <div className="w-[13.75rem] rounded-2xl border border-border/80 bg-surface/90 p-3.5 shadow-[var(--c-shadow)] backdrop-blur-xl">
      <p className="mb-3 flex items-center gap-2 text-xs font-semibold text-text">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5 text-muted" aria-hidden>
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M3 10h18M8 3v4M16 3v4" />
        </svg>
        {formatDisplayDate(day.date)}
        {day.isToday ? (
          <span className="rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
            Today
          </span>
        ) : null}
      </p>
      <ul className="space-y-1.5">
        {SERIES.map((item) => (
          <li
            key={item.key}
            className="flex items-center justify-between gap-4 text-xs text-muted"
          >
            <span className="inline-flex items-center gap-2">
              <i
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              {item.label}
            </span>
            <strong className="tabular-nums text-text">{day[item.key]}</strong>
          </li>
        ))}
      </ul>
      <div className="mt-3 flex items-center justify-between gap-3 border-t border-border pt-2.5 text-xs text-muted">
        <span className="shrink-0">{formatHoursFromMinutes(day.minutes)} hrs tracked</span>
        <span className="shrink-0">Done {dayRate(day)}</span>
      </div>
    </div>
  );
}

export function ActivityChart({ days }: { days: InsightDay[] }) {
  const gradientId = useId().replace(/:/g, "");
  const reducedMotion = usePrefersReducedMotion();
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<ThemeTokens>(readTheme);
  const [hidden, setHidden] = useState<Record<SeriesKey, boolean>>({
    projects: false,
    completedTasks: false,
  });
  const [flipTip, setFlipTip] = useState(false);

  useEffect(() => {
    setMounted(true);
    const root = document.documentElement;
    const apply = () => setTheme(readTheme());
    apply();
    const observer = new MutationObserver(apply);
    observer.observe(root, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  const rows = useMemo<ChartRow[]>(
    () =>
      days.map((day) => ({
        date: day.date,
        label: formatShortMonthDay(day.date),
        projects: day.projects,
        completedTasks: day.completedTasks,
        openTasks: day.openTasks,
        minutes: day.minutes,
        isToday: day.isToday,
      })),
    [days],
  );

  const chartKey = `${rows[0]?.date ?? "empty"}-${rows.length}`;
  const showAllDots = rows.length <= 10;

  return (
    <div className="activity-chart">
      <div className="mb-4 flex flex-col gap-3 sm:mb-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-base font-semibold tracking-tight text-text">
            Performance activity
          </h3>
          <p className="mt-1 text-sm text-muted">
            Daily rhythm of projects and finished tasks.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {SERIES.map((item) => {
            const on = !hidden[item.key];
            return (
              <button
                key={item.key}
                type="button"
                aria-pressed={on}
                onClick={() =>
                  setHidden((current) => {
                    const next = { ...current, [item.key]: !current[item.key] };
                    if (SERIES.every((series) => next[series.key])) {
                      return current;
                    }
                    return next;
                  })
                }
                className={cn(
                  "inline-flex min-h-9 cursor-pointer items-center gap-2 rounded-full border px-3 text-xs font-medium transition-all duration-200",
                  on
                    ? "text-text shadow-sm"
                    : "border-border bg-transparent text-muted opacity-45",
                )}
                style={
                  on
                    ? {
                        borderColor: `${item.color}88`,
                        background: `color-mix(in srgb, ${item.color} 16%, transparent)`,
                      }
                    : undefined
                }
              >
                <span
                  className="h-2 w-2 rounded-full shadow-[0_0_10px_currentColor]"
                  style={{ backgroundColor: item.color, color: item.color }}
                />
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="relative overflow-visible rounded-2xl bg-background/55 ring-1 ring-border/70">
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl" aria-hidden>
          <div className="activity-chart-orbs">
            <span className="activity-orb-a" />
            <span className="activity-orb-b" />
            <span className="activity-orb-c" />
          </div>
        </div>

        <div className="relative h-[15.75rem] touch-pan-y px-1 pt-3 sm:h-[21rem] sm:px-2">
          {mounted ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
              key={chartKey}
              data={rows}
              margin={{ top: 12, right: 12, left: 0, bottom: 4 }}
              onMouseMove={(state) => {
                const raw = state.activeTooltipIndex;
                const index =
                  typeof raw === "number"
                    ? raw
                    : typeof raw === "string"
                      ? Number(raw)
                      : Number.NaN;
                if (!Number.isFinite(index) || rows.length === 0) {
                  return;
                }
                const flipAfter = Math.max(
                  0,
                  rows.length - Math.max(2, Math.ceil(rows.length * 0.3)),
                );
                setFlipTip(index >= flipAfter);
              }}
            >
              <defs>
                {SERIES.map((item) => (
                  <linearGradient
                    key={item.key}
                    id={`${gradientId}-${item.key}`}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor={item.color} stopOpacity={0.42} />
                    <stop offset="58%" stopColor={item.color} stopOpacity={0.12} />
                    <stop offset="100%" stopColor={item.color} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid
                vertical={false}
                stroke={theme.grid}
                strokeDasharray="4 8"
              />
              <XAxis
                dataKey="label"
                tick={{ fill: theme.muted, fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                minTickGap={22}
                interval="preserveStartEnd"
                tickMargin={8}
              />
              <YAxis
                width={28}
                allowDecimals={false}
                tick={{ fill: theme.muted, fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                domain={[0, (max: number) => Math.max(4, Math.ceil(max * 1.2))]}
              />
              <Tooltip
                content={ChartTooltip}
                cursor={<GlowCursor />}
                offset={12}
                allowEscapeViewBox={{ x: false, y: false }}
                reverseDirection={{ x: flipTip, y: false }}
                wrapperStyle={{ outline: "none", zIndex: 30, pointerEvents: "none" }}
                animationDuration={reducedMotion ? 0 : 180}
              />
              {SERIES.map((item, index) => (
                <Area
                  key={item.key}
                  type="monotone"
                  dataKey={item.key}
                  name={item.label}
                  hide={hidden[item.key]}
                  stroke={item.color}
                  fill={`url(#${gradientId}-${item.key})`}
                  strokeWidth={2.6}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  dot={(props) => {
                    const point = props.payload as ChartRow | undefined;
                    if (!showAllDots && !point?.isToday) {
                      return <g key={`${item.key}-${props.index ?? point?.date ?? "dot"}`} />;
                    }
                    return (
                      <SeriesDot
                        key={`${item.key}-${props.index ?? point?.date ?? "dot"}`}
                        cx={props.cx}
                        cy={props.cy}
                        fill={item.color}
                        payload={point}
                      />
                    );
                  }}
                  activeDot={(props) => (
                    <SeriesDot
                      cx={props.cx}
                      cy={props.cy}
                      fill={item.color}
                      payload={props.payload as ChartRow | undefined}
                      active
                    />
                  )}
                  isAnimationActive={!reducedMotion}
                  animationBegin={index * 160}
                  animationDuration={1100}
                  animationEasing="ease-out"
                />
              ))}
            </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div
              className="h-full animate-pulse rounded-2xl bg-background/50"
              aria-hidden
            />
          )}
        </div>
      </div>
    </div>
  );
}
