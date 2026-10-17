import {randomUUID} from 'node:crypto';
import type {RuntimeAdmission} from './runtime-authorization.ts';
/** Private IPC only. No report content or credentials cross this control channel. */
export function requestRuntimeAuthorization(nonce:string,request:RuntimeAdmission,signal:AbortSignal):Promise<boolean>{
 if(!process.connected||signal.aborted)return Promise.resolve(false);
 const id=randomUUID();
 return new Promise(resolve=>{
  const finish=(allowed=false)=>{clearTimeout(timer);process.off('message',receive);process.off('disconnect',end);signal.removeEventListener('abort',end);resolve(allowed);};
  const end=()=>finish();
  const receive=(raw:unknown)=>{if(!raw||typeof raw!=='object')return;const m=raw as Record<string,unknown>;
   if(m.type==='runtime-authorized'&&m.id===id&&m.nonce===nonce)finish(m.allowed===true&&!signal.aborted);
  };
  const timer=setTimeout(end,5000);
  process.on('message',receive);process.once('disconnect',end);signal.addEventListener('abort',end,{once:true});
  process.send?.({type:'runtime-authorize',nonce,id,request},error=>{if(error)end();});
 });
}
