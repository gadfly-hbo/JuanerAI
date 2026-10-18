import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,realpathSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {randomUUID} from 'node:crypto';
import {configuredServiceTrial} from '../../fixtures/deep-research/configured-service.mjs';
const resourcesSource=process.env.DR_RESOURCES_ROOT,programRoot=process.env.DR_PROGRAM_ROOT;
test('DR C02/C11 F004-04: configured descriptor, actual service and task context save/reopen',{skip:!resourcesSource||!programRoot},async t=>{
 const f=await configuredServiceTrial({directory:realpathSync(mkdtempSync(join(process.env.JUANERAI_TEST_EVIDENCE_DIR||tmpdir(),'dr-configured-'))),resourcesSource,programRoot});t.after(()=>f.service.close());
 const opened=await f.call(f.base+'/open',{});assert.equal(opened.status,200);const oldUrl=(await opened.json()).url;
 const versions=await f.call(f.base+'/published');assert.equal(versions.status,200);assert.equal((await versions.json())[0].runId,f.version.runId);
 const commandId=randomUUID(),saved=await f.call(f.base+'/save',{commandId,...f.version});assert.equal(saved.status,200);const receipt=await saved.json();assert.equal(receipt.taskId,f.taskId);assert.ok(receipt.limitations.length);
 const reopened=await f.call(f.base+'/open',{});assert.equal(reopened.status,200);assert.notEqual((await reopened.json()).url,oldUrl);
 const again=await f.call(f.base+'/save',{commandId,...f.version});assert.equal((await again.json()).id,receipt.id);assert.equal((await (await f.call(f.base+'/copies')).json()).length,1);
 const wrong=await f.call(f.base.replace(f.taskId,randomUUID())+'/open',{});assert.notEqual(wrong.status,200);
 const copy=await f.call(f.base+'/copies/'+receipt.id);assert.equal((await copy.arrayBuffer()).byteLength,receipt.bytes);
 const selected=await f.call('/v1/projects/select',{version:'1.0',command_id:randomUUID(),name:'隔离项目'});assert.equal(selected.status,200);assert.notEqual((await f.call(f.base+'/copies')).status,200);
 const back=await f.call('/v1/projects/select',{version:'1.0',command_id:randomUUID(),project_id:f.projectId});assert.equal(back.status,200);assert.equal((await (await f.call(f.base+'/copies')).json())[0].id,receipt.id);
 await f.service.close();await assert.rejects(fetch(f.service.origin));
});
test('DR R06/C03 F004-02: configured bad bundle leaves project switching and shutdown usable',{skip:!resourcesSource||!programRoot},async t=>{
 const f=await configuredServiceTrial({directory:realpathSync(mkdtempSync(join(process.env.JUANERAI_TEST_EVIDENCE_DIR||tmpdir(),'dr-configured-bad-'))),resourcesSource,programRoot,seed:false,badManifest:true});t.after(()=>f.service.close());
 assert.equal((await f.call(f.base+'/open',{})).status,503);assert.equal((await f.call(f.base+'/copies')).status,200);
 const selected=await f.call('/v1/projects/select',{version:'1.0',command_id:randomUUID(),name:'故障后仍可切换'});assert.equal(selected.status,200);await f.service.close();await assert.rejects(fetch(f.service.origin));
});
