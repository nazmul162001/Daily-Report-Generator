# Daily Report Generator

Frontend-only productivity app for creating, previewing, and copying daily work reports in a **Slack-ready** format.

Live workflow: pick a report type → edit tasks → live preview → copy. Everything runs in the browser with **LocalStorage** persistence (no backend).

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
| Persistence | Browser LocalStorage (drafts, catalogs, time tracking) |

## Features

### Report types

| Report | Purpose |
| --- | --- |
| **Today's Task** | Plan today's CMS / work tasks as an arrow list (`→`) |
| **Daily Report** | End-of-day update with per-task status (**Completed** / **On-Going**) |
| **Detailed Report** | Work breakdown (minutes/hours), goal review, goals for tomorrow, recipients |
| **Time Tracking** | Project/task timers for the current local day; today's total can default Detailed Report **Revision** |

### Shared UX

- **Live preview** — output updates as you type
- **Copy to clipboard** — plain text + rich HTML for Slack paste
- **Auto-saved drafts** — resume where you left off per report type
- **Keyboard shortcuts**
  - `Ctrl/Cmd+Enter` — copy
- **Mobile-first** responsive layout
- **SPA-style navigation** — soft client routing between pages (no full browser reload); see [Client-side navigation](#client-side-navigation)
- **Add to Home Screen** — PWA install prompt so visitors can pin a home-screen shortcut (Android install UI + iOS instructions)
- **Dark / light mode** — see [Theme (dark / light mode)](#theme-dark--light-mode) below
- **Star on GitHub** link in the header

### Add to Home Screen (PWA)

Visitors can install the app as a home-screen shortcut:

| Platform | Behavior |
| --- | --- |
| **Android / Chrome / Edge** | Banner after open → **Add shortcut** uses the browser install prompt |
| **iPhone / iPad (Safari)** | Banner with steps: **Share → Add to Home Screen** |
| **Desktop** | Hint to use the browser’s Install / Add to Home screen menu |

- Preference stored in `localStorage` (`pwa-install-prompt`) — “Not now” hides the banner for 14 days  
- Already-installed apps (standalone display mode) never see the banner  
- Assets: `public/manifest.webmanifest`, `public/sw.js`, icons under `public/icons/`

Key UI: `src/components/layout/InstallPrompt.astro`

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

### Time Tracking

- Header tab **Time Tracking** (after Detailed Report) opens `/time-tracking`
- Create multiple **projects** (name + case no) and **tasks** (task number as a string, e.g. `1-1`)
- One running timer at a time; Start / Complete uses **timestamps** so elapsed time stays correct after refresh, sleep, or tab switch
- Completed tasks can be edited in **minutes**; display uses the shared minutes → hours conversion
- Per-project and **Today's Total** are summed from raw durations (not formatted strings)
- In-page tabs: **Time Tracking** (today) and **Task History** (completed projects for the last 30 days, or a custom date range)
- LocalStorage, versioned, keyed by local calendar date, **last 30 days** retained, plus a backup key
- Today's tracked minutes default the Detailed Report **Revision** field (never overwrites a manual edit; no tracking → existing 294 default)

### Home

- Activity at a glance (range filters + metric cards)
- Performance activity chart from time tracking data

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
│   │   │   ├── duration.ts         # Re-exports @/lib/duration
│   │   │   ├── types.ts
│   │   │   └── utils.ts
│   │   ├── home/
│   │   │   └── components/
│   │   │       └── HomeDashboard.tsx
│   │   ├── time-tracking/
│   │   │   ├── components/
│   │   │   │   ├── ProjectCard.tsx
│   │   │   │   ├── TaskRow.tsx
│   │   │   │   ├── TimeTrackingPage.tsx
│   │   │   │   └── TrackingModals.tsx
│   │   │   ├── revision.ts         # Detailed Report Revision default
│   │   │   ├── storage.ts          # Versioned localStorage + 30-day prune
│   │   │   ├── timer.ts            # Timestamp-based elapsed time
│   │   │   ├── totals.ts
│   │   │   ├── types.ts
│   │   │   └── useTimeTracking.ts
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
│   │   ├── duration.ts             # Shared minutes → hours conversion
│   │   ├── repository.ts          # Drafts and preferences (LocalStorage)
│   │   ├── slackCopy.ts            # Slack-friendly HTML/plain
│   │   ├── storage.ts              # Keys + local storage helpers
│   │   ├── taskLabels.ts           # Task catalog / order / labels
│   │   └── utils.ts
│   ├── pages/                      # Astro routes
│   │   ├── index.astro             # Home
│   │   ├── today-task.astro
│   │   ├── daily-report.astro
│   │   ├── detailed-report.astro
│   │   ├── time-tracking.astro
│   │   └── hours-calculator.astro
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
- **Persistence** uses LocalStorage for drafts, task catalogs, and time tracking.
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
| `/time-tracking` | Time Tracking |
| `/hours-calculator` | Hours Calculator |

## License

Private / personal use unless otherwise noted.
