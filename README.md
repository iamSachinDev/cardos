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
- Node.js 22.22.0 or newer and project dependencies (`npm ci` once)

## Run

```bash
npm run cardos
```

You can also double-click `start-cardos.command`. The launcher checks the existing Burnrate service, starts it through Homebrew if needed, starts CardOS only if it is not already serving on port 4321, and opens the browser after both APIs respond. `npm run dev` is still available for foreground development.

CardOS is at `http://127.0.0.1:4321`. Astro proxies `/api/*` to the local Burnrate API, avoiding CORS changes in Burnrate.

## Data

CardOS does not maintain a second finance database. It reads Burnrate endpoints such as `/api/cards`, `/api/statements`, `/api/transactions`, `/api/analytics/*`, and `/api/due-reminders`.

The browser fetches fresh API responses at startup and on each page load, refreshes when the tab regains focus, and revalidates every 45 seconds while visible. Processing statements are checked every five seconds. The global Sync button refreshes related datasets together. Financial responses stay in memory only; the browser stores only the theme preference.

## Gmail sync

Burnrate can pull statement attachments (PDF, CSV, XLS) from Gmail with read-only access. It needs your own Google OAuth client:

1. In Google Cloud Console, enable the Gmail API, configure the OAuth consent screen with the `gmail.readonly` scope, and add your Gmail address as a test user.
2. Create an OAuth client ID of type **Web application** with the authorized redirect URI `http://127.0.0.1:8000/api/gmail/oauth/callback`, then download its JSON.
3. Run `npm run gmail:setup -- ~/Downloads/client_secret_….json` (or run it without a path to paste the ID and secret). It writes Burnrate's `libexec/.env.production` (mode 600), points the OAuth redirect back to CardOS Settings, and restarts the Burnrate service.
4. Open Settings in CardOS and choose **Connect Gmail**. The first sync runs as soon as Google redirects back.

After that, Burnrate syncs Gmail each time its service starts (at most hourly), and **Sync Gmail** in the top bar or **Sync now** in Settings syncs on demand. Each sync scans up to 200 matching emails from the last 120 days and saves new attachments to the watch folder; attachments saved by an earlier sync are skipped. While the consent screen is in Testing, Google expires the connection after 7 days; choose **Reconnect** in Settings, or publish the consent screen for your own use.

### Burnrate patch

[patches/burnrate-0.5.2.patch](patches/burnrate-0.5.2.patch) fixes Burnrate 0.5.2 issues found with Gmail sync: duplicate downloads and double processing, the 40-email cap, bank detection for Gmail-named files (ICICI, Standard Chartered, SBI), a Standard Chartered statement parser, password fallbacks, and skipping non-card PDFs (broker, mutual fund, loan, bank account, EMI letters) instead of creating failed rows. To ignore other non-card attachments, set `BURNRATE_IGNORE_FILENAME_REGEX` in Burnrate's `.env.production`.

`brew upgrade burnrate` replaces the `libexec` folder, which removes both the patch and `.env.production`. Afterwards, reapply the patch with `patch -p0 -d "$(brew --prefix burnrate)/libexec" < patches/burnrate-0.5.2.patch`, rerun `npm run gmail:setup`, and restart the service. If the patch no longer applies to a newer Burnrate, check whether the new version already fixes these issues.

## Security and local configuration

CardOS has no built-in credentials or financial records. It connects to Burnrate on `127.0.0.1`, and the browser calls the relative `/api/*` routes. Keep account and transaction data in Burnrate's local storage. If Burnrate uses Gmail sync, that integration may contact Gmail when you request a sync.

CardOS currently needs no environment variables. If you add a credential later, keep it in a local `.env` file or Burnrate's backend configuration, never in source code or a client-exposed `PUBLIC_` variable. The `.gitignore` excludes `.env` files and common local financial exports. Astro CLI telemetry is disabled by the project scripts and launcher.
