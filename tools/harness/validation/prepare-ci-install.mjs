// One approved cloud-only transport view. Never runs npm, Git, lifecycle, or product code.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { lstat, mkdir, readFile, readdir, rename, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const key = 'node_modules/@electron/node-gyp';
const parentKey = 'node_modules/@electron/rebuild';
const commit = '06b29aafb7708acef8b3669835c8a7857ebc92d2';
const url = `https://codeload.github.com/electron/node-gyp/tar.gz/${commit}`;
const rawHash = 'f357931ae77e0e49f2044de30a75f5bb096fc76948e5baa26c29aa0fac285f31';
const rawSRI = 'sha512-MXgzlTDEEndJB3TBbvd5uFQO/8gaINo1Hfen8vef5rq/VHVPeB63uuv/uO5+8GFsAJ/rauu6XB79S6K4+aXc+w==';
const expected = {
  version: '10.2.0-electron.1',
  resolved: `git+ssh://git@github.com/electron/node-gyp.git#${commit}`,
  integrity: 'sha512-CrYo6TntjpoMO1SHjl5Pa/JoUsECNqNdB7Kx49WLQpWzPw53eEITJ2Hs9fh/ryUYDn4pxZz11StaBYBrLFJdqg==',
  dev: true, license: 'MIT',
  dependencies: { 'env-paths': '^2.2.0', 'exponential-backoff': '^3.1.1', glob: '^8.1.0', 'graceful-fs': '^4.2.6', 'make-fetch-happen': '^10.2.1', nopt: '^6.0.0', 'proc-log': '^2.0.1', semver: '^7.3.5', tar: '^6.2.1', which: '^2.0.2' },
  bin: { 'node-gyp': 'bin/node-gyp.js' }, engines: { node: '>=12.13.0' },
};
const digest = bytes => ({ bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') });

export function installView(lock, archive) {
  assert.deepEqual(digest(archive), { bytes: 564012, sha256: rawHash }, 'node-gyp raw archive identity');
  assert.equal(`sha512-${createHash('sha512').update(archive).digest('base64')}`, rawSRI, 'node-gyp raw archive SRI');
  assert.deepEqual(lock.packages?.[key], expected, 'node-gyp exact approved lock entry');
  assert.equal(lock.packages[parentKey]?.dependencies?.['@electron/node-gyp'], `git+https://github.com/electron/node-gyp.git#${commit}`, 'node-gyp exact original parent edge');
  for (const [name, entry] of Object.entries(lock.packages)) {
    if (name !== key && entry.resolved !== undefined) {
      assert.ok(entry.resolved.startsWith('https://registry.npmjs.org/'), `unapproved source: ${name}`);
      assert.match(entry.integrity ?? '', /^sha512-[A-Za-z0-9+/]+=*$/, `missing registry integrity: ${name}`);
    }
  }
  const view = structuredClone(lock);
  view.packages[key].resolved = url;
  view.packages[key].integrity = rawSRI;
  view.packages[parentKey].dependencies['@electron/node-gyp'] = url;
  const reversed = structuredClone(view);
  reversed.packages[key].resolved = expected.resolved;
  reversed.packages[key].integrity = expected.integrity;
  reversed.packages[parentKey].dependencies['@electron/node-gyp'] = lock.packages[parentKey].dependencies['@electron/node-gyp'];
  assert.deepEqual(reversed, lock, 'only three approved transport representation fields differ');
  return view;
}

async function absent(path) {
  try { await lstat(path); } catch (error) { if (error.code === 'ENOENT') return; throw error; }
  assert.fail(`refuse existing path: ${path}`);
}
async function file(path) {
  const stat = await lstat(path);
  assert.ok(stat.isFile() && !stat.isSymbolicLink(), `regular file required: ${path}`);
  return readFile(path);
}

export async function prepare(repo, view, archivePath) {
  await absent(join(repo, 'node_modules'));
  await absent(view);
  const manifest = await file(join(repo, 'package.json'));
  const lock = await file(join(repo, 'package-lock.json'));
  assert.deepEqual(digest(manifest), { bytes: 1350, sha256: '5f986663ae23d716c03b4908ffd822f0a8741c553a7ac3eff5016131331f1636' }, 'approved repository manifest identity');
  assert.deepEqual(digest(lock), { bytes: 319836, sha256: '861326061cd570b0e81584f149012b13228aec3da6528d82536f89cbb5d535c0' }, 'approved repository lock identity');
  const archive = await file(archivePath);
  const mapped = installView(JSON.parse(lock), archive);
  await mkdir(view);
  await writeFile(join(view, 'package.json'), manifest, { flag: 'wx' });
  await writeFile(join(view, 'package-lock.json'), JSON.stringify(mapped, null, 2) + '\n', { flag: 'wx' });
  const receipt = { repo, view, archivePath, manifest: digest(manifest), lock: digest(lock), archive: digest(archive), originalGitRepackSRI: expected.integrity, actualRawSRI: rawSRI, changedFields: [`${key}.resolved`, `${key}.integrity`, `${parentKey}.dependencies.@electron/node-gyp`] };
  await writeFile(join(view, 'source-identity.json'), JSON.stringify(receipt, null, 2) + '\n', { flag: 'wx' });
  return receipt;
}

async function members(root, relative = '') {
  const result = [];
  for (const entry of await readdir(join(root, relative), { withFileTypes: true })) {
    const path = join(relative, entry.name);
    if (relative === '' && entry.name === 'node_modules') continue; // separately locked transitive dependencies
    assert.ok(!entry.isSymbolicLink(), `unexpected package link: ${path}`);
    if (entry.isDirectory()) result.push(...await members(root, path));
    else { assert.ok(entry.isFile(), `unexpected package entry: ${path}`); result.push(path); }
  }
  return result.sort();
}

export async function finalize(repo, view, archivePath) {
  await absent(join(repo, 'node_modules'));
  const receipt = JSON.parse(await file(join(view, 'source-identity.json')));
  assert.deepEqual([receipt.repo, receipt.view, receipt.archivePath], [repo, view, archivePath], 'fixed view invocation');
  const manifest = await file(join(repo, 'package.json')), lock = await file(join(repo, 'package-lock.json')), archive = await file(archivePath);
  assert.deepEqual(digest(manifest), receipt.manifest, 'repository manifest unchanged');
  assert.deepEqual(digest(lock), receipt.lock, 'repository lock unchanged');
  assert.deepEqual(await file(join(view, 'package.json')), manifest, 'view manifest unchanged');
  assert.deepEqual(JSON.parse(await file(join(view, 'package-lock.json'))), installView(JSON.parse(lock), archive), 'only approved three-field view difference');
  const modules = join(view, 'node_modules');
  assert.ok((await lstat(modules)).isDirectory(), 'installed node_modules is a real directory');
  const reference = join(view, 'approved-archive');
  await mkdir(reference); // exclusive: no retry overwrite
  execFileSync('/usr/bin/tar', ['-xzf', archivePath, '--strip-components=1', '-C', reference], { stdio: 'pipe', timeout: 180000 });
  const installed = join(modules, '@electron/node-gyp');
  assert.ok((await lstat(installed)).isDirectory(), 'installed node-gyp is a real directory');
  const paths = await members(reference);
  // npm RemoteFetcher renames .gitignore to .npmignore unless one already exists.
  const expectedPaths = paths.filter(p => basename(p) !== '.gitignore' || !paths.includes(join(dirname(p), '.npmignore')))
    .map(p => basename(p) === '.gitignore' ? join(dirname(p), '.npmignore') : p).sort();
  assert.deepEqual(await members(installed), expectedPaths, 'exact raw-archive member set (npm ignore-file normalization only)');
  for (const path of paths) {
    if (basename(path) === '.gitignore' && paths.includes(join(dirname(path), '.npmignore'))) continue;
    const target = basename(path) === '.gitignore' ? join(dirname(path), '.npmignore') : path;
    assert.deepEqual(await file(join(installed, target)), await file(join(reference, path)), `archive member: ${path}`);
  }
  const metadata = JSON.parse(await file(join(installed, 'package.json')));
  assert.deepEqual([metadata.name, metadata.version], ['@electron/node-gyp', '10.2.0-electron.1']);
  await rename(modules, join(repo, 'node_modules'));
  const result = { ...receipt, verifiedMembers: expectedPaths.length, repositoryInputsUnchanged: true, helperRunsNoScripts: true };
  await writeFile(join(view, 'installed-identity.json'), JSON.stringify(result, null, 2) + '\n', { flag: 'wx' });
  return result;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [mode, repo, view, archive] = process.argv.slice(2);
  assert.ok(process.argv.length === 6 && ['prepare', 'finalize'].includes(mode), 'prepare|finalize repo view archive');
  for (const path of [repo, view, archive]) assert.equal(resolve(path), path, 'absolute normalized invocation path');
  console.log(JSON.stringify(await (mode === 'prepare' ? prepare : finalize)(repo, view, archive), null, 2));
}
