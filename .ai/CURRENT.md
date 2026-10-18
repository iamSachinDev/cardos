# Current state (session summary)

- **Purpose:** what is in progress, who owns it, and what to do next, so any agent can continue from versioned files alone.
- **Audience:** the next Claude Code or Codex session, and the maintainer.
- **Owner:** whoever holds the active branch below; update at the end of every session.
- **Related docs:** [AGENTS.md](../AGENTS.md) · [INDEX](INDEX.md) · [PHASE-STATUS](../docs/ai-engineering/PHASE-STATUS.md) · [handoff runbook](runbooks/handoff.md)
- **How to validate:** `git worktree list`, `npm run ai:worktree -- list` and `git log --oneline -3 ai-os/phase-4` match the branches and state below.

Keep this file short: state and pointers, no secrets, no transcripts, no personal or financial data. Each agent task keeps its own state in `.ai/tasks/<task>.md` on its branch; this file is the session summary.

## Active work

| Field | Value |
|---|---|
| Phase | 4: Orchestration, Implemented and verified ([status](../docs/ai-engineering/PHASE-STATUS.md#p4-orchestration)). Phase 5 not started: needs the maintainer's approval |
| Chunk | None active. The Claude-to-Codex handoff demo passed; its record is `.ai/tasks/p4-handoff-demo.md` |
| Branches / worktree | `ai-os/phase-4` in `../cardos-ai-os`, stacked on `ai-os/phase-3` (`9b15113b`), then `ai-os/phase-2` (`16e95c5a`), then `main` at `e7598889`. None is merged or pushed |
| Owner | Claude Code coordinator session, until the maintainer merges or closes the branches |
| Main checkout | `../cardos` on `main`: the maintainer and Codex work there. `main` has moved ahead of the AI-OS base (`git log --oneline e7598889..main`; see known problem 6); none of those commits touch AI-OS files. Don't edit it from these branches |
| Specification | [`specs/001-gmail-sync/spec.md`](../specs/001-gmail-sync/spec.md): Draft (retroactive), pending the maintainer's acceptance. Constitution [`.specify/memory/constitution.md`](../.specify/memory/constitution.md) v1.0.0: Proposed, pending ratification |
| Last updated | 2026-10-18 |

## Done

- **Phase 2** (`ai-os/phase-2`) and **Phase 3** (`ai-os/phase-3`): Implemented and verified. Shared rules, `.ai/` knowledge, Spec Kit 1.2.1 with both integrations, the proposed constitution and spec 001.
- **Phase 4** (`ai-os/phase-4`, Implemented and verified):
  - Codex ignores a repo's `.codex/config.toml` in an untrusted project; `AGENTS.md` is the only shared channel (P4-C1).
  - `scripts/ai-worktree.mjs` (`npm run ai:worktree`): `new`, `list`, `handoff` and `remove`. Branch `ai/<agent>/<task>`, worktree `../cardos-wt/<agent>-<task>`, provenance in git config, a per-task state file `.ai/tasks/<task>.md`.
  - [Handoff runbook](runbooks/handoff.md), `AGENTS.md` §2, §6 and §10, `CLAUDE.md`, `INDEX.md`, the roadmap and PHASE-STATUS.

## Checks (details and dates in PHASE-STATUS)

- **Claude Code:** rules quiz 5/5 (tools disabled); spec 001 quiz 5/5 (read-only tools).
- **Codex:** rules quiz 5/5 with no commands run; spec 001 quiz 4/5 at low effort, 5/5 at medium.
- **Helper:** the author's sweep passed 175 of 175 checks on Node 26 and 24. The coordinator then found two gaps in `remove`, reproduced in a scratch repo:
  - git deletes ignored files such as statements and `.env` files without asking;
  - `branch -d` from the main checkout cannot delete a branch merged into a base other than `main`.

  Both are fixed. Two independent reviews (code and docs) followed; their fixes are in, and the sweep passes 234 of 234.

- **Handoff demo:** Claude started `p4-handoff-demo`, committed and handed off; a fresh Codex session continued in its own worktree and committed; neither worktree was touched by the other agent; both were removed cleanly.

## Known problems (not fixed; each needs the maintainer)

1. **Root `README.md`:** it still omits `patches/burnrate-password-reparse-preserve.patch`, says "Node.js 20+" (the locked Astro needs >= 22.22.0) and claims XLS import (spec G-4). On `main` it now documents the one-year and personal-fee patches.
2. **Skipped files may show as failed imports.** The Burnrate patch logs skipped non-card and ignored files with status "error", so the Statements page may list them as "Parse failed" after each Burnrate restart (spec G-17). Changing patches is HIGH.
3. **Card hints in public files:** Burnrate patch comments include a real card-issuer prefix in an example filename and hint at a card product (public since `89af6c1c`); ADR 0001's Context hints at which issuers are in use.
4. **`.gitignore` gaps:** no patterns for a downloaded Google OAuth client JSON or for local agent settings (Phase 5).
5. **Possible UI bug:** `src/styles/optimize.css` uses colour variables that no stylesheet defines.
6. **AI-OS docs are behind `main`.** After the AI-OS base, Codex committed `patches/burnrate-gmail-one-year.patch` (365 days, every result page) and `patches/burnrate-card-personal-fees.patch` on `main`. Spec 001 is baselined at `e7598889` and describes 120 days and a 200-message cap: FR-005, FR-034, SC-009, user story 1's fourth acceptance scenario, the "more than 200" edge case, the "both patches" assumption and G-14. Revise these after the branches are merged with `main`, together with ADR 0001, `.ai/CONTEXT.md` and `INDEX.md`.
7. **`.serena/` tracking:** `.serena/` is gitignored, but two of its files are tracked (Phase 6).
8. **`node_modules` symlink:** in `../cardos-ai-os` it points to the main checkout and shows as untracked. Stage explicit paths only; Astro commands here can rewrite the main checkout's Vite cache.
9. **Spec 001 gaps G-1 to G-17** list further mismatches between the README, the code and the patches.

## Outstanding decisions (maintainer)

- Review `ai-os/phase-2`, `ai-os/phase-3` and `ai-os/phase-4`. They are stacked, so merging `ai-os/phase-4` brings in all three. Merge, open PRs or ask for changes; pushing is HIGH.
- Ratify the constitution (see its Governance section) and accept spec 001 or ask for changes.
- Decide on known problems 1–6.

## Next steps

1. The maintainer reviews the three stacked branches and decides on the items above.
2. On approval, start Phase 5 (guardrails) in its own worktree with `npm run ai:worktree`.

Relevant commit: the latest commit on `ai-os/phase-4` (`git log -1 ai-os/phase-4`).
