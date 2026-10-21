# ST Finance

A premium local-first credit-card and personal finance command center built with Astro, React, and TypeScript.

## Features

- **Command Center Dashboard**: Overview of portfolio spending, upcoming bills, active cards, and recent activity.
- **6-Month Spend Trend**: Track rolling 6-month historical spend trends with month-over-month indicators and monthly averages.
- **Card Wallet**: Visual card manager showing limits, utilization, balances, cardholder details, and annual fees.
- **Upcoming Bills & Reminders**: Timeline tracking due dates, minimum payments, and payment statuses.
- **Spend & Category Analytics**: Detailed breakdown of spending by category, merchant trends, and monthly velocity.
- **Transaction Explorer**: Full search, filtering, and transaction auditing across all accounts.
- **Statement Vault**: Monitor statement parsing, reconciliation status, and document uploads.
- **Fee & Reward Optimizer**: Optimize card benefits, track reward milestones, and maximize waiver thresholds.
- **Private & Local-First**: Runs locally without app telemetry or an app-operated cloud database. Optional Gmail sync reads a mailbox with your consent.
- **Dark & Light Mode**: Seamless theme switching with persistent settings.

## Getting Started

### Prerequisites

- Node.js 22.22.0 or newer
- Local finance service running on `http://127.0.0.1:8000`

### Installation

```bash
npm ci
```

### Running Locally

```bash
# Start the application
npm run dev
```

The app will be available at `http://127.0.0.1:4321`.

`npm run cardos` is the local launcher for installations that use the Homebrew Burnrate service. It checks the service and starts the UI; `npm run dev` runs only the UI in the foreground.

### Gmail statements (optional)

Gmail sync uses the separate local Burnrate service and requests read-only Gmail access. The maintainer configures a Google OAuth **Web application** client for the Gmail read-only scope, with redirect URI `http://127.0.0.1:8000/api/gmail/oauth/callback`. Keep the downloaded client JSON outside this repository. Then run:

```bash
npm run gmail:setup -- /absolute/path/to/client.json
```

This command stores the OAuth client settings in Burnrate's private local configuration and restarts that service. In ST Finance Settings, choose **Connect Gmail** and complete Google's consent. After connection, **Check Gmail** starts an on-demand statement check. The one-year scan in [`patches/burnrate-gmail-one-year.patch`](patches/burnrate-gmail-one-year.patch) applies only when that patch has been applied to a compatible Burnrate installation. Keep the downloaded client JSON and Burnrate configuration out of Git.

### Build & Check

```bash
# Run type checking
npm run check

# Create production build
npm run build
```

## Security & Privacy

ST Finance is designed for personal privacy:

- Imported financial records are handled by the local Burnrate service; this frontend has no separate finance database.
- Optional Gmail sync contacts Google to read statement emails after you connect it.
- The app has no third-party tracking, analytics or app-operated remote database.
- OAuth credentials belong in Burnrate's private local configuration, never in source code or a Git commit.

## Burnrate patch

The local Burnrate service is maintained separately from this frontend. The files in [`patches/`](patches/) record local fixes, including statement handling, a one-year Gmail scan, and personal annual-fee support. Installing this frontend does not apply those patches to Burnrate. Review each patch against the installed Burnrate version before applying it, and keep OAuth credentials in the local service configuration.
