import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync,writeFileSync,readdirSync,mkdirSync,realpathSync} from 'node:fs';
import {join} from 'node:path';
import {randomUUID,createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {startIndependentBrowserService} from '../../../apps/browser/service-main.ts';
import {createLocalOpenAnalysisStore} from '../../../adapters/storage-local/open-analysis.ts';
import {createLocalAnalysisRequestLedger} from '../../../adapters/storage-local/analysis-request-ledger.ts';
import {createPersistentRuntimeState} from '../../../adapters/agent-pi/persistent-runtime-state.ts';
import {browserEvidenceRoot} from '../../fixtures/xanthil-desktop/browser-evidence.ts';

// Reuses repair-2 RC18's real HTTP service / Provider SSE composition. Every
// outbound call terminates here; no SDK preparation, tool or executor is mocked.
for(const failure of ['none','syntax','sandbox'] as const)test('AH-01/04/07 actual Browser codec and original LA09 native program '+failure,{skip:process.platform!=='darwin',timeout:30000},async()=>{
 const base=mkdtempSync(join(browserEvidenceRoot,'ah-la09-http-')),resources=join(base,'resources'),profile=join(base,'profile'),id=randomUUID(),sid=randomUUID();mkdirSync(resources);
 assert.ok(process.env.JUANERAI_TOOLCHAIN_BIN);const python=join(process.env.JUANERAI_TOOLCHAIN_BIN,'python3'),duckdb=join(process.env.JUANERAI_TOOLCHAIN_BIN,'duckdb');
 const version=spawnSync(python,['--version'],{encoding:'utf8'});assert.equal(version.status,0);
 writeFileSync(join(resources,'toolchain-deployment.json'),JSON.stringify({schema_version:'1.0',python:{executable_path:python,version:version.stdout.trim().replace(/^Python /,'')},duckdb:{executable_path:duckdb,version:'1.5.2'}}));
 const helper=join(resources,'synthetic-credentials');writeFileSync(helper,'#!/bin/sh\nprintf \'%s\\n\' \'{"status":"found","key":"synthetic-offline-only"}\'\n',{mode:0o700});
 const canary=join(base,'outside-canary');writeFileSync(canary,'UNCHANGED');
 const sourcecode="x=json.load(open(SOURCES[0]))\nrows=x['inspection']['sources'][0]['sheets'][0]['rows'][1:]\nvalues=[int(r['cells'][0]['value']) for r in rows]\njson.dump({'summary':'平方评分','observations':['数量'+str(sum(values))],'charts':[{'title':'评分','type':'bar','unit':'探索单位','points':[{'label':'Coffee','value':sum(v*v for v in values)}]}]},open(os.path.join(OUTPUT,'result.json'),'w'),ensure_ascii=False)\n";
 const program='# 保留中文缩进与源程序\n'.repeat(1000)+(failure==='syntax'?'items = [}\n':failure==='sandbox'?'open('+JSON.stringify(canary)+',"w").write("must not happen")\n':sourcecode);
 assert.ok(Buffer.byteLength(program)>16384&&Buffer.byteLength(program)<=65536);
 const originalFetch=globalThis.fetch,environment=['LLM_API_KEY','LLM_MODEL','LLM_BASE_URL'].map(k=>[k,process.env[k]] as const);
 Object.assign(process.env,{LLM_API_KEY:'synthetic-offline-only',LLM_MODEL:'MiniMax-M3',LLM_BASE_URL:'https://api.minimaxi.com/anthropic'});
 let phase='inspect',physical=0,cursor=0,reportStage=0,problem:unknown;const dtos:Record<string,unknown>[]=[],calls:string[]=[];
 function anthropic(name?:string,args:Record<string,unknown>={}){
  const events:any[]=[['message_start',{type:'message_start',message:{id:'ah-'+physical,type:'message',role:'assistant',content:[],model:'MiniMax-M3',usage:{input_tokens:10,output_tokens:0}}}]];
  events.push(['content_block_start',{type:'content_block_start',index:0,content_block:name?{type:'tool_use',id:'ah-'+physical,name,input:{}}:{type:'text',text:''}}],['content_block_delta',{type:'content_block_delta',index:0,delta:name?{type:'input_json_delta',partial_json:JSON.stringify(args)}:{type:'text_delta',text:failure==='none'?'Coffee数量已独立核验，平方评分仍为未独立核验探索。':'探索失败，未生成合格报告；不伪称结果。'}}],['content_block_stop',{type:'content_block_stop',index:0}],['message_delta',{type:'message_delta',delta:{stop_reason:name?'tool_use':'end_turn'},usage:{output_tokens:10}}],['message_stop',{type:'message_stop'}]);
  return new Response(events.map(([e,d])=>'event: '+e+'\ndata: '+JSON.stringify(d)+'\n\n').join(''),{headers:{'content-type':'text/event-stream'}});
 }
 globalThis.fetch=async(url,init)=>{
  const target=new URL(typeof url==='string'||url instanceof URL?url:url.url);if(['127.0.0.1','localhost','[::1]'].includes(target.hostname))return originalFetch(url,init);
  try{
   assert.ok(['api.minimaxi.com','token-plan-cn.xiaomimimo.com'].includes(target.hostname),'undeclared outbound IO refused');
   const body=JSON.parse(String(init!.body));physical++;assert.ok(physical<=42,'finite original-program sequence without hidden retry');dtos.push(body);writeFileSync(join(base,'provider-dto-'+physical+'.json'),JSON.stringify(body));assert.equal(body.max_tokens??body.max_completion_tokens,4096,'original reserved output is retained');
   if(target.hostname==='token-plan-cn.xiaomimimo.com'){
    assert.equal(failure,'none');const names=body.tools.map((t:any)=>t.function.name);assert.ok(names.includes('write')&&names.includes('complete_artifact'));assert.equal(names.includes('build_artifact'),false);
    const text=body.messages.findLast((m:any)=>typeof m.content==='string'&&m.content.includes('JuanerAI.report-edit.v1\n'))?.content;assert.ok(text);const evidence=JSON.parse(text.slice(text.indexOf('JuanerAI.report-edit.v1\n')+'JuanerAI.report-edit.v1\n'.length));
    const content=JSON.stringify({version:'1.5',status:'ready',interpretations:[{fact_refs:evidence.numeric_facts.map((f:any)=>f.reference_id),interpretation:'Coffee数量有独立算术核验；平方评分仍是未独立核验探索，不作因果或行动结论。'}]});
    const name=reportStage===0?'write':reportStage===1?'complete_artifact':undefined,args=reportStage++===0?{path:'draft/report.json',content}:{};
    const delta=name?{role:'assistant',tool_calls:[{index:0,id:'report-'+physical,type:'function',function:{name,arguments:JSON.stringify(args)}}]}:{role:'assistant',content:'完整报告已提交。'};
    const chunks=[{id:'report-'+physical,object:'chat.completion.chunk',model:'mimo-v2.6-flash',choices:[{index:0,delta,finish_reason:null}]},{id:'report-'+physical,object:'chat.completion.chunk',choices:[{index:0,delta:{},finish_reason:name?'tool_calls':'stop'}],usage:{prompt_tokens:10,completion_tokens:10,total_tokens:20}}];
    return new Response(chunks.map(c=>'data: '+JSON.stringify(c)+'\n\n').join('')+'data: [DONE]\n\n',{headers:{'content-type':'text/event-stream'}});
   }
   const names=body.tools.map((t:any)=>t.name),last=()=>{const content=body.messages.flatMap((m:any)=>Array.isArray(m.content)?m.content:[]).findLast((c:any)=>c.type==='tool_result')?.content;return typeof content==='string'?JSON.parse(content):null;};
   const catalog=body.tools.find((t:any)=>t.name==='read_tool_contract');assert.ok(catalog);
   let name:string|undefined,args:Record<string,unknown>={};if(phase==='negative-final')assert.fail('no retry after negative feedback');
   const discover=(tool:string)=>{name='read_tool_contract';args={name:tool};};
   if(phase==='inspect'){name='inspect_selected';phase='business';}
   else if(phase==='business'){name='describe_business';args={purpose:'Coffee数量分析',object:'选定Coffee记录',scope:'当前CSV仅Coffee',deliverables:['核验数量和探索平方评分'],hypotheses:[],unknowns:[],execution_scope:[{source_id:sid,sheet_id:'csv',filters:[{column:'B',operator:'eq',value:'Coffee'}]}]};phase='meaning';}
   else if(phase==='meaning'){name='interpret_meaning';args={interpretations:[{dimension:'unit',value:'件',status:'clear',unscaled_unit:{input_label:'件',output_label:'件'},evidence:[{source:{source_id:sid,sheet_id:'csv',row:1,column:'A'}}]}],conflicts:[]};phase='framework';}
   else if(phase==='framework'){name='set_framework';args={goal:'Coffee分析',source_id:sid,sheet_id:'csv',operation:'sum',column:'A',unit:'件',group_mode:'none',filters:[{column:'B',operator:'eq',value:'Coffee'}]};phase='file';}
   else if(phase==='file'){
    if(cursor<program.length){let piece='';for(const c of program.slice(cursor)){if(Buffer.byteLength(piece+c)>1800)break;piece+=c;}const first=cursor===0;cursor+=piece.length;name=first?'write':'edit';args=first?{path:'draft/analysis.py',content:piece+'# NATIVE_INCOMPLETE'}:{path:'draft/analysis.py',edits:[{oldText:'# NATIVE_INCOMPLETE',newText:piece+'# NATIVE_INCOMPLETE'}]};}
    else {name='edit';args={path:'draft/analysis.py',edits:[{oldText:'# NATIVE_INCOMPLETE',newText:''}]};phase='read';}
   }else if(phase==='read'){name='read';args={path:'draft/analysis.py'};phase='explore';}
   else if(phase==='explore'){if(!names.includes('explore_with_python'))discover('explore_with_python');else{name='explore_with_python';args={goal:'平方评分探索',bindings:[{source_id:sid,sheet_id:'csv',columns:['A'],filters:[]}],code_path:'draft/analysis.py'};phase='exploration-result';}}
   else if(phase==='exploration-result'){const result=last();if(failure==='none'){assert.equal(result.value.charts[0].points[0].value,49);assert.equal(result.verification,'not_performed');phase='calculate';}else{assert.equal(result.status,'needs_code_correction');phase='negative-final';}}
   if(phase==='calculate'&&!name){if(!names.includes('calculate_and_verify'))discover('calculate_and_verify');else{name='calculate_and_verify';phase='verified';}}
   else if(phase==='verified'){assert.equal(last().calculation.value,'7');assert.equal(last().verification.grade,'independent_arithmetic');phase='finished';}
   else if(['finished','failed'].includes(phase)&&!name){assert.fail('no second host model-completion loop or automatic program retry');}
   if(name){assert.ok(names.includes(name),'every actual tool call has the same Provider declaration');calls.push(name);}return anthropic(name,args);
  }catch(error){problem??=error;throw error;}
 };
 let service:Awaited<ReturnType<typeof startIndependentBrowserService>>|undefined;
 try{
  const options={harnessFirstLoop:{version:'v0.2' as const,work_recovery:'v1' as const,request_admission:{policy_version:'ah-la09-original',protocol_overhead_tokens:128,safety_margin_tokens:512}},deployment:{resourcesRoot:realpathSync(resources),credentialHelper:helper}};
  service=await startIndependentBrowserService(profile,options);assert.equal(physical,0);
  const bootstrap=new URL(await service.open()).hash.slice(1),boot=await originalFetch(service.origin+'/v1/bootstrap',{method:'POST',headers:{origin:service.origin,'content-type':'application/json'},body:JSON.stringify({token:bootstrap})});assert.equal(boot.status,200);
  const headers={cookie:boot.headers.get('set-cookie')!.split(';')[0],origin:service.origin,'content-type':'application/json'},session=await originalFetch(service.origin+'/v1/session',{headers}),generation=(await session.json()).generation;
  const claim=await originalFetch(service.origin+'/v1/control',{method:'POST',headers,body:JSON.stringify({version:'1.0',command_id:randomUUID(),confirmed:true,generation})});assert.equal(claim.status,200);
  const selected=await originalFetch(service.origin+'/v1/projects/select',{method:'POST',headers:{...headers,'x-xanthil-control':(await claim.json()).control},body:JSON.stringify({version:'1.0',command_id:randomUUID(),name:'AH synthetic offline'})});assert.equal(selected.status,200);
  const control=(await selected.json()).control,accepted=await originalFetch(service.origin+'/v1/open-analysis',{method:'POST',headers:{...headers,'x-xanthil-control':control,'x-xanthil-view':'browser-v1'},body:JSON.stringify({version:'1.0',command_id:id,question:'分析当前Coffee数量（单位件）和平方评分，仅合成资料。',confirmed:true,sources:[{source_id:sid,display_name:'synthetic.csv',format:'csv',base64:Buffer.from('数量,商品\n7,Coffee\n100,Tea\n').toString('base64')}]})});assert.equal(accepted.status,200);
  let project:string|undefined,task:ReturnType<ReturnType<typeof createLocalOpenAnalysisStore>['read']>|undefined=undefined;
  for(let i=0;i<2000;i++){const folders=readdirSync(join(profile,'Projects'));if(folders.length){project=join(profile,'Projects',folders[0]!);task=createLocalOpenAnalysisStore({projectRoot:project}).read(id);if(task&&task.state!=='running')break;}await new Promise(resolve=>setTimeout(resolve,10));}
  assert.ifError(problem);assert.ok(project);assert.ok(task);assert.equal(readFileSync(canary,'utf8'),'UNCHANGED');
  const audit=createPersistentRuntimeState({projectRoot:project}).readAudit(id),ledger=createLocalAnalysisRequestLedger({projectRoot:project});
  assert.ok(audit.some(e=>e.toolName==='explore_with_python'&&e.kind==='tool.finished'));const codeRoot=join(project,'.juanerai','open-code'),sourceFiles=readdirSync(codeRoot,{withFileTypes:true}).filter(n=>n.isDirectory());assert.equal(sourceFiles.length,1);assert.equal(readFileSync(join(codeRoot,sourceFiles[0]!.name,'payload.py'),'utf8'),program);
  if(failure==='none'){assert.equal(task.state,'saved');assert.equal(task.explorations![0]!.value.charts[0]!.points[0]!.value,49);assert.equal(task.outcome!.verification.value,'7');const savedRead=await originalFetch(service.origin+'/v1/open-analysis/'+id,{headers});assert.equal(savedRead.status,200);assert.equal((await savedRead.json()).state,'saved');
   const before=physical;await service.close();service=await startIndependentBrowserService(profile,options);
   const token=new URL(await service.open()).hash.slice(1),reboot=await originalFetch(service.origin+'/v1/bootstrap',{method:'POST',headers:{origin:service.origin,'content-type':'application/json'},body:JSON.stringify({token})});assert.equal(reboot.status,200);
   const reopenedHeaders={cookie:reboot.headers.get('set-cookie')!.split(';')[0],origin:service.origin,'content-type':'application/json'},projects=await originalFetch(service.origin+'/v1/projects',{headers:reopenedHeaders});assert.equal(projects.status,200);const list=await projects.json();assert.equal(list.projects.length,1);
   const reselect=await originalFetch(service.origin+'/v1/projects/select',{method:'POST',headers:reopenedHeaders,body:JSON.stringify({version:'1.0',command_id:randomUUID(),project_id:list.projects[0].project_id})});assert.equal(reselect.status,200);
   const reopened=await originalFetch(service.origin+'/v1/open-analysis/'+id,{headers:reopenedHeaders});assert.equal(reopened.status,200);assert.equal((await reopened.json()).state,'saved');assert.deepEqual(createLocalOpenAnalysisStore({projectRoot:project}).read(id)!.outcome,task.outcome);assert.equal(physical,before,'passive HTTP saved readback has zero Provider calls');}
  else {assert.equal(task.state,'failed');assert.equal(task.outcome,null);assert.equal(task.explorations?.length??0,0);assert.equal(reportStage,0);}
  assert.equal(ledger.pending!().length,0);
  const bytes=(v:unknown)=>Buffer.byteLength(JSON.stringify(v));writeFileSync(join(base,'RESULT.json'),JSON.stringify({failure,state:task.state,program_sha256:createHash('sha256').update(program).digest('hex'),program_bytes:Buffer.byteLength(program),original_cap_bytes:65536,context_window:200000,output_reserve:4096,physical_synthetic_calls:physical,real_provider_calls:0,calls,dto_contributions:dtos.map(d=>({tools_bytes:bytes(d.tools),system_skill_bytes:bytes(d.system??''),history_result_bytes:bytes(d.messages),output_reserve:d.max_tokens??d.max_completion_tokens})),audit,requests:ledger.read(id)},null,2));
 }finally{await service?.close();globalThis.fetch=originalFetch;for(const[k,v]of environment)if(v===undefined)delete process.env[k];else process.env[k]=v;}
});
