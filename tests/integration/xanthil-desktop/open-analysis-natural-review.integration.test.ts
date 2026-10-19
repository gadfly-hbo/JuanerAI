import test from 'node:test';
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
function fixture(january='100',february='300'){
 const orders=randomUUID(),refunds=randomUUID(),sheet=randomUUID();
 const rows=(header:string[],data:string[][])=>[header,...data].map((cells,i)=>({row:i+1,cells:cells.map((value,j)=>({column:String.fromCharCode(65+j),type:'string' as const,value}))}));
 const sources:MemberSourceInspection={version:'1.0',sources:[{source_id:orders,display_name:'订单.csv',format:'csv',sha256:'a'.repeat(64),byte_length:'100',sheets:[{sheet_id:sheet,name:'CSV',state:'visible',rows:rows(['订单号','期间','金额'],[['O1','2026-01',january],['O2','2026-01','200'],['O3','2026-01','150'],['O4','2026-02',february],['O5','2026-02','250'],['O6','2026-02','100']])}]},{source_id:refunds,display_name:'退款.csv',format:'csv',sha256:'b'.repeat(64),byte_length:'100',sheets:[{sheet_id:sheet,name:'CSV',state:'visible',rows:rows(['退款号','原订单号','退款金额'],[['R1','O1','20'],['R2','O4','30']])}]}]};
 const identity={task_id:randomUUID(),revision:'1',run_id:randomUUID(),attempt_id:randomUUID(),operation_id:randomUUID(),grant_id:randomUUID(),scope_sha256:taskHash(sources),config_sha256:'c'.repeat(64)};
 const raw={version:'1.7',goal:'当前净额',unit:'元',numeric_mode:'integer',inputs:[{source_id:orders,sheet_id:sheet,column:'C',group_by:'B',filters:[]},{source_id:refunds,sheet_id:sheet,column:'C',group_by:null,filters:[]}],join:{kind:'refund_net',order_key:'A',refund_order_key:'B',refund_id:'A'}};
 const plan=compileOpenAnalysisIR(raw,sources),calculation=executeOpenAnalysisIR(plan,sources),verification=verifyOpenAnalysisIntegerSum(plan,calculation,sources);
 const evidence={verified_calculations:[{goal:plan.goal,execution_plan:plan,plan_sha256:taskHash(plan),calculation,verification}]};
 return {sources,identity,evidence,plan,calculation};
}
function scenario(){
 const f=fixture(),question='仅分析原范围；不要求行动。';
 const report=compileNumericReport(JSON.stringify({version:'1.5',status:'ready',interpretations:[{fact_refs:['F1','F2'],interpretation:'当前结果仅说明原范围变化，不能证明原因。'}]}),f.evidence,{identity:f.identity,sources:f.sources});
 const base=createJudgmentSnapshot({identity:f.identity,question,snapshotVersion:'1.14',conditionSourceReferences:true,context:null,binding:f.plan,evidence:f.evidence,report,sources:f.sources});
 const units=[{kind:'observation',text:'当前结果仅说明原范围变化，不能证明原因。',fact_refs:['F1','F2'],source_refs:[],method:null,strategy:null,content:{materials:[],proposal:null,quantities:[]}}];
 const document=parseReviewableDocument(JSON.stringify({version:'1.4',source_sha256:taskHash({identity:base.identity,question,draft:'原稿完整保留'}),units}),base,question,'原稿完整保留');
 const snapshot={...base,document,claims:reviewableClaims(document,base,f.sources)};
 const response={version:'1.2',snapshot_sha256:taskHash(snapshot),completeness:{verdict:'complete',reason:'已对照全部当前需求与内容。'},requirement_coverage:naturalRequirements(snapshot).map(r=>({requirement_id:r.id,claim_ids:['C1'],verdict:'fulfilled'})),claims:[{claim_id:'C1',kind:'conclusion',level:'observation',verdict:'supported',evidence_refs:['F1','F2'],counterevidence:[],reason:'受控审查理由；立即扩大促销。',limitations:[],conditions:[],strategy:null}]};
 return {f,snapshot,response};
}
test('JR109 H全文：审查回复中新写的业务句不继承受审提案的交付资格',()=>{
 const {f,snapshot,response}=scenario(),round=compileJudgmentRound(JSON.stringify(response),snapshot,'initial',f.sources),review=completeJudgmentReview(snapshot,round);
 assert.ok(review.delivery.includes(snapshot.document.units[0].text),'保留实际已审正确正文');
 assert.ok(!review.delivery.includes('立即扩大促销。'),'审查理由不是已经送审的提案，不能成为正式业务文字');
 assert.equal(review.rounds[0].claims[0].reason,response.claims[0].reason,'原审查记录完整保留');
 validateJudgmentReview(review,snapshot,f.sources);
});

test('JR109 H完整性：逐项缺口限制选择，保留独立正确观察；重复ID和变后沿用旧审查拒绝',()=>{
 const {f,snapshot,response}=scenario();
 const missing={...response,completeness:{verdict:'incomplete',reason:'当前需要的解释尚缺。'},requirement_coverage:response.requirement_coverage.map(v=>({...v,verdict:'incomplete'}))};
 const round=compileJudgmentRound(JSON.stringify(missing),snapshot,'initial',f.sources),r=completeJudgmentReview(snapshot,round);
 assert.match(r.delivery,/尚未完整交付/);assert.ok(r.delivery.includes(snapshot.claims[0]!.text));
 assert.throws(()=>compileJudgmentRound(JSON.stringify({...response,claims:[response.claims[0],response.claims[0]]}),snapshot,'initial',f.sources),{code:'JUDGMENT_IDENTITY_CONFLICT'});
 assert.throws(()=>validateJudgmentReview({...r,delivery:r.delivery+'未审新增文字'},snapshot,f.sources),{code:'JUDGMENT_IDENTITY_CONFLICT'});
 const packet=JSON.parse(judgmentReviewPrompt(snapshot).split('\n').slice(1).join('\n'));
 assert.deepEqual(packet.current_proposal.units.map(({id,...unit}:any)=>unit),snapshot.document.units);
 assert.deepEqual(packet.current_user_input.condition_source_catalog,snapshot.condition_source_catalog,'reviewer must resolve the actual USER antecedent source IDs');assert.equal(packet.requirements[0].text,snapshot.question);assert.equal(packet.source_draft.text,snapshot.document.draft);
});

test('JR109 首次分析：原report形成接点消费完整自然提案，无额外模型阶段',async()=>{
 const {createOpenAnalysisApplication}=await import('../../../packages/application/open-analysis.ts'),{createLocalOpenAnalysisStore}=await import('../../../adapters/storage-local/open-analysis.ts'),{openAnalysisProposal}=await import('../../../packages/product-core/open-analysis-ir.ts');
 const {mkdtempSync}=await import('node:fs'),{tmpdir}=await import('node:os'),{join}=await import('node:path');
 const f=fixture(),root=mkdtempSync(join(process.env.JUANERAI_TEST_EVIDENCE_DIR??tmpdir(),'jr109-initial-')),store=createLocalOpenAnalysisStore({projectRoot:root}),question='仅分析当前两期净额及限制，不提出业务策略。',purposes:string[]=[];
 store.create({identity:f.identity,question,source:f.sources,review_policy:'conclusion_strategy_v1'} as any);const lease=store.begin(f.identity.task_id);
 const app=createOpenAnalysisApplication({formReviewableDocument:true,agentLed:true,reviewReport:true,numericReport:true,judgmentReview:true,loadSelectedSource:async()=>f.sources,isAuthorized:()=>true,verify:verifyOpenAnalysisIntegerSum,saveFramework:async (v:any)=>store.saveFramework(lease,v),saveVerifiedStep:async (v:any)=>store.saveVerifiedStep!(lease,v),saveJudgmentReview:async (v:any)=>store.saveJudgmentReview!(lease,v),saveOutcome:async (v:any)=>store.saveOutcome(lease,v),runtime:{run:async (i:import('../../../packages/ports/open-analysis-runtime.ts').OpenAnalysisRun)=>{
  purposes.push(i.purpose??'generation');
  if(i.purpose==='report_edit'){
   const b=JSON.parse(i.prompt.slice(i.prompt.indexOf('\n')+1));assert.equal(b.output_contract,'reviewable-document/1.4');assert.equal(b.draft,'原范围有据观察，不能确定原因。');
   return {text:JSON.stringify({version:'1.4',source_sha256:b.source_sha256,units:[{kind:'observation',text:'两期原范围的净额有独立核算支持，不能确定原因。',fact_refs:['F1','F2'],source_refs:[],method:null,strategy:null,content:{materials:[],proposal:null,quantities:[]}}]}),tools:[]};
  }
  if(i.purpose==='conclusion_strategy_review'){
   const b=JSON.parse(i.prompt.slice(i.prompt.indexOf('\n')+1));return {text:JSON.stringify({version:'1.2',snapshot_sha256:b.snapshot_sha256,completeness:{verdict:'complete',reason:'完整有限观察及限制符合当前仅分析需求。'},requirement_coverage:b.requirements.map((r:any)=>({requirement_id:r.id,claim_ids:['C1'],verdict:'fulfilled'})),claims:b.current_proposal.units.map((u:any)=>({claim_id:u.id,kind:'conclusion',level:'observation',verdict:'supported',evidence_refs:u.fact_refs,reason:'观察有据。',counterevidence:[],limitations:[],conditions:[],strategy:null}))}),tools:[]};
  }
  await i.tools.find((t:import('../../../packages/ports/open-analysis-runtime.ts').AnalysisTool)=>t.name==='calculate_and_verify')!.execute({plan:openAnalysisProposal(f.plan)},i.signal);return {text:'原范围有据观察，不能确定原因。',tools:[]};
 }}} as any);
 await app.run({identity:f.identity,question,signal:new AbortController().signal});const saved=store.read(f.identity.task_id)!;
 assert.equal(saved.state,'saved');assert.equal(saved.outcome!.judgment_review!.snapshot.document!.version,'1.4');assert.match(saved.outcome!.explanation.text,/不能确定原因/);assert.deepEqual(purposes,['generation','report_edit','conclusion_strategy_review']);
 const {projectReportContent}=await import('../../../packages/product-core/browser-report-content.ts'),{deliveredJudgmentReview}=await import('../../../packages/product-core/open-analysis-judgment-review.ts');
 const content=projectReportContent(saved)!;assert.equal(content.text,saved.outcome!.judgment_review!.delivery,'PR90 report editor starts with actual current reviewed formal body');
 const original=structuredClone(saved.outcome);store.reportContentCommand!(f.identity.task_id,{version:'1.0',command_id:randomUUID(),expected_content_sha256:content.sha256,action:'save',text:content.text+'\n\n未审新增促销',finding_ids:[]});
 const changed=store.read(f.identity.task_id)!;assert.equal(deliveredJudgmentReview(changed)!.state,'unknown');assert.deepEqual(changed.outcome,original);assert.ok(!deliveredJudgmentReview(changed)!.delivery.includes('未审新增促销'));
 const {createOpenAnalysisWorkspace}=await import('../../../packages/application/open-analysis-workspace.ts'),{createLocalAnalysisRequestLedger}=await import('../../../adapters/storage-local/analysis-request-ledger.ts');const editCalls:string[]=[];
 const workspace=createOpenAnalysisWorkspace({store,ledger:createLocalAnalysisRequestLedger({projectRoot:root}),inspect:async()=>f.sources,verify:verifyOpenAnalysisIntegerSum,authorizeConfiguration:async()=>({config_sha256:f.identity.config_sha256}),runtime:{run:async (i:import('../../../packages/ports/open-analysis-runtime.ts').OpenAnalysisRun)=>{
  editCalls.push(i.purpose??'generation');
  if(i.purpose==='proposal_prepare'&&i.prompt.includes('本期资料是否导入未知')){await i.tools.find((t:import('../../../packages/ports/open-analysis-runtime.ts').AnalysisTool)=>t.name==='ask_user')!.execute({text:'本期资料能否提供？'},i.signal);return {text:'本期资料能否提供？',tools:[]};}
  if(i.purpose==='proposal_prepare'){assert.ok(i.prompt.includes('未审新增促销'),'current saved editor body must reach actual proposal consumer');return {text:'两期有核算支持；改稿中的额外促销无依据，保留有用观察及限制。',tools:[]};}
  const p=JSON.parse(i.prompt.slice(i.prompt.indexOf('\n')+1));
  if(i.purpose==='report_edit'&&p.draft==='本期资料能否提供？'){return {text:JSON.stringify({version:'1.4',source_sha256:p.source_sha256,units:[{kind:'limitation',text:p.draft,fact_refs:[],source_refs:['Q'],method:null,strategy:null,content:{materials:[],proposal:null,quantities:[]}}]}),tools:[]};}
  if(i.purpose==='report_edit'){assert.ok(p.context.current_report_expression.text.includes('未审新增促销'),'current draft must independently reach formation, not only generation');return {text:JSON.stringify({version:'1.4',source_sha256:p.source_sha256,units:[{kind:'observation',text:'两期有核算支持，不能确定原因；额外促销未取得依据。',fact_refs:['F1','F2'],source_refs:[],method:null,strategy:null,content:{materials:[],proposal:null,quantities:[]}}]}),tools:[]};}
  if(p.current_proposal.units[0].text==='本期资料能否提供？')return {text:JSON.stringify({version:'1.2',snapshot_sha256:p.snapshot_sha256,completeness:{verdict:'complete',reason:'只回答当前必要的资料澄清，未声称完成分析。'},requirement_coverage:p.requirements.map((r:any)=>({requirement_id:r.id,claim_ids:['C1'],verdict:'fulfilled'})),claims:[{claim_id:'C1',kind:'conclusion',level:'observation',verdict:'conditional',evidence_refs:['Q'],counterevidence:[],reason:'必要问题待回答。',limitations:[],conditions:[],strategy:null}]}),tools:[]};
  assert.ok(p.current_proposal.units[0].text.includes('额外促销未取得依据'));return {text:JSON.stringify({version:'1.2',snapshot_sha256:p.snapshot_sha256,completeness:{verdict:'complete',reason:'完整审阅现稿与范围限制。'},requirement_coverage:p.requirements.map((r:any)=>({requirement_id:r.id,claim_ids:['C1'],verdict:'fulfilled'})),claims:p.current_proposal.units.map((u:any)=>({claim_id:u.id,kind:'conclusion',level:'observation',verdict:'supported',evidence_refs:u.fact_refs,counterevidence:[],reason:'有限观察及当前限制。',limitations:[],conditions:[],strategy:null}))}),tools:[]};
 }}} as any);
 try{await workspace.previewRevision(f.identity.task_id,{version:'1.0',command_id:randomUUID(),expected_revision:f.identity.revision,question:'请审查当前保存改稿，保留有据观察和限制，不新增行动。'});await workspace.collect();const next=workspace.read(f.identity.task_id);assert.equal(next.revision_previews!.at(-1)!.failure_code,null);assert.equal(next.review_updates!.at(-1)!.review.state,'completed');assert.deepEqual(editCalls,['proposal_prepare','report_edit','conclusion_strategy_review']);assert.deepEqual(next.outcome,original);assert.ok(projectReportContent(next)!.text.includes('额外促销未取得依据'));
  await workspace.previewRevision(f.identity.task_id,{version:'1.0',command_id:randomUUID(),expected_revision:f.identity.revision,question:'本期资料是否导入未知；只询问必要这一题。'});await workspace.collect();const waiting=workspace.read(f.identity.task_id);assert.equal(waiting.revision_previews!.at(-1)!.state,'waiting');assert.equal(waiting.review_updates!.at(-1)!.input.kind,'document_preview');assert.equal(waiting.review_updates!.at(-1)!.review.snapshot.document!.version,'1.4');assert.equal(waiting.review_updates!.at(-1)!.review.state,'completed');assert.deepEqual(editCalls.slice(3),['proposal_prepare','report_edit','conclusion_strategy_review']);assert.deepEqual(waiting.outcome,original);
 }
 finally{await workspace.close();}


});

// Derived finite H controls. Original formal B06 bytes are separately exercised
// through the original saved Task in guarantee109-chain003.mjs.
async function optionScenario(questionOverride?:string){
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
test('JR109 H费用：原有据成本正式保留；模型伪造数值、用途或来源不能越过已知约束',async()=>{
 const {f,snapshot,response}=await optionScenario();
 const yes=compileJudgmentRound(JSON.stringify(response),snapshot,'initial',f.sources);assert.equal(yes.claims[0]!.qualification!.selectable,true,JSON.stringify({claim:yes.claims[0],numeric:snapshot.claims[0]}));assert.match(completeJudgmentReview(snapshot,yes).delivery,/≤200 元/);
 for(const change of [{value:'999'},{use:'spent'},{source_id:'Q-invalid'},{owner:'另一主体'}]){
  const doc=structuredClone(snapshot.document) as any;Object.assign(doc.units[0].content.quantities[0],change);
  const s={...snapshot,document:doc},r=compileJudgmentRound(JSON.stringify({...response,snapshot_sha256:taskHash(s)}),s,'initial',f.sources);
  assert.equal(r.claims[0]!.qualification!.selectable,false);assert.ok(r.claims[0]!.qualification!.issues.includes('CONTENT_QUANTITY_UNPROVEN'));
 }
});
test('JR109 R：故意支持已受审坏正文只验证有限H，外部已知语义仍Q_FAIL',async()=>{
 const {f,snapshot,response}=await optionScenario(),doc=structuredClone(snapshot.document) as any;doc.units[0].text+='立即扩大促销。';
 const s={...snapshot,document:doc,claims:reviewableClaims(doc,snapshot,f.sources)},packet=JSON.parse(judgmentReviewPrompt(s).split('\n').slice(1).join('\n'));
 assert.match(packet.current_proposal.units[0].text,/立即扩大促销。/,'错误正文确实送审');
 const r=compileJudgmentRound(JSON.stringify({...response,snapshot_sha256:taskHash(s)}),s,'initial',f.sources),review=completeJudgmentReview(s,r);
 assert.ok(review.delivery.includes('立即扩大促销。'),'受控共同误判风险如实暴露；此断言不是Q质量成功');
 assert.equal(r.claims[0]!.qualification!.selectable,true,'有限H不声称语义识别');validateJudgmentReview(review,s,f.sources);
});

test('JR110 形成请求不能携带旧合同的宿主固定业务表达',async()=>{
 const {reviewableDocumentPrompt}=await import('../../../packages/product-core/open-analysis-reviewable-document.ts');
 const {snapshot}=scenario();const packet=JSON.parse(reviewableDocumentPrompt({snapshot,invocation_identity:snapshot.identity,question:snapshot.question,draft:'原稿',context:{body_format:'旧固定业务正文',expressions:['宿主答案']}}).split('\n').slice(1).join('\n'));
 assert.equal(packet.context.body_format,undefined);assert.equal(packet.context.expressions,undefined);
 assert.equal(packet.current_user_input.question,snapshot.question);assert.deepEqual(packet.baseline_evidence.evidence,snapshot.evidence);
});

test('JR110 主体对应：同版原句与明确审查共同必要；未知不同于冲突，模型支持不改权限',async()=>{
 const {f,snapshot,response}=await optionScenario();
 const compile=(s:any,r:any=response)=>compileJudgmentRound(JSON.stringify({...r,snapshot_sha256:taskHash(s)}),s,'initial',f.sources);
 const renamed=structuredClone(snapshot) as any;renamed.document.units[0].strategy.owner='本次核对负责人';renamed.document.units[0].content.proposal.owner='本次核对负责人';renamed.document.units[0].content.quantities[0].owner='本次核对负责人';const renamedResponse={...response,claims:response.claims.map(c=>({...c,strategy:renamed.document.units[0].strategy}))};assert.equal(compile(renamed,renamedResponse).claims[0].qualification!.selectable,true,'display wording does not create a new source identity');
 for(const change of [{revision:'old'},{scope_sha256:'old'},{premise_source_id:'missing'},{premise_owner:'另一实际主体'},{actor_source_id:'missing'},{actor_quote:'原句不存在'}]){
  const s=structuredClone(snapshot) as any;Object.assign(s.document.units[0].content.actor_links[0],change);const c=compile(s).claims[0];assert.equal(c.qualification!.selectable,false);assert.ok(c.qualification!.issues.includes('CONTENT_OWNER_CONFLICT'));
 }
 const sameLabel=structuredClone(snapshot) as any;sameLabel.document.units[0].content.proposal.owner='负责人';sameLabel.document.units[0].strategy.owner='负责人';sameLabel.document.units[0].content.quantities[0].owner='负责人';delete sameLabel.document.units[0].content.actor_links;
 const noBinding={...response,claims:response.claims.map(({actor_correspondence,...c})=>({...c,strategy:sameLabel.document.units[0].strategy}))};assert.equal(compile(sameLabel,noBinding).claims[0].qualification!.selectable,false,'equal display labels alone do not establish a binding');
 const missing={...response,claims:response.claims.map(({actor_correspondence,...c})=>c)};let c=compile(snapshot,missing).claims[0];assert.ok(c.qualification!.issues.includes('CONTENT_OWNER_UNKNOWN'));assert.ok(!c.qualification!.issues.includes('CONTENT_OWNER_CONFLICT'));
 for(const verdict of ['different','unknown']){const r={...response,claims:response.claims.map(c=>({...c,actor_correspondence:c.actor_correspondence!.map(a=>({...a,verdict}))}))};assert.equal(compile(snapshot,r).claims[0].qualification!.selectable,false);}
 // The model cannot promote an actual host-known negative condition to met.
 const revoked=structuredClone(snapshot) as any;revoked.condition_inputs=[{claim_id:'C1',condition:{id:revoked.document.units[0].content.actor_links[0].premise_id,text:'负责人没有核对权限',source_quote:'权限已撤回',state:'unmet'},answer:'不能'}];
 c=compile(revoked).claims[0];assert.equal(c.qualification!.selectable,false);assert.ok(c.conditions.some(v=>v.state==='unmet'));
 validateJudgmentReview(completeJudgmentReview(snapshot,compile(snapshot)),snapshot,f.sources);
});

test('JR110 UI兼容：复用PR90单顶栏、三视图和同任务助手，不返回旧壳层',async()=>{
 const {renderQuickAnalysisWorkbench}=await import('../../../apps/browser/quick-analysis-workbench.mjs');
 const html=renderQuickAnalysisWorkbench({mode:'quick',project:'离线',current:{id:'synthetic',title:'同任务',status:'已保存',messages:[],versions:[],framework:null} as any,tasks:[],viewMode:'conversation',detail:'context',drawer:false,draft:'保留草稿'});
 assert.equal((html.match(/class="topbar"/g)??[]).length,1);assert.ok(!html.includes('class="titlebar"'));
 for(const label of ['任务视图','对话','成果','依据','同任务助手','保留草稿'])assert.ok(html.includes(label),label);
});

test('JR110 条件回答：实际Workspace发送自然system/prompt，当前回答改变资格且不改旧Outcome',async()=>{
 const {actualB06Question102}=await import('../../fixtures/xanthil-desktop/change007-b06-actual102.ts');
 const {f,snapshot,response}=await optionScenario(actualB06Question102.replace('可在未来3天安排2小时','能否在未来3天安排2小时未知'));
 const {createLocalOpenAnalysisStore}=await import('../../../adapters/storage-local/open-analysis.ts'),{createLocalAnalysisRequestLedger}=await import('../../../adapters/storage-local/analysis-request-ledger.ts'),{createOpenAnalysisWorkspace}=await import('../../../packages/application/open-analysis-workspace.ts'),{naturalReviewSystem}=await import('../../../packages/product-core/open-analysis-natural-review.ts');
 const {mkdtempSync}=await import('node:fs'),{join}=await import('node:path'),{tmpdir}=await import('node:os');
 const root=mkdtempSync(join(process.env.JUANERAI_TEST_EVIDENCE_DIR??tmpdir(),'jr110-condition-')),store=createLocalOpenAnalysisStore({projectRoot:root});store.create({identity:f.identity,source:f.sources,question:snapshot.question,review_policy:'conclusion_strategy_v1'} as any);const lease=store.begin(f.identity.task_id);
 store.saveFramework(lease,{version:'1.0',identity:f.identity,origin:'MODEL_PROPOSAL',plan:f.plan});
 const review=completeJudgmentReview(snapshot,compileJudgmentRound(JSON.stringify(response),snapshot,'initial',f.sources));const condition=review.rounds[0].claims[0].conditions.find(c=>c.state==='unknown')!;assert.ok(condition,'actual UNKNOWN time is the single necessary missing condition');
 const outcome={version:'1.0',outcome_id:randomUUID(),identity:f.identity,framework:f.plan,calculation:f.calculation,verification:(f.evidence.verified_calculations[0] as any).verification,numeric_report:snapshot.report,judgment_review:review,explanation:{kind:'MODEL_EXPLANATION',text:review.delivery},human_judgment:'not_recorded'};store.saveOutcome(lease,outcome as any);let calls=0,failNext=false;
 const workspace=createOpenAnalysisWorkspace({store,ledger:createLocalAnalysisRequestLedger({projectRoot:root}),inspect:async()=>f.sources,verify:verifyOpenAnalysisIntegerSum,authorizeConfiguration:async()=>({config_sha256:f.identity.config_sha256}),runtime:{run:async (i:import('../../../packages/ports/open-analysis-runtime.ts').OpenAnalysisRun)=>{
  calls++;assert.equal(i.purpose,'conclusion_strategy_review');assert.equal(i.system,naturalReviewSystem);const p=JSON.parse(i.prompt.slice(i.prompt.indexOf('\n')+1));assert.equal(p.output_contract.version,'1.2');assert.equal(p.current_proposal.units[0].content.actor_links.length,2);assert.ok(p.condition_witnesses.some((c:any)=>c.kind==='time'&&['met','unmet'].includes(c.state)));if(failNext){failNext=false;throw Object.assign(new Error('controlled refusal'),{code:'VALIDATION_FAILED'});}
  return {text:JSON.stringify({...response,snapshot_sha256:p.snapshot_sha256}),tools:[]};
 }}} as any);
 try{await workspace.answerReviewCondition(f.identity.task_id,{version:'1.0',command_id:randomUUID(),expected_revision:f.identity.revision,review_sha256:review.review_sha256,claim_id:'C1',condition_id:condition.id,state:'met',answer:'能'});await workspace.collect();const after=workspace.read(f.identity.task_id);assert.equal(calls,1);assert.equal(after.review_updates!.at(-1)!.review.state,'completed');assert.equal(after.review_updates!.at(-1)!.review.rounds[0].claims[0].qualification!.selectable,true);assert.deepEqual(after.outcome,outcome);
  failNext=true;const current=after.review_updates!.at(-1)!.review;await workspace.answerReviewCondition(f.identity.task_id,{version:'1.0',command_id:randomUUID(),expected_revision:f.identity.revision,review_sha256:current.review_sha256,claim_id:'C1',condition_id:condition.id,state:'unmet',answer:'不能'});await workspace.collect();const failed=workspace.read(f.identity.task_id).review_updates!.at(-1)!.review;assert.equal(failed.state,'failed');assert.equal(failed.failure_code,'VALIDATION_FAILED');
  await workspace.retryJudgmentReview(f.identity.task_id,{version:'1.0',command_id:randomUUID(),expected_revision:f.identity.revision,review_sha256:failed.review_sha256});await workspace.collect();const retried=workspace.read(f.identity.task_id);assert.equal(calls,3);assert.equal(retried.review_updates!.at(-1)!.review.state,'completed');assert.equal(retried.review_updates!.at(-1)!.review.rounds[0].claims[0].qualification!.selectable,false,'explicit retry cannot turn known unmet authority/resources into met');assert.deepEqual(retried.outcome,outcome);
 }
 finally{await workspace.close();}
});

test('JR110 一次合并修订与对应重审：完整实际正文改变，同版保存与审查，不新增轮次',async()=>{
 const {f,snapshot:good,response}=await optionScenario(),bad=structuredClone(good) as any;bad.document.units[0].text+='立即扩大促销。';bad.claims=reviewableClaims(bad.document,bad,f.sources);
 const {runGeneratedJudgmentReview}=await import('../../../packages/application/open-analysis.ts'),{naturalReviewSystem}=await import('../../../packages/product-core/open-analysis-natural-review.ts');const calls:string[]=[],saved:any[]=[];
 const result=await runGeneratedJudgmentReview({snapshot:bad,sources:f.sources,check:()=>{},save:async r=>{saved.push(r);},run:async(purpose,prompt,system)=>{
  calls.push(purpose);const p=JSON.parse(prompt.slice(prompt.indexOf('\n')+1));
  if(purpose==='report_edit'){assert.equal(p.output_contract,'reviewable-revision/1.1');assert.ok(system.includes('actor_links'));assert.equal(p.current_proposal.units[0].text,bad.document.units[0].text);return JSON.stringify({version:'1.1',snapshot_sha256:p.snapshot_sha256,changes:[{claim_id:'C1',unit:good.document!.units[0]}]});}
  assert.equal(system,naturalReviewSystem);const first=calls.length===1;assert.equal(p.current_proposal.units[0].text,first?bad.document.units[0].text:good.document!.units[0].text);
  return JSON.stringify({...response,snapshot_sha256:p.snapshot_sha256,claims:response.claims.map(c=>({...c,verdict:first?'insufficient':'supported'}))});
 }});
 assert.deepEqual(calls,['conclusion_strategy_review','report_edit','conclusion_strategy_review']);assert.equal(result.revision_attempted,true);assert.equal(result.rounds.length,2);assert.ok(result.revised_document);assert.ok(!result.delivery.includes('立即扩大促销。'));assert.ok(result.delivery.includes('200'));assert.equal(result.rounds[1].claims[0].qualification!.selectable,true);validateJudgmentReview(result,bad,f.sources);assert.equal(saved.at(-1),result);
});

test('JR110 有效否定审查可不采纳提案数字引用，仍保留宿主核验事实和正式缺口',()=>{
 const {f,snapshot,response}=scenario();const raw={...response,claims:response.claims.map(c=>({...c,verdict:'insufficient',evidence_refs:[]}))};const round=compileJudgmentRound(JSON.stringify(raw),snapshot,'initial',f.sources),review=completeJudgmentReview(snapshot,round);assert.equal(round.claims[0].verdict,'insufficient');assert.ok(review.delivery.includes('430'));assert.ok(!review.delivery.includes(snapshot.document!.units[0].text));assert.equal(round.completeness!.verdict,'incomplete');
});

test('JR111/P1 修订后条件回答和失败retry消费同一修订正文，不恢复已撤回内容',async()=>{
 const {actualB06Question102}=await import('../../fixtures/xanthil-desktop/change007-b06-actual102.ts');
 const {f,snapshot,response}=await optionScenario(actualB06Question102.replace('可在未来3天安排2小时','能否在未来3天安排2小时未知'));
 const {createLocalOpenAnalysisStore}=await import('../../../adapters/storage-local/open-analysis.ts'),{createLocalAnalysisRequestLedger}=await import('../../../adapters/storage-local/analysis-request-ledger.ts'),{createOpenAnalysisWorkspace}=await import('../../../packages/application/open-analysis-workspace.ts'),{naturalReviewSystem}=await import('../../../packages/product-core/open-analysis-natural-review.ts');
 const {mkdtempSync}=await import('node:fs'),{join}=await import('node:path'),{tmpdir}=await import('node:os');
 const root=mkdtempSync(join(process.env.JUANERAI_TEST_EVIDENCE_DIR??tmpdir(),'jr110-condition-')),store=createLocalOpenAnalysisStore({projectRoot:root});store.create({identity:f.identity,source:f.sources,question:snapshot.question,review_policy:'conclusion_strategy_v1'} as any);const lease=store.begin(f.identity.task_id);
 store.saveFramework(lease,{version:'1.0',identity:f.identity,origin:'MODEL_PROPOSAL',plan:f.plan});
 const {runGeneratedJudgmentReview}=await import('../../../packages/application/open-analysis.ts');
 const original=structuredClone(snapshot) as any;original.document.units[0].text+='立即扩大促销。';original.claims=reviewableClaims(original.document,original,f.sources);let initialCalls=0;
 const review=await runGeneratedJudgmentReview({snapshot:original,sources:f.sources,check:()=>{},save:async()=>{},run:async(purpose,prompt)=>{initialCalls++;const packet=JSON.parse(prompt.slice(prompt.indexOf('\n')+1));if(purpose==='report_edit')return JSON.stringify({version:'1.1',snapshot_sha256:packet.snapshot_sha256,changes:[{claim_id:'C1',unit:snapshot.document!.units[0]}]});return JSON.stringify({...response,snapshot_sha256:packet.snapshot_sha256,claims:response.claims.map(c=>({...c,verdict:initialCalls===1?'insufficient':'supported'}))});}});
 assert.equal(initialCalls,3);assert.ok(review.revised_document);assert.ok(!review.delivery.includes('立即扩大促销。'));const condition=review.rounds[0].claims[0].conditions.find(c=>c.state==='unknown')!;assert.ok(condition,'actual UNKNOWN time is the single necessary missing condition');
 const {reviewUpdateSnapshot,validateReviewUpdates}=await import('../../../packages/product-core/open-analysis-judgment-review.ts');
 const legacyInput={kind:'condition' as const,command:{version:'1.0' as const,command_id:randomUUID(),expected_revision:f.identity.revision,review_sha256:review.review_sha256,claim_id:'C1',condition_id:condition.id,state:'met' as const,answer:'能'}};
 const legacySnapshot=reviewUpdateSnapshot(store.read(f.identity.task_id)!,review,legacyInput,'1.21');
 assert.ok(legacySnapshot.document!.units[0].text.includes('立即扩大促销。'),'old replay semantics preserved, not claimed fixed');
 const legacyReview=completeJudgmentReview(legacySnapshot,compileJudgmentRound(JSON.stringify({...response,snapshot_sha256:taskHash(legacySnapshot)}),legacySnapshot,'initial',f.sources));
 const outcome={version:'1.0',outcome_id:randomUUID(),identity:f.identity,framework:f.plan,calculation:f.calculation,verification:(f.evidence.verified_calculations[0] as any).verification,numeric_report:snapshot.report,judgment_review:review,explanation:{kind:'MODEL_EXPLANATION',text:review.delivery},human_judgment:'not_recorded'};
 validateReviewUpdates({...store.read(f.identity.task_id)!,outcome,review_updates:[{version:'1.21',command_id:legacyInput.command.command_id,prior_review_sha256:review.review_sha256,expression_version:0,input:legacyInput,review:legacyReview}]} as any);
 store.saveOutcome(lease,outcome as any);let calls=0,failNext=false,observedBody:string|null=null;
 const workspace=createOpenAnalysisWorkspace({store,ledger:createLocalAnalysisRequestLedger({projectRoot:root}),inspect:async()=>f.sources,verify:verifyOpenAnalysisIntegerSum,authorizeConfiguration:async()=>({config_sha256:f.identity.config_sha256}),runtime:{run:async (i:import('../../../packages/ports/open-analysis-runtime.ts').OpenAnalysisRun)=>{
  calls++;assert.equal(i.purpose,'conclusion_strategy_review');assert.equal(i.system,naturalReviewSystem);const p=JSON.parse(i.prompt.slice(i.prompt.indexOf('\n')+1));assert.equal(p.output_contract.version,'1.2');assert.equal(p.current_proposal.units[0].content.actor_links.length,2);observedBody=p.current_proposal.units[0].text;assert.ok(p.condition_witnesses.some((c:any)=>c.kind==='time'&&['met','unmet'].includes(c.state)));if(failNext){failNext=false;throw Object.assign(new Error('controlled refusal'),{code:'VALIDATION_FAILED'});}
  return {text:JSON.stringify({...response,snapshot_sha256:p.snapshot_sha256}),tools:[]};
 }}} as any);
 try{await workspace.answerReviewCondition(f.identity.task_id,{version:'1.0',command_id:randomUUID(),expected_revision:f.identity.revision,review_sha256:review.review_sha256,claim_id:'C1',condition_id:condition.id,state:'met',answer:'能'});await workspace.collect();const after=workspace.read(f.identity.task_id);assert.equal(calls,1);assert.equal(observedBody,snapshot.document!.units[0].text,'condition reviewer must receive corrected body');assert.equal(after.review_updates!.at(-1)!.review.state,'completed');assert.equal(after.review_updates!.at(-1)!.review.rounds[0].claims[0].qualification!.selectable,true);assert.deepEqual(after.outcome,outcome);assert.equal(after.review_updates!.at(-1)!.version,'1.22');await assert111Consumers(workspace,after,snapshot.document!.units[0].text,true);
  failNext=true;const current=after.review_updates!.at(-1)!.review;await workspace.answerReviewCondition(f.identity.task_id,{version:'1.0',command_id:randomUUID(),expected_revision:f.identity.revision,review_sha256:current.review_sha256,claim_id:'C1',condition_id:condition.id,state:'unmet',answer:'不能'});await workspace.collect();const failed=workspace.read(f.identity.task_id).review_updates!.at(-1)!.review;assert.equal(failed.state,'failed');assert.equal(failed.failure_code,'VALIDATION_FAILED');
  await workspace.retryJudgmentReview(f.identity.task_id,{version:'1.0',command_id:randomUUID(),expected_revision:f.identity.revision,review_sha256:failed.review_sha256});await workspace.collect();const retried=workspace.read(f.identity.task_id);assert.equal(calls,3);assert.equal(retried.review_updates!.at(-1)!.review.state,'completed');assert.equal(retried.review_updates!.at(-1)!.review.rounds[0].claims[0].qualification!.selectable,false,'explicit retry cannot turn known unmet authority/resources into met');assert.deepEqual(retried.outcome,outcome);assert.equal(retried.review_updates!.at(-1)!.review.snapshot.document!.units[0].text,snapshot.document!.units[0].text);await assert111Consumers(workspace,retried,snapshot.document!.units[0].text,false);
 }
 finally{await workspace.close();}
});

// Current consumers must agree; old history is deliberately still inspectable.
async function assert111Consumers(workspace:any,task:any,body:string,selectable:boolean){
 const {deliveredJudgmentReview}=await import('../../../packages/product-core/open-analysis-judgment-review.ts'),{projectReportContent}=await import('../../../packages/product-core/browser-report-content.ts');
 const {openTaskView}=await import('../../../apps/browser/quick-analysis-client.mjs'),{renderQuickAnalysisWorkbench}=await import('../../../apps/browser/quick-analysis-workbench.mjs');
 const r=deliveredJudgmentReview(task)!,view=openTaskView({...task,browser_report:projectReportContent(task)});
 assert.ok(view.judgmentReview);assert.equal(view.judgmentReview.state,r.state);if(r.state==='completed')assert.equal(view.judgmentReview.review_sha256,r.review_sha256);
 assert.equal(view.judgmentReview.rounds.at(-1)?.claims[0]?.qualification?.selectable??false,selectable);
 const copy=workspace.reportCopy(task.identity.task_id,task.identity.revision,task.outcome.outcome_id).bytes.toString('utf8');assert.equal(workspace.reportCopy(task.identity.task_id,task.identity.revision,task.outcome.outcome_id,false,r.review_sha256).bytes.toString('utf8'),copy);assert.throws(()=>workspace.reportCopy(task.identity.task_id,task.identity.revision,task.outcome.outcome_id,false,'0'.repeat(64)),{code:'REVISION_CONFLICT'});
 assert.ok(!copy.includes('立即扩大促销。'));assert.ok(!r.delivery.includes('立即扩大促销。'));
 if(selectable){assert.ok(r.delivery.includes(body));assert.ok(projectReportContent(task)!.text.includes(body));assert.ok(copy.includes(body));}
 for(const mode of ['quick','pro'] as const){const html=renderQuickAnalysisWorkbench({project:'offline111',tasks:[],current:view,mode,stage:'report',expanded:'report',viewMode:'results',resultView:'report'} as any);const cards=html.slice(html.indexOf('<h3>数字检查</h3>'),html.indexOf('<details><summary>修订与审查历史</summary>'));assert.equal(cards.includes('可选择的建议'),selectable);}
}

async function saved111Option(){
 const {f,snapshot,response}=await optionScenario();
 const {createLocalOpenAnalysisStore}=await import('../../../adapters/storage-local/open-analysis.ts'),{createLocalAnalysisRequestLedger}=await import('../../../adapters/storage-local/analysis-request-ledger.ts'),{createOpenAnalysisWorkspace}=await import('../../../packages/application/open-analysis-workspace.ts');
 const {mkdtempSync}=await import('node:fs'),{join}=await import('node:path'),{tmpdir}=await import('node:os');
 const root=mkdtempSync(join(process.env.JUANERAI_TEST_EVIDENCE_DIR??tmpdir(),'jr111-content-')),store=createLocalOpenAnalysisStore({projectRoot:root});store.create({identity:f.identity,source:f.sources,question:snapshot.question,review_policy:'conclusion_strategy_v1'} as any);const lease=store.begin(f.identity.task_id);
 store.saveFramework(lease,{version:'1.0',identity:f.identity,origin:'MODEL_PROPOSAL',plan:f.plan});const review=completeJudgmentReview(snapshot,compileJudgmentRound(JSON.stringify(response),snapshot,'initial',f.sources));
 const outcome={version:'1.0',outcome_id:randomUUID(),identity:f.identity,framework:f.plan,calculation:f.calculation,verification:(f.evidence.verified_calculations[0] as any).verification,numeric_report:snapshot.report,judgment_review:review,explanation:{kind:'MODEL_EXPLANATION',text:review.delivery},human_judgment:'not_recorded'};
 store.saveOutcome(lease,outcome as any);
 const workspace=createOpenAnalysisWorkspace({store,ledger:createLocalAnalysisRequestLedger({projectRoot:root}),inspect:async()=>f.sources,verify:verifyOpenAnalysisIntegerSum,authorizeConfiguration:async()=>({config_sha256:f.identity.config_sha256}),runtime:{run:async()=>assert.fail('offline save/apply/read must not invoke model')}} as any);
 const write=(action:string,fields:any={})=>store.reportContentCommand!(f.identity.task_id,{version:'1.0',command_id:randomUUID(),expected_content_sha256:store.reportContent!(f.identity.task_id)!.sha256,action,...fields});
 return {f,snapshot,root,store,workspace,write,outcome};
}
for(const action of ['save','apply'] as const)for(const changed of [false,true])test('JR111/P2 '+action+' '+(changed?'实际变化失效':'完全未改保留审查')+'：持久读回和全部当前消费者',async()=>{
 const {f,snapshot,root,store,workspace,write,outcome}=await saved111Option();
 const {createLocalOpenAnalysisStore}=await import('../../../adapters/storage-local/open-analysis.ts');
 try{
  write('confirm');const before=store.reportContent!(f.identity.task_id)!,currentReview=outcome.judgment_review;
  if(action==='save')await workspace.reportContentCommand(f.identity.task_id,{version:'1.0',command_id:randomUUID(),expected_content_sha256:before.sha256,action,text:before.text+(changed?'\n\n未审变更XYZ':''),finding_ids:before.finding_ids});
  else{const text=before.paragraphs[0]!.text+(changed?'未审变更XYZ':'');const suggestion=write('suggest',{instruction:'保持内容',paragraph_id:before.paragraphs[0]!.id});write('complete',{suggestion_id:suggestion.command_id,text});await workspace.reportContentCommand(f.identity.task_id,{version:'1.0',command_id:randomUUID(),expected_content_sha256:before.sha256,action,suggestion_id:suggestion.command_id});}
  const after=createLocalOpenAnalysisStore({projectRoot:root}).read(f.identity.task_id)!;
  assert.deepEqual(after.outcome,outcome);const content=store.reportContent!(f.identity.task_id)!;
  assert.equal(content.version,changed?before.version+1:before.version);assert.equal(content.confirmed,!changed);
  const {deliveredJudgmentReview}=await import('../../../packages/product-core/open-analysis-judgment-review.ts');
  assert.equal(deliveredJudgmentReview(after)!.state,changed?'unknown':'completed');
  if(!changed)assert.equal(deliveredJudgmentReview(after)!.review_sha256,currentReview.review_sha256);
  await assert111Consumers(workspace,after,snapshot.document!.units[0].text,!changed);
 }finally{await workspace.close();}
});

test('JR111/P2 仅改变已核验发现引用仍失效，不能借正文未改保留资格',async()=>{
 const {f,store,workspace,write}=await saved111Option();
 try{const content=store.reportContent!(f.identity.task_id)!;assert.ok(content.findings.length);write('save',{text:content.text,finding_ids:[content.findings[0]!.id]});const after=store.read(f.identity.task_id)!;const {deliveredJudgmentReview}=await import('../../../packages/product-core/open-analysis-judgment-review.ts');assert.equal(deliveredJudgmentReview(after)!.state,'unknown');assert.equal(store.reportContent!(f.identity.task_id)!.version,content.version+1);}
 finally{await workspace.close();}
});

test('JR111/P2 已有回复预览后的save回执保留历史基线，不能恢复陈旧预览的执行资格',async()=>{
 const {f,root,store,workspace,write,outcome}=await saved111Option();
 const {createLocalOpenAnalysisStore}=await import('../../../adapters/storage-local/open-analysis.ts');
 try{
  const command_id=randomUUID(),previewIdentity={...f.identity,run_id:randomUUID(),attempt_id:randomUUID(),operation_id:randomUUID()};
  store.reservePreview!(f.identity.task_id,{version:'1.0',command_id,identity:previewIdentity,baseline_identity:f.identity,question:'只记录既有合成回复',preferences:{skill:'general',prompt:'professional'}});
  store.completePreview!(f.identity.task_id,command_id,{state:'answered',framework:null,text:'原回复保留',failure_code:null});
  const before=store.read(f.identity.task_id)!,content=store.reportContent!(f.identity.task_id)!;
  write('save',{text:content.text,finding_ids:content.finding_ids});
  let after=createLocalOpenAnalysisStore({projectRoot:root}).read(f.identity.task_id)!;
  assert.deepEqual(after.revision_previews,before.revision_previews);assert.deepEqual(after.outcome,outcome);await assert111Consumers(workspace,after,outcome.judgment_review.snapshot.document!.units[0].text,true);
  // A current unfinished preview still binds the entire current event prefix.
  const pending=randomUUID();store.reservePreview!(f.identity.task_id,{version:'1.0',command_id:pending,identity:{...previewIdentity,run_id:randomUUID(),attempt_id:randomUUID(),operation_id:randomUUID()},baseline_identity:f.identity,question:'待生成回复',preferences:{skill:'general',prompt:'professional'}});
  assert.throws(()=>write('save',{text:content.text,finding_ids:[]}),{code:'TASK_UNCONFIRMED'});
  store.completePreview!(f.identity.task_id,pending,{state:'failed',framework:null,text:null,failure_code:'CONTROLLED_FAILURE'});
  write('save',{text:content.text+'\n\n未审变更XYZ',finding_ids:[]});
  after=createLocalOpenAnalysisStore({projectRoot:root}).read(f.identity.task_id)!;assert.deepEqual(after.revision_previews![0],before.revision_previews![0]);
  assert.throws(()=>store.completePreview!(f.identity.task_id,command_id,{state:'answered',framework:null,text:'过期替换',failure_code:null}),{code:'REVISION_CONFLICT'});
  await assert111Consumers(workspace,after,'',false);
 }finally{await workspace.close();}
});

// F111 regressions: actual retained recheck state, Store, explicit recovery and current consumers.
async function interrupted112(state:'failed'|'stopped'|'unknown'){
 const {f,snapshot:good,response}=await optionScenario(),original=structuredClone(good) as any;
 original.document.units[0].text+='立即扩大促销。';original.claims=reviewableClaims(original.document,original,f.sources);
 const {runGeneratedJudgmentReview}=await import('../../../packages/application/open-analysis.ts'),{judgmentReviewCheckpoint}=await import('../../../packages/product-core/open-analysis-judgment-review.ts');
 const {createLocalOpenAnalysisStore}=await import('../../../adapters/storage-local/open-analysis.ts'),{createLocalAnalysisRequestLedger}=await import('../../../adapters/storage-local/analysis-request-ledger.ts');
 const {mkdtempSync}=await import('node:fs'),{join}=await import('node:path'),{tmpdir}=await import('node:os');
 const root=mkdtempSync(join(process.env.JUANERAI_TEST_EVIDENCE_DIR??tmpdir(),'jr112-recovery-')),store=createLocalOpenAnalysisStore({projectRoot:root});
 store.create({identity:f.identity,source:f.sources,question:original.question,review_policy:'conclusion_strategy_v1'} as any);const lease=store.begin(f.identity.task_id);
 const framework={version:'1.0' as const,identity:f.identity,origin:'MODEL_PROPOSAL' as const,plan:f.plan};store.saveFramework(lease,framework);store.saveVerifiedStep(lease,{version:'1.0',step_id:randomUUID(),identity:f.identity,framework,calculation:f.calculation,verification:f.evidence.verified_calculations[0].verification});
 original.evidence={verified_calculations:[{execution_plan:f.plan,calculation:f.calculation,verification:f.evidence.verified_calculations[0].verification}]};let persisted:any,calls=0;
 await assert.rejects(()=>runGeneratedJudgmentReview({snapshot:original,sources:f.sources,check:()=>{},save:async r=>{store.saveJudgmentReview!(lease,r);persisted=r;},run:async(purpose,prompt)=>{
  calls++;const packet=JSON.parse(prompt.slice(prompt.indexOf('\n')+1));
  if(purpose==='report_edit')return JSON.stringify({version:'1.1',snapshot_sha256:packet.snapshot_sha256,changes:[{claim_id:'C1',unit:good.document!.units[0]}]});
  if(calls===3)throw Object.assign(new Error('controlled failed recheck'),{code:'VALIDATION_FAILED'});
  return JSON.stringify({...response,snapshot_sha256:packet.snapshot_sha256,claims:response.claims.map(c=>({...c,verdict:'insufficient'}))});
 }}),{code:'VALIDATION_FAILED'});
 assert.equal(calls,3);assert.equal(persisted.state,'rechecking');
 const review=judgmentReviewCheckpoint(original,state,persisted.rounds,{revision_attempted:true,revised_claims:persisted.revised_claims,revised_document:persisted.revised_document,failure_code:state==='failed'?'VALIDATION_FAILED':'CANCELLED'});
 validateJudgmentReview(review,original,f.sources);store.saveJudgmentReview!(lease,review);
 const outcome={version:'1.0',outcome_id:randomUUID(),identity:f.identity,framework:f.plan,calculation:f.calculation,verification:f.evidence.verified_calculations[0].verification,numeric_report:original.report,judgment_review:review,explanation:{kind:'MODEL_EXPLANATION',text:review.delivery},human_judgment:'not_recorded'};
 return {f,good,original,response,root,store,lease,review,outcome,ledger:createLocalAnalysisRequestLedger({projectRoot:root})};
}

test('JR112/F111-01 对应重审失败后唯一显式retry继承修订正文与claims，全部当前消费者不恢复旧内容',async()=>{
 const {f,good,original,response,root,store,lease,review,outcome,ledger}=await interrupted112('failed');store.saveOutcome(lease,outcome as any);
 const {createOpenAnalysisWorkspace}=await import('../../../packages/application/open-analysis-workspace.ts'),{createLocalOpenAnalysisStore}=await import('../../../adapters/storage-local/open-analysis.ts');
 const {reviewUpdateSnapshot,validateReviewUpdates}=await import('../../../packages/product-core/open-analysis-judgment-review.ts');
 const command={version:'1.0' as const,command_id:randomUUID(),expected_revision:f.identity.revision,review_sha256:review.review_sha256},input={kind:'retry' as const,command};
 const legacy=reviewUpdateSnapshot(store.read(f.identity.task_id)!,review,input,'1.19');assert.deepEqual(legacy.document,original.document,'historical retry retains old semantics; not relabelled repaired');
 const historical=completeJudgmentReview(legacy,compileJudgmentRound(JSON.stringify({...response,snapshot_sha256:taskHash(legacy)}),legacy,'initial',f.sources));
 validateReviewUpdates({...store.read(f.identity.task_id)!,review_updates:[{version:'1.19',command_id:command.command_id,prior_review_sha256:review.review_sha256,expression_version:0,input,review:historical}]} as any);
 let calls=0;const received:any[]=[];const workspace=createOpenAnalysisWorkspace({store,ledger,inspect:async()=>f.sources,verify:verifyOpenAnalysisIntegerSum,authorizeConfiguration:async()=>({config_sha256:f.identity.config_sha256}),runtime:{run:async (i:import('../../../packages/ports/open-analysis-runtime.ts').OpenAnalysisRun)=>{
  calls++;assert.equal(i.purpose,'conclusion_strategy_review','retry cannot reopen content revision');const p=JSON.parse(i.prompt.slice(i.prompt.indexOf('\n')+1));received.push(p);
  return {text:JSON.stringify({...response,snapshot_sha256:p.snapshot_sha256}),tools:[]};
 }}} as any);
 try{
  await workspace.retryJudgmentReview(f.identity.task_id,command);await workspace.collect();const after=workspace.read(f.identity.task_id),latest=after.review_updates!.at(-1)!.review;
  assert.equal(calls,1);assert.equal(received[0].current_proposal.units[0].text,good.document!.units[0].text,'same revised document reaches retry reviewer');assert.deepEqual(latest.snapshot.claims,review.revised_claims);assert.deepEqual(latest.snapshot.document,review.revised_document);assert.deepEqual(after.outcome,outcome);assert.equal(after.review_updates!.at(-1)!.version,'1.23');validateReviewUpdates(after);
  await assert111Consumers(workspace,after,good.document!.units[0].text,true);
  const {qualifyAnalysisReviewSource}=await import('../../../packages/product-core/open-reviewed-analysis-source.ts');const qualified=qualifyAnalysisReviewSource(after);assert.ok('review_sha256' in qualified);assert.equal(qualified.review_sha256,latest.review_sha256);
  const reopened=createLocalOpenAnalysisStore({projectRoot:root});assert.deepEqual(reopened.read(f.identity.task_id),after);
  await assert.rejects(()=>workspace.retryJudgmentReview(f.identity.task_id,{...command,command_id:randomUUID(),review_sha256:latest.review_sha256}),{code:'REVIEW_RETRY_EXHAUSTED'});assert.equal(calls,1);
 }finally{await workspace.close();}
});

for(const interrupted of ['stopped','unknown'] as const)test('JR112/F111-02 '+interrupted+'重开只读、显式resume保留修订对和事实，无模型自动续跑',async()=>{
 const {f,root,store,lease,review,ledger}=await interrupted112(interrupted);store.finish(lease,'stopped');
 const {createOpenAnalysisWorkspace}=await import('../../../packages/application/open-analysis-workspace.ts'),{createLocalOpenAnalysisStore}=await import('../../../adapters/storage-local/open-analysis.ts');
 let calls=0;const reopened=createLocalOpenAnalysisStore({projectRoot:root}),before=reopened.read(f.identity.task_id)!;
 const workspace=createOpenAnalysisWorkspace({store:reopened,ledger,inspect:async()=>f.sources,verify:verifyOpenAnalysisIntegerSum,authorizeConfiguration:async()=>({config_sha256:f.identity.config_sha256}),runtime:{run:async()=>{calls++;assert.fail('resume must not replay model');}}} as any);
 try{
  assert.deepEqual(workspace.read(f.identity.task_id),before,'reopen/read has no run');assert.equal(calls,0);await workspace.resume(f.identity.task_id);await workspace.collect();const after=workspace.read(f.identity.task_id),closed=after.outcome!.judgment_review!;
  assert.equal(after.state,'saved');assert.equal(closed.state,'failed');assert.equal(closed.failure_code,'RECOVERY_RECONCILED');assert.deepEqual(closed.revised_document,review.revised_document);assert.deepEqual(closed.revised_claims,review.revised_claims);assert.deepEqual(closed.rounds,review.rounds);assert.equal(closed.revision_attempted,true);validateJudgmentReview(closed,review.snapshot,f.sources);assert.ok(closed.delivery.includes('430'),'verified useful facts survive interruption');assert.equal(calls,0);
  await assert111Consumers(workspace,after,'',false);assert.deepEqual(createLocalOpenAnalysisStore({projectRoot:root}).read(f.identity.task_id),after);
 }finally{await workspace.close();}
});

for(const failure of ['VALIDATION_FAILED','CANCELLED','EXECUTION_UNKNOWN'] as const)test('JR112/F111-02 initial Application '+failure+'保留实际重审前持久化的完整修订对',async()=>{
 const {f,snapshot:good}=scenario();const {createOpenAnalysisApplication}=await import('../../../packages/application/open-analysis.ts'),{openAnalysisProposal}=await import('../../../packages/product-core/open-analysis-ir.ts');
 const {createLocalOpenAnalysisStore}=await import('../../../adapters/storage-local/open-analysis.ts'),{mkdtempSync}=await import('node:fs'),{join}=await import('node:path'),{tmpdir}=await import('node:os');
 const root=mkdtempSync(join(process.env.JUANERAI_TEST_EVIDENCE_DIR??tmpdir(),'jr112-initial-')),store=createLocalOpenAnalysisStore({projectRoot:root});store.create({identity:f.identity,source:f.sources,question:good.question,review_policy:'conclusion_strategy_v1'} as any);const lease=store.begin(f.identity.task_id);let reviews=0,revisionCalls=0,atRecheck:any;
 const app=createOpenAnalysisApplication({agentLed:true,reviewReport:true,numericReport:true,judgmentReview:true,formReviewableDocument:true,loadSelectedSource:async()=>f.sources,isAuthorized:()=>true,verify:verifyOpenAnalysisIntegerSum,
 saveFramework:async (v:any)=>store.saveFramework(lease,v),saveVerifiedStep:async (v:any)=>store.saveVerifiedStep!(lease,v),saveJudgmentReview:async (v:any)=>store.saveJudgmentReview!(lease,v),saveOutcome:async (v:any)=>store.saveOutcome(lease,v),runtime:{run:async (i:import('../../../packages/ports/open-analysis-runtime.ts').OpenAnalysisRun)=>{
  if(i.purpose==='report_edit'){
   const p=JSON.parse(i.prompt.slice(i.prompt.indexOf('\n')+1));
   if(p.output_contract==='reviewable-document/1.4')return {text:JSON.stringify({version:'1.4',source_sha256:p.source_sha256,units:[{...good.document!.units[0],text:good.document!.units[0].text+'立即扩大促销。'}]}),tools:[]};
   assert.equal(p.output_contract,'reviewable-revision/1.1');revisionCalls++;return {text:JSON.stringify({version:'1.1',snapshot_sha256:p.snapshot_sha256,changes:[{claim_id:'C1',unit:good.document!.units[0]}]}),tools:[]};
  }
  if(i.purpose==='conclusion_strategy_review'){
   reviews++;const p=JSON.parse(i.prompt.slice(i.prompt.indexOf('\n')+1));if(reviews===2){atRecheck=store.read(f.identity.task_id)!.review_checkpoint;throw Object.assign(new Error('controlled initial recheck failure'),{code:failure});}
   return {text:JSON.stringify({version:'1.2',snapshot_sha256:p.snapshot_sha256,completeness:{verdict:'incomplete',reason:'需移除无据行动。'},requirement_coverage:p.requirements.map((r:any)=>({requirement_id:r.id,claim_ids:['C1'],verdict:'fulfilled'})),claims:[{claim_id:'C1',kind:'conclusion',level:'observation',verdict:'insufficient',evidence_refs:['F1','F2'],counterevidence:[],reason:'混入无据行动。',limitations:[],conditions:[],strategy:null}]}),tools:[]};
  }
  await i.tools.find((t:import('../../../packages/ports/open-analysis-runtime.ts').AnalysisTool)=>t.name==='calculate_and_verify')!.execute({plan:openAnalysisProposal(f.plan)},i.signal);return {text:'当前有限观察及原范围限制。',tools:[]};
 }}} as any);
 if(failure==='VALIDATION_FAILED')await app.run({identity:f.identity,question:good.question,signal:new AbortController().signal});
 else await assert.rejects(()=>app.run({identity:f.identity,question:good.question,signal:new AbortController().signal}),{code:failure});
 assert.equal(reviews,2);assert.equal(revisionCalls,1);assert.equal(atRecheck.state,'rechecking');const after=store.read(f.identity.task_id)!,last=after.review_checkpoint!;
 assert.equal(last.state,failure==='VALIDATION_FAILED'?'failed':failure==='CANCELLED'?'stopped':'unknown');assert.deepEqual(last.revised_document,atRecheck.revised_document);assert.deepEqual(last.revised_claims,atRecheck.revised_claims);assert.deepEqual(last.rounds,atRecheck.rounds);validateJudgmentReview(last,last.snapshot,f.sources);assert.ok(last.delivery.includes('430'));assert.ok(!last.delivery.includes('立即扩大促销。'));assert.deepEqual(createLocalOpenAnalysisStore({projectRoot:root}).read(f.identity.task_id),after);
 if(failure!=='VALIDATION_FAILED')store.finish(lease,'stopped');
 const {createOpenAnalysisWorkspace}=await import('../../../packages/application/open-analysis-workspace.ts'),{createLocalAnalysisRequestLedger}=await import('../../../adapters/storage-local/analysis-request-ledger.ts');
 const workspace=createOpenAnalysisWorkspace({store:createLocalOpenAnalysisStore({projectRoot:root}),ledger:createLocalAnalysisRequestLedger({projectRoot:root}),inspect:async()=>f.sources,verify:verifyOpenAnalysisIntegerSum,authorizeConfiguration:async()=>({config_sha256:f.identity.config_sha256}),runtime:{run:async()=>assert.fail('failure recovery cannot replay provider')}} as any);
 try{if(failure!=='VALIDATION_FAILED')await workspace.resume(f.identity.task_id);const restored=workspace.read(f.identity.task_id);assert.deepEqual(restored.outcome!.judgment_review!.revised_document,atRecheck.revised_document);await assert111Consumers(workspace,restored,'',false);}finally{await workspace.close();}
});

test('JR112/F111-01 retry仍不足时不重新取得合并修订额度，陈旧hash与再次retry不产生请求',async()=>{
 const {f,good,response,store,lease,review,outcome,ledger}=await interrupted112('failed');store.saveOutcome(lease,outcome as any);
 const {createOpenAnalysisWorkspace}=await import('../../../packages/application/open-analysis-workspace.ts');const calls:string[]=[];
 const workspace=createOpenAnalysisWorkspace({store,ledger,inspect:async()=>f.sources,verify:verifyOpenAnalysisIntegerSum,authorizeConfiguration:async()=>({config_sha256:f.identity.config_sha256}),runtime:{run:async (i:import('../../../packages/ports/open-analysis-runtime.ts').OpenAnalysisRun)=>{
  assert.ok(i.purpose);calls.push(i.purpose);const p=JSON.parse(i.prompt.slice(i.prompt.indexOf('\n')+1));
  if(i.purpose==='report_edit')return {text:JSON.stringify({version:'1.1',snapshot_sha256:p.snapshot_sha256,changes:[]}),tools:[]};
  assert.equal(p.current_proposal.units[0].text,good.document!.units[0].text);return {text:JSON.stringify({...response,snapshot_sha256:p.snapshot_sha256,claims:response.claims.map(c=>({...c,verdict:'insufficient'}))}),tools:[]};
 }}} as any);
 try{
  const cmd={version:'1.0',command_id:randomUUID(),expected_revision:f.identity.revision,review_sha256:'f'.repeat(64)};
  await assert.rejects(()=>workspace.retryJudgmentReview(f.identity.task_id,cmd),{code:'REVIEW_RETRY_UNAVAILABLE'});assert.equal(calls.length,0);
  await workspace.retryJudgmentReview(f.identity.task_id,{...cmd,command_id:randomUUID(),review_sha256:review.review_sha256});await workspace.collect();const after=workspace.read(f.identity.task_id);
  assert.deepEqual(calls,['conclusion_strategy_review'],'one admitted retry cannot grant a second content revision');assert.equal(after.review_updates!.at(-1)!.review.state,'completed');await assert111Consumers(workspace,after,'',false);
 }finally{await workspace.close();}
});

test('JR112 停止retry后迟到回复不获资格，显式恢复不再请求且原Outcome/额度保留',async()=>{
 const {f,good,response,root,store,lease,review,outcome,ledger}=await interrupted112('failed');store.saveOutcome(lease,outcome as any);
 const {createOpenAnalysisWorkspace}=await import('../../../packages/application/open-analysis-workspace.ts'),{createLocalOpenAnalysisStore}=await import('../../../adapters/storage-local/open-analysis.ts');
 let release!:()=>void,entered!:()=>void,calls=0;const gate=new Promise<void>(resolve=>{release=resolve;}),started=new Promise<void>(resolve=>{entered=resolve;});
 const workspace=createOpenAnalysisWorkspace({store,ledger,inspect:async()=>f.sources,verify:verifyOpenAnalysisIntegerSum,authorizeConfiguration:async()=>({config_sha256:f.identity.config_sha256}),runtime:{run:async (i:import('../../../packages/ports/open-analysis-runtime.ts').OpenAnalysisRun)=>{
  calls++;entered();await gate;const p=JSON.parse(i.prompt.slice(i.prompt.indexOf('\n')+1));return {text:JSON.stringify({...response,snapshot_sha256:p.snapshot_sha256}),tools:[]};
 }}} as any);
 try{
  await workspace.retryJudgmentReview(f.identity.task_id,{version:'1.0',command_id:randomUUID(),expected_revision:f.identity.revision,review_sha256:review.review_sha256});await started;await workspace.stop(f.identity.task_id);release();await workspace.collect();const stopped=workspace.read(f.identity.task_id);assert.equal(stopped.review_updates!.at(-1)!.review.state,'stopped');assert.deepEqual(stopped.review_updates!.at(-1)!.review.snapshot.document,good.document);assert.deepEqual(stopped.outcome,outcome);await assert111Consumers(workspace,stopped,'',false);
  await workspace.resume(f.identity.task_id);assert.equal(calls,1);const reconciled=workspace.read(f.identity.task_id);assert.equal(reconciled.review_updates!.at(-1)!.review.state,'failed');assert.deepEqual(reconciled.review_updates!.at(-1)!.review.snapshot.claims,review.revised_claims);assert.deepEqual(createLocalOpenAnalysisStore({projectRoot:root}).read(f.identity.task_id),reconciled);await assert111Consumers(workspace,reconciled,'',false);
 }finally{release();await workspace.close();}
});

test('JR112 修订对不完整仍被Store拒绝，不以恢复放宽1.14身份校验',async()=>{
 const {f,store,lease,review}=await interrupted112('failed');const {judgmentReviewCheckpoint}=await import('../../../packages/product-core/open-analysis-judgment-review.ts');
 for(const field of ['revised_document','revised_claims']){
  const fields:any={revision_attempted:true,revised_document:review.revised_document,revised_claims:review.revised_claims,failure_code:'VALIDATION_FAILED'};delete fields[field];const invalid=judgmentReviewCheckpoint(review.snapshot,'failed',review.rounds,fields);
  assert.throws(()=>store.saveJudgmentReview!(lease,invalid),{code:'JUDGMENT_REVIEW_INVALID'});assert.deepEqual(store.read(f.identity.task_id)!.review_checkpoint,review);
 }
});
