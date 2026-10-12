import {compileOpenReconciliationIR,executeOpenReconciliationIR,openReconciliationProposal} from './open-analysis-reconciliation.ts';
import {compileOpenAllocationIR,executeOpenAllocationIR,openAllocationProposal} from './open-analysis-allocation.ts';
import {compileOpenContributionIR,executeOpenContributionIR,openContributionProposal} from './open-analysis-contribution.ts';
import {compileOpenShareIR,executeOpenShareIR,openShareProposal} from './open-analysis-share.ts';
import {compileOpenWeightedIR,executeOpenWeightedIR,openWeightedProposal} from './open-analysis-weighted.ts';
import {compileOpenMeasuredIR,executeOpenMeasuredIR,openMeasuredProposal} from './open-analysis-measure.ts';
import type {OpenMeasure} from './open-analysis-semantics.ts';
import {compileOpenJoinIR,executeOpenJoinIR,openJoinProposal} from './open-analysis-join.ts';
import {compileOpenDocumentIR,executeOpenDocumentIR,openDocumentProposal,type OpenDocumentReference} from './open-document-analysis.ts';
import {deriveOpenValueMappings,type OpenValueMappings,type OpenTransformPreview} from './open-analysis-transform.ts';
import {membershipRecord as closed,membershipUuid} from './member-analysis.ts';
import {taskHash} from './member-task.ts';
import type {MemberSourceInspection,MemberSourceSheet} from '../ports/member-source.ts';
import {compileOpenMembershipFramework,openMembershipProposal,materializeOpenMembershipFramework,membershipFrameworkFacts,type OpenMembershipFramework} from './open-membership.ts';
export type OpenAnalysisFilter=Readonly<{column:string;operator:'eq'|'ne'|'ge'|'le';value:string}>;
export type OpenAnalysisIR=Readonly<{version:'1.0'|'1.1'|'1.2'|'1.3'|'1.4'|'1.5'|'1.6'|'1.7'|'1.8'|'1.9'|'2.0'|'2.1'|'2.2'|'2.3';left_label?:string;right_label?:string;grain?:'one_row_per_key';cardinality?:'one_to_one';rounding?:Readonly<{decimals:number;method:'largest_remainder';tie_break:'object_key'}>;comparison_label?:string;current_label?:string;input_unit?:string;weight_column?:string;measure?:OpenMeasure;join?:Readonly<{kind:'refund_net';order_key:string;refund_order_key:string;refund_id:string}>;references?:readonly OpenDocumentReference[];base?:OpenAnalysisIR;value_mappings?:OpenValueMappings;preview?:OpenTransformPreview;derived_inspection_sha256?:string;context_sha256?:string;membership?:OpenMembershipFramework;numeric_mode?:'integer'|'decimal';combination?:'union_all';inputs?:readonly OpenAnalysisIR[];goal:string;source_id:string;sheet_id:string;operation:'sum'|'count'|'min'|'max'|'mean'|'membership_compare'|'source_quotes'|'weighted_mean'|'group_share'|'group_change'|'proportional_allocation'|'reconcile';column:string;unit:string;source_sha256:string;inspection_sha256:string;binding_sha256:string;group_by?:string|null;filters?:readonly OpenAnalysisFilter[]}>;
export type OpenAnalysisValue=Readonly<{version:'1.0';plan_sha256:string;inspection_sha256:string;source_sha256:string;value:string;unit:string;rows:number;reconciliation?:Readonly<{left:OpenAnalysisValue;right:OpenAnalysisValue;balanced:boolean;entries:readonly Readonly<{key:string;left:string|null;right:string|null;difference:string;left_rows:number;right_rows:number;state:'matched'|'difference'|'left_only'|'right_only'}>[]}>;allocation?:Readonly<{pool:OpenAnalysisValue;weights:OpenAnalysisValue;weight_total:string}>;comparison?:Readonly<{baseline:OpenAnalysisValue;current:OpenAnalysisValue;total_change:string;groups:readonly Readonly<{key:string;baseline:string;current:string;change:string;share:string}>[]}>;relation?:Readonly<{total:string;amounts:OpenAnalysisValue}>;weighted?:Readonly<{numerator:string;weight_total:string;groups?:readonly Readonly<{key:string;numerator:string;weight_total:string}>[]}>;method:'checked_integer_sum'|'checked_integer_query'|'checked_decimal_query'|'checked_union_query'|'checked_membership_query'|'checked_transform_query'|'checked_source_quotes'|'checked_join_query'|'checked_measured_query'|'checked_weighted_query'|'checked_share_query'|'checked_contribution_query'|'checked_allocation_query'|'checked_reconciliation_query';derivation?:Readonly<{transform_sha256:string;derived_inspection_sha256:string;rows:number}>;groups?:readonly Readonly<{key:string;value:string;rows:number}>[]}>;
function fail(code:string):never{throw Object.assign(new Error(code),{code,stack:code});}
const text=(x:unknown,max:number):x is string=>typeof x==='string'&&x.trim().length>0&&x.length<=max&&!x.includes('\0');
function sheet(input:{source_id:string;sheet_id:string},inspection:MemberSourceInspection):MemberSourceSheet{
 const source=inspection.sources.find(s=>s.source_id===input.source_id),found=source?.sheets.find(s=>s.sheet_id===input.sheet_id);if(!source||!found)fail('BINDING_NOT_FOUND');if(source.document?.status==='ocr_unconfirmed')fail('SOURCE_UNQUALIFIED');
 if(inspection.version!=='1.0'||inspection.sources.filter(s=>s.source_id===input.source_id).length!==1||source.sheets.filter(s=>s.sheet_id===input.sheet_id).length!==1||! /^[a-f0-9]{64}$/.test(source.sha256)||found.state!=='visible'||!found.rows.length)fail('SOURCE_UNQUALIFIED');return found;
}
/** First executable open method: arbitrary selected numeric field, no member template. */
export function compileOpenAnalysisIR(raw:unknown,inspection:MemberSourceInspection):OpenAnalysisIR{
 if(raw&&typeof raw==='object'&&Object.hasOwn(raw,'context_sha256')){const {context_sha256,...proposal}=raw as Record<string,unknown>;if(typeof context_sha256!=='string'||! /^[a-f0-9]{64}$/.test(context_sha256))fail('CONTEXT_CHANGED');return {...compilePlan(proposal,inspection),context_sha256};}return compilePlan(raw,inspection);
}
function compilePlan(raw:unknown,inspection:MemberSourceInspection):OpenAnalysisIR{
 if((raw as {version?:unknown})?.version==='2.3')return compileOpenReconciliationIR(raw,inspection);
 if((raw as {version?:unknown})?.version==='2.2')return compileOpenAllocationIR(raw,inspection);
 if((raw as {version?:unknown})?.version==='2.1')return compileOpenContributionIR(raw,inspection);
 if((raw as {version?:unknown})?.version==='2.0')return compileOpenShareIR(raw,inspection);
 if((raw as {version?:unknown})?.version==='1.9')return compileOpenWeightedIR(raw,inspection);
 if((raw as {version?:unknown})?.version==='1.8')return compileOpenMeasuredIR(raw,inspection);
 if((raw as {version?:unknown})?.version==='1.7')return compileOpenJoinIR(raw,inspection);
 if((raw as {version?:unknown})?.version==='1.6')return compileOpenDocumentIR(raw,inspection);
 if((raw as {version?:unknown})?.version==='1.5'){const p=closed(raw,['version','goal','source_id','sheet_id','operation','column','unit','numeric_mode','group_by','filters','value_mappings']);if(!membershipUuid(p.source_id)||typeof p.sheet_id!=='string'||!['integer','decimal'].includes(String(p.numeric_mode)))fail('PLAN_INVALID');const derived=deriveOpenValueMappings({source_id:p.source_id,sheet_id:p.sheet_id,value_mappings:p.value_mappings},inspection),{value_mappings,numeric_mode,...rest}=p;void value_mappings;const base=compileOpenAnalysisIR({...rest,version:numeric_mode==='decimal'?'1.2':'1.1',...(numeric_mode==='decimal'?{numeric_mode}:{})},derived.derived);return {...base,version:'1.5',numeric_mode:numeric_mode as 'integer'|'decimal',base,value_mappings:derived.mappings,preview:derived.preview,derived_inspection_sha256:derived.derived_inspection_sha256,inspection_sha256:taskHash(inspection),binding_sha256:taskHash({base,value_mappings:derived.mappings})};}

 if((raw as {version?:unknown})?.version==='1.4'){const p=closed(raw,['version','membership']),frame=compileOpenMembershipFramework(p.membership,inspection),orders=frame.bindings.find(b=>b.role==='orders')!;return {version:'1.4',membership:frame,goal:frame.goal,source_id:orders.source_id,sheet_id:orders.sheet_id,operation:'membership_compare',column:orders.columns.amount!,unit:'CNY',source_sha256:taskHash(frame.bindings.map(b=>({source_id:b.source_id,sha256:inspection.sources.find(s=>s.source_id===b.source_id)!.sha256}))),inspection_sha256:frame.inspection_sha256,binding_sha256:taskHash(frame.bindings)};}
 if((raw as {version?:unknown})?.version==='1.3')return compileUnion(raw,inspection);
 const decimal=(raw as {version?:unknown})?.version==='1.2',query=decimal||(raw as {version?:unknown})?.version==='1.1';
 const p=closed(raw,['version','goal','source_id','sheet_id','operation','column','unit',...(query?['group_by','filters']:[]),...(decimal?['numeric_mode']:[])]);
 if(!['sum',...(query?['count','min','max','mean']:[])].includes(String(p.operation)))fail('METHOD_UNAVAILABLE');
 if(!['1.0','1.1','1.2'].includes(String(p.version))||!membershipUuid(p.source_id)||!text(p.sheet_id,200)||!text(p.goal,2000)||!text(p.unit,200)||!text(p.column,200))fail('PLAN_INVALID');
 if(decimal&&p.numeric_mode!=='decimal')fail('PLAN_INVALID');
 const selected=sheet({source_id:p.source_id,sheet_id:p.sheet_id},inspection),headers=selected.rows[0]!.cells.filter(c=>c.column===p.column||c.type==='string'&&c.value===p.column);
 if(headers.length!==1)fail('BINDING_NOT_FOUND');
 const bind=(raw:unknown)=>{if(!text(raw,200))fail('PLAN_INVALID');const h=selected.rows[0]!.cells.filter(c=>c.column===raw||c.type==='string'&&c.value===raw);if(h.length!==1)fail('BINDING_NOT_FOUND');return h[0]!.column;};
 let extras:{}|{group_by:string|null;filters:OpenAnalysisFilter[]}={};
 if(query){if(p.group_by!==null&&!text(p.group_by,200)||!Array.isArray(p.filters)||p.filters.length>16)fail('PLAN_INVALID');extras={group_by:p.group_by===null?null:bind(p.group_by),filters:p.filters.map(f=>{const x=closed(f,['column','operator','value']);if(!['eq','ne','ge','le'].includes(String(x.operator))||typeof x.value!=='string'||x.value.length>1000||x.value.includes('\0')||['ge','le'].includes(String(x.operator))&&!(decimal?/^-?(0|[1-9]\d*)(\.\d+)?$/:/^-?(0|[1-9]\d*)$/).test(x.value))fail('PLAN_INVALID');return {column:bind(x.column),operator:x.operator as OpenAnalysisFilter['operator'],value:x.value};})};}
 const source=inspection.sources.find(s=>s.source_id===p.source_id)!;
 return {version:decimal?'1.2':query?'1.1':'1.0',...(decimal?{numeric_mode:'decimal' as const}:{}),goal:p.goal,source_id:p.source_id,sheet_id:p.sheet_id,operation:p.operation as OpenAnalysisIR['operation'],column:headers[0]!.column,unit:p.unit,source_sha256:source.sha256,inspection_sha256:taskHash(inspection),binding_sha256:taskHash({source_id:p.source_id,sheet_id:p.sheet_id,column:headers[0]!.column,header:headers[0],...(query?{...extras,headers:selected.rows[0]!.cells}:{} )}),...extras};
}
export function openAnalysisProposal(p:OpenAnalysisIR):Record<string,unknown>{const proposal=planProposal(p);return p.context_sha256?{...proposal,context_sha256:p.context_sha256}:proposal;}
function planProposal(p:OpenAnalysisIR):Record<string,unknown>{if(p.version==='2.3')return openReconciliationProposal(p);if(p.version==='2.2')return openAllocationProposal(p);if(p.version==='2.1')return openContributionProposal(p);if(p.version==='2.0')return openShareProposal(p);if(p.version==='1.9')return openWeightedProposal(p);if(p.version==='1.8')return openMeasuredProposal(p);if(p.version==='1.7')return openJoinProposal(p);if(p.version==='1.6')return openDocumentProposal(p);if(p.version==='1.5'){if(!p.base||!p.value_mappings)fail('PLAN_INVALID');return {...planProposal(p.base),version:'1.5',numeric_mode:p.numeric_mode,value_mappings:p.value_mappings};}if(p.version==='1.4'){if(!p.membership)fail('PLAN_INVALID');return {version:'1.4',membership:openMembershipProposal(p.membership)};}if(p.version==='1.3')return {version:'1.3',combination:p.combination,numeric_mode:p.numeric_mode,goal:p.goal,operation:p.operation,unit:p.unit,inputs:p.inputs?.map(i=>({source_id:i.source_id,sheet_id:i.sheet_id,column:i.column,group_by:i.group_by,filters:i.filters}))};return Object.fromEntries(['version','goal','source_id','sheet_id','operation','column','unit',...(p.version!=='1.0'?['group_by','filters']:[]),...(p.version==='1.2'?['numeric_mode']:[])].map(k=>[k,Reflect.get(p,k)]));}
/** Execution consumes the exact immutable IR and every bound row, never a preview. */
export function executeOpenAnalysisIR(raw:unknown,inspection:MemberSourceInspection):OpenAnalysisValue{
 if((raw as OpenAnalysisIR)?.version==='2.3')return executeOpenReconciliationIR(raw as OpenAnalysisIR,inspection);
 if((raw as OpenAnalysisIR)?.version==='2.2')return executeOpenAllocationIR(raw as OpenAnalysisIR,inspection);
 if((raw as OpenAnalysisIR)?.version==='2.1')return executeOpenContributionIR(raw as OpenAnalysisIR,inspection);
 if((raw as OpenAnalysisIR)?.version==='2.0')return executeOpenShareIR(raw as OpenAnalysisIR,inspection);
 if((raw as OpenAnalysisIR)?.version==='1.9')return executeOpenWeightedIR(raw as OpenAnalysisIR,inspection);
 if((raw as OpenAnalysisIR)?.version==='1.8')return executeOpenMeasuredIR(raw as OpenAnalysisIR,inspection);
 if((raw as OpenAnalysisIR)?.version==='1.7')return executeOpenJoinIR(raw as OpenAnalysisIR,inspection);
 if((raw as OpenAnalysisIR)?.version==='1.6')return executeOpenDocumentIR(raw as OpenAnalysisIR,inspection);
 if((raw as OpenAnalysisIR)?.version==='1.5'){const plan=raw as OpenAnalysisIR,bound=compileOpenAnalysisIR(openAnalysisProposal(plan),inspection);if(taskHash(bound)!==taskHash(plan))fail('SOURCE_CHANGED');const derived=deriveOpenValueMappings({source_id:plan.source_id,sheet_id:plan.sheet_id,value_mappings:plan.value_mappings},inspection),value=executeOpenAnalysisIR(plan.base!,derived.derived);return {...value,plan_sha256:taskHash(plan),inspection_sha256:taskHash(inspection),method:'checked_transform_query',derivation:{transform_sha256:taskHash(plan.value_mappings),derived_inspection_sha256:derived.derived_inspection_sha256,rows:derived.rows}};}

 if((raw as OpenAnalysisIR)?.version==='1.4'){const bound=compileOpenAnalysisIR(openAnalysisProposal(raw as OpenAnalysisIR),inspection);if(taskHash(bound)!==taskHash(raw))fail('SOURCE_CHANGED');const material=materializeOpenMembershipFramework(bound.membership!,inspection);return {version:'1.0',plan_sha256:taskHash(bound),inspection_sha256:bound.inspection_sha256,source_sha256:bound.source_sha256,value:JSON.stringify(membershipFrameworkFacts(bound.membership!,inspection)),unit:bound.unit,rows:Number(material.qualification.counts.included_order_count),method:'checked_membership_query'};}
 if((raw as OpenAnalysisIR)?.version==='1.3')return executeUnion(raw as OpenAnalysisIR,inspection);
 const decimal=(raw as OpenAnalysisIR)?.version==='1.2',query=decimal||(raw as OpenAnalysisIR)?.version==='1.1';const p=closed(raw,['version','goal','source_id','sheet_id','operation','column','unit','source_sha256','inspection_sha256','binding_sha256',...(query?['group_by','filters']:[]),...(decimal?['numeric_mode']:[]),...(Object.hasOwn(raw as object,'context_sha256')?['context_sha256']:[])]);
 const compiled=compileOpenAnalysisIR(openAnalysisProposal(raw as OpenAnalysisIR),inspection);
 if(taskHash(compiled)!==taskHash(raw))fail('SOURCE_CHANGED');
 if(decimal)return executeDecimalQuery(compiled,inspection);
 if(query)return executeQuery(compiled,inspection);
 const selected=sheet(compiled,inspection);let total=0,rows=0;const rowIds=new Set<number>();
 for(const row of selected.rows.slice(1)){
  if(!Number.isSafeInteger(row.row)||row.row<=selected.rows[0]!.row||rowIds.has(row.row))fail('SOURCE_UNQUALIFIED');rowIds.add(row.row);
  const cells=row.cells.filter(c=>c.column===compiled.column);if(cells.length!==1)fail('ROW_BINDING_INCOMPLETE');const cell=cells[0]!;
  if(!['number','string'].includes(cell.type)||! /^-?(0|[1-9]\d*)$/.test(cell.value)||!Number.isSafeInteger(Number(cell.value)))fail('NUMERIC_METHOD_UNAVAILABLE');
  total+=Number(cell.value);if(!Number.isSafeInteger(total))fail('NUMERIC_METHOD_UNAVAILABLE');rows++;
 }
 if(!rows)fail('NO_DATA');return {version:'1.0',plan_sha256:taskHash(compiled),inspection_sha256:compiled.inspection_sha256,source_sha256:compiled.source_sha256,value:String(total),unit:compiled.unit,rows,method:'checked_integer_sum'};
}

function executeQuery(plan:OpenAnalysisIR,inspection:MemberSourceInspection,selectedRows?:MemberSourceSheet):OpenAnalysisValue{
 const selected=selectedRows??sheet(plan,inspection),groups=new Map<string,{total:number;small:number;large:number;rows:number}>(),seen=new Set<number>();let rows=0;
 const columns=[...new Set([plan.column,...(plan.group_by?[plan.group_by]:[]),...(plan.filters??[]).map(f=>f.column)])];
 for(const row of selected.rows.slice(1)){
  if(!Number.isSafeInteger(row.row)||row.row<=selected.rows[0]!.row||seen.has(row.row))fail('SOURCE_UNQUALIFIED');seen.add(row.row);
  const cells=new Map(columns.map(column=>{const matches=row.cells.filter(c=>c.column===column);if(matches.length!==1)fail('ROW_BINDING_INCOMPLETE');if(!['string','number'].includes(matches[0]!.type))fail('SOURCE_UNQUALIFIED');return [column,matches[0]!.value];}));
  const number=(value:string)=>{if(! /^-?(0|[1-9]\d*)$/.test(value)||!Number.isSafeInteger(Number(value)))fail('NUMERIC_METHOD_UNAVAILABLE');return Number(value);};
  if(!(plan.filters??[]).map(f=>{const v=cells.get(f.column)!;return f.operator==='eq'?v===f.value:f.operator==='ne'?v!==f.value:f.operator==='ge'?number(v)>=number(f.value):number(v)<=number(f.value);}).every(Boolean))continue;
  const key=plan.group_by?cells.get(plan.group_by)!:'',g=groups.get(key)??{total:0,small:Infinity,large:-Infinity,rows:0},v=plan.operation==='count'?1:number(cells.get(plan.column)!);
  g.total+=v;if(!Number.isSafeInteger(g.total))fail('NUMERIC_METHOD_UNAVAILABLE');g.small=Math.min(g.small,v);g.large=Math.max(g.large,v);g.rows++;rows++;groups.set(key,g);
 }
 if(!rows)fail('NO_DATA');
 const results=[...groups].sort(([a],[b])=>a<b?-1:a>b?1:0).map(([key,g])=>({key,rows:g.rows,value:plan.operation==='min'?String(g.small):plan.operation==='max'?String(g.large):plan.operation==='mean'?fraction(g.total,g.rows):String(g.total)}));
 return {version:'1.0',plan_sha256:taskHash(plan),inspection_sha256:plan.inspection_sha256,source_sha256:plan.source_sha256,value:plan.group_by?JSON.stringify(results):results[0]!.value,unit:plan.unit,rows,method:'checked_integer_query',...(plan.group_by?{groups:results}:{})};
}
function fraction(n:number,d:number){let a=Math.abs(n),b=d;while(b){const next=a%b;a=b;b=next;}return d/a===1?String(n/a):String(n/a)+'/'+String(d/a);}

function decimalFraction(value:number,denominator:bigint){let n=BigInt(value),a=n<0n?-n:n,b=denominator;while(b){const r=a%b;a=b;b=r;}n/=a;denominator/=a;return denominator===1n?n.toString():n.toString()+'/'+denominator.toString();}
function executeDecimalQuery(plan:OpenAnalysisIR,inspection:MemberSourceInspection,selectedRows?:MemberSourceSheet):OpenAnalysisValue{
 const selected=selectedRows??sheet(plan,inspection),records:{cells:Map<string,string>}[]=[],seen=new Set<number>();let scale=0;
 const columns=[...new Set([plan.column,...(plan.group_by?[plan.group_by]:[]),...(plan.filters??[]).map(f=>f.column)])];
 const numeric=(s:string)=>{if(s.length>2000||! /^-?(0|[1-9]\d*)(\.\d+)?$/.test(s))fail('NUMERIC_METHOD_UNAVAILABLE');const digits=(s.split('.')[1]??'').length;if(digits>15)fail('NUMERIC_METHOD_UNAVAILABLE');scale=Math.max(scale,digits);};
 for(const f of plan.filters??[])if(f.operator==='ge'||f.operator==='le')numeric(f.value);
 for(const row of selected.rows.slice(1)){if(!Number.isSafeInteger(row.row)||row.row<=selected.rows[0]!.row||seen.has(row.row))fail('SOURCE_UNQUALIFIED');seen.add(row.row);const cells=new Map(columns.map(column=>{const xs=row.cells.filter(c=>c.column===column);if(xs.length!==1)fail('ROW_BINDING_INCOMPLETE');if(!['number','string'].includes(xs[0]!.type))fail('SOURCE_UNQUALIFIED');return [column,xs[0]!.value];}));if(plan.operation!=='count')numeric(cells.get(plan.column)!);for(const f of plan.filters??[])if(f.operator==='ge'||f.operator==='le')numeric(cells.get(f.column)!);records.push({cells});}
 const factor=10n**BigInt(scale),scaled=(s:string)=>{const [whole,part='']=s.split('.'),negative=whole!.startsWith('-'),digits=whole!.replace('-','')+part.padEnd(scale,'0'),value=Number((negative?'-':'')+digits);if(!Number.isSafeInteger(value))fail('NUMERIC_METHOD_UNAVAILABLE');return value;};
 const buckets=new Map<string,{total:number;small:number;large:number;rows:number}>();let rows=0;
 for(const {cells} of records){if(!(plan.filters??[]).every(f=>{const v=cells.get(f.column)!;return f.operator==='eq'?v===f.value:f.operator==='ne'?v!==f.value:f.operator==='ge'?scaled(v)>=scaled(f.value):scaled(v)<=scaled(f.value);}))continue;const key=plan.group_by?cells.get(plan.group_by)!:'',v=plan.operation==='count'?1:scaled(cells.get(plan.column)!),g=buckets.get(key)??{total:0,small:Infinity,large:-Infinity,rows:0};g.total+=v;if(!Number.isSafeInteger(g.total))fail('NUMERIC_METHOD_UNAVAILABLE');g.small=Math.min(g.small,v);g.large=Math.max(g.large,v);g.rows++;rows++;buckets.set(key,g);}
 if(!rows)fail('NO_DATA');const groups=[...buckets].sort(([a],[b])=>a<b?-1:a>b?1:0).map(([key,g])=>({key,rows:g.rows,value:plan.operation==='count'?String(g.rows):decimalFraction(plan.operation==='min'?g.small:plan.operation==='max'?g.large:g.total,plan.operation==='mean'?factor*BigInt(g.rows):factor)}));return {version:'1.0',plan_sha256:taskHash(plan),inspection_sha256:taskHash(inspection),source_sha256:plan.source_sha256,value:plan.group_by?JSON.stringify(groups):groups[0]!.value,rows,unit:plan.unit,method:'checked_decimal_query',...(plan.group_by?{groups}:{})};
}

function compileUnion(raw:unknown,inspection:MemberSourceInspection):OpenAnalysisIR{
 const p=closed(raw,['version','combination','numeric_mode','goal','operation','unit','inputs']);
 if(p.version!=='1.3'||p.combination!=='union_all'||!['integer','decimal'].includes(String(p.numeric_mode))||!Array.isArray(p.inputs)||p.inputs.length<2||p.inputs.length>32)fail('PLAN_INVALID');
 const seen=new Set<string>();const inputs=p.inputs.map(raw=>{const b=closed(raw,['source_id','sheet_id','column','group_by','filters']);const pair=String(b.source_id)+'/'+String(b.sheet_id);if(seen.has(pair))fail('PLAN_INVALID');seen.add(pair);return compileOpenAnalysisIR({...b,version:p.numeric_mode==='decimal'?'1.2':'1.1',...(p.numeric_mode==='decimal'?{numeric_mode:'decimal'}:{}),goal:p.goal,operation:p.operation,unit:p.unit},inspection);});
 const first=inputs[0]!;const shape=(i:OpenAnalysisIR)=>({grouped:!!i.group_by,filters:i.filters?.map(f=>({operator:f.operator,value:f.value}))});if(inputs.some(i=>taskHash(shape(i))!==taskHash(shape(first))))fail('PLAN_INVALID');
 return {...first,version:'1.3',numeric_mode:p.numeric_mode as 'integer'|'decimal',combination:'union_all',inputs,source_sha256:taskHash(inputs.map(i=>({source_id:i.source_id,sheet_id:i.sheet_id,source_sha256:i.source_sha256}))),binding_sha256:taskHash(inputs.map(i=>i.binding_sha256))};
}
function executeUnion(plan:OpenAnalysisIR,inspection:MemberSourceInspection):OpenAnalysisValue{
 const bound=compileOpenAnalysisIR(openAnalysisProposal(plan),inspection);if(taskHash(bound)!==taskHash(plan))fail('SOURCE_CHANGED');
 const rows:MemberSourceSheet['rows'][number][]=[{row:1,cells:[{column:'A',type:'string',value:'metric'},...(plan.group_by?[{column:'B',type:'string' as const,value:'group'}]:[]),...(plan.filters??[]).map((_,i)=>({column:'F'+i,type:'string' as const,value:'filter'+i}))]}];
 for(const input of plan.inputs!){const selected=sheet(input,inspection),seen=new Set<number>();for(const row of selected.rows.slice(1)){if(!Number.isSafeInteger(row.row)||row.row<=selected.rows[0]!.row||seen.has(row.row))fail('SOURCE_UNQUALIFIED');seen.add(row.row);const mappings=[['A',input.column],...(input.group_by?[['B',input.group_by]]:[]),...(input.filters??[]).map((f,i)=>['F'+i,f.column])];const cells=mappings.map(([target,origin])=>{const matches=row.cells.filter(c=>c.column===origin);if(matches.length!==1)fail('ROW_BINDING_INCOMPLETE');return {...matches[0]!,column:target!};});rows.push({row:rows.length+1,cells});}}
 const mapped={...plan,column:'A',group_by:plan.group_by?'B':null,filters:plan.filters?.map((f,i)=>({...f,column:'F'+i}))},selected={sheet_id:plan.sheet_id,name:'Explicit union_all',state:'visible' as const,rows};
 const value=plan.numeric_mode==='decimal'?executeDecimalQuery(mapped,inspection,selected):executeQuery(mapped,inspection,selected);return {...value,plan_sha256:taskHash(plan),method:'checked_union_query'};
}

export {compileOpenExplorationIR,validateOpenExplorationValue,type OpenExplorationIR,type OpenExplorationValue} from './open-analysis-exploration.ts';
