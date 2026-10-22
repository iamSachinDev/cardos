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
| Phase | Closing Phase 12 ([status board](../docs/ai-engineering/PHASE-STATUS.md#status-board)). P1 to P4, P6, P7, P10 and P11 are Implemented and verified; P8 is Implemented but unverified (the GitHub result of the merged CI wiring is not recorded); P5, P9 and P12 are Partially implemented because P5-C5, the `protect-main` ruleset, is Deferred by the maintainer's choice. The maintainer's governance decisions of 2026-10-21 are done and the final verification pass of 2026-10-22 is recorded. |
| Chunk | [phase12-close task](tasks/phase12-close.md): records the maintainer's decisions and the final pass ([INTEGRATION-BOOTSTRAP](../docs/ai-engineering/INTEGRATION-BOOTSTRAP.md#final-pass-2026-10-22)). The CI wiring for Phases 8 and 9 (`8b003986`) reached `main` through pull request #5 (`2429eeb6`). |
| Branches / worktree | `ai/claude/phase12-close`, based on `2429eeb6` (`main` on GitHub after pull request #5); not pushed by the agent that wrote it. This clone has `core.hooksPath=.githooks` set. |
| Owner | Claude owns the [phase12-close task](tasks/phase12-close.md); the earlier [finish-phases](tasks/finish-phases.md) and [reconciliation](tasks/main-reconciliation.md) tasks are merged into `main`. |
| Main checkout | `main` on GitHub is at `2429eeb6` (merge of pull request #5). Direct pushes are possible because the ruleset is Deferred by the maintainer's choice; do not push to `main` without the maintainer's instruction (AGENTS.md §6). |
| Specification | [`specs/001-gmail-sync/spec.md`](../specs/001-gmail-sync/spec.md): Accepted 2026-10-21 as written (a known gap to revise: its 120-day and 200-message Gmail limits predate the one-year scan). Constitution [`.specify/memory/constitution.md`](../.specify/memory/constitution.md) v1.0.0: Ratified 2026-10-21. ADRs 0001 and 0002: Accepted 2026-10-21. |
| Last updated | 2026-10-22 IST |

## Done

- **Phase 2** (`ai-os/phase-2`) and **Phase 3** (`ai-os/phase-3`): Implemented and verified. Shared rules, `.ai/` knowledge, Spec Kit 1.2.1 with both integrations, the constitution (Ratified 2026-10-21) and spec 001 (Accepted 2026-10-21).
- **Phase 4** (`ai-os/phase-4`, Implemented and verified):
  - Codex ignores a repo's `.codex/config.toml` in an untrusted project; `AGENTS.md` is the only shared channel (P4-C1).
  - `scripts/ai-worktree.mjs` (`npm run ai:worktree`): `new`, `list`, `handoff` and `remove`. Branch `ai/<agent>/<task>`, worktree `../cardos-wt/<agent>-<task>`, provenance in git config, a per-task state file `.ai/tasks/<task>.md`.
  - [Handoff runbook](runbooks/handoff.md), `AGENTS.md` §2, §6 and §10, `CLAUDE.md`, `INDEX.md`, the roadmap and PHASE-STATUS.

- **Phase 5** (`ai-os/phase-5`, on `main`): Claude Code deny/ask/allow rules and Bash sandbox (`.claude/settings.json`), a Codex `cardos` profile (`codex -p cardos`; installed in `~/.codex`, example in `docs/ai-engineering/`), Codex command rules (`.codex/rules/cardos.rules`), the pre-commit hook, CI and Dependabot (first CI run 39613874631 on `4da79314`: build, gitleaks, osv-scanner, policy all `success`; Dependabot is live), the `protect-main` ruleset (imported with enforcement `disabled`: `evaluate` mode needs an Enterprise plan; id 25552280; Deferred by the maintainer's choice on 2026-10-21), Opengrep and Conftest (both kept), and [GUARDRAILS.md](../docs/ai-engineering/GUARDRAILS.md).

- **Phase 6** (`ai-os/phase-6`): Serena 2.0.0 pinned and read-only for both agents (`.mcp.json`, `.serena/project.yml`, the Codex `cardos` profile), the [MCP registry](../docs/ai-engineering/MCP-REGISTRY.md), [lifecycle rules](LIFECYCLE.md) and [ADR 0002](decisions/0002-agent-memory.md) (ai-memory: DEFER, Proposed).
- **Phase 9 chunk** (`ai/codex/evaluation-quality`, on `main`): `npm test` passes 14 unit tests across `src/lib` (11 when recorded); a four-task Promptfoo/Codex SDK pilot passes on synthetic snippets. Reproduction and limits are in [EVALUATION-QUALITY.md](../docs/ai-engineering/EVALUATION-QUALITY.md). CI wiring: `8b003986`, pending its pull request run.
- **Phase 10** (`ai/codex/dashboard`, on `main`): [DASHBOARD.md](../docs/ai-engineering/DASHBOARD.md) gathers status, local check evidence, the published CI run and the synthetic Promptfoo result. Both installed CLIs document OpenTelemetry export; no collector or live export was enabled (telemetry stays Deferred). Implemented and verified with run 39613874631.
- **Phase 11 local chunk** (`ai/codex/production`): direct dependency declarations match the locked versions, and [PRODUCTION.md](../docs/ai-engineering/PRODUCTION.md) covers a stopped-service Burnrate snapshot and restore. No live financial data was accessed and no backup was run.
- **Phase 12 local chunk** (`ai/codex/integration-bootstrap`): clean `npm ci`, tests, build, policy checks and generic bootstrap in synthetic repositories. [INTEGRATION-BOOTSTRAP.md](../docs/ai-engineering/INTEGRATION-BOOTSTRAP.md) lists each earlier phase's evidence and remaining gates. OSV was unavailable because its service could not be resolved.
- **Current reconciliation** (`ai/codex/main-reconciliation`): merged committed ST Finance app changes into the local AI-OS branch, aligned package metadata, restored Gmail setup guidance, corrected the spend trend's missing-month presentation, and updated agent/policy rules with the maintainer's approval. Combined checks and limits are in the [task record](tasks/main-reconciliation.md).
- **Finish phases** (`ai/claude/finish-phases`): CI wiring for Phases 8 and 9 in `8b003986` (locally: `npm test` 14/14, `docs:test`, `docs:links`, `docs:routes:check` exit 0); status docs updated with the published run and the imported ruleset. Details in the [task record](tasks/finish-phases.md).
- **Phase 12 close** (`ai/claude/phase12-close`): the maintainer's decisions of 2026-10-21 (constitution ratified, spec 001 and ADRs 0001 and 0002 accepted, README Burnrate sections removed, ruleset Deferred) and the final verification pass of 2026-10-22 with every exit code, in [INTEGRATION-BOOTSTRAP](../docs/ai-engineering/INTEGRATION-BOOTSTRAP.md#final-pass-2026-10-22).

## Checks (details and dates in PHASE-STATUS)

- **Claude Code:** rules quiz 5/5 (tools disabled); spec 001 quiz 5/5 (read-only tools).
- **Codex:** rules quiz 5/5 with no commands run; spec 001 quiz 4/5 at low effort, 5/5 at medium.
- **Helper:** the author's sweep passed 175 of 175 checks on Node 26 and 24. The coordinator then found two gaps in `remove`, reproduced in a scratch repo:
  - git deletes ignored files such as statements and `.env` files without asking;
  - `branch -d` from the main checkout cannot delete a branch merged into a base other than `main`.

  Both are fixed. Two independent reviews (code and docs) followed; their fixes are in, and the sweep passes 234 of 234.

- **Handoff demo:** Claude started `p4-handoff-demo`, committed and handed off; a fresh Codex session continued in its own worktree and committed; neither worktree was touched by the other agent; both were removed cleanly.

## Known problems (not fixed; each needs the maintainer)

1. **Root `README.md`:** done on 2026-10-21 at the maintainer's decision: the Burnrate patch, Gmail and Burnrate privacy sections are removed and the README is back to ST Finance wording (Node.js >=22.22.0 and `npm ci` kept). `AGENTS.md` §3 still says "the README's patch overview", which no longer exists; fixing it is a HIGH-class edit for the maintainer. The patches are in `patches/`, explained by ADR 0001; inspect each against the installed Burnrate version before applying it privately.
2. **Skipped files may show as failed imports.** The Burnrate patch logs skipped non-card and ignored files with status "error", so the Statements page may list them as "Parse failed" after each Burnrate restart (spec G-17). Changing patches is HIGH.
3. **Card hints in public files:** Burnrate patch comments include a real card-issuer prefix in an example filename and hint at a card product (public since `89af6c1c`); ADR 0001's Context hints at which issuers are in use.
4. **`.gitignore` gaps:** no patterns for a downloaded Google OAuth client JSON or for local agent settings. Phase 5's hook and Claude deny rules now block the client JSON; the `.gitignore` lines themselves are the maintainer's call.
5. **Possible UI bug:** `src/styles/optimize.css` uses colour variables that no stylesheet defines.
6. **Accepted spec 001 and accepted ADR 0001 describe the older `e7598889` baseline**, including a 120-day/200-message Gmail scan; the maintainer accepted both on 2026-10-21 as written, and the spec records this as a known gap to revise (revising an Accepted spec or ADR needs the maintainer's approval). The current agent rules and local policy describe the ST Finance app, with approved source-link and theme-key handling. Opengrep: on 2026-10-22 the pinned Opengrep 1.31.0 scan (`--severity ERROR src scripts`) exits 0 (10 rules, 49 files, 0 findings). CI runs on GitHub (first run 2026-10-21).
7. **`.serena/` tracking:** `.serena/` is gitignored, but two of its files are tracked (Phase 6).
8. **`node_modules` symlink:** in `../cardos-ai-os` it points to the main checkout and shows as untracked. Stage explicit paths only; Astro commands here can rewrite the main checkout's Vite cache.
9. **Spec 001 gaps G-1 to G-17** describe the older baseline; revalidate them against the reconciled app before treating them as current gaps.

## Outstanding decisions (maintainer)

Decided on 2026-10-21 and recorded: constitution ratified; spec 001 and ADRs 0001 and 0002 accepted; README Burnrate sections removed; `protect-main` ruleset kept disabled (P5-C5 Deferred; revisit when the maintainer wants PR-only changes to `main`).

- Phase 6: accept the Serena 2.0.0 pin (5 days old when pinned) or wait until 2026-10-27, and pin Serena in the default Codex config.
- Phase 11: rehearse the Burnrate backup and restore privately.
- Optionally: `AGENTS.md` §3 sentence about the README's patch overview; revise spec 001's Gmail limits; decide known problems 2 to 5; choose which Claude Code install to keep (see below).

## Next steps

What remains is small: the Deferred ruleset and Dependabot pull requests #2 to #4.

1. Dependabot pull requests #2 to #4: review each, one at a time, with `npm ci`, `npm test` and `npm run build`. **#4 is a TypeScript major bump (5.9 to 7.0)** and needs care: check `astro check`, `npx tsc --noEmit` and the Astro, Vitest and `@astrojs/react` compatibility before merging. Read #2 and #3 for what they change before deciding.
2. P5-C5: the `protect-main` ruleset stays disabled by choice. Revisit when PR-only changes to `main` are wanted; then P9's "CI gates block a failing change" can pass.
3. Record the GitHub result of the merged CI wiring (pull request #5) in PHASE-STATUS and the dashboard: P8 becomes Implemented and verified when the run, including the advisory `docs:impact` step, passed. This task could not query GitHub.
4. Run the unmodified `npm run build` once outside the Bash sandbox: inside it, the hashed stylesheet `AppShell.DB-s7gJn.css` matches the sandbox's `*.db-*` rule and Astro's asset move fails (the checks and an equivalent build pass; see the final pass).
5. Model drift: the Claude Code on `PATH` is 2.1.245 and a second install is 2.1.307; the catalog verifies 2.1.303. `npm run ai:models` exits 1 for either. Re-verify, update `policy/data/cli-capabilities.json`, and remove or update the older install.
6. Keep telemetry Deferred until a privacy-reviewed source and destination exist. Remove superseded worktrees with `npm run ai:worktree -- remove` once their work is on `main`.

Relevant commits: `2429eeb6` (`main`, merge of pull request #5), `8b003986` (CI wiring).
