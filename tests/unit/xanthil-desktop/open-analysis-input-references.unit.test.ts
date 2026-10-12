import test from 'node:test';
import assert from 'node:assert/strict';
import {resolveOpenStepInputReferences} from '../../../packages/application/open-analysis-input-references.ts';
import {compileOpenAnalysisSteps} from '../../../packages/product-core/open-analysis-steps.ts';
import type {MemberSourceInspection} from '../../../packages/ports/member-source.ts';
const source:MemberSourceInspection={version:'1.0',sources:[{source_id:'11111111-1111-4111-a111-111111111111',display_name:'selected.csv',format:'csv',sha256:'a'.repeat(64),byte_length:'30',sheets:[{sheet_id:'csv',name:'CSV',state:'visible',rows:[{row:1,cells:[{column:'A',type:'string',value:'地区'},{column:'B',type:'string',value:'金额'}]},{row:2,cells:[{column:'A',type:'string',value:'北'},{column:'B',type:'number',value:'7'}]}]}]}]};
const plan={version:'1.1',goal:'汇总',source_id:source.sources[0]!.source_id,sheet_id:'csv',operation:'sum',column:'金额',group_by:'地区',filters:[],unit:'元'};
const one={step_id:'22222222-2222-4222-a222-222222222222',title:'汇总',depends_on:[],hypotheses:[],required_evidence:[],limitations:[],plan};
test('R1-RT12: exact source headers and unique title dependency become real bound IDs, preserving original arguments',()=>{
 const input={version:'1.0',steps:[one,{...one,step_id:'33333333-3333-4333-a333-333333333333',title:'复核',depends_on:['汇总']}]};const original=structuredClone(input),resolved:any=resolveOpenStepInputReferences(input,source);assert.deepEqual(input,original);assert.equal(resolved.steps[0].plan.column,'B');assert.equal(resolved.steps[0].plan.group_by,'A');assert.deepEqual(resolved.steps[1].depends_on,[one.step_id]);assert.equal(compileOpenAnalysisSteps(resolved,source,'汇总金额').steps.length,2);
});
test('R1-RT12: duplicate/unknown headers and missing plan/reference report all paths without repairing business input',()=>{
 const duplicate=structuredClone(source);duplicate.sources[0]!.sheets[0]!.rows[0]!.cells.push({column:'C',type:'string',value:'金额'});const input={version:'1.0',steps:[one,{...one,step_id:'33333333-3333-4333-a333-333333333333',title:'复核',depends_on:['plan:汇总'],plan:null}]};const original=structuredClone(input);assert.throws(()=>resolveOpenStepInputReferences(input,duplicate),(e:any)=>{assert.equal(e.code,'PLAN_INVALID');assert.deepEqual(e.safe_details.invalid_fields.map((p:any)=>p.path),['steps[0].plan.column','steps[1].depends_on[0]','steps[1].plan']);return true;});assert.deepEqual(input,original);
 for(const column of ['金 額','金额合计','另一个来源的字段'])assert.throws(()=>resolveOpenStepInputReferences({version:'1.0',steps:[{...one,plan:{...plan,column}}]},source),{code:'PLAN_INVALID'});
});
test('R1-RT12: hidden or wrong source does not bind header aliases; Core still rejects unavailable scope',()=>{
 const hidden=structuredClone(source);hidden.sources[0]!.sheets[0]!.state='hidden';const input={version:'1.0',steps:[one]};const resolved=resolveOpenStepInputReferences(input,hidden);assert.equal((resolved.steps as any[])[0].plan.column,'金额');assert.throws(()=>compileOpenAnalysisSteps(resolved,hidden,'汇总金额'));
 const other={version:'1.0',steps:[{...one,plan:{...plan,source_id:'44444444-4444-4444-a444-444444444444'}}]};assert.throws(()=>compileOpenAnalysisSteps(resolveOpenStepInputReferences(other,source),source,'汇总金额'));
});


test('R1-RT16: unique full selected source/sheet names resolve before actual field headers',()=>{
 const named={...one,plan:{...plan,source_id:'selected.csv',sheet_id:'CSV'}};
 const result:any=resolveOpenStepInputReferences({steps:[named]},source);
 assert.equal(result.steps[0].plan.source_id,source.sources[0]!.source_id);assert.equal(result.steps[0].plan.sheet_id,'csv');assert.equal(result.steps[0].plan.column,'B');assert.equal(result.steps[0].plan.group_by,'A');assert.equal(named.plan.source_id,'selected.csv');
});
test('R1-RT16: unknown/ambiguous selected names fail with actual reference path; explicit IDs remain usable',()=>{
 const graph={steps:[{...one,plan:{...plan,source_id:'selected.csv',sheet_id:'CSV'}}]};
 const duplicate:MemberSourceInspection={...source,sources:[...source.sources,{...source.sources[0]!,source_id:'33333333-3333-4333-a333-333333333333'}]};
 for(const [input,inspection] of [[graph,duplicate],[{steps:[{...one,plan:{...plan,source_id:'selected'}}]},source],[{steps:[{...one,plan:{...plan,sheet_id:'other'}}]},source]] as const){assert.throws(()=>resolveOpenStepInputReferences(input,inspection),(error:any)=>error.code==='PLAN_INVALID'&&error.safe_details.invalid_fields.some((f:any)=>f.path.endsWith('.source_id')||f.path.endsWith('.sheet_id')));}
 const explicit:any=resolveOpenStepInputReferences({steps:[one]},duplicate);assert.equal(explicit.steps[0].plan.source_id,source.sources[0]!.source_id);assert.equal(explicit.steps[0].plan.column,'B');
});


test('V13-NULLABLE-BINDING01: grouping feedback distinguishes explicit null from an unresolved field without repairing input or relaxing required columns',async()=>{
 const {compileOpenAnalysisIR,executeOpenAnalysisIR}=await import('../../../packages/product-core/open-analysis-ir.ts');
 const input={steps:[{...one,plan:{...plan,group_by:''}}]},before=structuredClone(input);
 assert.throws(()=>resolveOpenStepInputReferences(input,source),(error:any)=>{const issue=error.safe_details.invalid_fields[0];assert.equal(error.code,'PLAN_INVALID');assert.equal(issue.path,'steps[0].plan.group_by');assert.match(issue.expected,/explicit null/);assert.match(issue.expected,/current method/);assert.match(issue.expected,/empty string/);assert.deepEqual(issue.available,[{column:'A',header:'地区'},{column:'B',header:'金额'}]);return true;});
 assert.deepEqual(input,before,'rejected model arguments are not repaired');
 const explicit:any=resolveOpenStepInputReferences({steps:[{...one,plan:{...plan,group_by:null}}]},source);const bound=compileOpenAnalysisIR(explicit.steps[0].plan,source);assert.equal(bound.group_by,null);assert.equal(executeOpenAnalysisIR(bound,source).value,'7');
 for(const key of ['column','weight_column'])assert.throws(()=>resolveOpenStepInputReferences({steps:[{...one,plan:{...plan,[key]:''}}]},source),(error:any)=>{const issue=error.safe_details.invalid_fields.find((i:any)=>i.path.endsWith('.'+key));assert.ok(issue);assert.doesNotMatch(issue.expected,/explicit null/);return true;});
});
