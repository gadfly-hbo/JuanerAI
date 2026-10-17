import {useCallback,useEffect,useRef,useState} from 'react';
type Source={revision:string};
type Context={kind:'independent';source:null;context:null}|{kind:'associated';title:string;source:Source;context:{operation:'context';state:'available'|'updated'|'unavailable';current_revision:string|null;return_url:string|null}|null};
type Export={export_id:string;format:string;created_at:string};
type Delivery={delivery_id:string;sequence:number;format:string;source:Source;warnings:string[];created_at:string;artifact_sha256:string};
type Receipt={operation:'deliver'|'receipt';state:'saved'|'not_found'|'pending';delivery:Delivery|null};
type State={key:string;phase:'checking'|'new'|'saving'|'saved'|'unknown'|'pending';delivery?:Delivery;note?:string};
async function request<T>(path:string,write=false):Promise<T>{
 const response=await fetch('/api/builtin/browser'+path,{method:write?'POST':'GET',redirect:'error',...(write?{headers:{'content-type':'application/json'},body:'{}'}:{})});
 if(!response.ok)throw Error('关联尚未确认；已保存导出仍在本地。');return response.json() as Promise<T>;
}
/** Exact project/export identity; every association success is an owned-host readback. */
export function BuiltinSource({projectId,exports:exportsList,exportsProjectId}:{projectId:string|null;exports:Export[];exportsProjectId:string|null}){
 const [context,setContext]=useState<Context|null>(null),[contextError,setContextError]=useState(false),[contextLoading,setContextLoading]=useState(false),[selected,setSelected]=useState(''),[delivery,setDelivery]=useState<State|null>(null);
 const currentProject=useRef(projectId);currentProject.current=projectId;
 const key=(projectId??'')+':'+selected,currentKey=useRef(key);currentKey.current=key;
 const contextVersion=useRef(0),receiptVersion=useRef(0),ready=!!projectId&&exportsProjectId===projectId;
 const loadContext=useCallback(async()=>{
  if(!projectId)return;const id=projectId,version=++contextVersion.current;setContextLoading(true);
  try{const value=await request<Context>('/projects/'+id+'/context');if(currentProject.current===id&&version===contextVersion.current){setContext(value);setContextError(false);}}
  catch{if(currentProject.current===id&&version===contextVersion.current)setContextError(true);}
  finally{if(currentProject.current===id&&version===contextVersion.current)setContextLoading(false);}
 },[projectId]);
 useEffect(()=>{
  setContext(null);setContextError(false);setDelivery(null);void loadContext();const focus=()=>void loadContext();window.addEventListener('focus',focus);
  return()=>{contextVersion.current++;receiptVersion.current++;window.removeEventListener('focus',focus);};
 },[loadContext]);
 useEffect(()=>{
  setSelected(current=>ready&&exportsList.some(value=>value.export_id===current)?current:ready?exportsList[0]?.export_id??'':'');
 },[projectId,exportsProjectId,exportsList,ready]);
 const applyReceipt=(value:Receipt,forKey:string,note?:string)=>{
  if(value.state==='saved'&&value.delivery)setDelivery({key:forKey,phase:'saved',delivery:value.delivery,note});
  else setDelivery({key:forKey,phase:value.state==='pending'?'pending':'new',note});
 };
 const readReceipt=useCallback(async()=>{
  if(!projectId||!selected)return;const forKey=key,version=++receiptVersion.current;setDelivery({key:forKey,phase:'checking'});
  try{const value=await request<Receipt>('/projects/'+projectId+'/deliveries/'+selected);if(currentKey.current===forKey&&receiptVersion.current===version)applyReceipt(value,forKey);}
  catch{if(currentKey.current===forKey&&receiptVersion.current===version)setDelivery({key:forKey,phase:'unknown'});}
 },[projectId,selected,key]);
 useEffect(()=>{
  if(context?.kind==='associated'&&ready&&selected)void readReceipt();
  return()=>{receiptVersion.current++;};
 },[context?.kind,ready,selected,readReceipt]);
 const current=delivery?.key===key?delivery:null,available=context?.kind==='associated'&&(context.context?.state==='available'||context.context?.state==='updated'),canDeliver=available&&ready&&!!selected&&current?.phase==='new';
 async function deliver(){
  if(!canDeliver||!projectId)return;const forKey=key,id=projectId,exportId=selected,version=++receiptVersion.current;setDelivery({key:forKey,phase:'saving'});
  try{const value=await request<Receipt>('/projects/'+id+'/deliveries/'+exportId,true);if(currentKey.current===forKey&&receiptVersion.current===version)applyReceipt(value,forKey);}
  catch{
   // Read once after uncertainty; never resubmit a write from a timer/error path.
   try{const value=await request<Receipt>('/projects/'+id+'/deliveries/'+exportId);if(currentKey.current===forKey&&receiptVersion.current===version)applyReceipt(value,forKey,value.state==='saved'?'首次回执未收到，已读回原关联。':undefined);}
   catch{if(currentKey.current===forKey&&receiptVersion.current===version)setDelivery({key:forKey,phase:'unknown'});}
  }
 }
 if(!projectId)return null;
 return <section className="wb-builtin-source" aria-label="报告来源与关联">
  {!context&&<p role="status">{contextError?'来源信息暂不可读；不会改为其他分析或建立新关联。':'正在读取报告来源。'}</p>}
  {context?.kind==='independent'&&<p>独立报告 · 无分析关联</p>}
  {context?.kind==='associated'&&<>
   <div className="wb-builtin-source-line"><p title={context.title}>来源：{context.title.length>60?context.title.slice(0,60)+'…':context.title} · 来源分析版本 {context.source.revision}</p>{context.context?.return_url&&<a href={context.context.return_url} target="_blank" rel="noopener">返回原分析</a>}</div>
   <p className="fine">报告可编辑；新增数字与解释未自动获得原分析核验。</p>
   {context.context?.state==='updated'&&<p role="status">来源已有版本 {context.context.current_revision}；当前报告仍引用版本 {context.source.revision}。带入新版请从原分析明确创建。</p>}
   {context.context?.state==='unavailable'&&<p role="status">原分析目标不可用；本地工作项目与已保存导出不自动删除。</p>}
   {context.context===null&&<p role="status">原分析状态暂不可读；不能据此判断已删除，也不会更换目标。</p>}
   {!ready||!exportsList.length?<p className="fine">先导出并保存，再选择具体产物关联回原分析。</p>:<>
    <div className="wb-builtin-source-actions"><label htmlFor="builtin-saved-export">已保存的导出</label><select id="builtin-saved-export" value={selected} disabled={current?.phase==='saving'} onChange={event=>setSelected(event.target.value)}>{exportsList.map(value=><option value={value.export_id} key={value.export_id}>{value.format.toUpperCase()} · {new Date(value.created_at).toLocaleString('zh-CN')} · {value.export_id}</option>)}</select>
     {current?.phase!=='saved'&&<button type="button" className="btn btn-sm" disabled={!canDeliver} onClick={()=>void deliver()}>关联回原分析</button>}
     {['unknown','pending'].includes(current?.phase??'')&&<button type="button" className="btn btn-sm" onClick={()=>void readReceipt()}>核对关联结果</button>}
    </div>
    {(!current||current.phase==='checking')&&<p role="status">正在核对这份导出的已有回执。</p>}
    {current?.phase==='saving'&&<p role="status">正在保存稳定副本并读回关联；尚未确认成功。</p>}
    {current?.phase==='pending'&&<p role="status">关联仍在处理，先核对结果，不重复提交。</p>}
    {current?.phase==='unknown'&&<p role="status">关联结果未知；已保存导出保留，请先核对结果，不重复提交。</p>}
    {current?.phase==='new'&&<p className="fine">尚未发现这份导出的已有关联；明确关联后保存稳定副本。</p>}
    {current?.phase==='saved'&&current.delivery&&<>
     <p role="status">已关联 · 交付 {current.delivery.sequence} · {current.delivery.format.toUpperCase()} · 来源分析版本 {current.delivery.source.revision}{current.delivery.warnings.length?' · 有质检提示':''}</p>
     {current.note&&<p role="status">{current.note}</p>}
     <details><summary>关联详情与质检</summary><p className="fine">{current.delivery.created_at} · 编辑不会改变此已关联副本。</p>{current.delivery.warnings.map((warning,index)=><p className="fine" key={index}>质检提示：{warning}</p>)}<p className="fine">内容可编辑，未经新增分析核验；不等于正式决定。</p></details>
    </>}
   </>}
  </>}
  {(contextError||context?.kind==='associated'&&context.context?.state==='unavailable'||context?.kind==='associated'&&context.context===null)&&<button type="button" className="btn btn-sm" disabled={contextLoading} onClick={()=>void loadContext()}>核对来源</button>}
 </section>;
}
