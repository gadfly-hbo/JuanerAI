import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync} from 'node:fs';
import {createAnalysisFiles} from '../../../adapters/agent-pi/analysis-files.ts';
import {join} from 'node:path';
import {randomUUID,createHash} from 'node:crypto';
import {createPersonalOpenAnalysisWorkspace} from '../../../profiles/personal/open-analysis.ts';
import {parseDesktopCsv} from '../../../packages/product-core/xanthil-desktop-decision-case.ts';
import {offlineCredentials,offlineResponse} from '../../fixtures/xanthil-desktop/offline-professional-provider.ts';
import type {MemberSourceInspector} from '../../../packages/ports/member-source.ts';
const csv=Buffer.from('id,amount,currency\na,11,CNY\nb,19,CNY\n');
const inspect:MemberSourceInspector=async({sources,cancellation_signal})=>{assert.equal(cancellation_signal.aborted,false);return {version:'1.0',sources:sources.map(s=>{const parsed=parseDesktopCsv(s.bytes);return {source_id:s.source_id,display_name:s.display_name,format:s.format,sha256:createHash('sha256').update(s.bytes).digest('hex'),byte_length:String(s.bytes.length),sheets:[{sheet_id:'csv',name:'CSV',state:'visible',rows:[parsed.headers,...parsed.rows].map((row,index)=>({row:index+1,cells:row.map((value,i)=>({column:String.fromCharCode(65+i),type:'string',value}))}))}]};})};};

test('TC01: real Workspace consumes business context and saves an unverified report without local calculation; passive reopen executes nothing',async()=>{
 const root=mkdtempSync(join(process.env.JUANERAI_NEWARCH_SHORT_ROOT!,'three-core-')),source_id=randomUUID();let calls=0;const failures:string[]=[],report='# 未独立核验的分析报告\n合成模型观察；原因证据尚缺。\n';
 const options={projectRoot:root,project_id:randomUUID(),inspect,credentials:offlineCredentials,analysisModel:'mimo-v2.6-flash' as const,judgmentReview:true,onFailure:(code:string)=>failures.push(code),fetch:async(_url:unknown,init?:RequestInit)=>{
  calls++;const dto=JSON.parse(String(init!.body));assert.equal(dto.max_tokens??dto.max_completion_tokens,32768);
  assert.ok(!dto.tools.some((t:any)=>['describe_business','describe_meaning','interpret_meaning','assess_meaning','bind_measurement'].includes(t.function.name)));
  if(calls===1)return offlineResponse(calls,[],'SCR：解释当前合成样本。Binding：仅当前获准CSV。IR：未知原因保留，不执行计算。');
  if(calls===2)return offlineResponse(calls,[{name:'read',args:{path:join(root,'analyses',submitted.identity.task_id,'020_clean/source/catalog.txt')}}]);
  if(calls===3)return offlineResponse(calls,[{name:'read',args:{path:`${root}/analyses/${submitted.identity.task_id}/020_clean/source/${source_id}/${createHash('sha256').update(csv).digest('hex')}/sheet/csv/table.txt`}}]);
  if(calls===4)return offlineResponse(calls,[],'已读取当前资料范围；原因尚未知。');
  if(calls===6)return offlineResponse(calls,[],'malformed post-save inventory, known settled response');
  assert.equal(calls,5,'report forms before post-save review');assert.equal(dto.model,'mimo-v2.6-pro');
  assert.match(JSON.stringify(dto.messages),/解释当前合成样本/);assert.match(JSON.stringify(dto.messages),/仅当前获准CSV/);assert.ok(!JSON.stringify(dto.messages).includes('"analysis_contract"'));
  assert.ok(!dto.tools.some((t:any)=>/execute|python|compute|request_report/.test(t.function.name)));
  return offlineResponse(calls,[],report);
 }};
 let workspace=createPersonalOpenAnalysisWorkspace(options);
 const submitted=await workspace.submit({version:'1.0',command_id:randomUUID(),question:'观察当前资料；原因不全也先形成有限报告。',confirmed:true,mode:'requirements',sources:[{source_id,display_name:'synthetic.csv',format:'csv',bytes:csv}]});
 await workspace.discussRequirement(submitted.identity.task_id,{version:'1.0',command_id:randomUUID(),expected_sequence:0,message:submitted.question});await workspace.waitForIdle();await workspace.startRequirement(submitted.identity.task_id,{version:'2.0',command_id:randomUUID(),expected_revision:1,expected_analysis_revision:submitted.identity.revision,scope_sha256:submitted.identity.scope_sha256,confirmed:true});await workspace.waitForIdle();const saved=workspace.read(submitted.identity.task_id);assert.deepEqual(failures,[]);assert.equal(saved.state,'saved');
 const value=Reflect.get(saved,'model_report');assert.ok(value);assert.equal(value.kind,'MODEL_ANALYSIS_REPORT');assert.equal(value.verification,'not_performed');assert.equal(Object.hasOwn(value,'calculation'),false);assert.equal(value.text,report);assert.equal(workspace.reportContent(saved.identity.task_id)?.text,report);assert.equal(saved.outcome,null);assert.equal(saved.computation_records.length,0);assert.ok(value.contract.requirements);assert.match(value.contract.requirements.text,/解释当前合成样本/);assert.equal(value.contract.requirements.confirmed,true);assert.equal(value.contract.context.business,undefined);assert.equal(value.contract.context.semantics,undefined);assert.equal(Object.hasOwn(saved,'preparation_snapshots'),false);
 assert.equal((await workspace.diagnostics(saved.identity.task_id)).unconfirmed_effects,false);
 await workspace.close();const before=calls;workspace=createPersonalOpenAnalysisWorkspace(options);assert.deepEqual(Reflect.get(workspace.read(saved.identity.task_id),'model_report'),value);assert.equal(calls,before);await workspace.close();
});

test('TC01: authorized whole-table native resource preserves exact cells; wrong source/hash, hidden sheet and cancellation stay rejected',async()=>{
 const {createOpenAnalysisApplication}=await import('../../../packages/application/open-analysis.ts');
 const {hashFiniteJson}=await import('../../../packages/product-core/member-task.ts');
 const source=await inspect({sources:[{source_id:randomUUID(),display_name:'synthetic.csv',format:'csv',bytes:csv}],cancellation_signal:new AbortController().signal,deadline_seconds:20});
 const identity={task_id:randomUUID(),revision:'1',run_id:randomUUID(),attempt_id:randomUUID(),operation_id:randomUUID(),grant_id:randomUUID(),scope_sha256:hashFiniteJson(source),config_sha256:'a'.repeat(64)},controller=new AbortController();let authorized=true;
 const p=await createOpenAnalysisApplication({materialRoot:join(process.env.JUANERAI_NEWARCH_SHORT_ROOT!,'authorized-material-'+identity.task_id),loadSelectedSource:async()=>source,isAuthorized:()=>authorized}).prepare({identity,question:'信息不全也先观察当前资料。',signal:controller.signal});
 const contract=await p.modelReportContract(),path=contract.inputs[0]!.table_path,files=await createAnalysisFiles({cwd:path.split('/020_clean/')[0]!,reportPath:'060_reports/test.md',signal:controller.signal,authorize:()=>authorized,materials:p.materials,authorizeResources:p.authorizeResources}),read=async(path:string,signal:AbortSignal)=>{const value=await files.tools.find(t=>t.name==='read')!.execute({path},signal);return (value as any).content.filter((c:any)=>c.kind==='text').map((c:any)=>c.text).join('\n');};
 const table=(await read(path,controller.signal)).split('\n').map((line:string)=>JSON.parse(line));assert.equal(table[1].cells[1].value,'amount');assert.equal(table[2].cells[1].value,'11');assert.equal(table[3].cells[1].value,'19');
 assert.equal(Object.hasOwn(p,'tools'),false);assert.equal(contract.context.business,undefined);
 await assert.rejects(()=>read(path.replace(source.sources[0]!.sha256,'0'.repeat(64)),controller.signal));
 await assert.rejects(()=>read(path.replace(source.sources[0]!.source_id,randomUUID()),controller.signal));
 await assert.rejects(()=>read(path.replace('/csv/','/hidden/'),controller.signal));
 authorized=false;await assert.rejects(()=>read(path,controller.signal));authorized=true;controller.abort();await assert.rejects(()=>read(path,controller.signal));
});

test('TC01: Store refuses stale context, another Task and fabricated verification; cancel invalidates save lease',async()=>{
 const {createLocalOpenAnalysisStore}=await import('../../../adapters/storage-local/open-analysis.ts');
 const {compileOpenAnalysisContext,compileOpenModelReportContract}=await import('../../../packages/product-core/open-analysis-context.ts');
 const {hashFiniteJson}=await import('../../../packages/product-core/member-task.ts');
 const root=mkdtempSync(join(process.env.JUANERAI_NEWARCH_SHORT_ROOT!,'store-model-')),store=createLocalOpenAnalysisStore({projectRoot:root});
 const source=await inspect({sources:[{source_id:randomUUID(),display_name:'synthetic.csv',format:'csv',bytes:csv}],cancellation_signal:new AbortController().signal,deadline_seconds:20});
 const identity={task_id:randomUUID(),revision:'1',run_id:randomUUID(),attempt_id:randomUUID(),operation_id:randomUUID(),grant_id:randomUUID(),scope_sha256:hashFiniteJson(source),config_sha256:'a'.repeat(64)},question='当前资料有限观察。';
 store.create({identity,question,source});const lease=store.begin(identity.task_id);
 const value={version:'1.1' as const,outcome_id:randomUUID(),identity,kind:'MODEL_ANALYSIS_REPORT' as const,text:'未独立核验',verification:'not_performed' as const,human_judgment:'not_recorded' as const,contract:compileOpenModelReportContract(compileOpenAnalysisContext(question,source),join(root,'analyses',identity.task_id))};
 assert.throws(()=>store.saveModelReport!(lease,{...value,identity:{...identity,task_id:randomUUID()}}));
 assert.throws(()=>store.saveModelReport!(lease,{...value,contract:{...value.contract,context:{...value.contract.context,inspection_sha256:'0'.repeat(64)}}}));
 assert.throws(()=>store.saveModelReport!(lease,Object.assign({},value,{verification:'independent_arithmetic'}) as typeof value));
 assert.equal(store.read(identity.task_id)?.state,'running');assert.equal(store.read(identity.task_id)?.model_report,undefined);
 store.stop(identity.task_id);assert.throws(()=>store.saveModelReport!(lease,value));assert.notEqual(store.read(identity.task_id)?.state,'saved');
});
