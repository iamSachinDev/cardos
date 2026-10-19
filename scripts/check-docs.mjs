#!/usr/bin/env node
// Phase 8 documentation checks. Uses only Git and Node; no network or app data.
import { spawnSync } from 'node:child_process';
import { lstatSync, readFileSync } from 'node:fs';
import { dirname, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function git(args) {
  const result = spawnSync('git', args, { cwd: root, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
  if (result.error || result.status !== 0) throw new Error(`git ${args[0]} failed; documentation check incomplete`);
  return result.stdout;
}

function repositoryPaths() {
  return git(['ls-files', '-z', '--cached', '--others', '--exclude-standard']).split('\0').filter(Boolean);
}

const isDoc = (name) => name === 'README.md' || name === 'AGENTS.md' || name === 'CLAUDE.md' || /^(\.ai|docs|specs)\/.*\.md$/.test(name);
const asPosix = (name) => name.split(sep).join('/');

function markdownLines(name, baseDir) {
  const file = resolve(baseDir, name);
  if (lstatSync(file).isSymbolicLink()) throw new Error('tracked Markdown symlink is not checked');
  return readFileSync(file, 'utf8').split(/\r?\n/);
}

// GitHub-style heading IDs, including duplicate-heading suffixes. Explicit HTML anchors are also accepted.
function anchorsFor(lines) {
  const anchors = new Set();
  const counts = new Map();
  let fence = null;
  for (const line of lines) {
    const marker = line.match(/^\s*(`{3,}|~{3,})/);
    if (marker) {
      if (!fence) fence = [marker[1][0], marker[1].length];
      else if (marker[1][0] === fence[0] && marker[1].length >= fence[1]) fence = null;
      continue;
    }
    if (fence) continue;
    for (const match of line.matchAll(/<a\s+(?:id|name)=["']([^"']+)["'][^>]*>/gi)) anchors.add(match[1]);
    const heading = line.match(/^\s{0,3}#{1,6}\s+(.+?)\s*#*\s*$/);
    if (!heading) continue;
    const slug = heading[1]
      .replace(/!?\[([^\]]+)\]\([^)]*\)/g, '$1')
      .replace(/<[^>]*>|&[a-z0-9#]+;/gi, '')
      .replace(/[`*_~]/g, '')
      .toLowerCase()
      .replace(/[^\p{L}\p{N}_ -]/gu, '')
      .trim()
      .replace(/ /g, '-');
    const count = counts.get(slug) ?? 0;
    anchors.add(count ? `${slug}-${count}` : slug);
    counts.set(slug, count + 1);
  }
  return anchors;
}

function codeRanges(line) {
  return [...line.matchAll(/(`+)(.*?)\1/g)].map((m) => [m.index, m.index + m[0].length]);
}

export function checkLinks(paths = repositoryPaths(), baseDir = root) {
  const known = new Set(paths);
  const errors = [];
  const headings = new Map();
  let checked = 0;
  for (const doc of paths.filter(isDoc)) {
    let lines;
    try { lines = markdownLines(doc, baseDir); }
    catch { errors.push(`${doc}: cannot read tracked Markdown file`); continue; }
    let fence = null;
    for (const [index, line] of lines.entries()) {
      const marker = line.match(/^\s*(`{3,}|~{3,})/);
      if (marker) {
        if (!fence) fence = [marker[1][0], marker[1].length];
        else if (marker[1][0] === fence[0] && marker[1].length >= fence[1]) fence = null;
        continue;
      }
      if (fence) continue;
      const inlineCode = codeRanges(line);
      for (const match of line.matchAll(/!?\[[^\]]+\]\(([^)]+)\)/g)) {
        if (inlineCode.some(([start, end]) => match.index >= start && match.index < end)) continue;
        let target = match[1].trim();
        target = target.startsWith('<') ? target.match(/^<([^>]+)>/)?.[1] ?? '' : target.split(/\s+["']/)[0];
        if (/^[a-z][a-z0-9+.-]*:/i.test(target) || target.startsWith('//')) continue; // external links stay offline
        checked++;
        const [rawPath, rawAnchor = ''] = target.split('#', 2);
        let linkPath, anchor;
        try {
          linkPath = decodeURIComponent(rawPath.split('?')[0]);
          anchor = decodeURIComponent(rawAnchor);
        } catch { errors.push(`${doc}:${index + 1}: invalid link encoding`); continue; }
        const name = linkPath ? asPosix(relative(baseDir, resolve(baseDir, dirname(doc), linkPath))) : doc;
        if (name.startsWith('..') || name.startsWith('/') || linkPath.startsWith('/')) {
          errors.push(`${doc}:${index + 1}: link leaves the repository`);
          continue;
        }
        const directory = name.replace(/\/$/, '');
        if (!known.has(name) && !paths.some((item) => item.startsWith(`${directory}/`))) {
          errors.push(`${doc}:${index + 1}: local link target is missing`);
          continue;
        }
        try {
          if (lstatSync(resolve(baseDir, name)).isSymbolicLink()) {
            errors.push(`${doc}:${index + 1}: linked symlinks are not checked`);
            continue;
          }
        } catch {
          errors.push(`${doc}:${index + 1}: local link target is missing from the working tree`);
          continue;
        }
        if (anchor && name.endsWith('.md')) {
          if (!headings.has(name)) {
            try { headings.set(name, anchorsFor(markdownLines(name, baseDir))); }
            catch { errors.push(`${doc}:${index + 1}: linked Markdown file cannot be read`); continue; }
          }
          if (!headings.get(name).has(anchor)) errors.push(`${doc}:${index + 1}: heading anchor is missing`);
        }
      }
    }
  }
  return { files: paths.filter(isDoc).length, checked, errors };
}

export function parseNameStatus(output) {
  const fields = output.split('\0').filter(Boolean);
  const changes = [];
  for (let i = 0; i < fields.length;) {
    const status = fields[i++];
    const oldPath = fields[i++];
    const newPath = /^[RC]/.test(status) ? fields[i++] : undefined;
    if (!/^[ACDMRTUXB][0-9]*$/.test(status) || !oldPath || (/^[RC]/.test(status) && !newPath)) {
      throw new Error('unexpected git name-status output');
    }
    changes.push({ status: status[0], paths: newPath ? [oldPath, newPath] : [oldPath] });
  }
  return changes;
}

export function impact(changes) {
  const paths = changes.flatMap((change) => change.paths);
  const has = (pattern) => paths.some((name) => pattern.test(name));
  const suggestions = [];
  if (has(/^(src\/|scripts\/|astro\.config\.mjs$|package\.json$)/)) suggestions.push('.ai/CONTEXT.md: source or tooling changed');
  if (has(/^scripts\//)) suggestions.push('.ai/runbooks/: review procedures affected by changed scripts');
  if (changes.some((change) => ['A', 'D', 'R', 'C'].includes(change.status) && change.paths.some((name) => name.endsWith('.md')))) {
    suggestions.push('.ai/INDEX.md: documentation was added, removed or renamed');
  }
  if (has(/^docs\/ai-engineering\/PHASE-STATUS\.md$/)) suggestions.push('.ai/CURRENT.md: review the session summary if a phase changed status');
  return suggestions;
}

function main(args) {
  if (args[0] === 'links') {
    const result = checkLinks();
    for (const error of result.errors) console.error(error);
    console.log(`Local Markdown links: ${result.checked} checked in ${result.files} files; ${result.errors.length} issue(s). External URLs are not fetched.`);
    return result.errors.length ? 1 : 0;
  }
  if (args[0] === 'impact') {
    const baseAt = args.indexOf('--base');
    const headAt = args.indexOf('--head');
    if (baseAt < 0 || !args[baseAt + 1]) throw new Error('usage: check-docs.mjs impact --base <git-ref> [--head <git-ref>]');
    const base = args[baseAt + 1];
    const head = headAt >= 0 ? args[headAt + 1] : undefined;
    if (base.startsWith('-') || (headAt >= 0 && (!head || head.startsWith('-')))) throw new Error('invalid Git ref');
    const changes = parseNameStatus(git(['diff', '--no-ext-diff', '--find-renames', '--name-status', '-z', base, ...(head ? [head] : []), '--']));
    const suggestions = impact(changes);
    console.log(`Documentation impact: ${changes.length} changed path record(s). Advisory review prompts:`);
    if (suggestions.length) for (const suggestion of suggestions) console.log(`- ${suggestion}`);
    else console.log('- None for these paths.');
    console.log('This check reports path-based prompts; it does not validate document accuracy.');
    return 0;
  }
  throw new Error('usage: check-docs.mjs <links|impact --base <git-ref> [--head <git-ref>]>');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { process.exitCode = main(process.argv.slice(2)); }
  catch (error) { console.error(`Documentation check incomplete: ${error.message}`); process.exitCode = 2; }
}
