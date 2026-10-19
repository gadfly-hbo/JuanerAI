import {setImmediate as yieldIO} from 'node:timers/promises';
import {createHash} from 'node:crypto';
import {RuntimeFault,type Tool,type ToolView,type JsonObject,type JsonValue} from 'pi-agent-runtime';
import {captureAnalysisToolContracts} from './analysis-tool-contracts.ts';
import type {AnalysisTool,OpenAnalysisRun} from '../../packages/ports/open-analysis-runtime.ts';

const digest=(value:unknown)=>createHash('sha256').update(JSON.stringify(value)).digest('hex');

/** Business bindings only. The SDK owns preparation, schema intersection,
 * whole-batch admission, feedback, correction counters and stopping. */
export function firstLoopBusinessTools(current:()=>OpenAnalysisRun,additional:readonly AnalysisTool[]=[]):readonly Tool[]{
  const upper=captureAnalysisToolContracts([...(current().capabilityTools??current().tools),...additional],true);
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
  const declared=new Set(visible.map(t=>t.name)),catalog=business.filter(t=>t.name!=='read_tool_contract');
  const tools=[...visible.filter(t=>t.name!=='read_tool_contract'||!discovery||catalog.length>0).map(t=>{
    const parameters=structuredClone(t.modelParameters??t.parameters) as JsonObject;
    if(discovery&&t.name==='read_tool_contract'){
      const properties=parameters.properties as JsonObject;
      properties.name={...properties.name as JsonObject,enum:catalog.map(tool=>tool.name)};
      return {name:t.name,description:t.description+'\nCurrent stage catalog (names are discovery choices, not executable declarations):\n'+catalog.map(tool=>declared.has(tool.name)
        ?tool.name+': declared; business prerequisites still apply'
        :tool.name+': contract_required; next_call=read_tool_contract('+JSON.stringify({name:tool.name})+'); not executable in this request.\n'+tool.description).join('\n'),parameters};
    }
    return {name:t.name,description:t.description,parameters};
  }),...native.map(t=>({name:t.name,description:t.description,parameters:t.parameters}))];
  return {version:'juanerai-stage-v02:'+digest(tools),tools};
}
