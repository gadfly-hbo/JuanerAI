import {compileOpenAnalysisContext} from '../../../packages/product-core/open-analysis-context.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {compileOpenAnalysisIR,executeOpenAnalysisIR,openAnalysisProposal} from '../../../packages/product-core/open-analysis-ir.ts';
import {taskHash} from '../../../packages/product-core/member-task.ts';
import {verifyOpenAnalysisIntegerSum} from '../../../adapters/analytics-duckdb/open-analysis-verification.ts';
import {checkedReportEdit} from '../../../packages/product-core/open-analysis-report-review.ts';
import type {MemberSourceInspection} from '../../../packages/ports/member-source.ts';
import {compileNumericReport,numericReportCopy,numericReportFacts,validateNumericReport,verifyNumericOperation} from '../../../packages/product-core/open-analysis-numeric-report.ts';
import {createLocalOpenAnalysisStore} from '../../../adapters/storage-local/open-analysis.ts';
import {mkdtempSync,rmSync,realpathSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {createOpenAnalysisApplication} from '../../../packages/application/open-analysis.ts';

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
const ref=(reference:string)=>({reference});
const subtract={op:'subtract',left:ref('F2'),right:ref('F1')};
function document(){return {version:'1.3',status:'ready',derivations:[{id:'D1',label:'净额差额',expression:subtract,format:'number',decimals:2},{id:'D2',label:'净额增长率',expression:{op:'divide',left:subtract,right:ref('F1')},format:'percent',decimals:2}],interpretations:[{references:['F1','F2','D1','D2'],interpretation:'一月{{F1}}，二月{{F2}}，差额{{D1}}，增长率{{D2}}。现有资料没有退款原因，不能推断原因。'}]};}
function currentDocument(){return {version:'1.5',status:'ready',interpretations:[{fact_refs:['F1','F2','D1','D2'],interpretation:'现有资料不能确定原因，需要补充业务记录。'}]};}
function report(doc:unknown,f=fixture()){return checkedReportEdit(JSON.stringify(doc),f.evidence,{version:'1.3',sources:f.sources,identity:f.identity} as any);}

function scopedComparisonFixture(){
 const f=fixture(),sources=structuredClone(f.sources),sheet=sources.sources[0]!.sheets[0]!;
 sheet.rows[0]!.cells.push({column:'D',type:'string',value:'地区'});
 for(const row of sheet.rows.slice(1))row.cells.push({column:'D',type:'string',value:['O1','O4'].includes(row.cells[0]!.value)?'北':'南'});
 const calculations=['北','南'].map(region=>{const raw=openAnalysisProposal(f.plan) as any;raw.inputs[0].filters=[{column:'D',operator:'eq',value:region}];const execution_plan=compileOpenAnalysisIR(raw,sources),calculation=executeOpenAnalysisIR(execution_plan,sources),verification=verifyOpenAnalysisIntegerSum(execution_plan,calculation,sources);return {execution_plan,calculation,verification};});
 return {context:{identity:{...f.identity,scope_sha256:taskHash(sources)},sources},evidence:{verified_calculations:calculations}};
}

test('AC119: explicit sequential periods retain common region and reject swapped or foreign coordinates',()=>{
 const {context,evidence}=scopedComparisonFixture();
 const make=(interpretation:string)=>({version:'1.3',status:'ready',derivations:[],interpretations:[{references:['F1','F2','F3','F4'],interpretation}]});
 const good=compileNumericReport(JSON.stringify(make('北区从2026-01的{{F1}}升至2026-02的{{F2}}。')),evidence,context);
 assert.equal(good.status,'complete');assert.equal((good as any).scope_sequence,'1.0');
 for(const text of ['北区从2026-01的{{F2}}升至2026-02的{{F1}}。','北区从2026-01的{{F1}}升至2026-02的{{F4}}。','北区2026-01和2026-02合计{{F1}}及{{F2}}。','{{F3}}对应北区。'])assert.ok(compileNumericReport(JSON.stringify(make(text)),evidence,context).issues.some(x=>x.code==='REPORT_SCOPE_CONFLICT'),text);
 assert.equal(compileNumericReport(JSON.stringify(make('北区2026-01为{{F1}}，南区2026-02为{{F4}}。')),evidence,context).status,'complete');
});

test('AC119: arbitrary categories compare naturally and old conservative report bytes remain readable',()=>{
 const f=fixture(),sources=structuredClone(f.sources);
 for(const row of sources.sources[0]!.sheets[0]!.rows.slice(1))row.cells[1]!.value=row.cells[1]!.value==='2026-01'?'直营网点':'加盟网点';
 const execution_plan=compileOpenAnalysisIR(openAnalysisProposal(f.plan),sources),calculation=executeOpenAnalysisIR(execution_plan,sources),verification=verifyOpenAnalysisIntegerSum(execution_plan,calculation,sources);
 const context={identity:{...f.identity,scope_sha256:taskHash(sources)},sources},evidence={verified_calculations:[{execution_plan,calculation,verification}]};
 const facts=numericReportFacts(evidence,context),direct=facts.find(v=>v.scope.endsWith(' · 直营网点'))!.id,franchise=facts.find(v=>v.scope.endsWith(' · 加盟网点'))!.id;
 const doc={version:'1.3',status:'ready',derivations:[],interpretations:[{references:[direct,franchise],interpretation:'直营网点{{'+direct+'}}与加盟网点{{'+franchise+'}}相比较。'}]};
 assert.equal(compileNumericReport(JSON.stringify(doc),evidence,context).status,'complete');
 const legacy=compileNumericReport(JSON.stringify(doc),evidence,{...context,includeSequentialScopes:false} as any),bytes=JSON.stringify(legacy);
 assert.equal(legacy.status,'partial');assert.equal((legacy as any).scope_sequence,undefined);
 assert.deepEqual(validateNumericReport(legacy,evidence,context),legacy);assert.equal(JSON.stringify(legacy),bytes);
 doc.interpretations[0]!.interpretation='直营网点{{'+franchise+'}}与加盟网点{{'+direct+'}}相比较。';
 assert.equal(compileNumericReport(JSON.stringify(doc),evidence,context).status,'partial');
});

test('NR02/03: real bound net facts produce checked difference and growth in report, not model arithmetic',()=>{
 const text=report(document());assert.match(text,/430/);assert.match(text,/620/);assert.match(text,/190/);assert.match(text,/44\.19%/);assert.match(text,/派生公式已核验/);assert.doesNotMatch(text,/全部.*已核验/);
});
test('NR02/07: an unbound report amount is withheld while valid calculated facts remain visible',()=>{
 const doc=document();doc.interpretations[0]!.interpretation='净销售额是999999元，全部核验通过。';
 const text=report(doc);assert.doesNotMatch(text,/999999/);assert.match(text,/430/);assert.match(text,/620/);assert.match(text,/依据|不采用|冲突/);
});
test('NR02: actual dates and order identifiers remain natural text rather than false numeric errors',()=>{
 const doc=document();doc.interpretations[0]!.interpretation='2026-01 与 2026-02 的订单 O1、O4 分别关联退款 R1、R2；一月{{F1}}，二月{{F2}}。原因仍未知。';
 const text=report(doc);assert.match(text,/2026-01/);assert.match(text,/O1/);assert.match(text,/R2/);
});
test('NR03/04: different source values drive formulas; zero denominator is inapplicable, never zero percent',()=>{
 const changed=report(document(),fixture('200','200'));assert.match(changed,/430|530/);assert.match(changed,/520/);assert.doesNotMatch(changed,/44\.19%/);
 const zero=report(document(),fixture('-330'));assert.match(zero,/不适用|基期为零/);assert.doesNotMatch(zero,/增长率[^\n]*0\.00%/);assert.match(zero,/620/);
});

test('NR03/04: source integer precision survives catalog projection above safe Number range',()=>{
 const f=fixture('9007199254740991');const facts=numericReportFacts(f.evidence,{identity:f.identity,sources:f.sources});
 assert.equal(facts[0]!.value,'9007199254741321');
});

test('NR02/06/09: numeric identities and formula evidence survive real store reopening without recomputation',()=>{
 const f=fixture(),root=mkdtempSync(join(tmpdir(),'juaner-r2-store-'));
 try{
  const store=createLocalOpenAnalysisStore({projectRoot:root});store.create({identity:f.identity,source:f.sources,question:'净销售额和增长率'});const lease=store.begin(f.identity.task_id);
  store.saveFramework(lease,{version:'1.0',identity:f.identity,origin:'MODEL_PROPOSAL',plan:f.plan});
  const numeric_report=compileNumericReport(JSON.stringify(document()),f.evidence,{identity:f.identity,sources:f.sources});
  const value={version:'1.0' as const,outcome_id:randomUUID(),identity:f.identity,framework:f.plan,calculation:f.calculation,verification:f.evidence.verified_calculations[0]!.verification,explanation:{kind:'MODEL_EXPLANATION' as const,text:numeric_report.text},human_judgment:'not_recorded' as const,numeric_report};
  store.saveOutcome(lease,value);
  const reopened=createLocalOpenAnalysisStore({projectRoot:root}).read(f.identity.task_id)!;
  assert.deepEqual((reopened.outcome as any).numeric_report,numeric_report);assert.match(reopened.outcome!.explanation.text,/44\.19%/);
  assert.deepEqual(createLocalOpenAnalysisStore({projectRoot:root}).read(f.identity.task_id),reopened,'passive reopening is a pure read');
 }finally{rmSync(root,{recursive:true,force:true});}
});

test('NR02: stored payload cannot change a value, scope, source identity, formula or rendered explanation',()=>{
 const f=fixture(),context={identity:f.identity,sources:f.sources},valid=compileNumericReport(JSON.stringify(document()),f.evidence,context);
 for(const change of [(x:any)=>x.values[0].value='999',(x:any)=>x.values[0].scope='wrong period',(x:any)=>x.identity.revision='2',(x:any)=>x.values.at(-1).expression.right.reference='F2',(x:any)=>x.text='净额999元']){
  const bad=structuredClone(valid);change(bad);assert.throws(()=>validateNumericReport(bad,f.evidence,context),{code:'NUMERIC_REPORT_CHANGED'});
 }
});

test('NR01/03: independent refund and inverse formula paths detect deliberate primary errors',()=>{
 const f=fixture();
 for(const bad of [{...f.calculation,value:'999'},{...f.calculation,groups:f.calculation.groups!.map((g,i)=>({...g,value:i?'650':'450'}))},{...f.calculation,unit:'万元'}])assert.throws(()=>verifyOpenAnalysisIntegerSum(f.plan,bad,f.sources),{code:'VERIFICATION_FAILED'});
 for(const op of ['add','subtract','multiply','divide'])assert.equal(verifyNumericOperation(op,{n:620n,d:1n},{n:430n,d:1n},{n:999n,d:1n}),false,'same wrong output must not be accepted merely because primary supplied it');
});

test('NR01/02/03/09: actual Application consumes IR, then no-tool report payload is bound and saved',async()=>{
 const f=fixture(),saved:any[]=[],observed:string[]=[];
 const app=createOpenAnalysisApplication({agentLed:true,reviewReport:true,numericReport:true,runtime:{run:async input=>{
  if(input.purpose==='report_edit'){
   observed.push('report');assert.equal(input.tools.length,0);assert.match(input.system,/1\.5/);assert.match(input.prompt,/numeric_facts/);assert.match(input.prompt,/comparison_facts/);
   return {text:JSON.stringify(currentDocument()),tools:[]};
  }
  await input.tools.find(t=>t.name==='calculate_and_verify')!.execute({plan:openAnalysisProposal(f.plan)},input.signal);
  observed.push('calculated');return {text:'未经核验的草稿',tools:[]};
 }},loadSelectedSource:async()=>f.sources,isAuthorized:()=>true,saveFramework:async frame=>({saved:true,...frame.identity}),verify:verifyOpenAnalysisIntegerSum,saveVerifiedStep:async step=>({saved:true,step_id:step.step_id,...step.identity}),saveOutcome:async value=>{saved.push(value);return {saved:true,outcome_id:value.outcome_id,...value.identity};}} as any);
 await app.run({identity:f.identity,question:'净销售额按期间比较',signal:new AbortController().signal});
 assert.deepEqual(observed,['calculated','report']);assert.equal(saved.length,1);assert.equal(saved[0].numeric_report.status,'complete');assert.match(saved[0].explanation.text,/44\.19%/);assert.deepEqual(saved[0].numeric_report.identity,f.identity);
});


test('NR04: explicit 元／万元 and ratio scaling are compatible, currencies cannot be invented',()=>{
 const f=fixture(),context={identity:f.identity,sources:f.sources};
 const facts=numericReportFacts(f.evidence,context);const altered={...f.evidence,verified_calculations:f.evidence.verified_calculations.map((v:any)=>{const p=compileOpenAnalysisIR({...openAnalysisProposal(v.execution_plan),unit:'万元'},f.sources),c={...v.calculation,unit:'万元',plan_sha256:taskHash(p)};return {execution_plan:p,calculation:c,verification:{...v.verification,plan_sha256:taskHash(p),result_sha256:taskHash(c)}};})};
 const x=compileNumericReport(JSON.stringify(document()),altered,context);assert.equal(x.values.find(v=>v.id==='D1')?.value,'1900000');assert.equal(x.values.find(v=>v.id==='D1')?.unit,'元');assert.equal(x.values.find(v=>v.id==='D2')?.display,'44.19%');
 const d:any=document();d.derivations.push({id:'D3',label:'增长率的比例组合',expression:{op:'multiply',left:ref('D2'),right:ref('D1')},format:'number',decimals:2});assert.equal(compileNumericReport(JSON.stringify(d),f.evidence,context).values.find(v=>v.id==='D3')?.status,'verified');
 const n=fixture('-500'),neg=compileNumericReport(JSON.stringify(document()),n.evidence,{identity:n.identity,sources:n.sources});assert.match(neg.text,/分母为负/);
});

test('NR01/09: malformed model source reference gets actionable field diagnostics within existing one-correction bound',async()=>{
 const f=fixture();let feedback:any;
 const app=createOpenAnalysisApplication({agentLed:true,loadSelectedSource:async()=>f.sources,isAuthorized:()=>true,runtime:{run:async input=>{
  feedback=await input.tools.find(t=>t.name==='interpret_meaning')!.execute({interpretations:[{dimension:'population',value:'全部订单',status:'clear',evidence:[{source:{source_id:f.sources.sources[0]!.source_id,row:2,column:'A'}}]}],conflicts:[]},input.signal);
  return {text:'保留参数错误',tools:[]};
 }}} as any);
 await app.run({identity:f.identity,question:'净销售额',signal:new AbortController().signal}).catch(()=>{});
 assert.equal(feedback?.status,'needs_semantic_correction');assert.deepEqual(feedback.invalid_fields,[{dimension:'population',evidence_index:0,missing:['sheet_id']}]);assert.equal(feedback.remaining_corrections,1);
});

test('NR01/06: task-wide declared scope permits supplementary refund calculation; a genuinely restricted order scope still blocks it',async()=>{
 const {compileOpenAnalysisContext}=await import('../../../packages/product-core/open-analysis-context.ts');const {assertOpenExecutionEvolution}=await import('../../../packages/product-core/open-analysis-evolution.ts');
 const f=fixture(),raw:any=openAnalysisProposal(f.plan);raw.inputs[0].filters=[{column:'B',operator:'eq',value:'2026-01'}];
 const business={classification:'MODEL_PROPOSAL' as const,purpose:'两期经营报告',object:'净销售额',scope:'全部授权订单退款',deliverables:['两期净额和退款合计'],hypotheses:[],unknowns:[],execution_scope:f.sources.sources.map(s=>({source_id:s.source_id,sheet_id:s.sheets[0]!.sheet_id,filters:[]}))};
 const question='核算两期订单退款净额';const basisContext=compileOpenAnalysisContext(raw,question,f.sources,business),basisPlan=compileOpenAnalysisIR(basisContext.proposal.plan,f.sources),basis={version:'1.0' as const,identity:f.identity,origin:'MODEL_PROPOSAL' as const,context:basisContext,plan:basisPlan};
 const refunds=f.sources.sources[1]!,targetRaw={version:'1.1',goal:'授权全部退款合计',source_id:refunds.source_id,sheet_id:refunds.sheets[0]!.sheet_id,operation:'sum',column:'C',group_by:null,filters:[],unit:'元'},context=compileOpenAnalysisContext(targetRaw,question,f.sources,business),target={...basis,context,plan:compileOpenAnalysisIR(context.proposal.plan,f.sources)};
 assert.doesNotThrow(()=>assertOpenExecutionEvolution(basis,basis,target));
 const narrow={...business,execution_scope:business.execution_scope.map((x,i)=>({...x,filters:i?[]:[{column:'B',operator:'eq' as const,value:'2026-01'}]}))};const limitedContext=compileOpenAnalysisContext(raw,question,f.sources,narrow),limited={...basis,context:limitedContext,plan:compileOpenAnalysisIR(limitedContext.proposal.plan,f.sources)},narrowTarget={...target,context:compileOpenAnalysisContext(targetRaw,question,f.sources,narrow)};
 assert.throws(()=>assertOpenExecutionEvolution(limited,limited,narrowTarget),{code:'FRAMEWORK_REVISION_REQUIRED'});
});

test('NR07/FM-03: a settled supplementary exploration failure retains checked facts and cannot receive a third execution',async()=>{
 const f=fixture();let executions=0;const responses:any[]=[],saved:any[]=[];
 const app=createOpenAnalysisApplication({agentLed:true,reviewReport:true,numericReport:true,loadSelectedSource:async()=>f.sources,isAuthorized:()=>true,verify:verifyOpenAnalysisIntegerSum,
  saveFramework:async frame=>({saved:true,...frame.identity}),saveExploration:async value=>({saved:true,...value.identity}),saveVerifiedStep:async step=>({saved:true,step_id:step.step_id,...step.identity}),saveOutcome:async value=>{saved.push(value);return {saved:true,outcome_id:value.outcome_id,...value.identity};},
  executeCode:Object.assign(async()=>{throw Error('unused');},{explore:async()=>{executions++;throw Object.assign(Error('failed'),{code:'PREPARATION_EXECUTION_FAILED',physical_status:'settled'});}}),
  runtime:{run:async input=>{
   if(input.purpose==='report_edit')return {text:JSON.stringify(currentDocument()),tools:[]};
   const tool=(name:string)=>input.tools.find(t=>t.name===name)!;
   await tool('calculate_and_verify').execute({plan:openAnalysisProposal(f.plan)},input.signal);
   responses.push(await tool('explore_with_python').execute({goal:'补充探索',bindings:f.sources.sources.map(s=>({source_id:s.source_id,sheet_id:s.sheets[0]!.sheet_id,columns:s.sheets[0]!.rows[0]!.cells.map(c=>c.column),filters:[]})),code:'pass'},input.signal));
   responses.push(await tool('correct_exploration_code').execute({code:'pass'},input.signal));
   responses.push(await tool('explore_with_python').execute({goal:'补充探索',bindings:f.sources.sources.map(s=>({source_id:s.source_id,sheet_id:s.sheets[0]!.sheet_id,columns:s.sheets[0]!.rows[0]!.cells.map(c=>c.column),filters:[]})),code:'pass'},input.signal));
   return {text:'保留核验事实',tools:[]};
  }}
 } as any);
 await app.run({identity:f.identity,question:'比较期间净额',signal:new AbortController().signal});
 assert.equal(executions,2);assert.equal(responses[1].status,'failed');assert.equal(responses[2].status,'failed');assert.equal(responses[1].verification,'not_performed');assert.match(saved[0].explanation.text,/探索.*失败/);assert.match(saved[0].explanation.text,/430/);
});

test('NU02/NR01: net evidence exposes real slice operands without calling repeated primary execution independent verification',()=>{
 const f=fixture(),values=numericReportFacts(f.evidence,{identity:f.identity,sources:f.sources});
 assert.equal((values[1] as any).calculation_trace?.expression,'650 − 30 = 620 元');
 assert.match((values[1] as any).calculation_trace?.limitation,/计算分解.*不是新增独立核验/);
 const changed=fixture('200','200'),v=numericReportFacts(changed.evidence,{identity:changed.identity,sources:changed.sources});assert.equal((v[1] as any).calculation_trace?.expression,'550 − 30 = 520 元');
});

 test('NR06/09: prior numeric bundles without optional decomposition retain exact immutable readback',()=>{
 const f=fixture(),original=compileNumericReport(JSON.stringify(document()),f.evidence,{identity:f.identity,sources:f.sources,includeTrace:false});
 assert.deepEqual(validateNumericReport(original,f.evidence,{identity:f.identity,sources:f.sources}),original);
});

test('NR02: source calendar periods support natural Chinese dates without admitting invented amounts or dates',()=>{
 const f=fixture(),d=document();d.interpretations[0].interpretation='2026年1月为{{F1}}，2026年2月为{{F2}}，2月较1月增加{{D1}}，增长率{{D2}}。';
 const context={identity:f.identity,sources:f.sources};assert.equal(compileNumericReport(JSON.stringify(d),f.evidence,context).status,'complete');
 d.interpretations[0].interpretation='2027年1月为{{F1}}，销售额99元。';assert.equal(compileNumericReport(JSON.stringify(d),f.evidence,context).status,'partial');
});


test('NR01/R1-SCOPE: autonomous first binding requires Agent-declared whole scope, without freezing a child slice',async()=>{
 const f=fixture();let frames=0;const app=createOpenAnalysisApplication({agentLed:true,numericReport:true,requireDeclaredCalculations:true,runtime:{run:async input=>{
  const bind=input.tools.find(t=>t.name==='set_joined_framework')!;const raw=openAnalysisProposal(f.plan) as any;const args={goal:raw.goal,unit:raw.unit,numeric_mode:raw.numeric_mode,inputs:raw.inputs.map((i:any)=>({source_id:i.source_id,sheet_id:i.sheet_id,column:i.column,group_by:i.group_by,filters:i.filters})),join:raw.join};
  const missing=await bind.execute(args,input.signal) as any;assert.equal(missing.status,'needs_business_scope');assert.equal(missing.calculation_performed,false);assert.equal(frames,0);assert.equal(missing.next_tool,'describe_business');
  await input.tools.find(t=>t.name==='describe_business')!.execute({purpose:'期间比较',object:'净额',scope:'全部获准订单与退款',deliverables:['各期间净额及比较'],hypotheses:[],unknowns:[],execution_scope:f.sources.sources.map(s=>({source_id:s.source_id,sheet_id:s.sheets[0]!.sheet_id,filters:[]}))},input.signal);
  const bound=await bind.execute(args,input.signal) as any;assert.ok(bound.binding);assert.equal(frames,1);
  await input.tools.find(t=>t.name==='ask_user')!.execute({text:'测试在绑定后有界停住'},input.signal);return {text:'测试等待',tools:[]};
 }},loadSelectedSource:async()=>f.sources,isAuthorized:()=>true,saveFramework:async frame=>{frames++;return {saved:true,...frame.identity};},verify:verifyOpenAnalysisIntegerSum,saveOutcome:async value=>({saved:true,outcome_id:value.outcome_id,...value.identity})} as any);
 await assert.rejects(app.run({identity:f.identity,question:'比较各期间净额',signal:new AbortController().signal}),{code:'INFORMATION_REQUIRED'});assert.equal(frames,1);
});


test('NR02: swapped actual period references and appended false units cannot acquire checked report links',()=>{
 const f=fixture(),doc=document();doc.interpretations[0]!.interpretation='2026年1月{{F2}}，2026年2月{{F1}}。';const swapped=compileNumericReport(JSON.stringify(doc),f.evidence,{identity:f.identity,sources:f.sources});assert.equal(swapped.status,'partial');assert.ok(swapped.issues.some(i=>i.code==='REPORT_SCOPE_CONFLICT'));assert.doesNotMatch(swapped.text,/2026年1月\[620/);
 doc.interpretations[0]!.interpretation='本期{{F2}}万元。';const unit=compileNumericReport(JSON.stringify(doc),f.evidence,{identity:f.identity,sources:f.sources});assert.equal(unit.status,'partial');assert.ok(unit.issues.some(i=>i.code==='NUMERIC_UNIT_CONFLICT'));assert.doesNotMatch(unit.text,/620.*元.*万元/);
});


test('NR02/03: scope guard follows different grouping labels rather than fixed sample periods',()=>{
 const f=fixture(),sources=structuredClone(f.sources);for(const row of sources.sources[0]!.sheets[0]!.rows.slice(1)){const cell=row.cells.find(c=>c.column==='B')!;Reflect.set(cell,'value',cell.value==='2026-01'?'西':'东');}
 const plan=compileOpenAnalysisIR(openAnalysisProposal(f.plan),sources),calculation=executeOpenAnalysisIR(plan,sources),verification=verifyOpenAnalysisIntegerSum(plan,calculation,sources),evidence={verified_calculations:[{execution_plan:plan,calculation,verification}]},context={identity:{...f.identity,scope_sha256:taskHash(sources)},sources};
 const facts=numericReportFacts(evidence,context),west=facts.find(f=>f.scope.endsWith(' · 西'))!,east=facts.find(f=>f.scope.endsWith(' · 东'))!;assert.ok(west);assert.ok(east);const doc=document();doc.interpretations[0]!.interpretation='西{{'+west.id+'}}、东{{'+east.id+'}}。';assert.equal(compileNumericReport(JSON.stringify(doc),evidence,context).status,'complete');doc.interpretations[0]!.interpretation='西{{'+east.id+'}}、东{{'+west.id+'}}。';assert.ok(compileNumericReport(JSON.stringify(doc),evidence,context).issues.some(i=>i.code==='REPORT_SCOPE_CONFLICT'));
});


test('NR09/07: settled exploration failure remains explicit after checkpoint continuation',async()=>{
 const f=fixture(),question='期间净额',saved:any[]=[];const context=compileOpenAnalysisContext(openAnalysisProposal(f.plan),question,f.sources),verification=verifyOpenAnalysisIntegerSum(f.plan,f.calculation,f.sources),key='e'.repeat(64);
 const checkpoint={version:'1.0',turn:3,calculation:f.calculation,verification,messages:[{speaker:'tool',call_id:'first',name:'explore_with_python',failed:false,result:{status:'needs_code_correction',correction_of:key,original_request:{goal:'补充探索'}}},{speaker:'tool',call_id:'correction',name:'correct_exploration_code',failed:false,result:{status:'failed',code:'PREPARATION_EXECUTION_FAILED',verification:'not_performed',remaining_corrections:0}}]};
 const app=createOpenAnalysisApplication({agentLed:true,reviewReport:true,numericReport:true,checkpoint,framework:{version:'1.0',identity:f.identity,origin:'MODEL_PROPOSAL',plan:f.plan,context,execution_mode:'agent_led'},loadSelectedSource:async()=>f.sources,isAuthorized:()=>true,verify:verifyOpenAnalysisIntegerSum,saveFramework:async frame=>({saved:true,...frame.identity}),saveOutcome:async value=>{saved.push(value);return {saved:true,outcome_id:value.outcome_id,...value.identity};},runtime:{run:async i=>({text:i.purpose==='report_edit'?JSON.stringify(currentDocument()):'继续已有事实',tools:[]})}} as any);
 await app.run({identity:f.identity,question,signal:new AbortController().signal});assert.equal(saved.length,1);assert.match(saved[0].explanation.text,/探索及其一次纠正失败/);assert.match(saved[0].explanation.text,/44\.19%/);
});


test('NR02/07: model derivation labels cannot smuggle unchecked amounts or foreign scope',()=>{
 const f=fixture(),context={identity:f.identity,sources:f.sources};for(const label of ['净额差额999999元','全部数字已核验通过']){const doc=document();doc.derivations[0]!.label=label;const checked=compileNumericReport(JSON.stringify(doc),f.evidence,context);assert.equal(checked.status,'partial');assert.equal(checked.values.some(v=>v.id==='D1'),false);assert.doesNotMatch(checked.text,/999999|全部数字已核验通过/);}
 const sources=structuredClone(f.sources);for(const row of sources.sources[0]!.sheets[0]!.rows.slice(1)){const c=row.cells.find(c=>c.column==='B')!;Reflect.set(c,'value',c.value==='2026-01'?'西':'东');}
 const plan=compileOpenAnalysisIR(openAnalysisProposal(f.plan),sources),calculation=executeOpenAnalysisIR(plan,sources),verification=verifyOpenAnalysisIntegerSum(plan,calculation,sources),evidence={verified_calculations:[{execution_plan:plan,calculation,verification}]},ctx={identity:{...f.identity,scope_sha256:taskHash(sources)},sources};const facts=numericReportFacts(evidence,ctx),west=facts.find(v=>v.scope.endsWith(' · 西'))!;const doc=document();doc.derivations=[{id:'D1',label:'东区差额',expression:{op:'subtract',left:ref(west.id),right:ref(west.id)},format:'number',decimals:2}];doc.interpretations=[{references:['D1'],interpretation:'差额{{D1}}。'}];assert.ok(compileNumericReport(JSON.stringify(doc),evidence,ctx).issues.some(i=>i.code==='REPORT_SCOPE_CONFLICT'));
});

test('NR02: syntactic version/list labels and declared existing fact identifiers are not invented quantities',()=>{
 const f=fixture(),doc=document();doc.interpretations[0]!.interpretation='版本1.1\n1. 一月{{F1}}。\n2. 二月{{F2}}。\n比较F2−F1，差额{{D1}}。';const checked=compileNumericReport(JSON.stringify(doc),f.evidence,{identity:f.identity,sources:f.sources});assert.equal(checked.status,'complete');assert.match(checked.text,/版本1\.1/);assert.match(checked.text,/juanerai-number:F2/);
 doc.interpretations[0]!.interpretation='版本1.1，金额999元，数量99件，F999。';const rejected=compileNumericReport(JSON.stringify(doc),f.evidence,{identity:f.identity,sources:f.sources});assert.equal(rejected.status,'partial');assert.doesNotMatch(rejected.text,/金额999|数量99/);
});


test('NR06: successor presentation contract preserves exact saved 1.1 report while applying current guards',()=>{
 const f=fixture(),doc=document();doc.interpretations[0]!.interpretation='版本1.1：一月{{F1}}。';const context={identity:f.identity,sources:f.sources};const old=compileNumericReport(JSON.stringify(doc),f.evidence,{...context,includePresentationCheck:false});assert.equal(old.scope_contract,'1.1');assert.equal(old.status,'partial');const before=JSON.stringify(old);assert.deepEqual(validateNumericReport(old,f.evidence,context),old);assert.equal(JSON.stringify(old),before);const current=compileNumericReport(JSON.stringify(doc),f.evidence,context);assert.equal(current.scope_contract,'2.0');assert.equal(current.status,'complete');assert.notEqual(current.report_sha256,old.report_sha256);
});


test('NU05: downloaded checked percent display carries its percent sign exactly once',()=>{
 const f=fixture(),r=compileNumericReport(JSON.stringify(document()),f.evidence,{sources:f.sources,identity:f.identity});const copy=numericReportCopy(r);assert.match(copy,/44\.19%/);assert.doesNotMatch(copy,/44\.19% %/);assert.match(copy,/190\.00 元/);assert.match(copy,/精确值：/);
});

test('NR07: arithmetic evidence cannot certify causes or business truth in model labels or prose',()=>{
 const f=fixture(),context={identity:f.identity,sources:f.sources};
 for(const claim of ['原因已验证','因果关系已证实','业务定义已核验','资料完整性已证明']){
  const d=document();d.derivations[0]!.label=claim;const r=compileNumericReport(JSON.stringify(d),f.evidence,context);
  assert.equal(r.values.some(v=>v.id==='D1'),false,claim+' must not acquire a verified label');assert.ok(r.issues.some(x=>x.code==='REPORT_UNSUPPORTED_CLAIM'));assert.doesNotMatch(r.text,new RegExp(claim));
  const p=document();p.interpretations[0]!.interpretation=claim+'。';const checked=compileNumericReport(JSON.stringify(p),f.evidence,context);assert.ok(checked.issues.some(x=>x.code==='REPORT_UNSUPPORTED_CLAIM'));assert.doesNotMatch(checked.text,new RegExp(claim));
 }
 for(const text of ['原因尚未验证，需更多资料。','无原因资料，不能证明因果。','原因待分析。']){const d=document();d.interpretations[0]!.interpretation=text;assert.equal(compileNumericReport(JSON.stringify(d),f.evidence,context).status,'complete');}
});

test('NR06: stored 1.2 report stays byte-identical when new reports reject causal certification',()=>{
 const f=fixture(),d=document();d.derivations[0]!.label='原因已验证';const context={identity:f.identity,sources:f.sources};
 const old=compileNumericReport(JSON.stringify(d),f.evidence,{...context,includeClaimCheck:false});assert.equal(old.scope_contract,'1.2');assert.equal(old.values.some(v=>v.id==='D1'),true);
 const bytes=JSON.stringify(old);assert.deepEqual(validateNumericReport(old,f.evidence,context),old);assert.equal(JSON.stringify(old),bytes);
 const current=compileNumericReport(JSON.stringify(d),f.evidence,context);assert.equal(current.scope_contract,'2.0');assert.equal(current.values.some(v=>v.id==='D1'),false);
});

test('NR07: passive and affirmative causal certification cannot bypass numeric-only evidence',()=>{
 const f=fixture(),context={identity:f.identity,sources:f.sources};
 for(const label of ['原因已被验证','因果关系核验通过','原因已经获得独立核验','资料完整性证明成功','业务定义验证通过']){
  const d=document();d.derivations[0]!.label=label;const r=compileNumericReport(JSON.stringify(d),f.evidence,context);assert.equal(r.values.some(v=>v.id==='D1'),false,label);assert.ok(r.issues.some(x=>x.code==='REPORT_UNSUPPORTED_CLAIM'));
  const p=document();p.interpretations[0]!.interpretation=label+'。';assert.ok(compileNumericReport(JSON.stringify(p),f.evidence,context).issues.some(x=>x.code==='REPORT_UNSUPPORTED_CLAIM'));
 }
 for(const text of ['原因未被验证。','原因需要进一步核验。','因果关系尚未核验通过。','不能证明因果。']){const d=document();d.interpretations[0]!.interpretation=text;assert.equal(compileNumericReport(JSON.stringify(d),f.evidence,context).status,'complete',text);}
});

test('NR06: saved 1.3 reports use their frozen claim semantics without historical rewriting',()=>{
 const f=fixture(),d=document();d.derivations[0]!.label='原因已被验证';const context={identity:f.identity,sources:f.sources};
 const old=compileNumericReport(JSON.stringify(d),f.evidence,{...context,includeClaimCheck:'legacy'});assert.equal(old.scope_contract,'1.3');assert.equal(old.values.some(v=>v.id==='D1'),true);const bytes=JSON.stringify(old);assert.deepEqual(validateNumericReport(old,f.evidence,context),old);assert.equal(JSON.stringify(old),bytes);
 const current=compileNumericReport(JSON.stringify(d),f.evidence,context);assert.equal(current.scope_contract,'2.0');assert.equal(current.values.some(v=>v.id==='D1'),false);
});


test('NR07: a negated first certification cannot hide a later affirmative certification',()=>{
 const f=fixture(),context={identity:f.identity,sources:f.sources};
 for(const claim of ['退款原因尚未验证但促销效果的因果关系已被证明','业务定义待核验但资料完整性已验证','原因未验证且业务定义没有验证但因果关系核验通过']){
  const d=document();d.derivations[0]!.label=claim;assert.equal(compileNumericReport(JSON.stringify(d),f.evidence,context).values.some(v=>v.id==='D1'),false,claim);
  const p=document();p.interpretations[0]!.interpretation=claim+'。';assert.ok(compileNumericReport(JSON.stringify(p),f.evidence,context).issues.some(x=>x.code==='REPORT_UNSUPPORTED_CLAIM'));
 }
 const d=document();d.interpretations[0]!.interpretation='退款原因尚未验证且因果关系需要进一步核验。';assert.equal(compileNumericReport(JSON.stringify(d),f.evidence,context).status,'complete');
});


test('NR06: saved single-match 1.4 claim behavior reads back without rewriting historical reports',()=>{
 const f=fixture(),context={identity:f.identity,sources:f.sources},d=document();d.derivations[0]!.label='退款原因尚未验证但促销效果的因果关系已被证明';
 const old=compileNumericReport(JSON.stringify(d),f.evidence,{...context,includeClaimCheck:'single'});assert.equal(old.scope_contract,'1.4');assert.equal(old.values.some(v=>v.id==='D1'),true);const bytes=JSON.stringify(old);assert.deepEqual(validateNumericReport(old,f.evidence,context),old);assert.equal(JSON.stringify(old),bytes);
 const current=compileNumericReport(JSON.stringify(d),f.evidence,context);assert.equal(current.scope_contract,'2.0');assert.equal(current.values.some(v=>v.id==='D1'),false);
});

test('NR07/VC-09: negation before certification subject is a limitation, not a positive claim',()=>{
 const f=fixture(),context={identity:f.identity,sources:f.sources};
 for(const text of ['贡献占比不是原因证明，变化动因需更多资料。','算术一致并非因果关系证明。','数字相等不构成业务定义验证。','当前结果不代表资料完整性证明。']){const d=document();d.interpretations[0]!.interpretation=text;assert.equal(compileNumericReport(JSON.stringify(d),f.evidence,context).status,'complete',text);}
 for(const text of ['不是原因证明但因果关系已证明。','并非业务定义验证但资料完整性已证实。']){const d=document();d.interpretations[0]!.interpretation=text;assert.equal(compileNumericReport(JSON.stringify(d),f.evidence,context).status,'partial',text);}
});

test('NR06: stored 1.7 rejected subject-negation remains byte-identical after new 1.8 correction',()=>{
 const f=fixture(),context={identity:f.identity,sources:f.sources},d=document();d.interpretations[0]!.interpretation='贡献占比不是原因证明。';
 const old=compileNumericReport(JSON.stringify(d),f.evidence,{...context,includeNegatedSubjects:false});assert.equal(old.scope_contract,'1.7');assert.equal(old.status,'partial');const bytes=JSON.stringify(old);assert.deepEqual(validateNumericReport(old,f.evidence,context),old);assert.equal(JSON.stringify(old),bytes);
 const current=compileNumericReport(JSON.stringify(d),f.evidence,context);assert.equal(current.scope_contract,'2.0');assert.equal(current.status,'complete');
});

test('VC-09/NR07: modified-subject negative certification does not certify a later positive claim',()=>{
 const f=fixture(),context={identity:f.identity,sources:f.sources};
 for(const text of ['贡献占比不构成对变化原因的证明。','本项不是对当前业务定义的验证。','数字相等并非对全部资料完整性的证明。']){const d=document();d.interpretations[0]!.interpretation=text;assert.equal(compileNumericReport(JSON.stringify(d),f.evidence,context).status,'complete',text);}
 for(const text of ['不构成对变化原因的证明但因果关系已经证明。','不是对当前业务定义的验证但资料完整性已证实。','并非对全部资料完整性的证明且业务定义已被核验。']){const d=document();d.interpretations[0]!.interpretation=text;assert.equal(compileNumericReport(JSON.stringify(d),f.evidence,context).status,'partial',text);}
});

test('VC-10/12: report adapter supplies the actual checked arithmetic trace without raw sources or draft',async()=>{
 const {reportEditModelPrompt,reportEditMarker}=await import('../../../packages/product-core/open-analysis-report-review.ts');const f=fixture();
 const body=JSON.parse(reportEditModelPrompt(reportEditMarker+JSON.stringify({version:'1.0',output_contract:'1.3',identity:f.identity,question:'比较净额',draft:'原准备状态及错误解读',evidence:f.evidence,sources:f.sources})).slice(reportEditMarker.length));
 const expected=numericReportFacts(f.evidence,{identity:f.identity,sources:f.sources});assert.ok(expected.some(x=>x.calculation_trace));
 assert.deepEqual(body.numeric_facts.map((x:any)=>x.calculation_trace),expected.map(x=>x.calculation_trace));assert.equal(body.sources,undefined);assert.equal(body.draft,undefined);assert.doesNotMatch(JSON.stringify(body),/原准备状态及错误解读/);
});

test('AC118: report producer distinguishes equal-valued current facts by actual group coordinates',async()=>{
 const {reportEditModelPrompt,reportEditMarker}=await import('../../../packages/product-core/open-analysis-report-review.ts');
 const f=fixture('100','110');
 const body=JSON.parse(reportEditModelPrompt(reportEditMarker+JSON.stringify({version:'1.0',output_contract:'1.3',identity:f.identity,question:'比较净额',draft:'不得作为依据的旧草稿',evidence:f.evidence,sources:f.sources})).slice(reportEditMarker.length));
 assert.equal(body.numeric_facts[0].value,body.numeric_facts[1].value);
 assert.deepEqual(body.numeric_facts.map((x:any)=>x.scope_context),[
  {group_field:'订单.csv／CSV／期间',group_value:'2026-01',filters:[]},
  {group_field:'订单.csv／CSV／期间',group_value:'2026-02',filters:[]}
 ]);
 assert.deepEqual(body.numeric_facts.map((x:any)=>x.reference_id),['F1','F2']);
 assert.equal(body.sources,undefined);assert.equal(body.draft,undefined);assert.equal(body.evidence,undefined);
 assert.doesNotMatch(JSON.stringify(body),/不得作为依据的旧草稿|O1|O4/);
});

test('AC118: report coordinates follow actual non-period groups and explicit source filters',async()=>{
 const {reportEditModelPrompt,reportEditMarker}=await import('../../../packages/product-core/open-analysis-report-review.ts');
 const f=fixture(),sources=structuredClone(f.sources);
 sources.sources[0]!.sheets[0]!.rows[0]!.cells[1]!.value='渠道';
 for(const row of sources.sources[0]!.sheets[0]!.rows.slice(1))row.cells[1]!.value=row.cells[1]!.value==='2026-01'?'门店':'线上';
 const raw=openAnalysisProposal(f.plan) as any;raw.inputs[0].filters=[{column:'B',operator:'eq',value:'线上'}];
 const plan=compileOpenAnalysisIR(raw,sources),calculation=executeOpenAnalysisIR(plan,sources),verification=verifyOpenAnalysisIntegerSum(plan,calculation,sources);
 const identity={...f.identity,scope_sha256:taskHash(sources)},evidence={verified_calculations:[{execution_plan:plan,calculation,verification}]};
 const body=JSON.parse(reportEditModelPrompt(reportEditMarker+JSON.stringify({version:'1.0',output_contract:'1.3',identity,question:'渠道净额',draft:'历史错误文字',evidence,sources})).slice(reportEditMarker.length));
 assert.deepEqual(body.numeric_facts[0].scope_context,{group_field:'订单.csv／CSV／渠道',group_value:'线上',filters:[{field:'订单.csv／CSV／渠道',operator:'eq',value:'线上'}]});
 assert.equal(body.numeric_facts.length,1);assert.doesNotMatch(JSON.stringify(body),/历史错误文字|2026-01/);
 assert.throws(()=>reportEditModelPrompt(reportEditMarker+JSON.stringify({version:'1.0',output_contract:'1.3',identity:{...identity,scope_sha256:'f'.repeat(64)},question:'渠道净额',draft:'',evidence,sources})),{code:'SOURCE_CHANGED'});
});

test('NR06: saved 1.8 modified-subject rejection retains the original partial report bytes',()=>{
 const f=fixture(),context={identity:f.identity,sources:f.sources},d=document();d.interpretations[0]!.interpretation='贡献占比不构成对变化原因的证明。';
 const old=compileNumericReport(JSON.stringify(d),f.evidence,{...context,includeModifiedSubjects:false} as any);assert.equal(old.scope_contract,'1.8');assert.equal(old.status,'partial');const bytes=JSON.stringify(old);assert.deepEqual(validateNumericReport(old,f.evidence,context),old);assert.equal(JSON.stringify(old),bytes);
 const current=compileNumericReport(JSON.stringify(d),f.evidence,context);assert.equal(current.scope_contract,'2.0');assert.equal(current.status,'complete');
});

test('VC-10/13: preparation-only required IR cannot masquerade as an adopted or computed new scope',async()=>{
 const f=fixture();let feedback:any;let computed=0;
 const app=createOpenAnalysisApplication({proposalOnly:true,runtime:{run:async (input:import('../../../packages/ports/open-analysis-runtime.ts').OpenAnalysisRun)=>{feedback=await input.tools.find(t=>t.name==='read_analysis_evidence')!.execute({required_plans:[openAnalysisProposal(f.plan)]},input.signal);return {text:'已声明新范围，后台将计算，结果500。',tools:[]};}},loadSelectedSource:async()=>f.sources,isAuthorized:()=>true,verify:()=>{computed++;throw new Error('unexpected calculation');},saveFramework:async()=>{throw new Error('unexpected write');},saveOutcome:async()=>{throw new Error('unexpected write');}} as any);
 await assert.rejects(app.run({identity:f.identity,question:'仅看新范围，准备方案后实际重算',signal:new AbortController().signal}),{code:'ANALYSIS_INCOMPLETE'});
 assert.equal(feedback.status,'needs_candidate_binding');assert.equal(feedback.next_tool,'set_analysis_steps');assert.equal(feedback.calculation_performed,false);assert.equal(computed,0);
});

test('VC-10/13: corrected declaration binds a real adoptable candidate without calculating',async()=>{
 const f=fixture();let feedback:any;
 const app=createOpenAnalysisApplication({proposalOnly:true,runtime:{run:async (input:import('../../../packages/ports/open-analysis-runtime.ts').OpenAnalysisRun)=>{const call=(name:string,args:any)=>input.tools.find(t=>t.name===name)!.execute(args,input.signal);feedback=await call('read_analysis_evidence',{required_plans:[openAnalysisProposal(f.plan)]});await call('set_analysis_steps',{version:'1.0',steps:[{title:'净额候选',depends_on:[],hypotheses:[],required_evidence:['订单和退款金额'],limitations:['原因未核验'],plan:feedback.candidate_plans[0]}]});return {text:'方案已准备，采纳后计算。',tools:[]};}},loadSelectedSource:async()=>f.sources,isAuthorized:()=>true,verify:()=>{throw new Error('unexpected calculation');},saveFramework:async()=>{throw new Error('unexpected write');},saveOutcome:async()=>{throw new Error('unexpected write');}} as any);
 const result=await app.run({identity:f.identity,question:'准备新范围方案',signal:new AbortController().signal});assert.equal(result.state,'proposal');assert.equal(result.state==='proposal'&&result.framework.steps?.steps.length,1);assert.equal(result.state==='proposal'&&result.framework.plan.operation,'sum');assert.equal(feedback.calculation_performed,false);
});


test('VC-10/VU-01: actual bound preparation transfers execution choice to existing adoption without discarding candidate',async()=>{
 const f=fixture();let feedback:any;
 const app=createOpenAnalysisApplication({proposalOnly:true,runtime:{run:async (input:import('../../../packages/ports/open-analysis-runtime.ts').OpenAnalysisRun)=>{const call=(name:string,args:any)=>input.tools.find(t=>t.name===name)!.execute(args,input.signal);await call('set_analysis_steps',{version:'1.0',steps:[{title:'本轮候选',depends_on:[],hypotheses:[],required_evidence:[],limitations:[],plan:openAnalysisProposal(f.plan)}]});feedback=await call('ask_user',{text:'准备好了，是否开始？',purpose:'execution_choice'});return {text:'本轮方案准备好，由当前采纳控件处理执行选择。',tools:[]};}},loadSelectedSource:async()=>f.sources,isAuthorized:()=>true,verify:()=>{throw Error('no calculation');},saveFramework:async()=>{throw Error('no adoption');},saveOutcome:async()=>{throw Error('no output');}} as any);
 const result=await app.run({identity:f.identity,question:'准备本轮新范围',signal:new AbortController().signal});assert.equal(result.state,'proposal');assert.equal(feedback.waiting_for_user,false);assert.equal(feedback.status,'candidate_ready');assert.equal(feedback.calculation_performed,false);
});

test('VC-10/VU-01: execution choice without actual candidate cannot invent readiness; actual business clarification still waits',async()=>{
 const f=fixture();for(const scenario of ['no_candidate','business_question'] as const){
 const app=createOpenAnalysisApplication({proposalOnly:true,runtime:{run:async (input:import('../../../packages/ports/open-analysis-runtime.ts').OpenAnalysisRun)=>{const call=(name:string,args:any)=>input.tools.find(t=>t.name===name)!.execute(args,input.signal);if(scenario==='business_question')await call('set_framework',openAnalysisProposal(f.plan));await call('ask_user',{text:'实际金额属于哪个单位？',purpose:scenario==='no_candidate'?'execution_choice':'business_clarification'});return {text:'等待补充。',tools:[]};}},loadSelectedSource:async()=>f.sources,isAuthorized:()=>true,verify:()=>{throw Error('no calculation');},saveFramework:async()=>{throw Error('no adoption');},saveOutcome:async()=>{throw Error('no output');}} as any);
 const result=await app.run({identity:f.identity,question:'准备本轮新范围',signal:new AbortController().signal});assert.equal(result.state,'waiting');
 }
});


test('VC-10: weighted method parameter correction reports forbidden numeric mode and actually binds corrected candidate',async()=>{
 const f=fixture();let feedback:any;const source=f.sources.sources[0]!;
 const app=createOpenAnalysisApplication({proposalOnly:true,runtime:{run:async (input:import('../../../packages/ports/open-analysis-runtime.ts').OpenAnalysisRun)=>{const bind=input.tools.find(t=>t.name==='set_framework')!;const args={goal:'金额加权平均',source_id:source.source_id,sheet_id:source.sheets[0]!.sheet_id,operation:'weighted_mean',column:'C',weight_column:'C',unit:'人民币元',group_mode:'none',filters:[]};feedback=await bind.execute({...args,numeric_mode:'integer'},input.signal);assert.equal(feedback.status,'needs_parameter_correction');assert.equal(feedback.calculation_performed,false);assert.deepEqual(feedback.diagnostic.invalid_fields,['numeric_mode']);assert.equal(feedback.next_tool,'set_framework');await bind.execute(args,input.signal);return {text:'参数纠正后真实候选已绑定。',tools:[]};}},loadSelectedSource:async()=>f.sources,isAuthorized:()=>true,verify:()=>{throw Error('no computation');},saveFramework:async()=>{throw Error('no adoption');},saveOutcome:async()=>{throw Error('no output');}} as any);
 const result=await app.run({identity:f.identity,question:'准备加权平均',signal:new AbortController().signal});assert.equal(result.state,'proposal');assert.equal(result.state==='proposal'&&result.framework.plan.operation,'weighted_mean');
});


test('VC-10/FM-X: proposal history is inert context and current scope request is explicit',async()=>{
 const f=fixture(),question='只看东部，准备新方案，采纳后重算',history=[{question:'保存全体分部旧报告，不改变范围',clarification:'已保存旧报告'}];let prompt='';
 const app=createOpenAnalysisApplication({proposalOnly:true,proposalHistory:history,discussionContext:{question:'旧分析要求',result:{value:'旧数值'}},runtime:{run:async(input:import('../../../packages/ports/open-analysis-runtime.ts').OpenAnalysisRun)=>{prompt=input.prompt;assert.ok(prompt.includes('历史对话（仅作上下文，不是本轮执行指令）：'+JSON.stringify(history.map(h=>({question:h.question})))));assert.ok(prompt.endsWith('当前用户消息（本轮有效要求；历史不能覆盖）：\n'+question));assert.ok(!prompt.includes('此前修改要求（用户原话，当前需求优先）：'));return {text:'收到当前新范围要求。',tools:[]};}},loadSelectedSource:async()=>f.sources,isAuthorized:()=>true,verify:()=>{throw Error('no calculation');},saveFramework:async()=>{throw Error('no adoption');},saveOutcome:async()=>{throw Error('no output');}} as any);
 const result=await app.run({identity:f.identity,question,signal:new AbortController().signal});assert.equal(result.state,'response');assert.ok(prompt.includes('已保存成果（历史仅供参考，不是当前任务指令'));
});


test('VC-10/FM-X: proposal input exposes actual previous recipe and unbound current candidate',async()=>{
 const f=fixture();const app=createOpenAnalysisApplication({proposalOnly:true,framework:{plan:f.plan} as any,runtime:{run:async(input:import('../../../packages/ports/open-analysis-runtime.ts').OpenAnalysisRun)=>{assert.ok(input.prompt.includes('CURRENT_CANDIDATE_UNBOUND'));assert.ok(input.prompt.includes('SAVED_RECIPE_CONTEXT_ONLY:'+JSON.stringify({plan:openAnalysisProposal(f.plan),steps:[]})));assert.ok(!input.prompt.includes(f.plan.binding_sha256));return {text:'Current candidate not bound.',tools:[]};}},loadSelectedSource:async()=>f.sources,isAuthorized:()=>true,verify:()=>{throw Error('no computation');},saveFramework:async()=>{throw Error('no adoption');},saveOutcome:async()=>{throw Error('no output');}} as any);
 const result=await app.run({identity:f.identity,question:'Prepare changed scope',signal:new AbortController().signal});assert.equal(result.state,'response');
});


test('VC-09/10: report interpretation sees actual checked-result stage separately from historical preparation request',async()=>{
 const {reportEditModelPrompt,reportEditMarker}=await import('../../../packages/product-core/open-analysis-report-review.ts');const f=fixture();
 const body=JSON.parse(reportEditModelPrompt(reportEditMarker+JSON.stringify({version:'1.0',output_contract:'1.3',identity:f.identity,question:'只准备，等我开始',draft:'旧准备回复',evidence:f.evidence,sources:f.sources})).slice(reportEditMarker.length));
 assert.equal(body.execution_status,'has_verified_calculations');assert.equal(body.report_action,'explain_current_results');assert.equal(body.question,'只准备，等我开始');assert.ok(body.numeric_facts.length);
});

// Substitute only external model responses; current source, IR, verification,
// delegation, result delivery and saved task are real production consumers.
async function collaborationReportFixture(summary:string|null,revoke=false){
 const {createLocalCaseAssistantStore}=await import('../../../adapters/storage-local/case-assistant.ts');
 const {createOpenAnalysisCollaborationSource}=await import('../../../adapters/storage-local/open-analysis-collaboration.ts');
 const {createCaseAssistantApplication}=await import('../../../packages/application/case-assistant.ts');
 const {createOpenAnalysisDelegation}=await import('../../../packages/application/open-analysis-delegation.ts');
 const {browserEvidenceRoot}=await import('../../fixtures/xanthil-desktop/browser-evidence.ts');
 const f=fixture(),root=mkdtempSync(join(browserEvidenceRoot,'report-collaboration-'));
 const store=createLocalOpenAnalysisStore({projectRoot:root});store.create({identity:f.identity,source:f.sources,question:'比较净额与资料限制'});const lease=store.begin(f.identity.task_id);
 const bridge=createOpenAnalysisCollaborationSource({project_id:randomUUID(),store,allowQualifiedSteps:true});
 const assistant=createCaseAssistantApplication({store:createLocalCaseAssistantStore({projectRoot:root,openSource:bridge.read,collaborationPolicy:'open_analysis_v13'}),collaborationPolicy:'open_analysis_v13',openTaskIdentity:()=>f.identity,clock:()=>new Date(),config:{provider:'minimax-cn',model:'MiniMax-M3',authorized:true,consumption_policy:'uncapped_metered',runtime_id:'pi',runtime_version:'0.86.1',adapter_version:'1.3',limits:{turns:1,execution_ms:30000,waiting_ms:60000,cost_microunits:1,turn_cost_microunits:1,currency:'USD'}},runtime:{turn:async input=>{
  if(summary===null)throw Object.assign(Error('DEADLINE_EXCEEDED'),{code:'DEADLINE_EXCEEDED'});
  return {provider:'minimax-cn',model:'MiniMax-M3',cost_microunits:null,output:{kind:'result',summary,references:JSON.parse(input.payload).authorized_context.allowed_references,limitations:['模型意见，不是独立核验'],unknowns:['退款原因未知']}};
 }}});
 const delegation=createOpenAnalysisDelegation({store,assistant,source:bridge,project_id:bridge.owner(f.identity.task_id).project_id}).root;
 let projected:any,authorized=true;const observed:any[]=[];
 const app=createOpenAnalysisApplication({agentLed:true,reviewReport:true,numericReport:true,collaboration:delegation,loadSelectedSource:async()=>f.sources,isAuthorized:()=>authorized,verify:verifyOpenAnalysisIntegerSum,saveFramework:async frame=>store.saveFramework(lease,frame),saveVerifiedStep:async step=>store.saveVerifiedStep(lease,step),saveOutcome:async value=>store.saveOutcome(lease,value),runtime:{historyOwnership:'runtime',run:async input=>{
  if(input.purpose==='report_edit'){
   projected=JSON.parse(input.prompt.slice(input.prompt.indexOf('\n')+1));
   assert.ok(Array.isArray(projected.collaboration),'final report must receive current actual collaboration receipts');
   const returned=projected.collaboration.find((r:any)=>r.state==='returned');
   const doc=currentDocument();if(returned)doc.interpretations.push({fact_refs:[],interpretation:returned.summary});
   return {text:JSON.stringify(doc),tools:[]};
  }
  if(input.prompt.includes('GOAL_COMPLETION_REVIEW')){assert.match(input.prompt,/independent_opinions/);return {text:'Actual returned or failed opinion is retained; no replay or new calculation.',tools:[]};}
  await input.tools.find(t=>t.name==='calculate_and_verify')!.execute({plan:openAnalysisProposal(f.plan)},input.signal);
  const material=(await delegation.materials(f.identity))[0]!;
  await delegation.queue(f.identity,{kind:'subagent',task:'PRIVATE_LOCAL_PURPOSE_SENTINEL',material_id:material.material_id,instruction:{action:'check_limitations',reference_paths:['/verification'],completion_reference_paths:['/verification']}});
  await delegation.drain(f.identity,input.signal);observed.push(...await delegation.results(f.identity));if(revoke)authorized=false;
  return {text:'未经核验的根草稿，不可替代真实回执',tools:[]};
 }}});
 try{await app.run({identity:f.identity,question:'比较净额与资料限制',signal:new AbortController().signal});return {projected,observed,saved:store.read(f.identity.task_id)!};}
 finally{await assistant.close();}
}

test('V13-REPORT-COLLAB01 / AS04 AC03/04: actual returned opinion reaches report model and saved explanation without private child purpose',async()=>{
 const x=await collaborationReportFixture('需补充退款原因资料，当前不能判断原因。');
 assert.equal(x.observed.length,1);assert.equal(x.projected.collaboration[0].classification,'MODEL');assert.equal(x.projected.collaboration[0].verification,'not_performed');
 assert.equal(x.projected.collaboration[0].summary,'需补充退款原因资料，当前不能判断原因。');
 assert.equal(JSON.stringify(x.projected).includes('PRIVATE_LOCAL_PURPOSE_SENTINEL'),false);assert.equal(JSON.stringify(x.projected.collaboration).includes('aggregate'),false);
 assert.match(x.saved.outcome!.explanation.text,/需补充退款原因资料/);assert.match(x.saved.outcome!.explanation.text,/430/);
});

test('V13-REPORT-COLLAB01 / AC03: a different actual returned opinion changes report input and preserved explanation',async()=>{
 const x=await collaborationReportFixture('需复核订单关联范围，暂不据此推断原因。');
 assert.equal(x.projected.collaboration[0].summary,'需复核订单关联范围，暂不据此推断原因。');
 assert.match(x.saved.outcome!.explanation.text,/需复核订单关联范围/);assert.doesNotMatch(x.saved.outcome!.explanation.text,/需补充退款原因资料/);
});

test('V13-REPORT-COLLAB01 / AC05/06: actual failed child is not a returned opinion and does not remove verified numeric facts',async()=>{
 const x=await collaborationReportFixture(null);
 assert.equal(x.observed.length,1);assert.equal(x.projected.collaboration[0].state,'Failed');assert.equal(x.projected.collaboration[0].reason,'DEADLINE_EXCEEDED');
 assert.equal(Object.hasOwn(x.projected.collaboration[0],'summary'),false);assert.equal(x.projected.collaboration[0].verification,'not_performed');
 assert.equal(x.saved.outcome!.numeric_report!.values[0]!.value,'430');assert.match(x.saved.outcome!.explanation.text,/620/);
});


test('V13-REPORT-COLLAB01 / AC06: revoked authority prevents final report admission after an actual child return',async()=>{
 await assert.rejects(()=>collaborationReportFixture('真实返回但随后撤权',true),{code:'AUTHORITY_REQUIRED'});
});


test('V13-REPORT-METADATA01 / AC03/05: business report consumes actual opinions without internal identifiers while original receipts remain linked',async()=>{
 const x=await collaborationReportFixture('退款原因未知，保持当前已核验结论并说明限制。');
 const result=x.observed[0].result;assert.ok(result.id);assert.ok(result.child_session_id);
 const projected=JSON.stringify(x.projected);assert.equal(projected.includes(result.id),false);assert.equal(projected.includes(result.child_session_id),false);assert.equal(Object.hasOwn(x.projected,'identity'),false);assert.equal(Object.hasOwn(x.projected,'draft_sha256'),false);
 assert.equal(x.projected.collaboration[0].summary,result.value.summary);assert.match(x.saved.outcome!.explanation.text,/退款原因未知/);assert.equal(x.saved.outcome!.numeric_report!.status,'complete');
});


for(const [field,value,expected] of [
 ['source_id','dddddddd-dddd-4ddd-addd-dddddddddddd','source_id_not_selected'],
 ['sheet_id','absent-sheet','sheet_id_not_selected'],
 ['row',999,'row_not_found'],
 ['column','Z','column_not_found'],
 ['source_sha256','d'.repeat(64),'source_sha256_mismatch']
] as const)test(`V13-REF-FEEDBACK01 actual Application identifies invalid ${field} then accepts explicit current-cell correction`,async()=>{
 const f=fixture(),source=f.sources.sources[0]!,sheet=source.sheets[0]!;let frames=0,checks=0,outputs=0,corrected=false;
 const valid={source_id:source.source_id,sheet_id:sheet.sheet_id,row:2,column:'A'};
 const proposal=(reference:any)=>({interpretations:[{dimension:'population',value:'当前订单记录',status:'clear',evidence:[{source:reference}]}],conflicts:[]});
 const app=createOpenAnalysisApplication({agentLed:true,proposalOnly:true,loadSelectedSource:async()=>f.sources,isAuthorized:()=>true,
 saveFramework:async()=>{frames++;throw Error('not executed');},verify:()=>{checks++;throw Error('not executed');},saveOutcome:async()=>{outputs++;throw Error('not executed');},
 runtime:{run:async input=>{const tool=input.tools.find(t=>t.name==='interpret_meaning')!;const bad={...valid,[field]:value};
 const feedback:any=await tool.execute(proposal(bad),input.signal);assert.equal(feedback.status,'needs_semantic_correction');assert.equal(feedback.remaining_corrections,1);assert.equal(feedback.calculation_performed,false);
 assert.deepEqual(feedback.invalid_fields,[{dimension:'population',evidence_index:0,missing:[expected]}]);assert.deepEqual(bad,{...valid,[field]:value});assert.equal(frames+checks+outputs,0);
 const accepted:any=await tool.execute(proposal(valid),input.signal);assert.equal(accepted.semantics.definitions[0].classification,'SOURCE_INTERPRETED');assert.equal(accepted.semantics.definitions[0].interpretation.evidence[0].source.source_id,source.source_id);corrected=true;
 return {text:'引用已明确，尚未绑定或计算',tools:[]};}}} as any);
 await app.run({identity:f.identity,question:'分析当前选定订单',signal:new AbortController().signal});assert.equal(corrected,true);assert.equal(frames+checks+outputs,0);
});

test('V13-REF-FEEDBACK01 repeated nonexistent source cannot extend correction allowance or calculate',async()=>{
 const f=fixture();let denied=false,checks=0;const app=createOpenAnalysisApplication({agentLed:true,loadSelectedSource:async()=>f.sources,isAuthorized:()=>true,verify:()=>{checks++;throw Error('no calculation');},
 runtime:{run:async input=>{const tool=input.tools.find(t=>t.name==='interpret_meaning')!,args={interpretations:[{dimension:'population',value:'选定订单',status:'clear',evidence:[{source:{source_id:'dddddddd-dddd-4ddd-addd-dddddddddddd',sheet_id:f.sources.sources[0]!.sheets[0]!.sheet_id,row:2,column:'A'}}]}],conflicts:[]};
 const feedback:any=await tool.execute(args,input.signal);assert.equal(feedback.remaining_corrections,1);await assert.rejects(tool.execute(args,input.signal),{code:'SEMANTIC_CORRECTION_EXHAUSTED'});denied=true;return {text:'被拒绝',tools:[]};}}} as any);
 await assert.rejects(app.run({identity:f.identity,question:'分析当前选定订单',signal:new AbortController().signal}),{code:'SEMANTIC_CORRECTION_EXHAUSTED'});assert.equal(denied,true);assert.equal(checks,0);
});

for(const repeatInvalid of [false,true])test(`V13-PREPARE-ARG01: Application preparation without collaboration consumes native structural feedback; repeat=${repeatInvalid}`,async()=>{
 const {createPiSessionOpenAnalysisRuntime}=await import('../../../adapters/agent-pi/native-open-analysis.ts');
 const {createApprovedProviderCredentials}=await import('../../../adapters/agent-pi/provider-credentials.ts');
 const {createLocalAnalysisRequestLedger}=await import('../../../adapters/storage-local/analysis-request-ledger.ts');
 const {browserEvidenceRoot}=await import('../../fixtures/xanthil-desktop/browser-evidence.ts');
 const root=mkdtempSync(join(browserEvidenceRoot,'prepare-argument-feedback-')),f=fixture(),ledger=createLocalAnalysisRequestLedger({projectRoot:root});let calls=0,observed=false;
 const correct={purpose:'核对净额',object:'当前已选订单与退款',scope:'选定资料',deliverables:['准备分析方案'],hypotheses:[],unknowns:[]};
 const runtime=createPiSessionOpenAnalysisRuntime({projectRoot:root,ledger,credentials:createApprovedProviderCredentials({environment:{}}),modelTransport:async request=>{
  calls++;
  if(calls===2){const text=request.messages.filter(m=>m.role==='tool').at(-1)?.text??'';const feedback=JSON.parse(text);assert.equal(feedback.status,'invalid_arguments');assert.equal(feedback.executed,false);assert.equal(feedback.remaining_corrections,1);assert.equal(feedback.issues[0].keyword,'valid_json');assert.equal(text.includes('PRIVATE_PARSER_FRAGMENT'),false);observed=true;}
  if(calls===3)return {content:[{kind:'text',text:'已明确需求；尚未提交计算方案。'}],stop:'complete',usage:{inputTokens:4,outputTokens:2}};
  return {content:[{kind:'tool',id:'prepare-argument-'+calls,name:'analysis_tool',arguments:{name:'describe_business',arguments_json:calls===1||repeatInvalid?'\u007b"purpose":"PRIVATE_PARSER_FRAGMENT"':JSON.stringify(correct)}}],stop:'tools',usage:{inputTokens:4,outputTokens:2}};
 }});
 const app=createOpenAnalysisApplication({proposalOnly:true,runtime,loadSelectedSource:async()=>f.sources,isAuthorized:()=>true,verify:()=>{throw Error('preparation cannot calculate');},saveFramework:async()=>{throw Error('preparation cannot adopt');},saveOutcome:async()=>{throw Error('preparation cannot save result');}});
 const run=app.run({identity:f.identity,question:'先准备净额分析需求',signal:new AbortController().signal});
 if(repeatInvalid)await assert.rejects(run,{code:'TOOL_FAILED'});else assert.equal((await run).state,'response');
 assert.equal(observed,true);assert.equal(calls,repeatInvalid?2:3);assert.equal(ledger.read(f.identity.task_id).length,calls);assert.equal(ledger.pending().length,0);assert.ok(ledger.read(f.identity.task_id).every(r=>r.status==='succeeded'));
});

for(const mode of ['current','unknown','mixed','changed-context','previous-run'])test(`V13-PREPARE-REF01: actual candidate reference binding is source/context/run scoped (${mode})`,async()=>{
 const f=fixture();let reference='',calculations=0,saves=0;const phases:unknown[]=[];
 const metadata={title:'净额核对',depends_on:[],hypotheses:[],required_evidence:['当前订单与关联退款'],limitations:['资料没有退款原因']};
 const make=(oldReference=false)=>createOpenAnalysisApplication({proposalOnly:true,runtime:{run:async input=>{
  const tool=(name:string)=>{const t=input.tools.find(t=>t.name===name);assert.ok(t);return t;};
  if(!oldReference){const feedback:any=await tool('read_analysis_evidence').execute({required_plans:[openAnalysisProposal(f.plan)]},input.signal);phases.push(feedback);assert.equal(feedback.calculation_performed,false);assert.equal(feedback.framework_saved,false);reference=feedback.candidate_refs?.[0]?.plan_ref;assert.equal(typeof reference,'string','validated candidates need exact run-local plan references');assert.deepEqual(feedback.candidate_plans,[openAnalysisProposal(compileOpenAnalysisIR(feedback.candidate_plans[0],f.sources))]);}
  if(mode==='changed-context')await tool('describe_business').execute({purpose:'改变后的调查目的',object:'仍是选定资料',scope:'仍为当前选定资料',deliverables:['新目的'],hypotheses:[],unknowns:[]},input.signal);
  const node={...metadata,plan_ref:mode==='unknown'?'candidate:999':reference,...(mode==='mixed'?{plan:openAnalysisProposal(f.plan)}:{})};
  const bound:any=await tool('set_analysis_steps').execute({version:'1.0',steps:[node]},input.signal);phases.push(bound);if(oldReference||mode==='changed-context'){assert.equal(bound.status,'needs_current_candidate');assert.equal(bound.calculation_performed,false);assert.equal(bound.framework_saved,false);await tool('set_analysis_steps').execute({version:'1.0',steps:[node]},input.signal);assert.fail('repeated old reference accepted');}return {text:'已准备净额方案，等待开始。',tools:[]};
 }},loadSelectedSource:async()=>f.sources,isAuthorized:()=>true,verify:()=>{calculations++;throw Error('no calculation during preparation');},saveFramework:async()=>{saves++;throw Error('no adoption during preparation');},saveOutcome:async()=>{saves++;throw Error('no report during preparation');}});
 const args={identity:f.identity,question:'先准备当前净额分析',signal:new AbortController().signal};
 if(mode==='current'||mode==='previous-run'){
  const result=await make().run(args);assert.equal(result.state,'proposal');if(result.state==='proposal'){assert.equal(executeOpenAnalysisIR(result.framework.plan,f.sources).value,f.calculation.value);assert.equal(JSON.stringify(result.framework).includes('plan_ref'),false,'persistent candidate carries actual bound IR');}
  if(mode==='previous-run')await assert.rejects(make(true).run(args),{code:'CANDIDATE_REFERENCE_INVALID'});
 }else await assert.rejects(make().run(args),{code:'CANDIDATE_REFERENCE_INVALID'});
 assert.equal(calculations,0);assert.equal(saves,0);
});

test('V13-PREPARE-REF02: installed native SDK model consumes actual candidate reference and binds real IR without serializing it again',async()=>{
 const {createPiSessionOpenAnalysisRuntime}=await import('../../../adapters/agent-pi/native-open-analysis.ts');const {createApprovedProviderCredentials}=await import('../../../adapters/agent-pi/provider-credentials.ts');const {createLocalAnalysisRequestLedger}=await import('../../../adapters/storage-local/analysis-request-ledger.ts');const {browserEvidenceRoot}=await import('../../fixtures/xanthil-desktop/browser-evidence.ts');
 const f=fixture(),root=mkdtempSync(join(browserEvidenceRoot,'prepare-native-ref-')),ledger=createLocalAnalysisRequestLedger({projectRoot:root});let calls=0,observed=false;
 const runtime=createPiSessionOpenAnalysisRuntime({projectRoot:root,ledger,credentials:createApprovedProviderCredentials({environment:{}}),modelTransport:async request=>{
  calls++;if(calls===3)return {content:[{kind:'text',text:'已准备当前净额方案，等待开始。'}],stop:'complete',usage:{inputTokens:4,outputTokens:2}};
  let name='read_analysis_evidence',args:object={required_plans:[openAnalysisProposal(f.plan)]};
  if(calls===2){const receipt=JSON.parse(request.messages.filter(m=>m.role==='tool').at(-1)!.text);assert.equal(receipt.calculation_performed,false);assert.equal(receipt.framework_saved,false);assert.match(receipt.candidate_refs[0].plan_ref,/^candidate:/);observed=true;name='set_analysis_steps';args={version:'1.0',steps:[{title:'净额核算',depends_on:[],hypotheses:[],required_evidence:['实际订单与关联退款'],limitations:['不推断退款原因'],plan_ref:receipt.candidate_refs[0].plan_ref}]};assert.equal(JSON.stringify(args).includes(f.sources.sources[0].source_id),false);assert.ok(JSON.stringify(args).length<JSON.stringify(openAnalysisProposal(f.plan)).length);}
  return {content:[{kind:'tool',id:'native-plan-ref-'+calls,name:'analysis_tool',arguments:{name,arguments_json:JSON.stringify(args)}}],stop:'tools',usage:{inputTokens:4,outputTokens:2}};
 }});
 const app=createOpenAnalysisApplication({proposalOnly:true,runtime,loadSelectedSource:async()=>f.sources,isAuthorized:()=>true,verify:()=>{throw Error('no preparation calculation');},saveFramework:async()=>{throw Error('no preparation adoption');},saveOutcome:async()=>{throw Error('no preparation report');}});
 const result=await app.run({identity:f.identity,question:'先准备当前净额分析',signal:new AbortController().signal});assert.equal(result.state,'proposal');assert.equal(observed,true);assert.equal(calls,3);assert.equal(ledger.read(f.identity.task_id).length,3);assert.equal(ledger.pending().length,0);assert.ok(ledger.read(f.identity.task_id).every(r=>r.status==='succeeded'));if(result.state==='proposal')assert.equal(executeOpenAnalysisIR(result.framework.plan,f.sources).value,f.calculation.value);
});

test('V13-NATIVE-OBJECT01 / V13-PREPARE-REF02: installed native SDK model consumes actual candidate reference and binds real IR without serializing it again',async()=>{
 const {createPiSessionOpenAnalysisRuntime}=await import('../../../adapters/agent-pi/native-open-analysis.ts');const {createApprovedProviderCredentials}=await import('../../../adapters/agent-pi/provider-credentials.ts');const {createLocalAnalysisRequestLedger}=await import('../../../adapters/storage-local/analysis-request-ledger.ts');const {browserEvidenceRoot}=await import('../../fixtures/xanthil-desktop/browser-evidence.ts');
 const f=fixture(),root=mkdtempSync(join(browserEvidenceRoot,'prepare-native-ref-')),ledger=createLocalAnalysisRequestLedger({projectRoot:root});let calls=0,observed=false;
 const runtime=createPiSessionOpenAnalysisRuntime({projectRoot:root,ledger,nativeObjectArguments:true,credentials:createApprovedProviderCredentials({environment:{}}),modelTransport:async request=>{
  calls++;assert.ok(request.messages.flatMap(m=>m.tools??[]).every(t=>t.name!=='analysis_tool'));if(calls===3)return {content:[{kind:'text',text:'已准备当前净额方案，等待开始。'}],stop:'complete',usage:{inputTokens:4,outputTokens:2}};
  let name='read_analysis_evidence',args:object={required_plans:[openAnalysisProposal(f.plan)]};
  if(calls===2){const receipt=JSON.parse(request.messages.filter(m=>m.role==='tool').at(-1)!.text);assert.equal(receipt.calculation_performed,false);assert.equal(receipt.framework_saved,false);assert.match(receipt.candidate_refs[0].plan_ref,/^candidate:/);observed=true;name='set_analysis_steps';args={version:'1.0',steps:[{title:'净额核算',depends_on:[],hypotheses:[],required_evidence:['实际订单与关联退款'],limitations:['不推断退款原因'],plan_ref:receipt.candidate_refs[0].plan_ref}]};assert.equal(JSON.stringify(args).includes(f.sources.sources[0].source_id),false);assert.ok(JSON.stringify(args).length<JSON.stringify(openAnalysisProposal(f.plan)).length);}
  return {content:[{kind:'tool',id:'native-plan-ref-'+calls,name,arguments:args}],stop:'tools',usage:{inputTokens:4,outputTokens:2}};
 }});
 const app=createOpenAnalysisApplication({proposalOnly:true,runtime,loadSelectedSource:async()=>f.sources,isAuthorized:()=>true,verify:()=>{throw Error('no preparation calculation');},saveFramework:async()=>{throw Error('no preparation adoption');},saveOutcome:async()=>{throw Error('no preparation report');}});
 const result=await app.run({identity:f.identity,question:'先准备当前净额分析',signal:new AbortController().signal});assert.equal(result.state,'proposal');assert.equal(observed,true);assert.equal(calls,3);assert.equal(ledger.read(f.identity.task_id).length,3);assert.equal(ledger.pending().length,0);assert.ok(ledger.read(f.identity.task_id).every(r=>r.status==='succeeded'));if(result.state==='proposal')assert.equal(executeOpenAnalysisIR(result.framework.plan,f.sources).value,f.calculation.value);
});

test('V13-PLAN-VARIANT080: current reference changes real grouping/filter scope without recopying join IR',async()=>{
 const f=fixture();let observed=false,calculations=0;
 const app=createOpenAnalysisApplication({agentLed:true,framework:{plan:f.plan} as any,loadSelectedSource:async()=>f.sources,isAuthorized:()=>true,verify:(...args:any[])=>{calculations++;return verifyOpenAnalysisIntegerSum(...args as Parameters<typeof verifyOpenAnalysisIntegerSum>);},saveFramework:async frame=>({saved:true,...frame.identity}),saveVerifiedStep:async value=>({saved:true,...value.identity,step_id:value.step_id}),saveOutcome:async value=>({saved:true,...value.identity,outcome_id:value.outcome_id}),runtime:{run:async input=>{
  const tool=input.tools.find(t=>t.name==='read_analysis_evidence')!;const before:any=await tool.execute({},input.signal);assert.match(before.current_plan_ref,/^[a-f0-9]{64}$/);
  const result:any=await tool.execute({required_variants:[{base_plan_ref:before.current_plan_ref,goal:'全期净额',changes:[{input_index:0,group_by:null}]},{base_plan_ref:before.current_plan_ref,goal:'一月净额',changes:[{input_index:0,group_by:null,filters:[{column:'B',operator:'eq',value:'2026-01'}]}]}]},input.signal);
  assert.equal(result.required_calculations.length,2);assert.equal(calculations,0);
  for(const [index,item] of result.required_calculations.entries()){
   const plan=item.execution_plan,value=executeOpenAnalysisIR(plan,f.sources);assert.equal(value.value,index===0?'1050':'430');assert.equal(verifyOpenAnalysisIntegerSum(plan,value,f.sources).plan_sha256,taskHash(plan));assert.deepEqual(plan.join,f.plan.join);assert.equal(plan.unit,f.plan.unit);assert.deepEqual(plan.inputs![1],f.plan.inputs![1]);
  }
  assert.deepEqual(before.current_plan,openAnalysisProposal(f.plan));observed=true;return {text:'范围已明确，尚未执行。',tools:[]};
 }}} as any);
 await app.run({identity:f.identity,question:'比较全期及一月净额',signal:new AbortController().signal});assert.equal(observed,true);assert.equal(calculations,2);
});

for(const scenario of ['foreign_reference','input_missing','unknown_field','refund_scope','extra_method','revoked','changed_source'] as const)test(`V13-PLAN-VARIANT080: ${scenario} is denied without computation or durable effects`,async()=>{
 const f=fixture();let authorized=true,changed=false,effects=0,seen:any;
 const app=createOpenAnalysisApplication({agentLed:true,framework:{plan:f.plan} as any,loadSelectedSource:async()=>changed?{...f.sources,version:'changed'} as any:f.sources,isAuthorized:()=>authorized,verify:()=>{effects++;throw Error('must not calculate');},saveFramework:async()=>{effects++;throw Error('must not save');},saveOutcome:async()=>{effects++;throw Error('must not save');},runtime:{run:async input=>{
  const tool=input.tools.find(t=>t.name==='read_analysis_evidence')!,before:any=await tool.execute({},input.signal);const variant:any={base_plan_ref:before.current_plan_ref,goal:'指定变化',changes:[{input_index:0,group_by:null}]};
  if(scenario==='foreign_reference')variant.base_plan_ref='e'.repeat(64);
  if(scenario==='input_missing')variant.changes[0].input_index=9;
  if(scenario==='unknown_field')variant.changes[0].column='DOES_NOT_EXIST';
  if(scenario==='refund_scope')variant.changes=[{input_index:1,group_by:'A'}];
  if(scenario==='extra_method')variant.operation='mean';
  if(scenario==='revoked')authorized=false;
  if(scenario==='changed_source')changed=true;
  try{seen=await tool.execute({required_variants:[variant]},input.signal);}catch(error){seen={code:(error as any).code};throw error;}
  assert.notEqual(seen.required_calculations?.length,1);return {text:'参数未接受',tools:[]};
 }}} as any);
 await assert.rejects(()=>app.run({identity:f.identity,question:'指定变化',signal:new AbortController().signal}));assert.equal(effects,0);assert.ok(seen);
});

test('V13-PLAN-VARIANT080: installed native SDK receives reference, emits only changes and actual Application computes and verifies both variants',async()=>{
 const {createPiSessionOpenAnalysisRuntime}=await import('../../../adapters/agent-pi/native-open-analysis.ts');const {createApprovedProviderCredentials}=await import('../../../adapters/agent-pi/provider-credentials.ts');const {createLocalAnalysisRequestLedger}=await import('../../../adapters/storage-local/analysis-request-ledger.ts');const {browserEvidenceRoot}=await import('../../fixtures/xanthil-desktop/browser-evidence.ts');
 const f=fixture(),root=mkdtempSync(join(browserEvidenceRoot,'bound-plan-variants-')),ledger=createLocalAnalysisRequestLedger({projectRoot:root});let calls=0,checks=0,saved:any;
 const runtime=createPiSessionOpenAnalysisRuntime({projectRoot:root,ledger,nativeObjectArguments:true,credentials:createApprovedProviderCredentials({environment:{}}),modelTransport:async request=>{
  calls++;if(calls===3)return {content:[{kind:'text',text:'实际指定范围已经核算。'}],stop:'complete',usage:{inputTokens:4,outputTokens:2}};
  let args:object={};if(calls===2){const receipt=JSON.parse(request.messages.filter(m=>m.role==='tool').at(-1)!.text);assert.match(receipt.current_plan_ref,/^[a-f0-9]{64}$/);args={required_variants:[{base_plan_ref:receipt.current_plan_ref,goal:'一月净额',changes:[{input_index:0,group_by:null,filters:[{column:'B',operator:'eq',value:'2026-01'}]}]},{base_plan_ref:receipt.current_plan_ref,goal:'全期净额',changes:[{input_index:0,group_by:null}]}]};assert.equal(JSON.stringify(args).includes('refund_id'),false);assert.equal(JSON.stringify(args).includes(f.sources.sources[0].source_id),false);}
  return {content:[{kind:'tool',id:'bound-plan-variant-'+calls,name:'read_analysis_evidence',arguments:args}],stop:'tools',usage:{inputTokens:4,outputTokens:2}};
 }});
 const app=createOpenAnalysisApplication({agentLed:true,framework:{plan:f.plan} as any,runtime,loadSelectedSource:async()=>f.sources,isAuthorized:()=>true,verify:(...args:any[])=>{checks++;return verifyOpenAnalysisIntegerSum(...args as Parameters<typeof verifyOpenAnalysisIntegerSum>);},saveFramework:async frame=>({saved:true,...frame.identity}),saveVerifiedStep:async value=>({saved:true,...value.identity,step_id:value.step_id}),saveOutcome:async value=>{saved=value;return {saved:true,...value.identity,outcome_id:value.outcome_id};}});
 await app.run({identity:f.identity,question:'比较一月及全期净额',signal:new AbortController().signal});assert.equal(calls,3);assert.equal(checks,2);assert.equal(saved.calculation.value,'1050');assert.equal(ledger.read(f.identity.task_id).length,3);assert.equal(ledger.pending().length,0);
});

test('V13-PLAN-VARIANT080: measured recipe preserves explicit currency and scales when generating a filtered variant',async()=>{
 const {openAnalysisPlanVariants}=await import('../../../packages/application/open-analysis-plan-variants.ts');const f=fixture();const measure={currency:'CNY',output_scale:'10000',output_label:'人民币万元',inputs:f.plan.inputs!.map(i=>({source_id:i.source_id,sheet_id:i.sheet_id,column:i.column,scale:'10000'}))};
 const plan=compileOpenAnalysisIR({version:'1.8',base:openAnalysisProposal(f.plan),measure},f.sources);const [raw]=openAnalysisPlanVariants(plan,'a',[{base_plan_ref:'a',goal:'一月万元净额',changes:[{input_index:0,group_by:null,filters:[{column:'B',operator:'eq',value:'2026-01'}]}]}]);const changed=compileOpenAnalysisIR(raw,f.sources),value=executeOpenAnalysisIR(changed,f.sources);assert.equal(value.value,'430');assert.equal(value.unit,'人民币万元');assert.deepEqual(changed.measure,plan.measure);assert.deepEqual(changed.base!.join,plan.base!.join);assert.equal(verifyOpenAnalysisIntegerSum(changed,value,f.sources).plan_sha256,taskHash(changed));
});

test('V13-PLAN-VARIANT080: omitted filters stay bound and reference from previous Context is rejected',async()=>{
 const f=fixture();const proposal=openAnalysisProposal(f.plan) as any;proposal.inputs[0].filters=[{column:'B',operator:'eq',value:'2026-01'}];const plan=compileOpenAnalysisIR(proposal,f.sources);let accepted=false;
 const app=createOpenAnalysisApplication({agentLed:true,framework:{plan} as any,loadSelectedSource:async()=>f.sources,isAuthorized:()=>true,verify:()=>{throw Error('not admitted');},saveFramework:async()=>{throw Error('not admitted');},saveOutcome:async()=>{throw Error('not admitted');},runtime:{run:async input=>{
  const tool=input.tools.find(t=>t.name==='read_analysis_evidence')!,before:any=await tool.execute({},input.signal),result:any=await tool.execute({required_variants:[{base_plan_ref:before.current_plan_ref,goal:'仍只看一月',changes:[{input_index:0,group_by:null}]}]},input.signal);assert.deepEqual(result.required_calculations[0].execution_plan.inputs[0].filters,plan.inputs![0]!.filters);accepted=true;
  await input.tools.find(t=>t.name==='describe_business')!.execute({purpose:'新的上下文',object:'订单',scope:'当前资料',deliverables:[],hypotheses:[],unknowns:[]},input.signal);
  await tool.execute({required_variants:[{base_plan_ref:before.current_plan_ref,goal:'旧引用不能复用',changes:[{input_index:0,group_by:null}]}]},input.signal);throw Error('stale reference accepted');
 }}} as any);
 await assert.rejects(()=>app.run({identity:f.identity,question:'仍只看一月',signal:new AbortController().signal}),{code:'CANDIDATE_REFERENCE_INVALID'});assert.equal(accepted,true);
});


test('V13-PREP-PHASE081: preparation declaration and receipt direct only available candidate tools',async()=>{
 const f=fixture();let observed=false;const app=createOpenAnalysisApplication({proposalOnly:true,framework:{plan:f.plan} as any,loadSelectedSource:async()=>f.sources,isAuthorized:()=>true,verify:()=>{throw Error('no preparation computation');},saveFramework:async()=>{throw Error('no adoption');},saveOutcome:async()=>{throw Error('no preparation outcome');},runtime:{run:async input=>{
  assert.equal(input.tools.some(t=>t.name==='calculate_and_verify'),false);const tool=input.tools.find(t=>t.name==='read_analysis_evidence')!;assert.doesNotMatch(tool.description,/主动计算已有声明用calculate_and_verify/);
  const {version,...args}=openAnalysisProposal(f.plan);void version;await input.tools.find(t=>t.name==='set_joined_framework')!.execute(args,input.signal);const receipt:any=await tool.execute({required_current_plan:true},input.signal);assert.match(receipt.instruction,/准备|候选/);assert.doesNotMatch(receipt.instruction,/主动计算已有声明用calculate_and_verify/);observed=true;return {text:'候选已经准备，尚未计算。',tools:[]};
 }}} as any);const result=await app.run({identity:f.identity,question:'准备当前分析方案',signal:new AbortController().signal});assert.equal(observed,true);assert.equal(result.state,'proposal');
});


test('V13-PREP-PHASE081: installed native SDK proposal consumer receives phase-correct evidence and binds candidate without executing',async()=>{
 const {createPiSessionOpenAnalysisRuntime}=await import('../../../adapters/agent-pi/native-open-analysis.ts');const {createApprovedProviderCredentials}=await import('../../../adapters/agent-pi/provider-credentials.ts');const {createLocalAnalysisRequestLedger}=await import('../../../adapters/storage-local/analysis-request-ledger.ts');const {browserEvidenceRoot}=await import('../../fixtures/xanthil-desktop/browser-evidence.ts');
 const f=fixture(),root=mkdtempSync(join(browserEvidenceRoot,'proposal-phase-feedback-')),ledger=createLocalAnalysisRequestLedger({projectRoot:root});let calls=0;
 const runtime=createPiSessionOpenAnalysisRuntime({projectRoot:root,ledger,nativeObjectArguments:true,credentials:createApprovedProviderCredentials({environment:{}}),modelTransport:async request=>{
  calls++;const tools=request.messages.flatMap(m=>m.tools??[]);assert.equal(tools.some(t=>t.name==='calculate_and_verify'),false);assert.doesNotMatch(tools.find(t=>t.name==='read_analysis_evidence')!.description,/主动计算已有声明用calculate_and_verify/);
  if(calls===3){const receipt=JSON.parse(request.messages.filter(m=>m.role==='tool').at(-1)!.text);assert.equal(receipt.calculation_performed,false);assert.match(receipt.instruction,/准备|候选/);return {content:[{kind:'text',text:'当前候选已绑定，尚未执行。'}],stop:'complete',usage:{inputTokens:4,outputTokens:2}};}
  const {version,...args}=openAnalysisProposal(f.plan);void version;return {content:[{kind:'tool',id:'phase-feedback-'+calls,name:calls===1?'set_joined_framework':'read_analysis_evidence',arguments:calls===1?args:{required_current_plan:true}}],stop:'tools',usage:{inputTokens:4,outputTokens:2}};
 }});
 const app=createOpenAnalysisApplication({proposalOnly:true,runtime,loadSelectedSource:async()=>f.sources,isAuthorized:()=>true,verify:()=>{throw Error('no preparation calculation');},saveFramework:async()=>{throw Error('no preparation adoption');},saveOutcome:async()=>{throw Error('no preparation outcome');}});const result=await app.run({identity:f.identity,question:'只准备当前净额方案',signal:new AbortController().signal});assert.equal(result.state,'proposal');assert.equal(calls,3);assert.equal(ledger.pending().length,0);
});

test('V13-EXECUTION-REFERENCE083: blocked calculation returns scoped reference and changes-only route that actually computes and independently verifies',async()=>{
 const f=fixture();let checks=0,saved:any;const app=createOpenAnalysisApplication({agentLed:true,requireDeclaredCalculations:true,framework:{plan:f.plan} as any,loadSelectedSource:async()=>f.sources,isAuthorized:()=>true,verify:(...args:any[])=>{checks++;return verifyOpenAnalysisIntegerSum(...args as Parameters<typeof verifyOpenAnalysisIntegerSum>);},saveFramework:async frame=>({saved:true,...frame.identity}),saveVerifiedStep:async value=>({saved:true,...value.identity,step_id:value.step_id}),saveOutcome:async value=>{saved=value;return {saved:true,...value.identity,outcome_id:value.outcome_id};},runtime:{run:async input=>{
  const calculate=input.tools.find(t=>t.name==='calculate_and_verify')!,read=input.tools.find(t=>t.name==='read_analysis_evidence')!;const blocked:any=await calculate.execute({},input.signal);assert.equal(blocked.status,'needs_required_calculations');assert.equal(blocked.calculation_performed,false);assert.equal(checks,0);assert.match(blocked.current_plan_ref,/^[a-f0-9]{64}$/);assert.match(blocked.instruction,/required_variants/);assert.doesNotMatch(blocked.instruction,/其他重要计算仍提交required_plans/);const declared:any=await read.execute({required_current_plan:true,required_variants:[{base_plan_ref:blocked.current_plan_ref,goal:'一月净额',changes:[{input_index:0,group_by:null,filters:[{column:'B',operator:'eq',value:'2026-01'}]}]}]},input.signal);assert.equal(checks,0);assert.equal(declared.required_calculations.length,2);for(const c of declared.required_calculations){const result:any=await calculate.execute({calculation_ref:c.calculation_ref},input.signal);assert.equal(result.verification.grade,'independent_arithmetic');assert.equal(result.verification.value,result.calculation.value);}return {text:'已按实际方案核算；原因仍未证实。',tools:[]};
 }}});await app.run({identity:f.identity,question:'比较全期与一月净额',signal:new AbortController().signal});assert.equal(checks,2);assert.equal(saved.calculation.value,'430');
});

test('V13-EXECUTION-REFERENCE083: installed native SDK consumes blocked calculation reference and declares actual variants',async()=>{
 const {createPiSessionOpenAnalysisRuntime}=await import('../../../adapters/agent-pi/native-open-analysis.ts');const {createApprovedProviderCredentials}=await import('../../../adapters/agent-pi/provider-credentials.ts');const {createLocalAnalysisRequestLedger}=await import('../../../adapters/storage-local/analysis-request-ledger.ts');const {browserEvidenceRoot}=await import('../../fixtures/xanthil-desktop/browser-evidence.ts');
 const f=fixture(),root=mkdtempSync(join(browserEvidenceRoot,'execution-reference-feedback-')),ledger=createLocalAnalysisRequestLedger({projectRoot:root});let calls=0,checks=0,saved:any;
 const runtime=createPiSessionOpenAnalysisRuntime({projectRoot:root,ledger,nativeObjectArguments:true,credentials:createApprovedProviderCredentials({environment:{}}),modelTransport:async request=>{
  calls++;if(calls===1)return {content:[{kind:'tool',id:'blocked-current-plan',name:'calculate_and_verify',arguments:{}}],stop:'tools',usage:{inputTokens:4,outputTokens:2}};
  if(calls===2){const receipt=JSON.parse(request.messages.filter(m=>m.role==='tool').at(-1)!.text);assert.equal(receipt.status,'needs_required_calculations');assert.match(receipt.current_plan_ref,/^[a-f0-9]{64}$/);assert.match(receipt.instruction,/required_variants/);return {content:[{kind:'tool',id:'declared-current-plan',name:'read_analysis_evidence',arguments:{required_current_plan:true,required_variants:[{base_plan_ref:receipt.current_plan_ref,goal:'一月净额',changes:[{input_index:0,group_by:null,filters:[{column:'B',operator:'eq',value:'2026-01'}]}]}]}}],stop:'tools',usage:{inputTokens:4,outputTokens:2}};}
  assert.equal(calls,3);assert.equal(checks,0);return {content:[{kind:'text',text:'按已声明实际计算交付，原因尚未证实。'}],stop:'complete',usage:{inputTokens:4,outputTokens:2}};
 }});
 const app=createOpenAnalysisApplication({agentLed:true,requireDeclaredCalculations:true,framework:{plan:f.plan} as any,runtime,loadSelectedSource:async()=>f.sources,isAuthorized:()=>true,verify:(...args:any[])=>{checks++;return verifyOpenAnalysisIntegerSum(...args as Parameters<typeof verifyOpenAnalysisIntegerSum>);},saveFramework:async frame=>({saved:true,...frame.identity}),saveVerifiedStep:async value=>({saved:true,...value.identity,step_id:value.step_id}),saveOutcome:async value=>{saved=value;return {saved:true,...value.identity,outcome_id:value.outcome_id};}});await app.run({identity:f.identity,question:'比较全期与一月净额',signal:new AbortController().signal});assert.equal(calls,3);assert.equal(checks,2);assert.equal(saved.calculation.value,'430');assert.equal(ledger.read(f.identity.task_id).length,3);assert.equal(ledger.pending().length,0);
});

test('V13-REFERENCE-BIND084: existing binding entry accepts current recipe reference and explicit changes; proposal never executes',async()=>{
 const f=fixture();let seen=false;const app=createOpenAnalysisApplication({proposalOnly:true,framework:{plan:f.plan} as any,loadSelectedSource:async()=>f.sources,isAuthorized:()=>true,verify:()=>assert.fail('proposal never computes'),saveFramework:async()=>assert.fail('proposal never adopts'),saveOutcome:async()=>assert.fail('proposal never saves result'),runtime:{run:async input=>{const read=input.tools.find(t=>t.name==='read_analysis_evidence')!,bind=input.tools.find(t=>t.name==='set_joined_framework')!,before:any=await read.execute({},input.signal);const bound:any=await bind.execute({plan_ref:before.current_plan_ref,goal:'只核对一月净额',changes:[{input_index:0,group_by:null,filters:[{column:'B',operator:'eq',value:'2026-01'}]}]},input.signal);assert.equal(bound.binding.inputs[0].group_by,null);assert.deepEqual(bound.binding.inputs[0].filters,[{column:'B',operator:'eq',value:'2026-01'}]);assert.deepEqual(bound.binding.inputs[1],f.plan.inputs![1]);assert.deepEqual(bound.binding.join,f.plan.join);seen=true;return {text:'只核对一月的方案已准备。',tools:[]};}}});const result:any=await app.run({identity:f.identity,question:'只核对一月净额',signal:new AbortController().signal});assert.equal(seen,true);assert.equal(result.state,'proposal');assert.equal(result.framework.plan.goal,'只核对一月净额');const value=executeOpenAnalysisIR(result.framework.plan,f.sources);assert.equal(value.value,'430');assert.equal(verifyOpenAnalysisIntegerSum(result.framework.plan,value,f.sources).value,'430');
});

test('V13-REFERENCE-BIND084: closed reference rejects stale, foreign, mixed and invalid changes before adoption or calculation',async()=>{
 for(const kind of ['foreign','mixed','empty','duplicate','index','stale']){
  const f=fixture();let effects=0;const app=createOpenAnalysisApplication({proposalOnly:true,framework:{plan:f.plan} as any,loadSelectedSource:async()=>f.sources,isAuthorized:()=>true,verify:()=>{effects++;throw Error('unexpected calculation');},saveFramework:async()=>{effects++;throw Error('unexpected adoption');},saveOutcome:async()=>{effects++;throw Error('unexpected result');},runtime:{run:async input=>{
   const read=input.tools.find(t=>t.name==='read_analysis_evidence')!,bind=input.tools.find(t=>t.name==='set_joined_framework')!,r:any=await read.execute({},input.signal);const args:any={plan_ref:r.current_plan_ref,goal:'真实范围'};
   if(kind==='foreign')args.plan_ref='f'.repeat(64);
   if(kind==='mixed')args.inputs=openAnalysisProposal(f.plan).inputs;
   if(kind==='empty')args.changes=[];
   if(kind==='duplicate')args.changes=[{input_index:0,group_by:null},{input_index:0,group_by:'B'}];
   if(kind==='index')args.changes=[{input_index:2,group_by:null}];
   if(kind==='stale')await input.tools.find(t=>t.name==='describe_business')!.execute({purpose:'重新理解',object:'订单',scope:'当前资料',deliverables:[],hypotheses:[],unknowns:[]},input.signal);
   if(['foreign','stale','mixed'].includes(kind))await assert.rejects(()=>bind.execute(args,input.signal),{code:kind==='mixed'?'VALIDATION_FAILED':'CANDIDATE_REFERENCE_INVALID'},kind);else{const rejected:any=await bind.execute(args,input.signal);assert.equal(rejected.status,'needs_information',kind);assert.equal(rejected.code,'PLAN_INVALID',kind);}const after:any=await read.execute({},input.signal);assert.deepEqual(after.current_plan,r.current_plan);return {text:'无效修改没有接受。',tools:[]};
  }}});const run=()=>app.run({identity:f.identity,question:'核对当前范围',signal:new AbortController().signal});if(['foreign','stale','mixed'].includes(kind))await assert.rejects(run,{code:kind==='mixed'?'VALIDATION_FAILED':'CANDIDATE_REFERENCE_INVALID'});else await run();assert.equal(effects,0,kind);
 }
});

test('V13-REFERENCE-BIND084: unchanged recipe and explicit measurement survive reference; refund-side scope stays rejected',async()=>{
 const f=fixture(),measure={currency:'CNY',output_scale:'10000',output_label:'人民币万元',inputs:f.plan.inputs!.map(i=>({source_id:i.source_id,sheet_id:i.sheet_id,column:i.column,scale:'10000'}))},plan=compileOpenAnalysisIR({version:'1.8',base:openAnalysisProposal(f.plan),measure},f.sources);let bound:any;
 const app=createOpenAnalysisApplication({proposalOnly:true,framework:{plan} as any,loadSelectedSource:async()=>f.sources,isAuthorized:()=>true,verify:()=>assert.fail('no calculation'),saveFramework:async()=>assert.fail('no adoption'),saveOutcome:async()=>assert.fail('no result'),runtime:{run:async input=>{
  const read=input.tools.find(t=>t.name==='read_analysis_evidence')!,bind=input.tools.find(t=>t.name==='set_joined_framework')!,r:any=await read.execute({},input.signal);bound=await bind.execute({plan_ref:r.current_plan_ref,goal:'沿用万元口径'},input.signal);assert.deepEqual(bound.binding.measure,plan.measure);assert.deepEqual(bound.binding.base.inputs,plan.base!.inputs);assert.deepEqual(bound.binding.base.join,plan.base!.join);
  const next:any=await read.execute({},input.signal),rejected:any=await bind.execute({plan_ref:next.current_plan_ref,goal:'退款不允许单独筛选',changes:[{input_index:1,filters:[{column:'B',operator:'eq',value:'5'}]}]},input.signal);assert.equal(rejected.status,'needs_parameter_correction');assert.equal(rejected.framework_saved,false);return {text:'原万元口径保持不变。',tools:[]};
 }}});const result:any=await app.run({identity:f.identity,question:'沿用万元口径',signal:new AbortController().signal});assert.deepEqual(result.framework.plan.measure,measure);assert.equal(verifyOpenAnalysisIntegerSum(result.framework.plan,executeOpenAnalysisIR(result.framework.plan,f.sources),f.sources).grade,'independent_arithmetic');
});

test('V13-REFERENCE-BIND084: installed native SDK consumes current reference and only changes, then actual compiled IR is independently verified',async()=>{
 const {createPiSessionOpenAnalysisRuntime}=await import('../../../adapters/agent-pi/native-open-analysis.ts');const {createApprovedProviderCredentials}=await import('../../../adapters/agent-pi/provider-credentials.ts');const {createLocalAnalysisRequestLedger}=await import('../../../adapters/storage-local/analysis-request-ledger.ts');const {browserEvidenceRoot}=await import('../../fixtures/xanthil-desktop/browser-evidence.ts');
 const f=fixture(),root=mkdtempSync(join(browserEvidenceRoot,'reference-binding-')),ledger=createLocalAnalysisRequestLedger({projectRoot:root});let calls=0;
 const runtime=createPiSessionOpenAnalysisRuntime({projectRoot:root,ledger,nativeObjectArguments:true,credentials:createApprovedProviderCredentials({environment:{}}),modelTransport:async request=>{
  calls++;const declarations=request.messages.flatMap(m=>m.tools??[]),schema:any=declarations.find(t=>t.name==='set_joined_framework')!.parameters;assert.equal(schema.anyOf,undefined);assert.deepEqual(schema.required,['plan_ref','goal']);assert.equal(Object.hasOwn(schema.properties,'inputs'),false);
  if(calls===3){const receipt=JSON.parse(request.messages.filter(m=>m.role==='tool').at(-1)!.text);assert.equal(receipt.binding.inputs[0].filters[0].value,'2026-01');return {content:[{kind:'text',text:'一月方案已准备，尚未计算。'}],stop:'complete',usage:{inputTokens:4,outputTokens:2}};}
  const receipt=calls===2?JSON.parse(request.messages.filter(m=>m.role==='tool').at(-1)!.text):undefined;const args=calls===1?{}:{plan_ref:receipt.current_plan_ref,goal:'一月净额',changes:[{input_index:0,group_by:null,filters:[{column:'B',operator:'eq',value:'2026-01'}]}]};assert.equal(JSON.stringify(args).includes('refund_id'),false);
  return {content:[{kind:'tool',id:'referenced-binding-'+calls,name:calls===1?'read_analysis_evidence':'set_joined_framework',arguments:args}],stop:'tools',usage:{inputTokens:4,outputTokens:2}};
 }});const app=createOpenAnalysisApplication({proposalOnly:true,framework:{plan:f.plan} as any,runtime,loadSelectedSource:async()=>f.sources,isAuthorized:()=>true,verify:()=>assert.fail('proposal never computes'),saveFramework:async()=>assert.fail('proposal never adopts'),saveOutcome:async()=>assert.fail('proposal never saves result')});const result:any=await app.run({identity:f.identity,question:'只核对一月净额',signal:new AbortController().signal});assert.equal(result.state,'proposal');assert.equal(calls,3);const value=executeOpenAnalysisIR(result.framework.plan,f.sources);assert.equal(value.value,'430');assert.equal(verifyOpenAnalysisIntegerSum(result.framework.plan,value,f.sources).value,'430');assert.equal(ledger.read(f.identity.task_id).length,3);assert.equal(ledger.pending().length,0);
});

test('V13-BINDING-RECEIPT085: bound new method gives current reference and declaration route before real independent calculation',async()=>{
 const f=fixture();let checks=0,saved:any;const app=createOpenAnalysisApplication({agentLed:true,requireDeclaredCalculations:true,framework:{plan:f.plan} as any,loadSelectedSource:async()=>f.sources,isAuthorized:()=>true,verify:(...args:any[])=>{checks++;return verifyOpenAnalysisIntegerSum(...args as Parameters<typeof verifyOpenAnalysisIntegerSum>);},saveFramework:async frame=>({saved:true,...frame.identity}),saveVerifiedStep:async value=>({saved:true,...value.identity,step_id:value.step_id}),saveOutcome:async value=>{saved=value;return {saved:true,...value.identity,outcome_id:value.outcome_id};},runtime:{run:async input=>{
  const bound:any=await input.tools.find(t=>t.name==='set_framework')!.execute({goal:'一月订单金额',source_id:f.sources.sources[0].source_id,sheet_id:f.sources.sources[0].sheets[0].sheet_id,operation:'sum',column:'C',unit:'元',group_mode:'none',filters:[{column:'B',operator:'eq',value:'2026-01'}]},input.signal);assert.match(bound.current_plan_ref,/^[a-f0-9]{64}$/);assert.match(bound.instruction,/required_current_plan/);assert.equal(checks,0);const declaration:any=await input.tools.find(t=>t.name==='read_analysis_evidence')!.execute({required_current_plan:true},input.signal);assert.equal(declaration.current_plan_ref,bound.current_plan_ref);const result:any=await input.tools.find(t=>t.name==='calculate_and_verify')!.execute({calculation_ref:declaration.required_calculations[0].calculation_ref},input.signal);assert.equal(result.calculation.value,'450');assert.equal(result.verification.grade,'independent_arithmetic');return {text:'当前订单金额已独立核算。',tools:[]};
 }}});await app.run({identity:f.identity,question:'一月订单金额',signal:new AbortController().signal});assert.equal(checks,1);assert.equal(saved.calculation.value,'450');
});


test('V13-BINDING-RECEIPT085: installed native SDK consumes new method receipt and declares current recipe without recopying IR',async()=>{
 const {createPiSessionOpenAnalysisRuntime}=await import('../../../adapters/agent-pi/native-open-analysis.ts');const {createApprovedProviderCredentials}=await import('../../../adapters/agent-pi/provider-credentials.ts');const {createLocalAnalysisRequestLedger}=await import('../../../adapters/storage-local/analysis-request-ledger.ts');const {browserEvidenceRoot}=await import('../../fixtures/xanthil-desktop/browser-evidence.ts');
 const f=fixture(),root=mkdtempSync(join(browserEvidenceRoot,'binding-receipt-')),ledger=createLocalAnalysisRequestLedger({projectRoot:root});let calls=0,checks=0,saved:any,producerGuide='',producerSystem='',joinedGuide='';
 const runtime=createPiSessionOpenAnalysisRuntime({projectRoot:root,ledger,nativeObjectArguments:true,credentials:createApprovedProviderCredentials({environment:{}}),modelTransport:async request=>{
  calls++;if(calls===1){producerGuide=request.messages.flatMap(m=>m.tools??[]).find(t=>t.name==='read_analysis_evidence')!.description;producerSystem=request.messages.map(m=>m.text??'').join('\n');joinedGuide=request.messages.flatMap(m=>m.tools??[]).find(t=>t.name==='set_joined_framework')!.description;}if(calls===1)return {content:[{kind:'tool',id:'new-gross-method',name:'set_framework',arguments:{goal:'一月订单金额',source_id:f.sources.sources[0].source_id,sheet_id:f.sources.sources[0].sheets[0].sheet_id,operation:'sum',column:'C',unit:'元',group_mode:'none',filters:[{column:'B',operator:'eq',value:'2026-01'}]}}],stop:'tools',usage:{inputTokens:4,outputTokens:2}};
  const receipt=JSON.parse(request.messages.filter(m=>m.role==='tool').at(-1)!.text);
  if(calls===2){assert.match(receipt.current_plan_ref,/^[a-f0-9]{64}$/);assert.match(receipt.instruction,/required_current_plan/);return {content:[{kind:'tool',id:'declare-bound-gross',name:'read_analysis_evidence',arguments:{required_current_plan:true}}],stop:'tools',usage:{inputTokens:4,outputTokens:2}};}
  if(calls===3)return {content:[{kind:'tool',id:'compute-bound-gross',name:'calculate_and_verify',arguments:{calculation_ref:receipt.required_calculations[0].calculation_ref}}],stop:'tools',usage:{inputTokens:4,outputTokens:2}};
  assert.equal(receipt.calculation.value,'450');assert.equal(receipt.verification.grade,'independent_arithmetic');return {content:[{kind:'text',text:'本月订单金额已独立核算。'}],stop:'complete',usage:{inputTokens:4,outputTokens:2}};
 }});const app=createOpenAnalysisApplication({agentLed:true,requireDeclaredCalculations:true,framework:{plan:f.plan} as any,runtime,loadSelectedSource:async()=>f.sources,isAuthorized:()=>true,verify:(...args:any[])=>{checks++;return verifyOpenAnalysisIntegerSum(...args as Parameters<typeof verifyOpenAnalysisIntegerSum>);},saveFramework:async frame=>({saved:true,...frame.identity}),saveVerifiedStep:async value=>({saved:true,...value.identity,step_id:value.step_id}),saveOutcome:async value=>{saved=value;return {saved:true,...value.identity,outcome_id:value.outcome_id};}});await app.run({identity:f.identity,question:'一月订单金额',signal:new AbortController().signal});assert.match(producerGuide,/新方法[^。]*set_framework/,'new method producer must expose the existing typed builder route');assert.doesNotMatch(producerSystem,/新方法仍需完整IR|新方法才提交完整required_plans|真正新方法使用required_plans/,'system must not override compiler-owned new method route');assert.match(joinedGuide,/current_plan_ref/,'bound producer exposes actual reference route');assert.doesNotMatch(joinedGuide,/完整参数通道/,'bound producer must not instruct full IR duplication');assert.equal(calls,4);assert.equal(checks,1);assert.equal(saved.calculation.value,'450');assert.equal(ledger.pending().length,0);
});

test('V13-BOUND-CANDIDATE086: actual binding receipts feed existing step graph by reference, retain two real scopes and never execute preparation',async()=>{
 const f=fixture();let seen=false;const app=createOpenAnalysisApplication({proposalOnly:true,framework:{plan:f.plan} as any,loadSelectedSource:async()=>f.sources,isAuthorized:()=>true,verify:()=>assert.fail('preparation never calculates'),saveFramework:async()=>assert.fail('preparation never adopts'),saveOutcome:async()=>assert.fail('preparation never saves result'),runtime:{run:async input=>{
  const bind=input.tools.find(t=>t.name==='set_joined_framework')!,read=input.tools.find(t=>t.name==='read_analysis_evidence')!,r:any=await read.execute({},input.signal),one:any=await bind.execute({plan_ref:r.current_plan_ref,goal:'一月净额',changes:[{input_index:0,group_by:null,filters:[{column:'B',operator:'eq',value:'2026-01'}]}]},input.signal);assert.equal(one.current_steps,null);assert.match(one.candidate_refs[0].plan_ref,/^candidate:/);
  const two:any=await bind.execute({plan_ref:one.current_plan_ref,goal:'二月净额',changes:[{input_index:0,filters:[{column:'B',operator:'eq',value:'2026-02'}]}]},input.signal);const step=(title:string,ref:string)=>({title,depends_on:[],plan_ref:ref,hypotheses:[],required_evidence:['当前实际订单和关联退款'],limitations:['不推断退款原因']});const graph:any=await input.tools.find(t=>t.name==='set_analysis_steps')!.execute({version:'1.0',update_mode:'replace',steps:[step('一月净额',one.candidate_refs[0].plan_ref),step('二月净额',two.candidate_refs[0].plan_ref)]},input.signal);assert.equal(graph.total_steps,2);assert.equal(graph.steps.steps.length,2);seen=true;return {text:'两期实际方案已绑定，尚未计算。',tools:[]};
 }}});const result:any=await app.run({identity:f.identity,question:'比较两期净额',signal:new AbortController().signal});assert.equal(seen,true);assert.equal(result.state,'proposal');assert.equal(result.framework.steps.steps.length,2);const values=result.framework.steps.steps.map((s:any)=>{const value=executeOpenAnalysisIR(s.framework.plan,f.sources);assert.equal(verifyOpenAnalysisIntegerSum(s.framework.plan,value,f.sources).value,value.value);return value.value;});assert.deepEqual(values,['430','620']);
});

test('V13-BOUND-CANDIDATE086: binding receipt handle expires on Context change and cannot invent a graph dependency',async()=>{
 for(const kind of ['stale','phantom']){
  const f=fixture();let seen=false;const app=createOpenAnalysisApplication({proposalOnly:true,framework:{plan:f.plan} as any,loadSelectedSource:async()=>f.sources,isAuthorized:()=>true,verify:()=>assert.fail('no computation'),saveFramework:async()=>assert.fail('no adoption'),saveOutcome:async()=>assert.fail('no result'),runtime:{run:async input=>{
   const r:any=await input.tools.find(t=>t.name==='read_analysis_evidence')!.execute({},input.signal),bound:any=await input.tools.find(t=>t.name==='set_joined_framework')!.execute({plan_ref:r.current_plan_ref,goal:'当前净额'},input.signal);seen=true;
   if(kind==='stale')await input.tools.find(t=>t.name==='describe_business')!.execute({purpose:'新的业务理解',object:'订单',scope:'当前资料',deliverables:[],hypotheses:[],unknowns:[]},input.signal);
   const call=()=>input.tools.find(t=>t.name==='set_analysis_steps')!.execute({version:'1.0',update_mode:'replace',steps:[{title:'当前净额',plan_ref:bound.candidate_refs[0].plan_ref,depends_on:kind==='phantom'?['未声明的父步骤']:[],hypotheses:[],required_evidence:[],limitations:[]}]},input.signal);
   if(kind==='stale'){const refused:any=await call();assert.equal(refused.status,'needs_current_candidate');assert.equal(refused.calculation_performed,false);assert.equal(refused.framework_saved,false);await call();assert.fail('repeated stale Context accepted');}else{const receipt:any=await call();assert.equal(receipt.status,'needs_step_correction');assert.equal(receipt.calculation_performed,false);assert.equal((await input.tools.find(t=>t.name==='read_analysis_evidence')!.execute({},input.signal) as any).current_steps,null);return {text:'依赖未建立，图没有接受。',tools:[]};}return {text:'unreachable',tools:[]};
  }}});const run=()=>app.run({identity:f.identity,question:'当前净额',signal:new AbortController().signal});await assert.rejects(run,{code:kind==='stale'?'CANDIDATE_REFERENCE_INVALID':'ANALYSIS_INCOMPLETE'});assert.equal(seen,true);
 }
});

test('V13-BOUND-CANDIDATE086: installed native SDK consumes actual binding handles to compile two scopes without rewriting IR',async()=>{
 const {createPiSessionOpenAnalysisRuntime}=await import('../../../adapters/agent-pi/native-open-analysis.ts');const {createApprovedProviderCredentials}=await import('../../../adapters/agent-pi/provider-credentials.ts');const {createLocalAnalysisRequestLedger}=await import('../../../adapters/storage-local/analysis-request-ledger.ts');const {browserEvidenceRoot}=await import('../../fixtures/xanthil-desktop/browser-evidence.ts');
 const f=fixture(),root=mkdtempSync(join(browserEvidenceRoot,'bound-candidate-receipt-')),ledger=createLocalAnalysisRequestLedger({projectRoot:root});let calls=0;const refs:string[]=[];
 const runtime=createPiSessionOpenAnalysisRuntime({projectRoot:root,ledger,nativeObjectArguments:true,credentials:createApprovedProviderCredentials({environment:{}}),modelTransport:async request=>{
  calls++;if(calls===1)return {content:[{kind:'tool',id:'read-current-binding',name:'read_analysis_evidence',arguments:{}}],stop:'tools',usage:{inputTokens:4,outputTokens:2}};
  const receipt=JSON.parse(request.messages.filter(m=>m.role==='tool').at(-1)!.text);
  if(calls===2||calls===3){if(calls===3){assert.equal(receipt.current_steps,null);refs.push(receipt.candidate_refs[0].plan_ref);}return {content:[{kind:'tool',id:'bind-month-'+calls,name:'set_joined_framework',arguments:{plan_ref:receipt.current_plan_ref,goal:calls===2?'一月净额':'二月净额',changes:[{input_index:0,group_by:null,filters:[{column:'B',operator:'eq',value:calls===2?'2026-01':'2026-02'}]}]}}],stop:'tools',usage:{inputTokens:4,outputTokens:2}};}
  if(calls===4){refs.push(receipt.candidate_refs[0].plan_ref);const steps=refs.map((plan_ref,i)=>({title:i===0?'一月净额':'二月净额',plan_ref,depends_on:[],hypotheses:[],required_evidence:['实际来源'],limitations:['不推断原因']}));assert.equal(JSON.stringify(steps).includes('refund_order_key'),false);return {content:[{kind:'tool',id:'bind-actual-step-handles',name:'set_analysis_steps',arguments:{version:'1.0',update_mode:'replace',steps}}],stop:'tools',usage:{inputTokens:4,outputTokens:2}};}
  assert.equal(receipt.total_steps,2);return {content:[{kind:'text',text:'两期方案已准备，尚未计算。'}],stop:'complete',usage:{inputTokens:4,outputTokens:2}};
 }});const app=createOpenAnalysisApplication({proposalOnly:true,framework:{plan:f.plan} as any,runtime,loadSelectedSource:async()=>f.sources,isAuthorized:()=>true,verify:()=>assert.fail('no preparation calculation'),saveFramework:async()=>assert.fail('no preparation adoption'),saveOutcome:async()=>assert.fail('no preparation result')});const result:any=await app.run({identity:f.identity,question:'比较两期净额',signal:new AbortController().signal});assert.equal(result.state,'proposal');assert.equal(calls,5);assert.deepEqual(result.framework.steps.steps.map((s:any)=>{const value=executeOpenAnalysisIR(s.framework.plan,f.sources);assert.equal(verifyOpenAnalysisIntegerSum(s.framework.plan,value,f.sources).grade,'independent_arithmetic');return value.value;}),['430','620']);assert.equal(ledger.pending().length,0);
});

test('V13-PLAN-REFERENCE-FEEDBACK088: actual native model receives no-effect stale-recipe feedback and explicitly computes the corrected current-reference variant',async()=>{
 const {createPiSessionOpenAnalysisRuntime}=await import('../../../adapters/agent-pi/native-open-analysis.ts');const {createApprovedProviderCredentials}=await import('../../../adapters/agent-pi/provider-credentials.ts');const {createLocalAnalysisRequestLedger}=await import('../../../adapters/storage-local/analysis-request-ledger.ts');const {browserEvidenceRoot}=await import('../../fixtures/xanthil-desktop/browser-evidence.ts');
 const f=fixture(),root=mkdtempSync(join(browserEvidenceRoot,'stale-recipe-native-')),ledger=createLocalAnalysisRequestLedger({projectRoot:root});let calls=0,checks=0,frames=0,original='',fresh='',first='',second='',saw=false,saved:any;
 const variant=(reference:string,period:string)=>({base_plan_ref:reference,goal:period+'净销售额',changes:[{input_index:0,group_by:null,filters:[{column:'B',operator:'eq',value:period}]}]});
 const runtime=createPiSessionOpenAnalysisRuntime({projectRoot:root,ledger,nativeObjectArguments:true,credentials:createApprovedProviderCredentials({environment:{}}),modelTransport:async request=>{
  calls++;const last=request.messages.filter(m=>m.role==='tool').at(-1);const receipt=last?JSON.parse(last.text):null;let name='read_analysis_evidence',args:any={};
  if(calls===2){original=receipt.current_plan_ref;args={required_variants:[variant(original,'2026-01')]};}
  if(calls===3){first=receipt.required_calculations[0].calculation_ref;name='calculate_and_verify';args={calculation_ref:first};}
  if(calls===4){assert.equal(checks,1);assert.equal(receipt.verification.value,'430');args={required_current_plan:true,required_variants:[variant(original,'2026-02')]};}
  if(calls===5){assert.equal(receipt.status,'needs_current_plan');assert.equal(receipt.code,'CANDIDATE_REFERENCE_INVALID');assert.equal(receipt.calculation_performed,false);assert.equal(receipt.framework_saved,false);assert.equal(checks,1);assert.equal(frames,1);fresh=receipt.current_plan_ref;assert.notEqual(fresh,original);assert.match(receipt.instruction,/重新|explicit|fresh|当前/);saw=true;args={required_variants:[variant(fresh,'2026-02')]};}
  if(calls===6){second=receipt.required_calculations.find((c:any)=>c.calculation_ref!==first).calculation_ref;name='calculate_and_verify';args={calculation_ref:second};}
  if(calls===7){assert.equal(receipt.verification.value,'620');return {content:[{kind:'text',text:'两期净销售额已经分别计算，独立核验通过；不推断原因。'}],stop:'complete',usage:{inputTokens:4,outputTokens:2}};}
  assert.ok(calls<=7);return {content:[{kind:'tool',id:'stale-recipe-native-'+calls,name,arguments:args}],stop:'tools',usage:{inputTokens:4,outputTokens:2}};
 }});
 const app=createOpenAnalysisApplication({agentLed:true,framework:{plan:f.plan} as any,runtime,loadSelectedSource:async()=>f.sources,isAuthorized:()=>true,verify:(...args:any[])=>{checks++;return verifyOpenAnalysisIntegerSum(...args as Parameters<typeof verifyOpenAnalysisIntegerSum>);},saveFramework:async frame=>{frames++;return {saved:true,...frame.identity};},saveVerifiedStep:async value=>({saved:true,...value.identity,step_id:value.step_id}),saveOutcome:async value=>{saved=value;return {saved:true,...value.identity,outcome_id:value.outcome_id};}});
 await app.run({identity:f.identity,question:'比较一月和二月净销售额，保持口径不变',signal:new AbortController().signal});assert.equal(saw,true);assert.equal(calls,7);assert.equal(checks,2);assert.equal(frames,2);assert.equal(saved.calculation.value,'620');assert.equal(ledger.pending().length,0);assert.equal(ledger.read(f.identity.task_id).length,7);
});

test('V13-PLAN-REFERENCE-FEEDBACK088: repeated stale-reference correction cannot loop or claim a new computation',async()=>{
 const f=fixture();let checks=0,saved=0;const app=createOpenAnalysisApplication({agentLed:true,framework:{plan:f.plan} as any,loadSelectedSource:async()=>f.sources,isAuthorized:()=>true,verify:(...args:any[])=>{checks++;return verifyOpenAnalysisIntegerSum(...args as Parameters<typeof verifyOpenAnalysisIntegerSum>);},saveFramework:async frame=>({saved:true,...frame.identity}),saveVerifiedStep:async value=>({saved:true,...value.identity,step_id:value.step_id}),saveOutcome:async value=>{saved++;return {saved:true,...value.identity,outcome_id:value.outcome_id};},runtime:{run:async input=>{
  const read=input.tools.find(t=>t.name==='read_analysis_evidence')!,calculate=input.tools.find(t=>t.name==='calculate_and_verify')!,before:any=await read.execute({},input.signal);const variant=(period:string)=>({base_plan_ref:before.current_plan_ref,goal:period+'净额',changes:[{input_index:0,group_by:null,filters:[{column:'B',operator:'eq',value:period}]}]});const declared:any=await read.execute({required_variants:[variant('2026-01')]},input.signal);await calculate.execute({calculation_ref:declared.required_calculations[0].calculation_ref},input.signal);const stale={required_variants:[variant('2026-02')]};const result:any=await read.execute(stale,input.signal);assert.equal(result.status,'needs_current_plan');assert.equal(checks,1);await read.execute(stale,input.signal);throw Error('repeated stale reference accepted');
 }}});
 await assert.rejects(()=>app.run({identity:f.identity,question:'比较两期净额',signal:new AbortController().signal}),{code:'CANDIDATE_REFERENCE_INVALID'});assert.equal(checks,1);assert.equal(saved,0);
});
for(const boundary of ['complete','revoke','cancel'])test(`V13-GOAL-REVIEW01 / AU-01 (${boundary}): one goal review never forces collaboration or passes authority and stop boundaries`,async()=>{
 const f=fixture(),controller=new AbortController();let calls=0,queued=0,saves=0,authorized=true;
 const app=createOpenAnalysisApplication({agentLed:true,collaboration:{materials:async()=>[],results:async()=>[],queue:async()=>{queued++;throw new Error('unexpected forced collaboration');},drain:async()=>{throw new Error('unexpected forced collaboration');}},runtime:{historyOwnership:'runtime',run:async input=>{
  calls++;
  if(calls===1){await input.tools.find(t=>t.name==='calculate_and_verify')!.execute({plan:openAnalysisProposal(f.plan)},input.signal);if(boundary==='revoke')authorized=false;if(boundary==='cancel')controller.abort();return {text:'本次只需净额核算，已完成。',tools:[]};}
  assert.fail('AH-01: no host completion dispatch after the native agent finishes');
 }},loadSelectedSource:async()=>f.sources,isAuthorized:()=>authorized,saveFramework:async frame=>({saved:true,...frame.identity}),verify:verifyOpenAnalysisIntegerSum,saveVerifiedStep:async step=>({saved:true,step_id:step.step_id,...step.identity}),saveOutcome:async value=>{saves++;return {saved:true,outcome_id:value.outcome_id,...value.identity};}});
 const run=()=>app.run({identity:f.identity,question:'只核算净额，不调查原因',signal:controller.signal});
 if(boundary==='complete'){assert.equal((await run()).state,'saved');assert.equal(calls,1);assert.equal(saves,1);}else{await assert.rejects(run,{code:boundary==='revoke'?'AUTHORITY_REQUIRED':'CANCELLED'});assert.equal(calls,1);assert.equal(saves,0);}
 assert.equal(queued,0);
});


test('V13-SAVED-RECIPE103: installed native consumer rebinds saved step recipes by current candidate reference without inheriting facts',async()=>{
 const {createPiSessionOpenAnalysisRuntime}=await import('../../../adapters/agent-pi/native-open-analysis.ts');const {createApprovedProviderCredentials}=await import('../../../adapters/agent-pi/provider-credentials.ts');const {createLocalAnalysisRequestLedger}=await import('../../../adapters/storage-local/analysis-request-ledger.ts');const {browserEvidenceRoot}=await import('../../fixtures/xanthil-desktop/browser-evidence.ts');
 const f=fixture(),root=mkdtempSync(join(browserEvidenceRoot,'saved-recipe103-')),ledger=createLocalAnalysisRequestLedger({projectRoot:root});let calls=0;const refs:string[]=[];
 const january=compileOpenAnalysisIR({...openAnalysisProposal(f.plan),goal:'一月净额',inputs:(openAnalysisProposal(f.plan) as any).inputs.map((v:any,i:number)=>i===0?{...v,group_by:null,filters:[{column:'B',operator:'eq',value:'2026-01'}]}:v)},f.sources);
 const february=compileOpenAnalysisIR({...openAnalysisProposal(f.plan),goal:'二月净额',inputs:(openAnalysisProposal(f.plan) as any).inputs.map((v:any,i:number)=>i===0?{...v,group_by:null,filters:[{column:'B',operator:'eq',value:'2026-02'}]}:v)},f.sources);
 const saved={plan:f.plan,steps:{version:'1.0',steps:[{title:'一月',framework:{plan:january}},{title:'二月',framework:{plan:february}}]}};
 const runtime=createPiSessionOpenAnalysisRuntime({projectRoot:root,ledger,nativeObjectArguments:true,credentials:createApprovedProviderCredentials({environment:{}}),modelTransport:async request=>{
  calls++;if(calls===1){assert.ok(request.messages.some(m=>m.text.includes('CURRENT_SAVED_RECIPE_REFERENCES_AVAILABLE')),'preparation must disclose existing current recipe-reference consumer');return {content:[{kind:'tool',id:'read-saved-recipes',name:'read_analysis_evidence',arguments:{}}],stop:'tools',usage:{inputTokens:4,outputTokens:2}};}
  if(calls===2){const receipt=JSON.parse(request.messages.filter(m=>m.role==='tool').at(-1)!.text);assert.ok(Array.isArray(receipt.saved_recipe_candidates),'missing recompiled saved candidate projection');assert.equal(receipt.calculation_performed,false);assert.equal(receipt.framework_saved,false);assert.deepEqual(receipt.verified_calculations,[]);assert.equal(receipt.saved_recipe_candidates.length,2);assert.deepEqual(receipt.saved_recipe_candidates.map((c:any)=>c.recipe.inputs[0].filters[0].value),['2026-01','2026-02']);refs.push(...receipt.saved_recipe_candidates.map((c:any)=>c.plan_ref));assert.ok(refs.every(r=>r.startsWith('candidate:')));return {content:[{kind:'tool',id:'bind-saved-recipes',name:'set_analysis_steps',arguments:{version:'1.0',update_mode:'replace',steps:refs.map((plan_ref,i)=>({title:i?'本版二月':'本版一月',plan_ref,depends_on:[],hypotheses:[],required_evidence:['实际订单及退款'],limitations:['不推断原因']}))}}],stop:'tools',usage:{inputTokens:4,outputTokens:2}};}
  assert.equal(calls,3);const receipt=JSON.parse(request.messages.filter(m=>m.role==='tool').at(-1)!.text);assert.equal(receipt.total_steps,2);return {content:[{kind:'text',text:'本版两期方案已重新绑定，尚未计算。'}],stop:'complete',usage:{inputTokens:4,outputTokens:2}};
 }});
 const app=createOpenAnalysisApplication({proposalOnly:true,framework:{plan:f.plan} as any,savedRecipes:[january,february],runtime,loadSelectedSource:async()=>f.sources,isAuthorized:()=>true,verify:()=>assert.fail('preparation must not verify'),saveFramework:async()=>assert.fail('preparation must not adopt'),saveOutcome:async()=>assert.fail('preparation must not save facts')});
 const result:any=await app.run({identity:f.identity,question:'比较两期净额，保留原口径',signal:new AbortController().signal});assert.equal(result.state,'proposal');assert.equal(calls,3);assert.equal(result.framework.steps.steps.length,2);assert.deepEqual(result.framework.steps.steps.map((s:any)=>{const value=executeOpenAnalysisIR(s.framework.plan,f.sources);return verifyOpenAnalysisIntegerSum(s.framework.plan,value,f.sources).value;}),['430','620']);assert.equal(ledger.pending().length,0);
});


test('V13-SAVED-RECIPE103: unavailable source and changed Context never inherit a saved candidate or execution',async()=>{
 for(const mode of ['missing-source','changed-context']){
  const f=fixture();let checked=false;const recipe=mode==='missing-source'?{...f.plan,inputs:f.plan.inputs!.map((v:any,i:number)=>i===0?{...v,source_id:randomUUID()}:v)}:f.plan;
  const app=createOpenAnalysisApplication({proposalOnly:true,framework:{plan:f.plan,steps:{version:'1.0',steps:[{title:'历史净额',framework:{plan:recipe}}]}} as any,loadSelectedSource:async()=>f.sources,isAuthorized:()=>true,verify:()=>assert.fail('no calculation'),saveFramework:async()=>assert.fail('no adoption'),saveOutcome:async()=>assert.fail('no result'),runtime:{run:async input=>{
   const read=input.tools.find(t=>t.name==='read_analysis_evidence')!,first:any=await read.execute({},input.signal);
   if(mode==='missing-source'){assert.deepEqual(first.saved_recipe_candidates,[]);assert.equal(first.unavailable_saved_recipes.length,1);assert.equal(first.framework_saved,false);}
   else{const handle=first.saved_recipe_candidates[0].plan_ref;await input.tools.find(t=>t.name==='describe_business')!.execute({purpose:'仅看一月净额',object:'订单及关联退款',scope:'一月',deliverables:['净额'],hypotheses:[],unknowns:[],execution_scope:[{source_id:f.sources.sources[0].source_id,sheet_id:f.sources.sources[0].sheets[0].sheet_id,filters:[{column:'B',operator:'eq',value:'2026-01'}]},{source_id:f.sources.sources[1].source_id,sheet_id:f.sources.sources[1].sheets[0].sheet_id,filters:[]}]},input.signal);
    const bind=input.tools.find(t=>t.name==='set_analysis_steps')!,staleArgs={version:'1.0',steps:[{title:'不能沿用旧Context',plan_ref:handle,depends_on:[],hypotheses:[],required_evidence:[],limitations:[]}]};const refused:any=await bind.execute(staleArgs,input.signal);assert.equal(refused.status,'needs_current_candidate');assert.equal(refused.calculation_performed,false);assert.equal(refused.framework_saved,false);await assert.rejects(()=>bind.execute(staleArgs,input.signal),{code:'CANDIDATE_REFERENCE_INVALID'});
   }checked=true;return {text:'历史方案需要重新核对，不沿用结果。',tools:[]};
  }}});const operation=app.run({identity:f.identity,question:'讨论方案适用性',signal:new AbortController().signal});if(mode==='changed-context')await assert.rejects(operation,{code:'CANDIDATE_REFERENCE_INVALID'});else await operation;assert.equal(checked,true);
 }
});

test('V13-PLAN-REFERENCE104: actual native execution appends explicit scope variants from current accepted step recipe, then independently computes both periods',async()=>{
 const {compileOpenAnalysisSteps}=await import('../../../packages/product-core/open-analysis-steps.ts');const {createPiSessionOpenAnalysisRuntime}=await import('../../../adapters/agent-pi/native-open-analysis.ts');const {createApprovedProviderCredentials}=await import('../../../adapters/agent-pi/provider-credentials.ts');const {createLocalAnalysisRequestLedger}=await import('../../../adapters/storage-local/analysis-request-ledger.ts');const {browserEvidenceRoot}=await import('../../fixtures/xanthil-desktop/browser-evidence.ts');
 const f=fixture(),root=mkdtempSync(join(browserEvidenceRoot,'reference104-')),ledger=createLocalAnalysisRequestLedger({projectRoot:root});let calls=0;let ids:string[]=[];let originalStep='';
 const graph=compileOpenAnalysisSteps({version:'1.0',steps:[{step_id:randomUUID(),title:'保留总体净额',plan:openAnalysisProposal(f.plan),depends_on:[],hypotheses:[],required_evidence:[],limitations:[]}]},f.sources,'两期净额比较');
 const runtime=createPiSessionOpenAnalysisRuntime({projectRoot:root,ledger,nativeObjectArguments:true,credentials:createApprovedProviderCredentials({environment:{}}),modelTransport:async request=>{
  calls++;if(calls===1)return {content:[{kind:'tool',id:'read-current-recipes',name:'read_analysis_evidence',arguments:{}}],stop:'tools',usage:{inputTokens:4,outputTokens:2}};
  if(calls===2){const result=JSON.parse(request.messages.filter(m=>m.role==='tool').at(-1)!.text);assert.equal(result.current_step_recipes.length,1,'actual accepted recipe references must be discoverable in execution');originalStep=result.current_steps.steps[0].step_id;const candidate=result.current_step_recipes[0];assert.equal(candidate.recipe.inputs[0].group_by,'B');assert.deepEqual(candidate.recipe.inputs[0].filters,[]);assert.deepEqual(result.verified_calculations,[]);return {content:[{kind:'tool',id:'append-explicit-variants',name:'set_analysis_steps',arguments:{version:'1.0',update_mode:'append',steps:['2026-01','2026-02'].map((period,i)=>({title:i?'当前二月净额':'当前一月净额',plan_ref:candidate.plan_ref,changes:[{input_index:0,group_by:null,filters:[{column:'B',operator:'eq',value:period}]}],depends_on:[],hypotheses:[],required_evidence:['原始订单及退款'],limitations:['无原因字段']}))}}],stop:'tools',usage:{inputTokens:4,outputTokens:2}};}
  if(calls===3){const result=JSON.parse(request.messages.filter(m=>m.role==='tool').at(-1)!.text);assert.equal(result.total_steps,3);ids=result.steps.steps.map((s:any)=>s.step_id);assert.equal(ids.length,2);return {content:ids.map((step_id,i)=>({kind:'tool' as const,id:'compute-variant-'+i,name:'execute_step',arguments:{step_id}})),stop:'tools',usage:{inputTokens:4,outputTokens:2}};}
  if(calls===4){const facts=request.messages.filter(m=>m.role==='tool').slice(-2).map(m=>JSON.parse(m.text));assert.deepEqual(facts.map(f=>f.calculation.value),['430','620']);assert.deepEqual(facts.map(f=>f.verification.value),['430','620']);return {content:[{kind:'tool',id:'compute-retained-original',name:'execute_step',arguments:{step_id:originalStep}}],stop:'tools',usage:{inputTokens:4,outputTokens:2}};}assert.equal(calls,5);return {content:[{kind:'text',text:'两期实际净额分别430元、620元，已按原始资料独立核算；不推断原因。'}],stop:'complete',usage:{inputTokens:4,outputTokens:2}};
 }});
 const admissions:unknown[]=[];const saveStepEvent=async(value:any)=>{assert.equal(value.version,'1.0');assert.equal(value.identity.task_id,f.identity.task_id);assert.match(value.step_id,/^[a-f0-9-]{36}$/);admissions.push(structuredClone(value));return {saved:true as const,...f.identity};};
 const app=createOpenAnalysisApplication({agentLed:true,requireDeclaredCalculations:true,framework:{plan:f.plan,steps:graph} as any,runtime,loadSelectedSource:async()=>f.sources,isAuthorized:()=>true,verify:async(p,v,s)=>verifyOpenAnalysisIntegerSum(p,v,s),saveStepEvent,saveFramework:async()=>({saved:true,...f.identity}),saveVerifiedStep:async value=>({saved:true,...f.identity,step_id:value.step_id}),saveOutcome:async value=>({saved:true,...f.identity,outcome_id:value.outcome_id})});
 const result=await app.run({identity:f.identity,question:'两期净额比较',signal:new AbortController().signal});assert.equal(result.state,'saved');assert.equal(admissions.filter((v:any)=>v.phase==='running').length,3);assert.equal(calls,5);assert.equal(ledger.pending().length,0);
});


test('V13-PLAN-REFERENCE104: unknown changed Context and outside business scope variants cannot append save or calculate',async()=>{
 const {compileOpenAnalysisSteps}=await import('../../../packages/product-core/open-analysis-steps.ts');
 for(const mode of ['unknown','changed-context','outside-scope']){
  const f=fixture(),question='只看一月净额',business={classification:'MODEL_PROPOSAL',purpose:question,object:'订单及退款',scope:'一月订单',deliverables:['净额'],hypotheses:[],unknowns:[],execution_scope:[{source_id:f.sources.sources[0]!.source_id,sheet_id:f.sources.sources[0]!.sheets[0]!.sheet_id,filters:[{column:'B',operator:'eq',value:'2026-01'}]},{source_id:f.sources.sources[1]!.source_id,sheet_id:f.sources.sources[1]!.sheets[0]!.sheet_id,filters:[]}]};
  const proposal={...openAnalysisProposal(f.plan),inputs:(openAnalysisProposal(f.plan) as any).inputs.map((v:any,i:number)=>i===0?{...v,group_by:null,filters:[{column:'B',operator:'eq',value:'2026-01'}]}:v)};
  const context=compileOpenAnalysisContext(proposal,question,f.sources,business as any),plan=compileOpenAnalysisIR(context.proposal.plan,f.sources),graph=compileOpenAnalysisSteps({version:'1.0',steps:[{step_id:randomUUID(),title:'一月净额',plan:context.proposal.plan,depends_on:[],hypotheses:[],required_evidence:[],limitations:[]}]},f.sources,question,business as any);let rejected='';
  const app=createOpenAnalysisApplication({agentLed:true,framework:{plan,context,steps:graph} as any,loadSelectedSource:async()=>f.sources,isAuthorized:()=>true,verify:()=>assert.fail('no rejected variant calculation'),saveFramework:async()=>assert.fail('no rejected variant persistence'),saveOutcome:async()=>assert.fail('no rejected outcome'),saveClarification:async()=>({saved:true,...f.identity}),runtime:{run:async input=>{
   const result:any=await input.tools.find(t=>t.name==='read_analysis_evidence')!.execute({},input.signal);let handle=result.current_step_recipes[0].plan_ref;
   if(mode==='unknown')handle='candidate:'+randomUUID();
   if(mode==='changed-context')await input.tools.find(t=>t.name==='describe_business')!.execute({purpose:question+'审查',object:'订单及退款',scope:'一月',deliverables:['核算'],hypotheses:[],unknowns:[],execution_scope:business.execution_scope},input.signal);
   const tool=input.tools.find(t=>t.name==='set_analysis_steps')!,args={version:'1.0',update_mode:'append',steps:[{title:'二月',plan_ref:handle,changes:[{input_index:0,filters:[{column:'B',operator:'eq',value:'2026-02'}]}],depends_on:[],hypotheses:[],required_evidence:[],limitations:[]}]};try{if(mode==='unknown'||mode==='changed-context'){const feedback:any=await tool.execute(args,input.signal);assert.equal(feedback.status,'needs_current_candidate');assert.equal(feedback.calculation_performed,false);assert.equal(feedback.framework_saved,false);assert.equal(feedback.next_tool,'read_analysis_evidence');}const first:any=await tool.execute(args,input.signal);assert.equal(mode,'outside-scope');assert.equal(first.status,'needs_information');assert.equal(first.code,'FRAMEWORK_REVISION_REQUIRED');rejected=first.code;return {text:'当前范围未修改，未计算二月。',tools:[]};}catch(error){rejected=String((error as any).code);throw error;}assert.fail('invalid reference/scope accepted');
  }}});const operation=app.run({identity:f.identity,question,signal:new AbortController().signal});if(mode==='outside-scope'){assert.equal((await operation).state,'waiting');assert.equal(rejected,'FRAMEWORK_REVISION_REQUIRED');}else{await assert.rejects(operation,{code:'CANDIDATE_REFERENCE_INVALID'});assert.equal(rejected,'CANDIDATE_REFERENCE_INVALID');}
 }
});

test('V13-STALE-CANDIDATE105: actual native preparation rejects stale summary handle without effect then explicit current read and binding succeeds',async()=>{
 const {createPiSessionOpenAnalysisRuntime}=await import('../../../adapters/agent-pi/native-open-analysis.ts'),{createApprovedProviderCredentials}=await import('../../../adapters/agent-pi/provider-credentials.ts'),{createLocalAnalysisRequestLedger}=await import('../../../adapters/storage-local/analysis-request-ledger.ts');
 const f=fixture(),root=mkdtempSync(join(realpathSync(tmpdir()),'open-stale-reference105-')),ledger=createLocalAnalysisRequestLedger({projectRoot:root});let calls=0;const old='candidate:'+randomUUID();const node=(plan_ref:string)=>({title:'本版实际净额',plan_ref,depends_on:[],hypotheses:[],required_evidence:['原始订单及退款'],limitations:['不推断原因']});
 const runtime=createPiSessionOpenAnalysisRuntime({projectRoot:root,ledger,nativeObjectArguments:true,credentials:createApprovedProviderCredentials({environment:{}}),modelTransport:async request=>{
  calls++;if(calls===1)return {content:[{kind:'tool',id:'stale-summary-handle',name:'set_analysis_steps',arguments:{version:'1.0',steps:[node(old)]}}],stop:'tools',usage:{inputTokens:4,outputTokens:2}};
  const result=JSON.parse(request.messages.filter(m=>m.role==='tool').at(-1)!.text);
  if(calls===2){assert.equal(result.status,'needs_current_candidate');assert.equal(result.calculation_performed,false);assert.equal(result.framework_saved,false);return {content:[{kind:'tool',id:'explicit-current-read',name:'read_analysis_evidence',arguments:{}}],stop:'tools',usage:{inputTokens:4,outputTokens:2}};}
  if(calls===3){const fresh=result.saved_recipe_candidates[0].plan_ref;assert.notEqual(fresh,old);assert.deepEqual(result.verified_calculations,[]);return {content:[{kind:'tool',id:'explicit-current-bind',name:'set_analysis_steps',arguments:{version:'1.0',steps:[node(fresh)]}}],stop:'tools',usage:{inputTokens:4,outputTokens:2}};}
  assert.equal(calls,4);assert.equal(result.total_steps,1);return {content:[{kind:'text',text:'已按本轮实际方案重新绑定，未计算。'}],stop:'complete',usage:{inputTokens:4,outputTokens:2}};
 }});const app=createOpenAnalysisApplication({proposalOnly:true,framework:{plan:f.plan} as any,savedRecipes:[f.plan],runtime,loadSelectedSource:async()=>f.sources,isAuthorized:()=>true,verify:()=>assert.fail('no prep verification'),saveFramework:async()=>assert.fail('no prep adoption'),saveOutcome:async()=>assert.fail('no prep outcome')});const result:any=await app.run({identity:f.identity,question:'接续同一净额分析',signal:new AbortController().signal});assert.equal(result.state,'proposal');assert.equal(calls,4);assert.equal(result.framework.steps.steps.length,1);assert.equal(ledger.pending().length,0);
});

test('V13-CONTEXT-REFERENCE106: actual native preparation rejects stale summary handle without effect then explicit current read and binding succeeds',async()=>{
 const {createPiSessionOpenAnalysisRuntime}=await import('../../../adapters/agent-pi/native-open-analysis.ts'),{createApprovedProviderCredentials}=await import('../../../adapters/agent-pi/provider-credentials.ts'),{createLocalAnalysisRequestLedger}=await import('../../../adapters/storage-local/analysis-request-ledger.ts');
 const f=fixture(),root=mkdtempSync(join(realpathSync(tmpdir()),'open-context-reference106-')),ledger=createLocalAnalysisRequestLedger({projectRoot:root});let calls=0,old='';const node=(plan_ref:string)=>({title:'本版实际净额',plan_ref,depends_on:[],hypotheses:[],required_evidence:['原始订单及退款'],limitations:['不推断原因']});
 const runtime=createPiSessionOpenAnalysisRuntime({projectRoot:root,ledger,nativeObjectArguments:true,credentials:createApprovedProviderCredentials({environment:{}}),modelTransport:async request=>{
  calls++;if(calls===1)return {content:[{kind:'tool',id:'current-read-before-meaning',name:'read_analysis_evidence',arguments:{}}],stop:'tools',usage:{inputTokens:4,outputTokens:2}};
  const result=JSON.parse(request.messages.filter(m=>m.role==='tool').at(-1)!.text);
  if(calls===2){old=result.saved_recipe_candidates[0].plan_ref;return {content:[{kind:'tool',id:'actual-business-update',name:'describe_business',arguments:{purpose:'比较当前净额与期间变化',object:'选定订单与退款',scope:'选定全部记录',deliverables:['净额及变化'],hypotheses:[],unknowns:[]}}],stop:'tools',usage:{inputTokens:4,outputTokens:2}};}
  if(calls===3)return {content:[{kind:'tool',id:'old-context-bind',name:'set_analysis_steps',arguments:{version:'1.0',steps:[node(old)]}}],stop:'tools',usage:{inputTokens:4,outputTokens:2}};
  if(calls===4){assert.equal(result.status,'needs_current_candidate');assert.equal(result.calculation_performed,false);assert.equal(result.framework_saved,false);return {content:[{kind:'tool',id:'explicit-read-after-context',name:'read_analysis_evidence',arguments:{}}],stop:'tools',usage:{inputTokens:4,outputTokens:2}};}
  if(calls===5){const fresh=result.saved_recipe_candidates[0].plan_ref;assert.notEqual(fresh,old);assert.deepEqual(result.verified_calculations,[]);return {content:[{kind:'tool',id:'fresh-context-bind',name:'set_analysis_steps',arguments:{version:'1.0',steps:[node(fresh)]}}],stop:'tools',usage:{inputTokens:4,outputTokens:2}};}
  assert.equal(calls,6);assert.equal(result.total_steps,1);return {content:[{kind:'text',text:'已按本轮实际业务重新绑定，未计算。'}],stop:'complete',usage:{inputTokens:4,outputTokens:2}};
 }});const app=createOpenAnalysisApplication({proposalOnly:true,framework:{plan:f.plan} as any,savedRecipes:[f.plan],runtime,loadSelectedSource:async()=>f.sources,isAuthorized:()=>true,verify:()=>assert.fail('no prep verification'),saveFramework:async()=>assert.fail('no prep adoption'),saveOutcome:async()=>assert.fail('no prep outcome')});const result:any=await app.run({identity:f.identity,question:'接续同一净额分析',signal:new AbortController().signal});assert.equal(result.state,'proposal');assert.equal(calls,6);assert.equal(result.framework.steps.steps.length,1);assert.equal(ledger.pending().length,0);
});

test('V13-FOCUSED-TOOL107: actual native preparation rejects stale summary handle without effect then explicit current read and binding succeeds',async()=>{
 const {createPiSessionOpenAnalysisRuntime}=await import('../../../adapters/agent-pi/native-open-analysis.ts'),{createApprovedProviderCredentials}=await import('../../../adapters/agent-pi/provider-credentials.ts'),{createLocalAnalysisRequestLedger}=await import('../../../adapters/storage-local/analysis-request-ledger.ts');
 const f=fixture(),root=mkdtempSync(join(realpathSync(tmpdir()),'open-focused107-')),ledger=createLocalAnalysisRequestLedger({projectRoot:root});let calls=0,old='';const node=(plan_ref:string)=>({title:'本版实际净额',plan_ref,depends_on:[],hypotheses:[],required_evidence:['原始订单及退款'],limitations:['不推断原因']});
 const runtime=createPiSessionOpenAnalysisRuntime({projectRoot:root,ledger,nativeObjectArguments:true,credentials:createApprovedProviderCredentials({environment:{}}),modelTransport:async request=>{
  calls++;
  const declared=request.messages.flatMap(m=>m.tools??[]);
  
  const joined=declared.find(t=>t.name==='set_joined_framework');
  assert.ok(joined,'actual native schema declares joined tool');
  assert.equal(Object.hasOwn(joined.parameters.properties,'inputs'),false,'bound producer must not expose complete joined IR');
  const steps=declared.find(t=>t.name==='set_analysis_steps');
  assert.equal(Object.hasOwn(steps.parameters.properties.steps.items.properties,'plan'),false,'bound producer must select actual recipe');
  assert.ok(steps.parameters.properties.steps.items.required.includes('plan_ref'));
  assert.equal(Object.hasOwn(declared.find(t=>t.name==='read_analysis_evidence').parameters.properties,'required_plans'),false);
  assert.ok(declared.find(t=>t.name==='set_framework'),'new single-source methods remain available');
  if(calls===1)return {content:[{kind:'tool',id:'current-read-before-meaning',name:'read_analysis_evidence',arguments:{}}],stop:'tools',usage:{inputTokens:4,outputTokens:2}};
  const result=JSON.parse(request.messages.filter(m=>m.role==='tool').at(-1)!.text);
  if(calls===2){old=result.saved_recipe_candidates[0].plan_ref;return {content:[{kind:'tool',id:'actual-business-update',name:'describe_business',arguments:{purpose:'比较当前净额与期间变化',object:'选定订单与退款',scope:'选定全部记录',deliverables:['净额及变化'],hypotheses:[],unknowns:[]}}],stop:'tools',usage:{inputTokens:4,outputTokens:2}};}
  if(calls===3)return {content:[{kind:'tool',id:'old-context-bind',name:'set_analysis_steps',arguments:{version:'1.0',steps:[node(old)]}}],stop:'tools',usage:{inputTokens:4,outputTokens:2}};
  if(calls===4){assert.equal(result.status,'needs_current_candidate');assert.equal(result.calculation_performed,false);assert.equal(result.framework_saved,false);return {content:[{kind:'tool',id:'explicit-read-after-context',name:'read_analysis_evidence',arguments:{}}],stop:'tools',usage:{inputTokens:4,outputTokens:2}};}
  if(calls===5){const fresh=result.saved_recipe_candidates[0].plan_ref;assert.notEqual(fresh,old);assert.deepEqual(result.verified_calculations,[]);return {content:[{kind:'tool',id:'fresh-context-bind',name:'set_analysis_steps',arguments:{version:'1.0',steps:[node(fresh)]}}],stop:'tools',usage:{inputTokens:4,outputTokens:2}};}
  assert.equal(calls,6);assert.equal(result.total_steps,1);return {content:[{kind:'text',text:'已按本轮实际业务重新绑定，未计算。'}],stop:'complete',usage:{inputTokens:4,outputTokens:2}};
 }});const app=createOpenAnalysisApplication({proposalOnly:true,framework:{plan:f.plan} as any,savedRecipes:[f.plan],runtime,loadSelectedSource:async()=>f.sources,isAuthorized:()=>true,verify:()=>assert.fail('no prep verification'),saveFramework:async()=>assert.fail('no prep adoption'),saveOutcome:async()=>assert.fail('no prep outcome')});const result:any=await app.run({identity:f.identity,question:'接续同一净额分析',signal:new AbortController().signal});assert.equal(result.state,'proposal');assert.equal(calls,6);assert.equal(result.framework.steps.steps.length,1);assert.equal(ledger.pending().length,0);
});


test('V13-FOCUSED107 compatibility: unbound task retains full method builder; old program executor can still bind complete proposal with actual verification',async()=>{
 for(const bound of [false,true]){const f=fixture();let observed=false;
 const app=createOpenAnalysisApplication({proposalOnly:true,...(bound?{framework:{plan:f.plan} as any}:{}),runtime:{run:async input=>{
  const joined=input.tools.find(t=>t.name==='set_joined_framework')!;const schema:any=joined.parameters;if(bound){assert.equal(Object.hasOwn(schema.properties,'inputs'),false);assert.deepEqual(schema.required,['plan_ref','goal']);}else{assert.ok(schema.properties.inputs);assert.equal(schema.anyOf.length,2);}
  const proposal:any=openAnalysisProposal(f.plan);const {version,...raw}=proposal;
  const result:any=await joined.execute(raw,input.signal);assert.ok(result.current_plan_ref);observed=true;return {text:'方案已绑定，未执行。',tools:[]};
 }},loadSelectedSource:async()=>f.sources,isAuthorized:()=>true,verify:()=>assert.fail('no preparation verification'),saveFramework:async()=>assert.fail('no preparation adoption'),saveOutcome:async()=>assert.fail('no preparation outcome')});
 const result:any=await app.run({identity:f.identity,question:'净额分析',signal:new AbortController().signal});assert.equal(observed,true);assert.equal(result.state,'proposal');const computed=executeOpenAnalysisIR(result.framework.plan,f.sources);assert.deepEqual(computed.groups?.map(g=>({key:g.key,value:g.value})),[{key:'2026-01',value:'430'},{key:'2026-02',value:'620'}]);assert.equal(verifyOpenAnalysisIntegerSum(result.framework.plan,computed,f.sources).value,computed.value);}
});

test('V13-CURRENT-CHOICES108: native current choices follow actual read, invalidate on Context update, and require explicit fresh selection',async()=>{
 const {createPiSessionOpenAnalysisRuntime}=await import('../../../adapters/agent-pi/native-open-analysis.ts'),{createApprovedProviderCredentials}=await import('../../../adapters/agent-pi/provider-credentials.ts'),{createLocalAnalysisRequestLedger}=await import('../../../adapters/storage-local/analysis-request-ledger.ts');
 const f=fixture(),root=mkdtempSync(join(realpathSync(tmpdir()),'open-current-choices108-')),ledger=createLocalAnalysisRequestLedger({projectRoot:root});let calls=0,old='';
 const node=(plan_ref:string,period:string)=>({title:'实际净额 '+period,plan_ref,changes:[{input_index:0,group_by:null,filters:[{column:'B',operator:'eq',value:period}]}],depends_on:[],hypotheses:[],required_evidence:['原始订单及退款'],limitations:['无原因字段']});
 const runtime=createPiSessionOpenAnalysisRuntime({projectRoot:root,ledger,nativeObjectArguments:true,credentials:createApprovedProviderCredentials({environment:{}}),modelTransport:async request=>{
  calls++;const declared=request.messages.flatMap(m=>m.tools??[]),ref:any=declared.find(t=>t.name==='set_analysis_steps')!.parameters.properties.steps.items.properties.plan_ref;
  for(const name of ['set_framework','set_joined_framework']){
   const schema:any=declared.find(t=>t.name===name)!.parameters;
   const current:any=schema.properties.plan_ref;
   assert.ok(current,name+' existing current-plan reference branch remains');
   if(calls===1||calls===3){assert.equal(current.enum,undefined);assert.equal(new RegExp(current.pattern??'').test('a'.repeat(64)),false,'all empty current-reference alternatives reject historical guesses');}
   else if(calls===2||calls===4){const feedback=JSON.parse(request.messages.filter(m=>m.role==='tool').at(-1)!.text);if(feedback.current_plan_ref)assert.deepEqual(current.enum,[feedback.current_plan_ref]);else assert.equal(new RegExp(current.pattern??'').test('a'.repeat(64)),false);}
   if(name!=='set_joined_framework')assert.ok(schema.anyOf[1],'new method full builder remains available');
  }
  if(calls===1){assert.equal(ref.enum,undefined);assert.equal(new RegExp(ref.pattern??'').test('candidate:'+randomUUID()),false,'no issued choices must not permit arbitrary historical handles');return {content:[{kind:'tool',id:'read-before-context',name:'read_analysis_evidence',arguments:{}}],stop:'tools',usage:{inputTokens:4,outputTokens:2}};}
  const result=JSON.parse(request.messages.filter(m=>m.role==='tool').at(-1)!.text);
  if(calls===2){old=result.saved_recipe_candidates[0].plan_ref;assert.deepEqual(ref.enum,result.saved_recipe_candidates.map((x:any)=>x.plan_ref),'actual native producer enumerates only real read choices');assert.equal(ref.enum.includes('candidate:'+randomUUID()),false);return {content:[{kind:'tool',id:'change-business-context',name:'describe_business',arguments:{purpose:'比较当前净额与期间变化',object:'选定订单与退款',scope:'选定全部记录',deliverables:['净额及变化'],hypotheses:[],unknowns:[]}}],stop:'tools',usage:{inputTokens:4,outputTokens:2}};}
  if(calls===3){assert.equal(ref.enum?.includes(old)??false,false,'Context update withdraws prior choices');assert.equal(new RegExp(ref.pattern??'').test(old),false,'no implicit fresh read or stale mapping');return {content:[{kind:'tool',id:'explicit-read-current-context',name:'read_analysis_evidence',arguments:{}}],stop:'tools',usage:{inputTokens:4,outputTokens:2}};}
  if(calls===4){const fresh=result.saved_recipe_candidates[0].plan_ref;assert.notEqual(fresh,old);assert.deepEqual(ref.enum,result.saved_recipe_candidates.map((x:any)=>x.plan_ref));assert.deepEqual(result.verified_calculations,[]);return {content:[{kind:'tool',id:'explicit-select-actual-current-recipes',name:'set_analysis_steps',arguments:{version:'1.0',steps:[node(fresh,'2026-01'),node(fresh,'2026-02')]}}],stop:'tools',usage:{inputTokens:4,outputTokens:2}};}
  assert.equal(calls,5);assert.equal(result.total_steps,2);return {content:[{kind:'text',text:'已保存本轮方案供选择，尚未分析。'}],stop:'complete',usage:{inputTokens:4,outputTokens:2}};
 }});
 const app=createOpenAnalysisApplication({proposalOnly:true,framework:{plan:f.plan} as any,savedRecipes:[f.plan],runtime,loadSelectedSource:async()=>f.sources,isAuthorized:()=>true,verify:()=>assert.fail('no preparation computation'),saveFramework:async()=>assert.fail('no preparation adoption'),saveOutcome:async()=>assert.fail('no preparation outcome')});
 const result:any=await app.run({identity:f.identity,question:'比较当前两期净额',signal:new AbortController().signal});assert.equal(result.state,'proposal');assert.equal(calls,5);assert.equal(ledger.pending().length,0);
 const facts=result.framework.steps.steps.map((s:any)=>{const calculation=executeOpenAnalysisIR(s.framework.plan,f.sources);return {value:calculation.value,verified:verifyOpenAnalysisIntegerSum(s.framework.plan,calculation,f.sources).value};});assert.deepEqual(facts,[{value:'430',verified:'430'},{value:'620',verified:'620'}]);
});


test('V13-CURRENT-CHOICES108 execution: native model selects current recipe, reads live contract, and independently computes distinct periods',async()=>{
 const {compileOpenAnalysisSteps}=await import('../../../packages/product-core/open-analysis-steps.ts');const {createPiSessionOpenAnalysisRuntime}=await import('../../../adapters/agent-pi/native-open-analysis.ts');const {createApprovedProviderCredentials}=await import('../../../adapters/agent-pi/provider-credentials.ts');const {createLocalAnalysisRequestLedger}=await import('../../../adapters/storage-local/analysis-request-ledger.ts');const {browserEvidenceRoot}=await import('../../fixtures/xanthil-desktop/browser-evidence.ts');
 const f=fixture(),root=mkdtempSync(join(browserEvidenceRoot,'choices108-execution-')),ledger=createLocalAnalysisRequestLedger({projectRoot:root});let calls=0;let ids:string[]=[];let originalStep='';let selected:any;let currentContract:any;
 const graph=compileOpenAnalysisSteps({version:'1.0',steps:[{step_id:randomUUID(),title:'保留总体净额',plan:openAnalysisProposal(f.plan),depends_on:[],hypotheses:[],required_evidence:[],limitations:[]}]},f.sources,'两期净额比较');
 const runtime=createPiSessionOpenAnalysisRuntime({projectRoot:root,ledger,nativeObjectArguments:true,credentials:createApprovedProviderCredentials({environment:{}}),modelTransport:async request=>{
  calls++;if(calls===1){const prompt=request.messages.filter(m=>m.role==='user').at(-1)!.text;const state=JSON.parse(prompt.split('CURRENT_BUSINESS_STATE:')[1].split(' 当前业务状态')[0]);assert.equal(state.current_framework_bound,true,'accepted execution stays bound');return {content:[{kind:'tool',id:'read-current-recipes',name:'read_analysis_evidence',arguments:{}}],stop:'tools',usage:{inputTokens:4,outputTokens:2}};}
  if(calls===2){const result=JSON.parse(request.messages.filter(m=>m.role==='tool').at(-1)!.text);selected=result;currentContract=request.messages.flatMap(m=>m.tools??[]).find(t=>t.name==='set_analysis_steps')!.parameters;assert.deepEqual(currentContract.properties.steps.items.properties.plan_ref.enum,result.current_step_recipes.map((c:any)=>c.plan_ref));return {content:[{kind:'tool',id:'read-live-reference-contract',name:'read_tool_contract',arguments:{name:'set_analysis_steps'}}],stop:'tools',usage:{inputTokens:4,outputTokens:2}};}
  if(calls===3){const contract=JSON.parse(request.messages.filter(m=>m.role==='tool').at(-1)!.text);assert.equal(contract.executed,false);assert.deepEqual(contract.parameters,currentContract);const result=selected;assert.equal(result.current_step_recipes.length,1,'actual accepted recipe references must be discoverable in execution');originalStep=result.current_steps.steps[0].step_id;const candidate=result.current_step_recipes[0];assert.equal(candidate.recipe.inputs[0].group_by,'B');assert.deepEqual(candidate.recipe.inputs[0].filters,[]);assert.deepEqual(result.verified_calculations,[]);return {content:[{kind:'tool',id:'append-explicit-variants',name:'set_analysis_steps',arguments:{version:'1.0',update_mode:'append',steps:['2026-01','2026-02'].map((period,i)=>({title:i?'当前二月净额':'当前一月净额',plan_ref:candidate.plan_ref,changes:[{input_index:0,group_by:null,filters:[{column:'B',operator:'eq',value:period}]}],depends_on:[],hypotheses:[],required_evidence:['原始订单及退款'],limitations:['无原因字段']}))}}],stop:'tools',usage:{inputTokens:4,outputTokens:2}};}
  if(calls===4){const result=JSON.parse(request.messages.filter(m=>m.role==='tool').at(-1)!.text);assert.equal(result.total_steps,3);ids=result.steps.steps.map((s:any)=>s.step_id);assert.equal(ids.length,2);return {content:ids.map((step_id,i)=>({kind:'tool' as const,id:'compute-variant-'+i,name:'execute_step',arguments:{step_id}})),stop:'tools',usage:{inputTokens:4,outputTokens:2}};}
  if(calls===5){const facts=request.messages.filter(m=>m.role==='tool').slice(-2).map(m=>JSON.parse(m.text));assert.deepEqual(facts.map(f=>f.calculation.value),['430','620']);assert.deepEqual(facts.map(f=>f.verification.value),['430','620']);return {content:[{kind:'tool',id:'compute-retained-original',name:'execute_step',arguments:{step_id:originalStep}}],stop:'tools',usage:{inputTokens:4,outputTokens:2}};}assert.equal(calls,6);return {content:[{kind:'text',text:'两期实际净额分别430元、620元，已按原始资料独立核算；不推断原因。'}],stop:'complete',usage:{inputTokens:4,outputTokens:2}};
 }});
 const admissions:unknown[]=[];const saveStepEvent=async(value:any)=>{assert.equal(value.version,'1.0');assert.equal(value.identity.task_id,f.identity.task_id);assert.match(value.step_id,/^[a-f0-9-]{36}$/);admissions.push(structuredClone(value));return {saved:true as const,...f.identity};};
 const app=createOpenAnalysisApplication({agentLed:true,collaboration:{materials:async()=>[],queue:async()=>assert.fail('no delegation in numeric mechanism test'),drain:async()=>assert.fail('no delegation drain'),results:async()=>[]},requireDeclaredCalculations:true,framework:{plan:f.plan,steps:graph} as any,runtime,loadSelectedSource:async()=>f.sources,isAuthorized:()=>true,verify:async(p,v,s)=>verifyOpenAnalysisIntegerSum(p,v,s),saveStepEvent,saveFramework:async()=>({saved:true,...f.identity}),saveVerifiedStep:async value=>({saved:true,...f.identity,step_id:value.step_id}),saveOutcome:async value=>({saved:true,...f.identity,outcome_id:value.outcome_id})});
 const result=await app.run({identity:f.identity,question:'两期净额比较',signal:new AbortController().signal});assert.equal(result.state,'saved');assert.equal(admissions.filter((v:any)=>v.phase==='running').length,3);assert.equal(calls,6);assert.equal(ledger.pending().length,0);
});


test('V13-CURRENT-CHOICES108 negatives: current options do not grant authority, hide source changes, or issue a guessed bound reference',async()=>{
 for(const boundary of ['unissued','revoked','source-changed'] as const){
  const f=fixture();let authorized=true,current=f.sources,effects=0;
  const app=createOpenAnalysisApplication({framework:{plan:f.plan} as any,runtime:{run:async input=>{
   if(boundary==='unissued'){
    const guessed=taskHash({identity:f.identity,context:taskHash({identity:f.identity,business:null,semantics:null}),plan:f.plan});
    await input.tools.find(t=>t.name==='set_joined_framework')!.execute({plan_ref:guessed,goal:'当前实际净额'},input.signal);
   }else{
    const result:any=await input.tools.find(t=>t.name==='read_analysis_evidence')!.execute({},input.signal);
    const joined=input.tools.find(t=>t.name==='set_joined_framework')!;
    assert.deepEqual((joined.modelParameters as any).properties.plan_ref.enum,[result.current_plan_ref]);
    if(boundary==='revoked')authorized=false;else{current=structuredClone(f.sources);current.sources[0].sha256='e'.repeat(64);}
    await joined.execute({plan_ref:result.current_plan_ref,goal:'当前实际净额'},input.signal);
   }
   assert.fail('no boundary may succeed');
  }},loadSelectedSource:async()=>current,isAuthorized:()=>authorized,verify:()=>{effects++;assert.fail('no calculation');},saveFramework:async()=>{effects++;assert.fail('no save');},saveOutcome:async()=>{effects++;assert.fail('no outcome');}});
  await assert.rejects(app.run({identity:f.identity,question:'核对净额',signal:new AbortController().signal}),{code:boundary==='unissued'?'CANDIDATE_REFERENCE_INVALID':boundary==='revoked'?'AUTHORITY_REQUIRED':'SOURCE_CHANGED'});
  assert.equal(effects,0);
 }
});


test('V13-SCOPE-CHOICES109: native preparation declares existing required scope before issuing choices, then explicitly reads and binds actual variants',async()=>{
 const {createPiSessionOpenAnalysisRuntime}=await import('../../../adapters/agent-pi/native-open-analysis.ts'),{createApprovedProviderCredentials}=await import('../../../adapters/agent-pi/provider-credentials.ts'),{createLocalAnalysisRequestLedger}=await import('../../../adapters/storage-local/analysis-request-ledger.ts');
 const f=fixture(),root=mkdtempSync(join(realpathSync(tmpdir()),'scope-choices109-')),ledger=createLocalAnalysisRequestLedger({projectRoot:root});let calls=0,seen:any,transportError:unknown;
 const scope=f.sources.sources.flatMap(s=>s.sheets.map(sheet=>({source_id:s.source_id,sheet_id:sheet.sheet_id,filters:[]})));
 const business={purpose:'比较两期净额',object:'当前选定订单及退款',scope:'当前选定全部记录',deliverables:['两期净额'],hypotheses:[],unknowns:[],execution_scope:scope};
 const runtime=createPiSessionOpenAnalysisRuntime({projectRoot:root,ledger,nativeObjectArguments:true,credentials:createApprovedProviderCredentials({environment:{}}),modelTransport:async request=>{try{
  calls++;const declared=request.messages.flatMap(m=>m.tools??[]),ref:any=declared.find(t=>t.name==='set_analysis_steps')!.parameters.properties.steps.items.properties.plan_ref;
  if(calls===1){const prompt=request.messages.filter(m=>m.role==='user').at(-1)!.text;const state=JSON.parse(prompt.split('CURRENT_BUSINESS_STATE:')[1].split(' 当前业务状态')[0]);assert.equal(state.current_framework_bound,false,'saved recipe is not current preparation binding');assert.ok(prompt.includes('SAVED_RECIPE_CONTEXT_ONLY:'),'saved framework remains inspectable as context');assert.ok(prompt.indexOf('inspect_selected')<prompt.indexOf('read_analysis_evidence'),'leading guidance must respect required scope-first order');return {content:[{kind:'tool',id:'read-before-required-scope',name:'read_analysis_evidence',arguments:{}}],stop:'tools',usage:{inputTokens:4,outputTokens:2}};}
  const result=JSON.parse(request.messages.filter(m=>m.role==='tool').at(-1)!.text);
  if(calls===2){assert.equal(result.status,'needs_business_scope');assert.equal(result.current_plan_ref,null);assert.deepEqual(result.saved_recipe_candidates,[]);assert.deepEqual(result.current_step_recipes,[]);assert.equal(result.calculation_performed,false);assert.equal(result.framework_saved,false);assert.ok(result.current_plan,'current framework stays inspectable');assert.deepEqual(result.requirement_identity,f.identity);assert.equal(ref.enum,undefined);return {content:[{kind:'tool',id:'inspect-authorized-materials',name:'inspect_selected',arguments:{}}],stop:'tools',usage:{inputTokens:4,outputTokens:2}};}
  if(calls===3){seen=result;const expected=structuredClone(f.sources) as any;for(const source of expected.sources)for(const sheet of source.sheets){sheet.full_data_rows=sheet.rows.length-1;sheet.full_column_count=sheet.rows[0]?.cells.length??0;}assert.deepEqual(seen,expected);return {content:[{kind:'tool',id:'explicit-current-business-scope',name:'describe_business',arguments:{...business,execution_scope:seen.sources.flatMap((s:any)=>s.sheets.map((sheet:any)=>({source_id:s.source_id,sheet_id:sheet.sheet_id,filters:[]})))}}],stop:'tools',usage:{inputTokens:4,outputTokens:2}};}
  if(calls===4){assert.deepEqual(result.business.execution_scope,scope);assert.equal(ref.enum,undefined,'declaring scope must not implicitly issue choices');return {content:[{kind:'tool',id:'explicit-read-after-scope',name:'read_analysis_evidence',arguments:{}}],stop:'tools',usage:{inputTokens:4,outputTokens:2}};}
  if(calls===5){assert.equal(result.status,undefined);assert.ok(result.current_plan_ref);assert.deepEqual(ref.enum,result.saved_recipe_candidates.map((c:any)=>c.plan_ref));assert.ok(ref.enum.length);return {content:[{kind:'tool',id:'explicit-select-current-variants',name:'set_analysis_steps',arguments:{version:'1.0',steps:['2026-01','2026-02'].map(period=>({title:'本期净额 '+period,plan_ref:ref.enum[0],changes:[{input_index:0,group_by:null,filters:[{column:'B',operator:'eq',value:period}]}],depends_on:[],hypotheses:[],required_evidence:['当前订单及退款'],limitations:['不推断退款原因']}))}}],stop:'tools',usage:{inputTokens:4,outputTokens:2}};}
  assert.equal(calls,6);assert.equal(result.total_steps,2);return {content:[{kind:'text',text:'已准备两期净额方案。'}],stop:'complete',usage:{inputTokens:4,outputTokens:2}};
 }catch(error){transportError=error;throw error;}}});
 const app=createOpenAnalysisApplication({proposalOnly:true,framework:{plan:f.plan,context:compileOpenAnalysisContext(openAnalysisProposal(f.plan),'比较当前两期净额',f.sources,business as any)} as any,savedRecipes:[f.plan],runtime,loadSelectedSource:async()=>f.sources,isAuthorized:()=>true,verify:()=>assert.fail('no preparation computation'),saveFramework:async()=>assert.fail('no preparation adoption'),saveOutcome:async()=>assert.fail('no preparation report')});
 const result:any=await app.run({identity:f.identity,question:'比较当前两期净额',signal:new AbortController().signal}).catch(error=>{throw transportError??error;});assert.equal(result.state,'proposal');assert.equal(calls,6);assert.equal(ledger.pending().length,0);
 assert.deepEqual(result.framework.steps.steps.map((s:any)=>{const value=executeOpenAnalysisIR(s.framework.plan,f.sources);return [value.value,verifyOpenAnalysisIntegerSum(s.framework.plan,value,f.sources).value];}),[['430','430'],['620','620']]);
});


test('V13-SCOPE-CHOICES109 negatives: scope ordering preserves ordinary reads and cannot bypass revoked authority or changed sources',async()=>{
 for(const boundary of ['ordinary','revoked','source-changed'] as const){
  const f=fixture();let current=f.sources,authorized=true,effects=0;
  const scope=f.sources.sources.flatMap(s=>s.sheets.map(sheet=>({source_id:s.source_id,sheet_id:sheet.sheet_id,filters:[]}))),business={purpose:'两期净额',object:'选定订单与退款',scope:'选定全部记录',deliverables:['两期净额'],hypotheses:[],unknowns:[],execution_scope:scope};
  const context=boundary==='ordinary'?undefined:compileOpenAnalysisContext(openAnalysisProposal(f.plan),'两期净额',f.sources,business as any);
  const app=createOpenAnalysisApplication({proposalOnly:true,framework:{plan:f.plan,context} as any,savedRecipes:[f.plan],runtime:{run:async input=>{
   const read=input.tools.find(t=>t.name==='read_analysis_evidence')!,describe=input.tools.find(t=>t.name==='describe_business')!;
   const before:any=await read.execute({},input.signal);
   if(boundary==='ordinary'){assert.ok(before.current_plan_ref);assert.equal(before.status,undefined);assert.ok(before.saved_recipe_candidates.length);}
   else{
    assert.equal(before.status,'needs_business_scope');assert.equal(before.current_plan_ref,null);assert.deepEqual(before.saved_recipe_candidates,[]);
    await describe.execute(business,input.signal);assert.equal((input.tools.find(t=>t.name==='set_analysis_steps')!.modelParameters as any).properties.steps.items.properties.plan_ref.enum,undefined,'scope alone grants no candidate handles');
    if(boundary==='revoked')authorized=false;else current={...f.sources,sources:f.sources.sources.map((s,i)=>i? s:{...s,sha256:'f'.repeat(64)})};
    await read.execute({},input.signal);assert.fail('denied read cannot issue current references');
   }
   return {text:'仍需共同对焦'};
  }},loadSelectedSource:async()=>current,isAuthorized:()=>authorized,verify:()=>{effects++;assert.fail('no preparation execution');},saveFramework:async()=>{effects++;assert.fail('no adoption');},saveOutcome:async()=>{effects++;assert.fail('no outcome');}});
  if(boundary==='ordinary'){const result=await app.run({identity:f.identity,question:'两期净额',signal:new AbortController().signal});assert.equal(result.state,'response');}
  else await assert.rejects(()=>app.run({identity:f.identity,question:'两期净额',signal:new AbortController().signal}),(error:any)=>error.code===(boundary==='revoked'?'AUTHORITY_REQUIRED':'SOURCE_CHANGED'));
  assert.equal(effects,0);
 }
});

test('AC134-01: report consumer gets bound method and selected headers, without raw rows or stale draft',async()=>{
 const {reportEditModelPrompt,reportEditMarker}=await import('../../../packages/product-core/open-analysis-report-review.ts');const f=fixture();
 const prompt=JSON.parse(reportEditModelPrompt(reportEditMarker+JSON.stringify({version:'1.0',output_contract:'1.3',identity:f.identity,question:'解释当前实际结果',draft:'旧错误口径',evidence:f.evidence,sources:f.sources})).slice(reportEditMarker.length));
 assert.deepEqual(prompt.numeric_facts.map((x:any)=>x.calculation_kind),['refund_net','refund_net']);
 assert.deepEqual(prompt.source_summary[0].sheets[0].fields,[{column:'A',name:'订单号'},{column:'B',name:'期间'},{column:'C',name:'金额'}]);
 assert.deepEqual(prompt.source_summary[1].sheets[0].fields,[{column:'A',name:'退款号'},{column:'B',name:'原订单号'},{column:'C',name:'退款金额'}]);
 assert.doesNotMatch(JSON.stringify(prompt),/O1|O4|旧错误口径/);assert.equal(prompt.sources,undefined);assert.equal(prompt.evidence,undefined);
 const raw={version:'1.1',goal:'实际毛额',source_id:f.sources.sources[0]!.source_id,sheet_id:f.sources.sources[0]!.sheets[0]!.sheet_id,column:'C',group_by:'B',operation:'sum',unit:'元',filters:[]};
 const plan=compileOpenAnalysisIR(raw,f.sources),calculation=executeOpenAnalysisIR(plan,f.sources),verification=verifyOpenAnalysisIntegerSum(plan,calculation,f.sources);
 const gross=JSON.parse(reportEditModelPrompt(reportEditMarker+JSON.stringify({version:'1.0',output_contract:'1.3',identity:f.identity,question:'实际毛额',draft:'',evidence:{verified_calculations:[{execution_plan:plan,calculation,verification}]},sources:f.sources})).slice(reportEditMarker.length));
 assert.deepEqual(gross.numeric_facts.map((x:any)=>x.calculation_kind),['sum','sum']);
});

test('AC135-01: current report catalog supplies only actual same-basis coordinate comparisons',async()=>{
 const {reportEditModelPrompt,reportEditMarker}=await import('../../../packages/product-core/open-analysis-report-review.ts');
 const f=scopedComparisonFixture();
 // Add whole-scope net, partial gross, whole gross and an identical receipt:
 // the old mistaken partial-gross/whole-gross subtraction must not be offered.
 const original=fixture(),raw=openAnalysisProposal(original.plan) as any;
 raw.inputs[0].source_id=f.context.sources.sources[0]!.source_id;raw.inputs[0].sheet_id=f.context.sources.sources[0]!.sheets[0]!.sheet_id;
 raw.inputs[1].source_id=f.context.sources.sources[1]!.source_id;raw.inputs[1].sheet_id=f.context.sources.sources[1]!.sheets[0]!.sheet_id;
 const make=(p:any)=>{const execution_plan=compileOpenAnalysisIR(p,f.context.sources),calculation=executeOpenAnalysisIR(execution_plan,f.context.sources),verification=verifyOpenAnalysisIntegerSum(execution_plan,calculation,f.context.sources);return {execution_plan,calculation,verification};};
 const whole=make(raw),partial=make({version:'1.1',goal:'部分毛额',source_id:raw.inputs[0].source_id,sheet_id:raw.inputs[0].sheet_id,column:'C',group_by:'B',operation:'sum',unit:'元',filters:[{column:'D',operator:'eq',value:'北'}]}),gross=make({...openAnalysisProposal(partial.execution_plan),filters:[]} as any);
 const evidence={verified_calculations:[...f.evidence.verified_calculations,whole,partial,gross,f.evidence.verified_calculations[0]]};
 const prompt=JSON.parse(reportEditModelPrompt(reportEditMarker+JSON.stringify({version:'1.0',output_contract:'1.4',identity:f.context.identity,question:'比较当前实际范围',draft:'错误旧结论',evidence,sources:f.context.sources})).slice(reportEditMarker.length));
 assert.equal(prompt.output_contract,'1.4');assert.ok(prompt.comparison_facts.length);
 const north=prompt.comparison_facts.find((x:any)=>x.left==='F1'&&x.right==='F2');assert.ok(north);
 assert.ok(prompt.comparison_facts.some((x:any)=>x.left==='F1'&&x.right==='F3'),'different bound plans can compare the same actual measure with one changed region');
 assert.equal(north.difference.value,'190');assert.equal(north.rate.display,'237.50%');
 assert.ok(north.fixed_coordinates.some((x:any)=>x.value==='北'));assert.equal(north.changed_coordinate.left,'2026-01');assert.equal(north.changed_coordinate.right,'2026-02');
 assert.ok(!prompt.comparison_facts.some((x:any)=>['F7','F8'].includes(x.left)&&['F9','F10'].includes(x.right)),'partial and whole gross cannot compare');
 assert.ok(!prompt.comparison_facts.some((x:any)=>x.left==='F11'||x.right==='F11'),'duplicate receipt collapses');
 assert.ok(prompt.comparison_facts.every((x:any)=>x.difference.grade==='derived_formula'));assert.equal(prompt.comparison_catalog.truncated,false);
 assert.doesNotMatch(JSON.stringify(prompt),/错误旧结论|O1|O4/);
});

test('AC135-02: current placeholders resolve authoritative comparisons without a duplicate model list, retaining strict history',()=>{
 const f=fixture(),context={identity:f.identity,sources:f.sources};
 const doc={version:'1.4',status:'ready',interpretations:[{interpretation:'当前比较：{{F1}}，{{F2}}；变化{{D1}}，相对前列{{D2}}。原因尚需其他资料。'}]};
 const result=compileNumericReport(JSON.stringify(doc),f.evidence,context);
 assert.equal(result.status,'complete');assert.equal(result.reference_contract,'1.2');assert.deepEqual(result.document,doc);
 assert.equal(result.values.find(v=>v.id==='D1')!.value,'190');assert.equal(result.values.find(v=>v.id==='D2')!.display,'44.19%');
 assert.match(result.text,/2026-02 减 2026-01 差额/);assert.deepEqual(validateNumericReport(result,f.evidence,context),result);
 for(const text of ['没有目录依据{{D99}}。','模型自行算出190元。','2026-02净额{{F1}}。']){
  const bad=compileNumericReport(JSON.stringify({...doc,interpretations:[{interpretation:text}]}),f.evidence,context);assert.equal(bad.status,'partial',text);
 }
 assert.throws(()=>compileNumericReport(JSON.stringify({...doc,derivations:document().derivations}),f.evidence,context),{code:'REPORT_EVIDENCE_INVALID'});
 const {reference_contract,...missingMarker}=result;assert.throws(()=>validateNumericReport(missingMarker,f.evidence,context),{code:'NUMERIC_REPORT_CHANGED'});
 assert.throws(()=>validateNumericReport({...result,values:result.values.map(v=>v.id==='D1'?{...v,value:'400'}:v)},f.evidence,context),{code:'NUMERIC_REPORT_CHANGED'});
 const oldDoc={...document(),interpretations:[{references:[],interpretation:'{{F1}}'}]},old=compileNumericReport(JSON.stringify(oldDoc),f.evidence,context);
 assert.equal(old.status,'partial');assert.equal(old.reference_contract,undefined);assert.deepEqual(validateNumericReport(old,f.evidence,context),old);
});

test('AC135-01/02: non-retail coordinates, zero denominators and bounded catalog keep honest coverage',async()=>{
 const {scopedNumericReportComparisons}=await import('../../../packages/product-core/open-analysis-numeric-report.ts');
 const f=fixture(),sources=structuredClone(f.sources),sheet=sources.sources[0]!.sheets[0]!;
 sheet.rows=[{row:1,cells:[{column:'A',type:'string',value:'工作组'},{column:'B',type:'string',value:'数量'}]},...Array.from({length:20},(_,i)=>({row:i+2,cells:[{column:'A',type:'string' as const,value:'team-'+String.fromCharCode(65+i)},{column:'B',type:'string' as const,value:String(i)}]}))];
 const plan=compileOpenAnalysisIR({version:'1.1',goal:'工作量',source_id:sources.sources[0]!.source_id,sheet_id:sheet.sheet_id,column:'B',group_by:'A',operation:'sum',unit:'件',filters:[]},sources),calculation=executeOpenAnalysisIR(plan,sources),verification=verifyOpenAnalysisIntegerSum(plan,calculation,sources),evidence={verified_calculations:[{execution_plan:plan,calculation,verification}]},context={identity:{...f.identity,scope_sha256:taskHash(sources)},sources};
 const catalog=scopedNumericReportComparisons(evidence,context);assert.equal(catalog.comparisons.length,16);assert.equal(catalog.truncated,true);assert.equal(catalog.comparisons[0].difference.value,'1');assert.equal(catalog.comparisons[0].rate.status,'not_applicable');
 const doc={version:'1.4',status:'ready',interpretations:[{interpretation:'工作组比较{{D1}}，相对前列{{D2}}。'}]},report=compileNumericReport(JSON.stringify(doc),evidence,context);assert.equal(report.status,'complete');assert.match(report.text,/不适用/);assert.equal(report.values.find(v=>v.id==='D2')!.value,null);
 assert.throws(()=>compileNumericReport(JSON.stringify(doc),evidence,{...context,identity:{...context.identity,scope_sha256:'f'.repeat(64)}}),{code:'SOURCE_CHANGED'});
 const reversed={verified_calculations:['team-T','team-S'].map(value=>{const execution_plan=compileOpenAnalysisIR({...openAnalysisProposal(plan),group_by:null,filters:[{column:'A',operator:'eq',value}]},sources),calculation=executeOpenAnalysisIR(execution_plan,sources),verification=verifyOpenAnalysisIntegerSum(execution_plan,calculation,sources);return {execution_plan,calculation,verification};})};
 const reverse=scopedNumericReportComparisons(reversed,context);assert.equal(reverse.comparisons[0].changed_coordinate.left,'team-S');assert.equal(reverse.comparisons[0].changed_coordinate.right,'team-T');assert.equal(reverse.comparisons[0].difference.value,'1');
});

test('AC135-04: current brief negative limitations retain later affirmative rejection and historical readback',()=>{
 const f=fixture(),context={identity:f.identity,sources:f.sources};
 const make=(text:string)=>({version:'1.4',status:'ready',interpretations:[{interpretation:text}]});
 for(const text of ['本段为解释建议，非原因证明或行动依据。','算术结果非因果关系证明。']){
  const raw=JSON.stringify(make(text));
  const current=compileNumericReport(raw,f.evidence,context);assert.equal(current.status,'complete',text);assert.equal(current.reference_contract,'1.2');assert.deepEqual(validateNumericReport(current,f.evidence,context),current);
  const old=compileNumericReport(raw,f.evidence,{...context,includeBriefNegation:false});assert.equal(old.reference_contract,'1.1');assert.equal(old.status,'partial');const bytes=JSON.stringify(old);assert.deepEqual(validateNumericReport(old,f.evidence,context),old);assert.equal(JSON.stringify(old),bytes);
 }
 for(const text of ['非原因证明但因果关系已证明。','非业务定义验证且资料完整性已证实。','原因已被证实。'])assert.equal(compileNumericReport(JSON.stringify(make(text)),f.evidence,context).status,'partial',text);
});


test('AC138-01: model selects facts but cannot rename the actual measure, scope or units',()=>{
 const f=fixture(),context={identity:f.identity,sources:f.sources};
 const raw={version:'1.5',status:'ready',interpretations:[{fact_refs:['F2','F1','D1','D2'],interpretation:'原因仍需业务记录。'}]};
 const result=compileNumericReport(JSON.stringify(raw),f.evidence,context);
 assert.equal(result.status,'complete');assert.equal(result.reference_contract,'1.5');
 assert.match(result.text,/620/);assert.match(result.text,/430/);assert.match(result.text,/190.00/);assert.match(result.text,/44.19%/);
 assert.ok(result.text.indexOf('juanerai-number:F2')<result.text.indexOf('juanerai-number:F1'),'selected order is actual report order');
 assert.match(result.text,/订单金额减关联退款/);assert.match(result.text,/AI解读/);assert.deepEqual(validateNumericReport(result,f.evidence,context),result);
 assert.deepEqual(result.document,raw);
});

test('AC138-02/04: limits deny invented numbers and certification, preserve denials and immutable history',()=>{
 const f=fixture(),context={identity:f.identity,sources:f.sources};
 const make=(interpretation:string,fact_refs=['F1'])=>({version:'1.5',status:'ready',interpretations:[{fact_refs,interpretation}]});
 for(const prose of ['不能视为原因已证实。','不可当成因果关系证明。','无法将其认作业务口径已验证。','原因尚未证实，需要业务记录。']){
  const r=compileNumericReport(JSON.stringify(make(prose)),f.evidence,context);assert.equal(r.status,'complete',prose);assert.match(r.text,/AI解读/);assert.deepEqual(validateNumericReport(r,f.evidence,context),r);
 }
 for(const prose of ['原因已被证实。','不能视为原因已证实但因果关系已证明。','资料完整性已验证。','净额999999元。','净额{{F1}}。','金额430 CNY。','全部已核验。']){
  const r=compileNumericReport(JSON.stringify(make(prose)),f.evidence,context);assert.equal(r.status,'partial',prose);assert.match(r.text,/430/);assert.doesNotMatch(r.text,/999999|净额\{\{/);
 }
 const unknown=compileNumericReport(JSON.stringify(make('', ['F1','D999'])),f.evidence,context);assert.equal(unknown.status,'partial');assert.match(unknown.text,/430/);
 for(const extra of [{label:'净额'},{grade:'independent_arithmetic'},{value:'430'},{derivations:[]}])assert.throws(()=>compileNumericReport(JSON.stringify({...make(''),...extra}),f.evidence,context),{code:'REPORT_EVIDENCE_INVALID'});
 const current=compileNumericReport(JSON.stringify(make('')),f.evidence,context);
 const {reference_contract,...missing}=current;assert.throws(()=>validateNumericReport(missing,f.evidence,context),{code:'NUMERIC_REPORT_CHANGED'});
 assert.throws(()=>validateNumericReport({...current,text:current.text.replace('430','999')},f.evidence,context),{code:'NUMERIC_REPORT_CHANGED'});
 assert.throws(()=>validateNumericReport(current,f.evidence,{...context,identity:{...context.identity,scope_sha256:'f'.repeat(64)}}),{code:'SOURCE_CHANGED'});
 const old=compileNumericReport(JSON.stringify({version:'1.4',status:'ready',interpretations:[{interpretation:'不能视为原因已证实。'}]}),f.evidence,context),bytes=JSON.stringify(old);assert.equal(old.status,'partial');assert.deepEqual(validateNumericReport(old,f.evidence,context),old);assert.equal(JSON.stringify(old),bytes);
 assert.match(numericReportCopy(current),/430 元/);assert.doesNotMatch(numericReportCopy(current),/juanerai-number:/);
});

test('AC138-03: current producer supplies the exact fact fragments without raw data or prior draft',async()=>{
 const {reportEditModelPrompt,reportEditMarker}=await import('../../../packages/product-core/open-analysis-report-review.ts');const f=fixture();
 const prompt=JSON.parse(reportEditModelPrompt(reportEditMarker+JSON.stringify({version:'1.0',output_contract:'1.5',identity:f.identity,question:'比较当前结果',draft:'旧错误',evidence:f.evidence,sources:f.sources})).slice(reportEditMarker.length));
 assert.equal(prompt.output_contract,'1.5');assert.ok(prompt.fact_fragments.length);assert.equal(prompt.fact_fragments.find((v:any)=>v.reference_id==='F1').value,'430');assert.equal(prompt.fact_fragments.find((v:any)=>v.reference_id==='D1').value,'190');
 assert.match(prompt.fact_fragments.find((v:any)=>v.reference_id==='D1').label,/2026-02 减 2026-01/);assert.doesNotMatch(JSON.stringify(prompt),/O1|旧错误/);assert.equal(prompt.evidence,undefined);assert.equal(prompt.sources,undefined);
 assert.deepEqual(prompt.numeric_facts[0].bound_parameters.join,f.plan.join);
 assert.equal(prompt.numeric_facts[0].bound_parameters.numeric_mode,'integer');
 assert.equal(prompt.numeric_facts[0].bound_parameters.refund_period_attribution,'matched_order_group');
});

test('AC138-04: concise fact sentences retain actual measure and coordinates while full bindings remain inspectable',()=>{
 const f=fixture(),context={identity:f.identity,sources:f.sources};
 const report=compileNumericReport(JSON.stringify({version:'1.5',status:'ready',interpretations:[{fact_refs:['F1'],interpretation:''}]}),f.evidence,context);
 assert.equal(report.status,'complete');assert.match(report.text,/订单金额减关联退款 · 期间=2026-01/);assert.doesNotMatch(report.text,/每笔退款匹配唯一订单|订单号 =/);
 assert.match(report.values.find(v=>v.id==='F1')!.scope,/每笔退款匹配唯一订单/);assert.match(numericReportCopy(report),/每笔退款匹配唯一订单/);
});

test('AC138-04: the first saved fact-fragment contract keeps original long-form bytes after concise adoption',()=>{
 const f=fixture(),context={identity:f.identity,sources:f.sources},doc={version:'1.5',status:'ready',interpretations:[{fact_refs:['F1'],interpretation:'原因仍未知。'}]};
 const old=compileNumericReport(JSON.stringify(doc),f.evidence,{...context,includeConciseFacts:false} as any),bytes=JSON.stringify(old);
 assert.equal(old.reference_contract,'1.3');assert.match(old.text,/每笔退款匹配唯一订单/);assert.deepEqual(validateNumericReport(old,f.evidence,context),old);assert.equal(JSON.stringify(old),bytes);
 const current=compileNumericReport(JSON.stringify(doc),f.evidence,context);assert.equal(current.reference_contract,'1.5');assert.doesNotMatch(current.text,/每笔退款匹配唯一订单/);assert.deepEqual(validateNumericReport(current,f.evidence,context),current);
 assert.throws(()=>validateNumericReport({...old,reference_contract:'1.4'},f.evidence,context),{code:'NUMERIC_REPORT_CHANGED'});
});

test('AC138-02: a need for evidence is not a completed certification and mixed grades cannot be called all independent',()=>{
 const f=fixture(),context={identity:f.identity,sources:f.sources},make=(text:string)=>({version:'1.5',status:'ready',interpretations:[{fact_refs:['F1','D1'],interpretation:text}]});
 const pending=compileNumericReport(JSON.stringify(make('该假说需要退款发生原因记录与其他业务证据才能验证，本次不具备。')),f.evidence,context);assert.equal(pending.status,'complete');assert.match(pending.text,/才能验证/);
 const old=compileNumericReport(JSON.stringify(pending.document),f.evidence,{...context,includeAssertionOnly:false} as any),bytes=JSON.stringify(old);assert.equal(old.reference_contract,'1.4');assert.equal(old.status,'partial');assert.deepEqual(validateNumericReport(old,f.evidence,context),old);assert.equal(JSON.stringify(old),bytes);
 for(const text of ['原因已经得到验证。','资料完整性已证实。','以上所有数字均经过独立算术核验。','该假说需验证但因果关系已证明。'])assert.equal(compileNumericReport(JSON.stringify(make(text)),f.evidence,context).status,'partial',text);
});

test('AC138-01: gross facts and comparisons cannot become net, and changed data actually changes fragments',()=>{
 const f=fixture(),make=(sources:MemberSourceInspection)=>{const p=compileOpenAnalysisIR({version:'1.1',goal:'销售毛额',source_id:sources.sources[0]!.source_id,sheet_id:sources.sources[0]!.sheets[0]!.sheet_id,column:'C',group_by:'B',operation:'sum',unit:'元',filters:[]},sources),c=executeOpenAnalysisIR(p,sources),v=verifyOpenAnalysisIntegerSum(p,c,sources);return {evidence:{verified_calculations:[{execution_plan:p,calculation:c,verification:v}]},context:{identity:{...f.identity,scope_sha256:taskHash(sources)},sources}};};
 const doc={version:'1.5',status:'ready',interpretations:[{fact_refs:['F1','F2','D1'],interpretation:''}]};
 const a=make(f.sources),report=compileNumericReport(JSON.stringify(doc),a.evidence,a.context);assert.equal(report.status,'complete');assert.match(report.text,/金额 求和/);assert.match(report.text,/450 元/);assert.match(report.text,/650 元/);assert.match(report.text,/200.00 元/);assert.doesNotMatch(report.text,/净额|减关联退款/);
 const b=make(fixture('200','200').sources),changed=compileNumericReport(JSON.stringify(doc),b.evidence,b.context);assert.match(changed.text,/550 元/);assert.doesNotMatch(changed.text,/650 元/);
 const forged={...doc,interpretations:[{...doc.interpretations[0],label:'地区净额差异'}]};assert.throws(()=>compileNumericReport(JSON.stringify(forged),a.evidence,a.context),{code:'REPORT_EVIDENCE_INVALID'});
});

test('AC138-01/02: non-retail groups, zero base and explicit unit consistency keep their actual meaning',()=>{
 const f=fixture(),sources=structuredClone(f.sources),sheet=sources.sources[0]!.sheets[0]!;sheet.rows=[{row:1,cells:[{column:'A',type:'string',value:'工作组'},{column:'B',type:'string',value:'数量'}]},{row:2,cells:[{column:'A',type:'string',value:'alpha'},{column:'B',type:'string',value:'0'}]},{row:3,cells:[{column:'A',type:'string',value:'beta'},{column:'B',type:'string',value:'7'}]}];
 const p=compileOpenAnalysisIR({version:'1.1',goal:'工作量',source_id:sources.sources[0]!.source_id,sheet_id:sheet.sheet_id,column:'B',group_by:'A',operation:'sum',unit:'件',filters:[]},sources),c=executeOpenAnalysisIR(p,sources),v=verifyOpenAnalysisIntegerSum(p,c,sources),evidence={verified_calculations:[{execution_plan:p,calculation:c,verification:v}]},context={identity:{...f.identity,scope_sha256:taskHash(sources)},sources};
 const doc={version:'1.5',status:'ready',interpretations:[{fact_refs:['F1','F2','D2'],interpretation:'相对变化率不适用。'}]},r=compileNumericReport(JSON.stringify(doc),evidence,context);assert.equal(r.status,'complete');assert.match(r.text,/alpha/);assert.match(r.text,/7 件/);assert.match(r.text,/不适用/);assert.equal(r.values.find(v=>v.id==='D2')!.value,null);
 const conflict=compileNumericReport(JSON.stringify({...doc,interpretations:[{fact_refs:['F2'],interpretation:'工作量7元。'}]}),evidence,context);assert.equal(conflict.status,'partial');assert.doesNotMatch(conflict.text,/工作量7元/);
});
