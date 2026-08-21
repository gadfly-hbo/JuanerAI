import test from 'node:test';
import assert from 'node:assert/strict';
import { chmod, cp, mkdtemp, mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = fileURLToPath(new URL('../../../', import.meta.url));
const PUBLIC_RUNNER = path.join(REPO_ROOT, 'tools', 'harness', 'validation', 'run');
const CANONICAL_NODE = '/Users/huangbo/Dev/Env/homebrew/bin/node';

function run(command, args, options) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, options);
    const stdout = [];
    const stderr = [];
    child.stdout.on('data', (chunk) => stdout.push(chunk));
    child.stderr.on('data', (chunk) => stderr.push(chunk));
    child.on('error', reject);
    child.on('close', (code, signal) => resolve({
      code,
      signal,
      stdout: Buffer.concat(stdout).toString('utf8'),
      stderr: Buffer.concat(stderr).toString('utf8')
    }));
  });
}

async function writeExecutable(file, text) {
  await writeFile(file, text, 'utf8');
  await chmod(file, 0o755);
}

async function entries(root) {
  const found = [];
  async function visit(relative = '') {
    for (const entry of await readdir(path.join(root, relative), { withFileTypes: true })) {
      const next = path.join(relative, entry.name);
      if (entry.isDirectory()) await visit(next);
      else found.push(next);
    }
  }
  await visit();
  return found.sort();
}

async function fixture(t, {
  wrongNode = false,
  failGroup = '',
  duckdbOutput = 'v1.5.2 (Variegata) 8a5851971f'
} = {}) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'juanerai-cvr-'));
  const bin = path.join(root, 'toolchain-bin');
  const observation = path.join(root, 'observation.log');
  const nodeVersion = wrongNode ? 'v25.0.0' : 'v26.0.0';
  await mkdir(bin, { recursive: true });
  await mkdir(path.join(root, 'tools', 'harness', 'validation'), { recursive: true });
  await mkdir(path.join(root, 'node_modules', '@earendil-works', 'pi-coding-agent'), { recursive: true });
  await mkdir(path.join(root, 'node_modules', 'typebox'), { recursive: true });
  for (const directory of [
    'tests/unit/xanthil-local-analysis',
    'tests/contract/xanthil-local-analysis',
    'tests/integration/xanthil-local-analysis',
    'tests/e2e/xanthil-local-analysis',
    'tools/harness/project-board'
  ]) await mkdir(path.join(root, directory), { recursive: true });
  await writeFile(path.join(root, 'package.json'), JSON.stringify({
    dependencies: {
      '@earendil-works/pi-coding-agent': '0.84.2',
      typebox: '1.3.7'
    }
  }), 'utf8');
  await writeFile(path.join(root, 'node_modules', '@earendil-works', 'pi-coding-agent', 'package.json'), '{"version":"0.84.2"}\n', 'utf8');
  await writeFile(path.join(root, 'node_modules', 'typebox', 'package.json'), '{"version":"1.3.7"}\n', 'utf8');
  for (const file of [
    'tests/unit/xanthil-local-analysis/unit.test.mjs',
    'tests/contract/xanthil-local-analysis/contract.test.mjs',
    'tests/integration/xanthil-local-analysis/integration.test.mjs',
    'tests/e2e/xanthil-local-analysis/e2e.test.mjs',
    'tools/harness/project-board/project-control.test.mjs',
    'tools/harness/project-board/status-cli.test.mjs'
  ]) await writeFile(path.join(root, file), '// fixture placeholder\n', 'utf8');

  await writeExecutable(path.join(bin, 'node'), `#!/bin/sh
set -eu
case "$1" in
  --version) printf '%s\\n' '${nodeVersion}' ;;
  -e|-p) exec '${CANONICAL_NODE}' "$@" ;;
  --check)
    printf 'syntax:%s\\n' "\${2##*/}" >> "$CVR_OBSERVATION"
    if [ "\${CVR_FIXTURE_FAIL:-}" = syntax ]; then printf 'native syntax stderr\\n' >&2; exit 17; fi
    ;;
  --test)
    group=unknown
    for arg in "$@"; do case "$arg" in
      *tests/unit/*) group=unit ;;
      *tests/contract/*) group=contract ;;
      *tests/integration/*) group=integration ;;
      *tests/e2e/*) group=e2e ;;
      *tools/harness/project-board/*) group=project-board ;;
    esac; done
    printf '%s:%s\\n' "$group" "\${XANTHIL_REAL_PI_ACCEPTANCE-unset}" >> "$CVR_OBSERVATION"
    printf 'native %s stdout\\n' "$group"
    printf 'native %s stderr\\n' "$group" >&2
    if [ "\${CVR_FIXTURE_FAIL:-}" = "$group" ]; then exit 23; fi
    ;;
  *) printf 'unexpected fake node invocation: %s\\n' "$*" >&2; exit 64 ;;
esac
`);
  await writeExecutable(path.join(bin, 'npm'), "#!/bin/sh\n[ \"$1\" = --version ] && printf '11.12.1\\n' || exit 64\n");
  await writeExecutable(path.join(bin, 'duckdb'), `#!/bin/sh
[ "$1" = --version ] && printf '%s\\n' '${duckdbOutput}' || exit 64
`);
  await writeExecutable(path.join(bin, 'python3'), "#!/bin/sh\n[ \"$1\" = --version ] && printf 'Python 3.9.6\\n' || exit 64\n");

  const health = await run(path.join(bin, 'node'), ['--test', 'tests/unit/xanthil-local-analysis/unit.test.mjs'], {
    cwd: root,
    env: { ...process.env, CVR_OBSERVATION: observation }
  });
  assert.equal(health.code, 0, 'fixture command health must be GREEN before runner observation');
  assert.match(await readFile(observation, 'utf8'), /^unit:unset\n$/, 'fixture must record an independently healthy child');
  await writeFile(observation, '', 'utf8');

  t.after(() => rm(root, { recursive: true, force: true }));
  const mjsBasenames = (await entries(root))
    .filter((file) => file.endsWith('.mjs'))
    .map((file) => path.basename(file))
    .sort();
  return { root, bin, observation, failGroup, mjsBasenames };
}

async function installPublicRunner(f) {
  await stat(PUBLIC_RUNNER).catch(() => assert.fail(`expected public entrypoint is absent: ${PUBLIC_RUNNER}`));
  const destination = path.join(f.root, 'tools', 'harness', 'validation', 'run');
  await cp(PUBLIC_RUNNER, destination);
  await chmod(destination, 0o755);
  return destination;
}

async function invoke(f, runner, inherited = {}) {
  return run(runner, [], {
    cwd: path.join(f.root, 'elsewhere'),
    env: {
      ...process.env,
      ...inherited,
      PATH: '/caller-path-that-must-not-be-used',
      JUANERAI_TOOLCHAIN_BIN: f.bin,
      CVR_OBSERVATION: f.observation,
      CVR_FIXTURE_FAIL: f.failGroup
    }
  });
}

async function observedLines(f) {
  const text = await readFile(f.observation, 'utf8');
  return text === '' ? [] : text.trim().split('\n');
}

function assertSyntaxBeforeSuites(lines, f, expectedSuites) {
  const syntax = lines.filter((line) => line.startsWith('syntax:'));
  const suites = lines.filter((line) => !line.startsWith('syntax:'));
  assert.deepEqual(syntax.slice().sort(), f.mjsBasenames.map((name) => `syntax:${name}`));
  assert.deepEqual(suites, expectedSuites);
  assert.equal(lines.indexOf(suites[0]), syntax.length, 'each fixture .mjs syntax check must precede suite steps');
}

test('CVR-TEST-001: selected toolchain passes and starts offline checks in order', async (t) => {
  const f = await fixture(t);
  const runner = await installPublicRunner(f);
  await mkdir(path.join(f.root, 'elsewhere'));
  const result = await invoke(f, runner);
  assert.equal(result.code, 0);
  assertSyntaxBeforeSuites(await observedLines(f), f, [
    'unit:unset', 'contract:unset', 'integration:unset', 'e2e:unset', 'project-board:unset'
  ]);
});

test('CVR-TEST-002: wrong version fails before every validation command', async (t) => {
  const f = await fixture(t, { wrongNode: true });
  const runner = await installPublicRunner(f);
  await mkdir(path.join(f.root, 'elsewhere'));
  const result = await invoke(f, runner);
  assert.notEqual(result.code, 0);
  assert.equal(await readFile(f.observation, 'utf8'), '');

  const missingToken = await fixture(t, { duckdbOutput: '(Variegata) 8a5851971f' });
  const missingTokenRunner = await installPublicRunner(missingToken);
  await mkdir(path.join(missingToken.root, 'elsewhere'));
  const missingTokenResult = await invoke(missingToken, missingTokenRunner);
  assert.notEqual(missingTokenResult.code, 0);
  assert.equal(await readFile(missingToken.observation, 'utf8'), '');

  const mismatchedToken = await fixture(t, { duckdbOutput: 'v1.5.1 (Variegata) 8a5851971f' });
  const mismatchedTokenRunner = await installPublicRunner(mismatchedToken);
  await mkdir(path.join(mismatchedToken.root, 'elsewhere'));
  const mismatchedTokenResult = await invoke(mismatchedToken, mismatchedTokenRunner);
  assert.notEqual(mismatchedTokenResult.code, 0);
  assert.equal(await readFile(mismatchedToken.observation, 'utf8'), '');
});

test('CVR-TEST-003: inherited real-model gate is absent from the E2E child', async (t) => {
  const f = await fixture(t);
  const runner = await installPublicRunner(f);
  await mkdir(path.join(f.root, 'elsewhere'));
  const result = await invoke(f, runner, { XANTHIL_REAL_PI_ACCEPTANCE: '1' });
  assert.equal(result.code, 0);
  assert.match(await readFile(f.observation, 'utf8'), /e2e:unset/);
});

test('CVR-TEST-004: validation failure streams natively, stops later checks, and creates no result', async (t) => {
  const f = await fixture(t, { failGroup: 'contract' });
  const runner = await installPublicRunner(f);
  await mkdir(path.join(f.root, 'elsewhere'));
  const before = await entries(f.root);
  const result = await invoke(f, runner);
  assert.notEqual(result.code, 0);
  assert.match(result.stdout, /native contract stdout/);
  assert.match(result.stderr, /native contract stderr/);
  assertSyntaxBeforeSuites(await observedLines(f), f, ['unit:unset', 'contract:unset']);
  assert.deepEqual(await entries(f.root), before, 'runner must not create a result or other persistent output');
});
