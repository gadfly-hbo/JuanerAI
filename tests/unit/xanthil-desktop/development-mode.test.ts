import assert from 'node:assert/strict';
import test from 'node:test';
import {readFile} from 'node:fs/promises';





import {mkdtemp,mkdir,symlink,writeFile,realpath,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {prepareDevelopmentRoot,assertDevelopmentPath} from '../../../apps/desktop/development.ts';

test('DEV-02 owned development root rejects existing unrelated data and escaped chooser capabilities',async()=>{
 const root=await realpath(await mkdtemp(join(tmpdir(),'desktop-dev-boundary-')));
 const dev=prepareDevelopmentRoot(join(root,'dev'));
 assert.deepEqual(prepareDevelopmentRoot(dev.root),dev);
 const project=join(dev.projects,'synthetic');await mkdir(project);assertDevelopmentPath(dev.projects,project);
 const original=join(root,'original');await mkdir(original);await writeFile(join(original,'sentinel'),'untouched');
 assert.throws(()=>prepareDevelopmentRoot(original));
 assert.throws(()=>assertDevelopmentPath(dev.projects,original));
 const escape=join(dev.projects,'escape');await symlink(original,escape);assert.throws(()=>assertDevelopmentPath(dev.projects,escape));
 assert.throws(()=>assertDevelopmentPath(dev.root,join(escape,'report.html'),true));
 assert.equal(await readFile(join(original,'sentinel'),'utf8'),'untouched');
});





import {runInNewContext} from 'node:vm';
import {EventEmitter} from 'node:events';



test('RS-INSTALL-01 installed browser state cannot silently adopt development or unrelated data',async t=>{
 const root=await realpath(await mkdtemp(join(tmpdir(),'installed-browser-root-')));t.after(()=>rm(root,{recursive:true,force:true}));
 const dev=prepareDevelopmentRoot(join(root,'development'));assert.throws(()=>prepareDevelopmentRoot(dev.root,'installed-browser'));
 const installed=prepareDevelopmentRoot(join(root,'installed'),'installed-browser');assert.deepEqual(prepareDevelopmentRoot(installed.root,'installed-browser'),installed);assert.throws(()=>prepareDevelopmentRoot(installed.root));
 await writeFile(join(installed.projects,'retained'),'synthetic user content');assert.equal(await readFile(join(installed.root,'.juanerai-installed-browser-root'),'utf8'),'juanerai-installed-browser-v1\n');assert.equal(await readFile(join(installed.projects,'retained'),'utf8'),'synthetic user content');
});
