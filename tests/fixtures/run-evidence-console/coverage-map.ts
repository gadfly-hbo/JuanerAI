export const coverageMap = Object.freeze({
  'TEST-REC-001': ['AC-REC-002-01', 'AC-REC-002-02', 'AC-REC-002-03'],
  'TEST-REC-002': ['AC-REC-003-01', 'AC-REC-003-02', 'AC-REC-003-03'],
  'TEST-REC-003': ['AC-REC-004-01', 'AC-REC-004-02', 'AC-REC-004-03', 'AC-REC-005-03'],
  'TEST-REC-004': ['AC-REC-001-01', 'AC-REC-001-02', 'AC-REC-001-03', 'AC-REC-005-01', 'AC-REC-005-02', 'AC-REC-005-03', 'AC-REC-006-01', 'AC-REC-006-02', 'AC-REC-006-03'],
  'TEST-REC-005': ['AC-REC-002-01', 'AC-REC-002-02', 'AC-REC-004-01', 'AC-REC-005-01', 'AC-REC-005-03'],
  'TEST-REC-006': ['AC-REC-003-01', 'AC-REC-003-03', 'AC-REC-004-01', 'AC-REC-004-02', 'AC-REC-004-03'],
  'TEST-REC-007': ['AC-REC-003-02', 'AC-REC-005-03'],
  'TEST-REC-008': ['AC-REC-001-02', 'AC-REC-004-02', 'AC-REC-005-01', 'AC-REC-005-02', 'AC-REC-005-03'],
  'TEST-REC-009': ['AC-REC-001-01', 'AC-REC-001-02', 'AC-REC-001-03', 'AC-REC-001-04', 'AC-REC-003-02', 'AC-REC-005-04', 'AC-REC-007-01', 'AC-REC-007-02'],
  'TEST-REC-010': ['AC-REC-006-01', 'AC-REC-006-02', 'AC-REC-006-03', 'AC-REC-007-03', 'AC-REC-007-04', 'AC-REC-007-05'],
});

export const lifecycleLedger = Object.freeze([
  ['tests/unit/run-evidence-console/run-evidence.unit.test.ts', 'permanent regression', 'TEST-REC-001..003,010', 'Reader Core admission/projection'],
  ['tests/contract/run-evidence-console/run-evidence-reader.contract.test.ts', 'permanent regression', 'TEST-REC-004', 'replaceable Reader Port'],
  ['tests/integration/run-evidence-console/run-evidence-reader.integration.test.ts', 'permanent regression', 'TEST-REC-005..008,010', 'local Adapter and side-effect boundary'],
  ['tests/e2e/run-evidence-console/xanthil-console.e2e.test.ts', 'permanent regression', 'TEST-REC-009', 'loopback Experience'],
  ['tests/fixtures/run-evidence-console/run-evidence-fixtures.ts', 'permanent regression', 'TEST-REC-001,005..009', 'unit/integration/E2E fixture producer'],
  ['tests/fixtures/run-evidence-console/run-evidence-reader-contract.ts', 'permanent regression', 'TEST-REC-004', 'unchanged Port contract driver/double'],
  ['tests/fixtures/run-evidence-console/console-harness.ts', 'permanent regression', 'TEST-REC-009', 'E2E process/HTTP lifecycle'],
  ['tests/fixtures/run-evidence-console/coverage-map.ts', 'permanent regression', 'TEST-REC-001..010', 'Controller retirement/traceability consumer'],
] as const);
