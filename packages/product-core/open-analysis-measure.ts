import {membershipRecord as closed} from './member-analysis.ts';
import {taskHash} from './member-task.ts';
import {validateOpenMeasure,type OpenMeasure} from './open-analysis-semantics.ts';
import {compileOpenAnalysisIR,openAnalysisProposal,executeOpenAnalysisIR,type OpenAnalysisIR,type OpenAnalysisValue} from './open-analysis-ir.ts';
import {executeOpenJoinIR} from './open-analysis-join.ts';
import type {MemberSourceInspection} from '../ports/member-source.ts';
function fail(code:string):never{throw Object.assign(new Error(code),{code,stack:code});}
export function compileOpenMeasuredIR(raw:unknown,source:MemberSourceInspection):OpenAnalysisIR{
 const p=closed(raw,['version','base','measure']);if(p.version!=='1.8')fail('PLAN_INVALID');const base=compileOpenAnalysisIR(p.base,source),measure=validateOpenMeasure(p.measure);if(!['1.0','1.1','1.2','1.3','1.5','1.7','1.9','2.1','2.3'].includes(base.version)||base.operation==='count')fail('MEASURE_INCOMPATIBLE');
 const allFields=(base.inputs??[base]).map(i=>({source_id:i.source_id,sheet_id:i.sheet_id,column:i.column}));
 const fields=base.version==='2.1'?[...new Map(allFields.map(f=>[taskHash(f),f])).values()]:allFields;
 const inputs=measure.inputs.map(i=>{const rows=source.sources.find(s=>s.source_id===i.source_id)?.sheets.find(s=>s.sheet_id===i.sheet_id)?.rows,headers=rows?.[0]?.cells.filter(c=>c.column===i.column||c.value===i.column);if(headers?.length!==1)fail('MEASURE_BINDING_INVALID');return {...i,column:headers[0]!.column};});
 if(inputs.length!==fields.length||fields.some(f=>inputs.filter(i=>i.source_id===f.source_id&&i.sheet_id===f.sheet_id&&i.column===f.column).length!==1))fail('MEASURE_BINDING_INVALID');
 if(base.version!=='1.7'&&new Set(inputs.map(i=>i.scale)).size!==1)fail('MEASURE_INCOMPATIBLE');
 const normalized={...measure,inputs};return {...base,version:'1.8',base,measure:normalized,unit:measure.output_label,binding_sha256:taskHash({base_binding:base.binding_sha256,measure:normalized})};
}
export function openMeasuredProposal(p:OpenAnalysisIR){if(!p.base||!p.measure)fail('PLAN_INVALID');return {version:'1.8',base:openAnalysisProposal(p.base),measure:p.measure};}
/** Exact rational conversion, used only by primary execution. The verifier has its own arithmetic. */
function convert(raw:string,n:bigint,d:bigint){if(raw==='null')return 'null';if(!/^-?\d+(\/\d+)?$/.test(raw))fail('NUMERIC_METHOD_UNAVAILABLE');const [a,b='1']=raw.split('/');let numerator=BigInt(a!)*n,denominator=BigInt(b)*d;if(denominator<=0n)fail('NUMERIC_METHOD_UNAVAILABLE');let x=numerator<0n?-numerator:numerator,y=denominator;while(y){const r=x%y;x=y;y=r;}numerator/=x;denominator/=x;return denominator===1n?numerator.toString():numerator+'/'+denominator;}
export function executeOpenMeasuredIR(p:OpenAnalysisIR,source:MemberSourceInspection):OpenAnalysisValue{
 if(taskHash(compileOpenAnalysisIR({...openMeasuredProposal(p),...(p.context_sha256?{context_sha256:p.context_sha256}:{})},source))!==taskHash(p))fail('SOURCE_CHANGED');const base=p.base!,measure=p.measure!;
 let value:OpenAnalysisValue;if(base.version==='1.7')value=executeOpenJoinIR(base,source,measure);else{const result=executeOpenAnalysisIR(base,source),n=BigInt(measure.inputs[0]!.scale),d=BigInt(measure.output_scale),groups=result.groups?.map(g=>({...g,value:convert(g.value,n,d)}));value={...result,value:groups?JSON.stringify(groups):convert(result.value,n,d),...(groups?{groups}:{})};}
 return {...value,plan_sha256:taskHash(p),unit:p.unit,method:'checked_measured_query'};
}
