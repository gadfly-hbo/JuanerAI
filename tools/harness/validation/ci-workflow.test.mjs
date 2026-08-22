import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = fileURLToPath(new URL('../../../', import.meta.url));
const WORKFLOW = path.join(REPO_ROOT, '.github', 'workflows', 'ci.yml');
const DUCKDB_URL = 'https://github.com/duckdb/duckdb/releases/download/v1.5.2/duckdb_cli-linux-amd64.zip';
const DUCKDB_SHA256 = 'fc9145affabca627431e73ddaf6b8117e5c192692480c13886f227be202d5d15';

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
          npm install --global npm@11.12.1
          test "$(npm --version)" = 11.12.1
          curl --fail --location --output duckdb.zip ${DUCKDB_URL}
          printf '${DUCKDB_SHA256}  duckdb.zip\\n' | sha256sum --check --status
          unzip -q duckdb.zip -d "$RUNNER_TEMP/duckdb"
          TOOLCHAIN_BIN="$RUNNER_TEMP/juanerai-toolchain"
          mkdir -p "$TOOLCHAIN_BIN"
          ln -s "$(command -v node)" "$TOOLCHAIN_BIN/node"
          ln -s "$(command -v npm)" "$TOOLCHAIN_BIN/npm"
          install -m 755 "$RUNNER_TEMP/duckdb/duckdb" "$TOOLCHAIN_BIN/duckdb"
          npm ci
          JUANERAI_TOOLCHAIN_BIN="$TOOLCHAIN_BIN" tools/harness/validation/run
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
  const npmCi = position(workflow, /(?:^|\n)\s*npm ci(?:\s|$)/m, 'must install locked dependencies with npm ci');
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

  // PRCI-TEST-004: install dependencies before the exact offline runner invocation.
  const runner = position(workflow, /JUANERAI_TOOLCHAIN_BIN=[^\n\s]+\s+tools\/harness\/validation\/run/, 'must invoke only the canonical runner with its temporary bin');
  assert.ok(npmCi < runner, 'npm ci must precede canonical validation');
  assert.doesNotMatch(workflow, /XANTHIL_REAL_PI_ACCEPTANCE|(?:real[-_ ]?model|provider|secret|retry|fallback|artifact|coverage|deploy(?:ment)?|gh\s+api|curl[^\n]*api\.github)/i);
}

test('PRCI-TEST-001..004: assertion helper accepts the approved minimal declaration', () => {
  assertWorkflow(VALID_WORKFLOW);
});

test('PRCI-TEST-001..004: PR CI declaration is the single, fixed, offline canonical check', async () => {
  assertWorkflow(await readFile(WORKFLOW, 'utf8'));
});
