import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, realpath, rm, symlink, writeFile } from 'node:fs/promises';
import { spawn, spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = fileURLToPath(new URL('../../../', import.meta.url));
const WORKFLOW = path.join(REPO_ROOT, '.github', 'workflows', 'ci.yml');
const DUCKDB_URL = 'https://github.com/duckdb/duckdb/releases/download/v1.5.2/duckdb_cli-linux-amd64.zip';
const DUCKDB_SHA256 = 'fc9145affabca627431e73ddaf6b8117e5c192692480c13886f227be202d5d15';

// CI-PERF-005: selected bin -> actual resolved paths/versions and bounded CPU
// diagnostics. Unavailable quota is UNKNOWN; a required tool failure stops the
// step. No environment dump, implicit tool fallback or validation-mode change.
test('CI-PERF-005: existing CI step reports selected runtime and CPU without exposing environment', async t => {
  const workflow = await readFile(WORKFLOW, 'utf8');
  const shell = workflow.split('        run: |\n')[1].split('\n').map(line => line.replace(/^          /, '')).join('\n');
  const diagnostic = shell.slice(shell.indexOf('export JUANERAI_TOOLCHAIN_BIN'), shell.indexOf('export JUANERAI_TEST_EVIDENCE_DIR'));
  const root = await mkdtemp(path.join(tmpdir(), 'juanerai-ci-runtime-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  await symlink(process.execPath, path.join(root, 'node'));
  const versions = { npm: '11.12.1', python3: 'Python 3.9.6', duckdb: 'v1.5.2 (fixture)' };
  for (const [tool, version] of Object.entries(versions)) await writeFile(path.join(root, tool), `#!/bin/sh\n[ "$1" = --version ] || exit 64\nprintf '%s\\n' '${version}'\n`, { mode: 0o755 });
  const invoke = () => spawnSync('/bin/bash', ['-ec', diagnostic], { env: { PATH: '/usr/bin:/bin', TOOLCHAIN_BIN: root, PRIVATE_TEST_SENTINEL: 'must-not-appear-in-runtime-diagnostics' }, encoding: 'utf8', timeout: 10000 });
  const result = invoke();
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /^CI_RUNTIME /, 'existing full CI step must emit actual runtime diagnostics');
  const report = JSON.parse(result.stdout.trim().replace(/^CI_RUNTIME /, ''));
  assert.deepEqual(Object.keys(report).sort(), ['availableParallelism', 'cpuModel', 'cpuQuota', 'tools']);
  assert.deepEqual(Object.keys(report.tools).sort(), ['duckdb', 'node', 'npm', 'python3']);
  for (const [tool, version] of Object.entries({ node: process.version, ...versions })) {
    assert.deepEqual(report.tools[tool], { path: await realpath(path.join(root, tool)), version });
  }
  assert.ok(Number.isInteger(report.availableParallelism) && report.availableParallelism >= 1);
  assert.equal(typeof report.cpuModel, 'string'); assert.ok(report.cpuModel.length > 0);
  assert.match(report.cpuQuota, /^(?:UNKNOWN|(?:max|[0-9]+) [0-9]+)$/);
  assert.doesNotMatch(result.stdout, /PRIVATE_TEST_SENTINEL|must-not-appear-in-runtime-diagnostics/);
  await writeFile(path.join(root, 'python3'), '#!/bin/sh\nexit 17\n', { mode: 0o755 });
  assert.notEqual(invoke().status, 0, 'required tool failure cannot become invented successful diagnostics');
});

test('CI-LOG-003: CI emits both streams before the child exits and preserves failure/timing', async t => {
  const workflow = await readFile(WORKFLOW, 'utf8');
  const shell = workflow.split('        run: |\n')[1].split('\n').map(line => line.replace(/^          /, '')).join('\n');
  const definition = shell.slice(shell.indexOf('run_logged() {'), shell.indexOf('\ntest "$(node --version)"'));
  const root = await mkdtemp(path.join(tmpdir(), 'juanerai-ci-stream-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const child = spawn('/bin/bash', ['-c', `set -e\ntimeout() { shift 3; "$@"; }\n${definition}\nrun_logged live /bin/sh -c 'printf live-out; printf live-err >&2; i=0; while [ ! -f "$RUNNER_TEMP/seen" ]; do i=$((i+1)); [ "$i" -lt 50 ] || exit 88; sleep 0.1; done; exit 17'`], {
    env: { PATH: '/usr/bin:/bin', RUNNER_TEMP: root },
  });
  let stdout = '', stderr = '', acknowledged = false;
  const acknowledge = () => {
    if (!acknowledged && stdout.includes('live-out') && stderr.includes('live-err')) {
      acknowledged = true;
      void writeFile(path.join(root, 'seen'), 'both streams observed');
    }
  };
  child.stdout.on('data', chunk => { stdout += chunk; acknowledge(); });
  child.stderr.on('data', chunk => { stderr += chunk; acknowledge(); });
  const status = await new Promise((resolve, reject) => { child.on('error', reject); child.on('close', resolve); });
  assert.equal(status, 17, 'child only returns 17 after both streams reach the observer before exit');
  assert.match(stdout, /DURATION live [0-9]+s/);
  assert.match(stdout, /EXIT live 17/);
  assert.equal(await readFile(path.join(root, 'live.stdout'), 'utf8'), 'live-out');
  assert.equal(await readFile(path.join(root, 'live.stderr'), 'utf8'), 'live-err');
});

const VALID_WORKFLOW = `on:
  pull_request:
    branches:
      - main
permissions:
  contents: read
concurrency:
  group: \${{ github.workflow }}-\${{ github.ref }}
  cancel-in-progress: true
jobs:
  canonical-validation:
    name: Canonical validation
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-node@v7
        with:
          node-version: 26.0.0
          package-manager-cache: false
      - run: |
          test "$(node --version)" = v26.0.0
          npm install --prefix "$RUNNER_TEMP/pinned-npm" --ignore-scripts --no-audit --no-fund --package-lock=false npm@11.12.1
          test "$(npm --version)" = 11.12.1
          curl --fail --location --output duckdb.zip ${DUCKDB_URL}
          printf '${DUCKDB_SHA256}  duckdb.zip\\n' | sha256sum --check --status
          unzip -q duckdb.zip -d "$RUNNER_TEMP/duckdb"
          TOOLCHAIN_BIN="$RUNNER_TEMP/juanerai-toolchain"
          mkdir -p "$TOOLCHAIN_BIN"
          ln -s "$(command -v node)" "$TOOLCHAIN_BIN/node"
          ln -s "$(command -v npm)" "$TOOLCHAIN_BIN/npm"
          install -m 755 "$RUNNER_TEMP/duckdb/duckdb" "$TOOLCHAIN_BIN/duckdb"
          npm ci --prefix "$INSTALL_VIEW" --ignore-scripts --no-audit --no-fund
          export JUANERAI_TOOLCHAIN_BIN="$TOOLCHAIN_BIN"
          run_logged portable-regression tools/harness/validation/run --portable
`;

function position(text, expression, description) {
  const found = text.search(expression);
  assert.notEqual(found, -1, description);
  return found;
}

function jobsBlock(workflow) {
  const start = workflow.search(/^jobs:\s*$/m);
  assert.notEqual(start, -1, 'workflow must declare jobs');
  return workflow.slice(start).replace(/^jobs:\s*\n/, '');
}

function setupNodeBlock(workflow) {
  const start = workflow.search(/^\s*-\s+uses:\s+actions\/setup-node@v7\s*$/m);
  assert.notEqual(start, -1, 'workflow must use actions/setup-node@v7');
  const remaining = workflow.slice(start);
  const nextStep = remaining.search(/\n\s*-\s+(?:uses|run|name):/);
  return remaining.slice(0, nextStep === -1 ? remaining.length : nextStep);
}

function assertWorkflow(workflow) {
  // PRCI-TEST-001: qualifying trigger and exactly one Ubuntu status job.
  assert.match(workflow, /^on:\s*\n\s+pull_request:\s*\n\s+branches:\s*\n\s+-\s*main\s*$/m);
  assert.doesNotMatch(workflow, /^\s*(?:push|workflow_dispatch|schedule|workflow_call):/m);
  assert.match(workflow, /^permissions:\s*\n\s+contents:\s+read\s*$/m);
  const jobs = jobsBlock(workflow);
  assert.match(jobs, /^  \S+:\s*\n\s+name:\s+Canonical validation\s*\n\s+runs-on:\s+ubuntu-latest\s*$/m);
  assert.equal((jobs.match(/^  [A-Za-z][\w-]*:\s*$/gm) ?? []).length, 1, 'workflow must declare exactly one job');

  // PRCI-TEST-002: read-only permissions and workflow/ref cancellation scope.
  assert.match(workflow, /^concurrency:\s*\n\s+group:\s*.*github\.workflow.*github\.ref.*\n\s+cancel-in-progress:\s+true\s*$/m);
  assert.doesNotMatch(workflow, /^\s+(?!contents:\s+read\s*$)\w[\w-]*:\s*(?:write|all)\s*$/m);
  assert.doesNotMatch(workflow, /^\s*(?:strategy|matrix):/m);

  // PRCI-TEST-003: fixed sources, fail-fast version checks, and verified temporary bin.
  assert.match(workflow, /uses:\s+actions\/checkout@v6/);
  const setupNode = setupNodeBlock(workflow);
  assert.match(workflow, /node-version:\s*['\"]?26\.0\.0['\"]?/);
  assert.match(setupNode, /^\s+package-manager-cache:\s+false\s*$/m, 'setup-node cache must be explicitly disabled');
  assert.doesNotMatch(setupNode, /^\s+cache:\s+/m, 'setup-node must not activate a package-manager cache');
  assert.doesNotMatch(workflow, /uses:\s+actions\/cache(?:\/|@)/i, 'workflow must not use actions/cache');
  assert.match(workflow, /npm[^\n]*11\.12\.1/);
  const nodeCheck = position(workflow, /node --version/, 'must check selected Node version');
  const npmCheck = position(workflow, /npm --version/, 'must check selected npm version');
  const npmCi = position(workflow, /(?:^|\n)\s*(?:run_logged dependency-install )?npm ci --prefix "\$INSTALL_VIEW" --ignore-scripts --no-audit --no-fund/m, 'must install locked dependencies scripts-off in the explicit view');
  assert.ok(nodeCheck < npmCi && npmCheck < npmCi, 'Node and npm version checks must precede npm ci');
  const download = position(workflow, new RegExp(DUCKDB_URL.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), 'must download the fixed official DuckDB asset');
  const checksum = position(workflow, new RegExp(`${DUCKDB_SHA256}[\\s\\S]*sha256sum\\s+--check\\s+--status`), 'must verify the fixed SHA-256 before extraction');
  const extraction = position(workflow, /(?:unzip|bsdtar)[^\n]*duckdb/i, 'must extract the verified DuckDB archive');
  assert.ok(download < checksum && checksum < extraction, 'DuckDB must be downloaded, verified, then extracted');
  const temporaryBin = position(workflow, /(?:mkdir -p|mktemp -d)[^\n]*TOOLCHAIN_BIN/, 'must construct a runner-temporary toolchain bin');
  assert.match(workflow, /RUNNER_TEMP/);
  assert.match(workflow, /(?:ln -s|cp|install)[^\n]*(?:command -v node|node)[^\n]*TOOLCHAIN_BIN\/node/, 'temporary bin must receive the selected node');
  assert.match(workflow, /(?:ln -s|cp|install)[^\n]*(?:command -v npm|npm)[^\n]*TOOLCHAIN_BIN\/npm/, 'temporary bin must receive the selected npm');
  const duckdbBin = position(workflow, /(?:ln -s|cp|install)[^\n]*(?:duckdb)[^\n]*TOOLCHAIN_BIN\/duckdb/i, 'temporary bin must receive verified duckdb');
  assert.ok(extraction < temporaryBin && temporaryBin < duckdbBin, 'temporary bin must receive DuckDB only after extraction');
  assert.doesNotMatch(workflow, /(?:apt(?:-get)?|brew|snap)\s+install[^\n]*duckdb/i);

  // PRCI-TEST-004: install dependencies before the explicit partial offline invocation.
  assert.match(workflow, /export JUANERAI_TOOLCHAIN_BIN="\$TOOLCHAIN_BIN"/);
  const runner = position(workflow, /run_logged portable-regression tools\/harness\/validation\/run --portable/, 'must invoke the explicit portable runner with its temporary bin');
  assert.ok(npmCi < runner, 'npm ci must precede canonical validation');
  assert.doesNotMatch(workflow, /XANTHIL_REAL_PI_ACCEPTANCE|(?:real[-_ ]?model|provider|secret|retry|fallback|artifact|coverage|deploy(?:ment)?|gh\s+api|curl[^\n]*api\.github)/i);
}

test('PRCI-TEST-001..004: assertion helper accepts the approved minimal declaration', () => {
  assertWorkflow(VALID_WORKFLOW);
});

test('PRCI-TEST-001..004: PR CI declaration is the single, fixed, explicitly portable offline check', async () => {
  assertWorkflow(await readFile(WORKFLOW, 'utf8'));
});

test('CI-TIMEOUT-001: only portable regression gets 1080s within the unchanged job cap', async t => {
  const workflow = await readFile(WORKFLOW, 'utf8');
  assert.match(workflow, /^    timeout-minutes: 20$/m);
  assertWorkflow(workflow);
  const shell = workflow.split('        run: |\n')[1].split('\n').map(line => line.replace(/^          /, '')).join('\n');
  const definition = shell.slice(shell.indexOf('run_logged() {'), shell.indexOf('\ntest "$(node --version)"'));
  const commands = ['portable-regression', 'npm-prepare', 'duckdb-download', 'node-gyp-download', 'install-view', 'dependency-install', 'installed-source-check', 'documentation', 'affected', 'agent-config'];
  const labels = [...commands, 'portable-regression-extra', 'unknown'];
  assert.deepEqual([...workflow.matchAll(/^\s+run_logged (\S+) /gm)].map(match => match[1]).sort(), commands.slice().sort());
  for (const label of labels) {
    for (const exit of [0, 17, 124]) {
      await t.test(`${label}: exit ${exit}`, async subtest => {
        const root = await mkdtemp(path.join(tmpdir(), 'juanerai-ci-timeout-'));
        subtest.after(() => rm(root, { recursive: true, force: true }));
        // Execute the actual logging function; replace only the wait with an
        // immediate argument-recording shim, as in the existing log tests.
        const invocation = `set -e\ntimeout() { printf '%s\\n' "$1" "$2" "$3" >> "$RUNNER_TEMP/timeout-args"; shift 3; "$@"; }\n${definition}\nrun_logged "$CI_LABEL" /bin/sh -c 'printf child-out; printf child-err >&2; exit "$CI_CHILD_EXIT"'\n`;
        const result = spawnSync('/bin/bash', ['-c', invocation], {
          env: { PATH: '/usr/bin:/bin', RUNNER_TEMP: root, CI_LABEL: label, CI_CHILD_EXIT: String(exit) },
          encoding: 'utf8', timeout: 10000,
        });
        assert.equal(result.signal, null);
        assert.equal(result.status, exit, result.stderr);
        assert.equal(await readFile(path.join(root, 'timeout-args'), 'utf8'), `--signal=TERM\n--kill-after=5s\n${label === 'portable-regression' ? '1080s' : '180s'}\n`);
        assert.equal(await readFile(path.join(root, `${label}.stdout`), 'utf8'), 'child-out');
        assert.equal(await readFile(path.join(root, `${label}.stderr`), 'utf8'), 'child-err');
        assert.ok(result.stdout.includes(`EXIT ${label} ${exit}\n`));
        assert.ok(result.stderr.includes('child-err'));
      });
    }
  }
});
