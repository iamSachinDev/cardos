# Feature Specification: Gmail Statement Sync

**Feature Branch**: `001-gmail-sync` (spec directory name only; no feature branch was created, this retroactive spec is written on `ai-os/phase-3`)

**Created**: 2026-10-18

**Status**: Accepted (2026-10-21): accepted by the maintainer as written; retroactive, documents the historical behaviour at commit e7598889. Its Gmail limits (120 days, 200 messages) predate the one-year scan now on main (see Known gap to revise below)

**Input**: User description: "Write a retroactive specification of CardOS's shipped Gmail statement sync: connecting a Gmail account, syncing statement attachments on demand, seeing sync status in the top bar, reconnecting when Google's authorization expires, and configuring the Google OAuth client with `npm run gmail:setup`. Express what CardOS needs from Burnrate, its external finance engine, as labelled requirements on that dependency."

> **How to read this retroactive spec**
>
> - It describes behaviour that already ships and proposes no change. Where the README, the code and the patches disagree, the code and patches win and the difference is listed under [Known Gaps and Discrepancies](#known-gaps-and-discrepancies).
> - **Baseline**: the code and patches at commit e7598889. Later changes are outside this baseline. The 120-day look-back window, 200-message cap, `BurnrateStatus` component and quoted top-bar copy below describe that older version; they must not be used as current ST Finance requirements. The newer committed one-year patch uses a 365-day look-back and removes the 200-message cap, and the current top bar uses `AppStatus` with separate local-data and Gmail states. Re-baselining the scenarios, requirements and traceability is a known gap to revise (the maintainer accepted the spec as written on 2026-10-21).
>
> **Known gap to revise (recorded 2026-10-21):** this Accepted spec's Gmail limits (120 days, 200 messages: FR-005, FR-034, SC-009 and related scenarios) predate the one-year scan now on main (365-day look-back, no 200-message cap). Revising them changes an Accepted spec, so it needs the maintainer's approval and a record in this spec.
> - **Labels**: `[CardOS]` requirements are met by code in this repository (`src/`, `scripts/`). `[Burnrate]` requirements are on an external dependency that CardOS does not own: behaviour the feature needs from Burnrate 0.5.2, delivered by upstream code plus two local patches. **Patch 1** is `patches/burnrate-0.5.2.patch` and **Patch 2** is `patches/burnrate-password-reparse-preserve.patch`. Where this repository shows only CardOS's side of a `[Burnrate]` requirement, the Traceability table says so.
> - **Burnrate source outside this repository**: a few facts are marked "coordinator-verified 2026-10-17, Burnrate 0.5.2 source (not in repo)". They come from a reading of the installed Burnrate source, which this repository does not contain, so they cannot be re-checked from here. They settle what FR-034, FR-041 and FR-059 say; they are readings of code, not observed behaviour, so they are not evidence.
> - **Evidence**: only what was observed on 2026-10-17/18 counts (see [Traceability](#traceability)). Everything else is marked Unverified, even where it very probably works.
> - **IDs**: `FR-###` are requirements and `SC-###` success criteria, the only two kinds of ID that the constitution (IV.2) and Spec Kit's analysis key on. FR-050 to FR-059 are the non-functional requirements: they sit under their own subheading, each is labelled (non-functional), and they carry no `[CardOS]` or `[Burnrate]` label because most span both. Once this spec is Accepted its IDs are never renumbered or reused.
> - **No real data**: every example is synthetic, and counts written as {n} or {m} are placeholders.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Connect Gmail (Priority: P1)

The user opens Settings, chooses Connect Gmail, approves read-only access at Google, and comes back to CardOS with Gmail connected. A first sync then runs by itself, so statements start arriving without another click.

**Why this priority**: Nothing else in this feature works until Gmail is connected, and this is the one step that involves Google, the user's mailbox and a credential.

**Independent Test**: With Burnrate reporting Gmail as configured but not connected, open Settings and choose Connect Gmail. To test the return handling without Google, load Settings with `?gmail=connected` (this starts a real sync), `?gmail=error` or `?gmail=error&reason=no_refresh` appended. Delivers value on its own: the user's statements begin to import.

**Acceptance Scenarios**:

1. **Given** Gmail is configured but not connected, **When** the user opens Settings, **Then** the Gmail panel is tagged "Not connected", says that read-only access is requested, and offers "Connect Gmail" but not "Sync now". (FR-001, FR-004, FR-029)
2. **Given** the same state, **When** the user chooses Connect Gmail and Burnrate returns a Google sign-in address, **Then** the control is disabled and the browser goes to Google's sign-in page, which asks only for read-only access to Gmail. (FR-006, FR-008, FR-030, FR-050)
3. **Given** the user approved access and Google issued a refresh token, **When** Google returns them to Settings with `gmail=connected`, **Then** the address bar is cleaned, "Gmail connected. Checking for statement emails…" appears, one sync starts at once, and when it finishes the panel reads "Connected", shows a last-sync time and says "Queued {n} attachments from {m} emails for processing." (FR-031, FR-009, FR-010, FR-015, FR-016, FR-002, FR-001)
4. **Given** Burnrate returns a sign-in address that is missing, malformed or not on Google's origin, **When** the user chooses Connect Gmail, **Then** the browser does not navigate, a retry message is shown and the control is usable again. (FR-007, FR-008)
5. **Given** the user denied access or Google reported an error, **When** the user is returned with `gmail=error`, **Then** "Gmail sign-in did not complete. Try again." is shown and no sync starts. (FR-012, FR-032)
6. **Given** Google granted access without offline access, **When** the user is returned with `gmail=error&reason=no_refresh`, **Then** the panel explains how to remove the app's access in the Google Account before connecting again, and no sync starts. (FR-011, FR-032)

---

### User Story 2 - Sync statements on demand (Priority: P1)

A connected user chooses Sync now (Settings) or Sync Gmail (top bar). Burnrate searches recent mail for statement attachments, saves the new ones to the watch folder and queues them for processing. CardOS reports the outcome and then shows the new statements as they are processed.

**Why this priority**: This is the feature's value: statements arrive without manual downloading, and repeating the action is safe.

**Independent Test**: With Gmail connected, choose Sync now twice in a row with no new mail in between. The first run reports the queued attachments, the second queues none of them again, and no statement appears twice.

**Acceptance Scenarios**:

1. **Given** Gmail is connected, **When** the user opens Settings, **Then** the panel is tagged "Connected", says that access is read-only, and offers both "Sync now" and "Reconnect". (FR-001, FR-005)
2. **Given** Gmail is connected, **When** the user chooses Sync now, **Then** the control is disabled and reads "Syncing…", exactly one sync request is made, and on success the panel reports "Queued {n} attachments from {m} emails for processing." (announced to assistive technology as a polite status message), the last-sync time updates and CardOS refreshes its data without a page reload. (FR-013, FR-015, FR-016, FR-002, FR-058)
3. **Given** an earlier sync saved some statements and no new mail has arrived, **When** the user syncs again, **Then** no attachment is saved or processed a second time and the earlier ones are counted as skipped rather than queued. (FR-036, FR-038, FR-040)
4. **Given** more than 200 messages match, **When** a sync runs, **Then** only the 200 most recent matching messages are scanned. (FR-034)
5. **Given** the mailbox holds non-card documents (broker, mutual-fund, loan or bank-account statements, EMI letters) or files matching the user's ignore rule, **When** a sync completes and its files are processed, **Then** no failed statement entry exists for them. (FR-043, FR-044, FR-045; a processing record may still be listed, see Known Gaps)
6. **Given** a sync is already running (for example Burnrate's own start-up sync), **When** the user starts another, **Then** the two run one after the other and produce no duplicates. (FR-039, FR-055)
7. **Given** a sync takes longer than 180 seconds, **When** the limit passes, **Then** CardOS stops waiting and says "Gmail sync did not finish. Try Sync now again.", and trying again is safe. (FR-014, FR-018, FR-055, FR-056)
8. **Given** a statement attachment saved by a sync (its name now carries Burnrate's own prefix and underscores for spaces), **When** it is processed, **Then** its issuer is identified correctly, and a Standard Chartered statement is also parsed into transactions. (FR-046, FR-047)
9. **Given** a synced PDF is password-protected and Burnrate cannot open it by itself, **When** it is processed, **Then** it appears as a protected statement that needs a password, and a later wrong password leaves it in place. (FR-048, FR-049)
10. **Given** any sync, successful or not, **When** it ends, **Then** the mailbox is unchanged: no message has been sent, labelled, moved or deleted. (FR-050)

---

### User Story 3 - See Gmail status in the top bar (Priority: P2)

On every page the top bar shows whether Gmail sync is not configured, needs connecting or is ready to sync, and offers the matching action, so the user does not have to open Settings for routine syncs.

**Why this priority**: It makes the P1 actions reachable from anywhere, but the feature works without it because Settings offers the same actions.

**Independent Test**: Serve each of the three Gmail states from the status report (a stub standing in for Burnrate is enough) and load any page: the top bar shows the matching text or button each time, and nothing before a status has been received.

**Acceptance Scenarios**:

1. **Given** Gmail is not configured, **When** any page loads, **Then** the top bar shows "Gmail auto-sync not configured" and no button. (FR-020, FR-029)
2. **Given** Gmail is configured but not connected, **When** any page loads, **Then** the top bar shows a "Connect Gmail" button, which reads "Gmail sign-in failed · Retry" if sign-in could not be started. (FR-020, FR-007, FR-029)
3. **Given** Gmail is connected, **When** any page loads, **Then** the top bar shows a "Sync Gmail" button, which is disabled while a sync runs and reads "Gmail sync failed · Retry" after a failure until the next attempt starts. (FR-020, FR-013, FR-019, FR-029)
4. **Given** Burnrate has not yet reported Gmail status, **When** a page loads, **Then** the top bar shows no Gmail element. (FR-020)
5. **Given** Gmail's state changes while a page is open (for example the connection is made in another tab), **When** the page's next refresh runs (on window focus, or within 45 seconds while no statement is processing), **Then** the top bar and Settings show the new state without a reload. (FR-021)

---

### User Story 4 - Reconnect when Google's authorization expires (Priority: P2)

While the maintainer's Google consent screen is in Testing mode, Google lets the authorization lapse after 7 days. The user is told that a reconnect is needed and restores syncing with Reconnect.

**Why this priority**: Without a clear path back, sync would stop working every 7 days while the consent screen is in Testing mode. It is P2 because sync works until the lapse and because a reconnect is the same sign-in as story 1.

**Independent Test**: Make a stub standing in for Burnrate answer a sync with HTTP 401, or with HTTP 400 and a `detail` text containing "token refresh failed" (the form Burnrate 0.5.2 uses for failures, FR-041), then choose Sync now: the panel asks for a reconnect. Choose Reconnect and the story 1 flow runs.

**Acceptance Scenarios**:

1. **Given** Google no longer accepts the stored authorization, **When** the user chooses Sync now, **Then** the panel shows "Gmail needs to be reconnected. Choose Reconnect to sign in again." (FR-017, FR-018, FR-042)
2. **Given** the panel shows "Connected", **When** the user chooses Reconnect, **Then** the same sign-in as in story 1 starts, and on return the first-sync flow runs without saving already-saved statements again. (FR-006, FR-010, FR-036)
3. **Given** the same expiry, **When** the sync is started from the top bar, **Then** the top bar shows only "Gmail sync failed · Retry"; the user reconnects from Settings. (FR-019; see Known Gaps)
4. **Given** the failure is a timeout, an unreachable Burnrate, or a Gmail error that is not an authorization failure, **When** the sync fails, **Then** a failed sync is reported to CardOS as a failure and the reconnect guidance is not shown. (FR-017, FR-041)

---

### User Story 5 - Configure the Google OAuth client (Priority: P3)

The maintainer runs `npm run gmail:setup` once, giving it the OAuth client file downloaded from Google (or typing the client ID and secret). The command stores the credentials privately for Burnrate, restarts Burnrate and confirms that Gmail now counts as configured.

**Why this priority**: It is a one-time task done by one person, but stories 1 to 4 depend on its result. They can be exercised independently against any Burnrate that already reports Gmail as configured.

**Independent Test**: Run the command with a synthetic client file, with `BURNRATE_ENV_FILE` pointing at a scratch file and `CARDOS_NO_RESTART=1`. Check that the scratch file holds exactly the four settings and that only its owner can read it. No real Burnrate files or credentials are involved (FR-054).

**Acceptance Scenarios**:

1. **Given** a downloaded "web" client file that lists the callback address, **When** the maintainer runs `npm run gmail:setup -- <file>`, **Then** Burnrate's settings file holds the four Gmail settings with owner-only permissions, Burnrate is restarted, and the command reports that Gmail is configured as soon as Burnrate's status says so, polling for up to 30 seconds after the restart. (FR-022, FR-026, FR-027, FR-028, FR-053)
2. **Given** no file argument, **When** the command runs, **Then** it asks for the client ID and the client secret, and the secret is not shown as it is typed. (FR-022, FR-052)
3. **Given** a "web" client file without the callback address, **When** the command runs, **Then** it stops, tells the maintainer to add that address and download the file again, and writes nothing. (FR-023)
4. **Given** a client ID of the wrong form or a secret that is empty or contains whitespace, **When** the command runs, **Then** it fails before writing anything. (FR-024)
5. **Given** a settings file that already holds other settings, **When** the command runs, **Then** the first existing line for each of the four names is replaced in place, names not yet present are added at the end, and every other line is unchanged. (FR-026)
6. **Given** Burnrate still does not report Gmail as configured when the 30-second polling deadline has passed, **When** the wait ends, **Then** the command fails with a message naming the status address, and the exit status is non-zero. (FR-027, FR-028, FR-056)
7. **Given** Homebrew or the Burnrate installation cannot be found and `BURNRATE_ENV_FILE` is not set, **When** the command runs, **Then** it stops with a message saying so before asking for any credentials. (FR-025)
8. **Given** any setup run, successful or failed, **When** its output is read, **Then** the client secret appears nowhere in it. (FR-052)

---

### Edge Cases

- **OAuth denied, or Google reports an error**: Burnrate returns the user to Settings with `gmail=error`. CardOS shows "Gmail sign-in did not complete. Try again.", starts no sync and leaves the Connect control usable. (FR-012, FR-032)
- **Google grants access but issues no refresh token**: Burnrate adds `reason=no_refresh`. CardOS explains that Google did not grant offline access and how to remove the app under Google Account → Security → Third-party access before connecting again. No sync starts. (FR-011, FR-032)
- **Sign-in address not on Google's origin** (or missing, malformed, or the reply unreadable): CardOS does not navigate and shows the retry message; nothing is sent to the unexpected address. (FR-006, FR-007)
- **Sync exceeds the 180-second limit**: CardOS stops waiting and reports "did not finish", never "reconnect". Burnrate may still complete the work, and running Sync again is safe because already-saved attachments are skipped and syncs run one at a time. Whether Burnrate abandons a sync when the browser stops waiting is not visible in the patches. (FR-014, FR-018, FR-036, FR-039, FR-055)
- **Concurrent syncs**: syncs can overlap (Burnrate's start-up sync, the one CardOS starts after connecting, a manual one, or one started from the top bar and one from Settings, whose busy states are independent). Burnrate runs them one at a time: the later one waits, then finds the attachments already saved and counts them as skipped. (FR-039, FR-036)
- **Already-imported statements**: a re-sync never saves or queues an attachment twice, including copies saved under older random names; identical content processed at the same moment yields a "duplicate" result instead of a second statement. After Burnrate restarts, its folder watcher no longer knows which files a sync submitted, so the start-up scan may submit a saved attachment again; a second statement is then prevented only by Burnrate's own check for identical files, which is not in the patches. (FR-036, FR-038; see Known Gaps)
- **Password-locked PDFs**: Burnrate tries its saved passwords and issuer candidate lists. If none opens the file, it appears on the Statements page as a protected statement that needs a password, and a wrong password later leaves it in place. (FR-048, FR-049)
- **Non-card documents and the ignore rule**: broker, mutual-fund, loan and bank-account documents and EMI letters, and any file matching the user's ignore pattern, are skipped without a failed statement entry, although a file that reached processing can still be listed on the Statements page as a failed import (see Known Gaps). An empty or invalid pattern ignores nothing. The pattern is searched for anywhere in the file name, ignoring case, after Burnrate's storage prefix is removed. For a Gmail attachment that name is the sanitised one: every run of characters other than ASCII letters, digits, dot, underscore and hyphen becomes one underscore and the name is cut at 120 characters, so a pattern that needs a space never matches a Gmail attachment. Ignored Gmail attachments are not downloaded and are counted neither as queued nor as skipped. (FR-043, FR-044, FR-045)
- **More than 200 matching emails**: only the 200 most recent are scanned. The older ones are not scanned; Burnrate logs a warning and CardOS shows nothing about it. (FR-034)
- **Spreadsheet attachments**: XLS and XLSX attachments are saved to the watch folder and counted as queued, but the statement processor accepts only PDF and CSV files, so they are never imported. This is a known limitation; the README's promise of XLS support is listed under Known Gaps. (FR-034)
- **Listing fails part-way, or one message fails**: when a Gmail API error stops the listing after some messages were listed, the sync keeps those, and when one message cannot be read, the sync skips it; either way the sync still completes, and the rest is picked up by the next sync. If nothing could be listed, or the listing fails with any other kind of error, the sync fails. (FR-035)
- **A write fails while saving an attachment**: no partial file is left in the watch folder. (FR-037)
- **Gmail not configured**: Settings shows "Not configured" with the setup command and no Connect or Sync action; the top bar shows "Gmail auto-sync not configured". If a sync is requested anyway, Burnrate fails it with "Gmail OAuth is not configured", sent as an HTTP 400 reply. Statement processing and the rest of CardOS keep working. (FR-003, FR-020, FR-040, FR-041, FR-057)
- **What leaves the machine**: Burnrate talks to Google (the authorization exchange and refresh, and the Gmail API) and writes the attachments to disk. CardOS receives only the Gmail status, the sign-in address and the sync result (an outcome and three counts, or an error text), and sends the browser to Google's sign-in page and nowhere else outside the local service. No Gmail feature in CardOS makes a request to any other host, and none sends analytics or telemetry. (FR-050, FR-051)
- **Gmail status unavailable**: if only the Gmail status request fails, every other dataset still loads and shows, and the connection indicator reads "Burnrate connected · Some data unavailable". Settings and the top bar keep the last Gmail state they received; if none was ever received, Settings shows the "Not configured" copy and the top bar shows no Gmail element. (FR-001, FR-020, FR-057)
- **Real data or a credential meets an artefact**: a fixture, log, screenshot or document for this feature that contains real statement data, or a client file, token or settings file that appears in the working tree, is not committed; the author stops and tells the maintainer. (FR-052, FR-054)
- **Burnrate offline or unreachable**: the top bar and Settings keep the last Gmail state they received; if none was ever received, the top bar shows no Gmail element. Connect and Sync fail with the generic retry messages, and CardOS retries its refresh every 10 to 60 seconds until Burnrate answers. If Settings has never loaded, the page shows "Settings are temporarily unavailable" instead of the Gmail panel. (FR-007, FR-018, FR-019, FR-020, FR-021, FR-057)
- **Authorization expired**: a sync from Settings asks for a reconnect; from the top bar it shows the generic failure label. (FR-017, FR-018, FR-019, FR-042)
- **Burnrate starts while connected**: it runs a sync unless one completed within the previous hour. (FR-033)
- **Setup problems**: a "web" client without the callback address, a malformed client ID or secret, an existing settings file with other lines, Burnrate not installed, Burnrate not reporting "configured" by the 30-second polling deadline, and `CARDOS_NO_RESTART=1` are all handled as described in story 5 and FR-022 to FR-028.
- **Sender-chosen file names**: names are sanitised and prefixed, so a sender cannot choose where a file is written. (FR-059)

## Requirements *(mandatory)*

### Functional Requirements

#### A. Gmail panel in Settings

- **FR-001** `[CardOS]` The Settings page MUST show a Gmail panel with exactly one status tag: "Connected" when Burnrate reports Gmail as both configured and connected, "Not connected" when it is configured but not connected, and "Not configured" in every other case, including when no status has been received.
- **FR-002** `[CardOS]` When Burnrate reports a last-sync time, the panel MUST show it as "Last Gmail sync" in Indian Standard Time (a timestamp with no time zone is read as UTC); when none is reported, that row MUST be absent.
- **FR-003** `[CardOS]` In the Not configured state the panel MUST explain that `npm run gmail:setup` adds a Google OAuth client and that statement processing and the rest of CardOS work without Gmail, and MUST NOT offer Connect, Reconnect or Sync actions.
- **FR-004** `[CardOS]` In the Not connected state the panel MUST say that read-only access is requested and that statement attachments are saved to the watch folder, and MUST offer "Connect Gmail" but not "Sync now".
- **FR-005** `[CardOS]` In the Connected state the panel MUST say that access is read-only and that Burnrate checks the last 120 days of mail when it starts, and MUST offer both "Sync now" and "Reconnect".

#### B. Sign-in and return

- **FR-006** `[CardOS]` Choosing "Connect Gmail" or "Reconnect" in Settings, or "Connect Gmail" in the top bar, MUST ask Burnrate to start Google sign-in and, when the address it returns is on the origin `https://accounts.google.com`, MUST send the browser to that address.
- **FR-007** `[CardOS]` If sign-in cannot be started (Burnrate unreachable, an error reply, an unreadable reply, or a sign-in address that is missing, malformed or on any other origin), CardOS MUST NOT navigate and MUST show a retry message: "Burnrate could not start Gmail sign-in. Try again." in Settings, "Gmail sign-in failed · Retry" in the top bar.
- **FR-008** `[CardOS]` While sign-in is being started, the Gmail buttons in the same place (the Settings panel or the top bar) MUST be disabled; if sign-in could not be started, they MUST become usable again.
- **FR-009** `[CardOS]` When Settings loads with a non-empty `gmail` parameter in its address, CardOS MUST replace the address with the bare Settings path, dropping the whole query, without adding a history entry, so that reloading does not repeat the outcome handling.
- **FR-010** `[CardOS]` When the return outcome is `gmail=connected`, CardOS MUST show "Gmail connected. Checking for statement emails…" and start exactly one sync immediately, without another click.
- **FR-011** `[CardOS]` When the return outcome is anything other than `connected` and the address also carries `reason=no_refresh` (Burnrate sends it with `gmail=error`, FR-032), CardOS MUST tell the user that Google did not grant offline access and that the app must be removed under Google Account → Security → Third-party access before connecting again, and MUST NOT start a sync.
- **FR-012** `[CardOS]` For any other return outcome (any other value of `gmail`, without `reason=no_refresh`), CardOS MUST show "Gmail sign-in did not complete. Try again." in the Gmail panel and MUST NOT start a sync.

#### C. Syncing

- **FR-013** `[CardOS]` "Sync now" (Settings) and "Sync Gmail" (top bar), each offered only when Gmail is connected, MUST send one sync request to Burnrate per activation and stay disabled until it ends; meanwhile the Settings button MUST read "Syncing…" and the panel MUST show "Checking Gmail for statements…".
- **FR-014** `[CardOS]` CardOS MUST wait up to 180 seconds for a sync to answer (a write action waits 20 seconds by default); after that it MUST stop waiting and treat the sync as not finished. The data refresh that follows a successful sync (FR-016) is bounded separately: each read waits up to 8 seconds for Burnrate to answer.
- **FR-015** `[CardOS]` After a successful sync started from Settings, including the first sync after connecting, the panel MUST show "Queued {n} attachments from {m} emails for processing.", using 0 for any count Burnrate did not return. A sync started from the top bar shows no result message.
- **FR-016** `[CardOS]` After a sync, or any other write that CardOS sends through its shared write path, succeeds, CardOS MUST refresh its live data (Gmail status and statements included) without a page reload, before it reports the result. Starting sign-in does not go through that path and triggers no refresh.
- **FR-017** `[CardOS]` CardOS MUST classify a failed sync as "needs reconnect" only when Burnrate answered with HTTP status 401, or with a `detail` text that contains, ignoring case, one of: "token refresh failed", "reconnect gmail", "gmail is not connected", "invalid encrypted token", "invalid_grant", "invalid authentication credentials". Every other failure, including a timeout or an unreachable Burnrate, MUST be classified as "did not finish".
- **FR-018** `[CardOS]` For a failed sync started from Settings, the panel MUST show "Gmail needs to be reconnected. Choose Reconnect to sign in again." for "needs reconnect" and "Gmail sync did not finish. Try Sync now again." for "did not finish".
- **FR-019** `[CardOS]` For a failed sync started from the top bar, the control MUST read "Gmail sync failed · Retry" until the next attempt starts. The top bar does not distinguish "needs reconnect" from other failures.

#### D. Top bar

- **FR-020** `[CardOS]` Once Burnrate has reported Gmail status, the top bar on every page MUST show: the text "Gmail auto-sync not configured" when not configured; a "Connect Gmail" button when configured but not connected; a "Sync Gmail" button when connected. Until a status has been received it MUST show no Gmail element.
- **FR-021** `[CardOS]` CardOS MUST fetch Gmail status together with its other core Burnrate data: at page load, on window focus or when the tab becomes visible again, every 45 seconds while the page is visible (every 10 to 60 seconds after failures) and after every successful write, so the top bar and Settings agree without a reload. While a statement is processing, the 5-second statement check postpones the 45-second refresh, and a change it detects triggers a full refresh instead.

#### E. Setup command

- **FR-022** `[CardOS]` `npm run gmail:setup` MUST take the Google OAuth client from the JSON file named as its argument (a "web" or an "installed" client file) or, when no file is given, prompt for the client ID and client secret, hiding the secret as it is typed.
- **FR-023** `[CardOS]` For a "web" client file whose redirect addresses do not include `http://127.0.0.1:8000/api/gmail/oauth/callback`, setup MUST stop and tell the maintainer to add that address, download the file again and rerun.
- **FR-024** `[CardOS]` Before writing anything, setup MUST reject a client ID that is not of the form `<name>.apps.googleusercontent.com` and a client secret that is empty or contains whitespace.
- **FR-025** `[CardOS]` Setup MUST write to the file named by `BURNRATE_ENV_FILE` when that is set, and otherwise to `libexec/.env.production` under the Homebrew installation of Burnrate; if Homebrew or that installation cannot be found, it MUST stop with a message saying so, before asking for any credentials.
- **FR-026** `[CardOS]` Setup MUST set exactly four settings in that file: the client ID (`GOOGLE_OAUTH_CLIENT_ID`), the client secret (`GOOGLE_OAUTH_CLIENT_SECRET`), and the success and error return addresses `http://127.0.0.1:4321/settings?gmail=connected` (`GMAIL_OAUTH_SUCCESS_REDIRECT`) and `http://127.0.0.1:4321/settings?gmail=error` (`GMAIL_OAUTH_ERROR_REDIRECT`). For each name, the first line that sets it (a line that, ignoring surrounding spaces, starts with the name and `=`) MUST be replaced in place, and a name with no such line is added at the end; every other line, including a later line for the same name, MUST be left as it was.
- **FR-027** `[CardOS]` Unless `CARDOS_NO_RESTART=1` is set, setup MUST restart the Burnrate service and then poll Burnrate's status until it reports Gmail as configured, with a 30-second deadline (each status check is limited to 2.5 seconds, one last check follows the deadline, and every command setup runs is stopped after 30 seconds). If Gmail is still not reported as configured, setup MUST fail with a message that names the status address and includes the restart command's output, or a pointer to the service logs when there is none.
- **FR-028** `[CardOS]` When Burnrate reports Gmail as configured, setup MUST print "Open http://127.0.0.1:4321/settings and choose Connect Gmail." and exit with status 0. On any failure it MUST print an error beginning with "✗" and exit with a non-zero status. With `CARDOS_NO_RESTART=1` it exits with status 0 right after saving.

#### F. Burnrate (external dependency)

These are requirements on a dependency CardOS does not own. CardOS cannot enforce them; today they hold because of upstream Burnrate 0.5.2 plus Patch 1 and Patch 2. The interface CardOS depends on is:

| Interface | Request from CardOS | CardOS expects |
|---|---|---|
| Status | `GET /api/gmail/status` | `configured` and `connected` (true or false) and `last_sync` (a timestamp, or null) |
| Start sign-in | `POST /api/gmail/auth/start` | `auth_url`: a Google consent address |
| Sync | `POST /api/gmail/sync` | On success, `status`, `messages_scanned`, `attachments_queued` and `attachments_skipped`; on failure, a non-success response, optionally with a text `detail` (Burnrate 0.5.2 sends HTTP 400 with the error message, FR-041) |
| Return | A browser redirect from Burnrate's OAuth callback, registered with Google as `http://127.0.0.1:8000/api/gmail/oauth/callback` | CardOS Settings opened with `gmail=connected`, or `gmail=error` and optionally a `reason` |

- **FR-029** `[Burnrate]` Burnrate's status report MUST give `configured` as true only when a Google OAuth client is set in its configuration, `connected` as true only when an authorization is stored, and `last_sync` as the time the last sync completed, or null if none has.
- **FR-030** `[Burnrate]` Starting sign-in MUST return a Google consent address for the configured OAuth client that asks for offline access limited to the read-only Gmail permission.
- **FR-031** `[Burnrate]` When the user approves access and Google issues a refresh token, Burnrate MUST store the authorization, so that its status reports connected, and MUST redirect the browser to its configured success address.
- **FR-032** `[Burnrate]` When the user denies access, Google reports an error, or Google issues no refresh token, Burnrate MUST redirect the browser to its configured error address, adding `reason=no_refresh` in the no-refresh-token case.
- **FR-033** `[Burnrate]` Each time the Burnrate service starts while connected, it MUST run a sync unless one completed within the previous hour.
- **FR-034** `[Burnrate]` A sync MUST consider only messages that match Burnrate's statement search: newer than 120 days, with an attachment named like a PDF, CSV, XLSX or XLS file (Patch 1 does not show the search's remaining terms). It MUST list them newest first, in pages of at most 100, and scan at most 200 messages per sync; older matches are not scanned and Burnrate writes a warning to its log. Of a scanned message's attachments it MUST save only those whose names end in `.pdf`, `.csv`, `.xls` or `.xlsx`, ignoring case (coordinator-verified 2026-10-17, Burnrate 0.5.2 source (not in repo)). Known limitation of this behaviour: the statement processor accepts only `.pdf` and `.csv` files (Patch 1 context), so XLS and XLSX attachments are saved to the watch folder, handed to processing and counted as queued, but never imported. What processing reports for them, and how the folder watcher treats them, is unverified (G-4).
- **FR-035** `[Burnrate]` If a Gmail API error interrupts the listing after at least one message has been listed, the sync MUST continue with those messages; if listing fails before any message was listed, or fails with any other kind of error, the sync MUST end with an error; if one message cannot be read, the sync MUST skip that message and continue.
- **FR-036** `[Burnrate]` Each saved attachment MUST get a name determined by its message, part and file name, not a random one; an attachment whose file is already in the folder under that name, or under an earlier-version name for the same message and file name, MUST NOT be downloaded or queued again and MUST be counted as skipped.
- **FR-037** `[Burnrate]` A saved attachment MUST appear under its final name in the watch folder only once completely written; if writing fails, no partial file remains.
- **FR-038** `[Burnrate]` Each attachment saved by a sync MUST be processed exactly once while that Burnrate process runs: the sync submits it itself and the folder watcher MUST leave it alone; the watcher's start-up scan MUST submit only one file per distinct content (a file it cannot read is submitted without that check); and a file whose identical content is already being processed MUST produce a "duplicate" result instead of a second statement. The watcher's record of the files a sync submitted is kept in memory only, so after a restart its start-up scan may submit a saved attachment again, and only Burnrate's upstream check for identical files then prevents a second statement (G-16).
- **FR-039** `[Burnrate]` Syncs MUST run one at a time: a sync requested while another is running MUST wait for it to finish and then run.
- **FR-040** `[Burnrate]` A completed sync MUST answer with status "ok" and the counts `messages_scanned` (messages listed), `attachments_queued` (new attachments queued) and `attachments_skipped` (attachments already saved), and MUST record its completion as the new last-sync time. When no OAuth client is configured the sync MUST fail with the message "Gmail OAuth is not configured".
- **FR-041** `[Burnrate]` A sync that fails MUST be reported to CardOS as a non-success response, with the reason as text where one exists. Burnrate 0.5.2's sync route does this: it answers every sync that ends with status "error" with HTTP 400 and the error message as `detail` (coordinator-verified 2026-10-17, Burnrate 0.5.2 source (not in repo)), so CardOS is right to treat any success response as a completed sync. The route also always forces the sync, so the hourly limit of FR-033 never skips a sync that CardOS requests.
- **FR-042** `[Burnrate]` When Google no longer accepts the stored authorization, a failed sync MUST be reported with HTTP status 401 or an error text containing one of the phrases listed in FR-017. Because the sync route answers an error result with HTTP 400 (FR-041), in practice this rests on the error text. Coordinator-verified 2026-10-17, Burnrate 0.5.2 source (not in repo): when the stored authorization cannot be refreshed, the sync's error message is "Token refresh failed; reconnect Gmail.", and with no stored authorization it is "Gmail is not connected"; both contain FR-017 phrases. Messages for other failure paths (for example a Gmail API error after a revocation) were not checked.
- **FR-043** `[Burnrate]` A file whose name, without Burnrate's storage prefix, contains a match for the pattern in the `BURNRATE_IGNORE_FILENAME_REGEX` setting (a regular-expression search, ignoring case; for a Gmail attachment the name searched is its sanitised name) MUST NOT be downloaded, queued or counted when it comes from Gmail, and MUST be skipped, with an error result whose message is "Ignored by filename rule", when it reaches processing by any route; an empty or invalid pattern MUST ignore nothing.
- **FR-044** `[Burnrate]` A PDF that is clearly not a credit card statement (a broker or depository statement, mutual fund statement, loan or EMI schedule, bank account statement, or an EMI or loan booking letter) MUST be skipped without creating a failed statement entry. A PDF counts as such only when its first page shows positive evidence of another document type and none of the card-statement markers (for EMI letters: no statement summary).
- **FR-045** `[Burnrate]` A file whose card issuer cannot be identified MUST be skipped without creating a failed statement entry.
- **FR-046** `[Burnrate]` Issuer detection MUST work for Gmail-saved files: Burnrate's own storage prefix MUST be ignored and underscores treated as spaces; a stored issuer of "unknown" MUST be treated as no issuer; and when a password list opens a PDF of unknown issuer, the issuer MUST be detected from the unlocked content, not taken from the list that matched.
- **FR-047** `[Burnrate]` Burnrate MUST recognise Standard Chartered credit card statements by file name and by content (ahead of other issuer names that appear in the text) and MUST parse their statement period and transactions.
- **FR-048** `[Burnrate]` A synced PDF that is password-protected MUST be tried against Burnrate's saved passwords and issuer-specific candidate lists, the known issuer's list first and the other issuers' lists after it, keeping the known issuer's label; if none opens it, a statement entry in the "password needed" state MUST be created.
- **FR-049** `[Burnrate]` Retrying a locked statement with a password MUST keep the original statement entry until the retry succeeds; a wrong password or a parse failure MUST leave the entry locked and retryable (its content hash and card identifier restored) and MUST NOT delete it.

### Non-functional requirements

These describe qualities that cut across the stories. They continue the `FR-###` numbering, and each is labelled (non-functional).

- **FR-050** (non-functional) *Read-only access.* The feature MUST request and use only the read-only Gmail permission (`gmail.readonly`) and MUST NOT send, change, label or delete mail.
- **FR-051** (non-functional) *Local only.* The CardOS web app MUST call only the local Burnrate service, through relative `/api` paths (the setup command calls Burnrate's status address on the loopback address directly); the only other place it sends the browser is Google's sign-in page, after the origin check. It MUST NOT add analytics, telemetry or third-party requests, and MUST keep Gmail status and sync results in memory only (the theme preference is the only thing the browser stores).
- **FR-052** (non-functional) *No secrets in the repository.* The repository MUST contain no OAuth client ID, client secret, token, downloaded client file or environment file with values (the tracked `.env.example` holds only comments). Setup MUST store the secret only in Burnrate's private settings file, MUST NOT print it and MUST hide it while it is typed; the downloaded client file, which also holds the secret, stays wherever the maintainer saved it, outside the repository.
- **FR-053** (non-functional) *Private settings file.* After every setup run that saves the client, the settings file MUST be readable and writable by its owner only (mode 600), including when the file already existed with other permissions. A run that fails before saving leaves the file as it was.
- **FR-054** (non-functional) *No real data.* Artefacts committed for this feature (this spec, logs, fixtures, tests, evaluation data, screenshots) MUST NOT contain real statement data (file names, amounts, card, account or reference numbers, merchants), personal data or credentials; examples and fixtures MUST be synthetic.
- **FR-055** (non-functional) *Safe to repeat.* Repeating a sync, including after a timeout or a failure, MUST NOT create duplicate files or duplicate statement entries.
- **FR-056** (non-functional) *Bounded waiting.* The wait for a sync MUST be bounded at 180 seconds, and setup's polling for Burnrate to report Gmail as configured MUST end at a 30-second deadline, with each status check limited to 2.5 seconds.
- **FR-057** (non-functional) *Failure isolation.* A failure of a Gmail action (starting sign-in or a sync) MUST show only in the Gmail controls and panel, and a failure of the Gmail status request MUST NOT stop any other data from loading or showing.
- **FR-058** (non-functional) *Accessible messages.* Sign-in and sync outcome messages in the Settings panel MUST be exposed to assistive technology as polite status announcements.
- **FR-059** (non-functional) *Untrusted attachments.* Attachments MUST be treated as untrusted input: only allow-listed file types are saved (`.pdf`, `.csv`, `.xls` and `.xlsx`; coordinator-verified 2026-10-17, Burnrate 0.5.2 source (not in repo)), and the saved name is built from sanitised characters behind a fixed prefix, so a sender cannot choose where a file is written.

### Key Entities *(include if feature involves data)*

- **Gmail connection**: the link between Burnrate and one Gmail account. It has a state (not configured, not connected or connected) and the time of the last completed sync.
- **Google OAuth client**: the maintainer's own client ID and secret registered with Google. Setup stores it only in Burnrate's private settings file; the downloaded client file stays where the maintainer saved it. It is never in this repository.
- **Sync run**: one pass over recent mail. It ends either ok, with three counts (messages scanned, attachments queued and attachments skipped), or with an error and its message.
- **Statement attachment**: a file taken from an email and saved to the watch folder under a name derived from its message, part and file name. An attachment already saved is skipped on later runs.
- **Statement entry**: a statement row that Burnrate creates when it processes an attachment, for example parsed (with transactions) or password needed (locked and retryable). A duplicate, ignored, non-card or unidentified file creates no entry.
- **Processing record**: Burnrate's record of one processing result, a status and a message, kept separately from statement entries. CardOS lists every record that is not a success under the Statements page's import activity.
- **Ignore rule**: an optional pattern in Burnrate's settings that names attachments to skip.
- **Return outcome**: the result of the Google sign-in (`connected`, or `error` with an optional reason) carried back to Settings.

## Success Criteria *(mandatory)*

### Measurable Outcomes

These are targets, not results. Only SC-002 and SC-004 have a recorded observation, and each observation covers only part of its criterion (see [Traceability](#traceability)); the rest, SC-001 included, are unmeasured.

- **SC-001**: A user who has completed setup goes from "Not connected" to a finished first sync with one deliberate action in CardOS (choosing Connect Gmail) plus approval at Google; no further action is needed to start the first sync.
- **SC-002**: Syncing twice in a row with no new mail adds zero saved copies and zero statement entries on the second run.
- **SC-003**: No sync leaves the user waiting more than 3 minutes: every attempt ends with a result or an explicit "did not finish" message.
- **SC-004**: For a mailbox that contains broker, mutual-fund, loan, bank-account or EMI-letter documents, or files matching the ignore rule, zero failed statement entries are created for them across a sync and its processing.
- **SC-005**: When Google's authorization has expired, 100% of the failed syncs caused by it that were started from Settings tell the user to reconnect, and the user can restore syncing in two actions (choose Reconnect, approve at Google).
- **SC-006**: On a working installation, setup reports that Gmail is configured within 60 seconds of starting, and every failed run ends with a message that names the problem.
- **SC-007**: After any setup run that saves the client, the credentials file is accessible to its owner only (100% of such runs), and a secret scan of the repository finds zero credentials.
- **SC-008**: A wrong password entered for a locked statement leaves 100% of such statements present and retryable.
- **SC-009**: When 200 or fewer emails match, 100% of them are scanned in a single sync; when more match, exactly the 200 most recent are.
- **SC-010**: With Gmail not configured, not connected or failing, every other page keeps loading and showing its data; when Burnrate is unreachable, every page keeps its last data and refreshes within 60 seconds of Burnrate answering again.

## Assumptions

- **One user, one machine**: a single maintainer on one Mac, with Burnrate installed through Homebrew and listening on `127.0.0.1:8000`, and CardOS on `127.0.0.1:4321`. These addresses are written in several files, and setup stores the CardOS return address `http://127.0.0.1:4321/settings`.
- **Patched Burnrate 0.5.2**: both patches are applied. The behaviour of an unpatched or newer Burnrate is out of scope. `brew upgrade` removes the patches and Burnrate's settings file, and the README's re-apply steps cover only Patch 1.
- **Google side**: the maintainer owns a Google Cloud project with the Gmail API enabled, an OAuth client of type Web application (setup also accepts a Desktop client file), and a consent screen with the read-only Gmail scope that lists the maintainer's own Gmail address as a test user. Google's 7-day expiry of authorizations in Testing mode comes from the README and Google's published policy; this spec did not re-verify it.
- **One Gmail account**: the status report describes a single connection and Burnrate stores a single Google credential. The storage detail is the maintainer's statement and is not visible in the patches.
- **Burnrate's web layer is not in this repository**: the status route, sign-in start, OAuth callback, start-up sync trigger and the code that turns a failed sync into a response are not in the patches. FR-029 to FR-033, FR-041 and FR-042 therefore rest on the CardOS code that consumes them, on the README and, for FR-041, on a reading of the installed source (coordinator-verified 2026-10-17, Burnrate 0.5.2 source (not in repo)). Only what the connect-and-first-sync observation (EV-1) exercised is credited to FR-029 to FR-031; the others are Unverified.
- **Authorization expiry keeps the connection state**: the Reconnect button is shown only in the Connected state, which implies that Burnrate keeps reporting `connected` after Google stops accepting the authorization. This is unverified. If it reported not connected instead, the controls would read "Connect Gmail" and still start the same sign-in.
- **Synced files use the normal pipeline**: an attachment is processed like a file dropped into the watch folder. The Statements page and its password form are a separate feature; this spec covers only how a Gmail sync interacts with them (FR-048, FR-049).
- **Operator**: only the maintainer runs `npm run gmail:setup`; AI agents never do (`AGENTS.md`, sections 2 and 7).
- **Time zone**: all timestamps CardOS displays are in Indian Standard Time.

## Out of Scope

- **More than one Gmail account**: Burnrate stores one credential and the status report describes one connection.
- **Disconnecting or revoking from CardOS**: there is no Disconnect action. Reconnect repeats the sign-in; access is revoked at the Google Account.
- **Changing mail**: sending, labelling, moving or deleting mail (see FR-050), and mail providers other than Gmail.
- **Choosing what is searched**: the look-back window, the 200-message cap, the attachment types and the Gmail query are fixed by Burnrate; CardOS offers no control over them.
- **An interface for the ignore rule**: the pattern lives only in Burnrate's settings file, which setup leaves untouched apart from the four Gmail settings (ADR 0001 notes that it must be re-added by hand after a Burnrate upgrade).
- **Showing per-attachment results**: CardOS does not display the skipped count or which attachments were queued (see Known Gaps).
- **Sync scheduling**: Burnrate decides when it syncs on its own; CardOS triggers only the syncs the user asks for and the one that follows connecting.
- **Google Cloud set-up automation**: creating the project, enabling the API, publishing the consent screen or registering test users.
- **Statement parsing in general**: parser accuracy for each issuer, the Statements page and its password form, apart from the interactions in FR-048 and FR-049.
- **Re-applying patches after a Burnrate upgrade**: this is a manual procedure in the README.
- **Hosted, multi-user or mobile use**, and **automated tests** (planned for Phase 9; see Traceability).

## Traceability

CardOS requires every requirement to be traceable from specification to code, evidence and test (capability 3 of the AI-engineering roadmap). Evidence is only what was observed on 2026-10-17/18, described generically; raw output is not stored in this repository because it would contain real data.

### Evidence observed

| ID | What was run or inspected | When | Result | Record |
|---|---|---|---|---|
| EV-1 | Manual inspection of a local run: connect Gmail, then the first sync | 2026-10-17/18 | Gmail connected; the first sync succeeded | Recorded here; raw output not kept (it carries real data) |
| EV-2 | Manual inspection of a local run: a second sync after an earlier one | 2026-10-17/18 | Attachments already saved were skipped | Recorded here; raw output not kept |
| EV-3 | Manual inspection of a local run: processing the mailbox's non-card documents after the filename ignore rule was in place | 2026-10-17/18 | No failed statement entries for non-card documents | Recorded here; ADR 0001 (Verification) records the same finding for the patch as a whole |
| EV-4 | `npm run check` and `npx tsc --noEmit` | 2026-10-18 | `npm run check`: 33 files, 0 errors; `npx tsc --noEmit`: exit 0 | `docs/ai-engineering/PHASE-STATUS.md` (P2-C1) |

How evidence is credited:

- An observation is credited to a requirement only when it could not have succeeded unless that behaviour worked. `(partial: …)` names what the observation does not cover. **Unverified** means no observation covers the requirement, even if it very probably works.
- EV-4 is static only. It covers the type contracts of the TypeScript and Astro files under `src/` (including the shapes CardOS declares for Gmail status and sync results) and says nothing about behaviour, `scripts/` or Burnrate. It applies to every row below that cites a file under `src/`, and is not repeated in each row. The check ran on the Phase 2 branch, whose application code is identical to commit e7598889 (the Phase 2 commit changed documentation files only).
- The Gmail evidence (EV-1 to EV-3) comes from one local setup. EV-1 does not record how the connection was started or which control started the first sync, so it is credited to neither FR-006 nor FR-010, and it does not measure SC-001.
- A successful first sync (EV-1) would also have succeeded without FR-034's paging, cap and search terms, and without FR-037's atomic write, so neither requirement is credited to it.
- EV-3 shows the combined result of FR-043, FR-044 and FR-045 for one mailbox. It does not record which of them skipped each document, so none of the three was necessary for it on its own: EV-3 is credited to SC-004 (in part) and to no requirement.
- Facts marked "coordinator-verified 2026-10-17, Burnrate 0.5.2 source (not in repo)" (FR-034, FR-041, FR-059) come from a reading of the installed Burnrate source. They are cited under implementing code, not as evidence, and those rows stay Unverified.

### Requirement to code, evidence and test

Conventions: CardOS files are `SettingsView.tsx`, `BurnrateStatus.tsx` and `StatementsView.tsx` (in `src/components/`), `gmail.ts`, `live.ts` and `api.ts` (in `src/lib/`), `AppShell.astro` (in `src/layouts/`), `configure-gmail.mjs` (in `scripts/`), and `astro.config.mjs` and `.gitignore` at the repository root. "P1" and "P2" are Patch 1 and Patch 2; their file paths are relative to Burnrate's `libexec/backend/` folder, and "(context)" marks a line that is shown only as unchanged context in the patch. "Upstream" means the behaviour is in Burnrate itself and not in this repository.

**Task link**: Open for every row. No `tasks.md` exists for this retroactive spec, and the constitution (IV.4) wants a missing link shown as open, not omitted. **Status of every row**: Implemented but unverified (the PHASE-STATUS vocabulary). The code exists (for the 7 rows whose Burnrate-side code is outside this repository, the CardOS side exists and the Burnrate side is unverified), and no complete recorded check covers the requirement; partial evidence is noted per row.

| ID | Task | Implementing code | Verification evidence | Test |
|---|---|---|---|---|
| FR-001 | Open | `SettingsView.tsx`: `gmailConnected`, status tag | Unverified | None yet (Phase 9) |
| FR-002 | Open | `SettingsView.tsx`: "Last Gmail sync" row; `api.ts`: `formatDateTime`, `parseIstDate` | Unverified | None yet (Phase 9) |
| FR-003 | Open | `SettingsView.tsx`: not-configured copy; `gmail?.configured` gate on the action row | Unverified | None yet (Phase 9) |
| FR-004 | Open | `SettingsView.tsx`: not-connected copy, Connect button, Sync button only when connected | Unverified | None yet (Phase 9) |
| FR-005 | Open | `SettingsView.tsx`: connected copy, "Sync now" and "Reconnect" buttons | Unverified | None yet (Phase 9) |
| FR-006 | Open | `gmail.ts`: `connectGmail` (POST, origin check, `window.location.assign`); `SettingsView.tsx`: `startGmailConnect`; `BurnrateStatus.tsx`: connect handler | Unverified (EV-1 does not record how sign-in was started) | None yet (Phase 9) |
| FR-007 | Open | `gmail.ts`: `connectGmail` (throws on request failure, unreadable reply, missing, malformed or foreign address); catch blocks in `startGmailConnect` and the `BurnrateStatus.tsx` handler | Unverified | None yet (Phase 9) |
| FR-008 | Open | `SettingsView.tsx`: `gmailBusy` in `startGmailConnect`; `BurnrateStatus.tsx`: `gmailBusy` | Unverified | None yet (Phase 9) |
| FR-009 | Open | `SettingsView.tsx`: return-handling `useEffect` (`history.replaceState`) | Unverified | None yet (Phase 9) |
| FR-010 | Open | `SettingsView.tsx`: return-handling `useEffect` calling `runGmailSync` | Unverified (EV-1 does not record what started the first sync) | None yet (Phase 9) |
| FR-011 | Open | `SettingsView.tsx`: return-handling `useEffect`, `reason` check | Unverified | None yet (Phase 9) |
| FR-012 | Open | `SettingsView.tsx`: return-handling `useEffect`, other outcomes | Unverified | None yet (Phase 9) |
| FR-013 | Open | `SettingsView.tsx`: `runGmailSync`, "Sync now"; `BurnrateStatus.tsx`: Sync Gmail handler; `gmail.ts`: `syncGmail` | Unverified | None yet (Phase 9) |
| FR-014 | Open | `gmail.ts`: `syncGmail` (`timeoutMs: 180_000`); `live.ts`: `apiMutate` (`AbortController`, 20 s default) | Unverified | None yet (Phase 9) |
| FR-015 | Open | `SettingsView.tsx`: `runGmailSync` success message; `BurnrateStatus.tsx` shows none | Unverified | None yet (Phase 9) |
| FR-016 | Open | `live.ts`: `apiMutate` then `refreshAll('mutation')`; the `refreshAll` path list includes `endpoints.gmail` | Unverified | None yet (Phase 9) |
| FR-017 | Open | `gmail.ts`: `gmailNeedsReconnect`; `live.ts`: `ApiMutationError`, `apiMutate` | Unverified | None yet (Phase 9) |
| FR-018 | Open | `SettingsView.tsx`: `runGmailSync` catch block | Unverified | None yet (Phase 9) |
| FR-019 | Open | `BurnrateStatus.tsx`: `gmailError` state and button label | Unverified | None yet (Phase 9) |
| FR-020 | Open | `BurnrateStatus.tsx`: Gmail block (`gmail-status`) | Unverified | None yet (Phase 9) |
| FR-021 | Open | `live.ts`: `refreshAll`, `schedule`, `startLiveSync`, `endpoints.gmail`; `refreshStatements` (its `schedule()` call re-arms the 45 s timer) | Unverified | None yet (Phase 9) |
| FR-022 | Open | `configure-gmail.mjs`: `readClient`, `readClientFile`, `promptForClient` | Unverified | None yet (Phase 9) |
| FR-023 | Open | `configure-gmail.mjs`: `readClientFile` (callback address check) | Unverified | None yet (Phase 9) |
| FR-024 | Open | `configure-gmail.mjs`: `main` (client ID and secret checks before `writeEnv`) | Unverified | None yet (Phase 9) |
| FR-025 | Open | `configure-gmail.mjs`: `envFilePath`, `findBrew`, `main` (path resolved before `readClient`) | Unverified | None yet (Phase 9) |
| FR-026 | Open | `configure-gmail.mjs`: `writeEnv` (first matching line replaced, missing names added), `main` (`GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`, `GMAIL_OAUTH_SUCCESS_REDIRECT`, `GMAIL_OAUTH_ERROR_REDIRECT`) | Unverified | None yet (Phase 9) |
| FR-027 | Open | `configure-gmail.mjs`: `main` (restart, 30 s polling deadline, final check), `gmailConfigured` (2.5 s per check), `run` (30 s limit per command) | Unverified | None yet (Phase 9) |
| FR-028 | Open | `configure-gmail.mjs`: `main` (messages), `main().catch` (exit status) | Unverified | None yet (Phase 9) |
| FR-029 | Open | Upstream status route (not in this repository). P1 `services/gmail_sync.py`: `_run_gmail_sync` (OAuth-client check, `last_gmail_sync` update; context). CardOS side: `gmail.ts` `GmailStatus` | EV-1 (partial: configured and connected were reported as true once connected; the false cases and the last-sync value were not recorded) | None yet (Phase 9) |
| FR-030 | Open | Upstream sign-in start (not in this repository). P1 `services/gmail_sync.py`: `GMAIL_READONLY` (context). CardOS side: `gmail.ts` `connectGmail` | EV-1 (partial: a working Google address was returned; the requested scopes were not recorded) | None yet (Phase 9) |
| FR-031 | Open | Upstream OAuth callback (not in this repository). CardOS side: `configure-gmail.mjs` writes `GMAIL_OAUTH_SUCCESS_REDIRECT`; `SettingsView.tsx` return handling | EV-1 (partial: the authorization was stored; the redirect target was not recorded) | None yet (Phase 9) |
| FR-032 | Open | Upstream OAuth callback (not in this repository). CardOS side: `configure-gmail.mjs` writes `GMAIL_OAUTH_ERROR_REDIRECT`; `SettingsView.tsx` `reason` handling | Unverified | None yet (Phase 9) |
| FR-033 | Open | Upstream start-up hook (not in this repository); README, Gmail sync section. P1 `services/gmail_sync.py`: `MIN_AUTO_SYNC_SECONDS`, `force` (context) | Unverified | None yet (Phase 9) |
| FR-034 | Open | P1 `services/gmail_sync.py`: `_GMAIL_QUERY` (context), `MAX_MESSAGES_PER_SYNC`, `_LIST_PAGE_SIZE`, `_list_message_ids`; `_save_attachments_for_message` (the `_ALLOWED_EXT` check, context at patch line 506; its values coordinator-verified 2026-10-17, Burnrate 0.5.2 source (not in repo)); `services/statement_processor.py`: `ALLOWED_EXTENSIONS = {".pdf", ".csv"}` (context, patch line 664) | Unverified (EV-1 does not depend on the search terms, the paging or the cap) | None yet (Phase 9) |
| FR-035 | Open | P1 `services/gmail_sync.py`: `_list_message_ids` (error handling), `_run_gmail_sync` (per-message handlers) | Unverified | None yet (Phase 9) |
| FR-036 | Open | P1 `services/gmail_sync.py`: `_attachment_filename`, `_already_saved`, `_save_attachments_for_message` | EV-2 (partial: matching of older names and the skipped count were not recorded) | None yet (Phase 9) |
| FR-037 | Open | P1 `services/gmail_sync.py`: `_write_atomically`; `services/folder_watcher.py`: `claim_path`, `release_path` | Unverified (a successful sync does not show that writes are atomic) | None yet (Phase 9) |
| FR-038 | Open | P1 `services/folder_watcher.py`: `claim_path`, `_is_claimed`, `_enqueue_file`, start-up scan hashing (the claims in `_claimed_paths` are in memory only, G-16); `services/gmail_sync.py`: `_save_attachments_for_message`; `services/statement_processor.py`: `_inflight_hashes` | Unverified | None yet (Phase 9) |
| FR-039 | Open | P1 `services/gmail_sync.py`: `_sync_lock`, `run_gmail_sync` | Unverified | None yet (Phase 9) |
| FR-040 | Open | P1 `services/gmail_sync.py`: `_run_gmail_sync` (result, not-configured error, `last_gmail_sync`). CardOS side: `gmail.ts` `GmailSyncResult` | EV-1 (partial: status "ok" on the first sync; the counts were not recorded) | None yet (Phase 9) |
| FR-041 | Open | Upstream sync route (not in this repository): HTTP 400 with the error message as `detail` for an error result, and an always-forced sync (coordinator-verified 2026-10-17, Burnrate 0.5.2 source (not in repo)). P1 `services/gmail_sync.py`: `_run_gmail_sync` (error results with status "error"). CardOS side: `live.ts` `apiMutate` (a non-success reply becomes `ApiMutationError`) | Unverified | None yet (Phase 9) |
| FR-042 | Open | Upstream web layer and token handling (not in this repository). CardOS side: `gmail.ts` `gmailNeedsReconnect` | Unverified | None yet (Phase 9) |
| FR-043 | Open | P1 `config.py`: `burnrate_ignore_filename_regex`; `parsers/detector.py`: `is_ignored_filename`; `services/gmail_sync.py`: `_save_attachments_for_message`; `services/statement_processor.py`: `process_statement` | Unverified (EV-3 is not separable from FR-044 and FR-045) | None yet (Phase 9) |
| FR-044 | Open | P1 `parsers/detector.py`: `_is_non_card_text`, `is_non_card_document`, the non-card guard in `detect_bank`; `services/statement_processor.py`: `process_statement` ("Not a credit card statement" result) | Unverified (EV-3 is not separable from FR-043 and FR-045) | None yet (Phase 9) |
| FR-045 | Open | P1 `services/statement_processor.py`: `process_statement` ("Could not detect bank" return, context; P1 adds only a log line there); `parsers/detector.py`: `detect_bank` | Unverified | None yet (Phase 9) |
| FR-046 | Open | P1 `parsers/detector.py`: `_STORAGE_PREFIX_RE`, `_original_filename`, `_detect_bank_from_filename`, `detect_bank`; `services/statement_processor.py`: unknown-issuer handling, detection after unlock | Unverified | None yet (Phase 9) |
| FR-047 | Open | P1 `parsers/sc.py`: `StandardCharteredParser`; `parsers/detector.py`: Standard Chartered name and text checks; `services/statement_processor.py`: parser map | Unverified | None yet (Phase 9) |
| FR-048 | Open | P1 `services/statement_processor.py`: `process_statement` (`banks_to_try`, the unlock loop); `services/pdf_unlock.py`: Standard Chartered candidate list. The password-needed entry itself is created by upstream code not shown in the patch | Unverified | None yet (Phase 9) |
| FR-049 | Open | P2 `routers/statements.py`: the reparse-with-password route calls `_process_one_statement` instead of deleting the row first; `_process_one_statement` takes `manual_password` and, when processing raises, rolls back and restores `file_hash` and `card_last4`. How it handles a failed result that raises nothing is upstream (not shown). CardOS side: `StatementsView.tsx` `UnlockStatement` | Unverified | None yet (Phase 9) |
| FR-050 | Open | P1 `services/gmail_sync.py`: `GMAIL_READONLY` (context); README step 1; read-only copy in `SettingsView.tsx` | Unverified | None yet (Phase 9) |
| FR-051 | Open | `astro.config.mjs`: `/api` proxy; `gmail.ts`: origin check; `live.ts`, `api.ts`: relative paths only; `AppShell.astro`: theme-only storage | Unverified | None yet (Phase 9) |
| FR-052 | Open | `.gitignore`: environment-file patterns (`!.env.example` excepted); `configure-gmail.mjs`: `promptForClient` (hidden secret), no secret in any output | Unverified | None yet (Phase 9) |
| FR-053 | Open | `configure-gmail.mjs`: `writeEnv` (`mode: 0o600`, `chmodSync`), reached only after the checks in `main` | Unverified | None yet (Phase 9) |
| FR-054 | Open | Policy, not code: `AGENTS.md` section 5; `.gitignore`: financial-data patterns | Unverified | None yet (Phase 9) |
| FR-055 | Open | P1 `services/gmail_sync.py`: `_attachment_filename`, `_already_saved`, `_sync_lock`; `services/statement_processor.py`: `_inflight_hashes` | EV-2 (partial: a re-sync after a successful sync; a retry after a timeout or failure was not observed) | None yet (Phase 9) |
| FR-056 | Open | `gmail.ts`: `syncGmail` (180 s); `live.ts`: `apiMutate` (20 s default); `configure-gmail.mjs`: 30 s polling deadline in `main`, 2.5 s per check in `gmailConfigured` | Unverified | None yet (Phase 9) |
| FR-057 | Open | `live.ts`: `refreshAll` (`Promise.allSettled`, a failed path keeps its old data); `try`/`catch` in the Gmail handlers | Unverified | None yet (Phase 9) |
| FR-058 | Open | `SettingsView.tsx`: `role="status"` with `aria-live="polite"` on the action-row message; `role="status"` (polite by default) on the message shown without the action row | Unverified | None yet (Phase 9) |
| FR-059 | Open | P1 `services/gmail_sync.py`: `_safe_filename`, `_attachment_filename`, the allowed-extension check (`_ALLOWED_EXT`, context; its values coordinator-verified 2026-10-17, Burnrate 0.5.2 source (not in repo)) | Unverified | None yet (Phase 9) |

### Success criteria and evidence

SC-002 is partly supported by EV-2 (already-saved attachments were skipped; the counts, and whether new mail arrived in between, were not recorded). SC-004 is partly supported by EV-3 (one mailbox; which document types it held was not recorded). SC-001 is unmeasured: EV-1 shows that connecting and a first sync worked, but not how many actions they took or what started the sync. SC-001, SC-003 and SC-005 to SC-010 are Unverified.

### Notes

- **Coverage at this baseline**: 59 requirements, FR-001 to FR-059, of which FR-050 to FR-059 are non-functional. All 59 name implementing code, but for 7 of them (FR-029 to FR-033, FR-041, FR-042) the Burnrate-side code is outside this repository, so the row cites only the CardOS code that consumes it, the README, unchanged patch context and, for FR-041, the coordinator's reading of the installed source. Six have partial behavioural evidence (FR-029 to FR-031, FR-036, FR-040, FR-055), none has full behavioural evidence, and 53 are Unverified. None has an automated test. Thirty-four rows cite code under `src/` and so also have the static EV-4.
- **Tests**: the repository has no automated tests and no test script. Phase 9 plans Vitest for `src/lib` only, so requirements implemented in components, in `scripts/` or in Burnrate patches have no planned automated test yet. "None yet (Phase 9)" is a placeholder for all rows, not a commitment to test each one.
- **Keeping this table true**: a change to any file named above updates the matching row, and the coverage counts above, in the same change.

## Known Gaps and Discrepancies

These are documented, not fixed. Each is shipped behaviour or a mismatch between sources, found while writing or reviewing this spec.

| ID | Observation | Related |
|---|---|---|
| G-1 | CardOS ignores `attachments_skipped`: `GmailSyncResult` does not declare it, Settings shows only the queued and scanned counts, and the top bar shows no result. The README says earlier attachments are skipped but a user cannot see how many. (ADR 0001 notes the same.) | FR-015, FR-040 |
| G-2 | CardOS reads only whether a sync reply was a success, never the `status` in its body. Burnrate 0.5.2 answers every error result with HTTP 400 (coordinator-verified 2026-10-17, Burnrate 0.5.2 source (not in repo)), so this holds today; a Burnrate that answered an error result with a success code would make the panel say "Queued 0 attachments from 0 emails". | FR-041 |
| G-3 | Reconnect is offered only in Settings. The top bar's failure label is generic, so an expired authorization (weekly in Testing mode) reads "Gmail sync failed · Retry" there. The top bar also keeps one failure flag for both of its Gmail buttons: after a failed sync, a "Connect Gmail" button shown later (if the status changes to not connected) reads "Gmail sign-in failed · Retry" although no sign-in was tried. | FR-007, FR-017, FR-019 |
| G-4 | README gap: the README says Burnrate pulls "PDF, CSV, XLS" attachments, which reads as all three being imported. Gmail sync saves PDF, CSV, XLS and XLSX attachments (coordinator-verified 2026-10-17, Burnrate 0.5.2 source (not in repo)) and counts them as queued, but the statement processor accepts only PDF and CSV (Patch 1 context, line 664), so spreadsheet attachments are saved to the watch folder and never imported. What processing reports for them, and how the folder watcher treats them, is unverified. | FR-034, FR-040 |
| G-5 | The README's ignore-rule sentence omits that the pattern is searched for, ignoring case, in the file name without Burnrate's storage prefix (for a Gmail attachment, its sanitised name), that ignored Gmail attachments are skipped silently, and that an invalid pattern is ignored without a warning. | FR-043 |
| G-6 | The README does not mention Patch 2, which FR-049 depends on, and its only apply command (`-p0`) does not fit Patch 2's `a/` and `b/` paths. (Tracked in ADR 0001 and `.ai/CURRENT.md`.) | FR-049 |
| G-7 | The README describes only a Web application client. Setup also accepts a Desktop ("installed") client file and skips the callback-address check for it. Setup's `BURNRATE_ENV_FILE` and `CARDOS_NO_RESTART` options appear in neither the README nor `.env.example`. | FR-022, FR-023, FR-025, FR-027 |
| G-8 | The request that starts sign-in has no time limit (reads wait 8 seconds, writes 20 by default, syncs 180). A Burnrate that accepts the request but never answers leaves the Connect control disabled until the page is reloaded. | FR-007, FR-008, FR-056 |
| G-9 | In Settings, "Sync now" reads "Syncing…" while sign-in is being started (Reconnect), because both actions share one busy flag. | FR-008, FR-013 |
| G-10 | Until a Gmail status has been received, Settings shows the "Not configured" copy and the setup command, which could mislead when only the status request failed. | FR-001, FR-003 |
| G-11 | The README says Burnrate syncs each time its service starts, at most hourly, and the Settings copy says it checks for statement emails when it starts. The one-hour constant is visible in Patch 1's context, but the start-up trigger is not in the patches. | FR-005, FR-033 |
| G-12 | A patch comment lists start-up, "post-connect" and manual syncs as overlapping, while a Settings code comment says the first sync runs right away instead of waiting for a Burnrate restart. Whether Burnrate starts a sync by itself after connecting is not visible. Both paths are serialised either way. | FR-010, FR-039 |
| G-13 | `.gitignore` has no pattern for the downloaded Google OAuth client file. The README sends it to a folder outside the repository, so the risk is a misplaced copy. (Tracked in `.ai/CURRENT.md`.) | FR-052 |
| G-14 | Only the first terms of Burnrate's Gmail search are visible in Patch 1 (the 120-day window and the attachment names). The README's "matching emails" and a patch comment about PDFs "that the Gmail query also matches" suggest the search has further terms, so FR-034 describes only what is visible. | FR-034 |
| G-15 | A failing Gmail status request counts as one unavailable dataset in CardOS's shared data layer: the connection indicator reads "Burnrate connected · Some data unavailable", and the 5-second statement-processing poll is suspended while failures persist. Every other dataset keeps its data. Separately, while a statement is processing, the 5-second poll postpones the 45-second full refresh, so Gmail status is then refreshed only when a statement changes, on focus or after a write; the README describes the 45-second refresh without this exception. | FR-021, FR-057 |
| G-16 | Exactly-once processing of a synced attachment holds within one Burnrate run. The folder watcher skips files a sync submitted by keeping their paths in memory, so after a restart its start-up scan may submit a saved attachment again; whether it does depends on which files the scan treats as eligible, which is upstream code. A second statement is then prevented only by Burnrate's upstream check for identical files, which is not in the patches. | FR-038, FR-055 |
| G-17 | Skipped files can still be listed as failed imports. Patch 1 records the processing result of every Gmail-saved file (`log_processing_outcome`), and the skip results of FR-044 and FR-045 carry status "error" ("Not a credit card statement", "Could not detect bank"), as does an ignored file that reaches processing by another route (FR-043). CardOS's Statements page lists every processing record that is not a success under "Import activity" and labels status "error" as "Parse failed". Whether the stored record keeps status "error" depends on code not shown in the patch (the body of `_log_processing_result`). FR-043 to FR-045, SC-004 and EV-3 speak only of statement entries. | FR-043, FR-044, FR-045 |
