import {mkdirSync} from 'node:fs';
import {createRuntime,createPiTransport,RuntimeFault,ProviderFailure,type ModelConfig,type ModelTransport} from 'pi-agent-runtime';
import {createPersistentRuntimeState,approvedUncappedAnalysisLimits} from './persistent-runtime-state.ts';
import type {ConnectionProbe} from '../../packages/ports/provider-settings.ts';
const taskId='connection-test-xiaomi-pro-v1';
const model:ModelConfig={provider:'xiaomi-token-plan-cn',id:'mimo-v2.6-pro',protocol:'openai-completions',endpoint:'https://token-plan-cn.xiaomimimo.com/v1',contextWindow:1048576,maxOutputTokens:128};
function fail(code:string):never{throw Object.assign(new Error(code),{code,stack:code});}
/** Explicit fixed-text settings action. Never reads/discovers a credential or starts on construction. */
export function createPiConnectionProbe(config:{root:string;modelTransport?:ModelTransport;fetch?:typeof globalThis.fetch}):ConnectionProbe{
 return async(key,signal)=>{
  if(signal.aborted)fail('CANCELLED');
  mkdirSync(config.root,{recursive:true,mode:0o700});
  const state=createPersistentRuntimeState({projectRoot:config.root});
  if(state.hasUnsettledModel(taskId))fail('REQUEST_UNCONFIRMED');
  let providerFailure:string|undefined;
  const fetch:typeof globalThis.fetch=async(url,options)=>{const response=await (config.fetch??globalThis.fetch)(url,options);if(response.status===401||response.status===403)providerFailure='CREDENTIAL_INVALID';return response;};
  const call=config.modelTransport??createPiTransport({model,apiKey:key,fetch});
  const transport:ModelTransport=async request=>{try{return await call(request);}catch(error){if(error instanceof ProviderFailure)providerFailure=error.category==='quota'||error.category==='rate-limit'?'QUOTA_EXCEEDED':error.category==='network'?'NETWORK_UNAVAILABLE':'CONNECTION_FAILED';throw error;}};
  const runtime=createRuntime({model,transport,budgets:state.budgets,audit:state.audit,authorize:async(action,s)=>!s.aborted&&!signal.aborted&&action.taskId===taskId});
  let result;
  try{result=await runtime.runText({taskId,prompt:'Reply with OK.',system:'',limits:{...approvedUncappedAnalysisLimits,maxOutputTokens:128},modelRecovery:{extraAttempts:0},signal});}catch(error){if(signal.aborted)fail('CANCELLED');if(error instanceof RuntimeFault)fail(error.reason);fail('CONNECTION_FAILED');}
  if(signal.aborted)fail('CANCELLED');
  if(result.status!=='succeeded'){const code=result.reason;fail(code==='DEADLINE_EXCEEDED'?'CONNECTION_TIMEOUT':code==='CANCELLED'?'CANCELLED':providerFailure??'CONNECTION_FAILED');}
  if(!['OK','OK.'].includes(result.value.trim()))fail('CONNECTION_FAILED');
 };
}
