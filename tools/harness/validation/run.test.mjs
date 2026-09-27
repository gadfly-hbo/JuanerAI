import test from 'node:test';
import assert from 'node:assert/strict';
import { chmod, cp, mkdtemp, mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

test('TEST-XDESK-CF-RESTORATION requires full Console then Desktop phases without intermediate selectors',async()=>{
  const source=await readFile(PUBLIC_RUNNER,'utf8');
  const actual=source.split('\n').filter(line=>/^node .*--test (tests|tools)\//.test(line));
  const expected=[
    'node --test tests/unit/xanthil-local-analysis/*.test.ts',
    'node --test tests/contract/xanthil-local-analysis/*.test.ts',
    'node --test tests/integration/xanthil-local-analysis/*.test.ts',
    'node --test tests/e2e/xanthil-local-analysis/*.test.ts',
    'node --test tests/contract/model-pack-contract-enabler/*.test.ts',
    'node --test tests/integration/model-pack-contract-enabler/*.test.ts',
    'node --test tools/harness/project-board/project-control.test.mjs tools/harness/project-board/status-cli.test.mjs',
    "node --test tests/unit/run-evidence-console/run-evidence.unit.test.ts",
    "node --test tests/contract/run-evidence-console/run-evidence-reader.contract.test.ts",
    "node --test tests/integration/run-evidence-console/run-evidence-reader.integration.test.ts",
    "node --test tests/e2e/run-evidence-console/xanthil-console.e2e.test.ts",
    "node --test tests/unit/xanthil-desktop/*.test.ts",
    "node --test tests/contract/xanthil-desktop/*.test.ts",
    "node --test tests/integration/xanthil-desktop/*.test.ts",
    "node --test tests/e2e/xanthil-desktop/*.test.ts",
  ];
  assert.deepEqual(actual,expected);
  assert.doesNotMatch(source,/test-name-pattern|phase[_-]?selector|configuration[_-]?selector|desktop:package/);
  assert.match(source,/unset XANTHIL_REAL_PI_ACCEPTANCE/);
  assert.notDeepEqual(actual.filter(line=>!line.includes('run-evidence-console')),expected,'Console omission cannot masquerade as final coverage');
});

const REPO_ROOT = fileURLToPath(new URL('../../../', import.meta.url));
const PUBLIC_RUNNER = path.join(REPO_ROOT, 'tools', 'harness', 'validation', 'run');
const CANONICAL_NODE = process.execPath;
const C0_RUNNER_CHILDREN = Object.freeze([
  'unit:local-analysis.unit.test.ts:unset',
  'contract:local-analysis-ports.contract.test.ts:unset',
  'integration:local-analysis.integration.test.ts:unset',
  'e2e:local-analysis.e2e.test.ts:unset',
  'contract:model-pack-contract-enabler.contract.test.ts:unset',
  'integration:model-pack-contract-enabler.integration.test.ts:unset',
  'project-board:project-control.test.mjs:unset',
  'project-board:status-cli.test.mjs:unset',
]);
const CF_CONSOLE_PATHS = Object.freeze([
  "tests/unit/run-evidence-console/run-evidence.unit.test.ts",
  "tests/contract/run-evidence-console/run-evidence-reader.contract.test.ts",
  "tests/integration/run-evidence-console/run-evidence-reader.integration.test.ts",
  "tests/e2e/run-evidence-console/xanthil-console.e2e.test.ts"
]);
const CF_DESKTOP_GROUPS = Object.freeze([
  [
    "tests/unit/xanthil-desktop/coverage-map.test.ts",
    "tests/unit/xanthil-desktop/xanthil-desktop.unit.test.ts"
  ],
  [
    "tests/contract/xanthil-desktop/xanthil-desktop-analysis.contract.test.ts",
    "tests/contract/xanthil-desktop/xanthil-desktop-assistance.contract.test.ts",
    "tests/contract/xanthil-desktop/xanthil-desktop-ipc.contract.test.ts",
    "tests/contract/xanthil-desktop/xanthil-desktop-main-module-format.contract.test.ts",
    "tests/contract/xanthil-desktop/xanthil-desktop-store.contract.test.ts"
  ],
  [
    "tests/integration/xanthil-desktop/xanthil-desktop-application.integration.test.ts",
    "tests/integration/xanthil-desktop/xanthil-desktop-storage.integration.test.ts"
  ],
  [
    "tests/e2e/xanthil-desktop/xanthil-desktop.e2e.test.ts"
  ]
]);
const CF_TSCONFIG_APPENDIX = Object.freeze([
  "packages/product-core/xanthil-desktop-decision-case.ts",
  "packages/application/xanthil-desktop-decision-case.ts",
  "packages/contracts/xanthil-desktop-ipc.ts",
  "packages/ports/xanthil-desktop-decision-case.ts",
  "adapters/storage-local/xanthil-desktop-decision-case.ts",
  "adapters/analytics-duckdb/process.ts",
  "adapters/analytics-duckdb/xanthil-desktop-decision-case.ts",
  "profiles/personal/xanthil-desktop.ts",
  "apps/desktop/main.ts",
  "apps/desktop/preload.ts",
  "apps/desktop/renderer.tsx",
  "tests/fixtures/xanthil-desktop/coverage-map.ts",
  "tests/fixtures/xanthil-desktop/desktop-contract-drivers.ts",
  "tests/fixtures/xanthil-desktop/desktop-e2e-harness.ts",
  "tests/fixtures/xanthil-desktop/desktop-fixtures.ts",
  "tests/unit/xanthil-desktop/xanthil-desktop.unit.test.ts",
  "tests/unit/xanthil-desktop/coverage-map.test.ts",
  "tests/contract/xanthil-desktop/xanthil-desktop-store.contract.test.ts",
  "tests/contract/xanthil-desktop/xanthil-desktop-analysis.contract.test.ts",
  "tests/contract/xanthil-desktop/xanthil-desktop-assistance.contract.test.ts",
  "tests/contract/xanthil-desktop/xanthil-desktop-ipc.contract.test.ts",
  "tests/integration/xanthil-desktop/xanthil-desktop-application.integration.test.ts",
  "tests/integration/xanthil-desktop/xanthil-desktop-storage.integration.test.ts",
  "tests/e2e/xanthil-desktop/xanthil-desktop.e2e.test.ts",
  "tests/contract/xanthil-desktop/xanthil-desktop-main-module-format.contract.test.ts"
]);
const C0_RUNNER_TEST_TARGETS = Object.freeze([
  'tests/unit/xanthil-local-analysis/*.test.ts', 'tests/contract/xanthil-local-analysis/*.test.ts',
  'tests/integration/xanthil-local-analysis/*.test.ts', 'tests/e2e/xanthil-local-analysis/*.test.ts',
  'tests/contract/model-pack-contract-enabler/*.test.ts', 'tests/integration/model-pack-contract-enabler/*.test.ts',
  'tools/harness/project-board/project-control.test.mjs', 'tools/harness/project-board/status-cli.test.mjs',
]);
const C0_TUPLE_CONFIGURATION_FILES = Object.freeze(['package-lock.json', 'package.json', 'tsconfig.json']);
const C1A_TUPLE_CONFIGURATION_FILES = Object.freeze(['forge.config.cjs', 'package-lock.json', 'package.json', 'tsconfig.json', 'vite.main.config.mjs', 'vite.preload.config.mjs', 'vite.renderer.config.mjs']);
const focusedChildren = tuple => tuple === 'CF' ? CF_DESKTOP_GROUPS.map(paths=>['--test',...paths]) : [];

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

/**
 * H-TUPLE proves the complete closed tuple first.  This independent, minimal
 * discriminator selects the fixed runner expectation for that already-healthy
 * C0 or C1a tuple; it never derives an expectation from runner source.
 */
async function currentRunnerTuple() {
  const [manifestSource, tsconfigSource, rootEntries] = await Promise.all([
    readFile(path.join(REPO_ROOT, 'package.json'), 'utf8'),
    readFile(path.join(REPO_ROOT, 'tsconfig.json'), 'utf8'),
    readdir(REPO_ROOT, { withFileTypes: true }),
  ]);
  const manifest = JSON.parse(manifestSource);
  const tsconfig = JSON.parse(tsconfigSource);
  const scripts = manifest.scripts;
  const files = tsconfig.files;
  assert.equal(typeof scripts, 'object', 'the tuple discriminator requires the manifest scripts object');
  assert.equal(Array.isArray(files), true, 'the tuple discriminator requires the explicit tsconfig files array');
  const knownConfigurationFiles = rootEntries
    .filter((entry) => entry.isFile() && [...C1A_TUPLE_CONFIGURATION_FILES].includes(entry.name))
    .map((entry) => entry.name)
    .sort();

  if (manifest.main === undefined && manifest.config === undefined) {
    assert.equal(scripts['desktop:start'], undefined, 'C0 cannot contain a partial Desktop start script');
    assert.equal(scripts['desktop:package'], undefined, 'C0 cannot contain a partial Desktop package script');
    assert.equal(scripts['desktop:test'], undefined, 'C0 cannot contain a partial Desktop test script');
    assert.equal(tsconfig.compilerOptions?.jsx, undefined, 'C0 cannot contain a partial Desktop JSX mode');
    assert.equal(files.length, 43, 'C0 retains exactly the H-TUPLE-verified P4 file count');
    assert.equal(files.some((file) => typeof file === 'string' && file.includes('xanthil-desktop')), false, 'C0 has no Desktop appendage');
    assert.deepEqual(knownConfigurationFiles, C0_TUPLE_CONFIGURATION_FILES, 'C0 retains the exact H-TUPLE configuration inventory');
    return 'C0';
  }

  assert.equal(manifest.main, '.vite/build/main.cjs', 'the already-approved CommonJS package entry remains exact');
  assert.deepEqual(manifest.config, { forge: './forge.config.cjs' }, 'C1a requires the exact P5 Forge config');
  assert.equal(scripts['desktop:start'], 'node tools/desktop/prepare-toolchain-deployment.mjs && electron-forge start');
  assert.equal(scripts['desktop:package'], 'node tools/desktop/prepare-toolchain-deployment.mjs && electron-forge package --platform=darwin --arch=arm64');
  assert.equal(scripts['desktop:test'], 'npm run desktop:package && node --test tests/unit/xanthil-desktop/*.test.ts tests/contract/xanthil-desktop/*.test.ts tests/integration/xanthil-desktop/*.test.ts tests/e2e/xanthil-desktop/*.test.ts');
  assert.equal(tsconfig.compilerOptions?.jsx, 'react-jsx', 'C1a requires its exact JSX mode');
  assert.equal(files.length,68,'final P5 has the approved 43 baseline plus 25 mapped roots');
  assert.deepEqual(files.slice(43),CF_TSCONFIG_APPENDIX,'final P5 is an independent literal, never derived from actual files');
  assert.deepEqual(knownConfigurationFiles,C1A_TUPLE_CONFIGURATION_FILES);
  return 'CF';
}
function expectedRunnerChildren(tuple) {
  if(tuple==='C0')return C0_RUNNER_CHILDREN;
  const child=path=>path.split('/')[1]+':'+path.split('/').at(-1)+':unset';
  return [...C0_RUNNER_CHILDREN,...CF_CONSOLE_PATHS.map(child),...CF_DESKTOP_GROUPS.flat().map(child)];
}
function expectedRunnerTestTargets(tuple) {
  return tuple==='C0'?C0_RUNNER_TEST_TARGETS:[...C0_RUNNER_TEST_TARGETS,...CF_CONSOLE_PATHS,
    'tests/unit/xanthil-desktop/*.test.ts','tests/contract/xanthil-desktop/*.test.ts',
    'tests/integration/xanthil-desktop/*.test.ts','tests/e2e/xanthil-desktop/*.test.ts'];
}

function testTargetsFromRunnerSource(source) {
  return source.split('\n').flatMap((line) => line.match(/(?:tests\/|tools\/harness\/project-board\/)[^\s'"]+\.test\.(?:ts|mjs)/g) ?? []);
}

function desktopArgvRecords(lines) {
  return lines.filter((line) => line.startsWith('argv:') && line.includes('xanthil-desktop'));
}

async function fixture(t, {
  wrongNode = false,
  failGroup = '',
  failTarget = '',
  runnerTuple = 'C0',
  duckdbOutput = 'v1.5.2 (Variegata) 8a5851971f'
} = {}) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'juanerai-cvr-'));
  const bin = path.join(root, 'toolchain-bin');
  const observation = path.join(root, 'observation.log');
  const nodeVersion = wrongNode ? 'v25.0.0' : 'v26.0.0';
  await mkdir(bin, { recursive: true });
  await mkdir(path.join(root, 'tools', 'harness', 'validation'), { recursive: true });
  await mkdir(path.join(root, 'node_modules', '@earendil-works', 'pi-coding-agent'), { recursive: true });
  await mkdir(path.join(root, 'node_modules', '@types', 'node'), { recursive: true });
  await mkdir(path.join(root, 'node_modules', 'typescript'), { recursive: true });
  await mkdir(path.join(root, 'node_modules', 'typebox'), { recursive: true });
  for (const directory of [
    'tests/unit/xanthil-local-analysis',
    ...CF_CONSOLE_PATHS.map(file=>path.dirname(file)),
    ...(runnerTuple==='CF'?['tests/e2e/xanthil-desktop']:[]),
    ...(runnerTuple !== 'C0' ? ['tests/unit/xanthil-desktop', 'tests/integration/xanthil-desktop'] : []),
    'tests/contract/xanthil-local-analysis',
    ...(runnerTuple !== 'C0' ? ['tests/contract/xanthil-desktop'] : []),
    'tests/integration/xanthil-local-analysis',
    'tests/e2e/xanthil-local-analysis',
    'tests/contract/model-pack-contract-enabler',
    'tests/integration/model-pack-contract-enabler',
    'tools/harness/project-board'
  ]) await mkdir(path.join(root, directory), { recursive: true });
  await writeFile(path.join(root, 'package.json'), JSON.stringify({
    dependencies: {
      '@earendil-works/pi-coding-agent': '0.84.2',
      typebox: '1.3.7'
    },
    devDependencies: {
      '@types/node': '22.19.19',
      typescript: '5.9.3'
    },
    scripts: { typecheck: 'tsc -p tsconfig.json --noEmit' }
  }), 'utf8');
  await writeFile(path.join(root, 'node_modules', '@earendil-works', 'pi-coding-agent', 'package.json'), '{"version":"0.84.2"}\n', 'utf8');
  await writeFile(path.join(root, 'node_modules', '@types', 'node', 'package.json'), '{"version":"22.19.19"}\n', 'utf8');
  await writeFile(path.join(root, 'node_modules', 'typescript', 'package.json'), '{"version":"5.9.3"}\n', 'utf8');
  await writeFile(path.join(root, 'node_modules', 'typebox', 'package.json'), '{"version":"1.3.7"}\n', 'utf8');
  await writeFile(path.join(root, 'tsconfig.json'), '{"compilerOptions":{"strict":true,"noEmit":true}}\n', 'utf8');
  for (const file of [
    'tests/unit/xanthil-local-analysis/local-analysis.unit.test.ts',
    'tests/contract/xanthil-local-analysis/local-analysis-ports.contract.test.ts',
    'tests/integration/xanthil-local-analysis/local-analysis.integration.test.ts',
    'tests/e2e/xanthil-local-analysis/local-analysis.e2e.test.ts',
    'tests/contract/model-pack-contract-enabler/model-pack-contract-enabler.contract.test.ts',
    'tests/integration/model-pack-contract-enabler/model-pack-contract-enabler.integration.test.ts',
    'tools/harness/project-board/project-control.test.mjs',
    'tools/harness/project-board/status-cli.test.mjs',
    ...(runnerTuple==='CF'?[...CF_CONSOLE_PATHS,...CF_DESKTOP_GROUPS.flat()]:[]),
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
  --test|--experimental-strip-types)
    test_mode=false
    for arg in "$@"; do [ "$arg" = --test ] && test_mode=true; done
    [ "$test_mode" = true ] || { printf 'unexpected fake node invocation: %s\n' "$*" >&2; exit 64; }
    argv=
    for arg in "$@"; do argv="\${argv}\${argv:+|}\${arg}"; done
    printf 'argv:%s\n' "$argv" >> "$CVR_OBSERVATION"
    group=unknown
    for arg in "$@"; do case "$arg" in
      *tests/unit/*) group=unit ;;
      *tests/contract/*) group=contract ;;
      *tests/integration/*) group=integration ;;
      *tests/e2e/*) group=e2e ;;
      *tools/harness/project-board/*) group=project-board ;;
    esac; done
    target=unknown
    for arg in "$@"; do case "$arg" in
      *.test.*)
        target="\${arg##*/}"
        printf '%s:%s:%s\\n' "$group" "$target" "\${XANTHIL_REAL_PI_ACCEPTANCE-unset}" >> "$CVR_OBSERVATION"
        ;;
    esac; done
    [ "$target" != unknown ] || printf '%s:%s:%s\\n' "$group" "$target" "\${XANTHIL_REAL_PI_ACCEPTANCE-unset}" >> "$CVR_OBSERVATION"
    printf 'native %s stdout\\n' "$group"
    printf 'native %s stderr\\n' "$group" >&2
    if [ "\${CVR_FIXTURE_FAIL:-}" = "$group" ]; then exit 23; fi
    if [ "\${CVR_FIXTURE_FAIL_TARGET:-}" = "$target" ]; then exit 31; fi
    ;;
  *) printf 'unexpected fake node invocation: %s\\n' "$*" >&2; exit 64 ;;
esac
`);
  await writeExecutable(path.join(bin, 'npm'), `#!/bin/sh
case "$1" in
  --version) printf '11.12.1\\n' ;;
  run)
    [ "$2" = typecheck ] || exit 64
    printf 'typecheck\\n' >> "$CVR_OBSERVATION"
    [ "\${CVR_FIXTURE_FAIL:-}" != typecheck ] || exit 29
    ;;
  *) exit 64 ;;
esac
`);
  await writeExecutable(path.join(bin, 'duckdb'), `#!/bin/sh
[ "$1" = --version ] && printf '%s\\n' '${duckdbOutput}' || exit 64
`);
  await writeExecutable(path.join(bin, 'python3'), "#!/bin/sh\n[ \"$1\" = --version ] && printf 'Python 3.9.6\\n' || exit 64\n");

  const health = await run(path.join(bin, 'node'), ['--test', 'tests/unit/xanthil-local-analysis/local-analysis.unit.test.ts'], {
    cwd: root,
    env: { ...process.env, CVR_OBSERVATION: observation }
  });
  assert.equal(health.code, 0, 'fixture command health must be GREEN before runner observation');
  assert.match(await readFile(observation, 'utf8'), /unit:local-analysis\.unit\.test\.ts:unset\n$/, 'fixture must record an independently healthy child');
  await writeFile(observation, '', 'utf8');

  t.after(() => rm(root, { recursive: true, force: true }));
  const syntaxBasenames = (await entries(root))
    .filter((file) => file.endsWith('.mjs') || file.endsWith('.ts'))
    .map((file) => path.basename(file))
    .sort();
  return { root, bin, observation, failGroup, failTarget, syntaxBasenames };
}

async function installPublicRunner(f) {
  await stat(PUBLIC_RUNNER).catch(() => assert.fail(`expected public entrypoint is absent: ${PUBLIC_RUNNER}`));
  const destination = path.join(f.root, 'tools', 'harness', 'validation', 'run');
  await cp(PUBLIC_RUNNER, destination);
  await chmod(destination, 0o755);
  return destination;
}

async function invoke(f, runner, inherited = {}, args = []) {
  return run(runner, args, {
    cwd: path.join(f.root, 'elsewhere'),
    env: {
      ...process.env,
      ...inherited,
      PATH: '/caller-path-that-must-not-be-used',
      JUANERAI_TOOLCHAIN_BIN: f.bin,
      CVR_OBSERVATION: f.observation,
      CVR_FIXTURE_FAIL: f.failGroup,
      CVR_FIXTURE_FAIL_TARGET: f.failTarget
    }
  });
}

async function observedLines(f) {
  const text = await readFile(f.observation, 'utf8');
  return text === '' ? [] : text.trim().split('\n');
}

test('CI-PORTABLE-001: explicit portable mode retains every portable suite and reports package/GUI NOT RUN', async (t) => {
  const f = await fixture(t, { runnerTuple: 'CF' });
  const runner = await installPublicRunner(f);
  await mkdir(path.join(f.root, 'elsewhere'));
  const result = await invoke(f, runner, { XANTHIL_REAL_PI_ACCEPTANCE: '1' }, ['--portable']);
  assert.equal(result.code, 0, result.stderr);
  const excluded = ['xanthil-desktop-main-module-format.contract.test.ts', 'xanthil-desktop.e2e.test.ts'];
  assertCanonicalOrder(await observedLines(f), f, expectedRunnerChildren('CF').filter(line => !excluded.some(name => line.includes(name))));
  for (const label of ['Electron binary', 'packaged Main module', 'Desktop packaged GUI', 'native/manual acceptance']) {
    assert.ok(result.stdout.includes(`NOT RUN: ${label}`), label);
  }
  assert.doesNotMatch(result.stdout, /full.*PASS|product.*PASS/i);
});

test('CI-PORTABLE-002: portable failures stop later suites and default mode cannot inherit a portable bypass', async (t) => {
  const f = await fixture(t, { runnerTuple: 'CF', failTarget: 'xanthil-desktop-store.contract.test.ts' });
  const runner = await installPublicRunner(f);
  await mkdir(path.join(f.root, 'elsewhere'));
  const result = await invoke(f, runner, {}, ['--portable']);
  assert.equal(result.code, 31);
  assert.match(result.stderr, /native contract stderr/);
  assert.equal((await observedLines(f)).some(line => !line.startsWith('syntax:') && line.includes('xanthil-desktop-storage.integration.test.ts')), false);
  const full = await fixture(t, { runnerTuple: 'CF' });
  const fullRunner = await installPublicRunner(full);
  await mkdir(path.join(full.root, 'elsewhere'));
  assert.equal((await invoke(full, fullRunner, { JUANERAI_VALIDATION_SCOPE: 'portable' })).code, 0);
  assertCanonicalOrder(await observedLines(full), full, expectedRunnerChildren('CF'));
});

function assertCanonicalOrder(lines, f, expectedSuites) {
  const syntax = lines.filter((line) => line.startsWith('syntax:'));
  const phases = lines.filter((line) => !line.startsWith('syntax:') && !line.startsWith('argv:'));
  assert.deepEqual(syntax.slice().sort(), f.syntaxBasenames.map((name) => `syntax:${name}`));
  assert.deepEqual(phases, ['typecheck', ...expectedSuites]);
  assert.equal(lines.indexOf('typecheck'), syntax.length, 'native syntax checks must precede the strict typecheck phase');
}

test('Final CF checkpoint preserves mapped roots and complete offline behavior coverage', async () => {
  assert.equal(await currentRunnerTuple(), 'CF');
  const source = await readFile(PUBLIC_RUNNER, 'utf8');
  assert.deepEqual(testTargetsFromRunnerSource(source), expectedRunnerTestTargets('CF'));
  assert.doesNotMatch(source, /phase[_-]?selector|configuration[_-]?selector|desktop:package/);
});

test('CVR-TEST-001: selected toolchain passes and starts offline checks in order', async (t) => {
  const tuple = await currentRunnerTuple();
  const f = await fixture(t, { runnerTuple: tuple });
  const runner = await installPublicRunner(f);
  await mkdir(path.join(f.root, 'elsewhere'));
  const result = await invoke(f, runner);
  assert.equal(result.code, 0);
  const lines = await observedLines(f);
  assert.ok(lines.includes('typecheck'), 'the strict typecheck phase must run after native syntax checks');
  assertCanonicalOrder(lines, f, expectedRunnerChildren(tuple));
  assert.deepEqual(desktopArgvRecords(lines), focusedChildren(tuple).map((argv) => `argv:${argv.join('|')}`), `${tuple} retains every C0 child effect and adds only its fixed C1a focused argv`);
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
  const tuple = await currentRunnerTuple();
  const f = await fixture(t, { runnerTuple: tuple });
  const runner = await installPublicRunner(f);
  await mkdir(path.join(f.root, 'elsewhere'));
  const result = await invoke(f, runner, { XANTHIL_REAL_PI_ACCEPTANCE: '1' });
  assert.equal(result.code, 0);
  assert.match(await readFile(f.observation, 'utf8'), /e2e:.*:unset/);
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
  assertCanonicalOrder(await observedLines(f), f, [
    'unit:local-analysis.unit.test.ts:unset',
    'contract:local-analysis-ports.contract.test.ts:unset'
  ]);
  assert.deepEqual(await entries(f.root), before, 'runner must not create a result or other persistent output');
});

test('TEST-XDESK-013: each approved C0 or C1a tuple runs only its independently fixed validation phase order and stops at its first native failure', async (t) => {
  const tuple = await currentRunnerTuple();
  const f = await fixture(t, { runnerTuple: tuple });
  const runner = await installPublicRunner(f);
  await mkdir(path.join(f.root, 'elsewhere'));
  const result = await invoke(f, runner);
  assert.equal(result.code, 0);
  const lines = await observedLines(f);
  assertCanonicalOrder(lines, f, expectedRunnerChildren(tuple));
  assert.deepEqual(
    desktopArgvRecords(lines),
    focusedChildren(tuple).map((argv) => `argv:${argv.join('|')}`),
    `${tuple} invokes only its independently fixed Desktop child argv; C0/C1a runner mismatch is rejected rather than inferred`,
  );

  const failureTarget = tuple !== 'C0' ? 'xanthil-desktop.unit.test.ts' : 'local-analysis-ports.contract.test.ts';
  const failing = await fixture(t, { runnerTuple: tuple, failTarget: failureTarget });
  const failingRunner = await installPublicRunner(failing);
  await mkdir(path.join(failing.root, 'elsewhere'));
  const failed = await invoke(failing, failingRunner);
  assert.notEqual(failed.code, 0);
  assert.match(failed.stdout, tuple !== 'C0' ? /native unit stdout/ : /native contract stdout/);
  assert.match(failed.stderr, tuple !== 'C0' ? /native unit stderr/ : /native contract stderr/);
  const stopped = (await observedLines(failing)).filter((line) => !line.startsWith('syntax:') && !line.startsWith('argv:'));
  const expectedStopped = tuple !== 'C0'
    ? ['typecheck', ...C0_RUNNER_CHILDREN,...CF_CONSOLE_PATHS.map(p=>p.split('/')[1]+':'+p.split('/').at(-1)+':unset'), 'unit:coverage-map.test.ts:unset','unit:xanthil-desktop.unit.test.ts:unset']
    : [
    'typecheck',
    'unit:local-analysis.unit.test.ts:unset',
    'contract:local-analysis-ports.contract.test.ts:unset',
  ];
  assert.deepEqual(stopped, expectedStopped, `${tuple} streams its first failing retained/focused phase and stops every later phase`);
});

test('AC-XDESK-LA-004-01: preflights exact local tool and dependency health before product phases without calling it RED', async (t) => {
  const f = await fixture(t, { wrongNode: true });
  const runner = await installPublicRunner(f);
  await mkdir(path.join(f.root, 'elsewhere'));
  const result = await invoke(f, runner);
  assert.notEqual(result.code, 0);
  assert.equal(await readFile(f.observation, 'utf8'), '', 'preflight failure must stop before syntax, typecheck, or product suites');
});

test('AC-XDESK-LA-004-02: C0/C1a retain only their fixed runner phase list and exact selector-free focused argv', async () => {
  const tuple = await currentRunnerTuple();
  const source = await readFile(PUBLIC_RUNNER, 'utf8');
  assert.deepEqual(testTargetsFromRunnerSource(source), expectedRunnerTestTargets(tuple), `${tuple} runner target order is a fixed Test literal and cannot borrow another tuple's phase`);
  assert.doesNotMatch(source, /test-name-pattern|phase[_-]?selector|configuration[_-]?selector/, 'the final runner has no partial coverage or runtime/configuration selector');
  assert.equal(CF_CONSOLE_PATHS.length,4);assert.equal(CF_DESKTOP_GROUPS.length,4);
});

test('AC-XDESK-LA-004-03: streams native failure stops later phases removes real-model gate and creates no success output', async (t) => {
  const f = await fixture(t, { failGroup: 'integration' });
  const runner = await installPublicRunner(f);
  await mkdir(path.join(f.root, 'elsewhere'));
  const before = await entries(f.root);
  const result = await invoke(f, runner, { XANTHIL_REAL_PI_ACCEPTANCE: '1' });
  assert.notEqual(result.code, 0);
  assert.match(result.stdout, /native integration stdout/);
  assert.match(result.stderr, /native integration stderr/);
  assert.doesNotMatch(await readFile(f.observation, 'utf8'), /:1$/m);
  assert.deepEqual(await entries(f.root), before);
});

test('AC-XDESK-LA-004-04: C0/C1a preserve the no-debug gate separation without preclaiming package or native acceptance', async (t) => {
  const tuple = await currentRunnerTuple();
  const source = await readFile(PUBLIC_RUNNER, 'utf8');
  const desktopTargets = testTargetsFromRunnerSource(source).filter((target) => target.includes('xanthil-desktop'));
  assert.deepEqual(desktopTargets,expectedRunnerTestTargets(tuple).filter(target=>target.includes('xanthil-desktop')), 'CF runs all Desktop phases against the separately frozen healthy package');
  assert.doesNotMatch(source, /desktop:package/, 'the runner cannot silently rebuild or claim normal native/manual acceptance');
  assert.match(source, /unset XANTHIL_REAL_PI_ACCEPTANCE/, 'the runner explicitly removes the inherited real-model gate before its children');
  const f = await fixture(t, { runnerTuple: tuple });
  const runner = await installPublicRunner(f);
  await mkdir(path.join(f.root, 'elsewhere'));
  const result = await invoke(f, runner, { XANTHIL_REAL_PI_ACCEPTANCE: '1' });
  assert.equal(result.code, 0);
  assert.doesNotMatch(await readFile(f.observation, 'utf8'), /:1$/m, 'the real owned children receive no inherited real-model gate');
});
