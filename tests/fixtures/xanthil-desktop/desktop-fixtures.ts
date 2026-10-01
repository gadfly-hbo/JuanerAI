import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { isAbsolute, join } from 'node:path';

/** Fixture observation of the same selected executable used by the real Adapter. */
export function readDesktopPythonTool(toolchain: string) {
  assert.ok(isAbsolute(toolchain), 'absolute selected toolchain required');
  const pythonExecutable = join(toolchain, 'python3');
  const pythonVersion = execFileSync(pythonExecutable, ['-I', '-c', "import sys,json,csv,io,base64,datetime; from zoneinfo import ZoneInfo; from fractions import Fraction; assert sys.version_info >= (3,9); assert str(ZoneInfo('Asia/Shanghai')) == 'Asia/Shanghai'; print('.'.join(map(str,sys.version_info[:3])))"], { encoding: 'utf8', timeout: 10000, maxBuffer: 65536, env: { PATH: '/usr/bin:/bin' } }).trim();
  assert.match(pythonVersion, /^3\.(?:9|[1-9]\d)\.\d+$/, 'observed Python version must meet the existing >=3.9 contract');
  return Object.freeze({ pythonExecutable, pythonVersion });
}

export const desktopAcceptanceCriteria = Object.freeze({
  'REQ-XDESK-001': 5,
  'REQ-XDESK-002': 6,
  'REQ-XDESK-003': 5,
  'REQ-XDESK-004': 7,
  'REQ-XDESK-005': 7,
  'REQ-XDESK-006': 8,
  'REQ-XDESK-007': 7,
  'REQ-XDESK-008': 7,
  'REQ-XDESK-009': 6,
  'REQ-XDESK-010': 6,
  'REQ-XDESK-011': 8,
  'REQ-XDESK-012': 7,
  'REQ-XTS-001': 4,
  'REQ-XTS-002': 4,
  'REQ-XTS-004': 4,
});

const acceptancePrefixByRequirement: Readonly<Record<string, string>> = Object.freeze({
  'REQ-XDESK-001': 'AC-XDESK-001',
  'REQ-XDESK-002': 'AC-XDESK-002',
  'REQ-XDESK-003': 'AC-XDESK-003',
  'REQ-XDESK-004': 'AC-XDESK-004',
  'REQ-XDESK-005': 'AC-XDESK-005',
  'REQ-XDESK-006': 'AC-XDESK-006',
  'REQ-XDESK-007': 'AC-XDESK-007',
  'REQ-XDESK-008': 'AC-XDESK-008',
  'REQ-XDESK-009': 'AC-XDESK-009',
  'REQ-XDESK-010': 'AC-XDESK-010',
  'REQ-XDESK-011': 'AC-XDESK-011',
  'REQ-XDESK-012': 'AC-XDESK-012',
  'REQ-XTS-001': 'AC-XDESK-LA-001',
  'REQ-XTS-002': 'AC-XDESK-LA-002',
  'REQ-XTS-004': 'AC-XDESK-LA-004',
});

export const allDesktopAcceptanceCriteria = Object.freeze(
  Object.entries(desktopAcceptanceCriteria).flatMap(([requirement, count]) =>
    Array.from({ length: count }, (_, index) => `${acceptancePrefixByRequirement[requirement]}-${String(index + 1).padStart(2, '0')}`),
  ),
);

export type DesktopAcceptanceCase = Readonly<{
  id: string;
  label: string;
  file: string;
  assertion: string;
  execution: 'automated' | 'manual-post-green';
  loop?: 'U1.1' | 'U1.2';
  /** The real leaf title when its durable test identity differs from the AC purpose. */
  testCase?: string;
}>;

/** Closed producer identities accepted by the U1.1 packaged-GUI readback seam. */
export const guiPackageReadbackProducers = Object.freeze([
  Object.freeze({ commandId:'CHANGE003-PACKAGE-001', attempt:'first' }),
  Object.freeze({ commandId:'CHANGE003-PACKAGE-002', attempt:'first' }),
  Object.freeze({ commandId:'CHANGE003-PACKAGE-003', attempt:'first' }),
  Object.freeze({ commandId:'CHANGE003-PACKAGE-004', attempt:'first' }),
  Object.freeze({ commandId:'CHANGE003-PACKAGE-005', attempt:'first' }),
  Object.freeze({ commandId:'CHANGE003-PACKAGE-006', attempt:'first' }),
  Object.freeze({ commandId:'CHANGE002-PACKAGE-001', attempt:'first' }),
  Object.freeze({ commandId:'CHANGE002-PACKAGE-002', attempt:'first' }),
  Object.freeze({ commandId:'CHANGE002-PACKAGE-003', attempt:'first' }),
  Object.freeze({ commandId:'CHANGE002-PACKAGE-004', attempt:'first' }),
  Object.freeze({ commandId:'CHANGE002-PACKAGE-005', attempt:'first' }),
  Object.freeze({ commandId:'CHANGE002-PACKAGE-006', attempt:'first' }),
  Object.freeze({ commandId:'CHANGE002-PACKAGE-007', attempt:'first' }),
  Object.freeze({ commandId:'CHANGE002-PACKAGE-008', attempt:'first' }),
  Object.freeze({ commandId:'CHANGE002-PACKAGE-009', attempt:'first' }),
  Object.freeze({ commandId:'CHANGE002-PACKAGE-010', attempt:'first' }),
  Object.freeze({ commandId:'CHANGE002-PACKAGE-011', attempt:'first' }),
  Object.freeze({ commandId:'CHANGE002-PACKAGE-012', attempt:'first' }),
  Object.freeze({ commandId:'CHANGE002-PACKAGE-013', attempt:'first' }),
  Object.freeze({ commandId:'CHANGE002-PACKAGE-018', attempt:'first' }),
  Object.freeze({ commandId:'CHANGE002-PACKAGE-017', attempt:'first' }),
  Object.freeze({ commandId:'CHANGE002-PACKAGE-016', attempt:'first' }),
  Object.freeze({ commandId:'CHANGE002-PACKAGE-015', attempt:'first' }),
  Object.freeze({ commandId:'CHANGE002-PACKAGE-014', attempt:'first' }),
  Object.freeze({ commandId: 'UI-DEMO-PACKAGE-002', attempt: 'first' }),
  Object.freeze({ commandId: 'UI-DEMO-PACKAGE-003', attempt: 'first' }),
  Object.freeze({ commandId: 'B-PACKAGE-U4-V08', attempt: 'first' }),
  Object.freeze({ commandId: 'B-PACKAGE-U4-V08', attempt: 'correction-1' }),
  Object.freeze({ commandId: 'B-PACKAGE-U4-V08', attempt: 'correction-2' }),
  Object.freeze({ commandId: 'B-PACKAGE-U4-V08', attempt: 'correction-3' }),
  Object.freeze({ commandId: 'B-PACKAGE-U4-V08', attempt: 'correction-4' }),
  Object.freeze({ commandId: 'B-PACKAGE-U4-V08', attempt: 'correction-5' }),
  Object.freeze({ commandId: 'B-PACKAGE-U4-V08', attempt: 'correction-6' }),
  Object.freeze({ commandId: 'B-PACKAGE-U4-V08', attempt: 'correction-7' }),
  Object.freeze({ commandId: 'B-PACKAGE-U4-V08', attempt: 'correction-8' }),
  Object.freeze({ commandId: 'B-PACKAGE-U4-V08', attempt: 'correction-9' }),
  Object.freeze({ commandId: 'B-PACKAGE-U3-V08', attempt: 'first' }),
  Object.freeze({ commandId: 'B-PACKAGE-U3-V08', attempt: 'correction-1' }),
  Object.freeze({ commandId: 'B-PACKAGE-U3-V08', attempt: 'correction-2' }),
  Object.freeze({ commandId: 'B-PACKAGE-U3-V08', attempt: 'correction-3' }),
  Object.freeze({ commandId: 'B-PACKAGE-U2-V08', attempt: 'first' }),
  Object.freeze({ commandId: 'B-PACKAGE-U2-V08', attempt: 'correction-1' }),
  Object.freeze({ commandId: 'B-PACKAGE-U2-V08', attempt: 'correction-2' }),
  Object.freeze({ commandId: 'B-PACKAGE-U2-V08', attempt: 'correction-3' }),
  Object.freeze({ commandId: 'B-PACKAGE-U2-V08', attempt: 'correction-4' }),
  Object.freeze({ commandId: 'B-PACKAGE-U2-V08', attempt: 'correction-5' }),
  Object.freeze({ commandId: 'B-PACKAGE-U2-V08', attempt: 'correction-6' }),
  Object.freeze({ commandId: 'B-PACKAGE-U1-V08', attempt: 'first' }),
  Object.freeze({ commandId: 'B-PACKAGE-U1-V08', attempt: 'correction-1' }),
  Object.freeze({ commandId: 'B-PACKAGE-U1-V08', attempt: 'correction-2' }),
  Object.freeze({ commandId: 'B-PACKAGE-U1-V08', attempt: 'correction-3' }),
  Object.freeze({ commandId: 'B-PACKAGE-B2-U1.1', attempt: 'correction-5' }),
  Object.freeze({ commandId: 'B-PACKAGE-GUI-SAFETY-U1.1', attempt: 'first' }),
  Object.freeze({ commandId: 'B-PACKAGE-GUI-UI-U1.1', attempt: 'first' }),
  Object.freeze({ commandId: 'B-PACKAGE-GUI-ENTRY-REPAIR-U1.1', attempt: 'first' }),
  Object.freeze({ commandId: 'B-PACKAGE-MAIN-MODULE-FORMAT-U1.1', attempt: 'first' }),
] as const);

export const guiPackageReadbackRelativePaths = Object.freeze([
  'Contents/Info.plist',
  'Contents/MacOS/Xanthil',
  'Contents/Resources/app.asar',
  'Contents/Resources/toolchain-deployment.json',
] as const);

export type GuiPackageReadbackProducer = (typeof guiPackageReadbackProducers)[number];

function defineCases(
  requirement: string,
  label: string,
  file: string,
  assertions: readonly string[],
  execution: DesktopAcceptanceCase['execution'] = 'automated',
): readonly DesktopAcceptanceCase[] {
  const prefix = acceptancePrefixByRequirement[requirement];
  return assertions.map((assertion, index) => Object.freeze({
    id: `${prefix}-${String(index + 1).padStart(2, '0')}`,
    label,
    file,
    assertion,
    execution,
  }));
}

function setNormalNativeAcceptance(entry: DesktopAcceptanceCase): DesktopAcceptanceCase {
  return entry.id === 'AC-XDESK-012-05'
    ? Object.freeze({ ...entry, execution: 'manual-post-green' })
    : entry;
}

function setIncrementalLoop(entry: DesktopAcceptanceCase): DesktopAcceptanceCase {
  if (/^AC-XDESK-001-0[1-5]$/.test(entry.id)) {
    return Object.freeze({ ...entry, loop: 'U1.1' });
  }
  if (new Set([
    'AC-XDESK-002-02', 'AC-XDESK-002-03', 'AC-XDESK-002-06',
    'AC-XDESK-011-01', 'AC-XDESK-011-02', 'AC-XDESK-011-03',
    'AC-XDESK-011-06', 'AC-XDESK-011-08',
  ]).has(entry.id)) {
    return Object.freeze({ ...entry, loop: 'U1.2' });
  }
  return entry;
}

/**
 * These leaves retain their approved AC purpose while naming the actual
 * executable test identity.  A coverage map must not relabel a test body to
 * make its owning Requirement easier to infer.
 */
const executableCaseOverrides: Readonly<Record<string, Readonly<Partial<Pick<DesktopAcceptanceCase, 'file' | 'testCase'>>>>> = Object.freeze({
  'AC-XDESK-002-02': Object.freeze({
    file: 'integration/xanthil-desktop/xanthil-desktop-application.integration.test.ts',
    testCase: 'opens fresh and existing Projects without invoking Analysis Run evidence Runtime provider or network effects',
  }),
  'AC-XDESK-002-03': Object.freeze({
    file: 'contract/xanthil-desktop/xanthil-desktop-ipc.contract.test.ts',
    testCase: 'returns one sanitized Project-admission failure before a Project Session receipt directory or external effect exists',
  }),
  'AC-XDESK-002-06': Object.freeze({
    testCase: 'reopens an admitted A1.2 Project with stored identity and bytes, without migration default filling receipt or later-state revival',
  }),
  'AC-XDESK-011-01': Object.freeze({
    testCase: 'opens the real node:sqlite connection only with exact personal-profile PRAGMAs and extension loading disabled',
  }),
  'AC-XDESK-011-02': Object.freeze({
    testCase: 'admits only the exact sixteen-table schema, constrained receipt vocabulary, keys indexes, and two deferred create-session foreign keys',
  }),
  'AC-XDESK-011-03': Object.freeze({
    testCase: 'declares the exact Project Session Case same-owner foreign-key chain with RESTRICT actions and no cross-Project substitution',
  }),
  'AC-XDESK-011-06': Object.freeze({
    testCase: 'admits only the exact A1.2 tuple, applies only native XDK1 hot-journal rollback, and otherwise preserves rejected Project bytes',
  }),
  'AC-XDESK-011-08': Object.freeze({
    testCase: 'starts Project authority from the committed SQLite row and rejects orphan or substitute artifact evidence',
  }),
  'AC-XDESK-007-05': Object.freeze({ file: 'e2e/xanthil-desktop/xanthil-desktop.e2e.test.ts' }),
  'AC-XDESK-007-07': Object.freeze({ file: 'e2e/xanthil-desktop/xanthil-desktop.e2e.test.ts' }),
  'AC-XDESK-009-01': Object.freeze({ testCase: 'real Main exposes only structured-clone Desktop results and never returns an opaque chooser capability or source bytes' }),
  'AC-XDESK-009-02': Object.freeze({ testCase: 'the fixed Main handler object has no navigation, window, permission, shell, URL, devtools, HMR, or arbitrary channel operation' }),
  'AC-XDESK-009-04': Object.freeze({ testCase: 'real Main rejects a non-top sender, wrong version, and malformed request before chooser, file, export, or Application effect' }),
  'AC-XDESK-009-06': Object.freeze({ testCase: 'real Main reload/duplicate delivery returns one durable receipt and refuses changed command bytes without duplicate authority' }),
});

function setExecutableCaseOwner(entry: DesktopAcceptanceCase): DesktopAcceptanceCase {
  const override = executableCaseOverrides[entry.id];
  return override ? Object.freeze({ ...entry, ...override }) : entry;
}

/**
 * Every frozen AC has one named node:test leaf.  The assertion phrase is an
 * independently written acceptance oracle, not a Requirement-wide label.
 */
export const desktopAcceptanceCases = Object.freeze([
  ...defineCases('REQ-XDESK-001', 'TEST-XDESK-009', 'e2e/xanthil-desktop/xanthil-desktop.e2e.test.ts', [
    'launches the packaged arm64 shell with the persistent Xanthil frame',
    'shows the six professional stages with their Chinese acceptance labels',
    'fixed Skill/Prompt information and unlinked Fork/Subagent refusal remain effect-free',
    'proves only the U1.1 shell mode/search surface closes without creating a Session; later Session and background-work continuity remains a later consumer',
    'keeps keyboard focus, modal trapping, drawer recovery, and both approved viewport layouts usable',
  ]),
  ...defineCases('REQ-XDESK-002', 'TEST-XDESK-003', 'contract/xanthil-desktop/xanthil-desktop-store.contract.test.ts', [
    'commits one stable professional Session and its three directories before projection',
    'opens no Runtime, provider, analysis child, aggregate, or report while creating a Session',
    'returns sanitized pre-commit failure without Session row, receipt, directory, or external effect',
    'returns the original receipt for an identical command and conflicts changed bytes',
    'recovers a durable COMMIT through receipt readback and returns RESULT_PENDING when unreadable',
    'reopens only committed Session/Case/revision history with stable identities and no false success',
  ]),
  ...defineCases('REQ-XDESK-003', 'TEST-XDESK-002', 'integration/xanthil-desktop/xanthil-desktop-application.integration.test.ts', [
    'creates sequence-one Draft as the only initial revision',
    'creates a new Draft for each source, mapping, period, status, treatment, or method change',
    'allows only Draft Ready Review NeedsAttention Completed and blocks invalid transitions',
    'keeps current Finding acceptance Closure and report pointers revision-local and historical',
    'keeps Completed authority intact after a failed rerun or later failure',
  ]),
  ...defineCases('REQ-XDESK-004', 'TEST-XDESK-001', 'integration/xanthil-desktop/xanthil-desktop-application.integration.test.ts', [
    'accepts valid UTF-8 comma CSV member and order shapes with exact identifiers',
    'requires the closed mappings CNY timezone periods statuses and one hypothesis/method',
    'blocks malformed rows unknown members and invalid amount or status before any snapshot',
    'normalizes timestamps and rejects unequal or overlapping periods before confirmation',
    'records reviewable treatment counts exact strings and invalidates confirmation on input change',
    'requires the exact Chinese authority confirmation and records its immutable binding',
    'copies both confirmed source byte streams exactly with containment and zero provider egress',
  ]),
  ...defineCases('REQ-XDESK-005', 'TEST-XDESK-005', 'contract/xanthil-desktop/xanthil-desktop-analysis.contract.test.ts', [
    'calculates active repeat rates and second-plus revenue with paid-at then byte-order tie-break',
    'uses checked bigint arithmetic and canonical decimal/rational boundary values',
    'computes M1 deltas and marks zero-denominator relative change not_applicable',
    'computes exact M2 group contributions or the closed not_applicable value',
    'independently agrees on zero rate change without adapter judgment or causal claim',
    'keeps mismatch cancellation deadline interruption and calculation failure free of success artifacts',
    'publishes verified aggregate terminal Run evidence and Finding only after both durable points',
  ]),
  ...defineCases('REQ-XDESK-006', 'TEST-XDESK-006', 'contract/xanthil-desktop/xanthil-desktop-assistance.contract.test.ts', [
    'permits organize_question only with the exact pre-aggregate text/label payload and second free-text confirmation',
    'permits explain_evidence only in Review with the approved aggregate subset',
    'permits draft_candidates only after exact Finding acceptance',
    'binds every disclosure to canonical payload hash provider model categories irretractability and freshness',
    'keeps raw data identifiers paths credentials and Pi internals out of all outbound and retained surfaces',
    'admits at most one Attempt per accepted disclosure and records observed provenance only after response',
    'creates one allowed Draft whose edit/adopt/reject changes only permitted durable fields',
    'settles failure cancellation deadline and interruption as sanitized Attempt without Draft and preserves manual continuation',
  ]),
  ...defineCases('REQ-XDESK-007', 'TEST-XDESK-002', 'integration/xanthil-desktop/xanthil-desktop-application.integration.test.ts', [
    'creates a review Finding and draft report from agreeing evidence without inferred acceptance',
    'records accept decline defer and request-more-evidence as distinct non-closure dispositions',
    'requires two closed-shape candidates with stable IDs and reasoned optional preference',
    'requires a non-empty insufficient-evidence reason and forbids a preferred candidate there',
    'completes only one accepted Finding plus valid saved route into Closure final report and Completed',
    'keeps earlier accepted Finding Closure and report versions immutable across failed reruns',
    'exports marked UTF-8 Markdown/HTML provenance without creating a business conclusion',
  ]),
  ...defineCases('REQ-XDESK-008', 'TEST-XDESK-007', 'integration/xanthil-desktop/xanthil-desktop-application.integration.test.ts', [
    'admits only one mutually-exclusive Running Run or Attempt with immediate effect-free conflict',
    'uses one 300-second outer deadline and bounded 30-second local-call deadlines with zero retry',
    'allows exactly one cancellation deadline failure or success terminal winner and suppresses late success',
    'terminates issued local children and starts no new tool call at deadline',
    'reopens Running work once as interrupted without resume resend scan adoption or rewrite',
    'moves only first-result failure to NeedsAttention and never downgrades prior accepted Completed authority',
    'projects every accepted failure with safe retained state and one permitted next action without false artifact',
  ]),
  ...defineCases('REQ-XDESK-009', 'TEST-XDESK-008', 'contract/xanthil-desktop/xanthil-desktop-ipc.contract.test.ts', [
    'uses sandboxed local Renderer resources CSP and no Node or raw Electron authority',
    'denies navigation windows permissions URLs devtools HMR remote code and unapproved protocols',
    'exposes exactly twenty version-one preload methods with structured-clone business values',
    'rejects bad sender frame version owner state fingerprint and exact request shape before every Main effect',
    'revalidates owner identity row version and state in Application rather than transport',
    'keeps reload and duplicate delivery from duplicating any receipt or business authority',
  ]),
  ...defineCases('REQ-XDESK-010', 'TEST-XDESK-013', 'contract/xanthil-desktop/xanthil-desktop-analysis.contract.test.ts', [
    'keeps every existing local-analysis public seam signature and all TEST-XCLI behavior unchanged',
    'uses closed Desktop 3.0 evidence while legacy store and Console reject it without scanning or migration',
    'keeps old analytics factory behavior while Desktop owns double-CSV computation through private process reuse',
    'adds only separate DecisionAssistanceRuntime with Pi-specific details confined to its Adapter',
    'uses the production Profile factory without Main IPC Renderer environment double selection or second package',
    'keeps all optional assistance failures and refusal manually completable without Runtime fallback',
  ]),
  ...defineCases('REQ-XDESK-011', 'TEST-XDESK-003', 'contract/xanthil-desktop/xanthil-desktop-store.contract.test.ts', [
    'opens node:sqlite only with the exact personal-profile PRAGMAs and no user SQL or extension loading',
    'creates exactly sixteen constrained tables keys indexes receipt kinds and only two deferred foreign keys',
    'enforces same-owner Project Session Case and child references with no cascade or cross-Project link',
    'stages fsyncs hashes and renames files before the sole SQLite visibility commit',
    'never overwrites final artifacts and leaves post-rename pre-commit bytes inert and immutable',
    'rejects malformed foreign newer WAL and integrity-failed databases without byte mutation except native XDK1 hot-journal recovery',
    'reads only committed verified contained bytes and marks damage integrity_blocked while preserving history',
    'keeps SQLite operational authority distinct from immutable artifacts analytical evidence and exact Run locator',
  ]),
  ...defineCases('REQ-XDESK-012', 'TEST-XDESK-010', 'e2e/xanthil-desktop/xanthil-desktop.e2e.test.ts', [
    'retains the exact P4 package and lock identity as historical non-RED evidence',
    'retains exact accepted Desktop scripts and canonical validation phases [DEV-04]',
    'packages only the approved local arm64 application and contained toolchain descriptor',
    'drives the same production app with chromiumSandbox true and no CSP or provider bypass',
    'records the separate same-build normal no-debug native-chooser acceptance',
    'keeps CLI baseline suites provider gate and compatibility results green without replay or external call',
    'activates only the personal macOS arm64 professional path with rollback evidence and no release claim',
  ]),
  ...defineCases('REQ-XTS-001', 'TEST-XDESK-011', 'contract/xanthil-desktop/xanthil-desktop-ipc.contract.test.ts', [
    'retains every pre-Change TypeScript path and exact explicit P4/P5 graph without inferred glob',
    'requires exact P4 options/files plus only ordered P5 JSX and Desktop appendices',
    'confines Pi Electron React and node:sqlite types to their approved boundaries',
    'keeps public business contracts free of Pi or Electron types',
  ]),
  ...defineCases('REQ-XTS-002', 'TEST-XDESK-011', 'contract/xanthil-desktop/xanthil-desktop-ipc.contract.test.ts', [
    'retains the exact P4 package and npm-v3 lock hashes',
    'accepts only the complete frozen P4 or P5 manifest state and scripts',
    'rejects ranges alternate managers nested locks overrides network SQLite npm and release machinery',
    'keeps the generated toolchain descriptor package-local and absent from data payloads reports and Git',
  ]),
  ...defineCases('REQ-XTS-004', 'TEST-XDESK-013', 'tools/harness/validation/run.test.mjs', [
    'preflights exact local tool and dependency health before product phases without calling it RED',
    'C0/C1a retain only their fixed runner phase list and exact selector-free focused argv',
    'streams native failure stops later phases removes real-model gate and creates no success output',
    'C0/C1a preserve the no-debug gate separation without preclaiming package or native acceptance',
  ]),
].map(setNormalNativeAcceptance).map(setIncrementalLoop).map(setExecutableCaseOwner));

export function acceptanceCasesFor(file: string): readonly DesktopAcceptanceCase[] {
  return desktopAcceptanceCases.filter((entry) => entry.file === file);
}

/**
 * B1 is a predecessor DAG, not a replacement for the final 91-AC terminal
 * map above.  The health control is traceable to the same closed IPC boundary
 * but deliberately cannot claim an AC behavior PASS by itself.
 */
export type B1TestCoverage = Readonly<{
  title: string;
  role: 'health-control' | 'behavior';
  requirements: readonly ('REQ-XDESK-009' | 'REQ-XDESK-012')[];
  acceptanceCriteria: readonly string[];
}>;

export const b1TestCoverage = Object.freeze([
  Object.freeze({
    title: 'U1.1 H-B1-LOAD: distinguishes the exact Electron boundary from unrelated loader failure',
    role: 'health-control' as const,
    requirements: Object.freeze(['REQ-XDESK-009'] as const),
    acceptanceCriteria: Object.freeze(['AC-XDESK-009-01', 'AC-XDESK-009-02', 'AC-XDESK-009-03', 'AC-XDESK-009-04']),
  }),
  Object.freeze({
    title: 'U1.1 B1-BRIDGE: real preload exposes and maps the closed twenty-method xanthilDesktopApi',
    role: 'behavior' as const,
    requirements: Object.freeze(['REQ-XDESK-009'] as const),
    acceptanceCriteria: Object.freeze(['AC-XDESK-009-01', 'AC-XDESK-009-03']),
  }),
  Object.freeze({
    title: 'U1.1 B1-ENTRY: normal Main entry registers the existing refusal factory and one local window',
    role: 'behavior' as const,
    requirements: Object.freeze(['REQ-XDESK-009', 'REQ-XDESK-012'] as const),
    acceptanceCriteria: Object.freeze(['AC-XDESK-009-02', 'AC-XDESK-009-03', 'AC-XDESK-009-04', 'AC-XDESK-012-04']),
  }),
  Object.freeze({
    title: 'U1.1 B1-SAFETY: normal Main lifecycle denies duplicate authority navigation windows permissions and non-top senders',
    role: 'behavior' as const,
    requirements: Object.freeze(['REQ-XDESK-009', 'REQ-XDESK-012'] as const),
    acceptanceCriteria: Object.freeze(['AC-XDESK-009-01', 'AC-XDESK-009-02', 'AC-XDESK-009-04', 'AC-XDESK-012-04']),
  }),
] satisfies readonly B1TestCoverage[]);

export type B2TestCoverage = Readonly<{
  title: string;
  role: 'health-control' | 'behavior';
  requirements: readonly ('REQ-XDESK-001' | 'REQ-XDESK-009' | 'REQ-XDESK-012')[];
  acceptanceCriteria: readonly string[];
}>;

export const b2TestCoverage = Object.freeze([
  Object.freeze({
    title: 'U1.1 H-B2-LOAD: distinguishes valid pinned TSX render from diagnostics and exact missing Renderer',
    role: 'health-control' as const,
    requirements: Object.freeze(['REQ-XDESK-001', 'REQ-XDESK-009'] as const),
    acceptanceCriteria: Object.freeze(['AC-XDESK-001-01', 'AC-XDESK-001-02', 'AC-XDESK-001-03', 'AC-XDESK-009-01']),
  }),
  Object.freeze({
    title: 'U1.1 B2-COMPONENT: actual XanthilDesktopApp renders the accepted initial shell without a business call',
    role: 'behavior' as const,
    requirements: Object.freeze(['REQ-XDESK-001', 'REQ-XDESK-009'] as const),
    acceptanceCriteria: Object.freeze(['AC-XDESK-001-01', 'AC-XDESK-001-02', 'AC-XDESK-001-03', 'AC-XDESK-009-01']),
  }),
  Object.freeze({
    title: 'U1.1 B2-MOUNT: normal Renderer mounts the actual app with the identical xanthilDesktopApi and local CSP',
    role: 'behavior' as const,
    requirements: Object.freeze(['REQ-XDESK-001', 'REQ-XDESK-009', 'REQ-XDESK-012'] as const),
    acceptanceCriteria: Object.freeze(['AC-XDESK-001-01', 'AC-XDESK-009-01', 'AC-XDESK-009-02', 'AC-XDESK-012-02', 'AC-XDESK-012-03', 'AC-XDESK-012-04']),
  }),
] satisfies readonly B2TestCoverage[]);

export type GuiTestCoverage = Readonly<{
  title: string;
  role: 'health-control' | 'behavior';
  requirements: readonly ('REQ-XDESK-009' | 'REQ-XDESK-012')[];
  acceptanceCriteria: readonly string[];
}>;

export const guiTestCoverage = Object.freeze([
  Object.freeze({
    title: 'U1.1 H-GUI-CONTROL: launches the frozen package and rejects a wrong executable identity before behavior',
    role: 'health-control' as const,
    requirements: Object.freeze(['REQ-XDESK-012'] as const),
    acceptanceCriteria: Object.freeze(['AC-XDESK-012-03', 'AC-XDESK-012-04']),
  }),
  Object.freeze({
    title: 'U1.1 GUI-RUNTIME-SAFETY [AC-XDESK-009-01..04, AC-XDESK-012-04]: packaged runtime preserves isolation closed bridge inactive refusal and native denials',
    role: 'behavior' as const,
    requirements: Object.freeze(['REQ-XDESK-009', 'REQ-XDESK-012'] as const),
    acceptanceCriteria: Object.freeze(['AC-XDESK-009-01', 'AC-XDESK-009-02', 'AC-XDESK-009-03', 'AC-XDESK-009-04', 'AC-XDESK-012-04']),
  }),
] satisfies readonly GuiTestCoverage[]);

export const fixedClock = () => new Date('2026-09-19T00:00:00.000Z');

// These are test-only, canonical identifiers.  They deliberately do not encode
// a filesystem location, user identity, or production data value.
export const desktopTestIds = Object.freeze({
  project: '11111111-1111-4111-8111-111111111111',
  alternateProject: '12121212-1212-4121-8121-121212121212',
  session: '22222222-2222-4222-8222-222222222222',
  case: '33333333-3333-4333-8333-333333333333',
  revision: '44444444-4444-4444-8444-444444444444',
  operation: '55555555-5555-4555-8555-555555555555',
  alternateSession: '66666666-6666-4666-8666-666666666666',
  alternateCase: '77777777-7777-4777-8777-777777777777',
  alternateRevision: '88888888-8888-4888-8888-888888888888',
  alternateOperation: '99999999-9999-4999-8999-999999999999',
  openProjectCommand: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  createSessionCommand: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  revisionCommand: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
  retryCommand: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
});

export function createSessionCommand(overrides: Record<string, unknown> = {}) {
  return {
    contract_version: '1.0',
    command_id: desktopTestIds.createSessionCommand,
    project_id: desktopTestIds.project,
    display_name: 'Synthetic membership repurchase analysis',
    case_name: 'Synthetic repurchase decision',
    fields: {
      question_text: 'Why did repurchase decline?',
      hypothesis_display_title: 'Current repurchase rate is lower',
      business_context: '',
      alternative_explanations: ['Seasonality'],
    },
    ...overrides,
  };
}

const hash = (value: string) => createHash('sha256').update(value).digest('hex');

export type DesktopRunBytes = Readonly<{ bytes: Uint8Array; sha256: string; byte_length: string }>;

export function runBytes(text: string): DesktopRunBytes {
  const bytes = new TextEncoder().encode(text);
  return Object.freeze({
    bytes,
    sha256: createHash('sha256').update(bytes).digest('hex'),
    byte_length: String(bytes.byteLength),
  });
}

/**
 * These are the exact immutable input bytes a real Application receives from
 * confirmation and describeImplementation.  A test may not substitute labels
 * or filenames for their descriptors.
 */
export function createCommittedRunInputs() {
  const confirmation = Object.freeze({
    contract: runBytes('{"contract":"membership-repurchase","version":"1.0"}\n'),
    binding: runBytes('{"binding":"confirmed-authority"}\n'),
    ir: runBytes('{"ir":"membership-repurchase-comparison"}\n'),
  });
  const codeAssets = Object.freeze({
    primary_sql: runBytes('SELECT member_id, paid_at, amount FROM orders WHERE status = \'paid\';\n'),
    python_verifier: runBytes('print("membership-repurchase independent verifier")\n'),
  });
  return Object.freeze({ confirmation, codeAssets });
}

/** A closed, synthetic Desktop Run 3.0 fixture derived from structure-decision. */
export async function createSucceededDesktopRunManifest(overrides: Record<string, unknown> = {}) {
  const { members, orders } = await readSyntheticCsvPair();
  const { confirmation, codeAssets } = createCommittedRunInputs();
  const runId = '01991a00-0000-7000-8000-000000000001';
  const primarySqlSha256 = codeAssets.primary_sql.sha256;
  const pythonVerifierSha256 = codeAssets.python_verifier.sha256;
  const codeIdentity = hash(JSON.stringify({
    method_id: 'membership_repurchase_comparison',
    method_version: '1.0',
    primary_sql_sha256: primarySqlSha256,
    python_verifier_sha256: pythonVerifierSha256,
  }));
  const file = (path: string, value: DesktopRunBytes) => ({ path, sha256: value.sha256, byte_length: value.byte_length });
  const source = (role: 'members' | 'orders', bytes: Uint8Array) => ({
    role,
    snapshot_id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    path: `${desktopTestIds.session}/010_draw/cccccccc-cccc-4ccc-8ccc-cccccccccccc/${role}.csv`,
    display_name: `${role}.csv`,
    sha256: createHash('sha256').update(bytes).digest('hex'),
    byte_length: String(bytes.byteLength),
    confirmed_at: '2026-09-19T00:00:00.000Z',
  });
  return {
    schema_version: '3.0',
    run_id: runId,
    analysis_kind: 'membership_repurchase_decision_case',
    status: 'succeeded',
    started_at: '2026-09-19T00:00:00.000Z',
    ended_at: '2026-09-19T00:00:01.000Z',
    product_context: {
      project_id: desktopTestIds.project,
      session_id: desktopTestIds.session,
      case_id: desktopTestIds.case,
      revision_id: desktopTestIds.revision,
      confirmation_id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
      snapshot_id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    },
    application: { id: 'xanthil-desktop', version: '0.1.0' },
    profile: { id: 'personal-desktop' },
    execution: { kind: 'deterministic_local', model_usage: 'none' },
    method: { id: 'membership_repurchase_comparison', version: '1.0', code_identity: codeIdentity },
    tools: { duckdb_version: '1.5.2', python_version: '3.14.4' },
    confirmation: {
      contract: file('analysis-contract.json', confirmation.contract),
      binding: file('binding.json', confirmation.binding),
      ir: file('ir.json', confirmation.ir),
    },
    sources: [source('members', members), source('orders', orders)],
    artifacts: [
      { artifact_id: 'primary-query', kind: 'query', ...file('assets/primary.sql', codeAssets.primary_sql), sha256: primarySqlSha256 },
      { artifact_id: 'independent-verifier', kind: 'verifier', ...file('assets/verify.py', codeAssets.python_verifier), sha256: pythonVerifierSha256 },
      { artifact_id: 'duckdb-result', kind: 'calculation_output', ...file('outputs/duckdb.json', runBytes('{"engine":"duckdb"}\n')) },
      { artifact_id: 'python-result', kind: 'verification_output', ...file('outputs/python.json', runBytes('{"engine":"python"}\n')) },
      { artifact_id: 'run-summary', kind: 'summary', ...file('summary.md', runBytes('# summary\n')) },
      { artifact_id: 'run-evidence', kind: 'evidence_document', ...file('evidence.md', runBytes('# evidence\n')) },
    ],
    evidence: file('evidence.json', runBytes('{"evidence":"verified"}\n')),
    ...overrides,
  };
}

export async function readSyntheticCsvPair() {
  const members = await readFile(new URL('./members.csv', import.meta.url));
  const orders = await readFile(new URL('./orders.csv', import.meta.url));
  return { members: new Uint8Array(members), orders: new Uint8Array(orders) };
}

export async function createTemporaryDesktopProject() {
  // Native acceptance retains synthetic projects with its screenshots and raw logs.
  const evidence = process.env.JUANERAI_GUI_EVIDENCE_DIRECTORY;
  if (evidence) assert.ok(isAbsolute(evidence), 'native evidence directory is absolute');
  const projectRoot = await mkdtemp(join(evidence ?? tmpdir(), 'xanthil-desktop-test-'));
  return Object.freeze({
    projectRoot,
    async dispose() {
      if (!evidence) await rm(projectRoot, { recursive: true, force: true });
    },
  });
}

export async function assertDesktopFixtureHealth() {
  const { members, orders } = await readSyntheticCsvPair();
  const decode = new TextDecoder('utf-8', { fatal: true });
  const membersText = decode.decode(members);
  const ordersText = decode.decode(orders);
  assert.match(membersText, /^member_id,member_group\r?\n0001,North\r?\n0002,South\r?\n$/);
  assert.match(ordersText, /^order_id,order_member_id,paid_at,amount,status,currency\r?\n/);
  assert.equal(ordersText.trim().split(/\r?\n/).length, 9);
  assert.equal(members.byteLength, 45);
  assert.equal(orders.byteLength, 486);
  assert.equal(createHash('sha256').update(members).digest('hex'), '57e4e4c6dbedb8234fce87afa07b9dd8e75b54f54f68a53cb4963b7c68e18e44');
  assert.equal(createHash('sha256').update(orders).digest('hex'), 'b6ee04152eee96707e93c68de095847433848c06a61db0bed2571ab77f835ff5');
  assert.match(ordersText, /cur-003,0002,2026-02-04T09:00:00\+08:00,20\.00,paid,CNY\r?\ncur-004,0002,2026-02-04T09:00:00\+08:00,5\.00,paid,CNY/, 'the fixed tie rows retain their byte-order calculation boundary');
  assert.doesNotMatch(`${membersText}\n${ordersText}`, /(?:AKIA|BEGIN (?:RSA )?PRIVATE KEY|sk-[A-Za-z0-9])/);
  assert.equal(allDesktopAcceptanceCriteria.length, 91);
  assert.deepEqual(desktopAcceptanceCases.map((entry) => entry.id).sort(), allDesktopAcceptanceCriteria.slice().sort());
  assert.equal(new Set(desktopAcceptanceCases.map((entry) => entry.id)).size, 91);
}
