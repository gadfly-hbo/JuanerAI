import {operationPolicy,type OperationPolicy} from './member-operation.ts';
import {taskHash,fail} from './member-task.ts';
/** Published technical identity of the accepted Change005 D4 configuration; not account activation. */
export const approvedMembershipPolicy:OperationPolicy=Object.freeze({version:'1.0',id:'d244ce8c-ecb2-4b72-997a-56ca19e59094',revision:'1',provider:'xiaomi-token-plan-cn',model:'mimo-v2.6-pro',purpose:'membership_analysis',consumption_policy:Object.freeze({mode:'uncapped_metered'}),model_retries:1,preparation_corrections:1,approval_reference:'Change005/D4/product-bfffd9fa8b4a5bc877052b934b55f1ed285b04775aa423453d933d4be067b7c7',max_input_bytes:12000,call_output_tokens:2048,call_ms:60000,process_seconds:4});
export function approvedMemberPolicy(value:unknown):OperationPolicy{try{const policy=operationPolicy(value);if(taskHash(policy)!==taskHash(approvedMembershipPolicy))fail('MODEL_POLICY_INVALID');return policy;}catch{fail('MODEL_POLICY_INVALID');}}
