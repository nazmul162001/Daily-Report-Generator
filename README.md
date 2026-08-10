# Daily Report Generator

Frontend-only productivity app for creating, previewing, and copying daily work reports in a **Slack-ready** format.

Live workflow: pick a report type → edit tasks → live preview → copy / save. Everything runs in the browser with **LocalStorage** persistence (no backend).

## Stack

| Layer | Tech |
| --- | --- |
| Framework | [Astro](https://astro.build) 7 (static multi-page + SPA-style routing) |
| UI islands | [React](https://react.dev) 19 (`client:load` islands per page) |
| Language | TypeScript (strict) |
| Styling | [Tailwind CSS](https://tailwindcss.com) v4 + CSS theme tokens (`data-theme`) |
| Client routing | Astro **`ClientRouter`** (view transitions — no full reloads) |
| Drag & drop | [@dnd-kit](https://dndkit.com) (`core`, `sortable`, `utilities`) |
| Theme switch | View Transitions API (circular reveal from header toggle) |
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
- **SPA-style navigation** — soft client routing between pages (no full browser reload); see [Client-side navigation](#client-side-navigation)
- **Dark / light mode** — see [Theme (dark / light mode)](#theme-dark--light-mode) below
- **Star on GitHub** link in the header

### Client-side navigation

This is an **Astro multi-page app** with **React islands** — not a single React SPA. Full browser reloads used to happen because each route is a real HTML page and plain `<a href>` navigations load the next document.

**Approach (scalable Astro pattern):** [`ClientRouter`](https://docs.astro.build/en/guides/view-transitions/) from `astro:transitions` in the shared layout (`AppShell`).

| Behavior | Details |
| --- | --- |
| **Soft navigation** | Same-origin links are intercepted; next page HTML is fetched and swapped in-place |
| **No full reload** | Header, footer, theme, and scroll chrome stay smooth; main content transitions with a fade |
| **Persistent chrome** | Header + footer use `transition:persist` so they aren't destroyed on every route |
| **Active nav** | Updated after each soft navigation (`astro:page-load`) |
| **Prefetch** | Routes prefetch on hover (`prefetch` in `astro.config.mjs`) for snappy clicks |
| **React islands** | Each page's form island hydrates on entry (`client:load`) — correct per-route state |
| **Full reload when needed** | Add `data-astro-reload` on a link, or navigate off-site (e.g. GitHub) |
| **Programmatic nav (React)** | `import { navigate } from "astro:transitions/client"` then `navigate("/daily-report")` |

Key file: `src/components/layout/AppShell.astro` (`<ClientRouter />`).

### Theme (dark / light mode)

Full-app light and dark themes with a polished switch in the header.

| Detail | Behavior |
| --- | --- |
| **Default** | **Light mode** on first visit (does not follow the OS theme) |
| **Control** | Sun / moon icon on the **far right** of the header |
| **Persistence** | Choice stored in `localStorage` under the key `theme` (`"light"` \| `"dark"`) |
| **No flash** | Inline boot script in `AppShell` applies the saved theme before paint |
| **Icons** | Moon shown in light mode (click → dark); sun shown in dark mode (click → light) |

**Light palette**
- Cool blue-gray page background, white surfaces, classic blue primary

**Dark palette**
- Soft indigo night (not pure black): lifted navy surfaces, bright sky accent, subtle ambient glows

**Circular reveal animation (Telegram-style)**
- When you toggle, the new theme blooms as a **circle from the header control** (top-right) and expands across the screen
- Implemented with the **View Transitions API** + animated `clip-path`
- Respects **`prefers-reduced-motion`**: instant switch when reduced motion is preferred
- Browsers without View Transitions fall back to an instant theme change

**Key files**

| File | Role |
| --- | --- |
| `src/components/layout/ThemeToggle.astro` | Toggle UI + circular reveal logic |
| `src/components/layout/AppShell.astro` | FOUC-safe default / restore (`data-theme`) |
| `src/components/layout/Header.astro` | Hosts the toggle on the right |
| `src/styles/global.css` | Light/dark design tokens + view-transition base styles |

Tokens are driven by `html[data-theme="light"]` / `html[data-theme="dark"]` so all existing Tailwind utilities (`bg-background`, `text-text`, `border-border`, `bg-primary`, …) update with the theme.

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
- **Theming** uses `data-theme` on `<html>` and CSS custom properties in `global.css`; the toggle lives in `ThemeToggle.astro` with a Telegram-style circular View Transition.
- **Client routing** is enabled once in `AppShell` via `<ClientRouter />`. Prefer normal `<a href>` for links; use `navigate()` only for button-driven flows. Avoid rewriting the app as a single React Router SPA — Astro islands per route stay simpler and more scalable here.

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
