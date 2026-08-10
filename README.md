# Daily Report Generator

Frontend-only productivity app for creating, previewing, and copying daily work reports in a **Slack-ready** format.

Live workflow: pick a report type → edit tasks → live preview → copy / save. Everything runs in the browser with **LocalStorage** persistence (no backend).

## Stack

| Layer | Tech |
| --- | --- |
| Framework | [Astro](https://astro.build) (static) |
| UI islands | [React](https://react.dev) 19 |
| Language | TypeScript (strict) |
| Styling | [Tailwind CSS](https://tailwindcss.com) v4 |
| Drag & drop | [@dnd-kit](https://dndkit.com) (`core`, `sortable`, `utilities`) |
| Persistence | Browser LocalStorage (via `ReportRepository`) |

## Features

### Report types

| Report | Purpose |
| --- | --- |
| **Today's Task** | Plan today's CMS / work tasks as an arrow list (`→`) |
| **Daily Report** | End-of-day update with per-task status (**Completed** / **On-Going**) |
| **Detailed Report** | Work breakdown (minutes/hours), goal review, goals for tomorrow, recipients |

### Shared UX

- **Live preview** — output updates as you type
- **Copy to clipboard** — plain text + rich HTML for Slack paste
- **Auto-saved drafts** — resume where you left off per report type
- **Saved reports** — browse, reopen, and manage history (`/saved`)
- **Keyboard shortcuts**
  - `Ctrl/Cmd+Enter` — copy
  - `Ctrl/Cmd+S` — save
- **Mobile-first** responsive layout
- **Dark / light mode** — sun/moon toggle on the header (right); **defaults to light**; preference saved in LocalStorage
- **Star on GitHub** link in the header

### Editable task lists (Today's Task & Daily Report)

- Built-in default tasks (CMS-oriented) plus **custom tasks**
- **Inline edit** titles (pencil / editable field)
- **Include toggle** — choose which tasks appear in the final output
- **Status** on Daily Report: Completed / On-Going
- **Add** custom rows; **remove** custom rows only (defaults stay until labels change)
- **Label & order persistence** — task catalogs stored in LocalStorage so renames and custom items stick across visits
- Daily Report defaults include **Feedback of today** (not used on Today's Task)

### Drag and drop (all major lists)

Powered by **@dnd-kit** with grip handles and smooth transform animations:

| Screen | Sortable lists |
| --- | --- |
| Today's Task | Task checklist |
| Daily Report | Task checklist |
| Detailed Report | Work breakdown items, Goal review bullets, Goals for tomorrow |

- Drag from the **six-dot handle** (pointer-safe so inputs still click)
- Visual feedback: elevated drag overlay + layout animation
- Order is saved with catalogs / drafts so reordering survives reload

### Detailed Report specifics

- Fixed recipients (mentions)
- Work rows: **minutes** → displayed as `X minutes (Y hours)`
- **N/A** toggle (keeps minutes for restore when unchecked)
- Compact goal / tomorrow editors; empty sections omitted from copy
- HTML-aware copy for bullets and bold categories in Slack

### Home

- Hero + **Report types** entry cards
- Saved reports available from nav / CTA (no duplicate dashboard widgets)

## Development

Requirements: **Node.js ≥ 22.12**

```bash
npm install
npm run dev
```

### Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start local dev server |
| `npm run build` | Production static build → `dist/` |
| `npm run preview` | Preview the production build |
| `npm run astro` | Astro CLI helpers |

Dev server can also be managed in background mode (`astro dev --background`, `astro dev stop`, `astro dev status`, `astro dev logs`) when using the project's agent docs.

## Project tree

```
daily_report/
├── public/
│   ├── favicon.ico
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── layout/                 # App chrome
│   │   │   ├── AppShell.astro
│   │   │   ├── Footer.astro
│   │   │   ├── Header.astro
│   │   │   ├── Seo.astro
│   │   │   └── ThemeToggle.astro   # Dark / light toggle
│   │   └── ui/                     # Shared React UI
│   │       ├── Badge.tsx
│   │       ├── Button.tsx
│   │       ├── Card.tsx
│   │       ├── DragHandle.tsx      # DnD grip
│   │       ├── EditableTaskTitle.tsx
│   │       ├── EmptyState.tsx
│   │       ├── FixedTaskRow.tsx
│   │       ├── Input.tsx
│   │       ├── Modal.tsx
│   │       ├── ReportPreview.tsx
│   │       ├── Select.tsx
│   │       ├── SortableList.tsx    # @dnd-kit list wrapper
│   │       ├── Textarea.tsx
│   │       ├── Toast.tsx
│   │       └── Tooltip.tsx
│   ├── data/
│   │   ├── defaultTemplates.ts     # Default form content
│   │   └── taskDefs.ts             # Built-in Today's / Daily task defs
│   ├── features/
│   │   ├── daily-report/
│   │   │   ├── components/
│   │   │   │   ├── DailyReportForm.tsx
│   │   │   │   ├── DailyReportPage.tsx
│   │   │   │   ├── DailyReportPreview.tsx
│   │   │   │   ├── TaskItem.tsx
│   │   │   │   └── TaskList.tsx
│   │   │   ├── types.ts
│   │   │   └── utils.ts
│   │   ├── detailed-report/
│   │   │   ├── components/
│   │   │   │   ├── BulletListEditor.tsx   # sortable goal lists
│   │   │   │   ├── DetailedReportForm.tsx
│   │   │   │   ├── DetailedReportPage.tsx
│   │   │   │   ├── DetailedReportPreview.tsx
│   │   │   │   ├── GoalReview.tsx
│   │   │   │   ├── RecipientsEditor.tsx
│   │   │   │   ├── TomorrowGoals.tsx
│   │   │   │   └── WorkBreakdown.tsx      # sortable time rows
│   │   │   ├── duration.ts
│   │   │   ├── types.ts
│   │   │   └── utils.ts
│   │   ├── home/
│   │   │   └── components/
│   │   │       └── HomeDashboard.tsx
│   │   ├── saved-reports/
│   │   │   ├── components/
│   │   │   │   ├── SavedReportCard.tsx
│   │   │   │   └── SavedReports.tsx
│   │   │   ├── storage.ts
│   │   │   └── types.ts
│   │   └── today-task/
│   │       ├── components/
│   │       │   ├── TodayTaskForm.tsx
│   │       │   ├── TodayTaskPage.tsx
│   │       │   └── TodayTaskPreview.tsx
│   │       ├── types.ts
│   │       └── utils.ts
│   ├── hooks/
│   │   ├── useDraftAutoSave.ts
│   │   └── useKeyboardShortcuts.ts
│   ├── lib/
│   │   ├── clipboard.ts            # Clipboard write helpers
│   │   ├── date.ts
│   │   ├── repository.ts          # ReportRepository (LocalStorage)
│   │   ├── slackCopy.ts            # Slack-friendly HTML/plain
│   │   ├── storage.ts              # Keys + local storage helpers
│   │   ├── taskLabels.ts           # Task catalog / order / labels
│   │   └── utils.ts
│   ├── pages/                      # Astro routes
│   │   ├── index.astro             # Home
│   │   ├── today-task.astro
│   │   ├── daily-report.astro
│   │   ├── detailed-report.astro
│   │   └── saved.astro
│   ├── styles/
│   │   └── global.css
│   └── types/
│       └── common.ts
├── AGENTS.md                       # Agent / dev server notes
├── CLAUDE.md -> AGENTS.md
├── astro.config.mjs
├── package.json
├── tsconfig.json
└── README.md
```

## Architecture notes

- **Feature modules** under `src/features/*` own each report type (form, preview, format utilities).
- **Shared UI** (drag handle, sortable list, inputs, preview shell) lives in `src/components/ui`.
- **Task catalogs** (`taskLabels.ts` + LocalStorage) keep custom labels and sort order for Today's Task and Daily Report.
- **Persistence** is isolated behind `ReportRepository` so LocalStorage can later be replaced with an API without rewriting the forms.
- **Slack copy** uses plain text and HTML (`slackCopy` / `clipboard`) so pastes keep list structure and emphasis where Slack supports it.

## Routes

| Path | Page |
| --- | --- |
| `/` | Home |
| `/today-task` | Today's Task |
| `/daily-report` | Daily Report |
| `/detailed-report` | Detailed Report |
| `/saved` | Saved reports |

## License

Private / personal use unless otherwise noted.
