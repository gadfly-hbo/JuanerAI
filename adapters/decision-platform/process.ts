import { spawn, type ChildProcess } from 'node:child_process';
import { createHash, randomBytes } from 'node:crypto';
import { lstat, mkdir, readFile, realpath, readdir, rmdir, writeFile, unlink } from 'node:fs/promises';
import { dirname, isAbsolute, join, resolve, sep } from 'node:path';
import { request } from 'node:http';
import type {RuntimeAdmission} from './runtime-authorization.ts';
import { DatabaseSync } from 'node:sqlite';

export type DecisionProcessConfig = {
  node: { path: string; sha256: string }; entry: { path: string; sha256: string };
  programRoot: string; dataRoot: string; sourceCommit: string;
  authorize?: (request:RuntimeAdmission)=>Promise<boolean>;
  canStop: () => Promise<boolean>; startupMs?: number; stopMs?: number;
};
type Session = { readProjects():Promise<unknown>; readBoard(projectId:string):Promise<unknown>; runtimeState(projectId?:string):Promise<{active:boolean;unknown:boolean}>; pid:number; origin:string; request(path:string,method?:'GET'|'POST'|'PATCH',body?:unknown):Promise<unknown> };
const fail=(code:string)=>Object.assign(new Error(code),{code});

/** Private owner process, not a browser proxy or an arbitrary-command launcher. */
export function createDecisionPlatformProcess(config: DecisionProcessConfig): {
 start():Promise<Session>; close():Promise<void>; state(): 'idle'|'starting'|'ready'|'unknown';
} {
 const startupMs=config.startupMs??15000,stopMs=config.stopMs??2000;
 let phase:'idle'|'starting'|'ready'|'unknown'='idle';
 let child:ChildProcess|null=null,session:Session|null=null,starting:Promise<Session>|null=null,closing:Promise<void>|null=null;
 let exited:Promise<{code:number|null;signal:NodeJS.Signals|null}>|null=null;
 let owner='',nonce='',lockOwned=false,requestCount=0;
 const root=resolve(config.dataRoot),lock=join(root,'.host-lock');
 if(![config.programRoot,config.dataRoot,config.node.path,config.entry.path].every(isAbsolute)
   || !/^[a-f0-9]{40}$/.test(config.sourceCommit)
   || ![startupMs,stopMs].every(n=>Number.isSafeInteger(n)&&n>0&&n<=60000))throw fail('DP_FIXED_IDENTITY');

 async function fixedIdentity(){
  if(await realpath(config.programRoot)!==resolve(config.programRoot))throw fail('DP_FIXED_IDENTITY');
  if(!resolve(config.entry.path).startsWith(resolve(config.programRoot)+sep))throw fail('DP_FIXED_IDENTITY');
  for(const file of [config.node,config.entry]){
   const stat=await lstat(file.path);
   if(!stat.isFile()||stat.isSymbolicLink()||await realpath(file.path)!==resolve(file.path)
    ||! /^[a-f0-9]{64}$/.test(file.sha256)||createHash('sha256').update(await readFile(file.path)).digest('hex')!==file.sha256)throw fail('DP_FIXED_IDENTITY');
  }
 }
 async function dataRoot(){
  if(root===resolve(config.programRoot)||root.startsWith(resolve(config.programRoot)+sep)
    ||await realpath(dirname(root))!==dirname(root))throw fail('DP_DATA_ROOT');
  const identity=JSON.stringify({format:'juanerai-decision-platform-data-v1',sourceCommit:config.sourceCommit});
  try{
   await mkdir(root,{mode:0o700});
   await writeFile(join(root,'.host-identity.json'),identity,{flag:'wx',mode:0o600});
  }catch(error){if((error as NodeJS.ErrnoException).code!=='EEXIST')throw error;}
  try{
   if(await realpath(root)!==root||(await lstat(root)).isSymbolicLink())throw fail('DP_DATA_ROOT');
   const marker=join(root,'.host-identity.json'),stat=await lstat(marker);
   if(!stat.isFile()||stat.isSymbolicLink()||stat.nlink!==1||await readFile(marker,'utf8')!==identity)throw fail('DP_DATA_ROOT');
  }catch{throw fail('DP_DATA_ROOT');}
  try{await mkdir(lock,{mode:0o700});lockOwned=true;await writeFile(join(lock,'owner'),nonce,{flag:'wx',mode:0o600});}
  catch{throw fail('DP_DATA_BUSY');}
  async function inspectTree(path:string):Promise<void>{
   for(const name of await readdir(path)){
    const entry=join(path,name),stat=await lstat(entry);
    if(stat.isSymbolicLink()||(!stat.isFile()&&!stat.isDirectory())||stat.isFile()&&stat.nlink!==1)throw fail('DP_DATA_ROOT');
    if(stat.isDirectory())await inspectTree(entry);
   }
  }
  await inspectTree(root);
  const dbPath=join(root,'board.db');
  try{
   await lstat(dbPath);
   const db=new DatabaseSync(dbPath,{readOnly:true});
   try{if(!db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='projects'").get())throw fail('DP_DATA_ROOT');}
   finally{db.close();}
  }catch(error){if((error as NodeJS.ErrnoException).code!=='ENOENT')throw fail('DP_DATA_ROOT');}
  for(const name of ['.home','.tmp']){
   const path=join(root,name);await mkdir(path,{recursive:true,mode:0o700});
   if(await realpath(path)!==path||!(await lstat(path)).isDirectory())throw fail('DP_DATA_ROOT');
  }
 }
 async function releaseLock(){
  if(!lockOwned||await readFile(join(lock,'owner'),'utf8')!==nonce)throw fail('DP_DATA_BUSY');
  await unlink(join(lock,'owner'));await rmdir(lock);lockOwned=false;
 }
 function send(value:unknown):Promise<void>{
  const owned=child;if(!owned?.connected)return Promise.reject(fail('DP_PROCESS_UNKNOWN'));
  return new Promise((accept,reject)=>{owned.send(value as object,error=>error?reject(fail('DP_PROCESS_UNKNOWN')):accept());});
 }
 function message(type:string,timeout:number):Promise<Record<string,unknown>>{
  const owned=child!;
  return new Promise((accept,reject)=>{
   const timer=setTimeout(()=>finish(),timeout);
   const end=()=>finish();
   const receive=(raw:unknown)=>{
    if(!raw||typeof raw!=='object'||Array.isArray(raw))return finish();
    const value=raw as Record<string,unknown>;
    if(['runtime-authorize','runtime-state-result','board-result','projects-result'].includes(String(value.type))&&value.nonce===nonce)return;
    if(value.type!==type||value.nonce!==nonce)return finish();finish(value);
   };
   function finish(value?:Record<string,unknown>){clearTimeout(timer);owned.off('message',receive);owned.off('close',end);owned.off('error',end);value?accept(value):reject(fail('DP_PROCESS_UNKNOWN'));}
   owned.on('message',receive);owned.once('close',end);owned.once('error',end);
  });
 }
 async function terminateStartup(){
  const owned=child;if(!owned||!exited)return;
  owned.kill('SIGTERM');
  let timer:ReturnType<typeof setTimeout>|undefined;
  await Promise.race([exited,new Promise<void>(r=>{timer=setTimeout(()=>{owned.kill('SIGKILL');r();},stopMs);})]);
  if(timer)clearTimeout(timer);
  await exited;
 }
 async function launch():Promise<Session>{
  phase='starting';
  let spawned=false;
  try{
   await fixedIdentity();nonce=randomBytes(32).toString('hex');owner=randomBytes(32).toString('hex');await dataRoot();
   const owned=spawn(config.node.path,[config.entry.path],{cwd:config.programRoot,
    env:{PATH:dirname(config.node.path)+':/usr/bin:/bin',HOME:join(root,'.home'),TMPDIR:join(root,'.tmp'),LANG:'zh_CN.UTF-8',NODE_ENV:'production'},stdio:['ignore','ignore','ignore','ipc']});
   child=owned;
   spawned=true;
   exited=new Promise(r=>owned.once('close',(code,signal)=>{if(child===owned){child=null;session=null;if(phase!=='idle')phase='unknown';}r({code,signal});}));
   owned.on('error',()=>{});
   owned.on('message',(raw:unknown)=>{
    if(!raw||typeof raw!=='object')return;
    const m=raw as Record<string,unknown>;
    if(m.type!=='runtime-authorize'||m.nonce!==nonce||typeof m.id!=='string')return;
    void (async()=>{
     let allowed=false;
     try{allowed=phase==='ready'&&Boolean(await config.authorize?.(m.request as RuntimeAdmission));}catch{/* Deny on authority failure. */}
     if(child===owned&&owned.connected)owned.send({type:'runtime-authorized',nonce,id:m.id,allowed:allowed&&phase==='ready'},()=>{});
    })();
   });
   const ready=message('ready',startupMs);
   // Attach rejection immediately, including a send failure before awaiting ready.
   void ready.catch(()=>{});
   await send({type:'initialize',nonce,ownerToken:owner,dataRoot:root,sourceCommit:config.sourceCommit});
   const m=await ready;
   if(m.pid!==owned.pid||m.sourceCommit!==config.sourceCommit||typeof m.origin!=='string'
    ||!/^http:\/\/127\.0\.0\.1:[1-9][0-9]{0,4}$/.test(m.origin)||new URL(m.origin).port===''||child!==owned)throw fail('DP_START_FAILED');
   const origin=m.origin;
   function inspect(type:'runtime-state'|'board'|'projects',projectId?:string):Promise<unknown>{
    if(phase!=='ready'||closing||child!==owned)return Promise.reject(fail('DP_PROCESS_UNKNOWN'));
    const id=randomBytes(16).toString('hex');
    return new Promise((accept,reject)=>{
     const end=()=>finish();const timer=setTimeout(end,startupMs);
     const receive=(raw:unknown)=>{if(!raw||typeof raw!=='object')return;const m=raw as Record<string,unknown>;
      if(m.type===type+'-result'&&m.nonce===nonce&&m.id===id)finish(m.value,m.failed===true);
     };
     function finish(value?:unknown,failed=false){clearTimeout(timer);owned.off('message',receive);owned.off('close',end);value!==undefined&&!failed?accept(value):reject(fail('DP_PROCESS_UNKNOWN'));}
     owned.on('message',receive);owned.once('close',end);owned.send({type,nonce,id,projectId},error=>{if(error)end();});
    });
   }
   const value:Session={pid:owned.pid!,origin,
    readProjects(){return inspect('projects');},
    readBoard(projectId){return inspect('board',projectId);},
    async runtimeState(projectId){const v=await inspect('runtime-state',projectId) as {active?:unknown;unknown?:unknown};
     if(typeof v?.active!=='boolean'||typeof v.unknown!=='boolean')throw fail('DP_PROCESS_UNKNOWN');return {active:v.active,unknown:v.unknown};},
    async request(path,method='GET',body){
    if(phase!=='ready'||closing||child!==owned)throw fail('DP_PROCESS_UNKNOWN');
    if(!/^\/api\/[A-Za-z0-9_-]+(?:\/[A-Za-z0-9_-]+)*$/.test(path)||!['GET','POST','PATCH'].includes(method))throw fail('DP_REQUEST_INVALID');
    const payload=body===undefined?undefined:JSON.stringify(body);requestCount++;
    try{return await new Promise((accept,reject)=>{
     const req=request(origin+path,{method,headers:{'x-decision-owner':owner,...(payload===undefined?{}:{'content-type':'application/json'})},signal:AbortSignal.timeout(startupMs)},res=>{
      let bytes=0;const chunks:Buffer[]=[];
      res.on('data',(chunk:Buffer)=>{bytes+=chunk.length;if(bytes>16*1024*1024){res.destroy(fail('DP_RESPONSE_INVALID'));return;}chunks.push(chunk);});
      res.on('error',()=>reject(fail('DP_EFFECT_UNKNOWN')));
      res.on('end',()=>{try{if(!res.complete)throw fail('DP_EFFECT_UNKNOWN');if(res.statusCode!==200&&res.statusCode!==201)throw fail('DP_REQUEST_REJECTED');accept(JSON.parse(Buffer.concat(chunks).toString('utf8')));}catch(error){reject(error);}});
     });req.on('error',()=>reject(fail('DP_EFFECT_UNKNOWN')));req.end(payload);
    });}finally{requestCount--;}
   }};
   session=value;phase='ready';return value;
  }catch(error){
   await terminateStartup();phase=lockOwned?'unknown':'idle';
   if(spawned)throw fail('DP_START_FAILED');throw error;
  }
 }
 function start(){
  if(phase==='unknown'||closing)return Promise.reject(fail('DP_PROCESS_UNKNOWN'));
  if(session)return Promise.resolve(session);if(starting)return starting;
  starting=launch().finally(()=>{starting=null;});return starting;
 }
 function close():Promise<void>{
  if(closing)return closing;
  closing=(async()=>{
   if(starting)await starting;
   if(!child){if(phase==='unknown')throw fail('DP_PROCESS_UNKNOWN');return;}
   if(requestCount||!await config.canStop()||requestCount)throw fail('DP_BUSY_OR_UNKNOWN');
   const quiet=message('quiesced',stopMs);void quiet.catch(()=>{});
   try{
    await send({type:'quiesce',nonce});const m=await quiet;if(m.busy===true)throw fail('DP_BUSY_OR_UNKNOWN');if(m.failed===true)throw fail('DP_PROCESS_UNKNOWN');
   }catch(error){if((error as Error).message==='DP_BUSY_OR_UNKNOWN')throw error;phase='unknown';throw fail('DP_PROCESS_UNKNOWN');}
   const done=exited!;await send({type:'shutdown',nonce});
   let timer:ReturnType<typeof setTimeout>|undefined;
   try{const result=await Promise.race([done,new Promise<never>((_,reject)=>{timer=setTimeout(()=>reject(fail('DP_PROCESS_UNKNOWN')),stopMs);})]);
    if(result.code!==0||result.signal!==null)throw fail('DP_PROCESS_UNKNOWN');await releaseLock();phase='idle';session=null;
   }catch{phase='unknown';throw fail('DP_PROCESS_UNKNOWN');}finally{if(timer)clearTimeout(timer);}
  })().finally(()=>{closing=null;});return closing;
 }
 return {start,close,state:()=>phase};
}
