import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import test from 'node:test';
import {spawn} from 'node:child_process';
import {createCaseAssistantApplication} from '../../../packages/application/case-assistant.ts';
import {createLocalCaseAssistantStore} from '../../../adapters/storage-local/case-assistant.ts';
import type {AssistantProjection,AssistantTurnResult,AssistantTurn} from '../../../packages/contracts/case-assistant.ts';
import {completedCase} from '../../fixtures/case-assistant/completed-case.ts';
import {decision,config} from '../../fixtures/case-assistant/fixtures.ts';
import {withIsolatedProject} from '../../fixtures/xanthil-desktop/desktop-contract-drivers.ts';

async function eventually(read:()=>Promise<AssistantProjection>,condition:(p:AssistantProjection)=>boolean){let p=await read();for(let n=0;n<200&&!condition(p);n++){await new Promise(r=>setTimeout(r,5));p=await read();}assert.ok(condition(p),'asynchronous business state reached');return p;}

test('V03 AC-06/09 first-user SQLITE_BUSY settles the real persisted Attempt and permits explicit recovery without provider/formal effects',async()=>withIsolatedProject(async root=>{
 const baseline=await completedCase(root),store=createLocalCaseAssistantStore({projectRoot:root});let injections=0,calls=0;
 const app=createCaseAssistantApplication({store:{...store,async appendEvent(id,event,signal){if(event.kind==='user'&&injections===0){injections++;throw Object.assign(new Error('SQLITE_BUSY'),{code:'SQLITE_BUSY'});}return store.appendEvent(id,event,signal);}},runtime:{async turn(){calls++;return {provider:config.provider,model:config.model,cost_microunits:0,output:{kind:'question',text:'合成恢复问题'}};}},config,clock:()=>new Date()});
 const linked=await app.link(baseline.owner,'单次存储失败',randomUUID()),id=linked.session.id,auth=await app.prepare(id,'首次文本');
 await assert.rejects(()=>app.start(id,auth.id,true),/SQLITE_BUSY/);
 const failed=await app.read(id);assert.equal(failed.attempts.at(-1)?.status,'Failed');assert.equal(failed.attempts.at(-1)?.reason,'SQLITE_BUSY');assert.equal(injections,1);assert.equal(calls,0);assert.equal(failed.decisions.length,0);assert.equal(failed.reports.length,0);assert.equal(failed.drafts.length,0);
 assert.equal((await app.stop(id)).attempts.at(-1)?.status,'Failed');
 const retry=await app.prepare(id,'用户明确重试');await app.start(id,retry.id,true);await eventually(()=>app.read(id),p=>p.attempts.at(-1)?.status==='Waiting');await app.stop(id);
 const recovered=await app.read(id);assert.equal(recovered.attempts.length,2);assert.equal(recovered.attempts[0].status,'Failed');assert.equal(recovered.attempts[1].status,'Stopped');assert.equal(calls,1);assert.equal(recovered.decisions.length,0);assert.equal(recovered.reports.length,0);await app.close();
}));

test('AC-01–06/08/09 exact authorization → question → visible reply → readonly tool → draft → explicit adoption',async()=>withIsolatedProject(async root=>{
 const baseline=await completedCase(root),store=createLocalCaseAssistantStore({projectRoot:root});const payloads:string[]=[];
 const source=await store.readSource(baseline.owner),fields={...decision,choice:'no_action' as const,candidate_id:null,evidence_refs:source.evidence_refs,finding_refs:[source.finding_id]};
 const outputs:AssistantTurnResult['output'][]=[{kind:'question',text:'谁来负责？'},{kind:'tool',tool:'read_evidence',revision_id:source.owner.revision_id},{kind:'draft',fields}];
 const runtime={async turn(input:AssistantTurn):Promise<AssistantTurnResult>{payloads.push(input.payload);return {provider:config.provider,model:config.model,cost_microunits:1,output:outputs.shift()!};}};
 const app=createCaseAssistantApplication({store,runtime,config,clock:()=>new Date()});
 const linked=await app.link(baseline.owner,'合成 Case Assistant',randomUUID());assert.ok(linked?.session,'linked Quick Session is separate from professional');
 const id=linked.session.id,auth=await app.prepare(id,'请帮我记录决定',[],[],false);
 assert.equal(payloads.length,0);assert.equal(auth.initial_text,'请帮我记录决定');assert.ok(auth.source.aggregate.sha256);
 await assert.rejects(()=>app.start(id,auth.id,false),/AUTHORITY_REQUIRED/);assert.equal(payloads.length,0);
 await app.start(id,auth.id,true);
 let p=await eventually(()=>app.read(id),(p)=>p.attempts.at(-1)?.status==='Waiting');assert.equal(p.attempts.at(-1)?.turns,1);assert.ok(p.attempts.at(-1)?.waiting_deadline);
 await app.send(id,'我负责；只发送此处可见文字');p=await eventually(()=>app.read(id),(p)=>p.drafts.length===1);
 assert.equal(payloads.length,3);assert.match(payloads[1],/谁来负责/,'same-Attempt prior question reaches real next payload');assert.match(payloads[2],/我负责/,'same-Attempt user answer survives tool round');assert.ok(p.events.some(e=>e.kind==='tool'&&e.status==='completed'));assert.equal(p.decisions.length,0);assert.equal(p.reports.length,0);
 assert.equal(p.events.filter(e=>e.kind==='payload').length,3);assert.match(payloads[1],/我负责；只发送此处可见文字/);
 const adopted=await app.adopt(id,p.drafts[0].id,p.drafts[0].version,'合成人',randomUUID());assert.equal(adopted.decisions.length,1);assert.equal(adopted.reports.length,1);
 assert.equal((await baseline.app.readProjection(baseline.owner)).revision?.state,'Completed');
 await app.close();
}));

test('AC-02/03/06 stopped late result, continued attempt, wait expiry, execution timeout and forbidden tool preserve formal state',async()=>withIsolatedProject(async root=>{
 const baseline=await completedCase(root),store=createLocalCaseAssistantStore({projectRoot:root});let release:(value:AssistantTurnResult)=>void=()=>{},calls=0;
 const runtime={async turn(_input:AssistantTurn):Promise<AssistantTurnResult>{calls++;return new Promise(resolve=>{release=resolve;});}};
 const app=createCaseAssistantApplication({store,runtime,config,clock:()=>new Date()});
 const linked=await app.link(baseline.owner,'停止合成',randomUUID()),id=linked.session.id;
 const auth=await app.prepare(id,'合成停止',[],[],false);await app.start(id,auth.id,true);await eventually(()=>app.read(id),p=>p.events.some(e=>e.kind==='payload'));
 await app.stop(id);release({provider:config.provider,model:config.model,cost_microunits:1,output:{kind:'question',text:'迟到追问'}});
 let p=await eventually(()=>app.read(id),p=>p.attempts.at(-1)?.status==='Stopped');assert.equal(p.drafts.length,0);assert.equal(p.events.filter(e=>e.kind==='question').length,0);assert.equal(calls,1);
 const next=await app.prepare(id,'继续但不自动重发历史',[],[],false);assert.deepEqual(next.selected_history,[]);await app.start(id,next.id,true);p=await eventually(()=>app.read(id),p=>p.attempts.length===2&&p.events.filter(e=>e.kind==='payload').length===2);assert.notEqual(p.attempts[0].id,p.attempts[1].id);await app.close();
 assert.equal((await app.read(id)).attempts.at(-1)?.status,'Interrupted');
 const immediate={async turn():Promise<AssistantTurnResult>{return {provider:config.provider,model:config.model,cost_microunits:0,output:{kind:'question',text:'合成等待'}};}};
 const short={...config,limits:{...config.limits,waiting_ms:30}};const waiting=createCaseAssistantApplication({store,runtime:immediate,config:short,clock:()=>new Date()});
 const wa=await waiting.prepare(id,'等待超时',[],[],false);await waiting.start(id,wa.id,true);p=await eventually(()=>waiting.read(id),p=>p.attempts.at(-1)?.status==='WaitExpired');assert.equal(p.decisions.length,0);assert.equal(p.reports.length,0);await waiting.close();
 const timed=createCaseAssistantApplication({store,runtime,config:{...config,limits:{...config.limits,execution_ms:20}},clock:()=>new Date()});const ta=await timed.prepare(id,'执行超时',[],[],false);await timed.start(id,ta.id,true);
 p=await eventually(()=>timed.read(id),p=>!['Running','Waiting'].includes(p.attempts.at(-1)!.status));assert.equal(p.attempts.at(-1)?.status,'TimedOut');await timed.close();
 const forbidden=createCaseAssistantApplication({store,runtime:{async turn(){return {provider:config.provider,model:config.model,cost_microunits:0,output:{kind:'tool',tool:'shell',revision_id:baseline.owner.revision_id}} as unknown as AssistantTurnResult;}},config,clock:()=>new Date()});const fa=await forbidden.prepare(id,'禁止越界',[],[],false);await forbidden.start(id,fa.id,true);p=await eventually(()=>forbidden.read(id),p=>p.attempts.at(-1)?.status==='Failed');assert.ok(p.events.some(e=>e.kind==='tool'&&e.status==='rejected'));assert.equal(p.reports.length,0);await forbidden.close();
}));

test('AC-06 stop during pending Store draft write refuses late publication and keeps terminal state',async()=>withIsolatedProject(async root=>{
 const baseline=await completedCase(root),store=createLocalCaseAssistantStore({projectRoot:root}),source=await store.readSource(baseline.owner);
 let resume=()=>{},entered=()=>{};const enteredPromise=new Promise<void>(r=>{entered=r;}),gate=new Promise<void>(r=>{resume=r;});
 const delayed={...store,async saveDraft(...args:Parameters<typeof store.saveDraft>){entered();await gate;return store.saveDraft(...args);}};
 const fields={...decision,choice:'no_action' as const,candidate_id:null,evidence_refs:source.evidence_refs,finding_refs:[source.finding_id]};
 const app=createCaseAssistantApplication({store:delayed,runtime:{async turn(){return {provider:config.provider,model:config.model,cost_microunits:0,output:{kind:'draft' as const,fields}};}},config,clock:()=>new Date()});
 const p=await app.link(baseline.owner,'停止保存',randomUUID()),auth=await app.prepare(p.session.id,'合成',[],[],false);await app.start(p.session.id,auth.id,true);await enteredPromise;
 await app.stop(p.session.id);resume();await new Promise(r=>setTimeout(r,30));
 const stopped=await app.read(p.session.id);assert.equal(stopped.attempts.at(-1)?.status,'Stopped');assert.equal(stopped.drafts.length,0,'late pending Store write must not publish');assert.equal(stopped.decisions.length,0);await app.close();
}));

test('AC-13 current formal record can be copied to a human revision and cancelled without model calls or formal versions',async()=>withIsolatedProject(async root=>{
 const baseline=await completedCase(root),store=createLocalCaseAssistantStore({projectRoot:root}),source=await store.readSource(baseline.owner);let calls=0;
 const fields={...decision,choice:'no_action' as const,candidate_id:null,evidence_refs:source.evidence_refs,finding_refs:[source.finding_id]};
 const app=createCaseAssistantApplication({store,runtime:{async turn(){calls++;return {provider:config.provider,model:config.model,cost_microunits:0,output:{kind:'draft' as const,fields}};}},config,clock:()=>new Date()});
 const linked=await app.link(baseline.owner,'修订原会话',randomUUID()),id=linked.session.id,auth=await app.prepare(id,'合成',[],[],false);await app.start(id,auth.id,true);let p=await eventually(()=>app.read(id),p=>p.attempts.at(-1)?.status==='Succeeded');p=await app.adopt(id,p.drafts[0].id,1,'合成人',randomUUID());
 const other=await app.link(baseline.owner,'人工修订会话',randomUUID());assert.equal(typeof (app as Record<string,unknown>).revise,'function','formal-to-draft capability exists');
 const revised=await app.revise(other.session.id,p.current_decision_id!);assert.deepEqual(revised.drafts.at(-1)?.fields,fields);assert.equal(revised.drafts.at(-1)?.manual_base_id,p.current_decision_id);assert.equal(revised.drafts.at(-1)?.baseline_decision_id,p.current_decision_id);assert.equal(calls,1);assert.equal(revised.attempts.length,0,'human revision must not fabricate a model Attempt');
 const cancelled=await app.cancelRevision(other.session.id,revised.drafts.at(-1)!.id,1);assert.equal(cancelled.drafts.at(-1)?.status,'rejected');assert.equal(cancelled.decisions.length,1);assert.equal(cancelled.reports.length,1);assert.equal(calls,1);
 const next=await app.revise(other.session.id,p.current_decision_id!);const edited=await app.edit(other.session.id,next.drafts.at(-1)!.id,1,{...fields,owner:'人工修订责任人'});const adopted=await app.adopt(other.session.id,edited.drafts.at(-1)!.id,2,'合成人',randomUUID());assert.equal(adopted.decisions.length,2);assert.equal(adopted.decisions[1].previous_id,p.current_decision_id);assert.equal(adopted.reports.length,2);assert.equal(calls,1);await app.close();
}));

for(const boundary of ['running_save','usage_save','payload','question'] as const)test(`AC-02/06 stop while ${boundary} is awaiting prevents late writes and further runtime admission`,async()=>withIsolatedProject(async root=>{
 const baseline=await completedCase(root),store=createLocalCaseAssistantStore({projectRoot:root});let resume=()=>{},entered=()=>{},calls=0,saves=0;
 const ready=new Promise<void>(r=>{entered=r;}),gate=new Promise<void>(r=>{resume=r;});
 const delayed={...store,async saveAttempt(...args:Parameters<typeof store.saveAttempt>){saves++;if(boundary==='running_save'&&saves===2||boundary==='usage_save'&&saves===3){entered();await gate;}return store.saveAttempt(...args);},async appendEvent(...args:Parameters<typeof store.appendEvent>){if(args[1].kind===boundary){entered();await gate;}return store.appendEvent(...args);}};
 const app=createCaseAssistantApplication({store:delayed,runtime:{async turn(){calls++;return {provider:config.provider,model:config.model,cost_microunits:0,output:{kind:'question' as const,text:'不得迟到'}};}},config,clock:()=>new Date()});
 const linked=await app.link(baseline.owner,'边界合成',randomUUID()),id=linked.session.id,auth=await app.prepare(id,'边界停止',[],[],false);await app.start(id,auth.id,true);await ready;await app.stop(id);resume();await new Promise(r=>setTimeout(r,25));
 const p=await app.read(id);assert.equal(p.attempts.at(-1)?.status,'Stopped');assert.equal(p.events.filter(e=>e.kind==='question').length,0,'no late question publication');if(['running_save','payload'].includes(boundary)){assert.equal(calls,0);assert.equal(p.events.filter(e=>e.kind==='payload').length,0,'no false issued payload after stop');}assert.equal(p.drafts.length,0);await app.close();
}));

test('AC-02/06 initial attempt persistence is stop-addressable and configuration snapshots cannot be mutated by caller',async()=>withIsolatedProject(async root=>{
 const baseline=await completedCase(root),store=createLocalCaseAssistantStore({projectRoot:root});let resume=()=>{},entered=()=>{},calls=0,first=true;
 const ready=new Promise<void>(r=>{entered=r;}),gate=new Promise<void>(r=>{resume=r;});const mutable=structuredClone(config);
 const app=createCaseAssistantApplication({store:{...store,async saveAttempt(...args:Parameters<typeof store.saveAttempt>){if(first){first=false;entered();await gate;}return store.saveAttempt(...args);}},runtime:{async turn(){calls++;return {provider:config.provider,model:config.model,cost_microunits:0,output:{kind:'advice' as const,text:'迟到'}};}},config:mutable,clock:()=>new Date()});
 const linked=await app.link(baseline.owner,'初始停止',randomUUID()),id=linked.session.id;const auth=await app.prepare(id,'停止测试',[],[],false);(mutable.limits as {turns:number}).turns=999;assert.equal(auth.config?.limits.turns,config.limits.turns);
 const starting=app.start(id,auth.id,true);await ready;await app.stop(id);resume();await starting;await new Promise(r=>setTimeout(r,20));const p=await app.read(id);assert.equal(p.attempts.at(-1)?.status,'Stopped');assert.equal(calls,0);assert.equal(p.events.filter(e=>e.kind==='payload').length,0);await app.close();
}));

test('AC-09/13 same-revision head conflict rebase survives stop/continue and appends the next formal version',async()=>withIsolatedProject(async root=>{
 const baseline=await completedCase(root),store=createLocalCaseAssistantStore({projectRoot:root}),source=await store.readSource(baseline.owner);let waiting=false;
 const fields={...decision,choice:'no_action' as const,candidate_id:null,evidence_refs:source.evidence_refs,finding_refs:[source.finding_id]};
 const app=createCaseAssistantApplication({store,runtime:{async turn(){return {provider:config.provider,model:config.model,cost_microunits:0,output:waiting?{kind:'question' as const,text:'继续前核对'}:{kind:'draft' as const,fields}};}},config,clock:()=>new Date()});
 const a=await app.link(baseline.owner,'A',randomUUID()),b=await app.link(baseline.owner,'B',randomUUID());
 for(const s of [a,b]){const auth=await app.prepare(s.session.id,'合成',[],[],false);await app.start(s.session.id,auth.id,true);await eventually(()=>app.read(s.session.id),p=>p.attempts.at(-1)?.status==='Succeeded');}
 let pa=await app.read(a.session.id),pb=await app.read(b.session.id);pa=await app.adopt(a.session.id,pa.drafts[0].id,1,'A',randomUUID());await assert.rejects(()=>app.adopt(b.session.id,pb.drafts[0].id,1,'B',randomUUID()),/STALE_DECISION/);
 waiting=true;const rebased=await app.prepare(b.session.id,'从当前正式记录修订',[],[],true);assert.equal(rebased.baseline_decision_id,pa.current_decision_id);assert.match(rebased.payload,new RegExp(pa.reports[0].id));await app.start(b.session.id,rebased.id,true);await eventually(()=>app.read(b.session.id),p=>p.attempts.at(-1)?.status==='Waiting');await app.stop(b.session.id);
 const continuation=await app.prepare(b.session.id,'继续当前正式基线',[],[],false);assert.equal(continuation.baseline_decision_id,pa.current_decision_id);assert.equal(continuation.blockers.length,0);assert.match(continuation.payload,new RegExp(pa.reports[0].id));waiting=false;await app.start(b.session.id,continuation.id,true);pb=await eventually(()=>app.read(b.session.id),p=>p.attempts.at(-1)?.status==='Succeeded');pb=await app.adopt(b.session.id,pb.drafts.at(-1)!.id,1,'B',randomUUID());assert.equal(pb.decisions.length,2);assert.equal(pb.decisions[1].previous_id,pa.current_decision_id);assert.deepEqual(pb.reports[0],pa.reports[0]);await app.close();
}));

// Additional acceptance coverage of existing guards; only an observed failure is causal RED.
test('AC-02/03/05/06 hard budgets, malformed provider/tool, missing authority and reject have no formal side effects',async t=>withIsolatedProject(async root=>{
 const baseline=await completedCase(root),store=createLocalCaseAssistantStore({projectRoot:root});
 for(const mode of ['turn_budget','cost_budget','malformed','wrong_revision','extra_tool_argument','extra_question','extra_advice','extra_draft','extra_result','unauthorized','missing_caps','reject'] as const)await t.test(mode,async()=>{
  const source=await store.readSource(baseline.owner),fields={...decision,choice:'no_action' as const,candidate_id:null,evidence_refs:source.evidence_refs,finding_refs:[source.finding_id]};let calls=0;
  const limits={...config.limits,...(mode==='turn_budget'?{turns:1}:mode==='cost_budget'?{cost_microunits:10}:mode==='missing_caps'?{turns:0}:{})};
  const app=createCaseAssistantApplication({store,config:{...config,authorized:mode!=='unauthorized',limits},clock:()=>new Date(),runtime:{async turn(){calls++;const output=mode==='extra_question'?{kind:'question',text:'合成追问',extra:'forbidden'}:mode==='extra_advice'?{kind:'advice',text:'合成建议',extra:'forbidden'}:mode==='extra_draft'?{kind:'draft',fields,extra:'forbidden'}:mode==='extra_result'?{kind:'advice',text:'合成建议'}:mode==='malformed'?null:mode==='reject'?{kind:'draft',fields}:mode==='extra_tool_argument'?{kind:'tool',tool:'read_evidence',revision_id:baseline.owner.revision_id,path:'/unapproved/source.csv'}:{kind:'tool',tool:'read_evidence',revision_id:mode==='wrong_revision'?randomUUID():baseline.owner.revision_id};return {provider:config.provider,model:config.model,cost_microunits:mode==='cost_budget'?10:0,output,...(mode==='extra_result'?{extra:'forbidden'}:{})} as unknown as AssistantTurnResult;}}});
  try{
   const linked=await app.link(baseline.owner,mode,randomUUID()),id=linked.session.id,auth=await app.prepare(id,'合成边界测试');
   if(mode==='unauthorized'||mode==='missing_caps'){assert.ok(auth.blockers.length);await assert.rejects(()=>app.start(id,auth.id,true));assert.equal(calls,0);const p=await app.read(id);assert.equal(p.attempts.length,0);assert.equal(p.decisions.length,0);assert.equal(p.reports.length,0);return;}
   await app.start(id,auth.id,true);let p=await eventually(()=>app.read(id),p=>!['Running','Waiting'].includes(p.attempts.at(-1)!.status));
   assert.equal(calls,1,'no admission after terminal/budget refusal');assert.equal(p.decisions.length,0);assert.equal(p.reports.length,0);
   if(mode.endsWith('budget')){assert.equal(p.attempts.at(-1)?.status,'BudgetExhausted');assert.equal(p.events.filter(e=>e.kind==='payload').length,1);}
   else if(mode==='reject'){assert.equal(p.drafts.length,1);await assert.rejects(()=>app.reject(id,p.drafts[0].id,1,false,'未确认'));assert.equal((await app.read(id)).drafts.at(-1)?.status,'pending');p=await app.reject(id,p.drafts[0].id,1,true,'人工拒绝');assert.equal(p.drafts.at(-1)?.status,'rejected');await assert.rejects(()=>app.adopt(id,p.drafts[0].id,1,'不得采纳',randomUUID()));assert.equal(p.decisions.length,0);assert.equal(p.reports.length,0);}
   else {assert.equal(p.attempts.at(-1)?.status,'Failed');assert.equal(p.drafts.length,0);assert.equal(p.events.filter(e=>e.kind==='tool'&&e.status==='completed').length,0);}
  }finally{await app.close();}
 });
}));

test('AC-07/09 source revision created after draft and before adoption refuses publication with original report unchanged',async()=>withIsolatedProject(async root=>{
 const baseline=await completedCase(root),store=createLocalCaseAssistantStore({projectRoot:root}),source=await store.readSource(baseline.owner),fields={...decision,choice:'no_action' as const,candidate_id:null,evidence_refs:source.evidence_refs,finding_refs:[source.finding_id]};
 const app=createCaseAssistantApplication({store,config,clock:()=>new Date(),runtime:{async turn(){return {provider:config.provider,model:config.model,cost_microunits:0,output:{kind:'draft' as const,fields}};}}});try{
 const linked=await app.link(baseline.owner,'source changes',randomUUID()),id=linked.session.id,auth=await app.prepare(id,'合成');await app.start(id,auth.id,true);const p=await eventually(()=>app.read(id),p=>p.drafts.length===1);
 const next=await baseline.app.createDraftRevision({contract_version:'1.0',command_id:randomUUID(),...baseline.owner,expected_row_version:baseline.projection.revision!.row_version});assert.notEqual(next.session!.current_revision_id,baseline.owner.revision_id);
 await assert.rejects(()=>app.adopt(id,p.drafts[0].id,1,'合成采纳人',randomUUID()));const after=await app.read(id);assert.equal(after.source.eligible,false);assert.equal(after.decisions.length,0);assert.equal(after.reports.length,0);assert.equal(after.drafts[0].status,'pending');assert.deepEqual((await baseline.app.readProjection(baseline.owner)).reports,baseline.projection.reports);
 }finally{await app.close();}
}));


for(const status of ['Running','Waiting'] as const)for(const exit of ['close','crash'] as const)test(`AC-06/09 real process ${status} ${exit} reopens Interrupted without auto resume`,async t=>withIsolatedProject(async root=>{
 const baseline=await completedCase(root);
 const script=`
 import {createCaseAssistantApplication} from './packages/application/case-assistant.ts';
 import {createLocalCaseAssistantStore} from './adapters/storage-local/case-assistant.ts';
 import {config} from './tests/fixtures/case-assistant/fixtures.ts';
 import {randomUUID} from 'node:crypto';
 const [root,ownerText,status]=process.argv.slice(1);
 const app=createCaseAssistantApplication({store:createLocalCaseAssistantStore({projectRoot:root}),config,clock:()=>new Date(),runtime:{async turn(){if(status==='Running')return new Promise(()=>{});return {provider:config.provider,model:config.model,cost_microunits:0,output:{kind:'question',text:'等待用户合成问题'}};}}});
 const linked=await app.link(JSON.parse(ownerText),'真实进程恢复合成',randomUUID()),id=linked.session.id,auth=await app.prepare(id,'合成任务');await app.start(id,auth.id,true);
 let p=await app.read(id);for(let i=0;i<200&&(p.attempts.at(-1).status!==status||!p.events.some(e=>e.kind==='payload'));i++){await new Promise(r=>setTimeout(r,5));p=await app.read(id);}
 if(p.attempts.at(-1).status!==status)throw new Error('child prerequisite failed');
 process.stdout.write(JSON.stringify({session:id,status:p.attempts.at(-1).status,attempt:p.attempts.at(-1).id})+'\\n');
 process.stdin.once('data',async()=>{await app.close();process.exit(0);});
 `;
 const child=spawn(process.execPath,['--input-type=module','-e',script,root,JSON.stringify(baseline.owner),status],{cwd:process.cwd(),env:process.env,stdio:['pipe','pipe','pipe']});let stdout='',stderr='';child.stdout.on('data',b=>stdout+=b);child.stderr.on('data',b=>stderr+=b);t.after(()=>{if(child.exitCode===null&&child.signalCode===null)child.kill('SIGKILL');});
 const ended=new Promise<{code:number|null;signal:string|null}>((resolve,reject)=>{child.once('error',reject);child.once('exit',(code,signal)=>resolve({code,signal}));});
 for(let i=0;i<200&&!stdout.includes('\n');i++){if(child.exitCode!==null)assert.fail('child failed before ready: '+stderr);await new Promise(r=>setTimeout(r,20));}
 assert.ok(stdout.includes('\n'),'real child reached requested persisted state: '+stderr);const ready=JSON.parse(stdout.trim());assert.equal(ready.status,status);
 if(exit==='crash')assert.equal(child.kill('SIGKILL'),true);else child.stdin.write('close\n');
 const result=await ended;assert.deepEqual(result,exit==='crash'?{code:null,signal:'SIGKILL'}:{code:0,signal:null});
 let calls=0;const store=createLocalCaseAssistantStore({projectRoot:root}),app=createCaseAssistantApplication({store,config,clock:()=>new Date(),runtime:{async turn(){calls++;throw new Error('reopen must never call runtime');}}});await app.reopen();
 const reopened=await app.read(ready.session);assert.equal(reopened.attempts.at(-1)?.id,ready.attempt);assert.equal(reopened.attempts.at(-1)?.status,'Interrupted');assert.equal(reopened.attempts.length,1);assert.ok(reopened.events.some(e=>e.kind==='user'));assert.ok(reopened.events.some(e=>e.kind==='payload'));if(status==='Waiting')assert.ok(reopened.events.some(e=>e.kind==='question'));assert.equal(reopened.drafts.length,0);assert.equal(reopened.decisions.length,0);assert.equal(reopened.reports.length,0);assert.equal(calls,0);await app.close();
}));

test('VUI02 AC-06 real SQLite reply SQLITE_BUSY safely fails and explicit continuation preserves history',async t=>withIsolatedProject(async root=>{
 const {DatabaseSync}=await import('node:sqlite');const baseline=await completedCase(root),store=createLocalCaseAssistantStore({projectRoot:root});let calls=0,injections=0;
 const app=createCaseAssistantApplication({store,runtime:{async turn(){calls++;return {provider:config.provider,model:config.model,cost_microunits:0,output:{kind:'question',text:'合成后续问题'}};}},config:{...config,limits:{...config.limits,waiting_ms:80}},clock:()=>new Date()});t.after(()=>app.close());
 const linked=await app.link(baseline.owner,'后续回复失败',randomUUID()),id=linked.session.id,auth=await app.prepare(id,'初始任务');await app.start(id,auth.id,true);
 const before=await eventually(()=>app.read(id),p=>p.attempts.at(-1)?.status==='Waiting');
 const prepare=DatabaseSync.prototype.prepare;
 DatabaseSync.prototype.prepare=function(sql:string){const stmt=prepare.call(this,sql);if(sql.startsWith('INSERT INTO events'))return new Proxy(stmt,{get(target,key){if(key==='run')return(...args:unknown[])=>{const event=JSON.parse(String(args[2]));if(event.kind==='user'&&event.text==='未保存回复'&&injections===0){injections++;throw Object.assign(new Error('SQLITE_BUSY'),{code:'SQLITE_BUSY'});}return Reflect.apply(target.run,target,args);};return Reflect.get(target,key,target);}});return stmt;};
 try{await assert.rejects(()=>app.send(id,'未保存回复'),/SQLITE_BUSY/);}finally{DatabaseSync.prototype.prepare=prepare;}
 const failed=await app.read(id);assert.equal(failed.attempts.at(-1)?.status,'Failed','reply persistence failure must not strand Waiting');assert.equal(injections,1);assert.equal(calls,1);assert.equal(failed.events.some(e=>e.text==='未保存回复'),false);assert.deepEqual(failed.events.filter(e=>e.kind!=='status'),before.events.filter(e=>e.kind!=='status'));
 await new Promise(r=>setTimeout(r,100));assert.equal((await app.read(id)).attempts.at(-1)?.status,'Failed');assert.equal(calls,1);await assert.rejects(()=>app.send(id,'不能隐式重试'),/FORBIDDEN/);
 const next=await app.prepare(id,'显式继续');assert.deepEqual(next.selected_history,[]);await app.start(id,next.id,true);await eventually(()=>app.read(id),p=>p.attempts.at(-1)?.status==='Waiting');await app.stop(id);const recovered=await app.read(id);assert.equal(calls,2);assert.deepEqual(recovered.attempts.map(a=>a.status),['Failed','Stopped']);assert.deepEqual(recovered.drafts,[]);assert.deepEqual(recovered.decisions,[]);assert.deepEqual(recovered.reports,[]);
}));

for(const terminal of ['deadline','stop'] as const)test(`VUI02 AC-06 ${terminal} wins while reply append is pending in real SQLite`,async t=>withIsolatedProject(async root=>{
 const baseline=await completedCase(root),store=createLocalCaseAssistantStore({projectRoot:root});let calls=0,release=()=>{},entered=()=>{};const gate=new Promise<void>(r=>{release=r;}),arrived=new Promise<void>(r=>{entered=r;});
 const app=createCaseAssistantApplication({store:{...store,async appendEvent(id,e,signal){if(e.text==='延迟回复'){entered();await gate;}return store.appendEvent(id,e,signal);}},runtime:{async turn(){calls++;return{provider:config.provider,model:config.model,cost_microunits:0,output:{kind:'question',text:'等待回答'}};}},config:{...config,limits:{...config.limits,waiting_ms:100}},clock:()=>new Date()});t.after(async()=>{release();await app.close();});
 const linked=await app.link(baseline.owner,'回复竞态',randomUUID()),id=linked.session.id,auth=await app.prepare(id,'初始任务');await app.start(id,auth.id,true);await eventually(()=>app.read(id),p=>p.attempts.at(-1)?.status==='Waiting');
 const sending=app.send(id,'延迟回复');const settled=sending.catch(()=>undefined);await arrived;
 if(terminal==='stop')await app.stop(id);else await new Promise(r=>setTimeout(r,140));
 const p=await app.read(id);assert.equal(p.attempts.at(-1)?.status,terminal==='stop'?'Stopped':'WaitExpired');release();await settled;assert.equal(calls,1);const final=await app.read(id);assert.equal(final.events.some(e=>e.text==='延迟回复'),false);assert.deepEqual(final.drafts,[]);assert.deepEqual(final.decisions,[]);assert.deepEqual(final.reports,[]);
}));
