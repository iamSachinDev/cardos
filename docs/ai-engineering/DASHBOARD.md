# AI engineering status view (Phase 10)

- **Purpose:** One local entry point for phase status, checks, and the synthetic agent evaluation.
- **Audience:** The maintainer and CardOS coding agents.
- **Related docs:** [Phase status](PHASE-STATUS.md) · [Promptfoo pilot](EVALUATION-QUALITY.md#pilot-result) · [CI workflow](../../.github/workflows/ci.yml)
- **How to validate:** Check local links with `npm run docs:links`; compare every result below with its dated source. A link to GitHub Actions does not verify a run.

Snapshot: **19 Oct 2026, 20:59 IST**, on local branch `ai/codex/dashboard`.

| View | Where to look | What is evidenced now |
|---|---|---|
| Phase progress | [Status board](PHASE-STATUS.md#status-board) and [phase details](PHASE-STATUS.md#phase-details) | P8 and P9 are partially implemented. Their local results and remaining CI work are recorded there. |
| Local checks | [P8 evidence](PHASE-STATUS.md#p8-docs-automation), [P9 evidence](PHASE-STATUS.md#p9-evaluation-and-quality), and [P10 evidence](PHASE-STATUS.md#p10-dashboard) | P9: 11/11 Vitest tests, successful build, clean lockfile vulnerability scan. P8: local link, route, and doc-impact checks. P10: 323 local links checked with zero issues and a successful 12-page build. Each phase entry states when it was run. |
| GitHub Actions | [Actions workflow page](https://github.com/iamSachinDev/cardos/actions/workflows/ci.yml) and [local workflow definition](../../.github/workflows/ci.yml) | The local workflow defines build, gitleaks, osv-scanner, and policy jobs. This Phase 10 branch is local; no Actions result for it is recorded. The P8 doc-impact and P9 Vitest gates are not wired into CI. |
| Promptfoo evaluation | [Pilot result and rerun instructions](EVALUATION-QUALITY.md#pilot-result) and [synthetic config](../../evals/promptfoo/promptfooconfig.yaml) | Four of four exact assertions passed on 19 Oct 2026 at 19:57 IST. The reviewed aggregate result is versioned; raw Promptfoo output remains in a disposable local directory. |

For a published branch, open its Actions run and check the **commit SHA** before treating the job result as evidence for that branch. For a fresh Promptfoo run, use the command in [EVALUATION-QUALITY.md](EVALUATION-QUALITY.md#promptfoo-pilot); its temporary `results.json` is the detailed local report. The four-case pilot measures short synthetic snippet answers; it does not measure end-to-end CardOS behavior.

## Telemetry decision

Read-only capability check on 19 Oct 2026: installed Claude Code 2.1.245 and Codex CLI 0.163.0 have documented native OpenTelemetry export. [Claude Code's monitoring docs](https://code.claude.com/docs/en/monitoring-usage) describe environment-based metrics and events; [Codex observability docs](https://learn.chatgpt.com/docs/config-file/config-advanced#observability-and-telemetry) describe separate metrics, logs, and traces exporters. This phase configured no collector and tested no export.

**Langfuse and an OpenTelemetry collector remain Deferred.** There is no approved, privacy-reviewed telemetry destination or real export to display. Claude's documented metric attributes can include user identity; Codex's documented log events can include tool-result snippets. If telemetry is revisited, first test metrics only with synthetic runs and a loopback collector, remove identity attributes before storage, and keep logs and traces off until their contents are reviewed. This page itself makes no telemetry request and starts no service.

## Open work

- P8's doc-impact check and P9's `npm test` are local only; the maintainer asked to keep workflow changes local for now. `AGENTS.md` §7 requires explicit approval to edit CI.
- The Actions link is a navigation target, not a live status claim for this unpushed branch. A published CI run would be needed to verify the remote check view.
