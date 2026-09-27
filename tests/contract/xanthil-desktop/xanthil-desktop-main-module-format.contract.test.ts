import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { assertFrozenProductionPackageIdentity, readFrozenProductionPackageIdentity } from '../../fixtures/xanthil-desktop/desktop-e2e-harness.ts';

const packageReadbackEnvironmentKey = 'JUANERAI_GUI_PACKAGE_READBACK';
const boundarySentinel = 'XANTHIL_MAIN_MODULE_BOUNDARY_STARTED';

type JsonRecord = Readonly<Record<string, unknown>>;

type ChildResult = Readonly<{
  code: number | null;
  signal: NodeJS.Signals | null;
  stderr: string;
  stdout: string;
  timedOut: boolean;
}>;

function asRecord(value: unknown, label: string): JsonRecord {
  assert.equal(typeof value, 'object', `${label} is an object`);
  assert.notEqual(value, null, `${label} is not null`);
  assert.equal(Array.isArray(value), false, `${label} is not an array`);
  return value as JsonRecord;
}

function sha256(bytes: Uint8Array) {
  return createHash('sha256').update(bytes).digest('hex');
}

function normalizedRelativePath(value: string) {
  return value.split(sep).join('/');
}

function assertContainedPath(root: string, path: string, label: string) {
  const relativePath = relative(root, path);
  assert.notEqual(relativePath, '', `${label} is not the package root`);
  assert.equal(relativePath === '..' || relativePath.startsWith(`..${sep}`) || isAbsolute(relativePath), false, `${label} remains inside its package root`);
  return relativePath;
}

function readCanonicalReadbackInput() {
  const raw = process.env[packageReadbackEnvironmentKey];
  assert.ok(typeof raw === 'string', `${packageReadbackEnvironmentKey} is supplied`);
  const parsed = asRecord(JSON.parse(raw), packageReadbackEnvironmentKey);
  assert.deepEqual(Object.keys(parsed), ['path', 'sha256'], `${packageReadbackEnvironmentKey} has only its closed path/hash fields`);
  assert.equal(JSON.stringify(parsed), raw, `${packageReadbackEnvironmentKey} is canonical no-whitespace JSON`);
  assert.ok(typeof parsed.path === 'string', `${packageReadbackEnvironmentKey}.path is a string`);
  assert.ok(typeof parsed.sha256 === 'string', `${packageReadbackEnvironmentKey}.sha256 is a string`);
  assert.equal(isAbsolute(parsed.path), true, `${packageReadbackEnvironmentKey}.path is absolute`);
  assert.equal(resolve(parsed.path), parsed.path, `${packageReadbackEnvironmentKey}.path is normalized`);
  assert.match(parsed.sha256, /^[a-f0-9]{64}$/, `${packageReadbackEnvironmentKey}.sha256 is lowercase SHA-256`);
  return Object.freeze({ path: parsed.path, sha256: parsed.sha256 });
}

function frozenFileEntry(files: unknown, expectedPath: string, label: string) {
  assert.ok(Array.isArray(files), `${label} is an array`);
  const matches = files.filter((value) => {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
    return (value as JsonRecord).path === expectedPath;
  });
  assert.equal(matches.length, 1, `${label} contains exactly one ${expectedPath} identity`);
  const entry = asRecord(matches[0], `${label} identity`);
  assert.equal(typeof entry.bytes, 'number', `${label} identity byte length is numeric`);
  assert.equal(typeof entry.sha256, 'string', `${label} identity SHA-256 is a string`);
  return entry;
}

function emittedEntryInput(files: unknown, expectedPath: string) {
  assert.ok(Array.isArray(files), 'package readback emittedEntryInputs.files is an array');
  const matches = files.filter((value) => {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
    return (value as JsonRecord).relativePath === expectedPath;
  });
  assert.equal(matches.length, 1, `package readback has exactly one emitted Main identity for ${expectedPath}`);
  const entry = asRecord(matches[0], 'package readback emitted Main identity');
  assert.equal(typeof entry.bytes, 'number', 'package readback emitted Main byte length is numeric');
  assert.equal(typeof entry.sha256, 'string', 'package readback emitted Main SHA-256 is a string');
  return entry;
}

async function runEntry(entryPath: string): Promise<ChildResult> {
  return await new Promise((resolveResult) => {
    const child = spawn(process.execPath, [entryPath], {
      cwd: dirname(entryPath),
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    const stdout: Buffer[] = [];
    const stderr: Buffer[] = [];
    let timedOut = false;
    let spawnError = '';
    child.stdout.on('data', (chunk: Buffer) => stdout.push(chunk));
    child.stderr.on('data', (chunk: Buffer) => stderr.push(chunk));
    child.on('error', (error) => {
      spawnError = error.stack ?? error.message;
    });
    const timeout = setTimeout(() => {
      timedOut = true;
      child.kill('SIGKILL');
    }, 5000);
    child.on('close', (code, signal) => {
      clearTimeout(timeout);
      resolveResult(Object.freeze({
        code,
        signal,
        stderr: `${spawnError}${Buffer.concat(stderr).toString('utf8')}`,
        stdout: Buffer.concat(stdout).toString('utf8'),
        timedOut,
      }));
    });
  });
}

async function writeClosedElectronBoundary(root: string) {
  const moduleDirectory = join(root, 'node_modules', 'electron');
  await mkdir(moduleDirectory, { recursive: true });
  await writeFile(join(moduleDirectory, 'index.js'), `'use strict';
let started = false;
function unexpected(message) { throw new Error(\`unexpected Electron boundary use: \${message}\`); }
const app = Object.freeze({
  requestSingleInstanceLock() { return true; },
  quit() { unexpected('app.quit'); },
  on(event, listener) {
    if ((event !== 'second-instance' && event !== 'activate') || typeof listener !== 'function') unexpected(\`app.on:\${event}\`);
  },
  whenReady() { return Promise.resolve(); },
});
class BrowserWindow {
  static getAllWindows() { return []; }
  constructor(options) {
    if (typeof options !== 'object' || options === null) unexpected('BrowserWindow options');
    this.webContents = Object.freeze({
      mainFrame: Object.freeze({}),
      on(event, listener) {
        if (event !== 'will-navigate' || typeof listener !== 'function') unexpected(\`webContents.on:\${event}\`);
      },
      setWindowOpenHandler(listener) {
        if (typeof listener !== 'function') unexpected('setWindowOpenHandler');
        const result = listener();
        if (!result || result.action !== 'deny') unexpected('window-open result');
      },
      session: Object.freeze({
        setPermissionCheckHandler(listener) { if (typeof listener !== 'function') unexpected('setPermissionCheckHandler'); },
        setPermissionRequestHandler(listener) { if (typeof listener !== 'function') unexpected('setPermissionRequestHandler'); },
      }),
    });
  }
  on(event, listener) {
    if (event !== 'closed' || typeof listener !== 'function') unexpected(\`BrowserWindow.on:\${event}\`);
  }
  async loadFile(path) {
    if (typeof path !== 'string' || started) unexpected('loadFile');
    started = true;
    process.stdout.write('${boundarySentinel}\\n');
  }
}
const ipcMain = Object.freeze({
  handle(channel, listener) {
    if (typeof channel !== 'string' || typeof listener !== 'function') unexpected('ipcMain.handle');
  },
});
module.exports = Object.freeze({ app, BrowserWindow, ipcMain });
`, 'utf8');
}

async function writeSpecimen(root: string, name: string, descriptor: string, entryName: string, entry: string) {
  const specimenRoot = join(root, name);
  await mkdir(specimenRoot, { recursive: true });
  await writeFile(join(specimenRoot, 'package.json'), descriptor, 'utf8');
  const entryPath = join(specimenRoot, entryName);
  await writeFile(entryPath, entry, 'utf8');
  return entryPath;
}

function assertBoundaryStart(result: ChildResult, label: string) {
  assert.equal(result.timedOut, false, `${label} loader child did not time out`);
  assert.equal(result.signal, null, `${label} loader child has no signal`);
  assert.equal(result.code, 0, `${label} loader child exited zero\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`);
  assert.equal(result.stderr, '', `${label} loader child has no stderr`);
  assert.equal(result.stdout.split(boundarySentinel).length - 1, 1, `${label} reaches exactly one closed Electron startup boundary`);
}

// REQ-XDESK-001 / AC-XDESK-001-01 and REQ-XDESK-012 / AC-XDESK-012-03,-04:
// the descriptor-selected packaged Main must load before the later real-app seams.
test('U1.1 MAIN-MODULE-FORMAT: loads the descriptor-selected packaged Main with a compatible emitted module format', async () => {
  const loaderRoot = await mkdtemp(join(tmpdir(), 'xanthil-main-module-format-'));
  try {
    const readbackInput = readCanonicalReadbackInput();
    const [readbackBytes, packageIdentity] = await Promise.all([
      readFile(readbackInput.path),
      readFrozenProductionPackageIdentity(),
    ]);
    assert.equal(sha256(readbackBytes), readbackInput.sha256, 'raw package readback bytes match the command-local identity');
    await assertFrozenProductionPackageIdentity(packageIdentity);

    const readback = asRecord(JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(readbackBytes)), 'package readback');
    const executionEvidence = asRecord(readback.executionEvidence, 'package readback executionEvidence');
    const frozenInputs = asRecord(executionEvidence.inputs, 'package readback executionEvidence.inputs');
    const inputsPath = join(dirname(readbackInput.path), 'inputs.json');
    const inputsBytes = await readFile(inputsPath);
    assert.equal(inputsBytes.byteLength, frozenInputs.bytes, 'producer inputs byte length matches the package readback');
    assert.equal(sha256(inputsBytes), frozenInputs.sha256, 'producer inputs SHA-256 matches the package readback');
    const inputs = asRecord(JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(inputsBytes)), 'producer inputs');

    const repositoryPackagePath = fileURLToPath(new URL('../../../package.json', import.meta.url));
    const repositoryRoot = dirname(repositoryPackagePath);
    const descriptorBytes = await readFile(repositoryPackagePath);
    const frozenDescriptor = frozenFileEntry(inputs.files, repositoryPackagePath, 'producer inputs.files');
    assert.equal(descriptorBytes.byteLength, frozenDescriptor.bytes, 'repository package descriptor byte length matches frozen package inputs');
    assert.equal(sha256(descriptorBytes), frozenDescriptor.sha256, 'repository package descriptor SHA-256 matches frozen package inputs');
    const descriptor = asRecord(JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(descriptorBytes)), 'repository package descriptor');
    assert.equal(descriptor.type, 'module', 'descriptor preserves the actual ESM module rule');
    assert.ok(typeof descriptor.main === 'string', 'descriptor declares one Main entry');

    const sourceEntryPath = resolve(repositoryRoot, descriptor.main);
    const sourceEntryRelativePath = normalizedRelativePath(assertContainedPath(repositoryRoot, sourceEntryPath, 'descriptor-selected Main entry'));
    const mainBytes = await readFile(sourceEntryPath);
    const emittedMain = emittedEntryInput(asRecord(readback.emittedEntryInputs, 'package readback emittedEntryInputs').files, sourceEntryRelativePath);
    assert.equal(mainBytes.byteLength, emittedMain.bytes, 'descriptor-selected emitted Main byte length matches the package readback');
    assert.equal(sha256(mainBytes), emittedMain.sha256, 'descriptor-selected emitted Main SHA-256 matches the package readback');

    await writeClosedElectronBoundary(loaderRoot);
    const compatibleEntry = await writeSpecimen(
      loaderRoot,
      'compatible-control',
      JSON.stringify({ type: 'module', main: './main.cjs' }),
      'main.cjs',
      "const { app, BrowserWindow } = require('electron'); app.whenReady().then(() => new BrowserWindow({ webPreferences: {} }).loadFile('./index.html'));\n",
    );
    assertBoundaryStart(await runEntry(compatibleEntry), 'known-compatible control');

    const incompatibleEntry = await writeSpecimen(
      loaderRoot,
      'incompatible-control',
      JSON.stringify({ type: 'module', main: './main.js' }),
      'main.js',
      'exports.control = true;\n',
    );
    const incompatibleResult = await runEntry(incompatibleEntry);
    assert.equal(incompatibleResult.timedOut, false, 'known-incompatible control loader child did not time out');
    assert.notEqual(incompatibleResult.code, 0, 'known-incompatible type:module plus .js CommonJS control exits nonzero');
    assert.match(incompatibleResult.stderr, /ReferenceError: exports is not defined in ES module scope/, 'known-incompatible control reports the exact classified loader exception before the boundary');
    assert.equal(incompatibleResult.stdout.includes(boundarySentinel), false, 'known-incompatible control never reaches the synthetic Electron boundary');

    const targetRoot = join(loaderRoot, 'descriptor-selected-target');
    const targetEntryPath = resolve(targetRoot, descriptor.main);
    assertContainedPath(targetRoot, targetEntryPath, 'copied descriptor-selected Main entry');
    await mkdir(dirname(targetEntryPath), { recursive: true });
    await writeFile(join(targetRoot, 'package.json'), descriptorBytes);
    await writeFile(targetEntryPath, mainBytes);
    const targetResult = await runEntry(targetEntryPath);
    assert.equal(targetResult.timedOut, false, 'descriptor-selected Main loader child did not time out');
    assert.equal(targetResult.signal, null, 'descriptor-selected Main loader child has no signal');
    if (targetResult.code !== 0) {
      assert.match(targetResult.stderr, /ReferenceError: exports is not defined in ES module scope/, 'a failing descriptor-selected Main retains the exact classified module-format exception');
    }
    assert.equal(targetResult.code, 0, `descriptor-selected Main loads to the closed Electron boundary\nstdout:\n${targetResult.stdout}\nstderr:\n${targetResult.stderr}`);
    assert.equal(targetResult.stderr, '', 'descriptor-selected Main reaches the closed boundary without stderr');
    assert.equal(targetResult.stdout.split(boundarySentinel).length - 1, 1, 'descriptor-selected Main reaches exactly one closed Electron startup boundary');
  } finally {
    await rm(loaderRoot, { recursive: true, force: true });
  }
});
