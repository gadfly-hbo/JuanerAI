import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync, realpathSync} from 'node:fs';
import {rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import type {OpenStoredTask} from '../../../packages/ports/open-analysis-store.ts';
import type {ReportStudioGateway, ReportStudioProjectIdentity} from '../../../packages/ports/report-studio.ts';
import {createReportStudioStore} from '../../../adapters/report-studio/store.ts';
import {createReportStudioWorkspace} from '../../../packages/application/report-studio.ts';

const id=(n:number)=>`${String(n).padStart(8,'0')}-1111-4111-a111-111111111111`;
function fixture(t:{after(fn:()=>Promise<void>):void}) {
  const root=realpathSync(mkdtempSync(join(tmpdir(),'studio-workspace-')));t.after(()=>rm(root,{recursive:true,force:true}));
  const projectId=id(1), taskId=id(2), store=createReportStudioStore({projectRoot:root,projectId}), projects=new Map<string,ReportStudioProjectIdentity>();
  let current:OpenStoredTask|null={version:'1.4',identity:{task_id:taskId,revision:'1',scope_sha256:'a'.repeat(64)},question:'合成问题',state:'saved',outcome:null,conversation_outcome:{outcome_id:id(3),text:'合成结论'},history:[]} as unknown as OpenStoredTask;
  let n=10, ensureCalls=0, loseReply=false, wrongProject=false;
  const content=Buffer.from('<html><body>合成导出</body></html>');
  const studio:ReportStudioGateway={
    async ensureProject(a){ensureCalls++;const p={project_id:a.studio_project_id,association_id:a.association_id,snapshot_sha256:a.snapshot.snapshot_sha256};projects.set(p.project_id,p);if(loseReply){loseReply=false;throw Error('synthetic lost project reply');}return p;},
    async project(key){return projects.get(key)??null;},
    async savedExport(key,export_id){return {project_id:wrongProject?'other':key,export_id,format:'html',created_at:'2026-10-16T00:00:00Z',artifact_sha256:createHash('sha256').update(content).digest('hex'),content,warnings:['合成警告']};},
  };
  const workspace=()=>createReportStudioWorkspace({projectId,readTask:()=>current,store,studio,newId:()=>id(n++),now:()=> '2026-10-16T00:00:00Z'});
  return {store,projects,taskId,workspace,content,get calls(){return ensureCalls;},set lost(v:boolean){loseReply=v;},set wrong(v:boolean){wrongProject=v;},removeTarget(){current=null;}};
}
test('RS-WORKSPACE-01 opens one precise project; continue never generates or re-creates',async t=>{
  const f=fixture(t),app=f.workspace(),a=await app.open(f.taskId,'1',['conclusion']);assert.equal(a.state,'ready');assert.equal(f.calls,1);
  assert.deepEqual(await app.open(f.taskId,'1',['conclusion']),a);assert.deepEqual(await f.workspace().continueProject(a.association_id),a);assert.equal(f.calls,1);
  f.projects.clear();await assert.rejects(()=>app.continueProject(a.association_id),{code:'RS_STUDIO_PROJECT_UNAVAILABLE'});assert.equal(f.calls,1);
});
test('RS-WORKSPACE-01 lost create reply preserves pending identity and retries same project',async t=>{
  const f=fixture(t),app=f.workspace();f.lost=true;await assert.rejects(()=>app.open(f.taskId,'1',['conclusion']),/synthetic lost project reply/);
  const pending=f.store.sourceAssociation(f.taskId,'1');assert(pending);assert.equal(pending.state,'pending');
  const a=await f.workspace().open(f.taskId,'1',['conclusion']);assert.equal(a.association_id,pending.association_id);assert.equal(a.studio_project_id,pending.studio_project_id);assert.equal(f.projects.size,1);
});
test('RS-WORKSPACE-01 explicit saved export publishes stable idempotent copy and reads receipt',async t=>{
  const f=fixture(t),app=f.workspace(),a=await app.open(f.taskId,'1',['conclusion']);const delivery=await app.deliver(a.association_id,'exp_12345678');
  assert.deepEqual(await app.deliver(a.association_id,'exp_12345678'),delivery);assert.deepEqual(app.receipt(a.association_id,'exp_12345678'),delivery);
  assert.deepEqual(Buffer.from(app.copy(delivery.delivery_id).content),f.content);f.projects.clear();assert.deepEqual(Buffer.from(app.copy(delivery.delivery_id).content),f.content);
});
test('RS-WORKSPACE-01 wrong project, deleted target and wrong source revision cannot deliver',async t=>{
  const f=fixture(t),app=f.workspace();await assert.rejects(()=>app.open(f.taskId,'2',['conclusion']),{code:'RS_SOURCE_UNAVAILABLE'});assert.equal(f.calls,0);
  const a=await app.open(f.taskId,'1',['conclusion']);f.wrong=true;await assert.rejects(()=>app.deliver(a.association_id,'exp_12345678'),{code:'RS_EXPORT_INVALID'});assert.equal(f.store.deliveries(f.taskId).length,0);
  f.removeTarget();await assert.rejects(()=>app.deliver(a.association_id,'exp_87654321'),{code:'RS_TARGET_UNAVAILABLE'});assert.equal(f.store.deliveries(f.taskId).length,0);
});
