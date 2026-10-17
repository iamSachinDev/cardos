# CardOS

A premium local-first Astro frontend for **Burnrate**. Burnrate remains the finance engine (FastAPI, SQLite, statement parsers, Gmail sync, offers, milestones); CardOS replaces the UI.

## Features

- Command Center dashboard
- Premium visual card wallet
- Upcoming bill timeline
- Spend trend + category + merchant analytics
- Transaction explorer
- Statement vault / parser status
- Dark/light theme
- No cloud database: calls your local Burnrate API

## Requirements

- Existing Homebrew Burnrate installation (`pratik1235/burnrate/burnrate`)
- Node.js 20+ and project dependencies (`npm ci` once)

## Run

```bash
npm run cardos
```

You can also double-click `start-cardos.command`. The launcher checks the existing Burnrate service, starts it through Homebrew if needed, starts CardOS only if it is not already serving on port 4321, and opens the browser after both APIs respond. `npm run dev` is still available for foreground development.

CardOS is at `http://127.0.0.1:4321`. Astro proxies `/api/*` to the local Burnrate API, avoiding CORS changes in Burnrate.

## Data

CardOS does not maintain a second finance database. It reads Burnrate endpoints such as `/api/cards`, `/api/statements`, `/api/transactions`, `/api/analytics/*`, and `/api/due-reminders`.

The browser fetches fresh API responses at startup and on each page load, refreshes when the tab regains focus, and revalidates every 45 seconds while visible. Processing statements are checked every five seconds. The global Sync button refreshes related datasets together. Financial responses stay in memory only; the browser stores only the theme preference.

## Security and local configuration

CardOS has no built-in credentials or financial records. It connects to Burnrate on `127.0.0.1`, and the browser calls the relative `/api/*` routes. Keep account and transaction data in Burnrate's local storage. If Burnrate uses Gmail sync, that integration may contact Gmail when you request a sync.

CardOS currently needs no environment variables. If you add a credential later, keep it in a local `.env` file or Burnrate's backend configuration, never in source code or a client-exposed `PUBLIC_` variable. The `.gitignore` excludes `.env` files and common local financial exports. Astro CLI telemetry is disabled by the project scripts and launcher.
