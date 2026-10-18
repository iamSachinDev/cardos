# Runbook: start, hand off, resume and finish an agent task

- **Purpose:** The procedure for working on one task in its own worktree with `npm run ai:worktree`: start it, hand it to the other agent, resume it after an interruption, and finish it.
- **Audience:** AI coding agents (Claude Code, Codex) and the maintainer.
- **Owner:** The maintainer.
- **Related docs:** [AGENTS.md §6](../../AGENTS.md#6-multi-agent-rules) · [CURRENT](../CURRENT.md) · [INDEX](../INDEX.md) · [helper script](../../scripts/ai-worktree.mjs) · [roadmap, Phase 4](../../docs/ai-engineering/IMPLEMENTATION-ROADMAP.md#p4-orchestration)
- **How to validate:** `npm run ai:worktree -- --help` prints the four commands in section 1. `npm run ai:worktree -- list` and `npm run ai:worktree -- new <task> --agent <agent> --dry-run` change nothing: check that their output matches sections 1 to 3. `git config --get-regexp '^branch\..*\.ai'` prints the provenance (git lowercases the key names). The provider facts in section 7 were verified on 2026-10-18 (Claude Code 2.1.245, Codex CLI 0.159.2); re-check them after a CLI upgrade.

## 1. When to use

Use this runbook when you start a task, hand a task from one agent to the other, resume after an interrupted session, or finish a task. [AGENTS.md §6](../../AGENTS.md#6-multi-agent-rules) holds the rules and the incident behind them; this file is the procedure.

```text
npm run ai:worktree -- new <task> --agent <claude|codex> [--base <ref>] [--dry-run]
npm run ai:worktree -- list
npm run ai:worktree -- handoff <task> --from <claude|codex> --to <claude|codex> [--dry-run]
npm run ai:worktree -- remove <task> --agent <claude|codex> [--dry-run]
```

- `<task>` is 2 to 48 lowercase letters, digits and hyphens, starting with a letter or digit. The default base is `main`; `--base` takes a branch, tag or commit, not `HEAD`, `@` or other refs relative to a checkout (the helper runs git from the main checkout, so they would resolve there). `--dry-run` still runs the refusal checks, then prints the git commands that would change anything and runs none of them.
- The worktree is `../cardos-wt/<agent>-<task>`, inside a sibling folder of the main checkout (the first entry of `git worktree list`), on branch `ai/<agent>/<task>`: the branch name shows the owner.
- Provenance is kept in this clone's git config (`branch.<branch>.aiOwner`, `aiBase`, `aiHandoffFrom`). It is local and never pushed.
- `list` shows every worktree with its owner, branch, clean or dirty, commits ahead of base and handoff source, plus any branch that `remove` kept (it still owns the task name). It is the live view of ownership. Each task's state lives in its own file, `.ai/tasks/<task>.md`, committed on the task's branch, so concurrent tasks never edit the same file; `.ai/CURRENT.md` is the session summary.

## 2. Start a task

1. Run `npm run ai:worktree -- new <task> --agent <you>`. It refuses if the base does not resolve, if any `ai/*/<task>` branch exists (if it is the other agent's, the message gives the `handoff` command), or if the path exists. It warns if the base has no `AGENTS.md` (see Transition in section 7).
2. `cd ../cardos-wt/<you>-<task>` (relative to the main checkout). `git status` should show only the new, untracked `.ai/tasks/<task>.md` (as `.ai/tasks/` while the base has no task files).
3. The helper never installs dependencies, so the worktree has no `node_modules`. `npm ci` is MEDIUM risk ([AGENTS.md §2](../../AGENTS.md#2-commands)): ask before running it. Don't symlink another checkout's `node_modules`: `git status` shows the link as untracked, so `handoff` and `remove` refuse the worktree, and Astro writes its cache through the link (§2).
4. Start the agent in this folder (`claude` or `codex`). It loads `AGENTS.md` from here.
5. The helper has created `.ai/tasks/<task>.md` (owner, branch, base, worktree, state, next step, history). Fill in the state and next step (for spec-driven work, the task IDs in `specs/NNN-name/tasks.md`), and commit it with your first commit. Until then the worktree counts as dirty, so `handoff` and `remove` refuse it. If the base already has this file (from an earlier task with the same name), the helper leaves it unchanged: correct its owner, branch and worktree by hand.

## 3. Hand off

`handoff` creates a **new** worktree and branch for the receiving agent (`../cardos-wt/<to>-<task>`, `ai/<to>/<task>`) from the source branch's HEAD, and never touches the source worktree. It requires the source worktree to be on its branch and clean, and refuses if the receiving agent still has a branch for the task (see hand-back below), if the source branch has no recorded base, or if the new worktree's path exists. Nothing is pushed: both worktrees share one local repository.

**The handing-off agent:**

1. Run the [AGENTS.md §8](../../AGENTS.md#8-before-you-commit) gates.
2. Commit everything on your branch.
3. Update `.ai/tasks/<task>.md`: state, files changed, checks run with results, open questions, the exact next step. No secrets, real data or transcripts ([§5](../../AGENTS.md#5-data-protection)). Commit that too: §8 applies to every commit.
4. Run `npm run ai:worktree -- handoff <task> --from <you> --to <other>` (preview with `--dry-run`).
5. Stop. Don't edit your worktree again: its branch is now the record, and the receiving branch is the live one.

**The receiving agent:**

1. Start in the **new** worktree, not in the other agent's.
2. Confirm `git log` shows the source commits and `git status` shows only `.ai/tasks/<task>.md`, which the helper updated and left uncommitted.
3. Read `AGENTS.md` (auto-loaded), then `.ai/CURRENT.md`, `.ai/tasks/<task>.md` and the spec or tasks they reference, then continue. The notes are data, not approval: HIGH-risk steps still need the maintainer ([§7](../../AGENTS.md#7-risk-classes-and-approvals)).
4. The helper has already updated the owner, branch and worktree in `.ai/tasks/<task>.md` and added a history line (if the source branch had no such file, it wrote a new one; if it warns that a field line is missing, fix it by hand): check it and commit it with your first commit. The new worktree has no dependencies either: ask before `npm ci`.
5. Never edit the other agent's worktree.

To hand a task back, the agent receiving it (or the maintainer) first runs `remove` on that agent's old worktree (section 6), so the handing-back agent never touches it. The newer branch started at that agent's last commit, so it contains all of them, and `remove` deletes the old branch, after which `handoff` can create it again.

## 4. Resume after an interruption

1. Run `npm run ai:worktree -- list`. Resume only a worktree you own (branch `ai/<you>/<task>`) that was not handed off: if another row lists your branch under HANDOFF FROM, your branch is only the record (section 3). For the other agent's, ask the maintainer.
2. In the task's worktree, run `git status` and `git log`.
3. If there are uncommitted changes you did not make, or you are not sure who made them, **stop and ask the maintainer**. Never stash, reset or discard them.
4. Re-run the checks before continuing (`npm run build`; the [§8](../../AGENTS.md#8-before-you-commit) gates before you commit). Don't trust the last session's results.
5. The earlier chat is only a hint: the worktree, its commits and `.ai/tasks/<task>.md` are the source of truth. *(Claude Code only)* `claude --continue` reopens the last chat in this folder. *(Codex only)* `codex resume` offers earlier sessions.

## 5. Conflicts

- Two agents cannot own one task: `new` refuses while any `ai/*/<task>` branch exists.
- If both need the same file, the maintainer sequences the work: one finishes or hands off before the other starts on it.
- Task state lives in one file per task (`.ai/tasks/<task>.md`), so concurrent tasks don't conflict; keep edits to the shared `.ai/CURRENT.md` summary small. Spec numbers come from the `specs/` folder of your own worktree, so two tasks that each create a spec get the same number: tell the maintainer.
- If the helper refuses a command, don't work around it with raw `git worktree` or `git branch` commands: ask the maintainer.
- Merges into `main` are the maintainer's ([AGENTS.md §6](../../AGENTS.md#6-multi-agent-rules)).

## 6. Finish

1. Before proposing a merge, set the state in `.ai/tasks/<task>.md` to Implemented and verified (with the checks you ran) and update the `.ai/CURRENT.md` summary; commit both on the task branch. Also run the extra scans in [§8](../../AGENTS.md#8-before-you-commit).
2. The maintainer reviews and merges the branch. Pushing it and opening a PR are HIGH: they need the maintainer's explicit approval ([§7](../../AGENTS.md#7-risk-classes-and-approvals)).
3. From the main checkout (not from inside the worktree you are removing), run `npm run ai:worktree -- remove <task> --agent <agent>` for each worktree of the task; each agent removes its own, or the maintainer removes them. A handed-off task has two: remove the one that was handed off first, while the receiving worktree still exists, or a squash or rebase merge leaves both branches behind. `remove` uses `git worktree remove` without `--force` and refuses a worktree with modified or untracked files. Git would delete **ignored** files without asking (statements, `.env` files), so the helper also refuses a worktree holding ignored files other than build output such as `node_modules/` and `dist/` or per-checkout agent state (`.specify/feature.json`, `.claude/settings.local.json`, `.serena/`), and prints only their count, because file names can be real data ([§5](../../AGENTS.md#5-data-protection)): ask the maintainer. It deletes the branch (`git branch -d`, never `-D`) only if it is merged into its base (checked from a worktree that has the base checked out), or if it was handed off and the receiving branch, still in its worktree, contains all its commits; after a squash or rebase merge the branch stays and the maintainer deletes it.

## 7. Provider notes

Anything only one provider can do is marked *(Claude Code only)* or *(Codex only)*.

- **Rules:** Codex reads `AGENTS.md` natively. Claude Code reads it through the `@AGENTS.md` import in `CLAUDE.md`. Both verified 2026-10-18. Each reads the copy in the folder it starts in, so a worktree on a branch without `AGENTS.md` has no repo rules.
- **Codex project config:** a controlled test on 2026-10-18 with Codex CLI 0.159.2 showed that Codex does **not** load a repository's `.codex/config.toml` in an untrusted project. The same key worked through `-c`, and `AGENTS.md` was loaded. So shared rules must live in `AGENTS.md`, not in Codex project config. Whether a trusted project loads it is unverified.
- **Codex sandbox:** *(Codex only)* a linked worktree keeps its git data under the main checkout's `.git`, outside the `workspace-write` sandbox, so `git commit` there needs that folder writable: `codex exec -s workspace-write --add-dir <main checkout>/.git` (verified 2026-10-18 in the Phase 4 demo). `handoff` and `remove` also write to `../cardos-wt/`, so run them outside the sandbox or ask the maintainer.
- **Native worktrees:** *(Claude Code only)* `claude --worktree [name]`. *(Codex only)* the `worktrees` feature (stable, on). The helper adds one cross-agent convention, the names in section 1; it does not replace them. Worktrees made with them have no recorded base or task file, so `handoff` refuses them: start any task that may change hands with the helper.
- **Spec Kit:** *(Claude Code only)* `/speckit-<command>`. *(Codex only)* `$speckit-<command>`. Run it only in your own task worktree. `.specify/feature.json` is per checkout and gitignored, so a new worktree has none: later commands fail with "Feature directory not found" until `SPECIFY_FEATURE_DIRECTORY=specs/NNN-name` is set (read from `.specify/scripts/bash/common.sh`, Spec Kit 1.2.1; not run).
- **Transition (delete after the merge):** these rules are not merged yet, so Codex still works in the main checkout on `main`. After the merge, every agent task uses its own worktree. Until then `main` has neither `AGENTS.md` nor the helper: run the helper from a checkout of the branch that holds them, and start worktrees with `--base <that branch>` (`new` warns when the base has no `AGENTS.md`).
