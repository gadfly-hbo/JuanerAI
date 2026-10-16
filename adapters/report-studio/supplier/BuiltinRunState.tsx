import {useEffect,useRef,useState} from 'react';
type Result={active:boolean;status?:string;reason?:string;canReconcile?:boolean;consumptionKnown?:boolean;operation_kind?:string};
type Usage={modelCalls:number;toolCalls:number;inputTokens:number;outputTokens:number;reservedOutputTokens:number};
export function classifyBuiltinResult(r:{status?:string;reason?:string}):{text:string;kind:'ok'|'neutral'|'fail';recover?:boolean}{
 if(r.status==='unknown')return {text:'制作结果或消费仍未知。不会自动重试；请先核对运行状态。已保存内容与历史预留会保留。',kind:'fail'};
 if(r.status==='succeeded')return {text:'',kind:'ok'};
 if(r.status==='stopped'||r.status==='cancelled'||r.reason==='CANCELLED')return {text:'制作已停止。已保存内容保留；继续制作需要明确发送新指令。',kind:'neutral'};
 if(r.status==='idle')return {text:'本轮没有产生结果。',kind:'neutral'};
 return {text:'制作未完成。请查看运行状态、制作设置和外发范围；不会自动重试。',kind:'fail'};
}
export function BuiltinRunState({projectId,onActivity}:{projectId:string|null;onActivity(state:string):void}){
 const [result,setResult]=useState<Result|null>(null),[usage,setUsage]=useState<Usage|null>(null),[error,setError]=useState(''),[saving,setSaving]=useState(false),[notice,setNotice]=useState(''),[exitIntent,setExitIntent]=useState('none');
 const currentProject=useRef(projectId);currentProject.current=projectId;
 useEffect(()=>{
  let live=true;setResult(null);setUsage(null);setError('');setNotice('');setSaving(false);setExitIntent('none');onActivity('idle');if(!projectId)return;
  const path='/api/projects/'+encodeURIComponent(projectId)+'/agent/';
  const poll=async()=>{
   try{
    const [state,consumption,global]=await Promise.all([fetch(path+'result'),fetch(path+'usage'),fetch('/api/builtin/browser/status')]);if(!state.ok||!consumption.ok||!global.ok)throw Error();
    const r=await state.json() as Result,u=await consumption.json() as {usage:Usage|null},g=await global.json() as {exit_intent?:string};
    if(live){setResult(r);setUsage(u.usage);setExitIntent(g.exit_intent??'none');setError('');onActivity(g.exit_intent&&g.exit_intent!=='none'?'unavailable':r.active?(r.status??'running'):(r.status??'idle'));}
   }catch{if(live){setError('运行状态暂不可读；不能据此判断任务已停止。');onActivity('unavailable');}}
  };
  // Serialized observation only: no timer starts, replays or reconciles work.
  let timer:ReturnType<typeof setTimeout>;const observe=async()=>{await poll();if(live)timer=setTimeout(()=>void observe(),1200);};void observe();
  return ()=>{live=false;clearTimeout(timer);};
 },[projectId,onActivity]);
 async function act(kind:'stop'|'recover'){
  if(!projectId||saving)return;setSaving(true);setError('');const id=projectId;
  try{
   const response=await fetch('/api/projects/'+encodeURIComponent(id)+'/agent/'+kind,{method:'POST',headers:{'content-type':'application/json'},body:'{}'});if(!response.ok)throw Error();if(currentProject.current!==id)return;
   // Do not claim physical settlement from a stop HTTP acknowledgement.
   setNotice(kind==='stop'?'停止请求已受理，正在等待实际结束与结算。':'运行状态已核对；历史未知消费仍保留。继续制作请明确发送新指令。');
  }catch{if(currentProject.current===id)setError(kind==='stop'?'停止请求未确认，请读取实际状态。':'尚不能确认原操作已结束；未重试制作或清除消费记录。');}finally{if(currentProject.current===id)setSaving(false);}
 }
 const pending=result?.status==='unknown',running=result?.active;
 return <section className="wb-builtin-run" aria-label="制作运行状态">
  {exitIntent!=='none'&&<p role="status">JuanerAI 正在等待制作结束与结算，暂不接收新制作。未知项需先核对；可在 JuanerAI 菜单选择“取消退出”。取消不会撤回已发送的停止请求。</p>}
  {running&&<p role="status">{result.status==='stopping'?'正在停止，等待实际结束与结算。':result.operation_kind==='export'?'正在本地导出；不调用模型。':result.operation_kind==='preview'?'正在生成本地预览；不调用模型。':result.operation_kind==='image'?'正在理解已许可的图片。':'正在制作；关闭标签页或返回分析不会停止任务。'} <button className="btn btn-sm" type="button" disabled={saving||result.status==='stopping'} onClick={()=>void act('stop')}>停止本报告制作</button></p>}
  {pending&&<p role="status">制作结果或消费仍未知，不会自动重试。{result.canReconcile?'已记录实际结束，可明确核对。':'尚无实际结束凭据，继续制作及版本切换保持阻断。'} <button className="btn btn-sm" type="button" disabled={saving||!result.canReconcile} onClick={()=>void act('recover')}>核对运行状态</button></p>}
  {result?.status==='stopped'&&<p role="status">制作已停止；历史未知消费如有仍保留，继续需要明确发送。</p>}
  {usage&&(pending||running||usage.reservedOutputTokens>0)&&<p className="fine">累计请求 {usage.modelCalls} 次 · 工具 {usage.toolCalls} 次 · 已记录 token 入 {usage.inputTokens??0} / 出 {Math.max(0,usage.outputTokens-usage.reservedOutputTokens)}{usage.reservedOutputTokens>0?` · 未结算输出预留 ${usage.reservedOutputTokens}，累计实际消费未知。`:''}</p>}
  {!usage&&(pending||running)&&<p className="fine">消费记录暂不可读或尚未产生，不能据此记为零消费。</p>}
  {notice&&<p role="status">{notice}</p>}{error&&<p role="alert">{error}</p>}
 </section>;
}
