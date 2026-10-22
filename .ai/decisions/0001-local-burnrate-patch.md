# ADR 0001: Patch the Homebrew-installed Burnrate locally

- **Purpose:** Record why CardOS runs against a locally patched Burnrate 0.5.2 and what the patches change, so an upgrade or a cleanup does not silently undo them.
- **Audience:** The maintainer and AI agents touching Burnrate, Gmail sync or statement-processing behaviour.
- **Owner:** The maintainer.
- **Related docs:** [CONTEXT](../CONTEXT.md#external-dependency) · [INDEX](../INDEX.md) · [patches/burnrate-0.5.2.patch](../../patches/burnrate-0.5.2.patch)
- **How to validate:** `grep '^+++ ' patches/burnrate-0.5.2.patch` lists the seven files in the table below; `git log --oneline -- patches/` lists the patch commits.

| | |
|---|---|
| **Status** | Accepted (2026-10-21): accepted by the maintainer. The patches are in use. The earlier "Accepted" text was written by an agent in Phase 2 (2026-10-17); the maintainer confirmed it on 2026-10-21 |
| **Date** | 2026-10-17 |
| **README** | Since the maintainer's 2026-10-21 decision the root README carries no Burnrate patch section; the "README" mentions below describe the earlier README. The apply command is in the Decision section; the patches are under [`patches/`](../../patches/) |
| **Risk class** | HIGH: the patched code parses, deduplicates and stores financial statements |

## Context

Burnrate 0.5.2, installed through Homebrew, is CardOS's backend ([CONTEXT](../CONTEXT.md#external-dependency)). Its Gmail sync and statement processing had these problems on first use:

1. Every sync re-downloaded every attachment under a new random name, so copies piled up.
2. Attachments saved into the watch folder were processed twice, by Gmail sync and by the folder watcher. The two raced and created duplicate statement rows.
3. One Gmail list call capped each sync at 40 messages, with no pagination.
4. Bank detection broke on Burnrate's own stored-filename prefix. PDFs from an unknown bank were labelled with whichever bank's password list unlocked them first, which gave wrong bank labels.
5. There was no Standard Chartered parser.
6. Password-candidate gaps existed for some banks.
7. Non-card PDFs (broker, mutual-fund, loan and bank-account statements, EMI booking letters) created failed statement rows.
8. The CSV import path referenced an undefined variable.

CardOS keeps no finance data of its own and only renders what Burnrate's API returns (README, "Data"), so none of this can be fixed in the frontend.

## Decision

Patch the Homebrew-installed Burnrate in place and keep reproducible patches in this repo, starting with `patches/burnrate-0.5.2.patch`. The README gives the apply command: `patch -p0 -d "$(brew --prefix burnrate)/libexec" < patches/burnrate-0.5.2.patch`.

- A per-user filename ignore rule, `BURNRATE_IGNORE_FILENAME_REGEX`, lives in Burnrate's env file (`.env.production`), not in this repo. The patch only adds the setting.
- Contributing the fixes upstream is recommended.

What `patches/burnrate-0.5.2.patch` changes (840 lines; seven files, one of them new; paths are relative to Burnrate's `libexec`). "Fixes" refers to the numbered problems above.

| File | What changes | Fixes |
|---|---|---|
| `backend/services/gmail_sync.py` | Attachment names become deterministic (hash of message id, part id and filename), and attachments already saved, including legacy random-named copies, are skipped. Files are written atomically through a hidden temp file. The list call pages through results (100 per page) and the cap rises from 40 to 200 messages. Syncs run one at a time behind a lock. Ignored filenames are skipped before download. The result gains `attachments_skipped`. | 1, 2, 3, 7 |
| `backend/services/folder_watcher.py` | A claim registry lets Gmail sync mark files it queues itself, so the watcher skips them. The initial scan submits one file per distinct SHA-256. Result logging moves to a shared `log_processing_outcome` callback. | 1, 2 |
| `backend/services/statement_processor.py` | An in-flight hash guard stops concurrent duplicate processing. A stored bank of `"unknown"` counts as no bank. The ignore rule is checked first. When the bank is unknown and a password list unlocks the PDF, the issuer is detected from the unlocked content instead of taken from that list. A known bank's password list is tried first, then the other banks' lists, keeping the known label. Registers the `sc` parser. Non-card PDFs are skipped without creating a statement row. Drops the `encrypted_password_to_save` argument (the undefined variable) from two `Statement(...)` calls. | 2, 4, 5, 6, 7, 8 |
| `backend/parsers/detector.py` | Strips Burnrate's storage prefix before filename rules and treats `_` as a space. Detects Standard Chartered by filename and text (checked before the generic bank chain), an HDFC filename layout and one more ICICI BIN prefix. Rejects broker, mutual-fund, loan and bank-account documents and EMI booking letters from page-1 text, but only when the card-statement markers are absent (for EMI letters: when no statement summary is present). Adds `is_ignored_filename` and `is_non_card_document`. | 4, 5, 7 |
| `backend/parsers/sc.py` (new) | `StandardCharteredParser`, built on `GenericParser`: statement period, transaction lines, reference-number stripping. | 5 |
| `backend/services/pdf_unlock.py` | A Standard Chartered password-candidate list. | 5, 6 |
| `backend/config.py` | New `burnrate_ignore_filename_regex` setting, empty by default. | 7 |

A second file, `patches/burnrate-password-reparse-preserve.patch`, was added later in commit `e7598889` ("preserve locked statements during password retries") and changes `backend/routers/statements.py`. The reparse-with-password route used to delete the statement row and commit before calling `process_statement`. It now reuses `_process_one_statement`, which keeps the original row until the reparse succeeds, passes the password through as `manual_password`, and restores the row's `file_hash` and `card_last4` before re-raising if processing fails. CardOS's unlock form (`src/components/StatementsView.tsx:23`) calls this route.

Known README gap: the README documents only `burnrate-0.5.2.patch`. It does not mention this second patch, and its only re-apply command (`patch -p0 …`) is for the first patch. This patch's paths carry `a/` and `b/` prefixes, so applying it the same way would need `-p1` instead of `-p0` (unverified; no apply command for it is documented). Its filename also carries no Burnrate version.

## Alternatives considered

The original deliberation is not recorded; these follow from the repo's constraints.

- **Work around it in CardOS.** Rejected: the defects are in Burnrate's download, deduplication and parsing, and CardOS holds no finance data to correct.
- **Configuration only.** Rejected: the 40-message cap, the file naming and the missing parser are code, not settings. Only the ignore rule fits as configuration, so it is one.
- **Fork or vendor Burnrate.** Not chosen: CardOS would then own a Python backend, while the README positions Burnrate as the finance engine installed through Homebrew.
- **Upgrade or wait for upstream.** Not relied on: whether a newer Burnrate fixes these problems is unverified. The README says to check this when the patch stops applying.

## Consequences

- `brew upgrade burnrate` replaces `libexec`, which removes the patched code and `.env.production` (README). Re-apply both patches (the README covers only the first; see the gap above), rerun `npm run gmail:setup`, restart the service. If the patch no longer applies, check whether the new Burnrate already fixes these problems.
- `npm run gmail:setup` writes only the four Gmail keys (`scripts/configure-gmail.mjs:126-131`). After an upgrade, re-add `BURNRATE_IGNORE_FILENAME_REGEX` by hand if you use it.
- Risk class HIGH: the patches change parsing, deduplication and password handling for financial statements. [AGENTS.md](../../AGENTS.md) requires the maintainer's explicit approval for work on `patches/` and keeps agents away from real statement data, so the maintainer checks re-processed results. This repo has no automated tests or CI (no test script in `package.json`, no `.github/`).
- The CardOS UI ignores the new `attachments_skipped` field: `GmailSyncResult` (`src/lib/gmail.ts:4`) does not declare it and `src/components/SettingsView.tsx:33` shows only the queued and scanned counts.
- The patched files and Burnrate's env file live in Homebrew's `libexec`, outside this repo; only the patch files are tracked here (see [CONTEXT](../CONTEXT.md#not-in-this-repo)).

## Verification

Evidence from the 2026-10-17 investigation:

- The patch was checked with `patch -p0 --dry-run -R` against the installed copy. A reverse dry run succeeds only when the installed files already contain the patch's changes.
- A pattern scan of the patch found no matches for personal identifiers.
- After re-processing, non-card documents no longer created failed rows and all unlockable card statements imported. Some statements from one issuer remain locked, pending input from the maintainer.

When this ADR was written, a re-scan of both patch files found no email addresses, home-directory paths, runs of nine or more digits, or OAuth client IDs and secrets (the only credential-like hits are code variables named `token`).

To re-check after an upgrade (assembled from the README's apply command; not run when this ADR was written): `patch -p0 -R --dry-run -d "$(brew --prefix burnrate)/libexec" < patches/burnrate-0.5.2.patch` succeeds while the patch is applied.

## Revisit when

- A Burnrate release fixes these problems, or `patch` no longer applies after `brew upgrade`.
- Upstream accepts or rejects the fixes.
- The patch set grows again. A second patch file already exists, so consider a patch series with a documented apply order, or a fork.
- The maintainer needs more issuers or parser work than a patch can reasonably carry.
