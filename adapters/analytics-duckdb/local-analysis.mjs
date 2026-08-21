import { createHash, randomBytes } from 'node:crypto';
import { lstatSync, realpathSync, statSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { resolve, sep } from 'node:path';
import { spawn } from 'node:child_process';

const fixture = Object.freeze({
  version: 'member-orders-v1', kind: 'csv', sha256: 'c0d1c3d2b1e8621955ab786dc87cebc14437033bda4def397498db5a1544ebb0', path: 'member-orders-v1.csv',
});
const runIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const queryBytes = Buffer.from(`WITH windowed AS (
  SELECT order_id, member_id, ordered_on,
    CASE
      WHEN ordered_on BETWEEN DATE '2026-08-01' AND DATE '2026-08-07' THEN 'baseline'
      WHEN ordered_on BETWEEN DATE '2026-08-08' AND DATE '2026-08-14' THEN 'recent'
    END AS window_id
  FROM member_orders
), member_orders_by_window AS (
  SELECT window_id, member_id, count(DISTINCT order_id) AS member_order_count
  FROM windowed
  WHERE window_id IS NOT NULL
  GROUP BY window_id, member_id
), member_counts AS (
  SELECT window_id,
    count(*) AS active_member_count,
    count(*) FILTER (WHERE member_order_count >= 2) AS repeat_purchaser_count
  FROM member_orders_by_window
  GROUP BY window_id
), order_counts AS (
  SELECT window_id, count(DISTINCT order_id) AS order_count
  FROM windowed
  WHERE window_id IS NOT NULL
  GROUP BY window_id
)
SELECT orders.window_id, orders.order_count,
  members.active_member_count, members.repeat_purchaser_count
FROM order_counts AS orders
JOIN member_counts AS members USING (window_id)
ORDER BY orders.window_id;
`, 'utf8');
const scriptBytes = Buffer.from(`import csv
import json
import sys

WINDOWS = {
    "baseline": ("2026-08-01", "2026-08-07"),
    "recent": ("2026-08-08", "2026-08-14"),
}

def calculate(path):
    with open(path, "r", encoding="utf-8", newline="") as source:
        rows = list(csv.DictReader(source))
    result = {}
    for window_id, (start_date, end_date) in WINDOWS.items():
        selected = [row for row in rows if start_date <= row["ordered_on"] <= end_date]
        members = {}
        for row in selected:
            members.setdefault(row["member_id"], set()).add(row["order_id"])
        result[window_id] = {
            "order_count": len({row["order_id"] for row in selected}),
            "active_member_count": len(members),
            "repeat_purchaser_count": sum(len(order_ids) >= 2 for order_ids in members.values()),
        }
    return result

print(json.dumps(calculate(sys.argv[1]), separators=(",", ":"), sort_keys=True))
`, 'utf8');

function error(code) {
  const value = new Error(code);
  value.code = code;
  value.stack = code;
  return value;
}

function reject(code) { throw error(code); }
function plain(value) { return value !== null && typeof value === 'object' && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype; }
function frozenPlain(value) { return plain(value) && Object.isFrozen(value); }
function closed(value, keys, code = 'ANALYSIS_EXECUTION_FAILED') {
  if (!plain(value) || Object.keys(value).length !== keys.length || keys.some((key) => !Object.hasOwn(value, key) || value[key] === null || value[key] === undefined)) reject(code);
}
function hash(bytes) { return createHash('sha256').update(bytes).digest('hex'); }
function contained(root, candidate) { return candidate.startsWith(`${root}${sep}`); }
function safeRoot(config) {
  closed(config, ['workspaceRoot'], 'SOURCE_BOUNDARY_VIOLATION');
  if (typeof config.workspaceRoot !== 'string' || !config.workspaceRoot.startsWith(sep)) reject('SOURCE_BOUNDARY_VIOLATION');
  try {
    const before = lstatSync(config.workspaceRoot);
    const root = realpathSync(config.workspaceRoot);
    if (before.isSymbolicLink() || !before.isDirectory() || root === resolve(sep)) reject('SOURCE_BOUNDARY_VIOLATION');
    return root;
  } catch (cause) {
    if (cause?.code === 'SOURCE_BOUNDARY_VIOLATION') throw cause;
    reject('SOURCE_BOUNDARY_VIOLATION');
  }
}
function validSource(source, identityCode = 'FIXTURE_MISMATCH') {
  closed(source, ['version', 'kind', 'sha256', 'path'], 'SOURCE_BOUNDARY_VIOLATION');
  if (typeof source.path !== 'string' || source.path.startsWith(sep) || source.path.split('/').includes('..')) reject('SOURCE_BOUNDARY_VIOLATION');
  if (source.version !== fixture.version) reject('CONTRACT_VERSION_UNSUPPORTED');
  if (source.kind !== fixture.kind || source.sha256 !== fixture.sha256 || source.path !== fixture.path) reject(identityCode);
}
function validRun(run_id, contract) {
  if (typeof run_id !== 'string' || !runIdPattern.test(run_id) || !plain(contract) || contract.run_id !== run_id) reject('ANALYSIS_EXECUTION_FAILED');
}
async function sourceBytes(root, source, mismatchCode = 'FIXTURE_MISMATCH', identityCode = mismatchCode, missingCode = 'FIXTURE_NOT_FOUND') {
  validSource(source, identityCode);
  const target = resolve(root, source.path);
  if (!contained(root, target)) reject('SOURCE_BOUNDARY_VIOLATION');
  try {
    const link = lstatSync(target);
    if (link.isSymbolicLink() || !link.isFile()) reject('SOURCE_BOUNDARY_VIOLATION');
    const real = realpathSync(target);
    if (!contained(root, real) || !statSync(real).isFile()) reject('SOURCE_BOUNDARY_VIOLATION');
    const bytes = await readFile(real);
    const read_at = new Date().toISOString();
    if (bytes.byteLength !== 530 || hash(bytes) !== fixture.sha256) reject(mismatchCode);
    const text = bytes.toString('utf8');
    const lines = text.endsWith('\n') && !text.includes('\r') ? text.slice(0, -1).split('\n') : [];
    if (lines.shift() !== 'order_id,member_id,ordered_on' || lines.length !== 20 || lines.some((line) => !/^ORD-\d{3},M-\d{3},2026-08-(0[1-9]|1[0-4])$/.test(line))) reject(mismatchCode);
    return { bytes, path: real, read_at };
  } catch (cause) {
    if (['SOURCE_BOUNDARY_VIOLATION', 'FIXTURE_MISMATCH', 'SOURCE_CHANGED', 'CONTRACT_VERSION_UNSUPPORTED'].includes(cause?.code)) throw cause;
    if (cause?.code === 'ENOENT') reject(missingCode);
    reject('SOURCE_BOUNDARY_VIOLATION');
  }
}
function validPreflightInput(input) {
  if (!frozenPlain(input) || Object.keys(input).length !== 1 || !Object.hasOwn(input, 'source') || !frozenPlain(input.source)) reject('SOURCE_BOUNDARY_VIOLATION');
  validSource(input.source);
}
function frozenIdentity(source, byte_size, read_at) {
  return Object.freeze({
    source_id: 'SRC-001', kind: fixture.kind, path: source.path, sha256: fixture.sha256,
    byte_size, fixture_version: fixture.version, read_at,
  });
}
function validateCall(input, withSql = false) {
  const keys = withSql
    ? ['source', 'run_id', 'confirmed_contract', 'sql_result', 'deadline_seconds', 'cancellation_signal']
    : ['source', 'run_id', 'confirmed_contract', 'deadline_seconds', 'cancellation_signal'];
  closed(input, keys);
  validSource(input.source, 'SOURCE_BOUNDARY_VIOLATION');
  validRun(input.run_id, input.confirmed_contract);
  if (!Number.isInteger(input.deadline_seconds) || input.deadline_seconds < 0 || input.deadline_seconds > 30) reject('ANALYSIS_EXECUTION_FAILED');
  if (!input.cancellation_signal || typeof input.cancellation_signal.aborted !== 'boolean') reject('ANALYSIS_EXECUTION_FAILED');
  if (input.cancellation_signal.aborted) reject('CANCELLED');
  if (input.deadline_seconds === 0) reject('TIMEOUT');
}
function rational(numerator, denominator) {
  let a = Math.abs(numerator); let b = Math.abs(denominator);
  while (b) [a, b] = [b, a % b];
  return { numerator: numerator / a, denominator: denominator / a };
}
function toResult(values) {
  const byWindow = new Map(values.map((value) => [value.window_id, value]));
  const metric = (id, start_date, end_date) => {
    const value = byWindow.get(id);
    if (!value || !Number.isInteger(value.order_count) || !Number.isInteger(value.active_member_count) || !Number.isInteger(value.repeat_purchaser_count) || value.active_member_count <= 0) reject('VALIDATION_FAILED');
    return { window_id: id, start_date, end_date, order_count: value.order_count, active_member_count: value.active_member_count, repeat_purchaser_count: value.repeat_purchaser_count, repurchase_member_rate: rational(value.repeat_purchaser_count, value.active_member_count) };
  };
  const baseline = metric('baseline', '2026-08-01', '2026-08-07');
  const recent = metric('recent', '2026-08-08', '2026-08-14');
  const delta = rational(100 * ((recent.repurchase_member_rate.numerator * baseline.repurchase_member_rate.denominator) - (baseline.repurchase_member_rate.numerator * recent.repurchase_member_rate.denominator)), recent.repurchase_member_rate.denominator * baseline.repurchase_member_rate.denominator);
  const status = recent.repurchase_member_rate.numerator * baseline.repurchase_member_rate.denominator < baseline.repurchase_member_rate.numerator * recent.repurchase_member_rate.denominator ? 'supported' : 'contradicted';
  return { baseline, recent, repurchase_member_rate_delta_pp: delta, signal: { comparison: 'recent_lt_baseline', status } };
}
function run(command, args, signal, seconds) {
  return new Promise((resolveResult, rejectResult) => {
    let settled = false;
    const finish = (fn, value) => { if (!settled) { settled = true; clearTimeout(timer); signal.removeEventListener('abort', onAbort); fn(value); } };
    const child = spawn(command, args, { stdio: ['ignore', 'pipe', 'ignore'], env: { PATH: process.env.PATH ?? '' } });
    const onAbort = () => { child.kill('SIGTERM'); finish(rejectResult, error('CANCELLED')); };
    const timer = setTimeout(() => { child.kill('SIGTERM'); finish(rejectResult, error('TIMEOUT')); }, seconds * 1000);
    signal.addEventListener('abort', onAbort, { once: true });
    let output = '';
    child.stdout.on('data', (chunk) => { output += chunk; });
    child.on('error', () => finish(rejectResult, error('ANALYSIS_EXECUTION_FAILED')));
    child.on('close', (code) => code === 0 ? finish(resolveResult, output) : finish(rejectResult, error('ANALYSIS_EXECUTION_FAILED')));
  });
}
function sqlLiteral(path) { return path.replaceAll("'", "''"); }
function sqlValues(output) {
  try {
    const value = JSON.parse(output);
    if (!Array.isArray(value) || value.length !== 2) reject('VALIDATION_FAILED');
    return value.map((row) => ({ window_id: row.window_id, order_count: Number(row.order_count), active_member_count: Number(row.active_member_count), repeat_purchaser_count: Number(row.repeat_purchaser_count) }));
  } catch (cause) {
    if (cause?.code === 'VALIDATION_FAILED') throw cause;
    reject('ANALYSIS_EXECUTION_FAILED');
  }
}
function pythonValues(output) {
  try {
    const value = JSON.parse(output);
    return ['baseline', 'recent'].map((window_id) => ({ window_id, ...value[window_id] }));
  } catch { reject('ANALYSIS_EXECUTION_FAILED'); }
}
function sameResult(value, expected) { return JSON.stringify(value) === JSON.stringify(expected); }

export function createDuckDbPythonLocalAnalysisExecution(config) {
  const workspaceRoot = safeRoot(config);
  return Object.freeze({
    async preflightApprovedFixture(input) {
      validPreflightInput(input);
      const source = await sourceBytes(workspaceRoot, input.source);
      return frozenIdentity(input.source, source.bytes.byteLength, source.read_at);
    },
    async profileApprovedFixture(input) {
      closed(input, ['source', 'run_id', 'confirmed_contract']);
      validRun(input.run_id, input.confirmed_contract);
      await sourceBytes(workspaceRoot, input.source, 'SOURCE_CHANGED', 'FIXTURE_MISMATCH', 'SOURCE_CHANGED');
      return { source_id: 'SRC-001', fixture_version: fixture.version, row_count: 20, columns: ['order_id', 'member_id', 'ordered_on'], date_coverage: { start_date: '2026-08-01', end_date: '2026-08-14' } };
    },
    async calculateMemberRepurchaseMetrics(input) {
      validateCall(input);
      const source = await sourceBytes(workspaceRoot, input.source, 'FIXTURE_MISMATCH', 'SOURCE_BOUNDARY_VIOLATION');
      const command = `CREATE TEMP VIEW member_orders AS SELECT * FROM read_csv_auto('${sqlLiteral(source.path)}');\n${queryBytes.toString('utf8')}`;
      const result = toResult(sqlValues(await run('duckdb', ['-json', '-c', command], input.cancellation_signal, input.deadline_seconds)));
      return { result: { ...result, calculation_kind: 'sql' }, canonical_asset: { artifact_id: 'Q-001', category: 'query', path: 'queries/Q-001.sql', media_type: 'application/sql', bytes: Buffer.from(queryBytes) } };
    },
    async validateMemberRepurchaseMetrics(input) {
      validateCall(input, true);
      const source = await sourceBytes(workspaceRoot, input.source, 'FIXTURE_MISMATCH', 'SOURCE_BOUNDARY_VIOLATION');
      const expected = toResult([{ window_id: 'baseline', order_count: 10, active_member_count: 6, repeat_purchaser_count: 4 }, { window_id: 'recent', order_count: 10, active_member_count: 9, repeat_purchaser_count: 1 }]);
      const supplied = { ...input.sql_result }; delete supplied.calculation_kind;
      if (input.sql_result?.calculation_kind !== 'sql' || !sameResult(supplied, expected)) reject('VALIDATION_FAILED');
      const result = toResult(pythonValues(await run('python3', ['-c', scriptBytes.toString('utf8'), source.path], input.cancellation_signal, input.deadline_seconds)));
      return { result: { ...result, calculation_kind: 'python_validation' }, canonical_asset: { artifact_id: 'S-001', category: 'script', path: 'scripts/S-001.py', media_type: 'text/plain', bytes: Buffer.from(scriptBytes) } };
    },
  });
}
