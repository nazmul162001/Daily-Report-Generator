# Daily Report Generator

Frontend-only productivity app for creating, previewing, and copying daily work reports (Slack-ready).

## Stack

- Astro
- React (islands)
- TypeScript (strict)
- Tailwind CSS
- LocalStorage persistence

## Development

```bash
npm install
npm run dev
```

## Scripts

- `npm run dev` — start dev server
- `npm run build` — production build
- `npm run preview` — preview production build

## Features

- **Today's Task** — arrow-list task plan
- **Daily Report** — status-based end-of-day update
- **Detailed Report** — work breakdown, goals, recipients
- Live preview + copy to clipboard
- Auto-saved drafts
- Saved reports (LocalStorage)
- Mobile-first responsive UI
- Keyboard shortcuts: `Ctrl/Cmd+Enter` copy, `Ctrl/Cmd+S` save

## Architecture

```
src/
  components/   # UI + layout
  features/     # Report-type feature modules
  lib/          # Shared utilities + repository
  data/         # Default templates
  pages/        # Astro routes
```

Persistence is isolated behind `ReportRepository` so LocalStorage can later be swapped for an API without rewriting the UI.
