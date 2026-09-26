import type { ReactNode } from "react";
import {
  IconDailyReport,
  IconDetailedReport,
  IconTodayTask,
} from "@/components/icons/AppIcons";

type Feature = {
  href: string;
  title: string;
  summary: string;
  points: string[];
  tone: string;
  icon: ReactNode;
};

type FeatureGroup = {
  id: string;
  label: string;
  description: string;
  features: Feature[];
};

const GROUPS: FeatureGroup[] = [
  {
    id: "reports",
    label: "Reports",
    description: "Write the message, check the preview, then copy it.",
    features: [
      {
        href: "/today-task",
        title: "Today's Task",
        summary: "Plan the day before you start.",
        points: [
          "List the tasks you expect to work on",
          "Leave out anything you don't want to share",
          "Copy a Slack-ready plan in one click",
        ],
        tone: "bg-primary/15 text-primary",
        icon: <IconTodayTask className="h-6 w-6" />,
      },
      {
        href: "/daily-report",
        title: "Daily Report",
        summary: "Close the day with what actually happened.",
        points: [
          "Mark each task done, in progress, or still open",
          "Watch the message update while you type",
          "Copy plain text or formatted text",
        ],
        tone: "bg-success/15 text-success",
        icon: <IconDailyReport className="h-6 w-6" />,
      },
      {
        href: "/detailed-report",
        title: "Detailed Report",
        summary: "A fuller write-up when the day needs more than a short note.",
        points: [
          "Split work across projects, time, and goals",
          "Drag columns into the order you want",
          "Copy the full report when it looks right",
        ],
        tone: "bg-accent-cool/15 text-accent-cool",
        icon: <IconDetailedReport className="h-6 w-6" />,
      },
    ],
  },
  {
    id: "tools",
    label: "Tools",
    description: "Time, code, and notes — next to the reports.",
    features: [
      {
        href: "/hours-calculator",
        title: "Hours Calculator",
        summary: "Turn a pile of times into one number.",
        points: [
          "Hours to minutes, or minutes to hours",
          "Press Enter to add another value",
          "Copy only the final result",
        ],
        tone: "bg-accent-warm/15 text-accent-warm",
        icon: <IconHours />,
      },
      {
        href: "/backup",
        title: "Backup",
        summary: "Keep snippets from a project together.",
        points: [
          "HTML, CSS, JavaScript, and PHP each have a tab",
          "Add your own tab when you need another language",
          "Open a card later to view, edit, or copy",
        ],
        tone: "bg-chart-projects/15 text-chart-projects",
        icon: <IconBackup />,
      },
      {
        href: "/notes",
        title: "Notes",
        summary: "Read your Notion pages without leaving this app.",
        points: [
          "Every page shows as its own card",
          "Search by title from the bar under the header",
          "Fetched once a day, then kept in this browser",
        ],
        tone: "bg-chart-accent/20 text-chart-accent",
        icon: <IconNotes />,
      },
    ],
  },
];

function IconHours() {
  return (
    <svg viewBox="0 0 32 32" fill="none" className="h-6 w-6" aria-hidden>
      <circle cx="16" cy="16" r="10" fill="currentColor" fillOpacity="0.14" stroke="currentColor" strokeWidth="1.6" />
      <path d="M16 10.5V16l3.5 2.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconBackup() {
  return (
    <svg viewBox="0 0 32 32" fill="none" className="h-6 w-6" aria-hidden>
      <rect x="5" y="6" width="22" height="20" rx="4" fill="currentColor" fillOpacity="0.14" stroke="currentColor" strokeWidth="1.6" />
      <path d="m12 13-3 3 3 3M20 13l3 3-3 3M17.5 12l-3 8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconNotes() {
  return (
    <svg viewBox="0 0 32 32" fill="none" className="h-6 w-6" aria-hidden>
      <path
        d="M9 5.5h10.2L23.5 10v15.2A2.3 2.3 0 0 1 21.2 27.5H9A2.5 2.5 0 0 1 6.5 25V8A2.5 2.5 0 0 1 9 5.5Z"
        fill="currentColor"
        fillOpacity="0.14"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M19 5.8V9.4c0 .7.6 1.3 1.3 1.3h3.2M11 16h8M11 20h5.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4 transition-transform duration-300 ease-out group-hover:translate-x-1" aria-hidden>
      <path d="M4 10h12M11 5l5 5-5 5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function HomeDashboard() {
  let cardIndex = 0;

  return (
    <div className="mx-auto w-full min-w-0 max-w-6xl">
      <header className="feature-in mb-8 max-w-2xl sm:mb-10">
        <p className="text-sm font-semibold text-primary">Workspace</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-text sm:text-3xl">
          All your tools, in one place
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted sm:text-base">
          Write reports, convert time, keep code backups, and read your Notion notes. Each tool stays in this browser.
        </p>
      </header>

      <div className="space-y-10">
        {GROUPS.map((group, groupIndex) => (
          <section key={group.id} aria-labelledby={`feature-group-${group.id}`}>
            <div className="feature-in mb-4" style={{ animationDelay: `${80 + groupIndex * 40}ms` }}>
              <h2 id={`feature-group-${group.id}`} className="text-lg font-semibold text-text">
                {group.label}
              </h2>
              <p className="mt-1 text-sm text-muted">{group.description}</p>
            </div>
            <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {group.features.map((feature) => {
                const delay = Math.min(cardIndex, 8) * 70;
                cardIndex += 1;
                return (
                  <li key={feature.href} className="feature-in" style={{ animationDelay: `${160 + delay}ms` }}>
                    <a
                      href={feature.href}
                      className="group flex h-full flex-col rounded-2xl border border-border bg-surface p-5 shadow-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:border-primary/35 hover:shadow-md [box-shadow:var(--c-shadow)]"
                    >
                      <span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${feature.tone}`}>
                        {feature.icon}
                      </span>
                      <h3 className="mt-4 text-lg font-semibold tracking-tight text-text transition-colors duration-300 group-hover:text-primary">
                        {feature.title}
                      </h3>
                      <p className="mt-1.5 text-sm leading-relaxed text-muted">{feature.summary}</p>
                      <ul className="mt-4 space-y-2">
                        {feature.points.map((point) => (
                          <li key={point} className="flex gap-2 text-sm leading-snug text-text">
                            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/70" aria-hidden />
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                      <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                        Open {feature.title}
                        <ArrowIcon />
                      </span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
