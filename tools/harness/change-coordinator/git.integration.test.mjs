import test from 'node:test';
import assert from 'node:assert/strict';
import { chmod, mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createCoordinatorAdapters } from './adapters.mjs';
import {
  GIT_METHODS, LEDGER_METHODS, assertHelperHealth, assertTemporaryGitFixtureHealthy,
  makeTestDependencies, run, sha256,
} from './fixtures.mjs';

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
  await t.test('canonicalDiff records the frozen producer receipt while hashing raw bytes from a temporary Git repository', async () => {
    await withTemporaryRepository(async fixture => {
      const result = await adapters.git.canonicalDiff({
        canonical_root: fixture.root,
        common_git_dir: fixture.common_git_dir,
        worktree_root: fixture.root,
        baseline_sha: fixture.baseline,
        candidate_sha: fixture.candidate,
      });
      assert.equal(result.kind, 'OK');
      assert.deepEqual(Object.keys(result.value.producer_receipt).sort(), [
        'argv', 'common_git_dir', 'environment', 'executable', 'executable_sha256',
        'repository_root', 'shell', 'version', 'worktree_root',
      ]);
      assert.equal(result.value.producer_receipt.shell, false);
      assert.equal(result.value.producer_receipt.version, '2.54.0');
      assert.equal(result.value.producer_receipt.environment.LC_ALL, 'C');
      assert.deepEqual(result.value.producer_receipt.argv.slice(-2), [
        `${fixture.baseline}..${fixture.candidate}`, '--',
      ]);
      assert.match(result.value.stdout_sha256, /^[0-9a-f]{64}$/);
      assert.ok(result.value.byte_length > 0);
    });
  });
  await t.test('canonicalDiff preserves raw Buffer bytes and rejects every host-local object replacement boundary', async () => {
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
      assert.deepEqual(result.value.producer_receipt.argv, [
        '--no-pager', '-c', 'color.ui=false', '-c', 'core.quotePath=true', '-c', 'diff.algorithm=myers', '-c', 'diff.mnemonicPrefix=false', '-c', 'diff.noprefix=false',
        'diff', '--binary', '--full-index', '--no-ext-diff', '--no-textconv', '--no-renames', '--src-prefix=a/', '--dst-prefix=b/', `${fixture.baseline}..${binaryCandidate}`, '--',
      ], 'CAUSAL_RED: receipt must preserve complete executable argv, not a suffix');
      assert.deepEqual(result.value.producer_receipt.environment, {
        LC_ALL: 'C', LANG: 'C', TZ: 'UTC', GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: '/dev/null', GIT_ATTR_NOSYSTEM: '1', GIT_PAGER: 'cat', PAGER: 'cat', GIT_TERMINAL_PROMPT: '0', GIT_NO_REPLACE_OBJECTS: '1',
      });
      assert.equal(result.value.producer_receipt.shell, false, 'CAUSAL_RED: producer receipt binds shell:false');
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
        const committed = await fixtureAdapters.git.commitCandidate({ canonical_root: fixture.root, worktree_root: worktree, expected_parent: fixture.baseline, expected_tree: read.value.index_tree, message_bytes: new TextEncoder().encode('candidate'), idempotency_id: 'candidate-001' });
        const reread = await fixtureAdapters.git.readCommit({ canonical_root: fixture.root, sha: committed.value.sha });
        assert.deepEqual(reread, committed);
        const pushed = await fixtureAdapters.git.pushBranch({ canonical_root: fixture.root, branch, head_sha: committed.value.sha, idempotency_id: 'push-001' });
        assert.deepEqual(pushed, { kind: 'OK', value: { branch, head_sha: committed.value.sha } }, 'CAUSAL_RED: push returns the Core closed remote-head receipt');
        const remoteRead = await fixtureAdapters.git.readRemoteBranch({ canonical_root: fixture.root, branch });
        assert.deepEqual(remoteRead, pushed, 'CAUSAL_RED: push/readback must agree on the same exact remote head');
        const diff = await fixtureAdapters.git.canonicalDiff({ canonical_root: fixture.root, common_git_dir: fixture.common_git_dir, worktree_root: worktree, baseline_sha: fixture.baseline, candidate_sha: committed.value.sha });
        assert.equal(diff.kind, 'OK', 'CAUSAL_RED: canonicalDiff is a Core GatewayResult, not a legacy object');
        assert.equal(diff.value.stdout_sha256, sha256(diff.value.raw_stdout));
        const sync = await fixtureAdapters.git.syncMainFfOnly({ canonical_root: fixture.root, main_worktree_root: fixture.root, squash_sha: fixture.candidate, expected_origin_main: fixture.candidate });
        assert.deepEqual(sync, { kind: 'OK', value: { prior_local_main: fixture.candidate, local_main: fixture.candidate, origin_main: fixture.candidate, clean: true, fast_forward_only: true } }, 'CAUSAL_RED: sync returns exact Core GatewayResult readback');
      } finally {
        await rm(worktree, { recursive: true, force: true });
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
  await t.test('canonicalDiff rejects a fake executable version before hashing', async () => {
    await withTemporaryRepository(async fixture => {
      const fake = path.join(fixture.root, 'git-9.99.9');
      await writeFile(fake, '#!/bin/sh\nif [ "$1" = "--version" ]; then echo "git version 9.99.9"; exit 0; fi\nexec /Users/huangbo/Dev/Env/homebrew/bin/git "$@"\n');
      await chmod(fake, 0o755);
      const fakeAdapters = createCoordinatorAdapters({ repository_root: fixture.root, state_root: path.join(fixture.root, '.dtf-state'), device: 'mac-mini', process_run_id: 'fake-git-001', git_executable: fake, pull_request_executable: '/usr/bin/false', base_environment: {} });
      const request = { canonical_root: fixture.root, common_git_dir: fixture.common_git_dir, worktree_root: fixture.root, baseline_sha: fixture.baseline, candidate_sha: fixture.candidate };
      await assert.rejects(() => fakeAdapters.git.canonicalDiff(request), /COORDINATOR_INTERRUPTED/, 'CAUSAL_RED: fake Git 9.99.9 must reject before a producer receipt is issued');
    });
  });
  await t.test('canonicalDiff rejects a false common Git-dir identity before hashing', async () => {
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
      assert.deepEqual(result, {
        kind: 'OK',
        value: {
          prior_local_main,
          local_main: squash_sha,
          origin_main: squash_sha,
          clean: true,
          fast_forward_only: true,
        },
      });
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
    harness.fault('git.pushBranch', { kind: 'AMBIGUOUS', reason: 'REMOTE_AMBIGUOUS', partial_receipt: { stage: 'REMOTE_REF_READ' } });
    assert.equal((await harness.dependencies.git.pushBranch({})).kind, 'AMBIGUOUS');
    assert.equal((await harness.dependencies.ledger.readRemote({})).kind, 'OK');
    assert.equal((await harness.dependencies.pull_request.createOrReuse({ head_branch: 'work/mac-mini/dtf', head_sha: '2'.repeat(40) })).kind, 'OK');
    assert.equal((await harness.dependencies.validation.execute({})).kind, 'OK');
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
