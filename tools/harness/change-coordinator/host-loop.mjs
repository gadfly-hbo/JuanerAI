#!/usr/bin/env node
import { createHash, randomBytes } from 'node:crypto';
import { spawn } from 'node:child_process';
import net from 'node:net';
import { constants as fsConstants } from 'node:fs';
import { chmod, chown, link, lstat, mkdir, open, readFile, readdir, realpath, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createProductionComposition, readProductionHostConfig, readRepairWorkerSnapshot } from './production.mjs';

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
const OWNED_LAUNCH_BUDGETS = new WeakMap();

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

const monotonicMs = () => Number(process.hrtime.bigint() / 1000000n);
const remainingMs = budget => {
  const remaining = budget.deadline - monotonicMs();
  if (!Number.isSafeInteger(remaining) || remaining <= 0) throw new Error('RESULT_UNREADABLE');
  return remaining;
};
const consumeOutput = (budget, count) => {
  budget.output_bytes += count;
  return budget.output_bytes <= MAX_AGENT_OUTPUT_BYTES;
};

async function candidateTree(route, sha, budget) {
  const result = await closedChild(route.git_executable, ['rev-parse', `${sha}^{tree}`], {
    cwd: route.worktree_root,
    env: { PATH: '/usr/bin:/bin', LANG: 'C', LC_ALL: 'C', TZ: 'UTC', GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: '/dev/null', GIT_ATTR_NOSYSTEM: '1', GIT_NO_REPLACE_OBJECTS: '1' },
    uid: route.runtime_uid, gid: route.runtime_gid, budget,
  });
  if (result.child_error || result.code !== 0 || result.signal !== null || result.timed_out || result.overflow || !result.group_empty) throw new Error('RESULT_UNREADABLE');
  const tree = result.stdout.toString('utf8').trim();
  if (!/^[0-9a-f]{40}$/.test(tree)) throw new Error('INPUT_INVALID');
  return tree;
}

function assertExactAction(action, durableRoute) {
  const extras = action && Object.hasOwn(action, 'repair_evidence') ? ['repair_evidence']
    : action && Object.hasOwn(action, 'repair_proof') ? ['repair_proof'] : [];
  if (!action || !closed(action, [...HOST_AGENT_BINDING_FIELDS, ...extras, 'action_kind']) || action.action_kind !== 'LAUNCH_AGENT'
    || !HOST_AGENT_BINDING_FIELDS.every(field => Object.hasOwn(action, field))
    || !durableRoute || durableRoute.correlation_id !== action.correlation_id) throw new Error('MANUAL_CONTROLLER_STOP');
  for (const field of HOST_AGENT_BINDING_FIELDS) {
    if (!same(durableRoute[field], action[field])) throw new Error('MANUAL_CONTROLLER_STOP');
  }
  for (const field of ['repair_evidence', 'repair_proof']) {
    if (Object.hasOwn(action, field) !== Object.hasOwn(durableRoute, field)
      || (Object.hasOwn(action, field) && !same(action[field], durableRoute[field]))) throw new Error('MANUAL_CONTROLLER_STOP');
  }
  return durableRoute;
}

function settlementBinding(action) {
  const extra = Object.hasOwn(action, 'repair_evidence') ? ['repair_evidence']
    : Object.hasOwn(action, 'repair_proof') ? ['repair_proof'] : [];
  return Object.fromEntries([...HOST_AGENT_BINDING_FIELDS, ...extra]
    .map(field => [field, structuredClone(action[field])]));
}

function parseCommandBody(commandBodyBytes) {
  const bytes = Buffer.from(commandBodyBytes);
  const raw = bytes.toString('utf8');
  if (!Buffer.from(raw, 'utf8').equals(bytes)) throw new Error('INPUT_INVALID');
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
      if (!['DISPATCH', 'REVISION'].includes(body.command_kind)) return null;
      if (body.command_kind === 'REVISION') return { kind: 'REVISION', change_id: body.change_id, command_id: body.command_id };
      if (!body.worktree || !path.isAbsolute(body.worktree.root) || !Array.isArray(body.payload?.roles)) throw new Error('INPUT_INVALID');
      return { kind: 'DISPATCH', authority: {
        change_id: body.change_id, authorization_cycle_command_id: body.command_id,
        repository_root: body.repository.canonical_root,
        worktree_root: body.worktree.root,
        branch: body.worktree.branch,
        allowed_paths: structuredClone(body.scope.allowed_paths),
        forbidden_paths: structuredClone(body.scope.forbidden_paths),
        roles: structuredClone(body.payload.roles),
      } };
    },
    commit(candidate, result) {
      if (!candidate) return;
      if (!result || result.change_id !== candidate.change_id
        || !['APPLIED', 'ALREADY_APPLIED'].includes(result.outcome)) return;
      if (candidate.kind === 'DISPATCH') admitted = candidate.authority;
      else if (candidate.kind === 'REVISION' && admitted?.change_id === candidate.change_id) admitted = { ...admitted, authorization_cycle_command_id: candidate.command_id };
    },
    async resolve(action) {
      if (!admitted) throw new Error('MANUAL_CONTROLLER_STOP');
      const role = admitted.roles.find(candidate => candidate.role === action.role);
      const repair = Object.hasOwn(action, 'repair_evidence') || Object.hasOwn(action, 'repair_proof');
      const signedFields = ['role', 'agent', 'model', 'reasoning', 'sandbox', 'allowed_paths', 'brief_sha256', 'input_sha256', 'output_schema_sha256'];
      if (!role || !(repair ? signedFields : HOST_AGENT_BINDING_FIELDS.filter(field => Object.hasOwn(role, field)))
        .every(field => same(role[field], action[field]))) throw new Error('MANUAL_CONTROLLER_STOP');
      return {
        ...settlementBinding(action),
        codex_executable: config.codex_executable,
        runtime_uid: config.runtime_uid,
        runtime_gid: config.runtime_gid,
        runtime_home: config.runtime_home,
        codex_home: config.codex_home,
        git_executable: config.git_executable,
        node_executable: config.node_executable,
        worktree_root: admitted.worktree_root,
        repair_snapshot_context: {
          change_id: admitted.change_id, authorization_cycle_command_id: admitted.authorization_cycle_command_id,
          repository_root: admitted.repository_root, worktree_root: admitted.worktree_root, branch: admitted.branch,
          allowed_paths: structuredClone(admitted.allowed_paths), forbidden_paths: structuredClone(admitted.forbidden_paths),
          test_allowed_paths: structuredClone(admitted.roles.find(candidate => candidate.role === 'juaner_test')?.allowed_paths ?? []),
          production_allowed_paths: structuredClone(admitted.roles.find(candidate => candidate.role === 'juaner_worker')?.allowed_paths ?? []),
        },
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

async function readExactArtifact(target, expectedSha256, budget) {
  if (budget) remainingMs(budget);
  const physical = await realpath(target);
  if (physical !== target) throw new Error('MANUAL_CONTROLLER_STOP');
  const bytes = await readFile(target);
  if (budget) remainingMs(budget);
  if (bytes.length === 0 || bytes.length > MAX_FRAME_BYTES || sha256(bytes) !== expectedSha256) throw new Error('MANUAL_CONTROLLER_STOP');
  return bytes;
}

async function inventoryChangedPaths(route, budget) {
  const result = await closedChild(route.git_executable, ['status', '--porcelain=v1', '-z'], {
    cwd: route.worktree_root,
    env: { PATH: '/usr/bin:/bin', LANG: 'C', LC_ALL: 'C', TZ: 'UTC' },
    uid: route.runtime_uid,
    gid: route.runtime_gid,
    budget,
  });
  if (result.child_error || result.code !== 0 || result.signal !== null || result.timed_out || result.overflow || !result.group_empty) throw new Error('RESULT_UNREADABLE');
  const raw = result.stdout.toString('utf8');
  if (!Buffer.from(raw, 'utf8').equals(result.stdout)) throw new Error('RESULT_UNREADABLE');
  const entries = raw.split('\0'); if (entries.at(-1) !== '') throw new Error('RESULT_UNREADABLE');
  entries.pop();
  const paths = entries.map(entry => {
    if (entry.length < 4 || entry[2] !== ' ' || /[RC]/.test(entry.slice(0, 2)) || !repairFilePath(entry.slice(3))) throw new Error('RESULT_UNREADABLE');
    return entry.slice(3);
  }).sort(utf8Compare);
  if (new Set(paths).size !== paths.length) throw new Error('RESULT_UNREADABLE');
  return paths;
}

async function readRepairWorkerSubject(route, action, budget) {
  const context = route.repair_snapshot_context;
  if (!closed(context, ['change_id', 'authorization_cycle_command_id', 'repository_root', 'worktree_root', 'branch', 'allowed_paths', 'forbidden_paths', 'test_allowed_paths', 'production_allowed_paths'])
    || action.role !== 'juaner_worker' || action.phase !== 'WORKER_GREEN'
    || !/^[0-9a-f]{40}$/.test(action.subject_sha) || !path.isAbsolute(context.repository_root)
    || context.worktree_root !== route.worktree_root || !Array.isArray(context.allowed_paths)
    || !Array.isArray(context.forbidden_paths)) throw new Error('RESULT_UNREADABLE');
  const common = async cwd => {
    const result = await closedChild(route.git_executable, ['rev-parse', '--path-format=absolute', '--git-common-dir'], {
      cwd, env: { PATH: '/usr/bin:/bin', LANG: 'C', LC_ALL: 'C', TZ: 'UTC', GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: '/dev/null', GIT_ATTR_NOSYSTEM: '1', GIT_NO_REPLACE_OBJECTS: '1' },
      uid: route.runtime_uid, gid: route.runtime_gid, budget,
    });
    if (result.child_error || result.code !== 0 || result.signal !== null || result.timed_out || result.overflow || !result.group_empty) throw new Error('RESULT_UNREADABLE');
    return result.stdout;
  };
  const repositoryRoot = await realpath(context.repository_root); remainingMs(budget);
  const worktreeRoot = await realpath(context.worktree_root); remainingMs(budget);
  const repositoryCommonRaw = await common(context.repository_root);
  const worktreeCommonRaw = await common(context.worktree_root);
  const repositoryCommon = await realpath(repositoryCommonRaw.toString('utf8').trim());
  const worktreeCommon = await realpath(worktreeCommonRaw.toString('utf8').trim());
  if (repositoryRoot !== context.repository_root || worktreeRoot !== context.worktree_root
    || repositoryCommon !== worktreeCommon) throw new Error('RESULT_UNREADABLE');
  return {
    kind: 'WORKTREE', repository_root: repositoryRoot, worktree_root: worktreeRoot,
    branch: context.branch, head_sha: action.subject_sha, common_git_dir: worktreeCommon,
    allowed_paths: structuredClone(context.allowed_paths), forbidden_paths: structuredClone(context.forbidden_paths),
  };
}

const utf8Text = value => typeof value === 'string' && Buffer.from(value, 'utf8').toString('utf8') === value;
const safeText = value => utf8Text(value) && value.length > 0 && !/[\0\n\r]/.test(value);
const artifactText = value => utf8Text(value) && value.length > 0;
const safeCorrelation = value => safeText(value) && !/[\\/]/.test(value)
  && value !== '.' && value !== '..';
const validArtifactPath = value => utf8Text(value) && value.length > 0 && !value.startsWith('/')
  && !value.includes('..') && !value.includes('\\') && !value.includes('\0')
  && (value.indexOf('*') < 0 || (value.endsWith('/**') && value.indexOf('*') === value.length - 2));
const closedArray = value => Array.isArray(value) && Object.getPrototypeOf(value) === Array.prototype
  && Reflect.ownKeys(value).length === value.length + 1 && Object.getOwnPropertyDescriptor(value, 'length')?.value === value.length
  && Array.from({ length: value.length }, (_, index) => Object.getOwnPropertyDescriptor(value, String(index)))
    .every(descriptor => descriptor && Object.hasOwn(descriptor, 'value') && descriptor.enumerable === true);
const utf8Compare = (left, right) => Buffer.compare(Buffer.from(left, 'utf8'), Buffer.from(right, 'utf8'));
const sortedUniqueStrings = values => closedArray(values) && values.every((value, index) => artifactText(value)
  && (index === 0 || utf8Compare(values[index - 1], value) < 0));
const validEvidenceRef = value => closed(value, ['kind', 'id', 'sha256', 'subject_sha'])
  && artifactText(value.kind) && artifactText(value.id) && typeof value.sha256 === 'string' && typeof value.subject_sha === 'string'
  && /^[0-9a-f]{64}$/.test(value.sha256) && /^[0-9a-f]{40}$/.test(value.subject_sha);
const sortedEvidence = values => closedArray(values) && values.every((value, index) => validEvidenceRef(value)
  && (index === 0 || utf8Compare(canonical(values[index - 1]), canonical(value)) < 0));
const matchesPath = (rule, value) => rule.endsWith('/**') ? value.startsWith(rule.slice(0, -2)) : value === rule;
const validRepairFinding = (finding, index, findings, context) => closed(finding, ['finding_id', 'classification', 'requirement_ids', 'acceptance_ids', 'paths', 'summary', 'evidence_refs'])
  && artifactText(finding.finding_id) && finding.classification === 'IMPLEMENTATION_IN_SCOPE'
  && sortedUniqueStrings(finding.requirement_ids) && finding.requirement_ids.length > 0
  && sortedUniqueStrings(finding.acceptance_ids) && finding.acceptance_ids.length > 0
  && sortedUniqueStrings(finding.paths) && finding.paths.length > 0
  && finding.paths.every(item => validArtifactPath(item) && context.allowed_paths.some(rule => matchesPath(rule, item)) && !context.forbidden_paths.some(rule => matchesPath(rule, item)))
  && artifactText(finding.summary) && sortedEvidence(finding.evidence_refs) && finding.evidence_refs.length > 0
  && (index === 0 || utf8Compare(findings[index - 1].finding_id, finding.finding_id) < 0);
const validLedgerRef = value => closed(value, ['remote_ref', 'tip', 'tip_tree', 'authoritative_path', 'event_id', 'event_hash', 'sequence', 'record_offset', 'record_length', 'record_bytes_sha256'])
  && value.remote_ref === 'refs/heads/evidence/agent-runs' && /^[0-9a-f]{40}$/.test(value.tip) && /^[0-9a-f]{40}$/.test(value.tip_tree)
  && safeText(value.authoritative_path) && safeText(value.event_id) && /^[0-9a-f]{64}$/.test(value.event_hash)
  && Number.isSafeInteger(value.sequence) && value.sequence > 0 && Number.isSafeInteger(value.record_offset) && value.record_offset >= 0
  && Number.isSafeInteger(value.record_length) && value.record_length > 0 && /^[0-9a-f]{64}$/.test(value.record_bytes_sha256);

function validDerivedEvidence(derived, action, route) {
  const context = route.repair_snapshot_context;
  if (!closed(context, ['change_id', 'authorization_cycle_command_id', 'repository_root', 'worktree_root', 'branch', 'allowed_paths', 'forbidden_paths', 'test_allowed_paths', 'production_allowed_paths'])
    || !closedArray(context.allowed_paths) || !closedArray(context.forbidden_paths) || !closedArray(context.test_allowed_paths) || !closedArray(context.production_allowed_paths)
    || !closed(derived, ['schema_version', 'kind', 'change_id', 'candidate_sha', 'candidate_tree', 'authorization_cycle_command_id', 'source_execution_attempt', 'repair_execution_attempt', 'scope_sha256', 'validator_artifact_sha256', 'validator_receipt_sha256', 'validator_agent_result_event_ref', 'validator_receipt_event_ref', 'findings'])
    || derived.schema_version !== '1.0' || derived.kind !== 'REPAIR_TEST_DERIVED_EVIDENCE'
    || derived.change_id !== context.change_id || derived.candidate_sha !== action.subject_sha || !/^[0-9a-f]{40}$/.test(derived.candidate_tree)
    || derived.authorization_cycle_command_id !== context.authorization_cycle_command_id || derived.source_execution_attempt !== 0 || derived.repair_execution_attempt !== 1
    || derived.scope_sha256 !== sha256(canonical({ allowed_paths: context.allowed_paths, forbidden_paths: context.forbidden_paths }))
    || !/^[0-9a-f]{64}$/.test(derived.validator_artifact_sha256) || !/^[0-9a-f]{64}$/.test(derived.validator_receipt_sha256)
    || !validLedgerRef(derived.validator_agent_result_event_ref) || !validLedgerRef(derived.validator_receipt_event_ref)
    || !closedArray(derived.findings) || derived.findings.length === 0
    || !derived.findings.every((finding, index) => validRepairFinding(finding, index, derived.findings, context))) return false;
  const resultRef = derived.validator_agent_result_event_ref; const receiptRef = derived.validator_receipt_event_ref;
  return resultRef.remote_ref === receiptRef.remote_ref && resultRef.tip === receiptRef.tip && resultRef.tip_tree === receiptRef.tip_tree
    && resultRef.authoritative_path === receiptRef.authoritative_path && receiptRef.sequence === resultRef.sequence + 1
    && receiptRef.record_offset === resultRef.record_offset + resultRef.record_length;
}

const validRepairTestScope = (files, action, route) => closedArray(files) && files.length > 0 && files.every(file =>
  route.repair_snapshot_context.test_allowed_paths.some(rule => matchesPath(rule, file.path))
  && route.repair_snapshot_context.allowed_paths.some(rule => matchesPath(rule, file.path))
  && !route.repair_snapshot_context.forbidden_paths.some(rule => matchesPath(rule, file.path))
  && !route.repair_snapshot_context.production_allowed_paths.some(rule => matchesPath(rule, file.path)));

function validRepairPlan(plan, action, derived, route) {
  if (!closed(plan, ['schema_version', 'kind', 'status', 'change_id', 'candidate_sha', 'candidate_tree', 'authorization_cycle_command_id', 'repair_execution_attempt', 'derived_input_sha256', 'test_files', 'checks'])
    || plan.schema_version !== '1.0' || plan.kind !== 'REPAIR_TEST_PLAN_V1' || plan.status !== 'READY_FOR_MECHANICAL_PROOF'
    || plan.change_id !== derived.change_id || plan.candidate_sha !== action.subject_sha || plan.candidate_tree !== derived.candidate_tree
    || plan.authorization_cycle_command_id !== derived.authorization_cycle_command_id || plan.repair_execution_attempt !== 1
    || plan.derived_input_sha256 !== action.repair_evidence.derived_input_sha256
    || !closedArray(plan.test_files) || plan.test_files.length === 0 || !closedArray(plan.checks) || plan.checks.length !== derived.findings.length
    || !validRepairTestScope(plan.test_files, action, route)) return false;
  const files = plan.test_files.every((file, index) => closed(file, ['path', 'byte_length', 'sha256'])
    && repairFilePath(file.path)
    && Number.isSafeInteger(file.byte_length) && file.byte_length >= 0 && /^[0-9a-f]{64}$/.test(file.sha256)
    && (index === 0 || utf8Compare(plan.test_files[index - 1].path, file.path) < 0));
  const findingById = new Map(derived.findings.map(finding => [finding.finding_id, finding]));
  const ids = new Set();
  const checks = plan.checks.every((check, index) => {
    const finding = findingById.get(check?.finding_id);
    const file = plan.test_files.find(item => item.path === check?.test_path);
    const valid = closed(check, ['finding_id', 'requirement_ids', 'acceptance_ids', 'test_path', 'test_file_sha256', 'red_test_id', 'control_test_id'])
      && finding && closedArray(check.requirement_ids) && closedArray(check.acceptance_ids)
      && same(check.requirement_ids, finding.requirement_ids) && same(check.acceptance_ids, finding.acceptance_ids)
      && file && check.test_file_sha256 === file.sha256 && artifactText(check.red_test_id) && artifactText(check.control_test_id)
      && check.red_test_id !== check.control_test_id && !ids.has(check.red_test_id) && !ids.has(check.control_test_id)
      && (index === 0 || utf8Compare(plan.checks[index - 1].finding_id, check.finding_id) < 0);
    if (valid) { ids.add(check.red_test_id); ids.add(check.control_test_id); }
    return valid;
  });
  return files && checks && findingById.size === derived.findings.length && plan.checks.every(check => findingById.has(check.finding_id))
    && new Set(plan.checks.map(check => check.finding_id)).size === derived.findings.length;
}

const repairRoot = '/private/var/run/juanerai/repair-proof';
const repairResultRoot = '/private/var/run/juanerai/repair-proof-results';
const noControls = value => utf8Text(value) && !/[\0\n\r]/.test(value);
const repairFilePath = value => validArtifactPath(value) && !value.includes('*') && !/[\n\r]/.test(value)
  && value.split('/').every(part => part.length > 0 && part !== '.' && part !== '..');
function validSelectedTap(stdout, stderr, testId, expected) {
  const tap = stdout.toString('utf8'); const diagnostic = stderr.toString('utf8');
  if (!Buffer.from(tap, 'utf8').equals(stdout) || !Buffer.from(diagnostic, 'utf8').equals(stderr) || !tap.endsWith('\n')) return false;
  const lines = tap.slice(0, -1).split('\n');
  if (lines[0] !== 'TAP version 13') return false;
  const planIndexes = lines.flatMap((line, index) => /^1\.\.\d+$/.test(line) ? [index] : []);
  if (planIndexes.length !== 1) return false;
  const planIndex = planIndexes[0]; const total = Number(lines[planIndex].slice(3));
  if (!Number.isSafeInteger(total) || total <= 0 || lines.length !== planIndex + 9) return false;
  const labels = ['tests', 'suites', 'pass', 'fail', 'cancelled', 'skipped', 'todo']; const summary = {};
  for (const [offset, label] of labels.entries()) {
    const match = new RegExp(`^# ${label} (\\d+)$`).exec(lines[planIndex + offset + 1]);
    if (!match) return false; summary[label] = Number(match[1]);
  }
  if (!/^# duration_ms (?:\d+|\d+\.\d+)$/.test(lines[planIndex + 8]) || summary.tests !== total
    || summary.cancelled !== 0 || summary.todo !== 0 || summary.pass + summary.fail + summary.skipped !== total) return false;
  const results = [];
  for (const [lineIndex, line] of lines.slice(1, planIndex).entries()) {
    const match = /^(not )?ok (\d+) - (.*?)(?: # (SKIP|TODO)(?: .*)?)?$/.exec(line);
    if (match) results.push({ lineIndex: lineIndex + 1, failed: match[1] === 'not ', ordinal: Number(match[2]), name: match[3], directive: match[4] ?? null });
  }
  if (results.length !== total || results.some((item, index) => item.ordinal !== index + 1)
    || new Set(results.map(item => item.ordinal)).size !== total) return false;
  const selected = results.filter(item => item.name === testId && item.directive === null);
  const nonSkipped = results.filter(item => item.directive === null);
  if (selected.length !== 1 || nonSkipped.length !== 1 || results.some(item => item !== selected[0] && (item.directive !== 'SKIP' || item.failed))) return false;
  const selectedIndex = results.indexOf(selected[0]);
  const selectedEnd = selectedIndex + 1 < results.length ? results[selectedIndex + 1].lineIndex : planIndex;
  const selectedDiagnosticLines = lines.slice(selected[0].lineIndex + 1, selectedEnd);
  const diagnosticStarts = selectedDiagnosticLines.flatMap((line, index) => line === '  ---' ? [index] : []);
  const diagnosticEnds = selectedDiagnosticLines.flatMap((line, index) => line === '  ...' ? [index] : []);
  const nextResult = results[selectedIndex + 1] ?? null;
  const trailing = diagnosticEnds.length === 1 ? selectedDiagnosticLines.slice(diagnosticEnds[0] + 1) : [];
  const validNextFraming = trailing.length === 0 || (nextResult !== null && trailing.length === 1 && trailing[0] === `# Subtest: ${nextResult.name}`);
  const ownsDiagnostic = diagnosticStarts.length === 1 && diagnosticEnds.length === 1
    && diagnosticStarts[0] === 0 && diagnosticStarts[0] < diagnosticEnds[0] && validNextFraming;
  const selectedDiagnostics = ownsDiagnostic ? selectedDiagnosticLines.slice(1, diagnosticEnds[0]) : [];
  const infrastructure = /\b(?:SyntaxError|ERR_MODULE_NOT_FOUND|beforeEach|afterEach|hook|Cannot find module)\b/i.test(`${tap}\n${diagnostic}`);
  const assertion = selectedDiagnostics.some(line => /^  name: ['"]AssertionError['"]$/.test(line))
    && selectedDiagnostics.some(line => /^  code: ['"]ERR_ASSERTION['"]$/.test(line));
  return !infrastructure && (expected === 'red'
    ? selected[0].failed && ownsDiagnostic && assertion && summary.pass === 0 && summary.fail === 1 && summary.skipped === total - 1
    : !selected[0].failed && summary.pass === 1 && summary.fail === 0 && summary.skipped === total - 1);
}
const absent = async target => {
  try { await lstat(target); return false; } catch (error) { return error?.code === 'ENOENT'; }
};

async function closedChild(executable, argv, options) {
  const { budget = { deadline: monotonicMs() + AGENT_TIMEOUT_MS, output_bytes: 0 }, detached = true, count_output = true, private_output_limit = MAX_AGENT_OUTPUT_BYTES, ...spawnOptions } = options;
  remainingMs(budget);
  const child = spawn(executable, argv, { shell: false, stdio: ['ignore', 'pipe', 'pipe'], detached, ...spawnOptions });
  const stdout = []; const stderr = [];
  let overflow = false; let terminated = false; let private_output_bytes = 0; let child_error = null;
  const terminate = () => { if (terminated) return; terminated = true; try { child.kill('SIGTERM'); } catch {} };
  const closed = new Promise(resolve => child.once('close', (code, signal) => resolve({ code, signal })));
  child.once('error', error => { child_error ??= error; terminate(); });
  const collect = target => chunk => {
    const allowed = count_output ? consumeOutput(budget, chunk.length) : (private_output_bytes += chunk.length) <= private_output_limit;
    if (!allowed) { overflow = true; terminate(); } else target.push(Buffer.from(chunk));
  };
  child.stdout.on('data', collect(stdout));
  child.stderr.on('data', collect(stderr));
  child.stdout.on('error', error => { child_error ??= error; terminate(); });
  child.stderr.on('error', error => { child_error ??= error; terminate(); });
  let timed_out = false;
  const timeoutDelay = budget.deadline - monotonicMs();
  if (!Number.isFinite(timeoutDelay) || timeoutDelay <= 0) { timed_out = true; terminate(); }
  const timer = setTimeout(() => { timed_out = true; terminate(); }, Math.max(0, timeoutDelay));
  const close = await closed;
  clearTimeout(timer);
  let group_empty = false; try { process.kill(-child.pid, 0); } catch (error) { group_empty = error?.code === 'ESRCH'; }
  return { ...close, timed_out, overflow, group_empty, child_error, stdout: Buffer.concat(stdout), stderr: Buffer.concat(stderr), pid: child.pid };
}

async function regularRootOwned(target, runtimeGid, mode, directory = false, requireRuntimeGroup = true) {
  const entry = await lstat(target);
  if ((directory ? !entry.isDirectory() : !entry.isFile()) || entry.isSymbolicLink()
    || await realpath(target) !== target || entry.uid !== 0 || (requireRuntimeGroup && entry.gid !== runtimeGid)
    || (entry.mode & 0o777) !== mode || (entry.mode & 0o022) !== 0) throw new Error('RESULT_UNREADABLE');
  return entry;
}

async function rootOwnedAncestors(target) {
  let current = path.dirname(target);
  while (true) {
    const entry = await lstat(current);
    if (!entry.isDirectory() || entry.isSymbolicLink() || await realpath(current) !== current || entry.uid !== 0 || (entry.mode & 0o022) !== 0) throw new Error('MANUAL_CONTROLLER_STOP');
    if (current === '/') break;
    current = path.dirname(current);
  }
}

const sameFileMetadata = (left, right) => ['dev', 'ino', 'mode', 'nlink', 'uid', 'gid', 'rdev', 'size', 'mtimeMs', 'ctimeMs']
  .every(field => left[field] === right[field]);

async function stableNoFollowBytes(target, errorCode = 'MANUAL_CONTROLLER_STOP') {
  const before = await lstat(target);
  if (!before.isFile() || before.isSymbolicLink() || before.nlink !== 1 || await realpath(target) !== target) throw new Error(errorCode);
  const descriptor = await open(target, fsConstants.O_RDONLY | fsConstants.O_NOFOLLOW);
  let opened; let afterOpened; let bytes;
  try { opened = await descriptor.stat(); bytes = await descriptor.readFile(); afterOpened = await descriptor.stat(); } finally { await descriptor.close(); }
  const after = await lstat(target);
  for (const observed of [opened, afterOpened, after]) {
    if (!observed.isFile() || !sameFileMetadata(before, observed) || observed.nlink !== 1) throw new Error(errorCode);
  }
  if (after.isSymbolicLink() || await realpath(target) !== target) throw new Error(errorCode);
  return { bytes, stat: after };
}

async function readExpectedOutput(target, root, errorCode = 'RESULT_UNREADABLE') {
  if (path.resolve(target) !== target || path.dirname(target) !== root || await realpath(root) !== root
    || path.dirname(await realpath(target)) !== root) throw new Error(errorCode);
  const bytes = (await stableNoFollowBytes(target, errorCode)).bytes;
  if (await realpath(root) !== root || path.dirname(await realpath(target)) !== root) throw new Error(errorCode);
  return bytes;
}

async function trustedRootExecutable(target, runtimeGid) {
  if (typeof target !== 'string' || !path.isAbsolute(target) || !noControls(target)) throw new Error('MANUAL_CONTROLLER_STOP');
  await rootOwnedAncestors(target);
  const captured = await stableNoFollowBytes(target);
  const entry = captured.stat;
  if (entry.uid !== 0
    || (entry.mode & 0o022) !== 0 || (entry.mode & 0o111) === 0) throw new Error('MANUAL_CONTROLLER_STOP');
  return sha256(captured.bytes);
}

async function runtimeReadRoots(executables, runtimeGid, budget = null) {
  const roots = new Map();
  for (const executable of executables) {
    const physical = await realpath(executable);
    if (physical !== executable) throw new Error('MANUAL_CONTROLLER_STOP');
    if (path.dirname(physical) === '/usr/bin') continue;
    const root = path.dirname(path.dirname(physical));
    if (physical !== path.join(root, 'bin', path.basename(physical))) throw new Error('MANUAL_CONTROLLER_STOP');
    roots.set(root, null);
  }
  const snapshots = [];
  for (const root of [...roots.keys()].sort(utf8Compare)) {
    await rootOwnedAncestors(root);
    const entries = [];
    const visit = async target => {
      if (budget) remainingMs(budget);
      const entry = await lstat(target);
      if (entry.isSymbolicLink() || await realpath(target) !== target || entry.uid !== 0 || (entry.mode & 0o022) !== 0) throw new Error('MANUAL_CONTROLLER_STOP');
      const relative = path.relative(root, target);
      if (entry.isDirectory()) {
        entries.push({ path: relative, mode: entry.mode & 0o777, kind: 'DIR' });
        for (const name of (await readdir(target)).sort(utf8Compare)) await visit(path.join(target, name));
      } else if (entry.isFile()) {
        const captured = await stableNoFollowBytes(target);
        entries.push({ path: relative, mode: entry.mode & 0o777, kind: 'FILE', byte_length: captured.bytes.length, sha256: sha256(captured.bytes) });
      } else throw new Error('MANUAL_CONTROLLER_STOP');
    };
    await visit(root);
    snapshots.push({ path: root, snapshot_sha256: sha256(canonical(entries)) });
  }
  return snapshots;
}

async function repairCapability(route, budget, cwd = route.worktree_root) {
  await regularRootOwned('/private', route.runtime_gid, 0o755, true, false);
  await regularRootOwned('/private/var', route.runtime_gid, 0o755, true, false);
  await regularRootOwned('/private/var/run', route.runtime_gid, 0o755, true, false);
  await regularRootOwned('/private/var/run/juanerai', route.runtime_gid, 0o755, true, false);
  const node_executable_sha256 = await trustedRootExecutable(route.node_executable, route.runtime_gid);
  const git_executable_sha256 = await trustedRootExecutable(route.git_executable, route.runtime_gid);
  const sandbox_executable_sha256 = await trustedRootExecutable('/usr/bin/sandbox-exec', route.runtime_gid);
  const runtime_read_roots = await runtimeReadRoots([route.node_executable, route.git_executable], route.runtime_gid, budget);
  const version = await closedChild(route.node_executable, ['--version'], {
    cwd, env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' }, uid: route.runtime_uid, gid: route.runtime_gid, budget,
  });
  if (version.child_error || version.code !== 0 || version.signal !== null || version.timed_out || version.overflow || !version.group_empty
    || !/^v\d+\.\d+\.\d+\n$/.test(version.stdout.toString('utf8')) || version.stderr.length !== 0) throw new Error('RESULT_UNREADABLE');
  return { node_executable_sha256, git_executable_sha256, sandbox_executable_sha256,
    runtime_read_roots, node_version: version.stdout.toString('utf8').trim() };
}

async function captureRepairFiles(route, plan, budget = null) {
  const captured = [];
  const root = await realpath(route.worktree_root);
  if (root !== route.worktree_root || new Set(plan.test_files.map(file => file.path)).size !== plan.test_files.length) throw new Error('RESULT_UNREADABLE');
  const rootBefore = await lstat(root);
  if (!rootBefore.isDirectory() || rootBefore.isSymbolicLink()) throw new Error('RESULT_UNREADABLE');
  for (const file of plan.test_files) {
    if (budget) remainingMs(budget);
    const target = path.resolve(root, file.path);
    if (!target.startsWith(`${root}/`) || await realpath(target) !== target) throw new Error('RESULT_UNREADABLE');
    let parent = path.dirname(target); const parentMetadata = [];
    while (parent !== root) {
      const parentEntry = await lstat(parent);
      if (!parentEntry.isDirectory() || parentEntry.isSymbolicLink() || await realpath(parent) !== parent) throw new Error('RESULT_UNREADABLE');
      parentMetadata.push([parent, parentEntry]);
      parent = path.dirname(parent);
    }
    const before = await lstat(target);
    if (!before.isFile() || before.isSymbolicLink() || before.nlink !== 1) throw new Error('RESULT_UNREADABLE');
    const descriptor = await open(target, fsConstants.O_RDONLY | fsConstants.O_NOFOLLOW);
    let bytes; let opened; let postOpened; try { opened = await descriptor.stat(); bytes = await descriptor.readFile(); postOpened = await descriptor.stat(); } finally { await descriptor.close(); }
    const after = await lstat(target);
    if ([opened, postOpened, after].some(observed => !sameFileMetadata(before, observed) || observed.nlink !== 1 || !observed.isFile())
      || after.isSymbolicLink() || bytes.length !== file.byte_length || sha256(bytes) !== file.sha256) throw new Error('RESULT_UNREADABLE');
    for (const [parentPath, parentBefore] of parentMetadata) {
      const parentAfter = await lstat(parentPath);
      if (!parentAfter.isDirectory() || parentAfter.isSymbolicLink() || !sameFileMetadata(parentBefore, parentAfter) || await realpath(parentPath) !== parentPath) throw new Error('RESULT_UNREADABLE');
    }
    if (await realpath(root) !== root || await realpath(target) !== target) throw new Error('RESULT_UNREADABLE');
    captured.push({ ...file, bytes });
  }
  const rootAfter = await lstat(root);
  if (!rootAfter.isDirectory() || rootAfter.isSymbolicLink() || !sameFileMetadata(rootBefore, rootAfter) || await realpath(root) !== root) throw new Error('RESULT_UNREADABLE');
  return captured;
}

async function sealedDirectoryChain(root, directory, runtimeGid) {
  const relative = path.relative(root, directory);
  if (relative.startsWith('..') || path.isAbsolute(relative)) throw new Error('RESULT_UNREADABLE');
  let current = root;
  for (const segment of relative === '' ? [] : relative.split(path.sep)) {
    current = path.join(current, segment);
    try {
      await mkdir(current, { mode: 0o750 }); await chown(current, 0, runtimeGid); await chmod(current, 0o750);
    } catch (error) {
      if (error?.code !== 'EEXIST') throw error;
      await regularRootOwned(current, runtimeGid, 0o750, true);
    }
  }
}

async function sealDirectories(root, runtimeGid) {
  const visit = async target => {
    for (const name of await readdir(target)) {
      const child = path.join(target, name); const entry = await lstat(child);
      if (entry.isDirectory()) await visit(child);
    }
    await chmod(target, 0o550);
    await regularRootOwned(target, runtimeGid, 0o550, true);
  };
  await visit(root);
}

async function sealedTreeReadback(root, runtimeGid) {
  const visit = async target => {
    const entry = await lstat(target);
    if (entry.isSymbolicLink() || await realpath(target) !== target || entry.uid !== 0 || entry.gid !== runtimeGid || (entry.mode & 0o022) !== 0) throw new Error('RESULT_UNREADABLE');
    if (entry.isDirectory()) {
      if ((entry.mode & 0o777) !== 0o550) throw new Error('RESULT_UNREADABLE');
      for (const name of await readdir(target)) await visit(path.join(target, name));
    } else if (entry.isFile()) {
      if (!([0o440, 0o550].includes(entry.mode & 0o777)) || entry.nlink !== 1) throw new Error('RESULT_UNREADABLE');
    } else throw new Error('RESULT_UNREADABLE');
  };
  await visit(root);
}

async function materializeCandidate(route, candidateSha, sealedRoot, budget) {
  const listed = await closedChild(route.git_executable, ['ls-tree', '-r', '-z', '--full-tree', candidateSha], {
    cwd: route.worktree_root, env: { PATH: '/usr/bin:/bin', LANG: 'C', LC_ALL: 'C', TZ: 'UTC', GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: '/dev/null', GIT_ATTR_NOSYSTEM: '1', GIT_NO_REPLACE_OBJECTS: '1' }, uid: 0, gid: route.runtime_gid, budget, count_output: false, private_output_limit: 1024 * 1024 * 1024,
  });
  if (listed.child_error || listed.code !== 0 || listed.signal !== null || listed.timed_out || listed.overflow || !listed.group_empty) throw new Error('RESULT_UNREADABLE');
  const decoded = listed.stdout.toString('utf8');
  if (!Buffer.from(decoded, 'utf8').equals(listed.stdout)) throw new Error('RESULT_UNREADABLE');
  const names = decoded.split('\0').filter(Boolean);
  if (names.length > 65536) throw new Error('RESULT_UNREADABLE');
  let total = 0; const seen = new Set();
  for (const entry of names) {
    const match = /^(100644|100755) blob ([0-9a-f]{40})\t(.+)$/.exec(entry);
    if (!match || !repairFilePath(match[3]) || seen.has(match[3])) throw new Error('RESULT_UNREADABLE');
    seen.add(match[3]);
    const target = path.join(sealedRoot, match[3]);
    if (!target.startsWith(`${sealedRoot}/`)) throw new Error('RESULT_UNREADABLE');
    await sealedDirectoryChain(sealedRoot, path.dirname(target), route.runtime_gid);
    const blob = await closedChild(route.git_executable, ['cat-file', 'blob', match[2]], {
      cwd: route.worktree_root, env: { PATH: '/usr/bin:/bin', LANG: 'C', LC_ALL: 'C', TZ: 'UTC', GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: '/dev/null', GIT_ATTR_NOSYSTEM: '1', GIT_NO_REPLACE_OBJECTS: '1' }, uid: 0, gid: route.runtime_gid, budget, count_output: false, private_output_limit: 1024 * 1024 * 1024,
    });
    if (blob.child_error || blob.code !== 0 || blob.signal !== null || blob.timed_out || blob.overflow || !blob.group_empty || createHash('sha1').update(Buffer.concat([Buffer.from(`blob ${blob.stdout.length}\0`), blob.stdout])).digest('hex') !== match[2]) throw new Error('RESULT_UNREADABLE');
    total += blob.stdout.length; if (total > 1024 * 1024 * 1024) throw new Error('RESULT_UNREADABLE');
    await writeFile(target, blob.stdout, { mode: match[1] === '100755' ? 0o550 : 0o440, flag: 'wx' });
    await chown(target, 0, route.runtime_gid); await chmod(target, match[1] === '100755' ? 0o550 : 0o440);
  }
}

async function ensureTrustedDirectory(target, runtimeGid, mode) {
  try {
    await mkdir(target, { mode }); await chown(target, 0, runtimeGid); await chmod(target, mode);
  } catch (error) {
    if (error?.code !== 'EEXIST') throw error;
  }
  await regularRootOwned(target, runtimeGid, mode, true);
}

async function repairProofFromPlan(route, action, plan, planBytes, beforeInventory, afterInventory, budget) {
  let sealedRoot = null; let published = null; let temporary = null;
  const cleanup = new Set();
  try {
    if (process.getuid?.() !== 0 || !path.isAbsolute(route.node_executable) || !path.isAbsolute(route.git_executable)) throw new Error('RESULT_UNREADABLE');
    remainingMs(budget);
    const candidateTreeSha = await candidateTree(route, action.subject_sha, budget);
    if (candidateTreeSha !== plan.candidate_tree) throw new Error('RESULT_UNREADABLE');
    const files = await captureRepairFiles(route, plan, budget);
    remainingMs(budget);
    const delta = afterInventory.filter(item => !beforeInventory.includes(item));
    if (!same(files.map(file => file.path).sort(utf8Compare), delta)) throw new Error('RESULT_UNREADABLE');
    await regularRootOwned('/private', route.runtime_gid, 0o755, true, false);
    await regularRootOwned('/private/var', route.runtime_gid, 0o755, true, false);
    await regularRootOwned('/private/var/run', route.runtime_gid, 0o755, true, false);
    await regularRootOwned('/private/var/run/juanerai', route.runtime_gid, 0o755, true, false);
    await ensureTrustedDirectory(repairRoot, route.runtime_gid, 0o750);
    const token = randomBytes(24).toString('hex'); sealedRoot = path.join(repairRoot, token);
    await mkdir(sealedRoot, { mode: 0o750 }); await chown(sealedRoot, 0, route.runtime_gid); await chmod(sealedRoot, 0o750);
    cleanup.add(sealedRoot);
    await materializeCandidate(route, action.subject_sha, sealedRoot, budget);
    for (const file of files) {
      const target = path.join(sealedRoot, file.path);
      await sealedDirectoryChain(sealedRoot, path.dirname(target), route.runtime_gid);
      await rm(target, { force: true }); await writeFile(target, file.bytes, { mode: 0o440, flag: 'wx' }); await chown(target, 0, route.runtime_gid); await chmod(target, 0o440);
    }
    await sealDirectories(sealedRoot, route.runtime_gid);
    await sealedTreeReadback(sealedRoot, route.runtime_gid);
    const capability = await repairCapability(route, budget, sealedRoot);
    const execution_content_sha256 = sha256(canonical({ schema_version: '1.0', candidate_sha: action.subject_sha, candidate_tree: candidateTreeSha,
      test_files: files.map(file => ({ path: file.path, byte_length: file.byte_length, sha256: file.sha256 })) }));
    const proofEnvironment = {
      runtime_uid: route.runtime_uid, runtime_gid: route.runtime_gid, cwd: sealedRoot,
      node_executable: route.node_executable, node_executable_sha256: capability.node_executable_sha256, node_version: capability.node_version,
      git_executable: route.git_executable, git_executable_sha256: capability.git_executable_sha256, runtime_read_roots: capability.runtime_read_roots,
      sandbox_executable: '/usr/bin/sandbox-exec', sandbox_executable_sha256: capability.sandbox_executable_sha256, environment: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' },
    };
    const run = async (testId, testPath, expected) => {
      const scratch = path.join(repairRoot, `${token}-${randomBytes(12).toString('hex')}`);
      const profile = path.join(repairRoot, `${token}-${randomBytes(12).toString('hex')}.sb`);
      cleanup.add(scratch); cleanup.add(profile);
      try {
        await mkdir(scratch, { mode: 0o700 }); await chown(scratch, route.runtime_uid, route.runtime_gid); await chmod(scratch, 0o700);
        const scratchEntry = await lstat(scratch);
        if (!scratchEntry.isDirectory() || scratchEntry.isSymbolicLink() || scratchEntry.uid !== route.runtime_uid || scratchEntry.gid !== route.runtime_gid || (scratchEntry.mode & 0o777) !== 0o700) throw new Error('RESULT_UNREADABLE');
        const quote = value => JSON.stringify(value);
        const runtimeClauses = proofEnvironment.runtime_read_roots.map(item => `\n  (subpath ${quote(item.path)})`).join('');
        const profileBytes = Buffer.from(`(version 1)\n(deny default)\n(allow process-fork)\n(allow signal (target self))\n(allow sysctl-read)\n(allow mach-lookup)\n(allow file-read-metadata)\n(allow file-read-data\n  (subpath ${quote(sealedRoot)})\n  (subpath ${quote(scratch)})\n  (subpath \"/System/Library\")\n  (subpath \"/usr/lib\")${runtimeClauses})\n(allow file-write* (subpath ${quote(scratch)}))\n(allow process-exec (literal ${quote(route.node_executable)}) (literal ${quote(route.git_executable)}))\n(deny network*)\n`);
        await writeFile(profile, profileBytes, { mode: 0o440, flag: 'wx' }); await chown(profile, 0, route.runtime_gid); await chmod(profile, 0o440);
        const env = { LANG: 'C', LC_ALL: 'C', TZ: 'UTC', TMPDIR: scratch };
        const argv = ['/usr/bin/sandbox-exec', '-f', profile, route.node_executable, '--test', '--test-isolation=none', '--test-reporter=tap', `--test-name-pattern=^${testId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, path.join(sealedRoot, testPath)];
        const execution = await closedChild(argv[0], argv.slice(1), { cwd: sealedRoot, env, uid: route.runtime_uid, gid: route.runtime_gid, budget });
        if (execution.child_error || !execution.group_empty || execution.overflow || execution.timed_out || execution.signal !== null || (expected === 'red' ? execution.code !== 1 : execution.code !== 0)) throw new Error('RESULT_UNREADABLE');
        const stdout = execution.stdout; const stderr = execution.stderr;
        if (!validSelectedTap(stdout, stderr, testId, expected)) throw new Error('RESULT_UNREADABLE');
        return { execution_kind: expected === 'red' ? 'RED' : 'CONTROL', test_id: testId, argv, environment: env, scratch_id: path.basename(scratch), observed_child_id: String(execution.pid), execution_content_sha256,
          sandbox_profile_byte_length: profileBytes.length, sandbox_profile_sha256: sha256(profileBytes), sandbox_profile_bytes_base64: profileBytes.toString('base64'),
          stdout_byte_length: stdout.length, stdout_sha256: sha256(stdout), stdout_bytes_base64: stdout.toString('base64'), stderr_byte_length: stderr.length, stderr_sha256: sha256(stderr), stderr_bytes_base64: stderr.toString('base64'), exit_code: execution.code, signal: execution.signal, timed_out: execution.timed_out };
      } finally {
        await rm(scratch, { recursive: true, force: true }); await rm(profile, { force: true });
        cleanup.delete(scratch); cleanup.delete(profile);
        if (!await absent(scratch) || !await absent(profile)) throw new Error('RESULT_UNREADABLE');
      }
    };
    const causal_red = [];
    for (const check of plan.checks) causal_red.push({ finding_id: check.finding_id, requirement_ids: check.requirement_ids, acceptance_ids: check.acceptance_ids, test_path: check.test_path, test_file_sha256: check.test_file_sha256, red: await run(check.red_test_id, check.test_path, 'red'), control: await run(check.control_test_id, check.test_path, 'control') });
    remainingMs(budget);
    const result = { schema_version: '1.0', kind: 'REPAIR_TEST_RESULT_V1', status: 'PASS', change_id: plan.change_id, candidate_sha: plan.candidate_sha, candidate_tree: plan.candidate_tree, authorization_cycle_command_id: plan.authorization_cycle_command_id, repair_execution_attempt: 1, derived_input_sha256: plan.derived_input_sha256, execution_content_sha256, agent_plan_byte_length: planBytes.length, agent_plan_sha256: sha256(planBytes), agent_plan_bytes_base64: planBytes.toString('base64'), test_files: files.map(file => ({ path: file.path, byte_length: file.byte_length, sha256: file.sha256, bytes_base64: file.bytes.toString('base64') })), proof_environment: proofEnvironment, causal_red };
    result.proof_receipt_sha256 = sha256(canonical(result));
    const bytes = Buffer.from(canonical(result));
    if (bytes.length === 0 || bytes.length > MAX_FRAME_BYTES) throw new Error('RESULT_UNREADABLE');
    const artifact_path = path.join(repairResultRoot, `${action.correlation_id}.json`);
    const repair_proof = { schema_version: '1.0', kind: 'REPAIR_TEST_HOST_PROOF_REF', artifact_path, artifact_sha256: sha256(bytes), execution_content_sha256, proof_receipt_sha256: result.proof_receipt_sha256, test_files: files.map(file => ({ path: file.path, byte_length: file.byte_length, sha256: file.sha256 })) };
    const proofAction = { ...action, repair_proof };
    await readBoundRepairProof(route, proofAction, budget, { binding: repair_proof, captured_artifact: { bytes, stat: null }, capability });
    await rm(sealedRoot, { recursive: true, force: true });
    if (!await absent(sealedRoot)) throw new Error('RESULT_UNREADABLE');
    cleanup.delete(sealedRoot);
    sealedRoot = null;
    if (cleanup.size !== 0) throw new Error('RESULT_UNREADABLE');
    await rm(route.output_artifact_path, { force: true });
    if (!await absent(route.output_artifact_path)) throw new Error('RESULT_UNREADABLE');
    remainingMs(budget);
    await ensureTrustedDirectory(repairResultRoot, route.runtime_gid, 0o750);
    temporary = path.join(repairResultRoot, `.${action.correlation_id}.${token}.tmp`);
    if (!await absent(artifact_path)) throw new Error('RESULT_UNREADABLE');
    try {
      await writeFile(temporary, bytes, { mode: 0o440, flag: 'wx' }); await chown(temporary, 0, route.runtime_gid); await chmod(temporary, 0o440);
      if (!(await stableNoFollowBytes(temporary, 'RESULT_UNREADABLE')).bytes.equals(bytes)) throw new Error('RESULT_UNREADABLE');
      await link(temporary, artifact_path); published = artifact_path; await rm(temporary, { force: true });
      if (!await absent(temporary)) throw new Error('RESULT_UNREADABLE');
      const reread = await stableNoFollowBytes(artifact_path, 'RESULT_UNREADABLE'); await regularRootOwned(artifact_path, route.runtime_gid, 0o440);
      if (!reread.bytes.equals(bytes)) throw new Error('RESULT_UNREADABLE');
      remainingMs(budget);
    } catch (error) { await rm(temporary, { force: true }); if (!await absent(temporary)) throw new Error('RESULT_UNREADABLE'); if (published !== null) { await rm(published, { force: true }); if (!await absent(published)) throw new Error('RESULT_UNREADABLE'); } throw error; }
    await readBoundRepairProof(route, proofAction, budget);
    return { artifact_path, artifact_sha256: sha256(bytes), repair_proof: { schema_version: '1.0', kind: 'REPAIR_TEST_HOST_PROOF', execution_content_sha256, proof_receipt_sha256: result.proof_receipt_sha256, test_files: files.map(file => ({ path: file.path, byte_length: file.byte_length, sha256: file.sha256 })) } };
  } catch (error) {
    if (published !== null) { await rm(published, { force: true }); if (!await absent(published)) throw new Error('RESULT_UNREADABLE'); published = null; }
    throw error;
  } finally {
    let cleanupFailed = false;
    try {
      if (sealedRoot !== null) { await rm(sealedRoot, { recursive: true, force: true }); if (!await absent(sealedRoot)) cleanupFailed = true; }
      for (const target of cleanup) { await rm(target, { recursive: true, force: true }); if (!await absent(target)) cleanupFailed = true; }
      if (temporary !== null) { await rm(temporary, { force: true }); if (!await absent(temporary)) cleanupFailed = true; }
      if (await absent(route.output_artifact_path) === false) await rm(route.output_artifact_path, { force: true });
      if (!await absent(route.output_artifact_path)) cleanupFailed = true;
    } catch { cleanupFailed = true; }
    if (cleanupFailed && published !== null) { try { await rm(published, { force: true }); } catch {} if (!await absent(published)) throw new Error('RESULT_UNREADABLE'); }
    if (cleanupFailed) throw new Error('RESULT_UNREADABLE');
  }
}

async function readBoundRepairProof(route, action, budget, supplied = null) {
  const binding = supplied?.binding ?? action.repair_proof;
  if (!closed(binding, ['schema_version', 'kind', 'artifact_path', 'artifact_sha256', 'execution_content_sha256', 'proof_receipt_sha256', 'test_files'])
    || binding.schema_version !== '1.0' || binding.kind !== 'REPAIR_TEST_HOST_PROOF_REF'
    || !/^\/private\/var\/run\/juanerai\/repair-proof-results\/repair-test-correlation-[0-9a-f]{64}\.json$/.test(binding.artifact_path)
    || !/^[0-9a-f]{64}$/.test(binding.artifact_sha256) || !/^[0-9a-f]{64}$/.test(binding.execution_content_sha256)
    || !/^[0-9a-f]{64}$/.test(binding.proof_receipt_sha256) || !closedArray(binding.test_files)
    || !binding.test_files.every((file, index) => closed(file, ['path', 'byte_length', 'sha256']) && repairFilePath(file.path)
      && Number.isSafeInteger(file.byte_length) && file.byte_length >= 0 && /^[0-9a-f]{64}$/.test(file.sha256)
      && (index === 0 || utf8Compare(binding.test_files[index - 1].path, file.path) < 0))
    || !validRepairTestScope(binding.test_files, action, route)) throw new Error('RESULT_UNREADABLE');
  remainingMs(budget);
  if (supplied === null) {
    await regularRootOwned('/private', route.runtime_gid, 0o755, true, false);
    await regularRootOwned('/private/var', route.runtime_gid, 0o755, true, false);
    await regularRootOwned('/private/var/run', route.runtime_gid, 0o755, true, false);
    await regularRootOwned('/private/var/run/juanerai', route.runtime_gid, 0o755, true, false);
    await regularRootOwned(repairResultRoot, route.runtime_gid, 0o750, true);
  }
  const capturedArtifact = supplied?.captured_artifact ?? await stableNoFollowBytes(binding.artifact_path, 'RESULT_UNREADABLE');
  const bytes = capturedArtifact.bytes;
  if (supplied === null && (capturedArtifact.stat.uid !== 0 || capturedArtifact.stat.gid !== route.runtime_gid
    || (capturedArtifact.stat.mode & 0o777) !== 0o440 || capturedArtifact.stat.nlink !== 1)) throw new Error('RESULT_UNREADABLE');
  if (bytes.length === 0 || bytes.length > MAX_FRAME_BYTES) throw new Error('RESULT_UNREADABLE');
  const result = parseCommandBody(bytes);
  const { proof_receipt_sha256, ...proofPreimage } = result;
  if (sha256(bytes) !== binding.artifact_sha256
    || !closed(result, ['schema_version', 'kind', 'status', 'change_id', 'candidate_sha', 'candidate_tree', 'authorization_cycle_command_id', 'repair_execution_attempt', 'derived_input_sha256', 'execution_content_sha256', 'agent_plan_byte_length', 'agent_plan_sha256', 'agent_plan_bytes_base64', 'test_files', 'proof_environment', 'causal_red', 'proof_receipt_sha256'])
    || result.schema_version !== '1.0' || result.kind !== 'REPAIR_TEST_RESULT_V1' || result.status !== 'PASS'
    || result.change_id !== route.repair_snapshot_context.change_id || result.authorization_cycle_command_id !== route.repair_snapshot_context.authorization_cycle_command_id
    || result.repair_execution_attempt !== 1 || !/^[0-9a-f]{64}$/.test(result.derived_input_sha256)
    || result.candidate_sha !== action.subject_sha || result.execution_content_sha256 !== binding.execution_content_sha256
    || result.proof_receipt_sha256 !== binding.proof_receipt_sha256 || proof_receipt_sha256 !== sha256(canonical(proofPreimage))
    || !same(result.test_files.map(file => ({ path: file.path, byte_length: file.byte_length, sha256: file.sha256 })), binding.test_files)) throw new Error('RESULT_UNREADABLE');
  const planBytes = base64(result.agent_plan_bytes_base64);
  if (planBytes.length !== result.agent_plan_byte_length || sha256(planBytes) !== result.agent_plan_sha256) throw new Error('RESULT_UNREADABLE');
  const plan = parseCommandBody(planBytes);
  if (!closed(plan, ['schema_version', 'kind', 'status', 'change_id', 'candidate_sha', 'candidate_tree', 'authorization_cycle_command_id', 'repair_execution_attempt', 'derived_input_sha256', 'test_files', 'checks'])
    || plan.schema_version !== '1.0' || plan.kind !== 'REPAIR_TEST_PLAN_V1' || plan.status !== 'READY_FOR_MECHANICAL_PROOF'
    || plan.change_id !== result.change_id || plan.candidate_sha !== result.candidate_sha
    || plan.candidate_tree !== result.candidate_tree || plan.authorization_cycle_command_id !== result.authorization_cycle_command_id
    || plan.repair_execution_attempt !== 1 || plan.derived_input_sha256 !== result.derived_input_sha256
    || !closedArray(plan.test_files) || plan.test_files.length === 0 || !same(plan.test_files, binding.test_files) || !validRepairTestScope(plan.test_files, action, route)
    || !closedArray(plan.checks) || plan.checks.length === 0) throw new Error('RESULT_UNREADABLE');
  const proofIds = new Set();
  if (!plan.checks.every((check, index) => {
    const file = plan.test_files.find(item => item.path === check?.test_path);
    const valid = closed(check, ['finding_id', 'requirement_ids', 'acceptance_ids', 'test_path', 'test_file_sha256', 'red_test_id', 'control_test_id'])
      && artifactText(check.finding_id) && sortedUniqueStrings(check.requirement_ids) && sortedUniqueStrings(check.acceptance_ids)
      && file && file.sha256 === check.test_file_sha256 && artifactText(check.red_test_id) && artifactText(check.control_test_id)
      && check.red_test_id !== check.control_test_id && !proofIds.has(check.red_test_id) && !proofIds.has(check.control_test_id)
      && (index === 0 || utf8Compare(plan.checks[index - 1].finding_id, check.finding_id) < 0);
    if (valid) { proofIds.add(check.red_test_id); proofIds.add(check.control_test_id); }
    return valid;
  })) throw new Error('RESULT_UNREADABLE');
  const completeFiles = result.test_files.map(file => {
    if (!closed(file, ['path', 'byte_length', 'sha256', 'bytes_base64']) || !validArtifactPath(file.path) || file.path.includes('*')
      || !Number.isSafeInteger(file.byte_length) || file.byte_length < 0 || !/^[0-9a-f]{64}$/.test(file.sha256)) throw new Error('RESULT_UNREADABLE');
    const fileBytes = base64(file.bytes_base64);
    if (fileBytes.length !== file.byte_length || sha256(fileBytes) !== file.sha256) throw new Error('RESULT_UNREADABLE');
    return { path: file.path, byte_length: file.byte_length, sha256: file.sha256, bytes: fileBytes };
  });
  if (new Set(completeFiles.map(file => file.path)).size !== completeFiles.length
    || !completeFiles.every((file, index) => index === 0 || utf8Compare(completeFiles[index - 1].path, file.path) < 0)) throw new Error('RESULT_UNREADABLE');
  const expectedExecution = sha256(canonical({ schema_version: '1.0', candidate_sha: result.candidate_sha, candidate_tree: result.candidate_tree,
    test_files: completeFiles.map(({ bytes: ignored, ...file }) => file) }));
  if (expectedExecution !== result.execution_content_sha256 || await candidateTree(route, action.subject_sha, budget) !== result.candidate_tree) throw new Error('RESULT_UNREADABLE');
  const environment = result.proof_environment;
  const sealedToken = path.basename(environment?.cwd ?? '');
  if (!closed(environment, ['runtime_uid', 'runtime_gid', 'cwd', 'node_executable', 'node_executable_sha256', 'node_version', 'git_executable', 'git_executable_sha256', 'runtime_read_roots', 'sandbox_executable', 'sandbox_executable_sha256', 'environment'])
    || environment.runtime_uid !== route.runtime_uid || environment.runtime_gid !== route.runtime_gid || path.dirname(environment.cwd) !== repairRoot || !/^[0-9a-f]{48}$/.test(sealedToken)
    || environment.node_executable !== route.node_executable || environment.git_executable !== route.git_executable || environment.sandbox_executable !== '/usr/bin/sandbox-exec'
    || !/^v\d+\.\d+\.\d+$/.test(environment.node_version) || !same(environment.environment, { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' })
    || !closedArray(environment.runtime_read_roots) || environment.runtime_read_roots.length > 2
    || !environment.runtime_read_roots.every((root, index) => closed(root, ['path', 'snapshot_sha256']) && path.isAbsolute(root.path) && noControls(root.path) && /^[0-9a-f]{64}$/.test(root.snapshot_sha256) && (index === 0 || utf8Compare(environment.runtime_read_roots[index - 1].path, root.path) < 0))
    ) throw new Error('RESULT_UNREADABLE');
  const capability = supplied?.capability ?? await repairCapability(route, budget);
  if (environment.node_executable_sha256 !== capability.node_executable_sha256
    || environment.git_executable_sha256 !== capability.git_executable_sha256
    || environment.sandbox_executable_sha256 !== capability.sandbox_executable_sha256
    || environment.node_version !== capability.node_version || !same(environment.runtime_read_roots, capability.runtime_read_roots)) throw new Error('RESULT_UNREADABLE');
  if (!closedArray(result.causal_red) || result.causal_red.length === 0 || result.causal_red.length !== plan.checks.length) throw new Error('RESULT_UNREADABLE');
  const scratchIds = new Set(); const profilePaths = new Set();
  for (const [index, causal] of result.causal_red.entries()) {
    const check = plan.checks[index];
    if (!closed(causal, ['finding_id', 'requirement_ids', 'acceptance_ids', 'test_path', 'test_file_sha256', 'red', 'control'])
      || causal.finding_id !== check.finding_id || !same(causal.requirement_ids, check.requirement_ids) || !same(causal.acceptance_ids, check.acceptance_ids)
      || causal.test_path !== check.test_path || causal.test_file_sha256 !== check.test_file_sha256) throw new Error('RESULT_UNREADABLE');
    for (const [kind, execution] of [['RED', causal.red], ['CONTROL', causal.control]]) {
      const executionKeys = ['execution_kind', 'test_id', 'argv', 'environment', 'scratch_id', 'observed_child_id', 'execution_content_sha256', 'sandbox_profile_byte_length', 'sandbox_profile_sha256', 'sandbox_profile_bytes_base64', 'stdout_byte_length', 'stdout_sha256', 'stdout_bytes_base64', 'stderr_byte_length', 'stderr_sha256', 'stderr_bytes_base64', 'exit_code', 'signal', 'timed_out'];
      if (!closed(execution, executionKeys) || execution.execution_kind !== kind || execution.execution_content_sha256 !== result.execution_content_sha256
        || execution.test_id !== (kind === 'RED' ? check.red_test_id : check.control_test_id) || execution.timed_out !== false || execution.signal !== null
        || execution.exit_code !== (kind === 'RED' ? 1 : 0) || !new RegExp(`^${sealedToken}-[0-9a-f]{24}$`).test(execution.scratch_id)
        || !/^[1-9]\d*$/.test(execution.observed_child_id) || !Number.isSafeInteger(Number(execution.observed_child_id))
        || scratchIds.has(execution.scratch_id)
        || !same(execution.environment, { LANG: 'C', LC_ALL: 'C', TZ: 'UTC', TMPDIR: path.join(repairRoot, execution.scratch_id) })
        || !closedArray(execution.argv) || execution.argv.length !== 9 || execution.argv[0] !== '/usr/bin/sandbox-exec' || execution.argv[1] !== '-f'
        || execution.argv[3] !== route.node_executable || !same(execution.argv.slice(4, 8), ['--test', '--test-isolation=none', '--test-reporter=tap', `--test-name-pattern=^${execution.test_id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`])
        || execution.argv[8] !== path.join(environment.cwd, check.test_path)) throw new Error('RESULT_UNREADABLE');
      const rootClauses = environment.runtime_read_roots.map(item => `\n  (subpath ${JSON.stringify(item.path)})`).join('');
      const expectedProfile = Buffer.from(`(version 1)\n(deny default)\n(allow process-fork)\n(allow signal (target self))\n(allow sysctl-read)\n(allow mach-lookup)\n(allow file-read-metadata)\n(allow file-read-data\n  (subpath ${JSON.stringify(environment.cwd)})\n  (subpath ${JSON.stringify(execution.environment.TMPDIR)})\n  (subpath \"/System/Library\")\n  (subpath \"/usr/lib\")${rootClauses})\n(allow file-write* (subpath ${JSON.stringify(execution.environment.TMPDIR)}))\n(allow process-exec (literal ${JSON.stringify(route.node_executable)}) (literal ${JSON.stringify(route.git_executable)}))\n(deny network*)\n`);
      if (!path.isAbsolute(execution.argv[2]) || path.dirname(execution.argv[2]) !== repairRoot
        || !new RegExp(`^${sealedToken}-[0-9a-f]{24}\\.sb$`).test(path.basename(execution.argv[2])) || profilePaths.has(execution.argv[2])) throw new Error('RESULT_UNREADABLE');
      const decodedParts = {};
      for (const prefix of ['sandbox_profile', 'stdout', 'stderr']) {
        const part = base64(execution[`${prefix}_bytes_base64`]);
        if (part.length !== execution[`${prefix}_byte_length`] || sha256(part) !== execution[`${prefix}_sha256`]) throw new Error('RESULT_UNREADABLE');
        if (prefix === 'sandbox_profile' && !part.equals(expectedProfile)) throw new Error('RESULT_UNREADABLE');
        decodedParts[prefix] = part;
      }
      if (!validSelectedTap(decodedParts.stdout, decodedParts.stderr, execution.test_id, kind === 'RED' ? 'red' : 'control')) throw new Error('RESULT_UNREADABLE');
      scratchIds.add(execution.scratch_id); profilePaths.add(execution.argv[2]);
    }
  }
  const captured = await captureRepairFiles(route, { test_files: binding.test_files }, budget);
  if (!same(captured.map(file => ({ path: file.path, byte_length: file.byte_length, sha256: file.sha256 })), binding.test_files)
    || !captured.every((file, index) => file.bytes.equals(completeFiles[index].bytes))) throw new Error('RESULT_UNREADABLE');
  remainingMs(budget);
  return binding;
}

function validValidatorArtifact(bytes, action, expectedChangeId = null) {
  let artifact;
  try { artifact = parseCommandBody(bytes); } catch { throw new Error('RESULT_UNREADABLE'); }
  if (!closed(artifact, ['schema_version', 'change_id', 'candidate_sha', 'validator_head', 'verdict', 'findings', 'risks', 'unverified', 'open_questions'])
    || artifact.schema_version !== '1.0' || !artifactText(artifact.change_id) || (expectedChangeId !== null && artifact.change_id !== expectedChangeId)
    || artifact.candidate_sha !== action.subject_sha || artifact.validator_head !== action.subject_sha
    || !['PASS', 'FAIL'].includes(artifact.verdict) || !closedArray(artifact.findings)
    || !closedArray(artifact.risks) || !closedArray(artifact.unverified) || !closedArray(artifact.open_questions)
    || (artifact.verdict === 'PASS' ? artifact.findings.length !== 0 : artifact.findings.length === 0)) throw new Error('RESULT_UNREADABLE');
  const ordered = (values, field) => values.every((value, index) => closed(value, [field, 'summary', 'evidence_refs'])
    && artifactText(value[field]) && artifactText(value.summary) && sortedEvidence(value.evidence_refs)
    && (index === 0 || utf8Compare(values[index - 1][field], value[field]) < 0));
  const findings = artifact.findings.every((value, index) => closed(value, ['finding_id', 'classification', 'requirement_ids', 'acceptance_ids', 'paths', 'summary', 'evidence_refs'])
    && artifactText(value.finding_id) && ['IMPLEMENTATION_IN_SCOPE', 'CONTRACT', 'ARCHITECTURE', 'SCOPE', 'PATH', 'DEPENDENCY', 'PERMISSION', 'HOST', 'IDENTITY', 'EVIDENCE', 'UNKNOWN'].includes(value.classification)
    && sortedUniqueStrings(value.requirement_ids) && sortedUniqueStrings(value.acceptance_ids) && sortedUniqueStrings(value.paths) && value.paths.every(validArtifactPath)
    && artifactText(value.summary) && sortedEvidence(value.evidence_refs)
    && (value.classification !== 'IMPLEMENTATION_IN_SCOPE' || (value.requirement_ids.length > 0 && value.acceptance_ids.length > 0 && value.paths.length > 0 && value.evidence_refs.length > 0))
    && (index === 0 || utf8Compare(artifact.findings[index - 1].finding_id, value.finding_id) < 0));
  if (!findings || !ordered(artifact.risks, 'note_id')
    || !ordered(artifact.unverified, 'note_id') || !ordered(artifact.open_questions, 'note_id')) throw new Error('RESULT_UNREADABLE');
  return artifact;
}

async function regularOutput(pathname, root) {
  if (path.resolve(pathname) !== pathname || path.dirname(pathname) !== root) throw new Error('SPAWN_REJECTED');
  try {
    const entry = await lstat(pathname);
    if (!entry.isFile() || entry.isSymbolicLink() || await realpath(pathname) !== pathname || path.dirname(await realpath(pathname)) !== root) throw new Error('SPAWN_REJECTED');
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
  }
}

export function createHostAgentLauncher(options) {
  if (!closed(options, ['resultRoot', 'prepareResultRoot']) || !safeText(options.resultRoot)
    || !path.isAbsolute(options.resultRoot) || options.resultRoot === '/' || options.resultRoot.endsWith('/')
    || typeof options.prepareResultRoot !== 'function') throw new Error('INPUT_INVALID');
  const { resultRoot, prepareResultRoot } = options;
  return Object.freeze(async request => {
    if (!closed(request, ['action', 'route'])) throw new Error('INPUT_INVALID');
    const { action, route } = request;
    if (!action || action.action_kind !== 'LAUNCH_AGENT' || !safeCorrelation(action.correlation_id)
      || !HOST_AGENT_BINDING_FIELDS.every(field => Object.hasOwn(action, field))
      || !route || !HOST_AGENT_BINDING_FIELDS.every(field => same(route[field], action[field]))
      || !safeText(route.output_artifact_path) || route.output_artifact_path !== path.join(resultRoot, `${action.correlation_id}.json`)
      || !safeText(route.worktree_root) || !path.isAbsolute(route.worktree_root)
      || !safeText(route.codex_executable) || !path.isAbsolute(route.codex_executable)
      || !Number.isSafeInteger(route.runtime_uid) || !Number.isSafeInteger(route.runtime_gid)) throw new Error('INPUT_INVALID');
    const budget = { deadline: monotonicMs() + AGENT_TIMEOUT_MS, output_bytes: 0 };
    let brief; let input;
    try {
      brief = await readExactArtifact(route.brief_path, action.brief_sha256, budget);
      input = await readExactArtifact(route.input_path, action.input_sha256, budget);
      await readExactArtifact(route.output_schema_path, action.output_schema_sha256, budget);
    } catch { throw new Error('SPAWN_REJECTED'); }
    const repair = action.repair_evidence;
    const proofBound = repair !== undefined || Object.hasOwn(action, 'repair_proof');
    let derivedEvidence = null;
    let effectiveInput = input;
    let pre_inventory = null; let worker_proof = null; let worker_subject = null; let pre_worker_snapshot = null;
    if (repair !== undefined) {
      if (!closed(repair, ['schema_version', 'kind', 'derived_input_sha256', 'derived_input_byte_length', 'derived_input_bytes_base64'])
        || repair.schema_version !== '1.0' || repair.kind !== 'REPAIR_TEST_EVIDENCE') throw new Error('INPUT_INVALID');
      const bytes = base64(repair.derived_input_bytes_base64);
      if (bytes.length !== repair.derived_input_byte_length || sha256(bytes) !== repair.derived_input_sha256) throw new Error('INPUT_INVALID');
      try { derivedEvidence = parseCommandBody(bytes); } catch { throw new Error('INPUT_INVALID'); }
      if (!validDerivedEvidence(derivedEvidence, action, route)) throw new Error('INPUT_INVALID');
      effectiveInput = Buffer.concat([input, Buffer.from(`\n\n--- JUANERAI_REPAIR_TEST_EVIDENCE_V1 ${bytes.length} ${sha256(bytes)} ---\n`), bytes]);
    }
    if (proofBound) {
      try {
        await trustedRootExecutable(route.codex_executable, route.runtime_gid);
        await repairCapability(route, budget);
      } catch { throw new Error('ROUTE_UNAVAILABLE'); }
      if (repair !== undefined && await candidateTree(route, action.subject_sha, budget) !== derivedEvidence.candidate_tree) throw new Error('INPUT_INVALID');
      pre_inventory = await inventoryChangedPaths(route, budget);
    }
    if (repair !== undefined && pre_inventory.length !== 0) throw new Error('MANUAL_CONTROLLER_STOP');
    if (Object.hasOwn(action, 'repair_proof')) {
      worker_proof = await readBoundRepairProof(route, action, budget);
      if (!same(pre_inventory, action.repair_proof.test_files.map(file => file.path))) throw new Error('MANUAL_CONTROLLER_STOP');
      worker_subject = await readRepairWorkerSubject(route, action, budget);
      remainingMs(budget); pre_worker_snapshot = await readRepairWorkerSnapshot(worker_subject); remainingMs(budget);
    }
    remainingMs(budget);
    if (await prepareResultRoot(Object.freeze({ resultRoot })) !== undefined) throw new Error('SPAWN_REJECTED');
    const rootEntry = await lstat(resultRoot);
    if (!rootEntry.isDirectory() || rootEntry.isSymbolicLink() || await realpath(resultRoot) !== resultRoot) throw new Error('SPAWN_REJECTED');
    if (proofBound && (rootEntry.uid !== 0 || rootEntry.gid !== route.runtime_gid || (rootEntry.mode & 0o777) !== 0o770)) throw new Error('MANUAL_CONTROLLER_STOP');
    await regularOutput(route.output_artifact_path, resultRoot);
    remainingMs(budget);
    const args = ['exec', '--ephemeral', '--ignore-user-config', '--approve-for-me', '--model', action.model,
      '--config', `model_reasoning_effort=${JSON.stringify(action.reasoning)}`, '--sandbox', action.sandbox,
      '--cd', route.worktree_root, '--output-schema', route.output_schema_path,
      '--output-last-message', route.output_artifact_path, '-'];
    const child = spawn(route.codex_executable, args, { cwd: route.worktree_root, env: fixedAgentEnvironment(route), shell: false,
      uid: route.runtime_uid, gid: route.runtime_gid, stdio: ['pipe', 'pipe', 'pipe'], detached: proofBound });
    const stdout = []; const stderr = [];
    let timedOut = false; let overflow = false; let terminated = false; let childError = null; let streamError = null; let stdinError = null;
    const terminate = () => { if (!terminated) { terminated = true; try { child.kill('SIGTERM'); } catch {} } };
    const removeRawPlan = async () => {
      if (repair === undefined) return true;
      try { await rm(route.output_artifact_path, { force: true }); return absent(route.output_artifact_path); } catch { return false; }
    };
    const collect = target => chunk => { if (!consumeOutput(budget, chunk.length)) { overflow = true; terminate(); } else target.push(Buffer.from(chunk)); };
    child.stdout.on('data', collect(stdout)); child.stderr.on('data', collect(stderr));
    child.stdout.on('error', error => { streamError ??= error; terminate(); });
    child.stderr.on('error', error => { streamError ??= error; terminate(); });
    child.stdin.on('error', error => { stdinError ??= error; terminate(); });
    let resolveSpawn; let rejectSpawn;
    const spawned = new Promise((resolve, reject) => { resolveSpawn = resolve; rejectSpawn = reject; });
    child.once('spawn', resolveSpawn);
    child.once('error', error => { childError ??= error; rejectSpawn(error); });
    const childClosed = new Promise(resolve => child.once('close', (code, signal) => resolve({ code, signal })));
    const timer = setTimeout(() => { timedOut = true; terminate(); }, Math.max(0, budget.deadline - monotonicMs()));
    const completed = (async () => {
      const { code, signal } = await childClosed;
      clearTimeout(timer);
      let groupEmpty = !proofBound;
      if (proofBound) { try { process.kill(-child.pid, 0); } catch (error) { groupEmpty = error?.code === 'ESRCH'; } }
      if (timedOut || signal || overflow || childError || streamError || stdinError || !groupEmpty) {
        if (!await removeRawPlan()) return { failed: true };
        return { interrupted: true, reason_code: proofBound ? 'RESULT_UNREADABLE' : 'AGENT_EXITED' };
      }
      try {
        remainingMs(budget);
        const artifact = await readExpectedOutput(route.output_artifact_path, resultRoot);
        if (artifact.length === 0 || artifact.length > MAX_FRAME_BYTES) throw new Error('RESULT_UNREADABLE');
        const validator_artifact = action.phase === 'VALIDATOR' ? validValidatorArtifact(artifact, action) : null;
        const parsed = validator_artifact ?? (proofBound ? parseCommandBody(artifact) : JSON.parse(artifact.toString('utf8')));
        const repair_plan = repair === undefined ? null : code === 0 && validRepairPlan(parsed, action, derivedEvidence, route) ? parsed : null;
        if (repair !== undefined && repair_plan === null) throw new Error('RESULT_UNREADABLE');
        const status = code === 0
          ? (action.phase === 'VALIDATOR' ? validator_artifact.verdict : repair_plan ? 'FAIL' : parsed?.status === 'PASS' ? 'PASS' : 'FAIL')
          : 'FAIL';
        const allowed_path_inventory = await inventoryChangedPaths(route, budget);
        remainingMs(budget);
        return { status, artifact_sha256: sha256(artifact), allowed_path_inventory, stdout_sha256: sha256(Buffer.concat(stdout)), stderr_sha256: sha256(Buffer.concat(stderr)),
          pre_inventory, worker_proof, worker_subject, pre_worker_snapshot,
          ...(validator_artifact ? { validator_artifact } : {}), ...(repair_plan ? { repair_plan, repair_plan_bytes: artifact } : {}) };
      } catch {
        if (!await removeRawPlan()) return { failed: true };
        return { failed: true };
      }
    })();
    OWNED_LAUNCH_BUDGETS.set(completed, budget);
    try { await spawned; } catch { clearTimeout(timer); terminate(); await childClosed; if (!await removeRawPlan()) throw new Error('SPAWN_REJECTED'); throw new Error('SPAWN_REJECTED'); }
    if (!Number.isSafeInteger(child.pid) || child.pid <= 0) { terminate(); await childClosed; clearTimeout(timer); if (!await removeRawPlan()) throw new Error('SPAWN_REJECTED'); throw new Error('SPAWN_REJECTED'); }
    if (proofBound) {
      try { process.kill(-child.pid, 0); } catch { terminate(); await childClosed; clearTimeout(timer); if (!await removeRawPlan()) throw new Error('ROUTE_UNAVAILABLE'); throw new Error('ROUTE_UNAVAILABLE'); }
    }
    try {
      child.stdin.end(Buffer.concat([brief, Buffer.from('\n\n'), effectiveInput]), error => { if (error) { stdinError ??= error; terminate(); } });
    } catch (error) {
      stdinError ??= error;
      terminate();
    }
    return { observed_child_id: String(child.pid), completed };
  });
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
    let route;
    let child;
    let launchBudget = null;
    try {
      route = assertExactAction(action, await options.durable_route(action));
      child = await options.launch_agent({ action, route });
      if (!child || typeof child.observed_child_id !== 'string' || child.observed_child_id.length === 0) throw new Error('SPAWN_REJECTED');
      if (child.completed !== null && (typeof child.completed === 'object' || typeof child.completed === 'function')) launchBudget = OWNED_LAUNCH_BUDGETS.get(child.completed) ?? null;
    } catch (error) {
      return settle(result, action, {
        ...settlementBinding(action),
        stage: 'START_FAILED',
        failure_code: /ROUTE|REASONING|MANUAL_CONTROLLER_STOP/.test(String(error?.message)) ? 'ROUTE_UNAVAILABLE' : 'SPAWN_REJECTED',
      });
    }
    let current = await settle(result, action, {
      ...settlementBinding(action),
      stage: 'STARTED',
      observed_child_id: child.observed_child_id,
    });
    let publishedRepairArtifact = null;
    try {
      const completed = await child.completed;
      if (completed?.failed) throw new Error('RESULT_UNREADABLE');
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
      const proofBound = Object.hasOwn(action, 'repair_evidence') || Object.hasOwn(action, 'repair_proof');
      const enforceDeadline = () => {
        if (launchBudget !== null) remainingMs(launchBudget);
        else if (proofBound) throw new Error('RESULT_UNREADABLE');
      };
      enforceDeadline();
      if (action.phase === 'VALIDATOR') await readExactArtifact(route.output_schema_path, action.output_schema_sha256, launchBudget);
      const artifact = proofBound ? await readExpectedOutput(route.output_artifact_path, path.dirname(route.output_artifact_path)) : await options.read_artifact(route.output_artifact_path);
      enforceDeadline();
      const inventory = proofBound ? await inventoryChangedPaths(route, launchBudget) : await options.inventory_paths(route.worktree_root);
      enforceDeadline();
      if (!(artifact instanceof Uint8Array) || sha256(artifact) !== completed.artifact_sha256
        || !same(inventory, completed.allowed_path_inventory)) throw new Error('RESULT_UNREADABLE');
      const repair_result = completed.repair_plan
        ? await repairProofFromPlan(route, action, completed.repair_plan, completed.repair_plan_bytes, completed.pre_inventory, inventory, launchBudget)
        : null;
      publishedRepairArtifact = repair_result?.artifact_path ?? null;
      const result_path = repair_result?.artifact_path ?? route.output_artifact_path;
      const result_artifact = repair_result ? (await stableNoFollowBytes(result_path, 'RESULT_UNREADABLE')).bytes : artifact;
      if (!(result_artifact instanceof Uint8Array) || sha256(result_artifact) !== (repair_result?.artifact_sha256 ?? completed.artifact_sha256)) throw new Error('RESULT_UNREADABLE');
      if (repair_result) {
        const binding = { schema_version: '1.0', kind: 'REPAIR_TEST_HOST_PROOF_REF', artifact_path: repair_result.artifact_path,
          artifact_sha256: repair_result.artifact_sha256, execution_content_sha256: repair_result.repair_proof.execution_content_sha256,
          proof_receipt_sha256: repair_result.repair_proof.proof_receipt_sha256, test_files: repair_result.repair_proof.test_files };
        await readBoundRepairProof(route, { ...action, repair_proof: binding }, launchBudget);
      }
      const validator_artifact = action.phase === 'VALIDATOR'
        ? validValidatorArtifact(result_artifact, action, current.change_id) : null;
      if (validator_artifact && completed.status !== validator_artifact.verdict) throw new Error('RESULT_UNREADABLE');
      let repair_delivery = null;
      if (action.role === 'juaner_worker' && action.phase === 'WORKER_GREEN' && Object.hasOwn(action, 'repair_proof')) {
        const postProof = await readBoundRepairProof(route, action, launchBudget);
        const postInventory = await inventoryChangedPaths(route, launchBudget);
        const changed = postInventory.filter(item => !completed.pre_inventory.includes(item));
        if (!same(completed.worker_proof, postProof) || changed.length === 0
          || !changed.every(item => action.allowed_paths.some(rule => rule.endsWith('/**') ? item.startsWith(rule.slice(0, -2)) : item === rule))) throw new Error('RESULT_UNREADABLE');
        remainingMs(launchBudget);
        const postSnapshot = await readRepairWorkerSnapshot(await readRepairWorkerSubject(route, action, launchBudget));
        remainingMs(launchBudget);
        if (postSnapshot === completed.pre_worker_snapshot) throw new Error('RESULT_UNREADABLE');
        repair_delivery = { schema_version: '1.0', kind: 'REPAIR_WORKER_DELIVERY', repair_proof: structuredClone(postProof), post_worker_worktree_snapshot_sha256: postSnapshot };
      }
      enforceDeadline();
      current = await coordinator.settlement({
        change_id: current.change_id,
        expected_state_version: current.state_version,
        expected_state_hash: current.state_hash,
        settlement: {
          ...settlementBinding(action),
          stage: 'RESULT',
          observed_child_id: child.observed_child_id,
          status: repair_result ? 'PASS' : completed.status,
          artifact_path: result_path,
          artifact_sha256: repair_result?.artifact_sha256 ?? completed.artifact_sha256,
          ...(validator_artifact ? { validator_artifact } : {}),
          ...(repair_result ? { repair_proof: repair_result.repair_proof } : {}),
          ...(repair_delivery ? { repair_delivery } : {}),
        },
      });
      return current;
    } catch {
      if (publishedRepairArtifact !== null) { try { await rm(publishedRepairArtifact, { force: true }); await absent(publishedRepairArtifact); } catch {} }
      if (Object.hasOwn(action, 'repair_evidence')) { try { await rm(route.output_artifact_path, { force: true }); await absent(route.output_artifact_path); } catch {} }
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
  const server = net.createServer({ allowHalfOpen: true }, socket => {
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
  const launcher = createHostAgentLauncher({
    resultRoot: AGENT_RESULT_ROOT,
    prepareResultRoot: async ({ resultRoot }) => {
      await mkdir(resultRoot, { recursive: true, mode: 0o770 });
      await chown(resultRoot, 0, config.runtime_gid);
      await chmod(resultRoot, 0o770);
    },
  });
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
    launch_agent: launcher,
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
