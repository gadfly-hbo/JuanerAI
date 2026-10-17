import {createHash} from 'node:crypto';
import type {DecisionStore,DecisionEffectsGateway,DecisionCommand,DecisionWriteIntent} from '../ports/decision-platform.ts';
const hash=(command:DecisionCommand)=>createHash('sha256').update(JSON.stringify(command)).digest('hex');
/** Each user write owns one durable intent. Unknown replies are read back, never retried. */
export function createDecisionEffects(config:{store:DecisionStore;gateway:DecisionEffectsGateway;authorize(taskId:string,command:DecisionCommand):Promise<void>;now():string}){
 const {store,gateway}=config,active=new Set<string>();
 async function reconcile(id:string){
  const op=store.intent(id);if(!op?.effect)throw Error('DP_EFFECT_UNKNOWN');
  if(op.state==='confirmed')return op.result;
  const binding=store.binding(op.taskId);if(!binding?.pluginProjectId)throw Error('DP_EFFECT_UNKNOWN');
  const result=await gateway.confirm(binding.pluginProjectId,op.effect);
  if(result===null)throw Error('DP_EFFECT_UNKNOWN');store.settle(id,'confirmed',result);return result;
 }
 return {
  async write(operationId:string,taskId:string,input:DecisionCommand):Promise<unknown>{
   const command=structuredClone(input),requestSha256=hash(command),prior=store.intent(operationId);
   if(prior){if(prior.taskId!==taskId||prior.requestSha256!==requestSha256)throw Error('DP_OPERATION_CONFLICT');if(prior.state==='confirmed')return prior.result;throw Error('DP_EFFECT_UNKNOWN');}
   if(active.has(taskId)||store.pending(taskId).length)throw Error('DP_BUSY_OR_UNKNOWN');active.add(taskId);
   try{
    const binding=store.binding(taskId);if(!binding?.pluginProjectId)throw Error('DP_PROJECT_MISSING');
    await config.authorize(taskId,command);
    const state=await gateway.state(binding.pluginProjectId);if(state.active||state.unknown)throw Error('DP_BUSY_OR_UNKNOWN');
    const effect=await gateway.prepare(binding.pluginProjectId,command);
    const kind:DecisionWriteIntent['kind']=command.type==='manual'?'action':command.type.startsWith('task-')?'task':command.type as 'action'|'feedback'|'extract';
    const op:DecisionWriteIntent={id:operationId,taskId,kind,target:binding.pluginProjectId,effect,requestSha256,startedAt:config.now(),state:'pending',result:null};
    if(!store.begin(op).created)throw Error('DP_EFFECT_UNKNOWN');
    try{
     await config.authorize(taskId,command);
     const current=await gateway.state(binding.pluginProjectId);if(current.active||current.unknown)throw Error('DP_BUSY_OR_UNKNOWN');
     await gateway.execute(binding.pluginProjectId,effect);return await reconcile(operationId);
    }catch{if(store.intent(operationId)?.state!=='confirmed')store.settle(operationId,'unknown',null);throw Error('DP_EFFECT_UNKNOWN');}
   }finally{active.delete(taskId);}
  },
  async reconcile(operationId:string):Promise<unknown>{
   const op=store.intent(operationId);if(!op||active.has(op.taskId))throw Error('DP_BUSY_OR_UNKNOWN');active.add(op.taskId);
   try{return await reconcile(operationId);}finally{active.delete(op.taskId);}
  },
 };
}
