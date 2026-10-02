import assert from 'node:assert/strict';
import test from 'node:test';
import {randomUUID} from 'node:crypto';
import {createRequire} from 'node:module';
import {withFork} from '../../fixtures/case-assistant/collaboration.ts';
import {decision,config} from '../../fixtures/case-assistant/fixtures.ts';
import {DatabaseSync} from 'node:sqlite';
import {join} from 'node:path';

test('AC-FS-02/04 actual Fork R2 uses only explicit R1 and returns the exact selected version',async()=>withFork('fork-r1-r2',async s=>{
 await s.start();await s.wait(s.child.session.id,'Succeeded');const r1=(await s.app.readCollaboration(s.child.session.id)).results[0];
 const empty=await s.app.prepareCollaboration(s.child.session.id,'独立新问题',[],[]);assert.deepEqual(JSON.parse(empty.payload).selected_results,[]);
 for(const ids of [[randomUUID()],[r1.id,r1.id]])await assert.rejects(()=>s.app.prepareCollaboration(s.child.session.id,'拒绝错误结果',[],ids),/FORBIDDEN/);
 assert.equal(s.calls.length,2);
 s.setResponse(async input=>{const context=JSON.parse(input.payload).authorized_context;assert.deepEqual(context.selected_history,[]);assert.deepEqual(context.selected_results.map((r:any)=>r.id),[r1.id]);return {kind:'result',summary:'R2 仅复核所选 R1',references:[context.allowed_references.find((r:any)=>r.kind==='result')],limitations:['R1 不是正式事实'],unknowns:['未新增证据']};});
 const a2=await s.app.prepareCollaboration(s.child.session.id,'显式复核 R1',[],[r1.id]);await s.app.start(s.child.session.id,a2.id,true);await s.wait(s.child.session.id,'Succeeded');
 const results=(await s.app.readCollaboration(s.child.session.id)).results;assert.equal(results.length,2);assert.deepEqual(results[0],r1);const r2=results[1];assert.equal(r2.version,2);assert.notEqual(r2.id,r1.id);assert.notEqual(r2.attempt_id,r1.attempt_id);assert.equal(r2.authorization_id,a2.id);assert.equal(r2.value.references[0].sha256,r1.sha256);
 await s.app.returnResult(s.child.session.id,{result_id:r1.id,result_version:r1.version,result_sha256:r1.sha256},randomUUID());const parent=await s.app.readParent(s.parent.session.id);assert.deepEqual(parent.deliveries.filter(d=>d.status==='returned').map(d=>d.result_id),[r1.id]);assert.equal(parent.deliveries.find(d=>d.result_id===r2.id)?.status,'unreturned');assert.equal(s.calls.length,3);assert.deepEqual(await s.store.formalHistory(s.baseline.owner),{decisions:[],reports:[]});
}));

test('AC-FS-08 success committed before Stop returns honest terminal readback',async()=>withFork('commit-before-stop',async s=>{
 let entered!:()=>void,release!:()=>void;const reached=new Promise<void>(r=>entered=r),gate=new Promise<void>(r=>release=r),original=s.store.finishChild;
 s.store.finishChild=async(...args)=>{const saved=await original(...args);entered();await gate;return saved;};await s.start();await reached;
 try{const stopped=await s.app.stop(s.child.session.id);assert.equal(stopped.attempts[0].status,'Succeeded');assert.equal((await s.app.readCollaboration(s.child.session.id)).results.length,1);}finally{release();}
 await new Promise(r=>setTimeout(r,20));assert.equal((await s.app.read(s.child.session.id)).attempts[0].status,'Succeeded');assert.equal(s.app.occupant(),null);
}));

test('AC-FS-07 child Store refuses root authority and formal drafts without side effects',async()=>withFork('child-formal-refusal',async s=>{
 await s.start();await s.wait(s.child.session.id,'Succeeded');const child=await s.app.read(s.child.session.id),parent=await s.app.read(s.parent.session.id),at=new Date().toISOString();
 await assert.rejects(()=>s.store.saveDraft({id:randomUUID(),version:1,session_id:child.session.id,attempt_id:child.attempts[0].id,source_revision:child.source.owner.revision_id,baseline_decision_id:null,fields:{...decision,choice:'no_action',candidate_id:null,evidence_refs:child.source.evidence_refs,finding_refs:[child.source.finding_id]},status:'pending',edited:false,created_at:at,decided_at:null,reason:null}),/FORBIDDEN/);
 await assert.rejects(()=>s.store.saveAttempt({...parent.attempts[0],id:randomUUID(),session_id:child.session.id}),/FORBIDDEN/);
 assert.equal((await s.app.read(child.session.id)).drafts.length,0);assert.equal((await s.app.read(child.session.id)).attempts.length,1);assert.deepEqual(await s.store.formalHistory(s.baseline.owner),{decisions:[],reports:[]});
}));

test('AC-FS-08 return rechecks aggregate identity inside its publication transaction',async()=>withFork('return-source-boundary',async s=>{
 await s.start();await s.wait(s.child.session.id,'Succeeded');const result=(await s.app.readCollaboration(s.child.session.id)).results[0],target={result_id:result.id,result_version:result.version,result_sha256:result.sha256};
 const exec=DatabaseSync.prototype.exec,prepare=DatabaseSync.prototype.prepare,targets=new WeakSet<DatabaseSync>();let injected=0;
 DatabaseSync.prototype.prepare=function(sql:string){if(sql==='ATTACH DATABASE ? AS original')targets.add(this);return prepare.call(this,sql);};
 DatabaseSync.prototype.exec=function(sql:string){if(sql==='BEGIN IMMEDIATE'&&targets.has(this)&&injected===0){injected++;const original=new DatabaseSync(join(s.root,'.xanthil/desktop/state.sqlite'));try{original.prepare('UPDATE aggregate_artifacts SET sha256=? WHERE artifact_id=?').run('f'.repeat(64),result.source.aggregate.artifact_id);}finally{original.close();}}return exec.call(this,sql);};
 try{await assert.rejects(()=>s.store.returnChild(s.child.session.id,target,randomUUID(),new Date().toISOString(),result.source,new AbortController().signal),/STALE|AUTHORIZATION/);}finally{DatabaseSync.prototype.exec=exec;DatabaseSync.prototype.prepare=prepare;}
 assert.equal(injected,1);const state=await s.store.readParentCollaboration(s.parent.session.id);assert.equal(state.deliveries[0].status,'unreturned');assert.equal(state.materials.length,0);assert.equal(s.calls.length,2);
}));

test('AC-FS-06/09 review receipt failure rolls back disposition/material; committed unknown response reads back once',async()=>withFork('review-atomicity',async s=>{
 await s.start();await s.wait(s.child.session.id,'Succeeded');const result=(await s.app.readCollaboration(s.child.session.id)).results[0],target={result_id:result.id,result_version:result.version,result_sha256:result.sha256};await s.app.returnResult(s.child.session.id,target,randomUUID());
 const command=randomUUID(),prepare=DatabaseSync.prototype.prepare;let faults=0;
 DatabaseSync.prototype.prepare=function(sql:string){if(sql==='INSERT INTO receipts VALUES(?,?,?)'){faults++;throw Error('synthetic receipt disk failure');}return prepare.call(this,sql);};
 try{await assert.rejects(()=>s.app.reviewResult(s.parent.session.id,target,command,'adopted','已核对',true),/synthetic receipt/);}finally{DatabaseSync.prototype.prepare=prepare;}
 assert.equal(faults,1);let state=await s.app.readParent(s.parent.session.id);assert.equal(state.reviews.length,0);assert.equal(state.materials.length,0);assert.equal(state.deliveries[0].status,'returned');
 const exec=DatabaseSync.prototype.exec;let committed=0;DatabaseSync.prototype.exec=function(sql:string){const value=exec.call(this,sql);if(sql==='COMMIT'&&committed===0){committed++;throw Error('synthetic lost COMMIT response');}return value;};
 let review;try{review=await s.app.reviewResult(s.parent.session.id,target,command,'adopted','已核对',true);}finally{DatabaseSync.prototype.exec=exec;}
 assert.equal(committed,1);assert.deepEqual(await s.app.reviewResult(s.parent.session.id,target,command,'adopted','已核对',true),review);state=await s.app.readParent(s.parent.session.id);assert.equal(state.reviews.length,1);assert.equal(state.materials.length,1);assert.deepEqual(await s.store.formalHistory(s.baseline.owner),{decisions:[],reports:[]});
}));

test('AC-FS-08 source invalidation while model awaits refuses a late question without Waiting',async()=>withFork('late-question-source',async s=>{
 let entered!:()=>void,release!:()=>void;const reached=new Promise<void>(r=>entered=r),gate=new Promise<void>(r=>release=r);
 s.setResponse(async()=>{entered();await gate;return {kind:'question',text:'已失效来源的问题'};});await s.start();await reached;
 const p0=await s.app.read(s.parent.session.id),id=randomUUID(),at=new Date().toISOString();
 await s.store.saveDraft({id,version:1,session_id:p0.session.id,attempt_id:p0.attempts[0].id,source_revision:p0.source.owner.revision_id,baseline_decision_id:null,fields:{...decision,choice:'no_action',candidate_id:null,evidence_refs:p0.source.evidence_refs,finding_refs:[p0.source.finding_id]},status:'pending',edited:false,created_at:at,decided_at:null,reason:null});
 await s.store.adopt({command_id:randomUUID(),draft_id:id,draft_version:1,session_id:p0.session.id,actor:'合成人工',at,source:p0.source});
 release();await s.wait(s.child.session.id,'Failed');
 const p=await s.app.readCollaboration(s.child.session.id);assert.equal(p.results.length,0);assert.equal(p.events.filter(e=>e.kind==='question').length,0);assert.equal(s.app.occupant(),null);assert.equal(s.calls.length,2);
}));

test('AC-FS-08 Stop before result publication preserves stopped status with zero saved results',async()=>withFork('stop-before-result',async s=>{
 let entered!:()=>void,release!:()=>void;const reached=new Promise<void>(r=>entered=r),gate=new Promise<void>(r=>release=r),original=s.store.finishChild;
 s.store.finishChild=async(...args)=>{entered();await gate;return original(...args);};await s.start();await reached;await s.app.stop(s.child.session.id);release();
 await s.wait(s.child.session.id,'Stopped');await new Promise(r=>setTimeout(r,20));const p=await s.app.readCollaboration(s.child.session.id);assert.equal(p.results.length,0);assert.equal(p.attempts[0].status,'Stopped');assert.equal((await s.app.readParent(s.parent.session.id)).deliveries.length,0);
}));

test('AC-FS-08/09 parent close interrupts Waiting child and prevents new preview until explicit reopen',async()=>withFork('parent-close',async s=>{
 s.setResponse(async()=>({kind:'question',text:'需要用户确认边界？'}));await s.start();await s.wait(s.child.session.id,'Waiting');
 await s.app.closeSession(s.parent.session.id);
 assert.equal((await s.app.read(s.child.session.id)).attempts.at(-1)?.status,'Interrupted');
 await assert.rejects(()=>s.app.prepareCollaboration(s.child.session.id,'不应开始',[],[]),/CLOSED|INTERRUPTED/);
 assert.equal(s.calls.length,2);assert.equal((await s.app.readCollaboration(s.child.session.id)).results.length,0);
}));

test('AC-FS-08/09 close wins while local return is pending; saved success remains and no delivery is published',async()=>withFork('pending-return-close',async s=>{
 await s.start();await s.wait(s.child.session.id,'Succeeded');const result=(await s.app.readCollaboration(s.child.session.id)).results[0];
 let entered!:()=>void,release!:()=>void;const reached=new Promise<void>(r=>entered=r),gate=new Promise<void>(r=>release=r),original=s.store.returnChild;
 s.store.returnChild=async(...args)=>{entered();await gate;return original(...args);};
 const returning=s.app.returnResult(s.child.session.id,{result_id:result.id,result_version:result.version,result_sha256:result.sha256},randomUUID());
 await reached;await s.app.closeSession(s.parent.session.id);release();await assert.rejects(returning,/CLOSED|INTERRUPTED/);
 const parent=await s.app.readParent(s.parent.session.id);assert.equal(parent.deliveries[0].status,'unreturned');assert.equal(parent.materials.length,0);assert.equal((await s.app.read(s.child.session.id)).attempts[0].status,'Succeeded');assert.equal(s.calls.length,2);
}));

test('AC-FS-03 one shared app lease holds Waiting and prevents a root concurrent model start',async()=>withFork('global-waiting',async s=>{
 s.setResponse(async()=>({kind:'question',text:'等待用户'}));await s.start();await s.wait(s.child.session.id,'Waiting');
 const rootGrant=await s.app.prepare(s.parent.session.id,'不应同时运行');
 await assert.rejects(()=>s.app.start(s.parent.session.id,rootGrant.id,true),/BUSY/);
 assert.equal(s.calls.length,2);assert.equal((await s.app.read(s.parent.session.id)).attempts.length,1);
 await s.app.stop(s.child.session.id);await s.app.start(s.parent.session.id,rootGrant.id,true);await s.wait(s.parent.session.id,'Waiting');assert.equal(s.calls.length,3);
}));

test('AC-FS-05 Subagent question then success automatically returns once without parent execution',async()=>withFork('subagent-success',async s=>{
 assert.equal(s.child.relation.cutoff_id,null);s.setResponse(async()=>({kind:'question',text:'只检查已有证据吗？'}));await s.start();await s.wait(s.child.session.id,'Waiting');assert.equal((await s.app.readParent(s.parent.session.id)).deliveries.length,0);
 s.setResponse(s.complete);await s.app.send(s.child.session.id,'是');await s.wait(s.child.session.id,'Succeeded');
 for(let i=0;i<100&&(await s.app.readParent(s.parent.session.id)).deliveries[0]?.status!=='returned';i++)await new Promise(r=>setTimeout(r,5));
 const p=await s.app.readParent(s.parent.session.id);assert.equal(p.results.length,1);assert.equal(p.deliveries[0].status,'returned');assert.equal(p.materials.length,0);assert.equal((await s.app.read(s.parent.session.id)).attempts.length,1);assert.equal(s.calls.length,3);assert.equal(s.calls.at(-1)?.collaboration?.purpose,'subagent');assert.deepEqual(await s.store.formalHistory(s.baseline.owner),{decisions:[],reports:[]});
},'subagent'));

test('AC-FS-05/09 failed Subagent delivery retains success and explicit retry is local only',async()=>withFork('subagent-delivery-failed',async s=>{
 const original=s.store.returnChild;let returns=0;s.store.returnChild=async()=>{returns++;throw Error('synthetic local delivery failure');};await s.start();await s.wait(s.child.session.id,'Succeeded');
 for(let i=0;i<100&&(await s.app.readParent(s.parent.session.id)).deliveries[0]?.status!=='failed';i++)await new Promise(r=>setTimeout(r,5));
 const p=await s.app.readParent(s.parent.session.id);assert.equal(returns,1);assert.equal(p.deliveries[0].status,'failed');assert.equal(p.results.length,1);assert.equal((await s.app.read(s.child.session.id)).attempts[0].status,'Succeeded');
 s.store.returnChild=original;const r=p.results[0],target={result_id:r.id,result_version:r.version,result_sha256:r.sha256};await s.app.returnResult(s.child.session.id,target,randomUUID());assert.equal((await s.app.readParent(s.parent.session.id)).deliveries[0].status,'returned');assert.equal(s.calls.length,2);
},'subagent'));

test('AC-FS-08/09 Subagent parent close/reopen after result commit fences automatic return',async()=>withFork('subagent-late-return',async s=>{
 let entered!:()=>void,release!:()=>void;const reached=new Promise<void>(r=>entered=r),gate=new Promise<void>(r=>release=r),original=s.store.finishChild;s.store.finishChild=async(...args)=>{const result=await original(...args);entered();await gate;return result;};await s.start();await reached;
 await s.app.closeSession(s.parent.session.id);await s.app.reopenSession(s.parent.session.id,(await s.app.lifecycle(s.parent.session.id)).epoch);await s.app.reopenSession(s.child.session.id,(await s.app.lifecycle(s.child.session.id)).epoch);release();await new Promise(r=>setTimeout(r,30));
 let p=await s.app.readParent(s.parent.session.id);assert.equal(p.results.length,1);assert.equal(p.deliveries[0].status,'unreturned');assert.equal((await s.app.read(s.child.session.id)).attempts[0].status,'Succeeded');const r=p.results[0];await s.app.returnResult(s.child.session.id,{result_id:r.id,result_version:r.version,result_sha256:r.sha256},randomUUID());p=await s.app.readParent(s.parent.session.id);assert.equal(p.deliveries[0].status,'returned');assert.equal(s.calls.length,2);
},'subagent'));

for(const mode of ['advice','failure','stop','budget','timeout','wait-expired'] as const)test('AC-FS-05/08 installed Pi Subagent '+mode+' publishes no complete result or delivery',async()=>withFork('subagent-'+mode,async s=>{
 let entered!:()=>void,release!:()=>void;const reached=new Promise<void>(r=>entered=r),gate=new Promise<void>(r=>release=r);
 s.setResponse(async()=>{if(mode==='failure')throw Error('synthetic transport unavailable');if(mode==='advice')return {kind:'advice',text:'不完整建议'};if(mode==='stop'||mode==='timeout'){entered();await gate;return {kind:'result',summary:'迟到结果',references:[],limitations:['限制'],unknowns:[]};}if(mode==='wait-expired')return {kind:'question',text:'等待回答'};return {kind:'tool',tool:'read_case',revision_id:s.baseline.owner.revision_id};});
 await s.start();if(mode==='stop'){await reached;await s.app.stop(s.child.session.id);}
 const expected=mode==='stop'?'Stopped':mode==='budget'?'BudgetExhausted':mode==='timeout'?'TimedOut':mode==='wait-expired'?'WaitExpired':'Failed';await s.wait(s.child.session.id,expected);
 if(mode==='stop'||mode==='timeout')assert.equal(s.app.occupant()?.session_id,s.child.session.id,'C4 logical terminal retains the issued Pi turn');
 release();for(let i=0;i<100&&s.app.occupant()!==null;i++)await new Promise(r=>setTimeout(r,5));
 const p=await s.app.readParent(s.parent.session.id);assert.equal(p.results.length,0);assert.equal(p.deliveries.length,0);assert.equal(p.materials.length,0);assert.equal(s.app.occupant(),null);assert.equal((await s.app.read(s.parent.session.id)).attempts.length,1);assert.deepEqual(await s.store.formalHistory(s.baseline.owner),{decisions:[],reports:[]});
},'subagent',mode==='budget'?{turns:2}:mode==='timeout'?{execution_ms:500}:mode==='wait-expired'?{waiting_ms:100}:{}));

test('AC-FS-09 failed Application close can be explicitly retried and persists the family',async()=>withFork('close-storage-retry',async s=>{
 const original=s.store.closeFamily;let failed=false;s.store.closeFamily=async(...args)=>{if(!failed){failed=true;throw Error('synthetic close disk failure');}return original(...args);};
 await assert.rejects(()=>s.app.close(),/synthetic close disk failure/);assert.equal((await s.store.readLifecycle(s.parent.session.id)).open,true);await s.app.close();assert.equal((await s.store.readLifecycle(s.parent.session.id)).open,false);assert.equal((await s.store.readLifecycle(s.child.session.id)).open,false);assert.equal(s.calls.length,1);
}));

test('AC-FS-09 Profile retains the failed-close Application for a real native retry',async()=>withFork('profile-close-retry',async s=>{
 const {createPersonalXanthilDesktopProfile}=await import('../../../profiles/personal/xanthil-desktop.ts');const profile=createPersonalXanthilDesktopProfile({toolchainDeployment:{descriptor_path:join(s.root,'unused-descriptor.json')},assistanceConfig:null,clock:()=>new Date(),deadlineScheduler:{schedule(){return {cancel(){}};}}});await profile.openProject({contract_version:'1.0',command_id:randomUUID(),projectDirectoryCapability:{projectRoot:s.root,display_name:'合成'},display_name:'合成'});const app=profile.getCaseAssistant()!;await app.read(s.parent.session.id);
 const exec=DatabaseSync.prototype.exec;let failed=false;DatabaseSync.prototype.exec=function(sql:string){if(sql==='BEGIN IMMEDIATE'&&!failed){failed=true;throw Error('synthetic close lock failure');}return exec.call(this,sql);};try{await assert.rejects(()=>profile.closeModelWork(),/synthetic close lock failure/);}finally{DatabaseSync.prototype.exec=exec;}
 assert.equal(profile.getCaseAssistant(),app,'failed close must retain its owner for retry');await profile.closeModelWork();assert.equal((await s.store.readLifecycle(s.parent.session.id)).open,false);assert.equal(profile.getCaseAssistant(),null);
}));

test('AC-FS-06/08/09 exact return readback and terminal decline preserve successful history',async()=>withFork('return-readback-decline',async s=>{
 await s.start();await s.wait(s.child.session.id,'Succeeded');const r=(await s.app.readCollaboration(s.child.session.id)).results[0],target={result_id:r.id,result_version:r.version,result_sha256:r.sha256};
 for(const bad of [{...target,result_version:2},{...target,result_sha256:'f'.repeat(64)}])await assert.rejects(()=>s.app.returnResult(s.child.session.id,bad,randomUUID()),/STALE_RESULT/);
 assert.equal((await s.app.readParent(s.parent.session.id)).deliveries[0].status,'unreturned');
 const exec=DatabaseSync.prototype.exec;let lost=0;DatabaseSync.prototype.exec=function(sql:string){const v=exec.call(this,sql);if(sql==='COMMIT'&&!lost++){throw Error('synthetic return COMMIT response lost');}return v;};let saved;const command=randomUUID();try{saved=await s.app.returnResult(s.child.session.id,target,command);}finally{DatabaseSync.prototype.exec=exec;}
 assert.equal(lost,1);assert.deepEqual(await s.app.returnResult(s.child.session.id,target,command),saved);await s.app.reviewResult(s.parent.session.id,target,randomUUID(),'declined','依据不足，保留原文',true);await assert.rejects(()=>s.app.reviewResult(s.parent.session.id,target,randomUUID(),'adopted','改变终态',true),/REVIEW_FINAL/);
 const p=await s.app.readParent(s.parent.session.id);assert.equal(p.materials.length,0);assert.equal(p.reviews.length,1);assert.equal(p.reviews[0].disposition,'declined');assert.deepEqual(p.results,[r]);assert.equal(s.calls.length,2);
}));

test('AC-FS-09 restart with no Runtime recovers saved Subagent delivery only by explicit local retry',async()=>withFork('subagent-restart-local',async s=>{
 s.store.returnChild=async()=>{throw Error('synthetic delivery unavailable');};await s.start();await s.wait(s.child.session.id,'Succeeded');for(let i=0;i<100&&(await s.app.readParent(s.parent.session.id)).deliveries[0]?.status!=='failed';i++)await new Promise(r=>setTimeout(r,5));await s.app.close();
 const {createLocalCaseAssistantStore}=await import('../../../adapters/storage-local/case-assistant.ts'),{createCaseAssistantApplication}=await import('../../../packages/application/case-assistant.ts');const store=createLocalCaseAssistantStore({projectRoot:s.root}),app=createCaseAssistantApplication({store,runtime:null,config:null,clock:()=>new Date()});await app.reopen();
 try{let p=await app.readParent(s.parent.session.id);const r=p.results[0],target={result_id:r.id,result_version:r.version,result_sha256:r.sha256};assert.equal(p.deliveries[0].status,'failed');await assert.rejects(()=>app.returnResult(s.child.session.id,target,randomUUID()),/PARENT_CLOSED/);await app.reopenSession(s.parent.session.id,(await app.lifecycle(s.parent.session.id)).epoch);await app.reopenSession(s.child.session.id,(await app.lifecycle(s.child.session.id)).epoch);
 await new Promise(r=>setTimeout(r,20));assert.equal((await app.readParent(s.parent.session.id)).deliveries[0].status,'failed');const a=await app.prepareCollaboration(s.child.session.id,'没有模型权限',[],[]);assert.ok(a.blockers.includes('模型未配置'));await assert.rejects(()=>app.start(s.child.session.id,a.id,true),/AUTHORITY_REQUIRED/);
 await app.returnResult(s.child.session.id,target,randomUUID());p=await app.readParent(s.parent.session.id);assert.equal(p.deliveries[0].status,'returned');assert.equal((await app.read(s.child.session.id)).attempts.length,1);assert.equal(s.calls.length,2);
 }finally{await app.close();}
},'subagent'));

test('AC-FS-08/09 pending child authorization cannot survive a close and explicit reopen',async()=>withFork('prepare-close-reopen',async s=>{
 const original=s.store.childResults;let entered!:()=>void,release!:()=>void,held=false;
 const reached=new Promise<void>(r=>entered=r),gate=new Promise<void>(r=>release=r);
 s.store.childResults=async(...args)=>{const value=await original(...args);if(!held){held=true;entered();await gate;}return value;};
 const pending=s.app.prepareCollaboration(s.child.session.id,'关闭前的任务',[],[]);
 await reached;await s.app.closeSession(s.child.session.id);await s.app.reopenSession(s.child.session.id,(await s.app.lifecycle(s.child.session.id)).epoch);release();
 await assert.rejects(pending,/INTERRUPTED|CLOSED/);s.store.childResults=original;
 assert.equal((await s.app.read(s.child.session.id)).attempts.length,0);assert.equal(s.calls.length,1);
 const fresh=await s.app.prepareCollaboration(s.child.session.id,'重新核对的任务',[],[]);assert.equal(fresh.collaboration?.child_epoch,(await s.app.lifecycle(s.child.session.id)).epoch);
}));


test('AC-FS-05/09 native delivery fault preserves schema and healthy authorization/result before one failed write and local retry',async()=>withFork('native-delivery-fixture-health',async s=>{
 const {installDeliveryWriteFault}=createRequire(import.meta.url)('../../fixtures/case-assistant/collaboration-delivery-fault.cjs');
 const path=join(s.root,'.xanthil/desktop/case-assistant.sqlite');
 const schema=()=>{const db=new DatabaseSync(path);try{return db.prepare('SELECT type,name,tbl_name,sql FROM sqlite_schema ORDER BY type,name').all();}finally{db.close();}};
 const before=schema(),fault=installDeliveryWriteFault();
 try{
  fault.arm(path,s.child.session.id);assert.ok((await s.store.listSessions(s.baseline.owner.project_id)).length);assert.equal((await s.app.readCollaboration(s.child.session.id)).valid,true);
  const siblingPreview=await s.app.prepareChild(s.parent.session.id,'subagent','非目标正常回流',null,[],[],false),sibling=await s.app.createChild(s.parent.session.id,siblingPreview.id,randomUUID(),true);
  const other=await s.app.prepareCollaboration(sibling.session.id,'正常授权',[],[]);await s.app.start(sibling.session.id,other.id,true);await s.wait(sibling.session.id,'Succeeded');
  for(let i=0;i<100&&!(await s.app.readParent(s.parent.session.id)).deliveries.some(d=>d.status==='returned');i++)await new Promise(r=>setTimeout(r,5));
  assert.equal((await s.app.readCollaboration(sibling.session.id)).deliveries[0].status,'returned');assert.equal(fault.read().hits.length,0,'other child is unaffected');
  const grant=await s.app.prepareCollaboration(s.child.session.id,'正常目标授权',[],[]);assert.deepEqual(grant.blockers,[]);assert.equal(fault.read().hits.length,0,'preparation is healthy');
  await s.app.start(s.child.session.id,grant.id,true);await s.wait(s.child.session.id,'Succeeded');
  for(let i=0;i<100&&(await s.app.readCollaboration(s.child.session.id)).deliveries[0]?.status!=='failed';i++)await new Promise(r=>setTimeout(r,5));
  const state=await s.app.readCollaboration(s.child.session.id),result=state.results[0];assert.equal(state.valid,true);assert.equal(state.attempts[0].status,'Succeeded');assert.equal(state.results.length,1);assert.equal(state.deliveries[0].status,'failed');
  assert.deepEqual(fault.read(),{armed:null,hits:[{child:s.child.session.id,result_id:result.id,version:result.version,sha256:result.sha256,attempt_id:result.attempt_id,attempt_status:'Succeeded',boundary:'before-return-update'}]});
  const calls=s.calls.length;await s.app.returnResult(s.child.session.id,{result_id:result.id,result_version:result.version,result_sha256:result.sha256},randomUUID());
  const recovered=await s.app.readCollaboration(s.child.session.id);assert.equal(recovered.deliveries[0].status,'returned');assert.equal(recovered.attempts.length,1);assert.deepEqual(recovered.results,[result]);assert.equal(s.calls.length,calls);assert.equal(fault.read().hits.length,1);assert.deepEqual(schema(),before);
  // Preserve the exact schema refusal; this invalid fixture is never used for a model turn.
  const db=new DatabaseSync(path);db.exec('CREATE TRIGGER forbidden_fixture_trigger AFTER UPDATE ON collaboration_returns BEGIN SELECT 1; END');db.close();
  try{await assert.rejects(s.store.listSessions(s.baseline.owner.project_id),{code:'SCHEMA_UNSUPPORTED'});}finally{const repair=new DatabaseSync(path);repair.exec('DROP TRIGGER forbidden_fixture_trigger');repair.close();}
  assert.deepEqual(schema(),before);assert.ok((await s.store.listSessions(s.baseline.owner.project_id)).length);
 }finally{fault.restore();}
},'subagent'));

test('F1/F2 family close synchronously revokes child pending admission before persistence and preserves other family',async()=>withFork('family-pending-fence',async s=>{
 const {createCaseAssistantApplication}=await import('../../../packages/application/case-assistant.ts'),{createLocalModelAccess}=await import('../../../packages/application/provider-settings.ts');const access=createLocalModelAccess(true);let admitted!:()=>void,release!:()=>void,releaseClose!:()=>void,calls=0;const entered=new Promise<void>(r=>admitted=r),gate=new Promise<void>(r=>release=r),closeGate=new Promise<void>(r=>releaseClose=r);
 const other=await s.app.link(s.baseline.owner,'第二父家庭',randomUUID()),otherBefore=await s.app.read(other.session.id),lifeBefore=await s.app.lifecycle(other.session.id);const store={...s.store,async closeFamily(...args:Parameters<typeof s.store.closeFamily>){await closeGate;return s.store.closeFamily(...args);}};
 const app=createCaseAssistantApplication({store,config,clock:()=>new Date(),modelAccess:{...access,async acquire(...args){const lease=await access.acquire(...args);admitted();await gate;return lease;}},runtime:{async turn(){calls++;return {provider:config.provider,model:config.model,cost_microunits:0,output:{kind:'question',text:'late'}};}}});
 const a=await app.prepareCollaboration(s.child.session.id,'待准入',[],[]),pending=app.start(s.child.session.id,a.id,true);await entered;const closing=app.closeSession(s.parent.session.id);release();let failure:unknown;try{await pending;await new Promise(r=>setTimeout(r,20));assert.equal(calls,0,'family fence is effective before close SQLite resolves');assert.equal((await s.store.readSession(s.child.session.id)).attempts.length,0);}catch(e){failure=e;}finally{releaseClose();await closing;await app.close();}
 assert.deepEqual(await s.app.read(other.session.id),otherBefore);assert.deepEqual(await s.app.lifecycle(other.session.id),lifeBefore);if(failure)throw failure;
}));

test('F5 AC-FS-07/09 captured writer killed before/after create finish review COMMIT recovers atomically in new process',{timeout:120000},async()=>{
 const {mkdir,cp,readFile,writeFile,readdir}=await import('node:fs/promises'),{spawn}=await import('node:child_process'),{createHash}=await import('node:crypto');const {completedCase}=await import('../../fixtures/case-assistant/completed-case.ts'),{createLocalCaseAssistantStore}=await import('../../../adapters/storage-local/case-assistant.ts'),{createCaseAssistantApplication}=await import('../../../packages/application/case-assistant.ts');
 const evidence=join(process.env.JUANERAI_TEST_EVIDENCE_DIR!,'f5-process-atomicity');await mkdir(evidence);const driver=new URL('../../fixtures/case-assistant/collaboration-crash-process.mjs',import.meta.url);const sha=(b:Uint8Array)=>createHash('sha256').update(b).digest('hex');
 async function run(args:string[],killAtHit=false){const child=spawn(process.execPath,args,{cwd:process.cwd(),env:{PATH:process.env.PATH!,JUANERAI_TOOLCHAIN_BIN:process.env.JUANERAI_TOOLCHAIN_BIN!},stdio:['ignore','pipe','pipe']});let stdout='',stderr='',hit=false;const exited=new Promise<{code:number|null;signal:string|null}>(r=>child.once('exit',(code,signal)=>r({code,signal})));const timer=setTimeout(()=>{if(child.exitCode===null&&child.signalCode===null)child.kill('SIGKILL');},20000);child.stdout.on('data',b=>{stdout+=b;if(killAtHit&&!hit&&stdout.includes('"sql":"COMMIT"')){hit=true;child.kill('SIGKILL');}});child.stderr.on('data',b=>stderr+=b);const result=await exited;clearTimeout(timer);return {...result,pid:child.pid,spawnfile:child.spawnfile,args:child.spawnargs,stdout,stderr,hit};}
 for(const operation of ['create','finish','review']){
  const template=join(evidence,'template-'+operation);await mkdir(template);const baseline=await completedCase(template,true),store=createLocalCaseAssistantStore({projectRoot:template});let question=operation==='finish';
  const app=createCaseAssistantApplication({store,config,clock:()=>new Date(),runtime:{async turn(input){const a=JSON.parse(input.payload).authorized_context;return {provider:config.provider,model:config.model,cost_microunits:0,output:question?{kind:'question',text:'合成等待'}:{kind:'result',summary:'合成完整意见',references:[a.allowed_references[0]],limitations:['合成'],unknowns:[]}};}}});
  const parent=await app.link(baseline.owner,'进程边界父',randomUUID()),preview=await app.prepareChild(parent.session.id,'subagent','进程原子边界',null,[],[],false),session={id:randomUUID(),title:preview.task,source:baseline.owner,created_at:new Date().toISOString(),archived:false};let spec:any={operation,parent:parent.session.id,preview,session,command:randomUUID(),at:new Date().toISOString(),source:parent.source};
  try{
   if(operation!=='create'){
    const child=await app.createChild(parent.session.id,preview.id,randomUUID(),true),grant=await app.prepareCollaboration(child.session.id,'进程检查',[],[]);await app.start(child.session.id,grant.id,true);let p=await app.read(child.session.id);for(let i=0;i<200&&p.attempts.at(-1)?.status!==(question?'Waiting':'Succeeded');i++){await new Promise(r=>setTimeout(r,5));p=await app.read(child.session.id);}assert.equal(p.attempts.at(-1)?.status,question?'Waiting':'Succeeded');
    if(operation==='finish'){spec.attempt={...p.attempts.at(-1),status:'Succeeded',ended_at:spec.at,waiting_deadline:null,reason:null};spec.value={kind:'result',summary:'合成完整意见',references:[grant.collaboration!.allowed_references[0]],limitations:['合成'],unknowns:[]};}
    else{const result=(await store.childResults(child.session.id))[0];for(let i=0;i<100&&(await store.readParentCollaboration(parent.session.id)).deliveries.find(d=>d.result_id===result.id)?.status!=='returned';i++)await new Promise(r=>setTimeout(r,5));spec.target={result_id:result.id,result_version:result.version,result_sha256:result.sha256};}
   }
   for(const point of ['before','after']){
    const dir=join(evidence,operation+'-'+point);await mkdir(dir);const project=join(dir,'project');await cp(template,project,{recursive:true});await cp(join(project,'.xanthil/desktop'),join(dir,'db-before'),{recursive:true});const input={...spec,point,project,hit:join(dir,'hit.json'),readback:join(dir,'recovery.json')};const inputPath=join(dir,'input.json');await writeFile(inputPath,JSON.stringify(input));
    const killed=await run([driver.pathname,inputPath,'writer'],true);await writeFile(join(dir,'writer.json'),JSON.stringify(killed,null,2));assert.equal(killed.hit,true);assert.equal(killed.signal,'SIGKILL');assert.equal(killed.code,null);assert.equal(JSON.parse(await readFile(input.hit,'utf8')).pid,killed.pid);await cp(join(project,'.xanthil/desktop'),join(dir,'db-killed'),{recursive:true});
    const recovery=await run([driver.pathname,inputPath,'recover']);await writeFile(join(dir,'reader.json'),JSON.stringify(recovery,null,2));assert.equal(recovery.code,0,recovery.stderr);const r=JSON.parse(await readFile(input.readback,'utf8'));assert.notEqual(r.pid,killed.pid);assert.equal(r.model_calls,0);const count=(where:any,table:string)=>where.rows[table]?.length??0;
    if(operation==='create'){assert.equal(r.before.version,point==='before'?100:101);assert.equal(count(r.before,'collaboration_children'),point==='before'?0:1);assert.equal(count(r.after,'collaboration_children'),1);assert.deepEqual(r.first,r.second);}
    if(operation==='finish'){assert.equal(count(r.before,'collaboration_results'),point==='before'?0:1);assert.equal(count(r.before,'collaboration_returns'),point==='before'?0:1);const attempts=r.recovered.rows.attempts.map((v:any)=>JSON.parse(v.body));assert.equal(attempts.at(-1).status,point==='before'?'Interrupted':'Succeeded');if(point==='after')assert.deepEqual(r.first,r.second);else assert.equal(r.error,'INTERRUPTED');assert.equal(count(r.after,'collaboration_results'),point==='before'?0:1);for(const row of r.after.rows.collaboration_returns??[])assert.equal(JSON.parse(row.body).status,'unreturned');}
    if(operation==='review'){assert.equal(count(r.before,'collaboration_reviews'),point==='before'?0:1);assert.equal(r.before.parent.materials.length,point==='before'?0:1);assert.equal(count(r.after,'collaboration_reviews'),1);assert.equal(r.after.parent.materials.length,1);assert.equal(r.after.parent.materials[0].id,JSON.parse(r.after.rows.collaboration_reviews[0].body).material_id);assert.deepEqual(r.first,r.second);}
    await cp(join(project,'.xanthil/desktop'),join(dir,'db-recovered'),{recursive:true});const identity=[];for(const snapshot of ['db-before','db-killed','db-recovered'])for(const entry of await readdir(join(dir,snapshot),{withFileTypes:true})){if(!entry.isFile())continue;const name=entry.name,b=await readFile(join(dir,snapshot,name));identity.push({snapshot,name,bytes:b.length,sha256:sha(b)});}await writeFile(join(dir,'db-identities.json'),JSON.stringify(identity,null,2));
   }
  }finally{await app.close();}
 }
});

test('F1 AC-FS-09 schema100 explicit v1.1 parent close persists and revokes grants without read or cancel migration',async()=>{
 const {mkdir,readFile,writeFile}=await import('node:fs/promises'),{completedCase}=await import('../../fixtures/case-assistant/completed-case.ts'),{createLocalCaseAssistantStore}=await import('../../../adapters/storage-local/case-assistant.ts'),{createCaseAssistantApplication}=await import('../../../packages/application/case-assistant.ts'),{createCaseAssistantHandler}=await import('../../../apps/desktop/case-assistant-main.ts');
 const root=join(process.env.JUANERAI_TEST_EVIDENCE_DIR!,'schema100-explicit-close');await mkdir(root);const baseline=await completedCase(root),store=createLocalCaseAssistantStore({projectRoot:root});let calls=0;
 const dependencies={store,config,clock:()=>new Date(),runtime:{async turn(){calls++;return {provider:config.provider,model:config.model,cost_microunits:0,output:{kind:'advice' as const,text:'保存的旧格式父历史'}};}}};
 let app=createCaseAssistantApplication(dependencies);const handler=createCaseAssistantHandler({getApplication:()=>app,senderPolicy:()=>true,exportReport:async()=>{throw Error('unexpected export');}});
 try{
  const parent=await app.link(baseline.owner,'旧格式父 A',randomUUID()),other=await app.link(baseline.owner,'旧格式父 B',randomUUID());const first=await app.prepare(parent.session.id,'保存旧格式历史');await app.start(parent.session.id,first.id,true);
  for(let i=0;i<200&&(await app.read(parent.session.id)).attempts.at(-1)?.status!=='Succeeded';i++)await new Promise(r=>setTimeout(r,5));assert.equal((await app.read(parent.session.id)).attempts.at(-1)?.status,'Succeeded');assert.equal(calls,1);
  const path=join(root,'.xanthil/desktop/case-assistant.sqlite'),before=await readFile(path),original=await readFile(join(root,'.xanthil/desktop/state.sqlite')),history=await store.readSession(parent.session.id),otherHistory=await store.readSession(other.session.id);
  const version=()=>{const db=new DatabaseSync(path,{readOnly:true});try{return Number(db.prepare('PRAGMA user_version').get()!.user_version);}finally{db.close();}};assert.equal(version(),100);
  await app.reopen();await app.read(parent.session.id);await app.list(baseline.owner.project_id);await app.readParent(parent.session.id);await app.reopenSession(parent.session.id,0);
  const cancel=await handler(null,{version:'1.1',operation:'close',session_id:parent.session.id,expected_epoch:0,confirmed:false});assert.equal(cancel.ok,false);assert.deepEqual(await readFile(path),before);assert.equal(version(),100,'open/read/list/cancel cannot migrate');
  const grant=await app.prepare(parent.session.id,'关闭前父授权'),preview=await app.prepareChild(parent.session.id,'subagent','关闭前预览',null,[],[],false);
  const closed=await handler(null,{version:'1.1',operation:'close',session_id:parent.session.id,expected_epoch:0,confirmed:true});await writeFile(join(root,'close-readback.json'),JSON.stringify({closed,lifecycle:await store.readLifecycle(parent.session.id),schema:version(),calls},null,2));assert.ok(closed.ok);assert.deepEqual(closed.value,{open:false,epoch:1},'new explicit close must remain effective before the first child exists');
  const {spawnSync}=await import('node:child_process');
  const reader=spawnSync(process.execPath,['--input-type=module','-e',`
   import {createLocalCaseAssistantStore} from ${JSON.stringify(new URL('../../../adapters/storage-local/case-assistant.ts',import.meta.url).href)};
   import {createCaseAssistantApplication} from ${JSON.stringify(new URL('../../../packages/application/case-assistant.ts',import.meta.url).href)};
   const store=createLocalCaseAssistantStore({projectRoot:process.argv[1]});
   const app=createCaseAssistantApplication({store,runtime:null,config:null,clock:()=>new Date()});await app.reopen();
   let refusal=null;try{await app.prepare(process.argv[2],'fresh process refused');}catch(e){refusal=e.code;}
   console.log(JSON.stringify({pid:process.pid,lifecycle:await app.lifecycle(process.argv[2]),refusal,parent:await store.readSession(process.argv[2]),other:await store.readSession(process.argv[3])}));await app.close();
  `,root,parent.session.id,other.session.id],{env:{PATH:process.env.PATH!,JUANERAI_TOOLCHAIN_BIN:process.env.JUANERAI_TOOLCHAIN_BIN!},encoding:'utf8',timeout:15000});
  await writeFile(join(root,'fresh-process-readback.json'),JSON.stringify({pid:reader.pid,status:reader.status,signal:reader.signal,error:reader.error?.message??null,stdout:reader.stdout,stderr:reader.stderr},null,2));assert.equal(reader.status,0,reader.stderr);const recovery=JSON.parse(reader.stdout);assert.notEqual(recovery.pid,process.pid);assert.deepEqual(recovery.lifecycle,{open:false,epoch:1});assert.equal(recovery.refusal,'SESSION_CLOSED');assert.deepEqual(recovery.parent,history);assert.deepEqual(recovery.other,otherHistory);
  await assert.rejects(()=>app.prepareChild(parent.session.id,'subagent','关闭后拒绝',null,[],[],false),/SESSION_CLOSED/);await assert.rejects(()=>app.createChild(parent.session.id,preview.id,randomUUID(),true));await assert.rejects(()=>app.prepare(parent.session.id,'关闭后父准备'));await assert.rejects(()=>app.start(parent.session.id,grant.id,true));assert.equal(calls,1);
  assert.deepEqual(await store.readSession(parent.session.id),history);assert.deepEqual(await store.readSession(other.session.id),otherHistory);assert.equal((await store.readLifecycle(other.session.id)).open,true);
  await app.close();app=createCaseAssistantApplication(dependencies);await app.reopen();assert.deepEqual(await app.lifecycle(parent.session.id),{open:false,epoch:1});await assert.rejects(()=>app.prepare(parent.session.id,'重开应用不恢复授权'));assert.equal(calls,1);
  await app.reopenSession(parent.session.id,1);assert.deepEqual(await app.lifecycle(parent.session.id),{open:true,epoch:2});await assert.rejects(()=>app.start(parent.session.id,grant.id,true));await assert.rejects(()=>app.createChild(parent.session.id,preview.id,randomUUID(),true));const fresh=await app.prepareChild(parent.session.id,'subagent','显式重开后新预览',null,[],[],false);assert.ok(fresh.id);assert.ok((await app.prepare(parent.session.id,'新父授权')).id);assert.equal(calls,1);assert.equal((await app.readParent(parent.session.id)).deliveries.length,0);assert.deepEqual(await store.readSession(other.session.id),otherHistory);assert.deepEqual(await readFile(join(root,'.xanthil/desktop/state.sqlite')),original);
 }finally{await app.close();}
});

async function legacyCloseFixture(name:string){
 const {mkdir}=await import('node:fs/promises'),{completedCase}=await import('../../fixtures/case-assistant/completed-case.ts'),{createLocalCaseAssistantStore}=await import('../../../adapters/storage-local/case-assistant.ts'),{createCaseAssistantApplication}=await import('../../../packages/application/case-assistant.ts'),{createCaseAssistantHandler}=await import('../../../apps/desktop/case-assistant-main.ts');
 const root=join(process.env.JUANERAI_TEST_EVIDENCE_DIR!,name);await mkdir(root);const baseline=await completedCase(root),store=createLocalCaseAssistantStore({projectRoot:root});let calls=0;const options={store,config,clock:()=>new Date(),runtime:{async turn(){calls++;return {provider:config.provider,model:config.model,cost_microunits:0,output:{kind:'question' as const,text:'真实等待'}};}}};const app=createCaseAssistantApplication(options),parent=await app.link(baseline.owner,'旧父',randomUUID()),other=await app.link(baseline.owner,'其他父',randomUUID());
 const handler=createCaseAssistantHandler({getApplication:()=>app,senderPolicy:()=>true,exportReport:async()=>{throw Error('unexpected export');}});
 return {root,baseline,store,app,parent,other,options,calls:()=>calls,path:join(root,'.xanthil/desktop/case-assistant.sqlite'),close:()=>handler(null,{version:'1.1',operation:'close',session_id:parent.session.id,confirmed:true,expected_epoch:0})};
}
for(const fault of ['before','lost','unreadable'] as const)test('C1 decision003 legacy explicit close atomic '+fault+' COMMIT and idempotent retry',async()=>{
 const {readFile,writeFile}=await import('node:fs/promises'),s=await legacyCloseFixture('legacy-close-'+fault);const grant=await s.app.prepare(s.parent.session.id,'等待关闭');await s.app.start(s.parent.session.id,grant.id,true);for(let i=0;i<200&&(await s.app.read(s.parent.session.id)).attempts.at(-1)?.status!=='Waiting';i++)await new Promise(r=>setTimeout(r,5));assert.equal((await s.app.read(s.parent.session.id)).attempts.at(-1)?.status,'Waiting');
 const before=await readFile(s.path),other=await s.store.readSession(s.other.session.id),exec=DatabaseSync.prototype.exec,prepare=DatabaseSync.prototype.prepare;let hit=false;
 DatabaseSync.prototype.exec=function(sql:string){if(sql==='COMMIT'&&!hit){hit=true;if(fault!=='before')exec.call(this,sql);throw Error('synthetic close COMMIT '+fault);}return exec.call(this,sql);};
 DatabaseSync.prototype.prepare=function(sql:string){if(fault==='unreadable'&&hit)throw Error('synthetic close readback unavailable');return prepare.call(this,sql);};
 let result;try{result=await s.close();}finally{DatabaseSync.prototype.exec=exec;DatabaseSync.prototype.prepare=prepare;}
 try{
  assert.equal(hit,true);assert.equal(result.ok,fault==='lost');if(fault==='unreadable'){assert.equal(result.ok,false);if(!result.ok)assert.equal(result.error.code,'RESULT_PENDING');}
  if(fault==='before'){assert.deepEqual(await readFile(s.path),before);assert.deepEqual(await s.store.readLifecycle(s.parent.session.id),{open:true,epoch:0});}
  else{assert.deepEqual(await s.store.readLifecycle(s.parent.session.id),{open:false,epoch:1});assert.equal((await s.store.readSession(s.parent.session.id)).attempts.at(-1)?.status,'Interrupted');}
  await assert.rejects(()=>s.app.prepare(s.parent.session.id,'未解决时不得启动'));assert.equal(s.calls(),1);
  // Retry the same private explicit-close intent after storage becomes readable.
  await s.app.closeSession(s.parent.session.id,true);const stable=await readFile(s.path);await s.app.closeSession(s.parent.session.id,true);assert.deepEqual(await readFile(s.path),stable);assert.deepEqual(await s.store.readLifecycle(s.parent.session.id),{open:false,epoch:1});assert.deepEqual(await s.store.readSession(s.other.session.id),other);assert.equal((await s.store.readParentCollaboration(s.parent.session.id)).children.length,0);
  await writeFile(join(s.root,'fault-readback.json'),JSON.stringify({fault,result,lifecycle:await s.store.readLifecycle(s.parent.session.id),history:await s.store.readSession(s.parent.session.id),calls:s.calls()},null,2));
 }finally{await s.app.close();}
});

test('C1 decision003 legacy read prepare cancel v1.0 close and ordinary shutdown never migrate',async()=>{
 const {readFile}=await import('node:fs/promises'),s=await legacyCloseFixture('legacy-nonmigrating');const before=await readFile(s.path),grant=await s.app.prepare(s.parent.session.id,'预览');await s.app.reopen();await s.app.list(s.baseline.owner.project_id);await s.app.readParent(s.parent.session.id);await s.app.reopenSession(s.parent.session.id,0);await s.app.closeSession(s.parent.session.id);await assert.rejects(()=>s.app.start(s.parent.session.id,grant.id,true));assert.ok((await s.app.prepare(s.parent.session.id,'旧路径新准备')).id);await s.app.close();assert.deepEqual(await readFile(s.path),before);assert.equal(s.calls(),0);
});

for(const phase of ['parent-preview','child-preview','pending-start'] as const)test('C1 decision003 legacy '+phase+' cannot cross explicit close reopen',async()=>{
 const s=await legacyCloseFixture('legacy-fence-'+phase);let enter!:()=>void,release!:()=>void;const entered=new Promise<void>(r=>enter=r),gate=new Promise<void>(r=>release=r);let held=false;const child=s.store.readChild,life=s.store.readLifecycle,source=s.store.readSource;
 let pending:Promise<unknown>;
 if(phase==='parent-preview'){s.store.readChild=async(...args)=>{const value=await child(...args);if(!held){held=true;enter();await gate;}return value;};pending=s.app.prepareParent(s.parent.session.id,'旧父准备',[],[],[],false);}
 else if(phase==='child-preview'){s.store.readLifecycle=async(...args)=>{const value=await life(...args);if(!held){held=true;enter();await gate;}return value;};pending=s.app.prepareChild(s.parent.session.id,'subagent','旧子预览',null,[],[],false);}
 else{const grant=await s.app.prepare(s.parent.session.id,'待启动');s.store.readSource=async(...args)=>{const value=await source(...args);if(!held){held=true;enter();await gate;}return value;};pending=s.app.start(s.parent.session.id,grant.id,true);}
 const observed=pending.then(value=>({value,error:null}),error=>({value:null,error}));await entered;
 try{assert.equal((await s.close()).ok,true);await s.app.reopenSession(s.parent.session.id,1);release();const done=await observed;if(phase!=='pending-start')assert.ok(done.error,'old pending preview must be refused');assert.equal(s.calls(),0);assert.equal((await s.store.readSession(s.parent.session.id)).attempts.length,0);assert.ok((await s.app.prepare(s.parent.session.id,'新准备')).id);}finally{release();s.store.readChild=child;s.store.readLifecycle=life;s.store.readSource=source;await s.app.close();}
});
