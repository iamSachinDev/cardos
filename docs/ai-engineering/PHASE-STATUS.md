# Phase Status

- **Purpose:** The live record of where each phase of the AI Engineering OS stands, and the evidence behind each status.
- **Audience:** The maintainer and the coding agents (Claude Code, Codex).
- **Owner:** The maintainer.
- **Related docs:** [README](README.md) · [IMPLEMENTATION-ROADMAP.md](IMPLEMENTATION-ROADMAP.md) (plan, criteria, architecture) · [.ai/CURRENT.md](../../.ai/CURRENT.md) (current handoff)
- **How to validate:** Every status other than Not started has evidence in its phase section: what was run or inspected, when, and the result. The board and the Phase 2 chunk table agree with the sections. Links resolve.

> **Rule: a status changes only with recorded evidence.**

Last updated: 2026-10-18 · Base commit: `e7598889` on `main` · Phase 2 branch: `ai-os/phase-2`

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
| [P2](#p2-foundation) | Foundation | In progress | P1 | Run the Codex behavioural quiz after the Codex plan's usage limit resets (about 04:10 on 2026-10-18), record the result here, then mark P2 Implemented and verified. The maintainer reviews the branch and decides whether to merge or open a PR. |
| [P3](#p3-spec-kit) | Spec Kit | Not started | P2 | Upgrade Spec Kit to v1.2.1 in a worktree and review the install diff. |
| [P4](#p4-orchestration) | Orchestration | Not started | P2, P3 | Verify where Codex keeps project-level config, then build the worktree helper. |
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
| Blockers | P2-C2b only: the Codex plan's usage limit (resets about 04:10 on 2026-10-18; cleared by waiting). Pushing the branch is not part of this phase |
| Security findings | gitleaks history, working-tree and staged scans exit 0 ("no leaks found"); only exit codes are recorded, because raw `gitleaks git` output prints the git remote's SSH host alias. Privacy scans of the Phase 2 files (reviewer and verifier, 2026-10-18) found no personal identifiers. Open items for the maintainer: (1) a code comment in `patches/burnrate-0.5.2.patch` uses a real card-issuer prefix in an example filename and other comments name a card product, already public since commit `89af6c1c` (changing patches is HIGH class); (2) `.gitignore` lacks patterns for a downloaded Google OAuth client JSON and for local agent settings (Phase 5); (3) in the Phase 2 worktree `node_modules` is a symlink to the main checkout, so Astro commands there can rewrite the main checkout's Vite cache (regenerable) |
| Documentation status | Implemented and verified |
| Git commit | Local commit on `ai-os/phase-2`, not pushed: `git log -1 ai-os/phase-2`. Base: `e7598889` |

**Chunks** (edit the Status column when a chunk's evidence is recorded):

| Chunk | Deliverable | Status | Evidence |
|---|---|---|---|
| P2-C0 | Create the worktree `../cardos-ai-os` on branch `ai-os/phase-2` at base commit `e7598889` | Implemented and verified | `git worktree list` shows `../cardos-ai-os` on `ai-os/phase-2` at `e7598889` (checked 2026-10-18) |
| P2-C1 | `AGENTS.md` | Implemented and verified | Checked by the independent reviewer. Every command in §2 run in the worktree: `npx tsc --noEmit` exit 0; `npm run check` 33 files, 0 errors; `npm run build` 12 pages; gitleaks history, working-tree and staged scans exit 0 (2026-10-18). Review fixes include the Node.js requirement (the locked Astro needs >= 22.22.0); the coordinator added the approval rule for changing accepted ADRs |
| P2-C2a | `CLAUDE.md` plus the Claude Code load test | Implemented and verified | A fresh `claude -p` session with all tools disabled (`--tools ""`), fast tier, answered 5/5 rule questions correctly from the auto-loaded `AGENTS.md`, both before the review and again on the final `AGENTS.md` (sha256 prefix `85707b7fa6ff`, 2026-10-18) |
| P2-C2b | Codex load test | Blocked | Offline check passed on the final `AGENTS.md`: `codex debug prompt-input` in the worktree contains the whole file (8 section markers present, not truncated), and the same check in the main checkout (no `AGENTS.md`) contains none of it. The behavioural quiz via `codex exec` is blocked by the Codex plan's usage limit (resets about 04:10 on 2026-10-18) |
| P2-C3 | The `.ai/` files: `CONTEXT.md`, `INDEX.md`, `CURRENT.md` and `decisions/0001-local-burnrate-patch.md` | Implemented and verified | `CONTEXT.md`, `INDEX.md` and ADR 0001 written by a writer agent, then checked by the reviewer against the code (file:line references, endpoints, timings, the patch file list hunk by hunk); `CURRENT.md` written by the coordinator (2026-10-18) |
| P2-C4 | These docs: `README.md`, `IMPLEMENTATION-ROADMAP.md`, `PHASE-STATUS.md` | Implemented and verified | Reviewer's link check: 132 relative links, 0 broken apart from the then-missing `CURRENT.md`, which now exists; every status uses the vocabulary; capability legend added (2026-10-18) |
| P2-C5 | Local commit, no push | Implemented and verified | This commit on `ai-os/phase-2` (local only, not pushed). Gates run before committing: `gitleaks git --staged` exit 0, `npm run build` exit 0 |

**Verification evidence** (2026-10-18; questions and raw outputs were kept outside the repo):

- Cross-agent load test: 5 identical questions about repo rules. Claude Code 5/5 PASS with tools disabled; Codex offline context load PASS with a negative control; Codex behavioural quiz Blocked (usage limit).
- Independent review: 13 fixes across 6 files, 0 high severity; facts re-checked against the code and lockfile.
- Final verifier run on the final files: typecheck, build and gitleaks pass; privacy scan of the 9 Phase 2 files found 0 personal identifiers.

**Model routing used in this phase** (evidence for [capability 11](IMPLEMENTATION-ROADMAP.md#capability-legend), model and reasoning-effort routing):

| Role | Tier | Work | Status |
|---|---|---|---|
| Writers: three agents in parallel | Balanced | Documentation: `AGENTS.md` and `CLAUDE.md`; the `.ai/` files; these three docs | Implemented and verified |
| Reviewer: one independent agent | Premium | Final critical review of all Phase 2 files | Implemented and verified (13 fixes across 6 files, 0 high severity) |
| Verifier: one agent | Balanced | Re-run every check on the final files | Implemented and verified |
| Load test | Fast (Claude Code, tools disabled) / low reasoning effort (Codex) | Verify that each agent loads `AGENTS.md` | Claude Implemented and verified; Codex behavioural quiz Blocked |

The tiers are descriptive. Phase 7 maps them to real models and effort levels.

### P3: Spec Kit

| Field | Value |
|---|---|
| Completion criteria | Spec Kit v1.2.1 pinned and installed from a worktree with the diff reviewed; both integrations installed; a constitution and a retroactive Gmail sync spec with requirement IDs exist; `AGENTS.md` §9, `.ai/INDEX.md` and the README stop marking them as planned ([roadmap](IMPLEMENTATION-ROADMAP.md#p3-spec-kit)) |
| Chunks | Defined when the phase starts |
| Verification evidence | None yet |
| Blockers | None recorded |
| Security findings | None yet. Constraint: the Claude integration can write `.claude/settings.json`, so install in a worktree and review the diff. Changes to agent settings are HIGH risk and need the maintainer's approval |
| Documentation status | Not started |
| Git commit | None |

### P4: Orchestration

| Field | Value |
|---|---|
| Completion criteria | A helper creates a worktree and branch per task; ownership is recorded in `tasks.md` and `.ai/CURRENT.md`; one task is handed from Claude Code to Codex end to end with the evidence recorded ([roadmap](IMPLEMENTATION-ROADMAP.md#p4-orchestration)) |
| Chunks | Defined when the phase starts |
| Verification evidence | None yet. Check first: where Codex keeps project-level config (unverified) |
| Blockers | None recorded |
| Security findings | None yet. Constraint: each agent works only in its own worktree (see the incident in the [roadmap](IMPLEMENTATION-ROADMAP.md#incident-behind-the-multi-agent-rules)) |
| Documentation status | Not started |
| Git commit | None |

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
