import {createPiProfessionalAgent} from '../../../adapters/agent-pi/professional-agent.ts';
import {offlineCredentials,offlineResponse} from '../../fixtures/xanthil-desktop/offline-professional-provider.ts';
// Retained-task and material-policy integration cases; immutable seed state is process-local.
import { DatabaseSync } from "node:sqlite";
import assert from "node:assert/strict";
import test, { after } from "node:test";
import { createHash, randomUUID } from "node:crypto";
import { cpSync, mkdtempSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";
import { tmpdir } from "node:os";
import { createMembershipTaskApplication } from "../../../packages/application/member-task.ts";
import { createLocalMembershipTaskStore } from "../../../adapters/storage-local/member-task.ts";
import { desktopTestIds } from "../../fixtures/xanthil-desktop/desktop-fixtures.ts";
import { createLocalModelAccess } from "../../../packages/application/provider-settings.ts";
import { createLocalDesktopDecisionCaseStore } from "../../../adapters/storage-local/xanthil-desktop-decision-case.ts";
import { writeFileSync, readFileSync } from "node:fs";
import { config as legacyConfig } from "../../fixtures/case-assistant/fixtures.ts";
import {blankTaskFixture,syntheticProfile,authorizedTaskFixture,until,reviewChoiceFixture} from '../../fixtures/xanthil-desktop/member-task-test-support.ts';
async function completedMembershipFixture(){
 const f=await reviewChoiceFixture(undefined,['M1','M2']),completed=await f.app.submitReview(f.id,f.command);
 return {root:f.root,id:f.id,desktop:f.desktop,store:f.store,shared:f.shared,app:f.app,completed};
}
async function retainedFixture(respond:(payload:string)=>Promise<unknown>,clock=()=>new Date(),prepared?:Awaited<ReturnType<typeof completedMembershipFixture>>){
 const f=prepared??await completedMembershipFixture(),completed=f.completed;const {createLocalCaseAssistantStore}=await import('../../../adapters/storage-local/case-assistant.ts'),{createCaseAssistantApplication}=await import('../../../packages/application/case-assistant.ts'),{config}=await import('../../fixtures/case-assistant/fixtures.ts');
 const assistantStore=createLocalCaseAssistantStore({projectRoot:f.root,assertCompleted:(...a:Parameters<ReturnType<typeof createPiProfessionalAgent>['assertCompleted']>)=>agent.assertCompleted(...a)}),agent=createPiProfessionalAgent({projectRoot:f.root,analysisModel:'mimo-v2.6-flash',credentials:offlineCredentials,authorizeWork:(id,phase)=>assistantStore.authorizesWork(id,phase),fetch:async(_url,init)=>{const dto=JSON.parse(String(init!.body)),payload=dto.messages.findLast((m:any)=>m.role==='user'&&typeof m.content==='string'&&m.content.startsWith('{')).content,output=await respond(payload);return offlineResponse(1,[],JSON.stringify(output));}}),app=createCaseAssistantApplication({store:assistantStore,agent,config,clock,modelAccess:f.shared,membership:{store:f.store,desktop:f.desktop,sourceStore:createLocalDesktopDecisionCaseStore({projectRoot:f.root})}});
 const parent=await app.link(completed.owner,'合成后续任务',randomUUID());const wait=async()=>{await app.waitForIdle();return app.read(parent.session.id);};return {...f,completed,retained:app,assistantStore,parent,wait};
}

function retainedFixtureFiles(root:string){
 return readdirSync(root,{recursive:true,withFileTypes:true}).filter(e=>e.isFile()).map(e=>{
  const path=join(e.parentPath,e.name),bytes=readFileSync(path);
  assert.equal(bytes.includes(Buffer.from(root)),false,'completed fixture must not bind its original absolute root');
  return {path:relative(root,path),bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')};
 }).sort((a,b)=>a.path.localeCompare(b.path));
}
async function createRetainedMatrixSeed(){
 const {root,id,completed,shared}=await completedMembershipFixture();
 assert.equal(completed.status,'closed');assert.equal(completed.case.revision!.state,'Completed');
 assert.ok(completed.grants.every(g=>g.revoked_at));assert.equal(shared.occupant?.(),null);
 return {root,id,completed,files:retainedFixtureFiles(root)};
}
let retainedMatrixSeed:ReturnType<typeof createRetainedMatrixSeed>|undefined;
// Only the repeated material-policy matrices share immutable completed bytes.
// Every consumer gets its own project, applications, stores and model lease;
// current retained authorization is still issued by the real Application.
async function retainedMatrixFixture(respond:(payload:string)=>Promise<unknown>){
 const seed=await (retainedMatrixSeed??=createRetainedMatrixSeed()),root=mkdtempSync(join(process.env.JUANERAI_TEST_EVIDENCE_DIR??tmpdir(),'member-retained-'));
 cpSync(seed.root,root,{recursive:true});assert.deepEqual(retainedFixtureFiles(root),seed.files);
 const base=await blankTaskFixture(root),store=createLocalMembershipTaskStore(root),shared=createLocalModelAccess(true);
 const app=createMembershipTaskApplication({desktop:base.desktop,project_id:desktopTestIds.project,store,profile:syntheticProfile(),sourceStore:createLocalDesktopDecisionCaseStore({projectRoot:root})});
 const completed=await app.read(seed.id);assert.deepEqual(completed,seed.completed,'copied completed source must retain the exact public projection');
 return retainedFixture(respond,()=>new Date(),{root,id:seed.id,desktop:base.desktop,store,shared,app,completed});
}
after(async()=>{if(retainedMatrixSeed){const seed=await retainedMatrixSeed;assert.deepEqual(retainedFixtureFiles(seed.root),seed.files,'all matrix consumers must preserve the closed seed bytes');}});

test('CI-PERF-005 completed fixture copies preserve independent state and source-tamper rejection',async()=>{
 const first=await retainedMatrixFixture(async()=>({kind:'advice',text:'unused'})),second=await retainedMatrixFixture(async()=>({kind:'advice',text:'unused'}));
 assert.notEqual(first.root,second.root);assert.notEqual(first.shared,second.shared);assert.notEqual(first.parent.session.id,second.parent.session.id);
 const secondBefore=await second.app.read(second.id),source=join(first.root,first.completed.owner.session_id,'010_draw',first.completed.case.snapshot!.snapshot_id,'orders.csv');
 writeFileSync(source,'synthetic clone-only source drift');
 await assert.rejects(()=>createLocalDesktopDecisionCaseStore({projectRoot:first.root}).readConfirmedSnapshot({...first.completed.owner,confirmation_id:first.completed.case.confirmation!.confirmation_id}),{code:'INTEGRITY_BLOCKED'});
 assert.deepEqual(await second.app.read(second.id),secondBefore,'one copy cannot change another source or resource ledger');
 const authorization=await second.retained.prepare(second.parent.session.id,'核对当前结果');assert.deepEqual(authorization.blockers,[]);
 await first.retained.close();await second.retained.close();
 const db=new DatabaseSync(join(second.root,'.xanthil/desktop/state.sqlite'));db.prepare('UPDATE membership_usage SET body_sha256=?').run('f'.repeat(64));db.close();
 await assert.rejects(()=>second.store.read(second.id),{code:'INTEGRITY_BLOCKED'});
 const seed=await retainedMatrixSeed!;assert.deepEqual(retainedFixtureFiles(seed.root),seed.files,'source and database mutations in both copies must leave seed bytes unchanged');
});








test('P1-D004-06 original completed task cannot regain admission via ordinary authorize',async()=>{
 const f=await reviewChoiceFixture();const p=await f.app.submitReview(f.id,f.command);await assert.rejects(()=>f.app.authorize(f.id,{fingerprint:p.prepared!.fingerprint,source_files:f.input.source_files,authority_confirmed:true,text_consent:false}));assert.equal((await f.app.read(f.id)).status,'closed');
});








test('P1-D004-11 current retained permission cannot retarget the approved recipient or mutate original local consumption',async()=>{
 const f=await retainedFixture(async()=>({kind:'advice',text:'unused'})),{createCaseAssistantApplication}=await import('../../../packages/application/case-assistant.ts');let calls=0;
 const agent=createPiProfessionalAgent({projectRoot:f.root,analysisModel:'mimo-v2.6-flash',authorizeWork:()=>false,credentials:{withCredential:async()=>{calls++;assert.fail('invalid recipient cannot read credentials');}},fetch:async()=>assert.fail('no provider')}),app=createCaseAssistantApplication({store:f.assistantStore,agent,clock:()=>new Date(),config:{...legacyConfig,model:'mimo-v2.6-flash'},modelAccess:f.shared,membership:{store:f.store,desktop:f.desktop,sourceStore:createLocalDesktopDecisionCaseStore({projectRoot:f.root})}});
 try{await assert.rejects(()=>app.prepare(f.parent.session.id,'检查'),{code:'CONFIGURATION_CHANGED'});assert.equal(calls,0);assert.deepEqual((await f.store.read(f.id)).usage,f.completed.usage);}finally{await app.close();await f.retained.close();await agent.waitForIdle();}
});
















