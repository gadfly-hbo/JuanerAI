import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { generateKeyPairSync, sign, verify } from 'node:crypto';
import {
  chmod, copyFile, lstat, mkdir, mkdtemp, open, readFile, readdir, realpath, rename, rm, symlink, writeFile,
} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { canonicalJson, makeDispatch, sha256 } from './fixtures.mjs';

const root = path.dirname(fileURLToPath(import.meta.url));
const productionPath = path.join(root, 'production.mjs');
const adaptersPath = path.join(root, 'adapters.mjs');
const hostLoopPath = path.join(root, 'host-loop.mjs');
const controllerCliPath = path.join(root, 'controller-cli.mjs');
const installerPath = path.join(root, 'install-host-loop');

// This is a Test-owned, canonical output-schema sample for the Design §7.1
// ValidatorArtifactV1 contract.  It is a signed-input fixture, not a claimed
// production package artifact or evidence that the private Host producer ran.
const validatorArtifactOutputSchema = Object.freeze({
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  $defs: {
    non_empty_string: { type: 'string', minLength: 1 },
    git_sha: { type: 'string', pattern: '^[0-9a-f]{40}$' },
    sha256: { type: 'string', pattern: '^[0-9a-f]{64}$' },
    evidence_ref: {
      type: 'object', additionalProperties: false,
      required: ['kind', 'id', 'sha256', 'subject_sha'],
      properties: { kind: { $ref: '#/$defs/non_empty_string' }, id: { $ref: '#/$defs/non_empty_string' }, sha256: { $ref: '#/$defs/sha256' }, subject_sha: { $ref: '#/$defs/git_sha' } },
    },
    note: {
      type: 'object', additionalProperties: false,
      required: ['note_id', 'summary', 'evidence_refs'],
      properties: { note_id: { $ref: '#/$defs/non_empty_string' }, summary: { $ref: '#/$defs/non_empty_string' }, evidence_refs: { type: 'array', items: { $ref: '#/$defs/evidence_ref' } } },
    },
    finding: {
      type: 'object', additionalProperties: false,
      required: ['finding_id', 'classification', 'requirement_ids', 'acceptance_ids', 'paths', 'summary', 'evidence_refs'],
      properties: {
        finding_id: { $ref: '#/$defs/non_empty_string' },
        classification: { enum: ['IMPLEMENTATION_IN_SCOPE', 'CONTRACT', 'ARCHITECTURE', 'SCOPE', 'PATH', 'DEPENDENCY', 'PERMISSION', 'HOST', 'IDENTITY', 'EVIDENCE', 'UNKNOWN'] },
        requirement_ids: { type: 'array', items: { $ref: '#/$defs/non_empty_string' } },
        acceptance_ids: { type: 'array', items: { $ref: '#/$defs/non_empty_string' } },
        paths: { type: 'array', items: { $ref: '#/$defs/non_empty_string' } },
        summary: { $ref: '#/$defs/non_empty_string' }, evidence_refs: { type: 'array', items: { $ref: '#/$defs/evidence_ref' } },
      },
    },
  },
  type: 'object', additionalProperties: false,
  required: ['schema_version', 'change_id', 'candidate_sha', 'validator_head', 'verdict', 'findings', 'risks', 'unverified', 'open_questions'],
  properties: {
    schema_version: { const: '1.0' }, change_id: { $ref: '#/$defs/non_empty_string' }, candidate_sha: { $ref: '#/$defs/git_sha' }, validator_head: { $ref: '#/$defs/git_sha' }, verdict: { enum: ['PASS', 'FAIL'] },
    findings: { type: 'array', items: { $ref: '#/$defs/finding' } }, risks: { type: 'array', items: { $ref: '#/$defs/note' } }, unverified: { type: 'array', items: { $ref: '#/$defs/note' } }, open_questions: { type: 'array', items: { $ref: '#/$defs/note' } },
  },
});

const repairTestPlanOutputSchema = Object.freeze({
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  type: 'object', additionalProperties: false,
  required: ['schema_version', 'kind', 'status', 'change_id', 'candidate_sha', 'candidate_tree', 'authorization_cycle_command_id', 'repair_execution_attempt', 'derived_input_sha256', 'test_files', 'checks'],
  properties: {
    schema_version: { const: '1.0' }, kind: { const: 'REPAIR_TEST_PLAN_V1' }, status: { const: 'READY_FOR_MECHANICAL_PROOF' },
    change_id: { type: 'string', minLength: 1 }, candidate_sha: { type: 'string', pattern: '^[0-9a-f]{40}$' }, candidate_tree: { type: 'string', pattern: '^[0-9a-f]{40}$' },
    authorization_cycle_command_id: { type: 'string', minLength: 1 }, repair_execution_attempt: { const: 1 }, derived_input_sha256: { type: 'string', pattern: '^[0-9a-f]{64}$' },
    test_files: { type: 'array', minItems: 1, items: { type: 'object', additionalProperties: false, required: ['path', 'byte_length', 'sha256'], properties: { path: { type: 'string', minLength: 1 }, byte_length: { type: 'integer', minimum: 0 }, sha256: { type: 'string', pattern: '^[0-9a-f]{64}$' } } } },
    checks: { type: 'array', minItems: 1, items: { type: 'object', additionalProperties: false, required: ['finding_id', 'requirement_ids', 'acceptance_ids', 'test_path', 'test_file_sha256', 'red_test_id', 'control_test_id'], properties: { finding_id: { type: 'string', minLength: 1 }, requirement_ids: { type: 'array', minItems: 1, items: { type: 'string', minLength: 1 } }, acceptance_ids: { type: 'array', minItems: 1, items: { type: 'string', minLength: 1 } }, test_path: { type: 'string', minLength: 1 }, test_file_sha256: { type: 'string', pattern: '^[0-9a-f]{64}$' }, red_test_id: { type: 'string', minLength: 1 }, control_test_id: { type: 'string', minLength: 1 } } } },
  },
});

// Fixed independently of every mutated artifact below.  A courier test must
// never turn a bad artifact's identities into the action identities it uses
// to decide whether that artifact is admissible.
const validatorCourierIdentity = Object.freeze({
  change_id: 'CHG-mode-activation',
  candidate_sha: '4'.repeat(40),
  validator_head: '4'.repeat(40),
  correlation_id: 'corr-m2-validator-negative-001',
  idempotency_id: 'm2-validator-negative-idempotency-001',
});

const validatorCourierAction = output_schema_sha256 => ({
  action_kind: 'LAUNCH_AGENT', correlation_id: validatorCourierIdentity.correlation_id, role: 'juaner_validator', agent: 'juaner_validator',
  model: 'gpt-5.6-sol', reasoning: 'medium', sandbox: 'read-only', allowed_paths: [], phase: 'VALIDATOR', state_version: 9,
  brief_sha256: '1'.repeat(64), input_sha256: '2'.repeat(64), output_schema_sha256, subject_sha: validatorCourierIdentity.candidate_sha,
  idempotency_id: validatorCourierIdentity.idempotency_id,
});

async function loadRequired(modulePath, requiredExports, obligation) {
  try {
    const loaded = await import(new URL(`file://${modulePath}`).href);
    for (const name of requiredExports) assert.equal(typeof loaded[name] === 'undefined', false, `${obligation}: missing export ${name}`);
    return loaded;
  } catch (error) {
    if (error?.code !== 'ERR_MODULE_NOT_FOUND') throw error;
    assert.fail(`EXPECTED_RED: ${obligation}; missing ${path.basename(modulePath)} must close exports ${requiredExports.join(', ')}`);
  }
}

async function readRequired(file, obligation) {
  try { return await readFile(file, 'utf8'); }
  catch (error) {
    if (error?.code !== 'ENOENT') throw error;
    assert.fail(`EXPECTED_RED: ${obligation}; missing ${path.basename(file)}`);
  }
}

test('helper health: real ephemeral Ed25519 and isolated temporary OS roots work without repository secrets or host effects', async () => {
  const { privateKey, publicKey } = generateKeyPairSync('ed25519');
  const message = Buffer.from('JuanerAI Mode Activation helper health');
  const signature = sign(null, message, privateKey);
  assert.equal(verify(null, message, publicKey, signature), true);
  const temporary = await mkdtemp(path.join(os.tmpdir(), 'juanerai-ma-health-'));
  try { await writeFile(path.join(temporary, 'probe'), 'temporary-only\n'); }
  finally { await rm(temporary, { recursive: true, force: true }); }
});

test('TEST-MA-TRUST-001 / AC-MA-002-01..04 / CAN-MA-01: production verifier uses real Ed25519 and rejects forged, unknown, revoked, and expired commands effect-free', async () => {
  const production = await loadRequired(productionPath, [
    'CONTROLLER_TRUST_PATH', 'createProductionComposition', 'verifyControllerCommandSignature',
  ], 'fixed-file production trust and composition are required');
  assert.equal(production.CONTROLLER_TRUST_PATH, '/private/etc/juanerai/controller-trust.json');

  const { privateKey, publicKey } = generateKeyPairSync('ed25519');
  const publicBytes = publicKey.export({ type: 'spki', format: 'der' });
  const fingerprint = sha256(publicBytes);
  const body = makeDispatch({ key_id: 'controller-current' });
  const bodyBytes = Buffer.from(canonicalJson(body));
  const signatureBytes = sign(null, bodyBytes, privateKey);
  const trust = {
    schema_version: '1.0',
    active_keys: [{
      key_id: 'controller-current', key_type: 'Ed25519', public_key_spki_base64: publicBytes.toString('base64'),
      fingerprint_sha256: fingerprint, valid_from: '2026-08-26T00:00:00.000Z', valid_until: '2026-08-27T00:00:00.000Z',
    }],
    revoked_key_ids: [],
  };
  const call = (command, signatureValue, trustValue = trust, now = '2026-08-26T08:00:00.000Z') => production.verifyControllerCommandSignature({
    command_body_bytes: Buffer.from(canonicalJson(command)), signature_bytes: signatureValue,
    trust_document_bytes: Buffer.from(canonicalJson(trustValue)), now,
  });

  const accepted = await call(body, signatureBytes);
  assert.deepEqual(accepted, {
    kind: 'VERIFIED', verified_key_id: 'controller-current', body_sha256: sha256(bodyBytes), signature_sha256: sha256(signatureBytes),
  });
  const unknownBody = { ...body, key_id: 'controller-unknown' };
  const cases = [
    ['forged', body, sign(null, Buffer.from('forged bytes'), privateKey), trust, '2026-08-26T08:00:00.000Z'],
    ['unknown', unknownBody, sign(null, Buffer.from(canonicalJson(unknownBody)), privateKey), trust, '2026-08-26T08:00:00.000Z'],
    ['revoked', body, signatureBytes, { ...trust, revoked_key_ids: ['controller-current'] }, '2026-08-26T08:00:00.000Z'],
    ['expired', body, signatureBytes, trust, '2026-08-28T00:00:00.000Z'],
  ];
  for (const [name, command, candidateSignature, candidateTrust, now] of cases) {
    const result = await call(command, candidateSignature, candidateTrust, now);
    assert.equal(result.kind, 'REJECTED', `${name} rejects before production composition can call Core/state/Ledger/Git/PR`);
    assert.equal(JSON.stringify(result).includes(candidateSignature.toString('base64')), false, `${name} result contains no signature bytes`);
  }
});

test('TEST-MA-TRUST-002 / AC-MA-002-02,03,05 / CAN-MA-01,14: trust and signer locations are fixed providers, never payload/CLI/environment injection', async () => {
  const production = await loadRequired(productionPath, ['CONTROLLER_TRUST_PATH', 'createProductionComposition'], 'production trust provider is fixed');
  const controller = await loadRequired(controllerCliPath, ['CONTROLLER_SIGNER_CONFIG_PATH', 'createControllerSigner'], 'MacBook controller signer is required');
  assert.equal(production.CONTROLLER_TRUST_PATH, '/private/etc/juanerai/controller-trust.json');
  assert.equal(controller.CONTROLLER_SIGNER_CONFIG_PATH, '/Users/huangbo/Library/Application Support/JuanerAI/controller/signer.json');
  for (const injection of [
    { trust_path: '/tmp/injected' }, { public_key: 'injected' }, { verifier: () => true }, { command_trust: { key_id: 'injected' } },
  ]) {
    await assert.rejects(async () => production.createProductionComposition(injection), /INPUT_INVALID|TRUST_SOURCE_FORBIDDEN/, 'ordinary composition input cannot replace fixed trust');
  }
  const source = `${await readRequired(productionPath, 'production trust source')}${await readRequired(controllerCliPath, 'Controller signer source')}`;
  assert.doesNotMatch(source, /JUANERAI_(?:PUBLIC_KEY|TRUST_PATH|PRIVATE_KEY)|--(?:public-key|trust-path|private-key)/, 'trust/private-key path injection is not a production option');
  assert.match(source, /(?:0o600|0600)/, 'private signer material enforces mode 0600');
});

test('TEST-MA-SIGNER-003 / AC-MA-002-01,05; AC-MA-003-03 / CAN-MA-01,04: Controller signer stdout is the exact two-field submit envelope', async () => {
  const controller = await loadRequired(controllerCliPath, ['signCanonicalControllerCommand'], 'Controller signer transport framing is required');
  const host = await loadRequired(hostLoopPath, ['createTrustedHostLoop'], 'trusted host submit framing is required');
  const { privateKey } = generateKeyPairSync('ed25519');
  const body = makeDispatch({ key_id: 'controller-current' });
  const bodyBytes = Buffer.from(canonicalJson(body));
  const signed = controller.signCanonicalControllerCommand({
    command_body_bytes: bodyBytes,
    private_key_bytes: privateKey.export({ type: 'pkcs8', format: 'pem' }),
    key_id: body.key_id,
  });
  assert.deepEqual(Object.keys(signed).sort(), ['command_body_base64', 'signature_base64'],
    'CAUSAL_RED: receipt hashes/fingerprint/key id are metadata, not bytes accepted by submit');

  let applied = null;
  const loop = host.createTrustedHostLoop({
    coordinator: {
      async applyControllerCommand(request) { applied = request; return { outcome: 'WAITING' }; },
      async run() { throw new Error('UNREACHABLE'); },
      async settlement() { throw new Error('UNREACHABLE'); },
      async status() { return { outcome: 'WAITING' }; },
    },
    durable_route: async () => { throw new Error('UNREACHABLE'); },
    launch_agent: async () => { throw new Error('UNREACHABLE'); },
    read_artifact: async () => { throw new Error('UNREACHABLE'); },
    inventory_paths: async () => { throw new Error('UNREACHABLE'); },
  });
  await loop.submit(Buffer.from(`${canonicalJson(signed)}\n`));
  assert.deepEqual(applied, {
    command_body_bytes: bodyBytes,
    signature_bytes: Buffer.from(signed.signature_base64, 'base64'),
  }, 'the first signed DISPATCH is directly consumable without reshaping or a compatibility mode');
});

test('TEST-MA-HOST-001 / AC-MA-001-01,02; AC-MA-003-01,04; AC-MA-004-01..03 / CAN-MA-04,05,11,14: one host loop uses only the four Foundation interfaces and four settlement variants', async () => {
  const host = await loadRequired(hostLoopPath, ['HOST_AGENT_BINDING_FIELDS', 'HOST_SETTLEMENT_STAGES', 'createTrustedHostLoop'], 'sole trusted host loop is required');
  assert.deepEqual(host.HOST_SETTLEMENT_STAGES, ['STARTED', 'RESULT', 'START_FAILED', 'INTERRUPTED']);
  assert.deepEqual(host.HOST_AGENT_BINDING_FIELDS, [
    'correlation_id', 'role', 'agent', 'model', 'reasoning', 'sandbox', 'allowed_paths', 'phase', 'state_version',
    'brief_sha256', 'input_sha256', 'output_schema_sha256', 'subject_sha', 'idempotency_id',
  ]);
  await assert.rejects(async () => host.createTrustedHostLoop({ durable_route: null }), /DURABLE_ROUTE_REQUIRED|MANUAL_CONTROLLER_STOP/, 'restart never invents a missing route');
  const source = await readRequired(hostLoopPath, 'host loop source');
  for (const method of ['applyControllerCommand', 'run', 'settlement', 'status']) assert.match(source, new RegExp(`\\b${method}\\b`), `host composes existing ${method}`);
  assert.doesNotMatch(source, /\b(?:stageExact|commitCandidate|pushBranch|readRemoteBranch|canonicalDiff|syncMainFfOnly|queryCurrent|createOrReuse|writeReadback)\b/, 'host settlement cannot duplicate Foundation mechanics');
  assert.doesNotMatch(source, /createTestCoordinator|NOT_STARTED.*settlement|(?:file|stale|second).*lock/i, 'host has no Test factory, NOT_STARTED settlement, or second lock');
});

test('TEST-MA-HOST-002 / AC-MA-003-01,04; AC-MA-004-01,02 / CAN-MA-04,05,11: production host binds and launches the exact same-process AGENT_ACTION', async t => {
  const host = await loadRequired(hostLoopPath, ['HOST_AGENT_BINDING_FIELDS', 'createTrustedHostLoop'], 'real host action binding is required');
  const artifact = Buffer.from('{"status":"PASS"}\n');
  const action = {
    action_kind: 'LAUNCH_AGENT', correlation_id: 'corr-ma-host-001', role: 'juaner_test', agent: 'juaner_test',
    model: 'gpt-5.5', reasoning: 'xhigh', sandbox: 'workspace-write',
    allowed_paths: ['tools/harness/change-coordinator/mode-activation.test.mjs'], phase: 'TEST_RED', state_version: 1,
    brief_sha256: '1'.repeat(64), input_sha256: '2'.repeat(64), output_schema_sha256: '3'.repeat(64),
    subject_sha: '4'.repeat(40), idempotency_id: 'ma-host-idempotency-001',
  };
  const route = {
    ...Object.fromEntries(host.HOST_AGENT_BINDING_FIELDS.map(field => [field, structuredClone(action[field])])),
    codex_executable: '/Applications/Codex.app/Contents/Resources/codex', runtime_uid: 501, runtime_gid: 20,
    worktree_root: '/private/var/db/juanerai/worktrees/CHG-mode-activation',
    output_artifact_path: '/private/var/db/juanerai/outputs/corr-ma-host-001.json',
  };
  const frame = Buffer.from(`${canonicalJson({
    command_body_base64: Buffer.from(canonicalJson(makeDispatch({ key_id: 'controller-current' }))).toString('base64'),
    signature_base64: sign(null, Buffer.from('same-process-route'), generateKeyPairSync('ed25519').privateKey).toString('base64'),
  })}\n`);

  await t.test('normal path preserves action, child, artifact, path inventory, and STARTED/RESULT facts exactly', async () => {
    const settlements = [];
    let launched = null;
    const coordinator = {
      async applyControllerCommand() {
        return { outcome: 'AGENT_ACTION', change_id: 'CHG-mode-activation', state_version: 1, state_hash: 'state-1', payload: { action } };
      },
      async run() { throw new Error('UNREACHABLE'); },
      async settlement(request) {
        settlements.push(request.settlement);
        return { outcome: settlements.length === 2 ? 'WAITING' : 'ADVANCED', change_id: 'CHG-mode-activation', state_version: 1 + settlements.length, state_hash: `state-${1 + settlements.length}` };
      },
      async status() { return { outcome: 'WAITING' }; },
    };
    const loop = host.createTrustedHostLoop({
      coordinator,
      async durable_route(candidate) { assert.deepEqual(candidate, action); return route; },
      async launch_agent(request) {
        launched = request;
        return {
          observed_child_id: 'codex-child-001',
          completed: Promise.resolve({ status: 'PASS', artifact_sha256: sha256(artifact), allowed_path_inventory: action.allowed_paths }),
        };
      },
      async read_artifact(target) { assert.equal(target, route.output_artifact_path); return artifact; },
      async inventory_paths(target) { assert.equal(target, route.worktree_root); return action.allowed_paths; },
    });
    assert.equal((await loop.submit(frame)).outcome, 'WAITING');
    assert.deepEqual(launched, { action, route }, 'launch receives the exact AGENT_ACTION plus its same-process durable route');
    assert.deepEqual(settlements.map(value => value.stage), ['STARTED', 'RESULT']);
    assert.equal(settlements[0].observed_child_id, 'codex-child-001');
    assert.deepEqual(settlements[1], {
      ...Object.fromEntries(host.HOST_AGENT_BINDING_FIELDS.map(field => [field, action[field]])),
      stage: 'RESULT', observed_child_id: 'codex-child-001', status: 'PASS',
      artifact_path: route.output_artifact_path, artifact_sha256: sha256(artifact),
    });
  });

  await t.test('restart with no exact durable route stops instead of settling a default route', async () => {
    const routeQueries = [];
    const settlements = [];
    const calls = { apply: 0, run: 0, status: 0, launch: 0, artifact: 0, inventory: 0 };
    const terminal = { outcome: 'BLOCKED', change_id: 'CHG-mode-activation', state_version: 2, state_hash: 'state-2', payload: { blocked_reason: 'AGENT_START_FAILED' } };
    const expectedRoute = structuredClone(action);
    const expectedSettlement = {
      change_id: 'CHG-mode-activation', expected_state_version: 1, expected_state_hash: 'state-1', settlement: {
        correlation_id: 'corr-ma-host-001', role: 'juaner_test', agent: 'juaner_test', model: 'gpt-5.5', reasoning: 'xhigh', sandbox: 'workspace-write',
        allowed_paths: ['tools/harness/change-coordinator/mode-activation.test.mjs'], phase: 'TEST_RED', state_version: 1,
        brief_sha256: '1'.repeat(64), input_sha256: '2'.repeat(64), output_schema_sha256: '3'.repeat(64),
        subject_sha: '4'.repeat(40), idempotency_id: 'ma-host-idempotency-001', stage: 'START_FAILED', failure_code: 'ROUTE_UNAVAILABLE',
      },
    };
    const expectedTerminal = structuredClone(terminal);
    const loop = host.createTrustedHostLoop({
      coordinator: {
        async applyControllerCommand() { calls.apply += 1; return { outcome: 'AGENT_ACTION', change_id: 'CHG-mode-activation', state_version: 1, state_hash: 'state-1', payload: { action } }; },
        async run() { calls.run += 1; throw new Error('UNREACHABLE'); },
        async settlement(request) { settlements.push(structuredClone(request)); return terminal; },
        async status() { calls.status += 1; throw new Error('UNREACHABLE'); },
      },
      async durable_route(candidate) { routeQueries.push(structuredClone(candidate)); return null; },
      async launch_agent() { calls.launch += 1; throw new Error('UNREACHABLE'); },
      async read_artifact() { calls.artifact += 1; throw new Error('UNREACHABLE'); },
      async inventory_paths() { calls.inventory += 1; throw new Error('UNREACHABLE'); },
    });
    assert.deepEqual(await loop.submit(frame), expectedTerminal, 'the checked terminal settlement result is passed through unchanged');
    assert.deepEqual(routeQueries, [expectedRoute], 'the restart queries exactly the dispatched action once and has no default route');
    assert.deepEqual(settlements, [expectedSettlement], 'CAUSAL_RED: a restarted process reports the exact missing-route failure once, with no default progress');
    assert.deepEqual(calls, { apply: 1, run: 0, status: 0, launch: 0, artifact: 0, inventory: 0 },
      'CAUSAL_RED: missing durable routing performs no launch, reads, extra run, retry, or status fallback');
  });

  const source = await readRequired(hostLoopPath, 'production host bindings');
  const productionSource = await readRequired(productionPath, 'production runtime identity binding');
  const adaptersSource = await readRequired(adaptersPath, 'production Git child identity binding');
  const obligations = {
    no_durable_route_placeholder: !/durable_route:\s*async\s*\(\)\s*=>\s*\{\s*throw new Error\('ROUTE_UNAVAILABLE'\)/.test(source),
    no_launch_placeholder: !/launch_agent:\s*async\s*\(\)\s*=>\s*\{\s*throw new Error\('ROUTE_UNAVAILABLE'\)/.test(source),
    absolute_codex_spawn: /spawn\([^\n]*(?:route|config)\.codex_executable/.test(source),
    exact_child_identity: /runtime_uid/.test(source) && /runtime_gid/.test(source) && /worktree_root/.test(source) && /output_artifact_path/.test(source),
    exact_route_flags: /(?:--model|model)/.test(source) && /reasoning/.test(source) && /sandbox/.test(source) && /shell:\s*false/.test(source),
    git_worktree_runtime_identity: /runtime_uid:\s*config\.runtime_uid/.test(productionSource)
      && /runtime_gid:\s*config\.runtime_gid/.test(productionSource)
      && /uid:\s*(?:options|opt)\.runtime_uid/.test(adaptersSource)
      && /gid:\s*(?:options|opt)\.runtime_gid/.test(adaptersSource),
  };
  assert.deepEqual(Object.entries(obligations).filter(([, met]) => !met).map(([name]) => name), [],
    'CAUSAL_RED: production main must install real absolute Codex spawn/drop-uid bindings, not callback placeholders');
});

test('RED-M2-005 / TEST-M2-006 / 006-L01: controlled Validator courier rereads actual canonical artifact bytes and forwards the unchanged artifact with its verdict', async () => {
  const host = await loadRequired(hostLoopPath, ['HOST_AGENT_BINDING_FIELDS', 'createTrustedHostLoop'], 'Validator courier host seam is required');
  const temporary = await mkdtemp(path.join(os.tmpdir(), 'juanerai-m2-validator-courier-'));
  try {
    const candidate_sha = validatorCourierIdentity.candidate_sha;
    const artifact = {
      schema_version: '1.0', change_id: validatorCourierIdentity.change_id, candidate_sha, validator_head: validatorCourierIdentity.validator_head,
      verdict: 'PASS', findings: [], risks: [], unverified: [], open_questions: [],
    };
    const artifactBytes = Buffer.from(canonicalJson(artifact));
    const artifactPath = path.join(temporary, 'validator.json');
    const outputSchemaBytes = Buffer.from(canonicalJson(validatorArtifactOutputSchema));
    const outputSchemaPath = path.join(temporary, 'validator-artifact-v1.schema.json');
    await writeFile(artifactPath, artifactBytes);
    await writeFile(outputSchemaPath, outputSchemaBytes);
    const action = { ...validatorCourierAction(sha256(outputSchemaBytes)), correlation_id: 'corr-m2-validator-001', idempotency_id: 'm2-validator-idempotency-001' };
    assert.equal(sha256(await readFile(outputSchemaPath)), action.output_schema_sha256, 'the Test-owned canonical schema bytes bind the signed action identity');
    const route = { ...Object.fromEntries(host.HOST_AGENT_BINDING_FIELDS.map(field => [field, structuredClone(action[field])])), worktree_root: temporary, output_schema_path: outputSchemaPath, output_artifact_path: artifactPath };
    const settlements = [];
    const loop = host.createTrustedHostLoop({
      coordinator: {
        async applyControllerCommand() { return { outcome: 'AGENT_ACTION', change_id: validatorCourierIdentity.change_id, state_version: 9, state_hash: 'state-9', payload: { action } }; },
        async run() { throw new Error('UNREACHABLE'); },
        async settlement(request) { settlements.push(request.settlement); return { outcome: settlements.length === 2 ? 'WAITING' : 'ADVANCED', change_id: 'CHG-mode-activation', state_version: 9 + settlements.length, state_hash: `state-${9 + settlements.length}` }; },
        async status() { return { outcome: 'WAITING' }; },
      },
      async durable_route(candidate) { assert.deepEqual(candidate, action); return route; },
      async launch_agent() { return { observed_child_id: 'validator-child-001', completed: Promise.resolve({ status: 'PASS', artifact_sha256: sha256(artifactBytes), allowed_path_inventory: [] }) }; },
      read_artifact: readFile,
      async inventory_paths() { return []; },
    });
    const frame = Buffer.from(`${canonicalJson({ command_body_base64: Buffer.from('{}').toString('base64'), signature_base64: Buffer.from('x').toString('base64') })}\n`);
    assert.equal((await loop.submit(frame)).outcome, 'WAITING');
    assert.deepEqual(settlements.map(settlement => settlement.stage), ['STARTED', 'RESULT']);
    assert.deepEqual(settlements[1], {
      ...Object.fromEntries(host.HOST_AGENT_BINDING_FIELDS.map(field => [field, action[field]])),
      stage: 'RESULT', observed_child_id: 'validator-child-001', status: 'PASS', artifact_path: artifactPath,
      artifact_sha256: sha256(artifactBytes), validator_artifact: artifact,
    });
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
});

async function submitControlledValidatorArtifact({ artifact, completed, artifact_bytes = Buffer.from(canonicalJson(artifact)), action_output_schema_sha256 = null }) {
  const host = await loadRequired(hostLoopPath, ['HOST_AGENT_BINDING_FIELDS', 'createTrustedHostLoop'], 'Validator courier host seam is required');
  const temporary = await mkdtemp(path.join(os.tmpdir(), 'juanerai-m2-validator-courier-negative-'));
  try {
    const artifactBytes = Buffer.from(artifact_bytes);
    const artifactPath = path.join(temporary, 'validator.json');
    const outputSchemaBytes = Buffer.from(canonicalJson(validatorArtifactOutputSchema));
    const outputSchemaPath = path.join(temporary, 'validator-artifact-v1.schema.json');
    await writeFile(artifactPath, artifactBytes); await writeFile(outputSchemaPath, outputSchemaBytes);
    const action = validatorCourierAction(action_output_schema_sha256 ?? sha256(outputSchemaBytes));
    const actualSchemaHash = sha256(await readFile(outputSchemaPath));
    if (action_output_schema_sha256 === null) assert.equal(actualSchemaHash, action.output_schema_sha256, 'all healthy controlled-courier inputs bind the actual Test-owned schema bytes before Host submission');
    else assert.notEqual(actualSchemaHash, action.output_schema_sha256, 'the schema-hash negative keeps the actual schema bytes separate from the damaged delivered action identity');
    const route = { ...Object.fromEntries(host.HOST_AGENT_BINDING_FIELDS.map(field => [field, structuredClone(action[field])])), worktree_root: temporary, output_schema_path: outputSchemaPath, output_artifact_path: artifactPath };
    const settlements = [];
    const loop = host.createTrustedHostLoop({
      coordinator: {
        async applyControllerCommand() { return { outcome: 'AGENT_ACTION', change_id: validatorCourierIdentity.change_id, state_version: 9, state_hash: 'state-9', payload: { action } }; },
        async run() { throw new Error('UNREACHABLE'); },
        async settlement(request) { settlements.push(request.settlement); return { outcome: settlements.length === 2 ? 'WAITING' : 'ADVANCED', change_id: validatorCourierIdentity.change_id, state_version: 9 + settlements.length, state_hash: `state-${9 + settlements.length}` }; },
        async status() { return { outcome: 'WAITING' }; },
      },
      async durable_route(candidate) { assert.deepEqual(candidate, action); return route; },
      async launch_agent() { return { observed_child_id: 'validator-child-negative-001', completed: Promise.resolve({ ...completed, allowed_path_inventory: [] }) }; },
      read_artifact: readFile,
      async inventory_paths() { return []; },
    });
    const frame = Buffer.from(`${canonicalJson({ command_body_base64: Buffer.from('{}').toString('base64'), signature_base64: Buffer.from('x').toString('base64') })}\n`);
    await loop.submit(frame);
    return { action, artifactPath, artifactBytes, settlements };
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
}

function validatorArtifact(overrides = {}) {
  return {
    schema_version: '1.0', change_id: validatorCourierIdentity.change_id,
    candidate_sha: validatorCourierIdentity.candidate_sha, validator_head: validatorCourierIdentity.validator_head,
    verdict: 'PASS', findings: [], risks: [], unverified: [], open_questions: [], ...overrides,
  };
}

function validatorFinding(overrides = {}) {
  return {
    finding_id: 'finding-001', classification: 'CONTRACT', requirement_ids: ['REQ-M2-004'], acceptance_ids: ['AC-M2-004-02'],
    paths: ['tools/harness/change-coordinator/host-loop.mjs'], summary: 'validator contract mismatch',
    evidence_refs: [{ kind: 'TEST', id: '006-L04', sha256: 'a'.repeat(64), subject_sha: validatorCourierIdentity.candidate_sha }], ...overrides,
  };
}

function validatorNote(overrides = {}) {
  return { note_id: 'note-001', summary: 'retained note', evidence_refs: [{ kind: 'TEST', id: '006-L04', sha256: 'b'.repeat(64), subject_sha: validatorCourierIdentity.candidate_sha }], ...overrides };
}

const testHostAgentBindingFields = Object.freeze([
  'correlation_id', 'role', 'agent', 'model', 'reasoning', 'sandbox', 'allowed_paths', 'phase', 'state_version',
  'brief_sha256', 'input_sha256', 'output_schema_sha256', 'subject_sha', 'idempotency_id',
]);
const testPinnedGitExecutable = '/Users/huangbo/Dev/Env/homebrew/bin/git';
const repairFixtureScopePreimage = Object.freeze({
  allowed_paths: Object.freeze(['agent-change.txt', 'production.mjs']),
  forbidden_paths: Object.freeze([]),
});
const repairFixtureScopeSha256 = sha256(canonicalJson(repairFixtureScopePreimage));

const testFixedAgentEnvironment = route => ({
  HOME: route.runtime_home,
  CODEX_HOME: route.codex_home,
  PATH: '/opt/homebrew/bin:/usr/bin:/bin:/usr/sbin:/sbin',
  LANG: 'C', LC_ALL: 'C', TZ: 'UTC',
});

const testExpectedAgentArguments = (action, route) => [
  'exec', '--ephemeral', '--ignore-user-config', '--approve-for-me',
  '--model', action.model,
  '--config', `model_reasoning_effort=${JSON.stringify(action.reasoning)}`,
  '--sandbox', action.sandbox,
  '--cd', route.worktree_root,
  '--output-schema', route.output_schema_path,
  '--output-last-message', route.output_artifact_path,
  '-',
];

function runObservedProcess(executable, args, options, stdinBytes = null) {
  return new Promise(resolve => {
    const child = spawn(executable, args, { ...options, stdio: ['pipe', 'pipe', 'pipe'] });
    const stdout = []; const stderr = []; const errors = [];
    child.stdout.on('data', chunk => stdout.push(Buffer.from(chunk)));
    child.stderr.on('data', chunk => stderr.push(Buffer.from(chunk)));
    child.once('error', error => errors.push({ name: error.name, code: error.code ?? null, message: error.message }));
    child.stdin.on('error', error => errors.push({ name: error.name, code: error.code ?? null, message: error.message }));
    child.once('close', (code, signal) => resolve({
      pid: child.pid, code, signal, errors,
      stdout: Buffer.concat(stdout), stderr: Buffer.concat(stderr),
    }));
    child.stdin.end(stdinBytes ?? undefined);
  });
}

async function readActualGitInventory(worktreeRoot) {
  const observed = await runObservedProcess(testPinnedGitExecutable, ['status', '--porcelain=v1', '-z'], {
    cwd: worktreeRoot,
    env: { PATH: '/usr/bin:/bin', LANG: 'C', LC_ALL: 'C', TZ: 'UTC' },
    shell: false,
    uid: process.getuid(), gid: process.getgid(),
  });
  assert.deepEqual({ code: observed.code, signal: observed.signal, errors: observed.errors }, { code: 0, signal: null, errors: [] });
  return observed.stdout.toString('utf8').split('\0').filter(Boolean).map(entry => entry.slice(3)).sort();
}

async function writeOfflineHostFixture(executablePath) {
  const source = `#!${process.execPath}
import { appendFile, mkdir, readFile, symlink, writeFile } from 'node:fs/promises';
import path from 'node:path';

const args = process.argv.slice(2);
const valueAfter = flag => {
  const index = args.indexOf(flag);
  if (index < 0 || index + 1 >= args.length) throw new Error('FIXTURE_ARG_MISSING_' + flag);
  return args[index + 1];
};
const chunks = [];
for await (const chunk of process.stdin) chunks.push(Buffer.from(chunk));
const stdin = Buffer.concat(chunks);
const separator = stdin.indexOf(Buffer.from('\\n\\n'));
if (separator < 0) throw new Error('FIXTURE_STDIN_FRAME_INVALID');
const brief = stdin.subarray(0, separator);
const input = stdin.subarray(separator + 2);
const repairMarker = Buffer.from('\\n\\n--- JUANERAI_REPAIR_TEST_EVIDENCE_V1 ');
const markerOffset = input.indexOf(repairMarker);
const baseInput = markerOffset < 0 ? input : input.subarray(0, markerOffset);
const plan = JSON.parse(baseInput.toString('utf8'));
const outputPath = valueAfter('--output-last-message');
const schemaPath = valueAfter('--output-schema');
const capture = {
  pid: process.pid,
  argv: args,
  cwd: process.cwd(),
  env: Object.fromEntries(['HOME', 'CODEX_HOME', 'PATH', 'LANG', 'LC_ALL', 'TZ'].map(key => [key, process.env[key]])),
  brief_base64: brief.toString('base64'),
  input_base64: input.toString('base64'),
  output_path: outputPath,
  schema_path: schemaPath,
  schema_base64: (await readFile(schemaPath)).toString('base64'),
};
if (plan.worktree_file) await writeFile(path.join(process.cwd(), plan.worktree_file), plan.worktree_bytes);
if (plan.behavior === 'symlink-output') {
  await writeFile(plan.outside_artifact_path, plan.artifact_bytes);
  await symlink(plan.outside_artifact_path, outputPath);
} else if (plan.behavior === 'directory-output') {
  await mkdir(outputPath);
} else if (plan.behavior !== 'missing-output') {
  await writeFile(outputPath, plan.artifact_bytes);
}
await writeFile(plan.capture_path, JSON.stringify(capture));
process.stdout.write('fixture-stdout:' + plan.behavior + '\\n');
process.stderr.write('fixture-stderr:' + plan.behavior + '\\n');
if (plan.behavior === 'hour-deadline') {
  let sigtermCount = 0;
  process.on('SIGTERM', async () => {
    sigtermCount += 1;
    await appendFile(plan.signal_path, JSON.stringify({ signal: 'SIGTERM', count: sigtermCount, monotonic_ns: process.hrtime.bigint().toString() }) + '\\n');
    setImmediate(() => process.exit(0));
  });
  setInterval(() => {}, 1000);
} else if (plan.behavior === 'signal') process.kill(process.pid, 'SIGTERM');
else process.exitCode = plan.behavior === 'nonzero' ? 17 : 0;
`;
  await writeFile(executablePath, source);
  await chmod(executablePath, 0o755);
  return Buffer.from(source);
}

async function createSharedLauncherScenario({
  role = 'juaner_test', behavior = 'success', artifact = null, artifact_mutator = null, artifact_bytes = null, preexistingOutput = 'absent', repair = false,
} = {}) {
  const temporaryAlias = await mkdtemp(path.join(os.tmpdir(), 'juanerai-m2-host-launcher-'));
  const temporary = await realpath(temporaryAlias);
  const worktreeRoot = path.join(temporary, 'worktree');
  const contentRoot = path.join(temporary, 'content');
  const resultRootCandidate = path.join(temporary, 'agent-results');
  const fixtureRoot = path.join(temporary, 'fixture');
  await mkdir(worktreeRoot); await mkdir(contentRoot); await mkdir(resultRootCandidate); await mkdir(fixtureRoot);
  const resultRoot = await realpath(resultRootCandidate);
  const fixtureExecutable = path.join(fixtureRoot, 'offline-agent.mjs');
  await writeOfflineHostFixture(fixtureExecutable);
  for (const args of [
    ['init', worktreeRoot],
    ['-C', worktreeRoot, 'config', 'user.email', 'test@example.invalid'],
    ['-C', worktreeRoot, 'config', 'user.name', 'JuanerAI Test'],
  ]) {
    const git = await runObservedProcess(testPinnedGitExecutable, args, {
      cwd: temporary, env: { PATH: '/usr/bin:/bin', LANG: 'C', LC_ALL: 'C', TZ: 'UTC' }, shell: false,
      uid: process.getuid(), gid: process.getgid(),
    });
    assert.deepEqual({ code: git.code, signal: git.signal, errors: git.errors }, { code: 0, signal: null, errors: [] });
  }
  await writeFile(path.join(worktreeRoot, 'tracked.txt'), 'base\n');
  for (const args of [['-C', worktreeRoot, 'add', 'tracked.txt'], ['-C', worktreeRoot, 'commit', '-m', 'base']]) {
    const git = await runObservedProcess(testPinnedGitExecutable, args, {
      cwd: temporary, env: { PATH: '/usr/bin:/bin', LANG: 'C', LC_ALL: 'C', TZ: 'UTC' }, shell: false,
      uid: process.getuid(), gid: process.getgid(),
    });
    assert.deepEqual({ code: git.code, signal: git.signal, errors: git.errors }, { code: 0, signal: null, errors: [] });
  }

  const correlationId = role === 'juaner_validator' ? 'corr-m2-host-validator-001' : repair ? 'corr-m2-host-repair-001' : 'corr-m2-host-ordinary-001';
  const capturePath = path.join(fixtureRoot, `${correlationId}-capture.json`);
  const signalPath = path.join(fixtureRoot, `${correlationId}-signals.jsonl`);
  const outsideArtifactPath = path.join(fixtureRoot, `${correlationId}-outside.json`);
  const changedTestBytes = Buffer.from(`changed by ${role}\n`);
  const candidate = await runObservedProcess(testPinnedGitExecutable, ['-C', worktreeRoot, 'rev-parse', 'HEAD', 'HEAD^{tree}'], {
    cwd: temporary, env: { PATH: '/usr/bin:/bin', LANG: 'C', LC_ALL: 'C', TZ: 'UTC' }, shell: false,
    uid: process.getuid(), gid: process.getgid(),
  });
  assert.deepEqual({ code: candidate.code, signal: candidate.signal, errors: candidate.errors }, { code: 0, signal: null, errors: [] });
  const [candidateSha, candidateTree] = candidate.stdout.toString('utf8').trim().split('\n');
  const branch = repair ? await runObservedProcess(testPinnedGitExecutable, ['-C', worktreeRoot, 'branch', '--show-current'], {
    cwd: temporary, env: { PATH: '/usr/bin:/bin', LANG: 'C', LC_ALL: 'C', TZ: 'UTC' }, shell: false,
    uid: process.getuid(), gid: process.getgid(),
  }) : null;
  if (branch !== null) assert.deepEqual({ code: branch.code, signal: branch.signal, errors: branch.errors }, { code: 0, signal: null, errors: [] });
  const repairSnapshotContext = repair ? Object.freeze({
    change_id: validatorCourierIdentity.change_id, authorization_cycle_command_id: 'command-repair-001',
    repository_root: worktreeRoot, worktree_root: worktreeRoot, branch: branch.stdout.toString('utf8').trim(),
    allowed_paths: Object.freeze([...repairFixtureScopePreimage.allowed_paths]), forbidden_paths: Object.freeze([...repairFixtureScopePreimage.forbidden_paths]),
    test_allowed_paths: Object.freeze(['agent-change.txt']), production_allowed_paths: Object.freeze(['production.mjs']),
  }) : null;
  const derivedEvidence = repair ? {
    schema_version: '1.0', kind: 'REPAIR_TEST_DERIVED_EVIDENCE', change_id: validatorCourierIdentity.change_id,
    candidate_sha: candidateSha, candidate_tree: candidateTree, authorization_cycle_command_id: 'command-repair-001',
    source_execution_attempt: 0, repair_execution_attempt: 1,
    scope_sha256: repairFixtureScopeSha256,
    validator_artifact_sha256: 'f'.repeat(64), validator_receipt_sha256: 'a'.repeat(64),
    validator_agent_result_event_ref: { remote_ref: 'refs/heads/evidence/agent-runs', tip: '1'.repeat(40), tip_tree: '2'.repeat(40), authoritative_path: `ledger/${validatorCourierIdentity.change_id}.jsonl`, event_id: 'validator-result-001', event_hash: '3'.repeat(64), sequence: 17, record_offset: 101, record_length: 102, record_bytes_sha256: '4'.repeat(64) },
    validator_receipt_event_ref: { remote_ref: 'refs/heads/evidence/agent-runs', tip: '1'.repeat(40), tip_tree: '2'.repeat(40), authoritative_path: `ledger/${validatorCourierIdentity.change_id}.jsonl`, event_id: 'validator-receipt-001', event_hash: '5'.repeat(64), sequence: 18, record_offset: 203, record_length: 103, record_bytes_sha256: '6'.repeat(64) },
    findings: [{ finding_id: 'finding-repair-001', classification: 'IMPLEMENTATION_IN_SCOPE', requirement_ids: ['REQ-M2-004'], acceptance_ids: ['AC-M2-004-03'], paths: ['agent-change.txt'], summary: 'repair the exact Test oracle', evidence_refs: [{ kind: 'TEST', id: '007-H01', sha256: '7'.repeat(64), subject_sha: candidateSha }] }],
  } : null;
  const derivedBytes = derivedEvidence === null ? null : Buffer.from(canonicalJson(derivedEvidence));
  const repairPlan = derivedBytes === null ? null : {
    schema_version: '1.0', kind: 'REPAIR_TEST_PLAN_V1', status: 'READY_FOR_MECHANICAL_PROOF', change_id: validatorCourierIdentity.change_id,
    candidate_sha: candidateSha, candidate_tree: candidateTree, authorization_cycle_command_id: derivedEvidence.authorization_cycle_command_id,
    repair_execution_attempt: 1, derived_input_sha256: sha256(derivedBytes),
    test_files: [{ path: 'agent-change.txt', byte_length: changedTestBytes.length, sha256: sha256(changedTestBytes) }],
    checks: [{ finding_id: 'finding-repair-001', requirement_ids: ['REQ-M2-004'], acceptance_ids: ['AC-M2-004-03'], test_path: 'agent-change.txt', test_file_sha256: sha256(changedTestBytes), red_test_id: 'RED-M2-007-H01', control_test_id: 'CONTROL-M2-007-C02' }],
  };
  const selectedArtifactBase = artifact ?? (repair ? repairPlan : { status: 'PASS' });
  const selectedArtifact = artifact_mutator === null ? selectedArtifactBase : artifact_mutator(structuredClone(selectedArtifactBase));
  const artifactBytes = artifact_bytes === null ? Buffer.from(canonicalJson(selectedArtifact)) : Buffer.from(artifact_bytes);
  const briefBytes = Buffer.from(`fixed brief for ${role}`);
  const outputSchemaBytes = Buffer.from(canonicalJson(role === 'juaner_validator'
    ? validatorArtifactOutputSchema
    : repair ? repairTestPlanOutputSchema
      : { type: 'object', additionalProperties: true, required: ['status'], properties: { status: { enum: ['PASS', 'FAIL'] } } }));
  const plan = {
    behavior,
    capture_path: capturePath,
    signal_path: signalPath,
    outside_artifact_path: outsideArtifactPath,
    worktree_file: 'agent-change.txt',
    worktree_bytes: changedTestBytes.toString('utf8'),
    artifact_bytes: artifactBytes.toString('utf8'),
  };
  const inputBytes = Buffer.from(canonicalJson(plan));
  const repairEvidence = derivedBytes === null ? null : Object.freeze({ schema_version: '1.0', kind: 'REPAIR_TEST_EVIDENCE', derived_input_sha256: sha256(derivedBytes), derived_input_byte_length: derivedBytes.length, derived_input_bytes_base64: derivedBytes.toString('base64') });
  const repairHeader = derivedBytes === null ? null : Buffer.from(`\n\n--- JUANERAI_REPAIR_TEST_EVIDENCE_V1 ${derivedBytes.length} ${sha256(derivedBytes)} ---\n`);
  const effectiveInputBytes = derivedBytes === null ? inputBytes : Buffer.concat([inputBytes, repairHeader, derivedBytes]);
  const action = Object.freeze({
    action_kind: 'LAUNCH_AGENT', correlation_id: correlationId, role, agent: role,
    model: role === 'juaner_validator' ? 'gpt-5.6-sol' : 'gpt-5.6-terra', reasoning: 'medium',
    sandbox: role === 'juaner_validator' ? 'read-only' : 'workspace-write',
    allowed_paths: ['agent-change.txt'], phase: role === 'juaner_validator' ? 'VALIDATOR' : 'TEST_RED', state_version: 9,
    brief_sha256: sha256(briefBytes), input_sha256: sha256(inputBytes), output_schema_sha256: sha256(outputSchemaBytes),
    subject_sha: repair ? candidateSha : validatorCourierIdentity.candidate_sha, idempotency_id: `${correlationId}-idempotency`,
    ...(repair ? { repair_evidence: repairEvidence } : {}),
  });
  const writeContentAddressed = async bytes => {
    const target = path.join(contentRoot, sha256(bytes));
    await writeFile(target, bytes);
    assert.equal(await realpath(target), target);
    return target;
  };
  const route = Object.freeze({
    ...Object.fromEntries(testHostAgentBindingFields.map(field => [field, structuredClone(action[field])])),
    ...(repair ? { repair_evidence: structuredClone(repairEvidence) } : {}),
    ...(repair ? { repair_snapshot_context: structuredClone(repairSnapshotContext) } : {}),
    codex_executable: fixtureExecutable,
    runtime_uid: process.getuid(), runtime_gid: process.getgid(),
    runtime_home: path.join(temporary, 'runtime-home'), codex_home: path.join(temporary, 'codex-home'),
    git_executable: testPinnedGitExecutable, worktree_root: worktreeRoot,
    brief_path: await writeContentAddressed(briefBytes),
    input_path: await writeContentAddressed(inputBytes),
    output_schema_path: await writeContentAddressed(outputSchemaBytes),
    output_artifact_path: path.join(resultRoot, `${correlationId}.json`),
  });
  if (preexistingOutput === 'regular') await writeFile(route.output_artifact_path, 'preexisting regular bytes');
  if (preexistingOutput === 'symlink') await symlink(outsideArtifactPath, route.output_artifact_path);
  if (preexistingOutput === 'directory') await mkdir(route.output_artifact_path);
  return {
    temporary, resultRoot, worktreeRoot, fixtureRoot, fixtureExecutable,
    capturePath, signalPath, outsideArtifactPath, briefBytes, inputBytes, effectiveInputBytes, outputSchemaBytes, artifactBytes, action, route,
    candidateSha, candidateTree, changedTestBytes, derivedEvidence, derivedBytes, repairEvidence, repairHeader, repairPlan, repairSnapshotContext,
    cleanup: () => rm(temporary, { recursive: true, force: true }),
  };
}

async function loadSharedLauncherOrSkip(t, leaf) {
  const host = await import(new URL(`file://${hostLoopPath}`).href);
  assert.equal(typeof host.createHostAgentLauncher, 'function', `PREREQUISITE_FAILURE: ${leaf} requires the 006-H01 shared Host launcher export`);
  assert.deepEqual(host.HOST_AGENT_BINDING_FIELDS, testHostAgentBindingFields, `${leaf} keeps the independently fixed binding-field set`);
  return host;
}

function hostSubmitFrame() {
  return Buffer.from(`${canonicalJson({ command_body_base64: Buffer.from('{}').toString('base64'), signature_base64: Buffer.from('x').toString('base64') })}\n`);
}

async function runActualLauncherThroughHostLoop(host, scenario, {
  prepareResultRoot = async () => undefined,
  route = scenario.route,
  beforeSecondArtifactRead = null,
  beforeSecondInventoryRead = null,
  observeSettlement = null,
} = {}) {
  const settlements = [];
  let artifactReads = 0; let inventoryReads = 0;
  let launchedChild = null; let completedObservation = null; let completedSettled = false; let completedValue = null;
  const launcher = host.createHostAgentLauncher({ resultRoot: scenario.resultRoot, prepareResultRoot });
  const coordinator = {
    async applyControllerCommand() {
      return { outcome: 'AGENT_ACTION', change_id: validatorCourierIdentity.change_id, state_version: 9, state_hash: 'state-9', payload: { action: scenario.action } };
    },
    async run() { throw new Error('UNREACHABLE'); },
    async settlement(request) {
      settlements.push(structuredClone(request.settlement));
      const terminal = ['RESULT', 'START_FAILED', 'INTERRUPTED'].includes(request.settlement.stage);
      if (observeSettlement) await observeSettlement({ request: structuredClone(request), terminal, launchedChild, completedSettled, completedValue });
      return { outcome: terminal ? 'WAITING' : 'ADVANCED', change_id: validatorCourierIdentity.change_id, state_version: 9 + settlements.length, state_hash: `state-${9 + settlements.length}` };
    },
    async status() { return { outcome: 'WAITING' }; },
  };
  const loop = host.createTrustedHostLoop({
    coordinator,
    async durable_route(action) { assert.deepEqual(action, scenario.action); return route; },
    async launch_agent(request) {
      launchedChild = await launcher(request);
      completedObservation = Promise.resolve(launchedChild.completed).then(value => {
        completedSettled = true; completedValue = structuredClone(value); return value;
      });
      return launchedChild;
    },
    async read_artifact(target) {
      artifactReads += 1;
      assert.equal(target, route.output_artifact_path);
      if (beforeSecondArtifactRead) await beforeSecondArtifactRead({ target, artifactReads });
      return readFile(target);
    },
    async inventory_paths(target) {
      inventoryReads += 1;
      assert.equal(target, route.worktree_root);
      if (beforeSecondInventoryRead) await beforeSecondInventoryRead({ target, inventoryReads });
      return readActualGitInventory(target);
    },
  });
  const result = await loop.submit(hostSubmitFrame());
  return {
    result, settlements, artifactReads, inventoryReads, launcher, launchedChild,
    completed: completedObservation === null ? null : await completedObservation.catch(error => ({ rejected: error })),
  };
}

test('RED-M2-005 / TEST-M2-006 / 006-H01 reachability: host-loop exports the one shared purpose-bound Agent launcher', async () => {
  const host = await import(new URL(`file://${hostLoopPath}`).href);
  assert.equal(typeof host.createHostAgentLauncher, 'function',
    'CAUSAL_RED: CCR003 requires the one createHostAgentLauncher construction entry; dependent 006-H02..H13 remain NOT_REACHED');
});

test('CONTROL-M2-005 / TEST-M2-006 / 006-C05: the offline fixture independently executes exact argv, stdin, cwd, fixed env, output, PID/close, and Git inventory', async () => {
  const scenario = await createSharedLauncherScenario();
  try {
    const observed = await runObservedProcess(scenario.fixtureExecutable, testExpectedAgentArguments(scenario.action, scenario.route), {
      cwd: scenario.route.worktree_root,
      env: testFixedAgentEnvironment(scenario.route),
      shell: false,
      uid: scenario.route.runtime_uid,
      gid: scenario.route.runtime_gid,
    }, Buffer.concat([scenario.briefBytes, Buffer.from('\n\n'), scenario.inputBytes]));
    assert.equal(Number.isSafeInteger(observed.pid) && observed.pid > 0, true, 'the independent control observes a real positive fixture PID');
    assert.deepEqual({ code: observed.code, signal: observed.signal, errors: observed.errors }, {
      code: 0, signal: null, errors: [],
    }, 'the actual fixture process reaches one clean close');
    assert.equal(observed.stdout.toString('utf8'), 'fixture-stdout:success\n');
    assert.equal(observed.stderr.toString('utf8'), 'fixture-stderr:success\n');
    const capture = JSON.parse(await readFile(scenario.capturePath, 'utf8'));
    assert.deepEqual(capture, {
      pid: observed.pid,
      argv: testExpectedAgentArguments(scenario.action, scenario.route),
      cwd: scenario.route.worktree_root,
      env: testFixedAgentEnvironment(scenario.route),
      brief_base64: scenario.briefBytes.toString('base64'),
      input_base64: scenario.inputBytes.toString('base64'),
      output_path: scenario.route.output_artifact_path,
      schema_path: scenario.route.output_schema_path,
      schema_base64: scenario.outputSchemaBytes.toString('base64'),
    });
    assert.deepEqual(await readFile(scenario.route.output_artifact_path), scenario.artifactBytes);
    assert.deepEqual(await readActualGitInventory(scenario.worktreeRoot), ['agent-change.txt']);
    assert.throws(() => process.kill(observed.pid, 0), error => error?.code === 'ESRCH', 'the independently observed positive PID is closed');
  } finally { await scenario.cleanup(); }
});

test('CONTROL-M2-005 / TEST-M2-006 / 006-C06: the same offline fixture exposes real signal close and an actual spawn-error close without monkeypatching process APIs', async () => {
  const scenario = await createSharedLauncherScenario({ behavior: 'signal' });
  try {
    const signalled = await runObservedProcess(scenario.fixtureExecutable, testExpectedAgentArguments(scenario.action, scenario.route), {
      cwd: scenario.route.worktree_root,
      env: testFixedAgentEnvironment(scenario.route),
      shell: false,
      uid: scenario.route.runtime_uid,
      gid: scenario.route.runtime_gid,
    }, Buffer.concat([scenario.briefBytes, Buffer.from('\n\n'), scenario.inputBytes]));
    assert.equal(Number.isSafeInteger(signalled.pid) && signalled.pid > 0, true);
    assert.deepEqual({ code: signalled.code, signal: signalled.signal, errors: signalled.errors }, { code: null, signal: 'SIGTERM', errors: [] });
    assert.throws(() => process.kill(signalled.pid, 0), error => error?.code === 'ESRCH');
    const missingExecutable = await runObservedProcess(path.join(scenario.fixtureRoot, 'absent-executable'), [], {
      cwd: scenario.worktreeRoot, env: testFixedAgentEnvironment(scenario.route), shell: false,
      uid: scenario.route.runtime_uid, gid: scenario.route.runtime_gid,
    });
    assert.equal(missingExecutable.errors.some(error => error.code === 'ENOENT'), true, 'a real child error event is observed');
    assert.equal(missingExecutable.code, -2);
    assert.equal(missingExecutable.signal, null);
  } finally { await scenario.cleanup(); }
});

test('RED-M2-005 / TEST-M2-006 / 006-H02 suffix: construction and call shapes, root, correlation, output containment, and frozen launcher are closed', async t => {
  const host = await loadSharedLauncherOrSkip(t, '006-H02'); if (!host) return;
  const scenario = await createSharedLauncherScenario();
  try {
    const prepare = async () => undefined;
    for (const invalid of [
      null, {}, { resultRoot: scenario.resultRoot }, { resultRoot: scenario.resultRoot, prepareResultRoot: null },
      { resultRoot: scenario.resultRoot, prepareResultRoot: prepare, extra: true },
      { resultRoot: '/', prepareResultRoot: prepare }, { resultRoot: 'relative', prepareResultRoot: prepare },
      { resultRoot: `${scenario.resultRoot}/`, prepareResultRoot: prepare },
      { resultRoot: `${scenario.resultRoot}\0bad`, prepareResultRoot: prepare },
      { resultRoot: `${scenario.resultRoot}\nbad`, prepareResultRoot: prepare },
      { resultRoot: `${scenario.resultRoot}\ud800`, prepareResultRoot: prepare },
    ]) assert.throws(() => host.createHostAgentLauncher(invalid), /INPUT_INVALID/);
    const launcher = host.createHostAgentLauncher({ resultRoot: scenario.resultRoot, prepareResultRoot: prepare });
    assert.equal(Object.isFrozen(launcher), true);
    await assert.rejects(() => launcher({ action: scenario.action, route: scenario.route, extra: true }));
    for (const correlation_id of ['', '.', '..', '../escape', 'nested/path', 'back\\slash', 'nul\0segment', 'line\nbreak', '\ud800']) {
      const badAction = { ...scenario.action, correlation_id };
      const badRoute = {
        ...scenario.route,
        ...Object.fromEntries(testHostAgentBindingFields.map(field => [field, structuredClone(badAction[field])])),
        output_artifact_path: path.join(scenario.resultRoot, `${correlation_id}.json`),
      };
      const observed = await runActualLauncherThroughHostLoop(host, { ...scenario, action: badAction, route: badRoute }, { route: badRoute });
      assert.deepEqual(observed.settlements.map(value => value.stage), ['START_FAILED'], JSON.stringify(correlation_id));
      assert.equal(observed.settlements[0].failure_code, 'SPAWN_REJECTED');
      assert.equal(Object.hasOwn(observed.settlements[0], 'observed_child_id'), false);
    }
    const escapedRoute = { ...scenario.route, output_artifact_path: path.join(scenario.fixtureRoot, 'escape.json') };
    const escaped = await runActualLauncherThroughHostLoop(host, scenario, { route: escapedRoute });
    assert.deepEqual(escaped.settlements.map(value => value.stage), ['START_FAILED']);
    assert.equal(escaped.settlements[0].failure_code, 'SPAWN_REJECTED');
    assert.equal((await readActualGitInventory(scenario.worktreeRoot)).length, 0, 'all closed-shape/path rejection is pre-child');
  } finally { await scenario.cleanup(); }
});

test('TEST-M2-012 / 012-L06: real shared Host deadline sends exactly one SIGTERM after at least one hour and settles only after close', async t => {
  const host = await loadSharedLauncherOrSkip(t, '012-L06'); if (!host) return;
  const scenario = await createSharedLauncherScenario({ behavior: 'hour-deadline' });
  const startedNs = process.hrtime.bigint(); let terminalObservations = 0;
  try {
    const observed = await runActualLauncherThroughHostLoop(host, scenario, {
      observeSettlement: async ({ request, terminal, launchedChild, completedSettled, completedValue }) => {
        if (!terminal) return;
        terminalObservations += 1;
        assert.equal(request.settlement.stage, 'INTERRUPTED', 'a deadline remains an interruption even when its SIGTERM handler exits zero with a valid artifact');
        assert.equal(request.settlement.reason_code, 'AGENT_EXITED');
        assert.equal(completedSettled, true, 'terminal settlement is emitted only after the child completion promise resolves on closed streams');
        assert.deepEqual(completedValue, { interrupted: true, reason_code: 'AGENT_EXITED' });
        const pid = Number(launchedChild?.observed_child_id);
        assert.equal(Number.isSafeInteger(pid) && pid > 0, true, 'the actual launched child has a positive PID');
        assert.throws(() => process.kill(pid, 0), error => error?.code === 'ESRCH', 'the terminal settlement boundary already observes the child PID absent');
        const records = (await readFile(scenario.signalPath, 'utf8')).trim().split('\n').filter(Boolean).map(line => JSON.parse(line));
        assert.deepEqual(records.map(record => [record.signal, record.count]), [['SIGTERM', 1]], 'the fixture received exactly one real SIGTERM');
        const elapsedNs = BigInt(records[0].monotonic_ns) - startedNs;
        assert.ok(elapsedNs >= 3_600_000_000_000n, `the real monotonic deadline is at least one hour, observed ${elapsedNs}ns`);
      },
    });
    assert.equal(terminalObservations, 1, 'one and only one terminal settlement crosses the close/PID oracle');
    assert.deepEqual(observed.settlements.map(settlement => settlement.stage), ['STARTED', 'INTERRUPTED']);
    assert.equal(observed.settlements.some(settlement => settlement.stage === 'RESULT'), false, 'handler exit zero and valid artifact cannot turn a timeout into RESULT');
  } finally { await scenario.cleanup(); }
});

test('RED-M2-005 / TEST-M2-006 / 006-H03 suffix: artifact input and schema hashes reject before prepare, child, STARTED, or later effects', async t => {
  const host = await loadSharedLauncherOrSkip(t, '006-H03'); if (!host) return;
  for (const field of ['brief_path', 'input_path', 'output_schema_path']) {
    const scenario = await createSharedLauncherScenario();
    try {
      await writeFile(scenario.route[field], `damaged ${field}`);
      let prepareCalls = 0;
      const observed = await runActualLauncherThroughHostLoop(host, scenario, { prepareResultRoot: async () => { prepareCalls += 1; } });
      assert.deepEqual(observed.settlements.map(value => value.stage), ['START_FAILED'], `${field} fails at the pre-STARTED frontier`);
      assert.equal(observed.settlements[0].failure_code, 'SPAWN_REJECTED');
      assert.equal(prepareCalls, 0, 'content-addressed input checks precede preparation');
      await assert.rejects(() => readFile(scenario.capturePath), error => error?.code === 'ENOENT');
      assert.deepEqual(await readActualGitInventory(scenario.worktreeRoot), []);
      assert.equal(observed.artifactReads, 0); assert.equal(observed.inventoryReads, 0);
    } finally { await scenario.cleanup(); }
  }
});

test('RED-M2-005 / TEST-M2-006 / 006-H04 suffix: prepare receives one frozen root-only value after input reads; undefined continues, throw/value stop before STARTED', async t => {
  const host = await loadSharedLauncherOrSkip(t, '006-H04'); if (!host) return;
  const healthy = await createSharedLauncherScenario();
  try {
    let prepareCalls = 0;
    const observed = await runActualLauncherThroughHostLoop(host, healthy, { prepareResultRoot: async value => {
      prepareCalls += 1;
      assert.deepEqual(value, { resultRoot: healthy.resultRoot });
      assert.equal(Object.isFrozen(value), true);
      assert.equal(sha256(await readFile(healthy.route.brief_path)), healthy.action.brief_sha256);
      assert.equal(sha256(await readFile(healthy.route.input_path)), healthy.action.input_sha256);
      assert.equal(sha256(await readFile(healthy.route.output_schema_path)), healthy.action.output_schema_sha256);
      return undefined;
    } });
    assert.equal(prepareCalls, 1); assert.deepEqual(observed.settlements.map(value => value.stage), ['STARTED', 'RESULT']);
  } finally { await healthy.cleanup(); }
  for (const [label, prepareResultRoot] of [
    ['throw', async () => { throw new Error('PREPARE_FAILED'); }],
    ['non-undefined', async () => ({ forbidden: true })],
  ]) {
    const scenario = await createSharedLauncherScenario();
    try {
      const observed = await runActualLauncherThroughHostLoop(host, scenario, { prepareResultRoot });
      assert.deepEqual(observed.settlements.map(value => value.stage), ['START_FAILED'], label);
      assert.equal(observed.settlements[0].failure_code, 'SPAWN_REJECTED');
      await assert.rejects(() => readFile(scenario.capturePath), error => error?.code === 'ENOENT');
      assert.deepEqual(await readActualGitInventory(scenario.worktreeRoot), []);
    } finally { await scenario.cleanup(); }
  }
  const replacedRoot = await createSharedLauncherScenario();
  try {
    const movedRoot = `${replacedRoot.resultRoot}-moved`;
    const observed = await runActualLauncherThroughHostLoop(host, replacedRoot, { prepareResultRoot: async () => {
      await rename(replacedRoot.resultRoot, movedRoot);
      await symlink(movedRoot, replacedRoot.resultRoot);
    } });
    assert.deepEqual(observed.settlements.map(value => value.stage), ['START_FAILED']);
    assert.equal(observed.settlements[0].failure_code, 'SPAWN_REJECTED');
    await assert.rejects(() => readFile(replacedRoot.capturePath), error => error?.code === 'ENOENT');
  } finally { await replacedRoot.cleanup(); }
  const escapedOutput = await createSharedLauncherScenario();
  try {
    const observed = await runActualLauncherThroughHostLoop(host, escapedOutput, { prepareResultRoot: async () => {
      await writeFile(escapedOutput.outsideArtifactPath, 'outside');
      await symlink(escapedOutput.outsideArtifactPath, escapedOutput.route.output_artifact_path);
    } });
    assert.deepEqual(observed.settlements.map(value => value.stage), ['START_FAILED']);
    assert.equal(observed.settlements[0].failure_code, 'SPAWN_REJECTED');
    await assert.rejects(() => readFile(escapedOutput.capturePath), error => error?.code === 'ENOENT');
  } finally { await escapedOutput.cleanup(); }
});

test('RED-M2-005 / TEST-M2-006 / 006-H05 suffix: absent and existing regular exact output entries under the physical result root both execute the real child', async t => {
  const host = await loadSharedLauncherOrSkip(t, '006-H05'); if (!host) return;
  for (const preexistingOutput of ['absent', 'regular']) {
    const scenario = await createSharedLauncherScenario({ preexistingOutput });
    try {
      const observed = await runActualLauncherThroughHostLoop(host, scenario);
      assert.deepEqual(observed.settlements.map(value => value.stage), ['STARTED', 'RESULT'], preexistingOutput);
      const stat = await lstat(scenario.route.output_artifact_path);
      assert.equal(stat.isFile(), true); assert.equal(stat.isSymbolicLink(), false);
      assert.equal(await realpath(scenario.route.output_artifact_path), scenario.route.output_artifact_path);
      assert.equal(path.dirname(await realpath(scenario.route.output_artifact_path)), scenario.resultRoot);
    } finally { await scenario.cleanup(); }
  }
});

test('RED-M2-005 / TEST-M2-006 / 006-H06 suffix: preexisting symlink/non-regular output entries reject before child and STARTED with no successor effects', async t => {
  const host = await loadSharedLauncherOrSkip(t, '006-H06'); if (!host) return;
  for (const preexistingOutput of ['symlink', 'directory']) {
    const scenario = await createSharedLauncherScenario({ preexistingOutput });
    try {
      const observed = await runActualLauncherThroughHostLoop(host, scenario);
      assert.deepEqual(observed.settlements.map(value => value.stage), ['START_FAILED'], preexistingOutput);
      assert.equal(observed.settlements[0].failure_code, 'SPAWN_REJECTED');
      await assert.rejects(() => readFile(scenario.capturePath), error => error?.code === 'ENOENT');
      assert.deepEqual(await readActualGitInventory(scenario.worktreeRoot), []);
      assert.equal(observed.artifactReads, 0); assert.equal(observed.inventoryReads, 0);
    } finally { await scenario.cleanup(); }
  }
});

test('RED-M2-005 / TEST-M2-006 / 006-H07 suffix: the ordinary real child preserves exact input/process/output and maps parsed.status plus nonzero close', async t => {
  const host = await loadSharedLauncherOrSkip(t, '006-H07'); if (!host) return;
  for (const candidate of [
    { label: 'ordinary PASS', artifact: { status: 'PASS', detail: 'retained' }, behavior: 'success', expected: 'PASS' },
    { label: 'ordinary artifact FAIL', artifact: { status: 'FAIL', detail: 'retained' }, behavior: 'success', expected: 'FAIL' },
    { label: 'ordinary nonzero close', artifact: { status: 'PASS', detail: 'retained' }, behavior: 'nonzero', expected: 'FAIL' },
  ]) {
    const scenario = await createSharedLauncherScenario(candidate);
    let terminalCloseObserved = false;
    try {
      const observed = await runActualLauncherThroughHostLoop(host, scenario, {
        observeSettlement: async ({ request, terminal, launchedChild, completedSettled, completedValue }) => {
          if (!terminal) return;
          assert.equal(request.settlement.stage, 'RESULT');
          assert.equal(completedSettled, true, 'RESULT settlement is not called until the actual child close resolves its captured streams');
          assert.equal(completedValue.stdout_sha256, sha256(`fixture-stdout:${candidate.behavior}\n`));
          assert.equal(completedValue.stderr_sha256, sha256(`fixture-stderr:${candidate.behavior}\n`));
          const pid = Number(launchedChild.observed_child_id); assert.throws(() => process.kill(pid, 0), error => error?.code === 'ESRCH', 'the terminal settlement boundary already sees the real child PID absent');
          terminalCloseObserved = true;
        },
      });
      assert.deepEqual(observed.settlements.map(value => value.stage), ['STARTED', 'RESULT'], candidate.label);
      const capture = JSON.parse(await readFile(scenario.capturePath, 'utf8'));
      assert.equal(Number.isSafeInteger(capture.pid) && capture.pid > 0, true);
      assert.equal(observed.settlements[0].observed_child_id, String(capture.pid));
      assert.deepEqual(capture.argv, testExpectedAgentArguments(scenario.action, scenario.route));
      assert.equal(capture.cwd, scenario.route.worktree_root);
      assert.equal(capture.schema_path, scenario.route.output_schema_path);
      assert.equal(capture.schema_base64, scenario.outputSchemaBytes.toString('base64'));
      assert.equal(capture.brief_base64, scenario.briefBytes.toString('base64'));
      assert.equal(capture.input_base64, scenario.inputBytes.toString('base64'));
      assert.deepEqual(capture.env, testFixedAgentEnvironment(scenario.route));
      assert.equal(observed.completed.status, candidate.expected);
      assert.equal(observed.completed.artifact_sha256, sha256(scenario.artifactBytes));
      assert.equal(observed.completed.stdout_sha256, sha256(`fixture-stdout:${candidate.behavior}\n`));
      assert.equal(observed.completed.stderr_sha256, sha256(`fixture-stderr:${candidate.behavior}\n`));
      assert.equal(observed.settlements[1].status, candidate.expected);
      assert.equal(observed.settlements[1].artifact_sha256, sha256(scenario.artifactBytes));
      assert.deepEqual(await readFile(observed.settlements[1].artifact_path), scenario.artifactBytes);
      assert.throws(() => process.kill(capture.pid, 0), error => error?.code === 'ESRCH');
      assert.equal(terminalCloseObserved, true);
    } finally { await scenario.cleanup(); }
  }
});

test('RED-M2-005 / TEST-M2-006 / 006-H08 suffix: actual spawn error is pre-STARTED while actual signal close is post-STARTED AGENT_EXITED', async t => {
  const host = await loadSharedLauncherOrSkip(t, '006-H08'); if (!host) return;
  const spawnError = await createSharedLauncherScenario();
  try {
    const observed = await runActualLauncherThroughHostLoop(host, spawnError, { route: { ...spawnError.route, codex_executable: path.join(spawnError.fixtureRoot, 'absent-executable') } });
    assert.deepEqual(observed.settlements.map(value => value.stage), ['START_FAILED']);
    assert.equal(observed.settlements[0].failure_code, 'SPAWN_REJECTED');
    assert.equal(Object.hasOwn(observed.settlements[0], 'observed_child_id'), false);
    await assert.rejects(() => readFile(spawnError.capturePath), error => error?.code === 'ENOENT');
  } finally { await spawnError.cleanup(); }
  const signal = await createSharedLauncherScenario({ behavior: 'signal' });
  try {
    const observed = await runActualLauncherThroughHostLoop(host, signal);
    assert.deepEqual(observed.settlements.map(value => value.stage), ['STARTED', 'INTERRUPTED']);
    assert.equal(observed.settlements[1].reason_code, 'AGENT_EXITED');
    assert.equal(observed.settlements[1].observed_child_id, observed.settlements[0].observed_child_id);
    const capture = JSON.parse(await readFile(signal.capturePath, 'utf8'));
    assert.equal(observed.settlements[0].observed_child_id, String(capture.pid));
    assert.throws(() => process.kill(capture.pid, 0), error => error?.code === 'ESRCH');
    assert.equal(observed.settlements.some(value => value.stage === 'RESULT'), false);
  } finally { await signal.cleanup(); }
});

test('RED-M2-005 / TEST-M2-006 / 006-H09 suffix: post-close missing, symlink, and non-regular artifacts are RESULT_UNREADABLE after STARTED and before parse/readback', async t => {
  const host = await loadSharedLauncherOrSkip(t, '006-H09'); if (!host) return;
  for (const behavior of ['missing-output', 'symlink-output', 'directory-output']) {
    const scenario = await createSharedLauncherScenario({ behavior });
    try {
      const observed = await runActualLauncherThroughHostLoop(host, scenario);
      assert.deepEqual(observed.settlements.map(value => value.stage), ['STARTED', 'INTERRUPTED'], behavior);
      assert.equal(observed.settlements[1].reason_code, 'RESULT_UNREADABLE');
      const capture = JSON.parse(await readFile(scenario.capturePath, 'utf8'));
      assert.equal(observed.settlements[0].observed_child_id, String(capture.pid));
      assert.equal(observed.artifactReads, 0); assert.equal(observed.inventoryReads, 0);
      assert.equal(observed.settlements.some(value => value.stage === 'RESULT'), false);
    } finally { await scenario.cleanup(); }
  }
});

test('RED-M2-005 / TEST-M2-006 / 006-H10 suffix: Validator real children use parsed.verdict and forward the complete canonical artifact including notes unchanged', async t => {
  const host = await loadSharedLauncherOrSkip(t, '006-H10'); if (!host) return;
  for (const artifact of [
    validatorArtifact(),
    validatorArtifact({ verdict: 'FAIL', findings: [validatorFinding()], risks: [validatorNote({ note_id: 'risk-001' })], unverified: [validatorNote({ note_id: 'unverified-001' })], open_questions: [validatorNote({ note_id: 'question-001' })] }),
  ]) {
    const scenario = await createSharedLauncherScenario({ role: 'juaner_validator', artifact });
    try {
      const observed = await runActualLauncherThroughHostLoop(host, scenario);
      assert.deepEqual(observed.settlements.map(value => value.stage), ['STARTED', 'RESULT']);
      assert.deepEqual(observed.settlements[1], {
        ...Object.fromEntries(testHostAgentBindingFields.map(field => [field, scenario.action[field]])),
        stage: 'RESULT', observed_child_id: observed.settlements[0].observed_child_id,
        status: artifact.verdict, artifact_path: scenario.route.output_artifact_path,
        artifact_sha256: sha256(scenario.artifactBytes), validator_artifact: artifact,
      });
      assert.equal(observed.completed.status, artifact.verdict);
      assert.equal(observed.completed.stdout_sha256, sha256('fixture-stdout:success\n'));
      assert.equal(observed.completed.stderr_sha256, sha256('fixture-stderr:success\n'));
      assert.equal(observed.settlements[1].artifact_sha256, sha256(scenario.artifactBytes));
      assert.deepEqual(Object.keys(observed.settlements[1]).sort(), [...testHostAgentBindingFields, 'artifact_path', 'artifact_sha256', 'observed_child_id', 'stage', 'status', 'validator_artifact'].sort());
    } finally { await scenario.cleanup(); }
  }
});

test('RED-M2-005 / TEST-M2-006 / 006-H11 suffix: actual Validator output rejects noncanonical, shape, identity, verdict/finding, and note-array faults after STARTED', async t => {
  const host = await loadSharedLauncherOrSkip(t, '006-H11'); if (!host) return;
  const malformed = [
    ['noncanonical bytes', validatorArtifact(), Buffer.from(JSON.stringify({ verdict: 'PASS', schema_version: '1.0', change_id: validatorCourierIdentity.change_id, candidate_sha: validatorCourierIdentity.candidate_sha, validator_head: validatorCourierIdentity.validator_head, findings: [], risks: [], unverified: [], open_questions: [] }))],
    ['extra field', validatorArtifact({ extra: true })],
    ['wrong change', validatorArtifact({ change_id: 'CHG-wrong' })],
    ['wrong Candidate', validatorArtifact({ candidate_sha: '5'.repeat(40) })],
    ['wrong Validator Head', validatorArtifact({ validator_head: '6'.repeat(40) })],
    ['PASS with findings', validatorArtifact({ findings: [validatorFinding()] })],
    ['FAIL without findings', validatorArtifact({ verdict: 'FAIL' })],
    ['invalid classification', validatorArtifact({ verdict: 'FAIL', findings: [validatorFinding({ classification: 'BAD' })] })],
    ['missing finding field', validatorArtifact({ verdict: 'FAIL', findings: [(() => { const value = validatorFinding(); delete value.summary; return value; })()] })],
    ['extra finding field', validatorArtifact({ verdict: 'FAIL', findings: [validatorFinding({ extra: true })] })],
    ['findings not array', validatorArtifact({ verdict: 'FAIL', findings: validatorFinding() })],
    ['duplicate findings', validatorArtifact({ verdict: 'FAIL', findings: [validatorFinding(), validatorFinding()] })],
    ['unsorted findings', validatorArtifact({ verdict: 'FAIL', findings: [validatorFinding({ finding_id: 'finding-02' }), validatorFinding({ finding_id: 'finding-01' })] })],
    ['duplicate requirement ids', validatorArtifact({ verdict: 'FAIL', findings: [validatorFinding({ requirement_ids: ['REQ-M2-004', 'REQ-M2-004'] })] })],
    ['missing requirement binding', validatorArtifact({ verdict: 'FAIL', findings: [validatorFinding({ classification: 'IMPLEMENTATION_IN_SCOPE', requirement_ids: [] })] })],
    ['missing acceptance binding', validatorArtifact({ verdict: 'FAIL', findings: [validatorFinding({ classification: 'IMPLEMENTATION_IN_SCOPE', acceptance_ids: [] })] })],
    ['missing path binding', validatorArtifact({ verdict: 'FAIL', findings: [validatorFinding({ classification: 'IMPLEMENTATION_IN_SCOPE', paths: [] })] })],
    ['missing evidence binding', validatorArtifact({ verdict: 'FAIL', findings: [validatorFinding({ classification: 'IMPLEMENTATION_IN_SCOPE', evidence_refs: [] })] })],
    ['non-array notes', validatorArtifact({ risks: validatorNote() })],
    ['duplicate note ids', validatorArtifact({ risks: [validatorNote(), validatorNote()] })],
    ['unsorted note ids', validatorArtifact({ risks: [validatorNote({ note_id: 'risk-02' }), validatorNote({ note_id: 'risk-01' })] })],
    ['null notes', validatorArtifact({ unverified: null })],
    ['missing notes', (() => { const value = validatorArtifact(); delete value.open_questions; return value; })()],
  ];
  for (const [label, artifact, artifactBytes = null] of malformed) {
    const scenario = await createSharedLauncherScenario({ role: 'juaner_validator', artifact, artifact_bytes: artifactBytes });
    try {
      const observed = await runActualLauncherThroughHostLoop(host, scenario);
      assert.deepEqual(observed.settlements.map(value => value.stage), ['STARTED', 'INTERRUPTED'], label);
      assert.equal(observed.settlements[1].reason_code, 'RESULT_UNREADABLE');
      assert.equal(observed.settlements.some(value => value.stage === 'RESULT'), false);
    } finally { await scenario.cleanup(); }
  }
});

test('RED-M2-005 / TEST-M2-006 / 006-H12 suffix: Host Loop performs the second real artifact/Git reads and blocks replacement or inventory drift before RESULT', async t => {
  const host = await loadSharedLauncherOrSkip(t, '006-H12'); if (!host) return;
  const healthy = await createSharedLauncherScenario();
  try {
    const observed = await runActualLauncherThroughHostLoop(host, healthy);
    assert.deepEqual(observed.settlements.map(value => value.stage), ['STARTED', 'RESULT']);
    assert.equal(observed.artifactReads, 1); assert.equal(observed.inventoryReads, 1);
    assert.deepEqual(await readActualGitInventory(healthy.worktreeRoot), ['agent-change.txt']);
  } finally { await healthy.cleanup(); }
  const replaced = await createSharedLauncherScenario();
  try {
    const observed = await runActualLauncherThroughHostLoop(host, replaced, { beforeSecondArtifactRead: async ({ target }) => writeFile(target, '{"status":"FAIL"}') });
    assert.deepEqual(observed.settlements.map(value => value.stage), ['STARTED', 'INTERRUPTED']);
    assert.equal(observed.settlements[1].reason_code, 'RESULT_UNREADABLE');
    assert.equal(observed.settlements.some(value => value.stage === 'RESULT'), false);
  } finally { await replaced.cleanup(); }
  const drifted = await createSharedLauncherScenario();
  try {
    const observed = await runActualLauncherThroughHostLoop(host, drifted, { beforeSecondInventoryRead: async ({ target }) => writeFile(path.join(target, 'late-change.txt'), 'late\n') });
    assert.deepEqual(observed.settlements.map(value => value.stage), ['STARTED', 'INTERRUPTED']);
    assert.equal(observed.settlements[1].reason_code, 'RESULT_UNREADABLE');
    assert.deepEqual(await readActualGitInventory(drifted.worktreeRoot), ['agent-change.txt', 'late-change.txt']);
    assert.equal(observed.settlements.some(value => value.stage === 'RESULT'), false);
  } finally { await drifted.cleanup(); }
});

test('RED-M2-005 / TEST-M2-006 / 006-H13 suffix: START_FAILED and post-STARTED RESULT_UNREADABLE keep distinct settlement shapes and zero later effects', async t => {
  const host = await loadSharedLauncherOrSkip(t, '006-H13'); if (!host) return;
  const preStarted = await createSharedLauncherScenario();
  try {
    const observed = await runActualLauncherThroughHostLoop(host, preStarted, { prepareResultRoot: async () => { throw new Error('PREPARE_FAILED'); } });
    assert.deepEqual(Object.keys(observed.settlements[0]).sort(), [...testHostAgentBindingFields, 'failure_code', 'stage'].sort());
    assert.equal(Object.hasOwn(observed.settlements[0], 'observed_child_id'), false);
    assert.equal(observed.settlements.some(value => ['STARTED', 'RESULT', 'INTERRUPTED'].includes(value.stage)), false);
  } finally { await preStarted.cleanup(); }
  const postStarted = await createSharedLauncherScenario({ behavior: 'missing-output' });
  try {
    const observed = await runActualLauncherThroughHostLoop(host, postStarted);
    assert.deepEqual(observed.settlements.map(value => value.stage), ['STARTED', 'INTERRUPTED']);
    assert.deepEqual(Object.keys(observed.settlements[1]).sort(), [...testHostAgentBindingFields, 'observed_child_id', 'reason_code', 'stage'].sort());
    assert.equal(observed.settlements[1].observed_child_id, observed.settlements[0].observed_child_id);
    assert.equal(observed.settlements.some(value => value.stage === 'RESULT'), false);
  } finally { await postStarted.cleanup(); }
});

function assertRepairPlanFixture(scenario, plan) {
  assert.deepEqual(Object.keys(plan).sort(), ['authorization_cycle_command_id', 'candidate_sha', 'candidate_tree', 'change_id', 'checks', 'derived_input_sha256', 'kind', 'repair_execution_attempt', 'schema_version', 'status', 'test_files'].sort());
  assert.deepEqual({ schema_version: plan.schema_version, kind: plan.kind, status: plan.status, repair_execution_attempt: plan.repair_execution_attempt }, { schema_version: '1.0', kind: 'REPAIR_TEST_PLAN_V1', status: 'READY_FOR_MECHANICAL_PROOF', repair_execution_attempt: 1 });
  assert.equal(plan.change_id, scenario.derivedEvidence.change_id); assert.equal(plan.candidate_sha, scenario.candidateSha); assert.equal(plan.candidate_tree, scenario.candidateTree);
  assert.equal(plan.authorization_cycle_command_id, scenario.derivedEvidence.authorization_cycle_command_id); assert.equal(plan.derived_input_sha256, sha256(scenario.derivedBytes));
  assert.deepEqual(scenario.route.repair_snapshot_context, structuredClone(scenario.repairSnapshotContext));
  assert.deepEqual({ allowed_paths: scenario.repairSnapshotContext.allowed_paths, forbidden_paths: scenario.repairSnapshotContext.forbidden_paths }, repairFixtureScopePreimage);
  assert.equal(scenario.derivedEvidence.scope_sha256, repairFixtureScopeSha256);
  assert.deepEqual(plan.test_files, [{ path: 'agent-change.txt', byte_length: scenario.changedTestBytes.length, sha256: sha256(scenario.changedTestBytes) }]);
  assert.deepEqual(plan.checks, [{ finding_id: 'finding-repair-001', requirement_ids: ['REQ-M2-004'], acceptance_ids: ['AC-M2-004-03'], test_path: 'agent-change.txt', test_file_sha256: sha256(scenario.changedTestBytes), red_test_id: 'RED-M2-007-H01', control_test_id: 'CONTROL-M2-007-C02' }]);
  assert.deepEqual(plan.checks.map(check => check.finding_id), scenario.derivedEvidence.findings.map(finding => finding.finding_id));
}

test('CONTROL-M2-005 / TEST-M2-007 / 007-C02 / 007-L06,L07,L16,L19: the real offline fixture independently preserves B, H, D, schema, plan bytes, Git inventory, PID, output streams, and close', async () => {
  const scenario = await createSharedLauncherScenario({ repair: true });
  try {
    const stdin = Buffer.concat([scenario.briefBytes, Buffer.from('\n\n'), scenario.effectiveInputBytes]);
    const observed = await runObservedProcess(scenario.fixtureExecutable, testExpectedAgentArguments(scenario.action, scenario.route), {
      cwd: scenario.route.worktree_root, env: testFixedAgentEnvironment(scenario.route), shell: false,
      uid: scenario.route.runtime_uid, gid: scenario.route.runtime_gid,
    }, stdin);
    assert.equal(Number.isSafeInteger(observed.pid) && observed.pid > 0, true);
    assert.deepEqual({ code: observed.code, signal: observed.signal, errors: observed.errors }, { code: 0, signal: null, errors: [] });
    assert.equal(observed.stdout.toString('utf8'), 'fixture-stdout:success\n'); assert.equal(observed.stderr.toString('utf8'), 'fixture-stderr:success\n');
    const capture = JSON.parse(await readFile(scenario.capturePath, 'utf8'));
    assert.equal(capture.cwd, scenario.route.worktree_root); assert.deepEqual(capture.argv, testExpectedAgentArguments(scenario.action, scenario.route));
    assert.deepEqual(capture.env, testFixedAgentEnvironment(scenario.route)); assert.equal(capture.brief_base64, scenario.briefBytes.toString('base64'));
    assert.equal(capture.input_base64, scenario.effectiveInputBytes.toString('base64')); assert.equal(capture.schema_base64, scenario.outputSchemaBytes.toString('base64'));
    assert.deepEqual(scenario.effectiveInputBytes, Buffer.concat([scenario.inputBytes, scenario.repairHeader, scenario.derivedBytes]));
    assert.equal(Buffer.from(scenario.repairEvidence.derived_input_bytes_base64, 'base64').toString('base64'), scenario.repairEvidence.derived_input_bytes_base64);
    assert.equal(scenario.repairEvidence.derived_input_byte_length, scenario.derivedBytes.length); assert.equal(scenario.repairEvidence.derived_input_sha256, sha256(scenario.derivedBytes));
    const plan = JSON.parse(await readFile(scenario.route.output_artifact_path, 'utf8')); assertRepairPlanFixture(scenario, plan);
    assert.deepEqual(await readFile(path.join(scenario.worktreeRoot, 'agent-change.txt')), scenario.changedTestBytes);
    assert.deepEqual(await readActualGitInventory(scenario.worktreeRoot), ['agent-change.txt']);
    assert.equal((await lstat(scenario.route.output_artifact_path)).isFile(), true); assert.equal(await realpath(scenario.route.output_artifact_path), scenario.route.output_artifact_path);
    assert.throws(() => process.kill(observed.pid, 0), error => error?.code === 'ESRCH');
  } finally { await scenario.cleanup(); }
});

test('CONTROL-M2-005 / TEST-M2-007 / 007-C03 / 007-L08,L11,L12: actual local Git index entries distinguish regular blobs, symlinks, and gitlinks while path escapes remain outside the legal inventory', async () => {
  const scenario = await createSharedLauncherScenario({ repair: true });
  try {
    await writeFile(path.join(scenario.worktreeRoot, 'agent-change.txt'), scenario.changedTestBytes);
    const regular = await runObservedProcess(testPinnedGitExecutable, ['-C', scenario.worktreeRoot, 'hash-object', '--', 'agent-change.txt'], { cwd: scenario.temporary, env: { PATH: '/usr/bin:/bin', LANG: 'C', LC_ALL: 'C', TZ: 'UTC' }, shell: false, uid: process.getuid(), gid: process.getgid() });
    assert.deepEqual({ code: regular.code, signal: regular.signal, errors: regular.errors }, { code: 0, signal: null, errors: [] });
    assert.match(regular.stdout.toString('utf8').trim(), /^[0-9a-f]{40}$/); assert.equal(sha256(await readFile(path.join(scenario.worktreeRoot, 'agent-change.txt'))), sha256(scenario.changedTestBytes));
    const outside = path.join(scenario.fixtureRoot, 'outside-test.mjs'); await writeFile(outside, 'outside\n'); await symlink(outside, path.join(scenario.worktreeRoot, 'linked-test.mjs'));
    const linked = await lstat(path.join(scenario.worktreeRoot, 'linked-test.mjs')); assert.equal(linked.isSymbolicLink(), true);
    for (const args of [
      ['-C', scenario.worktreeRoot, 'add', '--', 'agent-change.txt', 'linked-test.mjs'],
      ['-C', scenario.worktreeRoot, 'update-index', '--add', '--cacheinfo', '160000', scenario.candidateSha, 'submodule-entry'],
    ]) {
      const updated = await runObservedProcess(testPinnedGitExecutable, args, { cwd: scenario.temporary, env: { PATH: '/usr/bin:/bin', LANG: 'C', LC_ALL: 'C', TZ: 'UTC' }, shell: false, uid: process.getuid(), gid: process.getgid() });
      assert.deepEqual({ code: updated.code, signal: updated.signal, errors: updated.errors }, { code: 0, signal: null, errors: [] });
    }
    const staged = await runObservedProcess(testPinnedGitExecutable, ['-C', scenario.worktreeRoot, 'ls-files', '--stage', '-z'], { cwd: scenario.temporary, env: { PATH: '/usr/bin:/bin', LANG: 'C', LC_ALL: 'C', TZ: 'UTC' }, shell: false, uid: process.getuid(), gid: process.getgid() });
    assert.deepEqual({ code: staged.code, signal: staged.signal, errors: staged.errors }, { code: 0, signal: null, errors: [] });
    const modes = Object.fromEntries(staged.stdout.toString('utf8').split('\0').filter(Boolean).map(entry => { const match = /^(\d{6}) [0-9a-f]{40} 0\t(.+)$/.exec(entry); assert.ok(match); return [match[2], match[1]]; }));
    assert.equal(modes['agent-change.txt'], '100644'); assert.equal(modes['linked-test.mjs'], '120000'); assert.equal(modes['submodule-entry'], '160000');
    for (const invalid of ['../escape.mjs', '/absolute.mjs', 'nested/../../escape.mjs', 'nul\0path']) assert.equal(path.isAbsolute(invalid) || invalid.split('/').includes('..') || invalid.includes('\0'), true);
  } finally { await scenario.cleanup(); }
});

test('RED-M2-005 / TEST-M2-007 / 007-H01 / 007-L06,L07,L16 suffix: shared Host binds closed repair action/route and exact B-H-D stdin before the A2 proof frontier', {
  skip: 'USER_WAIVED / NOT_VERIFIED: Design 7.4.3 root-owned executable/capability, protected-root, and process-group admission precedes STARTED. The retained B-H-D and post-STARTED assertions are normative but require that privileged admission and dependent proof path; no generic route failure is credited as proof.',
}, async t => {
  const host = await loadSharedLauncherOrSkip(t, '007-H01'); if (!host) return;
  const scenario = await createSharedLauncherScenario({ repair: true });
  try {
    assert.deepEqual({ allowed_paths: scenario.repairSnapshotContext.allowed_paths, forbidden_paths: scenario.repairSnapshotContext.forbidden_paths }, repairFixtureScopePreimage);
    assert.equal(scenario.derivedEvidence.scope_sha256, repairFixtureScopeSha256);
    const observed = await runActualLauncherThroughHostLoop(host, scenario);
    assert.equal(observed.settlements[0]?.stage, 'STARTED');
    const capture = JSON.parse(await readFile(scenario.capturePath, 'utf8'));
    assert.equal(capture.input_base64, scenario.effectiveInputBytes.toString('base64')); assert.equal(capture.cwd, scenario.worktreeRoot); assert.deepEqual(capture.env, testFixedAgentEnvironment(scenario.route));
    assertRepairPlanFixture(scenario, JSON.parse(await readFile(scenario.route.output_artifact_path, 'utf8')));
    assert.throws(() => process.kill(Number(observed.settlements[0].observed_child_id), 0), error => error?.code === 'ESRCH');
    assert.deepEqual(observed.settlements.map(value => value.stage), ['STARTED', 'INTERRUPTED']); assert.equal(observed.settlements[1].reason_code, 'RESULT_UNREADABLE');
  } finally { await scenario.cleanup(); }
});

test('RED-M2-005 / TEST-M2-007 / 007-H02 / 007-L06,L16 suffix: wrong repair D identity/base64/hash/length and closed action-route fields reject before child', async t => {
  const host = await loadSharedLauncherOrSkip(t, '007-H02'); if (!host) return;
  const healthy = await createSharedLauncherScenario({ repair: true });
  try {
    const observed = await runActualLauncherThroughHostLoop(host, healthy);
    assert.deepEqual(observed.settlements.map(value => value.stage), ['START_FAILED'], 'the unmutated D and signed snapshot context reach the distinct post-input route frontier');
    assert.equal(observed.settlements[0].failure_code, 'ROUTE_UNAVAILABLE', 'the actual healthy START_FAILED/ROUTE_UNAVAILABLE is distinct from malformed-input rejection, but does not prove a specific privileged preflight cause; 006-H03 demonstrates generic route ambiguity');
    assert.equal(observed.launchedChild, null); assert.equal(observed.completed, null); assert.equal(observed.artifactReads, 0); assert.equal(observed.inventoryReads, 0);
  } finally { await healthy.cleanup(); }
  const mutations = [
    ['missing D', () => null, 'ROUTE_UNAVAILABLE'],
    ['wrong hash', scenario => ({ ...scenario.repairEvidence, derived_input_sha256: '0'.repeat(64) }), 'SPAWN_REJECTED'],
    ['wrong length', scenario => ({ ...scenario.repairEvidence, derived_input_byte_length: scenario.derivedBytes.length + 1 }), 'SPAWN_REJECTED'],
    ['noncanonical base64', scenario => ({ ...scenario.repairEvidence, derived_input_bytes_base64: `${scenario.repairEvidence.derived_input_bytes_base64}=` }), 'SPAWN_REJECTED'],
    ['wrong derived action identity', scenario => {
      const bytes = Buffer.from(canonicalJson({ ...scenario.derivedEvidence, candidate_sha: '9'.repeat(40) }));
      return { ...scenario.repairEvidence, derived_input_sha256: sha256(bytes), derived_input_byte_length: bytes.length, derived_input_bytes_base64: bytes.toString('base64') };
    }, 'SPAWN_REJECTED', {}],
    ['wrong derived tree identity', scenario => {
      const bytes = Buffer.from(canonicalJson({ ...scenario.derivedEvidence, candidate_tree: '9'.repeat(40) }));
      return { ...scenario.repairEvidence, derived_input_sha256: sha256(bytes), derived_input_byte_length: bytes.length, derived_input_bytes_base64: bytes.toString('base64') };
    }, 'SPAWN_REJECTED', {
      skip: 'USER_WAIVED / NOT_VERIFIED: Design 7.4.3 root-owned configured Git/runtime uid-gid/process-group admission precedes actual candidate-tree readback. This retained tree-proof body normatively expects SPAWN_REJECTED with zero effects, but requires that dependent privileged proof path.',
    }],
  ];
  for (const [label, mutate, failure_code, options = {}] of mutations) await t.test(label, options, async () => {
    const scenario = await createSharedLauncherScenario({ repair: true });
    try {
      const repair_evidence = mutate(scenario); const action = { ...scenario.action };
      if (repair_evidence === null) delete action.repair_evidence; else action.repair_evidence = repair_evidence;
      const route = repair_evidence === null ? scenario.route : { ...scenario.route, ...Object.fromEntries(testHostAgentBindingFields.map(field => [field, structuredClone(action[field])])), repair_evidence: structuredClone(repair_evidence) };
      const observed = await runActualLauncherThroughHostLoop(host, { ...scenario, action, route }, { route });
      assert.deepEqual(observed.settlements.map(value => value.stage), ['START_FAILED'], label); assert.equal(observed.settlements[0].failure_code, failure_code, label);
      assert.equal(Object.hasOwn(observed.settlements[0], 'observed_child_id'), false); assert.equal(observed.settlements.some(value => value.stage === 'RESULT'), false);
      assert.equal(observed.launchedChild, null, label); assert.equal(observed.completed, null, label); assert.equal(observed.artifactReads, 0, label); assert.equal(observed.inventoryReads, 0, label);
    } finally { await scenario.cleanup(); }
  });
});

const repairPlanH03A2Mutations = [
    ['extra plan field', plan => ({ ...plan, extra: true })], ['wrong status', plan => ({ ...plan, status: 'PASS' })], ['wrong branch', plan => ({ ...plan, kind: 'REPAIR_TEST_RESULT_V1' })],
    ['empty test inventory', plan => ({ ...plan, test_files: [] })], ['duplicate test path', plan => ({ ...plan, test_files: [plan.test_files[0], plan.test_files[0]] })],
    ['wrong test hash', plan => ({ ...plan, test_files: [{ ...plan.test_files[0], sha256: '0'.repeat(64) }] })], ['escaping test path', plan => ({ ...plan, test_files: [{ ...plan.test_files[0], path: '../escape.mjs' }] })],
    ['missing check', plan => ({ ...plan, checks: [] })], ['duplicate finding map', plan => ({ ...plan, checks: [plan.checks[0], plan.checks[0]] })],
    ['wrong requirement map', plan => ({ ...plan, checks: [{ ...plan.checks[0], requirement_ids: ['REQ-M2-WRONG'] }] })], ['wrong acceptance map', plan => ({ ...plan, checks: [{ ...plan.checks[0], acceptance_ids: ['AC-M2-WRONG'] }] })],
    ['wrong check path', plan => ({ ...plan, checks: [{ ...plan.checks[0], test_path: 'missing.mjs' }] })], ['duplicate test id', plan => ({ ...plan, checks: [{ ...plan.checks[0], control_test_id: plan.checks[0].red_test_id }] })],
  ];

for (const [index, [label, mutate]] of repairPlanH03A2Mutations.entries()) {
  test(`RED-M2-005 / TEST-M2-007 / REQ-M2-004 / AC-M2-004-03 / 007-H03-A2-${String(index + 1).padStart(2, '0')} / 007-L06..L12,L17,L19: ${label} rejects without RESULT`, {
    skip: 'USER_WAIVED / NOT_VERIFIED: Design 7.4.3 root-owned executable, protected-root, runtime-read-root, and process-group admission is required before STARTED; only then can Design 7.4.1 read this child-close plan. MASTER A2 waives that privileged preflight/isolation and dependent TEST-M2-007 Host-proof evidence. This callback remains the normative Host rejection oracle, not a runnable PASS or generic-failure credit.',
  }, async t => {
    const host = await loadSharedLauncherOrSkip(t, '007-H03'); if (!host) return;
    const scenario = await createSharedLauncherScenario({ repair: true, artifact_mutator: mutate });
    try {
      const observed = await runActualLauncherThroughHostLoop(host, scenario);
      assert.deepEqual(observed.settlements.map(value => value.stage), ['STARTED', 'INTERRUPTED'], label); assert.equal(observed.settlements[1].reason_code, 'RESULT_UNREADABLE', label);
      assert.equal(observed.settlements.some(value => value.stage === 'RESULT'), false, label);
    } finally { await scenario.cleanup(); }
  });
}

for (const behavior of ['nonzero', 'signal', 'missing-output']) test(`RED-M2-005 / TEST-M2-007 / 007-H04 / 007-L18..L20 / ${behavior}: repair child ${behavior} remains post-STARTED and cannot publish proof or Worker`, {
  skip: `USER_WAIVED / NOT_VERIFIED: Design 7.4.3 root-owned executable/capability, protected-root, and process-group admission precedes the ${behavior} child. The retained post-STARTED ${behavior} assertion is normative but requires that privileged admission and dependent proof path; no generic route failure is credited as proof.`,
}, async t => {
  const host = await loadSharedLauncherOrSkip(t, '007-H04'); if (!host) return;
  const scenario = await createSharedLauncherScenario({ repair: true, behavior });
  try {
    assert.deepEqual({ allowed_paths: scenario.repairSnapshotContext.allowed_paths, forbidden_paths: scenario.repairSnapshotContext.forbidden_paths }, repairFixtureScopePreimage);
    assert.equal(scenario.derivedEvidence.scope_sha256, repairFixtureScopeSha256);
    const observed = await runActualLauncherThroughHostLoop(host, scenario);
    assert.deepEqual(observed.settlements.map(value => value.stage), ['STARTED', 'INTERRUPTED'], behavior); assert.equal(observed.settlements[1].reason_code, 'RESULT_UNREADABLE', behavior);
    assert.equal(observed.settlements.some(value => value.stage === 'RESULT'), false);
  } finally { await scenario.cleanup(); }
});

test.skip('RED-M2-005 / TEST-M2-007 / 007-H05 / 007-L13..L15,L17,L19,L20 A2 boundary: sealed owner/mode/profile/process-group/isolation proof and dependent repair K2 positive', {
  skip: 'USER_WAIVED / NOT_VERIFIED: exact Appendix A2 privileged proof and dependent repair K2 only; no current-user substitute is permitted',
}, () => {});

test('CONTROL-M2-005 / TEST-M2-006 / 006-L03: controlled courier rejects an artifact hash mismatch before RESULT', async () => {
  const candidate_sha = '4'.repeat(40);
  const artifact = { schema_version: '1.0', change_id: 'CHG-mode-activation', candidate_sha, validator_head: candidate_sha, verdict: 'PASS', findings: [], risks: [], unverified: [], open_questions: [] };
  const result = await submitControlledValidatorArtifact({ artifact, completed: { status: 'PASS', artifact_sha256: sha256('wrong-artifact-bytes') } });
  assert.deepEqual(result.settlements.map(settlement => settlement.stage), ['STARTED', 'INTERRUPTED']);
  assert.deepEqual(result.settlements[1], { ...Object.fromEntries(Object.keys(result.action).filter(field => field !== 'action_kind').map(field => [field, result.action[field]])), stage: 'INTERRUPTED', observed_child_id: 'validator-child-negative-001', reason_code: 'RESULT_UNREADABLE' });
});

test('RED-M2-005 / TEST-M2-006 / 006-L03: controlled courier rejects a signed output-schema hash mismatch before reading a Validator artifact', async () => {
  const artifact = validatorArtifact();
  const bytes = Buffer.from(canonicalJson(artifact));
  const result = await submitControlledValidatorArtifact({ artifact, completed: { status: 'PASS', artifact_sha256: sha256(bytes) }, action_output_schema_sha256: '0'.repeat(64) });
  assert.deepEqual(result.settlements.map(settlement => settlement.stage), ['STARTED', 'INTERRUPTED']);
  assert.equal(result.settlements[1].reason_code, 'RESULT_UNREADABLE');
});

test('RED-M2-005 / TEST-M2-006 / 006-L02: controlled courier forwards a legal FAIL Validator artifact unchanged', async () => {
  const artifact = validatorArtifact({ verdict: 'FAIL', findings: [validatorFinding({ summary: 'courier contract missing' })], risks: [validatorNote()], unverified: [validatorNote({ note_id: 'unverified-001' })], open_questions: [validatorNote({ note_id: 'question-001' })] });
  const artifactBytes = Buffer.from(canonicalJson(artifact));
  const result = await submitControlledValidatorArtifact({ artifact, completed: { status: 'FAIL', artifact_sha256: sha256(artifactBytes) } });
  assert.deepEqual(result.settlements.map(settlement => settlement.stage), ['STARTED', 'RESULT']);
  assert.deepEqual(result.settlements[1], { ...Object.fromEntries(Object.keys(result.action).filter(field => field !== 'action_kind').map(field => [field, result.action[field]])), stage: 'RESULT', observed_child_id: 'validator-child-negative-001', status: 'FAIL', artifact_path: result.artifactPath, artifact_sha256: sha256(artifactBytes), validator_artifact: artifact });
});

test('RED-M2-005 / TEST-M2-006 / 006-L04: controlled courier rejects each closed-shape-invalid Validator artifact before RESULT with fixed action identities', async t => {
  const malformed = [
    ['extra artifact field', validatorArtifact({ extra: 'forbidden' })],
    ['PASS with a finding', validatorArtifact({ findings: [validatorFinding()] })],
    ['FAIL without a finding', validatorArtifact({ verdict: 'FAIL' })],
    ['invalid finding classification', validatorArtifact({ verdict: 'FAIL', findings: [validatorFinding({ classification: 'NOT_A_CLASSIFICATION' })] })],
    ['missing evidence on an eligible in-scope finding', validatorArtifact({ verdict: 'FAIL', findings: [validatorFinding({ classification: 'IMPLEMENTATION_IN_SCOPE', evidence_refs: [] })] })],
    ['duplicate finding ids', validatorArtifact({ verdict: 'FAIL', findings: [validatorFinding(), validatorFinding()] })],
    ['duplicate note ids', validatorArtifact({ risks: [validatorNote(), validatorNote()] })],
    ['missing required note collection', (() => { const value = validatorArtifact(); delete value.unverified; return value; })()],
  ];
  for (const [label, artifact] of malformed) await t.test(label, async () => {
    const bytes = Buffer.from(canonicalJson(artifact));
    const result = await submitControlledValidatorArtifact({ artifact, artifact_bytes: bytes, completed: { status: artifact.verdict, artifact_sha256: sha256(bytes) } });
    assert.equal(result.action.subject_sha, validatorCourierIdentity.candidate_sha, 'the action identity is fixed rather than copied from the malformed artifact');
    assert.deepEqual(result.settlements.map(settlement => settlement.stage), ['STARTED', 'INTERRUPTED']);
    assert.deepEqual(result.settlements[1], { ...Object.fromEntries(Object.keys(result.action).filter(field => field !== 'action_kind').map(field => [field, result.action[field]])), stage: 'INTERRUPTED', observed_child_id: 'validator-child-negative-001', reason_code: 'RESULT_UNREADABLE' });
  });
});

test('RED-M2-005 / TEST-M2-006 / 006-L05: controlled courier rejects noncanonical artifact bytes before RESULT', async () => {
  const artifact = validatorArtifact({ risks: [validatorNote()], unverified: [validatorNote({ note_id: 'unverified-001' })], open_questions: [validatorNote({ note_id: 'question-001' })] });
  const noncanonical = Buffer.from(JSON.stringify({ verdict: artifact.verdict, schema_version: artifact.schema_version, change_id: artifact.change_id, candidate_sha: artifact.candidate_sha, validator_head: artifact.validator_head, findings: artifact.findings, risks: artifact.risks, unverified: artifact.unverified, open_questions: artifact.open_questions }));
  const badBytes = await submitControlledValidatorArtifact({ artifact, artifact_bytes: noncanonical, completed: { status: 'PASS', artifact_sha256: sha256(noncanonical) } });
  assert.deepEqual(badBytes.settlements.map(settlement => settlement.stage), ['STARTED', 'INTERRUPTED']);
});

test('RED-M2-005 / TEST-M2-006 / 006-L06: controlled courier preserves every nonempty legal FAIL note collection unchanged', async () => {
  const artifact = validatorArtifact({
    verdict: 'FAIL', findings: [validatorFinding()],
    risks: [validatorNote({ note_id: 'risk-001' }), validatorNote({ note_id: 'risk-002', summary: 'second retained risk' })],
    unverified: [validatorNote({ note_id: 'unverified-001' }), validatorNote({ note_id: 'unverified-002', summary: 'second retained uncertainty' })],
    open_questions: [validatorNote({ note_id: 'question-001' }), validatorNote({ note_id: 'question-002', summary: 'second retained question' })],
  });
  const bytes = Buffer.from(canonicalJson(artifact));
  const result = await submitControlledValidatorArtifact({ artifact, artifact_bytes: bytes, completed: { status: 'FAIL', artifact_sha256: sha256(bytes) } });
  assert.deepEqual(result.settlements.map(settlement => settlement.stage), ['STARTED', 'RESULT']);
  assert.deepEqual(result.settlements[1], { ...Object.fromEntries(Object.keys(result.action).filter(field => field !== 'action_kind').map(field => [field, result.action[field]])), stage: 'RESULT', observed_child_id: 'validator-child-negative-001', status: 'FAIL', artifact_path: result.artifactPath, artifact_sha256: sha256(bytes), validator_artifact: artifact });
});

test('RED-M2-005 / TEST-M2-006 / 006-L07..L12: controlled courier rejects the complete artifact shape, verdict, array, classification, binding, and note negative matrix', async t => {
  const cases = [
    ['006-L07 missing finding field', validatorArtifact({ verdict: 'FAIL', findings: [(() => { const value = validatorFinding(); delete value.summary; return value; })()] })],
    ['006-L07 extra finding field', validatorArtifact({ verdict: 'FAIL', findings: [validatorFinding({ extra: 'forbidden' })] })],
    ['006-L07 wrong change identity', validatorArtifact({ change_id: 'CHG-wrong-validator-artifact' })],
    ['006-L07 wrong Candidate identity', validatorArtifact({ candidate_sha: '5'.repeat(40) })],
    ['006-L07 wrong Validator Head', validatorArtifact({ validator_head: '6'.repeat(40) })],
    ['006-L08 PASS with findings', validatorArtifact({ findings: [validatorFinding()] })],
    ['006-L08 FAIL without findings', validatorArtifact({ verdict: 'FAIL' })],
    ['006-L08 completed status conflicts with verdict', validatorArtifact({ verdict: 'FAIL', findings: [validatorFinding()] }), 'PASS'],
    ['006-L09 findings is not an array', validatorArtifact({ verdict: 'FAIL', findings: validatorFinding() })],
    ['006-L09 duplicate finding ids', validatorArtifact({ verdict: 'FAIL', findings: [validatorFinding(), validatorFinding()] })],
    ['006-L09 unsorted finding ids', validatorArtifact({ verdict: 'FAIL', findings: [validatorFinding({ finding_id: 'finding-02' }), validatorFinding({ finding_id: 'finding-01' })] })],
    ['006-L09 duplicate requirement ids', validatorArtifact({ verdict: 'FAIL', findings: [validatorFinding({ requirement_ids: ['REQ-M2-004', 'REQ-M2-004'] })] })],
    ['006-L10 invalid classification', validatorArtifact({ verdict: 'FAIL', findings: [validatorFinding({ classification: 'NOT_A_CLASSIFICATION' })] })],
    ['006-L11 missing requirement binding', validatorArtifact({ verdict: 'FAIL', findings: [validatorFinding({ classification: 'IMPLEMENTATION_IN_SCOPE', requirement_ids: [] })] })],
    ['006-L11 missing acceptance binding', validatorArtifact({ verdict: 'FAIL', findings: [validatorFinding({ classification: 'IMPLEMENTATION_IN_SCOPE', acceptance_ids: [] })] })],
    ['006-L11 missing path binding', validatorArtifact({ verdict: 'FAIL', findings: [validatorFinding({ classification: 'IMPLEMENTATION_IN_SCOPE', paths: [] })] })],
    ['006-L11 missing evidence binding', validatorArtifact({ verdict: 'FAIL', findings: [validatorFinding({ classification: 'IMPLEMENTATION_IN_SCOPE', evidence_refs: [] })] })],
    ['006-L12 risks is not an array', validatorArtifact({ risks: validatorNote() })],
    ['006-L12 duplicate note ids', validatorArtifact({ risks: [validatorNote(), validatorNote()] })],
    ['006-L12 unsorted note ids', validatorArtifact({ risks: [validatorNote({ note_id: 'risk-02' }), validatorNote({ note_id: 'risk-01' })] })],
    ['006-L12 missing note collection', (() => { const value = validatorArtifact(); delete value.open_questions; return value; })()],
    ['006-L12 null note collection cannot be host-defaulted', validatorArtifact({ unverified: null })],
  ];
  for (const [label, artifact, completedStatus = artifact.verdict] of cases) await t.test(label, async () => {
    const artifactBytes = Buffer.from(canonicalJson(artifact));
    const result = await submitControlledValidatorArtifact({ artifact, artifact_bytes: artifactBytes, completed: { status: completedStatus, artifact_sha256: sha256(artifactBytes) } });
    assert.equal(result.action.subject_sha, validatorCourierIdentity.candidate_sha, 'the controlled courier action identity is independent from every damaged artifact');
    assert.deepEqual(result.settlements.map(settlement => settlement.stage), ['STARTED', 'INTERRUPTED']);
    assert.equal(result.settlements[1].reason_code, 'RESULT_UNREADABLE');
  });
});

test('TEST-MA-HOST-003 / AC-MA-003-03,05 / CAN-MA-04: status half-close preserves one asynchronous canonical response', async () => {
  const host = await loadRequired(hostLoopPath, ['HOST_SOCKET_PATH', 'serveTrustedHostLoop'], 'production socket server is required');
  const nodeNet = (await import('node:net')).default;
  const nodeFs = (await import('node:fs')).default;
  const { syncBuiltinESMExports } = await import('node:module');
  const temporary = await mkdtemp('/tmp/jma-half-close-');
  const testSocketPath = path.join(temporary, 'change-coordinator.sock');
  const originalCreateServer = nodeNet.createServer;
  const originalChown = nodeFs.promises.chown;
  const originalChmod = nodeFs.promises.chmod;
  const originalLstat = nodeFs.promises.lstat;
  let server = null;
  let socketAuthority = null;

  nodeNet.createServer = (...args) => {
    const created = originalCreateServer(...args);
    const originalListen = created.listen.bind(created);
    created.listen = (...listenArgs) => {
      assert.equal(listenArgs[0], host.HOST_SOCKET_PATH, 'production binds only its fixed socket identity');
      listenArgs[0] = testSocketPath;
      return originalListen(...listenArgs);
    };
    server = created;
    return created;
  };
  nodeFs.promises.chown = async (target, uid, gid) => {
    if (target !== host.HOST_SOCKET_PATH) return originalChown(target, uid, gid);
    socketAuthority = { uid, gid };
  };
  nodeFs.promises.chmod = (target, mode) => originalChmod(
    target === host.HOST_SOCKET_PATH ? testSocketPath : target, mode,
  );
  nodeFs.promises.lstat = async target => {
    if (target !== host.HOST_SOCKET_PATH) return originalLstat(target);
    const stat = await originalLstat(testSocketPath);
    return new Proxy(stat, {
      get(value, key) {
        if (key === 'uid' || key === 'gid') return socketAuthority?.[key];
        const member = Reflect.get(value, key, value);
        return typeof member === 'function' ? member.bind(value) : member;
      },
    });
  };
  syncBuiltinESMExports();

  try {
    const expected = { schema_version: '1.0', operation: 'status', outcome: 'WAITING', change_id: null };
    const expectedFrame = Buffer.from(`${canonicalJson(expected)}\n`);
    let readStatusCalls = 0;
    let resolveReadStatusReturned;
    const readStatusReturned = new Promise(resolve => { resolveReadStatusReturned = resolve; });
    const hostLoop = {
      async submit() { throw new Error('UNREACHABLE'); },
      async readStatus() {
        readStatusCalls += 1;
        await new Promise(resolve => setImmediate(resolve));
        resolveReadStatusReturned();
        return expected;
      },
    };
    await host.serveTrustedHostLoop(hostLoop, host.HOST_SOCKET_PATH, 20);

    const response = await new Promise((resolve, reject) => {
      const client = nodeNet.createConnection({ path: testSocketPath });
      const chunks = [];
      client.setTimeout(2_000, () => { client.destroy(); reject(new Error('TEST_SOCKET_TIMEOUT')); });
      client.once('error', reject);
      client.once('connect', () => client.end(Buffer.from('{"operation":"status"}\n')));
      client.on('data', chunk => chunks.push(Buffer.from(chunk)));
      client.once('end', () => resolve(Buffer.concat(chunks)));
    });
    await readStatusReturned;
    assert.equal(readStatusCalls, 1, 'one canonical status frame invokes readStatus exactly once');
    assert.deepEqual(response, expectedFrame,
      'CAUSAL_RED: default allowHalfOpen:false must not close the writable side before asynchronous readStatus returns its one canonical response');
  } finally {
    if (server?.listening) await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    nodeNet.createServer = originalCreateServer;
    nodeFs.promises.chown = originalChown;
    nodeFs.promises.chmod = originalChmod;
    nodeFs.promises.lstat = originalLstat;
    syncBuiltinESMExports();
    await rm(temporary, { recursive: true, force: true });
  }
});

test('TEST-MA-LEDGER-001 / AC-MA-005-02,04; AC-MA-006-01,02,04 / CAN-MA-07,08,14: Evidence append and product push use exact refs, keys, and remote readback identity', async () => {
  const production = await loadRequired(productionPath, ['EVIDENCE_REF', 'GITHUB_CREDENTIAL_POLICY'], 'production Evidence transport is required');
  assert.equal(production.EVIDENCE_REF, 'refs/heads/evidence/agent-runs');
  const source = await readRequired(productionPath, 'production Ledger and branch transport source');
  const sshSource = source.slice(source.indexOf('function gitTransportArguments'), source.indexOf('function createBranchTransport'));
  const branchSource = source.slice(source.indexOf('function createBranchTransport'), source.indexOf('export function createPurposeBoundGitHubAdapters'));
  const predecessorSource = branchSource.slice(branchSource.indexOf('const prior ='), branchSource.indexOf('if (prior.code'));
  const mainSyncStart = source.indexOf('function createPurposeBoundMainSync');
  const mainSyncEnd = source.indexOf('export function createLedgerObjectReader', mainSyncStart);
  assert.ok(mainSyncStart >= 0 && mainSyncEnd > mainSyncStart, 'LEDGER001 main sync source anchors exist in strict order');
  const mainSyncSource = source.slice(mainSyncStart, mainSyncEnd);
  const ledgerSource = source.slice(source.indexOf('function createLedgerGateway'), source.indexOf('function parseHostConfig'));
  const commitSource = ledgerSource.slice(ledgerSource.indexOf('async commitAndPush'), ledgerSource.indexOf('async readRemoteAppend'));
  const readbackSource = ledgerSource.slice(ledgerSource.indexOf('async readRemoteAppend'));
  const obligations = {
    predecessor_uses_branch_deploy_key: /ls-remote/.test(predecessorSource) && /core\.sshCommand[^\n]*branchKeyPath/.test(predecessorSource),
    product_push_uses_branch_deploy_key: /core\.sshCommand[^\n]*branchKeyPath[\s\S]{0,300}'push'/.test(branchSource),
    release_fetch_is_exact_deploy_key_read: /readAuthorityFile\(branchKeyPath,\s*0o640\)/.test(mainSyncSource)
      && /core\.sshCommand[^\n]*branchKeyPath/.test(mainSyncSource)
      && /'fetch'[\s\S]{0,240}'refs\/heads\/main:refs\/remotes\/origin\/main'/.test(mainSyncSource),
    release_fetch_has_no_fallback_or_write: /remoteUrl\s*=\s*`git@github\.com:\$\{repository\}\.git`/.test(mainSyncSource)
      && /'credential\.helper='/.test(mainSyncSource)
      && /IdentityAgent=none/.test(sshSource) && /IdentitiesOnly=yes/.test(sshSource)
      && !/(?:https:\/\/|'push'|SSH_AUTH_SOCK|DYLD_|force)/i.test(mainSyncSource),
    release_sync_checks_identity: /'branch',\s*'--show-current'/.test(mainSyncSource)
      && /'status',\s*'--porcelain=v1',\s*'-z'/.test(mainSyncSource)
      && /origin_main\s*!==\s*squash_sha/.test(mainSyncSource)
      && /'merge',\s*'--ff-only',\s*squash_sha/.test(mainSyncSource),
    evidence_never_routes_as_product_branch: !/branchTransport\s*\(/.test(commitSource),
    exact_evidence_push_target: /`\$\{commit\}:\$\{EVIDENCE_REF\}`/.test(commitSource),
    exact_remote_ref_readback: /remote\.value\.remote_ref\s*!==\s*EVIDENCE_REF/.test(readbackSource),
    exact_remote_bytes_readback: /remote\.value\.prior_bytes_sha256\s*!==\s*receipt\.new_bytes_sha256/.test(readbackSource)
      && /remote\.value\.prior_byte_length\s*!==\s*receipt\.new_byte_length/.test(readbackSource),
    exact_remote_event_tuple: ['last_event_id', 'last_event_hash', 'last_sequence'].every((field, index) => new RegExp(`remote\\.value\\.${field}\\s*!==\\s*receipt\\.${['event_id', 'event_hash', 'sequence'][index]}`).test(readbackSource)),
  };
  assert.deepEqual(Object.entries(obligations).filter(([, met]) => !met).map(([name]) => name), [],
    'CAUSAL_RED: durable OK requires the exact Evidence ref plus raw JSONL byte/hash/event readback; product transport uses its deploy key for read and push');

  let authorityAvailable = true;
  let advertisedHead = 'b'.repeat(40);
  let lsRemoteCode = 0;
  let merged = false;
  const processCalls = [];
  const mainSyncFactory = Function(
    'readAuthorityFile', 'executeProcess', 'exactGitEnvironment', 'gitTransportArguments', 'ok',
    `${mainSyncSource}; return createPurposeBoundMainSync;`,
  )(
    async () => {
      if (!authorityAvailable) throw new Error('AUTHORITY_FILE_INVALID');
      return Buffer.from('purpose-bound-key');
    },
    async (executable, args, options) => {
      processCalls.push({ executable, args, options });
      if (args.includes('ls-remote')) return {
        code: lsRemoteCode, signal: null,
        stdout: lsRemoteCode === 0 ? Buffer.from(`${advertisedHead}\trefs/heads/main\n`) : Buffer.alloc(0),
        stderr: Buffer.alloc(0),
      };
      if (args.includes('fetch')) return { code: 0, signal: null, stdout: Buffer.alloc(0), stderr: Buffer.alloc(0) };
      if (args[0] === 'branch') return { code: 0, signal: null, stdout: Buffer.from('main\n'), stderr: Buffer.alloc(0) };
      if (args[0] === 'status') return { code: 0, signal: null, stdout: Buffer.alloc(0), stderr: Buffer.alloc(0) };
      if (args[0] === 'merge') { merged = true; return { code: 0, signal: null, stdout: Buffer.alloc(0), stderr: Buffer.alloc(0) }; }
      if (args[0] === 'rev-parse' && args[1] === 'HEAD') return {
        code: 0, signal: null, stdout: Buffer.from(`${merged ? 'b'.repeat(40) : 'a'.repeat(40)}\n`), stderr: Buffer.alloc(0),
      };
      if (args[0] === 'rev-parse' && args[1] === 'refs/remotes/origin/main') return {
        code: 0, signal: null, stdout: Buffer.from(`${'b'.repeat(40)}\n`), stderr: Buffer.alloc(0),
      };
      throw new Error('UNEXPECTED_GIT_CALL');
    },
    () => ({ LC_ALL: 'C', GIT_CONFIG_GLOBAL: '/dev/null' }),
    key => `/usr/bin/ssh -F /dev/null -i ${key} -o IdentitiesOnly=yes -o IdentityAgent=none`,
    value => ({ kind: 'OK', value }),
  );
  const mainSync = mainSyncFactory({
    gitExecutable: '/fixed/git', mainWorktreeRoot: '/main', branchKeyPath: '/root/branch-key',
    runtime_uid: 501, repository: 'owner/repository',
  });
  const request = {
    canonical_root: '/main', main_worktree_root: '/main',
    squash_sha: 'b'.repeat(40), expected_origin_main: 'b'.repeat(40),
  };
  assert.equal((await mainSync(request)).kind, 'OK');
  const transportCalls = processCalls.filter(call => call.args.includes('ls-remote') || call.args.includes('fetch'));
  assert.equal(transportCalls.length, 2);
  for (const call of transportCalls) {
    assert.equal(call.args.includes('git@github.com:owner/repository.git'), true);
    assert.equal(call.args.includes('credential.helper='), true);
    assert.equal(call.args.some(value => typeof value === 'string' && /https:|SSH_AUTH_SOCK|DYLD_/.test(value)), false);
  }
  assert.deepEqual(transportCalls[0].args.slice(-2), ['git@github.com:owner/repository.git', 'refs/heads/main']);
  assert.deepEqual(transportCalls[1].args.slice(-2), ['git@github.com:owner/repository.git', 'refs/heads/main:refs/remotes/origin/main']);

  const assertStopsBeforeSync = async (setup, expected) => {
    processCalls.length = 0; merged = false; authorityAvailable = true; advertisedHead = 'b'.repeat(40); lsRemoteCode = 0;
    setup();
    await assert.rejects(() => mainSync(request), expected);
    assert.equal(merged, false);
    assert.equal(processCalls.some(call => call.args.includes('fetch')), false);
  };
  await assertStopsBeforeSync(() => { authorityAvailable = false; }, /AUTHORITY_FILE_INVALID/);
  await assertStopsBeforeSync(() => { advertisedHead = 'c'.repeat(40); }, /REMOTE_CONFLICT/);
  await assertStopsBeforeSync(() => { lsRemoteCode = 1; }, /REMOTE_AMBIGUOUS/);
});

test('TEST-MA-COMPOSE-001 / AC-MA-001-01,02; AC-MA-004-03..05; AC-MA-006-04 / CAN-MA-02,05,06,08,12: production composes the unchanged Core and cannot bypass Ledger/Handoff/PR/Candidate ordering', async () => {
  await loadRequired(productionPath, ['createProductionComposition'], 'production composition root is required');
  const source = await readRequired(productionPath, 'production composition source');
  assert.match(source, /createCoordinatorCore/, 'production uses the canonical Foundation factory');
  assert.doesNotMatch(source, /createTestCoordinator|function\s+(?:applyControllerCommand|run|settlement|status)\s*\(/, 'production cannot substitute a second Coordinator implementation');
  assert.doesNotMatch(source, /(?:next[-_ ]change|dispatchNext|pollQueue|github.*(?:Issue|Project)|auto.*archive|auto.*merge)/i, 'Global WIP has no next-dispatch, Issue/Project, queue, autonomous archive, or merge route');
});

test('TEST-MA-CRED-001 / AC-MA-006-01..03 / CAN-MA-07: two root-owned credential purposes are disjoint and expose no forbidden GitHub authority', async () => {
  const production = await loadRequired(productionPath, ['GITHUB_CREDENTIAL_POLICY', 'createPurposeBoundGitHubAdapters'], 'purpose-bound GitHub adapters are required');
  assert.deepEqual(production.GITHUB_CREDENTIAL_POLICY, {
    branch_push: { path: '/private/etc/juanerai/github-branch-push-key', purpose: 'current-branch-git-transport' },
    pr_api: {
      path: '/private/etc/juanerai/github-pr-api-credential', purpose: 'current-pr-api',
      permissions: ['Metadata:read', 'Contents:read', 'PullRequests:write'], contents_write: false,
    },
  });
  assert.notEqual(production.GITHUB_CREDENTIAL_POLICY.branch_push.path, production.GITHUB_CREDENTIAL_POLICY.pr_api.path);
  const source = await readRequired(productionPath, 'purpose-bound GitHub adapter source');
  assert.doesNotMatch(source, /\b(?:mergePullRequest|approvePullRequest|closePullRequest|deletePullRequest|createIssue|updateIssue|createProject|deleteBranch|forcePush)\b/, 'forbidden GitHub/Git methods are structurally absent');
  assert.doesNotMatch(source, /branch_push[^\n]{0,200}pr_api|pr_api[^\n]{0,200}branch_push/, 'one call site cannot receive both credential purposes');
});

test('TEST-MA-INSTALL-001 / AC-MA-003-01,02; AC-MA-005-01,02; AC-MA-007-04,05 / CAN-MA-14: installer closes the exact Git artifact and rollback authority', async () => {
  const installer = await loadRequired(installerPath, ['HOST_INSTALL_TARGETS', 'PINNED_GIT_INSTALL', 'ROLLBACK_PRESERVES', 'createHostInstaller'], 'root-owned install/backup/rollback boundary is required');
  assert.deepEqual(installer.PINNED_GIT_INSTALL, {
    executable: {
      target_directory: '/Users/huangbo/Dev/Env/homebrew/bin', name: 'git',
      sha256: '6b348e2246cd4566a129c34a918ff2381c37eda817797d5bdd64ce719ff068ab', mode: 0o755,
    },
    libraries: [
      {
        target_directory: '/Users/huangbo/Dev/Env/homebrew/opt/gettext/lib', name: 'libintl.8.dylib',
        sha256: '9cf2cc193c7ee8db00d4a5df13f6f0f0277f6b83e45177dece6f9c99fc454dbd', mode: 0o444,
      },
      {
        target_directory: '/Users/huangbo/Dev/Env/homebrew/opt/pcre2/lib', name: 'libpcre2-8.0.dylib',
        sha256: '0d3fcf6ef5dc2c42cbc6ce2326b5266715461892e4f635b4ebfbce646667e84d', mode: 0o444,
      },
    ],
  });
  const requiredTargets = [
    '/private/etc/juanerai/controller-trust.json', '/private/etc/juanerai/host-loop.json',
    '/private/etc/juanerai/github-branch-push-key', '/private/etc/juanerai/github-pr-api-credential',
    '/Library/LaunchDaemons/com.juanerai.change-coordinator.plist', '/usr/local/bin/juanerai-coordinator',
    '/private/var/db/juanerai/change-coordinator', '/private/var/run/juanerai',
    '/private/var/run/juanerai/change-coordinator.sock',
    installer.PINNED_GIT_INSTALL.executable.target_directory,
    ...installer.PINNED_GIT_INSTALL.libraries.map(value => value.target_directory),
  ];
  for (const target of requiredTargets) assert.equal(installer.HOST_INSTALL_TARGETS.includes(target), true, `install contract includes ${target}`);
  for (const forbidden of ['/private/etc/ssh', '/usr/bin/git']) assert.equal(installer.HOST_INSTALL_TARGETS.some(target => target === forbidden || target.startsWith(`${forbidden}/`)), false);
  assert.deepEqual(installer.ROLLBACK_PRESERVES, ['active-pointer', 'state', 'ledger', 'handoff', 'canary-evidence', 'git-history']);
  assert.equal(installer.createHostInstaller.length, 1, 'one injected OS boundary supports temp-root tests without sudo');
  const source = await readRequired(installerPath, 'installer source');
  for (const term of ['backup', 'atomic', 'readback', 'rollback', 'unload', 'revoke']) assert.match(source, new RegExp(term, 'i'));
  const gitClosureObligations = {
    exact_directory_inventory: /readdir/.test(source) && /DIRECTORY_CONTENT_MISMATCH/.test(source),
    source_and_target_symlinks_reject: /SOURCE_SYMLINK_FORBIDDEN/.test(source) && /SYMLINK_FORBIDDEN/.test(source),
    pinned_hash_and_mode_readback: /PINNED_GIT_INSTALL/.test(source) && /ARTIFACT_HASH_MISMATCH/.test(source)
      && /ARTIFACT_MODE_MISMATCH/.test(source),
    child_acl_and_effective_write_checked: /aclReceipt\(os,\s*childTarget\)/.test(source)
      && /effectiveWriteDenied\(os,\s*plan\.runtime_user,\s*childTarget\)/.test(source),
    effective_write_uses_real_macos_test: /'\/bin\/test',\s*'-w'/.test(source)
      && !/'\/usr\/bin\/test',\s*'-w'/.test(source),
    no_binary_rewrite_or_ambient_dependency: !/(?:install_name_tool|brew\s+install|DYLD_|\/usr\/bin\/git)/.test(source),
  };
  assert.deepEqual(Object.entries(gitClosureObligations).filter(([, met]) => !met).map(([name]) => name), [],
    'CAUSAL_RED: exact Git bytes, non-system dylibs, directories, ACLs, and runtime write denial share one install/rollback transaction');
  assert.doesNotMatch(source, /(?:rm|unlink|truncate).*(?:active-change|ledger|handoff)|git\s+(?:reset|rebase)|active_change_id\s*[:=]\s*null/i, 'rollback cannot clear pointer, delete evidence, or reset Git');
});

test('TEST-MA-INSTALL-002 / AC-MA-003-01..03; AC-MA-005-01,02; AC-MA-007-04 / CAN-MA-04,14: temporary-root install includes the immutable Git closure and least-authority service', async t => {
  const installer = await loadRequired(installerPath, ['PINNED_GIT_INSTALL', 'ROLLBACK_PRESERVES', 'createHostInstaller'], 'directory-aware host installer is required');
  const temporary = await mkdtemp('/tmp/jma-');
  const targetRoot = path.join(temporary, 'target-root');
  const runtimeSource = path.join(temporary, 'runtime-source');
  const stateSource = path.join(temporary, 'state-source');
  const cliSource = path.join(temporary, 'juanerai-coordinator');
  const plistSource = path.join(temporary, 'service.plist');
  const trustSource = path.join(temporary, 'controller-trust.json');
  const gitSource = path.join(temporary, 'git-bin-source');
  const gettextSource = path.join(temporary, 'git-gettext-source');
  const pcre2Source = path.join(temporary, 'git-pcre2-source');
  const owners = new Map();
  const modeOverrides = new Map();
  const effectiveWriteDenials = new Set();
  const aclReadbackTargets = new Set();
  const aclEntries = new Map();
  const preexistingAclEntries = new Map();
  const aclMutationCalls = [];
  const runtimeGitExecutionCalls = [];
  const launchctlCalls = [];
  const runtimeDirectoryReadbacks = [];
  const capturedInstallerManifests = [];
  const injectedLstatErrors = new Map();
  const injectedReadResults = new Map();
  const socketTimers = new Set();
  const socketWrites = new Set();
  let fixtureOwnersBaseline = null;
  let runtimeReplacementCount = 0;
  let boundaryMutationCount = 0;
  let readinessMutationBaseline = null;
  let readinessMutationObserved = false;
  let aclGrantTarget = null;
  let effectiveWriteAllowedTarget = null;
  let bootstrapFailure = false;
  let socketScenario = 'exact';
  let socketIsSocket = true;
  let socketUid = 0;
  let socketGid = 20;
  let socketMode = 0o660;
  let socketReadbackAmbiguous = false;
  let socketAppearanceError = null;
  let aclMetadataVariant = false;
  let aclWhitespaceVariant = false;
  let aclReadCount = 0;
  let failAclGrantAt = null;
  let aclGrantAttempt = 0;
  let serviceLoaded = false;
  let otherAclRemovalAttempted = false;
  const runtimeDirectoryTarget = '/private/var/run/juanerai';
  const socketTarget = '/private/var/run/juanerai/change-coordinator.sock';
  const traversalTargets = [
    '/Users/huangbo',
    '/Users/huangbo/Dev',
    '/Users/huangbo/Dev/Env',
    '/Users/huangbo/Dev/Env/homebrew',
    '/Users/huangbo/Dev/Env/homebrew/opt',
    '/Users/huangbo/Dev/Env/homebrew/opt/gettext',
    '/Users/huangbo/Dev/Env/homebrew/opt/pcre2',
  ];
  const translate = target => ['/private/', '/Library/', '/usr/local/', '/Users/'].some(prefix => target.startsWith(prefix))
      ? path.join(targetRoot, target.slice(1)) : target;
  const runtimeDirectoryPath = translate(runtimeDirectoryTarget);
  const socketPath = translate(socketTarget);
  const ownerStat = async target => {
    const resolved = translate(target);
    const injected = injectedLstatErrors.get(resolved);
    if (injected) throw injected;
    if (target === socketTarget && readinessMutationBaseline !== null
      && boundaryMutationCount !== readinessMutationBaseline) readinessMutationObserved = true;
    if (target === socketTarget && socketReadbackAmbiguous) {
      const error = new Error('injected ambiguous socket readback');
      error.code = 'EACCES';
      throw error;
    }
    const stat = await lstat(resolved);
    const owner = owners.get(resolved) ?? { uid: stat.uid, gid: stat.gid };
    return new Proxy(stat, {
      get(value, key) {
        if (key === 'uid' || key === 'gid') return owner[key];
        if (key === 'mode' && modeOverrides.has(resolved)) return (value.mode & ~0o777) | modeOverrides.get(resolved);
        if (key === 'isSocket' && resolved === socketPath) return () => socketIsSocket;
        const member = Reflect.get(value, key, value);
        return typeof member === 'function' ? member.bind(value) : member;
      },
    });
  };
  const osBoundary = {
    async readFile(target) {
      const resolved = translate(target);
      const injected = injectedReadResults.get(resolved);
      return injected ? injected(await readFile(resolved)) : readFile(resolved);
    },
    readdir: target => readdir(translate(target)),
    writeFile: (target, bytes, options) => {
      boundaryMutationCount += 1;
      if (target.endsWith(`manifest.json.stage-${process.pid}`)) capturedInstallerManifests.push(Buffer.from(bytes));
      return writeFile(translate(target), bytes, options);
    },
    mkdir: (target, options) => { boundaryMutationCount += 1; return mkdir(translate(target), options); },
    lstat: ownerStat,
    realpath: target => realpath(translate(target)),
    async rename(from, to) {
      boundaryMutationCount += 1;
      const source = translate(from); const target = translate(to);
      await rename(source, target);
      if (to === '/usr/local/libexec/juanerai-change-coordinator') runtimeReplacementCount += 1;
      for (const [ownedPath, owner] of [...owners]) {
        if (ownedPath === source || ownedPath.startsWith(`${source}${path.sep}`)) {
          owners.set(`${target}${ownedPath.slice(source.length)}`, owner);
          owners.delete(ownedPath);
        }
      }
    },
    copyFile: (from, to) => { boundaryMutationCount += 1; return copyFile(translate(from), translate(to)); },
    chmod: (target, mode) => { boundaryMutationCount += 1; return chmod(translate(target), mode); },
    async chown(target, uid, gid) { boundaryMutationCount += 1; owners.set(translate(target), { uid, gid }); },
    rm: (target, options) => { boundaryMutationCount += 1; return rm(translate(target), options); },
    open: (target, flags) => open(translate(target), flags),
    async exec(executable, args) {
      if (executable === '/bin/ls') {
        aclReadbackTargets.add(args.at(-1));
        const installedAcl = aclEntries.get(args.at(-1));
        const existingAcl = preexistingAclEntries.get(args.at(-1)) ?? [];
        const semanticEntries = [...existingAcl, ...(installedAcl ? [installedAcl] : [])];
        const metadata = aclMetadataVariant
          ? `drwx------ ${2 + aclReadCount} owner group ${100 + aclReadCount} Aug 27 0${aclReadCount}:0${aclReadCount} ${args.at(-1)}`
          : args.at(-1);
        aclReadCount += 1;
        const renderedEntries = semanticEntries.map((entry, index) => aclWhitespaceVariant
          ? `  ${index + 7}:   ${entry.replace(/\s+/g, '   ')}   `
          : ` ${index}: ${entry}`);
        return {
          code: 0, signal: null,
          stdout: Buffer.from(args.at(-1) === aclGrantTarget
            ? `${args.at(-1)}\n 0: user:test allow read,write\n`
            : `${metadata}\n${renderedEntries.length ? `${renderedEntries.join('\n')}\n` : ''}`),
          stderr: Buffer.alloc(0),
        };
      }
      if (executable === '/bin/chmod') {
        aclMutationCalls.push([...args]);
        const [operation, entry, target] = args;
        if (operation === '+a' && typeof entry === 'string' && typeof target === 'string') {
          aclGrantAttempt += 1;
          if (failAclGrantAt === aclGrantAttempt) {
            aclMetadataVariant = true;
            return { code: 1, signal: null, stdout: Buffer.alloc(0), stderr: Buffer.from('injected partial traversal failure') };
          }
          aclEntries.set(target, entry);
        }
        else if (operation === '-a' && aclEntries.get(target) === entry) aclEntries.delete(target);
        else {
          otherAclRemovalAttempted = true;
          return { code: 1, signal: null, stdout: Buffer.alloc(0), stderr: Buffer.from('unsupported ACL mutation') };
        }
        return { code: 0, signal: null, stdout: Buffer.alloc(0), stderr: Buffer.alloc(0) };
      }
      if (executable === '/usr/bin/sudo') {
        if (args.at(-2) === '/Users/huangbo/Dev/Env/homebrew/bin/git' && args.at(-1) === '--version') {
          runtimeGitExecutionCalls.push([...args]);
          return { code: 0, signal: null, stdout: Buffer.from('git version 2.54.0\n'), stderr: Buffer.alloc(0) };
        }
        effectiveWriteDenials.add(args.at(-1));
        return { code: args.at(-1) === effectiveWriteAllowedTarget ? 0 : 1, signal: null, stdout: Buffer.alloc(0), stderr: Buffer.alloc(0) };
      }
      if (executable !== '/bin/launchctl') throw new Error('UNEXPECTED_EXECUTABLE');
      launchctlCalls.push([...args]);
      if (args[0] === 'bootout') {
        serviceLoaded = false;
        readinessMutationBaseline = null;
        return { code: 3, signal: null, stdout: Buffer.alloc(0), stderr: Buffer.alloc(0) };
      }
      if (args[0] === 'bootstrap') {
        let runtimeDirectoryStat;
        try { runtimeDirectoryStat = await ownerStat(runtimeDirectoryTarget); }
        catch (error) {
          if (error?.code !== 'ENOENT') throw error;
          return { code: 1, signal: null, stdout: Buffer.alloc(0), stderr: Buffer.from('runtime directory missing') };
        }
        runtimeDirectoryReadbacks.push({
          isDirectory: runtimeDirectoryStat.isDirectory(), uid: runtimeDirectoryStat.uid,
          gid: runtimeDirectoryStat.gid, mode: runtimeDirectoryStat.mode & 0o777,
        });
        if (bootstrapFailure) return { code: 1, signal: null, stdout: Buffer.alloc(0), stderr: Buffer.from('injected bootstrap failure') };
        serviceLoaded = true;
        socketReadbackAmbiguous = socketScenario === 'ambiguous';
        readinessMutationBaseline = boundaryMutationCount;
        if (socketScenario === 'exact' || socketScenario === 'wrong-authority') {
          const socketTimer = setTimeout(() => {
            const socketWrite = (async () => {
              try {
                await writeFile(socketPath, Buffer.alloc(0));
                await chmod(socketPath, socketMode);
                owners.set(socketPath, { uid: socketUid, gid: socketGid });
              } catch (error) { socketAppearanceError = error; }
              finally { socketTimers.delete(socketTimer); socketWrites.delete(socketWrite); }
            })();
            socketWrites.add(socketWrite);
          }, 25);
          socketTimers.add(socketTimer);
        }
        return { code: 0, signal: null, stdout: Buffer.alloc(0), stderr: Buffer.alloc(0) };
      }
      if (args[0] === 'print') return { code: 0, signal: null, stdout: Buffer.from('state = running\n'), stderr: Buffer.alloc(0) };
      throw new Error('UNEXPECTED_LAUNCHCTL');
    },
    uid: () => 0,
    gid: () => 0,
    now: () => '2026-08-26T10:00:00.000Z',
  };

  const snapshotPath = async target => {
    try {
      const stat = await ownerStat(target);
      const common = { uid: stat.uid, gid: stat.gid, mode: stat.mode & 0o777 };
      if (stat.isDirectory()) {
        const names = (await readdir(translate(target))).sort();
        return {
          target, type: 'directory', ...common,
          children: await Promise.all(names.map(name => snapshotPath(path.join(target, name)))),
        };
      }
      if (stat.isFile()) return {
        target, type: 'file', ...common,
        bytes_base64: (await readFile(translate(target))).toString('base64'),
      };
      return { target, type: 'other', ...common };
    } catch (error) {
      if (error?.code === 'ENOENT') return { target, type: 'absent' };
      throw error;
    }
  };
  const snapshotPaths = targets => Promise.all([...targets].sort().map(snapshotPath));

  try {
    for (const target of traversalTargets) {
      const resolved = translate(target);
      await mkdir(resolved, { recursive: true });
      const mode = target === '/Users/huangbo' ? 0o700 : 0o755;
      await chmod(resolved, mode);
      owners.set(resolved, { uid: 502, gid: 20 });
    }
    await mkdir(runtimeSource, { recursive: true });
    const currentRuntimeNames = ['adapters.mjs', 'coordinator.mjs', 'host-loop.mjs', 'production.mjs', 'worktree-snapshot-contract.mjs'];
    for (const name of currentRuntimeNames) {
      await copyFile(path.join(root, name), path.join(runtimeSource, name));
    }
    await copyFile(path.join(root, 'cli.mjs'), cliSource);
    await chmod(cliSource, 0o755);
    await copyFile(path.join(root, 'com.juanerai.change-coordinator.plist'), plistSource);
    await writeFile(trustSource, canonicalJson({ schema_version: '1.0', active_keys: [], revoked_key_ids: [] }));
    await mkdir(gitSource, { recursive: true });
    await mkdir(gettextSource, { recursive: true });
    await mkdir(pcre2Source, { recursive: true });
    await copyFile('/Users/huangbo/Dev/Env/homebrew/bin/git', path.join(gitSource, 'git'));
    await copyFile('/Users/huangbo/Dev/Env/homebrew/opt/gettext/lib/libintl.8.dylib', path.join(gettextSource, 'libintl.8.dylib'));
    await copyFile('/Users/huangbo/Dev/Env/homebrew/opt/pcre2/lib/libpcre2-8.0.dylib', path.join(pcre2Source, 'libpcre2-8.0.dylib'));
    await mkdir(stateSource, { recursive: true });
    const emptyPointer = Buffer.from(canonicalJson({ schema_version: '1.0', active_change_id: null }));
    await writeFile(path.join(stateSource, 'active-change.json'), emptyPointer);

    const runtimeTarget = '/usr/local/libexec/juanerai-change-coordinator';
    const cliTarget = '/usr/local/bin/juanerai-coordinator';
    const stateTarget = '/private/var/db/juanerai/change-coordinator';
    const trustTarget = '/private/etc/juanerai/controller-trust.json';
    const plistTarget = '/Library/LaunchDaemons/com.juanerai.change-coordinator.plist';
    const gitTarget = installer.PINNED_GIT_INSTALL.executable.target_directory;
    const gettextTarget = installer.PINNED_GIT_INSTALL.libraries[0].target_directory;
    const pcre2Target = installer.PINNED_GIT_INSTALL.libraries[1].target_directory;
    const plan = {
      sources: {
        [runtimeTarget]: runtimeSource,
        [cliTarget]: cliSource,
        [stateTarget]: stateSource,
        [trustTarget]: trustSource,
        [plistTarget]: plistSource,
        [gitTarget]: gitSource,
        [gettextTarget]: gettextSource,
        [pcre2Target]: pcre2Source,
      },
      modes: {
        [runtimeTarget]: 0o755,
        [cliTarget]: 0o755,
        [stateTarget]: 0o700,
        [trustTarget]: 0o600,
        [plistTarget]: 0o644,
        [gitTarget]: 0o755,
        [gettextTarget]: 0o755,
        [pcre2Target]: 0o755,
      },
      runtime_user: 'huangbo', runtime_uid: 501, runtime_gid: 20,
    };
    const hostInstaller = installer.createHostInstaller(osBoundary);
    fixtureOwnersBaseline = new Map(owners);
    const observedEmptyAclSha256 = async target => {
      const observation = await osBoundary.exec('/bin/ls', ['-lde', target]);
      assert.equal(observation.code, 0, `controlled ACL observation succeeds for ${target}`);
      const entries = observation.stdout.toString('utf8').split('\n').slice(1).filter(Boolean);
      assert.deepEqual(entries, [], `controlled ACL observation is actually empty for ${target}`);
      return sha256(Buffer.from('[]'));
    };
    const clearRuntimeTarget = async () => {
      await osBoundary.rm(runtimeTarget, { recursive: true, force: true });
      for (const ownedPath of [...owners.keys()]) {
        if (ownedPath === translate(runtimeTarget) || ownedPath.startsWith(`${translate(runtimeTarget)}${path.sep}`)) owners.delete(ownedPath);
      }
    };
    const resetRuntimeFixture = async () => {
      for (const timer of socketTimers) clearTimeout(timer);
      socketTimers.clear();
      await Promise.all([...socketWrites]);
      bootstrapFailure = false;
      injectedLstatErrors.clear(); injectedReadResults.clear();
      socketScenario = 'exact'; socketIsSocket = true; socketUid = 0; socketGid = 20; socketMode = 0o660;
      socketReadbackAmbiguous = false; socketAppearanceError = null;
      serviceLoaded = false; readinessMutationBaseline = null; readinessMutationObserved = false;
      runtimeReplacementCount = 0;
      aclGrantTarget = null; effectiveWriteAllowedTarget = null; failAclGrantAt = null; aclGrantAttempt = 0;
      otherAclRemovalAttempted = false; aclMetadataVariant = false; aclWhitespaceVariant = false; aclReadCount = 0;
      runtimeDirectoryReadbacks.length = 0; runtimeGitExecutionCalls.length = 0; launchctlCalls.length = 0;
      aclMutationCalls.length = 0; aclReadbackTargets.clear(); effectiveWriteDenials.clear();
      aclEntries.clear(); preexistingAclEntries.clear(); modeOverrides.clear();
      for (const target of [...Object.keys(plan.sources), runtimeDirectoryTarget, socketTarget,
        '/private/var/db/juanerai/change-coordinator-install-backups']) await osBoundary.rm(target, { recursive: true, force: true });
      owners.clear();
      for (const [target, owner] of fixtureOwnersBaseline ?? []) owners.set(target, owner);
    };
    const prepareRuntimePredecessor = async (names, marker = null) => {
      const expected = new Map();
      await clearRuntimeTarget();
      await osBoundary.mkdir(runtimeTarget, { recursive: true, mode: 0o755 });
      await osBoundary.chown(runtimeTarget, 0, 0); await osBoundary.chmod(runtimeTarget, 0o755);
      const directory = { uid: 0, gid: 0, mode: 0o755, acl_sha256: await observedEmptyAclSha256(runtimeTarget) };
      for (const [index, name] of names.entries()) {
        const target = path.join(runtimeTarget, name);
        const bytes = marker ? Buffer.concat([await readFile(path.join(runtimeSource, name)), Buffer.from(`\n// ${marker}:${name}\n`)]) : await readFile(path.join(runtimeSource, name));
        const mode = marker ? [0o600, 0o640, 0o644, 0o700, 0o755][index] : 0o644;
        await osBoundary.writeFile(target, bytes, { mode });
        await osBoundary.chown(target, 0, 0); await osBoundary.chmod(target, mode);
        expected.set(name, { bytes, mode, uid: 0, gid: 0, acl_sha256: await observedEmptyAclSha256(target) });
      }
      return { directory, files: expected };
    };
    const assertRuntimeRejection = async (action, matcher, label, { clearInjectionsBeforeAfter = false, preimage = null } = {}) => {
      const before = preimage ?? await snapshotPaths([runtimeTarget]);
      const replacementsBefore = runtimeReplacementCount;
      let rejection = null;
      try { await action(); } catch (error) { rejection = error; }
      if (clearInjectionsBeforeAfter) { injectedLstatErrors.clear(); injectedReadResults.clear(); }
      const after = await snapshotPaths([runtimeTarget]);
      assert.equal(rejection !== null, true, `${label}: operation rejects`);
      assert.equal(typeof matcher === 'function' ? matcher(rejection) : matcher.test(String(rejection?.message ?? '')), true, `${label}: rejection remains inside the approved error boundary`);
      assert.deepEqual(after, before, `${label}: runtime preimage is preserved on rejection`);
      assert.equal(runtimeReplacementCount, replacementsBefore, `${label}: rejection does not reach runtime replacement`);
    };

    await t.test('TEST-RIC-000 / REQ-RIC-001 AC-RIC-001-01,03; REQ-RIC-003 AC-RIC-003-04 / HEALTH: five independent regular source bytes and initial ABSENT predecessor are healthy before causal RED', async t => {
      await assert.rejects(() => ownerStat(runtimeTarget), { code: 'ENOENT' }, 'pre-RED runtime target is actually absent');
      const sourceHealth = await Promise.all(currentRuntimeNames.map(async name => {
        const source = path.join(runtimeSource, name);
        const stat = await lstat(source); const bytes = await readFile(source);
        return { name, regular: stat.isFile(), linked: stat.isSymbolicLink(), bytes: bytes.length, sha256: sha256(bytes) };
      }));
      assert.equal(sourceHealth.every(value => value.regular && !value.linked && value.bytes > 0 && /^[0-9a-f]{64}$/.test(value.sha256)), true,
        'all five health source members are independently regular, readable, nonempty, and hashed');
      assert.match(await readRequired(productionPath, 'production source'), /worktree-snapshot-contract\.mjs/,
        'the installed production module graph requires the snapshot module member under test');
      t.diagnostic(canonicalJson({ kind: 'RIC_SOURCE_HEALTH_V1', runtime_target: runtimeTarget, predecessor: 'ABSENT', source_health: sourceHealth }));
    });

    await t.test('TEST-RIC-001 / RED-RIC-001 / REQ-RIC-001 AC-RIC-001-01,03 / INTENT-RIC-SOURCE-NEW5: exact current runtime bytes install and load only from the temporary target', async t => {
      let receipt = null;
      try {
      await assert.doesNotReject(async () => { receipt = await hostInstaller.install(plan); },
        'RED-RIC-001: the exact regular five-file source must not be rejected by runtime inventory admission');
      const producedManifest = JSON.parse((await osBoundary.readFile(receipt.manifest_path)).toString('utf8'));
      assert.deepEqual(producedManifest.prior.find(value => value.target === runtimeTarget), {
        target: runtimeTarget, present: false, type: null, backup_path: null, sha256: null,
        uid: null, gid: null, mode: null, acl_sha256: null,
      }, 'the successful new5 producer records the independently observed ABSENT runtime predecessor');
      const installedRuntime = translate(runtimeTarget);
      const sourceHashes = Object.fromEntries(await Promise.all(currentRuntimeNames.map(async name => [name, sha256(await readFile(path.join(runtimeSource, name)))])));
      const installedHashes = Object.fromEntries(await Promise.all(currentRuntimeNames.map(async name => [name, sha256(await readFile(path.join(installedRuntime, name)))])));
      assert.deepEqual(installedHashes, sourceHashes, 'all five installed runtime bytes remain bound to their real temporary source bytes');
      const childArgs = [
        '--input-type=module', '--eval',
        'const production = await import(process.argv[1]); if (typeof production.createProductionComposition !== "function") throw new Error("installed production export missing"); process.stdout.write("RIC_MODULE_CLOSURE_OK\\n");',
        path.join(installedRuntime, 'production.mjs'),
      ];
      const moduleLoad = await runObservedProcess(process.execPath, childArgs, {
        cwd: temporary,
        env: { PATH: '/usr/bin:/bin', LANG: 'C', LC_ALL: 'C', TZ: 'UTC' }, shell: false,
      });
      assert.deepEqual({ code: moduleLoad.code, signal: moduleLoad.signal, stdout: moduleLoad.stdout.toString('utf8'), stderr: moduleLoad.stderr.toString('utf8'), errors: moduleLoad.errors },
        { code: 0, signal: null, stdout: 'RIC_MODULE_CLOSURE_OK\n', stderr: '', errors: [] },
        'the independent child imports only installed production and resolves its installed snapshot dependency');
      t.diagnostic(canonicalJson({
        kind: 'RIC_MODULE_CLOSURE_V1', source_hashes: sourceHashes, installed_hashes: installedHashes,
        child: { executable: process.execPath, argv: childArgs, cwd: temporary, env: { PATH: '/usr/bin:/bin', LANG: 'C', LC_ALL: 'C', TZ: 'UTC' }, stdout: moduleLoad.stdout.toString('utf8'), stderr: moduleLoad.stderr.toString('utf8'), exit: moduleLoad.code, signal: moduleLoad.signal, errors: moduleLoad.errors },
      }));
      await assert.doesNotReject(() => hostInstaller.rollback({
        manifest_path: receipt.manifest_path, manifest_sha256: receipt.manifest_sha256,
        revocation_receipt_sha256: '0'.repeat(64), emergency_pre_activation: true,
      }));
      await assert.rejects(() => ownerStat(runtimeTarget), { code: 'ENOENT' }, 'ABSENT predecessor returns to actual absence after the closure control');
      } finally {
        await resetRuntimeFixture();
      }
    });

    const rejectRuntimeSource = async label => {
      try { await assertRuntimeRejection(() => hostInstaller.install(plan), /DIRECTORY_CONTENT_MISMATCH|SOURCE_SYMLINK_FORBIDDEN|SOURCE_INVALID/, label); }
      finally { await resetRuntimeFixture(); }
    };
    await t.test('TEST-RIC-003A / REQ-RIC-001 AC-RIC-001-02 / INTENT-RIC-SOURCE-REJECT: legacy four-file source is rejected before runtime replacement', async () => {
      const snapshotSource = path.join(runtimeSource, 'worktree-snapshot-contract.mjs');
      try { await rm(snapshotSource); await rejectRuntimeSource('legacy four-file source is never a new-install source'); }
      finally { await rm(snapshotSource, { force: true }); await copyFile(path.join(root, 'worktree-snapshot-contract.mjs'), snapshotSource); }
    });
    await t.test('TEST-RIC-003B / REQ-RIC-001 AC-RIC-001-02 / INTENT-RIC-SOURCE-REJECT: extra source member is rejected before runtime replacement', async () => {
      const extraSource = path.join(runtimeSource, 'extra.mjs');
      try { await writeFile(extraSource, Buffer.from('export {};')); await rejectRuntimeSource('extra runtime source member fails closed'); }
      finally { await rm(extraSource, { force: true }); }
    });
    await t.test('TEST-RIC-003C / REQ-RIC-001 AC-RIC-001-02 / INTENT-RIC-SOURCE-REJECT: linked source member is rejected before runtime replacement', async () => {
      const adapterSource = path.join(runtimeSource, 'adapters.mjs');
      try { await rm(adapterSource); await symlink(path.join(root, 'adapters.mjs'), adapterSource); await rejectRuntimeSource('linked runtime source member fails closed'); }
      finally { await rm(adapterSource, { force: true }); await copyFile(path.join(root, 'adapters.mjs'), adapterSource); }
    });
    await t.test('TEST-RIC-003D / REQ-RIC-001 AC-RIC-001-02 / INTENT-RIC-SOURCE-REJECT: non-regular source member is rejected before runtime replacement', async () => {
      const adapterSource = path.join(runtimeSource, 'adapters.mjs');
      try { await rm(adapterSource); await mkdir(adapterSource); await rejectRuntimeSource('non-regular runtime source member fails closed'); }
      finally { await rm(adapterSource, { recursive: true, force: true }); await copyFile(path.join(root, 'adapters.mjs'), adapterSource); }
    });
    await t.test('TEST-RIC-003E / REQ-RIC-001 AC-RIC-001-02 / INTENT-RIC-SOURCE-REJECT: empty source member is rejected before runtime replacement', async () => {
      const adapterSource = path.join(runtimeSource, 'adapters.mjs');
      const original = await readFile(adapterSource);
      try { await writeFile(adapterSource, Buffer.alloc(0)); await rejectRuntimeSource('empty runtime source member fails closed'); }
      finally { await writeFile(adapterSource, original); }
    });

    const assertPhysicalPredecessor = async (label, names) => {
      try {
        const expected = await prepareRuntimePredecessor(names, `RIC-${label}-prior`);
        const manifestsBeforeInstall = capturedInstallerManifests.length;
        bootstrapFailure = true;
        await assert.rejects(() => hostInstaller.install(plan), /SERVICE_LOAD_FAILED/, `${label}: controlled late failure invokes the existing rollback path`);
        bootstrapFailure = false;
        assert.equal(capturedInstallerManifests.length, manifestsBeforeInstall + 1, `${label}: real install produced one immutable manifest preimage`);
        const stagedManifest = capturedInstallerManifests.at(-1);
        const staged = JSON.parse(stagedManifest.toString('utf8'));
        const persistedPath = path.join('/private/var/db/juanerai/change-coordinator-install-backups', staged.installation_id, 'manifest.json');
        const persistedBytes = await osBoundary.readFile(persistedPath);
        assert.deepEqual(persistedBytes, stagedManifest, `${label}: actual manifest file equals the producer's staged bytes`);
        const producedManifest = JSON.parse(persistedBytes.toString('utf8'));
        const runtimePrior = producedManifest.prior.find(value => value.target === runtimeTarget);
        assert.deepEqual(runtimePrior.directory_files.map(file => file.name).sort(), [...names].sort(), `${label}: real backup manifest records the exact predecessor set`);
        assert.deepEqual({ uid: runtimePrior.uid, gid: runtimePrior.gid, mode: runtimePrior.mode, acl_sha256: runtimePrior.acl_sha256 }, expected.directory, `${label}: producer manifest records independently prepared directory metadata and actual ACL observation`);
        const expectedMetadata = ({ uid, gid, mode, acl_sha256 }) => ({ uid, gid, mode, acl_sha256 });
        for (const file of runtimePrior.directory_files) {
          assert.equal(file.backup_path, path.join('/private/var/db/juanerai/change-coordinator-install-backups', producedManifest.installation_id, sha256(Buffer.from(runtimeTarget)), file.name), `${label}: backup path derives from this manifest directory, target identity, and child name`);
          assert.deepEqual({ uid: file.uid, gid: file.gid, mode: file.mode, acl_sha256: file.acl_sha256 }, expectedMetadata(expected.files.get(file.name)), `${label}: producer manifest records independently prepared child metadata and actual ACL observation for ${file.name}`);
          assert.deepEqual(await osBoundary.readFile(file.backup_path), expected.files.get(file.name).bytes, `${label}: durable backup stores the actual distinct predecessor bytes`);
          assert.equal(file.sha256, sha256(expected.files.get(file.name).bytes), `${label}: manifest hash binds the actual predecessor bytes`);
        }
        const actualNames = (await readdir(translate(runtimeTarget))).sort();
        assert.deepEqual(actualNames, [...names].sort(), `${label}: rollback restores exactly the predecessor inventory`);
        const restoredDirectory = await ownerStat(runtimeTarget);
        assert.deepEqual({ uid: restoredDirectory.uid, gid: restoredDirectory.gid, mode: restoredDirectory.mode & 0o777, acl_sha256: await observedEmptyAclSha256(runtimeTarget) },
          expected.directory, `${label}: rollback restores prepared directory authority and observed empty ACL`);
        for (const name of names) {
          const restored = await ownerStat(path.join(runtimeTarget, name));
          assert.deepEqual(await readFile(path.join(translate(runtimeTarget), name)), expected.files.get(name).bytes, `${label}: rollback restores the distinct actual predecessor bytes for ${name}`);
          assert.deepEqual({ uid: restored.uid, gid: restored.gid, mode: restored.mode & 0o777, acl_sha256: await observedEmptyAclSha256(path.join(runtimeTarget, name)) },
            expectedMetadata(expected.files.get(name)), `${label}: rollback restores the recorded predecessor owner, mode, and observed empty ACL for ${name}`);
        }
        assert.equal(actualNames.includes('worktree-snapshot-contract.mjs'), names.includes('worktree-snapshot-contract.mjs'), `${label}: rollback never synthesizes or leaves a snapshot member`);
      } finally {
        await resetRuntimeFixture();
      }
    };
    await t.test('TEST-RIC-004A / REQ-RIC-002 AC-RIC-002-01..03; REQ-RIC-003 AC-RIC-003-04 / INTENT-RIC-PRIOR-OLD4: real install backs up and restores a physical legacy predecessor exactly', async () => {
      await assertPhysicalPredecessor('legacy4', currentRuntimeNames.filter(name => name !== 'worktree-snapshot-contract.mjs'));
    });
    await t.test('TEST-RIC-004B / REQ-RIC-002 AC-RIC-002-01..03; REQ-RIC-003 AC-RIC-003-04 / INTENT-RIC-PRIOR-NEW5: real install backs up and restores a physical current predecessor exactly', async () => {
      await assertPhysicalPredecessor('current5', currentRuntimeNames);
    });
    await t.test('TEST-RIC-005A / REQ-RIC-002 AC-RIC-002-01 / INTENT-RIC-PRIOR-INVALID: a wrong-type physical runtime predecessor fails without normalization or overwrite', async () => {
      try {
        await clearRuntimeTarget();
        await osBoundary.writeFile(runtimeTarget, Buffer.from('not a runtime directory'), { mode: 0o600 });
        await osBoundary.chown(runtimeTarget, 0, 0); await osBoundary.chmod(runtimeTarget, 0o600);
        await assertRuntimeRejection(() => hostInstaller.install(plan), /DIRECTORY_CONTENT_MISMATCH|SOURCE_INVALID|BACKUP_MISMATCH/, 'wrong-type predecessor is not converted to a current runtime source');
        assert.deepEqual(await osBoundary.readFile(runtimeTarget), Buffer.from('not a runtime directory'), 'wrong-type predecessor bytes remain unnormalized after rejection');
      } finally {
        await resetRuntimeFixture();
      }
    });
    await t.test('TEST-RIC-005B / REQ-RIC-002 AC-RIC-002-01 / INTENT-RIC-PRIOR-INVALID: child ENOENT after a present target is an error, never ABSENT', async () => {
      try {
        const legacyNames = currentRuntimeNames.filter(name => name !== 'worktree-snapshot-contract.mjs');
        await prepareRuntimePredecessor(legacyNames);
        const preimage = await snapshotPaths([runtimeTarget]);
        const child = path.join(runtimeTarget, legacyNames[0]);
        const error = new Error('injected present-child ENOENT'); error.code = 'ENOENT';
        injectedLstatErrors.set(translate(child), error);
        await assertRuntimeRejection(() => hostInstaller.install(plan), error => error?.code === 'ENOENT' || /BACKUP_MISMATCH|DIRECTORY_CONTENT_MISMATCH/.test(String(error?.message ?? '')), 'a child read failure after target presence cannot relabel the predecessor ABSENT', { clearInjectionsBeforeAfter: true, preimage });
        assert.deepEqual((await readdir(translate(runtimeTarget))).sort(), legacyNames.sort(), 'present predecessor inventory remains after child ENOENT rejection');
      } finally {
        await resetRuntimeFixture();
      }
    });
    await t.test('TEST-RIC-005C / REQ-RIC-002 AC-RIC-002-01 / INTENT-RIC-PRIOR-INVALID: mixed predecessor inventory fails without overwrite', async () => {
      try {
        const legacyNames = currentRuntimeNames.filter(name => name !== 'worktree-snapshot-contract.mjs');
        await prepareRuntimePredecessor(legacyNames);
        const extra = path.join(runtimeTarget, 'unexpected.mjs');
        await osBoundary.writeFile(extra, Buffer.from('unexpected'), { mode: 0o644 }); await osBoundary.chown(extra, 0, 0); await osBoundary.chmod(extra, 0o644);
        await assertRuntimeRejection(() => hostInstaller.install(plan), /DIRECTORY_CONTENT_MISMATCH|BACKUP_MISMATCH/, 'mixed predecessor inventory cannot be normalized to current runtime');
        assert.equal((await readdir(translate(runtimeTarget))).includes('unexpected.mjs'), true, 'rejection preserves the invalid predecessor for manual inspection');
      } finally { await resetRuntimeFixture(); }
    });
    await t.test('TEST-RIC-005D / REQ-RIC-002 AC-RIC-002-01 / INTENT-RIC-PRIOR-INVALID: unsafe predecessor child authority fails without overwrite', async () => {
      try {
        const legacyNames = currentRuntimeNames.filter(name => name !== 'worktree-snapshot-contract.mjs');
        await prepareRuntimePredecessor(legacyNames);
        const child = path.join(runtimeTarget, legacyNames[0]);
        owners.set(translate(child), { uid: 501, gid: 20 });
        await assertRuntimeRejection(() => hostInstaller.install(plan), /AUTHORITY_FILE_INVALID|BACKUP_MISMATCH/, 'unsafe predecessor authority cannot be normalized to current runtime');
        assert.deepEqual(owners.get(translate(child)), { uid: 501, gid: 20 }, 'rejection leaves unsafe predecessor authority observable');
      } finally { await resetRuntimeFixture(); }
    });
    await t.test('TEST-RIC-005E / REQ-RIC-002 AC-RIC-002-01 / INTENT-RIC-PRIOR-INVALID: linked predecessor child fails without overwrite', async () => {
      try {
        const legacyNames = currentRuntimeNames.filter(name => name !== 'worktree-snapshot-contract.mjs');
        await prepareRuntimePredecessor(legacyNames);
        const child = path.join(runtimeTarget, legacyNames[0]);
        await osBoundary.rm(child, { force: true }); await symlink(path.join(runtimeSource, legacyNames[0]), translate(child));
        await assertRuntimeRejection(() => hostInstaller.install(plan), /SYMLINK_FORBIDDEN|DIRECTORY_CONTENT_MISMATCH|BACKUP_MISMATCH/, 'linked physical predecessor cannot be normalized or overwritten');
        assert.equal((await lstat(translate(child))).isSymbolicLink(), true, 'rejection preserves the linked predecessor child for inspection');
      } finally { await resetRuntimeFixture(); }
    });
    await t.test('TEST-RIC-005F / REQ-RIC-002 AC-RIC-002-01 / INTENT-RIC-PRIOR-INVALID: missing predecessor child fails without ABSENT relabel', async () => {
      try {
        const legacyNames = currentRuntimeNames.filter(name => name !== 'worktree-snapshot-contract.mjs');
        await prepareRuntimePredecessor(legacyNames);
        await osBoundary.rm(path.join(runtimeTarget, legacyNames[0]), { force: true });
        await assertRuntimeRejection(() => hostInstaller.install(plan), /DIRECTORY_CONTENT_MISMATCH|ENOENT|BACKUP_MISMATCH/, 'missing child on a present runtime cannot relabel the target ABSENT');
        assert.equal((await readdir(translate(runtimeTarget))).includes(legacyNames[0]), false, 'rejection preserves the observed missing-child predecessor state');
      } finally { await resetRuntimeFixture(); }
    });
    await t.test('TEST-RIC-005G / REQ-RIC-002 AC-RIC-002-01 / INTENT-RIC-PRIOR-INVALID: unreadable predecessor bytes fail without overwrite', async () => {
      try {
        const legacyNames = currentRuntimeNames.filter(name => name !== 'worktree-snapshot-contract.mjs');
        await prepareRuntimePredecessor(legacyNames);
        const child = path.join(runtimeTarget, legacyNames[0]);
        const originalBytes = await osBoundary.readFile(child);
        injectedReadResults.set(translate(child), () => { const error = new Error('injected unreadable predecessor'); error.code = 'EACCES'; throw error; });
        await assertRuntimeRejection(() => hostInstaller.install(plan), error => error?.code === 'EACCES' || /BACKUP_MISMATCH/.test(String(error?.message ?? '')), 'unreadable present predecessor bytes cannot be normalized or overwritten', { clearInjectionsBeforeAfter: true });
        assert.deepEqual(await osBoundary.readFile(child), originalBytes, 'rejection preserves the unreadable predecessor physical bytes for manual recovery');
      } finally { await resetRuntimeFixture(); }
    });

    const createTestOwnedLegacyManifest = async testId => {
      const legacyNames = currentRuntimeNames.filter(name => name !== 'worktree-snapshot-contract.mjs');
      const manifestRoot = `/private/var/db/juanerai/change-coordinator-install-backups/${testId}`;
      const runtimeBackupDirectory = path.join(manifestRoot, sha256(Buffer.from(runtimeTarget)));
      await osBoundary.mkdir(runtimeBackupDirectory, { recursive: true, mode: 0o700 });
      const directoryFiles = await Promise.all(legacyNames.map(async name => {
        const bytes = await readFile(path.join(runtimeSource, name));
        const backupPath = path.join(runtimeBackupDirectory, name);
        await osBoundary.writeFile(backupPath, bytes, { mode: 0o600 });
        await osBoundary.chown(backupPath, 0, 0); await osBoundary.chmod(backupPath, 0o600);
        return { name, backup_path: backupPath, sha256: sha256(bytes), mode: 0o644, uid: 0, gid: 0, acl_sha256: sha256(Buffer.from('[]')) };
      }));
      const manifest = {
        schema_version: '1.0', installation_id: testId, created_at: '2026-09-12T00:00:00.000Z',
        service_label: 'com.juanerai.change-coordinator', preserves: [...installer.ROLLBACK_PRESERVES],
        prior: [{ target: runtimeTarget, present: true, type: 'directory', backup_path: null, sha256: null,
          directory_files: directoryFiles, uid: 0, gid: 0, mode: 0o755, acl_sha256: sha256(Buffer.from('[]')) }],
      };
      const manifestPath = path.join(manifestRoot, 'manifest.json');
      const writeManifest = async value => {
        const bytes = Buffer.from(canonicalJson(value));
        await osBoundary.writeFile(manifestPath, bytes, { mode: 0o600 });
        return sha256(bytes);
      };
      return { legacyNames, manifestRoot, manifestPath, manifest, writeManifest };
    };
    const rollbackTestManifest = async fixture => hostInstaller.rollback({
      manifest_path: fixture.manifestPath, manifest_sha256: await fixture.writeManifest(fixture.manifest),
      revocation_receipt_sha256: '0'.repeat(64), emergency_pre_activation: true,
    });
    await t.test('TEST-RIC-006A / REQ-RIC-003 AC-RIC-003-01,04 / INTENT-RIC-MANIFEST-NAMES: Test-owned legal legacy manifest is the positive rollback control', async () => {
      try {
        const fixture = await createTestOwnedLegacyManifest('test-ric-006a');
        await assert.doesNotReject(() => rollbackTestManifest(fixture), 'control: existing-format legal legacy manifest restores exactly its declared inventory');
        assert.deepEqual((await readdir(translate(runtimeTarget))).sort(), [...fixture.legacyNames].sort(), 'control restores exactly the legal legacy inventory');
        const restoredDirectory = await ownerStat(runtimeTarget);
        assert.deepEqual({ uid: restoredDirectory.uid, gid: restoredDirectory.gid, mode: restoredDirectory.mode & 0o777, acl_sha256: await observedEmptyAclSha256(runtimeTarget) }, { uid: 0, gid: 0, mode: 0o755, acl_sha256: fixture.manifest.prior[0].acl_sha256 }, 'control restores declared directory authority and observed empty ACL');
        for (const file of fixture.manifest.prior[0].directory_files) {
          const restored = await ownerStat(path.join(runtimeTarget, file.name));
          assert.deepEqual(await osBoundary.readFile(path.join(runtimeTarget, file.name)), await osBoundary.readFile(file.backup_path), `control restores exact Test-owned backup bytes for ${file.name}`);
          assert.deepEqual({ uid: restored.uid, gid: restored.gid, mode: restored.mode & 0o777, acl_sha256: await observedEmptyAclSha256(path.join(runtimeTarget, file.name)) }, { uid: file.uid, gid: file.gid, mode: file.mode, acl_sha256: file.acl_sha256 }, `control restores declared metadata and observed empty ACL authority for ${file.name}`);
        }
      } finally { await resetRuntimeFixture(); }
    });
    await t.test('TEST-RIC-006B / RED-RIC-002 / REQ-RIC-003 AC-RIC-003-02 / INTENT-RIC-MANIFEST-SOURCE: same bytes outside the derived runtime backup path are rejected', async () => {
      try {
        const fixture = await createTestOwnedLegacyManifest('test-ric-006b');
        const source = fixture.manifest.prior[0].directory_files.find(file => file.name === 'coordinator.mjs');
        const outsidePath = path.join(fixture.manifestRoot, 'same-bytes-outside-derived-runtime-backup', source.name);
        await osBoundary.mkdir(path.dirname(outsidePath), { recursive: true, mode: 0o700 });
        await osBoundary.writeFile(outsidePath, await osBoundary.readFile(source.backup_path), { mode: 0o600 });
        await osBoundary.chown(outsidePath, 0, 0); await osBoundary.chmod(outsidePath, 0o600);
        assert.equal(source.backup_path, path.join(fixture.manifestRoot, sha256(Buffer.from(runtimeTarget)), source.name), 'oracle confirms the original manifest path is derived from this manifest root, target, and name');
        assert.equal(sha256(await osBoundary.readFile(outsidePath)), source.sha256, 'oracle confirms substituted bytes have the recorded hash');
        source.backup_path = outsidePath;
        const replacementsBefore = runtimeReplacementCount;
        let rejection = null;
        try { await rollbackTestManifest(fixture); } catch (error) { rejection = error; }
        assert.deepEqual({ rejected: rejection !== null, runtime_replacements: runtimeReplacementCount - replacementsBefore }, { rejected: true, runtime_replacements: 0 },
          'RED-RIC-002: source identity rejects before runtime replacement, rather than accepting same-content external input');
        assert.match(rejection.message, /BACKUP_MISMATCH|MANIFEST_INVALID/);
      } finally { await resetRuntimeFixture(); }
    });
    await t.test('TEST-RIC-006C / REQ-RIC-003 AC-RIC-003-01 / INTENT-RIC-MANIFEST-NAMES: duplicate manifest names are rejected before successful restore', async () => {
      try {
        const fixture = await createTestOwnedLegacyManifest('test-ric-006c');
        fixture.manifest.prior[0].directory_files[1].name = fixture.manifest.prior[0].directory_files[0].name;
        const replacementsBefore = runtimeReplacementCount; let rejection = null;
        try { await rollbackTestManifest(fixture); } catch (error) { rejection = error; }
        assert.deepEqual({ rejected: rejection !== null, runtime_replacements: runtimeReplacementCount - replacementsBefore }, { rejected: true, runtime_replacements: 0 }, 'duplicate names cannot satisfy a same-count inventory check or reach replacement');
        assert.match(rejection.message, /BACKUP_MISMATCH|MANIFEST_INVALID/);
      } finally { await resetRuntimeFixture(); }
    });
    await t.test('TEST-RIC-006F / REQ-RIC-003 AC-RIC-003-01 / INTENT-RIC-MANIFEST-NAMES: same-count renamed manifest member is rejected before runtime replacement', async () => {
      try {
        const fixture = await createTestOwnedLegacyManifest('test-ric-006f');
        fixture.manifest.prior[0].directory_files[1].name = 'renamed-member.mjs';
        const replacementsBefore = runtimeReplacementCount; let rejection = null;
        try { await rollbackTestManifest(fixture); } catch (error) { rejection = error; }
        assert.deepEqual({ rejected: rejection !== null, runtime_replacements: runtimeReplacementCount - replacementsBefore }, { rejected: true, runtime_replacements: 0 }, 'a same-count wrong member name cannot satisfy exact manifest inventory or reach replacement');
        assert.match(rejection.message, /BACKUP_MISMATCH|MANIFEST_INVALID/);
      } finally { await resetRuntimeFixture(); }
    });
    await t.test('TEST-RIC-006D / REQ-RIC-003 AC-RIC-003-03 / INTENT-RIC-MANIFEST-BYTES: backup byte drift is rejected before staging', async () => {
      try {
        const fixture = await createTestOwnedLegacyManifest('test-ric-006d');
        const file = fixture.manifest.prior[0].directory_files[0];
        await osBoundary.writeFile(file.backup_path, Buffer.from('drifted backup bytes'), { mode: 0o600 });
        await assert.rejects(() => rollbackTestManifest(fixture), /BACKUP_MISMATCH/, 'recorded hash without actual admitted backup bytes cannot restore');
      } finally { await resetRuntimeFixture(); }
    });
    await t.test('TEST-RIC-006E / REQ-RIC-003 AC-RIC-003-03,04 / INTENT-RIC-MANIFEST-BYTES: restored target readback drift cannot report rollback success', async () => {
      try {
        const fixture = await createTestOwnedLegacyManifest('test-ric-006e');
        const target = translate(path.join(runtimeTarget, fixture.legacyNames[0]));
        injectedReadResults.set(target, () => Buffer.from('drifted restored target bytes'));
        await assert.rejects(() => rollbackTestManifest(fixture), /ARTIFACT_MODE_MISMATCH|READBACK_MISMATCH|BACKUP_MISMATCH/, 'restored target bytes must equal the recorded hash on readback');
      } finally { await resetRuntimeFixture(); }
    });
    await t.test('TEST-RIC-007 / REQ-RIC-003 AC-RIC-003-04 / INTENT-RIC-PRIOR-ABSENT: ambiguous absence readback cannot return rolled_back true', async () => {
      try {
        const manifestRoot = '/private/var/db/juanerai/change-coordinator-install-backups/test-ric-007';
        const manifestPath = path.join(manifestRoot, 'manifest.json');
        const manifest = { schema_version: '1.0', installation_id: 'test-ric-007', created_at: '2026-09-12T00:00:00.000Z', service_label: 'com.juanerai.change-coordinator', preserves: [...installer.ROLLBACK_PRESERVES], prior: [{ target: runtimeTarget, present: false, type: null, backup_path: null, sha256: null, uid: null, gid: null, mode: null, acl_sha256: null }] };
        const bytes = Buffer.from(canonicalJson(manifest));
        await osBoundary.mkdir(manifestRoot, { recursive: true, mode: 0o700 }); await osBoundary.writeFile(manifestPath, bytes, { mode: 0o600 });
        const error = new Error('injected ambiguous absence readback'); error.code = 'EACCES';
        injectedLstatErrors.set(translate(runtimeTarget), error);
        await assert.rejects(() => hostInstaller.rollback({ manifest_path: manifestPath, manifest_sha256: sha256(bytes), revocation_receipt_sha256: '0'.repeat(64), emergency_pre_activation: true }), error => error?.code === 'EACCES' || /BACKUP_MISMATCH|READBACK_MISMATCH/.test(String(error?.message ?? '')), 'ABSENT requires an actual exact-target ENOENT readback and accepts either structured OS failure or existing backup/readback normalization');
      } finally { await resetRuntimeFixture(); }
    });

    await t.test('TEST-RIC-PROTECTION / REQ-RIC-004 AC-RIC-004-01,02 / INTENT-RIC-PROTECTION: retained Git, service, socket, authority, and evidence controls', async () => {
    const gitFile = path.join(gitSource, 'git');
    const gitTargetFile = path.join(gitTarget, 'git');
    const originalGit = await readFile(gitFile);

    await rm(gitFile);
    await assert.rejects(() => hostInstaller.install(plan), /ENOENT|SOURCE_INVALID|DIRECTORY_CONTENT_MISMATCH/, 'missing pinned artifact fails closed');
    await writeFile(gitFile, originalGit);

    await writeFile(gitFile, Buffer.from('wrong git bytes'));
    await assert.rejects(() => hostInstaller.install(plan), /ARTIFACT_HASH_MISMATCH/, 'wrong executable bytes fail closed');
    await writeFile(gitFile, originalGit);

    await rm(gitFile);
    await symlink('/Users/huangbo/Dev/Env/homebrew/bin/git', gitFile);
    await assert.rejects(() => hostInstaller.install(plan), /SOURCE_SYMLINK_FORBIDDEN/, 'symlinked source artifact fails closed');
    await rm(gitFile);
    await writeFile(gitFile, originalGit);

    await mkdir(path.dirname(translate(gitTarget)), { recursive: true });
    await symlink(gitSource, translate(gitTarget), 'dir');
    await assert.rejects(() => hostInstaller.install(plan), /SYMLINK_FORBIDDEN/, 'symlinked installed directory fails closed');
    await rm(translate(gitTarget));

    modeOverrides.set(translate(gitTargetFile), 0o777);
    await assert.rejects(() => hostInstaller.install(plan), /ARTIFACT_MODE_MISMATCH/, 'writable installed executable mode fails readback');
    modeOverrides.delete(translate(gitTargetFile));

    aclGrantTarget = gitTargetFile;
    await assert.rejects(() => hostInstaller.install(plan), /ACL_WRITE_GRANT_FORBIDDEN/, 'write ACL on an installed artifact fails closed');
    aclGrantTarget = null;

    effectiveWriteAllowedTarget = gitTargetFile;
    await assert.rejects(() => hostInstaller.install(plan), /EFFECTIVE_WRITE_ALLOWED/, 'effective runtime write permission fails closed');
    effectiveWriteAllowedTarget = null;

    const priorArtifacts = [
      { directory: gitTarget, name: 'git', bytes: Buffer.from('prior git'), mode: 0o711 },
      { directory: gettextTarget, name: 'libintl.8.dylib', bytes: Buffer.from('prior gettext'), mode: 0o440 },
      { directory: pcre2Target, name: 'libpcre2-8.0.dylib', bytes: Buffer.from('prior pcre2'), mode: 0o400 },
    ];
    for (const artifact of priorArtifacts) {
      const directory = translate(artifact.directory);
      const file = path.join(directory, artifact.name);
      await mkdir(directory, { recursive: true });
      await writeFile(file, artifact.bytes);
      await chmod(directory, 0o755); await chmod(file, artifact.mode);
      owners.set(directory, { uid: 0, gid: 0 }); owners.set(file, { uid: 0, gid: 0 });
    }
    bootstrapFailure = true;
    await assert.rejects(() => hostInstaller.install(plan), /SERVICE_LOAD_FAILED/, 'a late host failure rolls the whole pinned Git closure back');
    bootstrapFailure = false;
    assert.deepEqual(runtimeDirectoryReadbacks, [{ isDirectory: true, uid: 0, gid: 0, mode: 0o755 }],
      'CAUSAL_RED: installer creates and root-governs /private/var/run/juanerai before service load without external pre-creation');
    assert.equal(aclReadbackTargets.has(runtimeDirectoryTarget), true, 'runtime directory ACL is read back before activation');
    assert.equal(effectiveWriteDenials.has(runtimeDirectoryTarget), true, 'runtime user cannot write the root-owned runtime directory');
    await assert.rejects(() => ownerStat(runtimeDirectoryTarget), { code: 'ENOENT' },
      'rollback deletes the installer-created runtime directory when it was originally absent');
    for (const artifact of priorArtifacts) {
      const file = path.join(translate(artifact.directory), artifact.name);
      const stat = await ownerStat(path.join(artifact.directory, artifact.name));
      assert.deepEqual(await readFile(file), artifact.bytes, `rollback restores exact prior bytes for ${artifact.name}`);
      assert.deepEqual({ uid: stat.uid, gid: stat.gid, mode: stat.mode & 0o777 }, { uid: 0, gid: 0, mode: artifact.mode });
    }

    await mkdir(runtimeDirectoryPath, { recursive: true });
    await chmod(runtimeDirectoryPath, 0o711);
    owners.set(runtimeDirectoryPath, { uid: 0, gid: 0 });
    runtimeDirectoryReadbacks.length = 0;
    bootstrapFailure = true;
    await assert.rejects(() => hostInstaller.install(plan), /SERVICE_LOAD_FAILED/,
      'a late host failure rolls a pre-existing runtime directory back');
    bootstrapFailure = false;
    assert.deepEqual(runtimeDirectoryReadbacks, [{ isDirectory: true, uid: 0, gid: 0, mode: 0o755 }],
      'pre-existing runtime directory is governed before service load');
    const restoredRuntimeDirectory = await ownerStat(runtimeDirectoryTarget);
    assert.deepEqual(
      { isDirectory: restoredRuntimeDirectory.isDirectory(), uid: restoredRuntimeDirectory.uid,
        gid: restoredRuntimeDirectory.gid, mode: restoredRuntimeDirectory.mode & 0o777 },
      { isDirectory: true, uid: 0, gid: 0, mode: 0o711 },
      'rollback restores the exact prior runtime directory owner and mode',
    );
    assert.deepEqual(await readdir(runtimeDirectoryPath), [], 'rollback restores the prior empty runtime directory inventory');
    await rm(runtimeDirectoryPath, { recursive: true, force: true });
    owners.delete(runtimeDirectoryPath);
    await assert.rejects(() => ownerStat(runtimeDirectoryTarget), { code: 'ENOENT' },
      'success path begins with no externally pre-created runtime directory');
    runtimeDirectoryReadbacks.length = 0;
    socketScenario = 'exact';
    socketIsSocket = true; socketUid = 0; socketGid = plan.runtime_gid; socketMode = 0o660;
    socketReadbackAmbiguous = false; socketAppearanceError = null; readinessMutationObserved = false;
    const bootstrapCallsBeforeSuccess = launchctlCalls.filter(args => args[0] === 'bootstrap').length;
    let receipt;
    await assert.doesNotReject(async () => { receipt = await hostInstaller.install(plan); },
      'CAUSAL_RED: installer waits read-only for the asynchronously appearing socket instead of exposing immediate lstat failure');
    assert.equal(launchctlCalls.filter(args => args[0] === 'bootstrap').length - bootstrapCallsBeforeSuccess, 1,
      'Socket readiness never retries launchctl bootstrap');
    assert.equal(readinessMutationObserved, false, 'Socket readiness performs only readback while waiting');
    assert.equal(socketAppearanceError, null, 'test-owned asynchronous socket appearance succeeds');
    assert.equal((await ownerStat(runtimeTarget)).isDirectory(), true, 'runtime install target is a directory, never one renamed file');
    for (const name of ['host-loop.mjs', 'production.mjs', 'coordinator.mjs', 'adapters.mjs']) {
      assert.deepEqual(await readFile(path.join(translate(runtimeTarget), name)), await readFile(path.join(runtimeSource, name)));
    }
    const cliStat = await ownerStat(cliTarget);
    assert.equal(cliStat.isFile(), true);
    assert.equal(cliStat.mode & 0o777, 0o755, 'installed transport client is executable');
    assert.deepEqual(await readFile(path.join(translate(stateTarget), 'active-change.json')), emptyPointer,
      'fresh state root begins with the one canonical empty active pointer');
    assert.equal(receipt.installed.some(value => value.target === runtimeTarget), true);
    for (const artifact of [installer.PINNED_GIT_INSTALL.executable, ...installer.PINNED_GIT_INSTALL.libraries]) {
      const target = path.join(translate(artifact.target_directory), artifact.name);
      const stat = await ownerStat(path.join(artifact.target_directory, artifact.name));
      assert.equal(sha256(await readFile(target)), artifact.sha256);
      assert.deepEqual({ uid: stat.uid, gid: stat.gid, mode: stat.mode & 0o777 }, { uid: 0, gid: 0, mode: artifact.mode });
      assert.equal(effectiveWriteDenials.has(path.join(artifact.target_directory, artifact.name)), true);
    }
    const manifest = JSON.parse((await osBoundary.readFile(receipt.manifest_path)).toString('utf8'));
    const traversalReadback = await Promise.all(traversalTargets.map(async target => {
      const prior = manifest.prior.find(value => value.target === target);
      return {
        target,
        backed_up: Boolean(prior),
        prior_owner: prior ? [prior.uid, prior.gid] : null,
        prior_mode: prior?.mode ?? null,
        owner_after: owners.has(translate(target)) ? [owners.get(translate(target)).uid, owners.get(translate(target)).gid] : null,
        mode_after: modeOverrides.get(translate(target)) ?? ((await ownerStat(target)).mode & 0o777),
        acl_read_back: aclReadbackTargets.has(target),
        effective_write_denied: effectiveWriteDenials.has(target),
        granted_acl: aclEntries.get(target) ?? null,
      };
    }));
    assert.deepEqual(traversalReadback, traversalTargets.map(target => ({
      target,
      backed_up: true,
      prior_owner: [502, 20],
      prior_mode: target === '/Users/huangbo' ? 0o700 : 0o755,
      owner_after: [502, 20],
      mode_after: target === '/Users/huangbo' ? 0o700 : 0o755,
      acl_read_back: true,
      effective_write_denied: true,
      granted_acl: `user:${plan.runtime_user} allow search`,
    })), 'CAUSAL_RED: every fixed-Git ancestor is backed up and read back with unchanged owner/mode plus only runtime search traversal');
    assert.deepEqual(aclMutationCalls.filter(args => args[0] === '+a'),
      traversalTargets.map(target => ['+a', `user:${plan.runtime_user} allow search`, target]),
      'runtime traversal grants search only, never list/read/write/ownership');
    assert.deepEqual(runtimeGitExecutionCalls,
      [['-n', '-u', plan.runtime_user, '/Users/huangbo/Dev/Env/homebrew/bin/git', '--version']],
      'real runtime identity executes the exact frozen Git after traversal authority is installed');
    assert.equal(launchctlCalls.some(args => args[0] === 'bootstrap'), true);
    assert.equal(launchctlCalls.some(args => args[0] === 'print'), true, 'launchd target is started and read back');

    assert.deepEqual(runtimeDirectoryReadbacks, [{ isDirectory: true, uid: 0, gid: 0, mode: 0o755 }],
      'install succeeds from an absent runtime directory because installer prepares it before service load');
    const runtimeDirectoryStat = await ownerStat(runtimeDirectoryTarget);
    assert.deepEqual(
      { isDirectory: runtimeDirectoryStat.isDirectory(), uid: runtimeDirectoryStat.uid,
        gid: runtimeDirectoryStat.gid, mode: runtimeDirectoryStat.mode & 0o777 },
      { isDirectory: true, uid: 0, gid: 0, mode: 0o755 },
    );
    assert.equal(aclReadbackTargets.has(runtimeDirectoryTarget), true);
    assert.equal(effectiveWriteDenials.has(runtimeDirectoryTarget), true);
    const socketStat = await ownerStat(socketTarget);
    assert.deepEqual({ uid: socketStat.uid, gid: socketStat.gid, mode: socketStat.mode & 0o777 }, { uid: 0, gid: 20, mode: 0o660 });
    assert.equal(effectiveWriteDenials.has(stateTarget), true, 'runtime client cannot write Coordinator state');
    assert.equal(effectiveWriteDenials.has(trustTarget), true, 'runtime client cannot write Controller trust');

    await hostInstaller.rollback({
      manifest_path: receipt.manifest_path, manifest_sha256: receipt.manifest_sha256,
      revocation_receipt_sha256: '0'.repeat(64), emergency_pre_activation: true,
    });
    assert.deepEqual(await Promise.all(traversalTargets.map(async target => ({
      target,
      acl: aclEntries.get(target) ?? null,
      owner: [owners.get(translate(target)).uid, owners.get(translate(target)).gid],
      mode: (await ownerStat(target)).mode & 0o777,
    }))), traversalTargets.map(target => ({
      target, acl: null, owner: [502, 20], mode: target === '/Users/huangbo' ? 0o700 : 0o755,
    })), 'rollback restores every ancestor ACL, owner, and mode exactly');
    await assert.rejects(() => ownerStat(runtimeDirectoryTarget), { code: 'ENOENT' });
    await assert.rejects(() => ownerStat(socketTarget), { code: 'ENOENT' });

    socketScenario = 'wrong-authority';
    socketIsSocket = false; socketUid = 501; socketGid = 0; socketMode = 0o666;
    socketReadbackAmbiguous = false; socketAppearanceError = null; readinessMutationObserved = false;
    let bootstrapCallsBeforeFailure = launchctlCalls.filter(args => args[0] === 'bootstrap').length;
    let bootoutCallsBeforeFailure = launchctlCalls.filter(args => args[0] === 'bootout').length;
    await assert.rejects(() => hostInstaller.install(plan), /SOCKET_READBACK_FAILED/,
      'wrong socket type, owner, group, and mode fail closed');
    assert.equal(launchctlCalls.filter(args => args[0] === 'bootstrap').length - bootstrapCallsBeforeFailure, 1);
    assert.equal(launchctlCalls.filter(args => args[0] === 'bootout').length - bootoutCallsBeforeFailure, 2,
      'failed readiness performs one pre-load unload and one rollback unload');
    assert.equal(readinessMutationObserved, false, 'wrong authority is observed read-only before rollback');
    assert.equal(socketAppearanceError, null);
    await assert.rejects(() => ownerStat(runtimeDirectoryTarget), { code: 'ENOENT' }, 'wrong authority triggers rollback');
    await assert.rejects(() => ownerStat(socketTarget), { code: 'ENOENT' }, 'rollback removes wrong socket');

    socketScenario = 'never';
    socketIsSocket = true; socketUid = 0; socketGid = plan.runtime_gid; socketMode = 0o660;
    socketReadbackAmbiguous = false; socketAppearanceError = null; readinessMutationObserved = false;
    bootstrapCallsBeforeFailure = launchctlCalls.filter(args => args[0] === 'bootstrap').length;
    bootoutCallsBeforeFailure = launchctlCalls.filter(args => args[0] === 'bootout').length;
    const neverAppearsStartedAt = Date.now();
    await assert.rejects(() => hostInstaller.install(plan), /SOCKET_READBACK_FAILED/,
      'a socket that never appears fails at the fixed readiness boundary');
    const neverAppearsElapsedMs = Date.now() - neverAppearsStartedAt;
    assert.equal(launchctlCalls.filter(args => args[0] === 'bootstrap').length - bootstrapCallsBeforeFailure, 1);
    assert.equal(launchctlCalls.filter(args => args[0] === 'bootout').length - bootoutCallsBeforeFailure, 2);
    assert.equal(readinessMutationObserved, false, 'missing-socket polling remains read-only until rollback');
    assert.equal(neverAppearsElapsedMs >= 4500 && neverAppearsElapsedMs <= 5500, true,
      `fixed Socket readiness boundary is five seconds, observed ${neverAppearsElapsedMs}ms`);
    await assert.rejects(() => ownerStat(runtimeDirectoryTarget), { code: 'ENOENT' }, 'timeout triggers rollback');
    await assert.rejects(() => ownerStat(socketTarget), { code: 'ENOENT' });

    socketScenario = 'ambiguous';
    socketReadbackAmbiguous = false; socketAppearanceError = null; readinessMutationObserved = false;
    bootstrapCallsBeforeFailure = launchctlCalls.filter(args => args[0] === 'bootstrap').length;
    bootoutCallsBeforeFailure = launchctlCalls.filter(args => args[0] === 'bootout').length;
    await assert.rejects(() => hostInstaller.install(plan), /SOCKET_READBACK_FAILED/,
      'ambiguous socket readback is normalized and fails closed');
    socketReadbackAmbiguous = false;
    assert.equal(launchctlCalls.filter(args => args[0] === 'bootstrap').length - bootstrapCallsBeforeFailure, 1);
    assert.equal(launchctlCalls.filter(args => args[0] === 'bootout').length - bootoutCallsBeforeFailure, 2);
    assert.equal(readinessMutationObserved, false, 'ambiguous readback performs no repair write before rollback');
    await assert.rejects(() => ownerStat(runtimeDirectoryTarget), { code: 'ENOENT' }, 'ambiguous readback triggers rollback');
    await assert.rejects(() => ownerStat(socketTarget), { code: 'ENOENT' });

    const semanticAclEntries = [
      'user:auditor allow readattr',
      'group:operators deny delete',
    ];
    for (const target of traversalTargets) preexistingAclEntries.set(target, [...semanticAclEntries]);
    aclMetadataVariant = true;
    aclWhitespaceVariant = true;
    aclReadCount = 0;
    socketScenario = 'exact';
    socketIsSocket = true; socketUid = 0; socketGid = plan.runtime_gid; socketMode = 0o660;
    socketReadbackAmbiguous = false; socketAppearanceError = null;
    let semanticReceipt = null;
    let semanticError = null;
    try {
      semanticReceipt = await hostInstaller.install(plan);
      await hostInstaller.rollback({
        manifest_path: semanticReceipt.manifest_path, manifest_sha256: semanticReceipt.manifest_sha256,
        revocation_receipt_sha256: '0'.repeat(64), emergency_pre_activation: true,
      });
    } catch (error) {
      semanticError = String(error?.message ?? error);
    }
    const semanticOutcome = {
      error: semanticError,
      entry_order_and_content_preserved: traversalTargets.every(target => (
        JSON.stringify(preexistingAclEntries.get(target)) === JSON.stringify(semanticAclEntries)
      )),
      temporary_entries_removed: traversalTargets.every(target => !aclEntries.has(target)),
    };
    preexistingAclEntries.clear();
    aclEntries.clear();
    aclMetadataVariant = false;
    aclWhitespaceVariant = false;
    aclReadCount = 0;

    const ledgerTarget = '/private/var/db/juanerai/install-attempt-evidence/ledger.jsonl';
    const historyTarget = '/private/var/db/juanerai/install-attempt-evidence/history.bin';
    await mkdir(path.dirname(translate(ledgerTarget)), { recursive: true });
    await writeFile(translate(ledgerTarget), Buffer.from('{"event":"historical"}\n'));
    await writeFile(translate(historyTarget), Buffer.from([0, 255, 17, 34, 51]));
    const installedSnapshotTargets = [...Object.keys(plan.sources), runtimeDirectoryTarget];
    const protectedSnapshotTargets = [
      path.join(stateTarget, 'active-change.json'), ledgerTarget, historyTarget,
    ];
    const installedBeforePartialFailure = await snapshotPaths(installedSnapshotTargets);
    const protectedBeforePartialFailure = await snapshotPaths(protectedSnapshotTargets);
    const serviceBeforePartialFailure = serviceLoaded;
    failAclGrantAt = 2;
    aclGrantAttempt = 0;
    aclMetadataVariant = false;
    aclWhitespaceVariant = false;
    otherAclRemovalAttempted = false;
    socketScenario = 'exact';
    socketReadbackAmbiguous = false; socketAppearanceError = null;
    let partialFailureError = null;
    try {
      await hostInstaller.install(plan);
    } catch (error) {
      partialFailureError = String(error?.message ?? error);
    }
    const installedAfterPartialFailure = await snapshotPaths(installedSnapshotTargets);
    const protectedAfterPartialFailure = await snapshotPaths(protectedSnapshotTargets);
    const partialRollbackOutcome = {
      error: partialFailureError,
      grant_attempts: aclGrantAttempt,
      remaining_temporary_acl_targets: traversalTargets.filter(target => aclEntries.has(target)),
      installed_targets_restored: JSON.stringify(installedAfterPartialFailure) === JSON.stringify(installedBeforePartialFailure),
      state_pointer_ledger_history_byte_exact: JSON.stringify(protectedAfterPartialFailure) === JSON.stringify(protectedBeforePartialFailure),
      service_restored: serviceLoaded === serviceBeforePartialFailure,
      other_acl_removal_attempted: otherAclRemovalAttempted,
    };
    failAclGrantAt = null;
    aclMetadataVariant = false;
    aclWhitespaceVariant = false;

    assert.deepEqual({
      acl_semantic_receipt: semanticOutcome,
      partial_acl_failure_rollback: partialRollbackOutcome,
    }, {
      acl_semantic_receipt: {
        error: null,
        entry_order_and_content_preserved: true,
        temporary_entries_removed: true,
      },
      partial_acl_failure_rollback: {
        error: 'ACL_WRITE_GRANT_FAILED',
        grant_attempts: 2,
        remaining_temporary_acl_targets: [],
        installed_targets_restored: true,
        state_pointer_ledger_history_byte_exact: true,
        service_restored: true,
        other_acl_removal_attempted: false,
      },
    }, 'CAUSAL_RED: ACL receipts ignore volatile metadata while preserving ordered semantics, and every partial traversal grant rolls back without evidence loss');

    const ownershipSource = `${await readRequired(hostLoopPath, 'host socket ownership')}${await readRequired(installerPath, 'installed socket ownership')}`;
    assert.match(ownershipSource, /0o660[\s\S]{0,800}runtime_gid|runtime_gid[\s\S]{0,800}0o660/,
      'CAUSAL_RED: production service must root-own and runtime-group the reachable socket without opening state/trust');
    });
  } finally {
    for (const timer of socketTimers) clearTimeout(timer);
    socketTimers.clear();
    await Promise.all([...socketWrites]);
    await rm(temporary, { recursive: true, force: true });
  }
});

test('TEST-MA-GOV-001 / AC-MA-001-02,03; AC-MA-004-05; AC-MA-008-04,05 / CAN-MA-12,14: D1-A, Global WIP one, one repair, and final authorization stop are durable policy guards', async () => {
  const policyPath = path.join(root, '../../../docs/governance/product-change-execution-policy.md');
  const policy = await readRequired(policyPath, 'Mode Activation execution policy is required');
  assert.match(policy, /D1-A[\s\S]{0,1200}(?:one|1) fresh read-only Product Plan Reviewer/i);
  assert.match(policy, /at most one[\s\S]{0,400}semantic correction[\s\S]{0,400}targeted readback/i);
  assert.match(policy, /no post-DISPATCH Reviewer|does not automatically launch a second Reviewer/i);
  assert.match(policy, /Global WIP[\s\S]{0,160}(?:exactly|=)\s*(?:one|1)/i);
  assert.match(policy, /active-change\.json[\s\S]{0,240}sole/i);
  assert.match(policy, /at most one[\s\S]{0,500}Validator[\s\S]{0,500}automatic repair/i);
  assert.match(policy, /second (?:Validator )?FAIL[\s\S]{0,240}BLOCKED/i);
  assert.match(policy, /ACTIVATION_READY_AWAITING_FIRST_PRODUCT_CHANGE_AUTHORIZATION/);
  assert.doesNotMatch(policy, /(?:GitHub )?(?:Issues|Projects)[\s\S]{0,80}(?:queue|authority)|dispatch(?:es)?\s+(?:the )?next Change/i);
});

test('TEST-MA-CANARY-BOUNDARY / AC-MA-006-03; AC-MA-008-01,03 / CAN-MA-01..14: repository RED does not substitute for real host/provider canaries', async () => {
  const source = await readFile(fileURLToPath(import.meta.url), 'utf8');
  assert.doesNotMatch(source, /spawn\([^\n]*(?:ssh|sudo|gh\b)|execFile\([^\n]*(?:ssh|sudo|gh\b)/, 'repository tests never invoke a real host, sudo, or GitHub provider');
  const secretMarkers = [
    ['BEGIN', 'PRIVATE KEY'].join(' '), ['BEGIN OPENSSH', 'PRIVATE KEY'].join(' '),
    `${['github', 'pat'].join('_')}_`, `${['ghp', 'token'].join('_').slice(0, 4)}`,
  ];
  for (const marker of secretMarkers) assert.equal(source.includes(marker), false, 'no tracked key or token snapshot exists');
});
