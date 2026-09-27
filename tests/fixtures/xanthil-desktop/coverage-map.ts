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
