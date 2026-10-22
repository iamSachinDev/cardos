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
| Claude Code permissions and sandbox | [`.claude/settings.json`](../../.claude/settings.json): 86 deny (24 of them for Serena's writing, raw-file and memory tools, Phase 6; database journals are matched as `*.db-wal`, `*.db-shm` and `*.db-journal`, because a broad `*.db-*` also matched Vite's hashed `AppShell.DB-<hash>.css` and broke `npm run build` in the sandbox), 53 ask, 7 allow rules (dev servers ask, matching `AGENTS.md` §2); Bash sandbox on (Seatbelt), strict (`allowUnsandboxedCommands: false`), `.githooks/` not writable by sandboxed commands | Any Claude Code session started in a checkout that has the file. The 7 allow rules need the workspace-trust prompt accepted once; deny and ask apply regardless |
| Codex profile | [`codex-cardos.config.toml.example`](codex-cardos.config.toml.example), installed as `~/.codex/cardos.config.toml` | Only with `codex -p cardos`; Codex ignores a repo's `.codex/` in an untrusted project (Phase 4) |
| Codex command rules | [`.codex/rules/cardos.rules`](../../.codex/rules/cardos.rules) (same rules as [`codex-cardos.rules.example`](codex-cardos.rules.example)): forbid force push, push to `main`, `git add -f`/`-A`/`.`, `commit -a`/`--amend`, rebase and other history rewrites, `reset --hard`, `gmail:setup`, `sqlite3`; prompt before other pushes, `gh` writes, installs and Burnrate service commands | Any Codex session in a CardOS checkout whose branch has the file: Codex loads a trusted project's `.codex/rules/`, the maintainer's Codex config trusts the main checkout, and linked worktrees inherit that trust (tested 2026-10-21, Codex CLI 0.163.0). No Codex config change; other projects unaffected |
| Pre-commit hook | [`.githooks/pre-commit`](../../.githooks/pre-commit): blocks staged data and secret file types (even force-added) by count, never by name; runs `gitleaks git --staged`; fails closed without gitleaks | After `git config core.hooksPath .githooks` (set in this clone on 2026-10-18), in every checkout whose branch has `.githooks/` |
| CI | [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml): jobs `build`, `gitleaks` (full history), `osv-scanner` (lockfile), `policy` (Opengrep, Conftest); actions pinned by SHA, binaries checksum-verified, read-only token | On every push and pull request on GitHub. First run, 2026-10-21: [run 39613874631](https://github.com/iamSachinDev/cardos/actions/runs/39613874631) on `4da79314` (push to `main`): `build`, `gitleaks`, `osv-scanner` and `policy` all `success`. Commit `8b003986` adds `npm test`, `docs:test`, `docs:links`, `docs:routes:check` and an advisory pull-request `docs:impact` to `build`; its CI result is pending on its pull request |
| Dependabot | [`.github/dependabot.yml`](../../.github/dependabot.yml): npm and GitHub Actions, weekly | Live: on `main` since 2026-10-21; Dependabot started its first npm and GitHub Actions update runs |
| Ruleset on `main` | [`.github/rulesets/main.json`](../../.github/rulesets/main.json): no deletion or force push, pull request required, the four CI checks required | **Imported but not enforcing; Deferred by the maintainer (2026-10-21).** Imported on GitHub on 2026-10-21 as `protect-main` (id 25552280) with enforcement `disabled` and required checks `build`, `gitleaks`, `osv-scanner`, `policy`; GitHub's `evaluate` mode returned 422 "not supported on this plan" (Enterprise only). The maintainer chose to keep direct pushes possible; revisit when they want PR-only changes to `main`. When active it requires a pull request with passing checks for every change to `main` and blocks deletion and force pushes, so direct pushes to `main` end |
| Opengrep rules | [`.opengrep/rules.yml`](../../.opengrep/rules.yml): 11 rules from `AGENTS.md` §4 and §5 (no network calls outside `src/lib/`, no external URLs, Google origin only in `gmail.ts`, no raw HTML, only the theme key in browser storage, no `any`, no shell strings in `scripts/`) | CI job `policy`; locally with a downloaded binary |
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
| HIGH publishing (push, PRs, issues, releases) | Ask on `git push`, `gh` writes, `gh api`, `gh release` | Proposed rules: prompt | Ruleset (imported, disabled) | — |
| CRITICAL data exposure | Read deny (it also blocks Edit and Write) on Burnrate data, env files, statements and spreadsheets, databases, Google client JSON; the sandbox turns them into OS-level read denies for every command; `sqlite3`, `pdftotext` denied; claude.ai connectors and send/share/upload MCP tools denied | OS-level read deny on the same paths; no network; secret-like environment variables dropped | Hook blocks staged data file types; gitleaks in the hook and CI | Data stored under an extension not listed; real data typed into code, docs, memory or issues; live API responses read by scripts or browser tools |
| CRITICAL deleting or bulk-modifying statements or Burnrate data | The read deny on those paths also blocks Edit and Write; sandboxed commands write only the worktree and temp; `curl`/`wget` to the API denied | Writes only in the workspace; deny on the data paths | — | API deletes by other means |
| CRITICAL force push, push to `main`, history rewrite, `git add -f` | Deny | Proposed rules: forbid | Hook catches force-added data files; ruleset blocks force push (imported, disabled) | Wrapper forms |
| CRITICAL disabling checks or prompts | Ask on settings and `.gitignore` edits; `.githooks/` and `.git/config` not writable by sandboxed commands; strict sandbox ignores `dangerouslyDisableSandbox` | — | Hook blocks data file types even if `.gitignore` is weakened; CI runs regardless of local hooks | `--no-verify` or `git -c core.hooksPath=…`, Bash edits to `.gitignore`, Codex config edits |

## Reconciliation update (2026-10-21 IST)

The local ST Finance branch adds five Claude edit prompts for the new fee-source and spend-trend money files while retaining all existing deny rules. The browser-storage policy now permits writes to the new st-theme key and a read-only fallback to the old cardos-theme key. The external-URL policy keeps its general restriction and checks the fee-source module separately: only the six reviewed issuer-source URLs are allowed as literal sourceUrl values, and network calls in that module are prohibited.

The 11-rule YAML parses and synthetic regex cases pass. Actual scan: 2026-10-21: the pinned Opengrep 1.31.0 scan (`--severity ERROR src scripts`) first exited 1 on two lines of `src/lib/gmail.test.ts`, which asserts the Google origin check; the `cardos-google-origin-only-in-gmail` rule now also excludes that test file, and the scan exits 0. The seven-rule pilot evidence below belongs to the earlier baseline. The Conftest settings fixtures still pass after the additional prompts.

## Negative tests (2026-10-18, synthetic files only)

- **Denied read, Claude Code:** with deny rules mirroring the real ones on a synthetic folder, the Read tool refused a fake `.env.production`, `statement.pdf`, `.csv`, `.xlsx`, `.db`, `.sqlite-wal`, `.ofx` and Google client JSON. With the sandbox on, `cat`, `awk` and `python3 open()` failed with `Operation not permitted`, also when retried with `dangerouslyDisableSandbox`; with the sandbox off, `python3` printed the fake statement. So the sandbox is what makes the read deny hold.
- **Denied read, Codex:** `codex sandbox -p cardos` refused the same fake files (`Operation not permitted`); without the profile's denies it printed them.
- **Commands:** 13 dangerous commands denied in Claude Code (force push, push to `main`, `git add -f`/`.`/`-A`, `commit -a`/`--amend`, `rebase`, `reset --hard`, `gmail:setup`, `sqlite3`, `curl` to the Burnrate API); `git push` and `npm ci` asked; `codex execpolicy check` on the proposed rules: forbidden or prompt as listed.
- **Planted fake secret:** the hook blocked a commit with a fake GitHub token and AWS-style key (gitleaks: 3 leaks); six force-added data files (`.pdf`, `.CSV`, `.env`, client JSON, `.sqlite3-wal`, `.XLSX`) were blocked with a count and no file name; with gitleaks off the `PATH` the hook refused the commit.
- **Independent review (2026-10-18):** a sandboxed command rewrote a scratch copy of `scripts/ai-worktree.mjs`, then the allowed, unsandboxed `npm run ai:worktree` read a synthetic statement without a prompt; with the allow rule removed it asks. A sandboxed write to `.githooks/` is refused. The hook also blocks names holding a quote, backslash, tab or newline (sh, bash 3.2, dash).
- **Not tested:** the real Burnrate paths (deliberately; their rules are verified as loaded config and through the synthetic mirrors), and the ruleset, which is disabled (an `evaluate` dry run is not available on this plan). CI first ran on 2026-10-21 (see the CI row above).

## Pilots

- **Opengrep:** KEEP. 7 rules, about 1.4 s, no network needed (verified under a network-deny sandbox), 1 true positive (`as any` in `Dashboard.tsx`, WARNING, so CI uses `--severity ERROR`), no false positives. Release binary verified by sha256 and its Sigstore signature against the bundled certificate (the chain to the Sigstore root was not checked).
- **Conftest:** KEEP. 3 policies, 10 passing and failing fixtures, about 0.02 s per file, pass on the real configs. It checks that a deny rule mentions each pattern, not that the glob is exact; the negative tests cover that.

## Residual risks

- **MCP is a denylist in Claude Code, an allowlist in Codex.** Claude Code denies every claude.ai connector, any send, forward, share, upload, reply or publish tool and Serena's writing, raw-file and memory tools; other local servers keep the default prompt. The `cardos` Codex profile turns every server off except Serena, limited to 7 navigation tools. The allowed servers are listed in [MCP-REGISTRY.md](MCP-REGISTRY.md) (Phase 6).
- Prompted commands that run outside the sandbox (`git push`, `npm ci`, `npm run cardos`, `npm run ai:worktree`) execute repo code that sandboxed commands can change; read what changed before approving.

- `allowLocalBinding` lets sandboxed commands reach any localhost port, Burnrate's included; only the obvious `curl` forms are denied.
- Commands excluded from the Claude sandbox (`git push`/`fetch`/`pull`, `gh`, `npm ci`/`install`, `npm run cardos`, `brew services`, `npm run ai:worktree`) run with full access after their ask rule, and they run repo code that sandboxed commands can change (`package.json` scripts, `.npmrc`, `scripts/`). Approve them only when that code is unchanged.
- With a symlinked `node_modules`, Vite's cache is outside the sandbox's write area; `npm run build`, `npm run check` and `npx tsc --noEmit` still pass with that write denied.
- The Read tool cannot open `.env.example` (a `!` exception cannot reach a `//` rule); `cat .env.example` works because the sandbox re-allows it.
- Under the sandbox, `gitleaks dir` skips the files it cannot read (env, statement and database types), logs their names and still exits 0.
- The ruleset is imported with enforcement `disabled` (Deferred by the maintainer's choice, 2026-10-21) and does not block anything until it is activated; until then direct pushes to `main` and merges with failing checks are possible. The Codex command rules are prefix rules: wrappers (`sh -c`, `git -C . push`) and flags placed later in a command are not matched.
