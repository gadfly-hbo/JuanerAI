/** DR-002 seam: preserve the mounted host workspace; the fixed original UI owns research. */
export function createResearchBrowserClient({control,context}){
 const panels=new Map();let current=null;
 const css=document.createElement('link');css.rel='stylesheet';css.href='/deep-research.css';document.head.append(css);
 const request=async(path,body)=>{const r=await fetch(path,{credentials:'same-origin',method:body===undefined?'GET':'POST',headers:body===undefined?{}:{'content-type':'application/json','x-xanthil-control':control()},...(body===undefined?{}:{body:JSON.stringify(body)})});if(!r.ok)throw Error(r.status===503?'研究模块当前不可用，请重新打开或检查本次安装；已有副本保留。':'研究操作尚未确认，请查看当前状态后重试。');return r.json();};
 async function open(){
  const c=context();if(!c?.taskId)throw Error('先选择原任务，再打开深度研究。');
  const key=c.projectId+':'+c.taskId,base=`/v1/deep-research/projects/${c.projectId}/tasks/${c.taskId}`;const opener=document.activeElement;
  let panel=panels.get(key);
  if(!panel){
   const root=document.createElement('section');root.className='research-pane';root.hidden=true;root.setAttribute('aria-label','深度研究完整工作台');
   const header=document.createElement('header');header.className='research-return';
   const back=document.createElement('button');back.textContent='← 返回原任务';
   const title=document.createElement('strong');title.textContent=c.title;
   const status=document.createElement('span');status.setAttribute('role','status');
   const choose=document.createElement('select');choose.setAttribute('aria-label','已发布研究版本');
   const refresh=document.createElement('button');refresh.textContent='查询状态与版本';
   const reconnect=document.createElement('button');reconnect.textContent='重新打开研究';
   const save=document.createElement('button');save.textContent='保存所选版本到原任务';save.disabled=true;
   const copies=document.createElement('button');copies.textContent='查看研究副本';
   const frame=document.createElement('iframe');frame.title='深度研究 · '+c.title;frame.setAttribute('sandbox','allow-scripts allow-same-origin allow-downloads allow-modals allow-popups');
   header.append(back,title,choose,refresh,save,copies,reconnect,status);root.append(header,frame);document.body.append(root);
   let versions=[],saving=false;const operationKey='dr-save:'+key;let savedOperations={};try{savedOperations=JSON.parse(sessionStorage.getItem(operationKey)??'{}');}catch{}const operations=new Map(Object.entries(savedOperations));const persist=()=>{try{sessionStorage.setItem(operationKey,JSON.stringify(Object.fromEntries(operations)));}catch{throw Error('无法保留保存操作标识。请允许本页会话存储后重试；本次未发起保存。');}};
   const message=async action=>{try{await action();}catch(error){status.textContent=error.message;}};
   refresh.onclick=()=>message(async()=>{const state=await request(base+'/state');versions=await request(base+'/published');choose.replaceChildren();for(const [i,v]of versions.entries()){const option=document.createElement('option');option.value=String(i);option.textContent=`${v.title??v.projectId} · v${v.version}`;choose.append(option);}save.disabled=!versions.length||saving;status.textContent=state.unknown?'研究状态未知：新效果已阻断，不会自动恢复。已有版本与副本仍可读取。':versions.length?'请选择已发布版本；保存不会重新生成研究。':'尚无已发布版本。完成研究后请在发布页发布为版本。';});
   save.onclick=()=>message(async()=>{
    const v=versions[Number(choose.value)];if(!v||saving)return;saving=true;save.disabled=true;
    const selected={projectId:v.projectId,runId:v.runId,version:v.version};const identity=JSON.stringify(selected),commandId=operations.get(identity)??crypto.randomUUID();operations.set(identity,commandId);
    try{persist();const old=await request(base+'/receipts/'+commandId);const receipt=old??await request(base+'/save',{commandId,...selected});status.textContent=`已保存 v${receipt.version} · ${receipt.limitations.length?'有限交付，限制随副本保留':'限制见成果记录'} · ${receipt.bytes} 字节`;operations.delete(identity);persist();const entry=document.querySelector('[data-deep-research]');if(entry?.dataset.researchTask===key&&context()?.projectId+':'+context()?.taskId===key){entry.textContent=`深度研究 · 已保存 v${receipt.version}${receipt.limitations.length?' · 有限交付':''}`;}}
    catch{status.textContent='保存回复尚未确认。再次点击会先查询同一操作，不重新研究或发布。';}
    finally{saving=false;save.disabled=!versions.length;}
   });
   copies.onclick=()=>message(async()=>{const rows=await request(base+'/copies');const dialog=document.createElement('dialog');dialog.className='research-copy';const h=document.createElement('h2');h.textContent='已保存研究副本';dialog.append(h);for(const row of rows){const p=document.createElement('p');p.textContent=`v${row.version} · ${row.copiedAt} · ${row.limitations.join('；')||'没有额外记录的限制'} · 未决：${row.unresolved.join('；')||'无记录'}`;const a=document.createElement('a');a.href=base+'/copies/'+row.id;a.download=`research-v${row.version}.zip`;a.textContent='下载固定副本';dialog.append(p,a);}if(!rows.length)dialog.append('还没有已保存副本。');const close=document.createElement('button');close.textContent='关闭';close.onclick=()=>dialog.close();dialog.append(close);dialog.onclose=()=>dialog.remove();document.body.append(dialog);dialog.showModal();});
   panel={root,frame,status,back,base,copies};reconnect.onclick=()=>{void connect(panel);};panels.set(key,panel);
  }
  current=panel;document.getElementById('app').inert=true;panel.root.hidden=false;
  panel.back.onclick=()=>{panel.root.hidden=true;document.getElementById('app').inert=false;current=null;if(opener?.isConnected)opener.focus();else document.querySelector('[data-deep-research]')?.focus();};panel.back.focus();
  if(!panel.frame.src||panel.control!==control())await connect(panel);
 }
 async function connect(panel){panel.control=control();panel.status.textContent='正在打开研究工作台……';try{const {url}=await request(panel.base+'/open',{});if(!/^http:\/\/127\.0\.0\.1:[1-9][0-9]*\/#[-a-f0-9]{64}$/.test(url))throw Error('研究入口校验未通过。');const next=panel.frame.cloneNode(false);next.src=url;panel.frame.replaceWith(next);panel.frame=next;const state=await request(panel.base+'/state');panel.status.textContent=state.unknown?'研究状态未知：新效果已阻断，不会自动恢复；已有内容可读。':'返回原任务不会取消研究；真实调用仍需有效授权。';}catch(error){panel.status.textContent=error.message;}}
 return {open,decorate(){const actions=document.querySelector('#app .topbar');if(!actions||actions.querySelector('[data-deep-research]'))return;const button=document.createElement('button');button.className='btn btn-primary btn-sm';button.dataset.deepResearch='true';button.dataset.researchTask=context()?.projectId+':'+context()?.taskId;button.textContent='深度研究';button.disabled=!context()?.taskId||!control();button.title=button.disabled?'先选择任务并取得本页操作权':'';button.onclick=()=>{void open().catch(error=>{button.title=error.message;});};actions.append(button);
 const c=context();if(c?.taskId){const taskKey=c.projectId+':'+c.taskId;void request(`/v1/deep-research/projects/${c.projectId}/tasks/${c.taskId}/copies`).then(rows=>{if(!button.isConnected||!rows.length)return;const latest=rows.at(-1),receipt=document.createElement('button');receipt.className='btn btn-sm';receipt.textContent=`研究副本 ${rows.length} · v${latest.version}${latest.limitations.length?' · 有限交付':''}`;receipt.onclick=async()=>{await open();panels.get(taskKey)?.copies.click();};actions.append(receipt);}).catch(()=>{});}
 },visible:()=>!!current};
}
