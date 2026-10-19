# AI Engineering OS for CardOS

- **Purpose:** Entry point to the AI Engineering OS: what it is, where each piece lives and how changes are approved.
- **Audience:** The maintainer and the coding agents (Claude Code, Codex).
- **Owner:** The maintainer.
- **Related docs:** [Implementation roadmap](IMPLEMENTATION-ROADMAP.md) · [Phase status](PHASE-STATUS.md)
- **How to validate:** Every link in the map resolves, and every work status used in these docs is one of the eight under [Status vocabulary](#status-vocabulary).

## What it is

The AI Engineering OS is the infrastructure that lets Claude Code and Codex work on this repo safely side by side: shared instructions, versioned context, one worktree per task, guardrails, and status tracked by evidence. **It is not part of the app.** The CardOS UI, its `/api` proxy and its use of Burnrate are unchanged.

**Profile:** CORE, scaled to the repo. CardOS is a small local-first Astro frontend with no backend and no deployment, so the PRODUCTION and SCALE profiles are mostly not applicable. Rationale: [roadmap, section 1](IMPLEMENTATION-ROADMAP.md#1-profile-and-rationale).

## Start here

- Agents: [`AGENTS.md`](../../AGENTS.md) (loaded automatically), then [`.ai/CURRENT.md`](../../.ai/CURRENT.md) and [`.ai/INDEX.md`](../../.ai/INDEX.md).
- The maintainer: [`PHASE-STATUS.md`](PHASE-STATUS.md) for status, then the [roadmap](IMPLEMENTATION-ROADMAP.md) for the plan.

## Map

| Path | What it is |
|---|---|
| [`AGENTS.md`](../../AGENTS.md) | Shared rules for every agent: commands, data protection, multi-agent rules, risk classes, commit checklist. Codex reads it natively. |
| [`CLAUDE.md`](../../CLAUDE.md) | Claude Code entrypoint; imports `AGENTS.md`. |
| [`.ai/CONTEXT.md`](../../.ai/CONTEXT.md) | Verified architecture: topology, module map, data flow, endpoints, scripts. |
| [`.ai/INDEX.md`](../../.ai/INDEX.md) | Knowledge map: which document to load for which task. |
| [`.ai/CURRENT.md`](../../.ai/CURRENT.md) | Session summary: state, ownership, next steps. |
| [`.ai/decisions/0001-local-burnrate-patch.md`](../../.ai/decisions/0001-local-burnrate-patch.md) | Decision record: why Burnrate is patched locally. |
| [`.ai/LIFECYCLE.md`](../../.ai/LIFECYCLE.md) | Lifecycle rules for `.ai/` files and local agent memory: who creates, updates, reviews and retires each, size limits, what never goes in. |
| [`.ai/decisions/0002-agent-memory.md`](../../.ai/decisions/0002-agent-memory.md) | Decision record (Proposed): ai-memory deferred; versioned `.ai/` handoffs are the shared memory. |
| [`IMPLEMENTATION-ROADMAP.md`](IMPLEMENTATION-ROADMAP.md) | Profile, tool decisions, target architecture, 12-phase plan. |
| [`PHASE-STATUS.md`](PHASE-STATUS.md) | Status, evidence and next action for every phase. |
| [`.specify/memory/constitution.md`](../../.specify/memory/constitution.md) | Spec Kit constitution: the project's durable principles (proposed, pending the maintainer's ratification). |
| [`specs/001-gmail-sync/spec.md`](../../specs/001-gmail-sync/spec.md) | Retroactive spec of Gmail statement sync, with requirement IDs and traceability (draft). |
| [`.ai/runbooks/handoff.md`](../../.ai/runbooks/handoff.md) | How to start, hand off, resume and finish an agent task. |
| [`scripts/ai-worktree.mjs`](../../scripts/ai-worktree.mjs) | `npm run ai:worktree`: one worktree and branch per agent task, ownership in branch names and `.ai/tasks/<task>.md`, safe handoff. |
| [`MCP-REGISTRY.md`](MCP-REGISTRY.md) | The MCP servers allowed for CardOS work, per agent: pins, limits, and how to add one. |
| [`GUARDRAILS.md`](GUARDRAILS.md) | How each risk class is enforced: Claude Code and Codex deny rules and sandboxes, the pre-commit hook, CI, Dependabot, the (unapplied) ruleset, Opengrep and Conftest. |
| [`model-policy.yaml`](../../model-policy.yaml) | Phase 7 task tiers, Claude/Codex model and effort choices, escalation rules and verification sources. |

Phase 7's dry-run checks are `npm run ai:models` for the installed CLIs and `conftest test --policy policy --data policy/data --namespace model_policy model-policy.yaml` for the policy. Neither runs an agent.

## Approval model

- **LOW** risk: agents may proceed.
- **HIGH** and **CRITICAL**: the maintainer's explicit approval is needed first.
- Agents never self-approve.

MEDIUM work needs a plan first and the maintainer's approval before merge. The class table is in [`AGENTS.md` §7](../../AGENTS.md#7-risk-classes-and-approvals), and the local Burnrate patch is HIGH ([decision record](../../.ai/decisions/0001-local-burnrate-patch.md)). Phase 5 added deny rules, sandboxes, a pre-commit hook and CI as defense in depth ([GUARDRAILS.md](GUARDRAILS.md)).

The repo is public: never put real financial or personal data in docs, fixtures, evals or memory.

## Status vocabulary

Use exactly these words: **Implemented and verified** · **Implemented but unverified** · **Partially implemented** · **In progress** · **Blocked** · **Deferred** · **Not applicable** · **Not started**.

A status changes only with recorded evidence. Definitions: [PHASE-STATUS.md](PHASE-STATUS.md#status-vocabulary).

Specs and the constitution carry a document status instead: a spec is Draft, Accepted, Implemented or Verified, and the constitution is Proposed until the maintainer ratifies it ([constitution, Governance](../../.specify/memory/constitution.md#governance)).
