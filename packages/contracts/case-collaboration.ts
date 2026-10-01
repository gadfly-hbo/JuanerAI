import type {AssistantSource,AssistantEvent,AssistantSession,AssistantAttempt,AssistantEvent as Event} from './case-assistant.ts';
export type ChildKind='fork'|'subagent';
export type ChildPreview=Readonly<{
 id:string;parent_session_id:string;kind:ChildKind;task:string;cutoff_id:string|null;
 source:AssistantSource;baseline_decision_id:string|null;
 selected_history:readonly AssistantEvent[];
 selected_reports:readonly Readonly<{id:string;summary:string}>[];
 aggregate:AssistantSource['aggregate']|null;
 parent_epoch:number;created_at:string;
}>;
export type ChildRelation=ChildPreview & Readonly<{child_session_id:string}>;
export type CollaborationProjection=Readonly<{
 version:'1.1';lifecycle:CollaborationLifecycle;parent_lifecycle:CollaborationLifecycle;valid:boolean;current_source:AssistantSource;current_decision_id:string|null;occupant:Readonly<{session_id:string|null;label:string}>|null;deliveries:readonly ChildDelivery[];session:AssistantSession;relation:ChildRelation;attempts:readonly AssistantAttempt[];events:readonly Event[];results:readonly ChildResult[];
}>;
export type CollaborationRequest=Readonly<{version:'1.1'}>&(
 Readonly<{operation:'prepare_child';session_id:string;kind:ChildKind;task:string;cutoff_id:string|null;history_ids:readonly string[];report_ids:readonly string[];include_aggregate:boolean}>|
 Readonly<{operation:'create_child';session_id:string;preview_id:string;command_id:string;confirmed:boolean}>|
 Readonly<{operation:'prepare_parent';session_id:string;text:string;history_ids:readonly string[];report_ids:readonly string[];material_ids:readonly string[];rebase:boolean}>|
 Readonly<{operation:'prepare';session_id:string;text:string;history_ids:readonly string[];result_ids:readonly string[]}>|
 Readonly<{operation:'start';session_id:string;authorization_id:string;free_text_confirmed:boolean}>|
 Readonly<{operation:'send';session_id:string;text:string}>|
 (ResultTarget&Readonly<{operation:'return_result';session_id:string;command_id:string}>)|
 (ResultTarget&Readonly<{operation:'review_result';session_id:string;command_id:string;disposition:'adopted'|'declined';reason:string;confirmed:boolean}>)|
 Readonly<{operation:'read_parent';session_id:string}>|
 Readonly<{operation:'reopen';session_id:string;expected_epoch:number}>|
 Readonly<{operation:'close';session_id:string;expected_epoch:number;confirmed:boolean}>|
 Readonly<{operation:'stop';session_id:string}>|
 Readonly<{operation:'read_collaboration'|'open_child_window'|'focus_parent';session_id:string}>
);
export function validateCollaborationRequest(input:unknown):CollaborationRequest{
 const fail=():never=>{throw Object.assign(new Error('INVALID_REQUEST'),{code:'INVALID_REQUEST'});};
 if(!input||typeof input!=='object'||Array.isArray(input))fail();
 const r=input as Record<string,unknown>;
 const fields:Record<string,string[]>={focus_parent:['session_id'],reopen:['session_id','expected_epoch'],close:['session_id','expected_epoch','confirmed'],prepare_parent:['session_id','text','history_ids','report_ids','material_ids','rebase'],read_parent:['session_id'],return_result:['session_id','result_id','result_version','result_sha256','command_id'],review_result:['session_id','result_id','result_version','result_sha256','command_id','disposition','reason','confirmed'],prepare:['session_id','text','history_ids','result_ids'],start:['session_id','authorization_id','free_text_confirmed'],send:['session_id','text'],stop:['session_id'],prepare_child:['session_id','kind','task','cutoff_id','history_ids','report_ids','include_aggregate'],create_child:['session_id','preview_id','command_id','confirmed'],read_collaboration:['session_id'],open_child_window:['session_id']};
 const keys=fields[String(r.operation)],uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
 if(r.version!=='1.1'||!keys||Object.keys(r).sort().join('|')!==['version','operation',...keys].sort().join('|'))fail();
 for(const key of keys){const v=r[key];if(key.endsWith('_id')&&!(key==='cutoff_id'&&v===null)&&(typeof v!=='string'||!uuid.test(v)))fail();
 if(key==='expected_epoch'&&(!Number.isSafeInteger(v)||Number(v)<0))fail();
 if(key==='result_version'&&(!Number.isSafeInteger(v)||Number(v)<1))fail();
 if(key==='result_sha256'&&(typeof v!=='string'||! /^[0-9a-f]{64}$/.test(v)))fail();
 if(key==='disposition'&&!['adopted','declined'].includes(String(v)))fail();
 if(key==='reason'&&typeof v!=='string')fail();
 if(key==='kind'&&!['fork','subagent'].includes(String(v)))fail();
 if(['task','text'].includes(key)&&(typeof v!=='string'||!v.trim()))fail();
 if(['confirmed','include_aggregate','free_text_confirmed','rebase'].includes(key)&&typeof v!=='boolean')fail();
 if(key.endsWith('_ids')&&(!Array.isArray(v)||v.some(id=>typeof id!=='string'||!uuid.test(id))||new Set(v).size!==v.length))fail();}
 return structuredClone(input) as CollaborationRequest;
}
export type CollaborationReference=Readonly<{kind:'case'|'evidence'|'finding'|'candidate'|'aggregate'|'report'|'history'|'result'|'material';id:string;revision_id:string;version:number|null;sha256:string|null}>;
export type ChildResultValue=Readonly<{kind:'result';summary:string;references:readonly CollaborationReference[];limitations:readonly string[];unknowns:readonly string[]}>;
export type ChildResult=Readonly<{id:string;child_session_id:string;parent_session_id:string;attempt_id:string;authorization_id:string;version:number;source:AssistantSource;baseline_decision_id:string|null;value:ChildResultValue;created_at:string;sha256:string}>;
export type ChildAuthorization=Readonly<{kind:ChildKind;child_session_id:string;parent_session_id:string;parent_epoch:number;child_epoch:number;allowed_references:readonly CollaborationReference[];selected_results:readonly ChildResult[]}>;
export type ResultTarget=Readonly<{result_id:string;result_version:number;result_sha256:string}>;
export type ChildDelivery=Readonly<{result_id:string;parent_session_id:string;status:'unreturned'|'failed'|'returned';returned_at:string|null;error:string|null}>;
export type ChildReview=ResultTarget & Readonly<{parent_session_id:string;disposition:'adopted'|'declined';reason:string;at:string;material_id:string|null}>;
export type ParentMaterial=Readonly<{id:string;classification:'MODEL';result:ChildResult;review:ChildReview}>;
export type ParentCollaboration=Readonly<{children:readonly ChildRelation[];results:readonly ChildResult[];deliveries:readonly ChildDelivery[];reviews:readonly ChildReview[];materials:readonly ParentMaterial[]}>;

export type CollaborationLifecycle=Readonly<{open:boolean;epoch:number}>;

export type ParentCollaborationProjection=ParentCollaboration & Readonly<{lifecycle:CollaborationLifecycle;source:AssistantSource;current_decision_id:string|null;occupant:CollaborationProjection['occupant'];activity:readonly Readonly<{session_id:string;status:AssistantAttempt['status']|null;open:boolean}>[]}>;
