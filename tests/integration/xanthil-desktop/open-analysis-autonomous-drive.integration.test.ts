import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID,createHash} from 'node:crypto';
import {mkdtempSync} from 'node:fs';
import {join} from 'node:path';
import {browserEvidenceRoot} from '../../fixtures/xanthil-desktop/browser-evidence.ts';
import {createOpenAnalysisApplication} from '../../../packages/application/open-analysis.ts';
import {createLocalOpenAnalysisStore} from '../../../adapters/storage-local/open-analysis.ts';
import {verifyOpenAnalysisIntegerSum} from '../../../adapters/analytics-duckdb/open-analysis-verification.ts';
import {taskHash} from '../../../packages/product-core/member-task.ts';
import type {MemberSourceInspection} from '../../../packages/ports/member-source.ts';
import type {OpenAnalysisRun} from '../../../packages/ports/open-analysis-runtime.ts';

test('V13-DRIVE01 / AU07/AC03: actual Application yields before child dispatch, then observes returned material and publishes the computed result',async()=>{
 const root=mkdtempSync(join(browserEvidenceRoot,'v13-main-drive-')),store=createLocalOpenAnalysisStore({projectRoot:root});
 const source:MemberSourceInspection={version:'1.0',sources:[{source_id:randomUUID(),display_name:'synthetic.csv',format:'csv',sha256:'a'.repeat(64),byte_length:'8',sheets:[{sheet_id:'csv',name:'CSV',state:'visible',rows:[{row:1,cells:[{column:'A',type:'string',value:'数量'}]},{row:2,cells:[{column:'A',type:'string',value:'7'}]}]}]}]};
 const identity={task_id:randomUUID(),revision:'1',run_id:randomUUID(),attempt_id:randomUUID(),operation_id:randomUUID(),grant_id:randomUUID(),scope_sha256:taskHash(source),config_sha256:'b'.repeat(64)};
 store.create({identity,source,question:'核对数量以及资料限制'});const lease=store.begin(identity.task_id),queued:string[]=[];let calls=0,inside=false,dispatched=false,observed=false;
 const collaboration={
  materials:async()=>store.read(identity.task_id)!.verified_steps!.map(s=>({material_id:s.step_id,label:'当前已核验汇总',verification:s.verification.grade})),
  queue:async(_id:OpenAnalysisRun['identity'],request:{task:string;material_id:string;kind:'fork'|'subagent'})=>{assert.equal(inside,true);assert.ok(store.read(identity.task_id)?.verified_steps?.some(s=>s.step_id===request.material_id));queued.push(request.task);return {child_id:randomUUID(),state:'queued' as const};},
  drain:async()=>{assert.equal(inside,false,'child dispatch must wait until the existing native run has returned');dispatched=true;},
  results:async()=>{assert.equal(dispatched,true);return [{classification:'MODEL',summary:'CHILD_OBSERVATION：缺少原因资料',limitations:['不是独立核验']}]},
 };
 const options={collaboration,runtime:{run:async(input:OpenAnalysisRun)=>{calls++;inside=true;try{
  const tool=(name:string)=>{const t=input.tools.find(t=>t.name===name);assert.ok(t,'approved autonomous business tool missing: '+name);return t;};
  if(calls===1){
   await tool('set_framework').execute({goal:'数量合计',source_id:source.sources[0]!.source_id,sheet_id:'csv',operation:'sum',column:'A',unit:'个'},input.signal);
   await tool('calculate_and_verify').execute({},input.signal);
   const materials=await tool('read_delegation_materials').execute({},input.signal) as Array<{material_id:string}>;
   assert.match(materials[0]!.material_id,/^material:[1-9][0-9]*$/,'model references must be sourced short handles, not invented UUIDs');
   for(const task of ['检查资料来源','检查解释限制'])await tool('delegate_analysis').execute({kind:'subagent',task,instruction:{action:task==='检查来源'||task==='检查资料来源'?'inspect_sources':'check_limitations',reference_paths:['/verification'],completion_reference_paths:['/verification']},material_id:materials[0]!.material_id},input.signal);
   assert.equal(input.shouldYield?.(),true);return {text:'',tools:[]};
  }
  const returned=await tool('read_delegation_results').execute({},input.signal);assert.ok(JSON.stringify(returned).includes('CHILD_OBSERVATION'));observed=true;return {text:'核验数量7个；缺少原因资料，暂不解释原因。',tools:[]};
 }finally{inside=false;}}},loadSelectedSource:async()=>source,isAuthorized:()=>true,saveFramework:async (value:Parameters<typeof store.saveFramework>[1])=>store.saveFramework(lease,value),saveVerifiedStep:async (value:Parameters<typeof store.saveVerifiedStep>[1])=>store.saveVerifiedStep(lease,value),verify:verifyOpenAnalysisIntegerSum,saveOutcome:async (value:Parameters<typeof store.saveOutcome>[1])=>store.saveOutcome(lease,value)};
 const app=createOpenAnalysisApplication(options);const result=await app.run({identity,question:'核对数量以及资料限制',signal:new AbortController().signal});
 assert.equal(calls,2);assert.equal(observed,true);assert.deepEqual(queued,['检查资料来源','检查解释限制']);assert.equal(result.state,'saved');
 assert.equal(store.read(identity.task_id)?.outcome?.calculation.value,'7');assert.ok(store.read(identity.task_id)?.outcome?.explanation.text.includes('缺少原因资料'));
});

test('V13-DRIVE03 / AS04 / V13-INSTRUCTION-CORRECT01: real production Profile wires two different children, a legal grandchild and returned observations into the main result',async()=>{
 const {createPersonalOpenAnalysisWorkspace}=await import('../../../profiles/personal/open-analysis.ts');
 const {withReportEdit}=await import('../../fixtures/xanthil-desktop/report-edit-runtime.ts');
 const root=mkdtempSync(join(browserEvidenceRoot,'v13-profile-drive-'));
 const source:MemberSourceInspection={version:'1.0',sources:[{source_id:randomUUID(),display_name:'synthetic.csv',format:'csv',sha256:createHash('sha256').update('x').digest('hex'),byte_length:'1',sheets:[{sheet_id:'csv',name:'CSV',state:'visible',rows:[{row:1,cells:[{column:'A',type:'string',value:'数量'}]},{row:2,cells:[{column:'A',type:'number',value:'7'}]}]}]}]};
 const task_id=randomUUID(),conversations=new Map<string,number>();let observed=false,missing='';
 const runtime=withReportEdit({run:async(input:OpenAnalysisRun)=>{
  assert.equal(input.identity.task_id,task_id,'all descendants retain the root Task identity');
  const key=input.conversation_id??'root',turn=(conversations.get(key)??0)+1;conversations.set(key,turn);
  const tool=(name:string)=>{const t=input.tools.find(t=>t.name===name);if(!t)missing=name;assert.ok(t,'production consumer missing: '+name);return t;};
  if(!input.conversation_id){
   if(turn===1){await tool('set_framework').execute({goal:'数量合计',source_id:source.sources[0]!.source_id,sheet_id:'csv',operation:'sum',column:'A',unit:'个'},input.signal);await tool('calculate_and_verify').execute({},input.signal);
    const materials=await tool('read_delegation_materials').execute({},input.signal) as {material_id:string}[];
    const schema=tool('delegate_analysis').parameters as {properties:{instruction:{anyOf:Array<{properties:{reference_paths?:{items:{pattern?:string}};completion_reference_paths?:{items:{pattern?:string}}}}>}}};const legacy=schema.properties.instruction.anyOf.find(s=>s.properties.reference_paths);assert.ok(legacy,'legacy path schema remains supported');assert.equal(legacy.properties.reference_paths!.items.pattern,'^/');assert.equal(legacy.properties.completion_reference_paths!.items.pattern,'^/');
    const correction=await tool('delegate_analysis').execute({kind:'subagent',task:'检查限制',instruction:{action:'check_limitations',reference_paths:['/verification'],completion_reference_paths:['/calculation']},material_id:materials[0]!.material_id},input.signal) as {status:string;created:boolean};assert.equal(correction.status,'needs_instruction_correction');assert.equal(correction.created,false);
    for(const task of ['检查来源','检查限制'])await tool('delegate_analysis').execute({kind:task==='检查来源'?'fork':'subagent',task,instruction:{action:task==='检查来源'||task==='检查资料来源'?'inspect_sources':'check_limitations',reference_paths:['/verification'],completion_reference_paths:['/verification']},material_id:materials[0]!.material_id},input.signal);return {text:'',tools:[]};
   }
   const returned=await tool('read_delegation_results').execute({},input.signal);observed=JSON.stringify(returned).includes('嵌套检查意见');assert.equal(observed,true);return {text:'数量7个。根据嵌套检查意见，不推断原因。',tools:[]};
  }
  const context=await tool('read_authorized_context').execute({},input.signal) as {task:string};
  if(context.instruction?.action==='inspect_sources'&&turn===1){const materials=await tool('read_delegation_materials').execute({},input.signal) as {material_id:string}[];const correction=await tool('delegate_analysis').execute({kind:'subagent',task:'复查限制',instruction:{action:'check_limitations',reference_paths:['/verification'],completion_reference_paths:['/calculation']},material_id:materials[0]!.material_id},input.signal) as {status:string;created:boolean};assert.equal(correction.status,'needs_instruction_correction');assert.equal(correction.created,false);await tool('delegate_analysis').execute({kind:'subagent',task:'复查来源限制',instruction:{action:'check_limitations',reference_paths:['/verification'],completion_reference_paths:['/verification']},material_id:materials[0]!.material_id},input.signal);return {text:'',tools:[]};}
  if(context.instruction?.action==='inspect_sources')assert.ok(JSON.stringify(await tool('read_delegation_results').execute({},input.signal)).includes('嵌套检查意见'));
  await tool('finish_result').execute({summary:context.instruction?.action==='check_limitations'?'嵌套检查意见：只有汇总资料，不推断原因。':context.instruction?.action==='inspect_sources'?'采用嵌套检查意见，保留原因未知。':'限制检查：MODEL不能代替独立核验。',reference_indices:[0],limitations:['MODEL'],unknowns:[]},input.signal);
  return {text:'模型意见已返回',tools:[]};
 }});
 const app=createPersonalOpenAnalysisWorkspace({projectRoot:root,runtime,inspect:async()=>source,authorizeConfiguration:async()=>({config_sha256:'b'.repeat(64)})});
 try{
  await app.submit({version:'1.0',command_id:task_id,question:'核对数量与来源限制',confirmed:true,sources:[{source_id:source.sources[0]!.source_id,display_name:'synthetic.csv',format:'csv',bytes:Buffer.from('x')}]});await app.collect();
  assert.equal(missing,'','production delegation tools must be connected');assert.equal(app.read(task_id).state,'saved');assert.equal(app.read(task_id).outcome?.calculation.value,'7');assert.equal(observed,true);assert.equal(conversations.size,4,'root + two different children + one grandchild');
 }finally{await app.close();}
});

test('V13-DRIVE05 / AC06: product root Stop aborts the real delegated runtime signal before collection completes',async()=>{
 const {createPersonalOpenAnalysisWorkspace}=await import('../../../profiles/personal/open-analysis.ts');
 const {withReportEdit}=await import('../../fixtures/xanthil-desktop/report-edit-runtime.ts');
 const root=mkdtempSync(join(browserEvidenceRoot,'v13-profile-stop-')),task_id=randomUUID();
 const source:MemberSourceInspection={version:'1.0',sources:[{source_id:randomUUID(),display_name:'synthetic.csv',format:'csv',sha256:createHash('sha256').update('x').digest('hex'),byte_length:'1',sheets:[{sheet_id:'csv',name:'CSV',state:'visible',rows:[{row:1,cells:[{column:'A',type:'string',value:'数量'}]},{row:2,cells:[{column:'A',type:'number',value:'7'}]}]}]}]};
 let ready!:()=>void;const entered=new Promise<void>(resolve=>ready=resolve);let aborted=false,rootTurns=0;
 const app=createPersonalOpenAnalysisWorkspace({projectRoot:root,inspect:async()=>source,authorizeConfiguration:async()=>({config_sha256:'b'.repeat(64)}),runtime:withReportEdit({run:async input=>{
  const tool=(name:string)=>input.tools.find(t=>t.name===name)!;
  if(input.conversation_id){ready();await new Promise<void>(resolve=>input.signal.addEventListener('abort',()=>{aborted=true;resolve();},{once:true}));throw Object.assign(new Error('CANCELLED'),{code:'CANCELLED'});}
  rootTurns++;if(rootTurns>1){const returned=await tool('read_delegation_results').execute({},input.signal);assert.ok(JSON.stringify(returned).includes('Interrupted'));return {text:'数量7个；旧子任务已停止，本轮保留该限制。',tools:[]};}
  await tool('set_framework').execute({goal:'数量合计',source_id:source.sources[0]!.source_id,sheet_id:'csv',operation:'sum',column:'A',unit:'个'},input.signal);await tool('calculate_and_verify').execute({},input.signal);
  const materials=await tool('read_delegation_materials').execute({},input.signal) as {material_id:string}[];await tool('delegate_analysis').execute({kind:'subagent',task:'检查来源',instruction:{action:'inspect_sources',reference_paths:['/verification'],completion_reference_paths:['/verification']},material_id:materials[0]!.material_id},input.signal);return {text:'',tools:[]};
 }})});
 try{
  await app.submit({version:'1.0',command_id:task_id,question:'核对数量与来源',confirmed:true,sources:[{source_id:source.sources[0]!.source_id,display_name:'synthetic.csv',format:'csv',bytes:Buffer.from('x')}]});let timer:ReturnType<typeof setTimeout>|undefined;try{const began=await Promise.race([entered.then(()=>true),new Promise<boolean>(resolve=>timer=setTimeout(()=>resolve(false),2000))]);assert.equal(began,true,'child runtime never entered; root='+app.read(task_id).state);}finally{if(timer)clearTimeout(timer);}
  app.stop(task_id);await app.collect();assert.equal(aborted,true,'root Stop must reach the actual child signal, not only stop the root projection');assert.equal(app.read(task_id).outcome,null);
  await app.resume(task_id);await app.collect();assert.equal(app.read(task_id).state,'saved','explicit root recovery opens its material parent before native continuation');assert.equal(rootTurns,2);const families=await app.collaboration(task_id);assert.ok(families.flatMap(f=>f.children).every(c=>!c.lifecycle.open),'root resume does not restart old descendants');
 }finally{await app.close();}
});


async function branchStopScenario(checkRename=false){
 const {createPersonalOpenAnalysisWorkspace}=await import('../../../profiles/personal/open-analysis.ts');
 const {withReportEdit}=await import('../../fixtures/xanthil-desktop/report-edit-runtime.ts');
 const root=mkdtempSync(join(browserEvidenceRoot,'v13-branch-stop-')),task_id=randomUUID();
 const source:MemberSourceInspection={version:'1.0',sources:[{source_id:randomUUID(),display_name:'synthetic.csv',format:'csv',sha256:createHash('sha256').update('x').digest('hex'),byte_length:'1',sheets:[{sheet_id:'csv',name:'CSV',state:'visible',rows:[{row:1,cells:[{column:'A',type:'string',value:'数量'}]},{row:2,cells:[{column:'A',type:'number',value:'7'}]}]}]}]};
 let ready!:()=>void;const entered=new Promise<void>(resolve=>ready=resolve);let aborted=false;
 const turns=new Map<string,number>();
 const app=createPersonalOpenAnalysisWorkspace({projectRoot:root,inspect:async()=>source,authorizeConfiguration:async()=>({config_sha256:'b'.repeat(64)}),runtime:withReportEdit({run:async input=>{
  const tool=(name:string)=>input.tools.find(t=>t.name===name)!,key=input.conversation_id??'root',turn=(turns.get(key)??0)+1;turns.set(key,turn);
  if(!input.conversation_id){
   if(turn>1){assert.ok(JSON.stringify(await tool('read_delegation_results').execute({},input.signal)).includes('Stopped'));if(checkRename){const m=await tool('read_delegation_materials').execute({},input.signal) as {material_id:string}[];const stop=await tool('delegate_analysis').execute({kind:'subagent',task:'换个方式重新检查来源',instruction:{action:'inspect_sources',reference_paths:['/verification'],completion_reference_paths:['/verification']},material_id:m[0]!.material_id},input.signal) as {code:string;status:string};assert.equal(stop.code,'DELEGATION_STOPPED');assert.equal(stop.status,'delegation_stopped');}return {text:'数量7个；分支已停止，不采用未完成意见。',tools:[]};}
   await tool('set_framework').execute({goal:'数量合计',source_id:source.sources[0]!.source_id,sheet_id:'csv',operation:'sum',column:'A',unit:'个'},input.signal);await tool('calculate_and_verify').execute({},input.signal);
   const m=await tool('read_delegation_materials').execute({},input.signal) as {material_id:string}[];await tool('delegate_analysis').execute({kind:'subagent',task:'检查来源',instruction:{action:'inspect_sources',reference_paths:['/verification'],completion_reference_paths:['/verification']},material_id:m[0]!.material_id},input.signal);return {text:'',tools:[]};
  }
  const context=await tool('read_authorized_context').execute({},input.signal) as {task:string};
  if(context.instruction?.action==='inspect_sources'){
   const m=await tool('read_delegation_materials').execute({},input.signal) as {material_id:string}[];await tool('delegate_analysis').execute({kind:'subagent',task:'复查来源限制',instruction:{action:'check_limitations',reference_paths:['/verification'],completion_reference_paths:['/verification']},material_id:m[0]!.material_id},input.signal);return {text:'',tools:[]};
  }
  ready();await new Promise<void>(resolve=>{const timer=setTimeout(resolve,1500);input.signal.addEventListener('abort',()=>{aborted=true;clearTimeout(timer);resolve();},{once:true});});
  throw Object.assign(new Error('CANCELLED'),{code:'CANCELLED'});
 }})});
 try{
  await app.submit({version:'1.0',command_id:task_id,question:'核对数量与来源',confirmed:true,sources:[{source_id:source.sources[0]!.source_id,display_name:'synthetic.csv',format:'csv',bytes:Buffer.from('x')}]});
  let timer:ReturnType<typeof setTimeout>|undefined;try{assert.equal(await Promise.race([entered.then(()=>true),new Promise<boolean>(resolve=>timer=setTimeout(()=>resolve(false),2000))]),true);}finally{if(timer)clearTimeout(timer);}
  const before=await app.collaboration(task_id),branch=before.flatMap(g=>g.children).find(c=>c.relation.automatic_instruction?.action==='inspect_sources')!;
  await app.collaborationCommand(task_id,'stop',{version:'1.0',command_id:randomUUID(),child_id:branch.session.id});
  const stopped=await app.collaboration(task_id);assert.ok(stopped.flatMap(g=>g.children).every(c=>!c.lifecycle.open),'normal Stop must close branch and all descendants before acknowledging');assert.equal(stopped.flatMap(g=>g.children).find(c=>c.session.id===branch.session.id)!.attempts.at(-1)?.status,'Stopped');assert.equal(stopped.flatMap(g=>g.children).find(c=>c.session.id!==branch.session.id)!.attempts.at(-1)?.status,'Interrupted');
  await app.collect();assert.equal(aborted,true);assert.equal(app.read(task_id).state,'saved');assert.equal(app.read(task_id).outcome?.calculation.value,'7');
 }finally{await app.close();}
}

test('V13-STOP-BRANCH01 / AS07: actual product branch Stop closes descendants while root preserves checked result',()=>branchStopScenario());
test('V13-STOP-ALIAS01 / AC04: renamed delegation cannot bypass a user-stopped branch',()=>branchStopScenario(true));


test('V13-FAIR126 / AS04: production collaboration projection permits native/page IO without starting analysis',async()=>{
 const {createPersonalOpenAnalysisWorkspace}=await import('../../../profiles/personal/open-analysis.ts');
 const root=mkdtempSync(join(browserEvidenceRoot,'v13-profile-fair-')),analysis=createLocalOpenAnalysisStore({projectRoot:root}),source:MemberSourceInspection={version:'1.0',sources:[]};
 const identity={task_id:randomUUID(),revision:'1',run_id:randomUUID(),attempt_id:randomUUID(),operation_id:randomUUID(),grant_id:randomUUID(),scope_sha256:taskHash(source),config_sha256:'b'.repeat(64)};analysis.create({identity,source,question:'只读协作历史'});let calls=0;
 const profile=createPersonalOpenAnalysisWorkspace({projectRoot:root,runtime:{run:async()=>{calls++;throw Error('NO_MODEL_AUTHORITY');}},inspect:async()=>source,authorizeConfiguration:async()=>({config_sha256:identity.config_sha256})});
 try{let io=false;setImmediate(()=>{io=true});const result=await profile.collaboration(identity.task_id);assert.equal(io,true,'read-only projection must not monopolize event loop');assert.deepEqual(result,[]);assert.equal(calls,0);assert.equal(profile.read(identity.task_id).state,'ready');}finally{await profile.close();}
});
