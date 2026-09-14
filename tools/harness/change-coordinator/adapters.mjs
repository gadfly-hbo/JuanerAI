import { createHash } from 'node:crypto';
import { mkdir, open, readFile, realpath, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';

export const PINNED_GIT_VERSION = '2.54.0';
export const PINNED_GIT_EXECUTABLE_SHA256 = '6b348e2246cd4566a129c34a918ff2381c37eda817797d5bdd64ce719ff068ab';

const sha256 = value => createHash('sha256').update(value).digest('hex');
const canonical = value => Array.isArray(value)
  ? `[${value.map(canonical).join(',')}]`
  : value && typeof value === 'object'
    ? `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`
    : JSON.stringify(value);
const closed = (value, keys) => value !== null
  && typeof value === 'object'
  && Object.getPrototypeOf(value) === Object.prototype
  && Object.keys(value).length === keys.length
  && Reflect.ownKeys(value).length === keys.length
  && keys.every(key => Object.hasOwn(value, key))
  && Reflect.ownKeys(value).every(key => typeof key === 'string');

function interrupted(cause) {
  return Object.assign(new Error('COORDINATOR_INTERRUPTED'), { code: 'COORDINATOR_INTERRUPTED', cause });
}

function inputInvalid() {
  return Object.assign(new Error('COORDINATOR_INPUT_INVALID'), { code: 'COORDINATOR_INPUT_INVALID' });
}

async function run(executable, args, {
  cwd, environment = {}, timeout_ms = 60_000, runtime_uid = undefined, runtime_gid = undefined, input = undefined,
} = {}) {
  const physicalCwd = await realpath(cwd).catch(() => cwd);
  const options = { runtime_uid, runtime_gid };
  return new Promise((resolve, reject) => {
    const child = spawn(executable, args, {
      cwd: physicalCwd, env: { ...environment, LC_ALL: 'C' }, shell: false,
      uid: options.runtime_uid, gid: options.runtime_gid,
    });
    child.stdin?.end(input);
    let stdout = '';
    let stderr = '';
    let settled = false;
    let timedOut = false;
    let killTimer = null;
    const terminate = () => {
      child.kill('SIGTERM');
      killTimer = setTimeout(() => child.kill('SIGKILL'), 100);
    };
    const finish = (callback, value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      clearTimeout(killTimer);
      process.off('SIGINT', onSignal);
      process.off('SIGTERM', onSignal);
      callback(value);
    };
    const onSignal = () => {
      terminate();
    };
    const timer = setTimeout(() => {
      timedOut = true;
      terminate();
    }, timeout_ms);
    child.stdout?.setEncoding('utf8');
    child.stderr?.setEncoding('utf8');
    child.stdout?.on('data', chunk => { stdout += chunk; });
    child.stderr?.on('data', chunk => { stderr += chunk; });
    child.once('error', error => finish(reject, interrupted(error)));
    child.once('close', (code, signal) => {
      if (signal || timedOut) return finish(reject, interrupted());
      return finish(resolve, { code, stdout, stderr });
    });
    process.once('SIGINT', onSignal);
    process.once('SIGTERM', onSignal);
  });
}

async function runBuffer(executable, args, {
  cwd, environment = {}, timeout_ms = 60_000, runtime_uid = undefined, runtime_gid = undefined, input = undefined,
} = {}) {
  const physicalCwd = await realpath(cwd).catch(() => cwd);
  const options = { runtime_uid, runtime_gid };
  return new Promise((resolve, reject) => {
    const child = spawn(executable, args, {
      cwd: physicalCwd, env: { ...environment, LC_ALL: 'C' }, shell: false,
      uid: options.runtime_uid, gid: options.runtime_gid,
    });
    child.stdin?.end(input);
    const stdout = []; const stderr = []; let settled = false; let timedOut = false;
    const finish = (callback, value) => { if (settled) return; settled = true; clearTimeout(timer); callback(value); };
    const timer = setTimeout(() => { timedOut = true; child.kill('SIGTERM'); }, timeout_ms);
    child.stdout?.on('data', chunk => stdout.push(Buffer.from(chunk)));
    child.stderr?.on('data', chunk => stderr.push(Buffer.from(chunk)));
    child.once('error', error => finish(reject, interrupted(error)));
    child.once('close', (code, signal) => {
      if (signal || timedOut) return finish(reject, interrupted());
      return finish(resolve, { code, stdout: Buffer.concat(stdout), stderr: Buffer.concat(stderr) });
    });
  });
}

async function command(executable, args, options) {
  const result = await run(executable, args, options);
  if (result.code !== 0) throw interrupted();
  return result.stdout.trim();
}

function gitCommand(options, cwd, args) {
  return command(options.git_executable, args, {
    cwd, environment: options.base_environment,
    runtime_uid: options.runtime_uid, runtime_gid: options.runtime_gid,
  });
}

async function gitBytes(options, cwd, args) {
  const result = await run(options.git_executable, args, {
    cwd, environment: options.base_environment,
    runtime_uid: options.runtime_uid, runtime_gid: options.runtime_gid,
  });
  if (result.code !== 0) throw interrupted();
  return result.stdout;
}

function parseNameStatus(raw) {
  const rows = raw.split('\0').filter(Boolean);
  const entries = [];
  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index];
    const separator = row.indexOf('\t');
    if (separator >= 1) {
      entries.push({ status: row.slice(0, separator), path: row.slice(separator + 1) });
      continue;
    }
    const entryPath = rows[index + 1];
    if (!/^[A-Z?][A-Z?]?$/.test(row) || entryPath === undefined) throw inputInvalid();
    entries.push({ status: row, path: entryPath });
    index += 1;
  }
  return entries;
}

function parseWorktreeStatus(raw) {
  const entries = [];
  for (const row of raw.split('\0').filter(Boolean)) {
    const match = /^(.)(.) (.*)$/su.exec(row);
    if (!match) throw interrupted();
    const [, index, worktree, value] = match;
    if (index !== ' ' && !(index === '?' && worktree === '?')) throw interrupted();
    const status = worktree === 'M' ? 'MODIFIED'
      : worktree === 'D' ? 'DELETED'
        : worktree === 'T' ? 'TYPE_CHANGED'
          : index === '?' && worktree === '?' ? 'UNTRACKED' : null;
    if (!status || !value || path.isAbsolute(value) || value === '.' || value === '..' || value.includes('\0') || value.includes('\\') || value.split('/').some(part => part === '..' || part === '.')) throw interrupted();
    entries.push({ path: value, status, mode: null, object_sha: null });
  }
  entries.sort((left, right) => Buffer.compare(Buffer.from(left.path), Buffer.from(right.path)));
  if (entries.some((entry, index) => index && entry.path === entries[index - 1].path)) throw interrupted();
  return entries;
}

function requireSafeChangeBranch(branch) {
  if (typeof branch !== 'string' || !/^work\/mac-mini\/[a-z0-9]+(?:-[a-z0-9]+)*$/.test(branch)) throw interrupted();
}

function readPhysicalCommit(raw, sha) {
  if (typeof raw !== 'string' || Buffer.from(raw, 'utf8').toString('utf8') !== raw) throw interrupted();
  const separator = raw.indexOf('\n\n');
  if (separator < 0) throw interrupted();
  const header = raw.slice(0, separator).split('\n');
  if (!/^tree [0-9a-f]{40}$/.test(header[0] ?? '')) throw interrupted();
  const parents = header.filter(line => line.startsWith('parent'));
  if (parents.some(line => !/^parent [0-9a-f]{40}$/.test(line) || line.slice('parent '.length) === '0'.repeat(40) || line.slice('parent '.length) === sha)) throw interrupted();
  if (!header.some(line => /^author .+ [0-9]+ [+-][0-9]{4}$/.test(line)) || !header.some(line => /^committer .+ [0-9]+ [+-][0-9]{4}$/.test(line))) throw interrupted();
  return { tree: header[0].slice('tree '.length), parents: parents.map(line => line.slice('parent '.length)), message: raw.slice(separator + 2) };
}

async function readPhysicalCommitBytes(options, cwd, sha) {
  const result = await run(options.git_executable, ['cat-file', 'commit', sha], {
    cwd, environment: options.base_environment, runtime_uid: options.runtime_uid, runtime_gid: options.runtime_gid,
  });
  if (result.code !== 0 || result.stderr !== '') throw interrupted();
  return result.stdout;
}

export function createCoordinatorAdapters(options) {
  const baseOptionKeys = [
    'repository_root', 'state_root', 'device', 'process_run_id',
    'git_executable', 'pull_request_executable', 'base_environment',
  ];
  const hasRuntimeIdentity = Object.hasOwn(options ?? {}, 'runtime_uid') || Object.hasOwn(options ?? {}, 'runtime_gid');
  const optionKeys = hasRuntimeIdentity ? [...baseOptionKeys, 'runtime_uid', 'runtime_gid'] : baseOptionKeys;
  const environment = options?.base_environment;
  const validEnvironment = environment !== null
    && typeof environment === 'object'
    && !Array.isArray(environment)
    && Object.getPrototypeOf(environment) === Object.prototype
    && Object.entries(environment).every(([key, value]) => typeof key === 'string' && typeof value === 'string')
    && Object.keys(environment).length === 0;
  const validOptions = closed(options, optionKeys)
    && path.isAbsolute(options.repository_root)
    && path.isAbsolute(options.state_root)
    && path.isAbsolute(options.git_executable)
    && path.isAbsolute(options.pull_request_executable)
    && ['macbook', 'mac-mini'].includes(options.device)
    && typeof options.process_run_id === 'string'
    && options.process_run_id
    && (!hasRuntimeIdentity || Number.isSafeInteger(options.runtime_uid) && Number.isSafeInteger(options.runtime_gid)
      && options.runtime_uid > 0 && options.runtime_gid >= 0)
    && validEnvironment;
  if (!validOptions) {
    throw Object.assign(new Error('COORDINATOR_INPUT_INVALID'), { code: 'COORDINATOR_INPUT_INVALID' });
  }
  const opt = { ...options, base_environment: {
    LC_ALL: 'C', LANG: 'C', TZ: 'UTC', GIT_CONFIG_NOSYSTEM: '1',
    GIT_CONFIG_GLOBAL: '/dev/null', GIT_ATTR_NOSYSTEM: '1', GIT_PAGER: 'cat',
    PAGER: 'cat', GIT_TERMINAL_PROMPT: '0', GIT_NO_REPLACE_OBJECTS: '1',
  } };
  let pinReceipt = null;
  // A Candidate retry is only meaningful inside the same live Adapter
  // invocation chain.  The transient entry is created before its first
  // mutation and records the exact object plus the consumed CAS budget.  A
  // duplicate request can therefore converge, or finish one known-absent CAS,
  // without creating another object or moving a ref after prior success.  A
  // different Candidate request evicts the old worktree entry; nothing is
  // persisted or exposed.
  const candidateContinuations = new Map();
  const assertPinnedGit = async () => {
    if (pinReceipt) return pinReceipt;
    const executable_sha256 = sha256(await readFile(opt.git_executable));
    const version = await command(opt.git_executable, ['--version'], {
      cwd: opt.repository_root,
      environment: {
        LC_ALL: 'C', LANG: 'C', TZ: 'UTC', GIT_CONFIG_NOSYSTEM: '1',
        GIT_CONFIG_GLOBAL: '/dev/null', GIT_ATTR_NOSYSTEM: '1',
        GIT_PAGER: 'cat', PAGER: 'cat', GIT_TERMINAL_PROMPT: '0',
        GIT_NO_REPLACE_OBJECTS: '1',
      },
      runtime_uid: opt.runtime_uid,
      runtime_gid: opt.runtime_gid,
    });
    if (version !== `git version ${PINNED_GIT_VERSION}` || executable_sha256 !== PINNED_GIT_EXECUTABLE_SHA256) throw interrupted();
    pinReceipt = { version: PINNED_GIT_VERSION, executable_sha256 };
    return pinReceipt;
  };
  const filesystem = {
    writeBytesAtomic: async ({ path: value, bytes }) => {
      await mkdir(path.dirname(value), { recursive: true });
      const temporary = `${value}.tmp-${process.pid}`;
      await writeFile(temporary, bytes);
      const file = await open(temporary, 'r');
      await file.sync();
      await file.close();
      await rename(temporary, value);
      const directory = await open(path.dirname(value), 'r');
      await directory.sync();
      await directory.close();
      return { sha256: sha256(bytes) };
    },
  };

  const ok = value => ({ kind: 'OK', value, receipt_sha256: sha256(canonical(value)) });
  const stagedReceipt = async worktree_root => {
    const entries = parseNameStatus(await gitBytes(opt, worktree_root, ['diff', '--cached', '--name-status', '-z', '--no-renames']));
    const staged_paths = entries.map(entry => entry.path).sort();
    const index_tree = await gitCommand(opt, worktree_root, ['write-tree']);
    return ok({ staged_paths, index_tree, staged_paths_sha256: sha256(canonical(staged_paths)) });
  };
  const git = Object.freeze({
    inspectRepository: async ({ repository_root = opt.repository_root, origin = 'origin', integration_branch = 'main' }) => ok({ canonical_root: await realpath(repository_root), origin, integration_branch, head_sha: await gitCommand(opt, repository_root, ['rev-parse', 'HEAD']) }),
    createOrReuseWorktree: async ({ canonical_root = opt.repository_root, worktree_root, branch, baseline_sha }) => {
      requireSafeChangeBranch(branch);
      await gitCommand(opt, canonical_root, ['worktree', 'add', '-b', branch, worktree_root, baseline_sha]);
      const common_git_dir = await realpath(path.resolve(worktree_root, await gitCommand(opt, worktree_root, ['rev-parse', '--git-common-dir'])));
      const head_sha = await gitCommand(opt, worktree_root, ['rev-parse', 'HEAD']);
      if (head_sha !== baseline_sha) throw interrupted();
      return ok({ worktree_root, branch, baseline_sha, head_sha, common_git_dir, clean: (await gitBytes(opt, worktree_root, ['status', '--porcelain=v1', '-z'])).length === 0 });
    },
    inspectWorktree: async ({ worktree_root, expected_branch = undefined, expected_head = undefined }) => {
      const branch = await gitCommand(opt, worktree_root, ['branch', '--show-current']);
      const head_sha = await gitCommand(opt, worktree_root, ['rev-parse', 'HEAD']);
      if ((expected_branch !== undefined && branch !== expected_branch) || (expected_head !== undefined && head_sha !== expected_head)) throw interrupted();
      const common_git_dir = await realpath(path.resolve(worktree_root, await gitCommand(opt, worktree_root, ['rev-parse', '--git-common-dir'])));
      const status = await gitBytes(opt, worktree_root, ['status', '--porcelain=v1', '-z', '--untracked-files=all', '--no-renames']);
      const ignored = await gitBytes(opt, worktree_root, ['status', '--porcelain=v1', '-z', '--untracked-files=all', '--ignored=matching', '--no-renames']);
      if (status !== ignored) throw interrupted();
      const index = await run(opt.git_executable, ['diff', '--cached', '--quiet', ...(expected_head === undefined ? [] : [expected_head]), '--'], { cwd: worktree_root, environment: opt.base_environment, runtime_uid: opt.runtime_uid, runtime_gid: opt.runtime_gid });
      if (index.code !== 0 || index.stdout !== '' || index.stderr !== '') throw interrupted();
      const status_entries = parseWorktreeStatus(status);
      return ok({ worktree_root, branch, head_sha, common_git_dir, status_entries, clean: status_entries.length === 0 });
    },
    stageExact: async ({ worktree_root, expected_head = undefined, paths }) => {
      if (!Array.isArray(paths) || !paths.length || paths.some((entry, index) => index && paths[index - 1] >= entry)) throw interrupted();
      if (expected_head !== undefined && await gitCommand(opt, worktree_root, ['rev-parse', 'HEAD']) !== expected_head) throw interrupted();
      await gitCommand(opt, worktree_root, ['add', '--', ...paths]);
      return stagedReceipt(worktree_root);
    },
    readStaged: async ({ worktree_root }) => stagedReceipt(worktree_root),
    commitCandidate: async ({ worktree_root, expected_parent, expected_tree, message_bytes, idempotency_id }) => {
      if (typeof idempotency_id !== 'string' || !/^candidate-[0-9a-f]{64}$/.test(idempotency_id) || !(message_bytes instanceof Uint8Array)) throw interrupted();
      const requiredMessage = `JuanerAI Candidate\n\nJuanerAI-Idempotency-ID: ${idempotency_id}\n`;
      if (!Buffer.from(message_bytes).equals(Buffer.from(requiredMessage))) {
        if (Buffer.from(message_bytes).toString('utf8').startsWith('JuanerAI Candidate\n\nJuanerAI-Idempotency-ID:')) return { kind: 'CONFLICT', reason: 'READBACK_MISMATCH', observed_identity: null };
        throw interrupted();
      }
      const expectedMessage = requiredMessage;
      const retained = candidateContinuations.get(idempotency_id);
      if (retained) {
        if (retained.worktree_root !== worktree_root || retained.expected_parent !== expected_parent || retained.expected_tree !== expected_tree || retained.message !== expectedMessage) return { kind: 'AMBIGUOUS', reason: 'READBACK_MISMATCH', partial_receipt: null };
        const currentHead = await gitCommand(opt, worktree_root, ['rev-parse', 'HEAD']);
        const currentBranch = await gitCommand(opt, worktree_root, ['branch', '--show-current']);
        if (currentBranch !== retained.value.branch) return { kind: 'AMBIGUOUS', reason: 'READBACK_MISMATCH', partial_receipt: null };
        const observed = readPhysicalCommit(await readPhysicalCommitBytes(opt, worktree_root, retained.value.sha), retained.value.sha);
        if (observed.parents.length !== 1 || observed.parents[0] !== expected_parent || observed.tree !== expected_tree || observed.message !== expectedMessage) return { kind: 'AMBIGUOUS', reason: 'READBACK_MISMATCH', partial_receipt: null };
        if (currentHead === retained.value.sha) { candidateContinuations.delete(idempotency_id); return ok(retained.value); }
        if (currentHead !== expected_parent || retained.cas_succeeded || retained.cas_continuation_used) return { kind: 'AMBIGUOUS', reason: 'READBACK_MISMATCH', partial_receipt: null };
        retained.cas_continuation_used = true;
        const continued = await run(opt.git_executable, ['update-ref', `refs/heads/${retained.value.branch}`, retained.value.sha, expected_parent], { cwd: worktree_root, environment: opt.base_environment, runtime_uid: opt.runtime_uid, runtime_gid: opt.runtime_gid });
        if (continued.code !== 0 || continued.signal) return { kind: 'AMBIGUOUS', reason: 'READBACK_MISMATCH', partial_receipt: null };
        retained.cas_succeeded = true;
        if (await gitCommand(opt, worktree_root, ['rev-parse', 'HEAD']) !== retained.value.sha || await gitCommand(opt, worktree_root, ['branch', '--show-current']) !== retained.value.branch) return { kind: 'AMBIGUOUS', reason: 'READBACK_MISMATCH', partial_receipt: null };
        candidateContinuations.delete(idempotency_id);
        return ok(retained.value);
      }
      for (const [key, value] of candidateContinuations.entries()) if (value.worktree_root === worktree_root) candidateContinuations.delete(key);
      const head = await gitCommand(opt, worktree_root, ['rev-parse', 'HEAD']);
      const branch = await gitCommand(opt, worktree_root, ['branch', '--show-current']);
      requireSafeChangeBranch(branch);
      if (head !== expected_parent) {
        try {
          const observed = readPhysicalCommit(await readPhysicalCommitBytes(opt, worktree_root, head), head);
          const observedParent = await gitCommand(opt, worktree_root, ['rev-parse', `${head}^`]);
          const observedTree = await gitCommand(opt, worktree_root, ['rev-parse', `${head}^{tree}`]);
          const observedBranch = await gitCommand(opt, worktree_root, ['branch', '--show-current']);
          if (observed.parents.length === 1 && observed.parents[0] === expected_parent && observedParent === expected_parent && observed.tree === expected_tree && observedTree === expected_tree && observed.message === expectedMessage && observedBranch === branch) return ok({ sha: head, parent: expected_parent, tree: expected_tree, branch });
        } catch {}
        return { kind: 'CONFLICT', reason: 'READBACK_MISMATCH', observed_identity: null };
      }
      if (await gitCommand(opt, worktree_root, ['write-tree']) !== expected_tree) return { kind: 'CONFLICT', reason: 'DIRTY_WORKTREE', observed_identity: null };
      const created = await run(opt.git_executable, ['commit-tree', expected_tree, '-p', expected_parent], { cwd: worktree_root, environment: opt.base_environment, runtime_uid: opt.runtime_uid, runtime_gid: opt.runtime_gid, input: Buffer.from(message_bytes) });
      if (created.code !== 0 || created.signal || !/^[0-9a-f]{40}\n?$/.test(created.stdout)) throw interrupted();
      const sha = created.stdout.trim();
      const committed = readPhysicalCommit(await readPhysicalCommitBytes(opt, worktree_root, sha), sha);
      if (committed.parents.length !== 1 || committed.parents[0] !== expected_parent || committed.tree !== expected_tree || committed.message !== expectedMessage || !committed.message.includes(`JuanerAI-Idempotency-ID: ${idempotency_id}\n`)) throw interrupted();
      const value = { sha, parent: expected_parent, tree: expected_tree, branch };
      const continuation = { worktree_root, expected_parent, expected_tree, message: expectedMessage, value, cas_succeeded: false, cas_continuation_used: false };
      candidateContinuations.set(idempotency_id, continuation);
      let updated = await run(opt.git_executable, ['update-ref', `refs/heads/${branch}`, sha, expected_parent], { cwd: worktree_root, environment: opt.base_environment, runtime_uid: opt.runtime_uid, runtime_gid: opt.runtime_gid });
      if ((updated.code !== 0 || updated.signal) && await gitCommand(opt, worktree_root, ['rev-parse', 'HEAD']) === expected_parent) { continuation.cas_continuation_used = true; updated = await run(opt.git_executable, ['update-ref', `refs/heads/${branch}`, sha, expected_parent], { cwd: worktree_root, environment: opt.base_environment, runtime_uid: opt.runtime_uid, runtime_gid: opt.runtime_gid }); }
      if (updated.code !== 0 || updated.signal) return { kind: 'AMBIGUOUS', reason: 'READBACK_MISMATCH', partial_receipt: null };
      continuation.cas_succeeded = true;
      if (await gitCommand(opt, worktree_root, ['rev-parse', 'HEAD']) !== sha || await gitCommand(opt, worktree_root, ['rev-parse', `${sha}^`]) !== expected_parent || await gitCommand(opt, worktree_root, ['rev-parse', `${sha}^{tree}`]) !== expected_tree || await gitCommand(opt, worktree_root, ['branch', '--show-current']) !== branch) return { kind: 'AMBIGUOUS', reason: 'READBACK_MISMATCH', partial_receipt: null };
      return ok(value);
    },
    readCommit: async ({ canonical_root = opt.repository_root, sha }) => {
      if (typeof sha !== 'string' || !/^[0-9a-f]{40}$/.test(sha)) throw interrupted();
      const commit = readPhysicalCommit(await readPhysicalCommitBytes(opt, canonical_root, sha), sha);
      const branch = (await gitCommand(opt, canonical_root, ['for-each-ref', '--format=%(refname:short)', '--contains', sha, 'refs/heads/'])).split('\n').find(name => /^work\/mac-mini\//.test(name)) ?? null;
      if (branch === null) throw interrupted();
      return ok({ sha, parent: commit.parents[0] ?? null, tree: commit.tree, branch });
    },
    pushBranch: async request => {
      if (!closed(request, ['canonical_root', 'branch', 'candidate_sha', 'expected_remote_head', 'idempotency_id'])) throw interrupted();
      const { canonical_root, branch, candidate_sha, expected_remote_head, idempotency_id } = request;
      requireSafeChangeBranch(branch);
      const candidate = candidate_sha;
      if (canonical_root !== opt.repository_root || !/^[0-9a-f]{40}$/.test(candidate)
        || (expected_remote_head !== null && !/^[0-9a-f]{40}$/.test(expected_remote_head))
        || typeof idempotency_id !== 'string' || !idempotency_id
        || await gitCommand(opt, canonical_root, ['rev-parse', `refs/heads/${branch}`]) !== candidate) throw interrupted();
      const prior_remote_head = (await gitCommand(opt, canonical_root, ['ls-remote', 'origin', `refs/heads/${branch}`])).split(/\s+/)[0] || null;
      if (prior_remote_head !== expected_remote_head) return { kind: 'CONFLICT', reason: 'REMOTE_CONFLICT', observed_identity: prior_remote_head };
      await gitCommand(opt, canonical_root, ['push', 'origin', `refs/heads/${branch}:refs/heads/${branch}`]);
      const remote_head = (await gitCommand(opt, canonical_root, ['ls-remote', 'origin', `refs/heads/${branch}`])).split(/\s+/)[0] || null;
      if (remote_head !== candidate) throw interrupted();
      return ok({ prior_remote_head, remote_head, forced: false, deleted: false });
    },
    readRemoteBranch: async request => {
      if (!closed(request, ['canonical_root', 'origin', 'branch'])
        || request.canonical_root !== opt.repository_root || request.origin !== 'origin') throw interrupted();
      const { canonical_root, branch } = request;
      if (branch !== 'main') requireSafeChangeBranch(branch);
      const remote_head = (await gitCommand(opt, canonical_root, ['ls-remote', 'origin', `refs/heads/${branch}`])).split(/\s+/)[0];
      if (remote_head === '') return { kind: 'ABSENT', reason: 'EXPECTED_IDENTITY_ABSENT', expected_identity: { canonical_root, origin: request.origin, branch } };
      if (!/^[0-9a-f]{40}$/.test(remote_head)) throw interrupted();
      return ok({ remote_head });
    },
    canonicalDiff: async request => {
      const environment = { LC_ALL: 'C', LANG: 'C', TZ: 'UTC', GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: '/dev/null', GIT_ATTR_NOSYSTEM: '1', GIT_PAGER: 'cat', PAGER: 'cat', GIT_TERMINAL_PROMPT: '0', GIT_NO_REPLACE_OBJECTS: '1' };
      const cwd = request.worktree_root ?? opt.repository_root;
      const pinned = await assertPinnedGit();
      const actualCommon = await realpath(path.resolve(cwd, await gitCommand(opt, cwd, ['rev-parse', '--git-common-dir'])));
      const expectedCommon = await realpath(request.common_git_dir).catch(() => null);
      if (actualCommon !== expectedCommon) throw interrupted();
      const forbiddenFiles = [
        path.join(actualCommon, 'info', 'attributes'),
        path.join(actualCommon, 'info', 'grafts'),
        path.join(actualCommon, 'shallow'),
        path.join(actualCommon, 'objects', 'info', 'alternates'),
      ];
      for (const candidate of forbiddenFiles) {
        if (await readFile(candidate).then(() => true, error => error?.code === 'ENOENT' ? false : Promise.reject(error))) throw interrupted();
      }
      const replaceRefs = await gitCommand(opt, cwd, ['for-each-ref', '--format=%(refname)', 'refs/replace/']);
      if (replaceRefs !== '') throw interrupted();
      const forbiddenConfig = await run(opt.git_executable, [
        'config', '--local', '--name-only', '--get-regexp',
        '^(diff\\.|core\\.attributesFile$|core\\.pager$|pager\\.|interactive\\.diffFilter$|submodule\\.|include\\.)',
      ], { cwd, environment, runtime_uid: opt.runtime_uid, runtime_gid: opt.runtime_gid });
      if (![0, 1].includes(forbiddenConfig.code) || forbiddenConfig.code === 0 && forbiddenConfig.stdout.trim() !== '') throw interrupted();
      const args = ['--no-pager', '-c', 'color.ui=false', '-c', 'core.quotePath=true', '-c', 'diff.algorithm=myers', '-c', 'diff.mnemonicPrefix=false', '-c', 'diff.noprefix=false', 'diff', '--binary', '--full-index', '--no-ext-diff', '--no-textconv', '--no-renames', '--src-prefix=a/', '--dst-prefix=b/', `${request.baseline_sha}..${request.candidate_sha}`, '--'];
      const raw = await runBuffer(opt.git_executable, args, {
        cwd, environment, runtime_uid: opt.runtime_uid, runtime_gid: opt.runtime_gid,
      }); if (raw.code !== 0 || raw.stderr.length !== 0) throw interrupted(); const raw_stdout = Buffer.from(raw.stdout);
      const path_argv = ['--no-pager', '-c', 'color.ui=false', '-c', 'core.quotePath=true', '-c', 'diff.algorithm=myers', '-c', 'diff.mnemonicPrefix=false', '-c', 'diff.noprefix=false', 'diff', '--name-status', '-z', '--no-ext-diff', '--no-textconv', '--no-renames', `${request.baseline_sha}..${request.candidate_sha}`, '--'];
      const paths = await runBuffer(opt.git_executable, path_argv, {
        cwd, environment, runtime_uid: opt.runtime_uid, runtime_gid: opt.runtime_gid,
      });
      if (paths.code !== 0 || paths.stderr.length !== 0 || (paths.stdout.length > 0 && paths.stdout.at(-1) !== 0)) throw interrupted();
      const path_raw_stdout = Buffer.from(paths.stdout);
      const tokens = []; let start = 0;
      for (let index = 0; index < path_raw_stdout.length; index += 1) {
        if (path_raw_stdout[index] !== 0) continue;
        tokens.push(path_raw_stdout.subarray(start, index)); start = index + 1;
      }
      if (start !== path_raw_stdout.length || tokens.length % 2 !== 0) throw interrupted();
      const changedPathBytes = [];
      for (let index = 0; index < tokens.length; index += 2) {
        const status = tokens[index].toString('ascii'); const pathBytes = tokens[index + 1];
        const value = pathBytes.toString('utf8');
        if (tokens[index].length !== 1 || !['A', 'M', 'D', 'T'].includes(status) || pathBytes.length === 0 || !Buffer.from(value, 'utf8').equals(pathBytes)
          || value.startsWith('/') || value.includes('\\') || /[\n\r]/.test(value)
          || value.split('/').some(part => part.length === 0 || part === '.' || part === '..')) throw interrupted();
        changedPathBytes.push(pathBytes);
      }
      changedPathBytes.sort(Buffer.compare);
      if (changedPathBytes.some((value, index) => index > 0 && value.equals(changedPathBytes[index - 1]))) throw interrupted();
      const changed_paths = changedPathBytes.map(value => value.toString('utf8'));
      const result = {
        producer_receipt: {
          executable: opt.git_executable, executable_sha256: pinned.executable_sha256, version: pinned.version,
          environment, shell: false, argv: [...args], path_argv, path_stdout_sha256: sha256(path_raw_stdout),
          repository_root: request.canonical_root, common_git_dir: request.common_git_dir, worktree_root: cwd,
        },
        raw_stdout, byte_length: raw_stdout.length, stdout_sha256: sha256(raw_stdout),
        path_raw_stdout, path_byte_length: path_raw_stdout.length, changed_paths,
      };
      const receiptValue = { ...result, raw_stdout: raw_stdout.toString('base64'), path_raw_stdout: path_raw_stdout.toString('base64') };
      return { kind: 'OK', value: result, receipt_sha256: sha256(canonical(receiptValue)) };
    },
    syncMainFfOnly: async ({ canonical_root, main_worktree_root, squash_sha, expected_origin_main }) => {
      const repository_root = main_worktree_root ?? canonical_root ?? opt.repository_root;
      if (await gitCommand(opt, repository_root, ['branch', '--show-current']) !== 'main' || (await gitBytes(opt, repository_root, ['status', '--porcelain=v1', '-z'])).length !== 0) throw interrupted();
      await gitCommand(opt, repository_root, ['fetch', 'origin', '--prune']); const prior_local_main = await gitCommand(opt, repository_root, ['rev-parse', 'HEAD']); const origin_main = await gitCommand(opt, repository_root, ['rev-parse', 'refs/remotes/origin/main']);
      if (origin_main !== squash_sha || origin_main !== expected_origin_main) throw interrupted(); await gitCommand(opt, repository_root, ['merge', '--ff-only', squash_sha]);
      const local_main = await gitCommand(opt, repository_root, ['rev-parse', 'HEAD']); const readback_origin = await gitCommand(opt, repository_root, ['rev-parse', 'refs/remotes/origin/main']); if (local_main !== squash_sha || readback_origin !== squash_sha) throw interrupted();
      return ok({ prior_local_main, local_main, origin_main: readback_origin, clean: true, fast_forward_only: true });
    },
  });
  const statePath = changeId => path.join(opt.state_root, 'changes', changeId, 'state.json');
  const readStored = async target => {
    try {
      const bytes = await readFile(target, 'utf8');
      return { bytes, sha256: sha256(bytes) };
    } catch (error) {
      if (error?.code === 'ENOENT') return null;
      throw error;
    }
  };
  const stateCasMatches = async request => {
    const current = await readStored(statePath(request.change_id));
    if (current === null) return request.expected_version === -1;
    if (current.sha256 !== request.expected_sha256) return false;
    try {
      const value = JSON.parse(current.bytes);
      return canonical(value) === current.bytes && value.state_version === request.expected_version;
    } catch {
      return false;
    }
  };
  const state = Object.freeze({
    readPointer: async () => { try { const stored = await readStored(path.join(opt.state_root, 'active-change.json')); return stored === null ? { kind: 'UNAVAILABLE' } : { kind: 'OK', value: stored }; } catch { return { kind: 'UNAVAILABLE' }; } },
    writePointer: async request => { try { const target = path.join(opt.state_root, 'active-change.json'); const current = await readStored(target); if (current === null || current.sha256 !== request.expected_sha256) return { kind: 'CONFLICT' }; const bytes = request.next_bytes ?? canonical(request.value ?? request.pointer); await filesystem.writeBytesAtomic({ path: target, bytes }); return { kind: 'OK', value: { bytes, sha256: sha256(bytes) } }; } catch { return { kind: 'UNAVAILABLE' }; } },
    readState: async ({ change_id }) => { try { const stored = await readStored(statePath(change_id)); return stored === null ? { kind: 'UNAVAILABLE' } : { kind: 'OK', value: stored }; } catch { return { kind: 'UNAVAILABLE' }; } },
    writeState: async request => { try { if (!await stateCasMatches(request)) return { kind: 'CONFLICT' }; const bytes = request.next_bytes ?? canonical(request.value ?? request.state); await filesystem.writeBytesAtomic({ path: statePath(request.change_id), bytes }); return { kind: 'OK', value: { bytes, sha256: sha256(bytes) } }; } catch { return { kind: 'UNAVAILABLE' }; } },
    readLocalPause: async () => ({ kind: 'UNAVAILABLE' }),
    writeLocalPause: async () => ({ kind: 'UNAVAILABLE' }),
  });
  const verifier = Object.freeze({ verify: async () => ({ kind: 'REJECTED', error_code: 'INGRESS_UNAVAILABLE' }) });
  const ledger = Object.freeze({ readRemote: async () => ({ kind: 'UNAVAILABLE' }), prepareAppend: async () => ({ kind: 'UNAVAILABLE' }), commitAndPush: async () => ({ kind: 'UNAVAILABLE' }), readRemoteAppend: async () => ({ kind: 'UNAVAILABLE' }) });
  const corePullRequest = Object.freeze({ queryCurrent: async () => ({ kind: 'UNAVAILABLE' }), createOrReuse: async () => ({ kind: 'UNAVAILABLE' }), readback: async () => ({ kind: 'UNAVAILABLE' }) });
  const coreValidation = Object.freeze({ execute: async () => ({ kind: 'UNAVAILABLE' }) });
  const handoff = Object.freeze({ writeReadback: async () => ({ kind: 'UNAVAILABLE' }) });
  const coreClock = Object.freeze({ now: () => new Date().toISOString() });
  const coreIds = Object.freeze({ next: kind => `${kind}-${Date.now()}-${Math.random().toString(16).slice(2)}` });
  let locked = false;
  const mutex = Object.freeze({ tryAcquire: async () => { if (locked) return false; locked = true; return true; }, release: async () => { locked = false; } });
  return Object.freeze({ verifier, state, git, ledger, pull_request: corePullRequest, validation: coreValidation, handoff, clock: coreClock, ids: coreIds, mutex });
}
