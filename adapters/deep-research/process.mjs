import {spawn} from 'node:child_process';
import {randomBytes,randomUUID} from 'node:crypto';
import {mkdirSync,realpathSync} from 'node:fs';
import {join,dirname} from 'node:path';
import {verifyResearchBundle} from './bundle.mjs';

/** One lazy owned process per host task. No inherited credentials or independent app directories. */
export function createResearchProcess({programRoot,manifestSha256,dataRoot,authorize=async()=>false,hostOrigin,fixtureModule,credentialEnvironment={},pythonExecutable,authorizedAttachments=[]}) {
  const allowedCredentials=new Set(['MINIMAX_CN_API_KEY','MINIMAX_API_KEY','MOONSHOT_API_KEY','KIMI_API_KEY','ZAI_API_KEY','ANTHROPIC_API_KEY','OPENAI_API_KEY','XIAOMI_TOKEN_PLAN_CN_API_KEY','XIAOMI_TOKEN_PLAN_AMS_API_KEY','XIAOMI_TOKEN_PLAN_SGP_API_KEY','VOLCENGINE_PLAN_API_KEY']);
  if(Object.entries(credentialEnvironment).some(([key,value])=>!allowedCredentials.has(key)||typeof value!=='string'||value.includes('\0')))throw Error('DR_ENVIRONMENT_DENIED');
  const credentials=Object.freeze({...credentialEnvironment});
  let starting,child,origin,exitPromise,dead=false,closed=false,failedBeforeSpawn=false;const pending=new Map();
  const ownerToken=randomBytes(32).toString('hex');
  function request(kind){return new Promise((resolve,reject)=>{
    if(!child?.connected||dead){reject(Error('DR_SERVICE_UNAVAILABLE'));return;}
    const id=randomUUID(),timer=setTimeout(()=>{pending.delete(id);reject(Error('DR_REPLY_UNKNOWN'));},10000);
    pending.set(id,{resolve,reject,timer});child.send({kind,id});
  });}
  async function start(){
    if(dead||closed)throw Error('DR_SERVICE_UNAVAILABLE');if(starting)return starting;
    starting=(async()=>{
      verifyResearchBundle(programRoot,manifestSha256);
      mkdirSync(dataRoot,{recursive:true,mode:0o700});if(realpathSync(dataRoot)!==dataRoot)throw Error('DR_DATA_ROOT_INVALID');
      for(const dir of ['home','tmp'])mkdirSync(join(dataRoot,dir),{recursive:true,mode:0o700});
      const nonce=randomUUID();
      child=spawn(join(programRoot,'node'),[join(programRoot,'child.mjs')],{cwd:programRoot,stdio:['ignore','ignore','ignore','ipc'],env:{...credentials,HOME:join(dataRoot,'home'),TMPDIR:join(dataRoot,'tmp'),PATH:dirname(join(programRoot,'node')),LANG:'en_US.UTF-8',NODE_ENV:'production'}});
      exitPromise=new Promise(resolve=>child.once('exit',(code,signal)=>resolve({code,signal})));
      child.on('exit',()=>{dead=true;for(const p of pending.values()){clearTimeout(p.timer);p.reject(Error('DR_REPLY_UNKNOWN'));}pending.clear();});
      child.on('message',message=>{
        if(message?.kind==='authorize'){
          void Promise.resolve().then(()=>authorize(message.request)).then(allowed=>{if(child.connected)child.send({kind:'authority',id:message.id,allowed:allowed===true});},()=>{if(child.connected)child.send({kind:'authority',id:message.id,allowed:false});});return;
        }
        const p=pending.get(message?.id);if(p){clearTimeout(p.timer);pending.delete(message.id);message.kind==='reply'?p.resolve(message.value):p.reject(Error(message.code??'DR_REQUEST_FAILED'));}
      });
      await new Promise((resolve,reject)=>{
        const timer=setTimeout(()=>{child.kill('SIGTERM');reject(Error('DR_START_TIMEOUT'));},15000);
        const cleanup=()=>{clearTimeout(timer);child.off('message',onMessage);child.off('error',onError);child.off('exit',onExit);};
        const onError=()=>{cleanup();reject(Error('DR_START_FAILED'));};const onExit=()=>{cleanup();reject(Error('DR_START_FAILED'));};
        const onMessage=m=>{if(m?.kind==='ready'&&m.nonce===nonce&&/^http:\/\/127\.0\.0\.1:[1-9][0-9]*$/.test(m.origin)){origin=m.origin;cleanup();resolve();}else if(m?.kind==='error'){cleanup();child.kill('SIGTERM');reject(Error('DR_START_FAILED'));}};
        child.on('message',onMessage);child.once('error',onError);child.once('exit',onExit);
        child.send({kind:'initialize',nonce,programRoot,dataRoot,ownerToken,hostOrigin,pythonExecutable,authorizedAttachments,...(fixtureModule?{fixtureModule}:{})});
      });
    })().catch(error=>{if(!child){failedBeforeSpawn=true;dead=true;}throw error;});return starting;
  }
  return {
    async launch(){await start();return request('launch');},
    async api(path,body){await start();if(!/^\/api\/[A-Za-z0-9_/%?=&:.-]+$/.test(path)||path.includes('..'))throw Error('DR_PATH_INVALID');
      const r=await fetch(origin+path,{method:body===undefined?'GET':'POST',headers:{'x-research-owner':ownerToken,...(body===undefined?{}:{'content-type':'application/json'})},...(body===undefined?{}:{body:JSON.stringify(body)}),redirect:'error',signal:AbortSignal.timeout(30000)});
      const parts=[];let size=0;for await(const chunk of r.body){size+=chunk.length;if(size>64*1024*1024)throw Error('DR_RESPONSE_LIMIT');parts.push(chunk);}const bytes=new Uint8Array(Buffer.concat(parts));if(!r.ok)throw Object.assign(Error('DR_REQUEST_REJECTED'),{status:r.status});return {bytes,mediaType:r.headers.get('content-type')};
    },
    async state(){if(closed||!starting)return {started:false,unknown:false,active:0,effects:0};try{await starting;}catch(error){if(!failedBeforeSpawn)throw error;return {started:false,unavailable:true,unknown:false,active:0,effects:0};}return request('state');},
    async close(){if(!starting||closed)return;try{await starting;}catch(error){if(!failedBeforeSpawn)throw error;closed=true;return;}const result=await request('close');if(!result?.closed)throw Error('DR_STOP_UNKNOWN');let timer;try{const ended=await Promise.race([exitPromise,new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('DR_STOP_UNKNOWN')),10000);})]);if(ended.code!==0||ended.signal)throw Error('DR_STOP_UNKNOWN');closed=true;}finally{clearTimeout(timer);}},
  };
}
