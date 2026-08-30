import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CHANGE_B, CHANGE_ID, CANDIDATE_SHA, GIT_SHA, SHA256, REPOSITORY_ID, AGENT_STAGES, EVENT_CLASSES,
  MACRO_STATES, PHASES, absent, ambiguous, assertExactResult, assertHelperHealth, bytes,
  conflict, createCoordinatorUnderTest, makeCandidate, makeDelivery, makeDispatch,
  primeState, sha256, unavailable,
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
  const spec = await harness.coordinator.run({ change_id: CHANGE_ID, expected_state_version: dispatch.state_version, expected_state_hash: dispatch.state_hash });
  const specPass = await settle(harness, spec, 'PASS', 'pcrr-spec-pass');
  return harness.coordinator.run({ change_id: CHANGE_ID, expected_state_version: specPass.state_version, expected_state_hash: specPass.state_hash });
};
const dispatchToWorker = async harness => {
  const testAction = await dispatchToTest(harness);
  const testPass = await settle(harness, testAction, 'PASS', 'pcrr-test-pass');
  return harness.coordinator.run({ change_id: CHANGE_ID, expected_state_version: testPass.state_version, expected_state_hash: testPass.state_hash });
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
  const harness = await createCoordinatorUnderTest();
  harness.fault(
    'git.inspectWorktree',
    { kind: 'OK', value: { worktree_root: '/tmp/dtf-worktree', branch: 'work/mac-mini/dtf', head_sha: GIT_SHA, common_git_dir: '/tmp/dtf-repo/.git', status_entries: [], clean: true } },
    { kind: 'OK', value: { worktree_root: '/tmp/dtf-worktree', branch: 'work/mac-mini/dtf', head_sha: CANDIDATE_SHA, common_git_dir: '/tmp/dtf-repo/.git', status_entries: [], clean: true } },
  );
  const dispatch = await harness.coordinator.applyControllerCommand(signed());
  assertExactResult(dispatch, { operation: 'applyControllerCommand', outcome: 'APPLIED', state: 'READY' });
  let current = dispatch;
  const phaseTrace = [[dispatch.state, 'WORKTREE']];
  for (let step = 0; step < 32 && current.outcome !== 'AWAITING_CONTROLLER'; step += 1) {
    const next = await harness.coordinator.run({ change_id: CHANGE_ID, expected_state_version: current.state_version, expected_state_hash: current.state_hash });
    phaseTrace.push([next.state, next.payload?.to_phase ?? next.payload?.action?.phase ?? null]);
    if (next.outcome !== 'AGENT_ACTION') { current = next; continue; }
    const { action_kind, ...binding } = next.payload.action;
    const started = await harness.coordinator.settlement({ change_id: CHANGE_ID, expected_state_version: next.state_version, expected_state_hash: next.state_hash, settlement: { ...binding, stage: 'STARTED', observed_child_id: `${binding.role}-child` } });
    const settled = await harness.coordinator.settlement({ change_id: CHANGE_ID, expected_state_version: started.state_version, expected_state_hash: started.state_hash, settlement: { ...binding, stage: 'RESULT', observed_child_id: `${binding.role}-child`, status: 'PASS', artifact_path: `outputs/${binding.role}.md`, artifact_sha256: SHA256 } });
    phaseTrace.push([settled.state, settled.payload?.to_phase ?? null]);
    current = settled;
  }
  assertExactResult(current, { operation: 'run', outcome: 'AWAITING_CONTROLLER', state: 'AWAITING_CONTROLLER' });
  assert.ok(harness.count('git.createOrReuseWorktree') === 1, 'CAUSAL_RED: normal path must create/reuse Worktree before requesting the Spec Agent');
  assert.ok(harness.count('git.inspectWorktree') === 2, 'CAUSAL_RED: Worktree admission and Candidate freeze each require branch/head/common-Git-dir/clean readback');
  const trace = harness.calls.map(call => call.name);
  for (const boundary of ['git.createOrReuseWorktree', 'git.inspectWorktree', 'git.stageExact', 'git.readStaged', 'git.commitCandidate', 'validation.execute', 'git.pushBranch', 'git.readRemoteBranch', 'pull_request.createOrReuse', 'pull_request.readback', 'handoff.writeReadback']) assert.ok(trace.includes(boundary), `CAUSAL_RED: full automatic path must eventually include ${boundary}`);
  assert.ok(trace.indexOf('git.pushBranch') < trace.indexOf('pull_request.createOrReuse'), 'CAUSAL_RED: Candidate freeze and push/readback precede PR');
  assert.ok(phaseTrace.some(([state, phase]) => state === 'DELIVERING' && phase === 'CANDIDATE_FREEZE'), 'CAUSAL_RED: normal delivery must not bypass CANDIDATE_FREEZE');
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
      const identity = primeState(harness, { macro_state: 'EXECUTING', phase: 'SPEC' });
      const action = await harness.coordinator.run({ change_id: CHANGE_ID, ...identity });
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
    const identity = primeState(harness, { macro_state: 'BLOCKED', phase: null, state_version: 7, candidate: makeCandidate({ frozen: false, validator_head: null }), delivery: null, blocked_reason: 'VALIDATOR_SECOND_FAIL' });
    const revision = signed({
      command_kind: 'REVISION',
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
    const identity = primeState(harness, { macro_state: 'EXECUTING', phase: 'SPEC', state_version: 4 });
    await harness.coordinator.run({ change_id: CHANGE_ID, ...identity });
    const write = harness.calls.find(call => call.name === 'state.writeState');
    assert.equal(write.request.expected_version, 4, 'CAUSAL_RED: CAS writes use the observed current version');
    assert.equal(write.request.expected_sha256, identity.expected_state_hash, 'CAUSAL_RED: CAS writes bind exact read state bytes');
    assert.ok(harness.count('state.readState') >= 2, 'CAUSAL_RED: write must have exact canonical readback before durable advance');
  });
  await t.test('partial OK from Worktree gateway does not advance', async () => {
    const harness = await createCoordinatorUnderTest();
    const identity = primeState(harness, { macro_state: 'DELIVERING', phase: 'STAGE' });
    harness.fault('git.stageExact', { kind: 'OK', value: { staged_paths: ['tools/harness/change-coordinator/coordinator.mjs'] } });
    const result = await harness.coordinator.run({ change_id: CHANGE_ID, ...identity });
    assertExactResult(result, { operation: 'run', outcome: 'BLOCKED', state: 'BLOCKED' });
  });
});

test('TEST-DTF-R1-005: admission and every durable event carry exact Ledger detail, sequence, framing, and readback receipt', async () => {
  const harness = await createCoordinatorUnderTest();
  const result = await harness.coordinator.applyControllerCommand(signed());
  assertExactResult(result, { operation: 'applyControllerCommand', outcome: 'APPLIED', state: 'READY' });
  const prepared = harness.calls.find(call => call.name === 'ledger.prepareAppend');
  assert.deepEqual(Object.keys(prepared.request.detail).sort(), ['command_id', 'command_kind', 'ready_state_sha256'], 'CAUSAL_RED: CONTROLLER_COMMAND must bind complete admission receipt, including READY raw-byte hash');
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
    const identity = primeState(harness, { macro_state: 'EXECUTING', phase: 'SPEC' });
    const action = await harness.coordinator.run({ change_id: CHANGE_ID, ...identity });
    assertExactResult(action, { operation: 'run', outcome: 'AGENT_ACTION', state: 'EXECUTING' });
    const requested = harness.calls.find(call => call.name === 'ledger.prepareAppend' && call.request.event_class === 'AGENT_RUN' && call.request.detail.stage === 'REQUESTED');
    assert.ok(requested, 'CAUSAL_RED: REQUESTED append must precede AGENT_ACTION');
    const requestIndex = harness.calls.indexOf(requested);
    const stateWriteIndex = harness.calls.findIndex(call => call.name === 'state.writeState' && call.request.state?.pending_agent);
    assert.ok(requestIndex >= 0 && requestIndex < stateWriteIndex, 'CAUSAL_RED: pending state cannot reference an Agent action before its read-back REQUESTED evidence');
  });
  await t.test('STARTED failure cannot advance state when its AGENT_RUN append/readback is unavailable', async () => {
    const harness = await createCoordinatorUnderTest();
    const identity = primeState(harness, { macro_state: 'EXECUTING', phase: 'SPEC' });
    const action = await harness.coordinator.run({ change_id: CHANGE_ID, ...identity });
    const { action_kind, ...binding } = action.payload.action;
    harness.fault('ledger.readRemote', unavailable({ stage: 'PRIOR_TIP_READ' }));
    const started = await harness.coordinator.settlement({ change_id: CHANGE_ID, expected_state_version: action.state_version, expected_state_hash: action.state_hash, settlement: { ...binding, stage: 'STARTED', observed_child_id: 'child-1' } });
    assert.notEqual(started.state, 'EXECUTING', 'CAUSAL_RED: a missing STARTED append/readback cannot claim progressed durable Agent state');
    assert.equal(harness.stateStore.state.pending_agent.started, undefined, 'CAUSAL_RED: failed STARTED evidence must leave the stored pending binding unchanged');
  });
});

test('TEST-DTF-R1-005: validation, branch publication, and Handoff events are durable in normal-path order', async t => {
  await t.test('FINAL_VALIDATION appends VALIDATION_RESULT before advancing to VALIDATOR', async () => {
    const harness = await createCoordinatorUnderTest();
    const identity = primeState(harness, { macro_state: 'DELIVERING', phase: 'FINAL_VALIDATION', candidate: makeCandidate({ frozen: false }) });
    const result = await harness.coordinator.run({ change_id: CHANGE_ID, ...identity });
    assertExactResult(result, { operation: 'run', outcome: 'ADVANCED', state: 'DELIVERING' });
    assert.ok(harness.calls.some(call => call.name === 'ledger.prepareAppend' && call.request.event_class === 'VALIDATION_RESULT'), 'CAUSAL_RED: final validation receipt must be an append/readback Ledger fact');
  });
  await t.test('BRANCH_PUSHED is appended/read back after remote head readback and before CANDIDATE_FREEZE', async () => {
    const harness = await createCoordinatorUnderTest();
    const identity = primeState(harness, { macro_state: 'DELIVERING', phase: 'BRANCH_PUSH', candidate: makeCandidate({ frozen: false }), delivery: null });
    const result = await harness.coordinator.run({ change_id: CHANGE_ID, ...identity });
    assertExactResult(result, { operation: 'run', outcome: 'ADVANCED', state: 'DELIVERING' });
    const remote = harness.calls.findIndex(call => call.name === 'git.readRemoteBranch');
    const event = harness.calls.findIndex(call => call.name === 'ledger.prepareAppend' && call.request.event_class === 'BRANCH_PUSHED');
    assert.ok(remote >= 0 && event > remote, 'CAUSAL_RED: BRANCH_PUSHED follows exact remote-head readback');
  });
  await t.test('HANDOFF_READY receives complete HandoffV1 bytes before its event/readback', async () => {
    const harness = await createCoordinatorUnderTest();
    const identity = primeState(harness, { macro_state: 'DELIVERING', phase: 'HANDOFF', candidate: makeCandidate(), delivery: makeDelivery({ handoff_sha256: null }) });
    const result = await harness.coordinator.run({ change_id: CHANGE_ID, ...identity });
    assertExactResult(result, { operation: 'run', outcome: 'AWAITING_CONTROLLER', state: 'AWAITING_CONTROLLER' });
    const write = harness.calls.find(call => call.name === 'handoff.writeReadback');
    assert.deepEqual(Object.keys(write.request).sort(), ['expected_sha256', 'handoff_bytes'], 'CAUSAL_RED: Handoff gateway receives canonical complete HandoffV1 bytes, not hash-only input');
    const handoff = JSON.parse(new TextDecoder().decode(write.request.handoff_bytes));
    assert.deepEqual(Object.keys(handoff).sort(), ['baseline_sha', 'branch', 'candidate_sha', 'candidate_tree', 'canonical_diff_contract_id', 'canonical_diff_sha256', 'change_id', 'changed_paths', 'delivery_id', 'idempotency_id', 'ledger_refs', 'open_questions', 'pull_request', 'remote_head', 'risks', 'schema_version', 'unverified', 'validation_receipts', 'validator_head', 'validator_verdict']);
  });
});

test('TEST-DTF-R1-009: failed BLOCKED persistence/readback never claims a durable BLOCKED state or event', async () => {
  const harness = await createCoordinatorUnderTest();
  const identity = primeState(harness, { macro_state: 'DELIVERING', phase: 'STAGE' });
  harness.fault('git.stageExact', unavailable({ stage: 'STAGE_EFFECT' }));
  harness.fault('state.writeState', unavailable({ stage: 'BLOCKED_STATE_WRITE' }));
  const result = await harness.coordinator.run({ change_id: CHANGE_ID, ...identity });
  assertExactResult(result, { operation: 'run', outcome: 'BLOCKED', state: null });
  assert.equal(harness.stateStore.state.macro_state, 'DELIVERING', 'CAUSAL_RED: failed BLOCKED write/readback leaves the durable state at its prior value');
  assert.equal(harness.calls.some(call => call.name === 'ledger.prepareAppend' && call.request.event_class === 'BLOCKED'), false, 'CAUSAL_RED: a failed block persistence cannot claim a durable BLOCKED event');
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
    assertExactResult(status, { operation: 'status', outcome: 'STATUS' });
    assert.equal(status.payload.pointer_status, 'INVALID');
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
  await t.test('a fresh Coordinator reads the exact formal route from durable evidence instead of defaulting role/model/scope', async () => {
    const isolated = await createCoordinatorUnderTest();
    const dispatched = await isolated.coordinator.applyControllerCommand(signed());
    const fresh = await productionCoordinatorModule.createTestCoordinator(isolated.dependencies);
    const action = await fresh.run({ change_id: CHANGE_ID, expected_state_version: dispatched.state_version, expected_state_hash: dispatched.state_hash });
    assertExactResult(action, { operation: 'run', outcome: 'AGENT_ACTION', state: 'EXECUTING' });
    assert.equal(action.payload.action.agent, 'juaner_spec');
    assert.equal(action.payload.action.model, 'gpt-5.6-terra');
    assert.equal(action.payload.action.sandbox, 'workspace-write');
    assert.deepEqual(action.payload.action.allowed_paths, ['openspec/changes/dual-device-transition-foundation/**']);
  });
  await t.test('distinguishes START_FAILED, INTERRUPTED, and precondition-only NOT_STARTED', async () => {
    for (const stage of ['START_FAILED', 'INTERRUPTED', 'NOT_STARTED']) assert.ok(AGENT_STAGES.includes(stage));
    assert.equal(harness.mutex.isHeld(), false, 'Agent wait must release the operation mutex');
  });
});

test('TEST-DTF-R1-004: signed REVISION/RESUME and one causal Validator repair per authorization cycle', async t => {
  await t.test('first reliable in-scope Validator FAIL consumes zero-to-one and requests causal Test RED', async () => {
    const harness = await createCoordinatorUnderTest();
    const identity = primeState(harness, {
      macro_state: 'DELIVERING', phase: 'VALIDATOR',
      candidate: makeCandidate({ frozen: false, validator_head: null }), delivery: null,
      authorization_cycle: { command_id: 'command-001', command_kind: 'DISPATCH', auto_repair_attempt: 0 },
    });
    const run = await harness.coordinator.run({ change_id: CHANGE_ID, ...identity });
    assertExactResult(run, { operation: 'run', outcome: 'AGENT_ACTION', state: 'DELIVERING' });
    assert.equal(run.payload.action.role, 'juaner_validator', 'PRECONDITION_NOT_REACHED: VALIDATOR must request juaner_validator');
    assert.equal(run.payload.action.subject_sha, CANDIDATE_SHA, 'PRECONDITION_NOT_REACHED: Validator action must bind the exact Candidate');
    const { action_kind, ...binding } = run.payload.action; assert.equal(action_kind, 'LAUNCH_AGENT');
    const started = await harness.coordinator.settlement({ change_id: CHANGE_ID, expected_state_version: run.state_version, expected_state_hash: run.state_hash, settlement: { ...binding, stage: 'STARTED', observed_child_id: 'validator-child-001' } });
    assertExactResult(started, { operation: 'settlement', outcome: 'WAITING', state: 'DELIVERING' });
    const failed = await harness.coordinator.settlement({ change_id: CHANGE_ID, expected_state_version: started.state_version, expected_state_hash: started.state_hash, settlement: { ...binding, stage: 'RESULT', observed_child_id: 'validator-child-001', status: 'FAIL', artifact_path: 'outputs/validator.md', artifact_sha256: SHA256 } });
    assertExactResult(failed, { operation: 'settlement', outcome: 'ADVANCED', state: 'EXECUTING' });
    const repair = await harness.coordinator.run({ change_id: CHANGE_ID, expected_state_version: failed.state_version, expected_state_hash: failed.state_hash });
    assertExactResult(repair, { operation: 'run', outcome: 'AGENT_ACTION', state: 'EXECUTING' });
    assert.equal(repair.payload.action.role, 'juaner_test', 'PRECONDITION_NOT_REACHED: first Validator FAIL must request causal juaner_test');
    assert.equal(repair.payload.action.phase, 'TEST_RED');
    assert.equal(harness.stateStore.state.authorization_cycle.auto_repair_attempt, 1);
  });
  await t.test('second Validator FAIL blocks exactly for signed Controller revision', async () => {
    const harness = await createCoordinatorUnderTest();
    const identity = primeState(harness, {
      macro_state: 'DELIVERING', phase: 'VALIDATOR',
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
    const result = await harness.coordinator.settlement({ change_id: CHANGE_ID, expected_state_version: started.state_version, expected_state_hash: started.state_hash, settlement: { ...binding, stage: 'RESULT', observed_child_id: 'validator-child-002', status: 'FAIL', artifact_path: 'outputs/validator.md', artifact_sha256: SHA256 } });
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
    const harness = await createCoordinatorUnderTest();
    const identity = primeState(harness, { macro_state: 'DELIVERING', phase: 'STAGE', candidate: null, delivery: null });
    const result = await harness.coordinator.run({ change_id: CHANGE_ID, ...identity });
    assertExactResult(result, { operation: 'run', outcome: 'ADVANCED', state: 'DELIVERING' });
    reached(harness, 'git.stageExact'); reached(harness, 'git.readStaged');
    const names = harness.calls.map(call => call.name); assert.ok(names.indexOf('git.stageExact') < names.indexOf('git.readStaged'));
  });
  await t.test('CANDIDATE_COMMIT commits and reads back the exact Candidate', async () => {
    const harness = await createCoordinatorUnderTest();
    const identity = primeState(harness, { macro_state: 'DELIVERING', phase: 'CANDIDATE_COMMIT', candidate: null, delivery: null });
    const result = await harness.coordinator.run({ change_id: CHANGE_ID, ...identity });
    assertExactResult(result, { operation: 'run', outcome: 'ADVANCED', state: 'DELIVERING' });
    reached(harness, 'git.commitCandidate'); reached(harness, 'git.readCommit');
  });
  await t.test('FINAL_VALIDATION runs against the exact unfrozen Candidate', async () => {
    const harness = await createCoordinatorUnderTest();
    const identity = primeState(harness, { macro_state: 'DELIVERING', phase: 'FINAL_VALIDATION', candidate: makeCandidate({ frozen: false, validator_head: null }), delivery: null });
    const result = await harness.coordinator.run({ change_id: CHANGE_ID, ...identity });
    assertExactResult(result, { operation: 'run', outcome: 'ADVANCED', state: 'DELIVERING' });
    reached(harness, 'validation.execute');
    assert.equal(harness.calls.find(call => call.name === 'validation.execute').request.subject_sha, CANDIDATE_SHA);
  });
  await t.test('dirty worktree blocks before staging or Candidate commit', async () => {
    const isolated = await createCoordinatorUnderTest(); const identity = primeState(isolated, { macro_state: 'DELIVERING', phase: 'STAGE', candidate: null, delivery: null }); isolated.fault('git.inspectWorktree', { kind: 'OK', value: { clean: false, status_entries: [{ path: 'unexpected.txt' }] } });
    const result = await isolated.coordinator.run({ change_id: CHANGE_ID, ...identity }); assertExactResult(result, { operation: 'run', outcome: 'BLOCKED', state: 'BLOCKED' }); reached(isolated, 'git.inspectWorktree'); assert.equal(result.payload.blocked_reason, 'WORKTREE_DIRTY_CONFLICT'); noCall(isolated, 'git.stageExact'); noCall(isolated, 'git.commitCandidate');
  });
  await t.test('REGRESSION cannot advance until affected-suite and TEST_ASSET_RETIREMENT receipts both pass', async () => {
    const isolated = await createCoordinatorUnderTest();
    const identity = primeState(isolated, { macro_state: 'EXECUTING', phase: 'REGRESSION', candidate: null, delivery: null });
    const result = await isolated.coordinator.run({ change_id: CHANGE_ID, ...identity });
    assertExactResult(result, { operation: 'run', outcome: 'ADVANCED', state: 'DELIVERING' });
    const receipts = isolated.calls.filter(call => call.name === 'validation.execute').map(call => call.request.definition?.validation_scope);
    assert.deepEqual(receipts, ['AFFECTED_SUITE', 'TEST_ASSET_RETIREMENT']);
  });
});

test('TEST-DTF-R1-009: only four named readback boundaries recover, ambiguity stops later run without a gateway replay', async t => {
  for (const [name, dependency, fault, readback, readbackFault, state] of [
    ['Candidate commit', 'git.commitCandidate', ambiguous({ stage: 'REMOTE_COMMIT_READ' }), 'git.readCommit', conflict('different-candidate'), { macro_state: 'DELIVERING', phase: 'CANDIDATE_COMMIT', candidate: null, delivery: null }],
    ['branch push', 'git.pushBranch', ambiguous({ stage: 'REMOTE_REF_READ' }), 'git.readRemoteBranch', conflict('different-remote-head'), { macro_state: 'DELIVERING', phase: 'BRANCH_PUSH', candidate: makeCandidate({ frozen: false }), delivery: null }],
    ['Ledger append', 'ledger.commitAndPush', ambiguous({ stage: 'REMOTE_RECORD_READ' }), 'ledger.readRemoteAppend', conflict('remote-record-mismatch'), { macro_state: 'DELIVERING', phase: 'CANDIDATE_COMMIT', candidate: null, delivery: null }],
    ['final PR/Handoff', 'handoff.writeReadback', ambiguous({ stage: 'REMOTE_RECORD_READ' }), null, null, { macro_state: 'DELIVERING', phase: 'HANDOFF', candidate: makeCandidate(), delivery: makeDelivery({ handoff_sha256: null }) }],
  ]) {
    await t.test(`${name} ambiguity has one readback then MANUAL_CONTROLLER_STOP`, async () => {
      const harness = await createCoordinatorUnderTest(); const identity = primeState(harness, state); harness.fault(dependency, fault); if (readback) harness.fault(readback, readbackFault);
      const first = await harness.coordinator.run({ change_id: CHANGE_ID, ...identity }); assertExactResult(first, { operation: 'run', outcome: 'BLOCKED', state: 'BLOCKED' }); reached(harness, dependency); if (readback) { reached(harness, readback); assert.ok(harness.calls.findIndex(call => call.name === dependency) < harness.calls.findIndex(call => call.name === readback), `PRECONDITION_NOT_REACHED: ${readback} must follow ${dependency}`); } assert.equal(first.payload.next_action, 'MANUAL_CONTROLLER_STOP'); const afterFirst = harness.count(dependency);
      const replay = await harness.coordinator.run({ change_id: CHANGE_ID, expected_state_version: first.state_version, expected_state_hash: first.state_hash }); assertExactResult(replay, { operation: 'run', outcome: 'BLOCKED', state: 'BLOCKED' }); assert.equal(harness.count(dependency), afterFirst, 'blocked run cannot replay an ambiguous gateway');
    });
  }
  await t.test('a fresh Coordinator reconstructs durable MANUAL_CONTROLLER_STOP and never repeats the ambiguous Candidate effect', async () => {
    const harness = await createCoordinatorUnderTest();
    const identity = primeState(harness, { macro_state: 'DELIVERING', phase: 'CANDIDATE_COMMIT', candidate: null, delivery: null });
    harness.fault('git.commitCandidate', ambiguous({ stage: 'REMOTE_COMMIT_READ' }));
    harness.fault('git.readCommit', conflict('different-candidate'));
    const first = await harness.coordinator.run({ change_id: CHANGE_ID, ...identity });
    assertExactResult(first, { operation: 'run', outcome: 'BLOCKED', state: 'BLOCKED' });
    assert.equal(harness.stateStore.state.macro_state, 'BLOCKED');
    assert.equal(harness.stateStore.state.blocked_reason, 'CANDIDATE_COMMIT_AMBIGUOUS');
    const afterFirst = harness.count('git.commitCandidate');
    const fresh = await productionCoordinatorModule.createTestCoordinator(harness.dependencies);
    const replay = await fresh.run({ change_id: CHANGE_ID, expected_state_version: first.state_version, expected_state_hash: first.state_hash });
    assertExactResult(replay, { operation: 'run', outcome: 'BLOCKED', state: 'BLOCKED' });
    assert.equal(harness.count('git.commitCandidate'), afterFirst);
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
    ['missing pointer', 'state.readPointer', unavailable({ stage: 'POINTER_READ' }), false],
    ['corrupt pointer', 'state.readPointer', { kind: 'OK', value: { bytes: '{not-json', sha256: SHA256 } }, false],
    ['READY missing', 'state.readState', absent('READY'), false],
    ['READY exists but event missing', 'ledger.readRemoteAppend', absent('admission-event'), true],
    ['admission event readback ambiguous', 'ledger.readRemoteAppend', ambiguous({ stage: 'REMOTE_RECORD_READ' }), true],
    ['pointer-state-ledger conflict', 'ledger.readRemoteAppend', conflict('different-admission'), true],
  ];
  for (const [name, dependency, fault, completeReady] of windows) {
    await t.test(name, async () => {
      const harness = await createCoordinatorUnderTest();
      harness.stateStore.pointer.active_change_id = CHANGE_ID;
      const identity = completeReady
        ? primeState(harness, { macro_state: 'READY', phase: 'WORKTREE' })
        : stateIdentity;
      // The status read and later run must both observe this same crash-window
      // fault; neither may first observe a healthy READY state.
      harness.fault(dependency, fault, fault);
      const status = await harness.coordinator.status({ change_id: CHANGE_ID });
      assertExactResult(status, { operation: 'status', outcome: 'STATUS' });
      assert.equal(status.payload.pointer_status, 'INVALID');
      const run = await harness.coordinator.run({ change_id: CHANGE_ID, ...identity });
      assertExactResult(run, { operation: 'run', outcome: 'BLOCKED', state: 'BLOCKED' });
      assert.equal(run.payload.next_action, 'MANUAL_CONTROLLER_STOP');
      assert.equal(harness.count(dependency), 2, `PRECONDITION_NOT_REACHED: status and run must each observe ${dependency}`);
      noCall(harness, 'git.createOrReuseWorktree');
      const changeB = await harness.coordinator.applyControllerCommand(signed({ change_id: CHANGE_B, command_id: 'command-b', idempotency_id: 'idem-b' }));
      assertExactResult(changeB, { operation: 'applyControllerCommand', outcome: 'REJECTED', code: 'WIP_AUTHORITY_INVALID' });
      assert.equal(harness.stateStore.pointer.active_change_id, CHANGE_ID);
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
    const harness = await createCoordinatorUnderTest();
    const wrongValue = { tip: GIT_SHA, commit_sha: GIT_SHA, tree_sha: GIT_SHA, event_id: 'event-wrong', event_hash: 'b'.repeat(64), sequence: 1, record_bytes_sha256: 'c'.repeat(64), idempotency_id: 'idem-wrong', linearized: true, change_id: CHANGE_B, subject_sha: GIT_SHA };
    const wrong = { kind: 'OK', value: wrongValue, receipt_sha256: 'd'.repeat(64) };
    harness.fault('ledger.readRemoteAppend', wrong, structuredClone(wrong));
    const admitted = await harness.coordinator.applyControllerCommand(signed());
    const readyWrite = harness.calls.find(call => call.name === 'state.writeState' && call.request.state?.macro_state === 'READY');
    const prepared = harness.calls.find(call => call.name === 'ledger.prepareAppend');
    const submitted = harness.calls.find(call => call.name === 'ledger.commitAndPush');
    const firstReadback = harness.calls.find(call => call.name === 'ledger.readRemoteAppend');
    const expected = firstReadback.request.expected;
    assert.equal(prepared.request.change_id, CHANGE_ID, 'PRECONDITION_NOT_REACHED: the prepared admission event must bind this Change');
    assert.equal(prepared.request.detail.ready_state_sha256, sha256(bytes(readyWrite.request.state)), 'PRECONDITION_NOT_REACHED: the prepared admission event subject must be the exact READY bytes');
    assert.equal(submitted.request.prepared.event_id, 'event-001', 'PRECONDITION_NOT_REACHED: the submitted event identity must be fixed before readback');
    assert.deepEqual({ event_id: expected.event_id, event_hash: expected.event_hash, idempotency_id: expected.idempotency_id }, { event_id: 'event-001', event_hash: SHA256, idempotency_id: 'idem-001' }, 'PRECONDITION_NOT_REACHED: readback must request the exact submitted event');
    assert.equal(firstReadback.request.change_id, CHANGE_ID, 'PRECONDITION_NOT_REACHED: readback must bind the exact Change');
    assert.notEqual(wrong.receipt_sha256, sha256(bytes(expected)), 'PRECONDITION_NOT_REACHED: the injected result must carry a different digest than the exact expected submission');
    const later = await harness.coordinator.run({ change_id: CHANGE_ID, expected_state_version: admitted.state_version, expected_state_hash: admitted.state_hash });
    assert.deepEqual({ apply_outcome: admitted.outcome, apply_state: admitted.state, readback_calls: harness.count('ledger.readRemoteAppend'), run_outcome: later.outcome, worktree_calls: harness.count('git.createOrReuseWorktree'), agent_action: later.outcome === 'AGENT_ACTION' }, { apply_outcome: 'BLOCKED', apply_state: 'BLOCKED', readback_calls: 1, run_outcome: 'BLOCKED', worktree_calls: 0, agent_action: false }, 'CAUSAL_RED: first admission must validate the exact prepared/submitted identity instead of caching and re-trusting a stable wrong readback');
  });
  await t.test('identical DISPATCH replay after a wrong admission tuple and failed BLOCKED persistence cannot return READY', async () => {
    const harness = await createCoordinatorUnderTest();
    const wrongValue = { tip: GIT_SHA, commit_sha: GIT_SHA, tree_sha: GIT_SHA, event_id: 'event-wrong', event_hash: 'b'.repeat(64), sequence: 1, record_bytes_sha256: 'c'.repeat(64), idempotency_id: 'idem-wrong', linearized: true, change_id: CHANGE_B, subject_sha: GIT_SHA };
    const wrong = { kind: 'OK', value: wrongValue, receipt_sha256: sha256(bytes(wrongValue)) };
    harness.fault('ledger.readRemoteAppend', wrong, structuredClone(wrong));
    const writeState = harness.dependencies.state.writeState;
    let blockedWriteAttempts = 0;
    harness.dependencies.state.writeState = async request => {
      if (request.state?.macro_state === 'BLOCKED' && blockedWriteAttempts++ === 0) return unavailable({ stage: 'BLOCKED_STATE_WRITE' });
      return writeState(request);
    };
    const first = await harness.coordinator.applyControllerCommand(signed());
    assert.deepEqual({ outcome: first.outcome, state: first.state, durable_state: harness.stateStore.state.macro_state, pointer: harness.stateStore.pointer.active_change_id, readback_calls: harness.count('ledger.readRemoteAppend'), blocked_write_attempts: blockedWriteAttempts }, { outcome: 'BLOCKED', state: null, durable_state: 'READY', pointer: CHANGE_ID, readback_calls: 1, blocked_write_attempts: 1 }, 'PRECONDITION_NOT_REACHED: the first wrong tuple must be rejected while the one failed BLOCKED write leaves the admitted READY scene durable');
    const replay = await harness.coordinator.applyControllerCommand(signed());
    assert.deepEqual({ outcome: replay.outcome, state: replay.state, next_action: replay.payload?.next_action ?? null, durable_state: harness.stateStore.state.macro_state, pointer: harness.stateStore.pointer.active_change_id, readback_calls: harness.count('ledger.readRemoteAppend'), blocked_write_attempts: blockedWriteAttempts, worktree_calls: harness.count('git.createOrReuseWorktree'), agent_events: harness.calls.filter(call => call.name === 'ledger.prepareAppend' && call.request.event_class === 'AGENT_RUN').length }, { outcome: 'BLOCKED', state: 'BLOCKED', next_action: 'MANUAL_CONTROLLER_STOP', durable_state: 'BLOCKED', pointer: CHANGE_ID, readback_calls: 2, blocked_write_attempts: 2, worktree_calls: 0, agent_events: 0 }, 'CAUSAL_RED: replay must revalidate the exact admission tuple and converge to durable BLOCKED instead of trusting READY as ALREADY_APPLIED');
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
      const harness = await createCoordinatorUnderTest(); harness.fault(dependency, fault);
      const result = await harness.coordinator.applyControllerCommand(signed());
      assertExactResult(result, { operation: 'applyControllerCommand', outcome: 'BLOCKED', state: 'BLOCKED' });
      assert.equal(result.payload.next_action, 'MANUAL_CONTROLLER_STOP');
      assert.equal(harness.count(dependency), 1, `PRECONDITION_NOT_REACHED: ${dependency} must be called once`);
      noCall(harness, 'git.createOrReuseWorktree'); noCall(harness, 'pull_request.createOrReuse'); noCall(harness, 'handoff.writeReadback');
      const before = harness.count(dependency);
      const later = await harness.coordinator.run({ change_id: CHANGE_ID, expected_state_version: result.state_version, expected_state_hash: result.state_hash });
      assertExactResult(later, { operation: 'run', outcome: 'BLOCKED', state: 'BLOCKED' }); assert.equal(harness.count(dependency), before);
    });
  }
  await t.test('Evidence Ref unavailable stores exact original request local pause without a BLOCKED Ledger event', async () => {
    const harness = await createCoordinatorUnderTest(); harness.fault('ledger.readRemote', unavailable({ stage: 'PRIOR_TIP_READ' }));
    const result = await harness.coordinator.applyControllerCommand(signed());
    assertExactResult(result, { operation: 'applyControllerCommand', outcome: 'BLOCKED', state: null }); assert.equal(result.payload.next_action, 'IDENTICAL_COMMAND_REPLAY');
    assert.equal(harness.count('ledger.readRemote'), 1, 'PRECONDITION_NOT_REACHED: remote evidence read must be attempted once'); assert.equal(harness.count('ledger.prepareAppend'), 0); assert.equal(harness.count('ledger.commitAndPush'), 0); noCall(harness, 'git.createOrReuseWorktree');
    assert.equal(harness.stateStore.localPause.request_idempotency_id, 'idem-001'); assert.equal(harness.stateStore.localPause.request_sha256, sha256(signed().command_body_bytes));
  });
});

test('TEST-DTF-R1-007: exact Candidate, Validator, PR, and Handoff identity is required before freeze or AWAITING_CONTROLLER', async t => {
  const cases = [
    ['local Candidate Head mismatch', 'git.readCommit', { kind: 'OK', value: { sha: GIT_SHA, parent: GIT_SHA, tree: GIT_SHA, branch: 'work/mac-mini/dtf' } }, 'git.pushBranch', { macro_state: 'DELIVERING', phase: 'CANDIDATE_COMMIT', candidate: null, delivery: null }],
    ['remote branch Head mismatch', 'git.readRemoteBranch', { kind: 'OK', value: { remote_head: GIT_SHA } }, 'pull_request.createOrReuse', { macro_state: 'DELIVERING', phase: 'BRANCH_PUSH', candidate: makeCandidate({ frozen: false }), delivery: null }],
    ['PR multiple result', 'pull_request.queryCurrent', conflict('multiple-prs'), 'handoff.writeReadback', { macro_state: 'DELIVERING', phase: 'PR', candidate: makeCandidate(), delivery: makeDelivery({ pull_request: null, handoff_sha256: null }) }],
    ['PR wrong base/head', 'pull_request.readback', { kind: 'OK', value: { number: 42, base: 'other', head_sha: GIT_SHA, review_ready: true } }, 'handoff.writeReadback', { macro_state: 'DELIVERING', phase: 'PR', candidate: makeCandidate(), delivery: makeDelivery({ pull_request: null, handoff_sha256: null }) }],
  ];
  for (const [name, dependency, fault, forbidden, state] of cases) {
    await t.test(name, async () => {
      const harness = await createCoordinatorUnderTest(); const identity = primeState(harness, state); harness.fault(dependency, fault);
      const result = await harness.coordinator.run({ change_id: CHANGE_ID, ...identity });
      assertExactResult(result, { operation: 'run', outcome: 'BLOCKED', state: 'BLOCKED' });
      assert.equal(result.payload.next_action, 'MANUAL_CONTROLLER_STOP'); reached(harness, dependency); noCall(harness, forbidden);
    });
  }
  await t.test('Candidate freeze re-reads local, remote, and Validator Heads and blocks every mismatch', async () => {
    const cases = [
      ['local Candidate Head', 'git.readCommit', { kind: 'OK', value: { sha: GIT_SHA, parent: GIT_SHA, tree: GIT_SHA, branch: 'work/mac-mini/dtf' } }, makeCandidate({ frozen: false })],
      ['remote branch Head', 'git.readRemoteBranch', { kind: 'OK', value: { remote_head: GIT_SHA } }, makeCandidate({ frozen: false })],
      ['Validator Head', null, null, makeCandidate({ frozen: false, validator_head: GIT_SHA })],
    ];
    const observed = [];
    for (const [name, dependency, fault, candidate] of cases) {
      const harness = await createCoordinatorUnderTest();
      const identity = primeState(harness, { macro_state: 'DELIVERING', phase: 'CANDIDATE_FREEZE', candidate, delivery: makeDelivery({ pull_request: null, handoff_sha256: null }) });
      if (dependency) harness.fault(dependency, fault);
      const result = await harness.coordinator.run({ change_id: CHANGE_ID, ...identity });
      observed.push({ name, outcome: result.outcome, state: result.state, fault_reached: dependency ? harness.count(dependency) === 1 : true, frozen: harness.stateStore.state.candidate?.frozen, canonical_diff_calls: harness.count('git.canonicalDiff'), pr_calls: harness.count('pull_request.createOrReuse') });
    }
    assert.deepEqual(observed, cases.map(([name]) => ({ name, outcome: 'BLOCKED', state: 'BLOCKED', fault_reached: true, frozen: false, canonical_diff_calls: 0, pr_calls: 0 })), 'CAUSAL_RED: freeze must re-read local/remote Candidate identity and bind the exact Validator Head before diff, freeze, or PR');
  });
  await t.test('Candidate freeze blocks when the clean Worktree branch tip advanced beyond the still-readable Candidate', async () => {
    const harness = await createCoordinatorUnderTest(); const advancedHead = '3'.repeat(40);
    const identity = primeState(harness, { macro_state: 'DELIVERING', phase: 'CANDIDATE_FREEZE', candidate: makeCandidate({ frozen: false }), delivery: makeDelivery({ pull_request: null, handoff_sha256: null }) });
    harness.fault('git.inspectWorktree', { kind: 'OK', value: { worktree_root: '/tmp/dtf-worktree', branch: 'work/mac-mini/dtf', head_sha: advancedHead, common_git_dir: '/tmp/dtf-repo/.git', status_entries: [], clean: true } });
    const result = await harness.coordinator.run({ change_id: CHANGE_ID, ...identity });
    const inspection = harness.calls.find(call => call.name === 'git.inspectWorktree');
    assert.deepEqual({ outcome: result.outcome, state: result.state, candidate_object_read: harness.count('git.readCommit') === 1, inspected_expected_branch: inspection?.request.expected_branch ?? null, inspected_expected_head: inspection?.request.expected_head ?? null, frozen: harness.stateStore.state.candidate?.frozen, canonical_diff_calls: harness.count('git.canonicalDiff'), pr_calls: harness.count('pull_request.createOrReuse') }, { outcome: 'BLOCKED', state: 'BLOCKED', candidate_object_read: true, inspected_expected_branch: 'work/mac-mini/dtf', inspected_expected_head: CANDIDATE_SHA, frozen: false, canonical_diff_calls: 0, pr_calls: 0 }, 'CAUSAL_RED: a readable Candidate object is not freeze authority after its clean Worktree branch tip advances');
  });
  await t.test('format-valid wrong Handoff hash is durably BLOCKED without follow-on effects', async () => {
    const harness = await createCoordinatorUnderTest(); const identity = primeState(harness, { macro_state: 'DELIVERING', phase: 'HANDOFF', candidate: makeCandidate(), delivery: makeDelivery({ handoff_sha256: null }) }); const wrong = 'b'.repeat(64); harness.fault('handoff.writeReadback', { kind: 'OK', value: { handoff_sha256: wrong, delivery_id: 'delivery-001' }, receipt_sha256: SHA256 });
    const result = await harness.coordinator.run({ change_id: CHANGE_ID, ...identity });
    assertExactResult(result, { operation: 'run', outcome: 'BLOCKED', state: 'BLOCKED' });
    assert.equal(result.payload.next_action, 'MANUAL_CONTROLLER_STOP'); reached(harness, 'handoff.writeReadback'); reached(harness, 'state.writeState');
    const handoffCall = harness.calls.find(call => call.name === 'handoff.writeReadback'); assert.notEqual(handoffCall.request.expected_sha256, wrong, 'PRECONDITION_NOT_REACHED: returned hash must be well formed but different from this Handoff expected hash');
    const blockedWrite = harness.calls.filter(call => call.name === 'state.writeState').at(-1); assert.equal(blockedWrite.request.state.macro_state, 'BLOCKED'); assert.equal(harness.calls.slice(harness.calls.indexOf(blockedWrite) + 1).some(call => call.name === 'state.readState'), true, 'CAUSAL_RED: durable BLOCKED state must be read back');
    assert.equal(harness.stateStore.state.macro_state, 'BLOCKED'); assert.equal(harness.count('handoff.writeReadback'), 1, 'CAUSAL_RED: identity conflict cannot trigger another Handoff external effect'); assert.equal(harness.calls.some(call => call.name === 'ledger.prepareAppend' && call.request.event_class === 'HANDOFF_READY'), false, 'CAUSAL_RED: mismatched Handoff bytes cannot publish HANDOFF_READY');
  });
  await t.test('Validator settlement with a wrong Candidate subject blocks before branch push', async () => {
    const harness = await createCoordinatorUnderTest(); const identity = primeState(harness, { macro_state: 'DELIVERING', phase: 'VALIDATOR', candidate: makeCandidate({ frozen: false, validator_head: null }), delivery: null });
    const action = await harness.coordinator.run({ change_id: CHANGE_ID, ...identity });
    assertExactResult(action, { operation: 'run', outcome: 'AGENT_ACTION', state: 'DELIVERING' });
    assert.equal(action.payload.action.role, 'juaner_validator', 'PRECONDITION_NOT_REACHED: VALIDATOR must request juaner_validator');
    assert.equal(action.payload.action.subject_sha, CANDIDATE_SHA, 'PRECONDITION_NOT_REACHED: Validator action must bind the exact Candidate');
    const { action_kind, ...binding } = action.payload.action; assert.equal(action_kind, 'LAUNCH_AGENT');
    const started = await harness.coordinator.settlement({ change_id: CHANGE_ID, expected_state_version: action.state_version, expected_state_hash: action.state_hash, settlement: { ...binding, stage: 'STARTED', observed_child_id: 'validator-child-identity' } });
    assertExactResult(started, { operation: 'settlement', outcome: 'WAITING', state: 'DELIVERING' });
    const result = await harness.coordinator.settlement({ change_id: CHANGE_ID, expected_state_version: started.state_version, expected_state_hash: started.state_hash, settlement: { ...binding, subject_sha: GIT_SHA, stage: 'RESULT', observed_child_id: 'validator-child-identity', status: 'PASS', artifact_path: 'outputs/validator.md', artifact_sha256: SHA256 } });
    assertExactResult(result, { operation: 'settlement', outcome: 'BLOCKED', state: 'BLOCKED' });
    noCall(harness, 'git.pushBranch');
  });
});

test('TEST-DTF-R1-008: PR routing uses only the same-process verified DISPATCH repository identity', async t => {
  await t.test('query and create receive the exact signed repository_id instead of Change or inferred identity', async () => {
    const harness = await createCoordinatorUnderTest();
    const admitted = await harness.coordinator.applyControllerCommand(signed());
    assertExactResult(admitted, { operation: 'applyControllerCommand', outcome: 'APPLIED', state: 'READY' });
    const identity = primeState(harness, {
      macro_state: 'DELIVERING', phase: 'PR', state_version: 7,
      admission: harness.stateStore.state.admission,
      candidate: makeCandidate(), delivery: makeDelivery({ pull_request: null, handoff_sha256: null }),
    });
    const result = await harness.coordinator.run({ change_id: CHANGE_ID, ...identity });
    assertExactResult(result, { operation: 'run', outcome: 'ADVANCED', state: 'DELIVERING' });
    const query = harness.calls.find(call => call.name === 'pull_request.queryCurrent')?.request;
    const create = harness.calls.find(call => call.name === 'pull_request.createOrReuse')?.request;
    assert.deepEqual({ query_repository: query?.repository, create_repository: create?.repository }, { query_repository: REPOSITORY_ID, create_repository: REPOSITORY_ID }, 'CAUSAL_RED: PR authority comes only from acceptedDispatch.body.repository.repository_id');
    assert.notEqual(query?.repository, CHANGE_ID, 'CAUSAL_RED: Change identity is never repository identity');
    assert.notEqual(create?.repository, CHANGE_ID, 'CAUSAL_RED: Change identity is never repository identity');
  });

  await t.test('restart without complete accepted DISPATCH authority blocks before every PR side effect', async () => {
    const harness = await createCoordinatorUnderTest();
    const identity = primeState(harness, { macro_state: 'DELIVERING', phase: 'PR', state_version: 7, candidate: makeCandidate(), delivery: makeDelivery({ pull_request: null, handoff_sha256: null }) });
    const restarted = productionCoordinatorModule.createCoordinatorCore(harness.dependencies);
    const result = await restarted.run({ change_id: CHANGE_ID, ...identity });
    assertExactResult(result, { operation: 'run', outcome: 'BLOCKED', state: 'BLOCKED' });
    assert.equal(result.payload.blocked_reason, 'ADMISSION_EVIDENCE_UNAVAILABLE');
    noCall(harness, 'pull_request.queryCurrent');
    noCall(harness, 'pull_request.createOrReuse');
    noCall(harness, 'pull_request.readback');
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
  const reviewEvidence = [{ kind: 'controller_decision', id: 'changes-requested-001', sha256: SHA256, subject_sha: CANDIDATE_SHA }];
  const revisionFor = (identity, evidence_refs = reviewEvidence) => signed({
    command_kind: 'REVISION', command_id: 'fcr-revision-001', idempotency_id: 'fcr-revision-idem-001',
    nonce: 'D'.repeat(43) + '=',
    payload: { changes_requested_ref: 'changes-requested-001', revision_of_candidate_sha: CANDIDATE_SHA, resume_phase: 'TEST_RED' },
    evidence_refs, expected_state_version: identity.expected_state_version, expected_state_hash: identity.expected_state_hash,
  });
  const awaiting = async () => {
    const harness = await createCoordinatorUnderTest();
    const admitted = await harness.coordinator.applyControllerCommand(signed());
    assertExactResult(admitted, { operation: 'applyControllerCommand', outcome: 'APPLIED', state: 'READY' });
    const identity = primeState(harness, { macro_state: 'AWAITING_CONTROLLER', phase: null, state_version: 7, admission: harness.stateStore.state.admission, candidate: makeCandidate(), delivery: makeDelivery(), blocked_reason: null, resume_target: null });
    return { harness, identity };
  };
  await t.test('matching signed decision evidence binds the exact Frozen Candidate and preserves delivery predecessor identities', async () => {
    const { harness, identity } = await awaiting();
    const result = await harness.coordinator.applyControllerCommand(revisionFor(identity));
    assertExactResult(result, { operation: 'applyControllerCommand', outcome: 'APPLIED', state: 'EXECUTING' });
    assert.equal(result.payload.phase, 'TEST_RED');
    assert.deepEqual(harness.stateStore.state.authorization_cycle, { command_id: 'fcr-revision-001', command_kind: 'REVISION', auto_repair_attempt: 0 });
    assert.equal(harness.stateStore.state.candidate.sha, CANDIDATE_SHA);
    assert.equal(harness.stateStore.state.delivery.remote_head, CANDIDATE_SHA);
    noCall(harness, 'git.createOrReuseWorktree'); noCall(harness, 'git.stageExact'); noCall(harness, 'git.pushBranch'); noCall(harness, 'pull_request.createOrReuse');
  });
  await t.test('wrong Candidate-subject decision evidence rejects before State, Ledger, or Agent activity', async () => {
    const { harness, identity } = await awaiting();
    const before = { state: harness.count('state.writeState'), ledger: harness.count('ledger.prepareAppend'), agent: harness.calls.filter(call => call.name === 'ledger.prepareAppend' && call.request.event_class === 'AGENT_RUN').length };
    const result = await harness.coordinator.applyControllerCommand(revisionFor(identity, [{ ...reviewEvidence[0], subject_sha: GIT_SHA }]));
    assertExactResult(result, { operation: 'applyControllerCommand', outcome: 'REJECTED' });
    assert.deepEqual({ state: harness.count('state.writeState'), ledger: harness.count('ledger.prepareAppend'), agent: harness.calls.filter(call => call.name === 'ledger.prepareAppend' && call.request.event_class === 'AGENT_RUN').length }, before, 'CAUSAL_RED: non-Candidate decision evidence must reject before durable or Agent effects');
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
      const { harness, identity } = await awaiting();
      if (mutateState) mutateState(harness.stateStore.state);
      const current = mutateState ? primeState(harness, structuredClone(harness.stateStore.state)) : identity;
      const request = revisionFor(current); const body = JSON.parse(new TextDecoder().decode(request.command_body_bytes));
      if (mutateBody) mutateBody(body);
      const before = { state: harness.count('state.writeState'), ledger: harness.count('ledger.prepareAppend') };
      const result = await harness.coordinator.applyControllerCommand({ command_body_bytes: bytes(body), signature_bytes: request.signature_bytes });
      assertExactResult(result, { operation: 'applyControllerCommand', outcome: 'REJECTED' }, `CAUSAL_RED: ${name}`);
      assert.deepEqual({ state: harness.count('state.writeState'), ledger: harness.count('ledger.prepareAppend') }, before, `CAUSAL_RED: ${name} must reject before durable mutation`);
    }
  });
  await t.test('a revision naming any Candidate other than the Frozen Candidate rejects before State or Ledger mutation', async () => {
    const { harness, identity } = await awaiting();
    const before = { state: harness.count('state.writeState'), ledger: harness.count('ledger.prepareAppend') };
    const request = revisionFor(identity);
    const body = JSON.parse(new TextDecoder().decode(request.command_body_bytes));
    body.payload.revision_of_candidate_sha = GIT_SHA;
    const result = await harness.coordinator.applyControllerCommand({ command_body_bytes: bytes(body), signature_bytes: request.signature_bytes });
    assertExactResult(result, { operation: 'applyControllerCommand', outcome: 'REJECTED' });
    assert.deepEqual({ state: harness.count('state.writeState'), ledger: harness.count('ledger.prepareAppend') }, before, 'CAUSAL_RED: mismatched revision Candidate cannot consume the exact Frozen Candidate review return');
  });
  await t.test('an empty changes-requested reference cannot match an empty evidence identity or authorize revision effects', async () => {
    const { harness, identity } = await awaiting();
    const request = revisionFor(identity);
    const body = JSON.parse(new TextDecoder().decode(request.command_body_bytes));
    body.payload.changes_requested_ref = '';
    body.evidence_refs = [{ ...reviewEvidence[0], id: '' }];
    const before = {
      state: harness.count('state.writeState'),
      ledger: harness.count('ledger.prepareAppend'),
      agent: harness.calls.filter(call => call.name === 'ledger.prepareAppend' && call.request.event_class === 'AGENT_RUN').length,
    };
    const result = await harness.coordinator.applyControllerCommand({ command_body_bytes: bytes(body), signature_bytes: request.signature_bytes });
    assert.deepEqual({
      outcome: result.outcome,
      error_code: result.error_code,
      effects: {
        state: harness.count('state.writeState'),
        ledger: harness.count('ledger.prepareAppend'),
        agent: harness.calls.filter(call => call.name === 'ledger.prepareAppend' && call.request.event_class === 'AGENT_RUN').length,
      },
    }, {
      outcome: 'REJECTED',
      error_code: 'INPUT_INVALID',
      effects: before,
    }, 'CAUSAL_RED: empty Controller decision identities cannot satisfy REVISION evidence binding or mutate durable state');
  });
});

test('TEST-FCR-003: later Candidates use the durable local parent and publication preserves first-versus-update boundaries', async t => {
  const nextCandidate = '3'.repeat(40);
  await t.test('STAGE binds inspectWorktree and stageExact to the baseline first Candidate or durable prior Candidate', async () => {
    const cases = [
      ['first Candidate', null, GIT_SHA],
      ['later Candidate', makeCandidate({ frozen: true }), CANDIDATE_SHA],
    ];
    const observed = [];
    for (const [name, candidate, expectedHead] of cases) {
      const harness = await createCoordinatorUnderTest();
      const identity = primeState(harness, { macro_state: 'DELIVERING', phase: 'STAGE', candidate, delivery: candidate ? makeDelivery() : null });
      harness.fault('git.inspectWorktree', { kind: 'OK', value: { worktree_root: '/tmp/dtf-worktree', branch: 'work/mac-mini/dtf', head_sha: expectedHead, common_git_dir: '/tmp/dtf-repo/.git', status_entries: [], clean: true } });
      const result = await harness.coordinator.run({ change_id: CHANGE_ID, ...identity });
      assertExactResult(result, { operation: 'run', outcome: 'ADVANCED', state: 'DELIVERING' });
      const inspected = harness.calls.find(call => call.name === 'git.inspectWorktree');
      const staged = harness.calls.find(call => call.name === 'git.stageExact');
      observed.push({ name, inspected_branch: inspected?.request.expected_branch ?? null, inspected_head: inspected?.request.expected_head ?? null, staged_head: staged?.request.expected_head ?? null });
    }
    assert.deepEqual(observed, cases.map(([name,, expectedHead]) => ({ name, inspected_branch: 'work/mac-mini/dtf', inspected_head: expectedHead, staged_head: expectedHead })), 'CAUSAL_RED: every STAGE cycle binds inspection and staging to its exact local predecessor');
  });
  await t.test('a later Candidate commit binds the exact durable prior Candidate rather than baseline', async () => {
    const harness = await createCoordinatorUnderTest();
    const identity = primeState(harness, { macro_state: 'DELIVERING', phase: 'CANDIDATE_COMMIT', candidate: makeCandidate({ frozen: true }), delivery: makeDelivery() });
    const committed = { sha: nextCandidate, parent: CANDIDATE_SHA, tree: GIT_SHA, branch: 'work/mac-mini/dtf' };
    harness.fault('git.commitCandidate', { kind: 'OK', value: committed });
    harness.fault('git.readCommit', { kind: 'OK', value: committed });
    const result = await harness.coordinator.run({ change_id: CHANGE_ID, ...identity });
    const commit = harness.calls.find(call => call.name === 'git.commitCandidate');
    assert.equal(commit?.request.expected_parent, CANDIDATE_SHA, 'CAUSAL_RED: a revision or auto-repair Candidate must parent the durable prior local Candidate, never baseline');
    assertExactResult(result, { operation: 'run', outcome: 'ADVANCED', state: 'DELIVERING' });
  });
  await t.test('a published branch reads the exact old remote Head before its non-force update', async () => {
    const harness = await createCoordinatorUnderTest();
    const candidate = makeCandidate({ sha: nextCandidate, parent: CANDIDATE_SHA, frozen: false, validator_head: nextCandidate });
    const identity = primeState(harness, { macro_state: 'DELIVERING', phase: 'BRANCH_PUSH', candidate, delivery: makeDelivery({ remote_head: CANDIDATE_SHA }) });
    harness.fault('git.readRemoteBranch', { kind: 'OK', value: { remote_head: CANDIDATE_SHA } }, { kind: 'OK', value: { remote_head: nextCandidate } });
    harness.fault('git.pushBranch', { kind: 'OK', value: { prior_remote_head: CANDIDATE_SHA, remote_head: nextCandidate, forced: false, deleted: false } });
    await harness.coordinator.run({ change_id: CHANGE_ID, ...identity });
    const names = harness.calls.map(call => call.name);
    assert.ok(names.indexOf('git.readRemoteBranch') < names.indexOf('git.pushBranch'), 'CAUSAL_RED: a non-null durable delivery.remote_head requires exact pre-push readRemoteBranch');
    assert.equal(harness.calls.find(call => call.name === 'git.pushBranch')?.request.expected_remote_head, CANDIDATE_SHA, 'CAUSAL_RED: normal push must carry the exact durable remote predecessor');
  });
  await t.test('a mismatched old remote Head blocks the already-published branch before push', async () => {
    const harness = await createCoordinatorUnderTest();
    const candidate = makeCandidate({ sha: nextCandidate, parent: CANDIDATE_SHA, frozen: false, validator_head: nextCandidate });
    const identity = primeState(harness, { macro_state: 'DELIVERING', phase: 'BRANCH_PUSH', candidate, delivery: makeDelivery({ remote_head: CANDIDATE_SHA }) });
    harness.fault('git.readRemoteBranch', { kind: 'OK', value: { remote_head: GIT_SHA } });
    harness.fault('git.pushBranch', { kind: 'OK', value: { prior_remote_head: CANDIDATE_SHA, remote_head: nextCandidate, forced: false, deleted: false } });
    const result = await harness.coordinator.run({ change_id: CHANGE_ID, ...identity });
    assertExactResult(result, { operation: 'run', outcome: 'BLOCKED', state: 'BLOCKED' });
    reached(harness, 'git.readRemoteBranch'); noCall(harness, 'git.pushBranch'); noCall(harness, 'pull_request.createOrReuse'); noCall(harness, 'handoff.writeReadback');
  });
  await t.test('a null remote predecessor retains first normal push and only post-push readback', async () => {
    const harness = await createCoordinatorUnderTest();
    const candidate = makeCandidate({ sha: nextCandidate, parent: CANDIDATE_SHA, frozen: false, validator_head: nextCandidate });
    const identity = primeState(harness, { macro_state: 'DELIVERING', phase: 'BRANCH_PUSH', candidate, delivery: null });
    harness.fault('git.pushBranch', { kind: 'OK', value: { prior_remote_head: null, remote_head: nextCandidate, forced: false, deleted: false } });
    harness.fault('git.readRemoteBranch', { kind: 'OK', value: { remote_head: nextCandidate } });
    const result = await harness.coordinator.run({ change_id: CHANGE_ID, ...identity });
    assertExactResult(result, { operation: 'run', outcome: 'ADVANCED', state: 'DELIVERING' });
    const names = harness.calls.map(call => call.name);
    assert.equal(harness.count('git.readRemoteBranch'), 1, 'CAUSAL_RED: first publication has no pre-push remote-absence gateway');
    assert.ok(names.indexOf('git.pushBranch') < names.indexOf('git.readRemoteBranch'), 'CAUSAL_RED: first publication reads remote only after normal push');
  });
  await t.test('a current existing PR is reused for the new Candidate Head without replacement creation', async () => {
    const harness = await createCoordinatorUnderTest();
    const candidate = makeCandidate({ sha: nextCandidate, parent: CANDIDATE_SHA, frozen: true, validator_head: nextCandidate });
    const prior = makeDelivery({ remote_head: nextCandidate, pull_request: { number: 42, url: 'https://invalid.example/pr/42', base: 'main', head_branch: 'work/mac-mini/dtf', head_sha: CANDIDATE_SHA, review_ready: true } });
    const identity = primeState(harness, { macro_state: 'DELIVERING', phase: 'PR', candidate, delivery: prior });
    const current = { number: 42, url: 'https://invalid.example/pr/42', base: 'main', head_branch: 'work/mac-mini/dtf', head_sha: nextCandidate, review_ready: true };
    harness.fault('pull_request.queryCurrent', { kind: 'OK', value: current });
    harness.fault('pull_request.readback', { kind: 'OK', value: { number: 42, base: 'main', head_branch: 'work/mac-mini/dtf', head_sha: nextCandidate, review_ready: true } });
    const result = await harness.coordinator.run({ change_id: CHANGE_ID, ...identity });
    assertExactResult(result, { operation: 'run', outcome: 'ADVANCED', state: 'DELIVERING' });
    noCall(harness, 'pull_request.createOrReuse');
    assert.equal(harness.calls.find(call => call.name === 'pull_request.readback')?.request.expected_head, nextCandidate);
  });
});

test('TEST-FCR-004: settlements are the four canonical variants and NOT_STARTED is Coordinator-only before REQUESTED', async t => {
  const actionFor = async harness => {
    const identity = primeState(harness, { macro_state: 'EXECUTING', phase: 'SPEC' });
    const action = await harness.coordinator.run({ change_id: CHANGE_ID, ...identity });
    assertExactResult(action, { operation: 'run', outcome: 'AGENT_ACTION', state: 'EXECUTING' });
    const { action_kind, ...binding } = action.payload.action;
    return { action, binding };
  };
  await t.test('REQUESTED is durable before the canonical STARTED and RESULT progression', async () => {
    const harness = await createCoordinatorUnderTest(); const { action, binding } = await actionFor(harness);
    const requested = harness.calls.find(call => call.name === 'ledger.prepareAppend' && call.request.event_class === 'AGENT_RUN' && call.request.detail.stage === 'REQUESTED');
    assert.deepEqual(requested?.request.detail, { stage: 'REQUESTED', correlation_id: binding.correlation_id, role: binding.role, subject_sha: binding.subject_sha });
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
    const agentEvents = harness.calls.filter(call => call.name === 'ledger.prepareAppend' && call.request.event_class === 'AGENT_RUN').map(call => call.request.detail);
    assert.equal(agentEvents.length, 1, 'CAUSAL_RED: a real pre-request failure appends exactly one NOT_STARTED fact and no REQUESTED fact');
    const detail = agentEvents[0];
    assert.deepEqual(Object.keys(detail ?? {}).sort(), ['agent', 'allowed_paths', 'brief_sha256', 'evaluation_id', 'idempotency_id', 'input_sha256', 'model', 'output_schema_sha256', 'phase', 'reason_code', 'reasoning', 'role', 'sandbox', 'stage', 'state_version', 'subject_sha'].sort(), 'CAUSAL_RED: NOT_STARTED has the canonical closed detail shape without correlation or child identity');
    assert.deepEqual({ stage: detail?.stage, role: detail?.role, agent: detail?.agent, model: detail?.model, reasoning: detail?.reasoning, sandbox: detail?.sandbox, allowed_paths: detail?.allowed_paths, phase: detail?.phase, state_version: detail?.state_version, brief_sha256: detail?.brief_sha256, input_sha256: detail?.input_sha256, output_schema_sha256: detail?.output_schema_sha256, subject_sha: detail?.subject_sha, reason_code: detail?.reason_code }, { stage: 'NOT_STARTED', role: 'juaner_spec', agent: 'juaner_spec', model: 'gpt-5.6-terra', reasoning: 'high', sandbox: 'workspace-write', allowed_paths: ['openspec/changes/dual-device-transition-foundation/**'], phase: 'SPEC', state_version: 0, brief_sha256: SHA256, input_sha256: SHA256, output_schema_sha256: SHA256, subject_sha: GIT_SHA, reason_code: 'PRECONDITION_FAILED' });
    assert.equal(typeof detail?.evaluation_id, 'string'); assert.ok(detail.evaluation_id.length > 0); assert.equal(typeof detail?.idempotency_id, 'string'); assert.ok(detail.idempotency_id.length > 0);
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
          { state: failed.state, state_version: failed.state_version, state_hash: failed.state_hash, payload: { pointer_status: 'ACTIVE', active_change_id: CHANGE_ID, macro_state: 'BLOCKED', phase: null, pending_action: null, candidate: null, delivery: null, orphan_ready: null, local_pause: null } },
          `PCRR-PSP-AC-002-02: ${route} ${name} must publicly bind the authentic blocked source before isolation`,
        );
        const state = structuredClone(harness.stateStore.state);
        mutateState(state);
        const primed = primeState(harness, state);
        identity = { state_version: primed.expected_state_version, state_hash: primed.expected_state_hash };
        beforeStatus = await publicStatus(harness);
        assert.deepEqual(
          { state: beforeStatus.state, state_version: beforeStatus.state_version, state_hash: beforeStatus.state_hash, payload: beforeStatus.payload },
          { state: primed.state.macro_state, state_version: primed.expected_state_version, state_hash: primed.expected_state_hash, payload: { pointer_status: 'ACTIVE', active_change_id: CHANGE_ID, macro_state: primed.state.macro_state, phase: primed.state.phase, pending_action: primed.state.pending_agent ? { kind: 'AGENT_SETTLEMENT', correlation_id: primed.state.pending_agent.correlation_id } : null, candidate: primed.state.candidate, delivery: primed.state.delivery, orphan_ready: null, local_pause: null } },
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
    const identity = primeState(harness, {
      macro_state: 'DELIVERING', phase: 'VALIDATOR', state_version: 7,
      admission: harness.stateStore.state.admission,
      repository: structuredClone(harness.stateStore.state.repository),
      candidate: makeCandidate({ frozen: false, validator_head: null }), delivery: null,
      authorization_cycle: { command_id: 'command-001', command_kind: 'DISPATCH', auto_repair_attempt: 1 },
    });
    const action = await harness.coordinator.run({ change_id: CHANGE_ID, ...identity });
    assertExactResult(action, { operation: 'run', outcome: 'AGENT_ACTION', state: 'DELIVERING' });
    assert.equal(action.payload.action.role, 'juaner_validator');
    const failed = await settle(harness, action, 'FAIL', 'pcrr-validator-second-fail');
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
  const establishAwaitingController = async () => {
    const harness = await createCoordinatorUnderTest();
    const admitted = await harness.coordinator.applyControllerCommand(signed());
    assertExactResult(admitted, { operation: 'applyControllerCommand', outcome: 'APPLIED', state: 'READY' });
    const identity = primeState(harness, {
      macro_state: 'AWAITING_CONTROLLER', phase: null, state_version: 7,
      admission: harness.stateStore.state.admission,
      repository: structuredClone(harness.stateStore.state.repository),
      candidate: makeCandidate(), delivery: makeDelivery(), blocked_reason: null, resume_target: null,
    });
    const status = await publicStatus(harness);
    assert.deepEqual({ state: status.state, phase: status.payload.phase, candidate: status.payload.candidate?.sha, delivery: status.payload.delivery?.remote_head }, { state: 'AWAITING_CONTROLLER', phase: null, candidate: CANDIDATE_SHA, delivery: CANDIDATE_SHA });
    return { harness, identity };
  };
  const frozenRevisionFor = identity => signed({
    command_kind: 'REVISION', command_id: 'pcrr-frozen-revision-001', idempotency_id: 'pcrr-frozen-revision-idem-001', nonce: 'D'.repeat(43) + '=',
    payload: { changes_requested_ref: 'changes-requested-001', revision_of_candidate_sha: CANDIDATE_SHA, resume_phase: 'TEST_RED' },
    evidence_refs: [{ kind: 'controller_decision', id: 'changes-requested-001', sha256: SHA256, subject_sha: CANDIDATE_SHA }],
    expected_state_version: identity.expected_state_version, expected_state_hash: identity.expected_state_hash,
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
      `PCRR-AC-002-03: Frozen-Candidate ${name} must fail closed before State/Ledger/Agent/Git/validation/PR/Handoff progress`,
    );
  };
  await t.test('exact canonical replay returns the first result before the next public run, with no new effect', async () => {
    const { harness, identity } = await establishAwaitingController();
    const request = frozenRevisionFor(identity);
    const first = await harness.coordinator.applyControllerCommand(request);
    assertExactResult(first, { operation: 'applyControllerCommand', outcome: 'APPLIED', state: 'EXECUTING' });
    const beforeEffects = revisionEffects(harness);
    const replay = await harness.coordinator.applyControllerCommand(request);
    assert.deepEqual({ replay, effects: revisionEffects(harness) }, { replay: first, effects: beforeEffects }, 'PCRR-AC-002-03: exact Frozen-Candidate REVISION replay returns its original result with zero additional effect');
    const next = await harness.coordinator.run({ change_id: CHANGE_ID, expected_state_version: first.state_version, expected_state_hash: first.state_hash });
    assertExactResult(next, { operation: 'run', outcome: 'AGENT_ACTION', state: 'EXECUTING' });
    const settled = await settle(harness, next, 'PASS', 'pcrr-frozen-replay-test-pass');
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
      const { harness, identity } = await establishAwaitingController();
      await assertConflict({ harness, request: frozenRevisionFor(identity), mutate, name });
    });
  }
  for (const [name, mutate] of [
    ['applied REVISION command_id', body => { body.command_id = 'pcrr-frozen-revision-001'; body.receipt_digest = 'e'.repeat(64); }],
    ['applied REVISION nonce', body => { body.nonce = 'D'.repeat(43) + '='; body.receipt_digest = 'e'.repeat(64); }],
    ['applied REVISION idempotency_id', body => { body.idempotency_id = 'pcrr-frozen-revision-idem-001'; body.receipt_digest = 'e'.repeat(64); }],
  ]) {
    await t.test(`changed-byte reuse of ${name} rejects exactly without effect`, async () => {
      const { harness, identity } = await establishAwaitingController();
      const request = frozenRevisionFor(identity);
      const first = await harness.coordinator.applyControllerCommand(request);
      assertExactResult(first, { operation: 'applyControllerCommand', outcome: 'APPLIED', state: 'EXECUTING' });
      await assertConflict({ harness, request, mutate, name });
    });
  }
});
