import {decisionReturnSummary} from '../../../apps/browser/decision-platform-client.mjs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,realpathSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {createHash,randomUUID} from 'node:crypto';
import {createDecisionWorkspace} from '../../../packages/application/decision-platform.ts';
import {createDecisionStore} from '../../../adapters/decision-platform/store.ts';
import type {DecisionPlatformGateway,DecisionReportReceipt} from '../../../packages/ports/decision-platform.ts';
const sha=(b:Uint8Array)=>createHash('sha256').update(b).digest('hex');
function fixture(){
 const root=realpathSync(mkdtempSync(join(tmpdir(),'dp-app-'))),projectId=randomUUID(),taskId=randomUUID();
 const store=createDecisionStore({projectRoot:root,projectId});const projects=new Map<string,{id:string;marker:string}>(),reports=new Map<string,DecisionReportReceipt>();
 let calls=0,uploads=0,allow=true,drop=false;
 const gateway:DecisionPlatformGateway={async createProject(_title,marker){calls++;const p={id:randomUUID(),marker};projects.set(p.id,p);return p;},async project(id){return projects.get(id)??null;},async uploadReport(projectId,physicalName,content){uploads++;reports.set(physicalName,{projectId,physicalName,reportId:String(uploads),sha256:sha(content),bytes:content.length,status:'done'});if(drop)throw Error('synthetic response lost');},async report(projectId,name){const r=reports.get(name);return r?.projectId===projectId?r:null;}};
 const config={projectId,store,gateway,async authorize(){if(!allow)throw Error('DP_PERMISSION_REQUIRED');},newId:randomUUID,now:()=>new Date().toISOString()};
 const content=Buffer.from('# 合成已保存报告');const source={projectId,taskId,sourceId:randomUUID(),revision:'1',format:'md' as const,filename:'report.md',bytes:content.length,sha256:sha(content)};
 return {config,store,source,content,input:{operationId:randomUUID(),source,content,title:'合成任务'},counts:()=>({calls,uploads}),deny:()=>{allow=false;},drop:()=>{drop=true;},cleanup:()=>rmSync(root,{recursive:true,force:true})};
}
test('DP-SOURCE-01: one task project, exact source versions, duplicate operations do not upload twice',async()=>{
 const f=fixture();try{const app=createDecisionWorkspace(f.config);const first=await app.send(f.input);assert.ok(first.pluginReportId);assert.deepEqual(f.counts(),{calls:1,uploads:1});
 assert.deepEqual(await app.send(f.input),first);assert.deepEqual(await app.send({...f.input,operationId:randomUUID()}),first);assert.deepEqual(f.counts(),{calls:1,uploads:1});
 const second=await app.send({...f.input,operationId:randomUUID(),source:{...f.source,revision:'2'}});assert.notEqual(second.id,first.id);assert.notEqual(second.physicalName,first.physicalName);assert.deepEqual(f.counts(),{calls:1,uploads:2});
 const other=await app.send({...f.input,operationId:randomUUID(),source:{...f.source,taskId:randomUUID()}});assert.notEqual(other.bindingId,first.bindingId);assert.deepEqual(f.counts(),{calls:2,uploads:3});
 }finally{f.cleanup();}
});
test('DP-SOURCE-01: denied permission and changed/cross-project source have zero plugin effects',async()=>{
 const f=fixture();try{const app=createDecisionWorkspace(f.config);await assert.rejects(app.send({...f.input,content:Buffer.from('wrong')}));await assert.rejects(app.send({...f.input,source:{...f.source,projectId:randomUUID()}}));f.deny();await assert.rejects(app.send(f.input),/PERMISSION/);assert.deepEqual(f.counts(),{calls:0,uploads:0});assert.equal(f.store.binding(f.source.taskId),null);}finally{f.cleanup();}
});
test('DP03: lost upload reply persists UNKNOWN, blocks fresh writes, reconciles original same bytes only',async()=>{
 const f=fixture();try{f.drop();const app=createDecisionWorkspace(f.config);await assert.rejects(app.send(f.input),/UNKNOWN/);assert.equal(f.store.intent(f.input.operationId)?.state,'unknown');
 const pending=decisionReturnSummary({reports:f.store.reports(f.source.taskId),operations:f.store.pending(f.source.taskId),state:{unknown:true},view:null},f.source.taskId,'1');assert.equal(pending.reportCount,0);assert.equal(pending.pendingReports.length,1);assert.equal(pending.unknown,true);
 await assert.rejects(app.send({...f.input,operationId:randomUUID(),source:{...f.source,revision:'2'}}),/UNKNOWN/);assert.deepEqual(f.counts(),{calls:1,uploads:1});
 const result=await createDecisionWorkspace(f.config).reconcile(f.input.operationId);assert.ok(result.pluginReportId);assert.equal(f.store.intent(f.input.operationId)?.state,'confirmed');assert.deepEqual(f.counts(),{calls:1,uploads:1});
 const confirmed=decisionReturnSummary({reports:f.store.reports(f.source.taskId),operations:f.store.pending(f.source.taskId),state:{unknown:false},view:null},f.source.taskId,'1');assert.equal(confirmed.reportCount,1);assert.equal(confirmed.pendingReports.length,0);assert.equal(confirmed.unknown,false);
 }finally{f.cleanup();}
});
test('DP-WRITE-02: lost project creation uses its unique marker readback and never creates another project',async()=>{
 const f=fixture();try{
  const original=f.config.gateway.createProject;let created:{id:string;marker:string}|null=null;
  f.config.gateway.createProject=async(title,marker)=>{created=await original(title,marker);throw Error('lost project reply');};
  f.config.gateway.findProject=async marker=>created?.marker===marker?created:null;
  const app=createDecisionWorkspace(f.config);await assert.rejects(app.send(f.input),/DP_EFFECT_UNKNOWN/);const op=f.store.pending(f.source.taskId)[0];assert.equal(op.kind,'project');
  await assert.rejects(app.send({...f.input,operationId:randomUUID()}),/DP_BUSY_OR_UNKNOWN/);await app.reconcileProject(op.id);assert.equal(f.counts().calls,1);assert.ok(f.store.binding(f.source.taskId)?.pluginProjectId);
  await app.send(f.input);assert.deepEqual(f.counts(),{calls:1,uploads:1});
 }finally{f.cleanup();}
});
