import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync,writeFileSync,symlinkSync,renameSync,mkdirSync,cpSync} from 'node:fs';
import {join} from 'node:path';
import {randomUUID,createHash} from 'node:crypto';
import {createPiProfessionalAgent} from '../../../adapters/agent-pi/professional-agent.ts';
import {offlineCredentials,offlineResponse,packet} from '../../fixtures/xanthil-desktop/offline-professional-provider.ts';

// NR03: real product Adapter, native tools, fixed SDK and real file authority.
// Only the Provider reply is synthetic. No host-selected correction or replay.
for(const offset of [8,9])test('NR03-01: native read offset '+offset+' preserves bounded feedback and Agent-selected continuation',async()=>{
 const root=mkdtempSync(join(process.env.JUANERAI_NEWARCH_SHORT_ROOT!,'read-')),task=randomUUID(),path=join(root,'analyses',task,'020_clean/source/eight.txt');
 const content=Array.from({length:8},(_,i)=>'line-'+(i+1)).join('\n');let calls=0,feedback='';
 const agent=createPiProfessionalAgent({projectRoot:root,analysisModel:'mimo-v2.6-flash',credentials:offlineCredentials,authorizeWork:()=>true,fetch:async(_url,init)=>{
  const dto=JSON.parse(String(init!.body));calls++;
  if(calls===1)return offlineResponse(calls,[{name:'read',args:{path,offset,limit:1}}]);
  if(offset===9&&calls===2){
   feedback=JSON.stringify(dto.messages);
   assert.match(feedback,/beyond end of file/,'the actual native reason reaches Pi, not just TOOL_FAILED');
   assert.match(feedback,/8 lines total/);
   return offlineResponse(calls,[{name:'read',args:{path,offset:8,limit:1}}]);
  }
  assert.match(JSON.stringify(dto.messages),/line-8/);
  return offlineResponse(calls,[],'Read the existing final line; no report verification claimed.');
 }});
 const identity={task_id:task,revision:'1',run_id:randomUUID(),attempt_id:randomUUID(),operation_id:randomUUID(),grant_id:randomUUID(),scope_sha256:'a'.repeat(64),config_sha256:await agent.configuration()};
 let failure:unknown;
 try{
  const result=await agent.advance({identity,work_id:task,command_id:randomUUID(),purpose:'requirement_design',prompt:'Read the approved file',system:'Synthetic native read contract',materials:[{path,content}],capabilities:async()=>[],authorize:()=>true,signal:new AbortController().signal});
  await agent.assertCompleted(identity,result.completion);
 }catch(error){failure=error;}
 await agent.waitForIdle();
 const facts=await agent.diagnostics(identity,'requirement_design');
 console.log(JSON.stringify({case:'NR03-01',offset,calls,failure:failure instanceof Error?{...failure,message:failure.message}:failure,facts}));
 assert.equal(failure,undefined,'known native read rejection must not terminate the first correction opportunity');
 assert.equal(calls,offset===9?3:2);assert.equal(facts.unconfirmed_effects,false);
 assert.equal(readFileSync(path,'utf8'),content);
});

test('NR03-04: real Workspace consumes native EOF feedback, saves R0, completes postchecks and passively reopens',async()=>{
 const {createPersonalOpenAnalysisWorkspace}=await import('../../../profiles/personal/open-analysis.ts');
 const {postReportProvider}=await import('../../fixtures/xanthil-desktop/report-postprocessing-provider.ts');
 const root=mkdtempSync(join(process.env.JUANERAI_NEWARCH_SHORT_ROOT!,'read-workspace-'));
 const bytes=Buffer.from('id,amount\na,11\nb,19\n'),source_id=randomUUID(),sha256=createHash('sha256').update(bytes).digest('hex');
 const provider=postReportProvider({initial:'# 当前样本\n\n金额合计为30 CNY。'});
 let taskRoot='',calls=0,lastLine=0,path='',r0ObservedBeforePostcheck=false;
 const options={projectRoot:root,analysisModel:'mimo-v2.6-flash' as const,judgmentReview:true,credentials:offlineCredentials,
  inspect:async()=>({version:'1.0' as const,sources:[{source_id,display_name:'source.csv',format:'csv' as const,sha256,byte_length:String(bytes.length),sheets:[{sheet_id:'csv',name:'CSV',state:'visible' as const,rows:[['id','amount'],['a','11'],['b','19']].map((values,index)=>({row:index+1,cells:values.map((value,column)=>({column:String.fromCharCode(65+column),value,type:'string' as const}))}))}]}]}),
  fetch:(async(url,init)=>{
   calls++;const dto=JSON.parse(String(init!.body));
   if(calls===1){
    path=join(taskRoot,'020_clean','source',source_id,sha256,'sheet','csv','table.txt');
    assert.ok(JSON.stringify(dto.messages).includes(path));lastLine=readFileSync(path,'utf8').split('\n').length;
    return offlineResponse(calls,[{name:'read',args:{path,offset:lastLine+1,limit:1}}]);
   }
   if(calls===2){
    assert.ok(JSON.stringify(dto.messages).includes(`Offset ${lastLine+1} is beyond end of file (${lastLine} lines total)`));
    return offlineResponse(calls,[{name:'read',args:{path,offset:lastLine,limit:1}}]);
   }
   if(provider.calls()===2){
    const saved=app.read(taskId);assert.equal(saved.state,'saved');
    assert.equal(readFileSync(join(taskRoot,'060_reports',saved.model_report!.outcome_id+'.md'),'utf8'),saved.model_report!.text);
    r0ObservedBeforePostcheck=true;
   }
   return provider.fetch(url,init);
  }) as typeof globalThis.fetch};
 const app=createPersonalOpenAnalysisWorkspace(options);let taskId='',saved:ReturnType<typeof app.read>|undefined,meter:unknown;
 try{
  const task=await app.submit({version:'1.0',command_id:randomUUID(),question:'核对当前样本金额，不执行业务行动。',confirmed:true,sources:[{source_id,display_name:'source.csv',format:'csv',bytes}]});
  taskId=task.identity.task_id;taskRoot=join(root,'analyses',taskId);
  await app.start(taskId);await app.waitForIdle();saved=app.read(taskId);
  const facts=await app.diagnostics(taskId);console.log(JSON.stringify({case:'NR03-04',calls,state:saved.state,postcheck:saved.report_postprocessing?.state,facts}));
  assert.equal(saved.state,'saved');assert.equal(saved.report_postprocessing?.state,'completed');assert.equal(r0ObservedBeforePostcheck,true);
  assert.equal(facts.unconfirmed_effects,false);meter=facts.meter;
  assert.equal(calls,provider.calls()+2,'only explicit synthetic Agent continuation added; no host replay');
  assert.ok(provider.requests.some(r=>r.phase==='report-number-recompute.v1'));
  assert.ok(provider.requests.some(r=>r.phase==='report-full-review.v1'));
 }finally{await app.close();}
 const count=calls,reopened=createPersonalOpenAnalysisWorkspace({...options,fetch:async()=>assert.fail('passive reopening must not execute')});
 try{
  assert.deepEqual(reopened.read(taskId),saved);assert.deepEqual((await reopened.diagnostics(taskId)).meter,meter);
  assert.equal((await reopened.diagnostics(taskId)).unconfirmed_effects,false);assert.equal(await reopened.physicalPending(),false);assert.equal(calls,count);
  for(const edition of saved!.report_postprocessing!.editions)assert.equal(readFileSync(join(taskRoot,'060_reports',saved!.model_report!.outcome_id+(edition.version?'.R'+edition.version:'')+'.md'),'utf8'),edition.text);
 }finally{await reopened.close();}
});

test('RP01-05: Workspace postcheck consumes native missing-file feedback in an approved source-view directory without replaying completed reads',async()=>{
 const {createPersonalOpenAnalysisWorkspace}=await import('../../../profiles/personal/open-analysis.ts');
 const {postReportProvider}=await import('../../fixtures/xanthil-desktop/report-postprocessing-provider.ts');
 const root=mkdtempSync(join(process.env.JUANERAI_NEWARCH_SHORT_ROOT!,'source-miss-')),source_id=randomUUID(),bytes=Buffer.from('id,amount,currency\na,11,CNY\nb,19,CNY\n'),sha256=createHash('sha256').update(bytes).digest('hex');
 const provider=postReportProvider({initial:'# 有限观察\n\n金额合计为30 CNY。\n\n原因未知，建议补证。'});let calls=0,injected=false,corrected=false,feedback='',directory='',table='',rows='',sheets='';
 const options={projectRoot:root,analysisModel:'mimo-v2.6-flash' as const,judgmentReview:true,credentials:offlineCredentials,
  inspect:async()=>({version:'1.0' as const,sources:[{source_id,display_name:'source.csv',format:'csv' as const,sha256,byte_length:String(bytes.length),sheets:[{sheet_id:'csv',name:'CSV',state:'visible' as const,rows:[['id','amount','currency'],['a','11','CNY'],['b','19','CNY']].map((v,i)=>({row:i+1,cells:v.map((value,c)=>({column:String.fromCharCode(65+c),value,type:'string' as const}))}))}]}]}),
  fetch:async(url:Parameters<typeof globalThis.fetch>[0],init?:RequestInit)=>{calls++;const dto=JSON.parse(String(init!.body)),coordinator=packet(dto,'JuanerAI.report-postcheck.v1')!==undefined;
   if(coordinator&&provider.calls()===2&&!injected){injected=true;writeFileSync(join(table,'..','unregistered-audit-note.txt'),'synthetic note; directory identity is unchanged');return offlineResponse(1000+calls,[{name:'read',args:{path:table}},{name:'read',args:{path:rows}},{name:'read',args:{path:join(directory,'020_clean/source',source_id,sha256,'sheet/csv/sheets.txt')}},{name:'verify_numbers',args:{}}]);}
   if(coordinator&&injected&&!corrected){corrected=true;feedback=JSON.stringify(dto);return offlineResponse(1000+calls,[{name:'read',args:{path:sheets}}]);}
   return provider.fetch(url,init);
  }};
 const app=createPersonalOpenAnalysisWorkspace(options);let taskId='',saved:ReturnType<typeof app.read>|undefined,meter:unknown;
 try{const task=await app.submit({version:'1.0',command_id:randomUUID(),question:'核对本份CSV金额，原因缺失只限制解释，不执行业务行动。',confirmed:true,sources:[{source_id,display_name:'source.csv',format:'csv',bytes}]});taskId=task.identity.task_id;directory=join(root,'analyses',taskId);const base=join(directory,'020_clean/source',source_id,sha256);table=join(base,'sheet/csv/table.txt');rows=join(base,'sheet/csv/rows.txt');sheets=join(base,'sheets.txt');await app.start(taskId);await app.waitForIdle();saved=app.read(taskId);const facts=await app.diagnostics(taskId);
  assert.equal(saved.state,'saved');assert.equal(saved.report_postprocessing?.state,'completed',JSON.stringify(saved.report_postprocessing));assert.equal(corrected,true);assert.match(feedback,/not_found|not found|Host file operation failed/,'actual native missing-file feedback reaches Pi');assert.equal(facts.unconfirmed_effects,false);assert.equal(facts.meter!.unconfirmed_output_tokens,0);assert.ok(facts.observations.some(o=>o.kind==='tool'&&o.name==='read'&&o.file_failure_category==='not_found'&&o.completion==='not_started'));
  const parent=saved.report_postprocessing!.notes.find(n=>n.role==='coordinator')!.completion;for(const path of [table,rows])assert.equal(parent.resource_reads!.filter(r=>r.path===path).length,1,'completed reads must not be replayed');assert.equal(parent.resource_reads!.filter(r=>r.path===sheets).length,1);assert.equal(calls,provider.calls()+2,'only Agent-chosen correction adds requests');meter=facts.meter;
 }finally{await app.close();}
 const count=calls,reopened=createPersonalOpenAnalysisWorkspace({...options,fetch:async()=>assert.fail('passive reopen must not execute')});try{assert.deepEqual(reopened.read(taskId),saved);assert.deepEqual((await reopened.diagnostics(taskId)).meter,meter);assert.equal(calls,count);}finally{await reopened.close();}
});

for(const kind of ['existing_unapproved','wrong_hash','wrong_source','symlink','unapproved_asset','catalog_root','missing_registered_parent','replaced_registered_parent','new_directory_empty','new_directory_same_bytes','reparented_original_directory'] as const)test('RP01-05: missing-source feedback does not admit '+kind,async()=>{
 const root=mkdtempSync(join(process.env.JUANERAI_NEWARCH_SHORT_ROOT!,'source-deny-')),task=randomUUID(),source=randomUUID(),sha='a'.repeat(64),directory=join(root,'analyses',task),base=join(directory,'020_clean/source',source,sha),table=join(base,'sheet/csv/table.txt'),sentinel='UNAPPROVED_SYNTHETIC_CONTENT';let calls=0,target='',retainedTable=table;
 const agent=createPiProfessionalAgent({projectRoot:root,analysisModel:'mimo-v2.6-flash',credentials:offlineCredentials,authorizeWork:()=>true,fetch:async()=>{
  calls++;target=kind==='wrong_hash'?join(directory,'020_clean/source',source,'b'.repeat(64),'sheet/csv/missing.txt'):kind==='wrong_source'?join(directory,'020_clean/source',randomUUID(),sha,'sheet/csv/missing.txt'):kind==='unapproved_asset'?join(directory,'020_clean/metric-asset/definition.txt'):kind==='catalog_root'?join(directory,'020_clean/source/missing.txt'):join(base,'sheet/csv/unapproved.txt');
  if(calls===1&&['missing_registered_parent','replaced_registered_parent','new_directory_empty','new_directory_same_bytes'].includes(kind)){const saved=join(base,'saved-csv');renameSync(join(base,'sheet/csv'),saved);retainedTable=join(saved,'table.txt');if(kind==='replaced_registered_parent')writeFileSync(join(base,'sheet/csv'),'not a directory');if(kind==='new_directory_empty')mkdirSync(join(base,'sheet/csv'));if(kind==='new_directory_same_bytes')cpSync(saved,join(base,'sheet/csv'),{recursive:true});}
  if(calls===1&&kind==='reparented_original_directory'){const saved=base+'-retained';renameSync(base,saved);mkdirSync(join(base,'sheet'),{recursive:true});renameSync(join(saved,'sheet/csv'),join(base,'sheet/csv'));}
  if(calls===1&&kind==='existing_unapproved')writeFileSync(target,sentinel);if(calls===1&&kind==='symlink')symlinkSync(table,target);
  return calls===1?offlineResponse(calls,[{name:'read',args:{path:target}}]):offlineResponse(calls,[],'A forbidden read must not produce another request.');
 }});
 const identity={task_id:task,revision:'1',run_id:randomUUID(),attempt_id:randomUUID(),operation_id:randomUUID(),grant_id:randomUUID(),scope_sha256:'a'.repeat(64),config_sha256:await agent.configuration()};let failure:unknown;
 try{await agent.advance({identity,work_id:task,command_id:randomUUID(),purpose:'conclusion_strategy_review',prompt:'Use only approved source evidence.',system:'Synthetic source boundary',materials:[{path:table,content:'approved\n'},{path:join(directory,'020_clean/source/catalog.txt'),content:'approved catalog\n'},{path:join(directory,'020_clean/metric-asset/catalog.txt'),content:'disclosure_required\n'}],capabilities:async()=>[],authorize:()=>true,signal:new AbortController().signal});}catch(error){failure=error;}
 await agent.waitForIdle();const facts=await agent.diagnostics(identity,'conclusion_strategy_review');assert.ok(failure);assert.equal(calls,1);assert.equal(facts.unconfirmed_effects,true);assert.ok(facts.observations.some(o=>o.kind==='tool'&&o.name==='read'&&o.file_failure_category==='permission_denied'));assert.ok(!facts.observations.some(o=>o.kind==='tool'&&o.code==='NATIVE_PRECONDITION'));if(kind==='existing_unapproved')assert.equal(readFileSync(target,'utf8'),sentinel);assert.equal(readFileSync(retainedTable,'utf8'),'approved\n');
});

for(const stop of ['revoke','cancel'] as const)test('RP01-05: '+stop+' during the source absence probe cannot become a not-found correction',async()=>{
 const root=mkdtempSync(join(process.env.JUANERAI_NEWARCH_SHORT_ROOT!,'source-stop-')),task=randomUUID(),base=join(root,'analyses',task,'020_clean/source',randomUUID(),'a'.repeat(64),'sheet/csv'),table=join(base,'table.txt'),missing=join(base,'missing.txt'),controller=new AbortController();let authorized=true,calls=0,stopped=false;
 const agent=createPiProfessionalAgent({projectRoot:root,analysisModel:'mimo-v2.6-flash',credentials:offlineCredentials,authorizeWork:()=>true,fetch:async()=>{calls++;return calls===1?offlineResponse(calls,[{name:'read',args:{path:missing}}]):offlineResponse(calls,[],'Revoked or cancelled scope must stop.');}});
 const identity={task_id:task,revision:'1',run_id:randomUUID(),attempt_id:randomUUID(),operation_id:randomUUID(),grant_id:randomUUID(),scope_sha256:'a'.repeat(64),config_sha256:await agent.configuration()};let failure:unknown;
 try{await agent.advance({identity,work_id:task,command_id:randomUUID(),purpose:'conclusion_strategy_review',prompt:'Approved synthetic source only.',system:'Synthetic source stop boundary',materials:[{path:table,content:'approved\n'}],authorizeResources:async(_signal,path)=>{if(path===missing){stopped=true;if(stop==='revoke')authorized=false;else controller.abort();}},capabilities:async()=>[],authorize:()=>authorized,signal:controller.signal});}catch(error){failure=error;}
 await agent.waitForIdle();const facts=await agent.diagnostics(identity,'conclusion_strategy_review');assert.equal(stopped,true);assert.ok(failure);assert.equal(calls,1);assert.ok(!facts.observations.some(o=>o.kind==='tool'&&(o.file_failure_category==='not_found'||o.code==='NATIVE_PRECONDITION')));assert.equal(readFileSync(table,'utf8'),'approved\n');
});

for(const replacement of ['empty','same_bytes','ancestor_reparent'] as const)test('RP01-F002: Workspace stops when the loaded source directory identity changes: '+replacement,async()=>{
 const {createPersonalOpenAnalysisWorkspace}=await import('../../../profiles/personal/open-analysis.ts');
 const root=mkdtempSync(join(process.env.JUANERAI_NEWARCH_SHORT_ROOT!,'source-replace-')),source_id=randomUUID(),bytes=Buffer.from('id,amount\na,11\nb,19\n'),sha256=createHash('sha256').update(bytes).digest('hex'),report='# 有限报告\n\n金额30元，尚未独立核验。';let calls=0,directory='',retainedTable='';
 const options={projectRoot:root,analysisModel:'mimo-v2.6-flash' as const,judgmentReview:true,credentials:offlineCredentials,
  inspect:async()=>({version:'1.0' as const,sources:[{source_id,display_name:'source.csv',format:'csv' as const,sha256,byte_length:String(bytes.length),sheets:[{sheet_id:'csv',name:'CSV',state:'visible' as const,rows:[['id','amount'],['a','11'],['b','19']].map((v,i)=>({row:i+1,cells:v.map((value,c)=>({column:String.fromCharCode(65+c),value,type:'string' as const}))}))}]}]}),
  fetch:async()=>{calls++;if(calls===1)return offlineResponse(calls,[],'当前观察，缺因果证据。');if(calls===2)return offlineResponse(calls,[],report);
   const base=join(directory,'020_clean/source',source_id,sha256),parent=join(base,'sheet/csv'),saved=base+'-retained';
   if(calls===3){renameSync(base,saved);if(replacement==='ancestor_reparent'){mkdirSync(join(base,'sheet'),{recursive:true});renameSync(join(saved,'sheet/csv'),parent);retainedTable=join(parent,'table.txt');}else{if(replacement==='same_bytes')cpSync(saved,base,{recursive:true});else mkdirSync(parent,{recursive:true});retainedTable=join(saved,'sheet/csv/table.txt');}return offlineResponse(calls,[{name:'read',args:{path:join(parent,'not-registered.txt')}}]);}
   return offlineResponse(calls,[],'An invalid source namespace must not reach this request.');
  }};
 const app=createPersonalOpenAnalysisWorkspace(options);try{const task=await app.submit({version:'1.0',command_id:randomUUID(),question:'按本CSV分析，先保存报告后审查。',confirmed:true,sources:[{source_id,display_name:'source.csv',format:'csv',bytes}]});directory=join(root,'analyses',task.identity.task_id);await app.start(task.identity.task_id);await app.waitForIdle();const result=app.read(task.identity.task_id),facts=await app.diagnostics(task.identity.task_id);assert.equal(result.model_report!.text,report);assert.equal(calls,3,'a changed physical source namespace must stop before another model request');assert.equal(result.report_postprocessing!.state,'unknown');assert.equal(facts.unconfirmed_effects,true);assert.ok(facts.observations.some(o=>o.kind==='tool'&&o.name==='read'&&o.file_failure_category==='permission_denied'));assert.ok(!facts.observations.some(o=>o.kind==='tool'&&o.code==='NATIVE_PRECONDITION'));assert.ok(readFileSync(retainedTable,'utf8').includes('11'));}finally{await app.close();}
});

test('RP01-F002: a registered view cannot be read after its directory changes during the authorization callback',async()=>{
 const root=mkdtempSync(join(process.env.JUANERAI_NEWARCH_SHORT_ROOT!,'source-read-swap-')),task=randomUUID(),directory=join(root,'analyses',task),base=join(directory,'020_clean/source',randomUUID(),'a'.repeat(64),'sheet/csv'),table=join(base,'table.txt');let calls=0,replaced=false;
 const agent=createPiProfessionalAgent({projectRoot:root,analysisModel:'mimo-v2.6-flash',credentials:offlineCredentials,authorizeWork:()=>true,fetch:async()=>{calls++;return calls===1?offlineResponse(calls,[{name:'read',args:{path:table}}]):offlineResponse(calls,[],'An invalid source namespace must not continue.');}});
 const identity={task_id:task,revision:'1',run_id:randomUUID(),attempt_id:randomUUID(),operation_id:randomUUID(),grant_id:randomUUID(),scope_sha256:'a'.repeat(64),config_sha256:await agent.configuration()};let failure:unknown;
 try{await agent.advance({identity,work_id:task,command_id:randomUUID(),purpose:'conclusion_strategy_review',prompt:'Read the approved source only.',system:'Synthetic source boundary',materials:[{path:table,content:'approved\n'}],authorizeResources:async(_signal,path)=>{if(path===table&&!replaced){replaced=true;renameSync(base,base+'-retained');cpSync(base+'-retained',base,{recursive:true});}},capabilities:async()=>[],authorize:()=>true,signal:new AbortController().signal});}catch(error){failure=error;}
 await agent.waitForIdle();const facts=await agent.diagnostics(identity,'conclusion_strategy_review');assert.equal(replaced,true);assert.ok(failure);assert.equal(calls,1);assert.ok(facts.observations.some(o=>o.kind==='tool'&&o.name==='read'&&o.file_failure_category==='permission_denied'));assert.equal(readFileSync(join(base+'-retained','table.txt'),'utf8'),'approved\n');
});

for(const repeat of [false,true])test('RP01-07: a native file read of an owned artifact directory has five bounded corrections; repeat='+repeat,async()=>{
 const root=mkdtempSync(join(process.env.JUANERAI_NEWARCH_SHORT_ROOT!,'read-directory-')),task=randomUUID(),directory=join(root,'analyses',task,'020_clean'),table=join(directory,'source',randomUUID(),'a'.repeat(64),'table.txt');let calls=0,feedback='';
 const agent=createPiProfessionalAgent({projectRoot:root,analysisModel:'mimo-v2.6-flash',credentials:offlineCredentials,authorizeWork:()=>true,fetch:async(_url,init)=>{calls++;if(calls===1)return offlineResponse(calls,[{name:'read',args:{path:directory}}]);if(repeat||calls===2){feedback=String(init!.body);return offlineResponse(calls,[{name:'read',args:{path:repeat?directory:table}}]);}return offlineResponse(calls,[],'Read the approved file; directory contents were not listed.');}});
 const identity={task_id:task,revision:'1',run_id:randomUUID(),attempt_id:randomUUID(),operation_id:randomUUID(),grant_id:randomUUID(),scope_sha256:'a'.repeat(64),config_sha256:await agent.configuration()};let failure:unknown;
 try{await agent.advance({identity,work_id:task,command_id:randomUUID(),purpose:'requirement_design',prompt:'Use the approved material path.',system:'Synthetic native file boundary',materials:[{path:table,content:'approved source\n'}],capabilities:async()=>[],authorize:()=>true,signal:new AbortController().signal});}catch(error){failure=error;}
 await agent.waitForIdle();const facts=await agent.diagnostics(identity,'requirement_design');if(repeat)assert.ok(failure);else assert.equal(failure,undefined,'known file-kind error must reach the existing native correction');assert.equal(calls,repeat?6:3);assert.match(feedback,/is_directory/);assert.equal(facts.unconfirmed_effects,false);assert.equal(facts.meter!.unconfirmed_output_tokens,0);assert.ok(facts.observations.some(o=>o.kind==='tool'&&o.name==='read'&&o.code==='NATIVE_PRECONDITION'&&o.file_failure_category==='is_directory'&&o.completion==='not_started'));assert.equal(readFileSync(table,'utf8'),'approved source\n');
});

test('RP01-07: a sealed source file replaced by a directory remains a hard identity failure',async()=>{
 const root=mkdtempSync(join(process.env.JUANERAI_NEWARCH_SHORT_ROOT!,'sealed-directory-')),task=randomUUID(),table=join(root,'analyses',task,'020_clean/source',randomUUID(),'a'.repeat(64),'table.txt');let calls=0;
 const agent=createPiProfessionalAgent({projectRoot:root,analysisModel:'mimo-v2.6-flash',credentials:offlineCredentials,authorizeWork:()=>true,fetch:async()=>{calls++;if(calls===1){renameSync(table,table+'-retained');mkdirSync(table);}return offlineResponse(calls,[{name:'read',args:{path:table}}]);}});
 const identity={task_id:task,revision:'1',run_id:randomUUID(),attempt_id:randomUUID(),operation_id:randomUUID(),grant_id:randomUUID(),scope_sha256:'a'.repeat(64),config_sha256:await agent.configuration()};let failure:unknown;
 try{await agent.advance({identity,work_id:task,command_id:randomUUID(),purpose:'requirement_design',prompt:'Read the approved source only.',system:'Synthetic sealed source type boundary',materials:[{path:table,content:'approved source\n'}],capabilities:async()=>[],authorize:()=>true,signal:new AbortController().signal});}catch(error){failure=error;}
 await agent.waitForIdle();const facts=await agent.diagnostics(identity,'requirement_design');assert.ok(failure);assert.equal(calls,1);assert.equal(facts.unconfirmed_effects,true);assert.ok(!facts.observations.some(o=>o.kind==='tool'&&o.code==='NATIVE_PRECONDITION'));assert.equal(readFileSync(table+'-retained','utf8'),'approved source\n');
});

test('RP01-07: a replaced loaded artifact ancestor cannot be downgraded into a directory correction',async()=>{
 const root=mkdtempSync(join(process.env.JUANERAI_NEWARCH_SHORT_ROOT!,'directory-ancestor-')),task=randomUUID(),directory=join(root,'analyses',task,'020_clean'),source=randomUUID(),table=join(directory,'source',source,'a'.repeat(64),'table.txt');let calls=0;
 const agent=createPiProfessionalAgent({projectRoot:root,analysisModel:'mimo-v2.6-flash',credentials:offlineCredentials,authorizeWork:()=>true,fetch:async()=>{calls++;if(calls===1){renameSync(directory,directory+'-retained');mkdirSync(directory);}return offlineResponse(calls,[{name:'read',args:{path:directory}}]);}});
 const identity={task_id:task,revision:'1',run_id:randomUUID(),attempt_id:randomUUID(),operation_id:randomUUID(),grant_id:randomUUID(),scope_sha256:'a'.repeat(64),config_sha256:await agent.configuration()};let failure:unknown;
 try{await agent.advance({identity,work_id:task,command_id:randomUUID(),purpose:'requirement_design',prompt:'Read approved materials only.',system:'Synthetic source ancestor identity',materials:[{path:table,content:'approved source\n'}],capabilities:async()=>[],authorize:()=>true,signal:new AbortController().signal});}catch(error){failure=error;}
 await agent.waitForIdle();const facts=await agent.diagnostics(identity,'requirement_design');assert.ok(failure);assert.equal(calls,1);assert.equal(facts.unconfirmed_effects,true);assert.ok(!facts.observations.some(o=>o.kind==='tool'&&o.code==='NATIVE_PRECONDITION'));assert.equal(readFileSync(join(directory+'-retained','source',source,'a'.repeat(64),'table.txt'),'utf8'),'approved source\n');
});

test('RP01-07: actual Workspace preserves R0 and completes postchecks after native directory-read correction',async()=>{
 const {createPersonalOpenAnalysisWorkspace}=await import('../../../profiles/personal/open-analysis.ts'),{postReportProvider}=await import('../../fixtures/xanthil-desktop/report-postprocessing-provider.ts');
 const root=mkdtempSync(join(process.env.JUANERAI_NEWARCH_SHORT_ROOT!,'directory-workspace-')),source_id=randomUUID(),bytes=Buffer.from('id,amount\na,11\nb,19\n'),sha256=createHash('sha256').update(bytes).digest('hex'),provider=postReportProvider({initial:'# 有限报告\n\n金额合计为30 CNY。'});let directory='',injected=false,corrected=false,feedback='',calls=0;
 const options={projectRoot:root,analysisModel:'mimo-v2.6-flash' as const,judgmentReview:true,credentials:offlineCredentials,inspect:async()=>({version:'1.0' as const,sources:[{source_id,display_name:'source.csv',format:'csv' as const,sha256,byte_length:String(bytes.length),sheets:[{sheet_id:'csv',name:'CSV',state:'visible' as const,rows:[['id','amount'],['a','11'],['b','19']].map((v,i)=>({row:i+1,cells:v.map((value,c)=>({column:String.fromCharCode(65+c),value,type:'string' as const}))}))}]}]}),fetch:async(url:Parameters<typeof globalThis.fetch>[0],init?:RequestInit)=>{calls++;const dto=JSON.parse(String(init!.body)),coordinator=packet(dto,'JuanerAI.report-postcheck.v1')!==undefined;if(coordinator&&!injected){injected=true;writeFileSync(join(directory,'020_clean','DO_NOT_LIST_THIS_NAME.txt'),'not a file-read result');return offlineResponse(200000+calls,[{name:'read',args:{path:join(directory,'020_clean')}}]);}if(coordinator&&!corrected){corrected=true;feedback=JSON.stringify(dto);return offlineResponse(200000+calls,[{name:'read',args:{path:join(directory,'020_clean/source',source_id,sha256,'sheet/csv/table.txt')}}]);}return provider.fetch(url,init);}};
 const app=createPersonalOpenAnalysisWorkspace(options);let taskId='',saved:ReturnType<typeof app.read>|undefined,meter:unknown;
 try{const task=await app.submit({version:'1.0',command_id:randomUUID(),question:'核对本份样本金额，缺原因只限制原因判断。',confirmed:true,sources:[{source_id,display_name:'source.csv',format:'csv',bytes}]});taskId=task.identity.task_id;directory=join(root,'analyses',taskId);await app.start(taskId);await app.waitForIdle();saved=app.read(taskId);const facts=await app.diagnostics(taskId);assert.equal(saved.state,'saved');assert.equal(saved.report_postprocessing!.state,'completed');assert.equal(saved.report_postprocessing!.editions[0].numbers[0].status,'independent_consistent');assert.match(feedback,/is_directory/);assert.ok(!feedback.includes('DO_NOT_LIST_THIS_NAME'),'no directory listing is granted');assert.equal(facts.unconfirmed_effects,false);assert.equal(calls,provider.calls()+2);meter=facts.meter;}finally{await app.close();}
 const count=calls,reopened=createPersonalOpenAnalysisWorkspace({...options,fetch:async()=>assert.fail('passive reopen cannot execute')});try{assert.deepEqual(reopened.read(taskId),saved);assert.deepEqual((await reopened.diagnostics(taskId)).meter,meter);assert.equal(calls,count);}finally{await reopened.close();}
});
