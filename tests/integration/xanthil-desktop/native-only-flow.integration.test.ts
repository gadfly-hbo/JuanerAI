import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,statSync,readFileSync} from 'node:fs';
import {join,isAbsolute} from 'node:path';
import {randomUUID,createHash} from 'node:crypto';
import {createPersonalOpenAnalysisWorkspace} from '../../../profiles/personal/open-analysis.ts';
import {offlineCredentials,offlineResponse} from '../../fixtures/xanthil-desktop/offline-professional-provider.ts';
import {browserEvidenceRoot} from '../../fixtures/xanthil-desktop/browser-evidence.ts';
import {reportStudioMaterialCatalog} from '../../../packages/application/report-studio-source.ts';

test('AP01-01/02/04: normal Workspace creates real Task directories and native read uses the declared absolute file before saving the same report',async()=>{
 const root=mkdtempSync(join(process.env.JUANERAI_NEWARCH_SHORT_ROOT??browserEvidenceRoot,'absolute-task-'));
 const bytes=Buffer.from('item,value\na,11\nb,19\n'),source_id=randomUUID(),sha256=createHash('sha256').update(bytes).digest('hex');
 let taskRoot='',calls=0;
 const app=createPersonalOpenAnalysisWorkspace({projectRoot:root,credentials:offlineCredentials,analysisModel:'mimo-v2.6-flash',inspect:async()=>({version:'1.0',sources:[{source_id,display_name:'original.csv',format:'csv',sha256,byte_length:String(bytes.length),sheets:[{sheet_id:'csv',name:'CSV',state:'visible',rows:[['item','value'],['a','11'],['b','19']].map((values,index)=>({row:index+1,cells:values.map((value,column)=>({column:String.fromCharCode(65+column),value,type:'string'}))}))}]}]}),fetch:async(_url,init)=>{
  const dto=JSON.parse(String(init!.body));calls++;
  if(calls===1){
   const path=join(taskRoot,'020_clean','source',source_id,sha256,'sheet','csv','table.txt');
   assert.ok(isAbsolute(path));assert.ok(statSync(path).isFile(),'resource exists before first model request');assert.match(readFileSync(path,'utf8'),/"value":"19"/);
   assert.ok(JSON.stringify(dto.messages).includes(path),'actual model DTO declares this same absolute path');
   return offlineResponse(calls,[{name:'read',args:{path}}]);
  }
  if(calls===2){assert.match(JSON.stringify(dto.messages),/authorized_source_table/);return offlineResponse(calls,[],'当前资料可以作有限观察，尚未独立核验。');}
  return offlineResponse(calls,[],'# 当前报告\n\n仅当前合成资料；尚未独立核验。');
 }});
 try{
  const task=await app.submit({version:'1.0',command_id:randomUUID(),question:'观察当前资料并说明限制',confirmed:true,sources:[{source_id,display_name:'original.csv',format:'csv',bytes}]});taskRoot=join(root,'analyses',task.identity.task_id);
  for(const name of ['010_draw','020_clean','060_reports'])assert.ok(statSync(join(taskRoot,name)).isDirectory(),name+' is created with the Task');
  assert.deepEqual(readFileSync(join(taskRoot,'010_draw',source_id,sha256,'original.csv')),bytes,'original upload bytes are not a reconstructed parsed view');
  await app.start(task.identity.task_id);await app.waitForIdle();const saved=app.read(task.identity.task_id);
  assert.equal(saved.state,'saved');assert.equal(calls,3);assert.equal(saved.model_report!.contract.inputs[0]!.table_path,join(taskRoot,'020_clean','source',source_id,sha256,'sheet','csv','table.txt'));
  assert.equal(readFileSync(join(taskRoot,'060_reports',saved.model_report!.outcome_id+'.md'),'utf8'),saved.model_report!.text);
  assert.equal((await app.diagnostics(task.identity.task_id)).unconfirmed_effects,false);
 }finally{await app.close();}
});

test('AP01-01/03: later authorized upload retains the genuine bytes in the same Task layout without invoking a model',async()=>{
 const root=mkdtempSync(join(process.env.JUANERAI_NEWARCH_SHORT_ROOT??browserEvidenceRoot,'absolute-add-')),bytes=Buffer.from('field\nnew material\n'),source_id=randomUUID(),sha256=createHash('sha256').update(bytes).digest('hex');
 const app=createPersonalOpenAnalysisWorkspace({projectRoot:root,credentials:offlineCredentials,inspect:async()=>({version:'1.0',sources:[{source_id,display_name:'../not-a-path.csv',format:'csv',sha256,byte_length:String(bytes.length),sheets:[{sheet_id:'csv',name:'CSV',state:'visible',rows:[]}]}]}),fetch:async()=>assert.fail('adding authorized materials is not execution')});
 try{
  const task=await app.submit({version:'1.0',command_id:randomUUID(),mode:'requirements',question:'资料不全先建立需求',confirmed:true,sources:[]}),command={version:'1.0',command_id:randomUUID(),expected_revision:task.identity.revision,sources:[{source_id,display_name:'../not-a-path.csv',format:'csv',bytes}]};
  const changed=await app.addRequirementMaterials(task.identity.task_id,command),directory=join(root,'analyses',task.identity.task_id);
  assert.equal(changed.identity.task_id,task.identity.task_id);assert.equal(changed.identity.revision,'2');
  assert.deepEqual(readFileSync(join(directory,'010_draw',source_id,sha256,'original.csv')),bytes,'display name cannot select a filesystem location');
  for(const name of ['010_draw','020_clean','060_reports'])assert.ok(statSync(join(directory,name)).isDirectory());
  assert.deepEqual(await app.addRequirementMaterials(task.identity.task_id,command),changed);
 }finally{await app.close();}
});

test('AP01-03/04: reopening the real Task with independent postcheck contexts preserves settled facts and actual report files without executing',async()=>{
 const {postReportProvider}=await import('../../fixtures/xanthil-desktop/report-postprocessing-provider.ts');
 const root=mkdtempSync(join(process.env.JUANERAI_NEWARCH_SHORT_ROOT??browserEvidenceRoot,'absolute-reopen-')),bytes=Buffer.from('id,amount\na,11\nb,19\n'),source_id=randomUUID(),sha256=createHash('sha256').update(bytes).digest('hex');
 const provider=postReportProvider({initial:'# 当前样本\n\n金额合计为30 CNY。'}),options={projectRoot:root,analysisModel:'mimo-v2.6-flash' as const,judgmentReview:true,credentials:offlineCredentials,inspect:async()=>({version:'1.0' as const,sources:[{source_id,display_name:'source.csv',format:'csv' as const,sha256,byte_length:String(bytes.length),sheets:[{sheet_id:'csv',name:'CSV',state:'visible' as const,rows:[['id','amount'],['a','11'],['b','19']].map((values,index)=>({row:index+1,cells:values.map((value,column)=>({column:String.fromCharCode(65+column),value,type:'string' as const}))}))}]}]}),fetch:provider.fetch};
 const app=createPersonalOpenAnalysisWorkspace(options);let saved:ReturnType<typeof app.read>,before:Awaited<ReturnType<typeof app.diagnostics>>;
 try{const task=await app.submit({version:'1.0',command_id:randomUUID(),question:'核对当前样本金额，不执行业务行动。',confirmed:true,sources:[{source_id,display_name:'source.csv',format:'csv',bytes}]});await app.start(task.identity.task_id);await app.waitForIdle();saved=app.read(task.identity.task_id);before=await app.diagnostics(task.identity.task_id);assert.equal(saved.report_postprocessing?.state,'completed');assert.equal(before.unconfirmed_effects,false);}finally{await app.close();}
 const count=provider.calls(),reopened=createPersonalOpenAnalysisWorkspace({...options,fetch:async()=>assert.fail('passive reopening must not call a model')});
 try{
  const id=saved!.identity.task_id;assert.deepEqual(reopened.read(id),saved!);assert.equal((await reopened.diagnostics(id)).unconfirmed_effects,false);assert.deepEqual((await reopened.diagnostics(id)).meter,before!.meter);assert.equal(await reopened.physicalPending(),false);
  for(const edition of saved!.report_postprocessing!.editions)assert.equal(readFileSync(join(root,'analyses',id,'060_reports',saved!.model_report!.outcome_id+(edition.version?'.R'+edition.version:'')+'.md'),'utf8'),edition.text);
  assert.equal(provider.calls(),count);
 }finally{await reopened.close();}
});

for(const ancestor of ['020_clean','input'])test('AP01-F001/F002: real postcheck and saved files stay under the actual Task when an ancestor is named '+ancestor,async()=>{
 const {postReportProvider}=await import('../../fixtures/xanthil-desktop/report-postprocessing-provider.ts');
 const parent=mkdtempSync(join(process.env.JUANERAI_NEWARCH_SHORT_ROOT??browserEvidenceRoot,'root-case-')),root=join(parent,ancestor,'p');mkdirSync(root,{recursive:true});
 const bytes=Buffer.from('id,amount\na,11\nb,19\n'),source_id=randomUUID(),sha256=createHash('sha256').update(bytes).digest('hex'),provider=postReportProvider({initial:'# 当前样本\n\n金额合计为30 CNY。',fileProgram:true});
 const options={projectRoot:root,analysisModel:'mimo-v2.6-flash' as const,judgmentReview:true,credentials:offlineCredentials,inspect:async()=>({version:'1.0' as const,sources:[{source_id,display_name:'source.csv',format:'csv' as const,sha256,byte_length:String(bytes.length),sheets:[{sheet_id:'csv',name:'CSV',state:'visible' as const,rows:[['id','amount'],['a','11'],['b','19']].map((values,index)=>({row:index+1,cells:values.map((value,column)=>({column:String.fromCharCode(65+column),value,type:'string' as const}))}))}]}]}),fetch:provider.fetch};
 const app=createPersonalOpenAnalysisWorkspace(options);let saved:ReturnType<typeof app.read>;let meter:unknown;
 try{const task=await app.submit({version:'1.0',command_id:randomUUID(),question:'核对当前样本金额，不执行业务行动。',confirmed:true,sources:[{source_id,display_name:'source.csv',format:'csv',bytes}]});await app.start(task.identity.task_id);await app.waitForIdle();saved=app.read(task.identity.task_id);
  assert.equal(saved.report_postprocessing?.state,'completed',JSON.stringify(saved.report_postprocessing));
  const proof=saved.report_postprocessing!.editions[0]!.numeric_proof!;assert.ok(proof.completion.executions!.some(e=>e.artifacts.some(f=>f.path==='checker.awk')),'actual pre-execution program snapshot retained');
  const directory=join(root,'analyses',task.identity.task_id);for(const execution of proof.completion.executions!)for(const file of execution.inputs)assert.ok(file.path.startsWith(directory+'/020_clean/independent/'));
  for(const read of proof.method_completion.resource_reads!)assert.ok(read.path.startsWith(directory+'/020_clean/independent/'));
  assert.equal(readFileSync(join(directory,'060_reports',saved.model_report!.outcome_id+'.md'),'utf8'),saved.model_report!.text);const facts=await app.diagnostics(task.identity.task_id);assert.equal(facts.unconfirmed_effects,false);meter=facts.meter;
 }finally{await app.close();}
 const calls=provider.calls(),reopened=createPersonalOpenAnalysisWorkspace({...options,fetch:async()=>assert.fail('passive reopen sends nothing')});try{assert.deepEqual(reopened.read(saved!.identity.task_id),saved!);const facts=await reopened.diagnostics(saved!.identity.task_id);assert.equal(facts.unconfirmed_effects,false);assert.deepEqual(facts.meter,meter);assert.equal(provider.calls(),calls);}finally{await reopened.close();}
});

test('NR02-01/02/04: default Workspace needs no legacy mode or business parameter tools and saves a limited report',async()=>{
 const root=mkdtempSync(join(process.env.JUANERAI_NEWARCH_SHORT_ROOT??browserEvidenceRoot,'native-only-'));
 const requests:any[]=[];
 const app=createPersonalOpenAnalysisWorkspace({projectRoot:root,analysisModel:'mimo-v2.6-flash',credentials:offlineCredentials,inspect:async()=>assert.fail('no absent material inspection'),fetch:async(_url,init)=>{
  const dto=JSON.parse(String(init!.body));requests.push(dto);
  return offlineResponse(requests.length,[],requests.length===1?'SCR：问题范围仍待补充。Binding：尚无资料。IR：只说明可做内容及缺口。':'# 有限分析报告\n\n目前缺少资料，不能判断实际业务结果。可先明确分析目标，再补充相关来源。未独立核验。');
 }});
 try{
  const task=await app.submit({version:'1.0',command_id:randomUUID(),question:'资料不全也先说明可做内容和缺口',confirmed:true,sources:[]});
  await app.start(task.identity.task_id);await app.waitForIdle();
  const names=requests.flatMap(dto=>(dto.tools??[]).map((t:any)=>t.function?.name??t.name));
  assert.ok(names.includes('read'));assert.ok(requests[0].tools.some((t:any)=>t.function.name==='bash'));assert.ok(!requests.at(-1).tools.some((t:any)=>t.function.name==='bash'),'report authoring stays read/write/edit');
  assert.deepEqual([...new Set(names)].filter(name=>!['read','write','edit','bash'].includes(name)),[],'normal analysis cannot secretly select the retired business-tool chain');
  const saved=app.read(task.identity.task_id);
  assert.equal(saved.state,'saved');assert.equal(saved.model_report?.kind,'MODEL_ANALYSIS_REPORT');
  assert.match(saved.model_report!.text,/有限分析报告/);assert.equal(saved.outcome,null);assert.equal(saved.computation_records.length,0);
  assert.equal(requests.length,2,'analysis and report formation use their fixed purposes');
  assert.equal((await app.diagnostics(task.identity.task_id)).unconfirmed_effects,false);
  const expected=saved.model_report;await app.close();
  const reopened=createPersonalOpenAnalysisWorkspace({projectRoot:root,analysisModel:'mimo-v2.6-flash',credentials:offlineCredentials,inspect:async()=>assert.fail('passive reopen'),fetch:async()=>assert.fail('passive reopen must not execute')});
  try{assert.deepEqual(reopened.read(task.identity.task_id).model_report,expected);}finally{await reopened.close();}
 }finally{await app.close();}
});

test('NR02-08/plugin: actual saved report is a Report Studio source without the retired computation/preview pipeline',async()=>{
 const root=mkdtempSync(join(process.env.JUANERAI_NEWARCH_SHORT_ROOT??browserEvidenceRoot,'native-studio-')),project_id=randomUUID();let calls=0;
 const app=createPersonalOpenAnalysisWorkspace({projectRoot:root,project_id,analysisModel:'mimo-v2.6-flash',credentials:offlineCredentials,inspect:async()=>assert.fail('no file'),fetch:async()=>offlineResponse(++calls,[],calls===1?'资料缺失，只表达有限观察。':'# 当前保存报告\n\n缺少原始资料，具体业务结果未核验。')});
 try{const t=await app.submit({version:'1.0',command_id:randomUUID(),question:'说明当前可做内容',confirmed:true,sources:[]});await app.start(t.identity.task_id);await app.waitForIdle();const saved=app.read(t.identity.task_id);
  const catalog=reportStudioMaterialCatalog(project_id,saved,saved.identity.revision);
  assert.equal(catalog.source.outcome_id,saved.model_report!.outcome_id);
  assert.ok(catalog.materials.some(m=>m.text===app.reportContent(saved.identity.task_id)!.text&&m.classification==='MODEL_EXPLANATION'&&m.verification==='not_performed'));
  assert.ok(catalog.materials.every(m=>m.verification==='not_performed'),'saved model text cannot become independent calculation evidence');
  assert.equal(calls,2);assert.equal(saved.outcome,null);
 }finally{await app.close();}
});

test('NR02-08/plugin: normal saved report is a Decision Platform source with the same current saved copy',async()=>{
 const {nativeReport}=await import('../../fixtures/xanthil-desktop/native-report.ts'),{createDecisionSources}=await import('../../../packages/application/decision-sources.ts');
 const f=await nativeReport(),app=createPersonalOpenAnalysisWorkspace(f.configuration);
 try{const catalog=createDecisionSources({projectId:f.configuration.project_id,readTask:id=>id===f.identity.task_id?app.read(id):null,reportCopy:app.reportCopy}),rows=catalog.catalog(f.identity.task_id);
  assert.equal(rows.length,1,'normal saved report must not disappear behind a retired Outcome selector');
  assert.equal(rows[0]!.source.sourceId,f.modelReport.outcome_id);assert.equal(rows[0]!.source.revision,f.identity.revision);
  const copy=catalog.selected(rows[0]!.id,f.identity.task_id);assert.match(Buffer.from(copy.content).toString('utf8'),/当前合成报告/);assert.match(copy.selection.classification,/不构成正式决定/);assert.equal(f.provider.requests(),2);
 }finally{await app.close();}
});

test('NR02-01/04/08: saved report content is the exact generated R0, with no retired numeric-template interpolation',async()=>{
 const {nativeReport}=await import('../../fixtures/xanthil-desktop/native-report.ts'),text='# 自由分析报告\n\n需求中的模板原文 {{金额}} 只是文本，不能由旧数字目录改写。',f=await nativeReport({text}),app=createPersonalOpenAnalysisWorkspace(f.configuration);
 try{assert.equal(app.read(f.identity.task_id).model_report!.text,text);assert.equal(app.reportContent(f.identity.task_id)!.text,text);assert.equal(f.provider.requests(),2);}finally{await app.close();}
});
