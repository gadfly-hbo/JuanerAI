import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { chmod, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createCoordinatorAdapters } from './adapters.mjs';
import {
  GIT_METHODS, GIT_SHA, LEDGER_METHODS, assertHelperHealth, assertTemporaryGitFixtureHealthy,
  canonicalJson, expectedWorktreeReceipt, makeTestDependencies, run, sha256,
} from './fixtures.mjs';

const productionPath = new URL('./production.mjs', import.meta.url);
const FIXED_GIT_ENVIRONMENT = Object.freeze({
  LC_ALL: 'C', LANG: 'C', TZ: 'UTC', GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: '/dev/null',
  GIT_ATTR_NOSYSTEM: '1', GIT_PAGER: 'cat', PAGER: 'cat', GIT_TERMINAL_PROMPT: '0', GIT_NO_REPLACE_OBJECTS: '1',
});
const fixedRawDiffArgv = (baseline, candidate) => [
  '--no-pager', '-c', 'color.ui=false', '-c', 'core.quotePath=true', '-c', 'diff.algorithm=myers', '-c', 'diff.mnemonicPrefix=false', '-c', 'diff.noprefix=false',
  'diff', '--binary', '--full-index', '--no-ext-diff', '--no-textconv', '--no-renames', '--src-prefix=a/', '--dst-prefix=b/', `${baseline}..${candidate}`, '--',
];
const fixedPathDiffArgv = (baseline, candidate) => [
  '--no-pager', '-c', 'color.ui=false', '-c', 'core.quotePath=true', '-c', 'diff.algorithm=myers', '-c', 'diff.mnemonicPrefix=false', '-c', 'diff.noprefix=false',
  'diff', '--name-status', '-z', '--no-ext-diff', '--no-textconv', '--no-renames', `${baseline}..${candidate}`, '--',
];

const canonicalDiffReceiptPreimage = value => ({
  producer_receipt: value.producer_receipt,
  raw_stdout: Buffer.from(value.raw_stdout).toString('base64'),
  byte_length: value.byte_length,
  stdout_sha256: value.stdout_sha256,
  path_raw_stdout: Buffer.from(value.path_raw_stdout).toString('base64'),
  path_byte_length: value.path_byte_length,
  changed_paths: value.changed_paths,
});

const parseFixedNameStatusZ = raw => {
  const fields = Buffer.from(raw).toString('utf8').split('\0');
  assert.equal(fields.at(-1), '', 'the independent path oracle has exact terminal NUL framing');
  const tokens = fields.slice(0, -1);
  assert.equal(tokens.length % 2, 0, 'the independent path oracle has complete status/path pairs');
  return Array.from({ length: tokens.length / 2 }, (_, index) => ({ status: tokens[index * 2], path: tokens[index * 2 + 1] }));
};

const git = async (cwd, ...args) => {
  const result = await run('/Users/huangbo/Dev/Env/homebrew/bin/git', args, { cwd, env: { LC_ALL: 'C', PATH: process.env.PATH } });
  assert.equal(result.code, 0, result.stderr);
  return result.stdout.trim();
};

async function withTemporaryRepository(action) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'juanerai-dtf-adapter-'));
  try {
    await git(root, 'init', '-b', 'main');
    await git(root, 'config', 'user.name', 'JuanerAI Test');
    await git(root, 'config', 'user.email', 'test@invalid.example');
    await writeFile(path.join(root, 'tracked.txt'), 'baseline\n');
    await git(root, 'add', '--', 'tracked.txt');
    await git(root, 'commit', '-m', 'baseline');
    const baseline = await git(root, 'rev-parse', 'HEAD');
    await writeFile(path.join(root, 'tracked.txt'), 'candidate\n');
    await git(root, 'add', '--', 'tracked.txt');
    await git(root, 'commit', '-m', 'candidate');
    const candidate = await git(root, 'rev-parse', 'HEAD');
    return await action({ root, baseline, candidate, common_git_dir: path.join(root, '.git') });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

async function withTemporaryOrigin(action) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'juanerai-dtf-sync-'));
  try {
    const remote = path.join(root, 'origin.git');
    const seed = path.join(root, 'seed');
    const macmini = path.join(root, 'macmini');
    await git(root, 'init', '--bare', remote);
    await git(root, 'init', '-b', 'main', seed);
    await git(seed, 'config', 'user.name', 'JuanerAI Test');
    await git(seed, 'config', 'user.email', 'test@invalid.example');
    await writeFile(path.join(seed, 'tracked.txt'), 'baseline\n');
    await git(seed, 'add', '--', 'tracked.txt');
    await git(seed, 'commit', '-m', 'baseline');
    await git(seed, 'remote', 'add', 'origin', remote);
    await git(seed, 'push', '-u', 'origin', 'main');
    await git(remote, 'symbolic-ref', 'HEAD', 'refs/heads/main');
    await git(root, 'clone', remote, macmini);
    await git(macmini, 'config', 'user.name', 'JuanerAI Test');
    await git(macmini, 'config', 'user.email', 'test@invalid.example');
    await writeFile(path.join(seed, 'tracked.txt'), 'squashed\n');
    await git(seed, 'add', '--', 'tracked.txt');
    await git(seed, 'commit', '-m', 'squashed');
    await git(seed, 'push', 'origin', 'main');
    const squash_sha = await git(seed, 'rev-parse', 'HEAD');
    return await action({ macmini, squash_sha });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

test('helper health: bare remote, isolated clones, exact index tree/commit/readback, raw diff identity, and teardown', async () => {
  await assertHelperHealth();
  const digest = await assertTemporaryGitFixtureHealthy();
  assert.match(digest, /^[0-9a-f]{64}$/);
});

test('TEST-DTF-R1-008: production adapter exposes exactly the Design eleven Git methods and canonicalDiff result shape', async t => {
  const adapters = createCoordinatorAdapters({
    repository_root: '/tmp', state_root: '/tmp/juanerai-dtf-r1-state', device: 'mac-mini', process_run_id: 'test-001',
    git_executable: '/Users/huangbo/Dev/Env/homebrew/bin/git', pull_request_executable: '/usr/bin/false', base_environment: {},
  });
  await t.test('Git method budget is exactly eleven restricted operations', () => {
    assert.deepEqual(Object.keys(adapters.git).sort(), [...GIT_METHODS].sort());
  });
  await t.test('no general Git escape, force/delete, merge, broad add, or push-main operation exists', () => {
    for (const forbidden of ['command', 'run', 'add', 'pushMain', 'forcePush', 'deleteBranch', 'merge', 'recover']) assert.equal(Object.hasOwn(adapters.git, forbidden), false);
  });
  await t.test('canonical diff operation takes Design identity fields only and yields raw stdout hash metadata', () => {
    assert.equal(typeof adapters.git.canonicalDiff, 'function');
    assert.equal(adapters.git.canonicalDiff.length, 1);
  });
  await t.test('TEST-M2-009 / 009-L03..L06: canonicalDiff records the frozen raw/path producer receipt from a temporary Git repository', async () => {
    await withTemporaryRepository(async fixture => {
      const result = await adapters.git.canonicalDiff({
        canonical_root: fixture.root,
        common_git_dir: fixture.common_git_dir,
        worktree_root: fixture.root,
        baseline_sha: fixture.baseline,
        candidate_sha: fixture.candidate,
      });
      assert.equal(result.kind, 'OK');
      const rawOracle = await run('/Users/huangbo/Dev/Env/homebrew/bin/git', fixedRawDiffArgv(fixture.baseline, fixture.candidate), { cwd: fixture.root, env: FIXED_GIT_ENVIRONMENT });
      const pathOracle = await run('/Users/huangbo/Dev/Env/homebrew/bin/git', fixedPathDiffArgv(fixture.baseline, fixture.candidate), { cwd: fixture.root, env: FIXED_GIT_ENVIRONMENT });
      assert.deepEqual({ code: rawOracle.code, signal: rawOracle.signal, stderr: rawOracle.stderr }, { code: 0, signal: null, stderr: '' }, 'the fixed independent raw producer command is healthy before V2 shape admission');
      assert.deepEqual({ code: pathOracle.code, signal: pathOracle.signal, stderr: pathOracle.stderr }, { code: 0, signal: null, stderr: '' }, 'the fixed independent path producer command is healthy before V2 shape admission');
      assert.deepEqual(parseFixedNameStatusZ(pathOracle.stdout), [{ status: 'M', path: 'tracked.txt' }], 'the independent path oracle proves the positive M framing without using the producer receipt');
      assert.deepEqual(Object.keys(result.value).sort(), [
        'byte_length', 'changed_paths', 'path_byte_length', 'path_raw_stdout',
        'producer_receipt', 'raw_stdout', 'stdout_sha256',
      ], 'CAUSAL_RED: CanonicalDiffResultV2 is the closed seven-field raw-byte envelope');
      assert.deepEqual(Object.keys(result.value.producer_receipt).sort(), [
        'argv', 'common_git_dir', 'environment', 'executable', 'executable_sha256',
        'path_argv', 'path_stdout_sha256', 'repository_root', 'shell', 'version', 'worktree_root',
      ]);
      assert.equal(result.value.producer_receipt.shell, false);
      assert.equal(result.value.producer_receipt.version, '2.54.0');
      assert.equal(result.value.producer_receipt.environment.LC_ALL, 'C');
      assert.deepEqual(result.value.producer_receipt.argv.slice(-2), [
        `${fixture.baseline}..${fixture.candidate}`, '--',
      ]);
      assert.deepEqual(result.value.producer_receipt.argv, fixedRawDiffArgv(fixture.baseline, fixture.candidate), 'the returned raw argv is checked against the fixed Test authority');
      assert.deepEqual(result.value.producer_receipt.path_argv, fixedPathDiffArgv(fixture.baseline, fixture.candidate), 'the returned path argv is checked against the fixed Test authority');
      assert.deepEqual(result.value.producer_receipt.environment, FIXED_GIT_ENVIRONMENT, 'the returned environment is checked against the fixed Test authority');
      assert.deepEqual(result.value.producer_receipt.path_argv.slice(-2), [`${fixture.baseline}..${fixture.candidate}`, '--']);
      assert.match(result.value.producer_receipt.path_stdout_sha256, /^[0-9a-f]{64}$/);
      assert.match(result.value.stdout_sha256, /^[0-9a-f]{64}$/);
      assert.ok(result.value.byte_length > 0);
      assert.ok(Buffer.isBuffer(result.value.raw_stdout), 'CAUSAL_RED: raw stdout remains the accepted exact Buffer');
      assert.ok(Buffer.isBuffer(result.value.path_raw_stdout), 'CAUSAL_RED: path stdout must retain its exact NUL Buffer rather than a decoded projection');
      assert.equal(result.value.byte_length, result.value.raw_stdout.length);
      assert.equal(result.value.path_byte_length, result.value.path_raw_stdout.length);
      assert.equal(result.value.stdout_sha256, sha256(result.value.raw_stdout));
      assert.equal(result.value.producer_receipt.path_stdout_sha256, sha256(result.value.path_raw_stdout));
      assert.equal(result.receipt_sha256, sha256(canonicalJson(canonicalDiffReceiptPreimage(result.value))), 'CAUSAL_RED: the outer receipt hashes the explicit seven-field byte-normalized preimage');
      assert.deepEqual(result.value.raw_stdout, Buffer.from(rawOracle.stdout), 'the raw Buffer equals independent pinned-Git stdout bytes');
      assert.deepEqual(result.value.path_raw_stdout, Buffer.from(pathOracle.stdout), 'the NUL path Buffer equals independent pinned-Git stdout bytes');
    });
  });
  await t.test('TEST-M2-009 / 009-L03..L05: canonicalDiff preserves raw Buffer bytes plus fixed argv/environment identities', async () => {
    await withTemporaryRepository(async fixture => {
      await writeFile(path.join(fixture.root, 'binary.bin'), Buffer.from([0, 255, 10, 128, 13, 10]));
      await git(fixture.root, 'add', '--', 'binary.bin');
      await git(fixture.root, 'commit', '-m', 'binary candidate');
      const binaryCandidate = await git(fixture.root, 'rev-parse', 'HEAD');
      const result = await adapters.git.canonicalDiff({
        canonical_root: fixture.root, common_git_dir: fixture.common_git_dir, worktree_root: fixture.root,
        baseline_sha: fixture.baseline, candidate_sha: binaryCandidate,
      });
      assert.equal(result.kind, 'OK');
      assert.ok(Buffer.isBuffer(result.value.raw_stdout), 'CAUSAL_RED: canonicalDiff must expose the exact raw stdout Buffer it hashes');
      assert.equal(result.value.stdout_sha256, sha256(result.value.raw_stdout), 'CAUSAL_RED: diff hash is over raw Buffer bytes, never a decoded string');
      assert.ok(Buffer.isBuffer(result.value.path_raw_stdout), 'CAUSAL_RED: the NUL status/path stdout is likewise retained as a Buffer');
      assert.equal(result.value.path_byte_length, result.value.path_raw_stdout.length, 'CAUSAL_RED: path length is over exact NUL bytes');
      assert.equal(result.value.producer_receipt.path_stdout_sha256, sha256(result.value.path_raw_stdout), 'CAUSAL_RED: path hash is over exact NUL bytes');
      const explicitPreimage = canonicalDiffReceiptPreimage(result.value);
      assert.deepEqual(Object.keys(explicitPreimage).sort(), ['byte_length', 'changed_paths', 'path_byte_length', 'path_raw_stdout', 'producer_receipt', 'raw_stdout', 'stdout_sha256']);
      assert.equal(result.receipt_sha256, sha256(canonicalJson(explicitPreimage)), 'CAUSAL_RED: no Buffer toJSON or generic typed-array representation may substitute for the explicit receipt bytes');
      assert.deepEqual(result.value.producer_receipt.argv, fixedRawDiffArgv(fixture.baseline, binaryCandidate), 'CAUSAL_RED: receipt must preserve complete fixed raw argv, not a suffix');
      assert.deepEqual(result.value.producer_receipt.path_argv, fixedPathDiffArgv(fixture.baseline, binaryCandidate), 'CAUSAL_RED: receipt must preserve complete fixed path argv, not a suffix');
      assert.deepEqual(result.value.producer_receipt.environment, FIXED_GIT_ENVIRONMENT);
      assert.equal(result.value.producer_receipt.shell, false, 'CAUSAL_RED: producer receipt binds shell:false');
    });
  });
  await t.test('TEST-M2-009 / 009-L03..L06: a direct healthy empty canonical diff has two empty Buffers and no derived path', async () => {
    await withTemporaryRepository(async fixture => {
      const result = await adapters.git.canonicalDiff({
        canonical_root: fixture.root, common_git_dir: fixture.common_git_dir, worktree_root: fixture.root,
        baseline_sha: fixture.baseline, candidate_sha: fixture.baseline,
      });
      assert.equal(result.kind, 'OK');
      assert.deepEqual(Object.keys(result.value).sort(), ['byte_length', 'changed_paths', 'path_byte_length', 'path_raw_stdout', 'producer_receipt', 'raw_stdout', 'stdout_sha256']);
      assert.ok(Buffer.isBuffer(result.value.raw_stdout));
      assert.ok(Buffer.isBuffer(result.value.path_raw_stdout));
      assert.deepEqual(result.value.raw_stdout, Buffer.alloc(0));
      assert.deepEqual(result.value.path_raw_stdout, Buffer.alloc(0));
      assert.equal(result.value.byte_length, 0);
      assert.equal(result.value.path_byte_length, 0);
      assert.equal(result.value.stdout_sha256, sha256(Buffer.alloc(0)));
      assert.equal(result.value.producer_receipt.path_stdout_sha256, sha256(Buffer.alloc(0)));
      assert.deepEqual(result.value.changed_paths, []);
      assert.equal(result.receipt_sha256, sha256(canonicalJson(canonicalDiffReceiptPreimage(result.value))));
    });
  });
  await t.test('TEST-M2-009 / 009-L06: the fixed independent positive oracle accepts all closed A/M/D/T records before Adapter comparison', async () => {
    await withTemporaryRepository(async fixture => {
      await writeFile(path.join(fixture.root, 'deleted.txt'), 'delete baseline\n');
      await writeFile(path.join(fixture.root, 'type.txt'), 'regular baseline\n');
      await git(fixture.root, 'add', '--', 'deleted.txt', 'type.txt');
      await git(fixture.root, 'commit', '-m', 'status baseline');
      const statusBaseline = await git(fixture.root, 'rev-parse', 'HEAD');
      await writeFile(path.join(fixture.root, 'added.txt'), 'added candidate\n');
      await writeFile(path.join(fixture.root, 'tracked.txt'), 'modified candidate\n');
      await rm(path.join(fixture.root, 'deleted.txt'));
      await rm(path.join(fixture.root, 'type.txt'));
      await symlink('tracked.txt', path.join(fixture.root, 'type.txt'));
      await git(fixture.root, 'add', '-A');
      await git(fixture.root, 'commit', '-m', 'status candidate');
      const statusCandidate = await git(fixture.root, 'rev-parse', 'HEAD');
      const pathOracle = await run('/Users/huangbo/Dev/Env/homebrew/bin/git', fixedPathDiffArgv(statusBaseline, statusCandidate), { cwd: fixture.root, env: FIXED_GIT_ENVIRONMENT });
      assert.deepEqual({ code: pathOracle.code, signal: pathOracle.signal, stderr: pathOracle.stderr }, { code: 0, signal: null, stderr: '' });
      assert.deepEqual(parseFixedNameStatusZ(pathOracle.stdout), [
        { status: 'A', path: 'added.txt' }, { status: 'D', path: 'deleted.txt' },
        { status: 'M', path: 'tracked.txt' }, { status: 'T', path: 'type.txt' },
      ], 'the independent fixed Git oracle positively proves every closed status token and complete NUL framing');
      const result = await adapters.git.canonicalDiff({
        canonical_root: fixture.root, common_git_dir: fixture.common_git_dir, worktree_root: fixture.root,
        baseline_sha: statusBaseline, candidate_sha: statusCandidate,
      });
      assert.equal(result.kind, 'OK');
      assert.deepEqual(Object.keys(result.value).sort(), ['byte_length', 'changed_paths', 'path_byte_length', 'path_raw_stdout', 'producer_receipt', 'raw_stdout', 'stdout_sha256'], 'CAUSAL_RED: Adapter admission must expose V2 before the positive A/M/D/T result comparison');
      assert.ok(Buffer.isBuffer(result.value.path_raw_stdout));
      assert.deepEqual(result.value.path_raw_stdout, Buffer.from(pathOracle.stdout), 'the Adapter retains the exact independently observed A/M/D/T NUL bytes');
      assert.deepEqual(result.value.changed_paths, ['added.txt', 'deleted.txt', 'tracked.txt', 'type.txt'], 'the Adapter derives the exact positive A/M/D/T path list');
    });
  });
  await t.test('the real adapter Git vocabulary is Core GatewayResultV1, not legacy unwrapped Git objects', async () => {
    await withTemporaryRepository(async fixture => {
      const fixtureAdapters = createCoordinatorAdapters({
        repository_root: fixture.root, state_root: path.join(fixture.root, '.dtf-state'), device: 'mac-mini', process_run_id: 'gateway-vocabulary-001',
        git_executable: '/Users/huangbo/Dev/Env/homebrew/bin/git', pull_request_executable: '/usr/bin/false', base_environment: {},
      });
      const remote = `${fixture.root}-gateway-origin.git`;
      const worktree = `${fixture.root}-core-worktree`;
      try {
        await git(fixture.root, 'init', '--bare', remote);
        await git(fixture.root, 'remote', 'add', 'origin', remote);
        await git(fixture.root, 'push', '-u', 'origin', 'main');
        const branch = 'work/mac-mini/dtf-gateway';
        const created = await fixtureAdapters.git.createOrReuseWorktree({ canonical_root: fixture.root, change_id: 'CHG-dual-device-transition-foundation', worktree_root: worktree, branch, baseline_sha: fixture.baseline, idempotency_id: 'worktree-001' });
        assert.equal(created.kind, 'OK', 'CAUSAL_RED: production adapter must return GatewayResultV1 to Core');
        assert.deepEqual(Object.keys(created.value).sort(), ['baseline_sha', 'branch', 'clean', 'common_git_dir', 'head_sha', 'worktree_root']);
        const inspected = await fixtureAdapters.git.inspectWorktree({ canonical_root: fixture.root, worktree_root: worktree, expected_branch: branch, expected_head: fixture.baseline });
        assert.equal(inspected.kind, 'OK');
        assert.deepEqual(Object.keys(inspected.value).sort(), ['branch', 'clean', 'common_git_dir', 'head_sha', 'status_entries', 'worktree_root']);
        await writeFile(path.join(worktree, 'tracked.txt'), 'gateway candidate\n');
        const staged = await fixtureAdapters.git.stageExact({ canonical_root: fixture.root, worktree_root: worktree, expected_head: fixture.baseline, paths: ['tracked.txt'] });
        const read = await fixtureAdapters.git.readStaged({ canonical_root: fixture.root, worktree_root: worktree });
        assert.deepEqual(staged, read, 'CAUSAL_RED: exact stage/read tree must share one closed GatewayResult receipt');
        const authorization_cycle_command_id = 'command-gateway-vocabulary-001';
        const candidatePreimage = {
          schema_version: '1.0', change_id: 'CHG-dual-device-transition-foundation', authorization_cycle_command_id,
          expected_parent: fixture.baseline, expected_tree: read.value.index_tree,
        };
        const candidate_idempotency_id = `candidate-${sha256(canonicalJson(candidatePreimage))}`;
        const message_bytes = new TextEncoder().encode(`JuanerAI Candidate\n\nJuanerAI-Idempotency-ID: ${candidate_idempotency_id}\n`);
        const committed = await fixtureAdapters.git.commitCandidate({ canonical_root: fixture.root, worktree_root: worktree, expected_parent: fixture.baseline, expected_tree: read.value.index_tree, message_bytes, idempotency_id: candidate_idempotency_id });
        const committedValue = { sha: committed.value.sha, parent: fixture.baseline, tree: read.value.index_tree, branch };
        assert.deepEqual(committed, { kind: 'OK', value: committedValue, receipt_sha256: sha256(canonicalJson(committedValue)) }, 'CAUSAL_RED: Candidate uses the frozen preimage and closed Gateway receipt');
        const committedObject = await run('/Users/huangbo/Dev/Env/homebrew/bin/git', ['cat-file', 'commit', committed.value.sha], { cwd: worktree, env: FIXED_GIT_ENVIRONMENT });
        assert.deepEqual({ code: committedObject.code, signal: committedObject.signal, stderr: committedObject.stderr }, { code: 0, signal: null, stderr: '' });
        assert.equal(committedObject.stdout.slice(committedObject.stdout.indexOf('\n\n') + 2), new TextDecoder().decode(message_bytes), 'CAUSAL_RED: Candidate commit preserves the exact frozen UTF-8 message bytes');
        const reread = await fixtureAdapters.git.readCommit({ canonical_root: fixture.root, sha: committed.value.sha });
        assert.deepEqual(reread, committed);
        const pushedValue = { prior_remote_head: null, remote_head: committed.value.sha, forced: false, deleted: false };
        const pushed = await fixtureAdapters.git.pushBranch({ canonical_root: fixture.root, branch, candidate_sha: committed.value.sha, expected_remote_head: null, idempotency_id: 'push-001' });
        assert.deepEqual(pushed, { kind: 'OK', value: pushedValue, receipt_sha256: sha256(canonicalJson(pushedValue)) }, 'CAUSAL_RED: push returns the frozen closed remote predecessor/readback receipt');
        const remoteRead = await fixtureAdapters.git.readRemoteBranch({ canonical_root: fixture.root, origin: 'origin', branch });
        const remoteReadValue = { remote_head: committed.value.sha };
        assert.deepEqual(remoteRead, { kind: 'OK', value: remoteReadValue, receipt_sha256: sha256(canonicalJson(remoteReadValue)) }, 'CAUSAL_RED: push/readback must agree on the frozen typed remote-head contract');
        const diff = await fixtureAdapters.git.canonicalDiff({ canonical_root: fixture.root, common_git_dir: fixture.common_git_dir, worktree_root: worktree, baseline_sha: fixture.baseline, candidate_sha: committed.value.sha });
        assert.equal(diff.kind, 'OK', 'CAUSAL_RED: canonicalDiff is a Core GatewayResult, not a legacy object');
        assert.equal(diff.value.stdout_sha256, sha256(diff.value.raw_stdout));
        assert.ok(Buffer.isBuffer(diff.value.path_raw_stdout), 'CAUSAL_RED: the Core-facing result keeps the independently produced NUL bytes');
        assert.equal(diff.value.path_byte_length, diff.value.path_raw_stdout.length);
        assert.equal(diff.value.producer_receipt.path_stdout_sha256, sha256(diff.value.path_raw_stdout));
        assert.equal(diff.receipt_sha256, sha256(canonicalJson(canonicalDiffReceiptPreimage(diff.value))));
        const sync = await fixtureAdapters.git.syncMainFfOnly({ canonical_root: fixture.root, main_worktree_root: fixture.root, squash_sha: fixture.candidate, expected_origin_main: fixture.candidate });
        const syncValue = { prior_local_main: fixture.candidate, local_main: fixture.candidate, origin_main: fixture.candidate, clean: true, fast_forward_only: true };
        assert.deepEqual(sync, { kind: 'OK', value: syncValue, receipt_sha256: sha256(canonicalJson(syncValue)) }, 'CAUSAL_RED: sync returns exact Core GatewayResult readback');
      } finally {
        await rm(worktree, { recursive: true, force: true });
        await rm(remote, { recursive: true, force: true });
      }
    });
  });
  await t.test('TEST-M2-009 / 009-L08: pushBranch binds the exact remote predecessor and preserves remote on mismatch', async () => {
    await withTemporaryRepository(async fixture => {
      const fixtureAdapters = createCoordinatorAdapters({
        repository_root: fixture.root, state_root: path.join(fixture.root, '.dtf-state'), device: 'mac-mini', process_run_id: 'push-predecessor-001',
        git_executable: '/Users/huangbo/Dev/Env/homebrew/bin/git', pull_request_executable: '/usr/bin/false', base_environment: {},
      });
      const remote = `${fixture.root}-predecessor-origin.git`;
      const branch = 'work/mac-mini/dtf-predecessor';
      try {
        await git(fixture.root, 'init', '--bare', remote);
        await git(fixture.root, 'remote', 'add', 'origin', remote);
        await git(fixture.root, 'checkout', '-b', branch);
        await git(fixture.root, 'push', '-u', 'origin', branch);
        const predecessor = fixture.candidate;

        await writeFile(path.join(fixture.root, 'tracked.txt'), 'matching update\n');
        await git(fixture.root, 'add', '--', 'tracked.txt');
        await git(fixture.root, 'commit', '-m', 'matching update');
        const matchingHead = await git(fixture.root, 'rev-parse', 'HEAD');
        const matching = await fixtureAdapters.git.pushBranch({
          canonical_root: fixture.root, branch, candidate_sha: matchingHead, expected_remote_head: predecessor, idempotency_id: 'push-predecessor-match-001',
        });
        const matchingValue = { prior_remote_head: predecessor, remote_head: matchingHead, forced: false, deleted: false };
        assert.deepEqual(matching, { kind: 'OK', value: matchingValue, receipt_sha256: sha256(canonicalJson(matchingValue)) });
        const matchingReadValue = { remote_head: matchingHead };
        assert.deepEqual(await fixtureAdapters.git.readRemoteBranch({ canonical_root: fixture.root, origin: 'origin', branch }), { kind: 'OK', value: matchingReadValue, receipt_sha256: sha256(canonicalJson(matchingReadValue)) }, 'CAUSAL_RED: an exact predecessor permits the normal non-force update');

        await writeFile(path.join(fixture.root, 'tracked.txt'), 'mismatched update\n');
        await git(fixture.root, 'add', '--', 'tracked.txt');
        await git(fixture.root, 'commit', '-m', 'mismatched update');
        const mismatchedHead = await git(fixture.root, 'rev-parse', 'HEAD');
        const mismatched = await fixtureAdapters.git.pushBranch({
          canonical_root: fixture.root, branch, candidate_sha: mismatchedHead, expected_remote_head: predecessor, idempotency_id: 'push-predecessor-mismatch-001',
        });
        const remoteAfterMismatch = await fixtureAdapters.git.readRemoteBranch({ canonical_root: fixture.root, origin: 'origin', branch });
        assert.deepEqual(Object.keys(mismatched).sort(), ['kind', 'observed_identity', 'reason'], 'CAUSAL_RED: stale predecessor returns one closed conflict envelope');
        assert.equal(mismatched.kind, 'CONFLICT');
        assert.equal(mismatched.reason, 'REMOTE_CONFLICT');
        assert.ok(mismatched.observed_identity === null || typeof mismatched.observed_identity === 'string', 'the frozen Gateway union permits only null or a string observed identity');
        assert.deepEqual(remoteAfterMismatch, { kind: 'OK', value: matchingReadValue, receipt_sha256: sha256(canonicalJson(matchingReadValue)) }, 'CAUSAL_RED: stale expected_remote_head leaves the remote branch unchanged before push');
      } finally {
        await rm(remote, { recursive: true, force: true });
      }
    });
  });
  await t.test('syncMainFfOnly rejects dirty or non-main worktrees before any move and then proves all three heads', async () => {
    await withTemporaryOrigin(async ({ macmini, squash_sha }) => {
      const syncAdapters = createCoordinatorAdapters({ repository_root: macmini, state_root: path.join(macmini, '.dtf-state'), device: 'mac-mini', process_run_id: 'sync-dirty-001', git_executable: '/Users/huangbo/Dev/Env/homebrew/bin/git', pull_request_executable: '/usr/bin/false', base_environment: {} });
      await writeFile(path.join(macmini, 'untracked.txt'), 'must block\n');
      await assert.rejects(() => syncAdapters.git.syncMainFfOnly({ canonical_root: macmini, main_worktree_root: macmini, squash_sha, expected_origin_main: squash_sha }), /COORDINATOR_INTERRUPTED/, 'CAUSAL_RED: dirty main worktree cannot report clean:true or move');
      assert.notEqual(await git(macmini, 'rev-parse', 'HEAD'), squash_sha, 'CAUSAL_RED: dirty rejection occurs before ff-only move');
    });
  });
  await t.test('syncMainFfOnly rejects a non-main worktree before any move', async () => {
    await withTemporaryOrigin(async ({ macmini, squash_sha }) => {
      const syncAdapters = createCoordinatorAdapters({ repository_root: macmini, state_root: path.join(macmini, '.dtf-state'), device: 'mac-mini', process_run_id: 'sync-non-main-001', git_executable: '/Users/huangbo/Dev/Env/homebrew/bin/git', pull_request_executable: '/usr/bin/false', base_environment: {} });
      await git(macmini, 'checkout', '-b', 'work/mac-mini/not-main');
      const prior = await git(macmini, 'rev-parse', 'HEAD');
      await assert.rejects(() => syncAdapters.git.syncMainFfOnly({ canonical_root: macmini, main_worktree_root: macmini, squash_sha, expected_origin_main: squash_sha }), /COORDINATOR_INTERRUPTED/, 'CAUSAL_RED: only a clean main worktree may be fast-forwarded');
      assert.equal(await git(macmini, 'rev-parse', 'HEAD'), prior, 'CAUSAL_RED: non-main rejection occurs before ff-only move');
    });
  });
  await t.test('syncMainFfOnly rejects a signed origin mismatch before any move', async () => {
    await withTemporaryOrigin(async ({ macmini, squash_sha }) => {
      const syncAdapters = createCoordinatorAdapters({ repository_root: macmini, state_root: path.join(macmini, '.dtf-state'), device: 'mac-mini', process_run_id: 'sync-origin-mismatch-001', git_executable: '/Users/huangbo/Dev/Env/homebrew/bin/git', pull_request_executable: '/usr/bin/false', base_environment: {} });
      const prior = await git(macmini, 'rev-parse', 'HEAD');
      await assert.rejects(() => syncAdapters.git.syncMainFfOnly({ canonical_root: macmini, main_worktree_root: macmini, squash_sha, expected_origin_main: '0'.repeat(40) }), /COORDINATOR_INTERRUPTED/, 'CAUSAL_RED: signed origin main must match after fetch/prune and before ff-only move');
      assert.equal(await git(macmini, 'rev-parse', 'HEAD'), prior, 'CAUSAL_RED: signed-origin mismatch occurs before ff-only move');
    });
  });
  await t.test('TEST-M2-009 / 009-L04: canonicalDiff rejects a fake executable version before hashing', async () => {
    await withTemporaryRepository(async fixture => {
      const fake = path.join(fixture.root, 'git-9.99.9');
      await writeFile(fake, '#!/bin/sh\nif [ "$1" = "--version" ]; then echo "git version 9.99.9"; exit 0; fi\nexec /Users/huangbo/Dev/Env/homebrew/bin/git "$@"\n');
      await chmod(fake, 0o755);
      const fakeAdapters = createCoordinatorAdapters({ repository_root: fixture.root, state_root: path.join(fixture.root, '.dtf-state'), device: 'mac-mini', process_run_id: 'fake-git-001', git_executable: fake, pull_request_executable: '/usr/bin/false', base_environment: {} });
      const request = { canonical_root: fixture.root, common_git_dir: fixture.common_git_dir, worktree_root: fixture.root, baseline_sha: fixture.baseline, candidate_sha: fixture.candidate };
      await assert.rejects(() => fakeAdapters.git.canonicalDiff(request), /COORDINATOR_INTERRUPTED/, 'CAUSAL_RED: fake Git 9.99.9 must reject before a producer receipt is issued');
    });
  });
  await t.test('TEST-M2-009 / 009-L07: canonicalDiff rejects a false common Git-dir identity before hashing', async () => {
    await withTemporaryRepository(async fixture => {
      const request = { canonical_root: fixture.root, common_git_dir: fixture.common_git_dir, worktree_root: fixture.root, baseline_sha: fixture.baseline, candidate_sha: fixture.candidate };
      await assert.rejects(() => adapters.git.canonicalDiff({ ...request, common_git_dir: path.join(fixture.root, 'not-the-common-git-dir') }), /COORDINATOR_INTERRUPTED/, 'CAUSAL_RED: false common Git-dir identity must reject before raw-byte hashing');
    });
  });
  await t.test('syncMainFfOnly fetches, proves clean main, fast-forwards only, and reads local/origin main back at the signed squash SHA', async () => {
    await withTemporaryOrigin(async ({ macmini, squash_sha }) => {
      const syncAdapters = createCoordinatorAdapters({
        repository_root: macmini,
        state_root: path.join(macmini, '.dtf-state'),
        device: 'mac-mini', process_run_id: 'sync-test-001',
        git_executable: '/Users/huangbo/Dev/Env/homebrew/bin/git', pull_request_executable: '/usr/bin/false', base_environment: {},
      });
      const prior_local_main = await git(macmini, 'rev-parse', 'HEAD');
      const result = await syncAdapters.git.syncMainFfOnly({
        canonical_root: macmini,
        main_worktree_root: macmini,
        squash_sha,
        expected_origin_main: squash_sha,
      });
      const syncValue = { prior_local_main, local_main: squash_sha, origin_main: squash_sha, clean: true, fast_forward_only: true };
      assert.deepEqual(result, { kind: 'OK', value: syncValue, receipt_sha256: sha256(canonicalJson(syncValue)) });
      assert.equal(await git(macmini, 'rev-parse', 'HEAD'), squash_sha);
      assert.equal(await git(macmini, 'rev-parse', 'refs/remotes/origin/main'), squash_sha);
    });
  });
});

test('TEST-DTF-R1-011: deterministic dependency contract has exact Git/Ledger budgets and fault queues remain local to one boundary', async t => {
  const harness = makeTestDependencies();
  await t.test('test double has the same eleven/four method budgets without forbidden surfaces', () => {
    assert.deepEqual(Object.keys(harness.dependencies.git).sort(), [...GIT_METHODS].sort());
    assert.deepEqual(Object.keys(harness.dependencies.ledger).sort(), [...LEDGER_METHODS].sort());
  });
  await t.test('one queued Git fault cannot alter Ledger, PR, validation, or Handoff default results', async () => {
    const definition = {
      id: 'regression-affected-suite', validation_kind: 'REGRESSION', validation_scope: 'AFFECTED_SUITE', subject: 'WORKTREE',
      argv: [process.execPath, '--test'], cwd: '/tmp/dtf-worktree', environment: {}, timeout_ms: 60_000,
    };
    const subject = {
      kind: 'WORKTREE', repository_root: '/tmp/dtf-repo', worktree_root: '/tmp/dtf-worktree', branch: 'work/mac-mini/dtf',
      head_sha: GIT_SHA, common_git_dir: '/tmp/dtf-repo/.git', allowed_paths: ['tools/harness/change-coordinator/coordinator.mjs'], forbidden_paths: [],
    };
    const snapshot = {
      scope_sha256: sha256(canonicalJson({ allowed_paths: subject.allowed_paths, forbidden_paths: subject.forbidden_paths })),
      worktree_snapshot_sha256: sha256('TEST-DTF-R1-011 synthetic component snapshot'),
    };
    const request = { definition, subject };
    const value = expectedWorktreeReceipt(subject, definition, snapshot, '', '');
    const response = { kind: 'OK', value, receipt_sha256: sha256(canonicalJson(value)) };
    harness.fault('git.pushBranch', { kind: 'AMBIGUOUS', reason: 'REMOTE_AMBIGUOUS', partial_receipt: { stage: 'REMOTE_REF_READ' } });
    harness.fault('validation.execute', response);
    assert.equal((await harness.dependencies.git.pushBranch({})).kind, 'AMBIGUOUS');
    assert.equal((await harness.dependencies.ledger.readRemote({})).kind, 'OK');
    assert.equal((await harness.dependencies.pull_request.createOrReuse({ head_branch: 'work/mac-mini/dtf', head_sha: '2'.repeat(40) })).kind, 'OK');
    assert.deepEqual(await harness.dependencies.validation.execute(request), response, 'the queued synthetic component receipt is exact; it is not process-execution proof');
    assert.deepEqual(harness.calls.filter(call => call.name === 'validation.execute').map(call => call.request), [request], 'the validation queue receives exactly the concrete closed request');
    await assert.rejects(() => harness.dependencies.validation.execute(request), /TEST_FIXTURE_UNSCRIPTED_VALIDATION_EXECUTE/, 'an unqueued validation call cannot inherit a fabricated PASS receipt');
    assert.equal((await harness.dependencies.handoff.writeReadback({ expected_sha256: 'a'.repeat(64) })).kind, 'OK');
  });
});

test('TEST-DTF-R1-009: Evidence bytes fixture retains exact JSONL framing and does not create a fifth recovery mechanism', () => {
  const one = '{"event_id":"event-001"}\n';
  const two = `${one}{"event_id":"event-002"}\n`;
  assert.equal(one.endsWith('\n'), true); assert.equal(one.includes('\r'), false); assert.equal(one.startsWith('\uFEFF'), false);
  assert.equal(two.indexOf(one), 0); assert.equal(sha256(one).length, 64);
  const harness = makeTestDependencies();
  assert.equal(Object.hasOwn(harness.dependencies.git, 'recover'), false);
  assert.equal(Object.hasOwn(harness.dependencies.ledger, 'recover'), false);
});

test('TEST-MA-GIT-001 / AC-MA-005-01,02 / CAN-MA-14: production Git is the frozen executable bytes under an empty environment', async t => {
  const options = {
    repository_root: '/tmp', state_root: '/tmp/juanerai-ma-git-state', device: 'mac-mini', process_run_id: 'ma-git-001',
    git_executable: '/Users/huangbo/Dev/Env/homebrew/bin/git', pull_request_executable: '/usr/bin/false', base_environment: {},
  };

  await t.test('ambient PATH, HOME, Git config, attributes, replace, alternate, and shallow inputs are rejected at composition', () => {
    assert.throws(() => createCoordinatorAdapters({
      ...options,
      base_environment: {
        PATH: '/tmp/injected', HOME: '/tmp/injected', GIT_CONFIG_GLOBAL: '/tmp/injected-config',
        GIT_ATTR_NOSYSTEM: '0', GIT_REPLACE_REF_BASE: 'refs/injected', GIT_ALTERNATE_OBJECT_DIRECTORIES: '/tmp/objects', GIT_SHALLOW_FILE: '/tmp/shallow',
      },
    }), /COORDINATOR_INPUT_INVALID/, 'EXPECTED_RED: current adapter accepts ambient production Git configuration');
  });

  await t.test('a wrapper that reports 2.54.0 but has the wrong executable SHA-256 rejects before diff bytes', async () => {
    await withTemporaryRepository(async fixture => {
      const wrapper = path.join(fixture.root, 'git-2.54.0-wrong-bytes');
      await writeFile(wrapper, '#!/bin/sh\nif [ "$1" = "--version" ]; then echo "git version 2.54.0"; exit 0; fi\nexec /Users/huangbo/Dev/Env/homebrew/bin/git "$@"\n');
      await chmod(wrapper, 0o755);
      const wrapped = createCoordinatorAdapters({ ...options, repository_root: fixture.root, state_root: path.join(fixture.root, '.state'), git_executable: wrapper });
      await assert.rejects(() => wrapped.git.canonicalDiff({
        canonical_root: fixture.root, common_git_dir: fixture.common_git_dir, worktree_root: fixture.root,
        baseline_sha: fixture.baseline, candidate_sha: fixture.candidate,
      }), /COORDINATOR_INTERRUPTED/, 'EXPECTED_RED: version equality without frozen executable hash is insufficient');
    });
  });

  await t.test('TEST-M2-009 / 009-L09: main, force syntax, deletion syntax, and non-current branch grammar are unavailable before transport', async () => {
    await withTemporaryRepository(async fixture => {
      const validBranch = 'work/mac-mini/mode-activation';
      const probe = path.join(fixture.root, 'transport-probe');
      const wrapper = path.join(fixture.root, 'transport-probe-git');
      await git(fixture.root, 'checkout', '-b', validBranch);
      await writeFile(wrapper, `#!/bin/sh\nprintf invoked >> ${probe}\nexit 1\n`);
      await chmod(wrapper, 0o755);
      const adapter = createCoordinatorAdapters({ ...options, repository_root: fixture.root, state_root: path.join(fixture.root, '.state'), git_executable: wrapper });
      const request = { canonical_root: fixture.root, candidate_sha: fixture.candidate, expected_remote_head: null, idempotency_id: 'ma-push-denied' };
      await assert.rejects(() => adapter.git.pushBranch({ ...request, branch: validBranch }), /COORDINATOR_INTERRUPTED/, 'the valid control must reach the executable probe after all request admission');
      assert.equal((await readFile(probe)).toString('utf8'), 'invoked', 'the valid control proves the probe observes real post-branch-admission transport reachability');
      await writeFile(probe, '');
      const attempts = ['main', '+work/mac-mini/mode-activation', ':work/mac-mini/mode-activation', 'work/macbook/mode-activation'];
      for (const branch of attempts) {
        await assert.rejects(() => adapter.git.pushBranch({ ...request, branch }), /COORDINATOR_INTERRUPTED/, `${branch} must reject before Git transport`);
        assert.equal((await readFile(probe)).toString('utf8'), '', `${branch} remains a forbidden branch-specific boundary, not a later repository or executable failure`);
      }
    });
  });
});

test('TEST-MA-GIT-002 / AC-MA-005-04; AC-MA-006-02,03 / CAN-MA-06,07: production push binds the exact local Candidate before remote effects', async () => {
  const source = await readFile(productionPath, 'utf8');
  const receiptSource = source.slice(source.indexOf('const sha256 ='), source.indexOf('const absent ='));
  const safeBranchStart = source.indexOf('const safeBranch =');
  const safeBranchSource = source.slice(safeBranchStart, source.indexOf('\n\n', safeBranchStart));
  const branchSource = source.slice(source.indexOf('function exactGitEnvironment'), source.indexOf('function createBranchReadback'));
  assert.match(branchSource, /function createBranchTransport/, 'production branch transport seam is required');
  assert.match(receiptSource, /const closed =/, 'the production closed request admission is required');
  assert.match(receiptSource, /const ok =/, 'the production Gateway success receipt is required');
  const branch = 'work/mac-mini/mode-activation';
  const predecessor = '1'.repeat(40);
  const candidate = '2'.repeat(40);
  const advanced = '3'.repeat(40);
  const targetRef = `refs/heads/${branch}`;
  const transportSsh = '/usr/bin/ssh -F /dev/null -i /root/key -o IdentitiesOnly=yes -o IdentityAgent=none -o BatchMode=yes -o PasswordAuthentication=no -o KbdInteractiveAuthentication=no -o StrictHostKeyChecking=yes';
  const expectedLocalRefCall = { executable: '/fixed/git', args: ['rev-parse', '--verify', targetRef], cwd: '/repo' };
  const expectedRemoteReadCall = { executable: '/fixed/git', args: ['-c', `core.sshCommand=${transportSsh}`, '-c', 'url.git@github.com:.insteadOf=https://github.com/', 'ls-remote', 'origin', targetRef], cwd: '/repo' };
  const expectedPushCall = { executable: '/fixed/git', args: ['-c', `core.sshCommand=${transportSsh}`, '-c', 'url.git@github.com:.insteadOf=https://github.com/', 'push', 'origin', `${candidate}:${targetRef}`], cwd: '/repo' };
  const exercise = async localHead => {
    const calls = [];
    const authorityReads = [];
    let remoteHead = predecessor;
    let pushCount = 0;
    const executeProcess = async (executable, args, options) => {
      calls.push({ executable, args: [...args], options });
      const operation = args.find(value => ['rev-parse', 'ls-remote', 'push'].includes(value));
      if (operation === 'rev-parse') return { code: 0, signal: null, stdout: Buffer.from(`${localHead}\n`), stderr: Buffer.alloc(0) };
      if (operation === 'ls-remote') return { code: 0, signal: null, stdout: Buffer.from(`${remoteHead}\trefs/heads/${branch}\n`), stderr: Buffer.alloc(0) };
      if (operation === 'push') {
        pushCount += 1;
        const refspec = args.at(-1);
        remoteHead = refspec.startsWith(`${candidate}:`) ? candidate : localHead;
        return { code: 0, signal: null, stdout: Buffer.alloc(0), stderr: Buffer.alloc(0) };
      }
      throw new Error('UNEXPECTED_GIT_CALL');
    };
    const transport = Function(
      'createHash', 'readAuthorityFile', 'executeProcess',
      `${receiptSource}\n${safeBranchSource}\n${branchSource}\nreturn createBranchTransport;`,
    )(
      createHash,
      async (target, expectedMode) => { authorityReads.push({ target, expectedMode }); return Buffer.from('purpose-bound-key'); },
      executeProcess,
    )({ gitExecutable: '/fixed/git', repositoryRoot: '/repo', branchKeyPath: '/root/key', runtime_uid: 501, runtime_gid: 20 });
    const result = await transport({ canonical_root: '/repo', branch, candidate_sha: candidate, expected_remote_head: predecessor, idempotency_id: 'push-candidate-001' });
    return {
      result,
      authority_reads: authorityReads,
      invocations: calls.map(call => ({ executable: call.executable, args: call.args, cwd: call.options.cwd })),
      operations: calls.map(call => call.args.find(value => ['rev-parse', 'ls-remote', 'push'].includes(value))),
      push_refspec: calls.find(call => call.args.includes('push'))?.args.at(-1) ?? null,
      push_count: pushCount,
      remote_head: remoteHead,
    };
  };
  const matchingValue = { prior_remote_head: predecessor, remote_head: candidate, forced: false, deleted: false };
  assert.deepEqual(await exercise(candidate), {
    result: { kind: 'OK', value: matchingValue, receipt_sha256: sha256(canonicalJson(matchingValue)) },
    authority_reads: [{ target: '/root/key', expectedMode: 0o640 }],
    invocations: [expectedLocalRefCall, expectedRemoteReadCall, expectedPushCall, expectedRemoteReadCall],
    operations: ['rev-parse', 'ls-remote', 'push', 'ls-remote'],
    push_refspec: `${candidate}:refs/heads/${branch}`,
    push_count: 1, remote_head: candidate,
  }, 'CAUSAL_RED: the exact local Candidate permits only predecessor read, exact Candidate refspec push, and remote Candidate readback');
  const advancedResult = await exercise(advanced);
  assert.deepEqual(Object.keys(advancedResult.result).sort(), ['kind', 'observed_identity', 'reason'], 'CAUSAL_RED: an advanced local ref is a closed CONFLICT result, never an exception proxy');
  assert.equal(advancedResult.result.kind, 'CONFLICT');
  assert.equal(advancedResult.result.observed_identity, advanced, 'CAUSAL_RED: local-ref conflict identifies the independently observed advanced Head');
  assert.deepEqual({
    authority_reads: advancedResult.authority_reads,
    invocations: advancedResult.invocations,
    operations: advancedResult.operations,
    push_refspec: advancedResult.push_refspec,
    push_count: advancedResult.push_count,
    remote_head: advancedResult.remote_head,
  }, {
    authority_reads: [{ target: '/root/key', expectedMode: 0o640 }],
    invocations: [expectedLocalRefCall],
    operations: ['rev-parse'], push_refspec: null, push_count: 0, remote_head: predecessor,
  }, 'CAUSAL_RED: an advanced local ref stops before remote observation or push and leaves the remote predecessor unchanged');
  assert.ok(['CAS_CONFLICT', 'REMOTE_CONFLICT', 'READBACK_MISMATCH', 'FORBIDDEN_TARGET', 'DIRTY_WORKTREE', 'NON_FAST_FORWARD'].includes(advancedResult.result.reason), 'CAUSAL_RED: local-ref conflict must remain within the frozen six-member CONFLICT reason contract');
});
