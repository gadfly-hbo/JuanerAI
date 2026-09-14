import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
// R175_STATE_IMPORT_BEGIN
import os from 'node:os';
import { lstat, mkdtemp, readFile, readdir, readlink, realpath, rm } from 'node:fs/promises';
import { channel } from 'node:diagnostics_channel';
import { createCoordinatorCore } from './coordinator.mjs';
import { createTrustedHostLoop } from './host-loop.mjs';
import { createFileState } from './production.mjs';
import { makeTestDependencies } from './fixtures.mjs';
// R175_STATE_IMPORT_END
import {
  CHANGE_B, CHANGE_ID, CANDIDATE_SHA, GIT_SHA, GIT, SHA256, REPOSITORY_ID, AGENT_STAGES, EVENT_CLASSES,
  MACRO_STATES, PHASES, absent, ambiguous, assertExactResult, assertHelperHealth, bytes, canonicalJson,
  conflict, createCoordinatorUnderTest, createUnpublishedTestLedgerCommit, appendTestLedgerEvent, assertExactWorktreeReceipt, expectedCandidateReceipt,
  expectedExecutionDefinitions, makeCandidate, makeDelivery, makeDispatch,
  ok, primeState, reachOrdinaryRepairAction, readLocalLedger, run, settleOrdinaryValidatorForBoundary, sha256, unavailable, withObservedK1Prefix, createLocalBareLedger,
} from './fixtures.mjs';

const signed = overrides => ({ command_body_bytes: bytes(makeDispatch(overrides)), signature_bytes: new Uint8Array([1, 2, 3]) });
const stateIdentity = { expected_state_version: 0, expected_state_hash: SHA256 };
const noCall = (harness, name) => assert.equal(harness.count(name), 0, `${name} must not be called`);
const reached = (harness, name) => assert.ok(harness.count(name) > 0, `PRECONDITION_NOT_REACHED: ${name} was not called`);
const publicStatus = async (harness) => harness.coordinator.status({ change_id: CHANGE_ID });
const revisionEffects = harness => ({
  state: harness.count('state.writeState'),
  ledger: harness.count('ledger.prepareAppend'),
  agent_events: harness.calls.filter(call => call.name === 'ledger.prepareAppend' && call.request.event_class === 'AGENT_RUN').length,
  worktree: harness.count('git.createOrReuseWorktree'),
  stage: harness.count('git.stageExact'),
  commit: harness.count('git.commitCandidate'),
  push: harness.count('git.pushBranch'),
  validation: harness.count('validation.execute'),
  pull_request: harness.count('pull_request.createOrReuse'),
  handoff: harness.count('handoff.writeReadback'),
});
const revisionFor = (identity, subject_sha = GIT_SHA, overrides = {}) => signed({
  command_kind: 'REVISION',
  command_id: 'pcrr-revision-001',
  idempotency_id: 'pcrr-revision-idem-001',
  nonce: 'B'.repeat(43) + '=',
  payload: { changes_requested_ref: 'changes-requested-001', revision_of_candidate_sha: null, resume_phase: 'TEST_RED' },
  evidence_refs: [{ kind: 'controller_decision', id: 'changes-requested-001', sha256: SHA256, subject_sha }],
  expected_state_version: identity.state_version,
  expected_state_hash: identity.state_hash,
  ...overrides,
});
const bindingFor = action => {
  const { action_kind, ...binding } = action.payload.action;
  assert.equal(action_kind, 'LAUNCH_AGENT');
  return binding;
};
const settle = async (harness, action, status, child) => {
  const binding = bindingFor(action);
  const started = await harness.coordinator.settlement({
    change_id: CHANGE_ID,
    expected_state_version: action.state_version,
    expected_state_hash: action.state_hash,
    settlement: { ...binding, stage: 'STARTED', observed_child_id: child },
  });
  return harness.coordinator.settlement({
    change_id: CHANGE_ID,
    expected_state_version: started.state_version,
    expected_state_hash: started.state_hash,
    settlement: { ...binding, stage: 'RESULT', observed_child_id: child, status, artifact_path: `outputs/${child}.md`, artifact_sha256: SHA256 },
  });
};
const dispatchToTest = async harness => {
  const dispatch = await harness.coordinator.applyControllerCommand(signed());
  const admitted = await publicStatus(harness);
  assert.deepEqual({ state: admitted.state, state_version: admitted.state_version, state_hash: admitted.state_hash, active: admitted.payload.active_change_id, phase: admitted.payload.phase, pending: admitted.payload.pending_action?.correlation_id ?? null }, { state: 'READY', state_version: dispatch.state_version, state_hash: dispatch.state_hash, active: CHANGE_ID, phase: 'WORKTREE', pending: null }, 'T1 public DISPATCH/status identity exactly matches the durable admission before the ordinary Spec action');
  const spec = await harness.coordinator.run({ change_id: CHANGE_ID, expected_state_version: dispatch.state_version, expected_state_hash: dispatch.state_hash });
  const specPass = await settle(harness, spec, 'PASS', 'pcrr-spec-pass');
  const testReady = await publicStatus(harness);
  assert.deepEqual({ state: testReady.state, active: testReady.payload.active_change_id, phase: testReady.payload.phase, pending: testReady.payload.pending_action?.correlation_id ?? null }, { state: 'EXECUTING', active: CHANGE_ID, phase: 'TEST_RED', pending: null }, 'T1 public status confirms the ordinary Test source before its action');
  return harness.coordinator.run({ change_id: CHANGE_ID, expected_state_version: specPass.state_version, expected_state_hash: specPass.state_hash });
};
const dispatchToWorker = async harness => {
  const testAction = await dispatchToTest(harness);
  const testPass = await settle(harness, testAction, 'PASS', 'pcrr-test-pass');
  const workerReady = await publicStatus(harness);
  assert.deepEqual({ state: workerReady.state, active: workerReady.payload.active_change_id, phase: workerReady.payload.phase, pending: workerReady.payload.pending_action?.correlation_id ?? null }, { state: 'EXECUTING', active: CHANGE_ID, phase: 'WORKER_GREEN', pending: null }, 'T1 public status confirms the ordinary Worker source before its action');
  return harness.coordinator.run({ change_id: CHANGE_ID, expected_state_version: testPass.state_version, expected_state_hash: testPass.state_hash });
};
const withObservedFrozenReview = async (suffix, continuation, controls = {}) => {
  const pulls = []; const writes = [];
  const defaultPullRequest = {
    async queryCurrent(request) { pulls.push({ method: 'queryCurrent', request: structuredClone(request) }); return absent({ repository: request.repository, base: request.base, head_branch: request.head_branch }); },
    async createOrReuse(request) { pulls.push({ method: 'createOrReuse', request: structuredClone(request) }); return ok({ number: 250, url: 'https://invalid.example/pr/250', base: request.base, head_branch: request.head_branch, head_sha: request.head_sha, review_ready: true }); },
    async readback(request) { pulls.push({ method: 'readback', request: structuredClone(request) }); return ok({ number: request.number, url: 'https://invalid.example/pr/250', base: 'main', head_branch: 'work/mac-mini/m2-regression', head_sha: request.expected_head, review_ready: true }); },
  };
  const defaultHandoff = { async writeReadback(request) { writes.push(structuredClone(request)); const document = JSON.parse(Buffer.from(request.handoff_bytes).toString('utf8')); return ok({ handoff_sha256: sha256(request.handoff_bytes), delivery_id: document.delivery_id }); } };
  await withObservedK1Prefix(async context => {
    const { validatorPass } = await settleOrdinaryValidatorForBoundary(context, `frozen-review-${suffix}`);
    const pushed = await context.core.run({ change_id: context.command.change_id, expected_state_version: validatorPass.state_version, expected_state_hash: validatorPass.state_hash }); assertExactResult(pushed, { operation: 'run', outcome: 'ADVANCED', state: 'DELIVERING' }); assert.equal(pushed.payload.to_phase, 'CANDIDATE_FREEZE');
    const frozen = await context.core.run({ change_id: context.command.change_id, expected_state_version: pushed.state_version, expected_state_hash: pushed.state_hash }); assertExactResult(frozen, { operation: 'run', outcome: 'ADVANCED', state: 'DELIVERING' }); assert.equal(frozen.payload.to_phase, 'PR');
    const pr = await context.core.run({ change_id: context.command.change_id, expected_state_version: frozen.state_version, expected_state_hash: frozen.state_hash }); assertExactResult(pr, { operation: 'run', outcome: 'ADVANCED', state: 'DELIVERING' }); assert.equal(pr.payload.to_phase, 'HANDOFF');
    const awaiting = await context.core.run({ change_id: context.command.change_id, expected_state_version: pr.state_version, expected_state_hash: pr.state_hash }); assertExactResult(awaiting, { operation: 'run', outcome: 'AWAITING_CONTROLLER', state: 'AWAITING_CONTROLLER' });
    if (!controls.handoff) assert.equal(writes.length, 1, 'the controlled Handoff write/readback follows the real local K1, Validator, branch, Freeze, and PR prefix'); if (!controls.pull_request) assert.deepEqual(pulls.map(entry => entry.method), ['queryCurrent', 'createOrReuse', 'readback']);
    await continuation({ context, awaiting, pulls, writes });
  }, { ...controls, pull_request: controls.pull_request ?? defaultPullRequest, handoff: controls.handoff ?? defaultHandoff });
};

test('helper health: canonical bytes, closed map, fault queues, and one-operation mutex are production-independent', async () => {
  await assertHelperHealth();
});

const productionCoordinatorModule = await import('./coordinator.mjs');
test('TEST-DTF-R1-001: production and deterministic Test construction share the one four-interface Reduced V1 core', () => {
  assert.deepEqual(
    Object.keys(productionCoordinatorModule).sort(),
    ['COORDINATOR_SCHEMA_VERSION', 'createCoordinatorCore', 'createTestCoordinator'],
    'CAUSAL_RED: the old seven-operation authority and any second Test state machine must be absent; production and Test construction share createCoordinatorCore',
  );
  assert.equal(typeof productionCoordinatorModule.createCoordinatorCore, 'function');
  assert.equal(typeof productionCoordinatorModule.createTestCoordinator, 'function');
  assert.equal(typeof productionCoordinatorModule.createChangeCoordinator, 'undefined');
});

test('TEST-DTF-R1-001: production composition and Core constructor close the exact ten dependency contracts', async t => {
  const { createCoordinatorAdapters } = await import('./adapters.mjs');
  const options = {
    repository_root: '/tmp', state_root: '/tmp/juanerai-dtf-composition', device: 'mac-mini', process_run_id: 'composition-001',
    git_executable: '/usr/bin/git', pull_request_executable: '/usr/bin/false', base_environment: {},
  };
  const vocabulary = ['verifier', 'state', 'git', 'ledger', 'pull_request', 'validation', 'handoff', 'clock', 'ids', 'mutex'];
  await t.test('production composition supplies the exact Core vocabulary and no composition-only escape', () => {
    const composed = createCoordinatorAdapters(options);
    assert.deepEqual(Object.keys(composed).sort(), [...vocabulary].sort(), 'CAUSAL_RED: createCoordinatorAdapters must be the production Core composition, not a parallel adapter bag');
  });
  await t.test('Core rejects a missing, extra, or method-mismatched dependency before exposing public interfaces', async () => {
    const harness = await createCoordinatorUnderTest();
    for (const [name, mutate] of [
      ['missing ledger', dependencies => { delete dependencies.ledger; }],
      ['extra escape', dependencies => { dependencies.escape = {}; }],
      ['state method mismatch', dependencies => { dependencies.state.readPointer = 1; }],
    ]) {
      const candidate = { ...harness.dependencies, state: { ...harness.dependencies.state } };
      mutate(candidate);
      assert.throws(() => productionCoordinatorModule.createCoordinatorCore(candidate), { name: 'TypeError' }, `CAUSAL_RED: ${name} must reject at construction`);
    }
  });
});

test('TEST-DTF-R1-001: every Controller command is exact and malformed structure rejects before mutex or effect', async t => {
  const malformed = [
    ['nonce must be padded base64 for exactly 32 bytes', { nonce: 'not-a-32-byte-nonce' }],
    ['issued/expires must be a bounded canonical window', { issued_at: '2026-08-25T00:00:00Z' }],
    ['scope paths must be sorted, unique, and grammatical', { scope: { allowed_paths: ['z/**', 'a/**', 'a/**'], forbidden_paths: [] } }],
    ['roles must retain exact ordered route and closed role bodies', { payload: { ...makeDispatch().payload, roles: [...makeDispatch().payload.roles].reverse() } }],
    ['validation definition must retain its complete closed body', { payload: { ...makeDispatch().payload, validations: [{ id: 'validation-001' }] } }],
    ['evidence references must be sorted unique hashed Controller facts', { evidence_refs: [{ kind: 'receipt', id: 'z', sha256: SHA256, subject_sha: GIT_SHA }, { kind: 'receipt', id: 'a', sha256: SHA256, subject_sha: GIT_SHA }] }],
  ];
  for (const [name, override] of malformed) {
    await t.test(name, async () => {
      const harness = await createCoordinatorUnderTest();
      harness.dependencies.mutex.tryAcquire = async () => { throw new Error('MUTEX_REACHED_FOR_MALFORMED_COMMAND'); };
      const outcome = await harness.coordinator.applyControllerCommand(signed(override));
      assertExactResult(outcome, { operation: 'applyControllerCommand', outcome: 'REJECTED', code: 'INPUT_INVALID' });
      for (const effect of ['state.writePointer', 'state.writeState', 'ledger.readRemote', 'git.createOrReuseWorktree']) noCall(harness, effect);
    });
  }
});

test('TEST-DTF-R1-001: all signed Controller commands bind the exact canonical repository identity', async t => {
  const canonicalRepository = { repository_id: REPOSITORY_ID, canonical_root: '/tmp/dtf-repo', origin: 'origin', integration_branch: 'main' };
  const historicalRepository = { canonical_root: '/tmp/dtf-repo', origin: 'origin', integration_branch: 'main' };
  const command = command_kind => {
    if (command_kind === 'REVISION') return makeDispatch({ command_kind, payload: { changes_requested_ref: 'changes-requested-001', revision_of_candidate_sha: null, resume_phase: 'TEST_RED' }, expected_state_version: 7, expected_state_hash: SHA256 });
    if (command_kind === 'RESUME') return makeDispatch({ command_kind, payload: { resume_target: { macro_state: 'DELIVERING', phase: 'PR' } }, expected_state_version: 7, expected_state_hash: SHA256 });
    if (command_kind === 'RELEASE') return makeDispatch({ command_kind, payload: { squash_sha: CANDIDATE_SHA, acceptance_ref: 'acceptance-001', merge_ref: 'merge-001', archive_ref: 'archive-001', origin_main_sha: CANDIDATE_SHA, macbook_main_sha: CANDIDATE_SHA }, expected_state_version: 7, expected_state_hash: SHA256 });
    return makeDispatch();
  };
  const protectedEffects = ['state.writePointer', 'state.writeState', 'ledger.readRemote', 'git.createOrReuseWorktree', 'pull_request.queryCurrent', 'pull_request.createOrReuse', 'handoff.writeReadback'];

  for (const command_kind of ['DISPATCH', 'REVISION', 'RESUME', 'RELEASE']) {
    await t.test(`${command_kind} accepts the exact four-field repository as signed command input`, async () => {
      const body = command(command_kind);
      assert.deepEqual(body.repository, canonicalRepository);
      const commandBytes = bytes(body);
      const harness = await createCoordinatorUnderTest();
      const result = await harness.coordinator.applyControllerCommand({ command_body_bytes: commandBytes, signature_bytes: new Uint8Array([1, 2, 3]) });
      if (command_kind === 'DISPATCH') {
        assertExactResult(result, { operation: 'applyControllerCommand', outcome: 'APPLIED', state: 'READY' });
        assert.equal(harness.stateStore.state.admission.body_sha256, sha256(commandBytes), 'CAUSAL_RED: repository_id must be covered by the admitted canonical signed-body hash');
      } else {
        assertExactResult(result, { operation: 'applyControllerCommand', outcome: 'REJECTED', code: 'STATE_CONFLICT' });
      }
      assert.deepEqual(harness.calls.find(call => call.name === 'verifier.verify')?.request.command_body_bytes, commandBytes, 'CAUSAL_RED: the verifier must receive the complete canonical bytes including repository_id');
    });

    for (const [shape, repository] of [
      ['a missing required repository field', { repository_id: REPOSITORY_ID, origin: 'origin', integration_branch: 'main' }],
      ['historical three-field repository (missing repository_id)', historicalRepository],
      ['wrong repository_id', { ...canonicalRepository, repository_id: 'attacker/Other' }],
      ['extra repository field', { ...canonicalRepository, inferred_repository: REPOSITORY_ID }],
    ]) {
      await t.test(`${command_kind} rejects ${shape} before protected effect`, async () => {
        const harness = await createCoordinatorUnderTest();
        const body = { ...command(command_kind), repository };
        const result = await harness.coordinator.applyControllerCommand({ command_body_bytes: bytes(body), signature_bytes: new Uint8Array([1, 2, 3]) });
        assertExactResult(result, { operation: 'applyControllerCommand', outcome: 'REJECTED', code: 'INPUT_INVALID' });
        assert.equal(harness.count('verifier.verify'), 1, 'CAUSAL_RED: exact repository schema is checked only after canonical signature verification');
        for (const effect of protectedEffects) noCall(harness, effect);
      });
    }
  }

  await t.test('repository_id changes the canonical signed body identity', () => {
    const canonicalBytes = bytes(makeDispatch());
    const wrongBytes = bytes(makeDispatch({ repository: { ...canonicalRepository, repository_id: 'attacker/Other' } }));
    assert.notDeepEqual(canonicalBytes, wrongBytes);
    assert.notEqual(sha256(canonicalBytes), sha256(wrongBytes), 'CAUSAL_RED: repository_id cannot sit outside the canonical signed body');
  });
});

test('TEST-DTF-R1-002: a fresh DISPATCH runs the complete normal path from Worktree through freeze and HANDOFF_READY', async () => {
  const pulls = []; const writes = [];
  const pull_request = { async queryCurrent(request) { pulls.push({ method: 'queryCurrent', request: structuredClone(request) }); return absent({ repository: request.repository, base: request.base, head_branch: request.head_branch }); }, async createOrReuse(request) { pulls.push({ method: 'createOrReuse', request: structuredClone(request) }); return ok({ number: 260, url: 'https://invalid.example/pr/260', base: request.base, head_branch: request.head_branch, head_sha: request.head_sha, review_ready: true }); }, async readback(request) { pulls.push({ method: 'readback', request: structuredClone(request) }); return ok({ number: request.number, url: 'https://invalid.example/pr/260', base: 'main', head_branch: 'work/mac-mini/m2-regression', head_sha: request.expected_head, review_ready: true }); } };
  const handoff = { async writeReadback(request) { writes.push(structuredClone(request)); const document = JSON.parse(Buffer.from(request.handoff_bytes).toString('utf8')); return ok({ handoff_sha256: sha256(request.handoff_bytes), delivery_id: document.delivery_id }); } };
  await withObservedK1Prefix(async context => {
    const creates = context.gatewayEvents.filter(event => event.edge === 'START' && event.gateway === 'git' && event.method === 'createOrReuseWorktree'); assert.equal(creates.length, 1, 'CAUSAL_RED: the observed real normal path creates/reuses Worktree exactly once before its first Spec action'); const spec = context.settledActions.find(action => action.role === 'juaner_spec'); assert.ok(spec); assert.ok(creates[0].sequence < context.gatewayEvents.find(event => event.edge === 'START' && event.gateway === 'ledger' && event.method === 'prepareAppend' && JSON.parse(Buffer.from(event.request.event_bytes).toString('utf8').trim()).detail.role === 'juaner_spec').sequence);
    const stage = context.gatewayEvents.find(event => event.edge === 'START' && event.gateway === 'git' && event.method === 'stageExact'); const candidate = context.gatewayEvents.find(event => event.edge === 'START' && event.gateway === 'git' && event.method === 'commitCandidate'); const postCandidate = context.gatewayEvents.find(event => event.edge === 'START' && event.gateway === 'git' && event.method === 'inspectWorktree' && event.sequence > candidate.sequence); assert.ok(stage && candidate && postCandidate, 'CAUSAL_RED: named STAGE, Candidate commit, and post-Candidate clean inspection replace the obsolete aggregate inspect count'); assert.ok(stage.sequence < candidate.sequence && candidate.sequence < postCandidate.sequence);
    const { validatorPass } = await settleOrdinaryValidatorForBoundary(context, 'dtf002-normal'); const pushed = await context.core.run({ change_id: context.command.change_id, expected_state_version: validatorPass.state_version, expected_state_hash: validatorPass.state_hash }); assertExactResult(pushed, { operation: 'run', outcome: 'ADVANCED', state: 'DELIVERING' }); assert.equal(pushed.payload.to_phase, 'CANDIDATE_FREEZE'); const frozen = await context.core.run({ change_id: context.command.change_id, expected_state_version: pushed.state_version, expected_state_hash: pushed.state_hash }); assertExactResult(frozen, { operation: 'run', outcome: 'ADVANCED', state: 'DELIVERING' }); assert.equal(frozen.payload.to_phase, 'PR'); const pr = await context.core.run({ change_id: context.command.change_id, expected_state_version: frozen.state_version, expected_state_hash: frozen.state_hash }); assertExactResult(pr, { operation: 'run', outcome: 'ADVANCED', state: 'DELIVERING' }); assert.equal(pr.payload.to_phase, 'HANDOFF'); const current = await context.core.run({ change_id: context.command.change_id, expected_state_version: pr.state_version, expected_state_hash: pr.state_hash }); assertExactResult(current, { operation: 'run', outcome: 'AWAITING_CONTROLLER', state: 'AWAITING_CONTROLLER' }); assert.deepEqual(pulls.map(entry => entry.method), ['queryCurrent', 'createOrReuse', 'readback']); assert.equal(writes.length, 1); const push = context.gatewayEvents.find(event => event.edge === 'START' && event.gateway === 'git' && event.method === 'pushBranch'); const prStart = context.gatewayEvents.find(event => event.edge === 'START' && event.gateway === 'pull_request' && event.method === 'queryCurrent'); assert.ok(push.sequence < prStart.sequence, 'CAUSAL_RED: real push/readback precedes the external PR boundary'); assert.equal(context.gatewayEvents.filter(event => event.edge === 'START' && event.gateway === 'git' && event.method === 'createOrReuseWorktree').length, 1, 'CAUSAL_RED: normal-chain completion retains exactly one real Worktree create/reuse'); for (const [gateway, method] of [['git', 'createOrReuseWorktree'], ['git', 'inspectWorktree'], ['git', 'stageExact'], ['git', 'readStaged'], ['git', 'commitCandidate'], ['validation', 'execute'], ['git', 'pushBranch'], ['git', 'readRemoteBranch'], ['pull_request', 'createOrReuse'], ['pull_request', 'readback'], ['handoff', 'writeReadback']]) assert.ok(context.gatewayEvents.some(event => event.edge === 'START' && event.gateway === gateway && event.method === method), `CAUSAL_RED: complete normal path includes ${gateway}.${method}`);
  }, { pull_request, handoff });
});

test('TEST-DTF-R1-003: settlement variants are exact closed unions and reject unknown fields without progress', async t => {
  const builders = [
    ['STARTED requires only child binding', binding => ({ ...binding, stage: 'STARTED', observed_child_id: 'child-1', unexpected: true })],
    ['RESULT requires artifact binding', binding => ({ ...binding, stage: 'RESULT', observed_child_id: 'child-1', status: 'PASS', artifact_path: 'x', artifact_sha256: SHA256, unexpected: true })],
    ['START_FAILED has only closed failure codes', binding => ({ ...binding, stage: 'START_FAILED', failure_code: 'UNKNOWN' })],
    ['INTERRUPTED retains closed interruption detail', binding => ({ ...binding, stage: 'INTERRUPTED', observed_child_id: 'child-1', extra: true })],
    ['NOT_STARTED only represents a precondition fact', binding => ({ ...binding, stage: 'NOT_STARTED', observed_child_id: 'child-1' })],
  ];
  for (const [name, build] of builders) {
    await t.test(name, async () => {
      const harness = await createCoordinatorUnderTest();
      const action = await dispatchToTest(harness);
      assertExactResult(action, { operation: 'run', outcome: 'AGENT_ACTION', state: 'EXECUTING' });
      const { action_kind, ...binding } = action.payload.action;
      const settlement = build(binding);
      const result = await harness.coordinator.settlement({ change_id: CHANGE_ID, expected_state_version: action.state_version, expected_state_hash: action.state_hash, settlement });
      assertExactResult(result, { operation: 'settlement', outcome: 'REJECTED', code: 'SETTLEMENT_INVALID' });
      assert.equal(harness.stateStore.state.pending_agent?.correlation_id, binding.correlation_id, 'invalid settlement cannot clear/advance the pending Agent');
    });
  }
});

test('TEST-DTF-R1-004: exact REVISION and RESUME commands admit only their named lifecycle transitions', async t => {
  await t.test('a valid Candidate-bound Validator REVISION resets a blocked Change to EXECUTING/TEST_RED with a fresh authorization cycle', async () => {
    const harness = await createCoordinatorUnderTest();
    const admitted = await harness.coordinator.applyControllerCommand(signed());
    assertExactResult(admitted, { operation: 'applyControllerCommand', outcome: 'APPLIED', state: 'READY' });
    const admittedStatus = await publicStatus(harness);
    assert.deepEqual({ state: admittedStatus.state, state_version: admittedStatus.state_version, state_hash: admittedStatus.state_hash, phase: admittedStatus.payload.phase }, { state: 'READY', state_version: admitted.state_version, state_hash: admitted.state_hash, phase: 'WORKTREE' }, 'T1 legal public DISPATCH establishes the Candidate-revision seed identity before its one target state mutation');
    const identity = primeState(harness, { macro_state: 'BLOCKED', phase: null, state_version: 7, admission: harness.stateStore.state.admission, repository: structuredClone(harness.stateStore.state.repository), candidate: makeCandidate({ frozen: false, validator_head: null }), delivery: null, blocked_reason: 'VALIDATOR_SECOND_FAIL' });
    const revision = signed({
      command_kind: 'REVISION',
      command_id: 'candidate-revision-001',
      idempotency_id: 'candidate-revision-idem-001',
      nonce: 'C'.repeat(43) + '=',
      payload: { changes_requested_ref: 'changes-requested-001', revision_of_candidate_sha: CANDIDATE_SHA, resume_phase: 'TEST_RED' },
      evidence_refs: [{ kind: 'controller_decision', id: 'changes-requested-001', sha256: SHA256, subject_sha: CANDIDATE_SHA }],
      expected_state_version: identity.expected_state_version, expected_state_hash: identity.expected_state_hash,
    });
    const result = await harness.coordinator.applyControllerCommand(revision);
    assertExactResult(result, { operation: 'applyControllerCommand', outcome: 'APPLIED', state: 'EXECUTING' });
    assert.equal(result.payload.phase, 'TEST_RED');
  });
  await t.test('safe RESUME matches the persisted resume target and cannot invent a code/Test continuation', async () => {
    const harness = await createCoordinatorUnderTest();
    const identity = primeState(harness, { macro_state: 'BLOCKED', phase: null, state_version: 7, resume_target: { macro_state: 'DELIVERING', phase: 'PR' } });
    const resume = signed({
      command_kind: 'RESUME', payload: { resume_target: { macro_state: 'DELIVERING', phase: 'PR' } },
      expected_state_version: identity.expected_state_version, expected_state_hash: identity.expected_state_hash,
    });
    const result = await harness.coordinator.applyControllerCommand(resume);
    assertExactResult(result, { operation: 'applyControllerCommand', outcome: 'APPLIED', state: 'DELIVERING' });
    assert.equal(result.payload.phase, 'PR');
  });
});

test('TEST-DTF-R1-002: noncanonical state bytes, partial gateway OK, and failed state readback cannot advance durable state', async t => {
  await t.test('noncanonical hydrated bytes reject even when a parsed value is supplied', async () => {
    const harness = await createCoordinatorUnderTest();
    const identity = primeState(harness, { macro_state: 'READY', phase: 'WORKTREE' });
    harness.fault('state.readState', { kind: 'OK', value: { bytes: '{"z":1,"a":2}', sha256: sha256('{"z":1,"a":2}'), value: harness.stateStore.state } });
    const result = await harness.coordinator.run({ change_id: CHANGE_ID, ...identity });
    assertExactResult(result, { operation: 'run', outcome: 'BLOCKED', state: 'BLOCKED' });
    noCall(harness, 'git.createOrReuseWorktree');
  });
  await t.test('every state write binds the read version and exact state byte hash then reads it back', async () => {
    const harness = await createCoordinatorUnderTest();
    const dispatch = await harness.coordinator.applyControllerCommand(signed()); assertExactResult(dispatch, { operation: 'applyControllerCommand', outcome: 'APPLIED', state: 'READY' });
    const specAction = await harness.coordinator.run({ change_id: CHANGE_ID, expected_state_version: dispatch.state_version, expected_state_hash: dispatch.state_hash }); const specPass = await settle(harness, specAction, 'PASS', 'dtf002-state-write-spec'); assertExactResult(specPass, { operation: 'settlement', outcome: 'ADVANCED', state: 'EXECUTING' });
    const before = await publicStatus(harness); assert.deepEqual({ state: before.state, phase: before.payload.phase, pending: before.payload.pending_action }, { state: 'EXECUTING', phase: 'TEST_RED', pending: null });
    const action = await harness.coordinator.run({ change_id: CHANGE_ID, expected_state_version: before.state_version, expected_state_hash: before.state_hash }); assertExactResult(action, { operation: 'run', outcome: 'AGENT_ACTION', state: 'EXECUTING' });
    const write = harness.calls.filter(call => call.name === 'state.writeState').at(-1);
    const writeIndex = harness.calls.lastIndexOf(write); const reread = harness.calls.slice(writeIndex + 1).find(call => call.name === 'state.readState');
    assert.equal(write.request.expected_version, before.state_version, 'CAUSAL_RED: the target Test-action CAS write uses its public immediately-prior State version'); assert.equal(write.request.expected_sha256, before.state_hash, 'CAUSAL_RED: the target Test-action CAS write binds the exact public State bytes'); assert.deepEqual(reread?.request, { change_id: CHANGE_ID }, 'CAUSAL_RED: the target State write is immediately followed by a same-Change readback'); assert.equal(harness.stateStore.state.state_version, action.state_version); assert.equal(sha256(canonicalJson(harness.stateStore.state)), action.state_hash, 'CAUSAL_RED: the observed post-write State bytes equal the public action identity');
  });
  await t.test('partial OK from Worktree gateway does not advance', async () => {
    await withObservedK1Prefix(async context => {
      const result = await context.core.run({ change_id: context.command.change_id, expected_state_version: context.regression.state_version, expected_state_hash: context.regression.state_hash }); assertExactResult(result, { operation: 'run', outcome: 'BLOCKED', state: 'BLOCKED' }); assert.equal(result.payload.blocked_reason, 'WORKTREE_DIRTY_CONFLICT');
      const stage = context.gatewayEvents.find(event => event.edge === 'START' && event.gateway === 'git' && event.method === 'stageExact'); const delivered = context.gatewayEvents.find(event => event.edge === 'COMPLETE' && event.gateway === 'git' && event.method === 'stageExact'); assert.ok(stage, 'CAUSAL_RED: partial Stage response is injected only after the real public Regression reaches STAGE'); assert.equal(delivered?.actual_result.kind, 'OK'); assert.equal(delivered?.result.kind, 'OK'); assert.deepEqual(Object.keys(delivered.result.value), ['staged_paths']); assert.equal(delivered.result.receipt_sha256, sha256(canonicalJson(delivered.result.value)), 'CAUSAL_RED: the delivered partial OK remains a closed gateway receipt, not a thrown fixture error'); assert.equal(context.gatewayEvents.some(event => event.edge === 'START' && event.gateway === 'git' && event.method === 'commitCandidate'), false, 'CAUSAL_RED: incomplete stage value cannot reach Candidate commit');
    }, { stopAtStage: true, transformCandidateStageValue: async ({ method, actualResult }) => method === 'stageExact' ? { staged_paths: actualResult.staged_paths } : actualResult });
  });
});

test('TEST-DTF-R1-005: admission and every durable event carry exact Ledger detail, sequence, framing, and readback receipt', async () => {
  const harness = await createCoordinatorUnderTest();
  const result = await harness.coordinator.applyControllerCommand(signed());
  assertExactResult(result, { operation: 'applyControllerCommand', outcome: 'APPLIED', state: 'READY' });
  const prepared = harness.calls.find(call => call.name === 'ledger.prepareAppend');
  assert.deepEqual(Object.keys(prepared.request.detail).sort(), ['admission', 'body_sha256', 'command_id', 'command_kind', 'evidence_refs', 'ready_state_sha256', 'receipt_digest', 'signature_sha256', 'verified_key_id'], 'CAUSAL_RED: CONTROLLER_COMMAND must bind the complete verified admission receipt, including READY raw-byte hash');
  assert.deepEqual(Object.keys(prepared.request.prior).sort(), ['authoritative_path', 'commit', 'expected_tip', 'file_present', 'last_event_hash', 'last_event_id', 'last_sequence', 'prior_byte_length', 'prior_bytes_sha256', 'remote_ref', 'tip', 'tree'], 'CAUSAL_RED: append begins with exact remote JSONL authority receipt');
  assert.ok(harness.calls.some(call => call.name === 'ledger.readRemoteAppend'), 'CAUSAL_RED: append is durable only after remote record readback');
});

test('TEST-DTF-R1-010: RELEASE uses an independent clean main worktree, not the Frozen Candidate worktree', async () => {
  const harness = await createCoordinatorUnderTest();
  const identity = primeState(harness, { macro_state: 'AWAITING_CONTROLLER', phase: null, state_version: 8, candidate: makeCandidate(), delivery: makeDelivery() });
  const release = signed({ command_kind: 'RELEASE', payload: { squash_sha: CANDIDATE_SHA, acceptance_ref: 'acceptance-001', merge_ref: 'merge-001', archive_ref: 'archive-001', origin_main_sha: CANDIDATE_SHA, macbook_main_sha: CANDIDATE_SHA }, expected_state_version: identity.expected_state_version, expected_state_hash: identity.expected_state_hash });
  await harness.coordinator.applyControllerCommand(release);
  const sync = harness.calls.find(call => call.name === 'git.syncMainFfOnly');
  assert.notEqual(sync.request.main_worktree_root, identity.state.repository.worktree_root, 'CAUSAL_RED: RELEASE cannot sync main from the Frozen Candidate worktree');
  assert.equal(sync.request.main_worktree_root.endsWith('/main'), true, 'CAUSAL_RED: RELEASE requires a dedicated main worktree identity');
});

test('TEST-DTF-R1-001: DISPATCH state is the exact CoordinatorStateV1 schema and route authority is not reconstructed from digest-only evidence', async t => {
  const stateKeys = ['schema_version', 'change_id', 'state_version', 'macro_state', 'phase', 'admission', 'authorization_cycle', 'repository', 'pending_agent', 'candidate', 'delivery', 'last_controller_command_id', 'blocked_reason', 'evidence', 'resume_target'];
  await t.test('DISPATCH never persists routing, validation, scope, or worktree cache fields in CoordinatorStateV1', async () => {
    const harness = await createCoordinatorUnderTest();
    const admitted = await harness.coordinator.applyControllerCommand(signed());
    assertExactResult(admitted, { operation: 'applyControllerCommand', outcome: 'APPLIED', state: 'READY' });
    assert.deepEqual(Object.keys(harness.stateStore.state).sort(), [...stateKeys].sort(), 'CAUSAL_RED: state schema is closed; dispatch_roles/dispatch_validations/dispatch_scope/worktree_checked are not durable StateV1 fields');
  });
  await t.test('the same Coordinator uses verified in-memory route authority, while a fresh digest-only restart fails closed', async () => {
    const harness = await createCoordinatorUnderTest();
    const dispatch = makeDispatch({ payload: { ...makeDispatch().payload, roles: makeDispatch().payload.roles.map((role, index) => index === 0 ? { ...role, model: 'verified-in-memory-model' } : role) } });
    const admitted = await harness.coordinator.applyControllerCommand({ command_body_bytes: bytes(dispatch), signature_bytes: new Uint8Array([1, 2, 3]) });
    assertExactResult(admitted, { operation: 'applyControllerCommand', outcome: 'APPLIED', state: 'READY' });
    const action = await harness.coordinator.run({ change_id: CHANGE_ID, expected_state_version: admitted.state_version, expected_state_hash: admitted.state_hash });
    assertExactResult(action, { operation: 'run', outcome: 'AGENT_ACTION', state: 'EXECUTING' });
    assert.equal(action.payload.action.model, 'verified-in-memory-model', 'CAUSAL_RED: the normal path uses the verified signed DISPATCH route, not a default model');
    assert.equal(action.payload.action.role, 'juaner_spec');
    const restarted = await createCoordinatorUnderTest();
    const identity = primeState(restarted, { macro_state: 'READY', phase: 'WORKTREE' });
    const fresh = await productionCoordinatorModule.createTestCoordinator(restarted.dependencies);
    const result = await fresh.run({ change_id: CHANGE_ID, expected_state_version: identity.expected_state_version, expected_state_hash: identity.expected_state_hash });
    assertExactResult(result, { operation: 'run', outcome: 'BLOCKED', state: 'BLOCKED' });
    assert.equal(result.payload.next_action, 'MANUAL_CONTROLLER_STOP', 'CAUSAL_RED: digest-only admission evidence cannot reconstruct route authority after restart');
    noCall(restarted, 'git.createOrReuseWorktree');
    noCall(restarted, 'git.inspectWorktree');
  });
});

test('TEST-DTF-R1-003: every Agent lifecycle fact is appended/read back before its action or state/Gate progress', async t => {
  await t.test('REQUESTED is durable before returning AGENT_ACTION', async () => {
    const harness = await createCoordinatorUnderTest();
    const action = await dispatchToTest(harness);
    assertExactResult(action, { operation: 'run', outcome: 'AGENT_ACTION', state: 'EXECUTING' });
    const requested = harness.calls.find(call => call.name === 'ledger.prepareAppend' && call.request.event_class === 'AGENT_RUN' && call.request.detail.stage === 'REQUESTED' && call.request.detail.correlation_id === action.payload.action.correlation_id && call.request.detail.role === action.payload.action.role && call.request.detail.phase === action.payload.action.phase);
    assert.ok(requested, 'CAUSAL_RED: REQUESTED append must precede AGENT_ACTION');
    const requestIndex = harness.calls.indexOf(requested);
    const stateWriteIndex = harness.calls.findIndex((call, index) => index > requestIndex && call.name === 'state.writeState' && call.request.state?.pending_agent?.correlation_id === action.payload.action.correlation_id && call.request.state.pending_agent.role === action.payload.action.role && call.request.state.pending_agent.phase === action.payload.action.phase);
    assert.ok(requestIndex >= 0 && requestIndex < stateWriteIndex, 'CAUSAL_RED: pending state cannot reference an Agent action before its read-back REQUESTED evidence');
  });
  await t.test('STARTED failure cannot advance state when its AGENT_RUN append/readback is unavailable', async () => {
    const harness = await createCoordinatorUnderTest();
    const action = await dispatchToTest(harness);
    const { action_kind, ...binding } = action.payload.action;
    harness.fault('ledger.readRemote', unavailable({ stage: 'PRIOR_TIP_READ' }));
    const started = await harness.coordinator.settlement({ change_id: CHANGE_ID, expected_state_version: action.state_version, expected_state_hash: action.state_hash, settlement: { ...binding, stage: 'STARTED', observed_child_id: 'child-1' } });
    assertExactResult(started, { operation: 'settlement', outcome: 'BLOCKED', state: 'EXECUTING' }); assert.equal(started.state_version, action.state_version); assert.equal(started.state_hash, action.state_hash, 'CAUSAL_RED: a missing STARTED append/readback preserves the original public state identity');
    assert.equal(harness.stateStore.state.pending_agent.started, undefined, 'CAUSAL_RED: failed STARTED evidence must leave the stored pending binding unchanged');
    const pause = harness.calls.find(call => call.name === 'state.writeLocalPause'); assert.ok(pause); const diagnostic = JSON.parse(pause.request.next_bytes); assert.equal(diagnostic.reason, 'EVIDENCE_REF_UNAVAILABLE'); assert.equal(diagnostic.next_action, 'IDENTICAL_COMMAND_REPLAY'); assert.equal(diagnostic.state_version, action.state_version); assert.equal(diagnostic.state_hash, action.state_hash);
  });
});

test('TEST-DTF-R1-005: validation, branch publication, and Handoff events are durable in normal-path order', async t => {
  await t.test('FINAL_VALIDATION appends VALIDATION_RESULT before advancing to VALIDATOR', async () => {
    await withObservedK1Prefix(async context => {
      const before = context.observedLedgerReadbacks.length;
      const result = await context.core.run({ change_id: context.command.change_id, expected_state_version: context.candidateTransition.state_version, expected_state_hash: context.candidateTransition.state_hash });
    assertExactResult(result, { operation: 'run', outcome: 'ADVANCED', state: 'DELIVERING' });
      assert.equal(result.payload.to_phase, 'VALIDATOR');
      const receipt = context.observedLedgerReadbacks.slice(before).find(entry => entry.event.event_class === 'VALIDATION_RESULT');
      assert.ok(receipt, 'CAUSAL_RED: final validation receipt must be an append/readback Ledger fact'); assert.equal(receipt.event.subject_sha, context.candidateEvent.detail.candidate_sha);
    });
  });
  await t.test('BRANCH_PUSHED is appended/read back after remote head readback and before CANDIDATE_FREEZE', async () => {
    await withObservedK1Prefix(async context => {
      const { validatorPass } = await settleOrdinaryValidatorForBoundary(context, 'dtf-branch-published');
      const result = await context.core.run({ change_id: context.command.change_id, expected_state_version: validatorPass.state_version, expected_state_hash: validatorPass.state_hash });
      assertExactResult(result, { operation: 'run', outcome: 'ADVANCED', state: 'DELIVERING' }); assert.equal(result.payload.to_phase, 'CANDIDATE_FREEZE');
      const remote = context.gatewayEvents.find(event => event.edge === 'COMPLETE' && event.gateway === 'git' && event.method === 'readRemoteBranch' && event.result?.kind === 'OK');
      const branchEvent = context.observedLedgerReadbacks.find(entry => entry.event.event_class === 'BRANCH_PUSHED');
      assert.ok(remote && branchEvent, 'CAUSAL_RED: real remote-head readback and BRANCH_PUSHED durable evidence are both required'); assert.equal(branchEvent.event.detail.remote_head, context.candidateEvent.detail.candidate_sha);
      const branchReadback = context.gatewayEvents.find(event => event.edge === 'COMPLETE' && event.gateway === 'ledger' && event.method === 'readRemoteAppend' && event.result?.value?.event_id === branchEvent.event.event_id);
      assert.ok(remote.sequence < branchReadback.sequence, 'CAUSAL_RED: BRANCH_PUSHED follows exact remote-head readback');
    });
  });
  await t.test('HANDOFF_READY receives complete HandoffV1 bytes before its event/readback', async () => {
    const pulls = []; const writes = [];
    const pull_request = {
      async queryCurrent(request) { pulls.push({ method: 'queryCurrent', request: structuredClone(request) }); return absent('current-pr'); },
      async createOrReuse(request) { pulls.push({ method: 'createOrReuse', request: structuredClone(request) }); return ok({ number: 112, url: 'https://invalid.example/pr/112', base: request.base, head_branch: request.head_branch, head_sha: request.head_sha, review_ready: true }); },
      async readback(request) { pulls.push({ method: 'readback', request: structuredClone(request) }); return ok({ number: request.number, url: 'https://invalid.example/pr/112', base: 'main', head_branch: 'work/mac-mini/m2-regression', head_sha: request.expected_head, review_ready: true }); },
    };
    const handoff = { async writeReadback(request) { writes.push(structuredClone(request)); const document = JSON.parse(Buffer.from(request.handoff_bytes).toString('utf8')); return ok({ handoff_sha256: sha256(request.handoff_bytes), delivery_id: document.delivery_id }); } };
    await withObservedK1Prefix(async context => {
      const { validatorPass } = await settleOrdinaryValidatorForBoundary(context, 'dtf-handoff-ready');
      const pushed = await context.core.run({ change_id: context.command.change_id, expected_state_version: validatorPass.state_version, expected_state_hash: validatorPass.state_hash }); assert.equal(pushed.payload.to_phase, 'CANDIDATE_FREEZE');
      const frozen = await context.core.run({ change_id: context.command.change_id, expected_state_version: pushed.state_version, expected_state_hash: pushed.state_hash }); assert.equal(frozen.payload.to_phase, 'PR');
      const pr = await context.core.run({ change_id: context.command.change_id, expected_state_version: frozen.state_version, expected_state_hash: frozen.state_hash }); assert.equal(pr.payload.to_phase, 'HANDOFF');
      const result = await context.core.run({ change_id: context.command.change_id, expected_state_version: pr.state_version, expected_state_hash: pr.state_hash });
      assertExactResult(result, { operation: 'run', outcome: 'AWAITING_CONTROLLER', state: 'AWAITING_CONTROLLER' });
      const write = writes[0]; assert.ok(write); assert.deepEqual(Object.keys(write).sort(), ['expected_sha256', 'handoff_bytes'], 'CAUSAL_RED: Handoff gateway receives canonical complete HandoffV1 bytes, not hash-only input');
      const document = JSON.parse(Buffer.from(write.handoff_bytes).toString('utf8'));
      assert.deepEqual(Object.keys(document).sort(), ['baseline_sha', 'branch', 'candidate_sha', 'candidate_tree', 'canonical_diff_contract_id', 'canonical_diff_sha256', 'change_id', 'changed_paths', 'delivery_id', 'idempotency_id', 'ledger_refs', 'open_questions', 'pull_request', 'remote_head', 'risks', 'schema_version', 'unverified', 'validation_receipts', 'validator_head', 'validator_verdict']);
      const ready = context.observedLedgerReadbacks.find(entry => entry.event.event_class === 'HANDOFF_READY'); assert.ok(ready); assert.equal(ready.event.detail.handoff_sha256, sha256(write.handoff_bytes)); assert.equal(pulls.filter(entry => entry.method === 'createOrReuse').length, 1);
    }, { pull_request, handoff });
  });
});

test('TEST-DTF-R1-009: C3 preserves the durable BLOCKED event and old STAGE State when only the BLOCKED CAS conflicts', async () => {
  let stageFaults = 0;
  let blockedCasFaults = 0;
  await withObservedK1Prefix(async context => {
    const before = await context.base.state.readState({ change_id: context.command.change_id });
    assert.equal(before.kind, 'OK');
    const result = await context.core.run({
      change_id: context.command.change_id,
      expected_state_version: context.regression.state_version,
      expected_state_hash: context.regression.state_hash,
    });
    assertExactResult(result, { operation: 'run', outcome: 'BLOCKED', state: 'DELIVERING' });
    assert.equal(result.state_version, context.regression.state_version);
    assert.equal(result.state_hash, context.regression.state_hash);
    assert.equal(result.payload.blocked_reason, 'POINTER_STATE_CONFLICT');
    assert.equal(result.payload.next_action, 'MANUAL_CONTROLLER_STOP');

    const after = await context.base.state.readState({ change_id: context.command.change_id });
    assert.equal(after.kind, 'OK');
    assert.deepEqual(after.value, before.value, 'C3: the rejected BLOCKED CAS cannot overwrite the prior DELIVERING/STAGE State');
    const retained = JSON.parse(after.value.bytes);
    assert.deepEqual(
      { macro_state: retained.macro_state, phase: retained.phase, state_version: retained.state_version, state_hash: after.value.sha256 },
      { macro_state: 'DELIVERING', phase: 'STAGE', state_version: context.regression.state_version, state_hash: context.regression.state_hash },
      'C3: the retained State identity is exactly the real Regression-to-STAGE cursor',
    );

    const stage = context.gatewayEvents.find(event => event.edge === 'COMPLETE' && event.gateway === 'git' && event.method === 'stageExact');
    assert.ok(stage, 'C3 reaches the one named STAGE boundary after real Regression');
    assert.equal(stage.actual_result.kind, 'UNAVAILABLE', 'the injected stageExact response replaces the operation before any real stage');
    assert.equal(context.gatewayEvents.filter(event => event.edge === 'START' && event.gateway === 'git' && event.method === 'readStaged').length, 1, 'Core reads the index once after the failed stage before classifying the unavailable boundary');
    assert.equal(context.gatewayEvents.some(event => event.edge === 'START' && event.gateway === 'git' && ['commitCandidate', 'pushBranch'].includes(event.method)), false, 'the failed stage has no Candidate or publication effect');
    assert.equal(stageFaults, 1);

    const blockedReadback = context.observedLedgerReadbacks.find(entry => entry.event.event_class === 'BLOCKED');
    assert.ok(blockedReadback, 'C3 keeps the already durable BLOCKED Ledger event');
    assert.equal(blockedReadback.result.kind, 'OK');
    assert.deepEqual(blockedReadback.event.detail, { blocked_reason: 'WORKTREE_DIRTY_CONFLICT', next_action: 'MANUAL_CONTROLLER_STOP', evidence_refs: [] });
    assert.equal(blockedReadback.event.state_version, context.regression.state_version);
    assert.equal(blockedReadback.event.subject_sha, context.expectedSubject.head_sha);
    assert.equal(result.payload.blocked_event_id, blockedReadback.result.value.event_id);

    const blockedWriteStart = context.gatewayEvents.find(event => event.edge === 'START' && event.gateway === 'state' && event.method === 'writeState' && event.request.state?.macro_state === 'BLOCKED');
    const blockedWrite = context.gatewayEvents.find(event => event.edge === 'COMPLETE' && event.invocation === blockedWriteStart?.invocation);
    assert.ok(blockedWriteStart && blockedWrite, 'C3 pairs the named durable BLOCKED State request with its own completion');
    assert.equal(blockedWrite.actual_result.kind, 'CONFLICT', 'the transformed expected hash causes the real State CAS rejection');
    assert.equal(blockedCasFaults, 1);

    const pauseWriteStart = context.gatewayEvents.find(event => event.edge === 'START' && event.gateway === 'state' && event.method === 'writeLocalPause');
    const pauseWrite = context.gatewayEvents.find(event => event.edge === 'COMPLETE' && event.invocation === pauseWriteStart?.invocation);
    const pauseReadbackStart = context.gatewayEvents.find(event => event.edge === 'START' && event.gateway === 'state' && event.method === 'readLocalPause' && event.sequence > pauseWrite?.sequence);
    const pauseReadback = context.gatewayEvents.find(event => event.edge === 'COMPLETE' && event.invocation === pauseReadbackStart?.invocation);
    assert.ok(pauseWriteStart && pauseWrite && pauseReadbackStart && pauseReadback);
    const diagnostic = JSON.parse(pauseWriteStart.request.next_bytes);
    assert.deepEqual(Object.keys(diagnostic).sort(), ['change_id', 'command_id', 'created_at', 'diagnostic_id', 'event_id', 'expected_event_hash', 'expected_evidence_tip', 'next_action', 'operation', 'reason', 'request_idempotency_id', 'request_sha256', 'schema_version', 'state_hash', 'state_version', 'supersedes_diagnostic_id']);
    assert.deepEqual(
      {
        change_id: diagnostic.change_id, command_id: diagnostic.command_id, operation: diagnostic.operation, reason: diagnostic.reason, next_action: diagnostic.next_action,
        request_sha256: diagnostic.request_sha256, state_version: diagnostic.state_version, state_hash: diagnostic.state_hash,
        expected_evidence_tip: diagnostic.expected_evidence_tip, event_id: diagnostic.event_id, expected_event_hash: diagnostic.expected_event_hash,
      },
      {
        change_id: context.command.change_id, command_id: context.command.command_id, operation: 'run', reason: 'POINTER_STATE_CONFLICT', next_action: 'MANUAL_CONTROLLER_STOP',
        request_sha256: sha256(canonicalJson({ change_id: context.command.change_id, expected_state_version: context.regression.state_version, expected_state_hash: context.regression.state_hash })),
        state_version: context.regression.state_version, state_hash: context.regression.state_hash,
        expected_evidence_tip: blockedReadback.result.value.commit_sha, event_id: blockedReadback.result.value.event_id, expected_event_hash: blockedReadback.result.value.event_hash,
      },
      'C3 local pause exactly binds the rejected run request and its already durable BLOCKED evidence',
    );
    assert.equal(pauseWriteStart.request.expected_sha256, null);
    assert.equal(pauseWrite.actual_result.kind, 'OK');
    assert.equal(pauseReadback.actual_result.kind, 'OK');
    assert.equal(pauseReadback.actual_result.value.bytes, pauseWriteStart.request.next_bytes);
    assert.equal(pauseReadback.actual_result.value.sha256, sha256(pauseWriteStart.request.next_bytes));
    assert.equal(result.payload.local_pause_id, diagnostic.diagnostic_id);

    const counts = {
      stages: context.gatewayEvents.filter(event => event.edge === 'START' && event.gateway === 'git' && event.method === 'stageExact').length,
      blocked: context.observedLedgerReadbacks.filter(entry => entry.event.event_class === 'BLOCKED').length,
      pauses: context.gatewayEvents.filter(event => event.edge === 'START' && event.gateway === 'state' && event.method === 'writeLocalPause').length,
    };
    const replay = await context.core.run({ change_id: context.command.change_id, expected_state_version: result.state_version, expected_state_hash: result.state_hash });
    assertExactResult(replay, { operation: 'run', outcome: 'BLOCKED', state: 'DELIVERING' });
    assert.deepEqual(
      {
        stages: context.gatewayEvents.filter(event => event.edge === 'START' && event.gateway === 'git' && event.method === 'stageExact').length,
        blocked: context.observedLedgerReadbacks.filter(entry => entry.event.event_class === 'BLOCKED').length,
        pauses: context.gatewayEvents.filter(event => event.edge === 'START' && event.gateway === 'state' && event.method === 'writeLocalPause').length,
      },
      counts,
      'C3 local-pause replay has no later stage, BLOCKED append, or pause write',
    );
  }, {
    stopAtStage: true,
    invokeGitOperation: async ({ method, operation, request }) => method === 'stageExact'
      ? (stageFaults += 1, unavailable(null))
      : operation(request),
    transformStateRequest: async ({ method, request }) => method === 'writeState' && request.state?.macro_state === 'BLOCKED'
      ? (blockedCasFaults += 1, { ...request, expected_sha256: '0'.repeat(64) })
      : request,
  });
});

test('TEST-DTF-R1-001: exact public surface, signed canonical DISPATCH, and closed pre-effect error contract', async t => {
  const harness = await createCoordinatorUnderTest();
  const { coordinator } = harness;
  await t.test('accepts one complete canonical signed body', async () => {
    const result = await coordinator.applyControllerCommand(signed());
    assertExactResult(result, { operation: 'applyControllerCommand', outcome: 'APPLIED', state: 'READY' });
    assert.equal(result.payload.command_kind, 'DISPATCH');
  });
  for (const [name, input, code] of [
    ['noncanonical bytes', { command_body_bytes: new TextEncoder().encode('{ }'), signature_bytes: new Uint8Array([1]) }, 'INPUT_INVALID'],
    ['signature failure', signed(), 'COMMAND_SIGNATURE_INVALID'],
    ['expired command', signed({ expires_at: '2020-01-01T00:00:00.000Z' }), 'COMMAND_EXPIRED'],
    ['second Change while slot occupied', signed({ change_id: CHANGE_B }), 'WIP_AUTHORITY_INVALID'],
    ['forbidden trust payload', signed({ public_key: 'injected' }), 'INPUT_INVALID'],
  ]) {
    await t.test(`rejects ${name} before protected effect`, async () => {
      const isolated = await createCoordinatorUnderTest();
      if (name === 'signature failure') isolated.fault('verifier.verify', { kind: 'REJECTED', error_code: code });
      if (name === 'second Change while slot occupied') primeState(isolated, { macro_state: 'READY', phase: 'WORKTREE' });
      const result = await isolated.coordinator.applyControllerCommand(input);
      assertExactResult(result, { operation: 'applyControllerCommand', outcome: 'REJECTED', code });
      assert.equal(isolated.count('verifier.verify'), name === 'noncanonical bytes' ? 0 : 1);
      for (const effect of ['state.writePointer', 'state.writeState', 'ledger.readRemote', 'git.createOrReuseWorktree', 'pull_request.createOrReuse', 'handoff.writeReadback']) noCall(isolated, effect);
    });
  }
  await t.test('rejects an otherwise signed command body with an extra field before pointer publication', async () => {
    const isolated = await createCoordinatorUnderTest();
    const result = await isolated.coordinator.applyControllerCommand(signed({ unrecognized_command_field: true }));
    assertExactResult(result, { operation: 'applyControllerCommand', outcome: 'REJECTED', code: 'INPUT_INVALID' });
    noCall(isolated, 'state.writePointer');
    noCall(isolated, 'state.writeState');
  });
});

test('TEST-DTF-R1-002: pointer-first admission, six states/phases, status-only read, and operation mutex', async t => {
  const harness = await createCoordinatorUnderTest();
  await t.test('publishes and reads pointer before READY state and admission event', async () => {
    const result = await harness.coordinator.applyControllerCommand(signed());
    assertExactResult(result, { operation: 'applyControllerCommand', outcome: 'APPLIED', state: 'READY' });
    assert.deepEqual(harness.calls.slice(0, 5).map(call => call.name), ['verifier.verify', 'state.readPointer', 'state.writePointer', 'state.readPointer', 'state.writeState']);
  });
  await t.test('reports incomplete pointer admission as INVALID and run cannot create a worktree', async () => {
    const isolated = await createCoordinatorUnderTest();
    isolated.stateStore.pointer.active_change_id = CHANGE_ID;
    isolated.fault('state.readState', unavailable({ stage: 'READY_READ' }));
    const status = await isolated.coordinator.status({ change_id: CHANGE_ID });
    assert.deepEqual(status, { schema_version: '1.0', operation: 'status', outcome: 'REJECTED', error_code: 'WIP_AUTHORITY_INVALID', change_id: CHANGE_ID });
    const run = await isolated.coordinator.run({ change_id: CHANGE_ID, ...stateIdentity });
    assertExactResult(run, { operation: 'run', outcome: 'BLOCKED', state: 'BLOCKED' });
    assert.equal(run.payload.next_action, 'MANUAL_CONTROLLER_STOP');
    noCall(isolated, 'git.createOrReuseWorktree');
  });
  await t.test('rejects Change B at every post-slot window without enumerating other Changes', async () => {
    const isolated = await createCoordinatorUnderTest(); isolated.stateStore.pointer.active_change_id = CHANGE_ID;
    const result = await isolated.coordinator.applyControllerCommand(signed({ change_id: CHANGE_B, command_id: 'command-b', idempotency_id: 'idem-b' }));
    assertExactResult(result, { operation: 'applyControllerCommand', outcome: 'REJECTED', code: 'WIP_AUTHORITY_INVALID' });
    noCall(isolated, 'ledger.readRemote');
  });
  await t.test('a mutex contender returns the one closed busy error and writes no state', async () => {
    const isolated = await createCoordinatorUnderTest(); assert.equal(await isolated.mutex.tryAcquire(), true);
    const result = await isolated.coordinator.run({ change_id: CHANGE_ID, ...stateIdentity });
    assertExactResult(result, { operation: 'run', outcome: 'REJECTED', code: 'OPERATION_BUSY' });
    noCall(isolated, 'state.writeState'); await isolated.mutex.release();
  });
  await t.test('run compares the supplied version and exact state bytes before its first mechanical effect', async () => {
    const isolated = await createCoordinatorUnderTest();
    const dispatched = await isolated.coordinator.applyControllerCommand(signed());
    const result = await isolated.coordinator.run({
      change_id: CHANGE_ID,
      expected_state_version: dispatched.state_version + 1,
      expected_state_hash: dispatched.state_hash,
    });
    assertExactResult(result, { operation: 'run', outcome: 'REJECTED', code: 'STATE_CONFLICT' });
    noCall(isolated, 'git.createOrReuseWorktree');
  });
  assert.deepEqual(MACRO_STATES, ['READY', 'EXECUTING', 'DELIVERING', 'AWAITING_CONTROLLER', 'BLOCKED', 'CLOSED']);
  assert.deepEqual(PHASES, ['WORKTREE', 'SPEC', 'TEST_RED', 'WORKER_GREEN', 'REGRESSION', 'STAGE', 'CANDIDATE_COMMIT', 'FINAL_VALIDATION', 'VALIDATOR', 'BRANCH_PUSH', 'CANDIDATE_FREEZE', 'PR', 'HANDOFF']);
});

test('TEST-DTF-R1-003: normal serial path uses AgentAction and exact formal Agent settlements', async t => {
  const harness = await createCoordinatorUnderTest();
  const dispatched = await harness.coordinator.applyControllerCommand(signed());
  const action = await harness.coordinator.run({ change_id: CHANGE_ID, expected_state_version: dispatched.state_version, expected_state_hash: dispatched.state_hash });
  assertExactResult(action, { operation: 'run', outcome: 'AGENT_ACTION', state: 'EXECUTING' });
  const { action_kind, ...binding } = action.payload.action;
  assert.equal(action_kind, 'LAUNCH_AGENT');
  await t.test('accepts STARTED then PASS RESULT with exact common binding', async () => {
    const started = await harness.coordinator.settlement({ change_id: CHANGE_ID, expected_state_version: action.state_version, expected_state_hash: action.state_hash, settlement: { ...binding, stage: 'STARTED', observed_child_id: 'child-001' } });
    assertExactResult(started, { operation: 'settlement', outcome: 'WAITING', state: 'EXECUTING' });
    const result = await harness.coordinator.settlement({ change_id: CHANGE_ID, expected_state_version: started.state_version, expected_state_hash: started.state_hash, settlement: { ...binding, stage: 'RESULT', observed_child_id: 'child-001', status: 'PASS', artifact_path: 'outputs/spec.md', artifact_sha256: SHA256 } });
    assertExactResult(result, { operation: 'settlement', outcome: 'ADVANCED', state: 'EXECUTING' });
  });
  await t.test('rejects RESULT without exact pending STARTED binding', async () => {
    const isolated = await createCoordinatorUnderTest(); const result = await isolated.coordinator.settlement({ change_id: CHANGE_ID, ...stateIdentity, settlement: { stage: 'RESULT' } });
    assertExactResult(result, { operation: 'settlement', outcome: 'REJECTED', code: 'SETTLEMENT_INVALID' });
  });
  await t.test('Agent FAIL never advances a formal Gate', async () => {
    const isolated = await createCoordinatorUnderTest();
    const dispatched = await isolated.coordinator.applyControllerCommand(signed());
    const action = await isolated.coordinator.run({ change_id: CHANGE_ID, expected_state_version: dispatched.state_version, expected_state_hash: dispatched.state_hash });
    const { action_kind, ...binding } = action.payload.action;
    assert.equal(action_kind, 'LAUNCH_AGENT');
    const started = await isolated.coordinator.settlement({ change_id: CHANGE_ID, expected_state_version: action.state_version, expected_state_hash: action.state_hash, settlement: { ...binding, stage: 'STARTED', observed_child_id: 'spec-fail-child' } });
    const failed = await isolated.coordinator.settlement({ change_id: CHANGE_ID, expected_state_version: started.state_version, expected_state_hash: started.state_hash, settlement: { ...binding, stage: 'RESULT', observed_child_id: 'spec-fail-child', status: 'FAIL', artifact_path: 'outputs/spec-fail.md', artifact_sha256: SHA256 } });
    assertExactResult(failed, { operation: 'settlement', outcome: 'BLOCKED', state: 'BLOCKED' });
    assert.equal(failed.payload.next_action, 'MANUAL_CONTROLLER_STOP');
  });
  await t.test('a fresh Core without TEST_ACCEPTED_DISPATCH fails closed before an Agent action or default route', async () => {
    const isolated = await createCoordinatorUnderTest();
    const dispatched = await isolated.coordinator.applyControllerCommand(signed());
    const fresh = productionCoordinatorModule.createCoordinatorCore({ ...isolated.dependencies });
    const before = { worktree: isolated.count('git.createOrReuseWorktree'), validation: isolated.count('validation.execute'), push: isolated.count('git.pushBranch'), pr: isolated.count('pull_request.createOrReuse'), handoff: isolated.count('handoff.writeReadback') };
    const stopped = await fresh.run({ change_id: CHANGE_ID, expected_state_version: dispatched.state_version, expected_state_hash: dispatched.state_hash });
    assertExactResult(stopped, { operation: 'run', outcome: 'BLOCKED', state: 'BLOCKED' }); assert.equal(stopped.payload.next_action, 'MANUAL_CONTROLLER_STOP'); assert.equal(stopped.payload.action, undefined, 'a non-PR/HANDOFF fresh Core cannot synthesize a default Agent route');
    assert.deepEqual({ worktree: isolated.count('git.createOrReuseWorktree'), validation: isolated.count('validation.execute'), push: isolated.count('git.pushBranch'), pr: isolated.count('pull_request.createOrReuse'), handoff: isolated.count('handoff.writeReadback') }, before, 'fresh route refusal has no protected effect');
  });
  await t.test('the same dependency Test seam retains only its explicitly injected route authority', async () => {
    const isolated = await createCoordinatorUnderTest();
    const dispatched = await isolated.coordinator.applyControllerCommand(signed());
    const seam = await productionCoordinatorModule.createTestCoordinator(isolated.dependencies);
    const action = await seam.run({ change_id: CHANGE_ID, expected_state_version: dispatched.state_version, expected_state_hash: dispatched.state_hash });
    assertExactResult(action, { operation: 'run', outcome: 'AGENT_ACTION', state: 'EXECUTING' }); assert.equal(action.payload.action.agent, 'juaner_spec'); assert.equal(action.payload.action.model, 'gpt-5.6-terra'); assert.equal(action.payload.action.sandbox, 'workspace-write'); assert.deepEqual(action.payload.action.allowed_paths, ['openspec/changes/dual-device-transition-foundation/**']);
    assert.notEqual(seam, isolated.coordinator, 'the positive is a second Core object but only through the explicit Test seam, never independent durable recovery');
  });
  await t.test('distinguishes START_FAILED, INTERRUPTED, and precondition-only NOT_STARTED', async () => {
    for (const stage of ['START_FAILED', 'INTERRUPTED', 'NOT_STARTED']) assert.ok(AGENT_STAGES.includes(stage));
    assert.equal(harness.mutex.isHeld(), false, 'Agent wait must release the operation mutex');
  });
});

test('TEST-DTF-R1-004: signed REVISION/RESUME and one causal Validator repair per authorization cycle', async t => {
  await t.test('first reliable in-scope Validator FAIL consumes zero-to-one and requests causal Test RED', async () => {
    await withObservedK1Prefix(async context => {
      const reachedRepair = await reachOrdinaryRepairAction(context);
      const { validatorFailed, repairAction } = reachedRepair;
      assertExactResult(reachedRepair.validatorAction, { operation: 'run', outcome: 'AGENT_ACTION', state: 'DELIVERING' });
      assertExactResult(reachedRepair.started, { operation: 'settlement', outcome: 'WAITING', state: 'DELIVERING' });
      assert.equal(reachedRepair.validator.role, 'juaner_validator', 'PRECONDITION_NOT_REACHED: VALIDATOR must request juaner_validator');
      assert.equal(reachedRepair.validator.subject_sha, context.candidateEvent.detail.candidate_sha, 'PRECONDITION_NOT_REACHED: Validator action must bind the exact real Candidate');
      assert.equal(reachedRepair.validator.action_kind, 'LAUNCH_AGENT');
      assertExactResult(validatorFailed, { operation: 'settlement', outcome: 'ADVANCED', state: 'EXECUTING' });
      assert.equal(validatorFailed.payload.to_phase, 'TEST_RED');
      assertExactResult(repairAction, { operation: 'run', outcome: 'AGENT_ACTION', state: 'EXECUTING' });
      assert.equal(repairAction.payload.action.role, 'juaner_test', 'PRECONDITION_NOT_REACHED: first Validator FAIL must request causal juaner_test');
      assert.equal(repairAction.payload.action.phase, 'TEST_RED');
      const stateReadback = await context.base.state.readState({ change_id: context.command.change_id }); assert.equal(stateReadback.kind, 'OK');
      assert.equal(JSON.parse(stateReadback.value.bytes).authorization_cycle.auto_repair_attempt, 1);
      const sourceReadbacks = context.observedLedgerReadbacks.slice(reachedRepair.readbackFrontierBeforeValidatorResult);
      const agentResult = sourceReadbacks.find(entry => entry.event.event_class === 'AGENT_RUN' && entry.event.detail?.stage === 'RESULT' && entry.event.detail?.correlation_id === reachedRepair.validator.correlation_id);
      const receipt = sourceReadbacks.find(entry => entry.event.event_class === 'VALIDATION_RESULT' && entry.event.detail?.idempotency_id === reachedRepair.validator.idempotency_id);
      assert.ok(agentResult && receipt, 'the real Validator RESULT and receipt must both complete Ledger readback before repair admission');
      assert.equal(receipt.event.sequence, agentResult.event.sequence + 1, 'the real Validator receipt is the immediate Ledger successor of its RESULT');
    });
  });
  await t.test('second Validator FAIL blocks exactly for signed Controller revision', async () => {
    const harness = await createCoordinatorUnderTest();
    const admitted = await harness.coordinator.applyControllerCommand(signed());
    assertExactResult(admitted, { operation: 'applyControllerCommand', outcome: 'APPLIED', state: 'READY' });
    const admittedStatus = await publicStatus(harness);
    assert.deepEqual({ state: admittedStatus.state, state_version: admittedStatus.state_version, state_hash: admittedStatus.state_hash, phase: admittedStatus.payload.phase }, { state: 'READY', state_version: admitted.state_version, state_hash: admitted.state_hash, phase: 'WORKTREE' }, 'T1 legal public DISPATCH establishes the second-Validator source identity before its one A2-bounded state mutation');
    const identity = primeState(harness, {
      macro_state: 'DELIVERING', phase: 'VALIDATOR',
      admission: harness.stateStore.state.admission,
      repository: structuredClone(harness.stateStore.state.repository),
      candidate: makeCandidate({ frozen: false, validator_head: null }), delivery: null,
      authorization_cycle: { command_id: 'command-001', command_kind: 'DISPATCH', auto_repair_attempt: 1 },
    });
    const run = await harness.coordinator.run({ change_id: CHANGE_ID, ...identity });
    assertExactResult(run, { operation: 'run', outcome: 'AGENT_ACTION', state: 'DELIVERING' });
    assert.equal(run.payload.action.role, 'juaner_validator', 'PRECONDITION_NOT_REACHED: exhausted Validator boundary must still request juaner_validator');
    assert.equal(run.payload.action.subject_sha, CANDIDATE_SHA, 'PRECONDITION_NOT_REACHED: exhausted Validator action must bind the exact Candidate');
    const { action_kind, ...binding } = run.payload.action; assert.equal(action_kind, 'LAUNCH_AGENT');
    const started = await harness.coordinator.settlement({ change_id: CHANGE_ID, expected_state_version: run.state_version, expected_state_hash: run.state_hash, settlement: { ...binding, stage: 'STARTED', observed_child_id: 'validator-child-002' } });
    assertExactResult(started, { operation: 'settlement', outcome: 'WAITING', state: 'DELIVERING' });
    const validator_artifact = { schema_version: '1.0', change_id: CHANGE_ID, candidate_sha: run.payload.action.subject_sha, validator_head: run.payload.action.subject_sha, verdict: 'FAIL', findings: [{ finding_id: 'second-validator-component-finding', classification: 'IMPLEMENTATION_IN_SCOPE', requirement_ids: ['REQ-DTF-004'], acceptance_ids: ['AC-DTF-004-08'], paths: ['tools/harness/change-coordinator/coordinator.mjs'], summary: 'component-bound second Validator failure', evidence_refs: [{ kind: 'TEST', id: 'DTF-R1-004', sha256: SHA256, subject_sha: run.payload.action.subject_sha }] }], risks: [], unverified: [], open_questions: [] };
    const artifact_sha256 = sha256(canonicalJson(validator_artifact));
    const result = await harness.coordinator.settlement({ change_id: CHANGE_ID, expected_state_version: started.state_version, expected_state_hash: started.state_hash, settlement: { ...binding, stage: 'RESULT', observed_child_id: 'validator-child-002', status: 'FAIL', artifact_path: 'outputs/validator.md', artifact_sha256, validator_artifact } });
    assertExactResult(result, { operation: 'settlement', outcome: 'BLOCKED', state: 'BLOCKED' });
    assert.equal(result.payload.blocked_reason, 'VALIDATOR_SECOND_FAIL'); assert.equal(result.payload.next_action, 'REVISION');
    noCall(harness, 'git.pushBranch');
  });
  await t.test('RESUME never resets repair and only exact safe target is accepted', async () => {
    const harness = await createCoordinatorUnderTest();
    const identity = primeState(harness, {
      macro_state: 'BLOCKED', phase: null, blocked_reason: 'VALIDATOR_SECOND_FAIL',
      candidate: makeCandidate({ frozen: false, validator_head: null }), delivery: null,
      authorization_cycle: { command_id: 'command-001', command_kind: 'DISPATCH', auto_repair_attempt: 1 },
      resume_target: null,
    });
    const result = await harness.coordinator.applyControllerCommand(signed({ command_kind: 'RESUME', payload: { resume_target: { macro_state: 'EXECUTING', phase: 'WORKTREE' } }, expected_state_version: identity.expected_state_version, expected_state_hash: identity.expected_state_hash }));
    assertExactResult(result, { operation: 'applyControllerCommand', outcome: 'REJECTED', code: 'STATE_CONFLICT' });
    reached(harness, 'verifier.verify');
  });
});

test('TEST-DTF-R1-005: seven Ledger classes, byte authority, typed receipts, and local evidence pause', async t => {
  const harness = await createCoordinatorUnderTest();
  assert.deepEqual(EVENT_CLASSES, ['CONTROLLER_COMMAND', 'AGENT_RUN', 'VALIDATION_RESULT', 'CANDIDATE_COMMITTED', 'BRANCH_PUSHED', 'HANDOFF_READY', 'BLOCKED']);
  await t.test('appends through remote-read, prepare, commit-push, and remote-readback in that order', async () => {
    await harness.coordinator.applyControllerCommand(signed());
    assert.deepEqual(harness.calls.filter(call => call.name.startsWith('ledger.')).map(call => call.name), ['ledger.readRemote', 'ledger.prepareAppend', 'ledger.commitAndPush', 'ledger.readRemoteAppend']);
  });
  await t.test('Ledger unavailable persists only exact replayable local pause, never a durable BLOCKED event', async () => {
    const isolated = await createCoordinatorUnderTest(); isolated.fault('ledger.readRemote', unavailable({ stage: 'PRIOR_TIP_READ' }));
    const result = await isolated.coordinator.applyControllerCommand(signed());
    assertExactResult(result, { operation: 'applyControllerCommand', outcome: 'BLOCKED', state: null });
    assert.equal(result.payload.next_action, 'IDENTICAL_COMMAND_REPLAY'); noCall(isolated, 'git.createOrReuseWorktree');
  });
  await t.test('Ledger conflict is a manual stop and does not write another event class', async () => {
    const isolated = await createCoordinatorUnderTest(); isolated.fault('ledger.readRemoteAppend', conflict('different-record'));
    const result = await isolated.coordinator.applyControllerCommand(signed());
    assertExactResult(result, { operation: 'applyControllerCommand', outcome: 'BLOCKED', state: 'BLOCKED' });
    assert.equal(result.payload.blocked_reason, 'LEDGER_APPEND_AMBIGUOUS');
  });
});

test('TEST-DTF-R1-006: Candidate stages exact paths, reads index tree, commits non-amend, and validates Candidate', async t => {
  await t.test('STAGE reads only signed paths and its exact index tree', async () => {
    await withObservedK1Prefix(async context => {
      assertExactResult(context.regression, { operation: 'run', outcome: 'ADVANCED', state: 'DELIVERING' });
      assert.equal(context.regression.payload.to_phase, 'STAGE');
      assertExactResult(context.candidateTransition, { operation: 'run', outcome: 'ADVANCED', state: 'DELIVERING' });
      assert.equal(context.candidateTransition.payload.to_phase, 'FINAL_VALIDATION');
      const stageStarts = context.gatewayEvents.filter(event => event.edge === 'START' && event.gateway === 'git' && event.method === 'stageExact');
      const stageCompletes = context.gatewayEvents.filter(event => event.edge === 'COMPLETE' && event.gateway === 'git' && event.method === 'stageExact');
      const stagedReadStarts = context.gatewayEvents.filter(event => event.edge === 'START' && event.gateway === 'git' && event.method === 'readStaged');
      const stagedReads = context.gatewayEvents.filter(event => event.edge === 'COMPLETE' && event.gateway === 'git' && event.method === 'readStaged');
      const commitStarts = context.gatewayEvents.filter(event => event.edge === 'START' && event.gateway === 'git' && event.method === 'commitCandidate');
      const commitCompletes = context.gatewayEvents.filter(event => event.edge === 'COMPLETE' && event.gateway === 'git' && event.method === 'commitCandidate');
      const [stage] = stageStarts; const [firstIndexRead, secondIndexRead] = stagedReads; const [commit] = commitStarts;
      assert.equal(stageStarts.length, 1, 'STAGE invokes stageExact exactly once'); assert.equal(stageCompletes.length, 1, 'the one stageExact invocation has one terminal completion'); assert.equal(stageCompletes[0].invocation, stage.invocation);
      assert.equal(stagedReadStarts.length, 2, 'STAGE has exactly two index-read starts'); assert.equal(stagedReads.length, 2, 'STAGE reads the exact staged index and then proves the post-commit index is empty'); assert.deepEqual(stagedReads.map(event => event.invocation), stagedReadStarts.map(event => event.invocation), 'each exact index-read start has one matching terminal completion');
      assert.equal(commitStarts.length, 1, 'STAGE has exactly one Candidate commit start'); assert.equal(commitCompletes.length, 1, 'the one Candidate commit has one terminal completion'); assert.equal(commitCompletes[0].invocation, commit.invocation);
      assert.ok(stage.sequence < firstIndexRead.sequence && firstIndexRead.sequence < commit.sequence && commit.sequence < secondIndexRead.sequence, 'the exact stage, first index proof, Candidate commit, and empty post-commit index proof retain their required order');
      assert.deepEqual(stage.request.paths, ['tracked.txt']);
      assert.deepEqual(stagedReads[0].actual_result.value, { staged_paths: ['tracked.txt'], staged_paths_sha256: sha256(canonicalJson(['tracked.txt'])), index_tree: context.candidateEvent.detail.tree });
      assert.deepEqual(stagedReads[1].actual_result.value, { staged_paths: [], staged_paths_sha256: sha256(canonicalJson([])), index_tree: context.candidateEvent.detail.tree });
      assert.deepEqual(context.candidateEvent.detail.staged_paths, ['tracked.txt']);
      assert.equal(context.candidateEvent.detail.parent, context.expectedSubject.head_sha);
      assert.equal(context.candidateEvent.detail.worktree_snapshot_sha256, context.expectedSnapshot.worktree_snapshot_sha256);
    });
  });
  await t.test('CANDIDATE_COMMIT commits and reads back the exact Candidate', async () => {
    await withObservedK1Prefix(async context => {
      assertExactResult(context.candidateTransition, { operation: 'run', outcome: 'ADVANCED', state: 'DELIVERING' });
      assert.equal(context.candidateTransition.payload.to_phase, 'FINAL_VALIDATION');
      const candidateCalls = context.gatewayEvents.filter(event => event.edge === 'START' && event.gateway === 'git' && ['commitCandidate', 'readCommit'].includes(event.method));
      assert.deepEqual(candidateCalls.map(event => event.method), ['readCommit', 'commitCandidate', 'readCommit']);
      assert.equal(candidateCalls[0].request.sha, context.expectedSubject.head_sha, 'the actual parent object is read before Candidate commit');
      assert.equal(candidateCalls[1].request.expected_parent, context.expectedSubject.head_sha, 'the commit binds that independently read parent');
      assert.equal(candidateCalls[2].request.sha, context.candidateEvent.detail.candidate_sha, 'the committed Candidate is independently read back after commit');
      assert.equal(context.candidateEvent.detail.parent, context.expectedSubject.head_sha);
      assert.notEqual(context.candidateEvent.detail.candidate_sha, context.expectedSubject.head_sha);
      assert.match(context.candidateEvent.detail.tree, /^[0-9a-f]{40}$/);
      assert.equal(context.candidateEvent.detail.worktree_snapshot_sha256, context.expectedSnapshot.worktree_snapshot_sha256);
    });
  });
  await t.test('FINAL_VALIDATION runs against the exact unfrozen Candidate', async () => {
    await withObservedK1Prefix(async context => {
      const before = context.observedLedgerReadbacks.length;
      const result = await context.core.run({ change_id: context.command.change_id, expected_state_version: context.candidateTransition.state_version, expected_state_hash: context.candidateTransition.state_hash });
      assertExactResult(result, { operation: 'run', outcome: 'ADVANCED', state: 'DELIVERING' });
      assert.equal(result.payload.to_phase, 'VALIDATOR');
      const definition = expectedExecutionDefinitions(context.command.payload.validations).find(item => item.id === 'final-validation-candidate');
      assert.ok(definition);
      const subject = { kind: 'CANDIDATE', repository_root: context.expectedSubject.repository_root, worktree_root: context.coreWorktree, branch: context.expectedSubject.branch, head_sha: context.candidateEvent.detail.candidate_sha, common_git_dir: context.expectedSubject.common_git_dir, allowed_paths: context.command.scope.allowed_paths, forbidden_paths: context.command.scope.forbidden_paths, candidate_sha: context.candidateEvent.detail.candidate_sha, candidate_tree: context.candidateEvent.detail.tree };
      const expected = expectedCandidateReceipt(subject, definition, { status: 'COMPLETED', verdict: 'PASS', failure_code: null }, 'candidate-final\n', '');
      const finalRequests = context.gatewayEvents.filter(event => event.edge === 'START' && event.gateway === 'validation' && event.method === 'execute' && event.request.definition.id === definition.id);
      assert.deepEqual(finalRequests.map(event => event.request), [{ definition, subject }], 'FINAL_VALIDATION invokes the real Gateway exactly once with the unfrozen Candidate subject, not only a later Ledger receipt');
      const finalReadbacks = context.observedLedgerReadbacks.slice(before).filter(entry => entry.event.event_class === 'VALIDATION_RESULT');
      assert.equal(finalReadbacks.length, 1, 'the Candidate validation has exactly one durable readback');
      assertExactWorktreeReceipt(finalReadbacks[0].event.detail, expected);
      assert.equal(finalReadbacks[0].event.subject_sha, context.candidateEvent.detail.candidate_sha);
    });
  });
  await t.test('out-of-scope dirty worktree blocks before staging or Candidate commit', async () => {
    await withObservedK1Prefix(async context => {
      const frontier = Math.max(...context.gatewayEvents.map(event => event.sequence));
      await writeFile(path.join(context.coreWorktree, 'unexpected.txt'), 'scope escape after Regression\n');
      const result = await context.core.run({ change_id: context.command.change_id, expected_state_version: context.regression.state_version, expected_state_hash: context.regression.state_hash });
      assertExactResult(result, { operation: 'run', outcome: 'BLOCKED', state: 'BLOCKED' });
      assert.equal(result.payload.blocked_reason, 'WORKTREE_DIRTY_CONFLICT');
      const stageWindow = context.gatewayEvents.filter(event => event.sequence > frontier);
      const inspected = stageWindow.find(event => event.edge === 'START' && event.gateway === 'git' && event.method === 'inspectWorktree');
      assert.ok(inspected, 'the real post-Regression STAGE inspection receives the single out-of-scope Worker path');
      const inspection = stageWindow.find(event => event.edge === 'COMPLETE' && event.gateway === 'git' && event.method === 'inspectWorktree' && event.invocation === inspected.invocation);
      assert.deepEqual(inspection.actual_result.value.status_entries.map(entry => entry.path), ['tracked.txt', 'unexpected.txt']);
      assert.equal(context.observedStageRequests.length, 0, 'out-of-scope dirty content cannot reach stageExact/readStaged');
      assert.equal(stageWindow.some(event => event.edge === 'START' && event.gateway === 'git' && ['commitCandidate', 'readCommit'].includes(event.method)), false, 'the rejected path cannot create or read a Candidate');
    }, { stopAtStage: true });
  });
  await t.test('REGRESSION cannot advance until affected-suite and TEST_ASSET_RETIREMENT receipts both pass', async () => {
    await withObservedK1Prefix(async context => {
      assertExactResult(context.regression, { operation: 'run', outcome: 'ADVANCED', state: 'DELIVERING' });
      assert.equal(context.regression.payload.to_phase, 'STAGE');
      const receipts = context.observedLedgerReadbacks.filter(entry => entry.event.event_class === 'VALIDATION_RESULT').slice(-2);
      assert.deepEqual(receipts.map(entry => entry.event.detail.validation_scope), ['AFFECTED_SUITE', 'TEST_ASSET_RETIREMENT']);
      assert.equal(receipts[1].event.sequence, receipts[0].event.sequence + 1, 'both real Regression receipts are adjacent before STAGE');
      assert.deepEqual(receipts.map(entry => entry.event.subject_sha), [context.expectedSubject.head_sha, context.expectedSubject.head_sha]);
    });
  });
});

test('TEST-DTF-R1-009: only four named readback boundaries recover, ambiguity stops later run without a gateway replay', async t => {
  await t.test('Candidate commit ambiguity has one real worktree inspection then MANUAL_CONTROLLER_STOP', async () => {
    let attempts = 0;
    await withObservedK1Prefix(async context => {
      const first = await context.core.run({ change_id: context.command.change_id, expected_state_version: context.regression.state_version, expected_state_hash: context.regression.state_hash });
      assertExactResult(first, { operation: 'run', outcome: 'BLOCKED', state: 'BLOCKED' });
      assert.equal(first.payload.blocked_reason, 'CANDIDATE_COMMIT_AMBIGUOUS'); assert.equal(first.payload.next_action, 'MANUAL_CONTROLLER_STOP');
      const commits = context.gatewayEvents.filter(event => event.edge === 'START' && event.gateway === 'git' && event.method === 'commitCandidate');
      const inspectionStarts = context.gatewayEvents.filter(event => event.edge === 'START' && event.gateway === 'git' && event.method === 'inspectWorktree' && event.sequence > commits[0]?.sequence);
      const [inspectionStart] = inspectionStarts;
      const inspectionTerminals = context.gatewayEvents.filter(event => ['COMPLETE', 'THROW'].includes(event.edge) && event.invocation === inspectionStart?.invocation);
      const [inspectionThrow] = inspectionTerminals;
      assert.equal(attempts, 1); assert.equal(commits.length, 1); assert.equal(inspectionStarts.length, 1, 'the ambiguous Candidate boundary starts exactly one post-commit inspection'); assert.equal(inspectionTerminals.length, 1, 'the one post-commit inspection has exactly one terminal result'); assert.equal(inspectionThrow?.edge, 'THROW'); assert.ok(inspectionStart && inspectionThrow, 'the ambiguous Candidate boundary reaches one real post-commit inspection that throws on the retained staged index');
      assert.ok(commits[0].sequence < inspectionStart.sequence, 'the real worktree inspection follows the single ambiguous Candidate attempt');
      const stagedRead = context.gatewayEvents.find(event => event.edge === 'COMPLETE' && event.gateway === 'git' && event.method === 'readStaged' && event.sequence < commits[0].sequence);
      const head = await run(GIT, ['rev-parse', 'HEAD'], { cwd: context.coreWorktree, env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' } }); const branch = await run(GIT, ['branch', '--show-current'], { cwd: context.coreWorktree, env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' } }); const index = await run(GIT, ['write-tree'], { cwd: context.coreWorktree, env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' } }); const cached = await run(GIT, ['diff', '--cached', '--name-only'], { cwd: context.coreWorktree, env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' } });
      for (const physical of [head, branch, index, cached]) assert.equal(physical.code, 0, physical.stderr);
      assert.equal(head.stdout.trim(), context.expectedSubject.head_sha, 'the synthetic ambiguous response created no Candidate HEAD'); assert.equal(branch.stdout.trim(), context.expectedSubject.branch); assert.equal(commits[0].request.expected_parent, head.stdout.trim()); assert.equal(index.stdout.trim(), stagedRead.actual_result.value.index_tree, 'the physical index remains the exact staged tree'); assert.equal(cached.stdout.trim(), 'tracked.txt', 'the retained staged Worker path explains the inspection THROW');
      const counts = { commits: commits.length, inspections: inspectionStarts.length, inspection_terminals: inspectionTerminals.length };
      const replay = await context.core.run({ change_id: context.command.change_id, expected_state_version: first.state_version, expected_state_hash: first.state_hash });
      assertExactResult(replay, { operation: 'run', outcome: 'BLOCKED', state: 'BLOCKED' });
      assert.deepEqual({ commits: context.gatewayEvents.filter(event => event.edge === 'START' && event.gateway === 'git' && event.method === 'commitCandidate').length, inspections: context.gatewayEvents.filter(event => event.edge === 'START' && event.gateway === 'git' && event.method === 'inspectWorktree' && event.sequence > commits[0].sequence).length, inspection_terminals: context.gatewayEvents.filter(event => ['COMPLETE', 'THROW'].includes(event.edge) && event.invocation === inspectionStart.invocation).length }, counts, 'blocked Candidate replay cannot repeat an ambiguous Git effect');
    }, {
      stopAtStage: true,
      invokeGitOperation: async ({ method, operation, request }) => method === 'commitCandidate' ? (attempts += 1, ambiguous(null)) : operation(request),
    });
  });
  await t.test('branch push ambiguity has two real absent readbacks then MANUAL_CONTROLLER_STOP', async () => {
    let candidateSha = null; let pushAttempts = 0; let remoteReads = 0;
    await withObservedK1Prefix(async context => {
      candidateSha = context.candidateEvent.detail.candidate_sha;
      const { validatorPass } = await settleOrdinaryValidatorForBoundary(context, 'dtf-branch-ambiguity');
      const first = await context.core.run({ change_id: context.command.change_id, expected_state_version: validatorPass.state_version, expected_state_hash: validatorPass.state_hash });
      assertExactResult(first, { operation: 'run', outcome: 'BLOCKED', state: 'BLOCKED' }); assert.equal(first.payload.blocked_reason, 'BRANCH_PUSH_AMBIGUOUS'); assert.equal(first.payload.next_action, 'MANUAL_CONTROLLER_STOP');
      const pushes = context.gatewayEvents.filter(event => event.edge === 'START' && event.gateway === 'git' && event.method === 'pushBranch');
      const reads = context.gatewayEvents.filter(event => event.edge === 'COMPLETE' && event.gateway === 'git' && event.method === 'readRemoteBranch' && event.sequence > pushes[0].sequence);
      assert.equal(pushes.length, 2); assert.equal(reads.length, 2); assert.deepEqual(pushes[1].request, pushes[0].request, 'the sole branch continuation preserves Candidate, absent predecessor, and idempotency identity');
      assert.ok(reads.every(event => event.actual_result.kind === 'ABSENT' && event.result.kind === 'ABSENT'), 'each actual controlled-boundary read proves the real remote remains absent');
      const counts = { pushes: pushes.length, reads: reads.length };
      const replay = await context.core.run({ change_id: context.command.change_id, expected_state_version: first.state_version, expected_state_hash: first.state_hash });
      assertExactResult(replay, { operation: 'run', outcome: 'BLOCKED', state: 'BLOCKED' });
      assert.deepEqual({ pushes: context.gatewayEvents.filter(event => event.edge === 'START' && event.gateway === 'git' && event.method === 'pushBranch').length, reads: context.gatewayEvents.filter(event => event.edge === 'COMPLETE' && event.gateway === 'git' && event.method === 'readRemoteBranch' && event.sequence > pushes[0].sequence).length }, counts, 'blocked branch replay cannot repeat an ambiguous Git effect');
    }, {
      invokeGitOperation: async ({ method, operation, request }) => {
        if (method !== 'pushBranch' || candidateSha === null) return operation(request);
        pushAttempts += 1; assert.equal(request.candidate_sha, candidateSha); return ambiguous(null);
      },
      transformGitResult: async ({ method, actualResult }) => {
        if (method !== 'readRemoteBranch' || candidateSha === null || pushAttempts <= remoteReads) return actualResult;
        remoteReads += 1; assert.equal(actualResult.kind, 'ABSENT'); return actualResult;
      },
    });
  });
  await t.test('Ledger append ambiguity has two exact remote readbacks, a local pause, and no replay', async () => {
    const ledgerRoute = { target: null }; let targetEvent = null; let targetCommit = null; let targetPrepared = null; let targetMaterial = null; let targetUnpublished = null; let appendAttempts = 0;
    await withObservedK1Prefix(async context => {
      ledgerRoute.target = Object.freeze({
        ...context.primaryLedger,
        async prepareAppend(request) {
          const result = await context.primaryLedger.prepareAppend(request);
          if (result.kind === 'OK') {
            const event = JSON.parse(Buffer.from(request.event_bytes).subarray(0, -1).toString('utf8'));
            if (event.event_class === 'VALIDATION_RESULT' && event.detail?.validation_scope === 'AFFECTED_SUITE') { targetEvent = event.event_id; targetPrepared = structuredClone(result.value); targetMaterial = { prior_bytes: Buffer.from(request.prior_bytes), event_bytes: Buffer.from(request.event_bytes) }; }
          }
          return result;
        },
        async commitAndPush(request) {
          if (request.prepared_receipt?.event_id !== targetEvent) return context.primaryLedger.commitAndPush(request);
          appendAttempts += 1; targetCommit ??= structuredClone(request); assert.deepEqual(request, targetCommit, 'both attempts retain the exact prepared receipt and idempotency identity');
          targetUnpublished ??= await createUnpublishedTestLedgerCommit({ root: context.fixtureRoot, change_id: context.command.change_id, expected_tip: targetPrepared.expected_tip, prior_bytes: targetMaterial.prior_bytes, event_bytes: targetMaterial.event_bytes, event_id: targetPrepared.event_id });
          if (appendAttempts === 2) await appendTestLedgerEvent(context.primaryLedger, { change_id: context.command.change_id, event_class: 'BLOCKED', state_version: context.afterWorker.state_version, subject_sha: context.command.worktree.baseline_sha, idempotency_id: 'dtf-ledger-concurrent-authority-change', detail: { blocked_reason: 'EVIDENCE_CONFLICT', next_action: 'MANUAL_CONTROLLER_STOP', evidence_refs: [] } });
          const partial = { stage: 'EVIDENCE_COMMIT_CREATED', expected_tip: targetPrepared.expected_tip, commit_sha: targetUnpublished.commit_sha, event_id: targetPrepared.event_id, event_hash: targetPrepared.event_hash, idempotency_id: targetPrepared.idempotency_id };
          return ambiguous({ ...partial, receipt_sha256: sha256(canonicalJson(partial)) });
        },
        async readRemoteAppend(request) {
          if (request.event_id !== targetEvent) return context.primaryLedger.readRemoteAppend(request);
          const physical = await readLocalLedger(context.primaryLedger, context.command.change_id);
          assert.equal(request.expected_commit, targetUnpublished.commit_sha, 'readback targets the real unpublished evidence commit, never the old predecessor');
          if (physical.value.tip === targetPrepared.expected_tip) return absent(structuredClone(request));
          return { kind: 'CONFLICT', reason: 'CAS_CONFLICT', observed_identity: { expected_commit: request.expected_commit, actual_tip: physical.value.tip } };
        },
      });
      const first = await context.core.run({ change_id: context.command.change_id, expected_state_version: context.afterWorker.state_version, expected_state_hash: context.afterWorker.state_hash });
      assertExactResult(first, { operation: 'run', outcome: 'BLOCKED', state: 'EXECUTING' }); assert.equal(first.payload.next_action, 'MANUAL_CONTROLLER_STOP');
      assert.equal(first.state_version, context.afterWorker.state_version); assert.equal(first.state_hash, context.afterWorker.state_hash, 'the Ledger authority conflict preserves the original public run identity');
      const preserved = await context.base.state.readState({ change_id: context.command.change_id }); assert.equal(preserved.kind, 'OK'); const preservedState = JSON.parse(preserved.value.bytes); assert.equal(preservedState.macro_state, 'EXECUTING'); assert.equal(preservedState.phase, 'REGRESSION'); assert.equal(preservedState.state_version, context.afterWorker.state_version); assert.equal(preserved.value.sha256, context.afterWorker.state_hash);
      const commits = context.gatewayEvents.filter(event => event.edge === 'START' && event.gateway === 'ledger' && event.method === 'commitAndPush' && event.request?.prepared_receipt?.event_id === targetEvent);
      const reads = context.gatewayEvents.filter(event => event.edge === 'START' && event.gateway === 'ledger' && event.method === 'readRemoteAppend' && event.request?.event_id === targetEvent);
      assert.equal(commits.length, 2); assert.equal(reads.length, 2); assert.deepEqual(commits[1].request, commits[0].request, 'the one Ledger continuation retains the exact prepared receipt and idempotency identity'); assert.deepEqual(reads[1].request, reads[0].request, 'the exhausted readback cannot substitute a record identity');
      const exhaustedReadback = context.gatewayEvents.find(event => event.edge === 'COMPLETE' && event.gateway === 'ledger' && event.method === 'readRemoteAppend' && event.invocation === reads[1].invocation);
      assert.equal(exhaustedReadback?.result?.kind, 'CONFLICT', 'the second exact remote readback is the concurrent-authority conflict');
      const localPauseWrite = context.gatewayEvents.find(event => event.edge === 'START' && event.gateway === 'state' && event.method === 'writeLocalPause' && event.sequence > exhaustedReadback.sequence && (() => { try { const diagnostic = JSON.parse(event.request.next_bytes); return event.request.expected_sha256 === null && diagnostic.change_id === context.command.change_id && diagnostic.operation === 'run' && diagnostic.reason === 'EVIDENCE_REF_CONFLICT' && diagnostic.next_action === 'MANUAL_CONTROLLER_STOP' && diagnostic.request_sha256 === sha256(canonicalJson({ change_id: context.command.change_id, expected_state_version: context.afterWorker.state_version, expected_state_hash: context.afterWorker.state_hash })) && diagnostic.state_version === context.afterWorker.state_version && diagnostic.state_hash === context.afterWorker.state_hash; } catch { return false; } })());
      assert.ok(localPauseWrite, 'the exhausted Ledger conflict writes only its exact local diagnostic');
      const localPauseWriteComplete = context.gatewayEvents.find(event => event.edge === 'COMPLETE' && event.gateway === 'state' && event.method === 'writeLocalPause' && event.invocation === localPauseWrite.invocation);
      assert.equal(localPauseWriteComplete?.result?.kind, 'OK');
      const localPause = context.gatewayEvents.find(event => event.edge === 'COMPLETE' && event.gateway === 'state' && event.method === 'readLocalPause' && event.sequence > localPauseWriteComplete.sequence);
      assert.equal(localPause?.result?.value?.bytes, localPauseWrite.request.next_bytes); assert.equal(localPause?.result?.value?.sha256, sha256(localPauseWrite.request.next_bytes));
      const counts = { commits: commits.length, reads: reads.length };
      const replay = await context.core.run({ change_id: context.command.change_id, expected_state_version: first.state_version, expected_state_hash: first.state_hash });
      assertExactResult(replay, { operation: 'run', outcome: 'BLOCKED', state: 'EXECUTING' });
      assert.deepEqual({ commits: context.gatewayEvents.filter(event => event.edge === 'START' && event.gateway === 'ledger' && event.method === 'commitAndPush' && event.request?.prepared_receipt?.event_id === targetEvent).length, reads: context.gatewayEvents.filter(event => event.edge === 'START' && event.gateway === 'ledger' && event.method === 'readRemoteAppend' && event.request?.event_id === targetEvent).length }, counts, 'blocked Ledger replay cannot repeat an ambiguous append');
    }, { stopAfterWorker: true, ledgerRoute });
  });
  await t.test('final PR/Handoff ambiguity has one exact continuation then MANUAL_CONTROLLER_STOP', async () => {
    const handoffCalls = []; const pullRequestCalls = [];
    const pull_request = {
      async queryCurrent(request) { pullRequestCalls.push({ method: 'queryCurrent', request: structuredClone(request) }); return absent('current-pr'); },
      async createOrReuse(request) { pullRequestCalls.push({ method: 'createOrReuse', request: structuredClone(request) }); return ok({ number: 111, url: 'https://invalid.example/pr/111', base: request.base, head_branch: request.head_branch, head_sha: request.head_sha, review_ready: true }); },
      async readback(request) { pullRequestCalls.push({ method: 'readback', request: structuredClone(request) }); return ok({ number: request.number, url: 'https://invalid.example/pr/111', base: 'main', head_branch: 'work/mac-mini/m2-regression', head_sha: request.expected_head, review_ready: true }); },
    };
    const handoff = { async writeReadback(request) { handoffCalls.push(structuredClone(request)); return handoffCalls.length === 1 ? absent({ expected_sha256: request.expected_sha256 }) : ambiguous(null); } };
    await withObservedK1Prefix(async context => {
      const { validatorPass } = await settleOrdinaryValidatorForBoundary(context, 'dtf-handoff-ambiguity');
      const pushed = await context.core.run({ change_id: context.command.change_id, expected_state_version: validatorPass.state_version, expected_state_hash: validatorPass.state_hash }); assertExactResult(pushed, { operation: 'run', outcome: 'ADVANCED', state: 'DELIVERING' });
      assert.equal(pushed.payload.to_phase, 'CANDIDATE_FREEZE');
      const frozen = await context.core.run({ change_id: context.command.change_id, expected_state_version: pushed.state_version, expected_state_hash: pushed.state_hash }); assertExactResult(frozen, { operation: 'run', outcome: 'ADVANCED', state: 'DELIVERING' });
      assert.equal(frozen.payload.to_phase, 'PR');
      const pr = await context.core.run({ change_id: context.command.change_id, expected_state_version: frozen.state_version, expected_state_hash: frozen.state_hash }); assertExactResult(pr, { operation: 'run', outcome: 'ADVANCED', state: 'DELIVERING' });
      assert.equal(pr.payload.to_phase, 'HANDOFF');
      const first = await context.core.run({ change_id: context.command.change_id, expected_state_version: pr.state_version, expected_state_hash: pr.state_hash });
      assertExactResult(first, { operation: 'run', outcome: 'BLOCKED', state: 'BLOCKED' }); assert.equal(first.payload.blocked_reason, 'FINAL_HANDOFF_PR_AMBIGUOUS'); assert.equal(first.payload.next_action, 'MANUAL_CONTROLLER_STOP'); assert.equal(handoffCalls.length, 2); assert.deepEqual(handoffCalls[1], handoffCalls[0], 'the final-boundary continuation preserves exact bytes, hash, and delivery identity');
      const replay = await context.core.run({ change_id: context.command.change_id, expected_state_version: first.state_version, expected_state_hash: first.state_hash }); assertExactResult(replay, { operation: 'run', outcome: 'BLOCKED', state: 'BLOCKED' }); assert.equal(handoffCalls.length, 2, 'blocked replay cannot repeat Handoff'); assert.equal(pullRequestCalls.filter(call => call.method === 'createOrReuse').length, 1, 'final-boundary exhaustion cannot recreate the already-read PR');
    }, { pull_request, handoff });
  });
  await t.test('a fresh Coordinator reconstructs durable MANUAL_CONTROLLER_STOP and never repeats the ambiguous Candidate effect', async () => {
    let attempts = 0;
    await withObservedK1Prefix(async context => {
      const first = await context.core.run({ change_id: context.command.change_id, expected_state_version: context.regression.state_version, expected_state_hash: context.regression.state_hash });
      assertExactResult(first, { operation: 'run', outcome: 'BLOCKED', state: 'BLOCKED' }); assert.equal(first.payload.blocked_reason, 'CANDIDATE_COMMIT_AMBIGUOUS');
      assert.equal(attempts, 1); assert.equal(first.payload.next_action, 'MANUAL_CONTROLLER_STOP');
      const persisted = await context.base.state.readState({ change_id: context.command.change_id }); assert.equal(persisted.kind, 'OK'); const persistedState = JSON.parse(persisted.value.bytes); assert.equal(persistedState.macro_state, 'BLOCKED'); assert.equal(persistedState.blocked_reason, 'CANDIDATE_COMMIT_AMBIGUOUS');
      const blockedReadback = context.observedLedgerReadbacks.find(entry => entry.event.event_class === 'BLOCKED' && entry.event.detail?.blocked_reason === 'CANDIDATE_COMMIT_AMBIGUOUS'); assert.ok(blockedReadback); assert.equal(blockedReadback.result.kind, 'OK');
      const beforeFresh = context.gatewayEvents.length; const commits = context.gatewayEvents.filter(event => event.edge === 'START' && event.gateway === 'git' && event.method === 'commitCandidate').length;
      const fresh = context.restartCore();
      const replay = await fresh.run({ change_id: context.command.change_id, expected_state_version: first.state_version, expected_state_hash: first.state_hash });
      assertExactResult(replay, { operation: 'run', outcome: 'BLOCKED', state: 'BLOCKED' });
      assert.equal(context.gatewayEvents.slice(beforeFresh).some(event => event.edge === 'START' && event.gateway === 'git' && event.method === 'commitCandidate'), false, 'a fresh Core cannot repeat a durably blocked Candidate effect'); assert.equal(context.gatewayEvents.filter(event => event.edge === 'START' && event.gateway === 'git' && event.method === 'commitCandidate').length, commits);
    }, { stopAtStage: true, invokeGitOperation: async ({ method, operation, request }) => method === 'commitCandidate' ? (attempts += 1, ambiguous(null)) : operation(request) });
  });
});

test('TEST-DTF-R1-001: authentication bypass attempts through signed body and dependency injection reject before every protected effect', async t => {
  const mutations = [
    ['key binding', { key_id: 'untrusted-key' }, 'COMMAND_SIGNATURE_INVALID', true],
    ['repository binding', { repository: { canonical_root: '/tmp/other', origin: 'origin', integration_branch: 'main' } }, 'COMMAND_SIGNATURE_INVALID', true],
    ['change binding', { change_id: CHANGE_B, command_id: 'command-b', idempotency_id: 'idem-b' }, 'COMMAND_SIGNATURE_INVALID', true],
    ['worktree binding', { worktree: { branch: 'work/mac-mini/other', root: '/tmp/other', baseline_sha: GIT_SHA } }, 'COMMAND_SIGNATURE_INVALID', true],
    ['nonce binding', { nonce: 'B'.repeat(43) + '=' }, 'COMMAND_SIGNATURE_INVALID', true],
    ['time binding', { issued_at: '2026-08-25T00:02:00.000Z' }, 'COMMAND_EXPIRED', true],
    ['idempotency binding', { idempotency_id: 'idem-other' }, 'COMMAND_REPLAY_CONFLICT', true],
    ['receipt binding', { receipt_digest: 'b'.repeat(64) }, 'COMMAND_SIGNATURE_INVALID', true],
    ['extra command field', { public_key: 'injected' }, 'INPUT_INVALID', false],
    ['payload trust injection', { payload: { public_key: 'injected' } }, 'INPUT_INVALID', false],
    ['scope widening', { scope: { allowed_paths: ['**'], forbidden_paths: [] } }, 'INPUT_INVALID', false],
    ['expected state binding', { expected_state_version: 1, expected_state_hash: SHA256 }, 'INPUT_INVALID', false],
  ];
  for (const [name, override, error_code, verifierRejects] of mutations) {
    await t.test(name, async () => {
      const harness = await createCoordinatorUnderTest();
      if (verifierRejects) harness.fault('verifier.verify', { kind: 'REJECTED', error_code });
      const result = await harness.coordinator.applyControllerCommand(signed(override));
      assertExactResult(result, { operation: 'applyControllerCommand', outcome: 'REJECTED', code: error_code });
      assert.equal(harness.count('verifier.verify'), 1);
      for (const effect of ['state.writePointer', 'state.writeState', 'ledger.readRemote', 'git.createOrReuseWorktree', 'pull_request.createOrReuse', 'handoff.writeReadback']) noCall(harness, effect);
    });
  }
});

test('TEST-FCR-SAFETY-001: an empty signed DISPATCH Change identity rejects before false WIP or protected effects', async () => {
  const harness = await createCoordinatorUnderTest();
  const result = await harness.coordinator.applyControllerCommand(signed({ change_id: '' }));
  assert.deepEqual({
    outcome: result.outcome,
    error_code: result.error_code,
    active_change_id: harness.stateStore.pointer.active_change_id,
    durable_state: harness.stateStore.state,
    pointer_writes: harness.count('state.writePointer'),
    state_writes: harness.count('state.writeState'),
    ledger_reads: harness.count('ledger.readRemote'),
    worktree_creates: harness.count('git.createOrReuseWorktree'),
  }, {
    outcome: 'REJECTED',
    error_code: 'INPUT_INVALID',
    active_change_id: null,
    durable_state: null,
    pointer_writes: 0,
    state_writes: 0,
    ledger_reads: 0,
    worktree_creates: 0,
  }, 'CAUSAL_RED: an empty Change identity cannot occupy WIP, persist READY, append admission, or create a Worktree');
});

test('TEST-DTF-R1-002: every pointer-first crash window prevents WIP misclassification or Change B admission', async t => {
  const windows = [
    ['missing pointer', null, async context => rm(context.pointerPath, { force: true })],
    ['corrupt pointer', null, async context => writeFile(context.pointerPath, '{not-canonical}')],
    ['READY missing', CHANGE_ID, async context => writeFile(context.pointerPath, canonicalJson({ schema_version: '1.0', active_change_id: CHANGE_ID }))],
    ['READY exists but event missing', CHANGE_ID, async context => {
      const dispatch = await context.core.applyControllerCommand(signed()); assertExactResult(dispatch, { operation: 'applyControllerCommand', outcome: 'APPLIED', state: 'READY' });
      const missingRoot = path.join(context.stateRoot, 'r216-window-missing'); await mkdir(missingRoot, { recursive: true }); const missing = await createLocalBareLedger(missingRoot, CHANGE_ID);
      context.core = createCoordinatorCore({ ...context.dependencies, ledger: context.observeLedger(missing) });
    }],
    ['admission event readback ambiguous', CHANGE_ID, async context => {
      const dispatch = await context.core.applyControllerCommand(signed()); assertExactResult(dispatch, { operation: 'applyControllerCommand', outcome: 'APPLIED', state: 'READY' });
      const ambiguousRoot = path.join(context.stateRoot, 'r216-window-ambiguous'); await mkdir(ambiguousRoot, { recursive: true }); const divergent = await createLocalBareLedger(ambiguousRoot, CHANGE_ID);
      const ambiguousRead = Object.freeze({ ...divergent, async readRemote(request) { await divergent.readRemote(request); return ambiguous(null); } });
      context.core = createCoordinatorCore({ ...context.dependencies, ledger: context.observeLedger(ambiguousRead) });
    }],
    ['pointer-state-ledger conflict', CHANGE_ID, async context => {
      const dispatch = await context.core.applyControllerCommand(signed()); assertExactResult(dispatch, { operation: 'applyControllerCommand', outcome: 'APPLIED', state: 'READY' });
      const persisted = await context.state.readState({ change_id: CHANGE_ID }); assert.equal(persisted.kind, 'OK');
      const conflictingRead = Object.freeze({ ...context.ledger, async readRemote(request) { await context.ledger.readRemote(request); return conflict('pointer-state-ledger-identity-conflict'); } });
      context.core = createCoordinatorCore({ ...context.dependencies, ledger: context.observeLedger(conflictingRead) });
    }],
  ];
  for (const [name, expectedStatusChange = CHANGE_ID, arrange] of windows) {
    await t.test(name, async window => {
      const setup = async action => withR216RealCore(async context => {
        await arrange(context); const persisted = await context.state.readState({ change_id: CHANGE_ID }); let physicalPointer = null; try { physicalPointer = await readFile(context.pointerPath); } catch (error) { assert.equal(error?.code, 'ENOENT'); }
        const pointer = await context.state.readPointer({});
        const identity = persisted.kind === 'OK' ? { expected_state_version: JSON.parse(persisted.value.bytes).state_version, expected_state_hash: sha256(persisted.value.bytes) } : { expected_state_version: 0, expected_state_hash: SHA256 };
        const ledgerName = name === 'READY exists but event missing' ? 'r216-window-missing' : name === 'admission event readback ambiguous' ? 'r216-window-ambiguous' : 'ledger'; const ledgerGitDir = path.join(context.stateRoot, ledgerName, 'ledger-origin.git'); const ledgerRef = await run(GIT, ['--git-dir', ledgerGitDir, 'rev-parse', '--verify', 'refs/heads/evidence/agent-runs'], { cwd: context.stateRoot, env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' } }); const ledgerTip = ledgerRef.code === 0 ? ledgerRef.stdout.trim() : null; const ledgerTree = ledgerTip === null ? null : await run(GIT, ['--git-dir', ledgerGitDir, 'rev-parse', `${ledgerTip}^{tree}`], { cwd: context.stateRoot, env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' } }); const ledgerParent = ledgerTip === null ? null : await run(GIT, ['--git-dir', ledgerGitDir, 'rev-parse', `${ledgerTip}^`], { cwd: context.stateRoot, env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' } }); const ledgerBytes = ledgerTip === null ? null : await run(GIT, ['--git-dir', ledgerGitDir, 'show', `${ledgerTip}:ledger/${CHANGE_ID}.jsonl`], { cwd: context.stateRoot, env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' } }); await action(context, identity, { pointer, state: persisted, pointer_bytes: physicalPointer, ledger_git_dir: ledgerGitDir, ledger_ref: ledgerRef, ledger_tip: ledgerTip, ledger_tree: ledgerTree, ledger_parent: ledgerParent, ledger_bytes: ledgerBytes });
      }, { retainFormal: true });
      const strictFrontier = Object.freeze({
        'missing pointer': { STATUS: { earlier_refusal: 'pointer missing before State/Ledger' }, RUN: { earlier_refusal: 'pointer missing before State/Ledger' }, CHANGE_B: { earlier_refusal: 'pointer missing before Ledger' } },
        'corrupt pointer': { STATUS: { earlier_refusal: 'pointer decode refuses before State/Ledger' }, RUN: { earlier_refusal: 'pointer decode refuses before State/Ledger' }, CHANGE_B: { earlier_refusal: 'pointer decode refuses before Ledger' } },
        'READY missing': { STATUS: { earlier_refusal: 'missing READY State before Ledger' }, RUN: { earlier_refusal: 'missing READY State before Ledger' }, CHANGE_B: { earlier_refusal: 'active Change A slot rejects Change B before Ledger' } },
        'READY exists but event missing': { STATUS: { kind: 'OK' }, RUN: { kind: 'OK' }, CHANGE_B: { earlier_refusal: 'active Change A slot rejects Change B before Ledger' } },
        'admission event readback ambiguous': { STATUS: { kind: 'AMBIGUOUS', result: ambiguous(null) }, RUN: { kind: 'AMBIGUOUS', result: ambiguous(null) }, CHANGE_B: { earlier_refusal: 'active Change A slot rejects Change B before Ledger' } },
        'pointer-state-ledger conflict': { STATUS: { kind: 'CONFLICT', result: conflict('pointer-state-ledger-identity-conflict') }, RUN: { kind: 'CONFLICT', result: conflict('pointer-state-ledger-identity-conflict') }, CHANGE_B: { earlier_refusal: 'active Change A slot rejects Change B before Ledger' } },
      })[name];
      const assertStrictReads = (calls, operation, physical) => {
        const frontier = strictFrontier[operation]; assert.ok(frontier, `named strict frontier exists for ${name}/${operation}`);
        assert.equal(calls.some(call => call.boundary === 'ledger' && call.method === 'readRemoteAppend'), false, `${name}/${operation} never uses the legacy append readback request`);
        const strict = calls.filter(call => call.boundary === 'ledger' && call.method === 'readRemote');
        if (frontier.earlier_refusal) { assert.equal(strict.length, 0, `${name}/${operation} stops at its explicit earlier refusal: ${frontier.earlier_refusal}`); if (name === 'missing pointer') { assert.equal(physical.pointer_bytes, null); assert.equal(physical.pointer.kind, 'ABSENT'); assert.equal(physical.state.kind, 'ABSENT'); } else if (name === 'corrupt pointer') { assert.deepEqual(physical.pointer_bytes, Buffer.from('{not-canonical}')); assert.equal(physical.pointer.kind, 'OK'); assert.equal(physical.state.kind, 'ABSENT'); } else { assert.deepEqual(physical.pointer_bytes, Buffer.from(canonicalJson({ schema_version: '1.0', active_change_id: CHANGE_ID }))); assert.equal(physical.pointer.kind, 'OK'); assert.equal(physical.state.kind, name === 'READY missing' ? 'ABSENT' : 'OK'); } return; }
        assert.equal(strict.length, 1, `${name}/${operation} reaches exactly one strict Ledger boundary`);
        const call = strict[0]; assert.deepEqual(Object.keys(call.request).sort(), ['change_id', 'expected_tip', 'remote_ref']); assert.deepEqual(call.request, { change_id: CHANGE_ID, expected_tip: null, remote_ref: 'refs/heads/evidence/agent-runs' }); assert.equal(call.result.kind, frontier.kind);
        if (call.result.kind !== 'OK') { assert.deepEqual(call.result, frontier.result); if (name === 'admission event readback ambiguous') { assert.equal(path.basename(path.dirname(physical.ledger_git_dir)), 'r216-window-ambiguous'); assert.notEqual(physical.ledger_ref.code, 0); assert.equal(physical.ledger_ref.signal, null); assert.equal(physical.ledger_ref.stdout, ''); } else if (name === 'pointer-state-ledger conflict') { assert.equal(path.basename(path.dirname(physical.ledger_git_dir)), 'ledger'); assert.equal(physical.ledger_ref.code, 0); assert.equal(physical.ledger_tip, physical.ledger_ref.stdout.trim()); } return; }
        assert.deepEqual(Object.keys(call.result).sort(), ['kind', 'receipt_sha256', 'value']); const value = call.result.value;
        assert.deepEqual(Object.keys(value).sort(), ['authoritative_path', 'expected_tip', 'file_present', 'last_event_hash', 'last_event_id', 'last_sequence', 'ledger_bytes_base64', 'prior_byte_length', 'prior_bytes_sha256', 'remote_ref', 'tip', 'tip_parent', 'tip_tree']); assert.equal(call.result.receipt_sha256, sha256(canonicalJson(value))); assert.equal(value.remote_ref, call.request.remote_ref); assert.equal(value.expected_tip, call.request.expected_tip); assert.equal(value.authoritative_path, `ledger/${CHANGE_ID}.jsonl`);
        const raw = Buffer.from(value.ledger_bytes_base64, 'base64'); assert.equal(raw.toString('base64'), value.ledger_bytes_base64); assert.equal(raw.length, value.prior_byte_length); assert.equal(sha256(raw), value.prior_bytes_sha256);
        if (!value.file_present) { assert.deepEqual({ tip: value.tip, tip_parent: value.tip_parent, tip_tree: value.tip_tree, bytes: raw.length, last_event_id: value.last_event_id, last_event_hash: value.last_event_hash, last_sequence: value.last_sequence }, { tip: null, tip_parent: null, tip_tree: null, bytes: 0, last_event_id: null, last_event_hash: null, last_sequence: 0 }); assert.notEqual(physical.ledger_ref.code, 0); assert.equal(physical.ledger_ref.signal, null); assert.equal(physical.ledger_ref.stdout, ''); assert.equal(physical.ledger_tip, null); assert.equal(physical.ledger_tree, null); assert.equal(physical.ledger_parent, null); assert.equal(physical.ledger_bytes, null); return; }
        assert.equal(/^[0-9a-f]{40}$/.test(value.tip), true); assert.equal(value.tip_parent === null || /^[0-9a-f]{40}$/.test(value.tip_parent), true); assert.equal(/^[0-9a-f]{40}$/.test(value.tip_tree), true); assert.equal(physical.ledger_ref.code, 0); assert.equal(physical.ledger_ref.signal, null); assert.equal(physical.ledger_tip, value.tip); assert.equal(physical.ledger_tree.code, 0, physical.ledger_tree.stderr); assert.equal(physical.ledger_tree.signal, null); assert.equal(physical.ledger_tree.stdout.trim(), value.tip_tree); assert.equal(physical.ledger_parent.signal, null); if (value.tip_parent === null) { assert.notEqual(physical.ledger_parent.code, 0); assert.equal(physical.ledger_parent.stdout, ''); } else { assert.equal(physical.ledger_parent.code, 0, physical.ledger_parent.stderr); assert.equal(physical.ledger_parent.stdout.trim(), value.tip_parent); } assert.equal(physical.ledger_bytes.code, 0, physical.ledger_bytes.stderr); assert.equal(physical.ledger_bytes.signal, null); assert.deepEqual(Buffer.from(physical.ledger_bytes.stdout), raw); assert.equal(raw.at(-1), 0x0a); const last = JSON.parse(raw.toString('utf8').trim().split('\n').at(-1)); const { event_hash, ...lastEventData } = last; assert.equal(event_hash, sha256(canonicalJson(lastEventData))); assert.deepEqual({ event_id: value.last_event_id, event_hash: value.last_event_hash, sequence: value.last_sequence }, { event_id: last.event_id, event_hash: last.event_hash, sequence: last.sequence });
      };
      const assertWindowEvidence = (context, operationName, { stopOnly = false } = {}) => {
        const evidence = context.formalOperation(operationName); const pre = evidence.pre; const result = evidence.result; const post = evidence.post;
        assert.equal(pre.input.inventory_error, null); assert.equal(post.input.post_inventory_error, null); assert.equal(result.outcome.kind, 'RETURNED'); assert.equal(post.outcome.kind, 'COLLECTED');
        const index = values => new Map(values.map(value => [value.relative, canonicalJson(value)])); const before = index(pre.input.inventory); const after = index(post.input.post_inventory); const changed = [...new Set([...before.keys(), ...after.keys()])].filter(relative => before.get(relative) !== after.get(relative)).sort();
        const operationCalls = context.calls.slice(pre.input.call_count, result.input.call_count); const harnessCalls = result.input.harness_calls.slice(pre.input.harness_calls.length);
        assert.equal(operationCalls.some(call => ['writePointer', 'prepareAppend', 'commitAndPush'].includes(call.method)), false, `${operationName} cannot advance pointer or Ledger`);
        assert.equal(harnessCalls.some(call => /^git\./.test(call.name) || call.name === 'validation.execute' || /^pull_request\./.test(call.name) || call.name === 'handoff.writeReadback'), false, `${operationName} has no Worktree/Agent/validation/Candidate/PR/Handoff effect`);
        if (stopOnly) assert.equal(changed.every(relative => relative === `changes/${CHANGE_ID}/state.json` || relative === 'local-pause.json'), true, `${operationName} permits only durable stop State/LocalPause`);
        else { assert.deepEqual(changed, [], `${operationName} leaves State/pointer/pause/files/refs/objects unchanged`); assert.equal(operationCalls.some(call => ['writeState', 'writeLocalPause'].includes(call.method)), false, `${operationName} has no durable mutation`); }
      };
      const assertWindowStop = (calls, preStop, postStop, runInput, run) => {
        const writes = calls.filter(call => call.boundary === 'state' && ['writeState', 'writeLocalPause'].includes(call.method)); const stateWrites = writes.filter(call => call.method === 'writeState'); const pauseWrites = writes.filter(call => call.method === 'writeLocalPause'); assert.ok(stateWrites.length <= 1); assert.ok(pauseWrites.length <= 1);
        if (stateWrites.length === 1) { const write = stateWrites[0].request; assert.equal(preStop.state.kind, 'OK', 'absent State cannot fabricate a stop CAS'); const before = JSON.parse(preStop.state.value.bytes); assert.deepEqual({ change_id: write.change_id, expected_version: write.expected_version, expected_sha256: write.expected_sha256 }, { change_id: CHANGE_ID, expected_version: before.state_version, expected_sha256: preStop.state.value.sha256 }); const next = JSON.parse(write.next_bytes); assert.equal(canonicalJson(next), write.next_bytes); assert.deepEqual({ change_id: next.change_id, macro_state: next.macro_state, phase: next.phase, state_version: next.state_version }, { change_id: CHANGE_ID, macro_state: 'BLOCKED', phase: null, state_version: before.state_version + 1 }); assert.equal(postStop.state.kind, 'OK'); assert.equal(postStop.state.value.bytes, write.next_bytes); assert.equal(postStop.state.value.sha256, sha256(write.next_bytes)); assert.deepEqual({ state_version: run.state_version, state_hash: run.state_hash }, { state_version: next.state_version, state_hash: sha256(write.next_bytes) }); } else assert.deepEqual(postStop.state, preStop.state, 'no State write preserves exact pre-State');
        if (pauseWrites.length === 1) { const write = pauseWrites[0].request; assert.equal(write.expected_sha256, preStop.pause.kind === 'OK' ? preStop.pause.value.sha256 : null); const pause = JSON.parse(write.next_bytes); assert.equal(canonicalJson(pause), write.next_bytes); assert.deepEqual(Object.keys(pause).sort(), R216_PAUSE_KEYS); assert.deepEqual({ change_id: pause.change_id, operation: pause.operation, request_sha256: pause.request_sha256, state_version: pause.state_version, state_hash: pause.state_hash }, { change_id: CHANGE_ID, operation: 'run', request_sha256: sha256(canonicalJson(runInput)), state_version: preStop.state.kind === 'OK' ? JSON.parse(preStop.state.value.bytes).state_version : null, state_hash: preStop.state.kind === 'OK' ? preStop.state.value.sha256 : null }); assert.equal(typeof pause.diagnostic_id, 'string'); assert.notEqual(pause.diagnostic_id, ''); assert.equal(postStop.pause.kind, 'OK'); assert.equal(postStop.pause.value.bytes, write.next_bytes); assert.equal(postStop.pause.value.sha256, sha256(write.next_bytes)); } else assert.deepEqual(postStop.pause, preStop.pause, 'no LocalPause write preserves exact pre-pause');
        if (stateWrites.length === 1) { const before = JSON.parse(preStop.state.value.bytes); const next = JSON.parse(stateWrites[0].request.next_bytes); assert.deepEqual(next, { ...before, macro_state: 'BLOCKED', phase: null, pending_agent: null, blocked_reason: run.payload.blocked_reason, resume_target: null, state_version: before.state_version + 1 }, 'the durable stop changes only its exact contract State fields from PRE'); }
        if (pauseWrites.length === 1) { const pause = JSON.parse(pauseWrites[0].request.next_bytes); const state = preStop.state.kind === 'OK' ? JSON.parse(preStop.state.value.bytes) : null; assert.deepEqual(pause, { schema_version: '1.0', diagnostic_id: 'local-pause-001', change_id: state?.change_id ?? null, command_id: state?.authorization_cycle?.command_id ?? null, operation: 'run', reason: run.payload.blocked_reason, next_action: run.payload.next_action, request_idempotency_id: 'local-pause-request-001', request_sha256: sha256(canonicalJson(runInput)), state_version: state?.state_version ?? null, state_hash: state === null ? null : sha256(canonicalJson(state)), expected_evidence_tip: null, event_id: null, expected_event_hash: null, created_at: '2026-08-25T00:00:00.000Z', supersedes_diagnostic_id: null }, 'the durable pause is the complete existing diagnostic bound to this exact run request'); }
      };
      await window.test('STATUS rejects WIP authority without State or mutex effects', async () => setup(async (context, identity, physical) => {
        const before = context.calls.length; const mutexBefore = context.mutexAttempts(); const status = await context.capturePublicOperation(`window-${name}-status`, { change_id: CHANGE_ID }, () => context.core.status({ change_id: CHANGE_ID })); const calls = context.calls.slice(before);
        assert.deepEqual(status, { schema_version: '1.0', operation: 'status', outcome: 'REJECTED', error_code: 'WIP_AUTHORITY_INVALID', change_id: expectedStatusChange }); assertStrictReads(calls, 'STATUS', physical); assert.equal(context.mutexAttempts(), mutexBefore, 'STATUS does not acquire the mutation mutex'); assert.equal(calls.some(call => call.boundary === 'state' && ['writePointer', 'writeState', 'writeLocalPause'].includes(call.method)), false); assert.equal(context.harness.count('git.createOrReuseWorktree'), 0); assertWindowEvidence(context, `window-${name}-status`);
      }));
      await window.test('same Change RUN stops with the actual pre-fault State CAS', async () => setup(async (context, identity, physical) => {
        const before = context.calls.length; const preStop = { state: await context.state.readState({ change_id: CHANGE_ID }), pause: await context.state.readLocalPause({}) }; const runInput = { change_id: CHANGE_ID, ...identity }; const run = await context.capturePublicOperation(`window-${name}-run`, runInput, () => context.core.run(runInput)); const calls = context.calls.slice(before);
        assertExactResult(run, { operation: 'run', outcome: 'BLOCKED', state: 'BLOCKED' }); assert.equal(run.payload.next_action, 'MANUAL_CONTROLLER_STOP'); assertStrictReads(calls, 'RUN', physical); assert.equal(calls.some(call => ['prepareAppend', 'commitAndPush'].includes(call.method)), false); assert.equal(context.harness.count('git.createOrReuseWorktree'), 0); assertWindowEvidence(context, `window-${name}-run`, { stopOnly: true }); const postStop = { state: await context.state.readState({ change_id: CHANGE_ID }), pause: await context.state.readLocalPause({}) }; const writes = calls.filter(call => call.boundary === 'state' && ['writeState', 'writeLocalPause'].includes(call.method)); assert.equal(writes.some(call => call.method === 'writeState' && (preStop.state.kind !== 'OK' || call.request.expected_version !== JSON.parse(preStop.state.value.bytes).state_version || call.request.expected_sha256 !== preStop.state.value.sha256)), false, 'RUN State write binds the actual pre-CAS'); assert.equal(writes.some(call => call.method === 'writeLocalPause' && call.request.expected_sha256 !== (preStop.pause.kind === 'OK' ? preStop.pause.value.sha256 : null)), false, 'RUN LocalPause write binds the actual pre-pause identity'); if (writes.some(call => call.method === 'writeState')) { const write = writes.find(call => call.method === 'writeState').request; assert.equal(postStop.state.kind, 'OK'); assert.equal(postStop.state.value.bytes, write.next_bytes); assert.equal(postStop.state.value.sha256, sha256(write.next_bytes)); } else assert.deepEqual(postStop.state, preStop.state); if (writes.some(call => call.method === 'writeLocalPause')) { const write = writes.find(call => call.method === 'writeLocalPause').request; assert.equal(postStop.pause.kind, 'OK'); assert.equal(postStop.pause.value.bytes, write.next_bytes); assert.equal(postStop.pause.value.sha256, sha256(write.next_bytes)); } else assert.deepEqual(postStop.pause, preStop.pause);
        assertWindowStop(calls, preStop, postStop, runInput, run);
      }));
      await window.test('signed Change B admission is refused without advancement', async () => setup(async (context, identity, physical) => {
        const before = context.calls.length; const changeBInput = signed({ change_id: CHANGE_B, command_id: 'command-b', idempotency_id: 'idem-b' }); const changeB = await context.capturePublicOperation(`window-${name}-change-b`, changeBInput, () => context.core.applyControllerCommand(changeBInput)); const calls = context.calls.slice(before);
        assertExactResult(changeB, { operation: 'applyControllerCommand', outcome: 'REJECTED', code: 'WIP_AUTHORITY_INVALID' }); assertStrictReads(calls, 'CHANGE_B', physical); assert.equal(calls.some(call => ['writePointer', 'writeState', 'writeLocalPause', 'prepareAppend', 'commitAndPush'].includes(call.method)), false); assert.equal(context.harness.count('git.createOrReuseWorktree'), 0); assertWindowEvidence(context, `window-${name}-change-b`);
      }));
    });
  }
  await t.test('only complete same-Change pointer, READY, and event tuple converges idempotently', async () => {
    const harness = await createCoordinatorUnderTest();
    const first = await harness.coordinator.applyControllerCommand(signed());
    assertExactResult(first, { operation: 'applyControllerCommand', outcome: 'APPLIED', state: 'READY' });
    const replay = await harness.coordinator.applyControllerCommand(signed());
    assertExactResult(replay, { operation: 'applyControllerCommand', outcome: 'ALREADY_APPLIED', state: 'READY' });
    assert.equal(harness.count('state.writePointer'), 1);
  });
  await t.test('OK admission readback with wrong event, Change, subject, or expected digest remains effect-free', async () => {
    const receipt = { tip: GIT_SHA, commit_sha: GIT_SHA, tree_sha: GIT_SHA, event_id: 'event-001', event_hash: SHA256, sequence: 1, record_bytes_sha256: SHA256, idempotency_id: 'idem-001', linearized: true };
    const cases = [
      ['event identity', { ...receipt, event_id: 'event-other' }, null],
      ['Change identity', { ...receipt, change_id: CHANGE_B }, null],
      ['subject identity', { ...receipt, subject_sha: GIT_SHA }, null],
      ['expected digest', receipt, 'b'.repeat(64)],
    ];
    const observed = [];
    for (const [name, value, forcedDigest] of cases) {
      const harness = await createCoordinatorUnderTest();
      const admitted = await harness.coordinator.applyControllerCommand(signed());
      const receiptSha = forcedDigest ?? sha256(bytes(value));
      harness.fault('ledger.readRemoteAppend', { kind: 'OK', value, receipt_sha256: receiptSha });
      const result = await harness.coordinator.run({ change_id: CHANGE_ID, expected_state_version: admitted.state_version, expected_state_hash: admitted.state_hash });
      observed.push({ name, outcome: result.outcome, state: result.state, worktree_calls: harness.count('git.createOrReuseWorktree'), agent_action: result.outcome === 'AGENT_ACTION' });
    }
    assert.deepEqual(observed, cases.map(([name]) => ({ name, outcome: 'BLOCKED', state: 'BLOCKED', worktree_calls: 0, agent_action: false })), 'CAUSAL_RED: kind OK is not admission proof unless event/Change/subject/digest identity matches the accepted DISPATCH admission');
  });
  await t.test('first DISPATCH cannot trust a stable wrong admission Ledger readback', async () => {
    let admissionFaultInvocations = 0; let admissionIdentity = null; let admissionActualRecord = null; let stableWrongTuple = null;
    await withObservedK1Prefix(async context => {
      const prepared = context.gatewayEvents.find(event => event.edge === 'START' && event.gateway === 'ledger' && event.method === 'prepareAppend');
      const committed = context.gatewayEvents.find(event => event.edge === 'START' && event.gateway === 'ledger' && event.method === 'commitAndPush');
      const preparedComplete = context.gatewayEvents.find(event => event.edge === 'COMPLETE' && event.invocation === prepared?.invocation);
      const committedComplete = context.gatewayEvents.find(event => event.edge === 'COMPLETE' && event.invocation === committed?.invocation);
      const admissionReadStart = context.gatewayEvents.find(event => event.edge === 'START' && event.gateway === 'ledger' && event.method === 'readRemoteAppend');
      const admissionRead = context.gatewayEvents.find(event => event.edge === 'COMPLETE' && event.invocation === admissionReadStart?.invocation);
      const readyWriteStart = context.gatewayEvents.find(event => event.edge === 'START' && event.gateway === 'state' && event.method === 'writeState' && event.request.state?.macro_state === 'READY');
      const readyWrite = context.gatewayEvents.find(event => event.edge === 'COMPLETE' && event.invocation === readyWriteStart?.invocation);
      assert.ok(prepared && committed && preparedComplete && committedComplete && admissionReadStart && admissionRead && readyWriteStart && readyWrite, 'the public DISPATCH reaches complete byte-bearing prepare, commit, admission readback, and READY persistence boundaries');
      const admissionEvent = JSON.parse(Buffer.from(prepared.request.event_bytes).subarray(0, -1).toString('utf8'));
      assert.equal(admissionEvent.event_class, 'CONTROLLER_COMMAND'); assert.equal(preparedComplete.actual_result.kind, 'OK'); assert.equal(committedComplete.actual_result.kind, 'OK'); assert.deepEqual(committed.request.prepared_receipt, preparedComplete.actual_result.value); assert.equal(committed.request.idempotency_id, admissionEvent.idempotency_id); assert.equal(admissionReadStart.request.expected_commit, committedComplete.actual_result.value.commit_sha); assert.equal(admissionReadStart.request.event_id, admissionEvent.event_id); assert.equal(admissionReadStart.request.event_hash, admissionEvent.event_hash); assert.equal(admissionReadStart.request.idempotency_id, admissionEvent.idempotency_id);
      assert.equal(readyWrite.actual_result.kind, 'OK'); assert.equal(readyWrite.actual_result.value.bytes, canonicalJson(readyWriteStart.request.state)); assert.equal(readyWrite.actual_result.value.sha256, sha256(readyWrite.actual_result.value.bytes)); const readyState = JSON.parse(readyWrite.actual_result.value.bytes); assert.equal(readyState.macro_state, 'READY'); assert.ok(Number.isSafeInteger(readyState.state_version), 'READY retains its exact persisted State version alongside its byte hash');
      assert.equal(admissionRead.actual_result.kind, 'OK');
      assert.equal(admissionRead.result.kind, 'OK');
      assert.notEqual(admissionRead.result.value.event_id, admissionRead.actual_result.value.event_id, 'the fault changes the complete admitted tuple, not a legacy short receipt');
      assert.equal(admissionFaultInvocations, 1, 'the stable wrong tuple is delivered at the named original CONTROLLER_COMMAND admission identity');
      assertExactResult(context.dispatch, { operation: 'applyControllerCommand', outcome: 'BLOCKED', state: 'BLOCKED' });
      const pointer = await context.base.state.readPointer({}); const blocked = await context.base.state.readState({ change_id: context.command.change_id }); assert.equal(pointer.kind, 'OK'); assert.equal(pointer.value.sha256, sha256(pointer.value.bytes)); assert.deepEqual(JSON.parse(pointer.value.bytes), { active_change_id: context.command.change_id, schema_version: '1.0' }); assert.equal(blocked.kind, 'OK'); assert.equal(blocked.value.sha256, sha256(blocked.value.bytes)); assert.equal(JSON.parse(blocked.value.bytes).macro_state, 'BLOCKED');
      assert.equal(context.gatewayEvents.some(event => event.edge === 'START' && event.gateway === 'git' && event.method === 'createOrReuseWorktree'), false, 'a rejected admission tuple starts no Worktree');
      assert.equal(context.gatewayEvents.some(event => event.edge === 'START' && event.gateway === 'ledger' && event.method === 'prepareAppend' && JSON.parse(Buffer.from(event.request.event_bytes).subarray(0, -1).toString('utf8')).event_class === 'AGENT_RUN'), false, 'a rejected admission tuple starts no Agent');
      const beforeLaterRun = { pointer: pointer.value.bytes, state: blocked.value.bytes, worktrees: context.gatewayEvents.filter(event => event.edge === 'START' && event.gateway === 'git' && event.method === 'createOrReuseWorktree').length, agents: context.gatewayEvents.filter(event => event.edge === 'START' && event.gateway === 'ledger' && event.method === 'prepareAppend' && JSON.parse(Buffer.from(event.request.event_bytes).subarray(0, -1).toString('utf8')).event_class === 'AGENT_RUN').length };
      const laterRun = await context.core.run({ change_id: context.command.change_id, expected_state_version: context.dispatch.state_version, expected_state_hash: context.dispatch.state_hash });
      assertExactResult(laterRun, { operation: 'run', outcome: 'BLOCKED', state: 'BLOCKED' }); assert.equal(laterRun.payload.next_action, 'MANUAL_CONTROLLER_STOP');
      const pointerAfter = await context.base.state.readPointer({}); const stateAfter = await context.base.state.readState({ change_id: context.command.change_id }); assert.equal(pointerAfter.value.bytes, beforeLaterRun.pointer); assert.equal(stateAfter.value.bytes, beforeLaterRun.state); assert.deepEqual({ worktrees: context.gatewayEvents.filter(event => event.edge === 'START' && event.gateway === 'git' && event.method === 'createOrReuseWorktree').length, agents: context.gatewayEvents.filter(event => event.edge === 'START' && event.gateway === 'ledger' && event.method === 'prepareAppend' && JSON.parse(Buffer.from(event.request.event_bytes).subarray(0, -1).toString('utf8')).event_class === 'AGENT_RUN').length }, { worktrees: beforeLaterRun.worktrees, agents: beforeLaterRun.agents }, 'the later public run preserves the admission stop without Worktree or Agent replay');
    }, {
      stopAfterDispatch: true,
      transformAdmissionLedgerResult: async ({ method, event_class, request, actualResult, faultHits }) => {
        if (method !== 'readRemoteAppend' || event_class !== 'CONTROLLER_COMMAND' || actualResult?.kind !== 'OK' || request.event_id !== actualResult.value?.event_id) return actualResult;
        const identity = canonicalJson({ event_id: request.event_id, event_hash: request.event_hash, idempotency_id: request.idempotency_id, expected_commit: request.expected_commit });
        if (admissionIdentity === null) { admissionIdentity = identity; admissionActualRecord = structuredClone(actualResult.value); stableWrongTuple = ok({ ...actualResult.value, event_id: 'event-wrong', event_hash: 'b'.repeat(64), idempotency_id: 'idem-wrong' }); }
        if (identity !== admissionIdentity) return actualResult;
        assert.deepEqual(actualResult.value, admissionActualRecord, 'each read of the original admission identity must still observe its original complete actual record');
        admissionFaultInvocations += 1; faultHits.push('wrong-admission-tuple'); return structuredClone(stableWrongTuple);
      },
    });
  });
  await t.test('identical DISPATCH replay after a wrong admission tuple and failed BLOCKED persistence cannot return READY', async () => {
    let sourceLedger = null; let replayLedger = null; let replayLedgerRoot = null; let admissionFaultInvocations = 0; let admissionIdentity = null; let admissionActualRecord = null; let stableWrongTuple = null; let blockedWriteAttempts = 0; let injectedBlockedWriteFailures = 0;
    await withObservedK1Prefix(async context => {
      const admissionReadStart = context.gatewayEvents.find(event => event.edge === 'START' && event.gateway === 'ledger' && event.method === 'readRemoteAppend');
      const admissionRead = context.gatewayEvents.find(event => event.edge === 'COMPLETE' && event.invocation === admissionReadStart?.invocation);
      const prepared = context.gatewayEvents.find(event => event.edge === 'START' && event.gateway === 'ledger' && event.method === 'prepareAppend'); const preparedComplete = context.gatewayEvents.find(event => event.edge === 'COMPLETE' && event.invocation === prepared?.invocation);
      const committed = context.gatewayEvents.find(event => event.edge === 'START' && event.gateway === 'ledger' && event.method === 'commitAndPush'); const committedComplete = context.gatewayEvents.find(event => event.edge === 'COMPLETE' && event.invocation === committed?.invocation);
      const readyWriteStart = context.gatewayEvents.find(event => event.edge === 'START' && event.gateway === 'state' && event.method === 'writeState' && event.request.state?.macro_state === 'READY');
      const readyWrite = context.gatewayEvents.find(event => event.edge === 'COMPLETE' && event.invocation === readyWriteStart?.invocation);
      assertExactResult(context.dispatch, { operation: 'applyControllerCommand', outcome: 'BLOCKED', state: null });
      const ready = await context.base.state.readState({ change_id: context.command.change_id });
      assert.ok(prepared && preparedComplete && committed && committedComplete && admissionReadStart && admissionRead && readyWriteStart && readyWrite); assert.equal(preparedComplete.actual_result.kind, 'OK'); assert.equal(committedComplete.actual_result.kind, 'OK'); assert.deepEqual(committed.request.prepared_receipt, preparedComplete.actual_result.value); assert.equal(admissionReadStart.request.expected_commit, committedComplete.actual_result.value.commit_sha); assert.equal(ready.kind, 'OK'); assert.equal(ready.value.bytes, readyWrite.actual_result.value.bytes); assert.equal(ready.value.sha256, sha256(ready.value.bytes)); assert.equal(ready.value.bytes, canonicalJson(readyWriteStart.request.state)); const readyState = JSON.parse(ready.value.bytes); assert.equal(readyState.macro_state, 'READY'); assert.ok(Number.isSafeInteger(readyState.state_version), 'READY retains its exact persisted State version alongside its byte hash');
      const pointer = await context.base.state.readPointer({}); const pointerBytes = pointer.value.bytes; assert.equal(pointer.kind, 'OK'); assert.equal(pointer.value.sha256, sha256(pointer.value.bytes)); assert.deepEqual(JSON.parse(pointer.value.bytes), { active_change_id: context.command.change_id, schema_version: '1.0' }); assert.equal(admissionFaultInvocations, 1); assert.equal(admissionReadStart.request.event_id, admissionRead.actual_result.value.event_id); assert.equal(admissionRead.actual_result.kind, 'OK'); assert.notEqual(admissionRead.actual_result.value.event_id, admissionRead.result.value.event_id);
      const failedBlockedStart = context.gatewayEvents.find(event => event.edge === 'START' && event.gateway === 'state' && event.method === 'writeState' && event.request.state?.macro_state === 'BLOCKED'); const failedBlockedComplete = context.gatewayEvents.find(event => event.edge === 'COMPLETE' && event.invocation === failedBlockedStart?.invocation); assert.ok(failedBlockedStart && failedBlockedComplete); assert.equal(failedBlockedComplete.actual_result.kind, 'CONFLICT'); assert.equal(blockedWriteAttempts, 1, 'the first durable BLOCKED State CAS is attempted once'); assert.equal(injectedBlockedWriteFailures, 1, 'only the first durable BLOCKED State CAS receives the injected conflict');
      const admissionEvent = JSON.parse(Buffer.from(prepared.request.event_bytes).subarray(0, -1).toString('utf8')); await mkdir(replayLedgerRoot, { recursive: true }); replayLedger = await createLocalBareLedger(replayLedgerRoot, context.command.change_id); const divergent = await appendTestLedgerEvent(replayLedger, { change_id: context.command.change_id, event_class: admissionEvent.event_class, detail: { ...admissionEvent.detail, ready_state_sha256: 'f'.repeat(64) }, state_version: admissionEvent.state_version, subject_sha: admissionEvent.subject_sha, idempotency_id: admissionEvent.idempotency_id, occurred_at: admissionEvent.occurred_at, event_id: `${admissionEvent.event_id}-wrong` }); const physical = await replayLedger.readRemote({ remote_ref: 'refs/heads/evidence/agent-runs', expected_tip: null, change_id: context.command.change_id }); assert.equal(physical.kind, 'OK'); assert.equal(physical.value.tip, divergent.committed.value.commit_sha); assert.equal(physical.value.tip_tree, divergent.committed.value.tree_sha); const replayGitDir = path.join(replayLedgerRoot, 'ledger-origin.git'); const physicalTip = await run(GIT, ['--git-dir', replayGitDir, 'rev-parse', '--verify', 'refs/heads/evidence/agent-runs'], { cwd: replayLedgerRoot, env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' } }); const physicalTree = await run(GIT, ['--git-dir', replayGitDir, 'rev-parse', `${physical.value.tip}^{tree}`], { cwd: replayLedgerRoot, env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' } }); const physicalBytes = await run(GIT, ['--git-dir', replayGitDir, 'show', `${physical.value.tip}:ledger/${context.command.change_id}.jsonl`], { cwd: replayLedgerRoot, env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' } }); assert.equal(physicalTip.code, 0, physicalTip.stderr); assert.equal(physicalTree.code, 0, physicalTree.stderr); assert.equal(physicalBytes.code, 0, physicalBytes.stderr); assert.equal(physicalTip.stdout.trim(), divergent.committed.value.commit_sha); assert.equal(physicalTree.stdout.trim(), divergent.committed.value.tree_sha); assert.deepEqual(Buffer.from(physicalBytes.stdout), divergent.eventBytes, 'the replay Ledger is physically backed by the canonical divergent CONTROLLER_COMMAND bytes'); assert.notEqual(admissionEvent.detail.ready_state_sha256, 'f'.repeat(64));
      const replay = await context.core.applyControllerCommand(signed(context.command));
      assertExactResult(replay, { operation: 'applyControllerCommand', outcome: 'BLOCKED', state: 'BLOCKED' });
      const durable = await context.base.state.readState({ change_id: context.command.change_id }); const pointerAfter = await context.base.state.readPointer({}); assert.equal(durable.kind, 'OK'); assert.equal(durable.value.sha256, sha256(durable.value.bytes)); assert.equal(JSON.parse(durable.value.bytes).macro_state, 'BLOCKED'); assert.equal(pointerAfter.value.bytes, pointerBytes, 'replay persists only the State-only BLOCKED stop and cannot repoint admission'); assert.equal(blockedWriteAttempts, 2, 'replay retries the durable State-only BLOCKED persistence'); assert.equal(injectedBlockedWriteFailures, 1, 'the retry reaches the real State CAS rather than receiving a second synthetic fault');
      const durableWriteStart = context.gatewayEvents.filter(event => event.edge === 'START' && event.gateway === 'state' && event.method === 'writeState' && event.request.state?.macro_state === 'BLOCKED').at(-1); const durableWrite = context.gatewayEvents.find(event => event.edge === 'COMPLETE' && event.invocation === durableWriteStart?.invocation); assert.ok(durableWriteStart && durableWrite); assert.equal(durableWrite.actual_result.kind, 'OK'); assert.equal(durable.value.bytes, durableWrite.actual_result.value.bytes); assert.equal(replay.payload.next_action, 'MANUAL_CONTROLLER_STOP');
      assert.equal(context.gatewayEvents.some(event => event.edge === 'START' && event.gateway === 'git' && event.method === 'createOrReuseWorktree'), false, 'neither rejected admission starts Worktree work'); assert.equal(context.gatewayEvents.some(event => event.edge === 'START' && event.gateway === 'ledger' && event.method === 'prepareAppend' && JSON.parse(Buffer.from(event.request.event_bytes).subarray(0, -1).toString('utf8')).event_class === 'AGENT_RUN'), false, 'neither rejected admission starts an Agent');
    }, {
      stopAfterDispatch: true,
      transformAdmissionLedgerResult: async ({ method, event_class, request, actualResult, faultHits }) => {
        if (method !== 'readRemoteAppend' || event_class !== 'CONTROLLER_COMMAND' || actualResult?.kind !== 'OK' || request.event_id !== actualResult.value?.event_id) return actualResult;
        const identity = canonicalJson({ event_id: request.event_id, event_hash: request.event_hash, idempotency_id: request.idempotency_id, expected_commit: request.expected_commit });
        if (admissionIdentity === null) { admissionIdentity = identity; admissionActualRecord = structuredClone(actualResult.value); stableWrongTuple = ok({ ...actualResult.value, event_id: 'event-wrong', event_hash: 'b'.repeat(64), idempotency_id: 'idem-wrong' }); }
        if (identity !== admissionIdentity) return actualResult;
        assert.deepEqual(actualResult.value, admissionActualRecord, 'the original first admission readback remains physically healthy before the deliberate negative delivery');
        admissionFaultInvocations += 1; faultHits.push('wrong-admission-tuple'); return structuredClone(stableWrongTuple);
      },
      seedLedger: async ({ ledger, fixtureRoot }) => { sourceLedger = ledger; replayLedgerRoot = path.join(fixtureRoot, 'replay-ledger'); },
      ledgerRoute: { target: { async readRemote(request) { return (replayLedger ?? sourceLedger).readRemote(request); }, async prepareAppend(request) { return (replayLedger ?? sourceLedger).prepareAppend(request); }, async commitAndPush(request) { return (replayLedger ?? sourceLedger).commitAndPush(request); }, async readRemoteAppend(request) { return (replayLedger ?? sourceLedger).readRemoteAppend(request); } } },
      transformAdmissionStateRequest: async ({ method, request }) => {
        if (method !== 'writeState' || request.state?.macro_state !== 'BLOCKED') return request;
        blockedWriteAttempts += 1;
        if (injectedBlockedWriteFailures !== 0) return request;
        injectedBlockedWriteFailures += 1;
        return { ...request, expected_sha256: '0'.repeat(64) };
      },
    });
  });
});

test('TEST-DTF-R1-005: no local Ledger artifact is durable evidence; only exact remote record readback may advance', async t => {
  const failures = [
    ['local prepared bytes only', 'ledger.commitAndPush', unavailable({ stage: 'LOCAL_PREPARED' })],
    ['local evidence commit only', 'ledger.readRemoteAppend', unavailable({ stage: 'EVIDENCE_COMMIT_CREATED' })],
    ['push acknowledgement without remote readback', 'ledger.readRemoteAppend', unavailable({ stage: 'PUSH_SENT' })],
    ['lost push response', 'ledger.readRemoteAppend', ambiguous({ stage: 'REMOTE_REF_READ' })],
    ['remote ref/tree/path/record mismatch', 'ledger.readRemoteAppend', conflict('remote-record-mismatch')],
  ];
  for (const [name, dependency, fault] of failures) {
    await t.test(name, async () => {
      const harness = await createCoordinatorUnderTest(); let pauseOutcome = null; const delegatedWriteLocalPause = harness.dependencies.state.writeLocalPause.bind(harness.dependencies.state); harness.dependencies.state.writeLocalPause = async request => { const outcome = await delegatedWriteLocalPause(request); pauseOutcome = structuredClone(outcome); return outcome; }; harness.fault(dependency, fault);
      const input = signed(); const result = await harness.coordinator.applyControllerCommand(input);
      const unavailable = ['local prepared bytes only', 'local evidence commit only', 'push acknowledgement without remote readback'].includes(name); let laterIdentity = { expected_state_version: result.state_version, expected_state_hash: result.state_hash }; let retained = null;
      assertExactResult(result, { operation: 'applyControllerCommand', outcome: 'BLOCKED', state: unavailable ? null : 'BLOCKED' });
      assert.equal(result.payload.next_action, unavailable ? 'IDENTICAL_COMMAND_REPLAY' : 'MANUAL_CONTROLLER_STOP');
      assert.equal(harness.count(dependency), 1, `PRECONDITION_NOT_REACHED: ${dependency} must be called once`);
      noCall(harness, 'git.createOrReuseWorktree'); noCall(harness, 'pull_request.createOrReuse'); noCall(harness, 'handoff.writeReadback');
      if (unavailable) {
        assert.equal(result.payload.blocked_reason, 'EVIDENCE_REF_UNAVAILABLE');
        const pauseWrite = harness.calls.find(call => call.name === 'state.writeLocalPause'); assert.ok(pauseWrite);
        assert.deepEqual(Object.keys(pauseWrite.request).sort(), ['expected_sha256', 'next_bytes']); assert.equal(pauseWrite.request.expected_sha256, null); assert.equal(typeof pauseWrite.request.next_bytes, 'string'); assert.equal(canonicalJson(JSON.parse(pauseWrite.request.next_bytes)), pauseWrite.request.next_bytes); const pause = JSON.parse(pauseWrite.request.next_bytes);
        assert.deepEqual(Object.keys(pause).sort(), ['change_id', 'command_id', 'created_at', 'diagnostic_id', 'event_id', 'expected_event_hash', 'expected_evidence_tip', 'next_action', 'operation', 'reason', 'request_idempotency_id', 'request_sha256', 'schema_version', 'state_hash', 'state_version', 'supersedes_diagnostic_id']);
        const readyWrite = harness.calls.find(call => call.name === 'state.writeState'); assert.ok(readyWrite); assert.equal(harness.count('state.writeState'), 1, 'unavailable Ledger evidence retains the one prior READY State write and adds no durable BLOCKED transition'); assert.equal(readyWrite.request.state.macro_state, 'READY'); const readyReadback = await harness.dependencies.state.readState({ change_id: CHANGE_ID }); assert.equal(readyReadback.kind, 'OK'); assert.equal(readyReadback.value.bytes, canonicalJson(readyWrite.request.state)); assert.equal(readyReadback.value.sha256, sha256(readyReadback.value.bytes)); assert.deepEqual(harness.stateStore.state, readyWrite.request.state); const readyState = JSON.parse(readyReadback.value.bytes);
        assert.deepEqual({ schema_version: pause.schema_version, operation: pause.operation, reason: pause.reason, next_action: pause.next_action, change_id: pause.change_id, command_id: pause.command_id, request_idempotency_id: pause.request_idempotency_id, request_sha256: pause.request_sha256, state_version: pause.state_version, state_hash: pause.state_hash, event_id: pause.event_id, expected_event_hash: pause.expected_event_hash, expected_evidence_tip: pause.expected_evidence_tip, created_at: pause.created_at, supersedes_diagnostic_id: pause.supersedes_diagnostic_id }, { schema_version: '1.0', operation: 'applyControllerCommand', reason: 'EVIDENCE_REF_UNAVAILABLE', next_action: 'IDENTICAL_COMMAND_REPLAY', change_id: CHANGE_ID, command_id: 'command-001', request_idempotency_id: 'idem-001', request_sha256: sha256(input.command_body_bytes), state_version: readyState.state_version, state_hash: readyReadback.value.sha256, event_id: null, expected_event_hash: null, expected_evidence_tip: null, created_at: '2026-08-25T00:00:00.000Z', supersedes_diagnostic_id: null }); assert.equal(typeof pause.diagnostic_id, 'string'); assert.notEqual(pause.diagnostic_id, '');
        assert.deepEqual(pauseOutcome, { kind: 'OK', value: { bytes: pauseWrite.request.next_bytes, sha256: sha256(pauseWrite.request.next_bytes) }, receipt_sha256: sha256(canonicalJson({ bytes: pauseWrite.request.next_bytes, sha256: sha256(pauseWrite.request.next_bytes) })) }); assert.equal(harness.stateStore.localPause, pauseWrite.request.next_bytes); const pauseReadback = await harness.dependencies.state.readLocalPause({}); assert.equal(pauseReadback.kind, 'OK'); assert.deepEqual(pauseReadback.value, { bytes: pauseWrite.request.next_bytes, sha256: sha256(pauseWrite.request.next_bytes) }); assert.equal(harness.calls.some(call => call.name === 'ledger.prepareAppend' && call.request.event_class === 'BLOCKED'), false, 'unavailable evidence publishes no BLOCKED Ledger event');
        laterIdentity = { expected_state_version: readyState.state_version, expected_state_hash: readyReadback.value.sha256 }; retained = { state: structuredClone(readyReadback.value), pause: structuredClone(pauseReadback.value), stateWrites: harness.count('state.writeState'), pauseWrites: harness.count('state.writeLocalPause'), prepared: harness.count('ledger.prepareAppend'), published: harness.count('ledger.commitAndPush'), dependency: harness.count(dependency), worktrees: harness.count('git.createOrReuseWorktree'), pullRequests: harness.count('pull_request.createOrReuse'), handoffs: harness.count('handoff.writeReadback') };
      }
      const before = harness.count(dependency);
      const later = await harness.coordinator.run({ change_id: CHANGE_ID, ...laterIdentity });
      assertExactResult(later, { operation: 'run', outcome: 'BLOCKED', state: unavailable ? 'READY' : 'BLOCKED' }); assert.equal(harness.count(dependency), before);
      if (retained) {
        assert.equal(later.state_version, laterIdentity.expected_state_version); assert.equal(later.state_hash, laterIdentity.expected_state_hash); const afterState = await harness.dependencies.state.readState({ change_id: CHANGE_ID }); const afterPause = await harness.dependencies.state.readLocalPause({}); assert.equal(afterState.kind, 'OK'); assert.deepEqual(afterState.value, retained.state); assert.equal(afterPause.kind, 'OK'); assert.deepEqual(afterPause.value, retained.pause); assert.equal(harness.count('state.writeState'), retained.stateWrites); assert.equal(harness.count('state.writeLocalPause'), retained.pauseWrites); assert.equal(harness.count('ledger.prepareAppend'), retained.prepared); assert.equal(harness.count('ledger.commitAndPush'), retained.published); assert.equal(harness.count(dependency), retained.dependency); assert.equal(harness.count('git.createOrReuseWorktree'), retained.worktrees); assert.equal(harness.count('pull_request.createOrReuse'), retained.pullRequests); assert.equal(harness.count('handoff.writeReadback'), retained.handoffs);
      }
    });
  }
  await t.test('Evidence Ref unavailable stores exact original request local pause without a BLOCKED Ledger event', async () => {
    const harness = await createCoordinatorUnderTest(); harness.fault('ledger.readRemote', unavailable({ stage: 'PRIOR_TIP_READ' }));
    const result = await harness.coordinator.applyControllerCommand(signed());
    assertExactResult(result, { operation: 'applyControllerCommand', outcome: 'BLOCKED', state: null }); assert.equal(result.payload.next_action, 'IDENTICAL_COMMAND_REPLAY');
    assert.equal(harness.count('ledger.readRemote'), 1, 'PRECONDITION_NOT_REACHED: remote evidence read must be attempted once'); assert.equal(harness.count('ledger.prepareAppend'), 0); assert.equal(harness.count('ledger.commitAndPush'), 0); noCall(harness, 'git.createOrReuseWorktree');
    const pauseWrite = harness.calls.find(call => call.name === 'state.writeLocalPause'); assert.ok(pauseWrite, 'the unavailable DISPATCH must attempt its exact local-pause persistence');
    assert.deepEqual(Object.keys(pauseWrite.request).sort(), ['expected_sha256', 'next_bytes'], 'Foundation local-pause persistence is the closed CAS bytes request, never the legacy diagnostic/value pair');
    assert.equal(pauseWrite.request.expected_sha256, null); assert.equal(typeof pauseWrite.request.next_bytes, 'string'); const diagnostic = JSON.parse(pauseWrite.request.next_bytes);
    assert.deepEqual(Object.keys(diagnostic).sort(), ['change_id', 'command_id', 'created_at', 'diagnostic_id', 'event_id', 'expected_event_hash', 'expected_evidence_tip', 'next_action', 'operation', 'reason', 'request_idempotency_id', 'request_sha256', 'schema_version', 'state_hash', 'state_version', 'supersedes_diagnostic_id']);
    assert.equal(diagnostic.schema_version, '1.0'); assert.equal(diagnostic.operation, 'applyControllerCommand'); assert.equal(diagnostic.reason, 'EVIDENCE_REF_UNAVAILABLE'); assert.equal(diagnostic.next_action, 'IDENTICAL_COMMAND_REPLAY'); assert.equal(diagnostic.request_idempotency_id, 'idem-001'); assert.equal(diagnostic.request_sha256, sha256(signed().command_body_bytes)); assert.equal(diagnostic.change_id, CHANGE_ID); assert.equal(diagnostic.command_id, 'command-001'); assert.equal(diagnostic.event_id, null); assert.equal(diagnostic.expected_event_hash, null); assert.equal(diagnostic.expected_evidence_tip, null); assert.equal(diagnostic.state_version === null, diagnostic.state_hash === null, 'the diagnostic retains only a paired nullable State identity; this leaf does not invent which pre-append identity applies'); assert.ok(diagnostic.state_version === null || Number.isSafeInteger(diagnostic.state_version)); assert.ok(diagnostic.state_hash === null || /^[0-9a-f]{64}$/.test(diagnostic.state_hash)); assert.equal(diagnostic.supersedes_diagnostic_id, null);
    assert.equal(harness.stateStore.localPause, pauseWrite.request.next_bytes, 'the strict boundary must retain the exact canonical diagnostic bytes'); const pauseReadback = await harness.dependencies.state.readLocalPause({}); assert.equal(pauseReadback.kind, 'OK'); assert.equal(pauseReadback.value.bytes, pauseWrite.request.next_bytes); assert.equal(pauseReadback.value.sha256, sha256(pauseWrite.request.next_bytes));
  });
});

test('TEST-DTF-R1-007: exact Candidate, Validator, PR, and Handoff identity is required before freeze or AWAITING_CONTROLLER', async t => {
  await t.test('local Candidate Head mismatch', async () => {
    let candidateSha = null;
    await withObservedK1Prefix(async context => {
      const result = await context.core.run({ change_id: context.command.change_id, expected_state_version: context.regression.state_version, expected_state_hash: context.regression.state_hash });
      assertExactResult(result, { operation: 'run', outcome: 'BLOCKED', state: 'BLOCKED' }); assert.equal(result.payload.blocked_reason, 'CANDIDATE_IDENTITY_CONFLICT'); assert.equal(result.payload.next_action, 'MANUAL_CONTROLLER_STOP');
      const candidateReadStart = context.gatewayEvents.find(event => event.edge === 'START' && event.gateway === 'git' && event.method === 'readCommit' && event.request.sha === candidateSha);
      const candidateRead = context.gatewayEvents.find(event => event.edge === 'COMPLETE' && event.invocation === candidateReadStart?.invocation);
      assert.ok(candidateRead, 'PRECONDITION_NOT_REACHED: the real Candidate must be committed and then read before the local-Head mismatch is delivered');
      assert.equal(candidateRead.actual_result.kind, 'OK'); assert.equal(candidateRead.actual_result.value.sha, candidateSha);
      assert.equal(candidateRead.result.kind, 'OK'); assert.notEqual(candidateRead.result.value.sha, candidateSha); assert.equal(candidateRead.result.value.parent, candidateRead.actual_result.value.parent); assert.equal(candidateRead.result.value.tree, candidateRead.actual_result.value.tree); assert.equal(candidateRead.result.value.branch, candidateRead.actual_result.value.branch); assert.equal(candidateRead.result.receipt_sha256, sha256(canonicalJson(candidateRead.result.value)), 'the one altered Candidate response recomputes its own receipt digest');
      assert.equal(context.observedLedgerReadbacks.some(entry => entry.event.event_class === 'CANDIDATE_COMMITTED'), false, 'a mismatched post-commit local Head cannot publish Candidate evidence');
      assert.equal(context.gatewayEvents.some(event => event.edge === 'START' && event.gateway === 'git' && ['pushBranch', 'readRemoteBranch'].includes(event.method)), false, 'the Candidate mismatch stops before branch publication');
      const counts = { commits: context.gatewayEvents.filter(event => event.edge === 'START' && event.gateway === 'git' && event.method === 'commitCandidate').length, reads: context.gatewayEvents.filter(event => event.edge === 'START' && event.gateway === 'git' && event.method === 'readCommit' && event.request.sha === candidateSha).length };
      const replay = await context.core.run({ change_id: context.command.change_id, expected_state_version: result.state_version, expected_state_hash: result.state_hash });
      assertExactResult(replay, { operation: 'run', outcome: 'BLOCKED', state: 'BLOCKED' });
      assert.deepEqual({ commits: context.gatewayEvents.filter(event => event.edge === 'START' && event.gateway === 'git' && event.method === 'commitCandidate').length, reads: context.gatewayEvents.filter(event => event.edge === 'START' && event.gateway === 'git' && event.method === 'readCommit' && event.request.sha === candidateSha).length }, counts, 'the durable Candidate identity stop cannot replay the real commit/read boundary');
    }, {
      stopAtStage: true,
      transformGitResult: async ({ method, request, actualResult }) => {
        if (method === 'commitCandidate' && actualResult?.kind === 'OK') candidateSha = actualResult.value.sha;
        if (method === 'readCommit' && request.sha === candidateSha && actualResult?.kind === 'OK') return ok({ ...actualResult.value, sha: 'f'.repeat(40) });
        return actualResult;
      },
    });
  });
  await t.test('remote branch Head mismatch', async () => {
    let pushedCandidate = null;
    await withObservedK1Prefix(async context => {
      const { validatorPass } = await settleOrdinaryValidatorForBoundary(context, 'dtf007-remote-head');
      const result = await context.core.run({ change_id: context.command.change_id, expected_state_version: validatorPass.state_version, expected_state_hash: validatorPass.state_hash });
      assertExactResult(result, { operation: 'run', outcome: 'BLOCKED', state: 'BLOCKED' }); assert.equal(result.payload.blocked_reason, 'BRANCH_PUSH_AMBIGUOUS'); assert.equal(result.payload.next_action, 'MANUAL_CONTROLLER_STOP');
      const remoteRead = context.gatewayEvents.find(event => event.edge === 'COMPLETE' && event.gateway === 'git' && event.method === 'readRemoteBranch' && event.actual_result?.value?.remote_head === pushedCandidate);
      assert.ok(remoteRead, 'PRECONDITION_NOT_REACHED: the actual Candidate branch must be pushed and then independently read');
      assert.equal(remoteRead.result.kind, 'OK'); assert.notEqual(remoteRead.result.value.remote_head, pushedCandidate); assert.equal(remoteRead.result.receipt_sha256, sha256(canonicalJson(remoteRead.result.value)), 'the one altered remote-Head response recomputes its receipt digest');
      assert.equal(context.observedLedgerReadbacks.some(entry => entry.event.event_class === 'BRANCH_PUSHED'), false, 'a remote Head mismatch cannot publish BRANCH_PUSHED');
      assert.equal(context.gatewayEvents.some(event => event.edge === 'START' && event.gateway === 'git' && event.method === 'canonicalDiff'), false, 'the mismatch stops before Candidate freeze');
      const counts = { pushes: context.gatewayEvents.filter(event => event.edge === 'START' && event.gateway === 'git' && event.method === 'pushBranch').length, reads: context.gatewayEvents.filter(event => event.edge === 'START' && event.gateway === 'git' && event.method === 'readRemoteBranch').length };
      const replay = await context.core.run({ change_id: context.command.change_id, expected_state_version: result.state_version, expected_state_hash: result.state_hash });
      assertExactResult(replay, { operation: 'run', outcome: 'BLOCKED', state: 'BLOCKED' });
      assert.deepEqual({ pushes: context.gatewayEvents.filter(event => event.edge === 'START' && event.gateway === 'git' && event.method === 'pushBranch').length, reads: context.gatewayEvents.filter(event => event.edge === 'START' && event.gateway === 'git' && event.method === 'readRemoteBranch').length }, counts, 'the durable remote-Head stop cannot repeat branch publication');
    }, {
      transformGitResult: async ({ method, actualResult }) => {
        if (method === 'pushBranch' && actualResult?.kind === 'OK') pushedCandidate = actualResult.value.remote_head;
        if (method === 'readRemoteBranch' && pushedCandidate !== null && actualResult?.kind === 'OK') return ok({ remote_head: 'e'.repeat(40) });
        return actualResult;
      },
    });
  });
  await t.test('PR multiple result', async () => {
    const calls = [];
    const pull_request = {
      async queryCurrent(request) { calls.push({ method: 'queryCurrent', request: structuredClone(request) }); return conflict('multiple-prs'); },
      async createOrReuse(request) { calls.push({ method: 'createOrReuse', request: structuredClone(request) }); return unavailable(null); },
      async readback(request) { calls.push({ method: 'readback', request: structuredClone(request) }); return unavailable(null); },
    };
    await withObservedK1Prefix(async context => {
      const { validatorPass } = await settleOrdinaryValidatorForBoundary(context, 'dtf007-pr-multiple');
      const pushed = await context.core.run({ change_id: context.command.change_id, expected_state_version: validatorPass.state_version, expected_state_hash: validatorPass.state_hash }); assert.equal(pushed.payload.to_phase, 'CANDIDATE_FREEZE');
      const frozen = await context.core.run({ change_id: context.command.change_id, expected_state_version: pushed.state_version, expected_state_hash: pushed.state_hash }); assert.equal(frozen.payload.to_phase, 'PR');
      const result = await context.core.run({ change_id: context.command.change_id, expected_state_version: frozen.state_version, expected_state_hash: frozen.state_hash });
      assertExactResult(result, { operation: 'run', outcome: 'BLOCKED', state: 'BLOCKED' }); assert.equal(result.payload.blocked_reason, 'FINAL_HANDOFF_PR_AMBIGUOUS'); assert.equal(result.payload.next_action, 'MANUAL_CONTROLLER_STOP');
      assert.deepEqual(calls, [{ method: 'queryCurrent', request: { repository: context.command.repository.repository_id, base: 'main', head_branch: context.command.worktree.branch } }], 'the one multiple-result response is reached only after the real Candidate/freeze predecessor and cannot request a replacement PR');
      assert.equal(context.gatewayEvents.some(event => event.edge === 'START' && event.gateway === 'handoff'), false, 'multiple PR results stop before Handoff'); assert.equal(context.observedLedgerReadbacks.some(entry => entry.event.event_class === 'HANDOFF_READY'), false);
      const replay = await context.core.run({ change_id: context.command.change_id, expected_state_version: result.state_version, expected_state_hash: result.state_hash }); assertExactResult(replay, { operation: 'run', outcome: 'BLOCKED', state: 'BLOCKED' }); assert.equal(calls.length, 1, 'the durable PR stop cannot repeat queryCurrent');
    }, { pull_request });
  });
  await t.test('PR wrong base/head', async () => {
    const calls = [];
    const pull_request = {
      async queryCurrent(request) { calls.push({ method: 'queryCurrent', request: structuredClone(request) }); return absent({ repository: request.repository, base: request.base, head_branch: request.head_branch }); },
      async createOrReuse(request) { calls.push({ method: 'createOrReuse', request: structuredClone(request) }); return ok({ number: 207, url: 'https://invalid.example/pr/207', base: request.base, head_branch: request.head_branch, head_sha: request.head_sha, review_ready: true }); },
      async readback(request) { calls.push({ method: 'readback', request: structuredClone(request) }); return ok({ number: request.number, url: 'https://invalid.example/pr/207', base: 'other', head_branch: 'work/mac-mini/m2-regression', head_sha: 'd'.repeat(40), review_ready: true }); },
    };
    await withObservedK1Prefix(async context => {
      const { validatorPass } = await settleOrdinaryValidatorForBoundary(context, 'dtf007-pr-wrong-head');
      const pushed = await context.core.run({ change_id: context.command.change_id, expected_state_version: validatorPass.state_version, expected_state_hash: validatorPass.state_hash }); assert.equal(pushed.payload.to_phase, 'CANDIDATE_FREEZE');
      const frozen = await context.core.run({ change_id: context.command.change_id, expected_state_version: pushed.state_version, expected_state_hash: pushed.state_hash }); assert.equal(frozen.payload.to_phase, 'PR');
      const prStateReadback = await context.base.state.readState({ change_id: context.command.change_id }); assert.equal(prStateReadback.kind, 'OK'); const prState = JSON.parse(prStateReadback.value.bytes);
      const result = await context.core.run({ change_id: context.command.change_id, expected_state_version: frozen.state_version, expected_state_hash: frozen.state_hash });
      assertExactResult(result, { operation: 'run', outcome: 'BLOCKED', state: 'BLOCKED' }); assert.equal(result.payload.blocked_reason, 'FINAL_HANDOFF_PR_AMBIGUOUS'); assert.equal(result.payload.next_action, 'MANUAL_CONTROLLER_STOP');
      assert.equal(calls.length, 3); assert.deepEqual(calls[0], { method: 'queryCurrent', request: { repository: context.command.repository.repository_id, base: 'main', head_branch: context.command.worktree.branch } }); assert.deepEqual(calls[1], { method: 'createOrReuse', request: { repository: context.command.repository.repository_id, base: 'main', head_branch: context.command.worktree.branch, head_sha: context.candidateEvent.detail.candidate_sha, idempotency_id: prState.delivery.delivery_id } });
      assert.deepEqual(calls[2].request, { number: 207, expected_head: context.candidateEvent.detail.candidate_sha });
      const wrongReadback = context.gatewayEvents.find(event => event.edge === 'COMPLETE' && event.gateway === 'pull_request' && event.method === 'readback'); assert.ok(wrongReadback); assert.deepEqual(wrongReadback.result.value, { number: 207, url: 'https://invalid.example/pr/207', base: 'other', head_branch: context.command.worktree.branch, head_sha: 'd'.repeat(40), review_ready: true }); assert.equal(wrongReadback.result.receipt_sha256, sha256(canonicalJson(wrongReadback.result.value)), 'the delivered wrong-base/head PR response recomputes its closed receipt digest');
      assert.equal(context.gatewayEvents.some(event => event.edge === 'START' && event.gateway === 'handoff'), false, 'wrong PR identity stops before Handoff'); assert.equal(context.observedLedgerReadbacks.some(entry => entry.event.event_class === 'HANDOFF_READY'), false);
      const replay = await context.core.run({ change_id: context.command.change_id, expected_state_version: result.state_version, expected_state_hash: result.state_hash }); assertExactResult(replay, { operation: 'run', outcome: 'BLOCKED', state: 'BLOCKED' }); assert.equal(calls.length, 3, 'the durable PR identity stop cannot repeat query/create/readback');
    }, { pull_request });
  });
  await t.test('Candidate freeze re-reads local, remote, and Validator Heads and blocks every mismatch', async () => {
    const cases = [
      ['local Candidate Head', 'readCommit'],
      ['remote branch Head', 'readRemoteBranch'],
      ['Validator Head', 'validatorHead'],
    ];
    for (const [name, target] of cases) {
      let freezeArmed = false;
      await withObservedK1Prefix(async context => {
        const { validatorPass } = await settleOrdinaryValidatorForBoundary(context, `dtf007-freeze-${target}`);
        const pushed = await context.core.run({ change_id: context.command.change_id, expected_state_version: validatorPass.state_version, expected_state_hash: validatorPass.state_hash }); assert.equal(pushed.payload.to_phase, 'CANDIDATE_FREEZE');
        let identity = { expected_state_version: pushed.state_version, expected_state_hash: pushed.state_hash };
        if (target === 'validatorHead') {
          const current = await context.base.state.readState({ change_id: context.command.change_id }); assert.equal(current.kind, 'OK'); const state = JSON.parse(current.value.bytes);
          const changed = { ...state, candidate: { ...state.candidate, validator_head: 'c'.repeat(40) } }; const next_bytes = canonicalJson(changed);
          const written = await context.base.state.writeState({ change_id: context.command.change_id, expected_version: state.state_version, expected_sha256: current.value.sha256, state: changed, next_bytes }); assert.equal(written.kind, 'OK'); identity = { expected_state_version: changed.state_version, expected_state_hash: sha256(next_bytes) };
        }
        freezeArmed = true;
        const result = await context.core.run({ change_id: context.command.change_id, ...identity });
        assertExactResult(result, { operation: 'run', outcome: 'BLOCKED', state: 'BLOCKED' }); assert.equal(result.payload.blocked_reason, 'CANDIDATE_IDENTITY_CONFLICT'); assert.equal(result.payload.next_action, 'MANUAL_CONTROLLER_STOP');
        const freezeCalls = context.gatewayEvents.filter(event => event.edge === 'COMPLETE' && event.gateway === 'git' && (event.method === 'readCommit' || event.method === 'readRemoteBranch'));
        if (target === 'readCommit') { const event = freezeCalls.find(event => event.method === 'readCommit' && event.result?.value?.sha === 'c'.repeat(40)); assert.ok(event); assert.equal(event.result.receipt_sha256, sha256(canonicalJson(event.result.value))); }
        if (target === 'readRemoteBranch') { const event = freezeCalls.find(event => event.method === 'readRemoteBranch' && event.result?.value?.remote_head === 'c'.repeat(40)); assert.ok(event); assert.equal(event.result.receipt_sha256, sha256(canonicalJson(event.result.value))); }
        assert.equal(context.gatewayEvents.some(event => event.edge === 'START' && event.gateway === 'git' && event.method === 'canonicalDiff' && event.sequence > context.gatewayEvents.find(event => event.edge === 'START' && event.gateway === 'git' && event.method === 'pushBranch').sequence), false, `${name} stops before the freeze diff`);
        assert.equal(context.gatewayEvents.some(event => event.edge === 'START' && event.gateway === 'pull_request'), false, `${name} stops before PR`);
        const beforeReplay = context.gatewayEvents.length; const replay = await context.core.run({ change_id: context.command.change_id, expected_state_version: result.state_version, expected_state_hash: result.state_hash }); assertExactResult(replay, { operation: 'run', outcome: 'BLOCKED', state: 'BLOCKED' }); assert.equal(context.gatewayEvents.slice(beforeReplay).some(event => event.edge === 'START' && (event.gateway === 'git' || event.gateway === 'pull_request')), false, `${name} durable stop has no later external replay`);
      }, {
        transformGitResult: async ({ method, actualResult }) => {
          if (!freezeArmed || actualResult?.kind !== 'OK') return actualResult;
          if (target === 'readCommit' && method === 'readCommit') return ok({ ...actualResult.value, sha: 'c'.repeat(40) });
          if (target === 'readRemoteBranch' && method === 'readRemoteBranch') return ok({ remote_head: 'c'.repeat(40) });
          return actualResult;
        },
      });
    }
  });
  await t.test('Candidate freeze blocks when the clean Worktree branch tip advanced beyond the still-readable Candidate', async () => {
    let advanceArmed = false;
    await withObservedK1Prefix(async context => {
      const { validatorPass } = await settleOrdinaryValidatorForBoundary(context, 'dtf007-freeze-tip');
      const pushed = await context.core.run({ change_id: context.command.change_id, expected_state_version: validatorPass.state_version, expected_state_hash: validatorPass.state_hash }); assert.equal(pushed.payload.to_phase, 'CANDIDATE_FREEZE');
      await writeFile(path.join(context.coreWorktree, 'tracked.txt'), 'clean post-Candidate advancement\n');
      for (const args of [['add', '--', 'tracked.txt'], ['commit', '-m', 'post-candidate-clean-advance']]) { const command = await run(GIT, args, { cwd: context.coreWorktree, env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' } }); assert.equal(command.code, 0, command.stderr); }
      const head = await run(GIT, ['rev-parse', 'HEAD'], { cwd: context.coreWorktree, env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' } }); assert.equal(head.code, 0, head.stderr); assert.notEqual(head.stdout.trim(), context.candidateEvent.detail.candidate_sha);
      const frontier = context.gatewayEvents.at(-1).sequence; advanceArmed = true;
      const result = await context.core.run({ change_id: context.command.change_id, expected_state_version: pushed.state_version, expected_state_hash: pushed.state_hash });
      assertExactResult(result, { operation: 'run', outcome: 'BLOCKED', state: 'BLOCKED' }); assert.equal(result.payload.blocked_reason, 'CANDIDATE_IDENTITY_CONFLICT'); const inspectionStart = context.gatewayEvents.find(event => event.sequence > frontier && event.edge === 'START' && event.gateway === 'git' && event.method === 'inspectWorktree' && event.request.expected_head === context.candidateEvent.detail.candidate_sha); const inspection = context.gatewayEvents.find(event => event.edge === 'COMPLETE' && event.invocation === inspectionStart?.invocation); assert.ok(inspectionStart && inspection, 'the production inspection request retains its Candidate expectation while its real clean readback exposes the one advanced tip'); assert.equal(inspection.actual_result.kind, 'OK'); assert.equal(inspection.actual_result.value.head_sha, head.stdout.trim()); assert.equal(inspection.actual_result.value.clean, true); assert.deepEqual(inspection.actual_result.value.status_entries, [], 'the one advanced Worktree readback is clean, not a dirty-worktree substitute'); assert.equal(context.gatewayEvents.some(event => event.sequence > frontier && event.edge === 'START' && event.gateway === 'git' && event.method === 'canonicalDiff'), false); assert.equal(context.gatewayEvents.some(event => event.sequence > frontier && event.edge === 'START' && event.gateway === 'pull_request'), false);
      const counts = { git: context.gatewayEvents.filter(event => event.edge === 'START' && event.gateway === 'git').length, pull_request: context.gatewayEvents.filter(event => event.edge === 'START' && event.gateway === 'pull_request').length }; const replay = await context.core.run({ change_id: context.command.change_id, expected_state_version: result.state_version, expected_state_hash: result.state_hash }); assertExactResult(replay, { operation: 'run', outcome: 'BLOCKED', state: 'BLOCKED' }); assert.deepEqual({ git: context.gatewayEvents.filter(event => event.edge === 'START' && event.gateway === 'git').length, pull_request: context.gatewayEvents.filter(event => event.edge === 'START' && event.gateway === 'pull_request').length }, counts, 'the durable clean-tip identity stop cannot replay Git or PR effects');
    }, { invokeGitOperation: async ({ method, request, operation }) => advanceArmed && method === 'inspectWorktree' ? operation({ ...request, expected_head: undefined }) : operation(request) });
  });
  await t.test('format-valid wrong Handoff hash is durably BLOCKED without follow-on effects', async () => {
    const writes = [];
    const pull_request = { async queryCurrent(request) { return absent({ repository: request.repository, base: request.base, head_branch: request.head_branch }); }, async createOrReuse(request) { return ok({ number: 208, url: 'https://invalid.example/pr/208', base: request.base, head_branch: request.head_branch, head_sha: request.head_sha, review_ready: true }); }, async readback(request) { return ok({ number: request.number, url: 'https://invalid.example/pr/208', base: 'main', head_branch: 'work/mac-mini/m2-regression', head_sha: request.expected_head, review_ready: true }); } };
    const handoff = { async writeReadback(request) { writes.push(structuredClone(request)); const document = JSON.parse(Buffer.from(request.handoff_bytes).toString('utf8')); return ok({ handoff_sha256: 'b'.repeat(64), delivery_id: document.delivery_id }); } };
    await withObservedK1Prefix(async context => {
      const { validatorPass } = await settleOrdinaryValidatorForBoundary(context, 'dtf007-handoff-hash');
      const pushed = await context.core.run({ change_id: context.command.change_id, expected_state_version: validatorPass.state_version, expected_state_hash: validatorPass.state_hash }); const frozen = await context.core.run({ change_id: context.command.change_id, expected_state_version: pushed.state_version, expected_state_hash: pushed.state_hash }); const pr = await context.core.run({ change_id: context.command.change_id, expected_state_version: frozen.state_version, expected_state_hash: frozen.state_hash }); assert.equal(pr.payload.to_phase, 'HANDOFF');
      const result = await context.core.run({ change_id: context.command.change_id, expected_state_version: pr.state_version, expected_state_hash: pr.state_hash }); assertExactResult(result, { operation: 'run', outcome: 'BLOCKED', state: 'BLOCKED' }); assert.equal(result.payload.blocked_reason, 'FINAL_HANDOFF_PR_AMBIGUOUS'); assert.equal(result.payload.next_action, 'MANUAL_CONTROLLER_STOP');
      assert.equal(writes.length, 1); assert.match(writes[0].expected_sha256, /^[0-9a-f]{64}$/); assert.notEqual(writes[0].expected_sha256, 'b'.repeat(64)); assert.equal(context.observedLedgerReadbacks.some(entry => entry.event.event_class === 'HANDOFF_READY'), false, 'wrong Handoff hash cannot publish HANDOFF_READY');
      const replay = await context.core.run({ change_id: context.command.change_id, expected_state_version: result.state_version, expected_state_hash: result.state_hash }); assertExactResult(replay, { operation: 'run', outcome: 'BLOCKED', state: 'BLOCKED' }); assert.equal(writes.length, 1, 'the durable Handoff hash stop cannot repeat Handoff');
    }, { pull_request, handoff });
  });
  await t.test('Validator settlement with a wrong Candidate subject blocks before branch push', async () => {
    await withObservedK1Prefix(async context => {
      const final = await context.core.run({ change_id: context.command.change_id, expected_state_version: context.candidateTransition.state_version, expected_state_hash: context.candidateTransition.state_hash }); assert.equal(final.payload.to_phase, 'VALIDATOR');
      const action = await context.core.run({ change_id: context.command.change_id, expected_state_version: final.state_version, expected_state_hash: final.state_hash }); assertExactResult(action, { operation: 'run', outcome: 'AGENT_ACTION', state: 'DELIVERING' }); const { action_kind, ...binding } = action.payload.action; assert.equal(action_kind, 'LAUNCH_AGENT');
      const started = await context.core.settlement({ change_id: context.command.change_id, expected_state_version: action.state_version, expected_state_hash: action.state_hash, settlement: { ...binding, stage: 'STARTED', observed_child_id: 'dtf007-wrong-subject' } }); assertExactResult(started, { operation: 'settlement', outcome: 'WAITING', state: 'DELIVERING' });
      const artifact = { schema_version: '1.0', change_id: context.command.change_id, candidate_sha: action.payload.action.subject_sha, validator_head: action.payload.action.subject_sha, verdict: 'PASS', findings: [], risks: [], unverified: [], open_questions: [] }; const artifact_sha256 = sha256(canonicalJson(artifact));
      const result = await context.core.settlement({ change_id: context.command.change_id, expected_state_version: started.state_version, expected_state_hash: started.state_hash, settlement: { ...binding, subject_sha: 'c'.repeat(40), stage: 'RESULT', observed_child_id: 'dtf007-wrong-subject', status: 'PASS', artifact_path: 'outputs/validator.json', artifact_sha256, validator_artifact: artifact } });
      assertExactResult(result, { operation: 'settlement', outcome: 'BLOCKED', state: 'BLOCKED' }); assert.equal(result.payload.blocked_reason, 'AGENT_SUBJECT_MISMATCH'); assert.equal(context.gatewayEvents.some(event => event.edge === 'START' && event.gateway === 'git' && event.method === 'pushBranch'), false); const replay = await context.core.run({ change_id: context.command.change_id, expected_state_version: result.state_version, expected_state_hash: result.state_hash }); assertExactResult(replay, { operation: 'run', outcome: 'BLOCKED', state: 'BLOCKED' });
    });
  });
});

test('TEST-DTF-R1-008: PR routing uses only the same-process verified DISPATCH repository identity', async t => {
  await t.test('query and create receive the exact signed repository_id instead of Change or inferred identity', async () => {
    const calls = [];
    const pull_request = { async queryCurrent(request) { calls.push({ method: 'queryCurrent', request: structuredClone(request) }); return absent({ repository: request.repository, base: request.base, head_branch: request.head_branch }); }, async createOrReuse(request) { calls.push({ method: 'createOrReuse', request: structuredClone(request) }); return ok({ number: 209, url: 'https://invalid.example/pr/209', base: request.base, head_branch: request.head_branch, head_sha: request.head_sha, review_ready: true }); }, async readback(request) { calls.push({ method: 'readback', request: structuredClone(request) }); return ok({ number: request.number, url: 'https://invalid.example/pr/209', base: 'main', head_branch: 'work/mac-mini/m2-regression', head_sha: request.expected_head, review_ready: true }); } };
    await withObservedK1Prefix(async context => {
      const { validatorPass } = await settleOrdinaryValidatorForBoundary(context, 'dtf008-signed-repository'); const pushed = await context.core.run({ change_id: context.command.change_id, expected_state_version: validatorPass.state_version, expected_state_hash: validatorPass.state_hash }); const frozen = await context.core.run({ change_id: context.command.change_id, expected_state_version: pushed.state_version, expected_state_hash: pushed.state_hash }); assert.equal(frozen.payload.to_phase, 'PR');
      const stateReadback = await context.base.state.readState({ change_id: context.command.change_id }); const state = JSON.parse(stateReadback.value.bytes); const result = await context.core.run({ change_id: context.command.change_id, expected_state_version: frozen.state_version, expected_state_hash: frozen.state_hash }); assertExactResult(result, { operation: 'run', outcome: 'ADVANCED', state: 'DELIVERING' }); assert.equal(result.payload.to_phase, 'HANDOFF');
      assert.deepEqual(calls, [
        { method: 'queryCurrent', request: { repository: context.command.repository.repository_id, base: 'main', head_branch: context.command.worktree.branch } },
        { method: 'createOrReuse', request: { repository: context.command.repository.repository_id, base: 'main', head_branch: context.command.worktree.branch, head_sha: context.candidateEvent.detail.candidate_sha, idempotency_id: state.delivery.delivery_id } },
        { method: 'readback', request: { number: 209, expected_head: context.candidateEvent.detail.candidate_sha } },
      ], 'PR routing consumes only the accepted signed repository identity at the real PR frontier');
      assert.notEqual(calls[0].request.repository, context.command.change_id); assert.notEqual(calls[1].request.repository, context.command.change_id);
    }, { pull_request });
  });

  await t.test('restart without complete accepted DISPATCH authority blocks before every PR side effect', async () => {
    const calls = [];
    const pull_request = { async queryCurrent(request) { calls.push({ method: 'queryCurrent', request }); return unavailable(null); }, async createOrReuse(request) { calls.push({ method: 'createOrReuse', request }); return unavailable(null); }, async readback(request) { calls.push({ method: 'readback', request }); return unavailable(null); } };
    await withObservedK1Prefix(async context => {
      const { validatorPass } = await settleOrdinaryValidatorForBoundary(context, 'dtf008-fresh-authority'); const pushed = await context.core.run({ change_id: context.command.change_id, expected_state_version: validatorPass.state_version, expected_state_hash: validatorPass.state_hash }); const frozen = await context.core.run({ change_id: context.command.change_id, expected_state_version: pushed.state_version, expected_state_hash: pushed.state_hash }); assert.equal(frozen.payload.to_phase, 'PR');
      const fresh = context.restartCore(); const result = await fresh.run({ change_id: context.command.change_id, expected_state_version: frozen.state_version, expected_state_hash: frozen.state_hash });
      assertExactResult(result, { operation: 'run', outcome: 'BLOCKED', state: 'BLOCKED' }); assert.equal(result.payload.blocked_reason, 'ADMISSION_EVIDENCE_UNAVAILABLE'); assert.equal(calls.length, 0, 'a fresh Core without complete same-process authorization cannot query, create, or read PR state');
    }, { pull_request });
  });
});

test('TEST-DTF-R1-010: every RELEASE failure retains active pointer and exact replay clears it only after CLOSED', async t => {
  const releaseFor = identity => signed({ command_kind: 'RELEASE', payload: { squash_sha: CANDIDATE_SHA, acceptance_ref: 'acceptance-001', merge_ref: 'merge-001', archive_ref: 'archive-001', origin_main_sha: CANDIDATE_SHA, macbook_main_sha: CANDIDATE_SHA }, expected_state_version: identity.expected_state_version, expected_state_hash: identity.expected_state_hash });
  await t.test('first RELEASE rejects a foreign active Change before sync or durable effect and preserves pointer bytes', async () => {
    const harness = await createCoordinatorUnderTest(); const identity = primeState(harness, { macro_state: 'AWAITING_CONTROLLER', phase: null, state_version: 8, candidate: makeCandidate(), delivery: makeDelivery() });
    harness.stateStore.pointer = { schema_version: '1.0', active_change_id: CHANGE_B };
    const pointerBefore = bytes(harness.stateStore.pointer);
    const stateBefore = structuredClone(harness.stateStore.state);
    const result = await harness.coordinator.applyControllerCommand(releaseFor(identity));
    assertExactResult(result, { operation: 'applyControllerCommand', outcome: 'REJECTED' });
    assert.deepEqual(bytes(harness.stateStore.pointer), pointerBefore, 'CAUSAL_RED: a RELEASE for another Change must leave the active pointer byte-identical');
    assert.deepEqual(harness.stateStore.state, stateBefore, 'CAUSAL_RED: foreign pointer ownership must reject before State mutation');
    for (const effect of ['git.syncMainFfOnly', 'ledger.readRemote', 'ledger.prepareAppend', 'ledger.commitAndPush', 'ledger.readRemoteAppend', 'state.writeState', 'state.writePointer']) noCall(harness, effect);
  });

  await t.test('CLOSED replay rejects when the retained pointer belongs to another Change and cannot clear it', async () => {
    const seed = await createCoordinatorUnderTest(); const awaiting = primeState(seed, { macro_state: 'AWAITING_CONTROLLER', phase: null, state_version: 8, candidate: makeCandidate(), delivery: makeDelivery() });
    const originalBody = makeDispatch({ command_kind: 'RELEASE', command_id: 'release-foreign-pointer', idempotency_id: 'release-foreign-pointer-idem', receipt_digest: 'c'.repeat(64), payload: { squash_sha: CANDIDATE_SHA, acceptance_ref: 'acceptance-001', merge_ref: 'merge-001', archive_ref: 'archive-001', origin_main_sha: CANDIDATE_SHA, macbook_main_sha: CANDIDATE_SHA }, expected_state_version: awaiting.expected_state_version, expected_state_hash: awaiting.expected_state_hash });
    const originalRequest = { command_body_bytes: bytes(originalBody), signature_bytes: new Uint8Array([1, 2, 3]) };
    const harness = await createCoordinatorUnderTest(); primeState(harness, { macro_state: 'CLOSED', phase: null, state_version: 9, candidate: makeCandidate(), delivery: makeDelivery(), last_controller_command_id: originalBody.command_id, evidence: { remote_tip: GIT_SHA, last_event_id: 'event-001', last_event_hash: SHA256, last_readback_sha256: sha256(originalRequest.command_body_bytes) } });
    harness.stateStore.pointer = { schema_version: '1.0', active_change_id: CHANGE_B };
    const pointerBefore = bytes(harness.stateStore.pointer);
    const stateBefore = structuredClone(harness.stateStore.state);
    const result = await harness.coordinator.applyControllerCommand(originalRequest);
    assertExactResult(result, { operation: 'applyControllerCommand', outcome: 'REJECTED' });
    assert.deepEqual(bytes(harness.stateStore.pointer), pointerBefore, 'CAUSAL_RED: CLOSED replay cannot clear a retained pointer owned by another Change');
    assert.deepEqual(harness.stateStore.state, stateBefore);
    for (const effect of ['git.syncMainFfOnly', 'ledger.readRemote', 'ledger.prepareAppend', 'ledger.commitAndPush', 'ledger.readRemoteAppend', 'state.writeState', 'state.writePointer']) noCall(harness, effect);
  });

  await t.test('every non-equal MacBook/origin/squash SHA combination rejects before sync and all business effects', async t => {
    const thirdSha = '3'.repeat(40);
    const combinations = [
      ['macbook differs', GIT_SHA, CANDIDATE_SHA, CANDIDATE_SHA],
      ['origin differs', CANDIDATE_SHA, GIT_SHA, CANDIDATE_SHA],
      ['squash differs', CANDIDATE_SHA, CANDIDATE_SHA, GIT_SHA],
      ['macbook and origin agree away from squash', GIT_SHA, GIT_SHA, CANDIDATE_SHA],
      ['macbook and squash agree away from origin', GIT_SHA, CANDIDATE_SHA, GIT_SHA],
      ['origin and squash agree away from macbook', CANDIDATE_SHA, GIT_SHA, GIT_SHA],
      ['all three differ', CANDIDATE_SHA, GIT_SHA, thirdSha],
    ];
    for (const [name, macbook_main_sha, origin_main_sha, squash_sha] of combinations) {
      await t.test(name, async () => {
        const harness = await createCoordinatorUnderTest(); const identity = primeState(harness, { macro_state: 'AWAITING_CONTROLLER', phase: null, state_version: 8, candidate: makeCandidate(), delivery: makeDelivery() });
        const pointerBefore = bytes(harness.stateStore.pointer);
        const stateBefore = structuredClone(harness.stateStore.state);
        const result = await harness.coordinator.applyControllerCommand(signed({ command_kind: 'RELEASE', payload: { squash_sha, acceptance_ref: 'acceptance-001', merge_ref: 'merge-001', archive_ref: 'archive-001', origin_main_sha, macbook_main_sha }, expected_state_version: identity.expected_state_version, expected_state_hash: identity.expected_state_hash }));
        assertExactResult(result, { operation: 'applyControllerCommand', outcome: 'REJECTED' });
        assert.deepEqual(bytes(harness.stateStore.pointer), pointerBefore, 'CAUSAL_RED: unequal signed RELEASE evidence must retain the exact active pointer bytes');
        assert.deepEqual(harness.stateStore.state, stateBefore, 'CAUSAL_RED: unequal signed RELEASE evidence must reject before State mutation');
        for (const effect of ['git.syncMainFfOnly', 'ledger.readRemote', 'ledger.prepareAppend', 'ledger.commitAndPush', 'ledger.readRemoteAppend', 'state.writeState', 'state.writePointer']) noCall(harness, effect);
      });
    }
  });

  await t.test('pointer is re-read immediately before clear and an ownership change enters manual stop without clearing', async () => {
    const harness = await createCoordinatorUnderTest(); const identity = primeState(harness, { macro_state: 'AWAITING_CONTROLLER', phase: null, state_version: 8, candidate: makeCandidate(), delivery: makeDelivery() });
    const writeState = harness.dependencies.state.writeState;
    harness.dependencies.state.writeState = async request => {
      const result = await writeState(request);
      if (result?.kind === 'OK' && request.state?.macro_state === 'CLOSED') harness.stateStore.pointer = { schema_version: '1.0', active_change_id: CHANGE_B };
      return result;
    };
    const result = await harness.coordinator.applyControllerCommand(releaseFor(identity));
    assertExactResult(result, { operation: 'applyControllerCommand', outcome: 'BLOCKED', state: 'BLOCKED' });
    assert.equal(result.payload.next_action, 'MANUAL_CONTROLLER_STOP');
    assert.equal(harness.stateStore.pointer.active_change_id, CHANGE_B, 'CAUSAL_RED: a pointer ownership change before clear must be retained');
    assert.equal(harness.count('state.writePointer'), 0, 'CAUSAL_RED: stale RELEASE ownership must never attempt pointer clear');
    const names = harness.calls.map(call => call.name);
    assert.ok(names.lastIndexOf('state.readPointer') > names.indexOf('state.writeState'), 'CAUSAL_RED: pointer ownership must be re-read after CLOSED persistence and immediately before any clear');
  });

  await t.test('first valid RELEASE syncs, appends evidence, persists CLOSED, then clears the active pointer', async () => {
    const harness = await createCoordinatorUnderTest(); const identity = primeState(harness, { macro_state: 'AWAITING_CONTROLLER', phase: null, state_version: 8, candidate: makeCandidate(), delivery: makeDelivery() });
    const result = await harness.coordinator.applyControllerCommand(releaseFor(identity));
    assertExactResult(result, { operation: 'applyControllerCommand', outcome: 'CLOSED', state: 'CLOSED' });
    reached(harness, 'git.syncMainFfOnly'); reached(harness, 'ledger.readRemoteAppend'); reached(harness, 'state.writeState'); reached(harness, 'state.writePointer');
    const names = harness.calls.map(call => call.name); const sync = names.indexOf('git.syncMainFfOnly'); const ledger = names.lastIndexOf('ledger.readRemoteAppend'); const closed = names.lastIndexOf('state.writeState'); const pointer = names.lastIndexOf('state.writePointer');
    assert.ok(sync < ledger && ledger < closed && closed < pointer, 'RELEASE must sync, append/read back Ledger, persist CLOSED, then clear pointer');
    assert.equal(harness.stateStore.pointer.active_change_id, null);
  });
  const failures = [
    ['dirty main', 'git.syncMainFfOnly', conflict('dirty-main'), 'BLOCKED', 'BLOCKED', true], ['non fast forward', 'git.syncMainFfOnly', conflict('non-fast-forward'), 'BLOCKED', 'BLOCKED', true], ['origin mismatch', 'git.syncMainFfOnly', conflict('origin-main'), 'BLOCKED', 'BLOCKED', true], ['MacBook receipt mismatch', 'verifier.verify', { kind: 'REJECTED', error_code: 'COMMAND_SIGNATURE_INVALID' }, 'REJECTED', null, true], ['squash mismatch', 'git.syncMainFfOnly', conflict('squash'), 'BLOCKED', 'BLOCKED', true], ['RELEASE Ledger append failure', 'ledger.readRemoteAppend', unavailable({ stage: 'REMOTE_RECORD_READ' }), 'BLOCKED', 'BLOCKED', true], ['CLOSED write failure', 'state.writeState', unavailable({ stage: 'CLOSED_WRITE' }), 'BLOCKED', 'BLOCKED', true], ['pointer-clear readback mismatch', 'state.writePointer', conflict('pointer-clear'), 'BLOCKED', 'BLOCKED', true],
  ];
  for (const [name, dependency, fault, outcome, state, mustReach] of failures) {
    await t.test(name, async () => {
      const harness = await createCoordinatorUnderTest(); const identity = primeState(harness, { macro_state: 'AWAITING_CONTROLLER', phase: null, state_version: 8, candidate: makeCandidate(), delivery: makeDelivery() }); harness.fault(dependency, fault);
      const result = await harness.coordinator.applyControllerCommand(releaseFor(identity));
      assertExactResult(result, { operation: 'applyControllerCommand', outcome, state }); if (mustReach) reached(harness, dependency); assert.equal(harness.stateStore.pointer.active_change_id, CHANGE_ID); if (dependency !== 'state.writePointer') noCall(harness, 'state.writePointer'); noCall(harness, 'git.pushBranch'); noCall(harness, 'pull_request.createOrReuse');
      const other = await harness.coordinator.applyControllerCommand(signed({ change_id: CHANGE_B, command_id: 'command-b', idempotency_id: 'idem-b' })); assertExactResult(other, { operation: 'applyControllerCommand', outcome: 'REJECTED', code: 'WIP_AUTHORITY_INVALID' });
    });
  }
  await t.test('CLOSED with retained pointer clears only for the exact already-persisted RELEASE', async () => {
    const seed = await createCoordinatorUnderTest(); const awaiting = primeState(seed, { macro_state: 'AWAITING_CONTROLLER', phase: null, state_version: 8, candidate: makeCandidate(), delivery: makeDelivery() });
    const originalBody = makeDispatch({ command_kind: 'RELEASE', command_id: 'release-001', idempotency_id: 'release-idem-001', receipt_digest: 'c'.repeat(64), evidence_refs: [{ kind: 'controller_receipt', id: 'release-receipt-001', sha256: 'd'.repeat(64), subject_sha: CANDIDATE_SHA }], payload: { squash_sha: CANDIDATE_SHA, acceptance_ref: 'acceptance-001', merge_ref: 'merge-001', archive_ref: 'archive-001', origin_main_sha: CANDIDATE_SHA, macbook_main_sha: CANDIDATE_SHA }, expected_state_version: awaiting.expected_state_version, expected_state_hash: awaiting.expected_state_hash });
    const originalRequest = { command_body_bytes: bytes(originalBody), signature_bytes: new Uint8Array([1, 2, 3]) };
    const makeClosed = async () => { const harness = await createCoordinatorUnderTest(); const identity = primeState(harness, { macro_state: 'CLOSED', phase: null, state_version: 9, candidate: makeCandidate(), delivery: makeDelivery(), last_controller_command_id: originalBody.command_id, evidence: { remote_tip: GIT_SHA, last_event_id: 'event-001', last_event_hash: SHA256, last_readback_sha256: sha256(originalRequest.command_body_bytes) } }); return { harness, identity }; };
    const exact = await makeClosed(); const exactResult = await exact.harness.coordinator.applyControllerCommand(originalRequest);
    const mutations = [
      ['command', body => { body.command_id = 'release-002'; }],
      ['body', body => { body.payload.archive_ref = 'archive-other'; }],
      ['idempotency', body => { body.idempotency_id = 'release-idem-002'; }],
      ['receipt', body => { body.receipt_digest = 'e'.repeat(64); }],
      ['evidence', body => { body.evidence_refs = [{ kind: 'controller_receipt', id: 'release-receipt-002', sha256: 'f'.repeat(64), subject_sha: CANDIDATE_SHA }]; }],
    ];
    const observed = [{ name: 'exact', outcome: exactResult.outcome, pointer: exact.harness.stateStore.pointer.active_change_id, sync_calls: exact.harness.count('git.syncMainFfOnly'), ledger_calls: exact.harness.count('ledger.prepareAppend') }];
    for (const [name, mutate] of mutations) {
      const { harness, identity } = await makeClosed(); const body = structuredClone(originalBody); mutate(body); body.expected_state_version = identity.expected_state_version; body.expected_state_hash = identity.expected_state_hash;
      const result = await harness.coordinator.applyControllerCommand({ command_body_bytes: bytes(body), signature_bytes: new Uint8Array([1, 2, 3]) });
      observed.push({ name, outcome: result.outcome, pointer: harness.stateStore.pointer.active_change_id, sync_calls: harness.count('git.syncMainFfOnly'), ledger_calls: harness.count('ledger.prepareAppend') });
    }
    assert.deepEqual(observed, [{ name: 'exact', outcome: 'CLOSED', pointer: null, sync_calls: 0, ledger_calls: 0 }, ...mutations.map(([name]) => ({ name, outcome: 'REJECTED', pointer: CHANGE_ID, sync_calls: 0, ledger_calls: 0 }))], 'CAUSAL_RED: only the original persisted RELEASE bytes may finish the pointer-clear crash window; every different signed RELEASE must stop without business effects');
  });
  await t.test('CLOSED with cleared pointer returns ALREADY_APPLIED without a business effect', async () => {
    const harness = await createCoordinatorUnderTest(); const identity = primeState(harness, { macro_state: 'CLOSED', phase: null, state_version: 9, candidate: makeCandidate(), delivery: makeDelivery() }); harness.stateStore.pointer.active_change_id = null;
    const result = await harness.coordinator.applyControllerCommand(releaseFor(identity)); assertExactResult(result, { operation: 'applyControllerCommand', outcome: 'ALREADY_APPLIED', state: 'CLOSED' }); noCall(harness, 'git.syncMainFfOnly'); noCall(harness, 'ledger.prepareAppend');
  });
});

test('TEST-FCR-001: canonical signed product Change admission remains pointer-first and global WIP remains one', async t => {
  const productChange = 'CHG-foundation-compatibility-repair';
  await t.test('a non-Foundation canonical product Change reaches the existing READY admission evidence', async () => {
    const harness = await createCoordinatorUnderTest();
    const result = await harness.coordinator.applyControllerCommand(signed({ change_id: productChange, command_id: 'fcr-admission-001' }));
    assertExactResult(result, { operation: 'applyControllerCommand', outcome: 'APPLIED', state: 'READY' });
    assert.equal(harness.stateStore.pointer.active_change_id, productChange, 'CAUSAL_RED: canonical signed product Change must publish its own pointer before READY');
    assert.equal(harness.stateStore.state.change_id, productChange);
    reached(harness, 'state.writePointer'); reached(harness, 'state.writeState'); reached(harness, 'ledger.readRemoteAppend');
  });
  await t.test('a second valid Change remains effect-free while the first Change owns WIP', async () => {
    const harness = await createCoordinatorUnderTest();
    const first = await harness.coordinator.applyControllerCommand(signed());
    assertExactResult(first, { operation: 'applyControllerCommand', outcome: 'APPLIED', state: 'READY' });
    const before = { pointer: harness.count('state.writePointer'), state: harness.count('state.writeState'), ledger: harness.count('ledger.prepareAppend'), worktree: harness.count('git.createOrReuseWorktree') };
    const second = await harness.coordinator.applyControllerCommand(signed({ change_id: productChange, command_id: 'fcr-second-001', idempotency_id: 'fcr-second-idem-001' }));
    assertExactResult(second, { operation: 'applyControllerCommand', outcome: 'REJECTED', code: 'WIP_AUTHORITY_INVALID' });
    assert.deepEqual({ pointer: harness.count('state.writePointer'), state: harness.count('state.writeState'), ledger: harness.count('ledger.prepareAppend'), worktree: harness.count('git.createOrReuseWorktree') }, before, 'CAUSAL_RED: second Change rejection must precede pointer, State, Ledger, or Worktree effects');
  });
});

test('TEST-FCR-002: an exact Frozen-Candidate AWAITING_CONTROLLER revision returns only to TEST_RED', async t => {
  const reviewEvidenceFor = candidate_sha => [{ kind: 'controller_decision', id: 'changes-requested-001', sha256: SHA256, subject_sha: candidate_sha }];
  const revisionFor = (context, identity, overrides = {}) => signed({
    ...context.command,
    command_kind: 'REVISION', command_id: 'fcr-revision-001', idempotency_id: 'fcr-revision-idem-001', nonce: 'D'.repeat(43) + '=',
    payload: { changes_requested_ref: 'changes-requested-001', revision_of_candidate_sha: context.candidateEvent.detail.candidate_sha, resume_phase: 'TEST_RED' },
    evidence_refs: reviewEvidenceFor(context.candidateEvent.detail.candidate_sha), expected_state_version: identity.state_version, expected_state_hash: identity.state_hash,
    ...overrides,
  });
  const effectCounts = context => ({
    state: context.gatewayEvents.filter(event => event.edge === 'START' && event.gateway === 'state' && event.method === 'writeState').length,
    ledger: context.gatewayEvents.filter(event => event.edge === 'START' && event.gateway === 'ledger' && event.method === 'prepareAppend').length,
    git: context.gatewayEvents.filter(event => event.edge === 'START' && event.gateway === 'git').length,
    pull_request: context.gatewayEvents.filter(event => event.edge === 'START' && event.gateway === 'pull_request').length,
    handoff: context.gatewayEvents.filter(event => event.edge === 'START' && event.gateway === 'handoff').length,
  });
  await t.test('matching signed decision evidence binds the exact Frozen Candidate and preserves delivery predecessor identities', async () => {
    await withObservedFrozenReview('fcr002-matching', async ({ context, awaiting }) => {
      const before = effectCounts(context);
      const result = await context.core.applyControllerCommand(revisionFor(context, awaiting));
      assertExactResult(result, { operation: 'applyControllerCommand', outcome: 'APPLIED', state: 'EXECUTING' }); assert.equal(result.payload.phase, 'TEST_RED');
      const current = await context.base.state.readState({ change_id: context.command.change_id }); assert.equal(current.kind, 'OK'); const state = JSON.parse(current.value.bytes);
      assert.deepEqual(state.authorization_cycle, { command_id: 'fcr-revision-001', command_kind: 'REVISION', auto_repair_attempt: 0 }); assert.equal(state.candidate.sha, context.candidateEvent.detail.candidate_sha); assert.deepEqual(state.delivery, { remote_head: context.candidateEvent.detail.candidate_sha });
      const after = effectCounts(context); assert.equal(after.git, before.git); assert.equal(after.pull_request, before.pull_request); assert.equal(after.handoff, before.handoff, 'the review return is a State/Ledger transition and cannot repeat Candidate, PR, or Handoff effects');
    });
  });
  await t.test('wrong Candidate-subject decision evidence rejects before State, Ledger, or Agent activity', async () => {
    await withObservedFrozenReview('fcr002-wrong-subject', async ({ context, awaiting }) => {
      const before = effectCounts(context);
      const result = await context.core.applyControllerCommand(revisionFor(context, awaiting, { evidence_refs: [{ ...reviewEvidenceFor(context.candidateEvent.detail.candidate_sha)[0], subject_sha: 'f'.repeat(40) }] }));
      assertExactResult(result, { operation: 'applyControllerCommand', outcome: 'REJECTED' }); assert.deepEqual(effectCounts(context), before, 'CAUSAL_RED: non-Candidate decision evidence must reject before durable, Agent, Git, PR, or Handoff effects');
    });
  });
  await t.test('same accepted DISPATCH and Frozen Candidate identities reject every valid-but-mismatched review return', async () => {
    const cases = [
      ['repository', body => { body.repository.canonical_root = '/tmp/other-repository'; }, null],
      ['worktree root', body => { body.worktree.root = '/tmp/other-worktree'; }, null],
      ['branch', body => { body.worktree.branch = 'work/mac-mini/other'; }, null],
      ['baseline', body => { body.worktree.baseline_sha = CANDIDATE_SHA; }, null],
      ['scope', body => { body.scope.allowed_paths = ['tools/harness/change-coordinator/other.mjs']; }, null],
      ['unfrozen Candidate', null, state => { state.candidate.frozen = false; }],
      ['Validator Head', null, state => { state.candidate.validator_head = GIT_SHA; }],
      ['remote Head', null, state => { state.delivery.remote_head = GIT_SHA; }],
      ['PR Head', null, state => { state.delivery.pull_request.head_sha = GIT_SHA; }],
    ];
    for (const [name, mutateBody, mutateState] of cases) {
      await withObservedFrozenReview(`fcr002-mismatch-${name}`, async ({ context, awaiting }) => {
        let identity = awaiting;
        if (mutateState) {
          const current = await context.base.state.readState({ change_id: context.command.change_id }); assert.equal(current.kind, 'OK'); const state = JSON.parse(current.value.bytes); mutateState(state); const next_bytes = canonicalJson(state);
          const written = await context.base.state.writeState({ change_id: context.command.change_id, expected_version: state.state_version, expected_sha256: current.value.sha256, state, next_bytes }); assert.equal(written.kind, 'OK'); identity = { state_version: state.state_version, state_hash: sha256(next_bytes) };
        }
        const request = revisionFor(context, identity); const body = JSON.parse(Buffer.from(request.command_body_bytes).toString('utf8')); if (mutateBody) mutateBody(body);
        const before = effectCounts(context); const result = await context.core.applyControllerCommand({ command_body_bytes: bytes(body), signature_bytes: request.signature_bytes });
        assertExactResult(result, { operation: 'applyControllerCommand', outcome: 'REJECTED' }, `CAUSAL_RED: ${name}`); assert.deepEqual(effectCounts(context), before, `CAUSAL_RED: ${name} must reject before durable, Agent, Git, PR, or Handoff mutation`);
      });
    }
  });
  await t.test('a revision naming any Candidate other than the Frozen Candidate rejects before State or Ledger mutation', async () => {
    await withObservedFrozenReview('fcr002-wrong-candidate', async ({ context, awaiting }) => {
      const request = revisionFor(context, awaiting); const body = JSON.parse(Buffer.from(request.command_body_bytes).toString('utf8')); body.payload.revision_of_candidate_sha = 'e'.repeat(40);
      const before = effectCounts(context); const result = await context.core.applyControllerCommand({ command_body_bytes: bytes(body), signature_bytes: request.signature_bytes });
      assertExactResult(result, { operation: 'applyControllerCommand', outcome: 'REJECTED' }); assert.deepEqual(effectCounts(context), before, 'CAUSAL_RED: mismatched revision Candidate cannot consume the exact Frozen Candidate review return');
    });
  });
  await t.test('an empty changes-requested reference cannot match an empty evidence identity or authorize revision effects', async () => {
    await withObservedFrozenReview('fcr002-empty-reference', async ({ context, awaiting }) => {
      const request = revisionFor(context, awaiting); const body = JSON.parse(Buffer.from(request.command_body_bytes).toString('utf8')); body.payload.changes_requested_ref = ''; body.evidence_refs = [{ ...reviewEvidenceFor(context.candidateEvent.detail.candidate_sha)[0], id: '' }];
      const before = effectCounts(context); const result = await context.core.applyControllerCommand({ command_body_bytes: bytes(body), signature_bytes: request.signature_bytes });
      assert.deepEqual({ outcome: result.outcome, error_code: result.error_code, effects: effectCounts(context) }, { outcome: 'REJECTED', error_code: 'INPUT_INVALID', effects: before }, 'CAUSAL_RED: empty Controller decision identities cannot satisfy REVISION evidence binding or mutate durable state');
    });
  });
});

test('TEST-FCR-003: later Candidates use the durable local parent and publication preserves first-versus-update boundaries', async t => {
  const revisionFor = (context, identity) => signed({
    ...context.command, command_kind: 'REVISION', command_id: 'fcr003-revision-001', idempotency_id: 'fcr003-revision-idem-001', nonce: 'E'.repeat(43) + '=',
    payload: { changes_requested_ref: 'changes-requested-003', revision_of_candidate_sha: context.candidateEvent.detail.candidate_sha, resume_phase: 'TEST_RED' },
    evidence_refs: [{ kind: 'controller_decision', id: 'changes-requested-003', sha256: SHA256, subject_sha: context.candidateEvent.detail.candidate_sha }], expected_state_version: identity.state_version, expected_state_hash: identity.state_hash,
  });
  const settleRevisedRole = async (context, action, suffix, afterStarted = null) => {
    const { action_kind, ...binding } = action.payload.action; assert.equal(action_kind, 'LAUNCH_AGENT');
    const started = await context.core.settlement({ change_id: context.command.change_id, expected_state_version: action.state_version, expected_state_hash: action.state_hash, settlement: { ...binding, stage: 'STARTED', observed_child_id: `fcr003-${suffix}` } }); assertExactResult(started, { operation: 'settlement', outcome: 'WAITING', state: 'EXECUTING' });
    if (afterStarted) await afterStarted();
    const artifact_bytes = Buffer.from(canonicalJson({ status: 'PASS' })); const artifact_path = path.join(context.fixtureRoot, 'ordinary-role-results', `${binding.correlation_id}.fcr003-${suffix}.json`); await mkdir(path.dirname(artifact_path), { recursive: true }); await writeFile(artifact_path, artifact_bytes);
    return context.core.settlement({ change_id: context.command.change_id, expected_state_version: started.state_version, expected_state_hash: started.state_hash, settlement: { ...binding, stage: 'RESULT', observed_child_id: `fcr003-${suffix}`, status: 'PASS', artifact_path, artifact_sha256: sha256(artifact_bytes) } });
  };
  const withRevisedCandidate = async (suffix, continuation, controls = {}) => {
    await withObservedFrozenReview(`fcr003-${suffix}`, async ({ context, awaiting }) => {
      const revision = await context.core.applyControllerCommand(revisionFor(context, awaiting)); assertExactResult(revision, { operation: 'applyControllerCommand', outcome: 'APPLIED', state: 'EXECUTING' }); assert.equal(revision.payload.phase, 'TEST_RED');
      const testAction = await context.core.run({ change_id: context.command.change_id, expected_state_version: revision.state_version, expected_state_hash: revision.state_hash }); assertExactResult(testAction, { operation: 'run', outcome: 'AGENT_ACTION', state: 'EXECUTING' }); assert.equal(testAction.payload.action.role, 'juaner_test');
      const afterTest = await settleRevisedRole(context, testAction, `${suffix}-test`); assertExactResult(afterTest, { operation: 'settlement', outcome: 'ADVANCED', state: 'EXECUTING' }); assert.equal(afterTest.payload.to_phase, 'WORKER_GREEN');
      const workerAction = await context.core.run({ change_id: context.command.change_id, expected_state_version: afterTest.state_version, expected_state_hash: afterTest.state_hash }); assertExactResult(workerAction, { operation: 'run', outcome: 'AGENT_ACTION', state: 'EXECUTING' }); assert.equal(workerAction.payload.action.role, 'juaner_worker');
      const afterWorker = await settleRevisedRole(context, workerAction, `${suffix}-worker`, async () => writeFile(path.join(context.coreWorktree, 'tracked.txt'), `revised Worker bytes for ${suffix}\n`)); assertExactResult(afterWorker, { operation: 'settlement', outcome: 'ADVANCED', state: 'EXECUTING' }); assert.equal(afterWorker.payload.to_phase, 'REGRESSION');
      const regression = await context.core.run({ change_id: context.command.change_id, expected_state_version: afterWorker.state_version, expected_state_hash: afterWorker.state_hash }); assertExactResult(regression, { operation: 'run', outcome: 'ADVANCED', state: 'DELIVERING' }); assert.equal(regression.payload.to_phase, 'STAGE');
      const candidateTransition = await context.core.run({ change_id: context.command.change_id, expected_state_version: regression.state_version, expected_state_hash: regression.state_hash }); assertExactResult(candidateTransition, { operation: 'run', outcome: 'ADVANCED', state: 'DELIVERING' }); assert.equal(candidateTransition.payload.to_phase, 'FINAL_VALIDATION');
      const remote = await readLocalLedger(context.primaryLedger, context.command.change_id); assert.equal(remote.kind, 'OK'); const candidateEvent = Buffer.from(remote.value.ledger_bytes_base64, 'base64').subarray(0, -1).toString('utf8').split('\n').map(line => JSON.parse(line)).at(-1); assert.equal(candidateEvent.event_class, 'CANDIDATE_COMMITTED'); assert.equal(candidateEvent.detail.parent, context.candidateEvent.detail.candidate_sha);
      await continuation({ context: { ...context, candidateTransition, candidateEvent }, revision, regression, candidateTransition, candidateEvent });
    }, controls);
  };
  await t.test('STAGE binds inspectWorktree and stageExact to the baseline first Candidate or durable prior Candidate', async () => {
    await withObservedK1Prefix(async context => {
      const staged = context.gatewayEvents.find(event => event.edge === 'START' && event.gateway === 'git' && event.method === 'stageExact'); const inspected = context.gatewayEvents.filter(event => event.edge === 'START' && event.gateway === 'git' && event.method === 'inspectWorktree' && event.sequence < staged.sequence).at(-1); assert.equal(inspected.request.expected_branch, context.command.worktree.branch); assert.equal(inspected.request.expected_head, context.expectedSubject.head_sha); assert.equal(staged.request.subject.head_sha, context.expectedSubject.head_sha);
    });
    await withRevisedCandidate('later-stage', async ({ context }) => {
      const staged = context.gatewayEvents.filter(event => event.edge === 'START' && event.gateway === 'git' && event.method === 'stageExact').at(-1); const inspected = context.gatewayEvents.filter(event => event.edge === 'START' && event.gateway === 'git' && event.method === 'inspectWorktree' && event.sequence < staged.sequence).at(-1);
      assert.equal(inspected.request.expected_branch, context.command.worktree.branch); assert.equal(inspected.request.expected_head, context.candidateEvent.detail.parent); assert.equal(staged.request.subject.head_sha, context.candidateEvent.detail.parent, 'CAUSAL_RED: the later STAGE cycle binds inspection and staging to its exact durable local Candidate predecessor');
    });
  });
  await t.test('a later Candidate commit binds the exact durable prior Candidate rather than baseline', async () => {
    await withRevisedCandidate('later-commit', async ({ context, candidateEvent }) => {
      const commit = context.gatewayEvents.filter(event => event.edge === 'START' && event.gateway === 'git' && event.method === 'commitCandidate').at(-1); const read = context.gatewayEvents.filter(event => event.edge === 'COMPLETE' && event.gateway === 'git' && event.method === 'readCommit').at(-1);
      assert.equal(commit.request.expected_parent, candidateEvent.detail.parent, 'CAUSAL_RED: a revision Candidate must parent the durable prior local Candidate, never baseline'); assert.equal(read.result.value.parent, candidateEvent.detail.parent); assert.notEqual(candidateEvent.detail.parent, context.command.worktree.baseline_sha);
    });
  });
  await t.test('a published branch reads the exact old remote Head before its non-force update', async () => {
    await withRevisedCandidate('published-branch', async ({ context }) => {
      const { validatorPass } = await settleOrdinaryValidatorForBoundary(context, 'fcr003-published-branch'); const frontier = context.gatewayEvents.at(-1).sequence; const pushed = await context.core.run({ change_id: context.command.change_id, expected_state_version: validatorPass.state_version, expected_state_hash: validatorPass.state_hash }); assertExactResult(pushed, { operation: 'run', outcome: 'ADVANCED', state: 'DELIVERING' }); assert.equal(pushed.payload.to_phase, 'CANDIDATE_FREEZE');
      const cycle = context.gatewayEvents.filter(event => event.sequence > frontier && event.edge === 'START' && event.gateway === 'git'); const push = cycle.find(event => event.method === 'pushBranch'); const read = cycle.find(event => event.method === 'readRemoteBranch'); assert.ok(push && read && push.sequence < read.sequence, 'CAUSAL_RED: this Candidate cycle uses the production push boundary, then its independent post-push readback'); assert.equal(push.request.expected_remote_head, context.candidateEvent.detail.parent); const pushComplete = context.gatewayEvents.find(event => event.edge === 'COMPLETE' && event.invocation === push.invocation); const readComplete = context.gatewayEvents.find(event => event.edge === 'COMPLETE' && event.invocation === read.invocation); assert.ok(pushComplete && readComplete); assert.equal(pushComplete.actual_result.kind, 'OK'); assert.equal(pushComplete.actual_result.value.prior_remote_head, push.request.expected_remote_head); assert.equal(pushComplete.actual_result.value.remote_head, context.candidateEvent.detail.candidate_sha); assert.equal(pushComplete.actual_result.value.forced, false); assert.equal(pushComplete.actual_result.value.deleted, false); assert.equal(readComplete.actual_result.kind, 'OK'); assert.equal(readComplete.actual_result.value.remote_head, pushComplete.actual_result.value.remote_head, 'the same cycle independently reads back the exact non-force pushed remote Head');
    });
  });
  await t.test('a mismatched old remote Head blocks inside the production branch transport without physical push', async () => {
    await withRevisedCandidate('remote-mismatch', async ({ context }) => {
      const { validatorPass } = await settleOrdinaryValidatorForBoundary(context, 'fcr003-remote-mismatch'); const frontier = context.gatewayEvents.at(-1).sequence;
      const moveRemote = await run(GIT, ['--git-dir', context.deliveryRemote, 'update-ref', `refs/heads/${context.command.worktree.branch}`, context.fixture.baseline_sha], { cwd: context.fixtureRoot, env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' } }); assert.equal(moveRemote.code, 0, moveRemote.stderr);
      const result = await context.core.run({ change_id: context.command.change_id, expected_state_version: validatorPass.state_version, expected_state_hash: validatorPass.state_hash }); assertExactResult(result, { operation: 'run', outcome: 'BLOCKED', state: 'BLOCKED' }); assert.equal(result.payload.blocked_reason, 'BRANCH_PUSH_AMBIGUOUS');
      const push = context.gatewayEvents.find(event => event.sequence > frontier && event.edge === 'START' && event.gateway === 'git' && event.method === 'pushBranch'); const pushResult = context.gatewayEvents.find(event => event.edge === 'COMPLETE' && event.invocation === push?.invocation); assert.ok(push && pushResult); assert.notEqual(push.request.expected_remote_head, context.fixture.baseline_sha, 'the physically faulted remote head differs from this Candidate cycle predecessor'); assert.equal(pushResult.actual_result.kind, 'CONFLICT'); assert.equal(pushResult.actual_result.observed_identity, context.fixture.baseline_sha, 'the production branch transport observes the real conflicting bare-remote head'); assert.equal(context.gatewayEvents.filter(event => event.sequence > frontier && event.edge === 'COMPLETE' && event.gateway === 'git' && event.method === 'pushBranch' && event.actual_result.kind === 'CONFLICT').length, 1, 'the fault window contains one exact transport conflict');
      const remote = await run(GIT, ['--git-dir', context.deliveryRemote, 'rev-parse', `refs/heads/${context.command.worktree.branch}`], { cwd: context.fixtureRoot, env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' } }); assert.equal(remote.code, 0, remote.stderr); assert.equal(remote.stdout.trim(), context.fixture.baseline_sha, 'the rejected push leaves the physical remote unchanged'); assert.equal(context.gatewayEvents.some(event => event.sequence > frontier && event.edge === 'START' && (event.gateway === 'pull_request' || event.gateway === 'handoff')), false, 'the real remote conflict reaches neither PR nor Handoff');
      const counts = { push: context.gatewayEvents.filter(event => event.edge === 'START' && event.gateway === 'git' && event.method === 'pushBranch').length, remote: remote.stdout.trim(), pull_requests: context.gatewayEvents.filter(event => event.edge === 'START' && event.gateway === 'pull_request').length, handoffs: context.gatewayEvents.filter(event => event.edge === 'START' && event.gateway === 'handoff').length }; const replay = await context.core.run({ change_id: context.command.change_id, expected_state_version: result.state_version, expected_state_hash: result.state_hash }); assertExactResult(replay, { operation: 'run', outcome: 'BLOCKED', state: 'BLOCKED' }); assert.deepEqual({ push: context.gatewayEvents.filter(event => event.edge === 'START' && event.gateway === 'git' && event.method === 'pushBranch').length, remote: (await run(GIT, ['--git-dir', context.deliveryRemote, 'rev-parse', `refs/heads/${context.command.worktree.branch}`], { cwd: context.fixtureRoot, env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' } })).stdout.trim(), pull_requests: context.gatewayEvents.filter(event => event.edge === 'START' && event.gateway === 'pull_request').length, handoffs: context.gatewayEvents.filter(event => event.edge === 'START' && event.gateway === 'handoff').length }, counts, 'the durable physical remote conflict cannot replay, overwrite the branch, or reach PR/Handoff');
    });
  });
  await t.test('a null remote predecessor retains first normal push and only post-push readback', async () => {
    await withObservedK1Prefix(async context => {
      const { validatorPass } = await settleOrdinaryValidatorForBoundary(context, 'fcr003-first-publication'); const before = context.gatewayEvents.length; const result = await context.core.run({ change_id: context.command.change_id, expected_state_version: validatorPass.state_version, expected_state_hash: validatorPass.state_hash }); assertExactResult(result, { operation: 'run', outcome: 'ADVANCED', state: 'DELIVERING' }); const events = context.gatewayEvents.slice(before).filter(event => event.edge === 'START' && event.gateway === 'git'); assert.deepEqual(events.map(event => event.method), ['pushBranch', 'readRemoteBranch'], 'CAUSAL_RED: first publication has no pre-push remote-absence gateway and reads only after normal push');
    });
  });
  await t.test('a current existing PR is reused for the new Candidate Head without replacement creation', async () => {
    let laterCandidate = null; const pulls = [];
    const pull_request = {
      async queryCurrent(request) { pulls.push({ method: 'queryCurrent', request: structuredClone(request) }); return laterCandidate === null ? absent({ repository: request.repository, base: request.base, head_branch: request.head_branch }) : ok({ number: 250, url: 'https://invalid.example/pr/250', base: request.base, head_branch: request.head_branch, head_sha: laterCandidate, review_ready: true }); },
      async createOrReuse(request) { pulls.push({ method: 'createOrReuse', request: structuredClone(request) }); return ok({ number: 250, url: 'https://invalid.example/pr/250', base: request.base, head_branch: request.head_branch, head_sha: request.head_sha, review_ready: true }); },
      async readback(request) { pulls.push({ method: 'readback', request: structuredClone(request) }); return ok({ number: request.number, url: 'https://invalid.example/pr/250', base: 'main', head_branch: 'work/mac-mini/m2-regression', head_sha: request.expected_head, review_ready: true }); },
    };
    await withRevisedCandidate('current-pr-reuse', async ({ context }) => {
      laterCandidate = context.candidateEvent.detail.candidate_sha; const { validatorPass } = await settleOrdinaryValidatorForBoundary(context, 'fcr003-current-pr-reuse'); const pushed = await context.core.run({ change_id: context.command.change_id, expected_state_version: validatorPass.state_version, expected_state_hash: validatorPass.state_hash }); assert.equal(pushed.payload.to_phase, 'CANDIDATE_FREEZE'); const frozen = await context.core.run({ change_id: context.command.change_id, expected_state_version: pushed.state_version, expected_state_hash: pushed.state_hash }); assert.equal(frozen.payload.to_phase, 'PR');
      const createsBefore = pulls.filter(entry => entry.method === 'createOrReuse').length; const result = await context.core.run({ change_id: context.command.change_id, expected_state_version: frozen.state_version, expected_state_hash: frozen.state_hash }); assertExactResult(result, { operation: 'run', outcome: 'ADVANCED', state: 'DELIVERING' }); assert.equal(result.payload.to_phase, 'HANDOFF'); assert.equal(pulls.filter(entry => entry.method === 'createOrReuse').length, createsBefore, 'CAUSAL_RED: the current matching PR is reused without replacement creation'); const readback = pulls.at(-1); assert.equal(readback.method, 'readback'); assert.equal(readback.request.expected_head, laterCandidate);
    }, { pull_request });
  });
});

test('TEST-FCR-004: settlements are the four canonical variants and NOT_STARTED is Coordinator-only before REQUESTED', async t => {
  const actionFor = async harness => {
    const action = await dispatchToTest(harness);
    assertExactResult(action, { operation: 'run', outcome: 'AGENT_ACTION', state: 'EXECUTING' });
    const { action_kind, ...binding } = action.payload.action;
    return { action, binding };
  };
  await t.test('REQUESTED is durable before the canonical STARTED and RESULT progression', async () => {
    const harness = await createCoordinatorUnderTest(); const { action, binding } = await actionFor(harness);
    const requested = harness.calls.find(call => call.name === 'ledger.prepareAppend' && call.request.event_class === 'AGENT_RUN' && call.request.detail.stage === 'REQUESTED' && call.request.detail.correlation_id === binding.correlation_id && call.request.detail.role === binding.role && call.request.detail.phase === binding.phase);
    assert.deepEqual(requested?.request.detail, { ...binding, stage: 'REQUESTED' }, 'REQUESTED retains the complete closed AgentBinding rather than the legacy four-field subset');
    const started = await harness.coordinator.settlement({ change_id: CHANGE_ID, expected_state_version: action.state_version, expected_state_hash: action.state_hash, settlement: { ...binding, stage: 'STARTED', observed_child_id: 'fcr-started-child' } });
    assertExactResult(started, { operation: 'settlement', outcome: 'WAITING', state: 'EXECUTING' });
    const result = await harness.coordinator.settlement({ change_id: CHANGE_ID, expected_state_version: started.state_version, expected_state_hash: started.state_hash, settlement: { ...binding, stage: 'RESULT', observed_child_id: 'fcr-started-child', status: 'PASS', artifact_path: 'outputs/fcr-result.md', artifact_sha256: SHA256 } });
    assertExactResult(result, { operation: 'settlement', outcome: 'ADVANCED', state: 'EXECUTING' });
  });
  await t.test('all canonical START_FAILED codes and INTERRUPTED reason codes settle through their existing stop boundaries', async () => {
    const observed = []; const expected = [];
    for (const [stage, field, codes] of [
      ['START_FAILED', 'failure_code', ['SPAWN_REJECTED', 'ROUTE_UNAVAILABLE', 'SANDBOX_UNAVAILABLE', 'START_TIMEOUT']],
      ['INTERRUPTED', 'reason_code', ['USER_INTERRUPTED', 'HOST_INTERRUPTED', 'AGENT_EXITED', 'RESULT_UNREADABLE']],
    ]) for (const code of codes) {
      const harness = await createCoordinatorUnderTest(); const { action, binding } = await actionFor(harness);
      const settlement = { ...binding, stage, [field]: code, ...(stage === 'INTERRUPTED' ? { observed_child_id: null } : {}) };
      const result = await harness.coordinator.settlement({ change_id: CHANGE_ID, expected_state_version: action.state_version, expected_state_hash: action.state_hash, settlement });
      const detail = harness.calls.filter(call => call.name === 'ledger.prepareAppend' && call.request.event_class === 'AGENT_RUN').at(-1)?.request.detail ?? null;
      observed.push({ stage, code, outcome: result.outcome, state: result.state, reason: result.payload?.blocked_reason ?? null, detail });
      expected.push({ stage, code, outcome: 'BLOCKED', state: 'BLOCKED', reason: stage === 'START_FAILED' ? 'AGENT_START_FAILED' : 'AGENT_INTERRUPTED', detail: { ...binding, stage, observed_child_id: null, [field]: code } });
    }
    assert.deepEqual(observed, expected, 'CAUSAL_RED: only canonical START_FAILED and INTERRUPTED closed enums and exact Ledger details may settle');
  });
  await t.test('START_FAILED rejects extra and legacy settlement shapes without clearing the pending Agent', async () => {
    const cases = [
      ['extra observed child identity', binding => ({ ...binding, stage: 'START_FAILED', observed_child_id: null, failure_code: 'SPAWN_REJECTED' })],
      ['extra unexpected field', binding => ({ ...binding, stage: 'START_FAILED', failure_code: 'SPAWN_REJECTED', unexpected: true })],
      ['legacy failure code and shape', binding => ({ ...binding, stage: 'START_FAILED', failure_code: 'SPAWN_FAILED' })],
    ];
    for (const [name, build] of cases) {
      const harness = await createCoordinatorUnderTest(); const { action, binding } = await actionFor(harness);
      const result = await harness.coordinator.settlement({ change_id: CHANGE_ID, expected_state_version: action.state_version, expected_state_hash: action.state_hash, settlement: build(binding) });
      assertExactResult(result, { operation: 'settlement', outcome: 'REJECTED', code: 'SETTLEMENT_INVALID' }, `CAUSAL_RED: ${name}`);
      assert.equal(harness.stateStore.state.pending_agent?.correlation_id, binding.correlation_id, `CAUSAL_RED: ${name} cannot clear the pending Agent`);
    }
  });
  await t.test('START_FAILED rejects a wrong subject identity before AGENT_RUN or State mutation', async () => {
    const harness = await createCoordinatorUnderTest(); const { action, binding } = await actionFor(harness);
    const before = {
      agent: harness.calls.filter(call => call.name === 'ledger.prepareAppend' && call.request.event_class === 'AGENT_RUN').length,
      state: harness.count('state.writeState'),
    };
    const result = await harness.coordinator.settlement({
      change_id: CHANGE_ID,
      expected_state_version: action.state_version,
      expected_state_hash: action.state_hash,
      settlement: { ...binding, subject_sha: CANDIDATE_SHA, stage: 'START_FAILED', failure_code: 'SPAWN_REJECTED' },
    });
    assert.deepEqual({
      outcome: result.outcome,
      error_code: result.error_code,
      pending_correlation_id: harness.stateStore.state.pending_agent?.correlation_id ?? null,
      agent_events: harness.calls.filter(call => call.name === 'ledger.prepareAppend' && call.request.event_class === 'AGENT_RUN').length,
      state_writes: harness.count('state.writeState'),
    }, {
      outcome: 'REJECTED',
      error_code: 'SETTLEMENT_INVALID',
      pending_correlation_id: binding.correlation_id,
      agent_events: before.agent,
      state_writes: before.state,
    }, 'CAUSAL_RED: wrong-subject START_FAILED cannot append AGENT_RUN, block, or clear the pending Agent');
  });
  await t.test('legacy NOT_STARTED settlement is rejected without clearing the pending Agent', async () => {
    const harness = await createCoordinatorUnderTest(); const { action, binding } = await actionFor(harness);
    const result = await harness.coordinator.settlement({ change_id: CHANGE_ID, expected_state_version: action.state_version, expected_state_hash: action.state_hash, settlement: { ...binding, stage: 'NOT_STARTED', precondition_code: 'PRECONDITION_UNMET' } });
    assertExactResult(result, { operation: 'settlement', outcome: 'REJECTED', code: 'SETTLEMENT_INVALID' });
    assert.equal(harness.stateStore.state.pending_agent?.correlation_id, binding.correlation_id, 'CAUSAL_RED: NOT_STARTED is never a host settlement');
  });
  await t.test('a real Worktree pre-request failure records exact Coordinator NOT_STARTED without REQUESTED or AGENT_ACTION', async () => {
    const harness = await createCoordinatorUnderTest();
    const identity = await harness.coordinator.applyControllerCommand(signed());
    assertExactResult(identity, { operation: 'applyControllerCommand', outcome: 'APPLIED', state: 'READY' });
    harness.fault('git.inspectWorktree', { kind: 'OK', value: { worktree_root: '/tmp/dtf-worktree', branch: 'work/mac-mini/dtf', head_sha: GIT_SHA, common_git_dir: '/tmp/dtf-repo/.git', status_entries: [{ path: 'untracked' }], clean: false } });
    const result = await harness.coordinator.run({ change_id: CHANGE_ID, expected_state_version: identity.state_version, expected_state_hash: identity.state_hash });
    assertExactResult(result, { operation: 'run', outcome: 'BLOCKED', state: 'BLOCKED' });
    const agentAppendCalls = harness.calls.filter(call => call.name === 'ledger.prepareAppend' && call.request.event_class === 'AGENT_RUN');
    const agentEvents = agentAppendCalls.map(call => call.request.detail);
    assert.equal(agentEvents.length, 1, 'CAUSAL_RED: a real pre-request failure appends exactly one NOT_STARTED fact and no REQUESTED fact');
    const detail = agentEvents[0];
    assert.deepEqual(Object.keys(detail ?? {}).sort(), ['agent', 'allowed_paths', 'brief_sha256', 'evaluation_id', 'idempotency_id', 'input_sha256', 'model', 'output_schema_sha256', 'phase', 'reason_code', 'reasoning', 'role', 'sandbox', 'stage', 'state_version', 'subject_sha'].sort(), 'CAUSAL_RED: NOT_STARTED has the canonical closed detail shape without correlation or child identity');
    assert.deepEqual({ stage: detail?.stage, role: detail?.role, agent: detail?.agent, model: detail?.model, reasoning: detail?.reasoning, sandbox: detail?.sandbox, allowed_paths: detail?.allowed_paths, phase: detail?.phase, state_version: detail?.state_version, brief_sha256: detail?.brief_sha256, input_sha256: detail?.input_sha256, output_schema_sha256: detail?.output_schema_sha256, subject_sha: detail?.subject_sha, reason_code: detail?.reason_code }, { stage: 'NOT_STARTED', role: 'juaner_spec', agent: 'juaner_spec', model: 'gpt-5.6-terra', reasoning: 'high', sandbox: 'workspace-write', allowed_paths: ['openspec/changes/dual-device-transition-foundation/**'], phase: 'SPEC', state_version: identity.state_version, brief_sha256: SHA256, input_sha256: SHA256, output_schema_sha256: SHA256, subject_sha: GIT_SHA, reason_code: 'PRECONDITION_FAILED' });
    assert.equal(typeof detail?.evaluation_id, 'string'); assert.ok(detail.evaluation_id.length > 0); assert.equal(typeof detail?.idempotency_id, 'string'); assert.ok(detail.idempotency_id.length > 0);
    assert.deepEqual(agentEvents.map(event => event.stage), ['NOT_STARTED'], 'the current producer emits no REQUESTED replacement alongside the closed precondition fact');
    const appendIndex = harness.calls.indexOf(agentAppendCalls[0]); const commitIndex = harness.calls.findIndex((call, index) => index > appendIndex && call.name === 'ledger.commitAndPush'); const readbackIndex = harness.calls.findIndex((call, index) => index > commitIndex && call.name === 'ledger.readRemoteAppend'); assert.ok(appendIndex >= 0 && commitIndex > appendIndex && readbackIndex > commitIndex, 'the existing Ledger consumer commits and reads back the NOT_STARTED producer event before the public stop');
    assert.equal(result.payload.action, undefined, 'CAUSAL_RED: pre-request failure cannot return AGENT_ACTION');
  });
});

test('TEST-PCRR-001: public Spec FAIL settles SPEC_FAILURE, remains manually stopped, and cannot enter nullable-Candidate REVISION', async () => {
  const harness = await createCoordinatorUnderTest();
  const dispatch = await harness.coordinator.applyControllerCommand(signed());
  const action = await harness.coordinator.run({ change_id: CHANGE_ID, expected_state_version: dispatch.state_version, expected_state_hash: dispatch.state_hash });
  const failed = await settle(harness, action, 'FAIL', 'pcrr-spec-fail');
  const status = await publicStatus(harness);
  const repeated = await harness.coordinator.run({ change_id: CHANGE_ID, expected_state_version: failed.state_version, expected_state_hash: failed.state_hash });
  const effects = revisionEffects(harness);
  const revision = await harness.coordinator.applyControllerCommand(revisionFor(failed));
  assert.deepEqual({
    failed: { outcome: failed.outcome, state: failed.state, reason: failed.payload?.blocked_reason, next_action: failed.payload?.next_action },
    status: { state: status.state, phase: status.payload.phase, pending_action: status.payload.pending_action, candidate: status.payload.candidate, delivery: status.payload.delivery },
    repeated: { outcome: repeated.outcome, reason: repeated.payload?.blocked_reason, next_action: repeated.payload?.next_action },
    revision: { outcome: revision.outcome, error_code: revision.error_code },
    effects_unchanged: revisionEffects(harness),
  }, {
    failed: { outcome: 'BLOCKED', state: 'BLOCKED', reason: 'SPEC_FAILURE', next_action: 'MANUAL_CONTROLLER_STOP' },
    status: { state: 'BLOCKED', phase: null, pending_action: null, candidate: null, delivery: null },
    repeated: { outcome: 'BLOCKED', reason: 'SPEC_FAILURE', next_action: 'MANUAL_CONTROLLER_STOP' },
    revision: { outcome: 'REJECTED', error_code: 'STATE_CONFLICT' },
    effects_unchanged: effects,
  }, 'PCRR-AC-001-01/002-03: Spec FAIL is a frozen-Spec Controller stop, never a correction source');
});

test('TEST-PCRR-002: public Test FAIL freezes production until a signed classified same-scope nullable-Candidate REVISION returns to TEST_RED', async () => {
  const harness = await createCoordinatorUnderTest();
  const action = await dispatchToTest(harness);
  assert.equal(action.payload.action.role, 'juaner_test');
  const failed = await settle(harness, action, 'FAIL', 'pcrr-test-fail');
  const blockedStatus = await publicStatus(harness);
  const revision = await harness.coordinator.applyControllerCommand(revisionFor(failed));
  const afterStatus = await publicStatus(harness);
  const next = await harness.coordinator.run({ change_id: CHANGE_ID, expected_state_version: revision.state_version, expected_state_hash: revision.state_hash });
  assert.deepEqual({
    failed: { outcome: failed.outcome, state: failed.state, reason: failed.payload?.blocked_reason, next_action: failed.payload?.next_action },
    blocked: { state: blockedStatus.state, phase: blockedStatus.payload.phase, pending_action: blockedStatus.payload.pending_action, candidate: blockedStatus.payload.candidate, delivery: blockedStatus.payload.delivery },
    revision: { outcome: revision.outcome, state: revision.state, phase: revision.payload?.phase },
    after: { state: afterStatus.state, phase: afterStatus.payload.phase, pending_action: afterStatus.payload.pending_action, candidate: afterStatus.payload.candidate, delivery: afterStatus.payload.delivery },
    next: { outcome: next.outcome, state: next.state, role: next.payload?.action?.role ?? null, phase: next.payload?.action?.phase ?? null },
    production_effects: { worker: harness.count('git.stageExact'), regression: harness.count('validation.execute'), candidate: harness.count('git.commitCandidate') },
  }, {
    failed: { outcome: 'BLOCKED', state: 'BLOCKED', reason: 'TEST_CAUSAL_RED_UNAVAILABLE', next_action: 'MANUAL_CONTROLLER_STOP' },
    blocked: { state: 'BLOCKED', phase: null, pending_action: null, candidate: null, delivery: null },
    revision: { outcome: 'APPLIED', state: 'EXECUTING', phase: 'TEST_RED' },
    after: { state: 'EXECUTING', phase: 'TEST_RED', pending_action: null, candidate: null, delivery: null },
    next: { outcome: 'AGENT_ACTION', state: 'EXECUTING', role: 'juaner_test', phase: 'TEST_RED' },
    production_effects: { worker: 0, regression: 0, candidate: 0 },
  }, 'PCRR-AC-001-02/002-01: only an externally classified signed Test-asset correction re-enters Test RED');
});

test('TEST-PCRR-003: public Worker FAIL exposes REVISION and re-establishes Test RED before another Worker attempt', async () => {
  const harness = await createCoordinatorUnderTest();
  const action = await dispatchToWorker(harness);
  assert.equal(action.payload.action.role, 'juaner_worker');
  const failed = await settle(harness, action, 'FAIL', 'pcrr-worker-fail');
  const blockedStatus = await publicStatus(harness);
  const revision = await harness.coordinator.applyControllerCommand(revisionFor(failed));
  const afterStatus = await publicStatus(harness);
  const next = await harness.coordinator.run({ change_id: CHANGE_ID, expected_state_version: revision.state_version, expected_state_hash: revision.state_hash });
  assert.deepEqual({
    failed: { outcome: failed.outcome, state: failed.state, reason: failed.payload?.blocked_reason, next_action: failed.payload?.next_action },
    blocked: { state: blockedStatus.state, phase: blockedStatus.payload.phase, pending_action: blockedStatus.payload.pending_action, candidate: blockedStatus.payload.candidate, delivery: blockedStatus.payload.delivery },
    revision: { outcome: revision.outcome, state: revision.state, phase: revision.payload?.phase },
    after: { state: afterStatus.state, phase: afterStatus.payload.phase, pending_action: afterStatus.payload.pending_action, candidate: afterStatus.payload.candidate, delivery: afterStatus.payload.delivery },
    next: { outcome: next.outcome, state: next.state, role: next.payload?.action?.role ?? null, phase: next.payload?.action?.phase ?? null },
    forbidden_progress: { regression: harness.count('validation.execute'), candidate: harness.count('git.commitCandidate'), delivery: harness.count('git.pushBranch') },
  }, {
    failed: { outcome: 'BLOCKED', state: 'BLOCKED', reason: 'WORKER_GREEN_FAILURE', next_action: 'REVISION' },
    blocked: { state: 'BLOCKED', phase: null, pending_action: null, candidate: null, delivery: null },
    revision: { outcome: 'APPLIED', state: 'EXECUTING', phase: 'TEST_RED' },
    after: { state: 'EXECUTING', phase: 'TEST_RED', pending_action: null, candidate: null, delivery: null },
    next: { outcome: 'AGENT_ACTION', state: 'EXECUTING', role: 'juaner_test', phase: 'TEST_RED' },
    forbidden_progress: { regression: 0, candidate: 0, delivery: 0 },
  }, 'PCRR-AC-001-03/002-02: Worker correction returns to the original Test route, not Regression or Candidate');
});

test('TEST-PCRR-006: Test REVISION exact and changed-byte replay identities are fail-closed', async t => {
  const establishAcceptedRevision = async () => {
    const harness = await createCoordinatorUnderTest();
    const action = await dispatchToTest(harness);
    const failed = await settle(harness, action, 'FAIL', 'pcrr-test-replay');
    const blocked = await publicStatus(harness);
    assert.deepEqual({ outcome: failed.outcome, state: failed.state, reason: failed.payload?.blocked_reason, public_state: blocked.state, public_phase: blocked.payload.phase }, { outcome: 'BLOCKED', state: 'BLOCKED', reason: 'TEST_CAUSAL_RED_UNAVAILABLE', public_state: 'BLOCKED', public_phase: null });
    const request = revisionFor(failed);
    const first = await harness.coordinator.applyControllerCommand(request);
    assertExactResult(first, { operation: 'applyControllerCommand', outcome: 'APPLIED', state: 'EXECUTING' });
    return { harness, request, first };
  };
  await t.test('exact canonical replay returns the original result with zero additional effect', async () => {
    const { harness, request, first } = await establishAcceptedRevision();
    const beforeEffects = revisionEffects(harness);
    const replay = await harness.coordinator.applyControllerCommand(request);
    assert.deepEqual({ replay, effects: revisionEffects(harness) }, { replay: first, effects: beforeEffects }, 'PCRR-AC-002-01: exact Test REVISION replay must return the original result with zero additional durable, Agent, or production effect');
  });
  for (const [name, mutate] of [
    ['command_id', body => { body.command_id = 'pcrr-revision-001'; body.receipt_digest = 'e'.repeat(64); }],
    ['nonce', body => { body.nonce = 'B'.repeat(43) + '='; body.receipt_digest = 'e'.repeat(64); }],
    ['idempotency_id', body => { body.idempotency_id = 'pcrr-revision-idem-001'; body.receipt_digest = 'e'.repeat(64); }],
  ]) {
    await t.test(`changed-byte reuse of accepted Test REVISION ${name} rejects without effect`, async () => {
      const { harness, request } = await establishAcceptedRevision();
      const beforeStatus = await publicStatus(harness);
      const beforeEffects = revisionEffects(harness);
      const body = JSON.parse(new TextDecoder().decode(request.command_body_bytes));
      mutate(body);
      const outcome = await harness.coordinator.applyControllerCommand({ command_body_bytes: bytes(body), signature_bytes: request.signature_bytes });
      const afterStatus = await publicStatus(harness);
      assert.deepEqual({ outcome: outcome.outcome, error_code: outcome.error_code, status: afterStatus.payload, effects: revisionEffects(harness) }, { outcome: 'REJECTED', error_code: 'COMMAND_REPLAY_CONFLICT', status: beforeStatus.payload, effects: beforeEffects }, `PCRR-AC-002-01: changed-byte Test REVISION ${name} reuse must leave State/Ledger/Agent/Git/stage/commit/push/validation/PR/Handoff unchanged`);
    });
  }
});

test('TEST-PCRR-007: Worker REVISION exact and changed-byte replay identities are fail-closed', async t => {
  const establishAcceptedRevision = async () => {
    const harness = await createCoordinatorUnderTest();
    const action = await dispatchToWorker(harness);
    const failed = await settle(harness, action, 'FAIL', 'pcrr-worker-replay');
    const blocked = await publicStatus(harness);
    assert.deepEqual({ outcome: failed.outcome, state: failed.state, reason: failed.payload?.blocked_reason, public_state: blocked.state, public_phase: blocked.payload.phase }, { outcome: 'BLOCKED', state: 'BLOCKED', reason: 'WORKER_GREEN_FAILURE', public_state: 'BLOCKED', public_phase: null });
    const request = revisionFor(failed);
    const first = await harness.coordinator.applyControllerCommand(request);
    assertExactResult(first, { operation: 'applyControllerCommand', outcome: 'APPLIED', state: 'EXECUTING' });
    return { harness, request, first };
  };
  await t.test('exact canonical replay returns the original result with zero additional effect', async () => {
    const { harness, request, first } = await establishAcceptedRevision();
    const beforeEffects = revisionEffects(harness);
    const replay = await harness.coordinator.applyControllerCommand(request);
    assert.deepEqual({ replay, effects: revisionEffects(harness) }, { replay: first, effects: beforeEffects }, 'PCRR-AC-002-02: exact Worker REVISION replay must return the original result with zero additional durable, Agent, or production effect');
  });
  for (const [name, mutate] of [
    ['command_id', body => { body.command_id = 'pcrr-revision-001'; body.receipt_digest = 'e'.repeat(64); }],
    ['nonce', body => { body.nonce = 'B'.repeat(43) + '='; body.receipt_digest = 'e'.repeat(64); }],
    ['idempotency_id', body => { body.idempotency_id = 'pcrr-revision-idem-001'; body.receipt_digest = 'e'.repeat(64); }],
  ]) {
    await t.test(`changed-byte reuse of accepted Worker REVISION ${name} rejects without effect`, async () => {
      const { harness, request } = await establishAcceptedRevision();
      const beforeStatus = await publicStatus(harness);
      const beforeEffects = revisionEffects(harness);
      const body = JSON.parse(new TextDecoder().decode(request.command_body_bytes));
      mutate(body);
      const outcome = await harness.coordinator.applyControllerCommand({ command_body_bytes: bytes(body), signature_bytes: request.signature_bytes });
      const afterStatus = await publicStatus(harness);
      assert.deepEqual({ outcome: outcome.outcome, error_code: outcome.error_code, status: afterStatus.payload, effects: revisionEffects(harness) }, { outcome: 'REJECTED', error_code: 'COMMAND_REPLAY_CONFLICT', status: beforeStatus.payload, effects: beforeEffects }, `PCRR-AC-002-02: changed-byte Worker REVISION ${name} reuse must leave State/Ledger/Agent/Git/stage/commit/push/validation/PR/Handoff unchanged`);
    });
  }
});

test('TEST-PCRR-004/005: every malformed pre-Candidate Test or Worker REVISION is fail-closed with no public progress or gateway effect', async t => {
  const cases = [
    ['wrong blocked reason', state => { state.blocked_reason = 'SPEC_FAILURE'; }, null],
    ['wrong route macro', state => { state.macro_state = 'EXECUTING'; state.phase = 'TEST_RED'; state.blocked_reason = null; }, null],
    ['non-null Candidate', state => { state.candidate = makeCandidate({ frozen: false, validator_head: null }); }, null],
    ['non-null delivery', state => { state.delivery = makeDelivery(); }, null],
    ['revision Candidate reference', null, body => { body.payload.revision_of_candidate_sha = CANDIDATE_SHA; }],
    ['resume phase', null, body => { body.payload.resume_phase = 'WORKER_GREEN'; }],
    ['Change identity', null, body => { body.change_id = CHANGE_B; }],
    ['repository id', null, body => { body.repository.repository_id = 'attacker/Other'; }],
    ['repository root', null, body => { body.repository.canonical_root = '/tmp/pcrr-wrong-repository'; }],
    ['repository origin', null, body => { body.repository.origin = 'upstream'; }],
    ['repository integration branch', null, body => { body.repository.integration_branch = 'release'; }],
    ['worktree root', null, body => { body.worktree.root = '/tmp/pcrr-wrong-worktree'; }],
    ['worktree branch', null, body => { body.worktree.branch = 'work/mac-mini/pcrr-wrong'; }],
    ['baseline identity', null, body => { body.worktree.baseline_sha = CANDIDATE_SHA; }],
    ['allowed scope', null, body => { body.scope.allowed_paths = ['tools/harness/change-coordinator/other.mjs']; }],
    ['forbidden scope', null, body => { body.scope.forbidden_paths = ['tools/harness/change-coordinator/coordinator.mjs']; }],
    ['persisted repository root', state => { state.repository.worktree_root = '/tmp/pcrr-persisted-wrong'; }, null],
    ['persisted repository branch', state => { state.repository.branch = 'work/mac-mini/pcrr-persisted-wrong'; }, null],
    ['persisted baseline', state => { state.repository.baseline_sha = CANDIDATE_SHA; }, null],
    ['persisted admission identity', state => { state.admission.body_sha256 = 'b'.repeat(64); }, null],
    ['stale assignment claim', state => { state.pending_agent = { correlation_id: 'stale-pcrr-agent', role: 'juaner_worker' }; }, null],
    ['extra role claim', null, body => { body.payload.role = 'juaner_worker'; }],
    ['state version CAS', null, body => { body.expected_state_version += 1; }],
    ['state hash CAS', null, body => { body.expected_state_hash = 'c'.repeat(64); }],
    ['signature rejection', null, null, harness => { harness.fault('verifier.verify', { kind: 'REJECTED', error_code: 'COMMAND_SIGNATURE_INVALID' }); }],
    ['missing changes_requested evidence', null, body => { body.evidence_refs = []; }],
    ['malformed changes_requested evidence', null, body => { body.evidence_refs = [{ kind: 'controller_decision', id: 'changes-requested-001', sha256: 'not-a-hash', subject_sha: GIT_SHA }]; }],
    ['extra changes_requested evidence', null, body => { body.evidence_refs = [{ kind: 'controller_decision', id: 'changes-requested-001', sha256: SHA256, subject_sha: GIT_SHA }, { kind: 'controller_decision', id: 'z-extra', sha256: SHA256, subject_sha: GIT_SHA }]; }],
    ['wrong changes_requested reference', null, body => { body.payload.changes_requested_ref = 'changes-requested-other'; }],
    ['wrong evidence subject', null, body => { body.evidence_refs[0].subject_sha = CANDIDATE_SHA; }],
    ['wrong evidence hash', null, body => { body.evidence_refs[0].sha256 = 'd'.repeat(64); }],
  ];
  for (const [route, blocked_reason] of [['Test', 'TEST_CAUSAL_RED_UNAVAILABLE'], ['Worker', 'WORKER_GREEN_FAILURE']]) for (const [name, mutateState, mutateBody, prepare] of cases) {
    await t.test(`${route}: ${name}`, async () => {
      const harness = await createCoordinatorUnderTest();
      const action = route === 'Test' ? await dispatchToTest(harness) : await dispatchToWorker(harness);
      const failed = await settle(harness, action, 'FAIL', `pcrr-${route.toLowerCase()}-${name.replaceAll(' ', '-')}`);
      assert.deepEqual(
        { outcome: failed.outcome, state: failed.state, reason: failed.payload?.blocked_reason, next_action: failed.payload?.next_action },
        { outcome: 'BLOCKED', state: 'BLOCKED', reason: blocked_reason, next_action: route === 'Test' ? 'MANUAL_CONTROLLER_STOP' : 'REVISION' },
        `PCRR-AC-001-02/03: ${route} public FAIL must establish the exact source before ${name} is isolated`,
      );
      let identity = { state_version: failed.state_version, state_hash: failed.state_hash };
      let beforeStatus;
      if (mutateState) {
        const sourceStatus = await publicStatus(harness);
        assert.deepEqual(
          { state: sourceStatus.state, state_version: sourceStatus.state_version, state_hash: sourceStatus.state_hash, payload: sourceStatus.payload },
          { state: failed.state, state_version: failed.state_version, state_hash: failed.state_hash, payload: { pointer_status: 'ACTIVE', active_change_id: CHANGE_ID, macro_state: 'BLOCKED', phase: null, state_version: failed.state_version, state_hash: failed.state_hash, pending_action: null, candidate: null, delivery: null, orphan_ready: null, local_pause: null } },
          `PCRR-PSP-AC-002-02: ${route} ${name} must publicly bind the authentic blocked source before isolation`,
        );
        const state = structuredClone(harness.stateStore.state);
        mutateState(state);
        const primed = primeState(harness, state);
        identity = { state_version: primed.expected_state_version, state_hash: primed.expected_state_hash };
        beforeStatus = await publicStatus(harness);
        assert.deepEqual(
          { state: beforeStatus.state, state_version: beforeStatus.state_version, state_hash: beforeStatus.state_hash, payload: beforeStatus.payload },
          { state: primed.state.macro_state, state_version: primed.expected_state_version, state_hash: primed.expected_state_hash, payload: { pointer_status: 'ACTIVE', active_change_id: CHANGE_ID, macro_state: primed.state.macro_state, phase: primed.state.phase, state_version: primed.expected_state_version, state_hash: primed.expected_state_hash, pending_action: primed.state.pending_agent ? { kind: 'AGENT_SETTLEMENT', correlation_id: primed.state.pending_agent.correlation_id } : null, candidate: primed.state.candidate, delivery: primed.state.delivery, orphan_ready: null, local_pause: null } },
          `PCRR-PSP-AC-002-03: ${route} ${name} must publicly bind the one primed mutation before REVISION`,
        );
        identity = { state_version: beforeStatus.state_version, state_hash: beforeStatus.state_hash };
      } else {
        beforeStatus = await publicStatus(harness);
      }
      if (prepare) prepare(harness);
      const beforeEffects = revisionEffects(harness);
      const request = revisionFor(identity);
      const body = JSON.parse(new TextDecoder().decode(request.command_body_bytes));
      if (mutateBody) mutateBody(body);
      const outcome = await harness.coordinator.applyControllerCommand({ command_body_bytes: bytes(body), signature_bytes: request.signature_bytes });
      const afterStatus = await publicStatus(harness);
      assert.equal(outcome.outcome, 'REJECTED', `PCRR-AC-002-03: ${route} ${name} must reject`);
      if (mutateState) assert.deepEqual(afterStatus, beforeStatus, `PCRR-PSP-AC-002-04: ${route} ${name} cannot change public status`);
      else assert.deepEqual(afterStatus.payload, beforeStatus.payload, `PCRR-AC-002-03: ${route} ${name} cannot change public status`);
      assert.deepEqual(revisionEffects(harness), beforeEffects, `PCRR-AC-002-03: ${route} ${name} cannot write State/Ledger, request an Agent, or reach production gateways`);
    });
  }
});

test('TEST-PCRR-008: public Test and Worker failure routes reject original DISPATCH replay identities without effect', async t => {
  for (const [route, blocked_reason] of [['Test', 'TEST_CAUSAL_RED_UNAVAILABLE'], ['Worker', 'WORKER_GREEN_FAILURE']]) for (const [name, mutate] of [
    ['original DISPATCH command identity', body => { body.command_id = 'command-001'; }],
    ['original DISPATCH nonce', body => { body.nonce = 'A'.repeat(43) + '='; }],
    ['original DISPATCH idempotency identity', body => { body.idempotency_id = 'idem-001'; }],
  ]) {
    await t.test(`${route}: ${name}`, async () => {
      const harness = await createCoordinatorUnderTest();
      const action = route === 'Test' ? await dispatchToTest(harness) : await dispatchToWorker(harness);
      const failed = await settle(harness, action, 'FAIL', `pcrr-${route.toLowerCase()}-replay-identity`);
      assert.deepEqual({ outcome: failed.outcome, state: failed.state, reason: failed.payload?.blocked_reason, next_action: failed.payload?.next_action }, { outcome: 'BLOCKED', state: 'BLOCKED', reason: blocked_reason, next_action: route === 'Test' ? 'MANUAL_CONTROLLER_STOP' : 'REVISION' }, `PCRR-AC-001-02/03: ${route} public FAIL must establish its exact correction source`);
      const beforeStatus = await publicStatus(harness);
      const beforeEffects = revisionEffects(harness);
      const request = revisionFor(failed);
      const body = JSON.parse(new TextDecoder().decode(request.command_body_bytes));
      mutate(body);
      const outcome = await harness.coordinator.applyControllerCommand({ command_body_bytes: bytes(body), signature_bytes: request.signature_bytes });
      const afterStatus = await publicStatus(harness);
      assert.deepEqual({ outcome: outcome.outcome, error_code: outcome.error_code, status: afterStatus.payload, effects: revisionEffects(harness) }, { outcome: 'REJECTED', error_code: 'COMMAND_REPLAY_CONFLICT', status: beforeStatus.payload, effects: beforeEffects }, `PCRR-AC-002-03: ${route} ${name} must be the exact replay conflict with zero State/Ledger/Agent/Git/validation/PR/Handoff effect`);
    });
  }
});

test('TEST-PCRR-009: Candidate-bound Validator REVISION shares the complete replay predicate', async t => {
  const establishSecondValidatorFailure = async () => {
    const harness = await createCoordinatorUnderTest();
    const admitted = await harness.coordinator.applyControllerCommand(signed());
    assertExactResult(admitted, { operation: 'applyControllerCommand', outcome: 'APPLIED', state: 'READY' });
    const ready = await publicStatus(harness); assert.deepEqual({ state: ready.state, phase: ready.payload.phase, state_version: ready.state_version, state_hash: ready.state_hash }, { state: 'READY', phase: 'WORKTREE', state_version: admitted.state_version, state_hash: admitted.state_hash }, 'PCRR-AC-002-03: public READY/WORKTREE identity is the sole predecessor before the one exhausted-budget component prime');
    const identity = primeState(harness, {
      ...harness.stateStore.state, macro_state: 'DELIVERING', phase: 'VALIDATOR', state_version: 7,
      candidate: makeCandidate({ frozen: false, validator_head: null }), delivery: null,
      authorization_cycle: { command_id: 'command-001', command_kind: 'DISPATCH', auto_repair_attempt: 1 },
    });
    const source = await publicStatus(harness); assert.deepEqual({ state: source.state, phase: source.payload.phase, candidate: source.payload.candidate?.sha, budget: harness.stateStore.state.authorization_cycle.auto_repair_attempt }, { state: 'DELIVERING', phase: 'VALIDATOR', candidate: CANDIDATE_SHA, budget: 1 }, 'PCRR-AC-002-03: public DISPATCH precedes the one exhausted-budget Validator component state');
    const action = await harness.coordinator.run({ change_id: CHANGE_ID, ...identity });
    assertExactResult(action, { operation: 'run', outcome: 'AGENT_ACTION', state: 'DELIVERING' });
    assert.equal(action.payload.action.role, 'juaner_validator');
    const binding = bindingFor(action); const started = await harness.coordinator.settlement({ change_id: CHANGE_ID, expected_state_version: action.state_version, expected_state_hash: action.state_hash, settlement: { ...binding, stage: 'STARTED', observed_child_id: 'pcrr-validator-second-fail' } }); assertExactResult(started, { operation: 'settlement', outcome: 'WAITING', state: 'DELIVERING' });
    const validator_artifact = { schema_version: '1.0', change_id: CHANGE_ID, candidate_sha: action.payload.action.subject_sha, validator_head: action.payload.action.subject_sha, verdict: 'FAIL', findings: [{ finding_id: 'pcrr-validator-second-fail', classification: 'IMPLEMENTATION_IN_SCOPE', requirement_ids: ['REQ-M2-004'], acceptance_ids: ['AC-M2-004-02'], paths: ['tools/harness/change-coordinator/coordinator.mjs'], summary: 'exhausted-budget Validator component finding', evidence_refs: [{ kind: 'TEST', id: 'PCRR-009', sha256: SHA256, subject_sha: action.payload.action.subject_sha }] }], risks: [], unverified: [], open_questions: [] }; const artifact_bytes = bytes(validator_artifact);
    const failed = await harness.coordinator.settlement({ change_id: CHANGE_ID, expected_state_version: started.state_version, expected_state_hash: started.state_hash, settlement: { ...binding, stage: 'RESULT', observed_child_id: 'pcrr-validator-second-fail', status: 'FAIL', artifact_path: 'outputs/pcrr-validator-second-fail.json', artifact_sha256: sha256(artifact_bytes), validator_artifact } });
    assert.deepEqual(
      { outcome: failed.outcome, state: failed.state, reason: failed.payload?.blocked_reason, next_action: failed.payload?.next_action },
      { outcome: 'BLOCKED', state: 'BLOCKED', reason: 'VALIDATOR_SECOND_FAIL', next_action: 'REVISION' },
      'PCRR-AC-002-03: public Validator second FAIL must establish the Candidate-bound correction source',
    );
    return { harness, failed };
  };
  const candidateRevisionFor = failed => signed({
    command_kind: 'REVISION', command_id: 'pcrr-validator-revision-001', idempotency_id: 'pcrr-validator-revision-idem-001', nonce: 'C'.repeat(43) + '=',
    payload: { changes_requested_ref: 'changes-requested-001', revision_of_candidate_sha: CANDIDATE_SHA, resume_phase: 'TEST_RED' },
    evidence_refs: [{ kind: 'controller_decision', id: 'changes-requested-001', sha256: SHA256, subject_sha: CANDIDATE_SHA }],
    expected_state_version: failed.state_version, expected_state_hash: failed.state_hash,
  });
  const assertConflict = async ({ harness, request, mutate, name }) => {
    const beforeStatus = await publicStatus(harness);
    const beforeEffects = revisionEffects(harness);
    const body = JSON.parse(new TextDecoder().decode(request.command_body_bytes));
    mutate(body);
    const outcome = await harness.coordinator.applyControllerCommand({ command_body_bytes: bytes(body), signature_bytes: request.signature_bytes });
    const afterStatus = await publicStatus(harness);
    assert.deepEqual(
      { outcome: outcome.outcome, error_code: outcome.error_code, status: afterStatus.payload, effects: revisionEffects(harness) },
      { outcome: 'REJECTED', error_code: 'COMMAND_REPLAY_CONFLICT', status: beforeStatus.payload, effects: beforeEffects },
      `PCRR-AC-002-03: Candidate-bound Validator ${name} must fail closed before State/Ledger/Agent/Git/validation/PR/Handoff progress`,
    );
  };
  await t.test('exact canonical replay returns the first result before the next public run, with no new effect', async () => {
    const { harness, failed } = await establishSecondValidatorFailure();
    const request = candidateRevisionFor(failed);
    const first = await harness.coordinator.applyControllerCommand(request);
    assertExactResult(first, { operation: 'applyControllerCommand', outcome: 'APPLIED', state: 'EXECUTING' });
    const beforeEffects = revisionEffects(harness);
    const replay = await harness.coordinator.applyControllerCommand(request);
    assert.deepEqual({ replay, effects: revisionEffects(harness) }, { replay: first, effects: beforeEffects }, 'PCRR-AC-002-03: exact Candidate-bound Validator REVISION replay returns its original result with zero additional effect');
    const next = await harness.coordinator.run({ change_id: CHANGE_ID, expected_state_version: first.state_version, expected_state_hash: first.state_hash });
    assertExactResult(next, { operation: 'run', outcome: 'AGENT_ACTION', state: 'EXECUTING' });
    const settled = await settle(harness, next, 'PASS', 'pcrr-validator-replay-test-pass');
    assertExactResult(settled, { operation: 'settlement', outcome: 'ADVANCED', state: 'EXECUTING' });
    const status = await publicStatus(harness);
    assert.equal(status.payload.phase, 'WORKER_GREEN');
  });
  for (const [name, mutate] of [
    ['original DISPATCH command_id', body => { body.command_id = 'command-001'; }],
    ['original DISPATCH nonce', body => { body.nonce = 'A'.repeat(43) + '='; }],
    ['original DISPATCH idempotency_id', body => { body.idempotency_id = 'idem-001'; }],
  ]) {
    await t.test(`first application reusing ${name} rejects exactly without effect`, async () => {
      const { harness, failed } = await establishSecondValidatorFailure();
      await assertConflict({ harness, request: candidateRevisionFor(failed), mutate, name });
    });
  }
  for (const [name, mutate] of [
    ['applied REVISION command_id', body => { body.command_id = 'pcrr-validator-revision-001'; body.receipt_digest = 'e'.repeat(64); }],
    ['applied REVISION nonce', body => { body.nonce = 'C'.repeat(43) + '='; body.receipt_digest = 'e'.repeat(64); }],
    ['applied REVISION idempotency_id', body => { body.idempotency_id = 'pcrr-validator-revision-idem-001'; body.receipt_digest = 'e'.repeat(64); }],
  ]) {
    await t.test(`changed-byte reuse of ${name} rejects exactly without effect`, async () => {
      const { harness, failed } = await establishSecondValidatorFailure();
      const request = candidateRevisionFor(failed);
      const first = await harness.coordinator.applyControllerCommand(request);
      assertExactResult(first, { operation: 'applyControllerCommand', outcome: 'APPLIED', state: 'EXECUTING' });
      await assertConflict({ harness, request, mutate, name });
    });
  }
});

test('TEST-PCRR-010: Frozen-Candidate review return shares the complete replay predicate', async t => {
  const frozenRevisionFor = (context, identity) => signed({ ...context.command, command_kind: 'REVISION', command_id: 'pcrr-frozen-revision-001', idempotency_id: 'pcrr-frozen-revision-idem-001', nonce: 'D'.repeat(43) + '=', payload: { changes_requested_ref: 'changes-requested-001', revision_of_candidate_sha: context.candidateEvent.detail.candidate_sha, resume_phase: 'TEST_RED' }, evidence_refs: [{ kind: 'controller_decision', id: 'changes-requested-001', sha256: SHA256, subject_sha: context.candidateEvent.detail.candidate_sha }], expected_state_version: identity.state_version, expected_state_hash: identity.state_hash });
  const effects = context => ({ state: context.gatewayEvents.filter(event => event.edge === 'START' && event.gateway === 'state' && event.method === 'writeState').length, ledger: context.gatewayEvents.filter(event => event.edge === 'START' && event.gateway === 'ledger' && event.method === 'prepareAppend').length, git: context.gatewayEvents.filter(event => event.edge === 'START' && event.gateway === 'git').length, validation: context.gatewayEvents.filter(event => event.edge === 'START' && event.gateway === 'validation').length, pull_request: context.gatewayEvents.filter(event => event.edge === 'START' && event.gateway === 'pull_request').length, handoff: context.gatewayEvents.filter(event => event.edge === 'START' && event.gateway === 'handoff').length });
  const assertConflict = async ({ context, request, mutate, name }) => {
    const beforeStatus = await context.core.status({ change_id: context.command.change_id });
    const beforeEffects = effects(context);
    const body = JSON.parse(new TextDecoder().decode(request.command_body_bytes));
    mutate(body);
    const outcome = await context.core.applyControllerCommand({ command_body_bytes: bytes(body), signature_bytes: request.signature_bytes });
    assert.deepEqual(
      { outcome: outcome.outcome, error_code: outcome.error_code, status: (await context.core.status({ change_id: context.command.change_id })).payload, effects: effects(context) },
      { outcome: 'REJECTED', error_code: 'COMMAND_REPLAY_CONFLICT', status: beforeStatus.payload, effects: beforeEffects },
      `PCRR-AC-002-03: Frozen-Candidate ${name} must fail closed before State/Ledger/Agent/Git/validation/PR/Handoff progress`,
    );
  };
  await t.test('exact canonical replay returns the first result before the next public run, with no new effect', async () => {
    await withObservedFrozenReview('pcrr010-exact', async ({ context, awaiting }) => {
      const request = frozenRevisionFor(context, awaiting); const first = await context.core.applyControllerCommand(request); assertExactResult(first, { operation: 'applyControllerCommand', outcome: 'APPLIED', state: 'EXECUTING' }); const beforeStatus = await context.core.status({ change_id: context.command.change_id }); const beforeEffects = effects(context); const replay = await context.core.applyControllerCommand(request); assert.deepEqual({ replay, status: (await context.core.status({ change_id: context.command.change_id })).payload, effects: effects(context) }, { replay: first, status: beforeStatus.payload, effects: beforeEffects }, 'PCRR-AC-002-03: exact Frozen-Candidate REVISION replay returns its original result with zero additional effect'); const next = await context.core.run({ change_id: context.command.change_id, expected_state_version: first.state_version, expected_state_hash: first.state_hash }); assertExactResult(next, { operation: 'run', outcome: 'AGENT_ACTION', state: 'EXECUTING' }); assert.equal(next.payload.action.role, 'juaner_test'); const { action_kind, ...binding } = next.payload.action; const started = await context.core.settlement({ change_id: context.command.change_id, expected_state_version: next.state_version, expected_state_hash: next.state_hash, settlement: { ...binding, stage: 'STARTED', observed_child_id: 'pcrr-frozen-replay-test-pass' } }); assertExactResult(started, { operation: 'settlement', outcome: 'WAITING', state: 'EXECUTING' }); const artifact_bytes = Buffer.from(canonicalJson({ status: 'PASS' })); const artifact_path = path.join(context.fixtureRoot, 'ordinary-role-results', `${binding.correlation_id}.pcrr-frozen-replay-test-pass.json`); await mkdir(path.dirname(artifact_path), { recursive: true }); await writeFile(artifact_path, artifact_bytes); const settled = await context.core.settlement({ change_id: context.command.change_id, expected_state_version: started.state_version, expected_state_hash: started.state_hash, settlement: { ...binding, stage: 'RESULT', observed_child_id: 'pcrr-frozen-replay-test-pass', status: 'PASS', artifact_path, artifact_sha256: sha256(artifact_bytes) } }); assertExactResult(settled, { operation: 'settlement', outcome: 'ADVANCED', state: 'EXECUTING' }); assert.equal((await context.core.status({ change_id: context.command.change_id })).payload.phase, 'WORKER_GREEN');
    });
  });
  for (const [name, mutate] of [
    ['original DISPATCH command_id', body => { body.command_id = 'command-001'; }],
    ['original DISPATCH nonce', body => { body.nonce = 'A'.repeat(43) + '='; }],
    ['original DISPATCH idempotency_id', body => { body.idempotency_id = 'idem-001'; }],
  ]) {
    await t.test(`first application reusing ${name} rejects exactly without effect`, async () => {
      await withObservedFrozenReview(`pcrr010-original-${name}`, async ({ context, awaiting }) => await assertConflict({ context, request: frozenRevisionFor(context, awaiting), mutate, name }));
    });
  }
  for (const [name, mutate] of [
    ['applied REVISION command_id', body => { body.command_id = 'pcrr-frozen-revision-001'; body.receipt_digest = 'e'.repeat(64); }],
    ['applied REVISION nonce', body => { body.nonce = 'D'.repeat(43) + '='; body.receipt_digest = 'e'.repeat(64); }],
    ['applied REVISION idempotency_id', body => { body.idempotency_id = 'pcrr-frozen-revision-idem-001'; body.receipt_digest = 'e'.repeat(64); }],
  ]) {
    await t.test(`changed-byte reuse of ${name} rejects exactly without effect`, async () => {
      await withObservedFrozenReview(`pcrr010-applied-${name}`, async ({ context, awaiting }) => { const request = frozenRevisionFor(context, awaiting); const first = await context.core.applyControllerCommand(request); assertExactResult(first, { operation: 'applyControllerCommand', outcome: 'APPLIED', state: 'EXECUTING' }); await assertConflict({ context, request, mutate, name }); });
    });
  }
});

// R175_STATE_FIRST_WRITE_BEGIN
{
  const r175StateModule = await import('./production.mjs');
  const pauseName = 'local-pause.json';
  const stateFactory = () => r175StateModule.createFileState;
  const expectedPauseOk = bytesText => {
    const value = { bytes: bytesText, sha256: sha256(bytesText) };
    return { kind: 'OK', value, receipt_sha256: sha256(canonicalJson(value)) };
  };
  const localPauseDiagnosticBytes = (identity, createdAt) => canonicalJson({
    schema_version: '1.0', diagnostic_id: `r175-${identity}-diagnostic`, change_id: CHANGE_ID,
    reason: 'EVIDENCE_REF_UNAVAILABLE', operation: 'applyControllerCommand', request_sha256: sha256(`r175-${identity}-request`),
    request_idempotency_id: `r175-${identity}-idempotency`, next_action: 'IDENTICAL_COMMAND_REPLAY', command_id: `r175-${identity}-command`,
    event_id: null, expected_evidence_tip: null, expected_event_hash: null, state_version: null, state_hash: null,
    created_at: createdAt, supersedes_diagnostic_id: null,
  });
  const observePauseFile = async target => {
    try {
      const stat = await lstat(target);
      if (!stat.isFile()) return { kind: 'PRESENT_NON_FILE', is_directory: stat.isDirectory() };
      const bytesValue = await readFile(target);
      return { kind: 'PRESENT_FILE', bytes: bytesValue.toString('utf8'), sha256: sha256(bytesValue) };
    } catch (error) {
      if (error?.code === 'ENOENT') return { kind: 'ABSENT' };
      throw error;
    }
  };
  const withOwnedStateRoot = async action => {
    const created = await mkdtemp(path.join(os.tmpdir(), 'juanerai-r175-state-'));
    try {
      const root = await realpath(created);
      assert.ok(path.isAbsolute(root), 'R175 owned State root must be canonical and absolute');
      return await action(root);
    } finally {
      await rm(created, { recursive: true, force: true });
    }
  };

  test('COORDINATOR-56-R175-ENTRY: REQ-M2-006 AC-M2-006-08 exact production State factory export is reachable', { timeout: 5_000 }, () => {
    assert.equal(typeof stateFactory(), 'function', 'CAUSAL_RED: production.mjs must export the existing createFileState(stateRoot) factory; until this entry is reachable, all real-State behavior suffixes are NOT_REACHED');
  });

  test('COORDINATOR-56-R175-FS-HEALTH: REQ-M2-006 AC-M2-006-08 owned canonical temporary filesystem oracle is independent of factory reachability', { timeout: 15_000 }, async () => {
    await withOwnedStateRoot(async root => {
      const oraclePath = path.join(root, 'independent-oracle.txt');
      const oracleBytes = 'R175 independent filesystem oracle\n';
      await writeFile(oraclePath, oracleBytes, { mode: 0o600 });
      const actual = await readFile(oraclePath);
      assert.deepEqual(
        { root, bytes: actual.toString('utf8'), sha256: sha256(actual) },
        { root, bytes: oracleBytes, sha256: sha256(oracleBytes) },
        'R175 filesystem health is an owned real-file oracle, not evidence from createFileState',
      );
    });
  });

  test('COORDINATOR-56-R175-FIRST-WRITE: REQ-M2-006 AC-M2-006-01,04,07,08 absent plus null publishes exact bytes, hash, receipt, and fresh-factory readback', { timeout: 15_000 }, async () => {
    await withOwnedStateRoot(async root => {
      const pausePath = path.join(root, pauseName);
      const nextBytes = localPauseDiagnosticBytes('first-write', '2026-09-10T00:00:01.000Z');
      const factory = stateFactory()(root);
      assert.deepEqual(Object.keys(factory).sort(), ['readLocalPause', 'readPointer', 'readState', 'writeLocalPause', 'writePointer', 'writeState']);
      const actual = await factory.writeLocalPause({ expected_sha256: null, next_bytes: nextBytes });
      const fileObservation = await observePauseFile(pausePath);
      const freshReadback = await stateFactory()(root).readLocalPause();
      assert.deepEqual(
        { gateway: actual, file: fileObservation, fresh_readback: freshReadback },
        {
          gateway: expectedPauseOk(nextBytes),
          file: { kind: 'PRESENT_FILE', bytes: nextBytes, sha256: sha256(nextBytes) },
          fresh_readback: expectedPauseOk(nextBytes),
        },
        'CAUSAL_RED: real absent/null first write must be OK while preserving the actual ABSENT/no-file observation when it is still defective',
      );
    });
  });

  test('COORDINATOR-56-R175-PRESENT-NULL: REQ-M2-006 AC-M2-006-01,02,07 present plus null conflicts with old hash and preserves target and sentinel', { timeout: 15_000 }, async () => {
    await withOwnedStateRoot(async root => {
      const pausePath = path.join(root, pauseName); const sentinelPath = path.join(root, 'sentinel.txt');
      const oldBytes = localPauseDiagnosticBytes('present-null-old', '2026-09-10T00:00:02.000Z'); const nextBytes = localPauseDiagnosticBytes('present-null-replacement', '2026-09-10T00:00:03.000Z'); const sentinel = 'R175 sentinel';
      await writeFile(pausePath, oldBytes); await writeFile(sentinelPath, sentinel);
      const actual = await stateFactory()(root).writeLocalPause({ expected_sha256: null, next_bytes: nextBytes });
      assert.deepEqual(actual, { kind: 'CONFLICT', reason: 'CAS_CONFLICT', observed_identity: sha256(oldBytes) });
      assert.deepEqual(await observePauseFile(pausePath), { kind: 'PRESENT_FILE', bytes: oldBytes, sha256: sha256(oldBytes) });
      assert.equal((await readFile(sentinelPath)).toString('utf8'), sentinel);
    });
  });

  test('COORDINATOR-56-R175-PRESENT-WRONG-HASH: REQ-M2-006 AC-M2-006-01,02,07 present plus wrong hash conflicts without overwrite', { timeout: 15_000 }, async () => {
    await withOwnedStateRoot(async root => {
      const pausePath = path.join(root, pauseName); const sentinelPath = path.join(root, 'sentinel.txt'); const oldBytes = localPauseDiagnosticBytes('present-wrong-old', '2026-09-10T00:00:04.000Z'); const nextBytes = localPauseDiagnosticBytes('present-wrong-replacement', '2026-09-10T00:00:05.000Z'); const sentinel = 'R175 wrong-hash sentinel';
      await writeFile(pausePath, oldBytes); await writeFile(sentinelPath, sentinel);
      const actual = await stateFactory()(root).writeLocalPause({ expected_sha256: 'f'.repeat(64), next_bytes: nextBytes });
      assert.deepEqual(actual, { kind: 'CONFLICT', reason: 'CAS_CONFLICT', observed_identity: sha256(oldBytes) });
      assert.deepEqual(await observePauseFile(pausePath), { kind: 'PRESENT_FILE', bytes: oldBytes, sha256: sha256(oldBytes) });
      assert.equal((await readFile(sentinelPath)).toString('utf8'), sentinel);
    });
  });

  test('COORDINATOR-56-R175-PRESENT-CORRECT-HASH: REQ-M2-006 AC-M2-006-07,08 present plus correct hash retains replacement and fresh readback', { timeout: 15_000 }, async () => {
    await withOwnedStateRoot(async root => {
      const pausePath = path.join(root, pauseName); const oldBytes = localPauseDiagnosticBytes('present-correct-old', '2026-09-10T00:00:06.000Z'); const nextBytes = localPauseDiagnosticBytes('present-correct-replacement', '2026-09-10T00:00:07.000Z');
      await writeFile(pausePath, oldBytes);
      const actual = await stateFactory()(root).writeLocalPause({ expected_sha256: sha256(oldBytes), next_bytes: nextBytes });
      assert.deepEqual(actual, expectedPauseOk(nextBytes));
      assert.deepEqual(await observePauseFile(pausePath), { kind: 'PRESENT_FILE', bytes: nextBytes, sha256: sha256(nextBytes) });
      assert.deepEqual(await stateFactory()(root).readLocalPause(), expectedPauseOk(nextBytes));
    });
  });

  test('COORDINATOR-56-R175-ABSENT-NONNULL: REQ-M2-006 AC-M2-006-01,02,07 absent plus nonnull remains ABSENT with no creation', { timeout: 15_000 }, async () => {
    await withOwnedStateRoot(async root => {
      const pausePath = path.join(root, pauseName);
      const actual = await stateFactory()(root).writeLocalPause({ expected_sha256: 'a'.repeat(64), next_bytes: localPauseDiagnosticBytes('absent-nonnull', '2026-09-10T00:00:08.000Z') });
      const fileObservation = await observePauseFile(pausePath);
      assert.deepEqual(
        { gateway: actual, file: fileObservation },
        { gateway: { kind: 'ABSENT', reason: 'EXPECTED_IDENTITY_ABSENT', expected_identity: pausePath }, file: { kind: 'ABSENT' } },
      );
    });
  });

  test('COORDINATOR-56-R175-NONENOENT-OBSTACLE: REQ-M2-006 AC-M2-006-01,02,07 non-ENOENT obstacle remains UNAVAILABLE before publication', { timeout: 15_000 }, async () => {
    await withOwnedStateRoot(async root => {
      const pausePath = path.join(root, pauseName); const sentinelPath = path.join(root, 'sentinel.txt');
      await mkdir(pausePath); await writeFile(sentinelPath, 'R175 obstacle sentinel');
      const actual = await stateFactory()(root).writeLocalPause({ expected_sha256: null, next_bytes: localPauseDiagnosticBytes('nonenoent-obstacle', '2026-09-10T00:00:09.000Z') });
      assert.deepEqual(actual, { kind: 'UNAVAILABLE', reason: 'UNAVAILABLE', partial_receipt: null });
      assert.deepEqual(await observePauseFile(pausePath), { kind: 'PRESENT_NON_FILE', is_directory: true });
      assert.equal((await readFile(sentinelPath)).toString('utf8'), 'R175 obstacle sentinel');
    });
  });

  test('COORDINATOR-56-R175-CORE-CONNECTION: REQ-M2-006 AC-M2-006-01,02,08 signed DISPATCH binds the real pause factory while READY State remains the declared double', { timeout: 20_000 }, async () => {
    await withOwnedStateRoot(async root => {
      const pausePath = path.join(root, pauseName); const harness = makeTestDependencies(); const realState = stateFactory()(root);
      const originalState = harness.dependencies.state; const pauseCalls = [];
      harness.dependencies.state = {
        ...originalState,
        readLocalPause: async request => {
          const callsBefore = harness.calls.length;
          const result = await realState.readLocalPause(request);
          pauseCalls.push({ method: 'readLocalPause', request, result, calls_before: callsBefore });
          return result;
        },
        writeLocalPause: async request => {
          const callsBefore = harness.calls.length;
          const result = await realState.writeLocalPause(request);
          pauseCalls.push({ method: 'writeLocalPause', request, result, calls_before: callsBefore });
          return result;
        },
      };
      const core = createCoordinatorCore(harness.dependencies); const command = signed();
      const body = JSON.parse(new TextDecoder().decode(command.command_body_bytes));
      harness.fault('ledger.readRemote', unavailable({ stage: 'PRIOR_TIP_READ' }));
      const actual = await core.applyControllerCommand(command);
      const ready = await originalState.readState({ change_id: CHANGE_ID });
      const fileObservation = await observePauseFile(pausePath);
      assert.deepEqual(
        { result: actual, command: { command_id: body.command_id, idempotency_id: body.idempotency_id, body_sha256: sha256(command.command_body_bytes) } },
        {
          result: {
            schema_version: '1.0', operation: 'applyControllerCommand', outcome: 'BLOCKED', change_id: null,
            state: null, state_version: null, state_hash: null,
            payload: { blocked_reason: 'EVIDENCE_REF_UNAVAILABLE', next_action: 'IDENTICAL_COMMAND_REPLAY', blocked_event_id: null, local_pause_id: null },
          },
          command: { command_id: 'command-001', idempotency_id: 'idem-001', body_sha256: sha256(command.command_body_bytes) },
        },
      );
      assert.equal(ready.kind, 'OK');
      const readyWrites = harness.calls.filter(call => call.name === 'state.writeState' && call.request.state?.macro_state === 'READY');
      assert.equal(readyWrites.length, 1, 'the supplementary connection preserves exactly the one actual READY State-double publication');
      const [readyWrite] = readyWrites; const readyWriteIndex = harness.calls.indexOf(readyWrite);
      assert.ok(readyWriteIndex >= 0 && readyWriteIndex < pauseCalls[0].calls_before, 'the actual READY State-double publication precedes the real pause write');
      assert.equal(ready.value.bytes, readyWrite.request.next_bytes, 'READY readback preserves the full actual published State bytes');
      assert.equal(ready.value.sha256, sha256(readyWrite.request.next_bytes), 'READY readback hash is the hash of the actual published State bytes');
      assert.deepEqual(JSON.parse(ready.value.bytes), readyWrite.request.state, 'READY readback preserves the full actual published State object');
      const readyState = JSON.parse(ready.value.bytes);
      assert.deepEqual(
        { macro_state: readyState.macro_state, phase: readyState.phase, change_id: readyState.change_id, state_version: readyState.state_version, command_id: readyState.admission.command_id, idempotency_id: readyState.admission.idempotency_id, bytes_sha256: ready.value.sha256 },
        { macro_state: 'READY', phase: 'WORKTREE', change_id: body.change_id, state_version: 1, command_id: body.command_id, idempotency_id: body.idempotency_id, bytes_sha256: sha256(ready.value.bytes) },
      );
      assert.deepEqual(pauseCalls.map(call => call.method), ['writeLocalPause', 'readLocalPause']);
      assert.equal(pauseCalls[0].request.expected_sha256, null);
      const pauseNextBytes = pauseCalls[0].request.next_bytes;
      assert.deepEqual(
        pauseCalls.map(call => ({ method: call.method, result: call.result })),
        [{ method: 'writeLocalPause', result: expectedPauseOk(pauseNextBytes) }, { method: 'readLocalPause', result: expectedPauseOk(pauseNextBytes) }],
        'the observation-only real pause wrappers retain exact write and read bytes/hash/receipt results',
      );
      const diagnostic = JSON.parse(pauseCalls[0].request.next_bytes);
      assert.deepEqual(Object.keys(diagnostic).sort(), ['change_id', 'command_id', 'created_at', 'diagnostic_id', 'event_id', 'expected_event_hash', 'expected_evidence_tip', 'next_action', 'operation', 'reason', 'request_idempotency_id', 'request_sha256', 'schema_version', 'state_hash', 'state_version', 'supersedes_diagnostic_id']);
      assert.deepEqual(
        diagnostic,
        {
          schema_version: '1.0', diagnostic_id: 'local-pause-001', change_id: body.change_id, command_id: body.command_id,
          operation: 'applyControllerCommand', reason: 'EVIDENCE_REF_UNAVAILABLE', next_action: 'IDENTICAL_COMMAND_REPLAY', request_idempotency_id: body.idempotency_id,
          request_sha256: sha256(command.command_body_bytes), state_version: readyState.state_version, state_hash: sha256(readyWrite.request.next_bytes),
          expected_evidence_tip: null, event_id: null, expected_event_hash: null, created_at: '2026-08-25T00:00:00.000Z', supersedes_diagnostic_id: null,
        },
      );
      assert.deepEqual(fileObservation, { kind: 'PRESENT_FILE', bytes: pauseCalls[0].request.next_bytes, sha256: sha256(pauseCalls[0].request.next_bytes) });
      assert.equal(harness.count('ledger.prepareAppend'), 0); assert.equal(harness.count('ledger.commitAndPush'), 0);
      assert.equal(harness.count('git.createOrReuseWorktree'), 0); assert.equal(harness.count('git.inspectWorktree'), 0);
    });
  });
}
// R175_STATE_FIRST_WRITE_END

// R219_F2_BEGIN — real FileState plus the existing strict four-method Ledger
// Port; no Test Core, primed state, production composition, or status rewrite.
const R216_STATUS_KEYS = ['active_change_id', 'candidate', 'delivery', 'local_pause', 'macro_state', 'orphan_ready', 'pending_action', 'phase', 'pointer_status', 'state_hash', 'state_version'];
const R216_PAUSE_KEYS = ['change_id', 'command_id', 'created_at', 'diagnostic_id', 'event_id', 'expected_event_hash', 'expected_evidence_tip', 'next_action', 'operation', 'reason', 'request_idempotency_id', 'request_sha256', 'schema_version', 'state_hash', 'state_version', 'supersedes_diagnostic_id'];

async function withR216RealCore(action, { retainFormal = false } = {}) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'juanerai-r216-f2-'));
  let stateRoot = null; let calls = []; let formalOperations = []; let actionError = null;
  const errorRecord = error => error === null ? null : { name: error?.name ?? 'Error', message: error?.message ?? String(error), code: error?.code ?? null };
  const inventory = async directory => {
    const entries = [];
    for (const relative of (await readdir(directory, { recursive: true })).sort()) {
      const absolute = path.join(directory, relative); const stat = await lstat(absolute); const content = stat.isFile() ? await readFile(absolute) : stat.isSymbolicLink() ? Buffer.from(await readlink(absolute)) : null;
      entries.push({ relative, type: stat.isFile() ? 'file' : stat.isDirectory() ? 'directory' : stat.isSymbolicLink() ? 'symlink' : 'other', mode: stat.mode & 0o7777, byte_length: content?.length ?? null, sha256: content === null ? null : sha256(content), content_base64: content === null ? null : content.toString('base64') });
    }
    return entries;
  };
  const observeF2GitChildren = async (directory, action) => {
    const events = []; const admitted = new WeakSet(); const attached = new WeakMap(); const attach = child => { if (!admitted.has(child) || attached.has(child)) return; const event = { pid: child.pid ?? null, spawnfile: child.spawnfile ?? null, spawnargs: [...(child.spawnargs ?? [])], stdout: [], stderr: [], close: null, error: null }; events.push(event); attached.set(child, event); child.stdout?.on('data', value => event.stdout.push(Buffer.from(value))); child.stderr?.on('data', value => event.stderr.push(Buffer.from(value))); child.once('close', (code, signal) => { event.close = { code, signal }; }); child.once('error', error => { event.error = errorRecord(error); }); };
    const start = message => { const child = message?.process; const cwd = message?.options?.cwd; if (child && message?.options?.file === GIT && typeof cwd === 'string' && (cwd === directory || cwd.startsWith(`${directory}${path.sep}`))) admitted.add(child); }; const end = message => { const child = message?.process; if (child) process.nextTick(() => attach(child)); }; const failure = message => { const child = message?.process; if (child && admitted.has(child)) { attach(child); const event = attached.get(child); if (event) event.error = errorRecord(message.error); } };
    const startChannel = channel('tracing:child_process.spawn:start'); const endChannel = channel('tracing:child_process.spawn:end'); const errorChannel = channel('tracing:child_process.spawn:error'); startChannel.subscribe(start); endChannel.subscribe(end); errorChannel.subscribe(failure); let value = null; let thrown = null; let actionError = null; try { value = await action(); } catch (error) { thrown = error; actionError = errorRecord(error); } finally { startChannel.unsubscribe(start); endChannel.unsubscribe(end); errorChannel.unsubscribe(failure); }
    return { value, thrown, action_error: actionError, children: events.map(event => ({ pid: event.pid, spawnfile: event.spawnfile, spawnargs: event.spawnargs, stdout_base64: Buffer.concat(event.stdout).toString('base64'), stderr_base64: Buffer.concat(event.stderr).toString('base64'), close: event.close, error: event.error })) };
  };
  try {
    stateRoot = await realpath(root); const pointerPath = path.join(stateRoot, 'active-change.json');
    await writeFile(pointerPath, canonicalJson({ schema_version: '1.0', active_change_id: null }));
    if (retainFormal) { await writeFile(path.join(stateRoot, 'R220-formal-root.json'), canonicalJson({ schema_version: '1.0', kind: 'R220_F2_FORMAL_ROOT', root: stateRoot, phase: 'PRE_OPERATION', inventory: await inventory(stateRoot), calls: [] })); console.error(`R220-F2-FORMAL-ROOT=${stateRoot}`); }
    const state = createFileState(stateRoot); const ledgerRoot = path.join(stateRoot, 'ledger'); await mkdir(ledgerRoot, { recursive: true }); const ledgerObserved = await observeF2GitChildren(stateRoot, async () => createLocalBareLedger(ledgerRoot, CHANGE_ID)); formalOperations.push({ name: 'bootstrap-local-ledger', input: { state_root: stateRoot, ledger_root: ledgerRoot }, outcome: { action_error: ledgerObserved.action_error, value: ledgerObserved.value === null ? null : { kind: 'CREATED' }, children: ledgerObserved.children } }); if (ledgerObserved.action_error !== null) throw new Error(`R220_F2_LEDGER_BOOTSTRAP_FAILED: ${ledgerObserved.action_error.message}`); const ledger = ledgerObserved.value;
    const harness = makeTestDependencies(); let mutexAttempts = 0; let mutexReleases = 0; const delegatedMutexAcquire = harness.dependencies.mutex.tryAcquire.bind(harness.dependencies.mutex); const delegatedMutexRelease = harness.dependencies.mutex.release.bind(harness.dependencies.mutex); harness.dependencies.mutex.tryAcquire = async (...args) => { mutexAttempts += 1; return delegatedMutexAcquire(...args); }; harness.dependencies.mutex.release = async (...args) => { mutexReleases += 1; return delegatedMutexRelease(...args); }; calls = [];
    const observedRequest = request => request === undefined ? { $undefined: true } : structuredClone(request);
    const observedState = Object.freeze(Object.fromEntries(['readPointer', 'writePointer', 'readState', 'writeState', 'readLocalPause', 'writeLocalPause'].map(method => [method, async request => {
      const call = { boundary: 'state', method, request: observedRequest(request), result: null, error: null, native_children: null }; calls.push(call); const observed = await observeF2GitChildren(stateRoot, () => state[method](request)); call.native_children = observed.children; if (observed.thrown !== null) { call.error = errorRecord(observed.thrown); throw observed.thrown; } call.result = structuredClone(observed.value); return observed.value;
    }])));
    const observeLedger = actual => Object.freeze(Object.fromEntries(['readRemote', 'prepareAppend', 'commitAndPush', 'readRemoteAppend'].map(method => [method, async request => {
      const call = { boundary: 'ledger', method, request: observedRequest(request), result: null, error: null, native_children: null }; calls.push(call); const observed = await observeF2GitChildren(stateRoot, () => actual[method](request)); call.native_children = observed.children; if (observed.thrown !== null) { call.error = errorRecord(observed.thrown); throw observed.thrown; } call.result = structuredClone(observed.value); return observed.value;
    }])));
    const observedLedger = observeLedger(ledger);
    const dependencies = Object.freeze({ ...harness.dependencies, state: observedState, ledger: observedLedger });
    const core = createCoordinatorCore(dependencies);
    if (retainFormal) await writeFile(path.join(stateRoot, 'R220-formal-pre-action.json'), canonicalJson({ schema_version: '1.0', kind: 'R220_F2_FORMAL_ROOT', root: stateRoot, phase: 'PRE_ACTION', inventory: await inventory(stateRoot), calls, formal_operations: formalOperations }));
    const retainFormalOperation = (name, input, outcome) => formalOperations.push({ name, input: structuredClone(input), outcome: structuredClone(outcome) });
    const capturePublicOperation = async (name, input, operation) => { let preInventory = null; let preInventoryError = null; try { preInventory = await inventory(stateRoot); } catch (error) { preInventoryError = errorRecord(error); } const pre = { phase: 'PRE', input: structuredClone(input), inventory: preInventory, inventory_error: preInventoryError, call_count: calls.length, harness_calls: structuredClone(harness.calls), mutex_attempts: mutexAttempts, mutex_releases: mutexReleases }; if (retainFormal) retainFormalOperation(name, pre, { kind: 'PENDING' }); if (preInventoryError !== null) { if (retainFormal) retainFormalOperation(name, { phase: 'RESULT', input: structuredClone(input), call_count: calls.length, harness_calls: structuredClone(harness.calls), mutex_attempts: mutexAttempts, mutex_releases: mutexReleases }, { kind: 'COLLECTION_FAILED', error: preInventoryError }); const collectionFailure = new Error(`R220_F2_PRE_COLLECTION_FAILED: ${preInventoryError.message}`); collectionFailure.code = preInventoryError.code; throw collectionFailure; } const observed = await observeF2GitChildren(stateRoot, operation); const outcome = observed.thrown === null ? { kind: 'RETURNED', value: observed.value, children: observed.children } : { kind: 'THREW', error: errorRecord(observed.thrown), children: observed.children }; if (retainFormal) retainFormalOperation(name, { phase: 'RESULT', input: structuredClone(input), call_count: calls.length, harness_calls: structuredClone(harness.calls), mutex_attempts: mutexAttempts, mutex_releases: mutexReleases }, outcome); let postInventory = null; let postInventoryError = null; try { postInventory = await inventory(stateRoot); } catch (error) { postInventoryError = errorRecord(error); } if (retainFormal) retainFormalOperation(name, { phase: 'POST_COLLECTION', post_inventory: postInventory, post_inventory_error: postInventoryError, call_count: calls.length, harness_calls: structuredClone(harness.calls), mutex_attempts: mutexAttempts, mutex_releases: mutexReleases }, { kind: postInventoryError === null ? 'COLLECTED' : 'COLLECTION_FAILED', error: postInventoryError }); if (postInventoryError !== null && observed.thrown === null) { const collectionFailure = new Error(`R220_F2_POST_COLLECTION_FAILED: ${postInventoryError.message}`); collectionFailure.code = postInventoryError.code; throw collectionFailure; } if (observed.thrown !== null) throw observed.thrown; return observed.value; };
    const formalOperation = name => { const records = formalOperations.filter(record => record.name === name); const pre = records.find(record => record.input?.phase === 'PRE'); const result = records.find(record => record.input?.phase === 'RESULT'); const post = records.find(record => record.input?.phase === 'POST_COLLECTION'); if (!pre || !result || !post) throw new Error(`R220_F2_FORMAL_OPERATION_MISSING:${name}`); return structuredClone({ pre, result, post }); };
    const actionContext = { core, dependencies, state, stateRoot, pointerPath, calls, harness, ledger, observeLedger, formal_root: root, mutexAttempts: () => mutexAttempts, mutexReleases: () => mutexReleases, retainFormalOperation, formalOperation, capturePublicOperation }; try { await action(actionContext); } catch (error) { throw error; }
  } catch (error) { actionError = error; throw error; }
  finally {
    let collectionError = null;
    if (retainFormal) {
      const formalRoot = stateRoot ?? root;
      try {
        const record = { schema_version: '1.0', kind: 'R220_F2_FORMAL_ROOT', root: formalRoot, phase: 'POST_OPERATION', action_error: errorRecord(actionError), inventory: await inventory(formalRoot), calls, formal_operations: formalOperations };
        const formalPath = path.join(formalRoot, 'R220-formal-root.json'); await writeFile(formalPath, canonicalJson(record)); const formalReadback = JSON.parse(await readFile(formalPath, 'utf8')); assert.deepEqual(formalReadback.calls.map(call => Object.keys(call).sort()), record.calls.map(call => Object.keys(call).sort()), 'formal JSON readback retains every recorded call key'); console.error(`R220-F2-FORMAL=${JSON.stringify({ root: formalRoot, action_error: record.action_error, inventory_count: record.inventory.length, call_count: calls.length })}`);
      } catch (error) { collectionError = errorRecord(error); console.error(`R220-F2-FORMAL-COLLECTION-ERROR=${JSON.stringify({ root: formalRoot, collection_error: collectionError, action_error: errorRecord(actionError), facts: { calls, formal_operations: formalOperations } })}`); }
    }
    if (!retainFormal) await rm(root, { recursive: true, force: true });
    if (actionError === null && collectionError !== null) throw new Error(`R220_F2_FORMAL_COLLECTION_FAILED: ${collectionError.message}`);
  }
}

test('TEST-DTF-R1-002 / R216 F2: public STATUS and READY recovery use real State and strict Ledger authority', { timeout: 30_000 }, async t => {
  const withR216FormalCore = action => withR216RealCore(action, { retainFormal: true });
  const formalEvidence = (context, name) => {
    const evidence = context.formalOperation(name); const { pre, result, post } = evidence;
    assert.equal(pre.input.inventory_error, null, `${name} retains a usable physical PRE inventory`);
    assert.equal(post.input.post_inventory_error, null, `${name} retains a usable physical POST inventory`);
    assert.equal(result.outcome.kind, 'RETURNED', `${name} records its public outcome before fallible POST collection`);
    assert.equal(post.outcome.kind, 'COLLECTED'); assert.ok(Array.isArray(pre.input.inventory)); assert.ok(Array.isArray(post.input.post_inventory));
    assert.ok(Array.isArray(pre.input.harness_calls)); assert.ok(Array.isArray(result.input.harness_calls));
    return { evidence, operationCalls: context.calls.slice(pre.input.call_count, result.input.call_count), harnessCalls: result.input.harness_calls.slice(pre.input.harness_calls.length) };
  };
  const changedInventoryPaths = ({ pre, post }) => {
    const index = values => new Map(values.map(value => [value.relative, canonicalJson(value)])); const before = index(pre.input.inventory); const after = index(post.input.post_inventory);
    return [...new Set([...before.keys(), ...after.keys()])].filter(relative => before.get(relative) !== after.get(relative)).sort();
  };
  const assertNoRecoveryEffects = (context, name, { allowHarness = ['verifier.verify'], mutex = 'zero' } = {}) => {
    const { evidence, operationCalls, harnessCalls } = formalEvidence(context, name);
    assert.deepEqual(changedInventoryPaths(evidence), [], `${name} leaves the full State/pointer/pause/files/refs/objects inventory unchanged`);
    const acquired = evidence.result.input.mutex_attempts - evidence.pre.input.mutex_attempts; const released = evidence.result.input.mutex_releases - evidence.pre.input.mutex_releases; if (mutex === 'zero') assert.deepEqual({ acquired, released }, { acquired: 0, released: 0 }, `${name} does not acquire the mutation mutex`); else assert.deepEqual({ acquired, released }, { acquired: 1, released: 1 }, `${name} serializes the exact command with one acquire/release pair`); assert.equal(operationCalls.some(call => ['writePointer', 'writeState', 'writeLocalPause', 'prepareAppend', 'commitAndPush'].includes(call.method)), false, `${name} has no State or Ledger mutation`);
    assert.equal(harnessCalls.some(call => !allowHarness.includes(call.name) && (/^git\./.test(call.name) || call.name === 'validation.execute' || /^pull_request\./.test(call.name) || call.name === 'handoff.writeReadback')), false, `${name} has no Worktree/Git/validation/Candidate/PR/Handoff effect`);
    return { evidence, operationCalls, harnessCalls };
  };
  const snapshotRecoveryState = async context => ({ state: await context.state.readState({ change_id: CHANGE_ID }), pause: await context.state.readLocalPause({}) });
  const assertRunStopOnly = async (context, name, run, pre) => {
    const { evidence, operationCalls, harnessCalls } = formalEvidence(context, name); const changed = changedInventoryPaths(evidence);
    assert.equal(operationCalls.some(call => ['writePointer', 'prepareAppend', 'commitAndPush'].includes(call.method)), false, `${name} cannot advance pointer or Ledger`);
    assert.equal(harnessCalls.some(call => /^git\./.test(call.name) || call.name === 'validation.execute' || /^pull_request\./.test(call.name) || call.name === 'handoff.writeReadback'), false, `${name} cannot create a Worktree, Agent, validation, Candidate, PR, or Handoff effect`);
    const stateWrites = operationCalls.filter(call => call.boundary === 'state' && call.method === 'writeState'); const pauseWrites = operationCalls.filter(call => call.boundary === 'state' && call.method === 'writeLocalPause'); assert.ok(stateWrites.length <= 1); assert.ok(pauseWrites.length <= 1);
    const post = await snapshotRecoveryState(context); const allowedChanges = []; if (stateWrites.length === 1) { const write = stateWrites[0].request; assert.equal(pre.state.kind, 'OK', `${name} cannot invent a State CAS from an absent pre-State`); const beforeState = JSON.parse(pre.state.value.bytes); assert.deepEqual({ change_id: write.change_id, expected_version: write.expected_version, expected_sha256: write.expected_sha256 }, { change_id: CHANGE_ID, expected_version: beforeState.state_version, expected_sha256: pre.state.value.sha256 }); const next = JSON.parse(write.next_bytes); assert.equal(canonicalJson(next), write.next_bytes); assert.deepEqual({ macro_state: next.macro_state, phase: next.phase, state_version: next.state_version, change_id: next.change_id }, { macro_state: 'BLOCKED', phase: null, state_version: beforeState.state_version + 1, change_id: CHANGE_ID }); assert.equal(post.state.kind, 'OK'); assert.equal(post.state.value.bytes, write.next_bytes); assert.equal(post.state.value.sha256, sha256(write.next_bytes)); allowedChanges.push(`changes/${CHANGE_ID}/state.json`); } else assert.deepEqual(post.state, pre.state, `${name} retains the exact pre-State bytes when no stop State CAS occurs`);
    if (pauseWrites.length === 1) { const write = pauseWrites[0].request; assert.equal(write.expected_sha256, pre.pause.kind === 'OK' ? pre.pause.value.sha256 : null); const pause = JSON.parse(write.next_bytes); assert.equal(canonicalJson(pause), write.next_bytes); assert.deepEqual(Object.keys(pause).sort(), R216_PAUSE_KEYS); assert.deepEqual({ change_id: pause.change_id, operation: pause.operation, request_sha256: pause.request_sha256, state_version: pause.state_version, state_hash: pause.state_hash }, { change_id: CHANGE_ID, operation: 'run', request_sha256: sha256(canonicalJson({ change_id: CHANGE_ID, expected_state_version: pre.state.kind === 'OK' ? JSON.parse(pre.state.value.bytes).state_version : 0, expected_state_hash: pre.state.kind === 'OK' ? pre.state.value.sha256 : SHA256 })), state_version: pre.state.kind === 'OK' ? JSON.parse(pre.state.value.bytes).state_version : null, state_hash: pre.state.kind === 'OK' ? pre.state.value.sha256 : null }); assert.equal(post.pause.kind, 'OK'); assert.equal(post.pause.value.bytes, write.next_bytes); assert.equal(post.pause.value.sha256, sha256(write.next_bytes)); allowedChanges.push('local-pause.json'); } else assert.deepEqual(post.pause, pre.pause, `${name} retains the exact pre-pause bytes when no durable diagnostic occurs`);
    assert.deepEqual(changed, allowedChanges, `${name} changes exactly the existing CAS State and/or exact LocalPause selected above`); if (stateWrites.length === 1) { const before = JSON.parse(pre.state.value.bytes); const next = JSON.parse(stateWrites[0].request.next_bytes); assert.deepEqual({ state_version: run.state_version, state_hash: run.state_hash }, { state_version: next.state_version, state_hash: sha256(stateWrites[0].request.next_bytes) }); assert.deepEqual(next, { ...before, macro_state: 'BLOCKED', phase: null, pending_agent: null, blocked_reason: run.payload.blocked_reason, resume_target: null, state_version: before.state_version + 1 }); }
    if (pauseWrites.length === 1) { const before = pre.state.kind === 'OK' ? JSON.parse(pre.state.value.bytes) : null; const pause = JSON.parse(pauseWrites[0].request.next_bytes); assert.deepEqual(pause, { schema_version: '1.0', diagnostic_id: 'local-pause-001', change_id: before?.change_id ?? null, command_id: before?.authorization_cycle?.command_id ?? null, operation: 'run', reason: run.payload.blocked_reason, next_action: run.payload.next_action, request_idempotency_id: 'local-pause-request-001', request_sha256: sha256(canonicalJson({ change_id: CHANGE_ID, expected_state_version: before?.state_version ?? 0, expected_state_hash: pre.state.kind === 'OK' ? pre.state.value.sha256 : SHA256 })), state_version: before?.state_version ?? null, state_hash: pre.state.kind === 'OK' ? pre.state.value.sha256 : null, expected_evidence_tip: null, event_id: null, expected_event_hash: null, created_at: '2026-08-25T00:00:00.000Z', supersedes_diagnostic_id: null }, `${name} pause is the complete existing diagnostic bound to its exact PRE State/CAS/request/result`); }
    return { evidence, operationCalls, harnessCalls };
  };
  const assertNativeGitCompletion = async (context, name, nativeLog) => {
    const ledgerCwd = path.join(context.stateRoot, 'ledger'); const target = path.join(ledgerCwd, 'ledger-origin.git'); const evidenceArgs = ['--git-dir', target, 'rev-parse', '--verify', 'refs/heads/evidence/agent-runs']; assert.ok(Array.isArray(nativeLog.children)); assert.ok(nativeLog.children.length > 0, 'the child actually observed its own native Git boundary');
    for (const child of nativeLog.children) { assert.deepEqual(Object.keys(child).sort(), ['argv', 'close', 'cwd', 'error', 'executable', 'pid', 'stderr_base64', 'stdout_base64', 'target']); assert.equal(child.executable, GIT); assert.equal(child.cwd, ledgerCwd); assert.equal(child.target, target); assert.ok(Array.isArray(child.argv)); assert.ok(child.argv.length > 0); assert.equal(Buffer.from(child.stdout_base64, 'base64').toString('base64'), child.stdout_base64); assert.equal(Buffer.from(child.stderr_base64, 'base64').toString('base64'), child.stderr_base64); assert.equal(child.error, null); assert.ok(child.close !== null); assert.equal(Number.isInteger(child.close.code) || child.close.code === null, true); assert.equal(typeof child.close.signal === 'string' || child.close.signal === null, true); }
    const evidenceReads = nativeLog.children.filter(child => canonicalJson(child.argv) === canonicalJson(evidenceArgs)); assert.ok(evidenceReads.length >= 1, 'the child has at least one fixed physical Evidence-ref observation'); const successfulTips = new Set(evidenceReads.filter(child => child.close.code === 0 && child.close.signal === null).map(child => Buffer.from(child.stdout_base64, 'base64').toString('utf8').trim()).filter(tip => /^[0-9a-f]{40}$/.test(tip))); const expected = child => canonicalJson(child.argv) === canonicalJson(evidenceArgs) || [...successfulTips].some(tip => canonicalJson(child.argv) === canonicalJson(['--git-dir', target, 'show', `${tip}:ledger/${CHANGE_ID}.jsonl`]) || canonicalJson(child.argv) === canonicalJson(['--git-dir', target, 'rev-parse', `${tip}^{tree}`]) || canonicalJson(child.argv) === canonicalJson(['--git-dir', target, 'rev-parse', `${tip}^`]));
    const provenParentTips = new Set(); for (const [index, child] of nativeLog.children.entries()) { assert.equal(expected(child), true, `${name} rejects every unexpected native Git command`); if (child.close.code === 0) continue; assert.equal(child.close.signal, null); if (canonicalJson(child.argv) === canonicalJson(evidenceArgs)) { assert.notEqual(child.close.code, 0); assert.equal(Buffer.from(child.stdout_base64, 'base64').toString('utf8'), '', 'an empty Evidence-ref probe has actual empty stdout'); const namespaceArgs = ['--git-dir', target, 'for-each-ref', '--format=%(refname)', 'refs/heads/evidence/agent-runs']; const enumerationName = `${name}-native-empty-ref-enumeration-${index}`; const enumeration = await context.capturePublicOperation(enumerationName, { git_dir: target, namespace: 'refs/heads/evidence/agent-runs' }, () => run(GIT, namespaceArgs, { cwd: ledgerCwd, env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' } })); assert.equal(enumeration.code, 0, enumeration.stderr); assert.equal(enumeration.signal, null); assert.equal(enumeration.stderr, '', 'successful exact-ref enumeration cannot carry a diagnostic failure'); assert.equal(enumeration.stdout, '', 'successful exact-ref enumeration establishes absence from the accessible bare namespace'); assertNoRecoveryEffects(context, enumerationName, { allowHarness: [] }); continue; } const tip = [...successfulTips].find(candidate => canonicalJson(child.argv) === canonicalJson(['--git-dir', target, 'rev-parse', `${candidate}^`])); assert.ok(tip, 'a nonzero command is only an exact parent check of a physical Evidence-ref tip'); if (provenParentTips.has(tip)) continue; provenParentTips.add(tip); const headerName = `${name}-native-parent-header-${tip}`; const header = await context.capturePublicOperation(headerName, { git_dir: target, tip }, () => run(GIT, ['--git-dir', target, 'cat-file', 'commit', tip], { cwd: ledgerCwd, env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' } })); assert.equal(header.code, 0, header.stderr); assert.equal(header.signal, null); const parents = Buffer.from(header.stdout).toString('utf8').split('\n\n', 1)[0].split('\n').filter(line => line.startsWith('parent ')); assert.deepEqual(parents, [], 'only physical commit headers establish this first-tip parent absence'); assertNoRecoveryEffects(context, headerName, { allowHarness: [] }); }
  };
  const assertChildStateObservation = (nativeLog, { statusOnly = false } = {}) => {
    assert.deepEqual(Object.keys(nativeLog.child_state).sort(), ['post', 'pre']); assert.ok(Array.isArray(nativeLog.state_calls)); assert.ok(Array.isArray(nativeLog.attempted_mutations)); assert.deepEqual(nativeLog.attempted_mutations, nativeLog.state_calls.filter(call => ['writePointer', 'writeState', 'writeLocalPause'].includes(call.method)), 'child reports every actual State mutation attempt from its locally delegated State'); for (const call of nativeLog.state_calls) { assert.deepEqual(Object.keys(call).sort(), ['error', 'method', 'request', 'result']); assert.equal(call.error, null); }
    assert.notEqual(nativeLog.child_state.pre, null); assert.notEqual(nativeLog.child_state.post, null); assert.equal(nativeLog.child_state.post.collection_error ?? null, null, 'child finally retains its own post-State observation');
    const pre = nativeLog.child_state.pre; const post = nativeLog.child_state.post; assert.equal(pre.pause?.kind === 'OK' || pre.pause?.kind === 'ABSENT', true); assert.equal(post.pause?.kind === 'OK' || post.pause?.kind === 'ABSENT', true);
    if (statusOnly) { assert.equal(nativeLog.attempted_mutations.length, 0, 'child STATUS attempts no State mutation'); assert.equal(pre.state?.kind === 'OK' || pre.state?.kind === 'ABSENT', true); assert.equal(post.state?.kind === 'OK' || post.state?.kind === 'ABSENT', true); assert.deepEqual(post, pre, 'child STATUS leaves its directly delegated State/pause observations unchanged'); return; }
    assert.equal(pre.state?.kind, 'OK'); assert.equal(post.state?.kind, 'OK');
    const before = JSON.parse(pre.state.value.bytes); const after = JSON.parse(post.state.value.bytes); const pointerWrites = nativeLog.attempted_mutations.filter(call => call.method === 'writePointer'); const stateWrites = nativeLog.attempted_mutations.filter(call => call.method === 'writeState'); const pauseWrites = nativeLog.attempted_mutations.filter(call => call.method === 'writeLocalPause'); assert.equal(pointerWrites.length, 0, 'no-tuple RUN cannot progress the pointer'); assert.equal(stateWrites.length, 1, 'no-tuple RUN performs its one actual State CAS'); assert.deepEqual({ change_id: stateWrites[0].request.change_id, expected_version: stateWrites[0].request.expected_version, expected_sha256: stateWrites[0].request.expected_sha256 }, { change_id: CHANGE_ID, expected_version: before.state_version, expected_sha256: pre.state.value.sha256 }); assert.equal(stateWrites[0].result.kind, 'OK'); assert.deepEqual(stateWrites[0].result.value, { bytes: stateWrites[0].request.next_bytes, sha256: sha256(stateWrites[0].request.next_bytes) }); assert.equal(post.state.value.bytes, stateWrites[0].request.next_bytes); assert.deepEqual(after, { ...before, macro_state: 'BLOCKED', phase: null, pending_agent: null, blocked_reason: nativeLog.outcome.value.payload.blocked_reason, resume_target: null, state_version: before.state_version + 1 }, 'child-owned State readback retains exactly the existing stop transition'); assert.equal(post.state.value.sha256, sha256(post.state.value.bytes)); assert.deepEqual({ state_version: nativeLog.outcome.value.state_version, state_hash: nativeLog.outcome.value.state_hash }, { state_version: after.state_version, state_hash: post.state.value.sha256 }, 'the full public RUN result binds the actual CAS/readback identity'); assert.equal(pauseWrites.length, 0, 'the healthy no-tuple State stop does not manufacture a pause'); assert.deepEqual(post.pause, pre.pause, 'the healthy no-tuple State stop preserves the exact pause readback');
  };
  const assertChildPersistentEffects = (context, name, { statusOnly = false } = {}) => {
    const { evidence } = formalEvidence(context, name); const changed = changedInventoryPaths(evidence); if (statusOnly) { assert.deepEqual(changed, [], `${name} STATUS child preserves all persistent State/pointer/pause/files/refs/objects`); return evidence; }
    assert.deepEqual(changed, [`changes/${CHANGE_ID}/state.json`], `${name} healthy no-tuple child changes only its actual stop State`); const entry = (values, relative) => values.find(value => value.relative === relative) ?? null; const beforeState = entry(evidence.pre.input.inventory, `changes/${CHANGE_ID}/state.json`); const afterState = entry(evidence.post.input.post_inventory, `changes/${CHANGE_ID}/state.json`); assert.ok(beforeState && afterState); const before = JSON.parse(Buffer.from(beforeState.content_base64, 'base64').toString('utf8')); const after = JSON.parse(Buffer.from(afterState.content_base64, 'base64').toString('utf8')); assert.deepEqual({ change_id: after.change_id, macro_state: after.macro_state, phase: after.phase, state_version: after.state_version }, { change_id: CHANGE_ID, macro_state: 'BLOCKED', phase: null, state_version: before.state_version + 1 });
    return evidence;
  };
  await t.test('EMPTY STATUS has the exact eleven-field nullability oracle without effects', async () => {
    await withR216FormalCore(async context => {
      const { core, calls, harness, capturePublicOperation } = context;
      const before = calls.length;
      const empty = await capturePublicOperation('status-empty', { change_id: null }, () => core.status({ change_id: null }));
      assert.deepEqual(Object.keys(empty.payload).sort(), R216_STATUS_KEYS);
      assert.deepEqual(empty.payload, { pointer_status: 'EMPTY', active_change_id: null, macro_state: null, phase: null, state_version: null, state_hash: null, pending_action: null, candidate: null, delivery: null, orphan_ready: null, local_pause: null });
      const operationCalls = calls.slice(before); assert.equal(operationCalls.some(call => ['writePointer', 'writeState', 'writeLocalPause', 'prepareAppend', 'commitAndPush', 'readRemoteAppend'].includes(call.method)), false); assert.equal(harness.count('git.createOrReuseWorktree'), 0); assertNoRecoveryEffects(context, 'status-empty', { allowHarness: [] });
    });
  });

  await t.test('READY STATUS derives the exact eleven-field projection from physical canonical State', async () => {
    await withR216FormalCore(async context => {
      const { core, calls, harness, state, capturePublicOperation } = context;
      const dispatchInput = signed(); const dispatch = await capturePublicOperation('ready-dispatch', dispatchInput, () => core.applyControllerCommand(dispatchInput));
      assertExactResult(dispatch, { operation: 'applyControllerCommand', outcome: 'APPLIED', state: 'READY' });
      const before = calls.length; const ready = await capturePublicOperation('status-ready', { change_id: null }, () => core.status({ change_id: null }));
      assert.deepEqual(Object.keys(ready.payload).sort(), R216_STATUS_KEYS);
      const persisted = await state.readState({ change_id: CHANGE_ID }); assert.equal(persisted.kind, 'OK'); assert.equal(sha256(persisted.value.bytes), dispatch.state_hash); const stateValue = JSON.parse(persisted.value.bytes);
      assert.deepEqual(ready.payload, { pointer_status: 'ACTIVE', active_change_id: CHANGE_ID, macro_state: stateValue.macro_state, phase: stateValue.phase, state_version: stateValue.state_version, state_hash: sha256(persisted.value.bytes), pending_action: stateValue.pending_agent ? { kind: 'AGENT_SETTLEMENT', correlation_id: stateValue.pending_agent.correlation_id } : null, candidate: stateValue.candidate, delivery: stateValue.delivery, orphan_ready: null, local_pause: null });
      const operationCalls = calls.slice(before); assert.equal(operationCalls.some(call => call.method === 'readRemoteAppend'), false, 'STATUS must use the strict complete Ledger read path, never the old append-readback request'); assert.equal(operationCalls.some(call => ['writePointer', 'writeState', 'writeLocalPause', 'prepareAppend', 'commitAndPush'].includes(call.method)), false); assert.ok(operationCalls.some(call => call.boundary === 'ledger' && call.method === 'readRemote'), 'READY projection rechecks the strict Ledger record');
      const strict = operationCalls.filter(call => call.boundary === 'ledger' && call.method === 'readRemote'); assert.equal(strict.length, 1); const strictValue = strict[0].result.value; assert.equal(strict[0].result.kind, 'OK'); assert.equal(strictValue.file_present, true); assert.equal(strictValue.authoritative_path, `ledger/${CHANGE_ID}.jsonl`); assert.equal(/^[0-9a-f]{40}$/.test(strictValue.tip), true); assert.equal(/^[0-9a-f]{40}$/.test(strictValue.tip_tree), true);
      const strictRequest = { change_id: CHANGE_ID, expected_tip: null, remote_ref: 'refs/heads/evidence/agent-runs' }; assert.deepEqual(strict[0].request, strictRequest, 'healthy strict read uses the closed fixed request, not receipt-derived authority'); assert.deepEqual(Object.keys(strict[0].result).sort(), ['kind', 'receipt_sha256', 'value']); assert.deepEqual(Object.keys(strictValue).sort(), ['authoritative_path', 'expected_tip', 'file_present', 'last_event_hash', 'last_event_id', 'last_sequence', 'ledger_bytes_base64', 'prior_byte_length', 'prior_bytes_sha256', 'remote_ref', 'tip', 'tip_parent', 'tip_tree']); assert.deepEqual({ remote_ref: strictValue.remote_ref, expected_tip: strictValue.expected_tip }, { remote_ref: strictRequest.remote_ref, expected_tip: strictRequest.expected_tip });
      const physical = await capturePublicOperation('status-ready-physical-ledger-readback', { git_dir: path.join(context.stateRoot, 'ledger', 'ledger-origin.git'), remote_ref: strictRequest.remote_ref, tip: strictValue.tip, path: strictValue.authoritative_path }, async () => { const gitDir = path.join(context.stateRoot, 'ledger', 'ledger-origin.git'); const ref = await run(GIT, ['--git-dir', gitDir, 'rev-parse', '--verify', strictRequest.remote_ref], { cwd: context.stateRoot, env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' } }); const bytes = await run(GIT, ['--git-dir', gitDir, 'show', `${strictValue.tip}:${strictValue.authoritative_path}`], { cwd: context.stateRoot, env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' } }); const tree = await run(GIT, ['--git-dir', gitDir, 'rev-parse', `${strictValue.tip}^{tree}`], { cwd: context.stateRoot, env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' } }); return { ref, bytes, tree }; }); assert.equal(physical.ref.code, 0, physical.ref.stderr); assert.equal(physical.ref.signal, null); assert.equal(physical.ref.stdout.trim(), strictValue.tip); assert.equal(physical.bytes.code, 0, physical.bytes.stderr); assert.equal(physical.tree.code, 0, physical.tree.stderr); const rawLedger = Buffer.from(strictValue.ledger_bytes_base64, 'base64'); assert.deepEqual(Buffer.from(physical.bytes.stdout), rawLedger); assert.equal(rawLedger.length, strictValue.prior_byte_length); assert.equal(sha256(rawLedger), strictValue.prior_bytes_sha256); assert.equal(physical.tree.stdout.trim(), strictValue.tip_tree); assert.equal(strict[0].result.receipt_sha256, sha256(canonicalJson(strictValue))); assertNoRecoveryEffects(context, 'status-ready-physical-ledger-readback', { allowHarness: [] });
      assert.deepEqual(strict[0].request, { change_id: CHANGE_ID, expected_tip: null, remote_ref: 'refs/heads/evidence/agent-runs' }, 'healthy strict read uses the closed fixed request, not receipt-derived authority'); const commitHeaders = await capturePublicOperation('status-ready-physical-parent-header-readback', { git_dir: path.join(context.stateRoot, 'ledger', 'ledger-origin.git'), tip: strictValue.tip }, () => run(GIT, ['--git-dir', path.join(context.stateRoot, 'ledger', 'ledger-origin.git'), 'cat-file', 'commit', strictValue.tip], { cwd: context.stateRoot, env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' } })); assert.equal(commitHeaders.code, 0, commitHeaders.stderr); assert.equal(commitHeaders.signal, null); const parentHeaders = Buffer.from(commitHeaders.stdout).toString('utf8').split('\n\n', 1)[0].split('\n').filter(line => line.startsWith('parent ')).map(line => line.slice('parent '.length)); assert.deepEqual(parentHeaders, strictValue.tip_parent === null ? [] : [strictValue.tip_parent], 'physical commit headers, not a failed rev-parse convention, establish the exact parent identity'); assertNoRecoveryEffects(context, 'status-ready-physical-parent-header-readback', { allowHarness: [] });
      const lastEvent = JSON.parse(rawLedger.toString('utf8').trim().split('\n').at(-1)); const { event_hash, ...lastEventData } = lastEvent; assert.equal(event_hash, sha256(canonicalJson(lastEventData))); assert.deepEqual({ event_id: strictValue.last_event_id, event_hash: strictValue.last_event_hash, sequence: strictValue.last_sequence }, { event_id: lastEvent.event_id, event_hash: lastEvent.event_hash, sequence: lastEvent.sequence });
      const fresh = createCoordinatorCore(context.dependencies); const replay = await capturePublicOperation('status-ready-subsequent-re-admission', dispatchInput, () => fresh.applyControllerCommand(dispatchInput)); assertExactResult(replay, { operation: 'applyControllerCommand', outcome: 'ALREADY_APPLIED', state: 'READY' }); assertNoRecoveryEffects(context, 'status-ready-subsequent-re-admission', { mutex: 'one' }); assert.equal(harness.count('git.createOrReuseWorktree'), 0); assertNoRecoveryEffects(context, 'status-ready');
    });
  });

  await t.test('a signed public failure persists and projects the genuine sixteen-field LocalPause', async () => {
    await withR216FormalCore(async context => {
      const failingLedger = context.observeLedger(Object.freeze({ ...context.ledger, async readRemote() { return unavailable(null); } }));
      context.core = createCoordinatorCore({ ...context.dependencies, ledger: failingLedger });
      const failedInput = signed(); const failed = await context.capturePublicOperation('signed-failure-dispatch', failedInput, () => context.core.applyControllerCommand(failedInput)); assertExactResult(failed, { operation: 'applyControllerCommand', outcome: 'BLOCKED' });
      const stored = await context.state.readLocalPause({}); assert.equal(stored.kind, 'OK');
      const pause = JSON.parse(stored.value.bytes);
      const failedBody = JSON.parse(Buffer.from(failedInput.command_body_bytes).toString('utf8')); const persistedState = await context.state.readState({ change_id: CHANGE_ID }); assert.equal(persistedState.kind, 'OK'); const persistedValue = JSON.parse(persistedState.value.bytes);
      assert.deepEqual(Object.keys(pause).sort(), R216_PAUSE_KEYS); assert.deepEqual({ change_id: pause.change_id, command_id: pause.command_id, operation: pause.operation, reason: pause.reason, next_action: pause.next_action, request_idempotency_id: pause.request_idempotency_id, request_sha256: pause.request_sha256, state_hash: pause.state_hash, state_version: pause.state_version, expected_evidence_tip: pause.expected_evidence_tip, event_id: pause.event_id, expected_event_hash: pause.expected_event_hash, supersedes_diagnostic_id: pause.supersedes_diagnostic_id }, { change_id: CHANGE_ID, command_id: failedBody.command_id, operation: 'applyControllerCommand', reason: 'EVIDENCE_REF_UNAVAILABLE', next_action: 'IDENTICAL_COMMAND_REPLAY', request_idempotency_id: failedBody.idempotency_id, request_sha256: sha256(failedInput.command_body_bytes), state_hash: sha256(persistedState.value.bytes), state_version: persistedValue.state_version, expected_evidence_tip: null, event_id: null, expected_event_hash: null, supersedes_diagnostic_id: null }); assert.equal(typeof pause.diagnostic_id, 'string'); assert.notEqual(pause.diagnostic_id, '');
      const failedEvidence = formalEvidence(context, 'signed-failure-dispatch'); assert.equal(failedEvidence.operationCalls.some(call => call.method === 'writeLocalPause'), true, 'the signed public failure reaches the existing durable LocalPause write'); assert.equal(failedEvidence.harnessCalls.some(call => /^git\./.test(call.name) || call.name === 'validation.execute' || /^pull_request\./.test(call.name) || call.name === 'handoff.writeReadback'), false, 'signed failure cannot advance Worktree/Agent/validation/Candidate/PR/Handoff effects');
      const status = await context.capturePublicOperation('status-local-pause', { change_id: null }, () => context.core.status({ change_id: null }));
      assert.deepEqual(Object.keys(status.payload).sort(), R216_STATUS_KEYS); assert.equal(status.payload.pointer_status, 'INVALID');
      assert.deepEqual(status.payload.local_pause, pause); assert.equal(status.payload.local_pause.diagnostic_id, pause.diagnostic_id); assert.equal(await readFile(path.join(context.stateRoot, 'local-pause.json'), 'utf8'), stored.value.bytes); assertNoRecoveryEffects(context, 'status-local-pause');
      assert.equal(context.calls.filter(call => call.boundary === 'state' && call.method === 'writeLocalPause').length, 1, 'only the real signed failure writes the diagnostic');
      // The OS restart is exercised by its independently scheduled successor below.
    });
  });

  await t.test('a separately scheduled OS restart retains its own signed-pause input, native Git log, exit, and persisted projection', async () => {
    await withR216FormalCore(async context => {
      const failingLedger = context.observeLedger(Object.freeze({ ...context.ledger, async readRemote() { return unavailable(null); } })); context.core = createCoordinatorCore({ ...context.dependencies, ledger: failingLedger });
      const failedInput = signed(); const failed = await context.capturePublicOperation('restart-pause-generation', failedInput, () => context.core.applyControllerCommand(failedInput)); assertExactResult(failed, { operation: 'applyControllerCommand', outcome: 'BLOCKED' }); const stored = await context.state.readLocalPause({}); assert.equal(stored.kind, 'OK'); const pause = JSON.parse(stored.value.bytes); assert.deepEqual(Object.keys(pause).sort(), R216_PAUSE_KEYS);
      const coordinatorUrl = new URL('./coordinator.mjs', import.meta.url).href; const productionUrl = new URL('./production.mjs', import.meta.url).href; const fixturesUrl = new URL('./fixtures.mjs', import.meta.url).href;
      const program = String.raw`import { channel } from 'node:diagnostics_channel'; import { createCoordinatorCore } from ${JSON.stringify(coordinatorUrl)}; import { createFileState } from ${JSON.stringify(productionUrl)}; import { createLocalBareLedger, makeTestDependencies } from ${JSON.stringify(fixturesUrl)}; const root = process.argv[1]; const errorRecord = error => ({ name: error?.name ?? 'Error', message: error?.message ?? String(error), code: error?.code ?? null }); const observedRequest = request => request === undefined ? { $undefined: true } : structuredClone(request); const events = []; const metadata = new WeakMap(); const pendingErrors = new WeakMap(); const attached = new WeakMap(); const attach = child => { const meta = metadata.get(child); if (!meta || attached.has(child)) return; const argv = [...(child.spawnargs ?? [])].slice(1); const targetIndex = argv.indexOf('--git-dir'); const event = { pid: child.pid ?? null, executable: meta.executable, argv, cwd: meta.cwd, target: targetIndex < 0 ? null : argv[targetIndex + 1] ?? null, stdout: [], stderr: [], close: null, error: pendingErrors.get(child) ?? null }; events.push(event); attached.set(child, event); child.stdout?.on('data', value => event.stdout.push(Buffer.from(value))); child.stderr?.on('data', value => event.stderr.push(Buffer.from(value))); child.once('close', (code, signal) => { event.close = { code, signal }; }); child.once('error', error => { event.error = errorRecord(error); }); }; const start = message => { const child = message?.process; const executable = message?.options?.file; const cwd = message?.options?.cwd; if (child) metadata.set(child, { executable: executable ?? null, cwd: typeof cwd === 'string' ? cwd : null }); }; const end = message => { if (message?.process) process.nextTick(() => attach(message.process)); }; const failure = message => { const child = message?.process; const error = errorRecord(message.error); const event = attached.get(child); if (event) event.error = error; else if (child) pendingErrors.set(child, error); }; const startChannel = channel('tracing:child_process.spawn:start'); const endChannel = channel('tracing:child_process.spawn:end'); const errorChannel = channel('tracing:child_process.spawn:error'); startChannel.subscribe(start); endChannel.subscribe(end); errorChannel.subscribe(failure); let h = null; let state = null; let outcome = null; let pre_state = null; let post_state = null; const state_calls = []; let mutex_attempts = 0; let mutex_releases = 0; try { h = makeTestDependencies(); const acquire = h.dependencies.mutex.tryAcquire.bind(h.dependencies.mutex); const release = h.dependencies.mutex.release.bind(h.dependencies.mutex); h.dependencies.mutex.tryAcquire = async (...args) => { mutex_attempts += 1; return acquire(...args); }; h.dependencies.mutex.release = async (...args) => { mutex_releases += 1; return release(...args); }; const actualState = createFileState(root); const delegated = method => async request => { const call = { method, request: observedRequest(request), result: null, error: null }; state_calls.push(call); try { const result = await actualState[method](request); call.result = structuredClone(result); return result; } catch (error) { call.error = errorRecord(error); throw error; } }; state = Object.freeze(Object.fromEntries(['readPointer', 'writePointer', 'readState', 'writeState', 'readLocalPause', 'writeLocalPause'].map(method => [method, delegated(method)]))); pre_state = { state: await state.readState({ change_id: 'CHG-dual-device-transition-foundation' }), pause: await state.readLocalPause({}) }; const ledger = await createLocalBareLedger(root + '/ledger', 'CHG-dual-device-transition-foundation', [], { resume: true }); const core = createCoordinatorCore({ ...h.dependencies, state, ledger }); outcome = { kind: 'RETURNED', value: await core.status({ change_id: null }) }; process.stdout.write(JSON.stringify(outcome.value)); } catch (error) { outcome = { kind: 'THREW', error: errorRecord(error) }; throw error; } finally { if (state) { try { post_state = { state: await state.readState({ change_id: 'CHG-dual-device-transition-foundation' }), pause: await state.readLocalPause({}) }; } catch (error) { post_state = { collection_error: errorRecord(error) }; } } startChannel.unsubscribe(start); endChannel.unsubscribe(end); errorChannel.unsubscribe(failure); process.stderr.write(JSON.stringify({ kind: 'R226_F2_OS_RESTART_NATIVE_GIT', outcome, harness_calls: h?.calls ?? null, mutex_attempts, mutex_releases, child_state: { pre: pre_state, post: post_state }, state_calls, attempted_mutations: state_calls.filter(call => ['writePointer', 'writeState', 'writeLocalPause'].includes(call.method)), children: events.map(event => ({ pid: event.pid, executable: event.executable, argv: event.argv, cwd: event.cwd, target: event.target, stdout_base64: Buffer.concat(event.stdout).toString('base64'), stderr_base64: Buffer.concat(event.stderr).toString('base64'), close: event.close, error: event.error })) }) + String.fromCharCode(10)); }`;
      const childInput = { executable: process.execPath, argv: ['--input-type=module', '--eval', program, context.stateRoot], cwd: context.stateRoot, env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' } }; const child = await context.capturePublicOperation('restart-local-pause-child', childInput, () => run(childInput.executable, childInput.argv, { cwd: childInput.cwd, env: childInput.env }));
      assert.equal(child.code, 0, child.stderr); assert.equal(child.signal, null); const childResult = JSON.parse(child.stdout); assert.deepEqual(Object.keys(childResult.payload).sort(), R216_STATUS_KEYS); assert.deepEqual(childResult.payload.local_pause, pause); const nativeLog = JSON.parse(child.stderr.trim()); assert.equal(nativeLog.kind, 'R226_F2_OS_RESTART_NATIVE_GIT'); assert.equal(nativeLog.outcome.kind, 'RETURNED'); await assertNativeGitCompletion(context, 'restart-local-pause-child', nativeLog); assert.deepEqual({ mutex_attempts: nativeLog.mutex_attempts, mutex_releases: nativeLog.mutex_releases }, { mutex_attempts: 0, mutex_releases: 0 }); assert.equal(nativeLog.harness_calls.some(call => /^git\.|^validation\.|^pull_request\.|^handoff\./.test(call.name)), false); assertChildStateObservation(nativeLog, { statusOnly: true }); assertChildPersistentEffects(context, 'restart-local-pause-child', { statusOnly: true });
    });
  });

  await t.test('without a persisted safe diagnostic STATUS is the exact WIP authority rejection', async () => {
    await withR216FormalCore(async context => {
      await writeFile(context.pointerPath, '{not-canonical}');
      const before = context.calls.length; const status = await context.capturePublicOperation('status-invalid-pointer', { change_id: null }, () => context.core.status({ change_id: null }));
      assert.deepEqual(status, { schema_version: '1.0', operation: 'status', outcome: 'REJECTED', error_code: 'WIP_AUTHORITY_INVALID', change_id: null });
      const operationCalls = context.calls.slice(before); assert.equal(operationCalls.some(call => ['writePointer', 'writeState', 'writeLocalPause', 'prepareAppend', 'commitAndPush'].includes(call.method)), false); assertNoRecoveryEffects(context, 'status-invalid-pointer');
    });
  });

  await t.test('fresh Core without the signed admission tuple stops rather than manufactures READY authority', async () => {
    await withR216FormalCore(async context => {
      const { core, dependencies, calls, harness, state, capturePublicOperation } = context;
      const dispatchInput = signed(); const dispatch = await capturePublicOperation('fresh-core-initial-dispatch', dispatchInput, () => core.applyControllerCommand(dispatchInput)); assertExactResult(dispatch, { operation: 'applyControllerCommand', outcome: 'APPLIED', state: 'READY' });
      const fresh = createCoordinatorCore(dependencies);
      const before = calls.length; const preStop = await snapshotRecoveryState(context);
      const runInput = { change_id: CHANGE_ID, expected_state_version: dispatch.state_version, expected_state_hash: dispatch.state_hash }; const withoutTuple = await capturePublicOperation('fresh-core-run', runInput, () => fresh.run(runInput));
      assertExactResult(withoutTuple, { operation: 'run', outcome: 'BLOCKED', state: 'BLOCKED' }); assert.equal(withoutTuple.payload.next_action, 'MANUAL_CONTROLLER_STOP');
      assert.equal(withoutTuple.payload.blocked_reason, 'ADMISSION_EVIDENCE_UNAVAILABLE');
      const operationCalls = calls.slice(before); const after = await state.readState({ change_id: CHANGE_ID }); assert.equal(after.kind, 'OK'); assert.equal(operationCalls.some(call => call.method === 'readRemoteAppend'), false); assert.equal(operationCalls.some(call => ['prepareAppend', 'commitAndPush'].includes(call.method)), false); assert.equal(harness.count('git.createOrReuseWorktree'), 0); const stop = await assertRunStopOnly(context, 'fresh-core-run', withoutTuple, preStop); const durable = stop.operationCalls.filter(call => call.boundary === 'state' && call.method === 'writeState'); assert.equal(durable.length, 1, 'fresh Core no-admission must durably enter the existing BLOCKED State rather than return a transient result'); assert.equal(durable[0].result.kind, 'OK'); assert.deepEqual(durable[0].result.value, { bytes: durable[0].request.next_bytes, sha256: sha256(durable[0].request.next_bytes) }); assert.deepEqual({ state_version: withoutTuple.state_version, state_hash: withoutTuple.state_hash }, { state_version: JSON.parse(durable[0].request.next_bytes).state_version, state_hash: sha256(durable[0].request.next_bytes) }); const acquired = stop.evidence.result.input.mutex_attempts - stop.evidence.pre.input.mutex_attempts; const released = stop.evidence.result.input.mutex_releases - stop.evidence.pre.input.mutex_releases; assert.deepEqual({ acquired, released }, { acquired: 1, released: 1 }, 'RUN serializes its required durable admission stop with exactly one mutex acquire/release pair');
    });
  });

  await t.test('a separately fresh Core re-admits only the original exact signed tuple', async () => {
    await withR216FormalCore(async context => {
      const { core, dependencies, state, calls, harness, capturePublicOperation } = context;
      const dispatchInput = signed(); const dispatch = await capturePublicOperation('fresh-readmit-initial-dispatch', dispatchInput, () => core.applyControllerCommand(dispatchInput)); assertExactResult(dispatch, { operation: 'applyControllerCommand', outcome: 'APPLIED', state: 'READY' });
      const fresh = createCoordinatorCore(dependencies); const before = calls.length;
      const readmitInput = signed(); const reAdmitted = await capturePublicOperation('fresh-readmit-dispatch', readmitInput, () => fresh.applyControllerCommand(readmitInput)); assertExactResult(reAdmitted, { operation: 'applyControllerCommand', outcome: 'ALREADY_APPLIED', state: 'READY' });
      const readback = await state.readState({ change_id: CHANGE_ID }); assert.equal(readback.kind, 'OK'); assert.equal(sha256(readback.value.bytes), dispatch.state_hash); assert.equal(calls.slice(before).some(call => ['writePointer', 'writeState', 'writeLocalPause', 'prepareAppend', 'commitAndPush'].includes(call.method)), false); assert.equal(harness.count('git.createOrReuseWorktree'), 0); assertNoRecoveryEffects(context, 'fresh-readmit-dispatch', { mutex: 'one' });
    });
  });

  await t.test('real-Core Host readStatus forwards the same healthy public STATUS with every Host sentinel uncalled', async () => {
    await withR216FormalCore(async context => {
      const { core, dependencies, capturePublicOperation } = context;
      const dispatchInput = signed(); const dispatch = await capturePublicOperation('host-initial-dispatch', dispatchInput, () => core.applyControllerCommand(dispatchInput)); assertExactResult(dispatch, { operation: 'applyControllerCommand', outcome: 'APPLIED', state: 'READY' });
      const fresh = createCoordinatorCore(dependencies);
      const host = createTrustedHostLoop({ coordinator: fresh, durable_route: async () => { throw new Error('ROUTE_MUST_NOT_BE_CALLED'); }, launch_agent: async () => { throw new Error('LAUNCH_MUST_NOT_BE_CALLED'); }, read_artifact: async () => { throw new Error('ARTIFACT_MUST_NOT_BE_CALLED'); }, inventory_paths: async () => { throw new Error('INVENTORY_MUST_NOT_BE_CALLED'); } });
      const direct = await capturePublicOperation('host-direct-status', { change_id: null }, () => fresh.status({ change_id: null })); assertExactResult(direct, { operation: 'status', outcome: 'STATUS', state: 'READY' }); assert.equal(direct.payload.pointer_status, 'ACTIVE'); assert.equal(direct.payload.state_hash, dispatch.state_hash); assertNoRecoveryEffects(context, 'host-direct-status'); const forwarded = await capturePublicOperation('host-forwarded-status', {}, () => host.readStatus()); assert.deepEqual(forwarded, direct); assertNoRecoveryEffects(context, 'host-forwarded-status');
    });
  });

  await t.test('a fresh OS child has no admission tuple and cannot manufacture READY authority', async () => {
    await withR216FormalCore(async context => {
      const dispatchInput = signed(); const dispatch = await context.capturePublicOperation('fresh-os-child-initial-dispatch', dispatchInput, () => context.core.applyControllerCommand(dispatchInput)); assertExactResult(dispatch, { operation: 'applyControllerCommand', outcome: 'APPLIED', state: 'READY' });
      const coordinatorUrl = new URL('./coordinator.mjs', import.meta.url).href; const productionUrl = new URL('./production.mjs', import.meta.url).href; const fixturesUrl = new URL('./fixtures.mjs', import.meta.url).href;
      const program = String.raw`import { channel } from 'node:diagnostics_channel'; import { createCoordinatorCore } from ${JSON.stringify(coordinatorUrl)}; import { createFileState } from ${JSON.stringify(productionUrl)}; import { createLocalBareLedger, makeTestDependencies } from ${JSON.stringify(fixturesUrl)}; const root = process.argv[1]; const errorRecord = error => ({ name: error?.name ?? 'Error', message: error?.message ?? String(error), code: error?.code ?? null }); const observedRequest = request => request === undefined ? { $undefined: true } : structuredClone(request); const events = []; const metadata = new WeakMap(); const pendingErrors = new WeakMap(); const attached = new WeakMap(); const attach = child => { const meta = metadata.get(child); if (!meta || attached.has(child)) return; const argv = [...(child.spawnargs ?? [])].slice(1); const targetIndex = argv.indexOf('--git-dir'); const event = { pid: child.pid ?? null, executable: meta.executable, argv, cwd: meta.cwd, target: targetIndex < 0 ? null : argv[targetIndex + 1] ?? null, stdout: [], stderr: [], close: null, error: pendingErrors.get(child) ?? null }; events.push(event); attached.set(child, event); child.stdout?.on('data', value => event.stdout.push(Buffer.from(value))); child.stderr?.on('data', value => event.stderr.push(Buffer.from(value))); child.once('close', (code, signal) => { event.close = { code, signal }; }); child.once('error', error => { event.error = errorRecord(error); }); }; const start = message => { const child = message?.process; const executable = message?.options?.file; const cwd = message?.options?.cwd; if (child) metadata.set(child, { executable: executable ?? null, cwd: typeof cwd === 'string' ? cwd : null }); }; const end = message => { if (message?.process) process.nextTick(() => attach(message.process)); }; const failure = message => { const child = message?.process; const error = errorRecord(message.error); const event = attached.get(child); if (event) event.error = error; else if (child) pendingErrors.set(child, error); }; const startChannel = channel('tracing:child_process.spawn:start'); const endChannel = channel('tracing:child_process.spawn:end'); const errorChannel = channel('tracing:child_process.spawn:error'); startChannel.subscribe(start); endChannel.subscribe(end); errorChannel.subscribe(failure); let h = null; let state = null; let outcome = null; let pre_state = null; let post_state = null; const state_calls = []; let mutex_attempts = 0; let mutex_releases = 0; try { h = makeTestDependencies(); const acquire = h.dependencies.mutex.tryAcquire.bind(h.dependencies.mutex); const release = h.dependencies.mutex.release.bind(h.dependencies.mutex); h.dependencies.mutex.tryAcquire = async (...args) => { mutex_attempts += 1; return acquire(...args); }; h.dependencies.mutex.release = async (...args) => { mutex_releases += 1; return release(...args); }; const actualState = createFileState(root); const delegated = method => async request => { const call = { method, request: observedRequest(request), result: null, error: null }; state_calls.push(call); try { const result = await actualState[method](request); call.result = structuredClone(result); return result; } catch (error) { call.error = errorRecord(error); throw error; } }; state = Object.freeze(Object.fromEntries(['readPointer', 'writePointer', 'readState', 'writeState', 'readLocalPause', 'writeLocalPause'].map(method => [method, delegated(method)]))); pre_state = { state: await state.readState({ change_id: 'CHG-dual-device-transition-foundation' }), pause: await state.readLocalPause({}) }; const ledger = await createLocalBareLedger(root + '/ledger', 'CHG-dual-device-transition-foundation', [], { resume: true }); const core = createCoordinatorCore({ ...h.dependencies, state, ledger }); const stateRead = await state.readState({ change_id: 'CHG-dual-device-transition-foundation' }); const persisted = JSON.parse(stateRead.value.bytes); const result = await core.run({ change_id: persisted.change_id, expected_state_version: persisted.state_version, expected_state_hash: stateRead.value.sha256 }); outcome = { kind: 'RETURNED', value: result }; process.stdout.write(JSON.stringify(result)); } catch (error) { outcome = { kind: 'THREW', error: errorRecord(error) }; throw error; } finally { if (state) { try { post_state = { state: await state.readState({ change_id: 'CHG-dual-device-transition-foundation' }), pause: await state.readLocalPause({}) }; } catch (error) { post_state = { collection_error: errorRecord(error) }; } } startChannel.unsubscribe(start); endChannel.unsubscribe(end); errorChannel.unsubscribe(failure); process.stderr.write(JSON.stringify({ kind: 'R226_F2_OS_CHILD_NATIVE_GIT', outcome, harness_calls: h?.calls ?? null, mutex_attempts, mutex_releases, child_state: { pre: pre_state, post: post_state }, state_calls, attempted_mutations: state_calls.filter(call => ['writePointer', 'writeState', 'writeLocalPause'].includes(call.method)), children: events.map(event => ({ pid: event.pid, executable: event.executable, argv: event.argv, cwd: event.cwd, target: event.target, stdout_base64: Buffer.concat(event.stdout).toString('base64'), stderr_base64: Buffer.concat(event.stderr).toString('base64'), close: event.close, error: event.error })) }) + String.fromCharCode(10)); }`;
      const childInput = { executable: process.execPath, argv: ['--input-type=module', '--eval', program, context.stateRoot], cwd: context.stateRoot, env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' } }; const child = await context.capturePublicOperation('restart-fresh-admission', childInput, () => run(childInput.executable, childInput.argv, { cwd: childInput.cwd, env: childInput.env })); formalEvidence(context, 'restart-fresh-admission');
      assert.equal(child.code, 0, child.stderr); assert.equal(child.signal, null); const childResult = JSON.parse(child.stdout); const nativeLog = JSON.parse(child.stderr.trim()); assert.deepEqual(childResult, nativeLog.outcome.value); assertExactResult(childResult, { operation: 'run', outcome: 'BLOCKED', state: 'BLOCKED' }); assert.equal(childResult.payload.blocked_reason, 'ADMISSION_EVIDENCE_UNAVAILABLE'); assert.equal(childResult.payload.next_action, 'MANUAL_CONTROLLER_STOP'); assert.equal(nativeLog.kind, 'R226_F2_OS_CHILD_NATIVE_GIT'); assert.equal(nativeLog.outcome.kind, 'RETURNED'); await assertNativeGitCompletion(context, 'restart-fresh-admission', nativeLog); assert.deepEqual({ mutex_attempts: nativeLog.mutex_attempts, mutex_releases: nativeLog.mutex_releases }, { mutex_attempts: 1, mutex_releases: 1 }); assert.equal(nativeLog.harness_calls.some(call => /^git\.|^validation\.|^pull_request\.|^handoff\./.test(call.name)), false); assertChildStateObservation(nativeLog); assertChildPersistentEffects(context, 'restart-fresh-admission');
    });
  });
});
// R219_F2_END
