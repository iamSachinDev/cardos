# Specification Quality Checklist: Gmail Statement Sync

**Purpose**: Validate specification completeness and quality before proceeding to planning
**Created**: 2026-10-18
**Feature**: [spec.md](../spec.md)

## Content Quality

- [ ] No implementation details (languages, frameworks, APIs)
  - Not met, by instruction. No language, framework or code structure appears outside the Traceability section, but the body keeps the contract with the external dependency: the Burnrate interface table (status, sign-in start and sync routes, in "F. Burnrate (external dependency)"), HTTP status codes in FR-017, FR-041 and FR-042, local addresses in FR-023, FR-026 and FR-028, the four settings names in FR-026, and the folder watcher in FR-038. A retroactive spec of an integration cannot state its requirements on the dependency without them.
- [x] Focused on user value and business needs
- [ ] Written for non-technical stakeholders
  - Not met, by design. The user stories, acceptance scenarios and success criteria are plain language, but the requirements on the external dependency (FR-029 to FR-049) and the Traceability section address the maintainer and the AI agents.
- [x] All mandatory sections completed

## Requirement Completeness

- [x] No [NEEDS CLARIFICATION] markers remain
  - Both markers were resolved in review (iteration 4) with facts the coordinator verified on 2026-10-17 from the installed Burnrate 0.5.2 source, which is not in this repository. FR-041: the sync route answers every error result with HTTP 400 and the error message as `detail`, so CardOS is right to treat a success response as a completed sync, and the route always forces the sync. FR-034: Gmail sync saves `.pdf`, `.csv`, `.xls` and `.xlsx` attachments, but the statement processor accepts only `.pdf` and `.csv`, so spreadsheets are saved and never imported. That is recorded as current behaviour with a known limitation, and the README's "PDF, CSV, XLS" is kept as gap G-4.
- [x] Requirements are testable and unambiguous
  - FR-034 and FR-041 now state the behaviour in full. The facts behind them are cited as "coordinator-verified 2026-10-17, Burnrate 0.5.2 source (not in repo)" because they cannot be re-checked from this repository.
- [x] Success criteria are measurable
- [x] Success criteria are technology-agnostic (no implementation details)
- [x] All acceptance scenarios are defined
- [x] Edge cases are identified
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified

## Feature Readiness

- [x] All functional requirements have clear acceptance criteria
  - Each of the 59 requirements (FR-001 to FR-059, of which FR-050 to FR-059 are non-functional) is cited by at least one acceptance scenario or edge case.
- [x] User scenarios cover primary flows
- [ ] Feature meets measurable outcomes defined in Success Criteria
  - Only SC-002 and SC-004 have a recorded observation (EV-2, EV-3), and each covers only part of its criterion. SC-001, SC-003 and SC-005 to SC-010 are unmeasured; EV-1 does not measure SC-001 because it does not record how many actions the connection took or what started the first sync. The constitution (III.3) treats a success criterion as a target until a recorded check measures it.
- [ ] No implementation details leak into specification
  - Same finding as the first item.

## Notes

- Items marked incomplete require spec updates before `/speckit-clarify` or `/speckit-plan`. For this retroactive spec the picture differs: the two Content Quality deviations are accepted by instruction and pending the maintainer's decision, and the unmeasured success criteria are open facts, not wording defects. No clarification marker remains, so `/speckit-clarify` has nothing left to ask; the feature is already built, so `/speckit-plan` is not due. Accepting the spec is the maintainer's decision.
- **Validation iterations: 4.**
  1. The mechanical checks (ID sequence, dangling references, traceability coverage, vague wording, privacy patterns) and a read-through against the code found 7 functional and 5 non-functional requirements with no scenario, and wording that claimed more than the evidence shows (a Gmail search described as fully visible, failure isolation and a Burnrate-unreachable criterion that the shared data layer does not meet, a 20-second write wait that is only the default). Fixed.
  2. The constitution draft landed while this spec was being written, so the spec was re-checked against it (see below). Found: no negative case for four of the non-functional requirements (now FR-050, FR-052, FR-054 and FR-057), evidence rows without what ran, when and result, no task link, and success criteria not marked as targets. Fixed.
  3. All mechanical checks re-run on the text of that iteration: 49 functional and 10 non-functional requirements (then numbered separately), 10 SC, 59 traceability rows, 0 dangling IDs, 0 unreferenced requirements, all 13 MUST NOT requirements exercised by a scenario or edge case, 2 clarification markers.
  4. Independent review (2026-10-18) against the code at commit e7598889 and both patches. Fixed:
     - **IDs**: the non-functional requirements, numbered separately until then, became FR-050 to FR-059 in their original order, under a "Non-functional requirements" subheading, each labelled (non-functional), with every reference in the spec and this checklist updated. The constitution (IV.2) and `/speckit-analyze` key on `FR-###` and `SC-###` only; renumbering is allowed because the spec is still a Draft.
     - **Clarifications**: both markers resolved as described under Requirement Completeness.
     - **Requirements the code contradicted**: FR-009 (an empty `gmail` parameter is ignored), FR-011 and FR-012 (the `reason=no_refresh` check applies to any outcome other than `connected`), FR-016 (starting sign-in triggers no refresh), FR-021 (the 45-second refresh is postponed while a statement processes), FR-026 (only the first matching line is replaced; the four settings names added), FR-027 and FR-056 (2.5-second status checks, a final check, a 30-second limit per command), FR-035 (only a Gmail API error keeps a partial listing), FR-038 (exactly once holds within one Burnrate run), FR-043 (a case-insensitive regular-expression search after the storage prefix is removed), FR-052 (`.env.example` is tracked; the downloaded client file keeps the secret), FR-053 and SC-007 (only runs that save the client set mode 600), the "Statement entry" key entity (a duplicate creates no entry), three edge cases (Gmail status unavailable, Burnrate offline, what leaves the machine), the setup-timing wording in story 5, and the story 4 independent test. FR-014 also gained a clarification: the refresh after a successful sync is bounded separately, at 8 seconds per read.
     - **Traceability rows**: FR-021, FR-026, FR-027, FR-034, FR-041, FR-044, FR-045, FR-048, FR-049, FR-052, FR-053, FR-056, FR-058 and FR-059 now name what the code and patches actually show, including which lines are only patch context and what is upstream.
     - **Evidence**: the rule that an observation is credited only when it could not have succeeded without the behaviour is now applied throughout. EV-1 no longer credits FR-006 (how sign-in was started is not recorded, the reason FR-010 was already uncredited), FR-034 or FR-037 (a successful sync does not depend on them), and it no longer counts toward SC-001. EV-3 no longer credits FR-043 or FR-044 (it cannot separate them from each other or from FR-045) and supports SC-004 only in part; EV-2 supports SC-002 only in part.
     - **Gaps**: added G-16 (exactly once across a Burnrate restart) and G-17 (skipped files listed as failed imports); updated G-2, G-3, G-4, G-5, G-11 and G-15.
     - **Mechanical checks on the final text**: 59 FR (FR-001 to FR-059), 10 SC, no separate non-functional ID series left, 59 traceability rows in requirement order, 0 dangling FR, SC, G or EV references, 0 unreferenced requirements, all 13 MUST NOT requirements exercised by a scenario or edge case, 0 clarification markers, 6 rows with partial behavioural evidence and 53 Unverified, 34 rows citing `src/`, 17 gaps numbered in sequence.
- **Privacy scan of the spec and this checklist** (patterns for email addresses, home-directory paths, runs of nine or more digits, masked card numbers, amounts, personal names and handles, OAuth client ID and secret formats, tokens), re-run after iteration 4: 0 hits. Standard Chartered is the only issuer named, and only where the patch supports it.
- **Checked against a Proposed constitution (v1.0.0, not ratified):**
  - I.1 and I.4: no real data; no issuer, card product or account is stated or implied as held.
  - III.1 and III.3: each evidence row gives what was inspected, when and the result, with its record; success criteria are flagged as targets; the coverage counts come from the traceability table. Facts read from the Burnrate source outside this repository are labelled coordinator-verified and are not counted as evidence.
  - IV.2: `FR-###` and `SC-###` only, as the template numbers them; the non-functional requirements are FR-050 to FR-059.
  - IV.3: every MUST NOT requirement has a negative scenario or edge case.
  - IV.4: the task link is shown as open for every row because no `tasks.md` exists; code, evidence and test columns are filled or marked open.
  - IV.5 and the status lifecycle: the spec stays Draft, pending the maintainer's acceptance. No clarification marker remains, but it is not marked Accepted, Implemented or Verified.
- **Not run, by instruction**: the Spec Kit scripts, the `specify` CLI and any git command that changes state. The spec directory and files were created by hand, and `.specify/feature.json` was not written. Iteration 4 edited only `spec.md` and this checklist; its checks ran as scratch scripts outside the repository, and no npm, Astro or Spec Kit command was run.
