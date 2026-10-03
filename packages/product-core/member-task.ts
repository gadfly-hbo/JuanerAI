import {createHash} from 'node:crypto';
import {membershipRecord as closed,membershipHash,membershipUuid,validateMembershipPlan,type MembershipScenario,type MembershipPlan,type MembershipResult} from './member-analysis.ts';
import {desktopRuleFailure as fail,canonicalDesktopJson,type DesktopSelection} from './xanthil-desktop-decision-case.ts';
import type {OwnerRef,DesktopProjection} from '../contracts/xanthil-desktop-ipc.ts';
import type {MembershipReview,ReviewReceipt} from './member-review.ts';
export {closed,fail};
export type TaskResourceProfile={version:'1.0';provider:string;model:string;activation:'closed'|'synthetic_only';max_input_bytes:number;max_output_bytes:number;call_output_tokens:number;total_output_tokens:number;model_calls:number;call_ms:number;total_active_ms:number;wait_ms:number;total_wait_ms:number;local_runs:number;run_ms:number;process_seconds:number;grant_ms:number;cost:'unknown'};
const resourceKeys=['version','provider','model','activation','max_input_bytes','max_output_bytes','call_output_tokens','total_output_tokens','model_calls','call_ms','total_active_ms','wait_ms','total_wait_ms','local_runs','run_ms','process_seconds','grant_ms','cost'];
export function resourceProfile(input:unknown):TaskResourceProfile{
 const p=closed(input,resourceKeys);if(p.version!=='1.0'||p.cost!=='unknown'||!['closed','synthetic_only'].includes(String(p.activation))||typeof p.provider!=='string'||!p.provider||typeof p.model!=='string'||!p.model)fail();
 for(const k of resourceKeys.filter(k=>!['version','provider','model','activation','cost'].includes(k)))if(!Number.isSafeInteger(p[k])||Number(p[k])<=0)fail();
 if(Number(p.process_seconds)>30||Number(p.run_ms)>300000||Number(p.call_output_tokens)>Number(p.total_output_tokens)||Number(p.call_ms)>Number(p.total_active_ms)||Number(p.wait_ms)>Number(p.total_wait_ms))fail();
 if(p.activation==='synthetic_only'&&(p.provider!=='synthetic'||p.model!=='offline'))fail('AUTHORITY_REQUIRED');return structuredClone(input) as TaskResourceProfile;
}
export type CommentResolution={kind:'comment';intent:'expression'|'periods'|'question'|'unsupported';text:string;periods:{comparison_period:DesktopSelection['comparison_period'];current_period:DesktopSelection['current_period']}|null};
export function commentResolution(input:unknown):CommentResolution{const c=closed(input,['kind','intent','text','periods']);if(c.kind!=='comment'||!['expression','periods','question','unsupported'].includes(String(c.intent))||typeof c.text!=='string'||!c.text.trim())fail('OUTBOUND_FORBIDDEN');if(c.intent==='periods'){const p=closed(c.periods,['comparison_period','current_period']);for(const value of Object.values(p)){const period=closed(value,['start_date','end_date']);for(const d of Object.values(period))if(typeof d!=='string'||! /^\d{4}-\d{2}-\d{2}$/.test(d))fail('OUTBOUND_FORBIDDEN');}}else if(c.periods!==null)fail('OUTBOUND_FORBIDDEN');return structuredClone(input) as CommentResolution;}
export type MemberOutput={kind:'tool';tool:'execute_plan'|'read_result'}|{kind:'question'|'report';text:string}|CommentResolution;
export function memberOutput(input:unknown):MemberOutput{const kind=(input as {kind?:unknown})?.kind;if(kind==='comment')return commentResolution(input);const p=closed(input,kind==='tool'?['kind','tool']:['kind','text']);if(kind==='tool'){if(!['execute_plan','read_result'].includes(String(p.tool)))fail('OUTBOUND_FORBIDDEN');}else if(!['question','report'].includes(String(kind))||typeof p.text!=='string'||!p.text.trim())fail();return structuredClone(input) as MemberOutput;}
export type Outbound={version:'1.0';source_sha256:string;methods:readonly ('M1'|'M2')[];semantics:{metric:'membership_repurchase_comparison';currency:'CNY';time_zone:'Asia/Shanghai';comparison_period:DesktopSelection['comparison_period'];current_period:DesktopSelection['current_period'];status_meanings:'explicitly_confirmed_local'};preparation:{members:string;orders:string};selected_text:string|null;result:Pick<MembershipResult,'periods'|'changes'>|null;tool_result:'prepared'|'verified'|null};
// Treat path syntax as material, regardless of the local root name. This checks
// text only; it never resolves, reads or scans any filesystem path.
function containsPath(text:string){
 let value=text.normalize('NFKC');
 // Decode only this inspection copy. Each successful pass shortens escapes;
 // invalid UTF-8 must not conceal an adjacent encoded ASCII path separator.
 for(;;){const decoded=value.replace(/(?:%[a-f0-9]{2})+/gi,encoded=>{try{return decodeURIComponent(encoded);}catch{return encoded.replace(/%([2-7][a-f0-9])/gi,(_m,hex)=>String.fromCharCode(parseInt(hex,16)));}}).normalize('NFKC');if(decoded===value)break;value=decoded;}
 if(/[a-z]:[\\/]|\\\\[^\\\s]+[\\/]|file\s*:/i.test(value))return true;
 // Recognize complete annotated operands before splitting at spaces/parens.
 // Only a pair of annotated operands coalesces separator spacing; its slash
 // and all surrounding roots/segments remain for the path inspection below.
 const annotated=String.raw`(\p{Script=Han}+)\s*\(\s*(\p{Script=Han}+)\s*\)`;
 value=value.replace(new RegExp(`${annotated}(?:\\s*/\\s*${annotated})?`,'gu'),(_match,label,unit,rightLabel,rightUnit)=>label+unit+(rightLabel?'/'+rightLabel+rightUnit:''))
  .replace(/(\d)\s+(?=%|\p{Script=Han})/gu,'$1');
 // Inspect maximal slash-connected expressions, including whitespace. Never
 // exempt a numeric prefix of a path (1 /2026/private), or depend on extensions.
 const expressions=value.match(/[^\s/\\"'`<>()[\]{},;:=!?，。；：！？“”‘’…]*(?:\s*[/\\]\s*[^\s/\\"'`<>()[\]{},;:=!?，。；：！？“”‘’…]*)+/gu)??[];
 return expressions.some(raw=>{
  const expression=raw.trim().replace(/\.+$/u,''); // sentence-ending full stops
  if(expression.includes('\\')||expression.startsWith('/')||expression.endsWith('/'))return true;
  // Existing Chinese business-label division, with no path sigils/extra segment.
  if(/^\p{Script=Han}+(?:\/|\s+\/\s+)\p{Script=Han}+$/u.test(expression))return false;
  // Quantities may carry Chinese units. Prose between two complete ratios/dates
  // separates them; units before a slash remain part of their operand.
  const parts=expression.split(/(?<=\d)\p{Script=Han}+(?=[+-]?\d)/u);
  return parts.some(part=>! /^\p{Script=Han}*[+-]?\d+(?:\.\d+)?%?\p{Script=Han}*(?:\s*\/\s*[+-]?\d+(?:\.\d+)?%?\p{Script=Han}*)+$/u.test(part));
 });
}
export function outbound(input:unknown):Outbound{
 const p=closed(input,['version','source_sha256','methods','semantics','preparation','selected_text','result','tool_result']);const s=closed(p.semantics,['metric','currency','time_zone','comparison_period','current_period','status_meanings']);
 if(p.version!=='1.0'||typeof p.source_sha256!=='string'||! /^[a-f0-9]{64}$/.test(p.source_sha256)||!['["M1"]','["M1","M2"]'].includes(JSON.stringify(p.methods))||s.metric!=='membership_repurchase_comparison'||s.currency!=='CNY'||s.time_zone!=='Asia/Shanghai'||s.status_meanings!=='explicitly_confirmed_local'||!['prepared','verified',null].includes(p.tool_result as null))fail('OUTBOUND_FORBIDDEN');
 for(const role of ['comparison_period','current_period']){const period=closed(s[role],['start_date','end_date']);for(const v of Object.values(period))if(typeof v!=='string'||! /^\d{4}-\d{2}-\d{2}$/.test(v))fail('OUTBOUND_FORBIDDEN');}
 const prep=closed(p.preparation,['members','orders']);for(const v of Object.values(prep))if(typeof v!=='string'||! /^(0|[1-9]\d*)$/.test(v))fail('OUTBOUND_FORBIDDEN');
 if(p.selected_text!==null&&(typeof p.selected_text!=='string'||containsPath(p.selected_text)||/(?:\/Users\/|\/home\/|\/private\/|file:\/\/|https?:\/\/|Bearer\s|sk-[\w-]+|\b(?:SELECT|INSERT|DELETE)\s|[,\t].*[,\t])/i.test(p.selected_text)))fail('OUTBOUND_FORBIDDEN');
 if(p.result!==null){const r=closed(p.result,['periods','changes']);const periods=closed(r.periods,['comparison','current']);for(const v of Object.values(periods)){const metric=closed(v,['active_member_count','repeat_member_count','repurchase_rate','repeat_revenue_fen']);for(const key of ['active_member_count','repeat_member_count','repeat_revenue_fen'])if(typeof metric[key]!=='string'||! /^\d+$/.test(metric[key] as string))fail('OUTBOUND_FORBIDDEN');ratio(metric.repurchase_rate);}
 const changes=closed(r.changes,['active_member_count','repeat_member_count','repurchase_rate','repeat_revenue_fen']);for(const [k,v]of Object.entries(changes)){const change=closed(v,['absolute_delta','relative_change']);if(k==='repurchase_rate')ratio(change.absolute_delta);else if(typeof change.absolute_delta!=='string'||! /^-?\d+$/.test(change.absolute_delta))fail('OUTBOUND_FORBIDDEN');ratio(change.relative_change);}}
 return structuredClone(input) as Outbound;
}
function ratio(input:unknown){if(input==='not_applicable')return;const p=closed(input,['numerator','denominator']);if(typeof p.numerator!=='string'||! /^-?\d+$/.test(p.numerator)||typeof p.denominator!=='string'||! /^[1-9]\d*$/.test(p.denominator))fail('OUTBOUND_FORBIDDEN');}
export type PreparedTask={version:'1.0';owner:OwnerRef;scenario:MembershipScenario;selection:DesktopSelection;methods:readonly ('M1'|'M2')[];sources:{members:{sha256:string;byte_length:string;display_name:string};orders:{sha256:string;byte_length:string;display_name:string}};counts:{members:string;orders:string};issue_treatments:readonly {code:string;count:string;treatment:string}[];fingerprint:string};
export type RetainedGrant={session_id:string;authorization_id:string;authorization_sha256:string;source_sha256:string;purpose:'assistant'|'fork'|'subagent'};
export type TaskGrant={retained?:RetainedGrant;version:'1.0';id:string;task_id:string;epoch:number;prepared:PreparedTask;profile:TaskResourceProfile;selected_text:string|null;created_at:string;expires_at:string;revoked_at:string|null};
export type TaskAttempt={version:'1.0';id:string;grant_id:string;epoch:number;status:'running'|'waiting'|'succeeded'|'failed'|'stopped'|'interrupted';phase:'planning'|'calculating'|'explaining';started_at:string;ended_at:string|null;error:string|null;comment_id?:string};
export type TaskUsage={version:'1.0';id:string;attempt_id:string;kind:'model'|'analysis'|'waiting';status:'reserved'|'issued'|'settled'|'unresolved';source_sha256:string;payload_sha256:string|null;calls:number;output_tokens:number;active_ms:number;wait_ms:number;local_runs:number;at:string};
export type TaskEvent={version:'1.0';id:string;attempt_id:string;source_sha256:string;kind:'outbound'|'question'|'explanation'|'status'|'consented_text'|'local_text';text:string;at:string};
export type TaskComment={version:'1.0';id:string;task_id:string;report_id:string;report_version:string;report_sha256:string;scope:'whole'|'expression';author:string;text:string;text_consent:boolean;created_at:string;result_report_id:string|null;resolution?:CommentResolution};
export type CommentInput=Pick<TaskComment,'id'|'report_id'|'report_version'|'report_sha256'|'scope'|'author'|'text'|'text_consent'>;
export function commentInput(input:unknown):CommentInput{const c=closed(input,['id','report_id','report_version','report_sha256','scope','author','text','text_consent']);if(!membershipUuid(c.id)||!membershipUuid(c.report_id)||typeof c.report_version!=='string'||! /^[1-9]\d*$/.test(c.report_version)||typeof c.report_sha256!=='string'||! /^[a-f0-9]{64}$/.test(c.report_sha256)||!['whole','expression'].includes(String(c.scope))||typeof c.author!=='string'||!c.author.trim()||typeof c.text!=='string'||!c.text.trim()||typeof c.text_consent!=='boolean')fail();return structuredClone(input) as CommentInput;}
export function validateComment(input:TaskComment){closed(input,['version','id','task_id','report_id','report_version','report_sha256','scope','author','text','text_consent','created_at','result_report_id',...(input.resolution?['resolution']:[])]);const {version,task_id,created_at,result_report_id,resolution,...body}=input;commentInput(body);if(resolution)commentResolution(resolution);if(version!=='1.0'||!membershipUuid(task_id)||!Number.isFinite(Date.parse(created_at))||result_report_id!==null&&!membershipUuid(result_report_id))fail();return input;}
export type TaskState={task_id:string;owner:OwnerRef;row_version:number;epoch:number;status:'idle'|'running'|'waiting'|'stopped'|'interrupted'|'closed';prepared:PreparedTask|null;grants:TaskGrant[];attempts:TaskAttempt[];usage:TaskUsage[];events:TaskEvent[];comments:TaskComment[];reviews:MembershipReview[];review_receipts:ReviewReceipt[]};
export type ReusableConfiguration=Pick<PreparedTask,'scenario'|'selection'|'methods'>&{sha256:string};
export type TaskProjection=TaskState&{history:DesktopProjection[];configurations:ReusableConfiguration[];question:string;profile:TaskResourceProfile|null;missing:string[];active_physical:boolean;case:DesktopProjection;totals:ReturnType<typeof totals>};
export const totals=(usage:readonly TaskUsage[])=>usage.reduce((a,u)=>({calls:a.calls+u.calls,output_tokens:a.output_tokens+u.output_tokens,active_ms:a.active_ms+u.active_ms,wait_ms:a.wait_ms+u.wait_ms,local_runs:a.local_runs+u.local_runs,unresolved:a.unresolved+(u.status==='unresolved'||u.status==='issued'?1:0)}),{calls:0,output_tokens:0,active_ms:0,wait_ms:0,local_runs:0,unresolved:0});
export function reserveWithin(profile:TaskResourceProfile,usage:readonly TaskUsage[],next:TaskUsage){const sum=totals([...usage,next]);if(sum.calls>profile.model_calls||sum.output_tokens>profile.total_output_tokens||sum.active_ms>profile.total_active_ms||sum.wait_ms>profile.total_wait_ms||sum.local_runs>profile.local_runs)fail('BUDGET_EXHAUSTED');}
export function preparedIdentity(p:Omit<PreparedTask,'fingerprint'>){return membershipHash(p);}
export function validatePrepared(input:PreparedTask){closed(input,['version','owner','scenario','selection','methods','sources','counts','issue_treatments','fingerprint']);const {fingerprint,...body}=input;if(input.version!=='1.0'||preparedIdentity(body)!==fingerprint)fail('SOURCE_CHANGED');
 // Reuse the exact plan/config/selection validators without manufacturing persisted identity.
 validateMembershipPlan({version:'1.0',id:input.scenario.id,owner:input.owner,confirmation_id:input.scenario.id,snapshot_id:input.scenario.id,scenario:input.scenario,scenario_sha256:membershipHash(input.scenario),contract_sha256:membershipHash(input.selection),binding_sha256:membershipHash(input.selection.column_mapping),sources:Object.fromEntries(Object.entries(input.sources).map(([k,v])=>[k,{sha256:v.sha256,byte_length:v.byte_length}])),methods:input.methods,parameters:input.selection,verification:'python_independent_exact'});return input;}
export function protectText(text:string,protectedValues:readonly string[]){if(protectedValues.some(v=>v&&text.includes(v)))fail('OUTBOUND_FORBIDDEN');return text;}
export function encodeTask(value:unknown):string{
 const normalize=(v:unknown):unknown=>{if(Array.isArray(v))return v.map(normalize);if(v!==null&&typeof v==='object'){if(Object.getPrototypeOf(v)!==Object.prototype)fail();return Object.fromEntries(Object.keys(v).sort((a,b)=>{const x=Array.from(a,c=>c.codePointAt(0)!),y=Array.from(b,c=>c.codePointAt(0)!);for(let i=0;i<Math.min(x.length,y.length);i++)if(x[i]!==y[i])return x[i]-y[i];return x.length-y.length;}).map(k=>[k,normalize((v as Record<string,unknown>)[k])]));}if(typeof v==='number'&&!Number.isSafeInteger(v)||typeof v==='bigint'||v===undefined||typeof v==='function')fail();return v;};return JSON.stringify(normalize(value));
}
export const taskHash=(value:unknown)=>createHash('sha256').update(encodeTask(value)).digest('hex');

export function expressionReport(original:string,expression:string){
 if(/<!--|-->/.test(expression))fail('OUTBOUND_FORBIDDEN');
 const start='<!-- P1_FACTS_START -->\n',end='\n<!-- P1_FACTS_END -->';
 const at=original.indexOf(start),last=original.indexOf(end,at+start.length);
 const facts=at>=0&&last>=0?original.slice(at+start.length,last):original;
 const markdown='# 会员复购分析 · 待审报告\n\n## 当前分析表述（MODEL，待人审阅）\n\n<!-- P1_EXPRESSION_START -->\n'+expression+'\n<!-- P1_EXPRESSION_END -->\n\n<details>\n<summary>已验证事实与证据（原文）</summary>\n\n'+start+facts+end+'\n</details>\n';
 const escape=(s:string)=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
 return {markdown,html:'<!doctype html><html lang="zh-CN"><meta charset="utf-8"><title>会员分析待审报告</title><body><h1>会员复购分析 · 待审报告</h1><h2>当前分析表述（MODEL，待人审阅）</h2><pre>'+escape(expression)+'</pre><details><summary>已验证事实与证据（原文）</summary><pre>'+escape(facts)+'</pre></details></body></html>'};
}

export type TaskPeriods=Pick<DesktopSelection,'comparison_period'|'current_period'>;
export type PeriodPreview={before:TaskPeriods;after:TaskPeriods;changed:boolean;config_version:string;invalidated:string[];issue_treatments:PreparedTask['issue_treatments'];sha256:string;outcome?:'NO_CHANGE'|'PREPARED'};
export function taskPeriods(input:unknown):TaskPeriods{const p=closed(input,['comparison_period','current_period']);return Object.fromEntries(Object.entries(p).map(([k,v])=>{const d=closed(v,['start_date','end_date']);return [k,Object.fromEntries(Object.entries(d).map(([key,value])=>{if(typeof value!=='string')fail();return [key,value.trim()];}))];})) as TaskPeriods;}

// Closed retained-Assistant wire shape. Local identity aliases are decoded only
// by Application after the selected source and grant have been revalidated.
export function retainedOutbound(input:unknown){
 const p=closed(input,['authorized_context','current_attempt_history','visible_message','authorized_tool_result']);
 const c=closed(p.authorized_context,['contract_version','source','task','initial_text','material','selected_history','selected_reports','selected_materials','selected_results','allowed_references','tools']);
 if(!['1.0','1.1'].includes(String(c.contract_version))||c.source!=='current')fail('OUTBOUND_FORBIDDEN');const material=outbound(c.material);
 const text=(v:unknown)=>{if(typeof v!=='string'||/\b[0-9a-f]{8}-[0-9a-f-]{27,}\b/.test(v))fail('OUTBOUND_FORBIDDEN');outbound({...material,selected_text:v});};
 text(c.initial_text);text(p.visible_message);if(c.task!==null)text(c.task);
 for(const items of [p.current_attempt_history,c.selected_history]){if(!Array.isArray(items))fail('OUTBOUND_FORBIDDEN');for(const e of items){const row=closed(e,['kind','text']);if(!['user','question','advice','tool'].includes(String(row.kind)))fail('OUTBOUND_FORBIDDEN');if(row.kind==='tool')outbound(JSON.parse(String(row.text)));else text(row.text);}}
 if(p.authorized_tool_result!==null)outbound(p.authorized_tool_result);
 if(!Array.isArray(c.selected_reports))fail('OUTBOUND_FORBIDDEN');for(const r of c.selected_reports){const v=closed(r,['reference','material']);if(typeof v.reference!=='string'||! /^report-[1-9]\d*$/.test(v.reference))fail('OUTBOUND_FORBIDDEN');outbound(v.material);}
 for(const [items,model] of [[c.selected_materials,true],[c.selected_results,false]] as const){if(!Array.isArray(items))fail('OUTBOUND_FORBIDDEN');for(const r of items){const v=closed(r,['summary','limitations','unknowns',...(model?['classification']:[])]);if(model&&v.classification!=='MODEL')fail('OUTBOUND_FORBIDDEN');text(v.summary);for(const values of [v.limitations,v.unknowns]){if(!Array.isArray(values))fail('OUTBOUND_FORBIDDEN');values.forEach(text);}}}
 if(!Array.isArray(c.allowed_references))fail('OUTBOUND_FORBIDDEN');for(const r of c.allowed_references){const v=closed(r,['kind','id','revision_id','version','sha256']);if(!['case','evidence','finding','candidate','aggregate','report','history','result','material'].includes(String(v.kind))||typeof v.id!=='string'||! /^reference-[1-9]\d*$/.test(v.id)||v.revision_id!=='current'||v.sha256!==null||v.version!==null&&(!Number.isSafeInteger(v.version)||Number(v.version)<1))fail('OUTBOUND_FORBIDDEN');}
 if(!Array.isArray(c.tools)||c.tools.some(t=>!['read_case','read_evidence','read_candidates','read_aggregate','read_report'].includes(t)))fail('OUTBOUND_FORBIDDEN');return input;
}
