import test from 'node:test';
import assert from 'node:assert/strict';
import {compileOpenAnalysisIR,executeOpenAnalysisIR} from '../../../packages/product-core/open-analysis-ir.ts';
import {verifyOpenAnalysisIntegerSum} from '../../../adapters/analytics-duckdb/open-analysis-verification.ts';
import type {MemberSourceInspection} from '../../../packages/ports/member-source.ts';
const source:MemberSourceInspection={version:'1.0',sources:[{source_id:'11111111-1111-4111-a111-111111111111',display_name:'prices.csv',format:'csv',sha256:'a'.repeat(64),byte_length:'100',sheets:[{sheet_id:'22222222-2222-4222-a222-222222222222',name:'CSV',state:'visible',rows:[{row:1,cells:[{column:'A',type:'string',value:'price'},{column:'B',type:'string',value:'quantity'},{column:'C',type:'string',value:'region'}]},...[['12.5','2','north'],['9','3','north'],['100','0','south']].map((values,i)=>({row:i+2,cells:values.map((value,j)=>({column:['A','B','C'][j]!,type:j===2?'string' as const:'number' as const,value}))}))]}]}]};
const proposal={version:'1.9',operation:'weighted_mean',goal:'quantity weighted price',source_id:source.sources[0]!.source_id,sheet_id:source.sources[0]!.sheets[0]!.sheet_id,column:'price',weight_column:'quantity',unit:'CNY/unit',group_by:null,filters:[]};
test('VC-01/02: actual paired weights determine exact mean; independent original-source audit rejects a wrong number and row coverage',()=>{
 const plan=compileOpenAnalysisIR(proposal,source),result=executeOpenAnalysisIR(plan,source);
 assert.equal(plan.weight_column,'B');assert.equal(result.value,'52/5');assert.equal(result.rows,3);
 assert.equal(verifyOpenAnalysisIntegerSum(plan,result,source).value,'52/5');
 assert.throws(()=>verifyOpenAnalysisIntegerSum(plan,{...result,value:'43/4'},source),{code:'VERIFICATION_FAILED'});
 assert.throws(()=>verifyOpenAnalysisIntegerSum(plan,{...result,rows:2},source),{code:'VERIFICATION_FAILED'});
 const changed=structuredClone(source);changed.sources[0]!.sheets[0]!.rows[1]!.cells[1]!.value='4';
 assert.throws(()=>executeOpenAnalysisIR(plan,changed),{code:'SOURCE_CHANGED'});
 assert.equal(executeOpenAnalysisIR(compileOpenAnalysisIR(proposal,changed),changed).value,'11');
});
test('VC-01/02: explicit grouping/filtering and unit conversion retain correct weight pairing; zero/missing/negative weights never certify zero',()=>{
 const selected={...proposal,group_by:'region',filters:[{column:'quantity',operator:'ge',value:'1'}]},plan=compileOpenAnalysisIR(selected,source),result=executeOpenAnalysisIR(plan,source);
 assert.deepEqual(result.groups,[{key:'north',value:'52/5',rows:2}]);assert.equal(verifyOpenAnalysisIntegerSum(plan,result,source).rows,2);
 const measured=compileOpenAnalysisIR({version:'1.8',base:proposal,measure:{currency:'CNY',inputs:[{source_id:proposal.source_id,sheet_id:proposal.sheet_id,column:'price',scale:'10000'}],output_scale:'1',output_label:'CNY'}},source);
 const converted=executeOpenAnalysisIR(measured,source);assert.equal(converted.value,'104000');assert.equal(verifyOpenAnalysisIntegerSum(measured,converted,source).value,'104000');
 const zero=structuredClone(source);for(const r of zero.sources[0]!.sheets[0]!.rows.slice(1))r.cells[1]!.value='0';
 const zeroPlan=compileOpenAnalysisIR(proposal,zero),zeroResult=executeOpenAnalysisIR(zeroPlan,zero);assert.equal(zeroResult.value,'null');assert.equal(verifyOpenAnalysisIntegerSum(zeroPlan,zeroResult,zero).value,'null');
 const negative=structuredClone(source);negative.sources[0]!.sheets[0]!.rows[1]!.cells[1]!.value='-2';
 assert.throws(()=>executeOpenAnalysisIR(compileOpenAnalysisIR(proposal,negative),negative),{code:'NEGATIVE_WEIGHT_UNSUPPORTED'});
 const missing=structuredClone(source);missing.sources[0]!.sheets[0]!.rows[1]!.cells.splice(1,1);
 assert.throws(()=>executeOpenAnalysisIR(compileOpenAnalysisIR(proposal,missing),missing),{code:'ROW_BINDING_INCOMPLETE'});
});
test('VC-01/VU-02: agent tool accepts actual named value/weight fields and saves qualified evidence with readable scope',async()=>{
 const {randomUUID}=await import('node:crypto');const {taskHash}=await import('../../../packages/product-core/member-task.ts');
 const {createOpenAnalysisApplication}=await import('../../../packages/application/open-analysis.ts');
 const {reportPlan}=await import('../../../packages/product-core/open-analysis-report-review.ts');
 const identity={task_id:randomUUID(),revision:'1',run_id:randomUUID(),attempt_id:randomUUID(),operation_id:randomUUID(),grant_id:randomUUID(),scope_sha256:taskHash(source),config_sha256:'c'.repeat(64)},saved:any[]=[];
 const app=createOpenAnalysisApplication({agentLed:true,loadSelectedSource:async()=>source,isAuthorized:()=>true,
 runtime:{run:async(input)=>{const tool=input.tools.find(t=>t.name==='calculate_and_verify')!;
 assert.match(JSON.stringify(tool.parameters),/weighted_mean/,'model-visible schema must expose real supported method');
 const framing=input.tools.find(t=>t.name==='set_framework')!;await framing.execute({goal:proposal.goal,source_id:'prices.csv',sheet_id:'CSV',operation:'weighted_mean',column:'price',weight_column:'quantity',unit:'CNY/unit',group_mode:'none'},input.signal);
 const result:any=await tool.execute({},input.signal);
 assert.equal(result.calculation.value,'52/5');const evidence:any=await input.tools.find(t=>t.name==='read_analysis_evidence')!.execute({},input.signal);const scope=reportPlan(evidence.verified_calculations[0].execution_plan,source);assert.match(scope,/quantity/);assert.match(scope,/加权平均/);
 return {text:'The quantity weighted price is 10.4.',tools:[]};}},
 verify:verifyOpenAnalysisIntegerSum,saveFramework:async(x)=>({saved:true,...x.identity}),saveVerifiedStep:async(x)=>({saved:true,...x.identity,step_id:x.step_id}),saveOutcome:async(x)=>{saved.push(x);return {saved:true,...x.identity,outcome_id:x.outcome_id};}});
 assert.equal((await app.run({identity,question:'quantity weighted price',signal:new AbortController().signal})).state,'saved');assert.equal(saved.length,1);
});
test('VC-02: decimal filter boundary must not admit adjacent large values through floating comparison',()=>{
 const selected=structuredClone(source);selected.sources[0]!.sheets[0]!.rows[1]!.cells[2]!.value='9007199254740992';selected.sources[0]!.sheets[0]!.rows[2]!.cells[2]!.value='9007199254740993';selected.sources[0]!.sheets[0]!.rows[3]!.cells[2]!.value='0';
 const p=compileOpenAnalysisIR({...proposal,filters:[{column:'region',operator:'ge',value:'9007199254740993'}]},selected),v=executeOpenAnalysisIR(p,selected);assert.equal(v.rows,1);assert.equal(v.value,'9');assert.equal(verifyOpenAnalysisIntegerSum(p,v,selected).rows,1);
});
test('VC-10: a reusable weighted recipe retains explicit weight field and cannot silently become a simple mean',async()=>{
 const {validateOpenPlanReuse}=await import('../../../packages/product-core/open-analysis-plan-reuse.ts');
 const recipe={version:'1.0',source_task_id:'33333333-3333-4333-a333-333333333333',source_revision:'1',plan_sha256:'a'.repeat(64),classification:'MODEL_CANDIDATE',recipe:{goal:'weighted price',operation:'weighted_mean',unit:'CNY/unit',weight_column:'quantity',bindings:[{source_name:'prices.csv',sheet_name:'CSV',column:'price',group_by:null,filters:[]}],definitions:[]}};
 assert.equal(validateOpenPlanReuse(recipe).recipe.weight_column,'quantity');
 const noWeight=structuredClone(recipe);delete (noWeight.recipe as any).weight_column;assert.throws(()=>validateOpenPlanReuse(noWeight),{code:'INTEGRITY_BLOCKED'});
 assert.throws(()=>validateOpenPlanReuse({...recipe,recipe:{...recipe.recipe,operation:'mean'}}),{code:'INTEGRITY_BLOCKED'});
});
test('VC-02/VU-02: numerator and weight total are independently checked operands, not merely explanatory main-calculation metadata',()=>{
 const p=compileOpenAnalysisIR(proposal,source),result=executeOpenAnalysisIR(p,source);
 assert.deepEqual(result.weighted,{numerator:'52',weight_total:'5'});
 assert.throws(()=>verifyOpenAnalysisIntegerSum(p,{...result,weighted:{numerator:'520',weight_total:'50'}},source),{code:'VERIFICATION_FAILED'});
});
test('VC-10/VU-02/05: real store reopens weighted report and checked operand evidence without new computation',async()=>{
 const {randomUUID}=await import('node:crypto');const {taskHash}=await import('../../../packages/product-core/member-task.ts');const {createLocalOpenAnalysisStore}=await import('../../../adapters/storage-local/open-analysis.ts');const {compileNumericReport,numericReportFacts}=await import('../../../packages/product-core/open-analysis-numeric-report.ts');
 const {mkdtempSync,rmSync}=await import('node:fs');const {tmpdir}=await import('node:os');const {join}=await import('node:path');
 const root=mkdtempSync(join(tmpdir(),'juaner-r3-weighted-')),identity={task_id:randomUUID(),revision:'1',run_id:randomUUID(),attempt_id:randomUUID(),operation_id:randomUUID(),grant_id:randomUUID(),scope_sha256:taskHash(source),config_sha256:'c'.repeat(64)};
 try{const plan=compileOpenAnalysisIR(proposal,source),calculation=executeOpenAnalysisIR(plan,source),verification=verifyOpenAnalysisIntegerSum(plan,calculation,source),evidence={verified_calculations:[{goal:plan.goal,execution_plan:plan,plan_sha256:taskHash(plan),calculation,verification}]};
 const facts=numericReportFacts(evidence,{identity,sources:source});assert.match(facts[0]!.calculation_trace?.expression??'',/52.*5/);
 const numeric_report=compileNumericReport(JSON.stringify({version:'1.3',status:'ready',derivations:[],interpretations:[{references:['F1'],interpretation:'The weighted price is {{F1}}. No causal conclusion is verified.'}]}),evidence,{identity,sources:source});
 const store=createLocalOpenAnalysisStore({projectRoot:root});store.create({identity,source,question:proposal.goal});const lease=store.begin(identity.task_id);store.saveFramework(lease,{version:'1.0',identity,origin:'MODEL_PROPOSAL',plan});store.saveOutcome(lease,{version:'1.0',outcome_id:randomUUID(),identity,framework:plan,calculation,verification,explanation:{kind:'MODEL_EXPLANATION',text:numeric_report.text},human_judgment:'not_recorded',numeric_report});
 const read=createLocalOpenAnalysisStore({projectRoot:root}).read(identity.task_id)!;assert.deepEqual(read.outcome?.calculation,calculation);assert.deepEqual(read.outcome?.numeric_report,numeric_report);
 }finally{rmSync(root,{recursive:true,force:true});}
});
test('VU-02: grouped weighted evidence shows that group quotient instead of an entire result JSON',async()=>{
 const {numericReportFacts}=await import('../../../packages/product-core/open-analysis-numeric-report.ts');const {taskHash}=await import('../../../packages/product-core/member-task.ts');const {randomUUID}=await import('node:crypto');
 const plan=compileOpenAnalysisIR({...proposal,group_by:'region',filters:[{column:'quantity',operator:'ge',value:'1'}]},source),calculation=executeOpenAnalysisIR(plan,source),verification=verifyOpenAnalysisIntegerSum(plan,calculation,source),identity={task_id:randomUUID(),revision:'1',run_id:randomUUID(),attempt_id:randomUUID(),operation_id:randomUUID(),grant_id:randomUUID(),scope_sha256:taskHash(source),config_sha256:'c'.repeat(64)};
 const facts=numericReportFacts({verified_calculations:[{goal:plan.goal,execution_plan:plan,plan_sha256:taskHash(plan),calculation,verification}]},{identity,sources:source});assert.match(facts[0]!.calculation_trace!.expression,/= 52\/5 CNY\/unit$/);assert.doesNotMatch(facts[0]!.calculation_trace!.expression,/\{"key"/);
});
test('VC-02/07/VU-03: zero-weight group is visibly not applicable while another group retains its independently verified value',async()=>{
 const {numericReportFacts,compileNumericReport}=await import('../../../packages/product-core/open-analysis-numeric-report.ts');const {taskHash}=await import('../../../packages/product-core/member-task.ts');const {randomUUID}=await import('node:crypto');
 const identity={task_id:randomUUID(),revision:'1',run_id:randomUUID(),attempt_id:randomUUID(),operation_id:randomUUID(),grant_id:randomUUID(),scope_sha256:taskHash(source),config_sha256:'c'.repeat(64)};
 const p=compileOpenAnalysisIR({...proposal,group_by:'region'},source),c=executeOpenAnalysisIR(p,source),v=verifyOpenAnalysisIntegerSum(p,c,source),evidence={verified_calculations:[{goal:p.goal,execution_plan:p,plan_sha256:taskHash(p),calculation:c,verification:v}]};
 assert.deepEqual(c.groups,[{key:'north',rows:2,value:'52/5'},{key:'south',rows:1,value:'null'}]);const facts=numericReportFacts(evidence,{identity,sources:source});assert.equal(facts.length,2);assert.equal(facts[0]!.status,'verified');assert.equal(facts[1]!.status,'not_applicable');assert.equal(facts[1]!.value,null);
 const report=compileNumericReport(JSON.stringify({version:'1.3',status:'ready',derivations:[],interpretations:[{references:['F1','F2'],interpretation:'North {{F1}}; south {{F2}}.'}]}),evidence,{identity,sources:source});assert.match(report.text,/不适用/);assert.doesNotMatch(report.text,/south 0/);
 const measured=compileOpenAnalysisIR({version:'1.8',base:{...proposal,group_by:'region'},measure:{currency:'CNY',inputs:[{source_id:proposal.source_id,sheet_id:proposal.sheet_id,column:'price',scale:'10000'}],output_scale:'1',output_label:'CNY'}},source),converted=executeOpenAnalysisIR(measured,source);assert.equal(verifyOpenAnalysisIntegerSum(measured,converted,source).value,converted.value);
});
test('VU-03: professional findings cannot label a zero-weight slice as a verified numeric result',async()=>{
 const {openAnalysisFindings}=await import('../../../packages/contracts/open-analysis-findings.mjs');const {taskHash}=await import('../../../packages/product-core/member-task.ts');const {randomUUID}=await import('node:crypto');
 const framework=compileOpenAnalysisIR({...proposal,group_by:'region'},source),calculation=executeOpenAnalysisIR(framework,source),verification=verifyOpenAnalysisIntegerSum(framework,calculation,source),identity={task_id:randomUUID(),revision:'1',run_id:randomUUID(),scope_sha256:taskHash(source)};
 const findings=openAnalysisFindings({identity,outcome:{outcome_id:randomUUID(),identity,framework,calculation,verification}});const south=findings.find(f=>f.group==='south')!;assert.equal(south.status,'not_applicable');assert.match(south.value,/不适用/);assert.match(south.support.description,/权重总额为零/);
});
