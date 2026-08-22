import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { coverageCases, coverageMap } from '../../fixtures/xanthil-local-analysis/coverage-map.ts';

test('coverage-map-exact-set-and-actual-test-labels', async () => {
  const spec = await readFile(new URL('../../../openspec/specs/local-analysis/spec.md', import.meta.url), 'utf8');
  const specAcs = [...new Set(spec.match(/AC-XCLI-\d{3}-\d{2}/g))].sort();
  assert.deepEqual(Object.keys(coverageMap).sort(), specAcs);
  for (const [label, entry] of Object.entries(coverageCases)) {
    const testText = await readFile(new URL(`../../${entry.file}`, import.meta.url), 'utf8');
    assert.match(testText, new RegExp(label));
    assert.match(testText, new RegExp(`case:${entry.case}(?:\\s|$)`));
  }
});
