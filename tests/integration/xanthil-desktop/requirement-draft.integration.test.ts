import assert from 'node:assert/strict';
import test from 'node:test';
import {mkdtempSync} from 'node:fs';
import {join} from 'node:path';
import {randomUUID,createHash} from 'node:crypto';
const requireDigest=(bytes:Uint8Array)=>createHash('sha256').update(bytes).digest('hex');
import {createLocalOpenAnalysisStore} from '../../../adapters/storage-local/open-analysis.ts';
import {browserEvidenceRoot} from '../../fixtures/xanthil-desktop/browser-evidence.ts';
import {taskHash} from '../../../packages/product-core/member-task.ts';
import {compileOpenBusinessProposal} from '../../../packages/product-core/open-analysis-context.ts';
import {createOpenAnalysisWorkspace} from '../../../packages/application/open-analysis-workspace.ts';
import {createLocalAnalysisRequestLedger} from '../../../adapters/storage-local/analysis-request-ledger.ts';
import {verifyOpenAnalysisIntegerSum} from '../../../adapters/analytics-duckdb/open-analysis-verification.ts';
import {createPersonalOpenAnalysisWorkspace} from '../../../profiles/personal/open-analysis.ts';
import {startBrowserMembershipServer} from '../../../apps/browser/local-server.ts';
import {openTaskView} from '../../../apps/browser/quick-analysis-client.mjs';
import {renderQuickAnalysisWorkbench} from '../../../apps/browser/quick-analysis-workbench.mjs';

test('RS-C2/06: reviewed framework method and scope reach actual Context/IR, local calculation and independent verification on the same task',async()=>{
 const root=mkdtempSync(join(browserEvidenceRoot,'requirement-consumer-')),source={version:'1.0' as const,sources:[{source_id:randomUUID(),display_name:'数量.csv',format:'csv' as const,sha256:'a'.repeat(64),byte_length:'16',sheets:[{sheet_id:randomUUID(),name:'CSV',state:'visible' as const,rows:[{row:1,cells:[{column:'A',type:'string' as const,value:'数量'},{column:'B',type:'string' as const,value:'商品'}]},{row:2,cells:[{column:'A',type:'number' as const,value:'7'},{column:'B',type:'string' as const,value:'Coffee'}]},{row:3,cells:[{column:'A',type:'number' as const,value:'3'},{column:'B',type:'string' as const,value:'Tea'}]}]}]}]};
 const store=createLocalOpenAnalysisStore({projectRoot:root}),identity={task_id:randomUUID(),revision:'1',run_id:randomUUID(),attempt_id:randomUUID(),operation_id:randomUUID(),grant_id:randomUUID(),scope_sha256:taskHash(source),config_sha256:'b'.repeat(64)};store.create({identity,question:'按共同整理的方案计算数量',source,entry_mode:'requirements'});let calls=0;
 const app=createOpenAnalysisWorkspace({store,ledger:createLocalAnalysisRequestLedger({projectRoot:root}),inspect:async()=>assert.fail('no source changes'),authorizeConfiguration:async()=>({config_sha256:identity.config_sha256}),verify:verifyOpenAnalysisIntegerSum,runtime:{run:async i=>{
  calls++;const task=app.read(identity.task_id),content=task.requirement_execution!.content;assert.ok(i.system.includes('修订方法或范围'),'saved user clarification must reach semantic source messages');assert.ok(i.prompt.includes(content.methods[0]!));assert.ok(i.prompt.includes(content.evidence[0]!));assert.ok(!i.prompt.includes('pretend verified benefit'));
  const call=(name:string,args={})=>i.tools.find(t=>t.name===name)!.execute(args,i.signal);await call('inspect_selected');const filters=content.business.execution_scope![0]!.filters;
  await call('set_framework',{goal:content.business.purpose,source_id:source.sources[0]!.source_id,sheet_id:source.sources[0]!.sheets[0]!.sheet_id,operation:content.methods[0]==='平均数量'?'mean':'sum',column:'A',unit:'数量',group_mode:'none',filters} as any);await call('calculate_and_verify');return {text:'已完成本次真实计算与独立核验。',tools:[]};
 }}});
 const content=(method:string,coffee=false)=>({business:compileOpenBusinessProposal({purpose:method,object:'订单',scope:coffee?'仅Coffee':'全部商品',deliverables:['数量'],hypotheses:[],unknowns:[],execution_scope:[{source_id:source.sources[0]!.source_id,sheet_id:source.sources[0]!.sheets[0]!.sheet_id,filters:coffee?[{column:'B',operator:'eq',value:'Coffee'}]:[]}]}),methods:[method],evidence:['本次选定的数量与商品字段'],previews:[{possibility:'supported' as const,answer:'待验证候选',needs:['真实数量'],impact:'pretend verified benefit must never enter facts'}]});
 const start=Reflect.get(app,'startRequirement');assert.equal(typeof start,'function');try{
  for(const [index,[method,coffee,expected]] of ([['数量合计',false,'10'],['平均数量',false,'5'],['数量合计',true,'7']] as const).entries()){
   app.saveRequirementDraft(identity.task_id,{version:'1.0',command_id:randomUUID(),expected_sequence:index,content:content(method,coffee),message:'修订方法或范围'});
   await assert.rejects(()=>start(identity.task_id,{version:'1.0',command_id:randomUUID(),expected_revision:index+1,confirmed:true}),{code:'FRAMEWORK_REVIEW_REQUIRED'});
   app.reviewRequirement(identity.task_id,{version:'1.0',command_id:randomUUID(),expected_revision:index+1,confirmed:true});assert.equal(calls,index);
   const command={version:'1.0',command_id:randomUUID(),expected_revision:index+1,confirmed:true};await start(identity.task_id,command);await app.collect();const result=app.read(identity.task_id);assert.equal(result.state,'saved');assert.equal(result.outcome?.calculation.value,expected);assert.equal(result.outcome?.verification.grade,'independent_arithmetic');assert.equal(result.framework?.context?.business?.purpose,method);assert.equal(result.requirement_execution?.revision,index+1);assert.equal(result.requirement_execution?.analysis_revision,result.identity.revision);assert.deepEqual(await start(identity.task_id,command),result);assert.equal(calls,index+1);
  }
  assert.equal(app.read(identity.task_id).history?.length,2);assert.equal(app.read(identity.task_id).history?.[0]?.outcome?.calculation.value,'10');assert.equal(app.read(identity.task_id).history?.[1]?.outcome?.calculation.value,'5');
  const previous=app.read(identity.task_id),nextIdentity={...previous.identity,revision:'4',run_id:randomUUID(),attempt_id:randomUUID(),operation_id:randomUUID()};
  const revised=store.revise(identity.task_id,{command_id:randomUUID(),expected_revision:'3',question:'继续分析其他商品',identity:nextIdentity,preferences:previous.preferences??{skill:'general',prompt:'professional'}});
  assert.equal(revised.requirement_execution,undefined);assert.equal(revised.entry_mode,undefined);
  assert.equal(revised.history?.at(-1)?.requirement_execution?.revision,3);assert.equal(revised.history?.at(-1)?.outcome?.calculation.value,'7');

 }finally{await app.close();}
});
test('RS-05/06: overall review never runs; no-op keeps review, material framework edit invalidates it without deleting history',async()=>{
 const f=draftFixture(),{app}=draftWorkspace(f);try{
  app.saveRequirementDraft(f.identity.task_id,f.command);const review=Reflect.get(app,'reviewRequirement');assert.equal(typeof review,'function');
  const command={version:'1.0',command_id:randomUUID(),expected_revision:1,confirmed:true};const reviewed=await review(f.identity.task_id,command);assert.ok(reviewed.requirement_reviews);assert.equal(reviewed.requirement_reviews.length,1);assert.equal(reviewed.state,'ready');assert.equal(reviewed.framework,null);assert.equal(reviewed.outcome,null);
  assert.deepEqual(await review(f.identity.task_id,command),reviewed);
  const same=app.saveRequirementDraft(f.identity.task_id,{...f.command,command_id:randomUUID(),expected_sequence:1,message:'same content'});assert.equal(same.requirement_draft?.revision,1);assert.equal(same.requirement_reviews?.length,1);
  const changed=app.saveRequirementDraft(f.identity.task_id,{...f.command,command_id:randomUUID(),expected_sequence:2,content:{...f.command.content,methods:['先描述，再调查原因']}});assert.equal(changed.requirement_draft?.revision,2);assert.equal(changed.requirement_reviews?.length,1);assert.throws(()=>review(f.identity.task_id,{...command,command_id:randomUUID()}),{code:'REVISION_CONFLICT'});
 }finally{await app.close();}
});
test('RS-03/05: stop during material inspection preserves draft and rejects late material publication',async()=>{
 const f=draftFixture('requirements');let begin!:()=>void,finish!:()=>void;
 const started=new Promise<void>(r=>begin=r),release=new Promise<void>(r=>finish=r),file={source_id:randomUUID(),display_name:'新增.csv',format:'csv' as const,bytes:Buffer.from('数量\n7\n')};
 const app=createOpenAnalysisWorkspace({store:f.store,ledger:createLocalAnalysisRequestLedger({projectRoot:f.root}),verify:verifyOpenAnalysisIntegerSum,runtime:{run:async()=>assert.fail('cannot run')},authorizeConfiguration:async()=>assert.fail('cannot read credentials'),inspect:async()=>{begin();await release;return {version:'1.0',sources:[{...f.store.read(f.identity.task_id)!.source.sources[0]!,source_id:file.source_id,display_name:file.display_name,format:file.format,sha256:requireDigest(file.bytes),byte_length:String(file.bytes.length)}]};}});
 try{app.saveRequirementDraft(f.identity.task_id,f.command);const pending=app.addRequirementMaterials(f.identity.task_id,{version:'1.0',command_id:randomUUID(),expected_revision:'1',sources:[file]});await started;app.stop(f.identity.task_id);finish();await assert.rejects(()=>pending,{code:'REVISION_CONFLICT'});assert.equal(app.read(f.identity.task_id).state,'stopped');assert.equal(app.read(f.identity.task_id).identity.revision,'1');assert.equal(app.read(f.identity.task_id).requirement_draft?.revision,1);assert.equal(app.read(f.identity.task_id).requirement_materials,undefined);}finally{finish();await app.close();}
});
test('RS-03/05: adding selected material saves on the same task, invalidates review and never calls credentials or analysis',async()=>{
 const f=draftFixture('requirements');let inspections=0;const file={source_id:randomUUID(),display_name:'新增.csv',format:'csv' as const,bytes:Buffer.from('数量\n7\n')};
 const app=createOpenAnalysisWorkspace({store:f.store,ledger:createLocalAnalysisRequestLedger({projectRoot:f.root}),verify:verifyOpenAnalysisIntegerSum,runtime:{run:async()=>assert.fail('material save cannot call model')},authorizeConfiguration:async()=>assert.fail('material save cannot read credentials'),inspect:async input=>{inspections++;assert.deepEqual(input.sources,[file]);return {version:'1.0',sources:[{source_id:file.source_id,display_name:file.display_name,format:file.format,sha256:requireDigest(file.bytes),byte_length:String(file.bytes.length),sheets:[{sheet_id:randomUUID(),name:'CSV',state:'visible',rows:[{row:1,cells:[{column:'A',type:'string',value:'数量'}]},{row:2,cells:[{column:'A',type:'number',value:'7'}]}]}]}]};}});
 try{app.saveRequirementDraft(f.identity.task_id,f.command);app.reviewRequirement(f.identity.task_id,{version:'1.0',command_id:randomUUID(),expected_revision:1,confirmed:true});
 const command={version:'1.0',command_id:randomUUID(),expected_revision:'1',sources:[file]};const add=Reflect.get(app,'addRequirementMaterials');assert.equal(typeof add,'function');
 const saved=await add(f.identity.task_id,command);assert.equal(saved.identity.task_id,f.identity.task_id);assert.equal(saved.identity.revision,'2');assert.equal(saved.source.sources.length,f.store.read(f.identity.task_id)!.history![0]!.source.sources.length+1);assert.equal(saved.requirement_draft?.revision,1);assert.equal(saved.framework,null);assert.equal(saved.outcome,null);assert.equal(saved.state,'ready');assert.equal(saved.requirement_materials?.length,1);
 await assert.rejects(()=>app.startRequirement(f.identity.task_id,{version:'1.0',command_id:randomUUID(),expected_revision:1,confirmed:true}),{code:'FRAMEWORK_REVIEW_REQUIRED'});
 assert.deepEqual(await add(f.identity.task_id,command),saved);assert.equal(inspections,1);
 await assert.rejects(()=>add(f.identity.task_id,{...command,sources:[{...file,bytes:Buffer.from('changed')}]}),{code:'COMMAND_CONFLICT'});assert.equal(inspections,1);
 }finally{await app.close();}
});
test('RS-05: stopped unstarted requirement resumes only its saved draft without credentials, model or calculation',async()=>{
 const root=mkdtempSync(join(browserEvidenceRoot,'requirement-resume-'));let authorizations=0;
 const app=createPersonalOpenAnalysisWorkspace({projectRoot:root,runtime:{run:async()=>assert.fail('draft resume cannot call model')},inspect:async()=>assert.fail('no selected files'),authorizeConfiguration:async()=>{authorizations++;throw Object.assign(Error('credential unavailable'),{code:'KEY_REQUIRED'});}});
 try{
  const task=await app.submit({version:'1.0',command_id:randomUUID(),question:'先整理需求',confirmed:true,mode:'requirements',sources:[]});
  const f=draftFixture();app.saveRequirementDraft(task.identity.task_id,f.command);app.stop(task.identity.task_id);
  assert.equal(app.read(task.identity.task_id).state,'stopped');
  const resumed=await app.resume(task.identity.task_id);await app.collect();
  assert.equal(resumed.state,'ready');assert.equal(authorizations,0);assert.equal(resumed.framework,null);assert.equal(resumed.outcome,null);
  assert.equal(resumed.requirement_draft?.revision,1);assert.equal(app.requests(task.identity.task_id).length,0);
 }finally{await app.close();}
});
test('RS-04: requirements-only creation and manual save remain available without model credentials',async()=>{
 const root=mkdtempSync(join(browserEvidenceRoot,'requirement-manual-'));let authorizations=0;
 const app=createPersonalOpenAnalysisWorkspace({projectRoot:root,runtime:{run:async()=>assert.fail('manual path cannot call model')},inspect:async()=>assert.fail('no selected files'),authorizeConfiguration:async()=>{authorizations++;throw Object.assign(Error('credential unavailable'),{code:'KEY_REQUIRED'});}});
 try{const task=await app.submit({version:'1.0',command_id:randomUUID(),question:'先整理需求',confirmed:true,mode:'requirements',sources:[]});const f=draftFixture();app.saveRequirementDraft(task.identity.task_id,f.command);assert.equal(authorizations,0);assert.equal(app.read(task.identity.task_id).state,'ready');assert.equal(app.read(task.identity.task_id).requirement_draft?.conversation,undefined);assert.equal(app.requests(task.identity.task_id).length,0);}finally{await app.close();}
});
test('RS-01/05: requirements-only entry creates one durable task without starting analysis or inspecting absent files',async()=>{
 const root=mkdtempSync(join(browserEvidenceRoot,'requirement-entry-'));
 const config={projectRoot:root,runtime:{run:async()=>assert.fail('requirements creation cannot start model or compute')},inspect:async()=>assert.fail('absent files must not be inspected'),authorizeConfiguration:async()=>({config_sha256:'b'.repeat(64)})};
 const app=createPersonalOpenAnalysisWorkspace(config),command={version:'1.0',command_id:randomUUID(),question:'先帮我理清经营分析需求',confirmed:true,mode:'requirements',sources:[]};
 try{
  const first=await app.submit(command);assert.equal(first.identity.task_id,command.command_id);assert.equal(first.state,'ready');assert.equal(first.outcome,null);assert.equal(first.framework,null);
  await app.collect();assert.equal(app.read(command.command_id).state,'ready');assert.equal(app.requests(command.command_id).length,0);
  assert.deepEqual(await app.submit(command),first);
  const reopened=createPersonalOpenAnalysisWorkspace(config);try{assert.deepEqual(reopened.read(command.command_id),first);}finally{await reopened.close();}
  await assert.rejects(()=>app.submit({...command,mode:'analysis'}),{code:'COMMAND_CONFLICT'});
 }finally{await app.close();}
});

test('RS-02/03/05: actual framework tool saves natural dialogue; next answer changes methods and evidence without computation',async()=>{
 const f=draftFixture();let calls=0;
 const app=createOpenAnalysisWorkspace({store:f.store,ledger:createLocalAnalysisRequestLedger({projectRoot:f.root}),verify:verifyOpenAnalysisIntegerSum,inspect:async()=>assert.fail('dialogue cannot discover files'),authorizeConfiguration:async()=>({config_sha256:f.identity.config_sha256}),runtime:{run:async input=>{
  calls++;assert.equal(input.purpose,'proposal_prepare');assert.equal(input.tools.length,1);assert.equal(input.tools[0].name,'update_requirement_framework');assert.ok(input.authorize());
  const purpose=calls===1?'解释变化':'判断先调查权益还是触达';
  const content={...f.command.content,business:compileOpenBusinessProposal({purpose,object:'会员',scope:'2026年8月与9月',deliverables:['调查安排与限制'],hypotheses:[],unknowns:['缺少获准的触达及权益使用记录']}),methods:calls===1?['两期同口径描述比较']:['先比较两期，再核对权益与触达线索'],evidence:calls===1?['两期订单与会员']:['两期订单与会员','权益使用及触达记录'],previews:[{possibility:'insufficient' as const,answer:'若只有订单，无法区分权益与触达解释',needs:['权益使用与触达记录'],impact:'只完成描述比较，保留原因未知'}]};
  if(calls===2){assert.match(input.prompt,/解释变化/);assert.match(input.prompt,/先比较变化在哪里/);assert.match(input.prompt,/先调查权益还是触达/);}
  await input.tools[0].execute({content,reply:calls===1?'先比较变化在哪里；你要解释变化，还是确定调查重点？':'已改为确定调查重点；需要权益使用和触达记录才能区分候选。'},input.signal);
  assert.equal(input.shouldYield?.(),true);return {text:'',tools:[]};
 }}});
 try{
  const discuss=Reflect.get(app,'discussRequirement');assert.equal(typeof discuss,'function','workspace must provide real model-driven requirement co-creation');
  const firstCommand={version:'1.0',command_id:randomUUID(),expected_sequence:0,message:'8月和9月会员变化，先帮我理清'};
  const first=await discuss(f.identity.task_id,firstCommand);assert.ok(first.requirement_draft?.conversation);assert.equal(first.requirement_draft.revision,1);assert.equal(first.requirement_draft.conversation[0].user.text,firstCommand.message);assert.match(first.requirement_draft.conversation[0].assistant.text,/先比较变化在哪里/);
  const second=await discuss(f.identity.task_id,{version:'1.0',command_id:randomUUID(),expected_sequence:1,message:'我要判断先调查权益还是触达'});
  assert.ok(second.requirement_draft?.conversation);assert.equal(second.requirement_draft.revision,2);assert.equal(second.requirement_draft.history[0].content.business.purpose,'解释变化');assert.deepEqual(second.requirement_draft.content.evidence,['两期订单与会员','权益使用及触达记录']);assert.equal(second.requirement_draft.conversation.length,2);
  assert.equal(second.framework,null);assert.equal(second.outcome,null);assert.equal(second.state,'ready');assert.deepEqual(second.identity,f.identity);
  assert.deepEqual(await discuss(f.identity.task_id,firstCommand),second);assert.equal(calls,2,'retry must read durable receipt, not repeat the model');
  const readback=createLocalOpenAnalysisStore({projectRoot:f.root}).read(f.identity.task_id);assert.deepEqual(readback,second);
  assert.ok(readback);const view=openTaskView(readback);assert.deepEqual(view.messages,[{role:'user',text:firstCommand.message},{role:'assistant',text:'先比较变化在哪里；你要解释变化，还是确定调查重点？'},{role:'user',text:'我要判断先调查权益还是触达'},{role:'assistant',text:'已改为确定调查重点；需要权益使用和触达记录才能区分候选。'}]);assert.equal(view.report,null);
  const html=renderQuickAnalysisWorkbench({project:'本机项目',tasks:[],current:view,detail:'context',drawer:false});assert.match(html,/已改为确定调查重点/);assert.match(html,/已保存/);
 }finally{await app.close();}
});

test('RSUI-01/02/05: actual browser route admits authorized co-creation and passive read keeps its saved dialogue',async()=>{
 const f=draftFixture();let calls=0;
 const open=createPersonalOpenAnalysisWorkspace({projectRoot:f.root,inspect:async()=>assert.fail('no new material inspection'),authorizeConfiguration:async()=>({config_sha256:f.identity.config_sha256}),runtime:{run:async input=>{calls++;assert.equal(input.tools.length,1);await input.tools[0].execute({content:f.command.content,reply:'你更希望解释变化，还是确定调查重点？'},input.signal);return {text:'',tools:[]};}}});
 const unused=async():Promise<never>=>assert.fail('membership route is outside this check');
 const server=await startBrowserMembershipServer({open,store:{readBrowserReportCopy:unused,readBrowserTask:unused,readBrowserReceipt:unused,stopBrowserTask:unused}});
 try{
  const boot=await fetch(server.origin+'/v1/bootstrap',{method:'POST',headers:{'content-type':'application/json',origin:server.origin},body:JSON.stringify({token:server.bootstrap})});assert.equal(boot.status,200);
  const cookie=boot.headers.get('set-cookie')!.split(';')[0]!,control=(await boot.json()).control;
  const headers={'content-type':'application/json',cookie,origin:server.origin,'x-xanthil-control':control,'x-xanthil-view':'browser-v1'},path='/v1/open-analysis/'+f.identity.task_id+'/requirement-discussion';
  const command={version:'1.0',command_id:randomUUID(),expected_sequence:0,message:'先帮我理清分析目的'};
  const denied=await fetch(server.origin+path,{method:'POST',headers:{...headers,'x-xanthil-control':'wrong'},body:JSON.stringify(command)});assert.equal(denied.status,403);assert.equal(calls,0);
  const response=await fetch(server.origin+path,{method:'POST',headers,body:JSON.stringify(command)});assert.equal(response.status,200);const task=await response.json();assert.equal(task.requirement_draft.conversation[0].user.text,command.message);assert.equal(task.outcome,null);assert.equal(task.framework,null);
  const read=await fetch(server.origin+'/v1/open-analysis/'+f.identity.task_id,{headers});assert.deepEqual((await read.json()).requirement_draft,task.requirement_draft);assert.equal(calls,1);
  const reviewCommand={version:'1.0',command_id:randomUUID(),expected_revision:1,confirmed:true},reviewPath='/v1/open-analysis/'+f.identity.task_id+'/requirement-review';assert.equal((await fetch(server.origin+reviewPath,{method:'POST',headers:{...headers,'x-xanthil-control':'wrong'},body:JSON.stringify(reviewCommand)})).status,403);const review=await fetch(server.origin+reviewPath,{method:'POST',headers,body:JSON.stringify(reviewCommand)});assert.equal(review.status,200);assert.equal((await review.json()).requirement_reviews.length,1);assert.equal(calls,1);
  const start=await fetch(server.origin+'/v1/open-analysis/'+f.identity.task_id+'/requirement-start',{method:'POST',headers,body:JSON.stringify({...reviewCommand,command_id:randomUUID()})});assert.equal(start.status,400);assert.match((await start.json()).reason,/还没有分析资料/);assert.equal(calls,1);
  assert.equal((await fetch(server.origin+path,{method:'POST',headers,body:JSON.stringify(command)})).status,200);assert.equal(calls,1);
 }finally{await server.close();await open.close();}
});

test('V12 RSUI-05/09: acknowledged same-task draft and its qualitative previews read back in both modes without becoming a result',async()=>{
 const clientModule='../../../apps/browser/quick-analysis-client.mjs', {openTaskView}=await import(clientModule);
 const root=mkdtempSync(join(browserEvidenceRoot,'requirement-display-')),source={version:'1.0' as const,sources:[]},identity={task_id:randomUUID(),revision:'1',run_id:randomUUID(),attempt_id:randomUUID(),operation_id:randomUUID(),grant_id:randomUUID(),scope_sha256:taskHash(source),config_sha256:'b'.repeat(64)};
 const store=createLocalOpenAnalysisStore({projectRoot:root});store.create({identity,question:'先理清经营问题',source});
 const content={business:compileOpenBusinessProposal({purpose:'解释会员变化',object:'会员',scope:'当前获准资料',deliverables:['变化与限制'],hypotheses:[],unknowns:['期间待补充']}),methods:['同口径比较'],evidence:['会员与订单资料'],previews:[{possibility:'insufficient' as const,answer:'资料可能不足以解释原因 <script>',needs:['触达记录'],impact:'先描述变化，不判断因果'}]};
 store.saveRequirementDraft(identity.task_id,{version:'1.0',command_id:randomUUID(),expected_sequence:0,content,message:'先保存，不分析'});
 const task=createLocalOpenAnalysisStore({projectRoot:root}).read(identity.task_id);assert.ok(task);const view=openTaskView(task);
 assert.equal(view.requirementDraft?.revision,1,'shared task view must consume the actual saved draft');assert.equal(view.requirementDraft?.sequence,1);assert.equal(view.framework,null);assert.equal(view.report,null);assert.deepEqual(task.identity,identity);
 for(const mode of ['quick','pro'] as const){
  const html=renderQuickAnalysisWorkbench({mode,stage:'home',project:'本机',tasks:[],current:view,detail:'context',drawer:false});
  assert.match(html,/查看完整方案/);assert.match(html,/方案 1/);assert.match(html,/看看是否符合你的想法/);assert.doesNotMatch(html,/报告已保存|核验通过|<script>/);
  const expanded=renderQuickAnalysisWorkbench({mode,stage:'home',project:'本机',tasks:[],current:view,detail:'context',drawer:false,expanded:'requirement'});
  assert.match(expanded,/同口径比较/);assert.match(expanded,/会员与订单资料/);assert.match(expanded,/<details[^>]*><summary>预演不同答案/);assert.match(expanded,/可能的解释，还需要资料验证/);assert.match(expanded,/&lt;script&gt;/);assert.doesNotMatch(expanded,/<details[^>]*open/);
  if(mode==='pro')assert.equal((expanded.match(/data-stage=/g)??[]).length,6);
 }
 view.requirementDraft.content.business.purpose='caller mutation';const readback=store.read(identity.task_id);assert.ok(readback?.requirement_draft);assert.equal(readback.requirement_draft.content.business.purpose,'解释会员变化');
 assert.equal(openTaskView({...task,requirement_draft:{...task.requirement_draft,receipts:[]}}).requirementDraft,null,'unacknowledged draft must not be labelled saved');
 const changed={...content,business:compileOpenBusinessProposal({purpose:'判断调查重点',object:'会员',scope:'当前获准资料',deliverables:['变化与限制'],hypotheses:[],unknowns:['期间待补充']})};
 store.saveRequirementDraft(identity.task_id,{version:'1.0',command_id:randomUUID(),expected_sequence:1,content:changed,message:'改为调查重点'});
 store.saveRequirementDraft(identity.task_id,{version:'1.0',command_id:randomUUID(),expected_sequence:2,content:changed,message:'只是换个说法'});
 const next=store.read(identity.task_id);assert.ok(next);const nextView=openTaskView(next);assert.equal(nextView.requirementDraft.revision,2);assert.equal(nextView.requirementDraft.sequence,3);
 const history=renderQuickAnalysisWorkbench({project:'本机',tasks:[],current:nextView,detail:'context',drawer:false,expanded:'requirement'});assert.match(history,/查看之前的方案/);assert.match(history,/判断调查重点/);assert.match(history,/解释会员变化/);assert.equal(nextView.framework,null);assert.equal(nextView.report,null);
});

test('V12-01/03: no-file task can persist a requirement framework without execution or new authority',()=>{
 const root=mkdtempSync(join(browserEvidenceRoot,'requirement-draft-'));
 const source={version:'1.0' as const,sources:[]};
 const identity={task_id:randomUUID(),revision:'1',run_id:randomUUID(),attempt_id:randomUUID(),operation_id:randomUUID(),grant_id:randomUUID(),scope_sha256:taskHash(source),config_sha256:'b'.repeat(64)};
 const store=createLocalOpenAnalysisStore({projectRoot:root});const original=store.create({identity,question:'先帮我理清会员经营分析需求',source});
 const save=Reflect.get(store,'saveRequirementDraft');assert.equal(typeof save,'function','non-executing draft save must exist');
 const content={business:compileOpenBusinessProposal({purpose:'解释近期会员效果变化',object:'会员',scope:'期间待补充',deliverables:['描述变化与证据限制'],hypotheses:[],unknowns:['比较期间']}),methods:['同口径比较'],evidence:['订单与会员资料'],previews:[]};
 const command={version:'1.0',command_id:randomUUID(),expected_sequence:0,content,message:'先整理需求，暂不分析'};
 const saved=save(identity.task_id,command);
 assert.ok(saved.requirement_draft);assert.equal(saved.requirement_draft.revision,1);assert.equal(saved.requirement_draft.sequence,1);
 assert.deepEqual(saved.identity,identity);assert.equal(saved.state,original.state);assert.equal(saved.epoch,0);assert.equal(saved.framework,null);assert.equal(saved.outcome,null);
 const reopened=createLocalOpenAnalysisStore({projectRoot:root});assert.deepEqual(reopened.read(identity.task_id),saved);
 assert.deepEqual(Reflect.get(reopened,'saveRequirementDraft')(identity.task_id,command),saved);
});

function draftFixture(entry_mode?:'requirements'){
 const root=mkdtempSync(join(browserEvidenceRoot,'requirement-draft-contract-')),source={version:'1.0' as const,sources:[]};
 const identity={task_id:randomUUID(),revision:'1',run_id:randomUUID(),attempt_id:randomUUID(),operation_id:randomUUID(),grant_id:randomUUID(),scope_sha256:taskHash(source),config_sha256:'b'.repeat(64)};
 const store=createLocalOpenAnalysisStore({projectRoot:root});store.create({identity,question:'先理清需求',source,...(entry_mode?{entry_mode}:{})});
 const content={business:compileOpenBusinessProposal({purpose:'解释会员效果变化',object:'会员',scope:'全部会员',deliverables:['描述变化'],hypotheses:[],unknowns:['期间']}),methods:['同口径比较'],evidence:['会员资料'],previews:[]};
 return {root,identity,store,command:{version:'1.0',command_id:randomUUID(),expected_sequence:0,content,message:'先整理'}};
}

function draftWorkspace(fixture:ReturnType<typeof draftFixture>){
 const ledger=createLocalAnalysisRequestLedger({projectRoot:fixture.root});
 const app=createOpenAnalysisWorkspace({store:fixture.store,ledger,verify:verifyOpenAnalysisIntegerSum,
  runtime:{run:async()=>assert.fail('saving a framework must not call a model')},
  inspect:async()=>assert.fail('saving a framework must not read materials'),
  authorizeConfiguration:async()=>assert.fail('saving a framework must not read credentials or grant execution')});
 return {app,ledger};
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

test('V12-03/RT04: draft save does not replace input while a physical request remains unconfirmed',async()=>{
 const f=draftFixture(),{app,ledger}=draftWorkspace(f),save=Reflect.get(app,'saveRequirementDraft');
 assert.equal(typeof save,'function');const before=app.read(f.identity.task_id);
 ledger.reserve({...f.identity,input_sha256:'c'.repeat(64),provider:'minimax-cn',model:'MiniMax-M3'});
 try{assert.throws(()=>save(f.identity.task_id,f.command),{code:'PHYSICAL_PENDING'});assert.deepEqual(app.read(f.identity.task_id),before);}finally{await app.close();}
});

test('V12-03: actual browser control saves and reads a draft without model/credentials/material execution',async()=>{
 const f=draftFixture(),open=createPersonalOpenAnalysisWorkspace({projectRoot:f.root,
  runtime:{run:async()=>assert.fail('draft HTTP must not execute a model')},
  inspect:async()=>assert.fail('draft HTTP must not inspect materials'),
  authorizeConfiguration:async()=>assert.fail('draft HTTP must not read credentials')});
 const unused=async():Promise<never>=>assert.fail('membership readback is not used by a requirement save');
 const server=await startBrowserMembershipServer({open,store:{readBrowserReportCopy:unused,readBrowserTask:unused,readBrowserReceipt:unused,stopBrowserTask:unused}});
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
  const saved=await fetch(server.origin+path,{method:'POST',headers,body:JSON.stringify(f.command)});assert.equal(saved.status,200,'production HTTP save route must acknowledge the same-task draft');const value=await saved.json();assert.equal(value.requirement_draft.sequence,1);assert.equal(value.framework,null);assert.equal(value.outcome,null);
  const retry=await fetch(server.origin+path,{method:'POST',headers,body:JSON.stringify(f.command)});assert.equal(retry.status,200);assert.deepEqual(await retry.json(),value);
  const conflict=await fetch(server.origin+path,{method:'POST',headers,body:JSON.stringify({...f.command,message:'conflicting retry'})});assert.equal(conflict.status,409);
  const read=await fetch(server.origin+'/v1/open-analysis/'+f.identity.task_id,{headers:{cookie,'x-xanthil-view':'browser-v1'}});assert.equal(read.status,200);assert.deepEqual(await read.json(),value);
  assert.deepEqual(open.requests(f.identity.task_id),[]);
 }finally{await server.close();await open.close();}
});

test('V12-03: receipt conflict and stale autosave preserve committed data and permit explicit retry',()=>{
 const {root,identity,store,command}=draftFixture();const first=store.saveRequirementDraft(identity.task_id,command);
 assert.throws(()=>store.saveRequirementDraft(identity.task_id,{...command,message:'different body'}),{code:'COMMAND_CONFLICT'});
 const stale={...command,command_id:randomUUID(),message:'later edit'};
 assert.throws(()=>store.saveRequirementDraft(identity.task_id,stale),{code:'REVISION_CONFLICT'});
 assert.deepEqual(createLocalOpenAnalysisStore({projectRoot:root}).read(identity.task_id),first);
 const retry=store.saveRequirementDraft(identity.task_id,{...stale,expected_sequence:1});assert.equal(retry.requirement_draft?.sequence,2);assert.equal(retry.requirement_draft?.revision,1);
});

test('V12-03/04: real business edits version drafts; wording alone retains the business version',()=>{
 const {identity,store,command}=draftFixture();store.saveRequirementDraft(identity.task_id,command);
 const same=store.saveRequirementDraft(identity.task_id,{...command,command_id:randomUUID(),expected_sequence:1,message:'换一种说法'});
 assert.equal(same.requirement_draft?.revision,1);assert.equal(same.requirement_draft?.history.length,0);
 const changed={...command.content,business:{...command.content.business,scope:'北区会员'},methods:['分地区比较'],evidence:['订单与会员关联资料']};
 const next=store.saveRequirementDraft(identity.task_id,{...command,command_id:randomUUID(),expected_sequence:2,content:changed});
 assert.equal(next.requirement_draft?.revision,2);assert.deepEqual(next.requirement_draft?.history,[{revision:1,content:command.content}]);
 assert.equal(next.identity.revision,'1');assert.equal(next.epoch,0);assert.equal(next.framework,null);assert.equal(next.outcome,null);
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
 assert.throws(()=>store.saveRequirementDraft(identity.task_id,{...command,content:{...command.content,previews:[{possibility:'verified',answer:'Profit is proven',needs:[],impact:'Execute'}]}}),{code:'DRAFT_INVALID'});
 assert.deepEqual(store.read(identity.task_id),before);
});

test('SDK041-FIX01 preparation control accepts an authorized queued input and refuses a position change while preparing',async()=>{
 const f=draftFixture();let enter!:()=>void,release!:()=>void;const entered=new Promise<void>(r=>enter=r),held=new Promise<void>(r=>release=r);let controls=0;
 const app=createOpenAnalysisWorkspace({store:f.store,ledger:createLocalAnalysisRequestLedger({projectRoot:f.root}),verify:verifyOpenAnalysisIntegerSum,inspect:async()=>assert.fail('no files'),authorizeConfiguration:async()=>({config_sha256:f.identity.config_sha256}),runtime:{run:async input=>{enter();await held;await input.tools[0].execute({content:f.command.content,reply:'已保存需求'},input.signal);return {text:'',tools:[]};},sessionControl:async input=>{assert.ok(input.authorize());controls++;return {entryId:'synthetic-queued'};}}});
 const pending=app.discussRequirement(f.identity.task_id,{version:'1.0',command_id:randomUUID(),expected_sequence:0,message:'先理清需求'});await entered;
 try{
  const command=(command:Record<string,unknown>)=>app.sessionControl(f.identity.task_id,{version:'1.0',expected_revision:'1',command});
  assert.equal((await command({kind:'steer',text:'保持当前获准范围'})).entryId,'synthetic-queued');
  await assert.rejects(command({kind:'fork'}),{code:'TASK_UNCONFIRMED'});
  await assert.rejects(command({kind:'navigate',entryId:null,summarize:false}),{code:'TASK_UNCONFIRMED'});assert.equal(controls,1);
 }finally{release();await pending;await app.close();}
});
