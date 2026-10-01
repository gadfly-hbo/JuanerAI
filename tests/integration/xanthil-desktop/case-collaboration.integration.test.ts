import assert from 'node:assert/strict';
import test from 'node:test';
import {randomUUID} from 'node:crypto';
import {readFile,mkdir,cp} from 'node:fs/promises';
import {join} from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import {createCaseAssistantApplication} from '../../../packages/application/case-assistant.ts';
import {createLocalCaseAssistantStore} from '../../../adapters/storage-local/case-assistant.ts';
import {createCaseAssistantHandler} from '../../../apps/desktop/case-assistant-main.ts';
import {withIsolatedProject} from '../../fixtures/xanthil-desktop/desktop-contract-drivers.ts';
import {completedCase} from '../../fixtures/case-assistant/completed-case.ts';
import {config,decision} from '../../fixtures/case-assistant/fixtures.ts';
import type {AssistantProjection} from '../../../packages/contracts/case-assistant.ts';
import type {ChildPreview} from '../../../packages/contracts/case-collaboration.ts';

test('AC-FS-01/02/07/08 Fork creation is local, frozen, idempotent and preserves legacy/source records',async()=>withIsolatedProject(async root=>{
 try{
 const baseline=await completedCase(root),store=createLocalCaseAssistantStore({projectRoot:root});
 let modelCalls=0;
 const app=createCaseAssistantApplication({store,runtime:{async turn(){modelCalls++;return {provider:config.provider,model:config.model,cost_microunits:0,output:{kind:'advice',text:`已保存合成模型回复 ${modelCalls}`}};}},config,clock:()=>new Date('2026-10-01T00:00:00Z')});
 const parent=await app.link(baseline.owner,'合成根会话',randomUUID());
 assert.equal(parent.source.eligible,true,'fixture qualifies before collaboration assertions');
 async function rootTurn(text:string):Promise<AssistantProjection>{
  const authorization=await app.prepare(parent.session.id,text);assert.deepEqual(authorization.blockers,[]);
  await app.start(parent.session.id,authorization.id,true);
  for(let i=0;i<100;i++){const p=await app.read(parent.session.id);if(p.attempts.at(-1)?.status==='Succeeded')return p;await new Promise(resolve=>setTimeout(resolve,5));}
  assert.fail('synthetic root execution must finish before Fork assertions');
 }
 const first=await rootTurn('已保存父问题一'),cutoff=first.events.find(e=>e.kind==='advice')!,selected=first.events.find(e=>e.kind==='user')!;
 assert.ok(cutoff.id);assert.ok(selected.id);
 const savedParent=await rootTurn('分叉点之后的父问题二');
 const later=savedParent.events.filter(e=>e.kind==='user').at(-1)!;
 assert.equal(modelCalls,2);
 const original=await readFile(join(root,'.xanthil/desktop/state.sqlite'));
 const path=join(root,'.xanthil/desktop/case-assistant.sqlite');
 function legacy(){const db=new DatabaseSync(path,{readOnly:true});try{return {version:db.prepare('PRAGMA user_version').get()?.user_version,rows:db.prepare('SELECT * FROM sessions').all()};}finally{db.close();}}
 const before=legacy();assert.equal(before.version,100);
 await app.read(parent.session.id);assert.deepEqual(legacy(),before,'reading alone never migrates');
 let opened:string|null=null;
 const handler=createCaseAssistantHandler({async openChildWindow(id:string){opened=id;return {opened:true,session_id:id};},senderPolicy:s=>s==='root',getApplication:()=>app,exportReport:async()=>{assert.fail('no export');}});
 async function request(input:unknown){const r=await handler('root',input);assert.ok(r.ok,JSON.stringify(r));return r.value as Record<string,any>;}
 const prepare={version:'1.1',operation:'prepare_child',session_id:parent.session.id,kind:'fork',task:'检查依据不足的边界',cutoff_id:cutoff.id,history_ids:[selected.id],report_ids:[],include_aggregate:false};
 const sidecarBefore=await readFile(path);
 for(const invalid of [{...prepare,cutoff_id:null},{...prepare,cutoff_id:randomUUID()},{...prepare,history_ids:[later.id]}]){
  const refusal=await handler('root',invalid);assert.equal(refusal.ok,false,'invalid cutoff/selection refuses');
  assert.deepEqual(await readFile(path),sidecarBefore,'refusal writes no child, attempt or migration');assert.equal(modelCalls,2);
 }
 const preview=await request(prepare);
 assert.deepEqual(legacy(),before,'preview creates no durable state');
 for(const invalid of [{...preview,cutoff_id:null},{...preview,cutoff_id:randomUUID()},{...preview,selected_history:[later]}]){
  await assert.rejects(()=>store.createChild(randomUUID(),{...parent.session,id:randomUUID()},invalid as ChildPreview,new AbortController().signal),/CUTOFF|SELECTION/);
  assert.deepEqual(await readFile(path),sidecarBefore,'Store refuses forged inheritance without migration');
 }
 const command={version:'1.1',operation:'create_child',session_id:parent.session.id,preview_id:preview.id,command_id:randomUUID(),confirmed:true};
 const originalPrepare=DatabaseSync.prototype.prepare;let migrationFaults=0;
 DatabaseSync.prototype.prepare=function(sql:string){if(sql.startsWith('INSERT INTO collaboration_children')){migrationFaults++;throw Error('synthetic first child disk failure');}return originalPrepare.call(this,sql);};
 try{const failed=await handler('root',command);assert.equal(failed.ok,false);}finally{DatabaseSync.prototype.prepare=originalPrepare;}
 assert.equal(migrationFaults,1);assert.deepEqual(legacy(),before,'failed first migration restores exact legacy schema/version/rows');assert.deepEqual(await readFile(path),sidecarBefore,'failed migration preserves all legacy bytes');
 const child=await request(command);
 assert.equal(child.relation.kind,'fork');assert.equal(child.relation.parent_session_id,parent.session.id);
 assert.equal(child.relation.cutoff_id,cutoff.id);assert.deepEqual(child.relation.selected_history,[selected]);assert.deepEqual(child.relation.selected_reports,[]);
 assert.equal(child.relation.aggregate,null);assert.deepEqual(child.attempts,[]);
 assert.deepEqual(await request(command),child,'duplicate command retains committed identity');
 const window=await request({version:'1.1',operation:'open_child_window',session_id:child.session.id});assert.equal(window.opened,true);assert.equal(opened,child.session.id,'committed child identity reaches native boundary');
 const badWindow=await handler('root',{version:'1.1',operation:'open_child_window',session_id:parent.session.id});assert.equal(badWindow.ok,false,'root cannot masquerade as child');
 assert.equal(legacy().version,101);assert.deepEqual(legacy().rows[0],before.rows[0]);
 assert.deepEqual((await app.list(baseline.owner.project_id)).map(s=>s.id),[parent.session.id],'legacy list only contains roots');
 const recursive=await handler('root',{version:'1.1',operation:'prepare_child',session_id:child.session.id,kind:'fork',task:'forbidden descendant',cutoff_id:cutoff.id,history_ids:[],report_ids:[],include_aggregate:false});
 assert.equal(recursive.ok,false);
 assert.deepEqual(await store.formalHistory(baseline.owner),{decisions:[],reports:[]});
 assert.deepEqual(await readFile(join(root,'.xanthil/desktop/state.sqlite')),original);
 assert.deepEqual((await app.read(parent.session.id)).events,savedParent.events);assert.equal(modelCalls,2,'creation never calls model');
 const empty=await request({...prepare,history_ids:[]});
 const emptyChild=await request({...command,preview_id:empty.id,command_id:randomUUID()});
 assert.deepEqual(emptyChild.relation.selected_history,[],'valid saved Fork point does not force inheritance');
 assert.equal(emptyChild.relation.cutoff_id,cutoff.id);assert.equal(modelCalls,2);
 }finally{const evidence=process.env.JUANERAI_TEST_EVIDENCE_DIR;if(evidence){await mkdir(evidence,{recursive:true});await cp(root,join(evidence,'collaboration-project'),{recursive:true,errorOnExist:true,force:false});}}
}));

test('AC-FS-02/03/04 Fork independent question/result uses exact grant and atomically saves a complete insufficient-evidence result',async()=>withIsolatedProject(async root=>{
 try{
 const baseline=await completedCase(root),store=createLocalCaseAssistantStore({projectRoot:root});
 const payloads:string[]=[];let phase:'root'|'question'|'result'|'advice'|'draft'|'badref'|'tool'='root';
 const app=createCaseAssistantApplication({store,config,clock:()=>new Date(),runtime:{async turn(input){
  payloads.push(input.payload);if(phase==='root')return {provider:config.provider,model:config.model,cost_microunits:0,output:{kind:'advice',text:'父讨论中不能隐式外发的文本'}};
  if(phase==='question'){phase='result';return {provider:config.provider,model:config.model,cost_microunits:0,output:{kind:'question',text:'是否仅检查证据边界？'}};}
  if(phase==='advice')return {provider:config.provider,model:config.model,cost_microunits:0,output:{kind:'advice',text:'不是问题，也不是完整子结果'}};
  if(phase==='draft')return {provider:config.provider,model:config.model,cost_microunits:0,output:{kind:'draft',fields:{...decision,choice:'no_action',candidate_id:null,evidence_refs:(await store.readSource(baseline.owner)).evidence_refs,finding_refs:[(await store.readSource(baseline.owner)).finding_id]}}};
  if(phase==='tool')return {provider:config.provider,model:config.model,cost_microunits:0,output:{kind:'tool',tool:'read_aggregate',revision_id:baseline.owner.revision_id}};
  const refs=JSON.parse(input.payload).authorized_context.allowed_references;
  if(phase==='badref')return {provider:config.provider,model:config.model,cost_microunits:0,output:{kind:'result',summary:'错误引用',references:[{...refs[0],id:randomUUID()}],limitations:['限制'],unknowns:[]}};
  return {provider:config.provider,model:config.model,cost_microunits:0,output:{kind:'result',summary:'依据不足，无法推断因果。',references:[refs[0]],limitations:['未授权聚合与报告。'],unknowns:['尚缺独立因果证据。']}};
 }}});
 async function terminal(id:string,status:string){for(let i=0;i<200;i++){const p=await app.read(id);if(p.attempts.at(-1)?.status===status)return p;if(p.attempts.at(-1)&&!['Running','Waiting'].includes(p.attempts.at(-1)!.status))assert.equal(p.attempts.at(-1)!.status,status);await new Promise(r=>setTimeout(r,5));}assert.fail('expected '+status);}
 const parent=await app.link(baseline.owner,'Fork 独立授权来源',randomUUID()),a=await app.prepare(parent.session.id,'父问题');await app.start(parent.session.id,a.id,true);
 const parentSaved=await terminal(parent.session.id,'Succeeded'),cut=parentSaved.events.find(e=>e.kind==='advice')!;
 const preview=await app.prepareChild(parent.session.id,'fork','检查边界',cut.id,[],[],false),child=await app.createChild(parent.session.id,preview.id,randomUUID(),true);
 const handler=createCaseAssistantHandler({senderPolicy:()=>true,getApplication:()=>app,exportReport:async()=>assert.fail('no formal export')});
 async function request(input:unknown){const r=await handler(null,input);assert.ok(r.ok,JSON.stringify(r));return r.value as Record<string,any>;}
 phase='question';const grant=await request({version:'1.1',operation:'prepare',session_id:child.session.id,text:'只检查所授权范围',history_ids:[],result_ids:[]});
 assert.deepEqual(grant.blockers,[]);assert.doesNotMatch(grant.payload,/父讨论中不能隐式外发的文本/);
 assert.equal(JSON.parse(grant.payload).aggregate,null);assert.deepEqual(JSON.parse(grant.payload).selected_reports,[]);
 await request({version:'1.1',operation:'start',session_id:child.session.id,authorization_id:grant.id,free_text_confirmed:true});
 await terminal(child.session.id,'Waiting');await request({version:'1.1',operation:'send',session_id:child.session.id,text:'是，仅检查边界'});
 await terminal(child.session.id,'Succeeded');const saved=await request({version:'1.1',operation:'read_collaboration',session_id:child.session.id});
 assert.equal(saved.results.length,1);assert.equal(saved.results[0].version,1);assert.equal(saved.results[0].value.summary,'依据不足，无法推断因果。');
 assert.equal(saved.results[0].attempt_id,saved.attempts.at(-1).id);assert.equal(saved.results[0].authorization_id,grant.id);
 assert.equal(payloads.length,3);assert.match(payloads[2],/是，仅检查边界/);assert.doesNotMatch(payloads[2],/父讨论中不能隐式外发的文本/);
 assert.deepEqual(await store.formalHistory(baseline.owner),{decisions:[],reports:[]});
 const again=await request({version:'1.1',operation:'prepare',session_id:child.session.id,text:'新问题',history_ids:[],result_ids:[]});
 assert.deepEqual(JSON.parse(again.payload).selected_results,[],'new Attempt never implicitly restores previous result');
 for(const invalid of ['advice','draft','tool','badref'] as const){
  phase=invalid;
  const authorization=await request({version:'1.1',operation:'prepare',session_id:child.session.id,text:'新的明确测试',history_ids:[],result_ids:[]});
  await request({version:'1.1',operation:'start',session_id:child.session.id,authorization_id:authorization.id,free_text_confirmed:true});
  const failed=await terminal(child.session.id,'Failed');assert.deepEqual(failed.drafts,[],'child never creates formal draft');
  const after=await app.readCollaboration(child.session.id);assert.equal(after.results.length,1,'invalid output never creates another complete result');
  assert.equal(after.events.filter(e=>e.attempt_id===failed.attempts.at(-1)!.id&&e.kind==='question').length,0,'advice never fabricates Waiting/question');
 }
 const result=saved.results[0],target={result_id:result.id,result_version:result.version,result_sha256:result.sha256};
 const returning={version:'1.1',operation:'return_result',session_id:child.session.id,...target,command_id:randomUUID()};
 const delivered=await Promise.all([request(returning),request(returning)]);assert.deepEqual(delivered[0],delivered[1]);
 const pending=await request({version:'1.1',operation:'read_parent',session_id:parent.session.id});assert.equal(pending.deliveries.filter((d:any)=>d.status==='returned').length,1);assert.equal(pending.materials.length,0);
 const review={version:'1.1',operation:'review_result',session_id:parent.session.id,...target,command_id:randomUUID(),disposition:'adopted',reason:'仅供后续明确选择',confirmed:true};
 const cancelled=await handler(null,{...review,confirmed:false});assert.equal(cancelled.ok,false);
 assert.equal((await request({version:'1.1',operation:'read_parent',session_id:parent.session.id})).materials.length,0);
 const adopted=await Promise.all([request(review),request(review)]);assert.deepEqual(adopted[0],adopted[1]);
 const reviewed=await request({version:'1.1',operation:'read_parent',session_id:parent.session.id});assert.equal(reviewed.materials.length,1);assert.equal(reviewed.materials[0].classification,'MODEL');assert.equal(reviewed.materials[0].result.id,result.id);assert.equal(reviewed.reviews.length,1);
 assert.equal((await handler(null,{...review,command_id:randomUUID(),disposition:'declined'})).ok,false,'terminal review cannot change disposition');
 assert.deepEqual(await store.formalHistory(baseline.owner),{decisions:[],reports:[]});assert.equal((await app.read(parent.session.id)).attempts.length,1,'return/review never starts parent');
 const parentPreparation={version:'1.1',operation:'prepare_parent',session_id:parent.session.id,text:'明确选择材料继续父工作',history_ids:[],report_ids:[],material_ids:[],rebase:false};
 const without=await request(parentPreparation);assert.deepEqual(JSON.parse(without.payload).selected_materials,[]);assert.doesNotMatch(without.payload,/依据不足，无法推断因果。/);
 const withMaterial=await request({...parentPreparation,material_ids:[reviewed.materials[0].id]});assert.match(withMaterial.payload,/依据不足，无法推断因果。/);assert.match(withMaterial.payload,/MODEL/);
 assert.equal((await handler(null,{...parentPreparation,material_ids:[randomUUID()]})).ok,false,'unadopted/foreign material refuses');
 phase='root';await app.start(parent.session.id,withMaterial.id,true);await terminal(parent.session.id,'Succeeded');assert.match(payloads.at(-1)!,/依据不足，无法推断因果。/);assert.equal((await app.read(parent.session.id)).drafts.length,0);
 await app.close();
 }finally{const evidence=process.env.JUANERAI_TEST_EVIDENCE_DIR;if(evidence){await mkdir(evidence,{recursive:true});await cp(root,join(evidence,'collaboration-runtime-project'),{recursive:true,errorOnExist:true,force:false});}}
}));

test('F3 AC-FS-01/03 final real Store creation refuses every shared occupant without migration or receipt',async()=>withIsolatedProject(async root=>{
 const {createLocalModelAccess}=await import('../../../packages/application/provider-settings.ts');const access=createLocalModelAccess(true),baseline=await completedCase(root),store=createLocalCaseAssistantStore({projectRoot:root});let entered!:()=>void,release!:()=>void,calls=0;
 const gated={...store,async createChild(...args:Parameters<typeof store.createChild>){entered();await new Promise<void>(r=>release=r);return store.createChild(...args);}};
 const app=createCaseAssistantApplication({store:gated,modelAccess:access,config,clock:()=>new Date(),runtime:{async turn(){calls++;return {provider:config.provider,model:config.model,cost_microunits:0,output:{kind:'advice',text:'saved parent'}};}}});
 try{const p=await app.link(baseline.owner,'竞争父',randomUUID());const path=join(root,'.xanthil','desktop','case-assistant.sqlite');
 for(const label of ['settings-test','organize_question','explain_evidence','draft_candidates','parent-pending','child-Running','child-Waiting']){
  const preview=await app.prepareChild(p.session.id,'subagent','共享占用检查',null,[],[],false),before=await readFile(path),atStore=new Promise<void>(r=>entered=r),command=randomUUID();const pending=app.createChild(p.session.id,preview.id,command,true);await atStore;const lease=await access.acquire(0,{session_id:p.session.id,label});release();
  try{await assert.rejects(pending,/MODEL_BUSY|BUSY/);assert.deepEqual(await readFile(path),before,'no migration/receipt/child bytes');assert.equal((await store.readParentCollaboration(p.session.id)).children.length,0);assert.equal(calls,0);}finally{lease.release();}
 }
 const preview=await app.prepareChild(p.session.id,'subagent','新操作',null,[],[],false);const atStore=new Promise<void>(r=>entered=r),pending=app.createChild(p.session.id,preview.id,randomUUID(),true);await atStore;release();assert.ok((await pending).session.id);assert.equal(calls,0);
 }finally{await app.close();if(process.env.JUANERAI_TEST_EVIDENCE_DIR)await cp(root,join(process.env.JUANERAI_TEST_EVIDENCE_DIR,'f3-race-project'),{recursive:true});}
}));

test('F4 AC-FS-02/04/06 actual manual candidate comparison and same-candidate refutation bind selected provenance',async()=>withIsolatedProject(async root=>{
 const baseline=await completedCase(root,true),store=createLocalCaseAssistantStore({projectRoot:root});const calls:any[]=[];let resultMode=false;
 const {createPiCaseAssistantRuntime}=await import('../../../adapters/agent-pi/case-assistant.ts');const runtime=createPiCaseAssistantRuntime({provider:config.provider,model:config.model,max_input_bytes:200000,max_output_tokens:4096},{async respond(payload){const input=JSON.parse(payload);calls.push(input);const c=input.authorized_context;return resultMode?{kind:'result',summary:c.task,references:c.allowed_references.filter((r:any)=>['candidate','aggregate','report','history'].includes(r.kind)),limitations:['合成结果不是因果事实'],unknowns:['未来成效未知']}:{kind:'advice',text:'已保存的合成父讨论'};}});
 const app=createCaseAssistantApplication({store,runtime,config,clock:()=>new Date()});const wait=async(id:string)=>{for(let i=0;i<200;i++){const p=await app.read(id);if(p.attempts.at(-1)?.status==='Succeeded')return p;await new Promise(r=>setTimeout(r,5));}assert.fail('expected successful actual Pi turn');};
 try{const p=await app.link(baseline.owner,'有候选的父讨论',randomUUID());for(const text of ['选择继承的父问题','不继承的后续问题']){const a=await app.prepare(p.session.id,text);await app.start(p.session.id,a.id,true);await wait(p.session.id);}const parent=await app.read(p.session.id),history=parent.events.find(e=>e.kind==='user')!,cutoff=parent.events.find(e=>e.kind==='advice')!,candidate=parent.source.candidates[0];assert.equal(parent.source.candidates.length,2);
 const before=await readFile(join(root,'.xanthil/desktop/state.sqlite')),formal=await store.formalHistory(baseline.owner);resultMode=true;
 for(const kind of ['fork','subagent'] as const){const task=kind==='fork'?`比较候选 ${candidate.candidate_id} 与 no_action / defer`:`反驳同一候选 ${candidate.candidate_id}`;
 const pv=await app.prepareChild(p.session.id,kind,task,kind==='fork'?cutoff.id:null,[history.id],[parent.source.report.report_id],true),child=await app.createChild(p.session.id,pv.id,randomUUID(),true),a=await app.prepareCollaboration(child.session.id,task,[],[]),payload=JSON.parse(a.payload);
 assert.deepEqual(payload.inherited_history,[history]);assert.deepEqual(payload.selected_history,[]);assert.deepEqual(payload.selected_results,[]);assert.deepEqual(payload.aggregate,parent.source.aggregate);assert.deepEqual(payload.business_projection.candidates,parent.source.candidates);assert.equal(payload.selected_reports.length,1);assert.equal(payload.selected_reports[0].id,parent.source.report.report_id);assert.ok(!a.payload.includes('不继承的后续问题'));
 const ref=payload.allowed_references.find((r:any)=>r.kind==='report');assert.deepEqual(ref,{kind:'report',id:parent.source.report.report_id,version:parent.source.report.version,sha256:parent.source.report.sha256,revision_id:baseline.owner.revision_id});assert.equal(payload.allowed_references.find((r:any)=>r.kind==='aggregate').sha256,parent.source.aggregate.sha256);
 await app.start(child.session.id,a.id,true);await wait(child.session.id);const r=(await store.childResults(child.session.id))[0],target={result_id:r.id,result_version:r.version,result_sha256:r.sha256};assert.deepEqual(calls.at(-1).authorized_context,payload);assert.ok(r.value.references.some(v=>v.kind==='candidate'&&v.id===candidate.candidate_id));
 if(kind==='fork'){assert.equal((await app.readParent(p.session.id)).deliveries.find(d=>d.result_id===r.id)?.status,'unreturned');await app.returnResult(child.session.id,target,randomUUID());}else{for(let i=0;i<100&&(await app.readParent(p.session.id)).deliveries.find(d=>d.result_id===r.id)?.status!=='returned';i++)await new Promise(r=>setTimeout(r,5));assert.equal((await app.readParent(p.session.id)).deliveries.find(d=>d.result_id===r.id)?.status,'returned');}
 await app.reviewResult(p.session.id,target,randomUUID(),'adopted','人工核对合成意见',true);const material=(await app.readParent(p.session.id)).materials.find(m=>m.result.id===r.id)!;
 const unselected=await app.prepareParent(p.session.id,'继续',[],[],[],false),selected=await app.prepareParent(p.session.id,'使用明确选择的 MODEL 材料',[],[],[material.id],false);assert.deepEqual(JSON.parse(unselected.payload).selected_materials,[]);assert.equal(JSON.parse(selected.payload).selected_materials.length,1);assert.equal(JSON.parse(selected.payload).selected_materials[0].result.id,r.id);
 const again=await app.prepareCollaboration(child.session.id,'新 Attempt 默认不继承自身历史',[],[]);assert.deepEqual(JSON.parse(again.payload).selected_history,[]);assert.deepEqual(JSON.parse(again.payload).selected_results,[]);
 }
 assert.deepEqual(await readFile(join(root,'.xanthil/desktop/state.sqlite')),before);assert.deepEqual(await store.formalHistory(baseline.owner),formal);assert.equal(calls.length,4);await cp(root,join(process.env.JUANERAI_TEST_EVIDENCE_DIR!,'f4-candidate-project'),{recursive:true});
 }finally{await app.close();}
}));
