#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { closeSync, constants, existsSync, fchmodSync, openSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectDir = fileURLToPath(new URL('..', import.meta.url));
const burnrateUrl = 'http://127.0.0.1:8000/api/settings';
const cardosUrl = 'http://127.0.0.1:4321';
const formula = 'pratik1235/burnrate/burnrate';
const astroBin = join(projectDir, 'node_modules', 'astro', 'bin', 'astro.mjs');
const astroLog = join(tmpdir(), 'cardos-astro.log');
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function readUrl(url, timeoutMs = 2500) {
  try {
    return await fetch(url, { signal: AbortSignal.timeout(timeoutMs), cache: 'no-store' });
  } catch {
    return null;
  }
}

async function burnrateReady() {
  const response = await readUrl(burnrateUrl);
  if (!response?.ok) return false;
  try {
    const data = await response.json();
    return data && typeof data === 'object' && 'settings' in data;
  } catch {
    return false;
  }
}

async function cardosState() {
  const response = await readUrl(cardosUrl);
  if (!response) return 'offline';
  if (!response.ok) return 'occupied';
  try {
    return (await response.text()).includes('CardOS') ? 'ready' : 'occupied';
  } catch {
    return 'occupied';
  }
}

async function waitFor(check, timeoutMs, child) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await check()) return true;
    if (child && (child.exitCode !== null || child.startError)) return false;
    await sleep(750);
  }
  return check();
}

function run(command, args, timeoutMs = 20000) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd: projectDir, stdio: ['ignore', 'pipe', 'pipe'] });
    let output = '';
    const collect = (chunk) => { output = (output + chunk.toString()).slice(-2000); };
    child.stdout.on('data', collect);
    child.stderr.on('data', collect);
    const timer = setTimeout(() => child.kill('SIGTERM'), timeoutMs);
    child.on('error', (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      resolve({ code, output: output.trim() });
    });
  });
}

function findBrew() {
  return ['/opt/homebrew/bin/brew', '/usr/local/bin/brew'].find(existsSync) || 'brew';
}

async function ensureBurnrate() {
  if (await burnrateReady()) {
    console.log('✓ Burnrate running');
    console.log('✓ Burnrate API connected');
    return;
  }

  console.log('Starting the existing Burnrate Homebrew service…');
  const brew = findBrew();
  let installed;
  try {
    installed = await run(brew, ['list', '--versions', formula]);
  } catch {
    throw new Error('Homebrew is unavailable. Start the existing Burnrate service, then run CardOS again.');
  }
  if (installed.code !== 0 || !installed.output) {
    throw new Error(`The existing ${formula} installation was not found. Start Burnrate manually, then run CardOS again.`);
  }

  await run(brew, ['services', 'start', formula]);
  if (await waitFor(burnrateReady, 30000)) {
    console.log('✓ Burnrate running');
    console.log('✓ Burnrate API connected');
    return;
  }

  // A loaded Homebrew service may still be unresponsive; restart that service only.
  console.log('Burnrate service is unresponsive; restarting it…');
  const restarted = await run(brew, ['services', 'restart', formula]);
  if (await waitFor(burnrateReady, 30000)) {
    console.log('✓ Burnrate running');
    console.log('✓ Burnrate API connected');
    return;
  }
  throw new Error(`Burnrate did not respond at ${burnrateUrl}. ${restarted.output || 'Check the Homebrew Burnrate service logs.'}`);
}

async function ensureCardos() {
  const current = await cardosState();
  if (current === 'ready') {
    console.log('✓ CardOS running');
    return;
  }
  if (current === 'occupied') {
    throw new Error('Port 4321 is occupied by another service. Free that port and run CardOS again.');
  }
  if (!existsSync(astroBin)) {
    throw new Error('CardOS dependencies are missing. Run npm ci, then npm run cardos.');
  }

  const logFd = openSync(astroLog, constants.O_WRONLY | constants.O_CREAT | constants.O_APPEND | constants.O_NOFOLLOW, 0o600);
  let child;
  try {
    fchmodSync(logFd, 0o600);
    child = spawn(process.execPath, [astroBin, 'dev', '--host', '127.0.0.1', '--port', '4321'], {
      cwd: projectDir,
      detached: true,
      env: { ...process.env, ASTRO_TELEMETRY_DISABLED: '1' },
      stdio: ['ignore', logFd, logFd],
    });
  } finally {
    closeSync(logFd);
  }
  child.on('error', (error) => { child.startError = error; });

  const ready = await waitFor(async () => (await cardosState()) === 'ready', 45000, child);
  if (!ready) {
    if (child.exitCode === null && child.pid) {
      try { process.kill(-child.pid, 'SIGTERM'); } catch { /* Already exited. */ }
    }
    throw new Error(`CardOS did not start on port 4321. See ${astroLog}.`);
  }
  child.unref();
  console.log('✓ CardOS running');
}

async function main() {
  console.log('\nCardOS\n');
  await ensureBurnrate();
  await ensureCardos();
  console.log('✓ Live data ready');
  console.log(`\nOpening ${cardosUrl}`);
  if (process.env.CARDOS_NO_OPEN === '1') return;
  const opened = await run('open', [cardosUrl], 10000);
  if (opened.code !== 0) throw new Error(`Could not open the browser. Visit ${cardosUrl} manually.`);
}

main().catch((error) => {
  console.error(`\n✗ ${error.message}`);
  process.exitCode = 1;
});
