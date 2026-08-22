import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

export const fixtureUrl = new URL('./member-orders-v1.csv', import.meta.url);
export const fixturePath = fileURLToPath(fixtureUrl);
export const fixtureSha256 = 'c0d1c3d2b1e8621955ab786dc87cebc14437033bda4def397498db5a1544ebb0';
export const fixtureByteSize = 530;
export const approvedProvider = 'minimax-cn';
export const approvedModelId = 'MiniMax-M3';
export const approvedModel = Object.freeze({ provider: approvedProvider, model_id: approvedModelId });
export const approvedQuestion = 'Do recent member operations show a problem?';
export const clarifiedQuestion = 'Between 2026-08-08 and 2026-08-14, did the window-local repurchase-member rate decline versus 2026-08-01 through 2026-08-07?';
export const approvedObjective = 'Compare the recent and baseline window-local repurchase-member rates using only fixture version member-orders-v1.';

type FixtureRow = Readonly<{
  order_id: string;
  member_id: string;
  ordered_on: string;
}>;

export const referenceOracle = Object.freeze({
  baseline: Object.freeze({
    window_id: 'baseline', start_date: '2026-08-01', end_date: '2026-08-07', order_count: 10,
    active_member_count: 6, repeat_purchaser_count: 4,
    repurchase_member_rate: Object.freeze({ numerator: 2, denominator: 3 }),
  }),
  recent: Object.freeze({
    window_id: 'recent', start_date: '2026-08-08', end_date: '2026-08-14', order_count: 10,
    active_member_count: 9, repeat_purchaser_count: 1,
    repurchase_member_rate: Object.freeze({ numerator: 1, denominator: 9 }),
  }),
  repurchase_member_rate_delta_pp: Object.freeze({ numerator: -500, denominator: 9 }),
  signal: Object.freeze({ comparison: 'recent_lt_baseline', status: 'supported' }),
});

export async function canonicalFixtureBytes() {
  return readFile(fixtureUrl);
}

export function sha256(bytes: Uint8Array): string {
  return createHash('sha256').update(bytes).digest('hex');
}

export function parseClosedFixture(bytes: Uint8Array): FixtureRow[] {
  const text = Buffer.from(bytes).toString('utf8');
  if (!text.endsWith('\n') || text.includes('\r')) throw new Error('fixture must use LF with one trailing LF');
  const lines = text.slice(0, -1).split('\n');
  if (lines.shift() !== 'order_id,member_id,ordered_on') throw new Error('closed header mismatch');
  if (lines.length !== 20) throw new Error('closed row count mismatch');
  const seen = new Set();
  return lines.map((line) => {
    const values = line.split(',');
    if (values.length !== 3) throw new Error('closed column count mismatch');
    const [order_id, member_id, ordered_on] = values;
    if (!/^ORD-\d{3}$/.test(order_id) || seen.has(order_id)) throw new Error('invalid order identity');
    if (!/^M-\d{3}$/.test(member_id)) throw new Error('invalid member identity');
    if (!/^2026-08-(0[1-9]|1[0-4])$/.test(ordered_on)) throw new Error('invalid business date');
    seen.add(order_id);
    return { order_id, member_id, ordered_on };
  });
}

export function metricFor(rows: readonly FixtureRow[], windowId: string, startDate: string, endDate: string) {
  const orderIds = new Set<string>();
  const memberOrders = new Map<string, Set<string>>();
  for (const row of rows) {
    if (row.ordered_on < startDate || row.ordered_on > endDate) continue;
    orderIds.add(row.order_id);
    const ids = memberOrders.get(row.member_id) ?? new Set();
    ids.add(row.order_id);
    memberOrders.set(row.member_id, ids);
  }
  const active_member_count = memberOrders.size;
  if (active_member_count === 0) throw new Error('zero denominator');
  const repeat_purchaser_count = [...memberOrders.values()].filter((ids) => ids.size >= 2).length;
  const gcd = (a: number, b: number): number => b === 0 ? Math.abs(a) : gcd(b, a % b);
  const divisor = gcd(repeat_purchaser_count, active_member_count);
  return {
    window_id: windowId,
    start_date: startDate,
    end_date: endDate,
    order_count: orderIds.size,
    active_member_count,
    repeat_purchaser_count,
    repurchase_member_rate: {
      numerator: repeat_purchaser_count / divisor,
      denominator: active_member_count / divisor,
    },
  };
}

export function calculateFixtureOracle(rows: readonly FixtureRow[]) {
  const baseline = metricFor(rows, 'baseline', referenceOracle.baseline.start_date, referenceOracle.baseline.end_date);
  const recent = metricFor(rows, 'recent', referenceOracle.recent.start_date, referenceOracle.recent.end_date);
  const gcd = (a: number, b: number): number => b === 0 ? Math.abs(a) : gcd(b, a % b);
  const rawDeltaNumerator = 100 * (
    recent.repurchase_member_rate.numerator * baseline.repurchase_member_rate.denominator
    - baseline.repurchase_member_rate.numerator * recent.repurchase_member_rate.denominator
  );
  const rawDeltaDenominator = recent.repurchase_member_rate.denominator * baseline.repurchase_member_rate.denominator;
  const deltaDivisor = gcd(rawDeltaNumerator, rawDeltaDenominator);
  const comparison = (
    recent.repurchase_member_rate.numerator * baseline.repurchase_member_rate.denominator
    - baseline.repurchase_member_rate.numerator * recent.repurchase_member_rate.denominator
  );
  return {
    baseline,
    recent,
    repurchase_member_rate_delta_pp: {
      numerator: rawDeltaNumerator / deltaDivisor,
      denominator: rawDeltaDenominator / deltaDivisor,
    },
    signal: {
      comparison: 'recent_lt_baseline',
      status: comparison < 0 ? 'supported' : 'contradicted',
    },
  };
}

export function expectedAnalysisInput() {
  return {
    question: approvedQuestion,
    model: { ...approvedModel },
    fixture: { version: 'member-orders-v1', kind: 'csv', sha256: fixtureSha256, path: 'member-orders-v1.csv' },
    windows: [
      { window_id: 'baseline', start_date: '2026-08-01', end_date: '2026-08-07' },
      { window_id: 'recent', start_date: '2026-08-08', end_date: '2026-08-14' },
    ],
  };
}

export function expectedAnalysisProposal() {
  return {
    schema_version: '1.0',
    original_question: approvedQuestion,
    question: clarifiedQuestion,
    objective: approvedObjective,
    source_ids: ['SRC-001'],
    fixture: {
      source_id: 'SRC-001',
      version: 'member-orders-v1',
      kind: 'csv',
      path: 'member-orders-v1.csv',
      sha256: fixtureSha256,
      byte_size: fixtureByteSize,
      columns: ['order_id', 'member_id', 'ordered_on'],
      date_coverage: { start_date: '2026-08-01', end_date: '2026-08-14' },
    },
    time_windows: [
      { window_id: 'baseline', start_date: '2026-08-01', end_date: '2026-08-07' },
      { window_id: 'recent', start_date: '2026-08-08', end_date: '2026-08-14' },
    ],
    metrics: [
      { metric_id: 'order_count', display_name: 'Order count', definition: 'count(distinct order_id)', grain: 'synthetic_order', population: 'orders_in_the_applicable_window', unit: 'orders' },
      { metric_id: 'active_member_count', display_name: 'Active-member count', definition: 'count(distinct member_id with at least one distinct order in the window)', grain: 'synthetic_order', population: 'members_with_orders_in_the_applicable_window', unit: 'members' },
      { metric_id: 'repeat_purchaser_count', display_name: 'Repeat-purchaser count', definition: 'count(distinct member_id with at least two distinct orders in the window)', grain: 'synthetic_order', population: 'members_with_orders_in_the_applicable_window', unit: 'members' },
      { metric_id: 'repurchase_member_rate', display_name: 'Repurchase-member rate', definition: 'repeat_purchaser_count / active_member_count', grain: 'synthetic_order', population: 'members_with_orders_in_the_applicable_window', unit: 'ratio' },
      { metric_id: 'repurchase_member_rate_delta_pp', display_name: 'Repurchase-member rate delta', definition: '(recent repurchase_member_rate - baseline repurchase_member_rate) * 100', grain: 'synthetic_order', population: 'members_with_orders_in_the_applicable_window', unit: 'percentage_points' },
    ],
    signal_rule: { comparison: 'recent_repurchase_member_rate_lt_baseline', supported_status: 'supported' },
    output_requirements: {
      finding: true,
      evidence: true,
      summary: true,
      canonical_sql: true,
      canonical_python_validation: true,
      structured_outputs: ['O-001', 'O-002'],
    },
    constraints: {
      synthetic_fixture_only: true,
      raw_row_model_egress: false,
      approved_tools_only: ['profile_approved_fixture', 'calculate_member_repurchase_metrics', 'validate_member_repurchase_metrics'],
      network_tools: false,
      generic_code_or_filesystem: false,
      decision_recommendation_or_action: false,
    },
  };
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}

export function expectedDiscoveryContext() {
  const proposal = expectedAnalysisProposal();
  return deepFreeze({
    protocol: { schema_version: '1.0', response_kind: 'analysis_proposal' },
    source: proposal.fixture,
    comparison: {
      original_question: proposal.original_question,
      question: proposal.question,
      objective: proposal.objective,
      time_windows: proposal.time_windows,
      metrics: proposal.metrics,
      signal_rule: proposal.signal_rule,
    },
    delivery: {
      output_requirements: proposal.output_requirements,
      constraints: proposal.constraints,
      proposal_field_order: [
        'schema_version', 'original_question', 'question', 'objective', 'source_ids', 'fixture',
        'time_windows', 'metrics', 'signal_rule', 'output_requirements', 'constraints',
      ],
    },
  });
}

export function expectedFindingContext() {
  const finding = expectedFindingProposal();
  return deepFreeze({
    protocol: { schema_version: '1.0', response_kind: 'finding_envelope' },
    identity: { finding_id: finding.finding_id, evidence_ids: finding.evidence_ids },
    interpretation: {
      statement: finding.statement,
      required_status: finding.status,
      required_limitations: finding.limitations,
      prohibited_categories: [
        'causal', 'statistical_significance', 'member_harm', 'recommendation', 'action', 'decision', 'prescriptive', 'real_world',
      ],
    },
  });
}

export function expectedConfirmedContract(run_id: string, confirmed_at: string) {
  const proposal = expectedAnalysisProposal();
  return {
    schema_version: proposal.schema_version,
    run_id,
    confirmed_at,
    original_question: proposal.original_question,
    question: proposal.question,
    objective: proposal.objective,
    source_ids: proposal.source_ids,
    time_windows: proposal.time_windows,
    metrics: proposal.metrics,
    signal_rule: proposal.signal_rule,
    output_requirements: proposal.output_requirements,
    constraints: proposal.constraints,
  };
}

export function expectedFindingProposal() {
  return {
    finding_id: 'F-001',
    statement: 'The window-local repurchase-member rate declined in this synthetic fixture.',
    status: 'supported',
    evidence_ids: ['E-001'],
    limitations: ['tiny and synthetic', 'window-local', 'no causal or business-impact claim'],
  };
}
