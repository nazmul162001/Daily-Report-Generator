import { Card } from "@/components/ui/Card";

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

export function HomeDashboard() {
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
    </div>
  );
}
