#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import net from 'node:net';
import { chmod, chown, lstat, mkdir, readFile, realpath } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createProductionComposition, readProductionHostConfig } from './production.mjs';

export const HOST_SOCKET_PATH = '/private/var/run/juanerai/change-coordinator.sock';
export const HOST_SETTLEMENT_STAGES = Object.freeze(['STARTED', 'RESULT', 'START_FAILED', 'INTERRUPTED']);
export const HOST_AGENT_BINDING_FIELDS = Object.freeze([
  'correlation_id', 'role', 'agent', 'model', 'reasoning', 'sandbox', 'allowed_paths', 'phase', 'state_version',
  'brief_sha256', 'input_sha256', 'output_schema_sha256', 'subject_sha', 'idempotency_id',
]);
const MAX_FRAME_BYTES = 1024 * 1024;
const MAX_ADVANCES = 64;
const MAX_AGENT_OUTPUT_BYTES = 16 * 1024 * 1024;
const AGENT_TIMEOUT_MS = 60 * 60 * 1000;
const AGENT_RESULT_ROOT = '/private/var/run/juanerai/agent-results';

const sha256 = value => createHash('sha256').update(value).digest('hex');
const canonical = value => Array.isArray(value)
  ? `[${value.map(canonical).join(',')}]`
  : value && typeof value === 'object'
    ? `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`
    : JSON.stringify(value);
const closed = (value, keys) => value !== null && typeof value === 'object'
  && !Array.isArray(value) && Object.keys(value).length === keys.length
  && keys.every(key => Object.hasOwn(value, key));
const same = (left, right) => canonical(left) === canonical(right);

function parseCanonicalLine(bytes) {
  if (!(bytes instanceof Uint8Array) || bytes.length < 2 || bytes.length > MAX_FRAME_BYTES
    || bytes.at(-1) !== 0x0a || bytes.subarray(0, -1).includes(0x0a)) throw new Error('INPUT_INVALID');
  const raw = Buffer.from(bytes).subarray(0, -1).toString('utf8');
  const value = JSON.parse(raw);
  if (canonical(value) !== raw) throw new Error('INPUT_INVALID');
  return value;
}

function base64(value) {
  if (typeof value !== 'string') throw new Error('INPUT_INVALID');
  const bytes = Buffer.from(value, 'base64');
  if (bytes.toString('base64') !== value) throw new Error('INPUT_INVALID');
  return bytes;
}

function assertExactAction(action, durableRoute) {
  if (!action || action.action_kind !== 'LAUNCH_AGENT'
    || !HOST_AGENT_BINDING_FIELDS.every(field => Object.hasOwn(action, field))
    || !durableRoute || durableRoute.correlation_id !== action.correlation_id) throw new Error('MANUAL_CONTROLLER_STOP');
  for (const field of HOST_AGENT_BINDING_FIELDS) {
    if (!same(durableRoute[field], action[field])) throw new Error('MANUAL_CONTROLLER_STOP');
  }
  return durableRoute;
}

function settlementBinding(action) {
  return Object.fromEntries(HOST_AGENT_BINDING_FIELDS.map(field => [field, structuredClone(action[field])]));
}

function parseCommandBody(commandBodyBytes) {
  const raw = Buffer.from(commandBodyBytes).toString('utf8');
  const value = JSON.parse(raw);
  if (canonical(value) !== raw) throw new Error('INPUT_INVALID');
  return value;
}

function contentAddressedPath(root, digest) {
  if (!path.isAbsolute(root) || !/^[0-9a-f]{64}$/.test(digest)) throw new Error('MANUAL_CONTROLLER_STOP');
  return path.join(root, digest);
}

export function createSameProcessRouteAuthority(config) {
  if (!config || !path.isAbsolute(config.artifact_root) || !path.isAbsolute(config.codex_executable)
    || !Number.isSafeInteger(config.runtime_uid) || !Number.isSafeInteger(config.runtime_gid)) throw new Error('INPUT_INVALID');
  let admitted = null;
  return Object.freeze({
    prepare(commandBodyBytes) {
      const body = parseCommandBody(commandBodyBytes);
      if (body.command_kind !== 'DISPATCH') return null;
      if (!body.worktree || !path.isAbsolute(body.worktree.root) || !Array.isArray(body.payload?.roles)) throw new Error('INPUT_INVALID');
      return {
        change_id: body.change_id,
        worktree_root: body.worktree.root,
        roles: structuredClone(body.payload.roles),
      };
    },
    commit(candidate, result) {
      if (!candidate) return;
      if (!result || result.change_id !== candidate.change_id
        || ['REJECTED', 'PROCESS_FAILURE'].includes(result.outcome)) return;
      admitted = candidate;
    },
    async resolve(action) {
      if (!admitted) throw new Error('MANUAL_CONTROLLER_STOP');
      const role = admitted.roles.find(candidate => candidate.role === action.role);
      if (!role || !HOST_AGENT_BINDING_FIELDS.filter(field => Object.hasOwn(role, field))
        .every(field => same(role[field], action[field]))) throw new Error('MANUAL_CONTROLLER_STOP');
      return {
        ...settlementBinding(action),
        codex_executable: config.codex_executable,
        runtime_uid: config.runtime_uid,
        runtime_gid: config.runtime_gid,
        runtime_home: config.runtime_home,
        codex_home: config.codex_home,
        git_executable: config.git_executable,
        worktree_root: admitted.worktree_root,
        brief_path: contentAddressedPath(config.artifact_root, action.brief_sha256),
        input_path: contentAddressedPath(config.artifact_root, action.input_sha256),
        output_schema_path: contentAddressedPath(config.artifact_root, action.output_schema_sha256),
        output_artifact_path: path.join(AGENT_RESULT_ROOT, `${action.correlation_id}.json`),
      };
    },
  });
}

function fixedAgentEnvironment(route) {
  return {
    HOME: route.runtime_home,
    CODEX_HOME: route.codex_home,
    PATH: '/opt/homebrew/bin:/usr/bin:/bin:/usr/sbin:/sbin',
    LANG: 'C', LC_ALL: 'C', TZ: 'UTC',
  };
}

async function readExactArtifact(target, expectedSha256) {
  const physical = await realpath(target);
  if (physical !== target) throw new Error('MANUAL_CONTROLLER_STOP');
  const bytes = await readFile(target);
  if (bytes.length === 0 || bytes.length > MAX_FRAME_BYTES || sha256(bytes) !== expectedSha256) throw new Error('MANUAL_CONTROLLER_STOP');
  return bytes;
}

async function spawnExactCodex({ action, route }) {
  const brief = await readExactArtifact(route.brief_path, action.brief_sha256);
  const input = await readExactArtifact(route.input_path, action.input_sha256);
  await readExactArtifact(route.output_schema_path, action.output_schema_sha256);
  await mkdir(AGENT_RESULT_ROOT, { recursive: true, mode: 0o770 });
  await chown(AGENT_RESULT_ROOT, 0, route.runtime_gid);
  await chmod(AGENT_RESULT_ROOT, 0o770);
  const args = [
    'exec', '--ephemeral', '--ignore-user-config', '--approve-for-me',
    '--model', action.model,
    '--config', `model_reasoning_effort=${JSON.stringify(action.reasoning)}`,
    '--sandbox', action.sandbox,
    '--cd', route.worktree_root,
    '--output-schema', route.output_schema_path,
    '--output-last-message', route.output_artifact_path,
    '-',
  ];
  const child = spawn(route.codex_executable, args, {
    cwd: route.worktree_root,
    env: fixedAgentEnvironment(route),
    shell: false,
    uid: route.runtime_uid,
    gid: route.runtime_gid,
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  if (!Number.isSafeInteger(child.pid) || child.pid <= 0) throw new Error('SPAWN_REJECTED');
  child.stdin.end(Buffer.concat([brief, Buffer.from('\n\n'), input]));
  const completed = new Promise((resolve, reject) => {
    const stdout = []; const stderr = []; let size = 0; let settled = false;
    const timer = setTimeout(() => child.kill('SIGTERM'), AGENT_TIMEOUT_MS);
    const finish = (callback, value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      callback(value);
    };
    const collect = target => chunk => {
      size += chunk.length;
      if (size > MAX_AGENT_OUTPUT_BYTES) child.kill('SIGTERM');
      else target.push(Buffer.from(chunk));
    };
    child.stdout.on('data', collect(stdout));
    child.stderr.on('data', collect(stderr));
    child.once('error', error => finish(reject, error));
    child.once('close', async (code, signal) => {
      if (signal) return finish(resolve, { interrupted: true, reason_code: 'AGENT_EXITED' });
      try {
        const artifact = await readFile(route.output_artifact_path);
        const parsed = JSON.parse(artifact.toString('utf8'));
        const status = code === 0 && parsed?.status === 'PASS' ? 'PASS' : 'FAIL';
        finish(resolve, {
          status,
          artifact_sha256: sha256(artifact),
          allowed_path_inventory: await inventoryChangedPaths(route),
          stdout_sha256: sha256(Buffer.concat(stdout)),
          stderr_sha256: sha256(Buffer.concat(stderr)),
        });
      } catch (error) {
        finish(reject, error);
      }
    });
  });
  return { observed_child_id: String(child.pid), completed };
}

async function inventoryChangedPaths(route) {
  const child = spawn(route.git_executable, ['status', '--porcelain=v1', '-z'], {
    cwd: route.worktree_root,
    env: { PATH: '/usr/bin:/bin', LANG: 'C', LC_ALL: 'C', TZ: 'UTC' },
    shell: false,
    uid: route.runtime_uid,
    gid: route.runtime_gid,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const chunks = [];
  child.stdout.on('data', chunk => chunks.push(Buffer.from(chunk)));
  const code = await new Promise((resolve, reject) => {
    child.once('error', reject);
    child.once('close', resolve);
  });
  if (code !== 0) throw new Error('RESULT_UNREADABLE');
  return Buffer.concat(chunks).toString('utf8').split('\0').filter(Boolean)
    .map(entry => entry.slice(3)).sort();
}

export function createTrustedHostLoop(options) {
  if (!options || options.durable_route === null || options.durable_route === undefined) throw new Error('DURABLE_ROUTE_REQUIRED_MANUAL_CONTROLLER_STOP');
  const coordinator = options.coordinator;
  if (!coordinator || ['applyControllerCommand', 'run', 'settlement', 'status'].some(name => typeof coordinator[name] !== 'function')) throw new Error('INPUT_INVALID');
  if (typeof options.durable_route !== 'function' || typeof options.launch_agent !== 'function'
    || typeof options.read_artifact !== 'function' || typeof options.inventory_paths !== 'function') throw new Error('INPUT_INVALID');

  const settle = async (result, action, settlement) => coordinator.settlement({
    change_id: result.change_id,
    expected_state_version: result.state_version,
    expected_state_hash: result.state_hash,
    settlement,
  });

  const launch = async (result, action) => {
    const route = assertExactAction(action, await options.durable_route(action));
    let child;
    try {
      child = await options.launch_agent({ action, route });
      if (!child || typeof child.observed_child_id !== 'string' || child.observed_child_id.length === 0) throw new Error('SPAWN_REJECTED');
    } catch (error) {
      return settle(result, action, {
        ...settlementBinding(action),
        stage: 'START_FAILED',
        failure_code: /ROUTE|REASONING/.test(String(error?.message)) ? 'ROUTE_UNAVAILABLE' : 'SPAWN_REJECTED',
      });
    }
    let current = await settle(result, action, {
      ...settlementBinding(action),
      stage: 'STARTED',
      observed_child_id: child.observed_child_id,
    });
    try {
      const completed = await child.completed;
      if (completed?.interrupted) {
        return coordinator.settlement({
          change_id: current.change_id,
          expected_state_version: current.state_version,
          expected_state_hash: current.state_hash,
          settlement: {
            ...settlementBinding(action),
            stage: 'INTERRUPTED',
            observed_child_id: child.observed_child_id,
            reason_code: completed.reason_code ?? 'AGENT_EXITED',
          },
        });
      }
      const artifact = await options.read_artifact(route.output_artifact_path);
      const inventory = await options.inventory_paths(route.worktree_root);
      if (!(artifact instanceof Uint8Array) || sha256(artifact) !== completed.artifact_sha256
        || !same(inventory, completed.allowed_path_inventory)) throw new Error('RESULT_UNREADABLE');
      current = await coordinator.settlement({
        change_id: current.change_id,
        expected_state_version: current.state_version,
        expected_state_hash: current.state_hash,
        settlement: {
          ...settlementBinding(action),
          stage: 'RESULT',
          observed_child_id: child.observed_child_id,
          status: completed.status,
          artifact_path: route.output_artifact_path,
          artifact_sha256: completed.artifact_sha256,
        },
      });
      return current;
    } catch {
      return coordinator.settlement({
        change_id: current.change_id,
        expected_state_version: current.state_version,
        expected_state_hash: current.state_hash,
        settlement: {
          ...settlementBinding(action),
          stage: 'INTERRUPTED',
          observed_child_id: child.observed_child_id,
          reason_code: 'RESULT_UNREADABLE',
        },
      });
    }
  };

  const drain = async initial => {
    let current = initial;
    for (let count = 0; count < MAX_ADVANCES; count += 1) {
      if (['BLOCKED', 'AWAITING_CONTROLLER', 'CLOSED', 'REJECTED', 'PROCESS_FAILURE'].includes(current?.outcome)) return current;
      if (current?.outcome === 'AGENT_ACTION') {
        current = await launch(current, current.payload?.action);
        continue;
      }
      if (current?.outcome === 'WAITING') return current;
      if (!current?.change_id || !Number.isSafeInteger(current.state_version) || typeof current.state_hash !== 'string') return current;
      current = await coordinator.run({
        change_id: current.change_id,
        expected_state_version: current.state_version,
        expected_state_hash: current.state_hash,
      });
    }
    throw new Error('MANUAL_CONTROLLER_STOP');
  };

  return Object.freeze({
    async submit(frame) {
      const envelope = parseCanonicalLine(frame);
      if (!closed(envelope, ['command_body_base64', 'signature_base64'])) throw new Error('INPUT_INVALID');
      const result = await coordinator.applyControllerCommand({
        command_body_bytes: base64(envelope.command_body_base64),
        signature_bytes: base64(envelope.signature_base64),
      });
      return drain(result);
    },
    async readStatus() {
      return coordinator.status({ change_id: null });
    },
  });
}

export async function serveTrustedHostLoop(hostLoop, socketPath = HOST_SOCKET_PATH, runtime_gid = null) {
  if (socketPath !== HOST_SOCKET_PATH) throw new Error('INPUT_INVALID');
  const server = net.createServer(socket => {
    const chunks = [];
    let size = 0;
    socket.on('data', chunk => {
      size += chunk.length;
      if (size > MAX_FRAME_BYTES) socket.destroy();
      else chunks.push(Buffer.from(chunk));
    });
    socket.once('end', async () => {
      try {
        const frame = Buffer.concat(chunks);
        const request = parseCanonicalLine(frame);
        const result = closed(request, ['operation']) && request.operation === 'status'
          ? await hostLoop.readStatus()
          : await hostLoop.submit(frame);
        socket.end(`${canonical(result)}\n`);
      } catch (error) {
        const manual = String(error?.message) === 'MANUAL_CONTROLLER_STOP';
        socket.end(`${canonical(manual
          ? { schema_version: '1.0', operation: 'run', outcome: 'BLOCKED', error_code: 'MANUAL_CONTROLLER_STOP', change_id: null }
          : { schema_version: '1.0', operation: 'applyControllerCommand', outcome: 'REJECTED', error_code: 'INPUT_INVALID', change_id: null })}\n`);
      }
    });
  });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(socketPath, resolve);
  });
  if (!Number.isSafeInteger(runtime_gid) || runtime_gid < 0) throw new Error('INPUT_INVALID');
  await chown(socketPath, 0, runtime_gid);
  await chmod(socketPath, 0o660);
  const socketStat = await lstat(socketPath);
  if (!socketStat.isSocket() || socketStat.uid !== 0 || socketStat.gid !== runtime_gid
    || (socketStat.mode & 0o777) !== 0o660) {
    server.close();
    throw new Error('SOCKET_AUTHORITY_INVALID');
  }
  return server;
}

async function main() {
  const config = await readProductionHostConfig();
  const coordinator = await createProductionComposition();
  const routeAuthority = createSameProcessRouteAuthority(config);
  const routedCoordinator = Object.freeze({
    async applyControllerCommand(request) {
      const candidate = routeAuthority.prepare(request.command_body_bytes);
      const result = await coordinator.applyControllerCommand(request);
      routeAuthority.commit(candidate, result);
      return result;
    },
    run: request => coordinator.run(request),
    settlement: request => coordinator.settlement(request),
    status: request => coordinator.status(request),
  });
  const loop = createTrustedHostLoop({
    coordinator: routedCoordinator,
    durable_route: action => routeAuthority.resolve(action),
    launch_agent: request => spawnExactCodex(request),
    read_artifact: readFile,
    inventory_paths: worktree_root => inventoryChangedPaths({
      worktree_root,
      git_executable: config.git_executable,
      runtime_uid: config.runtime_uid,
      runtime_gid: config.runtime_gid,
    }),
  });
  await serveTrustedHostLoop(loop, HOST_SOCKET_PATH, config.runtime_gid);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    await main();
  } catch (error) {
    const message = String(error?.message ?? 'HOST_FAILED').replace(/[^A-Z0-9_]/g, '_').slice(0, 160);
    process.stderr.write(`${canonical({ schema_version: '1.0', outcome: 'HOST_FAILED', error_code: message })}\n`);
    process.exitCode = 70;
  }
}
