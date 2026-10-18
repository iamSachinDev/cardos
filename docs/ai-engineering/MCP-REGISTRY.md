# MCP registry

- **Purpose:** The MCP servers allowed for CardOS work, per agent: what each one can reach, how it is pinned and limited, and how a new one is added.
- **Audience:** The maintainer and the coding agents (Claude Code, Codex).
- **Owner:** The maintainer.
- **Related docs:** [GUARDRAILS.md](GUARDRAILS.md) · [AGENTS.md §5 and §7](../../AGENTS.md#7-risk-classes-and-approvals) · [roadmap, P6](IMPLEMENTATION-ROADMAP.md#p6-code-intelligence-and-memory)
- **How to validate:** `claude mcp list` started in a CardOS checkout shows `serena` from `.mcp.json`; `codex -p cardos mcp list` shows the servers below as enabled or disabled; `conftest test --policy policy --namespace claude_settings .claude/settings.json` passes. Checked 2026-10-18.

An MCP server runs as its own process, **outside** both agents' sandboxes and permission rules for files and shell commands. What it can read or change is limited only by its own configuration and by which of its tools an agent may call. So a server is allowed here only if it is needed, pinned, and limited to what CardOS work needs.

## Allowed for CardOS

| Server | Agents | Pinned | What it can reach | Limits | Notes |
|---|---|---|---|---|---|
| `serena` (code navigation, GPL-3.0) | Claude Code via [`.mcp.json`](../../.mcp.json); Codex via the `cardos` profile | `serena-agent==2.0.0` (released 2026-10-13, so 5 days old when pinned: an exception to step 2 of "Adding a server", following the roadmap's "pin v2"; the maintainer confirms it) | Symbols in the project's TypeScript files, through the TypeScript language server. The symbol tools refuse paths outside the project root and paths in git-ignored folders (synthetic test, 2026-10-18). Serena itself writes its symbol cache (`.serena/cache/`, git-ignored) and logs under the user's Serena home | **Read-only** in [`.serena/project.yml`](../../.serena/project.yml), which also pins `agent_interface: tools` and excludes the edit, shell, memory and raw-file tools (`read_file`, `list_dir`, `find_file`, `search_for_pattern`, `read_memory`, `list_memories`); Claude Code denies the same 24 tools, and the Codex profile allows only the 7 navigation tools | Remaining tools: `find_symbol`, `find_referencing_symbols`, `find_declaration`, `find_implementations`, `get_symbols_overview`, `get_diagnostics_for_file`, `initial_instructions`. Usage reporting and the web dashboard are off (`SERENA_USAGE_REPORTING=false`, `--enable-web-dashboard False`). Raw-file tools are excluded because `search_for_pattern` returned the contents of git-ignored folders when given their path; memory reading is excluded because `read_memory` followed a symlink in `.serena/memories/` to a file outside the project and also reaches the user-wide global memories; `agent_interface` is pinned because the REPL interface, the default in a new 2.0.0 global config, ignores `read_only` and `excluded_tools` and runs arbitrary Python (all synthetic tests, 2026-10-18). On first start Serena installs the TypeScript language server with `npm install` (pinned versions) into the user's Serena home |
| `headroom` (context compression, local) | Claude Code, from the user config (disabled in the Codex `cardos` profile) | Installed tool, 0.37.0 | Content an agent passes to its tools; it keeps a retrievable copy in a local SQLite store under `~/.headroom/` | Neither agent routes its traffic through headroom's proxy (checked 2026-10-18) | **Never pass real financial data or Burnrate output to it**: the copy persists on disk |

## Not allowed for CardOS

| Server or group | Agent | How it is blocked |
|---|---|---|
| claude.ai connectors (mail, chat, drive, docs and the rest) | Claude Code | Denied by `mcp__claude_ai_*` in [`.claude/settings.json`](../../.claude/settings.json) |
| Any tool that sends, forwards, shares, uploads, replies or publishes | Claude Code | Denied by tool-name globs in `.claude/settings.json` |
| The maintainer's other user-level servers (work tools unrelated to CardOS) | Claude Code | Not denied by name, because this file is public; each first use asks for approval. Don't approve them in CardOS sessions |
| Every server except `serena` | Codex (`cardos` profile) | Disabled in the profile ([example](codex-cardos.config.toml.example)) |
| Browser, computer-use, PDF and spreadsheet plugins | Codex (`cardos` profile) | Disabled: the CardOS UI and statements show real data |

## Adding a server

1. Open a task with the helper and propose it: what it is for, license, maintainer activity, what it can read or send, whether it stores data, and where.
2. Pin an exact version that is at least two weeks old, unless it fixes a security issue.
3. Limit it: read-only where possible, deny its writing and sending tools in `.claude/settings.json`, and enable it in the Codex `cardos` profile only if Codex needs it.
4. Add a row above, and update the Conftest policy if the server needs a guard.
5. Agent settings are HIGH class ([AGENTS.md §7](../../AGENTS.md#7-risk-classes-and-approvals)): the maintainer approves before the change is made.

A server is removed by deleting its row, its `.mcp.json` entry and its profile entry in the same commit.
