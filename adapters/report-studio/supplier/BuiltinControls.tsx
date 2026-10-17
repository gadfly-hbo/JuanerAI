import {useCallback,useEffect,useRef,useState} from 'react';
import './builtin-controls.css';

type Mode={accepted:boolean;revision:number};
type Configuration={revision:number;state:string;providers:string[];pending_provider?:string;pending_kind?:string;provider_verification:'not_performed'};
type Material={source_id:string;sha256:string;kind:'text'|'image'};
type Grant={recipients_sha256:string;materials:Material[];allow_prompt:boolean;allow_screenshots:boolean;allow_network:boolean};
type Permission={configuration:Configuration;recipients:{provider:string;model:string;endpoint:string;purposes:string[]}[];materials:Material[];material_labels:Record<string,string>;boundary:{recipients_sha256:string;materials:Material[]};permission:{allowed:boolean;revision:number;missing:Material[];grant:Grant|null;recipients_changed:boolean}};
const messages:Record<string,string>={RS_CONFIGURATION_CHANGED:'配置已变化，请核对最新状态后再保存。',RS_POLICY_CHANGED:'许可已变化，请核对最新状态后再保存。',RS_PROJECT_PENDING:'有制作或未核对任务，请先处理运行状态。',RS_CREDENTIAL_WRITE_UNKNOWN:'保存结果未知。请重新核对或显式重设、移除此模型的配置。',RS_CREDENTIAL_UNAVAILABLE:'本机凭据暂不可用，请检查系统钥匙串后重试。',RS_CONFIGURATION_UNAVAILABLE:'请先完成此内置工作台自己的模型配置。',RS_CONFIGURATION_RECONCILIATION_REQUIRED:'请先处理上一次结果未知的模型配置。',RS_PERMISSION_SCOPE_CHANGED:'材料或模型接收方已变化，请核对最新范围。'};
async function request<T>(path:string,body?:unknown,method=body===undefined?'GET':'POST'):Promise<T>{
 const response=await fetch('/api/builtin/browser'+path,{method,redirect:'error',headers:body===undefined?{}:{'content-type':'application/json'},...(body===undefined?{}:{body:JSON.stringify(body)})});
 const value=await response.json();if(!response.ok)throw Error(messages[value.error]??'请求未完成，请核对当前状态后重试。');return value;
}

/** Only the approved incremental context/settings surface; the supplier workbench remains intact. */
export function BuiltinControls({projectId,projectsOpen,onToggleProjects}:{projectId:string|null;projectsOpen:boolean;onToggleProjects():void}) {
 const [mode,setMode]=useState<Mode|null>(null),[configuration,setConfiguration]=useState<Configuration|null>(null),[permission,setPermission]=useState<Permission|null>(null);
 const [pane,setPane]=useState<'mode'|'configuration'|'permission'|null>(null),[error,setError]=useState(''),[notice,setNotice]=useState(''),[saving,setSaving]=useState(false);
 const [provider,setProvider]=useState('minimax-cn'),[key,setKey]=useState(''),[prompt,setPrompt]=useState(false),[screenshots,setScreenshots]=useState(false),[network,setNetwork]=useState(false),[selected,setSelected]=useState<string[]>([]);
 const dialog=useRef<HTMLDialogElement>(null),trigger=useRef<HTMLElement|null>(null),scope=useRef(projectId),generation=useRef(0);scope.current=projectId;
 const refresh=useCallback(async()=>{
  const n=++generation.current,id=projectId;
  const [m,c,p]=await Promise.all([request<Mode>('/mode'),request<Configuration>('/configuration'),id?request<Permission>('/projects/'+id+'/permissions'):null]);
  if(n!==generation.current||scope.current!==id)return;
  setMode(m);setConfiguration(c);setPermission(p);
 },[projectId]);
 useEffect(()=>{setPermission(null);setPane(null);setError('');void refresh().catch(e=>setError(e.message));return()=>{generation.current++;};},[refresh]);
 useEffect(()=>{if(!pane)return;const element=dialog.current;element?.showModal();return()=>{element?.close();trigger.current?.focus();};},[pane]);
 function open(next:NonNullable<typeof pane>){
  trigger.current=document.activeElement instanceof HTMLElement?document.activeElement:null;setError('');setNotice('');setKey('');setPane(next);if(next==='configuration'&&configuration?.pending_provider)setProvider(configuration.pending_provider);
  if(next==='permission'&&projectId){
   const id=projectId;setPermission(null);
   void request<Permission>('/projects/'+id+'/permissions').then(current=>{
    if(scope.current!==id)return;const old=current.permission.grant;setPermission(current);setPrompt(old?.allow_prompt??false);setScreenshots(old?.allow_screenshots??false);setNetwork(old?.allow_network??false);setSelected(current.materials.filter(m=>old?.materials.some(v=>v.source_id===m.source_id&&v.sha256===m.sha256&&v.kind===m.kind)).map(m=>m.source_id));
   }).catch(e=>{if(scope.current===id)setError(e.message);});
  }else void refresh().catch(e=>setError(e.message));
 }

 function close(){if(saving)return;setKey('');setPane(null);setError('');}
 async function mutate(work:()=>Promise<unknown>,success:string){if(saving)return;setSaving(true);setError('');try{await work();setNotice(success);setKey('');await refresh();setPane(null);}catch(e){setError((e as Error).message);await refresh().catch(()=>{});}finally{setSaving(false);}}
 const names:Record<string,string>={'minimax-cn':'MiniMax（主模型及图片理解）','xiaomi-token-plan-cn':'小米 MiMo（文字及图片理解）'};
 return <section className="wb-builtin-context" aria-label="JuanerAI 内置制作设置">
  <div className="wb-builtin-summary"><strong>JuanerAI 内置</strong><span>{mode?.accepted?'可信本地制作已启用':mode?'仅查看 · 尚未启用本地制作':'正在读取制作状态'}</span><span>{configuration?.state==='ready'?'模型配置已保存 · 连接未验证':configuration?.state==='unknown'?'模型配置结果未知':'尚未配置模型'}</span></div>
  <div className="wb-builtin-actions">
   <button type="button" className="btn btn-ghost btn-sm wb-builtin-project-toggle" aria-expanded={projectsOpen} onClick={onToggleProjects}>项目</button>
   <button type="button" className="btn btn-ghost btn-sm" onClick={()=>open('mode')}>{mode?.accepted?'本地制作权限':'启用本地制作'}</button>
   <button type="button" className="btn btn-ghost btn-sm" onClick={()=>open('configuration')}>制作设置</button>
   <button type="button" className="btn btn-ghost btn-sm" disabled={!permission} onClick={()=>open('permission')}>{permission?.permission.allowed?'材料与外发范围':'检查外发许可'}</button>
  </div>
  {notice&&<p className="wb-builtin-message" role="status">{notice}</p>}{error&&!pane&&<p className="wb-builtin-message" role="alert">{error}</p>}
  <dialog ref={dialog} className="wb-builtin-dialog" aria-labelledby="builtin-dialog-title" onCancel={event=>{if(saving)event.preventDefault();else close();}} onClose={()=>{setKey('');setPane(null);}}>
   <button type="button" className="btn btn-ghost btn-sm wb-builtin-close" aria-label="关闭制作设置弹窗" disabled={saving} onClick={close}>关闭</button>
   <h2 id="builtin-dialog-title">{pane==='mode'?'可信本地制作':pane==='configuration'?'制作设置':'材料与外发范围'}</h2>
   {pane==='mode'&&<>
    <p>生成代码与 Bash 可能拥有当前用户系统访问能力。项目目录和提示词不是严格安全沙箱。</p><p>接受此模式后可使用本地制作功能；问题文字、材料、图片、页面截图及联网用途仍按下方实际范围分别许可。关闭标签页不等于停止制作。</p>
    <div className="wb-builtin-dialog-actions"><button type="button" className="btn" disabled={saving} onClick={close}>{mode?.accepted?'返回':'暂不接受，仅查看'}</button>{mode&&<button type="button" className="btn btn-primary" disabled={saving} onClick={()=>void mutate(()=>request('/mode',{revision:mode.revision,accepted:!mode.accepted}),mode.accepted?'已撤销新的本地制作准入；已发出的调用不会因此撤回。':'可信本地制作已启用')}>{mode.accepted?'撤销本地制作权限':'接受并启用本地制作'}</button>}</div>
   </>}
   {pane==='configuration'&&<form onSubmit={event=>{event.preventDefault();if(configuration)void mutate(()=>request('/configuration',{revision:configuration.revision,provider,key}),'模型配置已保存；尚未验证模型连接。');}}>
    <p>此内置工作台单独配置，不读取独立版或其他应用的凭据。密钥保存在本机专属钥匙串，保存本身不调用模型。</p>
    <p>当前：{configuration?.state==='ready'?'配置已保存':configuration?.state==='unknown'?'上次保存结果未知，请处理 '+(names[configuration.pending_provider??'']??'同一模型')+' 的配置':'尚未配置'} · 模型连接尚未验证</p>
    <label htmlFor="builtin-provider">模型接入</label><select id="builtin-provider" value={provider} onChange={e=>setProvider(e.target.value)}>{Object.entries(names).map(([id,name])=><option value={id} key={id}>{name}</option>)}</select>
    <label htmlFor="builtin-key">API Key</label><input id="builtin-key" type="password" autoComplete="off" spellCheck={false} value={key} onChange={e=>setKey(e.target.value)} required maxLength={4096}/>
    <p className="fine">新项目支持 MiniMax 和 MiMo 图片理解；两者均配置时优先 MiniMax，仅配置 MiMo 时使用 MiMo。旧项目保留原制作计划，MiMo 图片能力请在新项目使用。</p>
    <div className="wb-builtin-dialog-actions"><button className="btn" type="button" disabled={saving} onClick={close}>取消</button><button className="btn" type="button" disabled={saving||!configuration||configuration.state==='not_configured'} onClick={()=>configuration&&void mutate(()=>request('/configuration',{revision:configuration.revision,provider},'DELETE'),'已移除此模型的内置配置。')}>移除此模型配置</button><button className="btn btn-primary" type="submit" disabled={saving||!key||!configuration}>保存配置</button></div>
   </form>}
   {pane==='permission'&&!permission&&!error&&<p role="status">正在读取当前材料和接收方。</p>}
   {pane==='permission'&&permission&&<form onSubmit={event=>{event.preventDefault();const id=projectId;if(!id)return;void mutate(()=>request('/projects/'+id+'/permissions',{revision:permission.permission.revision,recipients_sha256:permission.boundary.recipients_sha256,materials:permission.materials.filter(m=>selected.includes(m.source_id)),allow_prompt:prompt,allow_screenshots:screenshots,allow_network:network}),'已保存当前材料和用途许可。');}}>
    <p>接收方：{permission.recipients.length?permission.recipients.map(r=>r.provider+'/'+r.model).join('；'):'尚未配置模型，请先完成制作设置。'}</p>
    {permission.recipients.map(r=><p className="fine" key={r.provider}>{r.endpoint}</p>)}
    <p>{permission.permission.missing.length?`本次尚未许可的材料：${permission.permission.missing.length} 份`:'当前材料已在原许可范围内，新增用途可单独选择。'}{permission.permission.recipients_changed&&permission.recipients.length>0?'模型接收方已变化，请核对。':''}</p>
    {permission.materials.filter(m=>permission.permission.missing.some(v=>v.source_id===m.source_id)).map(m=><label className="wb-builtin-check" key={m.source_id}><input type="checkbox" checked={selected.includes(m.source_id)} onChange={e=>setSelected(old=>e.target.checked?[...old,m.source_id]:old.filter(id=>id!==m.source_id))}/>{m.kind==='image'?'图片及图片理解':'文字材料'} · {permission.material_labels[m.source_id]??'未命名材料'}</label>)}
    <label className="wb-builtin-check"><input type="checkbox" checked={prompt} onChange={e=>setPrompt(e.target.checked)}/>允许将问题文字及所选材料发送给上述模型</label>
    <label className="wb-builtin-check"><input type="checkbox" checked={screenshots} onChange={e=>setScreenshots(e.target.checked)}/>允许发送页面截图供模型检查</label>
    <label className="wb-builtin-check"><input type="checkbox" checked={network} onChange={e=>setNetwork(e.target.checked)}/>允许生成代码、Bash 执行及联网取材（当前用户系统权限）</label>
    <p className="fine">未许可材料仍可本地保留。撤销只阻止新的受影响调用，不撤回已经发送的内容。</p>
    <div className="wb-builtin-dialog-actions"><button className="btn" type="button" disabled={saving} onClick={close}>暂不允许</button><button className="btn" type="button" disabled={saving||!permission.permission.grant} onClick={()=>projectId&&void mutate(()=>request('/projects/'+projectId+'/permissions',{revision:permission.permission.revision},'DELETE'),'已撤销新的模型与外发用途准入。')}>撤销外发许可</button><button className="btn btn-primary" type="submit" disabled={saving||permission.configuration.state!=='ready'}>允许所选范围</button></div>
   </form>}
   {saving&&<p role="status">正在保存，请等待结果。</p>}{error&&pane&&<p role="alert">{error}</p>}
  </dialog>
 </section>;
}
