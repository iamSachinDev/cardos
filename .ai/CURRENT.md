# Current state (handoff)

- **Purpose:** what is in progress, who owns it, and what to do next, so any agent can continue from versioned files alone.
- **Audience:** the next Claude Code or Codex session, and the maintainer.
- **Owner:** whoever holds the active branch below; update at the end of every session.
- **Related docs:** [AGENTS.md](../AGENTS.md) · [INDEX](INDEX.md) · [PHASE-STATUS](../docs/ai-engineering/PHASE-STATUS.md)
- **How to validate:** `git worktree list` and `git log -1 ai-os/phase-2` match the branch and state below.

Keep this file short: state and pointers, no secrets, no transcripts, no personal or financial data.

## Active work

| Field | Value |
|---|---|
| Phase | 2: Agent and Knowledge Foundation ([status](../docs/ai-engineering/PHASE-STATUS.md)) |
| Chunk | P2-C5: local commit on the branch below (no push) |
| Branch / worktree | `ai-os/phase-2` in `../cardos-ai-os`, based on `main` at `e7598889` |
| Owner | Claude Code coordinator session, until the maintainer merges or closes the branch |
| Main checkout | `../cardos` on `main`: Codex and the maintainer work there. Don't edit it from this branch |
| Specification | None yet (Spec Kit arrives in Phase 3) |
| Last updated | 2026-10-18 |

## Done in Phase 2

- Added `AGENTS.md`, `CLAUDE.md`, `.ai/CONTEXT.md`, `.ai/INDEX.md`, `.ai/decisions/0001-local-burnrate-patch.md`, this file, and `docs/ai-engineering/` (README, roadmap, phase status). Docs only; no app code, config or dependencies changed.
- Written by three parallel agents on a balanced-tier model, then checked by an independent premium-tier reviewer (13 fixes across 6 files, none high severity). Final checks are recorded in [PHASE-STATUS](../docs/ai-engineering/PHASE-STATUS.md).

## Checks run (2026-10-17/18, in the worktree)

- `npx tsc --noEmit`, `npm run check`, `npm run build`: exit 0.
- gitleaks (full history, working tree, staged): no leaks.
- Cross-agent context load:
  - Claude Code, fresh session with all tools disabled: answered 5/5 rule questions correctly from `AGENTS.md`.
  - Codex: `codex debug prompt-input` in this worktree contains `AGENTS.md` (all sections); the same check in `../cardos` (no `AGENTS.md`) contains none of it.
  - Codex behavioural quiz: not run yet. The Codex plan hit its usage limit; it resets at about 04:10 local time on 2026-10-18.

## Known problems (not fixed; outside Phase 2 scope)

1. Root `README.md` doesn't mention `patches/burnrate-password-reparse-preserve.patch`, and its re-apply command (`-p0`) doesn't fit that patch's `a/` and `b/` paths. It also says "Node.js 20+", but the locked Astro 7.4 requires Node >= 22.22.0.
2. `.gitignore` has no patterns for a downloaded Google OAuth client JSON or for local agent settings (Phase 5).
3. `src/styles/optimize.css` uses colour variables that no stylesheet defines (possible UI bug in Settings, Milestones and Offers; needs maintainer approval to fix).
4. A code comment in `patches/burnrate-0.5.2.patch` uses a real card-issuer prefix in an example filename (already public since `89af6c1c`). Replace it with a placeholder when the patch is next updated (HIGH class).
5. `.serena/` is gitignored but two of its files are tracked (review in Phase 6).
6. In this worktree, `node_modules` is a symlink to the main checkout. `.gitignore` doesn't match a symlink, so stage explicit paths only. Astro commands run here also rewrite the main checkout's Vite cache (regenerable). Future worktrees should run their own `npm ci` (MEDIUM: ask first) instead.

## Outstanding decisions (maintainer)

- Review `ai-os/phase-2`, then merge it, open a PR, or ask for changes.
- Approve Phase 3 (Spec Kit upgrade to v1.2.1: a tool install).
- Decide on known problems 1–4.

## Next steps

1. After the usage limit resets: run the same 5-question quiz with `codex exec -s read-only` in this worktree and record the result in PHASE-STATUS.
2. On approval, start Phase 3 in a new worktree from updated `main`.

Relevant commit: the latest commit on `ai-os/phase-2` (`git log -1 ai-os/phase-2`).
