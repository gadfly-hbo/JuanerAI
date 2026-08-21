import assert from 'node:assert/strict';
import test from 'node:test';

import {
  calculateFixtureOracle,
  canonicalFixtureBytes,
  clarifiedQuestion,
  expectedAnalysisProposal,
  fixtureByteSize,
  fixtureSha256,
  parseClosedFixture,
  referenceOracle,
  sha256,
} from '../../fixtures/xanthil-local-analysis/fixture-oracle.mjs';
import { loadPublicSeam, requiredExport } from '../../fixtures/xanthil-local-analysis/public-seams.mjs';

// case:fixture-oracle-and-mutants case:bounded-finding-matrix case:closed-run-shapes
// case:evidence-catalog-integrity case:security-negative-matrix case:failure-timeout-cancel-no-retry
// case:offline-reproduction case:markdown-projection-drift
// case:analysis-proposal-validator

async function domainMethod(name) {
  const domain = requiredExport(await loadPublicSeam('core'), 'createLocalAnalysisDomain')();
  return requiredExport(domain, name);
}

const runId = '018f2b85-7dc0-7000-8000-000000000001';

function artifactDescriptor(artifact_id, category, path, media_type) {
  return { artifact_id, category, path, media_type, byte_size: 1, sha256: fixtureSha256 };
}

const referenceArtifacts = Object.freeze([
  artifactDescriptor('Q-001', 'query', 'queries/Q-001.sql', 'application/sql'),
  artifactDescriptor('S-001', 'script', 'scripts/S-001.py', 'text/plain'),
  artifactDescriptor('O-001', 'output', 'outputs/O-001.json', 'application/json'),
  artifactDescriptor('O-002', 'output', 'outputs/O-002.json', 'application/json'),
  artifactDescriptor('DOC-SUMMARY', 'summary', 'summary.md', 'text/markdown'),
  artifactDescriptor('DOC-EVIDENCE', 'evidence_document', 'evidence.md', 'text/markdown'),
]);

test('fixture helper health: canonical bytes, SHA-256, and independent exact oracle are stable', async () => {
  const bytes = await canonicalFixtureBytes();
  assert.equal(bytes.byteLength, fixtureByteSize);
  assert.equal(sha256(bytes), fixtureSha256);
  const rows = parseClosedFixture(bytes);
  assert.equal(rows.length, 20);
  assert.deepEqual(calculateFixtureOracle(rows), referenceOracle);
});

test('TEST-XCLI-003 [AC-XCLI-002-01, AC-XCLI-002-02, AC-XCLI-002-03] validates the exact closed Discovery Proposal without side effects', async (t) => {
  const leaves = [];
  const add = (label, makeProposal, expectedCode = 'VALIDATION_FAILED') => {
    leaves.push(t.test(label, async () => {
      const proposal = makeProposal();
      const validateAnalysisProposal = await domainMethod('validateAnalysisProposal');
      assert.throws(
        () => validateAnalysisProposal(proposal),
        (error) => error instanceof Error && error.message === expectedCode && !Object.hasOwn(error, 'cause'),
      );
    }));
  };
  const clone = () => structuredClone(expectedAnalysisProposal());

  leaves.push(t.test('positive_same_reference_unmutated_unfrozen_no_default', async () => {
    const proposal = clone();
    const before = structuredClone(proposal);
    const validateAnalysisProposal = await domainMethod('validateAnalysisProposal');
    assert.strictEqual(validateAnalysisProposal(proposal), proposal);
    assert.deepEqual(proposal, before);
    const assertCallerGraphUnfrozen = (value, seen = new Set()) => {
      if (value === null || typeof value !== 'object' || seen.has(value)) return;
      seen.add(value);
      assert.equal(Object.isFrozen(value), false, 'validator must not freeze any caller-owned Proposal object or array');
      for (const child of Object.values(value)) assertCallerGraphUnfrozen(child, seen);
    };
    assertCallerGraphUnfrozen(proposal);
  }));

  for (const [label, value] of [
    ['root_null', null], ['root_primitive', 'proposal'], ['root_array', []], ['root_nonplain', Object.create(null)],
  ]) add(label, () => value);

  for (const key of ['schema_version', 'original_question', 'question', 'objective', 'source_ids', 'fixture', 'time_windows', 'metrics', 'signal_rule', 'output_requirements', 'constraints']) {
    add(`top_level_missing_${key}`, () => {
      const proposal = clone();
      delete proposal[key];
      return proposal;
    });
    add(`top_level_extra_${key}`, () => ({ ...clone(), [`extra_${key}`]: true }));
  }

  add('schema_version_unsupported', () => ({ ...clone(), schema_version: '2.0' }), 'CONTRACT_VERSION_UNSUPPORTED');
  add('original_question_wrong', () => ({ ...clone(), original_question: 'Different question' }));
  add('question_wrong', () => ({ ...clone(), question: 'Different clarified question' }));
  add('objective_wrong', () => ({ ...clone(), objective: 'Different objective' }));

  add('source_ids_non_array', () => ({ ...clone(), source_ids: 'SRC-001' }));
  add('source_ids_wrong_cardinality', () => ({ ...clone(), source_ids: [] }));
  add('source_ids_wrong_order', () => ({ ...clone(), source_ids: ['SRC-002', 'SRC-001'] }));
  add('source_ids_wrong_value', () => ({ ...clone(), source_ids: ['SRC-002'] }));

  for (const key of ['source_id', 'version', 'kind', 'path', 'sha256', 'byte_size']) {
    add(`fixture_${key}_wrong`, () => ({ ...clone(), fixture: { ...clone().fixture, [key]: key === 'byte_size' ? 529 : 'wrong' } }));
  }
  add('fixture_columns_wrong_order', () => ({ ...clone(), fixture: { ...clone().fixture, columns: ['member_id', 'order_id', 'ordered_on'] } }));
  add('fixture_columns_wrong_cardinality', () => ({ ...clone(), fixture: { ...clone().fixture, columns: ['order_id', 'member_id'] } }));
  add('fixture_date_coverage_start_wrong', () => ({ ...clone(), fixture: { ...clone().fixture, date_coverage: { ...clone().fixture.date_coverage, start_date: '2026-08-02' } } }));
  add('fixture_date_coverage_end_wrong', () => ({ ...clone(), fixture: { ...clone().fixture, date_coverage: { ...clone().fixture.date_coverage, end_date: '2026-08-13' } } }));

  add('time_windows_non_array', () => ({ ...clone(), time_windows: {} }));
  add('time_windows_wrong_cardinality', () => ({ ...clone(), time_windows: [clone().time_windows[0]] }));
  add('time_windows_wrong_order', () => ({ ...clone(), time_windows: [...clone().time_windows].reverse() }));
  for (const [index, window] of ['baseline', 'recent'].entries()) {
    for (const key of ['window_id', 'start_date', 'end_date']) {
      add(`time_windows_${window}_${key}_wrong`, () => {
        const proposal = clone();
        proposal.time_windows[index][key] = key === 'window_id' ? 'wrong' : '2026-08-09';
        return proposal;
      });
    }
  }

  add('metrics_non_array', () => ({ ...clone(), metrics: {} }));
  add('metrics_wrong_cardinality', () => ({ ...clone(), metrics: clone().metrics.slice(0, 4) }));
  add('metrics_wrong_order', () => ({ ...clone(), metrics: [...clone().metrics].reverse() }));
  for (const [index, metric] of clone().metrics.entries()) {
    for (const key of ['metric_id', 'display_name', 'definition', 'grain', 'population', 'unit']) {
      add(`metrics_${metric.metric_id}_${key}_wrong`, () => {
        const proposal = clone();
        proposal.metrics[index][key] = 'wrong';
        return proposal;
      });
    }
  }

  add('signal_rule_comparison_wrong', () => ({ ...clone(), signal_rule: { ...clone().signal_rule, comparison: 'wrong' } }));
  add('signal_rule_supported_status_wrong', () => ({ ...clone(), signal_rule: { ...clone().signal_rule, supported_status: 'wrong' } }));

  for (const key of ['finding', 'evidence', 'summary', 'canonical_sql', 'canonical_python_validation']) {
    add(`output_requirements_${key}_wrong`, () => ({ ...clone(), output_requirements: { ...clone().output_requirements, [key]: false } }));
  }
  add('output_requirements_structured_outputs_wrong_order', () => ({ ...clone(), output_requirements: { ...clone().output_requirements, structured_outputs: [...clone().output_requirements.structured_outputs].reverse() } }));
  add('output_requirements_structured_outputs_wrong_cardinality', () => ({ ...clone(), output_requirements: { ...clone().output_requirements, structured_outputs: ['O-001'] } }));

  for (const key of ['synthetic_fixture_only', 'raw_row_model_egress', 'network_tools', 'generic_code_or_filesystem', 'decision_recommendation_or_action']) {
    add(`constraints_${key}_wrong`, () => ({ ...clone(), constraints: { ...clone().constraints, [key]: !clone().constraints[key] } }));
  }
  add('constraints_approved_tools_wrong_order', () => ({ ...clone(), constraints: { ...clone().constraints, approved_tools_only: [...clone().constraints.approved_tools_only].reverse() } }));
  add('constraints_approved_tools_wrong_cardinality', () => ({ ...clone(), constraints: { ...clone().constraints, approved_tools_only: clone().constraints.approved_tools_only.slice(0, 2) } }));

  for (const [family, mutate] of [
    ['fixture_missing', (proposal) => { delete proposal.fixture.kind; }],
    ['fixture_null', (proposal) => { proposal.fixture.kind = null; }],
    ['fixture_extra', (proposal) => { proposal.fixture.extra = true; }],
    ['fixture_nonplain', (proposal) => { proposal.fixture = Object.create(null); }],
    ['date_coverage_missing', (proposal) => { delete proposal.fixture.date_coverage.start_date; }],
    ['date_coverage_null', (proposal) => { proposal.fixture.date_coverage.start_date = null; }],
    ['date_coverage_extra', (proposal) => { proposal.fixture.date_coverage.extra = true; }],
    ['date_coverage_nonplain', (proposal) => { proposal.fixture.date_coverage = Object.create(null); }],
    ['window_missing', (proposal) => { delete proposal.time_windows[0].window_id; }],
    ['window_null', (proposal) => { proposal.time_windows[0].window_id = null; }],
    ['window_extra', (proposal) => { proposal.time_windows[0].extra = true; }],
    ['window_nonplain', (proposal) => { proposal.time_windows[0] = Object.create(null); }],
    ['metric_missing', (proposal) => { delete proposal.metrics[0].metric_id; }],
    ['metric_null', (proposal) => { proposal.metrics[0].metric_id = null; }],
    ['metric_extra', (proposal) => { proposal.metrics[0].extra = true; }],
    ['metric_nonplain', (proposal) => { proposal.metrics[0] = Object.create(null); }],
    ['signal_rule_missing', (proposal) => { delete proposal.signal_rule.comparison; }],
    ['signal_rule_null', (proposal) => { proposal.signal_rule.comparison = null; }],
    ['signal_rule_extra', (proposal) => { proposal.signal_rule.extra = true; }],
    ['signal_rule_nonplain', (proposal) => { proposal.signal_rule = Object.create(null); }],
    ['output_requirements_missing', (proposal) => { delete proposal.output_requirements.finding; }],
    ['output_requirements_null', (proposal) => { proposal.output_requirements.finding = null; }],
    ['output_requirements_extra', (proposal) => { proposal.output_requirements.extra = true; }],
    ['output_requirements_nonplain', (proposal) => { proposal.output_requirements = Object.create(null); }],
    ['constraints_missing', (proposal) => { delete proposal.constraints.synthetic_fixture_only; }],
    ['constraints_null', (proposal) => { proposal.constraints.synthetic_fixture_only = null; }],
    ['constraints_extra', (proposal) => { proposal.constraints.extra = true; }],
    ['constraints_nonplain', (proposal) => { proposal.constraints = Object.create(null); }],
  ]) add(`nested_${family}`, () => {
    const proposal = clone();
    mutate(proposal);
    return proposal;
  });

  await Promise.allSettled(leaves);
});

test('TEST-XCLI-001 [AC-XCLI-004-01, AC-XCLI-004-02, AC-XCLI-005-01, AC-XCLI-005-03, AC-XCLI-005-04] validates the closed fixture and exact window-local oracle', async (t) => {
  const bytes = await canonicalFixtureBytes();
  const validateFixture = await domainMethod('validateMemberOrdersFixture');
  const calculateMetrics = await domainMethod('calculateMemberRepurchaseMetrics');
  const windows = [
    { window_id: 'baseline', start_date: '2026-08-01', end_date: '2026-08-07' },
    { window_id: 'recent', start_date: '2026-08-08', end_date: '2026-08-14' },
  ];
  assert.deepEqual(validateFixture({ fixture_bytes: bytes, expected_sha256: fixtureSha256 }), {
    source_id: 'SRC-001', kind: 'csv', path: 'member-orders-v1.csv', sha256: fixtureSha256,
    byte_size: fixtureByteSize, fixture_version: 'member-orders-v1', row_count: 20,
  });
  const result = calculateMetrics({ fixture_bytes: bytes, time_windows: windows });
  assert.deepEqual(result, referenceOracle);
  assert.equal(result.baseline.order_count, 10, 'inclusive 2026-08-01 and 2026-08-07 endpoints count');
  assert.equal(result.recent.order_count, 10, 'inclusive 2026-08-08 and 2026-08-14 endpoints count');
  assert.equal(result.recent.repeat_purchaser_count, 1, 'members with one order in each window do not combine into a repeat');
  await t.test('caller_metrics_is_not_public_input', () => {
    assert.throws(() => calculateMetrics({ fixture_bytes: bytes, time_windows: windows, caller_metrics: { baseline: { order_count: 999 } } }), /VALIDATION_FAILED|UNKNOWN_FIELD/);
  });
  const source = bytes.toString('utf8');
  const semanticallyValidNoncanonicalBytes = Buffer.from(source
    .replace('ORD-001,M-001,2026-08-01\nORD-002,M-001,2026-08-02', 'ORD-002,M-001,2026-08-02\nORD-001,M-001,2026-08-01'));
  assert.equal(parseClosedFixture(semanticallyValidNoncanonicalBytes).length, 20, 'mutation remains semantically valid');
  assert.notEqual(sha256(semanticallyValidNoncanonicalBytes), fixtureSha256, 'mutation changes canonical identity');
  await t.test('semantically_valid_noncanonical_fixture_bytes', () => {
    assert.throws(
      () => calculateMetrics({ fixture_bytes: semanticallyValidNoncanonicalBytes, time_windows: windows }),
      /FIXTURE_MISMATCH|VALIDATION_FAILED/,
      'calculation accepts only the canonical fixture bytes, not an arbitrary legal 20-row CSV',
    );
  });
  const invalidFixtures = {
    one_byte_hash_mismatch: Buffer.concat([bytes, Buffer.from(' ')]),
    header: Buffer.from(source.replace('order_id,member_id,ordered_on', 'member_id,order_id,ordered_on')),
    extra_column: Buffer.from(source.replace('ORD-001,M-001,2026-08-01', 'ORD-001,M-001,2026-08-01,extra')),
    duplicate_order_id: Buffer.from(source.replace('ORD-020,M-009,2026-08-14', 'ORD-019,M-009,2026-08-14')),
    missing_value: Buffer.from(source.replace('ORD-020,M-009,2026-08-14', 'ORD-020,,2026-08-14')),
    invalid_date: Buffer.from(source.replace('ORD-020,M-009,2026-08-14', 'ORD-020,M-009,2026-08-32')),
    crlf: Buffer.from(source.replaceAll('\n', '\r\n')),
    extra_row: Buffer.from(`${source}ORD-021,M-010,2026-08-14\n`),
  };
  for (const [label, fixture_bytes] of Object.entries(invalidFixtures)) {
    const expected_sha256 = label === 'one_byte_hash_mismatch' ? fixtureSha256 : sha256(fixture_bytes);
    await t.test(label, () => {
      assert.throws(() => validateFixture({ fixture_bytes, expected_sha256 }), /FIXTURE_MISMATCH|SOURCE_INVALID/, label);
    });
  }
});

test('TEST-XCLI-002 [AC-XCLI-005-02, AC-XCLI-005-03, AC-XCLI-011-01, AC-XCLI-011-03, AC-XCLI-012-01] permits only the bounded supported Finding', async (t) => {
  const validateFinding = await domainMethod('validateFinding');
  const finding = {
    finding_id: 'F-001', status: 'supported',
    statement: 'The window-local repurchase-member rate declined in this synthetic fixture.',
    evidence_ids: ['E-001'],
    limitations: ['The sample is tiny and synthetic.', 'The metric is window-local.', 'The analysis makes no causal or business-impact claim.'],
  };
  assert.deepEqual(validateFinding({ finding, result: referenceOracle }), finding);
  for (const [label, invalidFinding, result] of [
    ['missing_tiny_synthetic', { ...finding, limitations: finding.limitations.slice(1) }, referenceOracle],
    ['missing_window_local', { ...finding, limitations: [finding.limitations[0], finding.limitations[2]] }, referenceOracle],
    ['missing_no_causal_impact', { ...finding, limitations: finding.limitations.slice(0, 2) }, referenceOracle],
    ['causal_claim', { ...finding, statement: 'A product change caused the rate decline.' }, referenceOracle],
    ['significance_claim', { ...finding, statement: 'The decline is statistically significant.' }, referenceOracle],
    ['business_impact', { ...finding, statement: 'The decline harmed the business.' }, referenceOracle],
    ['recommendation', { ...finding, statement: 'Recommendation: contact members.' }, referenceOracle],
    ['action', { ...finding, statement: 'Action: contact members.' }, referenceOracle],
    ['equality_is_not_decline', finding, { ...referenceOracle, recent: { ...referenceOracle.recent, repurchase_member_rate: { numerator: 2, denominator: 3 } }, signal: { comparison: 'recent_lt_baseline', status: 'contradicted' } }],
    ['zero_denominator', finding, { ...referenceOracle, recent: { ...referenceOracle.recent, active_member_count: 0, repurchase_member_rate: { numerator: 0, denominator: 1 } } }],
    ['baseline_rate_not_repeat_over_active', finding, { ...referenceOracle, baseline: { ...referenceOracle.baseline, repurchase_member_rate: { numerator: 1, denominator: 1 } } }],
    ['recent_rate_not_reduced', finding, { ...referenceOracle, recent: { ...referenceOracle.recent, repurchase_member_rate: { numerator: 2, denominator: 18 } } }],
    ['delta_not_recent_minus_baseline', finding, { ...referenceOracle, repurchase_member_rate_delta_pp: { numerator: -100, denominator: 9 } }],
    ['signal_not_exact_comparison', finding, { ...referenceOracle, signal: { comparison: 'recent_lt_baseline', status: 'contradicted' } }],
    ['negative_order_count', finding, { ...referenceOracle, baseline: { ...referenceOracle.baseline, order_count: -1 } }],
    ['negative_active_count', finding, { ...referenceOracle, baseline: { ...referenceOracle.baseline, active_member_count: -1 } }],
    ['negative_repeat_count', finding, { ...referenceOracle, baseline: { ...referenceOracle.baseline, repeat_purchaser_count: -1 } }],
    ['order_count_less_than_active_count', finding, { ...referenceOracle, baseline: { ...referenceOracle.baseline, order_count: 5 } }],
    ['repeat_count_greater_than_active_count', finding, {
      ...referenceOracle,
      baseline: { ...referenceOracle.baseline, repeat_purchaser_count: 7, repurchase_member_rate: { numerator: 7, denominator: 6 } },
      repurchase_member_rate_delta_pp: { numerator: -950, denominator: 9 },
    }],
  ]) await t.test(label, () => {
    assert.throws(() => validateFinding({ finding: invalidFinding, result }), /VALIDATION_FAILED|INCONCLUSIVE_REQUIRED/, label);
  });
});

test('TEST-XCLI-004 [AC-XCLI-003-01, AC-XCLI-009-01, AC-XCLI-010-01, AC-XCLI-010-02, AC-XCLI-016-02] rejects non-closed lifecycle records and unknown versions', async (t) => {
  const validateRunManifest = await domainMethod('validateRunManifest');
  const run = {
    schema_version: '1.0', run_id: runId, analysis_kind: 'analyst_assistant', status: 'in_progress',
    started_at: '2026-08-20T00:00:00.000Z', runtime: { xanthil_version: '1.0.0', pi_adapter_version: '1.0.0', pi_version: '0.84.2' },
    model: { provider: 'xiaomi-token-plan-cn', model_id: 'mimo-v2.5-pro' },
    contract: { path: 'analysis-contract.json', sha256: fixtureSha256 },
    sources: [{ source_id: 'SRC-001', kind: 'csv', path: 'member-orders-v1.csv', sha256: fixtureSha256, byte_size: fixtureByteSize, read_at: '2026-08-20T00:00:00.000Z', fixture_version: 'member-orders-v1' }], artifacts: [],
  };
  assert.deepEqual(validateRunManifest(run), run);
  const queryAsset = referenceArtifacts[0];
  const runWithAsset = { ...run, artifacts: [queryAsset] };
  assert.deepEqual(validateRunManifest(runWithAsset), runWithAsset);
  const succeededRun = {
    ...run,
    status: 'succeeded',
    artifacts: referenceArtifacts,
    ended_at: '2026-08-20T00:01:00.000Z',
    evidence: { path: 'evidence.json', sha256: fixtureSha256 },
  };
  await t.test('succeeded_reference_run_exact_six_assets', () => {
    assert.deepEqual(validateRunManifest(succeededRun), succeededRun, 'reference success indexes the exact six approved assets');
  });
  for (const terminalRun of [
    { ...run, status: 'failed', ended_at: '2026-08-20T00:01:00.000Z', terminal_detail: { stage: 'validation', error_code: 'VALIDATION_FAILED' } },
    { ...run, status: 'cancelled', ended_at: '2026-08-20T00:01:00.000Z', terminal_detail: { stage: 'runtime' } },
  ]) await t.test(`${terminalRun.status}_may_be_asset_free`, () => {
    assert.deepEqual(validateRunManifest(terminalRun), terminalRun, `${terminalRun.status} may be asset-free`);
  });
  for (const [label, invalid] of [
    ['unknown_version', { ...run, schema_version: '2.0' }],
    ['unknown_field', { ...run, unexpected: true }],
    ['missing_run_id', { ...run, run_id: undefined }],
    ['null_model', { ...run, model: null }],
    ['unknown_status', { ...run, status: 'partial' }],
    ['in_progress_has_ended_at', { ...run, ended_at: run.started_at }],
    ['succeeded_without_evidence', { ...run, status: 'succeeded', ended_at: '2026-08-20T00:01:00.000Z' }],
    ['failed_with_evidence', { ...run, status: 'failed', ended_at: '2026-08-20T00:01:00.000Z', evidence: { path: 'evidence.json', sha256: fixtureSha256 }, terminal_detail: { stage: 'validation', error_code: 'VALIDATION_FAILED' } }],
    ['source_noncanonical_path', { ...run, sources: [{ ...run.sources[0], path: 'other.csv' }] }],
    ['source_noncanonical_sha', { ...run, sources: [{ ...run.sources[0], sha256: '0'.repeat(64) }] }],
    ['source_noncanonical_id', { ...run, sources: [{ ...run.sources[0], source_id: 'SRC-002' }] }],
    ['source_noncanonical_kind', { ...run, sources: [{ ...run.sources[0], kind: 'json' }] }],
    ['source_noncanonical_fixture_version', { ...run, sources: [{ ...run.sources[0], fixture_version: 'member-orders-v2' }] }],
    ['source_byte_size_too_small', { ...run, sources: [{ ...run.sources[0], byte_size: fixtureByteSize - 1 }] }],
    ['source_byte_size_too_large', { ...run, sources: [{ ...run.sources[0], byte_size: fixtureByteSize + 1 }] }],
    ['source_unknown_field', { ...run, sources: [{ ...run.sources[0], mtime: '2026-08-20T00:00:00.000Z' }] }],
    ['source_null_optional_invention', { ...run, sources: [{ ...run.sources[0], absolute_path: null }] }],
    ['artifact_unknown_field', { ...runWithAsset, artifacts: [{ ...queryAsset, unexpected: true }] }],
    ['artifact_duplicate_id_path', { ...runWithAsset, artifacts: [queryAsset, { ...queryAsset }] }],
    ['artifact_id_path_mismatch', { ...runWithAsset, artifacts: [{ ...queryAsset, path: 'scripts/Q-001.py' }] }],
    ['artifact_category_mismatch', { ...runWithAsset, artifacts: [{ ...queryAsset, category: 'script' }] }],
    ['artifact_bad_media_type', { ...runWithAsset, artifacts: [{ ...queryAsset, media_type: 'application/octet-stream' }] }],
    ['artifact_bad_sha', { ...runWithAsset, artifacts: [{ ...queryAsset, sha256: 'not-a-sha' }] }],
    ['artifact_bad_size', { ...runWithAsset, artifacts: [{ ...queryAsset, byte_size: -1 }] }],
    ['artifact_unapproved_filename', { ...runWithAsset, artifacts: [{ ...queryAsset, path: 'queries/Q-002.sql' }] }],
    ['script_python_subtype_is_not_approved', { ...runWithAsset, artifacts: [{ ...referenceArtifacts[1], media_type: 'text/x-python' }] }],
    ['script_path_mismatch', { ...runWithAsset, artifacts: [{ ...referenceArtifacts[1], path: 'scripts/S-002.py' }] }],
    ['output_media_mismatch', { ...runWithAsset, artifacts: [{ ...referenceArtifacts[2], media_type: 'text/json' }] }],
    ['output_path_mismatch', { ...runWithAsset, artifacts: [{ ...referenceArtifacts[2], path: 'outputs/O-001.txt' }] }],
    ['summary_path_mismatch', { ...runWithAsset, artifacts: [{ ...referenceArtifacts[4], path: 'docs/summary.md' }] }],
    ['summary_media_mismatch', { ...runWithAsset, artifacts: [{ ...referenceArtifacts[4], media_type: 'text/plain' }] }],
    ['evidence_document_category_mismatch', { ...runWithAsset, artifacts: [{ ...referenceArtifacts[5], category: 'summary' }] }],
    ['evidence_document_media_mismatch', { ...runWithAsset, artifacts: [{ ...referenceArtifacts[5], media_type: 'application/markdown' }] }],
    ['succeeded_empty_artifacts', { ...succeededRun, artifacts: [] }],
    ['succeeded_extra_reference_asset', { ...succeededRun, artifacts: [...referenceArtifacts, artifactDescriptor('O-003', 'output', 'outputs/O-003.json', 'application/json')] }],
    ['succeeded_wrong_reference_asset', { ...succeededRun, artifacts: [artifactDescriptor('Q-002', 'query', 'queries/Q-002.sql', 'application/sql'), ...referenceArtifacts.slice(1)] }],
  ]) await t.test(label, () => {
    assert.throws(() => validateRunManifest(invalid), /VALIDATION_FAILED|CONTRACT_VERSION_UNSUPPORTED/, label);
  });
  for (const requiredArtifact of referenceArtifacts) {
    await t.test(`succeeded_requires_${requiredArtifact.artifact_id}`, () => {
      assert.throws(
        () => validateRunManifest({
          ...succeededRun,
          artifacts: referenceArtifacts.filter(({ artifact_id }) => artifact_id !== requiredArtifact.artifact_id),
        }),
        /VALIDATION_FAILED/,
        `succeeded run requires ${requiredArtifact.artifact_id}`,
      );
    });
  }
});

test('TEST-XCLI-005 [AC-XCLI-011-01, AC-XCLI-011-02, AC-XCLI-011-03, AC-XCLI-012-02, AC-XCLI-012-03, AC-XCLI-015-01] resolves Evidence only inside its run', async (t) => {
  const validateEvidenceIndex = await domainMethod('validateEvidenceIndex');
  const evidence = {
    schema_version: '1.0', run_id: runId,
    findings: [{ finding_id: 'F-001', status: 'supported', statement: 'The window-local repurchase-member rate declined in this synthetic fixture.', evidence_ids: ['E-001'], limitations: ['tiny and synthetic', 'window-local', 'no causal or business-impact claim'] }],
    evidence_items: [{ evidence_id: 'E-001', description: 'Exact deterministic calculation.', source_ids: ['SRC-001'], artifact_ids: ['Q-001', 'S-001', 'O-001', 'O-002'] }],
  };
  const catalog = {
    sources: [{ source_id: 'SRC-001', sha256: fixtureSha256 }],
    artifacts: ['Q-001', 'S-001', 'O-001', 'O-002'].map((artifact_id) => ({ artifact_id, sha256: fixtureSha256, observed_sha256: fixtureSha256 })),
  };
  assert.deepEqual(validateEvidenceIndex({ evidence, catalog }), evidence);
  for (const json_pointer of ['', '/baseline/repurchase_member_rate/numerator', '/escaped~0token/slash~1token']) {
    const evidenceWithPointer = {
      ...evidence,
      evidence_items: [{
        ...evidence.evidence_items[0],
        result_reference: { artifact_id: 'O-001', json_pointer },
      }],
    };
    const label = json_pointer === '' ? 'pointer_empty' : `pointer_${json_pointer.replaceAll('/', '_').replaceAll('~', 'tilde')}`;
    await t.test(label, () => {
      assert.deepEqual(validateEvidenceIndex({ evidence: evidenceWithPointer, catalog }), evidenceWithPointer, `valid RFC6901 pointer ${JSON.stringify(json_pointer)}`);
    });
  }
  for (const [label, invalid] of [
    ['missing_evidence', { ...evidence, evidence_items: [] }],
    ['duplicate_evidence_id', { ...evidence, evidence_items: [...evidence.evidence_items, { ...evidence.evidence_items[0] }] }],
    ['dangling_source', { ...evidence, evidence_items: [{ ...evidence.evidence_items[0], source_ids: ['SRC-404'] }] }],
    ['foreign_artifact', { ...evidence, evidence_items: [{ ...evidence.evidence_items[0], artifact_ids: ['O-404'] }] }],
    ['dangling_finding_evidence', { ...evidence, findings: [{ ...evidence.findings[0], evidence_ids: ['E-404'] }] }],
    ['pointer_not_slash_prefixed', { ...evidence, evidence_items: [{ ...evidence.evidence_items[0], result_reference: { artifact_id: 'O-001', json_pointer: 'baseline' } }] }],
    ['pointer_invalid_escape', { ...evidence, evidence_items: [{ ...evidence.evidence_items[0], result_reference: { artifact_id: 'O-001', json_pointer: '/bad~2escape' } }] }],
    ['pointer_dangling_escape', { ...evidence, evidence_items: [{ ...evidence.evidence_items[0], result_reference: { artifact_id: 'O-001', json_pointer: '/bad~' } }] }],
    ['pointer_non_output_artifact', { ...evidence, evidence_items: [{ ...evidence.evidence_items[0], result_reference: { artifact_id: 'Q-001', json_pointer: '' } }] }],
    ['pointer_unknown_field', { ...evidence, evidence_items: [{ ...evidence.evidence_items[0], result_reference: { artifact_id: 'O-001', json_pointer: '', fragment: true } }] }],
    ['pointer_null', { ...evidence, evidence_items: [{ ...evidence.evidence_items[0], result_reference: null }] }],
    ['evidence_item_unknown_field', { ...evidence, evidence_items: [{ ...evidence.evidence_items[0], narrative: 'not authoritative' }] }],
    ['finding_unknown_field', { ...evidence, findings: [{ ...evidence.findings[0], confidence: null }] }],
    ['evidence_root_unknown_field', { ...evidence, session_history: undefined }],
  ]) await t.test(label, () => {
    assert.throws(() => validateEvidenceIndex({ evidence: invalid, catalog }), /VALIDATION_FAILED/, label);
  });
  const checksumMismatchCatalog = { ...catalog, artifacts: catalog.artifacts.map((artifact) => artifact.artifact_id === 'O-001' ? { ...artifact, observed_sha256: '0'.repeat(64) } : artifact) };
  await t.test('checksum_mismatch', () => {
    assert.throws(() => validateEvidenceIndex({ evidence, catalog: checksumMismatchCatalog }), /VALIDATION_FAILED/, 'checksum_mismatch');
  });
});

test('TEST-XCLI-014 [AC-XCLI-001-02, AC-XCLI-004-02, AC-XCLI-004-03, AC-XCLI-006-01, AC-XCLI-006-02, AC-XCLI-006-03, AC-XCLI-014-01, AC-XCLI-014-02, AC-XCLI-014-03] rejects forbidden data, tools, and egress before use', async (t) => {
  const enforceSecurityBoundary = await domainMethod('enforceLocalAnalysisSecurityBoundary');
  assert.deepEqual(enforceSecurityBoundary({ tool_name: 'profile_approved_fixture', source_path: 'member-orders-v1.csv' }), { accepted: true });
  for (const [label, request] of [
    ['shell', { tool_name: 'shell' }], ['read_file', { tool_name: 'read_file' }], ['web_search', { tool_name: 'web_search' }],
    ['arbitrary_sql', { tool_name: 'calculate_member_repurchase_metrics', sql: 'select * from orders' }],
    ['arbitrary_script', { tool_name: 'validate_member_repurchase_metrics', script: 'import os' }],
    ['source_path_escape', { tool_name: 'profile_approved_fixture', source_path: '../secret.csv' }],
  ]) await t.test(label, () => {
    assert.throws(() => enforceSecurityBoundary(request), /TOOL_POLICY_VIOLATION|SOURCE_BOUNDARY_VIOLATION/);
  });
});

test('TEST-XCLI-015 [AC-XCLI-002-04, AC-XCLI-010-02, AC-XCLI-013-01, AC-XCLI-013-02, AC-XCLI-013-03, AC-XCLI-013-04] maps failure, cancellation, and deadlines without retry', async () => {
  const validateTerminalOutcome = await domainMethod('validateTerminalOutcome');
  assert.deepEqual(validateTerminalOutcome({ status: 'failed', stage: 'analysis_sql', error_code: 'TIMEOUT', attempt_deadline_seconds: 300, call_deadline_seconds: 30 }), { status: 'failed', stage: 'analysis_sql', error_code: 'TIMEOUT' });
  assert.deepEqual(validateTerminalOutcome({ status: 'cancelled', stage: 'runtime' }), { status: 'cancelled', stage: 'runtime' });
  assert.throws(() => validateTerminalOutcome({ status: 'succeeded', retry_count: 1 }), /VALIDATION_FAILED/);
});

test('TEST-XCLI-017 [AC-XCLI-011-02, AC-XCLI-012-02, AC-XCLI-015-01, AC-XCLI-015-02] reproduces the result from recorded assets, not session history', async (t) => {
  const reproduceRecordedMetrics = await domainMethod('reproduceRecordedMetrics');
  const bytes = await canonicalFixtureBytes();
  assert.deepEqual(reproduceRecordedMetrics({ fixture_bytes: bytes, fixture_sha256: fixtureSha256 }), referenceOracle);
  for (const [label, extra] of [
    ['narrative', { narrative: 'The model says the rate declined.' }],
    ['session_history', { session_history: [] }],
    ['narrative_present_as_undefined', { narrative: undefined }],
    ['session_history_present_as_undefined', { session_history: undefined }],
    ['unknown_optional_field', { filesystem_mtime: null }],
  ]) await t.test(label, () => {
    assert.throws(
      () => reproduceRecordedMetrics({ fixture_bytes: bytes, fixture_sha256: fixtureSha256, ...extra }),
      /VALIDATION_FAILED/,
      label,
    );
  });
  await t.test('noncanonical_recorded_sha', () => {
    assert.throws(
      () => reproduceRecordedMetrics({ fixture_bytes: bytes, fixture_sha256: '0'.repeat(64) }),
      /FIXTURE_MISMATCH|VALIDATION_FAILED/,
      'recorded SHA must identify the canonical frozen bytes',
    );
  });
});

test('TEST-XCLI-018 [AC-XCLI-012-01, AC-XCLI-012-02, AC-XCLI-012-03] rejects Markdown that disagrees with machine records', async (t) => {
  const validateMarkdownProjection = await domainMethod('validateMarkdownProjection');
  const projection = { summary_md: `${clarifiedQuestion}\n66.7%\n11.1%\n-55.6 pp\nsupported\ntiny and synthetic; window-local; no causal or business-impact claim`, evidence_md: `F-001\nSRC-001\nQ-001\nS-001\nO-001\nO-002\n${fixtureSha256}` };
  assert.deepEqual(validateMarkdownProjection({ projection, result: referenceOracle }), projection);
  for (const [label, invalid] of [
    ['number', { ...projection, summary_md: projection.summary_md.replace('11.1%', '12.1%') }],
    ['status', { ...projection, summary_md: projection.summary_md.replace('supported', 'contradicted') }],
    ['limitation', { ...projection, summary_md: projection.summary_md.replace('window-local; ', '') }],
    ['reference', { ...projection, evidence_md: projection.evidence_md.replace('O-002', 'O-404') }],
  ]) await t.test(label, () => {
    assert.throws(() => validateMarkdownProjection({ projection: invalid, result: referenceOracle }), /VALIDATION_FAILED/, label);
  });
});
