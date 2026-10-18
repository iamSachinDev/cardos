# Phase Status

- **Purpose:** The live record of where each phase of the AI Engineering OS stands, and the evidence behind each status.
- **Audience:** The maintainer and the coding agents (Claude Code, Codex).
- **Owner:** The maintainer.
- **Related docs:** [README](README.md) · [IMPLEMENTATION-ROADMAP.md](IMPLEMENTATION-ROADMAP.md) (plan, criteria, architecture) · [.ai/CURRENT.md](../../.ai/CURRENT.md) (session summary)
- **How to validate:** Every status other than Not started has evidence in its phase section: what was run or inspected, when, and the result. The board and the Phase 2 chunk table agree with the sections. Links resolve.

> **Rule: a status changes only with recorded evidence.**

Last updated: 2026-10-18 · Base commit: `e7598889` on `main` · Branches: `ai-os/phase-2` → `ai-os/phase-3` → `ai-os/phase-4`, each stacked on the previous one, local and not pushed. `main` has since moved ahead (see [.ai/CURRENT.md](../../.ai/CURRENT.md))

## Status vocabulary

| Status | Meaning | Evidence needed to set it |
|---|---|---|
| Implemented and verified | Built, and a check has confirmed it works | A recorded check: what was run, when, and the result |
| Implemented but unverified | Built, with no passing check recorded yet | The artifact: a path or commit |
| Partially implemented | Part of the scope is built and part is not | Which parts exist and which are missing |
| In progress | Work has started and is not finished | The artifact in progress: a branch, worktree or file |
| Blocked | Cannot proceed | The blocker, and who can clear it |
| Deferred | Postponed on purpose | The reason, and the phase or condition that revisits it |
| Not applicable | Does not apply to this repo | The reason |
| Not started | Planned, with no work yet | None |

## Status board

This table holds each phase's status and next action. Edit it, and the Phase 2 chunk table, when a status changes. The rest of each phase's record is in [Phase details](#phase-details).

| ID | Phase | Status | Depends on | Next action |
|---|---|---|---|---|
| [P1](#p1-audit) | Audit | Implemented and verified | none | None. The findings are in the [roadmap](IMPLEMENTATION-ROADMAP.md#2-baseline). |
| [P2](#p2-foundation) | Foundation | Implemented and verified | P1 | None. The maintainer reviews `ai-os/phase-2` and decides whether to merge or open a PR. |
| [P3](#p3-spec-kit) | Spec Kit | Implemented and verified | P2 | The maintainer ratifies the constitution and accepts spec 001 (document statuses, tracked in those files), then reviews `ai-os/phase-3`. |
| [P4](#p4-orchestration) | Orchestration | In progress | P2, P3 | Independent review of the helper and docs, gates and a local commit; then the two-agent handoff demo (needs the maintainer's OK for `npm ci` in the demo worktrees). |
| [P5](#p5-guardrails) | Guardrails | Not started | P2, P4 | Map the `AGENTS.md` risk classes to enforcement; ask the maintainer to approve the ruleset on `main` before enabling it. |
| [P6](#p6-code-intelligence-and-memory) | Code intelligence and memory | Not started | P2, P5 | Pin Serena v2 and add it to Claude Code. |
| [P7](#p7-model-routing) | Model routing | Not started | P2 | List the models and effort levels each CLI offers. |
| [P8](#p8-docs-automation) | Docs automation | Not started | P2, P5 | List which docs are applicable to automate. |
| [P9](#p9-evaluation-and-quality) | Evaluation and quality | Not started | P5 | Choose the `src/lib` test scope for Vitest. |
| [P10](#p10-dashboard) | Dashboard | Not started | P2, P5, P9 | Define the status view from this file, Actions and Promptfoo reports. |
| [P11](#p11-production) | Production | Not started | P5 | Pin the `latest` dependencies; outline the Burnrate DB backup and restore runbook. |
| [P12](#p12-integration-verification-and-bootstrap) | Integration verification and bootstrap | Not started | P2 to P11 | Start when P2 to P11 are done. |

## Phase details

Status, dependencies and next action are on the board. Each section below holds the rest of the phase's record: completion criteria, chunks, verification evidence, blockers, security findings, documentation status and git commit. Completion criteria are short forms of the [roadmap](IMPLEMENTATION-ROADMAP.md#6-phase-plan); if they differ, the roadmap wins.

### P1: Audit

| Field | Value |
|---|---|
| Completion criteria | Findings and evidence recorded, adoption matrix verified with the GitHub API, no repo files changed ([roadmap](IMPLEMENTATION-ROADMAP.md#p1-audit)) |
| Chunks | None (one read-only pass) |
| Blockers | None |
| Documentation status | Implemented and verified: findings recorded in [IMPLEMENTATION-ROADMAP.md](IMPLEMENTATION-ROADMAP.md) (P2-C4) |
| Git commit | None (read-only phase) |

**Verification evidence** (all collected 2026-10-17):

| Check | Result |
|---|---|
| gitleaks 8.27.2 over the full git history and the working tree | No leaks (exit 0) |
| Targeted search of all commits for the maintainer's personal identifiers | 0 hits |
| `npm audit` | 0 vulnerabilities |
| `npx tsc --noEmit` | Exit 0 |
| gitleaks full scan time | 0.08 s |
| Serena (code-navigation MCP server, used by Codex) memory | About 50 MB resident across its processes |
| GitHub API, branch protection on `main` | "Branch not protected" |
| Adoption matrix (versions, licenses, activity) | Verified with the GitHub API |

**Security findings:**

- Clean: no leaks, no personal identifiers in commits and no known vulnerabilities (evidence above).
- Gaps: `main` has no branch protection, and the repo has no CI and no git hooks.
- In practice, what stopped agents from reaching financial data was Claude Code's auto-mode classifier, not an explicit deny rule. Phase 5 adds deny rules.
- Runtime dependencies are declared as `latest`.
- The Burnrate patch is HIGH risk.

### P2: Foundation

| Field | Value |
|---|---|
| Completion criteria | `AGENTS.md`, `CLAUDE.md`, the `.ai/` files and these three docs exist and are committed locally on `ai-os/phase-2` (not pushed). Fresh Claude Code and Codex sessions answer the same questions about repo rules the same way, and agree with `AGENTS.md` ([roadmap](IMPLEMENTATION-ROADMAP.md#p2-foundation)) |
| Chunks | See the chunk table below |
| Blockers | None. The Codex usage limit that blocked P2-C2b cleared on 2026-10-18. Pushing the branch is not part of this phase |
| Security findings | gitleaks history, working-tree and staged scans exit 0 ("no leaks found"); only exit codes are recorded, because raw `gitleaks git` output prints the git remote's SSH host alias. Privacy scans of the Phase 2 files (reviewer and verifier, 2026-10-18) found no personal identifiers. Open items for the maintainer: (1) a code comment in `patches/burnrate-0.5.2.patch` uses a real card-issuer prefix in an example filename and other comments name a card product, already public since commit `89af6c1c` (changing patches is HIGH class); (2) `.gitignore` lacks patterns for a downloaded Google OAuth client JSON and for local agent settings (Phase 5); (3) in the Phase 2 worktree `node_modules` is a symlink to the main checkout, so Astro commands there can rewrite the main checkout's Vite cache (regenerable) |
| Documentation status | Implemented and verified |
| Git commit | Local commit on `ai-os/phase-2`, not pushed: `git log -1 ai-os/phase-2`. Base: `e7598889` |

**Chunks** (edit the Status column when a chunk's evidence is recorded):

| Chunk | Deliverable | Status | Evidence |
|---|---|---|---|
| P2-C0 | Create the worktree `../cardos-ai-os` on branch `ai-os/phase-2` at base commit `e7598889` | Implemented and verified | `git worktree list` shows `../cardos-ai-os` on `ai-os/phase-2` at `e7598889` (checked 2026-10-18) |
| P2-C1 | `AGENTS.md` | Implemented and verified | Checked by the independent reviewer. Every command in §2 run in the worktree: `npx tsc --noEmit` exit 0; `npm run check` 33 files, 0 errors; `npm run build` 12 pages; gitleaks history, working-tree and staged scans exit 0 (2026-10-18). Review fixes include the Node.js requirement (the locked Astro needs >= 22.22.0); the coordinator added the approval rule for changing accepted ADRs |
| P2-C2a | `CLAUDE.md` plus the Claude Code load test | Implemented and verified | A fresh `claude -p` session with all tools disabled (`--tools ""`), fast tier, answered 5/5 rule questions correctly from the auto-loaded `AGENTS.md`, both before the review and again on the final `AGENTS.md` (sha256 prefix `85707b7fa6ff`, 2026-10-18) |
| P2-C2b | Codex load test | Implemented and verified | Offline check passed on the final `AGENTS.md`: `codex debug prompt-input` in the worktree contains the whole file (8 section markers present, not truncated), and the same check in the main checkout (no `AGENTS.md`) contains none of it. Behavioural quiz after the usage limit cleared: `codex exec -s read-only`, low reasoning effort, the same 5 questions as Claude Code: 5/5 correct with 0 command executions, so the answers came from the auto-loaded `AGENTS.md` (sha256 prefix `6855ac8a470b`, the working copy on `ai-os/phase-4`; the rules asked about are unchanged since Phase 2) (2026-10-18) |
| P2-C3 | The `.ai/` files: `CONTEXT.md`, `INDEX.md`, `CURRENT.md` and `decisions/0001-local-burnrate-patch.md` | Implemented and verified | `CONTEXT.md`, `INDEX.md` and ADR 0001 written by a writer agent, then checked by the reviewer against the code (file:line references, endpoints, timings, the patch file list hunk by hunk); `CURRENT.md` written by the coordinator (2026-10-18) |
| P2-C4 | These docs: `README.md`, `IMPLEMENTATION-ROADMAP.md`, `PHASE-STATUS.md` | Implemented and verified | Reviewer's link check: 132 relative links, 0 broken apart from the then-missing `CURRENT.md`, which now exists; every status uses the vocabulary; capability legend added (2026-10-18) |
| P2-C5 | Local commit, no push | Implemented and verified | This commit on `ai-os/phase-2` (local only, not pushed). Gates run before committing: `gitleaks git --staged` exit 0, `npm run build` exit 0 |

**Verification evidence** (2026-10-18; questions and raw outputs were kept outside the repo):

- Cross-agent load test: 5 identical questions about repo rules. Claude Code 5/5 PASS with tools disabled; Codex offline context load PASS with a negative control; Codex behavioural quiz 5/5 PASS with no commands run.
- Independent review: 13 fixes across 6 files, 0 high severity; facts re-checked against the code and lockfile.
- Final verifier run on the final files: typecheck, build and gitleaks pass; privacy scan of the 9 Phase 2 files found 0 personal identifiers.

**Model routing used in this phase** (evidence for [capability 11](IMPLEMENTATION-ROADMAP.md#capability-legend), model and reasoning-effort routing):

| Role | Tier | Work | Status |
|---|---|---|---|
| Writers: three agents in parallel | Balanced | Documentation: `AGENTS.md` and `CLAUDE.md`; the `.ai/` files; these three docs | Implemented and verified |
| Reviewer: one independent agent | Premium | Final critical review of all Phase 2 files | Implemented and verified (13 fixes across 6 files, 0 high severity) |
| Verifier: one agent | Balanced | Re-run every check on the final files | Implemented and verified |
| Load test | Fast (Claude Code, tools disabled) / low reasoning effort (Codex) | Verify that each agent loads `AGENTS.md` | Implemented and verified (both 5/5) |

The tiers are descriptive. Phase 7 maps them to real models and effort levels.

### P3: Spec Kit

| Field | Value |
|---|---|
| Completion criteria | Spec Kit v1.2.1 pinned and installed from a worktree with the diff reviewed; both integrations installed; a constitution and a retroactive Gmail sync spec with requirement IDs exist; `AGENTS.md` §9, `.ai/INDEX.md` and the README stop marking them as planned ([roadmap](IMPLEMENTATION-ROADMAP.md#p3-spec-kit)) |
| Chunks | See the chunk table below |
| Verification evidence | Recorded per chunk in the table below |
| Blockers | None. The Codex usage limit that blocked P3-C6b cleared on 2026-10-18. Ratifying the constitution and accepting spec 001 are the maintainer's decisions, not blockers to the phase's criterion |
| Security findings | Install diff reviewed (2026-10-18): no tracked file changed, no `.claude/settings.json` written (`.claude/` holds only `skills/`), no absolute paths or usernames in generated files, all 32 manifest files match their recorded sha256 (reviewer R1). Spec Kit's own `.specify/.gitignore` keeps per-checkout state (`feature.json`, local packages) out of git. `/speckit-taskstoissues` creates public GitHub issues, so `AGENTS.md` §7 now classes publishing to GitHub as HIGH. `.gitignore` for local agent settings remains a Phase 5 item |
| Documentation status | Implemented and verified |
| Git commit | Local commit on `ai-os/phase-3`, not pushed: `git log -1 ai-os/phase-3`. Base: `16e95c5a` on `ai-os/phase-2` |

**Chunks:**

| Chunk | Deliverable | Status | Evidence |
|---|---|---|---|
| P3-C0 | Branch `ai-os/phase-3` in `../cardos-ai-os`, stacked on `ai-os/phase-2` | Implemented and verified | `git log` shows `ai-os/phase-3` based on `16e95c5a` (2026-10-18) |
| P3-C1 | Spec Kit CLI pinned to v1.2.1 | Implemented and verified | `uv tool install specify-cli --force --from git+https://github.com/github/spec-kit.git@v1.2.1`; `specify --version` prints 1.2.1 (previously 0.16.1.dev0). Rollback: `uv tool install specify-cli==0.16.1 --force` (2026-10-18) |
| P3-C2 | Both integrations installed | Implemented and verified | `specify init --here --force --integration claude --script sh --non-interactive --ignore-agent-tools`, then `specify integration install codex`. `specify integration status`: OK, installed claude and codex, default claude, multi-install safe, 0 modified or missing managed files. Codex's prompt (`codex debug prompt-input`) lists all 10 `speckit-*` skills; a fresh Claude Code session lists the same 10 (2026-10-18) |
| P3-C3 | Constitution v1.0.0 (Proposed, pending ratification) | Implemented and verified | Written by a writer agent following `/speckit-constitution`; independent review R1 fixed 17 issues (none high severity); authority order mirrors `AGENTS.md` §9; 66 links resolve; privacy and gitleaks scans clean (2026-10-18). Not ratified |
| P3-C4 | Retroactive spec `specs/001-gmail-sync/spec.md` (Draft, pending acceptance) with requirement IDs and traceability | Implemented and verified | Written by a writer agent following `/speckit-specify`. Independent review R2 checked all 59 requirements (FR-001 to FR-059, non-functional FR-050 to FR-059) and 10 success criteria against the code and both patches; fixed over-credited evidence and code mismatches; resolved both clarifications with coordinator-verified Burnrate source facts. Traceability: 59 of 59 rows name code, 6 partial evidence, 53 unverified, 0 tests (Phase 9). Gaps G-1 to G-17 recorded. Not accepted (2026-10-18) |
| P3-C5 | `AGENTS.md` §7, §9 and §10, `.ai/INDEX.md` and the README stop marking Spec Kit as planned | Implemented and verified | Edited by the coordinator, checked by R1 (which corrected the §10 Spec Kit note: 1.2.1's new-feature script creates no git branches without the optional git extension) (2026-10-18) |
| P3-C6a | Claude Code reads the spec | Implemented and verified | A fresh `claude -p` session (fast tier, read-only tools, plan mode) answered 5/5 questions whose answers exist only in spec 001: status, FR-006 and its origin, the 180 s timeout (FR-014), the XLS/XLSX limitation (FR-034, G-4), the FR-050 to FR-059 range. It changed no files (2026-10-18) |
| P3-C6b | Codex reads the spec | Implemented and verified | Skill visibility verified (P3-C2). The same 5-question quiz via `codex exec -s read-only`: at low reasoning effort 4/5 (it printed only lines 225 to 237 of the spec and missed FR-059 on line 238, so it gave the non-functional range as FR-050 to FR-058); escalated once to medium effort, it read the whole file and answered 5/5. Neither run changed any file (2026-10-18) |
| P3-C7 | Local commit, no push | Implemented and verified | This commit on `ai-os/phase-3` (local only, not pushed). Gates run before committing: `gitleaks git --staged` exit 0, `npm run build` exit 0 |

Routing in this phase: two writer agents (balanced tier), two independent reviewers (premium tier), visibility checks on the fast tier. Escalation evidence for Phase 7: Codex's spec quiz failed one question at low effort (partial file read) and passed at medium, so reading-comprehension checks over long files should start at medium effort.

### P4: Orchestration

| Field | Value |
|---|---|
| Completion criteria | A helper creates a worktree and branch per task; ownership is recorded in the branch name (`ai/<agent>/<task>`), git config provenance and a per-task file `.ai/tasks/<task>.md` that travels with the task's branch (for spec-driven work it references the task IDs in `specs/NNN-name/tasks.md`); one task is handed from Claude Code to Codex end to end with the evidence recorded ([roadmap](IMPLEMENTATION-ROADMAP.md#p4-orchestration)). Refined at phase start (2026-10-18): the draft named `tasks.md` and `.ai/CURRENT.md` as the ownership record, but `tasks.md` exists only for spec-driven features and one shared file would conflict between concurrent tasks |
| Chunks | See the chunk table below |
| Verification evidence | Recorded per chunk in the table below |
| Blockers | None for the helper and docs; the Codex usage limit cleared on 2026-10-18. The handoff demo (P4-C5a, P4-C5b) needs the maintainer's approval for `npm ci` in the two demo worktrees: `AGENTS.md` §8 requires `npm run build` before every commit, and `npm ci` is MEDIUM (§2) |
| Security findings | Constraint: each agent works only in its own worktree (see the incident in the [roadmap](IMPLEMENTATION-ROADMAP.md#incident-behind-the-multi-agent-rules)). Codex ignores a repo's `.codex/config.toml` in an untrusted project (P4-C1), so repo-level Codex settings cannot enforce anything; shared rules stay in `AGENTS.md` (relevant to Phase 5's per-agent MCP permissions). Coordinator review of the helper, both reproduced in a scratch repo on git 2.54 (2026-10-18): (1) `git worktree remove` without `--force` silently deletes **ignored** files, which in this repo include statements and `.env` files (a synthetic `.env` and PDF were deleted, exit 0), so the helper must refuse such a worktree and print only a count, since file names can be real data; (2) `git branch -d` checks the merge against the HEAD of the tree it runs in, so from the main checkout it could never delete a task branch merged into a base other than `main`. Both are fixed and tested (P4-C2). The helper never passes `--force` or `branch -D`, runs git with argument arrays (no shell) and sets `GIT_OPTIONAL_LOCKS=0`, so read-only checks never rewrite another worktree's index |
| Documentation status | In progress |
| Git commit | Not committed yet. Base: `9b15113b` on `ai-os/phase-3` |

**Chunks:**

| Chunk | Deliverable | Status | Evidence |
|---|---|---|---|
| P4-C0 | Branch `ai-os/phase-4` in `../cardos-ai-os`, stacked on `ai-os/phase-3` | Implemented and verified | `git log` shows `ai-os/phase-4` based on `9b15113b` (2026-10-18) |
| P4-C1 | Where Codex keeps project-level config (the "check first" item) | Implemented and verified | Controlled test with Codex CLI 0.159.2 in a throwaway untrusted repo: `codex debug prompt-input` contained the repo's `AGENTS.md` marker but not a marker set in the repo's `.codex/config.toml`; the same key set with `-c` appeared, so the key is valid; `codex doctor` listed only `~/.codex/config.toml`. Conclusion: an untrusted project's `.codex/config.toml` is not loaded; `AGENTS.md` is. Whether a trusted project loads it is unverified (testing it would change the maintainer's Codex config) (2026-10-18) |
| P4-C2 | Worktree helper `scripts/ai-worktree.mjs` (`npm run ai:worktree`) | Implemented and verified | Written by a helper agent; after the two `remove` fixes its sweep passed 234 of 234 checks on Node 26.12.0 and 24.11.1 in a throwaway clone (`new`, `list`, `handoff`, `remove`, dry runs, refusals, provenance, the state file, hand-back, ignored-file refusal by count only, deletion from the base's worktree). Independent code review and coordinator follow-ups in P4-C6, re-tested in a scratch repo (2026-10-18). End-to-end use: P4-C5 |
| P4-C3 | Handoff runbook `.ai/runbooks/handoff.md`; `AGENTS.md` §2, §6 and §10; `.ai/INDEX.md`; `CLAUDE.md` | Implemented and verified | Written by a docs agent, then aligned by the coordinator with the helper's final messages (a fresh worktree is dirty until the task file is committed; base warning; hand-back; ignored-file refusal). Independent docs review in P4-C6 (2026-10-18) |
| P4-C4 | Per-task state file `.ai/tasks/<task>.md`, written by the helper on `new` and updated on `handoff`; `.ai/CURRENT.md` stays the session summary | Implemented and verified | Added to the helper after the docs agent showed that one shared table would conflict between concurrent task branches. Covered by the helper's sweep (exact content, no absolute paths, extra sections kept on handoff, symlink-safe writes) |
| P4-C5a | Handoff demo, Claude's half: task worktree via the helper, committed work, `.ai/tasks/<task>.md` updated, `handoff` to Codex | Not started | Runs after the local commit, so both demo worktrees hold the committed helper and rules. Needs the maintainer's approval for `npm ci` (see Blockers) |
| P4-C5b | Handoff demo, Codex's half: continue in its own worktree from Claude's commits | Not started | The Codex usage limit cleared (2026-10-18). Needs the same approval. Open question: Codex's `workspace-write` sandbox may block `git commit` in a linked worktree, whose git directory lives under the main checkout's `.git` (`codex exec --add-dir` exists in 0.159.2; not yet tried) |
| P4-C6 | Independent review, gates, local commit | In progress | Two independent reviewers (premium tier), 2026-10-18. Code: 3 medium defects reproduced in a scratch clone and fixed: inherited `GIT_DIR`/`GIT_WORK_TREE` could aim the safety checks at another checkout; `handoff` skipped the clean-source check while the source was mid-rebase; `--base HEAD` resolved in the main checkout. Docs: 14 fixes across 8 files (4 medium, all in the runbook: who removes on hand-back, the order of the two removes, the finish steps, resuming a handed-off branch), 156 links resolve, privacy clean. Coordinator follow-ups: a folder holding only OS clutter no longer blocks `remove` (`--ignored=matching`); per-checkout agent state counts as disposable; new task files start as In progress |

### P5: Guardrails

| Field | Value |
|---|---|
| Completion criteria | Each `AGENTS.md` risk class mapped to its enforcement; deny rules for Burnrate data and statements in both agents; gitleaks in pre-commit and CI; osv-scanner running; Dependabot configured in `.github/dependabot.yml`; an MCP allowlist and per-agent MCP permissions for both agents; a ruleset on `main`; Opengrep and Conftest pilots decided; negative tests pass ([roadmap](IMPLEMENTATION-ROADMAP.md#p5-guardrails)) |
| Chunks | Defined when the phase starts |
| Verification evidence | None yet. Check first: Claude Code's shell sandbox on macOS (unverified), and how Dependabot handles the `latest` dependency declarations (pinning is P11) |
| Blockers | None recorded. The ruleset on `main` needs the maintainer's explicit approval before it is enabled |
| Security findings | Baseline from P1: `main` is unprotected, there is no CI or hooks, and the auto-mode classifier was the effective control. Deny rules and hooks are defense in depth, not a sandbox. Changes to CI, workflows and agent permissions are HIGH risk |
| Documentation status | Not started |
| Git commit | None |

### P6: Code intelligence and memory

| Field | Value |
|---|---|
| Completion criteria | Serena v2 pinned and working in both agents; an MCP registry; `.ai/` lifecycle rules; the ai-memory decision recorded (current verdict: DEFER) ([roadmap](IMPLEMENTATION-ROADMAP.md#p6-code-intelligence-and-memory)) |
| Chunks | Defined when the phase starts |
| Verification evidence | None yet |
| Blockers | None recorded |
| Security findings | None yet. Constraints: no real data in memory; ai-memory is DEFER because its default hooks capture prompts and tool calls; Serena's GPL-3.0 license is fine for local use |
| Documentation status | Not started |
| Git commit | None |

### P7: Model routing

| Field | Value |
|---|---|
| Completion criteria | `model-policy.yaml` maps task tiers to real Claude and Codex models and effort levels, and a dry-run checker validates it without running an agent ([roadmap](IMPLEMENTATION-ROADMAP.md#p7-model-routing)) |
| Chunks | Defined when the phase starts |
| Verification evidence | None yet. Precedent: the Phase 2 routing record in [P2](#p2-foundation) |
| Blockers | None recorded |
| Security findings | None yet. Constraint: routing uses each CLI's native model switching, because OmniRoute is REJECT (it routes prompts to third-party providers) |
| Documentation status | Not started |
| Git commit | None |

### P8: Docs automation

| Field | Value |
|---|---|
| Completion criteria | A written list of automated docs and Not applicable doc types; link checking runs; a CI doc-impact check reports when a change may need a doc update ([roadmap](IMPLEMENTATION-ROADMAP.md#p8-docs-automation)) |
| Chunks | Defined when the phase starts |
| Verification evidence | None yet |
| Blockers | None recorded |
| Security findings | None yet |
| Documentation status | Not started |
| Git commit | None |

### P9: Evaluation and quality

| Field | Value |
|---|---|
| Completion criteria | Vitest covers `src/lib` and runs in CI; CI gates block a failing change; a Promptfoo pilot runs 3 to 5 agent tasks on redacted fixtures and its result is recorded ([roadmap](IMPLEMENTATION-ROADMAP.md#p9-evaluation-and-quality)) |
| Chunks | Defined when the phase starts |
| Verification evidence | None yet |
| Blockers | None recorded |
| Security findings | None yet. Constraint: fixtures and evals use synthetic or redacted data only, because the repo is public |
| Documentation status | Not started |
| Git commit | None |

### P10: Dashboard

| Field | Value |
|---|---|
| Completion criteria | Phase status, check results and eval results can be viewed from this file, GitHub Actions and Promptfoo reports without a new service; the telemetry stack stays Deferred until a real telemetry source exists ([roadmap](IMPLEMENTATION-ROADMAP.md#p10-dashboard)) |
| Chunks | Defined when the phase starts |
| Verification evidence | None yet. Check first: native OpenTelemetry export from both CLIs (unverified) |
| Blockers | None recorded |
| Security findings | None yet. Constraint: reports must not contain real data |
| Documentation status | Not started |
| Git commit | None |

### P11: Production

| Field | Value |
|---|---|
| Completion criteria | Runtime dependencies pinned instead of `latest`; a runbook for backing up and restoring the Burnrate database. Not applicable: deployment, infrastructure, rollouts, signing, load and chaos testing, service catalog (nothing is deployed) ([roadmap](IMPLEMENTATION-ROADMAP.md#p11-production)) |
| Chunks | Defined when the phase starts |
| Verification evidence | None yet |
| Blockers | None recorded |
| Security findings | None yet. Constraints: backups contain financial data and must stay out of git; `latest` ranges accept any new release until they are pinned |
| Documentation status | Not started |
| Git commit | None |

### P12: Integration verification and bootstrap

| Field | Value |
|---|---|
| Completion criteria | On a clean checkout, one verification pass confirms each earlier phase's criterion, and a reusable bootstrap sets up the same foundation in another repo ([roadmap](IMPLEMENTATION-ROADMAP.md#p12-integration-verification-and-bootstrap)) |
| Chunks | Defined when the phase starts |
| Verification evidence | None yet |
| Blockers | None recorded |
| Security findings | None yet |
| Documentation status | Not started |
| Git commit | None |

## How to update this file

1. Run the check, and copy what was run, the date and the result into the phase's evidence.
2. Change the status on the board (and in the Phase 2 chunk table for a chunk).
3. Update the phase's security findings, documentation status and git commit, and "Last updated" at the top.
