# Current state (session summary)

- **Purpose:** what is in progress, who owns it, and what to do next, so any agent can continue from versioned files alone.
- **Audience:** the next Claude Code or Codex session, and the maintainer.
- **Owner:** whoever holds the active branch below; update at the end of every session.
- **Related docs:** [AGENTS.md](../AGENTS.md) · [INDEX](INDEX.md) · [PHASE-STATUS](../docs/ai-engineering/PHASE-STATUS.md) · [handoff runbook](runbooks/handoff.md)
- **How to validate:** `git worktree list`, `npm run ai:worktree -- list` and `git log -1 ai-os/phase-7` match the branches and state below.

Keep this file short: state and pointers, no secrets, no transcripts, no personal or financial data. Each agent task keeps its own state in `.ai/tasks/<task>.md` on its branch; this file is the session summary.

## Active work

| Field | Value |
|---|---|
| Phase | Finishing phases 5, 8, 9, 10 and 12 ([status board](../docs/ai-engineering/PHASE-STATUS.md#status-board)). P1 to P4, P6, P7, P10 and P11 are Implemented and verified; P8 is Implemented but unverified (CI result of `8b003986` pending); P5, P9 and P12 are Partially implemented. What remains is the CI result for `8b003986`, activation of the `protect-main` ruleset, and the maintainer's governance decisions below. |
| Chunk | [finish-phases task](tasks/finish-phases.md): commit `8b003986` wires `npm test`, `docs:test`, `docs:links`, `docs:routes:check` and an advisory pull-request `docs:impact` into CI job `build`; the status docs record the first published CI run and the imported ruleset. |
| Branches / worktree | `ai/claude/finish-phases` in `../cardos-wt/claude-finish-phases`, one commit (`8b003986`) past `main`'s `4da79314` and the docs update committed after it, both on a pull request into `main`. The AI-OS phases are on `main` since 2026-10-21; draft PR #1 (same content) remains open on GitHub. This clone has `core.hooksPath=.githooks` set. |
| Owner | Claude owns the [finish-phases task](tasks/finish-phases.md). The earlier [reconciliation task](tasks/main-reconciliation.md) (Codex) is merged into `main`. |
| Main checkout | `main` on GitHub is at `4da79314` (phases 2 to 12, Codex's reconciliation `fad1e532`, the Phase 5 finish), fast-forwarded 2026-10-21. Do not push to `main` directly: changes go through a pull request. |
| Specification | [`specs/001-gmail-sync/spec.md`](../specs/001-gmail-sync/spec.md): Draft (retroactive), pending the maintainer's acceptance. Constitution [`.specify/memory/constitution.md`](../.specify/memory/constitution.md) v1.0.0: Proposed, pending ratification |
| Last updated | 2026-10-21 IST |

## Done

- **Phase 2** (`ai-os/phase-2`) and **Phase 3** (`ai-os/phase-3`): Implemented and verified. Shared rules, `.ai/` knowledge, Spec Kit 1.2.1 with both integrations, the proposed constitution and spec 001.
- **Phase 4** (`ai-os/phase-4`, Implemented and verified):
  - Codex ignores a repo's `.codex/config.toml` in an untrusted project; `AGENTS.md` is the only shared channel (P4-C1).
  - `scripts/ai-worktree.mjs` (`npm run ai:worktree`): `new`, `list`, `handoff` and `remove`. Branch `ai/<agent>/<task>`, worktree `../cardos-wt/<agent>-<task>`, provenance in git config, a per-task state file `.ai/tasks/<task>.md`.
  - [Handoff runbook](runbooks/handoff.md), `AGENTS.md` §2, §6 and §10, `CLAUDE.md`, `INDEX.md`, the roadmap and PHASE-STATUS.

- **Phase 5** (`ai-os/phase-5`, on `main`): Claude Code deny/ask/allow rules and Bash sandbox (`.claude/settings.json`), a Codex `cardos` profile (`codex -p cardos`; installed in `~/.codex`, example in `docs/ai-engineering/`), Codex command rules (`.codex/rules/cardos.rules`), the pre-commit hook, CI and Dependabot (first CI run 39613874631 on `4da79314`: build, gitleaks, osv-scanner, policy all `success`; Dependabot is live), the `protect-main` ruleset (imported with enforcement `disabled`: `evaluate` mode needs an Enterprise plan; id 25552280), Opengrep and Conftest (both kept), and [GUARDRAILS.md](../docs/ai-engineering/GUARDRAILS.md).

- **Phase 6** (`ai-os/phase-6`): Serena 2.0.0 pinned and read-only for both agents (`.mcp.json`, `.serena/project.yml`, the Codex `cardos` profile), the [MCP registry](../docs/ai-engineering/MCP-REGISTRY.md), [lifecycle rules](LIFECYCLE.md) and [ADR 0002](decisions/0002-agent-memory.md) (ai-memory: DEFER, Proposed).
- **Phase 9 chunk** (`ai/codex/evaluation-quality`, on `main`): `npm test` passes 14 unit tests across `src/lib` (11 when recorded); a four-task Promptfoo/Codex SDK pilot passes on synthetic snippets. Reproduction and limits are in [EVALUATION-QUALITY.md](../docs/ai-engineering/EVALUATION-QUALITY.md). CI wiring: `8b003986`, pending its pull request run.
- **Phase 10** (`ai/codex/dashboard`, on `main`): [DASHBOARD.md](../docs/ai-engineering/DASHBOARD.md) gathers status, local check evidence, the published CI run and the synthetic Promptfoo result. Both installed CLIs document OpenTelemetry export; no collector or live export was enabled (telemetry stays Deferred). Implemented and verified with run 39613874631.
- **Phase 11 local chunk** (`ai/codex/production`): direct dependency declarations match the locked versions, and [PRODUCTION.md](../docs/ai-engineering/PRODUCTION.md) covers a stopped-service Burnrate snapshot and restore. No live financial data was accessed and no backup was run.
- **Phase 12 local chunk** (`ai/codex/integration-bootstrap`): clean `npm ci`, tests, build, policy checks and generic bootstrap in synthetic repositories. [INTEGRATION-BOOTSTRAP.md](../docs/ai-engineering/INTEGRATION-BOOTSTRAP.md) lists each earlier phase's evidence and remaining gates. OSV was unavailable because its service could not be resolved.
- **Current reconciliation** (`ai/codex/main-reconciliation`): merged committed ST Finance app changes into the local AI-OS branch, aligned package metadata, restored Gmail setup guidance, corrected the spend trend's missing-month presentation, and updated agent/policy rules with the maintainer's approval. Combined checks and limits are in the [task record](tasks/main-reconciliation.md).
- **Finish phases** (`ai/claude/finish-phases`): CI wiring for Phases 8 and 9 in `8b003986` (locally: `npm test` 14/14, `docs:test`, `docs:links`, `docs:routes:check` exit 0); status docs updated with the published run and the imported ruleset. Details in the [task record](tasks/finish-phases.md).

## Checks (details and dates in PHASE-STATUS)

- **Claude Code:** rules quiz 5/5 (tools disabled); spec 001 quiz 5/5 (read-only tools).
- **Codex:** rules quiz 5/5 with no commands run; spec 001 quiz 4/5 at low effort, 5/5 at medium.
- **Helper:** the author's sweep passed 175 of 175 checks on Node 26 and 24. The coordinator then found two gaps in `remove`, reproduced in a scratch repo:
  - git deletes ignored files such as statements and `.env` files without asking;
  - `branch -d` from the main checkout cannot delete a branch merged into a base other than `main`.

  Both are fixed. Two independent reviews (code and docs) followed; their fixes are in, and the sweep passes 234 of 234.

- **Handoff demo:** Claude started `p4-handoff-demo`, committed and handed off; a fresh Codex session continued in its own worktree and committed; neither worktree was touched by the other agent; both were removed cleanly.

## Known problems (not fixed; each needs the maintainer)

1. **Root `README.md`:** the ST Finance README gives a local patch overview and Node.js >=22.22.0. It does not include patch-application steps; inspect each patch against the installed Burnrate version before applying it privately. Historical spec G-4 refers to the old README.
2. **Skipped files may show as failed imports.** The Burnrate patch logs skipped non-card and ignored files with status "error", so the Statements page may list them as "Parse failed" after each Burnrate restart (spec G-17). Changing patches is HIGH.
3. **Card hints in public files:** Burnrate patch comments include a real card-issuer prefix in an example filename and hint at a card product (public since `89af6c1c`); ADR 0001's Context hints at which issuers are in use.
4. **`.gitignore` gaps:** no patterns for a downloaded Google OAuth client JSON or for local agent settings. Phase 5's hook and Claude deny rules now block the client JSON; the `.gitignore` lines themselves are the maintainer's call.
5. **Possible UI bug:** `src/styles/optimize.css` uses colour variables that no stylesheet defines.
6. **Historical specification and ADR need review.** Draft spec 001 and accepted ADR 0001 describe the older `e7598889` baseline, including a 120-day/200-message Gmail scan. The current agent rules and local policy now describe the ST Finance app, with approved source-link and theme-key handling. The accepted ADR was not edited; that would require separate explicit approval. Opengrep: 2026-10-21: the pinned Opengrep 1.31.0 scan (`--severity ERROR src scripts`) first exited 1 on two lines of `src/lib/gmail.test.ts`, which asserts the Google origin check; the `cardos-google-origin-only-in-gmail` rule now also excludes that test file, and the scan exits 0. CI now runs on GitHub (first run 2026-10-21).
7. **`.serena/` tracking:** `.serena/` is gitignored, but two of its files are tracked (Phase 6).
8. **`node_modules` symlink:** in `../cardos-ai-os` it points to the main checkout and shows as untracked. Stage explicit paths only; Astro commands here can rewrite the main checkout's Vite cache.
9. **Spec 001 gaps G-1 to G-17** describe the older baseline; revalidate them against the reconciled app before treating them as current gaps.

## Outstanding decisions (maintainer)

- Activate the `protect-main` ruleset (id 25552280, enforcement `disabled`) when ready. Once active, every change to `main` needs a pull request with passing `build`, `gitleaks`, `osv-scanner` and `policy` checks, and deletion and force pushes are blocked. Until then a failing check does not block a merge.
- Ratify the constitution (see its Governance section); accept spec 001 and ADRs 0001 and 0002, or ask for changes. Accepted ADR 0001 still describes the older patch baseline.
- Review the root README's Burnrate sections and decide on known problems 1 to 6.
- Phase 6: accept the Serena 2.0.0 pin (5 days old when pinned) or wait until 2026-10-27, and pin Serena in the default Codex config.
- Phase 11: rehearse the Burnrate backup and restore privately.

## Next steps

1. Open a pull request from `ai/claude/finish-phases` to `main` (publishing is HIGH: needs the maintainer's approval), wait for CI, and merge it only if all jobs pass. Its CI run is the first GitHub evidence for the test and docs steps, and for the advisory `docs:impact` step.
2. Then record that run in [PHASE-STATUS](../docs/ai-engineering/PHASE-STATUS.md) and the [dashboard](../docs/ai-engineering/DASHBOARD.md): P8 becomes Implemented and verified on a pass; P9 stays Partially implemented until the ruleset is active.
3. The maintainer decides the items under Outstanding decisions. Keep telemetry Deferred until a privacy-reviewed source and destination exist.
4. After a merge, other worktrees and the AI-OS branches are superseded by `main`; remove them with `npm run ai:worktree -- remove` once their work is on `main`.

Relevant commits: `4da79314` (`main`), `8b003986` (CI wiring, on `ai/claude/finish-phases`).
