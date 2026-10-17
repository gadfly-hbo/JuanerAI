import type {DecisionCommand,DecisionEffect,DecisionEffectsGateway,DecisionStore} from '../../packages/ports/decision-platform.ts';
type Row=Record<string,unknown>;
const row=(v:unknown):Row=>{if(!v||typeof v!=='object'||Array.isArray(v))throw Error('DP_BOARD_INVALID');return v as Row;};
const uuid=(v:unknown)=>typeof v==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-[1-5][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(v);
const text=(v:unknown,required=false)=>typeof v==='string'&&v.length<=16000&&(!required||!!v.trim());
const level=(v:unknown)=>['high','medium','low'].includes(String(v));
function validate(c:DecisionCommand){
 const fail=()=>{throw Error('DP_COMMAND_INVALID');};
 if(!c||typeof c!=='object')fail();
 if(c.type==='action'){if(!uuid(c.id)||!['adopted','dismissed'].includes(c.status)||c.status==='dismissed'&&(!text(c.dismissedReason,true)||c.dismissedReason!.trim().length<2))fail();}
 else if(c.type==='manual'){if(!text(c.title,true)||!text(c.rationale,true)||!text(c.expectedImpact,true)||!level(c.priority)||!level(c.effort)||c.reportId!==null&&(!Number.isSafeInteger(c.reportId)||c.reportId<1))fail();
  if(c.scene!==undefined&&!['开业','日常','假日','大促'].includes(c.scene)||c.lifecycle!==undefined&&!['A获取','A激活','R培育','R复购','R裂变'].includes(c.lifecycle))fail();}
 else if(c.type==='task-create'||c.type==='task-update'){const f=c.fields;if(!uuid(c.type==='task-create'?c.actionId:c.id)||!f||!text(f.title,true)||![f.owner,f.dueDate,f.note].every(v=>text(v))||!['todo','doing','done'].includes(f.status)||!level(f.priority))fail();}
 else if(c.type==='feedback'){if(!uuid(c.id)||typeof c.adopted!=='boolean'||![c.outcome,c.metricDelta,c.review].every(v=>text(v))||!Number.isInteger(c.score)||c.score<1||c.score>5)fail();}
 else if(c.type==='extract'){if(!uuid(c.reportLinkId))fail();}else fail();
}
/** The board reader MUST be a read-only snapshot, not the plugin's scanning GET. */
export function createDecisionEffectsGateway(config:{store:DecisionStore;board(projectId:string):Promise<unknown>;request(path:string,method:'POST'|'PATCH',body:unknown):Promise<unknown>;state(projectId:string):Promise<{active:boolean;unknown:boolean}>}):DecisionEffectsGateway{
 async function board(projectId:string){
  if(!uuid(projectId))throw Error('DP_PROJECT_INVALID');const b=row(await config.board(projectId));
  if(row(b.project).id!==projectId||!Array.isArray(b.actionItems)||!Array.isArray(b.reports))throw Error('DP_BOARD_INVALID');
  const actions=b.actionItems.map(row),reports=b.reports.map(row),tasks=actions.flatMap(a=>{if(a.projectId!==projectId||!uuid(a.id)||!Array.isArray(a.tasks))throw Error('DP_BOARD_INVALID');return a.tasks.map(row).map(t=>{if(t.actionItemId!==a.id||!uuid(t.id))throw Error('DP_BOARD_INVALID');return t;});});
  return {actions,reports,tasks};
 }
 const matching=(actual:Row,expected:Row)=>Object.entries(expected).every(([k,v])=>actual[k]===v);
 const taskFields=(fields:Row)=>({...fields,title:String(fields.title).trim(),owner:String(fields.owner).trim()||null,dueDate:String(fields.dueDate).trim()||null});
 function report(projectId:string,c:Extract<DecisionCommand,{type:'extract'}>){const saved=config.store.report(c.reportLinkId),binding=saved&&config.store.binding(saved.link.source.taskId);if(!saved||binding?.pluginProjectId!==projectId||!saved.link.pluginReportId)throw Error('DP_SOURCE_INVALID');return saved.link;}
 return {
  state:config.state,
  async prepare(projectId,command){
   validate(command);const b=await board(projectId),c=command;
   if(c.type==='action'){const a=b.actions.find(a=>a.id===c.id);if(!a||a.status==='dismissed')throw Error('DP_ACTION_NOT_ALLOWED');}
   if(c.type==='task-create'){if(!b.actions.some(a=>a.id===c.actionId&&a.status==='adopted'))throw Error('DP_ADOPTION_REQUIRED');}
   if(c.type==='task-update'||c.type==='feedback'){if(!b.tasks.some(t=>t.id===c.id))throw Error('DP_TASK_NOT_OWNED');}
   if(c.type==='manual'&&c.reportId!==null&&!b.reports.some(r=>r.id===c.reportId))throw Error('DP_SOURCE_INVALID');
   let beforeIds=b.actions.map(a=>String(a.id));
   if(c.type==='task-create')beforeIds=b.tasks.map(t=>String(t.id));
   if(c.type==='extract'){const link=report(projectId,c),r=b.reports.find(r=>String(r.id)===link.pluginReportId);if(!r||r.filename!==link.physicalName)throw Error('DP_SOURCE_INVALID');beforeIds=[JSON.stringify(r)];}
   return {command:structuredClone(command),beforeIds};
  },
  async execute(projectId,effect){
   const c=effect.command;await this.prepare(projectId,c); // Membership/state semantics checked again immediately before mutation.
   if(c.type==='action')await config.request('/api/actions/'+c.id,'PATCH',{status:c.status,...(c.dismissedReason?{dismissedReason:c.dismissedReason.trim()}:{}),via:'board'});
   else if(c.type==='manual'){const {type,...fields}=c;await config.request('/api/actions','POST',{...fields,projectId});}
   else if(c.type==='task-create')await config.request('/api/actions/'+c.actionId+'/tasks','POST',c.fields);
   else if(c.type==='task-update')await config.request('/api/tasks/'+c.id,'PATCH',c.fields);
   else if(c.type==='feedback'){const {type,id,...fields}=c;await config.request('/api/tasks/'+id+'/feedback','POST',fields);}
   else {const link=report(projectId,c);await config.request('/api/projects/'+projectId+'/reports/extract','POST',{slug:link.physicalName.replace(/\.[^.]+$/,''),force:true});}
  },
  async confirm(projectId,effect):Promise<unknown|null>{
   const b=await board(projectId),c=effect.command;validate(c);let matches:Row[]=[];
   if(c.type==='action')matches=b.actions.filter(a=>a.id===c.id&&a.status===c.status&&(c.status!=='dismissed'||a.dismissedReason===c.dismissedReason?.trim()));
   else if(c.type==='manual'){const {type,...fields}=c;matches=b.actions.filter(a=>!effect.beforeIds.includes(String(a.id))&&a.sourceKind==='manual'&&matching(a,{...fields,title:c.title.trim(),rationale:c.rationale.trim(),expectedImpact:c.expectedImpact.trim()}));}
   else if(c.type==='task-create')matches=b.tasks.filter(t=>!effect.beforeIds.includes(String(t.id))&&t.actionItemId===c.actionId&&matching(t,taskFields(c.fields)));
   else if(c.type==='task-update')matches=b.tasks.filter(t=>t.id===c.id&&matching(t,taskFields(c.fields)));
   else if(c.type==='feedback'){const {type,id,...fields}=c;matches=b.tasks.filter(t=>t.id===id&&t.feedback&&matching(row(t.feedback),fields)).map(t=>row(t.feedback));}
   else {const link=report(projectId,c);matches=b.reports.filter(r=>String(r.id)===link.pluginReportId&&r.filename===link.physicalName&&['done','failed'].includes(String(r.status))&&!effect.beforeIds.includes(JSON.stringify(r)));}
   return matches.length===1?structuredClone(matches[0]):null;
  },
 };
}
