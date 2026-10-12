import {membershipRecord as closed} from './member-analysis.ts';
import {taskHash} from './member-task.ts';
import {compileOpenAnalysisIR,executeOpenAnalysisIR,openAnalysisProposal,type OpenAnalysisIR,type OpenAnalysisValue} from './open-analysis-ir.ts';
import type {MemberSourceInspection} from '../ports/member-source.ts';
function fail(code:string):never{throw Object.assign(new Error(code),{code,stack:code});}
export function compileOpenAllocationIR(raw:unknown,source:MemberSourceInspection):OpenAnalysisIR{
 const p=closed(raw,['version','operation','goal','unit','inputs','rounding',...(Object.hasOwn(raw as object,'measure')?['measure']:[])]);
 if(p.version!=='2.2'||p.operation!=='proportional_allocation'||!Array.isArray(p.inputs)||p.inputs.length!==2)fail('PLAN_INVALID');
 const rounding=closed(p.rounding,['decimals','method','tie_break']);if(!Number.isSafeInteger(rounding.decimals)||Number(rounding.decimals)<0||Number(rounding.decimals)>6||rounding.method!=='largest_remainder'||rounding.tie_break!=='object_key')fail('ROUNDING_POLICY_REQUIRED');
 const [cost,weight]=p.inputs.map(input=>closed(input,['source_id','sheet_id','column','group_by','filters']));if(cost!.group_by!==null||typeof weight!.group_by!=='string'||!weight!.group_by)fail('PLAN_INVALID');
 const rawPool={...cost,version:'1.2',numeric_mode:'decimal',operation:'sum',goal:p.goal,unit:p.measure?'原输入数值':p.unit},pool=compileOpenAnalysisIR(p.measure?{version:'1.8',base:rawPool,measure:p.measure}:rawPool,source),weights=compileOpenAnalysisIR({...weight,version:'1.2',numeric_mode:'decimal',operation:'sum',goal:p.goal,unit:'权重输入数值'},source);
 if(pool.unit!==p.unit)fail('MEASURE_INCOMPATIBLE');
 return {...pool,version:'2.2',operation:'proportional_allocation',inputs:[pool,weights],rounding:rounding as NonNullable<OpenAnalysisIR['rounding']>,source_sha256:taskHash([pool.source_sha256,weights.source_sha256]),binding_sha256:taskHash({pool,weights,rounding})};
}
export function openAllocationProposal(p:OpenAnalysisIR):Record<string,unknown>{return {version:'2.2',operation:'proportional_allocation',goal:p.goal,unit:p.unit,inputs:p.inputs?.map(i=>({source_id:i.source_id,sheet_id:i.sheet_id,column:i.column,group_by:i.group_by,filters:i.filters})),rounding:p.rounding,...(p.measure?{measure:p.measure}:{})};}
export function executeOpenAllocationIR(p:OpenAnalysisIR,source:MemberSourceInspection):OpenAnalysisValue{
 if(taskHash(compileOpenAnalysisIR(openAnalysisProposal(p),source))!==taskHash(p))fail('SOURCE_CHANGED');
 const pool=executeOpenAnalysisIR(p.inputs![0]!,source),weights=executeOpenAnalysisIR(p.inputs![1]!,source);
 type Q={n:bigint;d:bigint};const parse=(s:string):Q=>{const [n,d='1']=s.split('/');return {n:BigInt(n!),d:BigInt(d)};},reduce=(n:bigint,d:bigint):Q=>{let a=n<0n?-n:n,b=d;while(b){const r=a%b;a=b;b=r;}return {n:n/a,d:d/a};},display=(q:Q)=>q.d===1n?String(q.n):q.n+'/'+q.d;
 const factor=10n**BigInt(p.rounding!.decimals),cost=parse(pool.value);if(cost.n*factor%cost.d!==0n)fail('POOL_ROUNDING_DECISION_REQUIRED');const target=cost.n*factor/cost.d;
 let total:Q={n:0n,d:1n};for(const g of weights.groups!){if(!g.key.trim())fail('ALLOCATION_OBJECT_MISSING');if(g.rows!==1)fail('ALLOCATION_DUPLICATE_OBJECT');const w=parse(g.value);if(w.n<0n)fail('NEGATIVE_WEIGHT_UNSUPPORTED');total=reduce(total.n*w.d+w.n*total.d,total.d*w.d);}
 if(total.n===0n)fail('WEIGHT_TOTAL_ZERO');
 const allocations=weights.groups!.map(g=>{const w=parse(g.value),n=target*w.n*total.d,d=w.d*total.n;let floor=n/d;if(n<0n&&n%d!==0n)floor--;return {key:g.key,rows:g.rows,allocated:floor,remainder:n-floor*d,denominator:d,weight:w};});
 const leftover=target-allocations.reduce((t,a)=>t+a.allocated,0n);if(leftover<0n||leftover>BigInt(allocations.length))fail('ALLOCATION_FAILED');
 const ranked=[...allocations].sort((a,b)=>{const diff=b.remainder*a.denominator-a.remainder*b.denominator;return diff<0n?-1:diff>0n?1:a.key<b.key?-1:a.key>b.key?1:0;});for(let i=0;i<Number(leftover);i++)ranked[i]!.allocated++;
 const groups=allocations.map(g=>({key:g.key,rows:g.rows,value:display(reduce(g.allocated,factor))}));
 return {version:'1.0',plan_sha256:taskHash(p),inspection_sha256:taskHash(source),source_sha256:p.source_sha256,value:JSON.stringify(groups),groups,unit:p.unit,rows:pool.rows+weights.rows,method:'checked_allocation_query',allocation:{pool,weights,weight_total:display(total)}};
}
