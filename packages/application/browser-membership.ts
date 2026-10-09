import {randomUUID} from 'node:crypto';
import type {BrowserMembershipReadback} from '../ports/browser-membership.ts';
import {membershipRecord as closed, membershipUuid} from '../product-core/member-analysis.ts';
import {taskHash} from '../product-core/member-task.ts';
import {desktopRuleFailure as fail} from '../product-core/xanthil-desktop-decision-case.ts';

/** Browser queries deliberately do not call the legacy mutating task read/reopen. */
export function createBrowserMembershipReadbackApplication(store: BrowserMembershipReadback) {
  return {
    read(task_id: string) { return store.readBrowserTask({task_id}); },
    receipt(task_id: string, command_id: string) { return store.readBrowserReceipt({task_id, command_id}); },
    stop(task_id: string, input: unknown) {
      const x = closed(input, ['version', 'command_id']);
      if (x.version !== '1.0' || !membershipUuid(x.command_id)) fail();
      return store.stopBrowserTask({task_id, command_id: x.command_id});
    },
  };
}

/** Composition-owned project and existing Applications; browser inputs carry no paths or provider capability. */
export function createBrowserMembershipWorkspaceApplication(deps:{store:import('../ports/browser-membership.ts').BrowserWorkspaceReadback;tasks:Pick<ReturnType<typeof import('./member-task.ts').createMembershipTaskApplication>,'createBrowser'|'openReview'|'saveReview'|'submitReview'>;sources:ReturnType<typeof import('./member-sources.ts').createMemberSourcesApplication>;project_id:string;models?:{policy:ReturnType<typeof import('./provider-settings.ts').createMembershipPolicyAccess>;application:ReturnType<typeof import('./member-model.ts').createMembershipModelApplication>;workflow?:ReturnType<typeof import('./member-model.ts').createMembershipWorkflow>}}):import('../ports/browser-membership.ts').BrowserWorkspaceCommands {
 return {
  stopWork(taskId){deps.models?.workflow?.stop(taskId);},
  async closeWork(){try{for(const task of await deps.store.listBrowserTasks(deps.project_id))if(!['closed','stopped','interrupted'].includes(task.status))await deps.store.stopBrowserTask({task_id:task.task_id,command_id:randomUUID()});}finally{deps.models?.workflow?.close();}},
  async modelPolicy(){if(!deps.models)fail('MODEL_POLICY_REQUIRED');return deps.models.policy.read();},
  async answer(taskId,input){if(!deps.models)fail('MODEL_POLICY_REQUIRED');if(!input||typeof input!=='object'||Reflect.get(input,'task_id')!==taskId)fail();const state=await deps.store.readBrowserTask({task_id:taskId});if(state.task.owner.project_id!==deps.project_id)fail('AUTHORITY_REQUIRED');const saved=await deps.models.application.answer(input);if(saved.created&&deps.models.workflow&&(await deps.models.policy.read()).available)deps.models.workflow.start({task_id:taskId,grant_id:saved.grant_id,source_set_id:saved.source_set_id});return {version:'1.0',kind:'clarification_saved',command_id:String(Reflect.get(input,'command_id')),task_id:taskId,grant_id:saved.grant_id,clarification_sha256:saved.clarification_sha256};},
  async authorizeModel(taskId,input){if(!deps.models)fail('MODEL_POLICY_REQUIRED');if(!input||typeof input!=='object'||Reflect.get(input,'task_id')!==taskId)fail();const state=await deps.store.readBrowserTask({task_id:taskId});if(state.task.owner.project_id!==deps.project_id)fail('AUTHORITY_REQUIRED');const grant=await deps.models.application.authorize(input);if(grant.created&&deps.models.workflow&&(await deps.models.policy.read()).available)deps.models.workflow.start({task_id:taskId,grant_id:grant.grant_id,source_set_id:Reflect.get(input,'source_set_id')});return {version:'1.0',kind:'model_authorized',command_id:String(Reflect.get(input,'command_id')),task_id:taskId,grant_id:grant.grant_id,epoch:grant.epoch};},
  async list(){return {tasks:await deps.store.listBrowserTasks(deps.project_id)};},
  command(id){return deps.store.readBrowserCommand(id);},
  async create(input){const x=closed(input,['version','command_id','question']);if(x.version!=='1.0'||!membershipUuid(x.command_id)||typeof x.question!=='string'||!x.question.trim()||x.question.length>2000)fail();const prior=await deps.store.readBrowserCommand(x.command_id);if(prior&&!['task_created','task_creation_pending'].includes(prior.kind))fail('COMMAND_CONFLICT');const task=await deps.tasks.createBrowser(x.question,x.command_id);return {task_id:task.task_id};},
  async review(taskId,operation,input){
   const keys=operation==='open'?[]:operation==='save'?['review_id','review_version','review_sha256','fields']:['review_id','review_version','review_sha256','outcome','confirmed'];
   const x=closed(input,['version','command_id','task_id','epoch',...keys]);if(x.version!=='1.0'||taskId!==x.task_id||!membershipUuid(taskId)||!membershipUuid(x.command_id)||!Number.isSafeInteger(x.epoch))fail();
   const input_sha256=taskHash(x),kind=operation==='open'?'browser_review_opened' as const:'browser_review_saved' as const,prior=await deps.store.readBrowserCommand(x.command_id);
   if(prior){if(!('task_id' in prior)||prior.task_id!==taskId)fail('COMMAND_CONFLICT');if(operation==='submit'){if(prior.kind!=='review_submitted'||prior.receipt.review_id!==x.review_id||prior.receipt.review_version!==x.review_version||prior.receipt.review_sha256!==x.review_sha256||prior.receipt.outcome!==x.outcome||x.confirmed!==true)fail('COMMAND_CONFLICT');}else if(prior.kind!==kind||prior.input_sha256!==input_sha256)fail('COMMAND_CONFLICT');return prior;}
   const state=await deps.store.readBrowserTask({task_id:taskId});if(state.task.owner.project_id!==deps.project_id||state.task.epoch!==x.epoch||['stopped','interrupted','closed'].includes(state.task.status))fail('AUTHORITY_REQUIRED');
   const context={command_id:x.command_id,input_sha256,epoch:Number(x.epoch),kind};
   if(operation==='open')await deps.tasks.openReview(taskId,context);
   else if(operation==='save'){if(!membershipUuid(x.review_id)||!Number.isSafeInteger(x.review_version)||typeof x.review_sha256!=='string')fail();await deps.tasks.saveReview(taskId,x.review_id,Number(x.review_version),x.review_sha256,x.fields,context);}
   else {if(!['analysis','more_evidence'].includes(String(x.outcome)))fail('FORBIDDEN');await deps.tasks.submitReview(taskId,{review_id:x.review_id,review_version:x.review_version,review_sha256:x.review_sha256,intent_id:x.command_id,outcome:x.outcome,confirmed:x.confirmed});}
   const result=await deps.store.readBrowserCommand(x.command_id);if(!result)fail('RESULT_PENDING');return result;
  },
  async select(taskId,input){const x=closed(input,['version','command_id','task_id','expected_row_version','epoch','sources']);if(x.version!=='1.0'||taskId!==x.task_id||!membershipUuid(taskId)||!membershipUuid(x.command_id)||!Number.isSafeInteger(x.epoch))fail();const state=await deps.store.readBrowserTask({task_id:taskId});if(state.task.owner.project_id!==deps.project_id||state.task.epoch!==x.epoch)fail('AUTHORITY_REQUIRED');const prior=await deps.store.readBrowserCommand(x.command_id);if(prior&&(prior.kind!=='sources_selected'||prior.task_id!==taskId))fail('COMMAND_CONFLICT');const {epoch,...selection}=x;void epoch;return deps.sources.select(selection,new AbortController().signal);},
 };
}
