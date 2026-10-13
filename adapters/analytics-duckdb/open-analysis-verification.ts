import {verifyMetricAssetAnalysis} from './metric-assets-verification.ts';
import {verifyOpenReconciliationIR} from './open-analysis-reconciliation-verification.ts';
import {verifyOpenAllocationIR} from './open-analysis-allocation-verification.ts';
import {verifyOpenContributionIR} from './open-analysis-contribution-verification.ts';
import {verifyOpenShareIR} from './open-analysis-share-verification.ts';
import {verifyOpenWeightedIR} from './open-analysis-weighted-verification.ts';
import type {OpenMeasure} from '../../packages/product-core/open-analysis-semantics.ts';
import {verifyOpenDocumentIR} from '../../packages/product-core/open-document-analysis.ts';
import {compileOpenAnalysisIR,openAnalysisProposal} from '../../packages/product-core/open-analysis-ir.ts';
import type {OpenAnalysisIR,OpenAnalysisValue} from '../../packages/product-core/open-analysis-ir.ts';
import type {OpenAnalysisVerification} from '../../packages/ports/open-analysis-verifier.ts';
import type {MemberSourceInspection} from '../../packages/ports/member-source.ts';
import {taskHash} from '../../packages/product-core/member-task.ts';
function fail():never{throw Object.assign(new Error('VERIFICATION_FAILED'),{code:'VERIFICATION_FAILED',stack:'VERIFICATION_FAILED'});}
/** Independently recalculates from the reread inspection; never calls the main executor. */
export function verifyOpenAnalysisIntegerSum(plan:OpenAnalysisIR,result:OpenAnalysisValue,inspection:MemberSourceInspection):OpenAnalysisVerification{
 if(plan.version==='2.4')return verifyMetricAssetAnalysis(plan,result,inspection);
 if(plan.version==='2.3')return verifyOpenReconciliationIR(plan,result,inspection);
 if(plan.version==='2.2')return verifyOpenAllocationIR(plan,result,inspection);
 if(plan.version==='2.1')return verifyOpenContributionIR(plan,result,inspection);
 if(plan.version==='2.0')return verifyOpenShareIR(plan,result,inspection);
 if(plan.version==='1.9')return verifyOpenWeightedIR(plan,result,inspection);
 if(plan.version==='1.8')return verifyMeasured(plan,result,inspection);
 if(plan.version==='1.7')return verifyRefundNet(plan,result,inspection);
 if(plan.version==='1.6')return verifyOpenDocumentIR(plan,result,inspection);
 if(plan.version==='1.5')return verifyTransform(plan,result,inspection);
 if(plan.version==='1.3')return verifyUnion(plan,result,inspection);
 if(plan.version==='1.2')return verifyDecimalQuery(plan,result,inspection);
 if(plan.version==='1.1')return verifyQuery(plan,result,inspection);
 if(plan.version!=='1.0'||plan.operation!=='sum'||result.version!=='1.0'||result.method!=='checked_integer_sum'||taskHash(plan)!==result.plan_sha256||taskHash(inspection)!==plan.inspection_sha256||result.inspection_sha256!==plan.inspection_sha256||result.source_sha256!==plan.source_sha256||result.unit!==plan.unit)fail();
 const sources=inspection.sources.filter(s=>s.source_id===plan.source_id);if(sources.length!==1||sources[0]!.sha256!==plan.source_sha256)fail();const sheets=sources[0]!.sheets.filter(s=>s.sheet_id===plan.sheet_id);if(sheets.length!==1||sheets[0]!.state!=='visible')fail();
 const rows=sheets[0]!.rows,header=rows[0]?.cells.filter(c=>c.column===plan.column);if(header?.length!==1||taskHash({source_id:plan.source_id,sheet_id:plan.sheet_id,column:plan.column,header:header[0]})!==plan.binding_sha256)fail();
 let sum=0n,count=0;const seen=new Set<number>();
 // Separate integer arithmetic and reverse traversal catch unsafe accumulation,
 // wrong totals/coverage and tampering independently of the Number-based executor.
 for(let index=rows.length-1;index>=1;index--){const row=rows[index]!;if(!Number.isSafeInteger(row.row)||row.row<=rows[0]!.row||seen.has(row.row))fail();seen.add(row.row);const cells=row.cells.filter(c=>c.column===plan.column);if(cells.length!==1||!['number','string'].includes(cells[0]!.type)||! /^-?(0|[1-9]\d*)$/.test(cells[0]!.value))fail();sum+=BigInt(cells[0]!.value);count++;}
 if(!count||count!==result.rows||sum.toString()!==result.value)fail();
 return {version:'1.0',grade:'independent_arithmetic',method:'bigint_source_recheck',plan_sha256:taskHash(plan),inspection_sha256:taskHash(inspection),result_sha256:taskHash(result),value:sum.toString(),rows:count};
}

function verifyQuery(plan:OpenAnalysisIR,result:OpenAnalysisValue,inspection:MemberSourceInspection,unionRows?:import('../../packages/ports/member-source.ts').MemberSourceSheet):OpenAnalysisVerification{
 let bound;try{bound=unionRows?plan:compileOpenAnalysisIR(openAnalysisProposal(plan),inspection);}catch{fail();}
 if(taskHash(bound)!==taskHash(plan)||taskHash(plan)!==result.plan_sha256||result.method!=='checked_integer_query'||result.version!=='1.0'||result.unit!==plan.unit||result.inspection_sha256!==taskHash(inspection)||result.source_sha256!==plan.source_sha256)fail();
 const sheet=unionRows??inspection.sources.find(s=>s.source_id===plan.source_id)!.sheets.find(s=>s.sheet_id===plan.sheet_id)!,rows=sheet.rows;
 const buckets=new Map<string,bigint[]>(),seen=new Set<number>();let count=0;
 const integer=(v:string)=>{if(! /^-?(0|[1-9]\d*)$/.test(v))fail();const n=BigInt(v);if(n>BigInt(Number.MAX_SAFE_INTEGER)||n<BigInt(Number.MIN_SAFE_INTEGER))fail();return n;};
 for(let i=rows.length-1;i>=1;i--){const row=rows[i]!;if(!Number.isSafeInteger(row.row)||row.row<=rows[0]!.row||seen.has(row.row))fail();seen.add(row.row);
  const cell=(name:string)=>{const matches=row.cells.filter(c=>c.column===name);if(matches.length!==1||!['string','number'].includes(matches[0]!.type))fail();return matches[0]!.value;};
  const value=cell(plan.column),key=plan.group_by?cell(plan.group_by):'';let selected=true;
  for(const f of plan.filters??[]){const v=cell(f.column);if(f.operator==='eq'&&v!==f.value||f.operator==='ne'&&v===f.value||f.operator==='ge'&&integer(v)<integer(f.value)||f.operator==='le'&&integer(v)>integer(f.value))selected=false;}
  if(!selected)continue;const values=buckets.get(key)??[];values.push(plan.operation==='count'?1n:integer(value));buckets.set(key,values);count++;
 }
 if(!count||count!==result.rows)fail();
 const groups=[...buckets].sort(([a],[b])=>a<b?-1:a>b?1:0).map(([key,values])=>{
  let total=0n,small=values[0]!,large=values[0]!;for(const n of values){total+=n;if(n<small)small=n;if(n>large)large=n;}
  let value=total.toString();if(plan.operation==='min')value=small.toString();else if(plan.operation==='max')value=large.toString();else if(plan.operation==='mean'){let a=total<0n?-total:total,b=BigInt(values.length);while(b){const next=a%b;a=b;b=next;}const n=total/a,d=BigInt(values.length)/a;value=d===1n?n.toString():n.toString()+'/'+d.toString();}
  return {key,rows:values.length,value};
 });
 if(plan.group_by&&!Array.isArray(result.groups))fail();
 const value=plan.group_by?JSON.stringify(groups):groups[0]!.value;
 if(value!==result.value||(plan.group_by?taskHash(groups)!==taskHash(result.groups):Object.hasOwn(result,'groups')))fail();
 return {version:'1.0',grade:'independent_arithmetic',method:'bigint_source_recheck',plan_sha256:taskHash(plan),inspection_sha256:taskHash(inspection),result_sha256:taskHash(result),value,rows:count};
}

function verifyDecimalQuery(plan:OpenAnalysisIR,result:OpenAnalysisValue,inspection:MemberSourceInspection,unionRows?:import('../../packages/ports/member-source.ts').MemberSourceSheet):OpenAnalysisVerification{
 let bound;try{bound=unionRows?plan:compileOpenAnalysisIR(openAnalysisProposal(plan),inspection);}catch{fail();}if(taskHash(bound)!==taskHash(plan)||result.version!=='1.0'||result.method!=='checked_decimal_query'||result.plan_sha256!==taskHash(plan)||result.inspection_sha256!==taskHash(inspection)||result.source_sha256!==plan.source_sha256||result.unit!==plan.unit)fail();
 type Rational={n:bigint;d:bigint};const reduce=(n:bigint,d:bigint):Rational=>{let a=n<0n?-n:n,b=d;while(b){const r=a%b;a=b;b=r;}return {n:n/a,d:d/a};},parse=(s:string):Rational=>{if(s.length>2000||! /^-?(0|[1-9]\d*)(\.\d+)?$/.test(s))fail();const pieces=s.split('.'),fraction=pieces[1]??'';if(fraction.length>15)fail();const denominator=10n**BigInt(fraction.length),integer=BigInt(pieces[0]!);return reduce(integer*denominator+(s.startsWith('-')?-1n:1n)*BigInt(fraction||'0'),denominator);},compare=(a:Rational,b:Rational)=>a.n*b.d-b.n*a.d,add=(a:Rational,b:Rational)=>reduce(a.n*b.d+b.n*a.d,a.d*b.d),display=(a:Rational)=>a.d===1n?a.n.toString():a.n.toString()+'/'+a.d.toString();
 const sheet=unionRows??inspection.sources.find(s=>s.source_id===plan.source_id)!.sheets.find(s=>s.sheet_id===plan.sheet_id)!,buckets=new Map<string,Rational[]>(),seen=new Set<number>();let rows=0;
 for(let i=sheet.rows.length-1;i>=1;i--){const row=sheet.rows[i]!;if(!Number.isSafeInteger(row.row)||row.row<=sheet.rows[0]!.row||seen.has(row.row))fail();seen.add(row.row);const cell=(column:string)=>{const xs=row.cells.filter(c=>c.column===column);if(xs.length!==1||!['string','number'].includes(xs[0]!.type))fail();return xs[0]!.value;};const value=plan.operation==='count'?{n:1n,d:1n}:parse(cell(plan.column)),key=plan.group_by?cell(plan.group_by):'';let included=true;for(const f of plan.filters??[]){const s=cell(f.column);if(f.operator==='eq'&&s!==f.value||f.operator==='ne'&&s===f.value||f.operator==='ge'&&compare(parse(s),parse(f.value))<0n||f.operator==='le'&&compare(parse(s),parse(f.value))>0n)included=false;}if(!included)continue;const values=buckets.get(key)??[];values.push(value);buckets.set(key,values);rows++;}
 if(!rows||rows!==result.rows)fail();const groups=[...buckets].sort(([a],[b])=>a<b?-1:a>b?1:0).map(([key,values])=>{let total:Rational={n:0n,d:1n},small=values[0]!,large=values[0]!;for(const v of values){total=add(total,v);if(compare(v,small)<0n)small=v;if(compare(v,large)>0n)large=v;}const selected=plan.operation==='min'?small:plan.operation==='max'?large:plan.operation==='mean'?reduce(total.n,total.d*BigInt(values.length)):total;return {key,rows:values.length,value:display(selected)};});const value=plan.group_by?JSON.stringify(groups):groups[0]!.value;if(value!==result.value||(plan.group_by?taskHash(groups)!==taskHash(result.groups):Object.hasOwn(result,'groups')))fail();return {version:'1.0',grade:'independent_arithmetic',method:'bigint_source_recheck',plan_sha256:taskHash(plan),inspection_sha256:taskHash(inspection),result_sha256:taskHash(result),value,rows};
}

function verifyUnion(plan:OpenAnalysisIR,result:OpenAnalysisValue,inspection:MemberSourceInspection):OpenAnalysisVerification{
 let bound;try{bound=compileOpenAnalysisIR(openAnalysisProposal(plan),inspection);}catch{fail();}if(taskHash(bound)!==taskHash(plan)||result.method!=='checked_union_query'||result.plan_sha256!==taskHash(plan))fail();
 // Independently traverse each bound sheet in reverse. No main materializer or
 // calculator is called. Original row identities are checked before relabeling.
 const records:import('../../packages/ports/member-source.ts').MemberSourceSheet['rows'][number][]=[];
 for(let j=plan.inputs!.length-1;j>=0;j--){const input=plan.inputs![j]!,source=inspection.sources.find(s=>s.source_id===input.source_id),sheet=source?.sheets.find(s=>s.sheet_id===input.sheet_id);if(!sheet||source!.sha256!==input.source_sha256)fail();const seen=new Set<number>();for(let k=sheet.rows.length-1;k>=1;k--){const row=sheet.rows[k]!;if(!Number.isSafeInteger(row.row)||row.row<=sheet.rows[0]!.row||seen.has(row.row))fail();seen.add(row.row);const get=(origin:string,target:string)=>{const xs=row.cells.filter(c=>c.column===origin);if(xs.length!==1)fail();return {...xs[0]!,column:target};};const cells=[get(input.column,'A'),...(input.group_by?[get(input.group_by,'B')]:[]),...(input.filters??[]).map((f,i)=>get(f.column,'F'+i))];records.push({row:records.length+2,cells});}}
 const selected={sheet_id:plan.sheet_id,name:'Independent bound inputs',state:'visible' as const,rows:[{row:1,cells:[]},...records]},mapped={...plan,column:'A',group_by:plan.group_by?'B':null,filters:plan.filters?.map((f,i)=>({...f,column:'F'+i}))};
 const localResult={...result,plan_sha256:taskHash(mapped),method:plan.numeric_mode==='decimal'?'checked_decimal_query' as const:'checked_integer_query' as const};
 const proof=plan.numeric_mode==='decimal'?verifyDecimalQuery(mapped,localResult,inspection,selected):verifyQuery(mapped,localResult,inspection,selected);return {...proof,plan_sha256:taskHash(plan),result_sha256:taskHash(result)};
}

function verifyTransform(plan:OpenAnalysisIR,result:OpenAnalysisValue,inspection:MemberSourceInspection):OpenAnalysisVerification{
 let bound;try{bound=compileOpenAnalysisIR(openAnalysisProposal(plan),inspection);}catch{fail();}if(taskHash(bound)!==taskHash(plan)||result.method!=='checked_transform_query'||result.plan_sha256!==taskHash(plan)||result.inspection_sha256!==taskHash(inspection)||result.source_sha256!==plan.source_sha256||!plan.base||!plan.value_mappings)fail();
 const observed=structuredClone(inspection),sources=observed.sources.filter(s=>s.source_id===plan.source_id),sheets=sources[0]?.sheets.filter(s=>s.sheet_id===plan.sheet_id),selected=sheets?.[0];if(sources.length!==1||sheets?.length!==1||!selected)fail();const reverseRows=[...selected.rows].reverse();let rows=0;
 // Recheck each original cell with a separate reverse traversal and pair lookup;
 // do not call the main derivation or calculation.
 const replacements=new Map<number,Map<string,string>>();for(const row of reverseRows){if(row.row===selected.rows[0]!.row)continue;const fields=new Map<string,string>();for(let n=plan.value_mappings.length-1;n>=0;n--){const mapping=plan.value_mappings[n]!,cells=row.cells.filter(c=>c.column===mapping.column);if(cells.length!==1)fail();const pairs=mapping.pairs.filter(p=>p.from===cells[0]!.value);if(pairs.length!==1)fail();fields.set(mapping.column,pairs[0]!.to);}if(replacements.has(row.row))fail();replacements.set(row.row,fields);rows++;}
 const derived:MemberSourceInspection={...observed,sources:observed.sources.map(s=>s.source_id!==plan.source_id?s:{...s,sheets:s.sheets.map(sheet=>sheet.sheet_id!==plan.sheet_id?sheet:{...sheet,rows:sheet.rows.map(row=>{const fields=replacements.get(row.row);return fields?{...row,cells:row.cells.map(cell=>fields.has(cell.column)?{...cell,type:'string' as const,value:fields.get(cell.column)!}:cell)}:row;})})})};
 if(taskHash(derived)!==plan.derived_inspection_sha256||taskHash(result.derivation)!==taskHash({transform_sha256:taskHash(plan.value_mappings),derived_inspection_sha256:taskHash(derived),rows}))fail();const local={...result,plan_sha256:taskHash(plan.base),inspection_sha256:taskHash(derived),method:plan.base.version==='1.2'?'checked_decimal_query' as const:'checked_integer_query' as const};delete local.derivation;const proof=verifyOpenAnalysisIntegerSum(plan.base,local,derived);return {...proof,plan_sha256:taskHash(plan),inspection_sha256:taskHash(inspection),result_sha256:taskHash(result)};
}

/** Separate refund audit: aggregate selected original orders, then deduct each
 * unique original refund from its one identified order; no main join execution. */
function verifyRefundNet(plan:OpenAnalysisIR,result:OpenAnalysisValue,inspection:MemberSourceInspection,measure?:OpenMeasure):OpenAnalysisVerification{
 let bound;try{bound=compileOpenAnalysisIR(openAnalysisProposal(plan),inspection);}catch{fail();}if(taskHash(bound)!==taskHash(plan)||!plan.join||plan.inputs?.length!==2||result.version!=='1.0'||result.method!=='checked_join_query'||result.plan_sha256!==taskHash(plan)||result.inspection_sha256!==taskHash(inspection)||result.source_sha256!==plan.source_sha256||result.unit!==plan.unit)fail();
 type Rational={n:bigint;d:bigint};const normalize=(n:bigint,d:bigint):Rational=>{let a=n<0n?-n:n,b=d;while(b){const r=a%b;a=b;b=r;}return {n:n/a,d:d/a};},parse=(v:string):Rational=>{if(v.length>2000||!(plan.numeric_mode==='decimal'?/^-?(0|[1-9]\d*)(\.\d{1,15})?$/:/^-?(0|[1-9]\d*)$/).test(v))fail();const [whole,tail='']=v.split('.'),d=10n**BigInt(tail.length),n=BigInt(whole!)*d+(v.startsWith('-')?-1n:1n)*BigInt(tail||'0');if(plan.numeric_mode==='integer'&&(n>BigInt(Number.MAX_SAFE_INTEGER)||n<BigInt(Number.MIN_SAFE_INTEGER)))fail();return normalize(n,d);},plus=(a:Rational,b:Rational)=>normalize(a.n*b.d+b.n*a.d,a.d*b.d),cmp=(a:Rational,b:Rational)=>a.n*b.d-b.n*a.d;
 const sheets=plan.inputs.map(p=>{const matches=inspection.sources.filter(s=>s.source_id===p.source_id),source=matches[0],sheets=source?.sheets.filter(s=>s.sheet_id===p.sheet_id);if(matches.length!==1||source!.sha256!==p.source_sha256||sheets?.length!==1||sheets[0]!.state!=='visible')fail();return sheets[0]!;}),left=plan.inputs[0]!,right=plan.inputs[1]!;
 const read=(row:import('../../packages/ports/member-source.ts').MemberSourceSheet['rows'][number],column:string)=>{const values=row.cells.filter(c=>c.column===column);if(values.length!==1||!['string','number'].includes(values[0]!.type)||!values[0]!.value.trim()||values[0]!.value.includes('\0'))fail();return values[0]!.value;},orders=new Map<string,{included:boolean;group:string}>(),refundIds=new Set<string>(),buckets=new Map<string,{value:Rational;count:number}>();let count=0;
 for(let side=0;side<2;side++){const table=sheets[side]!,seen=new Set<number>();for(let index=table.rows.length-1;index>=1;index--){const row=table.rows[index]!;if(!Number.isSafeInteger(row.row)||row.row<=table.rows[0]!.row||seen.has(row.row))fail();seen.add(row.row);if(side===0){const id=read(row,plan.join.order_key);if(orders.has(id))fail();let included=true;for(const f of left.filters??[]){const value=read(row,f.column);if(f.operator==='eq'&&value!==f.value||f.operator==='ne'&&value===f.value||f.operator==='ge'&&cmp(parse(value),parse(f.value))<0n||f.operator==='le'&&cmp(parse(value),parse(f.value))>0n)included=false;}const group=left.group_by?read(row,left.group_by):'';orders.set(id,{included,group});const originalAmount=parse(read(row,left.column)),factor=BigInt(measure?.inputs.find(i=>i.source_id===left.source_id&&i.sheet_id===left.sheet_id&&i.column===left.column)?.scale??'1'),output=BigInt(measure?.output_scale??'1'),amount=normalize(originalAmount.n*factor,originalAmount.d*output);if(!included)continue;const bucket=buckets.get(group)??{value:{n:0n,d:1n},count:0};bucket.value=plus(bucket.value,amount);bucket.count++;buckets.set(group,bucket);count++;}else{const refundId=read(row,plan.join.refund_id),orderId=read(row,plan.join.refund_order_key);if(refundIds.has(refundId)||!orders.has(orderId))fail();refundIds.add(refundId);const originalAmount=parse(read(row,right.column)),factor=BigInt(measure?.inputs.find(i=>i.source_id===right.source_id&&i.sheet_id===right.sheet_id&&i.column===right.column)?.scale??'1'),output=BigInt(measure?.output_scale??'1'),amount=normalize(originalAmount.n*factor,originalAmount.d*output);if(amount.n<0n)fail();const target=orders.get(orderId)!;if(!target.included)continue;const bucket=buckets.get(target.group);if(!bucket)fail();bucket.value=plus(bucket.value,{n:-amount.n,d:amount.d});}}}
 if(!count||result.rows!==count)fail();const display=(r:Rational)=>r.d===1n?r.n.toString():r.n+'/'+r.d,groups=[...buckets].sort(([a],[b])=>a<b?-1:a>b?1:0).map(([key,b])=>({key,value:display(b.value),rows:b.count})),value=left.group_by?JSON.stringify(groups):groups[0]!.value;if(value!==result.value||(left.group_by?taskHash(groups)!==taskHash(result.groups):Object.hasOwn(result,'groups')))fail();return {version:'1.0',grade:'independent_arithmetic',method:'bigint_source_recheck',plan_sha256:taskHash(plan),inspection_sha256:taskHash(inspection),result_sha256:taskHash(result),value,rows:count};
}

/** Independent source proof plus exact inverse unit relation. Never calls primary conversion/execution. */
function verifyMeasured(plan:OpenAnalysisIR,result:OpenAnalysisValue,inspection:MemberSourceInspection):OpenAnalysisVerification{
 let bound;try{bound=compileOpenAnalysisIR(openAnalysisProposal(plan),inspection);}catch{fail();}if(taskHash(bound)!==taskHash(plan)||!plan.base||!plan.measure||result.method!=='checked_measured_query'||result.plan_sha256!==taskHash(plan)||result.inspection_sha256!==taskHash(inspection)||result.source_sha256!==plan.source_sha256||result.unit!==plan.unit)fail();
 if(result.groups){let encoded:unknown;try{encoded=JSON.parse(result.value);}catch{fail();}if(taskHash(encoded)!==taskHash(result.groups))fail();}
 const base=plan.base,m=plan.measure,method=base.version==='2.3'?'checked_reconciliation_query':base.version==='2.1'?'checked_contribution_query':base.version==='1.9'?'checked_weighted_query':base.version==='1.7'?'checked_join_query':base.version==='1.5'?'checked_transform_query':base.version==='1.3'?'checked_union_query':base.version==='1.2'?'checked_decimal_query':base.version==='1.1'?'checked_integer_query':'checked_integer_sum';let original:OpenAnalysisValue={...result,plan_sha256:taskHash(base),unit:base.unit,method};
 let proof:OpenAnalysisVerification;if(base.version==='1.7')proof=verifyRefundNet(base,original,inspection,m);else{
 const inverse=(v:string)=>{if(v==='null'&&base.version==='1.9')return 'null';if(!/^-?\d+(\/\d+)?$/.test(v))fail();const [a,b='1']=v.split('/');let n=BigInt(a!)*BigInt(m.output_scale),d=BigInt(b)*BigInt(m.inputs[0]!.scale);if(d<=0n)fail();let x=n<0n?-n:n,y=d;while(y){const r=x%y;x=y;y=r;}n/=x;d/=x;return d===1n?n.toString():n+'/'+d;};const groups=result.groups?.map(g=>({...g,value:inverse(g.value)}));original={...original,value:groups?JSON.stringify(groups):inverse(result.value),...(groups?{groups}:{})};proof=verifyOpenAnalysisIntegerSum(base,original,inspection);
 }
 return {...proof,plan_sha256:taskHash(plan),result_sha256:taskHash(result),value:result.value};
}
