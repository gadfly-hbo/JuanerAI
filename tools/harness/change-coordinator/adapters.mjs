import { createHash } from 'node:crypto';
import { mkdir, open, readFile, realpath, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';

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

async function run(executable, args, { cwd, environment = {}, timeout_ms = 60_000 } = {}) {
  const physicalCwd = await realpath(cwd).catch(() => cwd);
  return new Promise((resolve, reject) => {
    const child = spawn(executable, args, { cwd: physicalCwd, env: { ...environment, LC_ALL: 'C' }, shell: false });
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

async function runBuffer(executable, args, { cwd, environment = {}, timeout_ms = 60_000 } = {}) {
  const physicalCwd = await realpath(cwd).catch(() => cwd);
  return new Promise((resolve, reject) => {
    const child = spawn(executable, args, { cwd: physicalCwd, env: { ...environment, LC_ALL: 'C' }, shell: false });
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
  return command(options.git_executable, args, { cwd, environment: options.base_environment });
}

async function gitBytes(options, cwd, args) {
  const result = await run(options.git_executable, args, { cwd, environment: options.base_environment });
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

function requireSafeChangeBranch(branch) {
  if (typeof branch !== 'string' || !/^work\/mac-mini\/[A-Za-z0-9][A-Za-z0-9._/-]*$/.test(branch)) throw interrupted();
}

export function createCoordinatorAdapters(options) {
  const optionKeys = [
    'repository_root', 'state_root', 'device', 'process_run_id',
    'git_executable', 'pull_request_executable', 'base_environment',
  ];
  const environment = options?.base_environment;
  const validEnvironment = environment !== null
    && typeof environment === 'object'
    && !Array.isArray(environment)
    && Object.getPrototypeOf(environment) === Object.prototype
    && Object.entries(environment).every(([key, value]) => typeof key === 'string' && typeof value === 'string');
  const validOptions = closed(options, optionKeys)
    && path.isAbsolute(options.repository_root)
    && path.isAbsolute(options.state_root)
    && path.isAbsolute(options.git_executable)
    && path.isAbsolute(options.pull_request_executable)
    && ['macbook', 'mac-mini'].includes(options.device)
    && typeof options.process_run_id === 'string'
    && options.process_run_id
    && validEnvironment;
  if (!validOptions) {
    throw Object.assign(new Error('COORDINATOR_INPUT_INVALID'), { code: 'COORDINATOR_INPUT_INVALID' });
  }
  const opt = { ...options, base_environment: { ...(options.base_environment ?? {}) } };
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

  const ok = value => ({ kind: 'OK', value });
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
      const status = await gitBytes(opt, worktree_root, ['status', '--porcelain=v1', '-z']);
      return ok({ worktree_root, branch, head_sha, common_git_dir, status_entries: status.split('\0').filter(Boolean), clean: status.length === 0 });
    },
    stageExact: async ({ worktree_root, expected_head = undefined, paths }) => {
      if (!Array.isArray(paths) || !paths.length || paths.some((entry, index) => index && paths[index - 1] >= entry)) throw interrupted();
      if (expected_head !== undefined && await gitCommand(opt, worktree_root, ['rev-parse', 'HEAD']) !== expected_head) throw interrupted();
      await gitCommand(opt, worktree_root, ['add', '--', ...paths]);
      return stagedReceipt(worktree_root);
    },
    readStaged: async ({ worktree_root }) => stagedReceipt(worktree_root),
    commitCandidate: async ({ worktree_root, expected_parent, expected_tree, message_bytes, idempotency_id }) => {
      if (typeof idempotency_id !== 'string' || !idempotency_id || await gitCommand(opt, worktree_root, ['rev-parse', 'HEAD']) !== expected_parent || await gitCommand(opt, worktree_root, ['write-tree']) !== expected_tree) throw interrupted();
      const message = message_bytes instanceof Uint8Array ? new TextDecoder().decode(message_bytes) : 'candidate';
      await gitCommand(opt, worktree_root, ['commit', '-m', message]);
      const sha = await gitCommand(opt, worktree_root, ['rev-parse', 'HEAD']);
      return ok({ sha, parent: expected_parent, tree: expected_tree, branch: await gitCommand(opt, worktree_root, ['branch', '--show-current']) });
    },
    readCommit: async ({ canonical_root = opt.repository_root, sha }) => ok({ sha, parent: await gitCommand(opt, canonical_root, ['rev-parse', `${sha}^`]), tree: await gitCommand(opt, canonical_root, ['rev-parse', `${sha}^{tree}`]), branch: (await gitCommand(opt, canonical_root, ['for-each-ref', '--format=%(refname:short)', '--contains', sha, 'refs/heads/'])).split('\n').find(name => /^work\/mac-mini\//.test(name)) ?? null }),
    pushBranch: async ({ canonical_root = opt.repository_root, branch, head_sha, idempotency_id }) => { requireSafeChangeBranch(branch); if (typeof idempotency_id !== 'string' || !idempotency_id || await gitCommand(opt, canonical_root, ['rev-parse', `refs/heads/${branch}`]) !== head_sha) throw interrupted(); await gitCommand(opt, canonical_root, ['push', 'origin', `refs/heads/${branch}:refs/heads/${branch}`]); return ok({ branch, head_sha }); },
    readRemoteBranch: async ({ canonical_root = opt.repository_root, branch }) => { if (branch !== 'main') requireSafeChangeBranch(branch); const head_sha = (await gitCommand(opt, canonical_root, ['ls-remote', 'origin', `refs/heads/${branch}`])).split(/\s+/)[0]; if (!/^[0-9a-f]{40}$/.test(head_sha)) throw interrupted(); return ok({ branch, head_sha }); },
    canonicalDiff: async request => {
      const environment = { LC_ALL: 'C', LANG: 'C', TZ: 'UTC', GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: '/dev/null', GIT_ATTR_NOSYSTEM: '1', GIT_PAGER: 'cat', PAGER: 'cat', GIT_TERMINAL_PROMPT: '0', GIT_NO_REPLACE_OBJECTS: '1' };
      const cwd = request.worktree_root ?? opt.repository_root;
      if (await gitCommand(opt, cwd, ['--version']) !== 'git version 2.54.0') throw interrupted();
      const actualCommon = await realpath(path.resolve(cwd, await gitCommand(opt, cwd, ['rev-parse', '--git-common-dir'])));
      const expectedCommon = await realpath(request.common_git_dir).catch(() => null);
      if (actualCommon !== expectedCommon) throw interrupted();
      const args = ['--no-pager', '-c', 'color.ui=false', '-c', 'core.quotePath=true', '-c', 'diff.algorithm=myers', '-c', 'diff.mnemonicPrefix=false', '-c', 'diff.noprefix=false', 'diff', '--binary', '--full-index', '--no-ext-diff', '--no-textconv', '--no-renames', '--src-prefix=a/', '--dst-prefix=b/', `${request.baseline_sha}..${request.candidate_sha}`, '--'];
      const raw = await runBuffer(opt.git_executable, args, { cwd, environment }); if (raw.code !== 0) throw interrupted(); const raw_stdout = raw.stdout;
      return ok({ producer_receipt: { executable: opt.git_executable, executable_sha256: sha256(await readFile(opt.git_executable)), version: '2.54.0', environment, shell: false, argv: [...args], repository_root: request.canonical_root, common_git_dir: request.common_git_dir, worktree_root: cwd }, raw_stdout, byte_length: raw_stdout.length, stdout_sha256: sha256(raw_stdout) });
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
