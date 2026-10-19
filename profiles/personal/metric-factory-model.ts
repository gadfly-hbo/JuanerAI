import {mkdirSync,readFileSync,openSync,writeFileSync,fsyncSync,closeSync,renameSync,lstatSync,realpathSync,readdirSync} from 'node:fs';
import {join} from 'node:path';
import type {createProviderSettings} from '../../packages/application/provider-settings.ts';
import type {MetricModelAccess} from './metric-factory.ts';

/** The user's bounded integration trial, not the membership-analysis policy. */
export const metricFactoryTrialGrant = Object.freeze({version:1,scope:'synthetic-integration-validation',authorizationReference:'user-2026-10-19-mimo-flash-6-tasks-8-requests'});
// Stable original trial identity: the explicit six-task grant extends, never resets, this ledger.
const trialLedgerReference='user-2026-10-19-mimo-flash-4-tasks-8-requests';
const model=Object.freeze({provider:'xiaomi-token-plan-cn',id:'mimo-v2.6-flash',protocol:'openai-completions',endpoint:'https://token-plan-cn.xiaomimimo.com/v1',contextWindow:128000,maxOutputTokens:16384,input:['text']});
type State={version:1;authorizationReference:string;tasks:Record<string,{requests:number;state:'active'|'settled'|'unknown'}>};
const validId=(id:string)=>/^[a-f0-9-]{36}$/.test(id);
const fail=(code:string):never=>{throw Error(code);};

/** No I/O on construction. Opening the plugin never reads a credential. */
export function createPersonalMetricModel(input:{settings:Pick<ReturnType<typeof createProviderSettings>,'initialize'|'access'|'taskCredential'>;directory:string;authorized:()=>boolean}):MetricModelAccess {
 let active:string|undefined,acquiring=false,poisoned=false,lease:{release():void}|undefined;
 const stateDir=join(input.directory,'model-admission'),file=join(stateDir,'state.json');
 const allowed=()=>!poisoned&&input.authorized();
 function load():State {
  let created=false;
  try{mkdirSync(stateDir,{mode:0o700});created=true;}catch(error){if((error as NodeJS.ErrnoException).code!=='EEXIST')throw error;}
  if(realpathSync(stateDir)!==stateDir||!lstatSync(stateDir).isDirectory())fail('MF_MODEL_HISTORY_INVALID');
  if(created){
   // A missing admission directory is not a fresh trial when supplier history survives.
   try{if(readdirSync(join(input.directory,'runtime')).length)fail('MF_MODEL_HISTORY_INVALID');}catch(error){if((error as NodeJS.ErrnoException).code!=='ENOENT')throw error;}
   const state:State={version:1,authorizationReference:trialLedgerReference,tasks:{}};persist(state,true);return state;}
  if(realpathSync(file)!==file||!lstatSync(file).isFile()||lstatSync(file).size>65536)fail('MF_MODEL_HISTORY_INVALID');
  const s=JSON.parse(readFileSync(file,'utf8')) as State;
  if(s.version!==1||s.authorizationReference!==trialLedgerReference||!s.tasks||typeof s.tasks!=='object'||Array.isArray(s.tasks))fail('MF_MODEL_HISTORY_INVALID');
  for(const [id,t] of Object.entries(s.tasks))if(!validId(id)||!t||!Number.isSafeInteger(t.requests)||t.requests<0||!['active','settled','unknown'].includes(t.state))fail('MF_MODEL_HISTORY_INVALID');
  if(Object.keys(s.tasks).length>6||Object.values(s.tasks).reduce((n,t)=>n+t.requests,0)>8)fail('MF_MODEL_HISTORY_INVALID');
  return s;
 }
 function persist(state:State,initial=false){
  try{const path=initial?file:file+'.tmp',fd=openSync(path,initial?'wx':'w',0o600);
   try{writeFileSync(fd,JSON.stringify(state));fsyncSync(fd);}finally{closeSync(fd);}
   if(!initial)renameSync(path,file);
   const dir=openSync(stateDir,'r');try{fsyncSync(dir);}finally{closeSync(dir);}
  }catch(error){poisoned=true;throw error;}
 }
 return {
  configured(){try{return allowed();}catch{return false;}},
  async configuration(taskId){
   if(!validId(taskId))fail('MF_TASK_INVALID');
   if(!allowed())fail('MF_MODEL_AUTHORITY_REQUIRED');
   if(active||acquiring)fail('MF_MODEL_BUSY');
   acquiring=true;
   try{
    const s=load();
    if(Object.values(s.tasks).some(t=>t.state!=='settled'))fail('MF_MODEL_UNSETTLED');
    // Completed trial tasks are not silently resumed with another configuration.
    if(Object.hasOwn(s.tasks,taskId)||Object.keys(s.tasks).length>=6||Object.values(s.tasks).reduce((n,t)=>n+t.requests,0)>=8)fail('MF_MODEL_BUDGET_EXHAUSTED');
    await input.settings.initialize();
    if(!allowed())fail('MF_MODEL_AUTHORITY_REQUIRED');
    const snapshot=input.settings.access.snapshot();
    if(!snapshot.available)fail('MF_MODEL_UNAVAILABLE');
    lease=await input.settings.access.acquire(snapshot.generation,{session_id:null,label:'分析体系 · Metric Factory'});
    if(!allowed())fail('MF_MODEL_AUTHORITY_REQUIRED');
    const apiKey=input.settings.taskCredential();
    const historyRequired=Object.keys(s.tasks).length>0;
    s.tasks[taskId]={requests:0,state:'active'};persist(s);active=taskId;
    return {historyRequired,model:structuredClone(model),apiKey,limits:{cumulative:'unlimited',maxOutputTokens:16384,modelTimeoutMs:300000,toolTimeoutMs:1000,controlTimeoutMs:5000},caps:{maxCalls:8}};
   }catch(error){if(!poisoned){lease?.release();lease=undefined;}throw error;}finally{acquiring=false;}
  },
  async authorize(request){
   try{
    if(!allowed()||request.taskId!==active||!lease)return false;
    input.settings.taskCredential();
    const s=load(),t=s.tasks[request.taskId];if(!t||t.state!=='active')return false;
    if(request.kind==='publish')return t.requests>0;
    if(request.kind!=='model'||request.provider!==model.provider||request.model!==model.id||request.endpoint!==model.endpoint)return false;
    if(Object.values(s.tasks).reduce((n,x)=>n+x.requests,0)>=8)return false;
    t.requests++;persist(s);return true;
   }catch{poisoned=true;return false;}
  },
  async settled(taskId,known){
   if(taskId!==active)return;
   const s=load(),t=s.tasks[taskId];if(!t)fail('MF_MODEL_HISTORY_INVALID');
   if(t.state==='unknown')fail('MF_MODEL_UNSETTLED');
   t.state=known?'settled':'unknown';persist(s);
   if(known){active=undefined;lease?.release();lease=undefined;}
  }
 };
}

/** An explicit host-local grant enables only the bounded synthetic trial above. */
export function readPersonalMetricTrialGrant(path:string):boolean {
 try{if(realpathSync(path)!==path||!lstatSync(path).isFile()||lstatSync(path).size>4096)return false;
  const x=JSON.parse(readFileSync(path,'utf8'));
  return Object.keys(x).length===4&&x.enabled===true&&Object.entries(metricFactoryTrialGrant).every(([key,value])=>x[key]===value);
 }catch{return false;}
}
