import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {createProviderSettings} from '../../../packages/application/provider-settings.ts';
import {createCaseAssistantApplication} from '../../../packages/application/case-assistant.ts';
import {createXanthilDesktopDecisionCaseApplication} from '../../../packages/application/xanthil-desktop-decision-case.ts';
import {createLocalCaseAssistantStore} from '../../../adapters/storage-local/case-assistant.ts';
import {completedCase} from '../../fixtures/case-assistant/completed-case.ts';
import {config} from '../../fixtures/case-assistant/fixtures.ts';
import {createRealDesktopApplication,withIsolatedProject} from '../../fixtures/xanthil-desktop/desktop-contract-drivers.ts';
import {createSessionCommand,desktopTestIds} from '../../fixtures/xanthil-desktop/desktop-fixtures.ts';
type Projection=import('../../../packages/contracts/xanthil-desktop-ipc.ts').DesktopProjection;
type FixtureApplication=Record<string,(v:unknown)=>Promise<Projection>>;
const oldKey='synthetic-local-old',nextKey='synthetic-local-next';
async function settings(){let key:string|null=oldKey;const s=createProviderSettings({store:{async read(){return key?{status:'found',key}:{status:'absent'};},async save(v){key=v;},async delete(){key=null;}},async probe(){}});await s.initialize();return s;}
async function replace(s:Awaited<ReturnType<typeof settings>>){const p=await s.request({operation:'test',key:nextKey});assert.equal(p.ok,true);const saved=await s.request({operation:'save',key:nextKey,proof:p.proof!});assert.equal(saved.ok,true);}
test('PS-05/06 Case authorization binds config generation; Waiting/Stop hold and release credential',async()=>withIsolatedProject(async root=>{
 const base=await completedCase(root),s=await settings(),store=createLocalCaseAssistantStore({projectRoot:root});let calls=0;
 const app=createCaseAssistantApplication({store,config,clock:()=>new Date(),modelAccess:s.access,runtime:{async turn(){calls++;assert.equal(s.taskCredential(),nextKey);return {provider:config.provider,model:config.model,cost_microunits:0,output:{kind:'question',text:'Synthetic question'}};}}});
 try{
 const p=await app.link(base.owner,'Synthetic',randomUUID()),auth=await app.prepare(p.session.id,'Synthetic');await replace(s);
 await assert.rejects(app.start(p.session.id,auth.id,true),/CONFIGURATION_CHANGED/);assert.equal(calls,0);assert.equal((await app.read(p.session.id)).attempts.length,0);
 const fresh=await app.prepare(p.session.id,'Synthetic');await app.start(p.session.id,fresh.id,true);
 for(let i=0;i<100&&(await app.read(p.session.id)).attempts.at(-1)?.status==='Running';i++)await new Promise(r=>setTimeout(r,5));
 assert.equal((await app.read(p.session.id)).attempts.at(-1)?.status,'Waiting');assert.equal(s.status().busy,true);assert.equal((await s.request({operation:'delete',confirmed:true})).code,'MODEL_BUSY');await app.stop(p.session.id);assert.equal(s.status().busy,false);assert.equal(calls,1);
 }finally{await app.close();s.close();}
}));
test('PS-05/06 single-shot helper refuses old accepted disclosure after configuration changes',async()=>withIsolatedProject(async root=>{
 const base=await createRealDesktopApplication(root),s=await settings();
 const app=createXanthilDesktopDecisionCaseApplication({store:base.store,analysisExecution:base.analysisExecution,runEvidenceStore:base.runEvidenceStore,assistanceRuntime:base.runtime.runtime,clock:()=>new Date(),deadlineScheduler:base.deadlines.scheduler,modelAccess:s.access});
 await app.openProject({contract_version:'1.0',command_id:desktopTestIds.openProjectCommand,proposed_project_id:desktopTestIds.project,display_name:'Synthetic'});let p=await app.createSession(createSessionCommand());
 const owner={project_id:p.session!.project_id,session_id:p.session!.session_id,case_id:p.session!.case_id,revision_id:p.revision!.revision_id};
 const command=()=>({contract_version:'1.0' as const,...owner,command_id:randomUUID(),expected_row_version:p.revision!.row_version});
 const q=await app.prepareAssistanceDisclosure({contract_version:'1.0',...owner,expected_row_version:p.revision!.row_version,action_kind:'organize_question',requested_provider:'offline-test',requested_model:'deterministic'});
 p=await app.decideAssistanceDisclosure({...command(),preview_token:q.preview_token,payload_sha256:q.payload_sha256,decision:'accepted',free_text_confirmed:true});const disclosure=p.disclosures.at(-1)!;
 await replace(s);await assert.rejects(app.startAssistance({...command(),disclosure_id:disclosure.disclosure_id}),/CONFIGURATION_CHANGED/);assert.equal(base.runtime.calls.length,0);assert.equal((await app.readProjection(owner)).attempts.length,0);
}));

function deferred(){let resolve!:()=>void;const promise=new Promise<void>(r=>resolve=r);return {promise,resolve};}
for(const boundary of ['preflight','admission','committed-admission','runtime'] as const)for(const action of ['organize_question','explain_evidence','draft_candidates'] as const)test(`F2 ${action}: close during ${boundary} forbids late work and releases credential`,async()=>withIsolatedProject(async root=>{
 const {openConfirmedDesktopRevision}=await import('../../fixtures/xanthil-desktop/desktop-contract-drivers.ts');
 const base=await createRealDesktopApplication(root),s=await settings();let seed:Projection;const seedApp=base.application as FixtureApplication;
 if(action==='organize_question'){await seedApp.openProject({contract_version:'1.0',command_id:desktopTestIds.openProjectCommand,proposed_project_id:desktopTestIds.project,display_name:'Synthetic'});seed=await seedApp.createSession(createSessionCommand());}
 else{const setup=await openConfirmedDesktopRevision(root),seedApp=setup.application as FixtureApplication;seed=await seedApp.startAnalysis({contract_version:'1.0',command_id:randomUUID(),...setup.owner,expected_row_version:(setup.projection as unknown as Projection).revision!.row_version,confirmation_id:setup.confirmationId});for(let i=0;i<200&&seed.runs.some(r=>r.status==='Running');i++){await new Promise(r=>setTimeout(r,10));seed=await seedApp.readProjection(setup.owner);}assert.equal(seed.revision?.state,'Review');if(action==='draft_candidates')seed=await seedApp.acceptFinding({contract_version:'1.0',command_id:randomUUID(),...setup.owner,expected_row_version:seed.revision!.row_version,finding_id:seed.findings.at(-1)!.finding_id});}
 const entered=deferred(),release=deferred();let calls=0;
 const runtime={...base.runtime.runtime,async preflightSelection(input:Parameters<typeof base.runtime.runtime.preflightSelection>[0]){if(boundary==='preflight'){entered.resolve();await release.promise;}return base.runtime.runtime.preflightSelection(input);},async executeAssistance(input:Parameters<typeof base.runtime.runtime.executeAssistance>[0]){calls++;if(boundary==='runtime'){entered.resolve();await release.promise;}return base.runtime.runtime.executeAssistance(input);}};
 const typedStore=base.store as unknown as import('../../../packages/ports/xanthil-desktop-decision-case.ts').DesktopDecisionCaseStore;
 const delayedStore={...base.store,async admitAssistance(input:Parameters<typeof typedStore.admitAssistance>[0]){if(boundary==='admission'){entered.resolve();await release.promise;}const result=await typedStore.admitAssistance(input);if(boundary==='committed-admission'){entered.resolve();await release.promise;}return result;}};
 const app=createXanthilDesktopDecisionCaseApplication({store:delayedStore,analysisExecution:base.analysisExecution,runEvidenceStore:base.runEvidenceStore,assistanceRuntime:runtime,clock:()=>new Date(),deadlineScheduler:base.deadlines.scheduler,modelAccess:s.access});
 await app.openProject({contract_version:'1.0',command_id:randomUUID(),proposed_project_id:desktopTestIds.project,display_name:'Synthetic'});
 const owner={project_id:seed.session!.project_id,session_id:seed.session!.session_id,case_id:seed.session!.case_id,revision_id:seed.revision!.revision_id};let p=await app.readProjection(owner);const command=()=>({contract_version:'1.0' as const,...owner,command_id:randomUUID(),expected_row_version:p.revision!.row_version});
 const preview=await app.prepareAssistanceDisclosure({contract_version:'1.0',...owner,expected_row_version:p.revision!.row_version,action_kind:action,requested_provider:'offline-test',requested_model:'deterministic'});
 p=await app.decideAssistanceDisclosure({...command(),preview_token:preview.preview_token,payload_sha256:preview.payload_sha256,decision:'accepted',free_text_confirmed:true});
 const pending=app.startAssistance({...command(),disclosure_id:p.disclosures.at(-1)!.disclosure_id}).catch(e=>e);await entered.promise;
 await (app as typeof app & {closeModelWork?:()=>Promise<void>}).closeModelWork?.();await s.request({operation:'cancel'});const occupiedBeforeSettlement=s.status().busy;release.resolve();await pending;
 if(boundary==='runtime')assert.equal(occupiedBeforeSettlement,true,'logical close cannot release an issued professional model turn');
 for(let i=0;i<50&&(await app.readProjection(owner)).attempts.at(-1)?.status==='Running';i++)await new Promise(r=>setTimeout(r,5));
 assert.equal(calls,boundary==='runtime'?1:0,'closed admission must never enter Runtime; active work cannot repeat');const final=await app.readProjection(owner);assert.equal(final.attempts.length,boundary==='preflight'?0:1);if(final.attempts.length){assert.equal(final.attempts.at(-1)?.status,'Failed');assert.equal(final.attempts.at(-1)?.terminal_reason,'interrupted');}assert.equal(final.assistance_drafts.length,0);assert.equal(s.status().busy,false);assert.throws(()=>s.taskCredential(),/AUTHORITY_REQUIRED/);
}));
test('F2 Case closeSession invalidates unused and pending previews while fresh prepare remains usable',async()=>withIsolatedProject(async root=>{
 const base=await completedCase(root),store=createLocalCaseAssistantStore({projectRoot:root}),s=await settings();let calls=0;
 const entered=deferred(),release=deferred();let delay=false;
 const app=createCaseAssistantApplication({store:{...store,async readSession(id){if(delay){delay=false;entered.resolve();await release.promise;}return store.readSession(id);}},config,clock:()=>new Date(),modelAccess:s.access,runtime:{async turn(){calls++;return {provider:config.provider,model:config.model,cost_microunits:0,output:{kind:'question',text:'Synthetic'}};}}});
 try{const p=await app.link(base.owner,'Synthetic',randomUUID()),a=await app.prepare(p.session.id,'Synthetic');await app.closeSession(p.session.id);await assert.rejects(app.start(p.session.id,a.id,true),/AUTHORITY_REQUIRED/);
 delay=true;const pending=app.prepare(p.session.id,'Synthetic').catch(e=>e);await entered.promise;await app.closeSession(p.session.id);release.resolve();assert.match(String(await pending),/INTERRUPTED/);assert.equal(calls,0);
 const fresh=await app.prepare(p.session.id,'Synthetic');await app.start(p.session.id,fresh.id,true);for(let i=0;i<100&&calls===0;i++)await new Promise(r=>setTimeout(r,5));assert.equal(calls,1);
 }finally{release.resolve();await app.close();s.close();}
}));
for(const boundary of ['prepare','accept','unused'] as const)test(`F2 helper ${boundary} cannot restore authorization after close`,async()=>withIsolatedProject(async root=>{
 const base=await createRealDesktopApplication(root),seed=base.application as FixtureApplication;await seed.openProject({contract_version:'1.0',command_id:desktopTestIds.openProjectCommand,proposed_project_id:desktopTestIds.project,display_name:'Synthetic'});let p=await seed.createSession(createSessionCommand());const owner={project_id:p.session!.project_id,session_id:p.session!.session_id,case_id:p.session!.case_id,revision_id:p.revision!.revision_id};
 const original=base.store as unknown as import('../../../packages/ports/xanthil-desktop-decision-case.ts').DesktopDecisionCaseStore,entered=deferred(),release=deferred();let armed=false;
 const store={...original,async readProjection(input:Parameters<typeof original.readProjection>[0]){if(armed&&boundary==='prepare'){armed=false;entered.resolve();await release.promise;}return original.readProjection(input);},async recordDisclosure(input:Parameters<typeof original.recordDisclosure>[0]){if(armed&&boundary==='accept'){armed=false;entered.resolve();await release.promise;}return original.recordDisclosure(input);}};
 const app=createXanthilDesktopDecisionCaseApplication({store,analysisExecution:base.analysisExecution,runEvidenceStore:base.runEvidenceStore,assistanceRuntime:base.runtime.runtime,clock:()=>new Date(),deadlineScheduler:base.deadlines.scheduler});await app.openProject({contract_version:'1.0',command_id:randomUUID(),proposed_project_id:desktopTestIds.project,display_name:'Synthetic'});
 const prepare=()=>app.prepareAssistanceDisclosure({contract_version:'1.0',...owner,expected_row_version:p.revision!.row_version,action_kind:'organize_question',requested_provider:'offline-test',requested_model:'deterministic'});
 if(boundary==='prepare'){armed=true;const pending=prepare().catch(e=>e);await entered.promise;app.closeModelWork();release.resolve();assert.match(String(await pending),/INTERRUPTED/);}
 else{const q=await prepare();armed=true;const pending=app.decideAssistanceDisclosure({contract_version:'1.0',...owner,command_id:randomUUID(),expected_row_version:p.revision!.row_version,preview_token:q.preview_token,payload_sha256:q.payload_sha256,decision:'accepted',free_text_confirmed:true}).catch(e=>e);if(boundary==='accept'){await entered.promise;app.closeModelWork();release.resolve();assert.match(String(await pending),/INTERRUPTED/);}else{p=await pending;app.closeModelWork();await assert.rejects(app.startAssistance({contract_version:'1.0',...owner,command_id:randomUUID(),expected_row_version:p.revision!.row_version,disclosure_id:p.disclosures.at(-1)!.disclosure_id}),/INTERRUPTED/);}}
 assert.equal(base.runtime.calls.length,0);assert.equal((await app.readProjection(owner)).attempts.length,0);assert.equal((await app.readProjection(owner)).assistance_drafts.length,0);
}));
