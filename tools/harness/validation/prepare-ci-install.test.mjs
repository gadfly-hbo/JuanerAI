import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, mkdtemp, mkdir, writeFile, rm, rmdir, cp, rename, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { installView, prepare, finalize } from './prepare-ci-install.mjs';

const key = 'node_modules/@electron/node-gyp';
const url = 'https://codeload.github.com/electron/node-gyp/tar.gz/06b29aafb7708acef8b3669835c8a7857ebc92d2';
const sri = 'sha512-MXgzlTDEEndJB3TBbvd5uFQO/8gaINo1Hfen8vef5rq/VHVPeB63uuv/uO5+8GFsAJ/rauu6XB79S6K4+aXc+w==';

test('CI-CHECK-001: cloud archive applicability is explicit locally and never skipped in GitHub Actions', async t => {
  const root = await mkdtemp(join(tmpdir(), 'juanerai-ci-applicability-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const bad = join(root, 'bad.tgz'); await writeFile(bad, 'not the approved archive');
  for (const [name, cloud, archive, success] of [
    ['local absent', 'false', undefined, true],
    ['cloud absent', 'true', undefined, false],
    ['local invalid', 'false', bad, false],
    ['cloud invalid', 'true', bad, false],
  ]) await t.test(name, () => {
    const env = { ...process.env, GITHUB_ACTIONS: cloud };
    delete env.NODE_TEST_CONTEXT; // independent, filtered child; never re-enters this applicability test
    delete env.JUANERAI_CI_NODE_GYP_ARCHIVE;
    if (archive) env.JUANERAI_CI_NODE_GYP_ARCHIVE = archive;
    const result = spawnSync(process.execPath, ['--test', '--test-name-pattern=^CI-SOURCE-001:', new URL(import.meta.url).pathname], { env, encoding: 'utf8', timeout: 10000 });
    assert.equal(result.status === 0, success, result.stdout + result.stderr);
    if (success) assert.match(result.stdout, /NOT RUN: cloud archive/);
    else assert.doesNotMatch(result.stdout, /NOT RUN: cloud archive/);
  });
});

test('CI-SOURCE-003: local and CI always reject drift in pinned manifest/lock before archive use or writes', async t => {
  const root = await mkdtemp(join(tmpdir(), 'juanerai-ci-source-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const repo = join(root, 'repo'), view = join(root, 'view'), absentArchive = join(root, 'absent.tgz');
  await mkdir(repo);
  for (const name of ['package.json', 'package-lock.json']) await cp(new URL(`../../../${name}`, import.meta.url), join(repo, name));
  await assert.rejects(() => prepare(repo, view, absentArchive), { code: 'ENOENT' }, 'healthy current pins reach the archive prerequisite');
  for (const name of ['package.json', 'package-lock.json']) {
    const file = join(repo, name), original = await readFile(file);
    const sameSize = Buffer.from(original); sameSize[sameSize.length - 1] = 32;
    for (const changed of [sameSize, Buffer.concat([original, Buffer.from('\n')])]) {
      await writeFile(file, changed);
      await assert.rejects(() => prepare(repo, view, absentArchive), name === 'package.json' ? /approved repository manifest identity/ : /approved repository lock identity/);
      await assert.rejects(() => readdir(view), { code: 'ENOENT' });
      await assert.rejects(() => readdir(join(repo, 'node_modules')), { code: 'ENOENT' });
    }
    await writeFile(file, original);
  }
});
function cloudArchiveUnavailable(t) {
  if (process.env.JUANERAI_CI_NODE_GYP_ARCHIVE) return false;
  assert.notEqual(process.env.GITHUB_ACTIONS, 'true', 'cloud CI requires the explicit approved archive input');
  t.skip('NOT RUN: cloud archive/member proof; local source identities are checked separately');
  return true;
}

test('CI-SOURCE-001: verified raw archive changes only three transport fields, original lock untouched', async t => {
  if (cloudArchiveUnavailable(t)) return;
  const lock = JSON.parse(await readFile(new URL('../../../package-lock.json', import.meta.url)));
  const before = structuredClone(lock);
  assert.ok(process.env.JUANERAI_CI_NODE_GYP_ARCHIVE, 'explicit approved archive input is required');
  const archive = await readFile(process.env.JUANERAI_CI_NODE_GYP_ARCHIVE);
  const view = installView(lock, archive);
  assert.equal(view.packages[key].resolved, url);
  assert.equal(view.packages[key].integrity, sri);
  assert.equal(view.packages['node_modules/@electron/rebuild'].dependencies['@electron/node-gyp'], url);
  view.packages[key].resolved = before.packages[key].resolved;
  view.packages[key].integrity = before.packages[key].integrity;
  view.packages['node_modules/@electron/rebuild'].dependencies['@electron/node-gyp'] = before.packages['node_modules/@electron/rebuild'].dependencies['@electron/node-gyp'];
  assert.deepEqual(view, before);
  assert.deepEqual(lock, before);
  assert.throws(() => installView(lock, Buffer.from('wrong archive')), /archive/);
  for (const field of ['resolved', 'integrity', 'version', 'unexpected']) {
    const changed = structuredClone(lock);
    changed.packages[key][field] = 'unapproved';
    assert.throws(() => installView(changed, archive), /node-gyp/);
  }
  const badParent = structuredClone(lock);
  badParent.packages['node_modules/@electron/rebuild'].dependencies['@electron/node-gyp'] = url;
  assert.throws(() => installView(badParent, archive), /original parent edge/);
});

test('CI-WORKFLOW-001: cloud install is isolated scripts-off with Git forbidden and portable scope explicit', async () => {
  const source = await readFile(new URL('../../../.github/workflows/ci.yml', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /npm install --global/);
  assert.match(source, /GIT_ALLOW_PROTOCOL: ''/);
  assert.match(source, /GIT_TERMINAL_PROMPT: '0'/);
  assert.match(source, /npm ci --prefix "\$INSTALL_VIEW" --ignore-scripts --no-audit --no-fund/);
  assert.match(source, /validation\/run --portable/);
  assert.match(source, /prepare-ci-install\.mjs prepare/);
  assert.match(source, /prepare-ci-install\.mjs finalize/);
  assert.match(source, /timeout --signal=TERM --kill-after=5s 180s/);
  assert.match(source, /timeout-minutes: 20/);
  assert.match(source, /\(set -C; : >"\$RUNNER_TEMP\/\$label.stdout" && : >"\$RUNNER_TEMP\/\$label.stderr"\)/);
  assert.match(source, /EXIT %s %s/);
  assert.match(source, /JUANERAI_TEST_EVIDENCE_DIR="\$RUNNER_TEMP\/portable-test-evidence"/);
  const shell = source.split('        run: |\n')[1].split('\n').map(line => line.replace(/^          /, '')).join('\n');
  execFileSync('/bin/bash', ['-n'], { input: shell }); // syntax only; never execute workflow on this host
});

test('CI-WORKFLOW-002: real log reservation refuses every existing slot without running the child or altering old bytes', async (t) => {
  const source = await readFile(new URL('../../../.github/workflows/ci.yml', import.meta.url), 'utf8');
  const shell = source.split('        run: |\n')[1].split('\n').map(line => line.replace(/^          /, '')).join('\n');
  const definition = shell.slice(shell.indexOf('run_logged() {'), shell.indexOf('\ntest "$(node --version)"'));
  assert.ok(definition.startsWith('run_logged() {') && definition.trimEnd().endsWith('}'));
  for (const [name, stdoutExists, stderrExists, childExit] of [['fresh', false, false, 0], ['stdout-only', true, false, 0], ['stderr-only', false, true, 0], ['both', true, true, 0], ['fresh-child-failure', false, false, 17]]) {
    await t.test(name, async (subtest) => {
      const root = await mkdtemp(join(tmpdir(), 'juanerai-ci-logs-'));
      subtest.after(() => rm(root, { recursive: true, force: true }));
      const stdout = join(root, 'owned.stdout'), stderr = join(root, 'owned.stderr'), marker = join(root, 'child-ran');
      if (stdoutExists) await writeFile(stdout, 'preserved stdout\n', { flag: 'wx' });
      if (stderrExists) await writeFile(stderr, 'preserved stderr\n', { flag: 'wx' });
      // The actual workflow function runs. This local shim only bypasses GNU timeout's
      // Linux-specific wrapper for the immediate synthetic child; no install or CI body runs.
      const invocation = `set -e\ntimeout() { shift 3; "$@"; }\n${definition}\nrun_logged owned /bin/sh -c 'printf child-out; printf child-err >&2; printf ran > "$CI_CHILD_MARKER"; exit "$CI_CHILD_EXIT"'\n`;
      const result = spawnSync('/bin/bash', ['-c', invocation], { env: { PATH: '/usr/bin:/bin', RUNNER_TEMP: root, CI_CHILD_MARKER: marker, CI_CHILD_EXIT: String(childExit) }, encoding: 'utf8', timeout: 10000 });
      assert.equal(result.signal, null);
      if (stdoutExists || stderrExists) {
        assert.equal(result.status, 73, `${name}: refuse existing output before child; ${result.stderr}`);
        await assert.rejects(() => readFile(marker), { code: 'ENOENT' });
        if (stdoutExists) assert.equal(await readFile(stdout, 'utf8'), 'preserved stdout\n');
        if (stderrExists) assert.equal(await readFile(stderr, 'utf8'), 'preserved stderr\n');
      } else {
        assert.equal(result.status, childExit, result.stderr);
        assert.equal(await readFile(marker, 'utf8'), 'ran');
        assert.equal(await readFile(stdout, 'utf8'), 'child-out');
        assert.equal(await readFile(stderr, 'utf8'), 'child-err');
        assert.match(result.stdout, new RegExp(`EXIT owned ${childExit}`));
      }
    });
  }
});

test('CI-TOOLCHAIN-003: workflow exposes the selected Python at the exact toolchain path used by Desktop', async (t) => {
  const source = await readFile(new URL('../../../.github/workflows/ci.yml', import.meta.url), 'utf8');
  const lines = source.split('\n').filter(line => /^\s+ln -s .*"\$TOOLCHAIN_BIN\/(?:node|npm|python3)"$/.test(line));
  const root = await mkdtemp(join(tmpdir(), 'juanerai-ci-toolchain-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  execFileSync('/bin/bash', ['-ec', lines.join('\n')], { env: { PATH: process.env.PATH, TOOLCHAIN_BIN: root } });
  const observed = execFileSync(join(root, 'python3'), ['-I', '-c', "import sys,json,csv,io,base64,datetime; from zoneinfo import ZoneInfo; from fractions import Fraction; assert sys.version_info >= (3,9); assert str(ZoneInfo('Asia/Shanghai')) == 'Asia/Shanghai'; print(sys.version.split()[0])"], { encoding: 'utf8', timeout: 10000, env: { PATH: '/usr/bin:/bin' } }).trim();
  const selected = execFileSync('python3', ['--version'], { encoding: 'utf8', timeout: 10000, env: { PATH: process.env.PATH } }).trim().replace(/^Python /, '');
  assert.equal(observed, selected, 'linked interpreter and selected interpreter have the same actual version');
});

test('CI-SOURCE-002: isolated prepare refuses existing paths; finalize rejects extra view changes and unexpected members', async (t) => {
  if (cloudArchiveUnavailable(t)) return;
  const root = await mkdtemp(join(tmpdir(), 'juanerai-ci-view-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const repo = join(root, 'repo'), view = join(root, 'view');
  await mkdir(repo);
  for (const name of ['package.json', 'package-lock.json']) await cp(new URL(`../../../${name}`, import.meta.url), join(repo, name));
  const archive = process.env.JUANERAI_CI_NODE_GYP_ARCHIVE;
  assert.ok(archive);
  await mkdir(join(repo, 'node_modules'));
  await assert.rejects(() => prepare(repo, view, archive), /existing path/);
  await rmdir(join(repo, 'node_modules')); // empty, owned synthetic precondition fixture
  const manifestIdentity = { bytes: 1757, sha256: '927b08b0659391f2a1b896d9cc5a6e688443f5e905c4842845788fc450ee8736' };
  const lockIdentity = { bytes: 319836, sha256: '861326061cd570b0e81584f149012b13228aec3da6528d82536f89cbb5d535c0' };
  const digest = bytes => ({ bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') });
  const originals = new Map();
  for (const [name, expected] of [['package.json', manifestIdentity], ['package-lock.json', lockIdentity]]) {
    const path = join(repo, name), bytes = await readFile(path);
    assert.deepEqual(digest(bytes), expected, 'fixture is the actual approved current repository input');
    originals.set(name, bytes);
  }
  const receipt = await prepare(repo, view, archive);
  assert.deepEqual(receipt.manifest, manifestIdentity);
  assert.deepEqual(receipt.lock, lockIdentity);
  assert.deepEqual(JSON.parse(await readFile(join(view, 'source-identity.json'))), receipt);
  await assert.rejects(() => prepare(repo, view, archive), /existing path/);
  for (const [name, bytes] of originals) {
    const path = join(repo, name), refusedView = join(root, `refused-${name}`);
    // Valid JSON whitespace changes still invalidate both size and same-size hashes.
    const sameSize = Buffer.from(bytes); sameSize[sameSize.length - 1] = 32;
    for (const changed of [sameSize, Buffer.concat([bytes, Buffer.from('\n')])]) {
      await writeFile(path, changed);
      await assert.rejects(() => prepare(repo, refusedView, archive), name === 'package.json' ? /approved repository manifest identity/ : /approved repository lock identity/);
      await assert.rejects(() => readdir(refusedView), { code: 'ENOENT' }, 'rejection creates no install view');
    }
    await writeFile(path, bytes);
  }
  for (const [name, bytes] of originals) {
    const path = join(repo, name), changed = Buffer.from(bytes); changed[changed.length - 1] = 32;
    await writeFile(path, changed);
    await assert.rejects(() => finalize(repo, view, archive), name === 'package.json' ? /repository manifest unchanged/ : /repository lock unchanged/);
    await assert.rejects(() => readdir(join(repo, 'node_modules')), { code: 'ENOENT' });
    await writeFile(path, bytes);
  }
  const viewManifest = join(view, 'package.json');
  await writeFile(viewManifest, Buffer.concat([originals.get('package.json'), Buffer.from('\n')]));
  await assert.rejects(() => finalize(repo, view, archive), /view manifest unchanged/);
  await writeFile(viewManifest, originals.get('package.json'));
  const receiptPath = join(view, 'source-identity.json'), receiptBytes = await readFile(receiptPath);
  await writeFile(receiptPath, JSON.stringify({ ...receipt, repo: join(root, 'other-repo') }));
  await assert.rejects(() => finalize(repo, view, archive), /fixed view invocation/);
  await writeFile(receiptPath, receiptBytes);
  const lockPath = join(view, 'package-lock.json'), original = await readFile(lockPath);
  const changed = JSON.parse(original); changed.unapproved = true;
  await writeFile(lockPath, JSON.stringify(changed));
  await assert.rejects(() => finalize(repo, view, archive), /three-field/);
  await writeFile(lockPath, original);
  const installed = join(view, 'node_modules', '@electron', 'node-gyp');
  await mkdir(installed, { recursive: true });
  // Fixture only: not npm installation, no archive member is executed.
  execFileSync('/usr/bin/tar', ['-xzf', archive, '--strip-components=1', '-C', installed]);
  async function normalize(root) {
    const entries = await readdir(root, { withFileTypes: true });
    if (entries.some(e => e.name === '.gitignore')) {
      if (entries.some(e => e.name === '.npmignore')) await rm(join(root, '.gitignore'));
      else await rename(join(root, '.gitignore'), join(root, '.npmignore'));
    }
    for (const e of entries) if (e.isDirectory()) await normalize(join(root, e.name));
  }
  await normalize(installed);
  await writeFile(join(installed, 'unexpected.js'), 'not in approved archive');
  await assert.rejects(() => finalize(repo, view, archive), /member set/);
  // The failed reference and bytes remain until this synthetic fixture's normal teardown.
  assert.ok((await readFile(join(installed, 'unexpected.js'))).length);
  const secondView = join(root, 'second-view');
  await prepare(repo, secondView, archive);
  const secondInstalled = join(secondView, 'node_modules', '@electron', 'node-gyp');
  await cp(installed, secondInstalled, { recursive: true, errorOnExist: true, force: false });
  await rm(join(secondInstalled, 'unexpected.js'));
  const result = await finalize(repo, secondView, archive);
  assert.ok(result.verifiedMembers > 100);
  assert.deepEqual(result.manifest, manifestIdentity);
  assert.deepEqual(result.lock, lockIdentity);
  assert.equal(result.repositoryInputsUnchanged, true);
  assert.equal(result.helperRunsNoScripts, true);
  assert.deepEqual(await readFile(join(repo, 'package.json')), originals.get('package.json'));
  assert.deepEqual(JSON.parse(await readFile(join(secondView, 'installed-identity.json'))), result);
  assert.deepEqual(await readFile(join(repo, 'package-lock.json')), await readFile(new URL('../../../package-lock.json', import.meta.url)));
  await assert.rejects(() => finalize(repo, secondView, archive), /existing path/);
});
