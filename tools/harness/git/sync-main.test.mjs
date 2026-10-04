import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, chmodSync, rmSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const command = fileURLToPath(new URL('./sync-main', import.meta.url));
const env = { ...process.env, GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: '/dev/null', GIT_TERMINAL_PROMPT: '0', LC_ALL: 'C' };
function run(cwd, executable, args, extra = {}) {
  return spawnSync(executable, args, { cwd, env: { ...env, ...extra }, encoding: 'utf8', timeout: 20000 });
}
function git(cwd, ...args) {
  const r = run(cwd, 'git', args);
  assert.equal(r.status, 0, r.stderr);
  return r.stdout.trim();
}
function fixture(t) {
  const root = mkdtempSync(path.join(tmpdir(), 'juanerai-sync-main-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const origin = path.join(root, 'origin.git');
  const seed = path.join(root, 'seed');
  const local = path.join(root, 'local');
  const peer = path.join(root, "peer space's repo");
  git(root, 'init', '--bare', '--initial-branch=main', origin);
  git(root, 'init', '--initial-branch=main', seed);
  git(seed, 'config', 'user.name', 'Test');
  git(seed, 'config', 'user.email', 'test@example.invalid');
  writeFileSync(path.join(seed, 'tracked'), 'base\n');
  git(seed, 'add', 'tracked');
  git(seed, 'commit', '-m', 'base');
  git(seed, 'remote', 'add', 'origin', origin);
  git(seed, 'push', 'origin', 'main');
  git(root, 'clone', origin, local);
  git(root, 'clone', origin, peer);
  const before = git(local, 'rev-parse', 'main');
  for (const repo of [local, peer]) git(repo, 'switch', '-c', 'work/test');
  const target = `peer:${peer}`;
  git(local, 'config', '--local', '--add', 'sync.targets', target);
  git(peer, 'config', '--local', '--add', 'sync.targets', `peer:${local}`);
  writeFileSync(path.join(seed, 'tracked'), 'merged\n');
  git(seed, 'commit', '-am', 'merge');
  git(seed, 'push', 'origin', 'main');
  const tip = git(seed, 'rev-parse', 'main');
  const bin = path.join(root, 'bin');
  mkdirSync(bin);
  writeFileSync(path.join(bin, 'ssh'), '#!/bin/sh\n[ "$1" = -T ] || exit 99\nshift\nfor option in BatchMode=yes StrictHostKeyChecking=yes ConnectTimeout=10 ConnectionAttempts=1 ServerAliveInterval=5 ServerAliveCountMax=2; do\n[ "$1" = -o ] && [ "$2" = "$option" ] || exit 99\nshift 2\ndone\n[ "$1" = peer ] || exit 255\nshift\nif [ -n "${SYNC_PEER_HOOK-}" ]; then sh "$SYNC_PEER_HOOK" || exit; fi\nexec sh -c "$1"\n');
  chmodSync(path.join(bin, 'ssh'), 0o755);
  return { root, origin, seed, local, peer, target, before, tip, bin,
    sync: (args = [], cwd = local, extra = {}) => run(cwd, 'sh', [command, ...args], { PATH: `${bin}:${env.PATH}`, ...extra }) };
}

test('AC1: one invocation fast-forwards both unoccupied main refs to the same origin commit', t => {
  const f = fixture(t);
  const result = f.sync();
  assert.equal(result.status, 0, result.stdout + result.stderr);
  for (const repo of [f.local, f.peer]) {
    assert.equal(git(repo, 'rev-parse', 'main'), f.tip);
    assert.equal(git(repo, 'symbolic-ref', '--short', 'HEAD'), 'work/test');
    assert.equal(readFileSync(path.join(repo, 'tracked'), 'utf8'), 'base\n');
  }
  assert.match(result.stdout, /ref-only/);
});

test('AC1: reverse-first invocation fast-forwards both behind main refs', t => {
  const f = fixture(t);
  for (const repo of [f.local, f.peer]) assert.equal(git(repo, 'rev-parse', 'main'), f.before);
  const result = f.sync([], f.peer);
  assert.equal(result.status, 0, result.stdout + result.stderr);
  for (const repo of [f.local, f.peer]) assert.equal(git(repo, 'rev-parse', 'main'), f.tip);
  assert.match(result.stdout, /ref-only/);
});

function snapshot(repo) {
  return { branch: git(repo, 'symbolic-ref', '--short', 'HEAD'), head: git(repo, 'rev-parse', 'HEAD'),
    index: readFileSync(git(repo, 'rev-parse', '--path-format=absolute', '--git-path', 'index')).toString('hex'),
    tracked: readFileSync(path.join(repo, 'tracked'), 'utf8'), status: git(repo, 'status', '--porcelain=v1') };
}
function treeFiles(directory) {
  const entries = {};
  for (const item of readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, item.name);
    if (item.isDirectory()) Object.assign(entries, treeFiles(file));
    else if (item.isFile()) entries[file] = readFileSync(file).toString('hex');
  }
  return entries;
}

test('AC2: dirty non-main index, files, untracked files and branch remain byte-identical; repeat and reverse direction work', t => {
  const f = fixture(t);
  for (const repo of [f.local, f.peer]) {
    writeFileSync(path.join(repo, 'tracked'), 'staged\n');
    git(repo, 'add', 'tracked');
    writeFileSync(path.join(repo, 'tracked'), 'unstaged\n');
    writeFileSync(path.join(repo, 'untracked'), 'untracked\n');
  }
  const states = [snapshot(f.local), snapshot(f.peer)];
  for (const cwd of [f.local, f.local, f.peer]) {
    const result = f.sync([], cwd);
    assert.equal(result.status, 0, result.stdout + result.stderr);
    for (const [i, repo] of [f.local, f.peer].entries()) {
      assert.equal(git(repo, 'rev-parse', 'main'), f.tip);
      assert.deepEqual(snapshot(repo), states[i]);
      assert.equal(readFileSync(path.join(repo, 'untracked'), 'utf8'), 'untracked\n');
    }
  }
});

test('AC3: checked-out main is skipped by default; exact explicit idle consent permits clean FF on each side', t => {
  const f = fixture(t);
  for (const repo of [f.local, f.peer]) git(repo, 'switch', 'main');
  const blocked = f.sync();
  assert.notEqual(blocked.status, 0);
  for (const repo of [f.local, f.peer]) assert.equal(git(repo, 'rev-parse', 'main'), f.before);
  assert.match(blocked.stderr, /idle-worktree permission/);
  const result = f.sync(['--allow-main-worktree', 'local', '--allow-main-worktree', f.target]);
  assert.equal(result.status, 0, result.stdout + result.stderr);
  for (const repo of [f.local, f.peer]) {
    assert.equal(git(repo, 'rev-parse', 'main'), f.tip);
    assert.equal(readFileSync(path.join(repo, 'tracked'), 'utf8'), 'merged\n');
  }
  assert.match(result.stdout, /mode=worktree/);
});

test('AC3: consent never overrides dirty main, operation state or main in another worktree', t => {
  const f = fixture(t);
  git(f.peer, 'switch', 'main');
  writeFileSync(path.join(f.peer, 'tracked'), 'active\n');
  const state = snapshot(f.peer);
  let result = f.sync(['--allow-main-worktree', f.target]);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /main is dirty/);
  assert.deepEqual(snapshot(f.peer), state);
  assert.equal(git(f.local, 'rev-parse', 'main'), f.tip, 'successful local side retained');
  writeFileSync(path.join(f.peer, 'tracked'), 'base\n');
  const marker = path.join(f.peer, '.git', 'MERGE_HEAD');
  writeFileSync(marker, `${f.before}\n`);
  result = f.sync(['--allow-main-worktree', f.target]);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /operation in progress/);
  assert.equal(readFileSync(marker, 'utf8'), `${f.before}\n`);
  rmSync(marker);
  git(f.peer, 'switch', 'work/test');
  const other = path.join(f.root, 'other-main');
  git(f.peer, 'worktree', 'add', other, 'main');
  result = f.sync(['--allow-main-worktree', f.target]);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /another worktree/);
  assert.equal(git(f.peer, 'rev-parse', 'main'), f.before);
  assert.equal(readFileSync(path.join(other, 'tracked'), 'utf8'), 'base\n');
});

test('AC4: divergent local main is refused without rolling back successful peer', t => {
  const f = fixture(t);
  git(f.local, 'config', 'user.name', 'Test');
  git(f.local, 'config', 'user.email', 'test@example.invalid');
  writeFileSync(path.join(f.local, 'tracked'), 'local divergence\n');
  git(f.local, 'commit', '-am', 'divergent');
  const divergent = git(f.local, 'rev-parse', 'HEAD');
  git(f.local, 'branch', '-f', 'main', divergent); // Fixture only; command forbids forced updates.
  const result = f.sync();
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /diverged or is ahead/);
  assert.equal(git(f.local, 'rev-parse', 'main'), divergent);
  assert.equal(git(f.peer, 'rev-parse', 'main'), f.tip);
});

test('AC4: missing configuration fails before local writes; unavailable and missing peers remain aggregate failures', t => {
  const f = fixture(t);
  git(f.local, 'config', '--local', '--unset-all', 'sync.targets');
  const before = treeFiles(f.local);
  let result = f.sync();
  assert.notEqual(result.status, 0);
  assert.deepEqual(treeFiles(f.local), before);
  for (const target of [`unavailable:${f.peer}`, `peer:${f.root}/missing`]) {
    git(f.local, 'config', '--local', 'sync.targets', target);
    result = f.sync();
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /failed/);
  }
  assert.equal(git(f.local, 'rev-parse', 'main'), f.tip);
  assert.equal(git(f.peer, 'rev-parse', 'main'), f.before);
});

test('AC4: wrong origin, a nested directory and absent main are refused', t => {
  const f = fixture(t);
  git(f.peer, 'remote', 'set-url', 'origin', `${f.origin}-different`);
  let result = f.sync();
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /origin identity differs/);
  git(f.peer, 'remote', 'set-url', 'origin', f.origin);
  mkdirSync(path.join(f.peer, 'nested'));
  git(f.local, 'config', '--local', 'sync.targets', `${f.target}/nested`);
  result = f.sync();
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /repository root/);
  git(f.local, 'config', '--local', 'sync.targets', f.target);
  git(f.peer, 'branch', '-D', 'main'); // Fixture only.
  result = f.sync();
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /main is missing/);
});

test('AC4: malformed configuration and unmatched consent fail before changing any local refs', t => {
  const f = fixture(t);
  for (const target of ['-bad:/tmp/repo', 'peer:relative', 'peer:/tmp/repo\npeer:/tmp/other', 'host;touch:/tmp/repo']) {
    git(f.local, 'config', '--local', 'sync.targets', target);
    const before = treeFiles(f.local);
    const result = f.sync();
    assert.notEqual(result.status, 0);
    assert.deepEqual(treeFiles(f.local), before);
  }
  git(f.local, 'config', '--local', 'sync.targets', f.target);
  const result = f.sync(['--allow-main-worktree', 'peer:/different']);
  assert.notEqual(result.status, 0);
  assert.equal(git(f.local, 'rev-parse', 'main'), f.before);
});

test('AC5: --check reports missing ancestry evidence and writes zero files in either repository', t => {
  const f = fixture(t);
  const before = [treeFiles(f.local), treeFiles(f.peer)];
  const result = f.sync(['--check']);
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.match(result.stdout, /ancestry=unverified-until-fetch/);
  assert.deepEqual(treeFiles(f.local), before[0]);
  assert.deepEqual(treeFiles(f.peer), before[1]);
});

test('AC6: hostile shell text in an otherwise valid absolute peer path is quoted, not executed', t => {
  const f = fixture(t);
  const marker = path.join(f.root, 'injected');
  git(f.local, 'config', '--local', 'sync.targets', `peer:${f.peer}'; touch '${marker}`);
  const result = f.sync();
  assert.notEqual(result.status, 0);
  assert.equal(readdirSync(f.root).includes('injected'), false);
  assert.equal(git(f.peer, 'rev-parse', 'main'), f.before);
});

test('AC4: already-current checked-out main succeeds without consent and leaves dirty files untouched', t => {
  const f = fixture(t);
  assert.equal(f.sync().status, 0);
  for (const repo of [f.local, f.peer]) {
    git(repo, 'switch', 'main');
    writeFileSync(path.join(repo, 'tracked'), 'active work\n');
  }
  const states = [treeFiles(f.local), treeFiles(f.peer)];
  const result = f.sync();
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.match(result.stdout, /up-to-date/);
  assert.deepEqual(treeFiles(f.local), states[0]);
  assert.deepEqual(treeFiles(f.peer), states[1]);
});

test('AC1: saved command supports relative invocation from a subdirectory and a source path containing spaces', t => {
  const f = fixture(t);
  const saved = path.join(f.local, 'saved command');
  writeFileSync(saved, readFileSync(command));
  chmodSync(saved, 0o755);
  const subdir = path.join(f.local, 'subdir');
  mkdirSync(subdir);
  const result = run(subdir, 'sh', ['../saved command'], { PATH: `${f.bin}:${env.PATH}` });
  assert.equal(result.status, 0, result.stdout + result.stderr);
  for (const repo of [f.local, f.peer]) assert.equal(git(repo, 'rev-parse', 'main'), f.tip);
});

test('AC4: origin advancing between devices does not synchronize the peer to an unpinned commit', t => {
  const f = fixture(t);
  const hook = path.join(f.root, 'advance-origin');
  writeFileSync(hook, `#!/bin/sh\ngit -C '${f.seed}' commit --allow-empty -m next >/dev/null && git -C '${f.seed}' push origin main >/dev/null\n`);
  const result = f.sync([], f.local, { SYNC_PEER_HOOK: hook });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /origin\/main changed after pinning/);
  assert.equal(git(f.local, 'rev-parse', 'main'), f.tip);
  assert.equal(git(f.peer, 'rev-parse', 'main'), f.before);
  const next = git(f.seed, 'rev-parse', 'main');
  assert.notEqual(next, f.tip);
  assert.equal(f.sync().status, 0);
  for (const repo of [f.local, f.peer]) assert.equal(git(repo, 'rev-parse', 'main'), next);
});

test('AC6: authorized main worktree update does not execute repository hooks', t => {
  const f = fixture(t);
  const hooks = path.join(f.root, 'hooks');
  mkdirSync(hooks);
  const marker = path.join(f.root, 'hook-ran');
  writeFileSync(path.join(hooks, 'post-merge'), `#!/bin/sh\ntouch '${marker}'\n`);
  chmodSync(path.join(hooks, 'post-merge'), 0o755);
  git(f.peer, 'config', 'core.hooksPath', hooks);
  git(f.peer, 'switch', 'main');
  const result = f.sync(['--allow-main-worktree', f.target]);
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.equal(readdirSync(f.root).includes('hook-ran'), false);
});

test('AC4: global-only peer configuration never permits local-only success', t => {
  const f = fixture(t);
  git(f.local, 'config', '--local', '--unset-all', 'sync.targets');
  const global = path.join(f.root, 'global-config');
  git(f.local, 'config', '--file', global, 'sync.targets', f.target);
  const result = f.sync([], f.local, { GIT_CONFIG_GLOBAL: global });
  assert.notEqual(result.status, 0);
  assert.equal(git(f.local, 'rev-parse', 'main'), f.before);
});

test('AC6: updating caller main cannot replace the script streamed to its peer', t => {
  const f = fixture(t);
  const relative = 'tools/harness/git/sync-main';
  mkdirSync(path.dirname(path.join(f.seed, relative)), { recursive: true });
  writeFileSync(path.join(f.seed, relative), readFileSync(command));
  git(f.seed, 'add', relative);
  git(f.seed, 'commit', '-m', 'install initial sync command');
  git(f.seed, 'push', 'origin', 'main');
  git(f.local, 'switch', 'main');
  git(f.local, 'pull', '--ff-only');
  git(f.peer, 'fetch', 'origin');
  git(f.peer, 'branch', '-f', 'main', 'origin/main'); // Fixture only.
  writeFileSync(path.join(f.seed, relative), '#!/bin/sh\necho replaced-script >&2\nexit 0\n');
  git(f.seed, 'commit', '-am', 'replace command on main');
  git(f.seed, 'push', 'origin', 'main');
  const target = git(f.seed, 'rev-parse', 'main');
  const result = run(f.local, 'sh', [relative, '--allow-main-worktree', 'local'], { PATH: `${f.bin}:${env.PATH}` });
  assert.equal(result.status, 0, result.stdout + result.stderr);
  for (const repo of [f.local, f.peer]) assert.equal(git(repo, 'rev-parse', 'main'), target);
  assert.equal(readFileSync(path.join(f.local, relative), 'utf8'), '#!/bin/sh\necho replaced-script >&2\nexit 0\n');
  assert.doesNotMatch(result.stderr, /replaced-script/);
});
