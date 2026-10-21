# Task: phase5-finish

- **Owner:** claude
- **Branch:** ai/claude/phase5-finish
- **Base:** ai/codex/main-reconciliation
- **Worktree:** ../cardos-wt/claude-phase5-finish
- **Created:** 2026-10-21
- **State:** In progress
- **Next step:** After the maintainer's go-ahead: push this branch, open a draft PR into `main` so CI runs once, then import `.github/rulesets/main.json` with `enforcement: evaluate`; switch it to active only after the maintainer confirms.

## Done on this branch

- Codex command rules installed CardOS-scoped as `.codex/rules/cardos.rules` (trust test in PHASE-STATUS P5-C2).
- CI `policy` blocker fixed: the Google-origin Opengrep rule also excludes `src/lib/gmail.test.ts`; the pinned scan exits 0.
- Docs corrected where they called the Opengrep scan unverified.

## History

- 2026-10-21 new: ai/claude/phase5-finish from ai/codex/main-reconciliation
