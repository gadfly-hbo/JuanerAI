import assert from 'node:assert/strict';
import test from 'node:test';
import { access } from 'node:fs/promises';

import { loadDesktopModule, requiredExport } from '../../fixtures/xanthil-desktop/desktop-contract-drivers.ts';
import { assertDesktopFixtureHealth, createSucceededDesktopRunManifest } from '../../fixtures/xanthil-desktop/desktop-fixtures.ts';
import { readSyntheticCsvPair } from '../../fixtures/xanthil-desktop/desktop-fixtures.ts';
import { membershipRepurchaseConfirmation } from '../../fixtures/xanthil-desktop/desktop-contract-drivers.ts';
import { validateXanthilDesktopRequest } from '../../../packages/contracts/xanthil-desktop-ipc.ts';
import { desktopTestIds } from '../../fixtures/xanthil-desktop/desktop-fixtures.ts';

async function currentCsvParser() {
  const path = new URL('../../../packages/product-core/xanthil-desktop-decision-case.ts', import.meta.url);
  let exists = true;
  try { await access(path); } catch (error) { if ((error as { code?: string }).code === 'ENOENT') exists = false; else throw error; }
  const module = exists ? await import(path.href) : {};
  assert.equal(typeof module.parseDesktopCsv, 'function', 'approved U2 CSV validation capability must exist; missing capability, not a loader failure');
  return module.parseDesktopCsv as (bytes: Uint8Array) => { headers: readonly string[]; rows: readonly (readonly string[])[] };
}

test('U2 preview contract: one closed read-only re-preview request preserves initial chooser and rejects raw authority [AC-XDESK-004-05, AC-XDESK-009-02]', () => {
  const base = { contract_version: '1.0', project_id: desktopTestIds.project, session_id: desktopTestIds.session, case_id: desktopTestIds.case, revision_id: desktopTestIds.revision, expected_row_version: '1' };
  const full = membershipRepurchaseConfirmation();
  const configuration = { column_mapping: full.column_mapping, comparison_period: full.comparison_period, current_period: full.current_period, currency: full.currency, time_zone: full.time_zone, valid_statuses: full.valid_statuses, selected_group_mode: full.selected_group_mode };
  const preview = { ...base, inspection_token: desktopTestIds.revisionCommand, configuration };
  assert.doesNotThrow(() => validateXanthilDesktopRequest('selectImportFiles', base));
  assert.doesNotThrow(() => validateXanthilDesktopRequest('selectImportFiles', preview));
  for (const invalid of [{ ...base, configuration }, { ...base, inspection_token: desktopTestIds.revisionCommand }, { ...preview, rows: [] }, { ...preview, path: '/outside.csv' }, { ...preview, command_id: desktopTestIds.revisionCommand }, { ...preview, configuration: { ...configuration, authority_confirmed: true } }]) assert.throws(() => validateXanthilDesktopRequest('selectImportFiles', invalid), /INVALID_REQUEST/);
});

async function scalarRules() {
  const core = await import('../../../packages/product-core/xanthil-desktop-decision-case.ts');
  assert.equal(typeof (core as Record<string, unknown>).parseDesktopFen, 'function', 'approved exact-money capability');
  assert.equal(typeof (core as Record<string, unknown>).parseDesktopPaidAt, 'function', 'approved exact-time capability');
  return core as unknown as { parseDesktopFen(value: string): bigint; parseDesktopPaidAt(value: string): { epoch_seconds: bigint; fraction: string; local_date: string } };
}

test('U2 scalar: positive exact fen accepts int64 maximum without number conversion or rounding [AC-XDESK-004-03, AC-XDESK-005-02]', async () => {
  const { parseDesktopFen: parse } = await scalarRules();
  for (const [text, expected] of [['0.01', 1n], ['001.20', 120n], ['1', 100n], ['92233720368547758.07', 9223372036854775807n]] as const) assert.equal(parse(text), expected);
  for (const value of ['', '0', '-1', '1e2', ' 1', '1 ', '1.001', 'NaN', '92233720368547758.08']) assert.throws(() => parse(value), /VALIDATION_FAILED/);
});

test('U2 scalar: exact Shanghai time rejects invalid/ambiguous local dates and preserves sub-millisecond ordering [AC-XDESK-004-03, AC-XDESK-004-04]', async () => {
  const { parseDesktopPaidAt: parse } = await scalarRules();
  const offset = parse('2026-01-01T00:00:00+08:00'), zulu = parse('2025-12-31T16:00:00Z'), local = parse('2026-01-01T00:00:00');
  assert.deepEqual(offset, { epoch_seconds: 1767196800n, fraction: '', local_date: '2026-01-01' });
  assert.deepEqual(zulu, offset); assert.deepEqual(local, offset);
  assert.equal(parse('2026-01-01T00:00:00.000000000123000+08:00').fraction, '000000000123');
  assert.equal(parse('2024-02-29T23:59:59+08:00').local_date, '2024-02-29');
  for (const value of ['2026-02-30T12:00:00+08:00', '2025-02-29T00:00:00Z', '2026-01-01T25:00:00Z', '2026-01-01T00:00:00+24:00', '2026-01-01T00:00:60Z', '1991-09-15T01:30:00', '1991-04-14T02:30:00', 'invalid']) assert.throws(() => parse(value), /VALIDATION_FAILED/, value);
});

test('U2 input: exact member references, status filters and counts never sanitize IDs [AC-XDESK-004-02, AC-XDESK-004-03, AC-XDESK-004-05]', async () => {
  const core = await import('../../../packages/product-core/xanthil-desktop-decision-case.ts') as Record<string, unknown>;
  assert.equal(typeof core.prepareDesktopData, 'function', 'approved double-CSV input validation capability');
  const prepare = core.prepareDesktopData as (bytes: { members_bytes: Uint8Array; orders_bytes: Uint8Array }, selection: unknown) => { orders: { member_id: string; period: string; amount_fen: bigint }[]; counts: Record<string, string>; reviewable_issues: { code: string; count: string }[] };
  const pair = await readSyntheticCsvPair(), bytes = { members_bytes: pair.members, orders_bytes: pair.orders }, selection = membershipRepurchaseConfirmation();
  const value = prepare(bytes, selection);
  assert.deepEqual(value.counts, { included_member_count: '2', excluded_member_count: '0', included_order_count: '7', excluded_order_count: '1' });
  assert.equal(value.orders[0].member_id, '0001'); assert.equal(value.orders[0].amount_fen, 1000n);
  assert.ok(value.reviewable_issues.some(issue => issue.code === 'excluded_status' && issue.count === '1'));
  assert.ok(value.reviewable_issues.some(issue => issue.code === 'paid_at_tie' && issue.count === '2'));
  const encoder = new TextEncoder(), decoder = new TextDecoder();
  const exact = prepare({ members_bytes: encoder.encode(decoder.decode(pair.members).replaceAll('0001', ' 0001 ')), orders_bytes: encoder.encode(decoder.decode(pair.orders).replaceAll('0001', ' 0001 ')) }, selection);
  assert.equal(exact.orders[0].member_id, ' 0001 ');
  for (const replacement of ['1', '0001 ', 'UNKNOWN']) assert.throws(() => prepare({ ...bytes, orders_bytes: encoder.encode(decoder.decode(pair.orders).replace('cmp-001,0001', 'cmp-001,' + replacement)) }, selection), /VALIDATION_FAILED/);
  assert.throws(() => prepare(bytes, { ...selection, comparison_period: { start_date: '2026-02-01', end_date: '2026-03-01' } }), /VALIDATION_FAILED/);
  assert.throws(() => prepare(bytes, { ...selection, valid_statuses: ['PAID'] }), /VALIDATION_FAILED/);
});

test('U2 CSV: preserves exact strings, BOM, CRLF and RFC4180 quoting [AC-XDESK-004-01, AC-XDESK-004-02]', async () => {
  const parse = await currentCsvParser();
  const input = new TextEncoder().encode('\ufeffid,status,note\r\n001, Paid ,"a,b"\r\n 002 ,paid,"a""b\r\nc"\r\n');
  const before = input.slice();
  assert.deepEqual(parse(input), { headers: ['id', 'status', 'note'], rows: [['001', ' Paid ', 'a,b'], [' 002 ', 'paid', 'a"b\r\nc']] });
  assert.deepEqual(input, before);
  assert.deepEqual(parse(new TextEncoder().encode('id,status\n0,paid')), { headers: ['id', 'status'], rows: [['0', 'paid']] });
});

test('U2 CSV: malformed encoding, quoting, headers and row width fail the whole file [AC-XDESK-004-01]', async () => {
  const parse = await currentCsvParser();
  for (const input of ['', 'id,id\n1,2', 'id,\n1,2', 'id,status\n1', 'id,status\n1,paid,extra', 'id,status\n1,"unterminated', 'id,status\n1,a"b', 'id,status\n1,"paid"x', 'id,status\r1,paid']) {
    assert.throws(() => parse(new TextEncoder().encode(input)), /VALIDATION_FAILED/, JSON.stringify(input));
  }
  for (const bytes of [[0x69, 0x64, 0x0a, 0xc0, 0xaf], [0x69, 0x64, 0x0a, 0xed, 0xa0, 0x80], [0x69, 0x64, 0x0a, 0xff]]) assert.throws(() => parse(new Uint8Array(bytes)), /VALIDATION_FAILED/);
});

async function manifestValidator() {
  await assertDesktopFixtureHealth();
  const core = await loadDesktopModule('packages/product-core/xanthil-desktop-decision-case.ts');
  return requiredExport<(value: unknown) => unknown>(core, 'validateDesktopRunManifest');
}

test('TEST-XDESK-001 positive: accepts the closed successful Desktop Run 3.0 fixture without mutating it', async () => {
  const validate = await manifestValidator();
  const candidate = await createSucceededDesktopRunManifest();
  const before = structuredClone(candidate);
  assert.doesNotThrow(() => validate(candidate));
  assert.deepEqual(candidate, before, 'the Product Core validator is pure');
});

test('TEST-XDESK-001 negative: rejects a provider/model field in deterministic local Run evidence', async () => {
  const validate = await manifestValidator();
  const manifest = await createSucceededDesktopRunManifest({ provider: 'forbidden' });
  assert.throws(() => validate(manifest), /VALIDATION_FAILED/);
});

test('TEST-XDESK-001 boundary: rejects unsafe numeric byte lengths rather than accepting JavaScript-number evidence', async () => {
  const validate = await manifestValidator();
  const manifest = await createSucceededDesktopRunManifest();
  (manifest.confirmation as { contract: { byte_length: unknown } }).contract.byte_length = Number.MAX_SAFE_INTEGER + 1;
  assert.throws(() => validate(manifest), /VALIDATION_FAILED/);
});

test('TEST-XDESK-001 lifecycle: rejects a succeeded Run that omits terminal evidence', async () => {
  const validate = await manifestValidator();
  const manifest = await createSucceededDesktopRunManifest();
  delete (manifest as Record<string, unknown>).evidence;
  assert.throws(() => validate(manifest), /VALIDATION_FAILED/);
});

test('TEST-XDESK-001 ordering: rejects swapped members/orders source order', async () => {
  const validate = await manifestValidator();
  const manifest = await createSucceededDesktopRunManifest();
  (manifest.sources as unknown[]).reverse();
  assert.throws(() => validate(manifest), /VALIDATION_FAILED/);
});

test('TEST-XDESK-002 terminal guard: rejects a cancelled Run that retains success-only artifacts', async () => {
  const validate = await manifestValidator();
  const manifest = await createSucceededDesktopRunManifest({ status: 'cancelled', terminal_detail: { reason: 'user_cancelled' } });
  delete (manifest as Record<string, unknown>).evidence;
  assert.throws(() => validate(manifest), /VALIDATION_FAILED/);
});
