# Knowledge map

- **Purpose:** Tell humans and agents which document to load for which task, and how fresh each one is.
- **Audience:** AI coding agents and the maintainer.
- **Owner:** The maintainer.
- **Related docs:** [AGENTS.md](../AGENTS.md) · [CONTEXT](CONTEXT.md) · [CURRENT](CURRENT.md) · [LIFECYCLE](LIFECYCLE.md) · [AI-engineering docs](../docs/ai-engineering/README.md)
- **How to validate:** every path below exists (`ls` each one). When you re-check a document against the code, update its date.

Tiers: **HOT** = load every session. **WARM** = load when the task needs it. **COLD** = history, archives and generated tooling, load only when asked.

| Path | What it is for | Tier | Owner | Last validated |
|---|---|---|---|---|
| [`AGENTS.md`](../AGENTS.md) | Shared rules for every agent: commands, conventions, data protection, multi-agent rules, risk classes, commit checklist | HOT | maintainer | — |
| [`CLAUDE.md`](../CLAUDE.md) | Claude Code entrypoint; imports `AGENTS.md` | HOT | maintainer | — |
| [`.ai/CURRENT.md`](CURRENT.md) | Session summary: state, ownership, next steps | HOT | maintainer | — |
| [`.ai/INDEX.md`](INDEX.md) | This map: what to load for which task | HOT | maintainer | 2026-10-21 |
| [`.ai/CONTEXT.md`](CONTEXT.md) | Verified architecture: topology, module map, data flow, endpoints, scripts | WARM | maintainer | 2026-10-21 (source reconciliation) |
| [`.ai/decisions/0001-local-burnrate-patch.md`](decisions/0001-local-burnrate-patch.md) | ADR: why Burnrate is patched locally and what the patches change | WARM | maintainer | 2026-10-18 |
| [`.ai/decisions/0002-agent-memory.md`](decisions/0002-agent-memory.md) | ADR (Proposed): why ai-memory is deferred and `.ai/` handoffs are the shared memory; ai-memory facts and revisit conditions | WARM | maintainer | 2026-10-18 |
| [`.ai/LIFECYCLE.md`](LIFECYCLE.md) | Lifecycle rules for every `.ai/` file and for local agent memory: who creates, updates, reviews, retires, size limits, what never goes in | WARM | maintainer | 2026-10-18 |
| [`.ai/runbooks/handoff.md`](runbooks/handoff.md) | How to start, hand off, resume and finish an agent task | WARM | maintainer | 2026-10-18 |
| `.ai/tasks/<task>.md` | One agent task's owner, state, next step and history; lives on the task's branch, written by `npm run ai:worktree` | WARM (your task's file only) | task owner | — |
| [`docs/ai-engineering/README.md`](../docs/ai-engineering/README.md) | Overview of the AI-engineering setup | WARM | maintainer | — |
| [`docs/ai-engineering/IMPLEMENTATION-ROADMAP.md`](../docs/ai-engineering/IMPLEMENTATION-ROADMAP.md) | Phased plan for the setup | WARM | maintainer | — |
| [`docs/ai-engineering/GUARDRAILS.md`](../docs/ai-engineering/GUARDRAILS.md) | How each risk class is enforced: deny rules, sandboxes, hook, CI, policies | WARM | maintainer | 2026-10-18 |
| [`docs/ai-engineering/MCP-REGISTRY.md`](../docs/ai-engineering/MCP-REGISTRY.md) | The MCP servers allowed per agent: pins, limits, how to add one | WARM | maintainer | 2026-10-18 |
| [`docs/ai-engineering/PHASE-STATUS.md`](../docs/ai-engineering/PHASE-STATUS.md) | Status of each phase | WARM | maintainer | — |
| [`docs/ai-engineering/DASHBOARD.md`](../docs/ai-engineering/DASHBOARD.md) | Phase 10 local status view: phase evidence, Actions link, Promptfoo report, telemetry decision | WARM | maintainer | 2026-10-19 |
| [`docs/ai-engineering/PRODUCTION.md`](../docs/ai-engineering/PRODUCTION.md) | Phase 11 exact dependency pins, Burnrate backup and restore procedure, and Not applicable practices | WARM | maintainer | 2026-10-20 |
| [`docs/ai-engineering/INTEGRATION-BOOTSTRAP.md`](../docs/ai-engineering/INTEGRATION-BOOTSTRAP.md) | Phase 12 clean-checkout pass, criterion matrix and reusable generic bootstrap | WARM | maintainer | 2026-10-20 |
| [`docs/ai-engineering/DOCS-AUTOMATION.md`](../docs/ai-engineering/DOCS-AUTOMATION.md) | Phase 8 generated and checked docs; Not applicable types | WARM | maintainer | 2026-10-19 |
| [`docs/ai-engineering/EVALUATION-QUALITY.md`](../docs/ai-engineering/EVALUATION-QUALITY.md) | Phase 9 local Vitest and synthetic Promptfoo pilot procedure and result | WARM | maintainer | 2026-10-19 |
| [`docs/ai-engineering/ROUTES.md`](../docs/ai-engineering/ROUTES.md) | Generated Astro route inventory | WARM | maintainer | 2026-10-19 |
| [`README.md`](../README.md) | ST Finance user docs: features, run, optional Gmail setup, privacy and local Burnrate patch overview | WARM | maintainer | 2026-10-21 |
| [`patches/burnrate-0.5.2.patch`](../patches/burnrate-0.5.2.patch) | Local fixes to Burnrate 0.5.2 (840 lines) | WARM | maintainer | 2026-10-18 |
| [`patches/burnrate-password-reparse-preserve.patch`](../patches/burnrate-password-reparse-preserve.patch) | Follow-up: keep a locked statement when a password retry fails. Not in the README (see ADR 0001) | WARM | maintainer | 2026-10-18 |
| [`patches/burnrate-gmail-one-year.patch`](../patches/burnrate-gmail-one-year.patch) | Local Gmail scan extension to one year without a 200-message cap | WARM | maintainer | 2026-10-21 (source review) |
| [`patches/burnrate-card-personal-fees.patch`](../patches/burnrate-card-personal-fees.patch) | Local cardholder annual-fee fields, separate from published product fees | WARM | maintainer | 2026-10-21 (source review) |
| [`scripts/`](../scripts/) | App setup and agent worktrees; model-policy and documentation checks | WARM | maintainer | 2026-10-19 (documentation tooling only) |
| [`.specify/memory/constitution.md`](../.specify/memory/constitution.md) | Spec Kit constitution: durable principles and governance (proposed, pending ratification) | WARM | maintainer | 2026-10-18 |
| [`specs/001-gmail-sync/spec.md`](../specs/001-gmail-sync/spec.md) | Retroactive spec of Gmail sync: requirement IDs, edge cases, traceability (draft) | WARM | maintainer | 2026-10-18 |
| `.specify/` (templates, scripts, workflows, integration config), `.claude/skills/speckit-*`, `.agents/skills/speckit-*` | Spec Kit 1.2.1 install and its commands for each agent; managed by the `specify` CLI, don't hand-edit | COLD | maintainer | 2026-10-18 |

`—` means no date is recorded here yet (a document's own header may carry one). Current limitations:

- README lists the patch directory but does not provide patch-application instructions. Verify compatibility with the locally installed Burnrate version before using a patch; see the historical [ADR 0001](decisions/0001-local-burnrate-patch.md).
- The draft Gmail spec and accepted ADR 0001 predate the one-year and personal-fee patches. Their historical claims must not be used as current runtime guidance until reviewed.
- Agent and policy files were updated for ST Finance in the local reconciliation branch. The actual Opengrep scan now runs clean (2026-10-21); `.ai/CURRENT.md` tracks that gate.

## How to retrieve

1. Load the HOT tier first: `AGENTS.md` (Claude Code also loads `CLAUDE.md`), `.ai/CURRENT.md`, then this index.
2. Add only the WARM documents the task needs: code or data-flow work → `CONTEXT.md`; Burnrate, Gmail sync or statement behaviour → ADR 0001; AI-engineering process → `docs/ai-engineering/`; starting, handing off, resuming or finishing an agent task → `runbooks/handoff.md` and your task's `tasks/<task>.md`; a new or changed feature → the constitution and the feature's spec in `specs/`.
3. Before relying on a document, check its date against the review triggers in [LIFECYCLE](LIFECYCLE.md); local agent memory (Serena, Claude or Codex memory) is a hint, never a source of truth.
4. Never load everything. The patch files are large: read the ADR first, then search them with `grep -n`.
5. If a document's date is older than the code you are changing, check its claims against the code before relying on them.
