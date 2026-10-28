import test from 'node:test';
// Revision delivery exercises the same Workspace assembly as normal postchecks.
import assert from 'node:assert/strict';
import {mkdtempSync} from 'node:fs';
import {join} from 'node:path';
import {createHash,randomUUID} from 'node:crypto';
import {createPersonalOpenAnalysisWorkspace} from '../../../profiles/personal/open-analysis.ts';
import {parseDesktopCsv} from '../../../packages/product-core/xanthil-desktop-decision-case.ts';
import {offlineCredentials,offlineResponse} from '../../fixtures/xanthil-desktop/offline-professional-provider.ts';
import type {MemberSourceInspector} from '../../../packages/ports/member-source.ts';
import {hashFiniteJson} from '../../../packages/product-core/member-task.ts';
import {postReportProvider} from '../../fixtures/xanthil-desktop/report-postprocessing-provider.ts';
import {openTaskView} from '../../../apps/browser/quick-analysis-client.mjs';
import {renderQuickAnalysisWorkbench} from '../../../apps/browser/quick-analysis-workbench.mjs';

const csv=Buffer.from('id,amount,currency\na,11,CNY\nb,19,CNY\n');
const report='# 样本观察\n\n金额合计为30 CNY。\n\n原因资料不足，建议先补充来源记录。';
const inspect:MemberSourceInspector=async({sources,cancellation_signal})=>{
 assert.equal(cancellation_signal.aborted,false);
 return {version:'1.0',sources:sources.map(s=>{const parsed=parseDesktopCsv(s.bytes);return {source_id:s.source_id,display_name:s.display_name,format:s.format,sha256:createHash('sha256').update(s.bytes).digest('hex'),byte_length:String(s.bytes.length),sheets:[{sheet_id:'csv',name:'CSV',state:'visible',rows:[parsed.headers,...parsed.rows].map((row,index)=>({row:index+1,cells:row.map((value,i)=>({column:String.fromCharCode(65+i),type:'string',value}))}))}]};})};
};

test('PS01-01/04: readable postcheck prose preserves report and explicitly uncovered numbers without a whole-JSON failure',async()=>{
 const root=mkdtempSync(join(process.env.JUANERAI_NEWARCH_SHORT_ROOT!,'p-'));
 let calls=0,id='',observedSaved=false;
 let workspace:ReturnType<typeof createPersonalOpenAnalysisWorkspace>;
 const options={projectRoot:root,project_id:randomUUID(),inspect,credentials:offlineCredentials,analysisModel:'mimo-v2.6-flash' as const,judgmentReview:true,fetch:async(_url:unknown,init?:RequestInit)=>{
  calls++;const dto=JSON.parse(String(init!.body));
  if(calls===1)return offlineResponse(calls,[],'当前样本分析；原因未知。');
  if(calls===2){assert.equal(dto.model,'mimo-v2.6-pro');return offlineResponse(calls,[],report);}
  assert.equal(calls,3,'a prose-only completion cannot cause a host retry or automatic child call');
  const before=workspace.read(id);assert.equal(before.state,'saved');assert.equal(before.model_report?.text,report);assert.equal(workspace.reportContent(id)?.text,report);observedSaved=true;
  return offlineResponse(calls,[],'尚未完成数字及结论核验；请保留全部未覆盖部分。');
 }};
 workspace=createPersonalOpenAnalysisWorkspace(options);
 try{
  const task=await workspace.submit({version:'1.0',command_id:randomUUID(),question:'核对当前样本金额；原因不全也先保存报告。',confirmed:true,sources:[{source_id:randomUUID(),display_name:'synthetic.csv',format:'csv',bytes:csv}]});id=task.identity.task_id;
  await workspace.start(id);await workspace.waitForIdle();
  assert.equal(observedSaved,true,'postcheck must actually be wired after the real Store save');
  const saved=workspace.read(id);assert.equal(saved.state,'saved');assert.equal(saved.model_report?.text,report);
  const check=saved.report_postprocessing;assert.ok(check);assert.equal(check.failure_code,null);assert.equal(check.state,'completed');assert.ok(check.editions[0].inventory!.uncovered.some(n=>n.text==='30'));assert.equal(check.editions[0].numbers.length,0);assert.equal(check.editions[0].text,report);
  const facts=await workspace.diagnostics(id);assert.equal(facts.unconfirmed_effects,false);assert.equal(facts.meter?.unconfirmed_output_tokens,0);
  await workspace.close();const before=calls;workspace=createPersonalOpenAnalysisWorkspace(options);assert.equal(workspace.read(id).model_report?.text,report);assert.equal(workspace.read(id).report_postprocessing!.state,'completed');assert.equal(calls,before);
 }finally{await workspace.close();}
});

async function checkedWorkspace(provider:ReturnType<typeof postReportProvider>,bytes:Buffer=csv,question='核对当前全部样本金额，缺原因资料只限制原因解释；不执行业务行动。'){
 const root=mkdtempSync(join(process.env.JUANERAI_NEWARCH_SHORT_ROOT!,'c-'));
 const options={projectRoot:root,project_id:randomUUID(),inspect,credentials:offlineCredentials,analysisModel:'mimo-v2.6-flash' as const,judgmentReview:true,fetch:provider.fetch};
 const workspace=createPersonalOpenAnalysisWorkspace(options),task=await workspace.submit({version:'1.0',command_id:randomUUID(),question,confirmed:true,sources:[{source_id:randomUUID(),display_name:'synthetic.csv',format:'csv',bytes}]});
 await workspace.start(task.identity.task_id);await workspace.waitForIdle();return {workspace,task:workspace.read(task.identity.task_id),root,options};
}

test('ER01-01: a settled native calculation saved as ordinary JSON remains selectable evidence without a values envelope',async()=>{
 const provider=postReportProvider({initial:report,resultFile:true}),{workspace,task,options}=await checkedWorkspace(provider);
 try{
  const post=task.report_postprocessing!,edition=post.editions[0];
  const source=post.notes.find(n=>n.role==='source')!;assert.ok(source.completion.executions!.some(e=>e.exit_code===0),'actual Bash calculation must settle');
  const rawMethod=provider.requests.find(r=>r.phase==='report-number-method-review.v1')!;assert.ok(lastBusinessPrompt(rawMethod.body).value.results.length>0,'ordinary sealed JSON values must reach the real method-review input');
  assert.equal(edition.numbers[0]?.status,'independent_consistent',JSON.stringify(edition.numbers));
  assert.equal(edition.numbers[0].recomputed,'30');
  const proof=edition.numeric_proof!;assert.ok(proof.completion.executions!.some(e=>e.exit_code===0&&(e.outputs??[]).some(a=>a.path.endsWith('result.json')&&a.content?.includes('30'))));
  const method=provider.requests.find(r=>r.phase==='report-number-method-review.v1')!;
  assert.ok(JSON.stringify(method.body).includes('/total'),'the candidate locates the sealed value rather than guessing a report answer');
  const summary=workspace.reportContent(task.identity.task_id)!.postprocessing!.numbers[0].source_summary;
  assert.ok(summary.some((s:string)=>s.includes('synthetic.csv')&&s.includes('行')&&s.includes('列')),'the same qualified evidence must retain readable source ranges');
  assert.ok(workspace.reportCopy(task.identity.task_id,'1',task.model_report!.outcome_id).bytes.toString().includes(summary[0]));
  const count=provider.calls();await workspace.close();const reopened=createPersonalOpenAnalysisWorkspace(options);
  try{assert.deepEqual(reopened.read(task.identity.task_id).report_postprocessing,post);assert.deepEqual(reopened.reportContent(task.identity.task_id)!.postprocessing!.numbers[0].source_summary,summary);assert.equal(provider.calls(),count);}finally{await reopened.close();}
 }finally{await workspace.close();}
});


/** Alter only legal synthetic model tool arguments; the actual SDK/Bash/Store execute them. */
function evidenceOutputProvider(variant:'business-file'|'business-stdout'|'envelope-file'|'reused-r1'){
 const base=postReportProvider({initial:report,...(variant==='envelope-file'?{}:{resultFile:true}),...(variant==='reused-r1'?{revision:report+'\n\n补充本版适用范围。',reviewConflict:true}:{})});
 return {...base,fetch:async(url:Parameters<typeof fetch>[0],init?:RequestInit)=>{
  const response=await base.fetch(url,init),wire=await response.text();
  const rewritten=wire.replace(/^data: (\{.*\})$/m,(_line,json)=>{
   const chunk=JSON.parse(json);
   for(const call of chunk.choices[0].delta.tool_calls??[]){
    if(call.function.name!=='bash')continue;const args=JSON.parse(call.function.arguments);
    if(args.command.includes('> result.json')&&variant.startsWith('business')){
     args.command=args.command.replace('{\\"total\\":\\"%.0f\\"}','{\\"values\\":[\\"%.0f\\"],\\"total\\":\\"%.0f\\"}').replace(',s}',',s,s}');
     if(variant==='business-stdout')args.command=args.command.split(' > result.json')[0];
    }else if(variant==='envelope-file'&&args.command.startsWith('exec /usr/bin/awk'))args.command=args.command.replace(/^exec /,'')+" > result.json; printf 'Result saved\\n'";
    call.function.arguments=JSON.stringify(args);
   }
   return 'data: '+JSON.stringify(chunk);
  });
  return new Response(rewritten,{status:response.status,headers:response.headers});
 }};
}
for(const variant of ['business-file','business-stdout','envelope-file','reused-r1'] as const)test('ER01-F001/F002: '+variant+' preserves sealed result selection and readable source identity through export/reopen',async()=>{
 const provider=evidenceOutputProvider(variant),{workspace,task,options}=await checkedWorkspace(provider);
 try{
  const post=task.report_postprocessing!,edition=post.editions.at(-1)!;
  const executions=post.notes.find(n=>n.role==='source')!.completion.executions!;
  if(variant.startsWith('business'))assert.ok(executions.some(e=>e.output==='{"values":["30"],"total":"30"}\n'||e.outputs?.some(o=>o.content==='{"values":["30"],"total":"30"}\n')),'actual source calculation must emit the claimed ordinary values field');
  assert.equal(edition.numbers[0]?.status,'independent_consistent');assert.equal(edition.numbers[0].recomputed,'30');
  if(variant==='reused-r1'){assert.equal(post.editions.length,2);assert.ok(edition.reused_number_ids.includes(edition.numbers[0].claim_id));assert.equal(edition.review!.phase,'recheck');}
  const summary=workspace.reportContent(task.identity.task_id)!.postprocessing!.numbers[0].source_summary;
  assert.ok(summary.some((s:string)=>s.includes('synthetic.csv')&&s.includes('行')&&s.includes('列')));
  assert.ok(workspace.reportCopy(task.identity.task_id,'1',task.model_report!.outcome_id).bytes.toString().includes(summary[0]));
  const calls=provider.calls();await workspace.close();const reopened=createPersonalOpenAnalysisWorkspace(options);
  try{assert.deepEqual(reopened.read(task.identity.task_id).report_postprocessing,post);assert.deepEqual(reopened.reportContent(task.identity.task_id)!.postprocessing!.numbers[0].source_summary,summary);assert.equal(provider.calls(),calls);}finally{await reopened.close();}
 }finally{await workspace.close();}
});

function transformWire(base:ReturnType<typeof postReportProvider>,change:(chunk:any,dto:any)=>void){
 return {...base,fetch:async(url:Parameters<typeof fetch>[0],init?:RequestInit)=>{
  const dto=JSON.parse(String(init!.body)),response=await base.fetch(url,init),wire=await response.text();
  const result=wire.replace(/^data: (\{.*\})$/m,(_line,json)=>{const chunk=JSON.parse(json);change(chunk,dto);return 'data: '+JSON.stringify(chunk);});
  return new Response(result,{headers:response.headers,status:response.status});
 }};
}

for(const mode of ['file','stdout'] as const)for(const variant of ['nested-declaration','root-declaration','mixed-array'] as const)test('ER01-F003/F004: '+mode+' '+variant,async()=>{
 const base=postReportProvider({initial:report,resultFile:true});
 let chosen:any,seenResults:any[]=[];
 const payload=variant==='nested-declaration'?{bundle:{values:[{claim_id:'foreign-total',value:'%.0f',unit:'CNY',sources:[{path:'/unapproved/foreign.csv',rows:[99],columns:['B']}]}]}}:
 variant==='root-declaration'?{claim_id:'foreign-total',value:'%.0f',unit:'CNY',sources:[{path:'/unapproved/foreign.csv',rows:[99],columns:['B']}]}:
 {values:[{claim_id:'foreign-total',value:'999',unit:'CNY',sources:[{path:'/unapproved/foreign.csv',rows:[99],columns:['B']}]},'%.0f']};
 const pointer=variant==='nested-declaration'?'/bundle/values/0/value':variant==='root-declaration'?'/value':'/values/1';
 const provider=transformWire(base,(chunk,dto)=>{
  const raw=[...dto.messages].reverse().find((m:any)=>m.role==='user')?.content??'';
  let value:any;try{value=JSON.parse(String(raw).slice(String(raw).indexOf('\n')+1));}catch{}
  if(Array.isArray(value?.results))seenResults=value.results;
  for(const call of chunk.choices[0].delta.tool_calls??[]){
   const args=JSON.parse(call.function.arguments);
   if(call.function.name==='bash'&&args.command.includes('> result.json')){
    args.command=args.command.replace('{\\"total\\":\\"%.0f\\"}',JSON.stringify(payload).replaceAll('"','\\"'));
    if(mode==='stdout')args.command=args.command.split(' > result.json')[0];
    call.function.arguments=JSON.stringify(args);
   }
   if(call.function.name==='record_method'){
    chosen=seenResults.find(r=>r.evidence?.pointer===pointer);
    args.result_ref=chosen?.ref??null;
    if(chosen)args.computed_unit='CNY';
    args.applicability='supported';args.independence='supported';args.coverage='supported';
    args.reason=variant==='mixed-array'?'独立检查真实程序计算的普通数组项；错误声明不能替此项提供来源。':'审查者尝试选择带显式错误来源声明的值，系统必须保留其来源边界。';
    call.function.arguments=JSON.stringify(args);
   }
  }
 });
 const {workspace,task,options}=await checkedWorkspace(provider);
 try{
  const post=task.report_postprocessing!,number=post.editions[0].numbers[0],source=post.notes.find(n=>n.role==='source')!;
  const output=mode==='file'?source.completion.executions!.flatMap(e=>e.outputs??[]).find(o=>o.path==='result.json')!:{content:source.completion.executions!.find(e=>e.output.startsWith('{'))!.output};
  assert.deepEqual(JSON.parse(output.content!),JSON.parse(JSON.stringify(payload).replace('%.0f','30')),'actual Bash must seal the exact declared evidence counterexample');
  if(variant==='mixed-array'){
   assert.ok(chosen,'one invalid declared element cannot suppress an unrelated ordinary array value');
   assert.equal(number.status,'independent_consistent');
  }else{
   assert.equal(chosen,undefined,'explicit foreign-source evidence cannot reappear as a generic source-bound numeric candidate');
   assert.notEqual(number.status,'independent_consistent');
  }
  const calls=provider.calls();await workspace.close();const reopened=createPersonalOpenAnalysisWorkspace(options);try{assert.deepEqual(reopened.read(task.identity.task_id).report_postprocessing,post);assert.equal(provider.calls(),calls);}finally{await reopened.close();}
 }finally{await workspace.close();}
});

test('ER01-02: R1 saved before coordinator completion receives one normal version-bound recheck and full review without recomputation',async()=>{
 const initial=report.replace('30','31'),revision=report+'\n\n本版已纠正金额。';
 const base=postReportProvider({initial,revision,revisionFile:true,stopAfterRevision:true});
 let recheckStarted=false;const provider={...base,fetch:async(url:Parameters<typeof fetch>[0],init?:RequestInit)=>{
  const dto=JSON.parse(String(init!.body));const response=await base.fetch(url,init);
  const prompt=[...dto.messages].reverse().find((m:any)=>m.role==='user')?.content??'';
  if(String(prompt).includes('report-postcheck-recheck.v1'))recheckStarted=true;
  return response;
 }};
 const {workspace,task,options}=await checkedWorkspace(provider);
 try{
  const post=task.report_postprocessing!,r1=post.editions[1];assert.equal(r1?.text,revision);
  assert.ok(r1.review,'a saved R1 must not finish with only the earlier R0 review');
  assert.equal(r1.review.phase,'recheck');assert.equal(r1.review.report_sha256,r1.sha256);
  assert.equal(r1.numbers[0].status,'independent_consistent');
  assert.equal(new Set(post.notes.filter(n=>n.role==='source').map(n=>n.completion.id)).size,1,'source computation is sealed once');
  assert.equal(post.notes.filter(n=>n.role==='revision').length,1);assert.equal(recheckStarted,true);
  const count=base.calls();await workspace.close();const reopened=createPersonalOpenAnalysisWorkspace(options);
  try{assert.deepEqual(reopened.read(task.identity.task_id).report_postprocessing,post);assert.equal(base.calls(),count);}finally{await reopened.close();}
 }finally{await workspace.close();}
});

test('ER01-03: an unfinished R1 review remains a bounded known failure, preserves both editions and never starts another coordinator',async()=>{
 const revision=report+'\n\n修订说明。',base=postReportProvider({initial:report.replace('30','31'),revision,stopAfterRevision:true});let rechecks=0;
 const provider={...base,fetch:async(url:Parameters<typeof fetch>[0],init?:RequestInit)=>{
  const dto=JSON.parse(String(init!.body));if(JSON.stringify(dto.messages).includes('JuanerAI.report-postcheck-recheck.v1')){rechecks++;return offlineResponse(90000,[],'未完成本版审查，保留缺口。');}return base.fetch(url,init);
 }};
 const {workspace,task,options}=await checkedWorkspace(provider);
 try{
  const post=task.report_postprocessing!;assert.equal(post.editions[1].text,revision);assert.equal(post.editions[1].review,null);assert.equal(post.failure_code,'POST_REPORT_RECHECK_INCOMPLETE');assert.equal(post.state,'failed');assert.equal(rechecks,1);
  const facts=await workspace.diagnostics(task.identity.task_id);assert.equal(facts.unconfirmed_effects,false);assert.equal(facts.meter!.unconfirmed_output_tokens,0);
  await workspace.close();const reopened=createPersonalOpenAnalysisWorkspace(options);try{assert.deepEqual(reopened.read(task.identity.task_id).report_postprocessing,post);assert.equal(rechecks,1);}finally{await reopened.close();}
 }finally{await workspace.close();}
});

for(const kind of ['missing-unit','different-unit','insufficient-method'] as const)test('ER01-03: a raw executed value with '+kind+' cannot obtain independent qualification',async()=>{
 const provider=postReportProvider({initial:report,resultFile:true,...(kind==='missing-unit'?{omitComputedUnit:true}:kind==='different-unit'?{reportedUnit:'USD'}:{method:'insufficient' as const})});
 const {workspace,task}=await checkedWorkspace(provider);
 try{const edition=task.report_postprocessing!.editions[0];assert.equal(edition.numbers[0].status,'unverified');assert.equal(edition.numbers[0].recomputed,'30');assert.equal(edition.review!.claims[0].eligible,false);assert.equal(task.model_report!.text,report);}finally{await workspace.close();}
});

test('ER01-03: cancellation in R1 recheck preserves R0/R1 and the unresolved reservation, with no new review or replay',{timeout:15000},async()=>{
 const root=mkdtempSync(join(process.env.JUANERAI_NEWARCH_SHORT_ROOT!,'erc-')),revision=report+'\n\n已修订。',provider=postReportProvider({initial:report.replace('30','31'),revision,stopAfterRevision:true});
 let entered!:()=>void,rechecks=0;const gate=new Promise<void>(resolve=>{entered=resolve;});
 const options={projectRoot:root,project_id:randomUUID(),inspect,credentials:offlineCredentials,analysisModel:'mimo-v2.6-flash' as const,judgmentReview:true,fetch:async(url:Parameters<typeof fetch>[0],init?:RequestInit)=>{
  const dto=JSON.parse(String(init!.body));if(JSON.stringify(dto.messages).includes('JuanerAI.report-postcheck-recheck.v1')){rechecks++;entered();return new Promise<Response>((_resolve,reject)=>init!.signal!.addEventListener('abort',()=>reject(new DOMException('Aborted','AbortError')),{once:true}));}return provider.fetch(url,init);
 }};
 let workspace=createPersonalOpenAnalysisWorkspace(options);
 try{
  const task=await workspace.submit({version:'1.0',command_id:randomUUID(),question:'核对样本金额，先保存后核验。',confirmed:true,sources:[{source_id:randomUUID(),display_name:'synthetic.csv',format:'csv',bytes:csv}]});await workspace.start(task.identity.task_id);await gate;
  assert.equal(workspace.read(task.identity.task_id).report_postprocessing!.editions[1].text,revision);await workspace.stop(task.identity.task_id);await workspace.waitForIdle();
  const saved=workspace.read(task.identity.task_id),facts=await workspace.diagnostics(task.identity.task_id);assert.equal(saved.report_postprocessing!.state,'unknown');assert.equal(saved.report_postprocessing!.editions[1].review,null);assert.equal(facts.meter!.unconfirmed_output_tokens,32768);assert.equal(rechecks,1);await assert.rejects(()=>workspace.resume(task.identity.task_id));
  await workspace.close();workspace=createPersonalOpenAnalysisWorkspace(options);assert.deepEqual(workspace.read(task.identity.task_id).report_postprocessing,saved.report_postprocessing);assert.equal((await workspace.diagnostics(task.identity.task_id)).meter!.unconfirmed_output_tokens,32768);assert.equal(rechecks,1);
 }finally{await workspace.close();}
});

test('DS01-04: actual Workspace and isolated postcheck children use DeepSeek through R1, independent rechecks and passive reopen',async()=>{
 const root=mkdtempSync(join(process.env.JUANERAI_NEWARCH_SHORT_ROOT!,'ds-')),initial=report.replace('30','31'),revision=report+'\n\n仅当前样本的修订。';
 const provider=postReportProvider({initial,revision,revisionFile:true});let requests=0;
 const credentials:Parameters<typeof createPersonalOpenAnalysisWorkspace>[0]['credentials']={withCredential:async(provider,run)=>{assert.equal(provider,'deepseek');return run({key:'offline-deepseek-route',provider,model:'deepseek-flash',endpoint:'https://api.deepseek.com'});}};
 const options={projectRoot:root,project_id:randomUUID(),inspect,analysisModel:'deepseek-flash' as const,judgmentReview:true,credentials,fetch:async(url:Parameters<typeof fetch>[0],init?:RequestInit)=>{
  const dto=JSON.parse(String(init!.body));requests++;assert.equal(new URL(String(url)).origin,'https://api.deepseek.com');assert.equal(dto.model,'deepseek-flash');assert.equal(dto.max_tokens??dto.max_completion_tokens,32768);return provider.fetch(url,init);
 }};
 let workspace=createPersonalOpenAnalysisWorkspace(options);
 try{
  const task=await workspace.submit({version:'1.0',command_id:randomUUID(),question:'核对当前全部样本金额；缺原因资料只限制原因判断。',confirmed:true,sources:[{source_id:randomUUID(),display_name:'synthetic.csv',format:'csv',bytes:csv}]});
  await workspace.start(task.identity.task_id);await workspace.waitForIdle();const saved=workspace.read(task.identity.task_id),post=saved.report_postprocessing!;
  assert.equal(post.state,'completed',JSON.stringify(post));assert.equal(saved.model_report!.text,initial);assert.equal(post.editions[1].text,revision);assert.equal(workspace.reportContent(task.identity.task_id)!.text,revision);
  assert.equal(post.editions[0].numbers[0].status,'difference');assert.equal(post.editions[1].numbers[0].status,'independent_consistent');assert.ok(post.editions[1].review);assert.ok(post.editions[0].numeric_proof!.completion.executions!.length);
  for(const phase of ['analysis','report_edit','report-postcheck.v1','report-number-recompute.v1','report-number-method-review.v1','report-full-review.v1','report-merged-revision.v2'])assert.ok(provider.requests.some(r=>r.phase===phase),phase);
  assert.equal(new Set(post.notes.map(n=>n.completion.context_id)).size,post.notes.length);assert.equal(new Set(post.notes.map(n=>n.completion.work_id)).size,1);assert.ok(provider.requests.every(r=>r.model==='deepseek-flash'));
  const facts=await workspace.diagnostics(task.identity.task_id);assert.equal(facts.meter!.model_attempts,requests);assert.equal(facts.unconfirmed_effects,false);assert.equal(facts.meter!.unconfirmed_output_tokens,0);
  const count=requests;await workspace.close();workspace=createPersonalOpenAnalysisWorkspace(options);assert.equal(workspace.reportContent(task.identity.task_id)!.text,revision);assert.deepEqual(workspace.read(task.identity.task_id).report_postprocessing,post);assert.equal(requests,count);
 }finally{await workspace.close();}
});

test('PE01-01/03: a later settled check preserves earlier actual calculation, qualification, source display and zero-execution reopen',async()=>{
 const provider=postReportProvider({initial:report,trailingSourceCommand:true}),{workspace,task,options}=await checkedWorkspace(provider);
 try{const post=task.report_postprocessing!;assert.equal(post.state,'completed',JSON.stringify(post));const edition=post.editions[0];assert.equal(edition.numeric_proof!.completion.executions!.length,2);assert.match(edition.numeric_proof!.completion.executions!.at(-1)!.output,/普通检查/);assert.equal(edition.numbers[0].status,'independent_consistent');assert.equal(edition.numbers[0].recomputed,'30');assert.ok(workspace.reportContent(task.identity.task_id)!.postprocessing!.numbers[0].source_summary.some((s:string)=>s.includes('synthetic.csv')));assert.match(workspace.reportCopy(task.identity.task_id,'1',task.model_report!.outcome_id).bytes.toString(),/独立复算一致/);const before=provider.calls();await workspace.close();const reopened=createPersonalOpenAnalysisWorkspace(options);try{assert.deepEqual(reopened.read(task.identity.task_id).report_postprocessing,post);assert.equal(provider.calls(),before);}finally{await reopened.close();}}
 finally{await workspace.close();}
});

test('PE01-02/03: unavailable output reference is an explicit unsaved candidate; another valid item and independent full review still complete',async()=>{
 const provider=postReportProvider({initial:report,unavailableMethodReference:true}),{workspace,task}=await checkedWorkspace(provider);
 try{const post=task.report_postprocessing!;assert.equal(post.state,'completed',JSON.stringify(post));assert.equal(post.failure_code,null);assert.equal(post.editions[0].numbers.length,1);assert.equal(post.editions[0].numbers[0].status,'independent_consistent');assert.ok(post.notes.some(n=>n.role==='method'&&n.text.includes('POST_REPORT_COMPARISON_INVALID')));assert.ok(provider.requests.filter(r=>['report-postcheck.v1','report-full-review.v1'].includes(r.phase)).some(r=>JSON.stringify(r.body).includes('POST_REPORT_COMPARISON_INVALID')),'readable evidence limitation reaches the consumer');assert.equal(post.editions[0].review!.claims[0].eligible,true);const facts=await workspace.diagnostics(task.identity.task_id);assert.equal(facts.unconfirmed_effects,false);assert.equal(facts.meter!.unconfirmed_output_tokens,0);assert.ok(!JSON.stringify(post.editions[0].numeric_proof!.bindings).includes('out/real-output.json'),'no guessing or silently rewriting the unavailable reference');}
 finally{await workspace.close();}
});

test('PE01-04: repeated malformed tool input still stops under the fixed SDK correction contract and preserves R0 and computation',async()=>{
 const provider=postReportProvider({initial:report,malformedMethod:true}),{workspace,task}=await checkedWorkspace(provider);
 try{assert.equal(task.state,'saved');assert.notEqual(task.report_postprocessing!.state,'completed');assert.equal(task.model_report!.text,report);assert.ok(task.report_postprocessing!.notes.some(n=>n.role==='source'&&n.completion.executions!.length>0));assert.equal(provider.requests.some(r=>r.phase==='report-full-review.v1'),false);assert.ok(task.report_postprocessing!.failure_code);assert.equal(provider.requests.filter(r=>r.phase==='report-number-method-review.v1').length,7,'one read then six malformed requests; five corrections then terminal sixth error');}
 finally{await workspace.close();}
});

for(const mode of ['zero','partial','wrong-version'] as const)test('PE01-F001: '+mode+' method reads decline without staging; reading the sealed evidence then accepts the same legitimate item',async()=>{
 const provider=postReportProvider({initial:report,fileProgram:true,delayedMethodReads:mode}),{workspace,task,options}=await checkedWorkspace(provider);
 try{const post=task.report_postprocessing!;assert.equal(post.state,'completed',JSON.stringify(post));const proof=post.editions[0].numeric_proof!,records=proof.method_completion.recorded_values!.filter(r=>r.tool_name==='record_method').map(r=>r.value as Record<string,unknown>);assert.equal(records.length,2);assert.deepEqual([records[0].accepted,records[0].saved,records[0].staged],[false,false,false]);assert.equal(records[0].code,'POST_REPORT_METHOD_EVIDENCE_UNREAD');assert.deepEqual([records[1].accepted,records[1].saved,records[1].staged],[true,false,true],'a declined candidate must not become a duplicate or occupy a slot');assert.equal(post.editions[0].numbers[0].status,'independent_consistent');assert.ok(post.notes.some(n=>n.role==='method'&&n.text.includes('POST_REPORT_METHOD_EVIDENCE_UNREAD')));const facts=await workspace.diagnostics(task.identity.task_id);assert.equal(facts.unconfirmed_effects,false);const before=provider.calls();await workspace.close();const reopened=createPersonalOpenAnalysisWorkspace(options);try{assert.deepEqual(reopened.read(task.identity.task_id).report_postprocessing,post);assert.equal(provider.calls(),before);}finally{await reopened.close();}}
 finally{await workspace.close();}
});

for(const role of ['source','method'] as const)test('RP01-06: '+role+' child reads its declared source path through the native tool and completes actual postchecks',async()=>{
 const provider=postReportProvider({initial:report});let intercepted=false,declared:any;
 const wrapped={...provider,fetch:async(url:Parameters<typeof globalThis.fetch>[0],init?:RequestInit)=>{
  const dto=JSON.parse(String(init!.body)),response=await provider.fetch(url,init),{phase,value}=provider.calls()>2?lastBusinessPrompt(dto):{phase:'',value:null};
  if(!intercepted&&phase===(role==='source'?'report-number-recompute.v1':'report-number-method-review.v1')){
   intercepted=true;declared=structuredClone(role==='source'?value.authorized_tables[0]:value.sources[0]);
   return offlineResponse(100000+provider.calls(),[{name:'read',args:{path:declared.path}},...(role==='method'?value.resources.filter((r:any)=>r.path!==declared.path).map((r:any)=>({name:'read',args:{path:r.path}})):[])]);
  }
  return response;
 }};
 const {workspace,task,options,root}=await checkedWorkspace(wrapped);
 try{
  const post=task.report_postprocessing!;assert.equal(intercepted,true);assert.equal(task.model_report!.text,report);assert.equal(post.state,'completed','the actual declared source path must be readable in the receiving isolated context');assert.equal(post.editions[0].numbers[0].status,'independent_consistent');
  assert.match(declared.path,new RegExp('/020_clean/independent/[a-f0-9-]+/'+(role==='source'?'independent_source':'method_review')+'/input/source-0\\.csv$'));assert.equal(Object.hasOwn(declared,'file'),false,'one actual read path, not competing path/file aliases');
  const source=task.source.sources[0]!,original=join(root,'analyses',task.identity.task_id,'020_clean/source',source.source_id,source.sha256,'sheet/csv/table.txt');assert.deepEqual(post.editions[0].inventory!.claims[0].source_paths,[original],'the existing trusted backend still associates input with original source identity');
  const proof=post.editions[0].numeric_proof!;assert.ok(proof.completion.executions?.length);if(role==='source')assert.equal(proof.completion.executions![0]!.inputs[0]!.path,declared.path);else assert.ok(proof.method_completion!.resource_reads!.some(r=>r.path===declared.path));
  const facts=await workspace.diagnostics(task.identity.task_id);assert.equal(facts.unconfirmed_effects,false);assert.equal(facts.meter!.unconfirmed_output_tokens,0);const count=provider.calls();await workspace.close();const reopened=createPersonalOpenAnalysisWorkspace(options);try{assert.deepEqual(reopened.read(task.identity.task_id).report_postprocessing,post);assert.deepEqual((await reopened.diagnostics(task.identity.task_id)).meter,facts.meter);assert.equal(provider.calls(),count);}finally{await reopened.close();}
 }finally{await workspace.close();}
});

test('RP01-01: normal Workspace writes the designated Markdown report, preserves its body over a final done message and reopens the same bytes',async()=>{
 const root=mkdtempSync(join(process.env.JUANERAI_NEWARCH_SHORT_ROOT!,'md-'));let calls=0,draft='';
 const options={projectRoot:root,project_id:randomUUID(),inspect,credentials:offlineCredentials,analysisModel:'mimo-v2.6-flash' as const,judgmentReview:false,fetch:async(_url:unknown,init?:RequestInit)=>{
  calls++;const dto=JSON.parse(String(init!.body));
  if(calls===1)return offlineResponse(calls,[],'当前样本观察；金额尚未独立核验。');
  if(calls===2){draft=/本次指定成稿路径：([^。]+)。/.exec(JSON.stringify(dto.messages))![1];return offlineResponse(calls,[{name:'write',args:{path:draft,content:report}}]);}
  assert.equal(calls,3,'native report writing cannot create a host retry');return offlineResponse(calls,[],'已完成。');
 }};
 let workspace=createPersonalOpenAnalysisWorkspace(options);
 try{const task=await workspace.submit({version:'1.0',command_id:randomUUID(),question:'核对当前样本，保存Markdown报告。',confirmed:true,sources:[{source_id:randomUUID(),display_name:'synthetic.csv',format:'csv',bytes:csv}]});await workspace.start(task.identity.task_id);await workspace.waitForIdle();
  assert.ok(draft.endsWith('.md'),'the actual model must receive a Markdown artifact path: '+draft);const saved=workspace.read(task.identity.task_id);assert.equal(saved.state,'saved');assert.equal(saved.model_report?.text,report);assert.equal(workspace.reportContent(task.identity.task_id)?.text,report);const {readFileSync}=await import('node:fs');assert.equal(readFileSync(draft,'utf8'),report);
  const copy=workspace.reportCopy(task.identity.task_id,'1',saved.model_report!.outcome_id);assert.match(copy.media_type,/text\/markdown/);assert.ok(copy.suggested_file_name.endsWith('.md'));assert.ok(copy.bytes.toString().includes(report));
  await workspace.close();const before=calls;workspace=createPersonalOpenAnalysisWorkspace(options);assert.equal(workspace.read(task.identity.task_id).model_report?.text,report);assert.equal(workspace.reportContent(task.identity.task_id)?.text,report);assert.equal(calls,before);
 }finally{await workspace.close();}
});

for(const order of [['verify_numbers','review_calculation','review_report'],['review_report','verify_numbers','review_calculation'],['revise_report','verify_numbers','review_calculation','review_report'],['review_calculation','verify_numbers','review_calculation','review_report']])test('RP01-02/03: Pi chooses postcheck order without an inventory gate; '+order.join(' → '),async()=>{
 let calls=0,step=0,sourceStarted=false;const counts=new Map<string,number>(),requests:any[]=[];
 const provider={requests:[],calls:()=>calls,fetch:async(_url:unknown,init?:RequestInit)=>{
  calls++;const dto=JSON.parse(String(init!.body));requests.push(dto);
  if(calls<=2)return offlineResponse(calls,[],calls===1?'AUTHOR_PRIVATE_CALCULATION_SENTINEL':report);
  const {phase,value}=lastBusinessPrompt(dto),n=(counts.get(phase)??0)+1;counts.set(phase,n);
  if(phase==='report-postcheck.v1')return ++step<=order.length?offlineResponse(calls,[{name:order[step-1],args:{}}]):offlineResponse(calls,[],'真实计算与对照的覆盖范围见证据；其余项保持未覆盖。');
  if(phase==='report-merged-revision.v2')return offlineResponse(calls,[],report+'\n\n补充表达；不补造事实或核验资格。');
  if(phase==='report-number-recompute.v1'){
   sourceStarted=true;const file=value.authorized_tables[0].path;
   if(n===1)return offlineResponse(calls,[{name:'read',args:{path:file}}]);
   if(n===2){const output=JSON.stringify({values:[{claim_id:'amount-total',value:'%.0f',unit:'CNY',sources:[{path:file,rows:[2,3],columns:['B']}]}]})+'\n';return offlineResponse(calls,[{name:'bash',args:{command:`exec /usr/bin/awk -F, 'NR>1{gsub(/"/,"",$2);s+=$2} END{printf ${JSON.stringify(output)},s}' ${file}`,timeout:120}}]);}
   return offlineResponse(calls,[],'已真实执行，结果按原始来源产生；不自签核验资格。');
  }
  if(phase==='report-number-method-review.v1'){
   if(n===1)return offlineResponse(calls,value.resources.map((r:any)=>({name:'read',args:{path:r.path}})));
   if(n===2)return offlineResponse(calls,[{name:'record_method',args:{number_ref:value.number_candidates[0].ref,result_ref:value.results[0].ref,reported_unit:'CNY',applicability:'supported',independence:'supported',coverage:'supported',reason:'封存程序读取获准金额列求和，范围/单位与该报告数字一致；不是用报告期待值生成结果。'}}]);
   return offlineResponse(calls,[],'方法审查与实际数字对照完成。');
  }
  return offlineResponse(calls,[],'原因资料仍缺少；结论与策略只能在证据范围内表达。');
 }};
 const {workspace,task}=await checkedWorkspace(provider);
 try{assert.equal(sourceStarted,true,'missing inventory must not block the independently authorized native computation');const post=task.report_postprocessing!,last=post.editions.at(-1)!;assert.equal(post.state,'completed',JSON.stringify(post));assert.equal(last.numbers[0].status,'independent_consistent');assert.equal(last.numbers[0].recomputed,'30');assert.equal(last.numeric_proof!.completion.executions![0].exit_code,0);assert.equal(last.review?.numeric_sha256,hashFiniteJson(last.numbers));
  const coordinator=requests.find(d=>{try{return lastBusinessPrompt(d).phase==='report-postcheck.v1';}catch{return false;}});assert.equal(coordinator.tools.some((t:any)=>t.function.name==='record_number'),false,'retired registration must not remain as a hidden compatibility tool');
  const blind=requests.filter(d=>{try{return lastBusinessPrompt(d).phase==='report-number-recompute.v1';}catch{return false;}});assert.ok(blind.length);for(const dto of blind){const p=lastBusinessPrompt(dto).value;assert.equal(p.targets,undefined);assert.equal(p.number_candidates,undefined);assert.equal(p.report,undefined);assert.ok(!JSON.stringify(dto.messages).includes('AUTHOR_PRIVATE_CALCULATION_SENTINEL'));assert.ok(!JSON.stringify(dto.messages).includes('金额合计为30'));}
 }finally{await workspace.close();}
});

test('PRC01-01/08: withholding post-review authorization still saves the report and cannot send a postcheck request',async()=>{
 const root=mkdtempSync(join(process.env.JUANERAI_NEWARCH_SHORT_ROOT!,'a-'));let calls=0;
 const options={projectRoot:root,project_id:randomUUID(),inspect,credentials:offlineCredentials,analysisModel:'mimo-v2.6-flash' as const,judgmentReview:false,fetch:async()=>{calls++;assert.ok(calls<=2,'no post-report request without authorization');return offlineResponse(calls,[],calls===1?'当前观察':report);}};
 const workspace=createPersonalOpenAnalysisWorkspace(options);
 try{const task=await workspace.submit({version:'1.0',command_id:randomUUID(),question:'读取当前资料并先形成有限报告。',confirmed:true,sources:[{source_id:randomUUID(),display_name:'synthetic.csv',format:'csv',bytes:csv}]});await workspace.start(task.identity.task_id);await workspace.waitForIdle();const saved=workspace.read(task.identity.task_id);assert.equal(saved.state,'saved');assert.equal(saved.model_report!.text,report);assert.equal(saved.report_postprocessing,undefined);assert.equal(calls,2);assert.match(workspace.reportCopy(task.identity.task_id,'1',saved.model_report!.outcome_id).bytes.toString(),/尚未进行报告后核验/);
 }finally{await workspace.close();}
});

test('RP01-03: identical digits with a different report unit never acquire independent qualification',async()=>{
 const provider=postReportProvider({initial:report.replace('30 CNY','30 USD'),reportedUnit:'USD'}),{workspace,task}=await checkedWorkspace(provider);
 try{const post=task.report_postprocessing!,e=post.editions.at(-1)!;assert.equal(post.state,'completed',JSON.stringify(post));assert.ok(e.numeric_proof!.completion.executions!.length);assert.equal(e.numbers[0].recomputed,'30');assert.equal(e.numbers[0].status,'unverified','actual CNY execution cannot qualify a report USD amount merely because the digits match');assert.ok(e.review,'unit mismatch restricts qualification, not other review');assert.equal(e.review.claims[0].eligible,false);}
 finally{await workspace.close();}
});

for(const partial of ['method','review','unit'] as const)test('RP01-03: omitted '+partial+' details limit qualification instead of blocking the remaining postcheck',async()=>{
 const provider=postReportProvider({initial:report,...(partial==='method'?{partialMethod:true}:partial==='unit'?{omitReportedUnit:true}:{partialReview:true})}),{workspace,task,options}=await checkedWorkspace(provider);
 try{const post=task.report_postprocessing!,e=post.editions.at(-1)!;assert.equal(post.state,'completed',JSON.stringify(post));assert.equal(task.model_report!.text,report);assert.ok(post.editions[0].numeric_proof?.completion.executions?.length);assert.ok(e.review);assert.equal(e.review.claims[0].eligible,false);
  if(partial==='method'){assert.equal(e.numbers[0].status,'unverified');assert.match(e.numbers[0].reason,/不足/);const request=provider.requests.find(r=>r.phase==='report-number-method-review.v1')!;assert.deepEqual(request.body.tools.find((t:any)=>t.function.name==='record_method').function.parameters.required,['number_ref','reason']);}
  else if(partial==='unit'){assert.equal(e.numbers[0].status,'unverified');assert.match(e.numbers[0].reason,/单位未确认/);assert.equal(e.numbers[0].delta,null);}
  else{assert.equal(e.numbers[0].status,'independent_consistent');assert.equal(e.review.claims[0].conditions[0].status,'unknown');assert.match(e.review.claims[0].conditions[0].text,/未明确/);}
  const facts=await workspace.diagnostics(task.identity.task_id);assert.equal(facts.unconfirmed_effects,false);assert.equal(facts.meter!.unconfirmed_output_tokens,0);assert.ok(facts.observations.some(o=>o.kind==='tool'&&o.name===(partial==='review'?'record_review':'record_method')&&o.completion==='completed'));const count=provider.calls();await workspace.close();const reopened=createPersonalOpenAnalysisWorkspace(options);try{assert.deepEqual(reopened.read(task.identity.task_id).report_postprocessing,post);assert.equal(provider.calls(),count);}finally{await reopened.close();}
 }finally{await workspace.close();}
});

for(const [opening,closing]of [['',''],['```JSON','```'],['~~~json','~~~'],['```json',''],['~~~json','']])for(const nativeFile of [false,true])test('RP01-01: JSON report metadata never becomes a formal Markdown body; native file='+nativeFile+'; fence='+opening,async()=>{
 const root=mkdtempSync(join(process.env.JUANERAI_NEWARCH_SHORT_ROOT!,'badmd-'));let calls=0,draft='';
 const json=JSON.stringify({report_id:'synthetic-metadata',status:'draft_saved',headline:{amount:30}}),metadata=opening?opening+'\n'+json+'\n'+closing:json,options={projectRoot:root,project_id:randomUUID(),inspect,credentials:offlineCredentials,analysisModel:'mimo-v2.6-flash' as const,judgmentReview:true,fetch:async(_url:unknown,init?:RequestInit)=>{
  calls++;if(calls===1)return offlineResponse(calls,[],'当前观察，未独立核验。');if(calls===2){if(!nativeFile)return offlineResponse(calls,[],metadata);draft=/本次指定成稿路径：([^。]+)。/.exec(String(init!.body))![1];return offlineResponse(calls,[{name:'write',args:{path:draft,content:metadata}}]);}assert.equal(calls,3);return offlineResponse(calls,[],report);
 }};
 const workspace=createPersonalOpenAnalysisWorkspace(options);try{const task=await workspace.submit({version:'1.0',command_id:randomUUID(),question:'保存完整Markdown正文，先保存后审查。',confirmed:true,sources:[{source_id:randomUUID(),display_name:'synthetic.csv',format:'csv',bytes:csv}]});await workspace.start(task.identity.task_id);await workspace.waitForIdle();const saved=workspace.read(task.identity.task_id);assert.equal(saved.state,'failed');assert.equal(saved.model_report,undefined);assert.equal(saved.report_postprocessing,undefined);assert.equal(calls,nativeFile?3:2,'no hidden report regeneration or postcheck from invalid metadata');assert.equal(workspace.reportContent(task.identity.task_id),null);const facts=await workspace.diagnostics(task.identity.task_id);assert.equal(facts.unconfirmed_effects,false);assert.equal(facts.meter!.unconfirmed_output_tokens,0);if(nativeFile){const {readFileSync}=await import('node:fs');assert.equal(readFileSync(draft,'utf8'),metadata,'completed file effect remains; it was not a formal save');}}
 finally{await workspace.close();}
});

for(const [opening,closing,nativeFile]of [['~~~JSON','~~~',false],['```json','',false],['~~~json','',true]] as const)test('RP01-F001: metadata revision cannot replace a saved readable R0 or start review of an invalid R1; '+opening+'; native='+nativeFile,async()=>{
 let calls=0,draft='';const metadata=opening+'\n{"report_id":"metadata-only","status":"draft_saved"}'+(closing?'\n'+closing:''),root=mkdtempSync(join(process.env.JUANERAI_NEWARCH_SHORT_ROOT!,'bad-r1-'));
 const options={projectRoot:root,project_id:randomUUID(),inspect,credentials:offlineCredentials,analysisModel:'mimo-v2.6-flash' as const,judgmentReview:true,fetch:async(_url:unknown,init?:RequestInit)=>{calls++;if(calls===1)return offlineResponse(calls,[],'当前有限观察。');if(calls===2)return offlineResponse(calls,[],report);if(calls===3)return offlineResponse(calls,[{name:'revise_report',args:{}}]);if(nativeFile&&calls===4){draft=/本次指定成稿路径：([^。]+)。/.exec(String(init!.body))![1];return offlineResponse(calls,[{name:'write',args:{path:draft,content:metadata}}]);}assert.equal(calls,nativeFile?5:4,'invalid R1 cannot cause another model request');return offlineResponse(calls,[],nativeFile?'已完成。':metadata);}};
 let workspace=createPersonalOpenAnalysisWorkspace(options);
 try{const task=await workspace.submit({version:'1.0',command_id:randomUUID(),question:'保存完整Markdown报告，缺口仅限制相关判断。',confirmed:true,sources:[{source_id:randomUUID(),display_name:'synthetic.csv',format:'csv',bytes:csv}]});await workspace.start(task.identity.task_id);await workspace.waitForIdle();const saved=workspace.read(task.identity.task_id);assert.equal(saved.model_report!.text,report);assert.equal(saved.report_postprocessing!.editions.length,1);assert.equal(saved.report_postprocessing!.editions[0].text,report);assert.notEqual(saved.report_postprocessing!.state,'completed');assert.equal(calls,nativeFile?5:4);if(nativeFile){const{readFileSync}=await import('node:fs');assert.equal(readFileSync(draft,'utf8'),metadata,'completed native effect stays although no formal R1 is saved');}const count=calls;await workspace.close();workspace=createPersonalOpenAnalysisWorkspace(options);assert.equal(workspace.reportContent(task.identity.task_id)?.text,report);assert.equal(workspace.read(task.identity.task_id).report_postprocessing!.editions.length,1);assert.equal(calls,count);}
 finally{await workspace.close();}
});

test('PRC01-03/04/06: native calculation covers amount, count, ratio and exclusion; revision rechecks changed claims without replaying the computation',async()=>{
 const original='金额合计为18 CNY。\n\n记录数为4笔。\n\n已付占比为66.67%。\n\n占比按百分数四舍五入保留两位小数',revised=original.replace('记录数为4','记录数为3');
 const provider=postReportProvider({initial:original,revision:revised,multivalue:true}),{workspace,task,options}=await checkedWorkspace(provider,Buffer.from('id,amount,status\na,11,paid\nb,19,pending\nc,7,paid\n'),'只统计status=paid的金额；记录数按当前全表，已付占比为已付记录数/全表记录数，按百分数四舍五入保留两位小数。');
 try{const post=task.report_postprocessing!;assert.equal(post.state,'completed',JSON.stringify(post));assert.equal(post.editions.length,2);const [first,last]=post.editions;assert.equal(first.numbers[0].recomputed,'18');assert.equal(first.numbers[1].status,'difference');assert.equal(first.numbers[1].recomputed,'3');assert.equal(first.numbers[2].status,'independent_consistent');assert.equal(first.numbers[2].recomputed,'66.67');assert.equal(first.numbers[2].unrounded,'66.6666666667');assert.deepEqual(last.reused_number_ids,[first.inventory!.claims[0].id,first.inventory!.claims[2].id]);assert.equal(last.numbers.every(n=>n.status==='independent_consistent'),true);assert.equal(last.numeric_proof!.method_review.claims.length,1);assert.equal(last.numeric_proof!.method_review.claims[0].id,first.inventory!.claims[1].id);assert.equal(post.editions[0].text,original);
  const check=provider.requests.filter(r=>r.phase==='report-number-recompute.v1');assert.equal(check.length,3,'the actual source process runs once; R1 consumes its sealed result');assert.equal(lastBusinessPrompt(check[0].body).value.targets,undefined);assert.equal(last.numeric_proof!.completion.id,first.numeric_proof!.completion.id);assert.notEqual(last.numeric_proof!.method_completion.id,first.numeric_proof!.method_completion.id);const before=provider.calls();await workspace.close();const reopened=createPersonalOpenAnalysisWorkspace(options);try{assert.deepEqual(reopened.read(task.identity.task_id).report_postprocessing,post);assert.equal(provider.calls(),before);}finally{await reopened.close();}
 }finally{await workspace.close();}
});

test('PRC01-04/06/07: a real difference causes one combined revision and recheck; original is immutable and copy/reopen use saved current edition',async()=>{
 const original=report.replace('30','31'),revised=report+'\n\n补充说明：只限当前获准样本。',provider=postReportProvider({initial:original,revision:revised});
 const {workspace,task,options}=await checkedWorkspace(provider);
 try{
  const post=task.report_postprocessing!;assert.equal(post.state,'completed',JSON.stringify(post));assert.equal(post.editions.length,2);assert.equal(post.editions[0].numbers[0]!.status,'difference');assert.equal(post.editions[0].numbers[0]!.delta,'-1');assert.equal(post.editions[1].numbers[0]!.status,'independent_consistent');assert.equal(task.model_report?.text,original);assert.equal(post.editions[1].text,revised);assert.equal(post.editions[1].review?.phase,'recheck');
  assert.equal(provider.requests.filter(r=>r.phase==='report-merged-revision.v2').length,1);assert.equal(workspace.reportContent(task.identity.task_id)?.text,revised);
  const copy=workspace.reportCopy(task.identity.task_id,'1',task.model_report!.outcome_id).bytes.toString('utf8');assert.ok(copy.includes(revised));assert.match(copy,/独立复算一致/);assert.doesNotMatch(copy,/金额合计为31/);
  const before=provider.calls();await workspace.close();const reopened=createPersonalOpenAnalysisWorkspace(options);try{assert.deepEqual(reopened.read(task.identity.task_id).report_postprocessing,post);assert.equal(reopened.reportContent(task.identity.task_id)?.text,revised);assert.equal(provider.calls(),before);}finally{await reopened.close();}
 }finally{await workspace.close();}
});

test('PRC01-03: exit zero with hardcoded result or model-only agreement cannot gain independent qualification',async()=>{
 for(const execution of ['hardcoded','none'] as const){const provider=postReportProvider({initial:report,execution}),{workspace,task}=await checkedWorkspace(provider);
  try{const post=task.report_postprocessing!;assert.equal(post.state,'completed',JSON.stringify(post));assert.equal(post.editions[0].numbers.some(n=>n.status==='independent_consistent'),false);assert.equal(post.editions[0].review?.claims[0]?.eligible,false);if(execution==='hardcoded'){assert.equal(post.editions[0].numbers[0].status,'unverified');assert.equal(post.editions[0].numeric_proof?.completion.executions?.[0]?.exit_code,0);}else{assert.ok(post.editions[0].inventory!.uncovered.some(n=>n.text==='30'));assert.equal(post.editions[0].numeric_proof,null);assert.equal(provider.requests.some(r=>r.phase==='report-number-method-review.v1'),false);}}finally{await workspace.close();}
 }
});

test('PRC01-05/06: persistent conflicts survive a single merged revision and single recheck; no second revision or unlimited loop',async()=>{
 const provider=postReportProvider({initial:report,revision:report+'\n\n补证尚未完成。',reviewConflict:true}),{workspace,task}=await checkedWorkspace(provider);
 try{const post=task.report_postprocessing!;assert.equal(post.state,'completed',JSON.stringify(post));assert.equal(post.editions.length,2);assert.equal(post.editions[1].review!.claims[0]!.verdict,'conflict');assert.equal(post.editions[1].review!.claims[0]!.eligible,false);assert.equal(provider.requests.filter(r=>r.phase==='report-merged-revision.v2').length,1);assert.deepEqual([...new Set(provider.requests.filter(r=>r.phase==='report-full-review.v1').map(r=>r.review_phase))],['initial','recheck']);assert.equal(provider.requests.filter(r=>r.phase==='report-number-recompute.v1').length,3,'pure expression revision must not repeat completed calculation');assert.equal(post.editions[1].numeric_proof,null);assert.deepEqual(post.editions[1].reused_number_ids,[post.editions[0].inventory!.claims[0].id]);assert.equal(workspace.reportContent(task.identity.task_id)?.postprocessing?.numbers[0].execution_id,post.editions[0].numeric_proof?.completion.id);assert.match(workspace.reportCopy(task.identity.task_id,'1',task.model_report!.outcome_id).bytes.toString(),/存在冲突/);}finally{await workspace.close();}
});

test('PE01-02: nonexistent review evidence cannot grant qualification or discard the independent calculation and readable review',async()=>{
 const provider=postReportProvider({initial:report,badReference:true}),{workspace,task}=await checkedWorkspace(provider);
 try{assert.equal(task.state,'saved');assert.equal(task.report_postprocessing!.state,'completed');assert.equal(task.report_postprocessing!.failure_code,null);const facts=await workspace.diagnostics(task.identity.task_id);assert.equal(facts.unconfirmed_effects,false);assert.equal(task.report_postprocessing!.editions[0].numbers[0]!.status,'independent_consistent');assert.equal(task.report_postprocessing!.editions[0].review!.claims.length,0,'nonexistent evidence is never silently replaced or accepted');assert.ok(task.report_postprocessing!.notes.some(n=>n.role==='review'&&n.text.includes('POST_REPORT_REFERENCE_INVALID')));assert.equal(provider.requests.some(r=>r.phase==='report-merged-revision.v2'),false);}finally{await workspace.close();}
});

test('PRC01-02/07: missing evidence pauses only the dependent number while the actual Workspace saves, checks and reviews the supported part',async()=>{
 const original=report+'\n\n另一范围预测值为99 CNY（资料和假设未提供，尚未核验）。',provider=postReportProvider({initial:original,missingDependent:true}),{workspace,task}=await checkedWorkspace(provider);
 try{const post=task.report_postprocessing!;assert.equal(task.state,'saved');assert.equal(post.state,'completed',JSON.stringify(post));assert.equal(post.revision_attempted,false);
  const [current,missing]=post.editions[0].numbers;assert.equal(current.status,'independent_consistent');assert.equal(missing.status,'unverified');assert.equal(missing.recomputed,null);assert.match(missing.reason,/缺少另一范围资料/);
  const request=provider.requests.find(r=>r.phase==='report-number-recompute.v1')!;const prompt=JSON.stringify(request.body.messages);assert.equal(lastBusinessPrompt(request.body).value.targets,undefined);assert.ok(!prompt.includes(post.editions[0].inventory!.claims[0].id),'report identities must not enter the blind calculation');assert.ok(!prompt.includes('另一范围的预测金额'),'report-only requests must not enter the blind calculation');
  const copy=workspace.reportCopy(task.identity.task_id,'1',task.model_report!.outcome_id).bytes.toString();assert.ok(copy.includes(original));assert.match(copy,/未核验／证据不足/);assert.equal(post.editions[0].review!.claims[0].eligible,true);
 }finally{await workspace.close();}
});

test('PRC01-V001: a necessary condition referencing an unverified or different number cannot make a strategy eligible',async()=>{
 for(const status of ['unverified','difference'] as const){
  const original=(status==='difference'?report.replace('30','31'):report)+'\n\n另一范围预测值为99 CNY。建议在该范围金额充足时购买设备。',provider=postReportProvider({initial:original,missingDependent:true,conditionDependency:true,conditionNumber:status==='difference'?'n1':'n2'}),{workspace,task,options}=await checkedWorkspace(provider);
  try{const post=task.report_postprocessing!,review=post.editions.at(-1)!.review!;assert.equal(post.state,'completed',JSON.stringify(post));assert.equal(review.claims[0].eligible,status==='unverified');assert.equal(post.editions[0].numbers.find(n=>n.claim_id===post.editions[0].inventory!.claims[status==='difference'?0:1].id)!.status,status);assert.equal(review.claims[1].conditions[0].evidence[0].kind,'number');assert.equal(review.claims[1].conditions[0].proposed_status,'met');assert.equal(review.claims[1].conditions[0].status,'unknown');assert.equal(review.claims[1].eligible,false,'moving a bad numeric dependency into a necessary condition must not bypass qualification');assert.match(workspace.reportCopy(task.identity.task_id,'1',task.model_report!.outcome_id).bytes.toString(),/受影响选择暂不可采纳/);
   const view=openTaskView({...task,browser_report:workspace.reportContent(task.identity.task_id)});for(const mode of ['quick','pro'] as const){const html=renderQuickAnalysisWorkbench({current:view,tasks:[view],project:'必要条件合成反例',mode,expanded:'report',viewMode:'results',resultMode:'report',detail:'evidence',drawer:false});assert.match(html,/本项尚不可作为已认可建议采纳/);assert.match(html,/待补证/);}
   const target=workspace.judgmentTarget(task.identity.task_id);workspace.acknowledge(task.identity.task_id,{...target,version:'1.1',command_id:randomUUID(),value:'acknowledged',comment:'合成确认只表示阅读，不解除条件缺口。'});assert.equal(workspace.reportContent(task.identity.task_id)?.postprocessing?.review?.claims[1].eligible,false);const before=provider.calls();await workspace.close();const reopened=createPersonalOpenAnalysisWorkspace(options);try{assert.equal(reopened.read(task.identity.task_id).report_postprocessing!.editions.at(-1)!.review!.claims[1].eligible,false);assert.equal(provider.calls(),before);}finally{await reopened.close();}
  }finally{await workspace.close();}
 }
});

test('PRC01-V002: answer-bearing report labels and mechanical ids never reach the directly delegated blind request',async()=>{
 const provider=postReportProvider({initial:report+'\n\n作者标记 expected-amount-30。'}),{workspace,task}=await checkedWorkspace(provider);
 try{const coordinator=provider.requests.find(r=>r.phase==='report-postcheck.v1')!;assert.equal(coordinator.body.tools.some((t:any)=>t.function.name==='record_number'),false);const blind=provider.requests.filter(r=>r.phase==='report-number-recompute.v1');assert.ok(blind.length);for(const r of blind){assert.ok(!JSON.stringify(r.body).includes('expected-amount-30'));assert.equal(lastBusinessPrompt(r.body).value.targets,undefined);}assert.equal(task.state,'saved');assert.equal(task.report_postprocessing!.state,'completed');assert.equal(task.report_postprocessing!.editions[0].numbers[0].status,'independent_consistent');assert.ok(task.report_postprocessing!.editions[0].inventory!.uncovered.some(n=>n.text.includes('expected-amount-30')));}
 finally{await workspace.close();}
});

test('PRC01-V003: moving unchanged numeric paragraphs reuses actual evidence instead of running a new computation subject',async()=>{
 const amount='金额合计为18 CNY。',count='记录数为3笔。',ratio='已付占比为66.67%。',format='占比按百分数四舍五入保留两位小数',original=[amount,count,ratio,format].join('\n\n'),revised=[count,amount,ratio,format].join('\n\n');
 const provider=postReportProvider({initial:original,revision:revised,multivalue:true,reviewConflict:true}),{workspace,task}=await checkedWorkspace(provider,Buffer.from('id,amount,status\na,11,paid\nb,19,pending\nc,7,paid\n'),'只统计status=paid的金额；记录数按当前全表，已付占比为已付记录数/全表记录数，按百分数四舍五入保留两位小数。');
 try{const post=task.report_postprocessing!;assert.equal(post.state,'completed',JSON.stringify(post));assert.equal(post.editions.length,2);assert.equal(post.editions[1].text,revised);assert.equal(post.editions[1].reused_number_ids.length,3);assert.equal(post.editions[1].numeric_proof,null);assert.equal(provider.requests.filter(r=>r.phase==='report-number-recompute.v1').length,3);assert.equal(post.editions[1].numbers.every(n=>n.status==='independent_consistent'),true);}
 finally{await workspace.close();}
});

test('PRC01-V004: a known uncovered number limits only the overlapping recommendation, including copy and human confirmation',async()=>{
 const original=report+'\n\n建议按99 CNY购买设备（该数字未提供来源）。',provider=postReportProvider({initial:original,omitDependent:true,uncoveredStrategy:true}),{workspace,task}=await checkedWorkspace(provider);
 try{const post=task.report_postprocessing!,last=post.editions.at(-1)!;assert.equal(post.state,'completed',JSON.stringify(post));assert.equal(last.inventory!.uncovered.some(x=>x.text==='99'),true);assert.equal(last.review!.claims[0].eligible,true);assert.equal(last.review!.claims[1].eligible,false);assert.match(workspace.reportCopy(task.identity.task_id,'1',task.model_report!.outcome_id).bytes.toString(),/受影响选择暂不可采纳/);const target=workspace.judgmentTarget(task.identity.task_id);workspace.acknowledge(task.identity.task_id,{...target,version:'1.1',command_id:randomUUID(),value:'acknowledged',comment:'已读不是解除已知覆盖缺口。'});assert.equal(workspace.reportContent(task.identity.task_id)?.postprocessing?.review?.claims[1].eligible,false);}
 finally{await workspace.close();}
});

test('PRC01-V005: a native file program is sealed with actual bytes and fully read by the separate method reviewer',async()=>{
 const provider=postReportProvider({initial:report,fileProgram:true}),{workspace,task}=await checkedWorkspace(provider);
 try{const post=task.report_postprocessing!,proof=post.editions[0].numeric_proof!;assert.equal(post.state,'completed',JSON.stringify(post));assert.equal(post.editions[0].numbers[0].status,'independent_consistent');const execution=proof.completion.executions!.at(-1)!;assert.match(execution.command,/-f checker.awk/);const files=Reflect.get(execution,'artifacts')??[],program=files.find((f:any)=>f.path==='checker.awk');assert.ok(program,'the actual executed program is evidence, not just a filename');assert.ok(typeof program.content==='string');assert.equal(createHash('sha256').update(program.content).digest('hex'),program.sha256);assert.match(program.content,/s\+=\$2/);assert.ok(proof.method_completion.resource_reads!.some(r=>r.path.endsWith('/files/checker.awk')&&r.sha256===program.sha256));}
 finally{await workspace.close();}
});

test('PRC01-V005: a method response that did not read the actual program cannot qualify a number',async()=>{
 const provider=postReportProvider({initial:report,fileProgram:true,unreadProgram:true}),{workspace,task}=await checkedWorkspace(provider);
 try{const post=task.report_postprocessing!;assert.equal(task.state,'saved');assert.equal(post.state,'completed',JSON.stringify(post));assert.equal(post.failure_code,null);assert.equal(post.editions[0].numeric_proof!.method_review.claims.length,0);assert.ok(post.editions[0].inventory!.uncovered.some(n=>n.text==='30'));assert.equal(post.editions[0].numbers.some(n=>n.status==='independent_consistent'),false);assert.ok(post.notes.some(n=>n.role==='method'&&n.text.includes('POST_REPORT_METHOD_EVIDENCE_UNREAD')));}
 finally{await workspace.close();}
});

test('PRC01-V005: later file replacement cannot replace executed program evidence; a hardcoded file is not independent computation',async()=>{
 for(const hardcoded of [false,true]){const provider=postReportProvider({initial:report,fileProgram:true,alterProgramAfter:!hardcoded,...(hardcoded?{execution:'hardcoded' as const}:{})}),{workspace,task}=await checkedWorkspace(provider);
  try{const post=task.report_postprocessing!,first=post.editions[0],program=first.numeric_proof!.completion.executions!.at(-1)!.artifacts.find(a=>a.path==='checker.awk')!;assert.equal(post.state,'completed',JSON.stringify(post));assert.ok(typeof program.content==='string');assert.equal(first.numbers[0].status,hardcoded?'unverified':'independent_consistent');assert.equal(program.content.includes('changed after the completed execution'),false);assert.equal(createHash('sha256').update(program.content).digest('hex'),program.sha256);if(!hardcoded)assert.match(program.content,/s\+=\$2/);}
  finally{await workspace.close();}
 }
});

test('PRC01-V004: a classified user-given year is not treated as a missing measured amount or a reason to rewrite the report',async()=>{
 const original=report+'\n\n建议在2027年复核资料。',provider=postReportProvider({initial:original,contextDate:true}),{workspace,task}=await checkedWorkspace(provider,csv,'核对当前资料，并在2027年复核资料；不执行业务行动。');
 try{const post=task.report_postprocessing!,last=post.editions[0];assert.equal(post.state,'completed',JSON.stringify(post));assert.equal(last.numbers[1].status,'unverified','context year does not gain a calculation grade');assert.equal(last.review!.claims[0].eligible,true);assert.equal(last.review!.claims[1].eligible,true,'known user context must not be mistaken for missing measurement evidence');assert.equal(post.revision_attempted,false);}
 finally{await workspace.close();}
});

test('PRC01-V004: an invented context label cannot turn an ungiven number into qualified user context',async()=>{
 const original=report+'\n\n建议在2027年复核资料。',provider=postReportProvider({initial:original,contextDate:true}),{workspace,task}=await checkedWorkspace(provider,csv,'核对当前资料，不执行业务行动。');
 try{const last=task.report_postprocessing!.editions.at(-1)!;assert.equal(task.state,'saved');assert.equal(last.review!.claims[0].eligible,true);assert.equal(last.review!.claims[1].eligible,false,'context exemption requires actual given context, not just a model tag');}
 finally{await workspace.close();}
});

test('PRC01-08: cancel during a dispatched postcheck preserves the saved report, UNKNOWN and full output reservation; reopen does not run or refund',{timeout:15000},async()=>{
 const root=mkdtempSync(join(process.env.JUANERAI_NEWARCH_SHORT_ROOT!,'u-'));let calls=0;let entered!:()=>void;const gate=new Promise<void>(r=>{entered=r;});
 const options={projectRoot:root,project_id:randomUUID(),inspect,credentials:offlineCredentials,analysisModel:'mimo-v2.6-flash' as const,judgmentReview:true,fetch:async(_url:unknown,init?:RequestInit)=>{calls++;if(calls<=2)return offlineResponse(calls,[],calls===1?'合成观察':report);entered();return new Promise<Response>((_resolve,reject)=>{init!.signal!.addEventListener('abort',()=>reject(new DOMException('Aborted','AbortError')),{once:true});});}};
 let workspace=createPersonalOpenAnalysisWorkspace(options);
 try{const task=await workspace.submit({version:'1.0',command_id:randomUUID(),question:'在当前资料范围内分析。',confirmed:true,sources:[{source_id:randomUUID(),display_name:'synthetic.csv',format:'csv',bytes:csv}]});await workspace.start(task.identity.task_id);await gate;assert.equal(workspace.read(task.identity.task_id).state,'saved');await workspace.stop(task.identity.task_id);await workspace.waitForIdle();
  const saved=workspace.read(task.identity.task_id),facts=await workspace.diagnostics(task.identity.task_id);assert.equal(saved.state,'saved');assert.equal(saved.model_report!.text,report);assert.equal(saved.report_postprocessing!.state,'unknown');assert.equal(facts.unconfirmed_effects,true);assert.equal(facts.meter!.unconfirmed_output_tokens,32768);assert.equal(calls,3);await assert.rejects(()=>workspace.resume(task.identity.task_id));
  const {createLocalOpenAnalysisStore}=await import('../../../adapters/storage-local/open-analysis.ts');createLocalOpenAnalysisStore({projectRoot:root}).stop(task.identity.task_id);await workspace.stop(task.identity.task_id);assert.deepEqual(workspace.read(task.identity.task_id),saved,'repeated Stop cannot change the existing UNKNOWN settlement fence');assert.equal((await workspace.diagnostics(task.identity.task_id)).meter!.unconfirmed_output_tokens,32768);assert.equal(calls,3);
  await workspace.close();workspace=createPersonalOpenAnalysisWorkspace(options);assert.equal(workspace.read(task.identity.task_id).report_postprocessing!.state,'unknown');assert.equal((await workspace.diagnostics(task.identity.task_id)).meter!.unconfirmed_output_tokens,32768);assert.equal(calls,3);
 }finally{await workspace.close();}
});

function lastBusinessPrompt(dto:any){
 for(const message of [...dto.messages].reverse())if(message.role==='user'){
  const text=typeof message.content==='string'?message.content:(message.content??[]).filter((p:any)=>p.type==='text').map((p:any)=>p.text).join('\n');
  const match=/JuanerAI\.(report-[\w-]+\.v[12])\n/.exec(text);
  if(match)return {phase:match[1],value:JSON.parse(text.slice(match.index+match[0].length))};
 }
 throw new Error('missing post-report prompt');
}

test('PRC01-02/03/05: real Pi native process recomputes a saved number from original cells; separate full review preserves conditional strategy',async()=>{
 const root=mkdtempSync(join(process.env.JUANERAI_NEWARCH_SHORT_ROOT!,'n-')),source_id=randomUUID(),provider=postReportProvider({initial:report,conditionalStrategy:true});
 const workspace=createPersonalOpenAnalysisWorkspace({projectRoot:root,project_id:randomUUID(),inspect,credentials:offlineCredentials,analysisModel:'mimo-v2.6-flash',judgmentReview:true,fetch:provider.fetch});
 try{
  const task=await workspace.submit({version:'1.0',command_id:randomUUID(),question:'核对当前样本金额；原因不全也先保存报告。',confirmed:true,sources:[{source_id,display_name:'synthetic.csv',format:'csv',bytes:csv}]});
  await workspace.start(task.identity.task_id);await workspace.waitForIdle();const saved=workspace.read(task.identity.task_id),post=saved.report_postprocessing;assert.ok(post);assert.ok(post.editions[0].numeric_proof?.completion.executions?.[0]);assert.ok(post.editions[0].review);
  assert.equal(saved.state,'saved');assert.equal(post.state,'completed',JSON.stringify(post));assert.equal(post.revision_attempted,false);assert.equal(post.editions[0].numbers[0].status,'independent_consistent');assert.equal(post.editions[0].numbers[0].recomputed,'30');assert.equal(post.editions[0].numeric_proof!.completion.executions![0].exit_code,0);assert.match(post.editions[0].numeric_proof!.completion.executions![0].command,/awk/);assert.equal(post.editions[0].review.claims[0].eligible,true);assert.equal(post.editions[0].review.claims[1].eligible,false);assert.equal(saved.model_report?.verification,'not_performed');assert.equal(saved.outcome,null);
  const facts=await workspace.diagnostics(task.identity.task_id);assert.equal(facts.unconfirmed_effects,false);assert.equal(facts.meter?.unconfirmed_output_tokens,0);assert.equal(facts.meter?.model_attempts,provider.calls());assert.ok(provider.calls()>6);assert.equal(hashFiniteJson(saved.source),saved.identity.scope_sha256);
  const visible=Reflect.get(workspace.reportContent(task.identity.task_id)!,'postprocessing');assert.equal(visible?.state,'completed','same public report projection must carry actual post-save qualification');assert.equal(visible.numbers[0].status,'independent_consistent');
  const view=openTaskView({...saved,browser_report:workspace.reportContent(task.identity.task_id)});
  for(const mode of ['quick','pro'] as const){const html=renderQuickAnalysisWorkbench({current:view,tasks:[view],project:'合成项目',mode,expanded:'report',viewMode:'results',resultMode:'report',detail:'evidence',drawer:false});assert.match(html,/数字后核验/);assert.match(html,/独立复算一致/);assert.match(html,/有条件支持/);assert.doesNotMatch(html,/本轮没有本地计算和数字后核验/);}
  const target=workspace.judgmentTarget(task.identity.task_id);assert.equal(target.version,'1.1');const acknowledged=workspace.acknowledge(task.identity.task_id,{...target,version:'1.1',command_id:randomUUID(),value:'acknowledged',comment:'合成用户确认当前报告及当前审查状态，不授权业务行动。'});assert.equal(acknowledged.content_sha256,workspace.reportContent(task.identity.task_id)?.sha256);
  const content=workspace.reportContent(task.identity.task_id)!;await workspace.reportContentCommand(task.identity.task_id,{version:'1.0',command_id:randomUUID(),expected_content_sha256:content.sha256,action:'save',text:content.text+'\n\n新的用户表达；尚未经本版审查。',finding_ids:[]});
  const changed=workspace.reportContent(task.identity.task_id)!;assert.equal(changed.postprocessing?.state,'stale');assert.equal(changed.postprocessing?.numbers[0]?.status,'unverified');assert.equal(changed.postprocessing?.review?.claims[0]?.eligible,false);assert.throws(()=>workspace.acknowledge(task.identity.task_id,{...target,version:'1.1',command_id:randomUUID(),value:'acknowledged',comment:'旧指纹不能认可新内容'}));
 }finally{await workspace.close();}
});


for(const [phase,name] of [['report-postcheck.v1','verify_numbers'],['report-full-review.v1','record_review'],['report-number-method-review.v1','record_method']])test('PS01-03: actual Workspace consumes predeclared individual business tool and readable final text: '+phase,async()=>{
 const provider=postReportProvider({initial:report}),{workspace,task,options}=await checkedWorkspace(provider);
 try{const requests=provider.requests.filter(r=>r.phase===phase);assert.ok(requests.length);assert.ok(requests.every(r=>r.body.tools.some((t:any)=>t.function.name===name)));const schema=requests[0].body.tools.find((t:any)=>t.function.name===name).function.parameters;assert.equal(schema.additionalProperties,false);assert.equal(schema.properties.contract,undefined);assert.equal(schema.properties.start,undefined);assert.equal(schema.properties.report_sha256,undefined);
  const post=task.report_postprocessing!;assert.equal(post.state,'completed',JSON.stringify(post));assert.equal(post.editions[0].numbers[0].status,'independent_consistent');assert.equal(post.editions[0].review!.claims[0].eligible,true);if(name==='verify_numbers')assert.ok(post.notes.some(n=>n.role==='source'&&n.completion.executions?.length));else assert.ok(post.notes.some(n=>n.completion.recorded_values?.some(v=>v.tool_name===name)));const before=provider.calls();await workspace.close();const reopened=createPersonalOpenAnalysisWorkspace(options);try{assert.deepEqual(reopened.read(task.identity.task_id).report_postprocessing,post);assert.equal(provider.calls(),before);}finally{await reopened.close();}
 }finally{await workspace.close();}
});


for(const notation of ['−30','(30)','（30）','− 30','﹣30','－30','30/40','.30','30\u202f000','30 / 2','30*2','30^2','30_000','30 ✖️ 2','30 ➗️ 2','30\u0301','30\u20602','30 \u2060 2','−\uFE0F 30'])test('PRC02-V001: unsupported representation stays whole and cannot certify its positive substring: '+notation,async()=>{
 const initial='金额合计为'+notation+' CNY。\n\n独立参照金额为30 CNY。',provider=postReportProvider({initial,notation});
 const question='核对当前全部样本金额。不执行业务行动。本报告采用财务括号记法，金额圆括号表示负数。',{workspace,task,options}=await checkedWorkspace(provider,csv,question);
 try{const post=task.report_postprocessing!,edition=post.editions[0];assert.equal(post.state,'completed',JSON.stringify(post));assert.equal(edition.text,initial);assert.equal(edition.numbers[0].status,'unverified',JSON.stringify(edition.numbers));assert.ok(edition.numbers[0].reported.includes(notation));assert.equal(edition.numbers[0].recomputed,'30','actual independent result does not certify unsupported report notation');assert.equal(edition.numbers[0].delta,null,'no positive-fragment comparison');assert.equal(edition.review!.claims[0].eligible,false);assert.equal(edition.numbers[1].status,'independent_consistent','unrelated supported number must still really execute');assert.equal(edition.numbers[1].recomputed,'30');assert.equal(edition.review!.claims[1].eligible,true);assert.ok(edition.numeric_proof?.completion.executions?.length);assert.equal(post.revision_attempted,false);
  const view=openTaskView({...task,browser_report:workspace.reportContent(task.identity.task_id)});for(const mode of ['quick','pro'] as const){const html=renderQuickAnalysisWorkbench({current:view,tasks:[view],project:'合成表示法核对',mode,expanded:'report',viewMode:'results',resultMode:'report',detail:'evidence',drawer:false});assert.ok(html.includes(notation));assert.match(html,/未核验/);assert.match(html,/独立复算一致/);}
  const copy=workspace.reportCopy(task.identity.task_id,'1',task.model_report!.outcome_id).bytes.toString();assert.ok(copy.includes(notation));assert.match(copy,/未核验/);const before=provider.calls();await workspace.close();const reopened=createPersonalOpenAnalysisWorkspace(options);try{assert.deepEqual(reopened.read(task.identity.task_id).report_postprocessing,post);assert.equal(provider.calls(),before);}finally{await reopened.close();}
 }finally{await workspace.close();}
});


test('PRC02-V001: report aliases cannot contaminate any blind calculation message',async()=>{
 const provider=postReportProvider({initial:report+'\n\n作者别名 AUTHOR_EXPECTED30、CNY３０、30.0。'});
 const {workspace,task}=await checkedWorkspace(provider);try{assert.equal(task.state,'saved');const blind=provider.requests.filter(r=>r.phase==='report-number-recompute.v1');assert.ok(blind.length);for(const r of blind){assert.equal(lastBusinessPrompt(r.body).value.targets,undefined);assert.ok(!JSON.stringify(r.body.messages).includes('AUTHOR_EXPECTED30'));assert.ok(!JSON.stringify(r.body.messages).includes('CNY３０'));}assert.equal(task.report_postprocessing!.editions[0].numbers[0].status,'independent_consistent');assert.ok(task.report_postprocessing!.editions[0].inventory!.uncovered.length);}finally{await workspace.close();}
});

test('PS01-02/05: child native-file revision is the saved R1, all contexts share one business Task and retain its directories',async()=>{
 const {existsSync}=await import('node:fs');
 const original=report.replace('30','31'),revised=report+'\n\n仅当前样本的修订。',provider=postReportProvider({initial:original,revision:revised,revisionFile:true});
 const {workspace,task,root,options}=await checkedWorkspace(provider);
 try{const post=task.report_postprocessing!;assert.equal(post.state,'completed',JSON.stringify(post));assert.equal(post.editions[1].text,revised);assert.equal(workspace.reportContent(task.identity.task_id)?.text,revised);
  for(const directory of ['010_draw','020_clean','060_reports'])assert.ok(existsSync(join(root,'analyses',task.identity.task_id,directory)),directory);
  assert.equal(new Set(post.notes.map(n=>n.completion.context_id)).size,post.notes.length);assert.ok(post.notes.every(n=>n.completion.context_id));assert.equal(new Set(post.notes.map(n=>n.completion.work_id)).size,1);
  assert.equal((await workspace.diagnostics(task.identity.task_id)).meter!.model_attempts,provider.calls());
  const before=provider.calls();await workspace.close();const reopened=createPersonalOpenAnalysisWorkspace(options);try{assert.equal(reopened.reportContent(task.identity.task_id)?.text,revised);assert.deepEqual(reopened.read(task.identity.task_id).report_postprocessing,post);assert.equal(provider.calls(),before);}finally{await reopened.close();}
 }finally{await workspace.close();}
});

test('PS01-04/05: readable postcheck notes and absent full-review status remain visible in both views and export',async()=>{
 const prose='尚未完成数字核验 <script>synthetic</script>，保留缺口。';let calls=0;
 const provider={fetch:async()=>offlineResponse(++calls,[],calls===1?'合成观察':calls===2?report:prose),requests:[],calls:()=>calls};
 const {workspace,task}=await checkedWorkspace(provider);
 try{assert.equal(task.report_postprocessing!.state,'completed');const view=openTaskView({...task,browser_report:workspace.reportContent(task.identity.task_id)});
  for(const mode of ['quick','pro'] as const){const html=renderQuickAnalysisWorkbench({current:view,tasks:[view],project:'合成后审',mode,expanded:'report',viewMode:'results',resultMode:'report',detail:'evidence',drawer:false});assert.match(html,/核验与审查说明/);assert.match(html,/&lt;script&gt;synthetic&lt;\/script&gt;/);assert.doesNotMatch(html,/<script>synthetic/);assert.match(html,/尚无完成的全文审查判断/);assert.match(html,/未覆盖1处/);}
  const copy=workspace.reportCopy(task.identity.task_id,'1',task.model_report!.outcome_id).bytes.toString();assert.ok(copy.includes(prose));assert.match(copy,/尚无完成的全文审查判断/);assert.equal(calls,3);
 }finally{await workspace.close();}
});


test('PS01-04: uninterpretable actual program output preserves the execution and unverified number while independent text review proceeds',async()=>{
 const provider=postReportProvider({initial:report,malformedOutput:true}),{workspace,task,options}=await checkedWorkspace(provider);
 try{const post=task.report_postprocessing!;assert.equal(post.state,'completed',JSON.stringify(post));const e=post.editions[0];assert.equal(e.numbers[0].status,'unverified');assert.equal(e.numbers[0].recomputed,null);assert.match(e.numbers[0].reason,/实际程序输出/);assert.equal(e.numeric_proof!.completion.executions![0].output,'completed but no result data');assert.ok(e.review);assert.equal(e.review.claims[0].eligible,false);assert.equal(provider.requests.filter(r=>r.phase==='report-number-recompute.v1').length,3,'no host format retry or completed computation replay');const count=provider.calls();await workspace.close();const reopened=createPersonalOpenAnalysisWorkspace(options);try{assert.deepEqual(reopened.read(task.identity.task_id).report_postprocessing,post);assert.equal(provider.calls(),count);}finally{await reopened.close();}
 }finally{await workspace.close();}
});

test('PS01-02/04: Pi can choose independent text review before inventory; missing numeric evidence stays uncovered without a host-selected tool sequence',async()=>{
 let calls=0;const provider={requests:[],calls:()=>calls,fetch:async(_url:unknown,init?:RequestInit)=>{
  calls++;if(calls<=2)return offlineResponse(calls,[],calls===1?'AUTHOR_PRIVATE_CONTEXT_SENTINEL':report);
  const dto=JSON.parse(String(init!.body)),phase=lastBusinessPrompt(dto).phase;
  if(phase==='report-postcheck.v1')return calls===3?offlineResponse(calls,[{name:'review_report',args:{}}]):offlineResponse(calls,[],'仅审查已知逻辑；数字尚未覆盖。');
  assert.equal(phase,'report-full-review.v1');assert.ok(!JSON.stringify(dto.messages).includes('AUTHOR_PRIVATE_CONTEXT_SENTINEL'));assert.equal(dto.tools.some((t:any)=>t.function.name==='verify_numbers'),false,'no recursive delegation or author transcript in isolated reviewer');return offlineResponse(calls,[],'资料不足，无法确认原因；原报告保持可读。');
 }};
 const {workspace,task}=await checkedWorkspace(provider);
 try{assert.equal(calls,5);const e=task.report_postprocessing!.editions[0];assert.equal(task.report_postprocessing!.state,'completed');assert.ok(e.inventory!.uncovered.length);assert.ok(e.review!.uncovered.length);assert.equal(e.numeric_proof,null);assert.equal(task.model_report!.text,report);}finally{await workspace.close();}
});

test('PS01-06: cancel inside a dispatched child retains one shared work reservation and no passive-reopen execution',{timeout:15000},async()=>{
 const base=postReportProvider({initial:report});let calls=0,entered!:()=>void;const ready=new Promise<void>(r=>entered=r);
 const root=mkdtempSync(join(process.env.JUANERAI_NEWARCH_SHORT_ROOT!,'cu-'));
 const options={projectRoot:root,project_id:randomUUID(),inspect,credentials:offlineCredentials,analysisModel:'mimo-v2.6-flash' as const,judgmentReview:true,fetch:async(url:unknown,init?:RequestInit)=>{
  calls++;const dto=JSON.parse(String(init!.body));if(calls>2&&lastBusinessPrompt(dto).phase==='report-number-recompute.v1'){entered();return new Promise<Response>((_resolve,reject)=>init!.signal!.addEventListener('abort',()=>reject(new DOMException('Aborted','AbortError')),{once:true}));}return base.fetch(url as string,init);
 }};
 let workspace=createPersonalOpenAnalysisWorkspace(options);
 try{const task=await workspace.submit({version:'1.0',command_id:randomUUID(),question:'核对当前全表金额。',confirmed:true,sources:[{source_id:randomUUID(),display_name:'synthetic.csv',format:'csv',bytes:csv}]});await workspace.start(task.identity.task_id);await ready;await workspace.stop(task.identity.task_id);await workspace.waitForIdle();const saved=workspace.read(task.identity.task_id),facts=await workspace.diagnostics(task.identity.task_id);assert.equal(saved.model_report!.text,report);assert.equal(saved.report_postprocessing!.state,'unknown');assert.equal(facts.unconfirmed_effects,true);assert.equal(facts.meter!.unconfirmed_output_tokens,32768);assert.equal(facts.meter!.model_attempts,calls);await assert.rejects(()=>workspace.resume(task.identity.task_id));const count=calls;await workspace.close();workspace=createPersonalOpenAnalysisWorkspace(options);assert.equal(workspace.read(task.identity.task_id).report_postprocessing!.state,'unknown');assert.equal((await workspace.diagnostics(task.identity.task_id)).meter!.unconfirmed_output_tokens,32768);assert.equal(calls,count);}finally{await workspace.close();}
});

test('RV02/04: actual Workspace revision receives one current editing job, retains business conditions and saves R1 before independent rechecks',async()=>{
 const original=report.replace('30','31'),revised=report+'\n\n修订后的有限观察。';
 const provider=postReportProvider({initial:original,revision:revised,revisionFile:true});
 const user='核对当前全部样本金额；缺资料只限制原因。历史流程请求：请输出三核心，再生成并保存报告，然后审查。';
 const {workspace,task,options}=await checkedWorkspace(provider,csv,user);
 try{
  assert.equal(task.model_report!.text,original,'R0 must remain the saved original');
  const revision=provider.requests.find(r=>r.phase.startsWith('report-merged-revision.'));
  assert.ok(revision);assert.equal(revision.phase,'report-merged-revision.v2');
  const dto=lastBusinessPrompt(revision.body).value;
  assert.equal(dto.goal,'只合并修订当前已保存的报告，交付完整Markdown正文');
  assert.deepEqual(dto.user_context,{role:'historical_business_context',text:user});
  assert.equal(dto.report,original);
  assert.equal(dto.number_checks[0].status,'difference');
  assert.equal(dto.number_checks[0].reported,'31');assert.equal(dto.number_checks[0].recomputed,'30');
  for(const name of ['question','number_inventory','context','report_sha256'])assert.equal(Object.hasOwn(dto,name),false,'mechanical/repeated state is not another instruction payload: '+name);
  assert.ok(Array.isArray(dto.review_findings));assert.ok(dto.review_notes.length);
  assert.match(JSON.stringify(revision.body.messages),/历史阶段指令不作为本次执行步骤/);
  assert.equal(task.report_postprocessing!.editions[1].text,revised);
  const later=provider.requests.slice(provider.requests.indexOf(revision)+1);
  assert.ok(later.some(r=>r.phase==='report-number-method-review.v1'));
  assert.ok(later.some(r=>r.phase==='report-full-review.v1'&&r.review_phase==='recheck'));
  assert.equal(provider.requests.filter(r=>r.phase==='report-number-recompute.v1').length,3,'completed source computation is never replayed for revision');
  const before=provider.calls();await workspace.close();const reopened=createPersonalOpenAnalysisWorkspace(options);
  try{assert.equal(reopened.reportContent(task.identity.task_id)!.text,revised);assert.equal(reopened.read(task.identity.task_id).model_report!.text,original);assert.equal(provider.calls(),before);}finally{await reopened.close();}
 }finally{await workspace.close();}
});
