// This map is test-private traceability. `label` is the exact TEST identifier
// present in the executable test title; `case` names the assertion group in it.
export const coverageCases = Object.freeze({
  'TEST-XCLI-001': { file: 'unit/xanthil-local-analysis/local-analysis.unit.test.ts', case: 'fixture-oracle-and-mutants', acs: ['AC-XCLI-004-01', 'AC-XCLI-004-02', 'AC-XCLI-005-01', 'AC-XCLI-005-03', 'AC-XCLI-005-04'] },
  'TEST-XCLI-002': { file: 'unit/xanthil-local-analysis/local-analysis.unit.test.ts', case: 'bounded-finding-matrix', acs: ['AC-XCLI-005-02', 'AC-XCLI-005-03', 'AC-XCLI-011-01', 'AC-XCLI-011-03', 'AC-XCLI-012-01'] },
  'TEST-XCLI-004': { file: 'unit/xanthil-local-analysis/local-analysis.unit.test.ts', case: 'closed-run-shapes', acs: ['AC-XCLI-003-01', 'AC-XCLI-009-01', 'AC-XCLI-009-03', 'AC-XCLI-010-01', 'AC-XCLI-010-02', 'AC-XCLI-015-01', 'AC-XCLI-016-02'] },
  'TEST-XCLI-005': { file: 'unit/xanthil-local-analysis/local-analysis.unit.test.ts', case: 'evidence-catalog-integrity', acs: ['AC-XCLI-011-01', 'AC-XCLI-011-02', 'AC-XCLI-011-03', 'AC-XCLI-012-02', 'AC-XCLI-012-03', 'AC-XCLI-015-01'] },
  'TEST-XCLI-014': { file: 'unit/xanthil-local-analysis/local-analysis.unit.test.ts', case: 'security-negative-matrix', acs: ['AC-XCLI-001-02', 'AC-XCLI-004-02', 'AC-XCLI-004-03', 'AC-XCLI-006-01', 'AC-XCLI-006-02', 'AC-XCLI-006-03', 'AC-XCLI-014-01', 'AC-XCLI-014-02', 'AC-XCLI-014-03'] },
  'TEST-XCLI-015': { file: 'unit/xanthil-local-analysis/local-analysis.unit.test.ts', case: 'failure-timeout-cancel-no-retry', acs: ['AC-XCLI-002-04', 'AC-XCLI-010-02', 'AC-XCLI-013-01', 'AC-XCLI-013-02', 'AC-XCLI-013-03', 'AC-XCLI-013-04'] },
  'TEST-XCLI-017': { file: 'unit/xanthil-local-analysis/local-analysis.unit.test.ts', case: 'offline-reproduction', acs: ['AC-XCLI-011-02', 'AC-XCLI-012-02', 'AC-XCLI-015-01', 'AC-XCLI-015-02'] },
  'TEST-XCLI-018': { file: 'unit/xanthil-local-analysis/local-analysis.unit.test.ts', case: 'markdown-projection-drift', acs: ['AC-XCLI-012-01', 'AC-XCLI-012-02', 'AC-XCLI-012-03'] },
});

/** A/B retired requirement identifiers remain explicit historical metadata;
 * a surviving title is not runtime evidence for a retired execution contract. */
export const retiredCoverageIds=Object.freeze(['AC-XCLI-001-02','AC-XCLI-002-04','AC-XCLI-003-01','AC-XCLI-006-01','AC-XCLI-006-02','AC-XCLI-006-03','AC-XCLI-009-01','AC-XCLI-009-03','AC-XCLI-013-02','AC-XCLI-013-03','AC-XCLI-016-02']);
/** Do not fabricate replacement CLI proof or independent acceptance from labels.
 * D has separate current Store/native-entry evidence, not old CLI-format parity. */
export const pendingCoverage=Object.freeze({
 'AC-XCLI-009-02':{status:'NOT_RUN',reason:'Current D Store transactions/immutable outcomes replace old CLI run-folder publication; exact old CLI asset format is not reactivated.'},
 'AC-XCLI-009-04':{status:'NOT_RUN',reason:'Current D read-only reopening/immutable Outcome evidence is separate from retired CLI terminal artifact writer.'},
 'AC-XCLI-010-03':{status:'NOT_RUN',reason:'Current D UNKNOWN/late-write fencing does not claim compatibility with old CLI lifecycle/terminal files.'},
 'AC-XCLI-016-01':{status:'NOT_RUN',reason:'Independent D validation and activation are not performed by this metadata test.'},
});
export const coverageMap=Object.freeze({...Object.fromEntries(Object.entries(coverageCases).flatMap(([label,entry])=>entry.acs.filter(ac=>!retiredCoverageIds.includes(ac)).map(ac=>[ac,{label,file:entry.file,case:entry.case,status:'REFERENCE_DOMAIN_ONLY'}]))),...pendingCoverage});
