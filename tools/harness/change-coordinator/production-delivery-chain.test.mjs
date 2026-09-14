import test from 'node:test';
import assert from 'node:assert/strict';
import childProcess from 'node:child_process';
import { createHash } from 'node:crypto';
import { unlinkSync, writeFileSync } from 'node:fs';
import { chmod, lstat, mkdir, mkdtemp, readFile, readdir, readlink, realpath, rm, symlink, writeFile } from 'node:fs/promises';
import { syncBuiltinESMExports } from 'node:module';
import { channel } from 'node:diagnostics_channel';
import os from 'node:os';
import path from 'node:path';
import * as production from './production.mjs';
import { createCoordinatorAdapters } from './adapters.mjs';
import { createCoordinatorCore } from './coordinator.mjs';
import { ambiguous, appendTestLedgerEvent, assertExactWorktreeReceipt, bytes, canonicalJson, createCoordinatorUnderTest, createLocalBareLedger, createUnpublishedTestLedgerCommit, expectedCandidateReceipt, expectedExecutionDefinitions, expectedWorktreeReceipt, freshWorktreeSubject, independentTrackedSnapshot, makeDispatch, makeTestLedgerEventBytes, reachOrdinaryRepairAction, readLocalLedger, run as runProcess, settleOrdinaryValidatorForBoundary, signed, unavailable, validationPurposes, withObservedK1Prefix, withRepository, wrapCandidateStageValueForCore } from './fixtures.mjs';

const GIT = '/Users/huangbo/Dev/Env/homebrew/bin/git';
const NODE = process.execPath;
const sha256 = value => createHash('sha256').update(value).digest('hex');
const ok = value => ({ kind: 'OK', value, receipt_sha256: sha256(canonicalJson(value)) });
const CANONICAL_DIFF_V2_KEYS = Object.freeze(['byte_length', 'changed_paths', 'path_byte_length', 'path_raw_stdout', 'producer_receipt', 'raw_stdout', 'stdout_sha256']);
const LEGACY_CANONICAL_DIFF_KEYS = Object.freeze(['byte_length', 'changed_paths', 'producer_receipt', 'raw_stdout', 'stdout_sha256']);
const FIXED_GIT_ENVIRONMENT = Object.freeze({
  LC_ALL: 'C', LANG: 'C', TZ: 'UTC', GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: '/dev/null',
  GIT_ATTR_NOSYSTEM: '1', GIT_PAGER: 'cat', PAGER: 'cat', GIT_TERMINAL_PROMPT: '0', GIT_NO_REPLACE_OBJECTS: '1',
});

// R219_F1_BEGIN — frozen from R217; the entry assertion intentionally stops
// every suffix until the Controller has accepted the missing-export RED.
test('TEST-M2-002 / R216: local unpublished Ledger evidence builder', { timeout: 90_000 }, async t => {
  const observeNativeGitChildren = async (root, action) => {
    const events = []; const admitted = new WeakSet(); const attached = new WeakMap(); const scopes = new WeakMap(); let currentScope = 'test';
    const attach = child => {
      if (!admitted.has(child) || attached.has(child)) return;
      const event = { scope: scopes.get(child) ?? 'test', pid: child.pid ?? null, spawnfile: child.spawnfile ?? null, spawnargs: [...(child.spawnargs ?? [])], stdout: [], stderr: [], close: null, error: null };
      events.push(event); attached.set(child, event); child.stdout?.on('data', value => event.stdout.push(Buffer.from(value))); child.stderr?.on('data', value => event.stderr.push(Buffer.from(value))); child.once('close', (code, signal) => { event.close = { code, signal }; }); child.once('error', error => { event.error = { code: error?.code ?? null, message: error?.message ?? null }; });
    };
    const start = message => { const child = message?.process; if (child && message?.options?.cwd === root && message.options.file === GIT) { admitted.add(child); scopes.set(child, currentScope); } };
    const end = message => { const child = message?.process; if (child) process.nextTick(() => attach(child)); };
    const failure = message => { const child = message?.process; if (child && admitted.has(child)) { attach(child); const event = attached.get(child); if (event) event.error = { code: message.error?.code ?? null, message: message.error?.message ?? null }; } };
    const startChannel = channel('tracing:child_process.spawn:start'); const endChannel = channel('tracing:child_process.spawn:end'); const errorChannel = channel('tracing:child_process.spawn:error'); startChannel.subscribe(start); endChannel.subscribe(end); errorChannel.subscribe(failure);
    const inScope = async (scope, scopedAction) => { const priorScope = currentScope; currentScope = scope; try { return await scopedAction(); } finally { currentScope = priorScope; } };
    let value = null; let actionError = null;
    try { value = await action(events, inScope); } catch (error) { actionError = { name: error?.name ?? 'Error', message: error?.message ?? String(error), code: error?.code ?? null }; }
    finally { startChannel.unsubscribe(start); endChannel.unsubscribe(end); errorChannel.unsubscribe(failure); }
    return { value, action_error: actionError, events };
  };
  const captureRawGit = (cwd, argv) => new Promise(resolve => {
    const child = childProcess.spawn(GIT, argv, { cwd, env: FIXED_GIT_ENVIRONMENT }); const stdout = []; const stderr = [];
    child.stdout.on('data', value => stdout.push(Buffer.from(value))); child.stderr.on('data', value => stderr.push(Buffer.from(value)));
    let settled = false; const finish = (code, signal, error = null) => { if (!settled) { settled = true; resolve({ code, signal, stdout: Buffer.concat(stdout), stderr: Buffer.concat(stderr), error: error === null ? null : { name: error?.name ?? 'Error', message: error?.message ?? String(error), code: error?.code ?? null } }); } };
    child.once('error', error => finish(null, null, error)); child.once('close', (code, signal) => finish(code, signal));
  });
  const assertSuccessfulRawGit = (result, label) => { assert.equal(result.error, null, `${label}: no spawn error`); assert.equal(result.code, 0, `${label}: exits zero`); assert.equal(result.signal, null, `${label}: has no signal`); assert.deepEqual(result.stderr, Buffer.alloc(0), `${label}: has empty stderr`); };
  const rawPreservedEntries = async (fixture, tip, target) => {
    if (tip === null) return Buffer.alloc(0);
    const listed = await captureRawGit(fixture.repository, ['ls-tree', '-r', '-z', '--full-tree', tip]); assertSuccessfulRawGit(listed, 'independent recursive preserved-entry read');
    const records = []; const seen = new Set(); let offset = 0;
    while (offset < listed.stdout.length) {
      const end = listed.stdout.indexOf(0, offset); assert.ok(end > offset, 'independent raw Git oracle requires complete NUL records'); const record = Buffer.from(listed.stdout.subarray(offset, end + 1)); const tab = record.indexOf(0x09); assert.ok(tab > 0, 'record has a raw header/path tab');
      const header = record.subarray(0, tab).toString('ascii'); assert.match(header, /^(100644 blob|100755 blob|120000 blob|160000 commit) [0-9a-f]{40}$/); assert.ok(isOid(header.slice(-40)), 'raw recursive record OID is nonzero'); const rawPath = Buffer.from(record.subarray(tab + 1, -1)); assert.ok(rawPath.length > 0); const pathKey = rawPath.toString('hex'); assert.equal(seen.has(pathKey), false, 'raw recursive paths are unique'); seen.add(pathKey);
      if (!rawPath.equals(Buffer.from(target))) records.push({ record, rawPath }); offset = end + 1;
    }
    records.sort((left, right) => Buffer.compare(left.rawPath, right.rawPath)); return Buffer.concat(records.map(entry => entry.record));
  };
  const isOid = value => typeof value === 'string' && /^[0-9a-f]{40}$/.test(value) && value !== '0'.repeat(40);
  const exactReceiptKeys = ['authoritative_path', 'event_hash', 'event_id', 'expected_tip', 'idempotency_id', 'new_byte_length', 'new_bytes_sha256', 'prepared_bytes_sha256', 'prior_byte_length', 'prior_bytes_sha256', 'record_length', 'record_offset', 'remote_ref', 'sequence'];
  const parsePhysicalCommit = (raw, objectOid = null) => {
    assert.ok(Buffer.isBuffer(raw)); if (objectOid !== null) assert.ok(isOid(objectOid)); const separator = raw.indexOf(Buffer.from('\n\n')); assert.ok(separator >= 0, 'physical commit has a header/body separator'); const headerBytes = raw.subarray(0, separator); const header = headerBytes.toString('utf8'); assert.deepEqual(Buffer.from(header, 'utf8'), headerBytes, 'physical commit headers are exact UTF-8'); const body = raw.subarray(separator + 2); const lines = header.split('\n');
    const headerLines = prefix => lines.filter(line => line === prefix || line.startsWith(`${prefix} `) || line.startsWith(`${prefix}\t`));
    const tree = headerLines('tree'); const parentLines = headerLines('parent'); const authors = headerLines('author'); const committers = headerLines('committer');
    assert.equal(tree.length, 1, 'physical commit has exactly one tree header'); assert.match(tree[0], /^tree [0-9a-f]{40}$/); assert.equal(lines[0], tree[0], 'physical commit tree is the first header'); assert.ok(isOid(tree[0].slice(5)));
    for (const parentLine of parentLines) { assert.match(parentLine, /^parent [0-9a-f]{40}$/); assert.ok(isOid(parentLine.slice(7))); if (objectOid !== null) assert.notEqual(parentLine.slice(7), objectOid, 'physical commit is never its own parent'); }
    assert.equal(authors.length, 1, 'physical commit has one author header'); assert.equal(committers.length, 1, 'physical commit has one committer header'); assert.match(authors[0], /^author .+ <[^<>]+> [0-9]+ [+-][0-9]{4}$/); assert.match(committers[0], /^committer .+ <[^<>]+> [0-9]+ [+-][0-9]{4}$/); return { tree: tree[0].slice(5), parents: parentLines.map(line => line.slice(7)), body };
  };
  const assertIndependentAppend = ({ receipt, preparedBytes, expectedTip, expectedPrefix, expectedSequence }) => {
    assert.deepEqual(Object.keys(receipt).sort(), exactReceiptKeys); assert.equal(receipt.expected_tip, expectedTip); assert.equal(receipt.prior_byte_length, expectedPrefix.length); assert.equal(receipt.record_offset, expectedPrefix.length); assert.equal(receipt.sequence, expectedSequence); assert.equal(receipt.new_byte_length, preparedBytes.length); assert.equal(receipt.record_offset + receipt.record_length, preparedBytes.length); assert.equal(receipt.prior_bytes_sha256, sha256(expectedPrefix)); assert.equal(receipt.new_bytes_sha256, sha256(preparedBytes)); assert.equal(receipt.prepared_bytes_sha256, sha256(preparedBytes)); assert.deepEqual(preparedBytes.subarray(0, receipt.prior_byte_length), expectedPrefix);
    const tail = preparedBytes.subarray(receipt.record_offset); assert.ok(tail.length > 1); assert.equal(tail.at(-1), 0x0a); assert.equal(tail.subarray(0, -1).includes(0x0a), false); assert.equal(tail.includes(0x0d), false); assert.equal(tail.subarray(0, 3).equals(Buffer.from([0xef, 0xbb, 0xbf])), false); const event = JSON.parse(tail.subarray(0, -1).toString('utf8')); assert.deepEqual(Buffer.from(canonicalJson(event)), tail.subarray(0, -1)); const { event_hash, ...eventWithoutHash } = event; assert.equal(event_hash, sha256(canonicalJson(eventWithoutHash))); assert.equal(event.change_id, receipt.authoritative_path.slice('ledger/'.length, -'.jsonl'.length)); assert.equal(event.event_id, receipt.event_id); assert.equal(event.event_hash, receipt.event_hash); assert.equal(event.sequence, receipt.sequence); assert.equal(event.idempotency_id, receipt.idempotency_id);
    if (expectedPrefix.length === 0) { assert.equal(receipt.sequence, 1); assert.equal(receipt.record_offset, 0); } else { assert.equal(expectedPrefix.at(-1), 0x0a); assert.equal(expectedPrefix.includes(0x0d), false); const records = expectedPrefix.subarray(0, -1).toString('utf8').split('\n'); assert.ok(records.every(record => record.length > 0)); for (const record of records) { const priorEvent = JSON.parse(record); assert.deepEqual(Buffer.from(canonicalJson(priorEvent)), Buffer.from(record)); const { event_hash: priorHash, ...priorWithoutHash } = priorEvent; assert.equal(priorHash, sha256(canonicalJson(priorWithoutHash))); } const prior = JSON.parse(records.at(-1)); assert.equal(receipt.sequence, prior.sequence + 1); }
  };
  await t.test('R220-NATIVE-OBSERVATION-HEALTH: actual pinned-Git success and failure retain child bytes and outcomes without production construction', async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), 'juanerai-r220-native-health-')); const repository = path.join(root, 'repository'); const formal = path.join(root, 'R220-native-health.json'); let facts = { root, repository }; let primaryError = null;
    t.diagnostic(`R220-NATIVE-HEALTH-FORMAL-ROOT=${root}`);
    try {
      await mkdir(repository, { recursive: true }); const initialized = await observeNativeGitChildren(root, async () => runProcess(GIT, ['init', '-b', 'evidence', repository], { cwd: root, env: FIXED_GIT_ENVIRONMENT }));
      const encode = event => ({ pid: event.pid, spawnfile: event.spawnfile, spawnargs: event.spawnargs, stdout_base64: Buffer.concat(event.stdout).toString('base64'), stderr_base64: Buffer.concat(event.stderr).toString('base64'), close: event.close, error: event.error }); facts = { ...facts, init: { action_error: initialized.action_error, result: initialized.value ?? null, children: initialized.events.map(encode) } };
      const observed = await observeNativeGitChildren(repository, async () => { const email = await runProcess(GIT, ['config', 'user.email', 'r220-native-health@example.invalid'], { cwd: repository, env: FIXED_GIT_ENVIRONMENT }); const user = await runProcess(GIT, ['config', 'user.name', 'R220 Native Health'], { cwd: repository, env: FIXED_GIT_ENVIRONMENT }); const expectedPreserved = Buffer.from([0, 10, 255, 1]); await writeFile(path.join(repository, 'preserved.bin'), expectedPreserved); const staged = await runProcess(GIT, ['add', '--', 'preserved.bin'], { cwd: repository, env: FIXED_GIT_ENVIRONMENT }); const committed = await runProcess(GIT, ['commit', '-m', 'native-health'], { cwd: repository, env: FIXED_GIT_ENVIRONMENT }); const success = await runProcess(GIT, ['rev-parse', '--is-inside-work-tree'], { cwd: repository, env: FIXED_GIT_ENVIRONMENT }); const sha = await runProcess(GIT, ['rev-parse', 'HEAD'], { cwd: repository, env: FIXED_GIT_ENVIRONMENT }); const type = await runProcess(GIT, ['cat-file', '-t', sha.stdout.trim()], { cwd: repository, env: FIXED_GIT_ENVIRONMENT }); const rawCommit = await captureRawGit(repository, ['cat-file', 'commit', sha.stdout.trim()]); const blobOid = await runProcess(GIT, ['rev-parse', 'HEAD:preserved.bin'], { cwd: repository, env: FIXED_GIT_ENVIRONMENT }); const preservedEntries = await rawPreservedEntries({ repository }, 'HEAD', '__r220_health_excluded_target__'); const preservedBlob = await captureRawGit(repository, ['show', 'HEAD:preserved.bin']); const rootStat = await lstat(root); const repositoryStat = await lstat(repository); const canonicalRoot = await realpath(root); const canonicalRepository = await realpath(repository); const failure = await runProcess(GIT, ['cat-file', '-e', 'f'.repeat(40)], { cwd: repository, env: FIXED_GIT_ENVIRONMENT }); return { email, user, staged, committed, success, sha, type, rawCommit, blobOid, preservedEntries, preservedBlob, expected_preserved_sha256: sha256(expectedPreserved), rootStat: { uid: rootStat.uid, gid: rootStat.gid, mode: rootStat.mode & 0o7777 }, repositoryStat: { uid: repositoryStat.uid, gid: repositoryStat.gid, mode: repositoryStat.mode & 0o7777 }, canonicalRoot, canonicalRepository, failure }; });
      facts = { ...facts, final: { action_error: observed.action_error, result: observed.value ?? null, children: observed.events.map(encode) } };
      assert.equal(initialized.action_error, null); assert.equal(initialized.value.code, 0, initialized.value.stderr); assert.equal(observed.action_error, null); assert.equal(observed.value.email.code, 0); assert.equal(observed.value.user.code, 0); assert.equal(observed.value.staged.code, 0); assert.equal(observed.value.committed.code, 0); assert.equal(observed.value.success.code, 0); assert.equal(observed.value.success.signal, null); assert.equal(observed.value.success.stdout, 'true\n'); assert.match(observed.value.sha.stdout.trim(), /^[0-9a-f]{40}$/); assert.equal(observed.value.type.stdout, 'commit\n'); assert.equal(observed.value.rawCommit.code, 0); assert.match(observed.value.blobOid.stdout.trim(), /^[0-9a-f]{40}$/); assert.deepEqual(observed.value.preservedEntries, Buffer.from(`100644 blob ${observed.value.blobOid.stdout.trim()}\tpreserved.bin\0`)); assert.equal(observed.value.preservedBlob.code, 0); assert.equal(sha256(observed.value.preservedBlob.stdout), observed.value.expected_preserved_sha256); assert.equal(observed.value.canonicalRoot, root); assert.equal(observed.value.canonicalRepository, repository); assert.equal(observed.value.rootStat.uid, process.getuid?.() ?? observed.value.rootStat.uid); assert.equal(observed.value.rootStat.gid, process.getgid?.() ?? observed.value.rootStat.gid); assert.equal(observed.value.repositoryStat.uid, process.getuid?.() ?? observed.value.repositoryStat.uid); assert.equal(observed.value.repositoryStat.gid, process.getgid?.() ?? observed.value.repositoryStat.gid); assert.notEqual(observed.value.failure.code, 0); assert.ok(facts.final.children.some(event => event.close?.code === 0 && Buffer.from(event.stdout_base64, 'base64').equals(Buffer.from('true\n')))); assert.ok(facts.final.children.some(event => event.close !== null && event.close.code !== 0));
    } catch (error) { primaryError = { name: error?.name ?? 'Error', message: error?.message ?? String(error), code: error?.code ?? null }; facts = { ...facts, primary_error: primaryError }; throw error; }
    finally { let captureError = null; try { await writeFile(formal, canonicalJson({ schema_version: '1.0', ...facts })); t.diagnostic(`R220-NATIVE-HEALTH=${JSON.stringify({ root, formal, primary_error: primaryError, init: facts.init ?? null, final: facts.final ?? null })}`); } catch (error) { captureError = { name: error?.name ?? 'Error', message: error?.message ?? String(error), code: error?.code ?? null }; t.diagnostic(`R220-NATIVE-HEALTH-COLLECTION-ERROR=${JSON.stringify({ root, formal, primary_error: primaryError, capture_error: captureError, facts })}`); } if (primaryError === null && captureError !== null) throw new Error(`R220_NATIVE_HEALTH_COLLECTION_FAILED: ${captureError.message}`); }
  });
  const module = await import('./production.mjs');
  const entryPresent = typeof module.createUnpublishedLedgerEvidenceCommitBuilder === 'function';
  await t.test('R216-L01: exports the one closed local builder entry', () => {
    assert.equal(entryPresent, true, 'RED-R216-F1-ENTRY: the approved local-only builder export is absent');
  });
  if (!entryPresent) return;

  const makeAppend = ({ change_id, expected_tip = null, prior_bytes = Buffer.alloc(0), sequence = 1, subject_sha = '0'.repeat(40), idempotency_suffix = '' }) => {
    const event_bytes = makeTestLedgerEventBytes({
      change_id, event_class: 'CONTROLLER_COMMAND', detail: { source: 'R216' }, sequence,
      state_version: sequence - 1, subject_sha, idempotency_id: `r216-${sequence}${idempotency_suffix}`,
    });
    const next = Buffer.concat([Buffer.from(prior_bytes), event_bytes]);
    const event = JSON.parse(event_bytes.subarray(0, -1).toString('utf8'));
    return {
      bytes: next,
      receipt: {
        remote_ref: 'refs/heads/evidence/agent-runs', expected_tip, authoritative_path: `ledger/${change_id}.jsonl`,
        prior_bytes_sha256: sha256(prior_bytes), prior_byte_length: prior_bytes.length,
        new_bytes_sha256: sha256(next), new_byte_length: next.length,
        event_id: event.event_id, event_hash: event.event_hash, sequence,
        record_offset: prior_bytes.length, record_length: event_bytes.length,
        idempotency_id: event.idempotency_id, prepared_bytes_sha256: sha256(next),
      },
    };
  };
  const builderFor = (fixture, stateName = 'r216-state') => module.createUnpublishedLedgerEvidenceCommitBuilder({
    repositoryRoot: fixture.repository, stateRoot: path.join(fixture.root, stateName), gitExecutable: GIT,
    runtime_uid: process.getuid?.() ?? 0, runtime_gid: process.getgid?.() ?? 0,
  });
  const exactLocalValueKeys = ['authoritative_path', 'changed_paths', 'commit_sha', 'ledger_blob_sha', 'ledger_byte_length', 'ledger_bytes_sha256', 'parent_tip', 'preserved_entries_sha256_after', 'preserved_entries_sha256_before', 'publication_status', 'tree_sha'];
  const nativeChildFacts = events => events.map(event => ({ scope: event.scope, pid: event.pid, spawnfile: event.spawnfile, spawnargs: event.spawnargs, stdout_base64: Buffer.concat(event.stdout).toString('base64'), stderr_base64: Buffer.concat(event.stderr).toString('base64'), close: event.close, error: event.error }));
  const createParent = async (fixture, { target, bytes: prior = null, marker, preserved = [] }) => {
    await writeFile(path.join(fixture.repository, marker), `${marker}\n`);
    if (prior !== null) { await mkdir(path.dirname(path.join(fixture.repository, target)), { recursive: true }); await writeFile(path.join(fixture.repository, target), prior); }
    for (const entry of preserved) { await mkdir(path.dirname(path.join(fixture.repository, entry.path)), { recursive: true }); await writeFile(path.join(fixture.repository, entry.path), entry.bytes); if (entry.mode === 'executable') await chmod(path.join(fixture.repository, entry.path), 0o755); }
    const staged = await runProcess(GIT, ['add', '--all', '--', '.'], { cwd: fixture.repository, env: FIXED_GIT_ENVIRONMENT }); assert.equal(staged.code, 0, staged.stderr);
    const committed = await runProcess(GIT, ['commit', '-m', marker], { cwd: fixture.repository, env: FIXED_GIT_ENVIRONMENT }); assert.equal(committed.code, 0, committed.stderr);
    const head = await runProcess(GIT, ['rev-parse', 'HEAD'], { cwd: fixture.repository, env: FIXED_GIT_ENVIRONMENT }); assert.equal(head.code, 0, head.stderr); return head.stdout.trim();
  };
  const createPhysicalConflictParent = async (fixture, { target, kind }) => {
    const marker = `r216-conflict-${kind.replace(/[^a-z]/g, '-')}`;
    await writeFile(path.join(fixture.repository, marker), `${marker}\n`);
    if (kind === 'ancestor') await writeFile(path.join(fixture.repository, 'ledger'), 'an ancestor file\n');
    if (kind === 'descendant') { await mkdir(path.join(fixture.repository, target), { recursive: true }); await writeFile(path.join(fixture.repository, target, 'child'), 'a descendant file\n'); }
    if (kind === 'executable') { await mkdir(path.dirname(path.join(fixture.repository, target)), { recursive: true }); await writeFile(path.join(fixture.repository, target), 'executable target\n'); await chmod(path.join(fixture.repository, target), 0o755); }
    if (kind === 'symlink') { await mkdir(path.dirname(path.join(fixture.repository, target)), { recursive: true }); await symlink('../../r216-link-target', path.join(fixture.repository, target)); }
    const added = await runProcess(GIT, ['add', '--all', '--', '.'], { cwd: fixture.repository, env: FIXED_GIT_ENVIRONMENT }); assert.equal(added.code, 0, added.stderr);
    if (kind === 'gitlink') {
      const indexed = await runProcess(GIT, ['update-index', '--add', '--cacheinfo', `160000,${fixture.baseline_sha},${target}`], { cwd: fixture.repository, env: FIXED_GIT_ENVIRONMENT });
      assert.equal(indexed.code, 0, indexed.stderr);
    }
    const committed = await runProcess(GIT, ['commit', '-m', marker], { cwd: fixture.repository, env: FIXED_GIT_ENVIRONMENT }); assert.equal(committed.code, 0, committed.stderr);
    const head = await runProcess(GIT, ['rev-parse', 'HEAD'], { cwd: fixture.repository, env: FIXED_GIT_ENVIRONMENT }); assert.equal(head.code, 0, head.stderr); return head.stdout.trim();
  };
  const formalRoots = new WeakMap();
  const formalRecords = new WeakMap();
  const retainF1Formal = async (fixture, phase, facts = {}) => {
    let formalRoot = formalRoots.get(fixture); if (!formalRoot) { formalRoot = await mkdtemp(path.join(os.tmpdir(), 'juanerai-r220-f1-formal-')); formalRoots.set(fixture, formalRoot); t.diagnostic(`R220-F1-FORMAL-ROOT=${formalRoot}`); }
    const [head, refs, objects] = await Promise.all([
      captureRawGit(fixture.repository, ['rev-parse', 'HEAD']), captureRawGit(fixture.repository, ['for-each-ref', '--format=%(refname) %(objectname)']), captureRawGit(fixture.repository, ['count-objects', '-v']),
    ]);
    const files = []; const collectionErrors = [];
    try { for (const relative of (await readdir(fixture.root, { recursive: true })).sort()) { const absolute = path.join(fixture.root, relative); const stat = await lstat(absolute); const content = stat.isFile() ? await readFile(absolute) : stat.isSymbolicLink() ? Buffer.from(await readlink(absolute)) : null; files.push({ relative, type: stat.isFile() ? 'file' : stat.isDirectory() ? 'directory' : stat.isSymbolicLink() ? 'symlink' : 'other', mode: stat.mode & 0o7777, byte_length: content?.length ?? null, sha256: content === null ? null : sha256(content), content_base64: content === null ? null : content.toString('base64') }); } }
    catch (error) { collectionErrors.push({ operation: 'filesystem_inventory', error: { name: error?.name ?? 'Error', message: error?.message ?? String(error), code: error?.code ?? null } }); }
    const batch = await captureRawGit(fixture.repository, ['cat-file', '--batch-all-objects', '--batch-check=%(objectname) %(objecttype) %(objectsize)']); const objectEntries = [];
    const operationRecord = result => ({ code: result.code, signal: result.signal, error: result.error, stdout_base64: result.stdout.toString('base64'), stderr_base64: result.stderr.toString('base64') });
    for (const [name, result] of [['head', head], ['refs', refs], ['count_objects', objects], ['object_enumeration', batch]]) if (result.code !== 0 || result.signal !== null || result.error !== null) collectionErrors.push({ operation: name, result: operationRecord(result) });
    if (collectionErrors.length === 0) for (const line of batch.stdout.toString('ascii').trim().split('\n').filter(Boolean)) { const [oid, type] = line.split(' '); const raw = await captureRawGit(fixture.repository, ['cat-file', type, oid]); const rawRecord = { oid, type, ...operationRecord(raw), raw_sha256: sha256(raw.stdout), raw_byte_length: raw.stdout.length, raw_base64: raw.stdout.toString('base64') }; objectEntries.push(rawRecord); if (raw.code !== 0 || raw.signal !== null || raw.error !== null) collectionErrors.push({ operation: 'object_read', oid, type, result: rawRecord }); }
    const record = { schema_version: '1.0', phase, fixture_root: fixture.root, formal_root: formalRoot, collection_complete: collectionErrors.length === 0, collection_errors: collectionErrors, files, head: operationRecord(head), refs: operationRecord(refs), objects: { count: operationRecord(objects), enumeration: operationRecord(batch), entries: objectEntries }, facts };
    let records = formalRecords.get(fixture); if (!records) { records = new Map(); formalRecords.set(fixture, records); } records.set(phase, record);
    await writeFile(path.join(formalRoot, `${phase}.json`), canonicalJson(record)); t.diagnostic(`R220-F1-FORMAL=${JSON.stringify({ phase, formal_root: formalRoot, complete: record.collection_complete, file_count: files.length, object_count: objectEntries.length, facts })}`); if (!record.collection_complete) throw new Error(`R220_F1_FORMAL_COLLECTION_FAILED: ${collectionErrors.map(error => error.operation).join(',')}`);
  };
  const formalEffectView = (fixture, phase) => {
    const record = formalRecords.get(fixture)?.get(phase); assert.ok(record, `formal inventory is retained for ${phase}`); assert.equal(record.collection_complete, true, `formal inventory completes for ${phase}`);
    return { files: record.files, head: record.head, refs: record.refs, objects: record.objects };
  };
  const assertNoPreEffectChange = (fixture, beforePhase, afterPhase, label) => assert.deepEqual(formalEffectView(fixture, afterPhase), formalEffectView(fixture, beforePhase), `${label}: invalid input changes no filesystem/ref/object evidence`);
  const assertNoForbiddenConstructionEffects = (fixture, beforePhase, afterPhase, label, { stateRoot, changeId }) => {
    const before = formalEffectView(fixture, beforePhase); const after = formalEffectView(fixture, afterPhase);
    assert.deepEqual(after.head, before.head, `${label}: construction changes no local HEAD`); assert.deepEqual(after.refs, before.refs, `${label}: construction changes no local or remote ref`);
    const stateRelative = path.relative(fixture.root, stateRoot); assert.ok(stateRelative.length > 0 && !stateRelative.startsWith('..') && !path.isAbsolute(stateRelative), `${label}: exact derived State root remains inside the fixture`);
    const workRelative = path.join(stateRelative, 'ledger-work'); const changeRelative = path.join(workRelative, changeId);
    const allowedDerived = new Set([stateRelative, workRelative, changeRelative, path.join(changeRelative, 'ledger.jsonl'), path.join(changeRelative, `ledger.jsonl.tmp-${process.pid}`), path.join(changeRelative, 'index'), path.join(changeRelative, 'index.lock')]);
    const beforeObjects = new Map(before.objects.entries.map(entry => [entry.oid, entry])); const afterObjects = new Map(after.objects.entries.map(entry => [entry.oid, entry]));
    for (const [oid, entry] of beforeObjects) { assert.ok(afterObjects.has(oid), `${label}: preexisting object ${oid} remains present`); assert.deepEqual(afterObjects.get(oid), entry, `${label}: preexisting object ${oid} remains byte-identical and same-type`); }
    const addedObjectOids = [...afterObjects.keys()].filter(oid => !beforeObjects.has(oid));
    const allowedObjectResidue = new Set(addedObjectOids.flatMap(oid => [path.join('repository', '.git', 'objects', oid.slice(0, 2)), path.join('repository', '.git', 'objects', oid.slice(0, 2), oid.slice(2))]));
    const beforeFiles = new Map(before.files.map(entry => [entry.relative, entry])); const afterFiles = new Map(after.files.map(entry => [entry.relative, entry]));
    for (const [relative, entry] of beforeFiles) { assert.ok(afterFiles.has(relative), `${label}: preexisting file ${relative} remains present`); assert.deepEqual(afterFiles.get(relative), entry, `${label}: preexisting file ${relative} remains unchanged`); }
    for (const [relative, entry] of afterFiles) {
      const prior = beforeFiles.get(relative); if (prior) continue;
      assert.ok(allowedDerived.has(relative) || allowedObjectResidue.has(relative), `${label}: unexpected residue ${relative}`);
      if (allowedObjectResidue.has(relative) && entry.type === 'file') assert.ok(addedObjectOids.some(oid => relative.endsWith(path.join(oid.slice(0, 2), oid.slice(2)))), `${label}: loose object residue is an actually enumerated added object`);
    }
    for (const oid of addedObjectOids) assert.equal(afterFiles.has(path.join('repository', '.git', 'objects', oid.slice(0, 2), oid.slice(2))), true, `${label}: added object ${oid} has exact loose-object residue`);
  };
  const assertNoProtectedTransport = (children, label, { builderExpected = true } = {}) => { const builderChildren = children.filter(child => child.scope === 'builder'); if (builderExpected) assert.ok(builderChildren.length > 0, `${label}: builder child coverage is distinct from Test setup/readback children`); assert.equal(builderChildren.some(child => child.spawnargs.some(arg => arg === 'push' || arg.startsWith('refs/'))), false, `${label}: no protected transport/refspec child is formed by the builder`); };
  const safeRetainF1Formal = async (fixture, phase, facts) => {
    try { await retainF1Formal(fixture, phase, facts); return null; }
    catch (error) { const retained = { name: error?.name ?? 'Error', message: error?.message ?? String(error), code: error?.code ?? null }; let preservedFacts; try { preservedFacts = structuredClone(facts); } catch (factError) { preservedFacts = { capture_error: { name: factError?.name ?? 'Error', message: factError?.message ?? String(factError), code: factError?.code ?? null } }; } t.diagnostic(`R220-F1-FORMAL-COLLECTION-ERROR=${JSON.stringify({ phase, retained, facts: preservedFacts })}`); return retained; }
  };

  await t.test('R216-MECHANICAL-HEALTH: accepts only a physically readable temporary extracted tree/commit', async () => {
    await withRepository(async fixture => {
      const change_id = 'CHG-r216-ledger'; const append = makeAppend({ change_id, subject_sha: fixture.baseline_sha }); let facts = { change_id, input: { receipt: structuredClone(append.receipt), prepared_bytes_base64: append.bytes.toString('base64') } };
      let primaryError = null; let collectionError = await safeRetainF1Formal(fixture, 'MECHANICAL_PRE', facts);
      try {
        const observed = await observeNativeGitChildren(fixture.repository, async (_events, inScope) => { const result = await inScope('builder', () => builderFor(fixture).construct({ prepared_receipt: append.receipt, prepared_bytes: append.bytes })); facts = { ...facts, product_result: result ?? null }; const resultCollectionError = await safeRetainF1Formal(fixture, 'MECHANICAL_RESULT', facts); collectionError ??= resultCollectionError; const local = result?.kind === 'OK' ? result.value : result; const treeSha = local?.tree_sha ?? local?.tree; const commitSha = local?.commit_sha ?? local?.commit; const commitType = await captureRawGit(fixture.repository, ['cat-file', '-t', commitSha]); const commit = await captureRawGit(fixture.repository, ['cat-file', 'commit', commitSha]); const target = await captureRawGit(fixture.repository, ['show', `${commitSha}:${append.receipt.authoritative_path}`]); const tree = await captureRawGit(fixture.repository, ['rev-parse', `${commitSha}^{tree}`]); const treeType = await captureRawGit(fixture.repository, ['cat-file', '-t', treeSha]); const targetEntry = await captureRawGit(fixture.repository, ['ls-tree', '-z', '--full-tree', treeSha, '--', append.receipt.authoritative_path]); const targetMatch = /^100644 blob ([0-9a-f]{40})\t/.exec(targetEntry.stdout.toString('utf8')); const blobType = await captureRawGit(fixture.repository, ['cat-file', '-t', targetMatch?.[1] ?? '']); const preserved = await rawPreservedEntries(fixture, commitSha, append.receipt.authoritative_path); return { result, treeSha, commitSha, commitType, commit, target, tree, treeType, targetEntry, targetBlobSha: targetMatch?.[1] ?? null, blobType, preserved }; }); const operation = observed.value; facts = { ...facts, action_error: observed.action_error, children: nativeChildFacts(observed.events), outcome: operation ?? null }; const outcomeCollectionError = await safeRetainF1Formal(fixture, 'MECHANICAL_OUTCOME', facts); collectionError ??= outcomeCollectionError; assert.equal(observed.action_error, null, 'mechanical operation error is retained before assertions'); const { result, treeSha, commitSha, commitType, commit, target, tree, treeType, targetEntry, targetBlobSha, blobType, preserved } = operation;
        assert.match(treeSha ?? '', /^[0-9a-f]{40}$/); assert.match(commitSha ?? '', /^[0-9a-f]{40}$/);
        for (const [label, raw] of [['commit type', commitType], ['commit', commit], ['target', target], ['tree', tree], ['tree type', treeType], ['target entry', targetEntry], ['blob type', blobType]]) assertSuccessfulRawGit(raw, `mechanical ${label}`); assert.deepEqual(commitType.stdout, Buffer.from('commit\n')); assert.deepEqual(treeType.stdout, Buffer.from('tree\n')); assert.deepEqual(blobType.stdout, Buffer.from('blob\n')); assert.deepEqual(tree.stdout, Buffer.from(`${treeSha}\n`)); assert.ok(isOid(targetBlobSha)); assert.deepEqual(targetEntry.stdout, Buffer.from(`100644 blob ${targetBlobSha}\t${append.receipt.authoritative_path}\0`)); assert.deepEqual(target.stdout, append.bytes); assert.equal(sha256(preserved), sha256(Buffer.alloc(0)));
        const parsedCommit = parsePhysicalCommit(commit.stdout, commitSha); assert.equal(parsedCommit.tree, treeSha); assert.deepEqual(parsedCommit.parents, []); assert.deepEqual(parsedCommit.body, Buffer.from(`JuanerAI evidence ${append.receipt.event_id}\n`)); assertNoForbiddenConstructionEffects(fixture, 'MECHANICAL_PRE', 'MECHANICAL_RESULT', 'mechanical health', { stateRoot: path.join(fixture.root, 'r216-state'), changeId: change_id }); assertNoProtectedTransport(nativeChildFacts(observed.events), 'mechanical health');
      } catch (error) { primaryError = error; facts = { ...facts, primary_error: { name: error?.name ?? 'Error', message: error?.message ?? String(error), code: error?.code ?? null } }; throw error; }
      finally { const postCollectionError = await safeRetainF1Formal(fixture, 'MECHANICAL_POST', { ...facts, pre_collection_error: collectionError }); collectionError ??= postCollectionError; if (primaryError === null && collectionError !== null) assert.fail(`R220_F1_FORMAL_COLLECTION_FAILED: ${collectionError.message}`); }
    });
  });

  await t.test('R216-L02: final local success is the closed eleven-field union after physical proof', async l02 => {
    await withRepository(async fixture => {
      const change_id = 'CHG-r216-ledger-final'; const target = `ledger/${change_id}.jsonl`;
      let facts = { change_id, target }; let primaryError = null; let collectionError = null;
      try {
        collectionError = await safeRetainF1Formal(fixture, 'L02_PRE', facts);
        const parentSetup = await observeNativeGitChildren(fixture.repository, async () => { const parentAbsent = await createParent(fixture, { target, marker: 'r216-parent-absent', preserved: [{ path: 'z-regular', bytes: 'z\n' }, { path: 'a-executable', bytes: 'a\n', mode: 'executable' }] }); const existing = makeAppend({ change_id, subject_sha: fixture.baseline_sha }); const parentExisting = await createParent(fixture, { target, bytes: existing.bytes, marker: 'r216-parent-existing' }); return { parentAbsent, existing, parentExisting }; }); facts = { ...facts, parent_setup_action_error: parentSetup.action_error, parent_setup_children: nativeChildFacts(parentSetup.events), parent_setup_outcome: parentSetup.value ?? null }; assert.equal(parentSetup.action_error, null, 'L02 parent setup error is retained before child construction'); const { parentAbsent, existing, parentExisting } = parentSetup.value;
        const cases = [
        ['empty parent', null, Buffer.alloc(0), 1],
        ['nonempty parent target absent', parentAbsent, Buffer.alloc(0), 1],
        ['regular existing target', parentExisting, existing.bytes, 2],
      ];
      for (const [name, expected_tip, prior_bytes, sequence] of cases) {
        await l02.test(name, async () => {
          const append = makeAppend({ change_id, expected_tip, prior_bytes, sequence, subject_sha: fixture.baseline_sha }); const admittedReceipt = structuredClone(append.receipt); const admittedBytes = Buffer.from(append.bytes); const entrySnapshot = Object.freeze({ receipt: Object.freeze(structuredClone(admittedReceipt)), bytes: Buffer.from(admittedBytes) }); const phase = `L02_CASE_${name.replace(/[^a-z0-9]+/gi, '_').toUpperCase()}`; const stateName = `r216-${phase.toLowerCase()}`; const caseStateRoot = path.join(fixture.root, stateName); let caseFacts = { name, input: { expected_tip, prior_byte_length: prior_bytes.length, sequence, receipt: entrySnapshot.receipt, prepared_bytes_base64: entrySnapshot.bytes.toString('base64') } }; let caseError = null; let caseCollectionError = null;
          try {
          caseCollectionError = await safeRetainF1Formal(fixture, `${phase}_PRE`, caseFacts);
          const observed = await observeNativeGitChildren(fixture.repository, async (_events, inScope) => { const before = await rawPreservedEntries(fixture, expected_tip, target); const parentType = expected_tip === null ? null : await captureRawGit(fixture.repository, ['cat-file', '-t', expected_tip]); const parentCommit = expected_tip === null ? null : await captureRawGit(fixture.repository, ['cat-file', 'commit', expected_tip]); const parentTree = expected_tip === null ? null : await captureRawGit(fixture.repository, ['rev-parse', `${expected_tip}^{tree}`]); const parentTreeOid = parentTree?.stdout.toString('ascii').replace(/\n$/, '') ?? null; const parentTreeType = expected_tip === null ? null : await captureRawGit(fixture.repository, ['cat-file', '-t', parentTreeOid]); const oldTargetEntry = expected_tip === null ? null : await captureRawGit(fixture.repository, ['ls-tree', '-z', '--full-tree', expected_tip, '--', target]); const oldTargetMatch = oldTargetEntry === null ? null : /^100644 blob ([0-9a-f]{40})\t/.exec(oldTargetEntry.stdout.toString('utf8')); const oldTargetType = oldTargetMatch === null ? null : await captureRawGit(fixture.repository, ['cat-file', '-t', oldTargetMatch[1]]); const oldTarget = oldTargetMatch === null ? null : await captureRawGit(fixture.repository, ['cat-file', 'blob', oldTargetMatch[1]]); const result = await inScope('builder', () => builderFor(fixture, stateName).construct({ prepared_receipt: admittedReceipt, prepared_bytes: admittedBytes })); caseFacts = { ...caseFacts, product_result: result ?? null, before_preserved_base64: before.toString('base64'), old_target: oldTarget ?? null }; const resultCollectionError = await safeRetainF1Formal(fixture, `${phase}_RESULT`, caseFacts); caseCollectionError ??= resultCollectionError; const after = await rawPreservedEntries(fixture, result?.value?.commit_sha ?? '', target); const commitType = await captureRawGit(fixture.repository, ['cat-file', '-t', result?.value?.commit_sha ?? '']); const treeType = await captureRawGit(fixture.repository, ['cat-file', '-t', result?.value?.tree_sha ?? '']); const blobType = await captureRawGit(fixture.repository, ['cat-file', '-t', result?.value?.ledger_blob_sha ?? '']); const targetRead = await captureRawGit(fixture.repository, ['show', `${result?.value?.commit_sha ?? ''}:${target}`]); const targetEntry = await captureRawGit(fixture.repository, ['ls-tree', '-z', '--full-tree', result?.value?.tree_sha ?? '', '--', target]); const blob = await captureRawGit(fixture.repository, ['cat-file', 'blob', result?.value?.ledger_blob_sha ?? '']); const commit = await captureRawGit(fixture.repository, ['cat-file', 'commit', result?.value?.commit_sha ?? '']); return { before, parentType, parentCommit, parentTree, parentTreeOid, parentTreeType, oldTargetEntry, oldTargetOid: oldTargetMatch?.[1] ?? null, oldTargetType, oldTarget, result, after, commitType, treeType, blobType, targetRead, targetEntry, blob, commit }; }); const operation = observed.value; caseFacts = { ...caseFacts, action_error: observed.action_error, children: nativeChildFacts(observed.events), outcome: operation ?? null }; const outcomeCollectionError = await safeRetainF1Formal(fixture, `${phase}_OUTCOME`, caseFacts); caseCollectionError ??= outcomeCollectionError; assert.equal(observed.action_error, null, `${name}: observed operation error is retained before assertions`); const { before, parentType, parentCommit, parentTree, parentTreeOid, parentTreeType, oldTargetEntry, oldTargetOid, oldTargetType, oldTarget, result, after, commitType, treeType, blobType, targetRead, targetEntry, blob, commit } = operation;
          assert.equal(Object.getPrototypeOf(result), Object.prototype); assert.ok(Object.values(Object.getOwnPropertyDescriptors(result)).every(descriptor => descriptor.enumerable && Object.hasOwn(descriptor, 'value'))); assert.deepEqual(Reflect.ownKeys(result).sort(), ['kind', 'receipt_sha256', 'value'], name); assert.equal(result.kind, 'OK', name); assert.equal(Object.getPrototypeOf(result.value), Object.prototype); assert.ok(Object.values(Object.getOwnPropertyDescriptors(result.value)).every(descriptor => descriptor.enumerable && Object.hasOwn(descriptor, 'value'))); assert.deepEqual(Reflect.ownKeys(result.value).sort(), exactLocalValueKeys, name); assert.equal(result.value.publication_status, 'UNPUBLISHED');
          assertIndependentAppend({ receipt: entrySnapshot.receipt, preparedBytes: entrySnapshot.bytes, expectedTip: expected_tip, expectedPrefix: prior_bytes, expectedSequence: sequence }); assert.equal(result.value.parent_tip, expected_tip); assert.equal(result.value.authoritative_path, entrySnapshot.receipt.authoritative_path); assert.deepEqual(result.value.changed_paths, [target]); assert.equal(result.value.ledger_bytes_sha256, sha256(entrySnapshot.bytes)); assert.equal(result.value.ledger_byte_length, entrySnapshot.bytes.length); assert.equal(result.receipt_sha256, sha256(canonicalJson(result.value)));
          assertNoForbiddenConstructionEffects(fixture, `${phase}_PRE`, `${phase}_RESULT`, name, { stateRoot: caseStateRoot, changeId: change_id }); assertNoProtectedTransport(nativeChildFacts(observed.events), name);
          if (expected_tip === null) { assert.equal(oldTarget, null); assert.equal(oldTargetType, null); assert.equal(oldTargetOid, null); assert.equal(parentType, null); assert.equal(parentCommit, null); assert.equal(parentTree, null); assert.equal(parentTreeType, null); assert.equal(oldTargetEntry, null); } else { assertSuccessfulRawGit(parentType, `${name} parent type`); assert.deepEqual(parentType.stdout, Buffer.from('commit\n')); assertSuccessfulRawGit(parentCommit, `${name} parent commit`); const parsedParent = parsePhysicalCommit(parentCommit.stdout, expected_tip); assertSuccessfulRawGit(parentTree, `${name} parent tree`); assert.ok(isOid(parentTreeOid)); assert.deepEqual(parentTree.stdout, Buffer.from(`${parsedParent.tree}\n`)); assertSuccessfulRawGit(parentTreeType, `${name} old tree type`); assert.deepEqual(parentTreeType.stdout, Buffer.from('tree\n')); assertSuccessfulRawGit(oldTargetEntry, `${name} old target entry`); if (name.includes('absent')) { assert.deepEqual(oldTargetEntry.stdout, Buffer.alloc(0)); assert.equal(oldTarget, null); assert.equal(oldTargetType, null); assert.equal(oldTargetOid, null); } else { assert.match(oldTargetEntry.stdout.toString('utf8'), /^100644 blob [0-9a-f]{40}\tledger\/CHG-r216-ledger-final\.jsonl\0$/); assert.ok(isOid(oldTargetOid)); assertSuccessfulRawGit(oldTargetType, `${name} old blob type`); assert.deepEqual(oldTargetType.stdout, Buffer.from('blob\n')); assertSuccessfulRawGit(oldTarget, `${name} old target blob`); assert.deepEqual(oldTarget.stdout, prior_bytes, `${name}: physical old blob equals the bound canonical prefix`); } }
          assert.deepEqual(after, before, `${name}: raw non-target records are byte-identical`); assert.equal(result.value.preserved_entries_sha256_before, sha256(before)); assert.equal(result.value.preserved_entries_sha256_after, sha256(after)); if (name === 'nonempty parent target absent') assert.ok(before.indexOf(Buffer.from('\ta-executable\0')) < before.indexOf(Buffer.from('\tz-regular\0')), 'independent oracle sorts differently-moded records by raw path, never their header/OID bytes');
          assert.ok(isOid(result.value.commit_sha)); assert.ok(isOid(result.value.tree_sha)); assert.ok(isOid(result.value.ledger_blob_sha)); for (const [label, raw] of [['new commit type', commitType], ['new tree type', treeType], ['new blob type', blobType], ['new target read', targetRead], ['new target entry', targetEntry], ['new blob read', blob], ['new commit read', commit]]) assertSuccessfulRawGit(raw, `${name} ${label}`); assert.deepEqual(commitType.stdout, Buffer.from('commit\n')); assert.deepEqual(treeType.stdout, Buffer.from('tree\n')); assert.deepEqual(blobType.stdout, Buffer.from('blob\n')); assert.deepEqual(targetRead.stdout, entrySnapshot.bytes); assert.deepEqual(blob.stdout, entrySnapshot.bytes); assert.deepEqual(targetEntry.stdout, Buffer.from(`100644 blob ${result.value.ledger_blob_sha}\t${target}\0`)); const parsedCommit = parsePhysicalCommit(commit.stdout, result.value.commit_sha); assert.equal(parsedCommit.tree, result.value.tree_sha); assert.deepEqual(parsedCommit.parents, expected_tip === null ? [] : [expected_tip]); assert.deepEqual(parsedCommit.body, Buffer.from(`JuanerAI evidence ${entrySnapshot.receipt.event_id}\n`));
          } catch (error) { caseError = error; caseFacts = { ...caseFacts, primary_error: { name: error?.name ?? 'Error', message: error?.message ?? String(error), code: error?.code ?? null } }; throw error; }
          finally { const finalCollectionError = await safeRetainF1Formal(fixture, `${phase}_FINAL`, { ...caseFacts, outcome_collection_error: caseCollectionError }); caseCollectionError ??= finalCollectionError; if (caseError === null && caseCollectionError !== null) assert.fail(`R220_F1_FORMAL_COLLECTION_FAILED: ${caseCollectionError.message}`); }
        });
        }
      } catch (error) { primaryError = error; facts = { ...facts, primary_error: { name: error?.name ?? 'Error', message: error?.message ?? String(error), code: error?.code ?? null } }; throw error; }
      finally { const postCollectionError = await safeRetainF1Formal(fixture, 'L02_POST', { ...facts, pre_collection_error: collectionError }); collectionError ??= postCollectionError; if (primaryError === null && collectionError !== null) assert.fail(`R220_F1_FORMAL_COLLECTION_FAILED: ${collectionError.message}`); }
    });
  });

  await t.test('R216-L03: an actual derived index lock and a missing predecessor are never publishable', async () => {
    await withRepository(async fixture => {
      const change_id = 'CHG-r216-lock'; const append = makeAppend({ change_id, subject_sha: fixture.baseline_sha });
      let facts = { change_id }; let primaryError = null; let collectionError = null;
      try {
        collectionError = await safeRetainF1Formal(fixture, 'LOCK_PRE', facts);
        const lockControlRoot = path.join(fixture.root, 'r216-lock-control'); facts = { ...facts, healthy_input: { receipt: structuredClone(append.receipt), prepared_bytes_base64: append.bytes.toString('base64') } }; const healthyObserved = await observeNativeGitChildren(fixture.repository, async (_events, inScope) => { const preRefs = await captureRawGit(fixture.repository, ['for-each-ref', '--format=%(refname) %(objectname)']); const controlPreError = await safeRetainF1Formal(fixture, 'LOCK_CONTROL_PRE', facts); collectionError ??= controlPreError; const healthy = await inScope('builder', () => builderFor(fixture, 'r216-lock-control').construct({ prepared_receipt: append.receipt, prepared_bytes: append.bytes })); facts = { ...facts, healthy_product_result: healthy ?? null }; const controlResultError = await safeRetainF1Formal(fixture, 'LOCK_CONTROL_RESULT', facts); collectionError ??= controlResultError; const healthyCommit = healthy?.value?.commit_sha ?? healthy?.commit; const healthyTree = healthy?.value?.tree_sha ?? healthy?.tree; const healthyObject = await captureRawGit(fixture.repository, ['cat-file', 'commit', healthyCommit ?? '']); const healthyTreeType = await captureRawGit(fixture.repository, ['cat-file', '-t', healthyTree ?? '']); const healthyTarget = await captureRawGit(fixture.repository, ['show', `${healthyCommit ?? ''}:${append.receipt.authoritative_path}`]); return { preRefs, healthy, healthyCommit, healthyTree, healthyObject, healthyTreeType, healthyTarget }; }); facts = { ...facts, healthy_action_error: healthyObserved.action_error, healthy_children: nativeChildFacts(healthyObserved.events), healthy_outcome: healthyObserved.value ?? null }; const controlOutcomeError = await safeRetainF1Formal(fixture, 'LOCK_CONTROL_OUTCOME', facts); collectionError ??= controlOutcomeError; assert.equal(healthyObserved.action_error, null, 'lock healthy control error is retained before assertions'); const { preRefs, healthy, healthyCommit, healthyTree, healthyObject, healthyTreeType, healthyTarget } = healthyObserved.value; assert.equal(preRefs.code, 0, preRefs.stderr.toString('utf8')); assert.match(healthyCommit, /^[0-9a-f]{40}$/, 'the lock is injected only after a separately indexed healthy construction'); assert.match(healthyTree, /^[0-9a-f]{40}$/); assertSuccessfulRawGit(healthyObject, 'lock healthy commit'); assertSuccessfulRawGit(healthyTreeType, 'lock healthy tree type'); assert.deepEqual(healthyTreeType.stdout, Buffer.from('tree\n')); assertSuccessfulRawGit(healthyTarget, 'lock healthy target'); assert.deepEqual(healthyTarget.stdout, append.bytes); const parsedHealthy = parsePhysicalCommit(healthyObject.stdout, healthyCommit); assert.equal(parsedHealthy.tree, healthyTree); assert.deepEqual(parsedHealthy.parents, []); assertNoForbiddenConstructionEffects(fixture, 'LOCK_CONTROL_PRE', 'LOCK_CONTROL_RESULT', 'lock healthy control', { stateRoot: lockControlRoot, changeId: change_id }); assertNoProtectedTransport(nativeChildFacts(healthyObserved.events), 'lock healthy control');
        const stateRoot = path.join(fixture.root, 'r216-lock'); const indexLock = path.join(stateRoot, 'ledger-work', change_id, 'index.lock');
        await mkdir(path.dirname(indexLock), { recursive: true }); await writeFile(indexLock, 'held by R216 test');
        facts = { ...facts, fault_input: { receipt: structuredClone(append.receipt), prepared_bytes_base64: append.bytes.toString('base64'), index_lock: indexLock } }; const faultPreError = await safeRetainF1Formal(fixture, 'LOCK_FAULT_PRE', facts); collectionError ??= faultPreError;
        const observed = await observeNativeGitChildren(fixture.repository, async (_events, inScope) => inScope('builder', () => builderFor(fixture, 'r216-lock').construct({ prepared_receipt: append.receipt, prepared_bytes: append.bytes })));
        const children = nativeChildFacts(observed.events);
        const locked = observed.value; facts = { ...facts, child_action_error: observed.action_error, child_logs: children, locked_result: locked ?? null };
        const resultCollectionError = await safeRetainF1Formal(fixture, 'LOCK_RESULT', facts); collectionError ??= resultCollectionError;
        t.diagnostic(`R216-S5-native-child-log=${JSON.stringify(children)}`);
        const finalUnavailable = locked?.kind === 'UNAVAILABLE' && locked?.reason === 'PROCESS_FAILED' && locked?.partial_receipt === null && Object.keys(locked).length === 3;
        const provisional = locked?.kind === 'OK' ? locked.value : locked; const hasCommit = provisional !== null && typeof provisional === 'object' && (Object.hasOwn(provisional, 'commit_sha') || Object.hasOwn(provisional, 'commit')); const hasTree = provisional !== null && typeof provisional === 'object' && (Object.hasOwn(provisional, 'tree_sha') || Object.hasOwn(provisional, 'tree')); const allegedCommit = hasCommit ? (provisional.commit_sha ?? provisional.commit) : null; const allegedTree = hasTree ? (provisional.tree_sha ?? provisional.tree) : null; const returnedIdentity = hasCommit && hasTree; const validIdentity = /^[0-9a-f]{40}$/.test(allegedCommit ?? '') && /^[0-9a-f]{40}$/.test(allegedTree ?? '');
        let physicalFact = { classification: finalUnavailable ? 'FINAL_UNAVAILABLE' : returnedIdentity ? validIdentity ? 'CLAIMED_IDENTITY' : 'CLAIMED_INVALID_IDENTITY' : 'UNPROVEN_FRONTIER', returned_commit_field: hasCommit, returned_tree_field: hasTree, provisional_commit: allegedCommit, provisional_tree: allegedTree };
        let badPublication = false;
        if (returnedIdentity && !validIdentity) badPublication = true;
        const rawOperation = result => result === null ? null : { code: result.code, signal: result.signal, error: result.error, stdout_base64: result.stdout.toString('base64'), stderr_base64: result.stderr.toString('base64') }; const physicalRaw = {};
        const capturePhysicalRaw = async (name, argv) => { const observedRaw = await observeNativeGitChildren(fixture.repository, async () => captureRawGit(fixture.repository, argv)); physicalRaw[name] = { action_error: observedRaw.action_error, children: nativeChildFacts(observedRaw.events), result: rawOperation(observedRaw.value) }; facts = { ...facts, healthy_commit: healthyCommit, healthy_commit_base64: healthyObject.stdout.toString('base64'), healthy_target_base64: healthyTarget.stdout.toString('base64'), physical_raw_operation: physicalRaw }; const rawCollectionError = await safeRetainF1Formal(fixture, `LOCK_PHYSICAL_RAW_${name.toUpperCase()}`, facts); collectionError ??= rawCollectionError; return observedRaw.value; };
        const commit = validIdentity ? await capturePhysicalRaw('commit', ['cat-file', 'commit', allegedCommit]) : null; const target = validIdentity ? await capturePhysicalRaw('target', ['show', `${allegedCommit}:${append.receipt.authoritative_path}`]) : null; const head = await capturePhysicalRaw('head', ['rev-parse', 'HEAD']); const postRefs = await capturePhysicalRaw('post_refs', ['for-each-ref', '--format=%(refname) %(objectname)']);
        if (validIdentity) { physicalFact = { ...physicalFact, commit_code: commit.code, commit_signal: commit.signal, commit_error: commit.error, commit_stdout_base64: commit.stdout.toString('base64'), commit_stderr_base64: commit.stderr.toString('base64'), target_code: target.code, target_signal: target.signal, target_error: target.error, target_stderr_base64: target.stderr.toString('base64'), target_base64: target.stdout.toString('base64'), target_sha256: sha256(target.stdout), expected_target_sha256: sha256(append.bytes) }; badPublication = commit.code !== 0 || target.code !== 0 || !target.stdout.equals(append.bytes); }
        facts = { ...facts, physical_fact: physicalFact, bad_publication: badPublication, pre_refs_base64: preRefs.stdout.toString('base64'), post_refs_base64: postRefs.stdout.toString('base64'), head_base64: head.stdout.toString('base64') };
        const outcomeCollectionError = await safeRetainF1Formal(fixture, 'LOCK_OUTCOME', facts); collectionError ??= outcomeCollectionError;
        t.diagnostic(`RED-R216-F1-BEHAVIOR-physical-fact=${JSON.stringify(physicalFact)}`); t.diagnostic(`R216-L03-formal-inventory=${JSON.stringify(facts)}`);
        assert.equal(observed.action_error, null, 'the observed builder call must retain its thrown outcome before this assertion'); assert.ok(children.some(event => event.scope === 'builder' && ((event.close !== null && (event.close.code !== 0 || event.close.signal !== null)) || event.error !== null)), 'the required failure evidence includes an observed completed real pinned-Git builder child close/error, not a Test raw-Git substitute'); assert.equal(head.code, 0); assert.deepEqual(head.stdout, Buffer.from(`${fixture.baseline_sha}\n`), 'local construction never moves a repository ref and preserves the exact raw HEAD framing'); assert.equal(postRefs.code, 0, postRefs.stderr.toString('utf8')); assert.deepEqual(postRefs.stdout, preRefs.stdout, 'local construction never changes refs'); assertNoForbiddenConstructionEffects(fixture, 'LOCK_FAULT_PRE', 'LOCK_RESULT', 'derived index lock', { stateRoot, changeId: change_id }); assertNoProtectedTransport(children, 'derived index lock');
        if (!finalUnavailable) assert.equal(badPublication, true, 'RED-R216-F1-BEHAVIOR requires a returned claimed identity with a proved physical contradiction, never a result-shape mismatch');
        assert.deepEqual(locked, { kind: 'UNAVAILABLE', reason: 'PROCESS_FAILED', partial_receipt: null });
      } catch (error) { primaryError = error; facts = { ...facts, primary_error: { name: error?.name ?? 'Error', message: error?.message ?? String(error), code: error?.code ?? null } }; throw error; }
      finally { const postCollectionError = await safeRetainF1Formal(fixture, 'LOCK_POST', { ...facts, pre_collection_error: collectionError }); collectionError ??= postCollectionError; if (primaryError === null && collectionError !== null) assert.fail(`R220_F1_FORMAL_COLLECTION_FAILED: ${collectionError.message}`); }
    });
  });

  await t.test('R216-L03: a missing predecessor is independently unavailable and retained', async () => {
    await withRepository(async fixture => {
      const change_id = 'CHG-r216-missing'; const missing = makeAppend({ change_id, expected_tip: 'f'.repeat(40), subject_sha: fixture.baseline_sha });
      let facts = { change_id, expected_tip: missing.receipt.expected_tip }; let primaryError = null; let collectionError = null;
      try {
        collectionError = await safeRetainF1Formal(fixture, 'MISSING_PRE', facts);
        const controlChangeId = 'CHG-r216-missing-control'; const controlStateRoot = path.join(fixture.root, 'r216-missing-control'); const controlAppend = makeAppend({ change_id: controlChangeId, subject_sha: fixture.baseline_sha }); facts = { ...facts, control_input: { receipt: structuredClone(controlAppend.receipt), prepared_bytes_base64: controlAppend.bytes.toString('base64') } }; const controlObserved = await observeNativeGitChildren(fixture.repository, async (_events, inScope) => { const controlPreError = await safeRetainF1Formal(fixture, 'MISSING_CONTROL_PRE', facts); collectionError ??= controlPreError; const control = await inScope('builder', () => builderFor(fixture, 'r216-missing-control').construct({ prepared_receipt: controlAppend.receipt, prepared_bytes: controlAppend.bytes })); facts = { ...facts, control_product_result: control ?? null }; const controlResultError = await safeRetainF1Formal(fixture, 'MISSING_CONTROL_RESULT', facts); collectionError ??= controlResultError; const controlCommit = control?.value?.commit_sha ?? control?.commit; const controlTree = control?.value?.tree_sha ?? control?.tree; const controlCommitRaw = await captureRawGit(fixture.repository, ['cat-file', 'commit', controlCommit ?? '']); const controlTreeType = await captureRawGit(fixture.repository, ['cat-file', '-t', controlTree ?? '']); const controlEntry = await captureRawGit(fixture.repository, ['ls-tree', '-z', '--full-tree', controlTree ?? '', '--', controlAppend.receipt.authoritative_path]); const controlReadback = await captureRawGit(fixture.repository, ['show', `${controlCommit ?? ''}:${controlAppend.receipt.authoritative_path}`]); return { control, controlCommit, controlTree, controlCommitRaw, controlTreeType, controlEntry, controlReadback }; }); facts = { ...facts, control_action_error: controlObserved.action_error, control_children: nativeChildFacts(controlObserved.events), control_outcome: controlObserved.value ?? null }; const controlOutcomeError = await safeRetainF1Formal(fixture, 'MISSING_CONTROL_OUTCOME', facts); collectionError ??= controlOutcomeError; assert.equal(controlObserved.action_error, null, 'missing healthy control error is retained before assertions'); const { controlCommit, controlTree, controlCommitRaw, controlTreeType, controlEntry, controlReadback } = controlObserved.value; assert.match(controlCommit, /^[0-9a-f]{40}$/, 'missing-object fault follows a separate healthy control'); assert.match(controlTree, /^[0-9a-f]{40}$/); assertSuccessfulRawGit(controlCommitRaw, 'missing control commit'); assertSuccessfulRawGit(controlTreeType, 'missing control tree type'); assert.deepEqual(controlTreeType.stdout, Buffer.from('tree\n')); assertSuccessfulRawGit(controlEntry, 'missing control target entry'); assert.match(controlEntry.stdout.toString('utf8'), /^100644 blob [0-9a-f]{40}\tledger\/CHG-r216-missing-control\.jsonl\0$/); assertSuccessfulRawGit(controlReadback, 'missing control target'); assert.deepEqual(controlReadback.stdout, controlAppend.bytes); const parsedControl = parsePhysicalCommit(controlCommitRaw.stdout, controlCommit); assert.equal(parsedControl.tree, controlTree); assert.deepEqual(parsedControl.parents, []); assertNoForbiddenConstructionEffects(fixture, 'MISSING_CONTROL_PRE', 'MISSING_CONTROL_RESULT', 'missing predecessor healthy control', { stateRoot: controlStateRoot, changeId: controlChangeId }); assertNoProtectedTransport(nativeChildFacts(controlObserved.events), 'missing predecessor healthy control');
        const missingStateRoot = path.join(fixture.root, 'r216-missing'); facts = { ...facts, fault_input: { receipt: structuredClone(missing.receipt), prepared_bytes_base64: missing.bytes.toString('base64') } }; const faultPreError = await safeRetainF1Formal(fixture, 'MISSING_FAULT_PRE', facts); collectionError ??= faultPreError; const observed = await observeNativeGitChildren(fixture.repository, async (_events, inScope) => inScope('builder', () => builderFor(fixture, 'r216-missing').construct({ prepared_receipt: missing.receipt, prepared_bytes: missing.bytes }))); const children = nativeChildFacts(observed.events); const result = observed.value;
        facts = { ...facts, control_commit: controlCommit, control_readback_base64: controlReadback.stdout.toString('base64'), child_action_error: observed.action_error, child_logs: children, result: result ?? null };
        const resultCollectionError = await safeRetainF1Formal(fixture, 'MISSING_RESULT', facts); collectionError ??= resultCollectionError;
        const outcomeCollectionError = await safeRetainF1Formal(fixture, 'MISSING_OUTCOME', facts); collectionError ??= outcomeCollectionError;
        t.diagnostic(`R216-L03-missing-native-child-log=${JSON.stringify(children)}`);
        assert.equal(observed.action_error, null, 'missing-object child exception is retained before assertion'); assert.ok(children.some(event => event.scope === 'builder' && ((event.close !== null && (event.close.code !== 0 || event.close.signal !== null)) || event.error !== null)), 'missing predecessor retains its own failing real builder child evidence'); assert.deepEqual(result, { kind: 'UNAVAILABLE', reason: 'PROCESS_FAILED', partial_receipt: null }); assertNoForbiddenConstructionEffects(fixture, 'MISSING_FAULT_PRE', 'MISSING_RESULT', 'missing predecessor', { stateRoot: missingStateRoot, changeId: change_id }); assertNoProtectedTransport(children, 'missing predecessor');
      } catch (error) { primaryError = error; facts = { ...facts, primary_error: { name: error?.name ?? 'Error', message: error?.message ?? String(error), code: error?.code ?? null } }; throw error; }
      finally { const postCollectionError = await safeRetainF1Formal(fixture, 'MISSING_POST', { ...facts, pre_collection_error: collectionError }); collectionError ??= postCollectionError; if (primaryError === null && collectionError !== null) assert.fail(`R220_F1_FORMAL_COLLECTION_FAILED: ${collectionError.message}`); }
    });
  });

  await t.test('R216-L04: invalid physical predecessors cannot be relabeled as local publication', async l04 => {
    const target = 'ledger/CHG-r216-conflict.jsonl';
    const retainHealthyControl = async (fixture, phase) => {
      const safePhase = phase.toLowerCase().replace(/[^a-z0-9-]+/g, '-'); const controlChangeId = `CHG-r216-${safePhase}-control`; const controlTarget = `ledger/${controlChangeId}.jsonl`; const controlPrefix = makeAppend({ change_id: controlChangeId, subject_sha: fixture.baseline_sha }); let controlFacts = { phase, controlTarget, input: null }; let controlError = null; let controlCollectionError = await safeRetainF1Formal(fixture, `${phase}_CONTROL_PRE`, controlFacts);
      try { const observed = await observeNativeGitChildren(fixture.repository, async (_events, inScope) => { const controlTip = await createParent(fixture, { target: controlTarget, bytes: controlPrefix.bytes, marker: `r216-${safePhase}-parent` }); const append = makeAppend({ change_id: controlChangeId, expected_tip: controlTip, prior_bytes: controlPrefix.bytes, sequence: 2, subject_sha: fixture.baseline_sha }); controlFacts = { ...controlFacts, input: { expected_tip: controlTip, receipt: append.receipt, prepared_bytes_base64: append.bytes.toString('base64') } }; const operationPreError = await safeRetainF1Formal(fixture, `${phase}_CONTROL_OPERATION_PRE`, controlFacts); controlCollectionError ??= operationPreError; const result = await inScope('builder', () => builderFor(fixture, `${safePhase}-control`).construct({ prepared_receipt: append.receipt, prepared_bytes: append.bytes })); controlFacts = { ...controlFacts, product_result: result ?? null }; const resultCollectionError = await safeRetainF1Formal(fixture, `${phase}_CONTROL_RESULT`, controlFacts); controlCollectionError ??= resultCollectionError; const parentType = await captureRawGit(fixture.repository, ['cat-file', '-t', controlTip]); const parent = await captureRawGit(fixture.repository, ['cat-file', 'commit', controlTip]); const parentTree = await captureRawGit(fixture.repository, ['rev-parse', `${controlTip}^{tree}`]); const parentTreeOid = parentTree.stdout.toString('ascii').replace(/\n$/, ''); const parentTreeType = await captureRawGit(fixture.repository, ['cat-file', '-t', parentTreeOid]); const oldEntry = await captureRawGit(fixture.repository, ['ls-tree', '-z', '--full-tree', parentTreeOid, '--', controlTarget]); const oldMatch = /^100644 blob ([0-9a-f]{40})\t/.exec(oldEntry.stdout.toString('utf8')); const oldType = await captureRawGit(fixture.repository, ['cat-file', '-t', oldMatch?.[1] ?? '']); const oldTarget = await captureRawGit(fixture.repository, ['cat-file', 'blob', oldMatch?.[1] ?? '']); const commitType = await captureRawGit(fixture.repository, ['cat-file', '-t', result?.value?.commit_sha ?? '']); const commit = await captureRawGit(fixture.repository, ['cat-file', 'commit', result?.value?.commit_sha ?? '']); const treeType = await captureRawGit(fixture.repository, ['cat-file', '-t', result?.value?.tree_sha ?? '']); const targetEntry = await captureRawGit(fixture.repository, ['ls-tree', '-z', '--full-tree', result?.value?.tree_sha ?? '', '--', controlTarget]); const blobType = await captureRawGit(fixture.repository, ['cat-file', '-t', result?.value?.ledger_blob_sha ?? '']); const blob = await captureRawGit(fixture.repository, ['cat-file', 'blob', result?.value?.ledger_blob_sha ?? '']); return { append, controlTip, result, parentType, parent, parentTree, parentTreeOid, parentTreeType, oldEntry, oldOid: oldMatch?.[1] ?? null, oldType, oldTarget, commitType, commit, treeType, targetEntry, blobType, blob }; }); controlFacts = { ...controlFacts, action_error: observed.action_error, children: nativeChildFacts(observed.events), outcome: observed.value ?? null }; const outcomeCollectionError = await safeRetainF1Formal(fixture, `${phase}_CONTROL_OUTCOME`, controlFacts); controlCollectionError ??= outcomeCollectionError; assert.equal(observed.action_error, null, `${phase}: healthy control observer error`); const { append, controlTip, result, parentType, parent, parentTree, parentTreeOid, parentTreeType, oldEntry, oldOid, oldType, oldTarget, commitType, commit, treeType, targetEntry, blobType, blob } = observed.value; assert.equal(result.kind, 'OK', `${phase}: reachable fault requires a healthy control`); for (const [label, raw] of [['parent type', parentType], ['parent', parent], ['parent tree', parentTree], ['parent tree type', parentTreeType], ['old entry', oldEntry], ['old type', oldType], ['old target', oldTarget], ['new commit type', commitType], ['new commit', commit], ['new tree type', treeType], ['new target entry', targetEntry], ['new blob type', blobType], ['new blob', blob]]) assertSuccessfulRawGit(raw, `${phase}: healthy ${label}`); assert.deepEqual(parentType.stdout, Buffer.from('commit\n')); const parsedParent = parsePhysicalCommit(parent.stdout, controlTip); assert.ok(isOid(parentTreeOid)); assert.equal(parsedParent.tree, parentTreeOid); assert.deepEqual(parentTreeType.stdout, Buffer.from('tree\n')); assert.ok(isOid(oldOid)); assert.deepEqual(oldEntry.stdout, Buffer.from(`100644 blob ${oldOid}\t${controlTarget}\0`)); assert.deepEqual(oldType.stdout, Buffer.from('blob\n')); assert.deepEqual(oldTarget.stdout, controlPrefix.bytes); assert.deepEqual(commitType.stdout, Buffer.from('commit\n')); assert.deepEqual(treeType.stdout, Buffer.from('tree\n')); assert.deepEqual(blobType.stdout, Buffer.from('blob\n')); assert.deepEqual(targetEntry.stdout, Buffer.from(`100644 blob ${result.value.ledger_blob_sha}\t${controlTarget}\0`)); assert.deepEqual(blob.stdout, append.bytes); const parsedCommit = parsePhysicalCommit(commit.stdout, result.value.commit_sha); assert.equal(parsedCommit.tree, result.value.tree_sha); assert.deepEqual(parsedCommit.parents, [controlTip]); assert.deepEqual(parsedCommit.body, Buffer.from(`JuanerAI evidence ${append.receipt.event_id}\n`)); const controlStateRoot = path.join(fixture.root, `${safePhase}-control`); assertNoForbiddenConstructionEffects(fixture, `${phase}_CONTROL_OPERATION_PRE`, `${phase}_CONTROL_RESULT`, `${phase} healthy control`, { stateRoot: controlStateRoot, changeId: controlChangeId }); assertNoProtectedTransport(nativeChildFacts(observed.events), `${phase} healthy control`); return observed.value; }
      catch (error) { controlError = error; controlFacts = { ...controlFacts, primary_error: { name: error?.name ?? 'Error', message: error?.message ?? String(error), code: error?.code ?? null } }; throw error; }
      finally { const finalCollectionError = await safeRetainF1Formal(fixture, `${phase}_CONTROL_FINAL`, { ...controlFacts, outcome_collection_error: controlCollectionError }); controlCollectionError ??= finalCollectionError; if (controlError === null && controlCollectionError !== null) assert.fail(`R220_F1_FORMAL_COLLECTION_FAILED: ${controlCollectionError.message}`); }
    };
    for (const kind of ['ancestor', 'descendant', 'executable', 'symlink', 'gitlink']) {
      await l04.test(`physical ${kind} target collision is an exact readback conflict`, async () => {
        let healthyControl = null;
        await withRepository(async controlFixture => { healthyControl = await retainHealthyControl(controlFixture, `L04_${kind}`); });
        await withRepository(async fixture => {
          let facts = { kind, target, healthy_control: healthyControl }; let primaryError = null; let collectionError = null;
          try { collectionError = await safeRetainF1Formal(fixture, `L04_${kind}_PRE`, facts); const observed = await observeNativeGitChildren(fixture.repository, async (_events, inScope) => { const expected_tip = await createPhysicalConflictParent(fixture, { target, kind }); const append = makeAppend({ change_id: 'CHG-r216-conflict', expected_tip, subject_sha: fixture.baseline_sha }); facts = { ...facts, fault_input: { expected_tip, receipt: append.receipt, prepared_bytes_base64: append.bytes.toString('base64') } }; const faultCollectionError = await safeRetainF1Formal(fixture, `L04_${kind}_FAULT_PRE`, facts); collectionError ??= faultCollectionError; const result = await inScope('builder', () => builderFor(fixture, `r216-${kind}`).construct({ prepared_receipt: append.receipt, prepared_bytes: append.bytes })); facts = { ...facts, fault_product_result: result ?? null }; const resultCollectionError = await safeRetainF1Formal(fixture, `L04_${kind}_RESULT`, facts); collectionError ??= resultCollectionError; return { expected_tip, append, result }; }); facts = { ...facts, action_error: observed.action_error, children: nativeChildFacts(observed.events), outcome: observed.value ?? null }; const outcomeCollectionError = await safeRetainF1Formal(fixture, `L04_${kind}_OUTCOME`, facts); collectionError ??= outcomeCollectionError; assert.equal(observed.action_error, null, `${kind}: operation error is retained before assertions`); assertNoForbiddenConstructionEffects(fixture, `L04_${kind}_FAULT_PRE`, `L04_${kind}_RESULT`, `${kind} physical conflict`, { stateRoot: path.join(fixture.root, `r216-${kind}`), changeId: 'CHG-r216-conflict' }); assertNoProtectedTransport(nativeChildFacts(observed.events), `${kind} physical conflict`); assert.deepEqual(observed.value.result, { kind: 'CONFLICT', reason: 'READBACK_MISMATCH', observed_identity: null }, `${kind} is a proven physical target collision, not a publishable or uncertain result`); }
          catch (error) { primaryError = error; facts = { ...facts, primary_error: { name: error?.name ?? 'Error', message: error?.message ?? String(error), code: error?.code ?? null } }; throw error; }
          finally { const postCollectionError = await safeRetainF1Formal(fixture, `L04_${kind}_POST`, { ...facts, pre_collection_error: collectionError }); collectionError ??= postCollectionError; if (primaryError === null && collectionError !== null) assert.fail(`R220_F1_FORMAL_COLLECTION_FAILED: ${collectionError.message}`); }
        });
      });
    }
    await l04.test('valid canonical prefix disagrees with the physical regular old blob', async () => {
      await withRepository(async fixture => {
        let facts = { kind: 'old-blob', target }; let primaryError = null; let collectionError = null;
        try { collectionError = await safeRetainF1Formal(fixture, 'L04_OLD_BLOB_PRE', facts); facts = { ...facts, healthy_control: await retainHealthyControl(fixture, 'L04_OLD_BLOB') }; const observed = await observeNativeGitChildren(fixture.repository, async (_events, inScope) => { const change_id = 'CHG-r216-conflict'; const physical = makeAppend({ change_id, subject_sha: fixture.baseline_sha, idempotency_suffix: '-physical' }); const expected_tip = await createParent(fixture, { target, bytes: physical.bytes, marker: 'r216-old-blob' }); const different = makeAppend({ change_id, expected_tip, prior_bytes: makeAppend({ change_id, subject_sha: fixture.baseline_sha, idempotency_suffix: '-different' }).bytes, sequence: 2, subject_sha: fixture.baseline_sha, idempotency_suffix: '-append' }); facts = { ...facts, fault_input: { expected_tip, receipt: different.receipt, prepared_bytes_base64: different.bytes.toString('base64') } }; const faultCollectionError = await safeRetainF1Formal(fixture, 'L04_OLD_BLOB_FAULT_PRE', facts); collectionError ??= faultCollectionError; const result = await inScope('builder', () => builderFor(fixture, 'r216-old-blob').construct({ prepared_receipt: different.receipt, prepared_bytes: different.bytes })); facts = { ...facts, fault_product_result: result ?? null }; const resultCollectionError = await safeRetainF1Formal(fixture, 'L04_OLD_BLOB_RESULT', facts); collectionError ??= resultCollectionError; return { expected_tip, different, result }; }); facts = { ...facts, action_error: observed.action_error, children: nativeChildFacts(observed.events), outcome: observed.value ?? null }; const outcomeCollectionError = await safeRetainF1Formal(fixture, 'L04_OLD_BLOB_OUTCOME', facts); collectionError ??= outcomeCollectionError; assert.equal(observed.action_error, null, 'old blob operation error is retained before assertions'); assertNoForbiddenConstructionEffects(fixture, 'L04_OLD_BLOB_FAULT_PRE', 'L04_OLD_BLOB_RESULT', 'old blob physical conflict', { stateRoot: path.join(fixture.root, 'r216-old-blob'), changeId: 'CHG-r216-conflict' }); assertNoProtectedTransport(nativeChildFacts(observed.events), 'old blob physical conflict'); assert.deepEqual(observed.value.result, { kind: 'CONFLICT', reason: 'READBACK_MISMATCH', observed_identity: null }); }
        catch (error) { primaryError = error; facts = { ...facts, primary_error: { name: error?.name ?? 'Error', message: error?.message ?? String(error), code: error?.code ?? null } }; throw error; }
        finally { const postCollectionError = await safeRetainF1Formal(fixture, 'L04_OLD_BLOB_POST', { ...facts, pre_collection_error: collectionError }); collectionError ??= postCollectionError; if (primaryError === null && collectionError !== null) assert.fail(`R220_F1_FORMAL_COLLECTION_FAILED: ${collectionError.message}`); }
      });
    });
    await l04.test('a real state-root filesystem obstacle is unavailable and never publishable', async () => {
      await withRepository(async fixture => {
        let facts = { kind: 'state-obstacle' }; let primaryError = null; let collectionError = null;
        try { collectionError = await safeRetainF1Formal(fixture, 'L04_STATE_OBSTACLE_PRE', facts); facts = { ...facts, healthy_control: await retainHealthyControl(fixture, 'L04_STATE_OBSTACLE') }; const observed = await observeNativeGitChildren(fixture.repository, async (_events, inScope) => { const blockedStateRoot = path.join(fixture.root, 'r216-file-obstacle'); await writeFile(blockedStateRoot, 'not a directory'); const append = makeAppend({ change_id: 'CHG-r216-obstacle', subject_sha: fixture.baseline_sha }); facts = { ...facts, fault_input: { blockedStateRoot, receipt: append.receipt, prepared_bytes_base64: append.bytes.toString('base64') } }; const faultCollectionError = await safeRetainF1Formal(fixture, 'L04_STATE_OBSTACLE_FAULT_PRE', facts); collectionError ??= faultCollectionError; const result = await inScope('builder', () => module.createUnpublishedLedgerEvidenceCommitBuilder({ repositoryRoot: fixture.repository, stateRoot: blockedStateRoot, gitExecutable: GIT, runtime_uid: process.getuid?.() ?? 0, runtime_gid: process.getgid?.() ?? 0 }).construct({ prepared_receipt: append.receipt, prepared_bytes: append.bytes })); facts = { ...facts, fault_product_result: result ?? null }; const resultCollectionError = await safeRetainF1Formal(fixture, 'L04_STATE_OBSTACLE_RESULT', facts); collectionError ??= resultCollectionError; return { blockedStateRoot, append, result }; }); facts = { ...facts, action_error: observed.action_error, children: nativeChildFacts(observed.events), outcome: observed.value ?? null }; const outcomeCollectionError = await safeRetainF1Formal(fixture, 'L04_STATE_OBSTACLE_OUTCOME', facts); collectionError ??= outcomeCollectionError; assert.equal(observed.action_error, null, 'state obstacle operation error is retained before assertions'); assertNoPreEffectChange(fixture, 'L04_STATE_OBSTACLE_FAULT_PRE', 'L04_STATE_OBSTACLE_RESULT', 'state obstacle'); assertNoProtectedTransport(nativeChildFacts(observed.events), 'state obstacle', { builderExpected: false }); assert.deepEqual(observed.value.result, { kind: 'UNAVAILABLE', reason: 'PROCESS_FAILED', partial_receipt: null }); }
        catch (error) { primaryError = error; facts = { ...facts, primary_error: { name: error?.name ?? 'Error', message: error?.message ?? String(error), code: error?.code ?? null } }; throw error; }
        finally { const postCollectionError = await safeRetainF1Formal(fixture, 'L04_STATE_OBSTACLE_POST', { ...facts, pre_collection_error: collectionError }); collectionError ??= postCollectionError; if (primaryError === null && collectionError !== null) assert.fail(`R220_F1_FORMAL_COLLECTION_FAILED: ${collectionError.message}`); }
      });
    });
  });

  await t.test('R216-L05: invalid closed data has zero effects and private wiring stays locally bounded', async l05 => {
    await withRepository(async fixture => {
      const append = makeAppend({ change_id: 'CHG-r216-closed', subject_sha: fixture.baseline_sha }); const builder = builderFor(fixture); assert.equal(Object.getPrototypeOf(builder), Object.prototype); assert.equal(Object.isFrozen(builder), true); assert.deepEqual(Reflect.ownKeys(builder), ['construct']); const builderDescriptor = Object.getOwnPropertyDescriptor(builder, 'construct'); assert.equal(builderDescriptor.enumerable, true); assert.equal(typeof builderDescriptor.value, 'function'); assert.equal(Object.hasOwn(builderDescriptor, 'get'), false);
      let facts = { change_id: 'CHG-r216-closed' }; let primaryError = null; let collectionError = null;
      try {
      collectionError = await safeRetainF1Formal(fixture, 'L05_PRE', facts); const beforeObserved = await observeNativeGitChildren(fixture.repository, async () => ({ head: await runProcess(GIT, ['rev-parse', 'HEAD'], { cwd: fixture.repository, env: FIXED_GIT_ENVIRONMENT }), refs: await runProcess(GIT, ['for-each-ref', '--format=%(refname) %(objectname)'], { cwd: fixture.repository, env: FIXED_GIT_ENVIRONMENT }) })); facts = { ...facts, pre_readbacks_action_error: beforeObserved.action_error, pre_readbacks_children: nativeChildFacts(beforeObserved.events), pre_readbacks: beforeObserved.value ?? null }; assert.equal(beforeObserved.action_error, null, 'L05 pre-readback error is retained before assertion'); const { head: beforeHead, refs: beforeRefs } = beforeObserved.value; assert.equal(beforeHead.code, 0); assert.equal(beforeRefs.code, 0, beforeRefs.stderr);
      const stateRoot = path.join(fixture.root, 'r216-state');
      const rebindReceipt = (preparedBytes, overrides = {}) => ({ ...append.receipt, new_byte_length: preparedBytes.length, new_bytes_sha256: sha256(preparedBytes), prepared_bytes_sha256: sha256(preparedBytes), record_offset: append.receipt.prior_byte_length, record_length: preparedBytes.length - append.receipt.prior_byte_length, ...overrides });
      const rebindTailEvent = (mutate, { recompute_event_hash = true } = {}) => { const event = JSON.parse(append.bytes.subarray(0, -1).toString('utf8')); mutate(event); if (recompute_event_hash) { const { event_hash, ...withoutHash } = event; event.event_hash = sha256(canonicalJson(withoutHash)); } const preparedBytes = Buffer.from(`${canonicalJson(event)}\n`); return { preparedBytes, receipt: rebindReceipt(preparedBytes, { event_id: event.event_id, event_hash: event.event_hash, sequence: event.sequence, idempotency_id: event.idempotency_id }) }; };
      const rebindRawTail = tail => { const preparedBytes = Buffer.from(tail); return invalidRequest(rebindReceipt(preparedBytes), preparedBytes); };
      const invalidRequest = (preparedReceipt, preparedBytes = append.bytes) => ({ prepared_receipt: preparedReceipt, prepared_bytes: preparedBytes });
      const captureInvalid = async (name, request) => {
        const phase = `L05_INVALID_${name.replace(/[^a-z0-9]+/gi, '_').toUpperCase()}`; const requestIsObject = request !== null && typeof request === 'object'; let caseFacts = { name, input_kind: request === null ? 'null' : Array.isArray(request) ? 'array' : typeof request, input_keys: requestIsObject ? Reflect.ownKeys(request).map(String).sort() : [] }; let caseError = null; let caseCollectionError = null;
        try { const descriptors = requestIsObject ? Object.getOwnPropertyDescriptors(request) : {}; const keyRecord = key => typeof key === 'symbol' ? { kind: 'symbol', description: key.description ?? null } : { kind: 'string', value: key }; const project = value => value instanceof Uint8Array ? { kind: 'bytes', byte_length: value.length, sha256: sha256(Buffer.from(value)) } : value === null || ['string', 'boolean'].includes(typeof value) || (typeof value === 'number' && Number.isFinite(value)) ? value : Array.isArray(value) ? { kind: 'array', length: value.length } : typeof value === 'object' ? { kind: 'object' } : { kind: typeof value }; const describe = descriptor => ({ enumerable: descriptor.enumerable, configurable: descriptor.configurable, writable: Object.hasOwn(descriptor, 'writable') ? descriptor.writable : null, accessor: !Object.hasOwn(descriptor, 'value'), value: Object.hasOwn(descriptor, 'value') ? project(descriptor.value) : null }); const inheritedDescriptor = key => { let prototype = requestIsObject ? Object.getPrototypeOf(request) : null; while (prototype !== null) { const descriptor = Object.getOwnPropertyDescriptor(prototype, key); if (descriptor !== undefined) return descriptor; prototype = Object.getPrototypeOf(prototype); } return null; }; const ownReceipt = descriptors.prepared_receipt?.value ?? null; const ownBytes = descriptors.prepared_bytes?.value; const receiptDescriptors = ownReceipt !== null && typeof ownReceipt === 'object' ? Object.getOwnPropertyDescriptors(ownReceipt) : null; const inheritedReceipt = Object.hasOwn(descriptors, 'prepared_receipt') ? null : inheritedDescriptor('prepared_receipt'); const inheritedBytes = Object.hasOwn(descriptors, 'prepared_bytes') ? null : inheritedDescriptor('prepared_bytes'); const inheritedReceiptValue = inheritedReceipt !== null && Object.hasOwn(inheritedReceipt, 'value') ? inheritedReceipt.value : null; const inheritedReceiptDescriptors = inheritedReceiptValue !== null && typeof inheritedReceiptValue === 'object' ? Object.getOwnPropertyDescriptors(inheritedReceiptValue) : null; caseFacts = { ...caseFacts, input_prototype_is_plain: requestIsObject ? Object.getPrototypeOf(request) === Object.prototype : false, input_descriptors: Reflect.ownKeys(descriptors).map(key => ({ key: keyRecord(key), ...describe(descriptors[key]) })), receipt_kind: ownReceipt === null ? 'null' : Array.isArray(ownReceipt) ? 'array' : typeof ownReceipt, receipt_prototype_is_plain: ownReceipt !== null && typeof ownReceipt === 'object' ? Object.getPrototypeOf(ownReceipt) === Object.prototype : null, receipt_descriptors: receiptDescriptors === null ? null : Reflect.ownKeys(receiptDescriptors).map(key => ({ key: keyRecord(key), ...describe(receiptDescriptors[key]) })), prepared_bytes_base64: ownBytes instanceof Uint8Array ? Buffer.from(ownBytes).toString('base64') : null, prepared_bytes_length: ownBytes instanceof Uint8Array ? ownBytes.length : null, inherited_prepared_receipt_descriptor: inheritedReceipt === null ? null : describe(inheritedReceipt), inherited_prepared_receipt_descriptors: inheritedReceiptDescriptors === null ? null : Reflect.ownKeys(inheritedReceiptDescriptors).map(key => ({ key: keyRecord(key), ...describe(inheritedReceiptDescriptors[key]) })), inherited_prepared_bytes_descriptor: inheritedBytes === null ? null : describe(inheritedBytes), inherited_prepared_bytes_base64: inheritedBytes !== null && Object.hasOwn(inheritedBytes, 'value') && inheritedBytes.value instanceof Uint8Array ? Buffer.from(inheritedBytes.value).toString('base64') : null, inherited_prepared_bytes_length: inheritedBytes !== null && Object.hasOwn(inheritedBytes, 'value') && inheritedBytes.value instanceof Uint8Array ? inheritedBytes.value.length : null }; caseCollectionError = await safeRetainF1Formal(fixture, `${phase}_PRE`, caseFacts); const observed = await observeNativeGitChildren(fixture.repository, async (_events, inScope) => { try { return { outcome: 'RESOLVED', value: await inScope('builder', () => builder.construct(request)) }; } catch (error) { return { outcome: 'REJECTED', error: { name: error?.name ?? 'Error', message: error?.message ?? String(error), code: error?.code ?? null } }; } }); caseFacts = { ...caseFacts, action_error: observed.action_error, children: nativeChildFacts(observed.events), outcome: observed.value ?? null }; const outcomeCollectionError = await safeRetainF1Formal(fixture, `${phase}_OUTCOME`, caseFacts); caseCollectionError ??= outcomeCollectionError; assert.equal(observed.action_error, null, `${name}: native observer error is retained before assertion`); assert.deepEqual(observed.events, [], `${name}: snapshot-invalid input starts no production child`); assert.equal(observed.value.outcome, 'REJECTED', `${name}: invalid request must reject`); assert.equal(observed.value.error.name, 'Error'); assert.equal(observed.value.error.message, 'INVALID_RECEIPT'); assertNoPreEffectChange(fixture, `${phase}_PRE`, `${phase}_OUTCOME`, name); }
        catch (error) { caseError = error; caseFacts = { ...caseFacts, primary_error: { name: error?.name ?? 'Error', message: error?.message ?? String(error), code: error?.code ?? null } }; throw error; }
        finally { const finalCollectionError = await safeRetainF1Formal(fixture, `${phase}_FINAL`, { ...caseFacts, outcome_collection_error: caseCollectionError }); caseCollectionError ??= finalCollectionError; if (caseError === null && caseCollectionError !== null) assert.fail(`R220_F1_FORMAL_COLLECTION_FAILED: ${caseCollectionError.message}`); }
      };
      for (const [name, request] of [
        ['extra receipt key', { prepared_receipt: { ...append.receipt, extra: true }, prepared_bytes: append.bytes }], ['new bytes hash', { prepared_receipt: { ...append.receipt, new_bytes_sha256: '0'.repeat(64) }, prepared_bytes: append.bytes }], ['new byte length', { prepared_receipt: { ...append.receipt, new_byte_length: append.bytes.length + 1 }, prepared_bytes: append.bytes }], ['prior byte length', { prepared_receipt: { ...append.receipt, prior_byte_length: 1 }, prepared_bytes: append.bytes }], ['record offset', { prepared_receipt: { ...append.receipt, record_offset: 1 }, prepared_bytes: append.bytes }], ['record length', { prepared_receipt: { ...append.receipt, record_length: append.receipt.record_length - 1 }, prepared_bytes: append.bytes }], ['authoritative path', { prepared_receipt: { ...append.receipt, authoritative_path: 'ledger/other.jsonl' }, prepared_bytes: append.bytes }], ['tail sequence chain', (() => { const value = rebindTailEvent(event => { event.sequence = 2; event.state_version = 1; }); return invalidRequest(value.receipt, value.preparedBytes); })()], ['tail framing', (() => { const preparedBytes = Buffer.from(append.bytes.subarray(0, -1)); return invalidRequest(rebindReceipt(preparedBytes), preparedBytes); })()],
      ]) await l05.test(`pre-effect invalid ${name}`, async () => captureInvalid(name, request));
      const receiptMatrix = [
        ['remote ref', rebindReceipt(append.bytes, { remote_ref: 'refs/heads/main' })], ['expected tip zero OID', rebindReceipt(append.bytes, { expected_tip: '0'.repeat(40) })], ['prior bytes hash', rebindReceipt(append.bytes, { prior_bytes_sha256: '1'.repeat(64) })], ['prior bytes length', rebindReceipt(append.bytes, { prior_byte_length: 1, record_offset: 1, record_length: append.bytes.length - 1 })], ['event id', rebindReceipt(append.bytes, { event_id: 'not-the-tail-event' })], ['event hash', rebindReceipt(append.bytes, { event_hash: '2'.repeat(64) })], ['idempotency id', rebindReceipt(append.bytes, { idempotency_id: 'not-the-tail-idempotency' })], ['prepared bytes hash', rebindReceipt(append.bytes, { prepared_bytes_sha256: '3'.repeat(64) })],
      ];
      for (const [name, receipt] of receiptMatrix) await l05.test(`closed receipt field ${name}`, async () => captureInvalid(`receipt ${name}`, invalidRequest(receipt)));
      const nonemptyPrefix = makeAppend({ change_id: 'CHG-r216-closed', subject_sha: fixture.baseline_sha }); const nonemptySequence = makeAppend({ change_id: 'CHG-r216-closed', expected_tip: fixture.baseline_sha, prior_bytes: nonemptyPrefix.bytes, sequence: 3, subject_sha: fixture.baseline_sha });
      const tailPredicateMatrix = [
        ['tail invalid UTF-8', rebindRawTail(Buffer.concat([Buffer.from([0xff]), append.bytes.subarray(1)]))], ['tail BOM', rebindRawTail(Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), append.bytes]))], ['tail CR', rebindRawTail(Buffer.concat([append.bytes.subarray(0, -1), Buffer.from('\r\n')]))], ['tail blank line', rebindRawTail(Buffer.concat([append.bytes, Buffer.from('\n')]))], ['tail embedded LF', rebindRawTail(Buffer.concat([append.bytes.subarray(0, 1), Buffer.from('\n'), append.bytes.subarray(1)]))], ['tail parsable noncanonical JSON', (() => { const event = JSON.parse(append.bytes.subarray(0, -1).toString('utf8')); const noncanonical = JSON.stringify(Object.fromEntries(Object.entries(event).reverse())); assert.notEqual(noncanonical, canonicalJson(event)); const preparedBytes = Buffer.from(`${noncanonical}\n`); return invalidRequest(rebindReceipt(preparedBytes), preparedBytes); })()], ['tail change id', (() => { const value = rebindTailEvent(event => { event.change_id = 'CHG-r216-other'; }); return invalidRequest(value.receipt, value.preparedBytes); })()], ['tail self-consistent wrong event hash', (() => { const value = rebindTailEvent(event => { event.event_hash = '4'.repeat(64); }, { recompute_event_hash: false }); return invalidRequest(value.receipt, value.preparedBytes); })()], ['nonempty prefix last sequence', invalidRequest(nonemptySequence.receipt, nonemptySequence.bytes)],
      ];
      for (const [name, request] of tailPredicateMatrix) await l05.test(`canonical tail predicate ${name}`, async () => captureInvalid(name, request));
      const receiptShapeMatrix = [
        ['null receipt', invalidRequest(null)], ['array receipt', invalidRequest([])], ['inherited receipt', invalidRequest(Object.create(append.receipt))], ['receipt accessor field', (() => { const receipt = { ...append.receipt }; Object.defineProperty(receipt, 'remote_ref', { enumerable: true, get: () => append.receipt.remote_ref }); return invalidRequest(receipt); })()], ['receipt nonenumerable field', (() => { const receipt = { ...append.receipt }; Object.defineProperty(receipt, 'remote_ref', { enumerable: false, value: append.receipt.remote_ref }); return invalidRequest(receipt); })()], ['receipt symbol key', invalidRequest({ ...append.receipt, [Symbol('extra')]: true })],
      ];
      for (const [name, request] of receiptShapeMatrix) await l05.test(`closed receipt shape ${name}`, async () => captureInvalid(`receipt ${name}`, request));
      for (const key of exactReceiptKeys) await l05.test(`missing receipt key ${key}`, async () => { const receipt = { ...append.receipt }; delete receipt[key]; await captureInvalid(`missing receipt key ${key}`, invalidRequest(receipt)); });
      for (const [name, request] of [
        ['null request', null], ['array request', []], ['missing prepared receipt', { prepared_bytes: append.bytes }], ['missing prepared bytes', { prepared_receipt: append.receipt }], ['extra request key', { prepared_receipt: append.receipt, prepared_bytes: append.bytes, extra: true }], ['nonenumerable request receipt', (() => { const request = { prepared_bytes: append.bytes }; Object.defineProperty(request, 'prepared_receipt', { value: append.receipt }); return request; })()], ['nonenumerable request bytes', (() => { const request = { prepared_receipt: append.receipt }; Object.defineProperty(request, 'prepared_bytes', { value: append.bytes }); return request; })()], ['invalid bytes type', { prepared_receipt: append.receipt, prepared_bytes: 'not-bytes' }],
      ]) await l05.test(`closed request shape ${name}`, async () => captureInvalid(name, request));
      const accessorRequest = { prepared_receipt: append.receipt, prepared_bytes: append.bytes }; Object.defineProperty(accessorRequest, 'prepared_bytes', { enumerable: true, get: () => append.bytes });
      const accessorReceiptRequest = { prepared_bytes: append.bytes }; Object.defineProperty(accessorReceiptRequest, 'prepared_receipt', { enumerable: true, get: () => append.receipt });
      const inheritedRequest = Object.create({ prepared_receipt: append.receipt, prepared_bytes: append.bytes });
      const hiddenRequest = { prepared_receipt: append.receipt, prepared_bytes: append.bytes }; Object.defineProperty(hiddenRequest, 'extra', { value: true }); const symbolRequest = { prepared_receipt: append.receipt, prepared_bytes: append.bytes, [Symbol('extra')]: true };
      for (const [name, request] of [['accessor request bytes', accessorRequest], ['accessor request receipt', accessorReceiptRequest], ['inherited request', inheritedRequest], ['hidden request', hiddenRequest], ['symbol request', symbolRequest]]) await l05.test(`closed request descriptor ${name}`, async () => captureInvalid(name, request));
      for (const [constructorIndex, constructor] of [
        null, [], Object.assign(Object.create(null), { repositoryRoot: fixture.repository, stateRoot: fixture.root, gitExecutable: GIT, runtime_uid: process.getuid?.() ?? 0, runtime_gid: process.getgid?.() ?? 0 }),
        { stateRoot: fixture.root, gitExecutable: GIT, runtime_uid: process.getuid?.() ?? 0, runtime_gid: process.getgid?.() ?? 0 },
        { repositoryRoot: fixture.repository, gitExecutable: GIT, runtime_uid: process.getuid?.() ?? 0, runtime_gid: process.getgid?.() ?? 0 },
        { repositoryRoot: fixture.repository, stateRoot: fixture.root, runtime_uid: process.getuid?.() ?? 0, runtime_gid: process.getgid?.() ?? 0 },
        { repositoryRoot: fixture.repository, stateRoot: fixture.root, gitExecutable: GIT, runtime_gid: process.getgid?.() ?? 0 },
        { repositoryRoot: fixture.repository, stateRoot: fixture.root, gitExecutable: GIT, runtime_uid: -1, runtime_gid: process.getgid?.() ?? 0 },
        { repositoryRoot: fixture.repository, stateRoot: fixture.root, gitExecutable: `${GIT}\n`, runtime_uid: process.getuid?.() ?? 0, runtime_gid: process.getgid?.() ?? 0 },
        { repositoryRoot: fixture.repository, stateRoot: fixture.root, gitExecutable: '/usr/bin/git', runtime_uid: process.getuid?.() ?? 0, runtime_gid: process.getgid?.() ?? 0 },
        { repositoryRoot: `${fixture.repository}\n`, stateRoot: fixture.root, gitExecutable: GIT, runtime_uid: process.getuid?.() ?? 0, runtime_gid: process.getgid?.() ?? 0 },
        { repositoryRoot: fixture.repository, stateRoot: `${fixture.root}\n`, gitExecutable: GIT, runtime_uid: process.getuid?.() ?? 0, runtime_gid: process.getgid?.() ?? 0 },
        { repositoryRoot: fixture.repository, stateRoot: fixture.root, gitExecutable: GIT, runtime_uid: process.getuid?.() ?? 0, runtime_gid: -1 },
        { repositoryRoot: fixture.repository, stateRoot: fixture.root, gitExecutable: GIT, runtime_uid: process.getuid?.() ?? 0, runtime_gid: process.getgid?.() ?? 0, extra: true },
        { repositoryRoot: fixture.repository, stateRoot: fixture.root, gitExecutable: GIT, runtime_uid: process.getuid?.() ?? 0 },
        Object.assign(Object.create({ runtime_gid: process.getgid?.() ?? 0 }), { repositoryRoot: fixture.repository, stateRoot: fixture.root, gitExecutable: GIT, runtime_uid: process.getuid?.() ?? 0 }),
        { repositoryRoot: fixture.repository, stateRoot: fixture.root, gitExecutable: GIT, runtime_uid: process.getuid?.() ?? 0, runtime_gid: process.getgid?.() ?? 0, [Symbol('extra')]: true },
        (() => { const value = { repositoryRoot: fixture.repository, stateRoot: fixture.root, gitExecutable: GIT, runtime_uid: process.getuid?.() ?? 0 }; Object.defineProperty(value, 'runtime_gid', { value: process.getgid?.() ?? 0 }); return value; })(),
        (() => { const value = { repositoryRoot: fixture.repository, stateRoot: fixture.root, gitExecutable: GIT, runtime_uid: process.getuid?.() ?? 0 }; Object.defineProperty(value, 'runtime_gid', { enumerable: true, get: () => process.getgid?.() ?? 0 }); return value; })(),
        { repositoryRoot: path.parse(fixture.repository).root, stateRoot: fixture.root, gitExecutable: GIT, runtime_uid: process.getuid?.() ?? 0, runtime_gid: process.getgid?.() ?? 0 },
        { repositoryRoot: 'relative-repository', stateRoot: fixture.root, gitExecutable: GIT, runtime_uid: process.getuid?.() ?? 0, runtime_gid: process.getgid?.() ?? 0 },
        { repositoryRoot: `${fixture.repository}/..`, stateRoot: fixture.root, gitExecutable: GIT, runtime_uid: process.getuid?.() ?? 0, runtime_gid: process.getgid?.() ?? 0 },
        { repositoryRoot: `${fixture.repository}\0`, stateRoot: fixture.root, gitExecutable: GIT, runtime_uid: process.getuid?.() ?? 0, runtime_gid: process.getgid?.() ?? 0 },
        { repositoryRoot: `${fixture.repository}\r`, stateRoot: fixture.root, gitExecutable: GIT, runtime_uid: process.getuid?.() ?? 0, runtime_gid: process.getgid?.() ?? 0 },
        { repositoryRoot: `${fixture.repository}\ud800`, stateRoot: fixture.root, gitExecutable: GIT, runtime_uid: process.getuid?.() ?? 0, runtime_gid: process.getgid?.() ?? 0 },
        { repositoryRoot: fixture.repository, stateRoot: path.parse(fixture.root).root, gitExecutable: GIT, runtime_uid: process.getuid?.() ?? 0, runtime_gid: process.getgid?.() ?? 0 },
        { repositoryRoot: fixture.repository, stateRoot: 'relative-state', gitExecutable: GIT, runtime_uid: process.getuid?.() ?? 0, runtime_gid: process.getgid?.() ?? 0 },
        { repositoryRoot: fixture.repository, stateRoot: `${fixture.root}/..`, gitExecutable: GIT, runtime_uid: process.getuid?.() ?? 0, runtime_gid: process.getgid?.() ?? 0 },
        { repositoryRoot: fixture.repository, stateRoot: `${fixture.root}\0`, gitExecutable: GIT, runtime_uid: process.getuid?.() ?? 0, runtime_gid: process.getgid?.() ?? 0 },
        { repositoryRoot: fixture.repository, stateRoot: `${fixture.root}\r`, gitExecutable: GIT, runtime_uid: process.getuid?.() ?? 0, runtime_gid: process.getgid?.() ?? 0 },
        { repositoryRoot: fixture.repository, stateRoot: `${fixture.root}\ud800`, gitExecutable: GIT, runtime_uid: process.getuid?.() ?? 0, runtime_gid: process.getgid?.() ?? 0 },
        { repositoryRoot: fixture.repository, stateRoot: fixture.root, gitExecutable: GIT, runtime_uid: 'not-an-integer', runtime_gid: process.getgid?.() ?? 0 },
        { repositoryRoot: fixture.repository, stateRoot: fixture.root, gitExecutable: GIT, runtime_uid: 1.5, runtime_gid: process.getgid?.() ?? 0 },
        { repositoryRoot: fixture.repository, stateRoot: fixture.root, gitExecutable: GIT, runtime_uid: Number.MAX_SAFE_INTEGER + 1, runtime_gid: process.getgid?.() ?? 0 },
        { repositoryRoot: fixture.repository, stateRoot: fixture.root, gitExecutable: GIT, runtime_uid: process.getuid?.() ?? 0, runtime_gid: 'not-an-integer' },
        { repositoryRoot: fixture.repository, stateRoot: fixture.root, gitExecutable: GIT, runtime_uid: process.getuid?.() ?? 0, runtime_gid: 1.5 },
        { repositoryRoot: fixture.repository, stateRoot: fixture.root, gitExecutable: GIT, runtime_uid: process.getuid?.() ?? 0, runtime_gid: Number.MAX_SAFE_INTEGER + 1 },
        ...((process.getuid?.() ?? 0) === 0 ? [] : [
          { repositoryRoot: fixture.repository, stateRoot: fixture.root, gitExecutable: GIT, runtime_uid: (process.getuid?.() ?? 0) + 1, runtime_gid: process.getgid?.() ?? 0 },
          { repositoryRoot: fixture.repository, stateRoot: fixture.root, gitExecutable: GIT, runtime_uid: process.getuid?.() ?? 0, runtime_gid: (process.getgid?.() ?? 0) + 1 },
        ]),
      ].entries()) await l05.test(`closed constructor ${constructorIndex}`, async () => { const phase = `L05_INVALID_CONSTRUCTOR_${constructorIndex}`; const constructorIsObject = constructor !== null && typeof constructor === 'object'; const descriptors = constructorIsObject ? Object.getOwnPropertyDescriptors(constructor) : {}; const keyRecord = key => typeof key === 'symbol' ? { kind: 'symbol', description: key.description ?? null } : { kind: 'string', value: key }; const project = value => value === null || ['string', 'boolean'].includes(typeof value) || (typeof value === 'number' && Number.isFinite(value)) ? value : typeof value === 'object' ? { kind: 'object' } : { kind: typeof value }; const describe = descriptor => ({ enumerable: descriptor.enumerable, configurable: descriptor.configurable, writable: Object.hasOwn(descriptor, 'writable') ? descriptor.writable : null, accessor: !Object.hasOwn(descriptor, 'value'), value: Object.hasOwn(descriptor, 'value') ? project(descriptor.value) : null }); let constructorFacts = { input_kind: constructor === null ? 'null' : Array.isArray(constructor) ? 'array' : typeof constructor, input_descriptors: Reflect.ownKeys(descriptors).map(key => ({ key: keyRecord(key), ...describe(descriptors[key]) })), prototype_is_plain: constructorIsObject ? Object.getPrototypeOf(constructor) === Object.prototype : false }; let constructorError = null; let constructorCollectionError = await safeRetainF1Formal(fixture, `${phase}_PRE`, constructorFacts); try { const observedConstructor = await observeNativeGitChildren(fixture.repository, async () => { try { const factory = module.createUnpublishedLedgerEvidenceCommitBuilder(constructor); return { kind: 'RETURNED', factory_shape: { prototype_is_plain: Object.getPrototypeOf(factory) === Object.prototype, frozen: Object.isFrozen(factory), keys: Reflect.ownKeys(factory).map(keyRecord), construct_type: typeof Object.getOwnPropertyDescriptor(factory, 'construct')?.value } }; } catch (error) { return { kind: 'THREW', error: { name: error?.name ?? 'Error', message: error?.message ?? String(error), code: error?.code ?? null } }; } }); const actualOutcome = observedConstructor.value; constructorFacts = { ...constructorFacts, observer_error: observedConstructor.action_error, children: nativeChildFacts(observedConstructor.events), actual_outcome: actualOutcome }; const outcomeCollectionError = await safeRetainF1Formal(fixture, `${phase}_OUTCOME`, constructorFacts); constructorCollectionError ??= outcomeCollectionError; assert.equal(observedConstructor.action_error, null); assert.deepEqual(observedConstructor.events, [], `${phase}: invalid constructor starts no child`); assert.equal(actualOutcome.kind, 'THREW'); assert.equal(actualOutcome.error.name, 'Error'); assert.equal(actualOutcome.error.message, 'INPUT_INVALID'); assertNoPreEffectChange(fixture, `${phase}_PRE`, `${phase}_OUTCOME`, phase); } catch (error) { constructorError = error; constructorFacts = { ...constructorFacts, primary_error: { name: error?.name ?? 'Error', message: error?.message ?? String(error), code: error?.code ?? null } }; throw error; } finally { const finalCollectionError = await safeRetainF1Formal(fixture, `${phase}_FINAL`, { ...constructorFacts, outcome_collection_error: constructorCollectionError }); constructorCollectionError ??= finalCollectionError; if (constructorError === null && constructorCollectionError !== null) assert.fail(`R220_F1_FORMAL_COLLECTION_FAILED: ${constructorCollectionError.message}`); } });
      const afterObserved = await observeNativeGitChildren(fixture.repository, async () => ({ head: await runProcess(GIT, ['rev-parse', 'HEAD'], { cwd: fixture.repository, env: FIXED_GIT_ENVIRONMENT }), refs: await runProcess(GIT, ['for-each-ref', '--format=%(refname) %(objectname)'], { cwd: fixture.repository, env: FIXED_GIT_ENVIRONMENT }) })); facts = { ...facts, post_readbacks_action_error: afterObserved.action_error, post_readbacks_children: nativeChildFacts(afterObserved.events), post_readbacks: afterObserved.value ?? null }; assert.equal(afterObserved.action_error, null, 'L05 post-readback error is retained before assertion'); const { head: afterHead, refs: afterRefs } = afterObserved.value; assert.equal(afterHead.code, 0); assert.equal(afterRefs.code, 0); assert.equal(afterHead.stdout, beforeHead.stdout, 'closed request failure changes neither local ref nor remote authority'); assert.equal(afterRefs.stdout, beforeRefs.stdout, 'closed request failure creates no ref'); assert.equal(await exists(stateRoot), false, 'pre-effect receipt rejection creates no derived work/index directory');
      await l05.test('caller mutation cannot alter the entry byte snapshot', async () => {
        let mutationFacts = { ...facts }; let mutationError = null; let mutationCollectionError = null;
        try {
          const mutableReceipt = { ...append.receipt }; const mutableBytes = new Uint8Array(append.bytes); mutationFacts = { ...mutationFacts, mutation_input: { receipt: structuredClone(mutableReceipt), prepared_bytes_base64: Buffer.from(mutableBytes).toString('base64') } }; facts = mutationFacts; mutationCollectionError = await safeRetainF1Formal(fixture, 'L05_MUTATION_PRE', mutationFacts); collectionError ??= mutationCollectionError;
          const observedMutation = await observeNativeGitChildren(fixture.repository, async (_events, inScope) => { const pending = inScope('builder', () => builder.construct({ prepared_receipt: mutableReceipt, prepared_bytes: mutableBytes })); mutableReceipt.new_bytes_sha256 = '0'.repeat(64); mutableReceipt.authoritative_path = 'ledger/CHG-mutated.jsonl'; mutableBytes.fill(0); const result = await pending; mutationFacts = { ...mutationFacts, mutation_product_result: result ?? null }; facts = mutationFacts; const mutationResultCollectionError = await safeRetainF1Formal(fixture, 'L05_MUTATION_RESULT', mutationFacts); mutationCollectionError ??= mutationResultCollectionError; collectionError ??= mutationResultCollectionError; const physicalBlob = await captureRawGit(fixture.repository, ['cat-file', 'blob', result?.value?.ledger_blob_sha ?? '']); return { result, physicalBlob }; }); const { result, physicalBlob } = observedMutation.value ?? {}; mutationFacts = { ...mutationFacts, before_head_base64: beforeHead.stdout.toString('base64'), before_refs_base64: beforeRefs.stdout.toString('base64'), mutation_action_error: observedMutation.action_error, mutation_children: nativeChildFacts(observedMutation.events), result: result ?? null, mutation_blob: physicalBlob ?? null }; facts = mutationFacts; const mutationOutcomeError = await safeRetainF1Formal(fixture, 'L05_MUTATION_OUTCOME', mutationFacts); mutationCollectionError ??= mutationOutcomeError; collectionError ??= mutationOutcomeError; assert.equal(observedMutation.action_error, null, 'mutable caller operation error is retained before assertion'); assert.equal(result.kind, 'OK', 'post-entry caller mutation cannot change snapshots used by the builder'); assertSuccessfulRawGit(physicalBlob, 'mutable caller physical blob'); assert.deepEqual(physicalBlob.stdout, append.bytes, 'the actual produced blob binds the entry snapshot, not the caller-mutated bytes'); assert.equal(result.value.authoritative_path, append.receipt.authoritative_path); assert.equal(result.value.ledger_bytes_sha256, sha256(append.bytes)); assert.equal(result.value.ledger_byte_length, append.bytes.length); assert.equal(result.receipt_sha256, sha256(canonicalJson(result.value))); assertNoForbiddenConstructionEffects(fixture, 'L05_MUTATION_PRE', 'L05_MUTATION_RESULT', 'caller mutation', { stateRoot, changeId: 'CHG-r216-closed' }); assertNoProtectedTransport(nativeChildFacts(observedMutation.events), 'caller mutation');
        } catch (error) { mutationError = error; mutationFacts = { ...mutationFacts, primary_error: { name: error?.name ?? 'Error', message: error?.message ?? String(error), code: error?.code ?? null } }; facts = mutationFacts; throw error; }
        finally { const mutationFinalError = await safeRetainF1Formal(fixture, 'L05_MUTATION_FINAL', { ...mutationFacts, outcome_collection_error: mutationCollectionError }); mutationCollectionError ??= mutationFinalError; collectionError ??= mutationFinalError; if (mutationError === null && mutationCollectionError !== null) assert.fail(`R220_F1_FORMAL_COLLECTION_FAILED: ${mutationCollectionError.message}`); }
      });
      } catch (error) { primaryError = error; facts = { ...facts, primary_error: { name: error?.name ?? 'Error', message: error?.message ?? String(error), code: error?.code ?? null } }; throw error; }
      finally { const postCollectionError = await safeRetainF1Formal(fixture, 'L05_POST', { ...facts, pre_collection_error: collectionError }); collectionError ??= postCollectionError; if (primaryError === null && collectionError !== null) assert.fail(`R220_F1_FORMAL_COLLECTION_FAILED: ${collectionError.message}`); }
    });
  });
});
// R219_F1_END
const fixedRawDiffArgv = (baseline, candidate) => ['--no-pager', '-c', 'color.ui=false', '-c', 'core.quotePath=true', '-c', 'diff.algorithm=myers', '-c', 'diff.mnemonicPrefix=false', '-c', 'diff.noprefix=false', 'diff', '--binary', '--full-index', '--no-ext-diff', '--no-textconv', '--no-renames', '--src-prefix=a/', '--dst-prefix=b/', `${baseline}..${candidate}`, '--'];
const fixedPathDiffArgv = (baseline, candidate) => ['--no-pager', '-c', 'color.ui=false', '-c', 'core.quotePath=true', '-c', 'diff.algorithm=myers', '-c', 'diff.mnemonicPrefix=false', '-c', 'diff.noprefix=false', 'diff', '--name-status', '-z', '--no-ext-diff', '--no-textconv', '--no-renames', `${baseline}..${candidate}`, '--'];
const canonicalDiffReceiptPreimage = value => ({
  producer_receipt: value.producer_receipt,
  raw_stdout: Buffer.from(value.raw_stdout).toString('base64'),
  byte_length: value.byte_length,
  stdout_sha256: value.stdout_sha256,
  path_raw_stdout: Buffer.from(value.path_raw_stdout).toString('base64'),
  path_byte_length: value.path_byte_length,
  changed_paths: value.changed_paths,
});
const canonicalDiffOk = value => ({ kind: 'OK', value, receipt_sha256: sha256(canonicalJson(canonicalDiffReceiptPreimage(value))) });
const expectedCanonicalDiffV2Frontier = envelope => {
  if (!envelope || envelope.kind !== 'OK' || !envelope.value || Object.getPrototypeOf(envelope.value) !== Object.prototype) return null;
  const descriptors = Object.getOwnPropertyDescriptors(envelope.value);
  if (!Object.values(descriptors).every(descriptor => Object.hasOwn(descriptor, 'value')) || !Buffer.isBuffer(descriptors.raw_stdout?.value)) return null;
  return JSON.stringify(Object.keys(descriptors).sort()) === JSON.stringify(LEGACY_CANONICAL_DIFF_KEYS) ? 'the exact legacy five-field result is present but path_raw_stdout/path_byte_length are absent' : null;
};
const assertHealthyCanonicalDiffV2 = envelope => {
  assert.equal(envelope?.kind, 'OK', 'the producer reaches a successful Gateway envelope before any Test mutation');
  assert.deepEqual(Object.keys(envelope).sort(), ['kind', 'receipt_sha256', 'value'], 'the healthy Gateway result itself is a closed three-field envelope');
  assert.deepEqual(Object.keys(envelope.value).sort(), CANONICAL_DIFF_V2_KEYS, 'the producer reaches the exact closed seven-field V2 envelope before any Test mutation');
  assert.ok(Buffer.isBuffer(envelope.value.raw_stdout), 'the healthy raw producer value is an exact Buffer');
  assert.ok(Buffer.isBuffer(envelope.value.path_raw_stdout), 'the healthy path producer value is an exact Buffer');
  assert.equal(envelope.value.byte_length, envelope.value.raw_stdout.length);
  assert.equal(envelope.value.path_byte_length, envelope.value.path_raw_stdout.length);
  assert.equal(envelope.value.stdout_sha256, sha256(envelope.value.raw_stdout));
  assert.equal(envelope.value.producer_receipt.path_stdout_sha256, sha256(envelope.value.path_raw_stdout));
  assert.equal(envelope.receipt_sha256, sha256(canonicalJson(canonicalDiffReceiptPreimage(envelope.value))), 'the healthy wrapper receipt is independently valid before a targeted inner mutation');
};
const withCanonicalPathBytes = (value, path_raw_stdout) => {
  const bytes = Buffer.from(path_raw_stdout);
  return {
    ...value,
    path_raw_stdout: bytes,
    path_byte_length: bytes.length,
    producer_receipt: { ...value.producer_receipt, path_stdout_sha256: sha256(bytes) },
  };
};
const absent = expected_identity => ({ kind: 'ABSENT', reason: 'EXPECTED_IDENTITY_ABSENT', expected_identity });
const exists = async target => lstat(target).then(() => true, error => {
  if (error?.code === 'ENOENT') return false;
  throw error;
});

async function withObservedRealSpawns(action, { onSpawn = null, onChild = null } = {}) {
  const delegatedSpawn = childProcess.spawn;
  const observations = [];
  childProcess.spawn = function observedSpawn(executable, argv = [], options = {}) {
    const observation = { executable, argv: [...argv], cwd: options.cwd ?? null, environment: structuredClone(options.env ?? {}), shell: options.shell ?? false, stdin_chunks: [] };
    observations.push(observation);
    onSpawn?.(observation);
    const child = delegatedSpawn.call(this, executable, argv, options);
    observation.pid = child.pid;
    child.once('close', (code, signal) => { observation.close = { code, signal }; });
    onChild?.(observation, child);
    if (child.stdin) {
      const delegatedWrite = child.stdin.write.bind(child.stdin);
      const delegatedEnd = child.stdin.end.bind(child.stdin);
      child.stdin.write = (chunk, ...rest) => { if (chunk !== undefined) observation.stdin_chunks.push(Buffer.from(chunk)); return delegatedWrite(chunk, ...rest); };
      child.stdin.end = (chunk, ...rest) => { if (chunk !== undefined && chunk !== null) observation.stdin_chunks.push(Buffer.from(chunk)); return delegatedEnd(chunk, ...rest); };
    }
    return child;
  };
  syncBuiltinESMExports();
  try {
    return await action(observations);
  } finally {
    childProcess.spawn = delegatedSpawn;
    syncBuiltinESMExports();
  }
}

async function withControlledCanonicalPathOutput(rawPathBytes, action) {
  const delegatedSpawn = childProcess.spawn;
  let pathInvocations = 0;
  childProcess.spawn = function controlledCanonicalPathSpawn(executable, argv = [], options = {}) {
    if (executable === GIT && argv.includes('--name-status') && argv.includes('-z') && argv.includes('--no-renames')) {
      pathInvocations += 1;
      return delegatedSpawn.call(this, NODE, ['-e', 'process.stdout.write(Buffer.from(process.argv[1], "base64"))', Buffer.from(rawPathBytes).toString('base64')], options);
    }
    return delegatedSpawn.call(this, executable, argv, options);
  };
  syncBuiltinESMExports();
  try {
    return await action(() => pathInvocations);
  } finally {
    childProcess.spawn = delegatedSpawn;
    syncBuiltinESMExports();
  }
}
const definitions = root => [
  { id: 'regression-affected-suite', argv: [NODE, '--test'], cwd: root, environment: {}, timeout_ms: 10_000, subject: 'WORKTREE' },
  { id: 'regression-test-asset-retirement', argv: [NODE, '--test'], cwd: root, environment: {}, timeout_ms: 10_000, subject: 'WORKTREE' },
  { id: 'final-validation-candidate', argv: [NODE, '--test'], cwd: root, environment: {}, timeout_ms: 10_000, subject: 'CANDIDATE' },
];

function parseNameStatusZ(raw) {
  const fields = raw.split('\0');
  assert.equal(fields.at(-1), '', 'name-status -z output must end with exactly one NUL');
  const pairs = fields.slice(0, -1);
  assert.equal(pairs.length % 2, 0, 'name-status -z returns separate status and path NUL fields');
  return Array.from({ length: pairs.length / 2 }, (_, index) => {
    const status = pairs[index * 2]; const path = pairs[index * 2 + 1];
    assert.ok(['A', 'M', 'D', 'T'].includes(status), `only closed name-status codes are admissible: ${status}`);
    assert.ok(path.length > 0, 'each name-status path field is nonempty');
    return { status, path };
  });
}

async function independentlyDeriveDeliveryIdentity(command, state, coreWorktree) {
  const baseline = state.repository.baseline_sha;
  const candidate = state.candidate.sha;
  const raw = await runProcess(GIT, fixedRawDiffArgv(baseline, candidate), { cwd: coreWorktree, env: FIXED_GIT_ENVIRONMENT });
  const paths = await runProcess(GIT, fixedPathDiffArgv(baseline, candidate), { cwd: coreWorktree, env: FIXED_GIT_ENVIRONMENT });
  assert.equal(raw.code, 0, raw.stderr); assert.equal(paths.code, 0, paths.stderr);
  const changed_paths = parseNameStatusZ(paths.stdout).map(entry => entry.path).sort((left, right) => Buffer.compare(Buffer.from(left), Buffer.from(right)));
  const preimage = {
    schema_version: '1.0', change_id: command.change_id, authorization_cycle_command_id: state.authorization_cycle.command_id,
    baseline_sha: baseline, candidate_sha: candidate, candidate_tree: state.candidate.tree, branch: state.repository.branch,
    remote_head: state.delivery.remote_head, canonical_diff_sha256: sha256(raw.stdout), changed_paths,
  };
  return { raw_stdout: Buffer.from(raw.stdout), path_raw_stdout: Buffer.from(paths.stdout), changed_paths, preimage, delivery_id: `delivery-${sha256(canonicalJson(preimage))}` };
}

async function cloneTestLedgerWithoutEvent({ root, changeId, records, omittedEventId }) {
  await mkdir(root, { recursive: true });
  const readbacks = [];
  const ledger = await createLocalBareLedger(root, changeId, readbacks);
  for (const record of records) {
    if (record.event_id === omittedEventId) continue;
    await appendTestLedgerEvent(ledger, {
      change_id: changeId,
      event_class: record.event_class,
      detail: record.detail,
      state_version: record.state_version,
      subject_sha: record.subject_sha,
      idempotency_id: record.idempotency_id,
      occurred_at: record.occurred_at,
      event_id: record.event_id,
    });
  }
  const remote = await readLocalLedger(ledger, changeId);
  const decoded = decodeRemoteLedger(remote);
  assert.equal(decoded.records.some(record => record.event_id === omittedEventId), false, 'the isolated alternate source omits only the selected physical event identity');
  assert.equal(readbacks.length, decoded.records.length);
  for (let index = 0; index < readbacks.length; index += 1) {
    assertExactLedgerReadback(readbacks[index], decoded.records[index], decoded.bytes);
  }
  return { ledger, readbacks, remote, decoded };
}

function ledgerPrepareEvent(request) {
  try {
    const bytes = Buffer.from(request?.event_bytes ?? []);
    return bytes.length > 1 && bytes.at(-1) === 0x0a ? JSON.parse(bytes.subarray(0, -1).toString('utf8')) : null;
  } catch { return null; }
}

function fullCoreRestartProgram() {
  const adaptersUrl = new URL('./adapters.mjs', import.meta.url).href;
  const coordinatorUrl = new URL('./coordinator.mjs', import.meta.url).href;
  const productionUrl = new URL('./production.mjs', import.meta.url).href;
  const fixturesUrl = new URL('./fixtures.mjs', import.meta.url).href;
  return `
import assert from 'node:assert/strict';
import childProcess from 'node:child_process';
import { createHash } from 'node:crypto';
import { appendFileSync, writeFileSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { syncBuiltinESMExports } from 'node:module';
import path from 'node:path';
import { createCoordinatorAdapters } from ${JSON.stringify(adaptersUrl)};
import { createCoordinatorCore } from ${JSON.stringify(coordinatorUrl)};
import * as production from ${JSON.stringify(productionUrl)};
import { canonicalJson, run as runProcess } from ${JSON.stringify(fixturesUrl)};
const GIT = ${JSON.stringify(GIT)};
const sha256 = value => createHash('sha256').update(value).digest('hex');
const ok = value => ({ kind: 'OK', value, receipt_sha256: sha256(canonicalJson(value)) });
const wrapCandidateStageValueForCore = ${wrapCandidateStageValueForCore.toString()};
${createLocalBareLedger.toString()}
const config = JSON.parse(Buffer.from(process.argv[1], 'base64').toString('utf8'));
const observe = (event, detail = {}) => {
  if (!config.observationPath) return;
  try { appendFileSync(config.observationPath, canonicalJson({ observed_at: new Date().toISOString(), event, ...detail }) + '\\n'); } catch (error) {
    try { process.stderr.write(canonicalJson({ observation_write_failed: true, event, code: error?.code ?? null, message: error?.message ?? null }) + '\\n'); } catch {}
  }
};
const resultKind = value => typeof value?.kind === 'string' ? value.kind
  : typeof value?.outcome === 'string' ? value.outcome
  : typeof value?.state === 'string' ? value.state
  : value === null ? 'null' : Array.isArray(value) ? 'array' : typeof value;
const observeOperation = async (boundary, method, operation) => {
  if (!config.observationPath) return operation();
  observe('CALL_ENTER', { boundary, method });
  try {
    const result = await operation();
    observe('CALL_RETURN', { boundary, method, result_kind: resultKind(result) });
    return result;
  } catch (error) {
    observe('CALL_THROW', { boundary, method, code: error?.code ?? null, message: error?.message ?? null });
    throw error;
  }
};
const calls = [];
const retainLedgerReadback = result => {
  if (!config.ledgerSnapshotPath) return;
  const value = result?.value;
  if (typeof value?.ledger_bytes_base64 !== 'string') {
    observe('LEDGER_SNAPSHOT_NOT_REACHED', { result_kind: resultKind(result) });
    return;
  }
  try {
    const ledgerBytes = Buffer.from(value.ledger_bytes_base64, 'base64');
    writeFileSync(config.ledgerSnapshotPath, canonicalJson({
      kind: result.kind, receipt_sha256: result.receipt_sha256, remote_ref: value.remote_ref,
      tip: value.tip, tip_tree: value.tip_tree, prior_byte_length: value.prior_byte_length,
      prior_bytes_sha256: value.prior_bytes_sha256, ledger_bytes_base64: value.ledger_bytes_base64,
      observed_byte_length: ledgerBytes.length, observed_bytes_sha256: sha256(ledgerBytes),
    }));
    observe('LEDGER_SNAPSHOT_RETURN', { tip: value.tip, tip_tree: value.tip_tree, byte_length: ledgerBytes.length, sha256: sha256(ledgerBytes) });
  } catch (error) {
    observe('LEDGER_SNAPSHOT_THROW', { code: error?.code ?? null, message: error?.message ?? null });
  }
};
const record = (boundary, method, operation) => async request => {
  calls.push({ boundary, method });
  if (!config.observationPath) return operation(request);
  const result = await observeOperation(boundary, method, () => operation(request));
  if (boundary === 'ledger' && method === 'readRemote') retainLedgerReadback(result);
  return result;
};
if (config.mode === 'ledger-health') {
  const resumed = config.observationPath ? await observeOperation('ledger', 'createLocalBareLedger', () => createLocalBareLedger(config.fixtureRoot, config.changeId, [], { resume: true })) : await createLocalBareLedger(config.fixtureRoot, config.changeId, [], { resume: true });
  const remote = config.observationPath ? await observeOperation('ledger', 'readRemote', () => resumed.readRemote({ remote_ref: 'refs/heads/evidence/agent-runs', expected_tip: null, change_id: config.changeId })) : await resumed.readRemote({ remote_ref: 'refs/heads/evidence/agent-runs', expected_tip: null, change_id: config.changeId });
  await new Promise(resolve => process.stdout.write(canonicalJson(remote), resolve));
  process.exit(0);
}
if (config.mode === 'stage-and-pause') {
  const delegatedSpawn = childProcess.spawn;
  let intercepted = false;
  childProcess.spawn = function stageBoundarySpawn(executable, argv = [], options = {}) {
    observe('SPAWN_ENTER', { executable, argv, cwd: options.cwd ?? null });
    const child = delegatedSpawn.call(this, executable, argv, options);
    observe('SPAWN_RETURN', { executable, argv, pid: child.pid ?? null });
    child.once('error', error => observe('CHILD_ERROR', { executable, argv, pid: child.pid ?? null, code: error?.code ?? null, message: error?.message ?? null }));
    child.once('exit', (code, signal) => observe('CHILD_EXIT', { executable, argv, pid: child.pid ?? null, code, signal }));
    child.once('close', (code, signal) => observe('CHILD_CLOSE', { executable, argv, pid: child.pid ?? null, code, signal }));
    appendFileSync(config.spawnAuditPath, canonicalJson({ executable, argv, cwd: options.cwd ?? null, pid: child.pid }) + '\\n');
    if (!intercepted && executable === GIT && argv.includes('--pathspec-file-nul')) {
      intercepted = true;
      const delegatedOnce = child.once.bind(child);
      child.once = function boundaryOnce(event, listener) {
        if (event !== 'close') return delegatedOnce(event, listener);
        return delegatedOnce('close', (code, signal) => {
          observe('MARKER_WRITE_ENTER', { core_pid: process.pid, stage_child_pid: child.pid, stage_close: { code, signal } });
          try {
            writeFileSync(config.markerPath, canonicalJson({ core_pid: process.pid, stage_child_pid: child.pid, stage_close: { code, signal } }));
            observe('MARKER_WRITE_RETURN', { core_pid: process.pid, stage_child_pid: child.pid });
          } catch (error) {
            observe('MARKER_WRITE_THROW', { core_pid: process.pid, stage_child_pid: child.pid, code: error?.code ?? null, message: error?.message ?? null });
            throw error;
          }
          setInterval(() => {}, 1000);
        });
      };
    }
    return child;
  };
  syncBuiltinESMExports();
}
const base = config.observationPath ? await observeOperation('adapters', 'createCoordinatorAdapters', () => createCoordinatorAdapters({ repository_root: config.repositoryRoot, state_root: config.stateRoot, device: 'mac-mini', process_run_id: config.processRunId, git_executable: GIT, pull_request_executable: '/usr/bin/false', base_environment: {} })) : createCoordinatorAdapters({ repository_root: config.repositoryRoot, state_root: config.stateRoot, device: 'mac-mini', process_run_id: config.processRunId, git_executable: GIT, pull_request_executable: '/usr/bin/false', base_environment: {} });
const resumedLedgerSource = config.observationPath ? await observeOperation('ledger', 'createLocalBareLedger', () => createLocalBareLedger(config.fixtureRoot, config.changeId, [], { resume: true })) : await createLocalBareLedger(config.fixtureRoot, config.changeId, [], { resume: true });
const candidateStage = production.createCandidateStageGateway({ gitExecutable: GIT });
const git = Object.freeze({
  ...base.git,
  inspectWorktree: record('git', 'inspectWorktree', request => base.git.inspectWorktree(request)),
  stageExact: record('git', 'stageExact', async request => wrapCandidateStageValueForCore(await candidateStage.stageExact(request))),
  readStaged: record('git', 'readStaged', async request => wrapCandidateStageValueForCore(await candidateStage.readStaged(request))),
  commitCandidate: record('git', 'commitCandidate', request => base.git.commitCandidate(request)),
  readCommit: record('git', 'readCommit', request => base.git.readCommit(request)),
  pushBranch: record('git', 'pushBranch', request => base.git.pushBranch(request)),
  readRemoteBranch: record('git', 'readRemoteBranch', request => base.git.readRemoteBranch(request)),
  canonicalDiff: record('git', 'canonicalDiff', request => base.git.canonicalDiff(request)),
});
const ledger = Object.freeze(Object.fromEntries(Object.entries(resumedLedgerSource).map(([method, operation]) => [method, record('ledger', method, operation)])));
const pull_request = Object.freeze(Object.fromEntries(Object.entries(base.pull_request).map(([method, operation]) => [method, record('pull_request', method, operation)])));
const handoff = Object.freeze({ writeReadback: record('handoff', 'writeReadback', request => base.handoff.writeReadback(request)) });
const filePauseState = config.useFileLocalPause ? Object.freeze({
  ...base.state,
  async readLocalPause() {
    const localPausePath = path.join(config.stateRoot, 'local-pause.json');
    try {
      const pauseBytes = await readFile(localPausePath, 'utf8');
      return ok({ bytes: pauseBytes, sha256: sha256(pauseBytes) });
    } catch (error) {
      if (error?.code === 'ENOENT') return { kind: 'ABSENT', reason: 'EXPECTED_IDENTITY_ABSENT', expected_identity: localPausePath };
      return { kind: 'UNAVAILABLE', reason: 'UNAVAILABLE', partial_receipt: null };
    }
  },
  async writeLocalPause(request) {
    const localPausePath = path.join(config.stateRoot, 'local-pause.json');
    assert.deepEqual(Object.keys(request).sort(), ['expected_sha256', 'next_bytes']);
    let priorBytes;
    try {
      priorBytes = await readFile(localPausePath, 'utf8');
    } catch (error) {
      if (error?.code === 'ENOENT') priorBytes = null;
      else return { kind: 'UNAVAILABLE', reason: 'UNAVAILABLE', partial_receipt: null };
    }
    const priorSha = priorBytes === null ? null : sha256(priorBytes);
    if (request.expected_sha256 !== priorSha) return { kind: 'CONFLICT', reason: 'CAS_CONFLICT', observed_identity: priorSha };
    assert.equal(typeof request.next_bytes, 'string');
    try { await writeFile(localPausePath, request.next_bytes); } catch { return { kind: 'UNAVAILABLE', reason: 'UNAVAILABLE', partial_receipt: null }; }
    return ok({ bytes: request.next_bytes, sha256: sha256(request.next_bytes) });
  },
}) : base.state;
const dependencies = { ...base, state: filePauseState, git, ledger, pull_request, handoff, validation: production.createValidationGateway({ nodeExecutable: process.execPath }), clock: { now: () => '2026-09-06T00:00:30.000Z' }, verifier: { async verify(request) { const body = JSON.parse(Buffer.from(request.command_body_bytes).toString('utf8')); return { kind: 'VERIFIED', body, verified_key_id: body.key_id, body_sha256: sha256(request.command_body_bytes), signature_sha256: sha256(request.signature_bytes) }; } } };
const stateReadback = config.observationPath ? await observeOperation('state', 'readState', () => base.state.readState({ change_id: config.changeId })) : await base.state.readState({ change_id: config.changeId });
assert.equal(stateReadback.kind, 'OK');
const state = JSON.parse(stateReadback.value.bytes);
const core = config.observationPath ? await observeOperation('core', 'createCoordinatorCore', () => createCoordinatorCore(dependencies)) : createCoordinatorCore(dependencies);
observe('CORE_RUN_ENTER', { core_pid: process.pid, state_sha256: stateReadback.value.sha256 });
try {
  const result = await core.run({ change_id: config.changeId, expected_state_version: state.state_version, expected_state_hash: stateReadback.value.sha256 });
  observe('CORE_RUN_RETURN', { core_pid: process.pid, outcome: result?.outcome ?? null, state: result?.state ?? null });
  process.stdout.write(canonicalJson({ calls, result }));
} catch (error) {
  observe('CORE_RUN_THROW', { core_pid: process.pid, code: error?.code ?? null, message: error?.message ?? null });
  throw error;
}
`;
}

const encodeCoreRestartConfig = config => Buffer.from(canonicalJson(config)).toString('base64');

async function waitForTestFile(target, timeoutMs = 5_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await exists(target)) return;
    await new Promise(resolve => setTimeout(resolve, 10));
  }
  throw new Error(`timed out waiting for Test-owned marker: ${target}`);
}

async function createObservedB5Core(fixture, process_run_id, controls = {}) {
  const fixtureRoot = path.dirname(fixture.repository);
  const stateRoot = path.join(fixtureRoot, `${process_run_id}-state`);
  const coreWorktree = path.join(fixtureRoot, `${process_run_id}-worktree`);
  await mkdir(stateRoot, { recursive: true });
  await writeFile(path.join(stateRoot, 'active-change.json'), canonicalJson({ schema_version: '1.0', active_change_id: null }));
  const base = createCoordinatorAdapters({ repository_root: fixture.repository, state_root: stateRoot, device: 'mac-mini', process_run_id, git_executable: GIT, pull_request_executable: '/usr/bin/false', base_environment: {} });
  const command = makeDispatch({
    issued_at: '2026-09-06T00:00:00.000Z', expires_at: '2026-09-06T00:01:00.000Z',
    repository: { repository_id: 'gadfly-hbo/JuanerAI', canonical_root: fixture.repository, origin: 'origin', integration_branch: 'main' },
    worktree: { branch: 'work/mac-mini/m2-b5-observe', root: coreWorktree, baseline_sha: fixture.baseline_sha },
    scope: { allowed_paths: ['tracked.txt'], forbidden_paths: [] },
  });
  command.payload.validations = [
    { id: 'regression-test-asset-retirement', argv: [NODE, '-e', 'process.stdout.write("retirement-regression\\n")'], cwd: coreWorktree, environment: {}, timeout_ms: 10_000, subject: 'WORKTREE' },
    { id: 'final-validation-candidate', argv: [NODE, '-e', 'process.stdout.write("candidate-final\\n")'], cwd: coreWorktree, environment: {}, timeout_ms: 10_000, subject: 'CANDIDATE' },
    { id: 'regression-affected-suite', argv: [NODE, '-e', 'process.stdout.write("affected-regression\\n")'], cwd: coreWorktree, environment: {}, timeout_ms: 10_000, subject: 'WORKTREE' },
  ];
  const observed = []; const observedRequests = [];
  const ledger = await createLocalBareLedger(fixture.root, command.change_id);
  const wrap = (name, operation) => async request => {
    observed.push(name);
    const entry = { name, request: structuredClone(request), result: null };
    observedRequests.push(entry);
    if (controls.beforeCall) await controls.beforeCall({ name, request: structuredClone(request), observed, observedRequests });
    entry.result = await operation(request);
    return entry.result;
  };
  const dependencies = {
    ...base,
    git: Object.fromEntries(Object.entries(base.git).map(([name, operation]) => [name, wrap(`git.${name}`, operation)])),
    ledger: Object.fromEntries(Object.entries(ledger).map(([name, operation]) => [name, wrap(`ledger.${name}`, operation)])),
    validation: { execute: wrap('validation.execute', production.createValidationGateway({ nodeExecutable: NODE }).execute) },
    pull_request: Object.fromEntries(Object.entries(base.pull_request).map(([name, operation]) => [name, wrap(`pull_request.${name}`, operation)])),
    handoff: { writeReadback: wrap('handoff.writeReadback', base.handoff.writeReadback) },
    clock: { now: () => '2026-09-06T00:00:30.000Z' },
    verifier: { async verify(request) { const body = JSON.parse(Buffer.from(request.command_body_bytes).toString('utf8')); return { kind: 'VERIFIED', body, verified_key_id: body.key_id, body_sha256: sha256(request.command_body_bytes), signature_sha256: sha256(request.signature_bytes) }; } },
  };
  return { command, core: createCoordinatorCore(dependencies), ledger, observed, observedRequests };
}

test('RED-M2-002 / TEST-M2-002 / 002-G01 reachability: public Core uses the frozen Foundation Ledger read request', async () => {
  await withRepository(async fixture => {
    const { command, core, observedRequests } = await createObservedB5Core(fixture, 'm2-ledger-contract-reachability');
    await core.applyControllerCommand(signed(command));
    const first = observedRequests.find(entry => entry.name === 'ledger.readRemote');
    assert.ok(first, 'the admitted DISPATCH reaches the public Ledger read boundary');
    assert.deepEqual(first.request, { remote_ref: 'refs/heads/evidence/agent-runs', expected_tip: null, change_id: command.change_id },
      'CAUSAL_RED: the production Core must supply the unchanged three-field Foundation readRemote request');
  });
});

test('RED-M2-002 / TEST-M2-002 / 002-G02 suffix: one public append uses all four exact Foundation requests and full receipt/readback identities', async t => {
  await withRepository(async fixture => {
    const { command, core, observedRequests } = await createObservedB5Core(fixture, 'm2-ledger-contract-suffix');
    await core.applyControllerCommand(signed(command));
    const first = observedRequests.find(entry => entry.name === 'ledger.readRemote');
    const expectedFirst = { remote_ref: 'refs/heads/evidence/agent-runs', expected_tip: null, change_id: command.change_id };
    assert.ok(first, 'PREREQUISITE_FAILURE: 002-G02 requires the 002-G01 Foundation read request');
    assert.equal(canonicalJson(first.request), canonicalJson(expectedFirst), 'PREREQUISITE_FAILURE: 002-G02 requires the exact 002-G01 Foundation read request');
    const prepared = observedRequests.find(entry => entry.name === 'ledger.prepareAppend');
    const committed = observedRequests.find(entry => entry.name === 'ledger.commitAndPush');
    const readback = observedRequests.find(entry => entry.name === 'ledger.readRemoteAppend');
    assert.ok(prepared && committed && readback, 'the same public append reaches prepare, commit/push, and exact remote-record readback');
    assert.deepEqual(Object.keys(prepared.request).sort(), ['event_bytes', 'expected_tip', 'prior_bytes', 'remote_read_receipt_sha256']);
    assert.equal(prepared.request.remote_read_receipt_sha256, first.result.receipt_sha256);
    assert.equal(prepared.request.expected_tip, first.result.value.tip);
    assert.deepEqual(Buffer.from(prepared.request.prior_bytes), Buffer.from(first.result.value.ledger_bytes_base64, 'base64'));
    const eventBytes = Buffer.from(prepared.request.event_bytes);
    assert.equal(eventBytes.at(-1), 0x0a); assert.equal(eventBytes.subarray(0, -1).includes(0x0a), false);
    const event = JSON.parse(eventBytes.subarray(0, -1).toString('utf8'));
    assert.deepEqual(Object.keys(event).sort(), ['change_id', 'detail', 'event_class', 'event_hash', 'event_id', 'idempotency_id', 'occurred_at', 'schema_version', 'sequence', 'state_version', 'subject_sha'].sort());
    const { event_hash, ...eventPreimage } = event; assert.equal(event_hash, sha256(canonicalJson(eventPreimage)));
    assert.deepEqual(committed.request, { prepared_receipt: prepared.result.value, idempotency_id: event.idempotency_id });
    assert.deepEqual(readback.request, { expected_commit: committed.result.value.commit_sha, event_id: event.event_id, event_hash: event.event_hash, idempotency_id: event.idempotency_id });
    assert.equal(readback.result.value.record_bytes_sha256, sha256(eventBytes));
    assert.equal(readback.result.value.commit_sha, committed.result.value.commit_sha);
    assert.equal(readback.result.value.tree_sha, committed.result.value.tree_sha);
    assert.equal(readback.result.value.record_offset, prepared.result.value.record_offset);
    assert.equal(readback.result.value.record_length, prepared.result.value.record_length);
  });
});

test('CONTROL-M2-002 / TEST-M2-002 / 002-C03: Test-local producer executes the exact four-request Ledger append against real bare Git', async () => {
  await withRepository(async fixture => {
    const changeId = 'CHG-ledger-contract-control'; const observations = [];
    const ledger = await createLocalBareLedger(fixture.root, changeId, observations);
    const appended = await appendTestLedgerEvent(ledger, {
      change_id: changeId, event_class: 'BLOCKED', detail: { blocked_reason: 'TEST_LEDGER_CONTROL', next_action: 'MANUAL_CONTROLLER_STOP', evidence_refs: [] },
      state_version: 1, subject_sha: fixture.candidate_sha, idempotency_id: '002-c02-ledger-control',
    });
    assert.deepEqual(Object.keys(appended.prior.value).sort(), ['authoritative_path', 'expected_tip', 'file_present', 'last_event_hash', 'last_event_id', 'last_sequence', 'ledger_bytes_base64', 'prior_byte_length', 'prior_bytes_sha256', 'remote_ref', 'tip', 'tip_parent', 'tip_tree'].sort());
    assert.deepEqual(Object.keys(appended.prepared.value).sort(), ['authoritative_path', 'event_hash', 'event_id', 'expected_tip', 'idempotency_id', 'new_byte_length', 'new_bytes_sha256', 'prepared_bytes_sha256', 'prior_byte_length', 'prior_bytes_sha256', 'record_length', 'record_offset', 'remote_ref', 'sequence'].sort());
    assert.deepEqual(Object.keys(appended.committed.value).sort(), ['authoritative_path', 'changed_paths', 'commit_sha', 'event_hash', 'event_id', 'idempotency_id', 'new_byte_length', 'new_bytes_sha256', 'parent_tip', 'preserved_entries_sha256_after', 'preserved_entries_sha256_before', 'prior_byte_length', 'prior_bytes_sha256', 'push_status', 'record_length', 'record_offset', 'remote_ref', 'sequence', 'tree_sha'].sort());
    assert.deepEqual(Object.keys(appended.readback.value).sort(), ['authoritative_path', 'commit_sha', 'event_hash', 'event_id', 'idempotency_id', 'linearized', 'new_byte_length', 'new_bytes_sha256', 'parent_tip', 'prior_byte_length', 'prior_bytes_sha256', 'record_bytes_sha256', 'record_length', 'record_offset', 'remote_ref', 'sequence', 'tip', 'tree_sha'].sort());
    const remote = await readLocalLedger(ledger, changeId, appended.committed.value.commit_sha); const bytes = Buffer.from(remote.value.ledger_bytes_base64, 'base64');
    const slice = bytes.subarray(appended.readback.value.record_offset, appended.readback.value.record_offset + appended.readback.value.record_length);
    assert.deepEqual(slice, appended.eventBytes); assert.equal(appended.readback.value.record_bytes_sha256, sha256(slice)); assert.equal(appended.readback.value.tree_sha, remote.value.tip_tree);
    assert.equal(observations.length, 1); assert.deepEqual(observations[0].request, { expected_commit: appended.committed.value.commit_sha, event_id: appended.event.event_id, event_hash: appended.event.event_hash, idempotency_id: appended.event.idempotency_id });
    assertExactLedgerReadback(observations[0], appended.event, bytes);
    assert.equal(appended.event.detail.blocked_reason, 'TEST_LEDGER_CONTROL', 'the label is only a Test-local gateway health marker, not a public-Core semantic validity claim');
  });
});

const handoffGatewayDocument = (change_id = 'CHG-handoff-gateway-control', salt = '1') => {
  const delivery_id = `delivery-${salt.repeat(64)}`;
  return { schema_version: '1.0', change_id, delivery_id, idempotency_id: delivery_id };
};
const HANDOFF_CONTROL_BYTE_BOUND = 1024 * 1024;
const sizedHandoffGatewayBytes = size => {
  const base = { ...handoffGatewayDocument('CHG-handoff-boundary', '5'), padding: '' };
  const baseBytes = Buffer.from(canonicalJson(base)); assert.ok(baseBytes.length < size);
  const handoff_bytes = Buffer.from(canonicalJson({ ...base, padding: 'x'.repeat(size - baseBytes.length) }));
  assert.equal(handoff_bytes.length, size, 'the independently constructed canonical boundary document has the requested exact byte length');
  return handoff_bytes;
};

async function loadHandoffGatewayOrSkip(t, leaf) {
  assert.equal(typeof production.createHandoffGateway, 'function', `PREREQUISITE_FAILURE: ${leaf} requires the 010-F01 production Handoff gateway export`);
  return production.createHandoffGateway;
}

test('RED-M2-005 / TEST-M2-010 / 010-F01 reachability: production exports the existing purpose-bound Handoff file gateway factory', () => {
  assert.equal(typeof production.createHandoffGateway, 'function', 'CAUSAL_RED: export existing createHandoffGateway(stateRoot); dependent F02..F04 remain NOT_REACHED');
});

test('CONTROL-M2-005 / TEST-M2-010 / 010-C01: canonical minimum Handoff gateway bytes and exact target support real create, replacement, and reread', async () => {
  const alias = await mkdtemp(path.join(os.tmpdir(), 'juanerai-m2-handoff-control-')); const root = await realpath(alias);
  try {
    const target = path.join(root, 'changes', 'CHG-handoff-gateway-control', 'handoff.json'); assert.equal(path.dirname(path.dirname(path.dirname(target))), root);
    await mkdir(path.dirname(target), { recursive: true });
    for (const salt of ['1', '2']) {
      const document = handoffGatewayDocument('CHG-handoff-gateway-control', salt); const bytes = Buffer.from(canonicalJson(document));
      assert.equal(bytes.toString('utf8'), canonicalJson(JSON.parse(bytes.toString('utf8')))); assert.equal(document.delivery_id, document.idempotency_id); assert.match(document.delivery_id, /^delivery-[0-9a-f]{64}$/);
      await writeFile(target, bytes); assert.deepEqual(await readFile(target), bytes); assert.equal(await realpath(target), target); assert.equal(path.dirname(await realpath(target)), path.dirname(target));
    }
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('CONTROL-M2-005 / TEST-M2-010 / 010-C02: retained factory source delegates to the one atomic write with file sync, rename, directory sync, and reread', async () => {
  const source = await readFile(new URL('./production.mjs', import.meta.url), 'utf8');
  const atomic = source.slice(source.indexOf('async function atomicWrite'), source.indexOf('function createFileState'));
  const factory = source.slice(source.indexOf('function createHandoffGateway'), source.indexOf('function createPurposeBoundMainSync'));
  assert.match(factory, /atomicWrite\(target, handoff_bytes\)/); assert.match(atomic, /file\.sync\(\)/); assert.match(atomic, /rename\(temporary, target\)/); assert.match(atomic, /directory\.sync\(\)/); assert.match(atomic, /readFile\(target\)/);
});

test('CONTROL-M2-005 / TEST-M2-010 / 010-C03: Test-local real Ledger source preserves one exact role RESULT/adjacent receipt pair fragment and every record slice identity', async () => {
  await withRepository(async fixture => {
    const changeId = 'CHG-handoff-ledger-source-control'; const readbacks = []; const ledger = await createLocalBareLedger(fixture.root, changeId, readbacks);
    const binding = { correlation_id: '010-source-role-001', role: 'juaner_validator', agent: 'juaner_validator', model: 'gpt-5.6-sol', reasoning: 'medium', sandbox: 'read-only', allowed_paths: [], phase: 'VALIDATOR', state_version: 7, brief_sha256: '1'.repeat(64), input_sha256: '2'.repeat(64), output_schema_sha256: '3'.repeat(64), subject_sha: fixture.candidate_sha, idempotency_id: '010-source-role-idempotency' };
    const artifact = { schema_version: '1.0', change_id: changeId, candidate_sha: fixture.candidate_sha, validator_head: fixture.candidate_sha, verdict: 'PASS', findings: [], risks: [], unverified: [], open_questions: [] }; const artifactBytes = Buffer.from(canonicalJson(artifact));
    const result = await appendTestLedgerEvent(ledger, { change_id: changeId, event_class: 'AGENT_RUN', state_version: 7, subject_sha: fixture.candidate_sha, idempotency_id: binding.idempotency_id, detail: { ...binding, stage: 'RESULT', observed_child_id: '010-source-child', status: 'PASS', artifact_path: '/tmp/010-source-artifact.json', artifact_sha256: sha256(artifactBytes), validator_artifact: artifact } });
    const receiptPreimage = { validation_id: binding.correlation_id, validation_kind: 'VALIDATOR', validation_scope: 'VALIDATOR_REVIEW', status: 'COMPLETED', verdict: 'PASS', failure_code: null, command_definition_sha256: sha256(canonicalJson(binding)), subject_sha: fixture.candidate_sha, candidate_sha: fixture.candidate_sha, validator_head: fixture.candidate_sha, idempotency_id: binding.idempotency_id };
    const receipt = { ...receiptPreimage, receipt_sha256: sha256(canonicalJson(receiptPreimage)) };
    const validation = await appendTestLedgerEvent(ledger, { change_id: changeId, event_class: 'VALIDATION_RESULT', state_version: 7, subject_sha: fixture.candidate_sha, idempotency_id: binding.idempotency_id, detail: receipt });
    const remote = await readLocalLedger(ledger, changeId, validation.committed.value.commit_sha); const decoded = decodeRemoteLedger(remote); assert.equal(decoded.records.length, 2); assert.equal(decoded.records[1].sequence, decoded.records[0].sequence + 1);
    assert.equal(decoded.records[0].event_id, result.event.event_id); assert.equal(decoded.records[1].event_id, validation.event.event_id); assert.equal(readbacks.length, 2);
    for (const entry of readbacks) { const slice = decoded.bytes.subarray(entry.result.value.record_offset, entry.result.value.record_offset + entry.result.value.record_length); assert.equal(sha256(slice), entry.result.value.record_bytes_sha256); assert.equal(entry.result.value.tree_sha, entry.result.value.tip === remote.value.tip ? remote.value.tip_tree : entry.result.value.tree_sha); }
  });
});

test('CONTROL-M2-005 / TEST-M2-010 / 010-C04: alternate missing-receipt source remains one real read/write Ledger authority through a later BLOCKED append', async () => {
  await withRepository(async fixture => {
    const changeId = 'CHG-handoff-missing-receipt-source-control';
    const primaryReadbacks = []; const primary = await createLocalBareLedger(fixture.root, changeId, primaryReadbacks);
    const binding = { correlation_id: '010-missing-receipt-role-001', role: 'juaner_validator', agent: 'juaner_validator', model: 'gpt-5.6-sol', reasoning: 'medium', sandbox: 'read-only', allowed_paths: [], phase: 'VALIDATOR', state_version: 9, brief_sha256: '4'.repeat(64), input_sha256: '5'.repeat(64), output_schema_sha256: '6'.repeat(64), subject_sha: fixture.candidate_sha, idempotency_id: '010-missing-receipt-role-idempotency' };
    const result = await appendTestLedgerEvent(primary, { change_id: changeId, event_class: 'AGENT_RUN', state_version: 9, subject_sha: fixture.candidate_sha, idempotency_id: binding.idempotency_id, detail: { ...binding, stage: 'RESULT', observed_child_id: '010-missing-receipt-child', status: 'PASS', artifact_path: '/tmp/010-missing-receipt-artifact.json', artifact_sha256: '7'.repeat(64), validator_artifact: { verdict: 'PASS' } } });
    const receiptPreimage = { validation_id: binding.correlation_id, validation_kind: 'VALIDATOR', validation_scope: 'VALIDATOR_REVIEW', status: 'COMPLETED', verdict: 'PASS', failure_code: null, command_definition_sha256: sha256(canonicalJson(binding)), subject_sha: fixture.candidate_sha, candidate_sha: fixture.candidate_sha, validator_head: fixture.candidate_sha, idempotency_id: binding.idempotency_id };
    const receipt = await appendTestLedgerEvent(primary, { change_id: changeId, event_class: 'VALIDATION_RESULT', state_version: 9, subject_sha: fixture.candidate_sha, idempotency_id: binding.idempotency_id, detail: { ...receiptPreimage, receipt_sha256: sha256(canonicalJson(receiptPreimage)) } });
    const primaryRemote = await readLocalLedger(primary, changeId); const primaryDecoded = decodeRemoteLedger(primaryRemote);
    assert.equal(primaryDecoded.records[0].event_id, result.event.event_id); assert.equal(primaryDecoded.records[1].event_id, receipt.event.event_id);
    assert.equal(primaryDecoded.records[1].sequence, primaryDecoded.records[0].sequence + 1, 'the healthy primary source first commits and reads back the complete adjacent pair');
    assert.equal(primaryReadbacks.length, 2); for (const entry of primaryReadbacks) assertExactLedgerReadback(entry, entry.event, primaryDecoded.bytes);

    const alternate = await cloneTestLedgerWithoutEvent({ root: path.join(fixture.root, '010-c04-alternate'), changeId, records: primaryDecoded.records, omittedEventId: receipt.event.event_id });
    assert.deepEqual(alternate.decoded.records.map(record => record.event_id), [result.event.event_id]);
    assert.equal(alternate.decoded.records[0].detail.correlation_id, binding.correlation_id);
    const blocked = await appendTestLedgerEvent(alternate.ledger, { change_id: changeId, event_class: 'BLOCKED', state_version: 9, subject_sha: fixture.candidate_sha, idempotency_id: '010-missing-receipt-blocked', detail: { blocked_reason: 'EVIDENCE_CONFLICT', next_action: 'MANUAL_CONTROLLER_STOP', evidence_refs: [{ event_id: result.event.event_id, event_hash: alternate.decoded.records[0].event_hash }] } });
    assert.equal(blocked.prior.value.tip, alternate.remote.value.tip, 'the BLOCKED append prepares against the same alternate tip that exposed the missing receipt');
    const finalAlternate = await readLocalLedger(alternate.ledger, changeId); const finalDecoded = decodeRemoteLedger(finalAlternate);
    assert.equal(finalDecoded.records.at(-1).event_id, blocked.event.event_id); assert.equal(blocked.readback.value.parent_tip, alternate.remote.value.tip);
    assertExactLedgerReadback(alternate.readbacks.at(-1), blocked.event, finalDecoded.bytes);
    assert.deepEqual(await readLocalLedger(primary, changeId), primaryRemote, 'the alternate read/write path never mutates the complete primary pair authority');
  });
});

test('RED-M2-005 / TEST-M2-010 / 010-F02 suffix: exported Handoff gateway creates, replaces, and rereads only the exact canonical target', async t => {
  const factory = await loadHandoffGatewayOrSkip(t, '010-F02'); if (!factory) return;
  const alias = await mkdtemp(path.join(os.tmpdir(), 'juanerai-m2-handoff-factory-')); const root = await realpath(alias);
  try {
    const gateway = factory(root); assert.equal(Object.isFrozen(gateway), true); assert.deepEqual(Object.keys(gateway), ['writeReadback']);
    const writes = [];
    for (const salt of ['3', '4']) {
      const document = handoffGatewayDocument('CHG-handoff-gateway-control', salt); const handoff_bytes = Buffer.from(canonicalJson(document));
      const result = await gateway.writeReadback({ expected_sha256: sha256(handoff_bytes), handoff_bytes });
      assert.equal(result.kind, 'OK'); assert.deepEqual(result.value, { handoff_sha256: sha256(handoff_bytes), delivery_id: document.delivery_id }); assert.equal(result.receipt_sha256, sha256(canonicalJson(result.value)));
      const target = path.join(root, 'changes', document.change_id, 'handoff.json'); const reread = await readFile(target);
      assert.deepEqual(reread, handoff_bytes); assert.equal(await realpath(target), target); assert.equal((await lstat(target)).mode & 0o777, 0o600, 'each actual atomic replacement leaves the target mode 0600');
      writes.push({ delivery_id: document.delivery_id, bytes: reread });
    }
    assert.notEqual(writes[0].delivery_id, writes[1].delivery_id, 'replacement uses the second supplied ID rather than retaining the original ID');
    assert.notDeepEqual(writes[0].bytes, writes[1].bytes, 'replacement physically changes the original bytes');
    assert.deepEqual(await readFile(path.join(root, 'changes', 'CHG-handoff-gateway-control', 'handoff.json')), writes[1].bytes, 'the actual target retains exactly the replacement bytes');
    const boundaryBytes = sizedHandoffGatewayBytes(HANDOFF_CONTROL_BYTE_BOUND); const boundaryDocument = JSON.parse(boundaryBytes.toString('utf8'));
    const boundary = await gateway.writeReadback({ expected_sha256: sha256(boundaryBytes), handoff_bytes: boundaryBytes });
    assert.equal(boundary.kind, 'OK'); assert.equal(boundary.value.delivery_id, boundaryDocument.delivery_id); assert.equal(boundary.value.handoff_sha256, sha256(boundaryBytes));
    const boundaryTarget = path.join(root, 'changes', boundaryDocument.change_id, 'handoff.json'); assert.deepEqual(await readFile(boundaryTarget), boundaryBytes); assert.equal((await lstat(boundaryTarget)).mode & 0o777, 0o600);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('RED-M2-005 / TEST-M2-010 / 010-F03 suffix: minimum gateway closed-input, ID, hash, canonical-byte, and safe-path negatives leave no successful replacement', async t => {
  const factory = await loadHandoffGatewayOrSkip(t, '010-F03'); if (!factory) return;
  const healthy = handoffGatewayDocument(); const healthyBytes = Buffer.from(canonicalJson(healthy));
  const requestFor = value => { const handoff_bytes = Buffer.from(canonicalJson(value)); return { expected_sha256: sha256(handoff_bytes), handoff_bytes }; };
  const noncanonical = Buffer.from(JSON.stringify({ idempotency_id: healthy.idempotency_id, delivery_id: healthy.delivery_id, change_id: healthy.change_id, schema_version: '1.0' }));
  const cases = [
    ['extra request field', { expected_sha256: sha256(healthyBytes), handoff_bytes: healthyBytes, extra: true }],
    ['missing expected hash', { handoff_bytes: healthyBytes }],
    ['missing Handoff bytes', { expected_sha256: sha256(healthyBytes) }],
    ['empty bytes', { expected_sha256: sha256(Buffer.alloc(0)), handoff_bytes: Buffer.alloc(0) }],
    ['invalid JSON bytes', { expected_sha256: sha256(Buffer.from('{')), handoff_bytes: Buffer.from('{') }],
    ['noncanonical bytes', { expected_sha256: sha256(noncanonical), handoff_bytes: noncanonical }],
    ['one byte above the existing control-byte bound', (() => { const handoff_bytes = sizedHandoffGatewayBytes(HANDOFF_CONTROL_BYTE_BOUND + 1); return { expected_sha256: sha256(handoff_bytes), handoff_bytes }; })()],
    ['malformed full hash', { expected_sha256: '0'.repeat(63), handoff_bytes: healthyBytes }],
    ['wrong full hash', { expected_sha256: '0'.repeat(64), handoff_bytes: healthyBytes }],
    ['missing Change ID', requestFor((({ change_id, ...value }) => value)(healthy))],
    ['unsafe Change ID containment', requestFor({ ...healthy, change_id: '../escape' })],
    ['missing delivery ID', requestFor((({ delivery_id, ...value }) => value)(healthy))],
    ['missing idempotency ID', requestFor((({ idempotency_id, ...value }) => value)(healthy))],
    ['delivery and idempotency differ', requestFor({ ...healthy, idempotency_id: `delivery-${'2'.repeat(64)}` })],
    ['malformed delivery ID', requestFor({ ...healthy, delivery_id: 'delivery-short', idempotency_id: 'delivery-short' })],
  ];
  for (const [label, request] of cases) await t.test(label, async () => {
    const alias = await mkdtemp(path.join(os.tmpdir(), 'juanerai-m2-handoff-negative-')); const root = await realpath(alias);
    try {
      const gateway = factory(root); const target = path.join(root, 'changes', healthy.change_id, 'handoff.json'); const escaped = path.join(root, 'escape', 'handoff.json');
      await assert.rejects(() => gateway.writeReadback(request), /INPUT_INVALID/, label);
      assert.equal(await exists(target), false, `${label}: no canonical target write`); assert.equal(await exists(escaped), false, `${label}: no escaped target write`);
    } finally { await rm(root, { recursive: true, force: true }); }
  });
  for (const [label, unsafeRoot] of [['nonabsolute state root', 'relative-state-root'], ['nonnormalized state root', `${path.parse(process.cwd()).root}tmp/child/..`]]) await t.test(label, async () => {
    assert.throws(() => factory(unsafeRoot), /INPUT_INVALID/, `${label}: construction rejects before a write method exists`);
  });
});

test('RED-M2-005 / TEST-M2-010 / 010-F04 suffix: a real non-directory state root rejects without reporting gateway success', async t => {
  const factory = await loadHandoffGatewayOrSkip(t, '010-F04'); if (!factory) return;
  const alias = await mkdtemp(path.join(os.tmpdir(), 'juanerai-m2-handoff-fs-failure-')); const root = await realpath(alias);
  try {
    const blockedRoot = path.join(root, 'not-a-directory'); await writeFile(blockedRoot, 'file'); const gateway = factory(blockedRoot);
    const document = handoffGatewayDocument(); const handoff_bytes = Buffer.from(canonicalJson(document));
    await assert.rejects(() => gateway.writeReadback({ expected_sha256: sha256(handoff_bytes), handoff_bytes }));
    assert.deepEqual(await readFile(blockedRoot, 'utf8'), 'file');
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('RED-M2-006 / TEST-M2-011 / 011-L01: a real B5 Ledger ambiguity cannot claim durable BLOCKED State without a read-back BLOCKED event', async () => {
  await withRepository(async fixture => {
    const { command, core, ledger, observed } = await createObservedB5Core(fixture, 'm2-b5-failure-evidence');
    const result = await core.applyControllerCommand(signed(command));
    const status = await core.status({ change_id: command.change_id });
    const remote = await readLocalLedger(ledger, command.change_id);
    assert.equal(remote.kind, 'OK');
    const remoteRecords = Buffer.from(remote.value.ledger_bytes_base64, 'base64').toString('utf8').trim().split('\n').filter(Boolean).map(line => JSON.parse(line));
    const blockedEvents = remoteRecords.filter(record => record.event_class === 'BLOCKED');
    const observation = {
      returned_state: result.state,
      returned_blocked_event_id: result.payload?.blocked_event_id ?? null,
      returned_local_pause_id: result.payload?.local_pause_id ?? null,
      state_status: status.payload?.macro_state ?? null,
      state_local_pause: status.payload?.local_pause ?? null,
      remote_blocked_event_ids: blockedEvents.map(record => record.event_id),
      downstream_calls: {
        validation: observed.filter(name => name === 'validation.execute').length,
        candidate_or_publish: observed.filter(name => name.startsWith('git.stageExact') || name.startsWith('git.commitCandidate') || name.startsWith('git.pushBranch')).length,
        pull_request: observed.filter(name => name.startsWith('pull_request.')).length,
        handoff: observed.filter(name => name === 'handoff.writeReadback').length,
      },
    };
    assert.deepEqual(observation.downstream_calls, { validation: 0, candidate_or_publish: 0, pull_request: 0, handoff: 0 }, `B5 failure starts no dependent effect before the durable-BLOCKED RED assertion: ${canonicalJson(observation)}`);
    assert.ok(result.state !== 'BLOCKED' || blockedEvents.length > 0, `Design 11.1 forbids durable BLOCKED without a remote read-back BLOCKED event: ${canonicalJson(observation)}`);
    assert.notEqual(status.payload?.macro_state, 'BLOCKED', `the public status readback proves the local State is durably BLOCKED: ${canonicalJson(observation)}`);
  });
});

test('CONTROL-M2-006 / TEST-M2-012 / 012-L01: concurrent real public admissions have one Ledger winner, one busy contender, and a released public boundary', async () => {
  await withRepository(async fixture => {
    let markEntered; let releaseBoundary;
    const entered = new Promise(resolve => { markEntered = resolve; });
    const released = new Promise(resolve => { releaseBoundary = resolve; });
    let held = false;
    const { command, core, observed } = await createObservedB5Core(fixture, 'm2-b5-concurrency', {
      beforeCall: async ({ name }) => {
        if (name !== 'ledger.readRemote' || held) return;
        held = true; markEntered(); await released;
      },
    });
    const owner = core.applyControllerCommand(signed(command));
    await entered;
    const contender = await core.applyControllerCommand(signed(command));
    assert.equal(contender.outcome, 'REJECTED'); assert.equal(contender.error_code, 'OPERATION_BUSY', 'the Test-held real Ledger call leaves exactly one busy contender');
    assert.equal(observed.filter(name => name === 'ledger.readRemote').length, 1, 'only the mutex owner enters the held real Ledger read boundary');
    assert.equal(observed.filter(name => name === 'ledger.prepareAppend').length, 0, 'no later Ledger operation can interleave while the first read is physically held');
    releaseBoundary();
    const winner = await owner;
    assert.equal(winner.operation, 'applyControllerCommand');
    assert.equal(observed.filter(name => name === 'validation.execute').length, 0, 'a concurrent B5 stop starts neither Regression child');
    assert.equal(observed.filter(name => name.startsWith('git.stageExact') || name.startsWith('git.commitCandidate') || name.startsWith('git.pushBranch')).length, 0, 'a concurrent B5 stop reaches no Candidate or publication operation');
    assert.equal(observed.filter(name => name.startsWith('pull_request.') || name === 'handoff.writeReadback').length, 0, 'a concurrent B5 stop reaches no PR or Handoff operation');
    const status = await core.status({ change_id: command.change_id });
    const replay = await core.applyControllerCommand(signed(command));
    assert.equal(status.operation, 'status', 'a public status call returns after the concurrent owner has released its mutex');
    assert.equal(replay.operation, 'applyControllerCommand', 'a subsequent legal public mutator returns rather than remaining locked');
    assert.ok(!(replay.outcome === 'REJECTED' && replay.error_code === 'OPERATION_BUSY'), `the replay observes a released mutex rather than another busy rejection: ${canonicalJson(replay)}`);
  });
});

test('CONTROL-M2-006 / TEST-M2-012 / 012-L05: a signed timeout returns only after the real child closes and the Worktree is post-observed', async () => {
  await withRepository(async fixture => {
    await writeFile(path.join(fixture.worktree, 'tracked.txt'), 'timed validation input\n');
    const subject = await freshWorktreeSubject(fixture.repository, fixture.worktree);
    const expectedSnapshot = await independentTrackedSnapshot(subject);
    const pidPath = path.join(fixture.root, 'timed-validation.pid');
    const childProgram = "require('node:fs').writeFileSync(process.argv[1],String(process.pid));setInterval(() => {}, 1000)";
    const definition = { id: 'regression-affected-suite', validation_kind: 'REGRESSION', validation_scope: 'AFFECTED_SUITE', subject: 'WORKTREE', argv: [NODE, '-e', childProgram, pidPath], cwd: fixture.worktree, environment: {}, timeout_ms: 500 };
    const sentSignals = []; let spawnObservations = null;
    const receipt = await withObservedRealSpawns(
      async observations => { spawnObservations = observations; return production.createValidationGateway({ nodeExecutable: NODE }).execute({ definition, subject }); },
      { onChild(observation, child) {
        if (observation.executable !== NODE || observation.argv[0] !== '-e' || observation.argv.at(-1) !== pidPath) return;
        const delegatedKill = child.kill.bind(child);
        child.kill = signal => { sentSignals.push(signal); return delegatedKill(signal); };
      } },
    );
    assertClosedExecutionGatewayResult(receipt, ['INTERRUPTED', null, 'TIMEOUT']);
    assert.equal(await exists(pidPath), true, `the owned timeout child writes its PID before the timer: ${canonicalJson({ receipt, spawnObservations })}`);
    const childPid = Number(await readFile(pidPath, 'utf8')); assert.ok(Number.isSafeInteger(childPid) && childPid > 0, 'the signed definition started one real child identity');
    assert.throws(() => process.kill(childPid, 0), error => error?.code === 'ESRCH', 'the returned receipt cannot precede terminal child close');
    const expected = expectedWorktreeReceipt(subject, definition, expectedSnapshot, '', '');
    expected.status = 'INTERRUPTED'; expected.verdict = null; expected.failure_code = 'TIMEOUT';
    const { receipt_sha256: ignoredReceiptHash, ...expectedPreimage } = expected; expected.receipt_sha256 = sha256(canonicalJson(expectedPreimage));
    assert.deepEqual(receipt.value, expected, 'post-observation rebinds the unchanged Worktree snapshot after the timed-out child closes');
    assert.equal(receipt.receipt_sha256, sha256(canonicalJson(expected)));
    assert.deepEqual(sentSignals, ['SIGKILL'], 'the real signed-validation timeout delegates exactly one actual SIGKILL to its owned child');
  });
});

test('RED-M2-002 / TEST-M2-002 / 002-L01: real public Core reaches the first malformed Regression request only after local bare-Ledger readback and real Worker bytes', async () => {
  await withObservedK1Prefix(async () => {});
});

const executionReceiptKeys = ['branch', 'candidate_sha', 'candidate_tree', 'command_definition_sha256', 'common_git_dir', 'execution_cwd', 'failure_code', 'head_sha', 'idempotency_id', 'receipt_sha256', 'repository_root', 'scope_sha256', 'status', 'stderr_sha256', 'stdout_sha256', 'subject_kind', 'subject_sha', 'validation_id', 'validation_kind', 'validation_scope', 'validator_head', 'verdict', 'worktree_root', 'worktree_snapshot_sha256'];

function assertClosedExecutionGatewayResult(actual, tuple) {
  assert.deepEqual(Object.keys(actual).sort(), ['kind', 'receipt_sha256', 'value'], 'the real Gateway returns the closed outer OK receipt');
  assert.equal(actual.kind, 'OK');
  assert.deepEqual(Object.keys(actual.value).sort(), executionReceiptKeys, 'the real child receipt has exactly twenty-four fields');
  assert.deepEqual([actual.value.status, actual.value.verdict, actual.value.failure_code], tuple, 'the child supplies one legal frozen tuple');
  const { receipt_sha256, ...preimage } = actual.value;
  assert.equal(receipt_sha256, sha256(canonicalJson(preimage)), 'the inner receipt hash covers exactly the other twenty-three fields');
  assert.equal(actual.receipt_sha256, sha256(canonicalJson(actual.value)), 'the outer receipt hash covers the complete twenty-four-field value');
}

function decodeRemoteLedger(remote) {
  assert.deepEqual(Object.keys(remote).sort(), ['kind', 'receipt_sha256', 'value']);
  assert.equal(remote.kind, 'OK');
  assert.deepEqual(Object.keys(remote.value).sort(), ['authoritative_path', 'expected_tip', 'file_present', 'last_event_hash', 'last_event_id', 'last_sequence', 'ledger_bytes_base64', 'prior_byte_length', 'prior_bytes_sha256', 'remote_ref', 'tip', 'tip_parent', 'tip_tree'].sort());
  assert.equal(remote.receipt_sha256, sha256(canonicalJson(remote.value)), 'the remote-read wrapper hashes the exact thirteen-field receipt');
  const bytes = Buffer.from(remote.value.ledger_bytes_base64, 'base64');
  assert.equal(bytes.toString('base64'), remote.value.ledger_bytes_base64, 'remote Ledger bytes use canonical padded base64');
  assert.equal(sha256(bytes), remote.value.prior_bytes_sha256);
  assert.equal(bytes.length, remote.value.prior_byte_length);
  assert.equal(bytes.at(-1), 0x0a, 'a non-empty remote Ledger ends in the one required LF');
  const recordBytes = bytes.subarray(0, -1).toString('utf8').split('\n').map(line => Buffer.from(`${line}\n`));
  const records = recordBytes.map(record => {
    const value = JSON.parse(record.toString('utf8'));
    assert.equal(record.toString('utf8'), `${canonicalJson(value)}\n`, 'each authoritative record is canonical JSON plus one LF');
    const { event_hash, ...preimage } = value;
    assert.equal(event_hash, sha256(canonicalJson(preimage)), 'each authoritative event hash covers the exact record preimage');
    return value;
  });
  assert.equal(remote.value.last_event_id, records.at(-1).event_id);
  assert.equal(remote.value.last_event_hash, records.at(-1).event_hash);
  assert.equal(remote.value.last_sequence, records.at(-1).sequence);
  return { bytes, recordBytes, records };
}

function assertExactLedgerReadback(entry, event, ledgerBytes) {
  assert.ok(entry, `remote readback is required for ${event.event_class} ${event.event_id}`);
  assert.deepEqual(entry.event, event, 'the observed readback belongs to the exact prepared event');
  assert.deepEqual(Object.keys(entry.result).sort(), ['kind', 'receipt_sha256', 'value']);
  assert.equal(entry.result.kind, 'OK');
  assert.deepEqual(Object.keys(entry.result.value).sort(), ['authoritative_path', 'commit_sha', 'event_hash', 'event_id', 'idempotency_id', 'linearized', 'new_byte_length', 'new_bytes_sha256', 'parent_tip', 'prior_byte_length', 'prior_bytes_sha256', 'record_bytes_sha256', 'record_length', 'record_offset', 'remote_ref', 'sequence', 'tip', 'tree_sha'].sort());
  assert.equal(entry.result.receipt_sha256, sha256(canonicalJson(entry.result.value)), 'the append readback wrapper hashes its exact closed value');
  assert.equal(entry.result.value.event_id, event.event_id);
  assert.equal(entry.result.value.event_hash, event.event_hash);
  assert.equal(entry.result.value.sequence, event.sequence);
  assert.equal(entry.result.value.idempotency_id, event.idempotency_id);
  assert.equal(entry.result.value.linearized, true);
  assert.equal(entry.result.value.tip, entry.result.value.commit_sha, 'the exact remote append linearizes at its accepted commit');
  assert.equal(entry.result.value.prior_byte_length, entry.result.value.record_offset, 'the appended record starts exactly after the prior authoritative bytes');
  assert.equal(entry.result.value.new_byte_length, entry.result.value.record_offset + entry.result.value.record_length, 'the accepted new byte length ends exactly after this record');
  const priorBytes = ledgerBytes.subarray(0, entry.result.value.prior_byte_length);
  const newBytes = ledgerBytes.subarray(0, entry.result.value.new_byte_length);
  assert.equal(entry.result.value.prior_bytes_sha256, sha256(priorBytes), 'the retained prior hash covers the exact authoritative prefix before this record');
  assert.equal(entry.result.value.new_bytes_sha256, sha256(newBytes), 'the retained new hash covers the exact authoritative prefix through this record');
  const slice = ledgerBytes.subarray(entry.result.value.record_offset, entry.result.value.record_offset + entry.result.value.record_length);
  assert.equal(slice.toString('utf8'), `${canonicalJson(event)}\n`, 'the readback offset/length selects the exact authoritative record');
  assert.equal(entry.result.value.record_bytes_sha256, sha256(slice));
}

async function assertDurableBlockedEvidence({ base, command, afterWorker, blockedSupportingState = afterWorker, ledger, observedLedgerReadbacks, gatewayEvents, result, expectedReceipts, blockedEvidenceReceipts, reason, action }) {
  assert.equal(result.outcome, 'BLOCKED');
  assert.equal(result.state, 'BLOCKED', 'the response may claim durable BLOCKED only after all three readbacks');
  assert.equal(result.payload.blocked_reason, reason);
  assert.equal(result.payload.next_action, action);
  const remote = await readLocalLedger(ledger, command.change_id);
  const { bytes, records } = decodeRemoteLedger(remote);
  const receiptEvents = expectedReceipts.map(receipt => {
    const matches = records.filter(record => record.event_class === 'VALIDATION_RESULT' && record.idempotency_id === receipt.value.idempotency_id);
    assert.equal(matches.length, 1, `one remotely authoritative receipt is required for ${receipt.value.validation_id}`);
    const event = matches[0];
    assert.deepEqual(event.detail, receipt.value, 'the remote failure/evidence receipt is the actual healthy Gateway value, not a reconstructed object');
    assert.equal(event.change_id, command.change_id);
    assert.equal(event.state_version, afterWorker.state_version);
    assert.equal(event.subject_sha, receipt.value.subject_sha);
    assertExactLedgerReadback(observedLedgerReadbacks.find(entry => entry.event.event_id === event.event_id), event, bytes);
    return event;
  });
  const blockedEvents = records.filter(record => record.event_class === 'BLOCKED' && record.detail?.blocked_reason === reason);
  assert.equal(blockedEvents.length, 1, 'the stop has exactly one remotely authoritative BLOCKED event');
  const blocked = blockedEvents[0];
  assert.deepEqual(Object.keys(blocked.detail).sort(), ['blocked_reason', 'evidence_refs', 'next_action']);
  assert.equal(blocked.detail.next_action, action);
  assert.equal(blocked.change_id, command.change_id);
  assert.equal(blocked.state_version, blockedSupportingState.state_version, 'the BLOCKED event is supported by the real pre-stop State identity');
  assert.notEqual(blocked.subject_sha, '0'.repeat(40));
  for (const receipt of blockedEvidenceReceipts) {
    const event = receiptEvents.find(candidate => candidate.idempotency_id === receipt.value.idempotency_id);
    assert.ok(event, `the required BLOCKED evidence receipt was remotely read back: ${receipt.value.validation_id}`);
    const ref = blocked.detail.evidence_refs.find(candidate => candidate.id === event.event_id && candidate.sha256 === event.event_hash && candidate.subject_sha === event.subject_sha);
    assert.ok(ref, `BLOCKED evidence references the exact ${event.detail.validation_id} remote receipt`);
    assert.deepEqual(Object.keys(ref).sort(), ['id', 'kind', 'sha256', 'subject_sha']);
    assert.ok(event.sequence < blocked.sequence, 'receipt readback precedes the BLOCKED event');
  }
  assert.equal(records.at(-1).event_id, blocked.event_id, 'BLOCKED is the last event before its State transition');
  assertExactLedgerReadback(observedLedgerReadbacks.find(entry => entry.event.event_id === blocked.event_id), blocked, bytes);
  const blockedReadbackComplete = gatewayEvents.find(event => event.gateway === 'ledger' && event.method === 'readRemoteAppend' && event.edge === 'COMPLETE' && event.result?.value?.event_id === blocked.event_id);
  const blockedStateWriteStart = gatewayEvents.find(event => event.gateway === 'state' && event.method === 'writeState' && event.edge === 'START' && (() => { try { const value = JSON.parse(event.request.next_bytes); return value.macro_state === 'BLOCKED' && value.blocked_reason === reason; } catch { return false; } })());
  assert.ok(blockedReadbackComplete && blockedStateWriteStart && blockedReadbackComplete.sequence < blockedStateWriteStart.sequence, 'the exact BLOCKED readRemoteAppend completes before the BLOCKED State write starts');
  const blockedStateReadbackComplete = gatewayEvents.find(event => event.gateway === 'state' && event.method === 'readState' && event.edge === 'COMPLETE' && event.sequence > blockedStateWriteStart.sequence && (() => { try { const value = JSON.parse(event.result.value.bytes); return value.macro_state === 'BLOCKED' && value.blocked_reason === reason; } catch { return false; } })());
  assert.ok(blockedStateReadbackComplete, 'the exact BLOCKED State is read back after its write');
  assert.equal(result.payload.blocked_event_id, blocked.event_id, 'the public stop returns the remotely read-back BLOCKED identity');
  const stateReadback = await base.state.readState({ change_id: command.change_id });
  assert.equal(stateReadback.kind, 'OK');
  assert.equal(stateReadback.value.sha256, sha256(stateReadback.value.bytes));
  const state = JSON.parse(stateReadback.value.bytes);
  assert.equal(stateReadback.value.bytes, canonicalJson(state), 'the BLOCKED State readback is canonical exact bytes');
  assert.equal(state.macro_state, 'BLOCKED');
  assert.equal(state.phase, null);
  assert.equal(state.blocked_reason, reason);
  assert.equal(state.state_version, result.state_version);
  assert.equal(result.state_hash, sha256(canonicalJson(state)), 'the public durable identity binds the exact State readback');
}

test('RED-M2-002 / TEST-M2-002 / 002-L02..L07: real post-Worker children and exact corrupted receipt fields cannot enter STAGE', async t => {
  const cases = [
    { label: '002-L02 first real child non-PASS', target: 'regression-affected-suite', argv: [NODE, '-e', 'process.stderr.write("affected failed\\n"); process.exit(17)'], expectedChildren: 1, tuple: ['COMPLETED', 'FAIL', 'NONZERO_EXIT'], reason: 'REGRESSION_FAILURE' },
    { label: '002-L03 second real child non-PASS', target: 'regression-test-asset-retirement', argv: [NODE, '-e', 'process.stderr.write("retirement failed\\n"); process.exit(19)'], expectedChildren: 2, tuple: ['COMPLETED', 'FAIL', 'NONZERO_EXIT'], reason: 'TEST_ASSET_RETIREMENT_FAILURE' },
    { label: '002-L04 wrong validation ID', target: 'regression-affected-suite', mutate: receipt => ({ ...receipt, validation_id: 'other-validation' }), fault: { layer: 'value', field: 'validation_id', expected: 'other-validation' }, expectedChildren: 1 },
    { label: '002-L05 wrong kind', target: 'regression-affected-suite', mutate: receipt => ({ ...receipt, validation_kind: 'FINAL_VALIDATION' }), fault: { layer: 'value', field: 'validation_kind', expected: 'FINAL_VALIDATION' }, expectedChildren: 1 },
    { label: '002-L05 wrong scope', target: 'regression-affected-suite', mutate: receipt => ({ ...receipt, validation_scope: 'TEST_ASSET_RETIREMENT' }), fault: { layer: 'value', field: 'validation_scope', expected: 'TEST_ASSET_RETIREMENT' }, expectedChildren: 1 },
    { label: '002-L06 wrong Head', target: 'regression-affected-suite', mutate: receipt => ({ ...receipt, head_sha: 'f'.repeat(40) }), fault: { layer: 'value', field: 'head_sha', expected: 'f'.repeat(40) }, expectedChildren: 1 },
    { label: '002-L06 wrong common-dir', target: 'regression-affected-suite', mutate: receipt => ({ ...receipt, common_git_dir: '/tmp/not-the-real-common-dir' }), fault: { layer: 'value', field: 'common_git_dir', expected: '/tmp/not-the-real-common-dir' }, expectedChildren: 1 },
    { label: '002-L06 wrong scope hash', target: 'regression-affected-suite', mutate: receipt => ({ ...receipt, scope_sha256: 'f'.repeat(64) }), fault: { layer: 'value', field: 'scope_sha256', expected: 'f'.repeat(64) }, expectedChildren: 1 },
    { label: '002-L07 wrong snapshot', target: 'regression-affected-suite', mutate: receipt => ({ ...receipt, worktree_snapshot_sha256: 'f'.repeat(64) }), fault: { layer: 'value', field: 'worktree_snapshot_sha256', expected: 'f'.repeat(64) }, expectedChildren: 2, reason: 'WORKTREE_DIRTY_CONFLICT', action: 'MANUAL_CONTROLLER_STOP', compareActualSnapshots: true },
    { label: '002-L07 wrong stdout hash', target: 'regression-affected-suite', mutate: receipt => ({ ...receipt, stdout_sha256: 'f'.repeat(64) }), fault: { layer: 'value', field: 'stdout_sha256', expected: 'f'.repeat(64) }, keepInnerHash: true, expectedRawStdout: 'affected-regression\n', expectedChildren: 1 },
    { label: '002-L07 wrong inner receipt hash', target: 'regression-affected-suite', mutate: receipt => ({ ...receipt, receipt_sha256: 'f'.repeat(64) }), fault: { layer: 'value', field: 'receipt_sha256', expected: 'f'.repeat(64) }, keepInnerHash: true, expectedChildren: 1 },
    { label: '002-L07 wrong outer receipt hash', target: 'regression-affected-suite', mutate: receipt => receipt, fault: { layer: 'outer', field: 'receipt_sha256', expected: 'f'.repeat(64) }, keepOuterHash: true, expectedChildren: 1 },
  ];
  for (const scenario of cases) await t.test(scenario.label, async () => {
    await withObservedK1Prefix(async ({ base, command, core, afterWorker, ledger, observedLedgerReadbacks, faultHits, gatewayEvents, observedStageRequests, observedValidationRequests, observedValidationActualResults, observedValidationResults }) => {
      assert.ok(gatewayEvents.some(event => event.edge === 'ARM' && event.state_version === afterWorker.state_version), 'the negative boundary arms only after the real Worker RESULT reached REGRESSION');
      if (scenario.argv) assert.deepEqual(command.payload.validations.find(definition => definition.id === scenario.target)?.argv, scenario.argv, 'the non-PASS stimulus is the signed real child command, not a mutated PASS tuple');
      const result = await core.run({ change_id: command.change_id, expected_state_version: afterWorker.state_version, expected_state_hash: afterWorker.state_hash });
      assert.equal(observedValidationRequests.length, scenario.expectedChildren, 'the public Core starts no child after the target receipt frontier');
      assert.equal(observedValidationActualResults.length, scenario.expectedChildren, 'each request has one separately retained actual producer result');
      assert.equal(observedValidationResults.length, scenario.expectedChildren, 'each request has one delivered Core result');
      const targetIndex = observedValidationRequests.findIndex(request => request.definition.id === scenario.target);
      assert.ok(targetIndex >= 0, 'the intended real child was executed');
      const actual = observedValidationActualResults[targetIndex];
      const delivered = observedValidationResults[targetIndex];
      assertClosedExecutionGatewayResult(actual, scenario.tuple ?? ['COMPLETED', 'PASS', null]);
      if (scenario.mutate) {
        assert.deepEqual(faultHits, [`validation:${scenario.target}`], 'the post-Worker receipt fault is armed and hits exactly its intended real child result');
        assert.deepEqual(Object.keys(delivered).sort(), ['kind', 'receipt_sha256', 'value'], 'the delivered fault retains the closed outer property set');
        assert.deepEqual(Object.keys(delivered.value).sort(), executionReceiptKeys, 'the delivered fault retains the closed twenty-four-field property set');
        assert.notDeepEqual(delivered, actual, 'the delivered controlled fault is distinct from the retained healthy producer result');
        assert.equal(scenario.fault.layer === 'outer' ? delivered[scenario.fault.field] : delivered.value[scenario.fault.field], scenario.fault.expected, 'the exact intended corrupted field reaches Core');
        assert.notEqual(scenario.fault.layer === 'outer' ? actual[scenario.fault.field] : actual.value[scenario.fault.field], scenario.fault.expected, 'the actual producer did not emit the injected corruption');
        if (scenario.compareActualSnapshots) {
          for (const producerResult of observedValidationActualResults) assertClosedExecutionGatewayResult(producerResult, ['COMPLETED', 'PASS', null]);
          assert.equal(observedValidationActualResults[0].value.worktree_snapshot_sha256, observedValidationActualResults[1].value.worktree_snapshot_sha256, 'both real producer children independently agree on the actual Worktree snapshot');
          assert.notEqual(observedValidationResults[0].value.worktree_snapshot_sha256, observedValidationResults[1].value.worktree_snapshot_sha256, 'the fully rehashed delivered first receipt conflicts with the real second receipt at the two-receipt agreement boundary');
          assert.deepEqual(observedValidationResults[1], observedValidationActualResults[1], 'the second delivered receipt remains the real second producer result');
        }
        if (scenario.expectedRawStdout) {
          assert.equal(actual.value.stdout_sha256, sha256(scenario.expectedRawStdout), 'the real producer hashes the independently known raw stdout bytes');
          const { receipt_sha256, ...deliveredPreimage } = delivered.value;
          assert.notEqual(receipt_sha256, sha256(canonicalJson(deliveredPreimage)), 'the stdout field corruption deliberately leaves the enclosing inner receipt integrity invalid');
          assert.equal(delivered.receipt_sha256, sha256(canonicalJson(delivered.value)), 'the outer wrapper remains internally valid so Core rejects the intended inner receipt boundary');
        }
      } else {
        assert.deepEqual(delivered, actual, 'the non-PASS case delivers the actual real-child result without tuple mutation');
      }
      assert.equal(result.outcome, 'BLOCKED', 'a non-PASS or corrupted real child receipt cannot advance to STAGE');
      assert.equal(result.payload.blocked_reason, scenario.reason ?? 'EVIDENCE_CONFLICT');
      const expectedAction = scenario.action ?? (scenario.reason ? 'REVISION' : 'MANUAL_CONTROLLER_STOP');
      assert.equal(result.payload.next_action, expectedAction);
      if (scenario.reason) {
        const expectedReceipts = scenario.compareActualSnapshots ? observedValidationResults : observedValidationActualResults;
        const blockedEvidenceReceipts = scenario.compareActualSnapshots ? observedValidationResults : observedValidationActualResults.filter(receipt => receipt.value.verdict === 'FAIL');
        await assertDurableBlockedEvidence({ base, command, afterWorker, ledger, observedLedgerReadbacks, gatewayEvents, result, expectedReceipts, blockedEvidenceReceipts, reason: scenario.reason, action: expectedAction });
      } else {
        const state = await base.state.readState({ change_id: command.change_id }); assert.equal(state.kind, 'OK');
        assert.equal(JSON.parse(state.value.bytes).macro_state, 'BLOCKED', 'the corrupted receipt cannot expose STAGE as durable progress');
      }
      assert.equal(observedStageRequests.length, 0, 'no STAGE effect follows a failed two-receipt gate');
      if (scenario.compareActualSnapshots || scenario.expectedRawStdout) assert.equal(gatewayEvents.some(event => event.gateway === 'git' && ['stageExact', 'readStaged', 'commitCandidate'].includes(event.method)), false, 'the corrected L07 boundary starts no STAGE or Candidate operation');
    }, {
      validationArgvById: scenario.argv ? { [scenario.target]: scenario.argv } : undefined,
      transformValidationResult: async (actual, request, faultHitsForTransform) => {
        if (!scenario.mutate || request.definition.id !== scenario.target) return actual;
        const hit = `validation:${scenario.target}`;
        assert.equal(faultHitsForTransform.includes(hit), false, 'a receipt fault can hit only once');
        faultHitsForTransform.push(hit);
        assert.equal(actual.kind, 'OK', 'the controlled negative begins with an actual real-Node child result');
        assertClosedExecutionGatewayResult(actual, ['COMPLETED', 'PASS', null]);
        const replacement = scenario.mutate(structuredClone(actual.value));
        if (!scenario.keepInnerHash) {
          const { receipt_sha256, ...preimage } = replacement;
          replacement.receipt_sha256 = sha256(canonicalJson(preimage));
        }
        return { kind: 'OK', value: replacement, receipt_sha256: scenario.keepOuterHash ? 'f'.repeat(64) : sha256(canonicalJson(replacement)) };
      },
      stopAfterWorker: true,
    });
  });
});

test('RED-M2-002 / TEST-M2-002 / 002-L08: a real between-child content mutation invalidates the two-receipt gate', async () => {
  await withObservedK1Prefix(async ({ base, command, core, afterWorker, coreWorktree, ledger, observedLedgerReadbacks, gatewayEvents, faultHits, observedStageRequests, observedValidationRequests, observedValidationActualResults, observedValidationResults }) => {
    const result = await core.run({ change_id: command.change_id, expected_state_version: afterWorker.state_version, expected_state_hash: afterWorker.state_hash });
    assert.deepEqual(faultHits, ['validation:regression-affected-suite:mutated-worktree'], 'the mutation occurs exactly once after the first real child and before the second child');
    assert.equal(observedValidationRequests.length, 2, 'both real children execute around the between-child mutation');
    assert.deepEqual(observedValidationResults, observedValidationActualResults, 'the mutation case delivers both actual producer results without receipt substitution');
    for (const actual of observedValidationActualResults) assertClosedExecutionGatewayResult(actual, ['COMPLETED', 'PASS', null]);
    assert.notEqual(observedValidationActualResults[0].value.worktree_snapshot_sha256, observedValidationActualResults[1].value.worktree_snapshot_sha256, 'the two real receipts expose the content drift independently');
    assert.equal(result.outcome, 'BLOCKED');
    assert.equal(result.payload.blocked_reason, 'WORKTREE_DIRTY_CONFLICT');
    assert.equal(result.payload.next_action, 'MANUAL_CONTROLLER_STOP');
    await assertDurableBlockedEvidence({ base, command, afterWorker, ledger, observedLedgerReadbacks, gatewayEvents, result, expectedReceipts: observedValidationActualResults, blockedEvidenceReceipts: observedValidationActualResults, reason: 'WORKTREE_DIRTY_CONFLICT', action: 'MANUAL_CONTROLLER_STOP' });
    assert.equal(observedStageRequests.length, 0, 'content drift cannot invoke STAGE');
  }, {
    stopAfterWorker: true,
    transformValidationResult: async (actual, request, faultHits) => {
      if (request.definition.id !== 'regression-affected-suite') return actual;
      assertClosedExecutionGatewayResult(actual, ['COMPLETED', 'PASS', null]);
      assert.equal(faultHits.length, 0, 'the between-child write is armed only after the real Worker settlement');
      await writeFile(request.subject.worktree_root + '/tracked.txt', 'between-child drift\n');
      faultHits.push('validation:regression-affected-suite:mutated-worktree');
      return actual;
    },
  });
});

function rewriteLastLedgerRecord(value, mutate) {
  const ledgerBytes = Buffer.from(value.ledger_bytes_base64, 'base64');
  assert.equal(ledgerBytes.toString('base64'), value.ledger_bytes_base64, 'the fault starts from canonical padded base64');
  const lines = ledgerBytes.subarray(0, -1).toString('utf8').split('\n');
  const records = lines.map(line => JSON.parse(line));
  const replacement = mutate(structuredClone(records.at(-1)));
  const { event_hash: ignored, ...eventPreimage } = replacement;
  replacement.event_hash = sha256(canonicalJson(eventPreimage));
  records[records.length - 1] = replacement;
  const nextBytes = Buffer.from(records.map(record => `${canonicalJson(record)}\n`).join(''));
  return { ...value, ledger_bytes_base64: nextBytes.toString('base64'), prior_bytes_sha256: sha256(nextBytes), prior_byte_length: nextBytes.length, last_event_id: replacement.event_id, last_event_hash: replacement.event_hash, last_sequence: replacement.sequence };
}

test('RED-M2-002 / TEST-M2-002 / 002-L09..L10: malformed remote bytes or record identity stop before a new Ledger prepare and STAGE', async t => {
  const cases = [
    { label: '002-L09 noncanonical base64', mutate: value => ({ ...value, ledger_bytes_base64: '*' }) },
    { label: '002-L09 wrong byte hash', mutate: value => ({ ...value, prior_bytes_sha256: 'f'.repeat(64) }) },
    { label: '002-L09 wrong byte length', mutate: value => ({ ...value, prior_byte_length: value.prior_byte_length + 1 }) },
    { label: '002-L10 wrong sequence', mutate: value => rewriteLastLedgerRecord(value, record => ({ ...record, sequence: record.sequence + 7 })) },
    { label: '002-L10 wrong change', mutate: value => rewriteLastLedgerRecord(value, record => ({ ...record, change_id: 'CHG-wrong-ledger-change' })) },
    { label: '002-L10 wrong state', mutate: value => rewriteLastLedgerRecord(value, record => ({ ...record, state_version: record.state_version + 1 })) },
    { label: '002-L10 wrong subject', mutate: value => rewriteLastLedgerRecord(value, record => ({ ...record, subject_sha: 'f'.repeat(40) })) },
    { label: '002-L10 wrong idempotency', mutate: value => rewriteLastLedgerRecord(value, record => ({ ...record, idempotency_id: 'wrong-ledger-idempotency' })) },
  ];
  for (const scenario of cases) await t.test(scenario.label, async () => {
    let targetedRecord = null;
    await withObservedK1Prefix(async ({ base, command, core, afterWorker, observedLedgerReadbacks, faultHits, gatewayEvents, observedValidationActualResults }) => {
      const result = await core.run({ change_id: command.change_id, expected_state_version: afterWorker.state_version, expected_state_hash: afterWorker.state_hash });
      assert.deepEqual(faultHits, [`ledger:readRemote:${scenario.label}`], 'the malformed remote receipt is injected exactly once after Worker');
      const faultRead = gatewayEvents.find(event => event.gateway === 'ledger' && event.method === 'readRemote' && event.edge === 'COMPLETE' && event.faulted === true);
      assert.ok(faultRead, 'the intended real Ledger read boundary was reached');
      assert.equal(observedValidationActualResults.length, 2, 'the Ledger fault is armed only after both real Regression children complete');
      for (const actual of observedValidationActualResults) assertClosedExecutionGatewayResult(actual, ['COMPLETED', 'PASS', null]);
      const targetValidationComplete = gatewayEvents.find(event => event.gateway === 'validation' && event.edge === 'COMPLETE' && event.actual_result?.value?.validation_id === 'regression-test-asset-retirement');
      const ledgerArm = gatewayEvents.find(event => event.gateway === 'test-control' && event.method === 'ledger-post-validation' && event.validation_id === 'regression-test-asset-retirement');
      assert.ok(targetValidationComplete && ledgerArm && targetValidationComplete.sequence < ledgerArm.sequence && ledgerArm.sequence < faultRead.sequence, 'the remote fault is armed after the actual second child and before its next Ledger boundary');
      const healthyRemote = decodeRemoteLedger(faultRead.actual_result);
      assert.deepEqual(healthyRemote.records.at(-1), targetedRecord, 'the retained healthy remote read identifies the exact existing affected-suite receipt being corrupted');
      assert.equal(targetedRecord.event_class, 'VALIDATION_RESULT');
      assert.equal(targetedRecord.detail.validation_id, 'regression-affected-suite');
      assertClosedExecutionGatewayResult({ kind: 'OK', value: targetedRecord.detail, receipt_sha256: sha256(canonicalJson(targetedRecord.detail)) }, ['COMPLETED', 'PASS', null]);
      assertExactLedgerReadback(observedLedgerReadbacks.find(entry => entry.event.event_id === targetedRecord.event_id), targetedRecord, healthyRemote.bytes);
      assert.notDeepEqual(faultRead.result, faultRead.actual_result, 'Core receives the controlled malformed remote receipt, not the retained healthy producer result');
      assert.deepEqual(Object.keys(faultRead.result).sort(), ['kind', 'receipt_sha256', 'value']);
      assert.deepEqual(Object.keys(faultRead.result.value).sort(), Object.keys(faultRead.actual_result.value).sort(), 'the malformed delivery retains the closed thirteen-field property set');
      assert.equal(gatewayEvents.some(event => event.gateway === 'ledger' && event.method === 'prepareAppend' && event.sequence > faultRead.sequence), false, 'invalid remote authority must be rejected before prepareAppend');
      assert.equal(result.outcome, 'BLOCKED');
      assert.equal(result.payload.blocked_reason, 'EVIDENCE_CONFLICT');
      assert.equal(result.payload.next_action, 'MANUAL_CONTROLLER_STOP');
      assert.equal(JSON.parse((await base.state.readState({ change_id: command.change_id })).value.bytes).phase, 'REGRESSION', 'invalid remote bytes cannot publish STAGE');
    }, {
      stopAfterWorker: true,
      armLedgerFaultAfterValidationId: 'regression-test-asset-retirement',
      transformLedgerResult: async ({ method, actualResult, faultHits }) => {
        if (method !== 'readRemote' || faultHits.length) return actualResult;
        assert.deepEqual(Object.keys(actualResult).sort(), ['kind', 'receipt_sha256', 'value']);
        assert.deepEqual(Object.keys(actualResult.value).sort(), ['authoritative_path', 'expected_tip', 'file_present', 'last_event_hash', 'last_event_id', 'last_sequence', 'ledger_bytes_base64', 'prior_byte_length', 'prior_bytes_sha256', 'remote_ref', 'tip', 'tip_parent', 'tip_tree'].sort());
        const healthy = decodeRemoteLedger(actualResult);
        targetedRecord = structuredClone(healthy.records.at(-1));
        assert.equal(targetedRecord.event_class, 'VALIDATION_RESULT', 'the corruption targets an actual remotely read-back Regression receipt, not a prior Worker record');
        assert.equal(targetedRecord.detail.validation_id, 'regression-affected-suite');
        faultHits.push(`ledger:readRemote:${scenario.label}`);
        const value = scenario.mutate(structuredClone(actualResult.value));
        return { kind: 'OK', value, receipt_sha256: sha256(canonicalJson(value)) };
      },
    });
  });
});

test('RED-M2-002 / TEST-M2-002 / 002-L11..L12: unavailable and ambiguous Ledger authority preserve prior State with exact replay/manual local pauses', async t => {
  const cases = [
    { label: '002-L11 Ledger unavailable', makeEnvelope: () => unavailable(null), reason: 'EVIDENCE_REF_UNAVAILABLE', pauseReason: 'EVIDENCE_REF_UNAVAILABLE', action: 'IDENTICAL_COMMAND_REPLAY' },
    { label: '002-L12 Ledger ambiguity', makeEnvelope: actualResult => {
      const last = decodeRemoteLedger(actualResult).records.at(-1);
      return ambiguous({ stage: 'REMOTE_REF_READ', expected_tip: actualResult.value.expected_tip, commit_sha: actualResult.value.tip, event_id: last.event_id, event_hash: last.event_hash, idempotency_id: last.idempotency_id, receipt_sha256: actualResult.receipt_sha256 });
    }, reason: 'LEDGER_APPEND_AMBIGUOUS', pauseReason: 'EVIDENCE_REF_CONFLICT', action: 'MANUAL_CONTROLLER_STOP' },
  ];
  for (const scenario of cases) await t.test(scenario.label, async () => {
    let deliveredEnvelope = null;
    await withObservedK1Prefix(async ({ base, command, core, afterWorker, faultHits, gatewayEvents, localPausePath, observedStageRequests, observedValidationActualResults, observedValidationResults }) => {
      const runRequest = { change_id: command.change_id, expected_state_version: afterWorker.state_version, expected_state_hash: afterWorker.state_hash };
      const beforeState = await base.state.readState({ change_id: command.change_id });
      assert.equal(beforeState.kind, 'OK');
      const result = await core.run(runRequest);
      assert.deepEqual(faultHits, [`ledger:readRemote:${scenario.label}`], 'the exact closed Ledger envelope is injected once after the real Worker');
      assert.deepEqual(Object.keys(deliveredEnvelope).sort(), ['kind', 'partial_receipt', 'reason']);
      if (deliveredEnvelope.kind === 'AMBIGUOUS') assert.deepEqual(Object.keys(deliveredEnvelope.partial_receipt).sort(), ['commit_sha', 'event_hash', 'event_id', 'expected_tip', 'idempotency_id', 'receipt_sha256', 'stage']);
      else assert.equal(deliveredEnvelope.partial_receipt, null, 'Ledger UNAVAILABLE may carry the explicitly allowed null partial receipt');
      assert.equal(observedValidationActualResults.length, 1, 'the affected real child closes before the Ledger failure boundary');
      assertClosedExecutionGatewayResult(observedValidationActualResults[0], ['COMPLETED', 'FAIL', 'NONZERO_EXIT']);
      assert.deepEqual(observedValidationResults, observedValidationActualResults, 'the actual non-PASS tuple reaches Core without receipt substitution');
      const validationComplete = gatewayEvents.find(event => event.gateway === 'validation' && event.edge === 'COMPLETE' && event.actual_result?.value?.validation_id === 'regression-affected-suite');
      const ledgerArm = gatewayEvents.find(event => event.gateway === 'test-control' && event.method === 'ledger-post-validation' && event.validation_id === 'regression-affected-suite');
      const faultRead = gatewayEvents.find(event => event.gateway === 'ledger' && event.method === 'readRemote' && event.edge === 'COMPLETE' && event.faulted === true);
      assert.ok(validationComplete && ledgerArm && faultRead && validationComplete.sequence < ledgerArm.sequence && ledgerArm.sequence < faultRead.sequence, 'the closed Ledger fault occurs only after the target real non-PASS child completed');
      assert.deepEqual(faultRead.result, deliveredEnvelope, 'Core receives the exact fixture-produced unavailable/ambiguous envelope');
      assert.equal(gatewayEvents.some(event => event.gateway === 'ledger' && event.method === 'prepareAppend' && event.sequence > faultRead.sequence), false, 'unproven Ledger authority forbids failure or BLOCKED append attempts');
      assert.equal(result.outcome, 'BLOCKED');
      assert.equal(result.payload.blocked_reason, scenario.reason);
      assert.equal(result.payload.next_action, scenario.action);
      const priorDurable = JSON.parse(beforeState.value.bytes);
      assert.ok(result.state === null || result.state === priorDurable.macro_state, 'a local pause may return null or the exact retained macro-state, never a fabricated durable state');
      assert.notEqual(result.state, 'BLOCKED', 'an unproven failure record cannot claim durable BLOCKED State');
      if (result.state !== null) {
        assert.equal(result.state_version, priorDurable.state_version);
        assert.equal(result.state_hash, sha256(canonicalJson(priorDurable)));
      }
      assert.equal(result.payload.blocked_event_id, null, 'no unproven BLOCKED event identity is returned');
      const afterState = await base.state.readState({ change_id: command.change_id });
      assert.deepEqual(afterState, beforeState, 'the exact pre-run State bytes/hash survive the unavailable or ambiguous Ledger boundary');
      const durable = JSON.parse(afterState.value.bytes);
      assert.equal(durable.macro_state, 'EXECUTING'); assert.equal(durable.phase, 'REGRESSION');
      const pauseWrites = gatewayEvents.filter(event => event.gateway === 'state' && event.method === 'writeLocalPause' && event.edge === 'COMPLETE' && event.sequence > faultRead.sequence);
      const pauseReads = gatewayEvents.filter(event => event.gateway === 'state' && event.method === 'readLocalPause' && event.edge === 'COMPLETE' && event.sequence > faultRead.sequence);
      assert.equal(pauseWrites.length, 1, 'both Evidence-unavailable replay and ambiguity manual-stop persist one local diagnostic');
      assert.equal(pauseReads.length, 1, 'the local diagnostic is read back before the stop returns');
      assert.ok(pauseWrites[0].sequence < pauseReads[0].sequence, 'local pause write completes before exact readback');
      assert.equal(await exists(localPausePath), true, 'the controlled Test-owned file is evidence of Core local-pause consumption only');
      const pauseBytes = await readFile(localPausePath, 'utf8');
      const diagnostic = JSON.parse(pauseBytes);
      assert.equal(pauseBytes, canonicalJson(diagnostic));
      assert.deepEqual(Object.keys(diagnostic).sort(), ['change_id', 'command_id', 'created_at', 'diagnostic_id', 'event_id', 'expected_event_hash', 'expected_evidence_tip', 'next_action', 'operation', 'reason', 'request_idempotency_id', 'request_sha256', 'schema_version', 'state_hash', 'state_version', 'supersedes_diagnostic_id'].sort());
      assert.equal(diagnostic.schema_version, '1.0');
      assert.equal(diagnostic.change_id, command.change_id);
      assert.equal(diagnostic.command_id, command.command_id);
      assert.equal(diagnostic.reason, scenario.pauseReason);
      assert.equal(diagnostic.operation, 'run');
      assert.equal(diagnostic.next_action, scenario.action);
      assert.equal(diagnostic.request_sha256, sha256(canonicalJson(runRequest)));
      assert.equal(typeof diagnostic.request_idempotency_id, 'string'); assert.ok(diagnostic.request_idempotency_id.length > 0);
      assert.equal(diagnostic.event_id, null); assert.equal(diagnostic.expected_event_hash, null);
      assert.equal(diagnostic.state_version, afterWorker.state_version); assert.equal(diagnostic.state_hash, afterWorker.state_hash);
      assert.equal(diagnostic.created_at, '2026-09-06T00:00:30.000Z');
      assert.equal(diagnostic.supersedes_diagnostic_id, null);
      assert.equal(result.payload.local_pause_id, diagnostic.diagnostic_id, 'the public stop returns the exact read-back local diagnostic identity');
      assert.equal(pauseWrites[0].result.value.bytes, pauseBytes); assert.equal(pauseWrites[0].result.value.sha256, sha256(pauseBytes));
      assert.equal(pauseReads[0].result.value.bytes, pauseBytes); assert.equal(pauseReads[0].result.value.sha256, sha256(pauseBytes));
      assert.equal(observedStageRequests.length, 0, 'neither Ledger failure can reach STAGE');
    }, {
      stopAfterWorker: true,
      armLedgerFaultAfterValidationId: 'regression-affected-suite',
      validationArgvById: { 'regression-affected-suite': [NODE, '-e', 'process.stderr.write("affected failed before ledger\\n"); process.exit(23)'] },
      transformLedgerResult: async ({ method, actualResult, faultHits }) => {
        if (method !== 'readRemote' || faultHits.length) return actualResult;
        assert.equal(actualResult.kind, 'OK', 'the failure envelope replaces one healthy post-Worker remote read');
        faultHits.push(`ledger:readRemote:${scenario.label}`);
        deliveredEnvelope = scenario.makeEnvelope(actualResult);
        return structuredClone(deliveredEnvelope);
      },
    });
  });
});

test('RED-M2-006 / TEST-M2-011 / 011-L08..L09: a proven BLOCKED event followed by BLOCKED-State CAS failure retains prior State and writes one local pause', async () => {
  let stateFaultArmed = false;
  await withObservedK1Prefix(async ({ base, command, core, restartCore, afterWorker, ledger, localPausePath, gatewayEvents, faultHits, observedStageRequests, observedValidationActualResults }) => {
    const before = await base.state.readState({ change_id: command.change_id }); assert.equal(before.kind, 'OK');
    assert.equal(stateFaultArmed, false); stateFaultArmed = true;
    const runRequest = { change_id: command.change_id, expected_state_version: afterWorker.state_version, expected_state_hash: afterWorker.state_hash };
    const result = await core.run(runRequest);
    assert.deepEqual(faultHits, ['state:BLOCKED-CAS']); assert.equal(observedValidationActualResults.length, 1); assertClosedExecutionGatewayResult(observedValidationActualResults[0], ['COMPLETED', 'FAIL', 'NONZERO_EXIT']);
    assert.equal(result.outcome, 'BLOCKED'); assert.notEqual(result.state, 'BLOCKED', 'failed BLOCKED State persistence cannot claim a durable BLOCKED macro-state'); assert.equal(result.payload.blocked_reason, 'POINTER_STATE_CONFLICT'); assert.equal(result.payload.next_action, 'MANUAL_CONTROLLER_STOP');
    const remote = decodeRemoteLedger(await readLocalLedger(ledger, command.change_id)); const failure = remote.records.findLast(record => record.event_class === 'VALIDATION_RESULT' && record.detail?.validation_id === 'regression-affected-suite'); const blocked = remote.records.findLast(record => record.event_class === 'BLOCKED');
    assert.ok(failure && blocked); assert.equal(failure.detail.failure_code, 'NONZERO_EXIT'); assert.equal(blocked.detail.blocked_reason, 'REGRESSION_FAILURE'); assert.equal(blocked.detail.next_action, 'REVISION'); assert.equal(blocked.sequence, failure.sequence + 1, 'the proven BLOCKED event immediately follows the actual Regression-failure receipt'); assert.equal(result.payload.blocked_event_id, blocked.event_id, 'the result may truthfully retain only the already-proven remote BLOCKED identity');
    const blockedReadback = gatewayEvents.find(event => event.edge === 'COMPLETE' && event.gateway === 'ledger' && event.method === 'readRemoteAppend' && event.result?.value?.event_id === blocked.event_id);
    const failedStateStart = gatewayEvents.find(event => event.edge === 'START' && event.gateway === 'state' && event.method === 'writeState' && (() => { try { return JSON.parse(Buffer.from(event.request.next_bytes).toString('utf8')).macro_state === 'BLOCKED'; } catch { return false; } })());
    const failedStateComplete = gatewayEvents.find(event => event.edge === 'COMPLETE' && event.gateway === 'state' && event.method === 'writeState' && event.actual_result?.kind === 'CONFLICT' && event.sequence > blockedReadback.sequence); const pauseWrite = gatewayEvents.find(event => event.edge === 'COMPLETE' && event.gateway === 'state' && event.method === 'writeLocalPause' && event.sequence > failedStateComplete.sequence); const pauseRead = gatewayEvents.find(event => event.edge === 'COMPLETE' && event.gateway === 'state' && event.method === 'readLocalPause' && event.sequence > pauseWrite.sequence);
    assert.ok(blockedReadback.sequence < failedStateStart.sequence && failedStateStart.sequence < failedStateComplete.sequence && failedStateComplete.sequence < pauseWrite.sequence && pauseWrite.sequence < pauseRead.sequence, 'BLOCKED readback completes before failed State CAS and exact local-pause write/readback');
    assert.deepEqual(await base.state.readState({ change_id: command.change_id }), before, 'the exact pre-failure State bytes/hash remain authoritative locally'); assert.equal(result.state_version, JSON.parse(before.value.bytes).state_version); assert.equal(result.state_hash, before.value.sha256); assert.equal(await exists(localPausePath), true); const pauseBytes = await readFile(localPausePath, 'utf8'); const pause = JSON.parse(pauseBytes); assert.equal(pauseBytes, canonicalJson(pause)); assert.equal(pause.reason, 'POINTER_STATE_CONFLICT'); assert.equal(pause.next_action, 'MANUAL_CONTROLLER_STOP'); assert.equal(pause.operation, 'run'); assert.equal(pause.request_sha256, sha256(canonicalJson(runRequest))); assert.equal(pause.state_version, JSON.parse(before.value.bytes).state_version); assert.equal(pause.state_hash, before.value.sha256); assert.equal(pause.event_id, blocked.event_id); assert.equal(pause.expected_event_hash, blocked.event_hash); assert.equal(pause.expected_evidence_tip, blockedReadback.actual_result.value.tip); assert.equal(result.payload.local_pause_id, pause.diagnostic_id, 'only the read-back diagnostic ID may be exposed publicly');
    const pointerBeforeNoRetry = await base.state.readPointer({}); const noRetryCounts = { events: remote.records.length, blocked: remote.records.filter(record => record.event_class === 'BLOCKED').length, writes: gatewayEvents.filter(event => event.edge === 'START' && event.gateway === 'state' && ['writePointer', 'writeState', 'writeLocalPause'].includes(event.method)).length, agents: gatewayEvents.filter(event => event.edge === 'START' && event.gateway === 'validation').length };
    const later = await core.run(runRequest); assert.equal(later.outcome, 'BLOCKED');
    const fresh = restartCore(); const afterRestart = await fresh.run(runRequest); assert.equal(afterRestart.outcome, 'BLOCKED');
    const c1Blocked = await fresh.applyControllerCommand(signed(command)); assert.equal(c1Blocked.outcome, 'REJECTED'); assert.equal(c1Blocked.error_code, 'STATE_CONFLICT', 'C1 reauthentication cannot bypass a C3 local-pause stop');
    const afterNoRetry = decodeRemoteLedger(await readLocalLedger(ledger, command.change_id)); assert.equal(afterNoRetry.records.length, noRetryCounts.events, 'later run/restart/C1 appends no event of any class'); assert.equal(afterNoRetry.records.filter(record => record.event_class === 'BLOCKED').length, noRetryCounts.blocked, 'later run/restart/C1 never appends a duplicate failure or BLOCKED event'); assert.equal(gatewayEvents.filter(event => event.edge === 'START' && event.gateway === 'state' && ['writePointer', 'writeState', 'writeLocalPause'].includes(event.method)).length, noRetryCounts.writes, 'later run/restart/C1 neither retries State CAS nor clears/replaces the diagnostic'); assert.equal(gatewayEvents.filter(event => event.edge === 'START' && event.gateway === 'validation').length, noRetryCounts.agents, 'later run/restart/C1 launches no Agent'); assert.deepEqual(await base.state.readPointer({}), pointerBeforeNoRetry); assert.equal(await readFile(localPausePath, 'utf8'), pauseBytes, 'later run/restart/C1 retains the exact diagnostic bytes');
    assert.equal(observedStageRequests.length, 0); assert.equal(gatewayEvents.some(event => event.edge === 'START' && (event.gateway === 'pull_request' || event.gateway === 'handoff')), false, 'State persistence failure starts no dependent stage or publication effect');
  }, {
    stopAfterWorker: true,
    validationArgvById: { 'regression-affected-suite': [NODE, '-e', 'process.exit(23)'] },
    transformStateRequest: async ({ method, request, faultHits }) => {
      if (!stateFaultArmed || method !== 'writeState' || faultHits.length) return request;
      let next; try { next = JSON.parse(Buffer.from(request.next_bytes).toString('utf8')); } catch { return request; }
      if (next.macro_state !== 'BLOCKED') return request;
      faultHits.push('state:BLOCKED-CAS'); return { ...request, expected_sha256: '0'.repeat(64) };
    },
  });
});

for (const pauseFailure of ['writeLocalPause', 'readLocalPause']) test(`RED-M2-006 / TEST-M2-011 / 011-L08..L09: ${pauseFailure} failure after proven BLOCKED evidence exposes no diagnostic identity`, async () => {
  let stateFaultArmed = false; let stateCasFailed = false; let pauseFaulted = false;
  await withObservedK1Prefix(async ({ base, command, core, restartCore, afterWorker, ledger, localPausePath, gatewayEvents, faultHits, observedStageRequests }) => {
    const before = await base.state.readState({ change_id: command.change_id }); assert.equal(before.kind, 'OK'); stateFaultArmed = true;
    const runRequest = { change_id: command.change_id, expected_state_version: afterWorker.state_version, expected_state_hash: afterWorker.state_hash };
    const result = await core.run(runRequest);
    assert.deepEqual(faultHits, [`state:BLOCKED-CAS:${pauseFailure}`]); assert.equal(stateCasFailed, true); assert.equal(pauseFaulted, true); assert.equal(result.outcome, 'BLOCKED'); assert.equal(result.payload.blocked_reason, 'POINTER_STATE_CONFLICT'); assert.equal(result.payload.next_action, 'MANUAL_CONTROLLER_STOP'); assert.equal(result.payload.local_pause_id, null, 'failed local-pause persistence must not claim a diagnostic ID');
    assert.deepEqual(await base.state.readState({ change_id: command.change_id }), before, 'failed local-pause persistence leaves original State authoritative');
    const remote = decodeRemoteLedger(await readLocalLedger(ledger, command.change_id)); const blocked = remote.records.findLast(record => record.event_class === 'BLOCKED'); assert.ok(blocked); assert.equal(result.payload.blocked_event_id, blocked.event_id, 'the real already-read BLOCKED event remains the only returned durable evidence');
    const blockedReadback = gatewayEvents.find(event => event.edge === 'COMPLETE' && event.gateway === 'ledger' && event.method === 'readRemoteAppend' && event.result?.value?.event_id === blocked.event_id); const failedStateCas = blockedReadback && gatewayEvents.find(event => event.edge === 'COMPLETE' && event.gateway === 'state' && event.method === 'writeState' && event.actual_result?.kind === 'CONFLICT' && event.sequence > blockedReadback.sequence); assert.ok(blockedReadback && failedStateCas && blockedReadback.sequence < failedStateCas.sequence, 'the selected local-pause operation follows the actual BLOCKED readback and failed State CAS');
    const pauseWrite = gatewayEvents.find(event => event.edge === 'COMPLETE' && event.gateway === 'state' && event.method === 'writeLocalPause' && event.sequence > failedStateCas.sequence); assert.ok(pauseWrite, 'the selected local-pause write is the one after the failed BLOCKED-State CAS'); const pauseRead = gatewayEvents.find(event => event.edge === 'COMPLETE' && event.gateway === 'state' && event.method === 'readLocalPause' && event.sequence > pauseWrite.sequence);
    if (pauseFailure === 'writeLocalPause') {
      assert.equal(pauseWrite.actual_result.kind, 'CONFLICT', 'writeLocalPause is a real failed CAS write, not a lost response'); assert.equal(pauseWrite.result.kind, 'CONFLICT');
    } else {
      assert.equal(pauseWrite.actual_result.kind, 'OK', 'readLocalPause loss follows one physically successful pause write'); assert.equal(pauseWrite.result.kind, 'OK'); assert.ok(pauseRead && pauseRead.actual_result.kind === 'OK' && pauseRead.result.kind === 'UNAVAILABLE', 'readLocalPause is a lost response over the exact post-write readback');
    }
    const pauseBytes = await readFile(localPausePath, 'utf8').catch(error => error?.code === 'ENOENT' ? null : Promise.reject(error)); if (pauseFailure === 'writeLocalPause') assert.equal(pauseBytes, null, 'the failed local-pause CAS leaves the diagnostic absent and local_pause_id null'); const afterFailure = decodeRemoteLedger(await readLocalLedger(ledger, command.change_id)); const noRetry = { events: afterFailure.records.length, stateWrites: gatewayEvents.filter(event => event.edge === 'START' && event.gateway === 'state' && ['writePointer', 'writeState', 'writeLocalPause'].includes(event.method)).length, agents: gatewayEvents.filter(event => event.edge === 'START' && event.gateway === 'validation').length };
    const pointerBeforeNoRetry = await base.state.readPointer({});
    const later = await core.run(runRequest); assert.equal(later.outcome, 'BLOCKED'); const restarted = await restartCore().run(runRequest); assert.equal(restarted.outcome, 'BLOCKED'); const c1 = await restartCore().applyControllerCommand(signed(command)); assert.equal(c1.outcome, 'REJECTED'); assert.equal(c1.error_code, 'STATE_CONFLICT', 'C1 cannot bypass an unpersisted-or-unreadable C3 stop');
    const afterNoRetry = decodeRemoteLedger(await readLocalLedger(ledger, command.change_id)); assert.equal(afterNoRetry.records.length, noRetry.events, 'later run/restart/C1 appends no event of any class'); assert.equal(gatewayEvents.filter(event => event.edge === 'START' && event.gateway === 'state' && ['writePointer', 'writeState', 'writeLocalPause'].includes(event.method)).length, noRetry.stateWrites, 'later run/restart/C1 performs no pointer/State/local-pause write'); assert.equal(gatewayEvents.filter(event => event.edge === 'START' && event.gateway === 'validation').length, noRetry.agents, 'later run/restart/C1 launches no Agent'); assert.deepEqual(await base.state.readPointer({}), pointerBeforeNoRetry); assert.equal(await readFile(localPausePath, 'utf8').catch(error => error?.code === 'ENOENT' ? null : Promise.reject(error)), pauseBytes, 'later run/restart/C1 leaves the actual local-pause bytes unchanged');
    assert.equal(observedStageRequests.length, 0); assert.equal(gatewayEvents.some(event => event.edge === 'START' && (event.gateway === 'pull_request' || event.gateway === 'handoff')), false, 'unpersisted local pause cannot enter later delivery work');
  }, {
    stopAfterWorker: true,
    validationArgvById: { 'regression-affected-suite': [NODE, '-e', 'process.exit(23)'] },
    transformStateRequest: async ({ method, request, faultHits }) => {
      if (!stateFaultArmed) return request;
      if (method === 'writeState' && faultHits.length === 0) { let next; try { next = JSON.parse(Buffer.from(request.next_bytes).toString('utf8')); } catch { return request; }
        if (next.macro_state === 'BLOCKED') { faultHits.push(`state:BLOCKED-CAS:${pauseFailure}`); stateCasFailed = true; return { ...request, expected_sha256: '0'.repeat(64) }; }
      }
      if (pauseFailure === 'writeLocalPause' && stateCasFailed && method === 'writeLocalPause') { pauseFaulted = true; return { ...request, expected_sha256: '0'.repeat(64) }; }
      return request;
    },
    transformStateResult: async ({ method, actualResult, faultHits }) => {
      if (pauseFailure !== 'readLocalPause' || pauseFaulted || !stateCasFailed || method !== 'readLocalPause' || actualResult?.kind !== 'OK') return actualResult;
      pauseFaulted = true; return unavailable(null);
    },
  });
});

const ordinaryValidatorNonEligible = ['CONTRACT', 'ARCHITECTURE', 'SCOPE', 'PATH', 'DEPENDENCY', 'PERMISSION', 'HOST', 'IDENTITY', 'EVIDENCE', 'UNKNOWN'];
const ordinaryValidatorEligibilityCases = [
    ...ordinaryValidatorNonEligible.map(classification => ({ label: classification, findings: [{ classification }], disposition: 'OUT_OF_SCOPE' })),
    { label: 'mixed IMPLEMENTATION_IN_SCOPE plus CONTRACT', findings: [{ classification: 'IMPLEMENTATION_IN_SCOPE' }, { classification: 'CONTRACT' }], disposition: 'OUT_OF_SCOPE' },
    { label: 'IMPLEMENTATION_IN_SCOPE outside signed scope', findings: [{ classification: 'IMPLEMENTATION_IN_SCOPE', paths: ['outside.txt'] }], disposition: 'UNSPECIFIED_STOP' },
    { label: 'IMPLEMENTATION_IN_SCOPE missing requirement ids', findings: [{ classification: 'IMPLEMENTATION_IN_SCOPE', requirement_ids: [] }], disposition: 'EVIDENCE_STOP' },
    { label: 'IMPLEMENTATION_IN_SCOPE missing acceptance ids', findings: [{ classification: 'IMPLEMENTATION_IN_SCOPE', acceptance_ids: [] }], disposition: 'EVIDENCE_STOP' },
    { label: 'IMPLEMENTATION_IN_SCOPE missing evidence refs', findings: [{ classification: 'IMPLEMENTATION_IN_SCOPE', evidence_refs: [] }], disposition: 'EVIDENCE_STOP' },
    { label: 'wrong artifact change identity', findings: [{ classification: 'IMPLEMENTATION_IN_SCOPE' }], change_id: 'CHG-wrong-artifact-change', disposition: 'UNSPECIFIED_STOP' },
    { label: 'wrong artifact Candidate identity', findings: [{ classification: 'IMPLEMENTATION_IN_SCOPE' }], candidate_sha: 'e'.repeat(40), disposition: 'UNSPECIFIED_STOP' },
    { label: 'IMPLEMENTATION_IN_SCOPE wrong Validator Head', findings: [{ classification: 'IMPLEMENTATION_IN_SCOPE' }], validator_head: 'f'.repeat(40), disposition: 'UNSPECIFIED_STOP' },
    { label: 'settlement PASS conflicts with artifact FAIL verdict', findings: [{ classification: 'IMPLEMENTATION_IN_SCOPE' }], settlement_status: 'PASS', disposition: 'UNSPECIFIED_STOP' },
    { label: 'PASS artifact carries a finding', findings: [{ classification: 'IMPLEMENTATION_IN_SCOPE' }], verdict: 'PASS', disposition: 'UNSPECIFIED_STOP' },
    { label: 'FAIL artifact omits every finding', findings: [], disposition: 'UNSPECIFIED_STOP' },
    { label: 'unknown classification', findings: [{ classification: 'NOT_A_CLASSIFICATION' }], disposition: 'SETTLEMENT_REJECTED' },
];
for (const { label, findings: findingInputs, change_id, candidate_sha, validator_head, verdict = 'FAIL', settlement_status = verdict, disposition } of ordinaryValidatorEligibilityCases) test(`RED-M2-004 / TEST-M2-006 / TEST-M2-008 / 008-L01: ${label}`, async () => {
    await withObservedK1Prefix(async ({ base, command, core, candidateTransition, ordinaryRoleResultRoot }) => {
      const candidateValidation = await core.run({ change_id: command.change_id, expected_state_version: candidateTransition.state_version, expected_state_hash: candidateTransition.state_hash });
      assert.equal(candidateValidation.outcome, 'ADVANCED', 'the public Candidate validation must complete before this ordinary controlled Validator boundary');
      assert.equal(candidateValidation.payload.to_phase, 'VALIDATOR');
      const validatorAction = await core.run({ change_id: command.change_id, expected_state_version: candidateValidation.state_version, expected_state_hash: candidateValidation.state_hash });
      assert.equal(validatorAction.outcome, 'AGENT_ACTION');
      const action = validatorAction.payload.action;
      assert.equal(action.role, 'juaner_validator');
      const before = await base.state.readState({ change_id: command.change_id });
      assert.equal(before.kind, 'OK');
      assert.equal(JSON.parse(before.value.bytes).authorization_cycle.auto_repair_attempt, 0, 'the eligible-repair budget starts at zero before ordinary Validator RESULT');
      const { action_kind, ...binding } = action;
      const started = await core.settlement({ change_id: command.change_id, expected_state_version: validatorAction.state_version, expected_state_hash: validatorAction.state_hash, settlement: { ...binding, stage: 'STARTED', observed_child_id: `ordinary-validator-${label}` } });
      assert.equal(started.outcome, 'WAITING');
      const findings = findingInputs.map((input, index) => ({
        finding_id: `finding-${String(index + 1).padStart(2, '0')}`,
        classification: input.classification,
        requirement_ids: input.requirement_ids ?? ['REQ-M2-004'],
        acceptance_ids: input.acceptance_ids ?? ['AC-M2-004-02'],
        paths: input.paths ?? ['tracked.txt'],
        summary: `controlled ${label}`,
        evidence_refs: input.evidence_refs ?? [{ kind: 'TEST', id: '002-L01', sha256: sha256(`ordinary-${label}-${index}`), subject_sha: action.subject_sha }],
      }));
      const artifact = { schema_version: '1.0', change_id: change_id ?? command.change_id, candidate_sha: candidate_sha ?? action.subject_sha, validator_head: validator_head ?? action.subject_sha, verdict, findings, risks: [], unverified: [], open_questions: [] };
      const artifactBytes = Buffer.from(canonicalJson(artifact));
      const artifactPath = path.join(ordinaryRoleResultRoot, `${action.correlation_id}.validator.json`);
      await mkdir(path.dirname(artifactPath), { recursive: true }); await writeFile(artifactPath, artifactBytes);
      assert.deepEqual(JSON.parse(await readFile(artifactPath, 'utf8')), artifact, 'the controlled ordinary Agent boundary supplies actual canonical Test-owned artifact bytes, not an in-memory proof substitute');
      const settled = await core.settlement({ change_id: command.change_id, expected_state_version: started.state_version, expected_state_hash: started.state_hash, settlement: { ...binding, stage: 'RESULT', observed_child_id: `ordinary-validator-${label}`, status: settlement_status, artifact_path: artifactPath, artifact_sha256: sha256(artifactBytes), validator_artifact: artifact } });
      assert.notEqual(settled.outcome, 'ADVANCED', 'no invalid or ineligible Validator finding can request repair Test/Worker');
      if (disposition === 'OUT_OF_SCOPE') {
        assert.equal(settled.outcome, 'BLOCKED');
        assert.equal(settled.payload.blocked_reason, 'VALIDATOR_OUT_OF_SCOPE_FAIL', 'Design 11.2 assigns this only to a well-formed ineligible finding');
      } else if (disposition === 'EVIDENCE_STOP') {
        assert.equal(settled.outcome, 'BLOCKED');
        assert.equal(settled.payload.blocked_reason, 'EVIDENCE_CONFLICT', 'Design 11.2 assigns missing or contradictory required evidence to EVIDENCE_CONFLICT');
      } else if (disposition === 'SETTLEMENT_REJECTED') {
        assert.equal(settled.outcome, 'REJECTED', 'an enum outside the closed ValidatorArtifactV1 shape is rejected at settlement admission');
        assert.equal(settled.error_code, 'SETTLEMENT_INVALID');
      }
      const after = await base.state.readState({ change_id: command.change_id });
      assert.equal(after.kind, 'OK');
      const state = JSON.parse(after.value.bytes);
      assert.equal(state.authorization_cycle.auto_repair_attempt, 0, 'every pre-consumption eligibility rejection retains the zero budget');
      if (disposition !== 'SETTLEMENT_REJECTED') assert.equal(state.pending_agent, null, 'a durable pre-consumption stop cannot leave a repair launch pending');
    });
  });
test('RED-M2-004 / TEST-M2-008 / 008-L08..L09: eligible IMPLEMENTATION_IN_SCOPE FAIL reads RESULT and receipt before consuming exactly 0 -> 1 and requesting only Test RED', async () => {
    await withObservedK1Prefix(async ({ base, command, core, candidateTransition, ledger, ordinaryRoleResultRoot, observedLedgerReadbacks, gatewayEvents }) => {
      const candidateValidation = await core.run({ change_id: command.change_id, expected_state_version: candidateTransition.state_version, expected_state_hash: candidateTransition.state_hash });
      assert.equal(candidateValidation.outcome, 'ADVANCED');
      const validatorAction = await core.run({ change_id: command.change_id, expected_state_version: candidateValidation.state_version, expected_state_hash: candidateValidation.state_hash });
      assert.equal(validatorAction.outcome, 'AGENT_ACTION');
      const action = validatorAction.payload.action; const { action_kind, ...binding } = action;
      const before = await base.state.readState({ change_id: command.change_id }); assert.equal(before.kind, 'OK');
      assert.equal(JSON.parse(before.value.bytes).authorization_cycle.auto_repair_attempt, 0, 'the ordinary eligible Validator starts before any repair budget is consumed');
      const started = await core.settlement({ change_id: command.change_id, expected_state_version: validatorAction.state_version, expected_state_hash: validatorAction.state_hash, settlement: { ...binding, stage: 'STARTED', observed_child_id: 'ordinary-validator-eligible' } });
      assert.equal(started.outcome, 'WAITING', 'the public STARTED receipt is durable before ordinary RESULT');
      const artifact = { schema_version: '1.0', change_id: command.change_id, candidate_sha: action.subject_sha, validator_head: action.subject_sha, verdict: 'FAIL', findings: [{ finding_id: 'finding-eligible', classification: 'IMPLEMENTATION_IN_SCOPE', requirement_ids: ['REQ-M2-004'], acceptance_ids: ['AC-M2-004-02'], paths: ['tracked.txt'], summary: 'ordinary eligible repair finding', evidence_refs: [{ kind: 'TEST', id: '002-L01', sha256: sha256('ordinary-eligible'), subject_sha: action.subject_sha }] }], risks: [], unverified: [], open_questions: [] };
      const artifactBytes = Buffer.from(canonicalJson(artifact)); const artifactPath = path.join(ordinaryRoleResultRoot, `${action.correlation_id}.eligible.json`);
      await mkdir(path.dirname(artifactPath), { recursive: true }); await writeFile(artifactPath, artifactBytes);
      const readbackStart = observedLedgerReadbacks.length;
      const gatewayStart = gatewayEvents.length;
      const settled = await core.settlement({ change_id: command.change_id, expected_state_version: started.state_version, expected_state_hash: started.state_hash, settlement: { ...binding, stage: 'RESULT', observed_child_id: 'ordinary-validator-eligible', status: 'FAIL', artifact_path: artifactPath, artifact_sha256: sha256(artifactBytes), validator_artifact: artifact } });
      assert.equal(settled.outcome, 'ADVANCED'); assert.equal(settled.payload.to_phase, 'TEST_RED');
      const sourceReadbacks = observedLedgerReadbacks.slice(readbackStart);
      const agentResultReadback = sourceReadbacks.find(({ event }) => event.event_class === 'AGENT_RUN' && event.detail.stage === 'RESULT' && event.detail.correlation_id === action.correlation_id);
      assert.ok(agentResultReadback, 'the settlement source Agent RESULT must first be read back from the real local Ledger');
      const receiptReadback = sourceReadbacks.find(({ event }) => event.event_class === 'VALIDATION_RESULT' && event.detail.idempotency_id === action.idempotency_id);
      assert.ok(receiptReadback, 'the settlement source validation receipt must first be read back from the real local Ledger');
      assert.equal(receiptReadback.event.sequence, agentResultReadback.event.sequence + 1, 'the source receipt follows its Agent RESULT in the exact remote Ledger sequence');
      const sourceCompletion = gatewayEvents.slice(gatewayStart).find(event => event.edge === 'COMPLETE' && event.gateway === 'ledger' && event.method === 'readRemoteAppend' && event.result?.value?.event_id === receiptReadback.event.event_id);
      assert.ok(sourceCompletion, 'the observed Ledger readback completion identifies the exact receipt used as the repair source');
      const budgetWrite = gatewayEvents.slice(gatewayStart).find(event => {
        if (event.edge !== 'START' || event.gateway !== 'state' || event.method !== 'writeState') return false;
        const next = JSON.parse(Buffer.from(event.request.next_bytes).toString('utf8'));
        return next.authorization_cycle?.auto_repair_attempt === 1;
      });
      assert.ok(budgetWrite, 'the repair transition persists its one-unit budget consumption through the real State gateway');
      const resultCompletion = gatewayEvents.slice(gatewayStart).find(event => event.edge === 'COMPLETE' && event.gateway === 'ledger' && event.method === 'readRemoteAppend' && event.result?.value?.event_id === agentResultReadback.event.event_id);
      assert.ok(resultCompletion, 'the observed Ledger readback completion identifies the exact Agent RESULT used as the repair source');
      assert.ok(resultCompletion.sequence < budgetWrite.sequence && sourceCompletion.sequence < budgetWrite.sequence, 'both real Agent RESULT and receipt readbacks complete before the 0 -> 1 budget write begins');
      const remote = await readLocalLedger(ledger, command.change_id); assert.equal(remote.kind, 'OK');
      const records = Buffer.from(remote.value.ledger_bytes_base64, 'base64').subarray(0, -1).toString('utf8').split('\n').map(line => JSON.parse(line));
      const resultIndex = records.findLastIndex(record => record.event_class === 'AGENT_RUN' && record.detail.stage === 'RESULT' && record.detail.correlation_id === action.correlation_id);
      const receiptIndex = resultIndex + 1;
      assert.ok(resultIndex >= 0, 'the eligible source Agent RESULT is a remotely read-back Ledger record');
      assert.equal(records[receiptIndex]?.event_class, 'VALIDATION_RESULT', 'the eligible source receipt immediately follows its Agent RESULT before budget transition');
      assert.equal(records[receiptIndex]?.detail?.idempotency_id, action.idempotency_id);
      const after = await base.state.readState({ change_id: command.change_id }); assert.equal(after.kind, 'OK'); const state = JSON.parse(after.value.bytes);
      assert.equal(state.authorization_cycle.auto_repair_attempt, 1, 'the one eligible ordinary Validator failure consumes exactly one budget');
      const repairTest = await core.run({ change_id: command.change_id, expected_state_version: settled.state_version, expected_state_hash: settled.state_hash });
      assert.equal(repairTest.outcome, 'AGENT_ACTION'); assert.equal(repairTest.payload.action.role, 'juaner_test');
    });
});

test('RED-M2-005 / TEST-M2-010 / 010-L01: real K1 prefix consumes an ordinary controlled PR/Handoff boundary with one independently derived delivery id', async () => {
  const controlledRoot = await mkdtemp(path.join(os.tmpdir(), 'juanerai-m2-delivery-boundary-'));
  const handoffPath = path.join(controlledRoot, 'handoff.json');
  const prCalls = []; const handoffCalls = [];
  const pull_request = {
    async queryCurrent(request) { prCalls.push({ operation: 'queryCurrent', request: structuredClone(request) }); return absent('current-pr'); },
    async createOrReuse(request) { prCalls.push({ operation: 'createOrReuse', request: structuredClone(request) }); return ok({ number: 73, url: 'https://invalid.example/pr/73', base: request.base, head_branch: request.head_branch, head_sha: request.head_sha, review_ready: true }); },
    async readback(request) { prCalls.push({ operation: 'readback', request: structuredClone(request) }); return ok({ number: request.number, url: 'https://invalid.example/pr/73', base: 'main', head_branch: 'work/mac-mini/m2-regression', head_sha: request.expected_head, review_ready: true }); },
  };
  const handoff = { async writeReadback(request) {
    handoffCalls.push(structuredClone(request));
    assert.deepEqual(Object.keys(request).sort(), ['expected_sha256', 'handoff_bytes'], 'the frozen Foundation/CCR003 Handoff request remains the closed two-field boundary');
    await writeFile(handoffPath, request.handoff_bytes);
    const readback = await readFile(handoffPath);
    assert.deepEqual(readback, Buffer.from(request.handoff_bytes), 'the controlled Handoff boundary compares exact bytes across the Buffer/Uint8Array boundary');
    const document = JSON.parse(readback.toString('utf8'));
    assert.match(document.delivery_id, /^delivery-[0-9a-f]{64}$/, 'the gateway reads the formatted identity from canonical Handoff bytes rather than a third request field');
    assert.equal(document.idempotency_id, document.delivery_id);
    return ok({ handoff_sha256: sha256(readback), delivery_id: document.delivery_id });
  } };
  try {
    await withObservedK1Prefix(async ({ base, command, core, candidateEvent, candidateTransition, coreWorktree, fixtureRoot, ledger, ordinaryRoleResultRoot, settledActions, gatewayEvents }) => {
      const candidateValidation = await core.run({ change_id: command.change_id, expected_state_version: candidateTransition.state_version, expected_state_hash: candidateTransition.state_hash });
      assert.equal(candidateValidation.outcome, 'ADVANCED'); assert.equal(candidateValidation.payload.to_phase, 'VALIDATOR');
      const validatorAction = await core.run({ change_id: command.change_id, expected_state_version: candidateValidation.state_version, expected_state_hash: candidateValidation.state_hash });
      assert.equal(validatorAction.outcome, 'AGENT_ACTION');
      const action = validatorAction.payload.action; const { action_kind, ...binding } = action;
      settledActions.push(structuredClone(action));
      const started = await core.settlement({ change_id: command.change_id, expected_state_version: validatorAction.state_version, expected_state_hash: validatorAction.state_hash, settlement: { ...binding, stage: 'STARTED', observed_child_id: 'ordinary-validator-pass' } });
      const note = (note_id, summary) => ({ note_id, summary, evidence_refs: [{ kind: 'TEST', id: '010-L01', sha256: sha256(`${note_id}:${action.subject_sha}`), subject_sha: action.subject_sha }] });
      const artifact = { schema_version: '1.0', change_id: command.change_id, candidate_sha: action.subject_sha, validator_head: action.subject_sha, verdict: 'PASS', findings: [], risks: [note('risk-001', 'controlled retained risk')], unverified: [note('unverified-001', 'controlled retained uncertainty')], open_questions: [note('question-001', 'controlled retained question')] };
      const artifactBytes = Buffer.from(canonicalJson(artifact)); const artifactPath = path.join(ordinaryRoleResultRoot, `${action.correlation_id}.pass.json`);
      await mkdir(path.dirname(artifactPath), { recursive: true }); await writeFile(artifactPath, artifactBytes);
      const validatorPass = await core.settlement({ change_id: command.change_id, expected_state_version: started.state_version, expected_state_hash: started.state_hash, settlement: { ...binding, stage: 'RESULT', observed_child_id: 'ordinary-validator-pass', status: 'PASS', artifact_path: artifactPath, artifact_sha256: sha256(artifactBytes), validator_artifact: artifact } });
      assert.equal(validatorPass.outcome, 'ADVANCED'); assert.equal(validatorPass.payload.to_phase, 'BRANCH_PUSH');
      const pushed = await core.run({ change_id: command.change_id, expected_state_version: validatorPass.state_version, expected_state_hash: validatorPass.state_hash });
      assert.equal(pushed.outcome, 'ADVANCED'); assert.equal(pushed.payload.to_phase, 'CANDIDATE_FREEZE');
      const frozen = await core.run({ change_id: command.change_id, expected_state_version: pushed.state_version, expected_state_hash: pushed.state_hash });
      assert.equal(frozen.outcome, 'ADVANCED'); assert.equal(frozen.payload.to_phase, 'PR');
      const stateReadback = await base.state.readState({ change_id: command.change_id }); assert.equal(stateReadback.kind, 'OK');
      const frozenState = JSON.parse(stateReadback.value.bytes);
      const diff = await runProcess(GIT, ['--no-pager', '-c', 'color.ui=false', '-c', 'core.quotePath=true', '-c', 'diff.algorithm=myers', '-c', 'diff.mnemonicPrefix=false', '-c', 'diff.noprefix=false', 'diff', '--binary', '--full-index', '--no-ext-diff', '--no-textconv', '--no-renames', '--src-prefix=a/', '--dst-prefix=b/', `${command.worktree.baseline_sha}..${candidateEvent.detail.candidate_sha}`, '--'], { cwd: coreWorktree, env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC', GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: '/dev/null', GIT_ATTR_NOSYSTEM: '1', GIT_PAGER: 'cat', PAGER: 'cat', GIT_TERMINAL_PROMPT: '0', GIT_NO_REPLACE_OBJECTS: '1' } });
      assert.equal(diff.code, 0, diff.stderr);
      const pathDiff = await runProcess(GIT, ['diff', '--name-status', '-z', '--no-ext-diff', '--no-textconv', '--no-renames', `${command.worktree.baseline_sha}..${candidateEvent.detail.candidate_sha}`, '--'], { cwd: coreWorktree, env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' } });
      assert.equal(pathDiff.code, 0, pathDiff.stderr);
      const changed_paths = parseNameStatusZ(pathDiff.stdout).map(entry => entry.path).sort();
      const deliveryPreimage = { schema_version: '1.0', change_id: command.change_id, authorization_cycle_command_id: frozenState.authorization_cycle.command_id, baseline_sha: command.worktree.baseline_sha, candidate_sha: candidateEvent.detail.candidate_sha, candidate_tree: candidateEvent.detail.tree, branch: command.worktree.branch, remote_head: candidateEvent.detail.candidate_sha, canonical_diff_sha256: sha256(diff.stdout), changed_paths };
      assert.deepEqual(Object.keys(deliveryPreimage).sort(), ['authorization_cycle_command_id', 'baseline_sha', 'branch', 'candidate_sha', 'candidate_tree', 'canonical_diff_sha256', 'change_id', 'changed_paths', 'remote_head', 'schema_version'].sort(), '010-L09 delivery identity uses exactly the frozen pre-PR preimage and no PR, Handoff, hash-response, or clock field');
      const delivery_id = `delivery-${sha256(canonicalJson(deliveryPreimage))}`;
      assert.equal(frozenState.delivery.canonical_diff_sha256, deliveryPreimage.canonical_diff_sha256, 'State binds the independently observed raw diff hash before PR');
      const pr = await core.run({ change_id: command.change_id, expected_state_version: frozen.state_version, expected_state_hash: frozen.state_hash });
      assert.equal(pr.outcome, 'ADVANCED'); assert.equal(pr.payload.to_phase, 'HANDOFF');
      const query = prCalls.find(call => call.operation === 'queryCurrent');
      assert.ok(query, 'the controlled final-boundary query occurs before create-or-reuse');
      assert.deepEqual(query.request, { repository: command.repository.repository_id, base: 'main', head_branch: command.worktree.branch });
      const create = prCalls.find(call => call.operation === 'createOrReuse');
      assert.ok(create, 'one controlled PR create-or-reuse follows exact absence readback');
      assert.deepEqual(create.request, { repository: command.repository.repository_id, base: 'main', head_branch: command.worktree.branch, head_sha: candidateEvent.detail.candidate_sha, idempotency_id: delivery_id }, 'the independently derived delivery id is the sole PR idempotency identity');
      assert.equal(prCalls.filter(call => call.operation === 'createOrReuse').length, 1, 'normal delivery creates or reuses exactly one controlled PR');
      const prReadback = prCalls.find(call => call.operation === 'readback');
      assert.deepEqual(prReadback?.request, { number: 73, expected_head: candidateEvent.detail.candidate_sha }, 'the PR readback is a closed exact-number/Candidate-Head request');
      const preHandoff = await readLocalLedger(ledger, command.change_id);
      assert.equal(preHandoff.kind, 'OK', 'the Handoff evidence anchor is the actual remote Ledger readback before HANDOFF_READY');
      assert.deepEqual(Object.keys(preHandoff.value).sort(), ['authoritative_path', 'expected_tip', 'file_present', 'last_event_hash', 'last_event_id', 'last_sequence', 'ledger_bytes_base64', 'prior_byte_length', 'prior_bytes_sha256', 'remote_ref', 'tip', 'tip_parent', 'tip_tree'].sort(), 'the pre-Handoff remote Ledger readback keeps the closed Design 8.2 thirteen-field shape');
    assert.equal(preHandoff.value.expected_tip, null, 'the normal pre-Handoff read has no caller-supplied tip constraint');
    assert.match(preHandoff.value.tip, /^[0-9a-f]{40}$/, 'the independently observed remote tip is not relabeled as the request expectation');
      const preHandoffLedgerBytes = Buffer.from(preHandoff.value.ledger_bytes_base64, 'base64');
      assert.equal(preHandoffLedgerBytes.toString('base64'), preHandoff.value.ledger_bytes_base64, 'the pre-Handoff bytes retain their exact base64 framing');
      assert.equal(preHandoffLedgerBytes.length, preHandoff.value.prior_byte_length);
      assert.equal(sha256(preHandoffLedgerBytes), preHandoff.value.prior_bytes_sha256, 'the pre-Handoff byte authority has an independently checked hash');
      const preHandoffRecords = preHandoffLedgerBytes.subarray(0, -1).toString('utf8').split('\n').map(line => JSON.parse(line));
      assert.equal(preHandoffRecords.at(-1)?.event_id, preHandoff.value.last_event_id);
      assert.equal(preHandoffRecords.at(-1)?.event_hash, preHandoff.value.last_event_hash);
      assert.equal(preHandoffRecords.at(-1)?.sequence, preHandoff.value.last_sequence);
      const ready = await core.run({ change_id: command.change_id, expected_state_version: pr.state_version, expected_state_hash: pr.state_hash });
      assert.equal(ready.outcome, 'AWAITING_CONTROLLER');
      assert.equal(handoffCalls.length, 1, 'one exact Handoff write/readback occurs after PR readback');
      const handoffBytes = await readFile(handoffPath); const handoffDocument = JSON.parse(handoffBytes.toString('utf8'));
      assert.equal(sha256(handoffBytes), handoffCalls[0].expected_sha256, 'the Handoff expected hash covers its actual canonical bytes');
      assert.deepEqual(Object.keys(handoffDocument).sort(), ['baseline_sha', 'branch', 'candidate_sha', 'candidate_tree', 'canonical_diff_contract_id', 'canonical_diff_sha256', 'change_id', 'changed_paths', 'delivery_id', 'idempotency_id', 'ledger_refs', 'open_questions', 'pull_request', 'remote_head', 'risks', 'schema_version', 'unverified', 'validation_receipts', 'validator_head', 'validator_verdict'].sort());
      assert.equal(handoffDocument.delivery_id, delivery_id); assert.equal(handoffDocument.idempotency_id, delivery_id);
      assert.equal(handoffDocument.canonical_diff_sha256, deliveryPreimage.canonical_diff_sha256); assert.deepEqual(handoffDocument.changed_paths, changed_paths);
      assert.equal(handoffDocument.canonical_diff_contract_id, 'JUANERAI_GIT_DIFF_V1');
      assert.deepEqual(handoffDocument.pull_request, { number: 73, url: 'https://invalid.example/pr/73', base: 'main', head_branch: command.worktree.branch, head_sha: candidateEvent.detail.candidate_sha });
      assert.equal(handoffDocument.remote_head, candidateEvent.detail.candidate_sha); assert.equal(handoffDocument.validator_head, candidateEvent.detail.candidate_sha); assert.equal(handoffDocument.validator_verdict, 'PASS');
      assert.deepEqual(handoffDocument.risks, artifact.risks); assert.deepEqual(handoffDocument.unverified, artifact.unverified); assert.deepEqual(handoffDocument.open_questions, artifact.open_questions, 'Handoff copies nonempty final Validator note arrays rather than silently defaulting them empty');
      const expectedRoles = ['TEST_RED', 'WORKER_GREEN', 'REGRESSION_AFFECTED_SUITE', 'REGRESSION_TEST_ASSET_RETIREMENT', 'FINAL_VALIDATION', 'VALIDATOR'];
      assert.deepEqual(handoffDocument.validation_receipts.map(entry => entry.evidence_role), expectedRoles, 'Handoff retains the fixed six-role current-chain evidence order');
      const exactWrapperKeys = ['agent_result_event_ref', 'authorization_cycle_command_id', 'candidate_sha', 'evidence_role', 'execution_attempt', 'receipt', 'receipt_event_ref', 'subject_sha'].sort();
      const roleReceiptKeys = ['candidate_sha', 'command_definition_sha256', 'failure_code', 'idempotency_id', 'receipt_sha256', 'status', 'subject_sha', 'validation_id', 'validation_kind', 'validation_scope', 'validator_head', 'verdict'].sort();
      const executionReceiptKeys = ['branch', 'candidate_sha', 'candidate_tree', 'command_definition_sha256', 'common_git_dir', 'execution_cwd', 'failure_code', 'head_sha', 'idempotency_id', 'receipt_sha256', 'repository_root', 'scope_sha256', 'status', 'stderr_sha256', 'stdout_sha256', 'subject_kind', 'subject_sha', 'validation_id', 'validation_kind', 'validation_scope', 'validator_head', 'verdict', 'worktree_root', 'worktree_snapshot_sha256'].sort();
      const expectedReceiptPurpose = Object.freeze({
        TEST_RED: ['TEST_RED', 'ACCEPTANCE_CRITERION'],
        WORKER_GREEN: ['WORKER_GREEN', 'WORKER_OUTPUT'],
        REGRESSION_AFFECTED_SUITE: ['REGRESSION', 'AFFECTED_SUITE'],
        REGRESSION_TEST_ASSET_RETIREMENT: ['REGRESSION', 'TEST_ASSET_RETIREMENT'],
        FINAL_VALIDATION: ['FINAL_VALIDATION', 'CANDIDATE'],
        VALIDATOR: ['VALIDATOR', 'VALIDATOR_REVIEW'],
      });
      for (const entry of handoffDocument.validation_receipts) {
        assert.deepEqual(Object.keys(entry).sort(), exactWrapperKeys, `${entry.evidence_role} has no fields outside the closed eight-field Handoff evidence wrapper`);
        assert.equal(entry.authorization_cycle_command_id, frozenState.authorization_cycle.command_id);
        assert.equal(entry.execution_attempt, 0, 'the normal Handoff contains only current attempt-zero evidence');
        assert.equal(entry.subject_sha, entry.receipt.subject_sha, `${entry.evidence_role} wrapper and receipt bind one subject`);
        assert.equal(entry.candidate_sha, entry.receipt.candidate_sha, `${entry.evidence_role} wrapper and receipt bind one Candidate`);
        assert.deepEqual([entry.receipt.validation_kind, entry.receipt.validation_scope], expectedReceiptPurpose[entry.evidence_role], `${entry.evidence_role} occupies its fixed kind/scope receipt union branch`);
        const { receipt_sha256, ...receiptPreimage } = entry.receipt;
        assert.equal(receipt_sha256, sha256(canonicalJson(receiptPreimage)), `${entry.evidence_role} receipt hash covers exactly the other union fields`);
        if (['TEST_RED', 'WORKER_GREEN', 'REGRESSION_AFFECTED_SUITE', 'REGRESSION_TEST_ASSET_RETIREMENT'].includes(entry.evidence_role)) assert.equal(entry.candidate_sha, null, `${entry.evidence_role} is pre-Candidate evidence`);
        else assert.equal(entry.candidate_sha, candidateEvent.detail.candidate_sha, `${entry.evidence_role} binds the exact current Candidate`);
        assert.ok(entry.receipt_event_ref, `${entry.evidence_role} cannot omit its exact receipt Ledger reference`);
        const receiptRecord = preHandoffRecords.find(record => record.event_id === entry.receipt_event_ref.event_id);
        assert.ok(receiptRecord, `${entry.evidence_role} receipt reference resolves in the independent pre-Handoff Ledger bytes`);
        assert.equal(receiptRecord.event_class, 'VALIDATION_RESULT');
        assert.deepEqual(receiptRecord.detail, entry.receipt, `${entry.evidence_role} receipt is exactly the recorded VALIDATION_RESULT detail, not a self-consistent replacement`);
        if (['TEST_RED', 'WORKER_GREEN', 'VALIDATOR'].includes(entry.evidence_role)) {
          assert.deepEqual(Object.keys(entry.receipt).sort(), roleReceiptKeys, `${entry.evidence_role} uses the closed 12-field role receipt union member`);
          assert.ok(entry.agent_result_event_ref, `${entry.evidence_role} requires the separate Agent RESULT reference as well as its receipt reference`);
          const agentRecord = preHandoffRecords.find(record => record.event_id === entry.agent_result_event_ref.event_id);
          assert.ok(agentRecord, `${entry.evidence_role} Agent RESULT reference resolves in the independent pre-Handoff Ledger bytes`);
          assert.equal(agentRecord.event_class, 'AGENT_RUN'); assert.equal(agentRecord.detail.stage, 'RESULT');
          assert.equal(agentRecord.detail.subject_sha, entry.subject_sha);
          assert.equal(entry.receipt.validation_id, agentRecord.detail.correlation_id, `${entry.evidence_role} role receipt validation ID is the complete Agent binding correlation`);
          assert.equal(entry.receipt.idempotency_id, agentRecord.detail.idempotency_id, `${entry.evidence_role} role receipt retains the complete Agent binding idempotency identity`);
          const { stage, observed_child_id, status, artifact_path, artifact_sha256, validator_artifact, ...agentBinding } = agentRecord.detail;
          const expectedRole = { TEST_RED: 'juaner_test', WORKER_GREEN: 'juaner_worker', VALIDATOR: 'juaner_validator' }[entry.evidence_role];
          const observedAction = settledActions.find(candidate => candidate.role === expectedRole && candidate.correlation_id === entry.receipt.validation_id);
          assert.ok(observedAction, `${entry.evidence_role} receipt must resolve to the complete public Action observed before settlement`);
          const { action_kind, ...observedBinding } = observedAction;
          assert.deepEqual(agentBinding, observedBinding, `${entry.evidence_role} complete RESULT binding equals the independently retained public Action binding`);
          assert.equal(entry.receipt.command_definition_sha256, sha256(canonicalJson(agentBinding)), `${entry.evidence_role} role receipt hashes the complete recorded AgentBinding rather than a projected action`);
          assert.deepEqual([entry.receipt.status, entry.receipt.verdict, entry.receipt.failure_code], ['COMPLETED', status, null], `${entry.evidence_role} role receipt normalizes exactly the actual Agent RESULT status`);
          assert.ok(agentRecord.sequence + 1 === receiptRecord.sequence, `${entry.evidence_role} receipt immediately follows its actual Agent RESULT`);
        } else {
          assert.deepEqual(Object.keys(entry.receipt).sort(), executionReceiptKeys, `${entry.evidence_role} uses the closed 24-field execution receipt union member`);
          assert.equal(entry.agent_result_event_ref, null, `${entry.evidence_role} is a mechanical validation and has no Agent RESULT reference`);
        }
      }
      const expectedLedgerRefs = handoffDocument.validation_receipts.flatMap(entry => [entry.agent_result_event_ref, entry.receipt_event_ref].filter(Boolean)).sort((left, right) => left.sequence - right.sequence);
      assert.deepEqual(handoffDocument.ledger_refs, expectedLedgerRefs, 'Handoff ledger_refs is the sequence-sorted unique union of every role result/receipt reference');
      assert.equal(new Set(handoffDocument.ledger_refs.map(ref => ref.event_id)).size, handoffDocument.ledger_refs.length, 'Handoff Ledger reference event IDs are explicitly unique');
      assert.equal(new Set(handoffDocument.ledger_refs.map(ref => ref.sequence)).size, handoffDocument.ledger_refs.length, 'Handoff Ledger reference sequences are explicitly unique');
      const remote = await readLocalLedger(ledger, command.change_id); assert.equal(remote.kind, 'OK');
      const records = Buffer.from(remote.value.ledger_bytes_base64, 'base64').subarray(0, -1).toString('utf8').split('\n').map(line => JSON.parse(line));
      assert.ok(handoffDocument.ledger_refs.length > 0, 'Handoff contains no default-empty Ledger reference set');
      const preHandoffTip = preHandoff.value.tip;
      assert.notEqual(preHandoffTip, remote.value.tip, 'all Handoff refs use the fixed pre-Handoff tip, not the later HANDOFF_READY tip');
      for (const ref of handoffDocument.ledger_refs) {
        assert.deepEqual(Object.keys(ref).sort(), ['authoritative_path', 'event_hash', 'event_id', 'record_bytes_sha256', 'record_length', 'record_offset', 'remote_ref', 'sequence', 'tip', 'tip_tree']);
        assert.equal(ref.tip, preHandoffTip); assert.equal(ref.remote_ref, preHandoff.value.remote_ref); assert.equal(ref.authoritative_path, preHandoff.value.authoritative_path);
      }
      const preHandoffTree = await runProcess(GIT, ['--git-dir', path.join(fixtureRoot, 'ledger-origin.git'), 'rev-parse', `${preHandoffTip}^{tree}`], { cwd: fixtureRoot, env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' } });
      const preHandoffGitBytes = await runProcess(GIT, ['--git-dir', path.join(fixtureRoot, 'ledger-origin.git'), 'show', `${preHandoffTip}:${preHandoff.value.authoritative_path}`], { cwd: fixtureRoot, env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' } });
      assert.equal(preHandoffTree.code, 0, preHandoffTree.stderr); assert.equal(preHandoffGitBytes.code, 0, preHandoffGitBytes.stderr);
      assert.deepEqual(Buffer.from(preHandoffGitBytes.stdout), preHandoffLedgerBytes, 'the pre-Handoff Ledger readback bytes equal the independently read fixed-tip Git file bytes');
      assert.doesNotMatch(preHandoffGitBytes.stdout, /"event_class":"HANDOFF_READY"/, 'the later HANDOFF_READY record is absent from fixed pre-Handoff evidence bytes');
      for (const ref of handoffDocument.ledger_refs) {
        const record = preHandoffRecords.find(candidate => candidate.event_id === ref.event_id);
        assert.ok(record, `each Handoff reference resolves in the actual remote Ledger byte stream: ${ref.event_id}`);
        assert.equal(record.event_hash, ref.event_hash); assert.equal(record.sequence, ref.sequence); assert.equal(ref.tip_tree, preHandoffTree.stdout.trim());
        const slice = preHandoffLedgerBytes.subarray(ref.record_offset, ref.record_offset + ref.record_length);
        assert.equal(slice.length, ref.record_length); assert.equal(sha256(slice), ref.record_bytes_sha256, 'each reference hashes its exact fixed-tip Ledger byte slice');
        assert.equal(slice.toString('utf8'), `${canonicalJson(record)}\n`, 'each reference offset/length identifies precisely one canonical remote record');
      }
      const handoffReady = records.at(-1);
      assert.equal(handoffReady.event_class, 'HANDOFF_READY'); assert.deepEqual(handoffReady.detail, { candidate_sha: candidateEvent.detail.candidate_sha, handoff_sha256: sha256(handoffBytes), pr_number: 73, pr_head: candidateEvent.detail.candidate_sha, delivery_id });
      const finalState = JSON.parse((await base.state.readState({ change_id: command.change_id })).value.bytes);
      assert.equal(finalState.macro_state, 'AWAITING_CONTROLLER'); assert.equal(finalState.delivery.delivery_id, delivery_id);
      const canonicalDiffCompletes = gatewayEvents.filter(event => event.edge === 'COMPLETE' && event.gateway === 'git' && event.method === 'canonicalDiff');
      assert.equal(canonicalDiffCompletes.length, 2, '009-L10 freeze and Handoff each complete one cumulative canonical diff readback');
      assert.deepEqual(canonicalDiffCompletes[1].actual_result, canonicalDiffCompletes[0].actual_result, '009-L10 freeze and Handoff independently agree on raw bytes, producer identity, hash, length, and changed paths');
      for (const observation of canonicalDiffCompletes) {
        const envelope = observation.actual_result;
        assert.deepEqual(Object.keys(envelope.value).sort(), ['byte_length', 'changed_paths', 'path_byte_length', 'path_raw_stdout', 'producer_receipt', 'raw_stdout', 'stdout_sha256']);
        assert.ok(Buffer.isBuffer(envelope.value.raw_stdout), 'the observer retains the actual raw Buffer rather than a structured-clone Uint8Array projection');
        assert.ok(Buffer.isBuffer(envelope.value.path_raw_stdout), 'the observer retains the actual NUL path Buffer without pre-consuming a Core input hook');
        assert.equal(envelope.value.byte_length, envelope.value.raw_stdout.length);
        assert.equal(envelope.value.path_byte_length, envelope.value.path_raw_stdout.length);
        assert.equal(envelope.value.stdout_sha256, sha256(envelope.value.raw_stdout));
        assert.equal(envelope.value.producer_receipt.path_stdout_sha256, sha256(envelope.value.path_raw_stdout));
        assert.equal(envelope.receipt_sha256, sha256(canonicalJson(canonicalDiffReceiptPreimage(envelope.value))), 'each independently returned producer result uses the frozen explicit seven-field receipt');
      }
      const pushComplete = gatewayEvents.find(event => event.edge === 'COMPLETE' && event.gateway === 'git' && event.method === 'pushBranch');
      const remoteComplete = gatewayEvents.find(event => event.edge === 'COMPLETE' && event.gateway === 'git' && event.method === 'readRemoteBranch' && event.sequence > pushComplete.sequence);
      assert.ok(pushComplete.sequence < remoteComplete.sequence && remoteComplete.sequence < canonicalDiffCompletes[0].sequence, '009-L07..L10 branch push and exact remote readback complete before the freeze diff');
      const prQueryComplete = gatewayEvents.find(event => event.edge === 'COMPLETE' && event.gateway === 'pull_request' && event.method === 'queryCurrent');
      const prCreateStart = gatewayEvents.find(event => event.edge === 'START' && event.gateway === 'pull_request' && event.method === 'createOrReuse');
      const prCreateComplete = gatewayEvents.find(event => event.edge === 'COMPLETE' && event.gateway === 'pull_request' && event.method === 'createOrReuse');
      const prReadbackComplete = gatewayEvents.find(event => event.edge === 'COMPLETE' && event.gateway === 'pull_request' && event.method === 'readback');
      assert.ok(prQueryComplete.sequence < prCreateStart.sequence && prCreateStart.sequence < prCreateComplete.sequence && prCreateComplete.sequence < prReadbackComplete.sequence, '010-L03 observes exact absence before the sole create and its readback COMPLETE');
      assert.ok(prReadbackComplete.sequence < canonicalDiffCompletes[1].sequence, '010-L05 Handoff diff starts only after PR readback authority completes');
      const handoffComplete = gatewayEvents.find(event => event.edge === 'COMPLETE' && event.gateway === 'handoff' && event.method === 'writeReadback');
      const readyReadbackComplete = gatewayEvents.find(event => event.edge === 'COMPLETE' && event.gateway === 'ledger' && event.method === 'readRemoteAppend' && event.result?.value?.event_id === handoffReady.event_id);
      const awaitingWriteStart = gatewayEvents.find(event => event.edge === 'START' && event.gateway === 'state' && event.method === 'writeState' && (() => { try { return JSON.parse(Buffer.from(event.request.next_bytes).toString('utf8')).macro_state === 'AWAITING_CONTROLLER'; } catch { return false; } })());
      assert.ok(handoffComplete.sequence < readyReadbackComplete.sequence && readyReadbackComplete.sequence < awaitingWriteStart.sequence, '010-L06/L15 Handoff COMPLETE and HANDOFF_READY remote readback COMPLETE precede AWAITING State write START');
      assert.equal(JSON.parse(Buffer.from(handoffCalls[0].handoff_bytes).toString('utf8')).delivery_id, delivery_id); assert.equal(handoffDocument.delivery_id, delivery_id); assert.equal(handoffReady.detail.delivery_id, delivery_id); assert.equal(finalState.delivery.delivery_id, delivery_id, '010-L01/L02 one pre-PR delivery identity survives every consumer and durable boundary');
      const publicationCounts = { push: gatewayEvents.filter(event => event.edge === 'START' && event.gateway === 'git' && event.method === 'pushBranch').length, pr: prCalls.length, handoff: handoffCalls.length };
      const lateTerminalSettlement = await core.settlement({ change_id: command.change_id, expected_state_version: finalState.state_version, expected_state_hash: sha256(canonicalJson(finalState)), settlement: { ...binding, stage: 'RESULT', observed_child_id: 'ordinary-validator-pass', status: 'PASS', artifact_path: artifactPath, artifact_sha256: sha256(artifactBytes), validator_artifact: artifact } });
      assert.equal(lateTerminalSettlement.outcome, 'REJECTED', '012-L09..L10 a terminal AWAITING State rejects a late prior-phase RESULT');
      assert.deepEqual({ push: gatewayEvents.filter(event => event.edge === 'START' && event.gateway === 'git' && event.method === 'pushBranch').length, pr: prCalls.length, handoff: handoffCalls.length }, publicationCounts, 'the late terminal settlement cannot replay Candidate, branch, PR, or Handoff effects');
    }, { pull_request, handoff });
  } finally {
    await rm(controlledRoot, { recursive: true, force: true });
  }
});

const c1EffectSnapshot = events => events.filter(event => event.edge === 'START' && ((event.gateway === 'state' && ['writePointer', 'writeState', 'writeLocalPause'].includes(event.method)) || (event.gateway === 'ledger' && ['prepareAppend', 'commitAndPush'].includes(event.method)) || (event.gateway === 'git' && event.method === 'pushBranch') || ['pull_request', 'handoff', 'validation'].includes(event.gateway))).map(event => ({ gateway: event.gateway, method: event.method, request: event.request }));

async function withC1PostFreeze(t, label, action, controls = {}) {
  const prCalls = []; const handoffCalls = [];
  const pull_request = {
    async queryCurrent(request) { prCalls.push({ method: 'queryCurrent', request: structuredClone(request) }); return absent(`c1-${label}-pr`); },
    async createOrReuse(request) { prCalls.push({ method: 'createOrReuse', request: structuredClone(request) }); return ok({ number: 401, url: 'https://invalid.example/pr/401', base: request.base, head_branch: request.head_branch, head_sha: request.head_sha, review_ready: true }); },
    async readback(request) { prCalls.push({ method: 'readback', request: structuredClone(request) }); return ok({ number: request.number, url: 'https://invalid.example/pr/401', base: 'main', head_branch: 'work/mac-mini/m2-regression', head_sha: request.expected_head, review_ready: true }); },
  };
  await withObservedK1Prefix(async context => {
    const { validatorPass } = await settleOrdinaryValidatorForBoundary(context, `c1-${label}`);
    const pushed = await context.core.run({ change_id: context.command.change_id, expected_state_version: validatorPass.state_version, expected_state_hash: validatorPass.state_hash }); assert.equal(pushed.outcome, 'ADVANCED');
    const frozen = await context.core.run({ change_id: context.command.change_id, expected_state_version: pushed.state_version, expected_state_hash: pushed.state_hash });
    const frontier = expectedCanonicalDiffV2Frontier(context.gatewayEvents.find(event => event.edge === 'COMPLETE' && event.gateway === 'git' && event.method === 'canonicalDiff')?.actual_result);
    assert.equal(frontier, null, `C1 ${label} requires the already-healthy real post-Freeze predecessor; a regression is Test-health failure, not a new skip`);
    assert.equal(frozen.outcome, 'ADVANCED'); assert.equal(frozen.payload.to_phase, 'PR');
    const before = { pointer: await context.base.state.readPointer({}), state: await context.base.state.readState({ change_id: context.command.change_id }), ledger: await readLocalLedger(context.ledger, context.command.change_id), pause: await exists(context.localPausePath), effects: c1EffectSnapshot(context.gatewayEvents) };
    await action({ ...context, frozen, before, prCalls, handoffCalls });
  }, { ...controls, pull_request, handoff: { async writeReadback(request) { handoffCalls.push(structuredClone(request)); return unavailable(null); } } });
}

test('RED-M2-005 / TEST-M2-010 / 010-L01/L05: a fresh Core rebuilds the second diff from immutable State/Git identity and compares only persisted raw hash plus delivery id', async t => {
  const prCalls = []; const handoffCalls = []; let notReached = null;
  const pull_request = {
    async queryCurrent(request) { prCalls.push({ method: 'queryCurrent', request: structuredClone(request) }); return absent('restart-pr'); },
    async createOrReuse(request) { prCalls.push({ method: 'createOrReuse', request: structuredClone(request) }); return ok({ number: 307, url: 'https://invalid.example/pr/307', base: request.base, head_branch: request.head_branch, head_sha: request.head_sha, review_ready: true }); },
    async readback(request) { prCalls.push({ method: 'readback', request: structuredClone(request) }); return ok({ number: request.number, url: 'https://invalid.example/pr/307', base: 'main', head_branch: 'work/mac-mini/m2-regression', head_sha: request.expected_head, review_ready: true }); },
  };
  const handoff = { async writeReadback(request) {
    handoffCalls.push(structuredClone(request));
    const document = JSON.parse(Buffer.from(request.handoff_bytes).toString('utf8'));
    return ok({ handoff_sha256: sha256(request.handoff_bytes), delivery_id: document.delivery_id });
  } };
  await withObservedK1Prefix(async context => {
    const { validatorPass } = await settleOrdinaryValidatorForBoundary(context, '010-fresh-core');
    const pushed = await context.core.run({ change_id: context.command.change_id, expected_state_version: validatorPass.state_version, expected_state_hash: validatorPass.state_hash }); assert.equal(pushed.outcome, 'ADVANCED');
    const frozen = await context.core.run({ change_id: context.command.change_id, expected_state_version: pushed.state_version, expected_state_hash: pushed.state_hash });
    assert.equal(notReached, null, `PREREQUISITE_FAILURE: fresh-Core reconstruction requires canonicalDiff V2; observed ${notReached}`);
    assert.equal(frozen.outcome, 'ADVANCED'); assert.equal(frozen.payload.to_phase, 'PR');
    const frozenState = JSON.parse((await context.base.state.readState({ change_id: context.command.change_id })).value.bytes);
    assert.deepEqual(Object.keys(frozenState.delivery).sort(), ['canonical_diff_sha256', 'delivery_id', 'remote_head'], 'Freeze persists only the existing raw hash and delivery identity; no path bytes/hash/receipt are retained');
    assert.match(frozenState.delivery.canonical_diff_sha256, /^[0-9a-f]{64}$/); assert.match(frozenState.delivery.delivery_id, /^delivery-[0-9a-f]{64}$/);
    assert.equal(context.canonicalDiffInvocationCount(), 1, 'Freeze performed exactly one real cumulative producer observation before restart');
    context.gatewayEvents.splice(0, context.gatewayEvents.length);
    const restarted = context.restartFreshCanonicalDiffCore();
    const originalDispatch = signed(context.command); const stateBeforeReauthentication = await context.base.state.readState({ change_id: context.command.change_id }); const ledgerBeforeReauthentication = await readLocalLedger(context.ledger, context.command.change_id); const deliveryEffectsBeforeReauthentication = { push: context.gatewayEvents.filter(event => event.edge === 'START' && event.gateway === 'git' && event.method === 'pushBranch').length, pr: prCalls.length, handoff: handoffCalls.length }; const reauthenticationEffectsBefore = c1EffectSnapshot(context.gatewayEvents);
    const fixedFreshLedger = await readLocalLedger(context.primaryLedger, context.command.change_id); assert.deepEqual(fixedFreshLedger, ledgerBeforeReauthentication, 'the fresh-Core C1 oracle fixes one underlying real Ledger tip/tree/path/byte stream before reauthentication');
    const fixedRecords = decodeRemoteLedger(fixedFreshLedger).records; const currentCycle = frozenState.authorization_cycle; const currentAuthorization = fixedRecords.filter(record => record.event_class === 'CONTROLLER_COMMAND' && ['DISPATCH', 'REVISION'].includes(record.detail?.command_kind)).at(-1);
    assert.ok(currentAuthorization, 'the fixed fresh Ledger has one latest complete DISPATCH-or-REVISION authorization record'); assert.equal(currentAuthorization.detail.command_id, currentCycle.command_id); assert.equal(currentAuthorization.detail.command_kind, currentCycle.command_kind); assert.equal(currentAuthorization.detail.body_sha256, sha256(originalDispatch.command_body_bytes)); assert.equal(currentAuthorization.detail.signature_sha256, sha256(originalDispatch.signature_bytes)); assert.equal(currentAuthorization.detail.verified_key_id, context.command.key_id); assert.equal(currentAuthorization.detail.receipt_digest, context.command.receipt_digest); assert.deepEqual(currentAuthorization.detail.admission, { command_id: context.command.command_id, body_sha256: sha256(originalDispatch.command_body_bytes), idempotency_id: context.command.idempotency_id });
    const { event_hash: currentAuthorizationHash, ...currentAuthorizationPreimage } = currentAuthorization; assert.equal(currentAuthorizationHash, sha256(canonicalJson(currentAuthorizationPreimage)), 'the selected latest authorization record has an independently valid canonical record hash');
    const reauthenticated = await restarted.applyControllerCommand(originalDispatch);
    assert.equal(reauthenticated.outcome, 'ALREADY_APPLIED', '010-L01/L05 uses only the original complete signed DISPATCH to restore ephemeral delivery authority');
    assert.equal(reauthenticated.state_version, frozen.state_version); assert.equal(reauthenticated.state_hash, frozen.state_hash);
    assert.deepEqual(reauthenticated.payload, { idempotency_id: context.command.idempotency_id, original_receipt_sha256: sha256(originalDispatch.command_body_bytes) });
    assert.deepEqual(await context.base.state.readState({ change_id: context.command.change_id }), stateBeforeReauthentication, 'reauthentication writes no State');
    assert.deepEqual(await readLocalLedger(context.ledger, context.command.change_id), ledgerBeforeReauthentication, 'reauthentication appends no Ledger record');
    assert.deepEqual({ push: context.gatewayEvents.filter(event => event.edge === 'START' && event.gateway === 'git' && event.method === 'pushBranch').length, pr: prCalls.length, handoff: handoffCalls.length }, deliveryEffectsBeforeReauthentication, 'reauthentication creates no branch, PR, or Handoff effect');
    assert.deepEqual(c1EffectSnapshot(context.gatewayEvents), reauthenticationEffectsBefore, 'post-Freeze C1 success writes no pointer/State/Ledger/local-pause/Git/PR/Handoff/Agent effect');
    const pr = await restarted.run({ change_id: context.command.change_id, expected_state_version: frozen.state_version, expected_state_hash: frozen.state_hash }); assert.equal(pr.outcome, 'ADVANCED'); assert.equal(pr.payload.to_phase, 'HANDOFF');
    const handoffRestart = context.restartFreshCanonicalDiffCore(); const beforeHandoffReauthentication = await context.base.state.readState({ change_id: context.command.change_id }); const handoffEffectsBefore = c1EffectSnapshot(context.gatewayEvents); const handoffReauthenticated = await handoffRestart.applyControllerCommand(originalDispatch);
    assert.equal(handoffReauthenticated.outcome, 'ALREADY_APPLIED'); assert.equal(handoffReauthenticated.state_version, pr.state_version); assert.equal(handoffReauthenticated.state_hash, pr.state_hash); assert.deepEqual(await context.base.state.readState({ change_id: context.command.change_id }), beforeHandoffReauthentication, 'second fresh HANDOFF reauthentication writes no State');
    assert.deepEqual(c1EffectSnapshot(context.gatewayEvents), handoffEffectsBefore, 'second HANDOFF C1 restart also writes no pointer/State/Ledger/local-pause/Git/PR/Handoff/Agent effect');
    const ready = await handoffRestart.run({ change_id: context.command.change_id, expected_state_version: pr.state_version, expected_state_hash: pr.state_hash }); assert.equal(ready.outcome, 'AWAITING_CONTROLLER');
    const reads = context.gatewayEvents.filter(event => event.edge === 'COMPLETE' && event.gateway === 'git' && event.method === 'canonicalDiff');
    assert.equal(context.canonicalDiffInvocationCount(), 2, 'Freeze and fresh-Core Handoff are the exactly two real cumulative producer observations');
    assert.equal(reads.length, 1, 'all first-process Gateway observations were discarded before the fresh Core reconstructed its result');
    const [second] = reads;
    assertHealthyCanonicalDiffV2(second.actual_result);
    const independent = await independentlyDeriveDeliveryIdentity(context.command, frozenState, context.coreWorktree);
    assert.deepEqual(second.actual_result.value.raw_stdout, independent.raw_stdout, 'the fresh Adapter return equals independently rerun fixed raw Git bytes');
    assert.deepEqual(second.actual_result.value.path_raw_stdout, independent.path_raw_stdout, 'the fresh Adapter return equals independently rerun fixed NUL path bytes');
    assert.deepEqual(second.actual_result.value.changed_paths, independent.changed_paths, 'the fresh Core derives the same independently parsed cumulative paths');
    assert.equal(second.actual_result.value.stdout_sha256, frozenState.delivery.canonical_diff_sha256, 'restart comparison consumes the one persisted raw hash');
    assert.equal(independent.delivery_id, frozenState.delivery.delivery_id, 'the reconstructed paths independently recompute the unchanged persisted delivery identity');
    assert.equal(JSON.parse(Buffer.from(handoffCalls[0].handoff_bytes).toString('utf8')).delivery_id, independent.delivery_id, 'Handoff consumes that independently recomputed identity without a persisted path receipt');
    assert.equal(handoffCalls.length, 1); assert.equal(prCalls.filter(call => call.method === 'createOrReuse').length, 1);
    assert.equal(prCalls.find(call => call.method === 'createOrReuse')?.request.idempotency_id, independent.delivery_id, 'PR consumes the same independently recomputed delivery identity');
    const prReadback = context.gatewayEvents.find(event => event.edge === 'COMPLETE' && event.gateway === 'pull_request' && event.method === 'readback');
    assert.ok(prReadback.sequence < second.sequence, 'PR readback completes before the fresh-Core second diff');
  }, {
    transformGitResult: async ({ method, actualResult }) => {
      if (method !== 'canonicalDiff') return actualResult;
      notReached = expectedCanonicalDiffV2Frontier(actualResult);
      if (notReached) return actualResult;
      assertHealthyCanonicalDiffV2(actualResult);
      return actualResult;
    },
    pull_request, handoff,
  });
});

for (const scenario of [
  { label: 'expired original material', expected: 'COMMAND_EXPIRED', mutate: command => ({ ...command, expires_at: '2026-09-05T23:59:59.000Z' }) },
  { label: 'wrong signature', expected: 'COMMAND_SIGNATURE_INVALID', signature: true, mutate: command => command },
  { label: 'wrong key', expected: 'COMMAND_SIGNATURE_INVALID', key: true, mutate: command => ({ ...command, key_id: 'wrong-key' }) },
  { label: 'different canonical body', expected: 'COMMAND_REPLAY_CONFLICT', mutate: command => ({ ...command, receipt_digest: 'e'.repeat(64) }) },
  { label: 'different valid nonce under original identity', expected: 'COMMAND_REPLAY_CONFLICT', mutate: command => ({ ...command, nonce: Buffer.alloc(32, 0x31).toString('base64') }) },
  { label: 'different idempotency under original identity', expected: 'COMMAND_REPLAY_CONFLICT', mutate: command => ({ ...command, idempotency_id: `${command.idempotency_id}-different` }) },
  { label: 'wrong repository admission', expected: 'STATE_CONFLICT', mutate: command => ({ ...command, repository: { ...command.repository, canonical_root: `${command.repository.canonical_root}-other` } }) },
  { label: 'wrong scope', expected: 'STATE_CONFLICT', mutate: command => ({ ...command, scope: { allowed_paths: ['other.txt'], forbidden_paths: [] } }) },
  { label: 'wrong worktree admission', expected: 'STATE_CONFLICT', mutate: command => ({ ...command, worktree: { ...command.worktree, branch: 'work/mac-mini/not-current' } }) },
]) test(`RED-M2-005 / TEST-M2-010 / C1 fresh reauthentication independently rejects ${scenario.label} with zero effects`, async t => {
  let verifierArmed = false;
  const verifier = scenario.signature || scenario.key ? { async verify(request) { const body = JSON.parse(Buffer.from(request.command_body_bytes).toString('utf8')); if (verifierArmed && (scenario.signature || body.key_id === 'wrong-key')) return { kind: 'REJECTED', error_code: 'COMMAND_SIGNATURE_INVALID' }; return { kind: 'VERIFIED', body, verified_key_id: body.key_id, body_sha256: sha256(request.command_body_bytes), signature_sha256: sha256(request.signature_bytes) }; } } : undefined;
  await withC1PostFreeze(t, `negative-${scenario.label}`, async context => {
    verifierArmed = true; const request = signed(scenario.mutate(context.command)); if (scenario.signature) request.signature_bytes = new Uint8Array([9, 9, 9]); const rejected = await context.restartFreshCanonicalDiffCore().applyControllerCommand(request);
    assert.equal(rejected.outcome, 'REJECTED'); assert.equal(rejected.error_code, scenario.expected);
    assert.deepEqual(await context.base.state.readPointer({}), context.before.pointer, 'C1 negative preserves active pointer'); assert.deepEqual(await context.base.state.readState({ change_id: context.command.change_id }), context.before.state, 'C1 negative preserves State'); assert.deepEqual(await readLocalLedger(context.ledger, context.command.change_id), context.before.ledger, 'C1 negative preserves Ledger'); assert.equal(await exists(context.localPausePath), context.before.pause, 'C1 negative creates no local pause');
    assert.deepEqual(c1EffectSnapshot(context.gatewayEvents), context.before.effects, 'C1 negative launches no pointer/State/pause/Ledger/Git/PR/Handoff/Agent effect');
  }, { verifier });
});

for (const scenario of [
  ['missing fixed Ledger source', () => absent('c1-fixed-tip')],
  ['ambiguous fixed Ledger source', () => ambiguous(null)],
  ['conflicting fixed Ledger source', () => ({ kind: 'CONFLICT', reason: 'READBACK_MISMATCH', observed_identity: null })],
]) test(`RED-M2-005 / TEST-M2-010 / C1 fresh reauthentication independently rejects ${scenario[0]} with zero effects`, async t => {
  let armed = false;
  await withC1PostFreeze(t, `ledger-${scenario[0]}`, async context => {
    armed = true; const rejected = await context.restartFreshCanonicalDiffCore().applyControllerCommand(signed(context.command));
    armed = false; assert.equal(rejected.outcome, 'REJECTED'); assert.equal(rejected.error_code, 'STATE_CONFLICT'); assert.deepEqual(await context.base.state.readPointer({}), context.before.pointer); assert.deepEqual(await context.base.state.readState({ change_id: context.command.change_id }), context.before.state); assert.deepEqual(await readLocalLedger(context.ledger, context.command.change_id), context.before.ledger); assert.equal(await exists(context.localPausePath), context.before.pause); assert.deepEqual(c1EffectSnapshot(context.gatewayEvents), context.before.effects);
  }, { transformLedgerResult: async ({ method, actualResult }) => armed && method === 'readRemote' ? scenario[1](actualResult) : actualResult });
});

test('RED-M2-005 / TEST-M2-010 / C1 fresh reauthentication rejects hash-only signed authority input with zero effects', async t => {
  await withC1PostFreeze(t, 'hash-only-authority', async context => {
    const original = signed(context.command);
    const rejected = await context.restartFreshCanonicalDiffCore().applyControllerCommand({ command_body_sha256: sha256(original.command_body_bytes), signature_sha256: sha256(original.signature_bytes) });
    assert.equal(rejected.outcome, 'REJECTED'); assert.equal(rejected.error_code, 'INPUT_INVALID', 'a pair of hashes is not the caller-retained complete signed DISPATCH material');
    assert.deepEqual(await context.base.state.readPointer({}), context.before.pointer); assert.deepEqual(await context.base.state.readState({ change_id: context.command.change_id }), context.before.state); assert.deepEqual(await readLocalLedger(context.ledger, context.command.change_id), context.before.ledger); assert.equal(await exists(context.localPausePath), context.before.pause); assert.deepEqual(c1EffectSnapshot(context.gatewayEvents), context.before.effects);
  });
});

for (const scenario of [
  ['wrong persisted admission', state => ({ ...state, admission: { ...state.admission, idempotency_id: 'wrong-admission-idempotency' } })],
  ['wrong persisted scope/cycle', state => ({ ...state, authorization_cycle: { ...state.authorization_cycle, command_id: 'wrong-cycle-command' } })],
  ['wrong persisted delivery phase', state => ({ ...state, phase: 'TEST_RED' })],
]) test(`RED-M2-005 / TEST-M2-010 / C1 fresh reauthentication independently rejects ${scenario[0]} with zero effects`, async t => {
  let armed = false;
  await withC1PostFreeze(t, `state-${scenario[0]}`, async context => {
    armed = true; const rejected = await context.restartFreshCanonicalDiffCore().applyControllerCommand(signed(context.command));
    armed = false; assert.equal(rejected.outcome, 'REJECTED'); assert.equal(rejected.error_code, 'STATE_CONFLICT'); assert.deepEqual(await context.base.state.readPointer({}), context.before.pointer); assert.deepEqual(await context.base.state.readState({ change_id: context.command.change_id }), context.before.state); assert.deepEqual(await readLocalLedger(context.ledger, context.command.change_id), context.before.ledger); assert.equal(await exists(context.localPausePath), context.before.pause); assert.deepEqual(c1EffectSnapshot(context.gatewayEvents), context.before.effects);
  }, { transformStateResult: async ({ method, actualResult }) => {
    if (!armed || method !== 'readState' || actualResult?.kind !== 'OK') return actualResult;
    const changed = scenario[1](JSON.parse(actualResult.value.bytes)); const bytes = canonicalJson(changed); return ok({ bytes, sha256: sha256(bytes) });
  } });
});

test('RED-M2-005 / TEST-M2-010 / C1 fresh reauthentication refuses a pre-existing C3 pause and later run cannot bypass it', async t => {
  await withC1PostFreeze(t, 'preexisting-pause', async context => {
    const diagnostic = { schema_version: '1.0', diagnostic_id: 'c1-preexisting-pause', change_id: context.command.change_id, command_id: context.command.command_id, operation: 'run', reason: 'POINTER_STATE_CONFLICT', next_action: 'MANUAL_CONTROLLER_STOP', request_idempotency_id: 'c1-preexisting-pause-request', request_sha256: sha256(canonicalJson({ change_id: context.command.change_id, expected_state_version: context.frozen.state_version, expected_state_hash: context.frozen.state_hash })), state_version: context.frozen.state_version, state_hash: context.frozen.state_hash, expected_evidence_tip: null, event_id: null, expected_event_hash: null, created_at: '2026-09-06T00:00:30.000Z', supersedes_diagnostic_id: null };
    const bytes = canonicalJson(diagnostic); await writeFile(context.localPausePath, bytes);
    const fresh = context.restartFreshCanonicalDiffCore(); const rejected = await fresh.applyControllerCommand(signed(context.command)); assert.equal(rejected.outcome, 'REJECTED'); assert.equal(rejected.error_code, 'STATE_CONFLICT'); assert.equal(await readFile(context.localPausePath, 'utf8'), bytes, 'C1 leaves the exact prior pause bytes unchanged');
    const later = await fresh.run({ change_id: context.command.change_id, expected_state_version: context.frozen.state_version, expected_state_hash: context.frozen.state_hash }); assert.equal(later.outcome, 'BLOCKED'); assert.equal(await readFile(context.localPausePath, 'utf8'), bytes, 'later run does not clear or bypass the C3 pause'); assert.deepEqual(await context.base.state.readState({ change_id: context.command.change_id }), context.before.state); assert.deepEqual(await readLocalLedger(context.ledger, context.command.change_id), context.before.ledger); assert.deepEqual(c1EffectSnapshot(context.gatewayEvents), context.before.effects);
  });
});

for (const scenario of [
  { label: 'an arbitrary later matching marker', detail: source => ({ ...source.detail, receipt_digest: 'f'.repeat(64) }) },
  { label: 'a later conflicting authorization cycle', detail: source => ({ ...source.detail, command_kind: 'REVISION', command_id: 'c1-later-conflicting-cycle', receipt_digest: 'e'.repeat(64), admission: null, ready_state_sha256: null }) },
]) test(`RED-M2-005 / TEST-M2-010 / C1 fresh reauthentication rejects ${scenario.label} from a real alternate Ledger source`, async t => {
  const ledgerRoute = { target: null };
  await withC1PostFreeze(t, `alternate-${scenario.label}`, async context => {
    const primary = decodeRemoteLedger(context.before.ledger); const original = primary.records.find(record => record.event_class === 'CONTROLLER_COMMAND' && record.detail?.command_id === context.command.command_id); assert.ok(original, 'the physical primary Ledger contains the original complete DISPATCH provenance before alternate construction');
    const alternate = await cloneTestLedgerWithoutEvent({ root: path.join(context.fixtureRoot, `c1-alternate-${sha256(scenario.label).slice(0, 12)}`), changeId: context.command.change_id, records: primary.records, omittedEventId: 'c1-no-record-is-omitted' });
    const marker = await appendTestLedgerEvent(alternate.ledger, { change_id: context.command.change_id, event_class: 'CONTROLLER_COMMAND', state_version: original.state_version, subject_sha: original.subject_sha, idempotency_id: `${original.idempotency_id}-${sha256(scenario.label).slice(0, 8)}`, detail: scenario.detail(original) });
    const alternateRemote = await readLocalLedger(alternate.ledger, context.command.change_id); const alternateDecoded = decodeRemoteLedger(alternateRemote); assert.equal(alternateDecoded.records.at(-1).event_id, marker.event.event_id); assert.equal(marker.readback.value.tip, alternateRemote.value.tip, 'the alternate marker/cycle is physically committed and read back before C1 consumes it');
    ledgerRoute.target = alternate.ledger;
    const rejected = await context.restartFreshCanonicalDiffCore().applyControllerCommand(signed(context.command)); assert.equal(rejected.outcome, 'REJECTED'); assert.equal(rejected.error_code, 'STATE_CONFLICT');
    assert.deepEqual(await context.base.state.readPointer({}), context.before.pointer); assert.deepEqual(await context.base.state.readState({ change_id: context.command.change_id }), context.before.state); assert.deepEqual(await readLocalLedger(context.primaryLedger, context.command.change_id), context.before.ledger, 'C1 conflict never mutates the original authority'); assert.equal(await exists(context.localPausePath), context.before.pause); assert.deepEqual(c1EffectSnapshot(context.gatewayEvents), context.before.effects);
  }, { ledgerRoute });
});

test('RED-M2-005 / TEST-M2-010 / 010-L08: real K1 prefix stops every mismatched or ambiguous controlled PR before Handoff', async t => {
  const cases = [
    { label: 'wrong base', patch: { base: 'release' } },
    { label: 'wrong head branch', patch: { head_branch: 'work/mac-mini/other' } },
    { label: 'wrong Candidate Head', patch: { head_sha: 'a'.repeat(40) } },
    { label: 'not review-ready', patch: { review_ready: false } },
    { label: 'ambiguous current PR', query: ambiguous(null) },
  ];
  for (const scenario of cases) await t.test(scenario.label, async () => {
    const prCalls = []; const handoffCalls = [];
    const pull_request = {
      async queryCurrent(request) {
        prCalls.push({ operation: 'queryCurrent', request: structuredClone(request) });
        return scenario.query ?? absent('current-pr');
      },
      async createOrReuse(request) {
        prCalls.push({ operation: 'createOrReuse', request: structuredClone(request) });
        return ok({ number: 91, url: 'https://invalid.example/pr/91', base: request.base, head_branch: request.head_branch, head_sha: request.head_sha, review_ready: true, ...scenario.patch });
      },
      async readback(request) {
        prCalls.push({ operation: 'readback', request: structuredClone(request) });
        return ok({ number: request.number, url: 'https://invalid.example/pr/91', base: scenario.patch?.base ?? 'main', head_branch: scenario.patch?.head_branch ?? 'work/mac-mini/m2-regression', head_sha: scenario.patch?.head_sha ?? request.expected_head, review_ready: scenario.patch?.review_ready ?? true });
      },
    };
    const handoff = { async writeReadback(request) {
      handoffCalls.push(structuredClone(request));
      assert.fail('a PR mismatch must stop before the controlled Handoff boundary');
    } };
    await withObservedK1Prefix(async ({ command, core, candidateEvent, candidateTransition, ordinaryRoleResultRoot }) => {
      const candidateValidation = await core.run({ change_id: command.change_id, expected_state_version: candidateTransition.state_version, expected_state_hash: candidateTransition.state_hash });
      assert.equal(candidateValidation.outcome, 'ADVANCED');
      const validatorAction = await core.run({ change_id: command.change_id, expected_state_version: candidateValidation.state_version, expected_state_hash: candidateValidation.state_hash });
      assert.equal(validatorAction.outcome, 'AGENT_ACTION');
      const action = validatorAction.payload.action; const { action_kind, ...binding } = action;
      const childId = 'ordinary-validator-pr-' + scenario.label;
      const started = await core.settlement({ change_id: command.change_id, expected_state_version: validatorAction.state_version, expected_state_hash: validatorAction.state_hash, settlement: { ...binding, stage: 'STARTED', observed_child_id: childId } });
      assert.equal(started.outcome, 'WAITING');
      const artifact = { schema_version: '1.0', change_id: command.change_id, candidate_sha: candidateEvent.detail.candidate_sha, validator_head: candidateEvent.detail.candidate_sha, verdict: 'PASS', findings: [], risks: [], unverified: [], open_questions: [] };
      const artifactBytes = Buffer.from(canonicalJson(artifact)); const artifactPath = path.join(ordinaryRoleResultRoot, action.correlation_id + '.pr-' + scenario.label + '.json');
      await mkdir(path.dirname(artifactPath), { recursive: true }); await writeFile(artifactPath, artifactBytes);
      const validatorPass = await core.settlement({ change_id: command.change_id, expected_state_version: started.state_version, expected_state_hash: started.state_hash, settlement: { ...binding, stage: 'RESULT', observed_child_id: childId, status: 'PASS', artifact_path: artifactPath, artifact_sha256: sha256(artifactBytes), validator_artifact: artifact } });
      assert.equal(validatorPass.outcome, 'ADVANCED');
      const pushed = await core.run({ change_id: command.change_id, expected_state_version: validatorPass.state_version, expected_state_hash: validatorPass.state_hash });
      assert.equal(pushed.outcome, 'ADVANCED');
      const frozen = await core.run({ change_id: command.change_id, expected_state_version: pushed.state_version, expected_state_hash: pushed.state_hash });
      assert.equal(frozen.outcome, 'ADVANCED');
      const stopped = await core.run({ change_id: command.change_id, expected_state_version: frozen.state_version, expected_state_hash: frozen.state_hash });
      assert.equal(stopped.outcome, 'BLOCKED', 'a controlled PR mismatch has no authority to reach HANDOFF');
      assert.equal(stopped.payload.blocked_reason, 'FINAL_HANDOFF_PR_AMBIGUOUS');
      assert.equal(handoffCalls.length, 0, 'a mismatched or ambiguous PR starts no Handoff write');
      assert.equal(prCalls.filter(call => call.operation === 'queryCurrent').length, 1);
      if (scenario.query) assert.equal(prCalls.filter(call => call.operation === 'createOrReuse').length, 0, 'an ambiguous current PR cannot be replaced');
      const callsBeforeReplay = prCalls.length;
      const replay = await core.run({ change_id: command.change_id, expected_state_version: stopped.state_version, expected_state_hash: stopped.state_hash });
      assert.equal(replay.outcome, 'BLOCKED'); assert.equal(prCalls.length, callsBeforeReplay, '011-L04 a durable final-boundary stop never replays the ambiguous PR Gateway on a later run');
    }, { pull_request, handoff });
  });
});

test('RED-M2-005 / TEST-M2-010 / 010-L02..L07: a lost create response converges once on the same precomputed delivery id', async () => {
  const prCalls = []; const handoffCalls = []; let createdRequest = null;
  const pull_request = {
    async queryCurrent(request) {
      prCalls.push({ method: 'queryCurrent', request: structuredClone(request) });
      if (createdRequest === null) return absent('current-pr');
      return ok({ number: 107, url: 'https://invalid.example/pr/107', base: createdRequest.base, head_branch: createdRequest.head_branch, head_sha: createdRequest.head_sha, review_ready: true });
    },
    async createOrReuse(request) {
      prCalls.push({ method: 'createOrReuse', request: structuredClone(request) });
      assert.equal(createdRequest, null, 'the Test consumer permits only the one physical create whose response is lost');
      createdRequest = structuredClone(request);
      return ambiguous(null);
    },
    async readback(request) {
      prCalls.push({ method: 'readback', request: structuredClone(request) });
      return ok({ number: request.number, url: 'https://invalid.example/pr/107', base: createdRequest.base, head_branch: createdRequest.head_branch, head_sha: request.expected_head, review_ready: true });
    },
  };
  await withObservedK1Prefix(async ({ base, command, core, candidateEvent, candidateTransition, ordinaryRoleResultRoot, gatewayEvents }) => {
    const candidateValidation = await core.run({ change_id: command.change_id, expected_state_version: candidateTransition.state_version, expected_state_hash: candidateTransition.state_hash }); assert.equal(candidateValidation.outcome, 'ADVANCED');
    const validatorAction = await core.run({ change_id: command.change_id, expected_state_version: candidateValidation.state_version, expected_state_hash: candidateValidation.state_hash }); assert.equal(validatorAction.outcome, 'AGENT_ACTION');
    const action = validatorAction.payload.action; const { action_kind, ...binding } = action;
    const started = await core.settlement({ change_id: command.change_id, expected_state_version: validatorAction.state_version, expected_state_hash: validatorAction.state_hash, settlement: { ...binding, stage: 'STARTED', observed_child_id: 'ordinary-validator-pr-loss' } }); assert.equal(started.outcome, 'WAITING');
    const artifact = { schema_version: '1.0', change_id: command.change_id, candidate_sha: candidateEvent.detail.candidate_sha, validator_head: candidateEvent.detail.candidate_sha, verdict: 'PASS', findings: [], risks: [], unverified: [], open_questions: [] };
    const artifactBytes = Buffer.from(canonicalJson(artifact)); const artifactPath = path.join(ordinaryRoleResultRoot, `${action.correlation_id}.pr-loss.json`); await mkdir(path.dirname(artifactPath), { recursive: true }); await writeFile(artifactPath, artifactBytes);
    const validatorPass = await core.settlement({ change_id: command.change_id, expected_state_version: started.state_version, expected_state_hash: started.state_hash, settlement: { ...binding, stage: 'RESULT', observed_child_id: 'ordinary-validator-pr-loss', status: 'PASS', artifact_path: artifactPath, artifact_sha256: sha256(artifactBytes), validator_artifact: artifact } }); assert.equal(validatorPass.outcome, 'ADVANCED');
    const pushed = await core.run({ change_id: command.change_id, expected_state_version: validatorPass.state_version, expected_state_hash: validatorPass.state_hash }); assert.equal(pushed.outcome, 'ADVANCED');
    const frozen = await core.run({ change_id: command.change_id, expected_state_version: pushed.state_version, expected_state_hash: pushed.state_hash }); assert.equal(frozen.outcome, 'ADVANCED');
    const pr = await core.run({ change_id: command.change_id, expected_state_version: frozen.state_version, expected_state_hash: frozen.state_hash }); assert.equal(pr.outcome, 'ADVANCED'); assert.equal(pr.payload.to_phase, 'HANDOFF');
    assert.equal(prCalls.filter(call => call.method === 'queryCurrent').length, 2, 'exact absence and one response-loss convergence query are the only PR reads');
    assert.equal(prCalls.filter(call => call.method === 'createOrReuse').length, 1, 'response loss never permits a replacement physical PR create');
    assert.equal(prCalls.filter(call => call.method === 'readback').length, 1, 'the converged current PR is read back exactly once');
    assert.ok(createdRequest.idempotency_id.startsWith('delivery-')); assert.equal(createdRequest.head_sha, candidateEvent.detail.candidate_sha);
    const createStart = gatewayEvents.find(event => event.edge === 'START' && event.gateway === 'pull_request' && event.method === 'createOrReuse');
    const createComplete = gatewayEvents.find(event => event.edge === 'COMPLETE' && event.gateway === 'pull_request' && event.method === 'createOrReuse');
    const convergedQueryComplete = gatewayEvents.findLast(event => event.edge === 'COMPLETE' && event.gateway === 'pull_request' && event.method === 'queryCurrent');
    const readbackComplete = gatewayEvents.find(event => event.edge === 'COMPLETE' && event.gateway === 'pull_request' && event.method === 'readback');
    assert.equal(createComplete.result.kind, 'AMBIGUOUS'); assert.equal(createComplete.result.partial_receipt, null, 'ordinary PR ambiguity uses the frozen non-Ledger null partial receipt');
    assert.ok(createStart.sequence < createComplete.sequence && createComplete.sequence < convergedQueryComplete.sequence && convergedQueryComplete.sequence < readbackComplete.sequence, 'one lost response converges by actual current-PR readback before State advances');
    const durable = JSON.parse((await base.state.readState({ change_id: command.change_id })).value.bytes); assert.equal(durable.delivery.delivery_id, createdRequest.idempotency_id, 'the same precomputed delivery identity survives response-loss convergence');
    assert.equal(handoffCalls.length, 0, 'this leaf stops at the PR-to-Handoff transition and does not claim private Handoff producer execution');
  }, { pull_request, handoff: { async writeReadback(request) { handoffCalls.push(structuredClone(request)); return unavailable(null); } } });
});

const finalLedgerConflictCases010 = [
  {
    leaf: '010-L10',
    label: 'a second complete adjacent Validator pair occupies the same current-cycle role slot',
    makeInjections(records) {
      const result = records.findLast(record => record.event_class === 'AGENT_RUN' && record.detail?.stage === 'RESULT' && record.detail?.role === 'juaner_validator');
      const receipt = records.findLast(record => record.event_class === 'VALIDATION_RESULT' && record.detail?.validation_kind === 'VALIDATOR');
      assert.ok(result && receipt && result.sequence + 1 === receipt.sequence, 'the duplicate is derived from the actual healthy current-cycle adjacent Validator pair');
      return [
        { event_class: 'AGENT_RUN', detail: structuredClone(result.detail), idempotency_id: result.idempotency_id },
        { event_class: 'VALIDATION_RESULT', detail: structuredClone(receipt.detail), idempotency_id: receipt.idempotency_id },
      ];
    },
  },
  {
    leaf: '010-L11',
    label: 'one internally valid adjacent Validator pair has a correlation not issued by the current cycle',
    makeInjections(records) {
      const result = records.findLast(record => record.event_class === 'AGENT_RUN' && record.detail?.stage === 'RESULT' && record.detail?.role === 'juaner_validator');
      const receipt = records.findLast(record => record.event_class === 'VALIDATION_RESULT' && record.detail?.validation_kind === 'VALIDATOR');
      assert.ok(result && receipt && result.sequence + 1 === receipt.sequence, 'the mismatch is derived from the actual healthy current-cycle adjacent Validator pair');
      const correlation_id = `${result.detail.correlation_id}-mismatch`; const idempotency_id = `${result.detail.idempotency_id}-mismatch`;
      const resultDetail = { ...structuredClone(result.detail), correlation_id, idempotency_id };
      const { stage, observed_child_id, status, artifact_path, artifact_sha256, validator_artifact, ...binding } = resultDetail;
      const receiptDetail = { ...structuredClone(receipt.detail), validation_id: correlation_id, idempotency_id, command_definition_sha256: sha256(canonicalJson(binding)) };
      const { receipt_sha256, ...preimage } = receiptDetail; receiptDetail.receipt_sha256 = sha256(canonicalJson(preimage));
      return [
        { event_class: 'AGENT_RUN', detail: resultDetail, idempotency_id },
        { event_class: 'VALIDATION_RESULT', detail: receiptDetail, idempotency_id },
      ];
    },
  },
  {
    leaf: '010-L15',
    label: 'one otherwise closed future HANDOFF_READY record appears before the Handoff attempt',
    makeInjections(_records, candidateSha) {
      const delivery_id = `delivery-${'e'.repeat(64)}`;
      return [{ event_class: 'HANDOFF_READY', detail: { handoff_sha256: 'f'.repeat(64), candidate_sha: candidateSha, pr_number: 109, pr_head: candidateSha, delivery_id }, idempotency_id: delivery_id }];
    },
  },
];

for (const scenario of finalLedgerConflictCases010) test(`RED-M2-005 / TEST-M2-010 / ${scenario.leaf}: ${scenario.label} stops before Handoff publication`, async () => {
  const prCalls = []; const handoffCalls = [];
  const pull_request = {
    async queryCurrent(request) { prCalls.push({ method: 'queryCurrent', request: structuredClone(request) }); return absent('current-pr'); },
    async createOrReuse(request) { prCalls.push({ method: 'createOrReuse', request: structuredClone(request) }); return ok({ number: 109, url: 'https://invalid.example/pr/109', base: request.base, head_branch: request.head_branch, head_sha: request.head_sha, review_ready: true }); },
    async readback(request) { prCalls.push({ method: 'readback', request: structuredClone(request) }); return ok({ number: request.number, url: 'https://invalid.example/pr/109', base: 'main', head_branch: 'work/mac-mini/m2-regression', head_sha: request.expected_head, review_ready: true }); },
  };
  await withObservedK1Prefix(async ({ base, command, core, candidateEvent, candidateTransition, ordinaryRoleResultRoot, ledger, gatewayEvents }) => {
    const candidateValidation = await core.run({ change_id: command.change_id, expected_state_version: candidateTransition.state_version, expected_state_hash: candidateTransition.state_hash }); assert.equal(candidateValidation.outcome, 'ADVANCED');
    const validatorAction = await core.run({ change_id: command.change_id, expected_state_version: candidateValidation.state_version, expected_state_hash: candidateValidation.state_hash }); assert.equal(validatorAction.outcome, 'AGENT_ACTION');
    const action = validatorAction.payload.action; const { action_kind, ...binding } = action;
    const childId = `ordinary-validator-${scenario.leaf}`;
    const started = await core.settlement({ change_id: command.change_id, expected_state_version: validatorAction.state_version, expected_state_hash: validatorAction.state_hash, settlement: { ...binding, stage: 'STARTED', observed_child_id: childId } }); assert.equal(started.outcome, 'WAITING');
    const artifact = { schema_version: '1.0', change_id: command.change_id, candidate_sha: candidateEvent.detail.candidate_sha, validator_head: candidateEvent.detail.candidate_sha, verdict: 'PASS', findings: [], risks: [], unverified: [], open_questions: [] };
    const artifactBytes = Buffer.from(canonicalJson(artifact)); const artifactPath = path.join(ordinaryRoleResultRoot, `${action.correlation_id}.${scenario.leaf}.json`); await mkdir(path.dirname(artifactPath), { recursive: true }); await writeFile(artifactPath, artifactBytes);
    const validatorPass = await core.settlement({ change_id: command.change_id, expected_state_version: started.state_version, expected_state_hash: started.state_hash, settlement: { ...binding, stage: 'RESULT', observed_child_id: childId, status: 'PASS', artifact_path: artifactPath, artifact_sha256: sha256(artifactBytes), validator_artifact: artifact } }); assert.equal(validatorPass.outcome, 'ADVANCED');
    const pushed = await core.run({ change_id: command.change_id, expected_state_version: validatorPass.state_version, expected_state_hash: validatorPass.state_hash }); assert.equal(pushed.outcome, 'ADVANCED');
    const frozen = await core.run({ change_id: command.change_id, expected_state_version: pushed.state_version, expected_state_hash: pushed.state_hash }); assert.equal(frozen.outcome, 'ADVANCED');
    const pr = await core.run({ change_id: command.change_id, expected_state_version: frozen.state_version, expected_state_hash: frozen.state_hash }); assert.equal(pr.outcome, 'ADVANCED'); assert.equal(pr.payload.to_phase, 'HANDOFF');
    const before = await readLocalLedger(ledger, command.change_id); const beforeRecords = decodeRemoteLedger(before).records;
    const injections = scenario.makeInjections(beforeRecords, candidateEvent.detail.candidate_sha); const injected = [];
    for (const input of injections) injected.push(await appendTestLedgerEvent(ledger, {
      change_id: command.change_id, event_class: input.event_class, detail: input.detail,
      state_version: pr.state_version, subject_sha: candidateEvent.detail.candidate_sha, idempotency_id: input.idempotency_id,
    }));
    const injectedRemote = await readLocalLedger(ledger, command.change_id); const injectedDecoded = decodeRemoteLedger(injectedRemote);
    const injectedRecords = injected.map(entry => injectedDecoded.records.find(record => record.event_id === entry.event.event_id)); assert.equal(injectedRecords.every(Boolean), true);
    for (let index = 0; index < injected.length; index += 1) assertExactLedgerReadback({ event: injected[index].event, result: injected[index].readback }, injected[index].event, injectedDecoded.bytes);
    if (injectedRecords.length === 2) {
      assert.equal(injectedRecords[1].sequence, injectedRecords[0].sequence + 1, 'the Test-owned role pair is physically adjacent');
      assert.equal(injectedRecords[0].event_class, 'AGENT_RUN'); assert.equal(injectedRecords[0].detail.stage, 'RESULT'); assert.equal(injectedRecords[1].event_class, 'VALIDATION_RESULT');
      assert.equal(injectedRecords[1].detail.validation_id, injectedRecords[0].detail.correlation_id); assert.equal(injectedRecords[1].detail.idempotency_id, injectedRecords[0].detail.idempotency_id);
    } else assert.deepEqual(Object.keys(injectedRecords[0].detail).sort(), ['candidate_sha', 'delivery_id', 'handoff_sha256', 'pr_head', 'pr_number'].sort(), 'future HANDOFF_READY uses the exact frozen five-field detail');
    const injectedComplete = gatewayEvents.find(event => event.edge === 'COMPLETE' && event.gateway === 'ledger' && event.method === 'readRemoteAppend' && event.result?.value?.event_id === injected.at(-1).event.event_id); assert.ok(injectedComplete, 'every injected record is physically committed and the last one is read back before the Handoff attempt');
    const stopped = await core.run({ change_id: command.change_id, expected_state_version: pr.state_version, expected_state_hash: pr.state_hash });
    assert.equal(stopped.outcome, 'BLOCKED'); assert.equal(stopped.payload.blocked_reason, 'EVIDENCE_CONFLICT'); assert.equal(stopped.payload.next_action, 'MANUAL_CONTROLLER_STOP');
    assert.equal(handoffCalls.length, 0, 'the isolated invalid fixed-tip source never reaches the controlled Handoff consumer');
    assert.equal(prCalls.filter(call => call.method === 'createOrReuse').length, 1, 'the already-read PR is not recreated after evidence conflict');
    const durable = JSON.parse((await base.state.readState({ change_id: command.change_id })).value.bytes); assert.equal(durable.macro_state, 'BLOCKED');
    const after = decodeRemoteLedger(await readLocalLedger(ledger, command.change_id)).records;
    const injectedIndex = after.findIndex(record => record.event_id === injected.at(-1).event.event_id); const blockedIndex = after.findIndex(record => record.event_id === stopped.payload.blocked_event_id);
    assert.ok(injectedIndex >= 0 && blockedIndex === injectedIndex + 1, 'the generic evidence failure is causally recorded immediately after the remotely read isolated source stimulus');
    const blockedReadback = gatewayEvents.find(event => event.edge === 'COMPLETE' && event.gateway === 'ledger' && event.method === 'readRemoteAppend' && event.result?.value?.event_id === stopped.payload.blocked_event_id);
    const blockedStateStart = gatewayEvents.find(event => event.edge === 'START' && event.gateway === 'state' && event.method === 'writeState' && (() => { try { return JSON.parse(Buffer.from(event.request.next_bytes).toString('utf8')).macro_state === 'BLOCKED'; } catch { return false; } })());
    assert.ok(injectedComplete.sequence < blockedReadback.sequence && blockedReadback.sequence < blockedStateStart.sequence, 'injected authority and durable BLOCKED readbacks COMPLETE before the BLOCKED State write START');
  }, { pull_request, handoff: { async writeReadback(request) { handoffCalls.push(structuredClone(request)); return unavailable(null); } } });
});

const fixedTipDeliveryCases010 = [
  ['wrong authoritative path', value => ({ ...value, authoritative_path: `wrong/${value.authoritative_path}` })],
];

for (const [label, mutate] of fixedTipDeliveryCases010) test(`RED-M2-005 / TEST-M2-010 / 010-L13: ${label} is rejected from the actual pre-Handoff Ledger read`, async () => {
  const prCalls = []; const handoffCalls = []; let faultArmed = false;
  const pull_request = {
    async queryCurrent(request) { prCalls.push({ method: 'queryCurrent', request: structuredClone(request) }); return absent('current-pr'); },
    async createOrReuse(request) { prCalls.push({ method: 'createOrReuse', request: structuredClone(request) }); return ok({ number: 113, url: 'https://invalid.example/pr/113', base: request.base, head_branch: request.head_branch, head_sha: request.head_sha, review_ready: true }); },
    async readback(request) { prCalls.push({ method: 'readback', request: structuredClone(request) }); return ok({ number: request.number, url: 'https://invalid.example/pr/113', base: 'main', head_branch: 'work/mac-mini/m2-regression', head_sha: request.expected_head, review_ready: true }); },
  };
  await withObservedK1Prefix(async ({ base, command, core, candidateEvent, candidateTransition, ordinaryRoleResultRoot, ledger, localPausePath, gatewayEvents, faultHits }) => {
    const candidateValidation = await core.run({ change_id: command.change_id, expected_state_version: candidateTransition.state_version, expected_state_hash: candidateTransition.state_hash }); assert.equal(candidateValidation.outcome, 'ADVANCED');
    const validatorAction = await core.run({ change_id: command.change_id, expected_state_version: candidateValidation.state_version, expected_state_hash: candidateValidation.state_hash }); assert.equal(validatorAction.outcome, 'AGENT_ACTION');
    const action = validatorAction.payload.action; const { action_kind, ...binding } = action;
    const childId = `ordinary-validator-fixed-tip-${label}`;
    const started = await core.settlement({ change_id: command.change_id, expected_state_version: validatorAction.state_version, expected_state_hash: validatorAction.state_hash, settlement: { ...binding, stage: 'STARTED', observed_child_id: childId } }); assert.equal(started.outcome, 'WAITING');
    const artifact = { schema_version: '1.0', change_id: command.change_id, candidate_sha: candidateEvent.detail.candidate_sha, validator_head: candidateEvent.detail.candidate_sha, verdict: 'PASS', findings: [], risks: [], unverified: [], open_questions: [] };
    const artifactBytes = Buffer.from(canonicalJson(artifact)); const artifactPath = path.join(ordinaryRoleResultRoot, `${action.correlation_id}.fixed-tip-${label}.json`); await mkdir(path.dirname(artifactPath), { recursive: true }); await writeFile(artifactPath, artifactBytes);
    const validatorPass = await core.settlement({ change_id: command.change_id, expected_state_version: started.state_version, expected_state_hash: started.state_hash, settlement: { ...binding, stage: 'RESULT', observed_child_id: childId, status: 'PASS', artifact_path: artifactPath, artifact_sha256: sha256(artifactBytes), validator_artifact: artifact } }); assert.equal(validatorPass.outcome, 'ADVANCED');
    const pushed = await core.run({ change_id: command.change_id, expected_state_version: validatorPass.state_version, expected_state_hash: validatorPass.state_hash }); assert.equal(pushed.outcome, 'ADVANCED');
    const frozen = await core.run({ change_id: command.change_id, expected_state_version: pushed.state_version, expected_state_hash: pushed.state_hash }); assert.equal(frozen.outcome, 'ADVANCED');
    const pr = await core.run({ change_id: command.change_id, expected_state_version: frozen.state_version, expected_state_hash: frozen.state_hash }); assert.equal(pr.outcome, 'ADVANCED'); assert.equal(pr.payload.to_phase, 'HANDOFF');
    const stateBefore = await base.state.readState({ change_id: command.change_id }); assert.equal(stateBefore.kind, 'OK');
    const actualBefore = await readLocalLedger(ledger, command.change_id); decodeRemoteLedger(actualBefore);
    faultArmed = true;
    const stopped = await core.run({ change_id: command.change_id, expected_state_version: pr.state_version, expected_state_hash: pr.state_hash });
    assert.deepEqual(faultHits, [`ledger:readRemote:${label}`]); assert.equal(stopped.outcome, 'BLOCKED'); assert.equal(stopped.payload.blocked_reason, 'EVIDENCE_CONFLICT'); assert.equal(stopped.payload.next_action, 'MANUAL_CONTROLLER_STOP');
    const fault = gatewayEvents.find(event => event.edge === 'COMPLETE' && event.gateway === 'ledger' && event.method === 'readRemote' && event.faulted === true); assert.ok(fault);
    assert.deepEqual(fault.actual_result, actualBefore, 'the retained producer result is the actual healthy fixed-tip readback'); assert.equal(fault.result.kind, 'OK'); assert.notDeepEqual(fault.result.value, fault.actual_result.value); assert.equal(fault.result.receipt_sha256, sha256(canonicalJson(fault.result.value)), 'the damaged delivered value retains a correct outer Gateway hash');
    assert.equal(handoffCalls.length, 0); assert.equal(prCalls.filter(call => call.method === 'createOrReuse').length, 1);
    const stateAfter = await base.state.readState({ change_id: command.change_id }); assert.deepEqual(stateAfter, stateBefore, 'unproven fixed-tip metadata cannot be represented as a durable BLOCKED authority'); assert.notEqual(stopped.state, 'BLOCKED'); assert.equal(stopped.payload.blocked_event_id, null);
    const pauseWrite = gatewayEvents.find(event => event.edge === 'COMPLETE' && event.gateway === 'state' && event.method === 'writeLocalPause' && event.sequence > fault.sequence);
    const pauseRead = gatewayEvents.find(event => event.edge === 'COMPLETE' && event.gateway === 'state' && event.method === 'readLocalPause' && event.sequence > (pauseWrite?.sequence ?? Number.MAX_SAFE_INTEGER));
    assert.ok(pauseWrite && pauseRead && pauseWrite.sequence < pauseRead.sequence, 'manual local pause bytes are written and read back only after the damaged fixed-tip delivery');
    assert.equal(await exists(localPausePath), true); const pauseBytes = await readFile(localPausePath, 'utf8'); assert.equal(pauseBytes, canonicalJson(JSON.parse(pauseBytes)));
  }, {
    pull_request,
    handoff: { async writeReadback(request) { handoffCalls.push(structuredClone(request)); return unavailable(null); } },
    transformLedgerResult: async ({ method, actualResult, faultHits }) => {
      if (!faultArmed || method !== 'readRemote' || actualResult.kind !== 'OK' || faultHits.length) return actualResult;
      faultHits.push(`ledger:readRemote:${label}`); return ok(mutate(actualResult.value));
    },
  });
});

test('RED-M2-006 / TEST-M2-010 / 010-L13: the shared Ledger object reader proves real commit/tree/blob controls and forwards the same wrong-tree refusal into Core', async () => {
  await withRepository(async fixture => {
    const changeId = 'CHG-original010-reader';
    const eventBytes = makeTestLedgerEventBytes({
      change_id: changeId, event_class: 'CONTROLLER_COMMAND', sequence: 1, state_version: 1,
      subject_sha: fixture.candidate_sha, idempotency_id: '010-reader-A',
      detail: { command_kind: 'DISPATCH', command_id: '010-reader-command', body_sha256: '1'.repeat(64), signature_sha256: '2'.repeat(64), verified_key_id: 'test-key', receipt_digest: '3'.repeat(64), evidence_refs: [], admission: { command_id: '010-reader-command', body_sha256: '1'.repeat(64), idempotency_id: '010-reader-A' }, ready_state_sha256: '4'.repeat(64) },
    });
    const readerFixtureEvent = JSON.parse(eventBytes.toString('utf8')); assert.deepEqual(Object.keys(readerFixtureEvent.detail).sort(), ['admission', 'body_sha256', 'command_id', 'command_kind', 'evidence_refs', 'ready_state_sha256', 'receipt_digest', 'signature_sha256', 'verified_key_id'].sort(), 'the reader fixture itself is the frozen complete CONTROLLER_COMMAND detail variant, not an admission/ready-state null shorthand'); assert.equal(readerFixtureEvent.detail.command_kind, 'DISPATCH'); assert.equal(readerFixtureEvent.detail.command_id, '010-reader-command'); assert.match(readerFixtureEvent.detail.body_sha256, /^[0-9a-f]{64}$/); assert.match(readerFixtureEvent.detail.signature_sha256, /^[0-9a-f]{64}$/); assert.match(readerFixtureEvent.detail.receipt_digest, /^[0-9a-f]{64}$/); assert.match(readerFixtureEvent.detail.ready_state_sha256, /^[0-9a-f]{64}$/); assert.deepEqual(readerFixtureEvent.detail.admission, { command_id: readerFixtureEvent.detail.command_id, body_sha256: readerFixtureEvent.detail.body_sha256, idempotency_id: readerFixtureEvent.idempotency_id });
    const ledgerPath = path.join(fixture.worktree, 'ledger', `${changeId}.jsonl`);
    await mkdir(path.dirname(ledgerPath), { recursive: true }); await writeFile(ledgerPath, eventBytes);
    let result = await runProcess(GIT, ['add', '--', path.relative(fixture.worktree, ledgerPath)], { cwd: fixture.worktree, env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' } }); assert.equal(result.code, 0, result.stderr);
    result = await runProcess(GIT, ['commit', '-m', '010 reader commit A'], { cwd: fixture.worktree, env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' } }); assert.equal(result.code, 0, result.stderr);
    const commitAResult = await runProcess(GIT, ['rev-parse', 'HEAD'], { cwd: fixture.worktree, env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' } }); assert.equal(commitAResult.code, 0, commitAResult.stderr); const commitA = commitAResult.stdout.trim();
    const treeAResult = await runProcess(GIT, ['rev-parse', 'HEAD^{tree}'], { cwd: fixture.worktree, env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' } }); assert.equal(treeAResult.code, 0, treeAResult.stderr); const treeA = treeAResult.stdout.trim();
    const commitBytesA = await runProcess(GIT, ['cat-file', 'commit', commitA], { cwd: fixture.repository, env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' } }); assert.equal(commitBytesA.code, 0, commitBytesA.stderr); assert.match(commitBytesA.stdout, new RegExp(`^tree ${treeA}\\n`));
    const blobBytesA = await runProcess(GIT, ['show', `${commitA}:ledger/${changeId}.jsonl`], { cwd: fixture.repository, env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' } }); assert.equal(blobBytesA.code, 0, blobBytesA.stderr); assert.deepEqual(Buffer.from(blobBytesA.stdout), eventBytes, 'the independent oracle retains the exact non-empty commit-A Ledger blob');
    const blobEntryA = await runProcess(GIT, ['ls-tree', treeA, '--', `ledger/${changeId}.jsonl`], { cwd: fixture.repository, env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' } }); assert.equal(blobEntryA.code, 0, blobEntryA.stderr); const blobShaA = blobEntryA.stdout.trim().split(/\s+/)[2]; assert.match(blobShaA, /^[0-9a-f]{40}$/);
    await writeFile(path.join(fixture.worktree, 'reader-tree-b.txt'), 'distinct existing tree B\n');
    result = await runProcess(GIT, ['add', '--', 'reader-tree-b.txt'], { cwd: fixture.worktree, env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' } }); assert.equal(result.code, 0, result.stderr);
    result = await runProcess(GIT, ['commit', '-m', '010 reader tree B'], { cwd: fixture.worktree, env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' } }); assert.equal(result.code, 0, result.stderr);
    const treeBResult = await runProcess(GIT, ['rev-parse', 'HEAD^{tree}'], { cwd: fixture.worktree, env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' } }); assert.equal(treeBResult.code, 0, treeBResult.stderr); const treeB = treeBResult.stdout.trim(); assert.notEqual(treeA, treeB);
    const absentTip = fixture.candidate_sha;
    const absentCommitBytes = await runProcess(GIT, ['cat-file', 'commit', absentTip], { cwd: fixture.repository, env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' } }); assert.equal(absentCommitBytes.code, 0, absentCommitBytes.stderr); const absentParentMatch = /^parent ([0-9a-f]{40})$/m.exec(absentCommitBytes.stdout); assert.ok(absentParentMatch, 'the non-root absence control derives its first physical parent from independent commit bytes'); const absentParent = absentParentMatch[1];
    const absentTreeResult = await runProcess(GIT, ['rev-parse', `${absentTip}^{tree}`], { cwd: fixture.repository, env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' } }); assert.equal(absentTreeResult.code, 0, absentTreeResult.stderr); const absentTree = absentTreeResult.stdout.trim();
    const absentPath = await runProcess(GIT, ['--literal-pathspecs', 'ls-tree', '-z', '--full-tree', absentTree, '--', `ledger/${changeId}.jsonl`], { cwd: fixture.repository, env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' } }); assert.equal(absentPath.code, 0, absentPath.stderr); assert.equal(absentPath.stdout, '', 'the separately observed existing tree has no authoritative Ledger path');
    await writeFile(ledgerPath, Buffer.alloc(0));
    result = await runProcess(GIT, ['add', '--', path.relative(fixture.worktree, ledgerPath)], { cwd: fixture.worktree, env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' } }); assert.equal(result.code, 0, result.stderr);
    result = await runProcess(GIT, ['commit', '-m', '010 reader empty Ledger blob'], { cwd: fixture.worktree, env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' } }); assert.equal(result.code, 0, result.stderr);
    const emptyTipResult = await runProcess(GIT, ['rev-parse', 'HEAD'], { cwd: fixture.worktree, env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' } }); assert.equal(emptyTipResult.code, 0, emptyTipResult.stderr); const emptyTip = emptyTipResult.stdout.trim();
    const emptyTreeResult = await runProcess(GIT, ['rev-parse', 'HEAD^{tree}'], { cwd: fixture.worktree, env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' } }); assert.equal(emptyTreeResult.code, 0, emptyTreeResult.stderr); const emptyTree = emptyTreeResult.stdout.trim();
    const emptyBlob = await runProcess(GIT, ['show', `${emptyTip}:ledger/${changeId}.jsonl`], { cwd: fixture.repository, env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' } }); assert.equal(emptyBlob.code, 0, emptyBlob.stderr); assert.equal(emptyBlob.stdout, '', 'the empty-file control is a physical present zero-byte blob, never path absence');
    await writeFile(ledgerPath, 'not canonical Ledger JSONL\n'); result = await runProcess(GIT, ['add', '--', path.relative(fixture.worktree, ledgerPath)], { cwd: fixture.worktree, env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' } }); assert.equal(result.code, 0, result.stderr); result = await runProcess(GIT, ['commit', '-m', '010 reader malformed Ledger blob'], { cwd: fixture.worktree, env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' } }); assert.equal(result.code, 0, result.stderr);
    const malformedTipResult = await runProcess(GIT, ['rev-parse', 'HEAD'], { cwd: fixture.worktree, env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' } }); assert.equal(malformedTipResult.code, 0, malformedTipResult.stderr); const malformedTip = malformedTipResult.stdout.trim(); const malformedTreeResult = await runProcess(GIT, ['rev-parse', 'HEAD^{tree}'], { cwd: fixture.worktree, env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' } }); assert.equal(malformedTreeResult.code, 0, malformedTreeResult.stderr); const malformedTree = malformedTreeResult.stdout.trim();
    const factory = production.createLedgerObjectReader;
    assert.equal(typeof factory, 'function', 'CAUSAL_RED: original010 requires the approved shared credential-free object reader export');
    // R109 requires a Controller frozen-head source review of private readRemote/readRemoteAppend wiring after Worker implementation.
    // This dynamic Test proves only the exported shared reader; it deliberately makes no implementation-arrangement claim.
    const reader = factory({ repositoryRoot: fixture.repository, gitExecutable: GIT, runtime_uid: process.getuid(), runtime_gid: process.getgid() });
    assert.equal(Object.isFrozen(reader), true); assert.deepEqual(Object.keys(reader), ['read']);
    const requestA = { remote_ref: 'refs/heads/evidence/agent-runs', expected_tip: null, tip: commitA, tip_tree: treeA, change_id: changeId };
    let positive;
    await withObservedRealSpawns(async observations => {
      positive = await reader.read(requestA);
      assert.deepEqual(observations.map(observation => observation.argv), [
        ['cat-file', '-t', commitA], ['cat-file', 'commit', commitA], ['--literal-pathspecs', 'ls-tree', '-z', '--full-tree', treeA, '--', `ledger/${changeId}.jsonl`],
        ['cat-file', 'blob', blobShaA],
      ], 'the positive shared reader uses the one fixed four-command object proof sequence');
    });
    const positiveValue = { remote_ref: requestA.remote_ref, expected_tip: null, tip: commitA, tip_parent: fixture.candidate_sha, tip_tree: treeA, authoritative_path: `ledger/${changeId}.jsonl`, file_present: true, ledger_bytes_base64: eventBytes.toString('base64'), prior_bytes_sha256: sha256(eventBytes), prior_byte_length: eventBytes.length, last_event_id: JSON.parse(eventBytes.toString('utf8')).event_id, last_event_hash: JSON.parse(eventBytes.toString('utf8')).event_hash, last_sequence: 1 };
    assert.deepEqual(positive, ok(positiveValue), 'the positive reader receipt is derived from the independent physical commit/tree/path/blob oracle');
    await withObservedRealSpawns(async observations => {
      const nullResult = await reader.read({ remote_ref: requestA.remote_ref, expected_tip: null, tip: null, tip_tree: null, change_id: changeId });
      assert.deepEqual(observations, [], 'the null pair is the already-observed empty remote result and executes zero Git commands');
      assert.deepEqual(nullResult, ok({ ...positiveValue, tip: null, tip_parent: null, tip_tree: null, file_present: false, ledger_bytes_base64: '', prior_bytes_sha256: sha256(Buffer.alloc(0)), prior_byte_length: 0, last_event_id: null, last_event_hash: null, last_sequence: 0 }));
    });
    const absentResult = await reader.read({ remote_ref: requestA.remote_ref, expected_tip: null, tip: absentTip, tip_tree: absentTree, change_id: changeId });
    assert.deepEqual(absentResult, ok({ ...positiveValue, tip: absentTip, tip_parent: absentParent, tip_tree: absentTree, file_present: false, ledger_bytes_base64: '', prior_bytes_sha256: sha256(Buffer.alloc(0)), prior_byte_length: 0, last_event_id: null, last_event_hash: null, last_sequence: 0 }), 'a proven existing tree without the authority path remains a distinct healthy absence');
    const emptyResult = await reader.read({ remote_ref: requestA.remote_ref, expected_tip: null, tip: emptyTip, tip_tree: emptyTree, change_id: changeId });
    assert.deepEqual(emptyResult, { kind: 'CONFLICT', reason: 'READBACK_MISMATCH', observed_identity: emptyTree }, 'a physical present empty blob is conflicting evidence, not absence');
    const malformedResult = await reader.read({ remote_ref: requestA.remote_ref, expected_tip: null, tip: malformedTip, tip_tree: malformedTree, change_id: changeId });
    assert.deepEqual(malformedResult, { kind: 'CONFLICT', reason: 'READBACK_MISMATCH', observed_identity: malformedTree }, 'a physically read malformed successful blob is conflicting evidence, not process uncertainty');
    const missingObject = 'f'.repeat(40); const absentObject = await runProcess(GIT, ['cat-file', '-e', `${missingObject}^{commit}`], { cwd: fixture.repository, env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' } }); assert.notEqual(absentObject.code, 0, 'the unavailable control names a physically absent Git object');
    const unavailableResult = await reader.read({ remote_ref: requestA.remote_ref, expected_tip: null, tip: missingObject, tip_tree: missingObject, change_id: changeId });
    assert.deepEqual(unavailableResult, { kind: 'UNAVAILABLE', reason: 'PROCESS_FAILED', partial_receipt: null }, 'actual missing-object process failure is unavailable, never a fabricated path absence or conflict');
    let directRefusal;
    await withObservedRealSpawns(async observations => {
      directRefusal = await reader.read({ ...requestA, tip_tree: treeB });
      assert.deepEqual(observations.map(observation => observation.argv), [['cat-file', '-t', commitA], ['cat-file', 'commit', commitA]], 'wrong-tree refusal ends immediately after the physically proven commit tree and never reads path/blob');
    });
    assert.deepEqual(directRefusal, { kind: 'CONFLICT', reason: 'READBACK_MISMATCH', observed_identity: treeA }, 'the physical commit-A tree—not the untrusted tree-B claim—is the independently observed refusal identity');
    const prCalls = []; const handoffCalls = []; let faultArmed = false; let forwardedRefusal = null;
    const pull_request = {
      async queryCurrent(request) { prCalls.push({ method: 'queryCurrent', request: structuredClone(request) }); return absent('current-pr'); },
      async createOrReuse(request) { prCalls.push({ method: 'createOrReuse', request: structuredClone(request) }); return ok({ number: 114, url: 'https://invalid.example/pr/114', base: request.base, head_branch: request.head_branch, head_sha: request.head_sha, review_ready: true }); },
      async readback(request) { prCalls.push({ method: 'readback', request: structuredClone(request) }); return ok({ number: request.number, url: 'https://invalid.example/pr/114', base: 'main', head_branch: 'work/mac-mini/m2-regression', head_sha: request.expected_head, review_ready: true }); },
    };
    await withObservedK1Prefix(async ({ base, command, core, candidateEvent, candidateTransition, ordinaryRoleResultRoot, ledger, localPausePath, gatewayEvents, faultHits }) => {
      const candidateValidation = await core.run({ change_id: command.change_id, expected_state_version: candidateTransition.state_version, expected_state_hash: candidateTransition.state_hash }); assert.equal(candidateValidation.outcome, 'ADVANCED');
      const validatorAction = await core.run({ change_id: command.change_id, expected_state_version: candidateValidation.state_version, expected_state_hash: candidateValidation.state_hash }); assert.equal(validatorAction.outcome, 'AGENT_ACTION');
      const action = validatorAction.payload.action; const { action_kind, ...binding } = action;
      const childId = 'ordinary-validator-reader-wrong-tree';
      const started = await core.settlement({ change_id: command.change_id, expected_state_version: validatorAction.state_version, expected_state_hash: validatorAction.state_hash, settlement: { ...binding, stage: 'STARTED', observed_child_id: childId } }); assert.equal(started.outcome, 'WAITING');
      const artifact = { schema_version: '1.0', change_id: command.change_id, candidate_sha: candidateEvent.detail.candidate_sha, validator_head: candidateEvent.detail.candidate_sha, verdict: 'PASS', findings: [], risks: [], unverified: [], open_questions: [] };
      const artifactBytes = Buffer.from(canonicalJson(artifact)); const artifactPath = path.join(ordinaryRoleResultRoot, `${action.correlation_id}.reader-wrong-tree.json`); await mkdir(path.dirname(artifactPath), { recursive: true }); await writeFile(artifactPath, artifactBytes);
      const validatorPass = await core.settlement({ change_id: command.change_id, expected_state_version: started.state_version, expected_state_hash: started.state_hash, settlement: { ...binding, stage: 'RESULT', observed_child_id: childId, status: 'PASS', artifact_path: artifactPath, artifact_sha256: sha256(artifactBytes), validator_artifact: artifact } }); assert.equal(validatorPass.outcome, 'ADVANCED');
      const pushed = await core.run({ change_id: command.change_id, expected_state_version: validatorPass.state_version, expected_state_hash: validatorPass.state_hash }); assert.equal(pushed.outcome, 'ADVANCED');
      const frozen = await core.run({ change_id: command.change_id, expected_state_version: pushed.state_version, expected_state_hash: pushed.state_hash }); assert.equal(frozen.outcome, 'ADVANCED');
      const pr = await core.run({ change_id: command.change_id, expected_state_version: frozen.state_version, expected_state_hash: frozen.state_hash }); assert.equal(pr.outcome, 'ADVANCED'); assert.equal(pr.payload.to_phase, 'HANDOFF');
      const stateBefore = await base.state.readState({ change_id: command.change_id }); assert.equal(stateBefore.kind, 'OK');
      faultArmed = true;
      const stopped = await core.run({ change_id: command.change_id, expected_state_version: pr.state_version, expected_state_hash: pr.state_hash });
      assert.deepEqual(faultHits, ['ledger:readRemote:reader-wrong-tree']); assert.equal(stopped.outcome, 'BLOCKED'); assert.equal(stopped.payload.blocked_reason, 'EVIDENCE_CONFLICT'); assert.equal(stopped.payload.next_action, 'MANUAL_CONTROLLER_STOP');
      const fault = gatewayEvents.find(event => event.edge === 'COMPLETE' && event.gateway === 'ledger' && event.method === 'readRemote' && event.faulted === true); assert.ok(fault); assert.deepEqual(fault.result, forwardedRefusal, 'Core receives the actual shared-reader refusal at this controlled remote-observation boundary, not a reconstructed or post-OK mutation');
      assert.equal(handoffCalls.length, 0); assert.equal(prCalls.filter(call => call.method === 'createOrReuse').length, 1, 'the already-read PR is never recreated after fixed evidence conflict');
      const stateAfter = await base.state.readState({ change_id: command.change_id }); assert.deepEqual(stateAfter, stateBefore, 'wrong-tree evidence permits no successful State or delivery progress'); assert.equal(stopped.payload.blocked_event_id, null);
      assert.equal(await exists(localPausePath), true, 'the existing manual diagnostic is permitted but must be observed rather than treated as a successful State transition'); const pauseBytes = await readFile(localPausePath, 'utf8'); const pause = JSON.parse(pauseBytes); assert.equal(pauseBytes, canonicalJson(pause)); assert.equal(pause.reason, 'EVIDENCE_CONFLICT'); assert.equal(pause.next_action, 'MANUAL_CONTROLLER_STOP'); assert.equal(pause.operation, 'run'); assert.equal(pause.request_sha256, sha256(canonicalJson({ change_id: command.change_id, expected_state_version: pr.state_version, expected_state_hash: pr.state_hash }))); assert.equal(pause.state_version, JSON.parse(stateBefore.value.bytes).state_version); assert.equal(pause.state_hash, stateBefore.value.sha256); assert.equal(pause.event_id, null); assert.equal(pause.expected_event_hash, null); assert.equal(pause.expected_evidence_tip, null); assert.equal(stopped.payload.local_pause_id, pause.diagnostic_id);
      const remote = decodeRemoteLedger(await readLocalLedger(ledger, command.change_id)); assert.equal(remote.records.some(record => record.event_class === 'HANDOFF_READY'), false, 'wrong-tree evidence appends no HANDOFF_READY record');
    }, {
      pull_request,
      handoff: { async writeReadback(request) { handoffCalls.push(structuredClone(request)); return unavailable(null); } },
      transformLedgerResult: async ({ method, actualResult, faultHits }) => {
        if (!faultArmed || method !== 'readRemote' || actualResult.kind !== 'OK' || faultHits.length) return actualResult;
        forwardedRefusal = await reader.read({ ...requestA, tip_tree: treeB });
        assert.deepEqual(forwardedRefusal, directRefusal, 'the Core-bound failure is a fresh physical shared-reader observation with the same fixed commit-A/tree-B identity');
        faultHits.push('ledger:readRemote:reader-wrong-tree'); return forwardedRefusal;
      },
    });
  });
});

const ledgerAppendRefCases010 = [
  ['wrong record offset', 'record_offset', value => value + 1],
  ['wrong record-slice hash', 'record_bytes_sha256', value => `${value.startsWith('0') ? '1' : '0'}${value.slice(1)}`],
];

for (const [label, field, mutate] of ledgerAppendRefCases010) test(`RED-M2-005 / TEST-M2-010 / 010-L13: ${label} on one actual final-validation append readback stops before PR/Handoff`, async () => {
  const handoffCalls = [];
  await withObservedK1Prefix(async ({ command, core, candidateTransition, ledger, observedLedgerReadbacks, gatewayEvents, faultHits }) => {
    const stopped = await core.run({ change_id: command.change_id, expected_state_version: candidateTransition.state_version, expected_state_hash: candidateTransition.state_hash });
    assert.deepEqual(faultHits, [`ledger:readRemoteAppend:${label}`]); assert.equal(stopped.outcome, 'BLOCKED'); assert.equal(stopped.payload.blocked_reason, 'EVIDENCE_CONFLICT');
    const fault = gatewayEvents.find(event => event.edge === 'COMPLETE' && event.gateway === 'ledger' && event.method === 'readRemoteAppend' && event.faulted === true); assert.ok(fault);
    assert.equal(fault.actual_result.kind, 'OK'); assert.equal(fault.result.kind, 'OK');
    const omit = value => Object.fromEntries(Object.entries(value).filter(([key]) => key !== field));
    assert.deepEqual(omit(fault.result.value), omit(fault.actual_result.value), `${label} changes no non-target append-receipt field`);
    assert.notEqual(fault.result.value[field], fault.actual_result.value[field]); assert.equal(fault.result.receipt_sha256, sha256(canonicalJson(fault.result.value)));
    const remote = await readLocalLedger(ledger, command.change_id); const decoded = decodeRemoteLedger(remote);
    const event = decoded.records.find(record => record.event_id === fault.actual_result.value.event_id); assert.ok(event, 'the healthy producer record exists in the real bare-Git Ledger');
    const observed = observedLedgerReadbacks.find(entry => entry.event.event_id === event.event_id); assertExactLedgerReadback(observed, event, decoded.bytes);
    assert.equal(handoffCalls.length, 0); assert.equal(gatewayEvents.some(event => event.edge === 'START' && event.gateway === 'pull_request'), false, 'damaged physical Ledger reference evidence starts no PR or Handoff effect');
  }, {
    armLedgerFaultAfterValidationId: 'final-validation-candidate',
    transformLedgerResult: async ({ method, event_class, actualResult, faultHits }) => {
      if (method !== 'readRemoteAppend' || event_class !== 'VALIDATION_RESULT' || faultHits.length || actualResult.kind !== 'OK') return actualResult;
      faultHits.push(`ledger:readRemoteAppend:${label}`); return ok({ ...actualResult.value, [field]: mutate(actualResult.value[field]) });
    },
    handoff: { async writeReadback(request) { handoffCalls.push(structuredClone(request)); return unavailable(null); } },
  });
});

test('RED-M2-005 / TEST-M2-010 / 010-L12 ordinary selection: Handoff rejects an actual Validator RESULT whose canonical remote source omits only its adjacent receipt', async () => {
  const handoffCalls = []; const prCalls = []; const ledgerRoute = { target: null };
  const pull_request = {
    async queryCurrent(request) { prCalls.push({ method: 'queryCurrent', request: structuredClone(request) }); return absent('current-pr'); },
    async createOrReuse(request) { prCalls.push({ method: 'createOrReuse', request: structuredClone(request) }); return ok({ number: 115, url: 'https://invalid.example/pr/115', base: request.base, head_branch: request.head_branch, head_sha: request.head_sha, review_ready: true }); },
    async readback(request) { prCalls.push({ method: 'readback', request: structuredClone(request) }); return ok({ number: request.number, url: 'https://invalid.example/pr/115', base: 'main', head_branch: 'work/mac-mini/m2-regression', head_sha: request.expected_head, review_ready: true }); },
  };
  await withObservedK1Prefix(async ({ base, command, core, candidateEvent, candidateTransition, ordinaryRoleResultRoot, ledger, primaryLedger, fixtureRoot, gatewayEvents }) => {
    const candidateValidation = await core.run({ change_id: command.change_id, expected_state_version: candidateTransition.state_version, expected_state_hash: candidateTransition.state_hash }); assert.equal(candidateValidation.outcome, 'ADVANCED');
    const validatorAction = await core.run({ change_id: command.change_id, expected_state_version: candidateValidation.state_version, expected_state_hash: candidateValidation.state_hash }); assert.equal(validatorAction.outcome, 'AGENT_ACTION');
    const action = validatorAction.payload.action; const { action_kind, ...binding } = action;
    const started = await core.settlement({ change_id: command.change_id, expected_state_version: validatorAction.state_version, expected_state_hash: validatorAction.state_hash, settlement: { ...binding, stage: 'STARTED', observed_child_id: '010-l12-missing-receipt' } }); assert.equal(started.outcome, 'WAITING');
    const artifact = { schema_version: '1.0', change_id: command.change_id, candidate_sha: candidateEvent.detail.candidate_sha, validator_head: candidateEvent.detail.candidate_sha, verdict: 'PASS', findings: [], risks: [], unverified: [], open_questions: [] };
    const artifactBytes = Buffer.from(canonicalJson(artifact)); const artifactPath = path.join(ordinaryRoleResultRoot, `${action.correlation_id}.010-l12-missing-receipt.json`); await mkdir(path.dirname(artifactPath), { recursive: true }); await writeFile(artifactPath, artifactBytes);
    const validatorPass = await core.settlement({ change_id: command.change_id, expected_state_version: started.state_version, expected_state_hash: started.state_hash, settlement: { ...binding, stage: 'RESULT', observed_child_id: '010-l12-missing-receipt', status: 'PASS', artifact_path: artifactPath, artifact_sha256: sha256(artifactBytes), validator_artifact: artifact } }); assert.equal(validatorPass.outcome, 'ADVANCED');
    const pushed = await core.run({ change_id: command.change_id, expected_state_version: validatorPass.state_version, expected_state_hash: validatorPass.state_hash }); assert.equal(pushed.outcome, 'ADVANCED');
    const frozen = await core.run({ change_id: command.change_id, expected_state_version: pushed.state_version, expected_state_hash: pushed.state_hash }); assert.equal(frozen.outcome, 'ADVANCED');
    const pr = await core.run({ change_id: command.change_id, expected_state_version: frozen.state_version, expected_state_hash: frozen.state_hash }); assert.equal(pr.outcome, 'ADVANCED'); assert.equal(pr.payload.to_phase, 'HANDOFF');
    assert.deepEqual(prCalls.map(call => call.method), ['queryCurrent', 'createOrReuse', 'readback'], 'the source omission follows one independently healthy existing PR query/create/readback control');

    const primaryRemote = await readLocalLedger(primaryLedger, command.change_id); const primary = decodeRemoteLedger(primaryRemote);
    const resultIndex = primary.records.findLastIndex(record => record.event_class === 'AGENT_RUN' && record.detail?.stage === 'RESULT' && record.detail?.correlation_id === action.correlation_id); assert.ok(resultIndex >= 0);
    const resultRecord = primary.records[resultIndex]; const receiptRecord = primary.records[resultIndex + 1];
    assert.equal(receiptRecord?.event_class, 'VALIDATION_RESULT'); assert.equal(receiptRecord.detail.validation_id, action.correlation_id);
    assert.equal(receiptRecord.detail.idempotency_id, resultRecord.detail.idempotency_id); assert.equal(receiptRecord.sequence, resultRecord.sequence + 1);
    const resultReadback = gatewayEvents.find(event => event.edge === 'COMPLETE' && event.gateway === 'ledger' && event.method === 'readRemoteAppend' && event.actual_result?.value?.event_id === resultRecord.event_id);
    const receiptReadback = gatewayEvents.find(event => event.edge === 'COMPLETE' && event.gateway === 'ledger' && event.method === 'readRemoteAppend' && event.actual_result?.value?.event_id === receiptRecord.event_id);
    assert.ok(resultReadback && receiptReadback && resultReadback.sequence < receiptReadback.sequence, 'the public Core fully commits and reads back the healthy Validator pair before the source stimulus is built');

    const alternate = await cloneTestLedgerWithoutEvent({ root: path.join(fixtureRoot, '010-l12-alternate-source'), changeId: command.change_id, records: primary.records, omittedEventId: receiptRecord.event_id });
    const expectedLogicalRecords = primary.records.filter(record => record.event_id !== receiptRecord.event_id);
    assert.equal(alternate.decoded.records.length, expectedLogicalRecords.length);
    for (let index = 0; index < expectedLogicalRecords.length; index += 1) {
      const { sequence: ignoredExpectedSequence, event_hash: ignoredExpectedHash, ...expectedIdentity } = expectedLogicalRecords[index];
      const { sequence: ignoredActualSequence, event_hash: ignoredActualHash, ...actualIdentity } = alternate.decoded.records[index];
      assert.deepEqual(actualIdentity, expectedIdentity, 'omitting the receipt preserves every non-derived field of every other real source record');
      assert.equal(alternate.decoded.records[index].sequence, index + 1); const { event_hash, ...preimage } = alternate.decoded.records[index]; assert.equal(event_hash, sha256(canonicalJson(preimage)));
    }
    const alternateResultIndex = alternate.decoded.records.findIndex(record => record.event_id === resultRecord.event_id); assert.ok(alternateResultIndex >= 0);
    assert.equal(alternate.decoded.records.some(record => record.event_class === 'VALIDATION_RESULT' && record.detail?.validation_id === action.correlation_id), false, 'the alternate source has the exact role RESULT and no matching receipt anywhere');
    ledgerRoute.target = alternate.ledger; const routeSwitchSequence = gatewayEvents.at(-1)?.sequence ?? 0;
    const stopped = await core.run({ change_id: command.change_id, expected_state_version: pr.state_version, expected_state_hash: pr.state_hash });
    assert.equal(stopped.outcome, 'BLOCKED'); assert.equal(stopped.payload.blocked_reason, 'EVIDENCE_CONFLICT'); assert.equal(stopped.payload.next_action, 'MANUAL_CONTROLLER_STOP');
    assert.equal(handoffCalls.length, 0, 'missing ordinary source receipt starts no Handoff publication');
    assert.equal(prCalls.filter(call => call.method === 'createOrReuse').length, 1, 'missing receipt never recreates the already read-back PR');
    const sourceRead = gatewayEvents.find(event => event.sequence > routeSwitchSequence && event.edge === 'COMPLETE' && event.gateway === 'ledger' && event.method === 'readRemote'); assert.ok(sourceRead);
    assert.equal(sourceRead.actual_result.kind, 'OK'); assert.equal(sourceRead.actual_result.value.tip, alternate.remote.value.tip); assert.equal(sourceRead.actual_result.value.tip_tree, alternate.remote.value.tip_tree);
    assert.equal(sourceRead.actual_result.value.ledger_bytes_base64, alternate.remote.value.ledger_bytes_base64); assert.equal(sourceRead.actual_result.receipt_sha256, sha256(canonicalJson(sourceRead.actual_result.value)));
    const blockedPrepareStart = gatewayEvents.find(event => event.sequence > sourceRead.sequence && event.edge === 'START' && event.gateway === 'ledger' && event.method === 'prepareAppend' && ledgerPrepareEvent(event.request)?.event_class === 'BLOCKED'); assert.ok(blockedPrepareStart);
    const blockedPrepare = gatewayEvents.find(event => event.sequence > blockedPrepareStart.sequence && event.edge === 'COMPLETE' && event.gateway === 'ledger' && event.method === 'prepareAppend');
    const blockedCommit = gatewayEvents.find(event => event.sequence > (blockedPrepare?.sequence ?? Number.MAX_SAFE_INTEGER) && event.edge === 'COMPLETE' && event.gateway === 'ledger' && event.method === 'commitAndPush');
    const blockedReadback = gatewayEvents.find(event => event.sequence > (blockedCommit?.sequence ?? Number.MAX_SAFE_INTEGER) && event.edge === 'COMPLETE' && event.gateway === 'ledger' && event.method === 'readRemoteAppend');
    assert.ok(blockedPrepare && blockedCommit && blockedReadback, 'the same routed alternate authority completes prepare, commit/push, and exact BLOCKED readback');
    assert.equal(blockedReadback.actual_result.value.event_id, stopped.payload.blocked_event_id);
    const finalAlternateRemote = await readLocalLedger(alternate.ledger, command.change_id); const finalAlternate = decodeRemoteLedger(finalAlternateRemote);
    const blockedRecord = finalAlternate.records.at(-1); assert.equal(blockedRecord.event_class, 'BLOCKED'); assert.equal(blockedRecord.event_id, stopped.payload.blocked_event_id);
    assert.equal(blockedReadback.actual_result.value.parent_tip, alternate.remote.value.tip); assertExactLedgerReadback(alternate.readbacks.at(-1), blockedRecord, finalAlternate.bytes);
    assert.deepEqual(await readLocalLedger(primaryLedger, command.change_id), primaryRemote, 'the complete primary pair remains byte/tip/tree identical after the routed alternate stop');
    const durable = await base.state.readState({ change_id: command.change_id }); assert.equal(durable.kind, 'OK'); assert.equal(JSON.parse(durable.value.bytes).macro_state, 'BLOCKED');
  }, {
    ledgerRoute,
    pull_request,
    handoff: { async writeReadback(request) { handoffCalls.push(structuredClone(request)); return unavailable(null); } },
  });
});

test('RED-M2-005 / TEST-M2-010 / 010-L04/L09/L12: the same fixed validation ID in a real pre-cycle source is not selected into current-cycle Handoff refs', async () => {
  const source = {}; const handoffCalls = []; const controlledRoot = await mkdtemp(path.join(os.tmpdir(), 'juanerai-m2-original010-handoff-'));
  const pull_request = {
    async queryCurrent() { return absent('current-pr'); },
    async createOrReuse(request) { return ok({ number: 119, url: 'https://invalid.example/pr/119', base: request.base, head_branch: request.head_branch, head_sha: request.head_sha, review_ready: true }); },
    async readback(request) { return ok({ number: request.number, url: 'https://invalid.example/pr/119', base: 'main', head_branch: 'work/mac-mini/m2-regression', head_sha: request.expected_head, review_ready: true }); },
  };
  const handoff = { async writeReadback(request) {
    assert.deepEqual(Object.keys(request).sort(), ['expected_sha256', 'handoff_bytes']); const document = JSON.parse(Buffer.from(request.handoff_bytes).toString('utf8'));
    const target = path.join(controlledRoot, `handoff-${handoffCalls.length + 1}.json`);
    await writeFile(target, request.handoff_bytes); const readback = await readFile(target);
    assert.deepEqual(readback, Buffer.from(request.handoff_bytes), 'the controlled original010 Handoff boundary compares exact bytes across the Buffer/Uint8Array boundary');
    handoffCalls.push({ request: structuredClone(request), document, target, bytes: readback }); return ok({ handoff_sha256: sha256(readback), delivery_id: document.delivery_id });
  } };
  try {
  await withObservedK1Prefix(async ({ base, command, core, candidateEvent, candidateTransition, ordinaryRoleResultRoot, ledger, observedLedgerReadbacks, gatewayEvents, coreWorktree }) => {
    const assertCanonicalState = async (response, label) => {
      const readback = await base.state.readState({ change_id: command.change_id }); assert.equal(readback.kind, 'OK', `${label} State has an actual readback`);
      const state = JSON.parse(readback.value.bytes); assert.equal(readback.value.bytes, canonicalJson(state), `${label} State bytes are canonical`);
      assert.equal(readback.value.sha256, sha256(readback.value.bytes), `${label} State full hash is the actual bytes hash`);
      assert.equal(response.state_version, state.state_version, `${label} response version equals read-back State`);
      assert.equal(response.state_hash, readback.value.sha256, `${label} response hash equals read-back State`);
      return { readback, state };
    };
    const assertFixedTipRef = (preHandoff, records, ref, label) => {
      assert.equal(ref.remote_ref, preHandoff.value.remote_ref, `${label} ref keeps the fixed remote ref`);
      assert.equal(ref.tip, preHandoff.value.tip, `${label} ref keeps the fixed pre-Handoff tip`);
      assert.equal(ref.tip_tree, preHandoff.value.tip_tree, `${label} ref keeps the fixed pre-Handoff tree`);
      assert.equal(ref.authoritative_path, preHandoff.value.authoritative_path, `${label} ref keeps the fixed authority path`);
      const record = records.find(candidate => candidate.event_id === ref.event_id); assert.ok(record, `${label} ref event exists at the fixed tip`);
      assert.equal(record.sequence, ref.sequence); assert.equal(record.event_hash, ref.event_hash);
      const bytes = Buffer.from(preHandoff.value.ledger_bytes_base64, 'base64'); const slice = bytes.subarray(ref.record_offset, ref.record_offset + ref.record_length);
      assert.equal(slice.length, ref.record_length); assert.equal(sha256(slice), ref.record_bytes_sha256, `${label} ref hashes its exact fixed-tip byte slice`);
      assert.equal(slice.toString('utf8'), `${canonicalJson(record)}\n`, `${label} ref slice reserializes to exactly one canonical record`);
    };
    const canonicalDiffsSince = start => gatewayEvents.filter(event => event.edge === 'COMPLETE' && event.gateway === 'git' && event.method === 'canonicalDiff').slice(start);
    const settlePass = async (response, role, suffix, candidate, afterStarted = null) => {
      assert.equal(response.outcome, 'AGENT_ACTION'); const action = response.payload.action; const { action_kind, ...binding } = action;
      assert.equal(action.role, role, `the ${suffix} cycle advances only through its public ${role} action`);
      const started = await core.settlement({ change_id: command.change_id, expected_state_version: response.state_version, expected_state_hash: response.state_hash, settlement: { ...binding, stage: 'STARTED', observed_child_id: `010-${suffix}-${role}` } }); assert.equal(started.outcome, 'WAITING');
      if (afterStarted) await afterStarted();
      const artifactPath = path.join(ordinaryRoleResultRoot, `${action.correlation_id}.010-${suffix}.json`);
      const artifact = role === 'juaner_validator'
        ? { schema_version: '1.0', change_id: command.change_id, candidate_sha: candidate.sha, validator_head: candidate.sha, verdict: 'PASS', findings: [], risks: [], unverified: [], open_questions: [] }
        : { status: 'PASS' };
      const artifactBytes = Buffer.from(canonicalJson(artifact)); await mkdir(path.dirname(artifactPath), { recursive: true }); await writeFile(artifactPath, artifactBytes);
      const settlement = { ...binding, stage: 'RESULT', observed_child_id: `010-${suffix}-${role}`, status: 'PASS', artifact_path: artifactPath, artifact_sha256: sha256(artifactBytes) };
      if (role === 'juaner_validator') settlement.validator_artifact = artifact;
      const settled = await core.settlement({ change_id: command.change_id, expected_state_version: started.state_version, expected_state_hash: started.state_hash, settlement }); assert.equal(settled.outcome, 'ADVANCED');
      return settled;
    };
    const preHandoffs = [];
    const finishCycle = async (candidateTransition, candidate, suffix) => {
      const candidateValidation = await core.run({ change_id: command.change_id, expected_state_version: candidateTransition.state_version, expected_state_hash: candidateTransition.state_hash }); assert.equal(candidateValidation.outcome, 'ADVANCED');
      const validatorPass = await settlePass(await core.run({ change_id: command.change_id, expected_state_version: candidateValidation.state_version, expected_state_hash: candidateValidation.state_hash }), 'juaner_validator', suffix, candidate);
      const pushed = await core.run({ change_id: command.change_id, expected_state_version: validatorPass.state_version, expected_state_hash: validatorPass.state_hash }); assert.equal(pushed.outcome, 'ADVANCED');
      const frozen = await core.run({ change_id: command.change_id, expected_state_version: pushed.state_version, expected_state_hash: pushed.state_hash }); assert.equal(frozen.outcome, 'ADVANCED');
      const prePrState = JSON.parse((await base.state.readState({ change_id: command.change_id })).value.bytes);
      const prGatewayStart = gatewayEvents.length;
      const pr = await core.run({ change_id: command.change_id, expected_state_version: frozen.state_version, expected_state_hash: frozen.state_hash });
      const prGatewayCalls = gatewayEvents.slice(prGatewayStart)
        .filter(event => event.gateway === 'pull_request')
        .map(event => ({ edge: event.edge, method: event.method, request: event.request, actual_result: event.actual_result ?? null, result: event.result ?? null }));
      assert.equal(pr.outcome, 'ADVANCED', `010 prior-cycle PR frontier: ${canonicalJson({ suffix, candidate, pre_pr_delivery: prePrState.delivery, actual_pr_result: pr, pr_gateway_calls: prGatewayCalls })}`);
      assert.equal(pr.payload.to_phase, 'HANDOFF');
      const preHandoff = await readLocalLedger(ledger, command.change_id); assert.equal(preHandoff.kind, 'OK', `${suffix} cycle has an actual remote Ledger readback before Handoff`);
      const bytes = Buffer.from(preHandoff.value.ledger_bytes_base64, 'base64'); assert.equal(bytes.toString('base64'), preHandoff.value.ledger_bytes_base64); assert.equal(bytes.length, preHandoff.value.prior_byte_length); assert.equal(sha256(bytes), preHandoff.value.prior_bytes_sha256);
      const records = decodeRemoteLedger(preHandoff).records; assert.equal(records.at(-1).event_id, preHandoff.value.last_event_id); assert.equal(records.at(-1).event_hash, preHandoff.value.last_event_hash); assert.equal(records.at(-1).sequence, preHandoff.value.last_sequence);
      preHandoffs.push({ suffix, preHandoff, records, candidate });
      const ready = await core.run({ change_id: command.change_id, expected_state_version: pr.state_version, expected_state_hash: pr.state_hash }); assert.equal(ready.outcome, 'AWAITING_CONTROLLER');
      return { ready, preHandoff, records };
    };
    const prior = await finishCycle(candidateTransition, { sha: candidateEvent.detail.candidate_sha }, 'prior'); const priorReady = prior.ready; assert.equal(handoffCalls.length, 1);
    const priorState = await assertCanonicalState(priorReady, 'prior AWAITING_CONTROLLER');
    assert.equal(priorState.state.macro_state, 'AWAITING_CONTROLLER'); assert.equal(priorState.state.candidate.frozen, true);
    assert.equal(priorState.state.candidate.sha, candidateEvent.detail.candidate_sha); assert.equal(priorState.state.candidate.tree, candidateEvent.detail.tree);
    assert.equal(priorState.state.candidate.sha, priorState.state.delivery.remote_head); assert.equal(priorState.state.candidate.sha, priorState.state.delivery.pull_request.head_sha);
    const priorWorkerBytes = await runProcess(GIT, ['show', `${candidateEvent.detail.tree}:tracked.txt`], { cwd: coreWorktree, env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' } }); assert.equal(priorWorkerBytes.code, 0, priorWorkerBytes.stderr); assert.equal(priorWorkerBytes.stdout, 'actual worker output\n');
    const priorDiffs = canonicalDiffsSince(0); assert.equal(priorDiffs.length, 2, 'the prior cycle makes exactly Freeze and Handoff canonical-diff observations'); assert.deepEqual(priorDiffs[0].actual_result, priorDiffs[1].actual_result);
    const priorHandoff = handoffCalls[0]; assert.equal(sha256(priorHandoff.bytes), priorHandoff.request.expected_sha256, 'prior Handoff expected hash covers actual reread bytes');
    const priorDocument = JSON.parse(priorHandoff.bytes.toString('utf8')); assert.deepEqual(priorDocument, priorHandoff.document, 'prior Handoff consumes its actual controlled readback bytes');
    const priorPreHandoff = preHandoffs.find(item => item.suffix === 'prior'); assert.ok(priorPreHandoff);
    for (const ref of priorDocument.ledger_refs) assertFixedTipRef(priorPreHandoff.preHandoff, priorPreHandoff.records, ref, 'prior Handoff');
    const requestedChange = { schema_version: '1.0', kind: 'CHANGES_REQUESTED', change_id: command.change_id, revision_of_candidate_sha: candidateEvent.detail.candidate_sha, scope: command.scope, requested_changes: [{ path: 'tracked.txt', kind: 'REPLACE_CONTENT', content: 'revised worker output\n' }] };
    const decision = { kind: 'controller_decision', id: 'changes-requested-010', subject_sha: candidateEvent.detail.candidate_sha };
    const decisionSha = sha256(canonicalJson(requestedChange));
    const revisionNonce = Buffer.alloc(32, 0x42).toString('base64'); assert.equal(Buffer.from(revisionNonce, 'base64').length, 32); assert.equal(Buffer.from(revisionNonce, 'base64').toString('base64'), revisionNonce); assert.notEqual(revisionNonce, command.nonce);
    const revision = makeDispatch({
      command_kind: 'REVISION', command_id: 'command-revision-cycle-010', idempotency_id: 'revision-cycle-010', nonce: revisionNonce,
      repository: command.repository, change_id: command.change_id, scope: command.scope, worktree: command.worktree,
      payload: { changes_requested_ref: decision.id, revision_of_candidate_sha: candidateEvent.detail.candidate_sha, resume_phase: 'TEST_RED' },
      evidence_refs: [{ ...decision, sha256: decisionSha }], receipt_digest: decisionSha,
      expected_state_version: priorReady.state_version, expected_state_hash: priorReady.state_hash,
      key_id: command.key_id, issued_at: command.issued_at, expires_at: command.expires_at,
    });
    const revisionApplied = await core.applyControllerCommand(signed(revision)); assert.equal(revisionApplied.outcome, 'APPLIED');
    const revisionState = await assertCanonicalState(revisionApplied, 'current REVISION');
    assert.equal(revisionState.state.authorization_cycle.command_id, revision.command_id); assert.equal(revisionState.state.authorization_cycle.command_kind, 'REVISION');
    assert.equal(revisionState.state.candidate.sha, candidateEvent.detail.candidate_sha); assert.equal(revisionState.state.candidate.tree, candidateEvent.detail.tree); assert.equal(revisionState.state.delivery.remote_head, candidateEvent.detail.candidate_sha);
    const revisionRemote = decodeRemoteLedger(await readLocalLedger(ledger, command.change_id));
    const revisionEvents = revisionRemote.records.filter(record => record.event_class === 'CONTROLLER_COMMAND' && record.detail?.command_id === revision.command_id); assert.equal(revisionEvents.length, 1, 'one exact signed REVISION command must have one remote event');
    const revisionEvent = revisionEvents[0];
    assert.ok(revisionEvent, 'CAUSAL_RED: the signed REVISION must publish its actual CONTROLLER_COMMAND event before current-cycle Test input exists');
    assert.equal(revisionEvent.state_version, revisionApplied.state_version, 'the REVISION event binds the exact real State version that it authorizes');
    assert.equal(revisionEvent.subject_sha, candidateEvent.detail.candidate_sha); assert.deepEqual(revisionEvent.detail.evidence_refs, revision.evidence_refs);
    assert.equal(revisionEvent.detail.body_sha256, sha256(signed(revision).command_body_bytes)); assert.equal(revisionEvent.detail.signature_sha256, sha256(signed(revision).signature_bytes));
    const revisionAppend = observedLedgerReadbacks.filter(entry => entry.event.event_id === revisionEvent.event_id); assert.equal(revisionAppend.length, 1, 'the REVISION event has one actual append readback');
    assertExactLedgerReadback(revisionAppend[0], revisionEvent, revisionRemote.bytes);
    const afterTest = await settlePass(await core.run({ change_id: command.change_id, expected_state_version: revisionApplied.state_version, expected_state_hash: revisionApplied.state_hash }), 'juaner_test', 'current', null);
    const afterWorker = await settlePass(await core.run({ change_id: command.change_id, expected_state_version: afterTest.state_version, expected_state_hash: afterTest.state_hash }), 'juaner_worker', 'current', null, async () => { await writeFile(path.join(command.worktree.root, 'tracked.txt'), 'revised worker output\n'); });
    const workerState = await assertCanonicalState(afterWorker, 'current Worker'); assert.equal(workerState.state.phase, 'REGRESSION');
    const workerRemote = decodeRemoteLedger(await readLocalLedger(ledger, command.change_id));
    const workerResult = workerRemote.records.findLast(record => record.event_class === 'AGENT_RUN' && record.detail?.role === 'juaner_worker' && record.detail?.stage === 'RESULT'); assert.ok(workerResult);
    const workerAppend = observedLedgerReadbacks.filter(entry => entry.event.event_id === workerResult.event_id); assert.equal(workerAppend.length, 1, 'current Worker RESULT has one actual append readback');
    assertExactLedgerReadback(workerAppend[0], workerResult, workerRemote.bytes);
    const regression = await core.run({ change_id: command.change_id, expected_state_version: afterWorker.state_version, expected_state_hash: afterWorker.state_hash }); assert.equal(regression.outcome, 'ADVANCED');
    const regressionState = await assertCanonicalState(regression, 'current Regression'); assert.equal(regressionState.state.phase, 'STAGE');
    const regressionRemote = decodeRemoteLedger(await readLocalLedger(ledger, command.change_id)); const currentRegressionRecords = regressionRemote.records.filter(record => record.event_class === 'VALIDATION_RESULT' && record.detail?.validation_id === 'regression-affected-suite' && record.state_version === afterWorker.state_version);
    assert.equal(currentRegressionRecords.length, 1, 'current fixed Regression receipt retains its supporting Worker State version');
    const regressionAppend = observedLedgerReadbacks.filter(entry => entry.event.event_id === currentRegressionRecords[0].event_id); assert.equal(regressionAppend.length, 1, 'current Regression receipt has one actual append readback');
    assertExactLedgerReadback(regressionAppend[0], currentRegressionRecords[0], regressionRemote.bytes);
    const currentCandidate = await core.run({ change_id: command.change_id, expected_state_version: regression.state_version, expected_state_hash: regression.state_hash }); assert.equal(currentCandidate.outcome, 'ADVANCED');
    const currentState = await base.state.readState({ change_id: command.change_id }); assert.equal(currentState.kind, 'OK');
    const currentCandidateState = JSON.parse(currentState.value.bytes); const currentWorkerBytes = await runProcess(GIT, ['show', `${currentCandidateState.candidate.tree}:tracked.txt`], { cwd: coreWorktree, env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' } }); assert.equal(currentWorkerBytes.code, 0, currentWorkerBytes.stderr); assert.equal(currentWorkerBytes.stdout, 'revised worker output\n'); assert.notEqual(currentWorkerBytes.stdout, priorWorkerBytes.stdout);
    const current = await finishCycle(currentCandidate, { sha: currentCandidateState.candidate.sha }, 'current'); const currentReady = current.ready; assert.equal(handoffCalls.length, 2);
    const currentPreHandoff = preHandoffs.find(item => item.suffix === 'current'); assert.ok(currentPreHandoff);
    const priorCommands = currentPreHandoff.records.filter(record => record.event_class === 'CONTROLLER_COMMAND' && record.detail?.command_id === command.command_id); assert.equal(priorCommands.length, 1, 'the fixed current pre-Handoff tip retains one real prior DISPATCH command');
    const sameId = currentPreHandoff.records.filter(record => record.event_class === 'VALIDATION_RESULT' && record.detail?.validation_id === 'regression-affected-suite'); assert.equal(sameId.length, 2, 'the two public cycles reuse exactly the fixed Regression validation ID');
    source.priorReceipt = sameId[0]; const currentReceipt = sameId[1]; assert.notEqual(source.priorReceipt.event_id, currentReceipt.event_id); assert.ok(priorCommands[0].sequence < source.priorReceipt.sequence && source.priorReceipt.sequence < revisionEvent.sequence && revisionEvent.sequence < currentReceipt.sequence, 'prior DISPATCH precedes its actual receipt, then REVISION, then the current actual receipt');
    const currentHandoff = handoffCalls[1]; assert.equal(sha256(currentHandoff.bytes), currentHandoff.request.expected_sha256, 'current Handoff expected hash covers actual reread bytes');
    const currentDocument = JSON.parse(currentHandoff.bytes.toString('utf8')); assert.deepEqual(currentDocument, currentHandoff.document, 'current Handoff selection consumes its actual controlled readback bytes');
    assert.equal(currentDocument.delivery_id, currentDocument.idempotency_id); assert.equal(currentDocument.candidate_sha, currentCandidateState.candidate.sha); assert.equal(currentDocument.candidate_tree, currentCandidateState.candidate.tree); assert.equal(currentDocument.pull_request.head_sha, currentCandidateState.candidate.sha);
    for (const ref of currentDocument.ledger_refs) assertFixedTipRef(currentPreHandoff.preHandoff, currentPreHandoff.records, ref, 'current Handoff');
    const selected = currentDocument.validation_receipts.find(entry => entry.evidence_role === 'REGRESSION_AFFECTED_SUITE'); assert.ok(selected);
    assert.equal(selected.authorization_cycle_command_id, revision.command_id); assert.equal(selected.receipt.validation_id, 'regression-affected-suite'); assert.equal(selected.receipt_event_ref.event_id, currentReceipt.event_id); assert.notEqual(selected.receipt_event_ref.event_id, source.priorReceipt.event_id);
    assertFixedTipRef(currentPreHandoff.preHandoff, currentPreHandoff.records, selected.receipt_event_ref, 'selected current Regression receipt');
    const selectedRecord = currentPreHandoff.records.find(record => record.event_id === selected.receipt_event_ref.event_id); assert.ok(selectedRecord); assert.deepEqual(selected.receipt, selectedRecord.detail, 'selected current receipt is the exact fixed-tip remote VALIDATION_RESULT detail');
    assert.equal(currentDocument.ledger_refs.some(ref => ref.event_id === source.priorReceipt.event_id), false, 'current-cycle Handoff never promotes the real prior-cycle same-ID receipt');
    const currentDiffs = canonicalDiffsSince(priorDiffs.length); assert.equal(currentDiffs.length, 2, 'the current cycle makes exactly Freeze and Handoff canonical-diff observations'); assert.deepEqual(currentDiffs[0].actual_result, currentDiffs[1].actual_result);
    for (const observation of [...priorDiffs, ...currentDiffs]) assertHealthyCanonicalDiffV2(observation.actual_result);
    const finalState = await assertCanonicalState(currentReady, 'current AWAITING_CONTROLLER'); assert.equal(finalState.state.authorization_cycle.command_id, revision.command_id); assert.equal(finalState.state.candidate.sha, currentCandidateState.candidate.sha); assert.equal(finalState.state.candidate.tree, currentCandidateState.candidate.tree); assert.equal(finalState.state.delivery.pull_request.head_sha, currentCandidateState.candidate.sha); assert.equal(finalState.state.delivery.delivery_id, currentDocument.delivery_id); assert.equal(finalState.state.delivery.handoff_sha256, sha256(currentHandoff.bytes));
  }, {
    afterDispatch: async ({ base, command, dispatch, ledger, observedLedgerReadbacks }) => {
      const stateReadback = await base.state.readState({ change_id: command.change_id }); assert.equal(stateReadback.kind, 'OK');
      const state = JSON.parse(stateReadback.value.bytes); assert.equal(stateReadback.value.bytes, canonicalJson(state), 'DISPATCH supporting State bytes are canonical'); assert.equal(stateReadback.value.sha256, sha256(stateReadback.value.bytes), 'DISPATCH supporting State full hash is exact');
      assert.equal(dispatch.state_version, state.state_version); assert.equal(dispatch.state_hash, stateReadback.value.sha256, 'DISPATCH response identity equals supporting State bytes');
      assert.deepEqual(state.admission, { command_id: command.command_id, body_sha256: sha256(signed(command).command_body_bytes), idempotency_id: command.idempotency_id }); assert.deepEqual(state.authorization_cycle, { command_id: command.command_id, command_kind: 'DISPATCH', auto_repair_attempt: 0 });
      const remoteReadback = await readLocalLedger(ledger, command.change_id); const remote = decodeRemoteLedger(remoteReadback);
      const events = remote.records.filter(record => record.event_class === 'CONTROLLER_COMMAND' && record.detail?.command_id === command.command_id); assert.equal(events.length, 1, 'the public DISPATCH must have one exact remotely read-back command event before any cycle suffix');
      const event = events[0];
      assert.equal(event.change_id, command.change_id); assert.equal(event.subject_sha, state.repository.baseline_sha, 'the DISPATCH event binds the real command Worktree subject'); assert.equal(event.idempotency_id, command.idempotency_id);
      assert.equal(event.detail.command_kind, 'DISPATCH'); assert.equal(event.detail.body_sha256, sha256(signed(command).command_body_bytes)); assert.equal(event.detail.signature_sha256, sha256(signed(command).signature_bytes)); assert.equal(event.detail.command_id, command.command_id); assert.deepEqual(event.detail.admission, state.admission); assert.equal(event.detail.ready_state_sha256, stateReadback.value.sha256);
      const append = observedLedgerReadbacks.filter(entry => entry.event.event_id === event.event_id); assert.equal(append.length, 1, 'DISPATCH has one actual append readback');
      assertExactLedgerReadback(append[0], event, remote.bytes);
      assert.equal(event.state_version, dispatch.state_version, 'the DISPATCH event uses the State identity captured at its own production point');
      assert.ok(event.state_version > 0, 'CAUSAL_RED: AC-M2-005-01 rejects the production zero-version DISPATCH event; two-cycle selection remains NOT_REACHED');
    },
    pull_request,
    handoff,
  });
  } finally { await rm(controlledRoot, { recursive: true, force: true }); }
});

test('RED-M2-006 / TEST-M2-011 / 011-L02..L04: one lost branch-push response converges on the exact remote Candidate without a second push', async () => {
  await withObservedK1Prefix(async ({ command, core, candidateEvent, candidateTransition, ordinaryRoleResultRoot, gatewayEvents, faultHits }) => {
    const candidateValidation = await core.run({ change_id: command.change_id, expected_state_version: candidateTransition.state_version, expected_state_hash: candidateTransition.state_hash }); assert.equal(candidateValidation.outcome, 'ADVANCED');
    const validatorAction = await core.run({ change_id: command.change_id, expected_state_version: candidateValidation.state_version, expected_state_hash: candidateValidation.state_hash }); assert.equal(validatorAction.outcome, 'AGENT_ACTION');
    const action = validatorAction.payload.action; const { action_kind, ...binding } = action;
    const started = await core.settlement({ change_id: command.change_id, expected_state_version: validatorAction.state_version, expected_state_hash: validatorAction.state_hash, settlement: { ...binding, stage: 'STARTED', observed_child_id: '011-branch-validator' } }); assert.equal(started.outcome, 'WAITING');
    const artifact = { schema_version: '1.0', change_id: command.change_id, candidate_sha: candidateEvent.detail.candidate_sha, validator_head: candidateEvent.detail.candidate_sha, verdict: 'PASS', findings: [], risks: [], unverified: [], open_questions: [] };
    const artifactBytes = Buffer.from(canonicalJson(artifact)); const artifactPath = path.join(ordinaryRoleResultRoot, `${action.correlation_id}.011-branch.json`); await mkdir(path.dirname(artifactPath), { recursive: true }); await writeFile(artifactPath, artifactBytes);
    const validatorPass = await core.settlement({ change_id: command.change_id, expected_state_version: started.state_version, expected_state_hash: started.state_hash, settlement: { ...binding, stage: 'RESULT', observed_child_id: '011-branch-validator', status: 'PASS', artifact_path: artifactPath, artifact_sha256: sha256(artifactBytes), validator_artifact: artifact } }); assert.equal(validatorPass.outcome, 'ADVANCED');
    const pushed = await core.run({ change_id: command.change_id, expected_state_version: validatorPass.state_version, expected_state_hash: validatorPass.state_hash });
    assert.equal(pushed.outcome, 'ADVANCED'); assert.equal(pushed.payload.to_phase, 'CANDIDATE_FREEZE'); assert.deepEqual(faultHits, ['git:pushBranch:response-loss']);
    const pushStarts = gatewayEvents.filter(event => event.edge === 'START' && event.gateway === 'git' && event.method === 'pushBranch'); assert.equal(pushStarts.length, 1, 'same-identity convergence performs one physical push only');
    const lostResponse = gatewayEvents.find(event => event.edge === 'COMPLETE' && event.gateway === 'git' && event.method === 'pushBranch' && event.faulted === true); assert.equal(lostResponse.actual_result.kind, 'OK'); assert.equal(lostResponse.result.kind, 'AMBIGUOUS'); assert.equal(lostResponse.result.partial_receipt, null, 'ordinary Git ambiguity uses the frozen non-Ledger null partial receipt');
    const remoteRead = gatewayEvents.find(event => event.edge === 'COMPLETE' && event.gateway === 'git' && event.method === 'readRemoteBranch' && event.sequence > lostResponse.sequence); assert.ok(remoteRead); assert.equal(remoteRead.actual_result.value.remote_head, candidateEvent.detail.candidate_sha); assert.ok(lostResponse.sequence < remoteRead.sequence, 'the actual remote Candidate readback follows the lost push response');
    const counts = { push: pushStarts.length, read: gatewayEvents.filter(event => event.edge === 'START' && event.gateway === 'git' && event.method === 'readRemoteBranch').length };
    const replay = await core.run({ change_id: command.change_id, expected_state_version: validatorPass.state_version, expected_state_hash: validatorPass.state_hash }); assert.equal(replay.outcome, 'REJECTED'); assert.equal(replay.error_code, 'STATE_CONFLICT');
    assert.deepEqual({ push: gatewayEvents.filter(event => event.edge === 'START' && event.gateway === 'git' && event.method === 'pushBranch').length, read: gatewayEvents.filter(event => event.edge === 'START' && event.gateway === 'git' && event.method === 'readRemoteBranch').length }, counts, 'success convergence never replays the branch boundary on a later stale run');
  }, {
    transformGitResult: async ({ method, actualResult, faultHits }) => {
      if (method !== 'pushBranch' || faultHits.length || actualResult.kind !== 'OK') return actualResult;
      faultHits.push('git:pushBranch:response-loss'); return ambiguous(null);
    },
  });
});

test('RED-M2-006 / TEST-M2-011 / 011-L03..L04: one lost Ledger-append response converges on the exact remote record without a duplicate append', async () => {
  let expectedTip = null;
  await withObservedK1Prefix(async ({ command, core, regression, candidateTransition, gatewayEvents, faultHits }) => {
    assert.equal(regression.outcome, 'ADVANCED', '011 response-loss replay uses the actual observed Regression cursor, not a reconstructed State identity');
    assert.equal(regression.payload.to_phase, 'STAGE');
    assert.equal(candidateTransition.outcome, 'ADVANCED'); assert.deepEqual(faultHits, ['ledger:commitAndPush:response-loss']);
    const lostResponse = gatewayEvents.find(event => event.edge === 'COMPLETE' && event.gateway === 'ledger' && event.method === 'commitAndPush' && event.faulted === true); assert.ok(lostResponse); assert.equal(lostResponse.actual_result.kind, 'OK'); assert.equal(lostResponse.result.kind, 'AMBIGUOUS');
    assert.deepEqual(Object.keys(lostResponse.result.partial_receipt).sort(), ['commit_sha', 'event_hash', 'event_id', 'expected_tip', 'idempotency_id', 'receipt_sha256', 'stage'].sort(), 'Ledger ambiguity retains the complete seven-field partial receipt');
    const targetedCommits = gatewayEvents.filter(event => event.edge === 'START' && event.gateway === 'ledger' && event.method === 'commitAndPush' && event.request?.prepared_receipt?.event_id === lostResponse.actual_result.value.event_id); assert.equal(targetedCommits.length, 1, 'the response-loss record is physically submitted once');
    const exactReadback = gatewayEvents.find(event => event.edge === 'COMPLETE' && event.gateway === 'ledger' && event.method === 'readRemoteAppend' && event.result?.value?.event_id === lostResponse.actual_result.value.event_id && event.sequence > lostResponse.sequence); assert.ok(exactReadback); assert.equal(exactReadback.result.kind, 'OK'); assert.ok(lostResponse.sequence < exactReadback.sequence, 'the exact remote record readback completes after the lost append response');
    const counts = { commits: targetedCommits.length, reads: gatewayEvents.filter(event => event.edge === 'START' && event.gateway === 'ledger' && event.method === 'readRemoteAppend' && event.request?.event_id === lostResponse.actual_result.value.event_id).length };
    const replay = await core.run({ change_id: command.change_id, expected_state_version: regression.state_version, expected_state_hash: regression.state_hash }); assert.equal(replay.outcome, 'REJECTED'); assert.equal(replay.error_code, 'STATE_CONFLICT');
    assert.deepEqual({ commits: gatewayEvents.filter(event => event.edge === 'START' && event.gateway === 'ledger' && event.method === 'commitAndPush' && event.request?.prepared_receipt?.event_id === lostResponse.actual_result.value.event_id).length, reads: gatewayEvents.filter(event => event.edge === 'START' && event.gateway === 'ledger' && event.method === 'readRemoteAppend' && event.request?.event_id === lostResponse.actual_result.value.event_id).length }, counts, 'success convergence never replays the Ledger boundary on a later stale run');
  }, {
    armLedgerFaultAfterValidationId: 'regression-affected-suite',
    transformLedgerResult: async ({ method, event_class, actualResult, faultHits }) => {
      if (method === 'readRemote' && actualResult.kind === 'OK') expectedTip = actualResult.value.tip;
      if (method !== 'commitAndPush' || event_class !== 'VALIDATION_RESULT' || faultHits.length || actualResult.kind !== 'OK') return actualResult;
      faultHits.push('ledger:commitAndPush:response-loss');
      return ambiguous({ stage: 'REMOTE_REF_READ', expected_tip: expectedTip, commit_sha: actualResult.value.commit_sha, event_id: actualResult.value.event_id, event_hash: actualResult.value.event_hash, idempotency_id: actualResult.value.idempotency_id, receipt_sha256: actualResult.receipt_sha256 });
    },
  });
});

test('CONTROL-M2-006 / TEST-M2-011 / 011-C01: a real unpublished evidence commit remains absent at its predecessor before one legal bare-ref conflict', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'juanerai-m2-ledger-absence-'));
  try {
    const changeId = 'CHG-ledger-absence-control';
    const ledger = await createLocalBareLedger(root, changeId);
    await appendTestLedgerEvent(ledger, {
      change_id: changeId, event_class: 'CONTROLLER_COMMAND', state_version: 1, subject_sha: '1'.repeat(40), idempotency_id: '011-control-seed',
      detail: { command_kind: 'DISPATCH', command_id: '011-control-command', body_sha256: '2'.repeat(64), signature_sha256: '3'.repeat(64), verified_key_id: 'test-key', receipt_digest: '4'.repeat(64), evidence_refs: [], admission: null, ready_state_sha256: null },
    });
    const prior = await readLocalLedger(ledger, changeId);
    const priorBytes = Buffer.from(prior.value.ledger_bytes_base64, 'base64');
    const targetBytes = makeTestLedgerEventBytes({
      change_id: changeId, event_class: 'VALIDATION_RESULT', sequence: prior.value.last_sequence + 1, state_version: 2, subject_sha: '5'.repeat(40), idempotency_id: '011-control-target',
      detail: { validation_id: '011-control-validation', validation_kind: 'REGRESSION', validation_scope: 'AFFECTED_SUITE', status: 'COMPLETED', verdict: 'PASS', failure_code: null, command_definition_sha256: '6'.repeat(64), receipt_sha256: '7'.repeat(64), subject_sha: '5'.repeat(40), candidate_sha: null, validator_head: null, idempotency_id: '011-control-target' },
    });
    const target = JSON.parse(targetBytes.subarray(0, -1).toString('utf8'));
    const prepared = await ledger.prepareAppend({ remote_read_receipt_sha256: prior.receipt_sha256, expected_tip: prior.value.tip, prior_bytes: priorBytes, event_bytes: targetBytes });
    assert.equal(prepared.kind, 'OK');
    const unpublished = await createUnpublishedTestLedgerCommit({ root, change_id: changeId, expected_tip: prior.value.tip, prior_bytes: priorBytes, event_bytes: targetBytes, event_id: target.event_id });
    assert.notEqual(unpublished.commit_sha, prior.value.tip);
    assert.equal(unpublished.next_bytes_sha256, prepared.value.new_bytes_sha256);
    assert.equal(unpublished.next_byte_length, prepared.value.new_byte_length);
    const absentAtPredecessor = await readLocalLedger(ledger, changeId);
    assert.equal(absentAtPredecessor.value.tip, prior.value.tip);
    assert.equal(decodeRemoteLedger(absentAtPredecessor).records.some(record => record.event_id === target.event_id), false, 'the real target event remains absent from the authoritative predecessor bytes');
    const advanced = await appendTestLedgerEvent(ledger, {
      change_id: changeId, event_class: 'BLOCKED', state_version: 2, subject_sha: '5'.repeat(40), idempotency_id: '011-control-conflict',
      detail: { blocked_reason: 'EVIDENCE_CONFLICT', next_action: 'MANUAL_CONTROLLER_STOP', evidence_refs: [] },
    });
    assert.notEqual(advanced.readback.value.tip, prior.value.tip, 'one closed existing event physically advances the same bare authority');
    const conflictTip = await readLocalLedger(ledger, changeId);
    const conflictRecords = decodeRemoteLedger(conflictTip).records;
    assert.equal(conflictRecords.some(record => record.event_id === target.event_id), false, 'the target remains absent after the independent authoritative conflict');
    assert.equal(conflictRecords.at(-1).detail.blocked_reason, 'EVIDENCE_CONFLICT', 'the conflict control uses an existing closed reason, not a Test-invented enum');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('RED-M2-006 / TEST-M2-011 / 011-L03..L04 exhaustion: exact Ledger absence permits one same-identity append only, then conflict stops every later replay', async () => {
  const ledgerRoute = { target: null }; let targetEvent = null; let targetCommit = null; let targetPrepared = null; let targetMaterial = null; let targetUnpublished = null; let appendAttempts = 0; const physicalReads = [];
  await withObservedK1Prefix(async ({ base, command, core, afterWorker, fixtureRoot, gatewayEvents, faultHits, primaryLedger }) => {
    ledgerRoute.target = Object.freeze({
      ...primaryLedger,
      async prepareAppend(request) {
        const result = await primaryLedger.prepareAppend(request);
        if (result.kind === 'OK') {
          const event = JSON.parse(Buffer.from(request.event_bytes).subarray(0, -1).toString('utf8'));
          if (event.event_class === 'VALIDATION_RESULT' && event.detail?.validation_scope === 'AFFECTED_SUITE') {
            targetEvent = event.event_id; targetPrepared = structuredClone(result.value);
            targetMaterial = { prior_bytes: Buffer.from(request.prior_bytes), event_bytes: Buffer.from(request.event_bytes) };
          }
        }
        return result;
      },
      async commitAndPush(request) {
        if (request.prepared_receipt?.event_id !== targetEvent) return primaryLedger.commitAndPush(request);
        appendAttempts += 1; targetCommit ??= structuredClone(request); assert.deepEqual(request, targetCommit, 'both attempts retain the exact prepared receipt and idempotency identity');
        targetUnpublished ??= await createUnpublishedTestLedgerCommit({ root: fixtureRoot, change_id: command.change_id, expected_tip: targetPrepared.expected_tip, prior_bytes: targetMaterial.prior_bytes, event_bytes: targetMaterial.event_bytes, event_id: targetPrepared.event_id });
        if (appendAttempts === 2) {
          await appendTestLedgerEvent(primaryLedger, { change_id: command.change_id, event_class: 'BLOCKED', state_version: afterWorker.state_version, subject_sha: command.worktree.baseline_sha, idempotency_id: '011-concurrent-authority-change', detail: { blocked_reason: 'EVIDENCE_CONFLICT', next_action: 'MANUAL_CONTROLLER_STOP', evidence_refs: [] } });
        }
        const partialPreimage = { stage: 'EVIDENCE_COMMIT_CREATED', expected_tip: targetPrepared.expected_tip, commit_sha: targetUnpublished.commit_sha, event_id: targetPrepared.event_id, event_hash: targetPrepared.event_hash, idempotency_id: targetPrepared.idempotency_id };
        return ambiguous({ ...partialPreimage, receipt_sha256: sha256(canonicalJson(partialPreimage)) });
      },
      async readRemoteAppend(request) {
        if (request.event_id !== targetEvent) return primaryLedger.readRemoteAppend(request);
        const physical = await readLocalLedger(primaryLedger, command.change_id); const decoded = decodeRemoteLedger(physical); physicalReads.push({ request: structuredClone(request), physical, records: decoded.records });
        const targetAbsent = decoded.records.every(record => record.event_id !== targetEvent); assert.equal(targetAbsent, true, 'the target record is physically absent from the actual bare-Git Ledger');
        assert.equal(request.expected_commit, targetUnpublished.commit_sha, 'readback targets the real unpublished evidence commit, never the old predecessor');
        if (physical.value.tip === targetPrepared.expected_tip) return absent(structuredClone(request));
        return { kind: 'CONFLICT', reason: 'CAS_CONFLICT', observed_identity: { expected_commit: request.expected_commit, actual_tip: physical.value.tip } };
      },
    });
    const stopped = await core.run({ change_id: command.change_id, expected_state_version: afterWorker.state_version, expected_state_hash: afterWorker.state_hash });
    assert.equal(stopped.outcome, 'BLOCKED'); assert.equal(stopped.payload.next_action, 'MANUAL_CONTROLLER_STOP'); assert.equal(stopped.payload.blocked_event_id, null, 'conflicted authority cannot invent a durable BLOCKED event');
    const commits = gatewayEvents.filter(event => event.edge === 'START' && event.gateway === 'ledger' && event.method === 'commitAndPush' && event.request?.prepared_receipt?.event_id === targetEvent);
    const reads = gatewayEvents.filter(event => event.edge === 'START' && event.gateway === 'ledger' && event.method === 'readRemoteAppend' && event.request?.event_id === targetEvent);
    assert.equal(commits.length, 2, 'only one same-identity append continuation follows exact absence');
    assert.equal(reads.length, 2, 'each lost response has one deterministic exact-record readback');
    assert.deepEqual(commits[1].request, commits[0].request, 'the continuation reuses the exact prepared receipt and idempotency identity');
    assert.deepEqual(reads[1].request, reads[0].request, 'the exhausted readback never substitutes a record identity');
    assert.equal(physicalReads.length, 2); assert.notEqual(targetUnpublished.commit_sha, targetPrepared.expected_tip, 'the evidence commit identity is distinct from its predecessor'); assert.equal(physicalReads[0].physical.value.tip, targetPrepared.expected_tip, 'first read proves exact target absence at the unchanged predecessor'); assert.notEqual(physicalReads[1].physical.value.tip, targetPrepared.expected_tip, 'the exhausted read observes a real concurrent bare-Git tip conflict');
    const durable = JSON.parse((await base.state.readState({ change_id: command.change_id })).value.bytes); assert.equal(durable.macro_state, 'EXECUTING'); assert.equal(durable.phase, 'REGRESSION', 'conflicted Ledger authority preserves exact prior State');
    const exhaustedReadback = gatewayEvents.find(event => event.edge === 'COMPLETE' && event.gateway === 'ledger' && event.method === 'readRemoteAppend' && event.invocation === reads[1].invocation);
    assert.equal(exhaustedReadback?.result?.kind, 'CONFLICT', 'the second exact-record readback is the exhausted concurrent-authority conflict');
    const localPauseWrite = gatewayEvents.find(event => event.edge === 'START' && event.gateway === 'state' && event.method === 'writeLocalPause' && event.sequence > exhaustedReadback.sequence && (() => { try { const diagnostic = JSON.parse(event.request.next_bytes); return event.request.expected_sha256 === null && diagnostic.change_id === command.change_id && diagnostic.operation === 'run' && diagnostic.reason === 'EVIDENCE_REF_CONFLICT' && diagnostic.next_action === 'MANUAL_CONTROLLER_STOP' && diagnostic.state_version === afterWorker.state_version && diagnostic.state_hash === afterWorker.state_hash; } catch { return false; } })());
    assert.ok(localPauseWrite, 'only the exhausted Ledger conflict may select the following local-pause write');
    const localPauseWriteComplete = gatewayEvents.find(event => event.edge === 'COMPLETE' && event.gateway === 'state' && event.method === 'writeLocalPause' && event.invocation === localPauseWrite.invocation);
    assert.equal(localPauseWriteComplete?.result?.kind, 'OK', 'the exhausted Ledger conflict physically writes its exact local pause before readback');
    const localPause = gatewayEvents.find(event => event.edge === 'COMPLETE' && event.gateway === 'state' && event.method === 'readLocalPause' && event.sequence > localPauseWriteComplete.sequence);
    assert.equal(localPause?.result?.kind, 'OK', 'the exhausted Ledger conflict physically rereads its local pause before returning');
    assert.equal(localPause?.result?.value?.bytes, localPauseWrite.request.next_bytes, 'the post-conflict local-pause readback preserves the exact written diagnostic bytes');
    assert.equal(localPause?.result?.value?.sha256, sha256(localPauseWrite.request.next_bytes), 'the post-conflict local-pause readback preserves the exact written diagnostic identity');
    const counts = { commits: commits.length, reads: reads.length };
    const replay = await core.run({ change_id: command.change_id, expected_state_version: stopped.state_version, expected_state_hash: stopped.state_hash });
    assert.equal(replay.outcome, 'BLOCKED');
    assert.deepEqual({
      commits: gatewayEvents.filter(event => event.edge === 'START' && event.gateway === 'ledger' && event.method === 'commitAndPush' && event.request?.prepared_receipt?.event_id === targetEvent).length,
      reads: gatewayEvents.filter(event => event.edge === 'START' && event.gateway === 'ledger' && event.method === 'readRemoteAppend' && event.request?.event_id === targetEvent).length,
    }, counts, 'a later run performs no repeated ambiguous Ledger effect');
  }, {
    stopAfterWorker: true,
    ledgerRoute,
  });
});

test('RED-M2-006 / TEST-M2-011 / 011-L02..L04 exhaustion: two physically unpublished absent-remote branch response-loss attempts stop without a push', async () => {
  let candidateSha = null; let pushAttempts = 0; let remoteReads = 0;
  await withObservedK1Prefix(async context => {
    candidateSha = context.candidateEvent.detail.candidate_sha;
    const { validatorPass } = await settleOrdinaryValidatorForBoundary(context, 'branch-exhaustion');
    const stopped = await context.core.run({ change_id: context.command.change_id, expected_state_version: validatorPass.state_version, expected_state_hash: validatorPass.state_hash });
    assert.equal(stopped.outcome, 'BLOCKED'); assert.equal(stopped.payload.blocked_reason, 'BRANCH_PUSH_AMBIGUOUS'); assert.equal(stopped.payload.next_action, 'MANUAL_CONTROLLER_STOP');
    const pushes = context.gatewayEvents.filter(event => event.edge === 'START' && event.gateway === 'git' && event.method === 'pushBranch');
    const reads = context.gatewayEvents.filter(event => event.edge === 'COMPLETE' && event.gateway === 'git' && event.method === 'readRemoteBranch' && event.sequence > pushes[0].sequence);
    assert.equal(pushes.length, 2); assert.equal(reads.length, 2); assert.deepEqual(pushes[1].request, pushes[0].request, 'the sole continuation preserves branch, Candidate, absent predecessor, and idempotency identity');
    for (const read of reads) { assert.equal(read.actual_result.kind, 'ABSENT', 'each actual controlled-boundary read proves the remote remains absent before/after the unpublished attempts'); assert.equal(read.result.kind, 'ABSENT'); }
    const counts = { pushes: pushes.length, reads: reads.length };
    const replay = await context.core.run({ change_id: context.command.change_id, expected_state_version: stopped.state_version, expected_state_hash: stopped.state_hash }); assert.equal(replay.outcome, 'BLOCKED');
    assert.deepEqual({ pushes: context.gatewayEvents.filter(event => event.edge === 'START' && event.gateway === 'git' && event.method === 'pushBranch').length, reads: context.gatewayEvents.filter(event => event.edge === 'COMPLETE' && event.gateway === 'git' && event.method === 'readRemoteBranch' && event.sequence > pushes[0].sequence).length }, counts, 'later run performs no repeated branch effect');
  }, {
    invokeGitOperation: async ({ method, operation, request }) => {
      if (method !== 'pushBranch' || candidateSha === null) return operation(request);
      pushAttempts += 1;
      assert.deepEqual(request, { canonical_root: request.canonical_root, branch: request.branch, candidate_sha: candidateSha, expected_remote_head: null, idempotency_id: request.idempotency_id });
      return ambiguous(null);
    },
    transformGitResult: async ({ method, actualResult }) => {
      if (method !== 'readRemoteBranch' || candidateSha === null || pushAttempts <= remoteReads) return actualResult;
      remoteReads += 1; assert.equal(actualResult.kind, 'ABSENT');
      return actualResult;
    },
  });
});

test('RED-M2-006 / TEST-M2-011 / 011-L02..L04 final-boundary exhaustion: one exact Handoff absence permits one identical continuation, then ambiguity stops later replay', async () => {
  const handoffCalls = [];
  const pullRequestCalls = [];
  const pull_request = {
    async queryCurrent(request) { pullRequestCalls.push({ method: 'queryCurrent', request: structuredClone(request) }); return absent('current-pr'); },
    async createOrReuse(request) { pullRequestCalls.push({ method: 'createOrReuse', request: structuredClone(request) }); return ok({ number: 111, url: 'https://invalid.example/pr/111', base: request.base, head_branch: request.head_branch, head_sha: request.head_sha, review_ready: true }); },
    async readback(request) { pullRequestCalls.push({ method: 'readback', request: structuredClone(request) }); return ok({ number: request.number, url: 'https://invalid.example/pr/111', base: 'main', head_branch: 'work/mac-mini/m2-regression', head_sha: request.expected_head, review_ready: true }); },
  };
  const handoff = { async writeReadback(request) {
    handoffCalls.push(structuredClone(request));
    if (handoffCalls.length === 1) return absent({ expected_sha256: request.expected_sha256 });
    return ambiguous(null);
  } };
  await withObservedK1Prefix(async context => {
    const { validatorPass } = await settleOrdinaryValidatorForBoundary(context, 'handoff-exhaustion');
    const pushed = await context.core.run({ change_id: context.command.change_id, expected_state_version: validatorPass.state_version, expected_state_hash: validatorPass.state_hash }); assert.equal(pushed.outcome, 'ADVANCED');
    const frozen = await context.core.run({ change_id: context.command.change_id, expected_state_version: pushed.state_version, expected_state_hash: pushed.state_hash }); assert.equal(frozen.outcome, 'ADVANCED');
    const pr = await context.core.run({ change_id: context.command.change_id, expected_state_version: frozen.state_version, expected_state_hash: frozen.state_hash }); assert.equal(pr.outcome, 'ADVANCED');
    const stopped = await context.core.run({ change_id: context.command.change_id, expected_state_version: pr.state_version, expected_state_hash: pr.state_hash });
    assert.equal(stopped.outcome, 'BLOCKED'); assert.equal(stopped.payload.next_action, 'MANUAL_CONTROLLER_STOP'); assert.equal(handoffCalls.length, 2);
    assert.deepEqual(handoffCalls[1], handoffCalls[0], 'the final-boundary continuation preserves exact bytes, hash, and embedded delivery identity');
    const replay = await context.core.run({ change_id: context.command.change_id, expected_state_version: stopped.state_version, expected_state_hash: stopped.state_hash }); assert.equal(replay.outcome, 'BLOCKED'); assert.equal(handoffCalls.length, 2, 'later run performs no repeated Handoff write');
    assert.equal(pullRequestCalls.filter(call => call.method === 'createOrReuse').length, 1, 'final-boundary exhaustion never recreates the already-read PR');
  }, { pull_request, handoff });
});

const canonicalDiffConsumerCases009 = [
  ['009-L03 raw stdout Uint8Array is not a Buffer', value => ({ ...value, raw_stdout: new Uint8Array(value.raw_stdout) })],
  ['009-L03 raw stdout string is not a Buffer', value => ({ ...value, raw_stdout: value.raw_stdout.toString('utf8') })],
  ['009-L03 wrong raw stdout hash', value => ({ ...value, stdout_sha256: '0'.repeat(64) })],
  ['009-L03 wrong raw byte length', value => ({ ...value, byte_length: value.byte_length + 1 })],
  ['009-L03 changed raw stdout bytes', value => ({ ...value, raw_stdout: Buffer.concat([Buffer.from(value.raw_stdout), Buffer.from('\n')]) })],
  ['009-L03 wrong producer executable', value => ({ ...value, producer_receipt: { ...value.producer_receipt, executable: `${value.producer_receipt.executable}-wrong` } })],
  ['009-L03 wrong producer executable hash', value => ({ ...value, producer_receipt: { ...value.producer_receipt, executable_sha256: '0'.repeat(64) } })],
  ['009-L04 wrong producer version', value => ({ ...value, producer_receipt: { ...value.producer_receipt, version: '9.99.9' } })],
  ['009-L04 wrong producer environment', value => ({ ...value, producer_receipt: { ...value.producer_receipt, environment: { ...value.producer_receipt.environment, TZ: 'Asia/Shanghai' } } })],
  ['009-L04 wrong shell mode', value => ({ ...value, producer_receipt: { ...value.producer_receipt, shell: true } })],
  ['009-L04 wrong repository root', value => ({ ...value, producer_receipt: { ...value.producer_receipt, repository_root: `${value.producer_receipt.repository_root}-wrong` } })],
  ['009-L04 wrong worktree root', value => ({ ...value, producer_receipt: { ...value.producer_receipt, worktree_root: `${value.producer_receipt.worktree_root}-wrong` } })],
  ['009-L04 wrong common Git dir', value => ({ ...value, producer_receipt: { ...value.producer_receipt, common_git_dir: `${value.producer_receipt.common_git_dir}-wrong` } })],
  ['009-L05 wrong NUL-path stdout hash', value => ({ ...value, producer_receipt: { ...value.producer_receipt, path_stdout_sha256: '0'.repeat(64) } })],
  ['009-L05 path stdout Uint8Array is not a Buffer', value => ({ ...value, path_raw_stdout: new Uint8Array(value.path_raw_stdout) })],
  ['009-L05 path stdout object is not a Buffer', value => ({ ...value, path_raw_stdout: { bytes: Buffer.from(value.path_raw_stdout) } }), {}, envelope => envelope, 'preserve-healthy-receipt'],
  ['009-L05 arbitrary nonzero wrong NUL-path stdout hash', value => ({ ...value, producer_receipt: { ...value.producer_receipt, path_stdout_sha256: '1'.repeat(64) } })],
  ['009-L05 changed NUL-path stdout bytes', value => withCanonicalPathBytes(value, Buffer.concat([Buffer.from(value.path_raw_stdout), Buffer.from('M\0other.txt\0')]))],
  ['009-L05 wrong NUL-path byte length', value => ({ ...value, path_byte_length: value.path_byte_length + 1 })],
  ['009-L05 wrong path argv contract', value => ({ ...value, producer_receipt: { ...value.producer_receipt, path_argv: [...value.producer_receipt.path_argv, '--wrong'] } })],
  ['009-L06 unknown NUL status', value => withCanonicalPathBytes(value, Buffer.from('X\0tracked.txt\0'))],
  ['009-L06 truncated NUL framing', value => withCanonicalPathBytes(value, Buffer.from('M\0tracked.txt'))],
  ['009-L06 duplicate NUL path bytes', value => withCanonicalPathBytes(value, Buffer.from('M\0tracked.txt\0A\0tracked.txt\0'))],
  ['009-L06 unsafe NUL path', value => withCanonicalPathBytes(value, Buffer.from('M\0../escape\0'))],
  ['009-L06 invalid UTF-8 NUL path', value => withCanonicalPathBytes(value, Buffer.concat([Buffer.from('M\0bad-'), Buffer.from([0xff]), Buffer.from('\0')]))],
  ['009-L06 empty changed paths', value => ({ ...value, changed_paths: [] })],
  ['009-L06 duplicate changed path', value => ({ ...value, changed_paths: [...value.changed_paths, ...value.changed_paths] })],
  ['009-L06 unsafe changed path', value => ({ ...value, changed_paths: ['../escape'] })],
  ['009-L06 non-string changed path', value => ({ ...value, changed_paths: [7] })],
  ['009-L06 unsorted changed paths', value => ({ ...value, changed_paths: [...value.changed_paths].reverse() }), { includeSecondBaseline: true, scope: { allowed_paths: ['second.txt', 'tracked.txt'], forbidden_paths: [] }, workerWrites: { 'second.txt': 'actual second worker output\n', 'tracked.txt': 'actual worker output\n' } }],
  ['009-L06 non-roundtrip UTF-8 changed path', value => ({ ...value, changed_paths: ['\ud800'] })],
  ['009-L06 unexpected CanonicalDiffResultV2 field', value => ({ ...value, unexpected: 'closed-envelope-violation' })],
  ['009-L06 unexpected producer receipt field', value => ({ ...value, producer_receipt: { ...value.producer_receipt, unexpected: 'closed-receipt-violation' } })],
  ['009-L06 unexpected Gateway envelope field', value => value, {}, envelope => ({ ...envelope, unexpected: 'closed-gateway-violation' }), 'recompute-receipt', 'envelope-target'],
  ['009-L07 wrong baseline-to-Candidate argv identity', value => ({ ...value, producer_receipt: { ...value.producer_receipt, argv: value.producer_receipt.argv.map(arg => arg.includes('..') ? `${'0'.repeat(40)}..${'1'.repeat(40)}` : arg) } })],
  ['009-L07 wrong baseline path argv identity', value => ({ ...value, producer_receipt: { ...value.producer_receipt, path_argv: value.producer_receipt.path_argv.map(arg => arg.includes('..') ? `${'0'.repeat(40)}..${arg.split('..')[1]}` : arg) } })],
  ['009-L07 wrong Candidate path argv identity', value => ({ ...value, producer_receipt: { ...value.producer_receipt, path_argv: value.producer_receipt.path_argv.map(arg => arg.includes('..') ? `${arg.split('..')[0]}..${'1'.repeat(40)}` : arg) } })],
];

for (const [label, mutate, prefixControls = {}, mutateEnvelope = envelope => envelope, receiptStrategy = 'recompute-receipt', mutationTarget = 'value-target'] of canonicalDiffConsumerCases009) test(`RED-M2-005 / TEST-M2-009 / ${label}: healthy producer and damaged delivery stay separate before PR/Handoff`, async t => {
  const prCalls = []; const handoffCalls = []; let notReached = null;
  await withObservedK1Prefix(async ({ base, command, core, candidateEvent, candidateTransition, ordinaryRoleResultRoot, gatewayEvents, faultHits, ledger }) => {
    const candidateValidation = await core.run({ change_id: command.change_id, expected_state_version: candidateTransition.state_version, expected_state_hash: candidateTransition.state_hash }); assert.equal(candidateValidation.outcome, 'ADVANCED');
    const validatorAction = await core.run({ change_id: command.change_id, expected_state_version: candidateValidation.state_version, expected_state_hash: candidateValidation.state_hash }); assert.equal(validatorAction.outcome, 'AGENT_ACTION');
    const action = validatorAction.payload.action; const { action_kind, ...binding } = action;
    const started = await core.settlement({ change_id: command.change_id, expected_state_version: validatorAction.state_version, expected_state_hash: validatorAction.state_hash, settlement: { ...binding, stage: 'STARTED', observed_child_id: `diff-negative-${label}` } }); assert.equal(started.outcome, 'WAITING');
    const artifact = { schema_version: '1.0', change_id: command.change_id, candidate_sha: candidateEvent.detail.candidate_sha, validator_head: candidateEvent.detail.candidate_sha, verdict: 'PASS', findings: [], risks: [], unverified: [], open_questions: [] };
    const artifactBytes = Buffer.from(canonicalJson(artifact)); const artifactPath = path.join(ordinaryRoleResultRoot, `${action.correlation_id}.${label}.json`); await mkdir(path.dirname(artifactPath), { recursive: true }); await writeFile(artifactPath, artifactBytes);
    const validatorPass = await core.settlement({ change_id: command.change_id, expected_state_version: started.state_version, expected_state_hash: started.state_hash, settlement: { ...binding, stage: 'RESULT', observed_child_id: `diff-negative-${label}`, status: 'PASS', artifact_path: artifactPath, artifact_sha256: sha256(artifactBytes), validator_artifact: artifact } }); assert.equal(validatorPass.outcome, 'ADVANCED');
    const pushed = await core.run({ change_id: command.change_id, expected_state_version: validatorPass.state_version, expected_state_hash: validatorPass.state_hash }); assert.equal(pushed.outcome, 'ADVANCED');
    const stopped = await core.run({ change_id: command.change_id, expected_state_version: pushed.state_version, expected_state_hash: pushed.state_hash });
    assert.equal(notReached, null, `PREREQUISITE_FAILURE: ${label} requires canonicalDiff V2; observed ${notReached}`);
    assert.deepEqual(faultHits, [`git:canonicalDiff:${label}`]); assert.equal(stopped.outcome, 'BLOCKED');
    const fault = gatewayEvents.find(event => event.edge === 'COMPLETE' && event.gateway === 'git' && event.method === 'canonicalDiff' && event.faulted === true); assert.ok(fault);
    assert.equal(fault.actual_result.kind, 'OK'); assert.equal(fault.result.kind, 'OK');
    assert.notDeepEqual(fault.result, fault.actual_result, 'the scheduled target changes the delivered Gateway envelope');
    if (mutationTarget === 'value-target') assert.notDeepEqual(fault.result.value, fault.actual_result.value, 'a value-target case changes its declared CanonicalDiff value');
    else assert.deepEqual(fault.result.value, fault.actual_result.value, 'the closed-envelope case changes only the Gateway envelope, not its V2 value');
    assert.equal(fault.actual_result.receipt_sha256, sha256(canonicalJson(canonicalDiffReceiptPreimage(fault.actual_result.value))), 'the independently healthy source receipt is valid before every target mutation');
    if (receiptStrategy === 'recompute-receipt') assert.equal(fault.result.receipt_sha256, sha256(canonicalJson(canonicalDiffReceiptPreimage(fault.result.value))), 'a byte-representable damaged value receives a freshly recomputed explicit receipt');
    else assert.equal(fault.result.receipt_sha256, fault.actual_result.receipt_sha256, 'a non-Buffer admission negative preserves the healthy source receipt and never lets the Test coerce the illegal object');
    const stateReadback = await base.state.readState({ change_id: command.change_id }); assert.equal(stateReadback.kind, 'OK'); assert.equal(JSON.parse(stateReadback.value.bytes).macro_state, 'BLOCKED');
    const remote = await readLocalLedger(ledger, command.change_id); const records = decodeRemoteLedger(remote).records; const blocked = records.findLast(record => record.event_class === 'BLOCKED'); assert.ok(blocked); assert.equal(stopped.payload.blocked_event_id, blocked.event_id);
    assert.equal(prCalls.length, 0); assert.equal(handoffCalls.length, 0, '009-L12 no PR or Handoff consumer starts after canonical-diff evidence damage');
  }, {
    ...prefixControls,
    transformGitResult: async ({ method, actualResult, faultHits }) => {
      if (method !== 'canonicalDiff' || faultHits.length || actualResult.kind !== 'OK') return actualResult;
      notReached = expectedCanonicalDiffV2Frontier(actualResult);
      if (notReached) return actualResult;
      assertHealthyCanonicalDiffV2(actualResult);
      faultHits.push(`git:canonicalDiff:${label}`);
      const value = mutate(actualResult.value);
      const envelope = receiptStrategy === 'recompute-receipt'
        ? canonicalDiffOk(value)
        : { ...actualResult, value, receipt_sha256: actualResult.receipt_sha256 };
      return mutateEnvelope(envelope);
    },
    pull_request: { async queryCurrent(request) { prCalls.push(request); return absent('not-reached'); }, async createOrReuse(request) { prCalls.push(request); return unavailable(null); }, async readback(request) { prCalls.push(request); return unavailable(null); } },
    handoff: { async writeReadback(request) { handoffCalls.push(request); return unavailable(null); } },
  });
});

const canonicalDiffDescriptorCases009 = [
  { label: 'raw_stdout', field: 'raw_stdout' }, { label: 'path_raw_stdout', field: 'path_raw_stdout' }, { label: 'changed_paths', field: 'changed_paths' }, { label: 'byte_length', field: 'byte_length' },
  { label: 'changed_paths[0]', inject: (value, onRead) => { const changed_paths = [...value.changed_paths]; Object.defineProperty(changed_paths, '0', { enumerable: true, get() { onRead(); throw new Error('Test nested accessor must remain unread'); } }); return { ...value, changed_paths }; } },
  { label: 'producer_receipt.path_argv[0]', inject: (value, onRead) => { const path_argv = [...value.producer_receipt.path_argv]; Object.defineProperty(path_argv, '0', { enumerable: true, get() { onRead(); throw new Error('Test nested accessor must remain unread'); } }); return { ...value, producer_receipt: { ...value.producer_receipt, path_argv } }; } },
];
for (const scenario of canonicalDiffDescriptorCases009) test(`RED-M2-005 / TEST-M2-009 / 009-L03..L06: a ${scenario.label} accessor is rejected before Core consumption without invoking its hook`, async t => {
  const prCalls = []; const handoffCalls = []; let hookReads = 0; let notReached = null;
  await withObservedK1Prefix(async ({ command, core, candidateEvent, candidateTransition, ordinaryRoleResultRoot }) => {
    const candidateValidation = await core.run({ change_id: command.change_id, expected_state_version: candidateTransition.state_version, expected_state_hash: candidateTransition.state_hash }); assert.equal(candidateValidation.outcome, 'ADVANCED');
    const validatorAction = await core.run({ change_id: command.change_id, expected_state_version: candidateValidation.state_version, expected_state_hash: candidateValidation.state_hash }); assert.equal(validatorAction.outcome, 'AGENT_ACTION');
    const action = validatorAction.payload.action; const { action_kind, ...binding } = action;
    const started = await core.settlement({ change_id: command.change_id, expected_state_version: validatorAction.state_version, expected_state_hash: validatorAction.state_hash, settlement: { ...binding, stage: 'STARTED', observed_child_id: `009-accessor-${scenario.label}` } }); assert.equal(started.outcome, 'WAITING');
    const artifact = { schema_version: '1.0', change_id: command.change_id, candidate_sha: candidateEvent.detail.candidate_sha, validator_head: candidateEvent.detail.candidate_sha, verdict: 'PASS', findings: [], risks: [], unverified: [], open_questions: [] };
    const artifactBytes = Buffer.from(canonicalJson(artifact)); const artifactPath = path.join(ordinaryRoleResultRoot, `${action.correlation_id}.009-accessor-${scenario.label}.json`); await mkdir(path.dirname(artifactPath), { recursive: true }); await writeFile(artifactPath, artifactBytes);
    const validatorPass = await core.settlement({ change_id: command.change_id, expected_state_version: started.state_version, expected_state_hash: started.state_hash, settlement: { ...binding, stage: 'RESULT', observed_child_id: `009-accessor-${scenario.label}`, status: 'PASS', artifact_path: artifactPath, artifact_sha256: sha256(artifactBytes), validator_artifact: artifact } }); assert.equal(validatorPass.outcome, 'ADVANCED');
    const pushed = await core.run({ change_id: command.change_id, expected_state_version: validatorPass.state_version, expected_state_hash: validatorPass.state_hash }); assert.equal(pushed.outcome, 'ADVANCED');
    const stopped = await core.run({ change_id: command.change_id, expected_state_version: pushed.state_version, expected_state_hash: pushed.state_hash });
    assert.equal(notReached, null, `PREREQUISITE_FAILURE: accessor ${scenario.label} requires canonicalDiff V2; observed ${notReached}`);
    assert.equal(stopped.outcome, 'BLOCKED'); assert.equal(stopped.payload.blocked_reason, 'CANDIDATE_IDENTITY_CONFLICT'); assert.equal(stopped.payload.next_action, 'MANUAL_CONTROLLER_STOP');
    assert.equal(hookReads, 0, `Core must qualify ${scenario.label} through its own descriptor before any getter/toJSON/coercion observation`);
    assert.equal(prCalls.length, 0); assert.equal(handoffCalls.length, 0, 'descriptor rejection starts no PR or Handoff effect');
  }, {
    transformGitResult: async ({ method, actualResult }) => {
      if (method !== 'canonicalDiff') return actualResult;
      notReached = expectedCanonicalDiffV2Frontier(actualResult);
      if (notReached) return actualResult;
      assertHealthyCanonicalDiffV2(actualResult);
      const descriptors = Object.getOwnPropertyDescriptors(actualResult.value);
      let value;
      if (scenario.field) {
        Object.defineProperty(descriptors, scenario.field, { value: { enumerable: true, configurable: true, get() { hookReads += 1; throw new Error('Test accessor must remain unread'); } }, enumerable: true });
        value = Object.create(Object.prototype, descriptors);
      } else value = scenario.inject(actualResult.value, () => { hookReads += 1; });
      return { kind: 'OK', value, receipt_sha256: actualResult.receipt_sha256 };
    },
    pull_request: { async queryCurrent(request) { prCalls.push(request); return unavailable(null); }, async createOrReuse(request) { prCalls.push(request); return unavailable(null); }, async readback(request) { prCalls.push(request); return unavailable(null); } },
    handoff: { async writeReadback(request) { handoffCalls.push(request); return unavailable(null); } },
  });
});

test('RED-M2-005 / TEST-M2-009 / 009-L05: an otherwise healthy explicit seven-field receipt mutation stops before PR/Handoff', async t => {
  const prCalls = []; const handoffCalls = []; let delivered = false; let notReached = null;
  await withObservedK1Prefix(async ({ command, core, candidateEvent, candidateTransition, ordinaryRoleResultRoot }) => {
    const candidateValidation = await core.run({ change_id: command.change_id, expected_state_version: candidateTransition.state_version, expected_state_hash: candidateTransition.state_hash }); assert.equal(candidateValidation.outcome, 'ADVANCED');
    const validatorAction = await core.run({ change_id: command.change_id, expected_state_version: candidateValidation.state_version, expected_state_hash: candidateValidation.state_hash }); assert.equal(validatorAction.outcome, 'AGENT_ACTION');
    const action = validatorAction.payload.action; const { action_kind, ...binding } = action;
    const started = await core.settlement({ change_id: command.change_id, expected_state_version: validatorAction.state_version, expected_state_hash: validatorAction.state_hash, settlement: { ...binding, stage: 'STARTED', observed_child_id: '009-receipt-mutation' } }); assert.equal(started.outcome, 'WAITING');
    const artifact = { schema_version: '1.0', change_id: command.change_id, candidate_sha: candidateEvent.detail.candidate_sha, validator_head: candidateEvent.detail.candidate_sha, verdict: 'PASS', findings: [], risks: [], unverified: [], open_questions: [] };
    const artifactBytes = Buffer.from(canonicalJson(artifact)); const artifactPath = path.join(ordinaryRoleResultRoot, `${action.correlation_id}.009-receipt-mutation.json`); await mkdir(path.dirname(artifactPath), { recursive: true }); await writeFile(artifactPath, artifactBytes);
    const validatorPass = await core.settlement({ change_id: command.change_id, expected_state_version: started.state_version, expected_state_hash: started.state_hash, settlement: { ...binding, stage: 'RESULT', observed_child_id: '009-receipt-mutation', status: 'PASS', artifact_path: artifactPath, artifact_sha256: sha256(artifactBytes), validator_artifact: artifact } }); assert.equal(validatorPass.outcome, 'ADVANCED');
    const pushed = await core.run({ change_id: command.change_id, expected_state_version: validatorPass.state_version, expected_state_hash: validatorPass.state_hash }); assert.equal(pushed.outcome, 'ADVANCED');
    const stopped = await core.run({ change_id: command.change_id, expected_state_version: pushed.state_version, expected_state_hash: pushed.state_hash });
    assert.equal(notReached, null, `PREREQUISITE_FAILURE: receipt mutation requires canonicalDiff V2; observed ${notReached}`);
    assert.equal(delivered, true); assert.equal(stopped.outcome, 'BLOCKED'); assert.equal(stopped.payload.blocked_reason, 'CANDIDATE_IDENTITY_CONFLICT'); assert.equal(stopped.payload.next_action, 'MANUAL_CONTROLLER_STOP');
    assert.equal(prCalls.length, 0); assert.equal(handoffCalls.length, 0);
  }, {
    transformGitResult: async ({ method, actualResult }) => {
      if (method !== 'canonicalDiff' || delivered) return actualResult;
      notReached = expectedCanonicalDiffV2Frontier(actualResult);
      if (notReached) return actualResult;
      assertHealthyCanonicalDiffV2(actualResult); delivered = true;
      return { ...actualResult, receipt_sha256: 'e'.repeat(64) };
    },
    pull_request: { async queryCurrent(request) { prCalls.push(request); return unavailable(null); }, async createOrReuse(request) { prCalls.push(request); return unavailable(null); }, async readback(request) { prCalls.push(request); return unavailable(null); } },
    handoff: { async writeReadback(request) { handoffCalls.push(request); return unavailable(null); } },
  });
});

test('RED-M2-005 / TEST-M2-009 / 009-L03: a Buffer toJSON hook is not consumed while Core copies and hashes raw bytes', async t => {
  const prCalls = []; const handoffCalls = []; let toJsonCalls = 0; let notReached = null;
  await withObservedK1Prefix(async ({ command, core, candidateEvent, candidateTransition, ordinaryRoleResultRoot }) => {
    const candidateValidation = await core.run({ change_id: command.change_id, expected_state_version: candidateTransition.state_version, expected_state_hash: candidateTransition.state_hash }); assert.equal(candidateValidation.outcome, 'ADVANCED');
    const validatorAction = await core.run({ change_id: command.change_id, expected_state_version: candidateValidation.state_version, expected_state_hash: candidateValidation.state_hash }); assert.equal(validatorAction.outcome, 'AGENT_ACTION');
    const action = validatorAction.payload.action; const { action_kind, ...binding } = action;
    const started = await core.settlement({ change_id: command.change_id, expected_state_version: validatorAction.state_version, expected_state_hash: validatorAction.state_hash, settlement: { ...binding, stage: 'STARTED', observed_child_id: '009-buffer-tojson' } }); assert.equal(started.outcome, 'WAITING');
    const artifact = { schema_version: '1.0', change_id: command.change_id, candidate_sha: candidateEvent.detail.candidate_sha, validator_head: candidateEvent.detail.candidate_sha, verdict: 'PASS', findings: [], risks: [], unverified: [], open_questions: [] };
    const artifactBytes = Buffer.from(canonicalJson(artifact)); const artifactPath = path.join(ordinaryRoleResultRoot, `${action.correlation_id}.009-buffer-tojson.json`); await mkdir(path.dirname(artifactPath), { recursive: true }); await writeFile(artifactPath, artifactBytes);
    const validatorPass = await core.settlement({ change_id: command.change_id, expected_state_version: started.state_version, expected_state_hash: started.state_hash, settlement: { ...binding, stage: 'RESULT', observed_child_id: '009-buffer-tojson', status: 'PASS', artifact_path: artifactPath, artifact_sha256: sha256(artifactBytes), validator_artifact: artifact } }); assert.equal(validatorPass.outcome, 'ADVANCED');
    const pushed = await core.run({ change_id: command.change_id, expected_state_version: validatorPass.state_version, expected_state_hash: validatorPass.state_hash }); assert.equal(pushed.outcome, 'ADVANCED');
    const frozen = await core.run({ change_id: command.change_id, expected_state_version: pushed.state_version, expected_state_hash: pushed.state_hash });
    assert.equal(notReached, null, `PREREQUISITE_FAILURE: Buffer.toJSON control requires canonicalDiff V2; observed ${notReached}`);
    assert.equal(frozen.outcome, 'ADVANCED', 'a healthy Buffer with only an unused toJSON hook remains a normal Freeze input'); assert.equal(frozen.payload.to_phase, 'PR');
    assert.equal(toJsonCalls, 0, 'Core uses copied Buffer bytes and explicit base64, never Buffer.toJSON');
    assert.equal(prCalls.length, 0); assert.equal(handoffCalls.length, 0, 'this Freeze invocation performs no later PR/Handoff call');
  }, {
    transformGitResult: async ({ method, actualResult }) => {
      if (method !== 'canonicalDiff') return actualResult;
      notReached = expectedCanonicalDiffV2Frontier(actualResult);
      if (notReached) return actualResult;
      assertHealthyCanonicalDiffV2(actualResult);
      const raw_stdout = Buffer.from(actualResult.value.raw_stdout);
      Object.defineProperty(raw_stdout, 'toJSON', { enumerable: true, value() { toJsonCalls += 1; throw new Error('Test Buffer.toJSON must remain unused'); } });
      return { kind: 'OK', value: { ...actualResult.value, raw_stdout }, receipt_sha256: actualResult.receipt_sha256 };
    },
    pull_request: { async queryCurrent(request) { prCalls.push(request); return unavailable(null); }, async createOrReuse(request) { prCalls.push(request); return unavailable(null); }, async readback(request) { prCalls.push(request); return unavailable(null); } },
    handoff: { async writeReadback(request) { handoffCalls.push(request); return unavailable(null); } },
  });
});

for (const scenario of [
  { leaf: '009-L07 wrong Candidate tree readback', method: 'readCommit', field: 'tree' },
  { leaf: '009-L07 wrong local Candidate Head readback', method: 'inspectWorktree', field: 'head_sha' },
  { leaf: '009-L07 wrong remote Candidate Head readback', method: 'readRemoteBranch', field: 'remote_head' },
]) test(`RED-M2-005 / TEST-M2-009 / ${scenario.leaf}: one post-Candidate Git identity mismatch stops before freeze/PR/Handoff`, async () => {
  const prCalls = []; const handoffCalls = []; let expectedCandidate = null; let expectedTree = null; let expectedRemoteBranchRequest = null; let stopped = null;
  await withObservedK1Prefix(async context => {
    expectedCandidate = context.candidateEvent.detail.candidate_sha;
    expectedTree = context.candidateEvent.detail.tree;
    expectedRemoteBranchRequest = { canonical_root: context.command.repository.canonical_root, origin: 'origin', branch: context.command.worktree.branch };
    const { validatorPass } = await settleOrdinaryValidatorForBoundary(context, `009-${scenario.field}`);
    let cursor = validatorPass;
    for (let step = 0; step < 3; step += 1) {
      const result = await context.core.run({ change_id: context.command.change_id, expected_state_version: cursor.state_version, expected_state_hash: cursor.state_hash });
      if (result.outcome === 'BLOCKED') { stopped = result; break; }
      assert.equal(result.outcome, 'ADVANCED', 'the healthy prefix may advance only until the isolated identity boundary');
      cursor = result;
    }
    assert.ok(stopped, 'the isolated Git identity mismatch must stop before any PR/Handoff boundary');
    assert.deepEqual(context.faultHits, [`git:${scenario.method}:${scenario.field}`]);
    assert.equal(prCalls.length, 0); assert.equal(handoffCalls.length, 0);
  }, {
    armGitFaultAfterCandidate: true,
    transformGitResult: async ({ method, request, actualResult, faultHits }) => {
      if (method !== scenario.method || faultHits.length || actualResult.kind !== 'OK') return actualResult;
      if (method === 'readRemoteBranch') {
        assert.deepEqual(request, expectedRemoteBranchRequest, '009-C04 retains the complete closed remote-branch request');
      }
      assert.ok(Object.hasOwn(actualResult.value, scenario.field), `${scenario.method} health result exposes the exact ${scenario.field} field before mutation`);
      assert.equal(actualResult.value[scenario.field], scenario.field === 'tree' ? expectedTree : expectedCandidate, `the independent healthy ${scenario.field} equals the published Candidate identity before the one-field fault`);
      faultHits.push(`git:${scenario.method}:${scenario.field}`);
      return ok({ ...actualResult.value, [scenario.field]: 'f'.repeat(40) });
    },
    pull_request: { async queryCurrent(request) { prCalls.push(request); return unavailable(null); }, async createOrReuse(request) { prCalls.push(request); return unavailable(null); }, async readback(request) { prCalls.push(request); return unavailable(null); } },
    handoff: { async writeReadback(request) { handoffCalls.push(request); return unavailable(null); } },
  });
});

test('RED-M2-005 / TEST-M2-009 / 009-L07 wrong Validator Head: the otherwise-valid artifact cannot enter branch/freeze/PR/Handoff', async () => {
  const prCalls = []; const handoffCalls = [];
  await withObservedK1Prefix(async ({ command, core, candidateEvent, candidateTransition, ordinaryRoleResultRoot, gatewayEvents }) => {
    const candidateValidation = await core.run({ change_id: command.change_id, expected_state_version: candidateTransition.state_version, expected_state_hash: candidateTransition.state_hash }); assert.equal(candidateValidation.outcome, 'ADVANCED');
    const validatorAction = await core.run({ change_id: command.change_id, expected_state_version: candidateValidation.state_version, expected_state_hash: candidateValidation.state_hash }); assert.equal(validatorAction.outcome, 'AGENT_ACTION');
    const action = validatorAction.payload.action; const { action_kind, ...binding } = action;
    const started = await core.settlement({ change_id: command.change_id, expected_state_version: validatorAction.state_version, expected_state_hash: validatorAction.state_hash, settlement: { ...binding, stage: 'STARTED', observed_child_id: '009-wrong-validator-head' } }); assert.equal(started.outcome, 'WAITING');
    const artifact = { schema_version: '1.0', change_id: command.change_id, candidate_sha: candidateEvent.detail.candidate_sha, validator_head: 'f'.repeat(40), verdict: 'PASS', findings: [], risks: [], unverified: [], open_questions: [] };
    const artifactBytes = Buffer.from(canonicalJson(artifact)); const artifactPath = path.join(ordinaryRoleResultRoot, `${action.correlation_id}.009-wrong-head.json`); await writeFile(artifactPath, artifactBytes);
    const stopped = await core.settlement({ change_id: command.change_id, expected_state_version: started.state_version, expected_state_hash: started.state_hash, settlement: { ...binding, stage: 'RESULT', observed_child_id: '009-wrong-validator-head', status: 'PASS', artifact_path: artifactPath, artifact_sha256: sha256(artifactBytes), validator_artifact: artifact } });
    assert.equal(stopped.outcome, 'BLOCKED'); assert.equal(stopped.payload.blocked_reason, 'EVIDENCE_CONFLICT');
    assert.equal(gatewayEvents.some(event => event.gateway === 'git' && ['pushBranch', 'readRemoteBranch', 'canonicalDiff'].includes(event.method)), false, 'wrong Validator Head stops before branch or freeze Git');
    assert.equal(prCalls.length, 0); assert.equal(handoffCalls.length, 0);
  }, {
    pull_request: { async queryCurrent(request) { prCalls.push(request); return unavailable(null); }, async createOrReuse(request) { prCalls.push(request); return unavailable(null); }, async readback(request) { prCalls.push(request); return unavailable(null); } },
    handoff: { async writeReadback(request) { handoffCalls.push(request); return unavailable(null); } },
  });
});

for (const scenario of [
  { label: 'second raw bytes change the stored raw hash', mutate: value => { const raw_stdout = Buffer.concat([Buffer.from(value.raw_stdout), Buffer.from('\n')]); return { ...value, raw_stdout, byte_length: raw_stdout.length, stdout_sha256: sha256(raw_stdout) }; } },
  { label: 'second paths change only the delivery identity', mutate: value => ({ ...withCanonicalPathBytes(value, Buffer.from('M\0other.txt\0')), changed_paths: ['other.txt'] }) },
]) test(`RED-M2-005 / TEST-M2-009 / 009-L10: ${scenario.label} cannot cross the frozen Handoff identity`, async t => {
  const prCalls = []; const handoffCalls = []; let diffReads = 0; let notReached = null;
  const pull_request = {
    async queryCurrent(request) { prCalls.push({ method: 'queryCurrent', request }); return absent('current-pr'); },
    async createOrReuse(request) { prCalls.push({ method: 'createOrReuse', request }); return ok({ number: 209, url: 'https://invalid.example/pr/209', base: request.base, head_branch: request.head_branch, head_sha: request.head_sha, review_ready: true }); },
    async readback(request) { prCalls.push({ method: 'readback', request }); return ok({ number: request.number, url: 'https://invalid.example/pr/209', base: 'main', head_branch: 'work/mac-mini/m2-regression', head_sha: request.expected_head, review_ready: true }); },
  };
  await withObservedK1Prefix(async context => {
    const { validatorPass } = await settleOrdinaryValidatorForBoundary(context, '009-freeze-diff');
    const pushed = await context.core.run({ change_id: context.command.change_id, expected_state_version: validatorPass.state_version, expected_state_hash: validatorPass.state_hash }); assert.equal(pushed.outcome, 'ADVANCED');
    const frozen = await context.core.run({ change_id: context.command.change_id, expected_state_version: pushed.state_version, expected_state_hash: pushed.state_hash });
    assert.equal(notReached, null, `PREREQUISITE_FAILURE: ${scenario.label} requires canonicalDiff V2; observed ${notReached}`);
    assert.equal(frozen.outcome, 'ADVANCED');
    const pr = await context.core.run({ change_id: context.command.change_id, expected_state_version: frozen.state_version, expected_state_hash: frozen.state_hash }); assert.equal(pr.outcome, 'ADVANCED');
    const stopped = await context.core.run({ change_id: context.command.change_id, expected_state_version: pr.state_version, expected_state_hash: pr.state_hash });
    assert.equal(stopped.outcome, 'BLOCKED'); assert.equal(stopped.payload.blocked_reason, 'EVIDENCE_CONFLICT');
    assert.equal(diffReads, 2, 'freeze and Handoff each perform one actual canonical diff read');
    assert.deepEqual(context.faultHits, ['git:canonicalDiff:second-valid-result']);
    assert.equal(handoffCalls.length, 0, 'the valid-but-different second diff is rejected before Handoff publication');
  }, {
    armGitFaultAfterCandidate: true,
    transformGitResult: async ({ method, actualResult, faultHits }) => {
      if (method !== 'canonicalDiff' || actualResult.kind !== 'OK') return actualResult;
      notReached = expectedCanonicalDiffV2Frontier(actualResult);
      if (notReached) return actualResult;
      assertHealthyCanonicalDiffV2(actualResult);
      diffReads += 1;
      if (diffReads !== 2) return actualResult;
      faultHits.push('git:canonicalDiff:second-valid-result');
      const changed = canonicalDiffOk(scenario.mutate(actualResult.value));
      if (scenario.label === 'second paths change only the delivery identity') {
        assert.deepEqual(changed.value.raw_stdout, actualResult.value.raw_stdout, 'the valid paths-only second result retains the frozen raw bytes');
        assert.equal(changed.value.stdout_sha256, actualResult.value.stdout_sha256, 'the valid paths-only second result retains the frozen raw hash');
        assert.deepEqual(parseNameStatusZ(changed.value.path_raw_stdout).map(entry => entry.path), changed.value.changed_paths, 'the second path bytes and returned changed_paths remain internally valid before delivery identity comparison');
      }
      assertHealthyCanonicalDiffV2(changed);
      return changed;
    },
    pull_request,
    handoff: { async writeReadback(request) { handoffCalls.push(request); return unavailable(null); } },
  });
});

test('RED-M2-005 / TEST-M2-009 / 009-L11..L12: a real post-freeze Worktree write stops before Handoff publication', async () => {
  const prCalls = []; const handoffCalls = [];
  const pull_request = {
    async queryCurrent(request) { prCalls.push({ method: 'queryCurrent', request: structuredClone(request) }); return absent('current-pr'); },
    async createOrReuse(request) { prCalls.push({ method: 'createOrReuse', request: structuredClone(request) }); return ok({ number: 109, url: 'https://invalid.example/pr/109', base: request.base, head_branch: request.head_branch, head_sha: request.head_sha, review_ready: true }); },
    async readback(request) { prCalls.push({ method: 'readback', request: structuredClone(request) }); return ok({ number: request.number, url: 'https://invalid.example/pr/109', base: 'main', head_branch: 'work/mac-mini/m2-regression', head_sha: request.expected_head, review_ready: true }); },
  };
  await withObservedK1Prefix(async ({ base, command, core, candidateEvent, candidateTransition, coreWorktree, ordinaryRoleResultRoot, ledger }) => {
    const candidateValidation = await core.run({ change_id: command.change_id, expected_state_version: candidateTransition.state_version, expected_state_hash: candidateTransition.state_hash }); assert.equal(candidateValidation.outcome, 'ADVANCED');
    const validatorAction = await core.run({ change_id: command.change_id, expected_state_version: candidateValidation.state_version, expected_state_hash: candidateValidation.state_hash }); assert.equal(validatorAction.outcome, 'AGENT_ACTION');
    const action = validatorAction.payload.action; const { action_kind, ...binding } = action;
    const started = await core.settlement({ change_id: command.change_id, expected_state_version: validatorAction.state_version, expected_state_hash: validatorAction.state_hash, settlement: { ...binding, stage: 'STARTED', observed_child_id: 'post-freeze-write-validator' } }); assert.equal(started.outcome, 'WAITING');
    const artifact = { schema_version: '1.0', change_id: command.change_id, candidate_sha: candidateEvent.detail.candidate_sha, validator_head: candidateEvent.detail.candidate_sha, verdict: 'PASS', findings: [], risks: [], unverified: [], open_questions: [] };
    const artifactBytes = Buffer.from(canonicalJson(artifact)); const artifactPath = path.join(ordinaryRoleResultRoot, `${action.correlation_id}.post-freeze.json`); await mkdir(path.dirname(artifactPath), { recursive: true }); await writeFile(artifactPath, artifactBytes);
    const validatorPass = await core.settlement({ change_id: command.change_id, expected_state_version: started.state_version, expected_state_hash: started.state_hash, settlement: { ...binding, stage: 'RESULT', observed_child_id: 'post-freeze-write-validator', status: 'PASS', artifact_path: artifactPath, artifact_sha256: sha256(artifactBytes), validator_artifact: artifact } }); assert.equal(validatorPass.outcome, 'ADVANCED');
    const pushed = await core.run({ change_id: command.change_id, expected_state_version: validatorPass.state_version, expected_state_hash: validatorPass.state_hash }); assert.equal(pushed.outcome, 'ADVANCED');
    const frozen = await core.run({ change_id: command.change_id, expected_state_version: pushed.state_version, expected_state_hash: pushed.state_hash }); assert.equal(frozen.outcome, 'ADVANCED'); assert.equal(frozen.payload.to_phase, 'PR');
    const pr = await core.run({ change_id: command.change_id, expected_state_version: frozen.state_version, expected_state_hash: frozen.state_hash }); assert.equal(pr.outcome, 'ADVANCED'); assert.equal(pr.payload.to_phase, 'HANDOFF');
    await writeFile(path.join(coreWorktree, 'tracked.txt'), 'forbidden post-freeze bytes\n');
    const stopped = await core.run({ change_id: command.change_id, expected_state_version: pr.state_version, expected_state_hash: pr.state_hash }); assert.equal(stopped.outcome, 'BLOCKED');
    assert.equal(handoffCalls.length, 0, 'post-freeze mutation is detected before the controlled Handoff boundary'); assert.equal(prCalls.filter(call => call.method === 'createOrReuse').length, 1);
    const state = JSON.parse((await base.state.readState({ change_id: command.change_id })).value.bytes); assert.equal(state.macro_state, 'BLOCKED');
    const blocked = decodeRemoteLedger(await readLocalLedger(ledger, command.change_id)).records.findLast(record => record.event_class === 'BLOCKED'); assert.ok(blocked); assert.equal(stopped.payload.blocked_event_id, blocked.event_id);
  }, { pull_request, handoff: { async writeReadback(request) { handoffCalls.push(request); return unavailable(null); } } });
});

const validationPermutations = [
  ['001-L01-P1', [0, 1, 2]], ['001-L01-P2', [0, 2, 1]], ['001-L01-P3', [1, 0, 2]],
  ['001-L01-P4', [1, 2, 0]], ['001-L01-P5', [2, 0, 1]], ['001-L01-P6', [2, 1, 0]],
];

for (const [leaf, order] of validationPermutations) {
  test(`CONTROL-M2-001 / TEST-M2-001 / ${leaf}: signed input permutation admits exactly once without premature execution`, async () => {
    const harness = await createCoordinatorUnderTest();
    const command = makeDispatch();
    const values = definitions('/tmp/juanerai-m2-admission');
    command.payload.validations = order.map(index => values[index]);
    const result = await harness.coordinator.applyControllerCommand(signed(command));
    assert.equal(result.outcome, 'APPLIED', canonicalJson(result));
    assert.equal(harness.count('verifier.verify'), 1, 'one signed body is admitted once');
    for (const name of ['git.createOrReuseWorktree', 'validation.execute', 'pull_request.queryCurrent', 'pull_request.createOrReuse', 'pull_request.readback', 'handoff.writeReadback']) assert.equal(harness.count(name), 0, `${name} cannot occur during definition admission`);
  });
}

test('CONTROL-M2-001 / TEST-M2-001 / 001-C01: independent eight-field oracle rejects a forged six-field receipt hash', async () => {
  await withRepository(async fixture => {
    await writeFile(path.join(fixture.worktree, 'tracked.txt'), 'dirty candidate input\n');
    const signedDefinitions = [
      definitions(fixture.worktree)[2], definitions(fixture.worktree)[0], definitions(fixture.worktree)[1],
    ];
    const [affected, retirement, final] = expectedExecutionDefinitions(signedDefinitions);
    assert.deepEqual([affected.id, retirement.id, final.id], validationPurposes.map(purpose => purpose.id), 'the oracle’s fixed purpose order is independent of signed array position');
    for (const execution of [affected, retirement, final]) {
      const signedDefinition = signedDefinitions.find(definition => definition.id === execution.id);
      assert.deepEqual(execution, { id: signedDefinition.id, validation_kind: validationPurposes.find(purpose => purpose.id === execution.id).validation_kind, validation_scope: validationPurposes.find(purpose => purpose.id === execution.id).validation_scope, subject: signedDefinition.subject, argv: signedDefinition.argv, cwd: signedDefinition.cwd, environment: signedDefinition.environment, timeout_ms: signedDefinition.timeout_ms });
      assert.notEqual(sha256(canonicalJson(signedDefinition)), sha256(canonicalJson(execution)), 'six-field signed hash cannot stand in for the eight-field execution definition hash');
    }
    const subject = await freshWorktreeSubject(fixture.repository, fixture.worktree);
    const snapshot = await independentTrackedSnapshot(subject);
    const output = 'affected-oracle-health\n';
    const executed = { ...affected, argv: [NODE, '-e', `process.stdout.write(${JSON.stringify(output)})`], cwd: fixture.worktree };
    const actual = await production.createValidationGateway({ nodeExecutable: NODE }).execute({ definition: executed, subject });
    assert.equal(actual.kind, 'OK');
    const expected = expectedWorktreeReceipt(subject, executed, snapshot, output, '');
    assertExactWorktreeReceipt(actual.value, expected);
    assert.equal(actual.receipt_sha256, sha256(canonicalJson(expected)), 'outer receipt binds the full independently expected inner receipt');
    const executedSignedSixFields = { id: executed.id, argv: executed.argv, cwd: executed.cwd, environment: executed.environment, timeout_ms: executed.timeout_ms, subject: executed.subject };
    assert.notEqual(sha256(canonicalJson(executedSignedSixFields)), expected.command_definition_sha256, 'the forged value differs only by removal of kind/scope from this exact executed definition');
    const forged = structuredClone(actual.value);
    forged.command_definition_sha256 = sha256(canonicalJson(executedSignedSixFields));
    const { receipt_sha256: ignored, ...forgedPreimage } = forged;
    forged.receipt_sha256 = sha256(canonicalJson(forgedPreimage));
    const forgedEnvelope = { kind: 'OK', value: forged, receipt_sha256: sha256(canonicalJson(forged)) };
    assert.throws(() => assertExactWorktreeReceipt(forged, expected), assert.AssertionError, 'the Test oracle rejects a self-consistent receipt whose definition hash was substituted with the signed six-field hash');
    assert.notEqual(forgedEnvelope.receipt_sha256, actual.receipt_sha256, 'the forged self-consistent outer envelope also differs from the real receipt envelope');
  });
});

test('RED-M2-001 / TEST-M2-001 / 001-L08: public DISPATCH rejects an unknown exact signed definition before durable or external effects', async () => {
  const harness = await createCoordinatorUnderTest();
  const command = makeDispatch();
  command.payload.validations = [...definitions('/tmp/juanerai-m2-admission'), { id: 'unknown-validation', argv: [NODE, '--test'], cwd: '/tmp/juanerai-m2-admission', environment: {}, timeout_ms: 10_000, subject: 'WORKTREE' }];
  const result = await harness.coordinator.applyControllerCommand(signed(command));
  assert.equal(result.outcome, 'REJECTED');
  assertAdmissionZeroEffects(harness);
});

async function assertRejectedAdmission(validations) {
  const harness = await createCoordinatorUnderTest();
  const command = makeDispatch();
  command.payload.validations = validations;
  const result = await harness.coordinator.applyControllerCommand(signed(command));
  assert.equal(result.outcome, 'REJECTED');
  assertAdmissionZeroEffects(harness);
}

function assertAdmissionZeroEffects(harness) {
  for (const name of ['state.writePointer', 'state.writeState', 'ledger.readRemote', 'ledger.prepareAppend', 'ledger.commitAndPush', 'ledger.readRemoteAppend', 'git.createOrReuseWorktree', 'validation.execute', 'pull_request.queryCurrent', 'pull_request.createOrReuse', 'pull_request.readback', 'handoff.writeReadback']) assert.equal(harness.count(name), 0, `${name} is forbidden on admission rejection`);
}

for (const [leaf, id] of [['001-L02', 'regression-affected-suite'], ['001-L03', 'regression-test-asset-retirement'], ['001-L04', 'final-validation-candidate']]) {
  test(`RED-M2-001 / TEST-M2-001 / ${leaf}: public DISPATCH rejects a missing ${id} definition`, async () => {
    await assertRejectedAdmission(definitions('/tmp/juanerai-m2-admission').filter(definition => definition.id !== id));
  });
}

for (const [leaf, id] of [['001-L05', 'regression-affected-suite'], ['001-L06', 'regression-test-asset-retirement'], ['001-L07', 'final-validation-candidate']]) {
  test(`RED-M2-001 / TEST-M2-001 / ${leaf}: public DISPATCH rejects a duplicate ${id} definition`, async () => {
    const values = definitions('/tmp/juanerai-m2-admission');
    const duplicate = values.find(definition => definition.id === id);
    await assertRejectedAdmission([...values, { ...duplicate }]);
  });
}

for (const [leaf, id, subject] of [['001-L09', 'regression-affected-suite', 'CANDIDATE'], ['001-L10', 'regression-test-asset-retirement', 'CANDIDATE'], ['001-L11', 'final-validation-candidate', 'WORKTREE']]) {
  test(`RED-M2-001 / TEST-M2-001 / ${leaf}: public DISPATCH rejects the cross-subject ${id} definition`, async () => {
    const values = definitions('/tmp/juanerai-m2-admission').map(definition => definition.id === id ? { ...definition, subject } : definition);
    await assertRejectedAdmission(values);
  });
}

test('CONTROL-M2-001 / TEST-M2-001 / 001-L12: verified-body admission rejects an enumerable extra definition field before any durable or external effect', async () => {
  const harness = await createCoordinatorUnderTest();
  const command = makeDispatch();
  command.payload.validations = definitions('/tmp/juanerai-m2-admission');
  const request = signed(command);
  const verifiedBody = structuredClone(command);
  Object.defineProperty(verifiedBody.payload.validations[0], 'extra', { value: 'not-admitted', enumerable: true, writable: true, configurable: true });
  harness.fault('verifier.verify', {
    kind: 'VERIFIED', body: verifiedBody, verified_key_id: command.key_id,
    body_sha256: sha256(request.command_body_bytes), signature_sha256: sha256(request.signature_bytes),
  });
  const result = await harness.coordinator.applyControllerCommand(request);
  assert.equal(harness.count('verifier.verify'), 1, 'the deterministic verifier delivers the post-signature verified body exactly once');
  assert.equal(result.outcome, 'REJECTED');
  assert.equal(result.error_code, 'INPUT_INVALID');
  assertAdmissionZeroEffects(harness);
});

async function assertVerifiedDefinitionRejected(mutate, { getterReads = null } = {}) {
  const harness = await createCoordinatorUnderTest();
  const command = makeDispatch();
  command.payload.validations = definitions('/tmp/juanerai-m2-admission');
  const request = signed(command);
  const verifiedBody = structuredClone(command);
  const reads = mutate(verifiedBody.payload.validations[0]);
  harness.fault('verifier.verify', {
    kind: 'VERIFIED', body: verifiedBody, verified_key_id: command.key_id,
    body_sha256: sha256(request.command_body_bytes), signature_sha256: sha256(request.signature_bytes),
  });
  const result = await harness.coordinator.applyControllerCommand(request);
  assert.equal(harness.count('verifier.verify'), 1, 'one deterministic verified-body delivery follows normal signed bytes');
  if (getterReads !== null) assert.equal(reads(), getterReads, 'Core must reject a descriptor-shaped definition without consuming its accessor');
  assert.equal(result.outcome, 'REJECTED');
  assert.equal(result.error_code, 'INPUT_INVALID');
  assertAdmissionZeroEffects(harness);
}

const verifiedDefinitionAdmissionCases = [
  ['001-L13', 'missing own field', definition => { delete definition.subject; return null; }, {}],
  ['001-L14', 'accessor field without access', definition => { const argv = definition.argv; let reads = 0; Object.defineProperty(definition, 'argv', { enumerable: true, configurable: true, get() { reads += 1; return argv; } }); return () => reads; }, { getterReads: 0 }],
  ['001-L15', 'non-enumerable own field', definition => { Object.defineProperty(definition, 'id', { value: definition.id, enumerable: false, configurable: true }); return null; }, {}],
  ['001-L16', 'symbol own field', definition => { definition[Symbol('extra')] = 'not-admitted'; return null; }, {}],
  ['001-L17', 'empty argv', definition => { definition.argv = []; return null; }, {}],
  ['001-L18', 'relative cwd', definition => { definition.cwd = 'relative'; return null; }, {}],
  ['001-L19', 'non-empty environment', definition => { definition.environment = { PATH: '/tmp/not-admitted' }; return null; }, {}],
  ['001-L20', 'zero timeout', definition => { definition.timeout_ms = 0; return null; }, {}],
];

for (const [leaf, label, mutate, options] of verifiedDefinitionAdmissionCases) {
  test(`RED-M2-001 / TEST-M2-001 / ${leaf}: verified-body public admission rejects ${label} before durable or external effect`, async () => {
    await assertVerifiedDefinitionRejected(mutate, options);
  });
}

test('CONTROL-M2-003 / TEST-M2-003 / 003-C01: real WORKTREE regression child returns the exact healthy receipt before the stage-factory RED', async () => {
  await withRepository(async fixture => {
    await writeFile(path.join(fixture.worktree, 'tracked.txt'), 'dirty candidate input\n');
    const subject = { kind: 'WORKTREE', repository_root: fixture.repository, worktree_root: fixture.worktree, branch: 'work/mac-mini/m2-test', head_sha: fixture.candidate_sha, common_git_dir: fixture.common_git_dir, allowed_paths: ['tracked.txt'], forbidden_paths: [] };
    const definition = { id: 'regression-affected-suite', validation_kind: 'REGRESSION', validation_scope: 'AFFECTED_SUITE', subject: 'WORKTREE', argv: [NODE, '-e', 'process.stdout.write("regression-stage\\n")'], cwd: fixture.worktree, environment: {}, timeout_ms: 10_000 };
    const regression = await production.createValidationGateway({ nodeExecutable: NODE }).execute({
      definition,
      subject,
    });
    assert.equal(regression.kind, 'OK');
    const receipt = regression.value;
    assert.deepEqual(Object.keys(receipt).sort(), ['branch', 'candidate_sha', 'candidate_tree', 'command_definition_sha256', 'common_git_dir', 'execution_cwd', 'failure_code', 'head_sha', 'idempotency_id', 'receipt_sha256', 'repository_root', 'scope_sha256', 'status', 'stderr_sha256', 'stdout_sha256', 'subject_kind', 'subject_sha', 'validation_id', 'validation_kind', 'validation_scope', 'validator_head', 'verdict', 'worktree_root', 'worktree_snapshot_sha256']);
    assert.equal(receipt.status, 'COMPLETED', canonicalJson(receipt));
    assert.equal(receipt.verdict, 'PASS');
    assert.equal(receipt.failure_code, null);
    assert.equal(receipt.validation_id, definition.id);
    assert.equal(receipt.validation_kind, definition.validation_kind);
    assert.equal(receipt.validation_scope, definition.validation_scope);
    assert.equal(receipt.subject_kind, 'WORKTREE');
    assert.equal(receipt.subject_sha, fixture.candidate_sha);
    assert.equal(receipt.command_definition_sha256, sha256(canonicalJson(definition)));
    assert.equal(receipt.stdout_sha256, sha256('regression-stage\n'));
    assert.equal(receipt.stderr_sha256, sha256(''));
    const { receipt_sha256, ...receiptPreimage } = receipt;
    assert.equal(receipt_sha256, sha256(canonicalJson(receiptPreimage)), 'inner receipt hash has an independent exact oracle');
    assert.equal(regression.receipt_sha256, sha256(canonicalJson(receipt)), 'outer Gateway receipt hashes the complete inner receipt');
    for (const key of ['scope_sha256', 'worktree_snapshot_sha256']) assert.match(receipt[key], /^[0-9a-f]{64}$/);
    assert.equal(receipt.candidate_sha, null);
    assert.equal(receipt.candidate_tree, null);
    assert.equal(receipt.validator_head, null);
  });
});

test('CONTROL-M2-002 / TEST-M2-002 / 002-C01: real WORKTREE Test Asset Retirement child returns the exact healthy receipt before the two-receipt gate RED', async () => {
  await withRepository(async fixture => {
    await writeFile(path.join(fixture.worktree, 'tracked.txt'), 'dirty candidate input\n');
    const subject = worktreeSubject(fixture);
    const definition = { id: 'regression-test-asset-retirement', validation_kind: 'REGRESSION', validation_scope: 'TEST_ASSET_RETIREMENT', subject: 'WORKTREE', argv: [NODE, '-e', 'process.stdout.write("retirement-stage\\n")'], cwd: fixture.worktree, environment: {}, timeout_ms: 10_000 };
    const regression = await production.createValidationGateway({ nodeExecutable: NODE }).execute({ definition, subject });
    assert.equal(regression.kind, 'OK');
    const receipt = regression.value;
    assert.deepEqual(Object.keys(receipt).sort(), ['branch', 'candidate_sha', 'candidate_tree', 'command_definition_sha256', 'common_git_dir', 'execution_cwd', 'failure_code', 'head_sha', 'idempotency_id', 'receipt_sha256', 'repository_root', 'scope_sha256', 'status', 'stderr_sha256', 'stdout_sha256', 'subject_kind', 'subject_sha', 'validation_id', 'validation_kind', 'validation_scope', 'validator_head', 'verdict', 'worktree_root', 'worktree_snapshot_sha256']);
    assert.equal(receipt.validation_id, definition.id); assert.equal(receipt.validation_kind, 'REGRESSION'); assert.equal(receipt.validation_scope, 'TEST_ASSET_RETIREMENT');
    assert.equal(receipt.subject_kind, 'WORKTREE'); assert.equal(receipt.subject_sha, fixture.candidate_sha);
    assert.equal(receipt.status, 'COMPLETED'); assert.equal(receipt.verdict, 'PASS'); assert.equal(receipt.failure_code, null);
    assert.equal(receipt.command_definition_sha256, sha256(canonicalJson(definition)));
    assert.equal(receipt.stdout_sha256, sha256('retirement-stage\n')); assert.equal(receipt.stderr_sha256, sha256(''));
    const { receipt_sha256, ...receiptPreimage } = receipt;
    assert.equal(receipt_sha256, sha256(canonicalJson(receiptPreimage)));
    assert.equal(regression.receipt_sha256, sha256(canonicalJson(receipt)));
    assert.equal(receipt.candidate_sha, null); assert.equal(receipt.candidate_tree, null); assert.equal(receipt.validator_head, null);
  });
});

test('CONTROL-M2-002 / TEST-M2-002 / 002-C02: two real Adapter children retain the fixed receipt order with independent 24-field oracles', async () => {
  await withRepository(async fixture => {
    await writeFile(path.join(fixture.worktree, 'tracked.txt'), 'dirty candidate input\n');
    const subject = await freshWorktreeSubject(fixture.repository, fixture.worktree);
    const snapshot = await independentTrackedSnapshot(subject);
    const definitions = [
      { id: 'regression-affected-suite', validation_kind: 'REGRESSION', validation_scope: 'AFFECTED_SUITE', subject: 'WORKTREE', argv: [NODE, '-e', 'process.stdout.write("affected-double\\n")'], cwd: fixture.worktree, environment: {}, timeout_ms: 10_000 },
      { id: 'regression-test-asset-retirement', validation_kind: 'REGRESSION', validation_scope: 'TEST_ASSET_RETIREMENT', subject: 'WORKTREE', argv: [NODE, '-e', 'process.stdout.write("retirement-double\\n")'], cwd: fixture.worktree, environment: {}, timeout_ms: 10_000 },
    ];
    const expected = [
      expectedWorktreeReceipt(subject, definitions[0], snapshot, 'affected-double\n', ''),
      expectedWorktreeReceipt(subject, definitions[1], snapshot, 'retirement-double\n', ''),
    ];
    const gateway = production.createValidationGateway({ nodeExecutable: NODE });
    const actual = [];
    for (const definition of definitions) actual.push(await gateway.execute({ definition, subject }));
    assert.deepEqual(actual.map(result => result.kind), ['OK', 'OK']);
    for (const [index, result] of actual.entries()) {
      assertExactWorktreeReceipt(result.value, expected[index]);
      assert.equal(result.receipt_sha256, sha256(canonicalJson(expected[index])), 'outer Gateway receipt hashes the complete independent inner receipt');
    }
    assert.deepEqual(actual.map(result => result.value.validation_id), definitions.map(definition => definition.id), 'this Adapter-only control executes affected then Retirement exactly once each');
    assert.deepEqual(actual.map(result => result.value.worktree_snapshot_sha256), [snapshot.worktree_snapshot_sha256, snapshot.worktree_snapshot_sha256]);
  });
});

test('CONTROL-M2-003 / TEST-M2-003 / 003-C02: one real healthy WORKTREE receipt reaches the closed stage factory', async () => {
  await withRepository(async fixture => {
    const adapters = createCoordinatorAdapters({ repository_root: fixture.repository, state_root: path.join(fixture.root, '.state'), device: 'mac-mini', process_run_id: 'm2-stage-control', git_executable: GIT, pull_request_executable: '/usr/bin/false', base_environment: {} });
    await writeFile(path.join(fixture.worktree, 'tracked.txt'), 'dirty candidate input\n');
    const subject = { kind: 'WORKTREE', repository_root: fixture.repository, worktree_root: fixture.worktree, branch: 'work/mac-mini/m2-test', head_sha: fixture.candidate_sha, common_git_dir: fixture.common_git_dir, allowed_paths: ['tracked.txt'], forbidden_paths: [] };
    const definition = { id: 'regression-affected-suite', validation_kind: 'REGRESSION', validation_scope: 'AFFECTED_SUITE', subject: 'WORKTREE', argv: [NODE, '-e', 'process.stdout.write("regression-stage\\n")'], cwd: fixture.worktree, environment: {}, timeout_ms: 10_000 };
    const regression = await production.createValidationGateway({ nodeExecutable: NODE }).execute({ definition, subject });
    assert.equal(regression.kind, 'OK');
    assert.equal(regression.value.status, 'COMPLETED');
    assert.equal(regression.value.verdict, 'PASS');
    assert.equal(regression.value.failure_code, null);
    assert.equal(regression.value.command_definition_sha256, sha256(canonicalJson(definition)));
    assert.match(regression.value.worktree_snapshot_sha256, /^[0-9a-f]{64}$/);
    assert.equal(typeof production.createCandidateStageGateway, 'function', 'the production purpose-bound stage contract must be exported for the dirty-tree/content fence');
    const gateway = production.createCandidateStageGateway({ gitExecutable: GIT });
    assert.deepEqual(Object.keys(gateway).sort(), ['readStaged', 'stageExact']);
    const stageRequest = { canonical_root: fixture.repository, subject, expected_worktree_snapshot_sha256: regression.value.worktree_snapshot_sha256, paths: ['tracked.txt'] };
    const purposeBound = await gateway.stageExact(stageRequest);
    assert.deepEqual(purposeBound.staged_paths, ['tracked.txt']);
    assert.equal(purposeBound.staged_paths_sha256, sha256(canonicalJson(['tracked.txt'])), 'future stage hashes canonical sorted path bytes exactly');
    assert.match(purposeBound.index_tree, /^[0-9a-f]{40}$/);
    const staged = await gateway.readStaged({ canonical_root: fixture.repository, worktree_root: fixture.worktree });
    assert.deepEqual(staged, purposeBound, 'future stage/readback must agree on every returned identity');
    const adapterReadback = await adapters.git.readStaged({ canonical_root: fixture.repository, worktree_root: fixture.worktree });
    assert.equal(adapterReadback.kind, 'OK');
    assert.deepEqual(adapterReadback.value.staged_paths, ['tracked.txt']);
  });
});

test('CONTROL-M2-003 / TEST-M2-003 / 003-C03: the fixture connection wraps one bare stage value in the exact Foundation Gateway receipt', () => {
  const value = Object.freeze({ staged_paths: ['tracked.txt'], staged_paths_sha256: 'a8df01efc5c16d14605d47080e1353474d67470762c9566d379c7c239444fb9b', index_tree: 'a'.repeat(40) });
  const canonicalValue = '{"index_tree":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","staged_paths":["tracked.txt"],"staged_paths_sha256":"a8df01efc5c16d14605d47080e1353474d67470762c9566d379c7c239444fb9b"}';
  assert.equal(canonicalJson(value), canonicalValue, 'the known literal fixes the exact canonical Core receipt preimage');
  const result = wrapCandidateStageValueForCore(value);
  assert.deepEqual(Object.keys(result).sort(), ['kind', 'receipt_sha256', 'value']);
  assert.equal(result.kind, 'OK');
  assert.strictEqual(result.value, value, 'the connection preserves the real bare factory value without projection or unwrapping');
  assert.equal(result.receipt_sha256, 'd1b9620a9cfdee6b0c72d00a52c5b8dd5c2e9476bf394661ebcb4710d403427d', 'the Core receipt matches the independently fixed digest of all three bare fields');
});

test('CONTROL-M2-003 / TEST-M2-003 / 003-C06: purpose-bound snapshot/list rejection starts from independent fresh worktrees', async t => {
  const cases = [
    ['second Regression snapshot mismatch', async (fixture, regression, subject) => ({ canonical_root: fixture.repository, subject, expected_worktree_snapshot_sha256: `${regression.value.worktree_snapshot_sha256.startsWith('0') ? '1' : '0'}${regression.value.worktree_snapshot_sha256.slice(1)}`, paths: ['tracked.txt'] })],
    ['empty actual stage list', async (fixture, regression, subject) => ({ canonical_root: fixture.repository, subject, expected_worktree_snapshot_sha256: regression.value.worktree_snapshot_sha256, paths: [] })],
  ];
  for (const [label, makeRequest] of cases) await t.test(label, async () => {
    await withRepository(async fixture => {
      await writeFile(path.join(fixture.worktree, 'tracked.txt'), 'dirty candidate input\n');
      const subject = await freshWorktreeSubject(fixture.repository, fixture.worktree);
      const definition = { id: 'regression-affected-suite', validation_kind: 'REGRESSION', validation_scope: 'AFFECTED_SUITE', subject: 'WORKTREE', argv: [NODE, '-e', 'process.stdout.write("stage-negative\\n")'], cwd: fixture.worktree, environment: {}, timeout_ms: 10_000 };
      const regression = await production.createValidationGateway({ nodeExecutable: NODE }).execute({ definition, subject });
      assert.equal(regression.kind, 'OK');
      assert.equal(typeof production.createCandidateStageGateway, 'function', 'the independently fresh stage-negative fixture first requires the production purpose-bound factory');
      const gateway = production.createCandidateStageGateway({ gitExecutable: GIT });
      const request = await makeRequest(fixture, regression, subject);
      await assert.rejects(gateway.stageExact(request), `${label} must fail at the public purpose-bound factory rather than create a dirty-index side effect`);
      const cached = await runProcess(GIT, ['diff', '--cached', '--name-status', '-z'], { cwd: fixture.worktree, env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' } });
      assert.equal(cached.stdout, '', 'a rejected purpose-bound stage must not leave a staged index');
    });
  });
});

test('CONTROL-M2-003 / TEST-M2-003 / 003-C09: independent real cached raw command emits full object IDs that equal the exact index blob', async () => {
  await withRepository(async fixture => {
    await writeFile(path.join(fixture.worktree, 'tracked.txt'), 'cached raw health input\n');
    const added = await runProcess(GIT, ['add', '--', 'tracked.txt'], { cwd: fixture.worktree, env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' } });
    assert.equal(added.code, 0, added.stderr); assert.equal(added.signal, null);
    const raw = await runProcess(GIT, ['diff', '--cached', '--raw', '-z', '--full-index', '--no-abbrev', '--no-renames', fixture.candidate_sha, '--'], { cwd: fixture.worktree, env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' } });
    assert.equal(raw.code, 0, raw.stderr); assert.equal(raw.signal, null);
    const rawMatch = /^:([0-7]{6}) ([0-7]{6}) ([0-9a-f]{40}) ([0-9a-f]{40}) M\0tracked\.txt\0$/u.exec(raw.stdout);
    assert.ok(rawMatch, 'the exact cached raw argv produces one full-40 modified record');
    const listed = await runProcess(GIT, ['--literal-pathspecs', 'ls-files', '--stage', '-z', '--', 'tracked.txt'], { cwd: fixture.worktree, env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' } });
    assert.equal(listed.code, 0, listed.stderr); assert.equal(listed.signal, null);
    const listedMatch = /^(\d{6}) ([0-9a-f]{40}) 0\ttracked\.txt\0$/u.exec(listed.stdout);
    assert.ok(listedMatch, 'the independently read staged entry has one full-40 blob identity');
    assert.equal(rawMatch[4], listedMatch[2], 'the cached raw new object is exactly the independently read index blob');
  });
});

test('RED-M2-003 / TEST-M2-003 / 003-L01..L07: every literal dirty path reaches the real NUL-safe purpose-bound stage and exact cached bytes/tree', async t => {
  const cases = [
    ['003-L01', 'ordinary modified file', 'tracked.txt', ' M', 'modified\n', async fixture => writeFile(path.join(fixture.worktree, 'tracked.txt'), 'modified\n')],
    ['003-L02', 'ordinary untracked file', 'added.mjs', '??', 'added\n', async fixture => writeFile(path.join(fixture.worktree, 'added.mjs'), 'added\n')],
    ['003-L03', 'deleted tracked file', 'tracked.txt', ' D', null, async fixture => rm(path.join(fixture.worktree, 'tracked.txt'))],
    ['003-L04', 'executable/type change', 'tracked.txt', ' M', 'candidate\n', async fixture => chmod(path.join(fixture.worktree, 'tracked.txt'), 0o755)],
    ['003-L05', 'space path', 'space name.mjs', '??', 'space\n', async fixture => writeFile(path.join(fixture.worktree, 'space name.mjs'), 'space\n')],
    ['003-L06', 'Unicode path', 'unicodé-测试.mjs', '??', 'unicode\n', async fixture => writeFile(path.join(fixture.worktree, 'unicodé-测试.mjs'), 'unicode\n')],
    ['003-L07', 'literal pathspec-looking path', ':literal/:literal*?[].mjs', '??', 'literal\n', async fixture => { await mkdir(path.join(fixture.worktree, ':literal')); await writeFile(path.join(fixture.worktree, ':literal', ':literal*?[].mjs'), 'literal\n'); }],
  ];
  for (const [leaf, label, dirtyPath, xy, expectedContent, arrange] of cases) await t.test(`${leaf} ${label}`, async () => {
    await withRepository(async fixture => {
      await arrange(fixture);
      const direct = await runProcess(GIT, ['status', '--porcelain=v1', '-z', '--untracked-files=all', '--no-renames'], { cwd: fixture.worktree, env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' } });
      assert.equal(direct.code, 0, direct.stderr);
      assert.equal(direct.stdout, `${xy} ${dirtyPath}\0`, 'the Test-owned Git fixture produces the exact intended NUL-delimited porcelain bytes');
      const subject = await freshWorktreeSubject(fixture.repository, fixture.worktree, leaf === '003-L07' ? [':literal/**'] : [dirtyPath]);
      const definition = { id: 'regression-affected-suite', validation_kind: 'REGRESSION', validation_scope: 'AFFECTED_SUITE', subject: 'WORKTREE', argv: [NODE, '-e', 'process.stdout.write("literal-stage\\n")'], cwd: fixture.worktree, environment: {}, timeout_ms: 10_000 };
      await withObservedRealSpawns(async observations => {
        const adapters = createCoordinatorAdapters({ repository_root: fixture.repository, state_root: path.join(fixture.root, `.candidate-${leaf}`), device: 'mac-mini', process_run_id: `candidate-${leaf}`, git_executable: GIT, pull_request_executable: '/usr/bin/false', base_environment: {} });
        const inspectStart = observations.length;
        const inspected = await adapters.git.inspectWorktree({ canonical_root: fixture.repository, worktree_root: fixture.worktree, expected_branch: subject.branch, expected_head: subject.head_sha });
        assert.deepEqual(Object.keys(inspected).sort(), ['kind', 'receipt_sha256', 'value'], 'inspectWorktree retains the closed Foundation Gateway OK envelope');
        assert.equal(inspected.kind, 'OK'); assert.equal(inspected.receipt_sha256, sha256(canonicalJson(inspected.value)));
        assert.deepEqual(Object.keys(inspected.value).sort(), ['branch', 'clean', 'common_git_dir', 'head_sha', 'status_entries', 'worktree_root'], 'the retained inner result adds no field');
        assert.equal(inspected.value.clean, false); assert.equal(inspected.value.worktree_root, fixture.worktree); assert.equal(inspected.value.branch, subject.branch); assert.equal(inspected.value.head_sha, subject.head_sha); assert.equal(inspected.value.common_git_dir, subject.common_git_dir);
        const inspectionStatus = xy === ' M' ? 'MODIFIED' : xy === ' D' ? 'DELETED' : xy === ' T' ? 'TYPE_CHANGED' : 'UNTRACKED';
        assert.deepEqual(inspected.value.status_entries, [{ path: dirtyPath, status: inspectionStatus, mode: null, object_sha: null }], 'fresh inspectWorktree emits one closed normalized record');
        const exactEnvironment = { LC_ALL: 'C', LANG: 'C', TZ: 'UTC', GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: '/dev/null', GIT_ATTR_NOSYSTEM: '1', GIT_PAGER: 'cat', PAGER: 'cat', GIT_TERMINAL_PROMPT: '0', GIT_NO_REPLACE_OBJECTS: '1' };
        const inspectArgv = [
          ['branch', '--show-current'], ['rev-parse', 'HEAD'], ['rev-parse', '--git-common-dir'],
          ['status', '--porcelain=v1', '-z', '--untracked-files=all', '--no-renames'],
          ['status', '--porcelain=v1', '-z', '--untracked-files=all', '--ignored=matching', '--no-renames'],
          ['diff', '--cached', '--quiet', subject.head_sha, '--'],
        ];
        const inspectObservations = observations.slice(inspectStart);
        assert.deepEqual(inspectObservations.map(observation => observation.argv), inspectArgv, 'the public inspectWorktree alone owns the ordered section 5.1 commands');
        for (const observation of inspectObservations) { assert.equal(observation.executable, GIT); assert.equal(observation.cwd, fixture.worktree); assert.equal(observation.shell, false); assert.deepEqual(observation.environment, exactEnvironment); }
        const validation = await production.createValidationGateway({ nodeExecutable: NODE }).execute({ definition, subject });
        assertClosedExecutionGatewayResult(validation, ['COMPLETED', 'PASS', null]);
        assert.equal(typeof production.createCandidateStageGateway, 'function', 'the approved closed production stage factory is required');
        const gateway = production.createCandidateStageGateway({ gitExecutable: GIT });
        assert.equal(Object.isFrozen(gateway), true); assert.deepEqual(Object.keys(gateway).sort(), ['readStaged', 'stageExact']);
        const request = { canonical_root: fixture.repository, subject, expected_worktree_snapshot_sha256: validation.value.worktree_snapshot_sha256, paths: [dirtyPath] };
        const staged = await gateway.stageExact(request);
        assert.deepEqual(Object.keys(staged).sort(), ['index_tree', 'staged_paths', 'staged_paths_sha256']);
        assert.deepEqual(staged.staged_paths, [dirtyPath]); assert.equal(staged.staged_paths_sha256, sha256(canonicalJson([dirtyPath])));
        const exactRawArgv = ['diff', '--cached', '--raw', '-z', '--full-index', '--no-abbrev', '--no-renames', subject.head_sha, '--'];
        const stageRawObservations = observations.filter(observation => observation.executable === GIT && observation.cwd === fixture.worktree && canonicalJson(observation.argv) === canonicalJson(exactRawArgv));
        assert.deepEqual(stageRawObservations.map(observation => observation.argv), [exactRawArgv], 'stageExact observes exactly one approved full-OID cached raw command before readStaged begins');
        const readback = await gateway.readStaged({ canonical_root: fixture.repository, worktree_root: fixture.worktree });
        assert.deepEqual(Object.keys(readback).sort(), ['index_tree', 'staged_paths', 'staged_paths_sha256']);
        assert.deepEqual(readback.staged_paths, [dirtyPath]); assert.equal(readback.staged_paths_sha256, sha256(canonicalJson([dirtyPath]))); assert.equal(readback.index_tree, staged.index_tree);
        const stageAndReadRawObservations = observations.filter(observation => observation.executable === GIT && observation.cwd === fixture.worktree && canonicalJson(observation.argv) === canonicalJson(exactRawArgv));
        assert.deepEqual(stageAndReadRawObservations.map(observation => observation.argv), [exactRawArgv, exactRawArgv], 'stageExact and readStaged each observe the approved full-OID cached raw command exactly once');
        const add = observations.find(observation => observation.executable === GIT && canonicalJson(observation.argv) === canonicalJson(['--literal-pathspecs', 'add', '--pathspec-from-file=-', '--pathspec-file-nul']));
        assert.ok(add, 'the real delegated Git add uses only literal NUL-safe path transport');
        assert.equal(add.shell, false); assert.deepEqual(Buffer.concat(add.stdin_chunks), Buffer.concat([Buffer.from(dirtyPath), Buffer.from([0])]));
        assert.deepEqual(add.environment, exactEnvironment); assert.equal(add.cwd, fixture.worktree);
        const addIndex = observations.indexOf(add);
        const orderedArgv = [
          ['--literal-pathspecs', 'add', '--pathspec-from-file=-', '--pathspec-file-nul'],
          ['diff', '--cached', '--name-status', '-z', '--no-renames', subject.head_sha, '--'],
          ['diff', '--cached', '--raw', '-z', '--full-index', '--no-abbrev', '--no-renames', subject.head_sha, '--'],
          ['write-tree'], ['diff', '--quiet', '--no-ext-diff', '--'],
          ['status', '--porcelain=v1', '-z', '--untracked-files=all', '--no-renames'],
          ['status', '--porcelain=v1', '-z', '--untracked-files=all', '--ignored=matching', '--no-renames'],
        ];
        let cursor = addIndex - 1;
        for (const argv of orderedArgv) {
          cursor = observations.findIndex((observation, index) => index > cursor && observation.executable === GIT && observation.cwd === fixture.worktree && canonicalJson(observation.argv) === canonicalJson(argv));
          assert.ok(cursor >= 0, `the real stage command sequence contains ${canonicalJson(argv)}`);
          assert.equal(observations[cursor].shell, false); assert.deepEqual(observations[cursor].environment, exactEnvironment);
        }
        const cached = await runProcess(GIT, ['diff', '--cached', '--name-status', '-z', '--no-renames', subject.head_sha, '--'], { cwd: fixture.worktree, env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' } });
        const cachedStatus = xy.trim() === '??' ? 'A' : xy.trim();
        assert.deepEqual(parseNameStatusZ(cached.stdout), [{ status: cachedStatus, path: dirtyPath }]);
        const raw = await runProcess(GIT, ['diff', '--cached', '--raw', '-z', '--full-index', '--no-abbrev', '--no-renames', subject.head_sha, '--'], { cwd: fixture.worktree, env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' } });
        const rawMatch = /^:([0-7]{6}) ([0-7]{6}) ([0-9a-f]{40}) ([0-9a-f]{40}) ([AMDT])\0([^\0]+)\0$/u.exec(raw.stdout);
        assert.ok(rawMatch, 'the cached raw stream is one complete mode/object/status/path record');
        assert.equal(rawMatch[5], cachedStatus); assert.equal(rawMatch[6], dirtyPath);
        const expectedOldMode = cachedStatus === 'A' ? '000000' : '100644';
        const expectedNewMode = cachedStatus === 'D' ? '000000' : leaf === '003-L04' ? '100755' : '100644';
        assert.equal(rawMatch[1], expectedOldMode); assert.equal(rawMatch[2], expectedNewMode);
        if (cachedStatus === 'A') assert.equal(rawMatch[3], '0'.repeat(40));
        if (cachedStatus === 'D') assert.equal(rawMatch[4], '0'.repeat(40));
        const tree = await runProcess(GIT, ['write-tree'], { cwd: fixture.worktree, env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' } }); assert.equal(tree.stdout.trim(), staged.index_tree);
        if (xy !== ' D') {
          const listed = await runProcess(GIT, ['--literal-pathspecs', 'ls-files', '--stage', '-z', '--', dirtyPath], { cwd: fixture.worktree, env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' } });
          const match = /^(\d{6}) ([0-9a-f]{40}) 0\t/.exec(listed.stdout); assert.ok(match, 'the exact literal path has one cached blob');
          assert.equal(match[1], leaf === '003-L04' ? '100755' : '100644', 'the cached mode is independently exact');
          assert.equal(rawMatch[4], match[2], 'the raw cached object is the same exact index object');
          const blob = await runProcess(GIT, ['cat-file', 'blob', match[2]], { cwd: fixture.worktree, env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' } });
          assert.deepEqual(Buffer.from(blob.stdout), Buffer.from(expectedContent), 'the cached blob contains the independently fixed expected bytes');
        }
        const noRemainder = await runProcess(GIT, ['diff', '--quiet', '--no-ext-diff', '--'], { cwd: fixture.worktree, env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' } });
        assert.equal(noRemainder.code, 0); assert.equal(noRemainder.stdout, ''); assert.equal(noRemainder.stderr, '');
        const stagedPorcelain = `${cachedStatus}  ${dirtyPath}\0`;
        const statusAfterStage = await runProcess(GIT, ['status', '--porcelain=v1', '-z', '--untracked-files=all', '--no-renames'], { cwd: fixture.worktree, env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' } });
        const ignoredAfterStage = await runProcess(GIT, ['status', '--porcelain=v1', '-z', '--untracked-files=all', '--ignored=matching', '--no-renames'], { cwd: fixture.worktree, env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' } });
        assert.equal(statusAfterStage.stdout, stagedPorcelain, 'after stage only the exact index-side record remains');
        assert.equal(ignoredAfterStage.stdout, stagedPorcelain, 'ignored-aware status adds no remainder authority');
        const idempotency_id = `candidate-${sha256(canonicalJson({ schema_version: '1.0', change_id: 'CHG-dual-device-transition-foundation', authorization_cycle_command_id: `command-${leaf.toLowerCase()}`, expected_parent: subject.head_sha, expected_tree: staged.index_tree }))}`;
        const message_bytes = new TextEncoder().encode(`JuanerAI Candidate\n\nJuanerAI-Idempotency-ID: ${idempotency_id}\n`);
        const committed = await adapters.git.commitCandidate({ canonical_root: fixture.repository, worktree_root: fixture.worktree, expected_parent: subject.head_sha, expected_tree: staged.index_tree, message_bytes, idempotency_id });
        assert.deepEqual(Object.keys(committed).sort(), ['kind', 'receipt_sha256', 'value']); assert.equal(committed.kind, 'OK'); assert.equal(committed.receipt_sha256, sha256(canonicalJson(committed.value)));
        assert.deepEqual(Object.keys(committed.value).sort(), ['branch', 'parent', 'sha', 'tree']); assert.equal(committed.value.parent, subject.head_sha); assert.equal(committed.value.tree, staged.index_tree); assert.equal(committed.value.branch, subject.branch);
        const commitTree = observations.find(observation => observation.cwd === fixture.worktree && observation.argv[0] === 'commit-tree' && observation.argv[1] === staged.index_tree);
        const refCas = observations.find(observation => observation.cwd === fixture.worktree && canonicalJson(observation.argv) === canonicalJson(['update-ref', `refs/heads/${subject.branch}`, committed.value.sha, subject.head_sha]));
        assert.ok(commitTree && refCas && observations.indexOf(commitTree) < observations.indexOf(refCas), 'explicit commit-tree precedes old-parent update-ref CAS');
        assert.deepEqual(Buffer.concat(commitTree.stdin_chunks), Buffer.from(message_bytes));
        assert.equal(observations.some(observation => observation.cwd === fixture.worktree && ['commit', 'merge', 'checkout', 'reset'].includes(observation.argv[0])), false, 'Candidate production uses no ordinary commit/amend/merge/reset/cleanup');
        const finalStatus = await runProcess(GIT, ['status', '--porcelain=v1', '-z', '--untracked-files=all', '--ignored=matching', '--no-renames'], { cwd: fixture.worktree, env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' } }); assert.equal(finalStatus.stdout, '');
        const committedEntry = await runProcess(GIT, ['--literal-pathspecs', 'ls-tree', '-r', '-z', committed.value.sha, '--', dirtyPath], { cwd: fixture.worktree, env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' } });
        if (xy === ' D') assert.equal(committedEntry.stdout, '', 'the explicit Candidate tree preserves the real deletion');
        else {
          const match = /^(\d{6}) blob ([0-9a-f]{40})\t/.exec(committedEntry.stdout); assert.ok(match);
          const committedBlob = await runProcess(GIT, ['cat-file', 'blob', match[2]], { cwd: fixture.worktree, env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' } });
          assert.deepEqual(Buffer.from(committedBlob.stdout), await readFile(path.join(fixture.worktree, dirtyPath)), 'the explicit Candidate tree contains the exact independently read staged bytes');
        }
      });
    });
  });
});

test('RED-M2-003 / TEST-M2-003 / 003-L09: public inspectWorktree rejects a dirty index without changing its observed index, status, or Head', async () => {
  await withRepository(async fixture => {
    const adapters = createCoordinatorAdapters({ repository_root: fixture.repository, state_root: path.join(fixture.root, '.record-state'), device: 'mac-mini', process_run_id: 'm2-inspect-record-red', git_executable: GIT, pull_request_executable: '/usr/bin/false', base_environment: {} });
    await writeFile(path.join(fixture.worktree, 'tracked.txt'), 'staged only\n');
    const staged = await runProcess(GIT, ['add', '--', 'tracked.txt'], { cwd: fixture.worktree, env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' } });
    assert.equal(staged.code, 0, staged.stderr);
    const direct = await runProcess(GIT, ['status', '--porcelain=v1', '-z'], { cwd: fixture.worktree, env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' } });
    assert.equal(direct.stdout, 'M  tracked.txt\0');
    const headBefore = await runProcess(GIT, ['rev-parse', 'HEAD'], { cwd: fixture.worktree, env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' } });
    assert.equal(headBefore.code, 0, headBefore.stderr);
    await assert.rejects(adapters.git.inspectWorktree({ canonical_root: fixture.repository, worktree_root: fixture.worktree, expected_branch: 'work/mac-mini/m2-test', expected_head: fixture.candidate_sha }), 'M2 rejects every staged worktree before Candidate preparation');
    const statusAfter = await runProcess(GIT, ['status', '--porcelain=v1', '-z'], { cwd: fixture.worktree, env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' } });
    const headAfter = await runProcess(GIT, ['rev-parse', 'HEAD'], { cwd: fixture.worktree, env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' } });
    assert.equal(statusAfter.stdout, direct.stdout, 'dirty-index rejection cannot stage, reset, clean, or otherwise modify the Test-owned index');
    assert.equal(headAfter.stdout, headBefore.stdout, 'dirty-index rejection cannot move Head');
  });
});

test('CONTROL-M2-003 / TEST-M2-003 / 003-C08: public inspectWorktree rejects an actual unmerged path without changing its status or Head', async () => {
  await withRepository(async fixture => {
    const adapters = createCoordinatorAdapters({ repository_root: fixture.repository, state_root: path.join(fixture.root, '.unmerged-state'), device: 'mac-mini', process_run_id: 'm2-inspect-unmerged-red', git_executable: GIT, pull_request_executable: '/usr/bin/false', base_environment: {} });
    const invoke = async args => { const result = await runProcess(GIT, args, { cwd: fixture.worktree, env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' } }); assert.equal(result.code, 0, result.stderr); };
    await invoke(['checkout', '-b', 'm2-conflict-side']);
    await writeFile(path.join(fixture.worktree, 'tracked.txt'), 'side\n');
    await invoke(['add', '--', 'tracked.txt']); await invoke(['commit', '-m', 'side conflict']);
    await invoke(['checkout', 'work/mac-mini/m2-test']);
    await writeFile(path.join(fixture.worktree, 'tracked.txt'), 'main\n');
    await invoke(['add', '--', 'tracked.txt']); await invoke(['commit', '-m', 'main conflict']);
    const merge = await runProcess(GIT, ['merge', 'm2-conflict-side'], { cwd: fixture.worktree, env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' } });
    assert.equal(merge.code, 1, merge.stderr);
    const direct = await runProcess(GIT, ['status', '--porcelain=v1', '-z'], { cwd: fixture.worktree, env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' } });
    assert.equal(direct.stdout, 'UU tracked.txt\0');
    const head = await runProcess(GIT, ['rev-parse', 'HEAD'], { cwd: fixture.worktree, env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' } });
    assert.equal(head.code, 0, head.stderr);
    await assert.rejects(adapters.git.inspectWorktree({ canonical_root: fixture.repository, worktree_root: fixture.worktree, expected_branch: 'work/mac-mini/m2-test', expected_head: head.stdout.trim() }), 'M2 rejects every unmerged worktree before Candidate preparation');
    const statusAfter = await runProcess(GIT, ['status', '--porcelain=v1', '-z'], { cwd: fixture.worktree, env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' } });
    const headAfter = await runProcess(GIT, ['rev-parse', 'HEAD'], { cwd: fixture.worktree, env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' } });
    assert.equal(statusAfter.stdout, direct.stdout, 'unmerged-input rejection cannot add, reset, clean, or otherwise modify the conflict index');
    assert.equal(headAfter.stdout, head.stdout, 'unmerged-input rejection cannot move Head');
  });
});

test('CONTROL-M2-003 / TEST-M2-003 / 003-C07: public inspectWorktree rejects an ignored-only worktree', async () => {
  await withRepository(async fixture => {
    const adapters = createCoordinatorAdapters({ repository_root: fixture.repository, state_root: path.join(fixture.root, '.ignored-state'), device: 'mac-mini', process_run_id: 'm2-inspect-ignored-red', git_executable: GIT, pull_request_executable: '/usr/bin/false', base_environment: {} });
    await mkdir(path.join(fixture.common_git_dir, 'info'), { recursive: true });
    await writeFile(path.join(fixture.common_git_dir, 'info', 'exclude'), 'ignored-only.txt\n');
    await writeFile(path.join(fixture.worktree, 'ignored-only.txt'), 'ignored\n');
    const ignored = await runProcess(GIT, ['status', '--porcelain=v1', '-z', '--untracked-files=all', '--ignored=matching', '--no-renames'], { cwd: fixture.worktree, env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' } });
    assert.equal(ignored.code, 0, ignored.stderr);
    assert.equal(ignored.stdout, '!! ignored-only.txt\0', 'the Test-owned fixture has exactly one ignored NUL record');
    const headBefore = await runProcess(GIT, ['rev-parse', 'HEAD'], { cwd: fixture.worktree, env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' } });
    await assert.rejects(adapters.git.inspectWorktree({ canonical_root: fixture.repository, worktree_root: fixture.worktree, expected_branch: 'work/mac-mini/m2-test', expected_head: fixture.candidate_sha }), /COORDINATOR_INTERRUPTED/, 'M2 requires ignored input to fail before Candidate preparation');
    const headAfter = await runProcess(GIT, ['rev-parse', 'HEAD'], { cwd: fixture.worktree, env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' } });
    assert.equal(headAfter.stdout, headBefore.stdout, 'ignored-input rejection cannot move the branch');
  });
});

test('CONTROL-M2-003 / TEST-M2-003 / 003-C04: legacy public inspectWorktree rejects wrong branch or Head without a worktree mutation', async () => {
  await withRepository(async fixture => {
    const adapters = createCoordinatorAdapters({ repository_root: fixture.repository, state_root: path.join(fixture.root, '.identity-state'), device: 'mac-mini', process_run_id: 'm2-inspect-identity-control', git_executable: GIT, pull_request_executable: '/usr/bin/false', base_environment: {} });
    const before = await runProcess(GIT, ['status', '--porcelain=v1', '-z'], { cwd: fixture.worktree, env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' } });
    assert.equal(before.stdout, '');
    await assert.rejects(adapters.git.inspectWorktree({ canonical_root: fixture.repository, worktree_root: fixture.worktree, expected_branch: 'work/mac-mini/wrong', expected_head: fixture.candidate_sha }), /COORDINATOR_INTERRUPTED/);
    await assert.rejects(adapters.git.inspectWorktree({ canonical_root: fixture.repository, worktree_root: fixture.worktree, expected_branch: 'work/mac-mini/m2-test', expected_head: fixture.baseline_sha }), /COORDINATOR_INTERRUPTED/);
    const after = await runProcess(GIT, ['status', '--porcelain=v1', '-z'], { cwd: fixture.worktree, env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' } });
    assert.equal(after.stdout, before.stdout, 'identity rejection does not stage, clean, or otherwise mutate the Test-owned worktree');
  });
});

test('CONTROL-M2-003 / TEST-M2-003 / 003-C05: legacy public stageExact rejects empty, duplicate, and unsorted path lists before index mutation', async () => {
  await withRepository(async fixture => {
    const adapters = createCoordinatorAdapters({ repository_root: fixture.repository, state_root: path.join(fixture.root, '.stage-input-state'), device: 'mac-mini', process_run_id: 'm2-stage-input-control', git_executable: GIT, pull_request_executable: '/usr/bin/false', base_environment: {} });
    await writeFile(path.join(fixture.worktree, 'tracked.txt'), 'dirty\n');
    const before = await runProcess(GIT, ['diff', '--cached', '--name-status', '-z'], { cwd: fixture.worktree, env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' } });
    assert.equal(before.stdout, '');
    for (const paths of [[], ['tracked.txt', 'tracked.txt'], ['z.mjs', 'a.mjs']]) await assert.rejects(adapters.git.stageExact({ canonical_root: fixture.repository, worktree_root: fixture.worktree, expected_head: fixture.candidate_sha, paths }), /COORDINATOR_INTERRUPTED/);
    const after = await runProcess(GIT, ['diff', '--cached', '--name-status', '-z'], { cwd: fixture.worktree, env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' } });
    assert.equal(after.stdout, before.stdout, 'argument rejection leaves the index untouched');
  });
});

async function oneFileStageInput(fixture, content = 'purpose-bound stage input\n') {
  await writeFile(path.join(fixture.worktree, 'tracked.txt'), content);
  const subject = await freshWorktreeSubject(fixture.repository, fixture.worktree);
  const definition = { id: 'regression-affected-suite', validation_kind: 'REGRESSION', validation_scope: 'AFFECTED_SUITE', subject: 'WORKTREE', argv: [NODE, '-e', 'process.stdout.write("stage-input\\n")'], cwd: fixture.worktree, environment: {}, timeout_ms: 10_000 };
  const validation = await production.createValidationGateway({ nodeExecutable: NODE }).execute({ definition, subject });
  assertClosedExecutionGatewayResult(validation, ['COMPLETED', 'PASS', null]);
  assert.equal(typeof production.createCandidateStageGateway, 'function', 'the approved purpose-bound stage factory must exist before the stimulus');
  const gateway = production.createCandidateStageGateway({ gitExecutable: GIT });
  assert.equal(Object.isFrozen(gateway), true); assert.deepEqual(Object.keys(gateway).sort(), ['readStaged', 'stageExact']);
  return { gateway, request: { canonical_root: fixture.repository, subject, expected_worktree_snapshot_sha256: validation.value.worktree_snapshot_sha256, paths: ['tracked.txt'] }, subject, validation };
}

function assertNoCandidateOrLaterEffects(gatewayEvents, { allowCommit = false, allowCandidateEvent = false, allowFinalStateWrite = false } = {}) {
  if (!allowCommit) assert.equal(gatewayEvents.some(event => event.gateway === 'git' && event.method === 'commitCandidate' && event.edge === 'START'), false, 'the stop creates no Candidate commit');
  if (!allowCandidateEvent) assert.equal(gatewayEvents.some(event => event.gateway === 'ledger' && event.method === 'prepareAppend' && ledgerPrepareEvent(event.request)?.event_class === 'CANDIDATE_COMMITTED'), false, 'the stop publishes no Candidate event');
  if (!allowFinalStateWrite) assert.equal(gatewayEvents.some(event => event.gateway === 'state' && event.method === 'writeState' && (() => { try { return JSON.parse(event.request.next_bytes).phase === 'FINAL_VALIDATION'; } catch { return false; } })()), false, 'the stop publishes no FINAL_VALIDATION State');
  assert.equal(gatewayEvents.some(event => event.gateway === 'git' && event.method === 'pushBranch'), false, 'the stop performs no branch push');
  assert.equal(gatewayEvents.some(event => ['pull_request', 'handoff'].includes(event.gateway)), false, 'the stop performs no PR or Handoff effect');
}

test('RED-M2-003 / TEST-M2-003 / 003-L08: the real closed stage factory rejects an empty actual path set before index mutation', async () => {
  await withRepository(async fixture => {
    const { gateway, request } = await oneFileStageInput(fixture);
    const before = await runProcess(GIT, ['write-tree'], { cwd: fixture.worktree, env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' } });
    await assert.rejects(gateway.stageExact({ ...request, paths: [] }));
    const after = await runProcess(GIT, ['write-tree'], { cwd: fixture.worktree, env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' } });
    assert.equal(after.stdout, before.stdout, 'empty-stage rejection leaves the real index tree unchanged');
  });
});

test('RED-M2-003 / TEST-M2-003 / 003-L10: an unused signed allowed rule never becomes a staged path', async () => {
  await withObservedK1Prefix(async ({ candidateEvent, observedStageRequests }) => {
    assert.deepEqual(observedStageRequests.find(entry => entry.method === 'stageExact').request.paths, ['tracked.txt']);
    assert.deepEqual(candidateEvent.detail.staged_paths, ['tracked.txt']);
  }, { scope: { allowed_paths: ['tracked.txt', 'unused/**'], forbidden_paths: [] } });
});

test('RED-M2-003 / TEST-M2-003 / 003-L11: an actual forbidden path stops before physical stage and every Candidate/later effect', async () => {
  await withObservedK1Prefix(async ({ command, core, afterWorker, coreWorktree, gatewayEvents, observedStageRequests }) => {
    await writeFile(path.join(coreWorktree, 'denied.txt'), 'forbidden worker output\n');
    const stopped = await core.run({ change_id: command.change_id, expected_state_version: afterWorker.state_version, expected_state_hash: afterWorker.state_hash });
    assert.equal(stopped.outcome, 'BLOCKED'); assert.equal(stopped.payload.blocked_reason, 'WORKTREE_DIRTY_CONFLICT');
    assert.equal(observedStageRequests.length, 0); assertNoCandidateOrLaterEffects(gatewayEvents);
  }, { stopAfterWorker: true, scope: { allowed_paths: ['tracked.txt'], forbidden_paths: ['denied.txt'] } });
});

test('RED-M2-003 / TEST-M2-003 / 003-L12: malformed Adapter path records stop before the closed stage factory', async t => {
  const cases = [
    ['absolute path', { path: '/absolute', status: 'MODIFIED', mode: null, object_sha: null }],
    ['dot path', { path: '.', status: 'MODIFIED', mode: null, object_sha: null }],
    ['dot-dot path', { path: '..', status: 'MODIFIED', mode: null, object_sha: null }],
    ['traversal path', { path: 'nested/../escape', status: 'MODIFIED', mode: null, object_sha: null }],
    ['backslash path', { path: 'back\\slash', status: 'MODIFIED', mode: null, object_sha: null }],
    ['NUL path', { path: 'nul\0path', status: 'MODIFIED', mode: null, object_sha: null }],
    ['rename status', { path: 'tracked.txt', status: 'RENAMED', mode: null, object_sha: null }],
    ['copy status', { path: 'tracked.txt', status: 'COPIED', mode: null, object_sha: null }],
    ['unmerged status', { path: 'tracked.txt', status: 'UNMERGED', mode: null, object_sha: null }],
    ['ignored status', { path: 'tracked.txt', status: 'IGNORED', mode: null, object_sha: null }],
    ['unsupported status', { path: 'tracked.txt', status: 'UNSUPPORTED', mode: null, object_sha: null }],
    ['invalid path property type', { path: new Uint8Array([0xff]), status: 'MODIFIED', mode: null, object_sha: null }],
    ['non-roundtrip UTF-8 path', { path: '\ud800', status: 'MODIFIED', mode: null, object_sha: null }],
  ];
  for (const [label, malformed] of cases) await t.test(label, async () => {
    await withObservedK1Prefix(async ({ command, core, afterWorker, gatewayEvents, faultHits, observedStageRequests }) => {
      const stopped = await core.run({ change_id: command.change_id, expected_state_version: afterWorker.state_version, expected_state_hash: afterWorker.state_hash });
      assert.deepEqual(faultHits, [`git:inspectWorktree:${label}`]);
      assert.equal(stopped.outcome, 'BLOCKED'); assert.equal(observedStageRequests.length, 0); assertNoCandidateOrLaterEffects(gatewayEvents);
    }, {
      stopAfterWorker: true,
      transformGitResult: async ({ method, actualResult, faultHits }) => {
        if (method !== 'inspectWorktree' || actualResult?.value?.clean !== false || faultHits.length) return actualResult;
        faultHits.push(`git:inspectWorktree:${label}`);
        return ok({ ...actualResult.value, status_entries: [malformed] });
      },
    });
  });
});

test('RED-M2-003 / TEST-M2-003 / 003-L13: duplicate, unsorted, or mismatched stage/readback identities stop before commit', async t => {
  const cases = [
    ['duplicate stage paths', value => ({ ...value, staged_paths: ['tracked.txt', 'tracked.txt'] })],
    ['unsorted stage paths', value => ({ ...value, staged_paths: ['z.txt', 'tracked.txt'] })],
    ['readback path mismatch', value => ({ ...value, staged_paths: ['other.txt'], staged_paths_sha256: sha256(canonicalJson(['other.txt'])) })],
  ];
  for (const [label, mutate] of cases) await t.test(label, async () => {
    await withObservedK1Prefix(async ({ command, core, regression, gatewayEvents, faultHits }) => {
      const stopped = await core.run({ change_id: command.change_id, expected_state_version: regression.state_version, expected_state_hash: regression.state_hash });
      assert.deepEqual(faultHits, [`git:${label}`]); assert.equal(stopped.outcome, 'BLOCKED'); assertNoCandidateOrLaterEffects(gatewayEvents);
    }, {
      stopAtStage: true,
      transformCandidateStageValue: async ({ method, actualResult, faultHits }) => {
        if (faultHits.length || method !== (label === 'readback path mismatch' ? 'readStaged' : 'stageExact')) return actualResult;
        faultHits.push(`git:${label}`); return mutate(structuredClone(actualResult));
      },
    });
  });
});

test('RED-M2-003 / TEST-M2-003 / 003-L14: mutation after Regression but before stage fails before physical add', async () => {
  await withObservedRealSpawns(async observations => {
    await withObservedK1Prefix(async ({ command, core, regression, coreWorktree, gatewayEvents, faultHits }) => {
      const stopped = await core.run({ change_id: command.change_id, expected_state_version: regression.state_version, expected_state_hash: regression.state_hash });
      assert.deepEqual(faultHits, ['git:before-stage-mutation']); assert.equal(stopped.outcome, 'BLOCKED');
      assert.equal(observations.some(observation => observation.executable === GIT && observation.argv.includes('--pathspec-file-nul')), false, 'snapshot mismatch rejects before physical add');
      assertNoCandidateOrLaterEffects(gatewayEvents);
    }, {
      stopAtStage: true,
      beforeGitMethod: async ({ method, request, faultHits }) => {
        if (method !== 'stageExact' || faultHits.length) return;
        await writeFile(path.join(request.subject.worktree_root, 'tracked.txt'), 'changed before stage\n'); faultHits.push('git:before-stage-mutation');
      },
    });
  });
});

test('RED-M2-003 / TEST-M2-003 / 003-L15: mutation inside stageExact after pre-observation is caught with the real delegated add', async () => {
  await withRepository(async fixture => {
    const { gateway, request } = await oneFileStageInput(fixture);
    let mutated = false;
    await withObservedRealSpawns(async observations => {
      await assert.rejects(gateway.stageExact(request));
      const add = observations.find(observation => observation.executable === GIT && observation.argv.includes('--pathspec-file-nul'));
      assert.ok(add); assert.equal(mutated, true); assert.deepEqual(Buffer.concat(add.stdin_chunks), Buffer.from('tracked.txt\0'));
    }, { onSpawn(observation) { if (!mutated && observation.executable === GIT && observation.argv.includes('--pathspec-file-nul')) { mutated = true; writeFileSync(path.join(fixture.worktree, 'tracked.txt'), 'changed during stage\n'); } } });
  });
});

for (const [leaf, label, afterMethod, mutate] of [
  ['003-L16', 'replace index and worktree after stageExact before readStaged', 'stageExact', async request => { await writeFile(path.join(request.subject.worktree_root, 'tracked.txt'), 'replacement before readStaged\n'); await runProcess(GIT, ['add', '--', 'tracked.txt'], { cwd: request.subject.worktree_root, env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' } }); }],
  ['003-L17', 'replace index and worktree after readStaged before commit-tree', 'readStaged', async request => { await writeFile(path.join(request.worktree_root, 'tracked.txt'), 'replacement before commit-tree\n'); await runProcess(GIT, ['add', '--', 'tracked.txt'], { cwd: request.worktree_root, env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' } }); }],
  ['003-L18', 'create post-stage untracked remainder', 'stageExact', async request => { await writeFile(path.join(request.subject.worktree_root, 'late-untracked.txt'), 'late remainder\n'); }],
]) {
  test(`RED-M2-003 / TEST-M2-003 / ${leaf}: ${label}`, async () => {
    await withObservedRealSpawns(async observations => {
      await withObservedK1Prefix(async ({ command, core, regression, coreWorktree, gatewayEvents, faultHits }) => {
        const parentBefore = (await runProcess(GIT, ['rev-parse', 'HEAD'], { cwd: coreWorktree, env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' } })).stdout.trim();
        const stopped = await core.run({ change_id: command.change_id, expected_state_version: regression.state_version, expected_state_hash: regression.state_hash });
        assert.deepEqual(faultHits, [`git:${leaf}`]); assert.equal(stopped.outcome, 'BLOCKED');
        const realCommitTrees = observations.filter(observation => observation.executable === GIT && observation.cwd === coreWorktree && observation.argv[0] === 'commit-tree');
        const realRefMoves = observations.filter(observation => observation.executable === GIT && observation.cwd === coreWorktree && observation.argv[0] === 'update-ref');
        if (leaf !== '003-L18') {
          assert.equal(realCommitTrees.length, 0, 'the early replacement is rejected before a real commit-tree even if commitCandidate was entered');
          assert.equal(realRefMoves.length, 0);
        } else if (realCommitTrees.length > 0) {
          assert.equal(realCommitTrees.length, 1); assert.deepEqual(realCommitTrees[0].argv.slice(2), ['-p', parentBefore]);
          assert.ok(realRefMoves.length <= 1, 'a detected post-stage remainder can leave at most the one explicit-tree CAS');
        } else {
          const stageComplete = gatewayEvents.find(event => event.gateway === 'git' && event.method === 'stageExact' && event.edge === 'COMPLETE');
          assert.ok(gatewayEvents.some(event => event.gateway === 'git' && event.method === 'inspectWorktree' && event.sequence > stageComplete.sequence), 'a pre-commit remainder stop is backed by a fresh real Worktree observation');
        }
        assertNoCandidateOrLaterEffects(gatewayEvents, { allowCommit: true });
      }, {
        stopAtStage: true,
        afterGitMethod: async ({ method, request, faultHits }) => { if (method === afterMethod && !faultHits.length) { await mutate(request); faultHits.push(`git:${leaf}`); } },
      });
    });
  });
}

test('RED-M2-003 / TEST-M2-003 / 003-L17: replacement after the last index observation but at real commit-tree spawn cannot change the explicit committed tree', async () => {
  let targetWorktree = null; let replaced = false;
  await withObservedRealSpawns(async observations => {
    await withObservedK1Prefix(async ({ command, core, regression, coreWorktree, gatewayEvents }) => {
      targetWorktree = coreWorktree;
      const stopped = await core.run({ change_id: command.change_id, expected_state_version: regression.state_version, expected_state_hash: regression.state_hash });
      assert.equal(replaced, true); assert.equal(stopped.outcome, 'BLOCKED');
      const commit = gatewayEvents.find(event => event.gateway === 'git' && event.method === 'commitCandidate' && event.edge === 'COMPLETE');
      assert.ok(commit, 'the synchronized final-observation race creates the explicit-tree commit before final identity stop');
      const commitSpawn = observations.find(observation => observation.cwd === targetWorktree && observation.argv[0] === 'commit-tree');
      assert.ok(commitSpawn); assert.equal(commit.actual_result.value.tree, commitSpawn.argv[1]);
      const replacementTree = await runProcess(GIT, ['write-tree'], { cwd: coreWorktree, env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' } });
      assert.notEqual(commit.actual_result.value.tree, replacementTree.stdout.trim(), 'commit-tree selected retained expected_tree rather than replacement index bytes');
      assertNoCandidateOrLaterEffects(gatewayEvents, { allowCommit: true });
    }, { stopAtStage: true });
  }, {
    onSpawn(observation) {
      if (replaced || observation.cwd !== targetWorktree || observation.executable !== GIT || observation.argv[0] !== 'commit-tree') return;
      replaced = true;
      writeFileSync(path.join(targetWorktree, 'tracked.txt'), 'replacement at commit-tree boundary\n');
      const staged = childProcess.spawnSync(GIT, ['add', '--', 'tracked.txt'], { cwd: targetWorktree, env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' }, shell: false });
      assert.equal(staged.status, 0, staged.stderr?.toString());
    },
  });
});

test('RED-M2-003 / TEST-M2-003 / 003-L19: staged identity mismatch or parent-tree equality stops before commit', async t => {
  for (const label of ['stage/read tree mismatch', 'index tree equals parent tree']) await t.test(label, async () => {
    let stageTree = null; let parentTree = null;
    await withObservedK1Prefix(async ({ command, core, regression, coreWorktree, gatewayEvents, faultHits }) => {
      parentTree = (await runProcess(GIT, ['rev-parse', 'HEAD^{tree}'], { cwd: coreWorktree, env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' } })).stdout.trim();
      const stopped = await core.run({ change_id: command.change_id, expected_state_version: regression.state_version, expected_state_hash: regression.state_hash });
      assert.deepEqual(faultHits, [`git:${label}`]); assert.equal(stopped.outcome, 'BLOCKED'); assertNoCandidateOrLaterEffects(gatewayEvents);
    }, {
      stopAtStage: true,
      transformCandidateStageValue: async ({ method, actualResult, faultHits }) => {
        if (method === 'stageExact') {
          stageTree = actualResult.index_tree;
          return label === 'index tree equals parent tree' ? { ...actualResult, index_tree: parentTree } : actualResult;
        }
        if (method !== 'readStaged' || faultHits.length) return actualResult;
        faultHits.push(`git:${label}`);
        return { ...structuredClone(actualResult), index_tree: label === 'stage/read tree mismatch' ? `${stageTree.startsWith('0') ? '1' : '0'}${stageTree.slice(1)}` : parentTree };
      },
    });
  });
});

test('CONTROL-M2-004 / TEST-M2-004 / 004-C01: legacy public Adapter stage, commit, and readback are real Git component evidence only', async () => {
  await withRepository(async fixture => {
    const adapters = createCoordinatorAdapters({ repository_root: fixture.repository, state_root: path.join(fixture.root, '.candidate-component-state'), device: 'mac-mini', process_run_id: 'm2-candidate-component-control', git_executable: GIT, pull_request_executable: '/usr/bin/false', base_environment: {} });
    await writeFile(path.join(fixture.worktree, 'tracked.txt'), 'candidate component bytes\n');
    const staged = await adapters.git.stageExact({ canonical_root: fixture.repository, worktree_root: fixture.worktree, expected_head: fixture.candidate_sha, paths: ['tracked.txt'] });
    const stagedReadback = await adapters.git.readStaged({ canonical_root: fixture.repository, worktree_root: fixture.worktree });
    assert.deepEqual(stagedReadback, staged);
    assert.deepEqual(staged.value.staged_paths, ['tracked.txt']);
    assert.equal(staged.value.staged_paths_sha256, sha256(canonicalJson(['tracked.txt'])));
    const idempotency_id = `candidate-${sha256(canonicalJson({ schema_version: '1.0', change_id: 'CHG-dual-device-transition-foundation', authorization_cycle_command_id: 'command-component-001', expected_parent: fixture.candidate_sha, expected_tree: staged.value.index_tree }))}`;
    const message_bytes = new TextEncoder().encode(`JuanerAI Candidate\n\nJuanerAI-Idempotency-ID: ${idempotency_id}\n`);
    const committed = await adapters.git.commitCandidate({ canonical_root: fixture.repository, worktree_root: fixture.worktree, expected_parent: fixture.candidate_sha, expected_tree: staged.value.index_tree, message_bytes, idempotency_id });
    const reread = await adapters.git.readCommit({ canonical_root: fixture.repository, sha: committed.value.sha });
    assert.deepEqual(reread, committed);
    const head = await runProcess(GIT, ['rev-parse', 'HEAD'], { cwd: fixture.worktree, env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' } });
    assert.equal(head.code, 0, head.stderr);
    assert.equal(head.stdout.trim(), committed.value.sha);
    assert.equal(committed.value.parent, fixture.candidate_sha);
    assert.equal(committed.value.tree, staged.value.index_tree);
    assert.equal(committed.value.branch, 'work/mac-mini/m2-test');
  });
});

test('CONTROL-M2-004 / TEST-M2-004 / 004-C02: legacy public commitCandidate rejects wrong parent, tree, or idempotency before branch mutation', async () => {
  await withObservedRealSpawns(async observations => {
    await withRepository(async fixture => {
    const adapters = createCoordinatorAdapters({ repository_root: fixture.repository, state_root: path.join(fixture.root, '.candidate-negative-state'), device: 'mac-mini', process_run_id: 'm2-candidate-negative-control', git_executable: GIT, pull_request_executable: '/usr/bin/false', base_environment: {} });
    await writeFile(path.join(fixture.worktree, 'tracked.txt'), 'candidate negative bytes\n');
    const staged = await adapters.git.stageExact({ canonical_root: fixture.repository, worktree_root: fixture.worktree, expected_head: fixture.candidate_sha, paths: ['tracked.txt'] });
    const idempotency_id = `candidate-${sha256(canonicalJson({ schema_version: '1.0', change_id: 'CHG-dual-device-transition-foundation', authorization_cycle_command_id: 'command-component-002', expected_parent: fixture.candidate_sha, expected_tree: staged.value.index_tree }))}`;
    const message_bytes = new TextEncoder().encode(`JuanerAI Candidate\n\nJuanerAI-Idempotency-ID: ${idempotency_id}\n`);
    const request = { canonical_root: fixture.repository, worktree_root: fixture.worktree, expected_parent: fixture.candidate_sha, expected_tree: staged.value.index_tree, message_bytes, idempotency_id };
    const headBefore = await runProcess(GIT, ['rev-parse', 'HEAD'], { cwd: fixture.worktree, env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' } });
    const branchBefore = await runProcess(GIT, ['branch', '--show-current'], { cwd: fixture.worktree, env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' } });
    const statusBefore = await runProcess(GIT, ['status', '--porcelain=v1', '-z', '--untracked-files=all', '--ignored=matching', '--no-renames'], { cwd: fixture.worktree, env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' } });
    for (const result of [headBefore, branchBefore, statusBefore]) assert.equal(result.code, 0, result.stderr);
    const rejectionObservationStart = observations.length;
    assert.deepEqual(await adapters.git.commitCandidate({ ...request, expected_parent: fixture.baseline_sha }), { kind: 'CONFLICT', reason: 'READBACK_MISMATCH', observed_identity: null });
    assert.deepEqual(await adapters.git.commitCandidate({ ...request, expected_tree: fixture.candidate_tree }), { kind: 'CONFLICT', reason: 'DIRTY_WORKTREE', observed_identity: null });
    await assert.rejects(adapters.git.commitCandidate({ ...request, idempotency_id: '' }), /COORDINATOR_INTERRUPTED/);
    assert.equal(observations.slice(rejectionObservationStart).some(observation => observation.executable === GIT && ['commit-tree', 'update-ref', 'commit', 'reset', 'clean'].includes(observation.argv[0])), false, 'the three rejection forms create no Candidate commit, ref move, ordinary commit, or cleanup effect');
    const headAfter = await runProcess(GIT, ['rev-parse', 'HEAD'], { cwd: fixture.worktree, env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' } });
    const branchAfter = await runProcess(GIT, ['branch', '--show-current'], { cwd: fixture.worktree, env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' } });
    const statusAfter = await runProcess(GIT, ['status', '--porcelain=v1', '-z', '--untracked-files=all', '--ignored=matching', '--no-renames'], { cwd: fixture.worktree, env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' } });
    for (const result of [headAfter, branchAfter, statusAfter]) assert.equal(result.code, 0, result.stderr);
    assert.equal(headAfter.stdout, headBefore.stdout, 'closed conflict and malformed-input rejection retain the current branch Head');
    assert.equal(branchAfter.stdout, branchBefore.stdout, 'closed conflict and malformed-input rejection retain the current branch identity');
    assert.equal(statusAfter.stdout, statusBefore.stdout, 'closed conflict and malformed-input rejection preserve the pre-existing staged worktree without cleanup');
    });
  });
});

test('CONTROL-M2-004 / TEST-M2-004 / 004-C03: legacy public commitCandidate rejects a nonconforming message before branch movement', async () => {
  await withRepository(async fixture => {
    const adapters = createCoordinatorAdapters({ repository_root: fixture.repository, state_root: path.join(fixture.root, '.candidate-message-state'), device: 'mac-mini', process_run_id: 'm2-candidate-message-red', git_executable: GIT, pull_request_executable: '/usr/bin/false', base_environment: {} });
    await writeFile(path.join(fixture.worktree, 'tracked.txt'), 'candidate message red bytes\n');
    const staged = await adapters.git.stageExact({ canonical_root: fixture.repository, worktree_root: fixture.worktree, expected_head: fixture.candidate_sha, paths: ['tracked.txt'] });
    const headBefore = await runProcess(GIT, ['rev-parse', 'HEAD'], { cwd: fixture.worktree, env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' } });
    const idempotency_id = `candidate-${sha256(canonicalJson({ schema_version: '1.0', change_id: 'CHG-dual-device-transition-foundation', authorization_cycle_command_id: 'command-message-red', expected_parent: fixture.candidate_sha, expected_tree: staged.value.index_tree }))}`;
    try {
      await assert.rejects(adapters.git.commitCandidate({ canonical_root: fixture.repository, worktree_root: fixture.worktree, expected_parent: fixture.candidate_sha, expected_tree: staged.value.index_tree, message_bytes: new TextEncoder().encode('not the required Candidate message'), idempotency_id }), /COORDINATOR_INTERRUPTED/, 'M2 requires a nonconforming message to reject before a branch move');
    } finally {
      const headAfter = await runProcess(GIT, ['rev-parse', 'HEAD'], { cwd: fixture.worktree, env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' } });
      assert.equal(headAfter.stdout, headBefore.stdout, 'a nonconforming message must leave the branch Head unchanged');
    }
  });
});

test('CONTROL-M2-004 / TEST-M2-004 / 004-C04: a fresh Test Ledger gateway resumes exact bare-remote bytes, tip, and sequence without appending', async () => {
  await withRepository(async fixture => {
    const changeId = 'CHG-dual-device-transition-foundation';
    const firstReadbacks = []; const ledger = await createLocalBareLedger(fixture.root, changeId, firstReadbacks);
    const first = await appendTestLedgerEvent(ledger, {
      change_id: changeId, event_class: 'BLOCKED',
      detail: { blocked_reason: 'TEST_HEALTH', next_action: 'MANUAL_CONTROLLER_STOP', evidence_refs: [] },
      state_version: 1, subject_sha: fixture.candidate_sha, idempotency_id: 'ledger-health-001',
    });
    assert.deepEqual(Object.keys(first.prior.value).sort(), ['authoritative_path', 'expected_tip', 'file_present', 'last_event_hash', 'last_event_id', 'last_sequence', 'ledger_bytes_base64', 'prior_byte_length', 'prior_bytes_sha256', 'remote_ref', 'tip', 'tip_parent', 'tip_tree'].sort());
    assert.deepEqual(Object.keys(first.prepared.value).sort(), ['authoritative_path', 'event_hash', 'event_id', 'expected_tip', 'idempotency_id', 'new_byte_length', 'new_bytes_sha256', 'prepared_bytes_sha256', 'prior_byte_length', 'prior_bytes_sha256', 'record_length', 'record_offset', 'remote_ref', 'sequence'].sort());
    assert.deepEqual(Object.keys(first.committed.value).sort(), ['authoritative_path', 'changed_paths', 'commit_sha', 'event_hash', 'event_id', 'idempotency_id', 'new_byte_length', 'new_bytes_sha256', 'parent_tip', 'preserved_entries_sha256_after', 'preserved_entries_sha256_before', 'prior_byte_length', 'prior_bytes_sha256', 'push_status', 'record_length', 'record_offset', 'remote_ref', 'sequence', 'tree_sha'].sort());
    assert.deepEqual(Object.keys(first.readback.value).sort(), ['authoritative_path', 'commit_sha', 'event_hash', 'event_id', 'idempotency_id', 'linearized', 'new_byte_length', 'new_bytes_sha256', 'parent_tip', 'prior_byte_length', 'prior_bytes_sha256', 'record_bytes_sha256', 'record_length', 'record_offset', 'remote_ref', 'sequence', 'tip', 'tree_sha'].sort());
    assert.equal(first.readback.value.record_bytes_sha256, sha256(first.eventBytes), 'remote append hashes the exact appended canonical record slice, not the whole Ledger file');
    assert.equal(first.event.detail.blocked_reason, 'TEST_HEALTH', 'this Test-only BLOCKED label identifies a gateway-byte control and does not claim public-Core event-semantic admission');
    assert.equal(first.committed.value.preserved_entries_sha256_before, first.committed.value.preserved_entries_sha256_after, 'the real evidence commit preserves every non-Ledger tree entry');
    const beforeResume = await readLocalLedger(ledger, changeId);
    assert.equal(firstReadbacks.length, 1); assertExactLedgerReadback(firstReadbacks[0], first.event, Buffer.from(beforeResume.value.ledger_bytes_base64, 'base64'));
    const restartProgram = fullCoreRestartProgram();
    const restartProgramPath = path.join(fixture.root, '004-c04-full-core-restart-health.mjs');
    await writeFile(restartProgramPath, restartProgram);
    const syntax = await runProcess(NODE, ['--check', restartProgramPath], { cwd: fixture.root, env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' } });
    assert.deepEqual({ code: syntax.code, signal: syntax.signal, stdout: syntax.stdout, stderr: syntax.stderr }, { code: 0, signal: null, stdout: '', stderr: '' }, 'the exact embedded full-Core restart program has healthy Node syntax');
    const childRead = await runProcess(NODE, ['--input-type=module', '-e', restartProgram, encodeCoreRestartConfig({ mode: 'ledger-health', fixtureRoot: fixture.root, changeId })], { cwd: fixture.root, env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' } });
    assert.equal(childRead.code, 0, childRead.stderr);
    assert.equal(childRead.signal, null);
    assert.equal(childRead.stderr, '');
    assert.deepEqual(JSON.parse(childRead.stdout), beforeResume, 'the exact restart program independently imports its dependencies and reads the same real bare-Ledger authority');
    const resumedReadbacks = []; const resumed = await createLocalBareLedger(fixture.root, changeId, resumedReadbacks, { resume: true });
    const afterResume = await readLocalLedger(resumed, changeId);
    assert.deepEqual(afterResume, beforeResume, 'resume reads the exact existing remote bytes/tip/tree/last-record identity');
    const nextEventBytes = makeTestLedgerEventBytes({
      change_id: changeId, event_class: 'BLOCKED', detail: { blocked_reason: 'TEST_HEALTH_NEXT', next_action: 'MANUAL_CONTROLLER_STOP', evidence_refs: [] },
      sequence: afterResume.value.last_sequence + 1, state_version: 2, subject_sha: fixture.candidate_sha, idempotency_id: 'ledger-health-002',
    });
    const nextPrepared = await resumed.prepareAppend({
      remote_read_receipt_sha256: afterResume.receipt_sha256, expected_tip: afterResume.value.tip,
      prior_bytes: Buffer.from(afterResume.value.ledger_bytes_base64, 'base64'), event_bytes: nextEventBytes,
    });
    assert.equal(nextPrepared.kind, 'OK');
    assert.equal(nextPrepared.value.sequence, afterResume.value.last_sequence + 1, 'resume seeds the next sequence from the real remote record without inventing history');
    const afterPrepareOnly = await readLocalLedger(resumed, changeId);
    assert.deepEqual(afterPrepareOnly, beforeResume, 'resume and an uncommitted preparation append no remote bytes');
    const secondCommitted = await resumed.commitAndPush({ prepared_receipt: nextPrepared.value, idempotency_id: 'ledger-health-002' }); assert.equal(secondCommitted.kind, 'OK');
    const secondEvent = JSON.parse(nextEventBytes.subarray(0, -1).toString('utf8'));
    const secondReadback = await resumed.readRemoteAppend({ expected_commit: secondCommitted.value.commit_sha, event_id: secondEvent.event_id, event_hash: secondEvent.event_hash, idempotency_id: secondEvent.idempotency_id }); assert.equal(secondReadback.kind, 'OK');
    const finalRemote = await readLocalLedger(resumed, changeId, secondCommitted.value.commit_sha); assert.equal(finalRemote.kind, 'OK');
    const finalBytes = Buffer.from(finalRemote.value.ledger_bytes_base64, 'base64'); const secondSlice = finalBytes.subarray(secondReadback.value.record_offset, secondReadback.value.record_offset + secondReadback.value.record_length);
    assert.equal(resumedReadbacks.length, 1); assertExactLedgerReadback(resumedReadbacks[0], secondEvent, finalBytes);
    assert.deepEqual(secondSlice, nextEventBytes, 'the second real commit is recovered from its exact nonzero remote offset and declared length');
    assert.equal(secondReadback.value.record_bytes_sha256, sha256(secondSlice)); assert.notEqual(secondReadback.value.record_bytes_sha256, sha256(finalBytes), 'a multi-record Ledger makes the record-slice hash observably different from the whole-file hash');
    assert.equal(secondReadback.value.record_offset, first.readback.value.new_byte_length); assert.equal(secondReadback.value.parent_tip, first.committed.value.commit_sha); assert.equal(secondReadback.value.tip, secondCommitted.value.commit_sha); assert.equal(secondReadback.value.tree_sha, secondCommitted.value.tree_sha);
    assert.equal(secondReadback.value.prior_bytes_sha256, sha256(first.eventBytes)); assert.equal(secondReadback.value.new_bytes_sha256, sha256(finalBytes)); assert.equal(secondReadback.value.new_byte_length, finalBytes.length);
  });
});

test('RED-M2-004 / TEST-M2-004 / 004-L01: one persisted STAGE run publishes the exact Candidate event and FINAL_VALIDATION State without an intermediate publication', async () => {
  await withObservedRealSpawns(async observations => {
    await withObservedK1Prefix(async ({ command, candidateTransition, candidateEvent, expectedSubject, expectedSnapshot, coreWorktree, ledger, observedLedgerReadbacks, gatewayEvents, observedStageRequests }) => {
      assert.equal(candidateTransition.outcome, 'ADVANCED'); assert.equal(candidateTransition.payload.to_phase, 'FINAL_VALIDATION');
      assert.deepEqual(observedStageRequests.map(entry => entry.method), ['stageExact', 'readStaged', 'readStaged']);
      assert.deepEqual(Object.keys(observedStageRequests[0].request).sort(), ['canonical_root', 'expected_worktree_snapshot_sha256', 'paths', 'subject']);
      assert.deepEqual(Object.keys(observedStageRequests[1].request).sort(), ['canonical_root', 'worktree_root']);
      assert.deepEqual(Object.keys(observedStageRequests[2].request).sort(), ['canonical_root', 'worktree_root']);
      assert.equal(observedStageRequests[0].request.expected_worktree_snapshot_sha256, expectedSnapshot.worktree_snapshot_sha256);
      const commitStart = gatewayEvents.find(event => event.gateway === 'git' && event.method === 'commitCandidate' && event.edge === 'START');
      const commitComplete = gatewayEvents.find(event => event.gateway === 'git' && event.method === 'commitCandidate' && event.edge === 'COMPLETE' && event.invocation === commitStart?.invocation);
      const stageCalls = gatewayEvents.filter(event => event.gateway === 'git' && ['stageExact', 'readStaged'].includes(event.method) && ['START', 'COMPLETE'].includes(event.edge));
      assert.deepEqual(stageCalls.map(event => [event.edge, event.method]), [['START', 'stageExact'], ['COMPLETE', 'stageExact'], ['START', 'readStaged'], ['COMPLETE', 'readStaged'], ['START', 'readStaged'], ['COMPLETE', 'readStaged']], 'the one physical stage is followed by one pre-commit and one post-commit independent staged readback');
      const [stageStart, stageComplete, precommitReadStart, precommitReadComplete, postcommitReadStart, postcommitReadComplete] = stageCalls;
      assert.equal(stageStart.invocation, stageComplete.invocation); assert.equal(precommitReadStart.invocation, precommitReadComplete.invocation); assert.equal(postcommitReadStart.invocation, postcommitReadComplete.invocation);
      assert.ok(stageComplete.sequence < precommitReadStart.sequence && precommitReadComplete.sequence < commitStart?.sequence && commitComplete?.sequence < postcommitReadStart.sequence && postcommitReadStart.sequence < postcommitReadComplete.sequence, 'the existing invocation identities prove stageExact/readStaged before commit and an independent readStaged after commit');
      assert.ok(commitStart); assert.deepEqual(Object.keys(commitStart.request).sort(), ['canonical_root', 'expected_parent', 'expected_tree', 'idempotency_id', 'message_bytes', 'worktree_root']);
      assert.equal(commitStart.request.canonical_root, command.repository.canonical_root); assert.equal(commitStart.request.expected_parent, expectedSubject.head_sha); assert.equal(commitStart.request.expected_tree, candidateEvent.detail.tree);
      const expectedId = `candidate-${sha256(canonicalJson({ schema_version: '1.0', change_id: command.change_id, authorization_cycle_command_id: command.command_id, expected_parent: expectedSubject.head_sha, expected_tree: candidateEvent.detail.tree }))}`;
      assert.equal(commitStart.request.idempotency_id, expectedId);
      assert.deepEqual(Buffer.from(commitStart.request.message_bytes), Buffer.from(`JuanerAI Candidate\n\nJuanerAI-Idempotency-ID: ${expectedId}\n`));
      const candidatePrepare = gatewayEvents.find(event => event.gateway === 'ledger' && event.method === 'prepareAppend' && ledgerPrepareEvent(event.request)?.event_class === 'CANDIDATE_COMMITTED');
      const candidateReadback = gatewayEvents.find(event => event.gateway === 'ledger' && event.method === 'readRemoteAppend' && event.edge === 'COMPLETE' && event.result?.value?.event_id === candidateEvent.event_id);
      const stateWritePhase = event => { try { return event.request?.next_bytes ? JSON.parse(event.request.next_bytes).phase : event.request?.value?.phase ?? event.request?.state?.phase; } catch { return null; } };
      const finalStateWrite = gatewayEvents.find(event => event.gateway === 'state' && event.method === 'writeState' && stateWritePhase(event) === 'FINAL_VALIDATION');
      const finalStateReadback = gatewayEvents.find(event => event.gateway === 'state' && event.method === 'readState' && event.edge === 'COMPLETE' && event.sequence > (finalStateWrite?.sequence ?? Number.MAX_SAFE_INTEGER) && (() => { try { return JSON.parse(event.result.value.bytes).phase === 'FINAL_VALIDATION'; } catch { return false; } })());
      assert.ok(stageStart && candidatePrepare && candidateReadback && finalStateWrite && finalStateReadback && postcommitReadComplete.sequence < candidatePrepare.sequence && stageStart.sequence < candidatePrepare.sequence && candidatePrepare.sequence < candidateReadback.sequence && candidateReadback.sequence < finalStateWrite.sequence && finalStateWrite.sequence < finalStateReadback.sequence, 'the post-commit staged readback completes before Candidate publication, which completes before FINAL_VALIDATION State write and exact readback');
      assert.equal(gatewayEvents.some(event => event.gateway === 'state' && event.method === 'writeState' && event.sequence > stageStart.sequence && event.sequence < finalStateWrite.sequence), false, 'K1 publishes no CANDIDATE_COMMIT State');
    const remote = await readLocalLedger(ledger, command.change_id); const decoded = decodeRemoteLedger(remote);
      assert.deepEqual(decoded.records.at(-1), candidateEvent);
      assertExactLedgerReadback(observedLedgerReadbacks.find(entry => entry.event.event_id === candidateEvent.event_id), candidateEvent, decoded.bytes);
      const candidateSpawns = observations.filter(observation => observation.executable === GIT && observation.cwd === coreWorktree);
      const commitTree = candidateSpawns.find(observation => canonicalJson(observation.argv) === canonicalJson(['commit-tree', candidateEvent.detail.tree, '-p', expectedSubject.head_sha]));
      const refCas = candidateSpawns.find(observation => canonicalJson(observation.argv) === canonicalJson(['update-ref', `refs/heads/${expectedSubject.branch}`, candidateEvent.detail.candidate_sha, expectedSubject.head_sha]));
      assert.ok(commitTree && refCas && candidateSpawns.indexOf(commitTree) < candidateSpawns.indexOf(refCas));
      assert.deepEqual(Buffer.concat(commitTree.stdin_chunks), Buffer.from(commitStart.request.message_bytes));
      assert.equal(candidateSpawns.some(observation => ['commit', 'merge', 'checkout', 'reset'].includes(observation.argv[0])), false);
    });
  });
});

for (const scenario of [
  { leaf: '004-L02', label: 'wrong explicit parent request', interval: 'precommit', reason: 'CANDIDATE_IDENTITY_CONFLICT' },
  { leaf: '004-L03', label: 'wrong explicit tree request', interval: 'precommit', reason: 'WORKTREE_DIRTY_CONFLICT' },
  { leaf: '004-L04', label: 'wrong exact message trailer', interval: 'precommit', reason: 'CANDIDATE_IDENTITY_CONFLICT' },
  { leaf: '004-L05', label: 'wrong commit result branch', interval: 'postcommit', reason: 'CANDIDATE_IDENTITY_CONFLICT' },
  { leaf: '004-L06', label: 'wrong commit result SHA', interval: 'postcommit', reason: 'CANDIDATE_IDENTITY_CONFLICT' },
  { leaf: '004-L07', label: 'wrong final Worktree Head', interval: 'postcommit', reason: 'CANDIDATE_IDENTITY_CONFLICT' },
  { leaf: '004-L08', label: 'wrong final common-dir', interval: 'postcommit', reason: 'CANDIDATE_IDENTITY_CONFLICT' },
  { leaf: '004-L09', label: 'wrong committed tree readback', interval: 'postcommit', reason: 'CANDIDATE_IDENTITY_CONFLICT' },
  { leaf: '004-L10', label: 'dirty final Worktree readback', interval: 'postcommit', reason: 'CANDIDATE_IDENTITY_CONFLICT' },
  { leaf: '004-L11', label: 'wrong final index tree', interval: 'postcommit', reason: 'CANDIDATE_IDENTITY_CONFLICT' },
  { leaf: '004-L12', label: 'wrong Candidate record byte hash', interval: 'event' },
  { leaf: '004-L13', label: 'wrong Candidate State readback field', interval: 'state' },
]) {
  test(`RED-M2-004 / TEST-M2-004 / ${scenario.leaf}: ${scenario.label} is rejected at its exact K1 boundary`, async () => {
    let commitCompleted = false;
    const controls = {
      stopAtStage: true,
      transformGitRequest: async ({ method, request, faultHits }) => {
        if (method !== 'commitCandidate' || faultHits.length || !['004-L02', '004-L03', '004-L04'].includes(scenario.leaf)) return request;
        faultHits.push(`git:${scenario.leaf}`);
        if (scenario.leaf === '004-L02') return { ...request, expected_parent: 'f'.repeat(40) };
        if (scenario.leaf === '004-L03') return { ...request, expected_tree: `${request.expected_tree.startsWith('0') ? '1' : '0'}${request.expected_tree.slice(1)}` };
        return { ...request, message_bytes: new TextEncoder().encode(`JuanerAI Candidate\n\nJuanerAI-Idempotency-ID: wrong-${request.idempotency_id}\n`) };
      },
      afterGitMethod: async ({ method, actualResult }) => { if (method === 'commitCandidate' && actualResult?.kind === 'OK') commitCompleted = true; },
      transformGitResult: async ({ method, actualResult, faultHits }) => {
        if (faultHits.length || !commitCompleted) return actualResult;
        if (method === 'commitCandidate' && ['004-L05', '004-L06'].includes(scenario.leaf)) {
          faultHits.push(`git:${scenario.leaf}`);
          const value = structuredClone(actualResult.value);
          if (scenario.leaf === '004-L05') value.branch = 'work/mac-mini/wrong-branch';
          if (scenario.leaf === '004-L06') value.sha = `${value.sha.startsWith('0') ? '1' : '0'}${value.sha.slice(1)}`;
          return { ...actualResult, value, receipt_sha256: sha256(canonicalJson(value)) };
        }
        if (method === 'readCommit' && scenario.leaf === '004-L09') {
          faultHits.push(`git:${scenario.leaf}`);
          const value = structuredClone(actualResult.value);
          value.tree = `${value.tree.startsWith('0') ? '1' : '0'}${value.tree.slice(1)}`;
          return { ...actualResult, value, receipt_sha256: sha256(canonicalJson(value)) };
        }
        if (method === 'inspectWorktree' && ['004-L07', '004-L08', '004-L10'].includes(scenario.leaf)) {
          faultHits.push(`git:${scenario.leaf}`);
          const value = structuredClone(actualResult.value);
          if (scenario.leaf === '004-L07') value.head_sha = `${value.head_sha.startsWith('0') ? '1' : '0'}${value.head_sha.slice(1)}`;
          if (scenario.leaf === '004-L08') value.common_git_dir = `${value.common_git_dir}-wrong`;
          if (scenario.leaf === '004-L10') { value.clean = false; value.status_entries = [{ path: 'late.txt', status: 'UNTRACKED', mode: null, object_sha: null }]; }
          return { ...actualResult, value, receipt_sha256: sha256(canonicalJson(value)) };
        }
        if (method === 'readStaged' && scenario.leaf === '004-L11') {
          faultHits.push(`git:${scenario.leaf}`);
          const value = structuredClone(actualResult.value);
          value.index_tree = `${value.index_tree.startsWith('0') ? '1' : '0'}${value.index_tree.slice(1)}`;
          return { ...actualResult, value, receipt_sha256: sha256(canonicalJson(value)) };
        }
        return actualResult;
      },
      transformLedgerResult: async ({ method, event_class, actualResult, faultHits }) => {
        if (scenario.leaf !== '004-L12' || method !== 'readRemoteAppend' || event_class !== 'CANDIDATE_COMMITTED' || faultHits.length) return actualResult;
        faultHits.push(`ledger:${scenario.leaf}`);
        const value = { ...structuredClone(actualResult.value), record_bytes_sha256: 'f'.repeat(64) };
        return { ...actualResult, value, receipt_sha256: sha256(canonicalJson(value)) };
      },
      transformStateResult: async ({ method, actualResult, faultHits }) => {
        if (scenario.leaf !== '004-L13' || method !== 'readState' || actualResult?.kind !== 'OK' || faultHits.length) return actualResult;
        const state = JSON.parse(actualResult.value.bytes);
        if (state.phase !== 'FINAL_VALIDATION') return actualResult;
        faultHits.push(`state:${scenario.leaf}`);
        const altered = { ...state, candidate: { ...state.candidate, tree: `${state.candidate.tree.startsWith('0') ? '1' : '0'}${state.candidate.tree.slice(1)}` } };
        const value = { bytes: canonicalJson(altered), sha256: sha256(canonicalJson(altered)) };
        return { ...actualResult, value, receipt_sha256: sha256(canonicalJson(value)) };
      },
    };
    await withObservedRealSpawns(async observations => {
      await withObservedK1Prefix(async ({ base, command, core, afterWorker, regression, ledger, observedLedgerReadbacks, localPausePath, gatewayEvents, faultHits, coreWorktree, observedValidationActualResults }) => {
        const stateBefore = await base.state.readState({ change_id: command.change_id });
        const result = await core.run({ change_id: command.change_id, expected_state_version: regression.state_version, expected_state_hash: regression.state_hash });
        assert.deepEqual(faultHits, [`${scenario.interval === 'event' ? 'ledger' : scenario.interval === 'state' ? 'state' : 'git'}:${scenario.leaf}`]);
        const faultBoundary = gatewayEvents.find(event => event.edge === 'COMPLETE' && event.result && event.actual_result && canonicalJson(event.result) !== canonicalJson(event.actual_result));
        if (scenario.interval !== 'precommit') assert.ok(faultBoundary, 'the retained actual producer result differs from the delivered controlled fault');
        if (scenario.leaf === '004-L11') {
          assert.equal(faultBoundary.gateway, 'git'); assert.equal(faultBoundary.method, 'readStaged');
          assert.equal(faultBoundary.actual_result.kind, 'OK', 'the healthy post-commit producer result is retained before the controlled delivery fault');
          const { index_tree: actualIndexTree, ...actualValue } = faultBoundary.actual_result.value;
          const { index_tree: deliveredIndexTree, ...deliveredValue } = faultBoundary.result.value;
          assert.deepEqual(deliveredValue, actualValue, 'the controlled L11 delivery changes only index_tree');
          assert.notEqual(deliveredIndexTree, actualIndexTree);
          assert.equal(faultBoundary.actual_result.receipt_sha256, sha256(canonicalJson(faultBoundary.actual_result.value)));
          assert.equal(faultBoundary.result.receipt_sha256, sha256(canonicalJson(faultBoundary.result.value)));
        }
        const commitTrees = observations.filter(observation => observation.executable === GIT && observation.cwd === coreWorktree && observation.argv[0] === 'commit-tree');
        if (scenario.interval === 'precommit') assert.equal(commitTrees.length, 0, 'pre-commit identity rejection creates no commit object');
        else assert.equal(commitTrees.length, 1, 'post-commit/readback faults retain one real explicit-tree commit attempt');
        assert.equal(observations.some(observation => observation.cwd === coreWorktree && ['commit', 'merge', 'checkout', 'reset'].includes(observation.argv[0])), false);
        assertNoCandidateOrLaterEffects(gatewayEvents, { allowCommit: true, allowCandidateEvent: ['event', 'state'].includes(scenario.interval), allowFinalStateWrite: scenario.interval === 'state' });
        if (!['event', 'state'].includes(scenario.interval)) {
          await assertDurableBlockedEvidence({ base, command, afterWorker, blockedSupportingState: regression, ledger, observedLedgerReadbacks, gatewayEvents, result, expectedReceipts: observedValidationActualResults, blockedEvidenceReceipts: [], reason: scenario.reason, action: 'MANUAL_CONTROLLER_STOP' });
        } else {
          assert.equal(result.outcome, 'BLOCKED'); assert.notEqual(result.state, 'BLOCKED', 'unconfirmed Ledger/State authority cannot claim durable BLOCKED');
          assert.equal(result.payload.next_action, 'MANUAL_CONTROLLER_STOP'); assert.equal(typeof result.payload.local_pause_id, 'string');
          const pauseWrite = gatewayEvents.find(event => event.gateway === 'state' && event.method === 'writeLocalPause' && event.edge === 'COMPLETE' && event.sequence > faultBoundary.sequence);
          const pauseRead = gatewayEvents.find(event => event.gateway === 'state' && event.method === 'readLocalPause' && event.edge === 'COMPLETE' && event.sequence > (pauseWrite?.sequence ?? Number.MAX_SAFE_INTEGER));
          assert.ok(pauseWrite && pauseRead && pauseWrite.sequence < pauseRead.sequence); assert.equal(await exists(localPausePath), true);
          const pauseBytes = await readFile(localPausePath, 'utf8'); assert.equal(pauseBytes, canonicalJson(JSON.parse(pauseBytes)));
          assert.equal(pauseWrite.result.value.sha256, sha256(pauseBytes)); assert.equal(pauseRead.result.value.sha256, sha256(pauseBytes));
          const remote = await readLocalLedger(ledger, command.change_id); const decoded = decodeRemoteLedger(remote);
          const candidateRecord = decoded.records.findLast(record => record.event_class === 'CANDIDATE_COMMITTED');
          assert.ok(candidateRecord, 'the actual Candidate record exists but only its corrupted delivery/readback is unconfirmed');
          assertExactLedgerReadback(observedLedgerReadbacks.find(entry => entry.event.event_id === candidateRecord.event_id), candidateRecord, decoded.bytes);
          const physical = await base.state.readState({ change_id: command.change_id });
          if (scenario.interval === 'event') assert.deepEqual(physical, stateBefore, 'Candidate record readback ambiguity prevents the physical FINAL_VALIDATION State write');
          else assert.equal(JSON.parse(physical.value.bytes).phase, 'FINAL_VALIDATION', 'the Test can observe the actual written bytes but the controlled Core readback did not establish their authority');
        }
      }, controls);
    });
  });
}

test('RED-M2-004 / TEST-M2-004 / 004-L14: fresh STAGE with unchanged parent and empty index re-proves the prefix and performs the first stage', async () => {
  await withObservedK1Prefix(async ({ command, core, regression, expectedSubject, expectedSnapshot, coreWorktree, gatewayEvents, observedStageRequests }) => {
    const empty = await production.createCandidateStageGateway({ gitExecutable: GIT }).readStaged({ canonical_root: command.repository.canonical_root, worktree_root: coreWorktree });
    assert.deepEqual(empty.staged_paths, []); assert.equal(empty.index_tree, (await runProcess(GIT, ['rev-parse', `${expectedSubject.head_sha}^{tree}`], { cwd: coreWorktree, env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' } })).stdout.trim());
    const runStart = gatewayEvents.length;
    const result = await core.run({ change_id: command.change_id, expected_state_version: regression.state_version, expected_state_hash: regression.state_hash });
    assert.equal(result.outcome, 'ADVANCED'); assert.equal(result.payload.to_phase, 'FINAL_VALIDATION');
    assert.deepEqual(observedStageRequests.map(entry => entry.method), ['stageExact', 'readStaged', 'readStaged']);
    assert.equal(observedStageRequests[0].request.expected_worktree_snapshot_sha256, expectedSnapshot.worktree_snapshot_sha256);
    const freshEvents = gatewayEvents.slice(runStart);
    const remoteRead = freshEvents.find(event => event.gateway === 'ledger' && event.method === 'readRemote' && event.edge === 'COMPLETE');
    const stageCalls = freshEvents.filter(event => event.gateway === 'git' && ['stageExact', 'readStaged'].includes(event.method) && ['START', 'COMPLETE'].includes(event.edge));
    const commitStart = freshEvents.find(event => event.gateway === 'git' && event.method === 'commitCandidate' && event.edge === 'START');
    const commitComplete = freshEvents.find(event => event.gateway === 'git' && event.method === 'commitCandidate' && event.edge === 'COMPLETE' && event.invocation === commitStart?.invocation);
    const candidatePrepare = freshEvents.find(event => event.gateway === 'ledger' && event.method === 'prepareAppend' && ledgerPrepareEvent(event.request)?.event_class === 'CANDIDATE_COMMITTED');
    assert.deepEqual(stageCalls.map(event => [event.edge, event.method]), [['START', 'stageExact'], ['COMPLETE', 'stageExact'], ['START', 'readStaged'], ['COMPLETE', 'readStaged'], ['START', 'readStaged'], ['COMPLETE', 'readStaged']], 'fresh STAGE performs one physical stage, then distinct pre- and post-commit independent staged reads');
    const [stageStart, stageComplete, precommitReadStart, precommitReadComplete, postcommitReadStart, postcommitReadComplete] = stageCalls;
    assert.equal(stageStart.invocation, stageComplete.invocation); assert.equal(precommitReadStart.invocation, precommitReadComplete.invocation); assert.equal(postcommitReadStart.invocation, postcommitReadComplete.invocation);
    assert.ok(remoteRead && candidatePrepare && remoteRead.sequence < stageStart.sequence && stageComplete.sequence < precommitReadStart.sequence && precommitReadComplete.sequence < commitStart?.sequence && commitComplete?.sequence < postcommitReadStart.sequence && postcommitReadStart.sequence < postcommitReadComplete.sequence && postcommitReadComplete.sequence < candidatePrepare.sequence, 'fresh STAGE re-reads the receipt prefix, then its invocation identities prove stageExact/readStaged before commit and an independent readStaged before Candidate publication');
    assert.equal(gatewayEvents.filter(event => event.gateway === 'git' && event.method === 'commitCandidate' && event.edge === 'START').length, 1);
  }, { stopAtStage: true });
});

test('RED-M2-004 / TEST-M2-004 / 004-L15: terminated real stage child plus fresh Core observes the surviving index and manual-stops without resume, restage, commit, or cleanup', async () => {
  await withObservedRealSpawns(async observations => {
    await withObservedK1Prefix(async ({ base, command, restartCore, afterWorker, regression, expectedSubject, expectedSnapshot, ledger, observedLedgerReadbacks, coreWorktree, gatewayEvents, observedValidationActualResults }) => {
      const stageRequest = { canonical_root: command.repository.canonical_root, subject: expectedSubject, expected_worktree_snapshot_sha256: expectedSnapshot.worktree_snapshot_sha256, paths: ['tracked.txt'] };
      const childScript = "const [moduleUrl,gitExecutable,encodedRequest]=process.argv.slice(1);const production=await import(moduleUrl);if(typeof production.createCandidateStageGateway!=='function')throw new Error('missing createCandidateStageGateway');const result=await production.createCandidateStageGateway({gitExecutable}).stageExact(JSON.parse(encodedRequest));process.stdout.write(JSON.stringify(result));";
      const stageChildResult = await runProcess(NODE, ['--input-type=module', '-e', childScript, new URL('./production.mjs', import.meta.url).href, GIT, JSON.stringify(stageRequest)], { cwd: coreWorktree, env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' } });
      assert.equal(stageChildResult.code, 0, stageChildResult.stderr); assert.equal(stageChildResult.signal, null); assert.equal(stageChildResult.stderr, '');
      const stagedReceipt = JSON.parse(stageChildResult.stdout);
      assert.deepEqual(Object.keys(stagedReceipt).sort(), ['index_tree', 'staged_paths', 'staged_paths_sha256']);
      assert.deepEqual(stagedReceipt.staged_paths, ['tracked.txt']);
      const stageChild = observations.find(observation => observation.executable === NODE && observation.argv[0] === '--input-type=module' && observation.argv.includes(childScript));
      assert.ok(stageChild && Number.isSafeInteger(stageChild.pid) && stageChild.pid > 0, 'physical stage ran under an independent real Node child identity');
      assert.deepEqual(stageChild.close, { code: 0, signal: null }, 'the independent stage child completed and closed before Core reconstruction');
      assert.throws(() => process.kill(stageChild.pid, 0), error => error?.code === 'ESRCH', 'the physical-stage child identity is no longer live');
      const staged = await runProcess(GIT, ['diff', '--cached', '--name-status', '-z', '--no-renames', expectedSubject.head_sha, '--'], { cwd: coreWorktree, env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' } });
      assert.notEqual(staged.stdout, '', 'the Test-owned real physical stage survives into the fresh Core construction');
      const beforeRestart = gatewayEvents.length; const spawnBeforeRestart = observations.length;
      const restarted = restartCore(); const result = await restarted.run({ change_id: command.change_id, expected_state_version: regression.state_version, expected_state_hash: regression.state_hash });
      await assertDurableBlockedEvidence({ base, command, afterWorker, blockedSupportingState: regression, ledger, observedLedgerReadbacks, gatewayEvents, result, expectedReceipts: observedValidationActualResults, blockedEvidenceReceipts: [], reason: 'CANDIDATE_COMMIT_AMBIGUOUS', action: 'MANUAL_CONTROLLER_STOP' });
      const restartEvents = gatewayEvents.slice(beforeRestart);
      assert.equal(restartEvents.some(event => event.gateway === 'git' && ['stageExact', 'commitCandidate'].includes(event.method)), false);
      assert.equal(observations.slice(spawnBeforeRestart).some(observation => observation.cwd === coreWorktree && ['commit-tree', 'checkout', 'reset', 'clean'].includes(observation.argv[0])), false);
      assertNoCandidateOrLaterEffects(restartEvents);
    }, { stopAtStage: true });
  });
});

test('RED-M2-004 / TEST-M2-004 / 004-L15 full-Core-process termination: a fresh process sees persisted STAGE plus the surviving index and manual-stops without restage, commit, cleanup, or publication', async t => {
  await withObservedK1Prefix(async ({ base, command, regression, expectedSubject, coreWorktree, fixtureRoot, observedLedgerReadbacks }) => {
    const evidenceRoot = await mkdtemp(path.join(os.tmpdir(), 'juanerai-m2-004-l15-evidence-'));
    t.diagnostic(`004-L15 preservation directory: ${evidenceRoot}`);
    const outerEvents = [];
    const observeOuter = (event, detail = {}) => outerEvents.push({ observed_at: new Date().toISOString(), event, ...detail });
    const preservationFailures = [];
    const preserveBytes = async (name, value, unavailable = 'NOT_REACHED') => {
      if (value === null || value === undefined) return { status: unavailable };
      const bytes = Buffer.from(value);
      try { await writeFile(path.join(evidenceRoot, name), bytes); } catch (error) {
        preservationFailures.push({ name, operation: 'write', code: error?.code ?? null, message: error?.message ?? null });
        return { status: 'PRESERVATION_FAILED', operation: 'write', code: error?.code ?? null };
      }
      return { status: 'PRESERVED', byte_length: bytes.length, sha256: sha256(bytes) };
    };
    const copyFixtureBytes = async (name, source, unavailable = 'NOT_REACHED') => {
      let value;
      try { value = await readFile(source); } catch (error) {
        if (error?.code === 'ENOENT') return { status: unavailable === 'NOT_REACHED' ? 'NOT_REACHED' : 'MISSING' };
        preservationFailures.push({ name, operation: 'read', code: error?.code ?? null, message: error?.message ?? null });
        return { status: 'PRESERVATION_FAILED', operation: 'read', code: error?.code ?? null };
      }
      return preserveBytes(name, value);
    };
    const inspectEvidenceBytes = async (name, source, unavailable = 'NOT_REACHED') => {
      try {
        const value = await readFile(source);
        return { status: 'PRESERVED', byte_length: value.length, sha256: sha256(value) };
      } catch (error) {
        if (error?.code === 'ENOENT') return { status: unavailable === 'NOT_REACHED' ? 'NOT_REACHED' : 'MISSING' };
        preservationFailures.push({ name, operation: 'read', code: error?.code ?? null, message: error?.message ?? null });
        return { status: 'PRESERVATION_FAILED', operation: 'read', code: error?.code ?? null };
      }
    };
    const stateRoot = path.join(fixtureRoot, 'core-state');
    const markerPath = path.join(fixtureRoot, '004-l15-full-core-stage-close.json');
    const spawnAuditPath = path.join(fixtureRoot, '004-l15-full-core-spawns.jsonl');
    const observationPath = path.join(evidenceRoot, 'core-observation.jsonl');
    const ledgerSnapshotPath = path.join(evidenceRoot, 'ledger-readRemote.json');
    const program = fullCoreRestartProgram();
    const common = {
      repositoryRoot: command.repository.canonical_root,
      stateRoot,
      fixtureRoot,
      changeId: command.change_id,
    };
    const childStdoutChunks = [];
    const childStderrChunks = [];
    let coreChild = null;
    let coreClose = null;
    let close;
    let before = null;
    let primaryFailure = null;
    let cleanupFailure = null;
    try {
    before = await base.state.readState({ change_id: command.change_id });
    assert.equal(before.kind, 'OK');
    assert.equal(before.value.sha256, regression.state_hash);
    assert.equal(before.value.bytes, canonicalJson(JSON.parse(before.value.bytes)));
    assert.equal(JSON.parse(before.value.bytes).macro_state, 'DELIVERING');
    assert.equal(JSON.parse(before.value.bytes).phase, 'STAGE', 'the Core process receives the real persisted STAGE state produced by the public prefix');

    observeOuter('CORE_CHILD_SPAWN_ENTER');
    coreChild = childProcess.spawn(NODE, ['--input-type=module', '-e', program, encodeCoreRestartConfig({ ...common, mode: 'stage-and-pause', markerPath, spawnAuditPath, observationPath, ledgerSnapshotPath, processRunId: 'm2-004-l15-full-core-stage', useFileLocalPause: true })], {
      cwd: coreWorktree,
      env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' },
      shell: false,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    observeOuter('CORE_CHILD_SPAWN_RETURN', { pid: coreChild.pid ?? null });
    coreChild.stdout.on('data', value => { childStdoutChunks.push(Buffer.from(value)); });
    coreChild.stderr.on('data', value => { childStderrChunks.push(Buffer.from(value)); });
    coreClose = new Promise(resolve => {
      coreChild.once('error', error => { observeOuter('CORE_CHILD_ERROR', { pid: coreChild.pid ?? null, code: error?.code ?? null, message: error?.message ?? null }); resolve({ error }); });
      coreChild.once('exit', (code, signal) => observeOuter('CORE_CHILD_EXIT', { pid: coreChild.pid ?? null, code, signal }));
      coreChild.once('close', (code, signal) => { observeOuter('CORE_CHILD_CLOSE', { pid: coreChild.pid ?? null, code, signal }); resolve({ close: { code, signal } }); });
    });
    assert.ok(Number.isSafeInteger(coreChild.pid) && coreChild.pid > 0, 'one real Node process owns the public Core invocation');
      observeOuter('WAIT_FOR_MARKER_ENTER', { marker_path: markerPath });
      try { await waitForTestFile(markerPath); observeOuter('WAIT_FOR_MARKER_RETURN', { marker_path: markerPath }); } catch (error) { observeOuter('WAIT_FOR_MARKER_THROW', { marker_path: markerPath, message: error?.message ?? null }); throw error; }
      const markerBytes = await readFile(markerPath, 'utf8');
      const marker = JSON.parse(markerBytes);
      assert.equal(markerBytes, canonicalJson(marker));
      assert.equal(marker.core_pid, coreChild.pid);
      assert.ok(Number.isSafeInteger(marker.stage_child_pid) && marker.stage_child_pid > 0);
      assert.deepEqual(marker.stage_close, { code: 0, signal: null }, 'the real physical-stage Git child closed successfully before Core termination');
      assert.throws(() => process.kill(marker.stage_child_pid, 0), error => error?.code === 'ESRCH', 'the physical-stage child is already closed rather than being killed with Core');
      observeOuter('CORE_CHILD_SIGTERM_ENTER', { pid: coreChild.pid });
      const killed = coreChild.kill('SIGTERM');
      observeOuter('CORE_CHILD_SIGTERM_RETURN', { pid: coreChild.pid, killed });
      assert.equal(killed, true, 'the Test terminates the exact Node process that owns the public Core invocation');
      const terminal = await coreClose;
      if (terminal.error) throw terminal.error;
      close = terminal.close;
    } catch (error) {
      primaryFailure = error;
      throw error;
    } finally {
      if (coreChild !== null && close === undefined) {
        try {
          observeOuter('CORE_CHILD_SIGTERM_CLEANUP_ENTER', { pid: coreChild.pid });
          const killed = coreChild.kill('SIGTERM');
          observeOuter('CORE_CHILD_SIGTERM_CLEANUP_RETURN', { pid: coreChild.pid, killed });
          const terminal = await coreClose;
          if (terminal.error) throw terminal.error;
          close = terminal.close;
        } catch (error) {
          observeOuter('CORE_CHILD_SIGTERM_CLEANUP_THROW', { pid: coreChild.pid, code: error?.code ?? null, message: error?.message ?? null });
          if (primaryFailure === null) cleanupFailure = error;
        }
      }
      const childStdout = Buffer.concat(childStdoutChunks);
      const childStderr = Buffer.concat(childStderrChunks);
      let finalState = null;
      try {
        const state = await base.state.readState({ change_id: command.change_id });
        finalState = state?.kind === 'OK' ? { readback: state, identity: { byte_length: Buffer.byteLength(state.value.bytes), sha256: state.value.sha256 } } : { readback: state, identity: { status: state?.kind ?? 'NOT_REACHED' } };
      } catch (error) {
        preservationFailures.push({ name: 'state', operation: 'read', code: error?.code ?? null, message: error?.message ?? null });
        finalState = { readback: null, identity: { status: 'PRESERVATION_FAILED', operation: 'read', code: error?.code ?? null } };
      }
      const preserved = {
        core_stdout: await preserveBytes('core-stdout.bin', childStdout),
        core_stderr: await preserveBytes('core-stderr.bin', childStderr),
        marker: await copyFixtureBytes('stage-marker.bin', markerPath, coreChild === null ? 'NOT_REACHED' : 'MISSING'),
        spawn_audit: await copyFixtureBytes('spawn-audit.bin', spawnAuditPath, coreChild === null ? 'NOT_REACHED' : 'MISSING'),
        inner_observation: await inspectEvidenceBytes('core-observation.jsonl', observationPath, coreChild === null ? 'NOT_REACHED' : 'MISSING'),
        ledger_read_remote: await inspectEvidenceBytes('ledger-readRemote.json', ledgerSnapshotPath, coreChild === null ? 'NOT_REACHED' : 'MISSING'),
        state_before: await preserveBytes('state-before.json', before?.kind === 'OK' ? before.value.bytes : null),
        state_final: await preserveBytes('state-final.json', finalState.readback?.kind === 'OK' ? finalState.readback.value.bytes : null),
      };
      try {
        await writeFile(path.join(evidenceRoot, 'preservation.json'), canonicalJson({
          schema_version: '1.0', test_id: '004-L15',
          primary_failure: primaryFailure === null ? null : { code: primaryFailure?.code ?? null, message: primaryFailure?.message ?? null },
          core: { pid: coreChild?.pid ?? null, close: close ?? null, stdout: preserved.core_stdout, stderr: preserved.core_stderr },
          marker: preserved.marker, spawn_audit: preserved.spawn_audit, inner_observation: preserved.inner_observation,
          state: { before: preserved.state_before, final: preserved.state_final, final_readback: finalState.identity },
          fresh_core_ledger: preserved.ledger_read_remote,
          prior_ledger_readback_identities: observedLedgerReadbacks.map(entry => ({ tip: entry.result?.value?.tip ?? null, tree_sha: entry.result?.value?.tree_sha ?? null, event_id: entry.result?.value?.event_id ?? null, event_hash: entry.result?.value?.event_hash ?? null, sequence: entry.result?.value?.sequence ?? null })),
          outer_events: outerEvents, preservation_failures: preservationFailures,
        }));
      } catch (error) {
        preservationFailures.push({ name: 'preservation.json', operation: 'write', code: error?.code ?? null, message: error?.message ?? null });
      }
      if (preservationFailures.length) t.diagnostic(`004-L15 preservation failures: ${canonicalJson(preservationFailures)}`);
      if (primaryFailure === null && cleanupFailure !== null) throw cleanupFailure;
    }
    const childStdout = Buffer.concat(childStdoutChunks);
    const childStderr = Buffer.concat(childStderrChunks);
    assert.deepEqual(close, { code: null, signal: 'SIGTERM' });
    assert.equal(childStdout.toString('utf8'), '', 'the terminated Core process returned no application result');
    assert.equal(childStderr.toString('utf8'), '');
    assert.throws(() => process.kill(coreChild.pid, 0), error => error?.code === 'ESRCH', 'the entire Core process identity is terminal before restart');
    const spawnAuditBytes = await readFile(spawnAuditPath, 'utf8');
    const spawnAudit = spawnAuditBytes.trim().split('\n').map(line => JSON.parse(line));
    assert.equal(spawnAuditBytes, `${spawnAudit.map(entry => canonicalJson(entry)).join('\n')}\n`, 'the terminated Core process leaves complete canonical spawn observations');
    const physicalStages = spawnAudit.filter(entry => entry.executable === GIT && entry.argv.includes('--pathspec-file-nul'));
    assert.equal(physicalStages.length, 1, 'the terminated Core process completed exactly one physical stage child');
    assert.equal(physicalStages[0].pid, JSON.parse(await readFile(markerPath, 'utf8')).stage_child_pid);
    assert.equal(spawnAudit.some(entry => entry.executable === GIT && ['commit-tree', 'update-ref'].includes(entry.argv[0])), false, 'actual spawn observations prove termination occurred before commit-tree or ref CAS');

    const afterTermination = await base.state.readState({ change_id: command.change_id });
    assert.deepEqual(afterTermination, before, 'termination before commit-tree leaves the same persisted STAGE bytes and hash');
    const stagedBeforeRestart = await runProcess(GIT, ['diff', '--cached', '--name-status', '-z', '--no-renames', expectedSubject.head_sha, '--'], { cwd: coreWorktree, env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' } });
    const headBeforeRestart = await runProcess(GIT, ['rev-parse', 'HEAD'], { cwd: coreWorktree, env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' } });
    assert.equal(stagedBeforeRestart.code, 0, stagedBeforeRestart.stderr);
    assert.equal(stagedBeforeRestart.stdout, 'M\0tracked.txt\0', 'the real physical stage survives the complete Core-process termination');
    assert.equal(headBeforeRestart.stdout.trim(), expectedSubject.head_sha, 'termination occurred before commit-tree/ref movement');

    const recovery = await runProcess(NODE, ['--input-type=module', '-e', program, encodeCoreRestartConfig({ ...common, mode: 'recover', processRunId: 'm2-004-l15-full-core-recovery', useFileLocalPause: true })], {
      cwd: coreWorktree,
      env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' },
    });
    assert.equal(recovery.code, 0, recovery.stderr);
    assert.equal(recovery.signal, null);
    assert.equal(recovery.stderr, '');
    const recovered = JSON.parse(recovery.stdout);
    assert.equal(recovery.stdout, canonicalJson(recovered));
    assert.equal(recovered.result.outcome, 'BLOCKED');
    assert.equal(recovered.result.state, 'BLOCKED');
    assert.equal(recovered.result.payload.blocked_reason, 'CANDIDATE_COMMIT_AMBIGUOUS');
    assert.equal(recovered.result.payload.next_action, 'MANUAL_CONTROLLER_STOP');
    assert.equal(recovered.calls.some(call => call.boundary === 'git' && ['stageExact', 'readStaged', 'commitCandidate'].includes(call.method)), false, 'fresh Core does not resume stage or commit from a surviving index');
    assert.equal(recovered.calls.some(call => call.boundary === 'git' && ['pushBranch', 'readRemoteBranch', 'canonicalDiff'].includes(call.method)), false, 'fresh Core performs no publication Git operation');
    assert.equal(recovered.calls.some(call => call.boundary === 'pull_request' || call.boundary === 'handoff'), false, 'fresh Core performs no PR or Handoff operation');

    const afterRecovery = await base.state.readState({ change_id: command.change_id });
    assert.equal(afterRecovery.kind, 'OK');
    const recoveredState = JSON.parse(afterRecovery.value.bytes);
    assert.equal(afterRecovery.value.bytes, canonicalJson(recoveredState));
    assert.equal(recoveredState.macro_state, 'BLOCKED');
    assert.equal(recoveredState.phase, null);
    assert.equal(recoveredState.blocked_reason, 'CANDIDATE_COMMIT_AMBIGUOUS');
    const resumedLedger = await createLocalBareLedger(fixtureRoot, command.change_id, [], { resume: true });
    const remote = decodeRemoteLedger(await readLocalLedger(resumedLedger, command.change_id));
    assert.equal(remote.records.filter(record => record.event_class === 'CANDIDATE_COMMITTED').length, 0, 'no Candidate event was published across termination/restart');
    const blocked = remote.records.filter(record => record.event_class === 'BLOCKED' && record.detail?.blocked_reason === 'CANDIDATE_COMMIT_AMBIGUOUS');
    assert.equal(blocked.length, 1, 'the fresh Core remotely proves exactly one Candidate ambiguity stop');
    assert.equal(recovered.result.payload.blocked_event_id, blocked[0].event_id);
    const stagedAfterRestart = await runProcess(GIT, ['diff', '--cached', '--name-status', '-z', '--no-renames', expectedSubject.head_sha, '--'], { cwd: coreWorktree, env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' } });
    const headAfterRestart = await runProcess(GIT, ['rev-parse', 'HEAD'], { cwd: coreWorktree, env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' } });
    assert.equal(stagedAfterRestart.stdout, stagedBeforeRestart.stdout, 'fresh Core performs no reset, clean, or index cleanup');
    assert.equal(headAfterRestart.stdout, headBeforeRestart.stdout, 'fresh Core performs no commit or ref movement');
  }, { stopAtStage: true });
});

test('RED-M2-004 / TEST-M2-004 / 004-L16: one uninterrupted Candidate boundary retries once after a real pre-CAS ref-lock failure while the branch remains at expected_parent', async () => {
  let armed = false; let targetWorktree = null; let lockPath = null; let firstUpdateSeen = false; let closeFault = null; let headAtFailedCas = null;
  await withObservedRealSpawns(async observations => {
    await withObservedK1Prefix(async ({ base, command, core, regression, expectedSubject, coreWorktree, gatewayEvents }) => {
      targetWorktree = coreWorktree;
      lockPath = path.join(expectedSubject.common_git_dir, 'refs', 'heads', `${expectedSubject.branch}.lock`);
      writeFileSync(lockPath, 'test-owned pre-CAS lock\n', { flag: 'wx' });
      armed = true;
      let result;
      try {
        result = await core.run({ change_id: command.change_id, expected_state_version: regression.state_version, expected_state_hash: regression.state_hash });
      } finally {
        armed = false;
        if (await exists(lockPath)) unlinkSync(lockPath);
      }
      if (closeFault) throw closeFault;
      assert.equal(firstUpdateSeen, true, 'the Test-owned lock hit the first real update-ref child');
      assert.equal(headAtFailedCas, expectedSubject.head_sha, 'the failed first CAS leaves the branch at the unchanged predecessor');
      assert.equal(result.outcome, 'ADVANCED'); assert.equal(result.payload.to_phase, 'FINAL_VALIDATION');
      const commits = observations.filter(observation => observation.cwd === coreWorktree && observation.argv[0] === 'commit-tree');
      const updates = observations.filter(observation => observation.cwd === coreWorktree && observation.argv[0] === 'update-ref');
      assert.equal(commits.length, 1, 'the same Candidate object is reused after the pre-CAS failure');
      assert.equal(updates.length, 2, 'the same uninterrupted Candidate boundary makes one failed and one successful ref CAS');
      assert.deepEqual(updates.map(observation => observation.argv[3]), [expectedSubject.head_sha, expectedSubject.head_sha], 'every legal update-ref CAS uses expected_parent; zero-old creation is forbidden');
      assert.notEqual(updates[0].close?.code, 0); assert.equal(updates[0].close?.signal, null);
      assert.deepEqual(updates[1].close, { code: 0, signal: null });
      assert.equal(gatewayEvents.filter(event => event.gateway === 'git' && event.method === 'commitCandidate' && event.edge === 'START').length, 1, 'retry remains inside one public commitCandidate boundary');
      assert.equal(JSON.parse((await base.state.readState({ change_id: command.change_id })).value.bytes).phase, 'FINAL_VALIDATION');
      assert.equal(await exists(lockPath), false, 'the exact Test-owned ref lock is removed after the failed child closes');
    }, { stopAtStage: true });
  }, {
    onChild(observation, child) {
      if (!armed || firstUpdateSeen || observation.cwd !== targetWorktree || observation.executable !== GIT || observation.argv[0] !== 'update-ref' || observation.argv.length !== 4) return;
      firstUpdateSeen = true;
      child.once('close', (code, signal) => {
        try {
          const readback = childProcess.spawnSync(GIT, ['rev-parse', 'HEAD'], { cwd: targetWorktree, env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' }, shell: false, encoding: 'utf8' });
          if (readback.status !== 0) throw new Error(readback.stderr || 'failed to read Head after failed CAS');
          headAtFailedCas = readback.stdout.trim();
          if (code === 0 || signal !== null) throw new Error(`first locked update-ref closed unexpectedly: code=${code} signal=${signal}`);
          unlinkSync(lockPath);
        } catch (error) {
          closeFault = error;
        }
      });
    },
  });
});

test('RED-M2-004 / TEST-M2-004 / 004-L16: same uninterrupted run converges after one post-ref Candidate response loss without a second commit or ref move', async () => {
  let responseLost = false;
  await withObservedRealSpawns(async observations => {
    await withObservedK1Prefix(async ({ base, command, core, regression, coreWorktree, faultHits, gatewayEvents }) => {
      const result = await core.run({ change_id: command.change_id, expected_state_version: regression.state_version, expected_state_hash: regression.state_hash });
      assert.equal(result.outcome, 'ADVANCED'); assert.equal(result.payload.to_phase, 'FINAL_VALIDATION'); assert.deepEqual(faultHits, ['git:004-L16']);
      assert.equal(observations.filter(observation => observation.cwd === coreWorktree && observation.argv[0] === 'commit-tree').length, 1);
      assert.equal(observations.filter(observation => observation.cwd === coreWorktree && observation.argv[0] === 'update-ref').length, 1);
      assert.equal(gatewayEvents.filter(event => event.gateway === 'git' && event.method === 'commitCandidate' && event.edge === 'START').length, 2, 'the same public run retries only the accepted exact Candidate boundary');
      assert.equal(JSON.parse((await base.state.readState({ change_id: command.change_id })).value.bytes).phase, 'FINAL_VALIDATION');
    }, {
      stopAtStage: true,
      transformGitResult: async ({ method, actualResult, faultHits }) => {
        if (method !== 'commitCandidate' || actualResult?.kind !== 'OK' || responseLost) return actualResult;
        responseLost = true; faultHits.push('git:004-L16');
        return ambiguous(null);
      },
    });
  });
});

test('RED-M2-004 / TEST-M2-004 / 004-L17: restart with a moved Head manual-stops even when the real commit is internally self-consistent', async () => {
  await withObservedK1Prefix(async ({ base, command, restartCore, afterWorker, regression, expectedSubject, ledger, observedLedgerReadbacks, coreWorktree, gatewayEvents, observedValidationActualResults }) => {
    await writeFile(path.join(coreWorktree, 'tracked.txt'), 'self-consistent but not Regression-validated\n');
    const add = await runProcess(GIT, ['add', '--', 'tracked.txt'], { cwd: coreWorktree, env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' } }); assert.equal(add.code, 0, add.stderr);
    const differentTree = (await runProcess(GIT, ['write-tree'], { cwd: coreWorktree, env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' } })).stdout.trim();
    const idempotency_id = `candidate-${sha256(canonicalJson({ schema_version: '1.0', change_id: command.change_id, authorization_cycle_command_id: command.command_id, expected_parent: expectedSubject.head_sha, expected_tree: differentTree }))}`;
    const message_bytes = new TextEncoder().encode(`JuanerAI Candidate\n\nJuanerAI-Idempotency-ID: ${idempotency_id}\n`);
    const moved = await base.git.commitCandidate({ canonical_root: command.repository.canonical_root, worktree_root: coreWorktree, expected_parent: expectedSubject.head_sha, expected_tree: differentTree, message_bytes, idempotency_id });
    assert.deepEqual(Object.keys(moved).sort(), ['kind', 'receipt_sha256', 'value']); assert.equal(moved.kind, 'OK'); assert.equal(moved.receipt_sha256, sha256(canonicalJson(moved.value)));
    assert.deepEqual(Object.keys(moved.value).sort(), ['branch', 'parent', 'sha', 'tree']);
    assert.equal((await runProcess(GIT, ['rev-parse', 'HEAD'], { cwd: coreWorktree, env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' } })).stdout.trim(), moved.value.sha);
    const movedBytes = await runProcess(GIT, ['show', `${moved.value.sha}:tracked.txt`], { cwd: coreWorktree, env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' } });
    assert.equal(movedBytes.stdout, 'self-consistent but not Regression-validated\n'); assert.notEqual(movedBytes.stdout, 'actual worker output\n');
    const beforeRestart = gatewayEvents.length; const restarted = restartCore();
    const result = await restarted.run({ change_id: command.change_id, expected_state_version: regression.state_version, expected_state_hash: regression.state_hash });
    await assertDurableBlockedEvidence({ base, command, afterWorker, blockedSupportingState: regression, ledger, observedLedgerReadbacks, gatewayEvents, result, expectedReceipts: observedValidationActualResults, blockedEvidenceReceipts: [], reason: 'CANDIDATE_COMMIT_AMBIGUOUS', action: 'MANUAL_CONTROLLER_STOP' });
    const restartEvents = gatewayEvents.slice(beforeRestart);
    assert.equal(restartEvents.some(event => event.gateway === 'git' && ['stageExact', 'commitCandidate'].includes(event.method)), false);
    assertNoCandidateOrLaterEffects(restartEvents);
  }, { stopAtStage: true });
});

test('RED-M2-004 / TEST-M2-004 / 004-L18: a pre-commit identity stop has zero Candidate publication and zero later delivery effect', async () => {
  await withObservedRealSpawns(async observations => {
    await withObservedK1Prefix(async ({ base, command, core, afterWorker, regression, ledger, observedLedgerReadbacks, coreWorktree, gatewayEvents, faultHits, observedValidationActualResults }) => {
      const result = await core.run({ change_id: command.change_id, expected_state_version: regression.state_version, expected_state_hash: regression.state_hash });
      assert.deepEqual(faultHits, ['git:004-L18']);
      assert.equal(observations.some(observation => observation.cwd === coreWorktree && ['commit-tree', 'update-ref', 'checkout', 'reset', 'clean'].includes(observation.argv[0])), false, 'the identity stop makes no commit/ref/cleanup effect');
      assertNoCandidateOrLaterEffects(gatewayEvents, { allowCommit: true });
      assert.equal(gatewayEvents.some(event => event.gateway === 'git' && ['pushBranch', 'readRemoteBranch'].includes(event.method)), false);
      assert.equal(gatewayEvents.some(event => event.gateway === 'pull_request' || event.gateway === 'handoff'), false);
      await assertDurableBlockedEvidence({ base, command, afterWorker, blockedSupportingState: regression, ledger, observedLedgerReadbacks, gatewayEvents, result, expectedReceipts: observedValidationActualResults, blockedEvidenceReceipts: [], reason: 'CANDIDATE_IDENTITY_CONFLICT', action: 'MANUAL_CONTROLLER_STOP' });
    }, {
      stopAtStage: true,
      transformGitRequest: async ({ method, request, faultHits }) => {
        if (method !== 'commitCandidate' || faultHits.length) return request;
        faultHits.push('git:004-L18'); return { ...request, expected_parent: 'e'.repeat(40) };
      },
    });
  });
});

test('RED-M2-004 / TEST-M2-005 / 005-L01: real Candidate identity is admitted by the public validation factory with the exact final definition', async () => {
  await withRepository(async fixture => {
    const gateway = production.createValidationGateway({ nodeExecutable: NODE });
    const subject = candidateSubject(fixture);
    const definition = {
      id: 'final-validation-candidate', validation_kind: 'FINAL_VALIDATION', validation_scope: 'CANDIDATE', subject: 'CANDIDATE',
      argv: [NODE, '-e', 'process.stdout.write("candidate-final\\n")'], cwd: fixture.worktree, environment: {}, timeout_ms: 10_000,
    };
    const preHead = await runProcess(GIT, ['rev-parse', 'HEAD'], { cwd: fixture.worktree, env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' } });
    const preTree = await runProcess(GIT, ['rev-parse', 'HEAD^{tree}'], { cwd: fixture.worktree, env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' } });
    const preStatus = await runProcess(GIT, ['status', '--porcelain=v1', '-z', '--untracked-files=all', '--ignored=matching', '--no-renames'], { cwd: fixture.worktree, env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' } });
    assert.equal(preHead.stdout.trim(), subject.candidate_sha); assert.equal(preTree.stdout.trim(), subject.candidate_tree); assert.equal(preStatus.stdout, '');
    const result = await gateway.execute({ definition, subject });
    assert.equal(result.kind, 'OK');
    const expected = expectedCandidateReceipt(subject, definition, { status: 'COMPLETED', verdict: 'PASS', failure_code: null }, 'candidate-final\n', '');
    assertExactWorktreeReceipt(result.value, expected);
    assert.equal(result.receipt_sha256, sha256(canonicalJson(expected)));
  });
});

test('RED-M2-004 / TEST-M2-005 / 005-L02..L06: legal Candidate requests retain the remaining fixed child tuples and exact 24-field receipts', async t => {
  const cases = [
    ['005-L02 nonzero child', NODE, fixture => ({ argv: [NODE, '-e', 'process.stdout.write("candidate-nonzero\\n");process.stderr.write("candidate-error\\n");process.exit(7)'], tuple: { status: 'COMPLETED', verdict: 'FAIL', failure_code: 'NONZERO_EXIT' }, stdout: 'candidate-nonzero\n', stderr: 'candidate-error\n' })],
    ['005-L03 actual start failure', fixture => path.join(fixture.root, 'missing-node'), (fixture, executable) => ({ argv: [executable, '-e', 'process.exit(0)'], tuple: { status: 'START_FAILED', verdict: null, failure_code: 'PROCESS_START_FAILED' }, stdout: '', stderr: '' })],
    ['005-L04 ordinary signal', NODE, fixture => ({ argv: [NODE, '-e', 'process.kill(process.pid,"SIGTERM")'], tuple: { status: 'INTERRUPTED', verdict: null, failure_code: 'SIGNAL_EXIT' }, stdout: '', stderr: '' })],
    ['005-L05 signed timeout', NODE, fixture => ({ argv: [NODE, '-e', 'setTimeout(() => {}, 1000)'], timeout_ms: 10, tuple: { status: 'INTERRUPTED', verdict: null, failure_code: 'TIMEOUT' }, stdout: '', stderr: '' })],
    ['005-L06 post-child Candidate mutation', NODE, fixture => ({ argv: [NODE, '-e', "require('node:fs').writeFileSync('tracked.txt','mutated after child\\n')"], tuple: { status: 'INTERRUPTED', verdict: null, failure_code: 'SUBJECT_MISMATCH' }, stdout: '', stderr: '' })],
  ];
  for (const [label, executableFor, build] of cases) await t.test(label, async () => {
    await withRepository(async fixture => {
      const executable = typeof executableFor === 'function' ? executableFor(fixture) : executableFor;
      const run = build(fixture, executable);
      const subject = candidateSubject(fixture);
      const definition = { id: 'final-validation-candidate', validation_kind: 'FINAL_VALIDATION', validation_scope: 'CANDIDATE', subject: 'CANDIDATE', argv: run.argv, cwd: fixture.worktree, environment: {}, timeout_ms: run.timeout_ms ?? 10_000 };
      const gateway = production.createValidationGateway({ nodeExecutable: executable });
      const result = await gateway.execute({ definition, subject });
      assert.equal(result.kind, 'OK');
      const expected = expectedCandidateReceipt(subject, definition, run.tuple, run.stdout, run.stderr);
      assertExactWorktreeReceipt(result.value, expected);
      assert.equal(result.receipt_sha256, sha256(canonicalJson(expected)));
    });
  });
});

test('RED-M2-004 / TEST-M2-005 / 005-L07: well-shaped Candidate pre-observation conflicts return a complete START_FAILED receipt without a child', async t => {
  const cases = [
    ['wrong committed tree', fixture => ({ ...candidateSubject(fixture), candidate_tree: fixture.baseline_sha })],
    ['wrong observed Candidate SHA', fixture => ({ ...candidateSubject(fixture), head_sha: fixture.baseline_sha, candidate_sha: fixture.baseline_sha, candidate_tree: fixture.baseline_sha })],
    ['wrong observed branch', fixture => ({ ...candidateSubject(fixture), branch: 'work/mac-mini/other' })],
    ['wrong observed repository root', fixture => ({ ...candidateSubject(fixture), repository_root: fixture.root })],
    ['wrong observed common Git directory', fixture => ({ ...candidateSubject(fixture), common_git_dir: fixture.root })],
    ['dirty Candidate worktree', async fixture => { await writeFile(path.join(fixture.worktree, 'tracked.txt'), 'dirty candidate\n'); return candidateSubject(fixture); }],
    ['staged Candidate worktree', async fixture => { await writeFile(path.join(fixture.worktree, 'tracked.txt'), 'staged candidate\n'); const staged = await runProcess(GIT, ['add', '--', 'tracked.txt'], { cwd: fixture.worktree, env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' } }); assert.equal(staged.code, 0, staged.stderr); return candidateSubject(fixture); }],
    ['escaped execution cwd', fixture => ({ subject: candidateSubject(fixture), definition: { ...finalDefinition(fixture), cwd: fixture.root } })],
  ];
  for (const [label, build] of cases) await t.test(label, async () => {
    await withRepository(async fixture => {
      const marker = path.join(fixture.root, 'candidate-pre-observation-child');
      const built = await build(fixture);
      const subject = built.subject ?? built;
      const definition = built.definition === undefined ? finalDefinition(fixture, marker) : { ...built.definition, argv: finalDefinition(fixture, marker).argv };
      const result = await production.createValidationGateway({ nodeExecutable: NODE }).execute({ definition, subject });
      assert.equal(result.kind, 'OK');
      const expected = expectedCandidateReceipt(subject, definition, { status: 'START_FAILED', verdict: null, failure_code: 'SUBJECT_MISMATCH' }, '', '', null);
      assertExactWorktreeReceipt(result.value, expected);
      assert.equal(result.receipt_sha256, sha256(canonicalJson(expected)), 'the returned envelope preserves the independently calculated outer receipt hash');
      assert.equal(await exists(marker), false, 'Candidate pre-observation mismatch starts no validation child');
    });
  });
});

const candidateUnionNegativeCases = [
  ['005-L08', 'Candidate subject with affected-suite Regression', fixture => ({ definition: { id: 'regression-affected-suite', validation_kind: 'REGRESSION', validation_scope: 'AFFECTED_SUITE', subject: 'WORKTREE' }, subject: candidateSubject(fixture) })],
  ['005-L09', 'Candidate subject with Test Asset Retirement Regression', fixture => ({ definition: { id: 'regression-test-asset-retirement', validation_kind: 'REGRESSION', validation_scope: 'TEST_ASSET_RETIREMENT', subject: 'WORKTREE' }, subject: candidateSubject(fixture) })],
  ['005-L10', 'WORKTREE subject with final Candidate definition', fixture => ({ definition: finalDefinition(fixture), subject: worktreeSubject(fixture) })],
  ['005-L11', 'Candidate subject whose head differs from candidate SHA', fixture => ({ definition: finalDefinition(fixture), subject: { ...candidateSubject(fixture), head_sha: fixture.baseline_sha } })],
  ['005-L12', 'Candidate subject with an enumerable extra field', fixture => ({ definition: finalDefinition(fixture), subject: { ...candidateSubject(fixture), extra: 'not-admitted' } })],
  ['005-L13', 'Candidate subject with an accessor field', fixture => { const subject = candidateSubject(fixture); Object.defineProperty(subject, 'candidate_tree', { enumerable: true, get() { throw new Error('ACCESSOR_CONSUMED'); } }); return { definition: finalDefinition(fixture), subject }; }],
  ['005-L14', 'WORKTREE subject carrying Candidate-only fields', fixture => ({ definition: { id: 'regression-affected-suite', validation_kind: 'REGRESSION', validation_scope: 'AFFECTED_SUITE', subject: 'WORKTREE' }, subject: { ...worktreeSubject(fixture), candidate_sha: fixture.candidate_sha, candidate_tree: fixture.candidate_tree } })],
  ['005-L15', 'Candidate subject missing candidate_tree', fixture => { const subject = candidateSubject(fixture); delete subject.candidate_tree; return { definition: finalDefinition(fixture), subject }; }],
  ['005-L16', 'Candidate subject with a symbol field', fixture => { const subject = candidateSubject(fixture); subject[Symbol('extra')] = 'not-admitted'; return { definition: finalDefinition(fixture), subject }; }],
  ['005-L17', 'Candidate subject missing required Worktree root', fixture => { const subject = candidateSubject(fixture); delete subject.worktree_root; return { definition: finalDefinition(fixture), subject }; }],
];

function worktreeSubject(fixture) {
  return { kind: 'WORKTREE', repository_root: fixture.repository, worktree_root: fixture.worktree, branch: 'work/mac-mini/m2-test', head_sha: fixture.candidate_sha, common_git_dir: fixture.common_git_dir, allowed_paths: ['tracked.txt'], forbidden_paths: [] };
}

function candidateSubject(fixture) {
  return { ...worktreeSubject(fixture), kind: 'CANDIDATE', candidate_sha: fixture.candidate_sha, candidate_tree: fixture.candidate_tree };
}

function finalDefinition(fixture, marker = null) {
  const argv = marker === null ? [NODE, '-e', 'process.stdout.write("candidate-final\\n")'] : [NODE, '-e', "require('node:fs').writeFileSync(process.argv[1], 'marker')", marker];
  return { id: 'final-validation-candidate', validation_kind: 'FINAL_VALIDATION', validation_scope: 'CANDIDATE', subject: 'CANDIDATE', argv, cwd: fixture.worktree, environment: {}, timeout_ms: 10_000 };
}

for (const [leaf, label, build] of candidateUnionNegativeCases) {
  test(`CONTROL-M2-004 / TEST-M2-005 / ${leaf}: direct Gateway rejects ${label} before a child (current rejection is not Candidate-branch attribution)`, async () => {
    await withRepository(async fixture => {
      const marker = path.join(fixture.root, `${leaf}-child-marker`);
      const request = build(fixture);
      request.definition = { ...request.definition, ...request.definition.id === 'final-validation-candidate' ? finalDefinition(fixture, marker) : { argv: [NODE, '-e', "require('node:fs').writeFileSync(process.argv[1], 'marker')", marker], cwd: fixture.worktree, environment: {}, timeout_ms: 10_000 } };
      const gateway = production.createValidationGateway({ nodeExecutable: NODE });
      await assert.rejects(gateway.execute(request), /INPUT_INVALID/);
      assert.equal(await exists(marker), false, 'invalid closed-union input must start no validation child');
    });
  });
}

test('RED-M2-006 / TEST-M2-009 / 009-L06: real production canonicalDiff returns raw-byte-derived changed paths', async () => {
  await withRepository(async fixture => {
    const adapters = createCoordinatorAdapters({ repository_root: fixture.repository, state_root: path.join(fixture.root, '.state'), device: 'mac-mini', process_run_id: 'm2-diff-control', git_executable: GIT, pull_request_executable: '/usr/bin/false', base_environment: {} });
    const result = await adapters.git.canonicalDiff({ canonical_root: fixture.repository, common_git_dir: fixture.common_git_dir, worktree_root: fixture.worktree, baseline_sha: fixture.baseline_sha, candidate_sha: fixture.candidate_sha });
    assert.equal(result.kind, 'OK');
    assert.ok(Buffer.isBuffer(result.value.raw_stdout));
    const rawArgs = ['--no-pager', '-c', 'color.ui=false', '-c', 'core.quotePath=true', '-c', 'diff.algorithm=myers', '-c', 'diff.mnemonicPrefix=false', '-c', 'diff.noprefix=false', 'diff', '--binary', '--full-index', '--no-ext-diff', '--no-textconv', '--no-renames', '--src-prefix=a/', '--dst-prefix=b/', `${fixture.baseline_sha}..${fixture.candidate_sha}`, '--'];
    const raw = await runProcess(GIT, rawArgs, { cwd: fixture.worktree, env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC', GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: '/dev/null', GIT_ATTR_NOSYSTEM: '1', GIT_PAGER: 'cat', PAGER: 'cat', GIT_TERMINAL_PROMPT: '0', GIT_NO_REPLACE_OBJECTS: '1' } });
    assert.equal(raw.code, 0, raw.stderr);
    assert.deepEqual(result.value.raw_stdout, Buffer.from(raw.stdout), 'the Adapter raw diff is independently equal to the frozen Git argv stdout bytes');
    assert.equal(result.value.byte_length, Buffer.byteLength(raw.stdout), 'the byte length is over independently observed raw stdout');
    assert.equal(result.value.stdout_sha256, sha256(Buffer.from(raw.stdout)), 'the raw-diff hash is over independently observed raw stdout');
    const nameStatus = await runProcess(GIT, ['diff', '--name-status', '-z', '--no-renames', `${fixture.baseline_sha}..${fixture.candidate_sha}`, '--'], { cwd: fixture.worktree, env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' } });
    assert.equal(nameStatus.code, 0, nameStatus.stderr);
    assert.deepEqual(parseNameStatusZ(nameStatus.stdout), [{ status: 'M', path: 'tracked.txt' }], 'the independent raw NUL stream has separate status/path fields');
    assert.deepEqual(result.value.changed_paths, ['tracked.txt']);
  });
});

test('RED-M2-006 / TEST-M2-009 / 009-L01: real Adapter retains the cumulative raw diff and independent NUL path observation separately from the Candidate increment', async () => {
  await withRepository(async fixture => {
    const adapters = createCoordinatorAdapters({ repository_root: fixture.repository, state_root: path.join(fixture.root, '.diff-cumulative-state'), device: 'mac-mini', process_run_id: 'm2-diff-cumulative-red', git_executable: GIT, pull_request_executable: '/usr/bin/false', base_environment: {} });
    await writeFile(path.join(fixture.worktree, 'incremental file.mjs'), 'incremental candidate byte\n');
    const added = await runProcess(GIT, ['add', '--', 'incremental file.mjs'], { cwd: fixture.worktree, env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' } });
    assert.equal(added.code, 0, added.stderr);
    const committed = await runProcess(GIT, ['commit', '-m', 'Test-only incremental Candidate'], { cwd: fixture.worktree, env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' } });
    assert.equal(committed.code, 0, committed.stderr);
    const finalHead = await runProcess(GIT, ['rev-parse', 'HEAD'], { cwd: fixture.worktree, env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' } });
    assert.equal(finalHead.code, 0, finalHead.stderr);
    const final_sha = finalHead.stdout.trim();
    const pathArgs = (from, to) => ['--no-pager', '-c', 'color.ui=false', '-c', 'core.quotePath=true', '-c', 'diff.algorithm=myers', '-c', 'diff.mnemonicPrefix=false', '-c', 'diff.noprefix=false', 'diff', '--name-status', '-z', '--no-ext-diff', '--no-textconv', '--no-renames', `${from}..${to}`, '--'];
    const cumulativePath = await runProcess(GIT, pathArgs(fixture.baseline_sha, final_sha), { cwd: fixture.worktree, env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' } });
    const incrementPath = await runProcess(GIT, pathArgs(fixture.candidate_sha, final_sha), { cwd: fixture.worktree, env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' } });
    assert.equal(cumulativePath.code, 0, cumulativePath.stderr); assert.equal(incrementPath.code, 0, incrementPath.stderr);
    assert.deepEqual(parseNameStatusZ(cumulativePath.stdout), [{ status: 'A', path: 'incremental file.mjs' }, { status: 'M', path: 'tracked.txt' }], 'the Test-owned raw NUL stream independently proves the cumulative status/path pairs and byte order');
    assert.deepEqual(parseNameStatusZ(incrementPath.stdout), [{ status: 'A', path: 'incremental file.mjs' }], 'the Candidate-parent increment is narrower and cannot substitute for cumulative delivery paths');
    const result = await adapters.git.canonicalDiff({ canonical_root: fixture.repository, common_git_dir: fixture.common_git_dir, worktree_root: fixture.worktree, baseline_sha: fixture.baseline_sha, candidate_sha: final_sha });
    assert.equal(result.kind, 'OK');
    assert.ok(Buffer.isBuffer(result.value.raw_stdout));
    const rawArgs = ['--no-pager', '-c', 'color.ui=false', '-c', 'core.quotePath=true', '-c', 'diff.algorithm=myers', '-c', 'diff.mnemonicPrefix=false', '-c', 'diff.noprefix=false', 'diff', '--binary', '--full-index', '--no-ext-diff', '--no-textconv', '--no-renames', '--src-prefix=a/', '--dst-prefix=b/', `${fixture.baseline_sha}..${final_sha}`, '--'];
    const raw = await runProcess(GIT, rawArgs, { cwd: fixture.worktree, env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC', GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: '/dev/null', GIT_ATTR_NOSYSTEM: '1', GIT_PAGER: 'cat', PAGER: 'cat', GIT_TERMINAL_PROMPT: '0', GIT_NO_REPLACE_OBJECTS: '1' } });
    assert.equal(raw.code, 0, raw.stderr);
    assert.deepEqual(result.value.raw_stdout, Buffer.from(raw.stdout), 'the Adapter raw diff is independently equal to the cumulative frozen Git argv stdout bytes');
    assert.equal(result.value.byte_length, Buffer.byteLength(raw.stdout), 'the cumulative raw byte length is independently exact');
    assert.equal(result.value.stdout_sha256, sha256(Buffer.from(raw.stdout)), 'the cumulative raw hash is independently exact');
    assert.deepEqual(result.value.changed_paths, ['incremental file.mjs', 'tracked.txt'], 'M2 Delivery requires the independently observed cumulative paths, not a producer default');
    assert.deepEqual(result.value.producer_receipt.path_argv, pathArgs(fixture.baseline_sha, final_sha), 'the Adapter owns the fixed path argv; callers do not supply it');
    assert.equal(result.value.producer_receipt.path_stdout_sha256, sha256(Buffer.from(cumulativePath.stdout)), 'the path receipt hashes the exact NUL stdout before parsing');
  });
});

test('CONTROL-M2-006 / TEST-M2-009 / 009-C01: independent real Git produces exact raw bytes and a separate valid NUL status/path stream for the same baseline and Candidate', async () => {
  await withRepository(async fixture => {
    await writeFile(path.join(fixture.worktree, 'second file.mjs'), 'second path\n'); await runProcess(GIT, ['add', '--', 'second file.mjs'], { cwd: fixture.worktree, env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' } }); await runProcess(GIT, ['commit', '-m', 'two-path Candidate'], { cwd: fixture.worktree, env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' } });
    const head = (await runProcess(GIT, ['rev-parse', 'HEAD'], { cwd: fixture.worktree, env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' } })).stdout.trim(); const tree = (await runProcess(GIT, ['rev-parse', `${head}^{tree}`], { cwd: fixture.worktree, env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' } })).stdout.trim();
    const range = `${fixture.baseline_sha}..${head}`;
    const rawArgv = ['--no-pager', '-c', 'color.ui=false', '-c', 'core.quotePath=true', '-c', 'diff.algorithm=myers', '-c', 'diff.mnemonicPrefix=false', '-c', 'diff.noprefix=false', 'diff', '--binary', '--full-index', '--no-ext-diff', '--no-textconv', '--no-renames', '--src-prefix=a/', '--dst-prefix=b/', range, '--'];
    const pathArgv = ['--no-pager', '-c', 'color.ui=false', '-c', 'core.quotePath=true', '-c', 'diff.algorithm=myers', '-c', 'diff.mnemonicPrefix=false', '-c', 'diff.noprefix=false', 'diff', '--name-status', '-z', '--no-ext-diff', '--no-textconv', '--no-renames', range, '--'];
    const environment = { LANG: 'C', LC_ALL: 'C', TZ: 'UTC', GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: '/dev/null', GIT_ATTR_NOSYSTEM: '1', GIT_PAGER: 'cat', PAGER: 'cat', GIT_TERMINAL_PROMPT: '0', GIT_NO_REPLACE_OBJECTS: '1' };
    const raw = await runProcess(GIT, rawArgv, { cwd: fixture.worktree, env: environment }); const names = await runProcess(GIT, pathArgv, { cwd: fixture.worktree, env: environment }); assert.equal(raw.code, 0); assert.equal(names.code, 0);
    const entries = parseNameStatusZ(names.stdout); assert.deepEqual(entries, [{ status: 'A', path: 'second file.mjs' }, { status: 'M', path: 'tracked.txt' }]);
    assert.ok(Buffer.byteLength(raw.stdout) > 0); assert.match(sha256(Buffer.from(raw.stdout)), /^[0-9a-f]{64}$/); assert.equal(sha256(Buffer.from(names.stdout)).length, 64); assert.match(head, /^[0-9a-f]{40}$/); assert.match(tree, /^[0-9a-f]{40}$/); assert.notEqual(tree, fixture.candidate_tree);
  });
});

async function canonicalPathProducerFixture009(fixture) {
  const path_argv = ['--no-pager', '-c', 'color.ui=false', '-c', 'core.quotePath=true', '-c', 'diff.algorithm=myers', '-c', 'diff.mnemonicPrefix=false', '-c', 'diff.noprefix=false', 'diff', '--name-status', '-z', '--no-ext-diff', '--no-textconv', '--no-renames', `${fixture.baseline_sha}..${fixture.candidate_sha}`, '--'];
  const environment = { LC_ALL: 'C', LANG: 'C', TZ: 'UTC', GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: '/dev/null', GIT_ATTR_NOSYSTEM: '1', GIT_PAGER: 'cat', PAGER: 'cat', GIT_TERMINAL_PROMPT: '0', GIT_NO_REPLACE_OBJECTS: '1' };
  const actual = await runProcess(GIT, path_argv, { cwd: fixture.worktree, env: environment });
  assert.equal(actual.code, 0, actual.stderr);
  assert.deepEqual(Buffer.from(actual.stdout), Buffer.from('M\0tracked.txt\0'), 'the retained real pinned-Git path producer is healthy before a controlled one-field stdout stimulus');
  const adapters = createCoordinatorAdapters({ repository_root: fixture.repository, state_root: path.join(fixture.root, '.009-state'), device: 'mac-mini', process_run_id: '009-controlled-path', git_executable: GIT, pull_request_executable: '/usr/bin/false', base_environment: {} });
  const request = { canonical_root: fixture.repository, common_git_dir: fixture.common_git_dir, worktree_root: fixture.worktree, baseline_sha: fixture.baseline_sha, candidate_sha: fixture.candidate_sha };
  return { actual_path_stdout: Buffer.from(actual.stdout), adapters, environment, path_argv, request };
}

test('CONTROL-M2-006 / TEST-M2-009 / 009-C02: the exact pinned-Git path producer emits one valid closed status/path stream independently of the Adapter parser', async () => {
  await withRepository(async fixture => {
    const healthy = await canonicalPathProducerFixture009(fixture);
    assert.equal(healthy.actual_path_stdout.toString('base64'), Buffer.from('M\0tracked.txt\0').toString('base64'));
    assert.equal(sha256(healthy.actual_path_stdout), sha256(Buffer.from('M\0tracked.txt\0')));
  });
});

test('CONTROL-M2-006 / TEST-M2-009 / 009-C03: the two-path Worker source has exact real raw-byte order and an independent snapshot identity', async () => {
  await withRepository(async fixture => {
    await writeFile(path.join(fixture.worktree, 'second.txt'), 'actual second worker output\n');
    await writeFile(path.join(fixture.worktree, 'tracked.txt'), 'actual worker output\n');
    const subject = await freshWorktreeSubject(fixture.repository, fixture.worktree, ['second.txt', 'tracked.txt'], []);
    const snapshot = await independentTrackedSnapshot(subject, ['second.txt', 'tracked.txt']);
    assert.match(snapshot.scope_sha256, /^[0-9a-f]{64}$/);
    assert.match(snapshot.raw_inventory_sha256, /^[0-9a-f]{64}$/);
    assert.match(snapshot.worktree_snapshot_sha256, /^[0-9a-f]{64}$/);
    const status = await runProcess(GIT, ['status', '--porcelain=v1', '-z', '--untracked-files=all', '--no-renames'], { cwd: fixture.worktree, env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' } });
    assert.equal(status.code, 0, status.stderr);
    assert.deepEqual(Buffer.from(status.stdout), Buffer.from(' M second.txt\0 M tracked.txt\0'), 'the healthy source contains the same two real paths whose returned order alone is reversed by 009-L06');
  }, { includeSecondBaseline: true });
});

test('CONTROL-M2-006 / TEST-M2-009 / 009-C04: real Git identity receipts bind the Candidate tree plus local and remote Heads', async () => {
  await withRepository(async fixture => {
    const remote = path.join(fixture.root, '009-identity-origin.git');
    const branch = 'work/mac-mini/m2-test';
    const git = async (cwd, ...args) => {
      const result = await runProcess(GIT, args, { cwd, env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' } });
      assert.equal(result.code, 0, result.stderr);
      return result.stdout.trim();
    };
    await git(fixture.root, 'init', '--bare', remote);
    await git(fixture.repository, 'remote', 'add', 'origin', remote);
    await git(fixture.repository, 'push', 'origin', `refs/heads/${branch}:refs/heads/${branch}`);
    const adapters = createCoordinatorAdapters({
      repository_root: fixture.repository,
      state_root: path.join(fixture.root, '.009-identity-state'),
      device: 'mac-mini',
      process_run_id: '009-identity-control',
      git_executable: GIT,
      pull_request_executable: '/usr/bin/false',
      base_environment: {},
    });
    const commit = await adapters.git.readCommit({ canonical_root: fixture.repository, sha: fixture.candidate_sha });
    assert.equal(commit.kind, 'OK');
    assert.equal(commit.value.tree, fixture.candidate_tree, 'readCommit.tree is the independently derived Candidate tree');
    const local = await adapters.git.inspectWorktree({
      worktree_root: fixture.worktree,
      expected_branch: branch,
      expected_head: fixture.candidate_sha,
    });
    assert.equal(local.kind, 'OK');
    assert.equal(local.value.head_sha, fixture.candidate_sha, 'inspectWorktree.head_sha is the Candidate commit');
    const remoteBranch = await adapters.git.readRemoteBranch({ canonical_root: fixture.repository, origin: 'origin', branch });
    assert.equal(remoteBranch.kind, 'OK');
    assert.equal(local.value.branch, branch, 'inspectWorktree retains the independently fixed branch alongside Candidate Head');
    assert.deepEqual(Object.keys(remoteBranch.value).sort(), ['remote_head']);
    assert.equal(remoteBranch.value.remote_head, fixture.candidate_sha, 'readRemoteBranch.remote_head is the pushed Candidate commit');
  });
});

for (const scenario of [
  { leaf: '009-L06 unsupported producer status', bytes: Buffer.from('X\0tracked.txt\0') },
  { leaf: '009-L06 multibyte producer status', bytes: Buffer.from('MM\0tracked.txt\0') },
  { leaf: '009-L06 empty producer status', bytes: Buffer.from('\0tracked.txt\0') },
  { leaf: '009-L06 missing producer path', bytes: Buffer.from('M\0\0') },
  { leaf: '009-L06 odd NUL framing', bytes: Buffer.from('M\0tracked.txt\0A\0') },
  { leaf: '009-L06 invalid UTF-8 producer path', bytes: Buffer.concat([Buffer.from('M\0invalid-'), Buffer.from([0xff]), Buffer.from('.txt\0')]) },
]) test(`RED-M2-006 / TEST-M2-009 / ${scenario.leaf}: controlled path stdout rejects before a CanonicalDiffV2 receipt`, async t => {
  await withRepository(async fixture => {
    const healthy = await canonicalPathProducerFixture009(fixture);
    assert.notDeepEqual(scenario.bytes, healthy.actual_path_stdout, 'only the controlled path stdout differs from the independently captured real command output');
    let result = null; let failure = null;
    await withControlledCanonicalPathOutput(scenario.bytes, async pathInvocationCount => {
      try { result = await healthy.adapters.git.canonicalDiff(healthy.request); } catch (error) { failure = error; }
      assert.equal(pathInvocationCount(), 1, 'the controlled stdout is consumed only by the exact one path command');
      assert.equal(result, null, 'invalid producer status/path bytes cannot yield a CanonicalDiffV2 result');
      assert.match(String(failure), /COORDINATOR_(?:INPUT_INVALID|INTERRUPTED)/);
    });
  });
});

test('CONTROL-M2-004 / TEST-M2-007 / 007-C01: independent derived evidence bytes, canonical padded base64, and fixed Test-input framing remain sensitive to both authorities', () => {
  const base = Buffer.from('signed Test input bytes remain immutable\n', 'utf8');
  const derived = {
    schema_version: '1.0', kind: 'REPAIR_TEST_DERIVED_EVIDENCE', change_id: 'CHG-derived-oracle', candidate_sha: 'c'.repeat(40), candidate_tree: 'd'.repeat(40),
    authorization_cycle_command_id: 'command-derived-001', source_execution_attempt: 0, repair_execution_attempt: 1,
    scope_sha256: 'e'.repeat(64), validator_artifact_sha256: 'f'.repeat(64), validator_receipt_sha256: 'a'.repeat(64),
    validator_agent_result_event_ref: { remote_ref: 'refs/heads/evidence/agent-runs', tip: '1'.repeat(40), tip_tree: '2'.repeat(40), authoritative_path: 'ledger/CHG-derived-oracle.jsonl', event_id: 'event-result-001', event_hash: '3'.repeat(64), sequence: 17, record_offset: 0, record_length: 101, record_bytes_sha256: '4'.repeat(64) },
    validator_receipt_event_ref: { remote_ref: 'refs/heads/evidence/agent-runs', tip: '1'.repeat(40), tip_tree: '2'.repeat(40), authoritative_path: 'ledger/CHG-derived-oracle.jsonl', event_id: 'event-receipt-001', event_hash: '5'.repeat(64), sequence: 18, record_offset: 101, record_length: 102, record_bytes_sha256: '6'.repeat(64) },
    findings: [{ finding_id: 'finding-001', classification: 'IMPLEMENTATION_IN_SCOPE', requirement_ids: ['REQ-M2-004'], acceptance_ids: ['AC-M2-004-03'], paths: ['tools/harness/change-coordinator/coordinator.mjs'], summary: 'exact Test oracle finding', evidence_refs: [{ kind: 'TEST', id: '007-C01', sha256: '7'.repeat(64), subject_sha: 'c'.repeat(40) }] }],
  };
  const bytes = Buffer.from(canonicalJson(derived));
  const digest = sha256(bytes);
  const encoded = bytes.toString('base64');
  assert.deepEqual(Buffer.from(encoded, 'base64'), bytes, 'the derived bytes use canonical padded base64 round-trip');
  assert.equal(Buffer.from(encoded, 'base64').toString('base64'), encoded, 'base64 has no alternate representation');
  const header = Buffer.from(`\n\n--- JUANERAI_REPAIR_TEST_EVIDENCE_V1 ${bytes.length} ${digest} ---\n`, 'utf8');
  const effective = Buffer.concat([base, header, bytes]);
  assert.deepEqual(effective, Buffer.concat([base, Buffer.from('\n\n--- JUANERAI_REPAIR_TEST_EVIDENCE_V1 ', 'utf8'), Buffer.from(String(bytes.length)), Buffer.from(' ', 'utf8'), Buffer.from(digest), Buffer.from(' ---\n', 'utf8'), bytes]), 'the only legal Test oracle framing is B || H || D with decimal byte length and D hash');
  const changedBase = Buffer.from('signed Test input bytes changed\n', 'utf8');
  assert.notDeepEqual(Buffer.concat([changedBase, header, bytes]), effective, 'changing immutable signed base bytes changes effective stdin without changing D');
  const changedDerived = Buffer.from(canonicalJson({ ...derived, scope_sha256: '9'.repeat(64) }));
  assert.notEqual(sha256(changedDerived), digest, 'a derived source mutation cannot retain the original D hash');
});

function fixedTipLedgerRef(readback, remote) {
  const value = readback.result.value;
  return {
    remote_ref: remote.value.remote_ref, tip: remote.value.tip, tip_tree: remote.value.tip_tree,
    authoritative_path: remote.value.authoritative_path, event_id: value.event_id, event_hash: value.event_hash,
    sequence: value.sequence, record_offset: value.record_offset, record_length: value.record_length,
    record_bytes_sha256: value.record_bytes_sha256,
  };
}

test('RED-M2-005 / TEST-M2-006 / 006-L13..L14: ordinary Core accepts only a complete Validator PASS pair before refs and the first branch push', async () => {
  await withObservedK1Prefix(async ({ base, command, core, candidateTransition, candidateEvent, ledger, ordinaryRoleResultRoot, observedLedgerReadbacks, gatewayEvents }) => {
    const candidateValidation = await core.run({ change_id: command.change_id, expected_state_version: candidateTransition.state_version, expected_state_hash: candidateTransition.state_hash });
    assert.equal(candidateValidation.outcome, 'ADVANCED'); assert.equal(candidateValidation.payload.to_phase, 'VALIDATOR');
    const validatorAction = await core.run({ change_id: command.change_id, expected_state_version: candidateValidation.state_version, expected_state_hash: candidateValidation.state_hash });
    assert.equal(validatorAction.outcome, 'AGENT_ACTION');
    const action = validatorAction.payload.action; const { action_kind, ...binding } = action;
    const started = await core.settlement({ change_id: command.change_id, expected_state_version: validatorAction.state_version, expected_state_hash: validatorAction.state_hash, settlement: { ...binding, stage: 'STARTED', observed_child_id: 'ordinary-validator-pass-006' } });
    const artifact = { schema_version: '1.0', change_id: command.change_id, candidate_sha: action.subject_sha, validator_head: action.subject_sha, verdict: 'PASS', findings: [], risks: [], unverified: [], open_questions: [] };
    const artifactBytes = Buffer.from(canonicalJson(artifact)); const artifactPath = path.join(ordinaryRoleResultRoot, `${action.correlation_id}.006-pass.json`);
    await mkdir(path.dirname(artifactPath), { recursive: true }); await writeFile(artifactPath, artifactBytes);
    assert.equal(gatewayEvents.some(event => event.gateway === 'git' && event.method === 'pushBranch'), false, '006-L14 no branch push exists before a complete Validator RESULT');
    const passed = await core.settlement({ change_id: command.change_id, expected_state_version: started.state_version, expected_state_hash: started.state_hash, settlement: { ...binding, stage: 'RESULT', observed_child_id: 'ordinary-validator-pass-006', status: 'PASS', artifact_path: artifactPath, artifact_sha256: sha256(artifactBytes), validator_artifact: artifact } });
    assert.equal(passed.outcome, 'ADVANCED'); assert.equal(passed.payload.to_phase, 'BRANCH_PUSH');
    assert.equal(gatewayEvents.some(event => event.gateway === 'git' && event.method === 'pushBranch'), false, '006-L14 settlement publishes no branch effect itself');
    const remote = await readLocalLedger(ledger, command.change_id); const { records } = decodeRemoteLedger(remote);
    const agentResult = records.findLast(record => record.event_class === 'AGENT_RUN' && record.detail?.stage === 'RESULT' && record.detail?.correlation_id === action.correlation_id);
    const validatorReceipt = records.findLast(record => record.event_class === 'VALIDATION_RESULT' && record.detail?.validation_kind === 'VALIDATOR' && record.detail?.candidate_sha === candidateEvent.detail.candidate_sha);
    const finalReceipt = records.findLast(record => record.event_class === 'VALIDATION_RESULT' && record.detail?.validation_kind === 'FINAL_VALIDATION' && record.detail?.candidate_sha === candidateEvent.detail.candidate_sha);
    assert.ok(agentResult && validatorReceipt && finalReceipt, '006-L13 requires the complete Agent RESULT plus Final/Validator receipts from remote bytes');
    assert.deepEqual(Object.keys(validatorReceipt.detail).sort(), ['candidate_sha', 'command_definition_sha256', 'failure_code', 'idempotency_id', 'receipt_sha256', 'status', 'subject_sha', 'validation_id', 'validation_kind', 'validation_scope', 'validator_head', 'verdict'].sort());
    assert.equal(agentResult.detail.artifact_sha256, sha256(artifactBytes)); assert.deepEqual(agentResult.detail.validator_artifact, artifact);
    assert.equal(validatorReceipt.sequence, agentResult.sequence + 1, 'the complete Validator Agent RESULT is immediately followed by its Validator receipt');
    const stateReadback = await base.state.readState({ change_id: command.change_id }); assert.equal(stateReadback.kind, 'OK');
    const state = JSON.parse(stateReadback.value.bytes);
    const expectedRefs = [finalReceipt, validatorReceipt].map(record => ({ event_id: record.event_id, event_hash: record.event_hash, validation_id: record.detail.validation_id, validation_kind: record.detail.validation_kind, receipt_sha256: record.detail.receipt_sha256, subject_sha: record.detail.subject_sha, candidate_sha: record.detail.candidate_sha, validator_head: record.detail.validator_head }));
    assert.deepEqual(state.candidate.validation_refs, expectedRefs, '006-L13 Final then Validator refs are exact projections of the two remote authoritative receipts');
    const resultReadback = observedLedgerReadbacks.find(entry => entry.event.event_id === agentResult.event_id);
    const receiptReadback = observedLedgerReadbacks.find(entry => entry.event.event_id === validatorReceipt.event_id);
    assert.ok(resultReadback && receiptReadback, 'both halves of the Validator evidence pair have real append readbacks');
    const pushed = await core.run({ change_id: command.change_id, expected_state_version: passed.state_version, expected_state_hash: passed.state_hash });
    assert.equal(pushed.outcome, 'ADVANCED'); assert.equal(pushed.payload.to_phase, 'CANDIDATE_FREEZE');
    const pushStart = gatewayEvents.find(event => event.edge === 'START' && event.gateway === 'git' && event.method === 'pushBranch');
    const resultComplete = gatewayEvents.find(event => event.edge === 'COMPLETE' && event.gateway === 'ledger' && event.method === 'readRemoteAppend' && event.result?.value?.event_id === agentResult.event_id);
    const receiptComplete = gatewayEvents.find(event => event.edge === 'COMPLETE' && event.gateway === 'ledger' && event.method === 'readRemoteAppend' && event.result?.value?.event_id === validatorReceipt.event_id);
    assert.ok(resultComplete.sequence < receiptComplete.sequence && receiptComplete.sequence < pushStart.sequence, '006-L13 remote RESULT then receipt complete before 006-L14 first branch push START');
  });
});

test('RED-M2-005 / TEST-M2-007 / 007-L01..L05: ordinary Core derives exact repair evidence from one adjacent remote source pair before budget/request publication', async () => {
  await withObservedK1Prefix(async context => {
    const { base, command, core, candidateEvent, ledger, ordinaryRoleResultRoot, observedLedgerReadbacks, gatewayEvents } = context;
    const gatewayStart = gatewayEvents.length;
    const reached = await reachOrdinaryRepairAction(context);
    const resultReadback = observedLedgerReadbacks.findLast(entry => entry.event.event_class === 'AGENT_RUN' && entry.event.detail?.stage === 'RESULT' && entry.event.detail?.correlation_id === reached.validator.correlation_id);
    const receiptReadback = observedLedgerReadbacks.findLast(entry => entry.event.event_class === 'VALIDATION_RESULT' && entry.event.detail?.validation_kind === 'VALIDATOR' && entry.event.detail?.idempotency_id === reached.validator.idempotency_id);
    assert.ok(resultReadback && receiptReadback); assert.equal(receiptReadback.event.sequence, resultReadback.event.sequence + 1, '007-L01 source RESULT and receipt are adjacent remotely read records');
    const budgetStart = gatewayEvents.slice(gatewayStart).find(event => event.edge === 'START' && event.gateway === 'state' && event.method === 'writeState' && JSON.parse(Buffer.from(event.request.next_bytes).toString('utf8')).authorization_cycle?.auto_repair_attempt === 1);
    const sourceRead = gatewayEvents.slice(gatewayStart).findLast(event => event.edge === 'COMPLETE' && event.gateway === 'ledger' && event.method === 'readRemote' && event.sequence < budgetStart.sequence && event.actual_result?.kind === 'OK' && event.actual_result.value.last_event_id === receiptReadback.event.event_id);
    assert.ok(sourceRead, '007-L01 captures the exact fixed-tip source read before budget consumption');
    const remote = sourceRead.actual_result; decodeRemoteLedger(remote);
    const expectedDerived = {
      schema_version: '1.0', kind: 'REPAIR_TEST_DERIVED_EVIDENCE', change_id: command.change_id,
      candidate_sha: candidateEvent.detail.candidate_sha, candidate_tree: candidateEvent.detail.tree,
      authorization_cycle_command_id: command.command_id, source_execution_attempt: 0, repair_execution_attempt: 1,
      scope_sha256: sha256(canonicalJson({ allowed_paths: command.scope.allowed_paths, forbidden_paths: command.scope.forbidden_paths })),
      validator_artifact_sha256: sha256(reached.artifactBytes), validator_receipt_sha256: receiptReadback.event.detail.receipt_sha256,
      validator_agent_result_event_ref: fixedTipLedgerRef(resultReadback, remote), validator_receipt_event_ref: fixedTipLedgerRef(receiptReadback, remote),
      findings: reached.artifact.findings,
    };
    const derivedBytes = Buffer.from(canonicalJson(expectedDerived)); const derivedHash = sha256(derivedBytes); const derivedBase64 = derivedBytes.toString('base64');
    assert.equal(Buffer.from(derivedBase64, 'base64').toString('base64'), derivedBase64, '007-L03 uses canonical padded base64 over the exact canonical D bytes');
    const repair = reached.repairAction.payload.action;
    assert.deepEqual(repair.repair_evidence, { schema_version: '1.0', kind: 'REPAIR_TEST_EVIDENCE', derived_input_sha256: derivedHash, derived_input_byte_length: derivedBytes.length, derived_input_bytes_base64: derivedBase64 }, '007-L02..L04 bind exact independently canonicalized D bytes/hash/length/base64');
    const signedTest = command.payload.roles.find(role => role.role === 'juaner_test'); assert.ok(signedTest);
    assert.equal(repair.input_sha256, signedTest.input_sha256, '007-L03 repair keeps the signed Test base-input hash unchanged');
    const idPreimage = { schema_version: '1.0', change_id: command.change_id, candidate_sha: candidateEvent.detail.candidate_sha, authorization_cycle_command_id: command.command_id, repair_execution_attempt: 1, derived_input_sha256: derivedHash, state_version: repair.state_version };
    assert.equal(repair.correlation_id, `repair-test-correlation-${sha256(canonicalJson(idPreimage))}`);
    assert.equal(repair.idempotency_id, `repair-test-request-${sha256(canonicalJson(idPreimage))}`);
    assert.deepEqual((await readdir(ordinaryRoleResultRoot)).sort(), reached.artifactInventoryBeforeResult, '007-L05 deriving D, consuming budget, and publishing the repair Action creates no artifact-root file after the source artifact already exists');
    const resultComplete = gatewayEvents.slice(gatewayStart).find(event => event.edge === 'COMPLETE' && event.gateway === 'ledger' && event.method === 'readRemoteAppend' && event.result?.value?.event_id === resultReadback.event.event_id);
    const receiptComplete = gatewayEvents.slice(gatewayStart).find(event => event.edge === 'COMPLETE' && event.gateway === 'ledger' && event.method === 'readRemoteAppend' && event.result?.value?.event_id === receiptReadback.event.event_id);
    assert.ok(resultComplete.sequence < budgetStart.sequence && receiptComplete.sequence < budgetStart.sequence, '007-L01 both source readbacks complete before budget write START');
    const stateReadback = await base.state.readState({ change_id: command.change_id }); assert.equal(stateReadback.kind, 'OK'); const state = JSON.parse(stateReadback.value.bytes);
    assert.equal(state.authorization_cycle.auto_repair_attempt, 1, '007-L04 budget is exactly one before repair REQUESTED/Pending/Action');
    const afterRequest = await readLocalLedger(ledger, command.change_id); const { records } = decodeRemoteLedger(afterRequest);
    const requested = records.findLast(record => record.event_class === 'AGENT_RUN' && record.detail?.stage === 'REQUESTED' && record.detail?.correlation_id === repair.correlation_id);
    assert.ok(requested);
    const { action_kind, ...repairBinding } = repair;
    const { request_event_id, ...pendingBinding } = state.pending_agent;
    assert.equal(request_event_id, requested.event_id, '007-L04 Pending binds the actual matching REQUESTED event');
    assert.deepEqual(pendingBinding, repairBinding, '007-L04 Pending and Action preserve the complete shared repair binding');
    assert.deepEqual(requested.detail.repair_evidence, repair.repair_evidence, '007-L04 REQUESTED persists the complete derived binding');
    const filesBeforeInvalidSettlements = (await readdir(ordinaryRoleResultRoot)).sort();
    const mutations = [
      ['wrong derived hash', { ...repairBinding, repair_evidence: { ...repairBinding.repair_evidence, derived_input_sha256: '0'.repeat(64) } }],
      ['wrong derived length', { ...repairBinding, repair_evidence: { ...repairBinding.repair_evidence, derived_input_byte_length: repairBinding.repair_evidence.derived_input_byte_length + 1 } }],
      ['noncanonical base64', { ...repairBinding, repair_evidence: { ...repairBinding.repair_evidence, derived_input_bytes_base64: `${repairBinding.repair_evidence.derived_input_bytes_base64}=` } }],
      ['missing derived binding', (() => { const value = { ...repairBinding }; delete value.repair_evidence; return value; })()],
    ];
    for (const [label, damaged] of mutations) {
      const rejected = await core.settlement({ change_id: command.change_id, expected_state_version: reached.repairAction.state_version, expected_state_hash: reached.repairAction.state_hash, settlement: { ...damaged, stage: 'STARTED', observed_child_id: `007-invalid-${label}` } });
      assert.equal(rejected.outcome, 'REJECTED', `007-L05 ordinary Core rejects ${label} before consuming a child`);
    }
    assert.deepEqual((await readdir(ordinaryRoleResultRoot)).sort(), filesBeforeInvalidSettlements, '007-L05 derived evidence and rejected bindings publish no new artifact-root file');
  });
});

test('RED-M2-005 / TEST-M2-008 / 008-L06: a real chain-valid current-cycle event between Validator RESULT and receipt alone defeats source adjacency', async () => {
  const sourceProof = {}; const ledgerRoute = { target: null };
  await withObservedK1Prefix(async context => {
    const reached = await reachOrdinaryRepairAction(context, { stopAfterValidatorResult: true });
    assert.deepEqual(context.faultHits, ['ledger:008-L06:nonadjacent-validator-pair'], 'the fault is armed only after the actual Validator pair exists');
    const fault = context.gatewayEvents.find(event => event.edge === 'COMPLETE' && event.gateway === 'ledger' && event.method === 'readRemote' && event.faulted === true); assert.ok(fault);
    assert.equal(fault.actual_result.kind, 'OK'); assert.equal(fault.result.kind, 'OK'); assert.notEqual(fault.actual_result.value.tip, fault.result.value.tip, 'the post-pair source read observes a different real Test-owned Git tip');
    assert.equal(fault.result.receipt_sha256, sha256(canonicalJson(fault.result.value))); assert.equal(fault.result.value.tip, sourceProof.remote.value.tip); assert.equal(fault.result.value.tip_tree, sourceProof.remote.value.tip_tree);
    assert.equal(reached.validatorFailed.outcome, 'BLOCKED'); assert.equal(reached.validatorFailed.payload.blocked_reason, 'EVIDENCE_CONFLICT');
    const after = await context.base.state.readState({ change_id: context.command.change_id }); assert.equal(after.kind, 'OK'); const state = JSON.parse(after.value.bytes);
    assert.equal(state.authorization_cycle.auto_repair_attempt, 0); assert.equal(state.macro_state, 'BLOCKED'); assert.equal(state.pending_agent, null);
    const actualRemote = await readLocalLedger(sourceProof.alternate, context.command.change_id); const { records, bytes: actualBytes } = decodeRemoteLedger(actualRemote);
    const receiptIndex = records.findLastIndex(record => record.event_class === 'VALIDATION_RESULT' && record.detail?.validation_kind === 'VALIDATOR' && record.detail?.verdict === 'FAIL');
    const resultIndex = records.findLastIndex((record, index) => index < receiptIndex && record.event_class === 'AGENT_RUN' && record.detail?.stage === 'RESULT' && record.detail?.correlation_id === reached.validator.correlation_id);
    assert.equal(receiptIndex, resultIndex + 2, 'exactly one physical record, not a byte reorder, breaks the required immediate successor relation');
    const intervening = records[resultIndex + 1]; assert.equal(intervening.event_class, 'AGENT_RUN'); assert.equal(intervening.detail.stage, 'REQUESTED'); assert.equal(intervening.detail.correlation_id, '008-L06-intervening-current-cycle');
    for (let index = 0; index < records.length; index += 1) {
      assert.equal(records[index].sequence, index + 1, 'every real record keeps a contiguous sequence');
      const { event_hash, ...preimage } = records[index]; assert.equal(event_hash, sha256(canonicalJson(preimage)), 'every real record keeps its own canonical event hash');
      assert.equal(records[index].change_id, context.command.change_id);
    }
    assert.equal(records[resultIndex].subject_sha, records[receiptIndex].subject_sha); assert.equal(intervening.subject_sha, records[receiptIndex].subject_sha, 'the isolated intervening record retains the current pair subject');
    const interveningReadback = sourceProof.readbacks.find(entry => entry.event.event_id === intervening.event_id); const receiptReadback = sourceProof.readbacks.find(entry => entry.event.event_id === records[receiptIndex].event_id);
    assert.ok(interveningReadback && receiptReadback); assert.equal(interveningReadback.result.value.tip, interveningReadback.result.value.commit_sha); assert.equal(receiptReadback.result.value.parent_tip, interveningReadback.result.value.commit_sha);
    assert.equal(receiptReadback.result.value.record_bytes_sha256, sha256(actualRemote.value.ledger_bytes_base64 ? Buffer.from(actualRemote.value.ledger_bytes_base64, 'base64').subarray(receiptReadback.result.value.record_offset, receiptReadback.result.value.record_offset + receiptReadback.result.value.record_length) : Buffer.alloc(0)));
    const originalReceiptReadback = context.gatewayEvents.find(event => event.edge === 'COMPLETE' && event.gateway === 'ledger' && event.method === 'readRemoteAppend' && event.actual_result?.value?.event_id === sourceProof.originalReceipt.event_id);
    assert.ok(originalReceiptReadback && originalReceiptReadback.sequence < fault.sequence, 'the public Core original Validator receipt append/readback completes unchanged before the alternate source read is delivered');
    const blockedPriorRead = context.gatewayEvents.find(event => event.edge === 'COMPLETE' && event.gateway === 'ledger' && event.method === 'readRemote' && event.sequence > fault.sequence); assert.ok(blockedPriorRead);
    assert.equal(blockedPriorRead.actual_result.value.tip, sourceProof.remote.value.tip); assert.equal(blockedPriorRead.actual_result.value.tip_tree, sourceProof.remote.value.tip_tree); assert.equal(blockedPriorRead.actual_result.value.ledger_bytes_base64, sourceProof.remote.value.ledger_bytes_base64);
    const blockedPrepareStart = context.gatewayEvents.find(event => event.edge === 'START' && event.gateway === 'ledger' && event.method === 'prepareAppend' && event.sequence > blockedPriorRead.sequence && ledgerPrepareEvent(event.request)?.event_class === 'BLOCKED'); assert.ok(blockedPrepareStart);
    const blockedPrepare = context.gatewayEvents.find(event => event.edge === 'COMPLETE' && event.gateway === 'ledger' && event.method === 'prepareAppend' && event.sequence > blockedPrepareStart.sequence);
    const blockedCommit = context.gatewayEvents.find(event => event.edge === 'COMPLETE' && event.gateway === 'ledger' && event.method === 'commitAndPush' && event.sequence > (blockedPrepare?.sequence ?? Number.MAX_SAFE_INTEGER));
    const blockedReadback = context.gatewayEvents.find(event => event.edge === 'COMPLETE' && event.gateway === 'ledger' && event.method === 'readRemoteAppend' && event.sequence > (blockedCommit?.sequence ?? Number.MAX_SAFE_INTEGER));
    assert.ok(blockedPrepare && blockedCommit && blockedReadback, 'the post-selection BLOCKED event completes prepare, commit/push, and readback on the routed alternate authority');
    const blockedRecord = records.find(record => record.event_id === reached.validatorFailed.payload.blocked_event_id); assert.ok(blockedRecord); assert.equal(blockedRecord.event_class, 'BLOCKED');
    assert.equal(blockedReadback.actual_result.value.event_id, blockedRecord.event_id); assert.equal(blockedReadback.actual_result.value.parent_tip, sourceProof.remote.value.tip);
    assertExactLedgerReadback(sourceProof.readbacks.find(entry => entry.event.event_id === blockedRecord.event_id), blockedRecord, actualBytes);
    const blockedStateStart = context.gatewayEvents.find(event => event.edge === 'START' && event.gateway === 'state' && event.method === 'writeState' && event.sequence > blockedReadback.sequence && (() => { try { return JSON.parse(Buffer.from(event.request.next_bytes).toString('utf8')).macro_state === 'BLOCKED'; } catch { return false; } })());
    assert.ok(blockedStateStart && blockedReadback.sequence < blockedStateStart.sequence, 'alternate BLOCKED readback completes before durable BLOCKED State write starts');
    const primaryAfter = await readLocalLedger(context.primaryLedger, context.command.change_id, sourceProof.primaryRemote.value.expected_tip);
    assert.deepEqual(primaryAfter, sourceProof.primaryRemote, 'the original complete Validator pair authority remains byte/tip/tree identical after the alternate stop');
  }, {
    ledgerRoute,
    transformLedgerResult: async ({ method, request, actualResult, faultHits, fixtureRoot, command }) => {
      if (method !== 'readRemote' || faultHits.length || actualResult.kind !== 'OK' || actualResult.value.prior_byte_length === 0) return actualResult;
      const records = decodeRemoteLedger(actualResult).records; const receiptIndex = records.findLastIndex(record => record.event_class === 'VALIDATION_RESULT' && record.detail?.validation_kind === 'VALIDATOR' && record.detail?.verdict === 'FAIL');
      if (receiptIndex < 1 || records[receiptIndex - 1]?.event_class !== 'AGENT_RUN' || records[receiptIndex - 1]?.detail?.stage !== 'RESULT') return actualResult;
      const alternateRoot = path.join(fixtureRoot, '008-l06-alternate-source'); await mkdir(alternateRoot);
      const readbacks = []; const alternate = await createLocalBareLedger(alternateRoot, command.change_id, readbacks);
      const requested = records.findLast(record => record.event_class === 'AGENT_RUN' && record.detail?.stage === 'REQUESTED'); assert.ok(requested);
      for (let index = 0; index < records.length; index += 1) {
        if (index === receiptIndex) {
          const interveningIdempotency = '008-L06-intervening-current-cycle-idempotency';
          await appendTestLedgerEvent(alternate, { change_id: command.change_id, event_class: 'AGENT_RUN', state_version: records[index].state_version, subject_sha: records[index].subject_sha, idempotency_id: interveningIdempotency, detail: { ...requested.detail, correlation_id: '008-L06-intervening-current-cycle', idempotency_id: interveningIdempotency } });
        }
        const record = records[index];
        await appendTestLedgerEvent(alternate, { change_id: command.change_id, event_class: record.event_class, detail: record.detail, state_version: record.state_version, subject_sha: record.subject_sha, idempotency_id: record.idempotency_id, occurred_at: record.occurred_at, event_id: record.event_id });
      }
      const remote = await readLocalLedger(alternate, command.change_id, request.expected_tip); assert.equal(remote.kind, 'OK');
      Object.assign(sourceProof, { alternate, remote, primaryRemote: actualResult, readbacks, originalReceipt: records[receiptIndex] });
      ledgerRoute.target = alternate;
      faultHits.push('ledger:008-L06:nonadjacent-validator-pair');
      return remote;
    },
  });
});

function assertAttemptOneSecondValidatorFailure({ beforeState, failedResult, afterState, restartResult, records, gatewayEvents, validatorCorrelationId }) {
  assert.equal(beforeState.authorization_cycle.auto_repair_attempt, 1); assert.equal(beforeState.phase, 'VALIDATOR');
  assert.equal(failedResult.outcome, 'BLOCKED'); assert.equal(failedResult.payload.blocked_reason, 'VALIDATOR_SECOND_FAIL'); assert.equal(failedResult.payload.next_action, 'REVISION');
  assert.equal(afterState.authorization_cycle.auto_repair_attempt, 1); assert.equal(afterState.macro_state, 'BLOCKED'); assert.equal(afterState.blocked_reason, 'VALIDATOR_SECOND_FAIL');
  const resultIndex = records.findLastIndex(record => record.event_class === 'AGENT_RUN' && record.detail?.stage === 'RESULT' && record.detail?.correlation_id === validatorCorrelationId);
  assert.ok(resultIndex >= 0); assert.equal(records[resultIndex + 1]?.event_class, 'VALIDATION_RESULT'); assert.equal(records[resultIndex + 1]?.detail?.validation_kind, 'VALIDATOR'); assert.equal(records[resultIndex + 1]?.detail?.verdict, 'FAIL');
  const frontier = gatewayEvents.findLastIndex(event => event.edge === 'COMPLETE' && event.gateway === 'ledger' && event.method === 'readRemoteAppend' && event.result?.value?.event_id === records[resultIndex + 1].event_id);
  assert.equal(gatewayEvents.slice(frontier + 1).some(event => event.edge === 'START' && event.gateway === 'ledger' && ledgerPrepareEvent(event.request)?.event_class === 'AGENT_RUN' && ['juaner_test', 'juaner_worker'].includes(ledgerPrepareEvent(event.request)?.detail?.role)), false, 'second FAIL creates no repair Test/Worker request');
  assert.notEqual(restartResult.outcome, 'AGENT_ACTION'); assert.equal(afterState.authorization_cycle.auto_repair_attempt, 1, 'fresh Core/run cannot reset the consumed budget');
}

test.skip('RED-M2-005 / TEST-M2-008 / 008-L13: attempt-one second Validator FAIL retains VALIDATOR_SECOND_FAIL / REVISION without resetting repair budget', {
  skip: 'USER_WAIVED / NOT_VERIFIED: this assertion is prewritten but requires the A2 protected repair proof and dependent K2 suffix; no phase prime or substitute PASS is permitted',
}, () => { void assertAttemptOneSecondValidatorFailure; });

test('RED-M2-005 / TEST-M2-008 / 008-L07..L11: real repair identity rejects damaged derived bindings and closes controlled settlement restart/late failures with budget consumed', async t => {
  await t.test('008-L07 derived binding mutations are rejected at the ordinary Core settlement boundary', async () => {
    await withObservedK1Prefix(async context => {
      const reached = await reachOrdinaryRepairAction(context); const repair = reached.repairAction.payload.action; const { action_kind, ...binding } = repair;
      const bad = { ...binding, repair_evidence: { ...binding.repair_evidence, derived_input_bytes_base64: Buffer.from('not the derived canonical bytes').toString('base64') } };
      const rejected = await context.core.settlement({ change_id: context.command.change_id, expected_state_version: reached.repairAction.state_version, expected_state_hash: reached.repairAction.state_hash, settlement: { ...bad, stage: 'STARTED', observed_child_id: '008-derived-invalid' } });
      assert.equal(rejected.outcome, 'REJECTED');
      const state = await context.base.state.readState({ change_id: context.command.change_id }); assert.equal(JSON.parse(state.value.bytes).authorization_cycle.auto_repair_attempt, 1);
    });
  });
  await t.test('008-L10..L11 STARTED then a controlled INTERRUPTED settlement crosses a fresh Core and late replay cannot relaunch', async () => {
    await withObservedK1Prefix(async context => {
      const reached = await reachOrdinaryRepairAction(context); const repair = reached.repairAction.payload.action; const { action_kind, ...binding } = repair;
      const started = await context.core.settlement({ change_id: context.command.change_id, expected_state_version: reached.repairAction.state_version, expected_state_hash: reached.repairAction.state_hash, settlement: { ...binding, stage: 'STARTED', observed_child_id: '008-repair-child' } });
      assert.equal(started.outcome, 'WAITING');
      const freshCore = context.restartCore();
      const interrupted = await freshCore.settlement({ change_id: context.command.change_id, expected_state_version: started.state_version, expected_state_hash: started.state_hash, settlement: { ...binding, stage: 'INTERRUPTED', observed_child_id: '008-repair-child', reason_code: 'RESULT_UNREADABLE' } });
      assert.notEqual(interrupted.outcome, 'AGENT_ACTION');
      const state = await context.base.state.readState({ change_id: context.command.change_id }); assert.equal(state.kind, 'OK'); assert.equal(JSON.parse(state.value.bytes).authorization_cycle.auto_repair_attempt, 1, 'repair budget remains consumed after interruption');
      const late = await freshCore.settlement({ change_id: context.command.change_id, expected_state_version: started.state_version, expected_state_hash: started.state_hash, settlement: { ...binding, stage: 'INTERRUPTED', observed_child_id: '008-repair-child', reason_code: 'RESULT_UNREADABLE' } });
      assert.equal(late.outcome, 'REJECTED', 'late duplicate settlement cannot resume or relaunch the consumed attempt');
      const laterRun = await freshCore.run({ change_id: context.command.change_id, expected_state_version: interrupted.state_version, expected_state_hash: interrupted.state_hash });
      assert.notEqual(laterRun.outcome, 'AGENT_ACTION', 'restart after dynamic proof failure requests neither repair retry nor Worker');
    });
  });
});

test('RED-M2-005 / TEST-M2-008 / 008-L08..L09: budget CAS failure retains exact prior State and publishes no repair request', async () => {
  await withObservedK1Prefix(async context => {
    const reached = await reachOrdinaryRepairAction(context, { stopAfterValidatorResult: true });
    assert.deepEqual(context.faultHits, ['state:008-L08:budget-cas']); assert.notEqual(reached.validatorFailed.outcome, 'ADVANCED');
    const after = await context.base.state.readState({ change_id: context.command.change_id }); assert.deepEqual(after, reached.beforeValidatorResult, 'failed 0 -> 1 CAS retains the exact prior State bytes/hash');
    assert.equal(JSON.parse(after.value.bytes).authorization_cycle.auto_repair_attempt, 0);
    assert.equal(await exists(context.localPausePath), true, 'budget authority failure writes only the exact local pause');
    const pauseBytes = await readFile(context.localPausePath, 'utf8'); assert.equal(pauseBytes, canonicalJson(JSON.parse(pauseBytes)));
    assert.equal(context.observedLedgerReadbacks.slice(reached.readbackFrontierBeforeValidatorResult).some(entry => entry.event.event_class === 'AGENT_RUN' && entry.event.detail?.stage === 'REQUESTED' && entry.event.detail?.role === 'juaner_test'), false, 'no Test REQUESTED record exists after the failed budget-CAS frontier; the real attempt-zero Test prefix is out of scope');
  }, {
    transformStateRequest: async ({ method, request, faultHits }) => {
      if (method !== 'writeState' || faultHits.length) return request;
      const next = JSON.parse(Buffer.from(request.next_bytes).toString('utf8'));
      if (next.authorization_cycle?.auto_repair_attempt !== 1) return request;
      faultHits.push('state:008-L08:budget-cas'); return { ...request, expected_sha256: '0'.repeat(64) };
    },
  });
});

test('RED-M2-005 / TEST-M2-008 / 008-L12: Ledger unavailable after the real Validator source pair preserves prior State and writes only a local pause', async () => {
  await withObservedK1Prefix(async context => {
    const reached = await reachOrdinaryRepairAction(context, { stopAfterValidatorResult: true });
    assert.deepEqual(context.faultHits, ['ledger:008-L12:source-unavailable']); assert.notEqual(reached.validatorFailed.outcome, 'ADVANCED');
    const fault = context.gatewayEvents.find(event => event.edge === 'COMPLETE' && event.gateway === 'ledger' && event.method === 'readRemote' && event.faulted === true);
    assert.ok(fault); assert.equal(fault.actual_result.kind, 'OK'); assert.deepEqual(fault.result, unavailable(null), 'the delivered non-Ledger partial is exactly null while the real producer remains healthy');
    const after = await context.base.state.readState({ change_id: context.command.change_id }); assert.deepEqual(after, reached.beforeValidatorResult, 'unavailable source authority preserves the exact pre-result State bytes/hash');
    assert.equal(JSON.parse(after.value.bytes).authorization_cycle.auto_repair_attempt, 0);
    assert.equal(await exists(context.localPausePath), true); const pauseBytes = await readFile(context.localPausePath, 'utf8'); assert.equal(pauseBytes, canonicalJson(JSON.parse(pauseBytes)));
    assert.equal(reached.validatorFailed.payload.blocked_event_id, null, 'unavailable Ledger authority cannot invent a durable BLOCKED event');
  }, {
    transformLedgerResult: async ({ method, actualResult, faultHits }) => {
      if (method !== 'readRemote' || faultHits.length || actualResult.kind !== 'OK' || actualResult.value.prior_byte_length === 0) return actualResult;
      const records = Buffer.from(actualResult.value.ledger_bytes_base64, 'base64').subarray(0, -1).toString('utf8').split('\n').map(line => JSON.parse(line));
      if (!records.some(record => record.event_class === 'VALIDATION_RESULT' && record.detail?.validation_kind === 'VALIDATOR' && record.detail?.verdict === 'FAIL')) return actualResult;
      faultHits.push('ledger:008-L12:source-unavailable'); return unavailable(null);
    },
  });
});

test('RED-M2-006 / TEST-M2-012 / 012-L02: an Agent wait releases the public mutex without duplicating its pending action or later effects', async () => {
  let observedWait = false;
  await withObservedK1Prefix(async () => {
    assert.equal(observedWait, true, 'the frozen suffix reached and proved the public Agent-wait release boundary');
  }, {
    afterAgentAction: async ({ core, command, response, action, gatewayEvents, settledRoles }) => {
      if (settledRoles !== 0) return;
      const agentAppendStartsBefore = gatewayEvents.filter(event => event.edge === 'START' && event.gateway === 'ledger' && event.method === 'prepareAppend' && ledgerPrepareEvent(event.request)?.event_class === 'AGENT_RUN').length;
      const effectStartsBefore = gatewayEvents.filter(event => event.edge === 'START' && ['git', 'pull_request', 'handoff', 'validation'].includes(event.gateway)).length;
      const status = await core.status({ change_id: command.change_id });
      const replay = await core.run({ change_id: command.change_id, expected_state_version: response.state_version, expected_state_hash: response.state_hash });
      assert.notEqual(status.error_code, 'OPERATION_BUSY', 'read-only status is admitted after the action-returning call releases the mutex');
      assert.notEqual(replay.error_code, 'OPERATION_BUSY', 'a public mutator reaches the existing Agent-wait state after mutex release');
      assert.equal(replay.outcome, 'AGENT_ACTION');
      assert.equal(replay.payload.action.correlation_id, action.correlation_id, 'the wait replays only the already-pending correlation');
      assert.deepEqual(replay.payload.action, action, 'the wait exposes the exact pending action rather than creating another attempt');
      assert.equal(gatewayEvents.filter(event => event.edge === 'START' && event.gateway === 'ledger' && event.method === 'prepareAppend' && ledgerPrepareEvent(event.request)?.event_class === 'AGENT_RUN').length, agentAppendStartsBefore, 'the released wait appends no duplicate Agent record');
      assert.equal(gatewayEvents.filter(event => event.edge === 'START' && ['git', 'pull_request', 'handoff', 'validation'].includes(event.gateway)).length, effectStartsBefore, 'the released wait starts no later effect');
      observedWait = true;
    },
  });
});

test('RED-M2-006 / TEST-M2-012 / 012-L03: the real public mutex is held across both sequential Regression children and released afterward', async () => {
  const controlRoot = await mkdtemp(path.join(os.tmpdir(), 'juanerai-m2-regression-fence-')); const readyPath = path.join(controlRoot, 'first-child.ready');
  const firstProgram = "require('node:fs').writeFileSync(process.argv[1],String(process.pid));setTimeout(() => process.exit(0), 250)";
  try {
    await withObservedK1Prefix(async ({ command, core, afterWorker, gatewayEvents, observedValidationRequests }) => {
      const owner = core.run({ change_id: command.change_id, expected_state_version: afterWorker.state_version, expected_state_hash: afterWorker.state_hash });
      for (let attempts = 0; attempts < 100 && !await exists(readyPath); attempts += 1) await new Promise(resolve => setTimeout(resolve, 5));
      assert.equal(await exists(readyPath), true, 'the first real Regression child is active before the public contender runs');
      const contender = await core.run({ change_id: command.change_id, expected_state_version: afterWorker.state_version, expected_state_hash: afterWorker.state_hash });
      assert.equal(contender.outcome, 'REJECTED'); assert.equal(contender.error_code, 'OPERATION_BUSY', 'a concurrent public mutator cannot interleave the sequential Regression gate');
      const completed = await owner; assert.equal(completed.outcome, 'ADVANCED'); assert.equal(completed.payload.to_phase, 'STAGE');
      assert.deepEqual(observedValidationRequests.map(request => request.definition.id), ['regression-affected-suite', 'regression-test-asset-retirement']);
      const firstComplete = gatewayEvents.find(event => event.edge === 'COMPLETE' && event.gateway === 'validation' && event.actual_result?.value?.validation_id === 'regression-affected-suite'); const secondStart = gatewayEvents.find(event => event.edge === 'START' && event.gateway === 'validation' && event.request?.definition?.id === 'regression-test-asset-retirement');
      assert.ok(firstComplete.sequence < secondStart.sequence, 'the first child terminal receipt completes before the second child starts');
      const firstChildPid = Number(await readFile(readyPath, 'utf8')); assert.throws(() => process.kill(firstChildPid, 0), error => error?.code === 'ESRCH', 'the first child has closed before the sequential gate returns');
      const later = await core.run({ change_id: command.change_id, expected_state_version: afterWorker.state_version, expected_state_hash: afterWorker.state_hash });
      assert.ok(!(later.outcome === 'REJECTED' && later.error_code === 'OPERATION_BUSY'), 'a later public mutator reaches stale-CAS handling after the sequential owner releases the mutex');
    }, { stopAfterWorker: true, validationArgvById: { 'regression-affected-suite': [NODE, '-e', firstProgram, readyPath] } });
  } finally { await rm(controlRoot, { recursive: true, force: true }); }
});

test('RED-M2-006 / TEST-M2-012 / 012-L03 stage/commit suffix: one public call keeps the mutex from physical stage through commit and releases it afterward', async () => {
  let markCommitEntered; let releaseCommit;
  const commitEntered = new Promise(resolve => { markCommitEntered = resolve; });
  const commitRelease = new Promise(resolve => { releaseCommit = resolve; });
  await withObservedK1Prefix(async ({ command, core, regression, gatewayEvents }) => {
    const owner = core.run({ change_id: command.change_id, expected_state_version: regression.state_version, expected_state_hash: regression.state_hash });
    await commitEntered;
    const stageComplete = gatewayEvents.find(event => event.edge === 'COMPLETE' && event.gateway === 'git' && event.method === 'readStaged');
    const commitStart = gatewayEvents.find(event => event.edge === 'START' && event.gateway === 'git' && event.method === 'commitCandidate');
    assert.ok(stageComplete && commitStart && stageComplete.sequence < commitStart.sequence, 'the deterministic barrier is after physical stage/readback and at the commit boundary');
    const contender = await core.run({ change_id: command.change_id, expected_state_version: regression.state_version, expected_state_hash: regression.state_hash });
    assert.equal(contender.outcome, 'REJECTED'); assert.equal(contender.error_code, 'OPERATION_BUSY', 'no second public mutation interleaves between stage and commit');
    releaseCommit();
    const completed = await owner;
    assert.equal(completed.outcome, 'ADVANCED'); assert.equal(completed.payload.to_phase, 'FINAL_VALIDATION', 'the same owner call completes commit and State advancement');
    const later = await core.run({ change_id: command.change_id, expected_state_version: regression.state_version, expected_state_hash: regression.state_hash });
    assert.ok(!(later.outcome === 'REJECTED' && later.error_code === 'OPERATION_BUSY'), 'the completed same-call stage/commit owner releases the mutex');
  }, {
    stopAtStage: true,
    beforeGitMethod: async ({ method }) => {
      if (method !== 'commitCandidate') return;
      markCommitEntered();
      await commitRelease;
    },
  });
});

test('RED-M2-006 / TEST-M2-012 / 012-L07..L10: wrong ordinary Validator bindings, interruption, fresh-Core late facts, and publication replay all fail closed', async () => {
  await withObservedK1Prefix(async ({ command, core, restartCore, candidateTransition, gatewayEvents }) => {
    const candidateValidation = await core.run({ change_id: command.change_id, expected_state_version: candidateTransition.state_version, expected_state_hash: candidateTransition.state_hash }); assert.equal(candidateValidation.outcome, 'ADVANCED');
    const validatorAction = await core.run({ change_id: command.change_id, expected_state_version: candidateValidation.state_version, expected_state_hash: candidateValidation.state_hash }); assert.equal(validatorAction.outcome, 'AGENT_ACTION');
    const action = validatorAction.payload.action; const { action_kind, ...binding } = action;
    const agentEventStartsBefore = gatewayEvents.filter(event => event.edge === 'START' && event.gateway === 'ledger' && event.method === 'prepareAppend' && ledgerPrepareEvent(event.request)?.event_class === 'AGENT_RUN').length;
    const wrongCorrelation = await core.settlement({ change_id: command.change_id, expected_state_version: validatorAction.state_version, expected_state_hash: validatorAction.state_hash, settlement: { ...binding, correlation_id: `${binding.correlation_id}-wrong`, stage: 'STARTED', observed_child_id: '012-validator-child' } });
    const wrongSubject = await core.settlement({ change_id: command.change_id, expected_state_version: validatorAction.state_version, expected_state_hash: validatorAction.state_hash, settlement: { ...binding, subject_sha: 'f'.repeat(40), stage: 'STARTED', observed_child_id: '012-validator-child' } });
    const staleState = await core.settlement({ change_id: command.change_id, expected_state_version: validatorAction.state_version + 1, expected_state_hash: validatorAction.state_hash, settlement: { ...binding, stage: 'STARTED', observed_child_id: '012-validator-child' } });
    for (const rejected of [wrongCorrelation, wrongSubject, staleState]) assert.equal(rejected.outcome, 'REJECTED', 'wrong binding/Head/State cannot acknowledge STARTED');
    assert.equal(gatewayEvents.filter(event => event.edge === 'START' && event.gateway === 'ledger' && event.method === 'prepareAppend' && ledgerPrepareEvent(event.request)?.event_class === 'AGENT_RUN').length, agentEventStartsBefore, 'rejected facts append no Agent record');
    const started = await core.settlement({ change_id: command.change_id, expected_state_version: validatorAction.state_version, expected_state_hash: validatorAction.state_hash, settlement: { ...binding, stage: 'STARTED', observed_child_id: '012-validator-child' } }); assert.equal(started.outcome, 'WAITING');
    const freshCore = restartCore();
    const interrupted = await freshCore.settlement({ change_id: command.change_id, expected_state_version: started.state_version, expected_state_hash: started.state_hash, settlement: { ...binding, stage: 'INTERRUPTED', observed_child_id: '012-validator-child', reason_code: 'RESULT_UNREADABLE' } }); assert.notEqual(interrupted.outcome, 'AGENT_ACTION');
    const late = await freshCore.settlement({ change_id: command.change_id, expected_state_version: started.state_version, expected_state_hash: started.state_hash, settlement: { ...binding, stage: 'RESULT', observed_child_id: '012-validator-child', status: 'PASS', artifact_path: '/tmp/not-admitted-late-artifact', artifact_sha256: 'a'.repeat(64) } }); assert.equal(late.outcome, 'REJECTED');
    const effectsBefore = gatewayEvents.filter(event => event.edge === 'START' && (event.gateway === 'git' || event.gateway === 'pull_request' || event.gateway === 'handoff')).length;
    const laterRun = await freshCore.run({ change_id: command.change_id, expected_state_version: interrupted.state_version, expected_state_hash: interrupted.state_hash }); assert.notEqual(laterRun.outcome, 'AGENT_ACTION');
    assert.equal(gatewayEvents.filter(event => event.edge === 'START' && (event.gateway === 'git' || event.gateway === 'pull_request' || event.gateway === 'handoff')).length, effectsBefore, 'interrupted/late Validator facts cannot start branch, PR, Handoff, or any repeated Git effect');
  });
});

test('CONTROL-M2-002 / TEST-M2-002 / S19-C01: independent real Git distinguishes a physical zero-parent root from a one-parent nonroot commit', async () => {
  await withRepository(async fixture => {
    const adapters = createCoordinatorAdapters({ repository_root: fixture.repository, state_root: path.join(fixture.root, '.s19-nonroot-read-state'), device: 'mac-mini', process_run_id: 'm2-s19-nonroot-read', git_executable: GIT, pull_request_executable: '/usr/bin/false', base_environment: {} });
    const environment = { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' };
    const rootParents = await runProcess(GIT, ['rev-list', '--parents', '-n', '1', fixture.baseline_sha], { cwd: fixture.repository, env: environment });
    const rootBody = await runProcess(GIT, ['cat-file', 'commit', fixture.baseline_sha], { cwd: fixture.repository, env: environment });
    const nonrootParents = await runProcess(GIT, ['rev-list', '--parents', '-n', '1', fixture.candidate_sha], { cwd: fixture.repository, env: environment });
    const nonrootTree = await runProcess(GIT, ['rev-parse', `${fixture.candidate_sha}^{tree}`], { cwd: fixture.repository, env: environment });
    const nonrootBody = await runProcess(GIT, ['cat-file', 'commit', fixture.candidate_sha], { cwd: fixture.repository, env: environment });
    for (const result of [rootParents, rootBody, nonrootParents, nonrootTree, nonrootBody]) { assert.equal(result.code, 0, result.stderr); assert.equal(result.signal, null); }
    assert.deepEqual(rootParents.stdout.trim().split(' '), [fixture.baseline_sha], 'the independently created baseline is physically a zero-parent commit');
    assert.deepEqual(nonrootParents.stdout.trim().split(' '), [fixture.candidate_sha, fixture.baseline_sha], 'the independently created nonroot has exactly its real full-40 parent');
    const rootHeader = rootBody.stdout.split('\n\n', 1)[0].split('\n');
    assert.deepEqual(rootHeader.filter(line => line.startsWith('parent ')), [], 'the complete physical root header has zero parent lines');
    assert.match(rootHeader[0], /^tree [0-9a-f]{40}$/);
    assert.match(nonrootBody.stdout, new RegExp(`^tree [0-9a-f]{40}\\nparent ${fixture.baseline_sha}\\n`));
    const nonroot = await adapters.git.readCommit({ canonical_root: fixture.repository, sha: fixture.candidate_sha });
    assert.equal(nonroot.kind, 'OK'); assert.equal(nonroot.receipt_sha256, sha256(canonicalJson(nonroot.value)));
    assert.deepEqual(Object.keys(nonroot.value).sort(), ['branch', 'parent', 'sha', 'tree']);
    assert.deepEqual(nonroot.value, { sha: fixture.candidate_sha, parent: fixture.baseline_sha, tree: nonrootTree.stdout.trim(), branch: 'work/mac-mini/m2-test' });
  });
});

test('RED-M2-002 / TEST-M2-002 / S19-L01: the public Adapter reads an independently proven root as parent:null and preserves real nonroot identity', async () => {
  await withRepository(async fixture => {
    const adapters = createCoordinatorAdapters({ repository_root: fixture.repository, state_root: path.join(fixture.root, '.s19-root-read-state'), device: 'mac-mini', process_run_id: 'm2-s19-root-read', git_executable: GIT, pull_request_executable: '/usr/bin/false', base_environment: {} });
    const environment = { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' };
    const rootTree = await runProcess(GIT, ['rev-parse', `${fixture.baseline_sha}^{tree}`], { cwd: fixture.repository, env: environment });
    const rootHeader = await runProcess(GIT, ['cat-file', 'commit', fixture.baseline_sha], { cwd: fixture.repository, env: environment });
    for (const result of [rootTree, rootHeader]) { assert.equal(result.code, 0, result.stderr); assert.equal(result.signal, null); }
    assert.deepEqual(rootHeader.stdout.split('\n\n', 1)[0].split('\n').filter(line => line.startsWith('parent ')), [], 'cat-file proves the complete root header has no physical parent line');
    const root = await adapters.git.readCommit({ canonical_root: fixture.repository, sha: fixture.baseline_sha });
    assert.equal(root.kind, 'OK'); assert.equal(root.receipt_sha256, sha256(canonicalJson(root.value)));
    assert.deepEqual(Object.keys(root.value).sort(), ['branch', 'parent', 'sha', 'tree']);
    assert.deepEqual(root.value, { sha: fixture.baseline_sha, parent: null, tree: rootTree.stdout.trim(), branch: 'work/mac-mini/m2-test' });
  });
});

test('RED-M2-002 / TEST-M2-002 / S19-L02: a physical root baseline reads parent:null, preserves the four-key receipt, then permits only a one-parent Candidate', async () => {
  await withObservedK1Prefix(async ({ base, command, core, regression, expectedSubject, coreWorktree, gatewayEvents }) => {
    const environment = { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' };
    const physicalRoot = await runProcess(GIT, ['rev-list', '--parents', '-n', '1', expectedSubject.head_sha], { cwd: command.repository.canonical_root, env: environment });
    assert.equal(physicalRoot.code, 0, physicalRoot.stderr); assert.deepEqual(physicalRoot.stdout.trim().split(' '), [expectedSubject.head_sha], 'the Core receives an actual physical root baseline, not a synthetic null parent');
    const transitioned = await core.run({ change_id: command.change_id, expected_state_version: regression.state_version, expected_state_hash: regression.state_hash });
    assert.equal(transitioned.outcome, 'ADVANCED', 'a proven zero-parent historical baseline must not be relabeled CANDIDATE_COMMIT_AMBIGUOUS');
    assert.equal(transitioned.payload.to_phase, 'FINAL_VALIDATION');
    const rootReadStart = gatewayEvents.find(event => event.edge === 'START' && event.gateway === 'git' && event.method === 'readCommit' && event.request.sha === expectedSubject.head_sha);
    assert.ok(rootReadStart, 'the public Core starts the one required baseline read after stage/readback and before commitCandidate');
    const rootRead = gatewayEvents.find(event => event.edge === 'COMPLETE' && event.gateway === 'git' && event.method === 'readCommit' && event.invocation === rootReadStart.invocation);
    assert.ok(rootRead, 'the public Core performs the one required baseline read after stage/readback and before commitCandidate');
    assert.equal(rootRead.result.kind, 'OK'); assert.equal(rootRead.result.receipt_sha256, sha256(canonicalJson(rootRead.result.value)));
    assert.deepEqual(Object.keys(rootRead.result.value).sort(), ['branch', 'parent', 'sha', 'tree']);
    assert.equal(rootRead.result.value.sha, expectedSubject.head_sha); assert.equal(rootRead.result.value.parent, null);
    assert.match(rootRead.result.value.tree, /^[0-9a-f]{40}$/); assert.equal(rootRead.result.value.branch, 'work/mac-mini/m2-regression');
    const head = await runProcess(GIT, ['rev-parse', 'HEAD'], { cwd: coreWorktree, env: environment });
    const candidateParents = await runProcess(GIT, ['rev-list', '--parents', '-n', '1', head.stdout.trim()], { cwd: coreWorktree, env: environment });
    assert.equal(head.code, 0, head.stderr); assert.equal(candidateParents.code, 0, candidateParents.stderr);
    assert.deepEqual(candidateParents.stdout.trim().split(' '), [head.stdout.trim(), expectedSubject.head_sha], 'the root exception never creates a zero-parent Candidate');
    const state = await base.state.readState({ change_id: command.change_id }); assert.equal(state.kind, 'OK');
    const candidate = JSON.parse(state.value.bytes).candidate;
    assert.equal(candidate.parent, expectedSubject.head_sha); assert.match(candidate.parent, /^[0-9a-f]{40}$/);
  }, { stopAtStage: true });
});

test('CONTROL-M2-002 / TEST-M2-002 / S19-C02: missing, wrong-type, malformed, and physically truncated commit bytes cannot be represented as root success', async t => {
  const cases = [
    ['missing full-40 object', async () => 'f'.repeat(40)],
    ['wrong-type blob', async ({ fixture, environment, store }) => {
      const stored = store(['hash-object', '-w', '--stdin'], Buffer.from('S19 wrong-type object\n'));
      assert.equal(stored.status, 0, stored.stderr); assert.equal(stored.signal, null); assert.match(stored.stdout.trim(), /^[0-9a-f]{40}$/);
      return stored.stdout.trim();
    }],
    ['malformed physical commit', async ({ fixture, environment, store }) => {
      const raw = Buffer.from(`tree ${fixture.candidate_tree}\nparent not-a-git-object\n\nS19 malformed physical commit\n`);
      const stored = store(['hash-object', '--literally', '-t', 'commit', '-w', '--stdin'], raw);
      assert.equal(stored.status, 0, stored.stderr); assert.equal(stored.signal, null); assert.match(stored.stdout.trim(), /^[0-9a-f]{40}$/);
      const readback = await runProcess(GIT, ['cat-file', 'commit', stored.stdout.trim()], { cwd: fixture.repository, env: environment });
      assert.equal(readback.code, 0, readback.stderr); assert.deepEqual(Buffer.from(readback.stdout), raw, 'the malformed object is physically stored and reread as exact bytes');
      return stored.stdout.trim();
    }],
    ['truncated physical commit', async ({ fixture, environment, store }) => {
      const raw = Buffer.from(`tree ${fixture.candidate_tree}\nparent ${fixture.candidate_sha.slice(0, -1)}\n`);
      const stored = store(['hash-object', '--literally', '-t', 'commit', '-w', '--stdin'], raw);
      assert.equal(stored.status, 0, stored.stderr); assert.equal(stored.signal, null); assert.match(stored.stdout.trim(), /^[0-9a-f]{40}$/);
      const readback = await runProcess(GIT, ['cat-file', 'commit', stored.stdout.trim()], { cwd: fixture.repository, env: environment });
      assert.equal(readback.code, 0, readback.stderr); assert.deepEqual(Buffer.from(readback.stdout), raw, 'the truncated object is physically stored and reread as exact bytes');
      return stored.stdout.trim();
    }],
  ];
  for (const [label, build] of cases) await t.test(label, async () => {
    await withRepository(async fixture => {
      const adapters = createCoordinatorAdapters({ repository_root: fixture.repository, state_root: path.join(fixture.root, '.s19-read-failure-state'), device: 'mac-mini', process_run_id: 'm2-s19-read-failure', git_executable: GIT, pull_request_executable: '/usr/bin/false', base_environment: {} });
      const environment = { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' };
      const store = (args, input) => childProcess.spawnSync(GIT, args, { cwd: fixture.repository, env: environment, input, encoding: 'utf8', shell: false });
      const sha = await build({ fixture, environment, store });
      const headBefore = await runProcess(GIT, ['rev-parse', 'HEAD'], { cwd: fixture.worktree, env: environment });
      await assert.rejects(adapters.git.readCommit({ canonical_root: fixture.repository, sha }), /COORDINATOR_INTERRUPTED/, `${label} cannot synthesize parent:null`);
      const headAfter = await runProcess(GIT, ['rev-parse', 'HEAD'], { cwd: fixture.worktree, env: environment });
      assert.equal(headAfter.stdout, headBefore.stdout, `${label} cannot move the Candidate branch`);
    });
  });
});

test('CONTROL-M2-002 / TEST-M2-004 / S19-C03: only an actual one-parent commitCandidate result is a Candidate success; nullable or non-identity parents stop at the public seam', async t => {
  await withRepository(async fixture => {
    const adapters = createCoordinatorAdapters({ repository_root: fixture.repository, state_root: path.join(fixture.root, '.s19-candidate-state'), device: 'mac-mini', process_run_id: 'm2-s19-candidate', git_executable: GIT, pull_request_executable: '/usr/bin/false', base_environment: {} });
    const environment = { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' };
    await writeFile(path.join(fixture.worktree, 'tracked.txt'), 'S19 one-parent candidate bytes\n');
    const staged = await adapters.git.stageExact({ canonical_root: fixture.repository, worktree_root: fixture.worktree, expected_head: fixture.candidate_sha, paths: ['tracked.txt'] });
    const idempotency_id = `candidate-${sha256(canonicalJson({ schema_version: '1.0', change_id: 'CHG-dual-device-transition-foundation', authorization_cycle_command_id: 's19-one-parent', expected_parent: fixture.candidate_sha, expected_tree: staged.value.index_tree }))}`;
    const message_bytes = new TextEncoder().encode(`JuanerAI Candidate\n\nJuanerAI-Idempotency-ID: ${idempotency_id}\n`);
    const request = { canonical_root: fixture.repository, worktree_root: fixture.worktree, expected_parent: fixture.candidate_sha, expected_tree: staged.value.index_tree, message_bytes, idempotency_id };
    for (const [label, expected_parent] of [['null', null], ['missing', undefined], ['zero OID', '0'.repeat(40)], ['wrong full-40', 'f'.repeat(40)]]) await t.test(label, async () => {
      const headBefore = await runProcess(GIT, ['rev-parse', 'HEAD'], { cwd: fixture.worktree, env: environment });
      const result = await adapters.git.commitCandidate({ ...request, expected_parent });
      assert.ok(['CONFLICT', 'AMBIGUOUS'].includes(result.kind), `${label} must use an existing non-success Gateway outcome`);
      assert.notEqual(result.kind, 'ALREADY_APPLIED', `${label} expected_parent cannot be relabeled idempotent success`);
      const headAfter = await runProcess(GIT, ['rev-parse', 'HEAD'], { cwd: fixture.worktree, env: environment });
      assert.equal(headAfter.stdout, headBefore.stdout, `${label} rejection cannot move the branch`);
    });
    const committed = await adapters.git.commitCandidate(request); assert.equal(committed.kind, 'OK');
    const physicalParents = await runProcess(GIT, ['rev-list', '--parents', '-n', '1', committed.value.sha], { cwd: fixture.worktree, env: environment });
    assert.equal(physicalParents.code, 0, physicalParents.stderr); assert.deepEqual(physicalParents.stdout.trim().split(' '), [committed.value.sha, fixture.candidate_sha], 'the sole successful Candidate has exactly one physical parent');
  });
  for (const [label, mutate] of [
    ['null parent', value => ({ ...value, parent: null })],
    ['missing parent', value => { const { parent, ...withoutParent } = value; return withoutParent; }],
    ['zero parent', value => ({ ...value, parent: '0'.repeat(40) })],
    ['self parent', value => ({ ...value, parent: value.sha })],
    ['wrong parent', value => ({ ...value, parent: 'f'.repeat(40) })],
  ]) await t.test(`Core consumer ${label}`, async () => {
    await withObservedK1Prefix(async ({ command, core, regression, gatewayEvents, faultHits }) => {
      const stopped = await core.run({ change_id: command.change_id, expected_state_version: regression.state_version, expected_state_hash: regression.state_hash });
      assert.deepEqual(faultHits, [`git:S19-C03:${label}`]); assert.equal(stopped.outcome, 'BLOCKED');
      assertNoCandidateOrLaterEffects(gatewayEvents, { allowCommit: true });
    }, {
      stopAtStage: true,
      transformGitResult: async ({ method, actualResult, faultHits }) => {
        if (method !== 'commitCandidate' || actualResult.kind !== 'OK' || faultHits.length) return actualResult;
        faultHits.push(`git:S19-C03:${label}`); return ok(mutate(actualResult.value));
      },
    });
  });
  await t.test('RED-M2-003 / TEST-M2-003 / S19-L03: one-parent Candidate-shaped Head retains the same operation identity at the public readback boundary', async () => {
    await withRepository(async fixture => {
      const stateRoot = path.join(fixture.root, '.s19-one-parent-shaped-state');
      const adapters = createCoordinatorAdapters({ repository_root: fixture.repository, state_root: stateRoot, device: 'mac-mini', process_run_id: 'm2-s19-one-parent-shaped', git_executable: GIT, pull_request_executable: '/usr/bin/false', base_environment: {} });
      const environment = { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' };
      await writeFile(path.join(fixture.worktree, 'tracked.txt'), 'S19 Candidate-shaped input\n');
      const staged = await adapters.git.stageExact({ canonical_root: fixture.repository, worktree_root: fixture.worktree, expected_head: fixture.candidate_sha, paths: ['tracked.txt'] });
      const idempotency_id = `candidate-${sha256(canonicalJson({ schema_version: '1.0', change_id: 'CHG-dual-device-transition-foundation', authorization_cycle_command_id: 's19-shape-one', expected_parent: fixture.candidate_sha, expected_tree: staged.value.index_tree }))}`;
      const message_bytes = new TextEncoder().encode(`JuanerAI Candidate\n\nJuanerAI-Idempotency-ID: ${idempotency_id}\n`);
      const request = { canonical_root: fixture.repository, worktree_root: fixture.worktree, expected_parent: fixture.candidate_sha, expected_tree: staged.value.index_tree, message_bytes, idempotency_id };
      const initial = await adapters.git.commitCandidate(request); assert.equal(initial.kind, 'OK', `S19-L03 API_CREATION_FAILURE: initial_result_kind=${initial?.kind ?? 'missing'}`);
      const initialObject = childProcess.spawnSync(GIT, ['cat-file', 'commit', initial.value.sha], { cwd: fixture.worktree, env: environment, shell: false });
      const initialBytes = initialObject.stdout ?? Buffer.alloc(0);
      assert.equal(initialObject.status, 0, `S19-L03 INPUT_IDENTITY_FAILURE: initial_sha=${initial.value.sha} initial_bytes_base64=${initialBytes.toString('base64')} cat_file_stderr=${initialObject.stderr?.toString('utf8') ?? ''}`); assert.equal(initialObject.signal, null, `S19-L03 INPUT_IDENTITY_FAILURE: initial_sha=${initial.value.sha} initial_bytes_base64=${initialBytes.toString('base64')} cat_file_signal=${initialObject.signal}`);
      const initialHeader = initialBytes.toString('utf8').split('\n\n', 1)[0];
      const identities = Object.fromEntries(['author', 'committer'].map(kind => {
        const match = initialHeader.split('\n').find(line => line.startsWith(`${kind} `))?.slice(kind.length + 1).match(/^(.+) <([^<>]+)> ([0-9]+ [+-][0-9]{4})$/);
        assert.ok(match, `S19-L03 INPUT_IDENTITY_FAILURE: initial_sha=${initial.value.sha} missing_complete_${kind}_identity`);
        return [kind, { name: match[1], email: match[2], date: match[3] }];
      }));
      const created = childProcess.spawnSync(GIT, ['commit-tree', request.expected_tree, '-p', request.expected_parent], {
        cwd: fixture.worktree,
        env: {
          ...environment,
          GIT_AUTHOR_NAME: identities.author.name, GIT_AUTHOR_EMAIL: identities.author.email, GIT_AUTHOR_DATE: identities.author.date,
          GIT_COMMITTER_NAME: identities.committer.name, GIT_COMMITTER_EMAIL: identities.committer.email, GIT_COMMITTER_DATE: identities.committer.date,
        },
        input: message_bytes, encoding: 'utf8', shell: false,
      });
      assert.equal(created.status, 0, `S19-L03 INPUT_IDENTITY_FAILURE: initial_sha=${initial.value.sha} raw_status=${created.status} raw_stderr=${created.stderr}`); assert.equal(created.signal, null, `S19-L03 INPUT_IDENTITY_FAILURE: initial_sha=${initial.value.sha} raw_signal=${created.signal}`); const shapedSha = created.stdout.trim(); assert.match(shapedSha, /^[0-9a-f]{40}$/);
      const shapedObject = childProcess.spawnSync(GIT, ['cat-file', 'commit', shapedSha], { cwd: fixture.worktree, env: environment, shell: false }); const shapedBytes = shapedObject.stdout ?? Buffer.alloc(0); assert.equal(shapedObject.status, 0, `S19-L03 INPUT_IDENTITY_FAILURE: initial_sha=${initial.value.sha} shaped_sha=${shapedSha} initial_bytes_base64=${initialBytes.toString('base64')} shaped_bytes_base64=${shapedBytes.toString('base64')} cat_file_stderr=${shapedObject.stderr?.toString('utf8') ?? ''}`); assert.equal(shapedObject.signal, null, `S19-L03 INPUT_IDENTITY_FAILURE: initial_sha=${initial.value.sha} shaped_sha=${shapedSha} initial_bytes_base64=${initialBytes.toString('base64')} shaped_bytes_base64=${shapedBytes.toString('base64')} cat_file_signal=${shapedObject.signal}`);
      const inputIdentity = `initial_sha=${initial.value.sha} shaped_sha=${shapedSha} initial_bytes_sha256=${sha256(initialBytes)} shaped_bytes_sha256=${sha256(shapedBytes)} initial_bytes_base64=${initialBytes.toString('base64')} shaped_bytes_base64=${shapedBytes.toString('base64')} author=${identities.author.name} <${identities.author.email}> ${identities.author.date} committer=${identities.committer.name} <${identities.committer.email}> ${identities.committer.date}`;
      assert.equal(shapedSha, initial.value.sha, `S19-L03 INPUT_IDENTITY_FAILURE: complete_object_sha_mismatch ${inputIdentity}`);
      assert.deepEqual(shapedBytes, initialBytes, `S19-L03 INPUT_IDENTITY_FAILURE: complete_object_bytes_mismatch ${inputIdentity}`);
      assert.equal(shapedBytes.toString('utf8').split('\n\n', 1)[0].split('\n').filter(line => line.startsWith('parent ')).length, 1, `S19-L03 INPUT_IDENTITY_FAILURE: the same-operation readback control has exactly one physical parent ${inputIdentity}`);
      assert.equal(shapedBytes.toString('utf8').endsWith(Buffer.from(message_bytes).toString('utf8')), true, `S19-L03 INPUT_IDENTITY_FAILURE: the same-operation readback control retains the exact message and idempotency id ${inputIdentity}`);
      const moved = await runProcess(GIT, ['update-ref', 'refs/heads/work/mac-mini/m2-test', shapedSha, initial.value.sha], { cwd: fixture.worktree, env: environment }); assert.equal(moved.code, 0, moved.stderr);
      const before = await runProcess(GIT, ['rev-parse', 'HEAD'], { cwd: fixture.worktree, env: environment });
      const result = await adapters.git.commitCandidate(request);
      const after = await runProcess(GIT, ['rev-parse', 'HEAD'], { cwd: fixture.worktree, env: environment });
      assert.ok(['OK', 'ALREADY_APPLIED'].includes(result.kind), `S19-L03 API_READBACK_FAILURE: result_kind=${result?.kind ?? 'missing'} ${inputIdentity}`);
      assert.equal(result.receipt_sha256, sha256(canonicalJson(result.value)), `S19-L03 API_READBACK_FAILURE: receipt_result_kind=${result?.kind ?? 'missing'} ${inputIdentity}`); assert.deepEqual(result.value, { sha: shapedSha, parent: request.expected_parent, tree: request.expected_tree, branch: 'work/mac-mini/m2-test' }, `S19-L03 API_READBACK_FAILURE: value_result_kind=${result?.kind ?? 'missing'} ${inputIdentity}`);
      assert.equal(after.stdout, before.stdout, 'convergence performs no second branch movement');
      assert.equal(await exists(stateRoot), false, 'the Adapter seam publishes no State');
    });
  });
  for (const [label, expectedParentLines] of [
    ['zero-parent Candidate-shaped Head', 0],
    ['two-parent Candidate-shaped Head', 2],
  ]) await t.test(label, async () => {
    await withRepository(async fixture => {
      const stateRoot = path.join(fixture.root, `.s19-${label.replaceAll(/[^a-z]+/gi, '-').toLowerCase()}-state`);
      const adapters = createCoordinatorAdapters({ repository_root: fixture.repository, state_root: stateRoot, device: 'mac-mini', process_run_id: 'm2-s19-candidate-shaped', git_executable: GIT, pull_request_executable: '/usr/bin/false', base_environment: {} });
      const environment = { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' };
      await writeFile(path.join(fixture.worktree, 'tracked.txt'), 'S19 Candidate-shaped input\n');
      const staged = await adapters.git.stageExact({ canonical_root: fixture.repository, worktree_root: fixture.worktree, expected_head: fixture.candidate_sha, paths: ['tracked.txt'] });
      const idempotency_id = `candidate-${sha256(canonicalJson({ schema_version: '1.0', change_id: 'CHG-dual-device-transition-foundation', authorization_cycle_command_id: 's19-shape', expected_parent: fixture.candidate_sha, expected_tree: staged.value.index_tree }))}`;
      const message_bytes = new TextEncoder().encode(`JuanerAI Candidate\n\nJuanerAI-Idempotency-ID: ${idempotency_id}\n`);
      const request = { canonical_root: fixture.repository, worktree_root: fixture.worktree, expected_parent: fixture.candidate_sha, expected_tree: staged.value.index_tree, message_bytes, idempotency_id };
      const initial = await adapters.git.commitCandidate(request);
      assert.equal(initial.kind, 'OK');
      const initialParents = await runProcess(GIT, ['rev-list', '--parents', '-n', '1', initial.value.sha], { cwd: fixture.worktree, env: environment });
      assert.equal(initialParents.code, 0, initialParents.stderr); assert.deepEqual(initialParents.stdout.trim().split(' '), [initial.value.sha, request.expected_parent], 'the same public operation first creates the exact one-parent Candidate control');
      const actualArgs = expectedParentLines === 0 ? ['commit-tree', request.expected_tree] : ['commit-tree', request.expected_tree, '-p', request.expected_parent, '-p', initial.value.sha];
      const created = childProcess.spawnSync(GIT, actualArgs, { cwd: fixture.worktree, env: environment, input: message_bytes, encoding: 'utf8', shell: false });
      assert.equal(created.status, 0, created.stderr); assert.equal(created.signal, null); const shapedSha = created.stdout.trim(); assert.match(shapedSha, /^[0-9a-f]{40}$/);
      const header = await runProcess(GIT, ['cat-file', 'commit', shapedSha], { cwd: fixture.worktree, env: environment }); assert.equal(header.code, 0, header.stderr);
      assert.equal(header.stdout.split('\n\n', 1)[0].split('\n').filter(line => line.startsWith('parent ')).length, expectedParentLines, 'the exact physical Candidate-shaped object has the required parent count');
      assert.equal(header.stdout.endsWith(Buffer.from(message_bytes).toString('utf8')), true, 'the physical object retains the exact expected Candidate message and idempotency trailer');
      const moved = await runProcess(GIT, ['update-ref', 'refs/heads/work/mac-mini/m2-test', shapedSha, initial.value.sha], { cwd: fixture.worktree, env: environment }); assert.equal(moved.code, 0, moved.stderr);
      const before = await runProcess(GIT, ['rev-parse', 'HEAD'], { cwd: fixture.worktree, env: environment });
      const result = await adapters.git.commitCandidate(request);
      const after = await runProcess(GIT, ['rev-parse', 'HEAD'], { cwd: fixture.worktree, env: environment });
      assert.ok(['CONFLICT', 'AMBIGUOUS'].includes(result.kind), 'an invalid physical Candidate-shaped Head must use an existing non-success Adapter failure kind');
      if (result.kind === 'CONFLICT') assert.deepEqual(result, { kind: 'CONFLICT', reason: 'READBACK_MISMATCH', observed_identity: null });
      else assert.deepEqual(Object.keys(result).sort(), ['kind', 'partial_receipt', 'reason']);
      assert.notEqual(result.kind, 'OK', 'an invalid physical Candidate-shaped Head cannot be a Candidate success');
      assert.notEqual(result.kind, 'ALREADY_APPLIED', 'an invalid physical Candidate-shaped Head cannot be relabeled retained-operation success');
      assert.equal(after.stdout, before.stdout, 'the Adapter rejects the shaped Head without another branch movement');
      assert.equal(await exists(stateRoot), false, 'the Adapter seam publishes no State');
    });
  });
});
