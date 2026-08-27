import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';

export const CHANGE_ID = 'CHG-dual-device-transition-foundation';
export const CHANGE_B = 'CHG-second-change';
export const REPOSITORY_ID = 'gadfly-hbo/JuanerAI';
export const GIT_SHA = '1'.repeat(40);
export const CANDIDATE_SHA = '2'.repeat(40);
export const SHA256 = 'a'.repeat(64);
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
      readLocalPause: async request => take('state.readLocalPause', request, () => ok({ value: clone(stateStore.localPause) })),
      writeLocalPause: async request => take('state.writeLocalPause', request, () => { stateStore.localPause = clone(request.value ?? request.diagnostic); return ok({ value: clone(stateStore.localPause) }); }),
    },
    git: Object.fromEntries(GIT_METHODS.map(name => [name, async request => take(`git.${name}`, request, () => ok(gitDefault(name, request)))])),
    ledger: Object.fromEntries(LEDGER_METHODS.map(name => [name, async request => take(`ledger.${name}`, request, () => ok(ledgerDefault(name, request)))])),
    pull_request: {
      queryCurrent: async request => take('pull_request.queryCurrent', request, () => absent('pr')),
      createOrReuse: async request => take('pull_request.createOrReuse', request, () => ok({ number: 42, url: 'https://invalid.example/pr/42', base: 'main', head_branch: request.head_branch, head_sha: request.head_sha, review_ready: true })),
      readback: async request => take('pull_request.readback', request, () => ok({ number: 42, head_sha: CANDIDATE_SHA, review_ready: true })),
    },
    validation: { execute: async request => take('validation.execute', request, () => ok(validationDefault(request))) },
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
  if (name === 'canonicalDiff') return { producer_receipt: { executable: '/Users/huangbo/Dev/Env/homebrew/bin/git', version: '2.54.0' }, byte_length: 0, stdout_sha256: SHA256 };
  return { prior_local_main: GIT_SHA, local_main: CANDIDATE_SHA, origin_main: CANDIDATE_SHA, clean: true, fast_forward_only: true };
}
function ledgerDefault(name, request = {}) {
  if (name === 'readRemote') return { remote_ref: 'refs/heads/evidence/agent-runs', expected_tip: null, tip: null, commit: null, tree: null, authoritative_path: `ledger/${CHANGE_ID}.jsonl`, file_present: false, prior_bytes_sha256: sha256(''), prior_byte_length: 0, last_event_id: null, last_event_hash: null, last_sequence: 0 };
  if (name === 'prepareAppend') return { event_id: 'event-001', event_hash: SHA256, sequence: 1, record_offset: 0, record_length: 1, idempotency_id: 'idem-001', prepared_bytes_sha256: SHA256 };
  if (name === 'commitAndPush') return { commit_sha: GIT_SHA, tree_sha: GIT_SHA, event_id: 'event-001', event_hash: SHA256, sequence: 1, idempotency_id: 'idem-001', push_status: 'ACKNOWLEDGED' };
  return { tip: GIT_SHA, commit_sha: GIT_SHA, tree_sha: GIT_SHA, event_id: 'event-001', event_hash: SHA256, sequence: 1, record_bytes_sha256: SHA256, idempotency_id: 'idem-001', linearized: true };
}
function validationDefault(request = {}) { const definition = request.definition ?? {}; return { validation_id: definition.id ?? 'validation-001', validation_kind: definition.validation_kind ?? 'REGRESSION', validation_scope: definition.validation_scope ?? 'AFFECTED_SUITE', status: 'COMPLETED', verdict: 'PASS', failure_code: null, command_definition_sha256: SHA256, receipt_sha256: SHA256, subject_sha: request.subject_sha ?? GIT_SHA, candidate_sha: null, validator_head: null, idempotency_id: 'validation-001' }; }

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
      validations: [{ id: 'validation-001', argv: ['node', '--test'], cwd: '/tmp/dtf-worktree', environment: {}, timeout_ms: 60000, subject: 'HEAD' }], delivery_base: 'main', auto_repair_limit: 1, expected_pointer_sha256: sha256(pointerBytes(EMPTY_POINTER)),
    },
    scope: { allowed_paths: ['tools/harness/change-coordinator/coordinator.mjs'], forbidden_paths: [] }, worktree: { branch: 'work/mac-mini/dtf', root: '/tmp/dtf-worktree', baseline_sha: GIT_SHA }, expected_state_version: null, expected_state_hash: null, nonce: 'A'.repeat(43) + '=', issued_at: '2026-08-25T00:00:00.000Z', expires_at: '2026-08-25T00:01:00.000Z', idempotency_id: 'idem-001', receipt_digest: SHA256, evidence_refs: [], ...overrides,
  };
}

export async function createCoordinatorUnderTest() { const module = await import('./coordinator.mjs'); assert.equal(typeof module.createTestCoordinator, 'function', 'CAUSAL_PREREQUISITE: frozen production must export createTestCoordinator(dependencies) for deterministic Reduced V1 contract tests'); const harness = makeTestDependencies(); const coordinator = await module.createTestCoordinator(harness.dependencies); assert.deepEqual(Reflect.ownKeys(coordinator).sort(), ['applyControllerCommand', 'run', 'settlement', 'status']); return { coordinator, ...harness }; }
export function assertExactResult(result, { operation, outcome, state = undefined, code = undefined }) { assert.equal(result.operation, operation); assert.equal(result.outcome, outcome); if (state !== undefined) assert.equal(result.state, state); if (code !== undefined) assert.equal(result.error_code, code); }
export function assertReducedTraceability() { const expected = Array.from({ length: 7 }, (_, requirement) => Array.from({ length: [8, 8, 6, 8, 8, 6, 7][requirement] }, (_, ac) => `AC-DTF-${String(requirement + 1).padStart(3, '0')}-${String(ac + 1).padStart(2, '0')}`)).flat(); assert.deepEqual(Object.keys(TEST_AC_MAP), Array.from({ length: 12 }, (_, index) => `TEST-DTF-R1-${String(index + 1).padStart(3, '0')}`)); assert.deepEqual([...new Set(Object.values(TEST_AC_MAP).flat())].sort(), expected.sort()); }

export async function run(command, args, options = {}) { return new Promise((resolve, reject) => { const child = spawn(command, args, { ...options, shell: false }); let stdout = ''; let stderr = ''; child.stdout?.setEncoding('utf8'); child.stderr?.setEncoding('utf8'); child.stdout?.on('data', value => { stdout += value; }); child.stderr?.on('data', value => { stderr += value; }); child.once('error', reject); child.once('close', (code, signal) => resolve({ code, signal, stdout, stderr })); }); }
export async function assertTemporaryGitFixtureHealthy() { const root = await mkdtemp(path.join(os.tmpdir(), 'juanerai-dtf-r1-')); try { const remote = path.join(root, 'origin.git'); const seed = path.join(root, 'seed'); const left = path.join(root, 'left'); const right = path.join(root, 'right'); const git = async (cwd, ...args) => { const result = await run('/Users/huangbo/Dev/Env/homebrew/bin/git', args, { cwd, env: { LC_ALL: 'C', PATH: process.env.PATH } }); assert.equal(result.code, 0, result.stderr); return result.stdout.trim(); }; await git(root, 'init', '--bare', remote); await git(root, 'init', '-b', 'main', seed); await git(seed, 'config', 'user.name', 'JuanerAI Test'); await git(seed, 'config', 'user.email', 'test@invalid.example'); await writeFile(path.join(seed, 'tracked.txt'), 'baseline\n'); await git(seed, 'add', '--', 'tracked.txt'); await git(seed, 'commit', '-m', 'baseline'); await git(seed, 'remote', 'add', 'origin', remote); await git(seed, 'push', '-u', 'origin', 'main'); await git(remote, 'symbolic-ref', 'HEAD', 'refs/heads/main'); await git(root, 'clone', remote, left); await git(root, 'clone', remote, right); for (const cloneRoot of [left, right]) { await git(cloneRoot, 'config', 'user.name', 'JuanerAI Test'); await git(cloneRoot, 'config', 'user.email', 'test@invalid.example'); await writeFile(path.join(cloneRoot, 'tracked.txt'), 'candidate\n'); await git(cloneRoot, 'add', '--', 'tracked.txt'); const tree = await git(cloneRoot, 'write-tree'); await git(cloneRoot, 'commit', '-m', 'candidate'); const head = await git(cloneRoot, 'rev-parse', 'HEAD'); assert.equal(await git(cloneRoot, 'rev-parse', `${head}^{tree}`), tree); assert.equal(await git(cloneRoot, 'rev-parse', `${head}^`), await git(cloneRoot, 'rev-parse', 'origin/main')); } const environment = { LC_ALL: 'C', LANG: 'C', TZ: 'UTC', GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: '/dev/null', GIT_ATTR_NOSYSTEM: '1', GIT_PAGER: 'cat', PAGER: 'cat', GIT_TERMINAL_PROMPT: '0', GIT_NO_REPLACE_OBJECTS: '1' }; const args = ['--no-pager', '-c', 'color.ui=false', '-c', 'core.quotePath=true', '-c', 'diff.algorithm=myers', '-c', 'diff.mnemonicPrefix=false', '-c', 'diff.noprefix=false', 'diff', '--binary', '--full-index', '--no-ext-diff', '--no-textconv', '--no-renames', '--src-prefix=a/', '--dst-prefix=b/', 'origin/main..HEAD', '--']; const a = await run('/Users/huangbo/Dev/Env/homebrew/bin/git', args, { cwd: left, env: environment }); const b = await run('/Users/huangbo/Dev/Env/homebrew/bin/git', args, { cwd: right, env: environment }); assert.equal(a.code, 0, a.stderr); assert.equal(b.code, 0, b.stderr); assert.notEqual(a.stdout, ''); assert.equal(a.stdout, b.stdout); return sha256(a.stdout); } finally { await rm(root, { recursive: true, force: true }); } }
export async function assertHelperHealth() { assert.equal(canonicalJson({ b: 2, a: [true, null] }), '{"a":[true,null],"b":2}'); assert.equal(sha256('Reduced V1'), '2866d5017433bc2f5f75a4ae47a14d2db47f05626cb015baabc6e678c78a673a'); assertReducedTraceability(); assert.equal(DEFERRED_REGRESSION_CASES.some(value => /auth|wip|ledger|candidate|validator|pr head|release|pointer/i.test(value)), false, 'A-E safety negatives cannot be deferred'); const mutex = createOneOperationMutex(); assert.equal(await mutex.tryAcquire(), true); assert.equal(await mutex.tryAcquire(), false); await mutex.release(); assert.equal(await mutex.tryAcquire(), true); await mutex.release(); const harness = makeTestDependencies(); assert.deepEqual(Object.keys(harness.dependencies.git).sort(), [...GIT_METHODS].sort()); assert.deepEqual(Object.keys(harness.dependencies.ledger).sort(), [...LEDGER_METHODS].sort()); const command_body_bytes = bytes(makeDispatch()); const verifier = await harness.dependencies.verifier.verify({ command_body_bytes, signature_bytes: new Uint8Array([1, 2, 3]) }); assert.deepEqual(Object.keys(verifier).sort(), ['body', 'body_sha256', 'kind', 'signature_sha256', 'verified_key_id']); assert.equal(verifier.kind, 'VERIFIED'); assert.deepEqual(verifier.body, makeDispatch()); assert.equal(verifier.body_sha256, sha256(command_body_bytes)); assert.equal(verifier.signature_sha256, sha256(new Uint8Array([1, 2, 3]))); const primed = primeState(harness, { macro_state: 'AWAITING_CONTROLLER', phase: null, state_version: 8, candidate: makeCandidate(), delivery: makeDelivery() }); assert.equal(primed.expected_state_hash, sha256(canonicalJson(primed.state))); }
