# Task: phase12-close

- **Owner:** claude
- **Branch:** ai/claude/phase12-close
- **Base:** `2429eeb6` (`main` on GitHub after pull request #5)
- **Created:** 2026-10-22
- **State:** Implemented but unverified: the record is written and the checks pass except two explained exits; the unmodified `npm run build` has not run outside the sandbox, and the branch is not pushed
- **Next step:** The coordinator pushes the branch and opens a pull request (publishing is HIGH: the maintainer approves), runs `npm run build` outside the sandbox, and records the GitHub result of the CI run.

## Done

- Recorded the maintainer's decisions of 2026-10-21: constitution v1.0.0 ratified, spec 001 and ADRs 0001 and 0002 accepted, README Burnrate sections removed, P5-C5 Deferred. `AGENTS.md` changed only in the §9 level 2 note.
- Ran the final verification pass on a fresh clone and recorded every exit code in [INTEGRATION-BOOTSTRAP.md](../../docs/ai-engineering/INTEGRATION-BOOTSTRAP.md#final-pass-2026-10-22) and PHASE-STATUS.

## Not done

- GitHub result of the merged CI wiring (pull request #5): GitHub was unreachable from the sandbox.
- Unmodified `npm run build` outside the sandbox.
- Dependabot pull requests #2 to #4 (#4: TypeScript 5.9 to 7.0).
- `AGENTS.md` §3 still mentions the README's patch overview (HIGH-class edit for the maintainer).

## History

- 2026-10-22 new: ai/claude/phase12-close from `2429eeb6`
