import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { b1CoverageMap, b2CoverageMap, coverageMap, guiCoverageMap } from '../../fixtures/xanthil-desktop/coverage-map.ts';
import { allDesktopAcceptanceCriteria, assertDesktopFixtureHealth, b1TestCoverage, b2TestCoverage, desktopAcceptanceCases, guiTestCoverage } from '../../fixtures/xanthil-desktop/desktop-fixtures.ts';

const escapeRegexLiteral = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const approvedAutomatedOwnerFiles = new Set([
  'contract/xanthil-desktop/xanthil-desktop-analysis.contract.test.ts',
  'contract/xanthil-desktop/xanthil-desktop-assistance.contract.test.ts',
  'contract/xanthil-desktop/xanthil-desktop-ipc.contract.test.ts',
  'contract/xanthil-desktop/xanthil-desktop-store.contract.test.ts',
  'e2e/xanthil-desktop/xanthil-desktop.e2e.test.ts',
  'integration/xanthil-desktop/xanthil-desktop-application.integration.test.ts',
  'tools/harness/validation/run.test.mjs',
]);

const approvedManualEndpointAc = 'AC-XDESK-012-05';
const approvedManualEndpointObligation = 'records the separate same-build normal no-debug native-chooser acceptance';
const approvedManualEndpointMarker = `${approvedManualEndpointAc}: ${approvedManualEndpointObligation}`;
const manualEndpointCommentJoin = String.raw`(?:[ \t]+|[ \t]*\r?\n[ \t]*//[ \t]*)`;
const approvedManualEndpointPattern = new RegExp(
  String.raw`^[ \t]*//[ \t]*${approvedManualEndpointMarker.split(' ').map(escapeRegexLiteral).join(manualEndpointCommentJoin)}(?:\.[^\r\n]*)?[ \t]*\r?$`,
  'm',
);

test('Desktop test fixture and 91-AC coverage map health are independent of missing production behavior', async () => {
  assert.match(`// ${approvedManualEndpointMarker}.`, approvedManualEndpointPattern, 'the full manual obligation may remain on one comment line');
  assert.match('// AC-XDESK-012-05: records the separate same-build normal no-debug native-chooser\n// acceptance.', approvedManualEndpointPattern, 'the full manual obligation may wrap only through the adjacent comment line');
  assert.doesNotMatch(`// AC-XDESK-012-04: ${approvedManualEndpointObligation}.`, approvedManualEndpointPattern, 'a different AC cannot inherit the manual endpoint');
  assert.doesNotMatch(`// ${approvedManualEndpointObligation}.`, approvedManualEndpointPattern, 'the manual endpoint cannot omit its AC');
  assert.doesNotMatch('// AC-XDESK-012-05: records the separate same-build normal no-debug native-chooser', approvedManualEndpointPattern, 'the manual obligation cannot be truncated');
  assert.doesNotMatch('// AC-XDESK-012-05: records the separate same-build normal no-debug native-chooser\nconst interrupted = \'acceptance.\';', approvedManualEndpointPattern, 'a code line cannot impersonate the adjacent manual-marker continuation');
  await assertDesktopFixtureHealth();
  const [desktopSpecification, compatibilitySpecification] = await Promise.all([
    readFile(new URL('../../../openspec/changes/xanthil-desktop-membership-repurchase-decision-case/specs/xanthil-desktop-decision-case/spec.md', import.meta.url), 'utf8'),
    readFile(new URL('../../../openspec/changes/xanthil-desktop-membership-repurchase-decision-case/specs/local-analysis/spec.md', import.meta.url), 'utf8'),
  ]);
  const specified = [...new Set([
    ...(desktopSpecification.match(/AC-XDESK-\d{3}-\d{2}/g) ?? []),
    ...(compatibilitySpecification.match(/AC-XDESK-LA-\d{3}-\d{2}/g) ?? []),
  ])].sort();
  const expected = allDesktopAcceptanceCriteria.slice().sort();
  assert.deepEqual(specified, expected);
  assert.deepEqual(Object.keys(coverageMap).sort(), expected);
  assert.equal(desktopAcceptanceCases.length, 91);
  assert.deepEqual(Object.keys(b1CoverageMap), b1TestCoverage.map((entry) => entry.title), 'B1 keeps its four frozen predecessor titles in execution order');
  assert.equal(b1TestCoverage.filter((entry) => entry.role === 'health-control').length, 1, 'B1 has one independent loader health control');
  for (const entry of b1TestCoverage) {
    assert.ok(entry.requirements.length > 0, `${entry.title} must be derived from a named Requirement`);
    assert.ok(entry.acceptanceCriteria.length > 0, `${entry.title} must be derived from named Acceptance Criteria`);
    for (const acceptanceCriterion of entry.acceptanceCriteria) assert.ok(expected.includes(acceptanceCriterion), `${entry.title} may map only a frozen AC`);
    assert.deepEqual(b1CoverageMap[entry.title], {
      role: entry.role,
      requirements: entry.requirements,
      acceptanceCriteria: entry.acceptanceCriteria,
    }, `${entry.title} must retain its exact REQ/AC map`);
  }
  assert.equal(b1CoverageMap['U1.1 H-B1-LOAD: distinguishes the exact Electron boundary from unrelated loader failure']!.role, 'health-control', 'the loader control remains health evidence rather than terminal AC behavior coverage');
  assert.deepEqual(Object.keys(b2CoverageMap), b2TestCoverage.map((entry) => entry.title), 'B2 keeps its frozen loader/component/mount predecessor titles in execution order');
  assert.equal(b2TestCoverage.filter((entry) => entry.role === 'health-control').length, 1, 'B2 has one independent TSX loader health control');
  for (const entry of b2TestCoverage) {
    assert.ok(entry.requirements.length > 0, `${entry.title} must be derived from a named Requirement`);
    assert.ok(entry.acceptanceCriteria.length > 0, `${entry.title} must be derived from named Acceptance Criteria`);
    for (const acceptanceCriterion of entry.acceptanceCriteria) assert.ok(expected.includes(acceptanceCriterion), `${entry.title} may map only a frozen AC`);
    assert.deepEqual(b2CoverageMap[entry.title], {
      role: entry.role,
      requirements: entry.requirements,
      acceptanceCriteria: entry.acceptanceCriteria,
    }, `${entry.title} must retain its exact REQ/AC map`);
  }
  assert.equal(b2CoverageMap['U1.1 H-B2-LOAD: distinguishes valid pinned TSX render from diagnostics and exact missing Renderer']!.role, 'health-control', 'the TSX control remains health evidence rather than terminal AC behavior coverage');
  assert.deepEqual(Object.keys(guiCoverageMap), guiTestCoverage.map((entry) => entry.title), 'GUI keeps its frozen package-control and runtime-safety predecessors in execution order');
  assert.equal(guiTestCoverage.filter((entry) => entry.role === 'health-control').length, 1, 'GUI has one independent package identity and launch health control');
  for (const entry of guiTestCoverage) {
    assert.ok(entry.requirements.length > 0, `${entry.title} must be derived from a named Requirement`);
    assert.ok(entry.acceptanceCriteria.length > 0, `${entry.title} must be derived from named Acceptance Criteria`);
    for (const acceptanceCriterion of entry.acceptanceCriteria) assert.ok(expected.includes(acceptanceCriterion), `${entry.title} may map only a frozen AC`);
    assert.deepEqual(guiCoverageMap[entry.title], {
      role: entry.role,
      requirements: entry.requirements,
      acceptanceCriteria: entry.acceptanceCriteria,
    }, `${entry.title} must retain its exact REQ/AC map`);
  }
  assert.equal(guiCoverageMap['U1.1 H-GUI-CONTROL: launches the frozen package and rejects a wrong executable identity before behavior']!.role, 'health-control', 'package identity and launch control remain health evidence rather than terminal AC behavior coverage');
  for (const [acceptanceCriterion, owner] of Object.entries(coverageMap)) {
    assert.ok(owner, `${acceptanceCriterion} must have one executable terminal owner`);
    assert.match(owner.label, /^TEST-XDESK-\d{3}$/);
    assert.ok(approvedAutomatedOwnerFiles.has(owner.file), `${acceptanceCriterion} must retain one closed approved test owner`);
    assert.match(owner.case, new RegExp(`^(?:U1\\.(?:1|2) )?${acceptanceCriterion}: `));
    assert.ok(owner.assertion.length > 20, `${acceptanceCriterion} needs an observable assertion purpose`);
    assert.ok(['automated', 'manual-post-green'].includes(owner.execution));
    const source = await readFile(new URL(owner.file.startsWith('tools/') ? `../../../${owner.file}` : `../../../tests/${owner.file}`, import.meta.url), 'utf8');
    if (owner.execution === 'automated') {
      assert.match(source, new RegExp(`test\\('${escapeRegexLiteral(owner.case)}'`), `${acceptanceCriterion} must name a concrete executable leaf, not only a map row`);
      assert.match(source, /assert\.(?:equal|deepEqual|rejects|throws|match|doesNotMatch|ok)/, `${acceptanceCriterion} owner must contain observable assertion code`);
    } else {
      assert.equal(acceptanceCriterion, approvedManualEndpointAc, 'only the approved manual acceptance endpoint may use this marker');
      assert.match(source, approvedManualEndpointPattern, `${acceptanceCriterion} remains the approved post-GREEN manual acceptance endpoint`);
    }
  }
  const u12AcceptanceCriteria = [
    'AC-XDESK-002-02', 'AC-XDESK-002-03', 'AC-XDESK-002-06',
    'AC-XDESK-011-01', 'AC-XDESK-011-02', 'AC-XDESK-011-03',
    'AC-XDESK-011-06', 'AC-XDESK-011-08',
  ];
  assert.deepEqual(
    desktopAcceptanceCases
      .filter((entry) => entry.loop === 'U1.2')
      .map((entry) => entry.id)
      .sort(),
    u12AcceptanceCriteria.slice().sort(),
    'U1.2 owns exactly fresh/existing Project admission; Session atomicity and later business behavior remain outside this loop',
  );
  assert.equal(Object.keys(coverageMap).some((id) => id.startsWith('AC-XTS-')), false, 'compatibility ACs retain their frozen AC-XDESK-LA identities');
});
