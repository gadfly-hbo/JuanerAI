import { createHash } from 'node:crypto';

const MAX_BYTES = 1024 * 1024;
const SUBJECT_KEYS = ['kind', 'repository_root', 'worktree_root', 'branch', 'head_sha', 'common_git_dir', 'allowed_paths', 'forbidden_paths'];
const OBSERVATION_KEYS = ['repository_root_realpath', 'worktree_root_realpath', 'common_git_dir_realpath', 'branch', 'head_sha', 'status_stdout', 'ignored_status_stdout', 'index_probe', 'entries'];
const INDEX_KEYS = ['exit_code', 'signal', 'stdout', 'stderr'];
const ENTRY_KEYS = ['path_bytes', 'parent_realpath', 'before', 'content', 'after'];
const PRESENT_KEYS = ['kind', 'type', 'mode', 'dev', 'ino', 'size', 'mtime_ns', 'ctime_ns'];
const MISSING_KEYS = ['kind'];
const TYPES = new Set(['FILE', 'SYMLINK', 'DIRECTORY', 'SOCKET', 'FIFO', 'BLOCK_DEVICE', 'CHARACTER_DEVICE', 'OTHER']);
const hash = value => createHash('sha256').update(value).digest('hex');
const canonical = value => Array.isArray(value)
  ? `[${value.map(canonical).join(',')}]`
  : value && typeof value === 'object'
    ? `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`
    : JSON.stringify(value);
const inputInvalid = () => ({ kind: 'REJECTED', reason: 'INPUT_INVALID' });
const subjectMismatch = () => ({ kind: 'REJECTED', reason: 'SUBJECT_MISMATCH' });

function closed(value, keys) {
  if (value === null || typeof value !== 'object' || Array.isArray(value) || Object.getPrototypeOf(value) !== Object.prototype) return false;
  const own = Reflect.ownKeys(value);
  if (own.length !== keys.length || !keys.every(key => own.includes(key))) return false;
  return own.every(key => typeof key === 'string'
    && Object.prototype.propertyIsEnumerable.call(value, key)
    && Object.getOwnPropertyDescriptor(value, key)?.get === undefined
    && Object.getOwnPropertyDescriptor(value, key)?.set === undefined);
}

function closedArray(value) {
  if (!Array.isArray(value) || Object.getPrototypeOf(value) !== Array.prototype) return false;
  const length = Object.getOwnPropertyDescriptor(value, 'length');
  if (!length || length.enumerable !== false || !Object.hasOwn(length, 'value')
    || !Number.isSafeInteger(length.value) || length.value < 0) return false;
  const ownKeys = Reflect.ownKeys(value);
  if (ownKeys.length !== length.value + 1 || !ownKeys.includes('length')) return false;
  for (let index = 0; index < length.value; index += 1) {
    const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
    if (descriptor?.enumerable !== true || !Object.hasOwn(descriptor, 'value')
      || Object.hasOwn(descriptor, 'get') || Object.hasOwn(descriptor, 'set')) return false;
  }
  return true;
}

function byteString(value, maximum) {
  return typeof value === 'string' && !value.includes('\0') && Buffer.byteLength(value, 'utf8') >= 1 && Buffer.byteLength(value, 'utf8') <= maximum;
}

function canonicalAbsolute(value) {
  if (!byteString(value, 4096) || !value.startsWith('/')) return false;
  if (value !== '/' && value.endsWith('/')) return false;
  return !value.includes('//') && !value.split('/').slice(1).some(segment => segment === '.' || segment === '..');
}

function validBranch(value) {
  return byteString(value, 255) && /^work\/mac-mini\/[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
}

function validSha(value, size = 40) {
  return typeof value === 'string' && new RegExp(`^[0-9a-f]{${size}}$`).test(value);
}

function validScopeRule(value) {
  if (!byteString(value, 4096) || value.startsWith('/') || value.includes('\\')) return false;
  const prefix = value.endsWith('/**');
  const bare = prefix ? value.slice(0, -3) : value;
  if (!bare || (!prefix && value.endsWith('/')) || /[*?\[\]]/.test(bare)) return false;
  return !bare.split('/').some(segment => !segment || segment === '.' || segment === '..');
}

function validScope(value) {
  if (!closedArray(value) || !value.every(validScopeRule)) return false;
  const seen = new Set();
  for (const rule of value) {
    const bytes = Buffer.from(rule, 'utf8').toString('hex');
    if (seen.has(bytes)) return false;
    seen.add(bytes);
  }
  return true;
}

function validSubject(subject) {
  if (!closed(subject, SUBJECT_KEYS) || subject.kind !== 'WORKTREE'
    || !canonicalAbsolute(subject.repository_root) || !canonicalAbsolute(subject.worktree_root)
    || !canonicalAbsolute(subject.common_git_dir) || !validBranch(subject.branch) || !validSha(subject.head_sha)
    || !validScope(subject.allowed_paths) || !validScope(subject.forbidden_paths)) return false;
  const allowed = new Set(subject.allowed_paths.map(rule => Buffer.from(rule, 'utf8').toString('hex')));
  return !subject.forbidden_paths.some(rule => allowed.has(Buffer.from(rule, 'utf8').toString('hex')))
    && Buffer.byteLength(canonical({ allowed_paths: subject.allowed_paths, forbidden_paths: subject.forbidden_paths }), 'utf8') <= MAX_BYTES;
}

function validStat(value) {
  const missing = closed(value, MISSING_KEYS);
  const present = missing ? false : closed(value, PRESENT_KEYS);
  if (!missing && !present) return false;
  if (value.kind === 'MISSING') return missing;
  return present && value.kind === 'PRESENT' && TYPES.has(value.type)
    && ['mode', 'dev', 'ino', 'size', 'mtime_ns', 'ctime_ns'].every(key => typeof value[key] === 'bigint' && value[key] >= 0n);
}

function validContent(value) {
  const missing = closed(value, MISSING_KEYS);
  const file = missing ? false : closed(value, ['kind', 'sha256']);
  const symlink = missing || file ? false : closed(value, ['kind', 'target_sha256']);
  if (!missing && !file && !symlink) return false;
  if (value.kind === 'MISSING') return missing;
  if (value.kind === 'FILE') return file && validSha(value.sha256, 64);
  return value.kind === 'SYMLINK' && symlink && validSha(value.target_sha256, 64);
}

function equalStat(left, right) {
  const keys = left.kind === 'MISSING' ? MISSING_KEYS : PRESENT_KEYS;
  return keys.every(key => left[key] === right[key]);
}

function parseStatus(bytes) {
  if (bytes.length === 0) return [];
  const records = []; let start = 0;
  for (let index = 0; index < bytes.length; index += 1) {
    if (bytes[index] !== 0) continue;
    const record = bytes.subarray(start, index);
    start = index + 1;
    if (record.length < 4 || record.length > 4099 || record[2] !== 0x20) return null;
    const xy = record.subarray(0, 2).toString('ascii');
    const pathBytes = record.subarray(3);
    if (![' M', ' D', ' T', '??'].includes(xy) || !validInventoryPath(pathBytes)) return null;
    records.push({ xy, path_bytes: pathBytes });
  }
  return start === bytes.length ? records : null;
}

function validInventoryPath(bytes) {
  if (bytes.length < 1 || bytes.length > 4096 || bytes[0] === 0x2f || bytes.includes(0x5c)) return false;
  let start = 0;
  for (let index = 0; index <= bytes.length; index += 1) {
    if (index !== bytes.length && bytes[index] !== 0x2f) continue;
    const segment = bytes.subarray(start, index);
    if (segment.length === 0 || (segment.length === 1 && segment[0] === 0x2e)
      || (segment.length === 2 && segment[0] === 0x2e && segment[1] === 0x2e)) return false;
    start = index + 1;
  }
  return true;
}

function ruleMatches(rule, pathBytes) {
  const bytes = Buffer.from(rule.endsWith('/**') ? rule.slice(0, -3) : rule, 'utf8');
  if (!rule.endsWith('/**')) return bytes.equals(pathBytes);
  return pathBytes.length > bytes.length && pathBytes.subarray(0, bytes.length).equals(bytes) && pathBytes[bytes.length] === 0x2f;
}

function inScope(subject, pathBytes) {
  return subject.allowed_paths.some(rule => ruleMatches(rule, pathBytes))
    && !subject.forbidden_paths.some(rule => ruleMatches(rule, pathBytes));
}

function validEntry(entry) {
  return closed(entry, ENTRY_KEYS) && entry.path_bytes instanceof Uint8Array && entry.path_bytes.length >= 1 && entry.path_bytes.length <= 4096
    && canonicalAbsolute(entry.parent_realpath) && validStat(entry.before) && validStat(entry.after) && validContent(entry.content);
}

function stableLeaf(record, entry) {
  if (!equalStat(entry.before, entry.after)) return null;
  if (record.xy === ' D') return entry.before.kind === 'MISSING' && entry.after.kind === 'MISSING' && entry.content.kind === 'MISSING'
    ? { type: 'MISSING', mode: '000000', identity: 'MISSING' } : null;
  if (entry.before.kind !== 'PRESENT' || !['FILE', 'SYMLINK'].includes(entry.before.type)) return null;
  if (entry.before.type === 'FILE' && entry.content.kind === 'FILE') return {
    type: 'FILE', mode: (entry.before.mode & 0o111n) !== 0n ? '100755' : '100644', identity: entry.content.sha256,
  };
  if (entry.before.type === 'SYMLINK' && entry.content.kind === 'SYMLINK') return { type: 'SYMLINK', mode: '120000', identity: entry.content.target_sha256 };
  return null;
}

export function evaluateWorktreeSnapshotObservationV1(input) {
  try {
    if (!closed(input, ['schema_version', 'subject', 'observation']) || input.schema_version !== '1.0' || !validSubject(input.subject)) return inputInvalid();
    const { subject, observation } = input;
    if (!closed(observation, OBSERVATION_KEYS) || !canonicalAbsolute(observation.repository_root_realpath)
      || !canonicalAbsolute(observation.worktree_root_realpath) || !canonicalAbsolute(observation.common_git_dir_realpath)
      || !validBranch(observation.branch) || !validSha(observation.head_sha)
      || !(observation.status_stdout instanceof Uint8Array) || !(observation.ignored_status_stdout instanceof Uint8Array)
      || observation.status_stdout.length > MAX_BYTES || observation.ignored_status_stdout.length > MAX_BYTES
      || !closed(observation.index_probe, INDEX_KEYS) || !(observation.index_probe.stdout instanceof Uint8Array)
      || !(observation.index_probe.stderr instanceof Uint8Array) || !closedArray(observation.entries)
      || !observation.entries.every(validEntry)) return inputInvalid();
    const index = observation.index_probe;
    if (!((Number.isSafeInteger(index.exit_code) || index.exit_code === null)
      && (index.signal === null || typeof index.signal === 'string' && index.signal.length > 0))) return inputInvalid();
    if (observation.repository_root_realpath !== subject.repository_root || observation.worktree_root_realpath !== subject.worktree_root
      || observation.common_git_dir_realpath !== subject.common_git_dir || observation.branch !== subject.branch || observation.head_sha !== subject.head_sha
      || index.exit_code !== 0 || index.signal !== null || index.stdout.length !== 0 || index.stderr.length !== 0) return subjectMismatch();
    const status = parseStatus(Buffer.from(observation.status_stdout));
    const ignored = parseStatus(Buffer.from(observation.ignored_status_stdout));
    if (!status || !ignored || !Buffer.from(observation.status_stdout).equals(Buffer.from(observation.ignored_status_stdout))
      || status.length !== observation.entries.length) return subjectMismatch();
    const byPath = new Map();
    for (const entry of observation.entries) {
      const key = Buffer.from(entry.path_bytes).toString('hex');
      if (byPath.has(key)) return subjectMismatch();
      byPath.set(key, entry);
    }
    const records = [];
    for (const record of status) {
      const key = Buffer.from(record.path_bytes).toString('hex');
      const entry = byPath.get(key);
      if (!entry || !inScope(subject, record.path_bytes) || !isContainedParent(entry.parent_realpath, observation.worktree_root_realpath)) return subjectMismatch();
      const leaf = stableLeaf(record, entry);
      if (!leaf) return subjectMismatch();
      records.push(Buffer.concat([
        Buffer.from(record.path_bytes), Buffer.from([0]), Buffer.from(record.xy, 'ascii'), Buffer.from([0]),
        Buffer.from(leaf.type, 'ascii'), Buffer.from([0]), Buffer.from(leaf.mode, 'ascii'), Buffer.from([0]),
        Buffer.from(leaf.identity, 'ascii'), Buffer.from([0]),
      ]));
    }
    const scope_sha256 = hash(Buffer.from(canonical({ allowed_paths: subject.allowed_paths, forbidden_paths: subject.forbidden_paths }), 'utf8'));
    const raw_inventory_sha256 = hash(Buffer.from(observation.status_stdout));
    records.sort(Buffer.compare);
    const preimage = Buffer.concat([
      Buffer.from('JUANERAI_WORKTREE_SNAPSHOT_V1', 'ascii'), Buffer.from([0]),
      Buffer.from(observation.repository_root_realpath, 'utf8'), Buffer.from([0]), Buffer.from(observation.worktree_root_realpath, 'utf8'), Buffer.from([0]),
      Buffer.from(observation.branch, 'utf8'), Buffer.from([0]), Buffer.from(observation.head_sha, 'ascii'), Buffer.from([0]),
      Buffer.from(observation.common_git_dir_realpath, 'utf8'), Buffer.from([0]), Buffer.from(scope_sha256, 'ascii'), Buffer.from([0]),
      Buffer.from(raw_inventory_sha256, 'ascii'), Buffer.from([0]), ...records,
    ]);
    return { kind: 'OK', value: { scope_sha256, raw_inventory_sha256, worktree_snapshot_sha256: hash(preimage), entry_count: status.length } };
  } catch {
    return inputInvalid();
  }
}

function isContainedParent(parent, root) {
  return parent === root || (root === '/' ? parent.startsWith('/') : parent.startsWith(`${root}/`));
}
