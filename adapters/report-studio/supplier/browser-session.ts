/** Build-time built-in selection; upstream standalone keeps its own startup. */
export async function initializeBuiltinSession():Promise<void> {
  if(import.meta.env.VITE_REPORT_STUDIO_BUILTIN!=='1')return;
  const fragment=location.hash.slice(1);
  // Remove the token before any request or component is mounted.
  history.replaceState(history.state,'',location.pathname+location.search);
  if(fragment) {
    if(!/^bootstrap=[a-f0-9]{64}$/.test(fragment))throw Error('RS_SESSION_UNAVAILABLE');
    const response=await fetch('/api/builtin/session',{method:'POST',redirect:'error',headers:{'content-type':'application/json'},body:JSON.stringify({token:fragment.slice(10)})});
    if(!response.ok)throw Error('RS_SESSION_UNAVAILABLE');
  }
  const response=await fetch('/api/builtin/browser/status',{redirect:'error'});
  if(!response.ok||(await response.json()).ready!==true)throw Error('RS_SESSION_UNAVAILABLE');
}
export function showBuiltinSessionFailure():void {
  const root=document.getElementById('root');if(!root)return;
  const panel=document.createElement('main'),heading=document.createElement('h1'),message=document.createElement('p');
  heading.textContent='Report Studio 暂不可用';message.textContent='请返回 JuanerAI 重新打开 Report Studio';
  panel.append(heading,message);root.replaceChildren(panel);
}
