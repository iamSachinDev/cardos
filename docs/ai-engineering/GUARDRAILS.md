# Guardrails

- **Purpose:** How each risk class in [`AGENTS.md` §7](../../AGENTS.md#7-risk-classes-and-approvals) is enforced: by a deny or ask rule, the OS sandbox, a git hook, a CI check, or policy only.
- **Audience:** The maintainer and the coding agents (Claude Code, Codex).
- **Owner:** The maintainer.
- **Related docs:** [AGENTS.md](../../AGENTS.md) · [roadmap, P5](IMPLEMENTATION-ROADMAP.md#p5-guardrails) · [PHASE-STATUS, P5](PHASE-STATUS.md#p5-guardrails)
- **How to validate:** `policy/test.sh`, then the three `conftest test` commands in [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml) (job `policy`); `sh .githooks/pre-commit` with nothing staged exits 0; the negative tests below. Verified 2026-10-18 with Claude Code 2.1.245, Codex CLI 0.159.2, gitleaks 8.27.2, osv-scanner 2.7.0, Opengrep 1.31.0, Conftest 0.71.1.

Guardrails are defense in depth, not a boundary. Command-text rules miss wrappers such as `sh -c` or `git -C . push`; the OS sandboxes cover file reads and writes, not intent. The rules in `AGENTS.md` still apply where nothing enforces them.

## Pieces

| Piece | Where | Active when |
|---|---|---|
| Claude Code permissions and sandbox | [`.claude/settings.json`](../../.claude/settings.json): 60 deny, 48 ask, 7 allow rules (dev servers ask, matching `AGENTS.md` §2); Bash sandbox on (Seatbelt), strict (`allowUnsandboxedCommands: false`), `.githooks/` not writable by sandboxed commands | Any Claude Code session started in a checkout that has the file. The 7 allow rules need the workspace-trust prompt accepted once; deny and ask apply regardless |
| Codex profile | [`codex-cardos.config.toml.example`](codex-cardos.config.toml.example), installed as `~/.codex/cardos.config.toml` | Only with `codex -p cardos`; Codex ignores a repo's `.codex/` in an untrusted project (Phase 4) |
| Codex command rules (proposed) | [`codex-cardos.rules.example`](codex-cardos.rules.example) | Not installed: the only location that always loads is the global `~/.codex/rules/`, the maintainer's call |
| Pre-commit hook | [`.githooks/pre-commit`](../../.githooks/pre-commit): blocks staged data and secret file types (even force-added) by count, never by name; runs `gitleaks git --staged`; fails closed without gitleaks | After `git config core.hooksPath .githooks` (set in this clone on 2026-10-18), in every checkout whose branch has `.githooks/` |
| CI | [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml): jobs `build`, `gitleaks` (full history), `osv-scanner` (lockfile), `policy` (Opengrep, Conftest); actions pinned by SHA, binaries checksum-verified, read-only token | After the branch is pushed. Has not run yet |
| Dependabot | [`.github/dependabot.yml`](../../.github/dependabot.yml): npm and GitHub Actions, weekly | After it reaches `main` on GitHub |
| Ruleset on `main` | [`.github/rulesets/main.json`](../../.github/rulesets/main.json): no deletion or force push, pull request required, the four CI checks required | **Not applied.** Needs the maintainer's explicit approval, after CI has run once; it would also end direct commits to `main` |
| Opengrep rules | [`.opengrep/rules.yml`](../../.opengrep/rules.yml): 7 rules from `AGENTS.md` §4 and §5 (no network calls outside `src/lib/`, no external URLs, Google origin only in `gmail.ts`, no raw HTML, only the theme key in browser storage, no `any`, no shell strings in `scripts/`) | CI job `policy`; locally with a downloaded binary |
| Conftest policies | [`policy/`](../../policy/): the Claude settings keep their data denies; workflows set permissions, pin actions and drop checkout credentials; Dependabot covers both ecosystems | CI job `policy`; locally `policy/test.sh` |

## Risk class → enforcement

| `AGENTS.md` §7 class | Claude Code | Codex | Git and CI | Policy only |
|---|---|---|---|---|
| LOW (read, docs, typecheck, build, scans) | Allow rules for the §2 commands, except `npm run ai:worktree`, which asks because it runs outside the sandbox | Default | — | — |
| MEDIUM (`src/`, `scripts/`, dependencies) | Ask on `npm ci`, `install`, `update`, `uninstall` | Proposed rules: prompt | CI `build`, `policy`; Dependabot | Plan first; approval before merge |
| HIGH Burnrate (patches, config, service, API writes) | Ask on `patches/**` edits, `patch`, `npm run cardos`, `brew services`, `launchctl`; deny on `curl` to `:8000` and `/api/` | Read deny on Burnrate data; on-request approvals | — | API writes by other means |
| HIGH Gmail/OAuth | Deny `npm run gmail:setup` and `configure-gmail.mjs`; ask on edits to `gmail.ts` and `configure-gmail.mjs` | Proposed rules: forbid `gmail:setup` | — | — |
| HIGH money and due-date logic | Ask on edits to `api.ts`, `BillsView.tsx`, `Dashboard.tsx` | — | CI `build` | Codex edits |
| HIGH CI, agent rules, constitution, accepted specs and ADRs | Ask on edits to `AGENTS.md`, `CLAUDE.md`, `.claude/settings*.json`, `.github/`, `.githooks/`, `policy/`, `.opengrep/`, the constitution | `.git`, `.codex`, `.agents` read-only in the workspace sandbox | Conftest keeps the settings and workflows from being weakened | Marking a spec or ADR Accepted; Bash writes to those files |
| HIGH publishing (push, PRs, issues, releases) | Ask on `git push`, `gh` writes, `gh api`, `gh release` | Proposed rules: prompt | Ruleset (not applied) | — |
| CRITICAL data exposure | Read deny (it also blocks Edit and Write) on Burnrate data, env files, statements and spreadsheets, databases, Google client JSON; the sandbox turns them into OS-level read denies for every command; `sqlite3`, `pdftotext` denied; claude.ai connectors and send/share/upload MCP tools denied | OS-level read deny on the same paths; no network; secret-like environment variables dropped | Hook blocks staged data file types; gitleaks in the hook and CI | Data stored under an extension not listed; real data typed into code, docs, memory or issues; live API responses read by scripts or browser tools |
| CRITICAL deleting or bulk-modifying statements or Burnrate data | The read deny on those paths also blocks Edit and Write; sandboxed commands write only the worktree and temp; `curl`/`wget` to the API denied | Writes only in the workspace; deny on the data paths | — | API deletes by other means |
| CRITICAL force push, push to `main`, history rewrite, `git add -f` | Deny | Proposed rules: forbid | Hook catches force-added data files; ruleset blocks force push (not applied) | Wrapper forms |
| CRITICAL disabling checks or prompts | Ask on settings and `.gitignore` edits; `.githooks/` and `.git/config` not writable by sandboxed commands; strict sandbox ignores `dangerouslyDisableSandbox` | — | Hook blocks data file types even if `.gitignore` is weakened; CI runs regardless of local hooks | `--no-verify` or `git -c core.hooksPath=…`, Bash edits to `.gitignore`, Codex config edits |

## Negative tests (2026-10-18, synthetic files only)

- **Denied read, Claude Code:** with deny rules mirroring the real ones on a synthetic folder, the Read tool refused a fake `.env.production`, `statement.pdf`, `.csv`, `.xlsx`, `.db`, `.sqlite-wal`, `.ofx` and Google client JSON. With the sandbox on, `cat`, `awk` and `python3 open()` failed with `Operation not permitted`, also when retried with `dangerouslyDisableSandbox`; with the sandbox off, `python3` printed the fake statement. So the sandbox is what makes the read deny hold.
- **Denied read, Codex:** `codex sandbox -p cardos` refused the same fake files (`Operation not permitted`); without the profile's denies it printed them.
- **Commands:** 13 dangerous commands denied in Claude Code (force push, push to `main`, `git add -f`/`.`/`-A`, `commit -a`/`--amend`, `rebase`, `reset --hard`, `gmail:setup`, `sqlite3`, `curl` to the Burnrate API); `git push` and `npm ci` asked; `codex execpolicy check` on the proposed rules: forbidden or prompt as listed.
- **Planted fake secret:** the hook blocked a commit with a fake GitHub token and AWS-style key (gitleaks: 3 leaks); six force-added data files (`.pdf`, `.CSV`, `.env`, client JSON, `.sqlite3-wal`, `.XLSX`) were blocked with a count and no file name; with gitleaks off the `PATH` the hook refused the commit.
- **Independent review (2026-10-18):** a sandboxed command rewrote a scratch copy of `scripts/ai-worktree.mjs`, then the allowed, unsandboxed `npm run ai:worktree` read a synthetic statement without a prompt; with the allow rule removed it asks. A sandboxed write to `.githooks/` is refused. The hook also blocks names holding a quote, backslash, tab or newline (sh, bash 3.2, dash).
- **Not tested:** the real Burnrate paths (deliberately; their rules are verified as loaded config and through the synthetic mirrors), and CI, which runs only after a push.

## Pilots

- **Opengrep:** KEEP. 7 rules, about 1.4 s, no network needed (verified under a network-deny sandbox), 1 true positive (`as any` in `Dashboard.tsx`, WARNING, so CI uses `--severity ERROR`), no false positives. Release binary verified by sha256 and its Sigstore signature against the bundled certificate (the chain to the Sigstore root was not checked).
- **Conftest:** KEEP. 3 policies, 10 passing and failing fixtures, about 0.02 s per file, pass on the real configs. It checks that a deny rule mentions each pattern, not that the glob is exact; the negative tests cover that.

## Residual risks

- **MCP is a denylist in Claude Code, an allowlist of none in Codex.** Claude Code denies every claude.ai connector and any send, forward, share, upload, reply or publish tool; other local servers keep the default prompt, so Phase 6 can allow Serena. The `cardos` Codex profile turns all MCP servers off. This deviates from the roadmap's "MCP allowlist"; the Phase 6 registry is where an allowlist fits.
- Prompted commands that run outside the sandbox (`git push`, `npm ci`, `npm run cardos`, `npm run ai:worktree`) execute repo code that sandboxed commands can change; read what changed before approving.

- `allowLocalBinding` lets sandboxed commands reach any localhost port, Burnrate's included; only the obvious `curl` forms are denied.
- Commands excluded from the Claude sandbox (`git push`/`fetch`/`pull`, `gh`, `npm ci`/`install`, `npm run cardos`, `brew services`, `npm run ai:worktree`) run with full access after their ask rule, and they run repo code that sandboxed commands can change (`package.json` scripts, `.npmrc`, `scripts/`). Approve them only when that code is unchanged.
- With a symlinked `node_modules`, Vite's cache is outside the sandbox's write area; `npm run build`, `npm run check` and `npx tsc --noEmit` still pass with that write denied.
- The Read tool cannot open `.env.example` (a `!` exception cannot reach a `//` rule); `cat .env.example` works because the sandbox re-allows it.
- Under the sandbox, `gitleaks dir` skips the files it cannot read (env, statement and database types), logs their names and still exits 0.
- The Codex command rules and the ruleset are not active until the maintainer installs or applies them.
