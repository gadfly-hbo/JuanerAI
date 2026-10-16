/** Anonymous bootstrap only: no workspace data, stored token, logging or query credential. */
export async function bootstrapWorkspace({location,history,request,load,status}) {
 const search=location.search??'',uuid='[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}',match=new RegExp('^\\?report-studio-project=('+uuid+')&report-studio-task=('+uuid+')&report-studio-revision=([1-9][0-9]{0,63})$').exec(search);
 const reportStudioReturn=match?{project_id:match[1],task_id:match[2],revision:match[3]}:null;
 const token=location.hash.slice(1);history.replaceState(null,'',location.pathname);
 try{let control=null,service=false;
  if(search.includes('report-studio-')&&!reportStudioReturn)throw Error('invalid source return');
  if(token){if(!/^[a-f0-9]{64}$/.test(token))throw new Error('invalid');const response=await request('/v1/bootstrap',{method:'POST',credentials:'same-origin',headers:{'content-type':'application/json'},body:JSON.stringify({token})});if(!response.ok)throw new Error('rejected');const result=await response.json();control=result.control;service=result.service===true;}
  else{const response=await request('/v1/session',{credentials:'same-origin',cache:'no-store'});if(!response.ok)throw new Error('unauthenticated');service=(await response.json()).service===true;}
  const workspace=await load();await workspace.startWorkspace({control,service,...(reportStudioReturn?{reportStudioReturn}:{})});status('');return true;
 }catch{status('暂时无法连接本机服务。请从 JuanerAI 的启动入口重新打开。');return false;}
}
export async function watchWorkspaceBootstrap(environment,onFragment){
 let running=null;
 const run=()=>running??=(async()=>{await bootstrapWorkspace(environment);})().finally(()=>{running=null;if(environment.location.hash)void run();});
 onFragment(()=>{if(environment.location.hash)void run();});await run();
}
if(typeof document!=='undefined')void watchWorkspaceBootstrap({location:window.location,history:window.history,request:window.fetch.bind(window),load:async()=>{const quick=await import('/quick-analysis-client.mjs');return {startWorkspace:options=>quick.startQuickWorkspace(options)};},status:text=>{document.getElementById('connection').textContent=text;}},callback=>window.addEventListener('hashchange',callback));
