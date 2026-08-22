import { createHash } from 'node:crypto';

export type PlainRecord = Record<string, unknown>;
export type FixtureBytes = Uint8Array;
export type TimeWindow = Readonly<{ window_id: string; start_date: string; end_date: string }>;
export type Rational = Readonly<{ numerator: number; denominator: number }>;
export type MemberMetric = Readonly<{
  window_id: string;
  start_date: string;
  end_date: string;
  order_count: number;
  active_member_count: number;
  repeat_purchaser_count: number;
  repurchase_member_rate: Rational;
}>;
export type MemberRepurchaseMetrics = Readonly<{
  baseline: MemberMetric;
  recent: MemberMetric;
  repurchase_member_rate_delta_pp: Rational;
  signal: Readonly<{ comparison: string; status: string }>;
}>;
export type Finding = Readonly<{
  finding_id: string;
  status: string;
  statement: string;
  evidence_ids: readonly string[];
  limitations: readonly string[];
}>;
export type SourceDescriptor = Readonly<{
  source_id: string;
  kind: string;
  path: string;
  sha256: string;
  byte_size: number;
  read_at: string;
  fixture_version: string;
}>;
export type ArtifactDescriptor = Readonly<{
  artifact_id: string;
  category: string;
  path: string;
  media_type: string;
  byte_size: number;
  sha256: string;
}>;
export type RunManifest = PlainRecord & {
  schema_version: string;
  run_id: string;
  analysis_kind: string;
  status: string;
  started_at: string;
  product?: PlainRecord;
  runtime: PlainRecord;
  adapter?: PlainRecord;
  profile?: PlainRecord;
  model: PlainRecord;
  contract: PlainRecord;
  sources: SourceDescriptor[];
  artifacts: ArtifactDescriptor[];
  ended_at?: string;
  evidence?: PlainRecord;
  terminal_detail?: PlainRecord;
};
export type LegacyRunManifest = PlainRecord & {
  schema_version: '1.0';
  run_id: string;
  analysis_kind: string;
  status: 'succeeded' | 'failed' | 'cancelled';
  started_at: string;
  runtime: PlainRecord;
  model: PlainRecord;
  contract: PlainRecord;
  sources: SourceDescriptor[];
  artifacts: ArtifactDescriptor[];
  ended_at: string;
  evidence?: PlainRecord;
  terminal_detail?: PlainRecord;
};
export type ReadableTerminalRunManifest = RunManifest | LegacyRunManifest;
export type AnalysisProposal = PlainRecord & {
  schema_version: string;
  original_question: string;
  question: string;
  objective: string;
  source_ids: string[];
  fixture: PlainRecord;
  time_windows: PlainRecord[];
  metrics: PlainRecord[];
  signal_rule: PlainRecord;
  output_requirements: PlainRecord;
  constraints: PlainRecord;
};

const fixtureSha256 = 'c0d1c3d2b1e8621955ab786dc87cebc14437033bda4def397498db5a1544ebb0';
const fixtureByteSize = 530;
const canonicalSource = Object.freeze({
  source_id: 'SRC-001', kind: 'csv', path: 'member-orders-v1.csv',
  sha256: fixtureSha256, byte_size: fixtureByteSize, fixture_version: 'member-orders-v1',
});
const baselineWindow = Object.freeze({ window_id: 'baseline', start_date: '2026-08-01', end_date: '2026-08-07' });
const recentWindow = Object.freeze({ window_id: 'recent', start_date: '2026-08-08', end_date: '2026-08-14' });
const proposalMetricDefinitions = Object.freeze([
  Object.freeze({ metric_id: 'order_count', display_name: 'Order count', definition: 'count(distinct order_id)', grain: 'synthetic_order', population: 'orders_in_the_applicable_window', unit: 'orders' }),
  Object.freeze({ metric_id: 'active_member_count', display_name: 'Active-member count', definition: 'count(distinct member_id with at least one distinct order in the window)', grain: 'synthetic_order', population: 'members_with_orders_in_the_applicable_window', unit: 'members' }),
  Object.freeze({ metric_id: 'repeat_purchaser_count', display_name: 'Repeat-purchaser count', definition: 'count(distinct member_id with at least two distinct orders in the window)', grain: 'synthetic_order', population: 'members_with_orders_in_the_applicable_window', unit: 'members' }),
  Object.freeze({ metric_id: 'repurchase_member_rate', display_name: 'Repurchase-member rate', definition: 'repeat_purchaser_count / active_member_count', grain: 'synthetic_order', population: 'members_with_orders_in_the_applicable_window', unit: 'ratio' }),
  Object.freeze({ metric_id: 'repurchase_member_rate_delta_pp', display_name: 'Repurchase-member rate delta', definition: '(recent repurchase_member_rate - baseline repurchase_member_rate) * 100', grain: 'synthetic_order', population: 'members_with_orders_in_the_applicable_window', unit: 'percentage_points' }),
]);
const proposalToolNames = Object.freeze(['profile_approved_fixture', 'calculate_member_repurchase_metrics', 'validate_member_repurchase_metrics']);
const canonicalFindingStatement = 'The window-local repurchase-member rate declined in this synthetic fixture.';
const shaPattern = /^[a-f0-9]{64}$/;
const uuidV7Pattern = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const semverPattern = /^(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)(?:-(?:(?:0|[1-9]\d*)|(?:\d*[A-Za-z-][0-9A-Za-z-]*))(?:\.(?:(?:0|[1-9]\d*)|(?:\d*[A-Za-z-][0-9A-Za-z-]*)))*)?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/;
const artifactMappings: Readonly<Record<string, Readonly<{ category: string; path: string; media_type: string }>>> = Object.freeze({
  'Q-001': Object.freeze({ category: 'query', path: 'queries/Q-001.sql', media_type: 'application/sql' }),
  'S-001': Object.freeze({ category: 'script', path: 'scripts/S-001.py', media_type: 'text/plain' }),
  'O-001': Object.freeze({ category: 'output', path: 'outputs/O-001.json', media_type: 'application/json' }),
  'O-002': Object.freeze({ category: 'output', path: 'outputs/O-002.json', media_type: 'application/json' }),
  'DOC-SUMMARY': Object.freeze({ category: 'summary', path: 'summary.md', media_type: 'text/markdown' }),
  'DOC-EVIDENCE': Object.freeze({ category: 'evidence_document', path: 'evidence.md', media_type: 'text/markdown' }),
});
const succeededArtifactIds = Object.freeze(Object.keys(artifactMappings));

function fail(code: string): never {
  throw new Error(code);
}

function isPlainObject(value: unknown): value is PlainRecord {
  return value !== null && typeof value === 'object' && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype;
}

function closedObject(value: unknown, required: readonly string[], optional: readonly string[] = []): asserts value is PlainRecord {
  if (!isPlainObject(value)) fail('VALIDATION_FAILED');
  const keys = Object.keys(value);
  const allowed = new Set([...required, ...optional]);
  if (keys.some((key) => !allowed.has(key) || value[key] === null || value[key] === undefined) || required.some((key) => !Object.hasOwn(value, key))) fail('VALIDATION_FAILED');
}

function nonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

function sha256(bytes: Uint8Array): string {
  return createHash('sha256').update(bytes).digest('hex');
}

function ensureBytes(bytes: unknown): Buffer {
  if (!(Buffer.isBuffer(bytes) || bytes instanceof Uint8Array)) fail('SOURCE_INVALID');
  return Buffer.from(bytes);
}

function validDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
}

function parseFixture(bytes: unknown): Array<{ order_id: string; member_id: string; ordered_on: string }> {
  const source = ensureBytes(bytes).toString('utf8');
  if (!source.endsWith('\n') || source.includes('\r') || source.indexOf('\0') !== -1) fail('SOURCE_INVALID');
  const lines = source.slice(0, -1).split('\n');
  if (lines.shift() !== 'order_id,member_id,ordered_on' || lines.length !== 20) fail('SOURCE_INVALID');
  const ids = new Set<string>();
  return lines.map((line) => {
    const fields = line.split(',');
    if (fields.length !== 3) fail('SOURCE_INVALID');
    const [order_id, member_id, ordered_on] = fields;
    if (!/^ORD-\d{3}$/.test(order_id) || !/^M-\d{3}$/.test(member_id) || !validDate(ordered_on) || ids.has(order_id)) fail('SOURCE_INVALID');
    ids.add(order_id);
    return { order_id, member_id, ordered_on };
  });
}

function gcd(left: number, right: number): number {
  let a = Math.abs(left);
  let b = Math.abs(right);
  while (b !== 0) [a, b] = [b, a % b];
  return a;
}

function rational(numerator: number, denominator: number): Rational {
  if (!Number.isInteger(numerator) || !Number.isInteger(denominator) || denominator <= 0) fail('VALIDATION_FAILED');
  const divisor = gcd(numerator, denominator);
  return { numerator: numerator / divisor, denominator: denominator / divisor };
}

function compareRationals(left: Rational, right: Rational): number {
  return (left.numerator * right.denominator) - (right.numerator * left.denominator);
}

function equalRational(value: unknown, expected: Rational): boolean {
  return isPlainObject(value) && value.numerator === expected.numerator && value.denominator === expected.denominator;
}

function metric(rows: ReadonlyArray<{ order_id: string; member_id: string; ordered_on: string }>, window: TimeWindow): MemberMetric {
  const memberOrders = new Map<string, Set<string>>();
  const orderIds = new Set<string>();
  for (const row of rows) {
    if (row.ordered_on < window.start_date || row.ordered_on > window.end_date) continue;
    orderIds.add(row.order_id);
    const orders = memberOrders.get(row.member_id) ?? new Set();
    orders.add(row.order_id);
    memberOrders.set(row.member_id, orders);
  }
  const active_member_count = memberOrders.size;
  if (active_member_count === 0) fail('VALIDATION_FAILED');
  const repeat_purchaser_count = [...memberOrders.values()].filter((orders) => orders.size >= 2).length;
  return {
    window_id: window.window_id,
    start_date: window.start_date,
    end_date: window.end_date,
    order_count: orderIds.size,
    active_member_count,
    repeat_purchaser_count,
    repurchase_member_rate: rational(repeat_purchaser_count, active_member_count),
  };
}

function exactWindow(value: unknown, expected: TimeWindow): boolean {
  closedObject(value, ['window_id', 'start_date', 'end_date']);
  return value.window_id === expected.window_id && value.start_date === expected.start_date && value.end_date === expected.end_date;
}

function calculateMetrics(input: unknown): MemberRepurchaseMetrics {
  closedObject(input, ['fixture_bytes', 'time_windows']);
  if (!Array.isArray(input.time_windows) || input.time_windows.length !== 2 || !exactWindow(input.time_windows[0], baselineWindow) || !exactWindow(input.time_windows[1], recentWindow)) fail('VALIDATION_FAILED');
  const bytes = ensureBytes(input.fixture_bytes);
  if (sha256(bytes) !== fixtureSha256) fail('FIXTURE_MISMATCH');
  const rows = parseFixture(bytes);
  const baseline = metric(rows, baselineWindow);
  const recent = metric(rows, recentWindow);
  const delta = rational(
    100 * ((recent.repurchase_member_rate.numerator * baseline.repurchase_member_rate.denominator) - (baseline.repurchase_member_rate.numerator * recent.repurchase_member_rate.denominator)),
    recent.repurchase_member_rate.denominator * baseline.repurchase_member_rate.denominator,
  );
  return {
    baseline,
    recent,
    repurchase_member_rate_delta_pp: delta,
    signal: { comparison: 'recent_lt_baseline', status: compareRationals(recent.repurchase_member_rate, baseline.repurchase_member_rate) < 0 ? 'supported' : 'contradicted' },
  };
}

function validateFixture(input: unknown): Readonly<Omit<SourceDescriptor, 'read_at'> & { row_count: number }> {
  closedObject(input, ['fixture_bytes', 'expected_sha256']);
  if (typeof input.expected_sha256 !== 'string' || !shaPattern.test(input.expected_sha256)) fail('FIXTURE_MISMATCH');
  const bytes = ensureBytes(input.fixture_bytes);
  if (sha256(bytes) !== input.expected_sha256 || input.expected_sha256 !== fixtureSha256) fail('FIXTURE_MISMATCH');
  const rows = parseFixture(bytes);
  return { ...canonicalSource, row_count: rows.length };
}

function validateResult(result: unknown): asserts result is MemberRepurchaseMetrics {
  closedObject(result, ['baseline', 'recent', 'repurchase_member_rate_delta_pp', 'signal']);
  const windows: ReadonlyArray<readonly ['baseline' | 'recent', TimeWindow]> = [['baseline', baselineWindow], ['recent', recentWindow]];
  for (const [key, expected] of windows) {
    const metricValue = result[key];
    closedObject(metricValue, ['window_id', 'start_date', 'end_date', 'order_count', 'active_member_count', 'repeat_purchaser_count', 'repurchase_member_rate']);
    if (metricValue.window_id !== expected.window_id || metricValue.start_date !== expected.start_date || metricValue.end_date !== expected.end_date || typeof metricValue.order_count !== 'number' || !Number.isInteger(metricValue.order_count) || metricValue.order_count < 0 || typeof metricValue.active_member_count !== 'number' || !Number.isInteger(metricValue.active_member_count) || metricValue.active_member_count <= 0 || typeof metricValue.repeat_purchaser_count !== 'number' || !Number.isInteger(metricValue.repeat_purchaser_count) || metricValue.repeat_purchaser_count < 0 || metricValue.order_count < metricValue.active_member_count || metricValue.repeat_purchaser_count > metricValue.active_member_count) fail('VALIDATION_FAILED');
    const rate = metricValue.repurchase_member_rate;
    if (!isPlainObject(rate) || typeof rate.numerator !== 'number' || !Number.isInteger(rate.numerator) || typeof rate.denominator !== 'number' || !Number.isInteger(rate.denominator) || rate.denominator <= 0 || gcd(rate.numerator, rate.denominator) !== 1 || !equalRational(rate, rational(metricValue.repeat_purchaser_count, metricValue.active_member_count))) fail('VALIDATION_FAILED');
  }
  const delta = result.repurchase_member_rate_delta_pp;
  if (!isPlainObject(delta) || typeof delta.numerator !== 'number' || !Number.isInteger(delta.numerator) || typeof delta.denominator !== 'number' || !Number.isInteger(delta.denominator) || delta.denominator <= 0 || gcd(delta.numerator, delta.denominator) !== 1) fail('VALIDATION_FAILED');
  if (!isMemberMetric(result.baseline) || !isMemberMetric(result.recent)) fail('VALIDATION_FAILED');
  const expectedDelta = rational(
    100 * ((result.recent.repurchase_member_rate.numerator * result.baseline.repurchase_member_rate.denominator) - (result.baseline.repurchase_member_rate.numerator * result.recent.repurchase_member_rate.denominator)),
    result.recent.repurchase_member_rate.denominator * result.baseline.repurchase_member_rate.denominator,
  );
  if (!equalRational(delta, expectedDelta)) fail('VALIDATION_FAILED');
  closedObject(result.signal, ['comparison', 'status']);
  const expectedStatus = compareRationals(result.recent.repurchase_member_rate, result.baseline.repurchase_member_rate) < 0 ? 'supported' : 'contradicted';
  if (result.signal.comparison !== 'recent_lt_baseline' || result.signal.status !== expectedStatus) fail('VALIDATION_FAILED');
}

function isMemberMetric(value: unknown): value is MemberMetric {
  return isPlainObject(value) && typeof value.window_id === 'string' && typeof value.start_date === 'string'
    && typeof value.end_date === 'string' && typeof value.order_count === 'number'
    && typeof value.active_member_count === 'number' && typeof value.repeat_purchaser_count === 'number'
    && isPlainObject(value.repurchase_member_rate) && typeof value.repurchase_member_rate.numerator === 'number'
    && typeof value.repurchase_member_rate.denominator === 'number';
}

function validateFinding(input: unknown): Finding {
  closedObject(input, ['finding', 'result']);
  validateResult(input.result);
  const finding = input.finding;
  closedObject(finding, ['finding_id', 'status', 'statement', 'evidence_ids', 'limitations']);
  if (finding.finding_id !== 'F-001' || finding.status !== 'supported' || finding.statement !== canonicalFindingStatement || !Array.isArray(finding.evidence_ids) || finding.evidence_ids.length === 0 || new Set(finding.evidence_ids).size !== finding.evidence_ids.length || finding.evidence_ids.some((id) => !/^E-\d{3}$/.test(id)) || !Array.isArray(finding.limitations) || finding.limitations.length < 3 || finding.limitations.some((value) => !nonEmptyString(value))) fail('VALIDATION_FAILED');
  const limitationText = finding.limitations.join(' ').toLowerCase();
  if (!limitationText.includes('tiny') || !limitationText.includes('synthetic') || !limitationText.includes('window-local') || !limitationText.includes('no causal') || !limitationText.includes('business-impact')) fail('VALIDATION_FAILED');
  const forbidden = /caused|statistically significant|harmed|recommendation|\baction\b|decision|prescrib|real-world/i;
  if (forbidden.test(finding.statement)) fail('VALIDATION_FAILED');
  const { baseline, recent, signal } = input.result;
  if (recent.active_member_count === 0 || baseline.active_member_count === 0 || compareRationals(recent.repurchase_member_rate, baseline.repurchase_member_rate) >= 0 || signal.status !== 'supported') fail('VALIDATION_FAILED');
  if (!isFinding(finding)) fail('VALIDATION_FAILED');
  return finding;
}

function isFinding(value: PlainRecord): value is Finding {
  return typeof value.finding_id === 'string' && typeof value.status === 'string' && typeof value.statement === 'string'
    && Array.isArray(value.evidence_ids) && value.evidence_ids.every((entry) => typeof entry === 'string')
    && Array.isArray(value.limitations) && value.limitations.every((entry) => typeof entry === 'string');
}

function validTimestamp(value: unknown): value is string {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString() === value;
}

function validateSource(source: unknown): asserts source is SourceDescriptor {
  closedObject(source, ['source_id', 'kind', 'path', 'sha256', 'byte_size', 'read_at', 'fixture_version']);
  if (source.source_id !== canonicalSource.source_id || source.kind !== canonicalSource.kind || source.path !== canonicalSource.path || source.sha256 !== canonicalSource.sha256 || source.byte_size !== canonicalSource.byte_size || !validTimestamp(source.read_at) || source.fixture_version !== canonicalSource.fixture_version) fail('VALIDATION_FAILED');
}

function validateArtifactDescriptor(artifact: unknown): asserts artifact is ArtifactDescriptor {
  closedObject(artifact, ['artifact_id', 'category', 'path', 'media_type', 'byte_size', 'sha256']);
  if (!nonEmptyString(artifact.artifact_id) || !nonEmptyString(artifact.category) || !nonEmptyString(artifact.path) || !nonEmptyString(artifact.media_type) || typeof artifact.byte_size !== 'number' || !Number.isInteger(artifact.byte_size) || artifact.byte_size < 0 || !nonEmptyString(artifact.sha256) || !shaPattern.test(artifact.sha256)) fail('VALIDATION_FAILED');
  const expected = artifactMappings[artifact.artifact_id];
  if (!expected || artifact.category !== expected.category || artifact.path !== expected.path || artifact.media_type !== expected.media_type) fail('VALIDATION_FAILED');
}

function validateManifestLifecycle(run: PlainRecord): void {
  if (typeof run.run_id !== 'string' || !uuidV7Pattern.test(run.run_id) || run.analysis_kind !== 'analyst_assistant' || !validTimestamp(run.started_at) || typeof run.status !== 'string' || !['in_progress', 'succeeded', 'failed', 'cancelled'].includes(run.status)) fail('VALIDATION_FAILED');
  closedObject(run.contract, ['path', 'sha256']);
  if (run.contract.path !== 'analysis-contract.json' || typeof run.contract.sha256 !== 'string' || !shaPattern.test(run.contract.sha256) || !Array.isArray(run.sources) || run.sources.length !== 1 || !Array.isArray(run.artifacts)) fail('VALIDATION_FAILED');
  run.sources.forEach(validateSource);
  const artifactIds = new Set();
  const artifactPaths = new Set();
  for (const artifact of run.artifacts) {
    validateArtifactDescriptor(artifact);
    if (artifactIds.has(artifact.artifact_id) || artifactPaths.has(artifact.path)) fail('VALIDATION_FAILED');
    artifactIds.add(artifact.artifact_id);
    artifactPaths.add(artifact.path);
  }
  if (run.status === 'succeeded' && (run.artifacts.length !== succeededArtifactIds.length || run.artifacts.some((artifact, index) => artifact.artifact_id !== succeededArtifactIds[index]))) fail('VALIDATION_FAILED');
  const terminal = ['ended_at', 'evidence', 'terminal_detail'];
  if (run.status === 'in_progress') {
    if (terminal.some((field) => Object.hasOwn(run, field))) fail('VALIDATION_FAILED');
  } else {
    if (!Object.hasOwn(run, 'ended_at') || !validTimestamp(run.ended_at) || Date.parse(run.ended_at) < Date.parse(run.started_at)) fail('VALIDATION_FAILED');
    if (run.status === 'succeeded') {
      if (Object.hasOwn(run, 'terminal_detail') || !isPlainObject(run.evidence)) fail('VALIDATION_FAILED');
      closedObject(run.evidence, ['path', 'sha256']);
      if (run.evidence.path !== 'evidence.json' || typeof run.evidence.sha256 !== 'string' || !shaPattern.test(run.evidence.sha256)) fail('VALIDATION_FAILED');
    } else {
      if (Object.hasOwn(run, 'evidence') || !isPlainObject(run.terminal_detail)) fail('VALIDATION_FAILED');
      const required = run.status === 'failed' ? ['stage', 'error_code'] : ['stage'];
      closedObject(run.terminal_detail, required, ['message']);
      if (!validStage(run.terminal_detail.stage) || (run.status === 'failed' && !validErrorCode(run.terminal_detail.error_code)) || (run.status === 'cancelled' && Object.hasOwn(run.terminal_detail, 'error_code')) || (Object.hasOwn(run.terminal_detail, 'message') && !nonEmptyString(run.terminal_detail.message))) fail('VALIDATION_FAILED');
    }
  }
}

function validateCurrentProvenance(run: PlainRecord): void {
  for (const node of ['product', 'runtime', 'adapter'] as const) {
    closedObject(run[node], ['id', 'version']);
    if (!nonEmptyString(run[node].id) || typeof run[node].version !== 'string' || !semverPattern.test(run[node].version)) fail('VALIDATION_FAILED');
  }
  closedObject(run.profile, ['id']);
  if (!nonEmptyString(run.profile.id)) fail('VALIDATION_FAILED');
  closedObject(run.model, ['provider', 'model_id']);
  if (!nonEmptyString(run.model.provider) || !nonEmptyString(run.model.model_id)) fail('VALIDATION_FAILED');
}

function validateLegacyProvenance(run: PlainRecord): void {
  closedObject(run.runtime, ['xanthil_version', 'pi_adapter_version', 'pi_version']);
  if (![run.runtime.xanthil_version, run.runtime.pi_adapter_version, run.runtime.pi_version].every((version) => typeof version === 'string' && semverPattern.test(version))) fail('VALIDATION_FAILED');
  closedObject(run.model, ['provider', 'model_id'], ['thinking_level']);
  if (!nonEmptyString(run.model.provider) || !nonEmptyString(run.model.model_id) || (Object.hasOwn(run.model, 'thinking_level') && !nonEmptyString(run.model.thinking_level))) fail('VALIDATION_FAILED');
}

function validateRunManifest(run: unknown): RunManifest {
  const common = ['schema_version', 'run_id', 'analysis_kind', 'status', 'started_at', 'product', 'runtime', 'adapter', 'profile', 'model', 'contract', 'sources', 'artifacts'];
  const terminal = ['ended_at', 'evidence', 'terminal_detail'];
  closedObject(run, common, terminal);
  if (run.schema_version !== '2.0') fail('CONTRACT_VERSION_UNSUPPORTED');
  validateCurrentProvenance(run);
  validateManifestLifecycle(run);
  if (!isRunManifest(run)) fail('VALIDATION_FAILED');
  return run;
}

function validateReadableTerminalRunManifest(run: unknown): ReadableTerminalRunManifest {
  if (!isPlainObject(run)) fail('VALIDATION_FAILED');
  if (run.schema_version === '2.0') {
    const current = validateRunManifest(run);
    if (current.status === 'in_progress') fail('VALIDATION_FAILED');
    return current;
  }
  if (run.schema_version !== '1.0') fail('CONTRACT_VERSION_UNSUPPORTED');
  const common = ['schema_version', 'run_id', 'analysis_kind', 'status', 'started_at', 'runtime', 'model', 'contract', 'sources', 'artifacts'];
  const terminal = ['ended_at', 'evidence', 'terminal_detail'];
  closedObject(run, common, terminal);
  validateLegacyProvenance(run);
  validateManifestLifecycle(run);
  if (typeof run.status !== 'string' || !['succeeded', 'failed', 'cancelled'].includes(run.status)) fail('VALIDATION_FAILED');
  return run as LegacyRunManifest;
}

function isRunManifest(value: PlainRecord): value is RunManifest {
  return typeof value.schema_version === 'string' && typeof value.run_id === 'string'
    && typeof value.analysis_kind === 'string' && typeof value.status === 'string' && typeof value.started_at === 'string'
    && isPlainObject(value.product) && isPlainObject(value.runtime) && isPlainObject(value.adapter) && isPlainObject(value.profile) && isPlainObject(value.model) && isPlainObject(value.contract)
    && Array.isArray(value.sources) && value.sources.every(isSourceDescriptor)
    && Array.isArray(value.artifacts) && value.artifacts.every(isArtifactDescriptor);
}

function isSourceDescriptor(value: unknown): value is SourceDescriptor {
  return isPlainObject(value) && typeof value.source_id === 'string' && typeof value.kind === 'string'
    && typeof value.path === 'string' && typeof value.sha256 === 'string' && typeof value.byte_size === 'number'
    && typeof value.read_at === 'string' && typeof value.fixture_version === 'string';
}

function isArtifactDescriptor(value: unknown): value is ArtifactDescriptor {
  return isPlainObject(value) && typeof value.artifact_id === 'string' && typeof value.category === 'string'
    && typeof value.path === 'string' && typeof value.media_type === 'string' && typeof value.byte_size === 'number'
    && typeof value.sha256 === 'string';
}

function validStage(value: unknown): value is string {
  return typeof value === 'string' && ['contract_persist', 'runtime', 'source_read', 'analysis_sql', 'analysis_python', 'validation', 'artifact_finalize', 'execution'].includes(value);
}

function validErrorCode(value: unknown): value is string {
  return typeof value === 'string' && ['ARTIFACT_WRITE_FAILED', 'SOURCE_CHANGED', 'SOURCE_BOUNDARY_VIOLATION', 'SOURCE_INVALID', 'MODEL_EXECUTION_FAILED', 'TOOL_POLICY_VIOLATION', 'ANALYSIS_EXECUTION_FAILED', 'VALIDATION_FAILED', 'TIMEOUT', 'CONTRACT_VERSION_UNSUPPORTED', 'INTERNAL_ERROR'].includes(value);
}

function validateEvidenceIndex(input: unknown): PlainRecord {
  closedObject(input, ['evidence', 'catalog']);
  const { evidence, catalog } = input;
  closedObject(evidence, ['schema_version', 'run_id', 'findings', 'evidence_items']);
  if (evidence.schema_version !== '1.0') fail('CONTRACT_VERSION_UNSUPPORTED');
  if (typeof evidence.run_id !== 'string' || !uuidV7Pattern.test(evidence.run_id) || !Array.isArray(evidence.findings) || evidence.findings.length === 0 || !Array.isArray(evidence.evidence_items) || evidence.evidence_items.length === 0) fail('VALIDATION_FAILED');
  closedObject(catalog, ['sources', 'artifacts']);
  if (!Array.isArray(catalog.sources) || !Array.isArray(catalog.artifacts)) fail('VALIDATION_FAILED');
  const sourceIds = new Set<string>();
  for (const source of catalog.sources) {
    closedObject(source, ['source_id', 'sha256']);
    if (typeof source.source_id !== 'string' || !/^SRC-\d{3}$/.test(source.source_id) || typeof source.sha256 !== 'string' || !shaPattern.test(source.sha256) || sourceIds.has(source.source_id)) fail('VALIDATION_FAILED');
    sourceIds.add(source.source_id);
  }
  const artifactIds = new Set<string>();
  for (const artifact of catalog.artifacts) {
    closedObject(artifact, ['artifact_id', 'sha256', 'observed_sha256']);
    if (typeof artifact.artifact_id !== 'string' || !/^(Q|S|O)-\d{3}$/.test(artifact.artifact_id) || typeof artifact.sha256 !== 'string' || !shaPattern.test(artifact.sha256) || typeof artifact.observed_sha256 !== 'string' || !shaPattern.test(artifact.observed_sha256) || artifact.sha256 !== artifact.observed_sha256 || artifactIds.has(artifact.artifact_id)) fail('VALIDATION_FAILED');
    artifactIds.add(artifact.artifact_id);
  }
  const evidenceIds = new Set<string>();
  for (const item of evidence.evidence_items) {
    closedObject(item, ['evidence_id', 'description', 'source_ids', 'artifact_ids'], ['result_reference']);
    if (typeof item.evidence_id !== 'string' || !/^E-\d{3}$/.test(item.evidence_id) || evidenceIds.has(item.evidence_id) || !nonEmptyString(item.description) || !uniqueReferences(item.source_ids, sourceIds, /^SRC-\d{3}$/) || !uniqueReferences(item.artifact_ids, artifactIds, /^(Q|S|O)-\d{3}$/)) fail('VALIDATION_FAILED');
    if (Object.hasOwn(item, 'result_reference')) {
      closedObject(item.result_reference, ['artifact_id', 'json_pointer']);
      if (!Array.isArray(item.artifact_ids) || typeof item.result_reference.artifact_id !== 'string' || !item.artifact_ids.includes(item.result_reference.artifact_id) || !/^O-\d{3}$/.test(item.result_reference.artifact_id) || typeof item.result_reference.json_pointer !== 'string' || !/^(?:\/(?:[^~/]|~[01])*)*$/.test(item.result_reference.json_pointer)) fail('VALIDATION_FAILED');
    }
    evidenceIds.add(item.evidence_id);
  }
  const findingIds = new Set<string>();
  for (const finding of evidence.findings) {
    closedObject(finding, ['finding_id', 'status', 'statement', 'evidence_ids', 'limitations']);
    if (typeof finding.finding_id !== 'string' || !/^F-\d{3}$/.test(finding.finding_id) || findingIds.has(finding.finding_id) || typeof finding.status !== 'string' || !['supported', 'contradicted', 'inconclusive'].includes(finding.status) || !nonEmptyString(finding.statement) || !Array.isArray(finding.limitations) || finding.limitations.length === 0 || finding.limitations.some((value) => !nonEmptyString(value)) || !Array.isArray(finding.evidence_ids)) fail('VALIDATION_FAILED');
    if ((finding.status === 'supported' || finding.status === 'contradicted') && !uniqueReferences(finding.evidence_ids, evidenceIds, /^E-\d{3}$/)) fail('VALIDATION_FAILED');
    if (finding.status === 'inconclusive' && (finding.evidence_ids.length !== 0 || !finding.limitations.join(' ').toLowerCase().includes('no probative evidence'))) fail('VALIDATION_FAILED');
    findingIds.add(finding.finding_id);
  }
  return evidence;
}

function uniqueReferences(values: unknown, available: ReadonlySet<string>, pattern: RegExp): boolean {
  return Array.isArray(values) && values.length > 0 && new Set(values).size === values.length && values.every((value) => typeof value === 'string' && pattern.test(value) && available.has(value));
}

function enforceSecurityBoundary(request: unknown): { accepted: true } {
  if (!isPlainObject(request) || !nonEmptyString(request.tool_name)) fail('TOOL_POLICY_VIOLATION');
  const allowed = request.tool_name === 'profile_approved_fixture'
    ? ['tool_name', 'source_path']
    : ['calculate_member_repurchase_metrics', 'validate_member_repurchase_metrics'].includes(request.tool_name)
      ? ['tool_name'] : null;
  if (!allowed || Object.keys(request).some((key) => !allowed.includes(key))) fail('TOOL_POLICY_VIOLATION');
  if (request.tool_name === 'profile_approved_fixture' && request.source_path !== canonicalSource.path) fail('SOURCE_BOUNDARY_VIOLATION');
  return { accepted: true };
}

function validateTerminalOutcome(input: unknown): PlainRecord {
  closedObject(input, ['status', 'stage'], ['error_code', 'attempt_deadline_seconds', 'call_deadline_seconds']);
  if (typeof input.status !== 'string' || !['failed', 'cancelled'].includes(input.status) || !validStage(input.stage) || Object.hasOwn(input, 'retry_count')) fail('VALIDATION_FAILED');
  if (Object.hasOwn(input, 'attempt_deadline_seconds') && input.attempt_deadline_seconds !== 300 || Object.hasOwn(input, 'call_deadline_seconds') && input.call_deadline_seconds !== 30) fail('VALIDATION_FAILED');
  if (input.status === 'failed' && (!Object.hasOwn(input, 'error_code') || !validErrorCode(input.error_code))) fail('VALIDATION_FAILED');
  if (input.status === 'cancelled' && Object.hasOwn(input, 'error_code')) fail('VALIDATION_FAILED');
  return input.status === 'failed' ? { status: 'failed', stage: input.stage, error_code: input.error_code } : { status: 'cancelled', stage: input.stage };
}

function reproduceRecordedMetrics(input: unknown): MemberRepurchaseMetrics {
  closedObject(input, ['fixture_bytes', 'fixture_sha256']);
  if (input.fixture_sha256 !== fixtureSha256) fail('FIXTURE_MISMATCH');
  validateFixture({ fixture_bytes: input.fixture_bytes, expected_sha256: input.fixture_sha256 });
  return calculateMetrics({ fixture_bytes: input.fixture_bytes, time_windows: [baselineWindow, recentWindow] });
}

function validateMarkdownProjection(input: unknown): PlainRecord {
  closedObject(input, ['projection', 'result']);
  validateResult(input.result);
  closedObject(input.projection, ['summary_md', 'evidence_md']);
  const { summary_md, evidence_md } = input.projection;
  if (!nonEmptyString(summary_md) || !nonEmptyString(evidence_md)) fail('VALIDATION_FAILED');
  for (const required of ['Between 2026-08-08 and 2026-08-14, did the window-local repurchase-member rate decline versus 2026-08-01 through 2026-08-07?', '66.7%', '11.1%', '-55.6 pp', 'supported', 'tiny and synthetic; window-local; no causal or business-impact claim']) if (!summary_md.includes(required)) fail('VALIDATION_FAILED');
  if (/caused|statistically significant|harmed|recommendation|\baction\b|decision|prescrib|real-world/i.test(summary_md)) fail('VALIDATION_FAILED');
  for (const required of ['F-001', 'SRC-001', 'Q-001', 'S-001', 'O-001', 'O-002', fixtureSha256]) if (!evidence_md.includes(required)) fail('VALIDATION_FAILED');
  return input.projection;
}

function exactArray(value: unknown, expected: readonly unknown[]): boolean {
  return Array.isArray(value) && value.length === expected.length && value.every((item, index) => item === expected[index]);
}

function validateAnalysisProposal(proposal: unknown): AnalysisProposal {
  closedObject(proposal, ['schema_version', 'original_question', 'question', 'objective', 'source_ids', 'fixture', 'time_windows', 'metrics', 'signal_rule', 'output_requirements', 'constraints']);
  if (
    proposal.original_question !== 'Do recent member operations show a problem?' ||
    proposal.question !== 'Between 2026-08-08 and 2026-08-14, did the window-local repurchase-member rate decline versus 2026-08-01 through 2026-08-07?' ||
    proposal.objective !== 'Compare the recent and baseline window-local repurchase-member rates using only fixture version member-orders-v1.' ||
    !exactArray(proposal.source_ids, ['SRC-001'])
  ) fail('VALIDATION_FAILED');

  const fixture = proposal.fixture;
  closedObject(fixture, ['source_id', 'version', 'kind', 'path', 'sha256', 'byte_size', 'columns', 'date_coverage']);
  if (
    fixture.source_id !== 'SRC-001' || fixture.version !== 'member-orders-v1' || fixture.kind !== 'csv' ||
    fixture.path !== 'member-orders-v1.csv' || fixture.sha256 !== fixtureSha256 || fixture.byte_size !== fixtureByteSize ||
    !exactArray(fixture.columns, ['order_id', 'member_id', 'ordered_on'])
  ) fail('VALIDATION_FAILED');
  closedObject(fixture.date_coverage, ['start_date', 'end_date']);
  if (fixture.date_coverage.start_date !== '2026-08-01' || fixture.date_coverage.end_date !== '2026-08-14') fail('VALIDATION_FAILED');

  if (!Array.isArray(proposal.time_windows) || proposal.time_windows.length !== 2 || !exactWindow(proposal.time_windows[0], baselineWindow) || !exactWindow(proposal.time_windows[1], recentWindow)) fail('VALIDATION_FAILED');
  if (!Array.isArray(proposal.metrics) || proposal.metrics.length !== proposalMetricDefinitions.length) fail('VALIDATION_FAILED');
  for (const [index, expected] of proposalMetricDefinitions.entries()) {
    const metricDefinition = proposal.metrics[index];
    closedObject(metricDefinition, ['metric_id', 'display_name', 'definition', 'grain', 'population', 'unit']);
    for (const [key, value] of Object.entries(expected)) if (metricDefinition[key] !== value) fail('VALIDATION_FAILED');
  }

  closedObject(proposal.signal_rule, ['comparison', 'supported_status']);
  if (proposal.signal_rule.comparison !== 'recent_repurchase_member_rate_lt_baseline' || proposal.signal_rule.supported_status !== 'supported') fail('VALIDATION_FAILED');
  closedObject(proposal.output_requirements, ['finding', 'evidence', 'summary', 'canonical_sql', 'canonical_python_validation', 'structured_outputs']);
  if (
    proposal.output_requirements.finding !== true || proposal.output_requirements.evidence !== true || proposal.output_requirements.summary !== true ||
    proposal.output_requirements.canonical_sql !== true || proposal.output_requirements.canonical_python_validation !== true ||
    !exactArray(proposal.output_requirements.structured_outputs, ['O-001', 'O-002'])
  ) fail('VALIDATION_FAILED');
  closedObject(proposal.constraints, ['synthetic_fixture_only', 'raw_row_model_egress', 'approved_tools_only', 'network_tools', 'generic_code_or_filesystem', 'decision_recommendation_or_action']);
  if (
    proposal.constraints.synthetic_fixture_only !== true || proposal.constraints.raw_row_model_egress !== false ||
    !exactArray(proposal.constraints.approved_tools_only, proposalToolNames) || proposal.constraints.network_tools !== false ||
    proposal.constraints.generic_code_or_filesystem !== false || proposal.constraints.decision_recommendation_or_action !== false
  ) fail('VALIDATION_FAILED');
  if (proposal.schema_version !== '1.0') fail('CONTRACT_VERSION_UNSUPPORTED');
  if (!isAnalysisProposal(proposal)) fail('VALIDATION_FAILED');
  return proposal;
}

function isAnalysisProposal(value: PlainRecord): value is AnalysisProposal {
  return typeof value.schema_version === 'string' && typeof value.original_question === 'string'
    && typeof value.question === 'string' && typeof value.objective === 'string'
    && Array.isArray(value.source_ids) && value.source_ids.every((entry) => typeof entry === 'string')
    && isPlainObject(value.fixture) && Array.isArray(value.time_windows) && value.time_windows.every(isPlainObject)
    && Array.isArray(value.metrics) && value.metrics.every(isPlainObject) && isPlainObject(value.signal_rule)
    && isPlainObject(value.output_requirements) && isPlainObject(value.constraints);
}

export function createLocalAnalysisDomain() {
  return Object.freeze({
    validateMemberOrdersFixture: validateFixture,
    calculateMemberRepurchaseMetrics: calculateMetrics,
    validateFinding,
    validateRunManifest,
    validateReadableTerminalRunManifest,
    validateEvidenceIndex,
    enforceLocalAnalysisSecurityBoundary: enforceSecurityBoundary,
    validateTerminalOutcome,
    reproduceRecordedMetrics,
    validateMarkdownProjection,
    validateAnalysisProposal,
  });
}
