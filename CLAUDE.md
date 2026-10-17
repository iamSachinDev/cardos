@AGENTS.md

# CLAUDE.md

- **Purpose:** Claude Code entrypoint. The first line imports the shared rules in AGENTS.md; this file adds only Claude-Code-specific notes.
- **Audience:** Claude Code and the subagents it launches.
- **Owner:** the maintainer.
- **Related docs:** [AGENTS.md](AGENTS.md) · [.ai/INDEX.md](.ai/INDEX.md) · [.ai/CURRENT.md](.ai/CURRENT.md)
- **How to validate:** `head -n 1 CLAUDE.md` prints `@AGENTS.md`, and `AGENTS.md` exists.

## Claude Code notes

- **Parallel work:** use `claude --worktree` or a dedicated `git worktree` for every task, and never share a working tree with another agent.
- **Subagents:** put the data-protection rules (AGENTS.md §5) and the staging rules (§6) in every subagent prompt, and tell it to stop and report if it meets real data or unexpected changes. You stay responsible for what it does.
- **Permissions:** treat permission prompts, denials and the auto-mode classifier as real boundaries. After a denial, don't retry another way, edit settings or permission files, or hand the action to a subagent; ask the maintainer.
- **Session end:** update [.ai/CURRENT.md](.ai/CURRENT.md) concisely (no secrets, no transcripts).
- Keep this file short. Shared rules belong in AGENTS.md so the two agents never drift apart.
