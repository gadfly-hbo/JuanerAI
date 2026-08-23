import { createRunEvidenceDomain } from '../product-core/run-evidence.ts';
import type { RunEvidenceResult } from '../product-core/run-evidence.ts';
import type { RunEvidenceReader } from '../ports/run-evidence-reader.ts';

export function createRunEvidenceQuery(dependency: Readonly<{ reader: RunEvidenceReader }>) {
  const domain = createRunEvidenceDomain();
  return Object.freeze({
    async read(input: Readonly<{ run_directory: string }>): Promise<RunEvidenceResult> {
      try { return domain.admit(await dependency.reader.readSelectedRun(input)); }
      catch (error) {
        const code = (error as { code?: string }).code;
        return { kind: 'rejected', error: { code: code === 'RUN_CONTRACT_UNSUPPORTED' || code === 'RUN_CHECKSUM_MISMATCH' ? code : 'RUN_READ_FAILED' } };
      }
    },
  });
}
