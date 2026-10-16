import {readJson} from './read-json.mjs';
const uuid=v=>typeof v==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(v);
const token=v=>typeof v==='string'&&/^[A-Za-z0-9_-]{1,128}$/.test(v);
const fail=()=>{throw Error('报告工作台连接尚未确认，请保留当前内容并重新打开。');};
export function reportStudioReturnTarget(value){
 if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).sort().join(',')!=='project_id,revision,task_id'||!uuid(value.project_id)||!uuid(value.task_id)||typeof value.revision!=='string'||!/^[1-9][0-9]{0,63}$/.test(value.revision))throw Error('原分析入口无效，没有打开其他项目或版本。');
 return {project_id:value.project_id,task_id:value.task_id,revision:value.revision};
}
export async function selectReportStudioReturnTask(raw,projectId,read){
 const target=reportStudioReturnTarget(raw);if(projectId!==target.project_id)throw Error('原分析项目不匹配，没有打开其他项目。');
 const task=await read(target.task_id);if(task?.identity?.task_id!==target.task_id)throw Error('原分析目标不可用，没有打开其他分析。');
 const selected=[task,...(Array.isArray(task.history)?task.history:[])].find(value=>value.identity?.revision===target.revision);
 if(!selected||!(selected.outcome||selected.conversation_outcome))throw Error('原分析版本暂不可用，没有改为其他版本。');return {...task,display_revision:target.revision};
}
function launch(value,associated){
 if(!value||typeof value.url!=='string')fail();let u;try{u=new URL(value.url);}catch{fail();}
 if(u.protocol!=='http:'||u.hostname!=='127.0.0.1'||!u.port||value.url.indexOf(u.origin+'/')!==0||u.username||u.password||u.pathname!=='/'||!/^#bootstrap=[a-f0-9]{64}$/.test(u.hash)||[...u.searchParams.keys()].some(k=>k!=='project')||u.searchParams.getAll('project').length>1)fail();
 if(associated&&(!value.association||!token(value.association.studio_project_id)||u.searchParams.get('project')!==value.association.studio_project_id))fail();
 return value;
}
export function createReportStudioBrowserClient({control,request=fetch}){
 const base=project=>{if(!uuid(project))fail();return '/v1/report-studio/projects/'+project;};
 const get=(path,message='报告记录暂不可读取，已有内容保留。')=>readJson(request,path,message);
 async function post(path,body){
   const key=control();if(!key)throw Error('本页目前只能查看，请先选择“在此页继续”。');
   const response=await request(path,{method:'POST',credentials:'same-origin',headers:{'content-type':'application/json','x-xanthil-control':key},body:JSON.stringify(body)});
   if(!response.ok){const error=await response.json().catch(()=>null);throw Error(error?.reason??'报告操作尚未确认，原内容保留；请查看已有记录后重试。');}return response.json();
 }
 const source=(task,revision)=>{if(!uuid(task)||typeof revision!=='string'||!/^[1-9][0-9]*$/.test(revision))fail();return '/tasks/'+task+'/revisions/'+revision;};
 return {
   status:()=>get('/v1/report-studio/status','无法核对内置报告模块，请重试。'),
   catalog:(project,task,revision)=>get(base(project)+source(task,revision)+'/catalog'),
   async open(project,task,revision,materials){source(task,revision);return launch(await post(base(project)+'/open',{task_id:task,revision,materials}),true);},
   async continueProject(project,id){if(!uuid(id))fail();return launch(await post(base(project)+'/associations/'+id+'/open',{}),true);},
   async independent(){return launch(await post('/v1/report-studio/independent',{}),false);},
   async deliveries(project,task){if(!uuid(task))fail();const rows=await get(base(project)+'/tasks/'+task+'/deliveries');if(!Array.isArray(rows))fail();return rows;},
   async copy(project,id){if(!uuid(id))fail();const response=await request(base(project)+'/deliveries/'+id+'/copy',{credentials:'same-origin',cache:'no-store'});if(!response.ok)throw Error('报告副本暂不可下载，已保存记录保留。');const name=/filename="(report-[0-9]+\.(?:pptx|html|pdf))"/.exec(response.headers.get('content-disposition')??'')?.[1];if(!name)fail();return {blob:await response.blob(),name};},
 };
}
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function renderReportStudioDeliveries(rows=[],currentRevision,unavailable=false){
 if(unavailable)return '<section class="analysis-card studio-reports" aria-label="关联报告"><h2>关联报告</h2><p class="fine">暂时无法读取关联报告，已有副本保留；请查看保存结果后重试。</p></section>';
 return `<section class="analysis-card studio-reports" aria-label="关联报告"><h2>关联报告</h2><p class="fine">Report Studio 内容可编辑；新增数字与解释未自动获得原分析核验。</p>${rows.length?rows.map(r=>`<article class="studio-report-row"><div><h3>报告 · 交付 ${esc(r.sequence)} · ${esc(String(r.format).toUpperCase())}</h3><p class="fine">来源分析版本 ${esc(r.source.revision)} · ${esc(r.created_at)}</p>${r.studio_project_state==='missing'?'<p class="fine">工作项目已删除；已关联稳定副本仍可下载。</p>':r.studio_project_state==='unknown'?'<p class="fine">暂不可核对工作项目；已保存副本保留。</p>':''}${r.warnings.map(w=>`<p class="fine">质检提示：${esc(w)}</p>`).join('')}</div><div class="card-actions"><button class="btn btn-sm" type="button" data-action="studio-report" data-studio-action="download" data-studio-delivery="${esc(r.delivery_id)}">下载副本</button><button class="btn btn-sm" type="button" data-action="studio-report" data-studio-action="detail" data-studio-delivery="${esc(r.delivery_id)}">交付详情</button><button class="btn btn-sm" type="button" data-action="studio-report" data-studio-action="continue" data-studio-delivery="${esc(r.delivery_id)}"${['missing','unknown'].includes(r.studio_project_state)?' disabled':''}>继续制作</button>${r.studio_project_state==='unknown'?'<button class="btn btn-sm" type="button" data-action="studio-report" data-studio-action="check">核对工作项目</button>':''}</div></article>`).join(''):'<p class="fine">尚无关联报告。可从“产品能力与插件”带入分析成果，制作后显式关联。</p>'}${rows.some(r=>r.source.revision!==currentRevision)?'<p class="fine">旧报告保留原分析版本。<button class="btn btn-sm" type="button" data-action="studio-report" data-studio-action="new-version">使用当前版本成果创建报告</button></p>':''}</section>`;
}
