import { createHash, randomBytes } from 'node:crypto';
import { closeSync, constants, fstatSync, lstatSync, openSync, realpathSync } from 'node:fs';
import { mkdir, open, readFile, rename, rm } from 'node:fs/promises';
import { dirname, join, resolve, sep } from 'node:path';
import { createLocalAnalysisDomain } from '../../packages/product-core/local-analysis.ts';
import type { ArtifactDescriptor, PlainRecord, RunManifest } from '../../packages/product-core/local-analysis.ts';
import type { AnalysisAsset, RunArtifactStore } from '../../packages/ports/local-analysis.ts';

type StorageError = Error & { code: string };
type RootIdentity = Readonly<{ root: string; configuredRunRoot: string; device: number; inode: number; descriptor: number }>;

const uuidV7 = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const mappings: Readonly<Record<string, Readonly<{ category: string; path: string; media_type: string }>>> = Object.freeze({
  'Q-001': { category: 'query', path: 'queries/Q-001.sql', media_type: 'application/sql' },
  'S-001': { category: 'script', path: 'scripts/S-001.py', media_type: 'text/plain' },
  'O-001': { category: 'output', path: 'outputs/O-001.json', media_type: 'application/json' },
  'O-002': { category: 'output', path: 'outputs/O-002.json', media_type: 'application/json' },
  'DOC-SUMMARY': { category: 'summary', path: 'summary.md', media_type: 'text/markdown' },
  'DOC-EVIDENCE': { category: 'evidence_document', path: 'evidence.md', media_type: 'text/markdown' },
});
const successOrder = ['Q-001', 'S-001', 'O-001', 'O-002', 'DOC-SUMMARY', 'DOC-EVIDENCE'];
function safeError(code: string): StorageError { const value: StorageError = Object.assign(new Error(code), { code }); value.stack = code; return value; }
function fail(code: string): never { throw safeError(code); }
function plain(value: unknown): value is PlainRecord { return value !== null && typeof value === 'object' && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype; }
function closed(value: unknown, keys: readonly string[], code = 'ARTIFACT_WRITE_FAILED'): asserts value is PlainRecord { if (!plain(value) || Object.keys(value).length !== keys.length || keys.some((key) => !Object.hasOwn(value, key) || value[key] === null || value[key] === undefined)) fail(code); }
function checksum(bytes: Uint8Array): string { return createHash('sha256').update(bytes).digest('hex'); }
function isContained(root: string, value: string): boolean { return value.startsWith(`${root}${sep}`); }
function bytes(value: unknown): Buffer { if (!(Buffer.isBuffer(value) || value instanceof Uint8Array)) fail('ARTIFACT_WRITE_FAILED'); return Buffer.from(value); }
function liveSignal(value: unknown): AbortSignal {
  if (!(value instanceof AbortSignal) || value.aborted) fail('ARTIFACT_WRITE_FAILED');
  return value;
}
function errorCode(cause: unknown): unknown { return cause !== null && (typeof cause === 'object' || typeof cause === 'function') && 'code' in cause ? Reflect.get(cause, 'code') : undefined; }
function rootFrom(config: unknown): RootIdentity {
  closed(config, ['runRoot']);
  if (typeof config.runRoot !== 'string' || !config.runRoot.startsWith(sep)) fail('ARTIFACT_WRITE_FAILED');
  let descriptor: number | undefined;
  try {
    const stat = lstatSync(config.runRoot); const root = realpathSync(config.runRoot);
    if (stat.isSymbolicLink() || !stat.isDirectory() || root === resolve(sep)) fail('ARTIFACT_WRITE_FAILED');
    descriptor = openSync(root, constants.O_RDONLY | constants.O_DIRECTORY | constants.O_NOFOLLOW);
    const pinned = fstatSync(descriptor);
    if (!pinned.isDirectory() || pinned.dev !== stat.dev || pinned.ino !== stat.ino) fail('ARTIFACT_WRITE_FAILED');
    return Object.freeze({ root, configuredRunRoot: config.runRoot, device: stat.dev, inode: stat.ino, descriptor });
  } catch (cause) {
    if (descriptor !== undefined) { try { closeSync(descriptor); } catch {} }
    if (errorCode(cause) === 'ARTIFACT_WRITE_FAILED') throw cause;
    fail('ARTIFACT_WRITE_FAILED');
  }
}
function descriptor(asset: AnalysisAsset): ArtifactDescriptor { const data = bytes(asset.bytes); return { artifact_id: asset.artifact_id, category: asset.category, path: asset.path, media_type: asset.media_type, byte_size: data.byteLength, sha256: checksum(data) }; }
function matchingDescriptor(value: unknown, expected: ArtifactDescriptor): boolean { return plain(value) && Object.keys(value).length === 6 && value.artifact_id === expected.artifact_id && value.category === expected.category && value.path === expected.path && value.media_type === expected.media_type && value.byte_size === expected.byte_size && value.sha256 === expected.sha256; }
function isAnalysisAsset(value: PlainRecord): value is PlainRecord & AnalysisAsset {
  return typeof value.artifact_id === 'string' && typeof value.category === 'string' && typeof value.path === 'string'
    && typeof value.media_type === 'string' && (Buffer.isBuffer(value.bytes) || value.bytes instanceof Uint8Array);
}

export function createLocalRunArtifactStore(config: unknown): RunArtifactStore {
  const rootIdentity = rootFrom(config);
  const runRoot = rootIdentity.root;
  const configuredRunRoot = rootIdentity.configuredRunRoot;
  const domain = createLocalAnalysisDomain();
  function checkRunRoot(code = 'ARTIFACT_WRITE_FAILED'): string {
    try {
      const stat = lstatSync(configuredRunRoot);
      const physical = realpathSync(configuredRunRoot);
      const pinned = fstatSync(rootIdentity.descriptor);
      if (stat.isSymbolicLink() || !stat.isDirectory() || physical !== runRoot || physical === resolve(sep) || stat.dev !== rootIdentity.device || stat.ino !== rootIdentity.inode || !pinned.isDirectory() || pinned.dev !== rootIdentity.device || pinned.ino !== rootIdentity.inode) fail(code);
      return physical;
    } catch (cause) { if (errorCode(cause) === code) throw cause; fail(code); }
  }
  function runPath(run_id: unknown): string { if (typeof run_id !== 'string' || !uuidV7.test(run_id)) fail('ARTIFACT_WRITE_FAILED'); return join(runRoot, run_id); }
  function checkedRunPath(run_id: unknown): string {
    const path = runPath(run_id);
    try { const stat = lstatSync(path); if (stat.isSymbolicLink() || !stat.isDirectory() || !isContained(runRoot, realpathSync(path))) fail('ARTIFACT_WRITE_FAILED'); return path; } catch (cause) { if (errorCode(cause) === 'ARTIFACT_WRITE_FAILED') throw cause; fail('ARTIFACT_WRITE_FAILED'); }
  }
  async function regular(path: string): Promise<Buffer> {
    try { const stat = lstatSync(path); if (stat.isSymbolicLink() || !stat.isFile()) fail('ARTIFACT_WRITE_FAILED'); return await readFile(path); } catch (cause) { if (errorCode(cause) === 'ARTIFACT_WRITE_FAILED') throw cause; fail('ARTIFACT_WRITE_FAILED'); }
  }
  async function manifest(run_id: unknown): Promise<{ directory: string; value: RunManifest; bytes: Buffer }> {
    const directory = checkedRunPath(run_id); const data = await regular(join(directory, 'run.json'));
    try { const value: unknown = JSON.parse(data.toString('utf8')); const validated = domain.validateRunManifest(value); if (validated.run_id !== run_id) fail('ARTIFACT_WRITE_FAILED'); return { directory, value: validated, bytes: data }; } catch (cause) { if (errorCode(cause) === 'ARTIFACT_WRITE_FAILED') throw cause; fail('ARTIFACT_WRITE_FAILED'); }
  }
  async function atomic(path: string, data: Uint8Array, signal: AbortSignal, replace = false): Promise<void> {
    liveSignal(signal);
    const directory = dirname(path);
    const temporary = join(directory, `.xanthil-${randomBytes(12).toString('hex')}.tmp`);
    try {
      const handle = await open(temporary, 'wx', 0o600);
      try { await handle.writeFile(data); await handle.sync(); } finally { await handle.close(); }
      liveSignal(signal);
      if (!replace) {
        try { lstatSync(path); fail('ARTIFACT_WRITE_FAILED'); } catch (cause) { if (errorCode(cause) === 'ARTIFACT_WRITE_FAILED') throw cause; }
      }
      liveSignal(signal);
      await rename(temporary, path);
    } catch (cause) {
      await rm(temporary, { force: true }).catch(() => undefined);
      if (errorCode(cause) === 'ARTIFACT_WRITE_FAILED') throw cause;
      fail('ARTIFACT_WRITE_FAILED');
    }
  }
  function validateAsset(asset: unknown, allowed: readonly string[] = ['Q-001', 'S-001', 'O-001', 'O-002']): ArtifactDescriptor {
    closed(asset, ['artifact_id', 'category', 'path', 'media_type', 'bytes']);
    if (typeof asset.artifact_id !== 'string') fail('ARTIFACT_WRITE_FAILED');
    if (!allowed.includes(asset.artifact_id) || !mappings[asset.artifact_id]) fail('ARTIFACT_WRITE_FAILED');
    const map = mappings[asset.artifact_id]; if (asset.category !== map.category || asset.path !== map.path || asset.media_type !== map.media_type) fail('ARTIFACT_WRITE_FAILED');
    if (!isAnalysisAsset(asset)) fail('ARTIFACT_WRITE_FAILED');
    return descriptor(asset);
  }
  async function ensureIndexed(directory: string, record: ArtifactDescriptor): Promise<AnalysisAsset> {
    if (!mappings[record.artifact_id] || record.path !== mappings[record.artifact_id].path || record.category !== mappings[record.artifact_id].category || record.media_type !== mappings[record.artifact_id].media_type) fail('ARTIFACT_WRITE_FAILED');
    const target = join(directory, record.path); if (!isContained(directory, target)) fail('ARTIFACT_WRITE_FAILED');
    const data = await regular(target); if (data.byteLength !== record.byte_size || checksum(data) !== record.sha256) fail('ARTIFACT_WRITE_FAILED');
    return { ...record, bytes: data };
  }
  function validateNext(current: RunManifest, next: RunManifest, terminal: unknown): void {
    try { domain.validateRunManifest(next); } catch { fail('ARTIFACT_WRITE_FAILED'); }
    if (next.run_id !== current.run_id || next.status !== terminal) fail('ARTIFACT_WRITE_FAILED');
  }
  return Object.freeze({
    async preflightRunRoot() {
      if (arguments.length !== 0) fail('RUN_ROOT_UNSAFE');
      checkRunRoot('RUN_ROOT_UNSAFE');
      return Object.freeze({ ready: true });
    },
    async beginRun(input) {
      closed(input, ['run_id', 'initial_manifest', 'cancellation_signal']); const signal = liveSignal(input.cancellation_signal); const directory = runPath(input.run_id);
      try { domain.validateRunManifest(input.initial_manifest); } catch { fail('ARTIFACT_WRITE_FAILED'); }
      if (input.initial_manifest.run_id !== input.run_id || input.initial_manifest.status !== 'in_progress' || input.initial_manifest.artifacts.length !== 0) fail('ARTIFACT_WRITE_FAILED');
      try { lstatSync(directory); fail('RUN_COLLISION'); } catch (cause) { if (errorCode(cause) === 'RUN_COLLISION') throw cause; }
      const staging = join(runRoot, `.xanthil-${randomBytes(12).toString('hex')}.staging`);
      try {
        await mkdir(staging, { mode: 0o700 });
        await atomic(join(staging, 'run.json'), Buffer.from(JSON.stringify(input.initial_manifest), 'utf8'), signal);
        liveSignal(signal);
        await rename(staging, directory);
      } catch (cause) {
        await rm(staging, { recursive: true, force: true }).catch(() => undefined);
        const code = errorCode(cause);
        if (code === 'RUN_COLLISION' || code === 'EEXIST' || code === 'ENOTEMPTY') fail('RUN_COLLISION');
        if (code === 'ARTIFACT_WRITE_FAILED') throw cause;
        fail('ARTIFACT_WRITE_FAILED');
      }
      return { run_id: input.run_id };
    },
    async commitConfirmedContract(input) {
      closed(input, ['run_id', 'contract', 'cancellation_signal']); const signal = liveSignal(input.cancellation_signal); const current = await manifest(input.run_id);
      if (current.value.status !== 'in_progress' || !plain(input.contract) || input.contract.run_id !== input.run_id) fail('ARTIFACT_WRITE_FAILED');
      const data = Buffer.from(JSON.stringify(input.contract), 'utf8');
      if (checksum(data) !== current.value.contract.sha256) fail('ARTIFACT_WRITE_FAILED');
      await atomic(join(current.directory, 'analysis-contract.json'), data, signal);
      return { committed: true, descriptor: { path: 'analysis-contract.json', byte_size: data.byteLength, sha256: checksum(data) } };
    },
    async appendAsset(input) {
      closed(input, ['run_id', 'asset', 'cancellation_signal']); const signal = liveSignal(input.cancellation_signal); const current = await manifest(input.run_id);
      if (current.value.status !== 'in_progress') fail('TERMINAL_IMMUTABLE');
      const record = validateAsset(input.asset); const directory = current.directory; const target = join(directory, record.path);
      if (!isContained(directory, target)) fail('ARTIFACT_WRITE_FAILED');
      const parent = dirname(target);
      try { await mkdir(parent, { recursive: true }); liveSignal(signal); const parentStat = lstatSync(parent); if (parentStat.isSymbolicLink() || !parentStat.isDirectory() || !isContained(directory, realpathSync(parent))) fail('ARTIFACT_WRITE_FAILED'); } catch (cause) { if (errorCode(cause) === 'ARTIFACT_WRITE_FAILED') throw cause; fail('ARTIFACT_WRITE_FAILED'); }
      await atomic(target, bytes(input.asset.bytes), signal);
      return { appended: true, descriptor: record };
    },
    async replaceManifest(input) {
      closed(input, ['run_id', 'next_manifest', 'cancellation_signal']); const signal = liveSignal(input.cancellation_signal); const current = await manifest(input.run_id);
      if (current.value.status !== 'in_progress') fail('TERMINAL_IMMUTABLE'); validateNext(current.value, input.next_manifest, input.next_manifest?.status);
      if (!['failed', 'cancelled'].includes(input.next_manifest.status)) fail('ARTIFACT_WRITE_FAILED');
      for (const item of input.next_manifest.artifacts) await ensureIndexed(current.directory, item);
      await atomic(join(current.directory, 'run.json'), Buffer.from(JSON.stringify(input.next_manifest), 'utf8'), signal, true);
      return { replaced: true };
    },
    async commitSuccess(input) {
      closed(input, ['run_id', 'next_manifest', 'evidence', 'summary', 'evidence_document', 'cancellation_signal']); const signal = liveSignal(input.cancellation_signal); const current = await manifest(input.run_id);
      if (current.value.status !== 'in_progress') fail('TERMINAL_IMMUTABLE'); validateNext(current.value, input.next_manifest, 'succeeded');
      if (typeof input.summary !== 'string' || typeof input.evidence_document !== 'string') fail('ARTIFACT_WRITE_FAILED');
      const evidenceBytes = Buffer.from(JSON.stringify(input.evidence), 'utf8'); const summaryBytes = Buffer.from(input.summary, 'utf8'); const evidenceDocumentBytes = Buffer.from(input.evidence_document, 'utf8');
      try { domain.validateEvidenceIndex({ evidence: input.evidence, catalog: { sources: current.value.sources.map(({ source_id, sha256 }) => ({ source_id, sha256 })), artifacts: input.next_manifest.artifacts.filter(({ artifact_id }) => /^(Q|S|O)-\d{3}$/.test(artifact_id)).map(({ artifact_id, sha256 }) => ({ artifact_id, sha256, observed_sha256: sha256 })) } }); } catch { fail('ARTIFACT_WRITE_FAILED'); }
      if (input.next_manifest.artifacts.map(({ artifact_id }) => artifact_id).join(',') !== successOrder.join(',')) fail('ARTIFACT_WRITE_FAILED');
      if (input.next_manifest.evidence?.path !== 'evidence.json' || input.next_manifest.evidence?.sha256 !== checksum(evidenceBytes)) fail('ARTIFACT_WRITE_FAILED');
      for (const record of input.next_manifest.artifacts) {
        if (record.artifact_id === 'DOC-SUMMARY') {
          if (!matchingDescriptor(record, { artifact_id: 'DOC-SUMMARY', category: 'summary', path: 'summary.md', media_type: 'text/markdown', byte_size: summaryBytes.byteLength, sha256: checksum(summaryBytes) })) fail('ARTIFACT_WRITE_FAILED');
        } else if (record.artifact_id === 'DOC-EVIDENCE') {
          if (!matchingDescriptor(record, { artifact_id: 'DOC-EVIDENCE', category: 'evidence_document', path: 'evidence.md', media_type: 'text/markdown', byte_size: evidenceDocumentBytes.byteLength, sha256: checksum(evidenceDocumentBytes) })) fail('ARTIFACT_WRITE_FAILED');
        } else await ensureIndexed(current.directory, record);
      }
      await atomic(join(current.directory, 'evidence.json'), evidenceBytes, signal);
      await atomic(join(current.directory, 'summary.md'), summaryBytes, signal);
      await atomic(join(current.directory, 'evidence.md'), evidenceDocumentBytes, signal);
      await atomic(join(current.directory, 'run.json'), Buffer.from(JSON.stringify(input.next_manifest), 'utf8'), signal, true);
      return { committed: true, success_manifest_is_last: true };
    },
    async readTerminalRun(input) {
      closed(input, ['run_id']); const current = await manifest(input.run_id);
      if (!['succeeded', 'failed', 'cancelled'].includes(current.value.status)) fail('ARTIFACT_WRITE_FAILED');
      const assets = []; for (const record of current.value.artifacts) assets.push(await ensureIndexed(current.directory, record));
      return { manifest: current.value, assets };
    },
  });
}
