# Local evaluation and quality checks (Phase 9)

- **Purpose:** Reproduce the local unit tests and synthetic coding-agent pilot without contacting Burnrate or using private data.
- **Audience:** The maintainer and CardOS coding agents.
- **Related docs:** [Phase status](PHASE-STATUS.md#p9-evaluation-and-quality) · [roadmap](IMPLEMENTATION-ROADMAP.md#p9-evaluation-and-quality) · [shared rules](../../AGENTS.md)
- **How to validate:** Run `npm test` and `npm run build`; run the Promptfoo pilot below in a disposable directory.

## Vitest

`npm test` runs the pinned Vitest 5.0.4 against `src/lib`. The 11 tests in `api.test.ts`, `gmail.test.ts` and `live.test.ts` cover IST date boundaries, due sorting and missing amounts, JSON fetch errors, Google sign-in origin validation, reconnect classification, live refresh state, and mutation responses. All network calls in these tests are mocked. The tests do not read Burnrate, statements, OAuth files, or real card data.

## Promptfoo pilot

The [config](../../evals/promptfoo/promptfooconfig.yaml) runs four Codex SDK tasks using the synthetic text [fixtures](../../evals/promptfoo/fixtures). Promptfoo inserts each fixture into the prompt. The agent runs with a read-only sandbox, agent network access and web search disabled, minimal environment inheritance, and an isolated disposable Git working directory. Promptfoo telemetry and update checks are disabled for the run. Only synthetic snippets are supplied as evaluation task data.

Use Node.js 22.22 or newer and an existing Codex CLI sign-in. From the CardOS worktree root:

```sh
eval_root="$(mktemp -d /private/tmp/cardos-p9-XXXXXX)"
mkdir -p "$eval_root/tooling" "$eval_root/workspace" "$eval_root/state"
npm install --prefix "$eval_root/tooling" --no-save --ignore-scripts --no-audit --no-fund promptfoo@0.124.1 @openai/codex-sdk@0.156.1
git -C "$eval_root/workspace" init -q
CARDOS_EVAL_WORKDIR="$eval_root/workspace" \
PROMPTFOO_CONFIG_DIR="$eval_root/state" \
PROMPTFOO_DISABLE_TELEMETRY=1 \
PROMPTFOO_DISABLE_UPDATE=1 \
"$eval_root/tooling/node_modules/.bin/promptfoo" eval \
  -c evals/promptfoo/promptfooconfig.yaml \
  --no-cache --no-share --no-table --max-concurrency 1 \
  --output "$eval_root/results.json"
```

The raw report stays under `/private/tmp`; review it before sharing. Do not add real statements, card data, API responses, secrets, or personal data to fixtures or committed results.

### Pilot result

On 19 Oct 2026 at 19:57 IST, Promptfoo 0.124.1 with Codex SDK 0.156.1 and `gpt-6-luna` completed four tasks: IST date requirement, unknown fee label, exact redirect origin, and preserving the last successful refresh result. Exact output assertions passed **4/4**, with zero provider errors. The agent received the fixtures inline; this checks answer quality on short synthetic snippets, not repository navigation or end-to-end CardOS behavior. An earlier file-reading variant failed because the provider did not read the temporary workspace files, so it is not counted as a passing result.

The CI gate is still open. The maintainer requested local-only checks for now, and `AGENTS.md` §7 requires explicit approval to change the workflow. No CI claim is made from these local runs.

`AGENTS.md` §2 still says no test command exists. Updating agent-rule files also requires explicit approval under §7; the current command is documented here and in `.ai/CONTEXT.md` pending that review.
