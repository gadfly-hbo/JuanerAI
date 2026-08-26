import { createHash, createPublicKey, verify } from 'node:crypto';
import { spawn } from 'node:child_process';
import { lstat, mkdir, open, readFile, realpath, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createCoordinatorCore } from './coordinator.mjs';
import {
  PINNED_GIT_EXECUTABLE_SHA256,
  PINNED_GIT_VERSION,
  createCoordinatorAdapters,
} from './adapters.mjs';

export const CONTROLLER_TRUST_PATH = '/private/etc/juanerai/controller-trust.json';
export const HOST_CONFIG_PATH = '/private/etc/juanerai/host-loop.json';
export const EVIDENCE_REF = 'refs/heads/evidence/agent-runs';
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
  return `/usr/bin/ssh -F /dev/null -i ${keyPath} -o IdentitiesOnly=yes -o BatchMode=yes -o StrictHostKeyChecking=yes`;
}

function createBranchTransport({ gitExecutable, repositoryRoot, branchKeyPath, runtime_uid, runtime_gid }) {
  return async request => {
    if (!safeBranch(request.branch) || !/^[0-9a-f]{40}$/.test(request.head_sha ?? request.candidate_sha)
      || request.expected_remote_head === undefined) throw new Error('FORBIDDEN_TARGET');
    await readAuthorityFile(branchKeyPath, 0o640);
    const head = request.head_sha ?? request.candidate_sha;
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
      'push', 'origin', `refs/heads/${request.branch}:refs/heads/${request.branch}`,
    ], { cwd: repositoryRoot, environment: exactGitEnvironment(), runtime_uid, runtime_gid: 0 });
    if (pushed.code !== 0) throw new Error('REMOTE_AMBIGUOUS');
    return ok({ prior_remote_head: priorHead, remote_head: head, forced: false, deleted: false });
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

function createValidationGateway({ nodeExecutable }) {
  const gateway = {
    async execute({ definition, subject_sha }) {
      if (!definition || !Array.isArray(definition.argv) || definition.argv.length < 1
        || !path.isAbsolute(definition.cwd) || !Number.isSafeInteger(definition.timeout_ms)
        || definition.timeout_ms < 1 || !closed(definition.environment ?? {}, Object.keys(definition.environment ?? {}))
        || !/^[0-9a-f]{40}$/.test(subject_sha)) throw new Error('INPUT_INVALID');
      const [declared, ...args] = definition.argv;
      if (declared !== nodeExecutable) throw new Error('FORBIDDEN_TARGET');
      const result = await executeProcess(nodeExecutable, args, {
        cwd: definition.cwd,
        environment: { ...(definition.environment ?? {}) },
        timeout_ms: definition.timeout_ms,
      });
      const status = result.signal ? 'INTERRUPTED' : 'COMPLETED';
      const verdict = status === 'COMPLETED' ? result.code === 0 ? 'PASS' : 'FAIL' : null;
      const compact = {
        validation_id: definition.id,
        validation_kind: definition.validation_kind,
        validation_scope: definition.validation_scope,
        status,
        verdict,
        failure_code: status === 'INTERRUPTED' ? 'SIGNAL_EXIT' : result.code === 0 ? null : 'NONZERO_EXIT',
        command_definition_sha256: sha256(canonical(definition)),
        subject_sha,
        stdout_sha256: sha256(result.stdout),
        stderr_sha256: sha256(result.stderr),
      };
      return ok({ ...compact, receipt_sha256: sha256(canonical(compact)), candidate_sha: null, validator_head: null, idempotency_id: definition.id });
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
  const git = Object.freeze({ ...base.git, pushBranch: branchTransport, readRemoteBranch: branchReadback });
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
