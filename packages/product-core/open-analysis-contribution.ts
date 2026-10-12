import {membershipRecord as closed} from './member-analysis.ts';
import {taskHash} from './member-task.ts';
import {compileOpenAnalysisIR,executeOpenAnalysisIR,openAnalysisProposal,type OpenAnalysisIR,type OpenAnalysisValue} from './open-analysis-ir.ts';
import type {MemberSourceInspection} from '../ports/member-source.ts';
function fail(code:string):never{throw Object.assign(new Error(code),{code,stack:code});}
export function compileOpenContributionIR(raw:unknown,source:MemberSourceInspection):OpenAnalysisIR{
 const p=closed(raw,['version','operation','goal','unit','comparison_label','current_label','inputs']);
 if(p.version!=='2.1'||p.operation!=='group_change'||!Array.isArray(p.inputs)||p.inputs.length!==2||![p.comparison_label,p.current_label].every(v=>typeof v==='string'&&!!v.trim()&&v.length<=200&&!v.includes('\0')))fail('PLAN_INVALID');
 const inputs=p.inputs.map(input=>{const b=closed(input,['source_id','sheet_id','column','group_by','filters']);if(typeof b.group_by!=='string'||!b.group_by)fail('PLAN_INVALID');return compileOpenAnalysisIR({...b,version:'1.2',numeric_mode:'decimal',operation:'sum',goal:p.goal,unit:p.unit},source);});
 const first=inputs[0]!;return {...first,version:'2.1',operation:'group_change',inputs,comparison_label:p.comparison_label as string,current_label:p.current_label as string,source_sha256:taskHash(inputs.map(i=>({source_id:i.source_id,sha256:i.source_sha256}))),binding_sha256:taskHash(inputs)};
}
export function openContributionProposal(p:OpenAnalysisIR):Record<string,unknown>{return {version:'2.1',operation:'group_change',goal:p.goal,unit:p.unit,comparison_label:p.comparison_label,current_label:p.current_label,inputs:p.inputs?.map(i=>({source_id:i.source_id,sheet_id:i.sheet_id,column:i.column,group_by:i.group_by,filters:i.filters}))};}
export function executeOpenContributionIR(p:OpenAnalysisIR,source:MemberSourceInspection):OpenAnalysisValue{
 if(taskHash(compileOpenAnalysisIR(openAnalysisProposal(p),source))!==taskHash(p))fail('SOURCE_CHANGED');
 const baseline=executeOpenAnalysisIR(p.inputs![0]!,source),current=executeOpenAnalysisIR(p.inputs![1]!,source);
 type Q={n:bigint;d:bigint};const parse=(s:string):Q=>{const [n,d='1']=s.split('/');return {n:BigInt(n!),d:BigInt(d)};},reduce=(n:bigint,d:bigint):Q=>{if(d<0n){n=-n;d=-d;}let a=n<0n?-n:n,b=d;while(b){const r=a%b;a=b;b=r;}return {n:n/a,d:d/a};},add=(a:Q,b:Q)=>reduce(a.n*b.d+b.n*a.d,a.d*b.d),subtract=(a:Q,b:Q)=>reduce(a.n*b.d-b.n*a.d,a.d*b.d),display=(q:Q)=>q.d===1n?String(q.n):q.n+'/'+q.d;
 const old=new Map(baseline.groups!.map(g=>[g.key,g])),now=new Map(current.groups!.map(g=>[g.key,g])),keys=[...new Set([...old.keys(),...now.keys()])].sort((a,b)=>a<b?-1:a>b?1:0);
 const total=subtract(current.groups!.reduce((t,g)=>add(t,parse(g.value)),{n:0n,d:1n}),baseline.groups!.reduce((t,g)=>add(t,parse(g.value)),{n:0n,d:1n}));
 const operands=keys.map(key=>{const before=old.get(key)?.value??'0',after=now.get(key)?.value??'0',change=subtract(parse(after),parse(before));return {key,baseline:before,current:after,change:display(change),share:total.n===0n?'null':display(reduce(change.n*total.d*100n,change.d*total.n))};});
 const groups=operands.map(g=>({key:g.key,value:g.change,rows:(old.get(g.key)?.rows??0)+(now.get(g.key)?.rows??0)}));
 return {version:'1.0',plan_sha256:taskHash(p),inspection_sha256:taskHash(source),source_sha256:p.source_sha256,value:JSON.stringify(groups),groups,unit:p.unit,rows:baseline.rows+current.rows,method:'checked_contribution_query',comparison:{baseline,current,total_change:display(total),groups:operands}};
}
