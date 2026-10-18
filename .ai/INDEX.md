# Knowledge map

- **Purpose:** Tell humans and agents which document to load for which task, and how fresh each one is.
- **Audience:** AI coding agents and the maintainer.
- **Owner:** The maintainer.
- **Related docs:** [AGENTS.md](../AGENTS.md) · [CONTEXT](CONTEXT.md) · [CURRENT](CURRENT.md) · [AI-engineering docs](../docs/ai-engineering/README.md)
- **How to validate:** every path below exists (`ls` each one). When you re-check a document against the code, update its date.

Tiers: **HOT** = load every session. **WARM** = load when the task needs it. **COLD** = history, archives and generated tooling, load only when asked.

| Path | What it is for | Tier | Owner | Last validated |
|---|---|---|---|---|
| [`AGENTS.md`](../AGENTS.md) | Shared rules for every agent: commands, conventions, data protection, multi-agent rules, risk classes, commit checklist | HOT | maintainer | — |
| [`CLAUDE.md`](../CLAUDE.md) | Claude Code entrypoint; imports `AGENTS.md` | HOT | maintainer | — |
| [`.ai/CURRENT.md`](CURRENT.md) | Session summary: state, ownership, next steps | HOT | maintainer | — |
| [`.ai/INDEX.md`](INDEX.md) | This map: what to load for which task | HOT | maintainer | 2026-10-18 |
| [`.ai/CONTEXT.md`](CONTEXT.md) | Verified architecture: topology, module map, data flow, endpoints, scripts | WARM | maintainer | 2026-10-18 |
| [`.ai/decisions/0001-local-burnrate-patch.md`](decisions/0001-local-burnrate-patch.md) | ADR: why Burnrate is patched locally and what the patches change | WARM | maintainer | 2026-10-18 |
| [`.ai/runbooks/handoff.md`](runbooks/handoff.md) | How to start, hand off, resume and finish an agent task | WARM | maintainer | 2026-10-18 |
| `.ai/tasks/<task>.md` | One agent task's owner, state, next step and history; lives on the task's branch, written by `npm run ai:worktree` | WARM (your task's file only) | task owner | — |
| [`docs/ai-engineering/README.md`](../docs/ai-engineering/README.md) | Overview of the AI-engineering setup | WARM | maintainer | — |
| [`docs/ai-engineering/IMPLEMENTATION-ROADMAP.md`](../docs/ai-engineering/IMPLEMENTATION-ROADMAP.md) | Phased plan for the setup | WARM | maintainer | — |
| [`docs/ai-engineering/GUARDRAILS.md`](../docs/ai-engineering/GUARDRAILS.md) | How each risk class is enforced: deny rules, sandboxes, hook, CI, policies | WARM | maintainer | 2026-10-18 |
| [`docs/ai-engineering/PHASE-STATUS.md`](../docs/ai-engineering/PHASE-STATUS.md) | Status of each phase | WARM | maintainer | — |
| [`README.md`](../README.md) | User docs: run, data, Gmail setup, Burnrate patch | WARM | maintainer | 2026-10-18 (partial) |
| [`patches/burnrate-0.5.2.patch`](../patches/burnrate-0.5.2.patch) | Local fixes to Burnrate 0.5.2 (840 lines) | WARM | maintainer | 2026-10-18 |
| [`patches/burnrate-password-reparse-preserve.patch`](../patches/burnrate-password-reparse-preserve.patch) | Follow-up: keep a locked statement when a password retry fails. Not in the README (see ADR 0001) | WARM | maintainer | 2026-10-18 |
| [`scripts/`](../scripts/) | `start-cardos.mjs` (launcher), `configure-gmail.mjs` (Gmail setup) and `ai-worktree.mjs` (agent task worktrees, `npm run ai:worktree`) | WARM | maintainer | 2026-10-18 |
| [`.specify/memory/constitution.md`](../.specify/memory/constitution.md) | Spec Kit constitution: durable principles and governance (proposed, pending ratification) | WARM | maintainer | 2026-10-18 |
| [`specs/001-gmail-sync/spec.md`](../specs/001-gmail-sync/spec.md) | Retroactive spec of Gmail sync: requirement IDs, edge cases, traceability (draft) | WARM | maintainer | 2026-10-18 |
| `.specify/` (templates, scripts, workflows, integration config), `.claude/skills/speckit-*`, `.agents/skills/speckit-*` | Spec Kit 1.2.1 install and its commands for each agent; managed by the `specify` CLI, don't hand-edit | COLD | maintainer | 2026-10-18 |

`—` means no date is recorded here yet (a document's own header may carry one). `partial` means the README's Google-side claims were not checked. Known README gaps, left for the maintainer:

- It does not mention `burnrate-password-reparse-preserve.patch`. Its only re-apply command (`patch -p0 …`) is for `burnrate-0.5.2.patch`; the second patch uses `a/` and `b/` prefixes, so applying it would need `-p1` (unverified). See [ADR 0001](decisions/0001-local-burnrate-patch.md).
- Its "Node.js 20+" is out of date: the locked `astro` and `@astrojs/react` require Node.js >=22.22.0.

## How to retrieve

1. Load the HOT tier first: `AGENTS.md` (Claude Code also loads `CLAUDE.md`), `.ai/CURRENT.md`, then this index.
2. Add only the WARM documents the task needs: code or data-flow work → `CONTEXT.md`; Burnrate, Gmail sync or statement behaviour → ADR 0001; AI-engineering process → `docs/ai-engineering/`; starting, handing off, resuming or finishing an agent task → `runbooks/handoff.md` and your task's `tasks/<task>.md`; a new or changed feature → the constitution and the feature's spec in `specs/`.
3. Never load everything. The patch files are large: read the ADR first, then search them with `grep -n`.
4. If a document's date is older than the code you are changing, check its claims against the code before relying on them.
