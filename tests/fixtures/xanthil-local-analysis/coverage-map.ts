// This map is test-private traceability. `label` is the exact TEST identifier
// present in the executable test title; `case` names the assertion group in it.
export const coverageCases = Object.freeze({
  'TEST-XCLI-001': { file: 'unit/xanthil-local-analysis/local-analysis.unit.test.ts', case: 'fixture-oracle-and-mutants', acs: ['AC-XCLI-004-01', 'AC-XCLI-004-02', 'AC-XCLI-005-01', 'AC-XCLI-005-03', 'AC-XCLI-005-04'] },
  'TEST-XCLI-002': { file: 'unit/xanthil-local-analysis/local-analysis.unit.test.ts', case: 'bounded-finding-matrix', acs: ['AC-XCLI-005-02', 'AC-XCLI-005-03', 'AC-XCLI-011-01', 'AC-XCLI-011-03', 'AC-XCLI-012-01'] },
  'TEST-XCLI-003': { file: 'integration/xanthil-local-analysis/local-analysis.integration.test.ts', case: 'analysis-gate-negative-matrix', acs: ['AC-XCLI-002-01', 'AC-XCLI-002-02', 'AC-XCLI-002-03', 'AC-XCLI-002-04'] },
  'TEST-XCLI-004': { file: 'unit/xanthil-local-analysis/local-analysis.unit.test.ts', case: 'closed-run-shapes', acs: ['AC-XCLI-003-01', 'AC-XCLI-009-01', 'AC-XCLI-010-01', 'AC-XCLI-010-02', 'AC-XCLI-016-02'] },
  'TEST-XCLI-005': { file: 'unit/xanthil-local-analysis/local-analysis.unit.test.ts', case: 'evidence-catalog-integrity', acs: ['AC-XCLI-011-01', 'AC-XCLI-011-02', 'AC-XCLI-011-03', 'AC-XCLI-012-02', 'AC-XCLI-012-03', 'AC-XCLI-015-01'] },
  'TEST-XCLI-006': { file: 'contract/xanthil-local-analysis/local-analysis-ports.contract.test.ts', case: 'agent-runtime-negative-contract', acs: ['AC-XCLI-006-01', 'AC-XCLI-006-02', 'AC-XCLI-006-03', 'AC-XCLI-007-01', 'AC-XCLI-007-02', 'AC-XCLI-007-03', 'AC-XCLI-007-04', 'AC-XCLI-007-05', 'AC-XCLI-007-06', 'AC-XCLI-013-02', 'AC-XCLI-013-03'] },
  'TEST-XCLI-007': { file: 'contract/xanthil-local-analysis/local-analysis-ports.contract.test.ts', case: 'local-analysis-negative-contract', acs: ['AC-XCLI-004-01', 'AC-XCLI-004-02', 'AC-XCLI-005-01', 'AC-XCLI-005-02', 'AC-XCLI-005-03', 'AC-XCLI-005-04', 'AC-XCLI-008-01', 'AC-XCLI-008-02', 'AC-XCLI-008-03', 'AC-XCLI-013-03'] },
  'TEST-XCLI-008': { file: 'contract/xanthil-local-analysis/local-analysis-ports.contract.test.ts', case: 'artifact-atomic-contract', acs: ['AC-XCLI-003-01', 'AC-XCLI-003-02', 'AC-XCLI-003-03', 'AC-XCLI-009-01', 'AC-XCLI-009-02', 'AC-XCLI-009-03', 'AC-XCLI-009-04', 'AC-XCLI-010-01', 'AC-XCLI-010-02', 'AC-XCLI-010-03', 'AC-XCLI-013-01', 'AC-XCLI-013-04', 'AC-XCLI-016-02', 'AC-XCLI-016-03'] },
  'TEST-XCLI-009': { file: 'integration/xanthil-local-analysis/local-analysis.integration.test.ts', case: 'preflight-confirmation-matrix', acs: ['AC-XCLI-001-01', 'AC-XCLI-001-02', 'AC-XCLI-002-01', 'AC-XCLI-002-02', 'AC-XCLI-002-03', 'AC-XCLI-002-04', 'AC-XCLI-003-01', 'AC-XCLI-003-02'] },
  'TEST-XCLI-010': { file: 'integration/xanthil-local-analysis/local-analysis.integration.test.ts', case: 'deterministic-use-case', acs: ['AC-XCLI-003-03', 'AC-XCLI-004-01', 'AC-XCLI-005-01', 'AC-XCLI-006-01', 'AC-XCLI-010-01', 'AC-XCLI-011-01', 'AC-XCLI-012-01', 'AC-XCLI-012-02', 'AC-XCLI-015-01', 'AC-XCLI-015-02'] },
  'TEST-XCLI-011': { file: 'integration/xanthil-local-analysis/local-analysis.integration.test.ts', case: 'pi-readiness-no-call', acs: ['AC-XCLI-001-01', 'AC-XCLI-001-02', 'AC-XCLI-007-01', 'AC-XCLI-007-02', 'AC-XCLI-007-03', 'AC-XCLI-014-01', 'AC-XCLI-014-02', 'AC-XCLI-015-01'] },
  'TEST-XCLI-012': { file: 'integration/xanthil-local-analysis/local-analysis.integration.test.ts', case: 'duckdb-python-business-operations', acs: ['AC-XCLI-005-01', 'AC-XCLI-005-02', 'AC-XCLI-005-03', 'AC-XCLI-005-04', 'AC-XCLI-008-01', 'AC-XCLI-008-02', 'AC-XCLI-008-03'] },
  'TEST-XCLI-013': { file: 'e2e/xanthil-local-analysis/local-analysis.e2e.test.ts', case: 'deterministic-cli-journey', acs: ['AC-XCLI-001-01', 'AC-XCLI-002-01', 'AC-XCLI-002-03', 'AC-XCLI-005-01', 'AC-XCLI-006-01', 'AC-XCLI-007-02', 'AC-XCLI-011-01', 'AC-XCLI-012-01', 'AC-XCLI-015-01', 'AC-XCLI-016-01'] },
  'TEST-XCLI-014': { file: 'unit/xanthil-local-analysis/local-analysis.unit.test.ts', case: 'security-negative-matrix', acs: ['AC-XCLI-001-02', 'AC-XCLI-004-02', 'AC-XCLI-004-03', 'AC-XCLI-006-01', 'AC-XCLI-006-02', 'AC-XCLI-006-03', 'AC-XCLI-014-01', 'AC-XCLI-014-02', 'AC-XCLI-014-03'] },
  'TEST-XCLI-015': { file: 'unit/xanthil-local-analysis/local-analysis.unit.test.ts', case: 'failure-timeout-cancel-no-retry', acs: ['AC-XCLI-002-04', 'AC-XCLI-010-02', 'AC-XCLI-013-01', 'AC-XCLI-013-02', 'AC-XCLI-013-03', 'AC-XCLI-013-04'] },
  'TEST-XCLI-016': { file: 'contract/xanthil-local-analysis/local-analysis-ports.contract.test.ts', case: 'artifact-fault-preserves-non-success', acs: ['AC-XCLI-009-02', 'AC-XCLI-009-04', 'AC-XCLI-010-03', 'AC-XCLI-013-04'] },
  'TEST-XCLI-017': { file: 'unit/xanthil-local-analysis/local-analysis.unit.test.ts', case: 'offline-reproduction', acs: ['AC-XCLI-011-02', 'AC-XCLI-012-02', 'AC-XCLI-015-01', 'AC-XCLI-015-02'] },
  'TEST-XCLI-018': { file: 'unit/xanthil-local-analysis/local-analysis.unit.test.ts', case: 'markdown-projection-drift', acs: ['AC-XCLI-012-01', 'AC-XCLI-012-02', 'AC-XCLI-012-03'] },
  'TEST-XCLI-019': { file: 'integration/xanthil-local-analysis/local-analysis.integration.test.ts', case: 'personal-composition-no-write', acs: ['AC-XCLI-016-01', 'AC-XCLI-016-02', 'AC-XCLI-016-03'] },
  'TEST-XCLI-020': { file: 'e2e/xanthil-local-analysis/local-analysis.e2e.test.ts', case: 'unavailable-cli-commands', acs: ['AC-XCLI-014-03', 'AC-XCLI-016-04'] },
  'TEST-XCLI-021': { file: 'integration/xanthil-local-analysis/local-analysis.integration.test.ts', case: 'authorized-install-only', acs: ['AC-XCLI-001-01', 'AC-XCLI-007-01', 'AC-XCLI-008-01', 'AC-XCLI-016-01'] },
  'TEST-XCLI-022': { file: 'integration/xanthil-local-analysis/local-analysis.integration.test.ts', case: 'actual-target-and-artifact-scan', acs: ['AC-XCLI-016-01', 'AC-XCLI-016-04'] },
});

export const coverageMap = Object.freeze(Object.fromEntries(
  Object.entries(coverageCases).flatMap(([label, entry]) => entry.acs.map((ac) => [ac, { label, file: entry.file, case: entry.case }])),
));
