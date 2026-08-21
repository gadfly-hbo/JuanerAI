import { createHash, randomBytes } from 'node:crypto';
import { lstatSync, realpathSync } from 'node:fs';
import { mkdir, open, readFile, rename, rm } from 'node:fs/promises';
import { dirname, join, resolve, sep } from 'node:path';
import { createLocalAnalysisDomain } from '../../packages/product-core/local-analysis.mjs';

const uuidV7 = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const mappings = Object.freeze({
  'Q-001': { category: 'query', path: 'queries/Q-001.sql', media_type: 'application/sql' },
  'S-001': { category: 'script', path: 'scripts/S-001.py', media_type: 'text/plain' },
  'O-001': { category: 'output', path: 'outputs/O-001.json', media_type: 'application/json' },
  'O-002': { category: 'output', path: 'outputs/O-002.json', media_type: 'application/json' },
  'DOC-SUMMARY': { category: 'summary', path: 'summary.md', media_type: 'text/markdown' },
  'DOC-EVIDENCE': { category: 'evidence_document', path: 'evidence.md', media_type: 'text/markdown' },
});
const successOrder = ['Q-001', 'S-001', 'O-001', 'O-002', 'DOC-SUMMARY', 'DOC-EVIDENCE'];
function safeError(code) { const value = new Error(code); value.code = code; value.stack = code; return value; }
function fail(code) { throw safeError(code); }
function plain(value) { return value !== null && typeof value === 'object' && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype; }
function closed(value, keys, code = 'ARTIFACT_WRITE_FAILED') { if (!plain(value) || Object.keys(value).length !== keys.length || keys.some((key) => !Object.hasOwn(value, key) || value[key] === null || value[key] === undefined)) fail(code); }
function checksum(bytes) { return createHash('sha256').update(bytes).digest('hex'); }
function isContained(root, value) { return value.startsWith(`${root}${sep}`); }
function bytes(value) { if (!(Buffer.isBuffer(value) || value instanceof Uint8Array)) fail('ARTIFACT_WRITE_FAILED'); return Buffer.from(value); }
function liveSignal(value) {
  if (!(value instanceof AbortSignal) || value.aborted) fail('ARTIFACT_WRITE_FAILED');
  return value;
}
function rootFrom(config) {
  closed(config, ['runRoot']);
  if (typeof config.runRoot !== 'string' || !config.runRoot.startsWith(sep)) fail('ARTIFACT_WRITE_FAILED');
  try {
    const stat = lstatSync(config.runRoot); const root = realpathSync(config.runRoot);
    if (stat.isSymbolicLink() || !stat.isDirectory() || root === resolve(sep)) fail('ARTIFACT_WRITE_FAILED');
    return Object.freeze({ root, device: stat.dev, inode: stat.ino });
  } catch (cause) { if (cause?.code === 'ARTIFACT_WRITE_FAILED') throw cause; fail('ARTIFACT_WRITE_FAILED'); }
}
function descriptor(asset) { const data = bytes(asset.bytes); return { artifact_id: asset.artifact_id, category: asset.category, path: asset.path, media_type: asset.media_type, byte_size: data.byteLength, sha256: checksum(data) }; }
function matchingDescriptor(value, expected) { return plain(value) && Object.keys(value).length === 6 && Object.keys(expected).every((key) => value[key] === expected[key]); }

export function createLocalRunArtifactStore(config) {
  const rootIdentity = rootFrom(config);
  const runRoot = rootIdentity.root;
  const configuredRunRoot = config.runRoot;
  const domain = createLocalAnalysisDomain();
  function checkRunRoot(code = 'ARTIFACT_WRITE_FAILED') {
    try {
      const stat = lstatSync(configuredRunRoot);
      const physical = realpathSync(configuredRunRoot);
      if (stat.isSymbolicLink() || !stat.isDirectory() || physical !== runRoot || physical === resolve(sep) || stat.dev !== rootIdentity.device || stat.ino !== rootIdentity.inode) fail(code);
      return physical;
    } catch (cause) { if (cause?.code === code) throw cause; fail(code); }
  }
  function runPath(run_id) { if (typeof run_id !== 'string' || !uuidV7.test(run_id)) fail('ARTIFACT_WRITE_FAILED'); return join(runRoot, run_id); }
  function checkedRunPath(run_id) {
    const path = runPath(run_id);
    try { const stat = lstatSync(path); if (stat.isSymbolicLink() || !stat.isDirectory() || !isContained(runRoot, realpathSync(path))) fail('ARTIFACT_WRITE_FAILED'); return path; } catch (cause) { if (cause?.code === 'ARTIFACT_WRITE_FAILED') throw cause; fail('ARTIFACT_WRITE_FAILED'); }
  }
  async function regular(path) {
    try { const stat = lstatSync(path); if (stat.isSymbolicLink() || !stat.isFile()) fail('ARTIFACT_WRITE_FAILED'); return await readFile(path); } catch (cause) { if (cause?.code === 'ARTIFACT_WRITE_FAILED') throw cause; fail('ARTIFACT_WRITE_FAILED'); }
  }
  async function manifest(run_id) {
    const directory = checkedRunPath(run_id); const data = await regular(join(directory, 'run.json'));
    try { const value = JSON.parse(data.toString('utf8')); domain.validateRunManifest(value); if (value.run_id !== run_id) fail('ARTIFACT_WRITE_FAILED'); return { directory, value, bytes: data }; } catch (cause) { if (cause?.code === 'ARTIFACT_WRITE_FAILED') throw cause; fail('ARTIFACT_WRITE_FAILED'); }
  }
  async function atomic(path, data, signal, replace = false) {
    liveSignal(signal);
    const directory = dirname(path);
    const temporary = join(directory, `.xanthil-${randomBytes(12).toString('hex')}.tmp`);
    try {
      const handle = await open(temporary, 'wx', 0o600);
      try { await handle.writeFile(data); await handle.sync(); } finally { await handle.close(); }
      liveSignal(signal);
      if (!replace) {
        try { lstatSync(path); fail('ARTIFACT_WRITE_FAILED'); } catch (cause) { if (cause?.code === 'ARTIFACT_WRITE_FAILED') throw cause; }
      }
      liveSignal(signal);
      await rename(temporary, path);
    } catch (cause) {
      await rm(temporary, { force: true }).catch(() => undefined);
      if (cause?.code === 'ARTIFACT_WRITE_FAILED') throw cause;
      fail('ARTIFACT_WRITE_FAILED');
    }
  }
  function validateAsset(asset, allowed = ['Q-001', 'S-001', 'O-001', 'O-002']) {
    closed(asset, ['artifact_id', 'category', 'path', 'media_type', 'bytes']);
    if (!allowed.includes(asset.artifact_id) || !mappings[asset.artifact_id]) fail('ARTIFACT_WRITE_FAILED');
    const map = mappings[asset.artifact_id]; if (asset.category !== map.category || asset.path !== map.path || asset.media_type !== map.media_type) fail('ARTIFACT_WRITE_FAILED');
    return descriptor(asset);
  }
  async function ensureIndexed(directory, record) {
    if (!mappings[record.artifact_id] || record.path !== mappings[record.artifact_id].path || record.category !== mappings[record.artifact_id].category || record.media_type !== mappings[record.artifact_id].media_type) fail('ARTIFACT_WRITE_FAILED');
    const target = join(directory, record.path); if (!isContained(directory, target)) fail('ARTIFACT_WRITE_FAILED');
    const data = await regular(target); if (data.byteLength !== record.byte_size || checksum(data) !== record.sha256) fail('ARTIFACT_WRITE_FAILED');
    return { ...record, bytes: data };
  }
  function validateNext(current, next, terminal) {
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
      try { lstatSync(directory); fail('RUN_COLLISION'); } catch (cause) { if (cause?.code === 'RUN_COLLISION') throw cause; }
      const staging = join(runRoot, `.xanthil-${randomBytes(12).toString('hex')}.staging`);
      try {
        await mkdir(staging, { mode: 0o700 });
        await atomic(join(staging, 'run.json'), Buffer.from(JSON.stringify(input.initial_manifest), 'utf8'), signal);
        liveSignal(signal);
        await rename(staging, directory);
      } catch (cause) {
        await rm(staging, { recursive: true, force: true }).catch(() => undefined);
        if (cause?.code === 'RUN_COLLISION' || cause?.code === 'EEXIST' || cause?.code === 'ENOTEMPTY') fail('RUN_COLLISION');
        if (cause?.code === 'ARTIFACT_WRITE_FAILED') throw cause;
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
      try { await mkdir(parent, { recursive: true }); liveSignal(signal); const parentStat = lstatSync(parent); if (parentStat.isSymbolicLink() || !parentStat.isDirectory() || !isContained(directory, realpathSync(parent))) fail('ARTIFACT_WRITE_FAILED'); } catch (cause) { if (cause?.code === 'ARTIFACT_WRITE_FAILED') throw cause; fail('ARTIFACT_WRITE_FAILED'); }
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
