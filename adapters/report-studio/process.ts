import {spawn,type ChildProcess} from 'node:child_process';
import {randomBytes} from 'node:crypto';
import {lstat,mkdir,realpath} from 'node:fs/promises';
import {dirname,isAbsolute,join,resolve,sep} from 'node:path';
import {createReportStudioGateway,type ReportStudioConnection,type ReportStudioLifecycle} from './gateway.ts';
import {parseReportStudioOwnerRequest,parseReportStudioOwnerValue,type ReportStudioOwnerRequest,type ReportStudioOwnerValue,type ReportStudioOwnerReply} from '../../packages/contracts/report-studio.ts';

export type ReportStudioProcessConfig={node:string;entry:string;programRoot:string;dataRoot:string;webDist:string;browserRoot?:string;pluginVersion:string;sourceCommit:string;startupMs?:number;stopMs?:number;ownerRequest?(request:ReportStudioOwnerRequest):Promise<ReportStudioOwnerValue>};
type Session=Readonly<{origin:string;gateway:ReportStudioConnection}>;
function failure():Error {return Object.assign(new Error('RS_STUDIO_PROCESS_UNAVAILABLE'),{code:'RS_STUDIO_PROCESS_UNAVAILABLE'});}
/** Private launcher: caller must verify pinned resources before providing them. */
export function createReportStudioProcess(config:ReportStudioProcessConfig):{start():Promise<Session>;current():Session|null;close():Promise<void>;lifecycle():Promise<ReportStudioLifecycle>;exitIntent(intent:'wait'|'stop'|'cancel'):Promise<ReportStudioLifecycle>} {
  const startup=config.startupMs??15000,stop=config.stopMs??2000;
  if(![config.node,config.entry,config.programRoot,config.dataRoot,config.webDist,...(config.browserRoot?[config.browserRoot]:[])].every(isAbsolute)||![startup,stop].every(n=>Number.isSafeInteger(n)&&n>0&&n<=60000))throw failure();
  if(resolve(config.dataRoot)===resolve(config.programRoot)||resolve(config.dataRoot).startsWith(resolve(config.programRoot)+sep))throw failure();
  let child:ChildProcess|null=null,exited:Promise<void>|null=null,session:Session|null=null,starting:Promise<Session>|null=null,stopping:Promise<void>|null=null;
  const ownerWork=new Set<Promise<void>>();
  async function terminate() {
    const owned=child,done=exited;session=null;
    if(!owned||!done)return;
    if(owned.exitCode===null&&owned.signalCode===null)owned.kill('SIGTERM');
    let timer:ReturnType<typeof setTimeout>|undefined;
    try {
      await Promise.race([done,new Promise<void>(r=>{timer=setTimeout(r,stop);})]);
      if(timer)clearTimeout(timer);
      if(child===owned){owned.kill('SIGKILL');await Promise.race([done,new Promise<never>((_r,reject)=>{timer=setTimeout(()=>reject(failure()),stop);})]);}
    }finally{if(timer)clearTimeout(timer);}
  }
  async function launch():Promise<Session> {
    try {
      for(const path of [config.programRoot,config.node,config.entry]) {
        const s=await lstat(path);if(s.isSymbolicLink()||!(path===config.programRoot?s.isDirectory():s.isFile()))throw failure();
      }
      if(!config.entry.startsWith(config.programRoot+sep))throw failure();
      if(config.browserRoot&&await realpath(config.browserRoot)!==resolve(config.browserRoot))throw failure();
      await mkdir(config.dataRoot,{recursive:true,mode:0o700});
      if(await realpath(config.dataRoot)!==resolve(config.dataRoot))throw failure();
      const home=join(config.dataRoot,'.home'),tmp=join(config.dataRoot,'.tmp');
      for(const path of [home,tmp]){await mkdir(path,{recursive:true,mode:0o700});const s=await lstat(path);if(s.isSymbolicLink()||!s.isDirectory())throw failure();}
      const ownerToken=randomBytes(32).toString('hex');
      const owned=spawn(config.node,[config.entry],{cwd:config.programRoot,env:{PATH:dirname(config.node)+':/usr/bin:/bin',HOME:home,TMPDIR:tmp,LANG:'zh_CN.UTF-8',REPORT_STUDIO_BUILTIN:'1',NODE_ENV:'production',...(config.browserRoot?{PLAYWRIGHT_BROWSERS_PATH:config.browserRoot}:{})},stdio:['ignore','ignore','ignore','ipc']});
      child=owned;
      owned.on('message',raw=>{
        if(!raw||typeof raw!=='object'||Array.isArray(raw)||(raw as {type?:unknown}).type!=='owner_request')return;
        const requestId=(raw as {request_id?:unknown}).request_id;if(typeof requestId!=='string'||!/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(requestId))return;
        const work=(async()=>{
          let reply:ReportStudioOwnerReply;
          try{
            const request=parseReportStudioOwnerRequest(raw);
            if(child!==owned||!session||!config.ownerRequest||ownerWork.size>=32)throw Object.assign(Error('RS_OWNER_UNAVAILABLE'),{code:'RS_OWNER_UNAVAILABLE'});
            const value=parseReportStudioOwnerValue(await config.ownerRequest(request),request);reply={type:'owner_reply',version:'1',request_id:requestId,ok:true,value};
          }catch(error){const code=(error as {code?:unknown})?.code;reply={type:'owner_reply',version:'1',request_id:requestId,ok:false,error:typeof code==='string'&&/^RS_[A-Z0-9_]{1,80}$/.test(code)?code:'RS_OWNER_UNAVAILABLE'};}
          if(child===owned&&owned.connected)await new Promise<void>(resolve=>{try{owned.send(reply,()=>resolve());}catch{resolve();}});
        })();ownerWork.add(work);void work.then(()=>ownerWork.delete(work),()=>ownerWork.delete(work));
      });
      exited=new Promise<void>(r=>owned.once('close',()=>{if(child===owned){child=null;session=null;}r();}));
      const ready=await new Promise<Session>((accept,reject)=>{
        let admitted=false,settled=false;
        const finish=(value?:Session)=>{if(settled)return;settled=true;clearTimeout(timer);owned.off('message',onMessage);owned.off('error',end);owned.off('close',end);if(value)accept(value);else reject(failure());};
        const timer=setTimeout(()=>finish(),startup);
        const end=()=>finish();owned.once('error',end);owned.once('close',end);
        const onMessage=async(raw:unknown)=>{
          if(admitted)return;admitted=true;
          try {
            if(!raw||typeof raw!=='object'||Array.isArray(raw))throw failure();const m=raw as Record<string,unknown>;
            if(Object.keys(m).sort().join(',')!=='origin,plugin_version,protocol_version,source_commit,type'||m.type!=='ready'||m.protocol_version!=='1'||m.plugin_version!==config.pluginVersion||m.source_commit!==config.sourceCommit||typeof m.origin!=='string')throw failure();
            const gateway=createReportStudioGateway({origin:m.origin,ownerToken,pluginVersion:config.pluginVersion,sourceCommit:config.sourceCommit,timeoutMs:startup});await gateway.verify();
            if(child!==owned||owned.exitCode!==null||owned.signalCode!==null)throw failure();finish({origin:m.origin,gateway});
          }catch{finish();}
        };
        owned.on('message',onMessage);
        // Retain an error listener after admission; never forward secret-bearing child output.
        owned.on('error',()=>{});
        owned.send({dataRoot:config.dataRoot,webDist:config.webDist,ownerToken,pluginVersion:config.pluginVersion},error=>{if(error)finish();});
      });
      session=ready;return ready;
    }catch{await terminate();throw failure();}
  }
  function start():Promise<Session> {
    if(stopping)return Promise.reject(failure());if(session)return Promise.resolve(session);if(starting)return starting;
    starting=launch().finally(()=>{starting=null;});return starting;
  }
  function close():Promise<void> {
    if(stopping)return stopping;
    stopping=(async()=>{if(starting){try{await starting;}catch{}}if(ownerWork.size||session&&!await session.gateway.prepareClose())throw Object.assign(new Error('RS_PROJECT_PENDING'),{code:'RS_PROJECT_PENDING'});await terminate();})().finally(()=>{stopping=null;});return stopping;
  }
  const idle=():ReportStudioLifecycle=>({intent:'none',pending:false,request_count:0,configuration_unknown:false,operations:[]});
  async function lifecycle(){if(starting)await starting;const state=session?await session.gateway.lifecycle():idle();return {...state,pending:state.pending||ownerWork.size>0,request_count:state.request_count+ownerWork.size};}
  async function exitIntent(intent:'wait'|'stop'|'cancel'){if(!['wait','stop','cancel'].includes(intent))throw failure();if(starting)await starting;const state=session?await session.gateway.exitIntent(intent):idle();return {...state,pending:state.pending||ownerWork.size>0,request_count:state.request_count+ownerWork.size};}
  return {start,current:()=>session,close,lifecycle,exitIntent};
}
