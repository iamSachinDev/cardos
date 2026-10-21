# Task: finish-phases

- **Owner:** claude
- **Branch:** ai/claude/finish-phases
- **Base:** ai/claude/phase5-finish
- **Worktree:** ../cardos-wt/claude-finish-phases
- **Created:** 2026-10-21
- **State:** In progress: CI wiring committed, status docs updated, pull request and CI result pending
- **Next step:** Open a pull request to `main` (maintainer approval needed to publish), wait for CI, merge only if all jobs pass, then record the run in PHASE-STATUS and DASHBOARD and move P8 to Implemented and verified on a pass.

## Done

- `8b003986`: CI job `build` also runs `npm test`, `npm run docs:test`, `docs:links` and `docs:routes:check`, and an advisory `docs:impact` on pull requests (base ref via `env`). All four commands exit 0 locally (`npm test` 14/14). A direct push to `main` was blocked by Claude Code's auto-mode safety check, so it goes through a pull request.
- Status docs updated (PHASE-STATUS, DASHBOARD, GUARDRAILS, INTEGRATION-BOOTSTRAP, DOCS-AUTOMATION, EVALUATION-QUALITY, `.ai/CURRENT.md`) with the published state: `main` at `4da79314`, CI run 39613874631 (build, gitleaks, osv-scanner, policy all `success`), Dependabot live, ruleset `protect-main` (id 25552280) imported with enforcement `disabled`.

## Not done (needs the maintainer or the pull request)

- CI result for `8b003986` (P8, P9).
- Activating the ruleset (P5, P9).
- Governance: ratify the constitution, accept spec 001 and ADRs 0001 and 0002, review the root README's Burnrate sections.

## History

- 2026-10-21 new: ai/claude/finish-phases from ai/claude/phase5-finish
- 2026-10-21 CI wiring committed (`8b003986`); status docs updated
