import assert from 'node:assert/strict';
import { chmod, lstat, mkdir, mkdtemp, readFile, readdir, realpath, rm, symlink, writeFile } from 'node:fs/promises';
import { dirname, join, relative, sep } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  approvedModel,
  expectedAnalysisInput,
  expectedAnalysisProposal,
  expectedConfirmedContract,
  expectedDiscoveryContext,
  expectedFindingContext,
  expectedFindingProposal,
  canonicalFixtureBytes,
  calculateFixtureOracle,
  fixtureByteSize,
  fixtureSha256,
  parseClosedFixture,
  referenceOracle,
  sha256,
} from '../../fixtures/xanthil-local-analysis/fixture-oracle.ts';
const repositoryRoot = fileURLToPath(new URL('../../../', import.meta.url));
test('TASK-006 TEST-XCLI-001 [AC-XCLI-004-01, AC-XCLI-004-02, AC-XCLI-005-01, AC-XCLI-016-01, AC-XCLI-016-04] verifies the sole canonical example bytes, schema, and reference oracle', async () => {
  const exampleRoot = join(repositoryRoot, 'examples', 'member-analysis');
  const source = join(exampleRoot, 'member-orders-v1.csv');
  const bytes = await readFile(source);
  assert.equal(bytes.byteLength, fixtureByteSize);
  assert.equal(sha256(bytes), fixtureSha256);
  const rows = parseClosedFixture(bytes);
  assert.equal(rows.length, 20);
  assert.deepEqual(calculateFixtureOracle(rows), referenceOracle);
  assert.deepEqual((await readdir(exampleRoot, { withFileTypes: true })).map((entry) => [entry.name, entry.isFile()]).sort(), [['member-orders-v1.csv', true]]);
});
