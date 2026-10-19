import {spawn,type ChildProcess} from 'node:child_process';
import {randomBytes,randomUUID} from 'node:crypto';
import {mkdirSync,realpathSync,writeFileSync,readFileSync,rmdirSync,unlinkSync,lstatSync} from 'node:fs';
import {join,isAbsolute} from 'node:path';
import {verifyMetricBundle} from './bundle.ts';
export function createMetricProcess(options:{programRoot:string;manifestSha256:string;dataRoot:string;reviewer:string;configured:()=>boolean;owner:(operation:string,value:unknown)=>Promise<unknown>}){
 let child:ChildProcess|undefined,starting:Promise<void>|undefined,closed=false,dead=false,locked=false,exited:Promise<{code:number|null;signal:NodeJS.Signals|null}>|undefined;
 const owner=randomBytes(32).toString('hex'),nonce=randomUUID(),pending=new Map<string,{resolve:(v:unknown)=>void;reject:(e:Error)=>void;timer:ReturnType<typeof setTimeout>}>();
 const command=(operation:string):Promise<any>=>new Promise((resolve,reject)=>{
  if(!child?.connected||dead){reject(Error('MF_INSTANCE_UNAVAILABLE'));return;}
  const id=randomUUID(),timer=setTimeout(()=>{pending.delete(id);reject(Error('MF_REPLY_UNKNOWN'));},10000);pending.set(id,{resolve,reject,timer});child.send({kind:'command',id,operation});
 });
 const start=()=>starting??=(async()=>{
  if(closed||dead)throw Error('MF_INSTANCE_UNAVAILABLE');
  const manifest=verifyMetricBundle(options.programRoot,options.manifestSha256),root=options.dataRoot;
  if(!isAbsolute(root)||root===options.programRoot||root.startsWith(options.programRoot+'/'))throw Error('MF_DATA_ROOT');
  mkdirSync(root,{recursive:true,mode:0o700});if(realpathSync(root)!==root)throw Error('MF_DATA_ROOT');
  const marker=join(root,'identity.json'),identity=JSON.stringify({version:1,sourceSnapshot:manifest.sourceSnapshot});
  try{writeFileSync(marker,identity,{flag:'wx',mode:0o600});}catch(e){if((e as NodeJS.ErrnoException).code!=='EEXIST')throw e;if(!lstatSync(marker).isFile()||realpathSync(marker)!==marker||readFileSync(marker,'utf8')!==identity)throw Error('MF_DATA_IDENTITY');}
  mkdirSync(join(root,'.owner'),{mode:0o700});locked=true;writeFileSync(join(root,'.owner/token'),owner,{flag:'wx',mode:0o600});
  for(const dir of ['home','tmp'])mkdirSync(join(root,dir),{recursive:true,mode:0o700});
  child=spawn(join(options.programRoot,'node'),[join(options.programRoot,'dist/integration.js')],{cwd:options.programRoot,stdio:['ignore','ignore','ignore','ipc'],env:{HOME:join(root,'home'),TMPDIR:join(root,'tmp'),PATH:options.programRoot,NODE_ENV:'production',LANG:'en_US.UTF-8'}});
  exited=new Promise(resolve=>child!.once('exit',(code,signal)=>resolve({code,signal})));
  child.on('exit',()=>{dead=true;for(const p of pending.values()){clearTimeout(p.timer);p.reject(Error('MF_REPLY_UNKNOWN'));}pending.clear();});
  child.on('message',(message:any)=>{
   if(message?.kind==='owner'&&typeof message.id==='string'){
    void options.owner(message.operation,message.value).then(value=>{if(child?.connected)child.send({kind:'owner-reply',id:message.id,ok:true,value});},()=>{if(child?.connected)child.send({kind:'owner-reply',id:message.id,ok:false});});return;
   }
   if(message?.kind==='reply'){const p=pending.get(message.id);if(!p)return;clearTimeout(p.timer);pending.delete(message.id);message.ok?p.resolve(message.value):p.reject(Error('MF_REQUEST_REJECTED'));}
  });
  await new Promise<void>((resolve,reject)=>{
   const timer=setTimeout(()=>{cleanup();child?.kill('SIGTERM');reject(Error('MF_START_UNKNOWN'));},15000);
   const cleanup=()=>{clearTimeout(timer);child?.off('message',ready);child?.off('error',fail);child?.off('exit',fail);};
   const fail=()=>{cleanup();reject(Error('MF_START_FAILED'));};
   const ready=(m:any)=>{if(m?.kind==='ready'&&m.nonce===nonce&&/^http:\/\/127\.0\.0\.1:[1-9][0-9]*$/.test(m.origin)){cleanup();resolve();}else if(m?.kind==='failed'){cleanup();reject(Error('MF_START_FAILED'));}};
   child!.on('message',ready);child!.once('error',fail);child!.once('exit',fail);
   child!.send({kind:'initialize',nonce,owner,dataRoot:root,programRoot:options.programRoot,reviewer:options.reviewer,modelConfigured:options.configured()});
  });
 })();
 return {
  async launch(){await start();const result=await command('launch');if(typeof result?.url!=='string'||!/^http:\/\/127\.0\.0\.1:[1-9][0-9]*\/\?host-launch=[a-f0-9]{64}$/.test(result.url))throw Error('MF_LAUNCH_INVALID');return result.url as string;},
  async state(){if(!starting)return {active:false,unknown:false,requests:0};await starting;const x=await command('state');if(typeof x?.active!=='boolean'||typeof x?.unknown!=='boolean'||!Number.isSafeInteger(x.requests)||x.requests<0)throw Error('MF_STATE_UNKNOWN');return x as {active:boolean;unknown:boolean;requests:number};},
  async close(){if(closed||!starting)return;await starting;const result=await command('close');if(result?.closed!==true)throw Error('MF_STOP_UNKNOWN');let timer:ReturnType<typeof setTimeout>|undefined;try{const end=await Promise.race([exited!,new Promise<never>((_,reject)=>{timer=setTimeout(()=>reject(Error('MF_STOP_UNKNOWN')),10000);})]);if(end.code!==0||end.signal)throw Error('MF_STOP_UNKNOWN');}finally{clearTimeout(timer);}if(locked){const lock=join(options.dataRoot,'.owner');if(readFileSync(join(lock,'token'),'utf8')!==owner)throw Error('MF_OWNER_UNKNOWN');unlinkSync(join(lock,'token'));rmdirSync(lock);locked=false;}closed=true;},
 };
}
