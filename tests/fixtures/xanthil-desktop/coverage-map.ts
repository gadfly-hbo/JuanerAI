import { b1TestCoverage, b2TestCoverage, desktopAcceptanceCases, guiTestCoverage } from './desktop-fixtures.ts';

export type CoverageEntry = Readonly<{
  label: string;
  file: string;
  case: string;
  assertion: string;
  execution: 'automated' | 'manual-post-green';
}>;

/**
 * The map is AC-first: a Requirement heading is never a test owner. Each
 * entry names its actual node:test leaf and its observable assertion purpose.
 */
export const coverageMap: Readonly<Record<string, CoverageEntry>> = Object.freeze(
  Object.fromEntries(desktopAcceptanceCases.map((entry) => [
    entry.id,
    Object.freeze({
      label: entry.label,
      file: entry.file,
      // The executable node:test name is frozen with the AC.  Its identity
      // may be more specific than the distinct approved acceptance purpose.
      case: `${entry.loop ? `${entry.loop} ` : ''}${entry.id}: ${entry.testCase ?? entry.assertion}`,
      assertion: entry.assertion,
      execution: entry.execution,
    }),
  ])),
);

/**
 * This companion keeps the B1 predecessor DAG visible without assigning a
 * second terminal owner to any of the frozen 91 acceptance criteria.
 */
export const b1CoverageMap = Object.freeze(
  Object.fromEntries(b1TestCoverage.map((entry) => [
    entry.title,
    Object.freeze({
      role: entry.role,
      requirements: entry.requirements,
      acceptanceCriteria: entry.acceptanceCriteria,
    }),
  ])),
);

/** B2 keeps its loader/component/mount predecessor DAG distinct from terminal AC ownership. */
export const b2CoverageMap = Object.freeze(
  Object.fromEntries(b2TestCoverage.map((entry) => [
    entry.title,
    Object.freeze({
      role: entry.role,
      requirements: entry.requirements,
      acceptanceCriteria: entry.acceptanceCriteria,
    }),
  ])),
);

/** GUI package-control and runtime-safety predecessors stay distinct from the 91 terminal AC owners. */
export const guiCoverageMap = Object.freeze(
  Object.fromEntries(guiTestCoverage.map((entry) => [
    entry.title,
    Object.freeze({
      role: entry.role,
      requirements: entry.requirements,
      acceptanceCriteria: entry.acceptanceCriteria,
    }),
  ])),
);

/** D006 scope ledger. Historical 91 owners are preserved; missing/retired exact
 * predecessor evidence never becomes PASS from a metadata check. */
export const retiredDesktopAcceptanceCriteria=Object.freeze([
  "AC-XDESK-010-01",
  "AC-XDESK-010-03",
  "AC-XDESK-010-04",
  "AC-XDESK-010-05",
  "AC-XDESK-012-02",
  "AC-XDESK-LA-001-01",
  "AC-XDESK-LA-001-02",
  "AC-XDESK-LA-002-01",
  "AC-XDESK-LA-002-02",
  "AC-XDESK-LA-004-02"
]);
export const currentCoverageDisposition:Readonly<Record<string,Readonly<{status:'RETIRED_A_B'|'NOT_RUN';reason:string}>>>=Object.freeze({
  "AC-XDESK-001-01": {
    "status": "NOT_RUN",
    "reason": "Exact historical Desktop/IPC/GUI leaf is not active after A/B. Current D business/native/normal-Browser evidence is scoped separately; no old shell/compatibility or Product Acceptance is inferred."
  },
  "AC-XDESK-001-02": {
    "status": "NOT_RUN",
    "reason": "Exact historical Desktop/IPC/GUI leaf is not active after A/B. Current D business/native/normal-Browser evidence is scoped separately; no old shell/compatibility or Product Acceptance is inferred."
  },
  "AC-XDESK-001-03": {
    "status": "NOT_RUN",
    "reason": "Exact historical Desktop/IPC/GUI leaf is not active after A/B. Current D business/native/normal-Browser evidence is scoped separately; no old shell/compatibility or Product Acceptance is inferred."
  },
  "AC-XDESK-001-04": {
    "status": "NOT_RUN",
    "reason": "Exact historical Desktop/IPC/GUI leaf is not active after A/B. Current D business/native/normal-Browser evidence is scoped separately; no old shell/compatibility or Product Acceptance is inferred."
  },
  "AC-XDESK-001-05": {
    "status": "NOT_RUN",
    "reason": "Exact historical Desktop/IPC/GUI leaf is not active after A/B. Current D business/native/normal-Browser evidence is scoped separately; no old shell/compatibility or Product Acceptance is inferred."
  },
  "AC-XDESK-002-03": {
    "status": "NOT_RUN",
    "reason": "Exact historical Desktop/IPC/GUI leaf is not active after A/B. Current D business/native/normal-Browser evidence is scoped separately; no old shell/compatibility or Product Acceptance is inferred."
  },
  "AC-XDESK-006-01": {
    "status": "NOT_RUN",
    "reason": "Exact historical Desktop/IPC/GUI leaf is not active after A/B. Current D business/native/normal-Browser evidence is scoped separately; no old shell/compatibility or Product Acceptance is inferred."
  },
  "AC-XDESK-006-02": {
    "status": "NOT_RUN",
    "reason": "Exact historical Desktop/IPC/GUI leaf is not active after A/B. Current D business/native/normal-Browser evidence is scoped separately; no old shell/compatibility or Product Acceptance is inferred."
  },
  "AC-XDESK-006-03": {
    "status": "NOT_RUN",
    "reason": "Exact historical Desktop/IPC/GUI leaf is not active after A/B. Current D business/native/normal-Browser evidence is scoped separately; no old shell/compatibility or Product Acceptance is inferred."
  },
  "AC-XDESK-006-04": {
    "status": "NOT_RUN",
    "reason": "Exact historical Desktop/IPC/GUI leaf is not active after A/B. Current D business/native/normal-Browser evidence is scoped separately; no old shell/compatibility or Product Acceptance is inferred."
  },
  "AC-XDESK-006-05": {
    "status": "NOT_RUN",
    "reason": "Exact historical Desktop/IPC/GUI leaf is not active after A/B. Current D business/native/normal-Browser evidence is scoped separately; no old shell/compatibility or Product Acceptance is inferred."
  },
  "AC-XDESK-006-06": {
    "status": "NOT_RUN",
    "reason": "Exact historical Desktop/IPC/GUI leaf is not active after A/B. Current D business/native/normal-Browser evidence is scoped separately; no old shell/compatibility or Product Acceptance is inferred."
  },
  "AC-XDESK-006-07": {
    "status": "NOT_RUN",
    "reason": "Exact historical Desktop/IPC/GUI leaf is not active after A/B. Current D business/native/normal-Browser evidence is scoped separately; no old shell/compatibility or Product Acceptance is inferred."
  },
  "AC-XDESK-006-08": {
    "status": "NOT_RUN",
    "reason": "Exact historical Desktop/IPC/GUI leaf is not active after A/B. Current D business/native/normal-Browser evidence is scoped separately; no old shell/compatibility or Product Acceptance is inferred."
  },
  "AC-XDESK-007-05": {
    "status": "NOT_RUN",
    "reason": "Exact historical Desktop/IPC/GUI leaf is not active after A/B. Current D business/native/normal-Browser evidence is scoped separately; no old shell/compatibility or Product Acceptance is inferred."
  },
  "AC-XDESK-007-07": {
    "status": "NOT_RUN",
    "reason": "Exact historical Desktop/IPC/GUI leaf is not active after A/B. Current D business/native/normal-Browser evidence is scoped separately; no old shell/compatibility or Product Acceptance is inferred."
  },
  "AC-XDESK-009-01": {
    "status": "NOT_RUN",
    "reason": "Exact historical Desktop/IPC/GUI leaf is not active after A/B. Current D business/native/normal-Browser evidence is scoped separately; no old shell/compatibility or Product Acceptance is inferred."
  },
  "AC-XDESK-009-02": {
    "status": "NOT_RUN",
    "reason": "Exact historical Desktop/IPC/GUI leaf is not active after A/B. Current D business/native/normal-Browser evidence is scoped separately; no old shell/compatibility or Product Acceptance is inferred."
  },
  "AC-XDESK-009-03": {
    "status": "NOT_RUN",
    "reason": "Exact historical Desktop/IPC/GUI leaf is not active after A/B. Current D business/native/normal-Browser evidence is scoped separately; no old shell/compatibility or Product Acceptance is inferred."
  },
  "AC-XDESK-009-04": {
    "status": "NOT_RUN",
    "reason": "Exact historical Desktop/IPC/GUI leaf is not active after A/B. Current D business/native/normal-Browser evidence is scoped separately; no old shell/compatibility or Product Acceptance is inferred."
  },
  "AC-XDESK-009-05": {
    "status": "NOT_RUN",
    "reason": "Exact historical Desktop/IPC/GUI leaf is not active after A/B. Current D business/native/normal-Browser evidence is scoped separately; no old shell/compatibility or Product Acceptance is inferred."
  },
  "AC-XDESK-009-06": {
    "status": "NOT_RUN",
    "reason": "Exact historical Desktop/IPC/GUI leaf is not active after A/B. Current D business/native/normal-Browser evidence is scoped separately; no old shell/compatibility or Product Acceptance is inferred."
  },
  "AC-XDESK-010-01": {
    "status": "RETIRED_A_B",
    "reason": "Removed from the current specification in accepted A/B; original criterion and predecessor owner remain frozen here."
  },
  "AC-XDESK-010-02": {
    "status": "NOT_RUN",
    "reason": "Exact historical Desktop/IPC/GUI leaf is not active after A/B. Current D business/native/normal-Browser evidence is scoped separately; no old shell/compatibility or Product Acceptance is inferred."
  },
  "AC-XDESK-010-03": {
    "status": "RETIRED_A_B",
    "reason": "Removed from the current specification in accepted A/B; original criterion and predecessor owner remain frozen here."
  },
  "AC-XDESK-010-04": {
    "status": "RETIRED_A_B",
    "reason": "Removed from the current specification in accepted A/B; original criterion and predecessor owner remain frozen here."
  },
  "AC-XDESK-010-05": {
    "status": "RETIRED_A_B",
    "reason": "Removed from the current specification in accepted A/B; original criterion and predecessor owner remain frozen here."
  },
  "AC-XDESK-012-01": {
    "status": "NOT_RUN",
    "reason": "Exact historical Desktop/IPC/GUI leaf is not active after A/B. Current D business/native/normal-Browser evidence is scoped separately; no old shell/compatibility or Product Acceptance is inferred."
  },
  "AC-XDESK-012-02": {
    "status": "RETIRED_A_B",
    "reason": "Removed from the current specification in accepted A/B; original criterion and predecessor owner remain frozen here."
  },
  "AC-XDESK-012-03": {
    "status": "NOT_RUN",
    "reason": "Exact historical Desktop/IPC/GUI leaf is not active after A/B. Current D business/native/normal-Browser evidence is scoped separately; no old shell/compatibility or Product Acceptance is inferred."
  },
  "AC-XDESK-012-04": {
    "status": "NOT_RUN",
    "reason": "Exact historical Desktop/IPC/GUI leaf is not active after A/B. Current D business/native/normal-Browser evidence is scoped separately; no old shell/compatibility or Product Acceptance is inferred."
  },
  "AC-XDESK-012-05": {
    "status": "NOT_RUN",
    "reason": "Exact historical Desktop/IPC/GUI leaf is not active after A/B. Current D business/native/normal-Browser evidence is scoped separately; no old shell/compatibility or Product Acceptance is inferred."
  },
  "AC-XDESK-012-06": {
    "status": "NOT_RUN",
    "reason": "Exact historical Desktop/IPC/GUI leaf is not active after A/B. Current D business/native/normal-Browser evidence is scoped separately; no old shell/compatibility or Product Acceptance is inferred."
  },
  "AC-XDESK-012-07": {
    "status": "NOT_RUN",
    "reason": "Exact historical Desktop/IPC/GUI leaf is not active after A/B. Current D business/native/normal-Browser evidence is scoped separately; no old shell/compatibility or Product Acceptance is inferred."
  },
  "AC-XDESK-LA-001-01": {
    "status": "RETIRED_A_B",
    "reason": "Removed from the current specification in accepted A/B; original criterion and predecessor owner remain frozen here."
  },
  "AC-XDESK-LA-001-02": {
    "status": "RETIRED_A_B",
    "reason": "Removed from the current specification in accepted A/B; original criterion and predecessor owner remain frozen here."
  },
  "AC-XDESK-LA-001-03": {
    "status": "NOT_RUN",
    "reason": "Exact historical Desktop/IPC/GUI leaf is not active after A/B. Current D business/native/normal-Browser evidence is scoped separately; no old shell/compatibility or Product Acceptance is inferred."
  },
  "AC-XDESK-LA-001-04": {
    "status": "NOT_RUN",
    "reason": "Exact historical Desktop/IPC/GUI leaf is not active after A/B. Current D business/native/normal-Browser evidence is scoped separately; no old shell/compatibility or Product Acceptance is inferred."
  },
  "AC-XDESK-LA-002-01": {
    "status": "RETIRED_A_B",
    "reason": "Removed from the current specification in accepted A/B; original criterion and predecessor owner remain frozen here."
  },
  "AC-XDESK-LA-002-02": {
    "status": "RETIRED_A_B",
    "reason": "Removed from the current specification in accepted A/B; original criterion and predecessor owner remain frozen here."
  },
  "AC-XDESK-LA-002-03": {
    "status": "NOT_RUN",
    "reason": "Exact historical Desktop/IPC/GUI leaf is not active after A/B. Current D business/native/normal-Browser evidence is scoped separately; no old shell/compatibility or Product Acceptance is inferred."
  },
  "AC-XDESK-LA-002-04": {
    "status": "NOT_RUN",
    "reason": "Exact historical Desktop/IPC/GUI leaf is not active after A/B. Current D business/native/normal-Browser evidence is scoped separately; no old shell/compatibility or Product Acceptance is inferred."
  },
  "AC-XDESK-LA-004-02": {
    "status": "RETIRED_A_B",
    "reason": "Removed from the current specification in accepted A/B; original criterion and predecessor owner remain frozen here."
  }
});
