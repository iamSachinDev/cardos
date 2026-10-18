# ADR 0002: Defer ai-memory; use versioned `.ai/` handoffs for agent memory

- **Purpose:** Record why CardOS does not install an automatic agent-memory tool (ai-memory) for now, what facts the decision rests on, and what would reopen it.
- **Audience:** The maintainer and AI agents asked to "add memory" or "install ai-memory".
- **Owner:** The maintainer.
- **Related docs:** [LIFECYCLE](../LIFECYCLE.md) · [AGENTS.md §5, §7, §9](../../AGENTS.md#5-data-protection) · [IMPLEMENTATION-ROADMAP, adoption matrix and P6](../../docs/ai-engineering/IMPLEMENTATION-ROADMAP.md#3-adoption-matrix) · [handoff runbook](../runbooks/handoff.md) · [INDEX](../INDEX.md)
- **How to validate:** re-read the sources under "Facts" and compare the version, license and hook defaults with the table; confirm nothing named `ai-memory` is installed or wired (`command -v ai-memory`, and `grep -rn "ai-memory" .claude .codex .mcp.json 2>/dev/null` finds no hook or server entry).

| | |
|---|---|
| **Status** | Proposed (the maintainer accepts ADRs, [AGENTS.md §7](../../AGENTS.md#7-risk-classes-and-approvals)) |
| **Date** | 2026-10-18 |
| **Risk class** | HIGH if ever installed: it writes agent hook configuration and captures session content |
| **Verdict** | DEFER (same as the roadmap's adoption matrix, 2026-10-17) |

## Context

- CardOS is a **public** repository that sits next to **real financial data**: Burnrate's database, statements and Gmail credentials live outside the repo, and agents work in a checkout from which those files are reachable ([AGENTS.md §5](../../AGENTS.md#5-data-protection)). A tool that records what an agent sees or types can pick that data up.
- **Two agents** (Claude Code and Codex) work in separate worktrees. The need is real: the second agent or the next session must continue without the first one's memory. The handoff procedure exists ([runbook](../runbooks/handoff.md)); the question is whether automatic memory should be added to it.
- Memory content is retrieved text. It ranks last in the [authority order](../../AGENTS.md#9-authority-order) (level 7) and can never approve an action.
- Hooks and agent configuration files are HIGH risk ([§7](../../AGENTS.md#7-risk-classes-and-approvals)); the roadmap forbids unreviewed installers (`curl | sh`) and requires pinned versions.

## Facts about ai-memory

Checked 2026-10-18 by reading the project's public pages with a web-fetch tool (its summaries of each page, not a local read of the source). Nothing was installed or run.

| Question | Finding | Source |
|---|---|---|
| What is it | A long-term memory system for coding agents: a local server that receives hook events from agent CLIs and compiles them into a git-versioned markdown wiki, with a SQLite index | Repository README, https://github.com/akitaonrails/ai-memory |
| Version | Latest release v3.1.1, published 2026-10-17. The roadmap recorded v3.1.0 on 2026-10-17, so the project moves quickly | https://api.github.com/repos/akitaonrails/ai-memory/releases/latest |
| License, activity | MIT; default branch `main`; last push 2026-10-17; about 10,000 stars; not archived | https://api.github.com/repos/akitaonrails/ai-memory |
| Default capture | The README says its hooks "record what happened (prompts, tool calls, session boundaries)" and that after setup "every prompt and tool call now lands in ai-memory". Assistant final-turn text is off by default and needs two opt-ins | README; https://github.com/akitaonrails/ai-memory/blob/main/DATA_HANDLING.md |
| Capture scope | The default capture mode is `denylist`, which captures repositories that have no `.ai-memory.toml` marker. An `allowlist` mode captures only marked repositories. `ignore_paths` rules exist but are enforced only by the native hook commands, not by the legacy shell hooks. No general off switch is described; `--no-capture-prompts` (Claude Code only) turns off prompt capture | https://raw.githubusercontent.com/akitaonrails/ai-memory/main/docs/install.md |
| Where hooks are installed | User level: `~/.claude/settings.json` for Claude Code and `~/.codex/hooks.json` for Codex, so every repository the user opens is affected, not only CardOS. `--scope project` writes the gitignored `.claude/settings.local.json` but is Claude Code only. Installers write timestamped backups; `ai-memory uninstall --apply` removes what it installed | docs/install.md (same URL) |
| Install method | The documented quick start is `curl -fsSL .../install.sh \| sh`; a checksum-verified download is the alternative, though the checksum comes from the same origin as the archive | docs/install.md |
| Where data lives | One local data directory (macOS: `~/Library/Application Support/ai-memory`) holding `wiki/` (markdown, git-versioned), `raw/`, `db/` (SQLite), `models/`, `logs/`; no encryption at rest, protection is OS file permissions | README; DATA_HANDLING.md |
| What leaves the machine | By default nothing: "no analytics, crash reporting, or usage telemetry"; local embeddings; the default path uses zero LLM calls. Three opt-in paths send data out: a cloud embedding provider (the text of every stored page), assistant-turn capture to a cloud LLM, and LLM reranking (live queries plus snippets). The server binds loopback by default but can be run on a LAN host, and a repository can route its capture to another server | DATA_HANDLING.md; README |
| Redaction | A sanitizer strips obvious credentials from assistant capture and reranking. DATA_HANDLING.md and SECURITY.md call it "best-effort, not a guarantee". The embedding path is not sanitized the same way | DATA_HANDLING.md; https://raw.githubusercontent.com/akitaonrails/ai-memory/main/SECURITY.md |
| Hook-free mode | MCP-only operation exists for some agents ("the agent can still query memory but capture becomes manual"). Claude Code and Codex use hooks | docs/install.md |

**Unverified** (not confirmed from the pages read; treat as open):

- What exactly the default hooks send for each event: payload fields, whether tool output and file contents are included, and whether the sanitizer runs on prompt and tool-call capture (the documents describe the sanitizer for assistant capture and reranking only).
- The full list of hook events registered for Claude Code (nine are mentioned; the list was inferred from names in the text) and for Codex (four named).
- Whether a hook-free, capture-off configuration exists for Claude Code and Codex. Only `--no-capture-prompts` (Claude Code) and the `allowlist` mode were found.
- `docs/install.md` is about 196,000 characters; only the first 100,000 were read. `SECURITY.md` and `DATA_HANDLING.md` defer to each other and to source code that was not read.
- Behavior in practice: nothing was installed or run, so no capture was observed and no data was inspected.

## Options considered

| Option | For | Against |
|---|---|---|
| **A. ai-memory** | Shared memory across both agents and many tools; local-first and MIT; markdown wiki is git-versioned and human-readable; no telemetry by default | Default hooks capture prompts and tool calls from every repository, because install is user-level and the default mode is `denylist`; a session that touches Burnrate data would be recorded in a store that is not reviewed before it lands (and whose wiki is git-versioned, so a stray `git push` of it would publish it); sanitizing is best-effort; installer is `curl \| sh` and rewrites HIGH-risk agent config; fast release cadence needs pinning; optional paths send data to third-party providers; the capture is unreviewed, which conflicts with "durable knowledge goes in through a reviewed commit" |
| **B. Serena memories** (`.serena/memories/`, already ignored by git) | Already adopted for code navigation; plain files; per checkout; written only when the agent chooses to | Not shared between worktrees or agents; agent-written and unreviewed; can drift from the code; fine as a hint, not as handoff |
| **C. Claude Code auto-memory / Codex sessions** | Built in, nothing to install; useful for personal preferences | Per agent and per machine; invisible to the other agent; unreviewed; Codex sessions are raw transcripts; not versioned |
| **D. Git-versioned `.ai/` handoffs** (`CURRENT.md`, `tasks/<task>.md`, ADRs, runbooks) | Reviewed commits; visible to both agents and the maintainer; no new software, no capture, nothing outside the repo; already built and exercised in Phase 4; lifecycle rules in [LIFECYCLE](../LIFECYCLE.md) | Manual: an agent must write the handoff; no semantic search; facts stay unrecorded if the agent forgets |

## Decision

**Defer ai-memory. Do not install it, run its installer, or add its hooks or MCP server to any agent.** Use option D as the memory that counts, with B and C allowed only as local hints under the rules in [LIFECYCLE](../LIFECYCLE.md):

- Durable knowledge goes into `.ai/` (or `AGENTS.md`, `docs/`) through a reviewed commit; local memory is a hint and never approval ([AGENTS.md §9](../../AGENTS.md#9-authority-order), level 7).
- Handoffs use `npm run ai:worktree -- handoff`, `.ai/tasks/<task>.md` and `.ai/CURRENT.md`.
- No real financial or personal data, secrets or transcripts in any memory ([AGENTS.md §5](../../AGENTS.md#5-data-protection)).

## Consequences

- **Good:** no new capture of prompts or tool output; no user-level hook changes; nothing to pin, update or audit; both agents work from the same reviewed files.
- **Cost:** handoff quality depends on agents writing and updating the files; no semantic recall across sessions; stale files need the review triggers in [LIFECYCLE](../LIFECYCLE.md).
- **Reversible:** deferring costs nothing; installing later is a reviewed, HIGH-risk change.
- The roadmap row and the Security implications section already say DEFER; this ADR is their decision record.

## Revisit when

Reopen this ADR (as a new proposal, in a worktree) if any of these becomes true:

1. A **capture-off or opt-in mode that works for both Claude Code and Codex** is verified: for example an `allowlist` default or a hook-free configuration where nothing is recorded unless the agent explicitly writes a note, and project-scoped installation for Codex that leaves user-level files alone.
2. **Local-only storage is verified** by reading `DATA_HANDLING.md` and the source or by observing network traffic in a scratch repository with synthetic data, including the embedding and reranking paths turned off; and the wiki is confirmed to stay outside any repository the maintainer pushes.
3. **A need the `.ai/` files cannot meet** is shown by evidence: for example handoffs repeatedly losing facts that a search over past sessions would have recovered, recorded in `PHASE-STATUS.md`.
4. A pinned release can be installed without `curl | sh`, from a source the maintainer approves.

Any pilot would run only on a synthetic repository first, with the maintainer's explicit approval for the install and the hook changes ([AGENTS.md §7](../../AGENTS.md#7-risk-classes-and-approvals)).
