import type {DecisionRecipient,DecisionStore,DecisionMaterialScope} from '../../packages/ports/decision-platform.ts';
export type RuntimeAdmission=Readonly<{kind:'model'|'publish';projectId:string;physicalName:string;sha256:string;bytes:number;teachSha256:string;recipients:readonly DecisionRecipient[]}>;
/** Memory-only grants; persisted report identity never restores external authority. */
export function createDecisionRuntimeAuthorization(store:DecisionStore){
 const permits=new Map<string,{allows(scope:DecisionMaterialScope):boolean}>();
 return {
  permit(linkId:string,permit:{allows(scope:DecisionMaterialScope):boolean}){if(!store.report(linkId))throw Error('DP_SOURCE_MISSING');permits.set(linkId,permit);},
  revoke(linkId:string){permits.delete(linkId);},
  async authorize(request:RuntimeAdmission):Promise<boolean>{
   try{
    if(!request||!['model','publish'].includes(request.kind))return false;
    const match=/^source-([a-f0-9-]{36})\.(md|pdf|pptx)$/.exec(request.physicalName);if(!match)return false;
    const saved=store.report(match[1]);if(!saved)return false;
    const {link}=saved,binding=store.binding(link.source.taskId),permit=permits.get(link.id);
    if(!permit||binding?.id!==link.bindingId||binding.pluginProjectId!==request.projectId
     ||link.physicalName!==request.physicalName||link.source.sha256!==request.sha256||link.source.bytes!==request.bytes
     ||store.pending(link.source.taskId).some(i=>i.state==='unknown'))return false;
    return permit.allows({report:link.source,teachSha256:request.teachSha256,recipients:request.recipients});
   }catch{return false;}
  },
 };
}
