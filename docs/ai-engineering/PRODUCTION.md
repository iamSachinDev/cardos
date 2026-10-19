# Local production safeguards (Phase 11)

- **Purpose:** Record reproducible CardOS dependencies and a maintainer-run Burnrate backup and restore procedure.
- **Audience:** The CardOS maintainer.
- **Related docs:** [Phase status](PHASE-STATUS.md#p11-production) · [roadmap](IMPLEMENTATION-ROADMAP.md#p11-production) · [Burnrate patch decision](../../.ai/decisions/0001-local-burnrate-patch.md)
- **How to validate:** Compare direct dependency versions in `package.json` with `package-lock.json`; run `npm test` and `npm run build`. The backup and restore commands require a private maintenance window and are not run by this phase.

## Dependency pins

All direct runtime and development dependencies are exact versions already resolved in `package-lock.json`; Phase 11 changes no resolved package version. Keep the lockfile with `package.json`, use Node.js **22.22.0 or newer**, and use `npm ci` in a clean checkout. CI currently uses Node 24. Review dependency updates as separate changes instead of replacing these pins with `latest`.

## Burnrate backup and restore runbook

**Maintainer operation only.** Burnrate holds real financial data. This runbook documents commands; Phase 11 does not run them, inspect the database, open an env file, or copy statements. Execute in a private terminal and store the result on an encrypted volume outside CardOS and Git. Never paste command output containing paths, records or credentials into an issue or chat.

The installed Burnrate 0.5.2 launcher sets its data directory to Homebrew's `var/burnrate`. Source code places `tuesday.db`, `uploads/`, and the default `.oauth_fernet.key` there; the database uses SQLite WAL. Its default production env file is under the formula's `libexec/`, but `BURNRATE_ENV_FILE` can select another file. A configured statement watch folder may be elsewhere. If `BURNRATE_OAUTH_FERNET_KEY` is supplied through the environment, preserve that secret separately too. These are static source findings, not an inspection of this Mac's live data.

Burnrate's built-in `/data/export` is **not a complete recovery backup**: installed source exports the database and uploads but omits the WAL files and the default Fernet key. Its `/data/import` replaces data in a running service. Use a stopped-service snapshot of the whole data directory for recovery. SQLite's [backup guidance](https://www.sqlite.org/backup.html) explains why copying a live database file is unsafe; Homebrew documents [`brew services stop` and `start`](https://docs.brew.sh/Manpage.html).

### Before backup

1. Confirm the installed Burnrate version and the active data directory against its launcher. This procedure was checked against **Burnrate 0.5.2**. Do not assume it applies unchanged after an upgrade. Determine the **active** env-file path from the service configuration, including any `BURNRATE_ENV_FILE` override, without displaying its contents. Confirm where any environment-supplied Fernet key is stored.
2. Choose a new directory on a private, encrypted volume with enough space for the database, uploads, production env, and any external statement watch folder. Do not put it inside the CardOS repository or a synced public folder.
3. Set `backup_root` to that directory in the private terminal. Confirm its path before running any copy command. Set `active_env_file` to the verified absolute path, or leave it empty if the service has no env file.

```sh
backup_root='/path/to/private/encrypted-backups'
active_env_file='/verified/absolute/path/to/active-env-file'
# Use active_env_file='' only when the service truly has no env file.
snapshot="$backup_root/burnrate-$(TZ=Asia/Kolkata date +%Y%m%d-%H%M%S)-IST"
umask 077
```

### Make and check the snapshot

1. Run this block in the same private terminal where `backup_root`, `active_env_file`, and `snapshot` were set. It stops the service, copies the **entire** data directory (including hidden files and any `-wal` or `-shm` siblings), checks the copy, and attempts to restart the service even if a command fails. It leaves an `INCOMPLETE` marker until all external items are checked. If `brew services stop` does not fully release the database, the operator must investigate before relying on the snapshot. Do not use `--keep` here.

   ```sh
   (
     set -eu
     umask 077
     burnrate_formula='pratik1235/burnrate/burnrate'
     burnrate_data="$(brew --prefix)/var/burnrate"
     mkdir -m 700 "$snapshot"
     : > "$snapshot/INCOMPLETE"
     brew list --versions "$burnrate_formula" > "$snapshot/burnrate-version.txt"
     stopped=0
     finish_backup() {
       result=$?
       trap - EXIT
       if [ "$stopped" -eq 1 ]; then
         brew services start "$burnrate_formula" || result=1
       fi
       exit "$result"
     }
     trap finish_backup EXIT
     brew services stop "$burnrate_formula"
     stopped=1
     if lsof -nP -- "$burnrate_data/tuesday.db" >/dev/null 2>&1; then
       echo 'Database remains open; snapshot aborted.' >&2
       exit 1
     fi
     test -f "$burnrate_data/tuesday.db"
     ditto "$burnrate_data" "$snapshot/data"
     if [ -n "$active_env_file" ]; then
       test -f "$active_env_file"
       mkdir -m 700 "$snapshot/private"
       ditto "$active_env_file" "$snapshot/private/active-env-file"
     fi
     chmod -R go-rwx "$snapshot"
     test -d "$snapshot/data/uploads"
     result="$(sqlite3 -readonly "$snapshot/data/tuesday.db" 'PRAGMA integrity_check;')"
     test "$result" = ok
     echo 'Database validated; snapshot is incomplete until external items are checked.'
   )
   ```

2. If statements are watched from another folder, copy that folder into a separate private snapshot location. Preserve any environment-supplied Fernet key in your existing password manager or encrypted secret backup; do not print or paste its value. Confirm the required key source and the env-file copy are present without displaying contents. SQLite's `ok` checks database structure; it does not check attachments or secrets. Once every required item is verified, create `"$snapshot/COMPLETE"` and remove `"$snapshot/INCOMPLETE"` in the private terminal. Otherwise leave the marker and do not use this snapshot for restore.

   ```sh
   (
     set -eu
     test -f "$snapshot/INCOMPLETE"
     test ! -e "$snapshot/COMPLETE"
     : > "$snapshot/COMPLETE"
     rm "$snapshot/INCOMPLETE"
   )
   ```

3. Verify Burnrate restarted and the local CardOS connection works. Keep the snapshot private and test a restore on an isolated copy before depending on it.

### Restore a known-good snapshot

Restoring replaces live financial state. Use the same Burnrate version unless you have verified schema and patch compatibility. Make a fresh pre-restore snapshot using the procedure above. Verify that snapshot is complete, including any external watch folder and the required Fernet key. Confirm the selected backup's env-file destination and compatibility before changing any configuration. The block below validates the selected database **before** moving live data; on a copy failure it attempts to put the original data back and restart Burnrate. On success it intentionally leaves Burnrate stopped so configuration and secrets can be restored before startup.

```sh
snapshot='/path/to/private/encrypted-backups/selected-burnrate-snapshot'
burnrate_data="$(brew --prefix)/var/burnrate"
rollback_data="${burnrate_data}.pre-restore-$(TZ=Asia/Kolkata date +%Y%m%d-%H%M%S)-IST"
(
  set -eu
  burnrate_formula='pratik1235/burnrate/burnrate'
  failed_data="${burnrate_data}.failed-restore-$(TZ=Asia/Kolkata date +%Y%m%d-%H%M%S)-IST"
  test ! -e "$snapshot/INCOMPLETE"
  test -f "$snapshot/COMPLETE"
  test -f "$snapshot/data/tuesday.db"
  test -d "$snapshot/data/uploads"
  result="$(sqlite3 -readonly "$snapshot/data/tuesday.db" 'PRAGMA integrity_check;')"
  test "$result" = ok
  test ! -e "$rollback_data"
  test ! -e "$failed_data"
  moved=0
  stopped=0
  restore_failed() {
    status=$?
    trap - EXIT
    if [ "$status" -ne 0 ] && [ "$moved" -eq 1 ]; then
      if [ -e "$burnrate_data" ]; then mv "$burnrate_data" "$failed_data" || exit "$status"; fi
      mv "$rollback_data" "$burnrate_data" || exit "$status"
    fi
    if [ "$status" -ne 0 ] && [ "$stopped" -eq 1 ]; then
      brew services start "$burnrate_formula" || :
    fi
    exit "$status"
  }
  trap restore_failed EXIT
  brew services stop "$burnrate_formula"
  stopped=1
  if lsof -nP -- "$burnrate_data/tuesday.db" >/dev/null 2>&1; then
    echo 'Database remains open; restore aborted.' >&2
    exit 1
  fi
  mv "$burnrate_data" "$rollback_data"
  moved=1
  ditto "$snapshot/data" "$burnrate_data"
  result="$(sqlite3 -readonly "$burnrate_data/tuesday.db" 'PRAGMA integrity_check;')"
  test "$result" = ok
  echo 'Data restored. Service is stopped; restore required configuration and key before startup.'
)
```

Restore the saved active env file, any environment-supplied Fernet key, and any external watch folder **before** starting Burnrate, after checking each destination, permissions and compatibility; do not overwrite a newer working configuration blindly. The data snapshot already contains the default Fernet key. Then run `brew services start 'pratik1235/burnrate/burnrate'`. Check the local CardOS connection and a few expected totals privately. Keep `rollback_data` until the restored service is verified. If verification fails, stop Burnrate, move the failed restored directory aside, move `rollback_data` back into place, then start Burnrate. Do not delete either copy until recovery is confirmed.

## Scope that does not apply

| Practice | Phase 11 decision | Reason |
|---|---|---|
| Deployment and infrastructure provisioning | Not applicable | CardOS is a local static UI with Burnrate on the same Mac; there is no hosted deployment. |
| Rollouts and release signing | Not applicable | There is no release pipeline or distributed artifact in this setup. |
| Load and chaos testing | Not applicable | Single-user local operation has no service capacity target or production traffic. |
| Service catalog | Not applicable | CardOS and its local Burnrate dependency are already described in the [system context](../../.ai/CONTEXT.md). |
