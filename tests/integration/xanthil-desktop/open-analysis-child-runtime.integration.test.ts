import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
import type {OpenAnalysisRun} from '../../../packages/ports/open-analysis-runtime.ts';
import type {AssistantTurn} from '../../../packages/contracts/case-assistant.ts';

test('OA-S06/C02: child consumes the existing Runtime with only authorized subset and exact result references',async()=>{
 const module=await import(pathToFileURL(resolve('adapters/agent-pi/open-analysis-collaboration.ts')).href);let calls=0,allowed=true;
 const owner={project_id:randomUUID(),session_id:randomUUID(),case_id:randomUUID(),revision_id:randomUUID()},reference={kind:'aggregate',id:randomUUID(),revision_id:owner.revision_id,version:null,sha256:'a'.repeat(64)};
 const context={source:{owner,case_name:'合成任务'},allowed_references:[reference],aggregate:{content:'已核验合计10'},selected_reports:[],selected_history:[],inherited_history:[],task:'检查汇总限制'};
 const inner={run:async(i:OpenAnalysisRun)=>{calls++;assert.ok(!i.prompt.includes('unselected-secret'));assert.deepEqual(i.tools.map(t=>t.name),['read_authorized_context','ask_user','finish_result']);const data=await i.tools[0]!.execute({},i.signal);assert.deepEqual(data,context);const finish=i.tools[2]!;const schema=finish.parameters as {properties:{reference_indices:{items:{maximum?:number};uniqueItems?:boolean}}};assert.equal(schema.properties.reference_indices.items.maximum,0,'only one aggregate citation is authorized, irrespective of its internal JSON pointer count');assert.equal(schema.properties.reference_indices.uniqueItems,true);await assert.rejects(()=>finish.execute({summary:'越界引用',reference_indices:[1],limitations:[],unknowns:[]},i.signal),{code:'RESULT_OUTSIDE_AUTHORIZATION'});await i.tools[2]!.execute({summary:'意见与限制',reference_indices:[0],limitations:['模型意见不是独立核验'],unknowns:[]},i.signal);return {text:'结果已保存',tools:[]};}};
 const runtime=module.createOpenAnalysisCollaborationRuntime({runtime:inner,authorizeSource:()=>allowed});
 const input:AssistantTurn={provider:'minimax-cn',model:'MiniMax-M3',cost_reservation_microunits:1,signal:new AbortController().signal,payload:JSON.stringify({authorized_context:context,visible_message:'检查汇总限制',current_attempt_history:[],authorized_tool_result:null}),collaboration:{contract_version:'1.1',purpose:'subagent'}};
 const request={identity:{task_id:randomUUID(),revision:'1',run_id:randomUUID(),attempt_id:randomUUID(),operation_id:randomUUID(),grant_id:randomUUID(),scope_sha256:'b'.repeat(64),config_sha256:'c'.repeat(64)},authorize:()=>true,saveContinuation:async()=>{}};
 const result=await runtime.turn({...input,open_analysis:request});assert.equal(calls,1);assert.equal(result.cost_microunits,null);assert.equal(result.output.kind,'result');assert.deepEqual(result.output.references,[reference]);allowed=false;await assert.rejects(()=>runtime.turn({...input,open_analysis:request}),{code:'AUTHORITY_REQUIRED'});assert.equal(calls,1);
});

test('V13-METER01: production child Adapter preserves the root Task and business conversation metadata',async()=>{
 const {createOpenAnalysisCollaborationRuntime}=await import('../../../adapters/agent-pi/open-analysis-collaboration.ts');
 const child=randomUUID(),root=randomUUID(),owner={project_id:randomUUID(),session_id:root,case_id:root,revision_id:randomUUID()};
 const reference={kind:'case' as const,id:root,revision_id:owner.revision_id,version:null,sha256:null},context={source:{owner},allowed_references:[reference],task:'检查授权说明'};
 let observed=false;
 const runtime=createOpenAnalysisCollaborationRuntime({authorizeSource:()=>true,runtime:{run:async input=>{
  assert.equal(input.identity.task_id,root);assert.equal(input.conversation_id,child);observed=true;
  await input.tools.find(t=>t.name==='finish_result')!.execute({summary:'仅为模型意见',reference_indices:[0],limitations:['未独立核验'],unknowns:[]},input.signal);
  return {text:'完成',tools:[]};
 }}});
 const input:AssistantTurn={provider:'minimax-cn',model:'MiniMax-M3',cost_reservation_microunits:1,signal:new AbortController().signal,payload:JSON.stringify({authorized_context:context,visible_message:'检查说明',current_attempt_history:[],authorized_tool_result:null}),collaboration:{contract_version:'1.1',purpose:'subagent'},open_analysis:{conversation_id:child,identity:{task_id:root,revision:'1',run_id:randomUUID(),attempt_id:randomUUID(),operation_id:randomUUID(),grant_id:randomUUID(),scope_sha256:'a'.repeat(64),config_sha256:'b'.repeat(64)},authorize:()=>true,saveContinuation:async()=>{}}};
 await runtime.turn(input);assert.equal(observed,true);
});

test('V13-INSTRUCTION-CORRECT02: repeated invalid child delegation stops rather than repairing, expanding or creating material',async()=>{
 const {createOpenAnalysisCollaborationRuntime}=await import('../../../adapters/agent-pi/open-analysis-collaboration.ts');
 const owner={project_id:randomUUID(),session_id:randomUUID(),case_id:randomUUID(),revision_id:randomUUID()},material=randomUUID();let queues=0;
 const runtime=createOpenAnalysisCollaborationRuntime({authorizeSource:()=>true,collaboration:()=>({materials:async()=>[{material_id:material,label:'选定汇总',verification:'parent_selected'}],queue:async()=>{queues++;throw Object.assign(new Error('DELEGATION_INSTRUCTION_INVALID'),{code:'DELEGATION_INSTRUCTION_INVALID',safe_details:{reason:'completion_path_not_selected'}});},drain:async()=>{},results:async()=>[]}),runtime:{run:async input=>{
  const catalog=await input.tools.find(t=>t.name==='read_delegation_materials')!.execute({},input.signal) as {material_id:string}[];
  const delegate=input.tools.find(t=>t.name==='delegate_analysis')!;
  const args={kind:'subagent',task:'检查限制',material_id:catalog[0]!.material_id,instruction:{action:'check_limitations',reference_paths:['/verification'],completion_reference_paths:['/calculation']}};
  const first=await delegate.execute(args,input.signal) as {status:string;created:boolean};assert.equal(first.status,'needs_instruction_correction');assert.equal(first.created,false);
  await assert.rejects(()=>delegate.execute(args,input.signal),{code:'DELEGATION_CORRECTION_EXHAUSTED'});
  throw Object.assign(new Error('DELEGATION_CORRECTION_EXHAUSTED'),{code:'DELEGATION_CORRECTION_EXHAUSTED'});
 }}});
 const input:AssistantTurn={provider:'minimax-cn',model:'MiniMax-M3',cost_reservation_microunits:1,signal:new AbortController().signal,payload:JSON.stringify({authorized_context:{source:{owner},allowed_references:[{kind:'aggregate',id:material,revision_id:owner.revision_id,version:null,sha256:'a'.repeat(64)}]},visible_message:'检查限制',current_attempt_history:[],authorized_tool_result:null}),collaboration:{contract_version:'1.1',purpose:'subagent'},open_analysis:{conversation_id:randomUUID(),identity:{task_id:owner.session_id,revision:'1',run_id:randomUUID(),attempt_id:randomUUID(),operation_id:randomUUID(),grant_id:randomUUID(),scope_sha256:'a'.repeat(64),config_sha256:'b'.repeat(64)},authorize:()=>true,saveContinuation:async()=>{}}};
 await assert.rejects(()=>runtime.turn(input),{code:'DELEGATION_CORRECTION_EXHAUSTED'});assert.equal(queues,2);
});
