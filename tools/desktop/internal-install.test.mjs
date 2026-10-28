import assert from 'node:assert/strict';
import test from 'node:test';
import { createHash } from 'node:crypto';
import { readFile, readdir, lstat, readlink, mkdir, writeFile, cp, symlink, chmod } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { openConfirmedDesktopRevision, withIsolatedProject, createControlledDeadlineScheduler } from '../../tests/fixtures/xanthil-desktop/desktop-contract-drivers.ts';
import { desktopTestIds, fixedClock } from '../../tests/fixtures/xanthil-desktop/desktop-fixtures.ts';

const resources = process.env.JUANERAI_INSTALL_RESOURCES;
assert.ok(resources, 'dedicated internal-install command must bind prepared resources');
async function identity(root, dir = root) {
  const result = [];
  for (const name of (await readdir(dir)).sort()) {
    const path = join(dir, name), stat = await lstat(path);
    if (stat.isDirectory()) result.push(...await identity(root, path));
    else if (stat.isSymbolicLink()) result.push([relative(root,path), 'link', await readlink(path)]);
    else result.push([relative(root,path), stat.mode & 0o777, stat.size, createHash('sha256').update(await readFile(path)).digest('hex')]);
  }
  return result;
}








