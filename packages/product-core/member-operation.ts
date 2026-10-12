import {membershipRecord as closed,membershipUuid} from './member-analysis.ts';
import {desktopRuleFailure as fail} from './xanthil-desktop-decision-case.ts';
export type OperationPolicy=Readonly<{version:'1.0';id:string;revision:string;provider:'xiaomi-token-plan-cn';model:'mimo-v2.6-pro';purpose:'membership_analysis';consumption_policy:Readonly<{mode:'uncapped_metered'}>;model_retries:1;preparation_corrections:1;approval_reference:string;max_input_bytes:number;call_output_tokens:number;call_ms:number;process_seconds:number}>;
export function operationPolicy(value:unknown):OperationPolicy{
 const p=closed(value,['version','id','revision','provider','model','purpose','consumption_policy','model_retries','preparation_corrections','approval_reference','max_input_bytes','call_output_tokens','call_ms','process_seconds']);
 if(p.version!=='1.0'||!membershipUuid(p.id)||typeof p.revision!=='string'||! /^[1-9]\d*$/.test(p.revision)||p.provider!=='xiaomi-token-plan-cn'||p.model!=='mimo-v2.6-pro'||p.purpose!=='membership_analysis'||closed(p.consumption_policy,['mode']).mode!=='uncapped_metered'||p.model_retries!==1||p.preparation_corrections!==1||typeof p.approval_reference!=='string'||!p.approval_reference.trim())fail('AUTHORITY_REQUIRED');
 for(const key of ['max_input_bytes','call_output_tokens','call_ms','process_seconds'])if(!Number.isSafeInteger(p[key])||Number(p[key])<=0)fail();
 if(Number(p.process_seconds)>30)fail();return structuredClone(value) as OperationPolicy;
}
export type Meter=Readonly<{kind:'known';value:string}>|Readonly<{kind:'unknown';reason:string;known_lower_bound?:string}>;
export type OperationUsage=Readonly<{input_tokens:Meter;output_tokens:Meter;active_ms:Meter;wait_ms:Meter}>;
export type OperationExecution=Readonly<{execution_id:string;task_id:string;operation_id:string;execution_index:number;grant_id:string;epoch:number;phase:'reserved'|'issued'|'unresolved'|'settled';outcome:'succeeded'|'temporary_failure'|'conversion_failure'|'permanent_failure'|'stopped'|null;calls:number;local_runs:number;usage:OperationUsage}>;
export function operationUsage(value:unknown):OperationUsage{
 const u=closed(value,['input_tokens','output_tokens','active_ms','wait_ms']);
 for(const key of Object.keys(u)){
  const kind=(u[key] as {kind?:unknown})?.kind;
  const lower=kind==='unknown'&&Object.hasOwn(u[key] as object,'known_lower_bound');
  const m=closed(u[key],kind==='known'?['kind','value']:['kind','reason',...(lower?['known_lower_bound']:[])]);
  if(kind==='known'){if(typeof m.value!=='string'||!/^(0|[1-9]\d*)$/.test(m.value)||m.value.length>30)fail();}
  else if(kind!=='unknown'||typeof m.reason!=='string'||! /^[a-z0-9_-]{1,80}$/.test(m.reason)||lower&&(typeof m.known_lower_bound!=='string'||!/^(0|[1-9]\d*)$/.test(m.known_lower_bound)||m.known_lower_bound.length>30))fail();
 }return structuredClone(value) as OperationUsage;
}
export function reconcileOperationUsage(previous:OperationUsage,next:OperationUsage):OperationUsage{
 const merge=(old:Meter,now:Meter):Meter=>{const floor=BigInt(old.kind==='known'?old.value:old.known_lower_bound??'0');if(now.kind==='known'){if(BigInt(now.value)<floor)fail('CONSUMPTION_REGRESSION');return now;}const supplied=BigInt(now.known_lower_bound??'0');return {...now,known_lower_bound:String(supplied>floor?supplied:floor)};};
 return {input_tokens:merge(previous.input_tokens,next.input_tokens),output_tokens:merge(previous.output_tokens,next.output_tokens),active_ms:merge(previous.active_ms,next.active_ms),wait_ms:merge(previous.wait_ms,next.wait_ms)};
}
export const operationDigest=(x:unknown):x is string=>typeof x==='string'&&/^[a-f0-9]{64}$/.test(x);
