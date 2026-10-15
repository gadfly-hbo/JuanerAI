import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {mkdtempSync} from 'node:fs';
import {join} from 'node:path';
import {browserEvidenceRoot} from '../../fixtures/xanthil-desktop/browser-evidence.ts';
import {createLocalOpenAnalysisStore} from '../../../adapters/storage-local/open-analysis.ts';
import {compileOpenAnalysisIR,executeOpenAnalysisIR} from '../../../packages/product-core/open-analysis-ir.ts';
import {verifyOpenAnalysisIntegerSum} from '../../../adapters/analytics-duckdb/open-analysis-verification.ts';
import {taskHash} from '../../../packages/product-core/member-task.ts';
import {createLocalCaseAssistantStore} from '../../../adapters/storage-local/case-assistant.ts';
import {createOpenAnalysisCollaborationSource} from '../../../adapters/storage-local/open-analysis-collaboration.ts';
import {createCaseAssistantApplication} from '../../../packages/application/case-assistant.ts';
import type {MemberSourceInspection} from '../../../packages/ports/member-source.ts';
import type {CaseAssistantRuntime} from '../../../packages/ports/case-assistant.ts';

async function fixture(v13=true,runtime:CaseAssistantRuntime|null=null,question="数量合计",qualified=false,keepRunning=false){
 const root=mkdtempSync(join(browserEvidenceRoot,'autonomous-collaboration-'));
 const source:MemberSourceInspection={version:'1.0',sources:[{source_id:randomUUID(),display_name:'synthetic.csv',format:'csv',sha256:'a'.repeat(64),byte_length:'8',sheets:[{sheet_id:'csv',name:'CSV',state:'visible',rows:[{row:1,cells:[{column:'A',type:'string',value:'数量'},...(qualified?[{column:'B',type:'string' as const,value:'PRIVATE_UNSELECTED_HEADER'}]:[])]},{row:2,cells:[{column:'A',type:'string',value:'7'},...(qualified?[{column:'B',type:'string' as const,value:'PRIVATE_RAW_ROW'}]:[])]}]}]}]};
 const identity={task_id:randomUUID(),revision:'1',run_id:randomUUID(),attempt_id:randomUUID(),operation_id:randomUUID(),grant_id:randomUUID(),scope_sha256:taskHash(source),config_sha256:'b'.repeat(64)};
 const analysis=createLocalOpenAnalysisStore({projectRoot:root});analysis.create({identity,source,question});
 const lease=analysis.begin(identity.task_id),plan=compileOpenAnalysisIR({version:'1.0',source_id:source.sources[0]!.source_id,sheet_id:'csv',goal:question,operation:'sum',column:'A',unit:'个'},source);
 const calculation=executeOpenAnalysisIR(plan,source),verification=verifyOpenAnalysisIntegerSum(plan,calculation,source),outcome_id=randomUUID();
 analysis.saveFramework(lease,{version:'1.0',identity,origin:'MODEL_PROPOSAL',plan});
 const steps:string[]=[];
 if(qualified){for(const operation of ['sum','count','max'] as const){const bound=compileOpenAnalysisIR({version:'1.1',source_id:source.sources[0]!.source_id,sheet_id:'csv',goal:question,operation,column:'A',group_by:null,filters:[],unit:operation==='count'?'记录':'个'},source),framework={version:'1.0' as const,identity,origin:'MODEL_PROPOSAL' as const,plan:bound};const calculation=executeOpenAnalysisIR(bound,source),verification=verifyOpenAnalysisIntegerSum(bound,calculation,source),step_id=randomUUID();analysis.saveFramework(lease,framework);analysis.saveVerifiedStep(lease,{version:'1.0',step_id,identity,framework,calculation,verification});steps.push(step_id);}analysis.saveFramework(lease,{version:'1.0',identity,origin:'MODEL_PROPOSAL',plan});}
 if(!keepRunning)analysis.saveOutcome(lease,{version:'1.0',outcome_id,identity,framework:plan,calculation,verification,explanation:{kind:'MODEL_EXPLANATION',text:'合计7个'},human_judgment:'not_recorded'});
 const bridge=createOpenAnalysisCollaborationSource({project_id:randomUUID(),store:analysis,allowQualifiedSteps:qualified});
 const policy=v13?{collaborationPolicy:'open_analysis_v13' as const}:{};
 const options={projectRoot:root,openSource:bridge.read,...policy},store=createLocalCaseAssistantStore(options);
 const config=runtime?{provider:'minimax-cn',model:'MiniMax-M3',authorized:true,consumption_policy:'uncapped_metered' as const,runtime_id:'pi',runtime_version:'0.86.1',adapter_version:'1.3',limits:{turns:1,execution_ms:30000,waiting_ms:60000,cost_microunits:1,turn_cost_microunits:1,currency:'USD'}}:null;
 const appOptions={store,runtime,config,clock:()=>new Date(),...policy,...v13?{openTaskIdentity:()=>identity}:{}};
 const app=createCaseAssistantApplication(appOptions);
 const parent=await app.link(keepRunning?bridge.stepOwner(identity.task_id,steps[0]!):bridge.owner(identity.task_id),'汇总核对',randomUUID());
 async function child(parent_id:string,task:string,aggregate=false,reports:readonly string[]=[]){const preview=await app.prepareChild(parent_id,'subagent',task,null,[],reports,aggregate);return app.createChild(parent_id,preview.id,randomUUID(),true);}
 return {root,analysis,bridge,app,store,options,parent,outcome_id,child,identity,steps,lease};
}

test('V13-STOP140 / AU10/AS07: stopped work cannot restart by renaming or bundling, while independent work remains available',async()=>{
 const {createOpenAnalysisDelegation}=await import('../../../packages/application/open-analysis-delegation.ts');
 const f=await fixture(true,null,'停止范围合成测试',true,true);
 try{
  const delegation=createOpenAnalysisDelegation({store:f.analysis,assistant:f.app,source:f.bridge,project_id:f.parent.source.owner.project_id});
  const instruction={action:'inspect_sources' as const,reference_paths:['/verification'],completion_reference_paths:['/verification']};
  const work={kind:'subagent' as const,task:'检查第一份依据',material_id:f.steps[0]!,instruction};
  const a=await delegation.root.queue(f.identity,work);
  const nested=await delegation.child(a.child_id).queue(f.identity,{...work,instruction:{...instruction,action:'check_limitations'}});
  await f.app.closeSession(a.child_id,true);
  assert.equal((await f.app.lifecycle(nested.child_id)).open,false);
  const b=await delegation.root.queue(f.identity,{...work,task:'独立检查第二份依据',material_id:f.steps[1]!});
  assert.equal(b.state,'queued');assert.equal((await f.app.lifecycle(b.child_id)).open,true);
  await assert.rejects(()=>delegation.root.queue(f.identity,{...work,task:'重命名',business_question:'换句话检查同一来源'}),{code:'DELEGATION_STOPPED'});
  await assert.rejects(()=>delegation.root.queue(f.identity,{...work,instruction:{...instruction,reference_paths:['/verification','/calculation'],completion_reference_paths:['/verification','/calculation']}}),{code:'DELEGATION_STOPPED'});
  await assert.rejects(()=>delegation.root.queue(f.identity,{...work,instruction:{...instruction,reference_paths:['/verification/value'],completion_reference_paths:['/verification/value']}}),{code:'DELEGATION_STOPPED'});
  await assert.rejects(()=>delegation.root.queue(f.identity,{...work,instruction:{...instruction,completion_reference_paths:['/verification/value']}}),{code:'DELEGATION_STOPPED'});
  await assert.rejects(()=>delegation.root.queue(f.identity,{...work,additional_materials:[{material_id:f.steps[1]!,instruction}]}),{code:'DELEGATION_STOPPED'});
  await assert.rejects(()=>delegation.root.queue(f.identity,{...work,material_id:f.steps[1]!,additional_materials:[{material_id:f.steps[0]!,instruction:{...instruction,reference_paths:['/verification/value'],completion_reference_paths:['/verification/value']}}]}),{code:'DELEGATION_STOPPED'});
  await assert.rejects(()=>delegation.child(a.child_id).queue(f.identity,{...work,instruction:{...instruction,action:'challenge'}}));
  const independent=await delegation.root.queue(f.identity,{...work,instruction:{...instruction,action:'explain'}});assert.equal(independent.state,'queued');
  const separate=await delegation.root.queue(f.identity,{...work,instruction:{...instruction,reference_paths:['/calculation'],completion_reference_paths:['/calculation']}});assert.equal(separate.state,'queued');
  const leafWork={...work,material_id:f.steps[2]!,instruction:{...instruction,reference_paths:['/verification/value'],completion_reference_paths:['/verification/value']}};
  const leaf=await delegation.root.queue(f.identity,leafWork);await f.app.closeSession(leaf.child_id,true);
  await assert.rejects(()=>delegation.root.queue(f.identity,{...leafWork,instruction}),{code:'DELEGATION_STOPPED'});
  const reopened=createLocalCaseAssistantStore(f.options);assert.equal((await reopened.readLifecycle(a.child_id)).open,false);assert.equal((await reopened.readLifecycle(nested.child_id)).open,false);
  const parent=(await f.app.readCollaboration(a.child_id)).relation.parent_session_id;
  await f.app.closeSession(parent,true);await assert.rejects(()=>delegation.root.queue(f.identity,{...work,task:'同一来源父会话已关闭'}),{code:'PARENT_CLOSED'});
  const epoch=(await f.app.lifecycle(parent)).epoch;await f.app.reopenSession(parent,epoch);
  await assert.rejects(()=>delegation.root.queue(f.identity,{...work,task:'父会话恢复不能重放旧子任务'}),{code:'SESSION_CLOSED'});
  const resumed=await delegation.root.queue(f.identity,{...work,task:'明确恢复父会话后做新工作',instruction:{...instruction,action:'challenge'}});assert.equal(resumed.state,'queued');assert.notEqual(resumed.child_id,a.child_id);
  assert.equal((await f.app.lifecycle(a.child_id)).open,false);assert.equal((await f.app.lifecycle(nested.child_id)).open,false);
  f.analysis.stop(f.identity.task_id);await assert.rejects(()=>delegation.root.queue(f.identity,{...work,material_id:f.steps[2]!}),{code:'AUTHORITY_REQUIRED'});
 }finally{await f.app.close();}
});

test('V13-COL01 / AS04: qualified open analysis supports legal nested delegation and survives disk readback',async()=>{
 const f=await fixture();
 try{
  const child=await f.child(f.parent.session.id,'核对汇总来源',true,[f.outcome_id]);
  const grandchild=await f.child(child.session.id,'检查汇总限制',true,[f.outcome_id]);
  assert.equal(grandchild.relation.parent_session_id,child.session.id);
  assert.deepEqual(grandchild.relation.aggregate,child.relation.aggregate);
  assert.deepEqual(grandchild.relation.selected_reports,child.relation.selected_reports);
  const reopened=createLocalCaseAssistantStore(f.options);
  assert.equal((await reopened.readParentCollaboration(child.session.id)).children[0]?.child_session_id,grandchild.session.id);
  assert.equal((await reopened.readChild(grandchild.session.id))?.parent_session_id,child.session.id);
 }finally{await f.app.close();}
});

test('V13-COL01 / AC01: descendant cannot reacquire an aggregate or report excluded from its parent, including forged Store input',async()=>{
 const f=await fixture();
 try{
  const child=await f.child(f.parent.session.id,'只检查任务说明');
  await assert.rejects(()=>f.child(child.session.id,'重新读取完整汇总',true),{code:'FORBIDDEN'});
  await assert.rejects(()=>f.child(child.session.id,'重新读取未选报告',false,[f.outcome_id]),{code:'FORBIDDEN'});
  const preview={...child.relation,id:randomUUID(),parent_session_id:child.session.id,task:'伪造全量权限',aggregate:child.relation.source.aggregate,parent_epoch:0};
  await assert.rejects(()=>f.store.createChild(randomUUID(),{id:randomUUID(),title:preview.task,source:preview.source.owner,created_at:new Date().toISOString(),archived:false},preview,new AbortController().signal),{code:'FORBIDDEN'});
 }finally{await f.app.close();}
});

test('V13-COL01: enabling v1.3 is explicit; legacy open collaboration still rejects recursive delegation',async()=>{
 const f=await fixture(false);
 try{const child=await f.child(f.parent.session.id,'旧协作');await assert.rejects(()=>f.child(child.session.id,'旧入口递归'),{code:'FORBIDDEN'});}
 finally{await f.app.close();}
});

test('V13-COL02 / AC06: branch and root closure durably stop all descendants; reopening does not reopen descendants',async()=>{
 const f=await fixture();
 try{
  const first=await f.child(f.parent.session.id,'检查来源'),second=await f.child(f.parent.session.id,'检查限制');
  const grandchild=await f.child(first.session.id,'重新核对选定报告');
  const great=await f.child(grandchild.session.id,'整理检查限制');
  const closed=await f.store.closeFamily(first.session.id,new Date().toISOString(),true);
  assert.deepEqual(new Set(closed),new Set([first.session.id,grandchild.session.id,great.session.id]));
  assert.equal((await f.store.readLifecycle(second.session.id)).open,true,'sibling remains available');
  const reopened=createLocalCaseAssistantStore(f.options);
  for(const id of closed)assert.equal((await reopened.readLifecycle(id)).open,false);
  const epoch=(await reopened.readLifecycle(first.session.id)).epoch;await reopened.reopenSession(first.session.id,epoch);
  assert.equal((await reopened.readLifecycle(grandchild.session.id)).open,false,'parent reopening is not descendant execution authority');
  await reopened.closeFamily(f.parent.session.id,new Date().toISOString(),true);
  assert.equal((await reopened.readLifecycle(second.session.id)).open,false);
 }finally{await f.app.close();}
});

test('V13-COL02 / AC06: root close reaches the actual grandchild runtime cancellation signal and rejects its late result',async()=>{
 let entered=false,aborted=false;let complete:(value:Awaited<ReturnType<CaseAssistantRuntime['turn']>>)=>void=()=>assert.fail('runtime not entered');
 const f=await fixture(true,{turn:async input=>{input.signal.addEventListener('abort',()=>{aborted=true;},{once:true});return new Promise(resolve=>{complete=resolve;entered=true;});}});
 try{
  const child=await f.child(f.parent.session.id,'核对资料'),grandchild=await f.child(child.session.id,'检查资料限制');
  const grant=await f.app.prepareCollaboration(grandchild.session.id,'核对获准说明',[],[]);assert.deepEqual(grant.blockers,[]);
  await f.app.start(grandchild.session.id,grant.id,true);
  const deadline=Date.now()+2000;while(!entered&&Date.now()<deadline)await new Promise(r=>setTimeout(r,5));assert.equal(entered,true);
  await f.app.closeSession(f.parent.session.id,true);
  assert.equal(aborted,true,'actual in-flight descendant must receive cancellation, not only a saved Interrupted label');
  complete({provider:'minimax-cn',model:'MiniMax-M3',cost_microunits:null,output:{kind:'result',summary:'迟到观点',references:[],limitations:[],unknowns:[]}});
  const settled=Date.now()+2000;while(f.app.hasWork()&&Date.now()<settled)await new Promise(r=>setTimeout(r,5));
  assert.equal((await f.store.childResults(grandchild.session.id)).length,0);
  assert.equal((await f.app.read(grandchild.session.id)).attempts.at(-1)?.status,'Interrupted');
 }finally{if(entered)complete({provider:'minimax-cn',model:'MiniMax-M3',cost_microunits:null,output:{kind:'advice',text:'迟到'}});await f.app.close();}
});

test('V13-COL01/02 / AC05/06: equivalent ancestor work cannot recurse; a stopped ancestor prevents descendant reopening',async()=>{
 const f=await fixture();
 try{
  const child=await f.child(f.parent.session.id,'核对 汇总'),grandchild=await f.child(child.session.id,'核对限制');
  await assert.rejects(()=>f.child(grandchild.session.id,'  核对   汇总  '),{code:'REPEATED_DELEGATION'});
  await f.store.closeFamily(f.parent.session.id,new Date().toISOString(),true);
  const reopened=createLocalCaseAssistantStore(f.options),epoch=(await reopened.readLifecycle(child.session.id)).epoch;
  await assert.rejects(()=>reopened.reopenSession(child.session.id,epoch),{code:'PARENT_CLOSED'});
  assert.equal((await reopened.readLifecycle(child.session.id)).open,false);
 }finally{await f.app.close();}
});

test('V13-METER01 / AC05: child and grandchild Runtime calls carry the original analysis Task and distinct business conversations',async()=>{
 const observed:Array<{task_id:string;conversation_id:string|undefined;config_sha256:string}>=[];
 const f=await fixture(true,{turn:async input=>{
  assert.ok(input.open_analysis);observed.push({task_id:input.open_analysis.identity.task_id,conversation_id:Reflect.get(input.open_analysis,'conversation_id'),config_sha256:input.open_analysis.identity.config_sha256});
  return {provider:'minimax-cn',model:'MiniMax-M3',cost_microunits:null,output:{kind:'result',summary:'获准子集的说明',references:JSON.parse(input.payload).authorized_context.allowed_references.slice(0,1),limitations:['不是独立核验'],unknowns:[]}};
 }});
 try{
  const child=await f.child(f.parent.session.id,'检查来源'),grandchild=await f.child(child.session.id,'检查限制');
  for(const id of [child.session.id,grandchild.session.id]){
   const grant=await f.app.prepareCollaboration(id,'核对授权材料',[],[]);assert.deepEqual(grant.blockers,[]);await f.app.start(id,grant.id,true);
   const deadline=Date.now()+2000;while((await f.app.read(id)).attempts.at(-1)?.status==='Running'&&Date.now()<deadline)await new Promise(r=>setTimeout(r,5));
   assert.equal((await f.app.read(id)).attempts.at(-1)?.status,'Succeeded');
  }
  assert.deepEqual(observed,[{task_id:f.identity.task_id,conversation_id:child.session.id,config_sha256:f.identity.config_sha256},{task_id:f.identity.task_id,conversation_id:grandchild.session.id,config_sha256:f.identity.config_sha256}]);
 }finally{await f.app.close();}
});

test('V13-RETURN01 / AC03/04: returned grandchild evidence enters its parent model input and changes its draft without manual adoption',async()=>{
 let parentObserved=false,observed:unknown[]=[];
 const f=await fixture(true,{turn:async input=>{
  const context=JSON.parse(input.payload).authorized_context;
  const returned=context.returned_model_results??[];
  if(context.task==='复核资料'){
   observed=returned;parentObserved=returned.length===1&&returned[0].classification==='MODEL'&&returned[0].result.value.summary.includes('GRANDCHILD_OBSERVATION');
  }
  return {provider:'minimax-cn',model:'MiniMax-M3',cost_microunits:null,output:{kind:'result',summary:context.task==='复核资料'?(parentObserved?'根据 GRANDCHILD_OBSERVATION 改为注明资料限制':'未观察到子结果'):'GRANDCHILD_OBSERVATION：资料缺少原因字段',references:context.allowed_references.slice(-1),limitations:['模型意见，不是事实核验'],unknowns:[]}};
 }});
 try{
  const child=await f.child(f.parent.session.id,'复核资料'),grandchild=await f.child(child.session.id,'检查原因字段');
  for(const id of [grandchild.session.id,child.session.id]){
   const grant=await f.app.prepareCollaboration(id,'检查获准材料',[],[]);await f.app.start(id,grant.id,true);
   const deadline=Date.now()+2000;while((await f.app.read(id)).attempts.at(-1)?.status==='Running'&&Date.now()<deadline)await new Promise(r=>setTimeout(r,5));
   assert.equal((await f.app.read(id)).attempts.at(-1)?.status,'Succeeded');
   while(f.app.occupant()&&Date.now()<deadline)await new Promise(r=>setTimeout(r,5));
  }
  assert.equal(observed.length,1,'returned descendant must actually enter the next model context');assert.equal(parentObserved,true);
  const results=await f.store.childResults(child.session.id);assert.ok(results[0]?.value.summary.includes('根据 GRANDCHILD_OBSERVATION'));
  assert.equal((await f.store.readParentCollaboration(child.session.id)).reviews.length,0);
  assert.equal((await f.store.readParentCollaboration(f.parent.session.id)).reviews.length,0);
 }finally{await f.app.close();}
});

test('V13-DRIVE02 / AS04: a running parent queues a nested subset and yields its model slot before grandchild execution',async()=>{
 let f:Awaited<ReturnType<typeof fixture>>,childId='',nestedId='',inside=false,nestedRan=false;
 const runtime:CaseAssistantRuntime={turn:async input=>{
  const context=JSON.parse(input.payload).authorized_context;
  if(input.open_analysis?.conversation_id===childId){
   inside=true;
   const queue=Reflect.get(f.app,'queueChild');assert.equal(typeof queue,'function','running parent needs the v1.3 queue-only business entry');
   const nested=await queue(childId,'subagent','检查汇总的资料限制',[],[f.outcome_id],true,randomUUID());nestedId=nested.session.id;
   assert.equal((await f.app.read(nestedId)).attempts.length,0,'queueing never dispatches a model');
   inside=false;
   const yieldSlot=Reflect.get(input.open_analysis!,'runDelegation');assert.equal(typeof yieldSlot,'function');assert.ok(yieldSlot);
   await yieldSlot(async()=>{
    assert.equal(f.app.occupant(),null,'native run must return before the parent model slot is yielded');
    const grant=await f.app.prepareCollaboration(nestedId,'检查授权汇总',[],[]);assert.deepEqual(grant.blockers,[]);
    await f.app.start(nestedId,grant.id,true);
    const deadline=Date.now()+2000;while(f.app.hasWork(nestedId)&&Date.now()<deadline)await new Promise(r=>setTimeout(r,5));
    assert.equal((await f.app.read(nestedId)).attempts.at(-1)?.status,'Succeeded');
   });
   assert.equal(f.app.occupant()?.session_id,childId,'parent slot is reacquired for its continuation');
  }else{assert.equal(inside,false);nestedRan=true;}
  return {provider:'minimax-cn',model:'MiniMax-M3',cost_microunits:null,output:{kind:'result',summary:'资料限制意见',references:context.allowed_references,limitations:['MODEL'],unknowns:[]}};
 }};
 f=await fixture(true,runtime);
 try{
  assert.equal(typeof Reflect.get(f.app,'queueChild'),'function','V13-DRIVE02 queue-only entry is missing');
  const child=await f.child(f.parent.session.id,'核对汇总',true,[f.outcome_id]);childId=child.session.id;
  const grant=await f.app.prepareCollaboration(childId,'核对授权汇总',[],[]);await f.app.start(childId,grant.id,true);
  const deadline=Date.now()+2000;while(f.app.hasWork(childId)&&Date.now()<deadline)await new Promise(r=>setTimeout(r,5));
  const finished=await f.app.read(childId);assert.equal(finished.attempts.at(-1)?.status,'Succeeded',String(finished.attempts.at(-1)?.reason));assert.equal(nestedRan,true);assert.ok(nestedId);
 }finally{await f.app.close();}
});

test('V13-DRIVE04 / AU06: waiting for business information releases the physical slot and explicit reply reacquires it',async()=>{
 let calls=0;
 const f=await fixture(true,{turn:async input=>{calls++;const context=JSON.parse(input.payload).authorized_context;return {provider:'minimax-cn',model:'MiniMax-M3',cost_microunits:null,output:calls===1?{kind:'question',text:'需要哪一种业务解释？'}:{kind:'result',summary:'采用明确补充的解释范围',references:context.allowed_references,limitations:['MODEL'],unknowns:[]}};}});
 try{
  const child=await f.child(f.parent.session.id,'检查解释范围',true,[f.outcome_id]),grant=await f.app.prepareCollaboration(child.session.id,'检查授权说明',[],[]);
  await f.app.start(child.session.id,grant.id,true);await f.app.waitForIdle(child.session.id,new AbortController().signal);
  assert.equal((await f.app.read(child.session.id)).attempts.at(-1)?.status,'Waiting');assert.equal(f.app.occupant(),null,'waiting is a business state, not an in-flight model request');
  await f.app.send(child.session.id,'只说明数据限制');await f.app.waitForIdle(child.session.id,new AbortController().signal);
  assert.equal((await f.app.read(child.session.id)).attempts.at(-1)?.status,'Succeeded');assert.equal(calls,2);
 }finally{await f.app.close();}
});

test('V13-RETURN02 / AC03/04: a saved child is not a returned opinion until exact delivery is acknowledged; retrying delivery never reruns its model',async()=>{
 const {createOpenAnalysisDelegation}=await import('../../../packages/application/open-analysis-delegation.ts');let calls=0;
 const f=await fixture(true,{turn:async input=>{calls++;const context=JSON.parse(input.payload).authorized_context;return {provider:'minimax-cn',model:'MiniMax-M3',cost_microunits:null,output:{kind:'result',summary:'待返回模型意见',references:context.allowed_references,limitations:['MODEL'],unknowns:[]}};}});
 try{
  await f.store.importOpenHistory(f.parent.session.id,f.parent.source,new Date().toISOString());const root=await f.app.read(f.parent.session.id);
  const preview=await f.app.prepareChild(root.session.id,'subagent','检查资料范围',null,root.events.filter(e=>['user','advice'].includes(e.kind)).map(e=>e.id),[f.outcome_id],true);const parent=await f.app.createChild(root.session.id,preview.id,randomUUID(),true);
  const delegation=createOpenAnalysisDelegation({store:f.analysis,assistant:f.app,source:f.bridge,project_id:parent.relation.source.owner.project_id}).child(parent.session.id),request={kind:'fork' as const,task:'检查报告限制',instruction:{action:'check_limitations' as const,reference_paths:['/verification'],completion_reference_paths:['/verification']},material_id:f.outcome_id};
  const queued=await delegation.queue(f.identity,request),grant=await f.app.prepareCollaboration(queued.child_id,request.task,[],[]);await f.app.start(queued.child_id,grant.id,true);await f.app.waitForIdle(queued.child_id,new AbortController().signal);
  assert.equal((await f.app.readCollaboration(queued.child_id)).attempts.at(-1)?.status,'Succeeded');assert.equal((await delegation.results(f.identity)).length,0);
  assert.equal((await delegation.queue(f.identity,request)).state,'queued','saved is not returned; the exact delivery remains to be acknowledged');
  await delegation.drain(f.identity,new AbortController().signal);assert.equal(calls,1);assert.equal((await delegation.results(f.identity)).length,1);assert.equal((await delegation.queue(f.identity,request)).state,'returned');
 }finally{await f.app.close();}
});


test('V13-MATERIAL-HANDLE01 / AC04: handles require actual current reading, never rebind removed material or accept a guessed identity',async()=>{
 const {createDelegationMaterialReferences}=await import('../../../packages/application/open-analysis-delegation.ts');
 const f=await fixture(),first=randomUUID(),second=randomUUID();let ids=[first];
 try{
  const refs=createDelegationMaterialReferences({materials:async()=>ids.map(material_id=>({material_id,label:'当前材料',verification:'independent_arithmetic'})),queue:async()=>assert.fail('read never dispatches'),drain:async()=>assert.fail('read never drains'),results:async()=>[]},f.identity);
  assert.throws(()=>refs.resolve(first),{code:'DELEGATION_CATALOG_REQUIRED'});
  assert.deepEqual((await refs.read()).map(m=>m.material_id),['material:1']);assert.equal(refs.resolve('material:1'),first);assert.equal(refs.resolve(first),first);
  assert.throws(()=>refs.resolve(second),{code:'RESULT_OUTSIDE_AUTHORIZATION'});
  ids=[second];assert.deepEqual((await refs.read()).map(m=>m.material_id),['material:2']);assert.throws(()=>refs.resolve('material:1'),{code:'RESULT_OUTSIDE_AUTHORIZATION'});assert.throws(()=>refs.resolve(first),{code:'RESULT_OUTSIDE_AUTHORIZATION'});assert.equal(refs.resolve('material:2'),second);
 }finally{await f.app.close();}
});


test('V13-AC04-INSTRUCTION01 automatic Fork and grandchild outbound exclude private purposes and unrelated parent history',async()=>{
 const f=await fixture(true,{turn:async()=>assert.fail('no physical model needed for outbound projection')},'ROOT_PRIVATE_GOAL_SENTINEL_OTHER_PERIOD_620');
 try{
  const source=f.bridge.read(f.bridge.owner(f.identity.task_id))!;await f.store.importOpenHistory(f.parent.session.id,source,new Date().toISOString());
  const events=(await f.app.read(f.parent.session.id)).events;
  const instruction={version:'1.0' as const,action:'inspect_sources' as const,reference_paths:['/framework','/verification'],completion_reference_paths:['/verification'],private_purpose:'ROOT_PRIVATE_TASK_SENTINEL_OTHER_PERIOD_620'};
  const first=await f.app.queueChild(f.parent.session.id,'fork',instruction.private_purpose,events.map(e=>e.id),[f.outcome_id],true,randomUUID(),instruction);
  const grant=await f.app.prepareCollaboration(first.session.id,instruction.private_purpose,[],[]);
  assert.equal(grant.payload.includes('ROOT_PRIVATE_'),false,'the actual child outbound payload must not inherit root goal, private task or source case name');
  const context=JSON.parse(grant.payload);assert.ok(context.aggregate.content.includes('7'));assert.equal(context.inherited_history.length,1);assert.equal(context.inherited_history[0].status,'authorized_material_projection');
  assert.equal(first.relation.automatic_instruction?.private_purpose,instruction.private_purpose,'private author intent remains locally recoverable');
  const next={...instruction,action:'check_limitations' as const,private_purpose:'CHILD_PRIVATE_TASK_SENTINEL_UNSELECTED_FACT_999'};
  const grand=await f.app.queueChild(first.session.id,'subagent',next.private_purpose,[],[f.outcome_id],true,randomUUID(),next);
  const grant2=await f.app.prepareCollaboration(grand.session.id,grand.relation.task,[],[]);
  assert.equal(/ROOT_PRIVATE_|CHILD_PRIVATE_/.test(grant2.payload),false);assert.ok(JSON.parse(grant2.payload).aggregate.content.includes('7'));
  const reopened=createLocalCaseAssistantStore(f.options);assert.deepEqual((await reopened.readChild(grand.session.id))?.automatic_instruction,next);
 }finally{await f.app.close();}
});


test('V13-AC04-INSTRUCTION02 invalid actions, absent references and forged inherited text cannot create a descendant; manual authorized text remains compatible',async()=>{
 const f=await fixture();
 try{
  const instruction={version:'1.0' as const,action:'inspect_sources' as const,reference_paths:['/verification'],completion_reference_paths:['/verification'],private_purpose:'private local intent'};
  for(const altered of [{...instruction,action:'send_secret'},{...instruction,reference_paths:['/not_selected']},{...instruction,completion_reference_paths:['/framework']}])await assert.rejects(()=>f.app.queueChild(f.parent.session.id,'subagent','local purpose',[],[f.outcome_id],true,randomUUID(),altered as any),{code:'DELEGATION_INSTRUCTION_INVALID'});
  assert.equal((await f.app.readParent(f.parent.session.id)).children.length,0);
  const first=await f.app.queueChild(f.parent.session.id,'fork','local purpose',[],[f.outcome_id],true,randomUUID(),instruction);
  const forged={...first.relation,id:randomUUID(),selected_history:first.relation.selected_history.map(e=>({...e,text:'UNSELECTED_SECRET'}))};
  await assert.rejects(()=>f.store.createChild(randomUUID(),{id:randomUUID(),title:forged.task,source:forged.source.owner,created_at:new Date().toISOString(),archived:false},forged,new AbortController().signal),{code:'FORBIDDEN'});
  const manual=await f.child(f.parent.session.id,'用户明确许可的新说明',true,[f.outcome_id]);
  const grant=await f.app.prepareCollaboration(manual.session.id,'用户主动补充的业务信息',[],[]);assert.ok(grant.payload.includes('用户主动补充的业务信息'));
 }finally{await f.app.close();}
});


test('V13-AC04-CATALOG03 all top-level authorized references remain discoverable with a large framework',async()=>{
 const {delegationReferencePaths}=await import('../../../packages/product-core/open-analysis-delegation-instruction.ts');const f=await fixture();
 try{const source=f.bridge.read(f.bridge.owner(f.identity.task_id))!;const value=JSON.parse(source.aggregate!.content);value.framework.extra=Object.fromEntries(Array.from({length:100},(_,i)=>['field'+i,i]));const content=JSON.stringify(value);const paths=delegationReferencePaths({...source,aggregate:{...source.aggregate!,content,sha256:taskHash(content)}});assert.ok(paths.includes('/verification'));assert.ok(paths.includes('/calculation'));assert.ok(paths.length<=64);}finally{await f.app.close();}
});

// Only the model transport is substituted; Application, Store, delegation and Adapter are production consumers.
test('V13-REPEAT-FEEDBACK01 / AS04: rejected ancestor work is explained before one explicit model correction creates and returns a legal grandchild',async()=>{
 const {createOpenAnalysisDelegation}=await import('../../../packages/application/open-analysis-delegation.ts');
 const {createOpenAnalysisCollaborationRuntime}=await import('../../../adapters/agent-pi/open-analysis-collaboration.ts');
 let adapter:CaseAssistantRuntime,childId='',feedback:unknown,grandRan=false,consumed=false;
 const f=await fixture(true,{turn:input=>adapter.turn(input)});
 try{
  const instruction={version:'1.0' as const,action:'check_consistency' as const,reference_paths:['/verification'],completion_reference_paths:['/verification'],private_purpose:'PRIVATE_LOCAL_PURPOSE'};
  const child=await f.app.queueChild(f.parent.session.id,'subagent',instruction.private_purpose,[],[f.outcome_id],true,randomUUID(),instruction);childId=child.session.id;
  const delegation=createOpenAnalysisDelegation({store:f.analysis,assistant:f.app,source:f.bridge,project_id:child.relation.source.owner.project_id});
  adapter=createOpenAnalysisCollaborationRuntime({authorizeSource:()=>true,collaboration:id=>delegation.child(id),runtime:{run:async input=>{
   const tool=(name:string)=>input.tools.find(t=>t.name===name)!;
   const finish=()=>tool('finish_result').execute({summary:'合法资料限制意见',reference_indices:[0],limitations:['MODEL'],unknowns:[]},input.signal);
   if(input.conversation_id!==childId){grandRan=true;await finish();}
   else if(!grandRan){
    const materials=await tool('read_delegation_materials').execute({},input.signal) as {material_id:string}[];
    const args={kind:'subagent',task:'PRIVATE_CHANGED_TEXT_IS_NOT_DIFFERENT_WORK',material_id:materials[0]!.material_id,instruction:{action:'check_consistency',reference_paths:['/verification'],completion_reference_paths:['/verification']}};
    feedback=await tool('delegate_analysis').execute(args,input.signal);
    assert.equal((feedback as any).diagnostic.reason,'repeats_ancestor_instruction');assert.equal((feedback as any).diagnostic.completion_reference_scope,'current_selected_references_or_descendants');
    assert.equal((await f.app.readParent(childId)).children.length,0,'rejected duplicate creates no descendant');
    await tool('delegate_analysis').execute({...args,instruction:{action:'check_limitations',reference_paths:['/verification/grade'],completion_reference_paths:['/verification/grade']}},input.signal);
   }else{
    const returned=await tool('read_delegation_results').execute({},input.signal) as unknown[];consumed=returned.length===1;await finish();
   }
   return {text:'模型已观察工具反馈',tools:[]};
  }}});
  const grant=await f.app.prepareCollaboration(childId,child.relation.task,[],[]);await f.app.start(childId,grant.id,true);await f.app.waitForIdle(childId,new AbortController().signal);
  assert.equal((await f.app.read(childId)).attempts.at(-1)?.status,'Succeeded',String((await f.app.read(childId)).attempts.at(-1)?.reason));
  assert.equal(Reflect.get(feedback as object,'created'),false);assert.equal(Reflect.get(feedback as object,'code'),'REPEATED_DELEGATION');assert.equal(JSON.stringify(feedback).includes('PRIVATE_'),false);
  assert.equal(grandRan,true);assert.equal(consumed,true);assert.equal((await f.app.readParent(childId)).children.length,1);
  assert.equal((await f.store.childResults(childId)).length,1);
 }finally{await f.app.close();}
});

for(const boundary of ['repeat','revoked'] as const)test(`V13-REPEAT-FEEDBACK02 / AC04/06: ${boundary} after ancestor feedback cannot create or replay a descendant`,async()=>{
 const {createOpenAnalysisDelegation}=await import('../../../packages/application/open-analysis-delegation.ts');
 const {createOpenAnalysisCollaborationRuntime}=await import('../../../adapters/agent-pi/open-analysis-collaboration.ts');
 let adapter:CaseAssistantRuntime,allowed=true,feedback:unknown;
 const f=await fixture(true,{turn:input=>adapter.turn(input)});
 try{
  const instruction={version:'1.0' as const,action:'check_consistency' as const,reference_paths:['/verification'],completion_reference_paths:['/verification'],private_purpose:'PRIVATE_LOCAL_ONLY'};
  const child=await f.app.queueChild(f.parent.session.id,'subagent',instruction.private_purpose,[],[f.outcome_id],true,randomUUID(),instruction);
  const delegation=createOpenAnalysisDelegation({store:f.analysis,assistant:f.app,source:f.bridge,project_id:child.relation.source.owner.project_id});
  adapter=createOpenAnalysisCollaborationRuntime({authorizeSource:()=>allowed,collaboration:id=>delegation.child(id),runtime:{run:async input=>{
   const catalog=await input.tools.find(t=>t.name==='read_delegation_materials')!.execute({},input.signal) as {material_id:string}[];
   const tool=input.tools.find(t=>t.name==='delegate_analysis')!,args={kind:'subagent',task:'私有文字不能改变工作',material_id:catalog[0]!.material_id,instruction:{action:'check_consistency',reference_paths:['/verification'],completion_reference_paths:['/verification']}};
   feedback=await tool.execute(args,input.signal);
   if(boundary==='revoked')allowed=false;
   await tool.execute(boundary==='repeat'?args:{...args,instruction:{...args.instruction,action:'check_limitations'}},input.signal);
   return {text:'不应到达',tools:[]};
  }}});
  const grant=await f.app.prepareCollaboration(child.session.id,child.relation.task,[],[]);await f.app.start(child.session.id,grant.id,true);await f.app.waitForIdle(child.session.id,new AbortController().signal);
  assert.equal(Reflect.get(feedback as object,'created'),false);
  assert.equal((await f.app.read(child.session.id)).attempts.at(-1)?.reason,boundary==='repeat'?'DELEGATION_CORRECTION_EXHAUSTED':'AUTHORITY_REQUIRED');
  assert.equal((await f.app.readParent(child.session.id)).children.length,0);assert.equal((await f.store.childResults(child.session.id)).length,0);
 }finally{await f.app.close();}
});


test('V13-COMPLETION-REFERENCE01 / AC04: completion may focus on a real descendant of a selected object without acquiring a sibling',async()=>{
 const f=await fixture();
 try{
  const instruction={version:'1.0' as const,action:'check_limitations' as const,reference_paths:['/framework'],completion_reference_paths:['/framework/operation'],private_purpose:'核对所选方案方法'};
  const child=await f.app.queueChild(f.parent.session.id,'subagent',instruction.private_purpose,[],[f.outcome_id],true,randomUUID(),instruction);
  assert.deepEqual(child.relation.automatic_instruction?.completion_reference_paths,['/framework/operation']);
  const grant=await f.app.prepareCollaboration(child.session.id,child.relation.task,[],[]);assert.ok(grant.payload.includes('sum'));
  for(const path of ['/verification','/framework/no_such_field','/framework/goal'])await assert.rejects(()=>f.app.queueChild(f.parent.session.id,'subagent','不扩大引用',[],[f.outcome_id],true,randomUUID(),{...instruction,completion_reference_paths:[path]}),{code:'DELEGATION_INSTRUCTION_INVALID'});
  assert.equal((await f.app.readParent(f.parent.session.id)).children.length,1);
 }finally{await f.app.close();}
});

test('V13-COMPLETION-REFERENCE02 / AC04: string prefixes and escaped neighboring keys cannot acquire unselected completion fields',async()=>{
 const {validateAutomaticInstruction}=await import('../../../packages/product-core/open-analysis-delegation-instruction.ts');const f=await fixture();
 try{
  const origin=f.bridge.read(f.bridge.owner(f.identity.task_id))!;
  const material={selected:{value:7},selectedOther:{value:9},'selected/slash':{value:11}};
  const source={...origin,aggregate:{...origin.aggregate!,content:JSON.stringify(material)}};
  const instruction={version:'1.0',action:'check_limitations',reference_paths:['/selected'],completion_reference_paths:['/selected/value'],private_purpose:'只核对选定对象'};
  assert.deepEqual(validateAutomaticInstruction(instruction,source).completion_reference_paths,['/selected/value']);
  for(const path of ['/selectedOther/value','/selected~1slash/value','/selected/missing'])assert.throws(()=>validateAutomaticInstruction({...instruction,completion_reference_paths:[path]},source),{code:'DELEGATION_INSTRUCTION_INVALID'});
 }finally{await f.app.close();}
});


test('V13-DELEGATION-DIAGNOSTIC01 / AC04: semantic pointer feedback locates the invalid argument and discloses only authorized choices',async()=>{
 const {validateAutomaticInstruction}=await import('../../../packages/product-core/open-analysis-delegation-instruction.ts');const f=await fixture();
 try{
  const origin=f.bridge.read(f.bridge.owner(f.identity.task_id))!;
  const source={...origin,aggregate:{...origin.aggregate!,content:JSON.stringify({selected:{value:7},sibling:{value:9},framework:{goal:'PRIVATE_GOAL_SENTINEL',operation:'sum'}})}};
  const instruction={version:'1.0',action:'check_limitations',reference_paths:['/selected','/NO_SUCH_PRIVATE_FIELD'],completion_reference_paths:['/selected/value'],private_purpose:'PRIVATE_PURPOSE_SENTINEL'};
  assert.throws(()=>validateAutomaticInstruction(instruction,source),(error:any)=>{
   assert.equal(error.code,'DELEGATION_INSTRUCTION_INVALID');assert.equal(error.safe_details.reason,'reference_path_not_found');assert.equal(error.safe_details.argument_path,'/instruction/reference_paths/1');
   assert.ok(error.safe_details.available_reference_paths.includes('/selected/value'));assert.ok(error.safe_details.available_reference_paths.includes('/sibling'));
   assert.doesNotMatch(JSON.stringify(error.safe_details),/PRIVATE_|"value":7/);return true;
  });
  assert.throws(()=>validateAutomaticInstruction({...instruction,reference_paths:['/selected'],completion_reference_paths:['/sibling/value']},source),(error:any)=>{
   assert.equal(error.safe_details.reason,'completion_path_not_selected');assert.equal(error.safe_details.argument_path,'/instruction/completion_reference_paths/0');assert.deepEqual(error.safe_details.available_reference_paths,['/selected']);return true;
  });
  assert.deepEqual(validateAutomaticInstruction({...instruction,reference_paths:['/selected']},source).completion_reference_paths,['/selected/value']);
 }finally{await f.app.close();}
});


test('V13-BATCH-CORRECTION01 / AC04: native batch defers later delegation until the next model actually observes feedback, with one correction only',async()=>{
 const {createPiSessionOpenAnalysisRuntime}=await import('../../../adapters/agent-pi/native-open-analysis.ts');
 const {createApprovedProviderCredentials}=await import('../../../adapters/agent-pi/provider-credentials.ts');
 const {createLocalAnalysisRequestLedger}=await import('../../../adapters/storage-local/analysis-request-ledger.ts');
 const {delegationInstructionSchema}=await import('../../../packages/product-core/open-analysis-delegation-instruction.ts');
 for(const corrected of [true,false]){
  const f=await fixture();let calls=0,attempts=0,allowed=true,observed=false;
  try{
   const ledger=createLocalAnalysisRequestLedger({projectRoot:f.root});
   const runtime=createPiSessionOpenAnalysisRuntime({projectRoot:f.root,ledger,credentials:createApprovedProviderCredentials({environment:{}}),modelTransport:async request=>{
    calls++;if(calls===2){const text=request.messages.filter(m=>m.role==='tool').map(m=>m.text??'').join('\n');observed=text.includes('needs_instruction_correction')&&text.includes('deferred')&&text.includes('executed');}
    if(calls>=3)return {content:[{kind:'text',text:'已读取模型纠正后的实际结果'}],stop:'complete',usage:{inputTokens:4,outputTokens:2}};
    const args={action:'check_limitations',reference_paths:['/framework'],completion_reference_paths:calls===2&&corrected?['/framework/operation']:['/verification']};
    return {content:(calls===1?[0,1]:[0]).map(i=>({kind:'tool' as const,id:'batch-'+calls+'-'+i,name:'delegate_analysis',arguments:args})),stop:'tools',usage:{inputTokens:4,outputTokens:2}};
   }});
   const run=()=>runtime.run({identity:f.identity,nativeBusinessTools:true,recoverInvalidArguments:true,prompt:'对所选材料检查限制',system:'依据实际工具反馈纠正',signal:new AbortController().signal,authorize:()=>allowed,tools:[{name:'delegate_analysis',description:'本任务合法材料委派',parameters:delegationInstructionSchema,execute:async args=>{
    attempts++;
    try{return await f.app.queueChild(f.parent.session.id,'subagent','核对所选资料',[],[f.outcome_id],true,randomUUID(),{...args,version:'1.0',private_purpose:'核对所选资料'} as any);}
    catch(error){if(attempts>1){allowed=false;throw error;}return {status:'needs_instruction_correction',created:false,diagnostic:(error as any).safe_details};}
   }}]});
   if(corrected){await run();assert.equal((await f.app.readParent(f.parent.session.id)).children.length,1);assert.equal(calls,3);}
   else {await assert.rejects(run);assert.equal((await f.app.readParent(f.parent.session.id)).children.length,0);assert.equal(calls,2);}
   assert.equal(observed,true);assert.equal(attempts,2,'same-batch second entry never consumes a correction');assert.equal(ledger.pending!().length,0);
  }finally{await f.app.close();}
 }
});


test('V13-REFERENCE-CHOICE01 / AC04: explicitly selected current catalog indices preserve exact paths and reject mixed, removed or guessed references',async()=>{
 const {createDelegationMaterialReferences}=await import('../../../packages/application/open-analysis-delegation.ts');const f=await fixture(),id=randomUUID();let active=true;
 try{const refs=createDelegationMaterialReferences({materials:async()=>active?[{material_id:id,label:'实际核验',verification:'independent_arithmetic',instruction_contract:{actions:['challenge'],reference_paths:['/framework','/calculation','/verification']}}]:[],queue:async()=>assert.fail('no dispatch'),drain:async()=>assert.fail('no drain'),results:async()=>[]},f.identity);
 const input={action:'challenge',reference_indices:[1,2],completion_reference_indices:[2]};assert.throws(()=>refs.resolveInstruction('material:1',input),{code:'DELEGATION_CATALOG_REQUIRED'});await refs.read();assert.deepEqual(refs.resolveInstruction('material:1',input),{action:'challenge',reference_paths:['/calculation','/verification'],completion_reference_paths:['/verification']});
 for(const bad of [{...input,reference_indices:[3]},{...input,reference_indices:[-1]},{...input,reference_indices:[1.5]},{...input,reference_indices:[1,1]},{...input,reference_paths:['/calculation']}])assert.throws(()=>refs.resolveInstruction('material:1',bad),{code:'DELEGATION_INSTRUCTION_INVALID'});
 active=false;await refs.read();assert.throws(()=>refs.resolveInstruction('material:1',input));
 }finally{await f.app.close();}
});


test('V13-BUSINESS-INVESTIGATION01 / AS04 / AC04: production catalog first exposes computed business values without dispatching or copying private purposes',async()=>{
 const {createDelegationMaterialReferences}=await import('../../../packages/application/open-analysis-delegation.ts');
 const {delegationReferencePaths}=await import('../../../packages/product-core/open-analysis-delegation-instruction.ts');
 const f=await fixture(true,{turn:async()=>assert.fail('catalog and grant creation do not call a model')},'PRIVATE_GOAL_SENTINEL');
 try{
  const source=f.bridge.read(f.bridge.owner(f.identity.task_id))!,paths=delegationReferencePaths(source);
  const refs=createDelegationMaterialReferences({materials:async()=>[{material_id:f.outcome_id,label:'当前实际核验',verification:'independent_arithmetic',instruction_contract:{actions:['check_limitations'],reference_paths:paths}}],queue:async()=>assert.fail('catalog is not a dispatch'),drain:async()=>assert.fail('catalog is not an execution'),results:async()=>[]},f.identity);
  const catalog=await refs.read();assert.equal((await f.app.readParent(f.parent.session.id)).children.length,0);
  assert.deepEqual(catalog[0]!.instruction_contract!.reference_paths.slice(0,3),['/calculation','/verification','/framework']);
  const selected=refs.resolveInstruction('material:1',{action:'check_limitations',reference_indices:[0,1],completion_reference_indices:[0]});
  assert.deepEqual(selected.reference_paths,['/calculation','/verification']);
  const instruction={...selected,version:'1.0' as const,private_purpose:'PRIVATE_TASK_SENTINEL'};
  const child=await f.app.queueChild(f.parent.session.id,'fork',instruction.private_purpose,[],[f.outcome_id],true,randomUUID(),instruction);
  const grant=await f.app.prepareCollaboration(child.session.id,child.relation.task,[],[]),context=JSON.parse(grant.payload);
  const history=JSON.parse(context.inherited_history[0].text);
  assert.deepEqual(history.references.map((ref:any)=>ref.path),['/calculation','/verification']);
  assert.equal(history.references[0].value.value,'7');assert.equal(history.references[0].value.unit,'个');
  assert.equal(history.references[1].value.grade,'independent_arithmetic');assert.doesNotMatch(grant.payload,/PRIVATE_GOAL_SENTINEL|PRIVATE_TASK_SENTINEL/);
  assert.ok(paths.includes('/revision'));assert.ok(paths.includes('/framework/binding_sha256'),'identity references are retained, not deleted');
 }finally{await f.app.close();}
});


test('V13-AC04-BUNDLE01 / AS04: explicit multi-summary queue delivers selected calculations and source-bound meaning, survives restart and restricts descendants',async()=>{
 const {createOpenAnalysisDelegation}=await import('../../../packages/application/open-analysis-delegation.ts');
 let outbound='';const f=await fixture(true,{turn:async input=>{outbound=input.payload;const context=JSON.parse(input.payload).authorized_context;return {provider:'minimax-cn',model:'MiniMax-M3',cost_microunits:null,output:{kind:'result',summary:'只依据所选两项核验资料比较',references:context.allowed_references,limitations:['MODEL'],unknowns:[]}};}},'PRIVATE_ROOT_FREE_TEXT',true);
 try{
  const delegation=createOpenAnalysisDelegation({store:f.analysis,assistant:f.app,source:f.bridge,project_id:f.parent.source.owner.project_id});
  const instruction={action:'compare' as const,reference_paths:['/calculation'],completion_reference_paths:['/calculation']};
  const request={kind:'fork' as const,task:'PRIVATE_CHILD_PURPOSE',material_id:f.steps[0]!,instruction,additional_materials:[{material_id:f.steps[1]!,instruction}]};
  const queued=await delegation.root.queue(f.identity,request),child=await f.app.readCollaboration(queued.child_id);
  const repeated=await delegation.root.queue(f.identity,{...request,material_id:f.steps[1]!,additional_materials:[{material_id:f.steps[0]!,instruction}]});assert.equal(repeated.child_id,queued.child_id,'selection ordering cannot create duplicate work');
  const grant=await f.app.prepareCollaboration(queued.child_id,child.relation.task,[],[]),out=JSON.parse(grant.payload).aggregate;
  assert.equal(outbound,'','queue/grant is not a model invocation');
  const value=JSON.parse(out.content);assert.ok(value.materials,'actual outbound is still a single summary, not the two explicitly selected results');assert.equal(Object.keys(value.materials).length,2,'both explicitly selected summaries must reach the actual child authorization');
  assert.equal(value.materials[f.steps[0]!].calculation.value,'7');assert.equal(value.materials[f.steps[1]!].calculation.value,'1');
  assert.equal(value.materials[f.steps[0]!].business_binding.inputs[0].fields[0].name,'数量');
  assert.equal(value.materials[f.steps[0]!].business_binding.unit,'个');
  assert.doesNotMatch(grant.payload,/PRIVATE_ROOT_FREE_TEXT|PRIVATE_CHILD_PURPOSE|PRIVATE_UNSELECTED_HEADER|PRIVATE_RAW_ROW/);assert.ok(!grant.payload.includes(f.steps[2]!),'unselected third proof is not inherited');
  const reopened=createLocalOpenAnalysisStore({projectRoot:f.root}),bridge=createOpenAnalysisCollaborationSource({project_id:f.parent.source.owner.project_id,store:reopened,allowQualifiedSteps:true});
  assert.deepEqual(bridge.read(child.relation.source.owner),child.relation.source,'disk readback must resolve the same bundle identity');
  const selected=await delegation.child(queued.child_id).materials(f.identity);assert.deepEqual(selected.map(m=>m.material_id).sort(),f.steps.slice(0,2).sort());
  assert.deepEqual(selected[0]!.instruction_contract!.reference_paths,['/calculation','/calculation/inspection_sha256','/calculation/method','/calculation/plan_sha256','/calculation/rows','/calculation/source_sha256','/calculation/unit','/calculation/value','/calculation/version']);assert.ok(selected.every(m=>m.instruction_contract!.reference_paths.every(path=>path==='/calculation'||path.startsWith('/calculation/'))),'the expanded catalog still omits every unselected sibling');
  const nested=await delegation.child(queued.child_id).queue(f.identity,{kind:'subagent',task:'PRIVATE_GRAND_PURPOSE',material_id:f.steps[1]!,instruction:{...instruction,action:'check_limitations'}});
  const nestedState=await f.app.readCollaboration(nested.child_id),nestedGrant=await f.app.prepareCollaboration(nested.child_id,nestedState.relation.task,[],[]);
  const reduced=JSON.parse(JSON.parse(nestedGrant.payload).aggregate.content);
  assert.deepEqual(Object.keys(reduced.materials),[f.steps[1]!]);assert.equal(reduced.materials[f.steps[1]!].calculation.value,'1');
  const forged={...nestedState.relation,id:randomUUID(),parent_session_id:queued.child_id,task:'伪造重新获取方案',automatic_instruction:{...nestedState.relation.automatic_instruction!,reference_paths:['/materials/'+f.steps[1]+'/framework'],completion_reference_paths:['/materials/'+f.steps[1]+'/framework']}};
  await assert.rejects(()=>f.store.createChild(randomUUID(),{id:randomUUID(),title:forged.task,source:forged.source.owner,created_at:new Date().toISOString(),archived:false},forged,new AbortController().signal),{code:'RESULT_OUTSIDE_AUTHORIZATION'});
  await f.app.start(queued.child_id,grant.id,true);await f.app.waitForIdle(queued.child_id,new AbortController().signal);assert.equal((await f.app.read(queued.child_id)).attempts.at(-1)?.status,'Succeeded');assert.equal(JSON.parse(outbound).authorized_context.aggregate.content,out.content,'the actual transport receives the selected bundle');
  await assert.rejects(()=>delegation.child(queued.child_id).queue(f.identity,{...request,material_id:f.steps[2]!,additional_materials:[]}),{code:'RESULT_OUTSIDE_AUTHORIZATION'});
  await assert.rejects(()=>delegation.child(queued.child_id).queue(f.identity,{...request,instruction:{...instruction,reference_paths:['/framework'],completion_reference_paths:['/framework']},additional_materials:[]}),{code:'RESULT_OUTSIDE_AUTHORIZATION'});
 }finally{await f.app.close();}
});


test('V13-AC04-BUNDLE02 / AC04/06: duplicate, missing, stale, wrong-reference and stopped bundle input never creates a child',async()=>{
 const {createOpenAnalysisDelegation}=await import('../../../packages/application/open-analysis-delegation.ts');const f=await fixture(true,null,'PRIVATE_ROOT',true);
 try{const delegation=createOpenAnalysisDelegation({store:f.analysis,assistant:f.app,source:f.bridge,project_id:f.parent.source.owner.project_id}).root;
  const instruction={action:'challenge' as const,reference_paths:['/verification'],completion_reference_paths:['/verification']},request={kind:'subagent' as const,task:'PRIVATE_PURPOSE',material_id:f.steps[0]!,instruction,additional_materials:[{material_id:f.steps[1]!,instruction}]};
  for(const bad of [{...request,additional_materials:[{material_id:f.steps[0]!,instruction}]},{...request,additional_materials:[{material_id:randomUUID(),instruction}]},{...request,additional_materials:[{material_id:f.steps[1]!,instruction:{...instruction,action:'explain'}}]}])await assert.rejects(()=>delegation.queue(f.identity,bad as typeof request));
  for(const identity of [{...f.identity,revision:'2'},{...f.identity,scope_sha256:'c'.repeat(64)},{...f.identity,grant_id:randomUUID()}])await assert.rejects(()=>delegation.queue(identity,request),{code:'AUTHORIZATION_STALE'});
  await assert.rejects(()=>delegation.queue(f.identity,{...request,instruction:{...instruction,reference_paths:['/framework/goal'],completion_reference_paths:['/framework/goal']}}),{code:'DELEGATION_INSTRUCTION_INVALID'});
  const sessionCount=(await f.app.list(f.parent.source.owner.project_id)).length;for(const session of await f.app.list(f.parent.source.owner.project_id))assert.equal((await f.app.readParent(session.id)).children.length,0);
  for(const session of await f.app.list(f.parent.source.owner.project_id))await f.app.closeSession(session.id,true);await assert.rejects(()=>delegation.queue(f.identity,request),{code:'PARENT_CLOSED'});assert.equal((await f.app.list(f.parent.source.owner.project_id)).length,sessionCount);
 }finally{await f.app.close();}
});


test('V13-AC04-BUNDLE03 / AS04: real root Application tool resolves multiple short handles and child Adapter consumes their business bindings',async()=>{
 const {createOpenAnalysisApplication}=await import('../../../packages/application/open-analysis.ts');const {createOpenAnalysisDelegation}=await import('../../../packages/application/open-analysis-delegation.ts');const {createOpenAnalysisCollaborationRuntime}=await import('../../../adapters/agent-pi/open-analysis-collaboration.ts');
 let adapter:CaseAssistantRuntime,observed:Record<string,any>|null=null,rounds=0;
 const f=await fixture(true,{turn:input=>adapter.turn(input)},'PRIVATE_GOAL',true);
 try{
  const delegation=createOpenAnalysisDelegation({store:f.analysis,assistant:f.app,source:f.bridge,project_id:f.parent.source.owner.project_id});
  adapter=createOpenAnalysisCollaborationRuntime({authorizeSource:()=>true,collaboration:id=>delegation.child(id),runtime:{run:async input=>{const context=JSON.parse(input.prompt).authorized_context;observed=JSON.parse(context.aggregate.content);await input.tools.find(t=>t.name==='finish_result')!.execute({summary:'获准资料显示数量合计及记录数，不能推断原因',reference_indices:[0],limitations:['MODEL'],unknowns:[]},input.signal);return {text:'已完成所选比较',tools:[]};}}});
  const app=createOpenAnalysisApplication({agentLed:true,collaboration:delegation.root,loadSelectedSource:async()=>f.analysis.read(f.identity.task_id)!.source,isAuthorized:()=>true,verify:verifyOpenAnalysisIntegerSum,saveFramework:async()=>assert.fail('delegation needs no new calculation'),saveOutcome:async()=>assert.fail('this test is not report acceptance'),saveClarification:async value=>({saved:true,...value.identity}),runtime:{run:async input=>{
   rounds++;const tool=(name:string)=>input.tools.find(t=>t.name===name)!;
   if(rounds===1){const catalog=await tool('read_delegation_materials').execute({},input.signal) as any[];const instruction={action:'compare',reference_indices:[0],completion_reference_indices:[0]};const result=await tool('delegate_analysis').execute({kind:'subagent',task:'PRIVATE_PURPOSE',material_id:catalog[0].material_id,instruction,additional_materials:[{material_id:catalog[1].material_id,instruction}]},input.signal);assert.equal(Reflect.get(result as object,'state'),'queued');assert.deepEqual(Reflect.get(result as object,'selected_material_ids'),f.steps.slice(0,2));assert.equal(Reflect.get(result as object,'selected_material_count'),2);assert.equal(Reflect.get(result as object,'purpose_delivery'),'local_only');}
   else {const results=await tool('read_delegation_results').execute({},input.signal) as any[];assert.equal(results.length,1);assert.match(results[0].result.value.summary,/数量合计/);await tool('ask_user').execute({text:'还需要补充原因资料才能分析原因'},input.signal);}
   return {text:'依据实际返回意见保留原因资料缺口',tools:[]};
  }}});
  const result=await app.run({identity:f.identity,question:'比较数量合计和记录数的意义',signal:new AbortController().signal});assert.equal(result.state,'waiting');assert.equal(rounds,2);assert.ok(observed);assert.equal(Object.keys(Reflect.get(Object(observed),'materials')).length,2);assert.equal(Reflect.get(Object(observed),'materials')[f.steps[0]!].business_binding.inputs[0].fields[0].name,'数量');assert.doesNotMatch(JSON.stringify(observed),/PRIVATE_GOAL|PRIVATE_PURPOSE/);
 }finally{await f.app.close();}
});


test('V13-AC04-BUNDLE04 / AC04: a new revision preserves the old selected bundle in history without granting it to current work',async()=>{
 const f=await fixture(true,null,'旧数量核验',true);
 try{const ref=f.bridge.selectionOwner(f.identity.task_id,f.steps.slice(0,2)),before=f.bridge.read(ref)!;const next={...f.identity,revision:'2',run_id:randomUUID(),attempt_id:randomUUID(),operation_id:randomUUID()};
  const revised=f.analysis.revise(f.identity.task_id,{command_id:randomUUID(),expected_revision:'1',identity:next,question:'新的数量核验问题',preferences:{skill:'general',prompt:'professional'}});
  assert.deepEqual(revised.delegation_selections,[]);assert.equal(revised.history?.[0]?.delegation_selections?.[0]?.selection_id,ref.revision_id);assert.equal(f.bridge.read(ref)?.eligible,false);
  const reopened=createLocalOpenAnalysisStore({projectRoot:f.root});assert.deepEqual(reopened.read(f.identity.task_id)?.history?.[0]?.delegation_selections,f.analysis.read(f.identity.task_id)?.history?.[0]?.delegation_selections);assert.equal(before.open_origin?.material_kind,'verified_bundle');
 }finally{await f.app.close();}
});


test('V13-AC04-SELECTION-FEEDBACK01: actual multi-material tool reports every action/count conflict before effects and allows one explicit correction',async()=>{
 const {createOpenAnalysisApplication}=await import('../../../packages/application/open-analysis.ts');
 const {createOpenAnalysisDelegation}=await import('../../../packages/application/open-analysis-delegation.ts');
 for(const repeat of [false,true]){
  const f=await fixture(true,{turn:async input=>({provider:'minimax-cn',model:'MiniMax-M3',cost_microunits:null,output:{kind:'result',summary:'所选核验资料限制',references:JSON.parse(input.payload).authorized_context.allowed_references,limitations:['MODEL'],unknowns:[]}})},'PRIVATE_ROOT',true);let selections=0,rounds=0;
  try{
   const source={...f.bridge,selectionOwner:(...args:Parameters<typeof f.bridge.selectionOwner>)=>{selections++;return f.bridge.selectionOwner(...args);}};
   const delegation=createOpenAnalysisDelegation({store:f.analysis,assistant:f.app,source,project_id:f.parent.source.owner.project_id}).root;
   const app=createOpenAnalysisApplication({agentLed:true,collaboration:delegation,loadSelectedSource:async()=>f.analysis.read(f.identity.task_id)!.source,isAuthorized:()=>true,verify:verifyOpenAnalysisIntegerSum,saveFramework:async()=>assert.fail('not a computation'),saveOutcome:async()=>assert.fail('not report acceptance'),saveClarification:async value=>({saved:true,...value.identity}),runtime:{run:async input=>{
    const call=(name:string,args:Record<string,unknown>={})=>input.tools.find(t=>t.name===name)!.execute(args,input.signal);
    if(++rounds>1){await call('ask_user',{text:'仅用于检查合法委派回流，未生成报告'});return {text:'controlled transport complete',tools:[]};}
    const catalog=await call('read_delegation_materials') as any[];
    const refs=catalog[0].instruction_contract.reference_paths.slice(0,7);
    const second=catalog[1].instruction_contract.reference_paths.slice(0,7);
    const bad={kind:'subagent',task:'PRIVATE_PURPOSE_MUST_NOT_LEAK',material_id:catalog[0].material_id,instruction:{action:'challenge',reference_paths:refs,completion_reference_paths:refs},additional_materials:[{material_id:catalog[1].material_id,instruction:{action:'check_consistency',reference_paths:second,completion_reference_paths:second}}]};
    const feedback=await call('delegate_analysis',bad) as any;
    assert.equal(feedback.status,'needs_instruction_correction');assert.equal(feedback.created,false);
    assert.deepEqual(feedback.diagnostic,{reason:'invalid_material_selection',issues:[{reason:'mixed_material_actions',argument_path:'/additional_materials/0/instruction/action',required_action:'challenge'},{reason:'reference_count_exceeded',argument_path:'/instruction/reference_paths',maximum:12,actual_count:14},{reason:'reference_count_exceeded',argument_path:'/instruction/completion_reference_paths',maximum:12,actual_count:14}]});
    assert.doesNotMatch(JSON.stringify(feedback),/PRIVATE_PURPOSE_MUST_NOT_LEAK|PRIVATE_ROOT/);assert.equal(selections,0);
    if(repeat){await assert.rejects(()=>call('delegate_analysis',bad),{code:'DELEGATION_CORRECTION_EXHAUSTED'});assert.equal(selections,0);return {text:'invalid correction denied',tools:[]};}
    const instruction={action:'challenge',reference_paths:['/calculation'],completion_reference_paths:['/calculation']};
    const result=await call('delegate_analysis',{...bad,instruction,additional_materials:[{material_id:catalog[1].material_id,instruction}]}) as any;
    assert.equal(result.state,'queued');assert.equal(result.selected_material_count,2);assert.equal(selections,1);return {text:'explicit valid correction only',tools:[]};
   }}});
   const run=()=>app.run({identity:f.identity,question:'检查已核验资料',signal:new AbortController().signal});
   if(repeat)await assert.rejects(run,{code:'DELEGATION_CORRECTION_EXHAUSTED'});else await run();
  }finally{await f.app.close();}
 }
});


test('V13-AC04-SELECTION-FEEDBACK02: invalid catalog index does not hide whole selection conflicts or change material authority',async()=>{
 const {createOpenAnalysisApplication}=await import('../../../packages/application/open-analysis.ts');
 const {createOpenAnalysisDelegation}=await import('../../../packages/application/open-analysis-delegation.ts');
 for(const repeat of [false,true]){
  const f=await fixture(true,{turn:async input=>({provider:'minimax-cn',model:'MiniMax-M3',cost_microunits:null,output:{kind:'result',summary:'所选核验资料限制',references:JSON.parse(input.payload).authorized_context.allowed_references,limitations:['MODEL'],unknowns:[]}})},'PRIVATE_ROOT',true);let selections=0,rounds=0;
  try{
   const source={...f.bridge,selectionOwner:(...args:Parameters<typeof f.bridge.selectionOwner>)=>{selections++;return f.bridge.selectionOwner(...args);}};
   const delegation=createOpenAnalysisDelegation({store:f.analysis,assistant:f.app,source,project_id:f.parent.source.owner.project_id}).root;
   const app=createOpenAnalysisApplication({agentLed:true,collaboration:delegation,loadSelectedSource:async()=>f.analysis.read(f.identity.task_id)!.source,isAuthorized:()=>true,verify:verifyOpenAnalysisIntegerSum,saveFramework:async()=>assert.fail('not a computation'),saveOutcome:async()=>assert.fail('not report acceptance'),saveClarification:async value=>({saved:true,...value.identity}),runtime:{run:async input=>{
    const call=(name:string,args:Record<string,unknown>={})=>input.tools.find(t=>t.name===name)!.execute(args,input.signal);
    if(++rounds>1){await call('ask_user',{text:'仅用于检查合法委派回流，未生成报告'});return {text:'controlled transport complete',tools:[]};}
    const catalog=await call('read_delegation_materials') as any[];
    const refs=[0,1,2,3,4,5,catalog[0].instruction_contract.reference_paths.length];
    const second=[0,1,2,3,4,5,6];
    const bad={kind:'subagent',task:'PRIVATE_PURPOSE_MUST_NOT_LEAK',material_id:catalog[0].material_id,instruction:{action:'challenge',reference_indices:refs,completion_reference_indices:[0]},additional_materials:[{material_id:catalog[1].material_id,instruction:{action:'check_consistency',reference_indices:second,completion_reference_indices:[0]}}]};
    const feedback=await call('delegate_analysis',bad) as any;
    assert.equal(feedback.status,'needs_instruction_correction');assert.equal(feedback.created,false);
    assert.deepEqual(feedback.diagnostic,{reason:'invalid_material_selection',issues:[{reason:'mixed_material_actions',argument_path:'/additional_materials/0/instruction/action',required_action:'challenge'},{reason:'reference_count_exceeded',argument_path:'/instruction/reference_indices',maximum:12,actual_count:14},{reason:'invalid_reference_index',argument_path:'/instruction/reference_indices/6',available_count:catalog[0].instruction_contract.reference_paths.length}]});
    assert.doesNotMatch(JSON.stringify(feedback),/PRIVATE_PURPOSE_MUST_NOT_LEAK|PRIVATE_ROOT/);assert.equal(selections,0);
    if(repeat){await assert.rejects(()=>call('delegate_analysis',bad),{code:'DELEGATION_CORRECTION_EXHAUSTED'});assert.equal(selections,0);return {text:'invalid correction denied',tools:[]};}
    const instruction={action:'challenge',reference_paths:['/calculation'],completion_reference_paths:['/calculation']};
    const result=await call('delegate_analysis',{...bad,instruction,additional_materials:[{material_id:catalog[1].material_id,instruction}]}) as any;
    assert.equal(result.state,'queued');assert.equal(result.selected_material_count,2);assert.equal(selections,1);return {text:'explicit valid correction only',tools:[]};
   }}});
   const run=()=>app.run({identity:f.identity,question:'检查已核验资料',signal:new AbortController().signal});
   if(repeat)await assert.rejects(run,{code:'DELEGATION_CORRECTION_EXHAUSTED'});else await run();
  }finally{await f.app.close();}
 }
});
test('V13-AC04-MATERIAL-LIST01 / AS04: root accepts explicit material list and common real paths through the same child consumer',async()=>{
 const {createOpenAnalysisApplication}=await import('../../../packages/application/open-analysis.ts');const {createOpenAnalysisDelegation}=await import('../../../packages/application/open-analysis-delegation.ts');const {createOpenAnalysisCollaborationRuntime}=await import('../../../adapters/agent-pi/open-analysis-collaboration.ts');
 let adapter:CaseAssistantRuntime,observed:Record<string,any>|null=null,rounds=0;
 const f=await fixture(true,{turn:input=>adapter.turn(input)},'PRIVATE_GOAL',true);
 try{
  const delegation=createOpenAnalysisDelegation({store:f.analysis,assistant:f.app,source:f.bridge,project_id:f.parent.source.owner.project_id});
  adapter=createOpenAnalysisCollaborationRuntime({authorizeSource:()=>true,collaboration:id=>delegation.child(id),runtime:{run:async input=>{const context=JSON.parse(input.prompt).authorized_context;observed=JSON.parse(context.aggregate.content);await input.tools.find(t=>t.name==='finish_result')!.execute({summary:'获准资料显示数量合计及记录数，不能推断原因',reference_indices:[0],limitations:['MODEL'],unknowns:[]},input.signal);return {text:'已完成所选比较',tools:[]};}}});
  const app=createOpenAnalysisApplication({agentLed:true,collaboration:delegation.root,loadSelectedSource:async()=>f.analysis.read(f.identity.task_id)!.source,isAuthorized:()=>true,verify:verifyOpenAnalysisIntegerSum,saveFramework:async()=>assert.fail('delegation needs no new calculation'),saveOutcome:async()=>assert.fail('this test is not report acceptance'),saveClarification:async value=>({saved:true,...value.identity}),runtime:{run:async input=>{
   rounds++;const tool=(name:string)=>input.tools.find(t=>t.name===name)!;
   if(rounds===1){const catalog=await tool('read_delegation_materials').execute({},input.signal) as any[];const path=catalog[0].instruction_contract.reference_paths[0];assert.ok(catalog[1].instruction_contract.reference_paths.includes(path));const instruction={action:'compare',reference_paths:[path],completion_reference_paths:[path]};const result=await tool('delegate_analysis').execute({kind:'subagent',task:'PRIVATE_PURPOSE',material_ids:[catalog[0].material_id,catalog[1].material_id],instruction},input.signal);assert.equal(Reflect.get(result as object,'state'),'queued');assert.deepEqual(Reflect.get(result as object,'selected_material_ids'),f.steps.slice(0,2));assert.equal(Reflect.get(result as object,'selected_material_count'),2);assert.equal(Reflect.get(result as object,'purpose_delivery'),'local_only');}
   else {const results=await tool('read_delegation_results').execute({},input.signal) as any[];assert.equal(results.length,1);assert.match(results[0].result.value.summary,/数量合计/);await tool('ask_user').execute({text:'还需要补充原因资料才能分析原因'},input.signal);}
   return {text:'依据实际返回意见保留原因资料缺口',tools:[]};
  }}});
  const result=await app.run({identity:f.identity,question:'比较数量合计和记录数的意义',signal:new AbortController().signal});assert.equal(result.state,'waiting');assert.equal(rounds,2);assert.ok(observed);assert.equal(Object.keys(Reflect.get(Object(observed),'materials')).length,2);assert.equal(Reflect.get(Object(observed),'materials')[f.steps[0]!].business_binding.inputs[0].fields[0].name,'数量');assert.doesNotMatch(JSON.stringify(observed),/PRIVATE_GOAL|PRIVATE_PURPOSE/);
 }finally{await f.app.close();}
});


test('V13-AC04-MATERIAL-LIST02 / AS04: descendant uses the same explicit material list and selected path subset',async()=>{
 const {createOpenAnalysisApplication}=await import('../../../packages/application/open-analysis.ts');const {createOpenAnalysisDelegation}=await import('../../../packages/application/open-analysis-delegation.ts');const {createOpenAnalysisCollaborationRuntime}=await import('../../../adapters/agent-pi/open-analysis-collaboration.ts');
 let adapter:CaseAssistantRuntime,observed:Record<string,any>|null=null,rounds=0,delegated=false;
 const f=await fixture(true,{turn:input=>adapter.turn(input)},'PRIVATE_GOAL',true);
 try{
  const delegation=createOpenAnalysisDelegation({store:f.analysis,assistant:f.app,source:f.bridge,project_id:f.parent.source.owner.project_id});
  adapter=createOpenAnalysisCollaborationRuntime({authorizeSource:()=>true,collaboration:id=>delegation.child(id),runtime:{run:async input=>{const context=JSON.parse(input.prompt).authorized_context;observed=JSON.parse(context.aggregate.content);if(!delegated){delegated=true;const catalog=await input.tools.find(t=>t.name==='read_delegation_materials')!.execute({},input.signal) as any[];const result=await input.tools.find(t=>t.name==='delegate_analysis')!.execute({kind:'subagent',task:'PRIVATE_GRANDCHILD',material_ids:catalog.map(m=>m.material_id),instruction:{action:'check_consistency',reference_paths:['/calculation'],completion_reference_paths:['/calculation']}},input.signal) as any;assert.equal(result.selected_material_count,2);return {text:'等待所选材料的独立复核',tools:[]};}await input.tools.find(t=>t.name==='finish_result')!.execute({summary:'获准资料显示数量合计及记录数，不能推断原因',reference_indices:[0],limitations:['MODEL'],unknowns:[]},input.signal);return {text:'已完成所选比较',tools:[]};}}});
  const app=createOpenAnalysisApplication({agentLed:true,collaboration:delegation.root,loadSelectedSource:async()=>f.analysis.read(f.identity.task_id)!.source,isAuthorized:()=>true,verify:verifyOpenAnalysisIntegerSum,saveFramework:async()=>assert.fail('delegation needs no new calculation'),saveOutcome:async()=>assert.fail('this test is not report acceptance'),saveClarification:async value=>({saved:true,...value.identity}),runtime:{run:async input=>{
   rounds++;const tool=(name:string)=>input.tools.find(t=>t.name===name)!;
   if(rounds===1){const catalog=await tool('read_delegation_materials').execute({},input.signal) as any[];const path=catalog[0].instruction_contract.reference_paths[0];assert.ok(catalog[1].instruction_contract.reference_paths.includes(path));const instruction={action:'compare',reference_paths:[path],completion_reference_paths:[path]};const result=await tool('delegate_analysis').execute({kind:'subagent',task:'PRIVATE_PURPOSE',material_ids:[catalog[0].material_id,catalog[1].material_id],instruction},input.signal);assert.equal(Reflect.get(result as object,'state'),'queued');assert.deepEqual(Reflect.get(result as object,'selected_material_ids'),f.steps.slice(0,2));assert.equal(Reflect.get(result as object,'selected_material_count'),2);assert.equal(Reflect.get(result as object,'purpose_delivery'),'local_only');}
   else {const results=await tool('read_delegation_results').execute({},input.signal) as any[];assert.equal(results.length,1);assert.match(results[0].result.value.summary,/数量合计/);await tool('ask_user').execute({text:'还需要补充原因资料才能分析原因'},input.signal);}
   return {text:'依据实际返回意见保留原因资料缺口',tools:[]};
  }}});
  const result=await app.run({identity:f.identity,question:'比较数量合计和记录数的意义',signal:new AbortController().signal});assert.equal(result.state,'waiting');assert.equal(rounds,2);assert.ok(observed);assert.equal(Object.keys(Reflect.get(Object(observed),'materials')).length,2);assert.equal(Reflect.get(Object(observed),'materials')[f.steps[0]!].business_binding.inputs[0].fields[0].name,'数量');assert.doesNotMatch(JSON.stringify(observed),/PRIVATE_GOAL|PRIVATE_PURPOSE/);
 }finally{await f.app.close();}
});




test('V13-AC04-MATERIAL-LIST03 / AC04: explicit list cannot mix formats, duplicate or acquire material, guess shared paths or evade the whole-selection cap',async()=>{
 const {createDelegationMaterialReferences,createOpenAnalysisDelegation}=await import('../../../packages/application/open-analysis-delegation.ts');const f=await fixture(true,null,'PRIVATE_GOAL',true);
 try{
  const delegation=createOpenAnalysisDelegation({store:f.analysis,assistant:f.app,source:f.bridge,project_id:f.parent.source.owner.project_id}),refs=createDelegationMaterialReferences(delegation.root,f.identity);
  const instruction={action:'compare',reference_paths:['/calculation'],completion_reference_paths:['/calculation']};
  assert.throws(()=>refs.resolveToolSelection({material_ids:['material:1'],instruction}),{code:'DELEGATION_CATALOG_REQUIRED'});const catalog=await refs.read(),ids=catalog.map(m=>m.material_id);
  const valid={material_ids:ids.slice(0,2),instruction};assert.equal(refs.resolveToolSelection(valid).additional_materials.length,1);
  for(const bad of [
   {...valid,material_id:ids[0]}, {...valid,additional_materials:[]}, {...valid,material_ids:[ids[0],ids[0]]},
   {...valid,material_ids:[ids[0],'material:999']}, {...valid,material_ids:[]},
   {...valid,instruction:{action:'compare',reference_indices:[0],completion_reference_indices:[0]}},
   {...valid,instruction:{...instruction,reference_paths:['/UNSELECTED']}},
   {...valid,instruction:{...instruction,completion_reference_paths:['/verification']}},
   {material_ids:ids,instruction:{action:'compare',reference_paths:catalog[0]!.instruction_contract!.reference_paths.slice(0,5),completion_reference_paths:['/calculation']}}
  ])assert.throws(()=>refs.resolveToolSelection(bad));
  for(const session of await f.app.list(f.parent.source.owner.project_id))assert.equal((await f.app.readParent(session.id)).children.length,0);assert.equal(f.analysis.read(f.identity.task_id)!.delegation_selections?.length??0,0);
 }finally{await f.app.close();}
});
test('V13-AC04-MATERIAL-LIST04 / AC04: descendant common completion references may select real fields inside parent-selected calculation objects',async()=>{
 const {createOpenAnalysisApplication}=await import('../../../packages/application/open-analysis.ts');const {createOpenAnalysisDelegation}=await import('../../../packages/application/open-analysis-delegation.ts');const {createOpenAnalysisCollaborationRuntime}=await import('../../../adapters/agent-pi/open-analysis-collaboration.ts');
 let adapter:CaseAssistantRuntime,observed:Record<string,any>|null=null,rounds=0,delegated=false;
 const f=await fixture(true,{turn:input=>adapter.turn(input)},'PRIVATE_GOAL',true);
 try{
  const delegation=createOpenAnalysisDelegation({store:f.analysis,assistant:f.app,source:f.bridge,project_id:f.parent.source.owner.project_id});
  adapter=createOpenAnalysisCollaborationRuntime({authorizeSource:()=>true,collaboration:id=>delegation.child(id),runtime:{run:async input=>{const context=JSON.parse(input.prompt).authorized_context;observed=JSON.parse(context.aggregate.content);if(!delegated){delegated=true;const catalog=await input.tools.find(t=>t.name==='read_delegation_materials')!.execute({},input.signal) as any[];const result=await input.tools.find(t=>t.name==='delegate_analysis')!.execute({kind:'subagent',task:'PRIVATE_GRANDCHILD',material_ids:catalog.map(m=>m.material_id),instruction:{action:'check_consistency',reference_paths:['/calculation'],completion_reference_paths:['/calculation/value']}},input.signal) as any;assert.equal(result.selected_material_count,2);return {text:'等待所选材料的独立复核',tools:[]};}await input.tools.find(t=>t.name==='finish_result')!.execute({summary:'获准资料显示数量合计及记录数，不能推断原因',reference_indices:[0],limitations:['MODEL'],unknowns:[]},input.signal);return {text:'已完成所选比较',tools:[]};}}});
  const app=createOpenAnalysisApplication({agentLed:true,collaboration:delegation.root,loadSelectedSource:async()=>f.analysis.read(f.identity.task_id)!.source,isAuthorized:()=>true,verify:verifyOpenAnalysisIntegerSum,saveFramework:async()=>assert.fail('delegation needs no new calculation'),saveOutcome:async()=>assert.fail('this test is not report acceptance'),saveClarification:async value=>({saved:true,...value.identity}),runtime:{run:async input=>{
   rounds++;const tool=(name:string)=>input.tools.find(t=>t.name===name)!;
   if(rounds===1){const catalog=await tool('read_delegation_materials').execute({},input.signal) as any[];const path=catalog[0].instruction_contract.reference_paths[0];assert.ok(catalog[1].instruction_contract.reference_paths.includes(path));const instruction={action:'compare',reference_paths:[path],completion_reference_paths:[path]};const result=await tool('delegate_analysis').execute({kind:'subagent',task:'PRIVATE_PURPOSE',material_ids:[catalog[0].material_id,catalog[1].material_id],instruction},input.signal);assert.equal(Reflect.get(result as object,'state'),'queued');assert.deepEqual(Reflect.get(result as object,'selected_material_ids'),f.steps.slice(0,2));assert.equal(Reflect.get(result as object,'selected_material_count'),2);assert.equal(Reflect.get(result as object,'purpose_delivery'),'local_only');}
   else {const results=await tool('read_delegation_results').execute({},input.signal) as any[];assert.equal(results.length,1);assert.match(results[0].result.value.summary,/数量合计/);await tool('ask_user').execute({text:'还需要补充原因资料才能分析原因'},input.signal);}
   return {text:'依据实际返回意见保留原因资料缺口',tools:[]};
  }}});
  const result=await app.run({identity:f.identity,question:'比较数量合计和记录数的意义',signal:new AbortController().signal});assert.equal(result.state,'waiting');assert.equal(rounds,2);assert.ok(observed);assert.equal(Object.keys(Reflect.get(Object(observed),'materials')).length,2);assert.equal(Reflect.get(Object(observed),'materials')[f.steps[0]!].business_binding.inputs[0].fields[0].name,'数量');assert.doesNotMatch(JSON.stringify(observed),/PRIVATE_GOAL|PRIVATE_PURPOSE/);
 }finally{await f.app.close();}
});






test('V13-AC04-MATERIAL-LIST05 / AC04: actual child catalog lists real descendants of selected objects and omits their unselected siblings',async()=>{
 const {createOpenAnalysisDelegation,createDelegationMaterialReferences}=await import('../../../packages/application/open-analysis-delegation.ts');const f=await fixture(true,null,'PRIVATE_ROOT',true);
 try{
  const delegation=createOpenAnalysisDelegation({store:f.analysis,assistant:f.app,source:f.bridge,project_id:f.parent.source.owner.project_id});
  const instruction={action:'compare' as const,reference_paths:['/calculation'],completion_reference_paths:['/calculation']};
  const queued=await delegation.root.queue(f.identity,{kind:'subagent',task:'PRIVATE_CHILD',material_id:f.steps[0]!,instruction,additional_materials:[{material_id:f.steps[1]!,instruction}]});
  const child=delegation.child(queued.child_id),refs=createDelegationMaterialReferences(child,f.identity),catalog=await refs.read();
  assert.equal(catalog.length,2);for(const material of catalog){assert.ok(material.instruction_contract!.reference_paths.includes('/calculation/value'),'real selected-object field must be discoverable');assert.ok(!material.instruction_contract!.reference_paths.includes('/framework'));assert.ok(!material.instruction_contract!.reference_paths.includes('/business_binding'));}
  const selection=refs.resolveToolSelection({material_ids:catalog.map(m=>m.material_id),instruction:{action:'check_consistency',reference_paths:['/calculation'],completion_reference_paths:['/calculation/value']}});
  const grand=await child.queue(f.identity,{kind:'subagent',task:'PRIVATE_GRAND',...selection}),grant=await f.app.prepareCollaboration(grand.child_id,(await f.app.readCollaboration(grand.child_id)).relation.task,[],[]);
  const context=JSON.parse(grant.payload),content=JSON.parse(context.aggregate.content);assert.equal(Object.keys(content.materials).length,2);assert.equal(content.materials[f.steps[0]!].calculation.value,'7');assert.equal(content.materials[f.steps[0]!].framework,undefined);
  for(const path of ['/framework','/calculation/UNKNOWN'])assert.throws(()=>refs.resolveToolSelection({material_ids:catalog.map(m=>m.material_id),instruction:{action:'check_consistency',reference_paths:[path],completion_reference_paths:[path]}}));
 }finally{await f.app.close();}
});


test('V13-AC04-LIST-FEEDBACK01: common-list correction exposes simultaneous missing paths and total bounds before effects, never auto-selects',async()=>{
 const {createOpenAnalysisApplication}=await import('../../../packages/application/open-analysis.ts');const {createOpenAnalysisDelegation}=await import('../../../packages/application/open-analysis-delegation.ts');
 for(const repeat of [false,true]){
 const f=await fixture(true,{turn:async input=>({provider:'minimax-cn',model:'MiniMax-M3',cost_microunits:null,output:{kind:'result',summary:'所选核验资料限制',references:JSON.parse(input.payload).authorized_context.allowed_references,limitations:['MODEL'],unknowns:[]}})},'PRIVATE_ROOT',true);let selections=0,rounds=0;
 try{const source={...f.bridge,selectionOwner:(...args:Parameters<typeof f.bridge.selectionOwner>)=>{selections++;return f.bridge.selectionOwner(...args);}},delegation=createOpenAnalysisDelegation({store:f.analysis,assistant:f.app,source,project_id:f.parent.source.owner.project_id}).root;
 const app=createOpenAnalysisApplication({agentLed:true,collaboration:delegation,loadSelectedSource:async()=>f.analysis.read(f.identity.task_id)!.source,isAuthorized:()=>true,verify:verifyOpenAnalysisIntegerSum,saveFramework:async()=>assert.fail('not a new computation'),saveOutcome:async()=>assert.fail('not report acceptance'),saveClarification:async value=>({saved:true,...value.identity}),runtime:{run:async input=>{
 const call=(name:string,args:Record<string,unknown>={})=>input.tools.find(t=>t.name===name)!.execute(args,input.signal);
 if(++rounds>1){await call('ask_user',{text:'仅检查实际委派回流，不代表报告完成'});return {text:'controlled transport complete',tools:[]};}
 const catalog=await call('read_delegation_materials') as any[],ids=catalog.slice(0,2).map(m=>m.material_id);
 const paths=['/calculation','/verification','/framework','/revision','/calculation/value','/verification/grade','/framework/MISSING'];
 const bad={kind:'subagent',task:'PRIVATE_PURPOSE',material_ids:ids,instruction:{action:'challenge',reference_paths:paths,completion_reference_paths:paths}};
 const feedback=await call('delegate_analysis',bad) as any;assert.equal(feedback.status,'needs_instruction_correction');assert.equal(feedback.created,false);assert.equal(selections,0);
 const diagnostic=feedback.diagnostic;assert.equal(diagnostic.reason,'invalid_material_selection');
 for(const field of ['reference_paths','completion_reference_paths']){assert.ok(diagnostic.issues.some((issue:any)=>issue.reason==='reference_count_exceeded'&&issue.argument_path==='/instruction/'+field&&issue.maximum===12&&issue.actual_count===14));assert.ok(diagnostic.issues.some((issue:any)=>issue.reason==='reference_path_not_found'&&issue.argument_path==='/instruction/'+field+'/6'));}
 const common=catalog[0].instruction_contract.reference_paths.filter((path:string)=>catalog.slice(0,2).every(m=>m.instruction_contract.reference_paths.includes(path)));assert.deepEqual(diagnostic.common_reference_paths,common);assert.equal(diagnostic.maximum_references_per_material,6);assert.doesNotMatch(JSON.stringify(feedback),/PRIVATE_ROOT|PRIVATE_PURPOSE/);
 if(repeat){await assert.rejects(()=>call('delegate_analysis',bad),{code:'DELEGATION_CORRECTION_EXHAUSTED'});assert.equal(selections,0);return {text:'invalid correction rejected',tools:[]};}
 const instruction={action:'challenge',reference_paths:['/calculation','/verification'],completion_reference_paths:['/calculation/value','/verification/grade']};
 const result=await call('delegate_analysis',{...bad,instruction}) as any;assert.equal(result.state,'queued');assert.equal(result.selected_material_count,2);assert.equal(selections,1);return {text:'model explicitly chose legal correction',tools:[]};
 }}});const run=()=>app.run({identity:f.identity,question:'检查实际已核验材料',signal:new AbortController().signal});if(repeat)await assert.rejects(run,{code:'DELEGATION_CORRECTION_EXHAUSTED'});else await run();
 }finally{await f.app.close();}
 }
});


for(const repeat of [false,true])test('V13-DELEGATION-CORRECTION02 '+(repeat?'repeat denied':'two independent instructions corrected')+': a successful queue resolves only the pending instruction',async()=>{
 const {createOpenAnalysisApplication}=await import('../../../packages/application/open-analysis.ts');const {createOpenAnalysisDelegation}=await import('../../../packages/application/open-analysis-delegation.ts');
 const f=await fixture(true,{turn:async input=>({provider:'minimax-cn',model:'MiniMax-M3',cost_microunits:null,output:{kind:'result',summary:'Actual selected evidence opinion',references:JSON.parse(input.payload).authorized_context.allowed_references,limitations:['MODEL'],unknowns:[]}})},'PRIVATE_ROOT',true);let selections=0,rounds=0;
 try{const source={...f.bridge,selectionOwner:(...args:Parameters<typeof f.bridge.selectionOwner>)=>{selections++;return f.bridge.selectionOwner(...args);}},delegation=createOpenAnalysisDelegation({store:f.analysis,assistant:f.app,source,project_id:f.parent.source.owner.project_id}).root;
 const app=createOpenAnalysisApplication({agentLed:true,collaboration:delegation,loadSelectedSource:async()=>f.analysis.read(f.identity.task_id)!.source,isAuthorized:()=>true,verify:verifyOpenAnalysisIntegerSum,saveFramework:async()=>assert.fail('not a computation'),saveOutcome:async()=>assert.fail('not report acceptance'),saveClarification:async value=>({saved:true,...value.identity}),runtime:{run:async input=>{
 const call=(name:string,args:Record<string,unknown>={})=>input.tools.find(t=>t.name===name)!.execute(args,input.signal);
 if(++rounds>1){const results:any[]=await call('read_delegation_results') as any[];assert.equal(results.filter(r=>r.result).length,2);await call('ask_user',{text:'Controlled returned opinions, not a report'});return {text:'observed',tools:[]};}
 const catalog=await call('read_delegation_materials') as any[];
 for(let n=0;n<2;n++){const bad={kind:'subagent',task:n?'Check count applicability':'Explain total limitations',material_ids:[catalog[n].material_id],instruction:{action:n?'challenge':'explain',reference_paths:['/MISSING'],completion_reference_paths:['/MISSING']}};
 const feedback:any=await call('delegate_analysis',bad);assert.equal(feedback.status,'needs_instruction_correction');assert.equal(feedback.created,false);assert.equal(selections,n);
 if(n===1&&repeat){await assert.rejects(()=>call('delegate_analysis',bad),{code:'DELEGATION_CORRECTION_EXHAUSTED'});assert.equal(selections,1);return {text:'not accepted',tools:[]};}
 const accepted:any=await call('delegate_analysis',{...bad,instruction:{action:bad.instruction.action,reference_paths:['/calculation'],completion_reference_paths:['/calculation']}});assert.equal(accepted.state,'queued');assert.equal(selections,n+1);}
 return {text:'explicit submissions',tools:[]};
 }}});const run=()=>app.run({identity:f.identity,question:'Review selected evidence',signal:new AbortController().signal});if(repeat)await assert.rejects(run,{code:'DELEGATION_CORRECTION_EXHAUSTED'});else await run();
 }finally{await f.app.close();}
});

// User approved bounded business subquestions, not forwarding the local private purpose.
test('V13-BUSINESS-HANDOFF01 / AC04: child and grandchild receive explicit scoped questions without private root/history and disk readback preserves them',async()=>{
 const payloads:string[]=[];
 const f=await fixture(true,{turn:async input=>{payloads.push(input.payload);const context=JSON.parse(input.payload).authorized_context;return {provider:'minimax-cn',model:'MiniMax-M3',cost_microunits:null,output:{kind:'result',summary:'数量来自所选资料，不能据此推断业务原因',references:context.allowed_references,limitations:['MODEL'],unknowns:[]}};}},'ROOT_PRIVATE_GOAL_SENTINEL');
 try{
  const instruction={version:'1.0' as const,action:'explain' as const,reference_paths:['/calculation','/verification'],completion_reference_paths:['/calculation'],private_purpose:'PRIVATE_LOCAL_PURPOSE_SENTINEL',business_question:'所选资料数量合计是否能支持当前业务判断？'};
  const child=await f.app.queueChild(f.parent.session.id,'subagent',instruction.private_purpose,[],[f.outcome_id],true,randomUUID(),instruction);
  const grant=await f.app.prepareCollaboration(child.session.id,child.relation.task,[],[]);
  assert.equal(JSON.parse(grant.payload).business_question,instruction.business_question);
  assert.ok(JSON.parse(grant.payload).initial_text.includes(instruction.business_question));assert.equal(/PRIVATE_|ROOT_PRIVATE/.test(grant.payload),false);
  await f.app.start(child.session.id,grant.id,true);await f.app.waitForIdle(child.session.id,new AbortController().signal);
  assert.ok(payloads[0]!.includes(instruction.business_question),'the actual model boundary consumes the specific question');
  const next={...instruction,action:'challenge' as const,reference_paths:['/verification'],completion_reference_paths:['/verification'],private_purpose:'PRIVATE_GRAND_LOCAL_SENTINEL',business_question:'此核验覆盖是否足以支持业务因果结论？'};
  const grand=await f.app.queueChild(child.session.id,'subagent',next.private_purpose,[],[f.outcome_id],true,randomUUID(),next);
  const grant2=await f.app.prepareCollaboration(grand.session.id,grand.relation.task,[],[]);assert.equal(JSON.parse(grant2.payload).business_question,next.business_question);assert.equal(/PRIVATE_|ROOT_PRIVATE/.test(grant2.payload),false);
  await f.app.start(grand.session.id,grant2.id,true);await f.app.waitForIdle(grand.session.id,new AbortController().signal);
  assert.ok(payloads[1]!.includes(next.business_question));
  const reopened=createLocalCaseAssistantStore(f.options);assert.deepEqual((await reopened.readChild(grand.session.id))?.automatic_instruction,next);
 }finally{await f.app.close();}
});

test('V13-BUSINESS-HANDOFF02 / AC04/06: question does not forward private text, widen selected materials, hide repeated ancestor work or bypass stale/stopped authority',async()=>{
 const {createOpenAnalysisDelegation}=await import('../../../packages/application/open-analysis-delegation.ts');
 const f=await fixture(true,null,'ROOT_PRIVATE_GOAL_SENTINEL',true);
 try{
  const delegation=createOpenAnalysisDelegation({store:f.analysis,assistant:f.app,source:f.bridge,project_id:f.parent.source.owner.project_id});
  const request={kind:'subagent' as const,task:'PRIVATE_LOCAL_PURPOSE_SENTINEL',business_question:'核验结果能支持所选数量的业务解读吗？',material_id:f.steps[0]!,instruction:{action:'explain' as const,reference_paths:['/calculation','/verification'],completion_reference_paths:['/verification']}};
  for(const business_question of ['','  ',request.task,'ROOT_PRIVATE_GOAL_SENTINEL'])await assert.rejects(()=>delegation.root.queue(f.identity,{...request,business_question}),{code:'DELEGATION_INSTRUCTION_INVALID'});
  await assert.rejects(()=>delegation.root.queue(f.identity,{...request,material_id:randomUUID()}),{code:'RESULT_OUTSIDE_AUTHORIZATION'});
  const child=await delegation.root.queue(f.identity,request);const state=await f.app.readCollaboration(child.child_id);
  assert.equal(state.relation.automatic_instruction?.business_question,request.business_question);
  const inherited=delegation.child(child.child_id);
  const grandRequest={...request,business_question:'另一个措辞也不能重复同样祖先工作',instruction:{...request.instruction,action:'challenge' as const,reference_paths:['/verification'],completion_reference_paths:['/verification']}};
  await assert.rejects(()=>inherited.queue(f.identity,{...request,business_question:'换措辞重复同样材料和方法'}),{code:'REPEATED_DELEGATION'});
  await assert.rejects(()=>inherited.queue(f.identity,{...grandRequest,material_id:f.steps[1]!}),{code:'RESULT_OUTSIDE_AUTHORIZATION'});
  await assert.rejects(()=>inherited.queue({...f.identity,run_id:randomUUID()},grandRequest),{code:'AUTHORIZATION_STALE'});
  const grand=await inherited.queue(f.identity,grandRequest);assert.ok(grand.child_id);
  await f.app.closeSession(child.child_id,true);
  await assert.rejects(()=>inherited.queue(f.identity,{...grandRequest,business_question:'已停止，不发起新任务'}));
  assert.equal((await f.app.readParent(child.child_id)).children.length,1,'invalid, widening, stale and stopped requests create no additional task');
 }finally{await f.app.close();}
});

test('V13-BUSINESS-HANDOFF03 / AC04: real root Application tool delivers its separate question, then consumes the returned scoped opinion',async()=>{
 const {createOpenAnalysisApplication}=await import('../../../packages/application/open-analysis.ts');const {createOpenAnalysisDelegation}=await import('../../../packages/application/open-analysis-delegation.ts');
 const question='所选数量汇总对业务判断有哪些限制？';let rounds=0,seen=false,consumed=false;
 const f=await fixture(true,{turn:async input=>{const context=JSON.parse(input.payload).authorized_context;assert.equal(context.business_question,question);assert.equal(/PRIVATE_/.test(input.payload),false);seen=true;return {provider:'minimax-cn',model:'MiniMax-M3',cost_microunits:null,output:{kind:'result',summary:'数量合计有来源，不能单凭数量推断原因',references:context.allowed_references,limitations:['MODEL'],unknowns:[]}};}},'PRIVATE_ROOT_TEXT',true);
 try{
 const delegation=createOpenAnalysisDelegation({store:f.analysis,assistant:f.app,source:f.bridge,project_id:f.parent.source.owner.project_id}).root;
 const app=createOpenAnalysisApplication({agentLed:true,collaboration:delegation,loadSelectedSource:async()=>f.analysis.read(f.identity.task_id)!.source,isAuthorized:()=>true,verify:verifyOpenAnalysisIntegerSum,saveFramework:async()=>assert.fail('not needed'),saveOutcome:async()=>assert.fail('not a report proof'),saveClarification:async value=>({saved:true,...value.identity}),runtime:{run:async input=>{
  const call=(name:string,args:Record<string,unknown>={})=>input.tools.find(t=>t.name===name)!.execute(args,input.signal);
  if(++rounds===1){const catalog=await call('read_delegation_materials') as any[];const receipt:any=await call('delegate_analysis',{kind:'subagent',task:'PRIVATE_LOCAL_ONLY',business_question:question,material_ids:[catalog[0].material_id],instruction:{action:'explain',reference_paths:['/calculation','/verification'],completion_reference_paths:['/verification']}});assert.equal(receipt.purpose_delivery,'bounded_business_question');return {text:'queued',tools:[]};}
  const results=await call('read_delegation_results') as any[];assert.ok(results.some(r=>r.result.value.summary.includes('不能单凭数量')));consumed=true;await call('ask_user',{text:'fixture boundary ends here; not a production question'});return {text:'observed',tools:[]};
 }}});
 await app.run({identity:f.identity,question:'PRIVATE_ROOT_TEXT',signal:new AbortController().signal});assert.equal(seen,true);assert.equal(consumed,true);
 }finally{await f.app.close();}
});


test('V13-AC04-GUIDANCE01: catalog advises executable multi-material paths while retaining legacy index selection',async()=>{
 const {createOpenAnalysisDelegation,createDelegationMaterialReferences}=await import('../../../packages/application/open-analysis-delegation.ts');
 const f=await fixture(true,null,'数量范围',true);
 try{
  const delegation=createOpenAnalysisDelegation({store:f.analysis,assistant:f.app,source:f.bridge,project_id:f.parent.source.owner.project_id});
  const references=createDelegationMaterialReferences(delegation.root,f.identity),catalog=await references.read();
  const guidance=Reflect.get(catalog[0]!.instruction_contract!,'index_selection');
  assert.match(guidance,/material_ids.*reference_paths/,'multi-material consumers must not be directed toward an invalid index-only instruction');
  const valid=references.resolveToolSelection({material_ids:catalog.slice(0,2).map(m=>m.material_id),instruction:{action:'challenge',reference_paths:['/calculation'],completion_reference_paths:['/calculation']}});
  assert.equal(valid.additional_materials.length,1);
  assert.throws(()=>references.resolveToolSelection({material_ids:catalog.slice(0,2).map(m=>m.material_id),instruction:{action:'challenge',reference_indices:[0],completion_reference_indices:[0]}}),{code:'DELEGATION_INSTRUCTION_INVALID'});
  assert.doesNotThrow(()=>references.resolveToolSelection({material_id:catalog[0]!.material_id,instruction:{action:'challenge',reference_indices:[0],completion_reference_indices:[0]}}));
 }finally{await f.app.close();}
});


test('V13-FINISH-YIELD01: actual native child finishes once and returns without another physical model request',async()=>{
 const {createOpenAnalysisDelegation}=await import('../../../packages/application/open-analysis-delegation.ts');
 const {createOpenAnalysisCollaborationRuntime}=await import('../../../adapters/agent-pi/open-analysis-collaboration.ts');
 const {createPiSessionOpenAnalysisRuntime}=await import('../../../adapters/agent-pi/native-open-analysis.ts');
 const {createApprovedProviderCredentials}=await import('../../../adapters/agent-pi/provider-credentials.ts');
 const {createLocalAnalysisRequestLedger}=await import('../../../adapters/storage-local/analysis-request-ledger.ts');
 for(const duplicate of [false,true]){
 let childRuntime:CaseAssistantRuntime,calls=0;
 const f=await fixture(true,{turn:input=>childRuntime.turn(input)},'qualified opinion',true);
 try{
  const delegation=createOpenAnalysisDelegation({store:f.analysis,assistant:f.app,source:f.bridge,project_id:f.parent.source.owner.project_id});
  const ledger=createLocalAnalysisRequestLedger({projectRoot:f.root});
  const native=createPiSessionOpenAnalysisRuntime({projectRoot:f.root,ledger,credentials:createApprovedProviderCredentials({environment:{}}),modelTransport:async()=>{
   if(++calls!==1)throw Object.assign(new Error('UNEXPECTED_POST_RESULT_MODEL_CALL'),{code:'UNEXPECTED_POST_RESULT_MODEL_CALL'});
   return {content:(duplicate?[0,1]:[0]).map(i=>({kind:'tool' as const,id:'finish-'+i,name:'analysis_tool',arguments:{name:'finish_result',arguments_json:JSON.stringify({summary:i?'Do not overwrite the accepted opinion':'Selected calculation gives7; no reason can be inferred',reference_indices:[0],limitations:['MODEL'],unknowns:[]})}})),stop:'tools' as const,usage:{inputTokens:4,outputTokens:2}};
  }});
  childRuntime=createOpenAnalysisCollaborationRuntime({runtime:native,authorizeSource:()=>true,collaboration:id=>delegation.child(id)});
  const child=await delegation.root.queue(f.identity,{kind:'subagent',task:'local purpose',business_question:'What does the selected quantity support?',material_id:f.steps[0]!,instruction:{action:'explain',reference_paths:['/calculation'],completion_reference_paths:['/calculation']}});
  await delegation.root.drain(f.identity,new AbortController().signal);
  assert.equal(calls,1,'finish_result must close the turn before another model request');
  const state=await f.app.readCollaboration(child.child_id);
  assert.equal(state.attempts.at(-1)?.status,'Succeeded');
  assert.equal(ledger.pending!().length,0);
  const returned:readonly any[]=await delegation.root.results(f.identity);assert.equal(returned.length,1);assert.equal(returned[0].result.value.summary,'Selected calculation gives7; no reason can be inferred');
 }finally{await f.app.close();}
 }
});


for(const nested of [false,true])test(`V13-CONTEXT114: ${nested?'child':'root'} receives complete returned opinion without repeated source body, preserving durable receipt`,async()=>{
 const {createOpenAnalysisDelegation}=await import('../../../packages/application/open-analysis-delegation.ts');
 const {createPiSessionOpenAnalysisRuntime}=await import('../../../adapters/agent-pi/native-open-analysis.ts');
 const {createApprovedProviderCredentials}=await import('../../../adapters/agent-pi/provider-credentials.ts');
 const {createLocalAnalysisRequestLedger}=await import('../../../adapters/storage-local/analysis-request-ledger.ts');
 const f=await fixture(true,{turn:async input=>{const p=JSON.parse(input.payload);return {provider:input.provider,model:input.model,cost_microunits:null,output:{kind:'result',summary:'实际数量7；原因没有资料支持',references:[p.authorized_context.allowed_references[0]],limitations:['仅检查明确选定的计算'],unknowns:['原因未知']}};}},'受控意见',true);
 try{
  const delegation=createOpenAnalysisDelegation({store:f.analysis,assistant:f.app,source:f.bridge,project_id:f.parent.source.owner.project_id});
  const first=await delegation.root.queue(f.identity,{kind:'subagent',task:'local',material_id:f.steps[0]!,instruction:{action:'explain',reference_paths:['/calculation'],completion_reference_paths:['/calculation']}});
  await delegation.root.drain(f.identity,new AbortController().signal);
  const firstState=await f.app.readCollaboration(first.child_id);
  let consumer=delegation.root,parent=firstState.relation.parent_session_id;
  if(nested){consumer=delegation.child(first.child_id);await consumer.queue(f.identity,{kind:'subagent',task:'distinct local check',material_id:f.steps[0]!,instruction:{action:'check_limitations',reference_paths:['/calculation/value'],completion_reference_paths:['/calculation/value']}});await consumer.drain(f.identity,new AbortController().signal);parent=first.child_id;}
  const original=await f.app.returnedResults(parent);assert.equal(original.length,1);assert.ok(original[0]!.result.source.aggregate!.content.length>0);
  const before=structuredClone(original),projected:readonly any[]=await consumer.results(f.identity);
  assert.equal(projected.length,1);
  assert.equal(Object.hasOwn(projected[0].result.source.aggregate,'content'),false,'model return must not repeat the material snapshot');
  assert.equal(projected[0].source_body,'omitted_from_model_view');
  assert.deepEqual(projected[0].result.value,original[0]!.result.value);
  assert.equal(projected[0].result.sha256,original[0]!.result.sha256);
  assert.equal(projected[0].result.source.aggregate.sha256,original[0]!.result.source.aggregate!.sha256);
  assert.deepEqual(await f.app.returnedResults(parent),before,'persisted full source and result remain unchanged');
  const ledger=createLocalAnalysisRequestLedger({projectRoot:f.root});let calls=0,observed=false;
  const native=createPiSessionOpenAnalysisRuntime({projectRoot:f.root,ledger,credentials:createApprovedProviderCredentials({environment:{}}),modelTransport:async request=>{
   if(++calls===1)return {content:[{kind:'tool',id:'read-opinion',name:'analysis_tool',arguments:{name:'read_delegation_results',arguments_json:'{}'}}],stop:'tools',usage:{inputTokens:4,outputTokens:2}};
   const result=request.messages.findLast(m=>m.role==='tool'&&m.toolName==='analysis_tool');assert.ok(result);const view=JSON.parse(result.text)[0];assert.deepEqual(view.result.value,before[0]!.result.value);assert.equal(Object.hasOwn(view.result.source.aggregate,'content'),false);observed=true;return {content:[{kind:'text',text:'实际读取意见及限制，数量7，原因未知'}],stop:'complete',usage:{inputTokens:4,outputTokens:2}};
  }});
  await native.run({identity:{...f.identity,task_id:randomUUID()},prompt:'读取合法意见',system:'依据意见继续判断',signal:new AbortController().signal,authorize:()=>true,tools:[{name:'read_delegation_results',description:'读取合法意见',parameters:{type:'object',properties:{},additionalProperties:false},execute:()=>consumer.results(f.identity)}]});
  assert.equal(observed,true);assert.equal(calls,2);assert.equal(ledger.pending!().length,0);
  await assert.rejects(()=>consumer.results({...f.identity,run_id:randomUUID()}),{code:'AUTHORIZATION_STALE'});
 }finally{await f.app.close();}
});


test('V13-SNAPSHOT125 / AS04/RT04: bundle authorization takes one fresh validated task snapshot and observes stop and revision changes',async()=>{
 const f=await fixture(true,null,'核对数量与限制',true,true);
 try{
  const ref=f.bridge.selectionOwner(f.identity.task_id,f.steps.slice(0,2)),expected=f.bridge.read(ref)!;let reads=0;
  const measured={...f.analysis,read(id:string){reads++;return f.analysis.read(id);}};
  const source=createOpenAnalysisCollaborationSource({project_id:ref.project_id,store:measured,allowQualifiedSteps:true});
  const first=source.read(ref)!;assert.deepEqual(first,expected);assert.equal(reads,1,'one current validated snapshot per material bundle, not repeated historical copies');
  assert.equal(first.eligible,true);assert.equal(first.aggregate.content.includes('PRIVATE_RAW_ROW'),false);assert.deepEqual(Object.keys(JSON.parse(first.aggregate.content).materials).sort(),f.steps.slice(0,2).sort());
  reads=0;assert.equal(source.read({...ref,project_id:randomUUID()}),null);assert.equal(reads,0);
  f.analysis.stop(f.identity.task_id);reads=0;assert.equal(source.read(ref)?.eligible,false,'a later stop is not cached away');assert.equal(reads,1);
  f.analysis.finish(f.lease,'stopped');
  f.analysis.revise(f.identity.task_id,{command_id:randomUUID(),expected_revision:'1',question:'新的范围',preferences:{skill:'general',prompt:'brief'},identity:{...f.identity,revision:'2',run_id:randomUUID(),attempt_id:randomUUID(),operation_id:randomUUID()}});
  reads=0;assert.equal(source.read(ref)?.eligible??false,false,'old bundle cannot acquire new revision authority');assert.equal(reads,1);
 }finally{await f.app.close();}
});

test('V13-VIEW128 / AS04: explicitly selected actual material view becomes an exact old instruction without changing source or widening child scope',async()=>{
 const {createOpenAnalysisDelegation,createDelegationMaterialReferences}=await import('../../../packages/application/open-analysis-delegation.ts');const f=await fixture(true,null,'PRIVATE_ROOT',true);
 try{const delegation=createOpenAnalysisDelegation({store:f.analysis,assistant:f.app,source:f.bridge,project_id:f.parent.source.owner.project_id});const refs=createDelegationMaterialReferences(delegation.root,f.identity);
 const before=f.analysis.read(f.identity.task_id),catalog=await refs.read();const view=Reflect.get(catalog[0]!,'views')?.find((v:any)=>v.reference_paths.includes('/calculation'));
 assert.ok(view,'actual qualified calculation must expose a selectable source-bound view');assert.equal(view.value_kind,'object');assert.ok(view.fields.includes('value'));assert.match(view.view_ref,/^view:[a-f0-9]{64}$/);
 const input={view_refs:[view.view_ref],action:'challenge'};await refs.validateViewSelection(input);const selected=refs.resolveToolSelection(input);
 assert.deepEqual(selected,{material_id:f.steps[0],instruction:{action:'challenge',reference_paths:['/calculation'],completion_reference_paths:['/calculation']},additional_materials:[]});
 assert.deepEqual(f.analysis.read(f.identity.task_id),before,'catalog and selection validation are read-only');const queued=await delegation.root.queue(f.identity,{kind:'subagent',task:'PRIVATE_CHILD',business_question:'检查所选数量摘要是否支持比较',...selected});
 const relation=await f.app.readCollaboration(queued.child_id);assert.deepEqual(relation.relation.automatic_instruction!.reference_paths,['/materials/'+f.steps[0]+'/calculation']);
 const childRefs=createDelegationMaterialReferences(delegation.child(queued.child_id),f.identity),childCatalog=await childRefs.read();assert.equal(childCatalog.length,1);for(const childView of Reflect.get(childCatalog[0]!,'views'))assert.ok(childView.reference_paths.every((p:string)=>p==='/calculation'||p.startsWith('/calculation/')));
 assert.doesNotMatch(JSON.stringify(Reflect.get(childCatalog[0]!,'views')),/PRIVATE_ROOT|PRIVATE_CHILD|PRIVATE_RAW_ROW|PRIVATE_UNSELECTED_HEADER|\/framework/);
 }finally{await f.app.close();}
});

for(const scenario of ['stale','unknown','foreign-task','duplicate','mixed','changed-path','too-many','revoked'])test('V13-VIEW128 / RT06 boundary '+scenario+': rejected before any child effect with original history retained',async()=>{
 const {createOpenAnalysisDelegation,createDelegationMaterialReferences}=await import('../../../packages/application/open-analysis-delegation.ts');const f=await fixture(true,null,'PRIVATE_ROOT',true,true);let effects=0;
 try{const real=createOpenAnalysisDelegation({store:f.analysis,assistant:f.app,source:f.bridge,project_id:f.parent.source.owner.project_id}).root;let stale=false;
 const guarded={...real,materials:async(id:Parameters<typeof real.materials>[0])=>{const m=await real.materials(id);return stale?m.map(x=>({...x,instruction_contract:{...x.instruction_contract!,views:x.instruction_contract!.views!.map(v=>({...v,projection_sha256:'0'.repeat(64)}))}})):m;},queue:async(...args:Parameters<typeof real.queue>)=>{effects++;return real.queue(...args);}};
 const refs=createDelegationMaterialReferences(guarded,f.identity),catalog=await refs.read();const view=Reflect.get(catalog[0]!,'views').find((v:any)=>v.reference_paths.includes('/calculation'));
 assert.ok(view);const original=structuredClone(view),choice:any={action:'challenge',view_refs:[view.view_ref]};const mutablePaths=[...view.reference_paths];Reflect.set(view,'reference_paths',mutablePaths);mutablePaths.push('/framework/PRIVATE');await refs.validateViewSelection(choice);assert.deepEqual(refs.resolveToolSelection(choice).instruction.reference_paths,original.reference_paths,'returned catalog mutation cannot widen registry');
 let expected='DELEGATION_INSTRUCTION_INVALID';
 if(scenario==='stale'){stale=true;expected='AUTHORIZATION_STALE';}
 if(scenario==='unknown')choice.view_refs=['view:'+'f'.repeat(64)];
 if(scenario==='foreign-task'){const other=createDelegationMaterialReferences(guarded,{...f.identity,run_id:randomUUID()});await assert.rejects(()=>other.read(),{code:'AUTHORIZATION_STALE'});choice.view_refs=['view:'+'e'.repeat(64)];}
 if(scenario==='duplicate')choice.view_refs=[view.view_ref,view.view_ref];
 if(scenario==='mixed')choice.material_ids=[catalog[0]!.material_id];
 if(scenario==='changed-path')choice.instruction={action:'challenge',reference_paths:['/framework'],completion_reference_paths:['/framework']};
 if(scenario==='too-many')choice.view_refs=Array.from({length:13},(_,i)=>'view:'+i.toString(16).padStart(64,'0'));
 if(scenario==='revoked'){f.analysis.stop(f.identity.task_id);expected='AUTHORITY_REQUIRED';}
 const before=f.analysis.read(f.identity.task_id);await assert.rejects(async()=>{await refs.validateViewSelection(choice);const selected=refs.resolveToolSelection(choice);await guarded.queue(f.identity,{kind:'subagent',task:'local purpose',...selected});},{code:expected});assert.equal(effects,0);assert.deepEqual(f.analysis.read(f.identity.task_id),before);
 }finally{await f.app.close();}
});

test('V13-VIEW128 / RT06: fresh view validation cannot bypass authority revoked while material catalog is awaited',async()=>{
 const {createOpenAnalysisApplication}=await import('../../../packages/application/open-analysis.ts');const {createOpenAnalysisDelegation}=await import('../../../packages/application/open-analysis-delegation.ts');
 const f=await fixture(true,null,'PRIVATE_ROOT',true,true);let allowed=true,selections=0,reads=0;
 try{const real=createOpenAnalysisDelegation({store:f.analysis,assistant:f.app,source:f.bridge,project_id:f.parent.source.owner.project_id}).root;
 const collaboration={...real,materials:async(id:Parameters<typeof real.materials>[0])=>{const m=await real.materials(id);if(++reads===2)allowed=false;return m;},queue:async(...args:Parameters<typeof real.queue>)=>{selections++;return real.queue(...args);}};
 const app=createOpenAnalysisApplication({agentLed:true,collaboration,loadSelectedSource:async()=>f.analysis.read(f.identity.task_id)!.source,isAuthorized:()=>allowed,verify:verifyOpenAnalysisIntegerSum,saveFramework:async()=>assert.fail('not a computation'),saveOutcome:async()=>assert.fail('not a report'),runtime:{run:async input=>{
 const call=(name:string,args:Record<string,unknown>={})=>input.tools.find(t=>t.name===name)!.execute(args,input.signal),catalog=await call('read_delegation_materials') as any[],view=catalog[0].views.find((v:any)=>v.reference_paths.includes('/calculation'));
 await call('delegate_analysis',{kind:'subagent',task:'private purpose',action:'challenge',view_refs:[view.view_ref]});assert.fail('revocation must end this operation');
 }}});
 await assert.rejects(()=>app.run({identity:f.identity,question:'检查现有摘要',signal:new AbortController().signal}),{code:'AUTHORITY_REQUIRED'});assert.equal(selections,0);assert.equal(reads,2);
 }finally{await f.app.close();}
});

test('V13-VIEW128 / RT06: nine explicit materials stay outside the original eight-material boundary',async()=>{
 const {createOpenAnalysisDelegation,createDelegationMaterialReferences}=await import('../../../packages/application/open-analysis-delegation.ts');const f=await fixture(true,null,'PRIVATE_ROOT',true);
 try{const real=createOpenAnalysisDelegation({store:f.analysis,assistant:f.app,source:f.bridge,project_id:f.parent.source.owner.project_id}).root,actual=(await real.materials(f.identity))[0]!;
 const catalog=Array.from({length:9},()=>({...actual,material_id:randomUUID()})),refs=createDelegationMaterialReferences({...real,materials:async()=>catalog},f.identity),views=await refs.read();
 const selected=views.map(m=>Reflect.get(m,'views').find((v:any)=>v.reference_paths.includes('/calculation'))!.view_ref);
 await assert.rejects(()=>refs.validateViewSelection({action:'challenge',view_refs:selected}),{code:'DELEGATION_INSTRUCTION_INVALID'});
 }finally{await f.app.close();}
});

test('V13-VIEW129 focused existing framework: resumed actual Application preserves default view producer and matching contract through installed native runtime',async()=>{
 const {createOpenAnalysisApplication}=await import('../../../packages/application/open-analysis.ts');const {createOpenAnalysisDelegation}=await import('../../../packages/application/open-analysis-delegation.ts');const {createPiSessionOpenAnalysisRuntime}=await import('../../../adapters/agent-pi/native-open-analysis.ts');const {createApprovedProviderCredentials}=await import('../../../adapters/agent-pi/provider-credentials.ts');const {createLocalAnalysisRequestLedger}=await import('../../../adapters/storage-local/analysis-request-ledger.ts');
 const f=await fixture(true,null,'Existing framework',true,true);let calls=0,declaration:any,contract:any;
 try{const before=f.analysis.read(f.identity.task_id)!,ledger=createLocalAnalysisRequestLedger({projectRoot:f.root});const runtime=createPiSessionOpenAnalysisRuntime({projectRoot:f.root,ledger,credentials:createApprovedProviderCredentials({environment:{}}),nativeObjectArguments:true,modelTransport:async request=>{
 calls++;declaration=request.messages.flatMap(m=>m.tools??[]).find(t=>t.name==='delegate_analysis')!;
 if(calls===1)return {content:[{kind:'tool',id:'current-delegate-contract',name:'read_tool_contract',arguments:{name:'delegate_analysis'}}],stop:'tools',usage:{inputTokens:4,outputTokens:2}};
 contract=JSON.parse(request.messages.filter(m=>m.role==='tool').at(-1)!.text);return {content:[{kind:'tool',id:'contract-check-complete',name:'ask_user',arguments:{text:'Controlled producer check, not report completion'}}],stop:'tools',usage:{inputTokens:4,outputTokens:2}};
 }});
 const collaboration=createOpenAnalysisDelegation({store:f.analysis,assistant:f.app,source:f.bridge,project_id:f.parent.source.owner.project_id}).root;
 const app=createOpenAnalysisApplication({agentLed:true,framework:before.framework!,savedRecipes:[before.framework!.plan],collaboration,runtime,loadSelectedSource:async()=>before.source,isAuthorized:()=>true,verify:verifyOpenAnalysisIntegerSum,saveFramework:async()=>assert.fail('not a new calculation'),saveOutcome:async()=>assert.fail('not report acceptance'),saveClarification:async value=>({saved:true,...value.identity})});
 await app.run({identity:f.identity,question:'Check current selected material',signal:new AbortController().signal});
 assert.equal(Object.hasOwn(declaration.parameters.properties,'material_ids'),false,'resumed production producer must preserve the adopted view-only projection');assert.equal(Object.hasOwn(contract.parameters.properties,'material_ids'),false,'read_tool_contract must match current declaration');assert.equal(declaration.parameters.properties.view_refs.uniqueItems,true);assert.deepEqual(f.analysis.read(f.identity.task_id),before);assert.equal(calls,2);assert.equal(ledger.pending!().length,0);
 }finally{await f.app.close();}
});


test('V13-RETURN131: exact completed and already returned MODEL opinion survives session close and parent-only reopen without rerunning child',async()=>{
 const {createOpenAnalysisDelegation}=await import('../../../packages/application/open-analysis-delegation.ts');let calls=0;
 const runtime:CaseAssistantRuntime={turn:async input=>{calls++;const p=JSON.parse(input.payload);return {provider:input.provider,model:input.model,cost_microunits:null,output:{kind:'result',summary:'已返回的独立意见：缺少原因资料',references:[p.authorized_context.allowed_references[0]],limitations:['MODEL不是核验'],unknowns:['原因未知']}};}};
 const f=await fixture(true,runtime,'数量与限制',true);try{
  const delegation=createOpenAnalysisDelegation({store:f.analysis,assistant:f.app,source:f.bridge,project_id:f.parent.source.owner.project_id});const queued=await delegation.root.queue(f.identity,{kind:'subagent',task:'检查实际计算限制',material_id:f.steps[0]!,instruction:{action:'check_limitations',reference_paths:['/calculation'],completion_reference_paths:['/calculation']}});await delegation.root.drain(f.identity,new AbortController().signal);
  const child=await f.app.readCollaboration(queued.child_id),parent=child.relation.parent_session_id,original=await f.app.returnedResults(parent);assert.equal(original.length,1);await f.app.close();
  const reopened=createCaseAssistantApplication({store:f.store,runtime,config:{provider:'minimax-cn',model:'MiniMax-M3',authorized:true,consumption_policy:'uncapped_metered',runtime_id:'pi',runtime_version:'0.86.1',adapter_version:'1.3',limits:{turns:1,execution_ms:30000,waiting_ms:60000,cost_microunits:1,turn_cost_microunits:1,currency:'USD'}},clock:()=>new Date(),collaborationPolicy:'open_analysis_v13',openTaskIdentity:()=>f.identity});
  try{const life=await reopened.lifecycle(parent);await assert.rejects(()=>reopened.returnedResults(parent));await reopened.reopenSession(parent,life.epoch);assert.equal((await reopened.lifecycle(queued.child_id)).open,false);assert.deepEqual(await reopened.returnedResults(parent),original,'closing execution must not erase the already delivered opinion from report input');assert.equal(calls,1);
   if(f.parent.session.id!==parent){const old=await reopened.lifecycle(f.parent.session.id);await reopened.reopenSession(f.parent.session.id,old.epoch);}const consumer=createOpenAnalysisDelegation({store:f.analysis,assistant:reopened,source:f.bridge,project_id:f.parent.source.owner.project_id});const projected=await consumer.root.results(f.identity);assert.equal(projected.length,1);assert.equal((projected[0] as any).result.id,original[0]!.result.id);
   const closed=await reopened.lifecycle(queued.child_id);await reopened.reopenSession(queued.child_id,closed.epoch);await reopened.closeSession(queued.child_id,true);assert.deepEqual(await reopened.returnedResults(parent),[],'another child lifecycle must not regain the old authorization');assert.equal(calls,1);
  }finally{await reopened.close();}
 }finally{await f.app.close();}
});

for(const scenario of ['current','stale','outside','revoked'])test('R3-DELEGATION-RESULT-01: saved MODEL opinions native read '+scenario,async()=>{
 // Case persistence and return lifecycle are real; opinion-producing runtime is
 // synthetic. The following pure projection/read checks are not SDK integration.
 let count=0;const runtime:CaseAssistantRuntime={turn:async input=>{count++;const refs=JSON.parse(input.payload).authorized_context.allowed_references;return {provider:'minimax-cn',model:'MiniMax-M3',cost_microunits:null,output:{kind:'result',summary:'合成意见'+count+'界'.repeat(10000),references:refs.slice(0,1),limitations:['MODEL意见，不是独立核验。'],unknowns:['原因未验证。']}};}};const f=await fixture(true,runtime,'合成长意见',true,true);try{const {createOpenAnalysisDelegation}=await import('../../../packages/application/open-analysis-delegation.ts'),views=await import('../../../packages/application/open-analysis-delegation.ts'),delegation=createOpenAnalysisDelegation({store:f.analysis,assistant:f.app,source:f.bridge,project_id:f.parent.source.owner.project_id});for(let i=0;i<3;i++){const child=await f.child(f.parent.session.id,'独立合成意见 '+i,true),authorization=await f.app.prepareCollaboration(child.session.id,'检查当前汇总限制 '+i,[],[]);await f.app.start(child.session.id,authorization.id,true);await f.app.waitForIdle(child.session.id,new AbortController().signal);}const original=await delegation.root.results(f.identity);assert.equal(original.length,3);assert.ok(Buffer.byteLength(JSON.stringify(original))>65536);const before=taskHash(original),project=Reflect.get(views,'projectOpenDelegationResultsForModel'),read=Reflect.get(views,'readOpenDelegationResultForModel');assert.equal(typeof project,'function');assert.equal(typeof read,'function');const model=project(original);assert.ok(Buffer.byteLength(JSON.stringify(model))<32768);for(let i=0;i<3;i++){const m=model[i] as any,r=(original[i] as any).result;assert.equal(m.classification,'MODEL');assert.equal(m.result.value.kind,'saved_result_view');assert.equal(m.result.value.summary,undefined);assert.equal(m.result.value.limitations_count,1);assert.equal(m.result.value.unknowns_count,1);assert.deepEqual(m.result.value.references,r.value.references);assert.match(m.result.value.full_value.path,/^collaboration-result\/[a-f0-9-]{36}\/[1-9][0-9]*\/[a-f0-9]{64}\/value\.txt$/);const text=read(original,m.result.value.full_value.path);const chunks=text.split('\n').slice(1).map((line:string)=>JSON.parse(line));const value=JSON.parse(chunks.map((line:any)=>line.text).join(''));assert.equal(value.classification,'MODEL');assert.deepEqual(value.value,r.value);assert.throws(()=>read(original,m.result.value.full_value.path.replace(r.sha256,'0'.repeat(64))),{code:'ENOENT'});}assert.equal(taskHash(await delegation.root.results(f.identity)),before);const states=[{classification:'MODEL',child_id:randomUUID(),state:'Failed',reason:'EXECUTION_UNKNOWN',question:null,verified:false}];assert.deepEqual(project(states),states);
 const {createPiSessionOpenAnalysisRuntime}=await import('../../../adapters/agent-pi/native-open-analysis.ts'),{createApprovedProviderCredentials}=await import('../../../adapters/agent-pi/provider-credentials.ts'),{createLocalAnalysisRequestLedger}=await import('../../../adapters/storage-local/analysis-request-ledger.ts'),{createOpenAnalysisApplication}=await import('../../../packages/application/open-analysis.ts'),{writeFileSync}=await import('node:fs');const ledger=createLocalAnalysisRequestLedger({projectRoot:f.root});let calls=0,path='',allowed=true;const captured:unknown[]=[];const native=createPiSessionOpenAnalysisRuntime({projectRoot:f.root,ledger,nativeObjectArguments:true,analysisModel:'mimo-v2.6-flash',credentials:createApprovedProviderCredentials({environment:{}}),r1r4:{contextAdmission:{policyVersion:'synthetic-saved-opinions-v1',protocolOverheadTokens:512,safetyMarginTokens:8192}},modelTransport:async request=>{calls++;captured.push({messages:request.messages,model:request.model});const last=request.messages.filter(m=>m.role==='tool').at(-1)?.text??'';if(calls===2){const rows=JSON.parse(last);assert.ok(Buffer.byteLength(last)<32768);assert.equal(rows.length,3);path=rows[0].result.value.full_value.path;if(scenario==='stale')path=path.replace(rows[0].result.sha256,'0'.repeat(64));if(scenario==='outside')path=path.replace(rows[0].result.id,randomUUID());if(scenario==='revoked')allowed=false;}if(calls===3){assert.ok(last.includes('saved_model_result_json'));assert.ok(last.includes('界'));}if(calls===4){const prompt=request.messages.filter(m=>m.role==='user').at(-1)!.text;assert.ok(prompt.includes('GOAL_COMPLETION_REVIEW'));assert.ok(prompt.includes('saved_result_view'));assert.ok(Buffer.byteLength(prompt)<65536);}const content=calls===1?[{kind:'tool' as const,id:'results',name:'read_delegation_results',arguments:{}}]:calls===2?[{kind:'tool' as const,id:'read-opinion',name:'read',arguments:{path,offset:1,limit:8}}]:[{kind:'text' as const,text:'仅检查模型意见及未知，尚未计算或保存新成果。'}],stop=calls<=2?'tools' as const:'complete' as const;return {content,stop,usage:{inputTokens:7,outputTokens:3},outcome:{model:{provider:request.model.provider,id:request.model.id,protocol:request.model.protocol},stop,physicalStatus:'response-received' as const,usageFinal:true,usage:{inputTokens:{kind:'known' as const,value:7},outputTokens:{kind:'known' as const,value:3}},diagnostic:'COMPLETE' as const}};}}),app=createOpenAnalysisApplication({agentLed:true,runtime:native,collaboration:delegation.root,loadSelectedSource:async()=>f.analysis.read(f.identity.task_id)!.source,isAuthorized:()=>allowed,saveFramework:async()=>assert.fail('read must not bind'),saveOutcome:async()=>assert.fail('read must not publish'),verify:async()=>assert.fail('read must not calculate')});let failure:unknown;try{await app.run({identity:f.identity,question:'读取原完整合成模型意见，不计算',signal:new AbortController().signal});}catch(error){failure={code:(error as {code?:string}).code};}writeFileSync(join(f.root,'saved-opinion-native-read.json'),JSON.stringify({failure,calls,captured,requests:ledger.read(f.identity.task_id)}));assert.deepEqual(failure,{code:scenario==='current'?'ANALYSIS_INCOMPLETE':scenario==='revoked'?'AUTHORITY_REQUIRED':'TOOL_FAILED'});assert.equal(calls,scenario==='current'?4:2);assert.equal(taskHash(await delegation.root.results(f.identity)),before);
 }finally{await f.app.close();}
});


test('R3-DELEGATION-CATALOG-01: actual 24 verified materials retain all long labels and views while native read exposes the current exact catalog',async()=>{
 const f=await fixture(true,null,'合成大目录',true,true);try{
  for(let i=0;i<21;i++){const plan=compileOpenAnalysisIR({version:'1.1',source_id:f.analysis.read(f.identity.task_id)!.source.sources[0]!.source_id,sheet_id:'csv',goal:'合成材料'+i+'界'.repeat(1950),operation:'sum',column:'A',group_by:null,filters:[],unit:'个'},f.analysis.read(f.identity.task_id)!.source),calculation=executeOpenAnalysisIR(plan,f.analysis.read(f.identity.task_id)!.source),verification=verifyOpenAnalysisIntegerSum(plan,calculation,f.analysis.read(f.identity.task_id)!.source),step_id=randomUUID();f.analysis.saveFramework(f.lease,{version:'1.0',identity:f.identity,origin:'MODEL_PROPOSAL',plan});f.analysis.saveVerifiedStep(f.lease,{version:'1.0',step_id,identity:f.identity,framework:{version:'1.0',identity:f.identity,origin:'MODEL_PROPOSAL',plan},calculation,verification});f.steps.push(step_id);}
  const {createOpenAnalysisDelegation,createDelegationMaterialReferences}=await import('../../../packages/application/open-analysis-delegation.ts'),{createPiSessionOpenAnalysisRuntime}=await import('../../../adapters/agent-pi/native-open-analysis.ts'),{createApprovedProviderCredentials}=await import('../../../adapters/agent-pi/provider-credentials.ts'),{createLocalAnalysisRequestLedger}=await import('../../../adapters/storage-local/analysis-request-ledger.ts'),{createOpenAnalysisApplication}=await import('../../../packages/application/open-analysis.ts'),{writeFileSync}=await import('node:fs');const delegation=createOpenAnalysisDelegation({store:f.analysis,assistant:f.app,source:f.bridge,project_id:f.parent.source.owner.project_id}),references=createDelegationMaterialReferences(delegation.root,f.identity),original=await references.read(),before=taskHash(f.analysis.read(f.identity.task_id));assert.equal(original.length,24);assert.ok(Buffer.byteLength(JSON.stringify(original))>65536);const {projectOpenDelegationCatalogForModel,readOpenDelegationCatalogForModel}=await import('../../../packages/application/open-analysis-delegation.ts'),modelCatalog=projectOpenDelegationCatalogForModel(original);assert.ok(!Array.isArray(modelCatalog));const fullPath=(modelCatalog as any).full_catalog.path,text=readOpenDelegationCatalogForModel(original,fullPath),reconstructed=JSON.parse(text.split('\n').slice(1).map(line=>JSON.parse(line).text).join(''));assert.deepEqual(reconstructed,original);assert.throws(()=>readOpenDelegationCatalogForModel(original,fullPath.replace(/[a-f0-9]{64}/,'0'.repeat(64))),{code:'ENOENT'});assert.throws(()=>readOpenDelegationCatalogForModel(original.slice(1),fullPath),{code:'ENOENT'});const lastView=original.at(-1)!.views.find(v=>v.reference_paths.includes('/calculation'))!;await references.validateViewSelection({action:'explain',view_refs:[lastView.view_ref]});assert.equal(references.resolveToolSelection({action:'explain',view_refs:[lastView.view_ref]}).material_id,f.steps.at(-1));const ledger=createLocalAnalysisRequestLedger({projectRoot:f.root});let calls=0,path='';const captured:unknown[]=[];
  const native=createPiSessionOpenAnalysisRuntime({projectRoot:f.root,ledger,nativeObjectArguments:true,credentials:createApprovedProviderCredentials({environment:{}}),r1r4:{contextAdmission:{policyVersion:'synthetic-material-catalog-v1',protocolOverheadTokens:512,safetyMarginTokens:8192}},modelTransport:async(request):Promise<import('pi-agent-runtime').ModelReply>=>{calls++;captured.push({messages:request.messages,model:request.model});const last=request.messages.filter(m=>m.role==='tool').at(-1)?.text??'';if(calls===2){const catalog=JSON.parse(last);assert.equal(catalog.kind,'material_catalog_view');assert.equal(catalog.materials.length,24);assert.ok(Buffer.byteLength(last)<32768);assert.deepEqual(catalog.materials.map((m:any)=>m.material_id),original.map(m=>m.material_id));path=catalog.full_catalog.path;}if(calls===3){assert.ok(last.includes('delegation_material_catalog_json'));assert.ok(last.includes('material:1'));}const content=calls===1?[{kind:'tool' as const,id:'catalog',name:'read_delegation_materials',arguments:{}}]:calls===2?[{kind:'tool' as const,id:'catalog-read',name:'read',arguments:{path,offset:1,limit:10}}]:[{kind:'text' as const,text:'仅检查全部目录；尚未委派或计算。'}],stop=calls<=2?'tools' as const:'complete' as const;return {content,stop,usage:{inputTokens:7,outputTokens:3},outcome:{model:{provider:request.model.provider,id:request.model.id,protocol:request.model.protocol},stop,physicalStatus:'response-received',usageFinal:true,usage:{inputTokens:{kind:'known',value:7},outputTokens:{kind:'known',value:3}},diagnostic:'COMPLETE'}};}}),app=createOpenAnalysisApplication({runtime:{...native,run:async input=>native.run({...input,readSelectedMaterial:async(location,signal)=>{try{return await input.readSelectedMaterial!(location,signal);}catch(error){writeFileSync(join(f.root,'catalog-read-error.json'),JSON.stringify({location,code:(error as any).code,message:(error as Error).message}));throw error;}}})},collaboration:delegation.root,loadSelectedSource:async()=>f.analysis.read(f.identity.task_id)!.source,isAuthorized:()=>true,saveFramework:async()=>assert.fail('catalog read must not bind'),saveOutcome:async()=>assert.fail('catalog read must not publish'),verify:async()=>assert.fail('catalog read must not calculate')});let failure:unknown;try{await app.run({identity:f.identity,question:'检查全部合成材料目录，不委派',signal:new AbortController().signal});}catch(error){failure={code:(error as {code?:string}).code};}writeFileSync(join(f.root,'material-catalog-native.json'),JSON.stringify({failure,calls,captured,requests:ledger.read(f.identity.task_id)}));assert.deepEqual(failure,{code:'ANALYSIS_INCOMPLETE'});assert.equal(calls,3);assert.equal(taskHash(f.analysis.read(f.identity.task_id)),before);
 }finally{await f.app.close();}
});


test('R3-DELEGATION-CHILD-01: real nested returned Case opinions are readable only through the child consumer with the actual installed SDK',async()=>{
 const observedContexts:any[]=[];const runtime:CaseAssistantRuntime={turn:async input=>{const context=JSON.parse(input.payload).authorized_context;observedContexts.push(context);const refs=context.allowed_references;return {provider:'minimax-cn',model:'MiniMax-M3',cost_microunits:null,output:{kind:'result',summary:'合成子意见'+'界'.repeat(10000),references:refs.slice(0,1),limitations:['MODEL意见'],unknowns:['原因未知']}};}};const f=await fixture(true,runtime,'合成嵌套意见',true,true);try{
  const child=await f.child(f.parent.session.id,'先检查汇总',true),grant=await f.app.prepareCollaboration(child.session.id,'检查已选汇总',[],[]);await f.app.start(child.session.id,grant.id,true);await f.app.waitForIdle(child.session.id,new AbortController().signal);
  for(let i=0;i<3;i++){const nested=await f.child(child.session.id,'合成不同限制 '+i,true),g=await f.app.prepareCollaboration(nested.session.id,'检查选定汇总的不同限制 '+i,[],[]);await f.app.start(nested.session.id,g.id,true);await f.app.waitForIdle(nested.session.id,new AbortController().signal);}
  const {createOpenAnalysisDelegation}=await import('../../../packages/application/open-analysis-delegation.ts'),{createPiSessionOpenAnalysisRuntime}=await import('../../../adapters/agent-pi/native-open-analysis.ts'),{createOpenAnalysisCollaborationRuntime}=await import('../../../adapters/agent-pi/open-analysis-collaboration.ts'),{createApprovedProviderCredentials}=await import('../../../adapters/agent-pi/provider-credentials.ts'),{createLocalAnalysisRequestLedger}=await import('../../../adapters/storage-local/analysis-request-ledger.ts'),{writeFileSync}=await import('node:fs');const delegation=createOpenAnalysisDelegation({store:f.analysis,assistant:f.app,source:f.bridge,project_id:f.parent.source.owner.project_id}),state=await f.app.readCollaboration(child.session.id),source=state.relation.source,context={source,allowed_references:observedContexts[0].allowed_references},original=await delegation.child(child.session.id).results(f.identity),before=taskHash(original),ledger=createLocalAnalysisRequestLedger({projectRoot:f.root});assert.equal(original.length,3);let calls=0,path='',bootstrapping=true,bootstrapCalls=0;const captured:unknown[]=[];
  const native=createPiSessionOpenAnalysisRuntime({projectRoot:f.root,ledger,nativeObjectArguments:true,credentials:createApprovedProviderCredentials({environment:{}}),r1r4:{contextAdmission:{policyVersion:'synthetic-nested-results-v1',protocolOverheadTokens:512,safetyMarginTokens:8192}},modelTransport:async(request):Promise<import('pi-agent-runtime').ModelReply>=>{if(bootstrapping){bootstrapCalls++;return {content:[{kind:'text',text:'合成父Native会话已建立；未计算或保存新成果。'}],stop:'complete',usage:{inputTokens:7,outputTokens:3},outcome:{model:{provider:request.model.provider,id:request.model.id,protocol:request.model.protocol},stop:'complete',physicalStatus:'response-received',usageFinal:true,usage:{inputTokens:{kind:'known',value:7},outputTokens:{kind:'known',value:3}},diagnostic:'COMPLETE'}};}calls++;captured.push({messages:request.messages,model:request.model});const last=request.messages.filter(m=>m.role==='tool').at(-1)?.text??'';if(calls===2){const values=JSON.parse(last);assert.equal(values.length,3);assert.ok(Buffer.byteLength(last)<32768);path=values[0].result.value.full_value.path;}if(calls===3){assert.ok(last.includes('saved_model_result_json'));assert.ok(last.includes('界'));}const content=calls===1?[{kind:'tool' as const,id:'nested-results',name:'read_delegation_results',arguments:{}}]:calls===2?[{kind:'tool' as const,id:'read-nested-opinion',name:'read',arguments:{path,offset:1,limit:8}}]:[{kind:'tool' as const,id:'complete-child',name:'finish_result',arguments:{summary:'已查看实际子意见；原因仍未知。',reference_indices:[0],limitations:['MODEL，不是独立核验。'],unknowns:['原因未验证。']}}];return {content,stop:'tools',usage:{inputTokens:7,outputTokens:3},outcome:{model:{provider:request.model.provider,id:request.model.id,protocol:request.model.protocol},stop:'tools',physicalStatus:'response-received',usageFinal:true,usage:{inputTokens:{kind:'known',value:7},outputTokens:{kind:'known',value:3}},diagnostic:'COMPLETE'}};}}),consumer=createOpenAnalysisCollaborationRuntime({runtime:native,authorizeSource:owner=>{const allowed=taskHash(owner)===taskHash(source.owner);writeFileSync(join(f.root,'nested-opinion-source-authority.json'),JSON.stringify({allowed,owner,expected:source.owner}));return allowed;},collaboration:id=>delegation.child(id)});await native.run({identity:f.identity,prompt:'合成父会话初始化，不执行或发布业务。',system:'离线合成，仅建立原Native父会话身份。',tools:[],signal:new AbortController().signal,authorize:()=>true});bootstrapping=false;let result;try{result=await consumer.turn({collaboration:{synthetic:true},payload:JSON.stringify({authorized_context:context,current_attempt_history:[],visible_message:'只查看自身实际返回的子意见，不取得其他材料。',authorized_tool_result:null}),open_analysis:{identity:f.identity,conversation_id:child.session.id,authorize:()=>true},signal:new AbortController().signal} as any);}catch(error){writeFileSync(join(f.root,'nested-opinion-failure.json'),JSON.stringify({calls,captured,requests:ledger.read(f.identity.task_id),code:(error as any).code,reason:(error as any).reason,message:(error as Error).message}));throw error;}writeFileSync(join(f.root,'nested-opinion-native-read.json'),JSON.stringify({result,calls,captured,requests:ledger.read(f.identity.task_id)}));assert.equal(result.output.kind,'result');assert.equal(calls,3);assert.equal(bootstrapCalls,1);assert.equal(ledger.read(f.identity.task_id).length,4);assert.equal(taskHash(await delegation.child(child.session.id).results(f.identity)),before);
 }finally{await f.app.close();}
});
