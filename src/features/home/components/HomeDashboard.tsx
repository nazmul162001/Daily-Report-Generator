import { Card } from "@/components/ui/Card";
import {
  IconDailyReport,
  IconDetailedReport,
  IconTimeTracking,
  IconTodayTask,
} from "@/components/icons/AppIcons";
import type { ComponentType } from "react";

const reportCards: {
  href: string;
  title: string;
  description: string;
  Icon: ComponentType<{ className?: string }>;
  iconWrap: string;
  iconColor: string;
}[] = [
  {
    href: "/today-task",
    title: "Today's Task",
    description: "Plan today's CMS tasks with a clean arrow list.",
    Icon: IconTodayTask,
    // Soft amber/sky — plan your day
    iconWrap: "bg-sky-500/12 ring-1 ring-sky-500/15 dark:bg-sky-400/15 dark:ring-sky-300/20",
    iconColor: "text-sky-600 dark:text-sky-300",
  },
  {
    href: "/daily-report",
    title: "Daily Report",
    description: "End-of-day update with statuses for each task.",
    Icon: IconDailyReport,
    // Soft emerald — completion / status
    iconWrap:
      "bg-emerald-500/12 ring-1 ring-emerald-500/15 dark:bg-emerald-400/15 dark:ring-emerald-300/20",
    iconColor: "text-emerald-600 dark:text-emerald-300",
  },
  {
    href: "/detailed-report",
    title: "Detailed Report",
    description: "Work breakdown, goals, and stakeholder mentions.",
    Icon: IconDetailedReport,
    // Soft violet — analysis / depth
    iconWrap:
      "bg-violet-500/12 ring-1 ring-violet-500/15 dark:bg-violet-400/15 dark:ring-violet-300/20",
    iconColor: "text-violet-600 dark:text-violet-300",
  },
  {
    href: "/time-tracking",
    title: "Time Tracking",
    description: "Track project tasks with timers. Totals default today's Revision.",
    Icon: IconTimeTracking,
    iconWrap:
      "bg-amber-500/12 ring-1 ring-amber-500/15 dark:bg-amber-400/15 dark:ring-amber-300/20",
    iconColor: "text-amber-600 dark:text-amber-300",
  },
];

export function HomeDashboard() {
  return (
    <div className="space-y-8">
      <section
        className="relative overflow-hidden rounded-3xl border border-border bg-surface px-5 py-8 sm:px-8 sm:py-10"
        style={{ boxShadow: "var(--c-shadow)" }}
      >
        <div
          className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full opacity-70 blur-3xl"
          style={{
            background:
              "radial-gradient(circle, color-mix(in srgb, var(--color-primary) 35%, transparent), transparent 70%)",
          }}
          aria-hidden
        />
        <p className="relative text-sm font-medium text-primary">
          Productivity toolkit
        </p>
        <h1 className="relative mt-2 text-3xl font-bold tracking-tight text-text sm:text-4xl">
          Daily Report Generator
        </h1>
        <p className="relative mt-3 max-w-2xl text-base text-muted sm:text-lg">
          Create, preview and copy your daily work reports in seconds.
        </p>
        <div className="relative mt-6 flex flex-wrap gap-3">
          <a
            href="/today-task"
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-medium text-white shadow-sm ring-1 ring-primary/25 transition-colors hover:bg-primary-hover"
          >
            Start with Today&apos;s Task
          </a>
          <a
            href="/saved"
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-border bg-background/80 px-5 text-sm font-medium text-text shadow-sm transition-colors hover:bg-background"
          >
            View saved reports
          </a>
        </div>
      </section>

      <section>
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-text">Get started</h2>
          <p className="text-sm text-muted">
            Choose a template or open Time Tracking — preview and totals update live.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {reportCards.map((card) => (
            <Card
              key={card.href}
              className="group flex flex-col transition-shadow hover:shadow-md"
            >
              <div
                className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl transition-transform duration-200 group-hover:scale-105 ${card.iconWrap} ${card.iconColor}`}
              >
                <card.Icon className="h-6 w-6" />
              </div>
              <h3 className="text-base font-semibold text-text">{card.title}</h3>
              <p className="mt-2 flex-1 text-sm text-muted">{card.description}</p>
              <a
                href={card.href}
                className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-hover"
              >
                Open
              </a>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
