import {compileOpenAnalysisIR,openAnalysisProposal,type OpenAnalysisIR,type OpenAnalysisValue} from '../../packages/product-core/open-analysis-ir.ts';
import {taskHash} from '../../packages/product-core/member-task.ts';
import type {MemberSourceInspection} from '../../packages/ports/member-source.ts';
import type {OpenAnalysisVerification} from '../../packages/ports/open-analysis-verifier.ts';
function fail():never{throw Object.assign(new Error('VERIFICATION_FAILED'),{code:'VERIFICATION_FAILED',stack:'VERIFICATION_FAILED'});}
/** Separate rational arithmetic over original rows, in reverse. Never executes primary code. */
export function verifyOpenWeightedIR(plan:OpenAnalysisIR,result:OpenAnalysisValue,source:MemberSourceInspection):OpenAnalysisVerification{
 let bound;try{bound=compileOpenAnalysisIR(openAnalysisProposal(plan),source);}catch{fail();}
 if(taskHash(bound)!==taskHash(plan)||result.version!=='1.0'||result.method!=='checked_weighted_query'||result.plan_sha256!==taskHash(plan)||result.inspection_sha256!==taskHash(source)||result.source_sha256!==plan.source_sha256||result.unit!==plan.unit)fail();
 type Q={n:bigint;d:bigint};const reduce=(n:bigint,d:bigint):Q=>{let a=n<0n?-n:n,b=d;while(b){const next=a%b;a=b;b=next;}return {n:n/a,d:d/a};};
 const parse=(v:string):Q=>{if(v.length>2000||! /^-?(0|[1-9]\d*)(\.\d+)?$/.test(v))fail();const [integer,fraction='']=v.split('.');if(fraction.length>15)fail();const d=10n**BigInt(fraction.length);return reduce(BigInt(integer!)*d+(v.startsWith('-')?-1n:1n)*BigInt(fraction||'0'),d);};
 const add=(a:Q,b:Q)=>reduce(a.n*b.d+b.n*a.d,a.d*b.d),multiply=(a:Q,b:Q)=>reduce(a.n*b.n,a.d*b.d),compare=(a:Q,b:Q)=>a.n*b.d-b.n*a.d;
 const sheet=source.sources.find(s=>s.source_id===plan.source_id)!.sheets.find(s=>s.sheet_id===plan.sheet_id)!,buckets=new Map<string,{numerator:Q;denominator:Q;rows:number}>(),seen=new Set<number>();let rows=0;
 for(let i=sheet.rows.length-1;i>=1;i--){const row=sheet.rows[i]!;if(!Number.isSafeInteger(row.row)||row.row<=sheet.rows[0]!.row||seen.has(row.row))fail();seen.add(row.row);
 const cell=(column:string)=>{const xs=row.cells.filter(c=>c.column===column);if(xs.length!==1||!['number','string'].includes(xs[0]!.type))fail();return xs[0]!.value;};let included=true;
 for(const f of plan.filters??[]){const v=cell(f.column);if(f.operator==='eq'&&v!==f.value||f.operator==='ne'&&v===f.value||f.operator==='ge'&&compare(parse(v),parse(f.value))<0n||f.operator==='le'&&compare(parse(v),parse(f.value))>0n)included=false;}
 if(!included)continue;const v=parse(cell(plan.column)),w=parse(cell(plan.weight_column!));if(w.n<0n)fail();const key=plan.group_by?cell(plan.group_by):'',b=buckets.get(key)??{numerator:{n:0n,d:1n},denominator:{n:0n,d:1n},rows:0};b.numerator=add(b.numerator,multiply(v,w));b.denominator=add(b.denominator,w);b.rows++;rows++;buckets.set(key,b);}
 if(!rows||rows!==result.rows)fail();
 const display=(q:Q)=>q.d===1n?String(q.n):q.n+'/'+q.d;
 const operands=[...buckets].sort(([a],[b])=>a<b?-1:a>b?1:0).map(([key,b])=>({key,numerator:display(b.numerator),weight_total:display(b.denominator)}));
 const total=[...buckets.values()].reduce((x,b)=>({numerator:add(x.numerator,b.numerator),denominator:add(x.denominator,b.denominator)}),{numerator:{n:0n,d:1n},denominator:{n:0n,d:1n}});
 const weighted=plan.group_by?{numerator:display(total.numerator),weight_total:display(total.denominator),groups:operands}:{numerator:operands[0]!.numerator,weight_total:operands[0]!.weight_total};
 if(taskHash(weighted)!==taskHash(result.weighted))fail();
 const groups=[...buckets].sort(([a],[b])=>a<b?-1:a>b?1:0).map(([key,b])=>{if(b.denominator.n===0n)return {key,rows:b.rows,value:'null'};const q=reduce(b.numerator.n*b.denominator.d,b.numerator.d*b.denominator.n);return {key,rows:b.rows,value:q.d===1n?String(q.n):q.n+'/'+q.d};});
 const value=plan.group_by?JSON.stringify(groups):groups[0]!.value;
 if(value!==result.value||(plan.group_by?taskHash(groups)!==taskHash(result.groups):Object.hasOwn(result,'groups')))fail();
 return {version:'1.0',grade:'independent_arithmetic',method:'bigint_source_recheck',plan_sha256:taskHash(plan),inspection_sha256:taskHash(source),result_sha256:taskHash(result),value,rows};
}
