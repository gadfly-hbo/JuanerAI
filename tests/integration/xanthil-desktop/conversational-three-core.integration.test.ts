import {createAnalysisFiles} from '../../../adapters/agent-pi/analysis-files.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {randomUUID} from 'node:crypto';
import {createHash} from 'node:crypto';
import {createPersonalOpenAnalysisWorkspace} from '../../../profiles/personal/open-analysis.ts';
import {offlineCredentials,offlineResponse} from '../../fixtures/xanthil-desktop/offline-professional-provider.ts';
import {parseDesktopCsv} from '../../../packages/product-core/xanthil-desktop-decision-case.ts';
import type {MemberSourceInspector} from '../../../packages/ports/member-source.ts';
import {openTaskView,createQuickAnalysisClient} from '../../../apps/browser/quick-analysis-client.mjs';
import {renderQuickAnalysisWorkbench} from '../../../apps/browser/quick-analysis-workbench.mjs';
import {startBrowserMembershipServer} from '../../../apps/browser/local-server.ts';
import {createProjectMetricAssetStore} from '../../../adapters/storage-local/metric-assets.ts';
import {metricDefinitionResource} from '../../../packages/product-core/metric-asset-adoption.ts';
import {postReportProvider} from '../../fixtures/xanthil-desktop/report-postprocessing-provider.ts';
import {createOpenAnalysisApplication} from '../../../packages/application/open-analysis.ts';

const inspect:MemberSourceInspector=async({sources})=>({version:'1.0',sources:sources.map(s=>{const csv=parseDesktopCsv(s.bytes);return {source_id:s.source_id,display_name:s.display_name,format:s.format,sha256:createHash('sha256').update(s.bytes).digest('hex'),byte_length:String(s.bytes.length),sheets:[{sheet_id:'csv',name:'CSV',state:'visible',rows:[csv.headers,...csv.rows].map((r,i)=>({row:i+1,cells:r.map((v,j)=>({column:String.fromCharCode(65+j),type:'string',value:v}))}))}]};})});

test('DR01-01: normal Workspace exposes readable clean catalogs without advertising the raw original path',async()=>{
 const root=mkdtempSync(join(process.env.JUANERAI_NEWARCH_SHORT_ROOT!,'dr-catalog-')),source_id=randomUUID(),bytes=Buffer.from('unit,value\nCNY,37\n'),sha=createHash('sha256').update(bytes).digest('hex'),requests:Record<string,any>[]=[];let directory='';
 const ws=createPersonalOpenAnalysisWorkspace({projectRoot:root,project_id:randomUUID(),inspect,analysisModel:'mimo-v2.6-flash',credentials:offlineCredentials,judgmentReview:false,fetch:async(_url,init)=>{
  requests.push(JSON.parse(String(init!.body)));const call=requests.length,base=join(directory,'020_clean/source',source_id,sha);
  if(call===1)return offlineResponse(call,[{name:'read',args:{path:join(directory,'020_clean/source/catalog.txt')}}]);
  if(call===2)return offlineResponse(call,[{name:'read',args:{path:join(base,'sheets.txt')}}]);
  if(call===3)return offlineResponse(call,[{name:'read',args:{path:join(base,'sheet/csv/table.txt')}}]);
  return offlineResponse(call,[],'SCR：只核对已提供样本。Binding：单位来自当前资料。IR：先讨论需求，未开始分析或独立核验。');
 }});
 try{
  const t=await ws.submit({version:'1.0',command_id:randomUUID(),mode:'requirements',question:'核对当前已批准资料，先讨论需求。',confirmed:true,sources:[{source_id,display_name:'sample.csv',format:'csv',bytes}]});directory=join(root,'analyses',t.identity.task_id);
  await ws.discussRequirement(t.identity.task_id,{version:'1.0',command_id:randomUUID(),expected_sequence:0,message:t.question});await ws.waitForIdle();
  assert.equal(requests.length,4);assert.match(ws.read(t.identity.task_id).requirement_draft!.content.text,/Binding/);assert.equal((await ws.diagnostics(t.identity.task_id)).unconfirmed_effects,false);
  const delivered=JSON.stringify(requests[1]!.messages);assert.match(delivered,/sheet_catalog_path/);assert.match(delivered,/020_clean/);assert.doesNotMatch(delivered,/original_path|010_draw/,'model-visible source discovery must contain only readable views, not the inaccessible raw original');
  assert.deepEqual(readFileSync(join(directory,'010_draw',source_id,sha,'original.csv')),bytes,'raw retention and source identity are independent of model visibility');
 }finally{await ws.close();}
});

for(const rawDirectory of ['010_draw','010_DRAW','010_DrAw'])test('DR01-02: known original is forbidden to native Agent read via '+rawDirectory,async()=>{
 const root=mkdtempSync(join(process.env.JUANERAI_NEWARCH_SHORT_ROOT!,'dr-raw-')),source_id=randomUUID(),bytes=Buffer.from('unit,value\nCNY,41\n'),sha=createHash('sha256').update(bytes).digest('hex');let directory='',calls=0;
 const ws=createPersonalOpenAnalysisWorkspace({projectRoot:root,project_id:randomUUID(),inspect,analysisModel:'mimo-v2.6-flash',credentials:offlineCredentials,judgmentReview:false,fetch:async()=>{
  if(++calls===1)return offlineResponse(calls,[{name:'read',args:{path:join(directory,rawDirectory,source_id,sha,'original.csv')}}]);
  return offlineResponse(calls,[],'原始文件被模型读到了，这不应发生。');
 }});
 try{
  const t=await ws.submit({version:'1.0',command_id:randomUUID(),mode:'requirements',question:'只使用获准clean视图讨论。',confirmed:true,sources:[{source_id,display_name:'sample.csv',format:'csv',bytes}]});directory=join(root,'analyses',t.identity.task_id);
  await ws.discussRequirement(t.identity.task_id,{version:'1.0',command_id:randomUUID(),expected_sequence:0,message:t.question});await ws.waitForIdle();
  assert.equal(calls,1,'a known raw original must never be delivered to a further model request');
  const facts=await ws.diagnostics(t.identity.task_id);assert.equal(facts.unconfirmed_effects,true);assert.ok(facts.observations.some(o=>o.kind==='tool'&&o.name==='read'&&o.file_failure_category==='permission_denied'));
  assert.equal(ws.read(t.identity.task_id).requirement_draft,undefined);assert.deepEqual(readFileSync(join(directory,'010_draw',source_id,sha,'original.csv')),bytes);
 }finally{await ws.close();}
});

for(const purpose of ['analysis','report_edit'] as const)test('DR01-02: '+purpose+' uses the same raw-data refusal as requirement discussion',async()=>{
 const root=mkdtempSync(join(process.env.JUANERAI_NEWARCH_SHORT_ROOT!,'dr-'+purpose+'-')),source_id=randomUUID(),bytes=Buffer.from('unit,value\nCNY,43\n'),sha=createHash('sha256').update(bytes).digest('hex');let directory='',calls=0;
 const deniedCall=purpose==='analysis'?1:2;
 const ws=createPersonalOpenAnalysisWorkspace({projectRoot:root,project_id:randomUUID(),inspect,analysisModel:'mimo-v2.6-flash',credentials:offlineCredentials,judgmentReview:false,fetch:async()=>{
  calls++;if(calls<deniedCall)return offlineResponse(calls,[],'依据获准资料形成有限观察，数字未独立核验。');
  if(calls===deniedCall)return offlineResponse(calls,[{name:'read',args:{path:join(directory,'010_draw',source_id,sha,'original.csv')}}]);
  return offlineResponse(calls,[],'原始内容不应交付。');
 }});
 try{
  const t=await ws.submit({version:'1.0',command_id:randomUUID(),question:'只分析获准clean资料。',confirmed:true,sources:[{source_id,display_name:'sample.csv',format:'csv',bytes}]});directory=join(root,'analyses',t.identity.task_id);
  await ws.start(t.identity.task_id);await ws.waitForIdle();const facts=await ws.diagnostics(t.identity.task_id);
  assert.equal(calls,deniedCall);assert.equal(facts.unconfirmed_effects,true);assert.ok(facts.observations.some(o=>o.kind==='tool'&&o.name==='read'&&o.file_failure_category==='permission_denied'));assert.equal(ws.read(t.identity.task_id).model_report,undefined);assert.deepEqual(readFileSync(join(directory,'010_draw',source_id,sha,'original.csv')),bytes);
 }finally{await ws.close();}
});

test('DR01-03: an external resource declaration cannot grant access to the Task raw-data directory',async()=>{
 const root=mkdtempSync(join(process.env.JUANERAI_NEWARCH_SHORT_ROOT!,'dr-external-')),raw=join(root,'010_draw/original.csv'),clean=join(root,'020_clean/source/table.txt'),signal=new AbortController().signal;let externalReads=0;
 mkdirSync(join(root,'010_draw'));writeFileSync(raw,'raw-retained');
 await assert.rejects(()=>createAnalysisFiles({cwd:root,reportPath:'060_reports/test.md',signal,authorize:()=>true,materials:[{path:clean,content:'approved-clean-view'}],skillFiles:[{path:raw,authorize:async()=>{externalReads++;return true;}}]}));
 const files=await createAnalysisFiles({cwd:root,reportPath:'060_reports/test.md',signal,authorize:()=>true,materials:[{path:clean,content:'approved-clean-view'}]});
 const read=files.tools.find(t=>t.name==='read')!;
 assert.match(JSON.stringify(await read.execute({path:clean},signal)),/approved-clean-view/);
 await assert.rejects(()=>read.execute({path:raw},signal));assert.equal(externalReads,0);assert.equal(readFileSync(raw,'utf8'),'raw-retained');
 await assert.rejects(()=>createAnalysisFiles({cwd:root,reportPath:'060_reports/test.md',signal,authorize:()=>true,materials:[{path:raw,content:'raw-retained'}]}));
});

test('DR01-F01: reserved directory spelling cannot bypass raw retention or clean sealing through native read/write/edit',async()=>{
 const root=mkdtempSync(join(process.env.JUANERAI_NEWARCH_SHORT_ROOT!,'dr-case-')),raw=join(root,'010_draw/original.csv'),clean=join(root,'020_clean/source/table.txt'),asset=join(root,'020_clean/metric-asset/definition.txt'),signal=new AbortController().signal;
 mkdirSync(join(root,'010_draw'));writeFileSync(raw,'RAW_RETAINED');let checks=0,publications=0;
 const files=await createAnalysisFiles({cwd:root,reportPath:'060_reports/test.md',signal,authorize:()=>true,materials:[{path:clean,content:'SEALED_CLEAN'},{path:asset,content:'SEALED_CLEAN'}],authorizeResources:async()=>{checks++;},onRead:()=>{publications++;}});
 const read=files.tools.find(t=>t.name==='read')!,write=files.tools.find(t=>t.name==='write')!,edit=files.tools.find(t=>t.name==='edit')!;
 assert.match(JSON.stringify(await read.execute({path:clean},signal)),/SEALED_CLEAN/);
 for(const path of [join(root,'010_DRAW/original.csv'),join(root,'010_DrAw/original.csv'),join(root,'020_CLEAN/SOURCE/table.txt'),join(root,'020_clean/Source/table.txt'),join(root,'020_clean/ſource/table.txt'),join(root,'020_clean/metric-aßet/definition.txt'),join(root,'020_clean/metric-aẞet/definition.txt')]){
  await assert.rejects(()=>write.execute({path,content:'MODEL_OVERWRITE'},signal));
  await assert.rejects(()=>edit.execute({path,oldText:path.includes('010_')?'RAW_RETAINED':'SEALED_CLEAN',newText:'MODEL_OVERWRITE'},signal));
 }
 assert.equal(readFileSync(raw,'utf8'),'RAW_RETAINED');assert.equal(readFileSync(clean,'utf8'),'SEALED_CLEAN');assert.equal(readFileSync(asset,'utf8'),'SEALED_CLEAN');
 const before=checks;assert.match(JSON.stringify(await read.execute({path:join(root,'020_CLEAN/SOURCE/table.txt')},signal)),/SEALED_CLEAN/);assert.ok(checks>before,'canonical equivalent authorized reads still perform live business authorization');
 writeFileSync(clean,'UNAPPROVED_CHANGE');const published=publications;
 await assert.rejects(()=>read.execute({path:clean},signal));assert.equal(publications,published,'SDK immutable identity rejects before publishing changed source bytes; early rejection need not invoke a downstream business callback');
 for(const path of [join(root,'020_CLEAN/SOURCE/table.txt'),join(root,'020_clean/Source/table.txt'),join(root,'020_clean/ſource/table.txt'),join(root,'020_clean/metric-aßet/definition.txt'),join(root,'020_clean/metric-aẞet/definition.txt')])await assert.rejects(()=>read.execute({path},signal));
 assert.equal(readFileSync(raw,'utf8'),'RAW_RETAINED');
});

test('DR01-F01: a real Pi edit invocation cannot alter an approved metric view through an equivalent spelling',async()=>{
 const root=mkdtempSync(join(process.env.JUANERAI_NEWARCH_SHORT_ROOT!,'dr-edit-')),project_id=randomUUID(),assets=createProjectMetricAssetStore({projectRoot:root,projectId:project_id});
 const base=new URL('../../../docs/planning/2026-10-12/change006-metric-assets/attachments/metric-factory-1.1/releases/',import.meta.url),candidate=assets.importCandidate(readFileSync(new URL('net-sales-instance/1.1.0.sap.yaml',base)),readFileSync(new URL('index.yaml',base)));
 assets.approve({command_id:randomUUID(),id:candidate.asset.id,version:candidate.asset.version,owner:'synthetic-maintainer',use_for_new_tasks:true});
 const resource=metricDefinitionResource(assets.approved()!);assert.equal(resource.text.split('metric_asset_definition_json').length,2);let canonical='',alias='',calls=0;
 const ws=createPersonalOpenAnalysisWorkspace({projectRoot:root,project_id,inspect,metricAssetDisclosureAllowed:true,analysisModel:'mimo-v2.6-flash',credentials:offlineCredentials,judgmentReview:false,fetch:async()=>{
  calls++;if(calls===1)return offlineResponse(calls,[{name:'read',args:{path:canonical}}]);
  if(calls===2)return offlineResponse(calls,[{name:'edit',args:{path:alias,oldText:'metric_asset_definition_json',newText:'ALTERED_METRIC_VIEW'}}]);
  return offlineResponse(calls,[],'不应收到对受保护指标视图改写后的模型请求。');
 }});
 try{
  const t=await ws.submit({version:'1.0',command_id:randomUUID(),question:'按批准指标和当前clean资料分析。',confirmed:true,sources:[{source_id:randomUUID(),display_name:'sample.csv',format:'csv',bytes:Buffer.from('amount\n17\n')}]});canonical=join(root,'analyses',t.identity.task_id,'020_clean',resource.path);alias=canonical.replace('/metric-asset/','/metric-aẞet/');
  await ws.start(t.identity.task_id);await ws.waitForIdle();const facts=await ws.diagnostics(t.identity.task_id),actual=readFileSync(canonical,'utf8');
  writeFileSync(join(root,'EDIT-OBSERVATION.json'),JSON.stringify({calls,canonical,alias,actual,facts},null,2));
  assert.equal(calls,2,'native read is a positive control; actual edit must be refused before another model request');assert.equal(actual,resource.text);assert.equal(facts.unconfirmed_effects,true);assert.ok(facts.observations.some(o=>o.kind==='tool'&&o.name==='read'&&o.completion==='completed'));assert.ok(facts.observations.some(o=>o.kind==='tool'&&o.name==='edit'&&o.completion==='unknown'&&o.delivery==='failed'));assert.equal(ws.read(t.identity.task_id).model_report,undefined);
 }finally{await ws.close();}
});

test('CW01-01/02: normal Workspace saves natural multiround understanding without a framework tool or complete information',async()=>{
 const root=mkdtempSync(join(process.env.JUANERAI_NEWARCH_SHORT_ROOT!,'cw-chat-')),project_id=randomUUID(),failures:string[]=[],requests:Record<string,any>[]=[];
 const first='## 本次业务理解\nSCR：先讨论本期订单变化，尚无已批准企业定义。\nBinding：还未提供资料，不能推断金额单位。\nIR：先列可回答的问题；原因及数字等待资料，不阻止需求讨论。';
 const second='## 本次分析需求三核心\nSCR：只分析订单记录，不认证净额或因果。\nBinding：用户说明金额单位为元；资料尚缺，保留待补。\nIR：先明确资料需求，取得获准资料后继续，未执行计算。';
 const options={projectRoot:root,project_id,inspect,analysisModel:'mimo-v2.6-flash' as const,credentials:offlineCredentials,judgmentReview:false,onFailure:(code:string)=>failures.push(code),fetch:async(_url:unknown,init?:RequestInit)=>{requests.push(JSON.parse(String(init!.body)));return offlineResponse(requests.length,[],requests.length===1?first:second);}};
 let ws=createPersonalOpenAnalysisWorkspace(options);
 try{
  const task=await ws.submit({version:'1.0',command_id:randomUUID(),question:'先一起理清订单分析需求，资料以后补充，暂不开始分析。',confirmed:true,mode:'requirements',sources:[]});
  const initial={version:'1.0',command_id:randomUUID(),expected_sequence:0,message:task.question};
  await ws.discussRequirement(task.identity.task_id,initial);await ws.waitForIdle();
  assert.deepEqual(failures,[],'plain native assistant text must not fail DRAFT_REQUIRED');
  let saved=ws.read(task.identity.task_id);assert.equal(Reflect.get(saved.requirement_draft!.content,'text'),first);assert.equal(saved.state,'ready');assert.equal(saved.model_report,undefined);assert.equal(saved.requirement_execution,undefined);
  const forbidden=new Set(['update_requirement_framework','describe_business','describe_meaning','interpret_meaning','assess_meaning','bind_measurement']);
  assert.ok(!requests[0]!.tools.some((t:any)=>forbidden.has(t.function?.name??t.name)),'no forced three-core schema is advertised');
  await ws.discussRequirement(task.identity.task_id,initial);await ws.waitForIdle();assert.equal(requests.length,1,'same durable command is not a new physical request');
  await ws.discussRequirement(task.identity.task_id,{version:'1.0',command_id:randomUUID(),expected_sequence:1,message:'金额以元计，只讨论订单，不判断净额或原因。'});await ws.waitForIdle();
  saved=ws.read(task.identity.task_id);assert.equal(Reflect.get(saved.requirement_draft!.content,'text'),second);assert.equal(saved.requirement_draft!.conversation!.length,2);assert.equal(saved.requirement_draft!.conversation![1]!.user.text,'金额以元计，只讨论订单，不判断净额或原因。');assert.equal(saved.requirement_draft!.conversation![0]!.assistant.text,first);
  const body=JSON.stringify(requests[1]!.messages);assert.match(body,/金额以元计/);assert.match(body,/本次业务理解/);assert.ok(!body.includes('"analysis_contract"'));assert.ok(!body.includes('"selected_sources"'),'large machine state is not a second prompt plan');
  const before=requests.length;await ws.close();ws=createPersonalOpenAnalysisWorkspace(options);assert.deepEqual(ws.read(task.identity.task_id).requirement_draft,saved.requirement_draft);assert.equal(requests.length,before);assert.equal((await ws.diagnostics(task.identity.task_id)).unconfirmed_effects,false);
 }finally{await ws.close();}
});

test('CW01-06/08: an in-flight supplement is consumed by the fixed native Pi queue on the same work',async()=>{
 const root=mkdtempSync(join(process.env.JUANERAI_NEWARCH_SHORT_ROOT!,'cw-queue-'));let entered!:()=>void,release!:()=>void,calls=0;const began=new Promise<void>(r=>{entered=r;}),gate=new Promise<void>(r=>{release=r;});
 const requests:Record<string,any>[]=[];
 const ws=createPersonalOpenAnalysisWorkspace({projectRoot:root,project_id:randomUUID(),inspect,analysisModel:'mimo-v2.6-flash',credentials:offlineCredentials,judgmentReview:false,fetch:async(_url,init)=>{requests.push(JSON.parse(String(init!.body)));calls++;if(calls===1){entered();await gate;return offlineResponse(calls,[],'SCR：先讨论原始目标，Binding：资料待补，IR：暂未完成本次理解。');}return offlineResponse(calls,[],'SCR：按补充，只观察本期订单。Binding：金额单位元。IR：保留原因未知，尚未开始分析。');}});
 try{
  const t=await ws.submit({version:'1.0',command_id:randomUUID(),mode:'requirements',question:'先一起整理分析需求。',confirmed:true,sources:[]});await ws.discussRequirement(t.identity.task_id,{version:'1.0',command_id:randomUUID(),expected_sequence:0,message:t.question});await began;
  const snapshot=await ws.sessionControl(t.identity.task_id,{version:'1.0',expected_revision:t.identity.revision,command:{kind:'snapshot'}});assert.ok(snapshot.availability==='busy'||snapshot.availability==='available'&&snapshot.busy===true,'a passive busy snapshot is not an empty queue or permission to rerun');
  const accepted=await ws.sessionControl(t.identity.task_id,{version:'1.0',expected_revision:t.identity.revision,command:{kind:'steer',text:'补充：只观察本期订单，金额以元计。'}});assert.ok(accepted.accepted_input?.id);
  release();await ws.waitForIdle();assert.equal(calls,2,'normal queued user input is not a fault retry');assert.match(JSON.stringify(requests[1]!.messages),/只观察本期订单/);assert.match(ws.read(t.identity.task_id).requirement_draft!.content.text,/金额单位元/);assert.equal(ws.read(t.identity.task_id).state,'ready');assert.equal(ws.read(t.identity.task_id).requirement_execution,undefined);
  assert.equal((await ws.diagnostics(t.identity.task_id)).unconfirmed_effects,false);
 }finally{release();await ws.waitForIdle();await ws.close();}
});

test('CW01-03: a page with an old material view cannot confirm a later material scope',async()=>{
 const root=mkdtempSync(join(process.env.JUANERAI_NEWARCH_SHORT_ROOT!,'cw-stale-'));let calls=0;
 const ws=createPersonalOpenAnalysisWorkspace({projectRoot:root,project_id:randomUUID(),inspect,analysisModel:'mimo-v2.6-flash',credentials:offlineCredentials,judgmentReview:false,fetch:async()=>offlineResponse(++calls,[],'有限模型观察，未独立核验。')});
 try{
  const t=await ws.submit({version:'1.0',command_id:randomUUID(),mode:'requirements',question:'仅讨论当前已选资料。',confirmed:true,sources:[{source_id:randomUUID(),display_name:'原资料.csv',format:'csv',bytes:Buffer.from('amount\n11\n')}]});
  ws.saveRequirementDraft(t.identity.task_id,{version:'1.0',command_id:randomUUID(),expected_sequence:0,message:'先讨论',content:{version:'2.0',text:'SCR：本次问题。Binding：仅当前原资料。IR：先讨论，不计算。'}});
  const stale={version:'1.0',command_id:randomUUID(),expected_revision:1,confirmed:true};
  await ws.addRequirementMaterials(t.identity.task_id,{version:'1.0',command_id:randomUUID(),expected_revision:t.identity.revision,sources:[{source_id:randomUUID(),display_name:'后加资料.csv',format:'csv',bytes:Buffer.from('amount\n19\n')}]});
  let error:unknown;try{await ws.startRequirement(t.identity.task_id,stale);}catch(e){error=e;}await ws.waitForIdle();assert.ok(error,'an old confirmation without current material identity must not start the new scope');assert.ok(['AUTHORITY_REQUIRED','REVISION_CONFLICT'].includes(String(Reflect.get(error as object,'code'))));assert.equal(calls,0);
  await assert.rejects(()=>ws.startRequirement(t.identity.task_id,{...stale,version:'2.0',expected_analysis_revision:t.identity.revision,scope_sha256:t.identity.scope_sha256}),{code:'REVISION_CONFLICT'});assert.equal(calls,0);
 }finally{await ws.close();}
});

test('CW01-05: approved Metric Factory definitions are actually consumed through native read; wrong identity, no disclosure and revocation refuse',async()=>{
 const root=mkdtempSync(join(process.env.JUANERAI_NEWARCH_SHORT_ROOT!,'cw-asset-')),project_id=randomUUID(),assets=createProjectMetricAssetStore({projectRoot:root,projectId:project_id});
 const base=new URL('../../../docs/planning/2026-10-12/change006-metric-assets/attachments/metric-factory-1.1/releases/',import.meta.url);
 const candidate=assets.importCandidate(readFileSync(new URL('net-sales-instance/1.1.0.sap.yaml',base)),readFileSync(new URL('index.yaml',base)));
 assets.approve({command_id:randomUUID(),id:candidate.asset.id,version:candidate.asset.version,owner:'synthetic-maintainer',use_for_new_tasks:true});
 const approved=assets.approved()!,resource=metricDefinitionResource(approved);let directory='',calls=0;const requests:Record<string,any>[]=[];
 const ws=createPersonalOpenAnalysisWorkspace({projectRoot:root,project_id,inspect,metricAssetDisclosureAllowed:true,analysisModel:'mimo-v2.6-flash',credentials:offlineCredentials,judgmentReview:false,fetch:async(_url,init)=>{const dto=JSON.parse(String(init!.body));requests.push(dto);calls++;if(calls===1)return offlineResponse(calls,[{name:'read',args:{path:join(directory,'020_clean/metric-asset/catalog.txt')}}]);if(calls===2){assert.match(JSON.stringify(dto.messages),new RegExp(approved.asset.id));return offlineResponse(calls,[{name:'read',args:{path:join(directory,'020_clean',resource.path),limit:10}}]);}assert.match(JSON.stringify(dto.messages),/metric_asset_definition_json/);assert.match(JSON.stringify(dto.messages),new RegExp(approved.approval.definition_sha256));return offlineResponse(calls,[],'SCR：采用已批准资产的实际定义，方法引用不等于已读完整方法。Binding：业务资料尚缺。IR：先补齐来源，不编造企业口径。');}});
 try{
  const t=await ws.submit({version:'1.0',command_id:randomUUID(),mode:'requirements',question:'按本项目已批准指标一起理清需求。',confirmed:true,sources:[]});directory=join(root,'analyses',t.identity.task_id);await ws.discussRequirement(t.identity.task_id,{version:'1.0',command_id:randomUUID(),expected_sequence:0,message:t.question});await ws.waitForIdle();assert.equal(calls,3);assert.match(ws.read(t.identity.task_id).requirement_draft!.content.text,/已批准资产/);
  const fresh=ws.read(t.identity.task_id),controller=new AbortController(),make=(disclosure:boolean)=>createOpenAnalysisApplication({materialRoot:directory,metricAssets:assets,metricAssetDisclosureAllowed:disclosure,metricAssetChoice:{id:approved.asset.id,version:approved.asset.version},loadSelectedSource:async()=>fresh.source,isAuthorized:()=>true}).prepare({identity:fresh.identity,question:fresh.question,signal:controller.signal});
  const p=await make(true),file=join(directory,'020_clean',resource.path),files=await createAnalysisFiles({cwd:directory,reportPath:'060_reports/test.md',signal:controller.signal,authorize:()=>true,materials:p.materials,authorizeResources:p.authorizeResources}),read=(path:string,signal:AbortSignal)=>files.tools.find(t=>t.name==='read')!.execute({path},signal);
  assert.ok(JSON.stringify(await read(file,controller.signal)).includes('metric_asset_definition_json'));await assert.rejects(()=>read(file.replace(approved.asset.bytes_sha256,'0'.repeat(64)),controller.signal));
  const cancelled=new AbortController();cancelled.abort();await assert.rejects(()=>read(file,cancelled.signal));
  const denied=await make(false),deniedFiles=await createAnalysisFiles({cwd:directory,reportPath:'060_reports/denied.md',signal:controller.signal,authorize:()=>true,materials:denied.materials,authorizeResources:denied.authorizeResources});await assert.rejects(()=>deniedFiles.tools.find(t=>t.name==='read')!.execute({path:file},controller.signal));
  assets.revoke({command_id:randomUUID(),id:approved.asset.id,version:approved.asset.version,owner:approved.approval.owner});await assert.rejects(()=>p.authorizeResources(controller.signal,file),{code:'ASSET_APPROVAL_REVOKED'});await assert.rejects(()=>read(file,controller.signal));assert.equal(calls,3);
 }finally{await ws.close();}
});

test('CW01-02/06: normal HTTP/client acknowledges a pending reply and clears it only by durable readback, without resending',async()=>{
 const root=mkdtempSync(join(process.env.JUANERAI_NEWARCH_SHORT_ROOT!,'cw-http-'));let finish!:()=>void,calls=0;const gate=new Promise<void>(resolve=>{finish=resolve;});
 const ws=createPersonalOpenAnalysisWorkspace({projectRoot:root,project_id:randomUUID(),inspect,analysisModel:'mimo-v2.6-flash',credentials:offlineCredentials,judgmentReview:false,fetch:async()=>{calls++;await gate;return offlineResponse(calls,[],'SCR：先讨论。Binding：资料待补。IR：原因未知，继续补充。');}});
 const unused=async():Promise<never>=>assert.fail('not a membership operation');
 const server=await startBrowserMembershipServer({open:ws,store:{readBrowserReportCopy:unused,readBrowserTask:unused,readBrowserReceipt:unused,stopBrowserTask:unused}});
 try{
  const boot=await fetch(server.origin+'/v1/bootstrap',{method:'POST',headers:{'content-type':'application/json',origin:server.origin},body:JSON.stringify({token:server.bootstrap})});const cookie=boot.headers.get('set-cookie')!.split(';')[0]!,control=(await boot.json()).control;
  const task=await ws.submit({version:'1.0',command_id:randomUUID(),mode:'requirements',question:'共同讨论分析需求。',confirmed:true,sources:[]});
  const client=createQuickAnalysisClient({control,request:(path,options={})=>fetch(server.origin+String(path),{...options,headers:{...options.headers,cookie,origin:server.origin}})});
  const accepted=await client.discussRequirement(task.identity.task_id,0,'补充：先只明确口径。');assert.equal(accepted.identity.task_id,task.identity.task_id);assert.equal(client.pending()?.kind,'requirement-discussion');assert.equal(ws.read(task.identity.task_id).requirement_draft,undefined,'accepted is not a false save receipt');
  finish();await ws.waitForIdle();const readback=await client.list();assert.equal(readback[0]!.requirement_draft!.conversation![0]!.user.text,'补充：先只明确口径。');assert.equal(client.pending(),null);assert.equal(calls,1);await client.list();assert.equal(calls,1);
 }finally{finish();await ws.waitForIdle();await server.close();await ws.close();}
});

test('CW01-06: actual saved conversation is readable in the normal UI without a review/start wizard',async()=>{
 const root=mkdtempSync(join(process.env.JUANERAI_NEWARCH_SHORT_ROOT!,'cw-ui-'));let calls=0;
 const ws=createPersonalOpenAnalysisWorkspace({projectRoot:root,project_id:randomUUID(),inspect,analysisModel:'mimo-v2.6-flash',credentials:offlineCredentials,judgmentReview:false,fetch:async()=>offlineResponse(++calls,[],calls===1?'SCR：先看订单。Binding：资料待补。IR：范围待共同说明。':'SCR：只看本期订单。Binding：金额按元。IR：保留原因未知，不推断利润。')});
 try{
  const t=await ws.submit({version:'1.0',command_id:randomUUID(),mode:'requirements',question:'先聊清楚订单分析。',confirmed:true,sources:[]});
  await ws.discussRequirement(t.identity.task_id,{version:'1.0',command_id:randomUUID(),expected_sequence:0,message:t.question});await ws.waitForIdle();
  await ws.discussRequirement(t.identity.task_id,{version:'1.0',command_id:randomUUID(),expected_sequence:1,message:'补充：金额按元，只看本期。'});await ws.waitForIdle();
  const view=openTaskView(ws.read(t.identity.task_id));
  const ready=renderQuickAnalysisWorkbench({project:'本机合成项目',tasks:[],mode:'quick',current:view,detail:'context',drawer:false});assert.match(ready,/data-action="requirement-start"[^>]*>按当前理解分析/,'the visible dialogue must offer its one real start action directly, without a second confirmation page');
  const expanded=renderQuickAnalysisWorkbench({project:'本机合成项目',tasks:[],mode:'quick',current:view,detail:'context',drawer:false,expanded:'requirement'});
  assert.match(expanded,/金额按元/);assert.match(expanded,/原因未知/);assert.doesNotMatch(expanded,/data-action="requirement-review"/);assert.match(expanded,/data-action="requirement-start"[^>]*>按当前理解分析/);assert.doesNotMatch(expanded,/data-action="requirement-start"[^>]*disabled/);
  const thread=renderQuickAnalysisWorkbench({project:'本机合成项目',tasks:[],mode:'quick',detail:'context',drawer:false,current:{...view,taskState:'running'}});
  assert.match(thread,/先聊清楚订单分析/);assert.match(thread,/补充：金额按元/);assert.match(thread,/Binding：资料待补/);assert.doesNotMatch(thread,/<details class="analysis-disclosure">/,'active discussion is not hidden behind a workflow disclosure');
 }finally{await ws.close();}
});

test('CW01-03/04/07: one explicit confirmation consumes the same readable three-core context, saves R0 and retains qualification',async()=>{
 const root=mkdtempSync(join(process.env.JUANERAI_NEWARCH_SHORT_ROOT!,'cw-start-')),project_id=randomUUID(),failures:string[]=[],requests:Record<string,any>[]=[];
 const understanding='## 最终分析需求三核心\nSCR：按用户明确条件观察订单金额；缺企业定义。\nBinding：当前订单CSV的amount，单位元。\nIR：给出有限观察、来源和补证建议，不推断原因、利润或现实行动。';
 const report='# 订单观察\n当前资料的模型解释；未独立核验，缺因果证据。';
 const options={projectRoot:root,project_id,inspect,analysisModel:'mimo-v2.6-flash' as const,credentials:offlineCredentials,judgmentReview:false,onFailure:(code:string)=>failures.push(code),fetch:async(_url:unknown,init?:RequestInit)=>{const dto=JSON.parse(String(init!.body));requests.push(dto);if(requests.length===3){const path=JSON.stringify(dto.messages.filter((m:any)=>['system','developer'].includes(m.role))).match(/\/[^"\\\n]*\/060_reports\/draft\/report-[a-f0-9]{64}\.md/)?.[0];assert.ok(path,'normal Markdown formation receives its native current draft capability before calling');return offlineResponse(3,[{name:'write',args:{path,content:report}}]);}return offlineResponse(requests.length,[],requests.length===1?understanding:requests.length===2?'按已确认需求分析，保留未知。':'本次指定草稿已完成；这段回执不能替代实际报告正文。');}};
 const ws=createPersonalOpenAnalysisWorkspace(options);
 try{
  const t=await ws.submit({version:'1.0',command_id:randomUUID(),question:'金额按元计，先共同明确需求，不认证因果。',confirmed:true,mode:'requirements',sources:[{source_id:randomUUID(),display_name:'订单.csv',format:'csv',bytes:Buffer.from('id,amount\na,11\n')}]});
  await ws.discussRequirement(t.identity.task_id,{version:'1.0',command_id:randomUUID(),expected_sequence:0,message:'补充：本次不做促销预算。'});await ws.waitForIdle();assert.equal(requests.length,1);
  const draft=ws.read(t.identity.task_id).requirement_draft!;assert.equal(Reflect.get(draft.content,'text'),understanding);
  const command={version:'2.0',command_id:randomUUID(),expected_revision:draft.revision,expected_analysis_revision:t.identity.revision,scope_sha256:t.identity.scope_sha256,confirmed:true};
  await ws.startRequirement(t.identity.task_id,command);await ws.waitForIdle();
  assert.deepEqual(failures,[]);assert.equal(requests.length,4);const saved=ws.read(t.identity.task_id);assert.equal(saved.state,'saved');assert.equal(saved.model_report!.text,report);assert.equal(saved.model_report!.verification,'not_performed');assert.equal(Object.hasOwn(saved.model_report!,'calculation'),false);assert.equal(saved.requirement_execution!.content.text,understanding);
  assert.ok(openTaskView(saved).messages.some(m=>m.role==='assistant'&&m.text===understanding),'saved report must retain its actual discussion, not replace it with an execution wizard');
  const consumed=Reflect.get(saved.model_report!.contract,'requirements');assert.equal(consumed?.text,understanding);assert.equal(consumed?.confirmed,true);
  for(const dto of requests.slice(1)){assert.match(JSON.stringify(dto.messages),/本次不做促销预算/);assert.ok(!JSON.stringify(dto.messages).includes('"analysis_contract"'));assert.match(JSON.stringify(dto.messages),/最终分析需求三核心/);assert.ok(!dto.tools.some((t:any)=>['describe_business','interpret_meaning','assess_meaning','bind_measurement','describe_meaning','update_requirement_framework'].includes(t.function?.name??t.name)));}
  const before=requests.length;await ws.startRequirement(t.identity.task_id,command);await ws.waitForIdle();assert.equal(requests.length,before);assert.equal((await ws.diagnostics(t.identity.task_id)).unconfirmed_effects,false);
 }finally{await ws.close();}
});


test('CW01-07: post-save review consumes confirmed readable context while blind recomputation excludes the assistant understanding',async()=>{
 const root=mkdtempSync(join(process.env.JUANERAI_NEWARCH_SHORT_ROOT!,'cw-post-')),understanding='SCR：只提供有限观察及补证路径。Binding：用户说明金额单位 CNY。IR：模型假设 PRIVATE_UNDERSTANDING_999999 尚待验证，不认证因果。';
 const provider=postReportProvider({initial:'# 样本观察\n\n当前金额合计为30 CNY。\n\n原因资料不足，建议先补充来源记录。'});let discussion=true;
 const ws=createPersonalOpenAnalysisWorkspace({projectRoot:root,project_id:randomUUID(),inspect,analysisModel:'mimo-v2.6-flash',credentials:offlineCredentials,judgmentReview:true,fetch:async(url,init)=>{if(discussion){discussion=false;return offlineResponse(1,[],understanding);}return provider.fetch(url,init);}});
 try{
  const t=await ws.submit({version:'1.0',command_id:randomUUID(),mode:'requirements',question:'核对当前金额，单位 CNY；缺原因资料不推断因果，不执行业务行动。',confirmed:true,sources:[{source_id:randomUUID(),display_name:'synthetic.csv',format:'csv',bytes:Buffer.from('id,amount,currency\na,11,CNY\nb,19,CNY\n')}]});
  await ws.discussRequirement(t.identity.task_id,{version:'1.0',command_id:randomUUID(),expected_sequence:0,message:'金额单位 CNY，只给观察和补证路径。'});await ws.waitForIdle();
  const current=ws.read(t.identity.task_id);await ws.startRequirement(t.identity.task_id,{version:'2.0',command_id:randomUUID(),expected_revision:current.requirement_draft!.revision,expected_analysis_revision:current.identity.revision,scope_sha256:current.identity.scope_sha256,confirmed:true});await ws.waitForIdle();
  const saved=ws.read(t.identity.task_id);assert.equal(saved.state,'saved');assert.equal(saved.report_postprocessing!.state,'completed',JSON.stringify(saved.report_postprocessing));
  for(const request of provider.requests.filter(r=>['report-postcheck.v1','report-full-review.v1'].includes(r.phase)))assert.match(JSON.stringify(request.body),/PRIVATE_UNDERSTANDING_999999/,'author/reviewer share the same readable requirements');
  const independent=provider.requests.filter(r=>r.phase==='report-number-recompute.v1');assert.ok(independent.length);for(const request of independent)assert.doesNotMatch(JSON.stringify(request.body),/PRIVATE_UNDERSTANDING_999999/,'assistant understanding never leaks report hypotheses into blind recomputation');
  assert.equal(saved.report_postprocessing!.editions[0]!.numbers[0]!.status,'independent_consistent');
 }finally{await ws.close();}
});

test('CW01-02/03/08: confirmation cannot resume a stopped Task; explicit draft resume remains passive',async()=>{
 const root=mkdtempSync(join(process.env.JUANERAI_NEWARCH_SHORT_ROOT!,'cw-stop-'));let calls=0;
 const ws=createPersonalOpenAnalysisWorkspace({projectRoot:root,project_id:randomUUID(),inspect,analysisModel:'mimo-v2.6-flash',credentials:offlineCredentials,judgmentReview:false,fetch:async()=>offlineResponse(++calls,[],'有限观察，尚未核验。')});
 try{const t=await ws.submit({version:'1.0',command_id:randomUUID(),mode:'requirements',question:'先保存需求，稍后再分析。',confirmed:true,sources:[]});await ws.discussRequirement(t.identity.task_id,{version:'1.0',command_id:randomUUID(),expected_sequence:0,message:'先保存，不开始分析。'});await ws.waitForIdle();assert.equal(calls,1);await ws.stop(t.identity.task_id);
 const command={version:'2.0',command_id:randomUUID(),expected_revision:1,expected_analysis_revision:t.identity.revision,scope_sha256:t.identity.scope_sha256,confirmed:true};
 await assert.rejects(()=>ws.startRequirement(t.identity.task_id,command),{code:'TASK_UNCONFIRMED'});await ws.waitForIdle();assert.equal(calls,1);assert.equal(ws.read(t.identity.task_id).state,'stopped');
 await ws.resume(t.identity.task_id);assert.equal(ws.read(t.identity.task_id).state,'ready');assert.equal(calls,1);await ws.startRequirement(t.identity.task_id,command);await ws.waitForIdle();assert.equal(ws.read(t.identity.task_id).state,'saved');assert.equal(calls,3);
 }finally{await ws.close();}
});

// Acceptance counterexamples first reproduced independently in native-001.
const cwRegressionSource=(name='synthetic.csv')=>({source_id:randomUUID(),display_name:name,format:'csv' as const,bytes:Buffer.from('amount\n11\n')});
test('CW01-V001 CW01-02/06/07: a consumed in-flight USER_SAID supplement survives independently of assistant summary',async()=>{
 const root=mkdtempSync(join(process.env.JUANERAI_NEWARCH_SHORT_ROOT!,'v-queue-'));let entered!:()=>void,release!:()=>void,calls=0;
 const began=new Promise<void>(r=>entered=r),gate=new Promise<void>(r=>release=r),requests:any[]=[];const word='用户明确条件：仅限北区，禁止提出促销预算 V_RAW_7284';
 const ws=createPersonalOpenAnalysisWorkspace({projectRoot:root,project_id:randomUUID(),inspect,analysisModel:'mimo-v2.6-flash',credentials:offlineCredentials,judgmentReview:false,fetch:async(_url,init)=>{requests.push(JSON.parse(String(init!.body)));calls++;if(calls===1){entered();await gate;}return offlineResponse(calls,[],calls<3?'SCR：订单观察。Binding：当前资料。IR：有限报告。':'未独立核验的有限报告。');}});
 try{const t=await ws.submit({version:'1.0',command_id:randomUUID(),mode:'requirements',question:'先讨论订单分析。',confirmed:true,sources:[cwRegressionSource()]});await ws.discussRequirement(t.identity.task_id,{version:'1.0',command_id:randomUUID(),expected_sequence:0,message:'先理清目标。'});await began;
 await ws.sessionControl(t.identity.task_id,{version:'1.0',expected_revision:t.identity.revision,command:{kind:'steer',text:word}});release();await ws.waitForIdle();assert.match(JSON.stringify(requests[1].messages),/V_RAW_7284/,'positive control: Pi consumed the native queued supplement');
 const discussed=ws.read(t.identity.task_id);await ws.startRequirement(t.identity.task_id,{version:'2.0',command_id:randomUUID(),expected_revision:discussed.requirement_draft!.revision,expected_analysis_revision:discussed.identity.revision,scope_sha256:discussed.identity.scope_sha256,confirmed:true});await ws.waitForIdle();
 const saved=ws.read(t.identity.task_id);writeFileSync(join(root,'observation.json'),JSON.stringify({requests,saved,view:openTaskView(saved)},null,2));
 assert.ok(saved.requirement_execution!.user_statements!.includes(word),'actual consumed user words must be preserved independently of assistant reply and reach the execution input');assert.match(JSON.stringify(requests.slice(2)),/V_RAW_7284/);assert.ok(openTaskView(saved).messages.some(m=>m.role==='user'&&m.text===word));
 }finally{release();await ws.waitForIdle();await ws.close();}
});
test('CW01-V002 CW01-01/02/03: after adding material the next discussion retains prior readable context and gets the current catalog',async()=>{
 const root=mkdtempSync(join(process.env.JUANERAI_NEWARCH_SHORT_ROOT!,'v-material-')),requests:any[]=[];let calls=0;
 const ws=createPersonalOpenAnalysisWorkspace({projectRoot:root,project_id:randomUUID(),inspect,analysisModel:'mimo-v2.6-flash',credentials:offlineCredentials,judgmentReview:false,fetch:async(_url,init)=>{requests.push(JSON.parse(String(init!.body)));return offlineResponse(++calls,[],'SCR：仅限北区订单 V_CONTEXT_3961。Binding：金额按元。IR：保留原因未知。');}});
 try{const t=await ws.submit({version:'1.0',command_id:randomUUID(),mode:'requirements',question:'只分析北区订单 ORIGINAL_4519。',confirmed:true,sources:[]});await ws.discussRequirement(t.identity.task_id,{version:'1.0',command_id:randomUUID(),expected_sequence:0,message:'金额按元 USER_5861。'});await ws.waitForIdle();const added=cwRegressionSource('新资料_SCOPE_9132.csv');await ws.addRequirementMaterials(t.identity.task_id,{version:'1.0',command_id:randomUUID(),expected_revision:t.identity.revision,sources:[added]});await ws.discussRequirement(t.identity.task_id,{version:'1.0',command_id:randomUUID(),expected_sequence:1,message:'资料已补好，继续整理。'});await ws.waitForIdle();writeFileSync(join(root,'observation.json'),JSON.stringify({requests,saved:ws.read(t.identity.task_id)},null,2));const body=JSON.stringify(requests[1].messages);
 assert.match(body,/ORIGINAL_4519/,'new revision native Session still needs original question');assert.match(body,/USER_5861/,'actual earlier user words must remain available');assert.match(body,/V_CONTEXT_3961/,'prior current understanding must remain available');assert.match(body,new RegExp(added.source_id),'newly authorized material must be discoverable');
 }finally{await ws.close();}
});

test('CW01-V003 CW01-02/06: a settled empty discussion reply exposes a recoverable terminal failure through normal HTTP',async()=>{
 const {startBrowserMembershipServer}=await import('../../../apps/browser/local-server.ts');
 const {createQuickAnalysisClient}=await import('../../../apps/browser/quick-analysis-client.mjs');
 const root=mkdtempSync(join(process.env.JUANERAI_NEWARCH_SHORT_ROOT!,'v-failure-'));let calls=0;const failures:string[]=[];
 const ws=createPersonalOpenAnalysisWorkspace({projectRoot:root,project_id:randomUUID(),inspect,analysisModel:'mimo-v2.6-flash',credentials:offlineCredentials,judgmentReview:false,onFailure:c=>failures.push(c),fetch:async()=>offlineResponse(++calls,[],'')});
 const unused=async():Promise<never>=>assert.fail('not a membership operation');const server=await startBrowserMembershipServer({open:ws,store:{readBrowserReportCopy:unused,readBrowserTask:unused,readBrowserReceipt:unused,stopBrowserTask:unused}});
 try{const b=await fetch(server.origin+'/v1/bootstrap',{method:'POST',headers:{'content-type':'application/json',origin:server.origin},body:JSON.stringify({token:server.bootstrap})});const cookie=b.headers.get('set-cookie')!.split(';')[0]!,control=(await b.json()).control;
 const t=await ws.submit({version:'1.0',command_id:randomUUID(),mode:'requirements',question:'先讨论需求。',confirmed:true,sources:[]});const client=createQuickAnalysisClient({control,request:(path,options={})=>fetch(server.origin+String(path),{...options,headers:{...options.headers,cookie,origin:server.origin}})});
 await client.discussRequirement(t.identity.task_id,0,'请先说明你理解的范围。');await ws.waitForIdle();const command_id=client.pending()?.command_id;assert.ok(command_id);const requestReceipt=await ws.requirementDiscussionReceipt(t.identity.task_id,command_id);await client.list();let recoveryError='';try{await client.recover();}catch(e){recoveryError=String(e);}const saved=ws.read(t.identity.task_id),facts=await ws.diagnostics(t.identity.task_id);writeFileSync(join(root,'observation.json'),JSON.stringify({calls,failures,saved,facts,requestReceipt,pending:client.pending(),recoveryError},null,2));assert.deepEqual(failures,['INVALID_OUTPUT']);assert.equal(facts.unconfirmed_effects,false,'positive control: the SDK effect is settled');
 assert.equal(client.pending(),null,'a proven settled failed response needs a terminal reconciliation; an endless pending receipt blocks any explicit correction');
 }finally{await server.close();await ws.close();}
});

test('CW01-V003: exact terminal receipt survives passive reopen; unknown usage and a different command never clear pending',async()=>{
 for(const unknownUsage of [false,true]){
  const root=mkdtempSync(join(process.env.JUANERAI_NEWARCH_SHORT_ROOT!,'cw-receipt-')),project_id=randomUUID();let calls=0;
  const options={projectRoot:root,project_id,inspect,analysisModel:'mimo-v2.6-flash' as const,credentials:offlineCredentials,judgmentReview:false,fetch:async()=>{const response=offlineResponse(++calls,[],'');if(!unknownUsage)return response;const chunk=JSON.parse((await response.text()).split('\n')[0]!.slice(6));delete chunk.usage;return new Response('data: '+JSON.stringify(chunk)+'\n\ndata: [DONE]\n\n',{headers:{'content-type':'text/event-stream'}});}};
  let ws=createPersonalOpenAnalysisWorkspace(options);
  try{const t=await ws.submit({version:'1.0',command_id:randomUUID(),mode:'requirements',question:'Only a synthetic discussion; no execution.',confirmed:true,sources:[]}),command_id=randomUUID();await ws.discussRequirement(t.identity.task_id,{version:'1.0',command_id,expected_sequence:0,message:'Keep my actual input after a failed reply.'});await ws.waitForIdle();
   const receipt=await ws.requirementDiscussionReceipt(t.identity.task_id,command_id),other=await ws.requirementDiscussionReceipt(t.identity.task_id,randomUUID());assert.equal(other.state,'unavailable');assert.equal(other.settled,false);assert.equal(receipt.state,unknownUsage?'unconfirmed':'failed');assert.equal(receipt.settled,!unknownUsage);const before=calls;
   await ws.close();ws=createPersonalOpenAnalysisWorkspace(options);assert.deepEqual(await ws.requirementDiscussionReceipt(t.identity.task_id,command_id),receipt);assert.equal(calls,before,'passive failed-request readback never resends');assert.equal((await ws.diagnostics(t.identity.task_id)).unconfirmed_effects,unknownUsage);
  }finally{await ws.close();}
 }
});

test('CW01-V003: normal HTTP lost accepted response reconciles by exact saved discussion and never repeats a model call',async()=>{
 const root=mkdtempSync(join(process.env.JUANERAI_NEWARCH_SHORT_ROOT!,'cw-lost-'));let calls=0;
 const ws=createPersonalOpenAnalysisWorkspace({projectRoot:root,project_id:randomUUID(),inspect,analysisModel:'mimo-v2.6-flash',credentials:offlineCredentials,judgmentReview:false,fetch:async()=>offlineResponse(++calls,[],'A saved readable understanding; this is not user confirmation.')});
 const unused=async():Promise<never>=>assert.fail('not a membership operation'),server=await startBrowserMembershipServer({open:ws,store:{readBrowserReportCopy:unused,readBrowserTask:unused,readBrowserReceipt:unused,stopBrowserTask:unused}});
 try{const b=await fetch(server.origin+'/v1/bootstrap',{method:'POST',headers:{'content-type':'application/json',origin:server.origin},body:JSON.stringify({token:server.bootstrap})}),cookie=b.headers.get('set-cookie')!.split(';')[0]!,control=(await b.json()).control;
  const t=await ws.submit({version:'1.0',command_id:randomUUID(),mode:'requirements',question:'Discuss now; analyze only after my explicit confirmation.',confirmed:true,sources:[]});let lost=false;
  const client=createQuickAnalysisClient({control,request:async(path,options={})=>{const response=await fetch(server.origin+String(path),{...options,headers:{...options.headers,cookie,origin:server.origin}});if(String(path).endsWith('/requirement-discussion')&&!lost){lost=true;throw new Error('synthetic lost HTTP response');}return response;}});
  await assert.rejects(()=>client.discussRequirement(t.identity.task_id,0,'Keep this draft and actual user words.'),/lost HTTP/);assert.ok(client.pending());await ws.waitForIdle();await client.recover();assert.equal(client.pending(),null);assert.equal(calls,1);assert.equal(ws.read(t.identity.task_id).requirement_draft!.conversation![0]!.user.text,'Keep this draft and actual user words.');assert.equal(ws.read(t.identity.task_id).requirement_execution,undefined);
 }finally{await server.close();await ws.close();}
});

test('CW01-V001: withdrawn native queued input is not adopted as a persisted user condition',async()=>{
 const root=mkdtempSync(join(process.env.JUANERAI_NEWARCH_SHORT_ROOT!,'cw-withdraw-'));let began!:()=>void,release!:()=>void,calls=0;const entered=new Promise<void>(r=>{began=r;}),gate=new Promise<void>(r=>{release=r;});
 const ws=createPersonalOpenAnalysisWorkspace({projectRoot:root,project_id:randomUUID(),inspect,analysisModel:'mimo-v2.6-flash',credentials:offlineCredentials,judgmentReview:false,fetch:async()=>{calls++;began();await gate;return offlineResponse(calls,[],'Readable limited understanding.');}});
 try{const t=await ws.submit({version:'1.0',command_id:randomUUID(),mode:'requirements',question:'Keep the authorized current scope.',confirmed:true,sources:[]});await ws.discussRequirement(t.identity.task_id,{version:'1.0',command_id:randomUUID(),expected_sequence:0,message:t.question});await entered;
  const queued=await ws.sessionControl(t.identity.task_id,{version:'1.0',expected_revision:t.identity.revision,command:{kind:'nextRun',text:'WITHDRAWN_INPUT_5931 must never be adopted.'}});assert.ok(queued.accepted_input?.id);const removed=await ws.sessionControl(t.identity.task_id,{version:'1.0',expected_revision:t.identity.revision,command:{kind:'cancelQueued',entryId:queued.accepted_input!.id}});assert.equal(removed.withdrawn_input?.accepted,true);
  release();await ws.waitForIdle();assert.equal(calls,1);const saved=ws.read(t.identity.task_id);assert.doesNotMatch(JSON.stringify(saved.requirement_draft),/WITHDRAWN_INPUT_5931/);assert.equal((await ws.diagnostics(t.identity.task_id)).unconfirmed_effects,false);
 }finally{release();await ws.waitForIdle();await ws.close();}
});

// Composed counterexamples independently reproduced in native-002.
test('CW01-V004: consumed user words from a settled failed discussion survive the next explicit successful discussion',async()=>{
 const root=mkdtempSync(join(process.env.JUANERAI_NEWARCH_SHORT_ROOT!,'v-failed-words-'));let entered!:()=>void,release!:()=>void,calls=0;const began=new Promise<void>(r=>entered=r),gate=new Promise<void>(r=>release=r),requests:any[]=[],failures:string[]=[];const word='只准分析北区，禁止促销预算 FAILED_RAW_92741';
 const ws=createPersonalOpenAnalysisWorkspace({projectRoot:root,project_id:randomUUID(),inspect,analysisModel:'mimo-v2.6-flash',credentials:offlineCredentials,judgmentReview:false,onFailure:c=>failures.push(c),fetch:async(_url,init)=>{requests.push(JSON.parse(String(init!.body)));calls++;if(calls===1){entered();await gate;return offlineResponse(calls,[],'SCR：先讨论。Binding：资料不足。IR：等待本轮补充。');}return offlineResponse(calls,[],calls===2?'':'SCR：有限订单观察。Binding：当前资料。IR：原因未知。');}});
 try{const t=await ws.submit({version:'1.0',command_id:randomUUID(),mode:'requirements',question:'讨论订单范围，不执行现实行动。',confirmed:true,sources:[cwRegressionSource()]}),first={version:'1.0',command_id:randomUUID(),expected_sequence:0,message:'先理清订单需求。'};await ws.discussRequirement(t.identity.task_id,first);await began;await ws.sessionControl(t.identity.task_id,{version:'1.0',expected_revision:t.identity.revision,command:{kind:'steer',text:word}});release();await ws.waitForIdle();assert.equal(calls,2);assert.match(JSON.stringify(requests[1].messages),/FAILED_RAW_92741/);assert.equal((await ws.requirementDiscussionReceipt(t.identity.task_id,first.command_id)).state,'failed');assert.equal((await ws.diagnostics(t.identity.task_id)).unconfirmed_effects,false);
 await ws.discussRequirement(t.identity.task_id,{version:'1.0',command_id:randomUUID(),expected_sequence:0,message:'现在请继续整理，我会确认当前正文。'});await ws.waitForIdle();const ready=ws.read(t.identity.task_id);assert.ok(ready.requirement_draft);await ws.startRequirement(t.identity.task_id,{version:'2.0',command_id:randomUUID(),expected_revision:ready.requirement_draft!.revision,expected_analysis_revision:ready.identity.revision,scope_sha256:ready.identity.scope_sha256,confirmed:true});await ws.waitForIdle();const saved=ws.read(t.identity.task_id);writeFileSync(join(root,'observation.json'),JSON.stringify({word,requests,calls,failures,saved,view:openTaskView(saved)},null,2));assert.ok(saved.requirement_execution!.user_statements!.includes(word),'previously consumed actual user words cannot be lost merely because that discussion failed before saving');assert.match(JSON.stringify(requests.slice(3)),/FAILED_RAW_92741/);
 }finally{release();await ws.waitForIdle();await ws.close();}
});

test('CW01-V004: consumed input also survives a pre-commit Store failure followed by an explicit successful continuation',async()=>{
 const {createOpenAnalysisWorkspace}=await import('../../../packages/application/open-analysis-workspace.ts');const {createLocalOpenAnalysisStore}=await import('../../../adapters/storage-local/open-analysis.ts');
 const root=mkdtempSync(join(process.env.JUANERAI_NEWARCH_SHORT_ROOT!,'v-save-words-'));let entered!:()=>void,release!:()=>void,calls=0,failOnce=true;const began=new Promise<void>(r=>entered=r),gate=new Promise<void>(r=>release=r),requests:any[]=[],failures:string[]=[],word='仅限北区且禁止预算建议 SAVE_FAILED_RAW_3861';
 const profile=createPersonalOpenAnalysisWorkspace({projectRoot:root,project_id:randomUUID(),inspect,analysisModel:'mimo-v2.6-flash',credentials:offlineCredentials,judgmentReview:false,fetch:async(_url,init)=>{requests.push(JSON.parse(String(init!.body)));calls++;if(calls===1){entered();await gate;}return offlineResponse(calls,[],'SCR：有限订单分析。Binding：当前资料。IR：未知只限制相关判断。');}}),real=createLocalOpenAnalysisStore({projectRoot:root});const store={...real,saveRequirementDraft:(...args:Parameters<typeof real.saveRequirementDraft>)=>{if(failOnce){failOnce=false;throw Object.assign(new Error('Synthetic pre-commit save failure'),{code:'SYNTHETIC_SAVE_FAILED'});}return real.saveRequirementDraft(...args);}};
 const ws=createOpenAnalysisWorkspace({agent:profile.professionalAgent,store,inspect,judgmentReview:false,authorizeConfiguration:async()=>({config_sha256:await profile.professionalAgent.configuration()}),onFailure:c=>failures.push(c)});
 try{const t=await ws.submit({version:'1.0',command_id:randomUUID(),mode:'requirements',question:'先讨论订单目标。',confirmed:true,sources:[cwRegressionSource()]});await ws.discussRequirement(t.identity.task_id,{version:'1.0',command_id:randomUUID(),expected_sequence:0,message:'先共同理清，不执行现实行动。'});await began;await ws.sessionControl(t.identity.task_id,{version:'1.0',expected_revision:t.identity.revision,command:{kind:'steer',text:word}});release();await ws.waitForIdle();assert.equal(calls,2);assert.match(JSON.stringify(requests[1].messages),/SAVE_FAILED_RAW_3861/);assert.equal((await ws.diagnostics(t.identity.task_id)).unconfirmed_effects,false);assert.deepEqual(failures,['SYNTHETIC_SAVE_FAILED']);
 await ws.discussRequirement(t.identity.task_id,{version:'1.0',command_id:randomUUID(),expected_sequence:0,message:'请继续按此前说明整理需求。'});await ws.waitForIdle();const ready=ws.read(t.identity.task_id);await ws.startRequirement(t.identity.task_id,{version:'2.0',command_id:randomUUID(),expected_revision:ready.requirement_draft!.revision,expected_analysis_revision:ready.identity.revision,scope_sha256:ready.identity.scope_sha256,confirmed:true});await ws.waitForIdle();const saved=ws.read(t.identity.task_id);writeFileSync(join(root,'observation.json'),JSON.stringify({word,requests,calls,failures,saved,view:openTaskView(saved)},null,2));assert.ok(saved.requirement_execution!.user_statements!.includes(word),'save failure does not erase already consumed actual user conditions from the next confirmed execution');
 }finally{release();await ws.waitForIdle();await ws.close();await profile.close();}
});

test('Validator CW01-01/02/06: a saved new requirement Task can pass the normal UI passive snapshot before its first explicit discussion',async()=>{
 const root=mkdtempSync(join(process.env.JUANERAI_NEWARCH_SHORT_ROOT!,'v-first-resume-'));let calls=0;const ws=createPersonalOpenAnalysisWorkspace({projectRoot:root,project_id:randomUUID(),inspect,analysisModel:'mimo-v2.6-flash',credentials:offlineCredentials,judgmentReview:false,fetch:async()=>offlineResponse(++calls,[],'SCR：有限订单观察。Binding：待资料。IR：先澄清。')});
 try{const t=await ws.submit({version:'1.0',command_id:randomUUID(),mode:'requirements',question:'已保存新任务，首次讨论还没发送。',confirmed:true,sources:[]});let code:string|undefined;let snapshot;try{snapshot=await ws.sessionControl(t.identity.task_id,{version:'1.0',expected_revision:t.identity.revision,command:{kind:'snapshot'}});}catch(e){code=String(Reflect.get(e as object,'code'));}const before=ws.read(t.identity.task_id);await ws.discussRequirement(t.identity.task_id,{version:'1.0',command_id:randomUUID(),expected_sequence:0,message:'明确请求继续理清本次需求。'});await ws.waitForIdle();const saved=ws.read(t.identity.task_id);writeFileSync(join(root,'observation.json'),JSON.stringify({code,snapshot,before,saved,calls},null,2));assert.equal(saved.requirement_draft?.sequence,1,'positive control: direct public discussion correctly authorizes the first configuration');assert.equal(calls,1);assert.equal(code,undefined,'the passive pre-send snapshot used by the normal UI must not prevent the first explicit discussion after reopening a saved Task');
 }finally{await ws.close();}
});


test('CW01-V005: passive unconfigured requirement snapshot cannot block its first explicit discussion',async()=>{
 const root=mkdtempSync(join(process.env.JUANERAI_NEWARCH_SHORT_ROOT!,'cw-unconfigured-'));let calls=0;
 const ws=createPersonalOpenAnalysisWorkspace({projectRoot:root,project_id:randomUUID(),inspect,analysisModel:'mimo-v2.6-flash',credentials:offlineCredentials,judgmentReview:false,fetch:async()=>offlineResponse(++calls,[],'Readable current requirements.')});
 try{const t=await ws.submit({version:'1.0',command_id:randomUUID(),mode:'requirements',question:'First preserve my need; the model has not started.',confirmed:true,sources:[]});const view=await ws.sessionControl(t.identity.task_id,{version:'1.0',expected_revision:t.identity.revision,command:{kind:'snapshot'}});assert.equal(view.availability,'unavailable');assert.equal(calls,0);assert.equal(ws.read(t.identity.task_id).identity.config_sha256,t.identity.config_sha256);await ws.discussRequirement(t.identity.task_id,{version:'1.0',command_id:randomUUID(),expected_sequence:0,message:'Now explicitly discuss the scope.'});await ws.waitForIdle();assert.equal(calls,1);assert.ok(ws.read(t.identity.task_id).requirement_draft);}
 finally{await ws.close();}
});

// Source-notification failure counterexample independently reproduced in native-003.
test('CW01-V006: failed native-consumed-source persistence cannot permit a later continuation that silently loses those words',async()=>{
 const {createOpenAnalysisWorkspace}=await import('../../../packages/application/open-analysis-workspace.ts');const {createLocalOpenAnalysisStore}=await import('../../../adapters/storage-local/open-analysis.ts');
 const root=mkdtempSync(join(process.env.JUANERAI_NEWARCH_SHORT_ROOT!,'v-notify-fail-'));let entered!:()=>void,release!:()=>void,calls=0,sourceWrites=0;const began=new Promise<void>(r=>entered=r),gate=new Promise<void>(r=>release=r),requests:any[]=[],failures:string[]=[],word='仅限北区且禁止促销预算 SOURCE_NOTIFY_RAW_6251';
 const profile=createPersonalOpenAnalysisWorkspace({projectRoot:root,project_id:randomUUID(),inspect,analysisModel:'mimo-v2.6-flash',credentials:offlineCredentials,judgmentReview:false,fetch:async(_url,init)=>{requests.push(JSON.parse(String(init!.body)));calls++;if(calls===1){entered();await gate;}return offlineResponse(calls,[],'SCR：有限订单观察。Binding：当前资料。IR：原因未知。');}}),real=createLocalOpenAnalysisStore({projectRoot:root}),store={...real,recordRequirementInputs:(...args:Parameters<typeof real.recordRequirementInputs>)=>{sourceWrites++;if(sourceWrites===2)throw Object.assign(new Error('Synthetic native user-source save failure'),{code:'SOURCE_NOTIFY_SAVE_FAILED'});return real.recordRequirementInputs(...args);}};const ws=createOpenAnalysisWorkspace({agent:profile.professionalAgent,store,inspect,judgmentReview:false,authorizeConfiguration:async()=>({config_sha256:await profile.professionalAgent.configuration()}),onFailure:c=>failures.push(c)});
 try{const t=await ws.submit({version:'1.0',command_id:randomUUID(),mode:'requirements',question:'先讨论订单需求。',confirmed:true,sources:[cwRegressionSource()]}),first={version:'1.0',command_id:randomUUID(),expected_sequence:0,message:'请先理清范围。'};await ws.discussRequirement(t.identity.task_id,first);await began;await ws.sessionControl(t.identity.task_id,{version:'1.0',expected_revision:t.identity.revision,command:{kind:'steer',text:word}});release();await ws.waitForIdle();assert.match(JSON.stringify(requests[1].messages),/SOURCE_NOTIFY_RAW_6251/);assert.deepEqual(failures,['SOURCE_NOTIFY_SAVE_FAILED']);assert.equal(ws.read(t.identity.task_id).requirement_draft,undefined);const receipt=await ws.requirementDiscussionReceipt(t.identity.task_id,first.command_id);assert.notEqual(receipt.state,'saved');assert.equal((await ws.diagnostics(t.identity.task_id)).unconfirmed_effects,false);
 const {startBrowserMembershipServer}=await import('../../../apps/browser/local-server.ts');const {createQuickAnalysisClient}=await import('../../../apps/browser/quick-analysis-client.mjs');const unused=async():Promise<never>=>assert.fail('unrelated membership operation');const server=await startBrowserMembershipServer({open:ws as never,store:{readBrowserReportCopy:unused,readBrowserTask:unused,readBrowserReceipt:unused,stopBrowserTask:unused}});let blocked=false,blockCode='';try{const b=await fetch(server.origin+'/v1/bootstrap',{method:'POST',headers:{'content-type':'application/json',origin:server.origin},body:JSON.stringify({token:server.bootstrap})});const cookie=b.headers.get('set-cookie')!.split(';')[0]!,control=(await b.json()).control;const freshClient=createQuickAnalysisClient({control,request:(path,options={})=>fetch(server.origin+String(path),{...options,headers:{...options.headers,cookie,origin:server.origin}})});try{await freshClient.discussRequirement(t.identity.task_id,0,'按此前全部条件继续整理。');}catch(e){blocked=true;blockCode=String(e);}await ws.waitForIdle();}finally{await server.close();}let saved=ws.read(t.identity.task_id);if(!blocked){await ws.startRequirement(t.identity.task_id,{version:'2.0',command_id:randomUUID(),expected_revision:saved.requirement_draft!.revision,expected_analysis_revision:saved.identity.revision,scope_sha256:saved.identity.scope_sha256,confirmed:true});await ws.waitForIdle();saved=ws.read(t.identity.task_id);}writeFileSync(join(root,'observation.json'),JSON.stringify({word,sourceWrites,calls,receipt,blocked,blockCode,requests,failures,saved,view:openTaskView(saved)},null,2));assert.ok(blocked||saved.requirement_execution!.user_statements!.includes(word),'an unresolved actual user-source write must hold the safe boundary or recover its native words before a new confirmed analysis');
 }finally{release();await ws.waitForIdle();await ws.close();await profile.close();}
});

test('CW01-V006: source capture uncertainty survives close/reopen and blocks new commands without changing physical usage',async()=>{
 const {createOpenAnalysisWorkspace}=await import('../../../packages/application/open-analysis-workspace.ts'),{createLocalOpenAnalysisStore}=await import('../../../adapters/storage-local/open-analysis.ts');
 const root=mkdtempSync(join(process.env.JUANERAI_NEWARCH_SHORT_ROOT!,'cw-source-unknown-'));let calls=0,writes=0;
 const options={projectRoot:root,project_id:randomUUID(),inspect,analysisModel:'mimo-v2.6-flash' as const,judgmentReview:false,credentials:offlineCredentials,fetch:async()=>offlineResponse(++calls,[],'Readable model result, not a source persistence receipt.')};
 let profile=createPersonalOpenAnalysisWorkspace(options);const real=createLocalOpenAnalysisStore({projectRoot:root}),store={...real,recordRequirementInputs:(...args:Parameters<typeof real.recordRequirementInputs>)=>{if(++writes===2)throw Object.assign(new Error('synthetic source acknowledgement failure'),{code:'SOURCE_SAVE_FAILED'});return real.recordRequirementInputs(...args);}};
 const ws=createOpenAnalysisWorkspace({agent:profile.professionalAgent,store,inspect,judgmentReview:false,authorizeConfiguration:async()=>({config_sha256:await profile.professionalAgent.configuration()})});
 try{const t=await ws.submit({version:'1.0',command_id:randomUUID(),mode:'requirements',question:'Keep source uncertainty distinct from provider usage.',confirmed:true,sources:[]}),command_id=randomUUID();await ws.discussRequirement(t.identity.task_id,{version:'1.0',command_id,expected_sequence:0,message:'Preserve my business condition.'});await ws.waitForIdle();assert.equal(calls,1);const before=await ws.diagnostics(t.identity.task_id);assert.equal(before.unconfirmed_effects,false);assert.equal(ws.read(t.identity.task_id).requirement_inputs![0]!.capture_complete,false);assert.equal((await ws.requirementDiscussionReceipt(t.identity.task_id,command_id)).state,'unconfirmed');
  await ws.close();await profile.close();profile=createPersonalOpenAnalysisWorkspace(options);await assert.rejects(()=>profile.discussRequirement(t.identity.task_id,{version:'1.0',command_id:randomUUID(),expected_sequence:0,message:'New page must not bypass missing source facts.'}),{code:'TASK_UNCONFIRMED'});await profile.waitForIdle();assert.equal(calls,1);assert.deepEqual((await profile.diagnostics(t.identity.task_id)).meter,before.meter);assert.equal(profile.read(t.identity.task_id).requirement_inputs![0]!.capture_complete,false);
 }finally{await ws.close();await profile.close();}
});
