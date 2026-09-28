import assert from 'node:assert/strict';
import test from 'node:test';
import {spawnSync} from 'node:child_process';
import {readFile,access} from 'node:fs/promises';
import {join} from 'node:path';
import {withIsolatedProject} from '../../tests/fixtures/xanthil-desktop/desktop-contract-drivers.ts';
const source=process.env.JUANERAI_INSTALL_RESOURCES;assert.ok(source);
test('INSTALL-001/005: reproducible resource preparation rejects mismatched content and existing output',async()=>withIsolatedProject(async root=>{
 const output=join(root,'Resources'),script='tools/desktop/prepare-internal-runtime.mjs';
 const notices=process.env.JUANERAI_INSTALL_NOTICES;assert.ok(notices);
 const invoke=(duck,destination)=>spawnSync(process.execPath,[script,join(source,'toolchain/python'),duck,destination,notices],{encoding:'utf8',timeout:30000,env:{PATH:'/usr/bin:/bin',LANG:'en_US.UTF-8'}});
 const wrong=invoke(new URL('../../tests/fixtures/xanthil-desktop/members.csv',import.meta.url).pathname,output);assert.notEqual(wrong.status,0);await assert.rejects(()=>access(output));
 const ok=invoke(join(source,'toolchain/duckdb'),output);assert.equal(ok.status,0,ok.stderr);
 const before=await readFile(join(output,'toolchain-deployment.json'));assert.deepEqual(before,await readFile(join(source,'toolchain-deployment.json')));
 assert.deepEqual(await readFile(join(output,'THIRD_PARTY_NOTICES/README.txt')),await readFile(join(notices,'README.txt')));
 const collision=invoke(join(source,'toolchain/duckdb'),output);assert.notEqual(collision.status,0);assert.deepEqual(await readFile(join(output,'toolchain-deployment.json')),before);
}));
