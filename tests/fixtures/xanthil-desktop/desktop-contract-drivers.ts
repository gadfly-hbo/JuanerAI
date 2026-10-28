import assert from 'node:assert/strict';

import { spawn } from 'node:child_process';
import { chmod, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { registerHooks } from 'node:module';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { pathToFileURL } from 'node:url';

import { readDesktopPythonTool, assertDesktopFixtureHealth, createSessionCommand, createTemporaryDesktopProject, desktopTestIds, fixedClock, readSyntheticCsvPair } from './desktop-fixtures.ts';

export async function loadDesktopModule(relativePath: string): Promise<Record<string, unknown>> {
  const moduleUrl = new URL(`../../../${relativePath}`, import.meta.url);
  return import(moduleUrl.href) as Promise<Record<string, unknown>>;
}

const u12ProjectAdmissionSeams = Object.freeze([
  Object.freeze({ path: 'adapters/storage-local/xanthil-desktop-decision-case.ts', exportName: 'createLocalDesktopDecisionCaseStore' }),
  Object.freeze({ path: 'packages/application/xanthil-desktop-decision-case.ts', exportName: 'createXanthilDesktopDecisionCaseApplication' }),
]);

function isExactMissingU12ProjectAdmissionSeam(error: unknown, relativePath: string) {
  const expectedUrl = new URL(`../../../${relativePath}`, import.meta.url);
  const candidate = error as { code?: unknown; url?: unknown; message?: unknown };
  if (candidate.code !== 'ERR_MODULE_NOT_FOUND') return false;
  if (candidate.url === expectedUrl.href) return true;
  if (typeof candidate.message !== 'string') return false;
  const directTarget = /^Cannot find module ['"]([^'"]+)['"]/.exec(candidate.message)?.[1];
  return directTarget === expectedUrl.href || directTarget === expectedUrl.pathname;
}

function assertU12ProjectAdmissionSeamControlHealth() {
  const expected = u12ProjectAdmissionSeams[0]!.path;
  const expectedUrl = new URL(`../../../${expected}`, import.meta.url);
  assert.equal(
    isExactMissingU12ProjectAdmissionSeam({ code: 'ERR_MODULE_NOT_FOUND', url: expectedUrl.href }, expected),
    true,
    'the U1.2 loader control recognizes only the direct required storage seam',
  );
  assert.equal(
    isExactMissingU12ProjectAdmissionSeam({
      code: 'ERR_MODULE_NOT_FOUND',
      message: `Cannot find module '/unrelated/transitive.ts' imported from '${expectedUrl.pathname}'`,
    }, expected),
    false,
    'a transitive dependency failure remains fixture or production health failure, not U1.2 RED',
  );
  assert.equal(
    isExactMissingU12ProjectAdmissionSeam({ code: 'ERR_UNKNOWN_FILE_EXTENSION', message: `Cannot find module '${expectedUrl.pathname}'` }, expected),
    false,
    'a loader-class failure remains INVALID rather than a missing Project-admission capability',
  );
}

/**
 * U1.2 may classify only direct absence of its three real Project-admission
 * seams.  It never converts a syntax, transitive-import, fixture, toolchain,
 * or unrelated module error into product RED.
 */
export async function requireU12ProjectAdmissionSeams() {
  await assertDesktopFixtureHealth();
  assertU12ProjectAdmissionSeamControlHealth();
  const resolved: Record<string, Record<string, unknown>> = {};
  for (const seam of u12ProjectAdmissionSeams) {
    try {
      resolved[seam.path] = await loadDesktopModule(seam.path);
    } catch (error: unknown) {
      if (isExactMissingU12ProjectAdmissionSeam(error, seam.path)) {
        assert.fail(`U1.2 requires direct Project-admission seam ${seam.path} before its observable contract can exist`);
      }
      throw error;
    }
    assert.equal(typeof requiredExport(resolved[seam.path]!, seam.exportName), 'function', `U1.2 requires ${seam.exportName} from ${seam.path}`);
  }
  return Object.freeze({
    storage: resolved['adapters/storage-local/xanthil-desktop-decision-case.ts']!,
    application: resolved['packages/application/xanthil-desktop-decision-case.ts']!,
  });
}

/** Current I2 composition preserves U1 admission assertions without invoking calculation or Run effects. */
export async function createU12ProjectAdmissionApplication(projectRoot: string) {
  const seams = await requireU12ProjectAdmissionSeams();
  const createStore = requiredExport<(config: { projectRoot: string }) => Record<string, unknown>>(seams.storage, 'createLocalDesktopDecisionCaseStore');
  const createApplication = requiredExport<(dependencies: Record<string, unknown>) => Record<string, unknown>>(seams.application, 'createXanthilDesktopDecisionCaseApplication');
  const store = createStore({ projectRoot });
  const analysis = await loadDesktopModule('adapters/analytics-duckdb/xanthil-desktop-decision-case.ts');
  const toolchain = process.env.JUANERAI_TOOLCHAIN_BIN;
  assert.ok(toolchain, 'approved local toolchain required');
  const analysisExecution = requiredExport<(input: unknown) => unknown>(analysis, 'createDuckDbPythonDesktopLocalAnalysisExecution')({duckdbExecutable:join(toolchain,'duckdb'),duckdbVersion:'1.5.2',...readDesktopPythonTool(toolchain)});
  const runEvidenceStore = requiredExport<(input: unknown) => unknown>(seams.storage, 'createLocalDesktopRunEvidenceStore')({projectRoot});
  const dependencies = {store,analysisExecution,runEvidenceStore,clock:fixedClock,deadlineScheduler:createControlledDeadlineScheduler().scheduler};
  const application = createApplication(dependencies);
  return Object.freeze({ ...seams, store, application, dependencies });
}

/**
 * This native control records calls on the real node:sqlite implementation,
 * forwards every call, and restores the prototype before the leaf exits.
 */
export async function withNodeSqliteConnectionAudit<T>(work: () => Promise<T>) {
  const prototype = DatabaseSync.prototype as unknown as {
    exec: (this: unknown, sql: string) => unknown;
    enableLoadExtension?: (this: unknown, allow: boolean) => unknown;
  };
  const originalExec = prototype.exec;
  const originalEnableLoadExtension = prototype.enableLoadExtension;
  const statements: string[] = [];
  const extensionLoading: boolean[] = [];
  prototype.exec = function auditedExec(this: unknown, sql: string) {
    statements.push(sql);
    return originalExec.call(this, sql);
  };
  if (originalEnableLoadExtension) {
    prototype.enableLoadExtension = function auditedEnableLoadExtension(this: unknown, allow: boolean) {
      extensionLoading.push(allow);
      return originalEnableLoadExtension.call(this, allow);
    };
  }
  try {
    const value = await work();
    return Object.freeze({ value, statements: Object.freeze(statements.slice()), extensionLoading: Object.freeze(extensionLoading.slice()) });
  } finally {
    prototype.exec = originalExec;
    if (originalEnableLoadExtension) prototype.enableLoadExtension = originalEnableLoadExtension;
  }
}

/**
 * Produces an actual uncommitted DELETE-mode journal from the current
 * node:sqlite engine, then simulates process death. Forced cache spill and
 * independent byte readback prove real hotness rather than journal existence.
 * No production journal bytes are fabricated or repaired.
 */
export async function createExactXdk1HotJournal(databasePath: string) {
  const committedBytes = await readFile(databasePath);
  const child = spawn(process.execPath, ['-e', `
    const { DatabaseSync } = require('node:sqlite');
    const db = new DatabaseSync(process.argv[1]);
    db.exec("PRAGMA journal_mode=DELETE; PRAGMA synchronous=FULL; PRAGMA cache_size=1; PRAGMA cache_spill=ON; BEGIN IMMEDIATE; UPDATE projects SET display_name = hex(zeroblob(65536)) WHERE project_id = '11111111-1111-4111-8111-111111111111'");
    process.stdout.write('XDK1-HOT-JOURNAL-READY\\n');
    setInterval(() => {}, 1_000);
  `, databasePath], { stdio: ['ignore', 'pipe', 'pipe'] });
  const stdout = child.stdout;
  const stderr = child.stderr;
  if (!stdout || !stderr) throw new Error('hot-journal control requires bounded stdout and stderr pipes');
  await new Promise<void>((resolve, reject) => {
    let output = '';
    let diagnostic = '';
    const truncateDiagnostic = (value: string) => value.slice(-2_048);
    const finish = (error?: Error) => {
      clearTimeout(timeout);
      stdout.off('data', onStdout);
      stderr.off('data', onStderr);
      child.off('error', onError);
      child.off('exit', onExit);
      if (error) reject(error);
      else resolve();
    };
    const onStdout = (chunk: string | Buffer) => {
      output += String(chunk);
      if (output.includes('XDK1-HOT-JOURNAL-READY')) finish();
    };
    const onStderr = (chunk: string | Buffer) => { diagnostic = truncateDiagnostic(`${diagnostic}${String(chunk)}`); };
    const onError = (error: Error) => finish(error);
    const onExit = (code: number | null, signal: NodeJS.Signals | null) => finish(new Error(`hot-journal control exited before readiness: code=${code} signal=${signal} stderr=${diagnostic}`));
    const timeout = setTimeout(() => {
      child.kill('SIGKILL');
      finish(new Error(`hot-journal control exceeded its 5s readiness bound; stderr=${diagnostic}`));
    }, 5_000);
    stdout.setEncoding('utf8');
    stderr.setEncoding('utf8');
    stdout.on('data', onStdout);
    stderr.on('data', onStderr);
    child.once('error', onError);
    child.once('exit', onExit);
  });
  assert.equal(child.kill('SIGKILL'), true, 'the ready Test-owned hot-journal process must accept SIGKILL');
  await new Promise<void>((resolve, reject) => {
    let diagnostic = '';
    const timeout = setTimeout(() => {
      reject(new Error(`hot-journal control exceeded its 5s termination bound; stderr=${diagnostic.slice(-2_048)}`));
    }, 5_000);
    stderr.on('data', (chunk: string | Buffer) => { diagnostic = `${diagnostic}${String(chunk)}`.slice(-2_048); });
    child.once('error', (error) => { clearTimeout(timeout); reject(error); });
    child.once('exit', (_code, signal) => {
      clearTimeout(timeout);
      if (signal === 'SIGKILL') resolve();
      else reject(new Error(`hot-journal control did not receive SIGKILL: ${signal}; stderr=${diagnostic}`));
    });
  });
  const dirtyBytes = await readFile(databasePath);
  const journal = await readFile(`${databasePath}-journal`);
  assert.notDeepEqual(dirtyBytes, committedBytes, 'uncommitted SQLite pages really reached the main file');
  assert.ok(journal.length > 512, 'the native rollback journal contains page records');
  assert.equal(journal.subarray(0, 8).toString('hex'), 'd9d505f920a163d7', 'the synced native journal header is hot after its only writer died');
  return Object.freeze({
    committed_sha256: createHash('sha256').update(committedBytes).digest('hex'),
    dirty_sha256: createHash('sha256').update(dirtyBytes).digest('hex'),
    journal_sha256: createHash('sha256').update(journal).digest('hex'),
    journal_bytes: journal.length,
    child_pid: child.pid,
    child_signal: child.signalCode,
  });
}


export function requiredExport<T>(module: Record<string, unknown>, name: string): T {
  const value = module[name];
  assert.notEqual(value, undefined, `required public export ${name} is absent`);
  return value as T;
}

type B2TsxCompiler = Readonly<{
  version: string;
  ModuleKind: Readonly<{ ESNext: number }>;
  JsxEmit: Readonly<{ ReactJSX: number }>;
  ScriptTarget: Readonly<{ ESNext: number }>;
  transpileModule(source: string, options: Readonly<Record<string, unknown>>): Readonly<{
    outputText: string;
    diagnostics: readonly unknown[];
  }>;
}>;

type B2MountCapture = Readonly<{
  root: object;
  rootLookups: string[];
  createRootTargets: unknown[];
  renders: unknown[];
}>;

const b2MountBoundaryKey = '__juaneraiXanthilB2MountBoundary__';
const b2ReactModuleUrl = new URL('../../../node_modules/react/index.js', import.meta.url).href;
const b2JsxRuntimeModuleUrl = new URL('../../../node_modules/react/jsx-runtime.js', import.meta.url).href;
const b2ClientBoundaryModule = `data:text/javascript,${encodeURIComponent(`
const control = () => {
  const current = globalThis.${b2MountBoundaryKey};
  if (!current) throw new Error('B2 React DOM mount boundary is not active');
  return current;
};
export const createRoot = (target) => control().createRoot(target);
`)}`;

let b2TsxHookInstalled = false;
let b2EmissionOrdinal = 0;
const b2EmittedModuleUrls = new Set<string>();

function installB2TsxHook() {
  if (b2TsxHookInstalled) return;
  registerHooks({
    resolve(specifier, context, nextResolve) {
      if (context.parentURL && b2EmittedModuleUrls.has(context.parentURL)) {
        if (specifier === 'react') return { url: b2ReactModuleUrl, shortCircuit: true };
        if (specifier === 'react/jsx-runtime') return { url: b2JsxRuntimeModuleUrl, shortCircuit: true };
        if (specifier === 'react-dom/client') {
          const boundary = (globalThis as Record<string, unknown>)[b2MountBoundaryKey] as { hookResolutions: number } | undefined;
          if (!boundary) throw new Error('B2 React DOM client boundary was resolved without an active Test control');
          boundary.hookResolutions += 1;
          return { url: b2ClientBoundaryModule, shortCircuit: true };
        }
        if (specifier === '../../packages/product-core/case-assistant.ts') return nextResolve(new URL('../../../packages/product-core/case-assistant.ts',import.meta.url).href,context);
        throw new Error(`B2 emitted module import is not approved: ${specifier}`);
      }
      return nextResolve(specifier, context);
    },
  });
  b2TsxHookInstalled = true;
}

function restoreGlobalProperty(name: 'document' | 'window', descriptor: PropertyDescriptor | undefined) {
  if (descriptor) Object.defineProperty(globalThis, name, descriptor);
  else Reflect.deleteProperty(globalThis, name);
}

export async function withB2MountCapture<T>(api: Record<string, unknown>, work: (capture: B2MountCapture) => Promise<T>) {
  installB2TsxHook();
  const globalRecord = globalThis as Record<string, unknown>;
  assert.equal(globalRecord[b2MountBoundaryKey], undefined, 'B2 mount controls cannot overlap');
  assert.equal(b2EmittedModuleUrls.size, 0, 'B2 emitted-module import controls cannot overlap');
  const documentDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'document');
  const windowDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'window');
  const root = Object.freeze({ nodeName: 'DIV', id: 'root' });
  const rootLookups: string[] = [];
  const createRootTargets: unknown[] = [];
  const renders: unknown[] = [];
  const capture = Object.freeze({ root, rootLookups, createRootTargets, renders });
  const boundary = {
    hookResolutions: 0,
    createRoot(target: unknown) {
      createRootTargets.push(target);
      return Object.freeze({ render(element: unknown) { renders.push(element); } });
    },
  };
  Object.defineProperty(globalThis, 'document', {
    configurable: true,
    value: Object.freeze({
      getElementById(id: string) {
        rootLookups.push(id);
        return id === 'root' ? root : null;
      },
    }),
  });
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: Object.freeze({ xanthilDesktopApi: api }),
  });
  globalRecord[b2MountBoundaryKey] = boundary;
  try {
    return await work(capture);
  } finally {
    b2EmittedModuleUrls.clear();
    Reflect.deleteProperty(globalRecord, b2MountBoundaryKey);
    restoreGlobalProperty('document', documentDescriptor);
    restoreGlobalProperty('window', windowDescriptor);
  }
}

async function b2Compiler(): Promise<B2TsxCompiler> {
  return await import('typescript') as unknown as B2TsxCompiler;
}

async function compileB2Tsx(source: string, fileName: string) {
  const compiler = await b2Compiler();
  const emitted = compiler.transpileModule(source, {
    compilerOptions: {
      module: compiler.ModuleKind.ESNext,
      jsx: compiler.JsxEmit.ReactJSX,
      target: compiler.ScriptTarget.ESNext,
      verbatimModuleSyntax: true,
      isolatedModules: true,
    },
    fileName,
    reportDiagnostics: true,
  });
  return Object.freeze({ compiler, emitted });
}

type B2Emission = Readonly<{
  emittedPath: string;
  fingerprintPath: string;
  moduleUrl: string;
}>;

function b2EvidenceDirectory(): string {
  const directory = process.env.JUANERAI_TEST_EVIDENCE_DIR;
  if (typeof directory !== 'string') assert.fail('the admitted B2 command supplies its owned evidence directory');
  assert.match(directory, /^\//u, 'the admitted B2 evidence directory is absolute');
  return directory;
}

function sha256(value: string | Uint8Array): string {
  return createHash('sha256').update(value).digest('hex');
}

async function persistB2Emission(source: string, sourcePath: string, emitted: string, label: string): Promise<B2Emission> {
  const directory = b2EvidenceDirectory();
  const ordinal = ++b2EmissionOrdinal;
  const stem = `b2-${ordinal}-${label}`;
  const emittedPath = join(directory, `${stem}.mjs`);
  const fingerprintPath = join(directory, `${stem}.fingerprints.json`);
  const sourceBytes = Buffer.byteLength(source);
  const emittedBytes = Buffer.byteLength(emitted);
  const fingerprints = `${JSON.stringify({
    source: { path: sourcePath, bytes: sourceBytes, sha256: sha256(source) },
    emitted: { path: emittedPath, bytes: emittedBytes, sha256: sha256(emitted) },
  }, null, 2)}\n`;
  await writeFile(emittedPath, emitted, { encoding: 'utf8', flag: 'wx', mode: 0o600 });
  await writeFile(fingerprintPath, fingerprints, { encoding: 'utf8', flag: 'wx', mode: 0o600 });
  const emittedReadback = await readFile(emittedPath);
  const fingerprintReadback = await readFile(fingerprintPath, 'utf8');
  assert.equal(emittedReadback.byteLength, emittedBytes, 'the real emitted B2 module keeps its recorded byte length');
  assert.equal(sha256(emittedReadback), sha256(emitted), 'the real emitted B2 module keeps its recorded digest');
  assert.equal(fingerprintReadback, fingerprints, 'the source/emitted fingerprint record is independently read back');
  return Object.freeze({ emittedPath, fingerprintPath, moduleUrl: pathToFileURL(emittedPath).href });
}

async function importB2Tsx(emission: B2Emission): Promise<Record<string, unknown>> {
  assert.notEqual((globalThis as Record<string, unknown>)[b2MountBoundaryKey], undefined, 'B2 emitted-module imports require the active mount boundary');
  b2EmittedModuleUrls.add(emission.moduleUrl);
  return await import(emission.moduleUrl) as Record<string, unknown>;
}


export function createControlledDeadlineScheduler() {
  const scheduled: Array<{ at_epoch_ms: number; callback: () => void; cancelled: boolean; fired: boolean }> = [];
  return Object.freeze({
    scheduler: Object.freeze({
      schedule({ at_epoch_ms, callback }: { at_epoch_ms: number; callback: () => void }) {
        const entry = { at_epoch_ms, callback, cancelled: false, fired: false };
        scheduled.push(entry);
        return Object.freeze({ cancel() { entry.cancelled = true; } });
      },
    }),
    runDue(now = fixedClock().getTime()) {
      for (const entry of scheduled) {
        if (entry.cancelled || entry.fired || entry.at_epoch_ms > now) continue;
        entry.fired = true;
        entry.callback();
      }
    },
    scheduled,
  });
}


export async function withIsolatedProject<T>(work: (projectRoot: string) => Promise<T>) {
  const project = await createTemporaryDesktopProject();
  try {
    return await work(project.projectRoot);
  } finally {
    await project.dispose();
  }
}

type DesktopMethod = (value: Record<string, unknown>) => Promise<Record<string, unknown>>;

export function desktopOwnerFromProjection(projection: Record<string, unknown>) {
  const project = requiredRecord(projection.project, 'projection.project');
  const revision = requiredRecord(projection.revision, 'projection.revision');
  const session = requiredRecord(projection.session, 'projection.session');
  return Object.freeze({
    project_id: requiredString(project, 'project_id'),
    session_id: requiredString(session, 'session_id'),
    case_id: requiredString(session, 'case_id'),
    revision_id: requiredString(revision, 'revision_id'),
  });
}

export function requiredRecord(value: unknown, name: string): Record<string, unknown> {
  assert.equal(typeof value, 'object', `${name} must be a structured business value`);
  assert.notEqual(value, null, `${name} must not be null`);
  assert.equal(Array.isArray(value), false, `${name} must not be an array`);
  return value as Record<string, unknown>;
}

export function requiredString(value: Record<string, unknown>, name: string): string {
  assert.equal(typeof value[name], 'string', `${name} must be a non-ambient business identity`);
  return value[name] as string;
}

export function revisionCommand(owner: Record<string, unknown>, commandId: string = desktopTestIds.revisionCommand, rowVersion = '1') {
  return Object.freeze({ contract_version: '1.0', command_id: commandId, ...owner, expected_row_version: rowVersion });
}

export function membershipRepurchaseConfirmation(overrides: Record<string, unknown> = {}) {
  return Object.freeze({
    column_mapping: {
      member_id_column: 'member_id', member_group_column: 'member_group', order_id_column: 'order_id',
      order_member_id_column: 'order_member_id', paid_at_column: 'paid_at', amount_column: 'amount',
      status_column: 'status', currency_column: 'currency',
    },
    comparison_period: { start_date: '2026-01-01', end_date: '2026-01-29' },
    current_period: { start_date: '2026-02-01', end_date: '2026-03-01' },
    currency: 'CNY', time_zone: 'Asia/Shanghai', valid_statuses: ['paid'], issue_treatments: [],
    selected_group_mode: 'mapped', hypothesis_id: 'current_repurchase_rate_lower_than_comparison',
    method_id: 'membership_repurchase_comparison', method_version: '1.0',
    authority_confirmed: true, issues_confirmed: true, plan_confirmed: true,
    ...overrides,
  });
}

/**
 * This is deliberately a real composition seam: Store, Run store, and local
 * calculation Adapter are the implementations under test.  The only double is
 * the approved external Assistance Runtime boundary.
 */
export async function createRealDesktopApplication(projectRoot: string, toolOverrides: Readonly<{ duckdbExecutable?: string }> = {}) {
  await assertDesktopFixtureHealth();
  const [storage, analysis, applicationModule] = await Promise.all([
    loadDesktopModule('adapters/storage-local/xanthil-desktop-decision-case.ts'),
    loadDesktopModule('adapters/analytics-duckdb/xanthil-desktop-decision-case.ts'),
    loadDesktopModule('packages/application/xanthil-desktop-decision-case.ts'),
  ]);
  const toolchain = process.env.JUANERAI_TOOLCHAIN_BIN;
  assert.ok(toolchain, 'the frozen command-local toolchain is required before product RED is meaningful');
  const createStore = requiredExport<(value: { projectRoot: string }) => Record<string, unknown>>(storage, 'createLocalDesktopDecisionCaseStore');
  const createRunStore = requiredExport<(value: { projectRoot: string }) => Record<string, unknown>>(storage, 'createLocalDesktopRunEvidenceStore');
  const createAnalysis = requiredExport<(value: Record<string, string>) => Record<string, unknown>>(analysis, 'createDuckDbPythonDesktopLocalAnalysisExecution');
  const createApplication = requiredExport<(value: Record<string, unknown>) => Record<string, unknown>>(applicationModule, 'createXanthilDesktopDecisionCaseApplication');
  const deadlines = createControlledDeadlineScheduler();
  const store = createStore({ projectRoot });
  const runEvidenceStore = createRunStore({ projectRoot });
  const analysisExecution = createAnalysis({
    duckdbExecutable: toolOverrides.duckdbExecutable ?? join(toolchain, 'duckdb'), duckdbVersion: '1.5.2',
    ...readDesktopPythonTool(toolchain),
  });
  const application = createApplication({ store, analysisExecution, runEvidenceStore,  clock: fixedClock, deadlineScheduler: deadlines.scheduler });
  return Object.freeze({ application, store, runEvidenceStore, analysisExecution, deadlines });
}

/** Creates a real durable Session and confirmation before any analysis test. */
export async function openConfirmedDesktopRevision(projectRoot: string, toolOverrides: Readonly<{ duckdbExecutable?: string }> = {}) {
  const composed = await createRealDesktopApplication(projectRoot, toolOverrides);
  const openProject = requiredExport<DesktopMethod>(composed.application, 'openProject');
  await openProject({ contract_version: '1.0', command_id: desktopTestIds.openProjectCommand, proposed_project_id: desktopTestIds.project, display_name: 'Synthetic Project' });
  const createSession = requiredExport<DesktopMethod>(composed.application, 'createSession');
  const created = await createSession(createSessionCommand());
  const owner = desktopOwnerFromProjection(created);
  const createdRevision = requiredRecord(created.revision, 'created revision');
  const createdRowVersion = requiredString(createdRevision, 'row_version');
  const sources = await readSyntheticCsvPair();
  const inspect = requiredExport<DesktopMethod>(composed.application, 'inspectImportFiles');
  const source_files = { members: { display_name: 'members.csv', bytes: sources.members }, orders: { display_name: 'orders.csv', bytes: sources.orders } };
  const guard = { contract_version: '1.0', ...owner, expected_row_version: createdRowVersion, source_files };
  const initial = await inspect(guard), selection = membershipRepurchaseConfirmation();
  const configuration = { column_mapping: selection.column_mapping, comparison_period: selection.comparison_period, current_period: selection.current_period, currency: selection.currency, time_zone: selection.time_zone, valid_statuses: selection.valid_statuses, selected_group_mode: selection.selected_group_mode };
  const inspection = await inspect({ ...guard, inspection_token: initial.inspection_token, configuration });
  const issue_treatments = (inspection.reviewable_issues as {code:string;count:string;treatment_options:string[]}[]).map(issue=>({code:issue.code,count:issue.count,treatment:issue.treatment_options[0]}));
  const confirm = requiredExport<DesktopMethod>(composed.application, 'confirmRevision');
  const projection = await confirm({ ...revisionCommand(owner, desktopTestIds.revisionCommand, createdRowVersion), inspection_token: requiredString(inspection, 'inspection_token'), confirmation: { ...selection, issue_treatments }, source_files });
  const confirmation = requiredRecord(projection.confirmation, 'projection.confirmation');
  return Object.freeze({ ...composed, owner, projection, confirmationId: requiredString(confirmation, 'confirmation_id') });
}

/**
 * A scoped external-process fault fixture.  It is neither an analysis result
 * nor a Store/Application double: the real Adapter owns this child and must
 * signal it, observe termination, and leave no success authority.
 */
export async function createBlockingDuckDbChild(projectRoot: string) {
  const executable = join(projectRoot, 'xanthil-test-blocking-duckdb');
  const marker = join(projectRoot, 'xanthil-test-blocking-duckdb.marker');
  await writeFile(executable, `#!${process.execPath}\nconst fs=require('node:fs');\nif(process.argv[2]==='--version'){process.stdout.write('v1.5.2 (test-owned)\\n');process.exit(0);}\nconst marker=${JSON.stringify(marker)};fs.writeFileSync(marker,'started:'+process.pid+'\\n',{flag:'wx'});process.stdin.resume();\nprocess.on('SIGTERM',()=>{fs.appendFileSync(marker,'terminated\\n');process.exit(0);});\nsetInterval(()=>{},1000);\n`, { mode: 0o700, flag: 'wx' });
  await chmod(executable, 0o700);
  async function waitFor(text: string) {
    for (let attempt = 0; attempt < 100; attempt += 1) {
      try {
        if ((await readFile(marker, 'utf8')).includes(text)) return;
      } catch {}
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
    assert.fail(`owned child did not report ${text}`);
  }
  return Object.freeze({
    executable,
    async assertStarted() { await waitFor('started:'); },
    async interruptOwnedChild() {
      await waitFor('started:');
      const text = await readFile(marker, 'utf8');
      const pid = Number(text.match(/^started:(\d+)$/m)?.[1]);
      assert.ok(Number.isInteger(pid) && pid > 0, 'the Test-owned native control must receive the real Adapter-owned child PID');
      process.kill(pid, 'SIGTERM');
    },
    async assertTerminated() {
      await waitFor('terminated');
      const pid=Number((await readFile(marker,'utf8')).match(/^started:(\d+)$/m)?.[1]);
      assert.ok(Number.isInteger(pid)&&pid>0);
      for(let attempt=0;attempt<100;attempt++){
        try{process.kill(pid,0);}catch(error){if((error as {code?:string}).code==='ESRCH')return;throw error;}
        await new Promise(resolve=>setTimeout(resolve,20));
      }
      assert.fail('owned native child was not reaped');
    },
  });
}

/**
 * A Test-owned native `node:sqlite` interception. It forwards the actual
 * COMMIT first, then loses only its response. Tests must assert target hit and
 * restore the prototype before reopening the real store.
 */
export async function withCommitResponseLostAfterRealCommit<T>(options: Readonly<{ unreadableReceiptReadback?: boolean }>, work: (control: { assertTargetHit(): void; assertReadbackTargetHit(): void; assertUnrelatedSqlForwarded(): void }) => Promise<T>) {
  const original = DatabaseSync.prototype.exec;
  const originalPrepare = DatabaseSync.prototype.prepare;
  let targetHit = false;
  let readbackTargetHit = false;
  let unrelatedSqlForwarded = false;
  let restored = false;
  Object.defineProperty(DatabaseSync.prototype, 'exec', {
    configurable: true,
    writable: true,
    value(this: DatabaseSync, sql: string) {
      const result = original.call(this, sql);
      if (/^\s*COMMIT\s*;?\s*$/i.test(sql)) {
        targetHit = true;
        throw new Error('TEST_COMMIT_RESPONSE_LOST_AFTER_REAL_COMMIT');
      }
      unrelatedSqlForwarded = true;
      return result;
    },
  });
  Object.defineProperty(DatabaseSync.prototype, 'prepare', {
    configurable: true,
    writable: true,
    value(this: DatabaseSync, sql: string) {
      if (options.unreadableReceiptReadback && targetHit && /command_receipts/i.test(sql)) {
        readbackTargetHit = true;
        throw new Error('TEST_COMMIT_RECEIPT_READBACK_UNREADABLE');
      }
      return originalPrepare.call(this, sql);
    },
  });
  try {
    return await work({
      assertTargetHit() { assert.equal(targetHit, true, 'the native control must reach and forward a real COMMIT before losing its response'); },
      assertReadbackTargetHit() { assert.equal(readbackTargetHit, true, 'the unreadable branch must target receipt readback only after the real COMMIT'); },
      assertUnrelatedSqlForwarded() { assert.equal(unrelatedSqlForwarded, true, 'the native control must forward unrelated SQLite operations to the real platform'); },
    });
  } finally {
    Object.defineProperty(DatabaseSync.prototype, 'exec', { configurable: true, writable: true, value: original });
    Object.defineProperty(DatabaseSync.prototype, 'prepare', { configurable: true, writable: true, value: originalPrepare });
    restored = DatabaseSync.prototype.exec === original && DatabaseSync.prototype.prepare === originalPrepare;
    assert.equal(restored, true, 'the native COMMIT control must restore the platform method before the test can finish');
  }
}
