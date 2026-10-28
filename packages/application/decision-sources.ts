import {createHash,randomUUID} from 'node:crypto';
import type {SavedDecisionReport} from '../ports/decision-platform.ts';
import type {OpenStoredTask} from '../ports/open-analysis-store.ts';
import type {ReportStudioDelivery} from '../ports/report-studio.ts';
export type DecisionSourceSelection={id:string;title:string;source:SavedDecisionReport;returnTo:{projectId:string;taskId:string;revision:string};classification:string};
export function createDecisionSources(config:{projectId:string;readTask(id:string):OpenStoredTask|null;reportCopy(id:string,revision:string,outcomeId:string):{bytes:Uint8Array;suggested_file_name:string};studio?:{deliveries(taskId:string):readonly ReportStudioDelivery[];copy(id:string):{record:ReportStudioDelivery;content:Uint8Array}}}){
 const selections=new Map<string,{selection:DecisionSourceSelection;content:Uint8Array}>();
 function add(taskId:string,title:string,sourceId:string,revision:string,format:'md'|'pdf'|'pptx',filename:string,bytes:Uint8Array,classification:string){
  const content=new Uint8Array(bytes),source:SavedDecisionReport={projectId:config.projectId,taskId,sourceId,revision,format,filename,bytes:content.length,sha256:createHash('sha256').update(content).digest('hex')};
  const prior=[...selections.values()].find(x=>JSON.stringify(x.selection.source)===JSON.stringify(source));if(prior)return prior.selection;
  const selection={id:randomUUID(),title,source,returnTo:{projectId:config.projectId,taskId,revision},classification};selections.set(selection.id,{selection,content});return selection;
 }
 return {
  catalog(taskId:string){
   const task=config.readTask(taskId);if(!task||task.identity.task_id!==taskId)throw Error('DP_SOURCE_MISSING');
   const rows:DecisionSourceSelection[]=[];
   for(const t of [task,...(task.history??[])]){
    const o=t.model_report;if(t.state!=='saved'||!o)continue;
    const copy=config.reportCopy(taskId,t.identity.revision,o.outcome_id);
    rows.push(add(taskId,t.question,o.outcome_id,t.identity.revision,'md',copy.suggested_file_name,copy.bytes,'保留原报告核验范围及限制；不构成正式决定'));
   }
   for(const delivery of config.studio?.deliveries(taskId)??[]){
    if(delivery.source.project_id!==config.projectId||delivery.source.task_id!==taskId||!['pdf','pptx'].includes(delivery.format))continue;
    const copy=config.studio!.copy(delivery.delivery_id);if(copy.record.delivery_id!==delivery.delivery_id||copy.record.artifact_sha256!==delivery.artifact_sha256||createHash('sha256').update(copy.content).digest('hex')!==delivery.artifact_sha256)throw Error('DP_SOURCE_CHANGED');
    rows.push(add(taskId,task.question,delivery.delivery_id,delivery.source.revision,delivery.format as 'pdf'|'pptx',`report-${delivery.sequence}.${delivery.format}`,copy.content,'Report Studio 已保存副本；新增表达未独立核验'));
   }
   return structuredClone(rows);
  },
  selected(id:string,taskId:string){const value=selections.get(id);if(!value||value.selection.source.taskId!==taskId||!config.readTask(taskId))throw Error('DP_SOURCE_MISSING');return {selection:structuredClone(value.selection),content:new Uint8Array(value.content)};},
 };
}
