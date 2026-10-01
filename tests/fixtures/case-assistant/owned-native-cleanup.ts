import type {ChildProcess} from 'node:child_process';
/** Only the ChildProcess captured at this fixture's launch may be finished. */
export async function closeOwnedNativeProcess(child:ChildProcess,close:()=>Promise<unknown>,record:(value:unknown)=>Promise<void>,waitMs=5000){
 const running=()=>child.exitCode===null&&child.signalCode===null;
 const exited=running()?new Promise<void>(resolve=>child.once('exit',()=>resolve())):Promise.resolve();
 const signals:string[]=[];let failure:unknown;
 async function bounded(work:Promise<unknown>){let timer:ReturnType<typeof setTimeout>|undefined;try{return await Promise.race([work.then(()=>true),new Promise<false>(resolve=>{timer=setTimeout(()=>resolve(false),waitMs);})]);}finally{if(timer)clearTimeout(timer);}}
 try{
  if(running())try{if(!await bounded((async()=>{await close();await exited;})()))failure=Error('owned native graceful exit timeout');}catch(error){failure=error;}
  for(const signal of ['SIGTERM','SIGKILL'] as const){
   if(!running())break;failure??=Error('owned native forced cleanup required');signals.push(signal);child.kill(signal);await bounded(exited);
  }
  if(running())failure=Error('owned native process still running after bounded cleanup');
  if(child.exitCode!==0||child.signalCode!==null)failure??=Error('owned native process did not exit normally');
 }finally{await record({pid:child.pid,spawnfile:child.spawnfile,args:child.spawnargs,signals,exit:child.exitCode,signal:child.signalCode,running:running(),error:failure?String(failure):null});}
 if(failure)throw failure;
}
