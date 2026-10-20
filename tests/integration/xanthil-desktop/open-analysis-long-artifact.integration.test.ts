import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync,readdirSync,symlinkSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {randomUUID,createHash} from 'node:crypto';
import {createLocalAnalysisDraftStore} from '../../../adapters/storage-local/open-analysis-draft.ts';
const digest=(s:string)=>createHash('sha256').update(s).digest('hex');
function fixture(){const root=mkdtempSync(join(process.env.JUANERAI_TEST_EVIDENCE_DIR??'/private/tmp','long-draft-')),store=createLocalAnalysisDraftStore({root});return {root,store,binding:{task_id:randomUUID(),operation_id:randomUUID(),scope_sha256:'a'.repeat(64),config_sha256:'b'.repeat(64),kind:'python' as const},plan:{max_bytes:65536,usual_ms:120000,recovery_ms:240000,full_deadline:Date.now()+300000}};}
test('LA01 durable exact UTF8 assembly, original acknowledgments, CAS and seal; reopen never executes',()=>{
 const f=fixture(),r=f.store.begin(f.binding,f.plan),chunks=['# 中文\n','x = "\\n"\n','print(x)\n'];let ref=r;
 for(const text of chunks){const c={command_id:randomUUID(),base_version:ref.version,action:'append' as const,text};const ack=f.store.command(f.binding,r.id,c);assert.deepEqual(f.store.command(f.binding,r.id,c),ack);assert.deepEqual(f.store.command(f.binding,r.id,{action:'append',text:c.text,base_version:c.base_version,command_id:c.command_id}),ack);assert.throws(()=>f.store.command(f.binding,r.id,{...c,text:text+'x'}));ref=ack;}
 assert.throws(()=>f.store.command(f.binding,r.id,{command_id:randomUUID(),base_version:0,action:'append',text:'late'}));
 ref=f.store.command(f.binding,r.id,{command_id:randomUUID(),base_version:ref.version,action:'seal'});
 const reopened=createLocalAnalysisDraftStore({root:f.root}).read(f.binding,r.id);assert.equal(reopened.text,chunks.join(''));assert.equal(ref.sha256,digest(chunks.join('')));assert.deepEqual(ref,reopened.ref);assert.equal(ref.sealed,true);
 assert.throws(()=>f.store.command(f.binding,r.id,{command_id:randomUUID(),base_version:ref.version,action:'append',text:'late'}));
 assert.throws(()=>f.store.read({...f.binding,task_id:randomUUID()},r.id));assert.throws(()=>f.store.read(f.binding,'../../escape'));
});
test('LA02 empty/no-progress/ambiguous edits, limits, foreign source, symlink and frozen tamper rejected',()=>{
 const f=fixture(),r=f.store.begin(f.binding,{...f.plan,max_bytes:10});const cmd=(action:object)=>({command_id:randomUUID(),base_version:0,...action});
 assert.throws(()=>f.store.command(f.binding,r.id,cmd({action:'append',text:''}) as never));assert.throws(()=>f.store.command(f.binding,r.id,cmd({action:'append',text:'x'.repeat(2049)}) as never));
 const ref=f.store.command(f.binding,r.id,cmd({action:'append',text:'aa aa'}) as never);
 for(const [before,after] of [['aa','b'],['aa aa','aa aa']])assert.throws(()=>f.store.command(f.binding,r.id,{command_id:randomUUID(),base_version:ref.version,action:'patch',before,after}));
 assert.throws(()=>f.store.read({...f.binding,scope_sha256:'c'.repeat(64)},r.id));
 const path=join(f.root,r.id+'.json'),original=readFileSync(path,'utf8');writeFileSync(path,original.replace('aa aa','ab aa'));assert.throws(()=>f.store.read(f.binding,r.id));
 const g=fixture(),x=g.store.begin(g.binding,g.plan);const fs=awaitImport();fs.unlinkSync(join(g.root,x.id+'.json'));symlinkSync(path,join(g.root,x.id+'.json'));assert.throws(()=>g.store.read(g.binding,x.id));
});
import * as filesystem from 'node:fs';function awaitImport(){return filesystem;}
test('LA03 work recovery remains once across pages/reopen and terminal state; normal steps metered distinctly',()=>{
 const f=fixture(),r=f.store.begin(f.binding,f.plan),one=randomUUID();assert.equal(f.store.admit(f.binding,r.id,{logicalId:one,recovery:false}),true);assert.equal(f.store.admit(f.binding,r.id,{logicalId:one,recovery:true}),true);
 const reopened=createLocalAnalysisDraftStore({root:f.root}),two=randomUUID();assert.equal(reopened.admit(f.binding,r.id,{logicalId:two,recovery:false}),true);assert.equal(reopened.admit(f.binding,r.id,{logicalId:two,recovery:true}),false);assert.equal(reopened.admit(f.binding,r.id,{logicalId:one,recovery:false}),false);
 reopened.close(f.binding,r.id,'stopped');assert.equal(reopened.admit(f.binding,r.id,{logicalId:randomUUID(),recovery:false}),false);assert.throws(()=>reopened.begin(f.binding,f.plan));assert.equal(reopened.read(f.binding,r.id).text,'');
});
test('LA04 stage deadline is shared, not multiplied by chunks; crash lock is not stolen',()=>{
 const f=fixture(),r=f.store.begin(f.binding,{...f.plan,full_deadline:Date.now()-1});assert.equal(f.store.admit(f.binding,r.id,{logicalId:randomUUID(),recovery:false}),false);
 const g=fixture(),x=g.store.begin(g.binding,g.plan);writeFileSync(join(g.root,x.id+'.lock'),'unknown-owner',{flag:'wx'});assert.throws(()=>g.store.command(g.binding,x.id,{command_id:randomUUID(),base_version:0,action:'append',text:'x'}));assert.ok(readdirSync(g.root).includes(x.id+'.lock'));
});

import {withLongAnalysisArtifacts} from '../../../packages/application/open-analysis-long-artifact.ts';
import {createPiSessionOpenAnalysisRuntime} from '../../../adapters/agent-pi/native-open-analysis.ts';
import {createApprovedProviderCredentials} from '../../../adapters/agent-pi/provider-credentials.ts';
import {createLocalAnalysisRequestLedger} from '../../../adapters/storage-local/analysis-request-ledger.ts';
import {createPersistentRuntimeState} from '../../../adapters/agent-pi/persistent-runtime-state.ts';
import type {ModelReply,ModelRequest,JsonObject} from 'pi-agent-runtime';
const textReply=(text:string):ModelReply=>({stop:'complete',content:[{kind:'text',text}],usage:{inputTokens:7,outputTokens:3}});
const toolReply=(args:JsonObject):ModelReply=>({stop:'tools',content:[{kind:'tool',id:randomUUID(),name:'build_artifact',arguments:args}],usage:{inputTokens:7,outputTokens:100}});
function latestTool(r:ModelRequest){const v=r.messages.filter(m=>m.role==='tool').at(-1);assert.ok(v,'SDK must deliver real durable tool acknowledgment');return JSON.parse(v.text);}
function longRuntimeFixture(transport:(r:ModelRequest)=>Promise<ModelReply>,shared=true,nativeFiles=false){
 const f=fixture(),ledger=createLocalAnalysisRequestLedger({projectRoot:f.root}),identity={task_id:f.binding.task_id,operation_id:f.binding.operation_id,scope_sha256:f.binding.scope_sha256,config_sha256:f.binding.config_sha256,revision:'1',run_id:randomUUID(),attempt_id:randomUUID(),grant_id:randomUUID()};
 const native=createPiSessionOpenAnalysisRuntime({projectRoot:f.root,ledger,nativeObjectArguments:true,...(shared?{firstLoop:'v0.2' as const,sharedWorkRecovery:'v1' as const,r1r4:{contextAdmission:{policyVersion:'offline119',protocolOverheadTokens:128,safetyMarginTokens:512}}}:{}),reviewPolicy:()=>true,reportPro60ForTask:()=>true,reportTimeoutForTask:()=>120000,judgmentReviewTimeoutForTask:()=>60000,reportThinking:'off',longArtifactsForTask:()=>true,credentials:createApprovedProviderCredentials({environment:{}}),modelTransport:async request=>{const reply=await transport(request);return !shared||reply.outcome?reply:{...reply,outcome:{model:{provider:request.model.provider,id:request.model.id,protocol:request.model.protocol},stop:reply.stop,physicalStatus:'response-received',usageFinal:true,usage:{inputTokens:{kind:'known',value:reply.usage.inputTokens},outputTokens:{kind:'known',value:reply.usage.outputTokens}},diagnostic:reply.stop==='length'?'OUTPUT_LIMIT':'COMPLETE'}};}});
 let wire=0;const observed={...native,...(!nativeFiles?{artifactFiles:undefined}:{}),run:async(input:Parameters<typeof native.run>[0])=>{if(shared){const bad:string[]=[];const check=(v:unknown,p:string)=>{if(v===undefined||typeof v==='function'||typeof v==='symbol')bad.push(p+':'+typeof v);else if(v&&typeof v==='object'){if(!Array.isArray(v)&&Object.getPrototypeOf(v)!==Object.prototype)bad.push(p+':prototype');for(const key of Reflect.ownKeys(v))check(Reflect.get(v,key),p+'.'+String(key));}};check(input.tools.map(t=>({name:t.name,parameters:t.modelParameters??t.parameters})), 'tool_view');writeFileSync(join(f.root,'shared-native-input-'+(++wire)+'.json'),JSON.stringify({bad,tools:input.tools.map(t=>({name:t.name,parameters:t.modelParameters??t.parameters}))}));}return native.run(input);}};
 const store=createLocalAnalysisDraftStore({root:join(f.root,'drafts')}),runtime=withLongAnalysisArtifacts({runtime:observed,store,enabled:()=>true,reportMs:()=>120000});
 return {...f,ledger,native,runtime,identity,base:{identity,prompt:'BOOTSTRAP',system:'仅合成离线受控输入',tools:[],judgmentReview:true as const,signal:new AbortController().signal,authorize:()=>true}};
}
test('LA05 installed SDK→native tool loop→durable chunks→sealed report bytes, exact known physical accounting',async()=>{
 const payload=JSON.stringify({完整自然报告:'中文、引号"、换行\n及有据条件200元。'.repeat(600)});let reportStep=0;const pieces:string[]=[];let part='';for(const c of payload){if(Buffer.byteLength(part+c)>1800){pieces.push(part);part='';}part+=c;}if(part)pieces.push(part);
 const f=longRuntimeFixture(async r=>{if(r.model.id==='MiniMax-M3')return textReply('bootstrap');assert.equal(r.model.id,'mimo-v2.6-pro');assert.equal(r.maxOutputTokens,4096);assert.ok(r.messages.flatMap(m=>m.tools??[]).some(t=>t.name==='build_artifact'));
  if(reportStep<pieces.length){const version=reportStep===0?0:latestTool(r).version;return toolReply({action:'append',command_id:randomUUID(),base_version:version,text:pieces[reportStep++]});}
  if(reportStep++===pieces.length)return toolReply({action:'seal',command_id:randomUUID(),base_version:latestTool(r).version});
  const ref=latestTool(r);assert.equal(ref.sealed,true);return textReply(JSON.stringify({version:'artifact-completion/1.0',id:ref.id,draft_version:ref.version,sha256:ref.sha256}));
 });
 await f.runtime.run(f.base);const result=await f.runtime.run({...f.base,purpose:'report_edit',prompt:'FORM_LONG_REPORT'});assert.equal(result.text,payload);assert.ok(Buffer.byteLength(payload)>16384);assert.equal(f.ledger.read(f.identity.task_id).length,pieces.length+3);
 const state=createPersistentRuntimeState({projectRoot:f.root}).readAccounting(f.identity.task_id)!;assert.equal(state.owner,null);assert.equal(state.reservations.length,0);assert.equal(state.usage.modelCalls,pieces.length+3);assert.equal(state.usage.inputTokens,(pieces.length+3)*7);
});
test('LA06 explicit length after a valid-looking first block cannot write any draft bytes; cause survives application adapter',async()=>{
 let report=0;const f=longRuntimeFixture(async r=>r.model.id==='MiniMax-M3'?textReply('bootstrap'):{...toolReply({action:'append',command_id:randomUUID(),base_version:0,text:'must not save'}),stop:'length',content:[{kind:'tool',id:'head',name:'build_artifact',arguments:{action:'append',command_id:randomUUID(),base_version:0,text:'must not save'}},{kind:'text',text:'incomplete tail'}]});
 await f.runtime.run(f.base);await assert.rejects(()=>f.runtime.run({...f.base,purpose:'report_edit',prompt:'TRUNCATED_REPORT'}),e=>{assert.equal((e as {code:string}).code,'OUTPUT_INCOMPLETE');assert.equal((e as {diagnostic:string}).diagnostic,'OUTPUT_LIMIT');return true;});
 for(const name of readdirSync(join(f.root,'drafts')).filter(n=>n.endsWith('.json'))){const r=JSON.parse(readFileSync(join(f.root,'drafts',name),'utf8'));assert.equal(r.text,'');}
 assert.equal(f.ledger.read(f.identity.task_id).length,2);assert.equal(createPersistentRuntimeState({projectRoot:f.root}).readAccounting(f.identity.task_id)!.usage.reservedOutputTokens,0);
});

import {optionScenario,assert111Consumers,scenario} from '../../fixtures/xanthil-desktop/change007-long-artifact.ts';
import {parseReviewableDocument,reviewableClaims} from '../../../packages/product-core/open-analysis-reviewable-document.ts';
import {taskHash} from '../../../packages/product-core/member-task.ts';
import {runGeneratedJudgmentReview} from '../../../packages/application/open-analysis.ts';
import {compileJudgmentRound,completeJudgmentReview,judgmentReviewPrompt} from '../../../packages/product-core/open-analysis-judgment-review.ts';
import {naturalReviewSystem} from '../../../packages/product-core/open-analysis-natural-review.ts';

for(const shared of [true])test('LA07 same full source proposal→multi-chunk report→all review pages→actual store and report/quick/pro/cards/export readback retains original useful 200元 conditions; shared='+shared,async()=>{
 const original=await optionScenario();let formedBytes='';const {document,...baseSnapshot}=original.snapshot;assert.ok(document);const docBytes=JSON.stringify({version:document.version,source_sha256:document.source_sha256,units:document.units});
 let cursor=0,sealed=false,phase='bootstrap';const inputPackets:any[]=[];
 const f=longRuntimeFixture(async r=>{
  if(r.model.id==='MiniMax-M3')return textReply('bootstrap');
  if(r.model.id==='mimo-v2.6-pro'){
   if(cursor<docBytes.length){const ref=cursor===0?{version:0}:latestTool(r),piece=Array.from(docBytes.slice(cursor)).reduce((acc,c)=>Buffer.byteLength(acc+c)<=1800?acc+c:acc,'');assert.ok(piece);cursor+=piece.length;return toolReply({action:'append',command_id:randomUUID(),base_version:ref.version,text:piece});}
   const ref=latestTool(r);if(!sealed){sealed=true;return toolReply({action:'seal',command_id:randomUUID(),base_version:ref.version});}return textReply(JSON.stringify({version:'artifact-completion/1.0',id:ref.id,draft_version:ref.version,sha256:ref.sha256}));
  }
  assert.equal(r.model.id,'mimo-v2.6-flash');assert.equal(r.messages.flatMap(m=>m.tools??[]).length,0);
  const user=r.messages.filter(m=>m.role==='user').at(-1)!.text,p=JSON.parse(user.slice(user.indexOf('\n')+1));inputPackets.push(p);assert.deepEqual(p.current_proposal.units.map(({id,...u}:any)=>u),document.units);assert.equal(p.source_draft.text,document.draft);assert.ok(p.source_draft.text.includes('200'));
  const pc=p.output_contract;return textReply(JSON.stringify(pc.page==='whole'?{version:'review-page/1.0',page:'whole',snapshot_sha256:p.snapshot_sha256,completeness:original.response.completeness,requirement_coverage:original.response.requirement_coverage,global_issues:[]}:{version:'review-page/1.0',page:pc.page,snapshot_sha256:p.snapshot_sha256,claims:original.response.claims.filter(c=>c.claim_id===pc.page)}));
 },shared);
 const base={...f.base,identity:original.f.identity};await f.runtime.run(base);
 const formed=await f.runtime.run({...base,purpose:'report_edit',prompt:'FORM_ORIGINAL_DOCUMENT'});formedBytes=formed.text;assert.equal(formedBytes,docBytes);
 const parsed=parseReviewableDocument(formed.text,baseSnapshot,original.snapshot.question,document.draft);assert.deepEqual(parsed,document);const snapshot={...baseSnapshot,document:parsed,claims:reviewableClaims(parsed,baseSnapshot,original.f.sources)};
 const review=await runGeneratedJudgmentReview({snapshot,sources:original.f.sources,check:()=>{},save:async()=>{},run:async(purpose,prompt,system)=>(await f.runtime.run({...base,purpose,prompt,system})).text});assert.equal(review.state,'completed');assert.equal(review.rounds.length,1);assert.equal(inputPackets.length,snapshot.claims.length+1);assert.equal(review.rounds[0]!.claims[0]!.qualification!.selectable,true);assert.match(review.delivery,/200/);
 const {createLocalOpenAnalysisStore}=await import('../../../adapters/storage-local/open-analysis.ts'),{createOpenAnalysisWorkspace}=await import('../../../packages/application/open-analysis-workspace.ts'),{verifyOpenAnalysisIntegerSum}=await import('../../../adapters/analytics-duckdb/open-analysis-verification.ts');
 const store=createLocalOpenAnalysisStore({projectRoot:f.root});store.create({identity:original.f.identity,source:original.f.sources,question:snapshot.question,review_policy:'conclusion_strategy_v1'} as any);const lease=store.begin(original.f.identity.task_id);store.saveFramework(lease,{version:'1.0',identity:original.f.identity,origin:'MODEL_PROPOSAL',plan:original.f.plan});
 const outcome={version:'1.0',outcome_id:randomUUID(),identity:original.f.identity,framework:original.f.plan,calculation:original.f.calculation,verification:original.f.evidence.verified_calculations[0]!.verification,numeric_report:snapshot.report,judgment_review:review,explanation:{kind:'MODEL_EXPLANATION',text:review.delivery},human_judgment:'not_recorded'};store.saveOutcome(lease,outcome as any);
 const workspace=createOpenAnalysisWorkspace({store,ledger:f.ledger,runtime:{run:async()=>assert.fail('consumer must not generate')},inspect:async()=>original.f.sources,verify:verifyOpenAnalysisIntegerSum,authorizeConfiguration:async()=>({config_sha256:original.f.identity.config_sha256})});
 try{const persisted=createLocalOpenAnalysisStore({projectRoot:f.root}).read(original.f.identity.task_id)!;assert.deepEqual(persisted.outcome,outcome);await assert111Consumers(workspace,persisted,document.units[0]!.text,true);}finally{await workspace.close();}
});

for(const mode of ['duplicate','wrong-version','missing-page','unheeded-global-conflict'] as const)test('LA08 whole review output atomicity '+mode+' keeps all partial pages unqualified',async()=>{
 const {snapshot,response}=await optionScenario();let pages=0;const f=longRuntimeFixture(async r=>{
  if(r.model.id==='MiniMax-M3')return textReply('bootstrap');const user=r.messages.filter(m=>m.role==='user').at(-1)!.text,p=JSON.parse(user.slice(user.indexOf('\n')+1)),pc=p.output_contract;pages++;
  if(pc.page==='whole')return textReply(JSON.stringify({version:'review-page/1.0',page:'whole',snapshot_sha256:p.snapshot_sha256,completeness:response.completeness,requirement_coverage:response.requirement_coverage,global_issues:mode==='unheeded-global-conflict'?[{claim_id:'C1',reason:'全篇附加无依据行动'}]:[]}));
  if(mode==='missing-page')return {...textReply('incomplete'),stop:'length'};
  return textReply(JSON.stringify({version:'review-page/1.0',page:pc.page,snapshot_sha256:mode==='wrong-version'?'0'.repeat(64):p.snapshot_sha256,claims:mode==='duplicate'?[...response.claims,...response.claims]:response.claims}));
 });await f.runtime.run(f.base);await assert.rejects(()=>f.runtime.run({...f.base,purpose:'conclusion_strategy_review',prompt:judgmentReviewPrompt(snapshot),system:naturalReviewSystem}));assert.equal(pages,2);assert.equal(f.ledger.read(f.identity.task_id).length,3);
});

// This path exercises the real macOS supervisor, just as LA22 does. Portable CI
// cannot substitute a deployment descriptor or an unsandboxed Python process.
for(const shared of [true])for(const failure of ['none','syntax','sandbox'] as const)test('LA09 actual Application→native multi-turn→full Python→compile/sandbox→persistent exploration/independent verification '+failure+'; shared='+shared,{skip:process.platform!=='darwin'?'real macOS supervisor is required; no inherited sandbox exception':false},async()=>{
 const {createOpenAnalysisApplication}=await import('../../../packages/application/open-analysis.ts'),{createLocalOpenAnalysisStore}=await import('../../../adapters/storage-local/open-analysis.ts'),{createLocalOpenAnalysisCodeExecution}=await import('../../../adapters/analytics-duckdb/open-analysis-code.ts'),{verifyOpenAnalysisIntegerSum}=await import('../../../adapters/analytics-duckdb/open-analysis-verification.ts');
 const source_id=randomUUID(),inspection:any={version:'1.0',sources:[{source_id,display_name:'synthetic.csv',format:'csv',sha256:'a'.repeat(64),byte_length:'50',sheets:[{sheet_id:'csv',name:'CSV',state:'visible',rows:[{row:1,cells:[{column:'A',type:'string',value:'数量'},{column:'B',type:'string',value:'商品'}]},{row:2,cells:[{column:'A',type:'number',value:'7'},{column:'B',type:'string',value:'Coffee'}]},{row:3,cells:[{column:'A',type:'number',value:'100'},{column:'B',type:'string',value:'Tea'}]}]}]}]};
 let execution=0,step=0,canary='',code='',cursor=0,stage='framework';const emitted:ModelRequest[]=[];
 const call=(name:string,args:JsonObject):ModelReply=>({stop:'tools',content:[{kind:'tool',id:randomUUID(),name,arguments:args}],usage:{inputTokens:9,outputTokens:200}});
 const f=longRuntimeFixture(async r=>{
  emitted.push(r);assert.equal(r.model.id,'MiniMax-M3');
  if(stage==='framework'){stage='chunks';return call('set_framework',{goal:'Coffee分析',source_id,sheet_id:'csv',operation:'sum',column:'A',unit:'件',group_mode:'none',filters:[{column:'B',operator:'eq',value:'Coffee'}]});}
  if(stage==='chunks'){assert.equal(execution,0,'no partial payload execution');if(cursor<code.length){let piece='';for(const c of code.slice(cursor)){if(Buffer.byteLength(piece+c)>1800)break;piece+=c;}const first=cursor===0;cursor+=piece.length;return first?call('write',{path:'draft/analysis.py',content:piece+'# NATIVE_INCOMPLETE'}):call('edit',{path:'draft/analysis.py',edits:[{oldText:'# NATIVE_INCOMPLETE',newText:piece+'# NATIVE_INCOMPLETE'}]});}stage='seal';return call('edit',{path:'draft/analysis.py',edits:[{oldText:'# NATIVE_INCOMPLETE',newText:''}]});}
  if(stage==='seal'){assert.equal(execution,0);stage='read';return call('read',{path:'draft/analysis.py'});}
  if(stage==='read'){if(!r.messages.flatMap(m=>m.tools??[]).some(t=>t.name==='explore_with_python'))return call('read_tool_contract',{name:'explore_with_python'});stage='executed';assert.equal(execution,0);return call('explore_with_python',{goal:'平方评分探索',bindings:[{source_id,sheet_id:'csv',columns:['A'],filters:[]}],code_path:'draft/analysis.py'});}
  if(stage==='executed'){const observed=latestTool(r);assert.equal(execution,1);if(failure!=='none'){assert.equal(observed.status,'needs_code_correction');return textReply('探索失败，保留限制，不伪称有结果。');}assert.equal(observed.value.charts[0].points[0].value,49);assert.equal(observed.verification,'not_performed');stage='calculate';}
  if(stage==='calculate'){if(!r.messages.flatMap(m=>m.tools??[]).some(t=>t.name==='calculate_and_verify'))return call('read_tool_contract',{name:'calculate_and_verify'});stage='verified';return call('calculate_and_verify',{});}
  const verified=latestTool(r);assert.equal(verified.calculation.value,'7');assert.equal(verified.verification.grade,'independent_arithmetic');return textReply('Coffee数量已真实计算与独立核验；平方评分仍为未独立核验探索。');
 },shared);
 canary=join(f.root,'outside-canary');writeFileSync(canary,'UNCHANGED');const sourcecode="x=json.load(open(SOURCES[0]))\nrows=x['inspection']['sources'][0]['sheets'][0]['rows'][1:]\nvalues=[int(r['cells'][0]['value']) for r in rows]\njson.dump({'summary':'平方评分','observations':['数量'+str(sum(values))],'charts':[{'title':'评分','type':'bar','unit':'探索单位','points':[{'label':'Coffee','value':sum(v*v for v in values)}]}]},open(os.path.join(OUTPUT,'result.json'),'w'),ensure_ascii=False)\n";
 code=('# 保留中文缩进与源程序\n'.repeat(1000))+(failure==='syntax'?'items = [}\n':failure==='sandbox'?'open('+JSON.stringify(canary)+',"w").write("must not happen")\n':sourcecode);assert.ok(Buffer.byteLength(code)>16384);assert.ok(Buffer.byteLength(code)<=65536);
 const identity={...f.identity,scope_sha256:taskHash(inspection)},store=createLocalOpenAnalysisStore({projectRoot:f.root});store.create({identity,source:inspection,question:'Coffee分析'});const lease=store.begin(identity.task_id),descriptor=JSON.parse(readFileSync('build/xanthil-toolchain-deployment.json','utf8')),execute=createLocalOpenAnalysisCodeExecution({projectRoot:f.root,pythonExecutable:descriptor.python.executable_path,pythonVersion:descriptor.python.version});
 const originalExplore=execute.explore!;execute.explore=async(...args)=>{execution++;assert.equal(args[0].code,code,'complete original source bytes reach the original supervisor');return originalExplore(...args);};const executeCode=execute;
 const app=createOpenAnalysisApplication({agentLed:true,executeCode,saveExploration:async v=>store.saveExploration(lease,v),runtime:f.runtime,loadSelectedSource:async()=>inspection,isAuthorized:()=>true,saveFramework:async v=>store.saveFramework(lease,v),saveVerifiedStep:async v=>store.saveVerifiedStep(lease,v),verify:verifyOpenAnalysisIntegerSum,saveOutcome:async v=>store.saveOutcome(lease,v)});
 const run=async()=>{try{return await app.run({identity,question:'Coffee分析',signal:AbortSignal.timeout(20000)});}catch(error){writeFileSync(join(f.root,'python-chain-failure.json'),JSON.stringify({calls:emitted.length,code:(error as {code?:string}).code,requests:emitted,events:createPersistentRuntimeState({projectRoot:f.root}).readAudit(identity.task_id)}));throw error;}};const result=failure==='none'?await run():await assert.rejects(run,{code:'ANALYSIS_INCOMPLETE'});assert.equal(readFileSync(canary,'utf8'),'UNCHANGED');assert.equal(execution,1);
 if(failure==='none'){assert.equal(result?.state,'saved');const reopened=createLocalOpenAnalysisStore({projectRoot:f.root}).read(identity.task_id)!;assert.equal(reopened.explorations![0]!.value.charts[0]!.points[0]!.value,49);assert.equal(reopened.explorations![0]!.verification,'not_performed');assert.equal(reopened.outcome!.verification.value,'7');}
 else {assert.equal(store.read(identity.task_id)!.explorations?.length??0,0);const failed=readdirSync(join(f.root,'.juanerai','open-code')).find(n=>n.endsWith('.failed.json'))!;assert.ok(failed);if(failure==='syntax')assert.equal(JSON.parse(readFileSync(join(f.root,'.juanerai','open-code',failed),'utf8')).physical_status,'not_started');}
});

test('LA10 fixed .5 refuses unsupported legacy long-output migration without model calls or historical mutation',async()=>{
 const f=fixture(),ledger=createLocalAnalysisRequestLedger({projectRoot:f.root}),identity={task_id:randomUUID(),operation_id:randomUUID(),revision:'1',run_id:randomUUID(),attempt_id:randomUUID(),grant_id:randomUUID(),scope_sha256:'a'.repeat(64),config_sha256:'b'.repeat(64)};let calls=0;
 const common={projectRoot:f.root,ledger,reviewPolicy:()=>true,nativeObjectArguments:true,reportThinking:'off' as const,reportPro60ForTask:()=>true,reportTimeoutForTask:()=>120000 as const,judgmentReviewTimeoutForTask:()=>60000 as const,credentials:createApprovedProviderCredentials({environment:{}}),modelTransport:async()=>{calls++;return textReply('baseline');}},old=createPiSessionOpenAnalysisRuntime(common),base={identity,system:'offline',prompt:'baseline',tools:[],signal:new AbortController().signal,authorize:()=>true};
 await old.run(base);const state=createPersistentRuntimeState({projectRoot:f.root}),before=state.readAccounting(identity.task_id)!,rows=ledger.read(identity.task_id);
 assert.throws(()=>createPiSessionOpenAnalysisRuntime({...common,longArtifactsForTask:()=>true}),{code:'CAPABILITY_UNAVAILABLE'});
 assert.equal(calls,1);assert.deepEqual(ledger.read(identity.task_id),rows);assert.deepEqual(state.readAccounting(identity.task_id),before);
});

test('LA11 each normal review page is billed, only one shared physical recovery, no second page recovery despite a new native operation',async()=>{
 const {ProviderFailure}=await import('pi-agent-runtime'),{snapshot,response}=await optionScenario();let reviewCalls=0;const f=longRuntimeFixture(async r=>{
  if(r.model.id==='MiniMax-M3')return textReply('bootstrap');reviewCalls++;if(reviewCalls===1||reviewCalls===3)throw new ProviderFailure('unavailable',{model:r.model,stop:'error',category:'unavailable',physicalStatus:'response-received',usageFinal:true,usage:{inputTokens:{kind:'known',value:0},outputTokens:{kind:'known',value:0}},diagnostic:'REQUEST_FAILED'});const u=r.messages.filter(m=>m.role==='user').at(-1)!.text,p=JSON.parse(u.slice(u.indexOf('\n')+1));return textReply(JSON.stringify({version:'review-page/1.0',page:'whole',snapshot_sha256:p.snapshot_sha256,completeness:response.completeness,requirement_coverage:response.requirement_coverage,global_issues:[]}));
 });await f.runtime.run(f.base);await assert.rejects(()=>f.runtime.run({...f.base,purpose:'conclusion_strategy_review',prompt:judgmentReviewPrompt(snapshot),system:naturalReviewSystem}),e=>{assert.equal((e as {code:string}).code,'AUTHORITY_REQUIRED');return true;});assert.equal(reviewCalls,3);assert.equal(f.ledger.read(f.identity.task_id).length,4);assert.equal(createPersistentRuntimeState({projectRoot:f.root}).readAccounting(f.identity.task_id)!.usage.reservedOutputTokens,0);
});
test('LA12 exact patch/new version, bounded progress and shared stage deadline are enforced before effect',()=>{
 let now=1000;const f=fixture(),s=createLocalAnalysisDraftStore({root:f.root,now:()=>now}),r=s.begin(f.binding,{max_bytes:65536,usual_ms:100,recovery_ms:200,full_deadline:1300}),logicalId=randomUUID();s.admit(f.binding,r.id,{logicalId,recovery:false});
 const v=s.command(f.binding,r.id,{command_id:randomUUID(),base_version:0,action:'append',text:'left\n右侧\n'}),p=s.command(f.binding,r.id,{command_id:randomUUID(),base_version:v.version,action:'patch',before:'右侧',after:'已改'});assert.equal(s.read(f.binding,r.id).text,'left\n已改\n');assert.equal(p.version,2);
 now=1101;assert.throws(()=>s.check(f.binding,r.id),{code:'ARTIFACT_STAGE_DEADLINE'});s.check(f.binding,r.id,true);assert.equal(s.admit(f.binding,r.id,{logicalId,recovery:true}),true);s.check(f.binding,r.id);now=1201;assert.throws(()=>s.check(f.binding,r.id),{code:'ARTIFACT_STAGE_DEADLINE'});assert.equal(s.admit(f.binding,r.id,{logicalId:randomUUID(),recovery:false}),false);
 const g=fixture(),x=g.store.begin(g.binding,g.plan);for(let i=0;i<256;i++)assert.equal(g.store.admit(g.binding,x.id,{logicalId:randomUUID(),recovery:false}),true);assert.equal(g.store.admit(g.binding,x.id,{logicalId:randomUUID(),recovery:false}),false);
});

test('LA13 identical content in distinct authorized condition/retry operations is isolated; same operation cannot restart a settled job',async()=>{
 const {snapshot,response}=await optionScenario();let calls=0;const f=longRuntimeFixture(async r=>{calls++;if(r.model.id==='MiniMax-M3')return textReply('bootstrap');const u=r.messages.filter(m=>m.role==='user').at(-1)!.text,p=JSON.parse(u.slice(u.indexOf('\n')+1)),pc=p.output_contract;return textReply(JSON.stringify(pc.page==='whole'?{version:'review-page/1.0',page:'whole',snapshot_sha256:p.snapshot_sha256,completeness:response.completeness,requirement_coverage:response.requirement_coverage,global_issues:[]}:{version:'review-page/1.0',page:pc.page,snapshot_sha256:p.snapshot_sha256,claims:response.claims}));});
 await f.runtime.run(f.base);const input={...f.base,purpose:'conclusion_strategy_review' as const,prompt:judgmentReviewPrompt(snapshot),system:naturalReviewSystem},one=randomUUID(),two=randomUUID();await f.runtime.run({...input,business_operation_id:one});await f.runtime.run({...input,business_operation_id:two});assert.equal(calls,5);await assert.rejects(()=>f.runtime.run({...input,business_operation_id:two}),{code:'DRAFT_ALREADY_EXISTS'});assert.equal(calls,5);
});

test('LA14 new mode retains native read/navigation controls without model calls or draft creation',async()=>{
 let calls=0;const f=longRuntimeFixture(async()=>{calls++;return textReply('bootstrap');});await f.runtime.run(f.base);const before=readdirSync(join(f.root,'drafts')).sort();
 await f.runtime.sessionControl!({identity:f.identity,signal:f.base.signal,authorize:()=>true,command:{kind:'snapshot'}});
 await f.runtime.sessionControl!({identity:f.identity,signal:f.base.signal,authorize:()=>true,command:{kind:'navigate',entryId:null,summarize:false}});
 assert.equal(calls,1);assert.deepEqual(readdirSync(join(f.root,'drafts')).sort(),before);
});

test('LA15 one full failed initial→one multi-chunk merged revision→one full paged recheck preserves useful original strategy, never adopts the extra promotion',async()=>{
 const {f:business,snapshot:good,response}=await optionScenario(),bad=structuredClone(good) as any;bad.document.units[0].text+='立即扩大促销。';bad.claims=reviewableClaims(bad.document,bad,business.sources);
 const revision=JSON.stringify({version:'1.1',snapshot_sha256:taskHash(bad),changes:[{claim_id:'C1',unit:good.document!.units[0]}]});let cursor=0,sealed=false,revisionJobs=0;const snapshots:string[]=[],saved:any[]=[];
 const f=longRuntimeFixture(async r=>{
  if(r.model.id==='MiniMax-M3')return textReply('bootstrap');
  if(r.model.id==='mimo-v2.6-pro'){
   const data=r.messages.filter(m=>m.role==='user').at(-1)!.text;if(cursor===0){revisionJobs++;assert.ok(data.includes('立即扩大促销'));}
   if(cursor<revision.length){const ref=cursor===0?{version:0}:latestTool(r);let piece='';for(const c of revision.slice(cursor)){if(Buffer.byteLength(piece+c)>1800)break;piece+=c;}cursor+=piece.length;return toolReply({action:'append',command_id:randomUUID(),base_version:ref.version,text:piece});}
   const ref=latestTool(r);if(!sealed){sealed=true;return toolReply({action:'seal',command_id:randomUUID(),base_version:ref.version});}return textReply(JSON.stringify({version:'artifact-completion/1.0',id:ref.id,draft_version:ref.version,sha256:ref.sha256}));
  }
  const u=r.messages.filter(m=>m.role==='user').at(-1)!.text,p=JSON.parse(u.slice(u.indexOf('\n')+1)),pc=p.output_contract,unsafe=p.current_proposal.units[0].text.includes('立即扩大促销');snapshots.push(p.snapshot_sha256);assert.ok(!('page_contract' in p));
  return textReply(JSON.stringify(pc.page==='whole'?{version:'review-page/1.0',page:'whole',snapshot_sha256:p.snapshot_sha256,completeness:response.completeness,requirement_coverage:response.requirement_coverage,global_issues:unsafe?[{claim_id:'C1',reason:'全文包含无依据的附加促销'}]:[]}:{version:'review-page/1.0',page:pc.page,snapshot_sha256:p.snapshot_sha256,claims:response.claims.map(c=>({...c,verdict:unsafe?'insufficient':'supported'}))}));
 });const base={...f.base,identity:business.identity,business_operation_id:randomUUID()};await f.runtime.run(base);
 const result=await runGeneratedJudgmentReview({snapshot:bad,sources:business.sources,check:()=>{},save:async r=>{saved.push(r);},run:async(purpose,prompt,system)=>(await f.runtime.run({...base,purpose,prompt,system})).text});
 assert.equal(result.rounds.length,2);assert.equal(result.revision_attempted,true);assert.equal(revisionJobs,1);assert.equal(snapshots.length,4);assert.equal(snapshots[0],snapshots[1]);assert.equal(snapshots[2],snapshots[3]);assert.notEqual(snapshots[0],snapshots[2]);assert.equal(saved.filter(r=>r.state==='revising').length,1);assert.equal(saved.filter(r=>r.state==='rechecking').length,1);assert.ok(!result.delivery.includes('立即扩大促销。'));assert.match(result.delivery,/200/);assert.equal(result.rounds[1]!.claims[0]!.qualification!.selectable,true);assert.deepEqual(result.revised_document,good.document);
});

for(const lastMissing of [false,true])test('LA16 fixed 32-page transmission/atomicity (not a quality sample), last missing='+lastMissing,async()=>{
 const {f:business,snapshot:one,response}=await optionScenario(),d=one.document!,units=Array.from({length:32},(_,i)=>({...d.units[0]!,text:d.units[0]!.text+'\n表达标识：'+String.fromCharCode(65+i)}));
 const document=parseReviewableDocument(JSON.stringify({version:d.version,source_sha256:d.source_sha256,units}),one,one.question,d.draft),snapshot={...one,document,claims:reviewableClaims(document,one,business.sources)},ids=snapshot.claims.map(c=>c.id);let pages=0;
 const f=longRuntimeFixture(async r=>{if(r.model.id==='MiniMax-M3')return textReply('bootstrap');const u=r.messages.filter(m=>m.role==='user').at(-1)!.text,p=JSON.parse(u.slice(u.indexOf('\n')+1)),pc=p.output_contract;pages++;assert.deepEqual(p.snapshot.claims.map((c:any)=>c.id),ids);assert.equal(p.current_proposal.units.length,32);
  if(pc.page==='whole')return textReply(JSON.stringify({version:'review-page/1.0',page:'whole',snapshot_sha256:p.snapshot_sha256,completeness:response.completeness,requirement_coverage:response.requirement_coverage.map(v=>({...v,claim_ids:ids})),global_issues:[]}));
  if(lastMissing&&pc.page==='C32')return {...textReply('incomplete'),stop:'length'};
  return textReply(JSON.stringify({version:'review-page/1.0',page:pc.page,snapshot_sha256:p.snapshot_sha256,claims:[{...response.claims[0],claim_id:pc.page}]}));
 });await f.runtime.run(f.base);const run=()=>f.runtime.run({...f.base,purpose:'conclusion_strategy_review',prompt:judgmentReviewPrompt(snapshot),system:naturalReviewSystem});
 if(lastMissing)await assert.rejects(run,e=>{assert.equal((e as {diagnostic:string}).diagnostic,'OUTPUT_LIMIT');return true;});else{const reply=await run();assert.ok(Buffer.byteLength(reply.text)>16384);const compiled=compileJudgmentRound(reply.text,snapshot,'initial',business.sources);assert.deepEqual(compiled.claims.map(c=>c.claim_id),ids);assert.equal(compiled.completeness!.verdict,'complete');}
 assert.equal(pages,33);assert.equal(f.ledger.read(f.identity.task_id).length,34);
});

test('LA17 draft1.0 historical exact command remains readable/replayable without rewrite or new recovery; 1.1 binding order is stable',()=>{
 const f=fixture(),r=f.store.begin(f.binding,f.plan),c={command_id:randomUUID(),base_version:0,action:'append' as const,text:'原件\n'},ack=f.store.command(f.binding,r.id,c),path=join(f.root,r.id+'.json'),record=JSON.parse(readFileSync(path,'utf8'));record.version='1.0';record.commands[c.command_id].digest=digest(JSON.stringify(c));writeFileSync(path,JSON.stringify(record));const original=readFileSync(path);
 const reordered={kind:f.binding.kind,config_sha256:f.binding.config_sha256,scope_sha256:f.binding.scope_sha256,operation_id:f.binding.operation_id,task_id:f.binding.task_id};
 const reopened=createLocalAnalysisDraftStore({root:f.root});assert.deepEqual(reopened.read(reordered,r.id).ref,ack);assert.deepEqual(reopened.command(reordered,r.id,c),ack);assert.deepEqual(readFileSync(path),original);assert.throws(()=>reopened.begin(reordered,f.plan),{code:'DRAFT_ALREADY_EXISTS'});assert.deepEqual(readFileSync(path),original);
 // Legacy wire-sensitive conflict is history, not retroactively relabeled repaired.
 assert.throws(()=>reopened.command(reordered,r.id,{action:'append',text:c.text,base_version:0,command_id:c.command_id}),{code:'DRAFT_COMMAND_CONFLICT'});assert.deepEqual(readFileSync(path),original);
});

// Fixed115 findings: use fresh stores and public application/runtime seams only.
test('LA18 denied or already-cancelled entry creates no persistent draft or consumed operation',async()=>{
 for(const cancelled of [false,true]){
  const f=fixture(),before=readdirSync(f.root),abort=new AbortController();if(cancelled)abort.abort();let calls=0;
  const runtime=withLongAnalysisArtifacts({runtime:{run:async input=>{calls++;if(!input.authorize())throw Object.assign(new Error('AUTHORITY_REQUIRED'),{code:'AUTHORITY_REQUIRED'});return {text:'done',tools:[]};}},store:f.store,enabled:()=>true,reportMs:()=>120000});
  await assert.rejects(runtime.run({identity:{...f.binding,revision:'1',run_id:randomUUID(),attempt_id:randomUUID(),grant_id:randomUUID()},prompt:'denied',system:'',tools:[],signal:abort.signal,authorize:()=>false}),{code:cancelled?'CANCELLED':'AUTHORITY_REQUIRED'});
  assert.deepEqual(readdirSync(f.root),before,'Denied admission must leave no draft/lock/pending or consumed job');assert.equal(calls,0);
 }
});

test('LA19 one business operation retains its 300-second deadline across preview, formation and review identities',async t=>{
 const original=await optionScenario(),command=randomUUID();let now=1000;t.mock.method(Date,'now',()=>now);const f=fixture();
 const identity={...original.f.identity},preview={...identity,run_id:randomUUID(),attempt_id:randomUUID(),operation_id:randomUUID()};
 const runtime=withLongAnalysisArtifacts({store:f.store,enabled:()=>true,reportMs:()=>120000,runtime:{run:async input=>{
  if(input.purpose==='proposal_prepare'){now+=150000;return {text:'actual proposal draft',tools:[]};}
  if(input.purpose==='report_edit'){
   const tool=input.tools.find(x=>x.name==='build_artifact')!;
   const a=await tool.execute({action:'append',command_id:randomUUID(),base_version:0,text:'complete report bytes'},input.signal) as {version:number};
   const ref=await tool.execute({action:'seal',command_id:randomUUID(),base_version:a.version},input.signal) as {id:string;version:number;sha256:string};now+=100000;
   return {text:JSON.stringify({version:'artifact-completion/1.0',id:ref.id,draft_version:ref.version,sha256:ref.sha256}),tools:[]};
  }
  now+=30000;const p=JSON.parse(input.prompt.slice(input.prompt.indexOf('\n')+1)),page=p.output_contract.page;
  return {text:JSON.stringify(page==='whole'?{version:'review-page/1.0',page,snapshot_sha256:p.snapshot_sha256,completeness:original.response.completeness,requirement_coverage:original.response.requirement_coverage,global_issues:[]}:{version:'review-page/1.0',page,snapshot_sha256:p.snapshot_sha256,claims:original.response.claims.filter(c=>c.claim_id===page)}),tools:[]};
 }}});
 const base={business_operation_id:command,system:'',tools:[],signal:new AbortController().signal,authorize:()=>true};
 await runtime.run({...base,identity:preview,purpose:'proposal_prepare',prompt:'preview'});
 await runtime.run({...base,identity:preview,purpose:'report_edit',prompt:'formation'});
 await assert.rejects(runtime.run({...base,identity,purpose:'conclusion_strategy_review',prompt:judgmentReviewPrompt(original.snapshot)}),{code:'ARTIFACT_STAGE_DEADLINE'});
 assert.ok(now-1000>300000);
});

test('LA20 actual Application projects the trusted business command onto its first model invocation',async()=>{
 const f=await optionScenario(),command=randomUUID(),seen:unknown[]=[];
 const {createOpenAnalysisApplication}=await import('../../../packages/application/open-analysis.ts');
 const app=createOpenAnalysisApplication({businessOperationId:command,runtime:{run:async input=>{seen.push(input.business_operation_id);throw Object.assign(new Error('CONTROLLED_BOUNDARY'),{code:'CONTROLLED_BOUNDARY'});}},loadSelectedSource:async()=>f.f.sources,isAuthorized:()=>true,verify:async()=>assert.fail('not requested'),saveFramework:async()=>assert.fail('not requested'),saveOutcome:async()=>assert.fail('not requested')} as Parameters<typeof createOpenAnalysisApplication>[0]);
 await assert.rejects(app.run({identity:f.f.identity,question:'原始获准问题',signal:new AbortController().signal}));
 assert.deepEqual(seen,[command]);
});

test('LA21 explicit fixed-SDK new-task route rejects a structurally invalid whole batch before any business effect',async()=>{
 const f=fixture(),ledger=createLocalAnalysisRequestLedger({projectRoot:f.root});let physical=0,effects=0;
 const {kind,...bindingIdentity}=f.binding;void kind;const identity={...bindingIdentity,revision:'1',run_id:randomUUID(),attempt_id:randomUUID(),grant_id:randomUUID()};
 const native=createPiSessionOpenAnalysisRuntime({projectRoot:f.root,ledger,nativeObjectArguments:true,firstLoop:'v0.2',credentials:createApprovedProviderCredentials({environment:{}}),modelTransport:async()=>++physical===1?{stop:'tools',content:[{kind:'tool',id:randomUUID(),name:'inspect_selected',arguments:{}},{kind:'tool',id:randomUUID(),name:'ask_user',arguments:{question:7}}],usage:{inputTokens:7,outputTokens:3}}:textReply('本轮未执行错误批次。')} as Parameters<typeof createPiSessionOpenAnalysisRuntime>[0]);
 const tools=[{name:'inspect_selected',description:'Read synthetic selected materials',parameters:{type:'object',properties:{},additionalProperties:false},execute:async()=>{effects++;return {selected:true};}},{name:'ask_user',description:'Ask actual missing question',parameters:{type:'object',properties:{question:{type:'string'}},required:['question'],additionalProperties:false},execute:async()=>{effects++;return {waiting:true};}}];
 let failure='';try{await native.run({identity,prompt:'合成批屏障',system:'',tools,capabilityTools:tools,signal:new AbortController().signal,authorize:()=>true} as Parameters<typeof native.run>[0]);}catch(error){failure=String((error as {code?:string}).code??error);/* A rejected batch may terminate; no executor may run. */}
 await native.collect?.(identity.task_id);assert.equal(effects,0,'The invalid second call must fence the entire batch, including the otherwise-valid first call');assert.ok(physical>0,'Required real installed-SDK call boundary, failure='+failure);
});

for(const shared of [false,true])test('LA22 original personal Profile new synthetic Task uses native write/edit/read, supervised calculation, independent verification, save and reopen; shared='+shared,{timeout:20000,skip:process.platform!=='darwin'?'real macOS supervisor is required; no inherited sandbox exception':false},async()=>{
 const {createPersonalOpenAnalysisWorkspace}=await import('../../../profiles/personal/open-analysis.ts');
 const {createMemberSourceInspector}=await import('../../../adapters/analytics-duckdb/member-source-inspection.ts');
 const f=fixture(),id=randomUUID(),sid=randomUUID();let calls=0,reportStage=0;let reportContent='';const failures:string[]=[];
 const program='# complete bounded synthetic program\n'.repeat(150)+'x=json.load(open(SOURCES[0]))\nrows=x["inspection"]["sources"][0]["sheets"][0]["rows"][1:]\nvalues=[int(next(c["value"] for c in row["cells"] if c["column"]=="A")) for row in rows]\njson.dump({"value":str(sum(values)),"rows":len(rows)},open(os.path.join(OUTPUT,"result.json"),"w"))\n';
 const options={...(shared?{longArtifacts:{enabled:()=>true,reportMs:()=>120000 as const}}:{}),projectRoot:f.root,project_id:randomUUID(),requireSemanticAssessment:true,onFailure:(code:string)=>failures.push(code),toolchain:{pythonExecutable:'/opt/homebrew/bin/python3',pythonVersion:'3.14.4'},inspect:createMemberSourceInspector('/opt/homebrew/bin/python3'),authorizeConfiguration:async()=>({config_sha256:'b'.repeat(64)}),createRuntime:(ledger:ReturnType<typeof createLocalAnalysisRequestLedger>)=>createPiSessionOpenAnalysisRuntime({projectRoot:f.root,ledger,nativeObjectArguments:true,firstLoop:'v0.2',...(shared?{sharedWorkRecovery:'v1' as const,longArtifactsForTask:()=>true,r1r4:{contextAdmission:{policyVersion:'offline119',protocolOverheadTokens:128,safetyMarginTokens:512}}}:{}),credentials:createApprovedProviderCredentials({environment:{}}),reportThinking:'off',reviewPolicy:()=>true,reportPro60ForTask:()=>true,reportTimeoutForTask:()=>120000,judgmentReviewTimeoutForTask:()=>60000,modelTransport:async(request):Promise<ModelReply>=>{
  const reply=await(async()=>{
  calls++;if(calls>(shared?20:15))throw new Error('Offline path exceeded preregistered bound');
  const reply=(name:string,args:JsonObject):ModelReply=>({stop:'tools',content:[{kind:'tool',id:'synthetic-'+calls,name,arguments:args}],usage:{inputTokens:7,outputTokens:3}});
  if(calls===1)return reply('inspect_selected',{});
  if(calls===2)return reply('describe_business',{purpose:'Quantity sum',object:'Selected quantities',scope:'Only selected CSV',deliverables:['Independently verified sum'],hypotheses:[],unknowns:[],execution_scope:[{source_id:sid,sheet_id:'csv',filters:[]}]});
  if(calls===3)return reply('interpret_meaning',{interpretations:[{dimension:'unit',value:'items',status:'clear',unscaled_unit:{input_label:'items',output_label:'items'},evidence:[{source:{source_id:sid,sheet_id:'csv',row:'1',column:'A'}}]}],conflicts:[]});
  if(calls===4)return reply('set_framework',{goal:'Quantity sum',source_id:sid,sheet_id:'csv',operation:'sum',column:'A',unit:'items',group_mode:'none',filters:[]});
  if(calls===5)return reply('read_tool_contract',{name:'read_analysis_evidence'});
  if(calls===6)return reply('read_analysis_evidence',{required_current_plan:true});
  if(calls===7)return reply('read_tool_contract',{name:'calculate_and_verify'});
  if(calls===8)return reply('write',{path:'draft/analysis.py',content:'# PROGRAM\n'});
  if(calls===9)return reply('edit',{path:'draft/analysis.py',edits:[{oldText:'# PROGRAM\n',newText:program}]});
  if(calls===10)return reply('read',{path:'draft/analysis.py'});
  if(calls===11)return reply('calculate_and_verify',{code_path:'draft/analysis.py'});
  const marker='JuanerAI.report-edit.v1\n',message=request.messages.findLast(m=>m.text.includes(marker))?.text;
  if(message){assert.equal(request.model.id,'mimo-v2.6-pro');assert.equal(request.maxOutputTokens,4096);const data=JSON.parse(message.slice(message.indexOf(marker)+marker.length));const text=JSON.stringify({version:'1.5',status:'ready',interpretations:[{fact_refs:[data.numeric_facts[0].reference_id],interpretation:'所选数量合计10，独立核验范围不包含原因或行动。'}]});if(!shared)return textReply(text);reportContent=text;if(reportStage++===0)return reply('write',{path:'draft/report.json',content:reportContent});if(reportStage===2)return reply('complete_artifact',{});return textReply('完整报告已提交。');}
  return textReply('所选数量合计10，独立核验；未作业务行动或因果认证。');
 })();return !shared?reply:{...reply,outcome:{model:{provider:request.model.provider,id:request.model.id,protocol:request.model.protocol},stop:reply.stop,physicalStatus:'response-received',usageFinal:true,usage:{inputTokens:{kind:'known',value:reply.usage.inputTokens},outputTokens:{kind:'known',value:reply.usage.outputTokens}},diagnostic:'COMPLETE'}};
 }})};
 let open=createPersonalOpenAnalysisWorkspace(options);
 try{
  await open.submit({version:'1.0',command_id:id,question:'Sum selected quantities; unit is items.',confirmed:true,sources:[{source_id:sid,display_name:'synthetic.csv',format:'csv',bytes:Buffer.from('quantity\n7\n3\n')}]});
  await open.collect();const task=open.read(id);writeFileSync(join(f.root,'actual-profile-path-result.json'),JSON.stringify({task,failures,calls}));
  assert.equal(task.state,'saved',JSON.stringify(failures));assert.equal(task.outcome!.calculation.value,'10');assert.equal(task.outcome!.verification.grade,'independent_arithmetic');
  const codeRoot=join(f.root,'.juanerai','open-code'),files=readdirSync(codeRoot).filter(p=>/^[a-f0-9-]{36}\.json$/.test(p));assert.equal(files.length,1);const receipt=JSON.parse(readFileSync(join(codeRoot,files[0]!),'utf8'));assert.equal(receipt.code_sha256,digest(program));assert.equal(JSON.parse(readFileSync(join(codeRoot,receipt.execution_id+'.qualified.json'),'utf8')).status,'qualified');
  const before=calls,outcome=structuredClone(task.outcome);await open.close();open=createPersonalOpenAnalysisWorkspace(options);assert.deepEqual(open.read(id).outcome,outcome);assert.equal(calls,before,'Reopen may not dispatch even a synthetic model');
  const snapshot=await open.sessionControl(id,{version:'1.0',expected_revision:task.identity.revision,command:{kind:'snapshot'}});assert.equal(snapshot.facts?.availability,'available');assert.equal(calls,before);
 }finally{await open.close();}
});

test('LA23 fixed .5 original complete useful proposal→Pro formation→Flash isolated review→saved quick/pro/cards/export stays same-version',async()=>{
 const original=await optionScenario(),f=fixture(),ledger=createLocalAnalysisRequestLedger({projectRoot:f.root}),models:string[]=[];
 const {createLocalOpenAnalysisStore}=await import('../../../adapters/storage-local/open-analysis.ts');
 const {createOpenAnalysisWorkspace}=await import('../../../packages/application/open-analysis-workspace.ts');
 const {verifyOpenAnalysisIntegerSum}=await import('../../../adapters/analytics-duckdb/open-analysis-verification.ts');
 const native=createPiSessionOpenAnalysisRuntime({projectRoot:f.root,ledger,firstLoop:'v0.2',sharedWorkRecovery:'v1',r1r4:{contextAdmission:{policyVersion:'ah-direct-purpose',protocolOverheadTokens:128,safetyMarginTokens:512}},nativeObjectArguments:true,reviewPolicy:()=>true,reportPro60ForTask:()=>true,reportTimeoutForTask:()=>120000,judgmentReviewTimeoutForTask:()=>60000,reportThinking:'off',credentials:createApprovedProviderCredentials({environment:{}}),modelTransport:async r=>{const observe=(reply:ModelReply):ModelReply=>({...reply,outcome:{model:r.model,stop:reply.stop,physicalStatus:'response-received',usageFinal:true,usage:{inputTokens:{kind:'known',value:reply.usage.inputTokens},outputTokens:{kind:'known',value:reply.usage.outputTokens}},diagnostic:'COMPLETE'}});
  models.push(r.model.id);assert.equal(r.maxOutputTokens,4096);assert.equal(r.messages.flatMap(m=>m.tools??[]).length,0);
  if(r.model.id==='MiniMax-M3')return observe(textReply('Synthetic current proposal only'));
  if(r.model.id==='mimo-v2.6-pro')return observe(textReply(JSON.stringify({version:original.snapshot.document!.version,source_sha256:original.snapshot.document!.source_sha256,units:original.snapshot.document!.units})));
  return observe(textReply(JSON.stringify(original.response)));
 }});
 const base={identity:original.f.identity,prompt:'BOOTSTRAP',system:'Synthetic',tools:[],signal:new AbortController().signal,authorize:()=>true};
 await native.run(base);const formed=await native.run({...base,purpose:'report_edit',prompt:'Original full proposal formation'});
 const {document,...baseline}=original.snapshot;assert.ok(document);
 const parsed=parseReviewableDocument(formed.text,baseline,baseline.question,document.draft);assert.deepEqual(parsed,document);
 const snapshot={...baseline,document:parsed,claims:reviewableClaims(parsed,baseline,original.f.sources)};
 const review=await runGeneratedJudgmentReview({snapshot,sources:original.f.sources,check:()=>{},save:async()=>{},run:async(purpose,prompt,system)=>(await native.run({...base,purpose,prompt,system})).text});
 assert.equal(review.state,'completed');assert.equal(review.rounds.length,1);assert.equal(review.rounds[0]!.claims[0]!.qualification!.selectable,true);assert.match(review.delivery,/200/);assert.deepEqual(models,['MiniMax-M3','mimo-v2.6-pro','mimo-v2.6-flash']);
 const store=createLocalOpenAnalysisStore({projectRoot:f.root});store.create({identity:original.f.identity,source:original.f.sources,question:snapshot.question,review_policy:'conclusion_strategy_v1'} as never);const lease=store.begin(original.f.identity.task_id);store.saveFramework(lease,{version:'1.0',identity:original.f.identity,origin:'MODEL_PROPOSAL',plan:original.f.plan});
 const outcome={version:'1.0',outcome_id:randomUUID(),identity:original.f.identity,framework:original.f.plan,calculation:original.f.calculation,verification:original.f.evidence.verified_calculations[0]!.verification,numeric_report:snapshot.report,judgment_review:review,explanation:{kind:'MODEL_EXPLANATION',text:review.delivery},human_judgment:'not_recorded'};store.saveOutcome(lease,outcome as never);
 const workspace=createOpenAnalysisWorkspace({store,ledger,runtime:{run:async()=>assert.fail('Read consumers must not generate')},inspect:async()=>original.f.sources,verify:verifyOpenAnalysisIntegerSum,authorizeConfiguration:async()=>({config_sha256:original.f.identity.config_sha256})});
 try{const saved=createLocalOpenAnalysisStore({projectRoot:f.root}).read(original.f.identity.task_id)!;assert.deepEqual(saved.outcome,outcome);await assert111Consumers(workspace,saved,document.units[0]!.text,true);}finally{await workspace.close();}
});

test('LA24 fixed new-task route refuses unpublished115 workPolicy opt-in before any Task/model or SDK workaround',()=>{
 const f=fixture(),ledger=createLocalAnalysisRequestLedger({projectRoot:f.root});assert.throws(()=>createPiSessionOpenAnalysisRuntime({projectRoot:f.root,ledger,longArtifactsForTask:()=>true,credentials:createApprovedProviderCredentials({environment:{}}),modelTransport:async()=>assert.fail('Unsupported contract must not reach transport')}),{code:'CAPABILITY_UNAVAILABLE'});
 assert.ok(ledger.pending);assert.equal(ledger.pending().length,0);
});

test('LA25 .3 opt-in refuses an already-consumed synthetic legacy Task without new owner, replay or ledger change',async()=>{
 const f=fixture(),ledger=createLocalAnalysisRequestLedger({projectRoot:f.root}),{kind,...b}=f.binding;void kind;const identity={...b,revision:'1',run_id:randomUUID(),attempt_id:randomUUID(),grant_id:randomUUID()};let calls=0;
 const common={projectRoot:f.root,ledger,nativeObjectArguments:true,credentials:createApprovedProviderCredentials({environment:{}}),modelTransport:async()=>{calls++;return textReply('Synthetic settled legacy');}},input={identity,prompt:'legacy',system:'',tools:[],signal:new AbortController().signal,authorize:()=>true};
 await createPiSessionOpenAnalysisRuntime(common).run(input);const before=ledger.read(identity.task_id),state=createPersistentRuntimeState({projectRoot:f.root}),audit=state.readAudit(identity.task_id),budget=state.readAccounting(identity.task_id);
 await assert.rejects(createPiSessionOpenAnalysisRuntime({...common,firstLoop:'v0.2'}).run(input),{code:'CONFIGURATION_CHANGED'});assert.equal(calls,1);assert.deepEqual(ledger.read(identity.task_id),before);assert.deepEqual(state.readAudit(identity.task_id),audit);assert.deepEqual(state.readAccounting(identity.task_id),budget);
});

test('LA26 .3 structural correction exhausts once and stays stopped after reopen with no hidden model or business effects',async()=>{
 const f=fixture(),ledger=createLocalAnalysisRequestLedger({projectRoot:f.root}),{kind,...b}=f.binding;void kind;const identity={...b,revision:'1',run_id:randomUUID(),attempt_id:randomUUID(),grant_id:randomUUID()};let calls=0,effects=0;
 const common={projectRoot:f.root,ledger,firstLoop:'v0.2' as const,nativeObjectArguments:true,credentials:createApprovedProviderCredentials({environment:{}}),modelTransport:async():Promise<ModelReply>=>{calls++;assert.ok(calls<=2);return {stop:'tools',content:[{kind:'tool',id:'invalid-'+calls,name:'ask_user',arguments:{question:7}}],usage:{inputTokens:7,outputTokens:3}};}},input={identity,prompt:'Repeated invalid structure',system:'',tools:[{name:'ask_user',description:'Only string question',parameters:{type:'object',properties:{question:{type:'string'}},required:['question'],additionalProperties:false},execute:async()=>{effects++;return {};}}],signal:new AbortController().signal,authorize:()=>true};
 await assert.rejects(createPiSessionOpenAnalysisRuntime(common).run(input));assert.equal(calls,2);assert.equal(effects,0);
 const reopened=createPiSessionOpenAnalysisRuntime(common);await assert.rejects(reopened.run(input));assert.equal(calls,2);assert.equal(effects,0);
 const facts=await reopened.sessionControl!({identity,command:{kind:'snapshot'},signal:input.signal,authorize:()=>true});assert.equal(facts.facts?.availability,'available');if(facts.facts?.availability==='available'){assert.equal(facts.facts.admission.availability,'known');if(facts.facts.admission.availability==='known')assert.equal(facts.facts.admission.terminal,true);}assert.equal(calls,2);
});

for(const overDeadline of [false,true])test('LA27 actual Personal Profile→Workspace preview→formation→paged review shares one machine deadline, over='+overDeadline,async()=>{
 const original=await optionScenario(),f=fixture();
 const {createPersonalOpenAnalysisWorkspace}=await import('../../../profiles/personal/open-analysis.ts');
 const {createLocalOpenAnalysisStore}=await import('../../../adapters/storage-local/open-analysis.ts');
 const store=createLocalOpenAnalysisStore({projectRoot:f.root}),review=completeJudgmentReview(original.snapshot,compileJudgmentRound(JSON.stringify(original.response),original.snapshot,'initial',original.f.sources));
 store.create({identity:original.f.identity,source:original.f.sources,question:original.snapshot.question,review_policy:'conclusion_strategy_v1'} as never);const lease=store.begin(original.f.identity.task_id);store.saveFramework(lease,{version:'1.0',identity:original.f.identity,origin:'MODEL_PROPOSAL',plan:original.f.plan});
 const outcome={version:'1.0',outcome_id:randomUUID(),identity:original.f.identity,framework:original.f.plan,calculation:original.f.calculation,verification:original.f.evidence.verified_calculations[0]!.verification,numeric_report:original.snapshot.report,judgment_review:review,explanation:{kind:'MODEL_EXPLANATION',text:review.delivery},human_judgment:'not_recorded'};store.saveOutcome(lease,outcome as never);
 let now=Date.now(),pages=0;const start=now,command_id=randomUUID(),seen:string[]=[];const previousNow=Date.now;Date.now=()=>now;
 const workspace=createPersonalOpenAnalysisWorkspace({projectRoot:f.root,inspect:async()=>original.f.sources,authorizeConfiguration:async()=>({config_sha256:original.f.identity.config_sha256}),longArtifacts:{enabled:()=>true,reportMs:()=>120000},runtime:{run:async input=>{
  assert.equal(input.business_operation_id,command_id);seen.push(input.purpose??'analysis');
  if(input.purpose==='report_edit'){
   const payload=JSON.parse(input.prompt.slice(input.prompt.indexOf('\n')+1)),tool=input.tools.find(t=>t.name==='build_artifact');assert.ok(tool);
   const text=JSON.stringify({version:'1.4',source_sha256:payload.source_sha256,units:original.snapshot.document!.units});let version=0;
   // Every call is a complete envelope; execution sees only the sealed full document.
   for(let offset=0;offset<text.length;){let part='';for(const c of text.slice(offset)){if(Buffer.byteLength(part+c)>1800)break;part+=c;}offset+=part.length;const ack=await tool.execute({action:'append',command_id:randomUUID(),base_version:version,text:part},input.signal);assert.ok(ack&&typeof ack==='object');version=Number(Reflect.get(ack,'version'));}
   const ref=await tool.execute({action:'seal',command_id:randomUUID(),base_version:version},input.signal);assert.ok(ref&&typeof ref==='object');now+=overDeadline?100000:40000;
   return {text:JSON.stringify({version:'artifact-completion/1.0',id:Reflect.get(ref,'id'),draft_version:Reflect.get(ref,'version'),sha256:Reflect.get(ref,'sha256')}),tools:[]};
  }
  if(input.purpose==='conclusion_strategy_review'){
   const p=JSON.parse(input.prompt.slice(input.prompt.indexOf('\n')+1)),page=p.output_contract.page;pages++;now+=overDeadline?30000:10000;
   return {text:JSON.stringify(page==='whole'?{version:'review-page/1.0',page,snapshot_sha256:p.snapshot_sha256,completeness:original.response.completeness,requirement_coverage:original.response.requirement_coverage,global_issues:[]}:{version:'review-page/1.0',page,snapshot_sha256:p.snapshot_sha256,claims:original.response.claims.filter(c=>c.claim_id===page)}),tools:[]};
  }
  now+=overDeadline?150000:50000;return {text:original.snapshot.document!.draft,tools:[]};
 }}});
 try{
  await workspace.previewRevision(original.f.identity.task_id,{version:'1.0',command_id,expected_revision:'1',question:original.snapshot.question});await workspace.collect();
  const saved=workspace.read(original.f.identity.task_id),update=saved.review_updates?.at(-1);assert.ok(update,JSON.stringify(saved.revision_previews));assert.equal(pages,2);assert.equal(seen.length,4);assert.deepEqual(saved.outcome,outcome,'Preview never rewrites the old saved report');
  if(overDeadline){assert.equal(now-start,310000);assert.equal(update.review.state,'failed');assert.equal(update.review.failure_code,'ARTIFACT_STAGE_DEADLINE');}
  else{assert.equal(update.review.state,'completed');assert.equal(update.review.rounds.at(-1)!.claims[0]!.qualification!.selectable,true);await assert111Consumers(workspace,saved,original.snapshot.document!.units[0]!.text,true);}
 }finally{await workspace.close();Date.now=previousNow;}
});

for(const revoke of [false,true])test('LA28 installed native preparation→current authority→original executor, revoke='+revoke,async()=>{
 const f=fixture(),ledger=createLocalAnalysisRequestLedger({projectRoot:f.root}),{kind,...binding}=f.binding;void kind;const identity={...binding,revision:'1',run_id:randomUUID(),attempt_id:randomUUID(),grant_id:randomUUID()};let allowed=true,calls=0,effects=0;
 const runtime=createPiSessionOpenAnalysisRuntime({projectRoot:f.root,ledger,firstLoop:'v0.2',nativeObjectArguments:true,credentials:createApprovedProviderCredentials({environment:{}}),modelTransport:async():Promise<ModelReply>=>{
  calls++;if(calls>2)throw new Error('Offline preparation bound exceeded');if(calls===2)return textReply('Prepared effect completed');if(revoke)allowed=false;
  return {stop:'tools',content:[{kind:'tool',id:'native-preparation',name:'interpret_meaning',arguments:{count:'7'}}],usage:{inputTokens:7,outputTokens:3}};
 }});
 const input={identity,prompt:'Synthetic preparation boundary',system:'',signal:new AbortController().signal,authorize:()=>allowed,tools:[{name:'interpret_meaning',description:'Synthetic instance of the approved native parameter policy',parameters:{type:'object',properties:{count:{type:'integer',minimum:0}},required:['count'],additionalProperties:false},execute:async(args:Readonly<Record<string,unknown>>)=>{assert.equal(allowed,true);assert.equal(args.count,7);effects++;return {count:args.count};}}]};
 if(revoke){await assert.rejects(runtime.run(input));assert.equal(effects,0);assert.equal(calls,1);}
 else{await runtime.run(input);assert.equal(effects,1);assert.equal(calls,2);const events=createPersistentRuntimeState({projectRoot:f.root}).readAudit(identity.task_id);assert.ok(events.some(e=>e.kind==='tool.prepared'&&e.toolName==='interpret_meaning'));}
});

test('LA29 extracted Browser production composition is passive and preserves the default configuration identity',async()=>{
 const {createIndependentBrowserOpenModel}=await import('../../../apps/browser/service-main.ts');let reads=0,calls=0;
 const credentials=createApprovedProviderCredentials({environment:{LLM_API_KEY:'offline-synthetic-only',LLM_BASE_URL:'https://api.minimaxi.com/anthropic',LLM_MODEL:'MiniMax-M3'},readText:async()=>{reads++;assert.fail('No real credential file may be read');}});
 const model=createIndependentBrowserOpenModel({options:{},credentials,documentReader:{pythonExecutable:'/offline/not-executed'},modelTransport:async()=>{calls++;assert.fail('Passive composition must not dispatch');}});assert.equal(reads,0);assert.equal(calls,0);
 const config=await model.authorizeConfiguration();assert.equal(config.config_sha256,taskHash({version:'1.0',primary:{provider:'minimax-cn',host:'api.minimaxi.com',state:'configured',model:'MiniMax-M3',endpoint:'https://api.minimaxi.com/anthropic'},backup:{provider:'xiaomi-token-plan-cn',host:'token-plan-cn.xiaomimimo.com',state:'missing',model:'mimo-v2.6-flash'}}));assert.equal(reads,0);assert.equal(calls,0);
});

for(const opted of [false,true])test('LA30 actual Browser composition selects whole-batch SDK admission only when explicitly opted, opt='+opted,async()=>{
 const {createIndependentBrowserOpenModel}=await import('../../../apps/browser/service-main.ts'),f=fixture(),ledger=createLocalAnalysisRequestLedger({projectRoot:f.root});let calls=0,effects=0;
 const {kind,...binding}=f.binding;void kind;const identity={...binding,revision:'1',run_id:randomUUID(),attempt_id:randomUUID(),grant_id:randomUUID()};
 const model=createIndependentBrowserOpenModel({options:{...(opted?{harnessFirstLoop:{version:'v0.2' as const,request_admission:{policy_version:'offline117',protocol_overhead_tokens:128,safety_margin_tokens:512}}}:{})},credentials:createApprovedProviderCredentials({environment:{}}),documentReader:{pythonExecutable:'/offline/not-executed'},modelTransport:async request=>{const reply:ModelReply=++calls===1?{stop:'tools',content:[{kind:'tool',id:randomUUID(),name:'inspect_selected',arguments:{}},{kind:'tool',id:randomUUID(),name:'ask_user',arguments:{question:7}}],usage:{inputTokens:7,outputTokens:3}}:textReply('本轮结束。');return !opted?reply:{...reply,outcome:{model:{provider:request.model.provider,id:request.model.id,protocol:request.model.protocol},stop:reply.stop,physicalStatus:'response-received',usageFinal:true,usage:{inputTokens:{kind:'known',value:7},outputTokens:{kind:'known',value:3}},diagnostic:'COMPLETE'}};}});
 const runtime=model.createRuntime(ledger,{projectRoot:f.root,reviewPolicyForTask:()=>false}),tools=[{name:'inspect_selected',description:'Read synthetic materials',parameters:{type:'object',properties:{},additionalProperties:false},execute:async()=>{effects++;return {selected:true};}},{name:'ask_user',description:'Only string question',parameters:{type:'object',properties:{question:{type:'string'}},required:['question'],additionalProperties:false},execute:async()=>{effects++;return {};}}];
 try{await runtime.run({identity,prompt:'Synthetic Browser composition proof',system:'',tools,capabilityTools:tools,signal:new AbortController().signal,authorize:()=>true});}catch{/* A rejected batch may terminate; inspect the actual effects. */}await runtime.collect?.(identity.task_id);
 assert.equal(effects,opted?0:1);assert.ok(calls>0);
});

test('LA31 Browser explicit selection is bounded, immutable and part of the new configuration; defaults stay unchanged',async()=>{
 const {createIndependentBrowserOpenModel}=await import('../../../apps/browser/service-main.ts');let reads=0,calls=0;
 const credentials=createApprovedProviderCredentials({environment:{LLM_API_KEY:'offline-synthetic-only',LLM_BASE_URL:'https://api.minimaxi.com/anthropic',LLM_MODEL:'MiniMax-M3'},readText:async()=>{reads++;assert.fail('No credential file');}}),common={credentials,documentReader:{pythonExecutable:'/offline/not-executed'},modelTransport:async()=>{calls++;return textReply('Synthetic');}};
 for(const firstLoop of ['auto',true,null])assert.throws(()=>createIndependentBrowserOpenModel({...common,options:{harnessFirstLoop:{version:firstLoop,request_admission:{}}} as never}),/FIRST_LOOP_AUTHORITY_INVALID/);
 assert.equal(reads,0);assert.equal(calls,0);
 const harness={version:'v0.2' as const,request_admission:{policy_version:'offline117',protocol_overhead_tokens:128,safety_margin_tokens:512}},options:{harnessFirstLoop?:typeof harness}={harnessFirstLoop:harness},selected=createIndependentBrowserOpenModel({...common,options});delete options.harnessFirstLoop;
 const selectedHash=(await selected.authorizeConfiguration()).config_sha256,defaultHash=(await createIndependentBrowserOpenModel({...common,options:{}}).authorizeConfiguration()).config_sha256;
 assert.notEqual(selectedHash,defaultHash);assert.equal(selectedHash,taskHash({version:'1.0',harness_first_loop:harness,primary:{provider:'minimax-cn',host:'api.minimaxi.com',state:'configured',model:'MiniMax-M3',endpoint:'https://api.minimaxi.com/anthropic'},backup:{provider:'xiaomi-token-plan-cn',host:'token-plan-cn.xiaomimimo.com',state:'missing',model:'mimo-v2.6-flash'}}));assert.equal(reads,0);assert.equal(calls,0);
});

for(const mode of ['legacy','r1','r1-length','shared'] as const)test('LA32 Browser production assembly→Profile→actual Workspace preview→Pro/Flash→same-version delivery stays offline and independent of repair-2, mode='+mode,async()=>{
 const r1=mode!=='legacy';
 const {createIndependentBrowserOpenModel}=await import('../../../apps/browser/service-main.ts'),{createPersonalOpenAnalysisWorkspace}=await import('../../../profiles/personal/open-analysis.ts'),{createLocalOpenAnalysisStore}=await import('../../../adapters/storage-local/open-analysis.ts');
 const original=await optionScenario(),f=fixture(),id=original.f.identity.task_id,models:string[]=[],packets:any[]=[];let reportText='',cursor=0,sealed=false,completed=false;
 const store=createLocalOpenAnalysisStore({projectRoot:f.root}),initial=completeJudgmentReview(original.snapshot,compileJudgmentRound(JSON.stringify(original.response),original.snapshot,'initial',original.f.sources));
 store.create({identity:original.f.identity,source:original.f.sources,question:original.snapshot.question,review_policy:'conclusion_strategy_v1'} as never);const lease=store.begin(id);store.saveFramework(lease,{version:'1.0',identity:original.f.identity,origin:'MODEL_PROPOSAL',plan:original.f.plan});
 const outcome={version:'1.0',outcome_id:randomUUID(),identity:original.f.identity,framework:original.f.plan,calculation:original.f.calculation,verification:original.f.evidence.verified_calculations[0]!.verification,numeric_report:original.snapshot.report,judgment_review:initial,explanation:{kind:'MODEL_EXPLANATION',text:initial.delivery},human_judgment:'not_recorded'};store.saveOutcome(lease,outcome as never);
 const model=createIndependentBrowserOpenModel({options:{...(r1?{harnessFirstLoop:{version:'v0.2' as const,request_admission:{policy_version:'offline117',protocol_overhead_tokens:128,safety_margin_tokens:512},...(mode==='shared'?{work_recovery:'v1' as const}:{})}}:{}),judgmentReviewAllowed:true,mimoNoThinkingReviewTasks:[id],review60Tasks:[id],mimoProNoThinkingReport60Tasks:[id],report120Tasks:[id]},credentials:createApprovedProviderCredentials({environment:{},readText:async()=>assert.fail('No credential file')}),documentReader:{pythonExecutable:'/offline/not-executed'},modelTransport:async request=>{
  models.push(request.model.id);try{assert.ok(models.length<=(mode==='shared'?80:3));assert.equal(request.maxOutputTokens,4096);
  const observe=(reply:ModelReply):ModelReply=>!r1?reply:{...reply,outcome:{model:{provider:request.model.provider,id:request.model.id,protocol:request.model.protocol},stop:reply.stop,physicalStatus:'response-received',usageFinal:true,usage:{inputTokens:{kind:'known',value:reply.usage.inputTokens},outputTokens:{kind:'known',value:reply.usage.outputTokens}},diagnostic:'COMPLETE'}};
  if(request.model.id==='MiniMax-M3')return observe(textReply(original.snapshot.document!.draft));
  if(mode==='shared'&&request.model.id==='mimo-v2.6-pro'){
   assert.ok(request.messages.flatMap(m=>m.tools??[]).some(t=>t.name==='complete_artifact'));
   if(!reportText){const marker='JuanerAI.report-edit.v1\n',m=request.messages.findLast(m=>m.text.includes(marker))!.text,p=JSON.parse(m.slice(m.indexOf(marker)+marker.length));packets.push(p);reportText=JSON.stringify({version:'1.4',source_sha256:p.source_sha256,units:original.snapshot.document!.units});}
   const nativeCall=(name:string,args:JsonObject)=>observe({stop:'tools',content:[{kind:'tool',id:randomUUID(),name,arguments:args}],usage:{inputTokens:7,outputTokens:3}});if(cursor<reportText.length){let piece='';for(const c of reportText.slice(cursor)){if(Buffer.byteLength(piece+c)>1800)break;piece+=c;}const first=cursor===0;cursor+=piece.length;return first?nativeCall('write',{path:'draft/report.json',content:piece+'NATIVE_PENDING'}):nativeCall('edit',{path:'draft/report.json',edits:[{oldText:'NATIVE_PENDING',newText:piece+'NATIVE_PENDING'}]});}
   if(!sealed){sealed=true;return nativeCall('edit',{path:'draft/report.json',edits:[{oldText:'NATIVE_PENDING',newText:''}]});}if(!completed){completed=true;return nativeCall('complete_artifact',{});}return observe(textReply('完整报告已提交。'));
  }
  assert.equal(request.messages.flatMap(m=>m.tools??[]).length,0);const raw=request.messages.findLast(m=>m.role==='user')!.text,p=JSON.parse(raw.slice(raw.indexOf('\n')+1));packets.push(p);
  if(request.model.id==='mimo-v2.6-pro'){if(mode==='r1-length')return {stop:'length',content:[{kind:'text',text:'incomplete'}],usage:{inputTokens:7,outputTokens:3},outcome:{model:{provider:request.model.provider,id:request.model.id,protocol:request.model.protocol},stop:'length',physicalStatus:'response-received',usageFinal:true,usage:{inputTokens:{kind:'known',value:7},outputTokens:{kind:'known',value:3}},diagnostic:'OUTPUT_LIMIT'}};return observe(textReply(JSON.stringify({version:'1.4',source_sha256:p.source_sha256,units:original.snapshot.document!.units})));}
  if(mode==='shared'){const page=p.output_contract.page;return observe(textReply(JSON.stringify(page==='whole'?{version:'review-page/1.0',page,snapshot_sha256:p.snapshot_sha256,completeness:original.response.completeness,requirement_coverage:original.response.requirement_coverage,global_issues:[]}:{version:'review-page/1.0',page,snapshot_sha256:p.snapshot_sha256,claims:original.response.claims.filter(c=>c.claim_id===page)})));}
  return observe(textReply(JSON.stringify({...original.response,snapshot_sha256:p.snapshot_sha256})));
 }catch(error){writeFileSync(join(f.root,'la32-transport-error.json'),JSON.stringify({mode,cursor,sealed,models,code:(error as {code?:string}).code,message:(error as Error).message,stack:(error as Error).stack}));throw error;}}});
 // This existing synthetic Task has an explicit test grant. No production credential authorization is substituted.
 const options={...model,projectRoot:f.root,inspect:async()=>original.f.sources,authorizeConfiguration:async()=>({config_sha256:original.f.identity.config_sha256})};let workspace=createPersonalOpenAnalysisWorkspace(options);
 try{
  await workspace.previewRevision(id,{version:'1.0',command_id:randomUUID(),expected_revision:'1',question:original.snapshot.question});await workspace.collect();const task=workspace.read(id),review=task.review_updates?.at(-1)?.review;
  if(mode==='r1-length'){assert.equal(task.revision_previews?.at(-1)?.state,'failed');assert.equal(task.revision_previews?.at(-1)?.failure_code,'OUTPUT_INCOMPLETE');assert.deepEqual(task.outcome,outcome);assert.deepEqual(models,['MiniMax-M3','mimo-v2.6-pro']);return;}
  assert.ok(review,JSON.stringify(task.revision_previews));assert.equal(review.state,'completed');if(mode==='shared'){assert.equal(models[0],'MiniMax-M3');assert.ok(models.filter(m=>m==='mimo-v2.6-pro').length>2);assert.equal(models.filter(m=>m==='mimo-v2.6-flash').length,original.snapshot.claims.length+1);}else assert.deepEqual(models,['MiniMax-M3','mimo-v2.6-pro','mimo-v2.6-flash']);assert.deepEqual(task.outcome,outcome);assert.equal(packets[1].source_draft.text,original.snapshot.document!.draft);
  await assert111Consumers(workspace,task,original.snapshot.document!.units[0]!.text,true);const beforeReopen=models.length;await workspace.close();workspace=createPersonalOpenAnalysisWorkspace(options);assert.deepEqual(workspace.read(id).outcome,outcome);assert.equal(models.length,beforeReopen,'Reopen must stay passive');
 }finally{await workspace.close();}
});

for(const unified of [false,true])test('AH-RECOVERY overflow-summary enters the actual Browser/Profile draft once; the following extra request stays refused, unified='+unified,async()=>{
 const {ModelFailure}=await import('pi-agent-runtime'),{createIndependentBrowserOpenModel}=await import('../../../apps/browser/service-main.ts');
 const {createLocalOpenAnalysisStore}=await import('../../../adapters/storage-local/open-analysis.ts'),{createPersonalOpenAnalysisWorkspace}=await import('../../../profiles/personal/open-analysis.ts');
 const original=await optionScenario(),f=fixture(),id=original.f.identity.task_id;
 const store=createLocalOpenAnalysisStore({projectRoot:f.root}),initial=completeJudgmentReview(original.snapshot,compileJudgmentRound(JSON.stringify(original.response),original.snapshot,'initial',original.f.sources));
 store.create({identity:original.f.identity,source:original.f.sources,question:original.snapshot.question,review_policy:'conclusion_strategy_v1'} as never);const lease=store.begin(id);
 store.saveFramework(lease,{version:'1.0',identity:original.f.identity,origin:'MODEL_PROPOSAL',plan:original.f.plan});
 const outcome={version:'1.0',outcome_id:randomUUID(),identity:original.f.identity,framework:original.f.plan,calculation:original.f.calculation,verification:original.f.evidence.verified_calculations[0]!.verification,numeric_report:original.snapshot.report,judgment_review:initial,explanation:{kind:'MODEL_EXPLANATION',text:initial.delivery},human_judgment:'not_recorded'};
 store.saveOutcome(lease,outcome as never);let calls=0,reportCalls=0;
 const model=createIndependentBrowserOpenModel({options:{...(unified?{newTaskPolicy:'unified-v1' as const}:{}),harnessFirstLoop:{version:'v0.2',work_recovery:'v1',request_admission:{policy_version:'offline-ah-overflow',protocol_overhead_tokens:128,safety_margin_tokens:512}},judgmentReviewAllowed:true,mimoNoThinkingReviewTasks:[id],review60Tasks:[id],mimoProNoThinkingReport60Tasks:[id],report120Tasks:[id]},credentials:createApprovedProviderCredentials({environment:{},readText:async()=>assert.fail('No credential file')}),documentReader:{pythonExecutable:'/offline/not-executed'},modelTransport:async request=>{
  calls++;const identity={provider:request.model.provider,id:request.model.id,protocol:request.model.protocol};
  const observe=(reply:ModelReply):ModelReply=>({...reply,outcome:{model:identity,stop:reply.stop,physicalStatus:'response-received',usageFinal:true,usage:{inputTokens:{kind:'known',value:reply.usage.inputTokens},outputTokens:{kind:'known',value:reply.usage.outputTokens}},diagnostic:'COMPLETE'}});
  if(request.model.id==='MiniMax-M3')return observe(textReply(original.snapshot.document!.draft));
  assert.equal(request.model.id,'mimo-v2.6-pro');if(unified&&reportCalls>0)assert.ok(request.maxOutputTokens>0&&request.maxOutputTokens<=32768,'native compaction may request less output');else assert.equal(request.maxOutputTokens,unified?32768:4096);
  if(++reportCalls===1)throw new ModelFailure({model:identity,stop:'error',category:'context',physicalStatus:'response-received',usageFinal:true,usage:{inputTokens:{kind:'known',value:0},outputTokens:{kind:'known',value:0}},diagnostic:'CONTEXT_LIMIT'},'MODEL_FAILED');
  assert.equal(reportCalls,2,'The summary consumes the only extra physical request');
  return observe(textReply('Synthetic authorized overflow summary; no report or business success claim.'));
 }});
 const options={...model,projectRoot:f.root,inspect:async()=>original.f.sources,authorizeConfiguration:async()=>({config_sha256:original.f.identity.config_sha256})};let workspace=createPersonalOpenAnalysisWorkspace(options);
 try{
  await workspace.previewRevision(id,{version:'1.0',command_id:randomUUID(),expected_revision:'1',question:original.snapshot.question});await workspace.collect();
  const task=workspace.read(id),events=createPersistentRuntimeState({projectRoot:f.root}).readAudit(id),finished=events.filter(e=>e.kind==='model.finished');
  writeFileSync(join(f.root,'overflow-result.json'),JSON.stringify({calls,reportCalls,preview:task.revision_previews,events}));
  assert.equal(reportCalls,2,'The first legal recovery summary must reach transport, even though its logical ID differs');
  const summary=finished.find(e=>e.modelAttempt?.kind==='recovery'&&e.modelAttempt.recovery.reason==='overflow-summary');assert.ok(summary);
  const attempt=summary.modelAttempt!;assert.equal(attempt.kind,'recovery');if(attempt.kind!=='recovery')assert.fail('Missing recovery parent');
  assert.equal(attempt.source,'compaction');assert.notEqual(attempt.logicalRequestId,attempt.recovery.logicalRequestId);
  assert.ok(events.some(e=>e.kind==='model.admitted'&&e.modelAttempt?.physicalAttemptId===attempt.physicalAttemptId));
  assert.equal(summary.modelOutcome?.physicalStatus,'response-received');assert.equal(summary.modelOutcome?.stop,'complete');
  const resend=finished.find(e=>e.modelAttempt?.kind==='recovery'&&e.modelAttempt.recovery.reason==='overflow');assert.ok(resend);
  assert.equal(resend.modelOutcome?.physicalStatus,'not-sent');assert.ok(!events.some(e=>e.kind==='model.admitted'&&e.modelAttempt?.physicalAttemptId===resend.modelAttempt?.physicalAttemptId));
  const drafts=readdirSync(join(f.root,'.juanerai','analysis-drafts-v1')).filter(n=>n.endsWith('.json')).map(n=>JSON.parse(readFileSync(join(f.root,'.juanerai','analysis-drafts-v1',n),'utf8'))),draft=drafts.find(r=>r.binding.kind==='report');assert.ok(draft);
  assert.equal(draft.recovery,attempt.recovery.logicalRequestId);assert.ok(draft.normal.includes(draft.recovery));assert.equal(draft.state,'failed');if(unified)assert.equal(draft.plan.timing,'unlimited');
  assert.deepEqual(task.outcome,outcome);assert.ok(!task.review_updates?.length);
  const before=calls;await workspace.close();workspace=createPersonalOpenAnalysisWorkspace(options);assert.deepEqual(workspace.read(id).outcome,outcome);assert.equal(calls,before,'Passive reopen must not retry the stopped overflow chain');
 }finally{await workspace.close();}
});

test('LA33 fixed public R1 admission is consumed before the actual Native transport or physical ledger reservation',async()=>{
 const f=fixture(),ledger=createLocalAnalysisRequestLedger({projectRoot:f.root}),{kind,...binding}=f.binding;void kind;let calls=0,oversized=0;const requestShapes:unknown[]=[];
 const native=createPiSessionOpenAnalysisRuntime({projectRoot:f.root,ledger,firstLoop:'v0.2',nativeObjectArguments:true,r1r4:{contextAdmission:{policyVersion:'offline117',protocolOverheadTokens:128,safetyMarginTokens:512}},credentials:createApprovedProviderCredentials({environment:{}}),modelTransport:async request=>{calls++;requestShapes.push({lengths:request.messages.map(m=>m.text.length)});if(request.messages.some(m=>m.text.length>800000)){oversized++;assert.fail('Oversized physical request reached transport');}return {...textReply('Only the authorized native compaction summary'),outcome:{model:{provider:request.model.provider,id:request.model.id,protocol:request.model.protocol},stop:'complete',physicalStatus:'response-received',usageFinal:true,usage:{inputTokens:{kind:'known',value:7},outputTokens:{kind:'known',value:3}},diagnostic:'COMPLETE'}};}} as Parameters<typeof createPiSessionOpenAnalysisRuntime>[0]);
 let caught:any;try{await native.run({identity:{...binding,revision:'1',run_id:randomUUID(),attempt_id:randomUUID(),grant_id:randomUUID()},prompt:'x'.repeat(900000),system:'Synthetic',tools:[],signal:new AbortController().signal,authorize:()=>true});}catch(e){caught=e;}
 assert.equal(oversized,0,JSON.stringify(requestShapes));assert.ok(calls<=1,'Only one native compaction summary may precede rejection');assert.equal(ledger.read(binding.task_id).length,calls);assert.ok(ledger.read(binding.task_id).every(r=>r.usage.input_tokens.kind==='known'));assert.equal(caught?.diagnostic,'CONTEXT_LIMIT');assert.equal(caught?.code,'INVALID_REQUEST');
});

for(const missing of [false,true])test('LA34 explicit public model observations preserve OUTPUT_LIMIT or UNKNOWN without trusting legacy counters, missing='+missing,async()=>{
 const f=fixture(),ledger=createLocalAnalysisRequestLedger({projectRoot:f.root}),{kind,...binding}=f.binding;void kind;let calls=0;
 const native=createPiSessionOpenAnalysisRuntime({projectRoot:f.root,ledger,firstLoop:'v0.2',nativeObjectArguments:true,r1r4:{contextAdmission:{policyVersion:'offline117',protocolOverheadTokens:128,safetyMarginTokens:512}},reviewPolicy:()=>true,credentials:createApprovedProviderCredentials({environment:{}}),modelTransport:async request=>{calls++;return {...textReply('incomplete'),stop:'length',...missing?{}:{outcome:{model:{provider:request.model.provider,id:request.model.id,protocol:request.model.protocol},stop:'length',physicalStatus:'response-received',usageFinal:true,usage:{inputTokens:{kind:'known',value:7},outputTokens:{kind:'known',value:3}},diagnostic:'OUTPUT_LIMIT'}}};}} as Parameters<typeof createPiSessionOpenAnalysisRuntime>[0]);
 let caught:any;try{await native.run({identity:{...binding,revision:'1',run_id:randomUUID(),attempt_id:randomUUID(),grant_id:randomUUID()},prompt:'Synthetic structured result',system:'Synthetic',tools:[],signal:new AbortController().signal,authorize:()=>true});}catch(e){caught=e;}
 assert.ok(caught);assert.equal(calls,1);assert.equal(caught.diagnostic,missing?'UNKNOWN':'OUTPUT_LIMIT');if(!missing)assert.equal(caught.code,'OUTPUT_INCOMPLETE');const row=ledger.read(binding.task_id)[0]!;assert.equal(row.usage.input_tokens.kind,missing?'unknown':'known');assert.equal(row.usage.output_tokens.kind,missing?'unknown':'known');if(missing)assert.ok(createPersistentRuntimeState({projectRoot:f.root}).readAccounting(binding.task_id)!.usage.reservedOutputTokens!>0);
});

test('LA35 Browser full public Harness/R1 input rejects invalid authority and keeps its pinned identity without credential reads',async()=>{
 const {createIndependentBrowserOpenModel}=await import('../../../apps/browser/service-main.ts'),common={credentials:createApprovedProviderCredentials({environment:{},readText:async()=>assert.fail('No credential file')}),documentReader:{pythonExecutable:'/offline/not-executed'}};
 for(const h of [{version:'auto',request_admission:{}},{version:'v0.2',request_admission:{policy_version:'x',protocol_overhead_tokens:-1,safety_margin_tokens:0}},{version:'v0.2',request_admission:{policy_version:'x',protocol_overhead_tokens:1,safety_margin_tokens:0,extra:true}}])assert.throws(()=>createIndependentBrowserOpenModel({...common,options:{harnessFirstLoop:h} as never}),/FIRST_LOOP_AUTHORITY_INVALID/);
 assert.doesNotThrow(()=>createIndependentBrowserOpenModel({...common,options:{harnessFirstLoop:{version:'v0.2',request_admission:{policy_version:'synthetic-verified-image-allowance',protocol_overhead_tokens:128,safety_margin_tokens:512,image_tokens:1024}}}}));
});

test('LA36 acknowledged R1 tool-effect UNKNOWN survives passive reopen rather than becoming saved or a retry',async()=>{
 const f=fixture(),ledger=createLocalAnalysisRequestLedger({projectRoot:f.root}),{kind,...binding}=f.binding;void kind;let calls=0,effects=0;
 const identity={...binding,revision:'1',run_id:randomUUID(),attempt_id:randomUUID(),grant_id:randomUUID()},common={projectRoot:f.root,ledger,firstLoop:'v0.2' as const,nativeObjectArguments:true,r1r4:{contextAdmission:{policyVersion:'offline117',protocolOverheadTokens:128,safetyMarginTokens:512}},credentials:createApprovedProviderCredentials({environment:{}}),modelTransport:async(request:ModelRequest):Promise<ModelReply>=>{
  calls++;assert.ok(calls<=2);const reply:ModelReply=calls===1?{stop:'tools',content:[{kind:'tool',id:'effect-unknown',name:'inspect_selected',arguments:{}}],usage:{inputTokens:7,outputTokens:3}}:textReply('未确认，不能称已完成');return {...reply,outcome:{model:{provider:request.model.provider,id:request.model.id,protocol:request.model.protocol},stop:reply.stop,physicalStatus:'response-received',usageFinal:true,usage:{inputTokens:{kind:'known',value:7},outputTokens:{kind:'known',value:3}},diagnostic:'COMPLETE'}};
 }};
 const runtime=createPiSessionOpenAnalysisRuntime(common),input={identity,prompt:'Synthetic effect boundary',system:'',signal:new AbortController().signal,authorize:()=>true,tools:[{name:'inspect_selected',description:'Synthetic write-effect receipt uncertainty',parameters:{type:'object',properties:{},additionalProperties:false},execute:async()=>{effects++;throw Error('Synthetic effect receipt not confirmed');}}]};
 try{await runtime.run(input);}catch{/* Verify acknowledged effects independently from terminal text. */}assert.equal(effects,1);assert.equal(runtime.hasUnconfirmedEffects!(identity.task_id),true);const before=calls,reopened=createPiSessionOpenAnalysisRuntime(common);assert.equal(reopened.hasUnconfirmedEffects!(identity.task_id),true);assert.equal(calls,before);assert.equal(effects,1);
});

test('LA37 approved shared-work selection reaches the actual Browser runtime without enabling or migrating defaults',async()=>{
 const {createIndependentBrowserOpenModel}=await import('../../../apps/browser/service-main.ts');
 const credentials=createApprovedProviderCredentials({environment:{LLM_API_KEY:'synthetic-only',LLM_BASE_URL:'https://api.minimaxi.com/anthropic',LLM_MODEL:'MiniMax-M3'},readText:async()=>assert.fail('No credential files')});
 const harness={version:'v0.2' as const,request_admission:{policy_version:'offline119',protocol_overhead_tokens:128,safety_margin_tokens:512},work_recovery:'v1' as const};
 const common={credentials,documentReader:{pythonExecutable:'/offline/not-executed'},modelTransport:async()=>assert.fail('Configuration is passive')};
 const legacy=createIndependentBrowserOpenModel({...common,options:{}}),selected=createIndependentBrowserOpenModel({...common,options:{harnessFirstLoop:harness}});
 assert.notEqual((await legacy.authorizeConfiguration()).config_sha256,(await selected.authorizeConfiguration()).config_sha256);
 assert.equal('longArtifacts' in legacy,false);assert.equal(selected.longArtifacts?.enabled(randomUUID()),true);
 const f=fixture(),runtime=selected.createRuntime(createLocalAnalysisRequestLedger({projectRoot:f.root}),{projectRoot:f.root,reviewPolicyForTask:()=>false});
 assert.equal(typeof runtime.openBusinessWork,'function');
 const identity={...f.binding,grant_id:randomUUID(),revision:'1',run_id:randomUUID(),attempt_id:randomUUID()};
 const input={identity,signal:new AbortController().signal,authorize:()=>true};
 const began=Date.now(),scope=await runtime.openBusinessWork!(input);assert.ok(scope.version==='1');assert.ok(scope.deadline_at>=began+299000&&scope.deadline_at<=began+301000);
 const reopened=selected.createRuntime(createLocalAnalysisRequestLedger({projectRoot:f.root}),{projectRoot:f.root,reviewPolicyForTask:()=>false});
 assert.deepEqual(await reopened.openBusinessWork!(input),scope);
 await assert.rejects(reopened.openBusinessWork!({...input,identity:{...identity,scope_sha256:'c'.repeat(64)}}));
});

for(const unified of [false,true])test('LA38 one product work shares recovery across M3/Pro/Flash and reopening without blocking normal later steps'+(unified?' unified':' legacy'),async()=>{
 const {ProviderFailure}=await import('pi-agent-runtime'),{createIndependentBrowserOpenModel}=await import('../../../apps/browser/service-main.ts');
 const f=fixture(),id=f.binding.task_id,{kind,...bound}=f.binding;void kind;
 const identity={...bound,grant_id:randomUUID(),revision:'1',run_id:randomUUID(),attempt_id:randomUUID()},command=randomUUID(),calls:Record<string,number>={};
 const options={...(unified?{newTaskPolicy:'unified-v1' as const}:{}),harnessFirstLoop:{version:'v0.2' as const,work_recovery:'v1' as const,request_admission:{policy_version:'offline119',protocol_overhead_tokens:128,safety_margin_tokens:512}},judgmentReviewAllowed:true,mimoNoThinkingReviewTasks:[id],review60Tasks:[id],mimoProNoThinkingReport60Tasks:[id],report120Tasks:[id]};
 const selected=createIndependentBrowserOpenModel({options,credentials:createApprovedProviderCredentials({environment:{}}),documentReader:{pythonExecutable:'/offline/not-executed'},modelTransport:async request=>{
  const model=request.model,key=model.id;calls[key]=(calls[key]??0)+1;const known=(value:number)=>({kind:'known' as const,value});
  if(key!=='MiniMax-M3'&&calls[key]===1)throw new ProviderFailure('network',{model:{provider:model.provider,id:key,protocol:model.protocol},stop:'error',category:'network',physicalStatus:'response-received',usageFinal:true,usage:{inputTokens:known(0),outputTokens:known(0)},diagnostic:'REQUEST_FAILED'});
  return {stop:'complete' as const,content:[{kind:'text' as const,text:'Synthetic capability probe'}],usage:{inputTokens:7,outputTokens:3},outcome:{model:{provider:model.provider,id:key,protocol:model.protocol},stop:'complete' as const,physicalStatus:'response-received' as const,usageFinal:true,usage:{inputTokens:known(7),outputTokens:known(3)},diagnostic:'COMPLETE' as const}};
 }});
 const ledger=createLocalAnalysisRequestLedger({projectRoot:f.root}),context={projectRoot:f.root,reviewPolicyForTask:()=>true};let runtime=selected.createRuntime(ledger,context);
 const base={identity,business_operation_id:command,prompt:'Synthetic recovery capability only',system:'No quality claim',tools:[],signal:new AbortController().signal,authorize:()=>true};
 await runtime.run(base);await runtime.run({...base,purpose:'report_edit'});await runtime.collect?.(id);
 runtime=selected.createRuntime(ledger,context);
 await assert.rejects(runtime.run({...base,purpose:'conclusion_strategy_review'}));await runtime.collect?.(id);
 assert.deepEqual(calls,{'MiniMax-M3':1,'mimo-v2.6-pro':2,'mimo-v2.6-flash':1});
 await runtime.run({...base,prompt:'Normal later analysis step, same authorized business work'});await runtime.collect?.(id);
 assert.equal(calls['MiniMax-M3'],2);assert.equal(ledger.read(id).length,5);
});

test('LA39 persisted business deadline aborts an in-flight normal request and cannot be renewed by reopen',async t=>{
 const {createIndependentBrowserOpenModel}=await import('../../../apps/browser/service-main.ts');const f=fixture(),{kind,...b}=f.binding;void kind;let clock=Date.now(),calls=0;
 t.mock.method(Date,'now',()=>clock);
 const identity={...b,grant_id:randomUUID(),revision:'1',run_id:randomUUID(),attempt_id:randomUUID()},base={identity,signal:new AbortController().signal,authorize:()=>true};
 const selected=createIndependentBrowserOpenModel({options:{harnessFirstLoop:{version:'v0.2',work_recovery:'v1',request_admission:{policy_version:'offline119',protocol_overhead_tokens:128,safety_margin_tokens:512}}},credentials:createApprovedProviderCredentials({environment:{}}),documentReader:{pythonExecutable:'/offline/not-executed'},modelTransport:async request=>{calls++;await new Promise(resolve=>setTimeout(resolve,400));return {stop:'complete',content:[{kind:'text',text:'late synthetic'}],usage:{inputTokens:7,outputTokens:3},outcome:{model:{provider:request.model.provider,id:request.model.id,protocol:request.model.protocol},stop:'complete',physicalStatus:'response-received',usageFinal:true,usage:{inputTokens:{kind:'known',value:7},outputTokens:{kind:'known',value:3}},diagnostic:'COMPLETE'}};}});
 const ledger=createLocalAnalysisRequestLedger({projectRoot:f.root}),context={projectRoot:f.root,reviewPolicyForTask:()=>false};let runtime=selected.createRuntime(ledger,context);
 const work=await runtime.openBusinessWork!(base);clock+=299700;
 await assert.rejects(runtime.run({...base,prompt:'Finite synthetic request',system:'',tools:[]}));await runtime.collect?.(identity.task_id);assert.equal(calls,1);
 runtime=selected.createRuntime(ledger,context);assert.deepEqual(await runtime.openBusinessWork!(base),work);clock+=301;
 await assert.rejects(runtime.run({...base,prompt:'Reopen cannot renew the business deadline',system:'',tools:[]}));assert.equal(calls,1);
});

test('LA40 selected long composition consumes persisted work deadline after process composition is recreated',async t=>{
 const f=fixture();let clock=Date.now(),calls=0,opens=0;t.mock.method(Date,'now',()=>clock);const deadline=clock+300000;
 const base={identity:{...f.binding,grant_id:randomUUID(),revision:'1',run_id:randomUUID(),attempt_id:randomUUID()},prompt:'first',system:'',tools:[],signal:new AbortController().signal,authorize:()=>true};
 const native={openBusinessWork:async()=>{opens++;return {version:'1' as const,id:'a'.repeat(64),deadline_at:deadline};},run:async()=>{calls++;return {text:'offline',tools:[]};}};
 const compose=()=>withLongAnalysisArtifacts({runtime:native,store:f.store,enabled:()=>true,reportMs:()=>120000});
 await compose().run(base);clock+=300001;
 await assert.rejects(compose().run({...base,prompt:'new page cannot renew work'}));assert.equal(calls,1);assert.equal(opens,2);
});

test('LA41 native Python draft is work-bound durable data; passive reopen does not execute or grant another work its bytes',async()=>{
 const f=fixture(),ledger=createLocalAnalysisRequestLedger({projectRoot:f.root}),{kind,...binding}=f.binding;void kind;let phase=0,consumed=0,calls=0;
 const identity={...binding,grant_id:randomUUID(),revision:'1',run_id:randomUUID(),attempt_id:randomUUID()},command=randomUUID(),program='# original complete draft\nprint(7)\n';
 let runtime:ReturnType<typeof createPiSessionOpenAnalysisRuntime>;
 const options={projectRoot:f.root,ledger,firstLoop:'v0.2' as const,sharedWorkRecovery:'v1' as const,nativeObjectArguments:true,r1r4:{contextAdmission:{policyVersion:'offline119',protocolOverheadTokens:128,safetyMarginTokens:512}},credentials:createApprovedProviderCredentials({environment:{}}),modelTransport:async(request:ModelRequest):Promise<ModelReply>=>{
  calls++;const reply=phase++===0?{stop:'tools' as const,content:[{kind:'tool' as const,id:randomUUID(),name:'write',arguments:{path:'draft/analysis.py',content:program}}],usage:{inputTokens:7,outputTokens:3}}:[3,5].includes(phase)?{stop:'tools' as const,content:[{kind:'tool' as const,id:randomUUID(),name:'calculate_and_verify',arguments:{}}],usage:{inputTokens:7,outputTokens:3}}:textReply('Draft remains unexecuted until explicit authorized calculation');
  return {...reply,outcome:{model:{provider:request.model.provider,id:request.model.id,protocol:request.model.protocol},stop:reply.stop,physicalStatus:'response-received',usageFinal:true,usage:{inputTokens:{kind:'known',value:7},outputTokens:{kind:'known',value:3}},diagnostic:'COMPLETE'}};
 }};
 const base={identity,business_operation_id:command,prompt:'Synthetic draft',system:'',signal:new AbortController().signal,authorize:()=>true,tools:[{name:'calculate_and_verify',description:'Explicit original execution seam',parameters:{type:'object',properties:{},additionalProperties:false},execute:async()=>{const read=await runtime.readCodeDraft!({task_id:identity.task_id,path:'draft/analysis.py',signal:base.signal});assert.equal(read.code,program);consumed++;return {status:'read_draft_only',sha256:read.code_sha256};}}]};
 runtime=createPiSessionOpenAnalysisRuntime(options);await runtime.run(base);assert.equal(consumed,0);const before=calls;
 runtime=createPiSessionOpenAnalysisRuntime(options);await runtime.openBusinessWork!(base);assert.equal(calls,before);assert.equal(consumed,0);
 await runtime.run({...base,prompt:'Explicit continuation of same work'});assert.equal(consumed,1,'Original bytes must reach the actual execution seam after reopen');
 await assert.rejects(runtime.readCodeDraft!({task_id:identity.task_id,path:'draft/analysis.py',signal:base.signal}));
 await assert.rejects(runtime.run({...base,business_operation_id:randomUUID(),prompt:'Other work must not inherit code bytes'}));assert.equal(consumed,1);
});

for(const mode of ['not-sent','unknown','conflict','late','invalid'] as const)test('LA42 public physical facts settle only their own durable reservation, '+mode,async()=>{
 const f=fixture(),state=createPersistentRuntimeState({projectRoot:f.root}),identity={...f.binding,grant_id:randomUUID(),revision:'1',run_id:randomUUID(),attempt_id:randomUUID()},signal=new AbortController().signal;
 const scope=state.businessWork.begin({identity}),run=randomUUID();let sequence=0;
 const common={version:'1.0' as const,taskId:identity.task_id,runId:run,at:new Date().toISOString(),provider:'offline',model:'synthetic',contextVersions:{scope:identity.scope_sha256,configuration:identity.config_sha256}};
 const event=async(kind:'run.started'|'model.finished',rest:object={})=>state.appendWorkAudit(scope.id,{...common,sequence:++sequence,kind,...rest},signal);
 await event('run.started');
 const first={version:'1' as const,source:'assistant' as const,logicalRequestId:'1'.repeat(64),physicalAttemptId:randomUUID(),kind:'initial' as const};
 const outcome=(status:'not-sent'|'response-received'|'unknown',n=0)=>({model:{provider:'offline',id:'synthetic',protocol:'openai-completions' as const},stop:'error' as const,physicalStatus:status,usageFinal:true,usage:{inputTokens:{kind:'known' as const,value:n},outputTokens:{kind:'known' as const,value:n}},diagnostic:'REQUEST_FAILED' as const});
 const finish=async(ref:typeof first|any,status:'not-sent'|'response-received'|'unknown',late=false,n=0)=>{const o=outcome(status,n);await event('model.finished',{modelAttempt:ref,modelOutcome:o,modelAttemptFact:{version:'1',attempt:ref,outcome:o,terminal:true,late}});};
 assert.equal(state.businessWork.authorize(scope.id,identity.task_id,run,first),true);await finish(first,'response-received');
 const recovery={...first,physicalAttemptId:randomUUID(),kind:'recovery' as const,recovery:{logicalRequestId:first.logicalRequestId,physicalAttemptId:first.physicalAttemptId,reason:'same-model' as const}};
 assert.equal(state.businessWork.authorize(scope.id,identity.task_id,run,recovery),true);
 if(mode==='invalid'){const before=state.businessWork.read(scope.id),audit=state.readAudit(identity.task_id),o=outcome('not-sent');await assert.rejects(event('model.finished',{modelAttempt:recovery,modelOutcome:o,modelAttemptFact:{version:'1',attempt:recovery,outcome:o,terminal:true,late:false,raw_prompt:'not allowed'}}));assert.deepEqual(state.businessWork.read(scope.id),before);assert.deepEqual(state.readAudit(identity.task_id),audit);return;}
 await finish(recovery,mode==='conflict'?'response-received':mode==='unknown'?'unknown':'not-sent',mode==='late');
 if(mode==='conflict')await finish(recovery,'not-sent');
 const reopened=createPersistentRuntimeState({projectRoot:f.root}),next={...recovery,physicalAttemptId:randomUUID()};
 assert.equal(reopened.businessWork.authorize(scope.id,identity.task_id,run,next),mode==='not-sent');
 const current=reopened.businessWork.read(scope.id);if(mode==='not-sent')assert.equal(current.recovery!.physical_id,next.physicalAttemptId);else{assert.equal(current.blocked,true);assert.notEqual(current.recovery,null);}
 if(mode!=='not-sent'){const other=reopened.businessWork.begin({identity:{...identity,operation_id:randomUUID()}});await reopened.appendWorkAudit(other.id,{...common,runId:randomUUID(),sequence:1,kind:'run.started'},signal);const run2=reopened.businessWork.read(other.id).runs[0]!;assert.equal(reopened.businessWork.authorize(other.id,identity.task_id,run2,{...first,physicalAttemptId:randomUUID()}),false,'A new command must not escape unresolved work');}
 const before=reopened.readAudit(identity.task_id);await reopened.appendWorkAudit(scope.id,before.findLast(e=>e.runId===run)!,signal);assert.deepEqual(reopened.readAudit(identity.task_id),before);
});

test('LA43 two independent processes atomically share the single product recovery slot',async()=>{
 const {spawn}=await import('node:child_process'),f=fixture(),state=createPersistentRuntimeState({projectRoot:f.root}),identity={...f.binding,grant_id:randomUUID(),revision:'1',run_id:randomUUID(),attempt_id:randomUUID()},scope=state.businessWork.begin({identity}),runs=[randomUUID(),randomUUID()];
 const initial={version:'1' as const,source:'assistant' as const,logicalRequestId:'1'.repeat(64),physicalAttemptId:randomUUID(),kind:'initial' as const},outcome={model:{provider:'offline',id:'synthetic',protocol:'openai-completions' as const},stop:'error' as const,physicalStatus:'response-received' as const,usageFinal:true,usage:{inputTokens:{kind:'known' as const,value:0},outputTokens:{kind:'known' as const,value:0}},diagnostic:'REQUEST_FAILED' as const};
 const common={version:'1.0' as const,taskId:identity.task_id,at:new Date().toISOString(),provider:'offline',model:'synthetic',contextVersions:{scope:identity.scope_sha256,configuration:identity.config_sha256}};
 for(const runId of runs)await state.appendWorkAudit(scope.id,{...common,runId,sequence:1,kind:'run.started'},new AbortController().signal);
 assert.equal(state.businessWork.authorize(scope.id,identity.task_id,runs[0]!,initial),true);
 await state.appendWorkAudit(scope.id,{...common,runId:runs[0]!,sequence:2,kind:'model.finished',modelAttempt:initial,modelOutcome:outcome,modelAttemptFact:{version:'1',attempt:initial,outcome,terminal:true,late:false}},new AbortController().signal);
 const module=new URL('../../../adapters/agent-pi/persistent-runtime-state.ts',import.meta.url).href;
 const script=`import {createPersistentRuntimeState} from ${JSON.stringify(module)};const x=JSON.parse(process.argv[1]);const state=createPersistentRuntimeState({projectRoot:x.root});process.stdout.write(JSON.stringify(state.businessWork.authorize(x.id,x.task,x.run,x.ref)));`;
 const attempts=runs.map(run=>({root:f.root,id:scope.id,task:identity.task_id,run,ref:{...initial,physicalAttemptId:randomUUID(),kind:'recovery',recovery:{logicalRequestId:initial.logicalRequestId,physicalAttemptId:initial.physicalAttemptId,reason:'same-model'}}}));
 const actual=await Promise.all(attempts.map(a=>new Promise<boolean>((resolve,reject)=>{const child=spawn(process.execPath,['--input-type=module','-e',script,JSON.stringify(a)],{stdio:['ignore','pipe','pipe']});let out='',err='';child.stdout.on('data',b=>out+=b);child.stderr.on('data',b=>err+=b);child.on('error',reject);child.on('exit',code=>code===0?resolve(JSON.parse(out)):reject(Error(err)));})));
 assert.deepEqual(actual.slice().sort(),[false,true]);const after=createPersistentRuntimeState({projectRoot:f.root}).businessWork.read(scope.id);assert.equal(after.recovery!.state,'reserved');assert.equal(Object.values(after.attempts).filter(a=>a.ref.kind==='recovery').length,1);
});

test('LA44 independent work read survives a short competing SQLite transaction without another recovery allowance',{timeout:5000},async()=>{
 const {spawn}=await import('node:child_process'),{DatabaseSync}=await import('node:sqlite'),f=fixture(),state=createPersistentRuntimeState({projectRoot:f.root}),identity={...f.binding,grant_id:randomUUID(),revision:'1',run_id:randomUUID(),attempt_id:randomUUID()},scope=state.businessWork.begin({identity});
 const module=new URL('../../../adapters/agent-pi/persistent-runtime-state.ts',import.meta.url).href;
 const script=`import {createPersistentRuntimeState} from ${JSON.stringify(module)};const x=JSON.parse(process.argv[1]);process.stdout.write('ready\\n');process.stdin.once('data',()=>{try{const state=createPersistentRuntimeState({projectRoot:x.root});process.stdout.write(JSON.stringify(state.businessWork.read(x.id).binding.task_id));}catch(error){process.stderr.write(String(error));process.exitCode=1;}process.stdin.pause();});`;
 const child=spawn(process.execPath,['--input-type=module','-e',script,JSON.stringify({root:f.root,id:scope.id})],{stdio:['pipe','pipe','pipe']});let out='',err='';let ready!:()=>void;const started=new Promise<void>(resolve=>{ready=resolve;});child.stdout.on('data',b=>{out+=b;if(out.includes('ready\n'))ready();});child.stderr.on('data',b=>err+=b);const done=new Promise<number|null>((resolve,reject)=>{child.on('error',reject);child.on('exit',resolve);});
 await Promise.race([started,done.then(()=>{throw Error('Child exited before contention barrier: '+err);})]);
 const holder=new DatabaseSync(join(f.root,'.xanthil','desktop','pi-runtime.sqlite'));holder.exec('PRAGMA busy_timeout=1000; BEGIN EXCLUSIVE;');child.stdin.end('start');
 const released=new Promise<void>((resolve,reject)=>setTimeout(()=>{try{holder.exec('COMMIT');resolve();}catch(error){reject(error);}finally{holder.close();}},200));
 try{const code=await done;assert.equal(code,0,err);assert.equal(JSON.parse(out.slice(out.indexOf('\n')+1)),identity.task_id);}finally{await released;}
 const after=state.businessWork.read(scope.id);assert.equal(after.recovery,null);assert.equal(Object.keys(after.attempts).length,0);
});

for(const truncated of [false,true])test('AH-FILE report uses native write/edit/read with empty business completion, no identity copying; truncated='+truncated,async()=>{
 const body=JSON.stringify({完整自然报告:'完整中文报告、原始条件200元、未认证模型意见。'.repeat(600)}),parts:string[]=[];let part='';for(const c of body){if(Buffer.byteLength(part+c)>1600){parts.push(part);part='';}part+=c;}if(part)parts.push(part);
 let step=0,offset=0;const sent:ModelRequest[]=[];
 const call=(name:string,args:JsonObject):ModelReply=>({stop:'tools',content:[{kind:'tool',id:randomUUID(),name,arguments:args}],usage:{inputTokens:7,outputTokens:3}});
 const f=longRuntimeFixture(async r=>{sent.push(r);if(r.model.id==='MiniMax-M3')return textReply('bootstrap');assert.equal(r.model.id,'mimo-v2.6-pro');
  const names=r.messages.flatMap(m=>m.tools??[]).map(t=>t.name);assert.ok(names.includes('write')&&names.includes('edit')&&names.includes('complete_artifact'));assert.equal(names.includes('build_artifact'),false);
  if(offset<parts.length){const first=offset===0,piece=parts[offset++]!,reply=first?call('write',{path:'draft/report.json',content:piece+'NATIVE_PENDING'}):call('edit',{path:'draft/report.json',edits:[{oldText:'NATIVE_PENDING',newText:piece+'NATIVE_PENDING'}]});return truncated&&offset===parts.length?{...reply,stop:'length'}:reply;}
  if(step++===0)return call('edit',{path:'draft/report.json',edits:[{oldText:'NATIVE_PENDING',newText:''}]});
  if(step===2)return call('read',{path:'draft/report.json'});
  if(step===3)return call('complete_artifact',{});
  return textReply('完整正文已提交。');
 },true,true);
 await f.runtime.run(f.base);
 const run=()=>f.runtime.run({...f.base,purpose:'report_edit',prompt:'Submit the complete original output contract using the bounded file.',system:'No invented facts.'});
 if(truncated){await assert.rejects(run,{code:'OUTPUT_INCOMPLETE'});const records=readdirSync(join(f.root,'drafts')).filter(n=>n.endsWith('.json')).map(n=>JSON.parse(readFileSync(join(f.root,'drafts',n),'utf8')));assert.equal(records.some(r=>r.ref.sealed),false);assert.equal(records.some(r=>r.text===body),false);}
 else {const result=await run();assert.equal(result.text,body);assert.equal(result.assembled_artifact!.ref.sealed,true);assert.equal(result.assembled_artifact!.ref.bytes,Buffer.byteLength(body));const saved=JSON.parse(readFileSync(join(f.root,'drafts',result.assembled_artifact!.ref.id+'.json'),'utf8'));assert.equal(saved.text,body);assert.equal(saved.ref.sha256,digest(body));assert.equal(saved.state,'completed');}
 assert.ok(sent.length>5);assert.equal(f.ledger.pending!().length,0);assert.ok(f.ledger.read(f.identity.task_id).every(r=>r.provider==='minimax-cn'||r.provider==='xiaomi-token-plan-cn'));
 writeFileSync(join(f.root,'native-report-result.json'),JSON.stringify({truncated,requests:sent.length,body_sha256:digest(body),bytes:Buffer.byteLength(body)}));
});

for(const state of ['ready','saved'] as const)for(const corrupted of ['policy','checkpoint','update'] as const)test('AH-STORE actual reopened Store rejects rehashed invalid review '+corrupted+' in '+state,async()=>{
 const {DatabaseSync}=await import('node:sqlite'),{createLocalOpenAnalysisStore}=await import('../../../adapters/storage-local/open-analysis.ts');
 const original=await optionScenario(),f=fixture(),id=original.f.identity.task_id;
 const store=createLocalOpenAnalysisStore({projectRoot:f.root}),review=completeJudgmentReview(original.snapshot,compileJudgmentRound(JSON.stringify(original.response),original.snapshot,'initial',original.f.sources));
 store.create({identity:original.f.identity,source:original.f.sources,question:original.snapshot.question,review_policy:'conclusion_strategy_v1'} as never);
 if(state==='saved'){
  const lease=store.begin(id);store.saveFramework(lease,{version:'1.0',identity:original.f.identity,origin:'MODEL_PROPOSAL',plan:original.f.plan});
  store.saveOutcome(lease,{version:'1.0',outcome_id:randomUUID(),identity:original.f.identity,framework:original.f.plan,calculation:original.f.calculation,verification:original.f.evidence.verified_calculations[0]!.verification,numeric_report:original.snapshot.report,judgment_review:review,explanation:{kind:'MODEL_EXPLANATION',text:review.delivery},human_judgment:'not_recorded'} as never);
 }
 const baseline=store.read(id)!;assert.deepEqual(createLocalOpenAnalysisStore({projectRoot:f.root}).read(id),baseline);
 const changed=structuredClone(baseline) as any;
 if(corrupted==='policy')changed.review_policy='unrecognized-review-policy';
 else if(corrupted==='checkpoint'){changed.review_checkpoint=structuredClone(review);changed.review_checkpoint.snapshot.identity.revision='999';}
 else changed.review_updates=[{version:'1.0',command_id:'invalid-command-id',expected_revision:'1',previous_sha256:'0'.repeat(64),kind:'condition',review:{...structuredClone(review),delivery:'UNREVIEWED_CONTENT'}}];
 const body=JSON.stringify(changed),sha=taskHash(changed),path=join(f.root,'.xanthil','desktop','open-analysis.sqlite');
 const db=new DatabaseSync(path);try{db.prepare('UPDATE tasks SET body_json=?,body_sha256=? WHERE task_id=?').run(body,sha,id);}finally{db.close();}
 const fileBefore=readFileSync(path);
 assert.throws(()=>createLocalOpenAnalysisStore({projectRoot:f.root}).read(id),error=>{const code=(error as {code?:string}).code;assert.ok(code==='INTEGRITY_BLOCKED'||code==='VALIDATION_FAILED'||code?.startsWith('JUDGMENT_'),String(code));return true;});
 assert.deepEqual(readFileSync(path),fileBefore,'Rejecting a rehashed row must not repair or rewrite it');
});

for(const unified of [false,true])for(const fault of ['formation','revision','review'] as const)test('AH-RECOVERY Browser→Profile complete report and paged review retain the legal recovery window: '+fault+(unified?' unified':' legacy'),async t=>{
 const {ProviderFailure}=await import('pi-agent-runtime'),{createIndependentBrowserOpenModel}=await import('../../../apps/browser/service-main.ts'),{createPersonalOpenAnalysisWorkspace}=await import('../../../profiles/personal/open-analysis.ts'),{createLocalOpenAnalysisStore}=await import('../../../adapters/storage-local/open-analysis.ts');
 const original=await optionScenario(),f=fixture(),id=original.f.identity.task_id,start=Date.now();let clock=start,injected=false,recovered=false,calls=0;
 t.mock.timers.enable({apis:['Date'],now:start});const advance=(ms:number)=>{clock+=ms;t.mock.timers.setTime(clock);};
 const store=createLocalOpenAnalysisStore({projectRoot:f.root}),initial=completeJudgmentReview(original.snapshot,compileJudgmentRound(JSON.stringify(original.response),original.snapshot,'initial',original.f.sources));
 store.create({identity:original.f.identity,source:original.f.sources,question:original.snapshot.question,review_policy:'conclusion_strategy_v1'} as never);const lease=store.begin(id);
 store.saveFramework(lease,{version:'1.0',identity:original.f.identity,origin:'MODEL_PROPOSAL',plan:original.f.plan});
 const outcome={version:'1.0',outcome_id:randomUUID(),identity:original.f.identity,framework:original.f.plan,calculation:original.f.calculation,verification:original.f.evidence.verified_calculations[0]!.verification,numeric_report:original.snapshot.report,judgment_review:initial,explanation:{kind:'MODEL_EXPLANATION',text:initial.delivery},human_judgment:'not_recorded'};
 store.saveOutcome(lease,outcome as never);
 const jobs=new Map<string,{text:string;offset:number;trimmed:boolean;sealed:boolean}>(),requests:unknown[]=[];
 const model=createIndependentBrowserOpenModel({options:{...(unified?{newTaskPolicy:'unified-v1' as const}:{}),harnessFirstLoop:{version:'v0.2',work_recovery:'v1',request_admission:{policy_version:'offline-ah-recovery',protocol_overhead_tokens:128,safety_margin_tokens:512}},judgmentReviewAllowed:true,mimoNoThinkingReviewTasks:[id],review60Tasks:[id],mimoProNoThinkingReport60Tasks:[id],report120Tasks:[id]},credentials:createApprovedProviderCredentials({environment:{},readText:async()=>assert.fail('No credential file')}),documentReader:{pythonExecutable:'/offline/not-executed'},modelTransport:async request=>{
  assert.ok(++calls<100);assert.equal(request.maxOutputTokens,unified?32768:4096);
  const observe=(reply:ModelReply):ModelReply=>({...reply,outcome:{model:{provider:request.model.provider,id:request.model.id,protocol:request.model.protocol},stop:reply.stop,physicalStatus:'response-received',usageFinal:true,usage:{inputTokens:{kind:'known',value:reply.usage.inputTokens},outputTokens:{kind:'known',value:reply.usage.outputTokens}},diagnostic:'COMPLETE'}});
  if(request.model.id==='MiniMax-M3')return observe(textReply(original.snapshot.document!.draft));
  const reportMarker='JuanerAI.report-edit.v1\n',revisionMarker='JuanerAI.review-revision.v1\n';
  const jobMessage=request.messages.findLast(m=>m.role==='user'&&(m.text.includes(reportMarker)||m.text.includes(revisionMarker))),revision=request.model.id==='mimo-v2.6-pro'&&!!jobMessage?.text.includes(revisionMarker);
  const stage=request.model.id==='mimo-v2.6-flash'?'review':revision?'revision':'formation';
  requests.push({model:request.model.id,stage,elapsed:clock-start});
  if(stage===fault&&!injected){injected=true;advance(unified?319000:stage==='review'?59000:119000);const known={kind:'known' as const,value:0};throw new ProviderFailure('network',{model:{provider:request.model.provider,id:request.model.id,protocol:request.model.protocol},stop:'error',category:'network',physicalStatus:'response-received',usageFinal:true,usage:{inputTokens:known,outputTokens:known},diagnostic:'REQUEST_FAILED'});}
  if(stage===fault&&injected&&!recovered){advance(unified?31000:11000);recovered=true;}
  if(request.model.id==='mimo-v2.6-pro'){
   assert.ok(jobMessage);const marker=revision?revisionMarker:reportMarker,p=JSON.parse(jobMessage.text.slice(jobMessage.text.indexOf(marker)+marker.length));
   const key=marker+(revision?p.snapshot_sha256:p.source_sha256);let job=jobs.get(key);
   if(!job){const unit={...original.snapshot.document!.units[0]!,text:original.snapshot.document!.units[0]!.text+'（仅限原问题范围。）'};job={text:JSON.stringify(revision?{version:'1.1',snapshot_sha256:p.snapshot_sha256,changes:[{claim_id:'C1',unit}]}:{version:'1.4',source_sha256:p.source_sha256,units:original.snapshot.document!.units}),offset:0,trimmed:false,sealed:false};jobs.set(key,job);}
   const call=(name:string,args:JsonObject)=>observe({stop:'tools',content:[{kind:'tool',id:randomUUID(),name,arguments:args}],usage:{inputTokens:7,outputTokens:3}});
   if(job.offset<job.text.length){let piece='';for(const c of job.text.slice(job.offset)){if(Buffer.byteLength(piece+c)>1800)break;piece+=c;}const first=job.offset===0;job.offset+=piece.length;return first?call('write',{path:'draft/report.json',content:piece+'AH_PENDING'}):call('edit',{path:'draft/report.json',edits:[{oldText:'AH_PENDING',newText:piece+'AH_PENDING'}]});}
   if(!job.trimmed){job.trimmed=true;return call('edit',{path:'draft/report.json',edits:[{oldText:'AH_PENDING',newText:''}]});}
   if(!job.sealed){job.sealed=true;return call('complete_artifact',{});}
   return observe(textReply('完整内容已提交。'));
  }
  assert.equal(request.model.id,'mimo-v2.6-flash');
  const raw=request.messages.findLast(m=>m.role==='user')!.text,p=JSON.parse(raw.slice(raw.indexOf('\n')+1)),page=p.output_contract.page;
  const needsRevision=fault==='revision'&&!p.current_proposal.units[0].text.includes('仅限原问题范围');
  return observe(textReply(JSON.stringify(page==='whole'?{version:'review-page/1.0',page,snapshot_sha256:p.snapshot_sha256,completeness:original.response.completeness,requirement_coverage:original.response.requirement_coverage,global_issues:needsRevision?[{claim_id:'C1',reason:'受控初次审查要求明确保留原范围'}]:[]}:{version:'review-page/1.0',page,snapshot_sha256:p.snapshot_sha256,claims:original.response.claims.filter(c=>c.claim_id===page).map(c=>({...c,verdict:needsRevision?'insufficient':c.verdict}))})));
 }});
 const options={...model,projectRoot:f.root,inspect:async()=>original.f.sources,authorizeConfiguration:async()=>({config_sha256:original.f.identity.config_sha256})};let workspace=createPersonalOpenAnalysisWorkspace(options);
 try{
  await workspace.previewRevision(id,{version:'1.0',command_id:randomUUID(),expected_revision:'1',question:original.snapshot.question});await workspace.collect();const task=workspace.read(id),review=task.review_updates?.at(-1)?.review;
  writeFileSync(join(f.root,'recovery-result.json'),JSON.stringify({fault,injected,recovered,elapsed:clock-start,requests,preview:task.revision_previews,review}));
  assert.ok(injected&&recovered);assert.equal(clock-start,unified?350000:fault==='review'?70000:130000);
  assert.ok(review,JSON.stringify(task.revision_previews));assert.equal(review.state,'completed');assert.deepEqual(task.outcome,outcome);
  assert.equal(review.rounds.length,fault==='revision'?2:1);if(fault==='revision')assert.match(review.delivery,/仅限原问题范围/);
  const before=calls;await workspace.close();workspace=createPersonalOpenAnalysisWorkspace(options);assert.deepEqual(workspace.read(id).review_updates,task.review_updates);assert.equal(calls,before,'Passive reopen must not retry');await workspace.close();
  const {DatabaseSync}=await import('node:sqlite'),persisted=createLocalOpenAnalysisStore({projectRoot:f.root}).read(id)!,path=join(f.root,'.xanthil','desktop','open-analysis.sqlite');
  const writeRow=(value:unknown)=>{const db=new DatabaseSync(path);try{db.prepare('UPDATE tasks SET body_json=?,body_sha256=? WHERE task_id=?').run(JSON.stringify(value),taskHash(value),id);}finally{db.close();}};
  const mutations:[string,(value:any)=>void][]=[
   ['prior-hash',value=>{value.review_updates.at(-1).prior_review_sha256='0'.repeat(64);}],
   ['same-version-identity',value=>{value.review_updates.at(-1).review.snapshot.identity.revision='999';}],
   ['preview-body',value=>{value.review_updates.at(-1).input.document.units[0].text+='UNREVIEWED_CONTENT';}],
   ['extra-retry',value=>{const r=value.review_updates.at(-1).review;r.rounds.push(structuredClone(r.rounds.at(-1)));}],
   ...(fault==='revision'?[
    ['revised-document',(value:any)=>{value.review_updates.at(-1).review.revised_document.units[0].text+='UNREVIEWED_CONTENT';}],
    ['revised-claims',(value:any)=>{value.review_updates.at(-1).review.revised_claims[0].text+='UNREVIEWED_CONTENT';}],
   ] as [string,(value:any)=>void][]:[]),
  ];
  const rejected:unknown[]=[];
  try{for(const [name,mutate] of mutations){const changed=structuredClone(persisted);mutate(changed);writeFileSync(join(f.root,'store-corruption-'+name+'.json'),JSON.stringify(changed));writeRow(changed);
   assert.throws(()=>createLocalOpenAnalysisStore({projectRoot:f.root}).read(id),error=>{const code=(error as {code?:string}).code;assert.ok(code==='INTEGRITY_BLOCKED'||code==='VALIDATION_FAILED'||code?.startsWith('JUDGMENT_'),String(code));rejected.push({name,code});return true;});
  }}finally{writeRow(persisted);}
  assert.deepEqual(createLocalOpenAnalysisStore({projectRoot:f.root}).read(id),persisted);assert.equal(calls,before);writeFileSync(join(f.root,'store-negative-result.json'),JSON.stringify(rejected));
 }finally{await workspace.close();}
});
