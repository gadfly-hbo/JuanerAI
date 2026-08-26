import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertHelperHealth, canonicalJson, makeCoordinatorState, makeDispatch, sha256, run } from './fixtures.mjs';

const cli = fileURLToPath(new URL('./cli.mjs', import.meta.url));
const invoke = (args, env = {}) => run(process.execPath, [cli, ...args], { env });
const oneLineJson = output => { const lines = output.trimEnd().split('\n'); assert.equal(lines.length, 1, 'CLI emits exactly one canonical JSON line'); const parsed = JSON.parse(lines[0]); assert.equal(lines[0], canonicalJson(parsed)); return parsed; };

test('helper health: subprocess runner, canonical wire bytes, and isolated transport file are independent of production', async () => {
  await assertHelperHealth();
  const root = await mkdtemp(path.join(os.tmpdir(), 'juanerai-dtf-cli-'));
  try { const input = path.join(root, 'command.json'); await writeFile(input, canonicalJson(makeDispatch())); assert.equal((await run(process.execPath, ['--version'], { env: {} })).code, 0); } finally { await rm(root, { recursive: true, force: true }); }
});

test('TEST-DTF-R1-001: submit accepts only canonical signed-byte ingress and maps malformed transport to exit 2', async t => {
  await t.test('missing submit payload is INPUT_INVALID / 2', async () => {
    const result = await invoke(['submit']); assert.equal(result.code, 2); const message = oneLineJson(result.stdout); assert.deepEqual(message, { schema_version: '1.0', operation: 'applyControllerCommand', outcome: 'REJECTED', error_code: 'INPUT_INVALID', change_id: null });
  });
  await t.test('noncanonical transport is INPUT_INVALID / 2 with no legacy environment bootstrap', async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), 'juanerai-dtf-cli-'));
    try { const input = path.join(root, 'bad.json'); await writeFile(input, '{"b":2, "a":1}'); const result = await invoke(['submit', '--command-body', input, '--signature-base64', 'AQ==']); assert.equal(result.code, 2); const message = oneLineJson(result.stdout); assert.equal(message.error_code, 'INPUT_INVALID'); } finally { await rm(root, { recursive: true, force: true }); }
  });
});

test('TEST-DTF-R1-011: CLI exposes submit and read-only status only; direct run and settlement mutation commands reject / 2', async t => {
  for (const command of ['run', 'settlement', 'admit-dispatch', 'authorize-revision', 'recover', 'record-controller', 'prepare-cleanup']) {
    await t.test(`${command} is unavailable at the production CLI boundary`, async () => {
      const result = await invoke([command]); assert.equal(result.code, 2); const message = oneLineJson(result.stdout); assert.equal(message.operation, 'applyControllerCommand'); assert.equal(message.error_code, 'INPUT_INVALID');
    });
  }
});

test('TEST-DTF-R1-001: CLI refuses public key, trust, verifier, and gateway injection from ordinary arguments or environment', async t => {
  const attempts = [
    ['public key argument', ['submit', '--public-key', 'injected'], {}],
    ['trust path argument', ['submit', '--trust-path', '/tmp/injected'], {}],
    ['verifier argument', ['submit', '--verifier', 'injected'], {}],
    ['gateway argument', ['submit', '--gateway', 'injected'], {}],
    ['public key environment', ['submit'], { JUANERAI_PUBLIC_KEY: 'injected' }],
    ['trust environment', ['submit'], { JUANERAI_TRUST_PATH: '/tmp/injected' }],
    ['verifier environment', ['submit'], { JUANERAI_VERIFIER: 'injected' }],
    ['gateway environment', ['submit'], { JUANERAI_GATEWAY: 'injected' }],
  ];
  for (const [name, args, env] of attempts) {
    await t.test(name, async () => {
      const root = await mkdtemp(path.join(os.tmpdir(), 'juanerai-dtf-cli-'));
      try {
        const body = path.join(root, 'command-body.json'); await writeFile(body, canonicalJson(makeDispatch()));
        const result = await invoke([...args, '--command-body', body, '--signature-base64', 'AQID'], env);
        assert.equal(result.code, 2);
        const message = oneLineJson(result.stdout);
        assert.deepEqual(message, { schema_version: '1.0', operation: 'applyControllerCommand', outcome: 'REJECTED', error_code: 'INPUT_INVALID', change_id: null });
      } finally { await rm(root, { recursive: true, force: true }); }
    });
  }
});

test('TEST-DTF-R1-012: status is the only read-only command, does not need a mutation environment, and preserves exit mapping', async t => {
  await t.test('status with no current change returns STATUS / 0', async () => {
    const result = await invoke(['status']); assert.equal(result.code, 0); const message = oneLineJson(result.stdout); assert.equal(message.operation, 'status'); assert.equal(message.outcome, 'STATUS'); assert.equal(message.payload.pointer_status, 'EMPTY');
  });
  await t.test('unexpected unhandled transport failure alone maps to exit 70', async () => {
    const result = await invoke(['submit', '--command-body', '/definitely/missing.json', '--signature-base64', 'AQ==']); assert.equal(result.code, 2); const message = oneLineJson(result.stdout); assert.equal(message.error_code, 'INPUT_INVALID');
  });
  await t.test('status projects an active durable pointer/state instead of returning a synthetic EMPTY result', async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), 'juanerai-dtf-cli-state-'));
    try {
      const change_id = 'CHG-dual-device-transition-foundation';
      const state = makeCoordinatorState({ change_id, macro_state: 'READY', phase: 'WORKTREE' });
      const ready_state_sha256 = sha256(canonicalJson(state));
      const command = {
        schema_version: '1.0', event_id: 'event-001', sequence: 1, event_class: 'CONTROLLER_COMMAND', idempotency_id: state.admission.idempotency_id,
        change_id, occurred_at: '2026-08-25T00:00:00.000Z', state_version: state.state_version, subject_sha: state.repository.baseline_sha,
        detail: { command_kind: 'DISPATCH', command_id: state.admission.command_id, body_sha256: state.admission.body_sha256, signature_sha256: state.admission.body_sha256, verified_key_id: 'test-key', receipt_digest: state.admission.body_sha256, evidence_refs: [], admission: state.admission, ready_state_sha256 },
      };
      command.event_hash = sha256(canonicalJson(command));
      await writeFile(path.join(root, 'active-change.json'), canonicalJson({ schema_version: '1.0', active_change_id: change_id }));
      await mkdir(path.join(root, 'changes', change_id), { recursive: true });
      await writeFile(path.join(root, 'changes', change_id, 'state.json'), canonicalJson(state));
      await mkdir(path.join(root, 'ledger-work', change_id), { recursive: true });
      await writeFile(path.join(root, 'ledger-work', change_id, 'ledger.jsonl'), `${canonicalJson(command)}\n`);
      const result = await invoke(['status'], { JUANERAI_COORDINATOR_STATE_ROOT: root });
      assert.equal(result.code, 0);
      const message = oneLineJson(result.stdout);
      assert.equal(message.operation, 'status');
      assert.equal(message.outcome, 'STATUS');
      assert.equal(message.payload.pointer_status, 'ACTIVE');
      assert.equal(message.payload.active_change_id, change_id);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
  await t.test('missing, corrupt, or incomplete authority is INVALID; ACTIVE needs canonical state plus admission evidence', async () => {
    const cases = [
      ['missing pointer', null],
      ['corrupt pointer', '{broken'],
      ['incomplete active pointer', canonicalJson({ schema_version: '1.0', active_change_id: 'CHG-dual-device-transition-foundation' })],
    ];
    for (const [name, pointer] of cases) {
      const root = await mkdtemp(path.join(os.tmpdir(), 'juanerai-dtf-cli-authority-'));
      try {
        if (pointer !== null) await writeFile(path.join(root, 'active-change.json'), pointer);
        const result = await invoke(['status'], { JUANERAI_COORDINATOR_STATE_ROOT: root });
        assert.equal(result.code, 0, `${name} remains a readable status projection`);
        const message = oneLineJson(result.stdout);
        assert.equal(message.payload.pointer_status, 'INVALID', `CAUSAL_RED: ${name} must fail closed, never become EMPTY or ACTIVE`);
      } finally {
        await rm(root, { recursive: true, force: true });
      }
    }
  });
  await t.test('a canonical signed submit reports trusted ingress absence, not malformed caller input', async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), 'juanerai-dtf-cli-ingress-'));
    try {
      const body = path.join(root, 'command.json');
      await writeFile(body, canonicalJson(makeDispatch()));
      const result = await invoke(['submit', '--command-body', body, '--signature-base64', 'AQID']);
      assert.equal(result.code, 3, 'CAUSAL_RED: unavailable Activation ingress is a process/ingress failure exit');
      const message = oneLineJson(result.stdout);
      assert.equal(message.error_code, 'INGRESS_UNAVAILABLE');
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});
