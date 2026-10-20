# Phase Status

- **Purpose:** The live record of where each phase of the AI Engineering OS stands, and the evidence behind each status.
- **Audience:** The maintainer and the coding agents (Claude Code, Codex).
- **Owner:** The maintainer.
- **Related docs:** [README](README.md) · [DASHBOARD.md](DASHBOARD.md) (status and result links) · [IMPLEMENTATION-ROADMAP.md](IMPLEMENTATION-ROADMAP.md) (plan, criteria, architecture) · [.ai/CURRENT.md](../../.ai/CURRENT.md) (session summary)
- **How to validate:** Every status other than Not started has evidence in its phase section: what was run or inspected, when, and the result. The board and the Phase 2 chunk table agree with the sections. Links resolve.

> **Rule: a status changes only with recorded evidence.**

Last updated: 2026-10-20 · Base commit: `e7598889` on `main` · AI-OS phase branches remain local and stacked; Phase 12 is on `ai/codex/integration-bootstrap`, based on the Phase 11 branch. `main` has since moved ahead (see [.ai/CURRENT.md](../../.ai/CURRENT.md))

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
| [P4](#p4-orchestration) | Orchestration | Implemented and verified | P2, P3 | None. The maintainer reviews `ai-os/phase-4` (stacked on phases 2 and 3). |
| [P5](#p5-guardrails) | Guardrails | Partially implemented | P2, P4 | The maintainer decides: push and let CI run once, then apply the ruleset on `main` (P5-C5); install the Codex command rules globally or not (P5-C2). |
| [P6](#p6-code-intelligence-and-memory) | Code intelligence and memory | Implemented and verified | P2, P5 | The maintainer decides: accept the 5-day-old Serena pin as an exception, pin Serena in the default Codex config, and accept ADR 0002. |
| [P7](#p7-model-routing) | Model routing | Implemented and verified | P2 | The maintainer reviews the local `ai-os/phase-7` branch and decides whether to merge or open a PR. |
| [P8](#p8-docs-automation) | Docs automation | Partially implemented | P2, P5 | Local generation, link checking and doc-impact reporting are ready on `ai/codex/docs-automation`; CI wiring remains deferred. |
| [P9](#p9-evaluation-and-quality) | Evaluation and quality | Partially implemented | P5 | Review local tests and pilot; CI test gate remains deferred. |
| [P10](#p10-dashboard) | Dashboard | Partially implemented | P2, P5, P9 | Review the local [status view](DASHBOARD.md); verify Actions checks only after a published run. |
| [P11](#p11-production) | Production | Implemented and verified | P5 | Review the local branch; the maintainer rehearses backup and restore privately before relying on it. |
| [P12](#p12-integration-verification-and-bootstrap) | Integration verification and bootstrap | Partially implemented | P2 to P11 | Review the local [pass and bootstrap](INTEGRATION-BOOTSTRAP.md); reconcile current `main` and finish deferred gates before claiming full integration. |

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
| Blockers | None. The maintainer approved `npm ci` in the two demo worktrees and Codex's write access to the repository's `.git` for the demo (2026-10-18) |
| Security findings | Constraint: each agent works only in its own worktree (see the incident in the [roadmap](IMPLEMENTATION-ROADMAP.md#incident-behind-the-multi-agent-rules)). Codex ignores a repo's `.codex/config.toml` in an untrusted project (P4-C1), so repo-level Codex settings cannot enforce anything; shared rules stay in `AGENTS.md` (relevant to Phase 5's per-agent MCP permissions). Coordinator review of the helper, both reproduced in a scratch repo on git 2.54 (2026-10-18): (1) `git worktree remove` without `--force` silently deletes **ignored** files, which in this repo include statements and `.env` files (a synthetic `.env` and PDF were deleted, exit 0), so the helper must refuse such a worktree and print only a count, since file names can be real data; (2) `git branch -d` checks the merge against the HEAD of the tree it runs in, so from the main checkout it could never delete a task branch merged into a base other than `main`. Both are fixed and tested (P4-C2). The helper never passes `--force` or `branch -D`, runs git with argument arrays (no shell) and sets `GIT_OPTIONAL_LOCKS=0`, so read-only checks never rewrite another worktree's index |
| Documentation status | Implemented and verified |
| Git commit | Local commits on `ai-os/phase-4`, not pushed: `0f9b6b90` (helper and docs), the two demo commits `6feee19c` and `e1f0c827` (fast-forwarded in), and the evidence commit after them. Base: `9b15113b` on `ai-os/phase-3` |

**Chunks:**

| Chunk | Deliverable | Status | Evidence |
|---|---|---|---|
| P4-C0 | Branch `ai-os/phase-4` in `../cardos-ai-os`, stacked on `ai-os/phase-3` | Implemented and verified | `git log` shows `ai-os/phase-4` based on `9b15113b` (2026-10-18) |
| P4-C1 | Where Codex keeps project-level config (the "check first" item) | Implemented and verified | Controlled test with Codex CLI 0.159.2 in a throwaway untrusted repo: `codex debug prompt-input` contained the repo's `AGENTS.md` marker but not a marker set in the repo's `.codex/config.toml`; the same key set with `-c` appeared, so the key is valid; `codex doctor` listed only `~/.codex/config.toml`. Conclusion: an untrusted project's `.codex/config.toml` is not loaded; `AGENTS.md` is. Whether a trusted project loads it is unverified (testing it would change the maintainer's Codex config) (2026-10-18) |
| P4-C2 | Worktree helper `scripts/ai-worktree.mjs` (`npm run ai:worktree`) | Implemented and verified | Written by a helper agent; after the two `remove` fixes its sweep passed 234 of 234 checks on Node 26.12.0 and 24.11.1 in a throwaway clone (`new`, `list`, `handoff`, `remove`, dry runs, refusals, provenance, the state file, hand-back, ignored-file refusal by count only, deletion from the base's worktree). Independent code review and coordinator follow-ups in P4-C6, re-tested in a scratch repo (2026-10-18). End-to-end use: P4-C5 |
| P4-C3 | Handoff runbook `.ai/runbooks/handoff.md`; `AGENTS.md` §2, §6 and §10; `.ai/INDEX.md`; `CLAUDE.md` | Implemented and verified | Written by a docs agent, then aligned by the coordinator with the helper's final messages (a fresh worktree is dirty until the task file is committed; base warning; hand-back; ignored-file refusal). Independent docs review in P4-C6 (2026-10-18) |
| P4-C4 | Per-task state file `.ai/tasks/<task>.md`, written by the helper on `new` and updated on `handoff`; `.ai/CURRENT.md` stays the session summary | Implemented and verified | Added to the helper after the docs agent showed that one shared table would conflict between concurrent task branches. Covered by the helper's sweep (exact content, no absolute paths, extra sections kept on handoff, symlink-safe writes) |
| P4-C5a | Handoff demo, Claude's half: task worktree via the helper, committed work, `.ai/tasks/<task>.md` updated, `handoff` to Codex | Implemented and verified | 2026-10-18, task `p4-handoff-demo`: `new --base ai-os/phase-4` created `../cardos-wt/claude-p4-handoff-demo` on `ai/claude/p4-handoff-demo` with the task file and no rules warning; `npm ci`; Claude filled in the state and next step, ran the §8 gates (gitleaks staged exit 0, build exit 0) and committed `6feee19c`; `handoff --from claude --to codex` created `ai/codex/p4-handoff-demo` at `6feee19c` and changed only the owner, branch and worktree lines plus one history line. A snapshot of Claude's worktree (HEAD, status with ignored files, admin files, mtime and size of every file outside `node_modules`) was identical before and after the handoff |
| P4-C5b | Handoff demo, Codex's half: continue in its own worktree from Claude's commits | Implemented and verified | 2026-10-18: a fresh `codex exec` (Codex CLI 0.159.2, medium effort, `-s workspace-write --add-dir <main checkout>/.git`, `--ephemeral`) started in `../cardos-wt/codex-p4-handoff-demo`. It ran 14 commands, all in its own worktree (event log checked): read the task file, ran `list` and recorded this task's rows, set the state, ran the §8 gates (gitleaks staged exit 0, build exit 0) and committed `e1f0c827`. Claude's worktree snapshot was still identical afterwards. Answers the open question: with `--add-dir` on the repository's `.git`, Codex can commit in a linked worktree. Cleanup: `ai-os/phase-4` fast-forwarded to `e1f0c827`; `remove --agent claude` deleted its branch through the successor, `remove --agent codex` deleted its branch from the base's worktree; no `ai/*` branches, worktrees or provenance remain. The task file `.ai/tasks/p4-handoff-demo.md` stays as the record |
| P4-C6 | Independent review, gates, local commit | Implemented and verified | Two independent reviewers (premium tier), 2026-10-18. Code: 3 medium defects reproduced in a scratch clone and fixed: inherited `GIT_DIR`/`GIT_WORK_TREE` could aim the safety checks at another checkout; `handoff` skipped the clean-source check while the source was mid-rebase; `--base HEAD` resolved in the main checkout. Docs: 14 fixes across 8 files (4 medium, all in the runbook: who removes on hand-back, the order of the two removes, the finish steps, resuming a handed-off branch), 156 links resolve, privacy clean. Coordinator follow-ups: a folder holding only OS clutter no longer blocks `remove` (`--ignored=matching`); per-checkout agent state counts as disposable; new task files start as In progress. Gates for `0f9b6b90`: `gitleaks git --staged` exit 0, `npm run build` exit 0 (12 pages) |

### P5: Guardrails

| Field | Value |
|---|---|
| Completion criteria | Each `AGENTS.md` risk class mapped to its enforcement; deny rules for Burnrate data and statements in both agents; gitleaks in pre-commit and CI; osv-scanner running; Dependabot configured in `.github/dependabot.yml`; an MCP allowlist and per-agent MCP permissions for both agents; a ruleset on `main`; Opengrep and Conftest pilots decided; negative tests pass ([roadmap](IMPLEMENTATION-ROADMAP.md#p5-guardrails)) |
| Chunks | See the chunk table below |
| Verification evidence | Recorded per chunk below; the map and negative tests are in [GUARDRAILS.md](GUARDRAILS.md) |
| Blockers | The ruleset on `main` needs the maintainer's explicit approval and a first CI run, so it is written but not applied (P5-C5). The Codex command rules need the maintainer to install them globally (P5-C2) |
| Security findings | Check-first answered: Claude Code's Bash sandbox (Seatbelt) is what makes a read deny hold against shell commands; without it a `python3` script read a synthetic statement. Command-text rules are bypassable by wrappers, so they are defense in depth only. `allowLocalBinding` lets sandboxed commands reach Burnrate's port. osv-scanner: 381 locked packages, no known vulnerabilities (2026-10-18). Independent review (2026-10-18) fixed 1 high and 4 medium issues: the allowed, unsandboxed `npm run ai:worktree` let a sandboxed command escape by editing the helper (now asked); `core.hooksPath` made hooks writable from the sandbox (now `denyWrite`); a wrong `.vite` write exception (removed, not needed); git-quoted names bypassed the hook (now NUL-separated); gaps in the enforcement map. Deviation: MCP is a denylist in Claude Code and all servers are off in the Codex profile, not an allowlist ([GUARDRAILS.md](GUARDRAILS.md#residual-risks)) |
| Documentation status | Implemented and verified |
| Git commit | Local commit on `ai-os/phase-5`, not pushed: `git log -1 ai-os/phase-5`. Base: `fad72dcd` on `ai-os/phase-4` |

**Chunks:**

| Chunk | Deliverable | Status | Evidence |
|---|---|---|---|
| P5-C0 | Branch `ai-os/phase-5` in `../cardos-ai-os`, stacked on `ai-os/phase-4`; osv-scanner 2.7.0 and Conftest 0.71.1 installed with Homebrew (the maintainer delegated the choice) | Implemented and verified | `git log` shows `ai-os/phase-5` at `fad72dcd`; both `--version` checks (2026-10-18) |
| P5-C1 | Claude Code deny, ask and allow rules, Bash sandbox, MCP limits: `.claude/settings.json` | Implemented and verified | Writer agent; negative tests with synthetic mirrors of the real rules (Read tool and sandboxed `cat`/`python3` refused; 13 dangerous commands denied; `git push`, `npm ci` asked; claude.ai connectors and send/share tools removed from the tool list); Conftest policy passes (2026-10-18) |
| P5-C2 | Codex profile `~/.codex/cardos.config.toml` (example in the repo) and proposed command rules | Partially implemented | Profile: OS-level read deny verified with `codex sandbox -p cardos` on synthetic files; MCP servers off (`codex -p cardos mcp list`). Command rules: `codex execpolicy check` verified, not installed (global `~/.codex/rules/` is the maintainer's call) |
| P5-C3 | Pre-commit hook `.githooks/pre-commit`, enabled with `core.hooksPath` | Implemented and verified | Scratch-repo tests: fake secret blocked, six force-added data files blocked by count without names, normal commit passes, fails closed without gitleaks; enabled in this clone (2026-10-18) |
| P5-C4 | CI workflow (`build`, `gitleaks`, `osv-scanner`, `policy`) and `.github/dependabot.yml` | Implemented but unverified | YAML parses; Conftest workflow and Dependabot policies pass; action SHAs and binary checksums checked against GitHub's release data. Runs only after a push |
| P5-C5 | Ruleset on `main`: `.github/rulesets/main.json` | Blocked | Written, not applied: needs the maintainer's explicit approval and a first CI run (required checks must exist); it would also end direct commits to `main` |
| P5-C6 | Opengrep and Conftest pilots | Implemented and verified | Both KEEP ([GUARDRAILS.md](GUARDRAILS.md#pilots)): Opengrep 1.31.0 (sha256 and Sigstore signature checked), 7 rules, 1.4 s, 1 true positive, runs offline; Conftest 3 policies, 10 fixtures as expected |
| P5-C7 | Enforcement map and negative tests: [GUARDRAILS.md](GUARDRAILS.md); `AGENTS.md` §2 and §8 | Implemented and verified | Written by the coordinator from the writers' reports; the independent review filled the gaps (statement deletion, `.gitignore`, policy-only items) |
| P5-C8 | Independent review, gates, local commit | Implemented and verified | Review by a premium-tier agent with synthetic tests in a scratch clone (hook: 19 cases in sh, bash 3.2 and dash; settings: `claude -p` against copies); fixes listed under Security findings. Gates: the committed hook ran, `gitleaks git --staged` exit 0, `npm run build` exit 0 |

### P6: Code intelligence and memory

| Field | Value |
|---|---|
| Completion criteria | Serena v2 pinned and working in both agents; an MCP registry; `.ai/` lifecycle rules; the ai-memory decision recorded (current verdict: DEFER) ([roadmap](IMPLEMENTATION-ROADMAP.md#p6-code-intelligence-and-memory)) |
| Chunks | See the chunk table below |
| Verification evidence | Recorded per chunk below |
| Blockers | None. Pinning Serena in the maintainer's default Codex config is the maintainer's choice (one-line change in [MCP-REGISTRY.md](MCP-REGISTRY.md)'s source report; the `cardos` profile is pinned) |
| Security findings | MCP servers run outside both agents' sandboxes, so Serena is read-only here. Synthetic test (2026-10-18): Serena's `search_for_pattern` returned the contents of git-ignored folders when given their path, so all raw-file tools are excluded, denied and left out of the Codex allowlist. Serena 2.0.0 sends a usage report at startup and its dashboard checks for news and updates; both are turned off. The committed `language_servers: []` meant symbol tools never worked; now `typescript`. Independent review (2026-10-18, synthetic project, MCP stdio calls): `read_memory` followed a symlink in `.serena/memories/` to a file outside the project, so `read_memory` and `list_memories` are now excluded and denied too; a new 2.0.0 global config defaults to the REPL interface, which ignores `read_only` and `excluded_tools` and ran arbitrary Python, so `.serena/project.yml` pins `agent_interface: tools`; in the `codex` context `activate_project` switched to another registered project and re-enabled `search_for_pattern`, so the Codex allowlist is what blocks it. headroom keeps a local copy of anything compressed, so real data must never pass through it. A writer agent printed Serena's local dashboard secret (not a CardOS or Burnrate credential) into its own transcript while reading `~/.serena/serena_config.yml` |
| Documentation status | Implemented and verified |
| Git commit | Local commit on `ai-os/phase-6`, not pushed: `git log -1 ai-os/phase-6`. Base: `005496bb` on `ai-os/phase-5` |

**Chunks:**

| Chunk | Deliverable | Status | Evidence |
|---|---|---|---|
| P6-C0 | Branch `ai-os/phase-6`, stacked on `ai-os/phase-5` | Implemented and verified | `git log` shows it at `005496bb` (2026-10-18) |
| P6-C1 | Serena 2.0.0 pinned and read-only for Claude Code (`.mcp.json`, `.serena/project.yml`, `enabledMcpjsonServers` and 24 deny rules in `.claude/settings.json`) | Implemented and verified | `claude -p` (haiku) with only Serena tools found `apiMutate` in `src/lib/live.ts` and its callers via `find_symbol` and `find_referencing_symbols`; asked to edit or write a memory it had no such tool and changed nothing; the deny rules also hid the writing tools of a writable scratch project; Conftest passes (2026-10-18) |
| P6-C2 | Serena 2.0.0 pinned for Codex in the `cardos` profile (7-tool allowlist after the independent review; example in the repo) | Implemented and verified | `codex exec -p cardos -s read-only` JSON events show `mcp_tool_call` on `serena` (`find_symbol`, `find_referencing_symbols`) with the correct answer; `write_memory` and `replace_symbol_body` returned "Tool is not active" (2026-10-18). The allowlist's hiding of `activate_project` from the model is unverified; `read_only` is enforced at call time |
| P6-C3 | MCP registry: [MCP-REGISTRY.md](MCP-REGISTRY.md) | Implemented and verified | Written by the coordinator from `claude mcp list`, `codex -p cardos mcp list` and the Serena tests; checked by the independent review (2026-10-18) |
| P6-C4 | `.ai/` lifecycle rules: [.ai/LIFECYCLE.md](../../.ai/LIFECYCLE.md) | Implemented and verified | Written by a writer agent; checked by the independent review (2026-10-18) |
| P6-C5 | ai-memory decision: [ADR 0002](../../.ai/decisions/0002-agent-memory.md), DEFER (Proposed) | Implemented and verified | Facts checked against the ai-memory repo, README, install and data-handling docs and the GitHub API (v3.1.1, MIT, 2026-10-17): default hooks capture prompts and tool calls in every repo, install user-wide, redaction is best-effort; unverified items listed in the ADR |
| P6-C6 | Independent review, gates, local commit | Implemented and verified | Premium-tier review with a raw MCP client against `serena-agent==2.0.0` on synthetic projects, with a scratch `SERENA_HOME` so the real Serena config was never read: fixed the REPL interface bypassing `read_only` (now `agent_interface: tools`) and the memory tools following symlinks out of the project (now excluded and denied); coordinator follow-ups: a read-only `initial_prompt`, the installed Codex profile synced to the 7-tool allowlist. Gates: hook, `gitleaks git --staged` exit 0, `npm run build` exit 0 |

### P7: Model routing

| Field | Value |
|---|---|
| Completion criteria | `model-policy.yaml` maps task tiers to real Claude and Codex models and effort levels, and a dry-run checker validates it without running an agent ([roadmap](IMPLEMENTATION-ROADMAP.md#p7-model-routing)) |
| Chunks | Capability inventory; tier policy and Conftest rules; local CLI drift checker; synthetic failure fixtures; independent review and gates |
| Verification evidence | 2026-10-19: Claude Code 2.1.303 `--help`/bundle and Codex CLI 0.163.0 bundled catalog checked without an agent prompt. `npm run ai:models` exit 0; real policy Conftest 24/24; `bash policy/test.sh` passes all 25 fixtures, including premium model and effort downgrades; scratch checks return exit 1 on version drift and exit 2 when CLIs are missing; `npm run build` 35 files, 0 diagnostics; `gitleaks dir --redact -v --no-banner .` exit 0. Phase 2 routing precedent is in [P2](#p2-foundation). |
| Blockers | None for the local implementation. Publishing or merging remains a maintainer decision. |
| Security findings | Routing uses each CLI's native model switching; OmniRoute remains REJECT because it routes prompts to third-party providers. The Conftest CI check validates the recorded catalog, while `npm run ai:models` validates local installed CLIs; account access to a listed model is not proven without an agent run. |
| Documentation status | Roadmap, phase status, README and `.ai/CURRENT.md` updated |
| Git commit | Local `ai-os/phase-7` branch; see `git log -1` |

### P8: Docs automation

| Field | Value |
|---|---|
| Completion criteria | A written list of automated docs and Not applicable doc types; link checking runs; a CI doc-impact check reports when a change may need a doc update ([roadmap](IMPLEMENTATION-ROADMAP.md#p8-docs-automation)) |
| Chunks | [Applicable and Not applicable document list](DOCS-AUTOMATION.md); generated [route inventory](ROUTES.md); local link and doc-impact checker with synthetic tests. CI wiring is deferred. |
| Verification evidence | 2026-10-19: `npm run docs:links` checked 291 local links in 21 Markdown files with 0 issues; `npm run docs:routes:check` found the generated inventory current; `npm run docs:test` passed 4 synthetic cases, including a tracked target removed from the working tree. `npm run docs:impact -- --base ai-os/phase-7` reported four relevant review prompts from 12 changed path records. `npm run build` checked 38 files with 0 diagnostics and built 12 pages. CI execution is unverified because the workflow has not been changed. |
| Blockers | The CI doc-impact criterion remains open. The maintainer requested local-only checks for now; workflow changes require explicit approval under `AGENTS.md` §7. |
| Security findings | The checks use local Git paths and tracked Markdown or Astro page filenames, do not call Burnrate, and do not fetch external links. The impact report prints prompts and counts, not diff contents. |
| Documentation status | Applicability matrix in [DOCS-AUTOMATION.md](DOCS-AUTOMATION.md); generated route table and local commands documented |
| Git commit | Local `ai/codex/docs-automation` branch; see `git log -1` after commit |

### P9: Evaluation and quality

| Field | Value |
|---|---|
| Completion criteria | Vitest covers `src/lib` and runs in CI; CI gates block a failing change; a Promptfoo pilot runs 3 to 5 agent tasks on redacted fixtures and its result is recorded ([roadmap](IMPLEMENTATION-ROADMAP.md#p9-evaluation-and-quality)) |
| Chunks | Vitest 5.0.4 pinned with `npm test` for all three `src/lib` modules; four-task synthetic Promptfoo/Codex SDK pilot; local [runbook and result](EVALUATION-QUALITY.md). CI wiring remains open. |
| Verification evidence | 2026-10-19, 19:58 IST: `npm test` passed 11/11 tests in 3 files; `npm run build` checked 41 files with 0 diagnostics and built 12 pages; `osv-scanner scan source --lockfile package-lock.json` found no issues in 393 packages. Promptfoo 0.124.1 / Codex SDK 0.156.1 completed 4/4 exact assertions on synthetic fixtures at 19:57 IST, with no provider errors. An earlier file-reading variant failed and was replaced with inline fixture content; see the [record](EVALUATION-QUALITY.md#pilot-result). |
| Blockers | CI execution and failure gate are unverified. The maintainer requested local-only checks for now; workflow changes require explicit approval under `AGENTS.md` §7. That file's stale statement that no test command exists also needs explicit agent-rule approval to correct. |
| Security findings | Tests use mocked fetch; pilot supplied only synthetic snippets to an isolated temporary Git directory with a read-only agent sandbox, agent network and web search disabled, and Promptfoo telemetry disabled. No Burnrate or secret files were supplied. Raw eval report is local in `/private/tmp`, not committed. |
| Documentation status | Local test and pilot procedure in [EVALUATION-QUALITY.md](EVALUATION-QUALITY.md) |
| Git commit | Local `ai/codex/evaluation-quality` branch; see `git log -1` after commit |

### P10: Dashboard

| Field | Value |
|---|---|
| Completion criteria | Phase status, check results and eval results can be viewed from this file, GitHub Actions and Promptfoo reports without a new service; the telemetry stack stays Deferred until a real telemetry source exists ([roadmap](IMPLEMENTATION-ROADMAP.md#p10-dashboard)) |
| Chunks | Local [dashboard](DASHBOARD.md) links the phase board, dated local check evidence, existing GitHub Actions workflow/page, and the synthetic Promptfoo pilot result. Native telemetry capability checked; no service added. |
| Verification evidence | 2026-10-19: existing CI workflow inspected: build, gitleaks, osv-scanner, policy; `npm test` and doc-impact checks are not wired. Phase 9's 11/11 tests and 4/4 synthetic Promptfoo result have dated evidence. Installed Claude Code 2.1.245 and Codex CLI 0.163.0 were checked against their official OpenTelemetry docs; no live export was run. At 20:59 IST, `npm run docs:links` checked 323 local links with 0 issues; `npm run docs:routes:check` found the route inventory current; `npm run docs:test` passed 4/4 synthetic cases; `npm run build` checked 41 files with 0 diagnostics and built 12 pages. |
| Blockers | This branch is local and has no recorded GitHub Actions run. Remote check results cannot be verified until publication; CI edits remain deferred under the maintainer's local-only instruction and `AGENTS.md` §7. |
| Security findings | The dashboard links to aggregate synthetic results only. It does not commit raw Promptfoo output, enable telemetry, contact Burnrate, or run a collector. Native telemetry can include identity attributes or tool output, so the stack stays Deferred. |
| Documentation status | [DASHBOARD.md](DASHBOARD.md) is the status entry point and records source links, freshness and limits. |
| Git commit | Local `ai/codex/dashboard` branch; see `git log -1` after commit |

### P11: Production

| Field | Value |
|---|---|
| Completion criteria | Runtime dependencies pinned instead of `latest`; a runbook for backing up and restoring the Burnrate database. Not applicable: deployment, infrastructure, rollouts, signing, load and chaos testing, service catalog (nothing is deployed) ([roadmap](IMPLEMENTATION-ROADMAP.md#p11-production)) |
| Chunks | Exact versions for all 12 direct dependencies, matching the lockfile's resolved versions; Node.js requirement corrected; [PRODUCTION.md](PRODUCTION.md) documents a stopped-service snapshot, validation, guarded restore, and the Not applicable practices. |
| Verification evidence | 2026-10-20, 03:02 IST: direct versions checked against the lockfile root and resolved packages; `npm ls --depth=0 --json` found all 12 installed with no problems; `npm test` passed 11/11 tests; `npm run build` checked 41 Astro files with 0 diagnostics and built 12 pages; `npm run docs:links` checked 332 local links in 27 Markdown files with 0 issues; `npm run docs:routes:check` passed; `osv-scanner scan source --lockfile package-lock.json` scanned 393 packages and found no issues. The four runbook shell blocks pass `bash -n`. The runbook was reviewed against installed Burnrate 0.5.2 source and SQLite/Homebrew documentation; an independent reviewer found fail-safe/configuration issues, corrected before commit. Final gates are recorded in the task file. |
| Blockers | None for the documented Phase 11 deliverables. The live backup and restore procedure has not been executed or rehearsed; only the maintainer can validate it with private financial data. |
| Security findings | No live Burnrate data, env file, key, statement, or API response was accessed. The runbook requires an encrypted private destination, exact SQLite `ok` validation, a complete-data marker, service stop before file copies, rollback on restore copy failure, and configuration/key restoration before service start. No new dependency version was introduced. |
| Documentation status | [PRODUCTION.md](PRODUCTION.md), README, `.ai/` map and current context updated; CI and agent-rule files unchanged. |
| Git commit | Local `ai/codex/production` branch; see `git log -1` after commit |

### P12: Integration verification and bootstrap

| Field | Value |
|---|---|
| Completion criteria | On a clean checkout, one verification pass confirms each earlier phase's criterion, and a reusable bootstrap sets up the same foundation in another repo ([roadmap](IMPLEMENTATION-ROADMAP.md#p12-integration-verification-and-bootstrap)) |
| Chunks | A clean Phase 12 worktree and approved `npm ci`; local Phase 2–11 verification matrix; generic preview-first [bootstrap](INTEGRATION-BOOTSTRAP.md#reusable-foundation-bootstrap) with inert templates and synthetic tests. |
| Verification evidence | 2026-10-20, final build at 11:59 IST: `npm ci` installed 307 packages and npm reported 0 vulnerabilities; 12 direct packages resolved; `npx tsc --noEmit` passed; `npm test` passed 11/11; `npm run build` checked 43 Astro files with 0 diagnostics and built 12 pages; `npm run docs:test` passed 4/4; route inventory matched; `npm run docs:links` checked 345 local links with 0 issues; `npm run ai:models` matched installed Claude 2.1.303 and Codex 0.163.0; 25 policy fixtures and 24/24 model-policy checks passed; 9/9 synthetic bootstrap tests passed after independent review fixes. Full-history and working-tree gitleaks scans found no leaks. Final staged gates are in the [task file](../../.ai/tasks/integration-bootstrap.md). OSV could enumerate 393 packages but could not reach `api.osv.dev`; its zero-vulnerability summary is **not** accepted as a pass. |
| Blockers | Full criterion is open: P5, P8, P9 and P10 remain partial under local-only CI/remote scope; the current `main` ST Finance changes have not been reconciled with this stacked AI-OS branch. P11 live recovery has not been rehearsed. `AGENTS.md` and CI changes need separate maintainer approval. |
| Security findings | No Burnrate data, env, key, statement, service or live API was accessed. Bootstrap previews by default, refuses dirty/colliding/symlinked/Git-ignored targets, disables a configured Git filesystem monitor, rolls back a failed write, never overwrites or installs, and applied only to synthetic temporary Git repositories. No real personal or financial data was placed in templates or tests. |
| Documentation status | [INTEGRATION-BOOTSTRAP.md](INTEGRATION-BOOTSTRAP.md) records the matrix, run instructions and limits; README and `.ai/` map updated. |
| Git commit | Local `ai/codex/integration-bootstrap` branch; see `git log -1` after commit |

## How to update this file

1. Run the check, and copy what was run, the date and the result into the phase's evidence.
2. Change the status on the board (and in the Phase 2 chunk table for a chunk).
3. Update the phase's security findings, documentation status and git commit, and "Last updated" at the top.
