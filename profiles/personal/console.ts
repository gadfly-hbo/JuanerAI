import { createLocalRunEvidenceReader } from '../../adapters/storage-local/run-evidence-reader.ts';
import { createRunEvidenceQuery } from '../../packages/application/run-evidence-query.ts';

export function createPersonalConsoleProfile() {
  return Object.freeze({ query: createRunEvidenceQuery({ reader: createLocalRunEvidenceReader() }) });
}
