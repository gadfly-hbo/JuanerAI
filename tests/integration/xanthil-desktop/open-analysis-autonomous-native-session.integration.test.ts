import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,readdirSync,readFileSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {randomUUID} from 'node:crypto';
import {DatabaseSync} from 'node:sqlite';
import {browserEvidenceRoot} from '../../fixtures/xanthil-desktop/browser-evidence.ts';
import {createPiSessionOpenAnalysisRuntime} from '../../../adapters/agent-pi/native-open-analysis.ts';
import {createApprovedProviderCredentials} from '../../../adapters/agent-pi/provider-credentials.ts';
import {createLocalAnalysisRequestLedger} from '../../../adapters/storage-local/analysis-request-ledger.ts';
import {createPersistentRuntimeState} from '../../../adapters/agent-pi/persistent-runtime-state.ts';
import {createOpenAnalysisApplication} from '../../../packages/application/open-analysis.ts';
import {taskHash} from '../../../packages/product-core/member-task.ts';
import type {MemberSourceInspection} from '../../../packages/ports/member-source.ts';
import type {ModelTransport} from 'pi-agent-runtime';

test('OA-SOURCE-RESULT01: native inspect_selected keeps complete row counts and a bounded model preview for large selected CSVs',async()=>{
 const rows=Array.from({length:6001},(_,index)=>index===0?{row:1,cells:[{column:'A',type:'string' as const,value:'画像标签'},{column:'B',type:'string' as const,value:'画像值'}]}:{row:index+1,cells:[{column:'A',type:'string' as const,value:'标签'+index},{column:'B',type:'string' as const,value:'值'.repeat(120)+index}]});
 const source:MemberSourceInspection={version:'1.0',sources:[{source_id:randomUUID(),display_name:'large.csv',format:'csv',sha256:'a'.repeat(64),byte_length:'1',sheets:[{sheet_id:'csv',name:'CSV',state:'visible',rows}]}]};
 assert.ok(Buffer.byteLength(JSON.stringify(source))>1024*1024,'precondition: complete inspection exceeds the native tool-result limit');
 const root=mkdtempSync(join(browserEvidenceRoot,'native-large-source-')),ledger=createLocalAnalysisRequestLedger({projectRoot:root});let calls=0,reads=0;
 const runtime=createPiSessionOpenAnalysisRuntime({projectRoot:root,ledger,nativeObjectArguments:true,credentials:createApprovedProviderCredentials({environment:{}}),modelTransport:async request=>{
  calls++;if(calls===1)return {content:[{kind:'tool',id:'inspect-large',name:'inspect_selected',arguments:{}}],stop:'tools',usage:{inputTokens:4,outputTokens:2}};
  const result=JSON.parse(request.messages.filter(message=>message.role==='tool').at(-1)!.text);
  assert.equal(result.sources[0].sheets[0].full_data_rows,6000);assert.ok(Buffer.byteLength(JSON.stringify(result))<=768*1024);assert.deepEqual(result.sources[0].sheets[0].rows[0],source.sources[0]!.sheets[0]!.rows[0]);assert.ok(result.sources[0].sheets[0].rows.length<source.sources[0]!.sheets[0]!.rows.length);
  return {content:[{kind:'text',text:'已读取完整行数和有界预览。'}],stop:'complete',usage:{inputTokens:4,outputTokens:2}};
 }});
 const identity={task_id:randomUUID(),revision:'1',run_id:randomUUID(),attempt_id:randomUUID(),operation_id:randomUUID(),grant_id:randomUUID(),scope_sha256:taskHash(source),config_sha256:'c'.repeat(64)};
 const app=createOpenAnalysisApplication({runtime,loadSelectedSource:async()=>{reads++;return source;},isAuthorized:()=>true,saveFramework:async()=>assert.fail('inspection-only run must not save a framework'),verify:async()=>assert.fail('inspection-only run must not verify'),saveOutcome:async()=>assert.fail('inspection-only run must not save an outcome')});
 await assert.rejects(()=>app.run({identity,question:'读取所选大表',signal:new AbortController().signal}),{code:'ANALYSIS_INCOMPLETE'});
 assert.equal(calls,2);assert.ok(reads>=1);assert.equal(source.sources[0]!.sheets[0]!.rows.length,6001);assert.equal(ledger.pending().length,0);
});

test('OA-SOURCE-RESULT02: bounded inspection gives every wide selected sheet explicit column counts and header structure',async()=>{
 const makeSource=(name:string)=>{const cells=Array.from({length:10000},(_,index)=>({column:'C'+index,type:'string' as const,value:`字段-${name}-${index}`}));return {source_id:randomUUID(),display_name:name+'.csv',format:'csv' as const,sha256:'a'.repeat(64),byte_length:'1',sheets:[{sheet_id:'csv',name:'CSV',state:'visible' as const,rows:[{row:1,cells},{row:2,cells:cells.map(cell=>({...cell,value:'值-'+cell.column}))}]}]};};
 const source:MemberSourceInspection={version:'1.0',sources:[makeSource('甲'),makeSource('乙')]};
 assert.ok(Buffer.byteLength(JSON.stringify(source))>1024*1024,'precondition: complete wide inspection exceeds the native tool-result limit');
 const root=mkdtempSync(join(browserEvidenceRoot,'native-wide-source-')),ledger=createLocalAnalysisRequestLedger({projectRoot:root});let calls=0;
 const runtime=createPiSessionOpenAnalysisRuntime({projectRoot:root,ledger,nativeObjectArguments:true,credentials:createApprovedProviderCredentials({environment:{}}),modelTransport:async request=>{
  calls++;if(calls===1)return {content:[{kind:'tool',id:'inspect-wide',name:'inspect_selected',arguments:{}}],stop:'tools',usage:{inputTokens:4,outputTokens:2}};
  const result=JSON.parse(request.messages.filter(message=>message.role==='tool').at(-1)!.text);
  assert.ok(Buffer.byteLength(JSON.stringify(result))<=768*1024);assert.deepEqual(result.sources.map((item:any)=>item.sheets[0].full_column_count),[10000,10000]);assert.ok(result.sources.every((item:any)=>item.sheets[0].rows[0].cells.length>0));
  return {content:[{kind:'text',text:'已读取每个工作表的字段规模和有界结构。'}],stop:'complete',usage:{inputTokens:4,outputTokens:2}};
 }});
 const identity={task_id:randomUUID(),revision:'1',run_id:randomUUID(),attempt_id:randomUUID(),operation_id:randomUUID(),grant_id:randomUUID(),scope_sha256:taskHash(source),config_sha256:'c'.repeat(64)},app=createOpenAnalysisApplication({runtime,loadSelectedSource:async()=>source,isAuthorized:()=>true,saveFramework:async()=>assert.fail('inspection-only run must not save a framework'),verify:async()=>assert.fail('inspection-only run must not verify'),saveOutcome:async()=>assert.fail('inspection-only run must not save an outcome')});
 await assert.rejects(()=>app.run({identity,question:'读取两个超宽工作表',signal:new AbortController().signal}),{code:'ANALYSIS_INCOMPLETE'});assert.equal(calls,2);assert.equal(ledger.pending().length,0);
});

test('OA-SOURCE-RESULT03: oversized header values keep every selected sheet bindable with explicit truncation metadata',async()=>{
 const sources=Array.from({length:32},(_,index)=>({source_id:randomUUID(),display_name:`header${index}.csv`,format:'csv' as const,sha256:'a'.repeat(64),byte_length:'24579',sheets:[{sheet_id:'csv',name:'CSV',state:'visible' as const,rows:[{row:1,cells:[{column:'A',type:'string' as const,value:'字段'.repeat(4096)}]},{row:2,cells:[{column:'A',type:'string' as const,value:'1'}]}]}]})),source:MemberSourceInspection={version:'1.0',sources},fullBytes=Buffer.byteLength(JSON.stringify(source));
 assert.ok(fullBytes>768*1024&&fullBytes<1024*1024,`precondition: complete inspection fits the native ceiling but exceeds the model preview budget, received ${fullBytes}`);
 const root=mkdtempSync(join(browserEvidenceRoot,'native-many-headers-')),ledger=createLocalAnalysisRequestLedger({projectRoot:root});let calls=0;
 const runtime=createPiSessionOpenAnalysisRuntime({projectRoot:root,ledger,nativeObjectArguments:true,credentials:createApprovedProviderCredentials({environment:{}}),modelTransport:async request=>{
  calls++;if(calls===1)return {content:[{kind:'tool',id:'inspect-many-headers',name:'inspect_selected',arguments:{}}],stop:'tools',usage:{inputTokens:4,outputTokens:2}};
  const result=JSON.parse(request.messages.filter(message=>message.role==='tool').at(-1)!.text);
  assert.ok(Buffer.byteLength(JSON.stringify(result))<=768*1024);assert.equal(result.sources.length,32);assert.ok(result.sources.every((item:any)=>{const sheet=item.sheets[0],header=sheet.rows[0].cells[0];return sheet.full_column_count===1&&sheet.rows.length===2&&sheet.rows[0].cells.length===1&&header.column==='A'&&header.value_truncated===true&&header.full_value_bytes===24576;}));
  return {content:[{kind:'text',text:'已读取全部工作表的可绑定列标识和显式截断表头。'}],stop:'complete',usage:{inputTokens:4,outputTokens:2}};
 }});
 const identity={task_id:randomUUID(),revision:'1',run_id:randomUUID(),attempt_id:randomUUID(),operation_id:randomUUID(),grant_id:randomUUID(),scope_sha256:taskHash(source),config_sha256:'c'.repeat(64)},app=createOpenAnalysisApplication({runtime,loadSelectedSource:async()=>source,isAuthorized:()=>true,saveFramework:async()=>assert.fail('inspection-only run must not save a framework'),verify:async()=>assert.fail('inspection-only run must not verify'),saveOutcome:async()=>assert.fail('inspection-only run must not save an outcome')});
 await assert.rejects(()=>app.run({identity,question:'读取全部小表',signal:new AbortController().signal}),{code:'ANALYSIS_INCOMPLETE'});assert.equal(calls,2);assert.equal(ledger.pending().length,0);
});

test('OA-SOURCE-RESULT04: bounded inspection reserves a bindable column for every sheet before spending preview bytes',async()=>{
 const sources=Array.from({length:32},(_,sourceIndex)=>({source_id:randomUUID(),display_name:`workbook${sourceIndex}.xlsx`,format:'xlsx' as const,sha256:'a'.repeat(64),byte_length:'84257',sheets:Array.from({length:64},(_,sheetIndex)=>({sheet_id:`sheet-${sheetIndex}`,name:`Sheet${sheetIndex+1}`,state:'visible' as const,rows:[{row:1,cells:[{column:'A',type:'string' as const,value:'字段'.repeat(128)}]},{row:2,cells:[{column:'A',type:'string' as const,value:'1'}]}]}))})),source:MemberSourceInspection={version:'1.0',sources};
 assert.ok(Buffer.byteLength(JSON.stringify(source))>1024*1024,'precondition: complete many-sheet inspection exceeds the native tool-result limit');
 const root=mkdtempSync(join(browserEvidenceRoot,'native-many-sheets-')),ledger=createLocalAnalysisRequestLedger({projectRoot:root});let calls=0;
 const runtime=createPiSessionOpenAnalysisRuntime({projectRoot:root,ledger,nativeObjectArguments:true,credentials:createApprovedProviderCredentials({environment:{}}),modelTransport:async request=>{
  calls++;if(calls===1)return {content:[{kind:'tool',id:'inspect-many-sheets',name:'inspect_selected',arguments:{}}],stop:'tools',usage:{inputTokens:4,outputTokens:2}};
  const result=JSON.parse(request.messages.filter(message=>message.role==='tool').at(-1)!.text),sheets=result.sources.flatMap((item:any)=>item.sheets);
  assert.ok(Buffer.byteLength(JSON.stringify(result))<=768*1024);assert.equal(sheets.length,2048);assert.ok(sheets.every((sheet:any)=>sheet.full_column_count===1&&sheet.rows[0].cells.length===1&&sheet.rows[0].cells[0].column==='A'&&sheet.rows[0].cells[0].value_truncated===true&&sheet.rows[0].cells[0].full_value_bytes===768));
  return {content:[{kind:'text',text:'已读取全部工作表的可绑定列标识。'}],stop:'complete',usage:{inputTokens:4,outputTokens:2}};
 }});
 const identity={task_id:randomUUID(),revision:'1',run_id:randomUUID(),attempt_id:randomUUID(),operation_id:randomUUID(),grant_id:randomUUID(),scope_sha256:taskHash(source),config_sha256:'c'.repeat(64)},app=createOpenAnalysisApplication({runtime,loadSelectedSource:async()=>source,isAuthorized:()=>true,saveFramework:async()=>assert.fail('inspection-only run must not save a framework'),verify:async()=>assert.fail('inspection-only run must not verify'),saveOutcome:async()=>assert.fail('inspection-only run must not save an outcome')});
 await assert.rejects(()=>app.run({identity,question:'读取全部工作簿和工作表',signal:new AbortController().signal}),{code:'ANALYSIS_INCOMPLETE'});assert.equal(calls,2);assert.equal(ledger.pending().length,0);
});

for(const boundary of ['closed','new-revision','revoked','unknown','ambiguous','identity','new-scope','tool-effect','queued'] as const)test(`MF-STOP-01 (${boundary}): explicit continuation retires only a physically cancelled model with no tool or queued effect and retains UNKNOWN`,async()=>{
 const root=mkdtempSync(join(browserEvidenceRoot,'metric-cancelled-model-')),ledger=createLocalAnalysisRequestLedger({projectRoot:root}),controller=new AbortController();let calls=0,effects=0;
 const identity={task_id:randomUUID(),revision:'1',run_id:randomUUID(),attempt_id:randomUUID(),operation_id:randomUUID(),grant_id:randomUUID(),scope_sha256:'a'.repeat(64),config_sha256:'b'.repeat(64)};
 const base={identity,nativeBusinessTools:true,prompt:'合成净销售复盘',system:'只处理获准合成资料',tools:[{name:'calculate_and_verify',description:'current calculation',parameters:{type:'object',properties:{},additionalProperties:false},execute:async()=>{effects++;return {value:7};}}],signal:new AbortController().signal,authorize:()=>true};
 const make=(read=ledger.read)=>createPiSessionOpenAnalysisRuntime({projectRoot:root,nativeObjectArguments:true,ledger:{...ledger,read},credentials:createApprovedProviderCredentials({environment:{}}),modelTransport:async request=>{
  calls++;if(calls>1)return {content:[{kind:'text',text:'用户明确继续后得到的回答'}],stop:'complete',usage:{inputTokens:4,outputTokens:2}};
  if(boundary==='queued')await first.sessionControl!({...base,command:{kind:'followUp',text:'不得在恢复时重放的排队消息'}});
  return new Promise<never>((_,reject)=>{request.signal.addEventListener('abort',()=>reject(Object.assign(new Error('CANCELLED'),{code:'CANCELLED'})),{once:true});setImmediate(()=>controller.abort());});
 }});
 const first=make();await assert.rejects(()=>first.run({...base,signal:controller.signal}));await first.collect!(identity.task_id);
 const before=ledger.read(identity.task_id),state=createPersistentRuntimeState({projectRoot:root});assert.equal(before.length,1);assert.equal(before[0]!.status,'cancelled');assert.equal(before[0]!.usage.input_tokens.kind,'unknown');assert.equal(state.readAccounting(identity.task_id)!.reservations.length,1);
 writeFileSync(join(root,'stop-readback.json'),JSON.stringify({identity,rows:before,accounting:state.readAccounting(identity.task_id),audit:state.readAudit(identity.task_id)}));
 if(boundary==='tool-effect'){const admission=state.readAudit(identity.task_id).findLast(e=>e.kind==='model.admitted')!;await state.audit.append({...admission,kind:'tool.admitted',sequence:admission.sequence+1,toolName:'unconfirmed_tool'},base.signal);}
 const reopened=make(boundary==='unknown'?(task)=>ledger.read(task).map(row=>({...row,status:'unknown' as const})):boundary==='ambiguous'?(task)=>[...ledger.read(task),...ledger.read(task)]:ledger.read);assert.equal(calls,1,'reopening alone must not dispatch');
 if(boundary==='closed'){await reopened.sessionControl!({...base,command:{kind:'abort'}});assert.equal(calls,1,'explicit retirement itself must never dispatch');const result=await reopened.run(base);assert.match(result.text,/明确继续/);assert.equal(calls,2);const view=await reopened.sessionControl!({...base,command:{kind:'snapshot'}});assert.equal(view.view!.operationId,null);}
 else if(boundary==='new-revision'){const result=await reopened.run({...base,identity:{...identity,revision:'2',run_id:randomUUID(),attempt_id:randomUUID()}});assert.match(result.text,/明确继续/);assert.equal(calls,2);}
 else{await assert.rejects(()=>reopened.run({...base,identity:boundary==='identity'?{...identity,grant_id:randomUUID()}:boundary==='new-scope'?{...identity,scope_sha256:'c'.repeat(64)}:identity,authorize:()=>boundary!=='revoked'}));assert.equal(calls,1,'unconfirmed effects and queues must block new dispatch');}
 assert.equal(effects,0);assert.deepEqual(ledger.read(identity.task_id).slice(0,1),before);assert.equal(state.readAccounting(identity.task_id)!.reservations.length,1);assert.equal(state.readAccounting(identity.task_id)!.usage.reservedOutputTokens,4096);
});

for(const scenario of ['duplicate-paths','over-total','one-twelve','two-six','eight-one'] as const)test(`V13-DELEGATION115 (${scenario}): native schema enforces the existing common-path limits before business effects and retains all boundary choices`,async()=>{
 const {delegationToolSchema}=await import('../../../packages/application/open-analysis-delegation.ts');
 const {Check}=await import('typebox/value');
 const root=mkdtempSync(join(browserEvidenceRoot,'native-delegation-cardinality-')),ledger=createLocalAnalysisRequestLedger({projectRoot:root});let calls=0,effects=0;
 const invalid=scenario==='duplicate-paths'||scenario==='over-total';
 const count=scenario==='one-twelve'?1:scenario==='two-six'?2:8;
 const paths=scenario==='one-twelve'?12:scenario==='two-six'?6:scenario==='over-total'?2:1;
 const common=Array.from({length:paths},(_,i)=>'/fact'+i);
 const exact={kind:'subagent',task:'核对已选业务摘要',action:'check_consistency',material_ids:Array.from({length:count},(_,i)=>'material:'+(i+1)),reference_paths:common,completion_reference_paths:common};
 const requested=scenario==='duplicate-paths'?{...exact,reference_paths:['/fact0','/fact0']}:exact;
 const valid={...exact,reference_paths:invalid?['/fact0']:common,completion_reference_paths:invalid?['/fact0']:common};
 const original=structuredClone(delegationToolSchema),projection=structuredClone(delegationToolSchema);
 const identity={task_id:randomUUID(),revision:'1',run_id:randomUUID(),attempt_id:randomUUID(),operation_id:randomUUID(),grant_id:randomUUID(),scope_sha256:'a'.repeat(64),config_sha256:'b'.repeat(64)};
 const runtime=createPiSessionOpenAnalysisRuntime({projectRoot:root,ledger,credentials:createApprovedProviderCredentials({environment:{}}),nativeObjectArguments:true,modelTransport:async request=>{
  calls++;const declared=request.messages.flatMap(m=>m.tools??[]).find(t=>t.name==='delegate_analysis')!;
  assert.equal(Check(declared.parameters as any,requested),!invalid,'Provider schema must reject exactly the existing total/uniqueness violations');
  assert.equal(Check(declared.parameters as any,valid),true,'valid boundary choices remain available');
  if(calls===1)return {content:[{kind:'tool',id:'selected-materials',name:'delegate_analysis',arguments:requested}],stop:'tools',usage:{inputTokens:4,outputTokens:2}};
  if(invalid&&calls===2){assert.equal(effects,0);assert.match(request.messages.filter(m=>m.role==='tool').at(-1)!.text,/invalid_arguments/);return {content:[{kind:'tool',id:'corrected-selection',name:'delegate_analysis',arguments:valid}],stop:'tools',usage:{inputTokens:4,outputTokens:2}};}
  assert.match(request.messages.filter(m=>m.role==='tool').at(-1)!.text,/queued/);return {content:[{kind:'text',text:'已读取真实委派回执'}],stop:'complete',usage:{inputTokens:4,outputTokens:2}};
 }});
 await runtime.run({identity,nativeBusinessTools:true,recoverInvalidArguments:true,prompt:'只核对选定材料',system:'共同路径逐项适用于每份材料',signal:new AbortController().signal,authorize:()=>true,tools:[{name:'delegate_analysis',description:'真实材料共同路径',parameters:original,modelParameters:projection,execute:async args=>{effects++;assert.deepEqual(args,{kind:valid.kind,task:valid.task,material_ids:valid.material_ids,instruction:{action:valid.action,reference_paths:valid.reference_paths,completion_reference_paths:valid.completion_reference_paths}});return {state:'queued',child_id:randomUUID()};}}]});
 assert.equal(effects,1);assert.equal(calls,invalid?3:2);assert.equal(ledger.pending().length,0);assert.deepEqual(original,delegationToolSchema);assert.deepEqual(projection,delegationToolSchema);
});

test('V13-ARG01: the installed native session presents pre-effect schema feedback to the next model round and meters its correction',async()=>{
 const root=mkdtempSync(join(browserEvidenceRoot,'v13-native-argument-')),ledger=createLocalAnalysisRequestLedger({projectRoot:root});let calls=0,effects=0,observed=false;
 const transport:ModelTransport=async request=>{
  calls++;const text=request.messages.map(m=>m.text??'').join('\n');
  if(calls===3)return {content:[{kind:'text',text:'依据实际计算结果7完成。'}],stop:'complete',usage:{inputTokens:5,outputTokens:2}};
  if(calls===2){observed=text.includes('invalid_arguments')&&text.includes('executed')&&text.includes('required');assert.equal(observed,true);assert.equal(effects,0);}
  return {content:[{kind:'tool',id:'argument-'+calls,name:'analysis_tool',arguments:{name:'calculate',arguments_json:JSON.stringify(calls===1?{}:{quantity:7})}}],stop:'tools',usage:{inputTokens:5,outputTokens:2}};
 };
 const runtime=createPiSessionOpenAnalysisRuntime({projectRoot:root,ledger,credentials:createApprovedProviderCredentials({environment:{}}),modelTransport:transport});
 const identity={task_id:randomUUID(),revision:'1',run_id:randomUUID(),attempt_id:randomUUID(),operation_id:randomUUID(),grant_id:randomUUID(),scope_sha256:'a'.repeat(64),config_sha256:'b'.repeat(64)};
 const result=await runtime.run({identity,recoverInvalidArguments:true,prompt:'核对数量',system:'按工具实际返回继续',signal:new AbortController().signal,authorize:()=>true,tools:[{name:'calculate',description:'核对数量',parameters:{type:'object',properties:{quantity:{type:'integer'}},required:['quantity'],additionalProperties:false},execute:async args=>{effects++;assert.deepEqual(args,{quantity:7});return {value:7};}}]});
 assert.equal(observed,true);assert.equal(effects,1);assert.equal(calls,3);assert.match(result.text,/7/);assert.equal(ledger.read(identity.task_id).length,3);assert.ok(ledger.read(identity.task_id).every(r=>r.status==='succeeded'));assert.equal(ledger.pending().length,0);
});

test('V13-ARGUMENT-FEEDBACK03 / AC03: native root required-field feedback carries array contracts before the model explicitly corrects',async()=>{
 const root=mkdtempSync(join(browserEvidenceRoot,'v13-root-schema-')),ledger=createLocalAnalysisRequestLedger({projectRoot:root});let calls=0,effects=0,feedback:any;
 const parameters={type:'object',properties:{summary:{type:'string'},limitations:{type:'array',items:{type:'string'}},unknowns:{type:'array',items:{type:'string'}}},required:['summary','limitations','unknowns'],additionalProperties:false};
 const runtime=createPiSessionOpenAnalysisRuntime({projectRoot:root,ledger,credentials:createApprovedProviderCredentials({environment:{}}),modelTransport:async request=>{
  calls++;if(calls===2){feedback=JSON.parse(request.messages.filter(m=>m.role==='tool').at(-1)!.text);assert.equal(effects,0);}
  return calls===3?{content:[{kind:'text',text:'已按实际契约提交意见'}],stop:'complete',usage:{inputTokens:4,outputTokens:2}}:{content:[{kind:'tool',id:'root-schema-'+calls,name:'finish_result',arguments:calls===1?{summary:'PRIVATE_INPUT_SENTINEL'}:{summary:'所选材料意见',limitations:['不含原因记录'],unknowns:[]}}],stop:'tools',usage:{inputTokens:4,outputTokens:2}};
 }});
 const identity={task_id:randomUUID(),revision:'1',run_id:randomUUID(),attempt_id:randomUUID(),operation_id:randomUUID(),grant_id:randomUUID(),scope_sha256:'a'.repeat(64),config_sha256:'b'.repeat(64)};
 await runtime.run({identity,nativeBusinessTools:true,recoverInvalidArguments:true,prompt:'依据授权材料提交意见',system:'参数按实际契约',signal:new AbortController().signal,authorize:()=>true,tools:[{name:'finish_result',description:'提交意见',parameters,execute:async args=>{effects++;assert.deepEqual(args,{summary:'所选材料意见',limitations:['不含原因记录'],unknowns:[]});return {accepted:true};}}]});
 assert.equal(feedback.executed,false);assert.deepEqual(feedback.issues.find((i:any)=>i.schema_path==='#').expected_schema,parameters);assert.equal(JSON.stringify(feedback).includes('PRIVATE_INPUT_SENTINEL'),false);
 assert.equal(effects,1);assert.equal(calls,3);assert.equal(ledger.pending().length,0);assert.equal(ledger.read(identity.task_id).length,3);
});

test('V13-METER01 / AC05: native delegated conversations persist separately while physical requests accumulate on the root Task',async()=>{
 const root=mkdtempSync(join(browserEvidenceRoot,'v13-native-collaboration-')),ledger=createLocalAnalysisRequestLedger({projectRoot:root});
 const seen:string[]=[];const transport:ModelTransport=async request=>{seen.push(request.messages.map(m=>m.text??'').join('\n'));return {content:[{kind:'text',text:'获准子任务意见'}],stop:'complete',usage:{inputTokens:5,outputTokens:3}};};
 const make=()=>createPiSessionOpenAnalysisRuntime({projectRoot:root,ledger,credentials:createApprovedProviderCredentials({environment:{}}),modelTransport:transport});
 const identity={task_id:randomUUID(),revision:'1',run_id:randomUUID(),attempt_id:randomUUID(),operation_id:randomUUID(),grant_id:randomUUID(),scope_sha256:'a'.repeat(64),config_sha256:'b'.repeat(64)};
 const base={identity,prompt:'ROOT_ONLY_SENTINEL',system:'只使用当前获准内容',tools:[],signal:new AbortController().signal,authorize:()=>true};
 const one=randomUUID(),two=randomUUID(),runtime=make();await runtime.run(base);
 const rootView=await runtime.sessionControl!({identity,command:{kind:'snapshot'},signal:base.signal,authorize:()=>true});assert.ok(rootView.view?.history?.length);assert.ok(seen[0]!.includes('ROOT_ONLY_SENTINEL'));
 await runtime.run({...base,conversation_id:one,prompt:'CHILD_ONE_SENTINEL'});
 await runtime.run({...base,conversation_id:two,prompt:'CHILD_TWO_SENTINEL'});
 await make().run({...base,conversation_id:one,prompt:'继续检查第一支'});
 assert.equal(seen.length,4);assert.equal(seen[1]!.includes('ROOT_ONLY_SENTINEL'),false);assert.equal(seen[2]!.includes('CHILD_ONE_SENTINEL'),false);assert.equal(seen[3]!.includes('CHILD_ONE_SENTINEL'),true);assert.equal(seen[3]!.includes('CHILD_TWO_SENTINEL'),false);
 assert.equal(ledger.read(identity.task_id).length,4);assert.equal(ledger.read(one).length,0);assert.equal(ledger.read(two).length,0);
 const state=createPersistentRuntimeState({projectRoot:root});assert.notEqual(state.readSelectedSession(identity.task_id,'analysis:'+one),state.readSelectedSession(identity.task_id,'analysis:'+two));
 assert.ok(state.readSelectedSession(identity.task_id,'analysis:'+one));
 const view=await make().sessionControl!({identity,command:{kind:'snapshot'},signal:base.signal,authorize:()=>true});assert.deepEqual(view.view?.history,rootView.view?.history,'root control still reads the original native root history, including after reconstruction');
});

test('V13-DRIVE06: installed native SDK yields after a durable delegation tool, runs another conversation, and resumes the original session without UNKNOWN',async()=>{
 const root=mkdtempSync(join(browserEvidenceRoot,'v13-native-yield-')),ledger=createLocalAnalysisRequestLedger({projectRoot:root});let delegated=false,calls=0;
 const transport:ModelTransport=async request=>{calls++;const text=request.messages.map(m=>m.text??'').join('\n');if(text.includes('CHILD_NATIVE_AFTER_YIELD'))return {content:[{kind:'text',text:'独立分支的意见'}],stop:'complete',usage:{inputTokens:4,outputTokens:2}};if(text.includes('ROOT_NATIVE_CONTINUE'))return {content:[{kind:'text',text:'已观察分支意见并继续'}],stop:'complete',usage:{inputTokens:4,outputTokens:2}};return {content:[{kind:'tool',id:'delegate-one',name:'analysis_tool',arguments:{name:'queue_child',arguments_json:'{}'}}],stop:'tools',usage:{inputTokens:4,outputTokens:2}};};
 const runtime=createPiSessionOpenAnalysisRuntime({projectRoot:root,ledger,credentials:createApprovedProviderCredentials({environment:{}}),modelTransport:transport});
 const identity={task_id:randomUUID(),revision:'1',run_id:randomUUID(),attempt_id:randomUUID(),operation_id:randomUUID(),grant_id:randomUUID(),scope_sha256:'a'.repeat(64),config_sha256:'b'.repeat(64)},signal=new AbortController().signal;
 const base={identity,prompt:'ROOT_NATIVE_DELEGATION',system:'使用授权工具',signal,authorize:()=>true,tools:[{name:'queue_child',description:'保存合法委派队列',parameters:{type:'object',properties:{},additionalProperties:false},execute:async()=>{delegated=true;return {state:'queued'};}}]};
 await runtime.run({...base,shouldYield:()=>delegated});assert.equal(delegated,true);assert.equal(ledger.pending().length,0);
 await runtime.run({...base,conversation_id:randomUUID(),prompt:'CHILD_NATIVE_AFTER_YIELD',tools:[]});
 const resumed=await runtime.run({...base,prompt:'ROOT_NATIVE_CONTINUE',tools:[]});assert.match(resumed.text,/已观察分支意见/);assert.equal(calls,3);assert.equal(ledger.pending().length,0);assert.equal(ledger.read(identity.task_id).length,3);
});

for(const boundary of ['report','revoked','cancelled'] as const)test(`AC136-02 (${boundary}): installed native SDK yields after acknowledged report selection without another analysis request and preserves stop authority`,async()=>{
 const root=mkdtempSync(join(browserEvidenceRoot,'v13-native-report-yield-')),ledger=createLocalAnalysisRequestLedger({projectRoot:root});
 let selected=false,authorized=true,calls=0;const controller=new AbortController();
 const runtime=createPiSessionOpenAnalysisRuntime({projectRoot:root,ledger,credentials:createApprovedProviderCredentials({environment:{}}),nativeObjectArguments:true,modelTransport:async request=>{
  calls++;const text=request.messages.map(m=>m.text??'').join('\n');
  if(text.includes('AC136_REPORT_CURRENT_FACTS')){assert.equal(boundary,'report');assert.equal(selected,true);assert.equal(request.messages.flatMap(m=>m.tools??[]).length,0);return {content:[{kind:'text',text:'当前报告依据已提供事实整理。'}],stop:'complete',usage:{inputTokens:4,outputTokens:2}};}
  assert.equal(calls,1,'no analysis request, summary or compaction after the acknowledged handoff');
  assert.ok(request.messages.flatMap(m=>m.tools??[]).some(t=>t.name==='rewrite_saved_report'));
  return {content:[{kind:'tool',id:'report-selection',name:'rewrite_saved_report',arguments:{}}],stop:'tools',usage:{inputTokens:4,outputTokens:2}};
 }});
 const identity={task_id:randomUUID(),revision:'1',run_id:randomUUID(),attempt_id:randomUUID(),operation_id:randomUUID(),grant_id:randomUUID(),scope_sha256:'a'.repeat(64),config_sha256:'b'.repeat(64)};
 const input={identity,purpose:'proposal_prepare' as const,nativeBusinessTools:true,prompt:'更新已保存报告',system:'选择报告后交给报告用途',signal:controller.signal,authorize:()=>authorized,shouldYield:()=>selected,tools:[{name:'rewrite_saved_report',description:'读取本版事实并选择报告整理',parameters:{type:'object',properties:{},additionalProperties:false},execute:async()=>{selected=true;if(boundary==='revoked')authorized=false;if(boundary==='cancelled')controller.abort();return {status:'report_rewrite_requested',calculation_performed:false,facts:{current_fact:'7'}};}}]};
 if(boundary==='report'){
  const prepared=await runtime.run(input);assert.equal(prepared.tools?.length,1);assert.equal(prepared.tools?.[0]?.name,'rewrite_saved_report');
  assert.ok(prepared.history?.some(m=>m.speaker==='tool'&&m.name==='rewrite_saved_report'&&!m.failed));
  assert.equal(calls,1);assert.equal(ledger.pending().length,0);assert.equal(createPersistentRuntimeState({projectRoot:root}).readAccounting(identity.task_id)?.owner,null);
  const report=await runtime.run({...input,purpose:'report_edit',prompt:'AC136_REPORT_CURRENT_FACTS',shouldYield:()=>false,tools:[]});
  assert.match(report.text,/当前报告依据/);assert.equal(calls,2);assert.ok(ledger.read(identity.task_id).every(r=>r.status==='succeeded'));
 }else await assert.rejects(()=>runtime.run(input),(error:unknown)=>{
  const expected=boundary==='revoked'?'AUTHORITY_REQUIRED':'CANCELLED';
  assert.ok(error instanceof Error);assert.equal(Reflect.get(error,'reason')??Reflect.get(error,'code'),expected);return true;
 });
 assert.equal(selected,true);assert.equal(calls,boundary==='report'?2:1);assert.equal(ledger.pending().length,0);
 assert.equal(createPersistentRuntimeState({projectRoot:root}).readAccounting(identity.task_id)?.owner,null);
});

test('V13-YIELD-FEEDBACK01 / AC03/06: a native batch records unexecuted work as deferred, observes it on continuation and never masks revocation',async()=>{
 const root=mkdtempSync(join(browserEvidenceRoot,'v13-native-batch-yield-')),ledger=createLocalAnalysisRequestLedger({projectRoot:root});let yielded=false,authorized=true,calls=0,observed=false;const effects:string[]=[];
 const transport:ModelTransport=async request=>{
  calls++;const text=request.messages.map(m=>m.text??'').join('\n');
  if(text.includes('INDEPENDENT_BRANCH'))return {content:[{kind:'text',text:'分支意见已保存。'}],stop:'complete',usage:{inputTokens:4,outputTokens:2}};
  if(text.includes('BATCH_CONTINUE')){
   observed=text.includes('deferred')&&text.includes('ANALYSIS_YIELD')&&!text.includes('TOOL_FAILED');assert.equal(observed,true);
   return {content:[{kind:'text',text:'已观察首项已排队、后两项尚未执行，按已有意见继续。'}],stop:'complete',usage:{inputTokens:4,outputTokens:2}};
  }
  return {content:['first','second','third'].map(name=>({kind:'tool' as const,id:'batch-'+name,name:'analysis_tool',arguments:{name,arguments_json:'{}'}})),stop:'tools',usage:{inputTokens:4,outputTokens:2}};
 };
 const runtime=createPiSessionOpenAnalysisRuntime({projectRoot:root,ledger,credentials:createApprovedProviderCredentials({environment:{}}),modelTransport:transport});
 const identity={task_id:randomUUID(),revision:'1',run_id:randomUUID(),attempt_id:randomUUID(),operation_id:randomUUID(),grant_id:randomUUID(),scope_sha256:'a'.repeat(64),config_sha256:'b'.repeat(64)},signal=new AbortController().signal;
 const tools=['first','second','third'].map(name=>({name,description:'测试获准的业务操作',parameters:{type:'object',properties:{},additionalProperties:false},execute:async()=>{effects.push(name);yielded=true;return {state:'queued'};}}));
 const base={identity,prompt:'BATCH_DELEGATE',system:'只执行当前获准业务操作',signal,authorize:()=>authorized,shouldYield:()=>yielded,tools};
 const result=await runtime.run(base);assert.deepEqual(effects,['first']);
 const deferred=result.history?.filter(m=>m.speaker==='tool'&&m.name!=='first');assert.equal(deferred?.length,2);
 for(const message of deferred??[]){assert.equal(message.speaker,'tool');if(message.speaker==='tool'){assert.equal(message.failed,false);assert.deepEqual(message.result,{status:'deferred',code:'ANALYSIS_YIELD',executed:false,instruction:'当前运行已等待后续处理；本操作尚未执行。续接后根据实际返回结果决定是否仍需调用，不自动重放。'});}}
 yielded=false;await runtime.run({...base,conversation_id:randomUUID(),prompt:'INDEPENDENT_BRANCH',tools:[]});
 await runtime.run({...base,prompt:'BATCH_CONTINUE',tools:[]});assert.equal(observed,true);assert.equal(calls,3);assert.deepEqual(effects,['first']);assert.equal(ledger.pending().length,0);
 authorized=false;yielded=true;await assert.rejects(()=>runtime.run(base),{code:'AUTHORITY_REQUIRED'});assert.equal(calls,3);assert.deepEqual(effects,['first']);
});

for(const mode of ['successive','batch','empty-refresh','indexed','json-wire','native-object','native-flat-delegation','native-view','completion-review'])test(`V13-DRIVE07 / V13-BATCH-QUEUE01 / V13-CATALOG-REFRESH01 (${mode}): production Profile through the installed native Session SDK executes IR, delegates nested conversations, observes results and saves a verified report`,async()=>{
 const batch=mode!=='successive',refresh=mode==='empty-refresh';
 const {createPersonalOpenAnalysisWorkspace}=await import('../../../profiles/personal/open-analysis.ts');
 const {createHash}=await import('node:crypto');
 const root=mkdtempSync(join(browserEvidenceRoot,'v13-native-profile-')),task_id=randomUUID(),source_id=randomUUID();
 const source={version:'1.0' as const,sources:[{source_id,display_name:'synthetic.csv',format:'csv' as const,sha256:createHash('sha256').update('x').digest('hex'),byte_length:'1',sheets:[{sheet_id:'csv',name:'CSV',state:'visible' as const,rows:[{row:1,cells:[{column:'A',type:'string' as const,value:'数量'}]},{row:2,cells:[{column:'A',type:'number' as const,value:'7'}]}]}]}]};
 const plan={version:'1.0',goal:'数量合计',source_id,sheet_id:'csv',operation:'sum',column:'A',unit:'个'};
 let current!:import('../../../packages/ports/open-analysis-runtime.ts').OpenAnalysisRun,material_id='',calculationRef='',requests=0,rootObserved=false,parentObserved=false,reviewObserved=false,earlyReturned=false;const diagnostics:unknown[]=[];
 let materialPaths:string[]=[];let materialViews:any[]=[];let defaultProducerHasLegacy:boolean|undefined;const phases=new Map<string,number>();
 const app=createPersonalOpenAnalysisWorkspace({projectRoot:root,inspect:async()=>source,authorizeConfiguration:async()=>({config_sha256:'b'.repeat(64)}),createRuntime:ledger=>{
  const transport:ModelTransport=async request=>{
   requests++;assert.equal(current.identity.task_id,task_id);if(mode==='native-view'&&defaultProducerHasLegacy===undefined){const declaration=request.messages.flatMap(m=>m.tools??[]).find(t=>t.name==='delegate_analysis')!;defaultProducerHasLegacy=Object.hasOwn(declaration.parameters.properties??{},'material_ids');}
   const text=request.messages.map(m=>m.text??'').join('\n');
   const call=(name:string,args:unknown)=>{
    if(mode==='indexed'&&name==='delegate_analysis')args={...(args as any),instruction:{action:(args as any).instruction.action,reference_indices:(args as any).instruction.reference_paths.map((p:string)=>materialPaths.indexOf(p)),completion_reference_indices:(args as any).instruction.completion_reference_paths.map((p:string)=>materialPaths.indexOf(p))}};
    if(mode==='native-view'&&name==='delegate_analysis'){const a=args as any;const view=materialViews.find(v=>JSON.stringify(v.reference_paths)===JSON.stringify(a.instruction.reference_paths));assert.ok(view,'real current view must match explicitly selected original scope');args={kind:a.kind,task:a.task,action:a.instruction.action,view_refs:[view.view_ref]};}
    if((mode==='native-flat-delegation'||mode==='native-object')&&name==='delegate_analysis'){const a=args as any;args={kind:a.kind,task:a.task,action:a.instruction.action,material_ids:[a.material_id],reference_paths:a.instruction.reference_paths,completion_reference_paths:a.instruction.completion_reference_paths};}
    const declared=request.messages.flatMap(m=>m.tools??[]).find(t=>t.name===name);if(mode==='native-object'){assert.ok(declared,'native named contract reaches the real Profile consumer');if(name==='delegate_analysis'){assert.equal(declared.parameters.properties?.instruction,undefined);assert.equal(declared.parameters.properties?.reference_paths.type,'array');}else assert.deepEqual(declared.parameters,current.tools.find(t=>t.name===name)!.parameters);assert.equal(declared.parameters.properties?.arguments_json,undefined);}const jsonWire=mode==='json-wire'&&declared?.parameters.properties?.arguments_json;
    diagnostics.push({tool:name,key:current.conversation_id??'root',json_wire:!!jsonWire});
    return {content:[{kind:'tool' as const,id:'native-tool-'+requests,name:declared?name:'analysis_tool',arguments:declared?(jsonWire?{arguments_json:JSON.stringify(args)}:args):{name,arguments_json:JSON.stringify(args)}}],stop:'tools' as const,usage:{inputTokens:5,outputTokens:3}};
   };
   const complete=(text:string)=>({content:[{kind:'text' as const,text}],stop:'complete' as const,usage:{inputTokens:5,outputTokens:3}});
   if(current.purpose==='report_edit'){
    const data=JSON.parse(current.prompt.slice('JuanerAI.report-edit.v1\n'.length));assert.equal(data.output_contract,'1.5');assert.ok(data.fact_fragments.some((f:any)=>f.reference_id===data.numeric_facts[0].reference_id));return complete(JSON.stringify({version:'1.5',status:'ready',interpretations:[{fact_refs:[data.numeric_facts[0].reference_id],interpretation:'嵌套检查意见指出资料不能解释原因。'}]}));
   }
   const key=current.conversation_id??'root';let phase=phases.get(key)??0;
   // The substitute model explicitly resubmits an unexecuted operation after consuming its current contract.
   const lastFeedback=request.messages.filter(m=>m.role==='tool').at(-1)?.text;
   if(lastFeedback&&JSON.parse(lastFeedback).status==='tool_contract')phase--;
   phases.set(key,phase+1);
   if(key==='root'){
    if(refresh&&phase===0)return call('read_delegation_materials',{});
    if(refresh&&phase===5)return call('delegate_analysis',{kind:'subagent',task:'目录尚未刷新',instruction:{action:'inspect_sources',reference_paths:['/verification'],completion_reference_paths:['/verification']},material_id:'material:'+task_id});
    if(refresh&&phase===6){assert.match(text,/needs_material_catalog/,'native model sees the refused stale empty catalog before explicitly rereading');return call('read_delegation_materials',{});}
    const stage=phase-(refresh?1:0)-(refresh&&phase>=7?1:0);
    switch(stage){
     case 0:return call('describe_business',{purpose:'核对数量和来源限制',object:'选定数量字段',scope:'任务合成资料',deliverables:['实际数量与限制'],hypotheses:[],unknowns:[],execution_scope:[{source_id,sheet_id:'csv',filters:[]}]});
     case 1:{const {version,...binding}=plan;return call('set_framework',{...binding,group_mode:'none'});}
     case 2:return call('read_analysis_evidence',{required_current_plan:true});
     case 3:assert.match(calculationRef,/^[a-f0-9]{64}$/);assert.ok(text.includes(calculationRef),'native model consumes returned bound calculation reference');return call('calculate_and_verify',{calculation_ref:calculationRef});
     case 4:if(mode==='completion-review'&&!earlyReturned){earlyReturned=true;phases.set(key,phase);return complete('The arithmetic is ready; ending before the requested independent investigation.');}if(mode==='completion-review'){reviewObserved=current.prompt.includes('GOAL_COMPLETION_REVIEW');assert.equal(reviewObserved,true,'the product must ask the same native agent to review its actual goal before reporting');}return call('read_delegation_materials',{});
     case 5:{const first=call('delegate_analysis',{kind:'subagent',task:'检查来源',instruction:{action:'inspect_sources',reference_paths:['/verification'],completion_reference_paths:['/verification']},material_id});if(!batch)return first;const second=call('delegate_analysis',{kind:'fork',task:'检查解释限制',instruction:{action:'explain',reference_paths:['/verification'],completion_reference_paths:['/verification']},material_id});return {...first,content:[first.content[0],{...second.content[0],id:'second-'+requests}]};}
     case 6:return call('read_delegation_results',{});
     case 7:if(batch){rootObserved=text.includes('嵌套检查意见')&&text.includes('解释限制意见');return complete('依据实际返回意见，不推断原因。');}assert.ok(text.includes('嵌套检查意见'),'root model must observe actual returned result');return call('calculate_and_verify',{plan:{...plan,goal:'另一个独立材料来源'}});
     case 8:return call('read_delegation_materials',{});
     case 9:return call('delegate_analysis',{kind:'fork',task:'检查解释限制',instruction:{action:'explain',reference_paths:['/verification'],completion_reference_paths:['/verification']},material_id});
     case 10:return call('read_delegation_results',{});
     default:rootObserved=text.includes('嵌套检查意见')&&text.includes('解释限制意见');assert.equal(rootObserved,true);return complete('数量7个；据嵌套检查意见和解释限制意见，不推断原因。');
    }
   }
   const context=JSON.parse(current.prompt).authorized_context;
   if(context.instruction?.action==='inspect_sources'){
    if(phase===0)return call('read_delegation_materials',{});
    if(phase===1)return call('delegate_analysis',{kind:'subagent',task:'复核精确来源限制',instruction:{action:'check_limitations',reference_paths:['/verification'],completion_reference_paths:['/verification']},material_id});
    if(phase===2)return call('read_delegation_results',{});
    if(phase===3){parentObserved=text.includes('嵌套检查意见');assert.equal(parentObserved,true);return call('finish_result',{summary:'采用嵌套检查意见；原因未知。',reference_indices:[0],limitations:['MODEL'],unknowns:[]});}
   }else if(phase===0)return call('finish_result',{summary:context.instruction?.action==='check_limitations'?'嵌套检查意见：不能解释原因。':'解释限制意见：不推断原因。',reference_indices:[0],limitations:['MODEL'],unknowns:[]});
   return complete('子任务模型意见已返回。');
  };
  const native=createPiSessionOpenAnalysisRuntime({projectRoot:root,ledger,credentials:createApprovedProviderCredentials({environment:{}}),nativeObjectArguments:mode==='native-object'||mode==='native-flat-delegation'||mode==='native-view',modelTransport:transport});
  return {...native,run:async input=>{current=input;return native.run({...input,tools:input.tools.map(tool=>({...tool,...(tool.name==='delegate_analysis'&&(mode==='native-object'||mode==='native-flat-delegation')?{modelParameters:tool.parameters}:{}),execute:async(args,signal)=>{const result=await tool.execute(args,signal).catch(error=>{diagnostics.push({tool_error:tool.name,code:String(error.code??error.message)});throw error;});diagnostics.push({result:tool.name,value:result});if(tool.name==='read_analysis_evidence')calculationRef=(result as any).required_calculations[0].calculation_ref;if(tool.name==='read_delegation_materials'){material_id=(result as {material_id:string}[]).at(-1)?.material_id??'';materialPaths=(result as any[]).at(-1)?.instruction_contract?.reference_paths??[];materialViews=(result as any[]).at(-1)?.views??[];}return result;}}))}).catch(error=>{diagnostics.push({error:String(error.code??error.message)});throw error;});}};
 }});
 try{
  await app.submit({version:'1.0',command_id:task_id,question:'核对数量与来源限制',confirmed:true,sources:[{source_id,display_name:'synthetic.csv',format:'csv',bytes:Buffer.from('x')}]});await app.collect();
  const saved=app.read(task_id);if(mode==='native-view')assert.equal(defaultProducerHasLegacy,false,'AC129: default production model must see only the adopted view producer, not parallel legacy parameters');assert.equal(saved.state,'saved',JSON.stringify({diagnostics,phases:[...phases],requests:app.requests(task_id).map(r=>({status:r.status,reason:r.reason}))}));assert.equal(saved.outcome?.calculation.value,'7');assert.equal(saved.outcome?.verification.value,'7');assert.equal(rootObserved,true);assert.equal(parentObserved,true);assert.equal(phases.size,4);
  assert.equal(app.requests(task_id).length,requests);assert.equal(app.physicalPending(),0);assert.ok(app.requests(task_id).every(r=>r.status==='succeeded'));
  if(mode==='json-wire')for(const name of ['describe_business','set_framework','delegate_analysis','finish_result'])assert.ok(diagnostics.some((d:any)=>d.tool===name&&d.json_wire),'actual '+name+' consumer used the declared JSON text entrance');
  if(mode==='completion-review')assert.equal(reviewObserved,true);
  const families=await app.collaboration(task_id);assert.equal(families.flatMap(f=>f.children).length,3);assert.ok(families.every(f=>f.requests.length===requests));
 }finally{await app.close();}
});

test('V13-DISCOVERY02 native catalog defers business schemas and subsequent model actually consumes the discovered contract',async()=>{
 const root=mkdtempSync(join(browserEvidenceRoot,'v13-contract-discovery-')),ledger=createLocalAnalysisRequestLedger({projectRoot:root});let calls=0,effects=0,observed=false;
 const schema={type:'object',properties:{unique_schema_probe:{type:'integer'}},required:['unique_schema_probe'],additionalProperties:false};
 const runtime=createPiSessionOpenAnalysisRuntime({projectRoot:root,ledger,credentials:createApprovedProviderCredentials({environment:{}}),modelTransport:async request=>{
  calls++;const text=request.messages.map(m=>m.text??'').join('\n');
  if(calls===1){assert.equal(text.includes('unique_schema_probe'),false);assert.match(text,/read_tool_contract/);return {content:[{kind:'tool',id:'discover',name:'analysis_tool',arguments:{name:'read_tool_contract',arguments_json:'{"name":"calculate"}'}}],stop:'tools',usage:{inputTokens:5,outputTokens:2}};}
  if(calls===2){observed=text.includes('unique_schema_probe');assert.equal(observed,true);assert.equal(effects,0);return {content:[{kind:'tool',id:'calculate',name:'analysis_tool',arguments:{name:'calculate',arguments_json:'{"unique_schema_probe":7}'}}],stop:'tools',usage:{inputTokens:5,outputTokens:2}};}
  return {content:[{kind:'text',text:'实际计算完成'}],stop:'complete',usage:{inputTokens:5,outputTokens:2}};
 }});
 const identity={task_id:randomUUID(),revision:'1',run_id:randomUUID(),attempt_id:randomUUID(),operation_id:randomUUID(),grant_id:randomUUID(),scope_sha256:'a'.repeat(64),config_sha256:'b'.repeat(64)};
 const result=await runtime.run({identity,toolDiscovery:true,recoverInvalidArguments:true,prompt:'核对',system:'读取工具合同后计算',signal:new AbortController().signal,authorize:()=>true,tools:[{name:'read_tool_contract',description:'读取当前合同',parameters:{type:'object',properties:{name:{type:'string'}},required:['name'],additionalProperties:false},execute:async()=>({name:'calculate',parameters:schema,executed:false})},{name:'calculate',description:'实际核对',parameters:schema,execute:async a=>{effects++;assert.equal(a.unique_schema_probe,7);return {value:7};}}]});
 assert.equal(observed,true);assert.equal(effects,1);assert.equal(calls,3);assert.equal(ledger.read(identity.task_id).length,3);assert.equal(ledger.pending().length,0);assert.equal(result.text,'实际计算完成');
});

test('V13-UI-TRACE01 reopening native history proves Agent initiation and later result consumption without a model call',async()=>{
 const root=mkdtempSync(join(browserEvidenceRoot,'v13-native-trace-')),ledger=createLocalAnalysisRequestLedger({projectRoot:root});let calls=0;const child=randomUUID(),material=randomUUID(),resultId=randomUUID();
 const make=()=>createPiSessionOpenAnalysisRuntime({projectRoot:root,ledger,credentials:createApprovedProviderCredentials({environment:{}}),modelTransport:async()=>{calls++;return calls===1?{content:[{kind:'tool',id:'delegate',name:'analysis_tool',arguments:{name:'delegate_analysis',arguments_json:JSON.stringify({kind:'subagent',task:'复核',material_id:material})}}],stop:'tools',usage:{inputTokens:4,outputTokens:2}}:calls===2?{content:[{kind:'tool',id:'returned',name:'analysis_tool',arguments:{name:'read_delegation_results',arguments_json:'{}'}}],stop:'tools',usage:{inputTokens:4,outputTokens:2}}:{content:[{kind:'text',text:'结合返回意见继续调查'}],stop:'complete',usage:{inputTokens:4,outputTokens:2}};}});
 const identity={task_id:randomUUID(),revision:'1',run_id:randomUUID(),attempt_id:randomUUID(),operation_id:randomUUID(),grant_id:randomUUID(),scope_sha256:'a'.repeat(64),config_sha256:'b'.repeat(64)},signal=new AbortController().signal;
 await make().run({identity,prompt:'只用获准摘要复核',system:'实际委派和读取',signal,authorize:()=>true,tools:[{name:'delegate_analysis',description:'委派',parameters:{type:'object',properties:{kind:{type:'string'},task:{type:'string'},material_id:{type:'string'}},required:['kind','task','material_id'],additionalProperties:false},execute:async()=>({child_id:child,state:'queued'})},{name:'read_delegation_results',description:'读取意见',parameters:{type:'object',properties:{},additionalProperties:false},execute:async()=>[{classification:'MODEL',result:{id:resultId,child_session_id:child}}]}]});
 const before=ledger.read(identity.task_id),reader=make();assert.equal(typeof reader.collaborationTrace,'function');
 const trace=await reader.collaborationTrace!({identity,signal,authorize:()=>true});assert.equal(calls,3);assert.deepEqual(ledger.read(identity.task_id),before);assert.equal(trace.created[0]?.child_id,child);assert.equal(trace.created[0]?.material_id,material);assert.equal(trace.consumed[0]?.result_id,resultId);assert.equal(trace.consumed[0]?.child_id,child);assert.ok(trace.consumed[0]!.history_position>trace.created[0]!.history_position);
 await assert.rejects(()=>reader.collaborationTrace!({identity,signal,authorize:()=>false}),{code:'AUTHORITY_REQUIRED'});assert.equal(calls,3);
});


test('V13-NATIVE-TOOLS01 new task dispatches native JSON object and reconstructed runtime retains protocol and Task ledger',async()=>{
 const root=mkdtempSync(join(browserEvidenceRoot,'v13-named-native-')),ledger=createLocalAnalysisRequestLedger({projectRoot:root});let calls=0,effects=0;
 const make=()=>createPiSessionOpenAnalysisRuntime({projectRoot:root,ledger,credentials:createApprovedProviderCredentials({environment:{}}),modelTransport:async request=>{calls++;assert.deepEqual(request.messages.flatMap(m=>m.tools??[]).map(t=>t.name),['read_tool_contract'],'model sees only the current authorized phase, not child-only native capabilities');return calls%2===1?{content:[{kind:'tool',id:'native-read-'+calls,name:'read_tool_contract',arguments:{name:'calculate_and_verify'}}],stop:'tools',usage:{inputTokens:4,outputTokens:2}}:{content:[{kind:'text',text:'按当前工具定义继续'}],stop:'complete',usage:{inputTokens:4,outputTokens:2}};}});
 const identity={task_id:randomUUID(),revision:'1',run_id:randomUUID(),attempt_id:randomUUID(),operation_id:randomUUID(),grant_id:randomUUID(),scope_sha256:'a'.repeat(64),config_sha256:'b'.repeat(64)},signal=new AbortController().signal;
 const input={nativeBusinessTools:true,toolDiscovery:true,identity,prompt:'读取当前合同',system:'读取',signal,authorize:()=>true,tools:[{name:'read_tool_contract',description:'合同',parameters:{type:'object',properties:{name:{type:'string'}},required:['name'],additionalProperties:false},execute:async args=>{effects++;assert.equal(args.name,'calculate_and_verify');return {parameters:{type:'object'}};}}]};
 await make().run(input);assert.equal(effects,1);await make().run({...input,nativeBusinessTools:false});assert.equal(effects,2);assert.equal(ledger.read(identity.task_id).length,4);assert.equal(ledger.pending().length,0);
});


test('V13-NATIVE-TOOLS01 existing dispatcher task cannot change protocol through new input flag',async()=>{
 const root=mkdtempSync(join(browserEvidenceRoot,'v13-legacy-protocol-')),ledger=createLocalAnalysisRequestLedger({projectRoot:root});let calls=0,effects=0;
 const make=()=>createPiSessionOpenAnalysisRuntime({projectRoot:root,ledger,credentials:createApprovedProviderCredentials({environment:{}}),modelTransport:async request=>{calls++;assert.deepEqual(request.messages.flatMap(m=>m.tools??[]).map(t=>t.name),['analysis_tool']);return calls%2?{content:[{kind:'tool',id:'legacy-'+calls,name:'analysis_tool',arguments:{name:'calculate',arguments_json:'{}'}}],stop:'tools',usage:{inputTokens:4,outputTokens:2}}:{content:[{kind:'text',text:'旧任务仍用原配置'}],stop:'complete',usage:{inputTokens:4,outputTokens:2}};}});
 const identity={task_id:randomUUID(),revision:'1',run_id:randomUUID(),attempt_id:randomUUID(),operation_id:randomUUID(),grant_id:randomUUID(),scope_sha256:'a'.repeat(64),config_sha256:'b'.repeat(64)},signal=new AbortController().signal;
 const input={identity,prompt:'核对',system:'旧合同',signal,authorize:()=>true,tools:[{name:'calculate',description:'旧计算',parameters:{type:'object',properties:{},additionalProperties:false},execute:async()=>{effects++;return {value:7};}}]};
 await make().run(input);await make().run({...input,nativeBusinessTools:true});assert.equal(effects,2);assert.equal(ledger.read(identity.task_id).length,4);
});

test('V13-NATIVE-TOOLS01 declared native name does not authorize a business operation absent from current phase',async()=>{
 const root=mkdtempSync(join(browserEvidenceRoot,'v13-unavailable-native-')),ledger=createLocalAnalysisRequestLedger({projectRoot:root});let effects=0,calls=0;
 const runtime=createPiSessionOpenAnalysisRuntime({projectRoot:root,ledger,credentials:createApprovedProviderCredentials({environment:{}}),modelTransport:async()=>{calls++;return {content:[{kind:'tool',id:'not-authorized',name:'calculate_and_verify',arguments:{}}],stop:'tools',usage:{inputTokens:4,outputTokens:2}};}});
 const identity={task_id:randomUUID(),revision:'1',run_id:randomUUID(),attempt_id:randomUUID(),operation_id:randomUUID(),grant_id:randomUUID(),scope_sha256:'a'.repeat(64),config_sha256:'b'.repeat(64)};
 await assert.rejects(()=>runtime.run({nativeBusinessTools:true,identity,prompt:'只能读合同',system:'读',signal:new AbortController().signal,authorize:()=>true,tools:[{name:'read_tool_contract',description:'只读合同',parameters:{type:'object'},execute:async()=>{effects++;return {};}}]}));assert.equal(calls,1);assert.equal(effects,0);assert.equal(ledger.pending().length,0);
});


test('V13-UI-TRACE01 returned-only native opinion cannot claim a later model consumer',async()=>{
 const root=mkdtempSync(join(browserEvidenceRoot,'v13-trace-returned-only-')),ledger=createLocalAnalysisRequestLedger({projectRoot:root}),child=randomUUID(),resultId=randomUUID();let yielded=false,calls=0;
 const runtime=createPiSessionOpenAnalysisRuntime({projectRoot:root,ledger,credentials:createApprovedProviderCredentials({environment:{}}),modelTransport:async()=>{calls++;return {content:[{kind:'tool',id:'read-only-return',name:'analysis_tool',arguments:{name:'read_delegation_results',arguments_json:'{}'}}],stop:'tools',usage:{inputTokens:4,outputTokens:2}};}});
 const identity={task_id:randomUUID(),revision:'1',run_id:randomUUID(),attempt_id:randomUUID(),operation_id:randomUUID(),grant_id:randomUUID(),scope_sha256:'a'.repeat(64),config_sha256:'b'.repeat(64)},signal=new AbortController().signal;
 await runtime.run({identity,prompt:'读回意见',system:'读取',signal,authorize:()=>true,shouldYield:()=>yielded,tools:[{name:'read_delegation_results',description:'读取意见',parameters:{type:'object',properties:{},additionalProperties:false},execute:async()=>{yielded=true;return [{classification:'MODEL',result:{id:resultId,child_session_id:child}}];}}]});
 const trace=await runtime.collaborationTrace!({identity,signal,authorize:()=>true});assert.deepEqual(trace.consumed,[]);assert.equal(calls,1);assert.equal(ledger.pending().length,0);
});


test('V13-NATIVE-SCHEMA01 successful contract discovery becomes the exact schema in the next physical Provider request',async()=>{
 const root=mkdtempSync(join(browserEvidenceRoot,'v13-provider-schema-')),ledger=createLocalAnalysisRequestLedger({projectRoot:root});let calls=0,effects=0;
 const parameters={type:'object',properties:{semantic_entries:{type:'array',items:{type:'string'}},conflicts:{type:'array',items:{type:'string'}}},required:['semantic_entries','conflicts'],additionalProperties:false};
 const runtime=createPiSessionOpenAnalysisRuntime({projectRoot:root,ledger,credentials:createApprovedProviderCredentials({environment:{}}),modelTransport:async request=>{calls++;const tools=request.messages.flatMap(m=>m.tools??[]);
  if(calls===1){const declared=tools.find(t=>t.name==='interpret_meaning')!;assert.deepEqual(declared.parameters.required,['arguments_json']);assert.ok(declared.description.includes(JSON.stringify(parameters)),'exact original contract stays visible before and after discovery');return {content:[{kind:'tool',id:'read-schema',name:'read_tool_contract',arguments:{name:'interpret_meaning'}}],stop:'tools',usage:{inputTokens:4,outputTokens:2}};}
  if(calls===2){const declared=tools.find(t=>t.name==='interpret_meaning')!;assert.deepEqual(declared.parameters.required,['arguments_json']);assert.ok(declared.description.includes(JSON.stringify(parameters)),'exact original contract stays visible before and after discovery');return {content:[{kind:'tool',id:'meaning-schema',name:'interpret_meaning',arguments:{semantic_entries:['本次语意'],conflicts:[]}}],stop:'tools',usage:{inputTokens:4,outputTokens:2}};}
  return {content:[{kind:'text',text:'精确参数已消费'}],stop:'complete',usage:{inputTokens:4,outputTokens:2}};
 }});
 const identity={task_id:randomUUID(),revision:'1',run_id:randomUUID(),attempt_id:randomUUID(),operation_id:randomUUID(),grant_id:randomUUID(),scope_sha256:'a'.repeat(64),config_sha256:'b'.repeat(64)};
 await runtime.run({nativeBusinessTools:true,toolDiscovery:true,identity,prompt:'读后使用语意合同',system:'读',signal:new AbortController().signal,authorize:()=>true,tools:[{name:'read_tool_contract',description:'合同',parameters:{type:'object',properties:{name:{type:'string'}},required:['name'],additionalProperties:false},execute:async()=>({name:'interpret_meaning',parameters,executed:false})},{name:'interpret_meaning',description:'业务语意',parameters,execute:async()=>{effects++;return {accepted:true};}}]});assert.equal(calls,3);assert.equal(effects,1);assert.equal(ledger.pending().length,0);
});


test('V13-NATIVE-SCHEMA02 first native delegation advertises required kind and exact current contract without discovery',async()=>{
 const root=mkdtempSync(join(browserEvidenceRoot,'v13-native-delegation-schema-')),ledger=createLocalAnalysisRequestLedger({projectRoot:root});let calls=0,effects=0;
 const parameters={type:'object',properties:{kind:{type:'string',enum:['fork','subagent']},task:{type:'string'},material_id:{type:'string',format:'uuid'}},required:['kind','task','material_id'],additionalProperties:false};
 const runtime=createPiSessionOpenAnalysisRuntime({projectRoot:root,ledger,credentials:createApprovedProviderCredentials({environment:{}}),modelTransport:async request=>{calls++;const tools=request.messages.flatMap(m=>m.tools??[]);assert.deepEqual(tools.map(t=>t.name),['delegate_analysis']);assert.deepEqual(tools[0].parameters,parameters);assert.equal(tools[0].description,'委派');assert.equal(request.messages.some(m=>m.text.includes('Current authorized business tools:')),false);return calls===1?{content:[{kind:'tool',id:'delegate-exact',name:'delegate_analysis',arguments:{kind:'subagent',task:'独立核对授权材料',material_id:'11111111-1111-4111-8111-111111111111'}}],stop:'tools',usage:{inputTokens:4,outputTokens:2}}:{content:[{kind:'text',text:'委派已返回'}],stop:'complete',usage:{inputTokens:4,outputTokens:2}};}});
 const identity={task_id:randomUUID(),revision:'1',run_id:randomUUID(),attempt_id:randomUUID(),operation_id:randomUUID(),grant_id:randomUUID(),scope_sha256:'a'.repeat(64),config_sha256:'b'.repeat(64)};
 await runtime.run({nativeBusinessTools:true,toolDiscovery:true,identity,prompt:'依授权材料自主复核',system:'完整合同',signal:new AbortController().signal,authorize:()=>true,tools:[{name:'delegate_analysis',description:'委派',parameters,execute:async args=>{effects++;assert.equal(args.kind,'subagent');return {state:'queued'};}}]});assert.equal(effects,1);assert.equal(calls,2);assert.equal(ledger.pending().length,0);
});


test('V13-ARGUMENT-FEEDBACK02 / AC03: invalid nested fields expose the declared structure, never input values or silent correction',async()=>{
 const {createSharedAnalysisTool}=await import('../../../adapters/agent-pi/open-analysis.ts');
 for(const field of ['evidence','scores']){
  let effects=0;const parameters={type:'object',properties:{entries:{type:'array',items:{type:'object',properties:{[field]:{type:'array',items:{type:'string'}}},required:[field],additionalProperties:false}}},required:['entries'],additionalProperties:false};
  const identity={task_id:randomUUID(),revision:'1',run_id:randomUUID(),attempt_id:randomUUID(),operation_id:randomUUID(),grant_id:randomUUID(),scope_sha256:'a'.repeat(64),config_sha256:'b'.repeat(64)};
  const input={identity,prompt:'检查',system:'当前合同',recoverInvalidArguments:true,signal:new AbortController().signal,authorize:()=>true,tools:[{name:'inspect',description:'检查结构',parameters,execute:async()=>{effects++;return {accepted:true};}}]};
  const tool=createSharedAnalysisTool(()=>input),bad={name:'inspect',arguments_json:JSON.stringify({entries:[{[field]:{untrusted:'PRIVATE_INPUT_SENTINEL'}}]})};
  const value=await tool.execute(bad,input.signal,{taskId:identity.task_id,operationId:identity.operation_id});
  assert.equal(effects,0);assert.ok(value&&typeof value==='object'&&!Array.isArray(value));
  const issues=Reflect.get(value,'issues');assert.deepEqual(issues[0].expected_schema,{type:'array',items:{type:'string'}});assert.equal(JSON.stringify(value).includes('PRIVATE_INPUT_SENTINEL'),false);
  await assert.rejects(()=>tool.execute(bad,input.signal,{taskId:identity.task_id,operationId:identity.operation_id}),{code:'TOOL_ARGUMENT_INVALID'});assert.equal(effects,0);
  await tool.execute({name:'inspect',arguments_json:JSON.stringify({entries:[{[field]:['模型明确纠正']}]})},input.signal,{taskId:identity.task_id,operationId:identity.operation_id});assert.equal(effects,1);
 }
});


test('V13-PROTOCOL-STAGE01 same native Task returns to proposal wrapper without losing tools or accounting',async()=>{
const root=mkdtempSync(join(browserEvidenceRoot,'v13-proposal-stage-')),ledger=createLocalAnalysisRequestLedger({projectRoot:root});let calls=0,effects=0;
const runtime=createPiSessionOpenAnalysisRuntime({projectRoot:root,ledger,credentials:createApprovedProviderCredentials({environment:{}}),modelTransport:async request=>{
 calls++;const tools=request.messages.flatMap(m=>m.tools??[]);
 if(calls===2){assert.deepEqual(tools.map(t=>t.name),['analysis_tool'],'same Task proposal retains wrapper protocol');assert.ok(request.messages.some(m=>m.text.includes('Use analysis_tool with')));return {content:[{kind:'tool',id:'draft-read',name:'analysis_tool',arguments:{name:'inspect_selected',arguments_json:'{}'}}],stop:'tools',usage:{inputTokens:4,outputTokens:2}};}
 return {content:[{kind:'text',text:'当前阶段完成'}],stop:'complete',usage:{inputTokens:4,outputTokens:2}};
}});
const identity={task_id:randomUUID(),revision:'1',run_id:randomUUID(),attempt_id:randomUUID(),operation_id:randomUUID(),grant_id:randomUUID(),scope_sha256:'a'.repeat(64),config_sha256:'b'.repeat(64)},base={identity,nativeBusinessTools:true,prompt:'当前任务',system:'按当前职责',tools:[{name:'inspect_selected',description:'读取所选资料',parameters:{type:'object',properties:{},additionalProperties:false},execute:async()=>{effects++;return {value:7};}}],signal:new AbortController().signal,authorize:()=>true};
await runtime.run(base);await runtime.run({...base,purpose:'proposal_prepare',prompt:'本任务先改方案，不执行分析'});
assert.equal(calls,3);assert.equal(effects,1);assert.equal(ledger.read(identity.task_id).length,3);assert.equal(ledger.pending().length,0);

});

test('V13-INSTRUCTION-PATH01: actual native SDK rejects material handles as paths before effects and the next metered model consumes the schema feedback',async()=>{
 const {delegationInstructionSchema}=await import('../../../packages/product-core/open-analysis-delegation-instruction.ts');
 const root=mkdtempSync(join(browserEvidenceRoot,'v13-native-path-')),ledger=createLocalAnalysisRequestLedger({projectRoot:root});let calls=0,effects=0;
 const runtime=createPiSessionOpenAnalysisRuntime({projectRoot:root,ledger,credentials:createApprovedProviderCredentials({environment:{}}),modelTransport:async request=>{
  calls++;const text=request.messages.map(m=>m.text??'').join('\n');
  if(calls===2){assert.equal(effects,0);assert.match(text,/invalid_arguments/);assert.match(text,/reference_paths/);assert.match(text,/pattern/);}
  if(calls===3)return {content:[{kind:'text',text:'模型已显式纠正所选路径'}],stop:'complete',usage:{inputTokens:5,outputTokens:2}};
  const paths=calls===1?['material:1']:['/verification'];return {content:[{kind:'tool',id:'path-'+calls,name:'delegate_analysis',arguments:{action:'inspect_sources',reference_paths:paths,completion_reference_paths:paths}}],stop:'tools',usage:{inputTokens:5,outputTokens:2}};
 }});
 const identity={task_id:randomUUID(),revision:'1',run_id:randomUUID(),attempt_id:randomUUID(),operation_id:randomUUID(),grant_id:randomUUID(),scope_sha256:'a'.repeat(64),config_sha256:'b'.repeat(64)};
 await runtime.run({identity,nativeBusinessTools:true,recoverInvalidArguments:true,prompt:'按当前所选材料检查来源',system:'从工具真实参数反馈纠正',signal:new AbortController().signal,authorize:()=>true,tools:[{name:'delegate_analysis',description:'限定材料内的来源复核',parameters:delegationInstructionSchema,execute:async args=>{effects++;assert.deepEqual(args.reference_paths,['/verification']);return {accepted:true};}}]});
 assert.equal(calls,3);assert.equal(effects,1);assert.equal(ledger.read(identity.task_id).length,3);assert.equal(ledger.pending().length,0);
});


test('V13-VERSION-FEEDBACK01: next native model receives the declared union version requirements without unrelated variants or private argument values',async()=>{
 const root=mkdtempSync(join(browserEvidenceRoot,'v13-version-feedback-')),ledger=createLocalAnalysisRequestLedger({projectRoot:root});let calls=0,effects=0,feedback='';
 const variants=Array.from({length:16},(_,i)=>({type:'object',properties:{version:{type:'string',enum:['variant-'+i]},['required_'+i]:{type:'string'}},required:['version','required_'+i],additionalProperties:false}));
 const parameters={type:'object',properties:{plans:{type:'array',items:{anyOf:variants}}},required:['plans'],additionalProperties:false};
 const runtime=createPiSessionOpenAnalysisRuntime({projectRoot:root,ledger,credentials:createApprovedProviderCredentials({environment:{}}),modelTransport:async request=>{
  calls++;const text=request.messages.map(m=>m.text??'').join('\n');
  if(calls===2){assert.equal(effects,0);feedback=request.messages.filter(m=>m.role==='tool').map(m=>m.text??'').join('\n');}
  if(calls===3)return {content:[{kind:'text',text:'实际参数纠正后完成。'}],stop:'complete',usage:{inputTokens:4,outputTokens:2}};
  return {content:[{kind:'tool',id:'version-'+calls,name:'analysis_tool',arguments:{name:'declare',arguments_json:JSON.stringify({plans:[calls===1?{version:'variant-15',private:'PRIVATE_ARGUMENT_SENTINEL'}:{version:'variant-15',required_15:'accepted'}]})}}],stop:'tools',usage:{inputTokens:4,outputTokens:2}};
 }});
 const identity={task_id:randomUUID(),revision:'1',run_id:randomUUID(),attempt_id:randomUUID(),operation_id:randomUUID(),grant_id:randomUUID(),scope_sha256:'a'.repeat(64),config_sha256:'b'.repeat(64)};
 await runtime.run({identity,recoverInvalidArguments:true,prompt:'按实际版本声明',system:'由模型纠正参数，后台不修复',signal:new AbortController().signal,authorize:()=>true,tools:[{name:'declare',description:'声明',parameters,execute:async args=>{effects++;assert.deepEqual(args,{plans:[{version:'variant-15',required_15:'accepted'}]});return {accepted:true};}}]});
 assert.match(feedback,/required_15/);assert.doesNotMatch(feedback,/required_0/);assert.doesNotMatch(feedback,/PRIVATE_ARGUMENT_SENTINEL/);assert.equal(calls,3);assert.equal(effects,1);assert.equal(ledger.read(identity.task_id).length,3);assert.equal(ledger.pending().length,0);
});


test('V13-VALIDATION-TIMEOUT01: approved per-runtime model timeout is persisted while product default and stable Task guard remain',async()=>{
 const {DatabaseSync}=await import('node:sqlite');
 for(const timeout of [undefined,60000] as const){
  const root=mkdtempSync(join(browserEvidenceRoot,'v13-timeout-')),ledger=createLocalAnalysisRequestLedger({projectRoot:root});let calls=0;
  const credentials=createApprovedProviderCredentials({environment:{}}),transport:ModelTransport=async()=>{calls++;return {content:[{kind:'text',text:'现有资料没有原因，保留限制。'}],stop:'complete',usage:{inputTokens:4,outputTokens:2}};};
  const identity={task_id:randomUUID(),revision:'1',run_id:randomUUID(),attempt_id:randomUUID(),operation_id:randomUUID(),grant_id:randomUUID(),scope_sha256:'a'.repeat(64),config_sha256:'b'.repeat(64)};
  const make=(value?:number)=>createPiSessionOpenAnalysisRuntime({projectRoot:root,ledger,credentials,modelTransport:transport,...value===undefined?{}:{modelTimeoutMs:value}} as any);
  const input={identity,prompt:'合成资料说明',system:'不计算、不推断',tools:[],signal:new AbortController().signal,authorize:()=>true};
  await make(timeout).run(input);assert.equal(calls,1);
  const db=new DatabaseSync(join(root,'.xanthil','desktop','pi-runtime.sqlite'),{readOnly:true});try{const row=db.prepare('SELECT body FROM budgets WHERE task_id=?').get(identity.task_id);assert.equal(JSON.parse(String(row!.body)).limits.modelTimeoutMs,timeout??30000);}finally{db.close();}
  if(timeout===60000){await assert.rejects(make(30000).run({...input,identity:{...identity,operation_id:randomUUID()}}),{code:'CONFIGURATION_CHANGED'});assert.equal(calls,1,'changing timeout cannot silently reuse a stable Task');}
  assert.throws(()=>make(Infinity),{code:'INVALID_REQUEST'});assert.equal(calls,1);
 }
});


test('V13-BATCH-QUEUE02 / AC06: queue admission is specific to delegation and never masks question, revocation or cancellation',async()=>{
 for(const boundary of ['queued','question','revoked','cancelled'] as const){
  const root=mkdtempSync(join(browserEvidenceRoot,'v13-batch-queue-')),ledger=createLocalAnalysisRequestLedger({projectRoot:root}),controller=new AbortController();let yielded=false,authorized=true;const effects:string[]=[];
  const runtime=createPiSessionOpenAnalysisRuntime({projectRoot:root,ledger,credentials:createApprovedProviderCredentials({environment:{}}),modelTransport:async()=>({content:[{kind:'tool',id:'first',name:'delegate_analysis',arguments:{action:'first'}},{kind:'tool',id:'second',name:'delegate_analysis',arguments:{action:'second'}},{kind:'tool',id:'compute',name:'calculate_and_verify',arguments:{}}],stop:'tools',usage:{inputTokens:4,outputTokens:2}})});
  const identity={task_id:randomUUID(),revision:'1',run_id:randomUUID(),attempt_id:randomUUID(),operation_id:randomUUID(),grant_id:randomUUID(),scope_sha256:'a'.repeat(64),config_sha256:'b'.repeat(64)};
  const run=()=>runtime.run({identity,nativeBusinessTools:true,prompt:'检查授权材料',system:'逐项权限有效才排队',signal:controller.signal,authorize:()=>authorized,shouldYield:()=>yielded,canQueueDelegation:()=>yielded&&boundary!=='question',tools:[{name:'delegate_analysis',description:'合法队列',parameters:{type:'object',properties:{action:{type:'string'}},required:['action'],additionalProperties:false},execute:async args=>{effects.push(String(args.action));yielded=true;if(boundary==='revoked')authorized=false;if(boundary==='cancelled')controller.abort();return {state:'queued'};}},{name:'calculate_and_verify',description:'本地计算',parameters:{type:'object',properties:{},additionalProperties:false},execute:async()=>{effects.push('calculate');return {value:7};}}]});
  if(boundary==='queued'){const result=await run();assert.deepEqual(effects,['first','second']);assert.ok(result.history?.some(m=>m.speaker==='tool'&&m.name==='calculate_and_verify'&&(m.result as any).executed===false));}
  else if(boundary==='question'){await run();assert.deepEqual(effects,['first']);}
  else {await assert.rejects(run);assert.deepEqual(effects,['first']);}
  assert.equal(ledger.pending().length,0);
 }
});

for(const scenario of ['correct','invalid-again','revoked'])test(`V13-ARGUMENT-BATCH01 / AC03/06 (${scenario}): native same-response failures wait for actual model feedback without consuming a second correction`,async()=>{
 const root=mkdtempSync(join(browserEvidenceRoot,'v13-argument-batch-')),ledger=createLocalAnalysisRequestLedger({projectRoot:root});let calls=0,authorized=true,observed=false;const effects:number[]=[];
 const runtime=createPiSessionOpenAnalysisRuntime({projectRoot:root,ledger,credentials:createApprovedProviderCredentials({environment:{}}),modelTransport:async request=>{
  calls++;const content=request.messages.filter(m=>m.role==='tool').map(m=>JSON.parse(m.text));
  if(calls===1)return {content:[{},{}].map((arguments_,i)=>({kind:'tool' as const,id:'invalid-'+i,name:'calculate_and_verify',arguments:arguments_})),stop:'tools',usage:{inputTokens:4,outputTokens:2}};
  if(calls===2){assert.equal(effects.length,0);assert.equal(content.filter(c=>c.status==='invalid_arguments').length,1);assert.equal(content.filter(c=>c.status==='deferred'&&c.executed===false).length,1);observed=true;if(scenario==='revoked')authorized=false;return {content:[{kind:'tool' as const,id:'corrected',name:'calculate_and_verify',arguments:scenario==='invalid-again'?{}:{quantity:7}}],stop:'tools',usage:{inputTokens:4,outputTokens:2}};}
  return {content:[{kind:'text' as const,text:'依据实际计算完成'}],stop:'complete',usage:{inputTokens:4,outputTokens:2}};
 }});
 const identity={task_id:randomUUID(),revision:'1',run_id:randomUUID(),attempt_id:randomUUID(),operation_id:randomUUID(),grant_id:randomUUID(),scope_sha256:'a'.repeat(64),config_sha256:'b'.repeat(64)};
 const input={identity,nativeBusinessTools:true,recoverInvalidArguments:true,prompt:'按当前实际合同核对数量',system:'按真实工具反馈纠正',signal:new AbortController().signal,authorize:()=>authorized,tools:[{name:'calculate_and_verify',description:'核对',parameters:{type:'object',properties:{quantity:{type:'integer'}},required:['quantity'],additionalProperties:false},execute:async args=>{effects.push(Number(args.quantity));return {value:args.quantity};}}]};
 if(scenario==='correct'){await runtime.run(input);assert.deepEqual(effects,[7]);assert.equal(calls,3);}else{await assert.rejects(()=>runtime.run(input));assert.deepEqual(effects,[]);assert.equal(calls,2);}
 assert.equal(observed,true);assert.equal(ledger.pending().length,0);assert.equal(ledger.read(identity.task_id).length,calls);
});


for(const mode of ['discovery','forged-contract','full-compatibility'])test(`V13-CATALOG02 (${mode}): native large contracts are read explicitly while small required parameters and strict execution remain intact`,async()=>{
 const root=mkdtempSync(join(browserEvidenceRoot,'v13-large-catalog-')),ledger=createLocalAnalysisRequestLedger({projectRoot:root});let calls=0,effects=0;const projections:{large:any;small:any}[]=[];
 const parameters={type:'object',properties:{plan:{anyOf:Array.from({length:30},(_,i)=>({type:'object',properties:{version:{type:'string',enum:[String(i)]},value:{type:'integer'},...Object.fromEntries(Array.from({length:12},(_,j)=>['option_'+j,{type:'string',description:'Explicit optional method parameter; no inferred value or default.'}]))},required:['version','value'],additionalProperties:false}))}},required:['plan'],additionalProperties:false};
 const small={type:'object',properties:{purpose:{type:'string'},hypotheses:{type:'array',items:{type:'string'}}},required:['purpose','hypotheses'],additionalProperties:false};
 assert.ok(Buffer.byteLength(JSON.stringify(parameters))>8192);
 const runtime=createPiSessionOpenAnalysisRuntime({projectRoot:root,ledger,credentials:createApprovedProviderCredentials({environment:{}}),modelTransport:async request=>{
  calls++;const tools=request.messages.flatMap(m=>m.tools??[]),large=tools.find(t=>t.name==='calculate_and_verify')!;
  projections.push({large,small:tools.find(t=>t.name==='describe_business')});
  if(calls===1&&mode!=='full-compatibility')return {content:[{kind:'tool',id:'catalog-read',name:'read_tool_contract',arguments:{name:'calculate_and_verify'}}],stop:'tools',usage:{inputTokens:5,outputTokens:2}};
  const invalidTurn=mode==='full-compatibility'?1:2;
  if(calls===invalidTurn){assert.equal(effects,0);return {content:[{kind:'tool',id:'bad-plan',name:'calculate_and_verify',arguments:{plan:{version:'0',value:'PRIVATE_INPUT_SENTINEL'}}}],stop:'tools',usage:{inputTokens:5,outputTokens:2}};}
  if(calls===invalidTurn+1){const feedback=request.messages.filter(m=>m.role==='tool').at(-1)!.text;assert.match(feedback,mode==='forged-contract'?/tool_contract/:/invalid_arguments/);assert.equal(effects,0);return {content:[{kind:'tool',id:'corrected-plan',name:'calculate_and_verify',arguments:{plan:{version:'0',value:7}}}],stop:'tools',usage:{inputTokens:5,outputTokens:2}};}
  return {content:[{kind:'text',text:'已消费实际合同与计算回执'}],stop:'complete',usage:{inputTokens:5,outputTokens:2}};
 }});
 const identity={task_id:randomUUID(),revision:'1',run_id:randomUUID(),attempt_id:randomUUID(),operation_id:randomUUID(),grant_id:randomUUID(),scope_sha256:'a'.repeat(64),config_sha256:'b'.repeat(64)};
 const result=await runtime.run({nativeBusinessTools:true,toolDiscovery:mode!=='full-compatibility',recoverInvalidArguments:true,identity,prompt:'按当前材料实际计算',system:'先读必要合同',signal:new AbortController().signal,authorize:()=>true,tools:[{name:'describe_business',description:'理解目的',parameters:small,execute:async()=>({})},{name:'read_tool_contract',description:'读当前合同',parameters:{type:'object',properties:{name:{type:'string'}},required:['name'],additionalProperties:false},execute:async()=>({name:'calculate_and_verify',parameters:mode==='forged-contract'?{type:'object',properties:{bogus:{type:'string'}}}:parameters,executed:false})},{name:'calculate_and_verify',description:'真实计算',parameters,execute:async args=>{effects++;assert.deepEqual(args,{plan:{version:'0',value:7}});return {value:7};}}]});
 for(const [index,projection] of projections.entries()){assert.deepEqual(projection.small.parameters.required,['arguments_json'],'small nested declarations use the same exact JSON entrance');assert.ok(projection.small.description.includes(JSON.stringify(small)),'small original required fields are always advertised completely');const disclosed=mode==='full-compatibility'||mode==='discovery'&&index>=1||mode==='forged-contract'&&index>=2;if(mode==='full-compatibility'){assert.deepEqual(projection.large.parameters.required,['arguments_json']);assert.ok(projection.large.description.includes(JSON.stringify(parameters)),'full-contract compatibility retains the complete original schema');}else {assert.deepEqual(projection.large.parameters.required,['arguments_json'],'large native wire is one exact original business JSON string');assert.equal(JSON.stringify(projection.large.parameters).includes('option_'),false,'full original contract stays in trusted readback rather than duplicated wire metadata');assert.match(projection.large.description,/read_tool_contract/);assert.equal(projection.large.description.includes('先使用read_tool_contract'),!disclosed,'only a trusted matching original contract removes the disclosure reminder');}}
 assert.equal(effects,1);assert.match(result.text,/实际合同/);assert.equal(calls,mode==='full-compatibility'?3:4);assert.equal(ledger.pending().length,0);assert.equal(ledger.read(identity.task_id).length,calls);
});


for(const mode of ['correct','invalid-again','revoked','unavailable','batch'] as const)test(`V13-CATALOG03 (${mode}): first complex call returns exact contract without effects, later explicit calls retain strict authority and correction`,async()=>{
 const root=mkdtempSync(join(browserEvidenceRoot,'v13-contract-first-')),ledger=createLocalAnalysisRequestLedger({projectRoot:root});let calls=0,effects=0,authorized=true;
 const parameters={type:'object',properties:{quantity:{type:'integer'},...Object.fromEntries(Array.from({length:100},(_,i)=>['option_'+i,{type:'string',description:'Optional declared field; no inferred default; preserve explicit current contract.'}]))},required:['quantity'],additionalProperties:false};
 const runtime=createPiSessionOpenAnalysisRuntime({projectRoot:root,ledger,credentials:createApprovedProviderCredentials({environment:{}}),modelTransport:async request=>{
  calls++;const feedback=request.messages.filter(m=>m.role==='tool').map(m=>JSON.parse(m.text));
  if(calls===1){if(mode==='revoked')authorized=false;return {content:[{kind:'tool',id:'first',name:mode==='unavailable'?'execute_step':'calculate_and_verify',arguments:{quantity:'unread-invalid'}},...(mode==='batch'?[{kind:'tool' as const,id:'same-batch',name:'describe_business',arguments:{}}]:[])],stop:'tools',usage:{inputTokens:4,outputTokens:2}};}
  if(calls===2){assert.equal(effects,0,'invalid first-use arguments are not executed');const contract=feedback.find(x=>x.status==='tool_contract');assert.deepEqual(contract.parameters,parameters);assert.equal(contract.executed,false);assert.equal(feedback.some(x=>x.status==='invalid_arguments'),false);if(mode==='batch'){assert.equal(feedback.filter(x=>x.code==='AWAITING_TOOL_CONTRACT'&&x.executed===false).length,1);return {content:[{kind:'tool',id:'explicit-next',name:'calculate_and_verify',arguments:{quantity:7}}],stop:'tools',usage:{inputTokens:4,outputTokens:2}};}return {content:[{kind:'tool',id:'actual-invalid',name:'calculate_and_verify',arguments:{quantity:'not-integer'}}],stop:'tools',usage:{inputTokens:4,outputTokens:2}};}
  if(calls===3&&mode!=='batch'){assert.equal(effects,0);assert.equal(feedback.at(-1).status,'invalid_arguments');return {content:[{kind:'tool',id:'explicit-correction',name:'calculate_and_verify',arguments:mode==='invalid-again'?{quantity:'not-integer'}:{quantity:7}}],stop:'tools',usage:{inputTokens:4,outputTokens:2}};}
  return {content:[{kind:'text',text:'Actual contract and result consumed'}],stop:'complete',usage:{inputTokens:4,outputTokens:2}};
 }});
 const identity={task_id:randomUUID(),revision:'1',run_id:randomUUID(),attempt_id:randomUUID(),operation_id:randomUUID(),grant_id:randomUUID(),scope_sha256:'a'.repeat(64),config_sha256:'b'.repeat(64)};
 const input={identity,nativeBusinessTools:true,toolDiscovery:true,recoverInvalidArguments:true,prompt:'Calculate current materials',system:'Observe contract before explicit execution',signal:new AbortController().signal,authorize:()=>authorized,tools:[{name:'calculate_and_verify',description:'Local calculation',parameters,execute:async args=>{effects++;assert.deepEqual(args,{quantity:7});return {value:7};}},{name:'describe_business',description:'Understand',parameters:{type:'object',properties:{},additionalProperties:false},execute:async()=>{effects++;return {};}}]};
 if(['invalid-again','revoked','unavailable'].includes(mode)){await assert.rejects(()=>runtime.run(input));assert.equal(effects,0);}else{await runtime.run(input);assert.equal(effects,1);assert.equal(calls,mode==='batch'?3:4);}
 assert.equal(ledger.pending().length,0);assert.equal(ledger.read(identity.task_id).length,calls);
});


test('V13-CATALOG04: valid returned calculation reference executes through original native checks without a mandatory contract round trip',async()=>{
 const root=mkdtempSync(join(browserEvidenceRoot,'v13-valid-reference-')),ledger=createLocalAnalysisRequestLedger({projectRoot:root});let calls=0,effects=0,observed=false;
 const reference='a'.repeat(64),parameters={type:'object',properties:{calculation_ref:{type:'string',pattern:'^[a-f0-9]{64}$'},plan:{type:'object',properties:Object.fromEntries(Array.from({length:100},(_,i)=>['option_'+i,{type:'string',description:'Optional complex method field; use only declared values, no inferred defaults.'}]))}},additionalProperties:false};
 const runtime=createPiSessionOpenAnalysisRuntime({projectRoot:root,ledger,credentials:createApprovedProviderCredentials({environment:{}}),modelTransport:async request=>{calls++;if(calls===1)return {content:[{kind:'tool',id:'valid-ref',name:'calculate_and_verify',arguments:{calculation_ref:reference}}],stop:'tools',usage:{inputTokens:4,outputTokens:2}};const feedback=request.messages.filter(m=>m.role==='tool').map(m=>JSON.parse(m.text));observed=feedback.some(x=>x.value===7)&&!feedback.some(x=>x.status==='tool_contract');return {content:[{kind:'text',text:'Actual value consumed'}],stop:'complete',usage:{inputTokens:4,outputTokens:2}};}});
 const identity={task_id:randomUUID(),revision:'1',run_id:randomUUID(),attempt_id:randomUUID(),operation_id:randomUUID(),grant_id:randomUUID(),scope_sha256:'a'.repeat(64),config_sha256:'b'.repeat(64)};
 await runtime.run({identity,nativeBusinessTools:true,toolDiscovery:true,recoverInvalidArguments:true,prompt:'Use the returned valid reference',system:'No argument repair',signal:new AbortController().signal,authorize:()=>true,tools:[{name:'calculate_and_verify',description:'Calculate current declared reference',parameters,execute:async args=>{assert.deepEqual(args,{calculation_ref:reference});effects++;return {value:7};}}]});
 assert.equal(effects,1,'valid original reference must reach the business consumer exactly once');assert.equal(observed,true,'later model observes actual result, not a spurious discovery gate');assert.equal(calls,2);assert.equal(ledger.pending().length,0);assert.equal(ledger.read(identity.task_id).length,2);
});

for(const mode of ['correct','invalid-again','revoked','mixed-wrapper'] as const)test(`V13-NATIVE-JSON01 (${mode}): named native JSON text preserves original business parameters and guards`,async()=>{
 const root=mkdtempSync(join(browserEvidenceRoot,'native-json-')),ledger=createLocalAnalysisRequestLedger({projectRoot:root});let calls=0,authorized=true,effects=0,observed=false;
 const parameters={type:'object',properties:{plan:{type:'object',properties:{version:{type:'string',enum:['example']},quantity:{type:'integer'},label:{type:'string'},...Object.fromEntries(Array.from({length:100},(_,i)=>['option_'+i,{type:'string',description:'Optional exact method parameter, not a guessed default or business fact.'}]))},required:['version','quantity','label'],additionalProperties:false}},required:['plan'],additionalProperties:false};
 assert.ok(Buffer.byteLength(JSON.stringify(parameters))>8192);
 const exact={plan:{version:'example',quantity:7,label:'中文 \n indentation  \"quoted\"'}};
 const runtime=createPiSessionOpenAnalysisRuntime({projectRoot:root,ledger,credentials:createApprovedProviderCredentials({environment:{}}),modelTransport:async request=>{
  calls++;const tools=request.messages.flatMap(m=>m.tools??[]),large=tools.find(t=>t.name==='calculate_and_verify')!;
  assert.deepEqual(large.parameters.required,['arguments_json']);assert.equal(large.parameters.properties.arguments_json.type,'string');
  if(calls===1)return {content:[{kind:'tool',id:'read',name:'read_tool_contract',arguments:{name:'calculate_and_verify'}}],stop:'tools',usage:{inputTokens:4,outputTokens:2}};
  const results=request.messages.filter(m=>m.role==='tool').map(m=>JSON.parse(m.text));
  if(calls===2){assert.ok(results.some(x=>x.executed===false&&JSON.stringify(x.parameters)===JSON.stringify(parameters)));return {content:[{kind:'tool',id:'invalid',name:'calculate_and_verify',arguments:{arguments_json:JSON.stringify({plan:{...exact.plan,quantity:'7'}})}}],stop:'tools',usage:{inputTokens:4,outputTokens:2}};}
  if(calls===3){assert.equal(effects,0);assert.equal(results.at(-1).status,'invalid_arguments');if(mode==='revoked')authorized=false;const args=mode==='invalid-again'?{plan:{...exact.plan,quantity:'7'}}:exact;return {content:[{kind:'tool',id:'corrected',name:'calculate_and_verify',arguments:{arguments_json:JSON.stringify(args),...(mode==='mixed-wrapper'?{grant:true}:{})}}],stop:'tools',usage:{inputTokens:4,outputTokens:2}};}
  observed=results.some(x=>x.value===7);assert.equal(effects,1);return {content:[{kind:'text',text:'Actual exact result consumed'}],stop:'complete',usage:{inputTokens:4,outputTokens:2}};
 }});
 const identity={task_id:randomUUID(),revision:'1',run_id:randomUUID(),attempt_id:randomUUID(),operation_id:randomUUID(),grant_id:randomUUID(),scope_sha256:'a'.repeat(64),config_sha256:'b'.repeat(64)};
 const run={identity,nativeBusinessTools:true,toolDiscovery:true,recoverInvalidArguments:true,prompt:'Use exact original business contract',system:'No repair',signal:new AbortController().signal,authorize:()=>authorized,tools:[{name:'read_tool_contract',description:'Read current exact contract',parameters:{type:'object',properties:{name:{type:'string'}},required:['name'],additionalProperties:false},execute:async()=>({name:'calculate_and_verify',parameters,executed:false})},{name:'calculate_and_verify',description:'Actual local consumer',parameters,execute:async args=>{assert.deepEqual(args,exact);effects++;return {value:7};}}]};
 if(mode==='correct'){await runtime.run(run);assert.equal(observed,true);assert.equal(calls,4);assert.equal(effects,1);}else{await assert.rejects(()=>runtime.run(run));assert.equal(calls,3);assert.equal(effects,0);}
 assert.equal(ledger.read(identity.task_id).length,calls);assert.equal(ledger.pending().length,0);
});

for(const mode of ['correct','invalid-again','malformed','mixed-wrapper','revoked'] as const)test(`V13-NATIVE-JSON03 (${mode}): small nested contracts reach the original consumer exactly and reject invalid row types`,async()=>{
 const root=mkdtempSync(join(browserEvidenceRoot,'native-small-json-')),ledger=createLocalAnalysisRequestLedger({projectRoot:root});let calls=0,authorized=true,effects=0,observed=false;const projections:{wire:any;description:string;scalar:unknown}[]=[];
 const parameters={type:'object',properties:{references:{type:'array',items:{type:'object',properties:{row:{type:'integer'},labels:{type:'array',items:{type:'string'}},optional:{anyOf:[{type:'string'},{type:'null'}]}},required:['row','labels','optional'],additionalProperties:false}}},required:['references'],additionalProperties:false};
 const scalar={type:'object',properties:{name:{type:'string'}},required:['name'],additionalProperties:false};
 const exact={references:[{row:2,labels:['人民币万元','中文\n  quoted "value"'],optional:null}]};
 const runtime=createPiSessionOpenAnalysisRuntime({projectRoot:root,ledger,credentials:createApprovedProviderCredentials({environment:{}}),modelTransport:async request=>{
  calls++;const declarations=request.messages.flatMap(m=>m.tools??[]),business=declarations.find(t=>t.name==='interpret_meaning')!;
  projections.push({wire:business.parameters,description:business.description,scalar:declarations.find(t=>t.name==='read_tool_contract')!.parameters});
  if(calls===1)return {content:[{kind:'tool',id:'bad-row',name:'interpret_meaning',arguments:{arguments_json:JSON.stringify({references:[{...exact.references[0],row:'2'}]})}}],stop:'tools',usage:{inputTokens:4,outputTokens:2}};
  if(calls===2){const feedback=JSON.parse(request.messages.filter(m=>m.role==='tool').at(-1)!.text);assert.equal(feedback.status,'invalid_arguments');assert.equal(effects,0);if(mode==='revoked')authorized=false;return {content:[{kind:'tool',id:'explicit-next',name:'interpret_meaning',arguments:{arguments_json:mode==='malformed'?'{':JSON.stringify(mode==='invalid-again'?{references:[{...exact.references[0],row:'2'}]}:exact),...(mode==='mixed-wrapper'?{grant:true}:{})}}],stop:'tools',usage:{inputTokens:4,outputTokens:2}};}
  observed=request.messages.filter(m=>m.role==='tool').some(m=>JSON.parse(m.text).value===7);assert.equal(observed,true);return {content:[{kind:'text',text:'实际业务结果已消费'}],stop:'complete',usage:{inputTokens:4,outputTokens:2}};
 }});
 const identity={task_id:randomUUID(),revision:'1',run_id:randomUUID(),attempt_id:randomUUID(),operation_id:randomUUID(),grant_id:randomUUID(),scope_sha256:'a'.repeat(64),config_sha256:'b'.repeat(64)};
 const input={identity,nativeBusinessTools:true,toolDiscovery:true,recoverInvalidArguments:true,prompt:'Use the exact current small contract',system:'No host parameter repair',signal:new AbortController().signal,authorize:()=>authorized,tools:[{name:'interpret_meaning',description:'Original business consumer',parameters,execute:async args=>{assert.deepEqual(args,exact);effects++;return {value:7};}},{name:'read_tool_contract',description:'Read declared contract',parameters:scalar,execute:async()=>{assert.fail('small contracts require no extra discovery round');}}]};
 if(mode==='correct'){await runtime.run(input);assert.equal(effects,1);assert.equal(calls,3);assert.equal(observed,true);}else{await assert.rejects(()=>runtime.run(input));assert.equal(effects,0);assert.equal(calls,2);}
 for(const projection of projections){assert.deepEqual(projection.wire.required,['arguments_json'],'small nested wire must use the declared JSON text entrance');assert.equal(projection.wire.properties.arguments_json.type,'string');assert.ok(projection.description.includes(JSON.stringify(parameters)),'small original contract is visible before any contract request');assert.deepEqual(projection.scalar,scalar,'scalar parameters keep their direct declaration');}
 assert.equal(ledger.pending().length,0);assert.equal(ledger.read(identity.task_id).length,calls);
});

test('V13-NATIVE-JSON03 / V13-UI-TRACE01: exact named JSON delegation survives disk reopen and proves later opinion consumption',async()=>{
 const root=mkdtempSync(join(browserEvidenceRoot,'native-json-trace-')),ledger=createLocalAnalysisRequestLedger({projectRoot:root});let calls=0,effects=0;const child=randomUUID(),material=randomUUID(),resultId=randomUUID(),signal=new AbortController().signal;
 const exact={kind:'subagent',material_id:material,instruction:{action:'独立调查',references:['source.row.2']}};
 const parameters={type:'object',properties:{kind:{type:'string',enum:['subagent']},material_id:{type:'string'},instruction:{type:'object',properties:{action:{type:'string'},references:{type:'array',items:{type:'string'}}},required:['action','references'],additionalProperties:false}},required:['kind','material_id','instruction'],additionalProperties:false};
 const make=()=>createPiSessionOpenAnalysisRuntime({projectRoot:root,ledger,credentials:createApprovedProviderCredentials({environment:{}}),modelTransport:async request=>{
  calls++;if(calls===1)return {content:[{kind:'tool',id:'delegate-json',name:'delegate_analysis',arguments:{arguments_json:JSON.stringify(exact)}}],stop:'tools',usage:{inputTokens:4,outputTokens:2}};
  if(calls===2)return {content:[{kind:'tool',id:'returned-opinion',name:'read_delegation_results',arguments:{}}],stop:'tools',usage:{inputTokens:4,outputTokens:2}};
  assert.ok(request.messages.some(m=>m.role==='tool'&&m.text.includes(resultId)),'later model observes the actual returned opinion');return {content:[{kind:'text',text:'实际意见改变了后续调查'}],stop:'complete',usage:{inputTokens:4,outputTokens:2}};
 }});
 const identity={task_id:randomUUID(),revision:'1',run_id:randomUUID(),attempt_id:randomUUID(),operation_id:randomUUID(),grant_id:randomUUID(),scope_sha256:'a'.repeat(64),config_sha256:'b'.repeat(64)};
 await make().run({identity,nativeBusinessTools:true,toolDiscovery:true,prompt:'Delegate authorized materials',system:'Use actual returned opinions',signal,authorize:()=>true,tools:[{name:'delegate_analysis',description:'Delegate actual work',parameters,execute:async args=>{assert.deepEqual(args,exact);effects++;return {child_id:child,state:'queued'};}},{name:'read_delegation_results',description:'Read actual opinions',parameters:{type:'object',properties:{},additionalProperties:false},execute:async()=>[{classification:'MODEL',result:{id:resultId,child_session_id:child}}]}]});
 const before=ledger.read(identity.task_id),reader=make();const trace=await reader.collaborationTrace!({identity,signal,authorize:()=>true});assert.equal(effects,1);assert.equal(calls,3);assert.deepEqual(ledger.read(identity.task_id),before);assert.equal(trace.created[0]?.child_id,child);assert.equal(trace.created[0]?.material_id,material);assert.equal(trace.consumed[0]?.result_id,resultId);assert.ok(trace.consumed[0]!.history_position>trace.created[0]!.history_position);
 await assert.rejects(()=>reader.collaborationTrace!({identity,signal,authorize:()=>false}),{code:'AUTHORITY_REQUIRED'});assert.equal(calls,3);
});

test('V13-MODEL-PURPOSE01: explicit MiMo analysis consumes actual tool feedback, meters root/child/report correctly and rejects old Task model mutation',async()=>{
 const root=mkdtempSync(join(browserEvidenceRoot,'v13-mimo-purpose-')),ledger=createLocalAnalysisRequestLedger({projectRoot:root});let calls=0,effects=0;const models:string[]=[],seenTools:number[]=[];
 const transport:ModelTransport=async request=>{calls++;models.push(request.model.provider+'/'+request.model.id);seenTools.push(request.messages.flatMap(m=>m.tools??[]).length);
  if(calls===1)return {content:[{kind:'tool',id:'mimo-calc',name:'describe_business',arguments:{quantity:7}}],stop:'tools',usage:{inputTokens:4,outputTokens:2}};
  if(calls===2)assert.ok(request.messages.some(m=>m.role==='tool'&&m.text.includes('7')));
  return {content:[{kind:'text',text:'实际数量为7'}],stop:'complete',usage:{inputTokens:4,outputTokens:2}};
 };
 const make=(analysisModel:'MiniMax-M3'|'mimo-v2.6-flash')=>createPiSessionOpenAnalysisRuntime({projectRoot:root,ledger,credentials:createApprovedProviderCredentials({environment:{}}),analysisModel,modelTransport:transport});
 const runtime=make('mimo-v2.6-flash'),identity={task_id:randomUUID(),revision:'1',run_id:randomUUID(),attempt_id:randomUUID(),operation_id:randomUUID(),grant_id:randomUUID(),scope_sha256:'a'.repeat(64),config_sha256:'b'.repeat(64)},signal=new AbortController().signal;
 const base={identity,nativeBusinessTools:true,prompt:'核对数量',system:'依据工具',signal,authorize:()=>true,tools:[{name:'describe_business',description:'数量实际计算',parameters:{type:'object',properties:{quantity:{type:'integer'}},required:['quantity'],additionalProperties:false},execute:async args=>{effects++;assert.deepEqual(args,{quantity:7});return {value:7};}}]};
 const result=await runtime.run(base);assert.equal(result.provider,'xiaomi-token-plan-cn');assert.equal(result.model,'mimo-v2.6-flash');assert.equal(effects,1);
 await runtime.run({...base,conversation_id:randomUUID(),tools:[],prompt:'独立意见'});
 await runtime.run({...base,purpose:'report_edit',tools:[],prompt:'解释已经核验的7'});
 assert.deepEqual(models,Array(4).fill('xiaomi-token-plan-cn/mimo-v2.6-flash'));assert.equal(seenTools.at(-1),0);
 assert.equal(ledger.read(identity.task_id).length,4);assert.ok(ledger.read(identity.task_id).every(r=>r.provider==='xiaomi-token-plan-cn'&&r.model==='mimo-v2.6-flash'&&r.status==='succeeded'));assert.equal(ledger.pending().length,0);
 await assert.rejects(()=>make('MiniMax-M3').run({...base,tools:[],prompt:'不能改旧Task型号'}),{code:'CONFIGURATION_CHANGED'});assert.equal(calls,4);assert.equal(effects,1);assert.equal(ledger.read(identity.task_id).length,4);
});


test('V13-RECOVERY087: actual native failed result only reconciles after exact known nonissued usage is settled',async()=>{
 const root=mkdtempSync(join(browserEvidenceRoot,'native-unissued-recovery-')),ledger=createLocalAnalysisRequestLedger({projectRoot:root});let calls=0;
 const state=createPersistentRuntimeState({projectRoot:root}),runtime=createPiSessionOpenAnalysisRuntime({projectRoot:root,ledger,credentials:createApprovedProviderCredentials({environment:{}}),modelTransport:async()=>{calls++;const delayedUntil=performance.now()+8;while(performance.now()<delayedUntil){}throw Object.assign(Error('EXTERNAL_ADMISSION_DENIED'),{code:'EXTERNAL_ADMISSION_DENIED'});}});
 const identity={task_id:randomUUID(),revision:'1',run_id:randomUUID(),attempt_id:randomUUID(),operation_id:randomUUID(),grant_id:randomUUID(),scope_sha256:'a'.repeat(64),config_sha256:'b'.repeat(64)};const control={identity,signal:new AbortController().signal,authorize:()=>true};
 await assert.rejects(()=>runtime.run({...control,prompt:'只读已批准合成资料',system:'不得新增作用',tools:[]}));
 assert.equal(calls,1);assert.equal(ledger.read(identity.task_id).at(-1)!.status,'unknown');assert.equal(await runtime.reconcileStopped!(control),false);
 const receipt=ledger.read(identity.task_id).at(-1)!;const accounting=state.readAccounting(identity.task_id)!;assert.equal(accounting.reservations.length,1);assert.equal(accounting.usage.modelCalls,1);
 assert.equal(receipt.usage.active_ms.kind,'known');if(receipt.usage.active_ms.kind!=='known')throw Error('expected measured elapsed');assert.ok(BigInt(receipt.usage.active_ms.value)>=8n);
 assert.throws(()=>ledger.settle(receipt.request_id,{status:'failed',reason:'REQUEST_FAILED',usage:{input_tokens:{kind:'known',value:'0'},output_tokens:{kind:'known',value:'0'},active_ms:{kind:'known',value:'1'},wait_ms:receipt.usage.wait_ms}}),{code:'CONSUMPTION_REGRESSION'});assert.deepEqual(ledger.read(identity.task_id).at(-1),receipt,'rejected lower meter does not mutate receipt');
 ledger.settle(receipt.request_id,{status:'failed',reason:'REQUEST_FAILED',usage:{input_tokens:{kind:'known',value:'0'},output_tokens:{kind:'known',value:'0'},active_ms:receipt.usage.active_ms,wait_ms:receipt.usage.wait_ms}});assert.deepEqual(ledger.read(identity.task_id).at(-1)!.usage.active_ms,receipt.usage.active_ms);
 assert.equal(await runtime.reconcileStopped!(control),false,'unsettled native reserve remains authoritative');
 assert.ok('cumulative' in accounting.limits);if(!('cumulative' in accounting.limits))throw Error('expected uncapped');
 const reservation=accounting.reservations[0]!,lease=await state.budgets.claimUncapped(identity.task_id,reservation.owner,accounting.configuration,accounting.limits);await lease.settleModelUsage(reservation.tokens,{inputTokens:0,outputTokens:0});await lease.release(0);
 assert.equal(await runtime.reconcileStopped!({...control,authorize:()=>false}),false);assert.equal(await runtime.reconcileStopped!({...control,identity:{...identity,grant_id:randomUUID()}}),false);assert.equal(await runtime.reconcileStopped!({...control,identity:{...identity,revision:'2'}}),false);
 assert.equal(await runtime.reconcileStopped!(control),true);assert.equal(calls,1,'reconciliation dispatches no model');const after=state.readAccounting(identity.task_id)!;assert.equal(after.usage.modelCalls,1);assert.equal(after.usage.reservedOutputTokens,0);assert.equal(after.configuration,accounting.configuration);assert.equal(ledger.read(identity.task_id).length,1);assert.equal(ledger.read(identity.task_id)[0]!.calls,1);assert.ok(state.readAudit(identity.task_id).some(e=>e.kind==='run.finished'&&e.reason==='STATE_FAILED'));
});

test('V13-RECOVERY087: native failed tool with unknown effect cannot use model settlement as recovery authority',async()=>{
 const root=mkdtempSync(join(browserEvidenceRoot,'native-unsettled-effect-')),ledger=createLocalAnalysisRequestLedger({projectRoot:root});
 const runtime=createPiSessionOpenAnalysisRuntime({projectRoot:root,ledger,credentials:createApprovedProviderCredentials({environment:{}}),modelTransport:async()=>({content:[{kind:'tool',id:'unknown-effect',name:'analysis_tool',arguments:{name:'effect',arguments_json:'{}'}}],stop:'tools',usage:{inputTokens:3,outputTokens:1}})});
 const identity={task_id:randomUUID(),revision:'1',run_id:randomUUID(),attempt_id:randomUUID(),operation_id:randomUUID(),grant_id:randomUUID(),scope_sha256:'a'.repeat(64),config_sha256:'b'.repeat(64)},control={identity,signal:new AbortController().signal,authorize:()=>true};
 await assert.rejects(()=>runtime.run({...control,prompt:'检查授权作用',system:'未知不能重放',tools:[{name:'effect',description:'真实作用边界',parameters:{type:'object',properties:{},additionalProperties:false},execute:async()=>{throw Object.assign(Error('EXECUTION_UNKNOWN'),{code:'EXECUTION_UNKNOWN'});}}]}));
 assert.ok(ledger.read(identity.task_id).every(r=>r.status==='succeeded'));assert.equal(await runtime.reconcileStopped!(control),false);
});

for(const boundary of ['item-wrapper','extra-field','foreign-path','too-many-references','revoked','contract'] as const)test(`V13-DELEGATION-WIRE090 (${boundary}): installed native object dispatch preserves exact selection and rejects unsafe effects`,async()=>{
 const {delegationToolSchema,createDelegationMaterialReferences}=await import('../../../packages/application/open-analysis-delegation.ts');
 const root=mkdtempSync(join(browserEvidenceRoot,'v13-flat-delegation-')),ledger=createLocalAnalysisRequestLedger({projectRoot:root});
 const identity={task_id:randomUUID(),revision:'1',run_id:randomUUID(),attempt_id:randomUUID(),operation_id:randomUUID(),grant_id:randomUUID(),scope_sha256:'a'.repeat(64),config_sha256:'b'.repeat(64)};
 const paths=['/calculation','/verification'],materialIds=Array.from({length:7},()=>randomUUID());
 const selection=createDelegationMaterialReferences({materials:async()=>materialIds.map(material_id=>({material_id,label:'实际选定核验摘要',verification:'independent_arithmetic',instruction_contract:{actions:['compare'],reference_paths:paths}}))} as any,identity);
 const catalog=await selection.read();let authorized=true,calls=0,effects=0;let observedContract=false;
 const exact={kind:'subagent',task:'检查选定核验摘要',action:'compare',material_ids:[catalog[0].material_id],reference_paths:['/calculation'],completion_reference_paths:['/calculation']};
 const bad=boundary==='item-wrapper'?{...exact,reference_paths:{item:['/calculation']}}:boundary==='extra-field'?{...exact,grant:true}:boundary==='foreign-path'?{...exact,reference_paths:['/secret'],completion_reference_paths:['/secret']}:boundary==='too-many-references'?{...exact,material_ids:catalog.map(m=>m.material_id),reference_paths:paths,completion_reference_paths:paths}:exact;
 const runtime=createPiSessionOpenAnalysisRuntime({projectRoot:root,ledger,credentials:createApprovedProviderCredentials({environment:{}}),nativeObjectArguments:true,modelTransport:async request=>{
  calls++;if(boundary==='contract'&&calls===1)return {content:[{kind:'tool',id:'contract',name:'read_tool_contract',arguments:{name:'delegate_analysis'}}],stop:'tools',usage:{inputTokens:4,outputTokens:2}};
  if(boundary==='contract'&&calls===2){const result=JSON.parse(request.messages.filter(m=>m.role==='tool').at(-1)!.text),declared=request.messages.flatMap(m=>m.tools??[]).find(t=>t.name==='delegate_analysis')!;assert.deepEqual(result.parameters,declared.parameters);assert.equal(result.parameters.properties.instruction,undefined);observedContract=true;}
  if(boundary==='contract'&&calls===3)return {content:[{kind:'text',text:'选定材料检查已提交'}],stop:'complete',usage:{inputTokens:4,outputTokens:2}};
  if(boundary==='revoked')authorized=false;
  return {content:[{kind:'tool',id:'delegate-'+calls,name:'delegate_analysis',arguments:bad}],stop:'tools',usage:{inputTokens:4,outputTokens:2}};
 }});
 const input={identity,nativeBusinessTools:true,recoverInvalidArguments:true,prompt:'仅在选定范围委派',system:'遵守当前合同',signal:new AbortController().signal,authorize:()=>authorized,tools:[{name:'delegate_analysis',description:'委派已有材料',parameters:delegationToolSchema,execute:async(args:Readonly<Record<string,unknown>>)=>{assert.equal(Object.hasOwn(args,'action'),false);assert.deepEqual(args.instruction,{action:'compare',reference_paths:bad.reference_paths,completion_reference_paths:bad.completion_reference_paths});const selected=selection.resolveToolSelection(args);assert.equal(selected.material_id,materialIds[0]);effects++;return {state:'queued',child_id:randomUUID()};}},{name:'read_tool_contract',description:'读取当前合同',parameters:{type:'object',properties:{name:{type:'string'}},required:['name'],additionalProperties:false},execute:async()=>({name:'delegate_analysis',parameters:delegationToolSchema,executed:false})}]};
 if(boundary==='contract'){await runtime.run(input);assert.equal(observedContract,true);assert.equal(effects,1);}else{await assert.rejects(()=>runtime.run(input));assert.equal(effects,0);}
 assert.equal(ledger.pending().length,0);assert.equal(ledger.read(identity.task_id).length,calls);
});

for(const query of ['snapshot','trace'] as const)for(const next of ['root','child'] as const)test(`V13-NATIVE-READ-CONTEXT091 (${query}/${next}): an idle native read cannot occupy the next authorized writer`,async()=>{
 const root=mkdtempSync(join(browserEvidenceRoot,'v13-read-context-')),ledger=createLocalAnalysisRequestLedger({projectRoot:root});let calls=0;
 const runtime=createPiSessionOpenAnalysisRuntime({projectRoot:root,ledger,credentials:createApprovedProviderCredentials({environment:{}}),nativeObjectArguments:true,modelTransport:async()=>{calls++;return {content:[{kind:'text',text:'已消费本轮任务上下文'}],stop:'complete',usage:{inputTokens:4,outputTokens:2}};}});
 const identity={task_id:randomUUID(),revision:'1',run_id:randomUUID(),attempt_id:randomUUID(),operation_id:randomUUID(),grant_id:randomUUID(),scope_sha256:'a'.repeat(64),config_sha256:'b'.repeat(64)},signal=new AbortController().signal;
 const base={identity,prompt:'初次分析',system:'只使用获准上下文',tools:[],signal,authorize:()=>true};await runtime.run(base);
 const reading=query==='snapshot'?runtime.sessionControl!({identity,command:{kind:'snapshot'},signal,authorize:()=>true}):runtime.collaborationTrace!({identity,signal,authorize:()=>true});
 const running=runtime.run({...base,prompt:'继续本次调查',identity:{...identity,run_id:randomUUID(),operation_id:randomUUID()},...(next==='child'?{conversation_id:randomUUID()}: {})});
 const settled=await Promise.allSettled([reading,running]);assert.equal(settled[0].status,'fulfilled');assert.equal(settled[1].status,'fulfilled',settled[1].status==='rejected'?String(settled[1].reason.code):'');assert.equal(calls,2,'one request per analysis, zero from the read');assert.equal(ledger.pending().length,0);assert.equal(ledger.read(identity.task_id).length,2);
});

for(const boundary of ['cancel-waiter','revoke-waiter','second-writer'] as const)test(`V13-NATIVE-READ-CONTEXT091 (${boundary}): read coordination never admits cancelled, revoked or overlapping execution`,async()=>{
 const root=mkdtempSync(join(browserEvidenceRoot,'v13-read-context-negative-')),ledger=createLocalAnalysisRequestLedger({projectRoot:root});let calls=0,releaseModel!:()=>void,enteredModel!:()=>void;
 const entered=new Promise<void>(done=>{enteredModel=done;});
 const runtime=createPiSessionOpenAnalysisRuntime({projectRoot:root,ledger,credentials:createApprovedProviderCredentials({environment:{}}),nativeObjectArguments:true,modelTransport:async()=>{calls++;if(boundary==='second-writer'&&calls===2){enteredModel();await new Promise<void>(done=>{releaseModel=done;});}return {content:[{kind:'text',text:'本轮已结束'}],stop:'complete',usage:{inputTokens:4,outputTokens:2}};}});
 const identity={task_id:randomUUID(),revision:'1',run_id:randomUUID(),attempt_id:randomUUID(),operation_id:randomUUID(),grant_id:randomUUID(),scope_sha256:'a'.repeat(64),config_sha256:'b'.repeat(64)},signal=new AbortController().signal;
 const base={identity,prompt:'初次',system:'按当前授权执行',tools:[],signal,authorize:()=>true};await runtime.run(base);
 if(boundary==='second-writer'){
  const running=runtime.run({...base,prompt:'第二轮'});await entered;
  const reading=runtime.sessionControl!({identity,command:{kind:'snapshot'},signal,authorize:()=>true});
  await assert.rejects(()=>runtime.run({...base,prompt:'不允许重叠的第三轮'}),{code:'TASK_BUSY'});await reading;releaseModel();await running;assert.equal(calls,2);
 }else{
  const reading=runtime.sessionControl!({identity,command:{kind:'snapshot'},signal,authorize:()=>true});
  const controller=new AbortController();let allowed=true;
  const running=runtime.run({...base,prompt:'等待读取后的执行',signal:controller.signal,authorize:()=>allowed});
  if(boundary==='cancel-waiter')controller.abort();else allowed=false;
  const [readResult,runResult]=await Promise.allSettled([reading,running]);assert.equal(readResult.status,'fulfilled');assert.equal(runResult.status,'rejected');if(runResult.status==='rejected')assert.equal(runResult.reason.code,boundary==='cancel-waiter'?'CANCELLED':'AUTHORITY_REQUIRED');assert.equal(calls,1);
 }
 assert.equal(ledger.pending().length,0);assert.equal(ledger.read(identity.task_id).length,calls);
});

test('V13-NATIVE-IDLE-BOUNDARY092: cancellation cannot release product context before admitted tool settlement',async()=>{
 const root=mkdtempSync(join(browserEvidenceRoot,'v13-native-idle-')),ledger=createLocalAnalysisRequestLedger({projectRoot:root});let calls=0,enteredTool!:()=>void,releaseTool!:()=>void,settled=false,toolSettled=false;
 const entered=new Promise<void>(done=>{enteredTool=done;}),held=new Promise<void>(done=>{releaseTool=done;});
 const runtime=createPiSessionOpenAnalysisRuntime({projectRoot:root,ledger,credentials:createApprovedProviderCredentials({environment:{}}),nativeObjectArguments:true,modelTransport:async()=>{calls++;return {content:[{kind:'tool',id:'admitted-tool',name:'read_analysis_evidence',arguments:{}}],stop:'tools',usage:{inputTokens:4,outputTokens:2}};}});
 const identity={task_id:randomUUID(),revision:'1',run_id:randomUUID(),attempt_id:randomUUID(),operation_id:randomUUID(),grant_id:randomUUID(),scope_sha256:'a'.repeat(64),config_sha256:'b'.repeat(64)},controller=new AbortController(),signal=controller.signal;
 const base={identity,nativeBusinessTools:true,prompt:'检查实际停止边界',system:'保留实际工具状态',signal,authorize:()=>true,tools:[{name:'read_analysis_evidence',description:'检查已准入效果',parameters:{type:'object',properties:{},additionalProperties:false},execute:async()=>{enteredTool();await held;toolSettled=true;return {settled:true};}}]};
 const running=runtime.run(base).then(value=>{settled=true;return {value};},error=>{settled=true;return {error};});
 try{
  await entered;controller.abort();await new Promise<void>(done=>setImmediate(done));await new Promise<void>(done=>setImmediate(done));
  assert.equal(settled,false,'native early terminal return must not release context while the admitted tool still owns physical work');
  await assert.rejects(()=>runtime.run({...base,prompt:'不能重叠执行'}),{code:'TASK_BUSY'});
 }finally{releaseTool();}
 const result=await running;assert.equal(toolSettled,true);assert.ok('error' in result);if('error' in result)assert.equal(result.error.code??result.error.reason,'CANCELLED');assert.equal(calls,1);assert.equal(ledger.pending().length,0);
});


test('V13-CLOSED-MODEL098: explicit reconciliation retains unknown usage and budget reserve across native same-task resume and reopen',async()=>{
 const {RuntimeFault}=await import('pi-agent-runtime');
 const root=mkdtempSync(join(browserEvidenceRoot,'closed-model-unknown-')),ledger=createLocalAnalysisRequestLedger({projectRoot:root});let calls=0;
 const transport:ModelTransport=async()=>{calls++;if(calls===1)throw new RuntimeFault('MODEL_FAILED');return {content:[{kind:'text',text:'New admitted work only; old response was not replayed.'}],stop:'complete',usage:{inputTokens:7,outputTokens:3}};};
 const make=()=>createPiSessionOpenAnalysisRuntime({projectRoot:root,ledger,credentials:createApprovedProviderCredentials({environment:{}}),modelTransport:transport});
 const runtime=make(),identity={task_id:randomUUID(),revision:'1',run_id:randomUUID(),attempt_id:randomUUID(),operation_id:randomUUID(),grant_id:randomUUID(),scope_sha256:'a'.repeat(64),config_sha256:'b'.repeat(64)},control={identity,signal:new AbortController().signal,authorize:()=>true};
 await assert.rejects(()=>runtime.run({...control,prompt:'Authorized synthetic input',system:'No unknown tool replay',tools:[]}),{code:'MODEL_FAILED'});
 const state=createPersistentRuntimeState({projectRoot:root}),receipt=ledger.read(identity.task_id)[0]!,accounting=state.readAccounting(identity.task_id)!;
 assert.equal(receipt.status,'unknown');assert.equal(receipt.usage.input_tokens.kind,'unknown');assert.equal(receipt.usage.output_tokens.kind,'unknown');assert.equal(accounting.usage.reservedOutputTokens,4096);assert.equal(await runtime.reconcileStopped!(control),false);
 // Trusted host has independently observed transport completion and no effects.
 ledger.settle(receipt.request_id,{status:'failed',reason:'REQUEST_FAILED',usage:receipt.usage});
 assert.equal(await runtime.reconcileStopped!({...control,authorize:()=>false}),false);assert.equal(await runtime.reconcileStopped!({...control,identity:{...identity,grant_id:randomUUID()}}),false);
 assert.equal(await runtime.reconcileStopped!(control),true);assert.equal(calls,1);assert.deepEqual(state.readAccounting(identity.task_id),accounting);
 assert.equal(await make().reconcileStopped!(control),true,'reopen must preserve the exact unknown charge and allow only explicit resume');
 const result=await make().run({...control,prompt:'Explicitly continue the same Task',system:'Retain original failed receipt',tools:[]});assert.match(result.text,/New admitted work/);
 const after=state.readAccounting(identity.task_id)!;assert.deepEqual(after.reservations,accounting.reservations);assert.equal(after.usage.reservedOutputTokens,4096);assert.equal(after.usage.modelCalls,2);assert.equal(after.usage.outputTokens,4099);assert.equal(after.usage.inputTokens,7);
 const rows=ledger.read(identity.task_id);assert.equal(rows.length,2);assert.equal(rows[0]!.status,'failed');assert.deepEqual(rows[0]!.usage,receipt.usage);assert.equal(rows[0]!.calls,receipt.calls);assert.equal(rows[1]!.status,'succeeded');assert.equal(ledger.pending().length,0);
});


test('V13-CLOSED-MODEL098: an active native request cannot be reconciled by an early failed ledger receipt',async()=>{
 const root=mkdtempSync(join(browserEvidenceRoot,'closed-model-still-active-')),ledger=createLocalAnalysisRequestLedger({projectRoot:root});let finish!:(v:any)=>void,entered!:()=>void,calls=0;const ready=new Promise<void>(r=>entered=r),gate=new Promise<any>(r=>finish=r);
 const transport:ModelTransport=async()=>{calls++;entered();return gate;};const make=()=>createPiSessionOpenAnalysisRuntime({projectRoot:root,ledger,credentials:createApprovedProviderCredentials({environment:{}}),modelTransport:transport});
 const identity={task_id:randomUUID(),revision:'1',run_id:randomUUID(),attempt_id:randomUUID(),operation_id:randomUUID(),grant_id:randomUUID(),scope_sha256:'a'.repeat(64),config_sha256:'b'.repeat(64)},control={identity,signal:new AbortController().signal,authorize:()=>true};
 const run=make().run({...control,prompt:'Known synthetic data',system:'No extra effects',tools:[]});await ready;
 try{const receipt=ledger.read(identity.task_id)[0]!;ledger.settle(receipt.request_id,{status:'failed',reason:'REQUEST_FAILED',usage:receipt.usage});assert.equal(await make().reconcileStopped!(control),false);assert.equal(calls,1);assert.notEqual(createPersistentRuntimeState({projectRoot:root}).readAccounting(identity.task_id)!.owner,null);}finally{finish({content:[{kind:'text',text:'Late output must not publish.'}],stop:'complete',usage:{inputTokens:2,outputTokens:1}});await run.catch(()=>{});}
});


test('V13-CLOSED-MODEL098: a reserve without matching native failure evidence remains blocking and is never refunded',async()=>{
 const {RuntimeFault}=await import('pi-agent-runtime');const root=mkdtempSync(join(browserEvidenceRoot,'closed-model-unmatched-reserve-')),ledger=createLocalAnalysisRequestLedger({projectRoot:root});
 const runtime=createPiSessionOpenAnalysisRuntime({projectRoot:root,ledger,credentials:createApprovedProviderCredentials({environment:{}}),modelTransport:async()=>{throw new RuntimeFault('MODEL_FAILED');}});
 const identity={task_id:randomUUID(),revision:'1',run_id:randomUUID(),attempt_id:randomUUID(),operation_id:randomUUID(),grant_id:randomUUID(),scope_sha256:'a'.repeat(64),config_sha256:'b'.repeat(64)},control={identity,signal:new AbortController().signal,authorize:()=>true};
 await assert.rejects(()=>runtime.run({...control,prompt:'Known synthetic input',system:'Do not execute unconfirmed effects',tools:[]}));const state=createPersistentRuntimeState({projectRoot:root}),row=ledger.read(identity.task_id)[0]!;ledger.settle(row.request_id,{status:'failed',reason:'REQUEST_FAILED',usage:row.usage});
 const initial=state.readAccounting(identity.task_id)!;assert.ok('cumulative' in initial.limits);if(!('cumulative' in initial.limits))throw Error('Expected native uncapped contract');
 const extra=await state.budgets.claimUncapped(identity.task_id,randomUUID(),initial.configuration,initial.limits);await extra.reserveModelUpTo(4096);await extra.release(0);const before=state.readAccounting(identity.task_id)!;assert.equal(before.usage.reservedOutputTokens,8192);assert.equal(await runtime.reconcileStopped!(control),false);assert.deepEqual(state.readAccounting(identity.task_id),before);
});


test('V13-NATIVE-BRANCH111: sameTask native fork navigates without changing tool configuration, meters current continuation and preserves old branch rollback',async()=>{
 const root=mkdtempSync(join(browserEvidenceRoot,'native-branch111-')),ledger=createLocalAnalysisRequestLedger({projectRoot:root});let calls=0;const inputs:string[]=[];let effects=0;
 const make=()=>createPiSessionOpenAnalysisRuntime({projectRoot:root,ledger,credentials:createApprovedProviderCredentials({environment:{}}),modelTransport:async request=>{calls++;inputs.push(request.messages.map(m=>m.text??'').join('\n'));return {content:[{kind:'text',text:'已根据当前有效输入答复'}],stop:'complete',usage:{inputTokens:5,outputTokens:3}};}});
 const identity={task_id:randomUUID(),revision:'1',run_id:randomUUID(),attempt_id:randomUUID(),operation_id:randomUUID(),grant_id:randomUUID(),scope_sha256:'a'.repeat(64),config_sha256:'b'.repeat(64)};
 const base={identity,nativeBusinessTools:true,prompt:'OLD_FAILED_DIALOGUE_SENTINEL',system:'只使用当前获准输入',tools:[{name:'current_business_fact',description:'读取当前业务事实',parameters:{type:'object',properties:{},additionalProperties:false},execute:async()=>{effects++;return {verified:false};}}],signal:new AbortController().signal,authorize:()=>true};const runtime=make();await runtime.run(base);const state=createPersistentRuntimeState({projectRoot:root}),original=state.readSelectedSession(identity.task_id,'analysis_native')!;
 const before=await runtime.sessionControl!({identity,purpose:'analysis',command:{kind:'snapshot'},signal:base.signal,authorize:base.authorize});assert.ok(before.view?.tipId);const tip=before.view.tipId;
 const fork=await runtime.sessionControl!({identity,purpose:'analysis',command:{kind:'fork'},signal:base.signal,authorize:base.authorize});assert.ok(fork.sessionId);assert.notEqual(fork.sessionId,original);assert.equal(state.readSelectedSession(identity.task_id,'analysis_native'),fork.sessionId);
 await runtime.sessionControl!({identity,purpose:'analysis',command:{kind:'navigate',entryId:null,summarize:false},signal:base.signal,authorize:base.authorize});assert.equal(calls,1,'navigation with no summary sends no model request');assert.equal(state.readSession(identity.task_id,'analysis_native'),original,'original JSONL identity is retained');
 const current={...base,identity:{...identity,operation_id:randomUUID(),attempt_id:randomUUID()},prompt:'CURRENT_EFFECTIVE_INPUT_SENTINEL'};await make().run(current);assert.equal(calls,2);assert.ok(inputs[1].includes('CURRENT_EFFECTIVE_INPUT_SENTINEL'));assert.equal(inputs[1].includes('OLD_FAILED_DIALOGUE_SENTINEL'),false);assert.equal(effects,0);assert.equal(ledger.read(identity.task_id).length,2);assert.equal(ledger.pending().length,0);
 await make().sessionControl!({identity:current.identity,purpose:'analysis',command:{kind:'navigate',entryId:tip,summarize:false},signal:base.signal,authorize:base.authorize});const old=await make().sessionControl!({identity:current.identity,purpose:'analysis',command:{kind:'snapshot'},signal:base.signal,authorize:base.authorize});assert.equal(old.view?.tipId,tip);assert.equal(calls,2,'rollback is not a model execution');await make().run({...current,identity:{...current.identity,operation_id:randomUUID(),attempt_id:randomUUID()},prompt:'ROLLBACK_INPUT_CHECK'});assert.ok(inputs[2].includes('OLD_FAILED_DIALOGUE_SENTINEL'));assert.equal(inputs[2].includes('CURRENT_EFFECTIVE_INPUT_SENTINEL'),false);assert.equal(ledger.read(identity.task_id).length,3);
});


test('V13-NATIVE-BRANCH111 negative: fork/navigation cannot select a new branch while the sameTask has a physical model request in flight',async()=>{
 for(const command of [{kind:'fork' as const},{kind:'navigate' as const,entryId:null,summarize:false}]){
  const root=mkdtempSync(join(browserEvidenceRoot,'native-branch111-busy-')),ledger=createLocalAnalysisRequestLedger({projectRoot:root});let release!:()=>void,entered!:()=>void;const held=new Promise<void>(r=>release=r),started=new Promise<void>(r=>entered=r);
  const runtime=createPiSessionOpenAnalysisRuntime({projectRoot:root,ledger,credentials:createApprovedProviderCredentials({environment:{}}),modelTransport:async()=>{entered();await held;return {content:[{kind:'text',text:'物理请求已返回'}],stop:'complete',usage:{inputTokens:5,outputTokens:3}};}});
  const identity={task_id:randomUUID(),revision:'1',run_id:randomUUID(),attempt_id:randomUUID(),operation_id:randomUUID(),grant_id:randomUUID(),scope_sha256:'a'.repeat(64),config_sha256:'b'.repeat(64)},signal=new AbortController().signal;const active=runtime.run({identity,nativeBusinessTools:true,prompt:'原分支待返回',system:'保留实际效果',tools:[],signal,authorize:()=>true});await started;const state=createPersistentRuntimeState({projectRoot:root}),original=state.readSelectedSession(identity.task_id,'analysis_native');
  try{await assert.rejects(runtime.sessionControl!({identity,purpose:'analysis',command,signal,authorize:()=>true}),(e:any)=>(e.reason??e.code)==='TASK_BUSY');assert.equal(state.readSelectedSession(identity.task_id,'analysis_native'),original);}finally{release();await active;}assert.equal(ledger.pending().length,0);
 }
});


for(const scopeChanged of [false,true])test(`V13-RECOVERY112 (${scopeChanged?'historical-scope-mismatch':'closed-prior-revision'}): exact non-dispatch settlement preserves prior unknown charges without treating historical revision as current authority`,async()=>{
 const {RuntimeFault}=await import('pi-agent-runtime');
 const root=mkdtempSync(join(browserEvidenceRoot,'native-historical-reserve-')),ledger=createLocalAnalysisRequestLedger({projectRoot:root});let calls=0;
 const make=()=>createPiSessionOpenAnalysisRuntime({nativeObjectArguments:true,projectRoot:root,ledger,credentials:createApprovedProviderCredentials({environment:{}}),modelTransport:async()=>{calls++;if(calls===1)throw new RuntimeFault('MODEL_FAILED');throw Object.assign(Error('EXTERNAL_ADMISSION_DENIED'),{code:'EXTERNAL_ADMISSION_DENIED'});}});
 const one={task_id:randomUUID(),revision:'1',run_id:randomUUID(),attempt_id:randomUUID(),operation_id:randomUUID(),grant_id:randomUUID(),scope_sha256:'a'.repeat(64),config_sha256:'b'.repeat(64)},signal=new AbortController().signal;
 const run=(runtime:any,identity:any)=>runtime.run({identity,signal,authorize:()=>true,prompt:'Offline synthetic recovery fixture; no Provider',system:'Preserve unknown history',tools:[]});
 await assert.rejects(()=>run(make(),one));const old=ledger.read(one.task_id)[0]!;ledger.settle(old.request_id,{status:'failed',reason:'REQUEST_FAILED',usage:old.usage});
 const state=createPersistentRuntimeState({projectRoot:root}),before=state.readAccounting(one.task_id)!;assert.equal(before.usage.reservedOutputTokens,4096);
 const two={...one,revision:'2',run_id:randomUUID(),attempt_id:randomUUID(),operation_id:randomUUID(),...(scopeChanged?{scope_sha256:'c'.repeat(64)}:{})};const control={identity:two,signal,authorize:()=>true};
 await assert.rejects(()=>run(make(),two));assert.equal(await make().reconcileStopped!(control),false,'current UNKNOWN is blocking');
 const current=ledger.read(one.task_id).at(-1)!;ledger.settle(current.request_id,{status:'failed',reason:'REQUEST_FAILED',usage:{...current.usage,input_tokens:{kind:'known',value:'0'},output_tokens:{kind:'known',value:'0'}}});
 assert.equal(await make().reconcileStopped!(control),false,'unsettled current native reserve is blocking');
 const accounting=state.readAccounting(one.task_id)!;assert.ok('cumulative' in accounting.limits);if(!('cumulative' in accounting.limits))throw Error('Expected uncapped');const reservation=accounting.reservations.find(r=>!before.reservations.some(old=>old.owner===r.owner))!;
 const lease=await state.budgets.claimUncapped(one.task_id,reservation.owner,accounting.configuration,accounting.limits);await lease.settleModelUsage(reservation.tokens,{inputTokens:0,outputTokens:0});await lease.release(0);
 const settled=state.readAccounting(one.task_id)!;assert.deepEqual(settled.reservations,before.reservations);assert.equal(settled.usage.modelCalls,2);assert.equal(settled.usage.reservedOutputTokens,4096);
 assert.equal(await make().reconcileStopped!({...control,authorize:()=>false}),false);assert.equal(await make().reconcileStopped!({...control,identity:{...two,grant_id:randomUUID()}}),false);
 assert.equal(await make().reconcileStopped!(control),!scopeChanged);assert.deepEqual(state.readAccounting(one.task_id),settled,'reconciliation does not refund historical usage or dispatch');assert.equal(calls,2);assert.deepEqual(ledger.read(one.task_id)[0]!.usage,old.usage);assert.equal(ledger.read(one.task_id)[0]!.calls,1);
});


for(const invalid of [false,true])test(`V13-DELEGATION113 (${invalid?'invalid-wrapper':'projected-contract'}): production modelParameters and native dispatch share one explicit flat contract`,async()=>{
 const {delegationToolSchema}=await import('../../../packages/application/open-analysis-delegation.ts');
 const root=mkdtempSync(join(browserEvidenceRoot,'native-delegation-projection-')),ledger=createLocalAnalysisRequestLedger({projectRoot:root});let calls=0,effects=0;
 const identity={task_id:randomUUID(),revision:'1',run_id:randomUUID(),attempt_id:randomUUID(),operation_id:randomUUID(),grant_id:randomUUID(),scope_sha256:'a'.repeat(64),config_sha256:'b'.repeat(64)};
 const original=structuredClone(delegationToolSchema),projection=structuredClone(delegationToolSchema);
 const exact={kind:'subagent',task:'核对本轮已选摘要',action:'compare',material_ids:['material:1'],reference_paths:['/calculation'],completion_reference_paths:['/calculation']};
 const runtime=createPiSessionOpenAnalysisRuntime({projectRoot:root,ledger,credentials:createApprovedProviderCredentials({environment:{}}),nativeObjectArguments:true,modelTransport:async request=>{
  calls++;const declared=request.messages.flatMap(m=>m.tools??[]).find(t=>t.name==='delegate_analysis')!;
  assert.equal(declared.parameters.properties.instruction,undefined,'Provider must see the same flat contract validated by native dispatch');assert.equal(declared.parameters.properties.reference_paths.type,'array');assert.ok(declared.parameters.required.includes('action'));
  if(calls===1)return {content:[{kind:'tool',id:'read-current',name:'read_tool_contract',arguments:{name:'delegate_analysis'}}],stop:'tools',usage:{inputTokens:4,outputTokens:2}};
  if(calls===2){const feedback=JSON.parse(request.messages.filter(m=>m.role==='tool').at(-1)!.text);assert.deepEqual(feedback.parameters,declared.parameters);return {content:[{kind:'tool',id:'delegate-current',name:'delegate_analysis',arguments:invalid?{...exact,reference_paths:{item:exact.reference_paths}}:exact}],stop:'tools',usage:{inputTokens:4,outputTokens:2}};}
  if(invalid)return {content:[{kind:'tool',id:'delegate-invalid-again',name:'delegate_analysis',arguments:{...exact,reference_paths:{item:exact.reference_paths}}}],stop:'tools',usage:{inputTokens:4,outputTokens:2}};
  assert.match(request.messages.filter(m=>m.role==='tool').at(-1)!.text,/queued/);return {content:[{kind:'text',text:'已观察真实委派结果'}],stop:'complete',usage:{inputTokens:4,outputTokens:2}};
 }});
 const input={identity,nativeBusinessTools:true,recoverInvalidArguments:true,prompt:'只委派本轮选定材料',system:'按当前合同执行',signal:new AbortController().signal,authorize:()=>true,tools:[{name:'delegate_analysis',description:'委派',parameters:original,modelParameters:projection,execute:async args=>{effects++;assert.deepEqual(args,{kind:'subagent',task:exact.task,material_ids:exact.material_ids,instruction:{action:exact.action,reference_paths:exact.reference_paths,completion_reference_paths:exact.completion_reference_paths}});return {state:'queued',child_id:randomUUID()};}},{name:'read_tool_contract',description:'读取合同',parameters:{type:'object',properties:{name:{type:'string'}},required:['name'],additionalProperties:false},execute:async()=>({name:'delegate_analysis',parameters:projection,executed:false})}]};
 if(invalid){await assert.rejects(()=>runtime.run(input));assert.equal(effects,0);}else{await runtime.run(input);assert.equal(effects,1);assert.equal(calls,3);}
 assert.deepEqual(original,delegationToolSchema);assert.deepEqual(projection,delegationToolSchema);assert.equal(ledger.pending().length,0);
});


for(const boundary of ['known','prior-known-failure','prior-unknown-failure','prior-nonzero-failure','unmatched-receipt','unknown-receipt','missing-completion','active-owner','stale-identity','revoked','historical-migration','historical-migration-unknown','historical-migration-missing','historical-migration-revoked','historical-migration-current'] as const)test(`V13-ABORT117 (${boundary}): explicit idle abort reconciles only known effects without native replay`,async()=>{
 const root=mkdtempSync(join(browserEvidenceRoot,'native-known-abort-')),ledger=createLocalAnalysisRequestLedger({projectRoot:root});let calls=0,effects=0;
 const identity={task_id:randomUUID(),revision:'1',run_id:randomUUID(),attempt_id:randomUUID(),operation_id:randomUUID(),grant_id:randomUUID(),scope_sha256:'a'.repeat(64),config_sha256:'b'.repeat(64)};
 const priorFailure=boundary.startsWith('prior-');let priorRequestId:string|undefined;
 const make=(actualLedger=ledger)=>createPiSessionOpenAnalysisRuntime({projectRoot:root,ledger:actualLedger,credentials:createApprovedProviderCredentials({environment:{}}),nativeObjectArguments:true,modelTransport:async request=>{calls++;if(request.messages.some(m=>m.text.includes('HISTORICAL_ROOT_BOOTSTRAP'))){calls--;return {content:[{kind:'text' as const,text:'原任务'}],stop:'complete' as const,usage:{inputTokens:4,outputTokens:2}};}if(request.model.id==='mimo-v2.6-flash')return {content:[{kind:'text' as const,text:'旧版报告'}],stop:'complete' as const,usage:{inputTokens:4,outputTokens:2}};return calls%2===1?{content:[{kind:'tool' as const,id:'known-effect',name:'execute_step',arguments:{}}],stop:'tools' as const,usage:{inputTokens:4,outputTokens:2}}:{content:[{kind:'text' as const,text:'实际结果7'}],stop:'complete' as const,usage:{inputTokens:4,outputTokens:2}};}});
 const historical=boundary.startsWith('historical-migration'),child=historical?randomUUID():undefined;const runtime=make(),base={identity,conversation_id:child,nativeBusinessTools:true,prompt:'完成本地计算',system:'使用真实结果',signal:new AbortController().signal,authorize:()=>true,tools:[{name:'execute_step',description:'本地核算',parameters:{type:'object',properties:{},additionalProperties:false},execute:async()=>{effects++;return {value:7};}}]};
 if(historical)await runtime.run({...base,conversation_id:undefined,prompt:'HISTORICAL_ROOT_BOOTSTRAP',tools:[]});
 await runtime.run(base);assert.equal(calls,2);assert.equal(effects,1);
 if(priorFailure){const row=ledger.reserve({...identity,operation_id:randomUUID(),input_sha256:'c'.repeat(64),provider:'minimax-cn',model:'MiniMax-M3'});priorRequestId=row.request_id;ledger.issue(row.request_id);ledger.settle(row.request_id,{status:'failed',reason:'REQUEST_FAILED',usage:{input_tokens:{kind:'known',value:'0'},output_tokens:{kind:'known',value:'0'},active_ms:{kind:'known',value:'0'},wait_ms:{kind:'known',value:'0'}}});await runtime.run(base);assert.equal(calls,4);assert.equal(effects,2);}

 if(boundary==='unmatched-receipt'){const row=ledger.reserve({...identity,operation_id:randomUUID(),input_sha256:'d'.repeat(64),provider:'minimax-cn',model:'MiniMax-M3'});ledger.issue(row.request_id);ledger.settle(row.request_id,{status:'succeeded',reason:'REQUEST_SUCCEEDED',usage:{input_tokens:{kind:'known',value:'4'},output_tokens:{kind:'known',value:'2'},active_ms:{kind:'known',value:'0'},wait_ms:{kind:'known',value:'0'}}});}
 const migrationIdentity=historical?{...identity,revision:boundary==='historical-migration-current'?'1':'2',run_id:randomUUID(),attempt_id:randomUUID(),operation_id:randomUUID()}:identity;
 if(historical)await runtime.run({...base,identity:migrationIdentity,conversation_id:undefined,purpose:'report_edit',tools:[],prompt:'当前版报告'});
 const state=createPersistentRuntimeState({projectRoot:root}),sid=state.readSelectedSession(identity.task_id,'analysis_objects'+(child?':'+child:''))!,directory=join(root,'.xanthil','desktop','pi-sessions');
 const name=readdirSync(directory,{recursive:true}).find(n=>typeof n==='string'&&n.includes(sid)&&n.endsWith('.jsonl'))!;const path=join(directory,String(name)),lines=readFileSync(path,'utf8').trimEnd().split('\n');
 const cut=lines.findLastIndex(line=>{const frame=JSON.parse(line);return Array.isArray(frame)&&frame.some(x=>x.kind==='value'&&x.namespace==='pi.op.state'&&x.value?.batch?.calls?.some(c=>c.status==='outcome_ready'));});assert.ok(cut>=0,'fixture uses an actual installed-native persisted outcome_ready transaction');
 // Simulate the disk checkpoint left when control IO stops after a known durable tool result.
 // Only this generated fixture is truncated; product session history is never edited.
 writeFileSync(path,lines.slice(0,cut+1).join('\n')+'\n');const original=readFileSync(path,'utf8'),accounting=state.readAccounting(identity.task_id)!;
 if(boundary==='missing-completion'||boundary==='historical-migration-missing'){const db=new DatabaseSync(join(root,'.xanthil','desktop','pi-runtime.sqlite'));try{db.prepare("DELETE FROM audit WHERE body LIKE '%\"kind\":\"tool.finished\"%'").run();}finally{db.close();}}
 const held=boundary==='active-owner'?await state.budgets.claimUncapped(identity.task_id,randomUUID(),accounting.configuration,accounting.limits):undefined;
 const actualLedger=['unknown-receipt','prior-unknown-failure','prior-nonzero-failure'].includes(boundary)?{...ledger,read:(id:string)=>ledger.read(id).map(x=>boundary==='prior-nonzero-failure'&&x.request_id===priorRequestId?{...x,usage:{...x.usage,input_tokens:{kind:'known' as const,value:'1'}}}:boundary==='unknown-receipt'||x.request_id===priorRequestId?{...x,status:'unknown' as const}:x)}:ledger;
 const reopened=make(actualLedger),control={identity:boundary==='stale-identity'?{...identity,grant_id:randomUUID()}:identity,purpose:'analysis' as const,signal:base.signal,authorize:()=>boundary!=='revoked'};
 if(boundary==='known'||boundary==='prior-known-failure'){
  const before=await reopened.sessionControl!({...control,command:{kind:'snapshot'}});assert.ok(before.view?.operationId);
  await reopened.sessionControl!({...control,command:{kind:'abort'}});
  const after=await reopened.sessionControl!({...control,command:{kind:'snapshot'}});assert.equal(after.view?.operationId,null);assert.equal(after.view?.faulted,false);
  assert.ok(readFileSync(path,'utf8').startsWith(original),'existing JSONL is append-only');assert.ok(state.readAudit(identity.task_id).some(e=>e.kind==='run.finished'&&e.reason==='CANCELLED'));
 }else if(historical){
  const crypto=await import('node:crypto'),hash=(value:unknown)=>crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
  const adjusted=createPiSessionOpenAnalysisRuntime({projectRoot:root,ledger:boundary==='historical-migration-unknown'?{...ledger,read:id=>ledger.read(id).map(row=>row.revision==='1'?{...row,status:'unknown' as const}:row)}:ledger,credentials:createApprovedProviderCredentials({environment:{}}),nativeObjectArguments:true,reportThinking:'off',modelTransport:async()=>{throw Error('migration must not request a model');}});
  // The historical pending operation is older than the approved migration owner.
  // Preserve its exact original receipt identity; only its known effects can stop.
  const oldRows=ledger.read(identity.task_id),migration=()=>adjusted.migrateReportThinking({identity:migrationIdentity,signal:base.signal,authorize:()=>boundary!=='historical-migration-revoked',approval:'c'.repeat(64),expectedAccounting:hash(accounting),expectedLedger:hash(oldRows)});
  if(boundary==='historical-migration'){const receipt=await migration();assert.notEqual(receipt.from,receipt.to);assert.ok(readFileSync(path,'utf8').startsWith(original));assert.ok(state.readAudit(identity.task_id).some(e=>e.kind==='run.finished'&&e.reason==='CANCELLED'));}else {await assert.rejects(migration);assert.equal(readFileSync(path,'utf8'),original);}
  assert.deepEqual(ledger.read(identity.task_id),oldRows);
 }else{await assert.rejects(reopened.sessionControl!({...control,command:{kind:'abort'}}));assert.equal(readFileSync(path,'utf8'),original);}
 assert.equal(calls,historical?3:priorFailure?4:2,'abort dispatches no model');assert.equal(effects,priorFailure?2:1,'abort does not replay a completed tool');const after=state.readAccounting(identity.task_id)!;for(const key of ['modelCalls','toolCalls','outputTokens','inputTokens','resourceUnits','reservedOutputTokens'] as const)assert.equal(after.usage[key],accounting.usage[key]);assert.deepEqual(after.reservations,accounting.reservations);if(boundary==='historical-migration')assert.notEqual(after.configuration,accounting.configuration);else assert.equal(after.configuration,accounting.configuration);assert.equal(ledger.read(identity.task_id).length,historical?4:priorFailure?5:boundary==='unmatched-receipt'?3:2);if(priorFailure){const prior=ledger.read(identity.task_id).find(x=>x.request_id===priorRequestId)!;assert.equal(prior.status,'failed','settled original history is not rewritten');}if(held){assert.notEqual(after.owner,null);await held.release(0);}
 if(boundary==='known'){
  const crypto=await import('node:crypto'),hash=(value:unknown)=>crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
  const adjusted=createPiSessionOpenAnalysisRuntime({projectRoot:root,ledger,credentials:createApprovedProviderCredentials({environment:{}}),nativeObjectArguments:true,reportThinking:'off',modelTransport:async()=>{throw Error('migration must not request a model');}});
  const oldRows=ledger.read(identity.task_id),receipt=await adjusted.migrateReportThinking({identity,signal:base.signal,authorize:()=>true,approval:'c'.repeat(64),expectedAccounting:hash(after),expectedLedger:hash(oldRows)});
  assert.notEqual(receipt.from,receipt.to);assert.deepEqual(state.readAccounting(identity.task_id)!.usage,after.usage);assert.deepEqual(ledger.read(identity.task_id),oldRows);assert.equal(calls,2);assert.equal(effects,1);
 }
});


test('V13-REPORT-CONTEXT121: production report branch isolates stale facts after reopen without clearing history or root context',async()=>{
 const root=mkdtempSync(join(browserEvidenceRoot,'native-report-context-')),ledger=createLocalAnalysisRequestLedger({projectRoot:root});let calls=0;const requests:any[]=[];
 const make=()=>createPiSessionOpenAnalysisRuntime({projectRoot:root,ledger,credentials:createApprovedProviderCredentials({environment:{}}),nativeObjectArguments:true,modelTransport:async request=>{calls++;requests.push(request);return {content:[{kind:'text',text:'模型意见'+calls}],stop:'complete',usage:{inputTokens:3,outputTokens:2}};}});
 const identity={task_id:randomUUID(),revision:'1',run_id:randomUUID(),attempt_id:randomUUID(),operation_id:randomUUID(),grant_id:randomUUID(),scope_sha256:'a'.repeat(64),config_sha256:'b'.repeat(64)},signal=new AbortController().signal;
 const base={identity,prompt:'根分析原目标',system:'使用当前事实',signal,authorize:()=>true,tools:[]};const runtime=make();await runtime.run(base);
 const old='JuanerAI.report-edit.v1\n'+JSON.stringify({numeric_facts:[{reference_id:'F1',scope:'北区',value:'100'}]}),current='JuanerAI.report-edit.v1\n'+JSON.stringify({numeric_facts:[{reference_id:'F1',scope:'南区',value:'200'}]});
 await runtime.run({...base,purpose:'report_edit',prompt:old});const before=ledger.read(identity.task_id);
 const reopened=make();await reopened.run({...base,purpose:'report_edit',prompt:current,identity:{...identity,revision:'2',run_id:randomUUID(),attempt_id:randomUUID(),operation_id:randomUUID()}});
 assert.deepEqual(requests[2].messages.filter((m:any)=>m.role!=='system').map((m:any)=>({role:m.role,text:m.text})),[{role:'user',text:current}],'report model must see only current fact identities, not earlier report or native summary');
 const directory=join(root,'.xanthil','desktop','pi-sessions'),files=readdirSync(directory,{recursive:true}).filter((f):f is string=>typeof f==='string'&&f.endsWith('.jsonl'));const history=files.map(f=>readFileSync(join(directory,f),'utf8')).join('\n');assert.ok(history.includes('北区'));assert.ok(history.includes('南区'));assert.ok(history.includes('模型意见2'),'old report response remains native history');
 assert.deepEqual(ledger.read(identity.task_id).slice(0,before.length),before);await reopened.run({...base,prompt:'根分析继续'});assert.ok(requests[3].messages.some((m:any)=>m.text.includes('根分析原目标')),'root continuous analysis context must not be filtered');
 assert.equal(calls,4);assert.equal(ledger.read(identity.task_id).length,4);assert.equal(ledger.pending().length,0);await assert.rejects(()=>reopened.run({...base,purpose:'report_edit',prompt:current,authorize:()=>false}),{code:'AUTHORITY_REQUIRED'});assert.equal(calls,4);
});


for(const scenario of ['six-four','twelve-seven','repeat'] as const)test(`V13-DELEGATION124 (${scenario}): conditional feedback states actual counts without unrelated branch bounds or private values`,async()=>{
 const {delegationToolSchema}=await import('../../../packages/application/open-analysis-delegation.ts');
 const root=mkdtempSync(join(browserEvidenceRoot,'native-conditional-feedback-')),ledger=createLocalAnalysisRequestLedger({projectRoot:root});let calls=0,effects=0,feedback:any;
 const count=scenario==='twelve-seven'?12:6,pathCount=scenario==='twelve-seven'?7:4;
 const requested={kind:'subagent',task:'PRIVATE_INPUT_SENTINEL',action:'explain',material_ids:Array.from({length:count},(_,i)=>'material:'+(i+1)),reference_paths:Array.from({length:pathCount},(_,i)=>'/PRIVATE_PATH_'+i),completion_reference_paths:['/PRIVATE_PATH_0']};
 const valid={...requested,material_ids:['material:1','material:2'],reference_paths:['/calculation','/framework'],completion_reference_paths:['/calculation']};
 const identity={task_id:randomUUID(),revision:'1',run_id:randomUUID(),attempt_id:randomUUID(),operation_id:randomUUID(),grant_id:randomUUID(),scope_sha256:'a'.repeat(64),config_sha256:'b'.repeat(64)};
 const runtime=createPiSessionOpenAnalysisRuntime({projectRoot:root,ledger,credentials:createApprovedProviderCredentials({environment:{}}),nativeObjectArguments:true,modelTransport:async request=>{
  calls++;if(calls===1)return {content:[{kind:'tool',id:'invalid-selection',name:'delegate_analysis',arguments:requested}],stop:'tools',usage:{inputTokens:4,outputTokens:2}};
  if(calls===2){
   feedback=JSON.parse(request.messages.filter(m=>m.role==='tool').at(-1)!.text);assert.equal(effects,0);
   return {content:[{kind:'tool',id:'explicit-correction',name:'delegate_analysis',arguments:scenario==='repeat'?requested:valid}],stop:'tools',usage:{inputTokens:4,outputTokens:2}};
  }
  assert.equal(effects,1);return {content:[{kind:'text',text:'实际选择回执已返回'}],stop:'complete',usage:{inputTokens:4,outputTokens:2}};
 }});
 const run=()=>runtime.run({identity,nativeBusinessTools:true,recoverInvalidArguments:true,prompt:'只读取授权材料',system:'保持既有边界',signal:new AbortController().signal,authorize:()=>true,tools:[{name:'delegate_analysis',description:'精确共同路径',parameters:structuredClone(delegationToolSchema),execute:async args=>{effects++;assert.deepEqual(args,{kind:valid.kind,task:valid.task,material_ids:valid.material_ids,instruction:{action:valid.action,reference_paths:valid.reference_paths,completion_reference_paths:valid.completion_reference_paths}});return {state:'queued',child_id:randomUUID()};}}]});
 if(scenario==='repeat'){await assert.rejects(run(),(error:any)=>error.code==='TOOL_FAILED');assert.equal(effects,0);assert.equal(calls,2);}else{await run();assert.equal(effects,1);assert.equal(calls,3);}
   assert.equal(effects,scenario==='repeat'?0:1);assert.equal(feedback.executed,false);assert.equal(feedback.remaining_corrections,1);
   assert.equal(JSON.stringify(feedback).includes('PRIVATE_'),false);
   assert.deepEqual(feedback.conditional_array_limits,{selector:'material_ids',actual_count:count,maximum_items:8,allowed_counts:[{count:1,maximum_items:{reference_paths:12,completion_reference_paths:12}},{count:2,maximum_items:{reference_paths:6,completion_reference_paths:6}},{count:3,maximum_items:{reference_paths:4,completion_reference_paths:4}},{count:4,maximum_items:{reference_paths:3,completion_reference_paths:3}},{count:5,maximum_items:{reference_paths:2,completion_reference_paths:2}},{count:6,maximum_items:{reference_paths:2,completion_reference_paths:2}},{count:7,maximum_items:{reference_paths:1,completion_reference_paths:1}},{count:8,maximum_items:{reference_paths:1,completion_reference_paths:1}}],actual_totals:{reference_paths:{items_per_selection:pathCount,selected_references:count*pathCount,maximum:12},completion_reference_paths:{items_per_selection:1,selected_references:count,maximum:12}}});
   if(count===6){assert.ok(feedback.issues.some((issue:any)=>issue.path==='/reference_paths'&&issue.expected_schema.maxItems===2));assert.equal(feedback.issues.some((issue:any)=>issue.path==='/material_ids'),false);assert.ok(feedback.issues.every((issue:any)=>!issue.schema_path.includes('/anyOf/')||issue.schema_path.startsWith('#/anyOf/5/')));}
   else {assert.ok(feedback.issues.some((issue:any)=>issue.path==='/material_ids'&&issue.expected_schema.maxItems===8));assert.equal(feedback.issues.some((issue:any)=>issue.schema_path.includes('/anyOf/')),false);}
 assert.equal(ledger.pending().length,0);assert.equal(ledger.read(identity.task_id).length,calls);
});

test('V13-VIEW128 / RT04: installed native session consumes explicit views, rejects mixed paths before effect and returns the exact choice',async()=>{
 const {delegationToolSchema}=await import('../../../packages/application/open-analysis-delegation.ts');
 const {Check}=await import('typebox/value');
 const root=mkdtempSync(join(browserEvidenceRoot,'native-view128-')),ledger=createLocalAnalysisRequestLedger({projectRoot:root});let calls=0,effects=0;
 const view_ref='view:'+'c'.repeat(64),exact={kind:'subagent',task:'核对材料内反例',action:'challenge',view_refs:[view_ref]};
 const {nativeDelegationWire}=await import('../../../adapters/agent-pi/native-delegation-wire.ts');const wire=nativeDelegationWire({name:'delegate_analysis',description:'actual contract',parameters:delegationToolSchema,execute:async()=>({})});assert.equal(Check(wire.parameters as any,exact),true,'causal missing native view route before any model or tool effect');
 const runtime=createPiSessionOpenAnalysisRuntime({projectRoot:root,ledger,credentials:createApprovedProviderCredentials({environment:{}}),nativeObjectArguments:true,modelTransport:async request=>{
  calls++;const declared=request.messages.flatMap(m=>m.tools??[]).find(t=>t.name==='delegate_analysis')!;
  assert.equal(Check(declared.parameters as any,exact),true,'explicit material views must enter the installed native contract');
  assert.equal(Check(declared.parameters as any,{...exact,material_ids:['material:1'],reference_paths:['/calculation'],completion_reference_paths:['/calculation']}),false,'mixed routes cannot reach an effect');
  if(calls===1)return {content:[{kind:'tool',id:'chosen-view',name:'delegate_analysis',arguments:exact}],stop:'tools',usage:{inputTokens:4,outputTokens:2}};
  assert.match(request.messages.filter(m=>m.role==='tool').at(-1)!.text,/queued/);return {content:[{kind:'text',text:'已读取实际视图委派回执'}],stop:'complete',usage:{inputTokens:4,outputTokens:2}};
 }});
 const identity={task_id:randomUUID(),revision:'1',run_id:randomUUID(),attempt_id:randomUUID(),operation_id:randomUUID(),grant_id:randomUUID(),scope_sha256:'a'.repeat(64),config_sha256:'b'.repeat(64)};
 await runtime.run({identity,nativeBusinessTools:true,recoverInvalidArguments:true,prompt:'按当前目录选择',system:'保持实际选择',signal:new AbortController().signal,authorize:()=>true,tools:[{name:'delegate_analysis',description:'选实际材料视图',parameters:delegationToolSchema,modelParameters:delegationToolSchema,execute:async args=>{effects++;assert.deepEqual(args,exact);return {state:'queued',selected_views:args.view_refs};}}]});
 assert.equal(effects,1);assert.equal(calls,2);assert.equal(ledger.pending().length,0);assert.equal(ledger.read(identity.task_id).length,2);
});

test('V13-VIEW128 / RT04: actual native catalog guidance exposes the adopted view route to the next model turn',async()=>{
 const {delegationToolSchema,delegationViewModelSchema}=await import('../../../packages/application/open-analysis-delegation.ts');const root=mkdtempSync(join(browserEvidenceRoot,'native-view-guidance128-')),ledger=createLocalAnalysisRequestLedger({projectRoot:root});let calls=0,observed:any;
 const catalog=[{material_id:'material:1',views:[{view_ref:'view:'+'c'.repeat(64),reference_paths:['/calculation'],value_kind:'object',fields:['value']}],instruction_contract:{actions:['challenge'],reference_paths:['/calculation']}}];
 const runtime=createPiSessionOpenAnalysisRuntime({projectRoot:root,ledger,credentials:createApprovedProviderCredentials({environment:{}}),nativeObjectArguments:true,modelTransport:async request=>{
 if(++calls===1)return {content:[{kind:'tool',id:'view-catalog',name:'read_delegation_materials',arguments:{}}],stop:'tools',usage:{inputTokens:4,outputTokens:2}};
 observed=JSON.parse(request.messages.filter(m=>m.role==='tool').at(-1)!.text);return {content:[{kind:'text',text:'已观察目录'}],stop:'complete',usage:{inputTokens:4,outputTokens:2}};
 }});
 const identity={task_id:randomUUID(),revision:'1',run_id:randomUUID(),attempt_id:randomUUID(),operation_id:randomUUID(),grant_id:randomUUID(),scope_sha256:'a'.repeat(64),config_sha256:'b'.repeat(64)};
 await runtime.run({identity,nativeBusinessTools:true,recoverInvalidArguments:true,prompt:'读取当前目录',system:'只观察当前材料',signal:new AbortController().signal,authorize:()=>true,tools:[{name:'read_delegation_materials',description:'实际目录',parameters:{type:'object',properties:{},additionalProperties:false},execute:async()=>catalog},{name:'delegate_analysis',description:'实际合同',parameters:delegationToolSchema,modelParameters:delegationViewModelSchema,execute:async()=>assert.fail('no delegation was selected')} ]});
 assert.match(observed[0].instruction_contract.index_selection,/view_refs/,'model must see the adopted explicit view route, not only old path construction');assert.doesNotMatch(observed[0].instruction_contract.index_selection,/material_ids|reference_paths/,'focused catalog must not teach a parallel path-building route');assert.equal(observed[0].instruction_contract.reference_paths,undefined);assert.deepEqual(observed[0].views,catalog[0]!.views);assert.equal(ledger.pending().length,0);
});

test('V13-VIEW129 / RT04/06: real no-view legacy catalog retains declared old producer and original execution without inventing authority',async()=>{
 const {delegationToolSchema,delegationViewModelSchema}=await import('../../../packages/application/open-analysis-delegation.ts');const {Check}=await import('typebox/value');
 const root=mkdtempSync(join(browserEvidenceRoot,'native-legacy-view129-')),ledger=createLocalAnalysisRequestLedger({projectRoot:root});let calls=0,effects=0,observed:any;
 const selected={kind:'subagent',task:'Check selected summary',action:'challenge',material_ids:['material:1'],reference_paths:['/calculation'],completion_reference_paths:['/calculation']};
 const runtime=createPiSessionOpenAnalysisRuntime({projectRoot:root,ledger,credentials:createApprovedProviderCredentials({environment:{}}),nativeObjectArguments:true,modelTransport:async request=>{
 calls++;const declaration=request.messages.flatMap(m=>m.tools??[]).find(t=>t.name==='delegate_analysis')!;
 if(calls===1){assert.equal(Object.hasOwn(declaration.parameters.properties??{},'material_ids'),false);return {content:[{kind:'tool',id:'legacy-catalog',name:'read_delegation_materials',arguments:{}}],stop:'tools',usage:{inputTokens:4,outputTokens:2}};}
 if(calls===2){observed=JSON.parse(request.messages.filter(m=>m.role==='tool').at(-1)!.text);assert.equal(Check(declaration.parameters as any,selected),true,'actual legacy material still has its old native consumer');assert.match(observed[0].instruction_contract.index_selection,/material_ids/);assert.equal(observed[0].views,undefined,'no guessed views');return {content:[{kind:'tool',id:'explicit-legacy-selection',name:'delegate_analysis',arguments:selected}],stop:'tools',usage:{inputTokens:4,outputTokens:2}};}
 assert.match(request.messages.filter(m=>m.role==='tool').at(-1)!.text,/queued/);return {content:[{kind:'text',text:'Old selection receipt consumed'}],stop:'complete',usage:{inputTokens:4,outputTokens:2}};
 }});
 const identity={task_id:randomUUID(),revision:'1',run_id:randomUUID(),attempt_id:randomUUID(),operation_id:randomUUID(),grant_id:randomUUID(),scope_sha256:'a'.repeat(64),config_sha256:'b'.repeat(64)};
 await runtime.run({identity,nativeBusinessTools:true,recoverInvalidArguments:true,prompt:'Read actual selected material',system:'No new authority',signal:new AbortController().signal,authorize:()=>true,tools:[{name:'read_delegation_materials',description:'Actual legacy catalog',parameters:{type:'object',properties:{},additionalProperties:false},execute:async()=>[{material_id:'material:1',instruction_contract:{actions:['challenge'],reference_paths:['/calculation']}}]},{name:'delegate_analysis',description:'Original delegate',parameters:delegationToolSchema,modelParameters:delegationViewModelSchema,execute:async args=>{effects++;assert.deepEqual(args,{kind:selected.kind,task:selected.task,material_ids:selected.material_ids,instruction:{action:selected.action,reference_paths:selected.reference_paths,completion_reference_paths:selected.completion_reference_paths}});return {state:'queued'};}}]});
 assert.equal(effects,1);assert.equal(calls,3);assert.equal(ledger.pending().length,0);
});


test('V13-RECOVERY130: closed readonly report deadline plus nonissued extra request can reconcile while preserving physical UNKNOWN reserve',async t=>{
 const {RuntimeFault}=await import('pi-agent-runtime');const originalTimeout=globalThis.setTimeout;t.mock.method(globalThis,'setTimeout',((fn:any,ms:any,...args:any[])=>originalTimeout(fn,ms===30000?5:ms,...args)) as typeof setTimeout);
 const root=mkdtempSync(join(browserEvidenceRoot,'report-recovery130-')),ledger=createLocalAnalysisRequestLedger({projectRoot:root});let calls=0;
 const make=()=>createPiSessionOpenAnalysisRuntime({nativeObjectArguments:true,projectRoot:root,ledger,credentials:createApprovedProviderCredentials({environment:{}}),modelTransport:async request=>{calls++;if(calls===1)return {content:[{kind:'text',text:'Synthetic analyzed result'}],stop:'complete',usage:{inputTokens:3,outputTokens:2}};if(calls===2)return await new Promise((_,reject)=>request.signal.addEventListener('abort',()=>reject(new RuntimeFault('DEADLINE_EXCEEDED')),{once:true}));throw Object.assign(Error('OWNED_ADMISSION_DENIED'),{code:'OWNED_ADMISSION_DENIED'});}});
 const identity={task_id:randomUUID(),revision:'1',run_id:randomUUID(),attempt_id:randomUUID(),operation_id:randomUUID(),grant_id:randomUUID(),scope_sha256:'a'.repeat(64),config_sha256:'b'.repeat(64)},control={identity,signal:new AbortController().signal,authorize:()=>true};
 await make().run({...control,prompt:'Offline synthetic calculations',system:'No tools',tools:[]});await assert.rejects(()=>make().run({...control,purpose:'report_edit',prompt:'Explain synthetic results',system:'No effects',tools:[]}));
 const state=createPersistentRuntimeState({projectRoot:root}),rows=ledger.read(identity.task_id),physical=rows[1]!,nonissued=rows[2]!;assert.equal(physical.status,'cancelled');assert.equal(nonissued.status,'unknown');assert.equal(await make().reconcileStopped!(control),false,'nonissued UNKNOWN still blocks');
 ledger.settle(nonissued.request_id,{status:'failed',reason:'REQUEST_FAILED',usage:{...nonissued.usage,input_tokens:{kind:'known',value:'0'},output_tokens:{kind:'known',value:'0'}}});const before=state.readAccounting(identity.task_id)!;assert.ok('cumulative' in before.limits);if(!('cumulative' in before.limits))throw Error('Expected uncapped');const end=state.readAudit(identity.task_id).findLast(e=>e.kind==='run.finished')!;
 const lease=await state.budgets.claimUncapped(identity.task_id,end.runId,before.configuration,before.limits);await lease.settleModelUsage(4096,{inputTokens:0,outputTokens:0});await lease.release(0);const retained=state.readAccounting(identity.task_id)!;assert.equal(retained.usage.reservedOutputTokens,4096);assert.equal(retained.usage.modelCalls,3);
 assert.equal(await make().reconcileStopped!({...control,authorize:()=>false}),false);assert.equal(await make().reconcileStopped!({...control,identity:{...identity,grant_id:randomUUID()}}),false);
 assert.equal(await make().reconcileStopped!(control),true,'known terminal read-only failure allows explicit recovery without refunding physical UNKNOWN');assert.equal(calls,3);assert.deepEqual(state.readAccounting(identity.task_id),retained);assert.deepEqual(ledger.read(identity.task_id)[1],physical);
 const next={...identity,revision:'2',run_id:randomUUID(),attempt_id:randomUUID(),operation_id:randomUUID()},nextControl={...control,identity:next};await assert.rejects(()=>make().run({...nextControl,prompt:'Next explicit sameTask continuation',system:'Retain old report UNKNOWN',tools:[]}));const blocked=ledger.read(identity.task_id).at(-1)!;ledger.settle(blocked.request_id,{status:'failed',reason:'REQUEST_FAILED',usage:{...blocked.usage,input_tokens:{kind:'known',value:'0'},output_tokens:{kind:'known',value:'0'}}});const pending=state.readAccounting(identity.task_id)!;if(!('cumulative' in pending.limits))throw Error('Expected uncapped');const latest=state.readAudit(identity.task_id).findLast(e=>e.kind==='run.finished')!;const zero=await state.budgets.claimUncapped(identity.task_id,latest.runId,pending.configuration,pending.limits);await zero.settleModelUsage(4096,{inputTokens:0,outputTokens:0});await zero.release(0);assert.equal(await make().reconcileStopped!(nextControl),true,'the historical closed report reserve does not become a new execution authority or an unrecoverable Task');assert.equal(state.readAccounting(identity.task_id)!.usage.reservedOutputTokens,4096);assert.deepEqual(ledger.read(identity.task_id)[1],physical);assert.equal(calls,4);
 const uncertain={...ledger,read:(id:string)=>ledger.read(id).map(x=>x.request_id===physical.request_id?{...x,status:'unknown' as const}:x)};const deny=createPiSessionOpenAnalysisRuntime({projectRoot:root,ledger:uncertain,credentials:createApprovedProviderCredentials({environment:{}}),modelTransport:async()=>assert.fail('reconcile must never dispatch')});assert.equal(await deny.reconcileStopped!(control),false);
 const extra=await state.budgets.claimUncapped(identity.task_id,randomUUID(),retained.configuration,retained.limits);await extra.reserveModelUpTo(4096);await extra.release(0);assert.equal(await make().reconcileStopped!(control),false,'unmatched reservation is never waived');
});


for(const boundary of ['known','live-pid','unrelated-writer','revoked','stale-identity','stale-accounting','stale-lock','no-proof','proof-drift','unknown-physical','pending-physical','queue-admission','audit-fault','late-audit-fault','budget-write-fault','nested-drift'] as const)test(`V13-AC133 (${boundary}): installed native abort requires exact pre-calculation proof and preserves history`,async()=>{
 const {spawnSync}=await import('node:child_process'),{createHash}=await import('node:crypto');
 const root=mkdtempSync(join(browserEvidenceRoot,'native-interrupted-stop-')),ledger=createLocalAnalysisRequestLedger({projectRoot:root});
 const identity={task_id:randomUUID(),revision:'1',run_id:randomUUID(),attempt_id:randomUUID(),operation_id:randomUUID(),grant_id:randomUUID(),scope_sha256:'a'.repeat(64),config_sha256:'b'.repeat(64)},step_id=randomUUID();
 const adapter=new URL('../../../adapters/agent-pi/native-open-analysis.ts',import.meta.url).href,credentials=new URL('../../../adapters/agent-pi/provider-credentials.ts',import.meta.url).href,ledgerModule=new URL('../../../adapters/storage-local/analysis-request-ledger.ts',import.meta.url).href;
 const child=spawnSync(process.execPath,['--input-type=module','-e',`import {createPiSessionOpenAnalysisRuntime} from ${JSON.stringify(adapter)};import {createApprovedProviderCredentials} from ${JSON.stringify(credentials)};import {createLocalAnalysisRequestLedger} from ${JSON.stringify(ledgerModule)};const root=${JSON.stringify(root)},identity=${JSON.stringify(identity)};const r=createPiSessionOpenAnalysisRuntime({projectRoot:root,nativeObjectArguments:true,ledger:createLocalAnalysisRequestLedger({projectRoot:root}),credentials:createApprovedProviderCredentials({environment:{}}),modelTransport:async()=>({content:[{kind:'tool',id:'precalc',name:'execute_step',arguments:{step_id:${JSON.stringify(step_id)}}}],stop:'tools',usage:{inputTokens:4,outputTokens:2}})});await r.run({identity,nativeBusinessTools:true,prompt:'获准合成计算',system:'先记计算准入再计算',signal:new AbortController().signal,authorize:()=>true,tools:[{name:'execute_step',description:'本地计算',parameters:{type:'object',properties:{step_id:{type:'string'}},required:['step_id'],additionalProperties:false},execute:async()=>process.exit(0)}]});`],{encoding:'utf8',timeout:10000});
 assert.equal(child.status,0,child.stderr);
 const state=createPersistentRuntimeState({projectRoot:root}),before=state.readAccounting(identity.task_id)!,rows=ledger.read(identity.task_id),hash=(v:unknown)=>createHash('sha256').update(JSON.stringify(v)).digest('hex');assert.equal(rows.length,1);assert.equal(rows[0].status,'succeeded');assert.notEqual(before.owner,null);
 const storage=state.sessionStorage(async()=>true),prefix=new Map(readdirSync(storage.directory,{recursive:true}).filter(f=>typeof f==='string'&&f.endsWith('.jsonl')).map(f=>[String(f),readFileSync(join(storage.directory,String(f)))]));assert.ok(prefix.size);
 let effects=0,calls=0;const runtime=createPiSessionOpenAnalysisRuntime({projectRoot:root,nativeObjectArguments:true,ledger,credentials:createApprovedProviderCredentials({environment:{}}),modelTransport:async()=>{calls++;throw Error('native abort must not dispatch a model');}});
 const recovery=runtime as typeof runtime & {recoverInterruptedStop(input:any):Promise<any>};assert.equal(typeof recovery.recoverInterruptedStop,'function','original dead writer prevents native Stop after pre-effect interruption');
 if(boundary==='live-pid'){const path=join(storage.directory,'.writer-lock'),old=JSON.parse(readFileSync(path,'utf8'));writeFileSync(path,JSON.stringify({...old,pid:process.pid}));}
 if(boundary==='unrelated-writer'){const path=join(storage.directory,'.writer-lock'),old=JSON.parse(readFileSync(path,'utf8'));writeFileSync(path,JSON.stringify({...old,created_at:'2000-01-01T00:00:00.000Z'}));}
 if(boundary==='queue-admission'){const audit=state.readAudit(identity.task_id),event=audit.at(-1)!;await state.audit.append({...event,sequence:event.sequence+1,kind:'session.control',toolName:undefined,invocation:undefined,digest:hash({kind:'enqueue'})},new AbortController().signal);}
 if(boundary==='audit-fault'){const db=new DatabaseSync(join(root,'.xanthil','desktop','pi-runtime.sqlite'));try{db.prepare("UPDATE audit SET digest=? WHERE run_id=?").run('0'.repeat(64),before.owner);}finally{db.close();}}
 if(boundary==='unknown-physical'||boundary==='pending-physical'){const request=ledger.reserve({...identity,operation_id:randomUUID(),provider:'minimax-cn',model:'MiniMax-M3',input_sha256:'e'.repeat(64)});ledger.issue(request.request_id);if(boundary==='unknown-physical')ledger.settle(request.request_id,{status:'unknown',reason:'REQUEST_UNCONFIRMED',usage:{input_tokens:{kind:'unknown',reason:'provider_not_reported'},output_tokens:{kind:'unknown',reason:'provider_not_reported'},active_ms:{kind:'known',value:'0'},wait_ms:{kind:'known',value:'0'}}});}
 const retained=ledger.read(identity.task_id);let proofs=0;
 const input={identity:boundary==='stale-identity'?{...identity,grant_id:randomUUID()}:identity,signal:new AbortController().signal,authorize:()=>boundary!=='revoked',approval:'c'.repeat(64),expectedAccounting:boundary==='stale-accounting'?'f'.repeat(64):hash(before),expectedLedger:hash(retained),expectedLock:boundary==='stale-lock'?'f'.repeat(64):hash(state.readWriterLock()),arguments:{step_id},provePreExecution:()=>{proofs++;if(boundary==='no-proof'||boundary==='proof-drift'&&proofs>1)return null;if(boundary==='budget-write-fault'&&proofs===2){const db=new DatabaseSync(join(root,'.xanthil','desktop','pi-runtime.sqlite'));try{db.exec("CREATE TRIGGER deny_owner_write BEFORE UPDATE ON budgets BEGIN SELECT RAISE(ABORT,'fixture budget unavailable'); END");}finally{db.close();}}if(boundary==='late-audit-fault'&&proofs===2){const db=new DatabaseSync(join(root,'.xanthil','desktop','pi-runtime.sqlite'));try{db.exec("CREATE TRIGGER deny_abort_audit BEFORE INSERT ON audit BEGIN SELECT RAISE(ABORT,'fixture audit unavailable'); END");}finally{db.close();}}if(boundary==='nested-drift'&&proofs===2)writeFileSync(join(storage.directory,'unrelated.jsonl'),'[]\n');return {task_sha256:'d'.repeat(64),step_id,identity};}};
 if(boundary!=='known'){await assert.rejects(()=>recovery.recoverInterruptedStop(input));assert.equal(calls,0);assert.equal(effects,0);if(boundary==='late-audit-fault'){const after=state.readAccounting(identity.task_id)!;assert.equal((after as any).interruptedStops[0].outcome,'pending');assert.deepEqual(after.reservations,before.reservations);assert.ok(state.readWriterLock());await assert.rejects(state.budgets.claimUncapped(identity.task_id,randomUUID(),before.configuration,before.limits as any));}else assert.deepEqual(state.readAccounting(identity.task_id),before);assert.deepEqual(ledger.read(identity.task_id),retained);for(const [f,bytes]of prefix)assert.ok(readFileSync(join(storage.directory,f)).equals(bytes));return;}
 const stopped=await recovery.recoverInterruptedStop(input);
 assert.equal(stopped.status,'aborted');assert.equal(calls,0);assert.equal(effects,0);assert.deepEqual(ledger.read(identity.task_id),rows);
 const after=state.readAccounting(identity.task_id)!;assert.equal(after.owner,null);assert.equal(state.readWriterLock(),null);assert.equal((after as any).interruptedStops[0].outcome,'stopped');for(const key of ['modelCalls','toolCalls','inputTokens','outputTokens','reservedOutputTokens','resourceUnits'] as const)assert.equal(after.usage[key],before.usage[key]);assert.deepEqual(after.reservations,before.reservations);
 assert.equal((after as any).interruptedStops[0].businessIdentity,hash(identity));
 const reopened=createPiSessionOpenAnalysisRuntime({projectRoot:root,nativeObjectArguments:true,ledger,credentials:createApprovedProviderCredentials({environment:{}}),modelTransport:async()=>{calls++;assert.fail('reading native stop must never execute');}});
 assert.equal(await reopened.reconcileStopped!({identity,signal:new AbortController().signal,authorize:()=>false}),false);
 assert.equal(await reopened.reconcileStopped!({identity:{...identity,grant_id:randomUUID()},signal:new AbortController().signal,authorize:()=>true}),false);
 assert.equal(await reopened.reconcileStopped!({identity,signal:new AbortController().signal,authorize:()=>true}),true,'an explicit later Application reconciliation must read the original pre-effect native stop');
 assert.equal(calls,0);assert.deepEqual(ledger.read(identity.task_id),rows);assert.deepEqual(state.readAccounting(identity.task_id),after);
 for(const [f,bytes]of prefix)assert.ok(readFileSync(join(storage.directory,f)).subarray(0,bytes.length).equals(bytes));assert.equal(state.readAudit(identity.task_id).some(e=>e.kind==='tool.finished'&&e.toolName==='execute_step'),false,'do not fabricate a successful interrupted tool receipt');
});

for(const boundary of ['known','stopped-receipt','no-proof','live-process','identity','ledger-drift','accounting-drift','revoked','unknown-request','admission-digest','tool-effect','audit-fault','proof-drift','queued','writer','pending-physical','operation','save-fault','late-audit-fault'] as const)test(`AC137-01 (${boundary}): an explicitly cancelled no-tool report ends only on exact physical-stop reconciliation and never refunds UNKNOWN`,async()=>{
 const {createHash}=await import('node:crypto'),hash=(v:unknown)=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
 const root=mkdtempSync(join(browserEvidenceRoot,'cancelled-report-recovery-')),ledger=createLocalAnalysisRequestLedger({projectRoot:root});let calls=0,proofReads=0;
 const identity={task_id:randomUUID(),revision:'1',run_id:randomUUID(),attempt_id:randomUUID(),operation_id:randomUUID(),grant_id:randomUUID(),scope_sha256:'a'.repeat(64),config_sha256:'b'.repeat(64)},cancelled=new AbortController();
 const make=()=>createPiSessionOpenAnalysisRuntime({projectRoot:root,nativeObjectArguments:true,ledger,credentials:createApprovedProviderCredentials({environment:{}}),modelTransport:async request=>{
  calls++;if(calls!==2)return {content:[{kind:'text',text:'合成已知事实'}],stop:'complete',usage:{inputTokens:4,outputTokens:2}};
  assert.equal(request.messages.flatMap(m=>m.tools??[]).length,0);
  if(boundary==='queued')await runtime.sessionControl!({...base,command:{kind:'followUp',text:'排队合成报告'}});
  return await new Promise<never>((_,reject)=>{request.signal.addEventListener('abort',()=>reject(Object.assign(new Error('CANCELLED'),{code:'CANCELLED'})),{once:true});setImmediate(()=>{if(boundary==='stopped-receipt')ledger.stop(identity.task_id);cancelled.abort();});});
 }});
 const runtime=make(),base={identity,prompt:'合成事实',system:'不执行现实动作',tools:[],signal:new AbortController().signal,authorize:()=>true};
 await runtime.run({...base,nativeBusinessTools:true});await assert.rejects(()=>runtime.run({...base,purpose:'report_edit',signal:cancelled.signal}));await runtime.collect!(identity.task_id);
 const state=createPersistentRuntimeState({projectRoot:root}),physical=ledger.read(identity.task_id).at(-1)!,admission=state.readAudit(identity.task_id).findLast(e=>e.kind==='model.admitted')!;
  if(boundary==='admission-digest'){const db=new DatabaseSync(join(root,'.xanthil','desktop','pi-runtime.sqlite'));try{const body=JSON.stringify({...admission,digest:'0'.repeat(64)});db.prepare('UPDATE audit SET body=?,digest=? WHERE run_id=? AND sequence=?').run(body,createHash('sha256').update(body).digest('hex'),admission.runId,admission.sequence);}finally{db.close();}}
 if(boundary==='tool-effect'){await state.audit.append({...admission,kind:'tool.admitted',sequence:admission.sequence+1,toolName:'unconfirmed_tool'},new AbortController().signal);}
 if(boundary==='pending-physical')ledger.reserve({...identity,operation_id:randomUUID(),input_sha256:'d'.repeat(64),provider:'xiaomi-token-plan-cn',model:'mimo-v2.6-flash'});
 const rows=ledger.read(identity.task_id),before=state.readAccounting(identity.task_id)!,audit=state.readAudit(identity.task_id);
 const held=boundary==='writer'?await state.sessionStorage(async()=>true).acquireWriter(new AbortController().signal):undefined;
 const storage=state.sessionStorage(async()=>true),prefix=new Map(readdirSync(storage.directory,{recursive:true}).filter(f=>typeof f==='string'&&f.endsWith('.jsonl')).map(f=>[String(f),readFileSync(join(storage.directory,String(f)))]));
 const recovery=make() as any;assert.equal(typeof recovery.recoverCancelledReport,'function','missing explicit cancelled-report reconciliation seam');
 const proof={identity,request_id:physical.request_id,process_closed:true,physical_closed:true,stop_receipt_sha256:'d'.repeat(64),process_exit_sha256:'e'.repeat(64)};
 if(boundary==='audit-fault'){const db=new DatabaseSync(join(root,'.xanthil','desktop','pi-runtime.sqlite'));try{db.exec("CREATE TRIGGER deny_recovery_audit BEFORE INSERT ON audit BEGIN SELECT RAISE(ABORT,'fixture audit unavailable'); END");}finally{db.close();}}
 if(boundary==='save-fault'||boundary==='late-audit-fault'){const db=new DatabaseSync(join(root,'.xanthil','desktop','pi-runtime.sqlite'));try{db.exec(boundary==='save-fault'?"CREATE TRIGGER deny_recovery_budget BEFORE UPDATE ON budgets BEGIN SELECT RAISE(ABORT,'fixture budget unavailable'); END":"CREATE TRIGGER deny_recovery_receipt BEFORE INSERT ON audit WHEN json_extract(NEW.body,'$.kind')='session.control' BEGIN SELECT RAISE(ABORT,'fixture receipt unavailable'); END");}finally{db.close();}}
 const target={session:admission.session!.sessionId,branch:admission.session!.branch,operation:boundary==='operation'?randomUUID():admission.session!.operationId};
 const input={...base,identity:boundary==='identity'?{...identity,grant_id:randomUUID()}:identity,authorize:()=>boundary!=='revoked',approval:'c'.repeat(64),expectedAccounting:boundary==='accounting-drift'?'f'.repeat(64):hash(before),expectedLedger:boundary==='ledger-drift'?'f'.repeat(64):hash(rows),target,provePhysicalStop:()=>{proofReads++;return boundary==='no-proof'?null:boundary==='live-process'?{...proof,process_closed:false}:boundary==='proof-drift'&&proofReads>1?{...proof,stop_receipt_sha256:'f'.repeat(64)}:proof;}};
 if(boundary==='unknown-request'){const actual=recovery;assert.equal(typeof actual.recoverCancelledReport,'function');const guarded=createPiSessionOpenAnalysisRuntime({projectRoot:root,nativeObjectArguments:true,credentials:createApprovedProviderCredentials({environment:{}}),ledger:{...ledger,read:(id:string)=>ledger.read(id).map(row=>row.request_id===physical.request_id?{...row,status:'unknown' as const}:row)},modelTransport:async()=>assert.fail('must not dispatch')}) as any;await assert.rejects(()=>guarded.recoverCancelledReport({...input,expectedLedger:hash(rows.map(row=>row.request_id===physical.request_id?{...row,status:'unknown'}:row))}));}
 else if(!['known','stopped-receipt'].includes(boundary))await assert.rejects(()=>recovery.recoverCancelledReport(input));
 else{
  const result=await recovery.recoverCancelledReport(input);assert.equal(result.status,'aborted');assert.equal(result.operation,target.operation);assert.equal(calls,2);
  const view=await make().sessionControl!({...base,command:{kind:'snapshot'}});assert.equal(view.view!.operationId,null);
  const after=state.readAccounting(identity.task_id)!;assert.equal(after.owner,null);assert.deepEqual(after.reservations,before.reservations);for(const key of ['modelCalls','toolCalls','inputTokens','outputTokens','reservedOutputTokens','resourceUnits'] as const)assert.equal(after.usage[key],before.usage[key]);
  if(boundary==='known'){await make().run({...base,purpose:'report_edit'});assert.equal(calls,3,'new explicit report can start only after native termination');}else assert.equal(calls,2,'recovery itself never resumes the product stop fence');assert.equal(state.readAccounting(identity.task_id)!.usage.reservedOutputTokens,4096);
 }
 assert.deepEqual(ledger.read(identity.task_id).slice(0,rows.length),rows);for(const [f,bytes]of prefix)assert.ok(readFileSync(join(storage.directory,f)).subarray(0,bytes.length).equals(bytes));
 if(!['known','stopped-receipt'].includes(boundary)){assert.equal(calls,2);const after=state.readAccounting(identity.task_id)!;if(['audit-fault','late-audit-fault'].includes(boundary)){assert.ok(after.usage.activeMs>=before.usage.activeMs);assert.deepEqual({...after,usage:{...after.usage,activeMs:before.usage.activeMs}},before);if(boundary==='late-audit-fault'){await assert.rejects(()=>make().run({...base,purpose:'report_edit'}));assert.equal(calls,2,'failed audit must fence the next Provider admission');}}else assert.deepEqual(after,before);if(boundary==='save-fault'){const retained=state.readAudit(identity.task_id);assert.deepEqual(retained.slice(0,audit.length),audit);assert.equal(retained.length,audit.length+1);assert.equal(retained.at(-1)!.kind,'session.control');assert.equal(retained.at(-1)!.reason,'CANCELLED');}else if(boundary!=='late-audit-fault')assert.deepEqual(state.readAudit(identity.task_id),audit);}
 await held?.release();
});
