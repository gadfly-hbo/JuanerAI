import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { lstat, mkdir, mkdtemp, readFile, readdir, realpath, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import * as production from './production.mjs';
import { createCoordinatorAdapters } from './adapters.mjs';
import { createCoordinatorCore } from './coordinator.mjs';

export const CHANGE_ID = 'CHG-dual-device-transition-foundation';
export const CHANGE_B = 'CHG-second-change';
export const REPOSITORY_ID = 'gadfly-hbo/JuanerAI';
export const GIT_SHA = '1'.repeat(40);
export const CANDIDATE_SHA = '2'.repeat(40);
export const SHA256 = 'a'.repeat(64);
export const GIT = '/Users/huangbo/Dev/Env/homebrew/bin/git';
export const NODE = process.execPath;
export const EMPTY_POINTER = Object.freeze({ schema_version: '1.0', active_change_id: null });
export const EVENT_CLASSES = Object.freeze(['CONTROLLER_COMMAND', 'AGENT_RUN', 'VALIDATION_RESULT', 'CANDIDATE_COMMITTED', 'BRANCH_PUSHED', 'HANDOFF_READY', 'BLOCKED']);
export const MACRO_STATES = Object.freeze(['READY', 'EXECUTING', 'DELIVERING', 'AWAITING_CONTROLLER', 'BLOCKED', 'CLOSED']);
export const PHASES = Object.freeze(['WORKTREE', 'SPEC', 'TEST_RED', 'WORKER_GREEN', 'REGRESSION', 'STAGE', 'CANDIDATE_COMMIT', 'FINAL_VALIDATION', 'VALIDATOR', 'BRANCH_PUSH', 'CANDIDATE_FREEZE', 'PR', 'HANDOFF']);
export const AGENT_STAGES = Object.freeze(['REQUESTED', 'STARTED', 'RESULT', 'START_FAILED', 'INTERRUPTED', 'NOT_STARTED']);
export const GIT_METHODS = Object.freeze(['inspectRepository', 'createOrReuseWorktree', 'inspectWorktree', 'stageExact', 'readStaged', 'commitCandidate', 'readCommit', 'pushBranch', 'readRemoteBranch', 'canonicalDiff', 'syncMainFfOnly']);
export const LEDGER_METHODS = Object.freeze(['readRemote', 'prepareAppend', 'commitAndPush', 'readRemoteAppend']);
// These field-by-field combinations remain regression inventory.  They do not
// authorize a TDD_READY blocker because none can create A-E safety effects.
export const DEFERRED_REGRESSION_CASES = Object.freeze([
  'all legal AgentBinding field permutations after exact binding is covered',
  'all legal ValidationReceipt kind/scope tuple permutations',
  'all legal GatewayReason variant permutations for non-safety failures',
  'all non-security optional diagnostics nullability permutations',
  'all canonical diff text/binary/path presentation permutations',
]);

export const TEST_AC_MAP = Object.freeze({
  'TEST-DTF-R1-001': ['AC-DTF-001-01', 'AC-DTF-001-03', 'AC-DTF-001-04', 'AC-DTF-001-07', 'AC-DTF-001-08'],
  'TEST-DTF-R1-002': ['AC-DTF-001-02', 'AC-DTF-001-05', 'AC-DTF-002-01', 'AC-DTF-002-02', 'AC-DTF-002-08'],
  'TEST-DTF-R1-003': ['AC-DTF-002-03', 'AC-DTF-002-04', 'AC-DTF-002-05', 'AC-DTF-002-06', 'AC-DTF-002-07'],
  'TEST-DTF-R1-004': ['AC-DTF-003-01', 'AC-DTF-003-02', 'AC-DTF-003-03', 'AC-DTF-003-04', 'AC-DTF-003-05', 'AC-DTF-003-06'],
  'TEST-DTF-R1-005': ['AC-DTF-005-01', 'AC-DTF-005-02', 'AC-DTF-005-05', 'AC-DTF-005-06', 'AC-DTF-005-07', 'AC-DTF-005-08'],
  'TEST-DTF-R1-006': ['AC-DTF-004-01'],
  'TEST-DTF-R1-007': ['AC-DTF-004-02', 'AC-DTF-004-03'],
  'TEST-DTF-R1-008': ['AC-DTF-004-04', 'AC-DTF-004-05', 'AC-DTF-004-06', 'AC-DTF-004-07', 'AC-DTF-004-08'],
  'TEST-DTF-R1-009': ['AC-DTF-005-03', 'AC-DTF-005-04'],
  'TEST-DTF-R1-010': ['AC-DTF-006-01', 'AC-DTF-006-02', 'AC-DTF-006-03', 'AC-DTF-006-04', 'AC-DTF-006-05', 'AC-DTF-006-06'],
  'TEST-DTF-R1-011': ['AC-DTF-001-06', 'AC-DTF-004-08', 'AC-DTF-007-05'],
  'TEST-DTF-R1-012': ['AC-DTF-007-01', 'AC-DTF-007-02', 'AC-DTF-007-03', 'AC-DTF-007-04', 'AC-DTF-007-06', 'AC-DTF-007-07'],
});

export const canonicalJson = value => Array.isArray(value)
  ? `[${value.map(canonicalJson).join(',')}]`
  : value && typeof value === 'object'
    ? `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(',')}}`
    : JSON.stringify(value);
export const bytes = value => new TextEncoder().encode(canonicalJson(value));
export const sha256 = value => createHash('sha256').update(value).digest('hex');
export const ok = value => ({ kind: 'OK', value, receipt_sha256: sha256(canonicalJson(value)) });
export const already = value => ({ kind: 'ALREADY_APPLIED', value, receipt_sha256: sha256(canonicalJson(value)) });
export const absent = expected_identity => ({ kind: 'ABSENT', reason: 'EXPECTED_IDENTITY_ABSENT', expected_identity });
export const conflict = observed_identity => ({ kind: 'CONFLICT', reason: 'CAS_CONFLICT', observed_identity });
export const ambiguous = partial_receipt => ({ kind: 'AMBIGUOUS', reason: 'REMOTE_AMBIGUOUS', partial_receipt });
export const unavailable = partial_receipt => ({ kind: 'UNAVAILABLE', reason: 'UNAVAILABLE', partial_receipt });

export async function createUnpublishedTestLedgerCommit({ root, change_id, expected_tip, prior_bytes, event_bytes, event_id }) {
  assert.match(expected_tip, /^[0-9a-f]{40}$/, 'an unpublished continuation requires the independently retained real predecessor');
  const remote = path.join(root, 'ledger-origin.git');
  const local = path.join(root, `unpublished-${sha256(event_id).slice(0, 12)}`);
  const pathInRef = `ledger/${change_id}.jsonl`;
  const git = async (cwd, ...args) => {
    const result = await runProcess(GIT, args, { cwd, env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC', GIT_TERMINAL_PROMPT: '0' } });
    assert.equal(result.code, 0, result.stderr);
    return result.stdout.trim();
  };
  await git(root, 'clone', '--no-checkout', remote, local);
  await git(local, 'config', 'user.name', 'JuanerAI Test Ledger');
  await git(local, 'config', 'user.email', 'ledger@invalid.example');
  await git(local, 'checkout', '--detach', expected_tip);
  const nextBytes = Buffer.concat([Buffer.from(prior_bytes), Buffer.from(event_bytes)]);
  await mkdir(path.dirname(path.join(local, pathInRef)), { recursive: true });
  await writeFile(path.join(local, pathInRef), nextBytes);
  await git(local, 'add', '--', pathInRef);
  await git(local, 'commit', '-m', event_id);
  const commit_sha = await git(local, 'rev-parse', 'HEAD');
  const parent_tip = await git(local, 'rev-parse', 'HEAD^');
  const tree_sha = await git(local, 'rev-parse', 'HEAD^{tree}');
  const committedBytes = await runProcess(GIT, ['show', `${commit_sha}:${pathInRef}`], { cwd: local, env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' } });
  assert.equal(committedBytes.code, 0, committedBytes.stderr);
  assert.deepEqual(Buffer.from(committedBytes.stdout), nextBytes, 'the real local evidence commit contains the exact prepared Ledger bytes');
  assert.equal(parent_tip, expected_tip, 'the unpublished evidence commit has the exact retained predecessor');
  const remoteTip = await git(root, '--git-dir', remote, 'rev-parse', 'refs/heads/evidence/agent-runs');
  assert.equal(remoteTip, expected_tip, 'creating the local evidence commit does not move the authoritative bare ref');
  const remoteObject = await runProcess(GIT, ['--git-dir', remote, 'cat-file', '-e', `${commit_sha}^{commit}`], { cwd: root, env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' } });
  assert.notEqual(remoteObject.code, 0, 'the local evidence commit object itself was not pushed into the authoritative bare repository');
  return Object.freeze({ local, commit_sha, parent_tip, tree_sha, next_bytes_sha256: sha256(nextBytes), next_byte_length: nextBytes.length });
}

export function createOneOperationMutex() {
  let held = false;
  return {
    tryAcquire: async () => { if (held) return false; held = true; return true; },
    release: async () => { assert.equal(held, true, 'only the holder can release the operation mutex'); held = false; },
    isHeld: () => held,
  };
}

const clone = value => structuredClone(value);
const pointerBytes = pointer => canonicalJson(pointer);
const stateBytes = state => canonicalJson(state);
const decodeCanonicalBody = command_body_bytes => {
  const raw = new TextDecoder().decode(command_body_bytes);
  const body = JSON.parse(raw);
  if (canonicalJson(body) !== raw) throw new SyntaxError('noncanonical command body');
  return body;
};
const verified = request => {
  const body = decodeCanonicalBody(request.command_body_bytes);
  return { kind: 'VERIFIED', body, verified_key_id: body.key_id, body_sha256: sha256(request.command_body_bytes), signature_sha256: sha256(request.signature_bytes) };
};
const rejected = error_code => ({ kind: 'REJECTED', error_code });

/** A stateful external-boundary double, never a Coordinator state machine. */
export function makeTestDependencies() {
  const calls = [];
  const faults = new Map();
  const stateStore = { pointer: clone(EMPTY_POINTER), state: null, localPause: null };
  const record = (name, request) => calls.push({ name, request: clone(request ?? null) });
  const take = (name, request, fallback) => { record(name, request); const queue = faults.get(name); if (queue?.length) return queue.shift(); return typeof fallback === 'function' ? fallback(request) : fallback; };
  const fault = (name, ...results) => faults.set(name, [...(faults.get(name) ?? []), ...results]);
  const one = createOneOperationMutex();
  const dependencies = {
    verifier: {
      verify: async request => {
        const result = take('verifier.verify', request, () => {
          try { return verified(request); } catch { return rejected('INPUT_INVALID'); }
        });
        assert.ok(result && (result.kind === 'VERIFIED' || result.kind === 'REJECTED'), 'verifier faults must be VERIFIED or REJECTED');
        if (result.kind === 'VERIFIED') assert.deepEqual(Object.keys(result).sort(), ['body', 'body_sha256', 'kind', 'signature_sha256', 'verified_key_id']);
        if (result.kind === 'REJECTED') assert.deepEqual(Object.keys(result).sort(), ['error_code', 'kind']);
        return result;
      },
    },
    state: {
      readPointer: async request => take('state.readPointer', request, () => ok({ bytes: pointerBytes(stateStore.pointer), sha256: sha256(pointerBytes(stateStore.pointer)) })),
      writePointer: async request => take('state.writePointer', request, () => { stateStore.pointer = clone(request.value ?? request.pointer); return ok({ bytes: pointerBytes(stateStore.pointer), sha256: sha256(pointerBytes(stateStore.pointer)) }); }),
      readState: async request => take('state.readState', request, () => stateStore.state === null ? absent('state') : ok({ bytes: stateBytes(stateStore.state), sha256: sha256(stateBytes(stateStore.state)), value: clone(stateStore.state) })),
      writeState: async request => take('state.writeState', request, () => { stateStore.state = clone(request.value ?? request.state); return ok({ bytes: stateBytes(stateStore.state), sha256: sha256(stateBytes(stateStore.state)) }); }),
      readLocalPause: async request => take('state.readLocalPause', request, () => stateStore.localPause === null
        ? absent('local-pause')
        : ok({ bytes: stateStore.localPause, sha256: sha256(stateStore.localPause) })),
      writeLocalPause: async request => take('state.writeLocalPause', request, () => {
        if (request.expected_sha256 !== null || typeof request.next_bytes !== 'string' || stateStore.localPause !== null) {
          return conflict(stateStore.localPause === null ? 'local-pause-absent' : sha256(stateStore.localPause));
        }
        stateStore.localPause = request.next_bytes;
        return ok({ bytes: stateStore.localPause, sha256: sha256(stateStore.localPause) });
      }),
    },
    git: Object.fromEntries(GIT_METHODS.map(name => [name, async request => take(`git.${name}`, request, () => ok(gitDefault(name, request)))])),
    ledger: Object.fromEntries(LEDGER_METHODS.map(name => [name, async request => take(`ledger.${name}`, request, () => ok(ledgerDefault(name, request)))])),
    pull_request: {
      queryCurrent: async request => take('pull_request.queryCurrent', request, () => absent('pr')),
      createOrReuse: async request => take('pull_request.createOrReuse', request, () => ok({ number: 42, url: 'https://invalid.example/pr/42', base: 'main', head_branch: request.head_branch, head_sha: request.head_sha, review_ready: true })),
      readback: async request => take('pull_request.readback', request, () => ok({ number: 42, head_sha: CANDIDATE_SHA, review_ready: true })),
    },
    validation: { execute: async request => take('validation.execute', request, () => { throw new Error('TEST_FIXTURE_UNSCRIPTED_VALIDATION_EXECUTE'); }) },
    handoff: { writeReadback: async request => take('handoff.writeReadback', request, () => ok({ handoff_sha256: request.expected_sha256 ?? SHA256, delivery_id: 'delivery-001' })) },
    clock: { now: () => '2026-08-25T00:00:00.000Z' }, ids: { next: kind => `${kind}-001` }, mutex: one,
  };
  return { dependencies, calls, faults, fault, stateStore, mutex: one, count: name => calls.filter(call => call.name === name).length };
}

function gitDefault(name, request = {}) {
  if (name === 'inspectRepository') return { canonical_root: '/tmp/dtf-repo', origin: 'origin', integration_branch: 'main', head_sha: GIT_SHA };
  if (name === 'createOrReuseWorktree') return { worktree_root: request.worktree_root ?? '/tmp/dtf-worktree', branch: request.branch ?? 'work/mac-mini/dtf', head_sha: GIT_SHA, baseline_sha: GIT_SHA, common_git_dir: '/tmp/dtf-repo/.git', clean: true };
  if (name === 'inspectWorktree') return { worktree_root: '/tmp/dtf-worktree', branch: 'work/mac-mini/dtf', head_sha: GIT_SHA, common_git_dir: '/tmp/dtf-repo/.git', status_entries: [], clean: true };
  if (name === 'stageExact' || name === 'readStaged') return { staged_paths: ['tools/harness/change-coordinator/coordinator.mjs'], index_tree: GIT_SHA, staged_paths_sha256: SHA256 };
  if (name === 'commitCandidate' || name === 'readCommit') return { sha: CANDIDATE_SHA, parent: GIT_SHA, tree: GIT_SHA, branch: 'work/mac-mini/dtf' };
  if (name === 'pushBranch') return { prior_remote_head: null, remote_head: CANDIDATE_SHA, forced: false, deleted: false };
  if (name === 'readRemoteBranch') return { remote_head: CANDIDATE_SHA };
  if (name === 'canonicalDiff') throw new Error('TEST_FIXTURE_UNSCRIPTED_CANONICAL_DIFF');
  return { prior_local_main: GIT_SHA, local_main: CANDIDATE_SHA, origin_main: CANDIDATE_SHA, clean: true, fast_forward_only: true };
}
function ledgerDefault(name, request = {}) {
  if (name === 'readRemote') return { remote_ref: 'refs/heads/evidence/agent-runs', expected_tip: null, tip: null, commit: null, tree: null, authoritative_path: `ledger/${CHANGE_ID}.jsonl`, file_present: false, prior_bytes_sha256: sha256(''), prior_byte_length: 0, last_event_id: null, last_event_hash: null, last_sequence: 0 };
  if (name === 'prepareAppend') return { event_id: 'event-001', event_hash: SHA256, sequence: 1, record_offset: 0, record_length: 1, idempotency_id: 'idem-001', prepared_bytes_sha256: SHA256 };
  if (name === 'commitAndPush') return { commit_sha: GIT_SHA, tree_sha: GIT_SHA, event_id: 'event-001', event_hash: SHA256, sequence: 1, idempotency_id: 'idem-001', push_status: 'ACKNOWLEDGED' };
  return { tip: GIT_SHA, commit_sha: GIT_SHA, tree_sha: GIT_SHA, event_id: 'event-001', event_hash: SHA256, sequence: 1, record_bytes_sha256: SHA256, idempotency_id: 'idem-001', linearized: true };
}
export function makeCandidate(overrides = {}) {
  return { sha: CANDIDATE_SHA, parent: GIT_SHA, tree: GIT_SHA, branch: 'work/mac-mini/dtf', validation_refs: [SHA256], validator_head: CANDIDATE_SHA, frozen: true, ...overrides };
}

export function makeDelivery(overrides = {}) {
  return { remote_head: CANDIDATE_SHA, canonical_diff_sha256: SHA256, pull_request: { number: 42, url: 'https://invalid.example/pr/42', base: 'main', head_branch: 'work/mac-mini/dtf', head_sha: CANDIDATE_SHA, review_ready: true }, handoff_sha256: SHA256, delivery_id: 'delivery-001', ...overrides };
}

/** Builds bytes matching the complete frozen CoordinatorStateV1 schema, not transitions. */
export function makeCoordinatorState(overrides = {}) {
  const { macro_state = 'READY', phase = 'WORKTREE', state_version = 0, change_id = CHANGE_ID, candidate = null, delivery = null, ...rest } = overrides;
  return {
    schema_version: '1.0', change_id, state_version, macro_state, phase,
    admission: { command_id: 'command-001', body_sha256: SHA256, idempotency_id: 'idem-001' },
    authorization_cycle: { command_id: 'command-001', command_kind: 'DISPATCH', auto_repair_attempt: 0 },
    repository: { baseline_sha: GIT_SHA, branch: 'work/mac-mini/dtf', worktree_root: '/tmp/dtf-worktree' },
    pending_agent: null, candidate, delivery, last_controller_command_id: 'command-001', blocked_reason: null,
    evidence: { remote_tip: GIT_SHA, last_event_id: 'event-001', last_event_hash: SHA256, last_readback_sha256: SHA256 },
    resume_target: null, ...rest,
  };
}

export function primeState(harness, options = {}) {
  const state = makeCoordinatorState(options);
  harness.stateStore.pointer = { schema_version: '1.0', active_change_id: state.change_id };
  harness.stateStore.state = state;
  return { state, expected_state_version: state.state_version, expected_state_hash: sha256(stateBytes(state)), pointer_sha256: sha256(pointerBytes(harness.stateStore.pointer)) };
}

export function makeDispatch(overrides = {}) {
  const role = (roleName, sandbox, allowed_paths) => ({ role: roleName, agent: roleName, model: 'gpt-5.6-terra', reasoning: 'high', sandbox, allowed_paths, brief_sha256: SHA256, input_sha256: SHA256, output_schema_sha256: SHA256 });
  return {
    schema_version: '1.0', command_id: 'command-001', key_id: 'test-key',
    repository: { repository_id: REPOSITORY_ID, canonical_root: '/tmp/dtf-repo', origin: 'origin', integration_branch: 'main' }, change_id: CHANGE_ID, command_kind: 'DISPATCH',
    payload: {
      acceptance_ids: ['AC-DTF-001-01'],
      roles: [role('juaner_spec', 'workspace-write', ['openspec/changes/dual-device-transition-foundation/**']), role('juaner_test', 'workspace-write', ['tools/harness/change-coordinator/**']), role('juaner_worker', 'workspace-write', ['tools/harness/change-coordinator/coordinator.mjs']), role('juaner_validator', 'read-only', [])],
      validations: [
        { id: 'regression-affected-suite', argv: ['node', '--test'], cwd: '/tmp/dtf-worktree', environment: {}, timeout_ms: 60000, subject: 'WORKTREE' },
        { id: 'regression-test-asset-retirement', argv: ['node', '--test'], cwd: '/tmp/dtf-worktree', environment: {}, timeout_ms: 60000, subject: 'WORKTREE' },
        { id: 'final-validation-candidate', argv: ['node', '--test'], cwd: '/tmp/dtf-worktree', environment: {}, timeout_ms: 60000, subject: 'CANDIDATE' },
      ], delivery_base: 'main', auto_repair_limit: 1, expected_pointer_sha256: sha256(pointerBytes(EMPTY_POINTER)),
    },
    scope: { allowed_paths: ['tools/harness/change-coordinator/coordinator.mjs'], forbidden_paths: [] }, worktree: { branch: 'work/mac-mini/dtf', root: '/tmp/dtf-worktree', baseline_sha: GIT_SHA }, expected_state_version: null, expected_state_hash: null, nonce: 'A'.repeat(43) + '=', issued_at: '2026-08-25T00:00:00.000Z', expires_at: '2026-08-25T00:01:00.000Z', idempotency_id: 'idem-001', receipt_digest: SHA256, evidence_refs: [], ...overrides,
  };
}

export async function createCoordinatorUnderTest() { const module = await import('./coordinator.mjs'); assert.equal(typeof module.createTestCoordinator, 'function', 'CAUSAL_PREREQUISITE: frozen production must export createTestCoordinator(dependencies) for deterministic Reduced V1 contract tests'); const harness = makeTestDependencies(); const coordinator = await module.createTestCoordinator(harness.dependencies); assert.deepEqual(Reflect.ownKeys(coordinator).sort(), ['applyControllerCommand', 'run', 'settlement', 'status']); return { coordinator, ...harness }; }
export function assertExactResult(result, { operation, outcome, state = undefined, code = undefined }) { assert.equal(result.operation, operation); assert.equal(result.outcome, outcome); if (state !== undefined) assert.equal(result.state, state); if (code !== undefined) assert.equal(result.error_code, code); }
export function assertReducedTraceability() { const expected = Array.from({ length: 7 }, (_, requirement) => Array.from({ length: [8, 8, 6, 8, 8, 6, 7][requirement] }, (_, ac) => `AC-DTF-${String(requirement + 1).padStart(3, '0')}-${String(ac + 1).padStart(2, '0')}`)).flat(); assert.deepEqual(Object.keys(TEST_AC_MAP), Array.from({ length: 12 }, (_, index) => `TEST-DTF-R1-${String(index + 1).padStart(3, '0')}`)); assert.deepEqual([...new Set(Object.values(TEST_AC_MAP).flat())].sort(), expected.sort()); }

export async function run(command, args, options = {}) { return new Promise((resolve, reject) => { const child = spawn(command, args, { ...options, shell: false }); let stdout = ''; let stderr = ''; child.stdout?.setEncoding('utf8'); child.stderr?.setEncoding('utf8'); child.stdout?.on('data', value => { stdout += value; }); child.stderr?.on('data', value => { stderr += value; }); child.once('error', reject); child.once('close', (code, signal) => resolve({ code, signal, stdout, stderr })); }); }
const runProcess = run;

export const snapshotCanonicalDiffData = value => {
  if (Buffer.isBuffer(value)) return Buffer.from(value);
  if (Array.isArray(value)) {
    const descriptors = Object.getOwnPropertyDescriptors(value);
    if (!Object.values(descriptors).every(descriptor => Object.hasOwn(descriptor, 'value'))) return value;
    return value.map(snapshotCanonicalDiffData);
  }
  if (value === null || typeof value !== 'object') return value;
  if (Object.getPrototypeOf(value) !== Object.prototype) return value;
  const copy = {};
  for (const key of Reflect.ownKeys(value)) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor || !Object.hasOwn(descriptor, 'value')) return value;
    copy[key] = snapshotCanonicalDiffData(descriptor.value);
  }
  return copy;
};
export const snapshotObservedGitResult = (method, value) => method === 'canonicalDiff' ? snapshotCanonicalDiffData(value) : structuredClone(value);
export const wrapCandidateStageValueForCore = value => ok(value);

export const signed = body => ({ command_body_bytes: bytes(body), signature_bytes: new Uint8Array([1, 2, 3]) });

export const validationPurposes = Object.freeze([
  { id: 'regression-affected-suite', validation_kind: 'REGRESSION', validation_scope: 'AFFECTED_SUITE', subject: 'WORKTREE' },
  { id: 'regression-test-asset-retirement', validation_kind: 'REGRESSION', validation_scope: 'TEST_ASSET_RETIREMENT', subject: 'WORKTREE' },
  { id: 'final-validation-candidate', validation_kind: 'FINAL_VALIDATION', validation_scope: 'CANDIDATE', subject: 'CANDIDATE' },
]);


export function expectedExecutionDefinitions(signedDefinitions) {
  return validationPurposes.map(purpose => {
    const signedDefinition = signedDefinitions.find(definition => definition.id === purpose.id);
    assert.ok(signedDefinition, `independent oracle requires ${purpose.id}`);
    assert.equal(signedDefinition.subject, purpose.subject);
    return { id: signedDefinition.id, validation_kind: purpose.validation_kind, validation_scope: purpose.validation_scope, subject: signedDefinition.subject, argv: signedDefinition.argv, cwd: signedDefinition.cwd, environment: signedDefinition.environment, timeout_ms: signedDefinition.timeout_ms };
  });
}

export function expectedWorktreeReceipt(subject, definition, snapshot, stdout, stderr) {
  const receipt = {
    validation_id: definition.id, validation_kind: definition.validation_kind, validation_scope: definition.validation_scope,
    status: 'COMPLETED', verdict: 'PASS', failure_code: null,
    command_definition_sha256: sha256(canonicalJson(definition)), receipt_sha256: null,
    subject_kind: 'WORKTREE', subject_sha: subject.head_sha, repository_root: subject.repository_root,
    worktree_root: subject.worktree_root, branch: subject.branch, head_sha: subject.head_sha,
    common_git_dir: subject.common_git_dir, execution_cwd: definition.cwd, scope_sha256: snapshot.scope_sha256,
    worktree_snapshot_sha256: snapshot.worktree_snapshot_sha256, candidate_sha: null, candidate_tree: null,
    stdout_sha256: sha256(stdout), stderr_sha256: sha256(stderr), validator_head: null, idempotency_id: definition.id,
  };
  const { receipt_sha256, ...preimage } = receipt;
  receipt.receipt_sha256 = sha256(canonicalJson(preimage));
  return receipt;
}

export function expectedCandidateReceipt(subject, definition, tuple, stdout, stderr, execution_cwd = definition.cwd) {
  const receipt = {
    validation_id: definition.id, validation_kind: definition.validation_kind, validation_scope: definition.validation_scope,
    status: tuple.status, verdict: tuple.verdict, failure_code: tuple.failure_code,
    command_definition_sha256: sha256(canonicalJson(definition)), receipt_sha256: null,
    subject_kind: 'CANDIDATE', subject_sha: subject.candidate_sha, repository_root: subject.repository_root,
    worktree_root: subject.worktree_root, branch: subject.branch, head_sha: subject.head_sha,
    common_git_dir: subject.common_git_dir, execution_cwd,
    scope_sha256: sha256(canonicalJson({ allowed_paths: subject.allowed_paths, forbidden_paths: subject.forbidden_paths })),
    worktree_snapshot_sha256: null, candidate_sha: subject.candidate_sha, candidate_tree: subject.candidate_tree,
    stdout_sha256: sha256(stdout), stderr_sha256: sha256(stderr), validator_head: null, idempotency_id: definition.id,
  };
  const { receipt_sha256, ...preimage } = receipt;
  receipt.receipt_sha256 = sha256(canonicalJson(preimage));
  return receipt;
}

export function assertExactWorktreeReceipt(actual, expected) {
  assert.deepEqual(Object.keys(actual).sort(), Object.keys(expected).sort(), 'the receipt remains the closed 24-field execution receipt');
  assert.deepEqual(actual, expected, 'all receipt values come from the independent Test oracle');
  assert.equal(sha256(canonicalJson(actual)), sha256(canonicalJson(expected)), 'outer receipt preimage is independently exact');
}

export async function freshWorktreeSubject(repository, worktree, allowed_paths = ['tracked.txt'], forbidden_paths = []) {
  const git = async (...args) => {
    const result = await runProcess(GIT, args, { cwd: worktree, env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' } });
    assert.equal(result.code, 0, result.stderr);
    return result.stdout.trim();
  };
  return {
    kind: 'WORKTREE', repository_root: await realpath(repository), worktree_root: await realpath(worktree),
    branch: await git('branch', '--show-current'), head_sha: await git('rev-parse', 'HEAD'),
    common_git_dir: await realpath(await git('rev-parse', '--path-format=absolute', '--git-common-dir')),
    allowed_paths, forbidden_paths,
  };
}

export async function independentTrackedSnapshot(subject, changedPaths = ['tracked.txt']) {
  const git = async args => {
    const result = await runProcess(GIT, args, { cwd: subject.worktree_root, env: {} });
    assert.equal(result.code, 0, result.stderr);
    assert.equal(result.signal, null);
    return Buffer.from(result.stdout);
  };
  const status_stdout = await git(['status', '--porcelain=v1', '-z', '--untracked-files=all', '--no-renames']);
  const ignored_status_stdout = await git(['status', '--porcelain=v1', '-z', '--untracked-files=all', '--no-renames', '--ignored=matching']);
  const sortedPaths = [...changedPaths].sort((left, right) => Buffer.compare(Buffer.from(left), Buffer.from(right)));
  const expectedStatus = Buffer.from(sortedPaths.map(candidate => ` M ${candidate}\0`).join(''));
  assert.deepEqual(status_stdout, expectedStatus, 'the independent oracle observes exactly the Test-owned real Worker files in raw-byte order');
  assert.deepEqual(ignored_status_stdout, status_stdout, 'there is no ignored status authority in this Test-owned Worktree');
  const scope_sha256 = sha256(canonicalJson({ allowed_paths: subject.allowed_paths, forbidden_paths: subject.forbidden_paths }));
  const entries = [];
  for (const candidate of sortedPaths) {
    const tracked = path.join(subject.worktree_root, candidate);
    const stat = await lstat(tracked, { bigint: true });
    assert.equal(stat.isFile(), true);
    const mode = (stat.mode & 0o111n) === 0n ? '100644' : '100755';
    const content_sha256 = sha256(await readFile(tracked));
    entries.push(Buffer.concat([
      Buffer.from(candidate), Buffer.from([0]), Buffer.from(' M'), Buffer.from([0]), Buffer.from('FILE'), Buffer.from([0]),
      Buffer.from(mode), Buffer.from([0]), Buffer.from(content_sha256), Buffer.from([0]),
    ]));
  }
  const preimage = Buffer.concat([
    Buffer.from('JUANERAI_WORKTREE_SNAPSHOT_V1', 'ascii'), Buffer.from([0]),
    Buffer.from(subject.repository_root), Buffer.from([0]), Buffer.from(subject.worktree_root), Buffer.from([0]),
    Buffer.from(subject.branch), Buffer.from([0]), Buffer.from(subject.head_sha), Buffer.from([0]),
    Buffer.from(subject.common_git_dir), Buffer.from([0]), Buffer.from(scope_sha256), Buffer.from([0]),
    Buffer.from(sha256(status_stdout)), Buffer.from([0]), ...entries,
  ]);
  return { scope_sha256, raw_inventory_sha256: sha256(status_stdout), worktree_snapshot_sha256: sha256(preimage) };
}

export async function withRepository(action, { includeSecondBaseline = false } = {}) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'juanerai-m2-production-chain-'));
  const canonicalRoot = await realpath(root);
  const repository = path.join(canonicalRoot, 'repository');
  const worktree = path.join(canonicalRoot, 'worktree');
  const git = async (...args) => {
    const result = await runProcess(GIT, args, { cwd: worktree, env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' } });
    assert.equal(result.code, 0, result.stderr);
    return result.stdout.trim();
  };
  try {
    await runProcess(GIT, ['init', '-b', 'main', repository], { cwd: root, env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' } });
    await runProcess(GIT, ['-C', repository, 'config', 'user.name', 'JuanerAI Test'], { cwd: root, env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' } });
    await runProcess(GIT, ['-C', repository, 'config', 'user.email', 'test@invalid.example'], { cwd: root, env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' } });
    await writeFile(path.join(repository, 'tracked.txt'), 'baseline\n');
    if (includeSecondBaseline) await writeFile(path.join(repository, 'second.txt'), 'second baseline\n');
    await runProcess(GIT, ['-C', repository, 'add', '--', 'tracked.txt', ...(includeSecondBaseline ? ['second.txt'] : [])], { cwd: root, env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' } });
    await runProcess(GIT, ['-C', repository, 'commit', '-m', 'baseline'], { cwd: root, env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' } });
    const baseline = await runProcess(GIT, ['-C', repository, 'rev-parse', 'HEAD'], { cwd: root, env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' } });
    const baseline_sha = baseline.stdout.trim();
    await runProcess(GIT, ['-C', repository, 'worktree', 'add', '-b', 'work/mac-mini/m2-test', worktree, baseline_sha], { cwd: root, env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' } });
    await writeFile(path.join(worktree, 'tracked.txt'), 'candidate\n');
    await git('add', '--', 'tracked.txt');
    await git('commit', '-m', 'candidate');
    const candidate_sha = await git('rev-parse', 'HEAD');
    const candidate_tree = await git('rev-parse', `${candidate_sha}^{tree}`);
    const common = await git('rev-parse', '--path-format=absolute', '--git-common-dir');
    await action({ root, repository, worktree, baseline_sha, candidate_sha, candidate_tree, common_git_dir: common });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}


export async function withObservedK1Prefix(continuation, controls = {}) {
  return withRepository(async fixture => {
    const fixtureRoot = path.dirname(fixture.repository);
    const deliveryRemote = path.join(fixtureRoot, 'delivery-origin.git');
    const initDeliveryRemote = await runProcess(GIT, ['init', '--bare', deliveryRemote], { cwd: fixtureRoot, env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' } });
    assert.equal(initDeliveryRemote.code, 0, initDeliveryRemote.stderr);
    const addDeliveryRemote = await runProcess(GIT, ['remote', 'add', 'origin', deliveryRemote], { cwd: fixture.repository, env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' } });
    assert.equal(addDeliveryRemote.code, 0, addDeliveryRemote.stderr);
    const pushBaseline = await runProcess(GIT, ['push', '--set-upstream', 'origin', 'main'], { cwd: fixture.repository, env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC', GIT_TERMINAL_PROMPT: '0' } });
    assert.equal(pushBaseline.code, 0, pushBaseline.stderr);
    const stateRoot = path.join(fixtureRoot, 'core-state');
    const coreWorktree = path.join(fixtureRoot, 'core-worktree');
    const ordinaryRoleResultRoot = path.join(fixtureRoot, 'ordinary-role-results');
    await mkdir(stateRoot, { recursive: true });
    await writeFile(path.join(stateRoot, 'active-change.json'), canonicalJson({ schema_version: '1.0', active_change_id: null }));
    const adapterOptions = { repository_root: fixture.repository, state_root: stateRoot, device: 'mac-mini', process_run_id: 'm2-regression-prefix', git_executable: GIT, pull_request_executable: '/usr/bin/false', base_environment: {} };
    const base = createCoordinatorAdapters(adapterOptions);
    const command = makeDispatch({
      issued_at: '2026-09-06T00:00:00.000Z', expires_at: '2026-09-06T00:01:00.000Z',
      repository: { repository_id: 'gadfly-hbo/JuanerAI', canonical_root: fixture.repository, origin: 'origin', integration_branch: 'main' },
      worktree: { branch: 'work/mac-mini/m2-regression', root: coreWorktree, baseline_sha: fixture.baseline_sha },
      scope: controls.scope ?? { allowed_paths: ['tracked.txt'], forbidden_paths: [] },
    });
    const signedValidationDefinitions = [
      { id: 'regression-test-asset-retirement', argv: [NODE, '-e', 'process.stdout.write("retirement-regression\\n")'], cwd: coreWorktree, environment: {}, timeout_ms: 10_000, subject: 'WORKTREE' },
      { id: 'final-validation-candidate', argv: [NODE, '-e', 'process.stdout.write("candidate-final\\n")'], cwd: coreWorktree, environment: {}, timeout_ms: 10_000, subject: 'CANDIDATE' },
      { id: 'regression-affected-suite', argv: [NODE, '-e', 'process.stdout.write("affected-regression\\n")'], cwd: coreWorktree, environment: {}, timeout_ms: 10_000, subject: 'WORKTREE' },
    ];
    for (const definition of signedValidationDefinitions) {
      const replacement = controls.validationArgvById?.[definition.id];
      if (replacement) definition.argv = [...replacement];
    }
    command.payload.validations = signedValidationDefinitions;
    const expectedDefinitions = expectedExecutionDefinitions(signedValidationDefinitions).slice(0, 2);
    const observedLedgerReadbacks = [];
    const ledger = await createLocalBareLedger(fixture.root, command.change_id, observedLedgerReadbacks);
    if (controls.seedLedger) await controls.seedLedger({ ledger, command, fixture, fixtureRoot, coreWorktree });
    const gatewayEvents = [];
    let gatewayEventSequence = 0;
    let postWorkerArmed = false;
    let candidatePublished = false;
    let ledgerFaultArmed = controls.armLedgerFaultAfterValidationId === undefined;
    let finalBoundaryLedgerFaultArmed = controls.armLedgerFaultAfterPullRequestMethod === undefined;
    let preparedLedgerEventClass = null;
    const faultHits = [];
    const observeGateway = (gateway, target, method) => async originalRequest => {
      const invocation = ++gatewayEventSequence;
      let request = structuredClone(originalRequest);
      if (gateway === 'state' && !postWorkerArmed && controls.transformAdmissionStateRequest) request = await controls.transformAdmissionStateRequest({ method, request, faultHits });
      if (gateway === 'ledger' && postWorkerArmed && controls.transformLedgerRequest) request = await controls.transformLedgerRequest({ method, request, faultHits, ledger, command });
      if (gateway === 'state' && postWorkerArmed && controls.transformStateRequest) request = await controls.transformStateRequest({ method, request, faultHits });
      gatewayEvents.push({ sequence: ++gatewayEventSequence, invocation, edge: 'START', gateway, method, request: structuredClone(request) });
      try {
        const operationTarget = gateway === 'ledger' && controls.ledgerRoute?.target
          ? controls.ledgerRoute.target
          : target;
        const actualResult = await operationTarget[method](request);
        const faultsBefore = faultHits.length;
        if (gateway === 'ledger' && method === 'prepareAppend' && actualResult?.kind === 'OK') {
          const eventBytes = Buffer.from(request.event_bytes);
          preparedLedgerEventClass = JSON.parse(eventBytes.subarray(0, -1).toString('utf8')).event_class;
        }
        let result = actualResult;
        if (gateway === 'ledger' && !postWorkerArmed && controls.transformAdmissionLedgerResult) result = await controls.transformAdmissionLedgerResult({ method, event_class: preparedLedgerEventClass, request: structuredClone(request), actualResult: structuredClone(actualResult), faultHits });
        if (gateway === 'ledger' && postWorkerArmed && ledgerFaultArmed && finalBoundaryLedgerFaultArmed && controls.transformLedgerResult) result = await controls.transformLedgerResult({ method, event_class: preparedLedgerEventClass, request: structuredClone(request), actualResult: structuredClone(actualResult), faultHits, fixtureRoot, command });
        if (gateway === 'state' && postWorkerArmed && controls.transformStateResult) result = await controls.transformStateResult({ method, request: structuredClone(request), actualResult: structuredClone(actualResult), faultHits });
        gatewayEvents.push({ sequence: ++gatewayEventSequence, invocation, edge: 'COMPLETE', gateway, method, actual_result: structuredClone(actualResult), result: structuredClone(result), faulted: faultHits.length > faultsBefore });
        if (!finalBoundaryLedgerFaultArmed && gateway === 'pull_request' && method === controls.armLedgerFaultAfterPullRequestMethod) {
          finalBoundaryLedgerFaultArmed = true;
          gatewayEvents.push({ sequence: ++gatewayEventSequence, edge: 'ARM', gateway: 'test-control', method: 'ledger-post-pull-request', pull_request_method: method });
        }
        return result;
      } catch (error) {
        gatewayEvents.push({ sequence: ++gatewayEventSequence, invocation, edge: 'THROW', gateway, method, error_code: error?.code ?? null });
        throw error;
      }
    };
    const localPausePath = path.join(stateRoot, 'local-pause.json');
    const stateTarget = Object.freeze({
      ...base.state,
      async readLocalPause() {
        try {
          const pauseBytes = await readFile(localPausePath, 'utf8');
          return ok({ bytes: pauseBytes, sha256: sha256(pauseBytes) });
        } catch (error) {
          if (error?.code === 'ENOENT') return absent(localPausePath);
          throw error;
        }
      },
      async writeLocalPause(request) {
        assert.deepEqual(Object.keys(request).sort(), ['expected_sha256', 'next_bytes']);
        const priorBytes = await readFile(localPausePath, 'utf8').catch(error => error?.code === 'ENOENT' ? null : Promise.reject(error));
        const priorSha = priorBytes === null ? null : sha256(priorBytes);
        if (request.expected_sha256 !== priorSha) return { kind: 'CONFLICT', reason: 'CAS_CONFLICT', observed_identity: priorSha };
        assert.equal(typeof request.next_bytes, 'string');
        await writeFile(localPausePath, request.next_bytes);
        return ok({ bytes: request.next_bytes, sha256: sha256(request.next_bytes) });
      },
    });
    const ledgerTarget = ledger;
    const observedState = Object.freeze({
      ...stateTarget,
      readPointer: observeGateway('state', stateTarget, 'readPointer'),
      writePointer: observeGateway('state', stateTarget, 'writePointer'),
      readState: observeGateway('state', stateTarget, 'readState'),
      writeState: observeGateway('state', stateTarget, 'writeState'),
      readLocalPause: observeGateway('state', stateTarget, 'readLocalPause'),
      writeLocalPause: observeGateway('state', stateTarget, 'writeLocalPause'),
    });
    const observedLedger = Object.freeze({
      ...ledgerTarget,
      readRemote: observeGateway('ledger', ledgerTarget, 'readRemote'),
      prepareAppend: observeGateway('ledger', ledgerTarget, 'prepareAppend'),
      commitAndPush: observeGateway('ledger', ledgerTarget, 'commitAndPush'),
      readRemoteAppend: observeGateway('ledger', ledgerTarget, 'readRemoteAppend'),
    });
    const observedValidationRequests = [];
    const observedValidationActualResults = [];
    const observedValidationResults = [];
    const realValidation = production.createValidationGateway({ nodeExecutable: NODE });
    const validation = Object.freeze({ execute: async request => {
      const invocation = ++gatewayEventSequence;
      gatewayEvents.push({ sequence: ++gatewayEventSequence, invocation, edge: 'START', gateway: 'validation', method: 'execute', request: structuredClone(request) });
      observedValidationRequests.push(structuredClone(request));
      const actual = await realValidation.execute(request);
      observedValidationActualResults.push(structuredClone(actual));
      gatewayEvents.push({ sequence: ++gatewayEventSequence, invocation, edge: 'COMPLETE', gateway: 'validation', method: 'execute', actual_result: structuredClone(actual), result: structuredClone(actual), faulted: false });
      if (!ledgerFaultArmed && request.definition.id === controls.armLedgerFaultAfterValidationId) {
        ledgerFaultArmed = true;
        gatewayEvents.push({ sequence: ++gatewayEventSequence, edge: 'ARM', gateway: 'test-control', method: 'ledger-post-validation', validation_id: request.definition.id });
      }
      const faultsBefore = faultHits.length;
      const result = postWorkerArmed && controls.transformValidationResult ? await controls.transformValidationResult(actual, request, faultHits) : actual;
      observedValidationResults.push(structuredClone(result));
      gatewayEvents.push({ sequence: ++gatewayEventSequence, invocation, edge: 'DELIVER', gateway: 'validation', method: 'execute', actual_result: structuredClone(actual), result: structuredClone(result), faulted: faultHits.length > faultsBefore });
      return result;
    } });
    let candidateStageGateway = null;
    const observedStageRequests = [];
    const purposeBoundStage = () => {
      assert.equal(typeof production.createCandidateStageGateway, 'function', 'the continuous K1 prefix defers acquisition of the approved production stage factory until Core actually reaches STAGE');
      candidateStageGateway ??= production.createCandidateStageGateway({ gitExecutable: GIT });
      return candidateStageGateway;
    };
    const invokeCandidateStage = async (method, request) => {
      const actualResult = await purposeBoundStage()[method](request);
      const result = postWorkerArmed && controls.transformCandidateStageValue
        ? await controls.transformCandidateStageValue({ method, request: structuredClone(request), actualResult: structuredClone(actualResult), faultHits })
        : actualResult;
      return wrapCandidateStageValueForCore(result);
    };
    let canonicalDiffInvocationCount = 0;
    const invokeGit = (method, operation) => async originalRequest => {
      const invocation = ++gatewayEventSequence;
      let request = structuredClone(originalRequest);
      if (postWorkerArmed && controls.transformGitRequest) request = await controls.transformGitRequest({ method, request, faultHits });
      gatewayEvents.push({ sequence: ++gatewayEventSequence, invocation, edge: 'START', gateway: 'git', method, request: structuredClone(request) });
      try {
        if (postWorkerArmed && controls.beforeGitMethod) await controls.beforeGitMethod({ method, request: structuredClone(request), faultHits });
        const actualResult = controls.invokeGitOperation
          ? await controls.invokeGitOperation({ method, request: structuredClone(request), operation, fixtureRoot, command, faultHits })
          : await operation(request);
        if (method === 'canonicalDiff') canonicalDiffInvocationCount += 1;
        if (postWorkerArmed && controls.afterGitMethod) await controls.afterGitMethod({ method, request: structuredClone(request), actualResult: snapshotObservedGitResult(method, actualResult), faultHits });
        const faultsBefore = faultHits.length;
        const result = postWorkerArmed && (!controls.armGitFaultAfterCandidate || candidatePublished) && controls.transformGitResult ? await controls.transformGitResult({ method, request: structuredClone(request), actualResult: snapshotObservedGitResult(method, actualResult), faultHits }) : actualResult;
        gatewayEvents.push({ sequence: ++gatewayEventSequence, invocation, edge: 'COMPLETE', gateway: 'git', method, actual_result: snapshotObservedGitResult(method, actualResult), result: snapshotObservedGitResult(method, result), faulted: faultHits.length > faultsBefore });
        return result;
      } catch (error) {
        gatewayEvents.push({ sequence: ++gatewayEventSequence, invocation, edge: 'THROW', gateway: 'git', method, error_code: error?.code ?? null });
        throw error;
      }
    };
    const git = Object.freeze({
      ...base.git,
      createOrReuseWorktree: observeGateway('git', base.git, 'createOrReuseWorktree'),
      inspectWorktree: invokeGit('inspectWorktree', request => base.git.inspectWorktree(request)),
      stageExact: invokeGit('stageExact', request => { observedStageRequests.push({ method: 'stageExact', request: structuredClone(request) }); return invokeCandidateStage('stageExact', request); }),
      readStaged: invokeGit('readStaged', request => { observedStageRequests.push({ method: 'readStaged', request: structuredClone(request) }); return invokeCandidateStage('readStaged', request); }),
      commitCandidate: invokeGit('commitCandidate', request => base.git.commitCandidate(request)),
      readCommit: invokeGit('readCommit', request => base.git.readCommit(request)),
      pushBranch: invokeGit('pushBranch', request => base.git.pushBranch(request)),
      readRemoteBranch: invokeGit('readRemoteBranch', request => base.git.readRemoteBranch(request)),
      canonicalDiff: invokeGit('canonicalDiff', request => base.git.canonicalDiff(request)),
    });
    const pullRequestTarget = controls.pull_request ?? base.pull_request;
    const handoffTarget = controls.handoff ?? base.handoff;
    const observedPullRequest = Object.freeze({
      ...pullRequestTarget,
      queryCurrent: observeGateway('pull_request', pullRequestTarget, 'queryCurrent'),
      createOrReuse: observeGateway('pull_request', pullRequestTarget, 'createOrReuse'),
      readback: observeGateway('pull_request', pullRequestTarget, 'readback'),
    });
    const observedHandoff = Object.freeze({ ...handoffTarget, writeReadback: observeGateway('handoff', handoffTarget, 'writeReadback') });
    const verifier = controls.verifier ?? { async verify(request) { const body = JSON.parse(Buffer.from(request.command_body_bytes).toString('utf8')); return { kind: 'VERIFIED', body, verified_key_id: body.key_id, body_sha256: sha256(request.command_body_bytes), signature_sha256: sha256(request.signature_bytes) }; } };
    const dependencies = { ...base, state: observedState, git, ledger: observedLedger, validation, pull_request: observedPullRequest, handoff: observedHandoff, clock: { now: () => '2026-09-06T00:00:30.000Z' }, verifier };
    const restartCore = () => createCoordinatorCore(dependencies);
    const restartFreshCanonicalDiffCore = () => {
      const freshBase = createCoordinatorAdapters(adapterOptions);
      const freshGit = Object.freeze({ ...freshBase.git, canonicalDiff: invokeGit('canonicalDiff', request => freshBase.git.canonicalDiff(request)) });
      return createCoordinatorCore({ ...dependencies, git: freshGit });
    };
    const core = createCoordinatorCore(dependencies);
    const expectedRoleOrder = ['juaner_spec', 'juaner_test', 'juaner_worker'];
    let settledRoles = 0;
    const settledActions = [];
    const settlePass = async (response, { afterStarted = null } = {}) => {
      assert.equal(response.outcome, 'AGENT_ACTION', 'future suffix asset accepts only a public Agent action');
      const action = response.payload.action; const { action_kind, ...binding } = action;
      settledActions.push(structuredClone(action));
      assert.equal(action.role, expectedRoleOrder[settledRoles], 'future suffix asset preserves the signed Spec/Test/Worker role order');
      if (controls.afterAgentAction) await controls.afterAgentAction({ core, command, response, action: structuredClone(action), gatewayEvents, settledRoles });
      const started = await core.settlement({ change_id: command.change_id, expected_state_version: response.state_version, expected_state_hash: response.state_hash, settlement: { ...binding, stage: 'STARTED', observed_child_id: `${action.role}-child` } });
      assert.equal(started.outcome, 'WAITING', 'RESULT is legal only after a valid public STARTED settlement');
      if (afterStarted) await afterStarted();
      const artifact_path = path.join(ordinaryRoleResultRoot, `${action.correlation_id}.json`);
      const artifactBytes = Buffer.from(canonicalJson({ status: 'PASS' }));
      await mkdir(path.dirname(artifact_path), { recursive: true }); await writeFile(artifact_path, artifactBytes);
      const settled = await core.settlement({ change_id: command.change_id, expected_state_version: started.state_version, expected_state_hash: started.state_hash, settlement: { ...binding, stage: 'RESULT', observed_child_id: `${action.role}-child`, status: 'PASS', artifact_path, artifact_sha256: sha256(artifactBytes) } });
      assert.equal(settled.outcome, 'ADVANCED', 'future suffix asset requires a valid RESULT transition');
      settledRoles += 1;
      return settled;
    };
    const dispatch = await core.applyControllerCommand(signed(command));
    if (controls.stopAfterDispatch === true) return continuation({ base, command, core, restartCore, dispatch, fixture, fixtureRoot, ledger: observedLedger, primaryLedger: ledgerTarget, localPausePath, ordinaryRoleResultRoot, observedLedgerReadbacks, gatewayEvents, faultHits });
    assert.equal(dispatch.outcome, 'APPLIED', canonicalJson(dispatch));
    if (controls.afterDispatch) await controls.afterDispatch({ base, command, core, dispatch, fixture, fixtureRoot, ledger: observedLedger, primaryLedger: ledgerTarget, observedLedgerReadbacks });
    const afterSpec = await settlePass(await core.run({ change_id: command.change_id, expected_state_version: dispatch.state_version, expected_state_hash: dispatch.state_hash }));
    const afterTest = await settlePass(await core.run({ change_id: command.change_id, expected_state_version: afterSpec.state_version, expected_state_hash: afterSpec.state_hash }));
    const workerAction = await core.run({ change_id: command.change_id, expected_state_version: afterTest.state_version, expected_state_hash: afterTest.state_hash });
    const workerWrites = controls.workerWrites ?? { 'tracked.txt': 'actual worker output\n' };
    const workerChangedPaths = Object.keys(workerWrites).sort((left, right) => Buffer.compare(Buffer.from(left), Buffer.from(right)));
    const afterWorker = await settlePass(workerAction, { afterStarted: async () => {
      for (const [candidate, contents] of Object.entries(workerWrites)) await writeFile(path.join(coreWorktree, candidate), contents);
    } });
    assert.equal(afterWorker.payload.to_phase, 'REGRESSION');
    postWorkerArmed = true;
    gatewayEvents.push({ sequence: ++gatewayEventSequence, edge: 'ARM', gateway: 'test-control', method: 'postWorker', state_version: afterWorker.state_version, state_hash: afterWorker.state_hash });
    if (controls.stopAfterWorker === true) return continuation({ base, command, core, restartCore, afterWorker, coreWorktree, fixture, fixtureRoot, ledger: observedLedger, primaryLedger: ledgerTarget, localPausePath, ordinaryRoleResultRoot, observedLedgerReadbacks, gatewayEvents, faultHits, observedStageRequests, observedValidationRequests, observedValidationActualResults, observedValidationResults });
    const expectedSubject = await freshWorktreeSubject(fixture.repository, coreWorktree, command.scope.allowed_paths, command.scope.forbidden_paths);
    const expectedSnapshot = await independentTrackedSnapshot(expectedSubject, workerChangedPaths);
    const expectedReceipts = [
      expectedWorktreeReceipt(expectedSubject, expectedDefinitions[0], expectedSnapshot, 'affected-regression\n', ''),
      expectedWorktreeReceipt(expectedSubject, expectedDefinitions[1], expectedSnapshot, 'retirement-regression\n', ''),
    ];
    const regression = await core.run({ change_id: command.change_id, expected_state_version: afterWorker.state_version, expected_state_hash: afterWorker.state_hash });
    assert.deepEqual(observedValidationRequests, expectedDefinitions.map(definition => ({ definition, subject: expectedSubject })), 'only observed public Core requests can prove the fixed-order eight-field derivation');
    assert.equal(observedValidationResults.length, 2, 'the real Gateway returns one result for each observed Core request');
    for (const [index, result] of observedValidationResults.entries()) {
      assert.equal(result.kind, 'OK');
      assertExactWorktreeReceipt(result.value, expectedReceipts[index]);
      assert.equal(result.receipt_sha256, sha256(canonicalJson(expectedReceipts[index])), 'each real Gateway outer receipt hashes the complete independent expected receipt');
    }
    assert.equal(regression.outcome, 'ADVANCED');
    assert.equal(regression.payload.to_phase, 'STAGE');
    const remote = await readLocalLedger(ledger, command.change_id);
    assert.equal(remote.kind, 'OK');
    const remoteBytes = Buffer.from(remote.value.ledger_bytes_base64, 'base64');
    assert.equal(remoteBytes.toString('base64'), remote.value.ledger_bytes_base64, 'remote Ledger bytes retain canonical padded base64');
    assert.equal(sha256(remoteBytes), remote.value.prior_bytes_sha256, 'remote Ledger byte hash is independently exact');
    assert.equal(remoteBytes.length, remote.value.prior_byte_length, 'remote Ledger byte length is independently exact');
    const recordBytes = remoteBytes.subarray(0, -1).toString('utf8').split('\n').map(value => Buffer.from(`${value}\n`));
    const records = recordBytes.map(value => JSON.parse(value.toString('utf8')));
    const suffix = records.slice(-2);
    assert.equal(suffix.length, 2, 'future Regression transition appends exactly two receipt records before STAGE');
    for (const [index, record] of suffix.entries()) {
      const recordIndex = records.length - 2 + index;
      const exactRecordBytes = recordBytes[recordIndex];
      assert.equal(record.event_class, 'VALIDATION_RESULT');
      const receipt = record.detail;
      assertExactWorktreeReceipt(receipt, expectedReceipts[index]);
      assert.equal(record.schema_version, '1.0');
      assert.equal(record.change_id, command.change_id);
      assert.equal(record.state_version, afterWorker.state_version, 'each Regression record uses the real supporting State version, not zero');
      assert.equal(record.subject_sha, expectedSubject.head_sha, 'each Regression record binds the freshly observed Worktree Head, not a placeholder');
      assert.equal(record.idempotency_id, receipt.idempotency_id, 'record-level idempotency retains the real receipt context');
      assert.equal(record.event_hash, sha256(canonicalJson({ schema_version: record.schema_version, event_id: record.event_id, sequence: record.sequence, event_class: record.event_class, idempotency_id: record.idempotency_id, change_id: record.change_id, occurred_at: record.occurred_at, state_version: record.state_version, subject_sha: record.subject_sha, detail: record.detail })), 'event hash covers the exact remote record context');
      assert.equal(exactRecordBytes.toString('utf8'), `${canonicalJson(record)}\n`, 'remote record bytes are canonical one-record-plus-LF bytes');
      const readback = observedLedgerReadbacks.filter(entry => entry.event.event_class === 'VALIDATION_RESULT').slice(-2)[index];
      assert.ok(readback, 'each real validation record has a pass-through observed Ledger readback');
      assert.equal(readback.result.kind, 'OK');
      assert.equal(readback.result.value.remote_ref, 'refs/heads/evidence/agent-runs');
      assert.equal(readback.result.value.authoritative_path, remote.value.authoritative_path);
      assert.equal(readback.result.value.event_id, record.event_id);
      assert.equal(readback.result.value.event_hash, record.event_hash);
      assert.equal(readback.result.value.sequence, record.sequence);
      assert.equal(readback.result.value.record_offset, recordBytes.slice(0, recordIndex).reduce((sum, bytes) => sum + bytes.length, 0));
      assert.equal(readback.result.value.record_length, exactRecordBytes.length);
      assert.equal(readback.result.value.record_bytes_sha256, sha256(exactRecordBytes), 'readback hashes exactly the remote record slice, not a reconstructed detail');
      assert.equal(readback.result.value.idempotency_id, record.idempotency_id);
      assert.equal(readback.result.value.linearized, true);
      const readbackBytes = await runProcess(GIT, ['--git-dir', path.join(fixtureRoot, 'ledger-origin.git'), 'show', `${readback.result.value.tip}:${remote.value.authoritative_path}`], { cwd: fixtureRoot, env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' } });
      assert.equal(readbackBytes.code, 0, readbackBytes.stderr);
      const readbackTree = await runProcess(GIT, ['--git-dir', path.join(fixtureRoot, 'ledger-origin.git'), 'rev-parse', `${readback.result.value.tip}^{tree}`], { cwd: fixtureRoot, env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' } });
      assert.equal(readbackTree.code, 0, readbackTree.stderr);
      assert.equal(readback.result.value.commit_sha, readback.result.value.tip);
      assert.equal(readback.result.value.tree_sha, readbackTree.stdout.trim(), 'each readback retains its own remote tree identity');
      assert.deepEqual(Buffer.from(readbackBytes.stdout), Buffer.concat(recordBytes.slice(0, recordIndex + 1)), 'each remote readback contains exactly the Ledger prefix through its own record');
      if (index === 0) assert.notEqual(readback.result.value.tip, remote.value.tip, 'first Regression readback predates the second append');
      else { assert.equal(readback.result.value.tip, remote.value.tip); assert.equal(readback.result.value.tree_sha, remote.value.tip_tree); }
    }
    assert.equal(suffix[1].sequence, suffix[0].sequence + 1, 'the two remote Regression records are adjacent in the observed ledger sequence');
    assert.deepEqual(suffix.map(record => record.detail.subject_sha), [expectedSubject.head_sha, expectedSubject.head_sha]);
    assert.deepEqual(suffix.map(record => record.detail.scope_sha256), [expectedSnapshot.scope_sha256, expectedSnapshot.scope_sha256]);
    assert.deepEqual(suffix.map(record => record.detail.worktree_snapshot_sha256), [expectedSnapshot.worktree_snapshot_sha256, expectedSnapshot.worktree_snapshot_sha256]);
    if (controls.stopAtStage === true) return continuation({ base, command, core, restartCore, restartFreshCanonicalDiffCore, canonicalDiffInvocationCount: () => canonicalDiffInvocationCount, afterWorker, regression, expectedSubject, expectedSnapshot, expectedReceipts, coreWorktree, fixture, fixtureRoot, ledger: observedLedger, primaryLedger: ledgerTarget, localPausePath, ordinaryRoleResultRoot, observedLedgerReadbacks, gatewayEvents, faultHits, observedStageRequests, observedValidationRequests, observedValidationActualResults, observedValidationResults });
    const candidateTransition = await core.run({ change_id: command.change_id, expected_state_version: regression.state_version, expected_state_hash: regression.state_hash });
    assert.equal(candidateTransition.outcome, 'ADVANCED', 'one public invocation must finish K1 rather than return a persisted CANDIDATE_COMMIT intermediate');
    assert.equal(candidateTransition.payload.to_phase, 'FINAL_VALIDATION');
    const candidateRemote = await readLocalLedger(ledger, command.change_id);
    assert.equal(candidateRemote.kind, 'OK');
    const candidateRecords = Buffer.from(candidateRemote.value.ledger_bytes_base64, 'base64').subarray(0, -1).toString('utf8').split('\n').map(line => JSON.parse(line));
    const candidateEvent = candidateRecords.at(-1);
    assert.equal(candidateEvent.event_class, 'CANDIDATE_COMMITTED');
    assert.deepEqual(Object.keys(candidateEvent.detail).sort(), ['branch', 'candidate_sha', 'parent', 'staged_paths', 'staged_paths_sha256', 'tree', 'worktree_snapshot_sha256']);
    assert.equal(candidateEvent.detail.parent, expectedSubject.head_sha);
    assert.equal(candidateEvent.detail.branch, expectedSubject.branch);
    assert.deepEqual(candidateEvent.detail.staged_paths, workerChangedPaths);
    assert.equal(candidateEvent.detail.staged_paths_sha256, sha256(canonicalJson(workerChangedPaths)));
    assert.equal(candidateEvent.detail.worktree_snapshot_sha256, expectedSnapshot.worktree_snapshot_sha256);
    assert.match(candidateEvent.detail.candidate_sha, /^[0-9a-f]{40}$/);
    assert.match(candidateEvent.detail.tree, /^[0-9a-f]{40}$/);
    const candidateParent = await runProcess(GIT, ['rev-parse', `${candidateEvent.detail.candidate_sha}^`], { cwd: coreWorktree, env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' } });
    const candidateTree = await runProcess(GIT, ['rev-parse', `${candidateEvent.detail.candidate_sha}^{tree}`], { cwd: coreWorktree, env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' } });
    const candidateHead = await runProcess(GIT, ['rev-parse', 'HEAD'], { cwd: coreWorktree, env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' } });
    const candidateBranch = await runProcess(GIT, ['branch', '--show-current'], { cwd: coreWorktree, env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' } });
    const candidateIndex = await runProcess(GIT, ['write-tree'], { cwd: coreWorktree, env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' } });
    const candidateStatus = await runProcess(GIT, ['status', '--porcelain=v1', '-z', '--untracked-files=all', '--ignored=matching', '--no-renames'], { cwd: coreWorktree, env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' } });
    const candidateBytes = await runProcess(GIT, ['show', `${candidateEvent.detail.tree}:tracked.txt`], { cwd: coreWorktree, env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' } });
    for (const result of [candidateParent, candidateTree, candidateHead, candidateBranch, candidateIndex, candidateStatus, candidateBytes]) assert.equal(result.code, 0, result.stderr);
    assert.equal(candidateParent.stdout.trim(), expectedSubject.head_sha);
    assert.equal(candidateTree.stdout.trim(), candidateEvent.detail.tree);
    assert.equal(candidateHead.stdout.trim(), candidateEvent.detail.candidate_sha);
    assert.equal(candidateBranch.stdout.trim(), expectedSubject.branch);
    assert.equal(candidateIndex.stdout.trim(), candidateEvent.detail.tree);
    assert.equal(candidateStatus.stdout, '');
    assert.equal(candidateBytes.stdout, 'actual worker output\n', 'the Candidate tree independently contains the ordinary Worker bytes validated by both Regression receipts');
    const stateReadback = await base.state.readState({ change_id: command.change_id });
    assert.equal(stateReadback.kind, 'OK');
    const state = JSON.parse(stateReadback.value.bytes);
    assert.equal(stateReadback.value.bytes, canonicalJson(state), 'State readback bytes are canonical and independently parse to the asserted Candidate state');
    assert.equal(stateReadback.value.sha256, sha256(stateReadback.value.bytes));
    assert.equal(candidateTransition.state_hash, stateReadback.value.sha256);
    assert.equal(state.macro_state, 'DELIVERING');
    assert.equal(state.phase, 'FINAL_VALIDATION');
    assert.deepEqual(state.candidate, { sha: candidateEvent.detail.candidate_sha, parent: expectedSubject.head_sha, tree: candidateEvent.detail.tree, branch: expectedSubject.branch, validation_refs: [], validator_head: null, frozen: false });

    candidatePublished = true;
    return continuation({ base, command, core, restartCore, restartFreshCanonicalDiffCore, canonicalDiffInvocationCount: () => canonicalDiffInvocationCount, afterWorker, regression, candidateTransition, candidateEvent, expectedSubject, expectedSnapshot, coreWorktree, deliveryRemote, fixture, fixtureRoot, ledger: observedLedger, primaryLedger: ledgerTarget, localPausePath, ordinaryRoleResultRoot, observedLedgerReadbacks, gatewayEvents, faultHits, observedStageRequests, settledActions });
  }, { includeSecondBaseline: controls.includeSecondBaseline === true });
}

export function ordinaryValidatorFinding(action, overrides = {}) {
  return {
    finding_id: 'finding-ordinary-001', classification: 'IMPLEMENTATION_IN_SCOPE',
    requirement_ids: ['REQ-M2-004'], acceptance_ids: ['AC-M2-004-02'], paths: ['tracked.txt'],
    summary: 'ordinary public-Core repair finding',
    evidence_refs: [{ kind: 'TEST', id: '007-L01', sha256: sha256(`007:${action.subject_sha}`), subject_sha: action.subject_sha }],
    ...overrides,
  };
}

export function ordinaryValidatorFindings(action) {
  return [
    ordinaryValidatorFinding(action),
    ordinaryValidatorFinding(action, {
      finding_id: 'finding-ordinary-002', acceptance_ids: ['AC-M2-004-03'],
      summary: 'second sorted ordinary public-Core repair finding',
      evidence_refs: [{ kind: 'TEST', id: '007-L02', sha256: sha256(`007:second:${action.subject_sha}`), subject_sha: action.subject_sha }],
    }),
  ];
}

export async function settleOrdinaryValidatorForBoundary(context, suffix) {
  const { command, core, candidateEvent, candidateTransition, ordinaryRoleResultRoot } = context;
  const candidateValidation = await core.run({ change_id: command.change_id, expected_state_version: candidateTransition.state_version, expected_state_hash: candidateTransition.state_hash }); assert.equal(candidateValidation.outcome, 'ADVANCED');
  const validatorAction = await core.run({ change_id: command.change_id, expected_state_version: candidateValidation.state_version, expected_state_hash: candidateValidation.state_hash }); assert.equal(validatorAction.outcome, 'AGENT_ACTION');
  const action = validatorAction.payload.action; const { action_kind, ...binding } = action; const childId = `011-boundary-${suffix}`;
  const started = await core.settlement({ change_id: command.change_id, expected_state_version: validatorAction.state_version, expected_state_hash: validatorAction.state_hash, settlement: { ...binding, stage: 'STARTED', observed_child_id: childId } }); assert.equal(started.outcome, 'WAITING');
  const artifact = { schema_version: '1.0', change_id: command.change_id, candidate_sha: candidateEvent.detail.candidate_sha, validator_head: candidateEvent.detail.candidate_sha, verdict: 'PASS', findings: [], risks: [], unverified: [], open_questions: [] };
  const artifactBytes = Buffer.from(canonicalJson(artifact)); const artifactPath = path.join(ordinaryRoleResultRoot, `${action.correlation_id}.${suffix}.json`); await mkdir(path.dirname(artifactPath), { recursive: true }); await writeFile(artifactPath, artifactBytes);
  const validatorPass = await core.settlement({ change_id: command.change_id, expected_state_version: started.state_version, expected_state_hash: started.state_hash, settlement: { ...binding, stage: 'RESULT', observed_child_id: childId, status: 'PASS', artifact_path: artifactPath, artifact_sha256: sha256(artifactBytes), validator_artifact: artifact } }); assert.equal(validatorPass.outcome, 'ADVANCED');
  return { validatorPass, binding };
}

export async function reachOrdinaryRepairAction(context, { findings = null, stopAfterValidatorResult = false } = {}) {
  const { command, core, candidateTransition, ordinaryRoleResultRoot } = context;
  const candidateValidation = await core.run({ change_id: command.change_id, expected_state_version: candidateTransition.state_version, expected_state_hash: candidateTransition.state_hash });
  assert.equal(candidateValidation.outcome, 'ADVANCED'); assert.equal(candidateValidation.payload.to_phase, 'VALIDATOR');
  const validatorAction = await core.run({ change_id: command.change_id, expected_state_version: candidateValidation.state_version, expected_state_hash: candidateValidation.state_hash });
  assert.equal(validatorAction.outcome, 'AGENT_ACTION'); assert.equal(validatorAction.payload.action.role, 'juaner_validator');
  const validator = validatorAction.payload.action; const { action_kind, ...validatorBinding } = validator;
  const started = await core.settlement({ change_id: command.change_id, expected_state_version: validatorAction.state_version, expected_state_hash: validatorAction.state_hash, settlement: { ...validatorBinding, stage: 'STARTED', observed_child_id: 'ordinary-validator-repair-source' } });
  assert.equal(started.outcome, 'WAITING');
  const artifact = {
    schema_version: '1.0', change_id: command.change_id, candidate_sha: validator.subject_sha, validator_head: validator.subject_sha,
    verdict: 'FAIL', findings: findings ?? ordinaryValidatorFindings(validator), risks: [], unverified: [], open_questions: [],
  };
  const artifactBytes = Buffer.from(canonicalJson(artifact));
  const artifactPath = path.join(ordinaryRoleResultRoot, `${validator.correlation_id}.eligible-fail.json`);
  await mkdir(path.dirname(artifactPath), { recursive: true }); await writeFile(artifactPath, artifactBytes);
  const artifactInventoryBeforeResult = (await readdir(ordinaryRoleResultRoot)).sort();
  const readbackFrontierBeforeValidatorResult = context.observedLedgerReadbacks.length;
  const beforeValidatorResult = await context.base.state.readState({ change_id: command.change_id }); assert.equal(beforeValidatorResult.kind, 'OK');
  const validatorFailed = await core.settlement({ change_id: command.change_id, expected_state_version: started.state_version, expected_state_hash: started.state_hash, settlement: { ...validatorBinding, stage: 'RESULT', observed_child_id: 'ordinary-validator-repair-source', status: 'FAIL', artifact_path: artifactPath, artifact_sha256: sha256(artifactBytes), validator_artifact: artifact } });
  if (stopAfterValidatorResult) return { candidateValidation, validatorAction, validator, validatorBinding, started, artifact, artifactBytes, artifactPath, artifactInventoryBeforeResult, readbackFrontierBeforeValidatorResult, beforeValidatorResult, validatorFailed, repairAction: null };
  assert.equal(validatorFailed.outcome, 'ADVANCED'); assert.equal(validatorFailed.payload.to_phase, 'TEST_RED');
  const repairAction = await core.run({ change_id: command.change_id, expected_state_version: validatorFailed.state_version, expected_state_hash: validatorFailed.state_hash });
  assert.equal(repairAction.outcome, 'AGENT_ACTION'); assert.equal(repairAction.payload.action.role, 'juaner_test');
  return { candidateValidation, validatorAction, validator, validatorBinding, started, artifact, artifactBytes, artifactPath, artifactInventoryBeforeResult, readbackFrontierBeforeValidatorResult, beforeValidatorResult, validatorFailed, repairAction };
}



export function makeTestLedgerEventBytes({
  change_id, event_class, detail, sequence, state_version, subject_sha, idempotency_id,
  occurred_at = '2026-09-06T00:00:00.000Z',
  event_id = null,
}) {
  const event = {
    schema_version: '1.0', event_id: event_id ?? `evt-${sha256(canonicalJson({ change_id, event_class, detail, sequence, state_version, subject_sha, idempotency_id })).slice(0, 24)}`,
    sequence, event_class, idempotency_id, change_id, occurred_at, state_version, subject_sha, detail,
  };
  event.event_hash = sha256(canonicalJson(event));
  return Buffer.from(`${canonicalJson(event)}\n`);
}

export async function readLocalLedger(ledger, change_id, expected_tip = null) {
  return ledger.readRemote({ remote_ref: 'refs/heads/evidence/agent-runs', expected_tip, change_id });
}

export async function createLocalBareLedger(root, changeId, observedReadbacks = [], { resume = false } = {}) {
  const remote = path.join(root, 'ledger-origin.git');
  const work = path.join(root, 'ledger-work');
  const pathInRef = `ledger/${changeId}.jsonl`;
  const remoteRef = 'refs/heads/evidence/agent-runs';
  const exactCall = (value, keys) => value !== null && typeof value === 'object' && !Array.isArray(value)
    && Object.keys(value).length === keys.length && keys.every(key => Object.hasOwn(value, key));
  const conflict = observed_identity => ({ kind: 'CONFLICT', reason: 'CAS_CONFLICT', observed_identity });
  const git = async (cwd, ...args) => {
    const result = await runProcess(GIT, args, { cwd, env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC', GIT_TERMINAL_PROMPT: '0' } });
    assert.equal(result.code, 0, result.stderr);
    return result.stdout.trim();
  };
  if (!resume) {
    await git(root, 'init', '--bare', remote);
    await git(root, 'init', '-b', 'evidence', work);
    await git(work, 'config', 'user.name', 'JuanerAI Test Ledger');
    await git(work, 'config', 'user.email', 'ledger@invalid.example');
    await git(work, 'remote', 'add', 'origin', remote);
  }
  let bytesOnRemote = Buffer.alloc(0); let prepared = null; let lastCommitted = null; let lastRemoteRead = null;
  const read = async () => {
    const listed = await runProcess(GIT, ['--git-dir', remote, 'rev-parse', '--verify', remoteRef], { cwd: root, env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' } });
    if (listed.code !== 0) return { tip: null, parent: null, tree: null, bytes: Buffer.alloc(0), file_present: false };
    const tip = listed.stdout.trim();
    const shown = await runProcess(GIT, ['--git-dir', remote, 'show', `${tip}:${pathInRef}`], { cwd: root, env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' } });
    assert.equal(shown.code, 0, shown.stderr);
    const tree = await git(root, '--git-dir', remote, 'rev-parse', `${tip}^{tree}`);
    const parentResult = await runProcess(GIT, ['--git-dir', remote, 'rev-parse', `${tip}^`], { cwd: root, env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' } });
    const parent = parentResult.code === 0 ? parentResult.stdout.trim() : null;
    return { tip, parent, tree, bytes: Buffer.from(shown.stdout), file_present: true };
  };
  if (resume) {
    const current = await read();
    bytesOnRemote = current.bytes;
  }
  const decodeEventBytes = eventBytes => {
    if (!(eventBytes instanceof Uint8Array) || eventBytes.length < 2 || eventBytes.at(-1) !== 0x0a
      || eventBytes.subarray(0, -1).includes(0x0a)) return null;
    try {
      const raw = Buffer.from(eventBytes).subarray(0, -1).toString('utf8');
      const event = JSON.parse(raw);
      if (canonicalJson(event) !== raw || event.change_id !== changeId) return null;
      const { event_hash, ...preimage } = event;
      if (event_hash !== sha256(canonicalJson(preimage))) return null;
      return event;
    } catch { return null; }
  };
  const preservedEntriesHash = async tip => {
    if (tip === null) return sha256(Buffer.alloc(0));
    const listed = await runProcess(GIT, ['--git-dir', remote, 'ls-tree', '-rz', '--full-tree', tip], { cwd: root, env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' } });
    assert.equal(listed.code, 0, listed.stderr);
    const entries = Buffer.from(listed.stdout).toString('utf8').split('\0').filter(Boolean)
      .filter(entry => !entry.endsWith(`\t${pathInRef}`)).sort();
    return sha256(Buffer.from(entries.length ? `${entries.join('\0')}\0` : ''));
  };
  return Object.freeze({
    async readRemote(request) {
      if (!exactCall(request, ['remote_ref', 'expected_tip', 'change_id']) || request.remote_ref !== remoteRef
        || request.change_id !== changeId || !(request.expected_tip === null || /^[0-9a-f]{40}$/.test(request.expected_tip))) return conflict('ledger-read-request-contract');
      const remoteRead = await read();
      assert.deepEqual(remoteRead.bytes, bytesOnRemote, 'local bare remote is the Ledger byte authority');
      const last = remoteRead.bytes.length ? JSON.parse(remoteRead.bytes.toString('utf8').trim().split('\n').at(-1)) : null;
      const result = ok({ remote_ref: remoteRef, expected_tip: request.expected_tip, tip: remoteRead.tip, tip_parent: remoteRead.parent, tip_tree: remoteRead.tree, authoritative_path: pathInRef, file_present: remoteRead.file_present, ledger_bytes_base64: remoteRead.bytes.toString('base64'), prior_bytes_sha256: sha256(remoteRead.bytes), prior_byte_length: remoteRead.bytes.length, last_event_id: last?.event_id ?? null, last_event_hash: last?.event_hash ?? null, last_sequence: last?.sequence ?? 0 });
      lastRemoteRead = { receipt_sha256: result.receipt_sha256, value: structuredClone(result.value), bytes: Buffer.from(remoteRead.bytes) };
      return result;
    },
    async prepareAppend(request) {
      if (!exactCall(request, ['remote_read_receipt_sha256', 'expected_tip', 'prior_bytes', 'event_bytes'])
        || !lastRemoteRead || request.remote_read_receipt_sha256 !== lastRemoteRead.receipt_sha256
        || request.expected_tip !== lastRemoteRead.value.tip || !(request.prior_bytes instanceof Uint8Array)
        || !Buffer.from(request.prior_bytes).equals(lastRemoteRead.bytes) || !lastRemoteRead.bytes.equals(bytesOnRemote)) return conflict('ledger-prepare-request-contract');
      const event = decodeEventBytes(request.event_bytes);
      if (!event || event.sequence !== lastRemoteRead.value.last_sequence + 1) return conflict('ledger-event-bytes-contract');
      const priorBytes = Buffer.from(request.prior_bytes); const record = Buffer.from(request.event_bytes);
      const next = Buffer.concat([priorBytes, record]);
      const receipt = {
        remote_ref: remoteRef, expected_tip: request.expected_tip, authoritative_path: pathInRef,
        prior_bytes_sha256: sha256(priorBytes), prior_byte_length: priorBytes.length,
        new_bytes_sha256: sha256(next), new_byte_length: next.length,
        event_id: event.event_id, event_hash: event.event_hash, sequence: event.sequence,
        record_offset: priorBytes.length, record_length: record.length,
        idempotency_id: event.idempotency_id, prepared_bytes_sha256: sha256(next),
      };
      prepared = { remoteRead: lastRemoteRead, event, record, next, receipt };
      return ok(receipt);
    },
    async commitAndPush(request) {
      if (!exactCall(request, ['prepared_receipt', 'idempotency_id']) || !prepared
        || canonicalJson(request.prepared_receipt) !== canonicalJson(prepared.receipt)
        || request.idempotency_id !== prepared.receipt.idempotency_id) return conflict('ledger-commit-request-contract');
      const receipt = request.prepared_receipt;
      const preservedBefore = await preservedEntriesHash(receipt.expected_tip);
      await mkdir(path.dirname(path.join(work, pathInRef)), { recursive: true });
      await writeFile(path.join(work, pathInRef), prepared.next);
      await git(work, 'add', '--', pathInRef); await git(work, 'commit', '-m', prepared.event.event_id);
      await git(work, 'push', 'origin', `HEAD:${remoteRef}`);
      bytesOnRemote = prepared.next;
      const remoteRead = await read(); assert.deepEqual(remoteRead.bytes, bytesOnRemote);
      const value = {
        remote_ref: remoteRef, parent_tip: receipt.expected_tip, commit_sha: remoteRead.tip, tree_sha: remoteRead.tree,
        authoritative_path: pathInRef, changed_paths: [pathInRef],
        preserved_entries_sha256_before: preservedBefore, preserved_entries_sha256_after: await preservedEntriesHash(remoteRead.tip),
        prior_bytes_sha256: receipt.prior_bytes_sha256, prior_byte_length: receipt.prior_byte_length,
        new_bytes_sha256: receipt.new_bytes_sha256, new_byte_length: receipt.new_byte_length,
        event_id: receipt.event_id, event_hash: receipt.event_hash, sequence: receipt.sequence,
        record_offset: receipt.record_offset, record_length: receipt.record_length,
        idempotency_id: receipt.idempotency_id, push_status: 'ACKNOWLEDGED',
      };
      lastCommitted = { value: structuredClone(value), prepared };
      return ok(value);
    },
    async readRemoteAppend(request) {
      if (!exactCall(request, ['expected_commit', 'event_id', 'event_hash', 'idempotency_id']) || !lastCommitted
        || request.expected_commit !== lastCommitted.value.commit_sha || request.event_id !== lastCommitted.value.event_id
        || request.event_hash !== lastCommitted.value.event_hash || request.idempotency_id !== lastCommitted.value.idempotency_id) return conflict('ledger-append-readback-request-contract');
      const remoteRead = await read(); assert.deepEqual(remoteRead.bytes, bytesOnRemote);
      const receipt = lastCommitted.value; const event = lastCommitted.prepared.event;
      assert.equal(remoteRead.tip, request.expected_commit); assert.equal(remoteRead.tree, receipt.tree_sha);
      const record = remoteRead.bytes.subarray(receipt.record_offset, receipt.record_offset + receipt.record_length);
      assert.deepEqual(record, lastCommitted.prepared.record);
      const result = ok({
        remote_ref: remoteRef, tip: remoteRead.tip, parent_tip: receipt.parent_tip, commit_sha: remoteRead.tip, tree_sha: remoteRead.tree,
        authoritative_path: pathInRef, prior_bytes_sha256: receipt.prior_bytes_sha256, prior_byte_length: receipt.prior_byte_length,
        new_bytes_sha256: receipt.new_bytes_sha256, new_byte_length: receipt.new_byte_length,
        event_id: event.event_id, event_hash: event.event_hash, sequence: event.sequence,
        record_offset: receipt.record_offset, record_length: receipt.record_length, record_bytes_sha256: sha256(record),
        idempotency_id: event.idempotency_id, linearized: true,
      });
      observedReadbacks.push({ request: structuredClone(request), event: structuredClone(event), result: structuredClone(result) });
      return result;
    },
  });
}

export async function appendTestLedgerEvent(ledger, {
  change_id, event_class, detail, state_version, subject_sha, idempotency_id, occurred_at = '2026-09-06T00:00:00.000Z', event_id = null,
}) {
  const prior = await readLocalLedger(ledger, change_id);
  assert.equal(prior.kind, 'OK');
  const priorBytes = Buffer.from(prior.value.ledger_bytes_base64, 'base64');
  assert.equal(priorBytes.toString('base64'), prior.value.ledger_bytes_base64);
  const eventBytes = makeTestLedgerEventBytes({
    change_id, event_class, detail, sequence: prior.value.last_sequence + 1,
    state_version, subject_sha, idempotency_id, occurred_at, event_id,
  });
  const event = JSON.parse(eventBytes.subarray(0, -1).toString('utf8'));
  const prepared = await ledger.prepareAppend({
    remote_read_receipt_sha256: prior.receipt_sha256,
    expected_tip: prior.value.tip,
    prior_bytes: priorBytes,
    event_bytes: eventBytes,
  });
  assert.equal(prepared.kind, 'OK');
  const committed = await ledger.commitAndPush({ prepared_receipt: prepared.value, idempotency_id });
  assert.equal(committed.kind, 'OK');
  const readback = await ledger.readRemoteAppend({
    expected_commit: committed.value.commit_sha,
    event_id: event.event_id,
    event_hash: event.event_hash,
    idempotency_id,
  });
  assert.equal(readback.kind, 'OK');
  return { prior, priorBytes, eventBytes, event, prepared, committed, readback };
}
export async function assertTemporaryGitFixtureHealthy() { const root = await mkdtemp(path.join(os.tmpdir(), 'juanerai-dtf-r1-')); try { const remote = path.join(root, 'origin.git'); const seed = path.join(root, 'seed'); const left = path.join(root, 'left'); const right = path.join(root, 'right'); const git = async (cwd, ...args) => { const result = await run('/Users/huangbo/Dev/Env/homebrew/bin/git', args, { cwd, env: { LC_ALL: 'C', PATH: process.env.PATH } }); assert.equal(result.code, 0, result.stderr); return result.stdout.trim(); }; await git(root, 'init', '--bare', remote); await git(root, 'init', '-b', 'main', seed); await git(seed, 'config', 'user.name', 'JuanerAI Test'); await git(seed, 'config', 'user.email', 'test@invalid.example'); await writeFile(path.join(seed, 'tracked.txt'), 'baseline\n'); await git(seed, 'add', '--', 'tracked.txt'); await git(seed, 'commit', '-m', 'baseline'); await git(seed, 'remote', 'add', 'origin', remote); await git(seed, 'push', '-u', 'origin', 'main'); await git(remote, 'symbolic-ref', 'HEAD', 'refs/heads/main'); await git(root, 'clone', remote, left); await git(root, 'clone', remote, right); for (const cloneRoot of [left, right]) { await git(cloneRoot, 'config', 'user.name', 'JuanerAI Test'); await git(cloneRoot, 'config', 'user.email', 'test@invalid.example'); await writeFile(path.join(cloneRoot, 'tracked.txt'), 'candidate\n'); await git(cloneRoot, 'add', '--', 'tracked.txt'); const tree = await git(cloneRoot, 'write-tree'); await git(cloneRoot, 'commit', '-m', 'candidate'); const head = await git(cloneRoot, 'rev-parse', 'HEAD'); assert.equal(await git(cloneRoot, 'rev-parse', `${head}^{tree}`), tree); assert.equal(await git(cloneRoot, 'rev-parse', `${head}^`), await git(cloneRoot, 'rev-parse', 'origin/main')); } const environment = { LC_ALL: 'C', LANG: 'C', TZ: 'UTC', GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: '/dev/null', GIT_ATTR_NOSYSTEM: '1', GIT_PAGER: 'cat', PAGER: 'cat', GIT_TERMINAL_PROMPT: '0', GIT_NO_REPLACE_OBJECTS: '1' }; const args = ['--no-pager', '-c', 'color.ui=false', '-c', 'core.quotePath=true', '-c', 'diff.algorithm=myers', '-c', 'diff.mnemonicPrefix=false', '-c', 'diff.noprefix=false', 'diff', '--binary', '--full-index', '--no-ext-diff', '--no-textconv', '--no-renames', '--src-prefix=a/', '--dst-prefix=b/', 'origin/main..HEAD', '--']; const a = await run('/Users/huangbo/Dev/Env/homebrew/bin/git', args, { cwd: left, env: environment }); const b = await run('/Users/huangbo/Dev/Env/homebrew/bin/git', args, { cwd: right, env: environment }); assert.equal(a.code, 0, a.stderr); assert.equal(b.code, 0, b.stderr); assert.notEqual(a.stdout, ''); assert.equal(a.stdout, b.stdout); return sha256(a.stdout); } finally { await rm(root, { recursive: true, force: true }); } }
export async function assertHelperHealth() { assert.equal(canonicalJson({ b: 2, a: [true, null] }), '{"a":[true,null],"b":2}'); assert.equal(sha256('Reduced V1'), '2866d5017433bc2f5f75a4ae47a14d2db47f05626cb015baabc6e678c78a673a'); assertReducedTraceability(); assert.equal(DEFERRED_REGRESSION_CASES.some(value => /auth|wip|ledger|candidate|validator|pr head|release|pointer/i.test(value)), false, 'A-E safety negatives cannot be deferred'); const mutex = createOneOperationMutex(); assert.equal(await mutex.tryAcquire(), true); assert.equal(await mutex.tryAcquire(), false); await mutex.release(); assert.equal(await mutex.tryAcquire(), true); await mutex.release(); const harness = makeTestDependencies(); assert.deepEqual(Object.keys(harness.dependencies.git).sort(), [...GIT_METHODS].sort()); assert.deepEqual(Object.keys(harness.dependencies.ledger).sort(), [...LEDGER_METHODS].sort()); const command_body_bytes = bytes(makeDispatch()); const verifier = await harness.dependencies.verifier.verify({ command_body_bytes, signature_bytes: new Uint8Array([1, 2, 3]) }); assert.deepEqual(Object.keys(verifier).sort(), ['body', 'body_sha256', 'kind', 'signature_sha256', 'verified_key_id']); assert.equal(verifier.kind, 'VERIFIED'); assert.deepEqual(verifier.body, makeDispatch()); assert.equal(verifier.body_sha256, sha256(command_body_bytes)); assert.equal(verifier.signature_sha256, sha256(new Uint8Array([1, 2, 3]))); const primed = primeState(harness, { macro_state: 'AWAITING_CONTROLLER', phase: null, state_version: 8, candidate: makeCandidate(), delivery: makeDelivery() }); assert.equal(primed.expected_state_hash, sha256(canonicalJson(primed.state))); }
