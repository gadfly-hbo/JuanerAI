import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {randomUUID} from 'node:crypto';
import {createPersonalOpenAnalysisWorkspace} from '../../../profiles/personal/open-analysis.ts';
import {createMemberSourceInspector} from '../../../adapters/analytics-duckdb/member-source-inspection.ts';
import {offlineCredentials,offlineResponse} from './offline-professional-provider.ts';
/** Real normal Workspace -> public Adapter -> pinned SDK -> offline transport.
 * This producer saves a MODEL_ANALYSIS_REPORT; it does not manufacture verified
 * computations, Outcomes, user acceptance or missing physical facts. */
export async function nativeReport(input:{root?:string;projectId?:string;question?:string;csv?:string;text?:string}={}){
 const root=input.root??mkdtempSync(join(process.env.JUANERAI_NEWARCH_SHORT_ROOT!,'nr-')),deployment=JSON.parse(readFileSync('build/xanthil-toolchain-deployment.json','utf8')),dtos:unknown[]=[];let count=0;
 const configuration={projectRoot:root,project_id:input.projectId??randomUUID(),analysisModel:'mimo-v2.6-flash' as const,credentials:offlineCredentials,judgmentReview:false,inspect:createMemberSourceInspector(deployment.python.executable_path),fetch:async(_url:Parameters<typeof fetch>[0],init?:RequestInit)=>{dtos.push(JSON.parse(String(init?.body)));return offlineResponse(++count,[],count===1?'依据当前获准资料分析；缺口只限制相应判断。':input.text??'# 当前合成报告\n\n当前资料有数量7，数字尚未独立核验。原因尚需调查；后续条件需要补证。');}};
 const app=createPersonalOpenAnalysisWorkspace(configuration);
 try{const task=await app.submit({version:'1.0',command_id:randomUUID(),question:input.question??'说明当前资料与待补证部分，不作因果认证或业务行动。',confirmed:true,sources:[{source_id:randomUUID(),display_name:'synthetic.csv',format:'csv',bytes:Buffer.from(input.csv??'数量\n7\n')}]});await app.start(task.identity.task_id);await app.waitForIdle();const saved=app.read(task.identity.task_id);assert.equal(saved.state,'saved');assert.ok(saved.model_report);assert.equal(saved.outcome,null);assert.equal(saved.computation_records.length,0);assert.equal((await app.diagnostics(task.identity.task_id)).unconfirmed_effects,false);writeFileSync(join(root,'NATIVE-REPORT-'+task.identity.task_id+'.json'),JSON.stringify({task:saved,dtos,synthetic_requests:count,real_provider_requests:0},null,2));return {root,task:saved,identity:saved.identity,source:saved.source,modelReport:saved.model_report,configuration,provider:{requests:()=>count,dtos}};}finally{await app.close();}
}
