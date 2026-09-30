import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdtemp, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { basename, dirname, isAbsolute, join, resolve } from 'node:path';
import type { BaseWindow, OpenDialogOptions } from 'electron';
import type { Page } from 'playwright-core';

import { guiPackageReadbackProducers, guiPackageReadbackRelativePaths, type GuiPackageReadbackProducer } from './desktop-fixtures.ts';

const guiPackageReadbackEnvironmentKey = 'JUANERAI_GUI_PACKAGE_READBACK';
const packageReadbackRecordType = 'PACKAGE_READBACK';
const packageAggregateAlgorithm = 'SHA-256 of UTF-8 sorted <relativePath>\\t<bytes>\\t<sha256>\\n lines';
const packagedDesktopApp = resolve(process.env.JUANERAI_GUI_PACKAGE_ROOT ?? fileURLToPath(new URL('../../../out/Xanthil-darwin-arm64/Xanthil.app/', import.meta.url)));

export async function saveScreenshotExclusive(page: Pick<Page, 'screenshot'>, path: string, fullPage = false) {
  const bytes = await page.screenshot({ fullPage });
  await writeFile(path, bytes, { flag: 'wx' });
}

export type FrozenProductionPackageFile = Readonly<{
  relativePath: string;
  bytes: number;
  sha256: string;
}>;

export type FrozenProductionPackageIdentity = Readonly<{
  packageRoot: string;
  manifest: readonly FrozenProductionPackageFile[];
  aggregateSha256: string;
  producer: GuiPackageReadbackProducer;
}>;

type JsonRecord = Readonly<Record<string, unknown>>;

function isJsonRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function assertSha256(value: unknown, label: string): asserts value is string {
  assert.equal(typeof value, 'string', `${label} is a SHA-256 string`);
  if (typeof value !== 'string') {
    assert.fail(`${label} is a SHA-256 string`);
  }
  assert.match(value, /^[a-f0-9]{64}$/, `${label} is lowercase SHA-256`);
}

function assertNonnegativeByteLength(value: unknown, label: string): asserts value is number {
  assert.equal(Number.isSafeInteger(value), true, `${label} is a safe byte length`);
  assert.ok((value as number) >= 0, `${label} is nonnegative`);
}

function parseJsonRecord(bytes: Uint8Array, label: string): JsonRecord {
  try {
    const parsed: unknown = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
    assert.ok(isJsonRecord(parsed), `${label} is a JSON object`);
    return parsed;
  } catch (error) {
    assert.fail(`${label} must be valid UTF-8 JSON: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function packageManifestAggregateSha256(manifest: readonly FrozenProductionPackageFile[]) {
  return createHash('sha256').update(manifest.map((entry) => `${entry.relativePath}\t${entry.bytes}\t${entry.sha256}\n`).join(''), 'utf8').digest('hex');
}

export function frozenProductionPackageAggregateSha256(manifest: readonly FrozenProductionPackageFile[]) {
  return packageManifestAggregateSha256(manifest);
}

function assertMappedProducer(commandId: unknown, attempt: unknown): GuiPackageReadbackProducer {
  assert.equal(typeof commandId, 'string', 'package readback commandId is a string');
  assert.equal(typeof attempt, 'string', 'package readback attempt is a string');
  const producer = guiPackageReadbackProducers.find((candidate) => candidate.commandId === commandId && candidate.attempt === attempt);
  assert.ok(producer, 'package readback commandId/attempt is one scheduled GUI package producer');
  return producer;
}

function assertReadbackManifest(value: unknown): readonly FrozenProductionPackageFile[] {
  assert.ok(Array.isArray(value), 'package readback sortedRequiredManifest is an array');
  assert.equal(value.length, guiPackageReadbackRelativePaths.length, 'package readback has exactly four required files');
  return Object.freeze(value.map((entry, index) => {
    assert.ok(isJsonRecord(entry), `package readback manifest ${index + 1} is an object`);
    assert.equal(entry.relativePath, guiPackageReadbackRelativePaths[index], `package readback manifest ${index + 1} preserves the frozen path order`);
    assertNonnegativeByteLength(entry.bytes, `package readback ${entry.relativePath} byte length`);
    assertSha256(entry.sha256, `package readback ${entry.relativePath} digest`);
    return Object.freeze({ relativePath: entry.relativePath, bytes: entry.bytes, sha256: entry.sha256 });
  }));
}

async function assertSourcePackageEvidence(record: JsonRecord, producer: GuiPackageReadbackProducer, readbackPath: string) {
  const executionEvidence = record.executionEvidence;
  assert.ok(isJsonRecord(executionEvidence), 'package readback has executionEvidence');
  assert.equal(basename(readbackPath), 'package-readback-001.json', 'package readback has the closed filename');
  const producerDirectory = dirname(readbackPath);
  assert.equal(basename(producerDirectory), producer.attempt, 'package readback path matches its mapped producer attempt');
  assert.equal(basename(dirname(producerDirectory)), producer.commandId, 'package readback path matches its mapped producer command');
  const expectedSources = Object.freeze([
    Object.freeze({ key: 'command', filename: 'command.json' }),
    Object.freeze({ key: 'inputs', filename: 'inputs.json' }),
    Object.freeze({ key: 'result', filename: 'result.json' }),
  ] as const);
  const parsedSources = new Map<string, JsonRecord>();
  for (const source of expectedSources) {
    const expectedValue = executionEvidence[source.key];
    assert.ok(isJsonRecord(expectedValue), `package readback executionEvidence.${source.key} is an object`);
    if (!isJsonRecord(expectedValue)) {
      assert.fail(`package readback executionEvidence.${source.key} is an object`);
    }
    const expected: JsonRecord = expectedValue;
    assertNonnegativeByteLength(expected.bytes, `package readback ${source.key} evidence byte length`);
    assertSha256(expected.sha256, `package readback ${source.key} evidence digest`);
    const bytes = await readFile(join(producerDirectory, source.filename));
    assert.equal(bytes.byteLength, expected.bytes, `producer ${source.filename} byte length matches the readback`);
    assert.equal(createHash('sha256').update(bytes).digest('hex'), expected.sha256, `producer ${source.filename} digest matches the readback`);
    parsedSources.set(source.key, parseJsonRecord(bytes, `producer ${source.filename}`));
  }
  const command = parsedSources.get('command')!;
  const result = parsedSources.get('result')!;
  assert.equal(command.command_id, producer.commandId, 'producer command.json identity matches the mapped command');
  assert.equal(command.attempt, producer.attempt, 'producer command.json attempt matches the mapped attempt');
  assert.equal(result.command_id, producer.commandId, 'producer result.json identity matches the mapped command');
  assert.equal(result.attempt, producer.attempt, 'producer result.json attempt matches the mapped attempt');
  assert.equal(result.child_exit_code, 0, 'producer package child exited successfully');
  assert.equal(result.outer_capture_exit_code, 0, 'producer package capture exited successfully');
  if(producer.commandId==='CHANGE002-PACKAGE-018'||producer.commandId==='CHANGE002-PACKAGE-017'||producer.commandId==='CHANGE002-PACKAGE-016'||producer.commandId==='CHANGE002-PACKAGE-015'||producer.commandId==='CHANGE002-PACKAGE-014'||producer.commandId==='CHANGE002-PACKAGE-013'||producer.commandId==='CHANGE002-PACKAGE-012'||producer.commandId==='CHANGE002-PACKAGE-011'||producer.commandId==='CHANGE002-PACKAGE-010'||producer.commandId==='CHANGE002-PACKAGE-009'||producer.commandId==='CHANGE002-PACKAGE-008'||producer.commandId==='CHANGE002-PACKAGE-007'||producer.commandId==='CHANGE002-PACKAGE-006'||producer.commandId==='CHANGE002-PACKAGE-005'||producer.commandId==='CHANGE002-PACKAGE-004'||producer.commandId==='CHANGE002-PACKAGE-003'||producer.commandId==='CHANGE002-PACKAGE-002'||producer.commandId==='CHANGE002-PACKAGE-001'||producer.commandId==='UI-DEMO-PACKAGE-002'||producer.commandId==='UI-DEMO-PACKAGE-003'){
    assert.ok(isJsonRecord(command.env));
    assert.equal(typeof command.env.JUANERAI_INTERNAL_INSTALL_OUTPUT,'string');
    assert.equal(packagedDesktopApp,join(command.env.JUANERAI_INTERNAL_INSTALL_OUTPUT as string,'Xanthil-darwin-arm64','Xanthil.app'),'new package root is bound to the successful Forge producer output');
  }else{
    assert.equal(packagedDesktopApp,resolve(fileURLToPath(new URL('../../../out/Xanthil-darwin-arm64/Xanthil.app/',import.meta.url))),'historical producers retain their original package root');
  }
}

export async function readFrozenProductionPackageIdentity(): Promise<FrozenProductionPackageIdentity> {
  const rawInput = process.env[guiPackageReadbackEnvironmentKey];
  assert.ok(typeof rawInput === 'string', `${guiPackageReadbackEnvironmentKey} is supplied for every package-consuming GUI command`);
  const input = parseJsonRecord(new TextEncoder().encode(rawInput), guiPackageReadbackEnvironmentKey);
  assert.deepEqual(Object.keys(input), ['path', 'sha256'], `${guiPackageReadbackEnvironmentKey} has only the closed path/hash fields`);
  assert.equal(JSON.stringify(input), rawInput, `${guiPackageReadbackEnvironmentKey} is canonical no-whitespace JSON`);
  assert.ok(typeof input.path === 'string', `${guiPackageReadbackEnvironmentKey}.path is a string`);
  assert.equal(isAbsolute(input.path), true, `${guiPackageReadbackEnvironmentKey}.path is absolute`);
  assert.equal(resolve(input.path), input.path, `${guiPackageReadbackEnvironmentKey}.path is normalized`);
  assert.equal(input.path.includes('\u0000'), false, `${guiPackageReadbackEnvironmentKey}.path has no NUL`);
  assertSha256(input.sha256, `${guiPackageReadbackEnvironmentKey}.sha256`);
  const readbackBytes = await readFile(input.path);
  assert.equal(createHash('sha256').update(readbackBytes).digest('hex'), input.sha256, 'package readback bytes match the command-local SHA-256');
  const record = parseJsonRecord(readbackBytes, 'package readback');
  assert.equal(record.recordType, packageReadbackRecordType, 'package readback recordType');
  const producer = assertMappedProducer(record.commandId, record.attempt);
  await assertSourcePackageEvidence(record, producer, input.path);
  assert.equal(record.packageRoot, packagedDesktopApp, 'package readback packageRoot is the approved local arm64 application');
  const manifest = assertReadbackManifest(record.sortedRequiredManifest);
  const aggregate = record.aggregate;
  assert.ok(isJsonRecord(aggregate), 'package readback aggregate is an object');
  assert.equal(aggregate.algorithm, packageAggregateAlgorithm, 'package readback aggregate uses the frozen algorithm');
  assert.equal(aggregate.fileCount, 4, 'package readback aggregate records all four files');
  assertSha256(aggregate.sha256, 'package readback aggregate digest');
  assert.equal(packageManifestAggregateSha256(manifest), aggregate.sha256, 'package readback aggregate matches its immutable manifest');
  return Object.freeze({ packageRoot: packagedDesktopApp, manifest, aggregateSha256: aggregate.sha256, producer });
}

export async function assertFrozenProductionPackageIdentity(expected: FrozenProductionPackageIdentity) {
  assert.equal(expected.packageRoot, packagedDesktopApp, 'expected package root is the approved local arm64 application');
  assert.equal(expected.manifest.length, 4, 'expected package identity retains four files');
  assert.equal(packageManifestAggregateSha256(expected.manifest), expected.aggregateSha256, 'expected package identity aggregate is internally coherent');
  const observedManifest: FrozenProductionPackageFile[] = [];
  for (const file of expected.manifest) {
    const bytes = await readFile(join(expected.packageRoot, file.relativePath));
    const sha256 = createHash('sha256').update(bytes).digest('hex');
    assert.equal(bytes.byteLength, file.bytes, `frozen package ${file.relativePath} byte length`);
    assert.equal(sha256, file.sha256, `frozen package ${file.relativePath} digest`);
    observedManifest.push(Object.freeze({ relativePath: file.relativePath, bytes: bytes.byteLength, sha256 }));
  }
  assert.equal(packageManifestAggregateSha256(observedManifest), expected.aggregateSha256, 'frozen production package aggregate digest');
  return expected;
}

function assertWrongExecutableIdentityOverride(
  frozenIdentity: FrozenProductionPackageIdentity,
  override: FrozenProductionPackageIdentity,
) {
  assert.equal(override.packageRoot, frozenIdentity.packageRoot, 'the negative override retains the externally validated package root');
  assert.deepEqual(override.producer, frozenIdentity.producer, 'the negative override retains the externally validated producer identity');
  assert.equal(override.manifest.length, frozenIdentity.manifest.length, 'the negative override retains the complete four-file manifest');
  for (const [index, file] of override.manifest.entries()) {
    const frozenFile = frozenIdentity.manifest[index]!;
    assert.equal(file.relativePath, frozenFile.relativePath, 'the negative override retains every frozen manifest path');
    assert.equal(file.bytes, frozenFile.bytes, 'the negative override retains every frozen manifest byte length');
    if (file.relativePath === 'Contents/MacOS/Xanthil') {
      assert.notEqual(file.sha256, frozenFile.sha256, 'the negative override changes only the executable digest');
    } else {
      assert.equal(file.sha256, frozenFile.sha256, 'the negative override retains every non-executable digest');
    }
  }
  assert.equal(packageManifestAggregateSha256(override.manifest), override.aggregateSha256, 'the negative override recomputes the frozen aggregate algorithm');
}

export type NativeChooserAttachment = Readonly<{
  project_directory: string;
  members_file: string;
  orders_file: string;
  export_file: string;
}>;

function validateChooserAttachment(attachment: NativeChooserAttachment) {
  for (const value of Object.values(attachment)) {
    assert.equal(value.startsWith('/'), true, 'the test-process attachment carries only Main-held absolute native capabilities');
    assert.equal(value.includes('\u0000'), false);
  }
}

export async function launchFrozenProductionApp(attachment: NativeChooserAttachment, wrongExecutableIdentity?: FrozenProductionPackageIdentity) {
  const frozenIdentity = await readFrozenProductionPackageIdentity();
  if (wrongExecutableIdentity !== undefined) assertWrongExecutableIdentityOverride(frozenIdentity, wrongExecutableIdentity);
  const identity = wrongExecutableIdentity ?? frozenIdentity;
  await assertFrozenProductionPackageIdentity(identity);
  const { _electron } = await import('playwright-core');
  validateChooserAttachment(attachment);
  const evidence=process.env.JUANERAI_GUI_EVIDENCE_DIRECTORY;
  assert.ok(evidence&&isAbsolute(evidence),'each GUI run requires its own absolute evidence directory');
  const isolated=await mkdtemp(join(evidence,'launch-')),userData=join(isolated,'user-data'),cwd=join(isolated,'empty-cwd'),tmp=join(isolated,'tmp');
  for(const path of[userData,cwd,tmp])await mkdir(path);
  const app = await _electron.launch({
    executablePath: join(identity.packageRoot, 'Contents/MacOS/Xanthil'),
    chromiumSandbox: true,
    args: ['--user-data-dir='+userData],cwd,env:{PATH:'/usr/bin:/bin',LANG:'en_US.UTF-8',TMPDIR:tmp},
  });
  const observed=await app.evaluate(({app})=>({userData:app.getPath('userData'),sessionData:app.getPath('sessionData'),cwd:process.cwd()}));
  try{assert.deepEqual(observed,{userData,sessionData:userData,cwd});}catch(error){await app.close();throw error;}
  // Test-only native capability boundary. The actual packaged Main/Profile/Store
  // execute unchanged; this does not prove manual native-dialog interaction.
  await app.evaluate(({ dialog }, value) => {
    dialog.showOpenDialog = async (first: BaseWindow | OpenDialogOptions, second?: OpenDialogOptions) => {
      const options = second ?? first;
      if ('properties' in options && options.properties?.includes('openDirectory')) {
        return { canceled: false, filePaths: [value.project_directory] };
      }
      if ('title' in options && options.title === '选择成员 CSV') return {canceled:false,filePaths:[value.members_file]};
      if ('title' in options && options.title === '选择订单 CSV') return {canceled:false,filePaths:[value.orders_file]};
      throw new Error('Synthetic chooser attachment permits only the current Project directory capability');
    };
    dialog.showSaveDialog=async()=>({canceled:false,filePath:value.export_file});
  }, attachment);
  return app;
}
