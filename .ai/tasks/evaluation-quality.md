# Task: evaluation-quality

- **Owner:** codex
- **Branch:** ai/codex/evaluation-quality
- **Base:** ai/codex/docs-automation
- **Worktree:** ../cardos-wt/codex-evaluation-quality
- **Created:** 2026-10-19
- **State:** Local implementation verified; awaiting maintainer review. CI wiring deferred by maintainer.
- **Next step:** Review the tests, pilot, and pinned Vitest dependency. Wire `npm test` into CI only after explicit workflow approval.

## History

- 2026-10-19 new: ai/codex/evaluation-quality from ai/codex/docs-automation
- 2026-10-19: Added 11 mocked Vitest tests for `src/lib`; local build and lockfile scan pass. Ran a four-case synthetic Promptfoo/Codex SDK pilot with 4/4 exact assertions. Recorded the file-read failure and final inline-fixture result in `docs/ai-engineering/EVALUATION-QUALITY.md`.
