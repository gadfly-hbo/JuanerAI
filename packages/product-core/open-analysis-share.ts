import {membershipRecord as closed} from './member-analysis.ts';
import {taskHash} from './member-task.ts';
import {compileOpenAnalysisIR,executeOpenAnalysisIR,openAnalysisProposal,type OpenAnalysisIR,type OpenAnalysisValue} from './open-analysis-ir.ts';
import type {MemberSourceInspection} from '../ports/member-source.ts';
function fail(code:string):never{throw Object.assign(new Error(code),{code,stack:code});}
export function compileOpenShareIR(raw:unknown,source:MemberSourceInspection):OpenAnalysisIR{
 const p=closed(raw,['version','operation','goal','source_id','sheet_id','column','group_by','filters','unit','input_unit']);
 if(p.version!=='2.0'||p.operation!=='group_share'||p.unit!=='%'||typeof p.group_by!=='string'||!p.group_by)fail('PLAN_INVALID');
 const {input_unit,...proposal}=p,base=compileOpenAnalysisIR({...proposal,version:'1.2',numeric_mode:'decimal',operation:'sum',unit:input_unit},source);
 return {...base,version:'2.0',base,operation:'group_share',unit:'%',input_unit:base.unit,binding_sha256:taskHash({base,relation:'group_share'})};
}
export function openShareProposal(p:OpenAnalysisIR):Record<string,unknown>{return {version:'2.0',operation:'group_share',goal:p.goal,source_id:p.source_id,sheet_id:p.sheet_id,column:p.column,group_by:p.group_by,filters:p.filters,unit:'%',input_unit:p.input_unit};}
/** Reuses actual bound group sums; no per-business-metric calculator. */
export function executeOpenShareIR(p:OpenAnalysisIR,source:MemberSourceInspection):OpenAnalysisValue{
 if(taskHash(compileOpenAnalysisIR(openAnalysisProposal(p),source))!==taskHash(p))fail('SOURCE_CHANGED');
 const amounts=executeOpenAnalysisIR(p.base!,source),parse=(s:string)=>{const [n,d='1']=s.split('/');return {n:BigInt(n!),d:BigInt(d)};},reduce=(n:bigint,d:bigint)=>{if(d<0n){n=-n;d=-d;}let a=n<0n?-n:n,b=d;while(b){const r=a%b;a=b;b=r;}return {n:n/a,d:d/a};},display=(q:{n:bigint;d:bigint})=>q.d===1n?String(q.n):q.n+'/'+q.d;
 const total=amounts.groups!.reduce((t,g)=>{const q=parse(g.value);return reduce(t.n*q.d+q.n*t.d,t.d*q.d);},{n:0n,d:1n});
 const groups=amounts.groups!.map(g=>{const q=parse(g.value);return {...g,value:total.n===0n?'null':display(reduce(q.n*total.d*100n,q.d*total.n))};});
 return {...amounts,plan_sha256:taskHash(p),value:JSON.stringify(groups),groups,unit:'%',method:'checked_share_query',relation:{total:display(total),amounts}};
}
