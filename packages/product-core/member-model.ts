import {membershipRecord as closed,membershipUuid} from './member-analysis.ts';
import {containsPath,outbound,taskHash,fail,type Outbound} from './member-task.ts';
import {operationDigest,type OperationPolicy} from './member-operation.ts';
import {memberSourceBindings,type SourceBinding} from './member-source-qualification.ts';
export type MembershipModelContext={task_id:string;command_id:string;execution_id:string;epoch:number};
export type MembershipStructure={source_id:string;sheets:readonly {sheet_id:string;columns:readonly {name:string;types:readonly string[]}[]}[]};
export type VerifiedMembershipIdentity={parent_report_id:string;parent_report_sha256:string;run_id:string;plan_sha256:string;preparation_sha256:string;finding_id:string;aggregate_sha256:string;direction:'decrease'|'increase'|'equal'|'not_comparable';status:'verified'};
export type MembershipModelPayload={clarifications?:readonly {sha256:string;reply:string}[];verification?:VerifiedMembershipIdentity;version:'2.0';stage:'clarify'|'generate_preparation'|'correct_preparation'|'explain';source_set_sha256:string|null;selected_text:string|null;structure:readonly MembershipStructure[];semantics:Outbound['semantics']|null;result:Outbound['result'];diagnostic:null|'CONVERSION_UNQUALIFIED'|'PREPARATION_OUTPUT_INVALID'};
export type MembershipAnalysisProposal={currency:'CNY';time_zone:'Asia/Shanghai';comparison_period:{start_date:string;end_date:string};current_period:{start_date:string;end_date:string};period_evidence:string;statuses:readonly {value:string;meaning:string;evidence:string}[]};
export type MembershipModelOutput={kind:'question'|'report';text:string}|{kind:'preparation';bindings:readonly SourceBinding[];code:string;analysis?:MembershipAnalysisProposal};

export type MembershipModelResult={version:'3.0';context:MembershipModelContext;provider:OperationPolicy['provider'];model:OperationPolicy['model'];output:MembershipModelOutput};
export function membershipMaterialText(value:unknown):string {
 if(typeof value!=='string'||!value.trim()||value.length>12000||containsPath(value)||/(?:https?:\/\/|Bearer\s|sk-[\w-]+|\b(?:SELECT|INSERT|DELETE)\s|[,\t].*[,\t]|[\w.+-]+@[\w.-]+\.[A-Za-z]{2,})/i.test(value))fail('OUTBOUND_FORBIDDEN');return value;
}
export function membershipModelPayload(value:unknown):MembershipModelPayload {
 const p=closed(value,['version','stage','source_set_sha256','selected_text','structure','semantics','result','diagnostic',...(Object.hasOwn(value as object,'verification')?['verification']:[]),...(Object.hasOwn(value as object,'clarifications')?['clarifications']:[])]);
 if(p.version!=='2.0'||!['clarify','generate_preparation','correct_preparation','explain'].includes(String(p.stage))||p.source_set_sha256!==null&&!operationDigest(p.source_set_sha256)||!Array.isArray(p.structure)||p.structure.length>32)fail('OUTBOUND_FORBIDDEN');
 if(p.source_set_sha256===null&&(p.stage!=='clarify'||p.structure.length!==0||p.selected_text===null||p.semantics!==null||p.result!==null))fail('OUTBOUND_FORBIDDEN');
 if(p.selected_text!==null)membershipMaterialText(p.selected_text);
 if(Object.hasOwn(p,'clarifications')){if(p.stage==='explain'||!Array.isArray(p.clarifications)||!p.clarifications.length||p.clarifications.length>32)fail('OUTBOUND_FORBIDDEN');const seen=new Set<string>();for(const raw of p.clarifications){const c=closed(raw,['sha256','reply']);if(!operationDigest(c.sha256)||seen.has(c.sha256))fail('OUTBOUND_FORBIDDEN');seen.add(c.sha256);membershipMaterialText(c.reply);}}
 const sources=new Set<string>();for(const raw of p.structure){const s=closed(raw,['source_id','sheets']);if(!membershipUuid(s.source_id)||sources.has(s.source_id)||!Array.isArray(s.sheets)||!s.sheets.length||s.sheets.length>128)fail('OUTBOUND_FORBIDDEN');sources.add(s.source_id);const sheets=new Set<string>();for(const rawSheet of s.sheets){const sheet=closed(rawSheet,['sheet_id','columns']);if(typeof sheet.sheet_id!=='string'||!sheet.sheet_id||sheet.sheet_id.length>200||containsPath(sheet.sheet_id)||sheets.has(sheet.sheet_id)||!Array.isArray(sheet.columns)||!sheet.columns.length||sheet.columns.length>256)fail('OUTBOUND_FORBIDDEN');sheets.add(sheet.sheet_id);const names=new Set<string>();for(const rawColumn of sheet.columns){const c=closed(rawColumn,['name','types']);membershipMaterialText(c.name);if(names.has(String(c.name))||!Array.isArray(c.types)||!c.types.length||new Set(c.types).size!==c.types.length||c.types.some(t=>!['string','number','boolean','date','blank'].includes(String(t))))fail('OUTBOUND_FORBIDDEN');names.add(String(c.name));}}}
 if(p.semantics!==null){membershipModelPeriods(p.semantics);outbound({version:'1.0',source_sha256:p.source_set_sha256,methods:['M1'],semantics:p.semantics,preparation:{members:'0',orders:'0'},selected_text:null,result:p.result,tool_result:p.result===null?null:'verified'});}else if(p.result!==null)fail('OUTBOUND_FORBIDDEN');
 if(p.stage==='explain'){const v=closed(p.verification,['run_id','plan_sha256','preparation_sha256','finding_id','aggregate_sha256','direction','status','parent_report_id','parent_report_sha256']);if(typeof v.run_id!=='string'||! /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v.run_id)||!membershipUuid(v.finding_id)||!membershipUuid(v.parent_report_id)||!operationDigest(v.parent_report_sha256)||![v.plan_sha256,v.preparation_sha256,v.aggregate_sha256].every(operationDigest)||v.status!=='verified'||!['decrease','increase','equal','not_comparable'].includes(String(v.direction))||p.structure.length!==0||p.selected_text!==null)fail('OUTBOUND_FORBIDDEN');}else if(Object.hasOwn(p,'verification'))fail('OUTBOUND_FORBIDDEN');
 if(p.stage==='explain'&&p.result===null||p.stage!=='explain'&&p.result!==null||p.stage==='correct_preparation'&&!['CONVERSION_UNQUALIFIED','PREPARATION_OUTPUT_INVALID'].includes(String(p.diagnostic))||p.stage!=='correct_preparation'&&p.diagnostic!==null)fail('OUTBOUND_FORBIDDEN');
 return structuredClone(value) as MembershipModelPayload;
}
function membershipModelPeriods(value:unknown){
 const s=value as {comparison_period?:unknown;current_period?:unknown};
 const periods=[s.comparison_period,s.current_period].map(raw=>{
  const p=closed(raw,['start_date','end_date']);return [p.start_date,p.end_date].map(value=>{
   if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))fail('OUTBOUND_FORBIDDEN');
   const time=Date.parse(value+'T00:00:00Z');if(!Number.isFinite(time)||new Date(time).toISOString().slice(0,10)!==value)fail('OUTBOUND_FORBIDDEN');return time;
  });
 });
 const [a,b]=periods;if(a[1]<=a[0]||b[1]<=b[0]||a[1]-a[0]!==b[1]-b[0]||!(a[1]<=b[0]||b[1]<=a[0]))fail('OUTBOUND_FORBIDDEN');
}

export function membershipAnalysisProposal(value:unknown,input:MembershipModelPayload):MembershipAnalysisProposal{
 const a=closed(value,['currency','time_zone','comparison_period','current_period','period_evidence','statuses']);
 const selected=[input.selected_text,...(input.clarifications??[]).map(c=>c.reply)].filter((x):x is string=>typeof x==='string');
 if(a.currency!=='CNY'||a.time_zone!=='Asia/Shanghai'||!selected.length||!Array.isArray(a.statuses)||a.statuses.length<1||a.statuses.length>32)fail('OUTBOUND_FORBIDDEN');
 membershipModelPeriods(a);
 const evidence=(value:unknown)=>{if(typeof value!=='string'||!value.trim()||value.length>2000||!selected.some(text=>text.includes(value)))fail('OUTBOUND_FORBIDDEN');};evidence(a.period_evidence);
 // A quote is attribution, not period validation. Only the supported explicit pair compiles.
 const periodText=[...selected].reverse().find(text=>/\d{4}-\d{2}-\d{2}/.test(text));
 const literal=periodText?.match(/比较\s*(\d{4}-\d{2}-\d{2})\s*至\s*(\d{4}-\d{2}-\d{2})\s*与\s*(\d{4}-\d{2}-\d{2})\s*至\s*(\d{4}-\d{2}-\d{2})/);
 if(!literal||periodText!.match(/\d{4}-\d{2}-\d{2}/g)?.length!==4||/(?:不要|不是|可能|或者)/.test(periodText!)||!periodText!.includes(String(a.period_evidence)))fail('OUTBOUND_FORBIDDEN');
 const actual=[(a.comparison_period as {start_date:string}).start_date,(a.comparison_period as {end_date:string}).end_date,(a.current_period as {start_date:string}).start_date,(a.current_period as {end_date:string}).end_date];
 if(actual.some((date,index)=>date!==literal[index+1]))fail('OUTBOUND_FORBIDDEN');
 const values=new Set<string>();for(const raw of a.statuses){const status=closed(raw,['value','meaning','evidence']);if(typeof status.value!=='string'||!status.value.trim()||status.value.length>100||values.has(status.value)||typeof status.meaning!=='string'||!status.meaning.trim()||status.meaning.length>500)fail('OUTBOUND_FORBIDDEN');membershipMaterialText(status.value);membershipMaterialText(status.meaning);evidence(status.evidence);if(!String(status.evidence).includes(status.value)||!String(status.evidence).includes(status.meaning))fail('OUTBOUND_FORBIDDEN');values.add(status.value);}
 return structuredClone(value) as MembershipAnalysisProposal;
}
export function membershipModelOutput(value:unknown,input:MembershipModelPayload):MembershipModelOutput{
 const kind=(value as {kind?:unknown})?.kind;
 if(kind==='preparation'){const hasAnalysis=Object.hasOwn(value as object,'analysis'),p=closed(value,['kind','bindings','code',...(hasAnalysis?['analysis']:[])]);if(!['generate_preparation','correct_preparation'].includes(input.stage)||typeof p.code!=='string'||!p.code.trim()||Buffer.byteLength(p.code)>65536)fail('OUTBOUND_FORBIDDEN');const bindings=memberSourceBindings(p.bindings),expected=new Set(input.structure.flatMap(s=>s.sheets.map(sheet=>JSON.stringify([s.source_id,sheet.sheet_id]))));if(bindings.length!==expected.size||!bindings.some(b=>b.role==='members')||!bindings.some(b=>b.role==='orders'))fail('OUTBOUND_FORBIDDEN');for(const b of bindings){if(!expected.delete(JSON.stringify([b.source_id,b.sheet_id])))fail('OUTBOUND_FORBIDDEN');const sheet=input.structure.find(s=>s.source_id===b.source_id)?.sheets.find(s=>s.sheet_id===b.sheet_id);if(!sheet||Object.values(b.columns).some(name=>!sheet.columns.some(c=>c.name===name)))fail('OUTBOUND_FORBIDDEN');}return {kind,bindings,code:p.code,...(hasAnalysis?{analysis:membershipAnalysisProposal(p.analysis,input)}:{})};}
 const p=closed(value,['kind','text']);if(!['question','report'].includes(String(kind))||kind==='report'&&input.stage!=='explain')fail('OUTBOUND_FORBIDDEN');membershipMaterialText(p.text);return {kind:kind as 'question'|'report',text:String(p.text)};
}
export const membershipModelResultHash=(result:MembershipModelResult)=>taskHash(result);
/** One canonical business tool schema, passed unchanged to native prepare and DTO. */
export const membershipModelOutputSchema=Object.freeze({type:'object',oneOf:[
 {type:'object',additionalProperties:false,properties:{kind:{const:'question'},text:{type:'string',minLength:1,maxLength:12000}},required:['kind','text']},
 {type:'object',additionalProperties:false,properties:{kind:{const:'report'},text:{type:'string',minLength:1,maxLength:12000}},required:['kind','text']},
 {type:'object',additionalProperties:false,properties:{kind:{const:'preparation'},bindings:{type:'array',minItems:2,items:{type:'object',additionalProperties:false,properties:{source_id:{type:'string'},sheet_id:{type:'string'},role:{enum:['members','orders']},columns:{type:'object',additionalProperties:{type:'string'}}},required:['source_id','sheet_id','role','columns']}},code:{type:'string',minLength:1,maxLength:65536},analysis:{type:'object',additionalProperties:false,properties:{currency:{const:'CNY'},time_zone:{const:'Asia/Shanghai'},comparison_period:{type:'object',properties:{start_date:{type:'string'},end_date:{type:'string'}},required:['start_date','end_date'],additionalProperties:false},current_period:{type:'object',properties:{start_date:{type:'string'},end_date:{type:'string'}},required:['start_date','end_date'],additionalProperties:false},period_evidence:{type:'string'},statuses:{type:'array',items:{type:'object',properties:{value:{type:'string'},meaning:{type:'string'},evidence:{type:'string'}},required:['value','meaning','evidence'],additionalProperties:false}}},required:['currency','time_zone','comparison_period','current_period','period_evidence','statuses']}},required:['kind','bindings','code']}
]});
export const membershipModelPrompt='会员分析专业能力。通过原生工具自主推进，不按宿主固定步骤。仅使用披露的文字、结构和获准已核验总体事实；原始明细留在本地受控计算。必要歧义用 propose_member_output 提出 question，等待人回答。受控Python使用预置 SOURCES（本地输入快照路径列表）、OUTPUT（唯一输出目录）、csv、os 等已批准模块，写出完整规范 members.csv/orders.csv；不得寻址其他文件。通过 code 字段提交本用途的准备提议，再显式选择提议进行真实预处理和独立 M1 核验。准备/解释属于 MODEL 材料，不是独立证据或正式决定。语义期间及状态必须来自已披露原文并提供逐字依据；禁止猜默认期间、状态、关联、因果或行动。报告解释只能引用 read_verified_result 提供的获准已核验总体事实，不得冒充新的独立核验。不可请求Shell、网络、任意路径、原始明细或身份值。';
