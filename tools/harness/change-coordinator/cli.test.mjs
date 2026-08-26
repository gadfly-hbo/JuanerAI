import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertHelperHealth, canonicalJson, makeDispatch, run } from './fixtures.mjs';

const cli = fileURLToPath(new URL('./cli.mjs', import.meta.url));
const invoke = (args, env = {}) => run(process.execPath, [cli, ...args], { env });
const invokeWithStdin = (args, input, env = {}) => new Promise((resolve, reject) => {
  const child = spawn(process.execPath, [cli, ...args], { env, shell: false });
  let stdout = ''; let stderr = '';
  child.stdout.setEncoding('utf8'); child.stderr.setEncoding('utf8');
  child.stdout.on('data', value => { stdout += value; });
  child.stderr.on('data', value => { stderr += value; });
  child.once('error', reject);
  child.stdin.on('error', error => { if (error?.code !== 'EPIPE') reject(error); });
  child.once('close', (code, signal) => resolve({ code, signal, stdout, stderr }));
  child.stdin.end(input);
});
const oneLineJson = output => { const lines = output.trimEnd().split('\n'); assert.equal(lines.length, 1, 'CLI emits exactly one canonical JSON line'); const parsed = JSON.parse(lines[0]); assert.equal(lines[0], canonicalJson(parsed)); return parsed; };

test('helper health: subprocess runner, canonical wire bytes, and isolated transport file are independent of production', async () => {
  await assertHelperHealth();
  const root = await mkdtemp(path.join(os.tmpdir(), 'juanerai-dtf-cli-'));
  try { const input = path.join(root, 'command.json'); await writeFile(input, canonicalJson(makeDispatch())); assert.equal((await run(process.execPath, ['--version'], { env: {} })).code, 0); } finally { await rm(root, { recursive: true, force: true }); }
});

test('TEST-DTF-R1-001: submit accepts only canonical signed-byte ingress and maps malformed transport to exit 2', async t => {
  await t.test('missing submit payload is INPUT_INVALID / 2', async () => {
    const result = await invokeWithStdin(['submit'], ''); assert.equal(result.code, 2); const message = oneLineJson(result.stdout); assert.deepEqual(message, { schema_version: '1.0', operation: 'applyControllerCommand', outcome: 'REJECTED', error_code: 'INPUT_INVALID', change_id: null });
  });
  await t.test('noncanonical stdin body and legacy file flags are INPUT_INVALID / 2 with no compatibility route', async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), 'juanerai-dtf-cli-'));
    try {
      const input = path.join(root, 'legacy-command.json');
      await writeFile(input, canonicalJson(makeDispatch()));
      const cases = [
        [[], `${canonicalJson({ command_body_base64: Buffer.from('{"b":2, "a":1}').toString('base64'), signature_base64: 'AQ==' })}\n`],
        [['--command-body', input, '--signature-base64', 'AQ=='], ''],
      ];
      for (const [args, stdin] of cases) {
        const result = await invokeWithStdin(['submit', ...args], stdin);
        assert.equal(result.code, 2);
        const message = oneLineJson(result.stdout);
        assert.equal(message.error_code, 'INPUT_INVALID');
      }
    } finally { await rm(root, { recursive: true, force: true }); }
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
  const frame = `${canonicalJson({
    command_body_base64: Buffer.from(canonicalJson(makeDispatch())).toString('base64'),
    signature_base64: 'AQID',
  })}\n`;
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
      const result = await invokeWithStdin(args, frame, env);
      assert.equal(result.code, 2);
      const message = oneLineJson(result.stdout);
      assert.deepEqual(message, { schema_version: '1.0', operation: 'applyControllerCommand', outcome: 'REJECTED', error_code: 'INPUT_INVALID', change_id: null });
    });
  }
});

test('TEST-DTF-R1-012: status is read-only fixed-socket transport and preserves fail-closed exit mapping', async t => {
  await t.test('status with no body reaches the fixed socket and unavailable transport exits 70 without fabricated status', async () => {
    const result = await invokeWithStdin(['status'], '');
    assert.equal(result.code, 70, 'EXPECTED_RED: current status still bypasses the socket and synthesizes local state');
    assert.doesNotMatch(`${result.stdout}${result.stderr}`, /STATUS|ACTIVE|EMPTY|APPLIED|ADVANCED|CLOSED/, 'transport failure cannot fabricate Coordinator state or progress');
  });
  await t.test('status rejects state-root and socket-path injection before transport', async () => {
    const attempts = [
      [['status', '--state-root', '/tmp/injected'], '', {}],
      [['status'], '', { JUANERAI_COORDINATOR_STATE_ROOT: '/tmp/injected-state' }],
      [['status'], '', { JUANERAI_COORDINATOR_SOCKET: '/tmp/injected.sock' }],
    ];
    for (const [args, stdin, env] of attempts) {
      const result = await invokeWithStdin(args, stdin, env);
      assert.equal(result.code, 2);
      const message = oneLineJson(result.stdout);
      assert.equal(message.error_code, 'INPUT_INVALID');
    }
  });
});

test('TEST-MA-CLI-001 / AC-MA-003-03,05 / CAN-MA-14: submit is one bounded canonical stdin frame and unavailable socket cannot fabricate progress', async t => {
  const commandBody = canonicalJson(makeDispatch());
  const frame = canonicalJson({
    command_body_base64: Buffer.from(commandBody).toString('base64'),
    signature_base64: Buffer.from([1, 2, 3]).toString('base64'),
  });

  await t.test('one valid frame reaches the fixed socket boundary instead of legacy file flags', async () => {
    const result = await invokeWithStdin(['submit'], `${frame}\n`);
    assert.equal(result.code, 70, 'EXPECTED_RED: the current CLI still rejects stdin before attempting the Activation socket');
    assert.doesNotMatch(`${result.stdout}${result.stderr}`, /APPLIED|ADVANCED|AWAITING_CONTROLLER|CLOSED/, 'socket absence cannot fabricate Coordinator progress');
  });

  await t.test('extra field, multiple frame, oversized frame, status body, and environment injection reject before transport', async () => {
    const cases = [
      ['extra field', ['submit'], `${canonicalJson({ ...JSON.parse(frame), trust_path: '/tmp/injected' })}\n`, {}],
      ['multiple frame', ['submit'], `${frame}\n${frame}\n`, {}],
      ['oversized frame', ['submit'], `${'x'.repeat(1024 * 1024 + 1)}\n`, {}],
      ['status body', ['status'], `${frame}\n`, {}],
      ['socket environment', ['submit'], `${frame}\n`, { JUANERAI_COORDINATOR_SOCKET: '/tmp/injected.sock' }],
      ['state environment', ['submit'], `${frame}\n`, { JUANERAI_COORDINATOR_STATE_ROOT: '/tmp/injected-state' }],
    ];
    for (const [name, args, input, env] of cases) {
      const result = await invokeWithStdin(args, input, env);
      assert.equal(result.code, 2, `${name} is INPUT_INVALID before socket/state access`);
      const message = oneLineJson(result.stdout);
      assert.equal(message.error_code, 'INPUT_INVALID');
    }
  });
});

test('TEST-MA-CLI-002 / AC-MA-003-03 / CAN-MA-05,14: CLI source is transport-only and cannot import composition or open mutation state', async () => {
  const source = await readFile(cli, 'utf8');
  assert.doesNotMatch(source, /(?:from\s+['"]\.\/(?:production|coordinator)\.mjs|import\(['"]\.\/(?:production|coordinator)\.mjs)/, 'CLI must not import production composition or Coordinator Core');
  assert.doesNotMatch(source, /JUANERAI_COORDINATOR_STATE_ROOT|active-change\.json|state\.json|ledger-work|--command-body|--signature-base64/, 'EXPECTED_RED: the current CLI still opens Foundation state and accepts legacy file/argv framing');
  assert.doesNotMatch(source, /\b(?:run|settlement)\s*\(/, 'CLI cannot expose mutation mechanics');
});
