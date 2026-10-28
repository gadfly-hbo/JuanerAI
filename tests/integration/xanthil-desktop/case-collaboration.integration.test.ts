import {createPiProfessionalAgent} from '../../../adapters/agent-pi/professional-agent.ts';
import assert from 'node:assert/strict';
import test from 'node:test';
import {randomUUID} from 'node:crypto';
import {readFile,mkdir,cp} from 'node:fs/promises';
import {join} from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import {createCaseAssistantApplication} from '../../../packages/application/case-assistant.ts';
import {createLocalCaseAssistantStore} from '../../../adapters/storage-local/case-assistant.ts';

import {mkdtempSync} from 'node:fs';
async function withIsolatedProject<T>(fn:(root:string)=>Promise<T>){return fn(mkdtempSync(join(process.env.JUANERAI_NEWARCH_SHORT_ROOT!,'cr-')));}
import {completedCase} from '../../fixtures/case-assistant/completed-case.ts';
import {config,decision} from '../../fixtures/case-assistant/fixtures.ts';
import type {AssistantProjection} from '../../../packages/contracts/case-assistant.ts';
import type {ChildPreview} from '../../../packages/contracts/case-collaboration.ts';





test('F3 AC-FS-01/03 final real Store creation refuses every shared occupant without migration or receipt',async()=>withIsolatedProject(async root=>{
 const {createLocalModelAccess}=await import('../../../packages/application/provider-settings.ts');const access=createLocalModelAccess(true),baseline=await completedCase(root),store=createLocalCaseAssistantStore({projectRoot:root});let entered!:()=>void,release!:()=>void,calls=0;
 const gated={...store,async createChild(...args:Parameters<typeof store.createChild>){entered();await new Promise<void>(r=>release=r);return store.createChild(...args);}};
 const app=createCaseAssistantApplication({store:gated,modelAccess:access,config,clock:()=>new Date(),agent:createPiProfessionalAgent({projectRoot:root,analysisModel:'mimo-v2.6-flash',authorizeWork:()=>false,credentials:{withCredential:async()=>{calls++;assert.fail('child creation must never request credentials');}},fetch:async()=>assert.fail('no provider')})});
 try{const p=await app.link(baseline.owner,'竞争父',randomUUID());const path=join(root,'.xanthil','desktop','case-assistant.sqlite');
 for(const label of ['settings-test','organize_question','explain_evidence','draft_candidates','parent-pending','child-Running','child-Waiting']){
  const preview=await app.prepareChild(p.session.id,'subagent','共享占用检查',null,[],[],false),before=await readFile(path),atStore=new Promise<void>(r=>entered=r),command=randomUUID();const pending=app.createChild(p.session.id,preview.id,command,true);await atStore;const lease=await access.acquire(0,{session_id:p.session.id,label});release();
  try{await assert.rejects(pending,/MODEL_BUSY|BUSY/);assert.deepEqual(await readFile(path),before,'no migration/receipt/child bytes');assert.equal((await store.readParentCollaboration(p.session.id)).children.length,0);assert.equal(calls,0);}finally{lease.release();}
 }
 const preview=await app.prepareChild(p.session.id,'subagent','新操作',null,[],[],false);const atStore=new Promise<void>(r=>entered=r),pending=app.createChild(p.session.id,preview.id,randomUUID(),true);await atStore;release();assert.ok((await pending).session.id);assert.equal(calls,0);
 }finally{await app.close();if(process.env.JUANERAI_TEST_EVIDENCE_DIR)await cp(root,join(process.env.JUANERAI_TEST_EVIDENCE_DIR,'f3-race-project'),{recursive:true});}
}));


