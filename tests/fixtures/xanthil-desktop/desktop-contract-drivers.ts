import assert from 'node:assert/strict';

import { spawn } from 'node:child_process';
import { chmod, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { registerHooks } from 'node:module';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { pathToFileURL } from 'node:url';

import { assertDesktopFixtureHealth, createSessionCommand, createTemporaryDesktopProject, desktopTestIds, fixedClock, readSyntheticCsvPair } from './desktop-fixtures.ts';

export async function loadDesktopModule(relativePath: string): Promise<Record<string, unknown>> {
  if (relativePath === 'apps/desktop/main.ts' || relativePath === 'apps/desktop/preload.ts') activeB1ElectronBoundary();
  const moduleUrl = new URL(`../../../${relativePath}`, import.meta.url);
  return import(moduleUrl.href) as Promise<Record<string, unknown>>;
}

const u12ProjectAdmissionSeams = Object.freeze([
  Object.freeze({ path: 'adapters/storage-local/xanthil-desktop-decision-case.ts', exportName: 'createLocalDesktopDecisionCaseStore' }),
  Object.freeze({ path: 'packages/application/xanthil-desktop-decision-case.ts', exportName: 'createXanthilDesktopDecisionCaseApplication' }),
  Object.freeze({ path: 'profiles/personal/xanthil-desktop.ts', exportName: 'createPersonalXanthilDesktopProfile' }),
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
    profile: resolved['profiles/personal/xanthil-desktop.ts']!,
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
  const analysisExecution = requiredExport<(input: unknown) => unknown>(analysis, 'createDuckDbPythonDesktopLocalAnalysisExecution')({duckdbExecutable:join(toolchain,'duckdb'),duckdbVersion:'1.5.2',pythonExecutable:join(toolchain,'python3'),pythonVersion:'3.14.4'});
  const runEvidenceStore = requiredExport<(input: unknown) => unknown>(seams.storage, 'createLocalDesktopRunEvidenceStore')({projectRoot});
  const dependencies = {store,analysisExecution,runEvidenceStore,assistanceRuntime:null,clock:fixedClock,deadlineScheduler:createControlledDeadlineScheduler().scheduler};
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

type B1EventHandler = (...args: unknown[]) => unknown;
type B1IpcHandler = (event: Record<string, unknown>, request: Record<string, unknown>) => Promise<Record<string, unknown>>;
type B1WebContents = Readonly<{
  mainFrame: unknown;
  on(event: string, handler: B1EventHandler): void;
  setWindowOpenHandler(handler: B1EventHandler): void;
  session: Readonly<{
    setPermissionCheckHandler(handler: B1EventHandler): void;
    setPermissionRequestHandler(handler: B1EventHandler): void;
  }>;
  openDevTools(): void;
  emit(event: string, ...args: unknown[]): void;
}>;
type B1BrowserWindow = {
  readonly webContents: B1WebContents;
  loadFile(...args: string[]): Promise<void>;
  loadURL(...args: string[]): Promise<void>;
  focusCalls: number;
  focus(): void;
  on(event: string, handler: B1EventHandler): void;
  close(): void;
  isDestroyed(): boolean;
};

type B1ElectronBoundaryOptions = Readonly<{
  singleInstanceAllowed?: boolean;
}>;

const b1ElectronBoundaryKey = '__juaneraiXanthilB1ElectronBoundary__';
const b1ElectronBoundaryModule = `data:text/javascript,${encodeURIComponent(`
const control = () => {
  const current = globalThis.${b1ElectronBoundaryKey};
  if (!current) throw new Error('B1 Electron test boundary is not active');
  return current;
};
export const app = Object.freeze({
  requestSingleInstanceLock: () => control().requestSingleInstanceLock(),
  whenReady: () => control().whenReady(),
  on: (event, handler) => control().onApp(event, handler),
  quit: () => control().quit(),
});
export const ipcMain = Object.freeze({
  handle: (channel, handler) => control().handle(channel, handler),
});
export const contextBridge = Object.freeze({
  exposeInMainWorld: (key, value) => control().exposeInMainWorld(key, value),
});
export const ipcRenderer = Object.freeze({
  invoke: (channel, request) => control().invoke(channel, request),
});
export const dialog = Object.freeze({
  showOpenDialog: (...args) => control().showOpenDialog(...args),
});
export function BrowserWindow(options) { return control().createBrowserWindow(options); }
BrowserWindow.getAllWindows = () => control().getAllWindows();
`)}`;

let b1ElectronBoundaryHookInstalled = false;
let b1FreshModuleOrdinal = 0;

function installB1ElectronBoundaryHook() {
  if (b1ElectronBoundaryHookInstalled) return;
  registerHooks({
    resolve(specifier, context, nextResolve) {
      if (specifier !== 'electron') return nextResolve(specifier, context);
      const globalBoundary = (globalThis as Record<string, unknown>)[b1ElectronBoundaryKey] as { hookResolutions: number } | undefined;
      if (!globalBoundary) throw new Error('B1 Electron boundary was resolved without an active Test control');
      globalBoundary.hookResolutions += 1;
      return { url: b1ElectronBoundaryModule, shortCircuit: true };
    },
  });
  b1ElectronBoundaryHookInstalled = true;
}

/**
 * The hook maps only the bare Electron import to this process-local record.
 * Main and preload stay the actual production source modules; this control
 * owns just their external Electron boundary and observes native effects.
 */
export function createB1ElectronBoundary(options: B1ElectronBoundaryOptions = {}) {
  installB1ElectronBoundaryHook();
  const appHandlers = new Map<string, B1EventHandler[]>();
  const ipcHandlers = new Map<string, B1IpcHandler>();
  const windows: B1BrowserWindow[] = [];
  const contextBridgeExposures: Array<Readonly<{ key: string; value: unknown }>> = [];
  const invokes: Array<Readonly<{ channel: string; request: unknown }>> = [];
  const localLoads: string[][] = [];
  const remoteLoads: string[][] = [];
  const browserWindowOptions: Record<string, unknown>[] = [];
  const projectDialogCalls: unknown[][] = [];
  const mainFrame = Object.freeze({ frame_kind: 'main' });
  const subframe = Object.freeze({ frame_kind: 'subframe' });
  const structuredCloneSentinel = Object.freeze({
    ok: false,
    error: Object.freeze({
      code: 'FORBIDDEN',
      message: 'Test-only closed Electron boundary sentinel.',
      what_did_not_happen: 'No production effect occurred in the Test boundary.',
      preserved_authority: 'The Test boundary holds no product authority.',
      recovery_action: 'Continue through the named version-one Desktop method.',
    }),
  });
  let singleInstanceAllowed = options.singleInstanceAllowed ?? true;
  let requestSingleInstanceLockCalls = 0;
  let whenReadyCalls = 0;
  let quitCalls = 0;
  let devToolsCalls = 0;
  let permissionCheckHandler: ((...args: unknown[]) => unknown) | undefined;
  let permissionRequestHandler: ((...args: unknown[]) => unknown) | undefined;
  let windowOpenHandler: ((...args: unknown[]) => unknown) | undefined;
  let currentWindow: B1BrowserWindow | undefined;

  const control = {
    hookResolutions: 0,
    contextBridgeExposures,
    invokes,
    localLoads,
    remoteLoads,
    browserWindowOptions,
    projectDialogCalls,
    async showOpenDialog(...args: unknown[]) {
      projectDialogCalls.push(args);
      return { canceled: true, filePaths: [] };
    },
    structuredCloneSentinel,
    requestSingleInstanceLockCalls: () => requestSingleInstanceLockCalls,
    whenReadyCalls: () => whenReadyCalls,
    quitCalls: () => quitCalls,
    devToolsCalls: () => devToolsCalls,
    requestSingleInstanceLock() {
      requestSingleInstanceLockCalls += 1;
      return singleInstanceAllowed;
    },
    whenReady() {
      whenReadyCalls += 1;
      return Promise.resolve();
    },
    onApp(event: string, handler: B1EventHandler) {
      const handlers = appHandlers.get(event) ?? [];
      handlers.push(handler);
      appHandlers.set(event, handlers);
    },
    quit() {
      quitCalls += 1;
    },
    handle(channel: string, handler: B1IpcHandler) {
      assert.equal(ipcHandlers.has(channel), false, `Main must register ${channel} once only`);
      ipcHandlers.set(channel, handler);
    },
    exposeInMainWorld(key: string, value: unknown) {
      contextBridgeExposures.push(Object.freeze({ key, value }));
    },
    async invoke(channel: string, request: unknown) {
      invokes.push(Object.freeze({ channel, request }));
      return structuredClone(structuredCloneSentinel);
    },
    createBrowserWindow(options: Record<string, unknown>) {
      browserWindowOptions.push(options);
      const webContentsHandlers = new Map<string, B1EventHandler[]>();
      let destroyed = false;
      const webContents = Object.freeze({
        mainFrame,
        on(event: string, handler: B1EventHandler) {
          const handlers = webContentsHandlers.get(event) ?? [];
          handlers.push(handler);
          webContentsHandlers.set(event, handlers);
        },
        setWindowOpenHandler(handler: B1EventHandler) {
          windowOpenHandler = handler;
        },
        session: Object.freeze({
          setPermissionCheckHandler(handler: B1EventHandler) {
            permissionCheckHandler = handler;
          },
          setPermissionRequestHandler(handler: B1EventHandler) {
            permissionRequestHandler = handler;
          },
        }),
        openDevTools() {
          devToolsCalls += 1;
        },
        emit(event: string, ...args: unknown[]) {
          for (const handler of webContentsHandlers.get(event) ?? []) handler(...args);
        },
      });
      const windowHandlers = new Map<string, B1EventHandler[]>();
      const browserWindow: B1BrowserWindow = {
        webContents,
        loadFile(...args: string[]) {
          localLoads.push(args);
          return Promise.resolve();
        },
        loadURL(...args: string[]) {
          remoteLoads.push(args);
          return Promise.resolve();
        },
        focusCalls: 0,
        focus() {
          this.focusCalls += 1;
        },
        on(event: string, handler: B1EventHandler) {
          const handlers = windowHandlers.get(event) ?? [];
          handlers.push(handler);
          windowHandlers.set(event, handlers);
        },
        close() {
          destroyed = true;
          for (const handler of windowHandlers.get('closed') ?? []) handler();
        },
        isDestroyed() {
          return destroyed;
        },
      };
      windows.push(browserWindow);
      currentWindow = browserWindow;
      return browserWindow;
    },
    getAllWindows() {
      return windows.filter((window) => !window.isDestroyed());
    },
    currentWindow() {
      assert.ok(currentWindow, 'normal Main entry must create one local BrowserWindow');
      return currentWindow;
    },
    emitApp(event: string, ...args: unknown[]) {
      for (const handler of appHandlers.get(event) ?? []) handler(...args);
    },
    ipcHandler(channel: string) {
      const handler = ipcHandlers.get(channel);
      assert.ok(handler, `Main must register ${channel}`);
      return handler;
    },
    ipcChannels() {
      return [...ipcHandlers.keys()];
    },
    acceptedEvent() {
      const window = this.currentWindow();
      return Object.freeze({ sender: window.webContents, senderFrame: mainFrame });
    },
    subframeEvent() {
      const window = this.currentWindow();
      return Object.freeze({ sender: window.webContents, senderFrame: subframe });
    },
    foreignSenderEvent() {
      return Object.freeze({ sender: Object.freeze({ frame_kind: 'foreign-sender' }), senderFrame: mainFrame });
    },
    emitWillNavigate() {
      const window = this.currentWindow();
      let prevented = 0;
      (window.webContents as { emit(event: string, ...args: unknown[]): void }).emit('will-navigate', Object.freeze({ preventDefault() { prevented += 1; } }), 'https://forbidden.example/');
      return prevented;
    },
    invokeWindowOpenHandler() {
      assert.ok(windowOpenHandler, 'normal Main entry must install a new-window denial');
      return windowOpenHandler(Object.freeze({ url: 'https://forbidden.example/' }));
    },
    invokePermissionCheck() {
      assert.ok(permissionCheckHandler, 'normal Main entry must install a permission-check denial');
      return permissionCheckHandler(this.currentWindow().webContents, 'notifications', 'https://forbidden.example/');
    },
    invokePermissionRequest() {
      assert.ok(permissionRequestHandler, 'normal Main entry must install a permission-request denial');
      const decisions: unknown[] = [];
      const returned = permissionRequestHandler(this.currentWindow().webContents, 'notifications', (decision: unknown) => { decisions.push(decision); });
      return Object.freeze({ returned, decisions: Object.freeze(decisions) });
    },
    async settle() {
      await Promise.resolve();
      await Promise.resolve();
    },
  };
  (globalThis as Record<string, unknown>)[b1ElectronBoundaryKey] = control;
  return control;
}

function activeB1ElectronBoundary() {
  const active = (globalThis as Record<string, unknown>)[b1ElectronBoundaryKey];
  return active ?? createB1ElectronBoundary();
}

/** Health-only hook controls; no production module is imported here. */
const unrelatedLoaderHealthTarget = 'xanthil-b1-unrelated-loader-health-target';

export async function assertB1ElectronBoundaryHealth() {
  const control = activeB1ElectronBoundary();
  const positive = await import('electron') as Record<string, unknown>;
  assert.deepEqual(Object.keys(positive).sort(), ['BrowserWindow', 'app', 'contextBridge', 'dialog', 'ipcMain', 'ipcRenderer'], 'the hook exposes only the Test-owned Electron boundary record, including C1b native chooser');
  assert.deepEqual(Object.keys(positive.dialog as object), ['showOpenDialog'], 'the chooser control exposes no other effect API');
  assert.ok((control as { hookResolutions: number }).hookResolutions > 0, 'the known bare Electron import must resolve through the B1 hook');
  await assert.rejects(
    import(unrelatedLoaderHealthTarget),
    (error: unknown) => (error as { code?: unknown }).code === 'ERR_MODULE_NOT_FOUND',
    'an unrelated target must remain delegated and rejected before production source is loaded',
  );
  return control as ReturnType<typeof createB1ElectronBoundary>;
}

const b1PreloadUrl = new URL('../../../apps/desktop/preload.ts', import.meta.url);

function isExactMissingB1Preload(error: unknown): boolean {
  const candidate = error as { code?: unknown; url?: unknown; message?: unknown };
  if (candidate.code !== 'ERR_MODULE_NOT_FOUND') return false;
  if (candidate.url === b1PreloadUrl.href) return true;
  if (typeof candidate.message !== 'string') return false;
  const directTarget = /^Cannot find module ['"]([^'"]+)['"]/.exec(candidate.message)?.[1];
  return directTarget === b1PreloadUrl.href || directTarget === b1PreloadUrl.pathname;
}

export async function loadB1Preload() {
  const control = await assertB1ElectronBoundaryHealth();
  try {
    const preload = await loadDesktopModule('apps/desktop/preload.ts');
    return Object.freeze({ control, preload });
  } catch (error: unknown) {
    if (isExactMissingB1Preload(error)) {
      assert.fail('U1.1 requires the real apps/desktop/preload.ts bridge after the independent Electron hook controls pass');
    }
    throw error;
  }
}

export async function loadFreshB1Main(control = createB1ElectronBoundary()) {
  const moduleUrl = new URL('../../../apps/desktop/main.ts', import.meta.url);
  moduleUrl.searchParams.set('b1-test-instance', String(++b1FreshModuleOrdinal));
  const main = await import(moduleUrl.href) as Record<string, unknown>;
  await control.settle();
  return Object.freeze({ control, main });
}

const u11IpcContractUrl = new URL('../../../packages/contracts/xanthil-desktop-ipc.ts', import.meta.url);

function isExactMissingU11IpcContract(error: unknown): boolean {
  const candidate = error as { code?: unknown; url?: unknown; message?: unknown };
  if (candidate.code !== 'ERR_MODULE_NOT_FOUND') return false;
  if (candidate.url === u11IpcContractUrl.href) return true;
  if (typeof candidate.message !== 'string') return false;

  // Node names the missing import first.  The later "imported from" clause
  // must never convert a missing transitive dependency into this causal seam.
  const directTarget = /^Cannot find module ['"]([^'"]+)['"]/.exec(candidate.message)?.[1];
  return directTarget === u11IpcContractUrl.href || directTarget === u11IpcContractUrl.pathname;
}

function assertU11IpcContractSeamControlHealth() {
  assert.equal(isExactMissingU11IpcContract({
    code: 'ERR_MODULE_NOT_FOUND',
    message: `Cannot find module '${u11IpcContractUrl.pathname}'`,
  }), true, 'the explicit U1.1 capability control recognizes only the required IPC target');
  assert.equal(isExactMissingU11IpcContract({
    code: 'ERR_MODULE_NOT_FOUND',
    message: `Cannot find module '/unrelated/transitive.ts' imported from '${u11IpcContractUrl.pathname}'`,
  }), false, 'a transitive module failure that names the IPC importer remains an invalid loader failure');
  assert.equal(isExactMissingU11IpcContract({
    code: 'ERR_UNKNOWN_FILE_EXTENSION',
    message: `Cannot find module '${u11IpcContractUrl.pathname}'`,
  }), false, 'syntax and loader-class failures cannot be swallowed as a missing U1.1 capability');
}

/**
 * U1.1's first causal seam is deliberately narrower than the later Main or
 * packaged-app assertions.  A missing Desktop IPC contract is admitted only
 * when Node identifies this exact module as absent; syntax, transitive-import,
 * and any other loader failures remain unclassified health failures.
 */
export async function requireU11IpcContract() {
  const relativePath = 'packages/contracts/xanthil-desktop-ipc.ts';
  await assertDesktopFixtureHealth();
  assertU11IpcContractSeamControlHealth();

  let ipc: Record<string, unknown>;
  try {
    ipc = await loadDesktopModule(relativePath);
  } catch (error: unknown) {
    if (isExactMissingU11IpcContract(error)) {
      assert.fail(`U1.1 requires the public Desktop IPC contract seam ${relativePath}; the required capability is absent`);
    }
    throw error;
  }

  assert.equal(requiredExport<string>(ipc, 'XANTHIL_DESKTOP_CONTRACT_VERSION'), '1.0');
  return requiredExport<(method: string, value: unknown) => unknown>(ipc, 'validateXanthilDesktopRequest');
}

type U11Handler = (sender: unknown, request: Record<string, unknown>) => Promise<Record<string, unknown>>;
type U11RequestValidator = (method: string, value: unknown) => unknown;

/**
 * Retains M1.1 sender/envelope and inactive-route coverage after C1b admission.
 * The external chooser is explicitly cancelled; Profile may never be invoked.
 * This does not simulate Store/Application or a successful business result.
 */
export async function createU11InactiveMainHarness(
  validateRequest?: U11RequestValidator,
) {
  const resolvedValidateRequest = validateRequest ?? await requireU11IpcContract();
  const main = await loadDesktopModule('apps/desktop/main.ts');
  const acceptedSender = Object.freeze({ frame_kind: 'packaged-top-frame' });
  const observedSenders: unknown[] = [];
  const senderPolicy = (sender: unknown) => {
    observedSenders.push(sender);
    return sender === acceptedSender;
  };
  const effects: string[] = [];
  const createHandlers = requiredExport<(value: Record<string, unknown>) => Record<string, U11Handler>>(main, 'createXanthilDesktopIpcHandlers');
  const handlers = createHandlers({
    senderPolicy,
    nativeDialogs: { async selectProject() { effects.push('chooser.cancelled'); return null; }, async selectImportFiles() { assert.fail('unopened Project cannot choose import files'); },async selectExportFile(){assert.fail('unopened Project cannot choose exports');} },
    sourceReader: { async readSelectedFiles() { assert.fail('unopened Project cannot read sources'); } },
    exportWriter:{async writeAndReadBack(){assert.fail('unopened Project cannot export');}},
    productionProfile: { async openProject() { effects.push('profile.openProject'); assert.fail('cancelled chooser cannot invoke Profile'); } },
  });
  return Object.freeze({ acceptedSender, handlers, observedSenders, effects, validateRequest: resolvedValidateRequest });
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

const b2RendererUrl = new URL('../../../apps/desktop/renderer.tsx', import.meta.url);
const b2IndexUrl = new URL('../../../apps/desktop/index.html', import.meta.url);
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

function isExactMissingB2Renderer(error: unknown): boolean {
  const candidate = error as { code?: unknown; path?: unknown };
  return candidate.code === 'ENOENT' && candidate.path === b2RendererUrl.pathname;
}

function assertB2RendererCapabilityControl() {
  assert.equal(isExactMissingB2Renderer({ code: 'ENOENT', path: b2RendererUrl.pathname }), true, 'the explicit B2 capability control recognizes only the required Renderer target');
  assert.equal(isExactMissingB2Renderer({ code: 'ENOENT', path: '/unrelated/renderer.tsx' }), false, 'an unrelated missing file remains an invalid Test-health failure');
  assert.equal(isExactMissingB2Renderer({ code: 'ERR_MODULE_NOT_FOUND', path: b2RendererUrl.pathname }), false, 'a module-loader class failure cannot be swallowed as a missing Renderer capability');
}

/** Health-only TSX controls; no production Renderer is imported here. */
export async function assertB2TsxSeamHealth() {
  b2EvidenceDirectory();
  await assertDesktopFixtureHealth();
  assertB2RendererCapabilityControl();
  const validSource = `
    import { createRoot } from 'react-dom/client';
    export function PinnedTsxProbe() { return <main>pinned TSX health</main>; }
    const root = createRoot(document.getElementById('root'));
    root.render(<PinnedTsxProbe />);
  `;
  const valid = await compileB2Tsx(validSource, 'b2-pinned-tsx-probe.tsx');
  assert.equal(valid.compiler.version, '5.9.3', 'the B2 seam uses the frozen real TypeScript compiler');
  assert.equal(valid.emitted.diagnostics.length, 0, 'the known valid TSX probe compiles without diagnostics');
  await withB2MountCapture(Object.freeze({}), async (capture) => {
    const probe = await importB2Tsx(await persistB2Emission(
      validSource,
      'b2-pinned-tsx-probe.tsx',
      valid.emitted.outputText,
      'valid-tsx-probe',
    ));
    const react = await import('react') as Record<string, unknown>;
    const server = await import('react-dom/server') as Record<string, unknown>;
    const Probe = requiredExport<(props: Record<string, never>) => unknown>(probe, 'PinnedTsxProbe');
    const createElement = requiredExport<(type: unknown, props: unknown) => unknown>(react, 'createElement');
    const renderToStaticMarkup = requiredExport<(element: unknown) => string>(server, 'renderToStaticMarkup');
    assert.match(renderToStaticMarkup(createElement(Probe, null)), /pinned TSX health/u, 'the emitted probe reaches the installed real React server renderer');
    assert.deepEqual(capture.rootLookups, ['root'], 'the probe uses the one normal root lookup');
    assert.deepEqual(capture.createRootTargets, [capture.root], 'only the Test-owned react-dom/client mount boundary receives the root');
    assert.equal(capture.renders.length, 1, 'the probe performs one controlled normal-mount render');
  });
  const forbiddenBareSource = `import { readFile } from 'node:fs/promises';\nexport const forbidden = readFile;\n`;
  const forbiddenBare = await compileB2Tsx(forbiddenBareSource, 'b2-forbidden-bare-import.tsx');
  assert.equal(forbiddenBare.emitted.diagnostics.length, 0, 'the unapproved-bare-import control reaches the emitted-module resolver');
  await withB2MountCapture(Object.freeze({}), async () => {
    await assert.rejects(
      importB2Tsx(await persistB2Emission(forbiddenBareSource, 'b2-forbidden-bare-import.tsx', forbiddenBare.emitted.outputText, 'forbidden-bare-import')),
      /B2 emitted module import is not approved: node:fs\/promises/u,
      'an unapproved bare import originating in the emitted module is rejected before it can load',
    );
  });
  const forbiddenRelativeSource = `import './unexpected-relative.mjs';\nexport const forbidden = true;\n`;
  const forbiddenRelative = await compileB2Tsx(forbiddenRelativeSource, 'b2-forbidden-relative-import.tsx');
  assert.equal(forbiddenRelative.emitted.diagnostics.length, 0, 'the unapproved-relative-import control reaches the emitted-module resolver');
  await withB2MountCapture(Object.freeze({}), async () => {
    await assert.rejects(
      importB2Tsx(await persistB2Emission(forbiddenRelativeSource, 'b2-forbidden-relative-import.tsx', forbiddenRelative.emitted.outputText, 'forbidden-relative-import')),
      /B2 emitted module import is not approved: \.\/unexpected-relative\.mjs/u,
      'a runtime-relative import originating in the emitted module is rejected before filesystem resolution',
    );
  });
  const invalid = await compileB2Tsx('export const = ;', 'b2-invalid-tsx-probe.tsx');
  assert.ok(invalid.emitted.diagnostics.length > 0, 'the known invalid TSX probe produces diagnostics before any import');
}

/**
 * B2 admits a causal missing-capability RED only at this exact file read. A
 * malformed emitted module, unexpected runtime import, or other loader error
 * remains a health failure for the coordinator rather than a product RED.
 */
export async function requireB2Renderer() {
  b2EvidenceDirectory();
  assertB2RendererCapabilityControl();
  let source: string;
  try {
    source = await readFile(b2RendererUrl, 'utf8');
  } catch (error: unknown) {
    if (isExactMissingB2Renderer(error)) {
      assert.fail('U1.1 requires the real apps/desktop/renderer.tsx XanthilDesktopApp capability after the independent TSX controls pass');
    }
    throw error;
  }
  const compiled = await compileB2Tsx(source, b2RendererUrl.pathname);
  assert.equal(compiled.emitted.diagnostics.length, 0, 'the real Renderer must compile cleanly through the already-proven TSX seam');
  return importB2Tsx(await persistB2Emission(source, b2RendererUrl.pathname, compiled.emitted.outputText, 'renderer'));
}

const b2ExpectedCsp = "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'";

function relativeLocalResource(value: string): boolean {
  return value.length > 0 && !value.startsWith('/') && !value.startsWith('//') && !/^[A-Za-z][A-Za-z0-9+.-]*:/u.test(value);
}

function htmlAttribute(tag: string, name: string): string | undefined {
  const attribute = tag.match(new RegExp(`(?:^|[\\t\\n\\f\\r ])${name}[\\t\\n\\f\\r ]*=[\\t\\n\\f\\r ]*(?:\"([^\"]*)\"|'([^']*)'|([^\\t\\n\\f\\r \"'=<>\\x60]+))`, 'u'));
  return attribute?.[1] ?? attribute?.[2] ?? attribute?.[3];
}

function isExactMissingB2Index(error: unknown): boolean {
  const candidate = error as { code?: unknown; path?: unknown };
  return candidate.code === 'ENOENT' && candidate.path === b2IndexUrl.pathname;
}

function assertB2IndexCapabilityControl() {
  assert.equal(isExactMissingB2Index({ code: 'ENOENT', path: b2IndexUrl.pathname }), true, 'the explicit B2 index capability control recognizes only the required Renderer index');
  assert.equal(isExactMissingB2Index({ code: 'ENOENT', path: '/unrelated/index.html' }), false, 'an unrelated missing file remains an invalid Test-health failure');
  assert.equal(isExactMissingB2Index({ code: 'ERR_MODULE_NOT_FOUND', path: b2IndexUrl.pathname }), false, 'a non-filesystem loader error cannot be swallowed as a missing Renderer index capability');
}

export async function assertB2RendererIndexContract() {
  b2EvidenceDirectory();
  assertB2IndexCapabilityControl();
  let index: string;
  try {
    index = await readFile(b2IndexUrl, 'utf8');
  } catch (error: unknown) {
    if (isExactMissingB2Index(error)) {
      assert.fail('U1.1 requires the real apps/desktop/index.html Renderer entry capability after the component predecessor is GREEN');
    }
    throw error;
  }
  const rootNodes = (index.match(/<[A-Za-z][^>]*>/gu) ?? []).filter((tag) => htmlAttribute(tag, 'id') === 'root');
  assert.equal(rootNodes.length, 1, 'the actual Renderer index contains exactly one #root element');
  assert.match(rootNodes[0]!, /^<div\b/u, 'the actual Renderer index uses its one #root element as the normal div mount container');
  const cspMetas = (index.match(/<meta\b[^>]*>/gu) ?? []).filter((tag) => htmlAttribute(tag, 'http-equiv') === 'Content-Security-Policy');
  assert.equal(cspMetas.length, 1, 'the actual Renderer index contains one Content-Security-Policy meta tag');
  const csp = htmlAttribute(cspMetas[0]!, 'content');
  assert.equal(csp, b2ExpectedCsp, 'the actual Renderer index keeps the exact approved CSP');
  const scriptSources = (index.match(/<script\b[^>]*>/gu) ?? [])
    .map((tag) => htmlAttribute(tag, 'src'))
    .filter((source): source is string => source !== undefined);
  const styleSources: string[] = [];
  for (const tag of index.match(/<link\b[^>]*>/gu) ?? []) {
    if (!(htmlAttribute(tag, 'rel') ?? '').split(/\s+/u).includes('stylesheet')) continue;
    const source = htmlAttribute(tag, 'href');
    if (source === undefined) assert.fail('a stylesheet link has an href');
    styleSources.push(source);
  }
  for (const source of [...scriptSources, ...styleSources]) {
    assert.equal(relativeLocalResource(source), true, `the actual Renderer index keeps ${source} as a relative local resource`);
  }
}

const b2DesktopMethods = Object.freeze([
  'selectProject', 'listSessions', 'openSession', 'createSession', 'createDraftRevision',
  'selectImportFiles', 'confirmRevision', 'startAnalysis', 'cancelAnalysis',
  'prepareAssistanceDisclosure', 'decideAssistanceDisclosure', 'startAssistance',
  'cancelAssistance', 'disposeAssistanceDraft', 'acceptFinding', 'saveForm',
  'completeCase', 'exportReport', 'readProjection', 'waitForProjection',
] as const);

export function createB2RecordingDesktopApi() {
  const calls = new Map<string, number>(b2DesktopMethods.map((method) => [method, 0]));
  const api = Object.freeze(Object.fromEntries(b2DesktopMethods.map((method) => [method, async () => {
    calls.set(method, (calls.get(method) ?? 0) + 1);
    return Object.freeze({ test_boundary: 'B2' });
  }])));
  return Object.freeze({ api, calls, methods: b2DesktopMethods });
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

export function createOfflineAssistanceRuntimeDouble(options: Readonly<{
  ready?: boolean;
  failExecute?: 'PROVIDER_UNAVAILABLE' | 'CANCELLED' | 'DEADLINE_EXCEEDED' | 'INTERRUPTED';
}> = {}) {
  const calls: Array<Record<string, unknown>> = [];
  const ready = options.ready ?? true;
  const responseFor = (actionKind: unknown) => {
    if (actionKind === 'organize_question') {
      return {
        draft_kind: 'question_fields',
        draft_content: {
          question_text: 'Why is repurchase lower?',
          hypothesis_display_title: 'Repurchase rate comparison',
          business_context: '',
          alternative_explanations: ['Seasonality'],
        },
      };
    }
    if (actionKind === 'explain_evidence') {
      return {
        draft_kind: 'evidence_explanation',
        draft_content: { evidence_explanation_text: 'The observed aggregate needs a manual causal review.' },
      };
    }
    if (actionKind === 'draft_candidates') {
      return {
        draft_kind: 'candidates',
        draft_content: {
          candidates: [
            { title: 'Compare retention alternatives', evidence_basis: 'M2 contribution', risk_or_refutation: 'Small sample', applicability_conditions: 'Confirmed pseudonymous aggregate only', future_validation_metric: 'repeat-rate' },
            { title: 'Investigate competing explanations', evidence_basis: 'M2 contribution', risk_or_refutation: 'No causal claim', applicability_conditions: 'Independent future validation', future_validation_metric: 'second-plus revenue' },
          ],
        },
      };
    }
    throw new Error('VALIDATION_FAILED: unknown assistance action');
  };
  return Object.freeze({
    calls,
    runtime: Object.freeze({
      async preflightSelection({ requested_provider, requested_model }: { requested_provider: string; requested_model: string }) {
        calls.push({ kind: 'preflight', requested_provider, requested_model });
        return { runtime_id: 'offline-runtime', runtime_version: '1.0', adapter_id: 'offline-test', adapter_version: '1.0', requested_provider, requested_model, ready };
      },
      async executeAssistance(request: Record<string, unknown>) {
        calls.push({ kind: 'execute', request });
        if (options.failExecute) throw new Error(options.failExecute);
        return { actual_provider: 'offline-test', actual_model: 'deterministic', ...responseFor(request.action_kind) };
      },
      async cancel() { calls.push({ kind: 'cancel' }); return { cancelled: true }; },
    }),
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
export async function createRealDesktopApplication(projectRoot: string, runtime = createOfflineAssistanceRuntimeDouble(), toolOverrides: Readonly<{ duckdbExecutable?: string }> = {}) {
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
    pythonExecutable: join(toolchain, 'python3'), pythonVersion: '3.14.4',
  });
  const application = createApplication({ store, analysisExecution, runEvidenceStore, assistanceRuntime:runtime.runtime, clock: fixedClock, deadlineScheduler: deadlines.scheduler });
  return Object.freeze({ application, store, runEvidenceStore, analysisExecution, runtime, deadlines });
}

/** Creates a real durable Session and confirmation before any analysis test. */
export async function openConfirmedDesktopRevision(projectRoot: string, runtime = createOfflineAssistanceRuntimeDouble(), toolOverrides: Readonly<{ duckdbExecutable?: string }> = {}) {
  const composed = await createRealDesktopApplication(projectRoot, runtime, toolOverrides);
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
