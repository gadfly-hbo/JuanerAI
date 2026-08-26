import test from 'node:test';
import assert from 'node:assert/strict';
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
    const loop = host.createTrustedHostLoop({
      coordinator: {
        async applyControllerCommand() { return { outcome: 'AGENT_ACTION', change_id: 'CHG-mode-activation', state_version: 1, state_hash: 'state-1', payload: { action } }; },
        async run() { throw new Error('UNREACHABLE'); },
        async settlement() { return { outcome: 'WAITING' }; },
        async status() { return { outcome: 'WAITING' }; },
      },
      async durable_route() { return null; },
      async launch_agent() { throw new Error('UNREACHABLE'); },
      async read_artifact() { throw new Error('UNREACHABLE'); },
      async inventory_paths() { throw new Error('UNREACHABLE'); },
    });
    await assert.rejects(() => loop.submit(frame), /MANUAL_CONTROLLER_STOP/,
      'CAUSAL_RED: a restarted process cannot translate a missing in-process route into START_FAILED/default progress');
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

test('TEST-MA-LEDGER-001 / AC-MA-005-02,04; AC-MA-006-01,02,04 / CAN-MA-07,08,14: Evidence append and product push use exact refs, keys, and remote readback identity', async () => {
  const production = await loadRequired(productionPath, ['EVIDENCE_REF', 'GITHUB_CREDENTIAL_POLICY'], 'production Evidence transport is required');
  assert.equal(production.EVIDENCE_REF, 'refs/heads/evidence/agent-runs');
  const source = await readRequired(productionPath, 'production Ledger and branch transport source');
  const sshSource = source.slice(source.indexOf('function gitTransportArguments'), source.indexOf('function createBranchTransport'));
  const branchSource = source.slice(source.indexOf('function createBranchTransport'), source.indexOf('export function createPurposeBoundGitHubAdapters'));
  const predecessorSource = branchSource.slice(branchSource.indexOf('const prior ='), branchSource.indexOf('if (prior.code'));
  const mainSyncSource = source.slice(source.indexOf('function createPurposeBoundMainSync'), source.indexOf('function createLedgerGateway'));
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
    '/private/var/db/juanerai/change-coordinator', '/private/var/run/juanerai/change-coordinator.sock',
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
    no_binary_rewrite_or_ambient_dependency: !/(?:install_name_tool|brew\s+install|DYLD_|\/usr\/bin\/git)/.test(source),
  };
  assert.deepEqual(Object.entries(gitClosureObligations).filter(([, met]) => !met).map(([name]) => name), [],
    'CAUSAL_RED: exact Git bytes, non-system dylibs, directories, ACLs, and runtime write denial share one install/rollback transaction');
  assert.doesNotMatch(source, /(?:rm|unlink|truncate).*(?:active-change|ledger|handoff)|git\s+(?:reset|rebase)|active_change_id\s*[:=]\s*null/i, 'rollback cannot clear pointer, delete evidence, or reset Git');
});

test('TEST-MA-INSTALL-002 / AC-MA-003-01..03; AC-MA-005-01,02; AC-MA-007-04 / CAN-MA-04,14: temporary-root install includes the immutable Git closure and least-authority service', async () => {
  const installer = await loadRequired(installerPath, ['PINNED_GIT_INSTALL', 'createHostInstaller'], 'directory-aware host installer is required');
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
  const launchctlCalls = [];
  let aclGrantTarget = null;
  let effectiveWriteAllowedTarget = null;
  let bootstrapFailure = false;
  const socketTarget = '/private/var/run/juanerai/change-coordinator.sock';
  const socketPath = path.join(temporary, 'coordinator.sock');
  const translate = target => target === socketTarget
    ? socketPath
    : ['/private/', '/Library/', '/usr/local/', '/Users/huangbo/Dev/Env/homebrew'].some(prefix => target.startsWith(prefix))
      ? path.join(targetRoot, target.slice(1)) : target;
  const ownerStat = async target => {
    const resolved = translate(target);
    const stat = await lstat(resolved);
    const owner = owners.get(resolved) ?? { uid: stat.uid, gid: stat.gid };
    return new Proxy(stat, {
      get(value, key) {
        if (key === 'uid' || key === 'gid') return owner[key];
        if (key === 'mode' && modeOverrides.has(resolved)) return (value.mode & ~0o777) | modeOverrides.get(resolved);
        if (key === 'isSocket' && resolved === socketPath) return () => true;
        const member = Reflect.get(value, key, value);
        return typeof member === 'function' ? member.bind(value) : member;
      },
    });
  };
  const osBoundary = {
    readFile: target => readFile(translate(target)),
    readdir: target => readdir(translate(target)),
    writeFile: (target, bytes, options) => writeFile(translate(target), bytes, options),
    mkdir: (target, options) => mkdir(translate(target), options),
    lstat: ownerStat,
    realpath: target => realpath(translate(target)),
    async rename(from, to) {
      const source = translate(from); const target = translate(to);
      await rename(source, target);
      for (const [ownedPath, owner] of [...owners]) {
        if (ownedPath === source || ownedPath.startsWith(`${source}${path.sep}`)) {
          owners.set(`${target}${ownedPath.slice(source.length)}`, owner);
          owners.delete(ownedPath);
        }
      }
    },
    copyFile: (from, to) => copyFile(translate(from), translate(to)),
    chmod: (target, mode) => chmod(translate(target), mode),
    async chown(target, uid, gid) { owners.set(translate(target), { uid, gid }); },
    rm: (target, options) => rm(translate(target), options),
    open: (target, flags) => open(translate(target), flags),
    async exec(executable, args) {
      if (executable === '/bin/ls') return {
        code: 0, signal: null,
        stdout: Buffer.from(args.at(-1) === aclGrantTarget ? `${args.at(-1)}\n 0: user:test allow read,write\n` : `${args.at(-1)}\n`),
        stderr: Buffer.alloc(0),
      };
      if (executable === '/usr/bin/sudo') {
        effectiveWriteDenials.add(args.at(-1));
        return { code: args.at(-1) === effectiveWriteAllowedTarget ? 0 : 1, signal: null, stdout: Buffer.alloc(0), stderr: Buffer.alloc(0) };
      }
      if (executable !== '/bin/launchctl') throw new Error('UNEXPECTED_EXECUTABLE');
      launchctlCalls.push([...args]);
      if (args[0] === 'bootout') return { code: 3, signal: null, stdout: Buffer.alloc(0), stderr: Buffer.alloc(0) };
      if (args[0] === 'bootstrap') {
        if (bootstrapFailure) return { code: 1, signal: null, stdout: Buffer.alloc(0), stderr: Buffer.from('injected bootstrap failure') };
        await mkdir(path.dirname(socketPath), { recursive: true });
        await writeFile(socketPath, Buffer.alloc(0));
        await chmod(socketPath, 0o660);
        owners.set(socketPath, { uid: 0, gid: 20 });
        return { code: 0, signal: null, stdout: Buffer.alloc(0), stderr: Buffer.alloc(0) };
      }
      if (args[0] === 'print') return { code: 0, signal: null, stdout: Buffer.from('state = running\n'), stderr: Buffer.alloc(0) };
      throw new Error('UNEXPECTED_LAUNCHCTL');
    },
    uid: () => 0,
    gid: () => 0,
    now: () => '2026-08-26T10:00:00.000Z',
  };

  try {
    await mkdir(runtimeSource, { recursive: true });
    for (const name of ['host-loop.mjs', 'production.mjs', 'coordinator.mjs', 'adapters.mjs']) {
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
    for (const artifact of priorArtifacts) {
      const file = path.join(translate(artifact.directory), artifact.name);
      const stat = await ownerStat(path.join(artifact.directory, artifact.name));
      assert.deepEqual(await readFile(file), artifact.bytes, `rollback restores exact prior bytes for ${artifact.name}`);
      assert.deepEqual({ uid: stat.uid, gid: stat.gid, mode: stat.mode & 0o777 }, { uid: 0, gid: 0, mode: artifact.mode });
    }

    const receipt = await hostInstaller.install(plan);
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
    assert.equal(launchctlCalls.some(args => args[0] === 'bootstrap'), true);
    assert.equal(launchctlCalls.some(args => args[0] === 'print'), true, 'launchd target is started and read back');

    const socketStat = await ownerStat(socketTarget);
    assert.deepEqual({ uid: socketStat.uid, gid: socketStat.gid, mode: socketStat.mode & 0o777 }, { uid: 0, gid: 20, mode: 0o660 });
    assert.equal(effectiveWriteDenials.has(stateTarget), true, 'runtime client cannot write Coordinator state');
    assert.equal(effectiveWriteDenials.has(trustTarget), true, 'runtime client cannot write Controller trust');

    const ownershipSource = `${await readRequired(hostLoopPath, 'host socket ownership')}${await readRequired(installerPath, 'installed socket ownership')}`;
    assert.match(ownershipSource, /0o660[\s\S]{0,800}runtime_gid|runtime_gid[\s\S]{0,800}0o660/,
      'CAUSAL_RED: production service must root-own and runtime-group the reachable socket without opening state/trust');
  } finally {
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
