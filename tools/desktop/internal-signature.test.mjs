import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';

test('INSTALL-004: delivered app passes real strict deep bundle-signature verification before native launch', () => {
  const app = process.env.JUANERAI_INSTALL_APP;
  assert.ok(app?.endsWith('.app'), 'bind the exact delivery candidate');
  const result = spawnSync('/usr/bin/codesign', ['--verify', '--deep', '--strict', '--verbose=2', app], {
    env: { PATH: '/usr/bin:/bin', LANG: 'en_US.UTF-8' }, encoding: 'utf8', timeout: 30000,
  });
  assert.equal(result.error, undefined);
  assert.equal(result.status, 0, result.stderr);
});

test('INSTALL-004: changed sealed resource is rejected; original bundle stays intact', () => {
  const app = process.env.JUANERAI_INSTALL_APP, destination = process.env.JUANERAI_SIGNATURE_NEGATIVE_DIR;
  assert.ok(app && destination && path.isAbsolute(destination));
  fs.mkdirSync(destination);
  const copy = path.join(destination, 'Xanthil.app');
  fs.mkdirSync(copy);
  function copyEntries(from, to) {
    for (const name of fs.readdirSync(from)) {
      const source = path.join(from, name), target = path.join(to, name), stat = fs.lstatSync(source);
      if (stat.isDirectory()) { fs.mkdirSync(target, { mode: stat.mode & 0o777 }); copyEntries(source, target); }
      else if (stat.isSymbolicLink()) fs.symlinkSync(fs.readlinkSync(source), target);
      else { fs.copyFileSync(source, target, fs.constants.COPYFILE_EXCL | fs.constants.COPYFILE_FICLONE); fs.chmodSync(target, stat.mode & 0o777); }
    }
  }
  copyEntries(app, copy);
  const relative = 'Contents/Resources/toolchain-deployment.json', original = fs.readFileSync(path.join(app, relative));
  fs.appendFileSync(path.join(copy, relative), '\n');
  const result = spawnSync('/usr/bin/codesign', ['--verify', '--deep', '--strict', '--verbose=2', copy], {
    env: { PATH: '/usr/bin:/bin', LANG: 'en_US.UTF-8' }, encoding: 'utf8', timeout: 30000,
  });
  assert.equal(result.error, undefined);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /sealed resource is missing or invalid|file modified/);
  assert.deepEqual(fs.readFileSync(path.join(app, relative)), original);
});
