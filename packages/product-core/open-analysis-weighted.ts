import {membershipRecord as closed} from './member-analysis.ts';
import {taskHash} from './member-task.ts';
import {compileOpenAnalysisIR,openAnalysisProposal,type OpenAnalysisIR,type OpenAnalysisValue} from './open-analysis-ir.ts';
import type {MemberSourceInspection} from '../ports/member-source.ts';
function fail(code:string):never{throw Object.assign(new Error(code),{code,stack:code});}
export function compileOpenWeightedIR(raw:unknown,source:MemberSourceInspection):OpenAnalysisIR{
 const p=closed(raw,['version','goal','source_id','sheet_id','operation','column','weight_column','unit','group_by','filters']);
 if(p.version!=='1.9'||p.operation!=='weighted_mean')fail('PLAN_INVALID');
 const {weight_column,...base}=p;
 const values=compileOpenAnalysisIR({...base,version:'1.2',numeric_mode:'decimal',operation:'mean'},source);
 const weights=compileOpenAnalysisIR({...base,version:'1.2',numeric_mode:'decimal',operation:'sum',column:weight_column},source);
 return {...values,version:'1.9',operation:'weighted_mean',weight_column:weights.column,binding_sha256:taskHash({value:values.binding_sha256,weight:weights.binding_sha256})};
}
export function openWeightedProposal(p:OpenAnalysisIR):Record<string,unknown>{return {version:'1.9',goal:p.goal,source_id:p.source_id,sheet_id:p.sheet_id,operation:'weighted_mean',column:p.column,weight_column:p.weight_column,unit:p.unit,group_by:p.group_by,filters:p.filters};}
/** Main route uses bounded decimal scaling and checked integer products/sums. */
export function executeOpenWeightedIR(plan:OpenAnalysisIR,source:MemberSourceInspection):OpenAnalysisValue{
 if(taskHash(compileOpenAnalysisIR(openAnalysisProposal(plan),source))!==taskHash(plan))fail('SOURCE_CHANGED');
 const sheet=source.sources.find(s=>s.source_id===plan.source_id)!.sheets.find(s=>s.sheet_id===plan.sheet_id)!,seen=new Set<number>();
 const decimal=(v:string)=>{if(v.length>2000||! /^-?(0|[1-9]\d*)(\.\d+)?$/.test(v)||(v.split('.')[1]?.length??0)>15)fail('NUMERIC_METHOD_UNAVAILABLE');return v;};
 const compareDecimal=(left:string,right:string)=>{decimal(left);decimal(right);const precision=Math.max(left.split('.')[1]?.length??0,right.split('.')[1]?.length??0);const scaled=(v:string)=>{const negative=v.startsWith('-'),[whole,fraction='']=v.replace(/^-/,'').split('.');return BigInt(whole+fraction.padEnd(precision,'0'))*(negative?-1n:1n);};return scaled(left)-scaled(right);};
 const records=sheet.rows.slice(1).map(row=>{if(!Number.isSafeInteger(row.row)||row.row<=sheet.rows[0]!.row||seen.has(row.row))fail('SOURCE_UNQUALIFIED');seen.add(row.row);const cell=(column:string)=>{const cells=row.cells.filter(c=>c.column===column);if(cells.length!==1||!['string','number'].includes(cells[0]!.type))fail('ROW_BINDING_INCOMPLETE');return cells[0]!.value;};
 const selected=(plan.filters??[]).every(f=>{const v=cell(f.column);return f.operator==='eq'?v===f.value:f.operator==='ne'?v!==f.value:f.operator==='ge'?compareDecimal(v,f.value)>=0n:compareDecimal(v,f.value)<=0n;});
 return selected?{value:decimal(cell(plan.column)),weight:decimal(cell(plan.weight_column!)),key:plan.group_by?cell(plan.group_by):''}:null;
 }).filter(r=>r!==null);
 if(!records.length)fail('NO_DATA');
 const places=(v:string)=>v.split('.')[1]?.length??0,valuePlaces=records.reduce((max,r)=>Math.max(max,places(r.value)),0),weightPlaces=records.reduce((max,r)=>Math.max(max,places(r.weight)),0);
 const scale=(v:string,precision:number)=>{const negative=v.startsWith('-'),[whole,fraction='']=v.replace(/^-/,'').split('.'),n=Number(whole+fraction.padEnd(precision,'0'))*(negative?-1:1);if(!Number.isSafeInteger(n))fail('NUMERIC_METHOD_UNAVAILABLE');return n;};
 const buckets=new Map<string,{numerator:number;denominator:number;rows:number}>();
 for(const r of records){const v=scale(r.value,valuePlaces),w=scale(r.weight,weightPlaces);if(w<0)fail('NEGATIVE_WEIGHT_UNSUPPORTED');const b=buckets.get(r.key)??{numerator:0,denominator:0,rows:0},product=v*w;if(!Number.isSafeInteger(product))fail('NUMERIC_METHOD_UNAVAILABLE');b.numerator+=product;b.denominator+=w;b.rows++;if(!Number.isSafeInteger(b.numerator)||!Number.isSafeInteger(b.denominator))fail('NUMERIC_METHOD_UNAVAILABLE');buckets.set(r.key,b);}
 const fraction=(n:bigint,d:bigint)=>{let a=n<0n?-n:n,b=d;while(b){const r=a%b;a=b;b=r;}n/=a;d/=a;return d===1n?String(n):n+'/'+d;};
 const operands=[...buckets].sort(([a],[b])=>a<b?-1:a>b?1:0).map(([key,b])=>({key,numerator:fraction(BigInt(b.numerator),10n**BigInt(valuePlaces+weightPlaces)),weight_total:fraction(BigInt(b.denominator),10n**BigInt(weightPlaces))}));
 const weighted=plan.group_by?{numerator:fraction([...buckets.values()].reduce((n,b)=>n+BigInt(b.numerator),0n),10n**BigInt(valuePlaces+weightPlaces)),weight_total:fraction([...buckets.values()].reduce((n,b)=>n+BigInt(b.denominator),0n),10n**BigInt(weightPlaces)),groups:operands}:{numerator:operands[0]!.numerator,weight_total:operands[0]!.weight_total};
 const groups=[...buckets].sort(([a],[b])=>a<b?-1:a>b?1:0).map(([key,b])=>{if(!b.denominator)return {key,rows:b.rows,value:'null'};let n=BigInt(b.numerator),d=BigInt(b.denominator)*10n**BigInt(valuePlaces),a=n<0n?-n:n,c=d;while(c){const r=a%c;a=c;c=r;}n/=a;d/=a;return {key,rows:b.rows,value:d===1n?String(n):n+'/'+d};});
 return {version:'1.0',plan_sha256:taskHash(plan),inspection_sha256:taskHash(source),source_sha256:plan.source_sha256,value:plan.group_by?JSON.stringify(groups):groups[0]!.value,rows:records.length,unit:plan.unit,weighted,method:'checked_weighted_query',...(plan.group_by?{groups}:{})};
}
