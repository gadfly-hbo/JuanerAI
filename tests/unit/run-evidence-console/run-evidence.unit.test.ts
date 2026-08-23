import assert from 'node:assert/strict';
import test from 'node:test';

import type { RunEvidenceResult } from '../../../packages/product-core/run-evidence.ts';
import { coverageMap, lifecycleLedger } from '../../fixtures/run-evidence-console/coverage-map.ts';
import { createExactRun, duplicateJsonMember, observeRun, replaceObservedBytes, replaceObservedJson, replaceObservedMetadata, runId, synchronizeManifestDescriptor } from '../../fixtures/run-evidence-console/run-evidence-fixtures.ts';

const coreUrl = new URL('../../../packages/product-core/run-evidence.ts', import.meta.url);
type VerifiedSucceededView = Extract<RunEvidenceResult, { kind: 'verified_succeeded' }>['view'];
type RunEvidenceProvenance = VerifiedSucceededView['provenance'];
// @ts-expect-error The reader result is closed to its three approved variants.
type _NoOpenResultEnvelope = RunEvidenceResult['__unapproved_reader_field'];
// @ts-expect-error Runtime projection belongs only to the neutral provenance object.
type _NoLegacyRuntime = VerifiedSucceededView['runtime'];
// @ts-expect-error Neutral provenance is exact rather than an open record.
type _NoOpenProvenance = RunEvidenceProvenance['__unapproved_provenance_field'];

test('TEST-REC-010 [AC-REC-006-01..03, AC-REC-007-03..05] freezes complete AC coverage and permanent test assets', () => {
  const expectedAcs = [
    'AC-REC-001-01', 'AC-REC-001-02', 'AC-REC-001-03', 'AC-REC-001-04',
    'AC-REC-002-01', 'AC-REC-002-02', 'AC-REC-002-03',
    'AC-REC-003-01', 'AC-REC-003-02', 'AC-REC-003-03',
    'AC-REC-004-01', 'AC-REC-004-02', 'AC-REC-004-03',
    'AC-REC-005-01', 'AC-REC-005-02', 'AC-REC-005-03', 'AC-REC-005-04',
    'AC-REC-006-01', 'AC-REC-006-02', 'AC-REC-006-03',
    'AC-REC-007-01', 'AC-REC-007-02', 'AC-REC-007-03', 'AC-REC-007-04', 'AC-REC-007-05',
  ];
  assert.deepEqual([...new Set(Object.values(coverageMap).flat())].sort(), expectedAcs.sort());
  assert.ok(coverageMap['TEST-REC-005'].includes('AC-REC-005-03'));
  assert.ok(coverageMap['TEST-REC-009'].includes('AC-REC-003-02'));
  assert.deepEqual(lifecycleLedger, [
    ['tests/unit/run-evidence-console/run-evidence.unit.test.ts', 'permanent regression', 'TEST-REC-001..003,010', 'Reader Core admission/projection'],
    ['tests/contract/run-evidence-console/run-evidence-reader.contract.test.ts', 'permanent regression', 'TEST-REC-004', 'replaceable Reader Port'],
    ['tests/integration/run-evidence-console/run-evidence-reader.integration.test.ts', 'permanent regression', 'TEST-REC-005..008,010', 'local Adapter and side-effect boundary'],
    ['tests/e2e/run-evidence-console/xanthil-console.e2e.test.ts', 'permanent regression', 'TEST-REC-009', 'loopback Experience'],
    ['tests/fixtures/run-evidence-console/run-evidence-fixtures.ts', 'permanent regression', 'TEST-REC-001,005..009', 'unit/integration/E2E fixture producer'],
    ['tests/fixtures/run-evidence-console/run-evidence-reader-contract.ts', 'permanent regression', 'TEST-REC-004', 'unchanged Port contract driver/double'],
    ['tests/fixtures/run-evidence-console/console-harness.ts', 'permanent regression', 'TEST-REC-009', 'E2E process/HTTP lifecycle'],
    ['tests/fixtures/run-evidence-console/coverage-map.ts', 'permanent regression', 'TEST-REC-001..010', 'Controller retirement/traceability consumer'],
  ]);
});

test('TEST-REC-001 [AC-REC-002-02, AC-REC-002-03] admits only exact Artifact 1.0 machine documents', async (t) => {
  const { createRunEvidenceDomain } = await import(coreUrl.href);
  const domain = createRunEvidenceDomain();
  const fixture = await createExactRun();
  const observation = await observeRun(fixture.run);
  const result = domain.admit(observation);
  assert.equal(result.kind, 'verified_succeeded');
  const cases: readonly [string, Parameters<typeof replaceObservedJson>[2], 'RUN_READ_FAILED' | 'RUN_CONTRACT_UNSUPPORTED'][] = [
    ['unknown_field', (run) => { run.unexpected = true; }, 'RUN_READ_FAILED'],
    ['null_contract_field', (run) => { run.contract = null; }, 'RUN_READ_FAILED'],
    ['run_id_mismatch', (run) => { run.run_id = '0198d943-8b71-7a11-9abc-0000000000d4'; }, 'RUN_READ_FAILED'],
  ];
  for (const [mutation, mutate, code] of cases) {
    const rejected = domain.admit(replaceObservedJson(observation, 'run.json', mutate));
    assert.equal(rejected.kind, 'rejected', mutation);
    assert.equal(rejected.error.code, code, mutation);
  }
  const invalidContract = synchronizeManifestDescriptor(replaceObservedJson(observation, 'analysis-contract.json', (contract) => { contract.unexpected = true; }), 'analysis-contract.json');
  assert.deepEqual(domain.admit(invalidContract), { kind: 'rejected', error: { code: 'RUN_READ_FAILED' } });
  const malformedContract = synchronizeManifestDescriptor(replaceObservedBytes(observation, 'analysis-contract.json', Buffer.from('{', 'utf8')), 'analysis-contract.json');
  assert.deepEqual(domain.admit(malformedContract), { kind: 'rejected', error: { code: 'RUN_READ_FAILED' } });
  const contractIdMismatch = synchronizeManifestDescriptor(replaceObservedJson(observation, 'analysis-contract.json', (contract) => { contract.run_id = '0198d943-8b71-7a11-9abc-0000000000d4'; }), 'analysis-contract.json');
  assert.deepEqual(domain.admit(contractIdMismatch), { kind: 'rejected', error: { code: 'RUN_READ_FAILED' } });
  const evidenceIdMismatch = synchronizeManifestDescriptor(replaceObservedJson(observation, 'evidence.json', (evidence) => { evidence.run_id = '0198d943-8b71-7a11-9abc-0000000000d4'; }), 'evidence.json');
  assert.deepEqual(domain.admit(evidenceIdMismatch), { kind: 'rejected', error: { code: 'RUN_READ_FAILED' } });
  for (const path of ['run.json', 'analysis-contract.json', 'evidence.json'] as const) {
    for (const [name, mutate, code] of [
      ['missing_schema_version', (document: Record<string, unknown>) => { delete document.schema_version; }, 'RUN_READ_FAILED'],
      ['null_schema_version', (document: Record<string, unknown>) => { document.schema_version = null; }, 'RUN_READ_FAILED'],
      ['number_schema_version', (document: Record<string, unknown>) => { document.schema_version = 1; }, 'RUN_READ_FAILED'],
      ['unsupported_string_schema_version', (document: Record<string, unknown>) => { document.schema_version = '1.1'; }, 'RUN_CONTRACT_UNSUPPORTED'],
    ] as const) {
      const changed = replaceObservedJson(observation, path, mutate);
      const synchronized = path === 'run.json' ? changed : synchronizeManifestDescriptor(changed, path);
      await t.test(`${path} ${name}`, () => assert.deepEqual(domain.admit(synchronized), { kind: 'rejected', error: { code } }));
    }
  }
  for (const [path, nestedPrefix] of [
    ['run.json', '"schema_version"'],
    ['run.json', '"runtime"'],
    ['analysis-contract.json', '"schema_version"'],
    ['analysis-contract.json', '"signal_rule"'],
    ['evidence.json', '"schema_version"'],
    ['evidence.json', '"finding_id"'],
  ] as const) {
    const duplicated = replaceObservedBytes(observation, path, duplicateJsonMember(observation.files[path].bytes, nestedPrefix));
    const synchronized = path === 'run.json' ? duplicated : synchronizeManifestDescriptor(duplicated, path);
    await t.test(`${path} duplicate ${nestedPrefix}`, () => assert.deepEqual(domain.admit(synchronized), { kind: 'rejected', error: { code: 'RUN_READ_FAILED' } }));
  }
  for (const path of ['run.json', 'analysis-contract.json', 'evidence.json'] as const) {
    const malformed = replaceObservedBytes(observation, path, Buffer.from([0xff]));
    const synchronized = path === 'run.json' ? malformed : synchronizeManifestDescriptor(malformed, path);
    await t.test(`${path} fatal UTF-8`, () => assert.deepEqual(domain.admit(synchronized), { kind: 'rejected', error: { code: 'RUN_READ_FAILED' } }));
  }
});

test('TEST-REC-001 [AC-REC-002-02] closes every confirmed-contract nested semantic family', async (t) => {
  const { createRunEvidenceDomain } = await import(coreUrl.href);
  const domain = createRunEvidenceDomain();
  const fixture = await createExactRun();
  const observation = await observeRun(fixture.run);
  const cases: readonly [string, Parameters<typeof replaceObservedJson>[2]][] = [
    ['confirmed_at_format', (value) => { value.confirmed_at = 'not-a-time'; }],
    ['question_semantics', (value) => { value.question = ''; }],
    ['objective_semantics', (value) => { value.objective = ''; }],
    ['source_cross_reference', (value) => { value.source_ids = ['SRC-404']; }],
    ['window_id_enum', (value) => { ((value.time_windows as Record<string, unknown>[])[0]).window_id = 'other'; }],
    ['window_date_format', (value) => { ((value.time_windows as Record<string, unknown>[])[0]).start_date = '2026/08/01'; }],
    ['five_metrics_exact', (value) => { (value.metrics as unknown[]).pop(); }],
    ['metric_definition', (value) => { ((value.metrics as Record<string, unknown>[])[0]).definition = 'invented'; }],
    ['signal_rule', (value) => { ((value.signal_rule as Record<string, unknown>)).comparison = 'other'; }],
    ['output_requirements', (value) => { delete (value.output_requirements as Record<string, unknown>).canonical_sql; }],
    ['constraints', (value) => { ((value.constraints as Record<string, unknown>)).network_tools = true; }],
  ];
  for (const [name, mutate] of cases) {
    const changed = synchronizeManifestDescriptor(replaceObservedJson(observation, 'analysis-contract.json', mutate), 'analysis-contract.json');
    await t.test(name, () => assert.deepEqual(domain.admit(changed), { kind: 'rejected', error: { code: 'RUN_READ_FAILED' } }));
  }
});

test('TEST-REC-002 [AC-REC-003-01..03] separates successful and non-success reader models', async () => {
  const { createRunEvidenceDomain } = await import(coreUrl.href);
  const domain = createRunEvidenceDomain();
  const succeeded = await createExactRun('succeeded');
  const success = domain.admit(await observeRun(succeeded.run));
  assert.equal(success.kind, 'verified_succeeded');
  assert.deepEqual(Object.keys(success).sort(), ['integrity', 'kind', 'view']);
  assert.deepEqual(Object.keys(success.view).sort(), ['assets', 'contract_version', 'evidence', 'evidence_document', 'findings', 'limitations', 'metrics', 'original_question', 'provenance', 'question', 'sources', 'summary', 'time_windows']);
  assert.equal(Object.hasOwn(success.view, 'runtime'), false, 'success view exposes no legacy Runtime object');
  assert.deepEqual(success.view.provenance, {
    recorded_product_version: '1.0.0',
    recorded_agent_runtime_version: '0.84.2',
    recorded_agent_adapter_version: '1.0.0',
    recorded_model: { provider: 'minimax-cn', model_id: 'MiniMax-M3' },
  });
  assert.deepEqual(Object.keys(success.view.provenance).sort(), ['recorded_agent_adapter_version', 'recorded_agent_runtime_version', 'recorded_model', 'recorded_product_version']);
  assert.deepEqual(Object.keys(success.view.provenance.recorded_model).sort(), ['model_id', 'provider']);
  for (const source of success.view.sources) assert.deepEqual(Object.keys(source).sort(), ['byte_size', 'fixture_version', 'kind', 'path', 'read_at', 'sha256', 'source_id']);
  for (const window of success.view.time_windows) assert.deepEqual(Object.keys(window).sort(), ['end_date', 'start_date', 'window_id']);
  for (const metric of success.view.metrics) assert.deepEqual(Object.keys(metric).sort(), ['definition', 'display_name', 'grain', 'metric_id', 'population', 'unit']);
  for (const finding of success.view.findings) assert.deepEqual(Object.keys(finding).sort(), ['evidence_ids', 'finding_id', 'limitations', 'statement', 'status']);
  for (const evidence of success.view.evidence) assert.deepEqual(Object.keys(evidence).sort(), ['artifact_ids', 'description', 'evidence_id', 'source_ids']);
  for (const asset of success.view.assets) assert.deepEqual(Object.keys(asset).sort(), ['artifact_id', 'byte_size', 'category', 'display_text', 'label', 'media_type', 'path', 'sha256']);
  for (const integrity of success.integrity) assert.deepEqual(Object.keys(integrity).sort(), ['outcome', 'path']);
  assert.ok(success.view.findings.length > 0);
  for (const missingPath of ['evidence.json', 'summary.md', 'evidence.md', 'outputs/O-002.json']) {
    const files = Object.fromEntries(Object.entries((await observeRun(succeeded.run)).files).filter(([path]) => path !== missingPath));
    const rejected = domain.admit({ run_directory_name: runId, files });
    assert.deepEqual(rejected, { kind: 'rejected', error: { code: 'RUN_READ_FAILED' } }, missingPath);
  }
  for (const status of ['failed', 'cancelled'] as const) {
    const fixture = await createExactRun(status);
    const result = domain.admit(await observeRun(fixture.run));
    assert.equal(result.kind, 'verified_non_success');
    assert.equal(result.view.findings, undefined);
    assert.equal(result.view.summary, undefined);
  }
  const inProgress = await createExactRun('in_progress');
  assert.deepEqual(domain.admit(await observeRun(inProgress.run)), { kind: 'rejected', error: { code: 'RUN_READ_FAILED' } });
});

test('TEST-REC-003 [AC-REC-004-01..03] verifies checksums, evidence references, and Markdown non-authority', async (t) => {
  const { createRunEvidenceDomain } = await import(coreUrl.href);
  const domain = createRunEvidenceDomain();
  const fixture = await createExactRun();
  const observation = await observeRun(fixture.run);
  const admitted = domain.admit(observation);
  assert.equal(admitted.kind, 'verified_succeeded');
  assert.ok(admitted.integrity.every((entry: { outcome: string }) => entry.outcome === 'verified'));
  const checksumCases: readonly [string, ReturnType<typeof replaceObservedBytes> | ReturnType<typeof replaceObservedMetadata>][] = [
    ['contract_sha', replaceObservedBytes(observation, 'analysis-contract.json', Buffer.from('{"changed":true}', 'utf8'))],
    ['evidence_sha', replaceObservedBytes(observation, 'evidence.json', Buffer.from('{"changed":true}', 'utf8'))],
    ['indexed_asset_byte_size', replaceObservedMetadata(observation, 'outputs/O-001.json', { byte_size: observation.files['outputs/O-001.json'].byte_size + 1 })],
    ['indexed_asset_sha', replaceObservedMetadata(observation, 'outputs/O-001.json', { sha256: '0'.repeat(64) })],
  ];
  const declaredIndexedAssetSize = replaceObservedJson(observation, 'run.json', (manifest) => { ((manifest.artifacts as Record<string, unknown>[]).find((asset) => asset.path === 'outputs/O-001.json')!).byte_size = observation.files['outputs/O-001.json'].byte_size + 1; });
  for (const [name, changed] of [...checksumCases, ['declared_indexed_asset_byte_size', declaredIndexedAssetSize] as const]) assert.deepEqual(domain.admit(changed), { kind: 'rejected', error: { code: 'RUN_CHECKSUM_MISMATCH' } }, name);
  const evidenceMutation = (mutate: Parameters<typeof replaceObservedJson>[2]) => synchronizeManifestDescriptor(replaceObservedJson(observation, 'evidence.json', mutate), 'evidence.json');
  const referenceCases: readonly [string, Parameters<typeof replaceObservedJson>[2]][] = [
    ['dangling_finding_evidence', (evidence) => { ((evidence.findings as Record<string, unknown>[])[0].evidence_ids as string[])[0] = 'E-404'; }],
    ['missing_finding_evidence', (evidence) => { (evidence.findings as Record<string, unknown>[])[0].evidence_ids = []; }],
    ['duplicate_finding_id', (evidence) => { const findings = evidence.findings as Record<string, unknown>[]; findings.push(structuredClone(findings[0])); }],
    ['duplicate_evidence_id', (evidence) => { const items = evidence.evidence_items as Record<string, unknown>[]; items.push(structuredClone(items[0])); }],
    ['foreign_source', (evidence) => { ((evidence.evidence_items as Record<string, unknown>[])[0].source_ids as string[])[0] = 'SRC-404'; }],
    ['duplicate_source', (evidence) => { const ids = (evidence.evidence_items as Record<string, unknown>[])[0].source_ids as string[]; ids.push(ids[0]); }],
    ['foreign_asset', (evidence) => { ((evidence.evidence_items as Record<string, unknown>[])[0].artifact_ids as string[])[0] = 'O-404'; }],
    ['duplicate_asset', (evidence) => { const ids = (evidence.evidence_items as Record<string, unknown>[])[0].artifact_ids as string[]; ids.push(ids[0]); }],
    ['wrong_kind_pointer_target', (evidence) => { (evidence.evidence_items as Record<string, unknown>[])[0].result_reference = { artifact_id: 'Q-001', json_pointer: '' }; }],
    ['unresolvable_json_pointer', (evidence) => { (evidence.evidence_items as Record<string, unknown>[])[0].result_reference = { artifact_id: 'O-001', json_pointer: '/missing' }; }],
  ];
  for (const [name, mutate] of referenceCases) assert.deepEqual(domain.admit(evidenceMutation(mutate)), { kind: 'rejected', error: { code: 'RUN_REFERENCE_INVALID' } }, name);
  for (const pointer of ['/toString', '/constructor']) {
    await t.test(`prototype_property_${pointer.slice(1)}_is_not_a_json_pointer_target`, () => {
      const changed = evidenceMutation((evidence) => { (evidence.evidence_items as Record<string, unknown>[])[0].result_reference = { artifact_id: 'O-001', json_pointer: pointer }; });
      assert.deepEqual(domain.admit(changed), { kind: 'rejected', error: { code: 'RUN_REFERENCE_INVALID' } });
    });
  }
  await t.test('array_prototype_numeric_property_is_not_a_json_pointer_target', () => {
    const outputWithEmptyItems = synchronizeManifestDescriptor(
      replaceObservedJson(observation, 'outputs/O-001.json', (output) => { output.items = []; }),
      'outputs/O-001.json',
    );
    const changed = synchronizeManifestDescriptor(
      replaceObservedJson(outputWithEmptyItems, 'evidence.json', (evidence) => {
        (evidence.evidence_items as Record<string, unknown>[])[0].result_reference = { artifact_id: 'O-001', json_pointer: '/items/0' };
      }),
      'evidence.json',
    );
    const previous = Object.getOwnPropertyDescriptor(Array.prototype, '0');
    try {
      Object.defineProperty(Array.prototype, '0', { configurable: true, enumerable: false, value: 'inherited', writable: true });
      assert.deepEqual(domain.admit(changed), { kind: 'rejected', error: { code: 'RUN_REFERENCE_INVALID' } });
    } finally {
      if (previous) Object.defineProperty(Array.prototype, '0', previous);
      else delete (Array.prototype as unknown as Record<string, unknown>)['0'];
    }
  });
  for (const [name, mutate] of [
    ['unknown_evidence_field', (evidence: Record<string, unknown>) => { evidence.extra = true; }],
    ['findings_not_array', (evidence: Record<string, unknown>) => { evidence.findings = {}; }],
    ['invalid_finding_status', (evidence: Record<string, unknown>) => { ((evidence.findings as Record<string, unknown>[])[0]).status = 'invented'; }],
    ['empty_findings', (evidence: Record<string, unknown>) => { evidence.findings = []; }],
    ['evidence_items_not_array', (evidence: Record<string, unknown>) => { evidence.evidence_items = {}; }],
    ['empty_evidence_items', (evidence: Record<string, unknown>) => { evidence.evidence_items = []; }],
    ['unknown_evidence_item_field', (evidence: Record<string, unknown>) => { ((evidence.evidence_items as Record<string, unknown>[])[0]).extra = true; }],
    ['missing_evidence_description', (evidence: Record<string, unknown>) => { delete (evidence.evidence_items as Record<string, unknown>[])[0].description; }],
    ['empty_evidence_description', (evidence: Record<string, unknown>) => { ((evidence.evidence_items as Record<string, unknown>[])[0]).description = ''; }],
    ['evidence_source_ids_not_array', (evidence: Record<string, unknown>) => { ((evidence.evidence_items as Record<string, unknown>[])[0]).source_ids = {}; }],
    ['evidence_artifact_ids_not_array', (evidence: Record<string, unknown>) => { ((evidence.evidence_items as Record<string, unknown>[])[0]).artifact_ids = {}; }],
    ['invalid_json_pointer_format', (evidence: Record<string, unknown>) => { (evidence.evidence_items as Record<string, unknown>[])[0].result_reference = { artifact_id: 'O-001', json_pointer: '/bad~2' }; }],
    ['unknown_json_pointer_field', (evidence: Record<string, unknown>) => { (evidence.evidence_items as Record<string, unknown>[])[0].result_reference = { artifact_id: 'O-001', json_pointer: '', extra: true }; }],
    ['invalid_finding_id_format', (evidence: Record<string, unknown>) => { ((evidence.findings as Record<string, unknown>[])[0]).finding_id = 'F-1'; }],
    ['unknown_finding_field', (evidence: Record<string, unknown>) => { ((evidence.findings as Record<string, unknown>[])[0]).extra = true; }],
    ['missing_finding_statement', (evidence: Record<string, unknown>) => { delete (evidence.findings as Record<string, unknown>[])[0].statement; }],
    ['empty_finding_statement', (evidence: Record<string, unknown>) => { ((evidence.findings as Record<string, unknown>[])[0]).statement = ''; }],
    ['finding_evidence_ids_not_array', (evidence: Record<string, unknown>) => { ((evidence.findings as Record<string, unknown>[])[0]).evidence_ids = {}; }],
    ['empty_finding_limitations', (evidence: Record<string, unknown>) => { ((evidence.findings as Record<string, unknown>[])[0]).limitations = []; }],
    ['empty_finding_limitation_entry', (evidence: Record<string, unknown>) => { ((evidence.findings as Record<string, unknown>[])[0]).limitations = ['']; }],
    ['finding_limitation_entry_not_string', (evidence: Record<string, unknown>) => { ((evidence.findings as Record<string, unknown>[])[0]).limitations = [1]; }],
    ['invalid_evidence_id_format', (evidence: Record<string, unknown>) => { ((evidence.evidence_items as Record<string, unknown>[])[0]).evidence_id = 'E-1'; }],
  ] as const) {
    await t.test(name, () => assert.deepEqual(domain.admit(evidenceMutation(mutate)), { kind: 'rejected', error: { code: 'RUN_READ_FAILED' } }));
  }
  const resolvedPointer = domain.admit(evidenceMutation((evidence) => { (evidence.evidence_items as Record<string, unknown>[])[0].result_reference = { artifact_id: 'O-001', json_pointer: '' }; }));
  assert.equal(resolvedPointer.kind, 'verified_succeeded');
  const reference = resolvedPointer.view.evidence[0].result_reference;
  assert.ok(reference);
  assert.deepEqual(Object.keys(reference).sort(), ['artifact_id', 'json_pointer']);
  const markdownDisagrees = domain.admit(synchronizeManifestDescriptor(replaceObservedBytes(observation, 'summary.md', Buffer.from('untrusted markdown contradicts every field', 'utf8')), 'summary.md'));
  assert.equal(markdownDisagrees.kind, 'verified_succeeded');
});
