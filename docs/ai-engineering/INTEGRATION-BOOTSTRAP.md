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

Final documentation links checked 345 local links in 29 Markdown files with 0 issues. The staged secret scan found no leaks and the staged diff check was clean; see the [Phase 12 task record](../../.ai/tasks/integration-bootstrap.md). Re-run the checks after any dependency, source or policy change. No CI or GitHub ruleset check was run on this then-unpushed branch; the later GitHub results are in [Status after publication](#status-after-publication).

## Phase criterion matrix

| Phase | Local verification | Remaining limit |
|---|---|---|
| P2 Foundation | Shared agent rules, Claude import, `.ai/` map and status documents are present; earlier cross-agent load tests are recorded in [status](PHASE-STATUS.md#p2-foundation). | Fresh behavioural load tests were not repeated in this pass. `AGENTS.md` contains pre-Phase-9/11 descriptions and needs separately authorized rule-file editing. |
| P3 Spec Kit | Installed command files, the constitution (Ratified 2026-10-21) and the Gmail spec with requirement IDs (Accepted 2026-10-21) are present. | Spec 001's Gmail limits (120 days, 200 messages) predate the one-year scan now on `main`: a recorded known gap to revise. |
| P4 Orchestration | The worktree helper created this isolated task worktree; the handoff runbook and earlier synthetic worktree checks are present. | Cross-agent handoff was not repeated. |
| P5 Guardrails | Local Conftest fixtures passed; hook, CI, permission and ruleset files are present. Since publication: CI run 39613874631 passed on `4da79314`, and the Codex command rules are active in `.codex/rules/cardos.rules`. | The `protect-main` ruleset is imported with enforcement `disabled`; P5-C5 is Deferred by the maintainer's choice (2026-10-21). |
| P6 Code intelligence and memory | Read-only Serena configuration, MCP registry, lifecycle rules and ADR 0002 (Accepted 2026-10-21) are present. | The default Codex profile and the Serena pin exception remain maintainer decisions; live MCP boundary test was not repeated. |
| P7 Model routing | Current installed CLI catalog, 25 fixtures and 24 Conftest checks passed. | Model entitlement and an agent-run route were not tested. |
| P8 Docs automation | Link, route and synthetic doc-checker tests pass locally; commit `8b003986` wires them into CI (they exit 0 locally on that tree). | The GitHub result of `8b003986`, including the pull-request-only advisory doc-impact step, is pending on its pull request. |
| P9 Evaluation and quality | `npm test` passed 11/11 on 2026-10-19 and 14/14 on 2026-10-21; four synthetic Promptfoo tasks were recorded earlier; `8b003986` wires `npm test` into CI. | The GitHub result is pending; CI gates only block a failing change once the ruleset is active. A fresh Promptfoo run was not repeated. |
| P10 Dashboard | The status view and recorded aggregate results are present, and the dashboard records the published CI run 39613874631 (`4da79314`, four jobs `success`). | Telemetry remains Deferred. |
| P11 Production | Exact dependency pins installed cleanly; backup and restore runbook is present. | No live backup or restore rehearsal; OSV service was unreachable during this pass. |

As of 2026-10-21, after publication: P10 is **Implemented and verified**; P8 is **Implemented but unverified** (CI result of `8b003986` pending); P5 and P9 remain **Partially implemented** (ruleset not active; P9 also awaits the CI result). P12 stays **Partially implemented** (see the final pass below). This pass confirms the local checks and recorded artifacts; it does not turn maintainer-owned criteria into passing results.

## Branch reconciliation

The original AI Engineering OS branches were stacked from `main` at `e7598889`. The 2026-10-20 clean-checkout result above applies to `ai/codex/integration-bootstrap` only. By 2026-10-21, `main` had eight later commits through `18ccecd0`, including the ST Finance rebrand, one-year Gmail patch, personal-fee support and six-month trend.

`ai/codex/main-reconciliation` is the separate local task branch for combining that committed app with the Phase 12 foundation. It preserves the ST Finance user-facing app and package name, retains exact dependency pins and AI scripts, and updates current-facing notes. The original Phase 12 results are historical evidence, not a pass for the combined app. With the maintainer's explicit approval, this branch also corrects agent rules, Claude prompts and local Opengrep rules for the new app. Accepted ADR 0001 still describes the older patch baseline and awaits separate review. The maintainer later asked for all phases to be completed, so CI wiring for Phases 8 and 9 is commit `8b003986` (see below).

The combined branch's approved `npm ci` installed 307 packages; npm reported 0 vulnerabilities. On 2026-10-21 at 19:14 IST, `npm test` passed 14/14 synthetic tests in four files, and `npm run build` checked 47 Astro files with no diagnostics and built 12 pages. The local docs checker found 350 links with no issues. The 11-rule Opengrep YAML parses, and targeted synthetic regex cases for published fee links and theme storage pass. Opengrep: 2026-10-21: the pinned Opengrep 1.31.0 scan (`--severity ERROR src scripts`) first exited 1 on two lines of `src/lib/gmail.test.ts`, which asserts the Google origin check; the `cardos-google-origin-only-in-gmail` rule now also excludes that test file, and the scan exits 0. No Burnrate service, private data, env file, key, statement or live API was accessed during reconciliation.

## Status after publication

On 2026-10-21 `main` on GitHub was fast-forwarded to `4da79314`: phases 2 to 12, the reconciliation `fad1e532` and the Phase 5 finish. Draft PR #1 (same content) remains open. The first GitHub Actions run, [CI run 39613874631](https://github.com/iamSachinDev/cardos/actions/runs/39613874631) on `4da79314` (push to `main`), finished with jobs `build`, `gitleaks`, `osv-scanner` and `policy` all `success`, and Dependabot started its first npm and GitHub Actions update runs.

Commit `8b003986` (branch `ai/claude/finish-phases`, not yet on `main`) adds `npm test`, `npm run docs:test`, `npm run docs:links`, `npm run docs:routes:check` and an advisory pull-request `docs:impact` step to job `build`. All four commands exit 0 locally. It goes to `main` through a pull request, and that run is the first GitHub evidence for it; it is pending when this was written.

The `protect-main` ruleset (id 25552280) is imported with enforcement `disabled`: GitHub's `evaluate` mode returned 422 "not supported on this plan". On 2026-10-21 the maintainer decided to keep it disabled (P5-C5 Deferred). The other governance items were decided the same day (see [Maintainer decisions](#maintainer-decisions-2026-10-21)). Left: the Deferred ruleset, the P11 private backup and restore rehearsal, and Dependabot pull requests #2 to #4.

## Maintainer decisions (2026-10-21)

Recorded here as the maintainer's decisions of 2026-10-21; an agent only wrote them down.

1. The constitution v1.0.0 is Ratified as written (RATIFICATION_DATE 2026-10-21). `AGENTS.md` §9 level 2 now says so; nothing else in `AGENTS.md` changed.
2. Spec 001 is Accepted as written, keeping its `e7598889` baseline. Its Gmail limits (120 days, 200 messages) predate the one-year scan now on `main`; this is recorded in the spec as a known gap to revise.
3. ADR 0001 and ADR 0002 are Accepted by the maintainer. ADR 0001's earlier "Accepted" text was written by an agent in Phase 2; the maintainer confirmed it on 2026-10-21.
4. The root README no longer has the Gmail and Burnrate sections, the Burnrate text under Security & Privacy or the "Burnrate patch" section; later factual fixes (Node.js version, `npm ci`, the corrected privacy line) stay. The patches are under [`patches/`](../../patches/) and ADR 0001 explains them. `AGENTS.md` §3 still says "the README's patch overview"; fixing that sentence is a separate HIGH-class edit for the maintainer.
5. The `protect-main` ruleset stays disabled by the maintainer's choice: P5-C5 is **Deferred** (the maintainer chose to keep direct pushes possible; revisit when they want PR-only changes to `main`).

## Final pass (2026-10-22)

Ran on 2026-10-22 on a fresh clone of the main checkout's `origin/main` at `2429eeb6` (pull request #5 merged; the main checkout's local `main` was still at `4da79314`) plus the change set of this record, on branch `ai/claude/phase12-close`. The clone has no `.env.example`: the Bash sandbox refuses to create files with that name, so the clone was made without that one tracked example file; nothing here reads it. `npm ci` was approved for this isolated clone. No Burnrate service, database, env file, key, statement or live API was accessed.

| Command | Exit | Result |
|---|---|---|
| `npm ci --prefer-offline --no-audit --no-fund` | 0 | 307 packages installed |
| `npm run build` | **1** | `astro check` passed (47 files, 0 errors, 0 warnings, 0 hints); the static build then failed with EPERM while moving the hashed stylesheet `AppShell.DB-s7gJn.css`. Cause: the sandbox's case-insensitive `*.db-*` data-file rule matches that generated name, so the move (and later `rm`) is refused. Not a source defect. An untracked temporary config that only changed asset file naming built all 12 pages with exit 0, and `npm run check` exits 0. The unmodified `npm run build` must be run once outside the sandbox. |
| `npm test` | 0 | 14/14 tests in 4 files |
| `npm run docs:test` | 0 | 4/4 |
| `npm run docs:links` | 0 | 363 local links checked, 0 issues |
| `npm run docs:routes:check` | 0 | Route inventory matches the page files |
| `bash policy/test.sh` | 0 | 25 fixtures as expected |
| `conftest test --policy policy --namespace claude_settings .claude/settings.json` | 0 | 2/2 |
| `conftest test --policy policy --namespace github_workflows .github/workflows/ci.yml` | 0 | 4/4 (the one workflow file) |
| `conftest test --policy policy --namespace dependabot .github/dependabot.yml` | 0 | 3/3 |
| `conftest test --policy policy --data policy/data --namespace model_policy model-policy.yaml` | 0 | 24/24 |
| `node --test scripts/ai-bootstrap.test.mjs` | 0 | 9/9 |
| `gitleaks git --redact --no-banner .` | 0 | 34 commits, no leaks |
| `gitleaks dir --redact --no-banner .` | 0 | No leaks. The first run exited 1: a generated key in this task's gitignored `dist/` output from the failed build (the finding is not in tracked source). It was deleted and the scan repeated. |
| `npm run ai:models` | **1** | Drift only. Two Claude Code installs exist: the one first on `PATH` is 2.1.245 and the other is 2.1.307; the catalog verifies 2.1.303 (2026-10-19). Run with either install the result is the same exit 1. Codex 0.163.0 matches, 8 of 8 models; effort levels and model aliases are unchanged. Re-verify and update `policy/data/cli-capabilities.json` when the maintainer chooses which install to keep. |
| Opengrep 1.31.0 (pinned binary) `scan --config .opengrep/rules.yml --disable-version-check --error --severity ERROR src scripts` | 0 | 10 ERROR rules on 49 files, 0 findings. The first run exited 1 because Opengrep could not write its default log under the home directory in the sandbox; the log was redirected to a temporary path with `SEMGREP_LOG_FILE`. |

Not run: `osv-scanner` (needs the network), and anything against GitHub (a TLS certificate error stopped `gh`), so the GitHub result of pull request #5's CI run is not recorded here.

Result: all checks pass except two exits explained above, both environmental or drift, not defects. P12 stays **Partially implemented**: P5-C5 is Deferred (so P9's "CI gates block a failing change" cannot pass), the GitHub result of the merged CI wiring is unrecorded, and the unmodified `npm run build` still needs one run outside the sandbox.

## Reusable foundation bootstrap

`scripts/ai-bootstrap.mjs` previews six generic starter files for another **clean Git repository**. It writes only with an explicit `--apply` and refuses a dirty, nested, symlinked, Git-ignored or colliding target. It rolls back newly created files if a write fails, and disables the target's Git filesystem monitor during its checks. Keep the target under one owner's control during `--apply`; simultaneous filesystem changes are outside the preflight guarantee. It never installs dependencies, starts services, runs agents, changes hooks or CI, pushes, or overwrites files. Templates in `templates/ai-bootstrap/` have `.tmpl` extensions so they are inert in CardOS.

```sh
node scripts/ai-bootstrap.mjs --target /absolute/path/to/clean-repo
node scripts/ai-bootstrap.mjs --target /absolute/path/to/clean-repo --apply
```

The generated files are `AGENTS.md`, `CLAUDE.md`, `.ai/INDEX.md`, `.ai/CONTEXT.md`, `.ai/CURRENT.md`, and `.ai/runbooks/handoff.md`. They contain explicit TODOs for the target's architecture, commands and private-data boundaries. The maintainer reviews and fills them before operational use. Phase 12 ran `--apply` only in throwaway synthetic Git repositories, not in another real project.

To extend this foundation, review each part against the target repository first: Spec Kit, Serena/MCP access, model catalog, tests, secret scanning, CI, branch protection and backup procedures. CardOS's `.claude/settings.json`, CI workflow, policies, model catalog and Burnrate recovery steps contain project-specific paths or assumptions and must not be copied verbatim.
