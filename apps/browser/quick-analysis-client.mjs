
import {createResearchBrowserClient} from './deep-research-client.mjs';
import {createDecisionBrowserClient,selectDecisionSource,decisionReturnSummary} from './decision-platform-client.mjs';
import {createReportStudioBrowserClient,reportStudioReturnTarget,selectReportStudioReturnTask} from './report-studio-client.mjs';
import {readJson} from './read-json.mjs';
import {renderQuickAnalysisWorkbench,renderRevisionImpact} from './quick-analysis-workbench.mjs';
import {browserSourceFiles,createWorkspaceClient} from './client.mjs';

// Saved assembled reports keep their full facts in the existing report expansion.

const labels={waiting:'需要你补充说明',ready:'准备分析',running:'正在分析',unknown:'正在核对上次请求',stopped:'已停止',failed:'分析未完成，请查看执行记录',saved:'本轮成果已保存'};



const hasVisibleRecord=t=>!!t?.model_report;




function revisionView(old,next){
 const changes=[],add=(label,before,after)=>{if(JSON.stringify(before)!==JSON.stringify(after))changes.push({label,before:typeof before==='string'?before:JSON.stringify(before),after:typeof after==='string'?after:JSON.stringify(after)});};
 add('问题',old.question,next.question);const sources=t=>t.source.sources.map(s=>({name:s.display_name,sha256:s.sha256,sheets:s.sheets.map(sh=>({id:sh.sheet_id,name:sh.name}))}));add('所选资料 / 工作表',sources(old),sources(next));add('本次业务理解',old.requirement_draft?.content.text??'',next.requirement_draft?.content.text??'');add('表达模板',old.preferences?.prompt??'professional',next.preferences?.prompt??'professional');
 return {hasContent:hasVisibleRecord(old),revision:old.identity.revision,nextRevision:next.identity.revision,question:old.question,text:old.model_report?.text??'本版本尚未形成报告',changes,impacts:['旧版报告与后核验记录保留；不会把旧版资格沿用到新问题或资料。'],status:next.state==='unknown'?'本次效果尚未确认，不能重复执行。':next.model_report?'本版报告已保存；之前的版本仍可查看。':'本版尚无已保存报告。'};
}
function analysisTitle(task){return task.entry_mode==='requirements'?(task.history?.[0]?.question??task.question):task.question;}
const diagnosticLabels={COMPLETE:'模型运行已返回；成果保存另行确认',WAITING:'运行等待后续信息',QUOTA_EXCEEDED:'模型额度不足',RATE_LIMITED:'模型请求受到限流',MODEL_UNAVAILABLE:'模型服务不可用',NETWORK_UNCONFIRMED:'网络请求结果未确认',CREDENTIAL_INVALID:'模型认证失败',CONTEXT_LIMIT:'输入上下文超出准入范围',OUTPUT_INCOMPLETE:'模型输出未完整结束',REQUEST_REJECTED:'请求未被接受；具体原因以已确认记录为准',INVALID_RESULT:'返回结果未通过校验',SAFETY_BLOCKED:'请求受到安全限制',AUTHORITY_REQUIRED:'当前权限已变化',CONFIGURATION_CHANGED:'任务固定配置不匹配',CANCELLED:'运行已停止，迟到事实单独保留',SAVE_UNCONFIRMED:'执行记录或状态保存未确认',EFFECT_UNCONFIRMED:'工具效果未确认，保持 UNKNOWN',TOOL_DELIVERY_FAILED:'工具结果交付未完成',CAPABILITY_UNAVAILABLE:'所需能力或准入策略尚未核定',UNKNOWN:'运行原因或结果尚未确认'};
const fileFailureLabels={not_found:'获准资料不存在',not_directory:'获准资料位置不是目录',is_directory:'获准资料位置是目录',permission_denied:'当前资料读取权限不足',invalid:'资料读取参数无效',not_supported:'当前读取能力不支持',cancelled:'资料读取已取消',timeout:'资料读取已超时',limit_exceeded:'宿主资料读取限额已达到',unknown:'资料读取失败原因未确认'};
function diagnosticEvents(task,diagnostics){
 if(diagnostics===null)return [{summary:'运行诊断读回未确认；已有任务与成果保留，不能直接恢复或补填用量。'}];
 if(!diagnostics||diagnostics.task_id!==task.identity.task_id||diagnostics.revision!==task.identity.revision)return [];
 const events=[];if(diagnostics.last_run)events.push({summary:'最近已保存的运行记录：'+(diagnosticLabels[diagnostics.last_run.code]??diagnosticLabels.UNKNOWN)});
 if(diagnostics.last_run?.code==='COMPLETE'&&['failed','unknown'].includes(task.state))events.push({summary:'本次业务处理仍未完成；核验或保存阶段的具体原因尚未确认。模型返回不等于成果已保存。'});
 if(diagnostics.unconfirmed_effects)events.push({summary:'存在未确认的工具效果；保持 UNKNOWN，不能直接续跑。'});
 if(diagnostics.recording==='legacy')events.push({summary:'历史调用保持原记录；完整模型用量与物理状态未提供，不补填已知零。'});
 if(diagnostics.meter){const m=diagnostics.meter;events.push({summary:`累计计量：模型尝试 ${m.model_attempts}，工具 ${m.tool_calls}，已记录输入 ${m.recorded_input_tokens}，计量输出（含预留）${m.charged_output_tokens}，未确认输出预留 ${m.unconfirmed_output_tokens}。累计暂不封顶不等于免费。`});}
 const tokens=value=>value?.kind==='known'?value.value:value?.known_lower_bound!==undefined?'至少 '+value.known_lower_bound+'（完整用量未确认）':'未确认';
 const tools={read:'获准资料读取',write:'报告工作文件写入',edit:'工作文件局部编辑',bash:'获准核验执行'};
 for(const observation of diagnostics.observations??[]){if(observation.kind==='model')events.push({summary:`${observation.model.provider} · ${observation.model.name}${observation.reported_model?' · 服务报告模型 '+observation.reported_model:''} · ${diagnosticLabels[observation.code]??diagnosticLabels.UNKNOWN} · ${({not_sent:'未发出',response_received:'已收到响应',unknown:'物理状态未确认'})[observation.physical_state]??'物理状态未确认'} · 输入 ${tokens(observation.input_tokens)}，输出 ${tokens(observation.output_tokens)}${observation.after_stop?' · 停止后的确认事实，不发布或退款':''}`});else if(observation.kind==='admission')events.push({summary:`${tools[observation.name]??'本任务工具'} · ${({ready:'参数已准备，尚不代表执行或保存',rejected:'参数未通过，本次未执行',deferred:'同批操作延后，本次未执行'})[observation.status]??'参数准入尚未确认'}${observation.terminal?' · 纠错已停止，未再发起请求':''}`});else if(observation.kind==='tool')events.push({summary:`${tools[observation.name]??'本任务工具'} · ${({not_started:'本次未执行',started:'执行已开始，尚未结算',partial:'部分效果已发生',completed:'执行已确认',unknown:'效果未确认'})[observation.completion]??'效果未确认'} · ${({ready:'结果已返回',rejected:'输出超限，未交付',failed:'原生结果错误',pending:'交付未确认'})[observation.delivery]??'交付未确认'} ${observation.code?' · '+observation.code:''} · 已记录消耗 ${observation.resource_units}${observation.receipt_id?' · 已有技术回执保留':''}${observation.name==='read'&&(observation.file_failure_category!==undefined||observation.delivery==='failed')?' · '+(Object.hasOwn(fileFailureLabels,observation.file_failure_category)?fileFailureLabels[observation.file_failure_category]:fileFailureLabels.unknown):''}${observation.after_stop?' · 停止后的确认事实，不发布或退款':''}`});}
 return events;
}
function requirementMessages(task,conversation){
 const inputs=task.requirement_inputs??[],recorded=new Set(inputs.map(r=>r.command_id)),messages=inputs.flatMap(r=>{const reply=conversation.find(c=>c.command_id===r.command_id);return [...r.statements.map(text=>({role:'user',text})),...(reply?[{role:'assistant',text:reply.assistant.text}]:[])];});
 for(const c of conversation)if(!recorded.has(c.command_id))messages.push({role:'user',text:c.user.text},{role:'assistant',text:c.assistant.text});
 if(!messages.some(m=>m.role==='user'&&m.text===task.question))messages.unshift({role:'user',text:task.question});return messages;
}
export function openTaskView(task,diagnostics=undefined){
 if(task.display_revision&&task.display_revision!==task.identity.revision){const old=task.history?.find(t=>t.identity.revision===task.display_revision);if(hasVisibleRecord(old)){const current=openTaskView({...task,display_revision:undefined},diagnostics),view=openTaskView(old);return {...view,latestRevision:task.identity.revision,displayRevision:old.identity.revision,historical:true,status:'历史成果 · 最新版本 '+task.identity.revision+'：'+current.status,resumable:current.resumable,resumeLabel:current.resumeLabel,versions:current.versions};}}
 const saved=task.requirement_draft,requirementDraft=saved?.receipts?.at(-1)?.sequence===saved?.sequence&&saved?.sequence>0?structuredClone({revision:saved.revision,sequence:saved.sequence,content:saved.content,history:saved.history,conversation:saved.conversation??[],reviewed:!!task.requirement_reviews?.some(r=>r.revision===saved.revision&&r.scope_sha256===task.identity.scope_sha256),executed:task.requirement_execution?.revision===saved.revision&&task.requirement_execution?.scope_sha256===task.identity.scope_sha256,staleResult:!!task.requirement_execution&&task.requirement_execution.revision!==saved.revision}):null;
 const model=task.model_report,content=task.browser_report??null,text=content?.text??task.report_postprocessing?.editions?.at(-1)?.text??model?.text,choice=task.metric_asset_choice;
 const scope=task.source.sources.flatMap(s=>s.sheets.filter(sh=>sh.state==='visible').map(sh=>({label:'获准资料',value:s.display_name+' / '+sh.name})));
 return {operationActive:task.operation_active,stopping:task.pending_stop_epoch!=null,effectUnconfirmed:diagnostics?.unconfirmed_effects===true,content,metricAsset:choice?{id:choice.id,version:choice.version}:null,assetRevisionReady:!!choice&&task.state==='ready'&&!model&&!!task.history?.length,requirementDraft,taskState:task.state,latestRevision:task.identity.revision,displayRevision:task.identity.revision,historical:false,id:task.identity.task_id,title:analysisTitle(task),status:requirementDraft?.staleResult?'需求已调整；之前的报告保留':labels[task.state]??task.state,resumeLabel:'继续分析',messages:[...requirementMessages(task,requirementDraft?.conversation??[]),...(model?[{role:'assistant',text}]:[])],context:{summary:task.question,userText:task.question,sources:task.source.sources.flatMap(s=>s.sheets.filter(sh=>sh.state==='visible').map(sh=>({name:s.display_name+' / '+sh.name,headers:sh.rows[0]?.cells.map(c=>c.value)??[],rows:sh.full_data_rows??Math.max(0,sh.rows.length-1)}))),unknowns:[]},framework:requirementDraft?{scope,goal:task.question,method:'Pi 根据需求、企业资产和当前资料自主选择；执行事实与后核验资格分别记录',binding:scope.map(s=>s.value).join('、'),revision:task.identity.revision}:null,versions:(task.history??[]).map((old,i)=>revisionView(old,task.history[i+1]??task)),report:model?{state:'saved',revision:task.identity.revision,acknowledged:task.report_postprocessing?!!task.judgments?.some(j=>j.version==='1.1'&&j.content_sha256===content?.sha256&&j.review_sha256===content?.postprocessing?.review_sha256):!!task.judgments?.length,modelReport:true,verification:'not_performed',text:'已保存分析报告 · 未覆盖部分尚未核验；当前资格见数字后核验与审查\n\n'+text}:null,materials:task.source.sources.map(s=>({id:s.source_id,name:s.display_name,summary:s.sheets.map(sh=>sh.name+' · '+(sh.full_data_rows??Math.max(0,sh.rows.length-1))+'行').join('、'),previews:s.sheets.filter(sh=>sh.state==='visible').map(sh=>({name:sh.name,total:sh.full_data_rows??Math.max(0,sh.rows.length-1),headers:sh.rows[0]?.cells.map(c=>c.value)??[],rows:sh.rows.slice(1,11).map(r=>(sh.rows[0]?.cells??[]).map(h=>r.cells.find(c=>c.column===h.column)?.value??''))})),disclosure:'仅本任务选定资料；读取和外发仍须有效授权'+(s.document?'。'+s.document.limitations.join('；'):'')})),events:diagnosticEvents(task,diagnostics)};
}
/** Network writes retain one operation identity; refresh/read never dispatch. */
export function createQuickAnalysisClient({request=globalThis.fetch,control=null,storage=null,onPending=()=>{}}={}){
 const key='juanerai.open.pending.v1';let pending=null,discussionFailure=null;try{const x=JSON.parse(storage?.getItem(key)??'null');if(x&&/^[a-f0-9-]{36}$/.test(x.task_id))pending=x;}catch{}
 const remember=x=>{pending=x;try{x?storage?.setItem(key,JSON.stringify(x)):storage?.removeItem(key);}catch{}onPending();};
 const draftReceipt=(value,operation)=>value?.identity?.task_id===operation.task_id&&value.requirement_draft?.receipts?.some(r=>r.command_id===operation.command_id&&r.sequence===operation.expected_sequence+1);
 const discussionReceipt=(value,operation)=>draftReceipt(value,operation)&&value.requirement_draft?.conversation?.some(c=>c.command_id===operation.command_id&&c.sequence===operation.expected_sequence+1&&c.user?.classification==='USER_SAID'&&c.assistant?.classification==='MODEL_PROPOSAL'&&typeof c.assistant.text==='string');
 async function failure(response,fallback){try{const value=await response.json();if(typeof value?.reason==='string'&&value.reason.length<=500)return Error(value.reason);}catch{}return Error(fallback);}
 const read=path=>readJson(request,path,'暂时无法打开，资料和已有结果仍保留，请稍后重试。',{headers:{'x-xanthil-view':'browser-v1'}});
 async function reconcileDiscussion(task,operation){
  if(discussionReceipt(task,operation)){remember(null);return true;}
  const receipt=await read('/v1/open-analysis/'+operation.task_id+'/requirement-discussion-receipts/'+operation.command_id);
  if(receipt?.task_id!==operation.task_id||receipt.command_id!==operation.command_id||receipt.state!=='failed'||receipt.settled!==true)return false;
  discussionFailure=receipt;remember(null);return true;
 }

 
 const requirementActionReceipt=(task,operation)=>task?.identity?.task_id===operation.task_id&&[task,...(task.history??[])].some(t=>t.requirement_execution?.command_id===operation.command_id&&t.requirement_execution.revision===operation.expected_revision);
 async function requirementAction(id,kind,expected_revision,binding){if(!control||pending)throw Error('上次请求还没确认，请先查看保存结果。');const operation={task_id:id,command_id:crypto.randomUUID(),kind:'requirement-'+kind,expected_revision,...binding};remember(operation);const r=await request('/v1/open-analysis/'+id+'/requirement-'+kind,{method:'POST',credentials:'same-origin',headers:{'content-type':'application/json','x-xanthil-control':control,'x-xanthil-view':'browser-v1'},body:JSON.stringify({version:'2.0',command_id:operation.command_id,expected_revision,...binding,confirmed:true})});if(!r.ok){if(r.status===403)control=null;if(r.status<500)remember(null);throw await failure(r,'这次操作还没确认，请先查看保存结果。');}const value=await r.json();if(!requirementActionReceipt(value,operation))throw Error('这次操作还没确认，请查看保存结果，避免重复执行。');remember(null);return value;}
 const assetChoiceReceipt=(t,operation)=>t?.identity?.task_id===operation.task_id&&[t,...(t.history??[])].some(x=>x.revision_command_id===operation.command_id&&x.identity?.revision===String(Number(operation.expected_revision)+1)&&x.metric_asset_choice?.id===operation.id&&x.metric_asset_choice?.version===operation.asset_version);
 async function assetWrite(id,kind,fields){if(!control||pending)throw Error('上次请求还没确认，请先查看保存结果。');const command_id=crypto.randomUUID();remember({task_id:id,kind,...fields,command_id});const path=kind==='asset-project'?'/v1/open-analysis/metric-assets':'/v1/open-analysis/'+id+'/'+(kind==='asset-choice'?'metric-asset':'metric-asset-execute');const body=kind==='asset-project'?{...fields,command_id,confirmed:true}:{version:'1.0',...fields,...(kind==='asset-choice'?{command_id}:{}),confirmed:true};const r=await request(path,{method:'POST',credentials:'same-origin',headers:{'content-type':'application/json','x-xanthil-control':control,'x-xanthil-view':'browser-v1'},body:JSON.stringify(body)});if(!r.ok){if(r.status===403)control=null;if(r.status<500)remember(null);throw await failure(r,'操作尚未确认，请查看保存结果，避免重复提交。');}const value=await r.json();if(kind==='asset-project'){const receipt=await read('/v1/open-analysis/metric-assets/commands/'+command_id);if(receipt?.command_id!==command_id)throw Error('项目口径保存尚未确认，请读回。');}else if(kind==='asset-choice'&&!assetChoiceReceipt(value,{task_id:id,command_id,...fields})||kind==='asset-execute'&&(value.identity?.revision!==fields.expected_revision||value.state==='ready'))throw Error('本次版本操作尚未确认，请读回。');remember(null);return value;}
 
 return {reportContent:id=>read('/v1/open-analysis/'+id+'/report-content'),async contentCommand(id,sha,action,fields={}){if(!control||pending)throw Error('上次请求还没确认，请先查看保存结果。');const command_id=crypto.randomUUID();remember({task_id:id,command_id,kind:'report-content'});const r=await request('/v1/open-analysis/'+id+'/report-content',{method:'POST',credentials:'same-origin',headers:{'content-type':'application/json','x-xanthil-control':control},body:JSON.stringify({version:'1.0',command_id,expected_content_sha256:sha,action,...fields})});if(!r.ok){if(r.status===403)control=null;if(r.status<500)remember(null);throw await failure(r,'报告操作未保存或版本冲突；本地草稿保留，请查看保存结果。');}const value=await r.json();if(value?.saved!==true||value.command_id!==command_id)throw Error('报告保存结果尚未确认，请读回。');remember(null);return value;},async resolveReferences(id,references){if(!control||pending)throw Error('当前没有写入权限或上次请求未确认。');const r=await request('/v1/open-analysis/'+id+'/resolve-references',{method:'POST',credentials:'same-origin',headers:{'content-type':'application/json','x-xanthil-control':control},body:JSON.stringify(references.map(({kind,task_id,revision,scope_sha256,content_sha256,id,quote})=>({kind,task_id,revision,scope_sha256,content_sha256,id,quote})))});if(!r.ok){if(r.status===403)control=null;throw Error('引用来源、版本或权限已变化，请重新选择；尚未发送。');}return r.json();},metricAssets:()=>read('/v1/open-analysis/metric-assets'),assetCommand:(projectId,fields)=>assetWrite(projectId,'asset-project',fields),selectMetricAsset:(id,revision,asset)=>assetWrite(id,'asset-choice',{expected_revision:revision,id:asset.id,asset_version:asset.version}),executeMetricAsset:(id,revision)=>assetWrite(id,'asset-execute',{expected_revision:revision}),async importMetricAsset(projectId,pkg,registry){if(!control||pending)throw Error('上次请求还没确认，请先查看保存结果。');const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',Uint8Array.from(atob(pkg),c=>c.charCodeAt(0))))).map(x=>x.toString(16).padStart(2,'0')).join('');remember({task_id:projectId,kind:'asset-import',bytes_sha256:hash,release_required:!!registry});const r=await request('/v1/open-analysis/metric-assets',{method:'POST',credentials:'same-origin',headers:{'content-type':'application/json','x-xanthil-control':control},body:JSON.stringify({action:'import',package_base64:pkg,...(registry?{registry_base64:registry}:{})})});if(!r.ok){if(r.status===403)control=null;if(r.status<500)remember(null);throw await failure(r,'候选保存尚未确认，请读回本项目口径。');}const candidate=await r.json();if(candidate.asset?.bytes_sha256!==hash||registry&&!candidate.release_verified)throw Error('候选身份尚未确认，请读回。');remember(null);return candidate;},startRequirement:(id,revision,binding)=>requirementAction(id,'start',revision,binding),pending:()=>pending,canStop:()=>!!control,canWrite:()=>!!control&&!pending,setControl:value=>{control=value;},lastDiscussionFailure:()=>discussionFailure,list:async()=>{const tasks=await read('/v1/open-analysis');if(pending?.kind==='requirement-discussion'){const operation=pending,task=tasks.find(task=>task.identity.task_id===operation.task_id);if(task)await reconcileDiscussion(task,operation);}return tasks;},read:id=>read('/v1/open-analysis/'+id),judgmentTarget:id=>read('/v1/open-analysis/'+id+'/judgment-target'),methods:()=>read('/v1/open-analysis/methods'),diagnostics:id=>read('/v1/open-analysis/'+id+'/diagnostics'),
  async acknowledge(id,target,comment){if(!control||pending)throw Error('上次请求还没确认，请先查看保存结果。');const command_id=crypto.randomUUID();remember({task_id:id,command_id,kind:'judgment'});const r=await request('/v1/open-analysis/'+id+'/acknowledge',{method:'POST',credentials:'same-origin',headers:{'content-type':'application/json','x-xanthil-control':control,'x-xanthil-view':'browser-v1'},body:JSON.stringify({version:'1.0',command_id,...target,value:'acknowledged',comment})});if(!r.ok){if(r.status===403)control=null;remember(null);throw Error('认可未保存；请核对当前成果版本。');}const receipt=await r.json();if(!receipt.saved||receipt.command_id!==command_id)throw Error('正在确认是否保存认可，请先查看保存结果。');remember(null);return receipt;},
  
  
  async copy(id,revision,outcome_id){const r=await request('/v1/open-analysis/'+id+'/reports/'+revision+'/'+outcome_id+'/copy',{credentials:'same-origin',cache:'no-store',headers:{'x-xanthil-report-content':'1.0'}});if(!r.ok||!r.headers.get('content-type')?.startsWith('text/markdown'))throw Error('报告副本暂时无法下载，保存内容保留。');return {blob:await r.blob(),name:'JuanerAI-analysis-v'+revision+'.md'};},
  async submit(question,sources,preferences,entry_mode){if(!control||pending)throw Error('上次请求还没确认，请先查看保存结果。');const task_id=crypto.randomUUID();remember({task_id,kind:'initial'});const r=await request('/v1/open-analysis',{method:'POST',credentials:'same-origin',headers:{'content-type':'application/json','x-xanthil-control':control,'x-xanthil-view':'browser-v1'},body:JSON.stringify({version:'1.0',command_id:task_id,question,sources,confirmed:true,...(entry_mode?{mode:entry_mode}:{}),...(preferences?{preferences}:{})})});if(!r.ok){if(r.status===403)control=null;if(r.status<500)remember(null);throw await failure(r,'正在确认分析是否已开始，请先查看保存结果。');}const value=await r.json();remember(null);return value;},
  async discussRequirement(id,expected_sequence,message){if(!control||pending)throw Error('上次保存还没确认，请先查看保存结果。');discussionFailure=null;const operation={task_id:id,command_id:crypto.randomUUID(),kind:'requirement-discussion',expected_sequence};remember(operation);const r=await request('/v1/open-analysis/'+id+'/requirement-discussion',{method:'POST',credentials:'same-origin',headers:{'content-type':'application/json','x-xanthil-control':control,'x-xanthil-view':'browser-v1'},body:JSON.stringify({version:'1.0',command_id:operation.command_id,expected_sequence,message})});if(!r.ok){if(r.status===403)control=null;if(r.status<500)remember(null);throw await failure(r,'这次回复还没确认，输入内容还在，请先查看保存结果。');}const value=await r.json();if(discussionReceipt(value,operation)){remember(null);return value;}if(r.status===202&&value.identity?.task_id===id&&value.requirement_request?.accepted===true&&value.requirement_request.command_id===operation.command_id&&value.requirement_request.expected_sequence===expected_sequence)return value;throw Error('正在确认是否保存成功，请先查看保存结果。');},
  async addRequirementMaterials(id,expected_revision,sources){if(!control||pending)throw Error('上次保存还没确认，请先查看保存结果。');const operation={task_id:id,command_id:crypto.randomUUID(),kind:'requirement-materials',expected_revision};remember(operation);const r=await request('/v1/open-analysis/'+id+'/requirement-materials',{method:'POST',credentials:'same-origin',headers:{'content-type':'application/json','x-xanthil-control':control,'x-xanthil-view':'browser-v1'},body:JSON.stringify({version:'1.0',command_id:operation.command_id,expected_revision,sources})});if(!r.ok){if(r.status===403)control=null;if(r.status<500)remember(null);throw await failure(r,'正在确认资料是否保存成功，选定文件还在，请先查看保存结果。');}const task=await r.json();if(!task.requirement_materials?.some(r=>r.command_id===operation.command_id&&r.analysis_revision===String(Number(expected_revision)+1)))throw Error('正在确认资料是否保存成功，请先查看保存结果。');remember(null);return task;},
  async saveRequirementDraft(id,expected_sequence,content,message){if(!control||pending)throw Error('上次保存还没确认，请先查看保存结果。');const operation={task_id:id,command_id:crypto.randomUUID(),kind:'requirement-draft',expected_sequence};remember(operation);const r=await request('/v1/open-analysis/'+id+'/requirement-draft',{method:'POST',credentials:'same-origin',headers:{'content-type':'application/json','x-xanthil-control':control,'x-xanthil-view':'browser-v1'},body:JSON.stringify({version:'1.0',command_id:operation.command_id,expected_sequence,content,message})});if(!r.ok){if(r.status===403)control=null;if(r.status<500)remember(null);throw await failure(r,'这次没保存成功，编辑内容还在。请查看当前方案后重试。');}const value=await r.json();if(!draftReceipt(value,operation))throw Error('正在确认是否保存成功，请先查看保存结果。');remember(null);return value;},
  async sessionControl(id,expected_revision,command){if(!control)throw Error('请从本机入口打开后重试。');const r=await request('/v1/open-analysis/'+id+'/session-control',{method:'POST',credentials:'same-origin',headers:{'content-type':'application/json','x-xanthil-control':control},body:JSON.stringify({version:'1.0',expected_revision,command})});if(!r.ok)throw await failure(r,'暂时无法查看或调整当前对话，请查看保存结果。');return r.json();},
  async selectVersion(id,expected_revision,target_revision){if(!control||pending)throw Error('上次请求还没确认，请先查看保存结果。');const command_id=crypto.randomUUID();remember({task_id:id,command_id,kind:'version-choice'});const r=await request('/v1/open-analysis/'+id+'/select-version',{method:'POST',credentials:'same-origin',headers:{'content-type':'application/json','x-xanthil-control':control,'x-xanthil-view':'browser-v1'},body:JSON.stringify({version:'1.0',command_id,expected_revision,target_revision})});if(!r.ok){if(r.status===403)control=null;if(r.status<500)remember(null);throw Error('展示版本尚未确认，请读回当前保存结果。');}const value=await r.json();if(!value.version_choices?.some(c=>c.command_id===command_id&&c.target_revision===target_revision))throw Error('展示选择回执尚未确认。');remember(null);return value;},
  async recover(){if(!pending)return null;if(pending.kind==='report-content'){const receipt=await read('/v1/open-analysis/'+pending.task_id+'/report-content-receipts/'+pending.command_id);if(receipt?.saved!==true||receipt.command_id!==pending.command_id)throw Error('报告操作结果尚未确认，请继续读回，不能重复提交。');const task=await read('/v1/open-analysis/'+pending.task_id);remember(null);return task;}if(['asset-project','asset-import'].includes(pending.kind)){const catalog=await read('/v1/open-analysis/metric-assets');if(catalog.project_id!==pending.task_id)throw Error('请回到原项目核对口径保存。');if(pending.kind==='asset-project'){const receipt=await read('/v1/open-analysis/metric-assets/commands/'+pending.command_id);if(receipt?.command_id!==pending.command_id)throw Error('项目口径保存尚未确认，不能重复提交。');}else if(!catalog.candidates.some(c=>c.asset.bytes_sha256===pending.bytes_sha256&&(!pending.release_required||c.release_verified)))throw Error('候选保存尚未确认，请保留文件并继续读回。');remember(null);return null;}if(['asset-choice','asset-execute'].includes(pending.kind)){const t=await read('/v1/open-analysis/'+pending.task_id);if(pending.kind==='asset-choice'?!assetChoiceReceipt(t,pending):t.identity.revision!==pending.expected_revision||t.state==='ready')throw Error('任务版本操作尚未确认，不能重复执行。');remember(null);return t;}if(pending.kind==='requirement-materials'){const value=await read('/v1/open-analysis/'+pending.task_id);if(!value.requirement_materials?.some(r=>r.command_id===pending.command_id&&r.analysis_revision===String(Number(pending.expected_revision)+1)))throw Error('资料保存还没确认，请保留文件，不要重复提交。');remember(null);return value;}if(pending.kind==='requirement-start'){const value=await read('/v1/open-analysis/'+pending.task_id);if(!requirementActionReceipt(value,pending))throw Error('这次操作还没确认，请查看保存结果，避免重复执行。');remember(null);return value;}if(['requirement-draft','requirement-discussion'].includes(pending.kind)){const value=await read('/v1/open-analysis/'+pending.task_id);if(pending.kind==='requirement-discussion'){if(!await reconcileDiscussion(value,pending))throw Error('回复或保存结果尚未确认，输入仍保留；请继续读回，不会自动重发。');}else{if(!draftReceipt(value,pending))throw Error('正在确认是否保存成功，编辑内容还在，请不要重复提交。');remember(null);}return value;}if(pending.kind==='version-choice'){const value=await read('/v1/open-analysis/'+pending.task_id);if(!value.version_choices?.some(c=>c.command_id===pending.command_id))throw Error('展示选择尚未确认，不能重复提交。');remember(null);return value;}if(pending.kind==='initial'){const receipt=await read('/v1/open-analysis/'+pending.task_id+'/submission');if(receipt.command_id!==pending.task_id||receipt.version!=='1.0')throw Error('无法确认这次提交对应的任务，请先查看保存结果。');if(['stopped','failed'].includes(receipt.state)){remember(null);return null;}if(receipt.state!=='accepted')throw Error('资料读取或停止还没确认，请先查看保存结果，不要重复提交。');const task=await read('/v1/open-analysis/'+pending.task_id);remember(null);return task;}if(pending.kind==='judgment'){const receipt=await read('/v1/open-analysis/'+pending.task_id+'/judgments/'+pending.command_id);if(!receipt?.saved||receipt.command_id!==pending.command_id)throw Error('认可保存仍未确认；请继续核对，避免重复提交。');const task=await read('/v1/open-analysis/'+pending.task_id);remember(null);return task;}const value=await read('/v1/open-analysis/'+pending.task_id);if(pending.command_id&&value.revision_command_id!==pending.command_id&&!value.revision_commands?.includes(pending.command_id))throw Error('此次修改尚未确认；原版本和资料仍保留。');remember(null);return value;},
  async revise(id,expected_revision,question,preferences,sources){if(!control||pending)throw Error('上次请求还没确认，请先查看保存结果。');const command_id=crypto.randomUUID();remember({task_id:id,command_id});const r=await request('/v1/open-analysis/'+id+'/revise',{method:'POST',credentials:'same-origin',headers:{'content-type':'application/json','x-xanthil-control':control,'x-xanthil-view':'browser-v1'},body:JSON.stringify({version:'1.0',command_id,expected_revision,question,...(preferences?{preferences}:{}),...(sources?.length?{sources,confirmed:true}:{}),})});if(!r.ok){if(r.status===403)control=null;remember(null);throw await failure(r,'这次修改还没开始，请先查看当前任务和 AI 连接状态。');}const value=await r.json();remember(null);return value;},
  async resume(id){if(!control||pending)throw Error('上次请求还没确认，请先查看保存结果。');remember({task_id:id});const r=await request('/v1/open-analysis/'+id+'/resume',{method:'POST',credentials:'same-origin',headers:{'content-type':'application/json','x-xanthil-control':control,'x-xanthil-view':'browser-v1'},body:'{}'});if(!r.ok){if(r.status===403)control=null;remember(null);throw Error('暂时不能继续，请先查看上次请求和 AI 连接状态。');}const value=await r.json();remember(null);return value;},
  async stopInitial(){if(!control||pending?.kind!=='initial')throw Error('暂时无法停止这次提交，请先查看保存结果。');const id=pending.task_id,r=await request('/v1/open-analysis/'+id+'/stop-initial',{method:'POST',credentials:'same-origin',headers:{'content-type':'application/json','x-xanthil-control':control},body:'{}'});if(!r.ok)throw Error('停止尚未确认，请查看保存结果。');return r.json();},
  async stop(id){if(!control)throw Error('本页目前只能查看，请先选择“在此页继续”。');const r=await request('/v1/open-analysis/'+id+'/stop',{method:'POST',credentials:'same-origin',headers:{'content-type':'application/json','x-xanthil-control':control,'x-xanthil-view':'browser-v1'},body:'{}'});if(!r.ok)throw Error('正在确认是否停止，请查看当前任务状态。');return r.json();},
 };
}

export async function startQuickWorkspace({control,service,onProfessional,reportStudioReturn}={}){
 const root=document.getElementById('app'),transport=createWorkspaceClient({control}),client=createQuickAnalysisClient({control,storage:sessionStorage,onPending:()=>{void paint();}});
 const css=document.createElement('link');css.rel='stylesheet';css.href='/browser-workbench.css';document.head.append(css);
 const studioClient=createReportStudioBrowserClient({control:()=>control});
 let studioReports=[],studioProject=null;let decisionAvailable=false;try{const r=await fetch('/v1/decision-platform/status',{credentials:'same-origin'});decisionAvailable=r.ok&&(await r.json()).available===true;}catch{}
 async function refreshNativeSession(target,notify=false){
  const task=target.identity.task_id,revision=target.identity.revision;
  const result=await client.sessionControl(task,revision,{kind:'snapshot'});
  if(!selected||selected.identity.task_id!==task||selected.identity.revision!==revision)return;
  nativeSession=result.availability==='available'?{passiveFacts:{terminal:result.completed===true},operationId:result.busy?true:null,history:result.messages?.map(m=>({entryId:m.id,role:m.role,preview:m.text.slice(0,300)})),tipId:result.position,queued:result.pending?.map(e=>({entryId:e.id,kind:e.kind})),queueAvailable:result.pending!==undefined}:result.availability==='busy'?{availability:'busy',operationId:true,queueAvailable:false}:null;
  if(notify&&result.availability!=='available'&&result.availability!=='busy')notice=({busy:'运行事实仍在变化，尚未确认结束；没有恢复任务。',corrupt:'运行记录不完整，尚未确认；没有修复或恢复任务。',unavailable:'运行事实暂不可读，尚未确认；已有成果保留。'})[result.availability]??'运行事实尚未确认。';
 }
 let nativeSession=null;let projectReady=true;let preferences={prompt:'professional'},catalog=null;let mode='quick',stage='home';let tasks = [], selected = null, files = [], project = '本机项目', drawer = false, detail = 'context', expanded = null, draft = '', notice = '', writing = false, disposed = false, refreshVersion = 0, paintVersion = 0, selectionVersion = 0;
 let viewMode = 'conversation', resultMode = 'overview', references = [], reportDraft = null, reportBaseSha = null, reportParagraphId = null, uiTask = '__initial__';
 const uiDrafts=new Map(),readingPositions=new Map();let drawerOpener=null,projectId='local';
 try{for(const [id,value]of JSON.parse(sessionStorage.getItem('juanerai.browser.ui-drafts.v1')??'[]'))uiDrafts.set(id,value);}catch{}
 function rememberUI(){uiDrafts.set(uiTask,{draft,references,reportDraft,reportBaseSha,reportParagraphId,viewMode,resultMode,stage,files});try{sessionStorage.setItem('juanerai.browser.ui-drafts.v1',JSON.stringify([...uiDrafts].map(([id,{files,...value}])=>[id,value])));}catch{/* Local quota never claims business save. */}}
 function restoreUI(){const key=projectId+':'+(selected?.identity.task_id??'new');if(key===uiTask)return;uiTask=key;const saved=uiDrafts.get(key)??{};draft=saved.draft??'';references=saved.references??[];reportDraft=saved.reportDraft??null;reportBaseSha=saved.reportBaseSha??null;reportParagraphId=saved.reportParagraphId??null;viewMode=saved.viewMode??'conversation';resultMode=saved.resultMode??'overview';stage=saved.stage??(selected?'analysis':'home');files=saved.files??[];}
 const research=createResearchBrowserClient({control:()=>control,context:()=>selected?{projectId,taskId:selected.identity.task_id,title:analysisTitle(selected)}:null});
 const currentContent=()=>displayedTask(selected)?.browser_report??null;
 const editableParagraph=()=>currentContent()?.paragraphs.find(p=>p.id===reportParagraphId)??currentContent()?.paragraphs[0];
 function addReference(kind,id,quote,label){const t=displayedTask(selected),c=currentContent();if(!t||!c||!client.canWrite()||t.identity.revision!==selected.identity.revision)throw Error('请回到有权限的当前版本重新选择。');if(!quote.trim()||quote.length>1500)throw Error('每张引用卡最多1500字，请缩小到一个段落；不会截断发送。');if(references.length>=8)throw Error('本次最多8张引用卡，请先移除不需要的引用。');references.push({kind,id,quote,label,task_id:t.identity.task_id,revision:t.identity.revision,scope_sha256:t.identity.scope_sha256,content_sha256:c.sha256,at:new Date().toLocaleString()});rememberUI();}
 async function contentAction(action,fields={}){const t=selected,c=currentContent(),version=selectionVersion;if(!t||!c||t.display_revision&&t.display_revision!==t.identity.revision)throw Error('请回到当前报告版本。');writing=true;await paint();try{await client.contentCommand(t.identity.task_id,reportBaseSha&&action==='save'?reportBaseSha:c.sha256,action,fields);if(version!==selectionVersion)return;selected=await client.read(t.identity.task_id);if(action==='save'||action==='apply'){reportDraft=null;reportBaseSha=null;}notice=action==='confirm'?'这版报告内容确认已保存；不代表正式决定或行动。':action==='suggest'?'已请求表达建议，尚未应用。':'报告操作已保存。';await refresh();}catch(error){if(version===selectionVersion){selected=await client.read(t.identity.task_id).catch(()=>selected);await paint();}throw error;}finally{writing=false;await paint();}}
 // Layout preferences never issue product commands or include task data.
 const layoutKey='juanerai-workbench-layout-v1';
 const previewOpen=new Set();
 root.addEventListener('toggle',e=>{const d=e.target;if(!d.matches?.('[data-source-preview]')||!selected)return;const v=openTaskView(selected),key=v.id+':'+v.displayRevision+':'+d.dataset.sourcePreview;if(d.open)previewOpen.add(key);else previewOpen.delete(key);},true);
 let layout={};try{const saved=JSON.parse(localStorage.getItem(layoutKey)??'{}');if(saved&&typeof saved==='object'&&!Array.isArray(saved))layout=saved;}catch{}
 let sidebarCollapsed=layout.sidebarCollapsed===true||(globalThis.innerWidth??1440)<1024;
 for(const side of ['left','right'])if(Number.isFinite(layout[side]))root.style.setProperty('--pane-'+side,Math.max(side==='left'?160:240,Math.min(side==='left'?420:600,layout[side]))+'px');
 function resizePane(side,value){
  const app=root.querySelector('.app'),pane=root.querySelector(side==='left'?'.sidebar':'.drawer');if(!app||!pane)return;
  const overlay=getComputedStyle(root.querySelector('.drawer')).position==='absolute';
  const other=root.querySelector(side==='left'?'.drawer':'.sidebar');
  const occupied=overlay?0:(other.hidden?0:other.getBoundingClientRect().width);
  const max=side==='right'&&overlay?Math.min(600,app.clientWidth*.9):Math.min(side==='left'?420:600,app.clientWidth-occupied-(overlay?57:62)-380);
  const width=Math.round(Math.max(side==='left'?160:240,Math.min(max,value)));
  root.style.setProperty('--pane-'+side,width+'px');layout[side]=width;
  const divider=root.querySelector('[data-resize="'+side+'"]');divider?.setAttribute('aria-valuenow',String(width));
  try{localStorage.setItem(layoutKey,JSON.stringify(layout));}catch{}
 }
 root.addEventListener('pointerdown',e=>{
  const handle=e.target.closest('[data-resize]');if(!handle||e.button!==0)return;e.preventDefault();
  const side=handle.dataset.resize,start=e.clientX,pane=root.querySelector(side==='left'?'.sidebar':'.drawer'),width=pane.getBoundingClientRect().width;
  handle.setPointerCapture(e.pointerId);
  const move=m=>resizePane(side,width+(m.clientX-start)*(side==='left'?1:-1));
  const end=()=>{handle.removeEventListener('pointermove',move);handle.removeEventListener('pointerup',end);handle.removeEventListener('pointercancel',end);handle.removeEventListener('lostpointercapture',end);};
  handle.addEventListener('pointermove',move);handle.addEventListener('pointerup',end);handle.addEventListener('pointercancel',end);handle.addEventListener('lostpointercapture',end);
 });
 root.addEventListener('keydown',e=>{const handle=e.target.closest('[data-resize]');if(!handle||!['ArrowLeft','ArrowRight','Home'].includes(e.key))return;e.preventDefault();const side=handle.dataset.resize,pane=root.querySelector(side==='left'?'.sidebar':'.drawer');resizePane(side,e.key==='Home'?(side==='left'?220:310):pane.getBoundingClientRect().width+(e.key==='ArrowRight'?20:-20)*(side==='left'?1:-1));});
 let metricAssets=null,assetPackage=null,assetRegistry=null;
 const modal=document.createElement('dialog');document.body.append(modal);
 function displayedTask(task){return task?.display_revision&&task.display_revision!==task.identity.revision?task.history?.find(t=>t.identity.revision===task.display_revision)??task:task;}
 async function download(task){task=displayedTask(task);const result=task?.model_report;if(!result)throw Error('此版本尚无已保存报告。');const copy=await client.copy(task.identity.task_id,task.identity.revision,result.outcome_id),url=URL.createObjectURL(copy.blob),a=document.createElement('a');a.href=url;a.download=copy.name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);notice='下载已开始，请在浏览器下载列表中查看。';await paint();}
 let dialogTrigger=null;modal.addEventListener('close',()=>{if(dialogTrigger?.isConnected)dialogTrigger.focus();else root.querySelector('#main')?.focus();});
 function showDialog(title,build){if(!modal.open)dialogTrigger=document.activeElement;modal.replaceChildren();const section=document.createElement('section');section.className='dialog-inner';const h=document.createElement('h2');h.id='workspace-dialog-title';h.textContent=title;modal.setAttribute('aria-labelledby',h.id);section.append(h);build(section);const close=document.createElement('button');close.className='btn btn-sm';close.type='button';close.textContent='返回';close.onclick=()=>modal.close();section.append(close);modal.append(section);modal.showModal();}
 
 async function assetDecision(action,id,version,useForNewTasks=false){metricAssets=await client.metricAssets();const enableFuture=useForNewTasks||action==='approve'&&!metricAssets.current;showDialog(action==='revoke'?'撤销项目复用':useForNewTasks?'仅为以后新任务启用':'批准本项目复用',section=>{const p=document.createElement('p');p.textContent=id+' @ '+version+'；'+(action==='revoke'?'撤销后不再授予此版本的新读取或复用资格；历史报告保留。':enableFuture?'只改变以后新任务默认，当前任务与历史报告不变。':'只批准此精确版本已列的指标定义及分析方法供当前项目复用；尚未改变以后新任务默认。');const label=document.createElement('label'),owner=document.createElement('input');label.textContent='本项目维护者';owner.setAttribute('aria-label','本项目维护者');owner.maxLength=200;owner.value=metricAssets.current?.approval.owner??'';label.append(owner);const b=document.createElement('button');b.className='btn btn-primary btn-sm';b.textContent=action==='revoke'?'确认撤销':useForNewTasks?'仅为以后新任务启用':'批准本项目复用';b.disabled=!client.canWrite();b.onclick=()=>safe(async()=>{if(!owner.value.trim())throw Error('请明确本项目维护者。');b.disabled=true;await client.assetCommand(metricAssets.project_id,{action,id,version,owner:owner.value.trim(),...(action==='approve'?{use_for_new_tasks:enableFuture}:{})});metricAssets=await client.metricAssets();modal.close();notice='项目配置已保存；当前任务与历史报告保留。';await paint();});section.append(p,label,b);});}
 async function assetVersionDialog(){
  if(selected?.display_revision&&selected.display_revision!==selected.identity.revision)throw Error('请切回最新任务版本后查看口径差异。');
  const target=selected,version=selectionVersion;metricAssets=await client.metricAssets();
  showDialog('查看版本差异',section=>{
   const note=document.createElement('p');note.textContent='对照已批准版本中的指标定义、方法和适用条件。仅当前任务采用只保存真实资产选择和新修订，不改写你的问题；明确开始分析前不会执行，原报告仍可查看。';section.append(note);
   const approved=metricAssets.candidates.filter(c=>c.approved&&c.computability.usable);
   if(!approved.length){const empty=document.createElement('p');empty.textContent='当前没有可选择的已批准版本。';section.append(empty);}
   for(const c of approved){
    const row=document.createElement('section');row.className='card';const h=document.createElement('h3');h.textContent=c.asset.id+' @ '+c.asset.version;
    const definitions=document.createElement('details'),summary=document.createElement('summary');definitions.open=true;summary.textContent='指标定义、方法与适用条件';definitions.append(summary);
    for(const metric of c.asset.metrics){
     const title=document.createElement('h4');title.textContent=metric.display_name;const definition=document.createElement('p');definition.textContent=metric.definition;
     const switches=document.createElement('p'),values=Object.entries(metric.caliber_switches??{});switches.textContent=values.length?'该指标口径字段：'+values.map(([key,value])=>key+'：'+(value?'启用':'停用')).join('；'):'该指标未列口径开关。';definitions.append(title,definition,switches);
    }
    for(const scenario of c.asset.scenarios){const methods=document.createElement('p');methods.textContent='方法引用：'+(scenario.method_refs.join('、')||'未列出');const conditions=document.createElement('p');conditions.textContent='依据要求：'+scenario.evidence_requirements+'；输出要求：'+scenario.output_spec+'；审查条件：'+scenario.review_rules;definitions.append(methods,conditions);}
    const choose=document.createElement('button');choose.className='btn btn-sm';choose.textContent='仅当前任务采用';choose.disabled=!target||!client.canWrite()||['running','unknown'].includes(target.state);
    choose.onclick=()=>safe(async()=>{if(selectionVersion!==version)throw Error('当前任务已变化，请重新查看版本差异。');choose.disabled=true;if(await receiveTask(()=>client.selectMetricAsset(target.identity.task_id,target.identity.revision,c.asset),version)){modal.close();notice='口径已选择，尚未重新分析；项目默认不变。';await refresh();}});
    const future=document.createElement('button');future.className='btn btn-sm';future.textContent='仅为以后新任务启用';future.disabled=!client.canWrite();future.onclick=()=>safe(async()=>{modal.close();await assetDecision('approve',c.asset.id,c.asset.version,true);});
    row.append(h,definitions,choose,future);section.append(row);
   }
  });
 }

 function studioButton(label,run,disabled=false,primary=false){const b=document.createElement('button');b.type='button';b.className='btn btn-sm'+(primary?' btn-primary':'');b.textContent=label;b.disabled=disabled;b.onclick=()=>safe(run);return b;}
 function studioMessage(section,text){const p=document.createElement('p');p.className='fine';p.textContent=text;section.append(p);return p;}
 async function studioLaunch(read,name,label="Report Studio"){
   const tab=window.open('about:blank',name);let blank=false;try{blank=tab?.location.href==='about:blank';if(blank)tab.document.body.textContent='正在打开 '+label+'，请稍候；尚未开始模型制作。';}catch{}
   showDialog('正在打开 '+label,section=>{const p=studioMessage(section,'正在核对内置版本并等待本机服务就绪；不会自动开始制作。');p.setAttribute('role','status');});
   try{const result=await read();if(tab){tab.location.href=result.url;modal.close();}else showDialog('打开 '+label,section=>{studioMessage(section,'浏览器未打开新标签。项目已准备，使用下面的链接继续；不会重复生成。');const link=document.createElement('a');link.href=result.url;link.target='_blank';link.rel='noopener';link.textContent='打开 '+label;section.append(link);});}
   catch(error){if(blank)tab?.close();showDialog(label+' 尚未打开',section=>{const p=studioMessage(section,error.message+' 已有分析、报告和输入保留；从原入口重试会核对同一项目。');p.setAttribute('role','alert');section.append(studioButton('重试打开',()=>studioLaunch(read,name,label),!control));});}
 }
 async function reportStudioMaterials(target){
   if(!target)throw Error('当前没有已保存的分析成果，仍可打开报告工作台独立制作。');
   const identity=await client.metricAssets(),projectId=identity.project_id,taskId=target.identity.task_id,revision=target.identity.revision;
   const value=await studioClient.catalog(projectId,taskId,revision),name='juanerai-report-'+projectId+'-'+taskId+'-'+revision;
   if(value.association){await studioLaunch(()=>studioClient.continueProject(projectId,value.association.association_id),name);return;}
   showDialog('带入分析成果',section=>{
     studioMessage(section,value.catalog.title+' · 分析版本 '+revision);studioMessage(section,'只复制所选成果；来源说明、核验范围和限制随内容保留。不带入原始明细、完整会话或凭据。');
     const choices=[];for(const material of value.catalog.materials){const label=document.createElement('label'),check=document.createElement('input');check.type='checkbox';check.checked=true;label.className='studio-material-choice';label.append(check,document.createTextNode(material.label));section.append(label);const detail=document.createElement('details'),summary=document.createElement('summary');summary.textContent='来源、核验范围与材料预览';const pre=document.createElement('pre');pre.textContent=material.text;detail.append(summary,pre);studioMessage(detail,(material.classification==='MODEL_EXPLANATION'?'模型解释，未经新增核验':'保留原计算的适用核验范围')+'；'+material.limitations.join('；'));section.append(detail);choices.push({check,id:material.material_id});}
     const note=studioMessage(section,'材料先在本地保存。模型配置、可信本地模式接受及外发许可分别检查；打开页面不会自动授予这些权限。');note.id='studio-material-note';
     const error=studioMessage(section,'');error.id='studio-material-error';error.setAttribute('role','alert');
     const submit=studioButton('带入并打开 Report Studio',async()=>{const selected=choices.filter(c=>c.check.checked).map(c=>c.id);if(!selected.length){error.textContent='请至少选择一项成果，或返回后打开独立报告工作台。';choices[0]?.check.focus();return;}await studioLaunch(()=>studioClient.open(projectId,taskId,revision,selected),name);},!control,true);submit.setAttribute('aria-describedby',note.id+' '+error.id);section.append(submit);
   });
 }
 async function openDecisionBoard(target=displayedTask(selected),sourceEntry){
 if(!target?.identity)throw Error('请先选择已保存报告的任务。');
  const identity=await client.metricAssets(),returnSource={project_id:identity.project_id,task_id:target.identity.task_id,revision:target.identity.revision};
  const decisionClient=createDecisionBrowserClient({projectId:identity.project_id,taskId:target.identity.task_id,control:()=>control});
  const initialSelection=sourceEntry?selectDecisionSource(await decisionClient.catalog(),sourceEntry):undefined;
  const module=await import('./decision-platform/board.js');const destination=document.createElement('div');destination.id='decision-platform-root';
  const styles=[...document.querySelectorAll('link[rel="stylesheet"]')].map(el=>[el,el.disabled]);
  const sheets=['reference/styles/tokens.css','reference/index.css','reference/App.css','integration.css','host-theme.css'].map(name=>{const link=document.createElement('link');link.rel='stylesheet';link.href='/decision-platform/'+name;document.head.append(link);return link;});
  const prior=document.activeElement;modal.close();root.hidden=true;root.inert=true;styles.forEach(([el])=>{el.disabled=true;});document.body.append(destination);
  const dispose=module.mountDecisionBoard(destination,{client:decisionClient,initialSelection,title:analysisTitle(target),currentTask:target.identity.task_id,projects:tasks.map(t=>({id:t.identity.task_id,title:analysisTitle(t)})),onProject:id=>{const next=tasks.find(t=>t.identity.task_id===id);if(!next)return;dispose();destination.remove();sheets.forEach(el=>el.remove());styles.forEach(([el,disabled])=>{el.disabled=disabled;});root.hidden=false;root.inert=false;void openDecisionBoard(next).catch(error=>{notice=error.message;void paint();});},onReturn:async source=>{
   dispose();destination.remove();sheets.forEach(el=>el.remove());styles.forEach(([el,disabled])=>{el.disabled=disabled;});root.hidden=false;root.inert=false;
   const back=source?{project_id:source.projectId,task_id:source.taskId,revision:source.revision}:returnSource;
   try{selected=await selectReportStudioReturnTask(back,identity.project_id,id=>client.read(id));restoreUI();stage='report';viewMode='results';resultMode='report';await paint();prior?.isConnected&&prior.focus();}catch(error){notice=error.message;await paint();}
  }});
 }
 async function reportStudioPlugins(){
   const target=displayedTask(selected);showDialog('产品能力与插件',section=>{const p=studioMessage(section,'正在读取内置报告模块状态……');p.setAttribute('role','status');});
   let metricAvailable=false;try{const r=await fetch('/v1/metric-factory/status',{credentials:'same-origin'});metricAvailable=r.ok&&(await r.json()).available===true;}catch{}
   let decisionAvailable=false;try{const r=await fetch('/v1/decision-platform/status',{credentials:'same-origin'});decisionAvailable=r.ok&&(await r.json()).available===true;}catch{}
   let state,binding=null;try{state=await studioClient.status();if(state.state==='ready'&&target&&target.model_report){const identity=await client.metricAssets();binding=(await studioClient.catalog(identity.project_id,target.identity.task_id,target.identity.revision)).association;}}catch{state??={state:'unavailable',reason:'unreachable'};}
   showDialog('产品能力与插件',section=>{
     studioMessage(section,'数据分析工作台已可用，按需要打开扩展能力。');
     for(const [name,id]of [['数据采集','web-crawl'],['数据清洗','data-cleaning'],['数据挖掘／建模','model-mlflow']]){const p=studioMessage(section,name+' · '+id+' · 尚未接入');p.className='plugin-placeholder';}
     const row=document.createElement('section');row.className='studio-plugin-row';const title=document.createElement('h3');title.textContent='数据呈现 · Report Studio';row.append(title);studioMessage(row,'制作 PPT、HTML 与 PDF；固定版本随 JuanerAI 交付。');
     const ready=state.state==='ready',saved=!!target?.model_report,actions=document.createElement('div');actions.className='card-actions';actions.append(studioButton(binding?'继续制作':'使用当前分析成果',()=>reportStudioMaterials(target),!ready||!saved||!control,true),studioButton('打开报告工作台',()=>studioLaunch(()=>studioClient.independent(),'juanerai-report-independent'),!ready||!control));row.append(actions);
     if(!saved)studioMessage(row,'当前版本尚无可保存的分析成果；仍可打开报告工作台查看历史或新建独立报告。');
     if(!control)studioMessage(row,'本页只读。请先选择“在此页继续”后打开报告工作台。');
     if(!ready){studioMessage(row,({not_bundled:'本次 JuanerAI 尚未附带可运行的 Report Studio 资源；原分析仍可使用。',missing:'内置模块资源缺失，请修复 JuanerAI 安装。',invalid:'内置模块资源无效，请修复 JuanerAI 安装。',corrupt:'内置模块校验未通过，请修复 JuanerAI 安装。',incompatible:'内置模块与本版本不兼容，请修复 JuanerAI 安装。',unreachable:'暂时无法核对模块，请重试。'})[state.reason]??'内置模块暂不可用，请重试或修复安装。');row.append(studioButton('重新核对',reportStudioPlugins));}section.append(row);
     const decision=document.createElement('section');decision.className='studio-plugin-row';const heading=document.createElement('h3');heading.textContent='执行反馈 · 决策看板';decision.append(heading);studioMessage(decision,'从已保存报告进入完整看板，讨论建议、记录任务与反馈。');decision.append(studioButton('打开决策看板',()=>openDecisionBoard(),!decisionAvailable||!saved,true));if(!decisionAvailable)studioMessage(decision,'内置看板尚未配置；原报告及已有记录保留。');section.append(decision);
     const metric=document.createElement('section');metric.className='studio-plugin-row';const metricTitle=document.createElement('h3');metricTitle.textContent='分析体系 · Metric Factory';metric.append(metricTitle);studioMessage(metric,'设计、复核与发布分析体系；固定版本随 JuanerAI 交付。');metric.append(studioButton('打开分析体系工作台',()=>studioLaunch(async()=>{const response=await fetch('/v1/metric-factory/open',{method:'POST',credentials:'same-origin',headers:{'content-type':'application/json','x-xanthil-control':control},body:'{}'});if(!response.ok)throw Error('分析体系工作台暂不可用，请重试。');return response.json();},'juanerai-metric-factory','Metric Factory'),!metricAvailable||!control));if(!metricAvailable)studioMessage(metric,'内置分析体系资源尚未就绪；已有分析和设计保留。');section.append(metric);
   });
 }
 async function reportStudioReportAction(button){
   const action=button.dataset.studioAction;if(action==='new-version'){await reportStudioMaterials(displayedTask(selected));return;}
   if(action==='check'){await paint();return;}
   const saved=studioReports.find(r=>r.delivery_id===button.dataset.studioDelivery);if(!saved||!studioProject)throw Error('报告记录已变化，请查看保存结果。');const projectId=studioProject;
   if(action==='download'){const copy=await studioClient.copy(projectId,saved.delivery_id),url=URL.createObjectURL(copy.blob),a=document.createElement('a');a.href=url;a.download=copy.name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);notice='报告副本下载已开始，请在浏览器下载列表查看。';await paint();return;}
   if(action==='continue'){await studioLaunch(()=>studioClient.continueProject(projectId,saved.association_id),'juanerai-report-'+projectId+'-'+saved.source.task_id+'-'+saved.source.revision);return;}
   if(action==='detail')showDialog('关联报告详情',section=>{studioMessage(section,'交付 '+saved.sequence+' · '+saved.format.toUpperCase()+' · 来源分析版本 '+saved.source.revision);studioMessage(section,'制作时间：'+saved.created_at);studioMessage(section,'内容可经插件编辑，新增数字与解释未经原分析自动核验。');for(const warning of saved.warnings)studioMessage(section,'质检提示：'+warning);const details=document.createElement('details'),summary=document.createElement('summary');summary.textContent='文件校验信息';studioMessage(details,'SHA-256：'+saved.artifact_sha256+'；'+saved.bytes+' 字节');details.prepend(summary);section.append(details);});
 }
 async function safe(action){try{await action();}catch(e){notice=e.message;paint();}}
 async function receiveTask(read,version=selectionVersion){if(disposed||version!==selectionVersion)return false;const value=await read();if(disposed||version!==selectionVersion)return false;refreshVersion++;if(value!==null)selected=value;notice='';return true;}
 async function selectTask(id){nativeSession=null;const version=++selectionVersion;refreshVersion++;const value=await client.read(id);if(disposed||version!==selectionVersion)return;refreshVersion++;selected=value;if((globalThis.innerWidth??1440)<1024)sidebarCollapsed=true;preferences=selected.preferences??{prompt:'professional'};files=[];expanded=null;await paint();}
 async function refresh(){const previous=client.pending(),version=++refreshVersion,next=await client.list();if(disposed||version!==refreshVersion)return;tasks=next;if(previous?.kind==='requirement-discussion'&&!client.pending()){const reply=tasks.find(t=>t.identity.task_id===previous.task_id)?.requirement_draft?.conversation?.find(c=>c.command_id===previous.command_id);if(reply?.user.text===draft){draft='';references=[];rememberUI();}else if(client.lastDiscussionFailure()?.command_id===previous.command_id){notice='本次回复已结束但未保存（'+(client.lastDiscussionFailure().code??'FAILED')+'）；输入仍保留，可修改后明确发送。';}}if(selected){const fresh=tasks.find(t=>t.identity.task_id===selected.identity.task_id),revision=selected.display_revision;if(revision){const target=fresh&&[fresh,...(fresh.history??[])].find(t=>t.identity.revision===revision);if(hasVisibleRecord(target))selected={...fresh,display_revision:revision};else{selected=null;notice='所选原分析版本暂不可用，没有切换为其他版本。';}}else selected=fresh??selected;}if(selected&&!selected.display_revision)await refreshNativeSession(selected).catch(()=>{nativeSession=null;});await paint();}
 
 async function paint(){if(disposed)return;restoreUI();rememberUI();const version=++paintVersion;if(disposed||version!==paintVersion)return;const diagnostics=selected?await client.diagnostics(selected.identity.task_id).catch(()=>null):null;if(disposed||version!==paintVersion)return;const savedView=selected?openTaskView(selected,diagnostics):null;const view=savedView;if(view&&(expanded==='report'||viewMode==='results'&&resultMode==='report'||mode==='pro'&&['report','feedback'].includes(stage))){let rows=[],sourceProject=null,unavailable=false,moduleUnavailable=false;try{const status=await studioClient.status();if(status?.state==='unavailable')moduleUnavailable=true;else if(status?.state==='ready'){const identity=await client.metricAssets();sourceProject=identity.project_id;rows=await studioClient.deliveries(sourceProject,view.id);}else throw Error('Report Studio status unavailable');}catch{unavailable=true;}if(disposed||version!==paintVersion)return;studioReports=rows;studioProject=sourceProject;view.studioReports=rows;view.studioReportsUnavailable=unavailable;view.studioModuleUnavailable=moduleUnavailable;}if(view){view.decisionAvailable=decisionAvailable;if(decisionAvailable){try{const identity=await client.metricAssets();const decision=createDecisionBrowserClient({projectId:identity.project_id,taskId:view.id,control:()=>control});view.decisionSummary=decisionReturnSummary(await decision.board(),view.id,view.displayRevision);}catch{view.decisionUnavailable=true;}if(disposed||version!==paintVersion)return;}}const activeElement=document.activeElement,focus=activeElement?.id,range=activeElement?.selectionStart!==undefined?[activeElement.selectionStart,activeElement.selectionEnd]:null;const positionKey=uiTask+':'+mode+':'+stage+':'+viewMode+':'+resultMode;const previousKey=root.dataset.readingKey;for(const el of root.querySelectorAll('[data-scroll]'))if(previousKey)readingPositions.set(previousKey+':'+el.dataset.scroll,el.scrollTop);root.innerHTML=renderQuickAnalysisWorkbench({viewMode,resultMode,references,reportDraft,reportBaseSha,reportParagraphId,metricAssets,assetPackageName:assetPackage?.name,assetRegistryName:assetRegistry?.name,nativeSession,pendingRequirementMaterials:selected?.entry_mode==='requirements'?files.length:0,mode,stage,project,sidebarCollapsed,previewMaterials:view?view.materials.filter(m=>previewOpen.has(view.id+':'+view.displayRevision+':'+m.id)).map(m=>m.id):[],tasks:tasks.map(t=>({id:t.identity.task_id,title:analysisTitle(t),busy:t.state!=='unknown'&&t.report_postprocessing?.state!=='unknown'&&(t.operation_active===true||client.pending()?.task_id===t.identity.task_id)})),current:view,drawer,detail,expanded,draft,pending:writing||!!client.pending(),pendingOperation:client.pending(),nativeInputAvailable:!!control&&!writing&&!!nativeSession?.operationId&&!['stopped','unknown','failed'].includes(selected?.state),stoppable:client.canStop()&&!!(selected||client.pending()?.kind==='initial'),readonly:!client.canWrite(),accessReadonly:!control,notice,prompt:catalog?.prompts.find(s=>s.id===preferences.prompt)?.name,connection:'资料与成果保存在这台电脑'});research.decorate();root.dataset.readingKey=positionKey;for(const el of root.querySelectorAll('[data-scroll]'))el.scrollTop=readingPositions.get(positionKey+':'+el.dataset.scroll)??0;const focused=focus?document.getElementById(focus):null;if(focused&&root.contains(focused)){focused.focus({preventScroll:true});if(range&&focused.setSelectionRange)focused.setSelectionRange(...range);}if(drawer&&(globalThis.innerWidth??1440)<1280){root.querySelector('.main').inert=true;root.querySelector('.sidebar').inert=true;root.querySelector('.drawer-head button')?.focus({preventScroll:true});}else if(!sidebarCollapsed&&(globalThis.innerWidth??1440)<1024){root.querySelector('.main').inert=true;root.querySelector('.sidebar button')?.focus({preventScroll:true});}}
 
 async function selectProject(){const r=await fetch('/v1/projects',{credentials:'same-origin'});if(!r.ok)throw Error('暂时无法打开项目。');const data=await r.json();showDialog('项目',section=>{for(const p of data.projects){const b=document.createElement('button');b.className='btn';b.textContent=p.display_name;b.onclick=()=>safe(async()=>{await choose({project_id:p.project_id});project=p.display_name;modal.close();selected=null;await refresh();});section.append(b);}const name=document.createElement('input');name.placeholder='新项目名称';name.setAttribute('aria-label','新项目名称');const b=document.createElement('button');b.className='btn btn-primary';b.textContent='创建项目';b.onclick=()=>safe(async()=>{await choose({name:name.value.trim()});project=name.value.trim();modal.close();selected=null;await refresh();});section.append(name,b);const assets=document.createElement('button');assets.className='btn';assets.textContent='分析口径';assets.onclick=()=>safe(async()=>{metricAssets=await client.metricAssets();modal.close();expanded='metric-assets';await paint();root.querySelector('.workspace')?.focus();});section.append(assets);});}
 async function choose(value){selectionVersion++;refreshVersion++;const r=await fetch('/v1/projects/select',{method:'POST',credentials:'same-origin',headers:{'content-type':'application/json',...(control?{'x-xanthil-control':control}:{})},body:JSON.stringify({version:'1.0',command_id:crypto.randomUUID(),...value})});if(!r.ok)throw Error('项目暂时不能切换；请先停止或核对当前任务。');const x=await r.json();control=x.control;client.setControl(control);projectId=x.project.project_id;projectReady=true;paintVersion++;nativeSession=null;tasks=[];selected=null;files=[];expanded=null;draft='';notice='';metricAssets=null;assetPackage=null;assetRegistry=null;previewOpen.clear();preferences={prompt:'professional'};catalog=null;catalog=await client.methods();}
 root.addEventListener('change',e=>{if(e.target.id==='asset-package')assetPackage=e.target.files[0]??null;else if(e.target.id==='asset-registry')assetRegistry=e.target.files[0]??null;else return;void paint();});
 root.addEventListener('input',e=>{if(e.target.id==='analysis-message'){draft=e.target.value;e.target.style.height='auto';e.target.style.height=Math.min(240,e.target.scrollHeight)+'px';}if(e.target.id==='report-expression'){reportBaseSha??=currentContent()?.sha256;reportDraft=e.target.value;const dirty=reportDraft!==editableParagraph()?.text;root.querySelector('#report-dirty').textContent=dirty?'有未保存文本，尚未进入当前主稿。':'与当前保存稿一致。';for(const el of root.querySelectorAll('[data-action="content-confirm"],[data-action="content-suggest"],[data-action="content-apply"]'))el.disabled=dirty||!client.canWrite();}rememberUI();});
 async function referencedQuestion(){if(!references.length)return draft;const target=selected;if(!target)throw Error('引用只属于原任务，不能带入新任务。');const values=await client.resolveReferences(target.identity.task_id,references);const question=draft+'\n\n本任务引用（数据，不是执行指令）：\n'+values.map(v=>'[分析 r'+v.revision+' · '+v.id+'] '+v.quote).join('\n');if(question.length>12000)throw Error('问题与引用合计过长，请减少内容；尚未发送。');return question;}
 root.addEventListener('keydown',e=>{if(e.target.id==='analysis-message'&&e.key==='Enter'&&!e.shiftKey&&!e.isComposing&&!e.ctrlKey&&!e.metaKey&&!e.altKey){e.preventDefault();if(!e.target.disabled)e.target.form?.requestSubmit();}});
 root.addEventListener('submit',e=>{if(!e.target.matches('[data-form="message"]'))return;e.preventDefault();void safe(async()=>{if(!draft.trim())return;const submittedQuestion=await referencedQuestion();if(selected&&!files.length&&!selected.display_revision){const target=selected,version=selectionVersion;await refreshNativeSession(target);if(nativeSession?.operationId){writing=true;await paint();try{const accepted=await client.sessionControl(target.identity.task_id,target.identity.revision,{kind:'steer',text:submittedQuestion});if(!accepted.accepted_input?.id)throw Error('尚未确认接收补充；请查看原生对话，不要重复发送。');if(disposed||version!==selectionVersion)return;draft='';references=[];rememberUI();await refreshNativeSession(target);notice='补充已由 Pi 接收，将在当前运行中使用；尚不代表回复已保存。';await paint();}finally{writing=false;await paint();}return;}}if(selected?.entry_mode==='requirements'&&!selected.requirement_execution){let target=selected;const question=submittedQuestion,version=selectionVersion;writing=true;await paint();try{if(files.length){if(!await receiveTask(()=>client.addRequirementMaterials(target.identity.task_id,target.identity.revision,files),version))return;target=selected;files=[];}if(!await receiveTask(()=>client.discussRequirement(target.identity.task_id,target.requirement_draft?.sequence??0,question),version))return;if(!client.pending()){draft='';references=[];rememberUI();}expanded=null;await refresh();}finally{writing=false;await paint();}return;}if(selected&&!files.length){const target=selected,question=submittedQuestion,options=preferences,version=selectionVersion;writing=true;await paint();try{if(!await receiveTask(()=>client.revise(target.identity.task_id,target.identity.revision,question,options),version))return;draft='';references=[];rememberUI();expanded=null;await refresh();}finally{writing=false;await paint();}return;}const requirements=!selected;if(!selected)metricAssets=await client.metricAssets();showDialog(requirements?'共同理清需求':selected?'更新本次分析资料':'开始本次分析',section=>{const p=document.createElement('p');p.textContent=requirements?'将把你的问题、选定资料及获准项目资产按需提供给已连接的模型，一起理清分析需求。已有信息不会反复确认；对话回复保存后，由你选择开始分析。':(selected?'新增资料将纳入当前分析，旧版本及成果保留。':'')+(files.length?'将把你的问题和选定资料发送给已连接的模型，按当前可用能力形成分析。是否实际计算或完成核验，以本次记录和报告标注为准。':'将把你的问题发送给已连接的模型。还没添加资料，回复仅供参考，未进行数据核验。');const assetChoice=selected?.metric_asset_choice??(!selected?metricAssets?.current?.asset:null);if(assetChoice)p.textContent+=' 本次还将向该模型提供本项目批准的指标定义及方法／场景目录（'+assetChoice.id+' @ '+assetChoice.version+'），按需读取实际批准内容；方法引用不代表已取得完整正文。';const b=document.createElement('button');b.className='btn btn-primary';b.textContent=requirements?'同意并理清需求':'同意并开始分析';b.onclick=()=>safe(async()=>{const target=selected,question=submittedQuestion,options=preferences,sources=files,version=selectionVersion;modal.close();writing=true;await paint();try{if(!await receiveTask(()=>target?client.revise(target.identity.task_id,target.identity.revision,question,options,sources):client.submit(question,sources,options,requirements?'requirements':undefined),version))return;files=[];if(requirements){const created=selected;if(!await receiveTask(()=>client.discussRequirement(created.identity.task_id,created.requirement_draft?.sequence??0,question),version))return;}if(!client.pending()){draft='';references=[];rememberUI();}await refresh();}finally{writing=false;await paint();}});section.append(p,b);});});});
 root.addEventListener('keydown',e=>{const overlay=drawer&&(globalThis.innerWidth??1440)<1280?root.querySelector('.drawer'):!sidebarCollapsed&&(globalThis.innerWidth??1440)<1024?root.querySelector('.sidebar'):null;if(e.key==='Escape'&&(drawer||overlay)){e.preventDefault();if(drawer)root.querySelector('[data-action="drawer-close"]')?.click();else{sidebarCollapsed=true;void paint().then(()=>root.querySelector('[data-action="sidebar-toggle"]')?.focus());}}if(overlay&&e.key==='Tab'){const items=[...overlay.querySelectorAll('button:not(:disabled),input:not(:disabled),textarea:not(:disabled),select:not(:disabled),[tabindex="0"]')].filter(el=>el.getClientRects().length);const i=items.indexOf(document.activeElement);if(e.shiftKey&&i<=0){e.preventDefault();items.at(-1)?.focus();}else if(!e.shiftKey&&(i<0||i===items.length-1)){e.preventDefault();items[0]?.focus();}}});
 root.addEventListener('pointerdown',e=>{if(e.target.closest('[data-cite-selection]'))e.preventDefault();});
 root.addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b)
        return;
    const a = b.dataset.action;
    if (b.dataset.task || ['new', 'project'].includes(a))
        rememberUI();
    const handled = b.dataset.view || b.dataset.resultView || b.dataset.starter || b.dataset.referenceRemove !== undefined || b.dataset.referenceLocate !== undefined || b.dataset.citeParagraph || b.dataset.citeSelection || b.dataset.editParagraph || ['content-save', 'content-confirm', 'content-suggest', 'content-apply', 'content-discard', 'report-rebase', 'report-discard-draft', 'metric-assets', 'take-control', 'back', 'sidebar-close'].includes(a);
    if (a === 'drawer') {
        drawerOpener = 'drawer';
        if ((globalThis.innerWidth ?? 1440) < 1024)
            sidebarCollapsed = true;
    }
    if (a === 'sidebar-toggle' && (globalThis.innerWidth ?? 1440) < 1024)
        drawer = false;
    if (a === 'drawer-close') {
        e.stopImmediatePropagation();
        void safe(async () => { drawer = false; await paint(); root.querySelector('[data-action="' + (drawerOpener ?? 'drawer') + '"]')?.focus({ preventScroll: true }); });
        return;
    }
    if (!handled)
        return;
    e.preventDefault();
    e.stopImmediatePropagation();
    void safe(async () => {
        if (a === 'sidebar-close') {
            sidebarCollapsed = true;
            await paint();
            root.querySelector('[data-action="sidebar-toggle"]')?.focus({ preventScroll: true });
            return;
        }
        else if (a === 'back') {
            viewMode = 'conversation';
            expanded = null;
        }
        else if (b.dataset.view) {
            viewMode = b.dataset.view;
            expanded = null;
        }
        else if (b.dataset.resultView) {
            viewMode = 'results';
            resultMode = b.dataset.resultView;
            expanded = null;
        }
        else if (b.dataset.starter) {
            draft = b.dataset.starter === '会员复购' ? '我想分析会员复购的变化，先帮我明确分析对象、期间和需要的资料。' : '我想了解经营指标为什么发生变化，先从期间与分组对比开始。';
            rememberUI();
        }
        else if (a === 'metric-assets') {
            metricAssets = await client.metricAssets();
            expanded = 'metric-assets';
        }
        else if (a === 'take-control') {
            if (client.pending() && (client.pending().kind !== 'requirement-discussion' || client.pending().task_id !== selected?.identity.task_id))
                throw Error('先读回上次请求，避免重复提交。');
            control = await transport.takeControl();
            client.setControl(control);
            notice = '已在此页取得操作权；未恢复任何任务。';
        }
        else if (b.dataset.referenceRemove !== undefined) {
            references.splice(Number(b.dataset.referenceRemove), 1);
            rememberUI();
        }
        else if (b.dataset.referenceLocate !== undefined) {
            const ref = references[Number(b.dataset.referenceLocate)];
            if (ref.content_sha256 !== currentContent()?.sha256)
                throw Error('旧引用已过期，请在新版重新选择。');
            viewMode = 'results';
            resultMode = ref.kind === 'finding' ? 'data' : 'report';
            expanded = null;
            await paint();
            document.getElementById((ref.kind === 'finding' ? 'finding-' : 'paragraph-') + ref.id)?.scrollIntoView({ block: 'center' });
            return;
        }
        else if (b.dataset.citeParagraph || b.dataset.citeSelection) {
            const id = b.dataset.citeParagraph ?? b.dataset.citeSelection, p = currentContent()?.paragraphs.find(p => p.id === id);
            if (!p)
                throw Error('报告来源已变化，请先读回。');
            let text = p.text;
            if (b.dataset.citeSelection) {
                const selection = getSelection();
                if (!selection?.rangeCount || selection.isCollapsed)
                    throw Error('请先选择当前段文字，或使用“引用此段”。');
                const range = selection.getRangeAt(0), element = node => node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement, start = element(range.startContainer)?.closest('[data-report-paragraph]'), end = element(range.endContainer)?.closest('[data-report-paragraph]');
                if (start !== end || start?.dataset.reportParagraph !== id)
                    throw Error('只支持一个已保存段落内的选区，请分段引用。');
                text = selection.toString();
            }
            addReference('paragraph', id, text, '报告解释 · 内容 v' + currentContent().version);
        }
        else if (b.dataset.editParagraph) {
            if (reportDraft !== null && reportDraft !== editableParagraph()?.text)
                throw Error('请先保存或显式放弃当前段草稿。');
            reportParagraphId = b.dataset.editParagraph;
            reportDraft = null;
            reportBaseSha = null;
        }
        else if (a === 'report-rebase') {
            reportBaseSha = currentContent().sha256;
            notice = '本地草稿保留在编辑框，请核对新版后重新保存。';
        }
        else if (a === 'report-discard-draft') {
            reportDraft = null;
            reportBaseSha = null;
        }
        else if (a === 'content-save') {
            await contentAction('save', { text: currentContent().paragraphs.map(p => p.id === editableParagraph().id ? (reportDraft ?? p.text) : p.text).join('\n\n'), finding_ids: currentContent().finding_ids });
            return;
        }
        else if (a === 'content-confirm') {
            if (reportDraft !== null && reportDraft !== editableParagraph().text)
                throw Error('先保存或放弃未保存文本。');
            await contentAction('confirm');
            return;
        }
        else if (a === 'content-apply' || a === 'content-discard') {
            if (a === 'content-apply' && reportDraft !== null && reportDraft !== editableParagraph().text)
                throw Error('目标段已编辑，建议已过期；请放弃后重新请求。');
            await contentAction(a === 'content-apply' ? 'apply' : 'discard', { suggestion_id: currentContent().suggestion.id });
            return;
        }
        else if (a === 'content-suggest') {
            showDialog('请求段落表达建议', section => { const p = document.createElement('p'); p.textContent = '仅将当前已保存解释段和表达要求交给既有获准模型；不修改数字、事实、范围或证据。返回后需比较并明确应用。'; const label = document.createElement('label'); label.textContent = '表达要求'; const input = document.createElement('textarea'); input.setAttribute('aria-label', '表达要求'); input.maxLength = 1500; input.value = '更清楚、简洁地表达，保留原有判断限制。'; const send = document.createElement('button'); send.className = 'btn btn-primary'; send.textContent = '同意并请求建议'; send.onclick = () => safe(async () => { if (!input.value.trim())
                return; send.disabled = true; await contentAction('suggest', { instruction: input.value, paragraph_id: editableParagraph().id }); modal.close(); }); section.append(p, label, input, send); });
            return;
        }
        await paint();
        if (b.dataset.starter)
            root.querySelector('#analysis-message')?.focus();
    });
}, true);
 root.addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b || b.type === 'submit')
        return;
    void safe(async () => {
        if (b.dataset.action === 'plugins') {
            await reportStudioPlugins();
            return;
        }
        if (b.dataset.studioAction) {
            await reportStudioReportAction(b);
            return;
        }
        if (b.dataset.action === 'requirement-start') {
            if (!selected?.requirement_draft)
                throw Error('请先保存分析方案。');
            const target = selected, version = selectionVersion;
            writing = true;
            await paint();
            try {
                const action = client.startRequirement;
                if (!await receiveTask(() => action(target.identity.task_id, target.requirement_draft.revision, { expected_analysis_revision: target.identity.revision, scope_sha256: target.identity.scope_sha256 }), version))
                    return;
                notice = '当前理解已确认，分析已开始。';
                await refresh();
            }
            finally {
                writing = false;
                await paint();
            }
            return;
        }
        if (b.dataset.action === 'requirement-material-save') {
            if (!selected || !files.length)
                return;
            const target = selected, version = selectionVersion;
            writing = true;
            await paint();
            try {
                if (!await receiveTask(() => client.addRequirementMaterials(target.identity.task_id, target.identity.revision, files), version))
                    return;
                files = [];
                notice = '资料已保存。方案需要结合新资料再看一下。';
                await refresh();
            }
            finally {
                writing = false;
                await paint();
            }
            return;
        }
        if (b.dataset.action === 'requirement-save-only') {
            if (!selected?.requirement_draft)
                throw Error('请先整理并保存分析方案。');
            if (!await receiveTask(() => client.read(selected.identity.task_id)))
                return;
            notice = '方案已保存，下次可以接着聊。';
            await paint();
            return;
        }
        if (b.dataset.action === 'requirement-edit') {
            let target = selected;
            const version = selectionVersion;
            showDialog('写下你的想法', section => { const p = document.createElement('p'); p.textContent = '先写下你想解决的问题，也可以补充目标和已知限制。保存后，下次可以接着聊。'; const text = document.createElement('textarea'); text.rows = 6; text.maxLength = 12000; text.setAttribute('aria-label', '你的分析需求'); text.value = target?.requirement_draft?.content.text ?? draft; const save = document.createElement('button'); save.className = 'btn btn-primary btn-sm'; save.textContent = '保存，稍后继续'; save.onclick = () => safe(async () => { if (!text.value.trim())
                throw Error('请先写下你的需求。'); if (disposed || version !== selectionVersion)
                throw Error('当前任务已变化，请重新查看。'); save.disabled = true; const message = text.value; try {
                if (!target) {
                    if (!await receiveTask(() => client.submit(message, files, preferences, 'requirements'), version))
                        return;
                    target = selected;
                    files = [];
                }
                const current = target ?? selected, old = current.requirement_draft?.content, content = { version: '2.0', text: message };
                if (!await receiveTask(() => client.saveRequirementDraft(current.identity.task_id, current.requirement_draft?.sequence ?? 0, content, message), version))
                    return;
                draft = '';
                notice = '已保存，下次可以接着聊。';
                modal.close();
                expanded = 'requirement';
                await refresh();
            }
            finally {
                save.disabled = false;
            } }); section.append(p, text, save); });
            return;
        }
        if (b.dataset.action === 'sidebar-toggle') {
            sidebarCollapsed = !sidebarCollapsed;
            layout.sidebarCollapsed = sidebarCollapsed;
            try {
                localStorage.setItem(layoutKey, JSON.stringify(layout));
            }
            catch { }
            await paint();
            return;
        }
        if (b.dataset.action === 'analysis-home') {
            expanded = null;
            await paint();
            return;
        }
        if (b.dataset.action === 'plugins') {
            await reportStudioPlugins();
            return;
        }
        if (b.dataset.action === 'decision-delivery') {
            const delivery = studioReports.find(r => r.delivery_id === b.dataset.decisionDelivery);
            if (!delivery)
                throw Error('已保存交付不存在，请刷新后核对。');
            await openDecisionBoard(displayedTask(selected), { taskId: delivery.source.task_id, sourceId: delivery.delivery_id, revision: delivery.source.revision, sha256: delivery.artifact_sha256 });
            return;
        }
        if (b.dataset.action === 'decision-open') {
            await openDecisionBoard();
            return;
        }
        if (b.dataset.action === 'studio-report') {
            await reportStudioReportAction(b);
            return;
        }
        if (b.dataset.action === 'account') {
            showDialog('账户', section => { const p = document.createElement('p'); p.textContent = '账户入口已预留。当前为本机使用，尚未接入账户体系。'; section.append(p); });
            return;
        }
        if (b.dataset.action === 'settings') {
            showDialog('设置', section => { const p = document.createElement('p'); p.textContent = '界面布局保存在当前浏览器。'; const reset = document.createElement('button'); reset.className = 'btn btn-sm'; reset.textContent = '恢复默认布局'; reset.onclick = () => { layout = {}; sidebarCollapsed = false; root.style.removeProperty('--pane-left'); root.style.removeProperty('--pane-right'); try {
                localStorage.removeItem(layoutKey);
            }
            catch { } modal.close(); void safe(paint); }; section.append(p, reset); });
            return;
        }
        if (b.dataset.version && selected) {
            if (!await receiveTask(() => client.selectVersion(selected.identity.task_id, selected.identity.revision, b.dataset.version)))
                return;
            await refresh();
            return;
        }
        if (b.dataset.task) {
            await selectTask(b.dataset.task);
            return;
        }
        if (b.dataset.sessionCancel && selected) {
            await client.sessionControl(selected.identity.task_id, selected.identity.revision, { kind: 'cancelQueued', entryId: b.dataset.sessionCancel });
            await refreshNativeSession(selected);
            await paint();
            return;
        }
        if (b.dataset.action === 'session-refresh' && selected) {
            await refreshNativeSession(selected, true);
            await paint();
            return;
        }
        if ((b.dataset.sessionNavigate || b.dataset.action === 'session-fork') && selected) {
            const target = selected, version = selectionVersion;
            showDialog(b.dataset.sessionNavigate ? '选择继续位置' : '创建对话分支', section => { const p = document.createElement('p'); p.textContent = '只调整后续对话的位置，原分析结果保留。不会立即调用模型或重新计算；范围变化仍需修改方案。'; const button = document.createElement('button'); button.className = 'btn btn-primary btn-sm'; button.textContent = '确认'; button.onclick = () => safe(async () => { if (disposed || version !== selectionVersion)
                throw Error('当前任务已变化，请重新查看对话位置。'); button.disabled = true; const command = b.dataset.sessionNavigate ? { kind: 'navigate', entryId: b.dataset.sessionNavigate, summarize: false } : { kind: 'fork' }; await client.sessionControl(target.identity.task_id, target.identity.revision, command); await refreshNativeSession(target); modal.close(); notice = '后续对话位置已调整，原成果保留。'; await paint(); }); section.append(p, button); });
            return;
        }
        if (b.dataset.action === 'session-input' && selected) {
            const target = selected;
            showDialog('补充当前任务', section => { const p = document.createElement('p'); p.textContent = '补充当前分析的说明；改变资料或分析范围，请修改方案。下轮输入会先保存，等待你继续分析。'; const text = document.createElement('textarea'); text.maxLength = 12000; text.setAttribute('aria-label', '补充内容'); for (const [kind, label] of [['steer', '本轮补充'], ['nextRun', '留到下轮']]) {
                const button = document.createElement('button');
                button.className = 'btn btn-sm';
                button.textContent = label;
                button.onclick = () => safe(async () => { if (!text.value.trim())
                    return; button.disabled = true; try {
                    await client.sessionControl(target.identity.task_id, target.identity.revision, { kind, text: text.value.trim() });
                    modal.close();
                    await refreshNativeSession(target);
                    notice = '补充已由 Pi 接收；尚不代表回复已保存。';
                    await paint();
                }
                catch (error) {
                    notice = '正在确认补充是否保存，请查看运行状态，避免重复发送。';
                    modal.close();
                    await paint();
                    throw error;
                } });
                section.append(button);
            } section.prepend(p, text); });
            return;
        }
        if (b.dataset.detail) {
            detail = b.dataset.detail;
            drawer = true;
            await paint();
            return;
        }
        if (b.dataset.open) {
            expanded = b.dataset.open;
            await paint();
            return;
        }
        const a = b.dataset.action;
        if (b.dataset.mode) {
            mode = b.dataset.mode;
            await paint();
            return;
        }
        if (b.dataset.stage) {
            stage = b.dataset.stage;
            viewMode = 'conversation';
            expanded = null;
            await paint();
            return;
        }
        if (a === 'prepare-stage')
            stage = 'prepare';
        else if (a === 'more') {
            detail = 'more';
            drawer = true;
        }
        else if (a === 'drawer')
            drawer = !drawer;
        else if (a === 'drawer-close') {drawer=false;}
        else if (a === 'back')
            expanded = null;
        else if (a === 'new') {
            nativeSession = null;
            selectionVersion++;
            refreshVersion++;
            selected = null;
            files = [];
            notice = '';
            draft = '';
            
            expanded = null;
        }
        else if (a === 'read') {
            if (client.pending() && !await receiveTask(() => client.recover()))
                return;
            notice = '已查看最新保存结果。';
            await refresh();
            return;
        }
        else if (a === 'resume' && selected) {
            if (!await receiveTask(() => client.resume(selected.identity.task_id)))
                return;
            await refresh();
            return;
        }
        else if (a === 'stop') {
            if (client.pending()?.kind === 'initial') {
                await client.stopInitial();
                notice = '正在停止资料读取，请查看保存结果确认。';
                await paint();
                return;
            }
            if (selected) {
                if (!await receiveTask(() => client.stop(selected.identity.task_id)))
                    return;
                await refresh();
                return;
            }
        }
        else if (b.dataset.assetApprove) {
            await assetDecision('approve', b.dataset.assetApprove, b.dataset.assetVersion);
            return;
        }
        else if (b.dataset.assetRevoke) {
            await assetDecision('revoke', b.dataset.assetRevoke, b.dataset.assetVersion);
            return;
        }
        else if (a === 'asset-import') {
            if (!assetPackage)
                throw Error('请选择包文件；可另选登记文件核对正式发布。');
            const encode = async (file) => { if (file.size > 2 * 1024 * 1024)
                throw Error('发布文件超过安全读取上限。'); const bytes = new Uint8Array(await file.arrayBuffer()); let text = ''; for (const b of bytes)
                text += String.fromCharCode(b); return btoa(text); };
            metricAssets ??= await client.metricAssets();
            await client.importMetricAsset(metricAssets.project_id, await encode(assetPackage), assetRegistry ? await encode(assetRegistry) : undefined);
            metricAssets = await client.metricAssets();
            notice = '候选已检查并保存，尚未批准或计算。';
            await paint();
            return;
        }
        else if (a === 'asset-version') {
            await assetVersionDialog();
            return;
        }
        else if (a === 'asset-execute') {
            const target = selected, version = selectionVersion;
            showDialog('按此口径重新分析', section => { const p = document.createElement('p'); p.textContent = '本任务版本 ' + target.identity.revision + ' 将按已选择口径重新绑定资料、计算和核验。原报告保留；项目默认不变。'; const b = document.createElement('button'); b.className = 'btn btn-primary btn-sm'; b.textContent = '确认重新分析'; b.disabled = !client.canWrite(); b.onclick = () => safe(async () => { b.disabled = true; if (await receiveTask(() => client.executeMetricAsset(target.identity.task_id, target.identity.revision), version)) {
                modal.close();
                await refresh();
            } }); section.append(p, b); });
            return;
        }
        else if (a === 'project') {
            await selectProject();
            return;
        }
        else if (a === 'files') {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.csv,.xlsx,.md,.pdf,.docx,.doc,.pptx,.ppt,.png,.jpg,.jpeg';
            input.multiple = true;
            input.onchange = () => safe(async () => { files = await browserSourceFiles([...input.files]); notice = '已选定 ' + files.map(f => f.display_name).join('、'); await paint(); });
            input.click();
            return;
        }
        else if (a === 'download') {
            await download(selected);
            return;
        }
        else if (a === 'judgment') {
            if (selected?.display_revision && selected.display_revision !== selected.identity.revision)
                throw Error('当前为历史范围；请切回最新版本后认可分析。');
            if (!selected?.model_report)
                throw Error('请先形成可读回的成果。');
            const target = await client.judgmentTarget(selected.identity.task_id);
            if (target.expected_revision !== selected.identity.revision || target.outcome_id !== selected.model_report.outcome_id)
                throw Error('成果版本已变化，请先查看保存结果。');
            showDialog('认可当前分析', section => { const p = document.createElement('p'); p.textContent = '只记录你对版本 ' + target.expected_revision + ' 的认可。不会创建正式决定、预期或执行行动。'; const comment = document.createElement('textarea'); comment.maxLength = 12000; comment.setAttribute('aria-label', '分析意见（可选）'); const b = document.createElement('button'); b.className = 'btn btn-primary btn-sm'; b.textContent = '保存认可'; b.disabled = !client.canWrite(); b.onclick = () => safe(async () => { b.disabled = true; try {
                await client.acknowledge(selected.identity.task_id, target, comment.value);
                modal.close();
                notice = '当前版本的认可已保存。';
                await refresh();
            }
            finally {
                b.disabled = !client.canWrite();
            } }); section.append(p, comment, b); });
            return;
        }
        else if (a === 'report') {
            expanded = null;
            viewMode = 'results';
            resultMode = 'report';
        }
        else if (a==='prompt') {catalog??=await client.methods();showDialog('表达模板',section=>{for(const item of catalog.prompts){const button=document.createElement('button');button.type='button';button.className='btn';button.textContent=item.name;button.onclick=()=>safe(async()=>{preferences={prompt:item.id};modal.close();notice='已选择表达模板；不改变模型、工具权限或核验资格。';await paint();});section.append(button);}});return;}
        else if (a === 'search') {
            showDialog('搜索会话', section => { const q = document.createElement('input'); q.setAttribute('aria-label', '搜索会话'); const list = document.createElement('div'); const render = () => { list.replaceChildren(); for (const t of tasks.filter(t => t.question.includes(q.value))) {
                const b = document.createElement('button');
                b.className = 'btn';
                b.textContent = t.question;
                b.onclick = () => safe(async () => { modal.close(); await selectTask(t.identity.task_id); });
                list.append(b);
            } }; q.oninput = render; section.append(q, list); render(); });
            return;
        }
        else if (a) {
            notice = '该能力的生产接线尚在完成，已有资料与成果保留。';
        }
        await paint();
    });
});
 if(reportStudioReturn){
  projectReady=false;
  try{
   const target=reportStudioReturnTarget(reportStudioReturn);
   if(service){const response=await fetch('/v1/projects',{credentials:'same-origin'});if(!response.ok)throw Error('原分析项目暂不可读。');const data=await response.json(),original=data.projects.find(project=>project.project_id===target.project_id);if(!original)throw Error('原分析项目不可用。');if(data.current!==target.project_id)await choose({project_id:target.project_id});project=original.display_name;projectId=original.project_id;}
   const identity=await client.metricAssets();selected=await selectReportStudioReturnTask(target,identity.project_id,id=>client.read(id));preferences=selected.preferences??{prompt:'professional'};restoreUI();expanded=null;stage='report';viewMode='results';resultMode='report';rememberUI();projectReady=true;notice='已返回来源分析版本 '+target.revision+'；关联报告仍保留各自来源。';
  }catch(error){selected=null;tasks=[];projectReady=false;notice='返回原分析未完成：'+error.message+' 未改为其他项目或版本。';}
 }else if(service){const r=await fetch('/v1/projects',{credentials:'same-origin'});if(r.ok){const x=await r.json();const p=x.projects.find(p=>p.project_id===x.current);if(p){project=p.display_name;projectId=p.project_id;}else if(!x.projects.length){await choose({name:'我的分析'});project='我的分析';}else{projectReady=false;await selectProject();}}}
 if(projectReady&&!service){const identity=await client.metricAssets();projectId=identity.project_id;}
 if(projectReady){catalog??=await client.methods();await safe(refresh);}else await paint();if(!client.canWrite()&&!client.pending()){notice='本页目前只能查看。要操作，请选择“在此页继续”。';showDialog('继续本机分析',section=>{const b=document.createElement('button');b.className='btn btn-primary';b.textContent='在此页继续';b.onclick=()=>safe(async()=>{control=await transport.takeControl();client.setControl(control);modal.close();notice='';await paint();});section.append(b);});}
 let polling=false;
 // Capture transitions can report an unusable 0/1px viewport; keep panel intent until a usable measurement arrives.
 let viewportWidth=globalThis.innerWidth??1440;window.addEventListener('resize',()=>{const width=globalThis.innerWidth??1440;if(width<=1)return;if(viewportWidth>=1024&&width<1024){sidebarCollapsed=true;drawer=false;}viewportWidth=width;void paint();});
 const timer=setInterval(()=>{if(!polling&&(client.pending()?.kind==='requirement-discussion'||selected?.browser_report?.suggestion?.status==='generating'||tasks.some(t=>t.state==='running'||['checking','reviewing','revising','rechecking'].includes(t.report_postprocessing?.state))||selected?.state==='unknown'||['checking','reviewing','revising','rechecking'].includes(selected?.report_postprocessing?.state))){polling=true;void safe(refresh).finally(()=>{polling=false;});}},1500);window.addEventListener('pagehide',()=>{disposed=true;clearInterval(timer);},{once:true});
}
