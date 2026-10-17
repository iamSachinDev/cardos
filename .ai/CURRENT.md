# Current state (handoff)

- **Purpose:** what is in progress, who owns it, and what to do next, so any agent can continue from versioned files alone.
- **Audience:** the next Claude Code or Codex session, and the maintainer.
- **Owner:** whoever holds the active branch below; update at the end of every session.
- **Related docs:** [AGENTS.md](../AGENTS.md) · [INDEX](INDEX.md) · [PHASE-STATUS](../docs/ai-engineering/PHASE-STATUS.md)
- **How to validate:** `git worktree list` and `git log -2 ai-os/phase-3` match the branches and state below.

Keep this file short: state and pointers, no secrets, no transcripts, no personal or financial data.

## Active work

| Field | Value |
|---|---|
| Phase | 3: Spec Kit ([status](../docs/ai-engineering/PHASE-STATUS.md)) |
| Chunk | P3-C6b: Codex spec-reading check, blocked until the Codex plan's usage limit resets (about 04:10 on 2026-10-18) |
| Branches / worktree | `ai-os/phase-3` in `../cardos-ai-os`, stacked on `ai-os/phase-2` (`16e95c5a`), which is based on `main` at `e7598889`. Neither branch is merged or pushed |
| Owner | Claude Code coordinator session, until the maintainer merges or closes the branches |
| Main checkout | `../cardos` on `main`: Codex and the maintainer work there, and it has uncommitted Codex work (see known problem 6). Don't edit it from these branches |
| Specification | [`specs/001-gmail-sync/spec.md`](../specs/001-gmail-sync/spec.md): Draft (retroactive), pending the maintainer's acceptance. Constitution [`.specify/memory/constitution.md`](../.specify/memory/constitution.md) v1.0.0: Proposed, pending ratification |
| Last updated | 2026-10-18 |

## Done

- **Phase 2** (`ai-os/phase-2`): `AGENTS.md`, `CLAUDE.md`, the `.ai/` files and `docs/ai-engineering/`.
- **Phase 3** (`ai-os/phase-3`):
  - Spec Kit 1.2.1, pinned.
  - The Claude Code (`/speckit-*`) and Codex (`$speckit-*`) integrations.
  - The proposed constitution.
  - Spec 001, with FR-001 to FR-059, SC-001 to SC-010 and a traceability table.
  - `AGENTS.md` §4, §7, §9 and §10 updated: publishing to GitHub is HIGH, and so is changing the constitution or an accepted spec or ADR.

## Checks (details and dates in PHASE-STATUS)

- **Claude Code:**
  - loads `AGENTS.md`: 5/5 on the rules quiz, with tools disabled
  - reads spec 001: 5/5, with read-only tools
- **Codex:** loads `AGENTS.md` and sees all 10 `speckit-*` skills (offline `codex debug prompt-input`). Both of its behavioural quizzes are blocked by the usage limit.
- **Gates:** typecheck, build and gitleaks pass, and the privacy scans are clean.

## Known problems (not fixed; each needs the maintainer)

1. **Root `README.md`:**
   - doesn't mention `patches/burnrate-password-reparse-preserve.patch` or its `a/` and `b/` paths
   - says "Node.js 20+", but the locked Astro needs >= 22.22.0
   - claims XLS import, but spreadsheets are saved and never imported (spec G-4)
2. **Skipped files may show as failed imports.** The Burnrate patch logs skipped non-card and ignored files with status "error", so CardOS's Statements page may list them as "Parse failed" after each Burnrate restart (spec G-17). Changing patches is HIGH.
3. **Card hints in public files.**
   - Burnrate patch comments include a real card-issuer prefix in an example filename and hint at a card product. Both have been public since `89af6c1c`.
   - ADR 0001's Context also hints at which issuers are in use.
4. **`.gitignore` gaps:** no patterns for a downloaded Google OAuth client JSON or for local agent settings (Phase 5).
5. **Possible UI bug:** `src/styles/optimize.css` uses four colour variables that no stylesheet defines.
6. **Untracked Codex patch.** Codex has an untracked `patches/burnrate-gmail-one-year.patch` in the main checkout that may change the 120-day window. Update spec 001 (FR-005, FR-034, SC-009) when it lands.
7. **`.serena/` tracking:** `.serena/` is gitignored, but two of its files are tracked (Phase 6).
8. **`node_modules` symlink:** in this worktree it points to the main checkout. Stage explicit paths only; Astro commands here can rewrite the main checkout's Vite cache.
9. **Spec 001 gaps G-1 to G-17** list further mismatches between the README, the code and the patches.

## Outstanding decisions (maintainer)

- Review `ai-os/phase-2` and `ai-os/phase-3`, then merge, open PRs or ask for changes. Pushing is HIGH.
- Ratify the constitution (see its Governance section and Sync Impact Report), and accept spec 001 or ask for changes.
- Decide on known problems 1–6.
- Approve Phase 4 (orchestration).

## Next steps

1. After the Codex limit resets, run both Codex quizzes with `codex exec -s read-only` in this worktree:
   - the rules quiz (P2-C2b)
   - the spec-reading quiz (P3-C6b)

   Record the results in PHASE-STATUS.
2. On approval, start Phase 4 on a new branch.

Relevant commit: the latest commit on `ai-os/phase-3` (`git log -1 ai-os/phase-3`).
