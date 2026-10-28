import {offlineCredentials} from '../../fixtures/xanthil-desktop/offline-professional-provider.ts';
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
  assert.equal((await f.call(path+'/resolve-references',[ref])).status,400,'old citation cannot silently rebind');assert.equal(f.calls(),f.baseline_calls,'selection/save/confirm never dispatch a model');
  await f.open.reportContentCommand(f.id,{version:'1.0',command_id:randomUUID(),expected_content_sha256:f.content().sha256,action:'suggest',instruction:'只润色表达'});await f.open.waitForIdle();assert.equal(f.calls(),f.baseline_calls+1);assert.equal(f.content().suggestion!.status,'ready');assert.equal(f.content().version,1,'suggestion never auto-applies');
  assert.throws(()=>f.write('confirm'),{code:'REPORT_SUGGESTION_PENDING'});f.write('save',{text:'在建议生成后手改',finding_ids:[]});assert.equal(f.content().suggestion!.stale,true);assert.throws(()=>f.write('apply',{suggestion_id:f.content().suggestion!.id}),{code:'REVISION_CONFLICT'});f.write('discard',{suggestion_id:f.content().suggestion!.id});f.write('confirm');assert.equal(f.content().confirmed,true);
  const copy=await (await f.call(path+'/reports/1/'+f.modelReport.outcome_id+'/copy')).text();assert.match(copy,/已确认这版内容/);assert.match(copy,/在建议生成后手改/);
 }finally{await f.close();}
});

test('BUI-R06: storage transaction rollback and late commit reply preserve exact receipt without duplicate version',async()=>{
 const f=await reportFixture(),content=f.content(),command={version:'1.0',command_id:randomUUID(),expected_content_sha256:content.sha256,action:'save',text:'故障恢复合成文本',finding_ids:[]},original=DatabaseSync.prototype.exec;let fault=false;
 try{DatabaseSync.prototype.exec=function(sql:string){const value=original.call(this,sql);if(sql==='COMMIT'&&!fault){fault=true;throw Error('synthetic commit reply lost');}return value;};assert.throws(()=>f.store.reportContentCommand!(f.id,command));}finally{DatabaseSync.prototype.exec=original;}
 const receipt=f.store.reportContentReceipt!(f.id,command.command_id);assert.ok(receipt);assert.equal(f.content().version,1);assert.deepEqual(f.store.reportContentCommand!(f.id,command),receipt);assert.equal(f.content().version,1);
});
test('BUI-R10 current unstarted suggestion stays generating on passive reopen; explicit discard never dispatches',async()=>{
 const f=await browserUIFixture();f.write('suggest',{instruction:'尚未启动的表达意图'});await f.open.close();let calls=0;
 const app=createPersonalOpenAnalysisWorkspace({projectRoot:f.root,credentials:offlineCredentials,analysisModel:'mimo-v2.6-flash',inspect:async()=>assert.fail('no parsing'),fetch:async()=>{calls++;assert.fail('passive reopen cannot dispatch');}});
 try{assert.equal(app.reportContent(f.id)!.suggestion!.status,'generating','absence of a new SDK operation is not a fabricated failed receipt');assert.equal(calls,0);await app.reportContentCommand(f.id,{version:'1.0',command_id:randomUUID(),expected_content_sha256:f.content().sha256,action:'discard',suggestion_id:f.content().suggestion!.id});assert.equal(f.content().suggestion!.status,'discarded');assert.equal(calls,0);}finally{await app.close();await f.close();}
});
test('BUI-R07/A05: partial waiting never bypasses an actual unconfirmed physical request for save, confirmation or suggestion',async()=>{
 const f=await browserUIFixture();try{const p=await partialReportTask(f);await f.markUnconfirmed(p.id);for(const action of ['save','confirm','suggest']){const response=await f.call('/v1/open-analysis/'+p.id+'/report-content',{version:'1.0',command_id:randomUUID(),expected_content_sha256:p.content().sha256,action,...(action==='save'?{text:'不能越过待确认物理效果',finding_ids:[]}:action==='suggest'?{instruction:'不能调用模型'}:{})});assert.equal(response.status,400);assert.equal(p.content().version,0);assert.equal(p.content().confirmed,false);}assert.equal(f.calls(),f.baseline_calls+1,'only the owned synthetic UNKNOWN response probe dispatched; content commands do not dispatch');}finally{await f.close();}
});
