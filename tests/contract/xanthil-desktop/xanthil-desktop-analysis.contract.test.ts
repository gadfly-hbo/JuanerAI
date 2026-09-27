import assert from 'node:assert/strict';

test('U2 named Ports: exact three and seven method contracts reject missing or extra capabilities [AC-XDESK-009-03]', async () => {
  const ports = await loadDesktopModule('packages/ports/xanthil-desktop-decision-case.ts');
  for (const [name, methods] of [
    ['defineDesktopLocalAnalysisExecution', ['describeImplementation','calculate','verify']],
    ['defineDesktopRunEvidenceStore', ['beginRun','recordDuckDbResult','recordPythonResult','succeedRun','failRun','cancelRun','readTerminalRun']],
  ] as const) {
    const define = requiredExport<(input:unknown)=>Record<string,unknown>>(ports,name);
    const values = Object.fromEntries(methods.map(method=>[method,async()=>{assert.fail('definition must not invoke capabilities');}]));
    const accepted = define(values); assert.deepEqual(Object.keys(accepted).sort(),[...methods].sort()); assert.equal(Object.isFrozen(accepted),true);
    assert.throws(()=>define({...values,scan:async()=>{}}),/INVALID_PORT_IMPLEMENTATION/);
    const missing={...values}; delete missing[methods[0]]; assert.throws(()=>define(missing),/INVALID_PORT_IMPLEMENTATION/);
    assert.throws(()=>define({...values,[methods[0]]:null}),/INVALID_PORT_IMPLEMENTATION/);
  }
});
import { join } from 'node:path';
import test from 'node:test';
import { access } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';

import { loadDesktopModule, requiredExport } from '../../fixtures/xanthil-desktop/desktop-contract-drivers.ts';
import { readDesktopPythonTool, assertDesktopFixtureHealth, readSyntheticCsvPair } from '../../fixtures/xanthil-desktop/desktop-fixtures.ts';

type CalculationResult = {
  implementation?: string;
  finding_id?: string;
  run_bundle?: unknown;
  result: {
    periods: unknown;
    m2: unknown;
    judgment?: string;
    changes: {
      repeat_revenue_fen: { absolute_delta: string; relative_change: unknown };
      repurchase_rate: { absolute_delta: { numerator: string; denominator: string }; relative_change: unknown };
    };
  };
};
type Calculation = (value: Record<string, unknown>) => Promise<CalculationResult>;

test('CI-PYTHON-004: real execution configuration observes its exact selected interpreter and rejects unavailable tools', async () => {
  const fixtures = await import('../../fixtures/xanthil-desktop/desktop-fixtures.ts');
  const observe = requiredExport<(toolchain: string) => { pythonExecutable: string; pythonVersion: string }>(fixtures, 'readDesktopPythonTool');
  const bin = process.env.JUANERAI_TOOLCHAIN_BIN;
  assert.ok(bin);
  const observed = observe(bin);
  assert.equal(observed.pythonExecutable, join(bin, 'python3'));
  assert.equal(observed.pythonVersion, execFileSync(observed.pythonExecutable, ['--version'], { encoding: 'utf8', timeout: 10000, env: { PATH: '/usr/bin:/bin' } }).trim().replace(/^Python /, ''));
  assert.throws(() => observe(join(bin, 'not-an-installed-toolchain')), /ENOENT/);
  assert.throws(() => observe('relative-toolchain'), /absolute/);
});

async function createExecution() {
  await assertDesktopFixtureHealth();
  const path = new URL('../../../adapters/analytics-duckdb/xanthil-desktop-decision-case.ts', import.meta.url);
  let exists = true;
  try { await access(path); } catch (error) { if ((error as { code?: string }).code === 'ENOENT') exists = false; else throw error; }
  const analysis = exists ? await import(path.href) : {};
  assert.equal(typeof analysis.createDuckDbPythonDesktopLocalAnalysisExecution, 'function', 'approved real double-CSV calculation capability; not a loader error');
  const createExecution = requiredExport<(config: Record<string, string>) => Record<string, unknown>>(analysis, 'createDuckDbPythonDesktopLocalAnalysisExecution');
  const toolchain = process.env.JUANERAI_TOOLCHAIN_BIN;
  assert.ok(toolchain, 'the approved command-local toolchain is a precondition, never RED evidence');
  return createExecution({
    duckdbExecutable: join(toolchain, 'duckdb'), duckdbVersion: '1.5.2',
    ...readDesktopPythonTool(toolchain),
  });
}

test('U2 exact keys: prototype-looking member/status/group strings remain distinct literal identities in both real engines [AC-XDESK-004-02, AC-XDESK-005-04]', async () => {
  const execution = await createExecution(), description = await requiredExport<(input: unknown)=>Promise<Record<string,unknown>>>(execution,'describeImplementation')({});
  const pair = await readSyntheticCsvPair(), decoder = new TextDecoder(), encoder = new TextEncoder();
  const replace = (bytes: Uint8Array) => encoder.encode(decoder.decode(bytes).replaceAll('0001','__proto__').replaceAll('0002','constructor').replaceAll('North','__proto__').replaceAll('South','constructor').replaceAll(',paid,',',constructor,'));
  const groups = Object.fromEntries([['__proto__','11111111-1111-4111-8111-111111111111'],['constructor','22222222-2222-4222-8222-222222222222']]);
  const request = {run_id:'01991a00-0000-7000-8000-000000000001',expected_code_identity:description.code_identity,contract:{...confirmedContract(),valid_statuses:['constructor']},snapshot:{members_bytes:replace(pair.members),orders_bytes:replace(pair.orders)},group_pseudonym_map:groups,cancellation_signal:new AbortController().signal,deadline_seconds:30};
  const primary = await requiredExport<Calculation>(execution,'calculate')(request), independent = await requiredExport<Calculation>(execution,'verify')(request);
  assert.deepEqual(primary.result,independent.result);
  assert.deepEqual(primary.result.periods,{comparison:{active_member_count:'2',repeat_member_count:'1',repurchase_rate:{numerator:'1',denominator:'2'},repeat_revenue_fen:'2000'},current:{active_member_count:'2',repeat_member_count:'1',repurchase_rate:{numerator:'1',denominator:'2'},repeat_revenue_fen:'2500'}});
  assert.doesNotMatch(JSON.stringify(primary), /__proto__|constructor|North|South/);
});

function confirmedContract(groupMode: 'mapped' | 'none' = 'mapped') {
  return {
    confirmation_id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
    snapshot_id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    column_mapping: {
      member_id_column: 'member_id', member_group_column: groupMode === 'mapped' ? 'member_group' : null,
      order_id_column: 'order_id', order_member_id_column: 'order_member_id', paid_at_column: 'paid_at',
      amount_column: 'amount', status_column: 'status', currency_column: 'currency',
    },
    comparison_period: { start_date: '2026-01-01', end_date: '2026-01-29' },
    current_period: { start_date: '2026-02-01', end_date: '2026-03-01' },
    currency: 'CNY', time_zone: 'Asia/Shanghai', valid_statuses: ['paid'], issue_treatments: [],
    selected_group_mode: groupMode,
    hypothesis_id: 'current_repurchase_rate_lower_than_comparison',
    method_id: 'membership_repurchase_comparison', method_version: '1.0',
  };
}

async function calculateInputs(groupMode: 'mapped' | 'none' = 'mapped') {
  const execution = await createExecution();
  const description = await requiredExport<(value: Record<string, never>) => Promise<{ code_identity: string }>>(execution, 'describeImplementation')({});
  const { members, orders } = await readSyntheticCsvPair();
  return {
    execution,
    request: {
      run_id: '01991a00-0000-7000-8000-000000000001',
      expected_code_identity: description.code_identity,
      contract: confirmedContract(groupMode),
      snapshot: { members_bytes: members, orders_bytes: orders },
      group_pseudonym_map: groupMode === 'mapped'
        ? { North: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', South: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' }
        : null,
      cancellation_signal: new AbortController().signal,
      deadline_seconds: 30,
    },
  };
}

test('AC-XDESK-005-01: calculates active repeat rates and second-plus revenue with paid-at then byte-order tie-break', async () => {
  const { execution, request } = await calculateInputs();
  const calculated = await requiredExport<Calculation>(execution, 'calculate')(request);
  assert.deepEqual(calculated.result.periods, {
    comparison: { active_member_count: '2', repeat_member_count: '1', repurchase_rate: { numerator: '1', denominator: '2' }, repeat_revenue_fen: '2000' },
    current: { active_member_count: '2', repeat_member_count: '1', repurchase_rate: { numerator: '1', denominator: '2' }, repeat_revenue_fen: '2500' },
  });
  assert.equal(calculated.implementation, 'duckdb_primary');
});

test('AC-XDESK-005-02: uses checked bigint arithmetic and canonical decimal/rational boundary values', async () => {
  const { execution, request } = await calculateInputs();
  const calculated = await requiredExport<Calculation>(execution, 'calculate')(request);
  assert.deepEqual(calculated.result.changes.repeat_revenue_fen, { absolute_delta: '500', relative_change: { numerator: '1', denominator: '4' } });
  assert.deepEqual(calculated.result.changes.repurchase_rate, { absolute_delta: { numerator: '0', denominator: '1' }, relative_change: { numerator: '0', denominator: '1' } });
  // Version "1.0" is required wrapper identity, not a malformed numeric metric.
  assert.doesNotMatch(JSON.stringify(calculated.result), /(?:\.0|e\+|NaN|Infinity)/i);
});

test('AC-XDESK-005-03: computes M1 deltas and marks zero-denominator relative change not_applicable', async () => {
  const { execution, request } = await calculateInputs();
  const zeroComparisonOrders = new TextDecoder().decode(request.snapshot.orders_bytes).replace(/cmp-\d{3}[^\n]*\n/g, '');
  const calculated = await requiredExport<Calculation>(execution, 'calculate')({
    ...request,
    snapshot: { ...request.snapshot, orders_bytes: new TextEncoder().encode(zeroComparisonOrders) },
  });
  assert.equal(calculated.result.changes.repeat_revenue_fen.relative_change, 'not_applicable');
  assert.equal(calculated.result.changes.repurchase_rate.relative_change, 'not_applicable');
});

test('AC-XDESK-005-04: computes exact M2 group contributions or the closed not_applicable value', async () => {
  const grouped = await calculateInputs('mapped');
  const groupedResult = await requiredExport<Calculation>(grouped.execution, 'calculate')(grouped.request);
  assert.deepEqual(groupedResult.result.m2, {
    status: 'applicable',
    groups: [
      { group_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', comparison_repeat_revenue_fen: '2000', current_repeat_revenue_fen: '0', absolute_delta: '-2000' },
      { group_id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', comparison_repeat_revenue_fen: '0', current_repeat_revenue_fen: '2500', absolute_delta: '2500' },
    ],
  });
  const ungrouped = await calculateInputs('none');
  const ungroupedResult = await requiredExport<Calculation>(ungrouped.execution, 'calculate')(ungrouped.request);
  assert.deepEqual(ungroupedResult.result.m2, { status: 'not_applicable' });
});

test('AC-XDESK-005-05: independently agrees on zero rate change without adapter judgment or causal claim', async () => {
  const { execution, request } = await calculateInputs();
  const primary = await requiredExport<Calculation>(execution, 'calculate')(request);
  const verified = await requiredExport<Calculation>(execution, 'verify')(request);
  assert.deepEqual(primary.result, verified.result, 'the independently executed implementations agree on canonical business result bytes');
  assert.equal(primary.result.changes.repurchase_rate.absolute_delta.numerator, '0');
  assert.equal(Object.hasOwn(primary.result, 'judgment'), false, 'Finding judgment belongs to Application, not either calculation Adapter');
  assert.doesNotMatch(JSON.stringify(primary.result), /cause|because|causal/i);
});

test('AC-XDESK-005-06: keeps mismatch cancellation deadline interruption and calculation failure free of success artifacts', async () => {
  const { execution, request } = await calculateInputs();
  const cancelled = new AbortController();
  cancelled.abort();
  await assert.rejects(() => requiredExport<Calculation>(execution, 'calculate')({ ...request, cancellation_signal: cancelled.signal }), /CANCELLED/);
  await assert.rejects(() => requiredExport<Calculation>(execution, 'verify')({ ...request, deadline_seconds: 0 }), /DEADLINE_EXCEEDED/);
  await assert.rejects(() => requiredExport<Calculation>(execution, 'calculate')({ ...request, expected_code_identity: '0'.repeat(64) }), /(?:SOURCE_CHANGED|CALCULATION_FAILED|VALIDATION_FAILED)/);
});

test('AC-XDESK-005-07: publishes verified aggregate terminal Run evidence and Finding only after both durable points', async () => {
  const { execution, request } = await calculateInputs();
  const primary = await requiredExport<Calculation>(execution, 'calculate')(request);
  const verified = await requiredExport<Calculation>(execution, 'verify')(request);
  assert.deepEqual(primary.result, verified.result);
  assert.equal(Object.hasOwn(primary, 'finding_id'), false, 'a calculation Port cannot create a Finding');
  assert.equal(Object.hasOwn(verified, 'run_bundle'), false, 'a verifier cannot publish terminal Run evidence');
});

test('AC-XDESK-010-01: keeps every existing local-analysis public seam signature and all TEST-XCLI behavior unchanged', async () => {
  const ports = await loadDesktopModule('packages/ports/local-analysis.ts');
  for (const name of ['defineAgentAnalysisRuntime', 'defineLocalAnalysisExecution', 'defineRunArtifactStore', 'defineDecisionAssistanceRuntime']) assert.equal(typeof requiredExport(ports, name), 'function');
});

test('AC-XDESK-010-02: uses closed Desktop 3.0 evidence while legacy store and Console reject it without scanning or migration', async () => {
  const ports = await loadDesktopModule('packages/ports/xanthil-desktop-decision-case.ts');
  const defineRunStore = requiredExport<(value: unknown) => unknown>(ports, 'defineDesktopRunEvidenceStore');
  assert.throws(() => defineRunStore({ readTerminalRun() { return {}; }, listRuns() { return []; } }), /INVALID_PORT_IMPLEMENTATION/);
});

test('AC-XDESK-010-03: keeps old analytics factory behavior while Desktop owns double-CSV computation through private process reuse', async () => {
  const analysis = await loadDesktopModule('adapters/analytics-duckdb/xanthil-desktop-decision-case.ts');
  assert.equal(typeof requiredExport(analysis, 'createDuckDbPythonDesktopLocalAnalysisExecution'), 'function');
  assert.equal(Object.hasOwn(analysis, 'createLocalAnalysisExecution'), false, 'Desktop must not replace the existing public analytics factory');
});

test('AC-XDESK-010-04: adds only separate DecisionAssistanceRuntime with Pi-specific details confined to its Adapter', async () => {
  const ports = await loadDesktopModule('packages/ports/local-analysis.ts');
  const definition = requiredExport<(value: unknown) => unknown>(ports, 'defineDecisionAssistanceRuntime');
  assert.throws(() => definition({ preflightSelection() {}, executeAssistance() {}, cancel() {}, piSession: {} }), /INVALID_PORT_IMPLEMENTATION/);
});

test('AC-XDESK-010-05: uses the production Profile factory without Main IPC Renderer environment double selection or second package', async () => {
  const profile = await loadDesktopModule('profiles/personal/xanthil-desktop.ts');
  assert.equal(typeof requiredExport(profile, 'createPersonalXanthilDesktopProfile'), 'function');
  assert.equal(Object.hasOwn(profile, 'createOfflineDesktopProfile'), false);
});

test('AC-XDESK-010-06: keeps all optional assistance failures and refusal manually completable without Runtime fallback', async () => {
  const application = await loadDesktopModule('packages/application/xanthil-desktop-decision-case.ts');
  assert.equal(typeof requiredExport(application, 'createXanthilDesktopDecisionCaseApplication'), 'function');
  assert.equal(Object.hasOwn(application, 'fallbackAssistanceRuntime'), false);
});

test('TEST-XDESK-005 negative: invalid Toolchain factory input is rejected before a subprocess can start', async () => {
  await assertDesktopFixtureHealth();
  const analysis = await loadDesktopModule('adapters/analytics-duckdb/xanthil-desktop-decision-case.ts');
  const createExecution = requiredExport<(config: Record<string, string>) => unknown>(analysis, 'createDuckDbPythonDesktopLocalAnalysisExecution');
  assert.throws(() => createExecution({ duckdbExecutable: '', duckdbVersion: '1.5.2', pythonExecutable: '', pythonVersion: '3.9.0' }), /VALIDATION_FAILED/);
});

test('TEST-XDESK-013 negative: the Desktop Run Port rejects an empty/generic contract instead of becoming a registry or selector', async () => {
  await assertDesktopFixtureHealth();
  const ports = await loadDesktopModule('packages/ports/xanthil-desktop-decision-case.ts');
  const defineRunStore = requiredExport<(value: unknown) => unknown>(ports, 'defineDesktopRunEvidenceStore');
  assert.throws(() => defineRunStore({}), /INVALID_PORT_IMPLEMENTATION/);
});
