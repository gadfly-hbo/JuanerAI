import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CHANGE_B, CHANGE_ID, CANDIDATE_SHA, GIT_SHA, SHA256, AGENT_STAGES, EVENT_CLASSES,
  MACRO_STATES, PHASES, absent, ambiguous, assertExactResult, assertHelperHealth, bytes,
  conflict, createCoordinatorUnderTest, makeCandidate, makeDelivery, makeDispatch,
  primeState, sha256, unavailable,
} from './fixtures.mjs';

const signed = overrides => ({ command_body_bytes: bytes(makeDispatch(overrides)), signature_bytes: new Uint8Array([1, 2, 3]) });
const stateIdentity = { expected_state_version: 0, expected_state_hash: SHA256 };
const noCall = (harness, name) => assert.equal(harness.count(name), 0, `${name} must not be called`);
const reached = (harness, name) => assert.ok(harness.count(name) > 0, `PRECONDITION_NOT_REACHED: ${name} was not called`);

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
  await t.test('same-scope REVISION resets a blocked Change to EXECUTING/TEST_RED with a fresh authorization cycle', async () => {
    const harness = await createCoordinatorUnderTest();
    const identity = primeState(harness, { macro_state: 'BLOCKED', phase: null, state_version: 7, candidate: null, blocked_reason: 'VALIDATOR_SECOND_FAIL' });
    const revision = signed({
      command_kind: 'REVISION',
      payload: { changes_requested_ref: 'changes-requested-001', revision_of_candidate_sha: null, resume_phase: 'TEST_RED' },
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
    ['foreign Change', signed({ change_id: CHANGE_B }), 'WIP_AUTHORITY_INVALID'],
    ['forbidden trust payload', signed({ public_key: 'injected' }), 'INPUT_INVALID'],
  ]) {
    await t.test(`rejects ${name} before protected effect`, async () => {
      const isolated = await createCoordinatorUnderTest();
      if (name === 'signature failure') isolated.fault('verifier.verify', { kind: 'REJECTED', error_code: code });
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

test('TEST-DTF-R1-010: every RELEASE failure retains active pointer and exact replay clears it only after CLOSED', async t => {
  const releaseFor = identity => signed({ command_kind: 'RELEASE', payload: { squash_sha: CANDIDATE_SHA, acceptance_ref: 'acceptance-001', merge_ref: 'merge-001', archive_ref: 'archive-001', origin_main_sha: CANDIDATE_SHA, macbook_main_sha: CANDIDATE_SHA }, expected_state_version: identity.expected_state_version, expected_state_hash: identity.expected_state_hash });
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
