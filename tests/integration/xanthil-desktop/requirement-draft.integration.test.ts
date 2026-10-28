import {offlineCredentials,offlineResponse,syntheticFormation} from '../../fixtures/xanthil-desktop/offline-professional-provider.ts';
import {createMemberSourceInspector} from '../../../adapters/analytics-duckdb/member-source-inspection.ts';
import assert from 'node:assert/strict';
import test from 'node:test';
import {mkdtempSync} from 'node:fs';
import {join} from 'node:path';
import {randomUUID,createHash} from 'node:crypto';
const requireDigest=(bytes:Uint8Array)=>createHash('sha256').update(bytes).digest('hex');
import {createLocalOpenAnalysisStore} from '../../../adapters/storage-local/open-analysis.ts';
import {browserEvidenceRoot} from '../../fixtures/xanthil-desktop/browser-evidence.ts';
import {taskHash} from '../../../packages/product-core/member-task.ts';
import {createOpenAnalysisWorkspace} from '../../../packages/application/open-analysis-workspace.ts';

import {createPersonalOpenAnalysisWorkspace} from '../../../profiles/personal/open-analysis.ts';
import {startBrowserMembershipServer} from '../../../apps/browser/local-server.ts';
import {openTaskView} from '../../../apps/browser/quick-analysis-client.mjs';
import {renderQuickAnalysisWorkbench} from '../../../apps/browser/quick-analysis-workbench.mjs';

test('NR01-01: actual Workspace declares native read without a second family of business read tools',async()=>{
 const root=mkdtempSync(join(process.env.JUANERAI_NEWARCH_SHORT_ROOT??browserEvidenceRoot,'native-read-surface-'));let names:string[]=[];
 const app=createPersonalOpenAnalysisWorkspace({projectRoot:root,analysisModel:'mimo-v2.6-flash',credentials:offlineCredentials,inspect:async()=>assert.fail('no file selected'),fetch:async(_url,init)=>{const dto=JSON.parse(String(init!.body));names=(dto.tools??[]).map((t:any)=>t.function?.name??t.name);return offlineResponse(1,[],'当前没有资料也能先讨论，具体范围仍待补充。');}});
 try{const task=await app.submit({version:'1.0',command_id:randomUUID(),question:'先讨论问题，暂未提供资料',confirmed:true,mode:'requirements',sources:[]});await app.discussRequirement(task.identity.task_id,{version:'1.0',command_id:randomUUID(),expected_sequence:0,message:'先说明现有信息和缺口'});await app.waitForIdle();assert.ok(app.read(task.identity.task_id).requirement_draft);assert.ok(names.includes('read'));for(const name of ['inspect_selected','read_project_metric_asset','read_delegation_materials','read_delegation_results'])assert.ok(!names.includes(name),name+' must be retired rather than renamed or phase-hidden');}finally{await app.close();}
});

test('NR01-02/03: initial ready Task reads actual authorized catalogs through native read and continues the same discussion',async()=>{
 const root=mkdtempSync(join(process.env.JUANERAI_NEWARCH_SHORT_ROOT??browserEvidenceRoot,'native-read-catalogs-')),paths:string[]=[];let calls=0;const replies:string[]=[];
 const app=createPersonalOpenAnalysisWorkspace({projectRoot:root,analysisModel:'mimo-v2.6-flash',credentials:offlineCredentials,inspect:async()=>assert.fail('no file selected'),fetch:async(_url,init)=>{const dto=JSON.parse(String(init!.body));for(const m of dto.messages??[])if(m.role==='tool')replies.push(JSON.stringify(m.content));const path=paths[calls++];return path?offlineResponse(calls,[{name:'read',args:{path}}]):offlineResponse(calls,[],'资料尚未提供，企业资产和可委派材料尚不可用。可以先讨论目标，只暂停依赖资料的判断。');}});
 try{const task=await app.submit({version:'1.0',command_id:randomUUID(),question:'先讨论，不要求先填齐资料',confirmed:true,mode:'requirements',sources:[]}),id=task.identity.task_id;paths.push(join(root,'analyses',id,'020_clean/source/catalog.txt'),join(root,'analyses',id,'020_clean/metric-asset/catalog.txt'));await app.discussRequirement(id,{version:'1.0',command_id:randomUUID(),expected_sequence:0,message:'请查看本任务实际可用资料后说明缺口'});await app.waitForIdle();const saved=app.read(id),diagnostics=await app.diagnostics(id);assert.ok(saved.requirement_draft,JSON.stringify({calls,diagnostics,replies}));assert.equal(saved.state,'ready');assert.equal(saved.outcome,null);assert.equal(saved.computation_records.length,0);assert.equal(calls,3);assert.equal(diagnostics.unconfirmed_effects,false);assert.ok(replies.some(s=>s.includes('sheet_catalog_path')||s.includes('sources')));const count=calls;await app.close();const reopened=createPersonalOpenAnalysisWorkspace({projectRoot:root,analysisModel:'mimo-v2.6-flash',credentials:offlineCredentials,inspect:async()=>assert.fail('passive'),fetch:async()=>assert.fail('passive reopen sends nothing')});try{assert.deepEqual(reopened.read(id).requirement_draft,saved.requirement_draft);assert.equal(calls,count);}finally{await reopened.close();}}finally{await app.close();}
});

test('RS-03/05: stop during material inspection preserves draft and rejects late material publication',async()=>{
 const f=draftFixture('requirements');let begin!:()=>void,finish!:()=>void;
 const started=new Promise<void>(r=>begin=r),release=new Promise<void>(r=>finish=r),file={source_id:randomUUID(),display_name:'新增.csv',format:'csv' as const,bytes:Buffer.from('数量\n7\n')};
 const app=createPersonalOpenAnalysisWorkspace({projectRoot:f.root,credentials:{withCredential:async()=>assert.fail('passive command must not access credentials')},authorizeConfiguration:async()=>assert.fail('cannot read credentials'),inspect:async()=>{begin();await release;return {version:'1.0',sources:[{...f.store.read(f.identity.task_id)!.source.sources[0]!,source_id:file.source_id,display_name:file.display_name,format:file.format,sha256:requireDigest(file.bytes),byte_length:String(file.bytes.length)}]};}});
 try{app.saveRequirementDraft(f.identity.task_id,f.command);const pending=app.addRequirementMaterials(f.identity.task_id,{version:'1.0',command_id:randomUUID(),expected_revision:'1',sources:[file]});await started;app.stop(f.identity.task_id);finish();await assert.rejects(()=>pending,{code:'REVISION_CONFLICT'});assert.equal(app.read(f.identity.task_id).state,'stopped');assert.equal(app.read(f.identity.task_id).identity.revision,'1');assert.equal(app.read(f.identity.task_id).requirement_draft?.revision,1);assert.equal(app.read(f.identity.task_id).requirement_materials,undefined);}finally{finish();await app.close();}
});
test('RS-03/05: adding selected material saves on the same task, invalidates review and never calls credentials or analysis',async()=>{
 const f=draftFixture('requirements');let inspections=0;const file={source_id:randomUUID(),display_name:'新增.csv',format:'csv' as const,bytes:Buffer.from('数量\n7\n')};
 const app=createPersonalOpenAnalysisWorkspace({projectRoot:f.root,credentials:{withCredential:async()=>assert.fail('passive command must not access credentials')},authorizeConfiguration:async()=>assert.fail('material save cannot read credentials'),inspect:async input=>{inspections++;assert.deepEqual(input.sources,[file]);return {version:'1.0',sources:[{source_id:file.source_id,display_name:file.display_name,format:file.format,sha256:requireDigest(file.bytes),byte_length:String(file.bytes.length),sheets:[{sheet_id:randomUUID(),name:'CSV',state:'visible',rows:[{row:1,cells:[{column:'A',type:'string',value:'数量'}]},{row:2,cells:[{column:'A',type:'number',value:'7'}]}]}]}]};}});
 try{app.saveRequirementDraft(f.identity.task_id,f.command);assert.equal(Reflect.get(app,'reviewRequirement'),undefined);
 const command={version:'1.0',command_id:randomUUID(),expected_revision:'1',sources:[file]};const add=Reflect.get(app,'addRequirementMaterials');assert.equal(typeof add,'function');
 const saved=await add(f.identity.task_id,command);assert.equal(saved.identity.task_id,f.identity.task_id);assert.equal(saved.identity.revision,'2');assert.equal(saved.source.sources.length,f.store.read(f.identity.task_id)!.history![0]!.source.sources.length+1);assert.equal(saved.requirement_draft?.revision,1);assert.equal(saved.computation_records.length,0);assert.equal(saved.outcome,null);assert.equal(saved.state,'ready');assert.equal(saved.requirement_materials?.length,1);
 await assert.rejects(()=>app.startRequirement(f.identity.task_id,{version:'1.0',command_id:randomUUID(),expected_revision:1,confirmed:true}),{code:'AUTHORITY_REQUIRED'});
 assert.deepEqual(await add(f.identity.task_id,command),saved);assert.equal(inspections,1);
 await assert.rejects(()=>add(f.identity.task_id,{...command,sources:[{...file,bytes:Buffer.from('changed')}]}),{code:'COMMAND_CONFLICT'});assert.equal(inspections,1);
 }finally{await app.close();}
});
test('RS-05: stopped unstarted requirement resumes only its saved draft without credentials, model or calculation',async()=>{
 const root=mkdtempSync(join(process.env.JUANERAI_NEWARCH_SHORT_ROOT??browserEvidenceRoot,'requirement-resume-'));let authorizations=0;
 const app=createPersonalOpenAnalysisWorkspace({projectRoot:root,credentials:{withCredential:async()=>assert.fail('passive command must not access credentials')},inspect:async()=>assert.fail('no selected files'),authorizeConfiguration:async()=>{authorizations++;throw Object.assign(Error('credential unavailable'),{code:'KEY_REQUIRED'});}});
 try{
  const task=await app.submit({version:'1.0',command_id:randomUUID(),question:'先整理需求',confirmed:true,mode:'requirements',sources:[]});
  const f=draftFixture();app.saveRequirementDraft(task.identity.task_id,f.command);app.stop(task.identity.task_id);
  assert.equal(app.read(task.identity.task_id).state,'stopped');
  const resumed=await app.resume(task.identity.task_id);await app.waitForIdle();
  assert.equal(resumed.state,'ready');assert.equal(authorizations,0);assert.equal(resumed.computation_records.length,0);assert.equal(resumed.outcome,null);
  assert.equal(resumed.requirement_draft?.revision,1);
 }finally{await app.close();}
});
test('RS-04: requirements-only creation and manual save remain available without model credentials',async()=>{
 const root=mkdtempSync(join(process.env.JUANERAI_NEWARCH_SHORT_ROOT??browserEvidenceRoot,'requirement-manual-'));let authorizations=0;
 const app=createPersonalOpenAnalysisWorkspace({projectRoot:root,credentials:{withCredential:async()=>assert.fail('passive command must not access credentials')},inspect:async()=>assert.fail('no selected files'),authorizeConfiguration:async()=>{authorizations++;throw Object.assign(Error('credential unavailable'),{code:'KEY_REQUIRED'});}});
 try{const task=await app.submit({version:'1.0',command_id:randomUUID(),question:'先整理需求',confirmed:true,mode:'requirements',sources:[]});const f=draftFixture();app.saveRequirementDraft(task.identity.task_id,f.command);assert.equal(authorizations,0);assert.equal(app.read(task.identity.task_id).state,'ready');assert.equal(app.read(task.identity.task_id).requirement_draft?.conversation,undefined);}finally{await app.close();}
});
test('RS-01/05: requirements-only entry creates one durable task without starting analysis or inspecting absent files',async()=>{
 const root=mkdtempSync(join(process.env.JUANERAI_NEWARCH_SHORT_ROOT??browserEvidenceRoot,'requirement-entry-'));
 const config={projectRoot:root,credentials:{withCredential:async()=>assert.fail('passive command must not access credentials')},inspect:async()=>assert.fail('absent files must not be inspected'),authorizeConfiguration:async()=>({config_sha256:'b'.repeat(64)})};
 const app=createPersonalOpenAnalysisWorkspace(config),command={version:'1.0',command_id:randomUUID(),question:'先帮我理清经营分析需求',confirmed:true,mode:'requirements',sources:[]};
 try{
  const first=await app.submit(command);assert.equal(first.identity.task_id,command.command_id);assert.equal(first.state,'ready');assert.equal(first.outcome,null);assert.equal(first.computation_records.length,0);
  await app.waitForIdle();assert.equal(app.read(command.command_id).state,'ready');
  assert.deepEqual(await app.submit(command),first);
  const reopened=createPersonalOpenAnalysisWorkspace(config);try{assert.deepEqual(reopened.read(command.command_id),first);}finally{await reopened.close();}
  await assert.rejects(()=>app.submit({...command,mode:'analysis'}),{code:'COMMAND_CONFLICT'});
 }finally{await app.close();}
});

test('V12-01/03: no-file task can persist a requirement framework without execution or new authority',()=>{
 const root=mkdtempSync(join(process.env.JUANERAI_NEWARCH_SHORT_ROOT??browserEvidenceRoot,'requirement-draft-'));
 const source={version:'1.0' as const,sources:[]};
 const identity={task_id:randomUUID(),revision:'1',run_id:randomUUID(),attempt_id:randomUUID(),operation_id:randomUUID(),grant_id:randomUUID(),scope_sha256:taskHash(source),config_sha256:'b'.repeat(64)};
 const store=createLocalOpenAnalysisStore({projectRoot:root});const original=store.create({identity,question:'先帮我理清会员经营分析需求',source});
 const save=Reflect.get(store,'saveRequirementDraft');assert.equal(typeof save,'function','non-executing draft save must exist');
 const content={version:'2.0' as const,text:'SCR：解释近期会员效果变化。Binding：订单与会员资料。IR：比较期间待补，只描述变化和限制。'};
 const command={version:'1.0',command_id:randomUUID(),expected_sequence:0,content,message:'先整理需求，暂不分析'};
 const saved=save(identity.task_id,command);
 assert.ok(saved.requirement_draft);assert.equal(saved.requirement_draft.revision,1);assert.equal(saved.requirement_draft.sequence,1);
 assert.deepEqual(saved.identity,identity);assert.equal(saved.state,original.state);assert.equal(saved.epoch,0);assert.equal(saved.computation_records.length,0);assert.equal(saved.outcome,null);
 const reopened=createLocalOpenAnalysisStore({projectRoot:root});assert.deepEqual(reopened.read(identity.task_id),saved);
 assert.deepEqual(Reflect.get(reopened,'saveRequirementDraft')(identity.task_id,command),saved);
});

function draftFixture(entry_mode?:'requirements'){
 const root=mkdtempSync(join(process.env.JUANERAI_NEWARCH_SHORT_ROOT??browserEvidenceRoot,'requirement-draft-contract-')),source={version:'1.0' as const,sources:[]};
 const identity={task_id:randomUUID(),revision:'1',run_id:randomUUID(),attempt_id:randomUUID(),operation_id:randomUUID(),grant_id:randomUUID(),scope_sha256:taskHash(source),config_sha256:'b'.repeat(64)};
 const store=createLocalOpenAnalysisStore({projectRoot:root});store.create({identity,question:'先理清需求',source,...(entry_mode?{entry_mode}:{})});
 const content={version:'2.0' as const,text:'SCR：解释会员效果变化。Binding：全部会员资料。IR：期间待补，先描述变化。'};
 return {root,identity,store,command:{version:'1.0',command_id:randomUUID(),expected_sequence:0,content,message:'先整理'}};
}

function draftWorkspace(fixture:ReturnType<typeof draftFixture>){
 const app=createPersonalOpenAnalysisWorkspace({projectRoot:fixture.root,credentials:{withCredential:async()=>assert.fail('saving a framework must not access credentials')},inspect:async()=>assert.fail('saving a framework must not read materials'),authorizeConfiguration:async()=>assert.fail('saving a framework must not grant execution')});return {app};
}

test('V12-03: workspace save/read/reopen is non-executing and closed service cannot acknowledge a save',async()=>{
 const f=draftFixture(),{app}=draftWorkspace(f),save=Reflect.get(app,'saveRequirementDraft');
 assert.equal(typeof save,'function','workspace must expose acknowledged non-executing draft persistence');
 const before=app.read(f.identity.task_id),saved=save(f.identity.task_id,f.command);
 assert.deepEqual(saved.identity,before.identity);assert.equal(saved.state,before.state);assert.equal(saved.epoch,before.epoch);
 assert.equal(app.read(f.identity.task_id).requirement_draft?.sequence,1);
 await app.close();assert.throws(()=>save(f.identity.task_id,f.command),{code:'SERVICE_CLOSED'});
 const reopened=draftWorkspace({...f,store:createLocalOpenAnalysisStore({projectRoot:f.root})});
 try{assert.deepEqual(reopened.app.read(f.identity.task_id),saved);}finally{await reopened.app.close();}
});

test('V12-03/RT04: draft save cannot replace input while an actual native physical request remains pending',{timeout:10000},async()=>{
 const root=mkdtempSync(join(process.env.JUANERAI_NEWARCH_SHORT_ROOT??browserEvidenceRoot,'pending-')),f=draftFixture();let entered!:()=>void,release!:()=>void;const began=new Promise<void>(r=>entered=r),gate=new Promise<void>(r=>release=r);
 const app=createPersonalOpenAnalysisWorkspace({projectRoot:root,analysisModel:'mimo-v2.6-flash',credentials:offlineCredentials,inspect:async()=>assert.fail('no files'),fetch:async()=>{entered();await gate;return offlineResponse(1);}});
 try{const task=await app.submit({version:'1.0',command_id:randomUUID(),question:'先理清需求',confirmed:true,mode:'requirements',sources:[]}),id=task.identity.task_id;await app.discussRequirement(id,{version:'1.0',command_id:randomUUID(),expected_sequence:0,message:'整理需求'});await began;const before=app.read(id);assert.throws(()=>app.saveRequirementDraft(id,f.command),{code:'TASK_BUSY'});assert.deepEqual(app.read(id),before);assert.equal((await app.diagnostics(id)).unconfirmed_effects,true);}finally{release();await app.close();}
});

test('V12-03: actual browser control saves and reads a draft without model/credentials/material execution',async()=>{
 const f=draftFixture(),open=createPersonalOpenAnalysisWorkspace({projectRoot:f.root,
  credentials:{withCredential:async()=>assert.fail('passive command must not access credentials')},
  inspect:async()=>assert.fail('draft HTTP must not inspect materials'),
  authorizeConfiguration:async()=>assert.fail('draft HTTP must not read credentials')});
 const unused=async():Promise<never>=>assert.fail('membership readback is not used by a requirement save');
 const server=await startBrowserMembershipServer({open,store:{readBrowserReportCopy:unused,readBrowserTask:unused,readBrowserReceipt:unused,stopBrowserTask:unused}}),release=Reflect.get(globalThis,Symbol.for('Mini.D006.ownedLoopback'))?.(server.origin);
 try{
  const boot=await fetch(server.origin+'/v1/bootstrap',{method:'POST',headers:{'content-type':'application/json',origin:server.origin},body:JSON.stringify({token:server.bootstrap})});assert.equal(boot.status,200);
  const cookie=boot.headers.get('set-cookie')!.split(';')[0]!,control=(await boot.json()).control;
  const path='/v1/open-analysis/'+f.identity.task_id+'/requirement-draft';
  const headers={'content-type':'application/json',cookie,origin:server.origin,'x-xanthil-control':control,'x-xanthil-view':'browser-v1'};
  const denied=await fetch(server.origin+path,{method:'POST',headers:{...headers,'x-xanthil-control':'wrong'},body:JSON.stringify(f.command)});assert.equal(denied.status,403);
  const materialPath='/v1/open-analysis/'+f.identity.task_id+'/requirement-materials';
  const materialDenied=await fetch(server.origin+materialPath,{method:'POST',headers:{...headers,'x-xanthil-control':'wrong'},body:'{}'});assert.equal(materialDenied.status,403);
  const emptyMaterial=await fetch(server.origin+materialPath,{method:'POST',headers,body:JSON.stringify({version:'1.0',command_id:randomUUID(),expected_revision:'1',sources:[]})});assert.equal(emptyMaterial.status,400);
  assert.equal(open.read(f.identity.task_id).requirement_draft,undefined);
  const saved=await fetch(server.origin+path,{method:'POST',headers,body:JSON.stringify(f.command)});assert.equal(saved.status,200,'production HTTP save route must acknowledge the same-task draft');const value=await saved.json();assert.equal(value.requirement_draft.sequence,1);assert.equal(value.computation_records.length,0);assert.equal(value.outcome,null);
  const retry=await fetch(server.origin+path,{method:'POST',headers,body:JSON.stringify(f.command)});assert.equal(retry.status,200);assert.deepEqual(await retry.json(),value);
  const conflict=await fetch(server.origin+path,{method:'POST',headers,body:JSON.stringify({...f.command,message:'conflicting retry'})});assert.equal(conflict.status,409);
  const read=await fetch(server.origin+'/v1/open-analysis/'+f.identity.task_id,{headers:{cookie,'x-xanthil-view':'browser-v1'}});assert.equal(read.status,200);assert.deepEqual(await read.json(),value);
  
 }finally{await server.close();await open.close();release?.();}
});

test('V12-03: receipt conflict and stale autosave preserve committed data and permit explicit retry',()=>{
 const {root,identity,store,command}=draftFixture();const first=store.saveRequirementDraft(identity.task_id,command);
 assert.throws(()=>store.saveRequirementDraft(identity.task_id,{...command,message:'different body'}),{code:'COMMAND_CONFLICT'});
 const stale={...command,command_id:randomUUID(),message:'later edit'};
 assert.throws(()=>store.saveRequirementDraft(identity.task_id,stale),{code:'REVISION_CONFLICT'});
 assert.deepEqual(createLocalOpenAnalysisStore({projectRoot:root}).read(identity.task_id),first);
 const retry=store.saveRequirementDraft(identity.task_id,{...stale,expected_sequence:1});assert.equal(retry.requirement_draft?.sequence,2);assert.equal(retry.requirement_draft?.revision,1);
});

test('V12-03/04: real business edits version drafts; unchanged body retains its version, changed wording creates a new confirmed-context target',()=>{
 const {identity,store,command}=draftFixture();store.saveRequirementDraft(identity.task_id,command);
 const same=store.saveRequirementDraft(identity.task_id,{...command,command_id:randomUUID(),expected_sequence:1,message:'换一种说法'});
 assert.equal(same.requirement_draft?.revision,1);assert.equal(same.requirement_draft?.history.length,0);
 const changed={version:'2.0' as const,text:'SCR：分地区比较。Binding：北区会员的订单与会员关联资料。IR：只给北区观察。'};
 const next=store.saveRequirementDraft(identity.task_id,{...command,command_id:randomUUID(),expected_sequence:2,content:changed});
 assert.equal(next.requirement_draft?.revision,2);assert.deepEqual(next.requirement_draft?.history,[{revision:1,content:command.content}]);
 assert.equal(next.identity.revision,'1');assert.equal(next.epoch,0);assert.equal(next.computation_records.length,0);assert.equal(next.outcome,null);
});

test('V12-03: framework edits cannot replace an in-flight or unreconciled task input',()=>{
 const {identity,store,command}=draftFixture();store.begin(identity.task_id);const running=store.read(identity.task_id);
 assert.throws(()=>store.saveRequirementDraft(identity.task_id,command),{code:'TASK_UNCONFIRMED'});assert.deepEqual(store.read(identity.task_id),running);
 store.recover(identity.task_id);const unknown=store.read(identity.task_id);
 assert.equal(unknown?.state,'unknown');assert.throws(()=>store.saveRequirementDraft(identity.task_id,command),{code:'TASK_UNCONFIRMED'});assert.deepEqual(store.read(identity.task_id),unknown);
});

test('V12-01/03: preview is a candidate and cannot carry verified outcomes or permission fields',()=>{
 const {identity,store,command}=draftFixture();const before=store.read(identity.task_id);
 assert.throws(()=>store.saveRequirementDraft(identity.task_id,{...command,content:{...command.content,authorized:true}}));
 assert.throws(()=>store.saveRequirementDraft(identity.task_id,{...command,content:{...command.content,previews:[{possibility:'verified',answer:'Profit is proven',needs:[],impact:'Execute'}]}}),{code:'VALIDATION_FAILED'});
 assert.deepEqual(store.read(identity.task_id),before);
});

test('SDK041-FIX01 current requirement control routes to its actual native purpose; position changes while preparing refuse',{timeout:10000},async()=>{
 const root=mkdtempSync(join(process.env.JUANERAI_NEWARCH_SHORT_ROOT??browserEvidenceRoot,'qc-'));let enter!:()=>void,release!:()=>void,calls=0;const entered=new Promise<void>(r=>enter=r),held=new Promise<void>(r=>release=r);
 const app=createPersonalOpenAnalysisWorkspace({projectRoot:root,analysisModel:'mimo-v2.6-flash',credentials:offlineCredentials,inspect:async()=>assert.fail('no files'),fetch:async()=>{calls++;enter();await held;return offlineResponse(calls);}});
 try{const task=await app.submit({version:'1.0',command_id:randomUUID(),question:'先理清需求',mode:'requirements',confirmed:true,sources:[]}),id=task.identity.task_id;
 await app.discussRequirement(id,{version:'1.0',command_id:randomUUID(),expected_sequence:0,message:'先理清需求'});await entered;
 const command=(command:Record<string,unknown>)=>app.sessionControl(id,{version:'1.0',expected_revision:'1',command});
 const ack=await command({kind:'nextRun',text:'保持当前获准范围'});assert.ok(ack.accepted_input?.id,'the actual native requirement Session must acknowledge its deferred input');
 const withdrawn=await command({kind:'cancelQueued',entryId:ack.accepted_input!.id});assert.deepEqual(withdrawn.withdrawn_input,{id:ack.accepted_input!.id,accepted:true});
 await assert.rejects(()=>command({kind:'fork'}),{code:'TASK_BUSY'});await assert.rejects(()=>command({kind:'navigate',entryId:'known-position',summarize:false}),{code:'TASK_BUSY'});assert.equal(calls,1);
 }finally{release();await app.close();}
});
