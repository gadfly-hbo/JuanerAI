import {createContext,useContext,useEffect,useRef,useState,type ReactNode} from 'react';
import type {ProviderSettingsApi,ProviderSettingsStatus,ProviderSettingsResult} from '../../packages/contracts/provider-settings.ts';
const labels={unconfigured:'模型未配置',configured:'模型已配置',credential_invalid:'凭据失效',keychain_unavailable:'钥匙串不可用'};
const errors:Record<string,string>={CREDENTIAL_INVALID:'Key 无效或无权使用此模型，请检查后重新测试。',NETWORK_UNAVAILABLE:'无法连接 Xiaomi，请检查网络后重新测试。',CONNECTION_TIMEOUT:'连接测试超时，请稍后重新测试。',QUOTA_EXCEEDED:'Token Plan 额度不足，请检查 Xiaomi 账户后重新测试。',CONNECTION_FAILED:'连接测试未通过，请检查后手动重试。',KEYCHAIN_UNAVAILABLE:'无法访问系统钥匙串。请解锁或允许 Xanthil 访问后重试；不会改用明文保存。',MODEL_BUSY:'任务正在运行或等待回复。请先停止任务，再测试、更换或删除 Key。',CONFIGURATION_CHANGED:'模型配置已变化，请重新准备并确认本次任务。',TEST_REQUIRED:'输入已变化，请重新测试连接后保存。',SAVE_FAILED:'保存未完成，新 Key 尚未启用；已读回的原配置保持不变。',DELETE_FAILED:'删除未完成，已保存的 Key 保持不变。',CANCELLED:'测试已取消，配置未改变。已发出的请求可能已消耗少量额度。',MODEL_NOT_CONFIGURED:'请先配置模型。'};
type Context={managed:boolean;status:ProviderSettingsStatus|null;open(element:HTMLElement):void;label:string};
const SettingsContext=createContext<Context>({managed:false,status:null,open(){},label:'模型未配置'});
export const useProviderSettings=()=>useContext(SettingsContext);
export function ProviderSettingsProvider({children,api}:{children:ReactNode;api?:ProviderSettingsApi}){
 const [status,setStatus]=useState<ProviderSettingsStatus|null>(null),[opened,setOpened]=useState(false);
 const opener=useRef<HTMLElement|null>(null);
 const read=async()=>{try{const result=await api?.request({operation:'read'});if(result?.value)setStatus(result.value);}catch{/* Synthetic fixtures may not expose this production channel. */}};
 useEffect(()=>{void read();const timer=setInterval(()=>void read(),1000);return()=>clearInterval(timer);},[api]);
 function open(element:HTMLElement){opener.current=element;setOpened(true);void read();}
 function close(){setOpened(false);opener.current?.focus();void read();}
 return <SettingsContext.Provider value={{managed:status!==null,status,open,label:status?labels[status.state]:'模型未配置'}}>{children}{opened&&api&&<ProviderSettingsPanel api={api} status={status} update={setStatus} onClose={close}/>}</SettingsContext.Provider>;
}
export function ProviderSettingsEntry(){const s=useProviderSettings();return <button className="connection-entry" aria-label={`模型接入，${s.label}`} type="button" onClick={e=>s.open(e.currentTarget)}><span className={`status-dot ${s.status?.state==='configured'?'green':'amber'}`}/>模型接入 <span>{s.label}</span></button>;}
function ProviderSettingsPanel({api,status,update,onClose}:{api:ProviderSettingsApi;status:ProviderSettingsStatus|null;update:(s:ProviderSettingsStatus)=>void;onClose:()=>void}){
 const dialog=useRef<HTMLDialogElement>(null),deletion=useRef<HTMLDialogElement>(null),input=useRef<HTMLInputElement>(null),epoch=useRef(0);
 const [key,setKey]=useState(''),[visible,setVisible]=useState(false),[editing,setEditing]=useState(!status?.configured),[proof,setProof]=useState<string|null>(null),[operation,setOperation]=useState(''),[message,setMessage]=useState(''),[tone,setTone]=useState('');
 useEffect(()=>{dialog.current?.showModal();if(!status?.configured)input.current?.focus();return()=>{epoch.current++;void api.request({operation:'cancel'});};},[]);
 const blocked=!!status?.busy||!!operation;
 function clear(){setKey('');setVisible(false);setProof(null);}
 function cancel(){epoch.current++;clear();void api.request({operation:'cancel'});setMessage(errors.CANCELLED);setTone('pending');}
 function close(){cancel();dialog.current?.close();onClose();}
 function feedback(result:ProviderSettingsResult){if(result.value)update(result.value);if(!result.ok){setMessage(errors[result.code]??'操作未完成，请重新打开面板核对。');setTone('error');}return result.ok;}
 async function run(kind:'test'|'save'|'delete'|'refresh'){
  if(operation)return;const version=++epoch.current;setOperation(kind);setMessage(kind==='test'?'正在验证接入…':'正在核对本机配置…');setTone('pending');
  try{
   const result=await api.request(kind==='test'?{operation:'test',key:editing?key:null}:kind==='save'?{operation:'save',key,proof:proof??''}:kind==='delete'?{operation:'delete',confirmed:true}:{operation:'refresh'});
   if(version!==epoch.current)return;
   if(!feedback(result))return;
   setTone('success');
   if(kind==='test'){setProof(result.proof??null);setMessage(editing?'连接测试通过，尚未保存。点击“保存并启用”后生效。':'连接测试通过，可以在任务授权后使用。');}
   if(kind==='save'){clear();setEditing(false);setMessage('已保存并启用。下次正常打开 Xanthil 可继续使用，任务不会自动开始。');}
   if(kind==='delete'){clear();setEditing(true);setMessage('本机 Key 已删除。Case、对话和报告保持不变。');input.current?.focus();}
   if(kind==='refresh'){setMessage('已重新读取本机配置；没有连接模型。');}
  }catch{if(version===epoch.current){setMessage('操作结果待核对，请重新打开面板读取系统钥匙串。');setTone('error');setProof(null);}}
  finally{setOperation('');}
 }
 return <dialog ref={dialog} className="model-dialog" aria-label="模型接入" onCancel={e=>{e.preventDefault();if(operation!=='save'&&operation!=='delete')close();}}>
  <header className="panel-header"><div><p className="eyebrow">LOCAL MODEL CONNECTION</p><h2>模型接入</h2><p className="muted">在这台 Mac 上连接你的模型服务。</p></div><button type="button" className="icon-button" aria-label="关闭模型接入" disabled={operation==='save'||operation==='delete'} onClick={close}>×</button></header>
  <div className="panel-body"><section className="provider-card"><span className="provider-icon">M</span><div><strong>Xiaomi Token Plan</strong><p>中国区 · MiMo 2.6 Pro</p></div><span className="state-badge">{operation==='test'?'测试中':status?.state==='configured'?'已启用':status?.state==='credential_invalid'?'凭据失效':status?.state==='keychain_unavailable'?'暂不可用':'未配置'}</span></section>
   <p className="local-note">仅保存在这台 Mac 的系统钥匙串，不随 Project 复制或跨设备同步。</p>
   {status?.busy&&operation!=='test'&&<p className="notice">{errors.MODEL_BUSY}</p>}
   {status?.state==='keychain_unavailable'&&<p className="notice">{errors.KEYCHAIN_UNAVAILABLE} <button type="button" disabled={blocked} onClick={()=>void run('refresh')}>重新读取钥匙串</button></p>}
   {editing?<><label className="key-label" htmlFor="provider-api-key">API Key</label><div className="key-input"><input ref={input} id="provider-api-key" autoComplete="off" spellCheck={false} type={visible?'text':'password'} value={key} disabled={blocked} onChange={e=>{setKey(e.target.value);setProof(null);setMessage('');void api.request({operation:'cancel'});}}/><button type="button" aria-label={`${visible?'隐藏':'显示'}输入的 API Key`} onClick={()=>setVisible(v=>!v)}>{visible?'隐藏':'显示'}</button></div><p className="field-help">Key 仅用于服务认证，不进入模型提示、Case、对话或报告。{status?.configured?'原 Key 将保留到新 Key 测试通过并成功保存。':''}</p></>:<div className="saved-key"><span>API Key</span><strong>•••••••• · 已安全保存</strong><button type="button" disabled={blocked} onClick={()=>{clear();setEditing(true);setMessage('原 Key 将保留到新 Key 测试通过并成功保存。');setTone('pending');}}>更换 Key</button></div>}
   <section className="test-disclosure"><strong>测试连接只发送一条固定文本。</strong><p>会消耗少量 Token Plan 额度；不发送 Case、文件、历史或本机路径。</p><details><summary>查看逐字测试文本</summary><code>Reply with OK.</code></details><p>一次请求 · 最多 128 输出 token · 30 秒超时 · 不自动重试</p></section>
   <div className="test-row"><button type="button" className="secondary-button" disabled={blocked||(editing&&!key.trim())} onClick={()=>void run('test')}>{operation==='test'?'正在测试…':'测试连接'}</button>{operation==='test'?<button type="button" onClick={cancel}>取消测试</button>:<span className="muted">{!editing&&status?.last_test==='passed'?'上次测试通过 · 重开不会自动测试':'不会自动测试或重试'}</span>}</div>
   {message&&<p role="status" className={`feedback ${tone}`}>{message}</p>}
   <p className="task-boundary">接入配置不等于任务授权。Case Assistant 和单次辅助仍需逐次核对并确认外发内容。</p>
  </div><footer className="panel-footer">{status?.configured&&<button className="delete-button" type="button" disabled={blocked} onClick={()=>deletion.current?.showModal()}>删除本机 Key</button>}<div className="footer-actions">{editing?<><button type="button" className="secondary-button" disabled={operation==='save'} onClick={()=>{cancel();if(status?.configured)setEditing(false);else {dialog.current?.close();onClose();}}}>取消</button><button type="button" className="primary-button" disabled={blocked||!proof} onClick={()=>void run('save')}>保存并启用</button></>:<button type="button" className="primary-button" onClick={close}>完成</button>}</div></footer>
  <dialog ref={deletion} className="confirm-dialog" aria-label="删除本机 Key"><h2>删除这台 Mac 的 Key？</h2><p>仅删除本机保存的 Key；Case、对话、草案和报告全部保留。不会撤销 Xiaomi 账户中的 Key。</p><div className="footer-actions"><button type="button" onClick={()=>deletion.current?.close()}>取消删除</button><button type="button" onClick={()=>{deletion.current?.close();void run('delete');}}>确认删除</button></div></dialog>
 </dialog>;
}
