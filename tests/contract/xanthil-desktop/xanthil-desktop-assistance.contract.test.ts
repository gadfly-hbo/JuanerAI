import assert from 'node:assert/strict';
import { createHash, randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { DatabaseSync } from 'node:sqlite';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import test from 'node:test';

import { createControlledDeadlineScheduler, createRealDesktopApplication, createOfflineAssistanceRuntimeDouble, desktopOwnerFromProjection, loadDesktopModule, openConfirmedDesktopRevision, requiredExport, requiredRecord, requiredString, revisionCommand, withIsolatedProject } from '../../fixtures/xanthil-desktop/desktop-contract-drivers.ts';
import { createSessionCommand, desktopTestIds } from '../../fixtures/xanthil-desktop/desktop-fixtures.ts';

type Method = (value: Record<string, unknown>) => Promise<Record<string, unknown>>;

test('U4 Pi late-open cleanup cannot escape cancellation as an unhandled rejection [AC-XDESK-006-08, AC-XDESK-008-03]',async t=>withIsolatedProject(async projectRoot=>{
  const draft=await openDraft(projectRoot),preview=await requiredExport<Method>(draft.application,'prepareAssistanceDisclosure')({contract_version:'1.0',...draft.owner,expected_row_version:'1',action_kind:'organize_question',requested_provider:'offline-test',requested_model:'deterministic'});
  for(const failure of ['abort','dispose'])await t.test(failure,async t=>{
    const script=`
      import assert from 'node:assert/strict';
      import {createPiDecisionAssistanceRuntime} from ${JSON.stringify(new URL('../../../adapters/agent-pi/local-analysis.ts',import.meta.url).href)};
      let release,entered;const started=new Promise(r=>entered=r),opening=new Promise(r=>release=r);let prompts=0,aborts=0,disposals=0;
      const runtime=createPiDecisionAssistanceRuntime({provider:'offline-test',model_id:'deterministic'},{sdkSessionFactory:()=>{entered();return opening;}});
      await runtime.preflightSelection({requested_provider:'offline-test',requested_model:'deterministic'});
      const controller=new AbortController(),pending=runtime.executeAssistance({action_kind:'organize_question',payload_bytes:new TextEncoder().encode(${JSON.stringify(preview.payload_text)}),payload_sha256:${JSON.stringify(preview.payload_sha256)},requested_provider:'offline-test',requested_model:'deterministic',cancellation_signal:controller.signal,deadline_seconds:300});
      const rejected=assert.rejects(pending,e=>e.code==='CANCELLED');await started;controller.abort();await rejected;
      release(Object.freeze({subscribe(){return()=>{};},setActiveTools(){return Object.freeze({active_tool_names:Object.freeze([])});},async prompt(){prompts++;throw Error('unexpected prompt');},getActualModel(){throw Error('unexpected identity');},async abort(){aborts++;if(${JSON.stringify(failure)}==='abort')throw Error('synthetic private late abort');return Object.freeze({aborted:true});},async waitForIdle(){return Object.freeze({idle:true});},dispose(){disposals++;if(${JSON.stringify(failure)}==='dispose')throw Error('synthetic private late dispose');return Object.freeze({disposed:true});}}));
      await new Promise(r=>setImmediate(r));await new Promise(r=>setImmediate(r));
      assert.equal(prompts,0);assert.equal(aborts,1);assert.equal(disposals,1);console.log(JSON.stringify({prompts,aborts,disposals,terminal:'CANCELLED'}));
    `;
    const child=spawn(process.execPath,['--experimental-strip-types','--input-type=module','-e',script],{stdio:['ignore','pipe','pipe'],env:process.env});let stdout='',stderr='';
    const outcome=await new Promise<{code:number|null;signal:NodeJS.Signals|null}>((resolve,reject)=>{const timer=setTimeout(()=>child.kill('SIGKILL'),10000);child.stdout.on('data',x=>stdout+=String(x));child.stderr.on('data',x=>stderr+=String(x));child.once('error',e=>{clearTimeout(timer);reject(e);});child.once('close',(code,signal)=>{clearTimeout(timer);resolve({code,signal});});});
    t.diagnostic(JSON.stringify({failure,argv:child.spawnargs,pid:child.pid,stdout,stderr,...outcome}));
    assert.equal(outcome.code,0,'late SDK cleanup is contained after the settled cancellation');assert.equal(outcome.signal,null);assert.equal(stderr,'');assert.deepEqual(JSON.parse(stdout),{prompts:0,aborts:1,disposals:1,terminal:'CANCELLED'});
  });
}));

test('U4 Pi cleanup failure is sanitized and releases the local active guard [AC-XDESK-006-05, AC-XDESK-006-08]',async()=>withIsolatedProject(async projectRoot=>{
  const draft=await openDraft(projectRoot),preview=await requiredExport<Method>(draft.application,'prepareAssistanceDisclosure')({contract_version:'1.0',...draft.owner,expected_row_version:'1',action_kind:'organize_question',requested_provider:'offline-test',requested_model:'deterministic'});
  const module=await loadDesktopModule('adapters/agent-pi/local-analysis.ts'),factory=requiredExport<(c:unknown,i:unknown)=>Record<string,unknown>>(module,'createPiDecisionAssistanceRuntime');let calls=0;
  const runtime=factory({provider:'offline-test',model_id:'deterministic'},{sdkSessionFactory:async()=>{calls++;return Object.freeze({subscribe(){return()=>{};},setActiveTools(){return Object.freeze({active_tool_names:Object.freeze([])});},async prompt(){throw Error('synthetic private SDK failure');},getActualModel(){assert.fail('no observed model on failure');},async abort(){return Object.freeze({aborted:true});},async waitForIdle(){return Object.freeze({idle:true});},dispose(){throw Error('synthetic cleanup private detail');}});}});
  await requiredExport<Method>(runtime,'preflightSelection')({requested_provider:'offline-test',requested_model:'deterministic'});
  const request={action_kind:'organize_question',payload_bytes:new TextEncoder().encode(String(preview.payload_text)),payload_sha256:preview.payload_sha256,requested_provider:'offline-test',requested_model:'deterministic',cancellation_signal:new AbortController().signal,deadline_seconds:300};
  for(let i=0;i<2;i++)await assert.rejects(()=>requiredExport<Method>(runtime,'executeAssistance')(request),(error:unknown)=>{assert.equal(requiredRecord(error,'sanitized error').code,'PROVIDER_UNAVAILABLE');assert.doesNotMatch(String(error),/synthetic.*private/);return true;});
  assert.equal(calls,2,'the explicit second caller is not an automatic retry and is not trapped by stale active state');
}));

test('U4 real Assistance owner crash is reconciled once with no model resend or Draft [AC-XDESK-008-05]',async t=>withIsolatedProject(async projectRoot=>{
  const fixtures=new URL('../../fixtures/xanthil-desktop/desktop-contract-drivers.ts',import.meta.url).href;
  const script=`import {createRealDesktopApplication,createOfflineAssistanceRuntimeDouble} from ${JSON.stringify(fixtures)};const base=createOfflineAssistanceRuntimeDouble();const {application}=await createRealDesktopApplication(${JSON.stringify(projectRoot)},{...base,runtime:{...base.runtime,async executeAssistance(){await new Promise(()=>{});}}});await application.openProject({contract_version:'1.0',command_id:${JSON.stringify(desktopTestIds.openProjectCommand)},proposed_project_id:${JSON.stringify(desktopTestIds.project)},display_name:'Synthetic Project'});let p=await application.createSession(${JSON.stringify(createSessionCommand())});const owner={project_id:p.session.project_id,session_id:p.session.session_id,case_id:p.session.case_id,revision_id:p.revision.revision_id};const q=await application.prepareAssistanceDisclosure({contract_version:'1.0',...owner,expected_row_version:p.revision.row_version,action_kind:'organize_question',requested_provider:'offline-test',requested_model:'deterministic'});p=await application.decideAssistanceDisclosure({contract_version:'1.0',command_id:crypto.randomUUID(),...owner,expected_row_version:p.revision.row_version,preview_token:q.preview_token,payload_sha256:q.payload_sha256,decision:'accepted',free_text_confirmed:true});p=await application.startAssistance({contract_version:'1.0',command_id:crypto.randomUUID(),...owner,expected_row_version:p.revision.row_version,disclosure_id:p.disclosures[0].disclosure_id});console.log('U4-OWNER-RUNNING '+JSON.stringify({owner,projection:p}));setInterval(()=>{},1000);`;
  const child=spawn(process.execPath,['--experimental-strip-types','--input-type=module','-e',script],{stdio:['ignore','pipe','pipe'],env:process.env});let stdout='',stderr='',reached=false;
  const completion=await new Promise<{code:number|null;signal:NodeJS.Signals|null}>((resolve,reject)=>{const timer=setTimeout(()=>child.kill('SIGKILL'),10000);child.stdout.on('data',chunk=>{stdout+=String(chunk);if(!reached&&stdout.includes('U4-OWNER-RUNNING ')&&stdout.endsWith('\n')){reached=true;child.kill('SIGKILL');}});child.stderr.on('data',chunk=>{stderr+=String(chunk);});child.once('error',error=>{clearTimeout(timer);reject(error);});child.once('close',(code,signal)=>{clearTimeout(timer);resolve({code,signal});});});
  t.diagnostic(JSON.stringify({pid:child.pid,argv:child.spawnargs,stdout,stderr,...completion}));assert.equal(reached,true);assert.equal(completion.signal,'SIGKILL');assert.throws(()=>process.kill(child.pid!,0),{code:'ESRCH'});
  const frozen=JSON.parse(stdout.slice(stdout.indexOf('U4-OWNER-RUNNING ')+'U4-OWNER-RUNNING '.length));assert.equal(frozen.projection.attempts[0].status,'Running');
  const fresh=await createRealDesktopApplication(projectRoot),open={contract_version:'1.0',command_id:desktopTestIds.openProjectCommand,proposed_project_id:desktopTestIds.project,display_name:'Synthetic Project'};
  await requiredExport<Method>(fresh.application,'openProject')(open);const after=await requiredExport<Method>(fresh.application,'readProjection')(frozen.owner),attempt=(after.attempts as Record<string,unknown>[])[0];
  assert.equal(attempt.status,'Failed');assert.equal(attempt.terminal_reason,'interrupted');assert.equal(attempt.actual_provider,null);assert.equal(attempt.actual_model,null);assert.deepEqual(after.assistance_drafts,[]);assert.equal(fresh.runtime.calls.length,0);
  for(const key of ['runs','findings','acceptances','closures','forms','reports'])assert.deepEqual(after[key],frozen.projection[key]);
  const dbPath=join(projectRoot,'.xanthil','desktop','state.sqlite'),before=await readFile(dbPath);await requiredExport<Method>(fresh.application,'openProject')(open);assert.deepEqual(await requiredExport<Method>(fresh.application,'readProjection')(frozen.owner),after);assert.deepEqual(await readFile(dbPath),before);
}));

test('U4 Pi failure cancellation and invalid output remain one sanitized call with cleanup and no observed identity [AC-XDESK-006-08, AC-XDESK-008-03]',async t=>{
  for(const outcome of ['provider-failure','cancel','invalid-output'])await t.test(outcome,()=>withIsolatedProject(async projectRoot=>{
    const draft=await openDraft(projectRoot),preview=await requiredExport<Method>(draft.application,'prepareAssistanceDisclosure')({contract_version:'1.0',...draft.owner,expected_row_version:'1',action_kind:'organize_question',requested_provider:'offline-test',requested_model:'deterministic'});
    const module=await loadDesktopModule('adapters/agent-pi/local-analysis.ts'),factory=requiredExport<(c:unknown,i:unknown)=>Record<string,unknown>>(module,'createPiDecisionAssistanceRuntime');let prompts=0,calls=0,aborts=0,disposed=0,observed=0,unsubscribed=0;let listener:(event:unknown)=>unknown=()=>{};let entered!:()=>void;const started=new Promise<void>(r=>{entered=r;});
    const runtime=factory({provider:'offline-test',model_id:'deterministic'},{sdkSessionFactory:async()=>{calls++;return Object.freeze({subscribe(next:(event:unknown)=>unknown){listener=next;return()=>{unsubscribed++;};},setActiveTools(names:string[]){assert.deepEqual(names,[]);return Object.freeze({active_tool_names:Object.freeze([])});},async prompt(){prompts++;entered();if(outcome==='provider-failure')throw Error('synthetic secret provider detail');if(outcome==='cancel')return new Promise(()=>{});listener({type:'message_end',message:{role:'assistant',content:[{type:'text',text:'{"draft_kind":"question_fields","draft_content":{"extra_authority":true}}'}],stopReason:'stop'}});listener({type:'agent_end',willRetry:false});listener({type:'agent_settled'});return Object.freeze({settled:true});},getActualModel(){observed++;return Object.freeze({provider:'offline-test',model_id:'deterministic'});},async abort(){aborts++;return Object.freeze({aborted:true});},async waitForIdle(){return Object.freeze({idle:true});},dispose(){disposed++;return Object.freeze({disposed:true});}});}});
    await requiredExport<Method>(runtime,'preflightSelection')({requested_provider:'offline-test',requested_model:'deterministic'});const controller=new AbortController();
    const pending=requiredExport<Method>(runtime,'executeAssistance')({action_kind:'organize_question',payload_bytes:new TextEncoder().encode(String(preview.payload_text)),payload_sha256:preview.payload_sha256,requested_provider:'offline-test',requested_model:'deterministic',cancellation_signal:controller.signal,deadline_seconds:300});
    const expected=outcome==='provider-failure'?'PROVIDER_UNAVAILABLE':outcome==='cancel'?'CANCELLED':'VALIDATION_FAILED';const rejected=assert.rejects(pending,(error:unknown)=>{assert.equal(requiredRecord(error,'sanitized error').code,expected);assert.doesNotMatch(String(error),/synthetic secret/);return true;});await started;if(outcome==='cancel')controller.abort();await rejected;assert.equal(calls,1);assert.equal(prompts,1);assert.equal(disposed,1);assert.equal(unsubscribed,1);assert.equal(observed,0);if(outcome!=='invalid-output')assert.equal(aborts,1);
  }));
});

// Structural capabilities reflect the current owner/state; Runtime readiness remains an
// admission check. A live Attempt disables conflicting writes, never grants authority.
test('U4 projection exposes Assistance affordances and disables conflicting writes during an Attempt [AC-XDESK-008-01, AC-XDESK-006-07]',async()=>withIsolatedProject(async projectRoot=>{
  const base=createOfflineAssistanceRuntimeDouble();let release!:()=>void;
  const gate=new Promise<void>(r=>{release=r;});const runtime={...base,runtime:{...base.runtime,async executeAssistance(input:Record<string,unknown>){await gate;return base.runtime.executeAssistance(input);}}};
  const draft=await openDraft(projectRoot,runtime);
  let projection=await requiredExport<Method>(draft.application,'readProjection')(draft.owner);
  assert.equal(requiredRecord(projection.capabilities,'capabilities').can_prepare_assistance,true);
  assert.equal(requiredRecord(projection.capabilities,'capabilities').can_start_assistance,false);
  const disclosure=await acceptedDisclosure(draft);
  projection=await requiredExport<Method>(draft.application,'readProjection')(draft.owner);
  assert.equal(requiredRecord(projection.capabilities,'capabilities').can_start_assistance,true);
  try{
    projection=await requiredExport<Method>(draft.application,'startAssistance')({...revisionCommand(draft.owner,randomUUID(),disclosure.rowVersion),disclosure_id:disclosure.disclosure.disclosure_id});
    const caps=requiredRecord(projection.capabilities,'capabilities');assert.equal(caps.can_cancel_assistance,true);
    for(const key of ['can_prepare_assistance','can_start_assistance','can_dispose_assistance_draft','can_save_case_fields','can_create_draft_revision','can_select_import','can_confirm_revision','can_start_analysis'])assert.equal(caps[key],false,key);
    release();projection=await settledAttempt(draft);assert.equal(requiredRecord(projection.capabilities,'capabilities').can_dispose_assistance_draft,true);assert.equal(requiredRecord(projection.capabilities,'capabilities').can_cancel_assistance,false);
  }finally{release();}
}));

test('U4 normal Profile uses explicit null Assistance configuration and preserves manual operation without a model [AC-XDESK-006-08, AC-XDESK-009-03]',async()=>withIsolatedProject(async projectRoot=>{
  const module=await loadDesktopModule('profiles/personal/xanthil-desktop.ts'),factory=requiredExport<(config:unknown)=>Record<string,unknown>>(module,'createPersonalXanthilDesktopProfile');
  const profile=factory({toolchainDeployment:{descriptor_path:join(projectRoot,'absent-toolchain.json')},assistanceConfig:null,clock:()=>new Date('2026-01-02T03:04:05.006Z'),deadlineScheduler:{schedule(){return{cancel(){}};}}});
  const opened=await requiredExport<Method>(profile,'openProject')({contract_version:'1.0',command_id:desktopTestIds.openProjectCommand,display_name:'Synthetic Project',projectDirectoryCapability:{projectRoot,display_name:'Synthetic Project'}}),app=requiredRecord(opened.application,'Application'),project=requiredRecord(requiredRecord(opened.value,'value').project,'Project');
  const projection=await requiredExport<Method>(app,'createSession')({...createSessionCommand(),project_id:project.project_id}),owner=desktopOwnerFromProjection(projection),version=String(requiredRecord(projection.revision,'revision').row_version);
  const preview=await requiredExport<Method>(app,'prepareAssistanceDisclosure')({contract_version:'1.0',...owner,expected_row_version:version,action_kind:'organize_question',requested_provider:'offline-test',requested_model:'deterministic'});
  const accepted=await requiredExport<Method>(app,'decideAssistanceDisclosure')({...revisionCommand(owner,desktopTestIds.revisionCommand,version),preview_token:preview.preview_token,payload_sha256:preview.payload_sha256,decision:'accepted',free_text_confirmed:true});
  await assert.rejects(()=>requiredExport<Method>(app,'startAssistance')({...revisionCommand(owner,desktopTestIds.retryCommand,String(requiredRecord(accepted.revision,'revision').row_version)),disclosure_id:(accepted.disclosures as Record<string,unknown>[])[0].disclosure_id}),/PROVIDER_UNAVAILABLE/);
  const after=await requiredExport<Method>(app,'readProjection')(owner);assert.deepEqual(after.attempts,[]);assert.equal(requiredRecord(after.revision,'revision').state,'Draft');
}));

test('U4 Main routes closed Assistance requests through the admitted normal Profile and denies invalid senders [AC-XDESK-009-03, AC-XDESK-006-04]',async()=>withIsolatedProject(async projectRoot=>{
  const profileModule=await loadDesktopModule('profiles/personal/xanthil-desktop.ts'),main=await loadDesktopModule('apps/desktop/main.ts');
  const profile=requiredExport<(config:unknown)=>unknown>(profileModule,'createPersonalXanthilDesktopProfile')({toolchainDeployment:{descriptor_path:join(projectRoot,'absent-toolchain.json')},assistanceConfig:null,clock:()=>new Date('2026-01-02T03:04:05.006Z'),deadlineScheduler:{schedule(){return{cancel(){}};}}});
  const sender={},handlers=requiredExport<(input:unknown)=>Record<string,(sender:unknown,input:unknown)=>Promise<Record<string,unknown>>>>(main,'createXanthilDesktopIpcHandlers')({productionProfile:profile,nativeDialogs:{selectProject:async()=>({projectRoot,display_name:'Synthetic Project'}),selectImportFiles:async()=>null,selectExportFile:async()=>null},sourceReader:{readSelectedFiles:async()=>{assert.fail('no CSV reads');}},exportWriter:{writeAndReadBack:async()=>{assert.fail('no export');}},senderPolicy:(s:unknown)=>s===sender});
  const opened=await handlers.selectProject(sender,{contract_version:'1.0',command_id:desktopTestIds.openProjectCommand});assert.equal(opened.ok,true);
  const created=await handlers.createSession(sender,{...createSessionCommand(),project_id:requiredRecord(requiredRecord(opened.value,'opened').project,'project').project_id});assert.equal(created.ok,true);
  const projection=requiredRecord(created.value,'projection'),owner=desktopOwnerFromProjection(projection),query={contract_version:'1.0',...owner,expected_row_version:'1',action_kind:'organize_question',requested_provider:'offline-test',requested_model:'deterministic'};
  assert.equal(requiredRecord((await handlers.prepareAssistanceDisclosure({},query)).error,'error').code,'FORBIDDEN');
  const preview=await handlers.prepareAssistanceDisclosure(sender,query);assert.equal(preview.ok,true);assert.equal(requiredRecord(preview.value,'preview').action_kind,'organize_question');
  const before=await handlers.readProjection(sender,{contract_version:'1.0',...owner});assert.deepEqual(before,created,'preview is effect-free');
  const value=requiredRecord(preview.value,'preview'),refused=await handlers.decideAssistanceDisclosure(sender,{...revisionCommand(owner),preview_token:value.preview_token,payload_sha256:value.payload_sha256,decision:'refused',free_text_confirmed:false});assert.equal(refused.ok,true);assert.deepEqual(requiredRecord(refused.value,'value').attempts,[]);
  assert.equal(requiredRecord((await handlers.startAssistance(sender,{...revisionCommand(owner),path:projectRoot})).error,'error').code,'INVALID_REQUEST');
}));

test('U4 Pi factory exposes only the business Runtime and forwards exact disclosed bytes with zero tools and one observed response [AC-XDESK-006-04, AC-XDESK-006-05, AC-XDESK-006-06]',async()=>withIsolatedProject(async projectRoot=>{
  const draft=await openDraft(projectRoot),preview=await requiredExport<Method>(draft.application,'prepareAssistanceDisclosure')({contract_version:'1.0',...draft.owner,expected_row_version:draft.rowVersion,action_kind:'organize_question',requested_provider:'offline-test',requested_model:'deterministic'});
  const module=await loadDesktopModule('adapters/agent-pi/local-analysis.ts'),factory=requiredExport<(config:unknown,injection?:unknown)=>Record<string,unknown>>(module,'createPiDecisionAssistanceRuntime');
  let calls=0,prompts=0,observed=0,disposed=0;let listener:(event:unknown)=>unknown=()=>{};
  const content={question_text:'Reviewed question',hypothesis_display_title:'Reviewed title',business_context:'',alternative_explanations:[]};
  const runtime=factory({provider:'offline-test',model_id:'deterministic'},{sdkSessionFactory:async(request:Record<string,unknown>)=>{
    calls++;assert.deepEqual(request.custom_tools,[]);assert.equal(request.retry_limit,0);assert.equal(request.tool_timeout_seconds,30);
    return Object.freeze({subscribe(next:(event:unknown)=>unknown){listener=next;return()=>{};},setActiveTools(names:string[]){assert.deepEqual(names,[]);return Object.freeze({active_tool_names:Object.freeze([])});},async prompt(text:string,options:unknown){prompts++;assert.equal(text,preview.payload_text);assert.deepEqual(options,{expandPromptTemplates:false});assert.equal(observed,0);listener({type:'message_end',message:{role:'assistant',content:[{type:'text',text:JSON.stringify({draft_kind:'question_fields',draft_content:content})}],stopReason:'stop'}});listener({type:'agent_end',willRetry:false});listener({type:'agent_settled'});return Object.freeze({settled:true});},getActualModel(){observed++;return Object.freeze({provider:'offline-test',model_id:'deterministic'});},async abort(){return Object.freeze({aborted:true});},async waitForIdle(){return Object.freeze({idle:true});},dispose(){disposed++;return Object.freeze({disposed:true});}});
  }});
  assert.deepEqual(Object.keys(runtime).sort(),['cancel','executeAssistance','preflightSelection']);
  const selection=await requiredExport<Method>(runtime,'preflightSelection')({requested_provider:'offline-test',requested_model:'deterministic'});assert.equal(selection.ready,true);assert.equal(calls,0);assert.equal(observed,0);
  const bytes=new TextEncoder().encode(String(preview.payload_text)),request={action_kind:'organize_question',payload_bytes:bytes,payload_sha256:preview.payload_sha256,requested_provider:'offline-test',requested_model:'deterministic',cancellation_signal:new AbortController().signal,deadline_seconds:300};
  const result=await requiredExport<Method>(runtime,'executeAssistance')(request);
  assert.deepEqual(result,{actual_provider:'offline-test',actual_model:'deterministic',draft_kind:'question_fields',draft_content:content});assert.equal(calls,1);assert.equal(prompts,1);assert.equal(observed,1);assert.equal(disposed,1);
  await assert.rejects(()=>requiredExport<Method>(runtime,'executeAssistance')({...request,payload_sha256:'0'.repeat(64)}),/VALIDATION_FAILED/);assert.equal(calls,1);
}));

test('U4 Pi rejects an expanded outbound payload before SDK admission [AC-XDESK-006-05]',async()=>withIsolatedProject(async projectRoot=>{
  const draft=await openDraft(projectRoot),preview=await requiredExport<Method>(draft.application,'prepareAssistanceDisclosure')({contract_version:'1.0',...draft.owner,expected_row_version:'1',action_kind:'organize_question',requested_provider:'offline-test',requested_model:'deterministic'});
  const module=await loadDesktopModule('adapters/agent-pi/local-analysis.ts'),factory=requiredExport<(c:unknown,i:unknown)=>Record<string,unknown>>(module,'createPiDecisionAssistanceRuntime');let calls=0;
  const runtime=factory({provider:'offline-test',model_id:'deterministic'},{sdkSessionFactory:async()=>{calls++;throw new Error('unexpected SDK admission');}});
  await requiredExport<Method>(runtime,'preflightSelection')({requested_provider:'offline-test',requested_model:'deterministic'});
  const payload={...JSON.parse(String(preview.payload_text)),raw_rows:[{member_id:'SYNTHETIC-MEMBER-SECRET'}]},bytes=new TextEncoder().encode(JSON.stringify(Object.fromEntries(Object.keys(payload).sort().map(k=>[k,payload[k]]))));
  await assert.rejects(()=>requiredExport<Method>(runtime,'executeAssistance')({action_kind:'organize_question',payload_bytes:bytes,payload_sha256:createHash('sha256').update(bytes).digest('hex'),requested_provider:'offline-test',requested_model:'deterministic',cancellation_signal:new AbortController().signal,deadline_seconds:300}),/VALIDATION_FAILED/);
  assert.equal(calls,0);
}));

test('U4 mismatched Runtime Draft shape settles validation failure without Draft or authority [AC-XDESK-006-07, AC-XDESK-006-08]',async()=>withIsolatedProject(async projectRoot=>{
  const base=createOfflineAssistanceRuntimeDouble(),runtime={...base,runtime:{...base.runtime,async executeAssistance(){return{actual_provider:'offline-test',actual_model:'deterministic',draft_kind:'question_fields',draft_content:{evidence_explanation_text:'wrong target shape'}};}}};
  const draft=await openDraft(projectRoot,runtime),disclosure=await acceptedDisclosure(draft);
  await requiredExport<Method>(draft.application,'startAssistance')({...revisionCommand(draft.owner,desktopTestIds.retryCommand,disclosure.rowVersion),disclosure_id:disclosure.disclosure.disclosure_id});
  const after=await settledAttempt(draft);assert.deepEqual(after.assistance_drafts,[]);assert.equal((after.attempts as Record<string,unknown>[])[0].status,'Failed');assert.equal((after.attempts as Record<string,unknown>[])[0].terminal_reason,'validation_failed');assert.equal(requiredRecord(after.revision,'revision').state,'Draft');
}));

async function settledAttempt(draft: Awaited<ReturnType<typeof openDraft>>) {
  let projection = await requiredExport<Method>(draft.application, 'readProjection')(draft.owner);
  for(let i=0;i<100&&(projection.attempts as Record<string,unknown>[]).some(a=>a.status==='Running');i++){
    await new Promise(resolve=>setTimeout(resolve,5));
    projection=await requiredExport<Method>(draft.application,'readProjection')(draft.owner);
  }
  assert.equal((projection.attempts as Record<string,unknown>[]).some(a=>a.status==='Running'),false,'a synthetic completed Runtime must actually settle');return projection;
}

async function openDraft(projectRoot: string, runtime = createOfflineAssistanceRuntimeDouble()) {
  const composed = await createRealDesktopApplication(projectRoot, runtime);
  await requiredExport<Method>(composed.application, 'openProject')({ contract_version: '1.0', command_id: desktopTestIds.openProjectCommand, proposed_project_id: desktopTestIds.project, display_name: 'Synthetic Project' });
  const projection = await requiredExport<Method>(composed.application, 'createSession')(createSessionCommand());
  const revision = requiredRecord(projection.revision, 'draft revision');
  return Object.freeze({ ...composed, owner: desktopOwnerFromProjection(projection), rowVersion: requiredString(revision, 'row_version') });
}

async function acceptedDisclosure(draft: Awaited<ReturnType<typeof openDraft>>) {
  const preview = await requiredExport<Method>(draft.application, 'prepareAssistanceDisclosure')({ contract_version: '1.0', ...draft.owner, expected_row_version: draft.rowVersion, action_kind: 'organize_question', requested_provider: 'offline-test', requested_model: 'deterministic' });
  const decided = await requiredExport<Method>(draft.application, 'decideAssistanceDisclosure')({
    ...revisionCommand(draft.owner, randomUUID(), draft.rowVersion), preview_token: requiredString(preview, 'preview_token'),
    payload_sha256: requiredString(preview, 'payload_sha256'), decision: 'accepted', free_text_confirmed: true,
  });
  assert.equal(Array.isArray(decided.disclosures), true, 'disclosures are a structured projection array');
  const disclosure = (decided.disclosures as Array<Record<string, unknown>>).at(-1);
  assert.ok(disclosure, 'the real Application must retain an accepted disclosure before any Runtime request');
  return Object.freeze({ preview, disclosure, rowVersion: requiredString(requiredRecord(decided.revision, 'accepted disclosure revision'), 'row_version') });
}

async function openReview(projectRoot:string){
  const setup=await openConfirmedDesktopRevision(projectRoot);
  let projection=await requiredExport<Method>(setup.application,'startAnalysis')({...revisionCommand(setup.owner,'89000000-0000-4000-8000-000000000001',requiredString(requiredRecord(setup.projection.revision,'revision'),'row_version')),confirmation_id:setup.confirmationId});
  for(let i=0;i<300&&(projection.runs as Record<string,unknown>[]).some(r=>r.status==='Running');i++){await new Promise(resolve=>setTimeout(resolve,20));projection=await requiredExport<Method>(setup.application,'readProjection')(setup.owner);}
  assert.equal(requiredRecord(projection.revision,'revision').state,'Review','real deterministic analysis must be healthy before Assistance RED');
  assert.equal((projection.runs as Record<string,unknown>[])[0].status,'Succeeded');
  return {...setup,projection};
}

async function candidateDraft(setup: Awaited<ReturnType<typeof openReview>>, projection: Record<string,unknown>) {
  const command=()=>revisionCommand(setup.owner,randomUUID(),String(requiredRecord(projection.revision,'revision').row_version));
  if(!(projection.acceptances as unknown[]).length) projection=await requiredExport<Method>(setup.application,'acceptFinding')({...command(),finding_id:(projection.findings as Record<string,unknown>[])[0].finding_id});
  const preview=await requiredExport<Method>(setup.application,'prepareAssistanceDisclosure')({contract_version:'1.0',...setup.owner,expected_row_version:requiredRecord(projection.revision,'revision').row_version,action_kind:'draft_candidates',requested_provider:'offline-test',requested_model:'deterministic'});
  projection=await requiredExport<Method>(setup.application,'decideAssistanceDisclosure')({...command(),preview_token:preview.preview_token,payload_sha256:preview.payload_sha256,decision:'accepted',free_text_confirmed:true});
  await requiredExport<Method>(setup.application,'startAssistance')({...command(),disclosure_id:(projection.disclosures as Record<string,unknown>[]).at(-1)!.disclosure_id});
  projection=await settledAttempt({...setup,rowVersion:'1'});
  return {projection,draft:(projection.assistance_drafts as Record<string,unknown>[]).at(-1)!};
}

test('U4 same-clock candidate adoptions retain one Draft then exact manual save and disposed-form refusal across reopen [AC-XDESK-006-07]',async()=>withIsolatedProject(async projectRoot=>{
  const setup=await openReview(projectRoot);let projection=setup.projection,firstId:unknown;
  const command=()=>revisionCommand(setup.owner,randomUUID(),String(requiredRecord(projection.revision,'revision').row_version));
  for(let i=0;i<2;i++){
    const pending=await candidateDraft(setup,projection);projection=pending.projection;
    const before=structuredClone(projection),generated=requiredRecord(pending.draft.generated_content,'generated');
    const candidates=(generated.candidates as Record<string,unknown>[]).map((c,n)=>({...c,title:`Explicit edit ${i}/${n}`}));
    projection=await requiredExport<Method>(setup.application,'disposeAssistanceDraft')({...command(),draft_id:pending.draft.draft_id,disposition:'adopted',edited_content:{candidates}});
    const forms=projection.forms as Record<string,unknown>[];assert.equal(forms.length,1);if(i===0)firstId=forms[0].form_id;assert.equal(forms[0].form_id,firstId);assert.deepEqual(forms[0].candidates,candidates);assert.equal(forms[0].route,null);assert.equal(forms[0].preferred_candidate_id,null);
    for(const key of ['runs','findings','acceptances','closures','reports'])assert.deepEqual(projection[key],before[key]);
    const reopened=await createRealDesktopApplication(projectRoot);await requiredExport<Method>(reopened.application,'openProject')({contract_version:'1.0',command_id:desktopTestIds.openProjectCommand,proposed_project_id:desktopTestIds.project,display_name:'Synthetic Project'});assert.deepEqual(await requiredExport<Method>(reopened.application,'readProjection')(setup.owner),projection);
  }
  const current=(projection.forms as Record<string,unknown>[])[0];
  projection=await requiredExport<Method>(setup.application,'saveForm')({...command(),form:{kind:'decision_closure',candidates:current.candidates,route:'candidate_comparison',insufficient_reason:null,preferred_candidate_id:null,preferred_reason:null,disposition:'saved',defer_until:null}});
  const saved=structuredClone(projection.forms),pending=await candidateDraft(setup,projection);projection=pending.projection;
  await assert.rejects(()=>requiredExport<Method>(setup.application,'disposeAssistanceDraft')({...command(),draft_id:pending.draft.draft_id,disposition:'adopted',edited_content:null}),/FORBIDDEN/);
  assert.deepEqual((await requiredExport<Method>(setup.application,'readProjection')(setup.owner)).forms,saved);
  const reopened=await createRealDesktopApplication(projectRoot);await requiredExport<Method>(reopened.application,'openProject')({contract_version:'1.0',command_id:desktopTestIds.openProjectCommand,proposed_project_id:desktopTestIds.project,display_name:'Synthetic Project'});assert.deepEqual(await requiredExport<Method>(reopened.application,'readProjection')(setup.owner),projection);
}));

test('U4 candidate-only adoption cannot authorize forged route preference or candidate content on reopen [AC-XDESK-006-07, AC-XDESK-011-06]',async t=>{
  for(const mutation of ['route','preference','candidates'])await t.test(mutation,async()=>withIsolatedProject(async projectRoot=>{
    const setup=await openReview(projectRoot),pending=await candidateDraft(setup,setup.projection);
    const projection=await requiredExport<Method>(setup.application,'disposeAssistanceDraft')({...revisionCommand(setup.owner,randomUUID(),String(requiredRecord(pending.projection.revision,'revision').row_version)),draft_id:pending.draft.draft_id,disposition:'adopted',edited_content:null});
    const form=(projection.forms as Record<string,unknown>[])[0],dbPath=join(projectRoot,'.xanthil','desktop','state.sqlite'),db=new DatabaseSync(dbPath,{readOnly:false});
    try{
      if(mutation==='route')db.prepare("UPDATE decision_forms SET route='insufficient_evidence',insufficient_reason='forged authority' WHERE form_id=?").run(String(form.form_id));
      if(mutation==='preference')db.prepare('UPDATE decision_forms SET preferred_candidate_id=?,preferred_reason=? WHERE form_id=?').run(String((form.candidates as Record<string,unknown>[])[0].candidate_id),'forged preference',String(form.form_id));
      if(mutation==='candidates')db.prepare('UPDATE decision_forms SET candidates_json=? WHERE form_id=?').run(JSON.stringify([{...(form.candidates as Record<string,unknown>[])[0],title:'forged candidate'}]),String(form.form_id));
    }finally{db.close();}
    const before=await readFile(dbPath),reopened=await createRealDesktopApplication(projectRoot);
    await assert.rejects(()=>requiredExport<Method>(reopened.application,'openProject')({contract_version:'1.0',command_id:desktopTestIds.openProjectCommand,proposed_project_id:desktopTestIds.project,display_name:'Synthetic Project'}),/INTEGRITY_BLOCKED/);
    assert.deepEqual(await readFile(dbPath),before,'rejected state is not repaired or rewritten');
  }));
});

test('U4 Review and accepted Finding payloads carry only exact pseudonymous aggregate evidence and confirmed context [AC-XDESK-006-02, AC-XDESK-006-03, AC-XDESK-006-05]',async()=>withIsolatedProject(async projectRoot=>{
  const setup=await openReview(projectRoot);let projection=setup.projection;
  const prepare=requiredExport<Method>(setup.application,'prepareAssistanceDisclosure');
  const request=(action_kind:string)=>({contract_version:'1.0',...setup.owner,expected_row_version:requiredRecord(projection.revision,'revision').row_version,action_kind,requested_provider:'offline-test',requested_model:'deterministic'});
  const preview=await prepare(request('explain_evidence')),payload=JSON.parse(requiredString(preview,'payload_text')),finding=(projection.findings as Record<string,unknown>[])[0];
  assert.deepEqual(Object.keys(payload).sort(),['action_kind','aggregate','confirmed_context','method','schema_version']);
  assert.deepEqual(payload.aggregate,{artifact_id:finding.aggregate_id,metrics:JSON.parse(String(finding.metrics))});
  assert.deepEqual(preview.aggregate_refs,[finding.aggregate_id]);assert.equal(preview.free_text_present,true);
  assert.deepEqual(payload.method,{id:'membership_repurchase_comparison',version:'1.0'});
  assert.doesNotMatch(String(preview.payload_text),/North|South|0001|0002|members\.csv|orders\.csv|\/Users\/|group_pseudonym_map|report\.html/);
  await assert.rejects(()=>prepare(request('draft_candidates')),/AUTHORITY_REQUIRED/);
  projection=await requiredExport<Method>(setup.application,'acceptFinding')({...revisionCommand(setup.owner,'89000000-0000-4000-8000-000000000002',String(requiredRecord(projection.revision,'revision').row_version)),finding_id:finding.finding_id});
  const candidates=await prepare(request('draft_candidates')),candidatePayload=JSON.parse(String(candidates.payload_text));
  assert.deepEqual(Object.keys(candidatePayload).sort(),['accepted_finding','action_kind','aggregate','confirmed_context','method','schema_version']);
  assert.equal(candidatePayload.accepted_finding.finding_id,finding.finding_id);assert.deepEqual(candidatePayload.accepted_finding.limitations,finding.limitations);assert.deepEqual(candidates.aggregate_refs,[finding.aggregate_id]);
  assert.equal(setup.runtime.calls.length,0,'disclosure preview does not invoke the optional Runtime');
}));

test('U4 aggregate Assistance adopts explanation and candidate drafts without selecting preference or changing authority [AC-XDESK-006-02, AC-XDESK-006-03, AC-XDESK-006-07]',async()=>withIsolatedProject(async projectRoot=>{
  const setup=await openReview(projectRoot);let projection=setup.projection,ordinal=10;
  const command=()=>revisionCommand(setup.owner,`89000000-0000-4000-8000-${String(ordinal++).padStart(12,'0')}`,String(requiredRecord(projection.revision,'revision').row_version));
  for(const action_kind of ['explain_evidence','draft_candidates']){
    if(action_kind==='draft_candidates')projection=await requiredExport<Method>(setup.application,'acceptFinding')({...command(),finding_id:(projection.findings as Record<string,unknown>[])[0].finding_id});
    const before=structuredClone(projection),preview=await requiredExport<Method>(setup.application,'prepareAssistanceDisclosure')({contract_version:'1.0',...setup.owner,expected_row_version:requiredRecord(projection.revision,'revision').row_version,action_kind,requested_provider:'offline-test',requested_model:'deterministic'});
    projection=await requiredExport<Method>(setup.application,'decideAssistanceDisclosure')({...command(),preview_token:preview.preview_token,payload_sha256:preview.payload_sha256,decision:'accepted',free_text_confirmed:true});
    const disclosure=(projection.disclosures as Record<string,unknown>[]).at(-1)!;
    projection=await requiredExport<Method>(setup.application,'startAssistance')({...command(),disclosure_id:disclosure.disclosure_id});
    projection=await settledAttempt({...setup,rowVersion:'1'});
    const draft=(projection.assistance_drafts as Record<string,unknown>[]).at(-1)!;assert.equal(draft.disposition,'pending');
    const generated=requiredRecord(draft.generated_content,'generated');
    const edited=action_kind==='explain_evidence'?{evidence_explanation_text:'  Explicitly reviewed explanation  '}:generated;
    projection=await requiredExport<Method>(setup.application,'disposeAssistanceDraft')({...command(),draft_id:draft.draft_id,disposition:'adopted',edited_content:edited});
    if(action_kind==='explain_evidence')assert.equal(requiredRecord(projection.revision,'revision').evidence_explanation_text,'  Explicitly reviewed explanation  ');
    else{
      const form=(projection.forms as Record<string,unknown>[]).at(-1)!;assert.equal(form.disposition,'draft');assert.equal(form.preferred_candidate_id,null);assert.equal(form.preferred_reason,null);
      assert.deepEqual(form.candidates,generated.candidates);const candidates=form.candidates as Record<string,unknown>[];assert.equal(candidates.length,2);assert.notEqual(candidates[0].candidate_id,candidates[1].candidate_id);for(const c of candidates)assert.match(String(c.candidate_id),/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    }
    for(const key of ['runs','findings','acceptances','closures','reports'])assert.deepEqual(projection[key],before[key]);assert.equal(requiredRecord(projection.revision,'revision').state,'Review');
  }
  const reopened=await createRealDesktopApplication(projectRoot);await requiredExport<Method>(reopened.application,'openProject')({contract_version:'1.0',command_id:desktopTestIds.openProjectCommand,proposed_project_id:desktopTestIds.project,display_name:'Synthetic Project'});
  assert.deepEqual(await requiredExport<Method>(reopened.application,'readProjection')(setup.owner),projection);assert.equal(reopened.runtime.calls.length,0);
}));

test('U4 disclosure refusal persists only exact metadata and leaves all authority and external calls unchanged [AC-XDESK-006-01, AC-XDESK-006-04, AC-XDESK-006-05]', async () => withIsolatedProject(async projectRoot => {
  const draft = await openDraft(projectRoot);
  const before = await requiredExport<Method>(draft.application, 'readProjection')(draft.owner);
  const preview = await requiredExport<Method>(draft.application, 'prepareAssistanceDisclosure')({ contract_version:'1.0', ...draft.owner, expected_row_version:draft.rowVersion, action_kind:'organize_question', requested_provider:'offline-test', requested_model:'deterministic' });
  assert.equal(createHash('sha256').update(requiredString(preview,'payload_text')).digest('hex'), preview.payload_sha256);
  const payload = JSON.parse(requiredString(preview,'payload_text'));
  assert.deepEqual(Object.keys(payload).sort(), ['action_kind','aggregate_columns','alternative_explanations','business_context','comparison_period','current_period','hypothesis_display_title','question_text','schema_version']);
  assert.equal(payload.question_text, 'Why did repurchase decline?');
  assert.equal(payload.comparison_period, null);
  assert.equal(payload.current_period, null);
  assert.equal(preview.cost_notice, null);
  assert.match(requiredString(preview,'irretractability_notice'), /撤回/);
  const command={...revisionCommand(draft.owner,desktopTestIds.revisionCommand,draft.rowVersion),preview_token:preview.preview_token,payload_sha256:preview.payload_sha256,decision:'refused',free_text_confirmed:false};
  const after = await requiredExport<Method>(draft.application,'decideAssistanceDisclosure')(command);
  assert.equal((after.disclosures as unknown[]).length,1);
  assert.equal((after.disclosures as Record<string,unknown>[])[0].decision,'refused');
  assert.deepEqual(after.attempts,[]);assert.deepEqual(after.assistance_drafts,[]);
  for(const key of ['runs','findings','forms','acceptances','closures','reports'])assert.deepEqual(after[key],before[key]);
  assert.equal(requiredRecord(after.revision,'revision').state,'Draft');
  assert.equal(draft.runtime.calls.length,0);
  assert.doesNotMatch(JSON.stringify(after.disclosures), /payload_text|Why did repurchase|payload_bytes/);
  assert.deepEqual(await requiredExport<Method>(draft.application,'decideAssistanceDisclosure')(command),after);
}));

test('AC-XDESK-006-01: permits organize_question only with the exact pre-aggregate text/label payload and second free-text confirmation', async () => {
  await withIsolatedProject(async (projectRoot) => {
    const draft = await openDraft(projectRoot);
    const preview = await requiredExport<Method>(draft.application, 'prepareAssistanceDisclosure')({ contract_version: '1.0', ...draft.owner, expected_row_version: draft.rowVersion, action_kind: 'organize_question', requested_provider: 'offline-test', requested_model: 'deterministic' });
    assert.match(requiredString(preview, 'payload_text'), /question_text/);
    await assert.rejects(() => requiredExport<Method>(draft.application, 'decideAssistanceDisclosure')({ ...revisionCommand(draft.owner, desktopTestIds.revisionCommand, draft.rowVersion), preview_token: requiredString(preview, 'preview_token'), payload_sha256: requiredString(preview, 'payload_sha256'), decision: 'accepted', free_text_confirmed: false }), /AUTHORITY_REQUIRED|VALIDATION_FAILED/);
    assert.equal(draft.runtime.calls.length, 0, 'a declined second confirmation must not preflight or invoke the external Runtime');
  });
});

test('U4 unavailable selected Runtime rejects before admission and preserves accepted disclosure [AC-XDESK-006-08]',async()=>withIsolatedProject(async projectRoot=>{
  const draft=await openDraft(projectRoot,createOfflineAssistanceRuntimeDouble({ready:false})),accepted=await acceptedDisclosure(draft);
  await assert.rejects(()=>requiredExport<Method>(draft.application,'startAssistance')({...revisionCommand(draft.owner,desktopTestIds.retryCommand,accepted.rowVersion),disclosure_id:accepted.disclosure.disclosure_id}),/PROVIDER_UNAVAILABLE/);
  const after=await requiredExport<Method>(draft.application,'readProjection')(draft.owner);
  assert.deepEqual(after.attempts,[]);assert.deepEqual(after.assistance_drafts,[]);assert.equal((after.disclosures as Record<string,unknown>[])[0].decision,'accepted');
  assert.equal(draft.runtime.calls.filter(x=>x.kind==='execute').length,0);
}));

test('AC-XDESK-006-02: permits explain_evidence only in Review with the approved aggregate subset', async () => {
  await withIsolatedProject(async (projectRoot) => {
    const draft = await openDraft(projectRoot);
    await assert.rejects(() => requiredExport<Method>(draft.application, 'prepareAssistanceDisclosure')({ contract_version: '1.0', ...draft.owner, expected_row_version: draft.rowVersion, action_kind: 'explain_evidence', requested_provider: 'offline-test', requested_model: 'deterministic' }), /AUTHORITY_REQUIRED|VALIDATION_FAILED/);
    assert.equal(draft.runtime.calls.length, 0, 'a pre-Review request cannot disclose raw source data to Runtime');
  });
});

test('AC-XDESK-006-03: permits draft_candidates only after exact Finding acceptance', async () => {
  await withIsolatedProject(async (projectRoot) => {
    const draft = await openDraft(projectRoot);
    await assert.rejects(() => requiredExport<Method>(draft.application, 'prepareAssistanceDisclosure')({ contract_version: '1.0', ...draft.owner, expected_row_version: draft.rowVersion, action_kind: 'draft_candidates', requested_provider: 'offline-test', requested_model: 'deterministic' }), /AUTHORITY_REQUIRED|VALIDATION_FAILED/);
    assert.equal(draft.runtime.calls.length, 0);
  });
});

test('AC-XDESK-006-04: binds every disclosure to canonical payload hash provider model categories irretractability and freshness', async () => {
  await withIsolatedProject(async (projectRoot) => {
    const draft = await openDraft(projectRoot);
    const disclosure = await acceptedDisclosure(draft);
    assert.equal(createHash('sha256').update(requiredString(disclosure.preview, 'payload_text')).digest('hex'), requiredString(disclosure.preview, 'payload_sha256'));
    await assert.rejects(() => requiredExport<Method>(draft.application, 'startAssistance')({ ...revisionCommand(draft.owner, desktopTestIds.retryCommand, disclosure.rowVersion), disclosure_id: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee' }), /NOT_FOUND|PAYLOAD_STALE/);
    assert.equal(draft.runtime.calls.length, 0, 'a stale/nonexistent disclosure cannot reach the external boundary');
  });
});

test('AC-XDESK-006-05: keeps raw data identifiers paths credentials and Pi internals out of all outbound and retained surfaces', async () => {
  await withIsolatedProject(async (projectRoot) => {
    const draft = await openDraft(projectRoot);
    const disclosure = await acceptedDisclosure(draft);
    await requiredExport<Method>(draft.application, 'startAssistance')({ ...revisionCommand(draft.owner, desktopTestIds.retryCommand, disclosure.rowVersion), disclosure_id: requiredString(disclosure.disclosure, 'disclosure_id') });
    const execute = draft.runtime.calls.find((call) => call.kind === 'execute');
    assert.ok(execute, 'only the real Application may call the external Runtime after accepted disclosure');
    const request = requiredRecord(execute.request, 'Runtime execute request');
    assert.ok(request.payload_bytes instanceof Uint8Array, 'privacy is proved from the actual outbound bytes, not JSON serialization of Uint8Array');
    const payloadText = new TextDecoder('utf-8', { fatal: true }).decode(request.payload_bytes);
    const payload = JSON.parse(payloadText) as Record<string, unknown>;
    assert.deepEqual(Object.keys(payload).sort(), ['action_kind','aggregate_columns','alternative_explanations','business_context','comparison_period','current_period','hypothesis_display_title','question_text','schema_version']);
    assert.deepEqual(payload, { schema_version:'1.0',action_kind:'organize_question',question_text: 'Why did repurchase decline?', hypothesis_display_title: 'Current repurchase rate is lower', business_context: '', alternative_explanations: ['Seasonality'],comparison_period:null,current_period:null,aggregate_columns:['active_member_count','repeat_member_count','repurchase_rate','repeat_revenue_fen'] });
    assert.equal(createHash('sha256').update(request.payload_bytes).digest('hex'), requiredString(request, 'payload_sha256'));
    assert.doesNotMatch(payloadText, /(?:0001|0002|North|South|members\.csv|orders\.csv|\.xanthil|\/Users\/|AKIA|sk-|PiSession)/);
    const projection = await settledAttempt(draft);
    assert.doesNotMatch(JSON.stringify(projection), /(?:0001|0002|North|South|members\.csv|orders\.csv|\.xanthil|\/Users\/|AKIA|sk-|PiSession|payload_bytes)/);
  });
});

test('AC-XDESK-006-06: admits at most one Attempt per accepted disclosure and records observed provenance only after response', async () => {
  await withIsolatedProject(async (projectRoot) => {
    const draft = await openDraft(projectRoot);
    const disclosure = await acceptedDisclosure(draft);
    const start = requiredExport<Method>(draft.application, 'startAssistance');
    const request = { ...revisionCommand(draft.owner, desktopTestIds.retryCommand, disclosure.rowVersion), disclosure_id: requiredString(disclosure.disclosure, 'disclosure_id') };
    const first = await start(request);
    const duplicate = await start(request);
    assert.equal((duplicate.attempts as Record<string,unknown>[])[0].attempt_id,(first.attempts as Record<string,unknown>[])[0].attempt_id,'same command resolves the original admitted identity even if settlement advances the projection');
    await assert.rejects(() => start({ ...revisionCommand(draft.owner, 'abababab-abab-4bab-8bab-abababababab', disclosure.rowVersion), disclosure_id: requiredString(disclosure.disclosure, 'disclosure_id') }), /BUSY|STALE_REVISION|COMMAND_CONFLICT/);
    const projection = await settledAttempt(draft);
    assert.equal(Array.isArray(projection.attempts), true);
    const attempts = projection.attempts as Array<Record<string, unknown>>;
    assert.equal(attempts.length, 1);
    assert.equal(requiredString(attempts[0], 'actual_provider'), 'offline-test');
    assert.equal(requiredString(attempts[0], 'actual_model'), 'deterministic');
    assert.equal(draft.runtime.calls.filter(call=>call.kind==='execute').length,1);
  });
});

test('AC-XDESK-006-07: creates one allowed Draft whose edit/adopt/reject changes only permitted durable fields', async () => {
  await withIsolatedProject(async (projectRoot) => {
    const draft = await openDraft(projectRoot);
    const disclosure = await acceptedDisclosure(draft);
    await requiredExport<Method>(draft.application, 'startAssistance')({ ...revisionCommand(draft.owner, desktopTestIds.retryCommand, disclosure.rowVersion), disclosure_id: requiredString(disclosure.disclosure, 'disclosure_id') });
    const afterStart = await settledAttempt(draft);
    assert.equal(Array.isArray(afterStart.assistance_drafts), true);
    const assistanceDraft = (afterStart.assistance_drafts as Array<Record<string, unknown>>).at(-1);
    assert.ok(assistanceDraft, 'the Runtime response is a pending Application-owned Draft, not an authority mutation');
    const afterReject = await requiredExport<Method>(draft.application, 'disposeAssistanceDraft')({ ...revisionCommand(draft.owner, 'ffffffff-ffff-4fff-8fff-ffffffffffff', requiredString(requiredRecord(afterStart.revision, 'after start revision'), 'row_version')), draft_id: requiredString(assistanceDraft, 'draft_id'), disposition: 'rejected', edited_content: null });
    assert.equal((afterReject.assistance_drafts as Array<Record<string, unknown>>).at(-1)?.disposition, 'rejected');
    assert.equal(requiredRecord(afterReject.revision, 'after reject revision').state, 'Draft');
  });
});

test('AC-XDESK-006-08: settles failure cancellation deadline and interruption as sanitized Attempt without Draft and preserves manual continuation', async () => {
  await withIsolatedProject(async (projectRoot) => {
    const draft = await openDraft(projectRoot, createOfflineAssistanceRuntimeDouble({ failExecute: 'PROVIDER_UNAVAILABLE' }));
    const disclosure = await acceptedDisclosure(draft);
    const started=await requiredExport<Method>(draft.application, 'startAssistance')({ ...revisionCommand(draft.owner, desktopTestIds.retryCommand, disclosure.rowVersion), disclosure_id: requiredString(disclosure.disclosure, 'disclosure_id') });
    assert.equal((started.attempts as Record<string,unknown>[])[0].status,'Running');
    const projection = await settledAttempt(draft);
    assert.equal((projection.assistance_drafts as unknown[]).length, 0);
    assert.equal(requiredRecord(projection.revision, 'failed assistance revision').state, 'Draft');
    assert.equal((projection.attempts as Record<string,unknown>[])[0].terminal_reason,'provider_failed');
    assert.equal((projection.attempts as Record<string,unknown>[])[0].status,'Failed');
    assert.doesNotMatch(JSON.stringify(projection.attempts), /PROVIDER_UNAVAILABLE/);
  });
});

test('U4 cancellation is durable and a late Runtime response cannot create a Draft [AC-XDESK-008-03, AC-XDESK-006-08]',async()=>withIsolatedProject(async projectRoot=>{
  const base=createOfflineAssistanceRuntimeDouble();let release!:()=>void,entered!:()=>void;
  const gate=new Promise<void>(resolve=>{release=resolve;}),started=new Promise<void>(resolve=>{entered=resolve;});
  const runtime={...base,runtime:{...base.runtime,async executeAssistance(request:Record<string,unknown>){entered();await gate;return base.runtime.executeAssistance(request);}}};
  const draft=await openDraft(projectRoot,runtime),disclosure=await acceptedDisclosure(draft);
  let projection=await requiredExport<Method>(draft.application,'startAssistance')({...revisionCommand(draft.owner,desktopTestIds.retryCommand,disclosure.rowVersion),disclosure_id:disclosure.disclosure.disclosure_id});await started;
  const attempt=(projection.attempts as Record<string,unknown>[])[0];assert.equal(attempt.status,'Running');assert.equal(attempt.actual_provider,null);
  try{
    projection=await requiredExport<Method>(draft.application,'cancelAssistance')({...revisionCommand(draft.owner,'87000000-0000-4000-8000-000000000001',requiredString(requiredRecord(projection.revision,'revision'),'row_version')),attempt_id:attempt.attempt_id});
    assert.equal((projection.attempts as Record<string,unknown>[])[0].status,'Cancelled');assert.deepEqual(projection.assistance_drafts,[]);
  }finally{release();}
  await new Promise(resolve=>setTimeout(resolve,15));const after=await requiredExport<Method>(draft.application,'readProjection')(draft.owner);
  assert.deepEqual(after.attempts,projection.attempts);assert.deepEqual(after.assistance_drafts,[]);assert.equal(requiredRecord(after.revision,'revision').state,'Draft');
}));

test('U4 Assistance deadline settles once without retry and suppresses a response after 300 seconds [AC-XDESK-008-02, AC-XDESK-008-03, AC-XDESK-008-04]',async()=>withIsolatedProject(async projectRoot=>{
  const base=createOfflineAssistanceRuntimeDouble();let release!:()=>void,entered!:()=>void,calls=0;
  const gate=new Promise<void>(r=>{release=r;}),started=new Promise<void>(r=>{entered=r;});
  const runtime={...base,runtime:{...base.runtime,async executeAssistance(request:Record<string,unknown>){calls++;assert.equal(request.deadline_seconds,300);entered();await gate;return base.runtime.executeAssistance(request);}}};
  const initial=await openDraft(projectRoot,runtime),module=await loadDesktopModule('packages/application/xanthil-desktop-decision-case.ts'),deadlines=createControlledDeadlineScheduler();let now=new Date('2026-01-02T03:04:05.006Z');
  const app=requiredExport<(v:unknown)=>Record<string,unknown>>(module,'createXanthilDesktopDecisionCaseApplication')({store:initial.store,analysisExecution:initial.analysisExecution,runEvidenceStore:initial.runEvidenceStore,assistanceRuntime:runtime.runtime,clock:()=>now,deadlineScheduler:deadlines.scheduler});
  await requiredExport<Method>(app,'openProject')({contract_version:'1.0',command_id:desktopTestIds.openProjectCommand,proposed_project_id:desktopTestIds.project,display_name:'Synthetic Project'});
  const draft={...initial,application:app},disclosure=await acceptedDisclosure(draft);
  await requiredExport<Method>(app,'startAssistance')({...revisionCommand(draft.owner,desktopTestIds.retryCommand,disclosure.rowVersion),disclosure_id:disclosure.disclosure.disclosure_id});await started;
  try{
    assert.equal(deadlines.scheduled.length,1);assert.equal(deadlines.scheduled[0].at_epoch_ms-now.getTime(),300000);
    now=new Date(now.getTime()+300000);deadlines.runDue(now.getTime());const after=await settledAttempt(draft),attempt=(after.attempts as Record<string,unknown>[])[0];
    assert.equal(attempt.status,'Failed');assert.equal(attempt.terminal_reason,'deadline_exceeded');assert.deepEqual(after.assistance_drafts,[]);assert.equal(calls,1);assert.equal(base.calls.filter(x=>x.kind==='cancel').length,1);
    release();await new Promise(r=>setTimeout(r,20));assert.deepEqual(await requiredExport<Method>(app,'readProjection')(draft.owner),after);assert.equal(calls,1);
  }finally{release();}
}));

test('U4 admitted Assistance excludes a real Run and rejects cross-owner pending or already rejected Draft effects [AC-XDESK-008-01, AC-XDESK-006-07, AC-XDESK-009-05]',async()=>withIsolatedProject(async projectRoot=>{
  const base=createOfflineAssistanceRuntimeDouble();let release!:()=>void,entered!:()=>void;const gate=new Promise<void>(r=>{release=r;}),started=new Promise<void>(r=>{entered=r;});
  const runtime={...base,runtime:{...base.runtime,async executeAssistance(request:Record<string,unknown>){entered();await gate;return base.runtime.executeAssistance(request);}}};
  const ready=await openConfirmedDesktopRevision(projectRoot,runtime),draft={...ready,rowVersion:String(requiredRecord(ready.projection.revision,'revision').row_version)},disclosure=await acceptedDisclosure(draft);
  let projection=await requiredExport<Method>(ready.application,'startAssistance')({...revisionCommand(ready.owner,randomUUID(),disclosure.rowVersion),disclosure_id:disclosure.disclosure.disclosure_id});await started;
  try{await assert.rejects(()=>requiredExport<Method>(ready.application,'startAnalysis')({...revisionCommand(ready.owner,randomUUID(),String(requiredRecord(projection.revision,'revision').row_version)),confirmation_id:ready.confirmationId}),/BUSY/);assert.deepEqual((await requiredExport<Method>(ready.application,'readProjection')(ready.owner)).runs,[]);}finally{release();}
  projection=await settledAttempt(draft);const pending=(projection.assistance_drafts as Record<string,unknown>[])[0],command=()=>revisionCommand(ready.owner,randomUUID(),String(requiredRecord(projection.revision,'revision').row_version));
  await assert.rejects(()=>requiredExport<Method>(ready.application,'disposeAssistanceDraft')({...command(),revision_id:randomUUID(),draft_id:pending.draft_id,disposition:'adopted',edited_content:null}),/NOT_FOUND|STALE_REVISION/);
  await assert.rejects(()=>requiredExport<Method>(ready.application,'disposeAssistanceDraft')({...command(),draft_id:pending.draft_id,disposition:'adopted',edited_content:{evidence_explanation_text:'wrong kind'}}),/VALIDATION_FAILED|INVALID_REQUEST/);
  assert.deepEqual(await requiredExport<Method>(ready.application,'readProjection')(ready.owner),projection);
  projection=await requiredExport<Method>(ready.application,'disposeAssistanceDraft')({...command(),draft_id:pending.draft_id,disposition:'rejected',edited_content:null});
  await assert.rejects(()=>requiredExport<Method>(ready.application,'disposeAssistanceDraft')({...command(),draft_id:pending.draft_id,disposition:'adopted',edited_content:null}),/FORBIDDEN/);
  assert.deepEqual(await requiredExport<Method>(ready.application,'readProjection')(ready.owner),projection);
}));

test('U4 edited question Draft adoption preserves exact user fields and reopens without new authority [AC-XDESK-006-07]',async()=>withIsolatedProject(async projectRoot=>{
  const draft=await openDraft(projectRoot),disclosure=await acceptedDisclosure(draft);
  await requiredExport<Method>(draft.application,'startAssistance')({...revisionCommand(draft.owner,desktopTestIds.retryCommand,disclosure.rowVersion),disclosure_id:disclosure.disclosure.disclosure_id});
  const before=await settledAttempt(draft),pending=(before.assistance_drafts as Record<string,unknown>[])[0],edited={question_text:'  用户保留的疑问  ',hypothesis_display_title:'人工标题',business_context:'',alternative_explanations:[]};
  assert.equal(requiredRecord(before.revision,'revision').question_text,'Why did repurchase decline?');
  const command={...revisionCommand(draft.owner,'88000000-0000-4000-8000-000000000001',requiredString(requiredRecord(before.revision,'revision'),'row_version')),draft_id:pending.draft_id,disposition:'adopted',edited_content:edited};
  const after=await requiredExport<Method>(draft.application,'disposeAssistanceDraft')(command),revision=requiredRecord(after.revision,'revision');
  for(const [key,value]of Object.entries(edited))assert.deepEqual(revision[key],value);
  assert.equal(revision.state,'Draft');for(const key of ['runs','findings','acceptances','closures','reports'])assert.deepEqual(after[key],before[key]);
  assert.equal((after.assistance_drafts as Record<string,unknown>[])[0].disposition,'adopted');
  assert.deepEqual((after.assistance_drafts as Record<string,unknown>[])[0].generated_content,pending.generated_content);
  assert.deepEqual((after.assistance_drafts as Record<string,unknown>[])[0].edited_content,edited);
  assert.deepEqual(await requiredExport<Method>(draft.application,'disposeAssistanceDraft')(command),after);
  const reopened=await createRealDesktopApplication(projectRoot);await requiredExport<Method>(reopened.application,'openProject')({contract_version:'1.0',command_id:desktopTestIds.openProjectCommand,proposed_project_id:desktopTestIds.project,display_name:'Synthetic Project'});
  assert.deepEqual(await requiredExport<Method>(reopened.application,'readProjection')(draft.owner),after);assert.equal(reopened.runtime.calls.length,0);
}));

test('U4 fresh Application reopens a Running Attempt as interrupted exactly once without resend or late Draft [AC-XDESK-008-05]',async()=>withIsolatedProject(async projectRoot=>{
  const base=createOfflineAssistanceRuntimeDouble();let release!:()=>void,entered!:()=>void;
  const gate=new Promise<void>(resolve=>{release=resolve;}),started=new Promise<void>(resolve=>{entered=resolve;});
  const runtime={...base,runtime:{...base.runtime,async executeAssistance(request:Record<string,unknown>){entered();await gate;return base.runtime.executeAssistance(request);}}};
  const draft=await openDraft(projectRoot,runtime),disclosure=await acceptedDisclosure(draft);
  await requiredExport<Method>(draft.application,'startAssistance')({...revisionCommand(draft.owner,desktopTestIds.retryCommand,disclosure.rowVersion),disclosure_id:disclosure.disclosure.disclosure_id});await started;
  const reopened=await createRealDesktopApplication(projectRoot);
  const open={contract_version:'1.0',command_id:desktopTestIds.openProjectCommand,proposed_project_id:desktopTestIds.project,display_name:'Synthetic Project'};
  try{
    await requiredExport<Method>(reopened.application,'openProject')(open);
    const after=await requiredExport<Method>(reopened.application,'readProjection')(draft.owner),attempt=(after.attempts as Record<string,unknown>[])[0];
    assert.equal(attempt.status,'Failed');assert.equal(attempt.terminal_reason,'interrupted');assert.equal(attempt.actual_provider,null);assert.equal(attempt.actual_model,null);
    assert.deepEqual(after.assistance_drafts,[]);assert.equal(reopened.runtime.calls.length,0);assert.equal(requiredRecord(after.revision,'revision').state,'Draft');
    await requiredExport<Method>(reopened.application,'openProject')(open);
    assert.deepEqual(await requiredExport<Method>(reopened.application,'readProjection')(draft.owner),after,'a second reopen cannot append another receipt or advance row version');
    release();await new Promise(resolve=>setTimeout(resolve,20));
    assert.deepEqual(await requiredExport<Method>(reopened.application,'readProjection')(draft.owner),after,'the abandoned executor cannot overwrite the terminal state');
  }finally{release();}
}));

test('P1-C4 issued facade cancellation cannot use cleanup timeout as physical settlement',async t=>withIsolatedProject(async projectRoot=>{
 const draft=await openDraft(projectRoot),preview=await requiredExport<Method>(draft.application,'prepareAssistanceDisclosure')({contract_version:'1.0',...draft.owner,expected_row_version:'1',action_kind:'organize_question',requested_provider:'offline-test',requested_model:'deterministic'}),module=await loadDesktopModule('adapters/agent-pi/local-analysis.ts'),factory=requiredExport<(c:unknown,i:unknown)=>Record<string,unknown>>(module,'createPiDecisionAssistanceRuntime');
 let enter!:()=>void,finish!:()=>void,aborted!:()=>void;const entered=new Promise<void>(r=>enter=r),idle=new Promise<void>(r=>finish=r),aborting=new Promise<void>(r=>aborted=r);let disposed=0,settled=false;
 const runtime=factory({provider:'offline-test',model_id:'deterministic'},{sdkSessionFactory:async()=>Object.freeze({subscribe(){return()=>{};},setActiveTools(){return Object.freeze({active_tool_names:Object.freeze([])});},async prompt(){enter();await idle;return Object.freeze({settled:true});},getActualModel(){assert.fail('late model is not a publication');},async abort(){aborted();return Object.freeze({aborted:true});},async waitForIdle(){await idle;return Object.freeze({idle:true});},dispose(){disposed++;return Object.freeze({disposed:true});}})});
 await requiredExport<Method>(runtime,'preflightSelection')({requested_provider:'offline-test',requested_model:'deterministic'});t.mock.timers.enable({apis:['setTimeout']});const abort=new AbortController();
 const pending=requiredExport<Method>(runtime,'executeAssistance')({action_kind:'organize_question',payload_bytes:new TextEncoder().encode(String(preview.payload_text)),payload_sha256:preview.payload_sha256,requested_provider:'offline-test',requested_model:'deterministic',cancellation_signal:abort.signal,deadline_seconds:300}).catch(e=>e).finally(()=>{settled=true;});
 await entered;abort.abort();await aborting;t.mock.timers.tick(30001);await new Promise(r=>setImmediate(r));const early=settled,earlyDisposal=disposed;finish();const result=await pending;assert.equal(early,false,'elapsed cleanup timeout is not physical settlement');assert.equal(earlyDisposal,0);assert.equal(result.code,'CANCELLED');assert.equal(disposed,1);
}));
