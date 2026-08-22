import assert from 'node:assert/strict';
import test from 'node:test';

import { runReaderContract, deterministicReader } from '../../fixtures/run-evidence-console/run-evidence-reader-contract.ts';
import { createExactRun, observeRun } from '../../fixtures/run-evidence-console/run-evidence-fixtures.ts';

const adapterUrl = new URL('../../../adapters/storage-local/run-evidence-reader.ts', import.meta.url);
const applicationUrl = new URL('../../../packages/application/run-evidence-query.ts', import.meta.url);

test('TEST-REC-004 [AC-REC-001-01..03, AC-REC-005-01..03, AC-REC-006-01..03] unchanged Reader Port driver runs against deterministic double and local Adapter', async (t) => {
  const fixture = await createExactRun();
  await t.test('deterministic_double', async () => runReaderContract(async () => deterministicReader(await observeRun(fixture.run)), fixture.run));
  await t.test('local_adapter', async () => {
    const { createLocalRunEvidenceReader } = await import(adapterUrl.href);
    await runReaderContract(async () => createLocalRunEvidenceReader(), fixture.run);
  });
  await t.test('application_preserves_reader_checksum_failure', async () => {
    const { createRunEvidenceQuery } = await import(applicationUrl.href);
    const query = createRunEvidenceQuery({ reader: Object.freeze({ async readSelectedRun() { throw Object.assign(new Error('checksum'), { code: 'RUN_CHECKSUM_MISMATCH' }); } }) });
    assert.deepEqual(await query.read({ run_directory: fixture.run }), { kind: 'rejected', error: { code: 'RUN_CHECKSUM_MISMATCH' } });
  });
});
