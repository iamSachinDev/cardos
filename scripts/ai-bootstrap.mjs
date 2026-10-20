#!/usr/bin/env node
// Preview or create a small, generic agent-instruction foundation in another Git repository.
// Deliberately excludes app-specific permissions, CI, services, and dependency installation.
import { execFileSync } from 'node:child_process';
import { constants } from 'node:fs';
import { closeSync, lstatSync, mkdirSync, openSync, readFileSync, realpathSync, rmdirSync, unlinkSync, writeSync } from 'node:fs';
import { basename, isAbsolute, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const templateRoot = fileURLToPath(new URL('../templates/ai-bootstrap/', import.meta.url));
const files = [
  ['AGENTS.md', 'AGENTS.md.tmpl'],
  ['CLAUDE.md', 'CLAUDE.md.tmpl'],
  ['.ai/INDEX.md', 'INDEX.md.tmpl'],
  ['.ai/CONTEXT.md', 'CONTEXT.md.tmpl'],
  ['.ai/CURRENT.md', 'CURRENT.md.tmpl'],
  ['.ai/runbooks/handoff.md', 'handoff.md.tmpl'],
];
const usage = 'Usage: node scripts/ai-bootstrap.mjs --target /absolute/path/to/clean-git-repo [--apply]\nPreview is the default. --apply creates only missing files; it never overwrites.';

function parseArgs(args) {
  if (args.length === 1 && (args[0] === '--help' || args[0] === '-h')) return { help: true };
  let target;
  let apply = false;
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--target' && target === undefined && args[index + 1] !== undefined) {
      target = args[++index];
    } else if (arg === '--apply' && !apply) {
      apply = true;
    } else {
      throw new Error(`Invalid argument: ${arg}. ${usage}`);
    }
  }
  if (!target || !isAbsolute(target)) throw new Error(`--target needs an absolute path. ${usage}`);
  return { target, apply };
}

function git(target, args) {
  const env = { ...process.env, GIT_OPTIONAL_LOCKS: '0' };
  for (const name of ['GIT_DIR', 'GIT_WORK_TREE', 'GIT_INDEX_FILE', 'GIT_COMMON_DIR']) delete env[name];
  for (const name of Object.keys(env)) if (name.startsWith('GIT_CONFIG_')) delete env[name];
  return execFileSync('git', ['-c', 'core.fsmonitor=false', '-C', target, ...args], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    env,
  }).trim();
}

function inspectTarget(target) {
  const canonical = realpathSync(target);
  if (target !== canonical || lstatSync(target).isSymbolicLink()) {
    throw new Error('Target must be a canonical directory path, not a symlink.');
  }
  if (!lstatSync(target).isDirectory()) throw new Error('Target must be a directory.');
  let top;
  try {
    top = realpathSync(git(target, ['rev-parse', '--show-toplevel']));
  } catch {
    throw new Error('Target must be the top level of an existing Git working tree.');
  }
  if (top !== target) throw new Error('Target must be the top level of an existing Git working tree.');
  if (git(target, ['status', '--porcelain', '--untracked-files=normal']) !== '') {
    throw new Error('Target Git working tree must be clean.');
  }
}

function existing(path) {
  try {
    return lstatSync(path);
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
}

function ignored(target, destination) {
  try {
    git(target, ['check-ignore', '-q', '--no-index', '--', destination]);
    return true;
  } catch (error) {
    if (error.status === 1) return false;
    throw error;
  }
}

function destinations(target) {
  const dirs = ['.ai', '.ai/runbooks'];
  for (const dir of dirs) {
    const stat = existing(join(target, dir));
    if (stat && (!stat.isDirectory() || stat.isSymbolicLink())) {
      throw new Error(`Unsafe destination directory: ${dir}`);
    }
  }
  for (const [path] of files) {
    if (existing(join(target, path))) throw new Error(`Destination already exists: ${path}`);
    if (ignored(target, path)) throw new Error(`Destination is Git-ignored: ${path}`);
  }
  return dirs;
}

function applyTemplates(target, dirs) {
  const madeDirs = [];
  const madeFiles = [];
  try {
    for (const dir of dirs) {
      const path = join(target, dir);
      if (!existing(path)) {
        mkdirSync(path, { mode: 0o755 });
        madeDirs.push(path);
      }
    }
    for (const [destination, template] of files) {
      const path = join(target, destination);
      const source = join(templateRoot, template);
      const content = readFileSync(source);
      const fd = openSync(path, constants.O_CREAT | constants.O_EXCL | constants.O_WRONLY | constants.O_NOFOLLOW, 0o644);
      madeFiles.push(path);
      try {
        let offset = 0;
        while (offset < content.length) {
          const written = writeSync(fd, content, offset, content.length - offset);
          if (written === 0) throw new Error(`Could not finish writing ${destination}`);
          offset += written;
        }
      } finally {
        closeSync(fd);
      }
    }
  } catch (error) {
    for (const path of madeFiles.reverse()) unlinkSync(path);
    for (const path of madeDirs.reverse()) rmdirSync(path);
    throw error;
  }
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    console.log(usage);
    return;
  }
  const target = options.target;
  inspectTarget(target);
  const dirs = destinations(target);
  console.log(`${options.apply ? 'Create' : 'Preview'} agent foundation in ${basename(target)}:`);
  for (const [path] of files) console.log(`  ${path}`);
  if (!options.apply) {
    console.log('No files changed. Pass --apply to create this exact set.');
    return;
  }
  applyTemplates(target, dirs);
  console.log('Created six files. Review project-specific TODOs before relying on the rules.');
}

try {
  main();
} catch (error) {
  console.error(`Bootstrap refused: ${error.message}`);
  process.exitCode = 1;
}
