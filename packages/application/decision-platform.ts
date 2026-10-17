import {createHash} from 'node:crypto';
import type {DecisionStore,DecisionPlatformGateway,SavedDecisionReport,DecisionReportLink,DecisionWriteIntent} from '../ports/decision-platform.ts';
export type DecisionWorkspaceConfig={projectId:string;store:DecisionStore;gateway:DecisionPlatformGateway;authorize(source:SavedDecisionReport,pluginProjectId:string|null):Promise<void>;prepareExtraction?(link:DecisionReportLink):Promise<void>;newId():string;now():string};
const hash=(value:string|Uint8Array)=>createHash('sha256').update(value).digest('hex');
const key=(s:SavedDecisionReport)=>JSON.stringify([s.projectId,s.taskId,s.sourceId,s.revision,s.format,s.filename,s.bytes,s.sha256]);
const uuid=(s:string)=>/^[a-f0-9]{8}-[a-f0-9]{4}-[1-5][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(s);
const fail=(code:string):never=>{throw Error(code);};
export function createDecisionWorkspace(config:DecisionWorkspaceConfig){
 const active=new Set<string>(),store=config.store,gateway=config.gateway;
 function unknown(id:string){if(store.intent(id)?.state!=='confirmed')store.settle(id,'unknown',null);}
 function intent(id:string,taskId:string,kind:DecisionWriteIntent['kind'],target:string,requestSha256:string):DecisionWriteIntent{return {id,taskId,kind,target,requestSha256,startedAt:config.now(),state:'pending',result:null};}
 async function confirmReport(operationId:string):Promise<DecisionReportLink>{
  const op=store.intent(operationId);if(!op||op.kind!=='upload')return fail('DP_EFFECT_UNKNOWN');
  const saved=store.report(op.target),binding=store.binding(op.taskId);
  if(!saved||!binding?.pluginProjectId||saved.link.bindingId!==binding.id||saved.link.source.projectId!==config.projectId)return fail('DP_EFFECT_UNKNOWN');
  const actual=await gateway.report(binding.pluginProjectId,saved.link.physicalName);
  if(!actual||actual.projectId!==binding.pluginProjectId||actual.physicalName!==saved.link.physicalName||actual.sha256!==saved.link.source.sha256||actual.bytes!==saved.content.length||! /^[1-9][0-9]*$/.test(actual.reportId))return fail('DP_EFFECT_UNKNOWN');
  store.linkReport(saved.link.id,actual.reportId);store.settle(op.id,'confirmed',{linkId:saved.link.id});return store.report(saved.link.id)!.link;
 }
 return {
  async send(input:{operationId:string;source:SavedDecisionReport;content:Uint8Array;title:string}):Promise<DecisionReportLink>{
   const source=structuredClone(input.source),content=new Uint8Array(input.content),operationId=input.operationId,title=input.title;
   if(!uuid(operationId)||!uuid(source.taskId)||source.projectId!==config.projectId||!['md','pdf','pptx'].includes(source.format)||!source.sourceId||!source.revision||!source.filename||/[\\/]/.test(source.filename)||content.length!==source.bytes||hash(content)!==source.sha256||!title?.trim())return fail('DP_SOURCE_CHANGED');
   const requestSha256=hash(key(source));const previous=store.intent(operationId);
   if(previous){
    if(previous.taskId!==source.taskId||previous.kind!=='upload'||previous.requestSha256!==requestSha256)return fail('DP_OPERATION_CONFLICT');
    if(previous.state!=='confirmed')return fail('DP_EFFECT_UNKNOWN');
    const saved=store.report(previous.target);if(!saved?.link.pluginReportId||key(saved.link.source)!==key(source))return fail('DP_EFFECT_UNKNOWN');return saved.link;
   }
   if(active.has(source.taskId)||store.pending(source.taskId).length)return fail('DP_BUSY_OR_UNKNOWN');
   const prior=store.reports(source.taskId).find(r=>key(r.source)===key(source));
   if(prior?.pluginReportId)return prior;
   active.add(source.taskId);
   try{
    let binding=store.binding(source.taskId);
    await config.authorize(source,binding?.pluginProjectId??null);
    if(store.pending(source.taskId).length)return fail('DP_BUSY_OR_UNKNOWN');
    if(!binding)binding=store.prepareBinding({id:config.newId(),taskId:source.taskId,marker:config.newId(),pluginProjectId:null});
    if(!binding.pluginProjectId){
     const op=intent(config.newId(),source.taskId,'project',binding.id,hash(JSON.stringify([title,binding.marker])));store.begin(op);
     try{
      const created=await gateway.createProject(title,binding.marker);const observed=await gateway.project(created.id);
      if(!uuid(created.id)||created.marker!==binding.marker||observed?.id!==created.id||observed.marker!==binding.marker)return fail('DP_EFFECT_UNKNOWN');
      store.bindProject(source.taskId,created.id);store.settle(op.id,'confirmed',{projectId:created.id});
     }catch{unknown(op.id);return fail('DP_EFFECT_UNKNOWN');}
     binding=store.binding(source.taskId)!;
    }
    await config.authorize(source,binding.pluginProjectId);
    const link=prior??{id:config.newId(),bindingId:binding.id,source,physicalName:'',pluginReportId:null};
    const savedLink=prior??{...link,physicalName:`source-${link.id}.${source.format}`};store.saveReport(savedLink,content);
    await config.prepareExtraction?.(savedLink);
    const op=intent(operationId,source.taskId,'upload',savedLink.id,requestSha256);const admitted=store.begin(op);
    if(!admitted.created)return fail('DP_EFFECT_UNKNOWN');
    try{await gateway.uploadReport(binding.pluginProjectId!,savedLink.physicalName,content);return await confirmReport(operationId);}
    catch{unknown(operationId);return fail('DP_EFFECT_UNKNOWN');}
   }finally{active.delete(source.taskId);}
  },
  async reconcileProject(operationId:string){const op=store.intent(operationId);if(!op||op.kind!=='project'||active.has(op.taskId))return fail('DP_EFFECT_UNKNOWN');const binding=store.binding(op.taskId);if(!binding||binding.id!==op.target)return fail('DP_EFFECT_UNKNOWN');const actual=await gateway.findProject?.(binding.marker);if(!actual||!uuid(actual.id)||actual.marker!==binding.marker)return fail('DP_EFFECT_UNKNOWN');store.bindProject(op.taskId,actual.id);store.settle(operationId,'confirmed',{projectId:actual.id});return store.binding(op.taskId);},
  async reconcile(operationId:string):Promise<DecisionReportLink>{
   const op=store.intent(operationId);if(!op||active.has(op.taskId))return fail('DP_BUSY_OR_UNKNOWN');
   active.add(op.taskId);try{return await confirmReport(operationId);}finally{active.delete(op.taskId);}
  },
 };
}
