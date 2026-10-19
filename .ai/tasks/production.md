# Task: production

- **Owner:** codex
- **Branch:** ai/codex/production
- **Base:** ai/codex/dashboard
- **Worktree:** ../cardos-wt/codex-production
- **Created:** 2026-10-20
- **State:** Complete on the local task branch; not pushed or merged.
- **Next step:** The maintainer reviews the branch and rehearses backup and restore privately before relying on the runbook.

## History

- 2026-10-20 new: ai/codex/production from ai/codex/dashboard
- 2026-10-20: Pinned direct dependencies to the existing lockfile versions, corrected the Node.js requirement, and drafted a maintainer-run stopped-service Burnrate backup and restore procedure. No live Burnrate data or service was touched.
- 2026-10-20: Independent runbook review found failure-path and configuration-order issues; corrected them, added a fail-closed completion marker and rollback path. The runbook has only static and shell-syntax validation; no live backup or restore was attempted.
- 2026-10-20, 03:03 IST: `npm test` passed 11/11; `npm run build` checked 41 Astro files with 0 diagnostics and built 12 pages; `npm run docs:links` checked 332 links with 0 issues; route inventory check passed; four shell blocks passed `bash -n`; staged `gitleaks` found no leaks and the staged diff check was clean. A fresh `npm ci` was not run because the repo's agent rules require maintainer approval for dependency installation.
