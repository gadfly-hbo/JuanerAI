import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, mkdir, writeFile, readFile, symlink, rm, chmod, realpath} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import type {ReportStudioBundleManifest, ReportStudioBundleIdentity} from '../../../packages/contracts/report-studio.ts';
import {verifyReportStudioBundle} from '../../../adapters/report-studio/bundle.ts';

const hash = (bytes: Uint8Array | string) => createHash('sha256').update(bytes).digest('hex');
const roles = ['server', 'web', 'skills', 'node', 'browser', 'dependencies', 'licenses'] as const;
async function fixture(t: {after(fn: () => Promise<void>): void}) {
  const root = await realpath(await mkdtemp(join(tmpdir(), 'report-studio-bundle-')));
  t.after(() => rm(root, {recursive: true, force: true}));
  const manifest: ReportStudioBundleManifest = {schema_version: '1', module: 'reports-factory', version: '0.1.0-synthetic', source_commit: 'a'.repeat(40), protocol_version: '1', files: []};
  for (const role of roles) {
    const path = `resources/${role}/fixture.txt`, bytes = Buffer.from(`synthetic ${role}`);
    await mkdir(join(root, `resources/${role}`), {recursive: true});
    await writeFile(join(root, path), bytes);
    manifest.files.push({path, bytes: bytes.length, sha256: hash(bytes), role});
  }
  const identity: ReportStudioBundleIdentity = {version: manifest.version, source_commit: manifest.source_commit, protocol_version: '1', manifest_sha256: ''};
  async function save(value: unknown = manifest) {
    const bytes = JSON.stringify(value);
    await writeFile(join(root, 'manifest.json'), bytes);
    identity.manifest_sha256 = hash(bytes);
  }
  await save();
  return {root, manifest, identity, save};
}

test('RS-BUNDLE-01 complete pinned tree is ready, bytes remain unchanged, no execution', async t => {
  const f = await fixture(t);
  const before = await Promise.all(f.manifest.files.map(x => readFile(join(f.root, x.path))));
  assert.deepEqual(await verifyReportStudioBundle(f.root, f.identity), {state: 'ready', manifest: f.manifest});
  assert.deepEqual(await Promise.all(f.manifest.files.map(x => readFile(join(f.root, x.path)))), before);
});

test('RS-BUNDLE-01 missing internal bundle remains missing; no independent fallback', async t => {
  const f = await fixture(t);
  assert.deepEqual(await verifyReportStudioBundle(join(f.root, 'absent'), f.identity), {state: 'unavailable', reason: 'missing'});
});

for (const field of ['version', 'source_commit', 'protocol_version', 'manifest_sha256'] as const) {
  test(`RS-BUNDLE-01 refuses host pin mismatch: ${field}`, async t => {
    const f = await fixture(t);
    assert.deepEqual(await verifyReportStudioBundle(f.root, {...f.identity, [field]: 'different'}), {state: 'unavailable', reason: 'incompatible'});
  });
}

for (const mutation of ['missing-file', 'changed-file', 'extra-file'] as const) {
  test(`RS-BUNDLE-01 refuses corrupt complete inventory: ${mutation}`, async t => {
    const f = await fixture(t), file = join(f.root, f.manifest.files[0].path);
    if (mutation === 'missing-file') await rm(file);
    else if (mutation === 'changed-file') await writeFile(file, 'X'.repeat(f.manifest.files[0].bytes));
    else await writeFile(join(f.root, 'unlisted.js'), 'throw new Error("must not execute")');
    assert.deepEqual(await verifyReportStudioBundle(f.root, f.identity), {state: 'unavailable', reason: 'corrupt'});
  });
}

for (const path of ['../outside', '/outside', 'resources//bad', 'resources/./bad', 'resources/../bad', 'resources\\bad', 'manifest.json', 'resources/\u0000bad']) {
  test(`RS-BUNDLE-01 refuses noncanonical/self path ${JSON.stringify(path)}`, async t => {
    const f = await fixture(t); f.manifest.files[0].path = path; await f.save();
    assert.deepEqual(await verifyReportStudioBundle(f.root, f.identity), {state: 'unavailable', reason: 'invalid'});
  });
}

for (const mutation of ['duplicate', 'case-collision', 'unknown-field', 'unknown-role', 'missing-role', 'duplicate-entry', 'bad-size', 'bad-sha', 'unknown-schema', 'unknown-protocol'] as const) {
  test(`RS-BUNDLE-01 rejects invalid closed manifest: ${mutation}`, async t => {
    const f = await fixture(t);
    const value = JSON.parse(JSON.stringify(f.manifest));
    if (mutation === 'duplicate') value.files.push(value.files[0]);
    if (mutation === 'case-collision') value.files.push({...value.files[0], path: value.files[0].path.toUpperCase()});
    if (mutation === 'unknown-field') value.auto_download = true;
    if (mutation === 'unknown-role') value.files[0].role = 'credential';
    if (mutation === 'missing-role') value.files = value.files.filter((x: {role: string}) => x.role !== 'licenses');
    if (mutation === 'duplicate-entry') value.files[1].role = 'server';
    if (mutation === 'bad-size') value.files[0].bytes = -1;
    if (mutation === 'bad-sha') value.files[0].sha256 = 'bad';
    if (mutation === 'unknown-schema') value.schema_version = '2';
    if (mutation === 'unknown-protocol') value.protocol_version = '2';
    await f.save(value);
    assert.deepEqual(await verifyReportStudioBundle(f.root, f.identity), {state: 'unavailable', reason: 'invalid'});
  });
}

for (const target of ['root', 'manifest', 'directory', 'file'] as const) {
  test(`RS-BUNDLE-01 refuses symlink ${target}, never follows external contents`, async t => {
    const f = await fixture(t), outside = join(f.root, 'external');
    await mkdir(outside);
    let root = f.root;
    if (target === 'root') { root = join(f.root, 'alias'); await symlink(f.root, root); }
    if (target === 'manifest') { const bytes = await readFile(join(f.root, 'manifest.json')); await writeFile(join(outside, 'manifest.json'), bytes); await rm(join(f.root, 'manifest.json')); await symlink(join(outside, 'manifest.json'), join(f.root, 'manifest.json')); }
    if (target === 'directory') { await rm(join(f.root, 'resources/server'), {recursive: true}); await symlink(outside, join(f.root, 'resources/server')); }
    if (target === 'file') { const file = join(f.root, f.manifest.files[0].path); await rm(file); await symlink(join(outside, 'secret'), file); }
    assert.equal((await verifyReportStudioBundle(root, f.identity)).state, 'unavailable');
  });
}

test('RS-BUNDLE-02 production version cannot claim readiness without its own fixed credential helper',async t=>{
 const f=await fixture(t);f.manifest.version='0.1.0-juanerai.1';f.identity.version=f.manifest.version;await f.save();assert.deepEqual(await verifyReportStudioBundle(f.root,f.identity),{state:'unavailable',reason:'invalid'});
});

test('RS-BUNDLE-02 bundle composer requires exact helper bytes before creating output; never executes it',async t=>{
 const {buildReportStudioBundle}=await import('../../../tools/report-studio/build-bundle.mjs');const f=await fixture(t),supplier=join(f.root,'supplier'),browser=join(f.root,'chromium');await mkdir(supplier);await mkdir(browser);
 const lock=JSON.stringify({lockfileVersion:3,packages:{}});await writeFile(join(supplier,'package-lock.json'),lock);await writeFile(join(supplier,'package.json'),JSON.stringify({name:'synthetic',version:'1'}));
 for(const path of ['dist','web-dist','assets','node_modules']){await mkdir(join(supplier,path));await writeFile(join(supplier,path,'synthetic.txt'),'synthetic');}await writeFile(join(browser,'synthetic.txt'),'synthetic');
 const node=join(f.root,'node'),license=join(f.root,'LICENSE'),helper=join(f.root,'helper');await writeFile(node,'not executable node');await writeFile(license,'synthetic license');await writeFile(helper,'not executable helper');await chmod(helper,0o700);
 const config={supplierRoot:supplier,nodeFile:node,nodeLicense:license,browserRoot:browser,output:join(f.root,'missing-helper-output'),version:'0.1.0-juanerai.1',sourceCommit:'a'.repeat(40),lockSha256:hash(lock)};
 await assert.rejects(()=>buildReportStudioBundle(config),/RS_BUILD_HELPER_INVALID/);
 await assert.rejects(()=>buildReportStudioBundle({...config,keychainHelper:helper,keychainHelperSha256:'0'.repeat(64)}),/RS_BUILD_HELPER_INVALID/);
 const built=await buildReportStudioBundle({...config,output:join(f.root,'complete-output'),keychainHelper:helper,keychainHelperSha256:hash('not executable helper')});assert(built.manifest.files.some((x:{path:string})=>x.path==='bin/report-studio-keychain'));assert.equal(await readFile(join(f.root,'complete-output/bin/report-studio-keychain'),'utf8'),'not executable helper');
});

async function composerWithBuffers(t: {after(fn: () => Promise<void>): void}) {
  const f = await fixture(t), supplier = join(f.root, 'supplier'), browser = join(f.root, 'chromium');
  await mkdir(supplier); await mkdir(browser);
  for (const path of ['dist', 'web-dist', 'assets', 'node_modules']) {
    await mkdir(join(supplier, path)); await writeFile(join(supplier, path, 'synthetic.txt'), 'synthetic');
  }
  await writeFile(join(browser, 'synthetic.txt'), 'synthetic');
  await writeFile(join(supplier, 'package.json'), JSON.stringify({name: 'synthetic', version: '1'}));
  const data = JSON.parse(await readFile(new URL('../../../vendor/reports-factory/74ebb609/licenses/buffers-0.1.1/source-fixture.json', import.meta.url), 'utf8'));
  const buffers = join(supplier, 'node_modules/buffers');
  for (const file of data.files) {
    await mkdir(join(buffers, file.path, '..'), {recursive: true});
    await writeFile(join(buffers, file.path), Buffer.from(file.base64, 'base64'));
  }
  const lock = JSON.stringify({lockfileVersion: 3, packages: {'node_modules/buffers': {version: '0.1.1'}}});
  await writeFile(join(supplier, 'package-lock.json'), lock);
  const node = join(f.root, 'node'), license = join(f.root, 'LICENSE'), helper = join(f.root, 'helper');
  await writeFile(node, 'not executable node'); await writeFile(license, 'synthetic Node license');
  await writeFile(helper, 'not executable helper'); await chmod(helper, 0o700);
  const config = {supplierRoot: supplier, nodeFile: node, nodeLicense: license, browserRoot: browser,
    output: join(f.root, 'complete-output'), version: '0.1.0-juanerai.1', sourceCommit: 'a'.repeat(40),
    lockSha256: hash(lock), keychainHelper: helper, keychainHelperSha256: hash('not executable helper')};
  return {f, config, buffers};
}

test('RS-BUNDLE-LICENSE-01 L034-01 ships fixed buffers notice and provenance while preserving original metadata', async t => {
  const {buildReportStudioBundle} = await import('../../../tools/report-studio/build-bundle.mjs');
  const {config, buffers} = await composerWithBuffers(t);
  const originalMetadata = await readFile(join(buffers, 'package.json'));
  const built = await buildReportStudioBundle(config);
  const entry = built.manifest.files.find((x: {path: string}) => x.path === 'licenses/buffers-0.1.1-MIT.txt');
  assert(entry, 'exact-version third-party permission notice must accompany the bundle');
  assert.equal(entry.role, 'licenses');
  assert.equal(entry.sha256, '07c8215a9a8fa4d4b4be18ab2b8748fd95870916789ba1e2238ed997bc3364a2');
  const notice = await readFile(join(config.output, entry.path), 'utf8');
  assert.match(notice, /2015 James Halliday/); assert.match(notice, /Permission is hereby granted/);
  assert.match(notice, /all copies or substantial portions/); assert.match(notice, /THE SOFTWARE IS PROVIDED "AS IS"/);
  const provenanceEntry = built.manifest.files.find((x: {path: string}) => x.path === 'licenses/buffers-0.1.1-provenance.json');
  assert(provenanceEntry); assert.equal(provenanceEntry.role, 'licenses');
  const provenance = JSON.parse(await readFile(join(config.output, provenanceEntry.path), 'utf8'));
  assert.equal(provenance.license_commit, '1b745ee35d33eb166e15ef1866073a07c6d7de87');
  assert.equal(provenance.bundled_files.length, 6);
  const index = JSON.parse(await readFile(join(config.output, 'licenses/dependency-notices.json'), 'utf8'));
  assert.equal(index.redistribution_review, 'PENDING');
  const dependency = index.dependencies.find((x: {name: string}) => x.name === 'buffers');
  assert.equal(dependency.license, null);
  assert.deepEqual(dependency.license_resolution, {spdx: 'MIT', upstream_declaration: 'MIT/X11',
    notice_path: 'licenses/buffers-0.1.1-MIT.txt', provenance_path: 'licenses/buffers-0.1.1-provenance.json'});
  assert.deepEqual(await readFile(join(buffers, 'package.json')), originalMetadata);
  assert.deepEqual(await readFile(join(config.output, 'studio/node_modules/buffers/package.json')), originalMetadata);
});

for (const file of ['README.markdown', 'examples/slice.js', 'examples/splice.js', 'index.js', 'package.json', 'test/buffers.js']) {
  test(`RS-BUNDLE-LICENSE-01 L034-02 refuses a notice for altered fixed bytes: ${file}`, async t => {
    const {buildReportStudioBundle} = await import('../../../tools/report-studio/build-bundle.mjs');
    const {f, config, buffers} = await composerWithBuffers(t);
    const original = await readFile(join(buffers, file));
    // Whitespace is enough to change identity, even for otherwise valid JSON/JS.
    await writeFile(join(buffers, file), Buffer.concat([original, Buffer.from('\n')]));
    await assert.rejects(() => buildReportStudioBundle(config), /RS_BUILD_BUFFERS_IDENTITY_MISMATCH/);
    await assert.rejects(() => readFile(join(config.output, 'manifest.json')), {code: 'ENOENT'});
    assert.equal((await import('node:fs')).existsSync(config.output), false);
    assert.deepEqual(await readFile(join(f.root, 'helper')), Buffer.from('not executable helper'));
  });
}

test('RS-BUNDLE-LICENSE-01 L034-02 refuses another version even with matching installed lock metadata', async t => {
  const {buildReportStudioBundle} = await import('../../../tools/report-studio/build-bundle.mjs');
  const {config, buffers} = await composerWithBuffers(t);
  const metadata = JSON.parse(await readFile(join(buffers, 'package.json'), 'utf8'));
  metadata.version = '0.1.2'; await writeFile(join(buffers, 'package.json'), JSON.stringify(metadata));
  const lock = JSON.stringify({lockfileVersion: 3, packages: {'node_modules/buffers': {version: '0.1.2'}}});
  await writeFile(join(config.supplierRoot, 'package-lock.json'), lock); config.lockSha256 = hash(lock);
  await assert.rejects(() => buildReportStudioBundle(config), /RS_BUILD_BUFFERS_IDENTITY_MISMATCH/);
  assert.equal((await import('node:fs')).existsSync(config.output), false);
});

for (const location of ['package-directory', 'nested-directory', 'file']) {
  test(`RS-BUNDLE-LICENSE-01 L034-02 refuses linked license identity input: ${location}`, async t => {
    const {buildReportStudioBundle} = await import('../../../tools/report-studio/build-bundle.mjs');
    const {f, config, buffers} = await composerWithBuffers(t);
    const {cp, rename} = await import('node:fs/promises');
    if (location === 'package-directory') {
      const target = join(f.root, 'outside-buffers'); await rename(buffers, target); await symlink(target, buffers);
    } else if (location === 'nested-directory') {
      const target = join(f.root, 'outside-examples'); await cp(join(buffers, 'examples'), target, {recursive: true});
      await rm(join(buffers, 'examples'), {recursive: true}); await symlink(target, join(buffers, 'examples'));
    } else {
      const target = join(f.root, 'outside-index'); await writeFile(target, await readFile(join(buffers, 'index.js')));
      await rm(join(buffers, 'index.js')); await symlink(target, join(buffers, 'index.js'));
    }
    await assert.rejects(() => buildReportStudioBundle(config), /RS_BUILD_BUFFERS_IDENTITY_MISMATCH/);
    assert.equal((await import('node:fs')).existsSync(config.output), false);
  });
}

test('RS-BUNDLE-LICENSE-01 L034-02 renamed metadata cannot bypass fixed-path identity verification', async t => {
  const {buildReportStudioBundle} = await import('../../../tools/report-studio/build-bundle.mjs');
  const {config, buffers} = await composerWithBuffers(t);
  const metadata = JSON.parse(await readFile(join(buffers, 'package.json'), 'utf8'));
  metadata.name = 'renamed-buffers'; await writeFile(join(buffers, 'package.json'), JSON.stringify(metadata));
  await assert.rejects(() => buildReportStudioBundle(config), /RS_BUILD_BUFFERS_IDENTITY_MISMATCH/);
  assert.equal((await import('node:fs')).existsSync(config.output), false);
});
