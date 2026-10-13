import {test} from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {randomUUID} from 'node:crypto';
import {inspectSemanticAsset} from '../../../adapters/semantic-assets/sap.ts';import {compileOpenAnalysisContext} from '../../../packages/product-core/open-analysis-context.ts';
import {compileOpenAnalysisIR,executeOpenAnalysisIR} from '../../../packages/product-core/open-analysis-ir.ts';import {verifyOpenAnalysisIntegerSum} from '../../../adapters/analytics-duckdb/open-analysis-verification.ts';
import type {MemberSourceInspection} from '../../../packages/ports/member-source.ts';
import {syntheticAssetInspection,assetProposal} from '../../fixtures/metric-assets.ts';
import {taskHash} from '../../../packages/product-core/member-task.ts';

function shippingInput(version:string,paid='100',shipping='0',minorUnits=false){
 const source:any=syntheticAssetInspection(),proposal:any=assetProposal(version);
 proposal.parameters.amount_basis='paid_including_shipping';proposal.bindings.orders.columns.shipping_amount='shipping';
 const rows=source.sources[0].sheets[0].rows;
 rows[0].cells.push({column:'7',type:'string',value:'shipping'});
 for(const row of rows.slice(1))row.cells.push({column:'7',type:'string',value:'0'});
 rows[1].cells[2].value=paid;rows[1].cells[6].value=shipping;
 if(minorUnits){proposal.parameters.order_amount_scale='0.01';proposal.parameters.refund_amount_scale='0.01';for(const row of rows.slice(1)){row.cells[2].value=String(Number(row.cells[2].value)*100);row.cells[6].value=String(Number(row.cells[6].value)*100);}for(const row of source.sources[1].sheets[0].rows.slice(1))row.cells[2].value=String(Number(row.cells[2].value)*100);}
 return {source,proposal,plan:compileOpenAnalysisIR(proposal,source)};
}
for(const version of ['1.1.0','1.1.1'])for(const minorUnits of [false,true]){
 for(const [label,paid,shipping] of [['negative shipping','100','-5'],['negative paid offset by shipping','-100','-200'],['shipping exceeds paid','100','101']]){
  test(`MF-05/MFC-03: execution rejects ${label} before subtraction (${version}, minor=${minorUnits})`,()=>{const {source,plan}=shippingInput(version!,paid,shipping,minorUnits);assert.throws(()=>executeOpenAnalysisIR(plan,source),{code:'ASSET_AMOUNT_INVALID'});});
  test(`MF-06/MFC-03: independent verifier rejects forged ${label} (${version}, minor=${minorUnits})`,()=>{
   const bad=shippingInput(version!,paid,shipping,minorUnits);
   // A valid comparison source has the same claimed goods value for the two
   // sign counterexamples. Rebind provenance to test qualification independently
   // of execution, even after execution correctly refuses the invalid source.
   const goods=Number(paid)-Number(shipping),valid=shippingInput(version!,String(Math.max(goods,100)+5),'5',minorUnits);
   const result={...executeOpenAnalysisIR(valid.plan,valid.source),plan_sha256:taskHash(bad.plan),inspection_sha256:taskHash(bad.source),source_sha256:bad.plan.source_sha256};
   assert.throws(()=>verifyOpenAnalysisIntegerSum(bad.plan,result,bad.source),{code:'VERIFICATION_FAILED'});
  });
 }
 test(`MF-05/06: valid shipping preserves periods, categories, scale and zero shipping (${version}, minor=${minorUnits})`,()=>{
  const {source,plan}=shippingInput(version,'100','5',minorUnits),result=executeOpenAnalysisIR(plan,source),analysis=result.asset_analysis!;
  assert.equal(result.value,'145');assert.equal(analysis.total.metrics.gmv,'175');assert.equal(analysis.total.metrics.refund_amount,'30');
  assert.deepEqual(analysis.periods.map(p=>p.metrics.net_sales),version==='1.1.0'?['65','80']:['95','50']);
  assert.deepEqual(analysis.group_delta.map(g=>[g.key,g.net_sales]),version==='1.1.0'?[['A','-65'],['B','80']]:[['A','-125'],['B','80']]);
  assert.equal(verifyOpenAnalysisIntegerSum(plan,result,source).grade,'independent_arithmetic');
 });
}
test('MF-04/05/06: exact asset flows through original Context/IR and changes refund attribution with fixed 13-week oracle',()=>{
 for(const [v,values] of [['1.1.0',['70','80']],['1.1.1',['100','50']]] as const){const inspection=syntheticAssetInspection(),proposal=assetProposal(v),context=compileOpenAnalysisContext(proposal,proposal.goal,inspection),plan=compileOpenAnalysisIR(context.proposal.plan,inspection),result:any=executeOpenAnalysisIR(plan,inspection);
 assert.equal(result.value,'150');assert.equal(result.asset_analysis.weekly.length,13);assert.deepEqual(result.asset_analysis.periods.map((p:any)=>p.metrics.net_sales),values);assert.deepEqual(result.asset_analysis.periods.map((p:any)=>p.metrics.refund_rate),['1','0']);assert.equal(result.asset_analysis.total.metrics.gmv,'180');assert.equal(result.asset_analysis.total.metrics.refund_amount,'30');assert.equal(result.asset_analysis.total.metrics.refund_rate,'0.5');
 assert.deepEqual(result.asset_analysis.periods.map((p:any)=>p.groups.map((g:any)=>[g.key,g.metrics.net_sales])),v==='1.1.0'?[[['A','70']],[['B','80']]]:[[['A','100']],[['A','-30'],['B','80']]]);
 assert.equal(result.asset_analysis.periods[1].metrics.order_count,'1');assert.equal(result.asset_analysis.weekly[12].metrics.refund_rate,null);
 assert.equal(verifyOpenAnalysisIntegerSum(plan,result,inspection).value,'150');assert.throws(()=>verifyOpenAnalysisIntegerSum(plan,{...result,value:'180'},inspection),{code:'VERIFICATION_FAILED'});
 }
});
test('MF-05/06: raw eligibility and whole-input safety reject supplier missed cases and malformed identities',()=>{
 for(const [code,change] of [
  ['ASSET_MIXED_CURRENCY',(s:any)=>s.sources[1].sheets[0].rows[1].cells[3].value='USD'],
  ['ASSET_INELIGIBLE_REFUND_ORDER',(s:any)=>s.sources[1].sheets[0].rows[1].cells[1].value='O3'],
  ['JOIN_CARDINALITY_CONFLICT',(s:any)=>s.sources[0].sheets[0].rows[2].cells[0].value='O1'],
  ['REFUND_ID_CONFLICT',(s:any)=>s.sources[1].sheets[0].rows[2].cells[0].value='R1'],
  ['JOIN_NOT_FOUND',(s:any)=>s.sources[1].sheets[0].rows[1].cells[1].value='missing'],
  ['ASSET_REFUND_EXCEEDS_ORDER',(s:any)=>s.sources[1].sheets[0].rows[1].cells[2].value='101'],
  ['REFUND_SIGN_CONFLICT',(s:any)=>s.sources[1].sheets[0].rows[1].cells[2].value='-1'],
  ['ASSET_DATE_INVALID',(s:any)=>s.sources[0].sheets[0].rows[1].cells[1].value='2026-02-30T00:00:00+08:00'],
  ['ROW_BINDING_INCOMPLETE',(s:any)=>s.sources[0].sheets[0].rows[2].row=2],
 ] as const){const source=syntheticAssetInspection();change(source);const plan=compileOpenAnalysisIR(assetProposal(),source);assert.throws(()=>executeOpenAnalysisIR(plan,source),{code});}
});
test('MF-05: completed historical refunds support a restricted zero-cohort report, while fully empty blocks',()=>{
 const source:any=syntheticAssetInspection();source.sources[0].sheets[0].rows=source.sources[0].sheets[0].rows.slice(0,2);source.sources[0].sheets[0].rows[1].cells[1].value='2026-07-06T00:00:00+08:00';source.sources[1].sheets[0].rows=source.sources[1].sheets[0].rows.slice(0,3);
 const plan=compileOpenAnalysisIR(assetProposal('1.1.1'),source),value=executeOpenAnalysisIR(plan,source);assert.equal(value.value,'-30');assert.equal(value.asset_analysis!.total.metrics.gmv,'0');assert.equal(value.asset_analysis!.total.metrics.refund_rate,null);assert.ok(value.asset_analysis!.limitations.some(v=>v.includes('证据不足')));assert.equal(verifyOpenAnalysisIntegerSum(plan,value,source).value,'-30');
 for(const s of source.sources)s.sheets[0].rows=s.sheets[0].rows.slice(0,1);const empty=compileOpenAnalysisIR(assetProposal(),source);assert.throws(()=>executeOpenAnalysisIR(empty,source),{code:'NO_DATA'});
});
test('MF-05: declared arithmetic, scales, exact boundaries and source identity affect execution',()=>{
 const source:any=syntheticAssetInspection(),proposal=assetProposal();proposal.parameters.output_scale='3';const plan=compileOpenAnalysisIR(proposal,source),value=executeOpenAnalysisIR(plan,source);assert.equal(value.value,'50');assert.equal(value.asset_analysis!.periods[0]!.metrics.net_sales,'70/3');assert.equal(verifyOpenAnalysisIntegerSum(plan,value,source).value,'50');
 source.sources[0].sheets[0].rows[1].cells[2].value='110';assert.throws(()=>executeOpenAnalysisIR(plan,source),{code:'SOURCE_CHANGED'});
});
test('MFC-05/06: exact method decomposes each category independently; duplicate source identities never bind',()=>{for(const [v,a] of [['1.1.0','-70'],['1.1.1','-130']]){const source=syntheticAssetInspection(),plan=compileOpenAnalysisIR(assetProposal(v),source),value:any=executeOpenAnalysisIR(plan,source);assert.equal(value.asset_analysis.group_delta.find((g:any)=>g.key==='A').net_sales,a);assert.equal(value.asset_analysis.group_delta.find((g:any)=>g.key==='B').net_sales,'80');assert.equal(verifyOpenAnalysisIntegerSum(plan,value,source).value,'150');value.asset_analysis.group_delta[0].net_sales='0';assert.throws(()=>verifyOpenAnalysisIntegerSum(plan,value,source),{code:'VERIFICATION_FAILED'});}const source:any=syntheticAssetInspection();source.sources.push(structuredClone(source.sources[0]));assert.throws(()=>compileOpenAnalysisIR(assetProposal(),source),{code:'ASSET_BINDING_INVALID'});});


test('MF-SCOPE-01: asset status scope accepts equivalent filters and rejects source/category/status expansion',()=>{
 const p=assetProposal(),source=syntheticAssetInspection();
 const scope={classification:'MODEL_PROPOSAL' as const,purpose:'净额复盘',object:'订单与退款',scope:'仅支付及完成',deliverables:['净销售'],hypotheses:[],unknowns:[],execution_scope:[{source_id:p.bindings.orders.source_id,sheet_id:'csv',filters:[{column:'status',operator:'eq' as const,value:'paid'}]},{source_id:p.bindings.refunds.source_id,sheet_id:'csv',filters:[{column:'status',operator:'eq' as const,value:'completed'}]}]};
 assert.doesNotThrow(()=>compileOpenAnalysisContext(p,p.goal,source,scope));
 for(const [column,value] of [['status','unpaid'],['category','A']]){const wrong=structuredClone(scope);wrong.execution_scope[0]!.filters=[{column,operator:'eq',value}];assert.throws(()=>compileOpenAnalysisContext(p,p.goal,source,wrong),{code:'FRAMEWORK_REVISION_REQUIRED'});}
 const missing=structuredClone(scope);missing.execution_scope.pop();assert.throws(()=>compileOpenAnalysisContext(p,p.goal,source,missing),{code:'FRAMEWORK_REVISION_REQUIRED'});
 const multi={...p,parameters:{...p.parameters,paid_statuses:['paid','settled']}};assert.throws(()=>compileOpenAnalysisContext(multi,p.goal,source,scope),{code:'FRAMEWORK_REVISION_REQUIRED'});
});
