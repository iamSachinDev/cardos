# Task: p4-handoff-demo

- **Owner:** codex
- **Branch:** ai/codex/p4-handoff-demo
- **Base:** ai-os/phase-4
- **Worktree:** ../cardos-wt/codex-p4-handoff-demo
- **Created:** 2026-10-18
- **State:** Implemented and verified
- **Next step:** Codex: from your worktree, run `npm run ai:worktree -- list`. Add a `## Codex check` section listing this task's rows with only the AGENT, BRANCH, STATE and HANDOFF FROM columns (no paths), and one line saying whether they match the history below. Set State to Implemented and verified, run the `AGENTS.md` §8 gates, and commit with the message `docs: finish p4-handoff-demo task (Codex half)`.

## Purpose

Phase 4 demo ([PHASE-STATUS](../../docs/ai-engineering/PHASE-STATUS.md#p4-orchestration), P4-C5a and P4-C5b): one task handed from Claude Code to Codex with `npm run ai:worktree`, each agent working only in its own worktree.

## Claude check

- `new` created this worktree and file from `ai-os/phase-4` without the missing-`AGENTS.md` warning; `git status` showed only `.ai/tasks/` untracked.
- Dependencies installed with `npm ci` (approved by the maintainer for this demo).
- Gates before this commit: `gitleaks git --staged` exit 0, `npm run build` exit 0.

## Codex check

| AGENT | BRANCH | STATE | HANDOFF FROM |
|---|---|---|---|
| claude | ai/claude/p4-handoff-demo | clean | - |
| codex | ai/codex/p4-handoff-demo | dirty | ai/claude/p4-handoff-demo |

These rows match the new and handoff events in the history below.

## History

- 2026-10-18 new: ai/claude/p4-handoff-demo from ai-os/phase-4
- 2026-10-18 handoff: ai/claude/p4-handoff-demo → ai/codex/p4-handoff-demo
