import {membershipRecord as closed} from './member-analysis.ts';
import {taskHash} from './member-task.ts';
import {compileOpenAnalysisIR,executeOpenAnalysisIR,openAnalysisProposal,type OpenAnalysisIR,type OpenAnalysisValue} from './open-analysis-ir.ts';
import type {MemberSourceInspection} from '../ports/member-source.ts';
function fail(code:string,keys?:string[]):never{throw Object.assign(new Error(code),{code,stack:code,...(keys?{safe_details:{keys}}:{})});}
export function compileOpenReconciliationIR(raw:unknown,source:MemberSourceInspection):OpenAnalysisIR{
 const p=closed(raw,['version','operation','goal','unit','left_label','right_label','grain','cardinality','inputs']);
 if(p.version!=='2.3'||p.operation!=='reconcile'||p.grain!=='one_row_per_key'||p.cardinality!=='one_to_one'||!Array.isArray(p.inputs)||p.inputs.length!==2||![p.left_label,p.right_label].every(v=>typeof v==='string'&&!!v.trim()&&v.length<=200&&!v.includes('\0')))fail('PLAN_INVALID');
 const inputs=p.inputs.map(input=>{const b=closed(input,['source_id','sheet_id','column','group_by','filters']);if(typeof b.group_by!=='string'||!b.group_by)fail('PLAN_INVALID');return compileOpenAnalysisIR({...b,version:'1.2',numeric_mode:'decimal',operation:'sum',goal:p.goal,unit:p.unit},source);});
 return {...inputs[0]!,version:'2.3',operation:'reconcile',inputs,left_label:p.left_label as string,right_label:p.right_label as string,grain:'one_row_per_key',cardinality:'one_to_one',source_sha256:taskHash(inputs.map(i=>({source_id:i.source_id,sha256:i.source_sha256}))),binding_sha256:taskHash(inputs)};
}
export function openReconciliationProposal(p:OpenAnalysisIR):Record<string,unknown>{return {version:'2.3',operation:'reconcile',goal:p.goal,unit:p.unit,left_label:p.left_label,right_label:p.right_label,grain:p.grain,cardinality:p.cardinality,inputs:p.inputs?.map(i=>({source_id:i.source_id,sheet_id:i.sheet_id,column:i.column,group_by:i.group_by,filters:i.filters}))};}
export function executeOpenReconciliationIR(p:OpenAnalysisIR,source:MemberSourceInspection):OpenAnalysisValue{
 if(taskHash(compileOpenAnalysisIR(openAnalysisProposal(p),source))!==taskHash(p))fail('SOURCE_CHANGED');
 const left=executeOpenAnalysisIR(p.inputs![0]!,source),right=executeOpenAnalysisIR(p.inputs![1]!,source);
 for(const side of [left,right]){const duplicates=side.groups!.filter(g=>g.rows!==1).map(g=>g.key);if(duplicates.length)fail('RECONCILIATION_DUPLICATE_KEY',duplicates);if(side.groups!.some(g=>!g.key.trim()))fail('RECONCILIATION_KEY_MISSING');}
 const l=new Map(left.groups!.map(g=>[g.key,g])),r=new Map(right.groups!.map(g=>[g.key,g])),keys=[...new Set([...l.keys(),...r.keys()])].sort((a,b)=>a<b?-1:a>b?1:0);
 const subtract=(a:string,b:string)=>{const [an,ad='1']=a.split('/'),[bn,bd='1']=b.split('/');let n=BigInt(an!)*BigInt(bd)-BigInt(bn!)*BigInt(ad),d=BigInt(ad)*BigInt(bd),x=n<0n?-n:n,y=d;while(y){const next=x%y;x=y;y=next;}n/=x;d/=x;return d===1n?String(n):n+'/'+d;};
 const entries=keys.map(key=>{const a=l.get(key),b=r.get(key),difference=subtract(a?.value??'0',b?.value??'0');return {key,left:a?.value??null,right:b?.value??null,difference,left_rows:a?.rows??0,right_rows:b?.rows??0,state:!a?'right_only' as const:!b?'left_only' as const:difference==='0'?'matched' as const:'difference' as const};});
 const groups=entries.map(e=>({key:e.key,value:e.difference,rows:e.left_rows+e.right_rows}));
 return {version:'1.0',plan_sha256:taskHash(p),inspection_sha256:taskHash(source),source_sha256:p.source_sha256,value:JSON.stringify(groups),groups,unit:p.unit,rows:left.rows+right.rows,method:'checked_reconciliation_query',reconciliation:{left,right,balanced:entries.every(e=>e.state==='matched'),entries}};
}
