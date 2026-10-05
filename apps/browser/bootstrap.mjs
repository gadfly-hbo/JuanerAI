/** Anonymous bootstrap only: no workspace data, stored token, logging or query credential. */
export async function bootstrapWorkspace({location,history,request,load,status}) {
 const token=location.hash.slice(1);history.replaceState(null,'',location.pathname);
 try{let control=null,service=false;
  if(token){if(!/^[a-f0-9]{64}$/.test(token))throw new Error('invalid');const response=await request('/v1/bootstrap',{method:'POST',credentials:'same-origin',headers:{'content-type':'application/json'},body:JSON.stringify({token})});if(!response.ok)throw new Error('rejected');const result=await response.json();control=result.control;service=result.service===true;}
  else{const response=await request('/v1/session',{credentials:'same-origin',cache:'no-store'});if(!response.ok)throw new Error('unauthenticated');service=(await response.json()).service===true;}
  const workspace=await load();await workspace.startWorkspace({control,service});status('');return true;
 }catch{status('未连接本机工作区。请从本机启动入口打开；失效链接不会取得访问权限。');return false;}
}
export async function watchWorkspaceBootstrap(environment,onFragment){
 let running=null;
 const run=()=>running??=(async()=>{await bootstrapWorkspace(environment);})().finally(()=>{running=null;if(environment.location.hash)void run();});
 onFragment(()=>{if(environment.location.hash)void run();});await run();
}
if(typeof document!=='undefined')void watchWorkspaceBootstrap({location:window.location,history:window.history,request:window.fetch.bind(window),load:()=>import('/workspace.mjs'),status:text=>{document.getElementById('connection').textContent=text;}},callback=>window.addEventListener('hashchange',callback));
