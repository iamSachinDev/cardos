# AI engineering status view (Phase 10)

- **Purpose:** One local entry point for phase status, checks, and the synthetic agent evaluation.
- **Audience:** The maintainer and CardOS coding agents.
- **Related docs:** [Phase status](PHASE-STATUS.md) · [Promptfoo pilot](EVALUATION-QUALITY.md#pilot-result) · [CI workflow](../../.github/workflows/ci.yml)
- **How to validate:** Check local links with `npm run docs:links`; compare every result below with its dated source. Open the Actions run and check that its commit SHA matches the one stated here.

Snapshot: **21 Oct 2026**, `main` on GitHub at `4da79314`; phase updates on branch `ai/claude/finish-phases`.

| View | Where to look | What is evidenced now |
|---|---|---|
| Phase progress | [Status board](PHASE-STATUS.md#status-board) and [phase details](PHASE-STATUS.md#phase-details) | P5 and P9 are partially implemented (the `protect-main` ruleset is imported but disabled); P8 is implemented but unverified (CI result pending); P10 is implemented and verified by the run below. Evidence is in each phase section. |
| Local checks | [P8 evidence](PHASE-STATUS.md#p8-docs-automation), [P9 evidence](PHASE-STATUS.md#p9-evaluation-and-quality), and [P10 evidence](PHASE-STATUS.md#p10-dashboard) | On 21 Oct 2026, on the tree with the CI wiring commit `8b003986`: `npm test` 14/14, `npm run docs:test`, `docs:links` and `docs:routes:check` exit 0. Earlier dated results (19 Oct): 11/11 Vitest tests, 12-page build, clean lockfile vulnerability scan, doc-impact report. Each phase entry states when it was run. |
| GitHub Actions | [CI run 39613874631](https://github.com/iamSachinDev/cardos/actions/runs/39613874631) · [all runs of the workflow](https://github.com/iamSachinDev/cardos/actions/workflows/ci.yml) · [workflow definition](../../.github/workflows/ci.yml) | Run 39613874631, commit `4da79314`, push to `main`, 21 Oct 2026: jobs `build`, `gitleaks`, `osv-scanner` and `policy` all `success`. Dependabot also started its first npm and GitHub Actions update runs. This run predates `8b003986`, which adds `npm test`, `docs:test`, `docs:links`, `docs:routes:check` and a pull-request-only advisory `docs:impact` step to `build`; their GitHub result is **pending** on the pull request. |
| Promptfoo evaluation | [Pilot result and rerun instructions](EVALUATION-QUALITY.md#pilot-result) and [synthetic config](../../evals/promptfoo/promptfooconfig.yaml) | Four of four exact assertions passed on 19 Oct 2026 at 19:57 IST. The reviewed aggregate result is versioned; raw Promptfoo output remains in a disposable local directory. |

For any other run, open it and check the **commit SHA** before treating the job result as evidence for that commit. For a fresh Promptfoo run, use the command in [EVALUATION-QUALITY.md](EVALUATION-QUALITY.md#promptfoo-pilot); its temporary `results.json` is the detailed local report. The four-case pilot measures short synthetic snippet answers; it does not measure end-to-end CardOS behavior.

## Telemetry decision

Read-only capability check on 19 Oct 2026: installed Claude Code 2.1.245 and Codex CLI 0.163.0 have documented native OpenTelemetry export. [Claude Code's monitoring docs](https://code.claude.com/docs/en/monitoring-usage) describe environment-based metrics and events; [Codex observability docs](https://learn.chatgpt.com/docs/config-file/config-advanced#observability-and-telemetry) describe separate metrics, logs, and traces exporters. This phase configured no collector and tested no export.

**Langfuse and an OpenTelemetry collector remain Deferred.** There is no approved, privacy-reviewed telemetry destination or real export to display. Claude's documented metric attributes can include user identity; Codex's documented log events can include tool-result snippets. If telemetry is revisited, first test metrics only with synthetic runs and a loopback collector, remove identity attributes before storage, and keep logs and traces off until their contents are reviewed. This page itself makes no telemetry request and starts no service.

## Open work

- Merge `8b003986` through a pull request and record that run here; until then the test and docs steps have a local result only.
- The `protect-main` ruleset (id 25552280) is imported with enforcement `disabled`: GitHub's `evaluate` mode is not available on this plan. Until the maintainer activates it, a failing check does not block a merge.
- Telemetry stays Deferred (above).
