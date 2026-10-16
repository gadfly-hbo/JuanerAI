import {spawn} from 'node:child_process';

const pending=new Map<string,Set<Promise<unknown>>>();
type Options={signal?:AbortSignal;timeout:number;maxBuffer:number};
/** A process group created by this call, never a discovered PID or system service.
 * Trusted local code can escape its group; this is not an OS security sandbox.
 */
export function executeBuiltinFile(root:string,file:string,args:string[],options:Options):Promise<{stdout:string;stderr:string}>{
 if(options.signal?.aborted)return Promise.reject(Object.assign(Error('执行已停止'),{code:130,killed:true}));
 if(process.platform!=='darwin')return Promise.reject(Error('RS_EXECUTION_PLATFORM_UNSUPPORTED'));
 const work=new Promise<{stdout:string;stderr:string}>((resolve,reject)=>{
  const env=Object.fromEntries(['PATH','HOME','TMPDIR','LANG','LC_ALL','PLAYWRIGHT_BROWSERS_PATH'].filter(key=>process.env[key]!==undefined).map(key=>[key,process.env[key]!]));
  const child=spawn(file,args,{cwd:root,env,detached:true,stdio:['ignore','pipe','pipe']});
  let stdout=Buffer.alloc(0),stderr=Buffer.alloc(0),length=0,reason:130|124|1|null=null,error:Error|null=null;
  const alive=()=>{if(!child.pid)return false;try{process.kill(-child.pid,0);return true;}catch(e){return (e as NodeJS.ErrnoException).code!=='ESRCH';}};
  const kill=()=>{if(child.pid)try{process.kill(-child.pid,'SIGKILL');}catch(e){if((e as NodeJS.ErrnoException).code!=='ESRCH')error=Error('RS_EXECUTION_SETTLEMENT_UNKNOWN');}};
  const stop=()=>{reason??=130;kill();};options.signal?.addEventListener('abort',stop,{once:true});
  const timer=setTimeout(()=>{reason??=124;kill();},options.timeout);
  const collect=(value:Buffer,which:'stdout'|'stderr')=>{length+=value.length;if(length>options.maxBuffer){reason??=1;kill();return;}if(which==='stdout')stdout=Buffer.concat([stdout,value]);else stderr=Buffer.concat([stderr,value]);};
  child.stdout.on('data',(bytes:Buffer)=>collect(bytes,'stdout'));child.stderr.on('data',(bytes:Buffer)=>collect(bytes,'stderr'));
  child.once('error',e=>{error=e;});
  child.once('close',async(code,signal)=>{
   // Child close alone does not prove that its background descendants ended.
   // A surviving owned group is stopped and observed before releasing the task.
   while(alive()){kill();await new Promise(done=>setTimeout(done,10));}
   clearTimeout(timer);options.signal?.removeEventListener('abort',stop);
   if(error||reason!==null||code!==0||signal)reject(Object.assign(Error(reason===130?'执行已停止':reason===124?'执行超时，已终止':'本地执行失败'),{code:reason??code??1,killed:reason!==null,stdout:stdout.toString('utf8'),stderr:stderr.toString('utf8')}));
   else resolve({stdout:stdout.toString('utf8'),stderr:stderr.toString('utf8')});
  });
  if(options.signal?.aborted)stop();
 });
 const tracked=work.finally(()=>{const current=pending.get(root);current?.delete(tracked);if(!current?.size)pending.delete(root);});
 const current=pending.get(root)??new Set();pending.set(root,current);current.add(tracked);return tracked;
}
/** SDK logical cancellation cannot certify completion of a native child. */
export async function waitForBuiltinExecutions(root:string):Promise<void>{while(pending.get(root)?.size)await Promise.allSettled([...pending.get(root)!]);}
