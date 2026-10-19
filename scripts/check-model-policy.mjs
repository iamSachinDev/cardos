#!/usr/bin/env node
// Drift check for the model-routing policy (Phase 7): do the models and effort levels listed in
// policy/data/cli-capabilities.json still match what the installed CLIs offer? It runs only offline, read-only
// commands (`claude --help`, `codex debug models --bundled`, `--version`) and never starts an agent or reads a
// credential. Exit 0 = both CLIs verified, 1 = drift, 2 = incomplete check (missing CLI or unreadable version).
// The policy file itself is validated by Conftest: conftest test --policy policy --data policy/data --namespace model_policy model-policy.yaml
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dataFile = join('policy', 'data', 'cli-capabilities.json');
const sameSet = (a, b) => a.length === b.length && a.every((x) => b.includes(x));
const list = (items) => (items.length ? items.join(', ') : '(none)');

// Argument arrays only: nothing is interpolated into a shell string. A missing binary is reported as `missing`.
function run(command, args) {
  const result = spawnSync(command, args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, timeout: 60_000, stdio: ['ignore', 'pipe', 'pipe'] });
  if (result.error?.code === 'ENOENT') return { missing: true };
  if (result.error) return { failed: result.error.message };
  if (result.status !== 0) return { failed: `exit ${result.status}` };
  return { out: result.stdout };
}

const caps = JSON.parse(readFileSync(join(root, dataFile), 'utf8')).cli_capabilities;
const problems = [];
let cannotCheck = false;
const checked = [];

function checkVersion(name, expected, result) {
  if (result.missing || result.failed) {
    cannotCheck = true;
    console.log(`${name}: --version unavailable (${result.failed ?? 'CLI missing'}), cannot check`);
    return;
  }
  const actual = result.out.match(/\d+\.\d+\.\d+/)?.[0];
  if (!actual) {
    cannotCheck = true;
    console.log(`${name}: --version did not contain a version, cannot check`);
  } else if (actual !== expected) {
    problems.push(`${name}: installed version ${actual} differs from verified ${expected} (${caps[name].verified}); re-verify and update ${dataFile}`);
  } else console.log(`${name}: version ${actual} (as verified)`);
}

// Claude Code: --help names the --effort levels and the --model aliases.
function checkClaude() {
  const help = run('claude', ['--help']);
  if (help.missing) return (cannotCheck = true, console.log('claude: not installed, cannot check'));
  if (help.failed) return (cannotCheck = true, console.log(`claude: --help failed (${help.failed}), cannot check`));
  const version = run('claude', ['--version']);
  checkVersion('claude', caps.claude.version, version);
  checked.push('claude');
  const text = help.out.replace(/\s+/g, ' ');
  const effortText = text.match(/--effort <level>[^(]*\(([^)]*)\)/)?.[1];
  const modelText = text.match(/--model <model>(.*?)(?= -{1,2}[A-Za-z]| $)/)?.[1];
  if (!effortText || !modelText) return problems.push('claude: could not find the --effort or --model description in `claude --help` (format changed?)');
  const effort = effortText.split(',').map((s) => s.trim()).filter(Boolean);
  if (!sameSet(effort, caps.claude.effort)) problems.push(`claude: --effort offers [${list(effort)}], allowed list has [${list(caps.claude.effort)}]`);
  // Aliases are quoted in the help text ('fable', 'opus', 'sonnet'); full names such as 'claude-fable-5' are examples, not aliases.
  const aliases = [...modelText.matchAll(/'([a-z]+)'/g)].map((m) => m[1]);
  const expected = caps.claude.models.filter((m) => !caps.claude.models_not_in_help.includes(m));
  if (!sameSet(aliases, expected)) problems.push(`claude: --model help names aliases [${list(aliases)}], allowed list expects [${list(expected)}]`);
  console.log(`claude: --effort [${list(effort)}], --model aliases in help [${list(aliases)}]; not named in help (verified otherwise): [${list(caps.claude.models_not_in_help)}]`);
}

// Codex: the catalog bundled in the binary lists each visible model and the effort levels it supports.
function checkCodex() {
  const bundled = run('codex', ['debug', 'models', '--bundled']);
  if (bundled.missing) return (cannotCheck = true, console.log('codex: not installed, cannot check'));
  if (bundled.failed) return (cannotCheck = true, console.log(`codex: debug models --bundled failed (${bundled.failed}), cannot check`));
  checked.push('codex');
  checkVersion('codex', caps.codex.version, run('codex', ['--version']));
  let catalog;
  try {
    catalog = JSON.parse(bundled.out).models;
  } catch {
    return problems.push('codex: `codex debug models --bundled` did not print the expected JSON (format changed?)');
  }
  const offered = new Map(catalog.filter((m) => m.visibility === 'list').map((m) => [m.slug, (m.supported_reasoning_levels ?? []).map((l) => l.effort)]));
  for (const [model, efforts] of Object.entries(caps.codex.models)) {
    if (!offered.has(model)) problems.push(`codex: allowed model ${model} is no longer listed by the catalog`);
    else if (!sameSet(offered.get(model), efforts)) problems.push(`codex: ${model} supports [${list(offered.get(model))}], allowed list has [${list(efforts)}]`);
  }
  for (const model of offered.keys()) if (!(model in caps.codex.models)) problems.push(`codex: catalog lists ${model}, which is not in the allowed list`);
  console.log(`codex: ${offered.size} listed models in the bundled catalog, ${Object.keys(caps.codex.models).length} in the allowed list`);
}

checkClaude();
checkCodex();
for (const problem of problems) console.error(`DRIFT: ${problem}`);
if (problems.length) {
  console.error(`model policy: ${problems.length} drift finding(s). Re-verify against the CLIs, then update ${dataFile} and model-policy.yaml.`);
  process.exit(1);
}
if (cannotCheck || checked.length !== 2) {
  console.error('model policy: verification incomplete; both CLIs and their versions are required.');
  process.exit(2);
}
console.log(`model policy: allowed lists match the installed CLIs (${checked.join(', ')})`);
