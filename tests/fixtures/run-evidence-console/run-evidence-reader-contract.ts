import assert from 'node:assert/strict';

import type { RunEvidenceObservation } from './run-evidence-fixtures.ts';

export type ReaderDriver = Readonly<{ readSelectedRun(input: Readonly<{ run_directory: string }>): Promise<RunEvidenceObservation> }>;

export async function runReaderContract(createReader: () => Promise<ReaderDriver>, runDirectory: string): Promise<void> {
  const reader = await createReader();
  assert.deepEqual(Object.keys(reader), ['readSelectedRun'], 'reader Port has exactly one read-only operation');
  const result = await reader.readSelectedRun({ run_directory: runDirectory });
  assert.equal(typeof result, 'object', 'reader returns standard-platform byte observations, not a product result');
  assert.equal(result.run_directory_name, runDirectory.split('/').at(-1));
  assert.deepEqual(Object.keys(result.files).sort(), ['analysis-contract.json', 'evidence.json', 'evidence.md', 'outputs/O-001.json', 'outputs/O-002.json', 'queries/Q-001.sql', 'run.json', 'scripts/S-001.py', 'summary.md']);
  await assert.rejects(
    () => reader.readSelectedRun({ run_directory: '' }),
    /RUN_READ_FAILED|rejected/,
    'invalid selection fails closed',
  );
}

export function deterministicReader(result: RunEvidenceObservation): ReaderDriver {
  return Object.freeze({
    async readSelectedRun(input: Readonly<{ run_directory: string }>) {
      if (!input.run_directory) throw Object.assign(new Error('rejected'), { code: 'RUN_READ_FAILED' });
      return result;
    },
  });
}
