// Owned synthetic data roots only; no migrations, real report files or OS services.
import {test} from 'node:test';import assert from 'node:assert/strict';import {mkdtemp,realpath,readFile,writeFile,mkdir,symlink,link,rm,readdir} from 'node:fs/promises';import {join} from 'node:path';import {tmpdir} from 'node:os';import {pathToFileURL} from 'node:url';
const root=process.env.JUANERAI_REPORT_STUDIO_SOURCE;assert(root&&process.env.REPORT_STUDIO_BUILTIN==='1');
const {assertStudioDataVersion}=await import(pathToFileURL(join(root,'dist/juanerai/version.js')).href),version='0.1.0-synthetic-builtin',file='.juanerai-version.json';
async function fixture(t){const dir=await realpath(await mkdtemp(join(tmpdir(),'studio-version-')));t.after(()=>rm(dir,{recursive:true,force:true}));return dir;}
test('RS-VERSION-01 first empty root records fixed identity; reopening is read-only',async t=>{
 const dir=await fixture(t);await assertStudioDataVersion(dir,version);const before=await readFile(join(dir,file));assert.deepEqual(JSON.parse(before),{schema_version:'1',data_schema:'1',protocol_version:'1',plugin_version:version,source_commit:'74ebb609fd73cf263614ffc9301dafaafcec4230'});await assertStudioDataVersion(dir,version);assert.deepEqual(await readFile(join(dir,file)),before);
});
test('RS-VERSION-01 unknown identity or damaged metadata is refused without overwrite',async t=>{
 const dir=await fixture(t);await assertStudioDataVersion(dir,version);const original=JSON.parse(await readFile(join(dir,file),'utf8'));
 for(const bad of ['{broken',JSON.stringify({...original,schema_version:'2'}),JSON.stringify({...original,data_schema:'2'}),JSON.stringify({...original,protocol_version:'2'}),JSON.stringify({...original,source_commit:'b'.repeat(40)}),JSON.stringify({...original,extra:true})]){await writeFile(join(dir,file),bad);await assert.rejects(()=>assertStudioDataVersion(dir,version),/RS_DATA_VERSION_INCOMPATIBLE/);assert.equal(await readFile(join(dir,file),'utf8'),bad);}
 await writeFile(join(dir,file),JSON.stringify(original));await assert.rejects(()=>assertStudioDataVersion(dir,'0.2.0-unknown'),/RS_DATA_VERSION_INCOMPATIBLE/);assert.deepEqual(JSON.parse(await readFile(join(dir,file),'utf8')),original);
});
test('RS-VERSION-01 an unversioned nonempty data root is never silently adopted or migrated',async t=>{
 const dir=await fixture(t);await mkdir(join(dir,'proj_existing'));await writeFile(join(dir,'proj_existing','agent-budget.json'),'retained synthetic ledger');await assert.rejects(()=>assertStudioDataVersion(dir,version),/RS_DATA_VERSION_INCOMPATIBLE/);assert.deepEqual(await readdir(dir),['proj_existing']);assert.equal(await readFile(join(dir,'proj_existing','agent-budget.json'),'utf8'),'retained synthetic ledger');
});
test('RS-VERSION-01 fresh launcher HOME/TMPDIR may be stamped, used directories may not',async t=>{
 const first=await fixture(t);await mkdir(join(first,'.home'));await mkdir(join(first,'.tmp'));await assertStudioDataVersion(first,version);
 const used=await fixture(t);await mkdir(join(used,'.home'));await writeFile(join(used,'.home','retained'),'synthetic');await assert.rejects(()=>assertStudioDataVersion(used,version),/RS_DATA_VERSION_INCOMPATIBLE/);assert(!((await readdir(used)).includes(file)));
});
test('RS-VERSION-01 linked and nonordinary metadata is rejected; outer temp-directory aliases are canonicalized by caller',async t=>{
 const dir=await fixture(t);await assertStudioDataVersion(dir,version);const bytes=await readFile(join(dir,file));await rm(join(dir,file));const saved=join(dir,'retained.json');await writeFile(saved,bytes);await symlink(saved,join(dir,file));await assert.rejects(()=>assertStudioDataVersion(dir,version),/RS_DATA_VERSION_INCOMPATIBLE/);await rm(join(dir,file));await link(saved,join(dir,file));await assert.rejects(()=>assertStudioDataVersion(dir,version),/RS_DATA_VERSION_INCOMPATIBLE/);assert.deepEqual(await readFile(saved),bytes);await rm(join(dir,file));await mkdir(join(dir,file));await assert.rejects(()=>assertStudioDataVersion(dir,version),/RS_DATA_VERSION_INCOMPATIBLE/);
});
