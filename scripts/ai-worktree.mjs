#!/usr/bin/env node
// AI worktree helper: a thin, dependency-free adapter over native `git worktree`, so Claude Code and Codex never
// share a working tree. On 2026-10-17 two agents edited one tree and one agent's commit swept in the other's
// uncommitted edit. This adds only what git does not: one naming convention (<repo>-wt/<agent>-<task> on branch
// ai/<agent>/<task>), visible ownership (git config branch.<name>.aiBase / aiOwner / aiHandoffFrom, plus a per-task
// state file .ai/tasks/<task>.md), refusal of collisions, a handoff that branches from committed work and never
// touches the other agent's tree, and a remove that refuses to delete ignored files (secrets, statements) that git would
// delete silently. It never forces anything: no --force and no branch -D.
import { spawnSync } from 'node:child_process';
import { existsSync, lstatSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, resolve, sep } from 'node:path';
import { parseArgs } from 'node:util';

const agents = ['claude', 'codex'];
const taskPattern = /^[a-z0-9][a-z0-9-]{1,47}$/;
const defaultBase = 'main';
const tool = 'node scripts/ai-worktree.mjs';
const usage = `Usage:
  ${tool} new <task> --agent <claude|codex> [--base <ref>] [--dry-run]
  ${tool} list
  ${tool} handoff <task> --from <claude|codex> --to <claude|codex> [--dry-run]
  ${tool} remove <task> --agent <claude|codex> [--dry-run]

Also: npm run ai:worktree -- <same arguments>
A task is 2-48 lowercase letters, digits or hyphens. Its worktree is <repo>-wt/<agent>-<task>, next to the main
checkout, on branch ai/<agent>/<task>. --dry-run prints the git commands that change anything without running them.
new and handoff also write .ai/tasks/<task>.md in the new worktree and leave it uncommitted.
remove refuses while the worktree holds ignored files beyond build output (node_modules, dist, ...): git would delete them.`;
const dirtyAdvice = 'Commit your own changes; if they are not yours, stop and ask the maintainer.';

const commands = {
  new: { task: true, options: ['agent', 'base', 'dry-run'], run: createWorktree },
  list: { task: false, options: [], run: listWorktrees },
  handoff: { task: true, options: ['from', 'to', 'dry-run'], run: handoff },
  remove: { task: true, options: ['agent', 'dry-run'], run: removeWorktree },
};

const branchName = (agent, task) => `ai/${agent}/${task}`;
const isInside = (path, parent) => path === parent || path.startsWith(parent + sep);
const shellQuote = (value) => (/^[\w@%+=:,./-]+$/.test(value) ? value : `'${value.replaceAll("'", "'\\''")}'`);

// lstat, not existsSync: a dangling symlink still occupies the path. A file where a parent directory should be
// (ENOTDIR) counts as free here, so that git reports the real problem with its own message.
function pathTaken(path) {
  try {
    lstatSync(path);
    return true;
  } catch (error) {
    if (error.code === 'ENOENT' || error.code === 'ENOTDIR') return false;
    throw error;
  }
}

// Read-only calls such as `git status` must not refresh (write) another worktree's index. Repository variables
// inherited from a git hook would point every `git -C <path>` at another checkout and defeat the checks before remove.
const gitEnv = { ...process.env, GIT_OPTIONAL_LOCKS: '0' };
for (const name of ['GIT_DIR', 'GIT_WORK_TREE', 'GIT_INDEX_FILE', 'GIT_COMMON_DIR', 'GIT_OBJECT_DIRECTORY']) delete gitEnv[name];

// Every git call passes an argument array: nothing is ever interpolated into a shell string.
function spawnGit(cwd, args) {
  const result = spawnSync('git', args, {
    cwd,
    encoding: 'utf8',
    maxBuffer: 16 * 1024 * 1024,
    env: gitEnv,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  if (result.error) throw new Error(`Could not run git: ${result.error.message}`);
  // git's "hint:" lines can advise --force or -D, which this helper never uses, so they are dropped.
  const err = result.stderr.split('\n').filter((line) => !line.startsWith('hint:')).join('\n').trim();
  return { code: result.status ?? 1, out: result.stdout.trimEnd(), err };
}

const git = (repo, args) => spawnGit(repo.main, args);

function gitFailure(what, result) {
  return new Error(`${what} failed: ${result.err || result.out || `exit code ${result.code}`}`);
}

// Runs a git command that changes the repository; with --dry-run it is only printed.
function change(repo, dryRun, args) {
  if (!dryRun) return git(repo, args);
  console.log(`  git ${args.map(shellQuote).join(' ')}`);
  return { code: 0, out: '', err: '' };
}

function announceDryRun(repo, dryRun) {
  if (dryRun) console.log(`Dry run: nothing is changed. From ${repo.main} these git commands would run:`);
}

// The worktree root hangs off the MAIN checkout, found through the shared git directory. That gives the same answer
// in the main checkout and inside any task worktree, which --show-toplevel would not.
function locateRepo() {
  const found = spawnGit(process.cwd(), ['rev-parse', '--git-common-dir']);
  if (found.code !== 0) throw new Error('Not inside a git checkout. Run this from the CardOS checkout or one of its worktrees.');
  const commonDir = resolve(process.cwd(), found.out);
  if (basename(commonDir) !== '.git') {
    throw new Error(`Cannot find the main checkout: expected a git directory named .git, got ${commonDir}.`);
  }
  const main = dirname(commonDir);
  return { main, root: join(dirname(main), `${basename(main)}-wt`) };
}

function checkTask(task) {
  if (!taskPattern.test(task)) {
    throw new Error(`Invalid task name '${task}': use ${taskPattern.source} (2-48 lowercase letters, digits or hyphens).`);
  }
  return task;
}

function checkAgent(agent, flag) {
  if (!agents.includes(agent)) {
    throw new Error(`${flag} must be one of: ${agents.join(', ')} (${agent === undefined ? 'it is required' : `got '${agent}'`}).`);
  }
  return agent;
}

// HEAD, @ and @{...} name different commits in different checkouts; git would read them in the main checkout, and the
// recorded aiBase would drift with it.
function checkBase(base) {
  if (base === '' || base.startsWith('-') || /^(@|[A-Z_]*HEAD\b)|@\{/.test(base)) {
    throw new Error(`Invalid --base '${base}': pass a branch, tag or commit, not a checkout-relative ref such as HEAD.`);
  }
  return base;
}

function buildRequest(name, task, values) {
  const request = { task: task === undefined ? undefined : checkTask(task), dryRun: values['dry-run'] === true };
  if (name === 'new' || name === 'remove') request.agent = checkAgent(values.agent, '--agent');
  if (name === 'new') request.base = checkBase(values.base ?? defaultBase);
  if (name === 'handoff') {
    request.from = checkAgent(values.from, '--from');
    request.to = checkAgent(values.to, '--to');
    if (request.from === request.to) throw new Error(`--from and --to must differ (both are '${request.from}').`);
  }
  return request;
}

function readCommandLine(argv) {
  let parsed;
  try {
    parsed = parseArgs({
      args: argv,
      allowPositionals: true,
      options: {
        agent: { type: 'string' },
        base: { type: 'string' },
        from: { type: 'string' },
        to: { type: 'string' },
        'dry-run': { type: 'boolean' },
        help: { type: 'boolean', short: 'h' },
      },
    });
  } catch (error) {
    const reason = error.message.replace(/\. To specify a positional.*$/s, '').replace(/\.+$/, '');
    throw new Error(`${reason}. Run with --help for usage.`);
  }
  const [name, ...rest] = parsed.positionals;
  if (parsed.values.help || name === 'help') return { help: true };
  if (name === undefined) throw new Error(`Missing command.\n\n${usage}`);
  if (!Object.hasOwn(commands, name)) throw new Error(`Unknown command '${name}'.\n\n${usage}`);
  const command = commands[name];
  const stray = Object.keys(parsed.values).filter((key) => !command.options.includes(key));
  if (stray.length > 0) {
    throw new Error(`${stray.map((key) => `--${key}`).join(' and ')} not valid for '${name}'. Run with --help for usage.`);
  }
  if (rest.length !== (command.task ? 1 : 0)) {
    throw new Error(command.task ? `'${name}' needs exactly one <task>. Run with --help for usage.` : `'${name}' takes no arguments.`);
  }
  return { name, request: buildRequest(name, rest[0], parsed.values) };
}

// ai/<agent>/<task> -> { agent, task }; any other branch name is not managed by this helper.
function parseManaged(branch) {
  const match = /^ai\/([^/]+)\/([^/]+)$/.exec(branch ?? '');
  return match ? { agent: match[1], task: match[2] } : null;
}

function managedBranches(repo) {
  const refs = git(repo, ['for-each-ref', '--format=%(refname)', 'refs/heads/ai/']);
  return refs.out.split('\n').filter(Boolean).map((ref) => ref.slice('refs/heads/'.length)).filter((name) => parseManaged(name));
}

const taskBranches = (repo, task) => managedBranches(repo).filter((name) => parseManaged(name).task === task);
const branchExists = (repo, branch) => git(repo, ['show-ref', '--verify', '--quiet', `refs/heads/${branch}`]).code === 0;

function resolveCommit(repo, ref) {
  const resolved = git(repo, ['rev-parse', '--verify', '--quiet', `${ref}^{commit}`]);
  return resolved.code === 0 ? resolved.out : null;
}

function readConfig(repo, branch, name) {
  const value = git(repo, ['config', '--get', `branch.${branch}.${name}`]);
  return value.code === 0 ? value.out : null;
}

// `git worktree add -b` creates the branch before the worktree, so a failure in between leaves an empty branch behind that
// keeps the task name taken. Undo exactly that: the ref is deleted only if it did not exist a moment ago, still sits on
// the commit it was created at and is checked out nowhere, so no work can be lost.
function addWorktree(repo, dryRun, branch, path, start) {
  const existed = branchExists(repo, branch);
  const added = change(repo, dryRun, ['worktree', 'add', '-b', branch, path, start]);
  if (added.code === 0) return;
  const tip = resolveCommit(repo, start);
  const empty = tip !== null && resolveCommit(repo, `refs/heads/${branch}`) === tip;
  const checkedOut = readWorktrees(repo).some((tree) => tree.branch === branch);
  if (!existed && empty && !checkedOut) git(repo, ['update-ref', '-d', `refs/heads/${branch}`, tip]);
  throw gitFailure('git worktree add', added);
}

function recordProvenance(repo, dryRun, branch, values) {
  for (const [name, value] of Object.entries(values)) {
    const key = `branch.${branch}.${name}`;
    const saved = change(repo, dryRun, ['config', key, value]);
    if (saved.code !== 0) throw gitFailure(`git config ${key}`, saved);
  }
}

// One entry per worktree from `git worktree list --porcelain`; the main checkout comes first.
function readWorktrees(repo) {
  const listed = git(repo, ['worktree', 'list', '--porcelain']);
  if (listed.code !== 0) throw gitFailure('git worktree list', listed);
  return listed.out.split('\n\n').map((block) => {
    const tree = { path: '', branch: null };
    for (const line of block.split('\n')) {
      if (line.startsWith('worktree ')) tree.path = line.slice('worktree '.length);
      else if (line.startsWith('branch ')) tree.branch = line.slice('branch '.length).replace(/^refs\/heads\//, '');
    }
    return tree;
  });
}

function isDirty(repo, path) {
  const status = git(repo, ['-C', path, 'status', '--porcelain', '--untracked-files=normal']);
  if (status.code !== 0) throw gitFailure(`git status in ${path}`, status);
  return status.out !== '';
}

// `git worktree remove` refuses untracked and modified files but silently deletes IGNORED ones, and here those can be secrets
// or statements. Only regenerable output is safe to lose: the top-level build folders from .gitignore, per-checkout agent
// state (Spec Kit's pointer, Claude Code's local settings, Serena's folder) and OS clutter at any depth. Everything else is
// refused and only COUNTED: statement file names are real data.
const disposableFolders = new Set([
  'node_modules/', 'dist/', '.astro/', '.cache/', '.vite/', 'coverage/', 'test-results/', 'playwright-report/',
]);
const isDisposable = (path) => disposableFolders.has(path) || path.startsWith('.serena/')
  || ['.specify/feature.json', '.claude/settings.local.json'].includes(path)
  || ['.DS_Store', 'Thumbs.db'].includes(path.split('/').pop());

// git quotes unusual paths in porcelain output; such a path matches nothing above, so it counts as not disposable.
// --ignored=matching lists a folder holding only OS clutter as its files, not as the folder.
function countIgnored(repo, path) {
  const status = git(repo, ['-C', path, 'status', '--porcelain', '--ignored=matching', '--untracked-files=normal']);
  if (status.code !== 0) throw gitFailure(`git status in ${path}`, status);
  return status.out.split('\n').filter((line) => line.startsWith('!! ') && !isDisposable(line.slice(3))).length;
}

function ignoredError(path, count) {
  return new Error(`${path} has ${count} ignored file(s) or folder(s) that git worktree remove would delete without asking `
    + '(anything beyond build output such as node_modules and dist). Ask the maintainer before moving or deleting them; '
    + `the maintainer can list them with git -C ${shellQuote(path)} status --ignored.`);
}

const stateFileOf = (worktree, task) => join(worktree, '.ai', 'tasks', `${task}.md`);
const relativeWorktree = (repo, agent, task) => `../${basename(repo.root)}/${agent}-${task}`;

function today() {
  const now = new Date();
  const pad = (value) => String(value).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

function stateFileText(repo, { task, agent, branch, base, date, state, history }) {
  return [
    `# Task: ${task}`,
    '',
    `- **Owner:** ${agent}`,
    `- **Branch:** ${branch}`,
    `- **Base:** ${base}`,
    `- **Worktree:** ${relativeWorktree(repo, agent, task)}`,
    `- **Created:** ${date}`,
    `- **State:** ${state}`,
    '- **Next step:** (fill in)',
    '',
    '## History',
    '',
    history,
    '',
  ].join('\n');
}

// The state file is repo content, so a committed symlink must not redirect a write outside the new worktree.
function assertInside(worktree, target) {
  let inside = false;
  try {
    inside = isInside(realpathSync(target), realpathSync(worktree));
  } catch { /* A dangling link or a missing path is not safe to write. */ }
  if (!inside) throw new Error(`Refusing to write ${target}: it resolves outside ${worktree}. The worktree itself was created.`);
}

// Writes a fresh .ai/tasks/<task>.md into a new worktree and leaves it uncommitted; never overwrites a file.
function writeStateFile(repo, worktree, details) {
  const file = stateFileOf(worktree, details.task);
  mkdirSync(dirname(file), { recursive: true });
  assertInside(worktree, dirname(file));
  writeFileSync(file, stateFileText(repo, details), { flag: 'wx' });
}

// Adds a line to the "## History" section (creating it if absent) and keeps any later sections intact.
function appendHistory(text, entry) {
  const lines = text.trimEnd().split('\n');
  const start = lines.findIndex((line) => /^##\s+History\s*$/.test(line));
  if (start === -1) return `${lines.join('\n')}\n\n## History\n\n${entry}\n`;
  let end = lines.findIndex((line, index) => index > start && /^##\s/.test(line));
  if (end === -1) end = lines.length;
  while (end > start + 1 && lines[end - 1].trim() === '') end -= 1;
  lines.splice(end, 0, ...(end === start + 1 ? ['', entry] : [entry]));
  return `${lines.join('\n')}\n`;
}

// Rewrites the receiving worktree's copy of the task file for its new owner. `missing` lists fields it could not find.
function updateStateFile(repo, worktree, { task, to, source, target, base }) {
  const file = stateFileOf(worktree, task);
  const date = today();
  const entry = `- ${date} handoff: ${source} → ${target}`;
  if (!pathTaken(file)) {
    writeStateFile(repo, worktree, { task, agent: to, branch: target, base, date, state: '(fill in)', history: entry });
    return { created: true, missing: [] };
  }
  assertInside(worktree, file);
  let text = readFileSync(file, 'utf8');
  const missing = [];
  const fields = { Owner: to, Branch: target, Worktree: relativeWorktree(repo, to, task) };
  for (const [name, value] of Object.entries(fields)) {
    const line = new RegExp(`^(- \\*\\*${name}:\\*\\*).*$`, 'm');
    if (line.test(text)) text = text.replace(line, (_, label) => `${label} ${value}`);
    else missing.push(name);
  }
  writeFileSync(file, appendHistory(text, entry));
  return { created: false, missing };
}

function printNextSteps(agent, task, path, handedOff) {
  const file = `.ai/tasks/${task}.md`;
  console.log(`\nNext steps for ${agent}:`);
  console.log(`  1. cd ${shellQuote(path)}`);
  console.log('  2. Install dependencies with `npm ci` (MEDIUM risk: ask the maintainer first).');
  console.log(`  3. Start \`${agent}\` there.`);
  if (handedOff) {
    console.log(`  4. Read \`AGENTS.md\`, then \`.ai/CURRENT.md\` and \`${file}\`, then continue the work.`);
    console.log(`  5. Commit \`${file}\` (updated for this handoff, left uncommitted) with your first commit.`);
  } else {
    console.log(`  4. Keep \`${file}\` current (state and next step), and commit it with your first commit.`);
  }
}

function warnWithoutRules(base, hasRules) {
  if (hasRules) return;
  console.warn(`⚠ ${base} has no AGENTS.md yet; agents in this worktree won't load the shared rules. `
    + 'Use --base with a branch that has them.');
}

function taskTakenMessage(task, agent, existing) {
  if (existing.includes(branchName(agent, task))) {
    return `Task '${task}' already exists as ${existing.join(', ')}. Pick a different task name.`;
  }
  const owner = parseManaged(existing[0]).agent;
  return `Task '${task}' is already owned by ${existing.join(', ')}. `
    + `Use handoff to pass it on: ${tool} handoff ${task} --from ${owner} --to ${agent}`;
}

function createWorktree(repo, { task, agent, base, dryRun }) {
  const branch = branchName(agent, task);
  const path = join(repo.root, `${agent}-${task}`);
  if (!resolveCommit(repo, base)) {
    throw new Error(`Base ref '${base}' does not resolve to a commit. Pass --base <ref> to choose another.`);
  }
  const existing = taskBranches(repo, task);
  if (existing.length > 0) throw new Error(taskTakenMessage(task, agent, existing));
  if (pathTaken(path)) throw new Error(`Path already exists: ${path}`);
  const hasRules = git(repo, ['cat-file', '-e', `${base}:AGENTS.md`]).code === 0;

  announceDryRun(repo, dryRun);
  addWorktree(repo, dryRun, branch, path, base);
  recordProvenance(repo, dryRun, branch, { aiBase: base, aiOwner: agent });
  if (dryRun) {
    console.log(`It would then write ${stateFileOf(path, task)} (left uncommitted), unless the base already has one.`);
    warnWithoutRules(base, hasRules);
    return;
  }

  const date = today();
  const existed = pathTaken(stateFileOf(path, task));
  if (!existed) {
    const history = `- ${date} new: ${branch} from ${base}`;
    writeStateFile(repo, path, { task, agent, branch, base, date, state: 'In progress', history });
  }
  console.log(`✓ Created ${branch} from ${base}`);
  console.log(`  path:  ${path}`);
  console.log(`  state: .ai/tasks/${task}.md ${existed ? `already exists in ${base}; left unchanged` : 'written (uncommitted)'}`);
  warnWithoutRules(base, hasRules);
  printNextSteps(agent, task, path, false);
}

function handoff(repo, { task, from, to, dryRun }) {
  const source = branchName(from, task);
  const target = branchName(to, task);
  const path = join(repo.root, `${to}-${task}`);
  const tip = resolveCommit(repo, `refs/heads/${source}`);
  if (!tip) throw new Error(`Branch ${source} does not exist, so there is nothing to hand off.`);
  // Mid-rebase the source worktree has a detached HEAD, so it is also found by its conventional path.
  const sourcePath = join(repo.root, `${from}-${task}`);
  const sourceTree = readWorktrees(repo).find((tree) => tree.branch === source || tree.path === sourcePath);
  if (sourceTree && sourceTree.branch !== source) {
    throw new Error(`${sourceTree.path} is not on ${source} (detached HEAD, for example mid-rebase). `
      + `Finish or abort that, then commit, so that ${source} holds all the work.`);
  }
  if (sourceTree && existsSync(sourceTree.path) && isDirty(repo, sourceTree.path)) {
    throw new Error(`${sourceTree.path} has uncommitted changes. ${dirtyAdvice}\n`
      + `A handoff carries only commits, so ${source} must be clean first.`);
  }
  if (branchExists(repo, target)) {
    throw new Error(`Branch ${target} already exists: ${to} already has this task. `
      + `If that work is finished, remove it first: ${tool} remove ${task} --agent ${to}`);
  }
  const base = readConfig(repo, source, 'aiBase');
  if (!base) throw new Error(`${source} has no recorded aiBase. Record one first: git config branch.${source}.aiBase <ref>`);
  if (pathTaken(path)) throw new Error(`Path already exists: ${path}`);

  announceDryRun(repo, dryRun);
  addWorktree(repo, dryRun, target, path, `refs/heads/${source}`);
  recordProvenance(repo, dryRun, target, { aiBase: base, aiOwner: to, aiHandoffFrom: source });
  if (dryRun) {
    console.log(`It would then update ${stateFileOf(path, task)} in the new worktree (left uncommitted).`);
    return;
  }

  const state = updateStateFile(repo, path, { task, to, source, target, base });
  const where = sourceTree ? ` at ${sourceTree.path}` : ' (it has no worktree)';
  console.log(`✓ Handed off '${task}' from ${from} to ${to}`);
  console.log(`  new:    ${target} at ${path} (starts at ${tip.slice(0, 8)}, base ${base})`);
  console.log(`  source: ${source} left untouched${where}; ${from} should stop working there`);
  console.log(state.created
    ? `  state:  .ai/tasks/${task}.md was not in ${source}, so a new one was written in the new worktree (uncommitted)`
    : `  state:  .ai/tasks/${task}.md updated in the new worktree (uncommitted)`);
  if (state.missing.length > 0) {
    console.warn(`⚠ .ai/tasks/${task}.md has no line for: ${state.missing.join(', ')}; update them by hand.`);
  }
  printNextSteps(to, task, path, true);
}

// Why a branch cannot be deleted yet, or null when it is merged into its aiBase.
function mergeBlocker(repo, branch, base) {
  if (!base) return 'it has no recorded aiBase to compare with';
  const compared = git(repo, ['merge-base', '--is-ancestor', branch, base]);
  if (compared.code === 0) return null;
  return compared.code === 1 ? `it is not merged into ${base}` : `it could not be compared with ${base} (${compared.err})`;
}

// A branch that took this one over through `handoff` and still contains all of its commits.
function findSuccessor(repo, branch, task) {
  for (const name of taskBranches(repo, task)) {
    if (name === branch || readConfig(repo, name, 'aiHandoffFrom') !== branch) continue;
    if (git(repo, ['merge-base', '--is-ancestor', branch, name]).code !== 0) continue;
    const tree = readWorktrees(repo).find((entry) => entry.branch === name);
    return { name, path: tree && existsSync(tree.path) ? tree.path : null };
  }
  return null;
}

// Deletes the branch only with `git branch -d`, never -D, and only when its work is safely elsewhere: in the
// successor it was handed to, or else merged into its aiBase. `branch -d` checks the merge against the HEAD of the tree it
// runs in, so it runs in the successor's worktree, or in the worktree that has the aiBase checked out.
function removeBranch(repo, dryRun, branch, task) {
  const kept = (why) => console.log(`Branch ${branch} ${dryRun ? 'would be kept' : 'kept'}: ${why}.`);
  const successor = findSuccessor(repo, branch, task);
  let args = ['branch', '-d', branch];
  let safe;
  if (successor) {
    if (!successor.path) {
      kept(`its successor ${successor.name} has no worktree to check the merge against`);
      return;
    }
    args = ['-C', successor.path, ...args];
    safe = `all its commits are in its successor ${successor.name}`;
  } else {
    const base = readConfig(repo, branch, 'aiBase');
    const blocker = mergeBlocker(repo, branch, base);
    if (blocker) {
      kept(blocker);
      return;
    }
    // With no such worktree it stays in the main checkout, where git may still refuse.
    const baseName = base.replace(/^refs\/heads\//, '');
    const baseTree = readWorktrees(repo).find((entry) => entry.branch === baseName && existsSync(entry.path));
    if (baseTree) args = ['-C', baseTree.path, ...args];
    safe = `merged into ${base}`;
  }
  const deleted = change(repo, dryRun, args);
  if (deleted.code !== 0) kept(`git branch -d refused it (${deleted.err})`);
  else if (!dryRun) console.log(`✓ Deleted branch ${branch} (${safe})`);
}

function removeWorktree(repo, { task, agent, dryRun }) {
  const branch = branchName(agent, task);
  const tree = readWorktrees(repo).find((entry) => entry.branch === branch);
  if (!tree && !branchExists(repo, branch)) throw new Error(`Nothing to remove: there is no worktree or branch for ${branch}.`);
  if (tree && isInside(process.cwd(), tree.path)) {
    throw new Error(`You are inside ${tree.path}. Run this from another directory, for example ${repo.main}.`);
  }
  const present = Boolean(tree) && existsSync(tree.path);
  const dirtyError = () => new Error(`${tree.path} has uncommitted changes. ${dirtyAdvice}`);
  if (present && isDirty(repo, tree.path)) throw dirtyError();
  const ignored = present ? countIgnored(repo, tree.path) : 0;
  if (ignored > 0) throw ignoredError(tree.path, ignored);

  announceDryRun(repo, dryRun);
  if (tree) {
    const removed = change(repo, dryRun, ['worktree', 'remove', tree.path]);
    if (removed.code !== 0) {
      throw present && isDirty(repo, tree.path) ? dirtyError() : gitFailure('git worktree remove', removed);
    }
    if (!dryRun) console.log(`✓ Removed worktree ${tree.path}`);
  } else if (!dryRun) {
    console.log(`No worktree is checked out on ${branch}.`);
  }
  removeBranch(repo, dryRun, branch, task);
}

function treeState(repo, path) {
  if (!path) return 'no worktree';
  if (!existsSync(path)) return 'missing';
  try {
    return isDirty(repo, path) ? 'dirty' : 'clean';
  } catch {
    return 'unreadable'; // A damaged worktree must not hide the others from the listing.
  }
}

function commitsAhead(repo, branch, base) {
  if (!base) return '?';
  const counted = git(repo, ['rev-list', '--count', `${base}..${branch}`]);
  return counted.code === 0 ? counted.out : '?';
}

function summarize(repo, branch, path) {
  const managed = parseManaged(branch);
  const base = managed ? readConfig(repo, branch, 'aiBase') : null;
  return {
    managed: managed !== null,
    agent: managed?.agent ?? '',
    task: managed?.task ?? '',
    cells: [
      managed ? managed.agent : 'not managed',
      managed ? managed.task : '-',
      branch ?? '(detached)',
      path ?? '-',
      treeState(repo, path),
      managed ? commitsAhead(repo, branch, base) : '-',
      (managed && readConfig(repo, branch, 'aiHandoffFrom')) || '-',
    ],
  };
}

function printTable(header, rows) {
  const widths = header.map((title, column) => Math.max(title.length, ...rows.map((row) => row[column].length)));
  for (const cells of [header, ...rows]) console.log(cells.map((cell, column) => cell.padEnd(widths[column])).join('  ').trimEnd());
}

function listWorktrees(repo) {
  const trees = readWorktrees(repo);
  const checkedOut = new Set(trees.map((tree) => tree.branch));
  const rows = trees.map((tree) => summarize(repo, tree.branch, tree.path));
  // A branch kept by `remove` has no worktree but still owns its task name, so its ownership stays visible.
  for (const branch of managedBranches(repo)) {
    if (!checkedOut.has(branch)) rows.push(summarize(repo, branch, null));
  }
  rows.sort((a, b) => Number(a.managed) - Number(b.managed) || a.task.localeCompare(b.task) || a.agent.localeCompare(b.agent));

  console.log(`AI worktrees (root: ${repo.root})\n`);
  printTable(['AGENT', 'TASK', 'BRANCH', 'PATH', 'STATE', 'AHEAD', 'HANDOFF FROM'], rows.map((row) => row.cells));
  console.log('\nAHEAD counts commits on the branch that are not in its aiBase.');
  if (!rows.some((row) => row.managed)) console.log(`No AI worktrees yet. Create one: ${tool} new <task> --agent <claude|codex>`);
}

async function main() {
  const parsed = readCommandLine(process.argv.slice(2));
  if (parsed.help) {
    console.log(usage);
    return;
  }
  commands[parsed.name].run(locateRepo(), parsed.request);
}

main().catch((error) => {
  console.error(`✗ ${error.message}`);
  process.exitCode = 1;
});
