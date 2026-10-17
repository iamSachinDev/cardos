#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { chmodSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { createInterface } from 'node:readline';

const formula = 'pratik1235/burnrate/burnrate';
const statusUrl = 'http://127.0.0.1:8000/api/gmail/status';
const callbackUrl = 'http://127.0.0.1:8000/api/gmail/oauth/callback';
const settingsUrl = 'http://127.0.0.1:4321/settings';
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function findBrew() {
  return ['/opt/homebrew/bin/brew', '/usr/local/bin/brew'].find(existsSync) || 'brew';
}

function run(command, args, timeoutMs = 30000) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ['ignore', 'pipe', 'pipe'] });
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

// Burnrate (backend/config.py) reads libexec/.env.<BURNRATE_ENV>, and its Homebrew launcher sets production.
// BURNRATE_ENV_FILE overrides the path the same way Burnrate does.
async function envFilePath(brew) {
  if (process.env.BURNRATE_ENV_FILE) return resolve(process.env.BURNRATE_ENV_FILE);
  let prefix;
  try {
    prefix = await run(brew, ['--prefix', '--installed', formula]);
  } catch {
    throw new Error('Homebrew is unavailable, so the Burnrate installation could not be located.');
  }
  if (prefix.code !== 0 || !prefix.output) throw new Error(`The existing ${formula} installation was not found.`);
  return join(prefix.output, 'libexec', '.env.production');
}

async function promptForClient() {
  const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: Boolean(process.stdin.isTTY) });
  let muted = false;
  rl._writeToOutput = (text) => { if (!muted) process.stdout.write(text); };
  // The async iterator buffers lines, so piped input is not lost between the two questions.
  const lines = rl[Symbol.asyncIterator]();
  const ask = async (question, hidden = false) => {
    rl.setPrompt(question);
    rl.prompt();
    muted = hidden;
    const { value, done } = await lines.next();
    muted = false;
    if (hidden) process.stdout.write('\n');
    if (done) throw new Error('Setup cancelled before the client ID and secret were entered.');
    return value.trim();
  };
  try {
    return { id: await ask('Google OAuth client ID: '), secret: await ask('Google OAuth client secret (hidden): ', true) };
  } finally {
    rl.close();
  }
}

// Accepts the client JSON downloaded from Google Cloud Console ("web" or "installed" client).
function readClientFile(path) {
  let data;
  try {
    data = JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    throw new Error(`Could not read a Google OAuth client JSON file at ${path}.`);
  }
  const client = data.web || data.installed;
  if (!client?.client_id || !client?.client_secret) throw new Error(`${path} does not contain an OAuth client ID and secret.`);
  if (data.web && !(client.redirect_uris || []).includes(callbackUrl)) {
    throw new Error(`Add ${callbackUrl} as an authorized redirect URI on this OAuth client, download the JSON again, and rerun.`);
  }
  return { id: client.client_id, secret: client.client_secret };
}

async function readClient() {
  const file = process.argv[2];
  if (file) return readClientFile(resolve(file));
  console.log(`Create a Google OAuth client (Web application) with redirect URI ${callbackUrl}.`);
  console.log('Tip: pass its downloaded JSON instead: npm run gmail:setup -- ~/Downloads/client_secret_….json\n');
  return promptForClient();
}

function writeEnv(path, values) {
  const lines = existsSync(path) ? readFileSync(path, 'utf8').split('\n') : [];
  for (const [key, value] of Object.entries(values)) {
    const index = lines.findIndex((line) => line.trim().startsWith(`${key}=`));
    if (index === -1) lines.splice(lines.at(-1) === '' ? lines.length - 1 : lines.length, 0, `${key}=${value}`);
    else lines[index] = `${key}=${value}`;
  }
  if (lines.at(-1) !== '') lines.push('');
  writeFileSync(path, lines.join('\n'), { mode: 0o600 });
  chmodSync(path, 0o600);
}

async function gmailConfigured() {
  try {
    const response = await fetch(statusUrl, { signal: AbortSignal.timeout(2500), cache: 'no-store' });
    return response.ok && (await response.json()).configured === true;
  } catch {
    return false;
  }
}

async function main() {
  console.log('\nCardOS · Gmail sync setup\n');
  const brew = findBrew();
  const path = await envFilePath(brew);
  const client = await readClient();
  if (!/^[\w.-]+\.apps\.googleusercontent\.com$/.test(client.id)) throw new Error('That does not look like a Google OAuth client ID (…apps.googleusercontent.com).');
  if (!/^\S+$/.test(client.secret)) throw new Error('The client secret is empty or contains whitespace.');

  writeEnv(path, {
    GOOGLE_OAUTH_CLIENT_ID: client.id,
    GOOGLE_OAUTH_CLIENT_SECRET: client.secret,
    GMAIL_OAUTH_SUCCESS_REDIRECT: `${settingsUrl}?gmail=connected`,
    GMAIL_OAUTH_ERROR_REDIRECT: `${settingsUrl}?gmail=error`,
  });
  console.log(`✓ Gmail OAuth client saved to ${path}`);

  if (process.env.CARDOS_NO_RESTART === '1') return;
  console.log('Restarting the Burnrate Homebrew service…');
  const restarted = await run(brew, ['services', 'restart', formula]);
  const deadline = Date.now() + 30000;
  while (Date.now() < deadline && !(await gmailConfigured())) await sleep(750);
  if (!(await gmailConfigured())) {
    throw new Error(`Burnrate did not report Gmail as configured at ${statusUrl}. ${restarted.output || 'Check the Homebrew Burnrate service logs.'}`);
  }
  console.log('✓ Burnrate reports Gmail as configured');
  console.log(`\nOpen ${settingsUrl} and choose Connect Gmail.`);
}

main().catch((error) => {
  console.error(`\n✗ ${error.message}`);
  process.exitCode = 1;
});
