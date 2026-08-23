import { createHash } from 'node:crypto';

import { createLocalAnalysisDomain } from './local-analysis.ts';

type RunEvidenceObservation = Readonly<{ run_directory_name: string; files: Readonly<Record<string, Readonly<{ path: string; bytes: Uint8Array; byte_size: number; sha256: string }>>> }>;

type RecordValue = Record<string, unknown>;
export type RunEvidenceErrorCode = 'RUN_CONTRACT_UNSUPPORTED' | 'RUN_REFERENCE_INVALID' | 'RUN_CHECKSUM_MISMATCH' | 'RUN_READ_FAILED';
export type RunEvidenceIntegrity = Readonly<{ path: string; outcome: 'verified' }>;
export type RunEvidenceProvenance = Readonly<{
  recorded_product_version: string;
  recorded_agent_runtime_version: string;
  recorded_agent_adapter_version: string;
  recorded_model: Readonly<{ provider: string; model_id: string }>;
}>;
export type RunEvidenceAsset = Readonly<{ artifact_id: string; category: string; path: string; media_type: string; byte_size: number; sha256: string; label: 'SQL' | 'Python' | 'JSON' | 'Markdown'; display_text: string }>;
export type VerifiedSucceededRunEvidenceView = Readonly<{
  question: string; original_question: string; sources: readonly RecordValue[]; time_windows: readonly RecordValue[]; metrics: readonly RecordValue[];
  findings: readonly RecordValue[]; evidence: readonly RecordValue[]; assets: readonly RunEvidenceAsset[]; summary: string; evidence_document: string;
  limitations: readonly string[]; contract_version: string; provenance: RunEvidenceProvenance;
}>;
export type VerifiedNonSuccessRunEvidenceView = Readonly<{ status: string; ended_at?: string; terminal_stage?: string; error_code?: string; assets?: readonly RecordValue[]; provenance: RunEvidenceProvenance }>;
export type RunEvidenceResult = Readonly<{
  kind: 'rejected'; error: Readonly<{ code: RunEvidenceErrorCode }>;
}> | Readonly<{
  kind: 'verified_non_success'; view: VerifiedNonSuccessRunEvidenceView; integrity: readonly RunEvidenceIntegrity[];
}> | Readonly<{
  kind: 'verified_succeeded'; view: VerifiedSucceededRunEvidenceView; integrity: readonly RunEvidenceIntegrity[];
}>;

const reject = (code: RunEvidenceErrorCode): RunEvidenceResult => Object.freeze({ kind: 'rejected', error: Object.freeze({ code }) });
const isRecord = (value: unknown): value is RecordValue => value !== null && typeof value === 'object' && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype;
const sha256 = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex');
/** JSON.parse accepts duplicate members and Buffer's UTF-8 conversion replaces invalid
 * bytes. Artifact admission must fail closed for both, before any projection. */
function strictText(bytes: Uint8Array): string {
  return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
}

function strictJson(file: { bytes: Uint8Array }): unknown {
  const source = strictText(file.bytes);
  let cursor = 0;
  const whitespace = () => { while (/\s/.test(source[cursor] ?? '')) cursor += 1; };
  const string = (): string => {
    const start = cursor;
    if (source[cursor] !== '"') throw new Error('json');
    cursor += 1;
    while (cursor < source.length) {
      if (source[cursor] === '\\') { cursor += 2; continue; }
      if (source[cursor++] === '"') return JSON.parse(source.slice(start, cursor)) as string;
    }
    throw new Error('json');
  };
  const value = (): void => {
    whitespace();
    if (source[cursor] === '{') {
      cursor += 1; const names = new Set<string>(); whitespace();
      if (source[cursor] === '}') { cursor += 1; return; }
      while (true) {
        whitespace(); const name = string();
        if (names.has(name)) throw new Error('duplicate');
        names.add(name); whitespace(); if (source[cursor++] !== ':') throw new Error('json');
        value(); whitespace();
        if (source[cursor] === '}') { cursor += 1; return; }
        if (source[cursor++] !== ',') throw new Error('json');
      }
    }
    if (source[cursor] === '[') {
      cursor += 1; whitespace(); if (source[cursor] === ']') { cursor += 1; return; }
      while (true) { value(); whitespace(); if (source[cursor] === ']') { cursor += 1; return; } if (source[cursor++] !== ',') throw new Error('json'); }
    }
    if (source[cursor] === '"') { string(); return; }
    const match = /^(?:true|false|null|-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?)/.exec(source.slice(cursor));
    if (!match) throw new Error('json');
    cursor += match[0].length;
  };
  value(); whitespace(); if (cursor !== source.length) throw new Error('json');
  return JSON.parse(source);
}
const hasExactKeys = (value: unknown, keys: readonly string[]): value is RecordValue => isRecord(value) && Object.keys(value).length === keys.length && keys.every((key) => Object.hasOwn(value, key) && value[key] !== null && value[key] !== undefined);

function schemaVersionFailure(value: unknown): RunEvidenceErrorCode | undefined {
  if (!isRecord(value) || !Object.hasOwn(value, 'schema_version') || typeof value.schema_version !== 'string') return 'RUN_READ_FAILED';
  return value.schema_version === '1.0' ? undefined : 'RUN_CONTRACT_UNSUPPORTED';
}

function parsePointer(value: unknown, output: unknown): boolean {
  if (!isRecord(value) || !hasExactKeys(value, ['artifact_id', 'json_pointer']) || typeof value.json_pointer !== 'string') return false;
  let current: unknown = output;
  if (value.json_pointer === '') return true;
  if (!/^(?:\/(?:[^~/]|~[01])*)*$/.test(value.json_pointer)) return false;
  for (const part of value.json_pointer.slice(1).split('/')) {
    const key = part.replace(/~1/g, '/').replace(/~0/g, '~');
    if (Array.isArray(current) && /^0$|^[1-9]\d*$/.test(key) && Object.hasOwn(current, key)) current = current[Number(key)];
    else if (isRecord(current) && Object.hasOwn(current, key)) current = current[key];
    else return false;
    if (current === undefined) return false;
  }
  return true;
}

function validConfirmedContract(value: unknown, runId: string): boolean {
  const keys = ['schema_version', 'run_id', 'confirmed_at', 'original_question', 'question', 'objective', 'source_ids', 'time_windows', 'metrics', 'signal_rule', 'output_requirements', 'constraints'];
  if (!hasExactKeys(value, keys) || value.schema_version !== '1.0' || value.run_id !== runId) return false;
  if (typeof value.confirmed_at !== 'string' || Number.isNaN(Date.parse(value.confirmed_at)) || new Date(value.confirmed_at).toISOString() !== value.confirmed_at) return false;
  try {
    createLocalAnalysisDomain().validateAnalysisProposal({
      schema_version: value.schema_version, original_question: value.original_question, question: value.question,
      objective: value.objective, source_ids: value.source_ids,
      fixture: { source_id: 'SRC-001', version: 'member-orders-v1', kind: 'csv', path: 'member-orders-v1.csv', sha256: 'c0d1c3d2b1e8621955ab786dc87cebc14437033bda4def397498db5a1544ebb0', byte_size: 530, columns: ['order_id', 'member_id', 'ordered_on'], date_coverage: { start_date: '2026-08-01', end_date: '2026-08-14' } },
      time_windows: value.time_windows, metrics: value.metrics, signal_rule: value.signal_rule,
      output_requirements: value.output_requirements, constraints: value.constraints,
    });
    return true;
  } catch { return false; }
}

function observedFile(observation: RunEvidenceObservation, path: string) {
  const file = observation.files[path];
  if (!file || file.path !== path || !(file.bytes instanceof Uint8Array) || !Number.isInteger(file.byte_size) || file.byte_size < 0 || typeof file.sha256 !== 'string') throw new Error('read');
  return file;
}

function observedChecksum(file: { bytes: Uint8Array; byte_size: number; sha256: string }): string {
  const actual = sha256(file.bytes);
  if (file.byte_size !== file.bytes.byteLength || file.sha256 !== actual) throw Object.assign(new Error('checksum'), { code: 'RUN_CHECKSUM_MISMATCH' });
  return actual;
}

function optionalObservedFile(observation: RunEvidenceObservation, path: string) {
  return Object.hasOwn(observation.files, path) ? observedFile(observation, path) : undefined;
}

function provenance(manifest: RecordValue) {
  const runtime = manifest.runtime as RecordValue;
  const model = manifest.model as RecordValue;
  const productVersion = runtime[['xanthil', 'version'].join('_')] as string;
  const adapterVersion = runtime[['pi', 'adapter', 'version'].join('_')] as string;
  const runtimeVersion = runtime[['pi', 'version'].join('_')] as string;
  return Object.freeze({
    recorded_product_version: productVersion,
    recorded_agent_runtime_version: runtimeVersion,
    recorded_agent_adapter_version: adapterVersion,
    recorded_model: Object.freeze({ provider: model.provider as string, model_id: model.model_id as string }),
  });
}

function evidenceHasValidShape(evidence: unknown): boolean {
  if (!hasExactKeys(evidence, ['schema_version', 'run_id', 'findings', 'evidence_items']) || !Array.isArray(evidence.findings) || evidence.findings.length === 0 || !Array.isArray(evidence.evidence_items) || evidence.evidence_items.length === 0) return false;
  return evidence.findings.every((finding) => hasExactKeys(finding, ['finding_id', 'status', 'statement', 'evidence_ids', 'limitations'])
    && typeof finding.finding_id === 'string' && /^F-\d{3}$/.test(finding.finding_id) && typeof finding.status === 'string' && ['supported', 'contradicted', 'inconclusive'].includes(finding.status) && typeof finding.statement === 'string' && finding.statement.length > 0 && Array.isArray(finding.evidence_ids) && Array.isArray(finding.limitations) && finding.limitations.length > 0
    && finding.evidence_ids.every((id) => typeof id === 'string') && finding.limitations.every((value) => typeof value === 'string' && value.length > 0))
    && evidence.evidence_items.every((item) => isRecord(item) && hasExactKeys(item, ['evidence_id', 'description', 'source_ids', 'artifact_ids']) || isRecord(item) && hasExactKeys(item, ['evidence_id', 'description', 'source_ids', 'artifact_ids', 'result_reference']))
    && evidence.evidence_items.every((item) => {
      if (!isRecord(item) || typeof item.evidence_id !== 'string' || !/^E-\d{3}$/.test(item.evidence_id) || typeof item.description !== 'string' || !item.description || !Array.isArray(item.source_ids) || !Array.isArray(item.artifact_ids) || !item.source_ids.every((id) => typeof id === 'string') || !item.artifact_ids.every((id) => typeof id === 'string')) return false;
      return !Object.hasOwn(item, 'result_reference') || (isRecord(item.result_reference) && hasExactKeys(item.result_reference, ['artifact_id', 'json_pointer']) && typeof item.result_reference.artifact_id === 'string' && typeof item.result_reference.json_pointer === 'string' && /^(?:\/(?:[^~/]|~[01])*)*$/.test(item.result_reference.json_pointer));
    });
}

export function createRunEvidenceDomain() {
  const existing = createLocalAnalysisDomain();
  function admit(observation: RunEvidenceObservation): RunEvidenceResult {
    try {
      if (!isRecord(observation) || typeof observation.run_directory_name !== 'string' || !observation.run_directory_name || !isRecord(observation.files)) return reject('RUN_READ_FAILED');
      const manifestFile = observedFile(observation, 'run.json');
      const manifestRaw = strictJson(manifestFile);
      const manifestVersionFailure = schemaVersionFailure(manifestRaw);
      if (manifestVersionFailure) return reject(manifestVersionFailure);
      let manifest: RecordValue;
      try { manifest = existing.validateReadableTerminalRunManifest(manifestRaw); } catch (error) { return reject(String(error).includes('CONTRACT_VERSION_UNSUPPORTED') ? 'RUN_CONTRACT_UNSUPPORTED' : 'RUN_READ_FAILED'); }
      if (manifest.run_id !== observation.run_directory_name) return reject('RUN_READ_FAILED');
      const contractDescriptor = manifest.contract as RecordValue;
      const status = manifest.status as string;
      const contractFile = optionalObservedFile(observation, 'analysis-contract.json');
      let contract: unknown;
      const integrity: RunEvidenceIntegrity[] = [];
      if (contractFile) {
        if (contractDescriptor.sha256 !== observedChecksum(contractFile)) return reject('RUN_CHECKSUM_MISMATCH');
        contract = strictJson(contractFile);
        const contractVersionFailure = schemaVersionFailure(contract);
        if (contractVersionFailure) return reject(contractVersionFailure);
        if (!validConfirmedContract(contract, manifest.run_id as string)) return reject('RUN_READ_FAILED');
        integrity.push({ path: 'analysis-contract.json', outcome: 'verified' });
      } else if (status === 'succeeded') return reject('RUN_READ_FAILED');
      const artifacts = manifest.artifacts as RecordValue[];
      if (status !== 'succeeded') {
        const terminal = manifest.terminal_detail as RecordValue | undefined;
        const retainedAssets: RecordValue[] = [];
        for (const artifact of artifacts) {
          const file = observedFile(observation, artifact.path as string);
          if (file.byte_size !== artifact.byte_size || file.sha256 !== artifact.sha256 || observedChecksum(file) !== artifact.sha256) return reject('RUN_CHECKSUM_MISMATCH');
          integrity.push({ path: artifact.path as string, outcome: 'verified' });
          retainedAssets.push(Object.freeze({ ...artifact }));
        }
        return Object.freeze({ kind: 'verified_non_success', view: Object.freeze({ status, ended_at: manifest.ended_at as string, terminal_stage: terminal?.stage as string, ...(status === 'failed' ? { error_code: terminal?.error_code as string } : {}), ...(retainedAssets.length > 0 ? { assets: Object.freeze(retainedAssets) } : {}), provenance: provenance(manifest) }), integrity: Object.freeze(integrity) });
      }
      const evidenceFile = observedFile(observation, 'evidence.json');
      if ((manifest.evidence as RecordValue).sha256 !== observedChecksum(evidenceFile)) return reject('RUN_CHECKSUM_MISMATCH');
      const evidence = strictJson(evidenceFile);
      const evidenceVersionFailure = schemaVersionFailure(evidence);
      if (evidenceVersionFailure) return reject(evidenceVersionFailure);
      if (!isRecord(evidence) || evidence.run_id !== manifest.run_id || !evidenceHasValidShape(evidence)) return reject('RUN_READ_FAILED');
      integrity.push({ path: 'evidence.json', outcome: 'verified' });
      const outputs: Record<string, unknown> = {};
      for (const artifact of artifacts) {
        const path = artifact.path as string;
        const file = observedFile(observation, path);
        if (file.byte_size !== artifact.byte_size || file.sha256 !== artifact.sha256 || observedChecksum(file) !== artifact.sha256) return reject('RUN_CHECKSUM_MISMATCH');
        integrity.push({ path, outcome: 'verified' });
        if ((artifact.category as string) === 'output') outputs[artifact.artifact_id as string] = strictJson(file);
      }
      try {
        existing.validateEvidenceIndex({ evidence, catalog: {
          sources: (manifest['sources'] as RecordValue[]).map((source) => ({ source_id: source.source_id, sha256: source.sha256 })),
          artifacts: artifacts.filter((artifact) => /^(Q|S|O)-\d{3}$/.test(artifact.artifact_id as string)).map((artifact) => ({ artifact_id: artifact.artifact_id, sha256: artifact.sha256, observed_sha256: sha256(observedFile(observation, artifact.path as string).bytes) })),
        } });
      } catch { return reject('RUN_REFERENCE_INVALID'); }
      for (const item of evidence.evidence_items as RecordValue[]) {
        if (Object.hasOwn(item, 'result_reference')) {
          const reference = item.result_reference as RecordValue;
          if (!parsePointer(reference, outputs[reference.artifact_id as string])) return reject('RUN_REFERENCE_INVALID');
        }
      }
      const assetLabel = (artifact: RecordValue) => artifact.category === 'query' ? 'SQL' : artifact.category === 'script' ? 'Python' : artifact.category === 'output' ? 'JSON' : 'Markdown';
      const assets: RunEvidenceAsset[] = artifacts.map((artifact) => Object.freeze({ artifact_id: artifact.artifact_id as string, category: artifact.category as string, path: artifact.path as string, media_type: artifact.media_type as string, byte_size: artifact.byte_size as number, sha256: artifact.sha256 as string, label: assetLabel(artifact), display_text: strictText(observedFile(observation, artifact.path as string).bytes) }));
      const acceptedContract = contract as RecordValue;
      const acceptedEvidence = evidence as RecordValue;
      const view: VerifiedSucceededRunEvidenceView = Object.freeze({
        question: acceptedContract.question as string, original_question: acceptedContract.original_question as string,
        sources: manifest.sources as RecordValue[], time_windows: acceptedContract.time_windows as RecordValue[], metrics: acceptedContract.metrics as RecordValue[],
        findings: acceptedEvidence.findings as RecordValue[], evidence: acceptedEvidence.evidence_items as RecordValue[], assets: Object.freeze(assets),
        summary: strictText(observedFile(observation, 'summary.md').bytes), evidence_document: strictText(observedFile(observation, 'evidence.md').bytes),
        limitations: (acceptedEvidence.findings as RecordValue[]).flatMap((finding) => finding.limitations as string[]), contract_version: manifest.schema_version as string,
        provenance: provenance(manifest),
      });
      return Object.freeze({ kind: 'verified_succeeded', view, integrity: Object.freeze(integrity) });
    } catch (error) { return reject((error as { code?: RunEvidenceErrorCode }).code === 'RUN_CHECKSUM_MISMATCH' ? 'RUN_CHECKSUM_MISMATCH' : 'RUN_READ_FAILED'); }
  }
  return Object.freeze({ admit });
}
