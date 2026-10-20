import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { chmodSync, existsSync, lstatSync, mkdtempSync, mkdirSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const script = fileURLToPath(new URL('./ai-bootstrap.mjs', import.meta.url));
const expected = [
  'AGENTS.md',
  'CLAUDE.md',
  '.ai/INDEX.md',
  '.ai/CONTEXT.md',
  '.ai/CURRENT.md',
  '.ai/runbooks/handoff.md',
];

function git(path, ...args) {
  return execFileSync('git', ['-C', path, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

function repo(t) {
  const path = realpathSync(mkdtempSync(join(tmpdir(), 'ai-bootstrap-test-')));
  t.after(() => rmSync(path, { recursive: true, force: true }));
  git(path, 'init', '-q');
  git(path, 'config', 'user.name', 'Synthetic Test');
  git(path, 'config', 'user.email', 'test@example.invalid');
  return path;
}

function run(...args) {
  return spawnSync(process.execPath, [script, ...args], { encoding: 'utf8' });
}

test('preview leaves a clean repository unchanged', (t) => {
  const target = repo(t);
  const result = run('--target', target);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Preview agent foundation/);
  assert.equal(git(target, 'status', '--porcelain'), '');
  assert.equal(existsSync(join(target, 'AGENTS.md')), false);
});

test('apply creates only the six generic files and their links resolve', (t) => {
  const target = repo(t);
  const result = run('--target', target, '--apply');
  assert.equal(result.status, 0, result.stderr);
  for (const path of expected) assert.equal(lstatSync(join(target, path)).isFile(), true, path);
  const index = readFileSync(join(target, '.ai/INDEX.md'), 'utf8');
  for (const match of index.matchAll(/\]\(([^)]+)\)/g)) {
    assert.equal(existsSync(join(target, '.ai', match[1])), true, match[1]);
  }
  assert.match(readFileSync(join(target, 'CLAUDE.md'), 'utf8'), /^@AGENTS\.md\n/);
  git(target, 'add', ...expected);
  git(target, 'commit', '-qm', 'add synthetic foundation');
  const second = run('--target', target, '--apply');
  assert.equal(second.status, 1);
  assert.match(second.stderr, /Destination already exists/);
});

test('dirty, nested, non-repository and symlink targets are refused', (t) => {
  const target = repo(t);
  writeFileSync(join(target, 'untracked.txt'), 'synthetic');
  assert.match(run('--target', target, '--apply').stderr, /must be clean/);
  assert.equal(existsSync(join(target, 'AGENTS.md')), false);
  git(target, 'add', 'untracked.txt');
  git(target, 'commit', '-qm', 'synthetic baseline');

  mkdirSync(join(target, 'nested'));
  assert.match(run('--target', join(target, 'nested')).stderr, /top level/);

  const nonRepo = realpathSync(mkdtempSync(join(tmpdir(), 'ai-bootstrap-no-git-')));
  t.after(() => rmSync(nonRepo, { recursive: true, force: true }));
  assert.match(run('--target', nonRepo).stderr, /existing Git working tree/);

  symlinkSync('untracked.txt', join(target, 'AGENTS.md'));
  git(target, 'add', 'AGENTS.md');
  git(target, 'commit', '-qm', 'synthetic symlink');
  assert.match(run('--target', target, '--apply').stderr, /Destination already exists/);
  assert.equal(lstatSync(join(target, 'AGENTS.md')).isSymbolicLink(), true);
});

test('invalid options fail before any write', (t) => {
  const target = repo(t);
  assert.equal(run('--target', target, '--unknown').status, 1);
  assert.equal(run('--target', 'relative/path', '--apply').status, 1);
  assert.equal(existsSync(join(target, 'AGENTS.md')), false);
});

test('a symlinked destination directory cannot redirect generated files', (t) => {
  const target = repo(t);
  const outside = realpathSync(mkdtempSync(join(tmpdir(), 'ai-bootstrap-outside-')));
  t.after(() => rmSync(outside, { recursive: true, force: true }));
  symlinkSync(outside, join(target, '.ai'));
  git(target, 'add', '.ai');
  git(target, 'commit', '-qm', 'synthetic symlinked directory');
  const result = run('--target', target, '--apply');
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Unsafe destination directory/);
  assert.equal(existsSync(join(target, 'AGENTS.md')), false);
  assert.equal(existsSync(join(outside, 'INDEX.md')), false);
});

test('Git-ignored destinations are refused before any file is created', (t) => {
  const target = repo(t);
  writeFileSync(join(target, '.gitignore'), '.ai/\n');
  git(target, 'add', '.gitignore');
  git(target, 'commit', '-qm', 'ignore generated knowledge files');
  const result = run('--target', target, '--apply');
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Git-ignored: \.ai\/INDEX\.md/);
  assert.equal(existsSync(join(target, 'AGENTS.md')), false);
});

test('a symlinked target and a symlink-dot-dot path are refused', (t) => {
  const target = repo(t);
  const aliases = realpathSync(mkdtempSync(join(tmpdir(), 'ai-bootstrap-alias-')));
  t.after(() => rmSync(aliases, { recursive: true, force: true }));
  const alias = join(aliases, 'link');
  symlinkSync(target, alias);
  assert.match(run('--target', alias, '--apply').stderr, /canonical directory path/);
  assert.match(run('--target', `${alias}/..`, '--apply').stderr, /canonical directory path/);
  assert.equal(existsSync(join(target, 'AGENTS.md')), false);
});

test('a failed file write rolls back the newly opened active rules file', (t) => {
  const target = repo(t);
  const helper = realpathSync(mkdtempSync(join(tmpdir(), 'ai-bootstrap-write-fail-')));
  t.after(() => rmSync(helper, { recursive: true, force: true }));
  const preload = join(helper, 'fail-write.cjs');
  writeFileSync(preload, [
    "const fs = require('node:fs');",
    "const { syncBuiltinESMExports } = require('node:module');",
    'const original = fs.writeSync;',
    "fs.writeSync = (fd, ...args) => { if (fd > 2) throw new Error('synthetic write failure'); return original(fd, ...args); };",
    'syncBuiltinESMExports();',
  ].join('\n'));
  const result = spawnSync(process.execPath, ['--require', preload, script, '--target', target, '--apply'], { encoding: 'utf8' });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /synthetic write failure/);
  assert.equal(existsSync(join(target, 'AGENTS.md')), false);
  assert.equal(existsSync(join(target, '.ai')), false);
});

test('preview never runs a target repository filesystem monitor', (t) => {
  const target = repo(t);
  const helper = realpathSync(mkdtempSync(join(tmpdir(), 'ai-bootstrap-fsmonitor-')));
  t.after(() => rmSync(helper, { recursive: true, force: true }));
  const monitor = join(helper, 'monitor.sh');
  const marker = join(helper, 'ran');
  writeFileSync(monitor, '#!/bin/sh\n: > "$BOOTSTRAP_FSMONITOR_MARKER"\nexit 0\n');
  chmodSync(monitor, 0o755);
  git(target, 'config', 'core.fsmonitor', monitor);
  const result = spawnSync(process.execPath, [script, '--target', target], {
    encoding: 'utf8',
    env: { ...process.env, BOOTSTRAP_FSMONITOR_MARKER: marker },
  });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(existsSync(marker), false);
  assert.equal(existsSync(join(target, 'AGENTS.md')), false);
});
