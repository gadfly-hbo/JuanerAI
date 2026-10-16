import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {DatabaseSync} from 'node:sqlite';
import {reportFixture} from '../../fixtures/xanthil-desktop/browser-ui-report.ts';
import {createPersonalOpenAnalysisWorkspace} from '../../../profiles/personal/open-analysis.ts';
import {createQuickAnalysisClient} from '../../../apps/browser/quick-analysis-client.mjs';
import {resolveReportReferences} from '../../../packages/product-core/browser-report-content.ts';
import {compileNumericReport} from '../../../packages/product-core/open-analysis-numeric-report.ts';

import {browserUIFixture,partialReportTask} from '../../fixtures/xanthil-desktop/browser-ui-report.ts';
test('BUI-R05/06/07/12: public HTTP stores and reads exact content; lost reply recovers once, stale and cross-site writes fail',async()=>{
 const f=await browserUIFixture();try{
  const version=await f.call('/v1/workbench-version');assert.equal(version.status,200);const loaded=await version.json();assert.equal(loaded.contract,'BUI-20261015-004');assert.match(loaded.source_sha256['packages/product-core/browser-report-content.ts'],/^[a-f0-9]{64}$/);
  const path='/v1/open-analysis/'+f.id,task=await (await f.call(path,undefined,{'x-xanthil-view':'browser-v1'})).json();assert.equal(task.browser_report.version,0);assert.equal(task.browser_report.confirmed,false);const c=task.browser_report;
  const ref={kind:'paragraph',task_id:f.id,revision:'1',scope_sha256:f.identity.scope_sha256,content_sha256:c.sha256,id:c.paragraphs[0].id,quote:c.paragraphs[0].text};
  assert.equal((await f.call(path+'/resolve-references',[ref])).status,200);
  for(const invalid of [{...ref,task_id:randomUUID()},{...ref,content_sha256:'d'.repeat(64)},{...ref,quote:'伪造引用'},{...ref,quote:'a'.repeat(1501)}])assert.throws(()=>resolveReportReferences(f.store.read(f.id)!,[invalid]));
  assert.equal((await f.call(path+'/report-content',{version:'1.0',command_id:randomUUID(),action:'confirm',expected_content_sha256:c.sha256},{origin:'https://invalid.example'})).status,403);
  const saved=new Map(),storage={getItem:(k:string)=>saved.get(k)??null,setItem:(k:string,v:string)=>saved.set(k,v),removeItem:(k:string)=>saved.delete(k)};let posts=0;
  const client=createQuickAnalysisClient({control:f.control,storage,request:async(p:RequestInfo|URL,init:RequestInit={})=>{if(init.method==='POST')posts++;const r=await fetch(f.server.origin+p,{...init,headers:{...init.headers,cookie:f.cookie,...(init.method==='POST'?{origin:f.server.origin}:{})}});if(init.method==='POST'){assert.equal(r.status,200);await r.text();throw Error('synthetic lost reply');}return r;}});
  await assert.rejects(()=>client.contentCommand(f.id,c.sha256,'save',{text:'HTTP保存的合成解释。',finding_ids:[]}),/synthetic lost reply/);assert.equal(client.canWrite(),false);await client.recover();assert.equal(posts,1);assert.equal(client.pending(),null);assert.equal(f.content().version,1);
  assert.equal((await f.call(path+'/resolve-references',[ref])).status,400,'old citation cannot silently rebind');assert.equal(f.calls(),0,'selection/save/confirm never dispatch a model');
  await f.open.reportContentCommand(f.id,{version:'1.0',command_id:randomUUID(),expected_content_sha256:f.content().sha256,action:'suggest',instruction:'只润色表达'});await f.open.collect();assert.equal(f.calls(),1);assert.equal(f.content().suggestion!.status,'ready');assert.equal(f.content().version,1,'suggestion never auto-applies');
  assert.throws(()=>f.write('confirm'),{code:'REPORT_SUGGESTION_PENDING'});f.write('save',{text:'在建议生成后手改',finding_ids:[]});assert.equal(f.content().suggestion!.stale,true);assert.throws(()=>f.write('apply',{suggestion_id:f.content().suggestion!.id}),{code:'REVISION_CONFLICT'});f.write('discard',{suggestion_id:f.content().suggestion!.id});f.write('confirm');assert.equal(f.content().confirmed,true);
  const copy=await (await f.call(path+'/reports/1/'+f.outcome.outcome_id+'/copy')).text();assert.match(copy,/已确认这版内容/);assert.match(copy,/在建议生成后手改/);
 }finally{await f.close();}
});
test('BUI-R04/R06/A04: current and historical exports retain locked numeric facts, derivations, not-applicable limits and proof after expression changes',async()=>{
 const f=await browserUIFixture();try{
  const identity={...f.identity,task_id:randomUUID(),run_id:randomUUID(),attempt_id:randomUUID(),operation_id:randomUUID()},id=identity.task_id;
  const numeric=compileNumericReport(JSON.stringify({version:'1.3',status:'ready',derivations:[{id:'D1',label:'北区差额',expression:{op:'subtract',left:{reference:'F1'},right:{reference:'F1'}},format:'number',decimals:2},{id:'D2',label:'零差额分母比例',expression:{op:'divide',left:{reference:'F1'},right:{reference:'D1'}},format:'percent',decimals:2}],interpretations:[{references:['F1','F2','D1','D2'],interpretation:'北区{{F1}}，南区{{F2}}，北区差额{{D1}}；比例{{D2}}，原因仍需调查。'}]}),{verified_calculations:[{execution_plan:f.outcome.framework,calculation:f.outcome.calculation,verification:f.outcome.verification}]},{identity,sources:f.source});
  f.store.create({identity,question:'合成派生数字',source:f.source});const lease=f.store.begin(id);f.store.saveFramework(lease,{...f.store.read(f.id)!.framework!,identity});const outcome={...f.outcome,identity,outcome_id:randomUUID(),numeric_report:numeric,explanation:{kind:'MODEL_EXPLANATION' as const,text:numeric.text}};f.store.saveOutcome(lease,outcome);
  const copy=async()=>{const response=await f.call('/v1/open-analysis/'+id+'/reports/1/'+outcome.outcome_id+'/copy',undefined,{'x-xanthil-report-content':'current'});assert.equal(response.status,200);const text=await response.text();for(const value of numeric.values){assert.ok(text.includes(value.label));assert.ok(text.includes(value.proof_sha256));assert.ok(text.includes(value.source_sha256));for(const limit of value.limitations)assert.ok(text.includes(limit));}assert.match(text,/0\.00 件/);assert.match(text,/不适用/);assert.match(text,/公式：/);assert.match(text,/输入：/);return text;};
  assert.match(await copy(),/未确认/);
  const write=async(action:string,fields:Record<string,unknown>={})=>f.open.reportContentCommand(id,{version:'1.0',command_id:randomUUID(),expected_content_sha256:f.open.reportContent(id)!.sha256,action,...fields});
  await write('save',{text:'用户仅润色解释，不改计算事实。',finding_ids:[]});assert.match(await copy(),/用户仅润色解释/);await write('confirm');assert.match(await copy(),/已确认这版内容/);
  await write('suggest',{instruction:'只润色此段'});await f.open.collect();await write('apply',{suggestion_id:f.open.reportContent(id)!.suggestion!.id});assert.match(await copy(),/合成测试建议/);assert.match(await copy(),/未确认/);
  const next={...identity,revision:'2',run_id:randomUUID(),attempt_id:randomUUID(),operation_id:randomUUID()};f.store.revise(id,{command_id:randomUUID(),expected_revision:'1',question:'另一个范围，尚未执行',identity:next,preferences:{skill:'general',prompt:'professional'}});assert.match(await copy(),/合成测试建议/);assert.equal(f.calls(),1);
 }finally{await f.close();}
});
test('BUI-R06: storage transaction rollback and late commit reply preserve exact receipt without duplicate version',()=>{
 const f=reportFixture(),content=f.content(),command={version:'1.0',command_id:randomUUID(),expected_content_sha256:content.sha256,action:'save',text:'故障恢复合成文本',finding_ids:[]},original=DatabaseSync.prototype.exec;let fault=false;
 try{DatabaseSync.prototype.exec=function(sql:string){const value=original.call(this,sql);if(sql==='COMMIT'&&!fault){fault=true;throw Error('synthetic commit reply lost');}return value;};assert.throws(()=>f.store.reportContentCommand!(f.id,command));}finally{DatabaseSync.prototype.exec=original;}
 const receipt=f.store.reportContentReceipt!(f.id,command.command_id);assert.ok(receipt);assert.equal(f.content().version,1);assert.deepEqual(f.store.reportContentCommand!(f.id,command),receipt);assert.equal(f.content().version,1);
});
test('BUI-R10: reopening an interrupted settled suggestion never dispatches and allows explicit discard',async()=>{
 const f=reportFixture();f.write('suggest',{instruction:'中断前的表达请求'});let calls=0;
 const app=createPersonalOpenAnalysisWorkspace({projectRoot:f.root,inspect:async()=>assert.fail('no parsing'),runtime:{run:async()=>{calls++;assert.fail('reopen cannot run');}},authorizeConfiguration:async()=>assert.fail('reopen cannot probe credentials')});
 try{assert.equal(app.reportContent(f.id)!.suggestion!.status,'failed');assert.equal(calls,0);await app.reportContentCommand(f.id,{version:'1.0',command_id:randomUUID(),expected_content_sha256:f.content().sha256,action:'discard',suggestion_id:f.content().suggestion!.id});assert.equal(f.content().suggestion!.status,'discarded');}finally{await app.close();}
});
test('BUI-R07/A05: partial waiting never bypasses unconfirmed physical effects for save, confirmation or suggestion',async()=>{
 const f=await browserUIFixture(()=>true),p=partialReportTask(f);try{for(const action of ['save','confirm','suggest']){const response=await f.call('/v1/open-analysis/'+p.id+'/report-content',{version:'1.0',command_id:randomUUID(),expected_content_sha256:p.content().sha256,action,...(action==='save'?{text:'不能越过待确认物理效果',finding_ids:[]}:action==='suggest'?{instruction:'不能调用模型'}:{})});assert.equal(response.status,400);assert.equal(p.content().version,0);assert.equal(p.content().confirmed,false);}assert.equal(f.calls(),0);}finally{await f.close();}
});
