// Reused controlled JR110/112 fixtures, not new formal samples or model quality evidence.
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {compileOpenAnalysisIR,executeOpenAnalysisIR} from '../../../packages/product-core/open-analysis-ir.ts';
import {verifyOpenAnalysisIntegerSum} from '../../../adapters/analytics-duckdb/open-analysis-verification.ts';
import {taskHash} from '../../../packages/product-core/member-task.ts';
import {compileNumericReport} from '../../../packages/product-core/open-analysis-numeric-report.ts';
import {createJudgmentSnapshot,compileJudgmentRound,completeJudgmentReview,judgmentReviewPrompt,validateJudgmentReview} from '../../../packages/product-core/open-analysis-judgment-review.ts';
import {parseReviewableDocument,reviewableClaims} from '../../../packages/product-core/open-analysis-reviewable-document.ts';
import {naturalRequirements} from '../../../packages/product-core/open-analysis-natural-review.ts';
import type {MemberSourceInspection} from '../../../packages/ports/member-source.ts';
export function fixture(january='100',february='300'){
 const orders=randomUUID(),refunds=randomUUID(),sheet=randomUUID();
 const rows=(header:string[],data:string[][])=>[header,...data].map((cells,i)=>({row:i+1,cells:cells.map((value,j)=>({column:String.fromCharCode(65+j),type:'string' as const,value}))}));
 const sources:MemberSourceInspection={version:'1.0',sources:[{source_id:orders,display_name:'订单.csv',format:'csv',sha256:'a'.repeat(64),byte_length:'100',sheets:[{sheet_id:sheet,name:'CSV',state:'visible',rows:rows(['订单号','期间','金额'],[['O1','2026-01',january],['O2','2026-01','200'],['O3','2026-01','150'],['O4','2026-02',february],['O5','2026-02','250'],['O6','2026-02','100']])}]},{source_id:refunds,display_name:'退款.csv',format:'csv',sha256:'b'.repeat(64),byte_length:'100',sheets:[{sheet_id:sheet,name:'CSV',state:'visible',rows:rows(['退款号','原订单号','退款金额'],[['R1','O1','20'],['R2','O4','30']])}]}]};
 const identity={task_id:randomUUID(),revision:'1',run_id:randomUUID(),attempt_id:randomUUID(),operation_id:randomUUID(),grant_id:randomUUID(),scope_sha256:taskHash(sources),config_sha256:'c'.repeat(64)};
 const raw={version:'1.7',goal:'当前净额',unit:'元',numeric_mode:'integer',inputs:[{source_id:orders,sheet_id:sheet,column:'C',group_by:'B',filters:[]},{source_id:refunds,sheet_id:sheet,column:'C',group_by:null,filters:[]}],join:{kind:'refund_net',order_key:'A',refund_order_key:'B',refund_id:'A'}};
 const plan=compileOpenAnalysisIR(raw,sources),calculation=executeOpenAnalysisIR(plan,sources),verification=verifyOpenAnalysisIntegerSum(plan,calculation,sources);
 const evidence={verified_calculations:[{goal:plan.goal,execution_plan:plan,plan_sha256:taskHash(plan),calculation,verification}]};
 return {sources,identity,evidence,plan,calculation};
}
export function scenario(){
 const f=fixture(),question='仅分析原范围；不要求行动。';
 const report=compileNumericReport(JSON.stringify({version:'1.5',status:'ready',interpretations:[{fact_refs:['F1','F2'],interpretation:'当前结果仅说明原范围变化，不能证明原因。'}]}),f.evidence,{identity:f.identity,sources:f.sources});
 const base=createJudgmentSnapshot({identity:f.identity,question,snapshotVersion:'1.14',conditionSourceReferences:true,context:null,binding:f.plan,evidence:f.evidence,report,sources:f.sources});
 const units=[{kind:'observation',text:'当前结果仅说明原范围变化，不能证明原因。',fact_refs:['F1','F2'],source_refs:[],method:null,strategy:null,content:{materials:[],proposal:null,quantities:[]}}];
 const document=parseReviewableDocument(JSON.stringify({version:'1.4',source_sha256:taskHash({identity:base.identity,question,draft:'原稿完整保留'}),units}),base,question,'原稿完整保留');
 const snapshot={...base,document,claims:reviewableClaims(document,base,f.sources)};
 const response={version:'1.2',snapshot_sha256:taskHash(snapshot),completeness:{verdict:'complete',reason:'已对照全部当前需求与内容。'},requirement_coverage:naturalRequirements(snapshot).map(r=>({requirement_id:r.id,claim_ids:['C1'],verdict:'fulfilled'})),claims:[{claim_id:'C1',kind:'conclusion',level:'observation',verdict:'supported',evidence_refs:['F1','F2'],counterevidence:[],reason:'受控审查理由；立即扩大促销。',limitations:[],conditions:[],strategy:null}]};
 return {f,snapshot,response};
}
export async function optionScenario(questionOverride?:string){
 const {actualB06Response102:draft,actualB06Question102:originalQuestion}=await import('../../fixtures/xanthil-desktop/change007-b06-actual102.ts'),{judgmentPremises}=await import('../../../packages/product-core/open-analysis-judgment-conditions.ts'),{reviewedContentSources}=await import('../../../packages/product-core/open-analysis-reviewed-content.ts');
 const question=questionOverride??originalQuestion;
 const {f,snapshot:old}=scenario(),base={...old,question,document:undefined};
 // Rebuild the USER source catalog through the actual snapshot constructor.
 const baseline=createJudgmentSnapshot({identity:f.identity,question,snapshotVersion:'1.14',conditionSourceReferences:true,context:null,binding:f.plan,evidence:f.evidence,report:old.report,sources:f.sources});
 const premises=judgmentPremises(baseline),strategy=Object.fromEntries(['goal','owner','authority','resources','cost','risk','alternatives','stop','observe'].map(k=>[k,draft.match(new RegExp('^- '+k+'：(.+)$','m'))![1]]));
 const cost=premises.find(p=>p.kind==='cost')!;
 const actorSource=baseline.condition_source_catalog!.find(v=>v.text.includes('品类A运营负责人'))!;
 const actor_links=premises.filter(p=>['authority','time'].includes(p.kind)).map(p=>({premise_id:p.id,premise_source_id:p.source_id,premise_owner:p.owner,actor_source_id:actorSource.id,actor_quote:'品类A运营负责人',scope_sha256:baseline.identity.scope_sha256,revision:baseline.identity.revision}));
 const unit={kind:'strategy',text:draft.split('### 可选建议（不自动执行）\n\n')[1]!.split('\n\n- goal：')[0]!,fact_refs:[],source_refs:['Q'],method:'attribution',strategy,content:{actor_links,materials:[],proposal:{statement:strategy.goal,operation:'attribution',owner:strategy.owner,objects:reviewedContentSources(baseline),result:'matching_evidence',role:'primary',premise_ids:premises.filter(p=>['authority','time','cost'].includes(p.kind)).map(p=>p.id)},quantities:[{field:'cost',statement:strategy.cost,use:'ceiling',value:'200',unit:'元',owner:strategy.owner,premise_id:cost.id,source_id:cost.cost_source_id,scope_sha256:baseline.identity.scope_sha256}]}};
 const document=parseReviewableDocument(JSON.stringify({version:'1.4',source_sha256:taskHash({identity:baseline.identity,question,draft}),units:[unit]}),baseline,question,draft),snapshot={...baseline,document,claims:reviewableClaims(document,baseline,f.sources)};
 const response={version:'1.2',snapshot_sha256:taskHash(snapshot),completeness:{verdict:'complete',reason:'具体完整建议及条件均已审阅。'},requirement_coverage:naturalRequirements(snapshot).map(r=>({requirement_id:r.id,claim_ids:['C1'],verdict:'fulfilled'})),claims:[{actor_correspondence:actor_links.map(a=>({premise_id:a.premise_id,verdict:'same'})),claim_id:'C1',kind:'strategy',level:'hypothesis',verdict:'supported',evidence_refs:['Q'],counterevidence:[],reason:'受控审查支持。',limitations:[],conditions:[],strategy}]};
 return {f,snapshot,response};
}
export async function assert111Consumers(workspace:any,task:any,body:string,selectable:boolean){
 const {deliveredJudgmentReview}=await import('../../../packages/product-core/open-analysis-judgment-review.ts'),{projectReportContent}=await import('../../../packages/product-core/browser-report-content.ts');
 const {openTaskView}=await import('../../../apps/browser/quick-analysis-client.mjs'),{renderQuickAnalysisWorkbench}=await import('../../../apps/browser/quick-analysis-workbench.mjs');
 const r=deliveredJudgmentReview(task)!,view=openTaskView({...task,browser_report:projectReportContent(task)});
 assert.ok(view.judgmentReview);
 assert.equal(view.judgmentReview.state,r.state);if(r.state==='completed')assert.equal(view.judgmentReview.review_sha256,r.review_sha256);
 assert.equal(view.judgmentReview.rounds.at(-1)?.claims[0]?.qualification?.selectable??false,selectable);
 const copy=workspace.reportCopy(task.identity.task_id,task.identity.revision,task.outcome.outcome_id).bytes.toString('utf8');assert.equal(workspace.reportCopy(task.identity.task_id,task.identity.revision,task.outcome.outcome_id,false,r.review_sha256).bytes.toString('utf8'),copy);assert.throws(()=>workspace.reportCopy(task.identity.task_id,task.identity.revision,task.outcome.outcome_id,false,'0'.repeat(64)),{code:'REVISION_CONFLICT'});
 assert.ok(!copy.includes('立即扩大促销。'));assert.ok(!r.delivery.includes('立即扩大促销。'));
 if(selectable){assert.ok(r.delivery.includes(body));assert.ok(projectReportContent(task)!.text.includes(body));assert.ok(copy.includes(body));}
 for(const mode of ['quick','pro'] as const){const html=renderQuickAnalysisWorkbench({project:'offline111',tasks:[],current:view,mode,stage:'report',expanded:'report',viewMode:'results',resultView:'report'} as any);const cards=html.slice(html.indexOf('<h3>数字检查</h3>'),html.indexOf('<details><summary>修订与审查历史</summary>'));if(cards.includes('可选择的建议')!==selectable){const fs=await import('node:fs');fs.writeFileSync((process.env.JUANERAI_TEST_EVIDENCE_DIR??'/private/tmp')+'/consumer-cards-'+mode+'.html',html);console.log({mode,selectable,cardLength:cards.length,htmlLength:html.length,snapshot:r.snapshot.version});}assert.equal(cards.includes('可选择的建议'),selectable);}
}
