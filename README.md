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

### Build & Check

```bash
# Run type checking
npm run check

# Create production build
npm run build
```

## Security & Privacy

ST Finance is designed for personal privacy:

- All financial data remains on your local machine.
- No third-party tracking, analytics, or app-operated remote database storage.
- Optional Gmail sync contacts Google to read statement emails only after you connect it.
- Credentials and configuration are maintained locally via `.env` files and never committed to version control.
