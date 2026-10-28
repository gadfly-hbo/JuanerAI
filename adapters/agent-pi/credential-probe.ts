import {randomUUID,createHash} from 'node:crypto';
import {createRuntime,createPiTransport} from 'pi-agent-runtime';
import type {ConnectionProbe} from '../../packages/ports/provider-settings.ts';
import {createPiBusinessPersistence} from './persistent-runtime-state.ts';
import {professionalAgentLimits,professionalRequestAdmission} from './professional-agent.ts';

/** An explicitly requested settings operation, using the same public executor
 * and durable physical accounting. Construction never reads a key or sends IO. */
export function createPiCredentialProbe(options:{projectRoot:string;fetch?:typeof globalThis.fetch}):ConnectionProbe{
 const model={provider:'xiaomi-token-plan-cn',id:'mimo-v2.6-flash',protocol:'openai-completions' as const,endpoint:'https://token-plan-cn.xiaomimimo.com/v1',contextWindow:1048576,maxOutputTokens:32768,reasoning:true,thinkingProtocol:'mimo-chat' as const};
 const configuration=createHash('sha256').update(JSON.stringify({model,limits:professionalAgentLimits,requestAdmission:professionalRequestAdmission,purpose:'credential_probe'})).digest('hex');
 return async(key,signal)=>{
  if(signal.aborted)throw Object.assign(Error('CANCELLED'),{code:'CANCELLED'});
  const id=randomUUID();
  const state=createPiBusinessPersistence({projectRoot:options.projectRoot,isAuthorized:(grant,phase)=>grant.work_id===id&&(phase==='record'||phase==='read'||!signal.aborted)});
  state.bindBusinessWork({work_id:id,task_id:id,command_id:id,config_sha256:configuration,purposes:['credential_probe'],recovery_limit:0});
  const transport=createPiTransport({model,apiKey:key,...(options.fetch?{fetch:options.fetch}:{})});
  const engine=createRuntime({model,transport,purposes:[{id:'credential_probe',mode:'text',model,transport,thinkingLevel:'off'}],budgets:state.budgets,audit:state.audit,authorize:async(_action,callSignal)=>!signal.aborted&&!callSignal.aborted,contextAdmission:professionalRequestAdmission});
  const result=await engine.runText({taskId:id,purpose:'credential_probe',work:{ref:id,chain:id,limit:0},prompt:'Reply briefly to confirm this explicitly requested connection test.',limits:professionalAgentLimits,modelRecovery:{extraAttempts:0},signal});
  if(result.status==='succeeded')return;
  const category=result.modelOutcome?.category;
  const code=category==='authentication'?'CREDENTIAL_INVALID':category==='quota'?'QUOTA_EXCEEDED':result.reason==='DEADLINE_EXCEEDED'?'CONNECTION_TIMEOUT':category==='network'?'NETWORK_UNAVAILABLE':'CONNECTION_FAILED';
  throw Object.assign(Error(code),{code,model_outcome:result.modelOutcome});
 };
}
