# Documentation automation

- **Purpose:** Record which CardOS documents are generated or checked, and which documentation types do not apply.
- **Audience:** The maintainer and coding agents.
- **Owner:** The maintainer.
- **Related docs:** [Roadmap, Phase 8](IMPLEMENTATION-ROADMAP.md#p8-docs-automation) · [Phase status](PHASE-STATUS.md#p8-docs-automation) · [`.ai/` lifecycle](../../.ai/LIFECYCLE.md)
- **How to validate:** Run `npm run docs:test`, `npm run docs:routes:check` and `npm run docs:links`. Run the advisory impact report with two Git revisions. CI runs the same commands from `8b003986`; check its run on the pull request.

## Applicable documentation

| Document or type | Automation | Human review |
|---|---|---|
| [CardOS route inventory](ROUTES.md) | `npm run docs:routes` generates the route and source-file table from `src/pages/**/*.astro`; `npm run docs:routes:check` detects stale output. | Review route meaning in [`.ai/CONTEXT.md`](../../.ai/CONTEXT.md); page filenames alone cannot describe behavior. |
| Root [README](../../README.md), [`AGENTS.md`](../../AGENTS.md), [`CLAUDE.md`](../../CLAUDE.md), `.ai/`, `docs/` and `specs/` Markdown | `npm run docs:links` checks local file, directory and heading links in these files. External URLs are not fetched. | Owners verify content, external sources, requirements and dates. |
| [`.ai/CONTEXT.md`](../../.ai/CONTEXT.md), [`.ai/INDEX.md`](../../.ai/INDEX.md), [runbooks](../../.ai/runbooks/), [`.ai/CURRENT.md`](../../.ai/CURRENT.md) | `npm run docs:impact -- --base <ref> [--head <ref>]` reports path-based review prompts from Git changes. It is advisory and prints no diff contents. | Apply the review triggers in [`.ai/LIFECYCLE.md`](../../.ai/LIFECYCLE.md). An INDEX validation date changes only after a real review. |

The impact report prompts a CONTEXT review for changes under `src/` or `scripts/`, or to `astro.config.mjs` or `package.json`; a runbook review for script changes; an INDEX review for added, removed or renamed Markdown; and a CURRENT review when the phase status file changes. It reports whether a review may be needed, not whether the document is accurate. Stage new files before running it if they should appear in the Git comparison.

## Not applicable

| Document type | Reason |
|---|---|
| Public API or SDK reference | CardOS has no public API or SDK. Its `/api` path proxies a separate local Burnrate service. |
| Database schema or migration reference | CardOS owns no database or migrations; Burnrate owns the local data store. |
| Deployment and infrastructure runbooks | This project runs locally and has no deployment target or managed infrastructure. |
| Published package release notes | CardOS is a private local app, not a published package. Git history and the phase status record the engineering changes. |

Rules, specifications, decisions, security guidance, status evidence and architecture explanations remain authored and reviewed by people. The checker never generates them, changes their status or reads Burnrate data. The checks run locally with no external requests. Commit `8b003986` (on `ai/claude/finish-phases`, headed for `main` through a pull request) also runs `docs:test`, `docs:links` and `docs:routes:check` in CI job `build`, plus `docs:impact` as an advisory step on pull requests only; all three checks exit 0 locally on that tree, and the GitHub result is pending.
