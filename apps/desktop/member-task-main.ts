import type {createMembershipTaskApplication} from '../../packages/application/member-task.ts';
import type {DesktopSourcePair} from '../../packages/ports/xanthil-desktop-decision-case.ts';
import type {MembershipApi,MembershipRequest} from '../../packages/contracts/member-task.ts';
import {membershipRecord,membershipUuid} from '../../packages/product-core/member-analysis.ts';
import {desktopRuleFailure} from '../../packages/product-core/xanthil-desktop-decision-case.ts';
type App=ReturnType<typeof createMembershipTaskApplication>;
const fields:Record<string,string[]>={submit_review:['task_id','review_id','review_version','review_sha256','intent_id','outcome','confirmed'],open_review:['task_id'],save_review:['task_id','review_id','review_version','review_sha256','fields'],preview_periods:['task_id','periods'],apply_periods:['task_id','periods','preview_sha256','confirmed'],process_comment:['task_id','comment_id'],comment:['task_id','comment'],inspect_config:['task_id','config_id','config_version','config_sha256'],prepare_config:['task_id','config_id','config_version','config_sha256','issue_treatments'],list:[],create:['question','command_id'],read:['task_id'],select:['task_id'],inspect:['task_id','selection'],prepare:['task_id','selection','scenario','methods','issue_treatments'],authorize:['task_id','fingerprint','authority_confirmed','text_consent'],continue:['task_id'],stop:['task_id'],reply:['task_id','text','text_consent'],close:['task_id','confirmed']};
export function createMembershipTaskHandler(d:{senderPolicy(sender:unknown):boolean;getApplication():App|null;selectFiles():Promise<unknown|null>;readFiles(capability:unknown):Promise<unknown>}):MembershipApi['request'] extends (x:infer R)=>infer V?(sender:unknown,input:R)=>V:never{
 const selected=new Map<string,{app:App;capability:unknown}>();
 return async(sender,input)=>{try{
  if(!d.senderPolicy(sender))desktopRuleFailure('FORBIDDEN');
  const op=(input as {operation?:string})?.operation;if(!op||!Object.hasOwn(fields,op))desktopRuleFailure('INVALID_REQUEST');membershipRecord(input,['version','operation',...fields[op]]);if(input.version!=='1.0')desktopRuleFailure('INVALID_REQUEST');
  if('task_id'in input&&!membershipUuid(input.task_id))desktopRuleFailure('INVALID_REQUEST');
  const app=d.getApplication();if(!app)desktopRuleFailure('NOT_FOUND');const guard=()=>{if(app!==d.getApplication()||!d.senderPolicy(sender))desktopRuleFailure('INTERRUPTED');};
  if(input.operation==='list')return {ok:true,value:await app.list()};
  if(input.operation==='create'){if(typeof input.question!=='string'||!input.question.trim()||!membershipUuid(input.command_id))desktopRuleFailure('INVALID_REQUEST');return {ok:true,value:await app.create(input.question,input.command_id)};}
  const r=input as Exclude<MembershipRequest,{operation:'list'|'create'}>;await app.read(r.task_id);guard();
  if(r.operation==='select'){const capability=await d.selectFiles();guard();if(capability===null)desktopRuleFailure('CANCELLED');const files=await d.readFiles(capability);guard();const inspection=await app.inspect(r.task_id,files as DesktopSourcePair);selected.set(r.task_id,{app,capability});return {ok:true,value:{projection:await app.read(r.task_id),inspection}};}
  async function files(){const entry=selected.get(r.task_id);if(!entry||entry.app!==app)desktopRuleFailure('SOURCE_REQUIRED');const source=await d.readFiles(entry.capability);guard();return source;}
  switch(r.operation){
   case 'submit_review':return {ok:true,value:await app.submitReview(r.task_id,{review_id:r.review_id,review_version:r.review_version,review_sha256:r.review_sha256,intent_id:r.intent_id,outcome:r.outcome,confirmed:r.confirmed})};
   case 'open_review':return {ok:true,value:await app.openReview(r.task_id)};
   case 'save_review':return {ok:true,value:await app.saveReview(r.task_id,r.review_id,r.review_version,r.review_sha256,r.fields)};
   case 'preview_periods':return {ok:true,value:await app.previewPeriods(r.task_id,r.periods)};
   case 'apply_periods':return {ok:true,value:await app.applyPeriods(r.task_id,r.periods,r.preview_sha256,r.confirmed)};
   case 'process_comment':return {ok:true,value:await app.processComment(r.task_id,r.comment_id)};
   case 'comment':return {ok:true,value:await app.comment(r.task_id,r.comment)};
   case 'inspect_config':return {ok:true,value:{projection:await app.read(r.task_id),inspection:await app.inspectConfig(r.task_id,await files() as DesktopSourcePair,{config_id:r.config_id,config_version:r.config_version,config_sha256:r.config_sha256})}};
   case 'prepare_config':return {ok:true,value:await app.prepareConfig(r.task_id,await files() as DesktopSourcePair,{config_id:r.config_id,config_version:r.config_version,config_sha256:r.config_sha256},r.issue_treatments)};
   case 'read':return {ok:true,value:await app.read(r.task_id)};
   case 'inspect':return {ok:true,value:{projection:await app.read(r.task_id),inspection:await app.inspect(r.task_id,await files() as DesktopSourcePair,r.selection)}};
   case 'prepare':return {ok:true,value:await app.prepare(r.task_id,{source_files:await files() as DesktopSourcePair,selection:r.selection,scenario:r.scenario,methods:r.methods,issue_treatments:r.issue_treatments})};
   case 'authorize':return {ok:true,value:await app.authorize(r.task_id,{source_files:selected.get(r.task_id)?.app===app?await files():await app.authorizationSources(r.task_id),fingerprint:r.fingerprint,authority_confirmed:r.authority_confirmed,text_consent:r.text_consent})};
   case 'continue':return {ok:true,value:await app.continue(r.task_id)};
   case 'stop':return {ok:true,value:await app.stop(r.task_id)};
   case 'reply':return {ok:true,value:await app.reply(r.task_id,r.text,r.text_consent)};
   case 'close':if(r.confirmed!==true)desktopRuleFailure('AUTHORITY_REQUIRED');return {ok:true,value:await app.stop(r.task_id,'closed')};
  }
 }catch(error){const code=String((error as{code?:string}).code??'OPERATION_FAILED');return {ok:false,error:{code,message:code==='RESULT_PENDING'?'保存结果待核对，请重新打开项目核对；不要重复开始。':`未完成：${code}。已验证结果和累计用量保留。`}};}};
}
