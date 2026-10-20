# Phase 12 local integration and bootstrap

- **Purpose:** Record one clean-checkout verification pass across the AI Engineering OS and provide a safe starter foundation for another repository.
- **Audience:** The maintainer and coding agents.
- **Related docs:** [Phase status](PHASE-STATUS.md#p12-integration-verification-and-bootstrap) · [roadmap](IMPLEMENTATION-ROADMAP.md#p12-integration-verification-and-bootstrap) · [production runbook](PRODUCTION.md)
- **How to validate:** Run the commands in [local pass](#local-pass) from an isolated clean worktree; run the bootstrap's synthetic tests; check the phase matrix and current `main` before treating this branch as integrated.

## Local pass

The pass ran on 2026-10-20 at 11:48 IST in a new `ai/codex/integration-bootstrap` worktree based on Phase 11 commit `3d4c5f9d`. The worktree began without `node_modules`; the maintainer approved `npm ci` for this worktree. No Burnrate service, database, env file, key, statement or live API was accessed. Only synthetic temporary Git repositories were changed by the bootstrap tests.

| Check | Result |
|---|---|
| `npm ci` | 307 packages installed from the pinned lockfile; npm reported 0 vulnerabilities. |
| `npm ls --depth=0 --json` | All 12 direct dependencies resolved with no missing or invalid package. |
| `npx tsc --noEmit` | Passed. |
| `npm test` | 11/11 tests passed in 3 files. |
| `npm run build` | Final pass at 11:59 IST: 12 pages built; 43 Astro files checked with 0 errors, warnings or hints. A first run showed one unused-import hint in the new bootstrap test; it was removed before the final pass. |
| `npm run docs:test` and `npm run docs:routes:check` | 4/4 synthetic documentation tests passed; route inventory matched pages. |
| `npm run ai:models` | Installed Claude Code 2.1.303 and Codex 0.163.0 matched the recorded local model catalog. |
| `bash policy/test.sh` and `conftest test --policy policy --data policy/data --namespace model_policy model-policy.yaml` | 25 synthetic policy cases passed; 24/24 model-policy checks passed. |
| `node --test scripts/ai-bootstrap.test.mjs` | 9/9 synthetic Git-repository tests passed: preview, creation, collisions, Git-ignored destinations, symlinks, injected write-failure rollback and a configured Git filesystem monitor. |
| `osv-scanner scan source --lockfile package-lock.json` | **Unavailable:** 393 packages were enumerated, but DNS lookup of `api.osv.dev` failed. Its printed zero-vulnerability summary is not a valid vulnerability result. |

Final documentation links checked 345 local links in 29 Markdown files with 0 issues. The staged secret scan found no leaks and the staged diff check was clean; see the [Phase 12 task record](../../.ai/tasks/integration-bootstrap.md). Re-run the checks after any dependency, source or policy change. No CI or GitHub ruleset check was run on this unpushed branch.

## Phase criterion matrix

| Phase | Local verification | Remaining limit |
|---|---|---|
| P2 Foundation | Shared agent rules, Claude import, `.ai/` map and status documents are present; earlier cross-agent load tests are recorded in [status](PHASE-STATUS.md#p2-foundation). | Fresh behavioural load tests were not repeated in this pass. `AGENTS.md` contains pre-Phase-9/11 descriptions and needs separately authorized rule-file editing. |
| P3 Spec Kit | Installed command files, proposed constitution and draft Gmail spec with requirement IDs are present. | Ratification and spec acceptance remain maintainer decisions. |
| P4 Orchestration | The worktree helper created this isolated task worktree; the handoff runbook and earlier synthetic worktree checks are present. | Cross-agent handoff was not repeated. |
| P5 Guardrails | Local Conftest fixtures passed; hook, CI, permission and ruleset files are present. | `main` ruleset is unapplied, global Codex command rules are not installed, and this branch has no published CI run. |
| P6 Code intelligence and memory | Read-only Serena configuration, MCP registry, lifecycle rules and proposed ADR are present. | Default Codex profile and ADR acceptance remain maintainer decisions; live MCP boundary test was not repeated. |
| P7 Model routing | Current installed CLI catalog, 25 fixtures and 24 Conftest checks passed. | Model entitlement and an agent-run route were not tested. |
| P8 Docs automation | Link, route and synthetic doc-checker tests pass locally. | CI doc-impact wiring remains deferred under the maintainer's local-only instruction. |
| P9 Evaluation and quality | `npm test` passed 11/11; four synthetic Promptfoo tasks were recorded earlier. | CI test gate and a fresh Promptfoo run remain unverified. |
| P10 Dashboard | The local status view and recorded aggregate results are present. | No remote Actions result for this branch; telemetry remains Deferred. |
| P11 Production | Exact dependency pins installed cleanly; backup and restore runbook is present. | No live backup or restore rehearsal; OSV service was unreachable during this pass. |

P5, P8, P9 and P10 remain **Partially implemented**. This pass confirms the local checks and recorded artifacts; it does not turn their remote or maintainer-owned criteria into passing results.

## Branch integration limit

The AI Engineering OS branches are stacked from an older `main` base. Current `main` has seven later commits, including the ST Finance rebrand (`d5c743c1`); this Phase 12 branch has the AI-OS commits and has **not** merged or rebased those main changes. Its clean-checkout result applies to this branch, not to the combined current-main app. Reconcile the branches and recheck project-specific agent rules, docs, package metadata and app tests before proposing a merge. `AGENTS.md` and CI edits require separate maintainer approval; the maintainer previously chose to keep CI changes local for now.

## Reusable foundation bootstrap

`scripts/ai-bootstrap.mjs` previews six generic starter files for another **clean Git repository**. It writes only with an explicit `--apply` and refuses a dirty, nested, symlinked, Git-ignored or colliding target. It rolls back newly created files if a write fails, and disables the target's Git filesystem monitor during its checks. Keep the target under one owner's control during `--apply`; simultaneous filesystem changes are outside the preflight guarantee. It never installs dependencies, starts services, runs agents, changes hooks or CI, pushes, or overwrites files. Templates in `templates/ai-bootstrap/` have `.tmpl` extensions so they are inert in CardOS.

```sh
node scripts/ai-bootstrap.mjs --target /absolute/path/to/clean-repo
node scripts/ai-bootstrap.mjs --target /absolute/path/to/clean-repo --apply
```

The generated files are `AGENTS.md`, `CLAUDE.md`, `.ai/INDEX.md`, `.ai/CONTEXT.md`, `.ai/CURRENT.md`, and `.ai/runbooks/handoff.md`. They contain explicit TODOs for the target's architecture, commands and private-data boundaries. The maintainer reviews and fills them before operational use. Phase 12 ran `--apply` only in throwaway synthetic Git repositories, not in another real project.

To extend this foundation, review each part against the target repository first: Spec Kit, Serena/MCP access, model catalog, tests, secret scanning, CI, branch protection and backup procedures. CardOS's `.claude/settings.json`, CI workflow, policies, model catalog and Burnrate recovery steps contain project-specific paths or assumptions and must not be copied verbatim.
