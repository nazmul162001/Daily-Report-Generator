import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { formatDateTime, formatDisplayDate } from "@/lib/date";
import { reportRepository } from "@/lib/repository";
import type { SavedReportMeta } from "@/types/common";

const reportCards = [
  {
    href: "/today-task",
    title: "Today's Task",
    description: "Plan today's CMS tasks with a clean arrow list.",
    icon: "T",
  },
  {
    href: "/daily-report",
    title: "Daily Report",
    description: "End-of-day update with statuses for each task.",
    icon: "D",
  },
  {
    href: "/detailed-report",
    title: "Detailed Report",
    description: "Work breakdown, goals, and stakeholder mentions.",
    icon: "R",
  },
] as const;

const typeLabels: Record<SavedReportMeta["type"], string> = {
  "today-task": "Today's Task",
  "daily-report": "Daily Report",
  "detailed-report": "Detailed Report",
};

export function HomeDashboard() {
  const [recent, setRecent] = useState<SavedReportMeta[]>([]);

  useEffect(() => {
    void reportRepository.getReports().then((items) => {
      setRecent(items.slice(0, 3));
    });
  }, []);

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-border bg-surface px-5 py-8 shadow-sm sm:px-8 sm:py-10">
        <p className="text-sm font-medium text-primary">Productivity toolkit</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-text sm:text-4xl">
          Daily Report Generator
        </h1>
        <p className="mt-3 max-w-2xl text-base text-muted sm:text-lg">
          Create, preview and copy your daily work reports in seconds.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <a
            href="/today-task"
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-hover"
          >
            Start with Today&apos;s Task
          </a>
          <a
            href="/saved"
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-border bg-surface px-5 text-sm font-medium text-text shadow-sm transition-colors hover:bg-background"
          >
            View saved reports
          </a>
        </div>
      </section>

      <section>
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-text">Report types</h2>
          <p className="text-sm text-muted">
            Choose a template and fill the form — preview updates live.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {reportCards.map((card) => (
            <Card
              key={card.href}
              className="flex flex-col transition-shadow hover:shadow-md"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-sm font-bold text-primary">
                {card.icon}
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

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="text-base font-semibold text-text">Quick actions</h2>
          <ul className="mt-4 space-y-2">
            <li>
              <a
                href="/today-task"
                className="flex min-h-11 items-center rounded-xl px-3 text-sm font-medium text-text transition-colors hover:bg-background"
              >
                New Today&apos;s Task
              </a>
            </li>
            <li>
              <a
                href="/daily-report"
                className="flex min-h-11 items-center rounded-xl px-3 text-sm font-medium text-text transition-colors hover:bg-background"
              >
                New Daily Report
              </a>
            </li>
            <li>
              <a
                href="/detailed-report"
                className="flex min-h-11 items-center rounded-xl px-3 text-sm font-medium text-text transition-colors hover:bg-background"
              >
                New Detailed Report
              </a>
            </li>
            <li>
              <a
                href="/saved"
                className="flex min-h-11 items-center rounded-xl px-3 text-sm font-medium text-text transition-colors hover:bg-background"
              >
                Browse saved drafts
              </a>
            </li>
          </ul>
          <p className="mt-4 text-xs text-muted">
            Shortcuts: Ctrl/Cmd+Enter copy · Ctrl/Cmd+S save
          </p>
        </Card>

        <Card>
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-base font-semibold text-text">Recent reports</h2>
            <a href="/saved" className="text-sm font-medium text-primary hover:underline">
              View all
            </a>
          </div>
          {recent.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border bg-background px-4 py-8 text-center text-sm text-muted">
              No saved reports yet. Generate and save one to see it here.
            </p>
          ) : (
            <ul className="space-y-3">
              {recent.map((report) => (
                <li
                  key={report.id}
                  className="rounded-xl border border-border bg-background px-3 py-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-text">
                        {report.title}
                      </p>
                      <p className="mt-0.5 text-xs text-muted">
                        {formatDisplayDate(report.date)}
                      </p>
                      <p className="mt-0.5 text-xs text-muted">
                        {formatDateTime(report.createdAt)}
                      </p>
                    </div>
                    <Badge variant="default">{typeLabels[report.type]}</Badge>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>
    </div>
  );
}
