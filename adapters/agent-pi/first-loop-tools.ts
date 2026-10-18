import {setImmediate as yieldIO} from 'node:timers/promises';
import {createHash} from 'node:crypto';
import {RuntimeFault,type Tool,type ToolView,type JsonObject,type JsonValue} from 'pi-agent-runtime';
import {captureAnalysisToolContracts} from './analysis-tool-contracts.ts';
import type {OpenAnalysisRun} from '../../packages/ports/open-analysis-runtime.ts';

const digest=(value:unknown)=>createHash('sha256').update(JSON.stringify(value)).digest('hex');

/** Business bindings only. The SDK owns preparation, schema intersection,
 * whole-batch admission, feedback, correction counters and stopping. */
export function firstLoopBusinessTools(current:()=>OpenAnalysisRun):readonly Tool[]{
  const upper=captureAnalysisToolContracts(current().capabilityTools??current().tools,true);
  return upper.map(source=>({
    name:source.name,description:source.description,parameters:source.parameters as JsonObject,
    effect:'write',resourceUnits:1,executionMode:'sequential',
    policyVersion:'juanerai-harness-v02:'+source.contract_sha256,
    argumentPolicy:source.argument_policy==='native-pi-v1'?'native':'strict',
    async execute(args,signal){
      const input=current();
      const check=()=>{if(signal.aborted||input.signal.aborted||current()!==input)throw new RuntimeFault('CANCELLED');if(!input.authorize())throw new RuntimeFault('AUTHORITY_REQUIRED');};
      check();await yieldIO();check();
      const tool=input.tools.find(t=>t.name===source.name);
      if(!tool)throw new RuntimeFault('AUTHORITY_REQUIRED');
      if(input.shouldYield?.()&&!(source.name==='delegate_analysis'&&input.canQueueDelegation?.()))throw new RuntimeFault('BUSINESS_WAIT');
      // No JSON wire protocol, converter, schema repair or replacement executor.
      return await tool.execute(args,AbortSignal.any([signal,input.signal])) as JsonValue;
    },
  }));
}

export function firstLoopToolView(input:OpenAnalysisRun,native:readonly Tool[],focused?:string):ToolView{
  const business=captureAnalysisToolContracts(input.tools,true);
  // Reuse the product's existing progressive contract catalog and its 8192-byte
  // boundary. A complex contract is either fully present or absent; no broad
  // placeholder or second transport schema. Discovery never adds authority.
  const discovery=input.toolDiscovery&&business.some(t=>t.name==='read_tool_contract');
  const visible=business.filter(t=>!discovery||t.name===focused||Buffer.byteLength(JSON.stringify(t.modelParameters??t.parameters))<=8192);
  const tools=[...visible.map(t=>({name:t.name,description:t.description,parameters:structuredClone(t.modelParameters??t.parameters) as JsonObject})),
    ...native.map(t=>({name:t.name,description:t.description,parameters:t.parameters}))];
  return {version:'juanerai-stage-v02:'+digest(tools),tools};
}
