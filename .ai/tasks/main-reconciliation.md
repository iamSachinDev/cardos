# Task: main-reconciliation

- **Owner:** codex
- **Branch:** ai/codex/main-reconciliation
- **Base:** ai/codex/integration-bootstrap
- **Worktree:** ../cardos-wt/codex-main-reconciliation
- **Created:** 2026-10-21
- **State:** Local implementation complete; Phase 12 remote and policy-runtime gates remain open.
- **Next step:** Review the local branch. Run actual Opengrep when its binary is available, and review accepted ADR 0001 and deferred CI work separately.

## History

- 2026-10-21 new: ai/codex/main-reconciliation from ai/codex/integration-bootstrap
- 2026-10-21 IST: Began a local `--no-commit` merge of clean `main` at `18ccecd0` (eight commits past the AI-OS base). README was the only textual conflict. Retained the ST Finance README and package metadata, exact dependency pins and AI scripts, and aligned the lockfile root name.
- 2026-10-21 IST: Updated the one stale app-test assertion and current-facing AI notes. The draft Gmail spec now explicitly identifies its `e7598889` scenarios as historical; the accepted ADR, agent rules, permissions and policy files await separately authorized review. No live Burnrate data, env, OAuth client, statement, key or API response was accessed.
- 2026-10-21 IST: Manifest/lockfile root alignment, `docs:links` (349 links, 0 issues), `docs:routes:check`, `docs:test` (4/4), model catalog check, Conftest model policy (24/24), policy fixtures (25/25), and bootstrap tests (9/9) passed. The authored reconciliation paths passed `git diff --cached --check`; the full merge diff reported trailing whitespace inherited from committed main patch files and `src/lib/trends.ts`. The approved trend edit later removed its own inherited whitespace; the Burnrate patches remain untouched.
- 2026-10-21 IST: Staged redacted gitleaks found no leaks (93.09 KB scanned); the full Git history scan found no leaks across 31 commits. App tests, build and combined Opengrep policy remain to run.
- 2026-10-21 IST: `node --check` passed for the two changed launcher/setup scripts. `main` remained clean at `18ccecd0`; no data or secret file type was staged. The worktree still has an uncommitted merge pending the required app build gate.
- 2026-10-21 IST: The maintainer approved `npm ci` in this worktree and narrow local agent/policy corrections. `npm ci` installed 307 pinned packages; npm reported 0 vulnerabilities. The maintainer separately approved three spend-trend fixes after an independent read-only review found comparisons and chart lines crossing missing months and an incorrect All-Time heading.
- 2026-10-21, 19:14 IST: `npm test` passed 14/14 synthetic tests in four files; `npm run build` checked 47 Astro files with 0 diagnostics and built 12 pages. Conftest passed on the real Claude settings (2), workflow (4), Dependabot (3) and model policy (24); the 25 policy fixtures, 4 docs tests, routes check and local links check (352 links, 0 issues) passed. The 11-rule Opengrep YAML parses and targeted fee-link/theme regex fixtures pass. The Opengrep binary is unavailable locally, so the actual scan is **unverified**.
- 2026-10-21, 19:21 IST: Final `npm test` passed 14/14; `npm run build` checked 47 Astro files with no diagnostics and built 12 pages; docs links passed 352/352. Staged redacted gitleaks found no leaks (108.80 KB scanned), full Git history had no leaks in 31 commits, and the working-tree scan found none in 1.67 MB. `git diff --cached --check` reports only inherited trailing whitespace in the two committed-main Burnrate patch files; the authored paths pass. No patch content was changed to silence this.
- 2026-10-21, 19:23 IST: Final review found the All Time callout still said six months. Made its label conditional and clarified that month-over-month comparisons require consecutive recorded months. `npm test` passed 14/14 and `npm run build` checked 47 Astro files with no diagnostics and built 12 pages after this correction.

## Approved local governance update

- Corrected factual ST Finance references in `AGENTS.md`: exact pinned dependencies, the available `npm test` command, `AppStatus`, and the `st-theme` key with a read-only legacy-key fallback.
- Updated `.opengrep/rules.yml` to retain the broad external-URL restriction while allowing only the six reviewed issuer-source literals in `publicFees.ts`. A separate rule bars network calls in that module; theme rules allow `st-theme` and legacy reads while rejecting other storage.
- Added five Claude edit prompts for fee-source and spend-trend files whose calculations or displayed amounts need the existing HIGH money-logic review. All 84 deny rules, secret scans and CI workflows remain enabled.
- Review accepted ADR 0001 separately before editing it; the current task does not alter that accepted decision.
