export type RunEvidenceObservedFile = Readonly<{
  path: string;
  bytes: Uint8Array;
  byte_size: number;
  sha256: string;
}>;

export type RunEvidenceObservation = Readonly<{
  run_directory_name: string;
  files: Readonly<Record<string, RunEvidenceObservedFile>>;
}>;

export type RunEvidenceReader = Readonly<{
  readSelectedRun(input: Readonly<{ run_directory: string }>): Promise<RunEvidenceObservation>;
}>;

export function defineRunEvidenceReader(implementation: unknown): RunEvidenceReader {
  if (implementation === null || typeof implementation !== 'object' || Array.isArray(implementation)) throw new Error('INVALID_PORT_IMPLEMENTATION');
  const record = implementation as Record<string, unknown>;
  if (Object.keys(record).length !== 1 || typeof record.readSelectedRun !== 'function') throw new Error('INVALID_PORT_IMPLEMENTATION');
  return Object.freeze({ readSelectedRun: record.readSelectedRun as RunEvidenceReader['readSelectedRun'] });
}
