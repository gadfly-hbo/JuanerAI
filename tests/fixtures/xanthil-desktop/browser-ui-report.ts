import assert from 'node:assert/strict';
import {mkdtempSync} from 'node:fs';
import {join} from 'node:path';
import {randomUUID} from 'node:crypto';
import {createLocalOpenAnalysisStore} from '../../../adapters/storage-local/open-analysis.ts';
import {taskHash} from '../../../packages/product-core/member-task.ts';
import {compileOpenAnalysisIR,executeOpenAnalysisIR} from '../../../packages/product-core/open-analysis-ir.ts';
import {verifyOpenAnalysisIntegerSum} from '../../../adapters/analytics-duckdb/open-analysis-verification.ts';
import {createPersonalOpenAnalysisWorkspace} from '../../../profiles/personal/open-analysis.ts';
import {startBrowserMembershipServer} from '../../../apps/browser/local-server.ts';
import type {MemberSourceInspection} from '../../../packages/ports/member-source.ts';
import {compileNumericReport} from '../../../packages/product-core/open-analysis-numeric-report.ts';
export function reportFixture(grouped=false,numeric=false){
 const root=mkdtempSync(join(process.env.JUANERAI_TEST_EVIDENCE_DIR??'/private/tmp','bui-report-'));
 const source:MemberSourceInspection={version:'1.0',sources:[{source_id:randomUUID(),display_name:'synthetic.csv',format:'csv',sha256:'a'.repeat(64),byte_length:'10',sheets:[{sheet_id:'sheet',name:'CSV',state:'visible',rows:grouped?[{row:1,cells:[{column:'A',type:'string',value:'数量'},{column:'B',type:'string',value:'地区'}]},{row:2,cells:[{column:'A',type:'number',value:'3'},{column:'B',type:'string',value:'北区'}]},{row:3,cells:[{column:'A',type:'number',value:'4'},{column:'B',type:'string',value:'南区'}]}]:[{row:1,cells:[{column:'A',type:'string',value:'数量'}]},{row:2,cells:[{column:'A',type:'number',value:'7'}]}]}]}]};
 const identity={task_id:randomUUID(),revision:'1',run_id:randomUUID(),attempt_id:randomUUID(),operation_id:randomUUID(),grant_id:randomUUID(),scope_sha256:taskHash(source),config_sha256:'b'.repeat(64)};
 const store=createLocalOpenAnalysisStore({projectRoot:root}),id=identity.task_id;
 store.create({identity,question:'合成数量分析',source});const lease=store.begin(id),plan=compileOpenAnalysisIR({... (grouped?{version:'1.1',group_by:'B',filters:[]}:{version:'1.0'}),goal:'合成数量',source_id:source.sources[0]!.source_id,sheet_id:'sheet',operation:'sum',column:'A',unit:'件'},source),calculation=executeOpenAnalysisIR(plan,source),rawOutcome={version:'1.0' as const,outcome_id:randomUUID(),identity,framework:plan,calculation,verification:verifyOpenAnalysisIntegerSum(plan,calculation,source),explanation:{kind:'MODEL_EXPLANATION' as const,text:'这是合成资料的描述，原因尚需调查。'},human_judgment:'not_recorded' as const};
 const numericReport=numeric?compileNumericReport(JSON.stringify({version:'1.3',status:'ready',derivations:[],interpretations:[{references:['F1','F2'],interpretation:'北区{{F1}}，南区{{F2}}，原因尚需调查。'}]}),{verified_calculations:[{execution_plan:plan,calculation,verification:rawOutcome.verification}]},{identity,sources:source}):null;const outcome=numericReport?{...rawOutcome,numeric_report:numericReport,explanation:{kind:'MODEL_EXPLANATION' as const,text:numericReport.text}}:rawOutcome;
 store.saveFramework(lease,{version:'1.0',identity,origin:'MODEL_PROPOSAL',plan});store.saveOutcome(lease,outcome);
 const content=()=>{const read=store.reportContent;assert.ok(read,'BUI-R06 requires a real current saved content projection');const value=read(id);assert.ok(value);return value;};
 const write=(action:string,fields:Record<string,unknown>={})=>{const current=content();assert.ok(store.reportContentCommand);return store.reportContentCommand(id,{version:'1.0',command_id:randomUUID(),expected_content_sha256:current.sha256,action,...fields});};
 return {root,store,id,source,identity,outcome,content,write};
}
export async function browserUIFixture(hasUnconfirmedEffects=()=>false){
 const f=reportFixture(true,true);let calls=0;
 const otherIdentity={...f.identity,task_id:randomUUID(),run_id:randomUUID(),attempt_id:randomUUID(),operation_id:randomUUID()};f.store.create({identity:otherIdentity,question:'另一个合成任务',source:f.source});f.store.finish(f.store.begin(otherIdentity.task_id),'failed');
 const open=createPersonalOpenAnalysisWorkspace({projectRoot:f.root,inspect:async()=>assert.fail('no parsing on read/save'),runtime:{hasUnconfirmedEffects,run:async input=>{calls++;assert.equal(input.purpose,'report_edit');assert.deepEqual(input.tools,[]);assert.equal(input.authorize(),true);return {text:'合成测试建议：更简洁地描述结果，原因仍需调查。',tools:[]};}},authorizeConfiguration:async()=>({config_sha256:f.identity.config_sha256})});
 // Legacy membership APIs are not exercised; production OpenAnalysis Profile/Store and HTTP boundaries are real.
 const server=await startBrowserMembershipServer({store:{} as never,workspace:{} as never,open});
 const boot=await fetch(server.origin+'/v1/bootstrap',{method:'POST',headers:{origin:server.origin,'content-type':'application/json'},body:JSON.stringify({token:server.bootstrap})}),cookie=boot.headers.get('set-cookie')!.split(';')[0]!,control=(await boot.json()).control;
 const call=(path:string,body?:unknown,headers:Record<string,string>={})=>fetch(server.origin+path,{method:body===undefined?'GET':'POST',headers:{cookie,...(body===undefined?{}:{origin:server.origin,'content-type':'application/json','x-xanthil-control':control}),...headers},...(body===undefined?{}:{body:JSON.stringify(body)})});
 return {...f,open,server,cookie,control,call,calls:()=>calls,close:async()=>{await open.close();await server.close();}};
}
export function partialReportTask(f:ReturnType<typeof reportFixture>){
 const identity={...f.identity,task_id:randomUUID(),run_id:randomUUID(),attempt_id:randomUUID(),operation_id:randomUUID()},id=identity.task_id;
 f.store.create({identity,question:'合成部分分析，等待范围澄清',source:f.source});const lease=f.store.begin(id),framework={...f.store.read(f.id)!.framework!,identity};
 const step={version:'1.0' as const,step_id:randomUUID(),identity,framework,calculation:f.outcome.calculation,verification:f.outcome.verification};
 f.store.saveFramework(lease,framework);f.store.saveVerifiedStep(lease,step);f.store.saveClarification(lease,{version:'1.0',question_id:randomUUID(),text:'还需要确认另一个分析范围',identity});
 return {id,identity,step,content:()=>f.store.reportContent!(id)!};
}
