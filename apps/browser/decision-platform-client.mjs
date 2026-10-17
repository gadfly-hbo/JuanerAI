import {readJson} from './read-json.mjs';
const uuid=v=>typeof v==='string'&&/^[a-f0-9-]{36}$/.test(v);
export function createDecisionBrowserClient({projectId,taskId,control,request=fetch}){
 if(!uuid(projectId)||!uuid(taskId))throw Error('原分析入口无效。');
 const base='/v1/decision-platform/projects/'+projectId+'/tasks/'+taskId;
 const pending=new Map();
 const get=tail=>readJson(request,base+'/'+tail,'暂不可读取看板；原报告和已有记录保留。');
 async function post(tail,body){const token=control();if(!token)throw Error('本页目前只能查看，请先选择“在此页继续”。');
  const response=await request(base+'/'+tail,{method:'POST',credentials:'same-origin',headers:{'content-type':'application/json','x-xanthil-control':token},body:JSON.stringify(body)});
  const value=await response.json();if(!response.ok)throw Error(value.reason??'原操作尚未核清，请核对回执；不要重复提交。');return value;
 }
 function once(tail,body){const key=JSON.stringify([tail,body]);let id=pending.get(key);if(!id){id=crypto.randomUUID();pending.set(key,id);}return post(tail,{...body,operationId:id}).then(value=>{pending.delete(key);return value;});}
 return {catalog:()=>get('catalog'),board:()=>get('board'),permission:selectionId=>post('permission',{selectionId}),grant:(selectionId,scope)=>post('grant',{selectionId,scope}),revoke:()=>post('revoke',{}),send:selectionId=>once('send',{selectionId}),write:command=>once('write',{command}),reconcile:operationId=>post('reconcile',{operationId})};
}

/** Exact source entry; a missing or changed copy must never select the first row. */
export function selectDecisionSource(rows,expected){
 const matches=rows.filter(r=>r.source.taskId===expected.taskId&&r.source.sourceId===expected.sourceId&&r.source.revision===expected.revision&&(!expected.sha256||r.source.sha256===expected.sha256));
 if(matches.length!==1)throw Error('这版已保存副本不可用或已变化；没有改选其他报告。');return matches[0];
}
export function decisionReturnSummary(snapshot,taskId,revision){
 const current=(snapshot?.reports??[]).filter(r=>r.source.taskId===taskId&&r.source.revision===revision);
 const pendingReports=current.filter(r=>r.pluginReportId===null).map(r=>({...r.source}));
 const reports=current.filter(r=>r.pluginReportId!==null).map(r=>{
  const tasks=(snapshot.view?.actionItems??[]).filter(a=>String(a.reportId)===r.pluginReportId).flatMap(a=>a.tasks??[]);
  return {...r.source,feedbackCount:new Set(tasks.filter(t=>t.feedback).map(t=>t.id)).size};
 });return {reports,pendingReports,unknown:!!snapshot?.state?.unknown||!!snapshot?.operations?.length,reportCount:reports.length,feedbackCount:reports.reduce((n,r)=>n+r.feedbackCount,0)};
}
export function decisionRecoveryGuidance(snapshot){
 if(!snapshot?.state.unknown)return null;
 if(snapshot.operations?.length)return '请核对原操作回执；未查明之前不重新提交。';
 return '请交由本机维护者核对项目 '+(snapshot.view?.project?.id??'当前项目')+' 的原运行账本及审计，提供下方精确报告来源。当前仅可核对运行状态或返回原分析；不释放未知预留，不清除记录，也不重新抽取。';
}
