import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { checkLinks, impact, parseNameStatus } from './check-docs.mjs';

function withDocs(readme, guide, run, extraPaths = []) {
  const root = mkdtempSync(join(tmpdir(), 'cardos-doc-check-'));
  try {
    mkdirSync(join(root, 'docs'));
    writeFileSync(join(root, 'README.md'), readme);
    writeFileSync(join(root, 'docs', 'guide.md'), guide);
    return run(checkLinks(['README.md', 'docs/guide.md', ...extraPaths], root));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

test('checks local files, headings and duplicate heading suffixes without fetching external links', () => {
  withDocs(
    '# Home\n[setup](docs/guide.md#setup)\n[again](docs/guide.md#setup-1)\n[manual](docs/guide.md#manual)\n[web](https://example.invalid/x)\n```md\n[example](missing.md)\n```\n',
    '# Setup\n# Setup\n<a id="manual"></a>\n',
    (result) => {
      assert.equal(result.checked, 3);
      assert.deepEqual(result.errors, []);
    },
  );
});

test('reports missing files, missing anchors and links outside the repository', () => {
  withDocs(
    '# Home\n[missing](gone.md)\n[bad anchor](docs/guide.md#absent)\n[outside](../outside.md)\n`[sample](fake.md)`\n',
    '# Guide\n',
    (result) => {
      assert.equal(result.checked, 3);
      assert.equal(result.errors.length, 3);
      assert.match(result.errors[0], /target is missing/);
      assert.match(result.errors[1], /anchor is missing/);
      assert.match(result.errors[2], /leaves the repository/);
    },
  );
});

test('does not accept a tracked target removed from the working tree', () => {
  withDocs('[page](src/pages/deleted.astro)\n', '# Guide\n', (result) => {
    assert.equal(result.checked, 1);
    assert.equal(result.errors.length, 1);
    assert.match(result.errors[0], /missing from the working tree/);
  }, ['src/pages/deleted.astro']);
});

test('doc impact recognizes source changes and document additions and renames', () => {
  const changes = parseNameStatus('M\0scripts/example.mjs\0A\0docs/new.md\0R100\0docs/old.md\0docs/new-name.md\0');
  assert.equal(changes.length, 3);
  assert.deepEqual(impact(changes), [
    '.ai/CONTEXT.md: source or tooling changed',
    '.ai/runbooks/: review procedures affected by changed scripts',
    '.ai/INDEX.md: documentation was added, removed or renamed',
  ]);
  assert.deepEqual(impact(parseNameStatus('')), []);
  assert.throws(() => parseNameStatus('R100\0docs/old.md\0'), /unexpected git name-status/);
});
