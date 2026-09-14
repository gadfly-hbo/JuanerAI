import { createHash, createPublicKey, verify } from 'node:crypto';
import { spawn } from 'node:child_process';
import { createReadStream } from 'node:fs';
import { lstat, mkdir, open, readFile, readlink, realpath, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createCoordinatorCore } from './coordinator.mjs';
import { evaluateWorktreeSnapshotObservationV1 } from './worktree-snapshot-contract.mjs';
import {
  PINNED_GIT_EXECUTABLE_SHA256,
  PINNED_GIT_VERSION,
  createCoordinatorAdapters,
} from './adapters.mjs';

export const CONTROLLER_TRUST_PATH = '/private/etc/juanerai/controller-trust.json';
export const HOST_CONFIG_PATH = '/private/etc/juanerai/host-loop.json';
export const EVIDENCE_REF = 'refs/heads/evidence/agent-runs';
const PINNED_PRODUCTION_GIT_PATH = '/Users/huangbo/Dev/Env/homebrew/bin/git';
export const GITHUB_CREDENTIAL_POLICY = Object.freeze({
  branch_push: Object.freeze({
    path: '/private/etc/juanerai/github-branch-push-key',
    purpose: 'current-branch-git-transport',
  }),
  pr_api: Object.freeze({
    path: '/private/etc/juanerai/github-pr-api-credential',
    purpose: 'current-pr-api',
    permissions: Object.freeze(['Metadata:read', 'Contents:read', 'PullRequests:write']),
    contents_write: false,
  }),
});

const MAX_CONTROL_BYTES = 1024 * 1024;
const sha256 = value => createHash('sha256').update(value).digest('hex');
const canonical = value => Array.isArray(value)
  ? `[${value.map(canonical).join(',')}]`
  : value && typeof value === 'object'
    ? `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`
    : JSON.stringify(value);
const closed = (value, keys) => value !== null && typeof value === 'object'
  && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype
  && Object.keys(value).length === keys.length && keys.every(key => Object.hasOwn(value, key));
const ok = value => ({ kind: 'OK', value, receipt_sha256: sha256(canonical(value)) });
const absent = expected_identity => ({ kind: 'ABSENT', reason: 'EXPECTED_IDENTITY_ABSENT', expected_identity });
const unavailable = () => ({ kind: 'UNAVAILABLE', reason: 'UNAVAILABLE', partial_receipt: null });
const safeChange = value => typeof value === 'string' && /^CHG-[a-z0-9]+(?:-[a-z0-9]+){0,15}$/.test(value) && Buffer.byteLength(value) <= 128;
const safeBranch = value => typeof value === 'string' && /^work\/mac-mini\/[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);

function parseCanonical(bytes) {
  if (!(bytes instanceof Uint8Array) || bytes.length === 0 || bytes.length > MAX_CONTROL_BYTES) throw new Error('INPUT_INVALID');
  const raw = Buffer.from(bytes).toString('utf8');
  const value = JSON.parse(raw);
  if (canonical(value) !== raw) throw new Error('INPUT_INVALID');
  return value;
}

function parseTrust(bytes) {
  const trust = parseCanonical(bytes);
  if (!closed(trust, ['schema_version', 'active_keys', 'revoked_key_ids'])
    || trust.schema_version !== '1.0' || !Array.isArray(trust.active_keys)
    || !Array.isArray(trust.revoked_key_ids)
    || trust.revoked_key_ids.some((id, index) => typeof id !== 'string' || index && trust.revoked_key_ids[index - 1] >= id)) throw new Error('TRUST_INVALID');
  return trust;
}

export async function verifyControllerCommandSignature({
  command_body_bytes,
  signature_bytes,
  trust_document_bytes,
  now,
}) {
  try {
    const body = parseCanonical(command_body_bytes);
    const trust = parseTrust(trust_document_bytes);
    if (!(signature_bytes instanceof Uint8Array) || typeof body.key_id !== 'string') throw new Error('INPUT_INVALID');
    const key = trust.active_keys.find(candidate => candidate?.key_id === body.key_id);
    if (!key || trust.revoked_key_ids.includes(body.key_id)
      || !closed(key, ['key_id', 'key_type', 'public_key_spki_base64', 'fingerprint_sha256', 'valid_from', 'valid_until'])
      || key.key_type !== 'Ed25519' || typeof now !== 'string'
      || now < key.valid_from || now > key.valid_until) return { kind: 'REJECTED', error_code: 'COMMAND_SIGNATURE_INVALID' };
    const publicBytes = Buffer.from(key.public_key_spki_base64, 'base64');
    if (publicBytes.toString('base64') !== key.public_key_spki_base64 || sha256(publicBytes) !== key.fingerprint_sha256) return { kind: 'REJECTED', error_code: 'COMMAND_SIGNATURE_INVALID' };
    const publicKey = createPublicKey({ key: publicBytes, type: 'spki', format: 'der' });
    if (publicKey.asymmetricKeyType !== 'ed25519' || !verify(null, Buffer.from(command_body_bytes), publicKey, Buffer.from(signature_bytes))) return { kind: 'REJECTED', error_code: 'COMMAND_SIGNATURE_INVALID' };
    return {
      kind: 'VERIFIED',
      verified_key_id: key.key_id,
      body_sha256: sha256(command_body_bytes),
      signature_sha256: sha256(signature_bytes),
    };
  } catch {
    return { kind: 'REJECTED', error_code: 'COMMAND_SIGNATURE_INVALID' };
  }
}

async function readAuthorityFile(target, expectedMode = 0o600) {
  const parent = await lstat(path.dirname(target));
  const stat = await lstat(target);
  if (!parent.isDirectory() || parent.uid !== 0 || parent.gid !== 0 || (parent.mode & 0o022) !== 0
    || !stat.isFile() || stat.isSymbolicLink() || stat.uid !== 0 || stat.gid !== 0
    || (stat.mode & 0o777) !== expectedMode) throw new Error('AUTHORITY_FILE_INVALID');
  const bytes = await readFile(target);
  if (bytes.length === 0 || bytes.length > MAX_CONTROL_BYTES) throw new Error('AUTHORITY_FILE_INVALID');
  return bytes;
}

async function executeProcess(executable, args, {
  cwd, environment = {}, input = null, timeout_ms = 60_000,
  runtime_uid = undefined, runtime_gid = undefined,
} = {}) {
  if (!path.isAbsolute(executable) || !Array.isArray(args) || !path.isAbsolute(cwd)) throw new Error('PROCESS_INPUT_INVALID');
  return new Promise((resolve, reject) => {
    const child = spawn(executable, args, {
      cwd, env: environment, shell: false, stdio: ['pipe', 'pipe', 'pipe'],
      uid: runtime_uid, gid: runtime_gid,
    });
    const stdout = []; const stderr = []; let size = 0; let settled = false;
    let timed_out = false; let overflowed = false;
    const timer = setTimeout(() => { timed_out = true; child.kill('SIGTERM'); }, timeout_ms);
    const finish = (callback, value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      callback(value);
    };
    const collect = target => chunk => {
      size += chunk.length;
      if (size > MAX_CONTROL_BYTES) { overflowed = true; return child.kill('SIGTERM'); }
      target.push(Buffer.from(chunk));
    };
    child.stdout.on('data', collect(stdout));
    child.stderr.on('data', collect(stderr));
    child.once('error', error => finish(reject, error));
    child.once('close', (code, signal) => finish(resolve, {
      code, signal, stdout: Buffer.concat(stdout), stderr: Buffer.concat(stderr), timed_out, overflowed,
    }));
    child.stdin.end(input);
  });
}

async function atomicWrite(target, bytes) {
  await mkdir(path.dirname(target), { recursive: true, mode: 0o700 });
  const temporary = `${target}.tmp-${process.pid}`;
  await writeFile(temporary, bytes, { mode: 0o600 });
  const file = await open(temporary, 'r'); await file.sync(); await file.close();
  await rename(temporary, target);
  const directory = await open(path.dirname(target), 'r'); await directory.sync(); await directory.close();
  const reread = await readFile(target);
  if (!reread.equals(Buffer.from(bytes))) throw new Error('READBACK_MISMATCH');
  return reread;
}

export function createFileState(stateRoot) {
  const pointerPath = path.join(stateRoot, 'active-change.json');
  const statePath = change => {
    if (!safeChange(change)) throw new Error('INPUT_INVALID');
    return path.join(stateRoot, 'changes', change, 'state.json');
  };
  const pausePath = path.join(stateRoot, 'local-pause.json');
  const read = async target => {
    try {
      const bytes = await readFile(target);
      return ok({ bytes: bytes.toString('utf8'), sha256: sha256(bytes) });
    } catch (error) {
      return error?.code === 'ENOENT' ? absent(target) : unavailable();
    }
  };
  const casWrite = async (target, expected, nextBytes) => {
    try {
      const current = await readFile(target);
      if (sha256(current) !== expected) return { kind: 'CONFLICT', reason: 'CAS_CONFLICT', observed_identity: sha256(current) };
      const written = await atomicWrite(target, Buffer.from(nextBytes));
      return ok({ bytes: written.toString('utf8'), sha256: sha256(written) });
    } catch (error) {
      return error?.code === 'ENOENT' ? absent(target) : unavailable();
    }
  };
  const gateway = {
    readPointer: async () => read(pointerPath),
    writePointer: async request => casWrite(pointerPath, request.expected_sha256, request.next_bytes),
    readState: async ({ change_id }) => read(statePath(change_id)),
    writeState: async request => {
      const target = statePath(request.change_id);
      if (request.expected_version === -1) {
        try {
          await lstat(target);
          return { kind: 'CONFLICT', reason: 'CAS_CONFLICT', observed_identity: 'state-present' };
        } catch (error) {
          if (error?.code !== 'ENOENT') return unavailable();
          const written = await atomicWrite(target, Buffer.from(request.next_bytes));
          return ok({ bytes: written.toString('utf8'), sha256: sha256(written) });
        }
      }
      return casWrite(target, request.expected_sha256, request.next_bytes);
    },
    readLocalPause: async () => read(pausePath),
    writeLocalPause: async request => {
      if (request.expected_sha256 !== null) return casWrite(pausePath, request.expected_sha256, request.next_bytes);
      try {
        const current = await readFile(pausePath);
        return { kind: 'CONFLICT', reason: 'CAS_CONFLICT', observed_identity: sha256(current) };
      } catch (error) {
        if (error?.code !== 'ENOENT') return unavailable();
        try {
          const written = await atomicWrite(pausePath, Buffer.from(request.next_bytes));
          return ok({ bytes: written.toString('utf8'), sha256: sha256(written) });
        } catch {
          return unavailable();
        }
      }
    },
  };
  return Object.freeze(gateway);
}

function exactGitEnvironment() {
  return {
    LC_ALL: 'C', LANG: 'C', TZ: 'UTC', GIT_CONFIG_NOSYSTEM: '1',
    GIT_CONFIG_GLOBAL: '/dev/null', GIT_ATTR_NOSYSTEM: '1',
    GIT_PAGER: 'cat', PAGER: 'cat', GIT_TERMINAL_PROMPT: '0',
    GIT_NO_REPLACE_OBJECTS: '1',
    GIT_AUTHOR_NAME: 'JuanerAI Coordinator', GIT_AUTHOR_EMAIL: 'coordinator@juaner.ai',
    GIT_COMMITTER_NAME: 'JuanerAI Coordinator', GIT_COMMITTER_EMAIL: 'coordinator@juaner.ai',
  };
}

function gitTransportArguments(keyPath) {
  return `/usr/bin/ssh -F /dev/null -i ${keyPath} -o IdentitiesOnly=yes -o IdentityAgent=none -o BatchMode=yes -o PasswordAuthentication=no -o KbdInteractiveAuthentication=no -o StrictHostKeyChecking=yes`;
}

function createBranchTransport({ gitExecutable, repositoryRoot, branchKeyPath, runtime_uid, runtime_gid }) {
  return async request => {
    if (!closed(request, ['canonical_root', 'branch', 'candidate_sha', 'expected_remote_head', 'idempotency_id'])
      || request.canonical_root !== repositoryRoot || !safeBranch(request.branch) || !/^[0-9a-f]{40}$/.test(request.candidate_sha)
      || (request.expected_remote_head !== null && !/^[0-9a-f]{40}$/.test(request.expected_remote_head))
      || typeof request.idempotency_id !== 'string' || request.idempotency_id.length === 0) throw new Error('FORBIDDEN_TARGET');
    await readAuthorityFile(branchKeyPath, 0o640);
    const head = request.candidate_sha;
    const local = await executeProcess(gitExecutable, [
      'rev-parse', '--verify', `refs/heads/${request.branch}`,
    ], { cwd: repositoryRoot, environment: exactGitEnvironment(), runtime_uid, runtime_gid: 0 });
    const localHead = local.stdout.toString('utf8').trim();
    if (local.code !== 0 || local.signal !== null || localHead !== head) return { kind: 'CONFLICT', reason: 'READBACK_MISMATCH', observed_identity: localHead || null };
    const prior = await executeProcess(gitExecutable, [
      '-c', `core.sshCommand=${gitTransportArguments(branchKeyPath)}`,
      '-c', 'url.git@github.com:.insteadOf=https://github.com/',
      'ls-remote', 'origin', `refs/heads/${request.branch}`,
    ], {
      cwd: repositoryRoot, environment: exactGitEnvironment(), runtime_uid, runtime_gid: 0,
    });
    if (prior.code !== 0 || prior.signal !== null) return { kind: 'AMBIGUOUS', reason: 'REMOTE_AMBIGUOUS', partial_receipt: null };
    const priorHead = prior.stdout.toString('utf8').trim().split(/\s+/)[0] || null;
    if (priorHead !== request.expected_remote_head) return { kind: 'CONFLICT', reason: 'REMOTE_CONFLICT', observed_identity: priorHead };
    const pushed = await executeProcess(gitExecutable, [
      '-c', `core.sshCommand=${gitTransportArguments(branchKeyPath)}`,
      '-c', 'url.git@github.com:.insteadOf=https://github.com/',
      'push', 'origin', `${head}:refs/heads/${request.branch}`,
    ], { cwd: repositoryRoot, environment: exactGitEnvironment(), runtime_uid, runtime_gid: 0 });
    if (pushed.code !== 0 || pushed.signal !== null) return { kind: 'AMBIGUOUS', reason: 'REMOTE_AMBIGUOUS', partial_receipt: null };
    const readback = await executeProcess(gitExecutable, [
      '-c', `core.sshCommand=${gitTransportArguments(branchKeyPath)}`,
      '-c', 'url.git@github.com:.insteadOf=https://github.com/',
      'ls-remote', 'origin', `refs/heads/${request.branch}`,
    ], {
      cwd: repositoryRoot, environment: exactGitEnvironment(), runtime_uid, runtime_gid: 0,
    });
    if (readback.code !== 0 || readback.signal !== null) return { kind: 'AMBIGUOUS', reason: 'REMOTE_AMBIGUOUS', partial_receipt: null };
    const remoteHead = readback.stdout.toString('utf8').trim().split(/\s+/)[0] || null;
    if (remoteHead !== head) return { kind: 'AMBIGUOUS', reason: 'READBACK_MISMATCH', partial_receipt: null };
    return ok({ prior_remote_head: priorHead, remote_head: remoteHead, forced: false, deleted: false });
  };
}

function createBranchReadback({ gitExecutable, repositoryRoot, branchKeyPath, runtime_uid, runtime_gid }) {
  return async request => {
    if (!closed(request, ['canonical_root', 'origin', 'branch'])
      || request.canonical_root !== repositoryRoot || request.origin !== 'origin') throw new Error('FORBIDDEN_TARGET');
    const { branch } = request;
    if (!safeBranch(branch)) throw new Error('FORBIDDEN_TARGET');
    await readAuthorityFile(branchKeyPath, 0o640);
    const result = await executeProcess(gitExecutable, [
      '-c', `core.sshCommand=${gitTransportArguments(branchKeyPath)}`,
      '-c', 'url.git@github.com:.insteadOf=https://github.com/',
      'ls-remote', 'origin', `refs/heads/${branch}`,
    ], { cwd: repositoryRoot, environment: exactGitEnvironment(), runtime_uid, runtime_gid: 0 });
    if (result.code !== 0 || result.signal !== null || result.stderr.length !== 0 || result.timed_out || result.overflowed) return { kind: 'AMBIGUOUS', reason: 'REMOTE_AMBIGUOUS', partial_receipt: null };
    const observed = result.stdout.toString('utf8');
    if (observed === '') return absent({ canonical_root: request.canonical_root, origin: request.origin, branch });
    const remote_head = new RegExp(`^([0-9a-f]{40})\\trefs/heads/${branch}\\n$`).exec(observed)?.[1] ?? null;
    if (remote_head === null) return { kind: 'AMBIGUOUS', reason: 'REMOTE_AMBIGUOUS', partial_receipt: null };
    return ok({ remote_head });
  };
}

export function createPurposeBoundGitHubAdapters({
  repository,
  credentialPath = GITHUB_CREDENTIAL_POLICY.pr_api.path,
  fetchImpl = globalThis.fetch,
}) {
  if (typeof repository !== 'string' || !/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository)
    || credentialPath !== GITHUB_CREDENTIAL_POLICY.pr_api.path || typeof fetchImpl !== 'function') throw new Error('INPUT_INVALID');
  const [owner] = repository.split('/');
  const api = async ({ pathname, method = 'GET', body = null }) => {
    if (!pathname.startsWith(`/repos/${repository}/pulls`)) throw new Error('FORBIDDEN_TARGET');
    const token = (await readAuthorityFile(credentialPath)).toString('utf8').trim();
    if (!token || /\s/.test(token)) throw new Error('CREDENTIAL_INVALID');
    const response = await fetchImpl(`https://api.github.com${pathname}`, {
      method,
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'X-GitHub-Api-Version': '2022-11-28',
      },
      body: body === null ? undefined : canonical(body),
    });
    const text = await response.text();
    if (!response.ok) throw new Error('REMOTE_AMBIGUOUS');
    return JSON.parse(text);
  };
  const normalize = pull => ({
    number: pull.number,
    url: pull.html_url,
    base: pull.base?.ref,
    head_branch: pull.head?.ref,
    head_sha: pull.head?.sha,
    review_ready: pull.draft === false,
  });
  const queryCurrent = async request => {
    if (!closed(request, ['repository', 'base', 'head_branch']) || request.repository !== repository
      || request.base !== 'main' || !safeBranch(request.head_branch)) throw new Error('FORBIDDEN_TARGET');
    const pulls = await api({ pathname: `/repos/${repository}/pulls?state=open&base=main&head=${owner}%3A${encodeURIComponent(request.head_branch)}&per_page=2` });
    if (!Array.isArray(pulls) || pulls.length > 1) throw new Error('REMOTE_CONFLICT');
    return pulls.length === 0 ? absent('current-pr') : ok(normalize(pulls[0]));
  };
  const createOrReuse = async request => {
    if (!closed(request, ['repository', 'base', 'head_branch', 'head_sha', 'idempotency_id'])
      || request.repository !== repository || request.base !== 'main' || !safeBranch(request.head_branch)
      || !/^[0-9a-f]{40}$/.test(request.head_sha) || typeof request.idempotency_id !== 'string') throw new Error('FORBIDDEN_TARGET');
    const found = await queryCurrent({ repository, base: 'main', head_branch: request.head_branch });
    if (found.kind === 'OK') return found;
    const created = await api({
      pathname: `/repos/${repository}/pulls`, method: 'POST',
      body: { base: 'main', head: request.head_branch, title: request.head_branch, body: 'JuanerAI signed Change delivery', draft: true },
    });
    const ready = await api({ pathname: `/repos/${repository}/pulls/${created.number}/ready_for_review`, method: 'POST' });
    const value = normalize(ready);
    if (value.head_sha !== request.head_sha) throw new Error('READBACK_MISMATCH');
    return ok(value);
  };
  const readback = async request => {
    if (!closed(request, ['number', 'expected_head']) || !Number.isSafeInteger(request.number)
      || request.number < 1 || !/^[0-9a-f]{40}$/.test(request.expected_head)) throw new Error('INPUT_INVALID');
    const value = normalize(await api({ pathname: `/repos/${repository}/pulls/${request.number}` }));
    if (value.base !== 'main' || value.head_sha !== request.expected_head || !safeBranch(value.head_branch)) throw new Error('READBACK_MISMATCH');
    return ok(value);
  };
  return Object.freeze({ queryCurrent, createOrReuse, readback });
}

const WORKTREE_SUBJECT_KEYS = ['kind', 'repository_root', 'worktree_root', 'branch', 'head_sha', 'common_git_dir', 'allowed_paths', 'forbidden_paths'];
const CANDIDATE_SUBJECT_KEYS = [...WORKTREE_SUBJECT_KEYS, 'candidate_sha', 'candidate_tree'];
const WORKTREE_DEFINITION_KEYS = ['id', 'validation_kind', 'validation_scope', 'subject', 'argv', 'cwd', 'environment', 'timeout_ms'];
const closedDataObject = (value, keys) => {
  if (value === null || typeof value !== 'object' || Array.isArray(value) || Object.getPrototypeOf(value) !== Object.prototype) return false;
  const ownKeys = Reflect.ownKeys(value);
  if (ownKeys.length !== keys.length || !keys.every(key => ownKeys.includes(key))) return false;
  return keys.every(key => {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    return descriptor?.enumerable === true && Object.hasOwn(descriptor, 'value') && !Object.hasOwn(descriptor, 'get') && !Object.hasOwn(descriptor, 'set');
  });
};
const closedStringArray = value => {
  if (!Array.isArray(value) || Object.getPrototypeOf(value) !== Array.prototype) return false;
  const length = Object.getOwnPropertyDescriptor(value, 'length');
  if (!length || length.enumerable !== false || !Object.hasOwn(length, 'value') || !Number.isSafeInteger(length.value) || length.value < 0) return false;
  const ownKeys = Reflect.ownKeys(value);
  if (ownKeys.length !== length.value + 1 || !ownKeys.includes('length')) return false;
  for (let index = 0; index < length.value; index += 1) {
    const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
    if (descriptor?.enumerable !== true || !Object.hasOwn(descriptor, 'value') || Object.hasOwn(descriptor, 'get') || Object.hasOwn(descriptor, 'set')) return false;
  }
  return true;
};
const validScopeRule = value => {
  if (typeof value !== 'string' || Buffer.byteLength(value, 'utf8') < 1 || Buffer.byteLength(value, 'utf8') > 4096
    || value.startsWith('/') || value.includes('\0') || value.includes('\\')) return false;
  const prefix = value.endsWith('/**');
  const base = prefix ? value.slice(0, -3) : value;
  if (!base || (!prefix && value.endsWith('/')) || /[*?\[\]{}]/.test(base)
    || (prefix && (value.indexOf('*') !== value.length - 2 || value.lastIndexOf('*') !== value.length - 1))) return false;
  return base.split('/').every(segment => segment.length > 0 && segment !== '.' && segment !== '..');
};
const validScope = subject => {
  if (!closedStringArray(subject.allowed_paths) || !closedStringArray(subject.forbidden_paths)) return false;
  const seenAllowed = new Set(); const seenForbidden = new Set();
  for (const item of subject.allowed_paths) {
    if (!validScopeRule(item)) return false;
    const identity = Buffer.from(item, 'utf8').toString('hex');
    if (seenAllowed.has(identity)) return false;
    seenAllowed.add(identity);
  }
  for (const item of subject.forbidden_paths) {
    if (!validScopeRule(item)) return false;
    const identity = Buffer.from(item, 'utf8').toString('hex');
    if (seenForbidden.has(identity) || seenAllowed.has(identity)) return false;
    seenForbidden.add(identity);
  }
  return Buffer.byteLength(canonical({ allowed_paths: subject.allowed_paths, forbidden_paths: subject.forbidden_paths }), 'utf8') <= MAX_CONTROL_BYTES;
};
const worktreeScopeSha256 = subject => sha256(Buffer.from(canonical({ allowed_paths: subject.allowed_paths, forbidden_paths: subject.forbidden_paths }), 'utf8'));
const contained = (target, root) => target === root || (root === '/' ? target.startsWith('/') : target.startsWith(`${root}/`));
const validSubjectPath = value => typeof value === 'string' && path.isAbsolute(value) && !value.includes('\0')
  && Buffer.byteLength(value, 'utf8') >= 1 && Buffer.byteLength(value, 'utf8') <= 4096
  && (value === '/' || (!value.endsWith('/') && !value.includes('//')
    && !value.split('/').slice(1).some(segment => segment === '.' || segment === '..')));
const validWorktreeSubject = subject => closedDataObject(subject, WORKTREE_SUBJECT_KEYS)
  && subject.kind === 'WORKTREE' && ['repository_root', 'worktree_root', 'common_git_dir'].every(key => validSubjectPath(subject[key]))
  && typeof subject.branch === 'string' && Buffer.byteLength(subject.branch, 'utf8') <= 255
  && /^work\/mac-mini\/[a-z0-9]+(?:-[a-z0-9]+)*$/.test(subject.branch)
  && typeof subject.head_sha === 'string' && /^[0-9a-f]{40}$/.test(subject.head_sha)
  && validScope(subject);
const validCandidateSubject = subject => closedDataObject(subject, CANDIDATE_SUBJECT_KEYS)
  && subject.kind === 'CANDIDATE' && ['repository_root', 'worktree_root', 'common_git_dir'].every(key => validSubjectPath(subject[key]))
  && typeof subject.branch === 'string' && Buffer.byteLength(subject.branch, 'utf8') <= 255
  && /^work\/mac-mini\/[a-z0-9]+(?:-[a-z0-9]+)*$/.test(subject.branch)
  && typeof subject.head_sha === 'string' && /^[0-9a-f]{40}$/.test(subject.head_sha)
  && typeof subject.candidate_sha === 'string' && subject.candidate_sha === subject.head_sha
  && typeof subject.candidate_tree === 'string' && /^[0-9a-f]{40}$/.test(subject.candidate_tree)
  && validScope(subject);

function validateDefinition(definition, nodeExecutable) {
  if (!closedDataObject(definition, WORKTREE_DEFINITION_KEYS) || !['regression-affected-suite', 'regression-test-asset-retirement'].includes(definition.id)
    || definition.validation_kind !== 'REGRESSION' || definition.subject !== 'WORKTREE'
    || (definition.id === 'regression-affected-suite' && definition.validation_scope !== 'AFFECTED_SUITE')
    || (definition.id === 'regression-test-asset-retirement' && definition.validation_scope !== 'TEST_ASSET_RETIREMENT')
    || !closedStringArray(definition.argv) || definition.argv.length < 1 || !definition.argv.every(item => typeof item === 'string')
    || definition.argv[0] !== nodeExecutable || typeof definition.cwd !== 'string' || !path.isAbsolute(definition.cwd) || !closedDataObject(definition.environment, [])
    || !Number.isSafeInteger(definition.timeout_ms) || definition.timeout_ms < 1) throw new Error('INPUT_INVALID');
}

function validateCandidateDefinition(definition, nodeExecutable) {
  if (!closedDataObject(definition, WORKTREE_DEFINITION_KEYS) || definition.id !== 'final-validation-candidate'
    || definition.validation_kind !== 'FINAL_VALIDATION' || definition.validation_scope !== 'CANDIDATE'
    || definition.subject !== 'CANDIDATE' || !closedStringArray(definition.argv) || definition.argv.length < 1
    || !definition.argv.every(item => typeof item === 'string') || definition.argv[0] !== nodeExecutable
    || typeof definition.cwd !== 'string' || !path.isAbsolute(definition.cwd) || !closedDataObject(definition.environment, [])
    || !Number.isSafeInteger(definition.timeout_ms) || definition.timeout_ms < 1) throw new Error('INPUT_INVALID');
}

function statObservation(stat) {
  const type = stat.isFile() ? 'FILE'
    : stat.isSymbolicLink() ? 'SYMLINK'
      : stat.isDirectory() ? 'DIRECTORY'
        : stat.isSocket() ? 'SOCKET'
          : stat.isFIFO() ? 'FIFO'
            : stat.isBlockDevice() ? 'BLOCK_DEVICE'
              : stat.isCharacterDevice() ? 'CHARACTER_DEVICE' : 'OTHER';
  const values = [stat.mode, stat.dev, stat.ino, stat.size, stat.mtimeNs, stat.ctimeNs];
  if (!values.every(value => typeof value === 'bigint' && value >= 0n)) throw new Error('SUBJECT_MISMATCH');
  return { kind: 'PRESENT', type, mode: values[0], dev: values[1], ino: values[2], size: values[3], mtime_ns: values[4], ctime_ns: values[5] };
}

function missingObservation() { return { kind: 'MISSING' }; }

async function hashRegularFile(target) {
  return new Promise((resolve, reject) => {
    const digest = createHash('sha256');
    const source = createReadStream(target);
    source.on('data', chunk => digest.update(chunk));
    source.once('error', reject);
    source.once('end', () => resolve(digest.digest('hex')));
  });
}

function parseCollectorStatus(bytes) {
  const records = []; let start = 0;
  for (let index = 0; index < bytes.length; index += 1) {
    if (bytes[index] !== 0) continue;
    const record = bytes.subarray(start, index); start = index + 1;
    if (record.length < 4 || record[2] !== 0x20 || ![' M', ' D', ' T', '??'].includes(record.subarray(0, 2).toString('ascii'))) throw new Error('SUBJECT_MISMATCH');
    const pathBytes = record.subarray(3);
    if (pathBytes.length === 0 || pathBytes[0] === 0x2f || pathBytes.includes(0x5c)) throw new Error('SUBJECT_MISMATCH');
    let segmentStart = 0;
    for (let cursor = 0; cursor <= pathBytes.length; cursor += 1) {
      if (cursor !== pathBytes.length && pathBytes[cursor] !== 0x2f) continue;
      const segment = pathBytes.subarray(segmentStart, cursor);
      if (segment.length === 0 || segment.equals(Buffer.from('.')) || segment.equals(Buffer.from('..'))) throw new Error('SUBJECT_MISMATCH');
      segmentStart = cursor + 1;
    }
    records.push({ xy: record.subarray(0, 2).toString('ascii'), path_bytes: Buffer.from(pathBytes) });
  }
  if (start !== bytes.length) throw new Error('SUBJECT_MISMATCH');
  return records;
}

async function runPinnedGit(cwd, args) {
  const result = await executeProcess(PINNED_PRODUCTION_GIT_PATH, args, { cwd, environment: {} });
  if (result.code !== 0 || result.signal !== null) throw new Error('SUBJECT_MISMATCH');
  return result;
}

async function runPhysicalPinnedGit(cwd, args) {
  const result = await executeProcess(PINNED_PRODUCTION_GIT_PATH, args, { cwd, environment: exactGitEnvironment() });
  if (result.code !== 0 || result.signal !== null) throw new Error('SUBJECT_MISMATCH');
  return result;
}

function physicalGitObjectSha(type, bytes) {
  return createHash('sha1').update(`${type} ${bytes.length}\0`).update(bytes).digest('hex');
}

async function collectWorktreeSnapshotObservationV1(subject) {
  const cwd = subject.worktree_root;
  const [status, ignored, index, branch, head, common] = await Promise.all([
    runPinnedGit(cwd, ['status', '--porcelain=v1', '-z', '--untracked-files=all', '--no-renames']),
    runPinnedGit(cwd, ['status', '--porcelain=v1', '-z', '--untracked-files=all', '--no-renames', '--ignored=matching']),
    executeProcess(PINNED_PRODUCTION_GIT_PATH, ['diff', '--cached', '--quiet', subject.head_sha, '--'], { cwd, environment: {} }),
    runPinnedGit(cwd, ['branch', '--show-current']),
    runPinnedGit(cwd, ['rev-parse', 'HEAD']),
    runPinnedGit(cwd, ['rev-parse', '--path-format=absolute', '--git-common-dir']),
  ]);
  const branchValue = branch.stdout.toString('utf8').trim();
  const headValue = head.stdout.toString('ascii').trim();
  const commonValue = await realpath(common.stdout.toString('utf8').trim());
  if (branchValue !== subject.branch || headValue !== subject.head_sha || commonValue !== subject.common_git_dir) throw new Error('SUBJECT_MISMATCH');
  const entries = [];
  for (const record of parseCollectorStatus(status.stdout)) {
    const target = Buffer.concat([Buffer.from(subject.worktree_root, 'utf8'), Buffer.from('/'), record.path_bytes]);
    const split = record.path_bytes.lastIndexOf(0x2f);
    const parent = split < 0 ? Buffer.from(subject.worktree_root, 'utf8') : Buffer.concat([Buffer.from(subject.worktree_root, 'utf8'), Buffer.from('/'), record.path_bytes.subarray(0, split)]);
    const parent_realpath = await realpath(parent);
    if (!contained(parent_realpath, subject.worktree_root)) throw new Error('SUBJECT_MISMATCH');
    if (record.xy === ' D') {
      try { await lstat(target, { bigint: true }); throw new Error('SUBJECT_MISMATCH'); } catch (error) { if (error?.code !== 'ENOENT') throw error; }
      entries.push({ path_bytes: record.path_bytes, parent_realpath, before: missingObservation(), content: missingObservation(), after: missingObservation() });
      continue;
    }
    const before = statObservation(await lstat(target, { bigint: true }));
    let content;
    if (before.type === 'FILE') content = { kind: 'FILE', sha256: await hashRegularFile(target) };
    else if (before.type === 'SYMLINK') content = { kind: 'SYMLINK', target_sha256: sha256(await readlink(target, 'buffer')) };
    else throw new Error('SUBJECT_MISMATCH');
    const after = statObservation(await lstat(target, { bigint: true }));
    entries.push({ path_bytes: record.path_bytes, parent_realpath, before, content, after });
  }
  return {
    repository_root_realpath: subject.repository_root, worktree_root_realpath: subject.worktree_root,
    common_git_dir_realpath: subject.common_git_dir, branch: subject.branch, head_sha: subject.head_sha,
    status_stdout: status.stdout, ignored_status_stdout: ignored.stdout,
    index_probe: { exit_code: index.code, signal: index.signal, stdout: index.stdout, stderr: index.stderr }, entries,
  };
}

// Design 7.2/7.5's repair-Worker close is the sole non-validation consumer of
// the existing WVEB collector.  Keep its subject and output purpose-bound: the
// Host may obtain only the already-evaluated snapshot identity.
export async function readRepairWorkerSnapshot(subject) {
  if (!validWorktreeSubject(subject)) throw new Error('INPUT_INVALID');
  const observation = await collectWorktreeSnapshotObservationV1(subject);
  const evaluated = evaluateWorktreeSnapshotObservationV1({ schema_version: '1.0', subject, observation });
  if (evaluated?.kind !== 'OK' || !/^[0-9a-f]{64}$/.test(evaluated.value?.worktree_snapshot_sha256 ?? '')) throw new Error('SUBJECT_MISMATCH');
  return evaluated.value.worktree_snapshot_sha256;
}

async function validateSubjectIdentityAndCwd(subject, definition) {
  const [repository_root, worktree_root, common_git_dir] = await Promise.all([
    realpath(subject.repository_root), realpath(subject.worktree_root), realpath(subject.common_git_dir),
  ]);
  if (repository_root !== subject.repository_root || worktree_root !== subject.worktree_root || common_git_dir !== subject.common_git_dir) throw new Error('SUBJECT_MISMATCH');
  const executionCwd = await realpath(definition.cwd);
  if (!contained(executionCwd, worktree_root)) throw new Error('INPUT_INVALID');
}

async function observeCandidateIdentity(subject, definition) {
  const [repository_root, worktree_root, common_git_dir] = await Promise.all([
    realpath(subject.repository_root), realpath(subject.worktree_root), realpath(subject.common_git_dir),
  ]);
  if (repository_root !== subject.repository_root || worktree_root !== subject.worktree_root || common_git_dir !== subject.common_git_dir) throw new Error('SUBJECT_MISMATCH');
  const executionCwd = await realpath(definition.cwd);
  if (!contained(executionCwd, worktree_root)) throw new Error('SUBJECT_MISMATCH');
  const [repositoryTop, repositoryCommon, head, headTree, commitBytes, branchHead, branch, common, status, ignored, index] = await Promise.all([
    runPhysicalPinnedGit(repository_root, ['rev-parse', '--show-toplevel']),
    runPhysicalPinnedGit(repository_root, ['rev-parse', '--path-format=absolute', '--git-common-dir']),
    runPhysicalPinnedGit(worktree_root, ['rev-parse', 'HEAD']),
    runPhysicalPinnedGit(worktree_root, ['rev-parse', 'HEAD^{tree}']),
    runPhysicalPinnedGit(worktree_root, ['cat-file', 'commit', subject.candidate_sha]),
    runPhysicalPinnedGit(worktree_root, ['rev-parse', `refs/heads/${subject.branch}`]),
    runPhysicalPinnedGit(worktree_root, ['branch', '--show-current']),
    runPhysicalPinnedGit(worktree_root, ['rev-parse', '--path-format=absolute', '--git-common-dir']),
    runPhysicalPinnedGit(worktree_root, ['status', '--porcelain=v1', '-z', '--untracked-files=all', '--no-renames']),
    runPhysicalPinnedGit(worktree_root, ['status', '--porcelain=v1', '-z', '--untracked-files=all', '--no-renames', '--ignored=matching']),
    executeProcess(PINNED_PRODUCTION_GIT_PATH, ['diff', '--cached', '--quiet', subject.candidate_sha, '--'], { cwd: worktree_root, environment: exactGitEnvironment() }),
  ]);
  const separator = commitBytes.stdout.indexOf(Buffer.from('\n\n'));
  const header = separator > 0 ? commitBytes.stdout.subarray(0, separator).toString('ascii').split('\n') : [];
  const tree = /^tree ([0-9a-f]{40})$/.exec(header[0] ?? '')?.[1] ?? null;
  if (await realpath(repositoryTop.stdout.toString('utf8').trim()) !== repository_root
    || await realpath(repositoryCommon.stdout.toString('utf8').trim()) !== common_git_dir
    || head.stdout.toString('ascii').trim() !== subject.candidate_sha
    || headTree.stdout.toString('ascii').trim() !== subject.candidate_tree
    || physicalGitObjectSha('commit', commitBytes.stdout) !== subject.candidate_sha
    || tree !== subject.candidate_tree || branchHead.stdout.toString('ascii').trim() !== subject.candidate_sha
    || branch.stdout.toString('utf8').trim() !== subject.branch
    || await realpath(common.stdout.toString('utf8').trim()) !== subject.common_git_dir
    || status.stdout.length !== 0 || ignored.stdout.length !== 0
    || index.code !== 0 || index.signal !== null) throw new Error('SUBJECT_MISMATCH');
}

function receiptFor(subject, definition, scope_sha256, tuple, execution_cwd, worktree_snapshot_sha256, stdout, stderr) {
  const receipt = {
    validation_id: definition.id, validation_kind: definition.validation_kind, validation_scope: definition.validation_scope,
    status: tuple.status, verdict: tuple.verdict, failure_code: tuple.failure_code,
    command_definition_sha256: sha256(canonical(definition)), receipt_sha256: null,
    subject_kind: 'WORKTREE', subject_sha: subject.head_sha, repository_root: subject.repository_root,
    worktree_root: subject.worktree_root, branch: subject.branch, head_sha: subject.head_sha,
    common_git_dir: subject.common_git_dir, execution_cwd, scope_sha256, worktree_snapshot_sha256,
    candidate_sha: null, candidate_tree: null, stdout_sha256: sha256(stdout), stderr_sha256: sha256(stderr),
    validator_head: null, idempotency_id: definition.id,
  };
  const { receipt_sha256, ...other23 } = receipt;
  receipt.receipt_sha256 = sha256(canonical(other23));
  return ok(receipt);
}

function candidateReceiptFor(subject, definition, scope_sha256, tuple, execution_cwd, stdout, stderr) {
  const receipt = {
    validation_id: definition.id, validation_kind: definition.validation_kind, validation_scope: definition.validation_scope,
    status: tuple.status, verdict: tuple.verdict, failure_code: tuple.failure_code,
    command_definition_sha256: sha256(canonical(definition)), receipt_sha256: null,
    subject_kind: 'CANDIDATE', subject_sha: subject.candidate_sha, repository_root: subject.repository_root,
    worktree_root: subject.worktree_root, branch: subject.branch, head_sha: subject.head_sha,
    common_git_dir: subject.common_git_dir, execution_cwd, scope_sha256, worktree_snapshot_sha256: null,
    candidate_sha: subject.candidate_sha, candidate_tree: subject.candidate_tree,
    stdout_sha256: sha256(stdout), stderr_sha256: sha256(stderr), validator_head: null, idempotency_id: definition.id,
  };
  const { receipt_sha256, ...other23 } = receipt;
  receipt.receipt_sha256 = sha256(canonical(other23));
  return ok(receipt);
}

async function executeValidationChild(executable, args, cwd, timeout_ms) {
  return new Promise(resolve => {
    let timedOut = false; let settled = false; const stdout = []; const stderr = [];
    let child;
    const finish = result => { if (!settled) { settled = true; clearTimeout(timer); resolve(result); } };
    const timer = setTimeout(() => { timedOut = true; child?.kill('SIGKILL'); }, timeout_ms);
    try {
      child = spawn(executable, args, { cwd, env: {}, shell: false, stdio: ['ignore', 'pipe', 'pipe'] });
      child.stdout.on('data', chunk => stdout.push(Buffer.from(chunk)));
      child.stderr.on('data', chunk => stderr.push(Buffer.from(chunk)));
      child.once('error', () => finish({ kind: 'START_FAILED', stdout: Buffer.alloc(0), stderr: Buffer.alloc(0) }));
      child.once('close', (code, signal) => finish({ kind: 'TERMINAL', code, signal, timedOut, stdout: Buffer.concat(stdout), stderr: Buffer.concat(stderr) }));
    } catch {
      finish({ kind: 'START_FAILED', stdout: Buffer.alloc(0), stderr: Buffer.alloc(0) });
    }
  });
}

export function createValidationGateway(input) {
  if (!closedDataObject(input, ['nodeExecutable']) || typeof input.nodeExecutable !== 'string' || !path.isAbsolute(input.nodeExecutable)) throw new Error('INPUT_INVALID');
  const { nodeExecutable } = input;
  const gateway = {
    async execute(request) {
      if (!closedDataObject(request, ['definition', 'subject'])) throw new Error('INPUT_INVALID');
      const { definition, subject } = request;
      const candidateSubject = validCandidateSubject(subject);
      let candidateScope;
      let pre;
      if (candidateSubject) {
        validateCandidateDefinition(definition, nodeExecutable);
        candidateScope = worktreeScopeSha256(subject);
        try {
          await observeCandidateIdentity(subject, definition);
        } catch {
          return candidateReceiptFor(subject, definition, candidateScope, { status: 'START_FAILED', verdict: null, failure_code: 'SUBJECT_MISMATCH' }, null, Buffer.alloc(0), Buffer.alloc(0));
        }
      } else {
        if (!validWorktreeSubject(subject)) throw new Error('INPUT_INVALID');
        validateDefinition(definition, nodeExecutable);
        const scope_sha256 = worktreeScopeSha256(subject);
        try {
          await validateSubjectIdentityAndCwd(subject, definition);
          const observation = await collectWorktreeSnapshotObservationV1(subject);
          pre = evaluateWorktreeSnapshotObservationV1({ schema_version: '1.0', subject, observation });
          if (pre.kind !== 'OK') throw new Error('SUBJECT_MISMATCH');
        } catch (error) {
          if (error?.message === 'INPUT_INVALID') throw error;
          return receiptFor(subject, definition, scope_sha256, { status: 'START_FAILED', verdict: null, failure_code: 'SUBJECT_MISMATCH' }, null, null, Buffer.alloc(0), Buffer.alloc(0));
        }
      }
      const child = await executeValidationChild(nodeExecutable, definition.argv.slice(1), definition.cwd, definition.timeout_ms);
      if (candidateSubject) {
        try {
          await observeCandidateIdentity(subject, definition);
        } catch {
          return candidateReceiptFor(subject, definition, candidateScope, { status: 'INTERRUPTED', verdict: null, failure_code: 'SUBJECT_MISMATCH' }, definition.cwd, child.stdout, child.stderr);
        }
        if (child.kind === 'START_FAILED') return candidateReceiptFor(subject, definition, candidateScope, { status: 'START_FAILED', verdict: null, failure_code: 'PROCESS_START_FAILED' }, definition.cwd, child.stdout, child.stderr);
        if (child.timedOut) return candidateReceiptFor(subject, definition, candidateScope, { status: 'INTERRUPTED', verdict: null, failure_code: 'TIMEOUT' }, definition.cwd, child.stdout, child.stderr);
        if (child.signal !== null) return candidateReceiptFor(subject, definition, candidateScope, { status: 'INTERRUPTED', verdict: null, failure_code: 'SIGNAL_EXIT' }, definition.cwd, child.stdout, child.stderr);
        return candidateReceiptFor(subject, definition, candidateScope, child.code === 0
          ? { status: 'COMPLETED', verdict: 'PASS', failure_code: null }
          : { status: 'COMPLETED', verdict: 'FAIL', failure_code: 'NONZERO_EXIT' }, definition.cwd, child.stdout, child.stderr);
      }
      let post;
      try {
        const observation = await collectWorktreeSnapshotObservationV1(subject);
        post = evaluateWorktreeSnapshotObservationV1({ schema_version: '1.0', subject, observation });
      } catch {
        post = { kind: 'REJECTED', reason: 'SUBJECT_MISMATCH' };
      }
      if (post.kind !== 'OK' || post.value.scope_sha256 !== pre.value.scope_sha256 || post.value.worktree_snapshot_sha256 !== pre.value.worktree_snapshot_sha256) {
        return receiptFor(subject, definition, pre.value.scope_sha256, { status: 'INTERRUPTED', verdict: null, failure_code: 'SUBJECT_MISMATCH' }, definition.cwd, pre.value.worktree_snapshot_sha256, child.stdout, child.stderr);
      }
      if (child.kind === 'START_FAILED') return receiptFor(subject, definition, pre.value.scope_sha256, { status: 'START_FAILED', verdict: null, failure_code: 'PROCESS_START_FAILED' }, definition.cwd, pre.value.worktree_snapshot_sha256, child.stdout, child.stderr);
      if (child.timedOut) return receiptFor(subject, definition, pre.value.scope_sha256, { status: 'INTERRUPTED', verdict: null, failure_code: 'TIMEOUT' }, definition.cwd, pre.value.worktree_snapshot_sha256, child.stdout, child.stderr);
      if (child.signal !== null) return receiptFor(subject, definition, pre.value.scope_sha256, { status: 'INTERRUPTED', verdict: null, failure_code: 'SIGNAL_EXIT' }, definition.cwd, pre.value.worktree_snapshot_sha256, child.stdout, child.stderr);
      return receiptFor(subject, definition, pre.value.scope_sha256, child.code === 0
        ? { status: 'COMPLETED', verdict: 'PASS', failure_code: null }
        : { status: 'COMPLETED', verdict: 'FAIL', failure_code: 'NONZERO_EXIT' }, definition.cwd, pre.value.worktree_snapshot_sha256, child.stdout, child.stderr);
    },
  };
  return Object.freeze(gateway);
}

// K1 owns one deliberately narrow physical staging boundary.  It accepts the
// already-admitted Worktree subject and never turns signed scope patterns into
// paths; the only byte stream sent to Git is the observed, sorted path list.
export function createCandidateStageGateway(input) {
  if (!closedDataObject(input, ['gitExecutable']) || typeof input.gitExecutable !== 'string' || !path.isAbsolute(input.gitExecutable)) throw new Error('INPUT_INVALID');
  const git = async (cwd, args, inputBytes = null) => {
    const result = await executeProcess(input.gitExecutable, args, { cwd, environment: { LC_ALL: 'C', LANG: 'C', TZ: 'UTC', GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: '/dev/null', GIT_ATTR_NOSYSTEM: '1', GIT_PAGER: 'cat', PAGER: 'cat', GIT_TERMINAL_PROMPT: '0', GIT_NO_REPLACE_OBJECTS: '1' }, input: inputBytes });
    if (result.code !== 0 || result.signal !== null) throw new Error('SUBJECT_MISMATCH');
    return result.stdout;
  };
  const staged = async ({ canonical_root, subject, retained = null, postFence = false }) => {
    if (!validWorktreeSubject(subject) || canonical_root !== subject.repository_root) throw new Error('INPUT_INVALID');
    const raw = await git(subject.worktree_root, ['diff', '--cached', '--name-status', '-z', '--no-renames', subject.head_sha, '--']);
    const values = raw.toString('utf8').split('\0');
    if (values.at(-1) !== '') throw new Error('SUBJECT_MISMATCH');
    const paths = []; const statusByPath = new Map();
    for (let index = 0; index < values.length - 1; index += 2) {
      if (!['A', 'M', 'D', 'T'].includes(values[index]) || !values[index + 1]) throw new Error('SUBJECT_MISMATCH');
      paths.push(values[index + 1]); statusByPath.set(values[index + 1], values[index]);
    }
    paths.sort((left, right) => Buffer.compare(Buffer.from(left), Buffer.from(right)));
    if (new Set(paths).size !== paths.length) throw new Error('SUBJECT_MISMATCH');
    const cachedRaw = await git(subject.worktree_root, ['diff', '--cached', '--raw', '-z', '--full-index', '--no-abbrev', '--no-renames', subject.head_sha, '--']);
    const rawRecords = cachedRaw.toString('utf8').split('\0').filter(Boolean);
    if (rawRecords.length !== paths.length * 2) throw new Error('SUBJECT_MISMATCH');
    for (let index = 0; index < rawRecords.length; index += 2) {
      const match = /^:[0-7]{6} [0-7]{6} [0-9a-f]{40} [0-9a-f]{40} ([AMDT])$/.exec(rawRecords[index]);
      if (!match || rawRecords[index + 1] !== paths[index / 2] || match[1] !== statusByPath.get(rawRecords[index + 1])) throw new Error('SUBJECT_MISMATCH');
      if (retained) {
        const entry = retained.get(rawRecords[index + 1]);
        const [, oldMode, newMode, , object] = /^:([0-7]{6}) ([0-7]{6}) ([0-9a-f]{40}) ([0-9a-f]{40}) [AMDT]$/.exec(rawRecords[index]) ?? [];
        if (!entry || !oldMode || (match[1] === 'D' ? newMode !== '000000' || object !== '0'.repeat(40) || entry.content.kind !== 'MISSING' : !['FILE', 'SYMLINK'].includes(entry.before.type))) throw new Error('SUBJECT_MISMATCH');
        if (match[1] !== 'D') {
          const expectedMode = entry.before.type === 'SYMLINK' ? '120000' : (entry.before.mode & 0o111n) !== 0n ? '100755' : '100644';
          const blob = await git(subject.worktree_root, ['cat-file', 'blob', object]);
          const expectedContent = entry.content.kind === 'FILE' ? entry.content.sha256 : entry.content.target_sha256;
          if (newMode !== expectedMode || sha256(blob) !== expectedContent) throw new Error('SUBJECT_MISMATCH');
        }
      }
    }
    const index_tree = (await git(subject.worktree_root, ['write-tree'])).toString('utf8').trim();
    if (retained && index_tree === (await git(subject.worktree_root, ['rev-parse', `${subject.head_sha}^{tree}`])).toString('utf8').trim()) throw new Error('SUBJECT_MISMATCH');
    if (!postFence) return { staged_paths: paths, staged_paths_sha256: sha256(canonical(paths)), index_tree };
    const remainder = await executeProcess(input.gitExecutable, ['diff', '--quiet', '--no-ext-diff', '--'], { cwd: subject.worktree_root, environment: { LC_ALL: 'C', LANG: 'C', TZ: 'UTC', GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: '/dev/null', GIT_ATTR_NOSYSTEM: '1', GIT_PAGER: 'cat', PAGER: 'cat', GIT_TERMINAL_PROMPT: '0', GIT_NO_REPLACE_OBJECTS: '1' } });
    if (remainder.code !== 0 || remainder.signal !== null || remainder.stdout.length !== 0 || remainder.stderr.length !== 0) throw new Error('SUBJECT_MISMATCH');
    const post = await git(subject.worktree_root, ['status', '--porcelain=v1', '-z', '--untracked-files=all', '--no-renames']);
    const ignored = await git(subject.worktree_root, ['status', '--porcelain=v1', '-z', '--untracked-files=all', '--ignored=matching', '--no-renames']);
    const expectedPost = paths.map(item => `${statusByPath.get(item)}  ${item}\0`).join('');
    if (!post.equals(ignored) || post.toString('utf8') !== expectedPost) throw new Error('SUBJECT_MISMATCH');
    return { staged_paths: paths, staged_paths_sha256: sha256(canonical(paths)), index_tree };
  };
  const stageExact = async request => {
    if (!closedDataObject(request, ['canonical_root', 'subject', 'expected_worktree_snapshot_sha256', 'paths']) || !Array.isArray(request.paths) || request.paths.length === 0) throw new Error('INPUT_INVALID');
    const { canonical_root, subject, expected_worktree_snapshot_sha256, paths } = request;
    if (!validWorktreeSubject(subject) || canonical_root !== subject.repository_root || !/^[0-9a-f]{64}$/.test(expected_worktree_snapshot_sha256)) throw new Error('INPUT_INVALID');
    const observation = await collectWorktreeSnapshotObservationV1(subject);
    const snapshot = evaluateWorktreeSnapshotObservationV1({ schema_version: '1.0', subject, observation });
    if (snapshot.kind !== 'OK' || snapshot.value.worktree_snapshot_sha256 !== expected_worktree_snapshot_sha256) throw new Error('SUBJECT_MISMATCH');
    const observed = observation.entries.map(entry => entry.path_bytes.toString('utf8')).sort((left, right) => Buffer.compare(Buffer.from(left), Buffer.from(right)));
    if (canonical(observed) !== canonical(paths)) throw new Error('SUBJECT_MISMATCH');
    await git(subject.worktree_root, ['--literal-pathspecs', 'add', '--pathspec-from-file=-', '--pathspec-file-nul'], Buffer.concat(paths.map(item => Buffer.concat([Buffer.from(item), Buffer.from([0])]))));
    const retained = new Map(observation.entries.map(entry => [entry.path_bytes.toString('utf8'), entry]));
    const value = await staged({ canonical_root, subject, retained, postFence: true });
    if (value.staged_paths.length !== paths.length || canonical(value.staged_paths) !== canonical(paths)) throw new Error('SUBJECT_MISMATCH');
    return value;
  };
  const readStaged = async request => {
    if (!closedDataObject(request, ['canonical_root', 'worktree_root'])) throw new Error('INPUT_INVALID');
    // The Coordinator already holds the signed subject; reconstructing it
    // here would silently replace that authority, so this is purpose-bound to
    // the same fields supplied by the K1 caller in the production seam.
    const head = (await git(request.worktree_root, ['rev-parse', 'HEAD'])).toString('utf8').trim();
    const branch = (await git(request.worktree_root, ['branch', '--show-current'])).toString('utf8').trim();
    const common_git_dir = await realpath((await git(request.worktree_root, ['rev-parse', '--path-format=absolute', '--git-common-dir'])).toString('utf8').trim());
    return staged({ canonical_root: request.canonical_root, subject: { kind: 'WORKTREE', repository_root: request.canonical_root, worktree_root: request.worktree_root, branch, head_sha: head, common_git_dir, allowed_paths: [], forbidden_paths: [] } });
  };
  return Object.freeze({ stageExact, readStaged });
}

export function createHandoffGateway(stateRoot) {
  if (typeof stateRoot !== 'string' || stateRoot.length === 0 || path.resolve(stateRoot) !== stateRoot
    || stateRoot === path.parse(stateRoot).root || /[\0\n\r]/.test(stateRoot)
    || Buffer.from(stateRoot, 'utf8').toString('utf8') !== stateRoot) throw new Error('INPUT_INVALID');
  return Object.freeze({
    async writeReadback(request) {
      if (!closed(request, ['expected_sha256', 'handoff_bytes']) || !/^[0-9a-f]{64}$/.test(request.expected_sha256)
        || !(request.handoff_bytes instanceof Uint8Array)) throw new Error('INPUT_INVALID');
      const { expected_sha256, handoff_bytes } = request;
      let handoff;
      try { handoff = parseCanonical(handoff_bytes); } catch { throw new Error('INPUT_INVALID'); }
      if (handoff === null || typeof handoff !== 'object' || Array.isArray(handoff)) throw new Error('INPUT_INVALID');
      if (!safeChange(handoff.change_id) || sha256(handoff_bytes) !== expected_sha256
        || typeof handoff.delivery_id !== 'string' || !/^delivery-[0-9a-f]{64}$/.test(handoff.delivery_id)
        || handoff.idempotency_id !== handoff.delivery_id) throw new Error('INPUT_INVALID');
      const target = path.join(stateRoot, 'changes', handoff.change_id, 'handoff.json');
      if (path.resolve(target) !== target || !target.startsWith(`${stateRoot}${path.sep}`)) throw new Error('INPUT_INVALID');
      const bytes = await atomicWrite(target, handoff_bytes);
      return ok({ handoff_sha256: sha256(bytes), delivery_id: handoff.delivery_id });
    },
  });
}

function createPurposeBoundMainSync({ gitExecutable, mainWorktreeRoot, branchKeyPath, runtime_uid, repository }) {
  if (typeof repository !== 'string' || !/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository)) throw new Error('INPUT_INVALID');
  const remoteUrl = `git@github.com:${repository}.git`;
  return async ({ canonical_root, main_worktree_root, squash_sha, expected_origin_main }) => {
    const root = main_worktree_root ?? canonical_root;
    if (root !== mainWorktreeRoot || !/^[0-9a-f]{40}$/.test(squash_sha)
      || expected_origin_main !== squash_sha) throw new Error('FORBIDDEN_TARGET');
    await readAuthorityFile(branchKeyPath, 0o640);
    const transport = [
      '-c', `core.sshCommand=${gitTransportArguments(branchKeyPath)}`,
      '-c', 'credential.helper=',
    ];
    const git = async args => {
      const result = await executeProcess(gitExecutable, args, {
        cwd: root, environment: exactGitEnvironment(), runtime_uid, runtime_gid: 0,
      });
      if (result.code !== 0) throw new Error('REMOTE_AMBIGUOUS');
      return result.stdout.toString('utf8').trim();
    };
    if (await git(['branch', '--show-current']) !== 'main'
      || await git(['status', '--porcelain=v1', '-z']) !== '') throw new Error('WORKTREE_NOT_CLEAN');
    const prior_local_main = await git(['rev-parse', 'HEAD']);
    const advertised = await git([...transport, 'ls-remote', remoteUrl, 'refs/heads/main']);
    const advertisedHead = advertised.split(/\s+/)[0];
    if (advertisedHead !== squash_sha) throw new Error('REMOTE_CONFLICT');
    await git([...transport, 'fetch', '--no-tags', '--no-write-fetch-head',
      remoteUrl, 'refs/heads/main:refs/remotes/origin/main']);
    const origin_main = await git(['rev-parse', 'refs/remotes/origin/main']);
    if (origin_main !== squash_sha) throw new Error('READBACK_MISMATCH');
    await git(['merge', '--ff-only', squash_sha]);
    const local_main = await git(['rev-parse', 'HEAD']);
    const readback_origin = await git(['rev-parse', 'refs/remotes/origin/main']);
    const clean = await git(['status', '--porcelain=v1', '-z']) === '';
    if (local_main !== squash_sha || readback_origin !== squash_sha || !clean) throw new Error('READBACK_MISMATCH');
    return ok({ prior_local_main, local_main, origin_main: readback_origin, clean, fast_forward_only: true });
  };
}

export function createLedgerObjectReader(input) {
  const closedData = (value, keys) => value !== null && typeof value === 'object' && !Array.isArray(value)
    && Object.getPrototypeOf(value) === Object.prototype && Reflect.ownKeys(value).length === keys.length
    && keys.every(key => {
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      return descriptor && Object.hasOwn(descriptor, 'value') && descriptor.enumerable === true;
    });
  const pathInput = value => typeof value === 'string' && path.isAbsolute(value) && path.resolve(value) === value
    && value !== path.parse(value).root && !/[\0\n\r]/.test(value) && Buffer.from(value, 'utf8').toString('utf8') === value;
  const oid = value => typeof value === 'string' && /^[0-9a-f]{40}$/.test(value) && value !== '0'.repeat(40);
  if (!closedData(input, ['repositoryRoot', 'gitExecutable', 'runtime_uid', 'runtime_gid'])) throw new Error('INPUT_INVALID');
  const { repositoryRoot, gitExecutable, runtime_uid, runtime_gid } = input;
  if (!pathInput(repositoryRoot) || !pathInput(gitExecutable) || gitExecutable !== PINNED_PRODUCTION_GIT_PATH
    || !Number.isSafeInteger(runtime_uid) || runtime_uid < 0 || !Number.isSafeInteger(runtime_gid) || runtime_gid < 0
    || (process.getuid() !== 0 && (runtime_uid !== process.getuid() || runtime_gid !== process.getgid()))) throw new Error('INPUT_INVALID');
  const read = async request => {
    if (!closedData(request, ['remote_ref', 'expected_tip', 'tip', 'tip_tree', 'change_id'])
      || request.remote_ref !== EVIDENCE_REF || !(request.expected_tip === null || oid(request.expected_tip))
      || !safeChange(request.change_id) || !((request.tip === null && request.tip_tree === null)
        || (oid(request.tip) && oid(request.tip_tree)))) throw new Error('INPUT_INVALID');
    const absentValue = { remote_ref: request.remote_ref, expected_tip: request.expected_tip, tip: request.tip,
      tip_parent: null, tip_tree: request.tip_tree, authoritative_path: `ledger/${request.change_id}.jsonl`,
      file_present: false, ledger_bytes_base64: '', prior_bytes_sha256: sha256(Buffer.alloc(0)), prior_byte_length: 0,
      last_event_id: null, last_event_hash: null, last_sequence: 0 };
    if (request.tip === null) return ok(absentValue);
    const processUnavailable = () => ({ kind: 'UNAVAILABLE', reason: 'PROCESS_FAILED', partial_receipt: null });
    const completed = result => result?.code === 0 && result.signal === null && result.stderr.length === 0
      && result.timed_out === false && result.overflowed === false;
    const execute = args => executeProcess(gitExecutable, args, {
      cwd: repositoryRoot, environment: exactGitEnvironment(), runtime_uid, runtime_gid,
    });
    let type; let commit;
    try {
      type = await execute(['cat-file', '-t', request.tip]);
      if (!completed(type)) return processUnavailable();
      if (!type.stdout.equals(Buffer.from('commit\n'))) return { kind: 'CONFLICT', reason: 'READBACK_MISMATCH', observed_identity: null };
      commit = await execute(['cat-file', 'commit', request.tip]);
      if (!completed(commit)) return processUnavailable();
    } catch { return processUnavailable(); }
    const separator = commit.stdout.indexOf(Buffer.from('\n\n'));
    if (separator <= 0) return { kind: 'CONFLICT', reason: 'READBACK_MISMATCH', observed_identity: null };
    const headerBytes = commit.stdout.subarray(0, separator);
    const headerText = headerBytes.toString('utf8');
    if (!Buffer.from(headerText, 'utf8').equals(headerBytes)) return { kind: 'CONFLICT', reason: 'READBACK_MISMATCH', observed_identity: null };
    const header = headerText.split('\n');
    const physicalTree = /^tree ([0-9a-f]{40})$/.exec(header[0] ?? '')?.[1] ?? null;
    const parents = header.filter(line => line.startsWith('parent ')).map(line => /^parent ([0-9a-f]{40})$/.exec(line)?.[1] ?? null);
    const author = header.filter(line => /^author .+ <[^<>\n]+> [0-9]+ [+-][0-9]{4}$/.test(line));
    const committer = header.filter(line => /^committer .+ <[^<>\n]+> [0-9]+ [+-][0-9]{4}$/.test(line));
    const malformedRequiredHeader = header.some(line => /^(tree|parent|author|committer)(?:\s|$)/.test(line)
      && !(/^tree [0-9a-f]{40}$/.test(line) || /^parent [0-9a-f]{40}$/.test(line)
        || /^author .+ <[^<>\n]+> [0-9]+ [+-][0-9]{4}$/.test(line) || /^committer .+ <[^<>\n]+> [0-9]+ [+-][0-9]{4}$/.test(line)));
    if (!oid(physicalTree) || header.filter(line => line.startsWith('tree ')).length !== 1 || parents.some(parent => !oid(parent) || parent === request.tip)
      || author.length !== 1 || committer.length !== 1 || malformedRequiredHeader) return { kind: 'CONFLICT', reason: 'READBACK_MISMATCH', observed_identity: oid(physicalTree) ? physicalTree : null };
    if (physicalTree === null || physicalTree !== request.tip_tree) return { kind: 'CONFLICT', reason: 'READBACK_MISMATCH', observed_identity: physicalTree };
    const target = `ledger/${request.change_id}.jsonl`;
    let entry;
    try {
      entry = await execute(['--literal-pathspecs', 'ls-tree', '-z', '--full-tree', physicalTree, '--', target]);
      if (!completed(entry)) return processUnavailable();
    } catch { return processUnavailable(); }
    if (entry.stdout.length === 0) return ok({ ...absentValue, tip_parent: parents.length === 0 ? null : parents[0], tip_tree: physicalTree });
    const prefix = Buffer.from(`100644 blob `);
    const expectedSuffix = Buffer.from(`\t${target}\0`);
    if (entry.stdout.length !== prefix.length + 40 + expectedSuffix.length || !entry.stdout.subarray(0, prefix.length).equals(prefix)
      || !entry.stdout.subarray(prefix.length + 40).equals(expectedSuffix)) return { kind: 'CONFLICT', reason: 'READBACK_MISMATCH', observed_identity: physicalTree };
    const blobSha = entry.stdout.subarray(prefix.length, prefix.length + 40).toString('ascii');
    if (!oid(blobSha)) return { kind: 'CONFLICT', reason: 'READBACK_MISMATCH', observed_identity: physicalTree };
    let blob;
    try {
      blob = await execute(['cat-file', 'blob', blobSha]);
      if (!completed(blob)) return processUnavailable();
    } catch { return processUnavailable(); }
    const bytes = Buffer.from(blob.stdout);
    try {
      if (bytes.length === 0 || bytes.at(-1) !== 0x0a || bytes.includes(0x0d) || bytes.subarray(0, 3).equals(Buffer.from([0xef, 0xbb, 0xbf]))) throw new Error('invalid Ledger');
      const records = bytes.subarray(0, -1).toString('utf8').split('\n');
      if (records.some(line => line.length === 0)) throw new Error('invalid Ledger');
      const rawLast = records.at(-1); const lastBytes = Buffer.from(rawLast, 'utf8');
      if (!lastBytes.equals(bytes.subarray(bytes.length - lastBytes.length - 1, bytes.length - 1))) throw new Error('invalid Ledger');
      const last = JSON.parse(rawLast);
      if (typeof last.event_id !== 'string' || last.event_id.length === 0 || typeof last.event_hash !== 'string'
        || !/^[0-9a-f]{64}$/.test(last.event_hash) || !Number.isSafeInteger(last.sequence) || last.sequence <= 0) throw new Error('invalid Ledger');
      return ok({ remote_ref: request.remote_ref, expected_tip: request.expected_tip, tip: request.tip,
        tip_parent: parents.length === 0 ? null : parents[0], tip_tree: physicalTree, authoritative_path: target,
        file_present: true, ledger_bytes_base64: bytes.toString('base64'), prior_bytes_sha256: sha256(bytes), prior_byte_length: bytes.length,
        last_event_id: last.event_id, last_event_hash: last.event_hash, last_sequence: last.sequence });
    } catch { return { kind: 'CONFLICT', reason: 'READBACK_MISMATCH', observed_identity: physicalTree }; }
  };
  return Object.freeze({ read });
}

export function createUnpublishedLedgerEvidenceCommitBuilder(input) {
  const exactReceiptKeys = ['remote_ref', 'expected_tip', 'authoritative_path', 'prior_bytes_sha256', 'prior_byte_length', 'new_bytes_sha256', 'new_byte_length', 'event_id', 'event_hash', 'sequence', 'record_offset', 'record_length', 'idempotency_id', 'prepared_bytes_sha256'];
  const oid = value => typeof value === 'string' && /^[0-9a-f]{40}$/.test(value) && value !== '0'.repeat(40);
  const unavailableResult = () => ({ kind: 'UNAVAILABLE', reason: 'PROCESS_FAILED', partial_receipt: null });
  const conflict = observed_identity => ({ kind: 'CONFLICT', reason: 'READBACK_MISMATCH', observed_identity });
  const data = (value, keys) => value !== null && typeof value === 'object' && !Array.isArray(value)
    && Object.getPrototypeOf(value) === Object.prototype && Reflect.ownKeys(value).length === keys.length
    && keys.every(key => { const descriptor = Object.getOwnPropertyDescriptor(value, key); return descriptor && Object.hasOwn(descriptor, 'value') && descriptor.enumerable === true; });
  const root = value => typeof value === 'string' && path.isAbsolute(value) && path.resolve(value) === value
    && value !== path.parse(value).root && !/[\0\r\n]/.test(value) && Buffer.from(value, 'utf8').toString('utf8') === value;
  if (!data(input, ['repositoryRoot', 'stateRoot', 'gitExecutable', 'runtime_uid', 'runtime_gid'])) throw new Error('INPUT_INVALID');
  const { repositoryRoot, stateRoot, gitExecutable, runtime_uid, runtime_gid } = input;
  if (!root(repositoryRoot) || !root(stateRoot) || gitExecutable !== PINNED_PRODUCTION_GIT_PATH
    || !Number.isSafeInteger(runtime_uid) || runtime_uid < 0 || !Number.isSafeInteger(runtime_gid) || runtime_gid < 0
    || (process.getuid() !== 0 && (runtime_uid !== process.getuid() || runtime_gid !== process.getgid()))) throw new Error('INPUT_INVALID');
  const completed = value => value?.code === 0 && value.signal === null && Buffer.isBuffer(value.stderr)
    && value.stderr.length === 0 && value.timed_out === false && value.overflowed === false;
  const exactOid = value => {
    if (!completed(value) || !Buffer.isBuffer(value.stdout) || value.stdout.length !== 41 || value.stdout[40] !== 0x0a) return null;
    const text = value.stdout.subarray(0, 40).toString('ascii');
    return Buffer.from(text, 'ascii').equals(value.stdout.subarray(0, 40)) && oid(text) ? text : null;
  };
  const canonicalJson = bytes => {
    const raw = Buffer.from(bytes).toString('utf8');
    if (!Buffer.from(raw, 'utf8').equals(bytes)) return null;
    const value = JSON.parse(raw); return canonical(value) === raw ? value : null;
  };
  const inputValid = request => {
    if (!data(request, ['prepared_receipt', 'prepared_bytes'])) return null;
    const receipt = request.prepared_receipt; const bytes = request.prepared_bytes;
    if (!data(receipt, exactReceiptKeys) || !(bytes instanceof Uint8Array)) return null;
    const prepared = Buffer.from(bytes);
    const target = receipt.authoritative_path;
    if (typeof target !== 'string' || ![receipt.prior_bytes_sha256, receipt.new_bytes_sha256, receipt.prepared_bytes_sha256, receipt.event_hash].every(value => typeof value === 'string')
      || receipt.remote_ref !== EVIDENCE_REF || !safeChange(target.slice('ledger/'.length, -'.jsonl'.length))
      || target !== `ledger/${target?.slice('ledger/'.length, -'.jsonl'.length)}.jsonl`
      || !(receipt.expected_tip === null || oid(receipt.expected_tip)) || typeof receipt.event_id !== 'string' || receipt.event_id.length === 0
      || !/^[0-9a-f]{64}$/.test(receipt.event_hash) || !Number.isSafeInteger(receipt.sequence) || receipt.sequence <= 0
      || !Number.isSafeInteger(receipt.prior_byte_length) || receipt.prior_byte_length < 0
      || !Number.isSafeInteger(receipt.new_byte_length) || receipt.new_byte_length <= 0
      || !Number.isSafeInteger(receipt.record_offset) || receipt.record_offset !== receipt.prior_byte_length
      || !Number.isSafeInteger(receipt.record_length) || receipt.record_length <= 1
      || typeof receipt.idempotency_id !== 'string' || receipt.idempotency_id.length === 0
      || ![receipt.prior_bytes_sha256, receipt.new_bytes_sha256, receipt.prepared_bytes_sha256].every(value => /^[0-9a-f]{64}$/.test(value))
      || prepared.length !== receipt.new_byte_length || prepared.length !== receipt.record_offset + receipt.record_length
      || sha256(prepared) !== receipt.new_bytes_sha256 || receipt.prepared_bytes_sha256 !== receipt.new_bytes_sha256
      || sha256(prepared.subarray(0, receipt.prior_byte_length)) !== receipt.prior_bytes_sha256) return null;
    const record = prepared.subarray(receipt.record_offset);
    try {
      if (record.at(-1) !== 0x0a || record.subarray(0, -1).includes(0x0a) || record.includes(0x0d)) return null;
      const event = canonicalJson(record.subarray(0, -1)); if (event === null || typeof event !== 'object' || Array.isArray(event)) return null; const { event_hash, ...preimage } = event;
      if (event.change_id !== target.slice('ledger/'.length, -'.jsonl'.length)
        || event.event_id !== receipt.event_id || event_hash !== receipt.event_hash || event_hash !== sha256(canonical(preimage))
        || event.sequence !== receipt.sequence || event.idempotency_id !== receipt.idempotency_id) return null;
      const prefix = prepared.subarray(0, receipt.prior_byte_length);
      if (prefix.length === 0) return receipt.sequence === 1 ? { receipt: Object.freeze(Object.fromEntries(exactReceiptKeys.map(key => [key, receipt[key]]))), bytes: Buffer.from(prepared) } : null;
      if (receipt.expected_tip === null) return null;
      if (prefix.at(-1) !== 0x0a || prefix.includes(0x0d)) return null;
      const lines = prefix.subarray(0, -1).toString('utf8').split('\n');
      if (!Buffer.from(lines.join('\n'), 'utf8').equals(prefix.subarray(0, -1))) return null;
      const parsed = lines.map(line => canonicalJson(Buffer.from(line, 'utf8'))); const last = parsed.at(-1);
      return lines.length > 0 && parsed.every(value => value !== null && typeof value === 'object' && !Array.isArray(value))
        && typeof last.event_id === 'string' && last.event_id.length > 0 && typeof last.event_hash === 'string' && /^[0-9a-f]{64}$/.test(last.event_hash)
        && Number.isSafeInteger(last.sequence) && last.sequence > 0 && last.sequence === receipt.sequence - 1
        ? { receipt: Object.freeze(Object.fromEntries(exactReceiptKeys.map(key => [key, receipt[key]]))), bytes: Buffer.from(prepared) } : null;
    } catch { return null; }
  };
  const work = change => path.join(stateRoot, 'ledger-work', change);
  const construct = async request => {
    let snapshot; try { snapshot = inputValid(request); } catch { throw new Error('INVALID_RECEIPT'); }
    if (!snapshot) throw new Error('INVALID_RECEIPT');
    const { receipt, bytes: prepared_bytes } = snapshot;
    const changeId = receipt.authoritative_path.slice('ledger/'.length, -'.jsonl'.length);
    const ledgerRoot = work(changeId);
    const run = async (args, environment = exactGitEnvironment()) => await executeProcess(gitExecutable, args, { cwd: repositoryRoot, environment, runtime_uid, runtime_gid });
    const type = async (name, expected) => {
      const value = await run(['cat-file', '-t', name]);
      if (!completed(value)) return { unavailable: true };
      const text = value.stdout?.toString('ascii');
      if (!Buffer.isBuffer(value.stdout) || !Buffer.from(text, 'ascii').equals(value.stdout) || !['commit\n', 'tree\n', 'blob\n', 'tag\n'].includes(text)) return { unavailable: true };
      return text === `${expected}\n` ? { ok: true } : { conflict: true };
    };
    const commitInfo = async name => {
      const kind = await type(name, 'commit'); if (kind.unavailable || kind.conflict) return kind;
      const value = await run(['cat-file', 'commit', name]); if (!completed(value)) return { unavailable: true };
      const separator = value.stdout.indexOf(Buffer.from('\n\n')); if (separator <= 0) return { conflict: true };
      const headerBytes = value.stdout.subarray(0, separator); const headerText = headerBytes.toString('utf8');
      if (!Buffer.from(headerText, 'utf8').equals(headerBytes)) return { conflict: true };
      const headers = headerText.split('\n'); const tree = /^tree ([0-9a-f]{40})$/.exec(headers[0] ?? '')?.[1] ?? null;
      const parents = headers.filter(line => line.startsWith('parent ')).map(line => /^parent ([0-9a-f]{40})$/.exec(line)?.[1] ?? null);
      const author = headers.filter(line => /^author .+ <[^<>\n]+> [0-9]+ [+-][0-9]{4}$/.test(line));
      const committer = headers.filter(line => /^committer .+ <[^<>\n]+> [0-9]+ [+-][0-9]{4}$/.test(line));
      const malformed = headers.some(line => /^(tree|parent|author|committer)(?:\s|$)/.test(line)
        && !(/^tree [0-9a-f]{40}$/.test(line) || /^parent [0-9a-f]{40}$/.test(line) || /^author .+ <[^<>\n]+> [0-9]+ [+-][0-9]{4}$/.test(line) || /^committer .+ <[^<>\n]+> [0-9]+ [+-][0-9]{4}$/.test(line)));
      if (!oid(tree) || headers.filter(line => line.startsWith('tree ')).length !== 1 || parents.some(parent => !oid(parent) || parent === name) || author.length !== 1 || committer.length !== 1 || malformed) return { conflict: true, tree: oid(tree) ? tree : null };
      return { ok: true, tree, parents, body: value.stdout.subarray(separator + 2) };
    };
    const recursive = async tree => {
      if (tree === null) return { preserved: Buffer.alloc(0), exact: null };
      const listed = await run(['ls-tree', '-r', '-z', '--full-tree', tree]);
      if (!completed(listed)) return { unavailable: true };
      const records = []; let offset = 0;
      while (offset < listed.stdout.length) {
        const end = listed.stdout.indexOf(0, offset); if (end <= offset) return { conflict: true };
        const record = Buffer.from(listed.stdout.subarray(offset, end + 1)); const tab = record.indexOf(0x09); const headerBytes = tab > 0 ? record.subarray(0, tab) : Buffer.alloc(0); const header = headerBytes.toString('ascii');
        const rawPath = tab > 0 ? record.subarray(tab + 1, -1) : Buffer.alloc(0);
        if (!Buffer.from(header, 'ascii').equals(headerBytes) || !/^(100644 blob|100755 blob|120000 blob|160000 commit) [0-9a-f]{40}$/.test(header) || !oid(header.slice(-40)) || rawPath.length === 0 || rawPath.includes(0)) return { conflict: true };
        records.push({ record, rawPath, header }); offset = end + 1;
      }
      const target = Buffer.from(receipt.authoritative_path); const exact = records.filter(item => item.rawPath.equals(target));
      if (new Set(records.map(item => item.rawPath.toString('hex'))).size !== records.length
        || records.some(item => item.rawPath.length < target.length && target.subarray(0, item.rawPath.length).equals(item.rawPath) && target[item.rawPath.length] === 0x2f)
        || records.some(item => item.rawPath.length > target.length && item.rawPath.subarray(0, target.length).equals(target) && item.rawPath[target.length] === 0x2f)
        || exact.length > 1 || (exact.length === 1 && !/^100644 blob /.test(exact[0].header))) return { conflict: true };
      records.sort((left, right) => Buffer.compare(left.rawPath, right.rawPath));
      return { preserved: Buffer.concat(records.filter(item => !item.rawPath.equals(target)).map(item => item.record)), exact: exact[0] ?? null };
    };
    const targetEntry = async tree => {
      const listed = await run(['--literal-pathspecs', 'ls-tree', '-z', '--full-tree', tree, '--', receipt.authoritative_path]);
      if (!completed(listed)) return { unavailable: true };
      if (listed.stdout.length === 0) return { ok: true, oid: null };
      const prefix = Buffer.from('100644 blob '); const suffix = Buffer.from(`\t${receipt.authoritative_path}\0`);
      if (listed.stdout.length !== prefix.length + 40 + suffix.length || !listed.stdout.subarray(0, prefix.length).equals(prefix) || !listed.stdout.subarray(prefix.length + 40).equals(suffix)) return { conflict: true };
      const physical = listed.stdout.subarray(prefix.length, prefix.length + 40).toString('ascii');
      return Buffer.from(physical, 'ascii').equals(listed.stdout.subarray(prefix.length, prefix.length + 40)) && oid(physical) ? { ok: true, oid: physical } : { conflict: true };
    };
    try {
      let before = Buffer.alloc(0);
      let parentTree = null;
      await mkdir(ledgerRoot, { recursive: true, mode: 0o700 });
      const ledgerFile = path.join(ledgerRoot, 'ledger.jsonl'); const written = await atomicWrite(ledgerFile, prepared_bytes); if (!Buffer.from(written).equals(prepared_bytes)) return unavailableResult();
      const env = { ...exactGitEnvironment(), GIT_INDEX_FILE: path.join(ledgerRoot, 'index') };
      if (receipt.expected_tip !== null) {
        const parentCommit = await commitInfo(receipt.expected_tip); if (parentCommit.unavailable) return unavailableResult(); if (parentCommit.conflict) return conflict(null);
        parentTree = parentCommit.tree; const parentTreeType = await type(parentTree, 'tree'); if (parentTreeType.unavailable) return unavailableResult(); if (parentTreeType.conflict) return conflict(null);
        const loaded = await run(['read-tree', parentTree], env); if (!completed(loaded) || loaded.stdout.length !== 0) return unavailableResult();
        const parent = await recursive(parentTree);
        if (parent.unavailable) return unavailableResult(); if (parent.conflict) return conflict(null);
        const oldTarget = await targetEntry(parentTree); if (oldTarget.unavailable) return unavailableResult(); if (oldTarget.conflict || oldTarget.oid !== (parent.exact?.header.slice(-40) ?? null)) return conflict(null);
        before = parent.preserved;
        if (parent.exact === null) { if (receipt.prior_byte_length !== 0) return conflict(null); }
        else {
          const oldBlob = parent.exact.header.slice(-40); const blob = await run(['cat-file', 'blob', oldBlob]);
          if (!completed(blob)) return unavailableResult(); if (!blob.stdout.equals(prepared_bytes.subarray(0, receipt.prior_byte_length))) return conflict(null);
        }
      } else {
        if (receipt.prior_byte_length !== 0) return conflict(null);
        const loaded = await run(['read-tree', '--empty'], env); if (!completed(loaded) || loaded.stdout.length !== 0) return unavailableResult();
      }
      const blobResult = await run(['hash-object', '-w', ledgerFile], env); const blob = exactOid(blobResult); if (!blob) return unavailableResult(); const blobType = await type(blob, 'blob'); if (blobType.unavailable) return unavailableResult(); if (blobType.conflict) return conflict(null); const blobBytes = await run(['cat-file', 'blob', blob]); if (!completed(blobBytes)) return unavailableResult(); if (!blobBytes.stdout.equals(prepared_bytes)) return conflict(null);
      const updated = await run(['update-index', '--add', '--cacheinfo', '100644', blob, receipt.authoritative_path], env);
      if (!completed(updated) || updated.stdout.length !== 0) return unavailableResult();
      const treeResult = await run(['write-tree'], env); const tree = exactOid(treeResult); if (!tree) return unavailableResult(); const treeType = await type(tree, 'tree'); if (treeType.unavailable) return unavailableResult(); if (treeType.conflict) return conflict(null);
      const afterTree = await recursive(tree); if (afterTree.unavailable) return unavailableResult(); const newTarget = await targetEntry(tree); if (newTarget.unavailable) return unavailableResult(); if (afterTree.conflict || afterTree.exact === null || newTarget.conflict || newTarget.oid !== blob || afterTree.exact.header.slice(-40) !== blob || !afterTree.preserved.equals(before)) return conflict(tree); const afterBlob = await run(['cat-file', 'blob', blob]); if (!completed(afterBlob)) return unavailableResult(); if (!afterBlob.stdout.equals(prepared_bytes)) return conflict(tree);
      const committed = await run(receipt.expected_tip === null ? ['commit-tree', tree, '-m', `JuanerAI evidence ${receipt.event_id}`] : ['commit-tree', tree, '-p', receipt.expected_tip, '-m', `JuanerAI evidence ${receipt.event_id}`], env);
      const commit = exactOid(committed); if (!commit) return unavailableResult();
      const final = await commitInfo(commit); if (final.unavailable) return unavailableResult(); if (final.conflict || final.tree !== tree || final.parents.length !== (receipt.expected_tip === null ? 0 : 1) || (receipt.expected_tip !== null && final.parents[0] !== receipt.expected_tip) || !final.body.equals(Buffer.from(`JuanerAI evidence ${receipt.event_id}\n`))) return conflict(tree);
      return ok({ publication_status: 'UNPUBLISHED', parent_tip: receipt.expected_tip, commit_sha: commit, tree_sha: tree,
        authoritative_path: receipt.authoritative_path, changed_paths: [receipt.authoritative_path], ledger_blob_sha: blob,
        ledger_bytes_sha256: sha256(prepared_bytes), ledger_byte_length: prepared_bytes.length,
        preserved_entries_sha256_before: sha256(before), preserved_entries_sha256_after: sha256(afterTree.preserved) });
    } catch { return unavailableResult(); }
  };
  return Object.freeze({ construct });
}

function createLedgerGateway({ repositoryRoot, stateRoot, gitExecutable, branchKeyPath, runtime_uid, runtime_gid }) {
  const objectReader = createLedgerObjectReader({ repositoryRoot, gitExecutable, runtime_uid, runtime_gid });
  const unpublishedBuilder = createUnpublishedLedgerEvidenceCommitBuilder({ repositoryRoot, stateRoot, gitExecutable, runtime_uid, runtime_gid });
  let prepared = null;
  let lastRemoteRead = null;
  const gateway = {
    async readRemote({ remote_ref, expected_tip, change_id }) {
      if (remote_ref !== EVIDENCE_REF || !(expected_tip === null || /^[0-9a-f]{40}$/.test(expected_tip)) || !safeChange(change_id)) throw new Error('INPUT_INVALID');
      lastRemoteRead = null;
      await readAuthorityFile(branchKeyPath, 0o640);
      const transport = [
        '-c', `core.sshCommand=${gitTransportArguments(branchKeyPath)}`,
        '-c', 'url.git@github.com:.insteadOf=https://github.com/',
      ];
      const remote = await executeProcess(gitExecutable, [...transport, 'ls-remote', 'origin', EVIDENCE_REF], {
        cwd: repositoryRoot, environment: exactGitEnvironment(), runtime_uid, runtime_gid: 0,
      });
      if (remote.code !== 0 || remote.signal !== null || remote.stderr.length !== 0 || remote.timed_out || remote.overflowed) return { kind: 'UNAVAILABLE', reason: 'PROCESS_FAILED', partial_receipt: null };
      const remoteLine = remote.stdout.toString('utf8');
      const tip = remoteLine === '' ? null : /^([0-9a-f]{40})\trefs\/heads\/evidence\/agent-runs\n$/.exec(remoteLine)?.[1] ?? false;
      if (tip === false || tip === '0'.repeat(40)) return { kind: 'UNAVAILABLE', reason: 'PROCESS_FAILED', partial_receipt: null };
      let tip_tree = null;
      if (tip) {
        try {
          const observed = await executeProcess(gitExecutable, ['rev-parse', `${tip}^{tree}`], {
            cwd: repositoryRoot, environment: exactGitEnvironment(), runtime_uid, runtime_gid,
          });
          if (observed.code !== 0 || observed.signal !== null || observed.stderr.length !== 0 || observed.timed_out || observed.overflowed
            || !/^[0-9a-f]{40}\n$/.test(observed.stdout.toString('utf8')) || observed.stdout.toString('utf8').slice(0, 40) === '0'.repeat(40)) return { kind: 'UNAVAILABLE', reason: 'PROCESS_FAILED', partial_receipt: null };
          tip_tree = observed.stdout.toString('utf8').slice(0, 40);
        } catch { return { kind: 'UNAVAILABLE', reason: 'PROCESS_FAILED', partial_receipt: null }; }
      }
      const result = await objectReader.read({ remote_ref: EVIDENCE_REF, expected_tip, tip, tip_tree, change_id });
      if (result.kind !== 'OK') return result;
      const prior = Buffer.from(result.value.ledger_bytes_base64, 'base64');
      lastRemoteRead = { receipt_sha256: result.receipt_sha256, value: result.value, bytes: Buffer.from(prior), change_id };
      return result;
    },
    async prepareAppend({ remote_read_receipt_sha256, expected_tip, prior_bytes, event_bytes }) {
      if (!lastRemoteRead || remote_read_receipt_sha256 !== lastRemoteRead.receipt_sha256
        || expected_tip !== lastRemoteRead.value.tip || !(prior_bytes instanceof Uint8Array) || !(event_bytes instanceof Uint8Array)
        || !Buffer.from(prior_bytes).equals(lastRemoteRead.bytes)) throw new Error('INVALID_RECEIPT');
      const priorBytes = Buffer.from(prior_bytes); const record = Buffer.from(event_bytes);
      let event;
      try {
        if (record.length < 2 || record.at(-1) !== 0x0a || record.subarray(0, -1).includes(0x0a)) throw new Error('INVALID_RECEIPT');
        const raw = record.subarray(0, -1).toString('utf8'); event = JSON.parse(raw);
        const { event_hash, ...preimage } = event;
        if (canonical(event) !== raw || event.change_id !== lastRemoteRead.change_id || event_hash !== sha256(canonical(preimage))) throw new Error('INVALID_RECEIPT');
      } catch { throw new Error('INVALID_RECEIPT'); }
      const next = Buffer.concat([priorBytes, record]);
      prepared = {
        change_id: lastRemoteRead.change_id, event, record, bytes: next, publication: null,
        receipt: {
          remote_ref: EVIDENCE_REF, expected_tip, authoritative_path: `ledger/${lastRemoteRead.change_id}.jsonl`,
          prior_bytes_sha256: sha256(priorBytes), prior_byte_length: priorBytes.length,
          new_bytes_sha256: sha256(next), new_byte_length: next.length,
          event_id: event.event_id, event_hash: event.event_hash, sequence: event.sequence,
          record_offset: priorBytes.length, record_length: record.length,
          idempotency_id: event.idempotency_id, prepared_bytes_sha256: sha256(next),
        },
      };
      return ok(prepared.receipt);
    },
    async commitAndPush({ prepared_receipt: receipt, idempotency_id }) {
      if (!prepared || canonical(prepared.receipt) !== canonical(receipt) || idempotency_id !== prepared.receipt.idempotency_id) throw new Error('INVALID_RECEIPT');
      if (prepared.publication === null) {
        const constructed = await unpublishedBuilder.construct({ prepared_receipt: prepared.receipt, prepared_bytes: prepared.bytes });
        if (constructed.kind !== 'OK') return constructed;
        prepared.publication = constructed.value;
      }
      const { tree_sha: tree, commit_sha: commit } = prepared.publication;
      const pushed = await executeProcess(gitExecutable, [
        '-c', `core.sshCommand=${gitTransportArguments(branchKeyPath)}`,
        '-c', 'url.git@github.com:.insteadOf=https://github.com/',
        'push', 'origin', `${commit}:${EVIDENCE_REF}`,
      ], { cwd: repositoryRoot, environment: exactGitEnvironment(), runtime_uid, runtime_gid: 0 });
      if (pushed.code !== 0 || pushed.signal !== null) {
        const partial = { stage: 'EVIDENCE_COMMIT_CREATED', expected_tip: receipt.expected_tip, commit_sha: commit,
          event_id: receipt.event_id, event_hash: receipt.event_hash, idempotency_id: receipt.idempotency_id };
        return { kind: 'AMBIGUOUS', reason: 'REMOTE_AMBIGUOUS', partial_receipt: { ...partial, receipt_sha256: sha256(canonical(partial)) } };
      }
      return ok({
        remote_ref: EVIDENCE_REF, parent_tip: receipt.expected_tip, commit_sha: commit,
        tree_sha: tree, authoritative_path: receipt.authoritative_path,
        changed_paths: [receipt.authoritative_path], prior_bytes_sha256: receipt.prior_bytes_sha256,
        prior_byte_length: receipt.prior_byte_length, new_bytes_sha256: receipt.new_bytes_sha256,
        new_byte_length: receipt.new_byte_length, event_id: receipt.event_id,
        event_hash: receipt.event_hash, sequence: receipt.sequence, record_offset: receipt.record_offset,
        record_length: receipt.record_length, idempotency_id: receipt.idempotency_id,
        preserved_entries_sha256_before: prepared.publication.preserved_entries_sha256_before,
        preserved_entries_sha256_after: prepared.publication.preserved_entries_sha256_after,
        push_status: 'ACKNOWLEDGED',
      });
    },
    async readRemoteAppend({ expected_commit, event_id, event_hash, idempotency_id }) {
      if (!prepared || !/^[0-9a-f]{40}$/.test(expected_commit) || event_id !== prepared.event.event_id
        || event_hash !== prepared.event.event_hash || idempotency_id !== prepared.event.idempotency_id) throw new Error('INVALID_RECEIPT');
      const currentPrepared = prepared;
      const remote = await gateway.readRemote({ remote_ref: EVIDENCE_REF, expected_tip: expected_commit, change_id: currentPrepared.change_id });
      const receipt = currentPrepared.receipt;
      if (!remote || remote.kind !== 'OK') return unavailable();
      if (remote.value.tip !== expected_commit) {
        let targetPresent = true;
        try {
          const observed = Buffer.from(remote.value.ledger_bytes_base64, 'base64');
          const lines = observed.length === 0 ? [] : observed.subarray(0, -1).toString('utf8').split('\n');
          targetPresent = lines.some(line => JSON.parse(line).event_id === event_id);
        } catch { return unavailable(); }
        if (remote.value.tip === receipt.expected_tip && !targetPresent) return absent({ expected_commit, event_id, event_hash, idempotency_id });
        return { kind: 'CONFLICT', reason: 'CAS_CONFLICT', observed_identity: { expected_commit, actual_tip: remote.value.tip } };
      }
      if (remote.value.remote_ref !== EVIDENCE_REF || remote.value.prior_bytes_sha256 !== receipt.new_bytes_sha256
        || remote.value.prior_byte_length !== receipt.new_byte_length || remote.value.last_event_id !== receipt.event_id
        || remote.value.last_event_hash !== receipt.event_hash || remote.value.last_sequence !== receipt.sequence) return unavailable();
      const remoteBytes = Buffer.from(remote.value.ledger_bytes_base64, 'base64');
      const record = remoteBytes.subarray(receipt.record_offset, receipt.record_offset + receipt.record_length);
      if (!record.equals(currentPrepared.record)) return unavailable();
      return ok({
        remote_ref: EVIDENCE_REF, tip: remote.value.tip, parent_tip: receipt.expected_tip,
        commit_sha: remote.value.tip, tree_sha: remote.value.tip_tree,
        authoritative_path: receipt.authoritative_path, prior_bytes_sha256: receipt.prior_bytes_sha256,
        prior_byte_length: receipt.prior_byte_length, new_bytes_sha256: receipt.new_bytes_sha256,
        new_byte_length: receipt.new_byte_length, event_id: receipt.event_id,
        event_hash: receipt.event_hash, sequence: receipt.sequence, record_offset: receipt.record_offset,
        record_length: receipt.record_length, record_bytes_sha256: sha256(record),
        idempotency_id: receipt.idempotency_id, linearized: true,
      });
    },
  };
  return Object.freeze(gateway);
}

function parseHostConfig(bytes) {
  const config = parseCanonical(bytes);
  const keys = [
    'schema_version', 'repository_root', 'main_worktree_root', 'state_root',
    'git_executable', 'node_executable', 'codex_executable', 'runtime_user',
    'runtime_uid', 'runtime_gid', 'runtime_home', 'codex_home', 'artifact_root',
    'github_repository',
  ];
  if (!closed(config, keys) || config.schema_version !== '1.0'
    || ![
      'repository_root', 'main_worktree_root', 'state_root', 'git_executable',
      'node_executable', 'codex_executable', 'runtime_home', 'codex_home', 'artifact_root',
    ].every(key => path.isAbsolute(config[key]))
    || config.git_executable !== PINNED_PRODUCTION_GIT_PATH
    || !Number.isSafeInteger(config.runtime_uid) || !Number.isSafeInteger(config.runtime_gid)
    || typeof config.runtime_user !== 'string') throw new Error('HOST_CONFIG_INVALID');
  return config;
}

export async function readProductionHostConfig() {
  return parseHostConfig(await readAuthorityFile(HOST_CONFIG_PATH));
}

export async function createProductionComposition(input = {}) {
  if (!closed(input, [])) throw new Error('INPUT_INVALID_TRUST_SOURCE_FORBIDDEN');
  const config = await readProductionHostConfig();
  const base = createCoordinatorAdapters({
    repository_root: config.repository_root,
    state_root: config.state_root,
    device: 'mac-mini',
    process_run_id: `production-${process.pid}`,
    git_executable: config.git_executable,
    pull_request_executable: '/usr/bin/false',
    base_environment: {},
    runtime_uid: config.runtime_uid,
    runtime_gid: config.runtime_gid,
  });
  const branchTransport = createBranchTransport({
    gitExecutable: config.git_executable,
    repositoryRoot: config.repository_root,
    branchKeyPath: GITHUB_CREDENTIAL_POLICY.branch_push.path,
    runtime_uid: config.runtime_uid,
    runtime_gid: config.runtime_gid,
  });
  const branchReadback = createBranchReadback({
    gitExecutable: config.git_executable,
    repositoryRoot: config.repository_root,
    branchKeyPath: GITHUB_CREDENTIAL_POLICY.branch_push.path,
    runtime_uid: config.runtime_uid,
    runtime_gid: config.runtime_gid,
  });
  const mainSync = createPurposeBoundMainSync({
    gitExecutable: config.git_executable,
    mainWorktreeRoot: config.main_worktree_root,
    branchKeyPath: GITHUB_CREDENTIAL_POLICY.branch_push.path,
    runtime_uid: config.runtime_uid,
    repository: config.github_repository,
  });
  const candidateStageGateway = createCandidateStageGateway({ gitExecutable: config.git_executable });
  const git = Object.freeze({
    ...base.git,
    stageExact: async request => ok(await candidateStageGateway.stageExact(request)),
    readStaged: async request => ok(await candidateStageGateway.readStaged(request)),
    pushBranch: branchTransport,
    readRemoteBranch: branchReadback,
    syncMainFfOnly: mainSync,
  });
  const verifier = Object.freeze({
    async verify(request) {
      const body = parseCanonical(request.command_body_bytes);
      const result = await verifyControllerCommandSignature({
        ...request,
        trust_document_bytes: await readAuthorityFile(CONTROLLER_TRUST_PATH),
        now: new Date().toISOString(),
      });
      return result.kind === 'VERIFIED' ? { ...result, body } : result;
    },
  });
  const state = createFileState(config.state_root);
  const ledger = createLedgerGateway({
    repositoryRoot: config.repository_root,
    stateRoot: config.state_root,
    gitExecutable: config.git_executable,
    branchKeyPath: GITHUB_CREDENTIAL_POLICY.branch_push.path,
    runtime_uid: config.runtime_uid,
    runtime_gid: config.runtime_gid,
  });
  const pull_request = createPurposeBoundGitHubAdapters({ repository: config.github_repository });
  const validation = createValidationGateway({ nodeExecutable: config.node_executable });
  const handoff = createHandoffGateway(config.state_root);
  let locked = false;
  const mutex = Object.freeze({
    async tryAcquire() { if (locked) return false; locked = true; return true; },
    async release() { if (!locked) throw new Error('MUTEX_NOT_HELD'); locked = false; },
  });
  const dependencies = Object.freeze({
    verifier, state, git, ledger, pull_request, validation, handoff,
    clock: Object.freeze({ now: () => new Date().toISOString() }),
    ids: Object.freeze({ next: kind => `${kind}-${Date.now()}-${createHash('sha256').update(`${process.pid}:${process.hrtime.bigint()}`).digest('hex').slice(0, 16)}` }),
    mutex,
  });
  if (PINNED_GIT_VERSION !== '2.54.0' || PINNED_GIT_EXECUTABLE_SHA256 !== '6b348e2246cd4566a129c34a918ff2381c37eda817797d5bdd64ce719ff068ab') throw new Error('PINNED_GIT_INVALID');
  return createCoordinatorCore(dependencies);
}
