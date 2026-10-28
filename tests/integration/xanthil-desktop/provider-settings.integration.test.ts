import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {mkdtempSync} from 'node:fs';
import {join} from 'node:path';
import {createProviderSettings} from '../../../packages/application/provider-settings.ts';
import {createCaseAssistantApplication} from '../../../packages/application/case-assistant.ts';
import {createXanthilDesktopDecisionCaseApplication} from '../../../packages/application/xanthil-desktop-decision-case.ts';
import {createLocalCaseAssistantStore} from '../../../adapters/storage-local/case-assistant.ts';
import {createLocalDesktopDecisionCaseStore} from '../../../adapters/storage-local/desktop-state.ts';
import {createPiProfessionalAgent} from '../../../adapters/agent-pi/professional-agent.ts';
import {completedCase} from '../../fixtures/case-assistant/completed-case.ts';
import {config} from '../../fixtures/case-assistant/fixtures.ts';
import {openConfirmedDesktopRevision} from '../../fixtures/xanthil-desktop/desktop-contract-drivers.ts';
import {offlineCredentials,offlineResponse} from '../../fixtures/xanthil-desktop/offline-professional-provider.ts';
const oldKey='synthetic-local-old',nextKey='synthetic-local-next';
const root=()=>mkdtempSync(join(process.env.JUANERAI_NEWARCH_SHORT_ROOT!,'ps-'));
function deferred(){let resolve!:()=>void;const promise=new Promise<void>(r=>resolve=r);return {promise,resolve};}
async function settings(){let key:string|null=oldKey;const s=createProviderSettings({store:{async read(){return key?{status:'found' as const,key}:{status:'absent' as const};},async save(v){key=v;},async delete(){key=null;}},async probe(){}});await s.initialize();return s;}
async function replace(s:Awaited<ReturnType<typeof settings>>){const p=await s.request({operation:'test',key:nextKey});assert.equal(p.ok,true);const saved=await s.request({operation:'save',key:nextKey,proof:p.proof!});assert.equal(saved.ok,true);}
async function caseFixture(s:Awaited<ReturnType<typeof settings>>,reply:()=>Promise<Response>){
 const path=root(),base=await completedCase(path),store=createLocalCaseAssistantStore({projectRoot:path,assertCompleted:(...a:Parameters<ReturnType<typeof createPiProfessionalAgent>['assertCompleted']>)=>agent.assertCompleted(...a)});let keys=0;
 const agent=createPiProfessionalAgent({projectRoot:path,analysisModel:'mimo-v2.6-flash',authorizeWork:(id,phase)=>store.authorizesWork(id,phase),credentials:{withCredential:async(p,run)=>{keys++;assert.ok(s.taskCredential());return offlineCredentials.withCredential(p,run);}},fetch:reply}),app=createCaseAssistantApplication({store,agent,config,clock:()=>new Date(),modelAccess:s.access});return {app,agent,store,base,keys:()=>keys};
}
test('PS-05/06 current Case fixes generation before model admission; Stop holds credential until physical settlement',{timeout:10000},async()=>{
 const s=await settings(),entered=deferred(),gate=deferred();let calls=0;
 const f=await caseFixture(s,async()=>{calls++;entered.resolve();await gate.promise;return offlineResponse(calls,[],'迟到意见，不得采纳');});
 try{const p=await f.app.link(f.base.owner,'Synthetic',randomUUID()),id=p.session.id,auth=await f.app.prepare(id,'Synthetic');await replace(s);
 await assert.rejects(()=>f.app.start(id,auth.id,true),{code:'CONFIGURATION_CHANGED'});assert.equal(calls,0);assert.equal(f.keys(),0);assert.equal((await f.app.read(id)).execution,undefined);
 const fresh=await f.app.prepare(id,'Synthetic');await f.app.start(id,fresh.id,true);await entered.promise;assert.equal(s.status().busy,true);assert.equal((await s.request({operation:'delete',confirmed:true})).code,'MODEL_BUSY');
 await f.app.stop(id);assert.equal(s.status().busy,true,'logical stop is not physical settlement');gate.resolve();await assert.rejects(()=>f.app.waitForIdle());assert.equal(s.status().busy,false);assert.equal(calls,1);assert.throws(()=>s.taskCredential(),{code:'AUTHORITY_REQUIRED'});assert.equal((await f.app.read(id)).drafts.length,0);
 }finally{gate.resolve();await f.app.close();await f.agent.waitForIdle();s.close();}
});
type Action='organize_question'|'explain_evidence'|'draft_candidates';
async function desktopFixture(action:Action,s:Awaited<ReturnType<typeof settings>>|undefined,reply:()=>Promise<Response>){
 const path=root(),base=await openConfirmedDesktopRevision(path),raw=createLocalDesktopDecisionCaseStore({projectRoot:path,assertCompleted:(...a:Parameters<ReturnType<typeof createPiProfessionalAgent>['assertCompleted']>)=>agent.assertCompleted(...a)}),hooks:{beforeAdmission?:()=>Promise<void>;beforePermission?:()=>Promise<void>;afterPermission?:()=>Promise<void>;afterRead?:()=>Promise<void>;beforeRecord?:()=>Promise<void>}={},store={...raw,
  checkAssistanceAdmission:async(...a:Parameters<typeof raw.checkAssistanceAdmission>)=>{await hooks.beforeAdmission?.();return raw.checkAssistanceAdmission(...a);},
  authorizeProfessionalDraft:async(...a:Parameters<typeof raw.authorizeProfessionalDraft>)=>{await hooks.beforePermission?.();const r=await raw.authorizeProfessionalDraft(...a);await hooks.afterPermission?.();return r;},
  readProjection:async(...a:Parameters<typeof raw.readProjection>)=>{const r=await raw.readProjection(...a);await hooks.afterRead?.();return r;},
  recordDisclosure:async(...a:Parameters<typeof raw.recordDisclosure>)=>{await hooks.beforeRecord?.();return raw.recordDisclosure(...a);}};let keys=0;
 const agent=createPiProfessionalAgent({projectRoot:path,analysisModel:'mimo-v2.6-flash',authorizeWork:(id,phase)=>store.authorizesProfessionalWork(id,phase),credentials:{withCredential:async(p,run)=>{keys++;return offlineCredentials.withCredential(p,run);}},fetch:reply}),app=createXanthilDesktopDecisionCaseApplication({store,agent,analysisExecution:base.analysisExecution,runEvidenceStore:base.runEvidenceStore,clock:()=>new Date(),deadlineScheduler:base.deadlines.scheduler,...(s?{modelAccess:s.access}:{})});
 await app.openProject({contract_version:'1.0',command_id:randomUUID(),proposed_project_id:base.owner.project_id,display_name:'Synthetic Project'});let p=await app.readProjection(base.owner);const command=()=>({contract_version:'1.0',...base.owner,command_id:randomUUID(),expected_row_version:p.revision!.row_version});
 if(action!=='organize_question'){p=await app.startAnalysis({...command(),confirmation_id:base.confirmationId});for(let i=0;i<200&&p.runs.some(r=>r.status==='Running');i++){await new Promise(r=>setTimeout(r,5));p=await app.readProjection(base.owner);}assert.equal(p.revision!.state,'Review');if(action==='draft_candidates')p=await app.acceptFinding({...command(),finding_id:p.findings.at(-1)!.finding_id});}
 const prepare=()=>app.prepareAssistanceDisclosure({contract_version:'1.0',...base.owner,expected_row_version:p.revision!.row_version,action_kind:action,requested_provider:'xiaomi-token-plan-cn',requested_model:'mimo-v2.6-flash'});
 const accept=async()=>{const q=await prepare();p=await app.decideAssistanceDisclosure({...command(),preview_token:q.preview_token,payload_sha256:q.payload_sha256,decision:'accepted',free_text_confirmed:true});return {...command(),disclosure_id:p.disclosures.at(-1)!.disclosure_id};};
 return {app,agent,store,base,hooks,prepare,accept,command,keys:()=>keys};
}
test('PS-05/06 current Desktop refuses an accepted disclosure from the old credential generation before sending',async()=>{
 const s=await settings(),f=await desktopFixture('organize_question',s,async()=>assert.fail('stale disclosure cannot send'));
 try{const command=await f.accept();await replace(s);await assert.rejects(()=>f.app.startAssistance(command),{code:'CONFIGURATION_CHANGED'});assert.equal(f.keys(),0);assert.equal((await f.app.readProjection(f.base.owner)).assistance_drafts.length,0);}finally{await f.app.close();s.close();}
});
for(const boundary of ['business-read','permission','committed-permission','physical'] as const)for(const action of ['organize_question','explain_evidence','draft_candidates'] as const)test(`F2 current ${action}: close during ${boundary} forbids late publication and holds issued credential`,{timeout:10000},async()=>{
 const s=await settings(),entered=deferred(),gate=deferred();let calls=0;const f=await desktopFixture(action,s,async()=>{calls++;entered.resolve();await gate.promise;return offlineResponse(calls,[],'迟到内容，不得保存');}),command=await f.accept();
 f.hooks.beforeAdmission=async()=>{if(boundary==='business-read'){entered.resolve();await gate.promise;}};f.hooks.beforePermission=async()=>{if(boundary==='permission'){entered.resolve();await gate.promise;}};f.hooks.afterPermission=async()=>{if(boundary==='committed-permission'){entered.resolve();await gate.promise;}};
 try{const starting=f.app.startAssistance(command),started=starting.then(()=>true,()=>false);await entered.promise;const closing=f.app.close();let closed=false;void closing.then(()=>closed=true);await new Promise(r=>setImmediate(r));if(boundary==='physical'){assert.equal(closed,false);assert.equal(s.status().busy,true);}gate.resolve();await started;await closing;await f.agent.waitForIdle();assert.equal(calls,boundary==='physical'?1:0);assert.equal(f.keys(),boundary==='physical'?1:0);assert.equal((await f.app.readProjection(f.base.owner)).assistance_drafts.length,0);assert.equal(s.status().busy,false);assert.throws(()=>s.taskCredential(),{code:'AUTHORITY_REQUIRED'});await assert.rejects(()=>f.app.startAssistance({...command,command_id:randomUUID()}),{code:'SERVICE_CLOSED'});
 }finally{gate.resolve();await f.app.close();await f.agent.waitForIdle();s.close();}
});
test('F2 current Case close invalidates both unused and pending authorization; explicit reopen requires a fresh preview',{timeout:10000},async()=>{
 const s=await settings(),f=await caseFixture(s,async()=>offlineResponse(1,[],'合成新意见'));let armed=false;const entered=deferred(),gate=deferred(),read=f.store.readSession;
 f.store.readSession=async(...a)=>{const r=await read(...a);if(armed){armed=false;entered.resolve();await gate.promise;}return r;};
 try{const linked=await f.app.link(f.base.owner,'Synthetic',randomUUID()),id=linked.session.id,auth=await f.app.prepare(id,'Synthetic');await f.app.closeSession(id);await assert.rejects(()=>f.app.start(id,auth.id,true),{code:'AUTHORITY_REQUIRED'});await f.app.reopenSession(id,(await f.app.lifecycle(id)).epoch);
 armed=true;const pending=f.app.prepare(id,'Synthetic');const result=pending.then(()=>null,e=>e);await entered.promise;await f.app.closeSession(id);gate.resolve();assert.match(String(await result),/INTERRUPTED|SESSION_CLOSED/);assert.equal(f.keys(),0);await f.app.reopenSession(id,(await f.app.lifecycle(id)).epoch);const fresh=await f.app.prepare(id,'Synthetic');await f.app.start(id,fresh.id,true);await f.app.waitForIdle();assert.equal(f.keys(),1);
 }finally{gate.resolve();await f.app.close();await f.agent.waitForIdle();s.close();}
});
for(const boundary of ['prepare','accept','unused'] as const)test(`F2 current Desktop ${boundary} cannot restore authorization after close`,{timeout:10000},async()=>{
 const f=await desktopFixture('organize_question',undefined,async()=>assert.fail('closed application cannot send')),entered=deferred(),gate=deferred();let armed=false;
 f.hooks.afterRead=async()=>{if(armed&&boundary==='prepare'){armed=false;entered.resolve();await gate.promise;}};f.hooks.beforeRecord=async()=>{if(armed&&boundary==='accept'){armed=false;entered.resolve();await gate.promise;}};
 try{if(boundary==='prepare'){armed=true;const pending=f.prepare(),result=pending.then(()=>null,e=>e);await entered.promise;await f.app.close();gate.resolve();assert.equal((await result)?.code,'SERVICE_CLOSED');}else if(boundary==='accept'){armed=true;const pending=f.accept(),result=pending.then(()=>null,e=>e);await entered.promise;await f.app.close();gate.resolve();assert.equal((await result)?.code,'SERVICE_CLOSED');}else{const command=await f.accept();await f.app.close();await assert.rejects(()=>f.app.startAssistance(command),{code:'SERVICE_CLOSED'});}assert.equal(f.keys(),0);assert.equal((await f.app.readProjection(f.base.owner)).assistance_drafts.length,0);
 }finally{gate.resolve();await f.app.close();await f.agent.waitForIdle();}
});
