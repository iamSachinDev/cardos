#!/usr/bin/env node
// Deterministic public route inventory. Reads page filenames only; no app or financial data.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pages = join(root, 'src', 'pages');
const output = join(root, 'docs', 'ai-engineering', 'ROUTES.md');

function pageFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return pageFiles(path);
    return entry.isFile() && entry.name.endsWith('.astro') ? [path] : [];
  });
}

function routeFor(file) {
  const name = relative(pages, file).split(sep).join('/').replace(/\.astro$/, '');
  const route = name.replace(/(^|\/)index$/, '');
  return route ? `/${route}/` : '/';
}

function render() {
  const rows = pageFiles(pages).map((file) => ({ route: routeFor(file), source: relative(root, file).split(sep).join('/') }));
  rows.sort((a, b) => a.route.localeCompare(b.route));
  return [
    '# CardOS routes',
    '',
    'Generated from `src/pages/**/*.astro` by `npm run docs:routes`. Edit the Astro page files, then regenerate this table.',
    '',
    '| Route | Source |',
    '|---|---|',
    ...rows.map(({ route, source }) => `| \`${route}\` | [\`${source}\`](../../${source}) |`),
    '',
  ].join('\n');
}

const expected = render();
if (process.argv.includes('--check')) {
  let actual;
  try { actual = readFileSync(output, 'utf8'); }
  catch { actual = ''; }
  if (actual !== expected) {
    console.error('Route documentation is missing or stale. Run `npm run docs:routes`.');
    process.exitCode = 1;
  } else console.log('Route documentation matches the Astro page files.');
} else {
  writeFileSync(output, expected);
  console.log('Route documentation updated from Astro page filenames.');
}
