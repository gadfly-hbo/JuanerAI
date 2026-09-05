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
    const timer = setTimeout(() => child.kill('SIGTERM'), timeout_ms);
    const finish = (callback, value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      callback(value);
    };
    const collect = target => chunk => {
      size += chunk.length;
      if (size > MAX_CONTROL_BYTES) return child.kill('SIGTERM');
      target.push(Buffer.from(chunk));
    };
    child.stdout.on('data', collect(stdout));
    child.stderr.on('data', collect(stderr));
    child.once('error', error => finish(reject, error));
    child.once('close', (code, signal) => finish(resolve, {
      code, signal, stdout: Buffer.concat(stdout), stderr: Buffer.concat(stderr),
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

function createFileState(stateRoot) {
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
    writeLocalPause: async request => casWrite(pausePath, request.expected_sha256, request.next_bytes),
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
    if (!safeBranch(request.branch) || !/^[0-9a-f]{40}$/.test(request.head_sha ?? request.candidate_sha)
      || request.expected_remote_head === undefined) throw new Error('FORBIDDEN_TARGET');
    await readAuthorityFile(branchKeyPath, 0o640);
    const head = request.head_sha ?? request.candidate_sha;
    const local = await executeProcess(gitExecutable, [
      'rev-parse', '--verify', `refs/heads/${request.branch}`,
    ], { cwd: repositoryRoot, environment: exactGitEnvironment(), runtime_uid, runtime_gid: 0 });
    const localHead = local.stdout.toString('utf8').trim();
    if (local.code !== 0 || local.signal !== null || localHead !== head) throw new Error('LOCAL_REF_CONFLICT');
    const prior = await executeProcess(gitExecutable, [
      '-c', `core.sshCommand=${gitTransportArguments(branchKeyPath)}`,
      '-c', 'url.git@github.com:.insteadOf=https://github.com/',
      'ls-remote', 'origin', `refs/heads/${request.branch}`,
    ], {
      cwd: repositoryRoot, environment: exactGitEnvironment(), runtime_uid, runtime_gid: 0,
    });
    if (prior.code !== 0) throw new Error('REMOTE_AMBIGUOUS');
    const priorHead = prior.stdout.toString('utf8').trim().split(/\s+/)[0] || null;
    if (priorHead !== request.expected_remote_head) throw new Error('REMOTE_CONFLICT');
    const pushed = await executeProcess(gitExecutable, [
      '-c', `core.sshCommand=${gitTransportArguments(branchKeyPath)}`,
      '-c', 'url.git@github.com:.insteadOf=https://github.com/',
      'push', 'origin', `${head}:refs/heads/${request.branch}`,
    ], { cwd: repositoryRoot, environment: exactGitEnvironment(), runtime_uid, runtime_gid: 0 });
    if (pushed.code !== 0) throw new Error('REMOTE_AMBIGUOUS');
    const readback = await executeProcess(gitExecutable, [
      '-c', `core.sshCommand=${gitTransportArguments(branchKeyPath)}`,
      '-c', 'url.git@github.com:.insteadOf=https://github.com/',
      'ls-remote', 'origin', `refs/heads/${request.branch}`,
    ], {
      cwd: repositoryRoot, environment: exactGitEnvironment(), runtime_uid, runtime_gid: 0,
    });
    if (readback.code !== 0) throw new Error('REMOTE_AMBIGUOUS');
    const remoteHead = readback.stdout.toString('utf8').trim().split(/\s+/)[0] || null;
    if (remoteHead !== head) throw new Error('READBACK_MISMATCH');
    return ok({ prior_remote_head: priorHead, remote_head: remoteHead, forced: false, deleted: false });
  };
}

function createBranchReadback({ gitExecutable, repositoryRoot, branchKeyPath, runtime_uid, runtime_gid }) {
  return async ({ branch }) => {
    if (!safeBranch(branch)) throw new Error('FORBIDDEN_TARGET');
    await readAuthorityFile(branchKeyPath, 0o640);
    const result = await executeProcess(gitExecutable, [
      '-c', `core.sshCommand=${gitTransportArguments(branchKeyPath)}`,
      '-c', 'url.git@github.com:.insteadOf=https://github.com/',
      'ls-remote', 'origin', `refs/heads/${branch}`,
    ], { cwd: repositoryRoot, environment: exactGitEnvironment(), runtime_uid, runtime_gid: 0 });
    if (result.code !== 0) throw new Error('REMOTE_AMBIGUOUS');
    const head_sha = result.stdout.toString('utf8').trim().split(/\s+/)[0];
    if (!/^[0-9a-f]{40}$/.test(head_sha)) throw new Error('REMOTE_AMBIGUOUS');
    return ok({ branch, head_sha });
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

function validateDefinition(definition, nodeExecutable) {
  if (!closedDataObject(definition, WORKTREE_DEFINITION_KEYS) || !['regression-affected-suite', 'regression-test-asset-retirement'].includes(definition.id)
    || definition.validation_kind !== 'REGRESSION' || definition.subject !== 'WORKTREE'
    || (definition.id === 'regression-affected-suite' && definition.validation_scope !== 'AFFECTED_SUITE')
    || (definition.id === 'regression-test-asset-retirement' && definition.validation_scope !== 'TEST_ASSET_RETIREMENT')
    || !closedStringArray(definition.argv) || definition.argv.length < 1 || !definition.argv.every(item => typeof item === 'string')
    || definition.argv[0] !== nodeExecutable || typeof definition.cwd !== 'string' || !path.isAbsolute(definition.cwd) || !closedDataObject(definition.environment, [])
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

async function validateSubjectIdentityAndCwd(subject, definition) {
  const [repository_root, worktree_root, common_git_dir] = await Promise.all([
    realpath(subject.repository_root), realpath(subject.worktree_root), realpath(subject.common_git_dir),
  ]);
  if (repository_root !== subject.repository_root || worktree_root !== subject.worktree_root || common_git_dir !== subject.common_git_dir) throw new Error('SUBJECT_MISMATCH');
  const executionCwd = await realpath(definition.cwd);
  if (!contained(executionCwd, worktree_root)) throw new Error('INPUT_INVALID');
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
      if (!closedDataObject(request, ['definition', 'subject']) || !validWorktreeSubject(request.subject)) throw new Error('INPUT_INVALID');
      const { definition, subject } = request;
      validateDefinition(definition, nodeExecutable);
      const scope_sha256 = worktreeScopeSha256(subject);
      let pre;
      try {
        await validateSubjectIdentityAndCwd(subject, definition);
        const observation = await collectWorktreeSnapshotObservationV1(subject);
        pre = evaluateWorktreeSnapshotObservationV1({ schema_version: '1.0', subject, observation });
        if (pre.kind !== 'OK') throw new Error('SUBJECT_MISMATCH');
      } catch (error) {
        if (error?.message === 'INPUT_INVALID') throw error;
        return receiptFor(subject, definition, scope_sha256, { status: 'START_FAILED', verdict: null, failure_code: 'SUBJECT_MISMATCH' }, null, null, Buffer.alloc(0), Buffer.alloc(0));
      }
      const child = await executeValidationChild(nodeExecutable, definition.argv.slice(1), definition.cwd, definition.timeout_ms);
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

function createHandoffGateway(stateRoot) {
  return Object.freeze({
    async writeReadback({ expected_sha256, handoff_bytes }) {
      const handoff = parseCanonical(handoff_bytes);
      if (!safeChange(handoff.change_id) || sha256(handoff_bytes) !== expected_sha256) throw new Error('INPUT_INVALID');
      const target = path.join(stateRoot, 'changes', handoff.change_id, 'handoff.json');
      const bytes = await atomicWrite(target, handoff_bytes);
      return ok({ handoff_sha256: sha256(bytes), delivery_id: handoff.delivery_id ?? sha256(bytes).slice(0, 32) });
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

function createLedgerGateway({ repositoryRoot, stateRoot, gitExecutable, branchKeyPath, runtime_uid, runtime_gid }) {
  const work = change => path.join(stateRoot, 'ledger-work', change);
  let prepared = null;
  const git = async (args, input = null) => {
    const result = await executeProcess(gitExecutable, args, {
      cwd: repositoryRoot, environment: exactGitEnvironment(), input, runtime_uid, runtime_gid,
    });
    if (result.code !== 0) throw new Error('REMOTE_AMBIGUOUS');
    return result.stdout.toString('utf8').trim();
  };
  const gateway = {
    async readRemote({ change_id }) {
      if (!safeChange(change_id)) throw new Error('INPUT_INVALID');
      await readAuthorityFile(branchKeyPath, 0o640);
      const transport = [
        '-c', `core.sshCommand=${gitTransportArguments(branchKeyPath)}`,
        '-c', 'url.git@github.com:.insteadOf=https://github.com/',
      ];
      const remote = await executeProcess(gitExecutable, [...transport, 'ls-remote', 'origin', EVIDENCE_REF], {
        cwd: repositoryRoot, environment: exactGitEnvironment(), runtime_uid, runtime_gid: 0,
      });
      if (remote.code !== 0) return unavailable();
      const tip = remote.stdout.toString('utf8').trim().split(/\s+/)[0] || null;
      let prior = Buffer.alloc(0);
      if (tip) {
        const shown = await executeProcess(gitExecutable, ['show', `${tip}:ledger/${change_id}.jsonl`], {
          cwd: repositoryRoot, environment: exactGitEnvironment(), runtime_uid, runtime_gid,
        });
        if (shown.code === 0) prior = shown.stdout;
        else if (!shown.stderr.toString('utf8').includes('does not exist')) return unavailable();
      }
      const lines = prior.toString('utf8').split('\n').filter(Boolean);
      const last = lines.length ? JSON.parse(lines.at(-1)) : null;
      return ok({
        remote_ref: EVIDENCE_REF, expected_tip: tip, tip,
        tip_parent: tip ? await git(['rev-parse', `${tip}^`]).catch(() => null) : null,
        tip_tree: tip ? await git(['rev-parse', `${tip}^{tree}`]) : null,
        authoritative_path: `ledger/${change_id}.jsonl`, file_present: prior.length > 0,
        prior_bytes_sha256: sha256(prior), prior_byte_length: prior.length,
        last_event_id: last?.event_id ?? null, last_event_hash: last?.event_hash ?? null,
        last_sequence: last?.sequence ?? 0, prior_bytes_base64: prior.toString('base64'),
      });
    },
    async prepareAppend({ change_id, event_class, detail, prior }) {
      if (!safeChange(change_id) || prior?.remote_ref !== EVIDENCE_REF) throw new Error('INPUT_INVALID');
      const priorBytes = Buffer.from(prior.prior_bytes_base64 ?? '', 'base64');
      if (sha256(priorBytes) !== prior.prior_bytes_sha256) throw new Error('INVALID_RECEIPT');
      const idempotency_id = detail?.admission?.idempotency_id ?? detail?.idempotency_id ?? sha256(canonical(detail));
      const event = {
        schema_version: '1.0', event_id: `evt-${sha256(canonical({ change_id, event_class, detail, idempotency_id })).slice(0, 24)}`,
        sequence: prior.last_sequence + 1, event_class, idempotency_id, change_id,
        occurred_at: new Date().toISOString(), state_version: detail?.state_version ?? 0,
        subject_sha: detail?.ready_state_sha256 ?? detail?.candidate_sha ?? '0'.repeat(40), detail,
      };
      event.event_hash = sha256(canonical(event));
      const record = Buffer.from(`${canonical(event)}\n`);
      const next = Buffer.concat([priorBytes, record]);
      prepared = {
        change_id, prior, bytes: next,
        receipt: {
          remote_ref: EVIDENCE_REF, expected_tip: prior.tip, authoritative_path: `ledger/${change_id}.jsonl`,
          prior_bytes_sha256: sha256(priorBytes), prior_byte_length: priorBytes.length,
          new_bytes_sha256: sha256(next), new_byte_length: next.length,
          event_id: event.event_id, event_hash: event.event_hash, sequence: event.sequence,
          record_offset: priorBytes.length, record_length: record.length,
          idempotency_id, prepared_bytes_sha256: sha256(next),
        },
      };
      return ok(prepared.receipt);
    },
    async commitAndPush({ change_id, prepared: receipt }) {
      if (!prepared || prepared.change_id !== change_id || canonical(prepared.receipt) !== canonical(receipt)) throw new Error('INVALID_RECEIPT');
      const ledgerRoot = work(change_id);
      await mkdir(ledgerRoot, { recursive: true, mode: 0o700 });
      const ledgerFile = path.join(ledgerRoot, 'ledger.jsonl');
      await atomicWrite(ledgerFile, prepared.bytes);
      const index = path.join(ledgerRoot, 'index');
      const env = { ...exactGitEnvironment(), GIT_INDEX_FILE: index };
      if (receipt.expected_tip) await executeProcess(gitExecutable, ['read-tree', `${receipt.expected_tip}^{tree}`], {
        cwd: repositoryRoot, environment: env, runtime_uid, runtime_gid,
      });
      const blob = await git(['hash-object', '-w', ledgerFile]);
      await executeProcess(gitExecutable, ['update-index', '--add', '--cacheinfo', '100644', blob, receipt.authoritative_path], {
        cwd: repositoryRoot, environment: env, runtime_uid, runtime_gid,
      });
      const tree = (await executeProcess(gitExecutable, ['write-tree'], {
        cwd: repositoryRoot, environment: env, runtime_uid, runtime_gid,
      })).stdout.toString('utf8').trim();
      const commitArgs = ['commit-tree', tree, '-m', `JuanerAI evidence ${receipt.event_id}`];
      if (receipt.expected_tip) commitArgs.splice(2, 0, '-p', receipt.expected_tip);
      const commit = (await executeProcess(gitExecutable, commitArgs, {
        cwd: repositoryRoot, environment: env, runtime_uid, runtime_gid,
      })).stdout.toString('utf8').trim();
      const pushed = await executeProcess(gitExecutable, [
        '-c', `core.sshCommand=${gitTransportArguments(branchKeyPath)}`,
        '-c', 'url.git@github.com:.insteadOf=https://github.com/',
        'push', 'origin', `${commit}:${EVIDENCE_REF}`,
      ], { cwd: repositoryRoot, environment: exactGitEnvironment(), runtime_uid, runtime_gid: 0 });
      if (pushed.code !== 0) throw new Error('REMOTE_AMBIGUOUS');
      return ok({
        remote_ref: EVIDENCE_REF, parent_tip: receipt.expected_tip, commit_sha: commit,
        tree_sha: tree, authoritative_path: receipt.authoritative_path,
        changed_paths: [receipt.authoritative_path], prior_bytes_sha256: receipt.prior_bytes_sha256,
        prior_byte_length: receipt.prior_byte_length, new_bytes_sha256: receipt.new_bytes_sha256,
        new_byte_length: receipt.new_byte_length, event_id: receipt.event_id,
        event_hash: receipt.event_hash, sequence: receipt.sequence, record_offset: receipt.record_offset,
        record_length: receipt.record_length, idempotency_id: receipt.idempotency_id,
        push_status: 'ACKNOWLEDGED',
      });
    },
    async readRemoteAppend({ change_id, expected = null }) {
      const remote = await gateway.readRemote({ change_id });
      const receipt = expected ?? prepared?.receipt;
      if (!remote || remote.kind !== 'OK' || !receipt
        || remote.value.remote_ref !== EVIDENCE_REF
        || remote.value.prior_bytes_sha256 !== receipt.new_bytes_sha256
        || remote.value.prior_byte_length !== receipt.new_byte_length
        || remote.value.last_event_id !== receipt.event_id
        || remote.value.last_event_hash !== receipt.event_hash
        || remote.value.last_sequence !== receipt.sequence) return unavailable();
      return ok({
        remote_ref: EVIDENCE_REF, tip: remote.value.tip, parent_tip: receipt.expected_tip,
        commit_sha: remote.value.tip, tree_sha: remote.value.tip_tree,
        authoritative_path: receipt.authoritative_path, prior_bytes_sha256: receipt.prior_bytes_sha256,
        prior_byte_length: receipt.prior_byte_length, new_bytes_sha256: receipt.new_bytes_sha256,
        new_byte_length: receipt.new_byte_length, event_id: receipt.event_id,
        event_hash: receipt.event_hash, sequence: receipt.sequence, record_offset: receipt.record_offset,
        record_length: receipt.record_length, record_bytes_sha256: receipt.prepared_bytes_sha256,
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
  const git = Object.freeze({
    ...base.git,
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
