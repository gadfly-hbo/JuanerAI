import {hashFiniteJson} from './member-task.ts';
import {membershipRecord as closed,membershipUuid} from './member-analysis.ts';
import type {OpenFinding} from '../contracts/open-analysis-findings.mjs';
import type {OpenStoredTask} from '../ports/open-analysis-store.ts';
import {reportPostView} from './report-postprocessing.ts';

export type ReportContentCommand=Readonly<{version:'1.0';command_id:string;expected_content_sha256:string;action:'save'|'confirm'|'suggest'|'complete'|'fail'|'discard'|'apply';text?:string;finding_ids?:readonly string[];instruction?:string;paragraph_id?:string;suggestion_id?:string}>;
type ContentSnapshot=Readonly<{basis_sha256:string;review_sha256?:string;version:number;text:string;origin:string;finding_ids:readonly string[];paragraph_origins:readonly string[];partial:boolean}>;
export type ReportContentEvent=Readonly<{command:ReportContentCommand;saved:true;command_id:string;content_version:number;content_sha256:string;before:ContentSnapshot;snapshot:ContentSnapshot;at:string}>;
type Suggestion={id:string;sha256:string;paragraph_id:string;original:string;instruction:string;text:string|null;status:'generating'|'ready'|'failed'|'discarded'|'applied';at:string};
function fail(code:string):never{throw Object.assign(new Error(code),{code});}
const hash=(v:unknown)=>hashFiniteJson(v);
const split=(text:string)=>text.split(/\n\s*\n/);
export function reportContentCommand(raw:unknown):ReportContentCommand{
 const action=Reflect.get((raw??{}) as object,'action'),extras=action==='save'?['text','finding_ids']:action==='suggest'?['instruction',...(Object.hasOwn((raw??{}) as object,'paragraph_id')?['paragraph_id']:[])]:action==='complete'?['text','suggestion_id']:['apply','discard','fail'].includes(action)?['suggestion_id']:[];
 const x=closed(raw,['version','command_id','expected_content_sha256','action',...extras]);
 if(x.version!=='1.0'||!membershipUuid(x.command_id)||!['save','confirm','suggest','complete','fail','discard','apply'].includes(String(action))||typeof x.expected_content_sha256!=='string'||! /^[a-f0-9]{64}$/.test(x.expected_content_sha256))fail('VALIDATION_FAILED');
 if(extras.includes('text')&&(typeof x.text!=='string'||!x.text.trim()||x.text.length>100000))fail('VALIDATION_FAILED');
 if(action==='complete'&&split(String(x.text)).length!==1)fail('VALIDATION_FAILED');
 if(extras.includes('instruction')&&(typeof x.instruction!=='string'||!x.instruction.trim()||x.instruction.length>1500))fail('VALIDATION_FAILED');
 if(x.paragraph_id!==undefined&&(typeof x.paragraph_id!=='string'||! /^interpretation\/[0-9]+$/.test(x.paragraph_id)))fail('VALIDATION_FAILED');
 if(extras.includes('suggestion_id')&&!membershipUuid(x.suggestion_id))fail('VALIDATION_FAILED');
 if(action==='save'&&(!Array.isArray(x.finding_ids)||x.finding_ids.length>1000||x.finding_ids.some(id=>typeof id!=='string')||new Set(x.finding_ids).size!==x.finding_ids.length))fail('VALIDATION_FAILED');
 return structuredClone(raw) as ReportContentCommand;
}
export function reportBase(t:OpenStoredTask):{identity:OpenStoredTask['identity'];basis_sha256:string;review_sha256?:string;text:string;partial:boolean;findings:readonly OpenFinding[]}|null{
 const report=t.model_report;if(!report)return null;const edition=t.report_postprocessing?.editions.at(-1);
 return {identity:t.identity,basis_sha256:hash({identity:t.identity,outcome:report,...(edition?{report_edition:{version:edition.version,sha256:edition.sha256}}:{})}),text:edition?.text??report.text,partial:false,findings:[]};
}

function currentSnapshot(t:OpenStoredTask):ContentSnapshot|null{
 const base=reportBase(t);if(!base)return null;
 const events=t.report_content_events??[],sameBasis=events.filter(e=>e.snapshot.basis_sha256===base.basis_sha256);
 const saved=sameBasis.at(-1)?.snapshot;if(saved)return saved;
 return {basis_sha256:base.basis_sha256,...(base.review_sha256?{review_sha256:base.review_sha256}:{}),version:events.length?Math.max(...events.map(e=>e.content_version))+1:0,text:base.text,origin:'MODEL',finding_ids:[],paragraph_origins:split(base.text).map(()=>'MODEL'),partial:base.partial};
}
export function projectReportContent(t:OpenStoredTask){
 const base=reportBase(t),snapshot=currentSnapshot(t);if(!base||!snapshot)return null;
 const events=t.report_content_events??[],sha256=hash(snapshot),history:({version:number;text:string;origin:string;at:string|null;finding_ids:readonly string[]})[]=[];
 const seen=new Set<string>();for(const e of events)for(const s of [e.before,e.snapshot]){const key=hash(s);if(!seen.has(key)){seen.add(key);history.push({version:s.version,text:s.text,origin:s.origin,at:e.at,finding_ids:s.finding_ids});}}
 if(!seen.has(sha256))history.push({version:snapshot.version,text:snapshot.text,origin:snapshot.origin,at:null,finding_ids:snapshot.finding_ids});
 let suggestion:Suggestion|null=null;
 for(const e of events.filter(e=>e.snapshot.basis_sha256===snapshot.basis_sha256)){
  const c=e.command;if(c.action==='suggest'){const paragraph_id=c.paragraph_id??'interpretation/0';suggestion={id:c.command_id,sha256:c.expected_content_sha256,paragraph_id,original:split(e.before.text)[Number(paragraph_id.split('/')[1])]!,instruction:c.instruction!,text:null,status:'generating',at:e.at};}
  else if(suggestion&&c.suggestion_id===suggestion.id){const prior:Suggestion=suggestion;suggestion={...prior,...(c.action==='complete'?{text:c.text!,status:'ready' as const}:c.action==='fail'?{status:'failed' as const}:c.action==='discard'?{status:'discarded' as const}:c.action==='apply'?{status:'applied' as const}:{})};}
 }
 const confirmations=events.filter(e=>e.command.action==='confirm').map(e=>({sha256:e.content_sha256,version:e.content_version,at:e.at,partial:e.snapshot.partial}));
 const confirmed=confirmations.some(c=>c.sha256===sha256);
 return {...snapshot,sha256,identity:base.identity,postprocessing:reportPostView(t,snapshot.text),findings:base.findings,numeric_values:[] as readonly import('../ports/open-analysis-numeric-report.ts').OpenNumericValue[],at:events.at(-1)?.at??null,confirmed,confirmations,history,paragraphs:split(snapshot.text).map((text,i)=>({id:'interpretation/'+i,text,origin:snapshot.paragraph_origins[i]??snapshot.origin})),suggestion:suggestion?{...suggestion,stale:suggestion.sha256!==sha256}:null,invalidation:!confirmed&&confirmations.length?'报告内容或来源已变化，前版内容确认不再适用。':null};
}
export function resolveReportReferences(t:OpenStoredTask,raw:unknown){
 const c=projectReportContent(t);if(!c||!Array.isArray(raw)||!raw.length||raw.length>8)fail('RESULT_OUTSIDE_AUTHORIZATION');
 if(['running','unknown'].includes(t.state)||t.pending_stop_epoch!==null)fail('TASK_UNCONFIRMED');
 return raw.map(r=>{const x=closed(r,['kind','task_id','revision','scope_sha256','content_sha256','id','quote']);if(x.task_id!==t.identity.task_id||x.revision!==t.identity.revision||x.scope_sha256!==t.identity.scope_sha256||x.content_sha256!==c.sha256)fail('REVISION_CONFLICT');
  const finding=c.findings.find(f=>f.id===x.id),p=c.paragraphs.find(p=>p.id===x.id),source=x.kind==='finding'&&finding?finding.claim+'：'+finding.value+' '+finding.unit:x.kind==='paragraph'&&p?p.text:null;
  if(!source||typeof x.quote!=='string'||!x.quote.trim()||x.quote.length>1500||!source.includes(x.quote))fail('RESULT_OUTSIDE_AUTHORIZATION');
  return {id:String(x.id),quote:x.quote,scope:t.identity.scope_sha256,revision:t.identity.revision};
 });
}
export function nextReportContentEvent(t:OpenStoredTask,raw:unknown):ReportContentEvent{
 const command=reportContentCommand(raw),current=projectReportContent(t),before=currentSnapshot(t);if(!current||!before)fail('NOT_FOUND');
 const prior=t.report_content_events?.find(e=>e.command_id===command.command_id);if(prior){if(hash(prior.command)!==hash(command))fail('COMMAND_CONFLICT');return prior;}
 const internal=['complete','fail'].includes(command.action),suggestion=current.suggestion;
 const settledPartial=t.state==='waiting'&&current.partial&&current.findings.length>0;
 if(!internal&&(t.pending_stop_epoch!==null||['running','unknown','ready'].includes(t.state)||t.state==='waiting'&&!settledPartial))fail('TASK_UNCONFIRMED');
 if(!internal&&command.expected_content_sha256!==current.sha256)fail('REVISION_CONFLICT');
 if(command.action==='save'&&command.finding_ids!.some(id=>!current.findings.some(f=>f.id===id)))fail('RESULT_OUTSIDE_AUTHORIZATION');
 if(command.action==='suggest'&&!current.paragraphs.some(p=>p.id===(command.paragraph_id??'interpretation/0')))fail('RESULT_OUTSIDE_AUTHORIZATION');
 if(['confirm','suggest'].includes(command.action)&&suggestion&&['generating','ready'].includes(suggestion.status))fail('REPORT_SUGGESTION_PENDING');
 if(['complete','fail','discard','apply'].includes(command.action)&&(!suggestion||suggestion.id!==command.suggestion_id))fail('REVISION_CONFLICT');
 if(['complete','fail'].includes(command.action)&&suggestion!.status!=='generating')fail('COMMAND_CONFLICT');
 if(command.action==='apply'&&(suggestion!.stale||suggestion!.status!=='ready'))fail('REVISION_CONFLICT');
 let snapshot=before;
 if(command.action==='save'||command.action==='apply'){
  const paragraphs=current.paragraphs,nextText=command.action==='save'?command.text!:suggestion!.text===paragraphs.find(p=>p.id===suggestion!.paragraph_id)!.text?before.text:paragraphs.map(p=>p.id===suggestion!.paragraph_id?suggestion!.text!:p.text).join('\n\n'),finding_ids=command.action==='save'?command.finding_ids!:before.finding_ids;
  if(nextText!==before.text||hash(finding_ids)!==hash(before.finding_ids)){const origin=nextText===before.text?before.origin:command.action==='save'?'USER':'MODEL_SUGGESTION · 用户采用';snapshot={...before,version:before.version+1,text:nextText,finding_ids,origin,paragraph_origins:split(nextText).map((p,i)=>p===paragraphs[i]?.text?paragraphs[i]!.origin:origin)};}
 }
 return {command,saved:true,command_id:command.command_id,content_version:snapshot.version,content_sha256:hash(snapshot),before,snapshot,at:new Date().toISOString()};
}
function validateSnapshot(raw:ContentSnapshot){
 const s=closed(raw,['basis_sha256',...(raw.review_sha256?['review_sha256']:[]),'version','text','origin','finding_ids','paragraph_origins','partial']);
 if(s.review_sha256!==undefined&&(typeof s.review_sha256!=='string'||! /^[a-f0-9]{64}$/.test(s.review_sha256)))fail('INTEGRITY_BLOCKED');
 if(typeof s.basis_sha256!=='string'||! /^[a-f0-9]{64}$/.test(s.basis_sha256)||!Number.isSafeInteger(s.version)||Number(s.version)<0||typeof s.text!=='string'||!s.text.trim()||s.text.length>100000||!['MODEL','USER','MODEL_SUGGESTION · 用户采用'].includes(String(s.origin))||typeof s.partial!=='boolean'||!Array.isArray(s.finding_ids)||s.finding_ids.length>1000||s.finding_ids.some(v=>typeof v!=='string')||!Array.isArray(s.paragraph_origins)||s.paragraph_origins.length!==split(s.text).length||s.paragraph_origins.some(o=>!['MODEL','USER','MODEL_SUGGESTION · 用户采用'].includes(o)))fail('INTEGRITY_BLOCKED');
}
export function validateReportContentEvents(t:OpenStoredTask){
 const events=t.report_content_events;if(events===undefined)return;
 if(!Array.isArray(events)||events.length>4000||Buffer.byteLength(JSON.stringify(events))>16*1024*1024)fail('INTEGRITY_BLOCKED');
 const ids=new Set<string>(),latest=new Map<string,ContentSnapshot>();
 for(const e of events){closed(e,['command','saved','command_id','content_version','content_sha256','before','snapshot','at']);reportContentCommand(e.command);validateSnapshot(e.before);validateSnapshot(e.snapshot);
  if(e.saved!==true||e.command_id!==e.command.command_id||ids.has(e.command_id)||e.content_version!==e.snapshot.version||e.content_sha256!==hash(e.snapshot)||e.before.basis_sha256!==e.snapshot.basis_sha256||typeof e.at!=='string'||!Number.isFinite(Date.parse(e.at)))fail('INTEGRITY_BLOCKED');ids.add(e.command_id);
  const previous=latest.get(e.before.basis_sha256);if(previous&&hash(previous)!==hash(e.before))fail('INTEGRITY_BLOCKED');
  if(!['complete','fail'].includes(e.command.action)&&e.command.expected_content_sha256!==hash(e.before))fail('INTEGRITY_BLOCKED');
  if(['save','apply'].includes(e.command.action)){if(e.snapshot.version!==e.before.version+(hash(e.snapshot)===hash(e.before)?0:1))fail('INTEGRITY_BLOCKED');}
  else if(hash(e.before)!==hash(e.snapshot))fail('INTEGRITY_BLOCKED');
  latest.set(e.snapshot.basis_sha256,e.snapshot);
 }
}
