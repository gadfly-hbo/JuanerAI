import {membershipRecord as closed,membershipUuid} from './member-analysis.ts';
import {validateOpenBusinessProposal,type OpenBusinessProposal} from './open-analysis-context.ts';
import {taskHash} from './member-task.ts';
export type RequirementDraftContent=Readonly<{business:OpenBusinessProposal;methods:readonly string[];evidence:readonly string[];previews:readonly Readonly<{possibility:'supported'|'refuted'|'insufficient';answer:string;needs:readonly string[];impact:string}>[]}>;
export type RequirementDraftCommand=Readonly<{version:'1.0';command_id:string;expected_sequence:number;content:RequirementDraftContent;message:string;discussion?:Readonly<{reply:string;request_sha256:string}>}>;
export type RequirementConversation=Readonly<{command_id:string;request_sha256:string;sequence:number;revision:number;user:Readonly<{classification:'USER_SAID';text:string}>;assistant:Readonly<{classification:'MODEL_PROPOSAL';text:string}>}>;
export type RequirementDraft=Readonly<{version:'1.0';revision:number;sequence:number;content:RequirementDraftContent;receipts:readonly Readonly<{command_id:string;command_sha256:string;sequence:number;revision:number;message?:string}>[];history:readonly Readonly<{revision:number;content:RequirementDraftContent}>[];conversation?:readonly RequirementConversation[]}>;
function fail():never{throw Object.assign(new Error('DRAFT_INVALID'),{code:'DRAFT_INVALID',stack:'DRAFT_INVALID'});}
const integer=(v:unknown,min=0):v is number=>typeof v==='number'&&Number.isSafeInteger(v)&&v>=min;
function text(raw:unknown){if(typeof raw!=='string'||!raw.trim()||raw.length>12000)fail();return raw;}
function list(raw:unknown):string[]{if(!Array.isArray(raw)||raw.length>32)fail();return raw.map(text);}
export function requirementDraftContent(raw:unknown):RequirementDraftContent{
 const x=closed(raw,['business','methods','evidence','previews']);if(!Array.isArray(x.previews)||x.previews.length>8)fail();
 return {business:validateOpenBusinessProposal(x.business),methods:list(x.methods),evidence:list(x.evidence),previews:x.previews.map(raw=>{const p=closed(raw,['possibility','answer','needs','impact']);if(!['supported','refuted','insufficient'].includes(String(p.possibility)))fail();return {possibility:p.possibility as 'supported'|'refuted'|'insufficient',answer:text(p.answer),needs:list(p.needs),impact:text(p.impact)};})};
}
export function requirementDraftCommand(raw:unknown):RequirementDraftCommand{
 const x=closed(raw,['version','command_id','expected_sequence','content','message',...(raw&&typeof raw==='object'&&Object.hasOwn(raw,'discussion')?['discussion']:[])]);if(x.version!=='1.0'||!membershipUuid(x.command_id)||!integer(x.expected_sequence)||typeof x.message!=='string'||x.message.length>12000)fail();
 let discussion:RequirementDraftCommand['discussion'];if(x.discussion){const d=closed(x.discussion,['reply','request_sha256']);if(typeof d.request_sha256!=='string'||! /^[a-f0-9]{64}$/.test(d.request_sha256))fail();discussion={reply:text(d.reply),request_sha256:d.request_sha256};}
 return {version:'1.0',command_id:x.command_id,expected_sequence:x.expected_sequence,content:requirementDraftContent(x.content),message:x.message,...(discussion?{discussion}:{})};
}
export function validateRequirementDraft(raw:unknown):RequirementDraft{
 const x=closed(raw,['version','revision','sequence','content','receipts','history',...(raw&&typeof raw==='object'&&Object.hasOwn(raw,'conversation')?['conversation']:[])]);
 if(x.version!=='1.0'||!integer(x.revision,1)||!integer(x.sequence,1)||!Array.isArray(x.receipts)||x.receipts.length!==x.sequence||x.receipts.length>1000||!Array.isArray(x.history)||x.history.length!==x.revision-1)fail();
 const content=requirementDraftContent(x.content),ids=new Set<string>();let revision=0;
 for(const [i,raw] of x.receipts.entries()){const r=closed(raw,['command_id','command_sha256','sequence','revision',...(raw&&typeof raw==='object'&&Object.hasOwn(raw,'message')?['message']:[])]);if(r.message!==undefined&&(typeof r.message!=='string'||r.message.length>12000))fail();if(!membershipUuid(r.command_id)||ids.has(r.command_id)||r.sequence!==i+1||!integer(r.revision,1)||r.revision<revision||r.revision>revision+1||typeof r.command_sha256!=='string'||!/^[a-f0-9]{64}$/.test(r.command_sha256))fail();ids.add(r.command_id);revision=r.revision;}
 if(revision!==x.revision)fail();
 for(const [i,raw] of x.history.entries()){const h=closed(raw,['revision','content']);if(h.revision!==i+1)fail();requirementDraftContent(h.content);}
 if(x.conversation!==undefined){if(!Array.isArray(x.conversation)||x.conversation.length>x.sequence)fail();let previous=0;for(const raw of x.conversation){const c=closed(raw,['command_id','request_sha256','sequence','revision','user','assistant']),receipt=x.receipts.find(r=>Reflect.get(r,'command_id')===c.command_id);if(!receipt||c.sequence!==Reflect.get(receipt,'sequence')||c.revision!==Reflect.get(receipt,'revision')||!integer(c.sequence,1)||c.sequence<=previous||typeof c.request_sha256!=='string'||! /^[a-f0-9]{64}$/.test(c.request_sha256))fail();previous=c.sequence;const u=closed(c.user,['classification','text']),a=closed(c.assistant,['classification','text']);if(u.classification!=='USER_SAID'||a.classification!=='MODEL_PROPOSAL')fail();text(u.text);text(a.text);}}
 const expected={version:'1.0',revision:x.revision,sequence:x.sequence,content,receipts:x.receipts,history:x.history,...(x.conversation!==undefined?{conversation:x.conversation}:{})};if(taskHash(raw)!==taskHash(expected))fail();return structuredClone(expected) as RequirementDraft;
}

/** A saved draft is not a model grant. Only explicit model work replaces this marker. */
export const unconfiguredRequirementHash=taskHash({purpose:'manual_requirement_draft',model_authorized:false});

export type RequirementReview=Readonly<{version:'1.0';command_id:string;revision:number;content_sha256:string;scope_sha256:string;confirmed:true}>;
export type RequirementExecution=Readonly<{version:'1.0';command_id:string;review_command_id:string;revision:number;content:RequirementDraftContent;scope_sha256:string;analysis_revision:string;user_statements?:readonly string[]}>;
export function applicableRequirementReview(task:{requirement_draft?:RequirementDraft;requirement_reviews?:readonly RequirementReview[];identity:{scope_sha256:string}}){const d=task.requirement_draft;return d?[...(task.requirement_reviews??[])].reverse().find(r=>r.revision===d.revision&&r.content_sha256===taskHash(d.content)&&r.scope_sha256===task.identity.scope_sha256)??null:null;}
export function validateRequirementRecords(task:{requirement_draft?:RequirementDraft;requirement_reviews?:readonly RequirementReview[];requirement_execution?:RequirementExecution;identity:{scope_sha256:string;revision:string}}){
 const d=task.requirement_draft,seen=new Set<string>();if(task.requirement_reviews){if(!d||!Array.isArray(task.requirement_reviews)||task.requirement_reviews.length>1000)fail();for(const r of task.requirement_reviews){closed(r,['version','command_id','revision','content_sha256','scope_sha256','confirmed']);const content=r.revision===d.revision?d.content:d.history.find(h=>h.revision===r.revision)?.content;if(r.version!=='1.0'||!membershipUuid(r.command_id)||seen.has(r.command_id)||r.confirmed!==true||!content||r.content_sha256!==taskHash(content)||! /^[a-f0-9]{64}$/.test(r.scope_sha256))fail();seen.add(r.command_id);}}
 const e=task.requirement_execution;if(e){closed(e,['version','command_id','review_command_id','revision','content','scope_sha256','analysis_revision',...(e.user_statements?['user_statements']:[])]);if(e.user_statements){if(!d)fail();const actual=requirementUserStatements(d,e.revision);if(!Array.isArray(e.user_statements)||e.user_statements.length>1000||e.user_statements.some(v=>!actual.includes(v)))fail();}const r=task.requirement_reviews?.find(r=>r.command_id===e.review_command_id);if(e.version!=='1.0'||!membershipUuid(e.command_id)||!r||r.revision!==e.revision||r.content_sha256!==taskHash(requirementDraftContent(e.content))||r.scope_sha256!==e.scope_sha256||e.scope_sha256!==task.identity.scope_sha256||e.analysis_revision!==task.identity.revision)fail();}
}

/** Only durable user words, never assistant proposals or preview claims. */
export function requirementUserStatements(draft:RequirementDraft,revision=draft.revision):string[]{return [...new Set([...draft.receipts.filter(r=>r.revision<=revision).map(r=>r.message??''),...(draft.conversation??[]).filter(c=>c.revision<=revision).map(c=>c.user.text)].filter(v=>v.trim()))];}
