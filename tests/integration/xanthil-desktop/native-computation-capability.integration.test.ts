import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync,readdirSync,mkdirSync,writeFileSync,existsSync} from 'node:fs';
import {join,dirname} from 'node:path';
import {randomUUID,createHash} from 'node:crypto';
import {createPiProfessionalAgent} from '../../../adapters/agent-pi/professional-agent.ts';
import {createPersonalOpenAnalysisWorkspace} from '../../../profiles/personal/open-analysis.ts';
import {offlineCredentials,offlineResponse,offlineAnthropicResponse,packet} from '../../fixtures/xanthil-desktop/offline-professional-provider.ts';
import {openTaskView} from '../../../apps/browser/quick-analysis-client.mjs';
import {renderQuickAnalysisWorkbench} from '../../../apps/browser/quick-analysis-workbench.mjs';
import {postReportProvider} from '../../fixtures/xanthil-desktop/report-postprocessing-provider.ts';

test('WS01 first physical DTO declares real protected scopes while lawful author programs execute natively',async()=>{
 const root=mkdtempSync(join(process.env.JUANERAI_NEWARCH_SHORT_ROOT!,'ws-author-')),task=randomUUID(),cwd=join(root,'analyses',task),program=join(cwd,'work','author.js');let calls=0,system='';
 const agent=createPiProfessionalAgent({projectRoot:root,analysisModel:'mimo-v2.6-flash',credentials:offlineCredentials,authorizeWork:()=>true,fetch:async(_url,init)=>{
  const dto=JSON.parse(String(init!.body));calls++;
  if(calls===1){system=JSON.stringify(dto.messages.filter((m:any)=>m.role==='system'||m.role==='developer'));return offlineResponse(calls,[{name:'write',args:{path:program,content:'console.log("actual-scope-output");'}}]);}
  if(calls===2)return offlineResponse(calls,[{name:'bash',args:{command:'node '+JSON.stringify(program)}}]);
  assert.match(JSON.stringify(dto.messages),/actual-scope-output/);return offlineResponse(calls,[],'作者程序已在自己的工作区执行，这不是独立核验。');
 }});
 const identity={task_id:task,revision:'1',run_id:randomUUID(),attempt_id:randomUUID(),operation_id:randomUUID(),grant_id:randomUUID(),scope_sha256:'a'.repeat(64),config_sha256:await agent.configuration()};
 const result=await agent.advance({identity,command_id:randomUUID(),purpose:'analysis',prompt:'在已授权工作区自行编程分析。',system:'合成合同检查；作者不得写入独立核验工作区。',materials:[],capabilities:async()=>[],authorize:()=>true,signal:new AbortController().signal});
 await agent.waitForIdle();await agent.assertCompleted(identity,result.completion);assert.equal(calls,3);assert.equal(result.completion.executions?.[0]?.output,'actual-scope-output\n');
 assert.equal((await agent.diagnostics(identity)).unconfirmed_effects,false);
 for(const path of ['010_draw','020_clean/source','020_clean/metric-asset','020_clean/independent'])assert.ok(system.includes(join(cwd,path)),'first physical DTO must declare actual protection: '+path);
});

test('WS02 author write into protected independent namespace stays a hard refusal, never an independent result',async()=>{
 const root=mkdtempSync(join(process.env.JUANERAI_NEWARCH_SHORT_ROOT!,'ws-protected-')),task=randomUUID(),cwd=join(root,'analyses',task),target=join(cwd,'020_clean/independent/recalc.js');mkdirSync(dirname(target),{recursive:true});let calls=0;
 const agent=createPiProfessionalAgent({projectRoot:root,analysisModel:'mimo-v2.6-flash',credentials:offlineCredentials,authorizeWork:()=>true,fetch:async()=>{assert.equal(++calls,1,'a protected write cannot get a corrective resend');return offlineResponse(calls,[{name:'write',args:{path:target,content:'author-created program'}}]);}});
 const identity={task_id:task,revision:'1',run_id:randomUUID(),attempt_id:randomUUID(),operation_id:randomUUID(),grant_id:randomUUID(),scope_sha256:'a'.repeat(64),config_sha256:await agent.configuration()};
 await assert.rejects(()=>agent.advance({identity,command_id:randomUUID(),purpose:'analysis',prompt:'Only synthetic access-scope counterexample.',system:'No independent qualification or widened authority.',materials:[],capabilities:async()=>[],authorize:()=>true,signal:new AbortController().signal}));await agent.waitForIdle();
 const facts=await agent.diagnostics(identity),write=facts.observations.find(o=>o.kind==='tool'&&o.name==='write');
 assert.equal(calls,1);assert.equal(existsSync(target),false);assert.equal(write?.kind==='tool'&&write.file_failure_category,'permission_denied');assert.equal(write?.kind==='tool'&&write.completion,'unknown');assert.equal(facts.unconfirmed_effects,true);assert.equal(facts.meter?.unconfirmed_output_tokens,0);
});

test('NC01/07: normal Workspace main Agent really computes, independent child recomputes blindly, then report/review persist and reopen',async()=>{
 const root=mkdtempSync(join(process.env.JUANERAI_NEWARCH_SHORT_ROOT!,'nc-workspace-'));
 const bytes=Buffer.from('id,amount\na,11\nb,19\n'),source_id=randomUUID(),sha256=createHash('sha256').update(bytes).digest('hex');
 const provider=postReportProvider({initial:'# 本次样本\n\n金额合计为30 CNY。\n\n原因未知，建议补证。',fileProgram:true});
 let taskRoot='',taskId='',mainStep=0,savedBeforePost=false,calls=0;
 const options={projectRoot:root,analysisModel:'mimo-v2.6-flash' as const,judgmentReview:true,credentials:offlineCredentials,
  inspect:async()=>({version:'1.0' as const,sources:[{source_id,display_name:'source.csv',format:'csv' as const,sha256,byte_length:String(bytes.length),sheets:[{sheet_id:'csv',name:'CSV',state:'visible' as const,rows:[['id','amount'],['a','11'],['b','19']].map((values,i)=>({row:i+1,cells:values.map((value,c)=>({column:String.fromCharCode(65+c),value,type:'string' as const}))}))}]}]}),
  fetch:(async(url,init)=>{
   calls++;const dto=JSON.parse(String(init!.body));
   if(mainStep<3){
    console.log(JSON.stringify({checkpoint:'main-tool-view',names:dto.tools.map((t:any)=>t.function.name)}));
    assert.ok(dto.tools.some((t:any)=>t.function.name==='bash'),'main Agent must have the same real native computation capability');
    const program=join(taskRoot,'020_clean','work','author.js'),path=join(taskRoot,'020_clean/source',source_id,sha256,'sheet/csv/table.txt');
    if(mainStep++===0)return offlineResponse(calls,[{name:'write',args:{path:program,content:'// AUTHOR_ONLY_PROGRAM\nconst fs=require("fs");const rows=fs.readFileSync('+JSON.stringify(path)+',"utf8").trim().split("\\n").map(JSON.parse);console.log(rows.filter(r=>r.row>1).reduce((a,r)=>a+Number(r.cells.find(c=>c.column==="B").value),0));'}}]);
    if(mainStep===2)return offlineResponse(calls,[{name:'bash',args:{command:'node '+JSON.stringify(program)}}]);
    assert.ok(JSON.stringify(dto.messages).includes('30'),'actual source calculation must have reached the main Agent');
   }
   const source=packet(dto,'JuanerAI.report-number-recompute.v1');
   if(source){assert.ok(!JSON.stringify(dto.messages).includes('AUTHOR_ONLY_PROGRAM'));assert.ok(!JSON.stringify(dto.messages).includes('金额合计为30'),'independent source must not receive report answer');}
   if(provider.calls()===2){
    const r0=app.read(taskId);assert.equal(r0.state,'saved');assert.notEqual(r0.report_postprocessing?.state,'completed');
    const view=openTaskView({...r0,browser_report:app.reportContent(taskId),operation_active:app.operationActive(taskId)});
    for(const mode of ['quick','pro'] as const){
     const html=renderQuickAnalysisWorkbench({current:view,tasks:[view],project:'前台计算合成验收',mode,expanded:'report',viewMode:'results',resultMode:'report',detail:'evidence',drawer:false});
     assert.ok(html.includes('数字后核验中')||html.includes('结论与策略审查中'));assert.ok(!html.includes('本轮后处理已完成'));
    }
    savedBeforePost=true;
   }
   return provider.fetch(url,init);
  }) as typeof globalThis.fetch};
 const app=createPersonalOpenAnalysisWorkspace(options);
 let saved:ReturnType<typeof app.read>|undefined,meter:unknown;
 try{
  const task=await app.submit({version:'1.0',command_id:randomUUID(),question:'统计当前CSV金额合计，CNY，无原因时只保留有限观察，不执行现实行动。',confirmed:true,sources:[{source_id,display_name:'source.csv',format:'csv',bytes}]});
  taskId=task.identity.task_id;taskRoot=join(root,'analyses',taskId);await app.start(taskId);await app.waitForIdle();saved=app.read(taskId);
  console.log(JSON.stringify({case:'NC01/07',calls,mainStep,state:saved.state,post:saved.report_postprocessing?.state,facts:await app.diagnostics(taskId)}));
  assert.equal(saved.state,'saved');assert.equal(savedBeforePost,true);assert.equal(saved.report_postprocessing?.state,'completed');
  assert.equal(saved.report_postprocessing!.editions[0]!.numbers[0]!.status,'independent_consistent');
  const proofRoot=join(root,'.juanerai/post-report-executions');
  const proofs=readdirSync(proofRoot).map(n=>JSON.parse(readFileSync(join(proofRoot,n),'utf8')));
  const main=proofs.find(p=>p.completion.purpose==='analysis'&&!p.completion.computation_context);
  assert.ok(main?.completion.executions.some((e:any)=>e.exit_code===0&&e.output==='30\n'),'main actual execution is durably recorded');
  const independent=saved.report_postprocessing!.editions[0]!.numeric_proof!.completion;
  assert.equal(independent.computation_context!.role,'independent_source');assert.ok(independent.executions!.every(e=>e.artifacts.every(a=>!a.content?.includes('AUTHOR_ONLY_PROGRAM'))));
  const facts=await app.diagnostics(taskId);assert.equal(facts.unconfirmed_effects,false);meter=facts.meter;
 }finally{await app.close();}
 const count=calls,reopened=createPersonalOpenAnalysisWorkspace({...options,fetch:async()=>assert.fail('passive reopen must not execute')});
 try{assert.deepEqual(reopened.read(taskId),saved);assert.deepEqual((await reopened.diagnostics(taskId)).meter,meter);assert.equal(await reopened.physicalPending(),false);assert.equal(calls,count);}finally{await reopened.close();}
});

for(const purpose of ['analysis','desktop_draft','membership','retained_case'] as const)test('NC01 shared native computation is available to '+purpose,async()=>{
 const {createPiProfessionalAgent}=await import('../../../adapters/agent-pi/professional-agent.ts');
 const root=mkdtempSync(join(process.env.JUANERAI_NEWARCH_SHORT_ROOT!,'nc-role-')),task=randomUUID(),path=join(root,'analyses',task,'020_clean/source/input.csv');
 let calls=0;
 const agent=createPiProfessionalAgent({projectRoot:root,analysisModel:'mimo-v2.6-flash',credentials:offlineCredentials,authorizeWork:()=>true,fetch:async(_url,init)=>{
  const dto=JSON.parse(String(init!.body));calls++;
  assert.ok(dto.tools.some((tool:any)=>tool.function.name==='bash'));
  if(calls===1)return offlineResponse(calls,[{name:'bash',args:{command:"/bin/cat "+JSON.stringify(path)+" | /usr/bin/awk -F, 'NR>1{s+=$2}END{print s}'"}}]);
  assert.ok(dto.messages.some((message:any)=>message.role==='tool'&&JSON.stringify(message.content).includes('24')));
  return offlineResponse(calls,[],'实际前台计算已完成；这不是独立核验。');
 }});
 const identity={task_id:task,revision:'1',run_id:randomUUID(),attempt_id:randomUUID(),operation_id:randomUUID(),grant_id:randomUUID(),scope_sha256:'a'.repeat(64),config_sha256:await agent.configuration()};
 const result=await agent.advance({identity,command_id:randomUUID(),purpose,prompt:'根据当前获准资料自主计算。',system:'合成业务资料；只做前台计算。',materials:[{path,content:'item,amount\nx,7\ny,17\n'}],capabilities:async()=>[],authorize:()=>true,signal:new AbortController().signal});
 await agent.waitForIdle();await agent.assertCompleted(identity,result.completion);
 assert.equal(calls,2);assert.equal(result.completion.executions?.length,1);assert.equal(result.completion.executions![0]!.output,'24\n');assert.equal(result.completion.executions![0]!.exit_code,0);
 assert.equal((await agent.diagnostics(identity,purpose)).unconfirmed_effects,false);
});

test('NC07 R0 metadata preserves unverified status without a fixed claim that author local computation never happened',async()=>{
 const root=mkdtempSync(join(process.env.JUANERAI_NEWARCH_SHORT_ROOT!,'nc-meta-'));let calls=0;
 const app=createPersonalOpenAnalysisWorkspace({projectRoot:root,analysisModel:'mimo-v2.6-flash',judgmentReview:false,credentials:offlineCredentials,inspect:async()=>({version:'1.0',sources:[]}),fetch:async()=>offlineResponse(++calls,[],calls===1?'当前无资料，只能保留问题及缺口。':'# 当前限制\n\n尚无资料，数字与结论未独立核验。')});
 try{
  const task=await app.submit({version:'1.0',command_id:randomUUID(),question:'资料不全时保留已知条件和待补证方向。',confirmed:true,sources:[]});await app.start(task.identity.task_id);await app.waitForIdle();
  const saved=app.read(task.identity.task_id);assert.equal(saved.state,'saved');assert.equal(calls,2);
  assert.equal(saved.model_report!.version,'1.1');assert.equal(saved.model_report!.verification,'not_performed');
  assert.equal(Object.hasOwn(saved.model_report!,'calculation'),false);assert.equal(Object.hasOwn(saved.model_report!.contract.execution,'local_calculation'),false);
 }finally{await app.close();}
});

test('NC04 settled native nonzero exit reaches the same Agent with its completed effect and exact reason',async()=>{
 const {createPiProfessionalAgent}=await import('../../../adapters/agent-pi/professional-agent.ts');
 const root=mkdtempSync(join(process.env.JUANERAI_NEWARCH_SHORT_ROOT!,'nc-nonzero-')),task=randomUUID();let calls=0;
 const agent=createPiProfessionalAgent({projectRoot:root,analysisModel:'mimo-v2.6-flash',credentials:offlineCredentials,authorizeWork:()=>true,fetch:async(_url,init)=>{
  const dto=JSON.parse(String(init!.body));calls++;
  if(calls===1)return offlineResponse(calls,[{name:'bash',args:{command:"printf intentional-native-failure; exit 7"}}]);
  assert.match(JSON.stringify(dto.messages),/intentional-native-failure/);assert.match(JSON.stringify(dto.messages),/7/);
  return offlineResponse(calls,[],'The command actually ran and exited 7; retain the failure and choose no further effect.');
 }});
 const identity={task_id:task,revision:'1',run_id:randomUUID(),attempt_id:randomUUID(),operation_id:randomUUID(),grant_id:randomUUID(),scope_sha256:'a'.repeat(64),config_sha256:await agent.configuration()};
 const result=await agent.advance({identity,command_id:randomUUID(),purpose:'analysis',prompt:'Use the authorized foreground command and read its actual result.',system:'Synthetic native failure evidence.',materials:[],capabilities:async()=>[],authorize:()=>true,signal:new AbortController().signal});
 await agent.waitForIdle();await agent.assertCompleted(identity,result.completion);
 assert.equal(calls,2);assert.equal(result.completion.executions?.length,1);assert.equal(result.completion.executions![0]!.exit_code,7);assert.equal(result.completion.executions![0]!.output,'intentional-native-failure');
 const facts=await agent.diagnostics(identity,'analysis'),out=facts.observations.find(o=>o.kind==='tool'&&o.name==='bash');
 assert.equal(facts.unconfirmed_effects,false);assert.equal(out?.kind==='tool'&&out.completion,'completed');assert.equal(out?.kind==='tool'&&out.delivery,'failed');
});

const sh=(s:string)=>"'"+s.replaceAll("'", "'\\''")+"'";
for(const purpose of ['analysis','conclusion_strategy_review'] as const)test('PC01 actual '+purpose+' read of its Task root corrects natively without permission failure',async()=>{
 const root=mkdtempSync(join(process.env.JUANERAI_NEWARCH_SHORT_ROOT!,'pc-root-')),task=randomUUID(),cwd=join(root,'analyses',task),path=join(cwd,'020_clean/source/approved/v1/table.txt');let calls=0;
 const agent=createPiProfessionalAgent({projectRoot:root,analysisModel:'mimo-v2.6-flash',credentials:offlineCredentials,authorizeWork:()=>true,fetch:async(_url,init)=>{
  const dto=JSON.parse(String(init!.body));calls++;
  if(calls===1)return offlineResponse(calls,[{name:'read',args:{path:cwd}}]);
  if(calls===2){assert.match(JSON.stringify(dto.messages),/is_directory/);return offlineResponse(calls,[{name:'read',args:{path}}]);}
  assert.ok(JSON.stringify(dto.messages).includes('approved source'));return offlineResponse(calls,[],'保留实际原生目录反馈；已读取获准文件。');
 }});
 const identity={task_id:task,revision:'1',run_id:randomUUID(),attempt_id:randomUUID(),operation_id:randomUUID(),grant_id:randomUUID(),scope_sha256:'a'.repeat(64),config_sha256:await agent.configuration()};
 const result=await agent.advance({identity,command_id:randomUUID(),purpose,prompt:'使用当前获准资料。',system:'目录不等于文件；不授予越界操作。',materials:[{path,content:'approved source'}],capabilities:async()=>[],authorize:()=>true,signal:new AbortController().signal});
 await agent.waitForIdle();await agent.assertCompleted(identity,result.completion);assert.equal(calls,3);assert.equal((await agent.diagnostics(identity,purpose)).unconfirmed_effects,false);
});
test('PC01 normal Workspace corrects a review directory read then completes real independent computation/review/save/reopen',async()=>{
 const root=mkdtempSync(join(process.env.JUANERAI_NEWARCH_SHORT_ROOT!,'pc-workspace-')),source_id=randomUUID(),bytes=Buffer.from('id,amount\na,11\nb,19\n'),sha256=createHash('sha256').update(bytes).digest('hex');
 const provider=postReportProvider({initial:'# 当前样本\n\n金额合计为30 CNY。\n\n原因未知，仅建议补证。',fileProgram:true});let taskId='',directoryRead=false,calls=0;
 const options={projectRoot:root,analysisModel:'mimo-v2.6-flash' as const,judgmentReview:true,credentials:offlineCredentials,
  inspect:async()=>({version:'1.0' as const,sources:[{source_id,display_name:'source.csv',format:'csv' as const,sha256,byte_length:String(bytes.length),sheets:[{sheet_id:'csv',name:'CSV',state:'visible' as const,rows:[['id','amount'],['a','11'],['b','19']].map((values,i)=>({row:i+1,cells:values.map((value,c)=>({column:String.fromCharCode(65+c),value,type:'string' as const}))}))}]}]}),
  fetch:(async(url,init)=>{calls++;const dto=JSON.parse(String(init!.body));
   if(!directoryRead&&packet(dto,'JuanerAI.report-full-review.v1')){directoryRead=true;return offlineResponse(1000,[{name:'read',args:{path:join(root,'analyses',taskId)}}]);}
   return provider.fetch(url,init);
  }) as typeof globalThis.fetch};
 const app=createPersonalOpenAnalysisWorkspace(options);let saved:ReturnType<typeof app.read>,meter:unknown;
 try{
  const task=await app.submit({version:'1.0',command_id:randomUUID(),question:'计算当前获准CSV金额合计，单位CNY。资料缺项只保留限制，不执行业务行动。',confirmed:true,sources:[{source_id,display_name:'source.csv',format:'csv',bytes}]});taskId=task.identity.task_id;
  await app.start(taskId);await app.waitForIdle();saved=app.read(taskId);const facts=await app.diagnostics(taskId);
  assert.equal(directoryRead,true);assert.equal(saved.state,'saved');assert.equal(saved.report_postprocessing?.state,'completed');assert.equal(saved.report_postprocessing!.editions[0]!.numbers[0]!.status,'independent_consistent');
  assert.equal(facts.unconfirmed_effects,false);meter=facts.meter;
  console.log(JSON.stringify({case:'PC01-Workspace',calls,state:saved.state,post:saved.report_postprocessing?.state,meter}));
 }finally{await app.close();}
 const before=calls,reopened=createPersonalOpenAnalysisWorkspace({...options,fetch:async()=>assert.fail('passive reopen cannot send')});
 try{assert.deepEqual(reopened.read(taskId),saved!);assert.deepEqual((await reopened.diagnostics(taskId)).meter,meter);assert.equal(calls,before);assert.equal(await reopened.physicalPending(),false);}finally{await reopened.close();}
});
test('OS01/02 first request declares the actual output scope and native temporary files remain in that Task',async()=>{
 const root=mkdtempSync(join(process.env.JUANERAI_NEWARCH_SHORT_ROOT!,'os-output-')),task=randomUUID(),cwd=join(root,'analyses',task);let calls=0,declared=false;
 const command='python3 - <<\'PY\'\nimport json,os,tempfile\nfrom pathlib import Path\nwith tempfile.NamedTemporaryFile(prefix="number-check-",delete=False) as f:\n f.write(b"temporary-result")\n path=f.name\nnote=Path.cwd()/"verification-notes.md"\nnote.write_text("# Calculation notes\\n")\nprint(json.dumps({"cwd":str(Path.cwd()),"tmpdir":os.environ["TMPDIR"],"temporary":path,"notes":str(note),"contents":Path(path).read_text()}))\nPY';
 const agent=createPiProfessionalAgent({projectRoot:root,analysisModel:'mimo-v2.6-flash',credentials:offlineCredentials,authorizeWork:()=>true,fetch:async(_url,init)=>{
  const dto=JSON.parse(String(init!.body));calls++;
  if(calls===1){const system=JSON.stringify(dto.messages.filter((m:any)=>m.role==='system'||m.role==='developer'));declared=system.includes('获准输出工作区：'+cwd)&&system.includes('TMPDIR')&&system.includes('临时文件')&&system.includes('当前工具');return offlineResponse(calls,[{name:'bash',args:{command}}]);}
  return offlineResponse(calls,[],'工作区内计算笔记及临时文件已写入，以实际回执为准。');
 }});
 const identity={task_id:task,revision:'1',run_id:randomUUID(),attempt_id:randomUUID(),operation_id:randomUUID(),grant_id:randomUUID(),scope_sha256:'a'.repeat(64),config_sha256:await agent.configuration()};
 const result=await agent.advance({identity,command_id:randomUUID(),purpose:'analysis',prompt:'在当前获准范围形成计算笔记和临时结果。',system:'只有合成资料，不授予Task外写入。',materials:[],capabilities:async()=>[],authorize:()=>true,signal:new AbortController().signal});
 await agent.waitForIdle();await agent.assertCompleted(identity,result.completion);
 const execution=result.completion.executions![0]!,actual=JSON.parse(execution.output);
 assert.equal(execution.exit_code,0);assert.equal(actual.cwd,cwd);assert.equal(actual.tmpdir,cwd);assert.equal(dirname(actual.temporary),cwd);assert.equal(dirname(actual.notes),cwd);assert.equal(actual.contents,'temporary-result');
 console.log(JSON.stringify({case:'OS01/02',declared,actual}));
 assert.equal(declared,true,'the first physical DTO must carry the complete actual output/TMPDIR contract, before the model chooses file paths');
});
for(const [label,purpose,role] of [
 ['analysis','analysis',undefined],['requirements','requirement_design',undefined],['report','report_edit',undefined],['review','conclusion_strategy_review',undefined],
 ['membership','membership',undefined],['desktop','desktop_draft',undefined],['case','retained_case',undefined],
 ['blind-source','analysis','independent_source'],['method-review','analysis','method_review'],
] as const)test('OS01 common output contract reaches the actual first DTO for '+label,async()=>{
 const root=mkdtempSync(join(process.env.JUANERAI_NEWARCH_SHORT_ROOT!,'os-purpose-')),task=randomUUID(),subject=randomUUID(),cwd=join(root,'analyses',task,...(role?['020_clean','independent',subject,role]:[]));
 let calls=0,received='';
 const agent=createPiProfessionalAgent({projectRoot:root,analysisModel:'mimo-v2.6-flash',credentials:offlineCredentials,businessPolicy:{judgmentReview:true,metricDisclosure:false,postReportReview:true},authorizeWork:()=>true,fetch:async(_url,init)=>{
  const dto=JSON.parse(String(init!.body));calls++;received=JSON.stringify(dto.messages.filter((m:any)=>m.role==='system'||m.role==='developer'));
  const names=dto.tools.map((t:any)=>t.function.name),readOnly=purpose==='requirement_design'||purpose==='conclusion_strategy_review'||role==='method_review';
  if(readOnly){assert.deepEqual(names,['read'],'a path declaration cannot grant write or Bash');}
  else if(purpose==='report_edit'){assert.ok(names.includes('write')&&names.includes('edit'));assert.ok(!names.includes('bash'));}
  else assert.ok(names.includes('bash'));
  return offlineResponse(calls,[],'# 本次有限输出\n\n仅当前合成条件，不提升核验资格。');
 }});
 const identity={task_id:task,revision:'1',run_id:randomUUID(),attempt_id:randomUUID(),operation_id:randomUUID(),grant_id:randomUUID(),scope_sha256:'a'.repeat(64),config_sha256:await agent.configuration()};
 const result=await agent.advance({identity,command_id:randomUUID(),purpose,prompt:'只使用当前获准能力。',system:'不开放其他Task、原始资料或网络。',...(role?{computation_context:{computation_id:subject,role}}:{}),materials:[],capabilities:async()=>[],authorize:()=>true,signal:new AbortController().signal});
 await agent.waitForIdle();await agent.assertCompleted(identity,result.completion);
 assert.equal(calls,1);assert.ok(received.includes('获准输出工作区：'+cwd));assert.ok(received.includes('临时文件')&&received.includes('TMPDIR')&&received.includes('当前工具'));
 assert.ok(received.includes('不授予写入、Shell或网络权限'));
 for(const suffix of ['010_draw','020_clean/source','020_clean/metric-asset','020_clean/independent'])assert.ok(received.includes(join(cwd,suffix)),'WS03 every actual role sees its own exact protection, without another role root');
});
test('OS01 common workspace contract reaches the actual Anthropic DTO',async()=>{
 const root=mkdtempSync(join(process.env.JUANERAI_NEWARCH_SHORT_ROOT!,'os-anthropic-')),task=randomUUID(),cwd=join(root,'analyses',task);let calls=0,system='';
 const agent=createPiProfessionalAgent({projectRoot:root,analysisModel:'MiniMax-M3',credentials:offlineCredentials,authorizeWork:()=>true,fetch:async(_url,init)=>{
  const dto=JSON.parse(String(init!.body));system=JSON.stringify(dto.system);return offlineAnthropicResponse(++calls,undefined,'当前范围内输出；无真实业务行动。');
 }});
 const identity={task_id:task,revision:'1',run_id:randomUUID(),attempt_id:randomUUID(),operation_id:randomUUID(),grant_id:randomUUID(),scope_sha256:'a'.repeat(64),config_sha256:await agent.configuration()};
 const result=await agent.advance({identity,command_id:randomUUID(),purpose:'analysis',prompt:'只使用当前获准能力。',system:'合成资料。',materials:[],capabilities:async()=>[],authorize:()=>true,signal:new AbortController().signal});
 await agent.waitForIdle();await agent.assertCompleted(identity,result.completion);assert.equal(calls,1);assert.ok(system.includes('获准输出工作区：'+cwd)&&system.includes('TMPDIR'));for(const suffix of ['010_draw','020_clean/source','020_clean/metric-asset','020_clean/independent'])assert.ok(system.includes(join(cwd,suffix)),'WS03 actual Anthropic DTO carries the same exact boundaries');
});
test('OS02/03 independent child uses its own native temp space and cannot write global temp, author space or another Task',async()=>{
 const root=mkdtempSync(join(process.env.JUANERAI_NEWARCH_SHORT_ROOT!,'os-child-')),task=randomUUID(),subject=randomUUID(),parent=join(root,'analyses',task),cwd=join(parent,'020_clean','independent',subject,'independent_source');
 const outside='/tmp/juanerai-output-scope-'+randomUUID()+'.md',author=join(parent,'060_reports','child-must-not-write.md'),other=join(root,'analyses',randomUUID(),'not-granted.md');
 mkdirSync(dirname(author),{recursive:true});mkdirSync(dirname(other),{recursive:true});
 const command='node -e '+sh('const fs=require("fs"),path=require("path"),os=require("os");const p=path.join(os.tmpdir(),"node-temporary.txt");fs.writeFileSync(p,"node-temporary");console.log(JSON.stringify({nodeTemporary:p,content:fs.readFileSync(p,"utf8")}));')+' && python3 - <<\'PY\'\nimport json,os,tempfile\nfrom pathlib import Path\nwith tempfile.NamedTemporaryFile(prefix="recompute-",delete=False) as f:\n f.write(b"child-temporary")\n temporary=f.name\nnote=Path.cwd()/"verification-notes.md"\nnote.write_text("# Independent notes\\n")\ndenied=[]\nfor p in '+JSON.stringify([outside,author,other])+':\n try:\n  Path(p).write_text("MUST_NOT_ESCAPE")\n  raise RuntimeError("UNAUTHORIZED_WRITE_SUCCEEDED")\n except PermissionError:\n  denied.append(p)\nprint(json.dumps({"cwd":str(Path.cwd()),"tmpdir":os.environ["TMPDIR"],"temporary":temporary,"contents":Path(temporary).read_text(),"notes":str(note),"denied":denied}))\nPY';
 let calls=0;
 const agent=createPiProfessionalAgent({projectRoot:root,analysisModel:'mimo-v2.6-flash',credentials:offlineCredentials,businessPolicy:{judgmentReview:true,metricDisclosure:false,postReportReview:true},authorizeWork:()=>true,fetch:async(_url,init)=>{
  const dto=JSON.parse(String(init!.body));calls++;
  if(calls===1){assert.ok(JSON.stringify(dto.messages).includes('获准输出工作区：'+cwd));return offlineResponse(calls,[{name:'bash',args:{command}}]);}
  return offlineResponse(calls,[],'临时文件和笔记已保存在当前独立工作区，越界目标未写入。');
 }});
 const identity={task_id:task,revision:'1',run_id:randomUUID(),attempt_id:randomUUID(),operation_id:randomUUID(),grant_id:randomUUID(),scope_sha256:'a'.repeat(64),config_sha256:await agent.configuration()};
 const result=await agent.advance({identity,command_id:randomUUID(),purpose:'analysis',computation_context:{computation_id:subject,role:'independent_source'},prompt:'在独立范围内形成核验笔记；本例越界写仅用来证明拒绝。',system:'只允许当前子工作区。',materials:[],capabilities:async()=>[],authorize:()=>true,signal:new AbortController().signal});
 await agent.waitForIdle();await agent.assertCompleted(identity,result.completion);
 const execution=result.completion.executions![0]!,[node,python]=execution.output.trim().split('\n').map(s=>JSON.parse(s));
 assert.equal(execution.exit_code,0);assert.equal(dirname(node.nodeTemporary),cwd);assert.equal(node.content,'node-temporary');assert.equal(python.cwd,cwd);assert.equal(python.tmpdir,cwd);assert.equal(dirname(python.temporary),cwd);assert.equal(dirname(python.notes),cwd);assert.equal(python.contents,'child-temporary');assert.deepEqual(python.denied,[outside,author,other]);
 for(const path of [outside,author,other])assert.equal(existsSync(path),false);
 assert.equal((await agent.diagnostics(identity,'analysis')).unconfirmed_effects,false);
 console.log(JSON.stringify({case:'OS02/03',node,python}));
});
test('TC01 approved clean hierarchy can be listed and consumed by a real main-Agent program',async()=>{
 const root=mkdtempSync(join(process.env.JUANERAI_NEWARCH_SHORT_ROOT!,'tc-clean-')),task=randomUUID();
 const cwd=join(root,'analyses',task),file=join(cwd,'020_clean/source','approved-source','fixed-version','sheet/csv/table.csv');
 let calls=0;
 const command='/bin/ls -la '+sh(join(cwd,'020_clean'))+' && /bin/ls -la '+sh(dirname(file))+' && python3 - <<\'PY\'\nimport csv\nwith open('+JSON.stringify(file)+') as f:\n rows=list(csv.DictReader(f))\nprint("computed="+str(sum(int(r["amount"]) for r in rows)))\nPY';
 const agent=createPiProfessionalAgent({projectRoot:root,analysisModel:'mimo-v2.6-flash',credentials:offlineCredentials,authorizeWork:()=>true,fetch:async()=>{
  calls++;return calls===1?offlineResponse(calls,[{name:'bash',args:{command}}]):offlineResponse(calls,[],'已取得命令回执；计算与错误以实际执行记录为准。');
 }});
 const identity={task_id:task,revision:'1',run_id:randomUUID(),attempt_id:randomUUID(),operation_id:randomUUID(),grant_id:randomUUID(),scope_sha256:'a'.repeat(64),config_sha256:await agent.configuration()};
 try{
  const result=await agent.advance({identity,command_id:randomUUID(),purpose:'analysis',prompt:'在当前获准资料上运行前台本地计算。',system:'只有已批准的合成资料。',materials:[{path:file,content:'id,amount\na,7\nb,17\n'}],capabilities:async()=>[],authorize:()=>true,signal:new AbortController().signal});
  await agent.waitForIdle();await agent.assertCompleted(identity,result.completion);
  const fact=result.completion.executions?.[0];
  console.log(JSON.stringify({case:'TC01',calls,execution:fact}));
  assert.equal(fact?.exit_code,0,'ordinary approved directory inspection must not block computation');
  assert.match(fact!.output,/computed=24/);
  assert.equal((await agent.diagnostics(identity,'analysis')).unconfirmed_effects,false);
 }finally{await agent.waitForIdle();}
});

test('TC02 Task directory metadata works without granting raw payload or other-task access',async()=>{
 const root=mkdtempSync(join(process.env.JUANERAI_NEWARCH_SHORT_ROOT!,'tc-task-')),task=randomUUID(),cwd=join(root,'analyses',task);
 const raw=join(cwd,'010_draw','source-id','raw.csv'),other=join(root,'analyses',randomUUID(),'secret.txt');
 mkdirSync(dirname(raw),{recursive:true});writeFileSync(raw,'RAW_NOT_GRANTED\n');mkdirSync(dirname(other),{recursive:true});writeFileSync(other,'OTHER_TASK_NOT_GRANTED\n');
 let calls=0;
 const command='/bin/ls -la '+sh(cwd)+' && python3 - <<\'PY\'\nfrom pathlib import Path\nfor p in ['+JSON.stringify(raw)+','+JSON.stringify(other)+']:\n try:\n  Path(p).read_text()\n  raise RuntimeError("UNAUTHORIZED_CONTENT_READ")\n except PermissionError:\n  pass\nprint("task-metadata-ok;raw-and-other-denied")\nPY';
 const agent=createPiProfessionalAgent({projectRoot:root,analysisModel:'mimo-v2.6-flash',credentials:offlineCredentials,authorizeWork:()=>true,fetch:async()=>{
  calls++;return calls===1?offlineResponse(calls,[{name:'bash',args:{command}}]):offlineResponse(calls,[],'回执保留，不提升业务核验资格。');
 }});
 const identity={task_id:task,revision:'1',run_id:randomUUID(),attempt_id:randomUUID(),operation_id:randomUUID(),grant_id:randomUUID(),scope_sha256:'a'.repeat(64),config_sha256:await agent.configuration()};
 const result=await agent.advance({identity,command_id:randomUUID(),purpose:'analysis',prompt:'检查已批准Task的正常本地计算范围。',system:'原始资料及其他Task不授权。',materials:[],capabilities:async()=>[],authorize:()=>true,signal:new AbortController().signal});
 await agent.waitForIdle();await agent.assertCompleted(identity,result.completion);
 const fact=result.completion.executions?.[0];console.log(JSON.stringify({case:'TC02',calls,execution:fact}));
 assert.equal(fact?.exit_code,0,'Task top-level listing must work with raw contents still denied');
 assert.match(fact!.output,/task-metadata-ok;raw-and-other-denied/);
 assert.doesNotMatch(fact!.output,/RAW_NOT_GRANTED|OTHER_TASK_NOT_GRANTED/);
});

test('TC03 approved calculation work stays writable while sources and unapproved sibling files stay protected',async()=>{
 const root=mkdtempSync(join(process.env.JUANERAI_NEWARCH_SHORT_ROOT!,'tc-effects-')),task=randomUUID(),cwd=join(root,'analyses',task);
 const file=join(cwd,'020_clean/source','approved-source','fixed-version','table.csv'),extra=join(dirname(file),'not-approved.csv'),work=join(cwd,'020_clean/work');
 mkdirSync(dirname(extra),{recursive:true});writeFileSync(extra,'UNAPPROVED_PAYLOAD\n');
 const content='id,amount\na,7\nb,17\n';
 const command='python3 - <<\'PY\'\nimport csv\nfrom pathlib import Path\nsource=Path('+JSON.stringify(file)+')\nwith source.open() as f:\n value=sum(int(r["amount"]) for r in csv.DictReader(f))\nwork=Path('+JSON.stringify(work)+')\nwork.mkdir(parents=True,exist_ok=True)\n(work/"result.txt").write_text(str(value))\ntry:\n source.write_text("MUTATED_SOURCE")\n raise RuntimeError("SOURCE_WRITE_WAS_ALLOWED")\nexcept PermissionError:\n pass\ntry:\n Path('+JSON.stringify(extra)+').read_text()\n raise RuntimeError("UNAPPROVED_READ_WAS_ALLOWED")\nexcept PermissionError:\n pass\nprint("computed="+(work/"result.txt").read_text()+";work-writable;source-protected")\nPY';
 let calls=0;
 const agent=createPiProfessionalAgent({projectRoot:root,analysisModel:'mimo-v2.6-flash',credentials:offlineCredentials,authorizeWork:()=>true,fetch:async()=>++calls===1?offlineResponse(calls,[{name:'bash',args:{command}}]):offlineResponse(calls,[],'执行记录保存；不自称独立核验。')});
 const identity={task_id:task,revision:'1',run_id:randomUUID(),attempt_id:randomUUID(),operation_id:randomUUID(),grant_id:randomUUID(),scope_sha256:'a'.repeat(64),config_sha256:await agent.configuration()};
 const result=await agent.advance({identity,command_id:randomUUID(),purpose:'analysis',prompt:'对获准资料真实计算并保存本地工作结果。',system:'不授予来源写权限或其他资料读取。',materials:[{path:file,content}],capabilities:async()=>[],authorize:()=>true,signal:new AbortController().signal});
 await agent.waitForIdle();await agent.assertCompleted(identity,result.completion);
 const fact=result.completion.executions?.[0];console.log(JSON.stringify({case:'TC03',execution:fact}));
 assert.equal(fact?.exit_code,0);assert.match(fact!.output,/computed=24;work-writable;source-protected/);
 assert.equal(readFileSync(file,'utf8'),content);assert.equal(readFileSync(join(work,'result.txt'),'utf8'),'24');
 assert.doesNotMatch(fact!.output,/UNAPPROVED_PAYLOAD/);
});



test('PC01 F001 every native capability checks live business authorization before resolver content reads',async t=>{
 const fs=(await import('node:fs/promises')).default,{syncBuiltinESMExports}=await import('node:module'),{createAnalysisFiles}=await import('../../../adapters/agent-pi/analysis-files.ts');
 for(const name of ['read','write','edit','bash'] as const)await t.test(name,async()=>{
  const root=mkdtempSync(join(process.env.JUANERAI_NEWARCH_SHORT_ROOT!,'authority-first-')),source=join(root,'020_clean/source/id/v1/table.txt'),asset=join(root,'020_clean/metric-asset/approved.txt'),output=join(root,'output.md'),signal=new AbortController().signal;let revoked=false,active=false;
  const events:{kind:string;path?:string}[]=[];writeFileSync(output,'seed');
  const files=await createAnalysisFiles({cwd:root,compute:true,reportPath:output,signal,authorize:()=>true,materials:[{path:source,content:'SOURCE_GRANTED'},{path:asset,content:'ASSET_GRANTED'}],authorizeResources:async()=>{if(active)events.push({kind:'business-check'});if(revoked)throw Object.assign(new Error('Asset approval revoked'),{code:'ASSET_APPROVAL_REVOKED'});}});
  const original=fs.open;fs.open=async function(path,...args){const handle=await original.call(this,path,...args);if(active&&[source,asset].includes(String(path))){const read=handle.readFile.bind(handle);t.mock.method(handle,'readFile',async(...values:Parameters<typeof read>)=>{const result=await read(...values);events.push({kind:'read-approved-bytes',path:String(path)});return result;});}return handle;};syncBuiltinESMExports();
  active=true;revoked=true;try{const args:import('pi-agent-runtime').JsonObject=name==='read'?{path:source}:name==='write'?{path:output,content:'changed'}:name==='edit'?{path:output,edits:[{oldText:'seed',newText:'changed'}]}:{command:'printf changed > output.md'};await assert.rejects(()=>files.tools.find(tool=>tool.name===name)!.execute(args,signal));}finally{active=false;fs.open=original;syncBuiltinESMExports();}
  assert.ok(events.some(event=>event.kind==='business-check'));assert.equal(events.filter(event=>event.kind==='read-approved-bytes').length,0,'revocation must precede SDK resolver/native/snapshot content reads');assert.equal(readFileSync(output,'utf8'),'seed');assert.equal(readFileSync(source,'utf8'),'SOURCE_GRANTED');assert.equal(readFileSync(asset,'utf8'),'ASSET_GRANTED');
 });
});
