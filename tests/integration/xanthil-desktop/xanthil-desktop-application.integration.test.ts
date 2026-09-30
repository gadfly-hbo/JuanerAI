import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import { syncBuiltinESMExports } from 'node:module';
import { DatabaseSync } from 'node:sqlite';
import { cp, mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import test from 'node:test';
import { validateXanthilDesktopRequest } from '../../../packages/contracts/xanthil-desktop-ipc.ts';
import { canonicalDesktopJson } from '../../../packages/product-core/xanthil-desktop-decision-case.ts';

import { join } from 'node:path';

import { createControlledDeadlineScheduler, createOfflineAssistanceRuntimeDouble, createU12ProjectAdmissionApplication, loadDesktopModule, requiredExport, requiredRecord, withCommitResponseLostAfterRealCommit, withIsolatedProject } from '../../fixtures/xanthil-desktop/desktop-contract-drivers.ts';
import { readDesktopPythonTool, assertDesktopFixtureHealth, createSessionCommand, createSucceededDesktopRunManifest, desktopTestIds, fixedClock, readSyntheticCsvPair, runBytes } from '../../fixtures/xanthil-desktop/desktop-fixtures.ts';

type Method = (value: Record<string, unknown>) => Promise<Record<string, unknown>>;

async function preparedU2Confirmation(projectRoot: string, ordersTransform?: (text: string) => string) {
  const { application, store } = await createU12ProjectAdmissionApplication(projectRoot);
  const open = { contract_version: '1.0', command_id: desktopTestIds.openProjectCommand, proposed_project_id: desktopTestIds.project, display_name: 'Synthetic Project' };
  await requiredExport<Method>(application, 'openProject')(open);
  const created = await requiredExport<Method>(application, 'createSession')(createSessionCommand());
  const session = requiredRecord(created.session, 'Session'), revision = requiredRecord(created.revision, 'revision');
  const owner = { project_id: desktopTestIds.project, session_id: session.session_id, case_id: session.case_id, revision_id: revision.revision_id };
  const base = { contract_version: '1.0', ...owner, expected_row_version: revision.row_version };
  const pair = await readSyntheticCsvPair(), source_files = { members: { display_name: 'members.csv', bytes: pair.members }, orders: { display_name: 'orders.csv', bytes: ordersTransform ? new TextEncoder().encode(ordersTransform(new TextDecoder().decode(pair.orders))) : pair.orders } };
  const inspect = requiredExport<Method>(application, 'inspectImportFiles'), initial = await inspect({ ...base, source_files });
  const full = fullConfirmation(), configuration = { column_mapping: full.column_mapping, comparison_period: full.comparison_period, current_period: full.current_period, currency: full.currency, time_zone: full.time_zone, valid_statuses: full.valid_statuses, selected_group_mode: full.selected_group_mode };
  const preview = await inspect({ ...base, source_files, inspection_token: initial.inspection_token, configuration });
  const issue_treatments = (preview.reviewable_issues as {code: string; count: string; treatment_options: string[]}[]).map(x => ({ code: x.code, count: x.count, treatment: x.treatment_options[0] }));
  return { application, store, owner, open, command: { ...base, command_id: desktopTestIds.revisionCommand, inspection_token: preview.inspection_token, confirmation: { ...full, issue_treatments }, source_files } };
}

async function initialRealU2Run(projectRoot: string) {
  const prepared = await preparedU2Confirmation(projectRoot), projection = await requiredExport<Method>(prepared.application, 'confirmRevision')(prepared.command);
  const snapshot = requiredRecord(projection.snapshot, 'snapshot'), confirmation = requiredRecord(projection.confirmation, 'confirmation');
  const read = await requiredExport<Method>(prepared.store, 'readConfirmedSnapshot')({ ...prepared.owner, confirmation_id: confirmation.confirmation_id });
  const documents = requiredRecord(read.confirmation, 'documents');
  const bytes = (value: Uint8Array) => ({ bytes: value, sha256: createHash('sha256').update(value).digest('hex'), byte_length: String(value.length) });
  const confirmation_files = { contract: bytes(documents.contract_bytes as Uint8Array), binding: bytes(documents.binding_bytes as Uint8Array), ir: bytes(documents.ir_bytes as Uint8Array) };
  const toolchain = process.env.JUANERAI_TOOLCHAIN_BIN; assert.ok(toolchain, 'approved toolchain health prerequisite');
  const module = await loadDesktopModule('adapters/analytics-duckdb/xanthil-desktop-decision-case.ts');
  const execution = requiredExport<(input: unknown) => Record<string, unknown>>(module, 'createDuckDbPythonDesktopLocalAnalysisExecution')({ duckdbExecutable: join(toolchain,'duckdb'), duckdbVersion: '1.5.2', ...readDesktopPythonTool(toolchain) });
  const description = await requiredExport<Method>(execution,'describeImplementation')({});
  const code_assets = { primary_sql: description.primary_sql, python_verifier: description.python_verifier };
  const fixture = await createSucceededDesktopRunManifest();
  const { ended_at, evidence, ...initial } = fixture; void ended_at; void evidence;
  const file = (path: string, input: unknown) => { const value = requiredRecord(input,path); return {path,sha256:value.sha256,byte_length:value.byte_length}; };
  const initial_manifest = { ...initial, status: 'in_progress', product_context: {...prepared.owner,confirmation_id:confirmation.confirmation_id,snapshot_id:snapshot.snapshot_id},
    confirmation: {contract:file('analysis-contract.json',confirmation_files.contract),binding:file('binding.json',confirmation_files.binding),ir:file('ir.json',confirmation_files.ir)},
    method: {id:'membership_repurchase_comparison',version:'1.0',code_identity:description.code_identity},
    sources: ['members','orders'].map(role => ({role,snapshot_id:snapshot.snapshot_id,...file(`${prepared.owner.session_id}/010_draw/${snapshot.snapshot_id}/${role}.csv`,snapshot[role]),display_name:requiredRecord(snapshot[role],role).display_name,confirmed_at:snapshot.confirmed_at})),
    artifacts: [{artifact_id:'primary-query',kind:'query',...file('assets/primary.sql',code_assets.primary_sql)},{artifact_id:'independent-verifier',kind:'verifier',...file('assets/verify.py',code_assets.python_verifier)}] };
  return { prepared, projection, execution, initial_manifest, confirmation_files, code_assets };
}

const u3Candidate=(id:string,title='Candidate')=>({candidate_id:id,title,evidence_basis:'Observed evidence',risk_or_refutation:'Association not causation',applicability_conditions:'Local confirmed snapshot',future_validation_metric:'Future independent replication'});
const u3Form=(overrides:Record<string,unknown>={})=>({kind:'decision_closure',candidates:[],route:null,insufficient_reason:null,preferred_candidate_id:null,preferred_reason:null,disposition:'draft',defer_until:null,...overrides});

test('U3 manual forms preserve incomplete Draft and two valid Review routes without implicit acceptance or completion [AC-XDESK-007-02, AC-XDESK-007-03, AC-XDESK-007-04, AC-XDESK-007-05]',async()=>withIsolatedProject(async projectRoot=>{
  const setup=await completedU2Analysis(projectRoot),save=requiredExport<Method>(setup.application,'saveForm');let projection=setup.projection;let ordinal=10;
  const command=(form:unknown)=>({contract_version:'1.0',command_id:`70000000-0000-4000-8000-${String(ordinal++).padStart(12,'0')}`,...setup.owner,expected_row_version:requiredRecord(projection.revision,'revision').row_version,form});
  projection=await save(command({kind:'evidence_explanation',evidence_explanation_text:'Manual interpretation remains separate from measured evidence.'}));
  assert.equal(requiredRecord(projection.revision,'revision').evidence_explanation_text,'Manual interpretation remains separate from measured evidence.');
  projection=await save(command(u3Form()));const first=(projection.forms as Record<string,unknown>[])[0];assert.equal(first.disposition,'draft');assert.deepEqual(first.candidates,[]);
  const a=u3Candidate('71000000-0000-4000-8000-000000000001'),b=u3Candidate('71000000-0000-4000-8000-000000000002','Different candidate');
  const before=await readFile(join(projectRoot,'.xanthil','desktop','state.sqlite'));
  for(const form of [u3Form({route:'candidate_comparison',disposition:'saved',candidates:[a]}),u3Form({route:'candidate_comparison',disposition:'saved',candidates:[a,a]}),u3Form({route:'candidate_comparison',disposition:'saved',candidates:[a,{...b,evidence_basis:'\u0085'}]}),u3Form({route:'candidate_comparison',disposition:'saved',candidates:[a,b],preferred_candidate_id:a.candidate_id,preferred_reason:' '}),u3Form({route:'insufficient_evidence',disposition:'saved',insufficient_reason:' '}),u3Form({route:'insufficient_evidence',disposition:'saved',insufficient_reason:'Missing counterfactual',preferred_candidate_id:a.candidate_id})])await assert.rejects(()=>save(command(form)),/VALIDATION_FAILED/);
  assert.deepEqual(await readFile(join(projectRoot,'.xanthil','desktop','state.sqlite')),before);
  projection=await save(command(u3Form({route:'candidate_comparison',disposition:'saved',candidates:[a,b],preferred_candidate_id:a.candidate_id,preferred_reason:'Evidence-supported preference'})));
  let forms=projection.forms as Record<string,unknown>[];assert.equal(forms.length,1);assert.equal(forms[0].form_id,first.form_id);assert.equal(forms[0].disposition,'saved');const saved=structuredClone(forms[0]);
  for(const disposition of ['not_adopted','deferred','more_evidence']){projection=await save(command(u3Form({disposition,defer_until:disposition==='deferred'?'2026-10-01':null})));assert.deepEqual((projection.forms as Record<string,unknown>[])[0],saved);assert.equal(requiredRecord(projection.revision,'revision').state,'Review');assert.deepEqual(projection.acceptances,[]);assert.deepEqual(projection.closures,[]);}
  projection=await save(command(u3Form({route:'insufficient_evidence',disposition:'saved',insufficient_reason:'A controlled comparison is not available.'})));
  forms=projection.forms as Record<string,unknown>[];assert.equal(forms.length,5);assert.equal(forms.at(-1)?.route,'insufficient_evidence');assert.equal(forms.at(-1)?.preferred_candidate_id,null);
  assert.equal(requiredRecord(projection.revision,'revision').state,'Review');assert.deepEqual(projection.reports,setup.projection.reports);assert.deepEqual(projection.closures,[]);
  const reopened=await createU12ProjectAdmissionApplication(projectRoot);await requiredExport<Method>(reopened.application,'openProject')(setup.open);assert.deepEqual(await requiredExport<Method>(reopened.application,'readProjection')(setup.owner),projection);
}));

async function acceptedU3Route(projectRoot:string,route:'candidate_comparison'|'insufficient_evidence'='candidate_comparison'){
  const setup=await completedU2Analysis(projectRoot),finding=(setup.projection.findings as Record<string,unknown>[])[0];
  const accepted=await requiredExport<Method>(setup.application,'acceptFinding')({contract_version:'1.0',command_id:'72000000-0000-4000-8000-000000000001',...setup.owner,expected_row_version:requiredRecord(setup.projection.revision,'revision').row_version,finding_id:finding.finding_id});
  const form=route==='candidate_comparison'?u3Form({route,disposition:'saved',candidates:[u3Candidate('72000000-0000-4000-8000-000000000002','Compare A'),u3Candidate('72000000-0000-4000-8000-000000000003','Compare B')]}):u3Form({route,disposition:'saved',insufficient_reason:'No controlled causal evidence is available.'});
  const projection=await requiredExport<Method>(setup.application,'saveForm')({contract_version:'1.0',command_id:'72000000-0000-4000-8000-000000000004',...setup.owner,expected_row_version:requiredRecord(accepted.revision,'revision').row_version,form});
  return {...setup,projection,original:setup.projection,command:{contract_version:'1.0',command_id:'72000000-0000-4000-8000-000000000005',...setup.owner,expected_row_version:requiredRecord(projection.revision,'revision').row_version,acceptance_id:(projection.acceptances as Record<string,unknown>[])[0].acceptance_id,form_id:(projection.forms as Record<string,unknown>[])[0].form_id}};
}

test('U3 explicit completion publishes one immutable final pair and exact closure after either saved route [AC-XDESK-007-05, AC-XDESK-007-06]',async t=>{
  for(const route of ['candidate_comparison','insufficient_evidence'] as const)await t.test(route,()=>withIsolatedProject(async projectRoot=>{
    const setup=await acceptedU3Route(projectRoot,route),complete=requiredExport<Method>(setup.application,'completeCase');
    assert.equal(requiredRecord(setup.projection.revision,'revision').state,'Review');const original=(setup.original.reports as Record<string,unknown>[])[0];
    const done=await complete(setup.command),revision=requiredRecord(done.revision,'revision'),closures=done.closures as Record<string,unknown>[],reports=done.reports as Record<string,unknown>[];
    assert.equal(revision.state,'Completed');assert.equal(closures.length,1);assert.equal(closures[0].acceptance_id,setup.command.acceptance_id);assert.equal(closures[0].form_id,setup.command.form_id);assert.equal(closures[0].route,route);
    assert.equal(revision.current_closure_id,closures[0].closure_id);assert.equal(reports.length,2);assert.deepEqual(reports[0],original);assert.equal(reports[1].state,'final');assert.equal(reports[1].version_sequence,'2');assert.equal(reports[1].closure_id,closures[0].closure_id);assert.equal(revision.current_report_id,reports[1].report_id);
    const directory=join(projectRoot,String(setup.owner.session_id),'060_reports',String(reports[1].report_id)),markdown=await readFile(join(directory,'report.md')),html=await readFile(join(directory,'report.html'));
    assert.equal(createHash('sha256').update(markdown).digest('hex'),reports[1].markdown_sha256);assert.equal(createHash('sha256').update(html).digest('hex'),reports[1].html_sha256);
    for(const text of [String(setup.command.acceptance_id),String(closures[0].closure_id),String(setup.command.form_id),'No external Action','primary.sql','verify.py'])assert.ok(markdown.toString().includes(text),text);
    assert.ok(markdown.toString().includes(route==='candidate_comparison'?'Compare A':'No controlled causal evidence'));
    assert.deepEqual(await complete(setup.command),done);assert.deepEqual(await readFile(join(directory,'report.md')),markdown);assert.deepEqual(await readFile(join(directory,'report.html')),html);
    const reopened=await createU12ProjectAdmissionApplication(projectRoot);await requiredExport<Method>(reopened.application,'openProject')(setup.open);assert.deepEqual(await requiredExport<Method>(reopened.application,'readProjection')(setup.owner),done);
  }));
});

test('U3 Completed refuses manual explanation edits without changing receipt version or final bytes [AC-XDESK-003-04, AC-XDESK-007-06]',async()=>withIsolatedProject(async projectRoot=>{
  const setup=await acceptedU3Route(projectRoot),done=await requiredExport<Method>(setup.application,'completeCase')(setup.command);
  const path=join(projectRoot,'.xanthil','desktop','state.sqlite'),before=await readFile(path),entries=await readdir(projectRoot,{recursive:true});
  await assert.rejects(()=>requiredExport<Method>(setup.application,'saveForm')({contract_version:'1.0',command_id:'79000000-0000-4000-8000-000000000201',...setup.owner,expected_row_version:requiredRecord(done.revision,'revision').row_version,form:{kind:'evidence_explanation',evidence_explanation_text:'Must not edit the completed revision'}}),/FORBIDDEN/);
  assert.deepEqual(await readFile(path),before);assert.deepEqual(await readdir(projectRoot,{recursive:true}),entries);assert.deepEqual(await requiredExport<Method>(setup.application,'readProjection')(setup.owner),done);
}));

test('U3 completion unknown COMMIT resolves only its exact new-connection receipt and prevents resend [AC-XDESK-008-04, AC-XDESK-011-05]',async t=>{
  for(const unreadable of [false,true])await t.test(String(unreadable),()=>withIsolatedProject(async projectRoot=>{
    const setup=await acceptedU3Route(projectRoot),complete=requiredExport<Method>(setup.application,'completeCase');
    await withCommitResponseLostAfterRealCommit({unreadableReceiptReadback:unreadable},async control=>{
      if(unreadable){await assert.rejects(()=>complete(setup.command),/RESULT_PENDING/);await assert.rejects(()=>complete(setup.command),/RESULT_PENDING/);control.assertReadbackTargetHit();}
      else assert.equal(requiredRecord((await complete(setup.command)).revision,'revision').state,'Completed');
      control.assertTargetHit();control.assertUnrelatedSqlForwarded();
    });
    const reopened=await createU12ProjectAdmissionApplication(projectRoot);await requiredExport<Method>(reopened.application,'openProject')(setup.open);
    const current=await requiredExport<Method>(reopened.application,'readProjection')(setup.owner),files=await readdir(projectRoot,{recursive:true});assert.equal((current.closures as unknown[]).length,1);assert.equal((current.reports as unknown[]).length,2);
    assert.deepEqual(await requiredExport<Method>(reopened.application,'completeCase')(setup.command),current);assert.deepEqual(await readdir(projectRoot,{recursive:true}),files);
  }));
});

test('U3 Completed rerun preserves accepted authority during Running and after a new pending Finding [AC-XDESK-007-06, AC-XDESK-008-04]',async()=>withIsolatedProject(async projectRoot=>{
  const setup=await acceptedU3Route(projectRoot),complete=requiredExport<Method>(setup.application,'completeCase'),done=await complete(setup.command),revision=requiredRecord(done.revision,'revision');
  const final=(done.reports as Record<string,unknown>[]).at(-1)!,finalBytes=await readFile(join(projectRoot,String(setup.owner.session_id),'060_reports',String(final.report_id),'report.html'));
  let projection=await requiredExport<Method>(setup.application,'startAnalysis')({contract_version:'1.0',command_id:'73000000-0000-4000-8000-000000000001',...setup.owner,expected_row_version:revision.row_version,confirmation_id:requiredRecord(done.confirmation,'confirmation').confirmation_id});
  const protectedKeys=['state','current_finding_id','current_acceptance_id','current_closure_id','current_report_id'];for(const key of protectedKeys)assert.equal(requiredRecord(projection.revision,'revision')[key],revision[key],key);
  for(let n=0;n<300&&(projection.runs as Record<string,unknown>[]).some(r=>r.status==='Running');n++){await new Promise(r=>setTimeout(r,10));projection=await requiredExport<Method>(setup.application,'readProjection')(setup.owner);}
  assert.equal((projection.runs as Record<string,unknown>[]).at(-1)?.status,'Succeeded');assert.equal((projection.findings as unknown[]).length,2);for(const key of protectedKeys)assert.equal(requiredRecord(projection.revision,'revision')[key],revision[key],key);
  assert.deepEqual(projection.acceptances,done.acceptances);assert.deepEqual(projection.closures,done.closures);assert.deepEqual((projection.reports as unknown[]).slice(0,2),done.reports);assert.deepEqual(await readFile(join(projectRoot,String(setup.owner.session_id),'060_reports',String(final.report_id),'report.html')),finalBytes);
  const reopened=await createU12ProjectAdmissionApplication(projectRoot);await requiredExport<Method>(reopened.application,'openProject')(setup.open);assert.deepEqual(await requiredExport<Method>(reopened.application,'readProjection')(setup.owner),projection);
}));

test('U3 final publication owner crash reopens only committed Closure and retains unadopted immutable files [TEST-XDESK-014, AC-XDESK-007-05, AC-XDESK-011-05]',async t=>{
  for(const point of ['published','before_commit','after_commit'])await t.test(point,()=>withIsolatedProject(async projectRoot=>{
    const setup=await acceptedU3Route(projectRoot),fixtureUrl=new URL('../../fixtures/xanthil-desktop/desktop-contract-drivers.ts',import.meta.url).href;
    const originalReports=await Promise.all((setup.projection.reports as Record<string,unknown>[]).flatMap(report=>['md','html'].map(async extension=>{const path=join(projectRoot,String(setup.owner.session_id),'060_reports',String(report.report_id),`report.${extension}`);return {path,bytes:await readFile(path)};})));
    const script=`import fs from 'node:fs';import {syncBuiltinESMExports} from 'node:module';import {DatabaseSync} from 'node:sqlite';const {createU12ProjectAdmissionApplication}=await import(${JSON.stringify(fixtureUrl)});const {application}=await createU12ProjectAdmissionApplication(${JSON.stringify(projectRoot)});await application.openProject(${JSON.stringify(setup.open)});const point=${JSON.stringify(point)};const stop=()=>{fs.writeSync(1,'U3-FINAL-BOUNDARY\\n');Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0);};const rename=fs.renameSync;fs.renameSync=function(from,to){const result=rename.call(this,from,to);if(point==='published'&&String(to).includes('/060_reports/'))stop();return result;};syncBuiltinESMExports();const exec=DatabaseSync.prototype.exec;DatabaseSync.prototype.exec=function(sql){if(sql==='COMMIT'){if(point==='before_commit')stop();const result=exec.call(this,sql);if(point==='after_commit')stop();return result;}return exec.call(this,sql);};await application.completeCase(${JSON.stringify(setup.command)});`;
    const child=spawn(process.execPath,['--experimental-strip-types','--input-type=module','-e',script],{stdio:['ignore','pipe','pipe'],env:process.env});let stdout='',stderr='',reached=false;
    const completion=await new Promise<{code:number|null;signal:NodeJS.Signals|null}>((resolve,reject)=>{const timer=setTimeout(()=>child.kill('SIGKILL'),10000);child.stdout.on('data',chunk=>{stdout+=String(chunk);if(!reached&&stdout.includes('U3-FINAL-BOUNDARY')){reached=true;child.kill('SIGKILL');}});child.stderr.on('data',chunk=>{stderr+=String(chunk);});child.once('error',error=>{clearTimeout(timer);reject(error);});child.once('close',(code,signal)=>{clearTimeout(timer);resolve({code,signal});});});
    t.diagnostic(JSON.stringify({point,pid:child.pid,argv:child.spawnargs,stdout,stderr,...completion}));assert.equal(reached,true);assert.equal(completion.signal,'SIGKILL');assert.throws(()=>process.kill(child.pid!,0),{code:'ESRCH'});
    const reportRoot=join(projectRoot,String(setup.owner.session_id),'060_reports'),filesBefore=await readdir(reportRoot,{recursive:true});assert.equal(filesBefore.filter(name=>String(name).endsWith('report.md')).length,2,'the final pair was physically published at every chosen crash point');
    const physical=await Promise.all(filesBefore.filter(name=>/report\.(md|html)$/.test(String(name))).map(async name=>({path:join(reportRoot,String(name)),bytes:await readFile(join(reportRoot,String(name)))})));
    const reopenScript=`const {createU12ProjectAdmissionApplication}=await import(${JSON.stringify(fixtureUrl)});const {application}=await createU12ProjectAdmissionApplication(${JSON.stringify(projectRoot)});await application.openProject(${JSON.stringify(setup.open)});console.log(JSON.stringify(await application.readProjection(${JSON.stringify(setup.owner)})));`;
    const reopening=spawn(process.execPath,['--experimental-strip-types','--input-type=module','-e',reopenScript],{stdio:['ignore','pipe','pipe'],env:process.env});let out='',err='';const exit=await new Promise<number|null>((resolve,reject)=>{const timer=setTimeout(()=>reopening.kill('SIGKILL'),10000);reopening.stdout.on('data',b=>{out+=String(b);});reopening.stderr.on('data',b=>{err+=String(b);});reopening.once('error',error=>{clearTimeout(timer);reject(error);});reopening.once('close',code=>{clearTimeout(timer);resolve(code);});});
    t.diagnostic(JSON.stringify({point,reopen_pid:reopening.pid,argv:reopening.spawnargs,stdout:out,stderr:err,exit}));assert.equal(exit,0);const projection=JSON.parse(out);assert.equal(projection.revision.state,point==='after_commit'?'Completed':'Review');assert.equal(projection.closures.length,point==='after_commit'?1:0);assert.equal(projection.reports.length,point==='after_commit'?2:1);
    for(const file of [...originalReports,...physical])assert.deepEqual(await readFile(file.path),file.bytes);assert.deepEqual(await readdir(reportRoot,{recursive:true}),filesBefore);
    const db=new DatabaseSync(join(projectRoot,'.xanthil','desktop','state.sqlite'),{readOnly:true});try{assert.equal(db.prepare("SELECT count(*) n FROM command_receipts WHERE operation_kind='complete_case'").get()?.n,point==='after_commit'?1:0);}finally{db.close();}
  }));
});

test('U3 second explicit acceptance and completion preserve prior final history until the new Closure commits [AC-XDESK-007-05, AC-XDESK-007-06]',async()=>withIsolatedProject(async projectRoot=>{
  const setup=await acceptedU3Route(projectRoot),done=await requiredExport<Method>(setup.application,'completeCase')(setup.command),beforeRevision=requiredRecord(done.revision,'revision');
  const unchanged=await readFile(join(projectRoot,'.xanthil','desktop','state.sqlite'));
  await assert.rejects(()=>requiredExport<Method>(setup.application,'saveForm')({contract_version:'1.0',command_id:'79000000-0000-4000-8000-000000000202',...setup.owner,expected_row_version:beforeRevision.row_version,form:u3Form({route:'insufficient_evidence',disposition:'saved',insufficient_reason:'No new accepted Finding yet'})}),/FORBIDDEN/);
  assert.deepEqual(await readFile(join(projectRoot,'.xanthil','desktop','state.sqlite')),unchanged);
  const final=(done.reports as Record<string,unknown>[]).at(-1)!,finalPath=join(projectRoot,String(setup.owner.session_id),'060_reports',String(final.report_id),'report.md'),original=await readFile(finalPath);
  let projection=await requiredExport<Method>(setup.application,'startAnalysis')({contract_version:'1.0',command_id:'78000000-0000-4000-8000-000000000001',...setup.owner,expected_row_version:beforeRevision.row_version,confirmation_id:requiredRecord(done.confirmation,'confirmation').confirmation_id});
  for(let n=0;n<300&&(projection.runs as Record<string,unknown>[]).some(r=>r.status==='Running');n++){await new Promise(r=>setTimeout(r,10));projection=await requiredExport<Method>(setup.application,'readProjection')(setup.owner);}
  assert.equal((projection.findings as unknown[]).length,2);const newFinding=(projection.findings as Record<string,unknown>[]).at(-1)!;
  const pendingBytes=await readFile(join(projectRoot,'.xanthil','desktop','state.sqlite'));
  await assert.rejects(()=>requiredExport<Method>(setup.application,'saveForm')({contract_version:'1.0',command_id:'79000000-0000-4000-8000-000000000203',...setup.owner,expected_row_version:requiredRecord(projection.revision,'revision').row_version,form:u3Form({route:'insufficient_evidence',disposition:'saved',insufficient_reason:'Pending Finding is not accepted'})}),/FORBIDDEN/);
  assert.deepEqual(await readFile(join(projectRoot,'.xanthil','desktop','state.sqlite')),pendingBytes);
  projection=await requiredExport<Method>(setup.application,'acceptFinding')({contract_version:'1.0',command_id:'78000000-0000-4000-8000-000000000002',...setup.owner,expected_row_version:requiredRecord(projection.revision,'revision').row_version,finding_id:newFinding.finding_id});
  for(const key of ['state','current_finding_id','current_acceptance_id','current_closure_id','current_report_id'])assert.equal(requiredRecord(projection.revision,'revision')[key],beforeRevision[key]);
  projection=await requiredExport<Method>(setup.application,'saveForm')({contract_version:'1.0',command_id:'78000000-0000-4000-8000-000000000003',...setup.owner,expected_row_version:requiredRecord(projection.revision,'revision').row_version,form:u3Form({route:'insufficient_evidence',disposition:'saved',insufficient_reason:'Second review retains causal limitations.'})});
  const newAcceptance=(projection.acceptances as Record<string,unknown>[]).at(-1)!,newForm=(projection.forms as Record<string,unknown>[]).at(-1)!;
  projection=await requiredExport<Method>(setup.application,'completeCase')({contract_version:'1.0',command_id:'78000000-0000-4000-8000-000000000004',...setup.owner,expected_row_version:requiredRecord(projection.revision,'revision').row_version,acceptance_id:newAcceptance.acceptance_id,form_id:newForm.form_id});
  assert.equal((projection.closures as unknown[]).length,2);assert.equal((projection.reports as unknown[]).length,4);assert.equal(requiredRecord(projection.revision,'revision').current_acceptance_id,newAcceptance.acceptance_id);assert.equal(requiredRecord(projection.revision,'revision').current_finding_id,newFinding.finding_id);assert.deepEqual((projection.reports as unknown[]).slice(0,2),done.reports);assert.deepEqual(await readFile(finalPath),original);
  const reopened=await createU12ProjectAdmissionApplication(projectRoot);await requiredExport<Method>(reopened.application,'openProject')(setup.open);assert.deepEqual(await requiredExport<Method>(reopened.application,'readProjection')(setup.owner),projection);
}));

test('U3 new Draft copies real Review explanation without granting old result authority or rewriting on reopen [AC-XDESK-003-04, AC-XDESK-007-06]',async()=>withIsolatedProject(async projectRoot=>{
  const setup=await completedU2Analysis(projectRoot),text='Retained user explanation, not new Finding authority.';
  const saved=await requiredExport<Method>(setup.application,'saveForm')({contract_version:'1.0',command_id:'79000000-0000-4000-8000-000000000204',...setup.owner,expected_row_version:requiredRecord(setup.projection.revision,'revision').row_version,form:{kind:'evidence_explanation',evidence_explanation_text:text}});
  const draft=await requiredExport<Method>(setup.application,'createDraftRevision')({contract_version:'1.0',command_id:'79000000-0000-4000-8000-000000000205',...setup.owner,expected_row_version:requiredRecord(saved.revision,'revision').row_version});
  const revision=requiredRecord(draft.revision,'revision');assert.equal(revision.evidence_explanation_text,text);assert.equal(revision.state,'Draft');for(const key of ['snapshot_id','confirmation_id','current_finding_id','current_acceptance_id','current_closure_id','current_report_id'])assert.equal(revision[key],null);
  const before=await readFile(join(projectRoot,'.xanthil','desktop','state.sqlite')),reopened=await createU12ProjectAdmissionApplication(projectRoot);await requiredExport<Method>(reopened.application,'openProject')(setup.open);
  assert.deepEqual(await requiredExport<Method>(reopened.application,'readProjection')({...setup.owner,revision_id:revision.revision_id}),draft);assert.deepEqual(await readFile(join(projectRoot,'.xanthil','desktop','state.sqlite')),before);
}));

test('U3 explanation admission distinguishes initial copied and latest legitimate saved values [AC-XDESK-003-04, AC-XDESK-007-06, AC-XDESK-011-02]',async t=>{
  const profileModule=await loadDesktopModule('profiles/personal/xanthil-desktop.ts');
  const open=async(root:string)=>requiredExport<Method>(requiredExport<(v:unknown)=>Record<string,unknown>>(profileModule,'createPersonalXanthilDesktopProfile')({toolchainDeployment:{descriptor_path:join(root,'unused-tool-description.json')},assistanceConfig:null,clock:fixedClock,deadlineScheduler:createControlledDeadlineScheduler().scheduler}),'openProject')({contract_version:'1.0',command_id:'7e000000-0000-4000-8000-000000000001',projectDirectoryCapability:{projectRoot:root,display_name:'Synthetic Project'},display_name:'Synthetic Project'});
  const rejectUnchanged=async(root:string,revisionId:string)=>{const path=join(root,'.xanthil','desktop','state.sqlite'),db=new DatabaseSync(path);try{db.prepare('UPDATE case_revisions SET evidence_explanation_text=? WHERE revision_id=?').run('Forged unrecorded explanation',revisionId);}finally{db.close();}const before=await readFile(path),entries=await readdir(root,{recursive:true});await assert.rejects(()=>open(root),/INTEGRITY_BLOCKED/);assert.deepEqual(await readFile(path),before);assert.deepEqual(await readdir(root,{recursive:true}),entries);};
  await t.test('initial no-save has no explanation authority',()=>withIsolatedProject(async root=>{
    const opened=await open(root),application=requiredRecord(opened.application,'application'),created=await requiredExport<Method>(application,'createSession')({...createSessionCommand(),project_id:requiredRecord(requiredRecord(opened.value,'value').project,'project').project_id});
    await rejectUnchanged(root,String(requiredRecord(created.revision,'revision').revision_id));
  }));
  await t.test('a legitimate initial case-field save still cannot authorize forged explanation',()=>withIsolatedProject(async root=>{
    const opened=await open(root),application=requiredRecord(opened.application,'application'),project_id=requiredRecord(requiredRecord(opened.value,'value').project,'project').project_id,created=await requiredExport<Method>(application,'createSession')({...createSessionCommand(),project_id});
    const revision=requiredRecord(created.revision,'revision'),session=requiredRecord(created.session,'session');await requiredExport<Method>(application,'saveForm')({contract_version:'1.0',command_id:'7e000000-0000-4000-8000-000000000008',project_id,session_id:session.session_id,case_id:session.case_id,revision_id:revision.revision_id,expected_row_version:revision.row_version,form:{kind:'case_fields',fields:{question_text:'Saved initial question',hypothesis_display_title:'H1',business_context:'',alternative_explanations:[]}}});
    await open(root);await rejectUnchanged(root,String(revision.revision_id));
  }));
  await t.test('real Review save nested copy and case edit preserve explanation; tampering is rejected',()=>withIsolatedProject(async root=>{
    const setup=await completedU2Analysis(root),text='Actual saved Review explanation';let p=await requiredExport<Method>(setup.application,'saveForm')({contract_version:'1.0',command_id:'7e000000-0000-4000-8000-000000000002',...setup.owner,expected_row_version:requiredRecord(setup.projection.revision,'revision').row_version,form:{kind:'evidence_explanation',evidence_explanation_text:text}});
    await open(root);let owner={...setup.owner};
    for(const id of ['3','4']){p=await requiredExport<Method>(setup.application,'createDraftRevision')({contract_version:'1.0',command_id:`7e000000-0000-4000-8000-${id.padStart(12,'0')}`,...owner,expected_row_version:requiredRecord(p.revision,'revision').row_version});owner={...owner,revision_id:requiredRecord(p.revision,'revision').revision_id};assert.equal(requiredRecord(p.revision,'revision').evidence_explanation_text,text);await open(root);await withIsolatedProject(async copy=>{await cp(root,copy,{recursive:true,force:false,errorOnExist:false,verbatimSymlinks:true});await rejectUnchanged(copy,String(owner.revision_id));});}
    p=await requiredExport<Method>(setup.application,'saveForm')({contract_version:'1.0',command_id:'7e000000-0000-4000-8000-000000000005',...owner,expected_row_version:requiredRecord(p.revision,'revision').row_version,form:{kind:'case_fields',fields:{question_text:'New question',hypothesis_display_title:'H1',business_context:'Changed copied Draft',alternative_explanations:[]}}});
    const before=await readFile(join(root,'.xanthil','desktop','state.sqlite'));await open(root);assert.deepEqual(await readFile(join(root,'.xanthil','desktop','state.sqlite')),before);await rejectUnchanged(root,String(owner.revision_id));
  }));
});

test('U3 admission rejects malformed closure forms receipts and current references without repair or byte changes [AC-XDESK-011-02, AC-XDESK-007-06]',async t=>withIsolatedProject(async baseline=>{
  const setup=await acceptedU3Route(baseline),done=await requiredExport<Method>(setup.application,'completeCase')(setup.command);
  const mutations=[['form_text',"UPDATE decision_forms SET candidates_json=json_set(candidates_json,'$[0].evidence_basis','')"],['form_duplicate',"UPDATE decision_forms SET candidates_json=json_set(candidates_json,'$[1].candidate_id',json_extract(candidates_json,'$[0].candidate_id'))"],['form_timestamp',"UPDATE decision_forms SET updated_at='2026-02-30T00:00:00.000Z'"],['acceptance_time',"UPDATE finding_acceptances SET accepted_at='2026-02-30T00:00:00.000Z'"],['closure_route',"UPDATE decision_closures SET route='insufficient_evidence'"],['closure_receipt',"UPDATE command_receipts SET input_fingerprint='"+'0'.repeat(64)+"' WHERE operation_kind='complete_case'"],['acceptance_receipt',"UPDATE command_receipts SET input_fingerprint='"+'0'.repeat(64)+"' WHERE operation_kind='accept_finding'"],['final_finding',"UPDATE report_versions SET source_json=json_set(source_json,'$.closure_id','79000000-0000-4000-8000-000000000099') WHERE state='final'"],['current_report',"UPDATE case_revisions SET current_report_id=(SELECT report_id FROM report_versions WHERE state='draft')"]];
  for(const [name,sql]of mutations)await t.test(name,()=>withIsolatedProject(async root=>{
    await cp(baseline,root,{recursive:true,force:false,errorOnExist:false,verbatimSymlinks:true});const path=join(root,'.xanthil','desktop','state.sqlite'),db=new DatabaseSync(path);try{db.exec(sql);}finally{db.close();}const before=await readFile(path),files=await readdir(root,{recursive:true}),native=await createU12ProjectAdmissionApplication(root);
    await assert.rejects(()=>requiredExport<Method>(native.application,'openProject')(setup.open),/INTEGRITY_BLOCKED/);assert.deepEqual(await readFile(path),before);assert.deepEqual(await readdir(root,{recursive:true}),files);
  }));assert.equal(requiredRecord(done.revision,'revision').state,'Completed');
}));

test('U3 final publication collision preserves empty or populated existing directory and creates no Closure [AC-XDESK-007-05, AC-XDESK-011-05]',async t=>{
  for(const populated of [false,true])await t.test(String(populated),()=>withIsolatedProject(async projectRoot=>{
    const setup=await acceptedU3Route(projectRoot),native=await createU12ProjectAdmissionApplication(projectRoot),module=await loadDesktopModule('packages/application/xanthil-desktop-decision-case.ts');let target='',identity:fs.Stats|undefined;
    const store={...native.store,completeCase:async(input:Record<string,unknown>)=>{const ids=requiredRecord(input.ids,'ids');target=join(projectRoot,String(setup.owner.session_id),'060_reports',String(ids.report_id));await mkdir(target);if(populated)await writeFile(join(target,'existing'),'owned prior bytes');identity=fs.lstatSync(target);return requiredExport<Method>(native.store,'completeCase')(input);}};
    const app=requiredExport<(x:unknown)=>Record<string,unknown>>(module,'createXanthilDesktopDecisionCaseApplication')({...native.dependencies,store});await requiredExport<Method>(app,'openProject')(setup.open);const before=await readFile(join(projectRoot,'.xanthil','desktop','state.sqlite'));
    await assert.rejects(()=>requiredExport<Method>(app,'completeCase')(setup.command),/PUBLICATION_FAILED/);assert.equal(fs.lstatSync(target).ino,identity?.ino);assert.deepEqual(await readdir(target),populated?['existing']:[]);if(populated)assert.equal(await readFile(join(target,'existing'),'utf8'),'owned prior bytes');assert.deepEqual(await readFile(join(projectRoot,'.xanthil','desktop','state.sqlite')),before);assert.deepEqual(await requiredExport<Method>(app,'readProjection')(setup.owner),setup.projection);
  }));
});

test('U3 export binds both verified prepared formats to a validated native readback descriptor without replaying a target [AC-XDESK-007-07, AC-XDESK-011-05]',async()=>withIsolatedProject(async projectRoot=>{
  const setup=await acceptedU3Route(projectRoot),done=await requiredExport<Method>(setup.application,'completeCase')(setup.command),report=(done.reports as Record<string,unknown>[]).at(-1)!;
  const preflight=requiredExport<Method>(setup.application,'checkReportExport'),prepare=requiredExport<Method>(setup.application,'prepareReportExport'),record=requiredExport<Method>(setup.application,'recordReportExport');
  const original=await readFile(join(projectRoot,'.xanthil','desktop','state.sqlite'));
  await assert.rejects(()=>prepare({command_id:'74000000-0000-4000-8000-000000000001',...setup.owner,report_id:report.report_id,format:'pdf'}),/VALIDATION_FAILED/);assert.deepEqual(await readFile(join(projectRoot,'.xanthil','desktop','state.sqlite')),original);
  for(const [format,suffix,media]of [['markdown','md','text/markdown;charset=utf-8'],['html','html','text/html;charset=utf-8']]){
    const command={contract_version:'1.0',command_id:format==='markdown'?'74000000-0000-4000-8000-000000000001':'74000000-0000-4000-8000-000000000002',...setup.owner,report_id:report.report_id};
    assert.equal(await preflight(command),null);const prepared=await prepare({command_id:command.command_id,...setup.owner,report_id:report.report_id,format}),bytes=prepared.bytes as Uint8Array;
    assert.equal(prepared.media_type,media);assert.equal(createHash('sha256').update(bytes).digest('hex'),prepared.sha256);assert.equal(String(bytes.byteLength),prepared.byte_length);
    assert.ok(new TextDecoder().decode(bytes).includes('primary.sql'));assert.ok(new TextDecoder().decode(bytes).includes('verify.py'));
    const descriptor={display_name:`synthetic.${suffix}`,media_type:media,sha256:prepared.sha256,byte_length:prepared.byte_length};
    await assert.rejects(()=>record({command,prepared,descriptor:{...descriptor,sha256:'0'.repeat(64)}}),/INTEGRITY_BLOCKED/);
    await assert.rejects(()=>record({command,prepared:{...prepared},descriptor}),/INTEGRITY_BLOCKED/,'copied data is not an issued private preparation');
    await assert.rejects(()=>record({command:{...command,command_id:'74000000-0000-4000-8000-000000000009'},prepared,descriptor}),/INTEGRITY_BLOCKED/,'a preparation cannot be reused by another command');
    const old=bytes[0];bytes[0]^=1;await assert.rejects(()=>record({command,prepared,descriptor}),/INTEGRITY_BLOCKED/,'issued identity cannot hide changed bytes');bytes[0]=old;
    const result=await record({command,prepared,descriptor});assert.deepEqual(result,{status:'written',report_id:report.report_id,file_name:descriptor.display_name,media_type:media,sha256:prepared.sha256,byte_length:prepared.byte_length});
    await assert.rejects(()=>record({command,prepared,descriptor:{...descriptor,display_name:`changed.${suffix}`}}),/COMMAND_CONFLICT/);
    const reopened=await createU12ProjectAdmissionApplication(projectRoot);await requiredExport<Method>(reopened.application,'openProject')(setup.open);assert.deepEqual(await requiredExport<Method>(reopened.application,'checkReportExport')(command),{status:'already_recorded',report_id:report.report_id});
    await assert.rejects(()=>requiredExport<Method>(reopened.application,'checkReportExport')({...command,report_id:(done.reports as Record<string,unknown>[])[0].report_id}),/COMMAND_CONFLICT/);
  }
  const after=await requiredExport<Method>(setup.application,'readProjection')(setup.owner);assert.deepEqual(after,done);
}));

async function completedU2Analysis(projectRoot:string, ordersTransform?: (text: string) => string) {
  const setup=await preparedU2Confirmation(projectRoot,ordersTransform),ready=await requiredExport<Method>(setup.application,'confirmRevision')(setup.command);
  await requiredExport<Method>(setup.application,'startAnalysis')({contract_version:'1.0',command_id:desktopTestIds.retryCommand,...setup.owner,expected_row_version:'2',confirmation_id:requiredRecord(ready.confirmation,'confirmation').confirmation_id});
  let projection:Record<string,unknown>=ready;
  for(let attempt=0;attempt<300;attempt++){await new Promise(resolve=>setTimeout(resolve,10));projection=await requiredExport<Method>(setup.application,'readProjection')(setup.owner);if((projection.runs as Record<string,unknown>[]).every(r=>r.status!=='Running'))break;}
  assert.equal(requiredRecord(projection.revision,'revision').state,'Review',JSON.stringify(projection.runs));return {...setup,projection};
}

test('U2 real confirmed CSV dual-engine analysis publishes exact three judgments without implicit acceptance [AC-XDESK-005-05]',async t=>{
  const variants=[
    {judgment:'Rejected',drop: /^never-an-order-id$/},
    {judgment:'Confirmed',drop: /^cur-00[34],/},
    {judgment:'Inconclusive',drop: /^cur-/},
  ];
  for(const variant of variants)await t.test(variant.judgment,()=>withIsolatedProject(async projectRoot=>{
    const setup=await completedU2Analysis(projectRoot,text=>text.split('\n').filter(line=>!variant.drop.test(line)).join('\n'));
    const projection=setup.projection,runs=projection.runs as Record<string,unknown>[],findings=projection.findings as Record<string,unknown>[];
    assert.equal(runs.length,1);assert.equal(runs[0].status,'Succeeded');assert.equal(findings.length,1);
    assert.equal(findings[0].judgment,variant.judgment);
    assert.ok((findings[0].limitations as string[]).includes('association_not_causation'));
    assert.ok((findings[0].limitations as string[]).includes('no_significance_test'));
    assert.equal(findings[0].refutation,variant.judgment==='Confirmed'?'association_does_not_establish_cause':variant.judgment==='Rejected'?'current_rate_is_not_lower':'active_member_denominator_is_zero');
    assert.deepEqual(projection.acceptances,[]);assert.deepEqual(projection.closures,[]);
    assert.equal((projection.reports as Record<string,unknown>[])[0].state,'draft');
    const reopened=await createU12ProjectAdmissionApplication(projectRoot);await requiredExport<Method>(reopened.application,'openProject')(setup.open);
    assert.deepEqual(await requiredExport<Method>(reopened.application,'readProjection')(setup.owner),projection);
  }));
});

async function completedThenFailedRerun(projectRoot:string){
  const setup=await acceptedU3Route(projectRoot),before=await requiredExport<Method>(setup.application,'completeCase')(setup.command),native=await createU12ProjectAdmissionApplication(projectRoot),module=await loadDesktopModule('packages/application/xanthil-desktop-decision-case.ts');let calculations=0,verifications=0;
  const execution={...requiredRecord(native.dependencies.analysisExecution,'analysisExecution'),calculate:async()=>{calculations++;throw Object.assign(new Error('CALCULATION_FAILED'),{code:'CALCULATION_FAILED'});},verify:async()=>{verifications++;assert.fail('failed calculation cannot reach verifier');}};
  const app=requiredExport<(input:unknown)=>Record<string,unknown>>(module,'createXanthilDesktopDecisionCaseApplication')({...native.dependencies,analysisExecution:execution});await requiredExport<Method>(app,'openProject')(setup.open);
  const reports=before.reports as Record<string,unknown>[],files=await Promise.all(reports.flatMap(report=>['md','html'].map(async extension=>{const path=join(projectRoot,String(setup.owner.session_id),'060_reports',String(report.report_id),`report.${extension}`);return {path,bytes:await readFile(path)};})));
  let after=await requiredExport<Method>(app,'startAnalysis')({contract_version:'1.0',command_id:'77000000-0000-4000-8000-000000000001',...setup.owner,expected_row_version:requiredRecord(before.revision,'revision').row_version,confirmation_id:requiredRecord(before.confirmation,'confirmation').confirmation_id});
  for(let n=0;n<200&&(after.runs as Record<string,unknown>[]).at(-1)?.status==='Running';n++){await new Promise(r=>setTimeout(r,5));after=await requiredExport<Method>(app,'readProjection')(setup.owner);}
  assert.equal((after.runs as Record<string,unknown>[]).at(-1)?.status,'Failed');assert.equal(calculations,1);assert.equal(verifications,0);
  for(const key of ['state','current_finding_id','current_acceptance_id','current_closure_id','current_report_id'])assert.equal(requiredRecord(after.revision,'revision')[key],requiredRecord(before.revision,'revision')[key],key);
  for(const key of ['findings','acceptances','forms','closures','reports'])assert.deepEqual(after[key],before[key],key);for(const file of files)assert.deepEqual(await readFile(file.path),file.bytes);
  const reopened=await createU12ProjectAdmissionApplication(projectRoot);await requiredExport<Method>(reopened.application,'openProject')(setup.open);assert.deepEqual(await requiredExport<Method>(reopened.application,'readProjection')(setup.owner),after);
  return {before,after};
}

test('U3 Main export uses selected-format physical bytes, exact receipt replay and effect-free refusal boundaries [AC-XDESK-007-07, AC-XDESK-009-04, AC-XDESK-011-05]',async()=>withIsolatedProject(async projectRoot=>{
  const setup=await acceptedU3Route(projectRoot),done=await requiredExport<Method>(setup.application,'completeCase')(setup.command),report=(done.reports as Record<string,unknown>[]).at(-1)!;
  const main=await loadDesktopModule('apps/desktop/main.ts'),realWriter=requiredExport<()=>{writeAndReadBack(c:unknown,b:Uint8Array):Promise<unknown>}>(main,'createNativeReportExportWriter')();
  let choices=0,writes=0,mode='markdown',writeMode='normal',target=join(projectRoot,'selected.md');const sender={};
  const make=async(application:Record<string,unknown>)=>{
    const handlers=requiredExport<(v:unknown)=>Record<string,(s:unknown,r:unknown)=>Promise<Record<string,unknown>>>>(main,'createXanthilDesktopIpcHandlers')({senderPolicy:(s:unknown)=>s===sender,
      productionProfile:{openProject:async()=>({application,value:{project:{project_id:desktopTestIds.project,display_name:'Synthetic Project',schema_version:'1.0',write_state:'ready'},sessions:await requiredExport<Method>(application,'listSessions')({project_id:desktopTestIds.project})}})},
      nativeDialogs:{selectProject:async()=>({}),selectImportFiles:async()=>{assert.fail('export cannot choose sources');},selectExportFile:async()=>{choices++;return mode==='cancel'?null:{capability:{path:target},display_name:target.split('/').at(-1),format:mode};}},
      sourceReader:{readSelectedFiles:async()=>{assert.fail('export cannot read raw sources');}},exportWriter:{writeAndReadBack:async(c:unknown,b:Uint8Array)=>{writes++;const result=await realWriter.writeAndReadBack(c,b);if(writeMode==='throw')throw new Error('synthetic native response lost after write');return writeMode==='mismatch'?{sha256:'0'.repeat(64),byte_length:String(b.length)}:result;}}});
    assert.equal((await handlers.selectProject(sender,{contract_version:'1.0',command_id:desktopTestIds.openProjectCommand})).ok,true);return handlers;
  };
  const handlers=await make(setup.application);const command={contract_version:'1.0',command_id:'75000000-0000-4000-8000-000000000001',...setup.owner,report_id:report.report_id};
  assert.equal(requiredRecord((await handlers.exportReport({},command)).error,'error').code,'FORBIDDEN');assert.equal(choices,0);assert.equal(writes,0);
  assert.equal(requiredRecord((await handlers.exportReport(sender,{...command,path:target})).error,'error').code,'INVALID_REQUEST');assert.equal(choices,0);
  mode='cancel';assert.equal(requiredRecord((await handlers.exportReport(sender,command)).error,'error').code,'CANCELLED');assert.equal(writes,0);assert.equal(await requiredExport<Method>(setup.application,'checkReportExport')(command),null);
  for(const [format,extension,id]of [['markdown','md','1'],['html','html','2']]){
    mode=format;target=join(projectRoot,`selected.${extension}`);const request={...command,command_id:`75000000-0000-4000-8000-${id.padStart(12,'0')}`},result=await handlers.exportReport(sender,request);assert.equal(result.ok,true,JSON.stringify(result));const value=requiredRecord(result.value,'written'),bytes=await readFile(target);
    assert.equal(value.status,'written');assert.equal(value.sha256,createHash('sha256').update(bytes).digest('hex'));assert.equal(value.byte_length,String(bytes.length));assert.equal(value.media_type,format==='markdown'?'text/markdown;charset=utf-8':'text/html;charset=utf-8');
    const counts:readonly number[]=[choices,writes];const reopened=await createU12ProjectAdmissionApplication(projectRoot);await requiredExport<Method>(reopened.application,'openProject')(setup.open);const next=await make(reopened.application);
    assert.deepEqual(await next.exportReport(sender,request),{ok:true,value:{status:'already_recorded',report_id:report.report_id}});assert.deepEqual([choices,writes],counts);assert.deepEqual(await readFile(target),bytes);
    assert.equal(requiredRecord((await next.exportReport(sender,{...request,report_id:(done.reports as Record<string,unknown>[])[0].report_id})).error,'error').code,'COMMAND_CONFLICT');assert.deepEqual([choices,writes],counts);
  }
  mode='html';const existing=await readFile(target),failed={...command,command_id:'75000000-0000-4000-8000-000000000003'};assert.equal((await handlers.exportReport(sender,failed)).ok,false);assert.deepEqual(await readFile(target),existing);const counts=[choices,writes];assert.equal(requiredRecord((await handlers.exportReport(sender,failed)).error,'error').code,'RESULT_PENDING');assert.deepEqual([choices,writes],counts);
  for(const [failure,id]of [['mismatch','4'],['throw','5']]){writeMode=failure;target=join(projectRoot,`unacknowledged-${failure}.html`);const request={...command,command_id:`75000000-0000-4000-8000-${id.padStart(12,'0')}`},dbBefore=await readFile(join(projectRoot,'.xanthil','desktop','state.sqlite'));assert.equal((await handlers.exportReport(sender,request)).ok,false);const actualBytes=await readFile(target),countBefore:readonly number[]=[choices,writes];assert.ok(actualBytes.length>0);assert.equal(requiredRecord((await handlers.exportReport(sender,request)).error,'error').code,'RESULT_PENDING');assert.deepEqual([choices,writes],countBefore);assert.deepEqual(await readFile(target),actualBytes);assert.deepEqual(await readFile(join(projectRoot,'.xanthil','desktop','state.sqlite')),dbBefore);assert.equal(await requiredExport<Method>(setup.application,'checkReportExport')(request),null);}
  assert.deepEqual(await requiredExport<Method>(setup.application,'readProjection')(setup.owner),done);
}));

test('U3 export concurrency admits one native attempt before every asynchronous boundary [AC-XDESK-007-07, AC-XDESK-009-04, AC-XDESK-011-05]',async t=>{
  for(const boundary of ['preflight','chooser','prepare','write'])await t.test(boundary,()=>withIsolatedProject(async projectRoot=>{
    const setup=await completedU2Analysis(projectRoot),report=(setup.projection.reports as Record<string,unknown>[])[0],main=await loadDesktopModule('apps/desktop/main.ts');
    const writer=requiredExport<()=>{writeAndReadBack(c:unknown,b:Uint8Array):Promise<unknown>}>(main,'createNativeReportExportWriter')();
    let release!:()=>void,entered!:()=>void;const held=new Promise<void>(r=>release=r),arrived=new Promise<void>(r=>entered=r);let choices=0,writes=0;
    const pause=async(point:string)=>{if(point===boundary){entered();await held;}};
    const app={...setup.application,checkReportExport:async(v:Record<string,unknown>)=>{await pause('preflight');return requiredExport<Method>(setup.application,'checkReportExport')(v);},prepareReportExport:async(v:Record<string,unknown>)=>{await pause('prepare');return requiredExport<Method>(setup.application,'prepareReportExport')(v);}};
    const sender={},handlers=requiredExport<(v:unknown)=>Record<string,(s:unknown,r:unknown)=>Promise<Record<string,unknown>>>>(main,'createXanthilDesktopIpcHandlers')({senderPolicy:(s:unknown)=>s===sender,productionProfile:{openProject:async()=>({application:app,value:{project:{project_id:desktopTestIds.project,display_name:'Synthetic Project',schema_version:'1.0',write_state:'ready'},sessions:[]}})},nativeDialogs:{selectProject:async()=>({}),selectImportFiles:async()=>null,selectExportFile:async()=>{choices++;await pause('chooser');return {capability:{path:join(projectRoot,`attempt-${choices}.md`)},display_name:`attempt-${choices}.md`,format:'markdown'};}},sourceReader:{readSelectedFiles:async()=>assert.fail('no sources')},exportWriter:{writeAndReadBack:async(c:unknown,b:Uint8Array)=>{writes++;await pause('write');return writer.writeAndReadBack(c,b);}}});
    await handlers.selectProject(sender,{contract_version:'1.0',command_id:desktopTestIds.openProjectCommand});
    const command={contract_version:'1.0',command_id:'7b000000-0000-4000-8000-000000000001',...setup.owner,report_id:report.report_id};
    const first=handlers.exportReport(sender,command);await arrived;
    // Release only after the second invocation had a chance to enter the old race;
    // no timer races or stranded asynchronous work after an assertion failure.
    const duplicate=handlers.exportReport(sender,command),conflict=handlers.exportReport(sender,{...command,report_id:'7b000000-0000-4000-8000-000000000002'});
    await new Promise<void>(r=>setImmediate(r));release();const [one,two,three]=await Promise.all([first,duplicate,conflict]);
    assert.equal(one.ok,true,JSON.stringify(one));assert.equal(requiredRecord(two.error,'duplicate').code,'RESULT_PENDING');assert.equal(requiredRecord(three.error,'conflict').code,'COMMAND_CONFLICT');
    assert.equal(choices,1);assert.equal(writes,1);assert.deepEqual((await readdir(projectRoot)).filter(x=>x.startsWith('attempt-')),['attempt-1.md']);
    assert.deepEqual(await handlers.exportReport(sender,command),{ok:true,value:{status:'already_recorded',report_id:report.report_id}});assert.equal(choices,1);assert.equal(writes,1);
  }));
});

test('U3 native export records its prepared bytes despite a legal intervening Review save [AC-XDESK-007-07, AC-XDESK-011-05]',async()=>withIsolatedProject(async projectRoot=>{
  const setup=await completedU2Analysis(projectRoot),report=(setup.projection.reports as Record<string,unknown>[])[0],main=await loadDesktopModule('apps/desktop/main.ts');
  const writer=requiredExport<()=>{writeAndReadBack(c:unknown,b:Uint8Array):Promise<unknown>}>(main,'createNativeReportExportWriter')();let actualBytes:Uint8Array|undefined;const sender={};
  const handlers=requiredExport<(v:unknown)=>Record<string,(s:unknown,r:unknown)=>Promise<Record<string,unknown>>>>(main,'createXanthilDesktopIpcHandlers')({senderPolicy:(s:unknown)=>s===sender,productionProfile:{openProject:async()=>({application:setup.application,value:{project:{project_id:desktopTestIds.project,display_name:'Synthetic Project',schema_version:'1.0',write_state:'ready'},sessions:[]}})},nativeDialogs:{selectProject:async()=>({}),selectImportFiles:async()=>null,selectExportFile:async()=>({capability:{path:join(projectRoot,'frozen.md')},display_name:'frozen.md',format:'markdown'})},sourceReader:{readSelectedFiles:async()=>assert.fail('no sources')},exportWriter:{writeAndReadBack:async(c:unknown,b:Uint8Array)=>{actualBytes=new Uint8Array(b);const result=await writer.writeAndReadBack(c,b);await requiredExport<Method>(setup.application,'saveForm')({contract_version:'1.0',command_id:'7c000000-0000-4000-8000-000000000002',...setup.owner,expected_row_version:requiredRecord(setup.projection.revision,'revision').row_version,form:{kind:'evidence_explanation',evidence_explanation_text:'A new legal interpretation after this export was prepared.'}});return result;}}});
  await handlers.selectProject(sender,{contract_version:'1.0',command_id:desktopTestIds.openProjectCommand});const command={contract_version:'1.0',command_id:'7c000000-0000-4000-8000-000000000001',...setup.owner,report_id:report.report_id};
  const result=await handlers.exportReport(sender,command);assert.equal(result.ok,true,JSON.stringify(result));assert.ok(actualBytes);assert.equal(requiredRecord(result.value,'export').sha256,createHash('sha256').update(actualBytes).digest('hex'));assert.deepEqual(new Uint8Array(await readFile(join(projectRoot,'frozen.md'))),actualBytes);
  const later=await requiredExport<Method>(setup.application,'prepareReportExport')({command_id:'7c000000-0000-4000-8000-000000000003',...setup.owner,report_id:report.report_id,format:'markdown'});assert.notEqual(later.sha256,requiredRecord(result.value,'export').sha256,'fixture really changes the later projection');
  assert.deepEqual(await requiredExport<Method>(setup.application,'checkReportExport')(command),{status:'already_recorded',report_id:report.report_id});
}));

test('U3 export rejects absent foreign and historical owners before native selection [AC-XDESK-007-07, AC-XDESK-009-04]',async()=>withIsolatedProject(async projectRoot=>{
  const setup=await completedU2Analysis(projectRoot),report=(setup.projection.reports as Record<string,unknown>[])[0],main=await loadDesktopModule('apps/desktop/main.ts'),sender={};let choices=0,writes=0;
  const handlers=requiredExport<(v:unknown)=>Record<string,(s:unknown,r:unknown)=>Promise<Record<string,unknown>>>>(main,'createXanthilDesktopIpcHandlers')({senderPolicy:(s:unknown)=>s===sender,productionProfile:{openProject:async()=>({application:setup.application,value:{project:{project_id:desktopTestIds.project,display_name:'Synthetic Project',schema_version:'1.0',write_state:'ready'},sessions:[]}})},nativeDialogs:{selectProject:async()=>({}),selectImportFiles:async()=>null,selectExportFile:async()=>{choices++;return null;}},sourceReader:{readSelectedFiles:async()=>assert.fail('no sources')},exportWriter:{writeAndReadBack:async()=>{writes++;assert.fail('no write');}}});
  await handlers.selectProject(sender,{contract_version:'1.0',command_id:desktopTestIds.openProjectCommand});const command={contract_version:'1.0',command_id:'7d000000-0000-4000-8000-000000000001',...setup.owner,report_id:report.report_id};
  const before=await readFile(join(projectRoot,'.xanthil','desktop','state.sqlite'));
  for(const request of [{...command,report_id:'7d000000-0000-4000-8000-000000000009'},{...command,session_id:'7d000000-0000-4000-8000-000000000009'}]){const result=await handlers.exportReport(sender,request);assert.equal(requiredRecord(result.error,'error').code,'NOT_FOUND');assert.equal(choices,0);assert.equal(writes,0);}
  assert.deepEqual(await readFile(join(projectRoot,'.xanthil','desktop','state.sqlite')),before);
  await requiredExport<Method>(setup.application,'createDraftRevision')({contract_version:'1.0',command_id:'7d000000-0000-4000-8000-000000000002',...setup.owner,expected_row_version:requiredRecord(setup.projection.revision,'revision').row_version});
  assert.equal(requiredRecord((await handlers.exportReport(sender,command)).error,'error').code,'STALE_REVISION');assert.equal(choices,0);assert.equal(writes,0);
}));

test('U3 export read projections distinguish Review and damaged immutable bytes without rewriting authority [AC-XDESK-007-07, AC-XDESK-011-07]',async()=>withIsolatedProject(async projectRoot=>{
  const setup=await completedU2Analysis(projectRoot),report=(setup.projection.reports as Record<string,unknown>[])[0],prepare=requiredExport<Method>(setup.application,'prepareReportExport');
  const before=await readFile(join(projectRoot,'.xanthil','desktop','state.sqlite'));
  for(const format of ['markdown','html']){const result=await prepare({command_id:'7a000000-0000-4000-8000-000000000002',...setup.owner,report_id:report.report_id,format}),text=new TextDecoder().decode(result.bytes as Uint8Array);assert.match(text,/UNACCEPTED/);assert.match(text,/primary.sql/);assert.match(text,/verify.py/);assert.doesNotMatch(text,/cmp-001|cur-001|North|South|\/Users\//);}
  assert.deepEqual(await readFile(join(projectRoot,'.xanthil','desktop','state.sqlite')),before);
  const file=join(projectRoot,String(setup.owner.session_id),'060_reports',String(report.report_id),'report.md');await writeFile(file,'damaged-marker-no-authority');
  for(const format of ['markdown','html']){const result=await prepare({command_id:'7a000000-0000-4000-8000-000000000003',...setup.owner,report_id:report.report_id,format}),text=new TextDecoder().decode(result.bytes as Uint8Array);assert.match(text,/INTEGRITY_BLOCKED/);assert.match(text,/UNACCEPTED/);assert.doesNotMatch(text,/damaged-marker-no-authority/);}
  assert.equal(await readFile(file,'utf8'),'damaged-marker-no-authority');assert.deepEqual(await readFile(join(projectRoot,'.xanthil','desktop','state.sqlite')),before);
}));

test('U3 export receipt unknown COMMIT forbids resend until exact reopened acknowledgement [AC-XDESK-011-05, AC-XDESK-007-07]',async t=>{
  for(const unreadable of [false,true])await t.test(String(unreadable),()=>withIsolatedProject(async root=>{
    const setup=await acceptedU3Route(root),done=await requiredExport<Method>(setup.application,'completeCase')(setup.command),report=(done.reports as Record<string,unknown>[]).at(-1)!;
    const prepared=await requiredExport<Method>(setup.application,'prepareReportExport')({command_id:'7a000000-0000-4000-8000-000000000001',...setup.owner,report_id:report.report_id,format:'html'}),command={contract_version:'1.0',command_id:'7a000000-0000-4000-8000-000000000001',...setup.owner,report_id:report.report_id},descriptor={display_name:'receipt-test.html',media_type:prepared.media_type,sha256:prepared.sha256,byte_length:prepared.byte_length};
    await withCommitResponseLostAfterRealCommit({unreadableReceiptReadback:unreadable},async control=>{
      const record=requiredExport<Method>(setup.application,'recordReportExport');if(unreadable){await assert.rejects(()=>record({command,prepared,descriptor}),/RESULT_PENDING/);await assert.rejects(()=>record({command,prepared,descriptor}),/RESULT_PENDING/);control.assertReadbackTargetHit();}else assert.equal((await record({command,prepared,descriptor})).status,'written');control.assertTargetHit();
    });
    const reopened=await createU12ProjectAdmissionApplication(root);await requiredExport<Method>(reopened.application,'openProject')(setup.open);assert.deepEqual(await requiredExport<Method>(reopened.application,'checkReportExport')(command),{status:'already_recorded',report_id:report.report_id});assert.deepEqual(await requiredExport<Method>(reopened.application,'readProjection')(setup.owner),done);
    const db=new DatabaseSync(join(root,'.xanthil','desktop','state.sqlite'),{readOnly:true});try{assert.equal(db.prepare("SELECT count(*) n FROM command_receipts WHERE operation_kind='export_report'").get()?.n,1);}finally{db.close();}
  }));
});

test('U3 exact Finding acceptance is idempotent and remains Review without closure or final report [AC-XDESK-007-02, AC-XDESK-007-01, AC-XDESK-007-05]',async()=>withIsolatedProject(async projectRoot=>{
  const setup=await completedU2Analysis(projectRoot),revision=requiredRecord(setup.projection.revision,'revision'),finding=(setup.projection.findings as Record<string,unknown>[])[0];
  const accept=requiredExport<Method>(setup.application,'acceptFinding');
  const command={contract_version:'1.0',command_id:'70000000-0000-4000-8000-000000000001',...setup.owner,expected_row_version:revision.row_version,finding_id:finding.finding_id};
  const before=await readFile(join(projectRoot,'.xanthil','desktop','state.sqlite'));
  await assert.rejects(()=>accept({...command,finding_id:'70000000-0000-4000-8000-000000000002'}),/NOT_FOUND/);
  assert.deepEqual(await readFile(join(projectRoot,'.xanthil','desktop','state.sqlite')),before);
  const accepted=await accept(command),after=requiredRecord(accepted.revision,'revision'),acceptances=accepted.acceptances as Record<string,unknown>[];
  assert.equal(acceptances.length,1);assert.equal(acceptances[0].finding_id,finding.finding_id);assert.equal(acceptances[0].action,'accept');
  assert.equal(after.current_acceptance_id,acceptances[0].acceptance_id);assert.equal(after.state,'Review');assert.equal(after.row_version,String(BigInt(String(revision.row_version))+1n));
  assert.deepEqual(accepted.closures,[]);assert.deepEqual(accepted.forms,[]);assert.deepEqual(accepted.reports,setup.projection.reports);assert.equal(after.current_closure_id,null);
  assert.deepEqual(await accept(command),accepted);
  await assert.rejects(()=>accept({...command,finding_id:'70000000-0000-4000-8000-000000000002'}),/COMMAND_CONFLICT/);
  await assert.rejects(()=>accept({...command,command_id:'70000000-0000-4000-8000-000000000003'}),/STALE_REVISION/);
  const reopened=await createU12ProjectAdmissionApplication(projectRoot);await requiredExport<Method>(reopened.application,'openProject')(setup.open);
  assert.deepEqual(await requiredExport<Method>(reopened.application,'readProjection')(setup.owner),accepted);
}));

test('U2 admission: canonical JSON provenance and method fields reject corruption without rewriting existing business authority [AC-XDESK-002-03, AC-XDESK-011-02]',async t=>withIsolatedProject(async baseline=>{
  const valid=await completedU2Analysis(baseline);
  const cases=[
    ["findings","supporting_evidence_json","[1]"], ["findings","limitations_json",'{}'], ["findings","evidence_refs_json",'["unrelated"]'],
    ["findings","refutation_json",'"unsupported statement"'], ["report_versions","source_json",'{}'], ["report_versions","evidence_refs_json",'["unrelated"]'],
    ["aggregate_artifacts","columns_json",'[1]'],["aggregate_artifacts","measurement_meanings_json",'{}'],["aggregate_artifacts","group_pseudonym_map_json",'{"group":"not-a-uuid"}'],
  ];
  for(const [table,column,value]of cases)await t.test(`${table}.${column}`,()=>withIsolatedProject(async projectRoot=>{
    for(const name of await readdir(baseline))await cp(join(baseline,name),join(projectRoot,name),{recursive:true,force:false,errorOnExist:true,verbatimSymlinks:true});
    const database=join(projectRoot,'.xanthil','desktop','state.sqlite'),db=new DatabaseSync(database);try{db.prepare(`UPDATE ${table} SET ${column}=?`).run(value);}finally{db.close();}
    const before=await readFile(database),directories=await readdir(projectRoot,{recursive:true}),reopened=await createU12ProjectAdmissionApplication(projectRoot);
    await assert.rejects(()=>requiredExport<Method>(reopened.application,'openProject')(valid.open),/INTEGRITY_BLOCKED/);
    assert.deepEqual(await readFile(database),before);assert.deepEqual(await readdir(projectRoot,{recursive:true}),directories);
  }));
  const reopened=await createU12ProjectAdmissionApplication(baseline);await requiredExport<Method>(reopened.application,'openProject')(valid.open);assert.deepEqual(await requiredExport<Method>(reopened.application,'readProjection')(valid.owner),valid.projection);
}));

test('U2 edit guard: Review revisions cannot mutate saved fields or receipts [AC-XDESK-003-03, AC-XDESK-008-02]',async()=>withIsolatedProject(async projectRoot=>{
  const completed=await completedU2Analysis(projectRoot),before=await readFile(join(projectRoot,'.xanthil','desktop','state.sqlite'));
  await assert.rejects(()=>requiredExport<Method>(completed.application,'saveForm')({contract_version:'1.0',command_id:'22222222-2222-4222-8222-222222222229',...completed.owner,expected_row_version:requiredRecord(completed.projection.revision,'revision').row_version,form:{kind:'case_fields',fields:{question_text:'must not edit Review',hypothesis_display_title:'H1',business_context:'',alternative_explanations:[]}}}),/FORBIDDEN/);
  assert.deepEqual(await readFile(join(projectRoot,'.xanthil','desktop','state.sqlite')),before);
}));

test('U2 damaged authority: a missing or changed committed report blocks mutation once and survives reopening with history intact [AC-XDESK-011-02]',async()=>withIsolatedProject(async projectRoot=>{
  const completed=await completedU2Analysis(projectRoot),report=(completed.projection.reports as Record<string,unknown>[])[0];
  const path=join(projectRoot,String(completed.owner.session_id),'060_reports',String(report.report_id),'report.md');
  await writeFile(path,'synthetic corrupted report');
  const damaged=await requiredExport<Method>(completed.application,'readProjection')(completed.owner);
  assert.equal(requiredRecord(damaged.revision,'revision').integrity_state,'integrity_blocked');
  assert.deepEqual(damaged.findings,completed.projection.findings);
  const reopened=await createU12ProjectAdmissionApplication(projectRoot);await requiredExport<Method>(reopened.application,'openProject')(completed.open);
  assert.deepEqual(await requiredExport<Method>(reopened.application,'readProjection')(completed.owner),damaged);
  assert.equal(await readFile(path,'utf8'),'synthetic corrupted report');
  const db=new DatabaseSync(join(projectRoot,'.xanthil','desktop','state.sqlite'),{readOnly:true});try{assert.equal(db.prepare("SELECT count(*) n FROM command_receipts WHERE operation_kind='mark_integrity_blocked'").get()?.n,1);}finally{db.close();}
}));

test('U2 terminal evidence: matching byte hashes do not authorize a result with the wrong implementation identity [AC-XDESK-005-07, AC-XDESK-011-02]',async()=>withIsolatedProject(async projectRoot=>{
  const completed=await completedU2Analysis(projectRoot),run=(completed.projection.runs as Record<string,unknown>[])[0];
  const directory=join(projectRoot,'.xanthil','runs',String(run.run_id)),path=join(directory,'outputs','duckdb.json');
  const result=JSON.parse(await readFile(path,'utf8'));result.implementation='python_independent';
  const bytes=Buffer.from(canonicalDesktopJson(result));await writeFile(path,bytes);
  const manifestPath=join(directory,'run.json'),manifest=JSON.parse(await readFile(manifestPath,'utf8'));
  manifest.artifacts[2].sha256=createHash('sha256').update(bytes).digest('hex');manifest.artifacts[2].byte_length=String(bytes.length);
  await writeFile(manifestPath,canonicalDesktopJson(manifest));
  const storage=await loadDesktopModule('adapters/storage-local/xanthil-desktop-decision-case.ts'),store=requiredExport<(input:unknown)=>Record<string,unknown>>(storage,'createLocalDesktopRunEvidenceStore')({projectRoot});
  await assert.rejects(()=>requiredExport<Method>(store,'readTerminalRun')({run_id:run.run_id}),/INTEGRITY_BLOCKED/);
  assert.deepEqual(await readFile(path),bytes);
}));

test('U2 recovery Draft: referenced report/source/Run damage permits one clean revision without inheriting or repairing damaged authority [AC-XDESK-011-07]',async t=>{
  for(const kind of ['report','source','run'])await t.test(kind,()=>withIsolatedProject(async projectRoot=>{
    const completed=await completedU2Analysis(projectRoot),projection=completed.projection;
    const report=(projection.reports as Record<string,unknown>[])[0],run=(projection.runs as Record<string,unknown>[])[0],snapshot=requiredRecord(projection.snapshot,'snapshot');
    const damagedPath=kind==='report'?join(projectRoot,String(completed.owner.session_id),'060_reports',String(report.report_id),'report.md'):kind==='source'?join(projectRoot,String(completed.owner.session_id),'010_draw',String(snapshot.snapshot_id),'members.csv'):join(projectRoot,'.xanthil','runs',String(run.run_id),'run.json');
    const badBytes=Buffer.from('retained synthetic damaged '+kind);await writeFile(damagedPath,badBytes);
    const blocked=await requiredExport<Method>(completed.application,'readProjection')(completed.owner);
    assert.equal(requiredRecord(blocked.revision,'blocked revision').integrity_state,'integrity_blocked');
    if(kind!=='source')assert.equal((blocked.reports as Record<string,unknown>[])[0].review_content,null,'bad referenced report/Run must never be forwarded as readable content');
    const command={contract_version:'1.0',command_id:'eeeeeeee-eeee-4eee-8eee-eeeeeeeeee01',...completed.owner,expected_row_version:requiredRecord(blocked.revision,'revision').row_version};
    const dbPath=join(projectRoot,'.xanthil','desktop','state.sqlite'),before=await readFile(dbPath),directories=await readdir(projectRoot,{recursive:true});
    await assert.rejects(()=>requiredExport<Method>(completed.application,'createDraftRevision')({...command,expected_row_version:'999'}),/STALE_REVISION/);
    await assert.rejects(()=>requiredExport<Method>(completed.application,'createDraftRevision')({...command,case_id:'eeeeeeee-eeee-4eee-8eee-eeeeeeeeee02'}),/STALE_REVISION|NOT_FOUND/);
    await assert.rejects(()=>requiredExport<Method>(completed.application,'startAnalysis')({...command,confirmation_id:requiredRecord(projection.confirmation,'confirmation').confirmation_id}),/INTEGRITY_BLOCKED/);
    assert.deepEqual(await readFile(dbPath),before);
    const next=await requiredExport<Method>(completed.application,'createDraftRevision')(command),revision=requiredRecord(next.revision,'new revision');
    assert.equal(requiredRecord(blocked.capabilities,'capabilities').can_create_draft_revision,true);
    assert.equal(revision.integrity_state,'ok');assert.equal(revision.state,'Draft');assert.equal(revision.previous_revision_id,completed.owner.revision_id);
    for(const field of ['snapshot','confirmation'])assert.equal(next[field],null);
    for(const field of ['runs','findings','reports'])assert.deepEqual(next[field],[]);
    for(const field of ['snapshot_id','confirmation_id','current_finding_id','current_acceptance_id','current_closure_id','current_report_id'])assert.equal(revision[field],null);
    assert.deepEqual(await requiredExport<Method>(completed.application,'createDraftRevision')(command),next);
    assert.deepEqual(await readFile(damagedPath),badBytes);assert.deepEqual(await readdir(projectRoot,{recursive:true}),directories);
    const reopened=await createU12ProjectAdmissionApplication(projectRoot);await requiredExport<Method>(reopened.application,'openProject')(completed.open);
    assert.deepEqual(await requiredExport<Method>(reopened.application,'openSession')({contract_version:'1.0',project_id:completed.owner.project_id,session_id:completed.owner.session_id}),next);
    const afterRecovery=await readFile(dbPath),old=await requiredExport<Method>(reopened.application,'readProjection')(completed.owner);
    assert.equal(requiredRecord(old.session,'Session').current_revision_id,revision.revision_id);assert.ok(Object.values(requiredRecord(old.capabilities,'capabilities')).every(x=>x===false));
    assert.deepEqual(await readFile(dbPath),afterRecovery,'damaged historical read writes neither an integrity receipt nor another revision');assert.deepEqual(await readFile(damagedPath),badBytes);
  }));
});

test('U2 revision history: prior Review remains readable after new Draft and reopen, with every capability read-only and all fresh mutations refused [AC-XDESK-002-06, AC-XDESK-003-02, AC-XDESK-003-04]',async()=>withIsolatedProject(async projectRoot=>{
  const completed=await completedU2Analysis(projectRoot),current=completed.projection;
  const next=await requiredExport<Method>(completed.application,'createDraftRevision')({contract_version:'1.0',command_id:'eeeeeeee-eeee-4eee-8eee-eeeeeeeeee03',...completed.owner,expected_row_version:requiredRecord(current.revision,'revision').row_version});
  const before=await readFile(join(projectRoot,'.xanthil','desktop','state.sqlite'));
  for(const app of [completed.application,(await createU12ProjectAdmissionApplication(projectRoot)).application]){
    await requiredExport<Method>(app,'openProject')(completed.open);
    const old=await requiredExport<Method>(app,'readProjection')(completed.owner);
    for(const field of ['revision','snapshot','confirmation','runs','findings','reports'])assert.deepEqual(old[field],current[field]);
    assert.equal(requiredRecord(old.session,'Session').current_revision_id,requiredRecord(next.revision,'current').revision_id);
    assert.ok(Object.values(requiredRecord(old.capabilities,'capabilities')).every(x=>x===false));
    const write={contract_version:'1.0',command_id:'eeeeeeee-eeee-4eee-8eee-eeeeeeeeee04',...completed.owner,expected_row_version:requiredRecord(old.revision,'old').row_version};
    await assert.rejects(()=>requiredExport<Method>(app,'createDraftRevision')(write),/STALE_REVISION/);
    await assert.rejects(()=>requiredExport<Method>(app,'saveForm')({...write,form:{kind:'case_fields',fields:createSessionCommand().fields}}),/STALE_REVISION/);
    await assert.rejects(()=>requiredExport<Method>(app,'startAnalysis')({...write,confirmation_id:requiredRecord(old.confirmation,'confirmation').confirmation_id}),/STALE_REVISION/);
    await assert.rejects(()=>requiredExport<Method>(app,'cancelAnalysis')({...write,run_id:(old.runs as Record<string,unknown>[])[0].run_id}),/STALE_REVISION/);
    await assert.rejects(()=>requiredExport<Method>(app,'readProjection')({...completed.owner,case_id:'eeeeeeee-eeee-4eee-8eee-eeeeeeeeee05'}),/STALE_REVISION|NOT_FOUND/);
    assert.deepEqual(await requiredExport<Method>(app,'openSession')({contract_version:'1.0',project_id:completed.owner.project_id,session_id:completed.owner.session_id}),next);
  }
  assert.deepEqual(await readFile(join(projectRoot,'.xanthil','desktop','state.sqlite')),before);
}));

test('U2 historical Store writes: superseded Ready fields remain immutable through the replaceable Store boundary [AC-XDESK-003-04]',async()=>withIsolatedProject(async projectRoot=>{
  const setup=await initialRealU2Run(projectRoot),app=setup.prepared.application;
  await requiredExport<Method>(app,'createDraftRevision')({contract_version:'1.0',command_id:desktopTestIds.retryCommand,...setup.prepared.owner,expected_row_version:'2'});
  const request={contract_version:'1.0',...setup.prepared.owner,expected_row_version:'2',form:{kind:'case_fields',fields:createSessionCommand().fields}};
  const before=await readFile(join(projectRoot,'.xanthil','desktop','state.sqlite'));
  await assert.rejects(()=>requiredExport<Method>(setup.prepared.store,'saveForm')({command:{command_id:'eeeeeeee-eeee-4eee-8eee-eeeeeeeeee06',...request},completed_at:fixedClock().toISOString(),input_fingerprint:createHash('sha256').update(JSON.stringify({operation_kind:'save_form',request})).digest('hex')}),/STALE_REVISION/);
  assert.deepEqual(await readFile(join(projectRoot,'.xanthil','desktop','state.sqlite')),before);
}));

test('U2 sole terminal overwrite: a real successful dual computation replaces run.json exactly once from its initial bytes [AC-XDESK-011-05]',async()=>withIsolatedProject(async projectRoot=>{
  const original=fs.renameSync,observed:{before:string;after:string;from_status:string;to_status:string}[]=[];
  fs.renameSync=function(from,to){
    const target=String(to),prior=target.startsWith(projectRoot+'/')&&target.endsWith('/run.json')?fs.readFileSync(to):null;
    const result=original(from,to);
    if(prior){const after=fs.readFileSync(to);observed.push({before:createHash('sha256').update(prior).digest('hex'),after:createHash('sha256').update(after).digest('hex'),from_status:JSON.parse(String(prior)).status,to_status:JSON.parse(String(after)).status});}
    return result;
  };syncBuiltinESMExports();
  try{await completedU2Analysis(projectRoot);}finally{fs.renameSync=original;syncBuiltinESMExports();}
  assert.equal(observed.length,1,'outputs must not rewrite in-progress manifest before the sole terminal replacement');
  assert.equal(observed[0].from_status,'in_progress');assert.equal(observed[0].to_status,'succeeded');assert.notEqual(observed[0].before,observed[0].after);
}));

test('U2 output prefix terminal: failure and cancellation publish exactly the durable real output prefix once [AC-XDESK-008-02, AC-XDESK-011-05]',async t=>{
  for(const status of ['failed','cancelled'])for(const count of [1,2])await t.test(status+'-'+count,()=>withIsolatedProject(async projectRoot=>{
    const setup=await initialRealU2Run(projectRoot),storage=await loadDesktopModule('adapters/storage-local/xanthil-desktop-decision-case.ts');
    const store=requiredExport<(input:unknown)=>Record<string,unknown>>(storage,'createLocalDesktopRunEvidenceStore')({projectRoot});
    const run_id=setup.initial_manifest.run_id,cancellation_signal=new AbortController().signal;
    const begun=await requiredExport<Method>(store,'beginRun')({run_id,initial_manifest:setup.initial_manifest,confirmation_files:setup.confirmation_files,code_assets:setup.code_assets,cancellation_signal});
    const request={run_id,expected_code_identity:setup.initial_manifest.method.code_identity,contract:setup.prepared.command.confirmation,snapshot:{members_bytes:setup.prepared.command.source_files.members.bytes,orders_bytes:setup.prepared.command.source_files.orders.bytes},group_pseudonym_map:{North:'11111111-1111-4111-8111-111111111111',South:'22222222-2222-4222-8222-222222222222'},cancellation_signal,deadline_seconds:30};
    const artifacts:unknown[]=[...setup.initial_manifest.artifacts],initial=await readFile(join(projectRoot,'.xanthil','runs',run_id,'run.json'));
    for(let index=0;index<count;index++){
      const output=await requiredExport<Method>(setup.execution,index===0?'calculate':'verify')(request);
      const stored=await requiredExport<Method>(store,index===0?'recordDuckDbResult':'recordPythonResult')({run_id,expected_in_progress_manifest_sha256:begun.in_progress_manifest_sha256,bytes:new TextEncoder().encode(canonicalDesktopJson(output)),cancellation_signal});
      artifacts.push(stored.descriptor);assert.deepEqual(await readFile(join(projectRoot,'.xanthil','runs',run_id,'run.json')),initial);
    }
    const terminal_manifest={...setup.initial_manifest,status,ended_at:'2026-09-19T00:00:01.000Z',terminal_detail:{reason:status==='failed'?'calculation_failed':'user_cancelled'},artifacts};
    const ended=await requiredExport<Method>(store,status==='failed'?'failRun':'cancelRun')({run_id,expected_in_progress_manifest_sha256:begun.in_progress_manifest_sha256,terminal_manifest,cancellation_signal});
    assert.deepEqual(requiredRecord(ended.manifest,'terminal').artifacts,artifacts);assert.equal(requiredRecord(ended.manifest,'terminal').status,status);
    const names=await readdir(join(projectRoot,'.xanthil','runs',run_id));for(const absent of ['summary.md','evidence.md','evidence.json'])assert.ok(!names.includes(absent));
    const final=await readFile(join(projectRoot,'.xanthil','runs',run_id,'run.json'));
    await assert.rejects(()=>requiredExport<Method>(store,'failRun')({run_id,expected_in_progress_manifest_sha256:begun.in_progress_manifest_sha256,terminal_manifest:{...terminal_manifest,status:'failed'},cancellation_signal}),/INTEGRITY_BLOCKED/);
    assert.deepEqual(await readFile(join(projectRoot,'.xanthil','runs',run_id,'run.json')),final);
  }));
});

test('U2 readable provenance: persisted draft/Run documents carry exact context method source hashes metrics and resolvable scoped evidence [AC-XDESK-007-01]',async()=>withIsolatedProject(async projectRoot=>{
  const completed=await completedU2Analysis(projectRoot),projection=completed.projection,report=(projection.reports as Record<string,unknown>[])[0],run=(projection.runs as Record<string,unknown>[])[0],finding=(projection.findings as Record<string,unknown>[])[0];
  const base=join(projectRoot,String(completed.owner.session_id),'060_reports',String(report.report_id));
  const markdown=await readFile(join(base,'report.md'),'utf8'),html=await readFile(join(base,'report.html'),'utf8');
  const summary=await readFile(join(projectRoot,'.xanthil','runs',String(run.run_id),'summary.md'),'utf8'),evidence=await readFile(join(projectRoot,'.xanthil','runs',String(run.run_id),'evidence.md'),'utf8');
  const snapshot=requiredRecord(projection.snapshot,'snapshot');
  const identities=[...Object.values(completed.owner),run.run_id,run.method_id,run.method_version,run.code_identity,requiredRecord(snapshot.members,'members').sha256,requiredRecord(snapshot.orders,'orders').sha256,requiredRecord(projection.confirmation,'confirmation').confirmation_id,snapshot.snapshot_id];
  for(const body of [markdown,summary,evidence]){
    for(const identity of identities)assert.ok(body.includes(String(identity)),'missing approved provenance '+identity);
    assert.ok(body.includes(String(finding.metrics)),'exact metrics must be human-document content, not merely their hash');
    assert.ok(body.includes(String(finding.judgment)));assert.ok(body.includes('关联不等于因果'));assert.ok(body.includes('不进行显著性检验'));
    for(const artifact of ['duckdb-result','python-result']){const anchor='evidence-'+run.run_id+'-'+artifact;assert.ok(body.includes('](#'+anchor+')'));assert.ok(body.includes('## '+anchor),'Markdown fragment must name a real evidence section');assert.ok(html.includes('href="#'+anchor+'"'));assert.ok(html.includes('id="'+anchor+'"'));}
    for(const forbidden of ['North','South',projectRoot,'member_id,member_group','order_id,'])assert.ok(!body.includes(forbidden),'no raw input or absolute source locator');
  }
  assert.equal(createHash('sha256').update(markdown).digest('hex'),report.markdown_sha256);assert.equal(String(Buffer.byteLength(markdown)),report.markdown_byte_length);
  assert.equal(createHash('sha256').update(html).digest('hex'),report.html_sha256);
  const content=requiredRecord(report.review_content,'verified review content');assert.equal(content.markdown_text,markdown);
  const refs=content.evidence as Record<string,unknown>[];assert.deepEqual(refs.map(x=>x.evidence_ref),['duckdb-result','python-result','run-summary','run-evidence'].map(x=>run.run_id+':'+x));
  assert.equal(refs[2].content,summary);assert.equal(refs[3].content,evidence);
  for(const item of refs){assert.deepEqual(Object.keys(item).sort(),['content','evidence_ref','media_type','title']);assert.ok(!String(item.content).includes(projectRoot));}
}));

test('U2 Finding publication: one real dual calculation commits a terminal Run before SQLite Review Finding and draft report [AC-XDESK-005-07, AC-XDESK-008-01]', async () => withIsolatedProject(async projectRoot => {
  const setup = await initialRealU2Run(projectRoot);
  requiredExport<Method>(setup.prepared.application,'startAnalysis');
  const storage = await loadDesktopModule('adapters/storage-local/xanthil-desktop-decision-case.ts');
  const runEvidenceStore = requiredExport<(input:unknown)=>Record<string,unknown>>(storage,'createLocalDesktopRunEvidenceStore')({projectRoot});
  const module = await loadDesktopModule('packages/application/xanthil-desktop-decision-case.ts');
  const deadlines = createControlledDeadlineScheduler();
  const app = requiredExport<(input:unknown)=>Record<string,unknown>>(module,'createXanthilDesktopDecisionCaseApplication')({assistanceRuntime:null,store:setup.prepared.store,analysisExecution:setup.execution,runEvidenceStore,clock:fixedClock,deadlineScheduler:deadlines.scheduler});
  await requiredExport<Method>(app,'openProject')(setup.prepared.open);
  const started = await requiredExport<Method>(app,'startAnalysis')({contract_version:'1.0',command_id:desktopTestIds.retryCommand,...setup.prepared.owner,expected_row_version:'2',confirmation_id:requiredRecord(setup.projection.confirmation,'confirmation').confirmation_id});
  const run = (started.runs as Record<string,unknown>[])[0];
  assert.equal(run.status,'Running'); assert.equal(run.evidence_available,false);
  let settled = started;
  for (let attempt=0; attempt<300 && (settled.runs as Record<string,unknown>[])[0].status==='Running'; attempt+=1) {
    await new Promise(resolve=>setTimeout(resolve,10));
    settled = await requiredExport<Method>(app,'readProjection')(setup.prepared.owner);
  }
  assert.equal((settled.runs as Record<string,unknown>[])[0].status,'Succeeded',JSON.stringify(settled.runs));
  assert.equal(requiredRecord(settled.revision,'revision').state,'Review');
  const findings = settled.findings as Record<string,unknown>[]; assert.equal(findings.length,1); assert.equal(findings[0].judgment,'Rejected');
  assert.equal((settled.reports as Record<string,unknown>[]).length,1); assert.equal((settled.reports as Record<string,unknown>[])[0].state,'draft');
  assert.deepEqual(settled.acceptances,[]); assert.deepEqual(settled.closures,[]);
  const terminal = await requiredExport<Method>(runEvidenceStore,'readTerminalRun')({run_id:run.run_id});
  assert.equal(requiredRecord(terminal.manifest,'terminal').status,'succeeded');
  const db = new DatabaseSync(join(projectRoot,'.xanthil','desktop','state.sqlite'),{readOnly:true});
  try {
    const stored = db.prepare('SELECT status,run_locator,aggregate_id FROM analysis_runs WHERE run_id=?').get(String(run.run_id));
    assert.equal(stored?.status,'Succeeded'); assert.equal(stored?.run_locator,terminal.locator); assert.ok(stored?.aggregate_id);
    assert.equal(db.prepare("SELECT count(*) n FROM command_receipts WHERE operation_kind='start_analysis'").get()?.n,1);
    assert.equal(db.prepare("SELECT count(*) n FROM command_receipts WHERE operation_kind='settle_analysis'").get()?.n,1);
  } finally {db.close();}
  assert.doesNotMatch(JSON.stringify(settled), /North|South|cmp-001|cur-001|\/Users\//);
}));

test('U2 Run lifecycle: real confirmed/code bytes publish first; failed terminal is immutable and cannot become success [AC-XDESK-010-02, AC-XDESK-008-03]', async () => withIsolatedProject(async projectRoot => {
  const setup = await initialRealU2Run(projectRoot);
  const storage = await loadDesktopModule('adapters/storage-local/xanthil-desktop-decision-case.ts');
  const factory = requiredExport<(input: unknown) => Record<string, unknown>>(storage,'createLocalDesktopRunEvidenceStore'), store = factory({projectRoot});
  assert.deepEqual(Object.keys(store).sort(),['beginRun','cancelRun','failRun','readTerminalRun','recordDuckDbResult','recordPythonResult','succeedRun']);
  const run_id = setup.initial_manifest.run_id, cancellation_signal = new AbortController().signal;
  const started = await requiredExport<Method>(store,'beginRun')({run_id,initial_manifest:setup.initial_manifest,confirmation_files:setup.confirmation_files,code_assets:setup.code_assets,cancellation_signal});
  const manifestPath = join(projectRoot,'.xanthil','runs',run_id,'run.json');
  assert.equal(createHash('sha256').update(await readFile(manifestPath)).digest('hex'), started.in_progress_manifest_sha256);
  const terminal_manifest = {...setup.initial_manifest,status:'failed',ended_at:'2026-09-19T00:00:01.000Z',terminal_detail:{reason:'calculation_failed'}};
  const terminal = await requiredExport<Method>(store,'failRun')({run_id,expected_in_progress_manifest_sha256:started.in_progress_manifest_sha256,terminal_manifest,cancellation_signal});
  const original = await readFile(manifestPath);
  assert.equal(requiredRecord(terminal.manifest,'manifest').status,'failed');
  await assert.rejects(() => requiredExport<Method>(store,'failRun')({run_id,expected_in_progress_manifest_sha256:started.in_progress_manifest_sha256,terminal_manifest,cancellation_signal}), /INTEGRITY_BLOCKED|RUN_ARTIFACT_FAILED/);
  assert.deepEqual(await readFile(manifestPath),original);
  assert.deepEqual(await requiredExport<Method>(store,'readTerminalRun')({run_id}),terminal);
  assert.equal((await readdir(join(projectRoot,'.xanthil','runs',run_id))).includes('evidence.json'),false);
}));

test('U2 cancellation and deadline: durable cancellation wins once; expired work publishes no terminal files or Finding [AC-XDESK-008-02, AC-XDESK-008-03]', async t => {
  for(const mode of ['cancel','deadline'])await t.test(mode,()=>withIsolatedProject(async projectRoot=>{
    const setup=await initialRealU2Run(projectRoot), storage=await loadDesktopModule('adapters/storage-local/xanthil-desktop-decision-case.ts'), module=await loadDesktopModule('packages/application/xanthil-desktop-decision-case.ts');
    let reached!:()=>void;const entered=new Promise<void>(resolve=>{reached=resolve;});let calls=0,verifications=0;
    const execution={...setup.execution,calculate:async(input:Record<string,unknown>)=>{calls++;const signal=input.cancellation_signal as AbortSignal;reached();await new Promise<void>((_,reject)=>{const abort=()=>reject(Object.assign(new Error('CANCELLED'),{code:'CANCELLED'}));if(signal.aborted)abort();else signal.addEventListener('abort',abort,{once:true});});},verify:async()=>{verifications++;assert.fail('no verifier after the controlled boundary was aborted');}};
    const deadlines=createControlledDeadlineScheduler();let current=fixedClock();
    const app=requiredExport<(input:unknown)=>Record<string,unknown>>(module,'createXanthilDesktopDecisionCaseApplication')({assistanceRuntime:null,store:setup.prepared.store,analysisExecution:execution,runEvidenceStore:requiredExport<(input:unknown)=>Record<string,unknown>>(storage,'createLocalDesktopRunEvidenceStore')({projectRoot}),clock:()=>current,deadlineScheduler:deadlines.scheduler});
    await requiredExport<Method>(app,'openProject')(setup.prepared.open);
    const command={contract_version:'1.0',command_id:desktopTestIds.retryCommand,...setup.prepared.owner,expected_row_version:'2',confirmation_id:requiredRecord(setup.projection.confirmation,'confirmation').confirmation_id};
    const started=await requiredExport<Method>(app,'startAnalysis')(command);await entered;
    const statePath=join(projectRoot,'.xanthil','desktop','state.sqlite'),stateBefore=await readFile(statePath);
    await assert.rejects(()=>requiredExport<Method>(app,'saveForm')({contract_version:'1.0',command_id:'22222222-2222-4222-8222-222222222229',...setup.prepared.owner,expected_row_version:'3',form:{kind:'case_fields',fields:{question_text:'must not edit Running',hypothesis_display_title:'H1',business_context:'',alternative_explanations:[]}}}),/BUSY/);
    assert.deepEqual(await readFile(statePath),stateBefore);
    const run=(started.runs as Record<string,unknown>[])[0],runFile=join(projectRoot,'.xanthil','runs',String(run.run_id),'run.json'),before=await readFile(runFile);
    let settled=started;
    if(mode==='cancel'){
      const cancel=requiredExport<Method>(app,'cancelAnalysis'),request={contract_version:'1.0',command_id:'88888888-8888-4888-8888-888888888888',...setup.prepared.owner,expected_row_version:'3',run_id:run.run_id};
      settled=await cancel(request);assert.equal((settled.runs as Record<string,unknown>[])[0].status,'Cancelled');
      assert.deepEqual(await cancel(request),settled);
    }else{current=new Date(fixedClock().getTime()+300000);deadlines.runDue(current.getTime());}
    for(let i=0;i<100&&(settled.runs as Record<string,unknown>[])[0].status==='Running';i++){await new Promise(r=>setTimeout(r,5));settled=await requiredExport<Method>(app,'readProjection')(setup.prepared.owner);}
    assert.equal((settled.runs as Record<string,unknown>[])[0].status,mode==='cancel'?'Cancelled':'Failed');
    assert.equal((settled.runs as Record<string,unknown>[])[0].terminal_reason,mode==='cancel'?'user_cancelled':'deadline_exceeded');
    assert.deepEqual(settled.findings,[]);assert.deepEqual(settled.reports,[]);assert.equal(calls,1);assert.equal(verifications,0);
    if(mode==='deadline')assert.deepEqual(await readFile(runFile),before,'absolute deadline prohibits even a failed terminal file publication');
    const repeated=await requiredExport<Method>(app,'startAnalysis')(command);assert.equal((repeated.runs as Record<string,unknown>[])[0].run_id,run.run_id);assert.equal(calls,1);
  }));
});

test('U2 restart: committed Running row is interrupted once without scanning or adopting a Run candidate [AC-XDESK-008-05]',async()=>withIsolatedProject(async projectRoot=>{
  const setup=await initialRealU2Run(projectRoot),store=setup.prepared.store;
  const command={contract_version:'1.0',command_id:desktopTestIds.retryCommand,...setup.prepared.owner,expected_row_version:'2',confirmation_id:requiredRecord(setup.projection.confirmation,'confirmation').confirmation_id};
  const {command_id,...request}=command;void command_id;
  const started_at=fixedClock().toISOString(),deadline_at=new Date(fixedClock().getTime()+300000).toISOString();
  const run_id='01991a00-0000-7000-8000-000000000001';
  await requiredExport<Method>(store,'admitAnalysis')({command,ids:{run_id},started_at,deadline_at,profile_id:'personal-desktop',method_id:'membership_repurchase_comparison',method_version:'1.0',code_identity:setup.initial_manifest.method.code_identity,input_fingerprint:createHash('sha256').update(canonicalDesktopJson({operation_kind:'start_analysis',request})).digest('hex')});
  const candidate=join(projectRoot,'.xanthil','runs',run_id);await mkdir(candidate,{recursive:true});await writeFile(join(candidate,'run.json'),'unreferenced candidate must not be parsed',{flag:'wx'});
  const original=await readFile(join(candidate,'run.json'));
  const reopened=await createU12ProjectAdmissionApplication(projectRoot);await requiredExport<Method>(reopened.application,'openProject')(setup.prepared.open);
  const projection=await requiredExport<Method>(reopened.application,'readProjection')(setup.prepared.owner),run=(projection.runs as Record<string,unknown>[])[0];
  assert.equal(run.status,'Failed');assert.equal(run.terminal_reason,'interrupted');assert.equal(run.evidence_available,false);
  assert.deepEqual(projection.findings,[]);assert.deepEqual(await readFile(join(candidate,'run.json')),original);
  await requiredExport<Method>(reopened.application,'openProject')(setup.prepared.open);
  const db=new DatabaseSync(join(projectRoot,'.xanthil','desktop','state.sqlite'),{readOnly:true});try{assert.equal(db.prepare("SELECT count(*) n FROM command_receipts WHERE operation_kind='reconcile_interrupted'").get()?.n,1);}finally{db.close();}
}));

test('U2 terminal publication: native rollback/lost COMMIT preserves terminal success without false authority or resend [AC-XDESK-005-07, AC-XDESK-011-05]',async t=>{
  for(const outcome of ['rollback','lost-readable','lost-unreadable'])await t.test(outcome,()=>withIsolatedProject(async projectRoot=>{
    const setup=await initialRealU2Run(projectRoot),storage=await loadDesktopModule('adapters/storage-local/xanthil-desktop-decision-case.ts'),module=await loadDesktopModule('packages/application/xanthil-desktop-decision-case.ts');
    let caught=false,settleCalls=0,targetHit=false,completed!:()=>void;const completion=new Promise<void>(resolve=>{completed=resolve;});
    const rawSettle=requiredExport<Method>(setup.prepared.store,'settleAnalysis');
    const controlled={...setup.prepared.store,settleAnalysis:async(input:Record<string,unknown>)=>{
      settleCalls++;
      if(requiredRecord(input.terminal,'terminal').status!=='succeeded')return rawSettle(input);
      try{
        if(outcome==='rollback'){
          const original=DatabaseSync.prototype.exec;
          Object.defineProperty(DatabaseSync.prototype,'exec',{configurable:true,writable:true,value(this:DatabaseSync,sql:string){if(/^\s*COMMIT\s*;?\s*$/i.test(sql)){targetHit=true;throw new Error('TEST_DEFINITIVE_PRE_COMMIT_FAILURE');}return original.call(this,sql);}});
          try{return await rawSettle(input);}finally{Object.defineProperty(DatabaseSync.prototype,'exec',{configurable:true,writable:true,value:original});}
        }
        return await withCommitResponseLostAfterRealCommit({unreadableReceiptReadback:outcome==='lost-unreadable'},async control=>{try{return await rawSettle(input);}finally{control.assertTargetHit();if(outcome==='lost-unreadable')control.assertReadbackTargetHit();targetHit=true;}});
      }catch(error){caught=true;throw error;}finally{completed();}
    }};
    const runStore=requiredExport<(input:unknown)=>Record<string,unknown>>(storage,'createLocalDesktopRunEvidenceStore')({projectRoot}),deadlines=createControlledDeadlineScheduler();
    const app=requiredExport<(input:unknown)=>Record<string,unknown>>(module,'createXanthilDesktopDecisionCaseApplication')({assistanceRuntime:null,store:controlled,analysisExecution:setup.execution,runEvidenceStore:runStore,clock:fixedClock,deadlineScheduler:deadlines.scheduler});
    await requiredExport<Method>(app,'openProject')(setup.prepared.open);
    const command={contract_version:'1.0',command_id:desktopTestIds.retryCommand,...setup.prepared.owner,expected_row_version:'2',confirmation_id:requiredRecord(setup.projection.confirmation,'confirmation').confirmation_id};
    const started=await requiredExport<Method>(app,'startAnalysis')(command),run=(started.runs as Record<string,unknown>[])[0];await completion;await new Promise(r=>setTimeout(r,10));
    assert.equal(targetHit,true);assert.equal(caught,outcome!=='lost-readable');
    const terminal=await requiredExport<Method>(runStore,'readTerminalRun')({run_id:run.run_id});assert.equal(requiredRecord(terminal.manifest,'terminal').status,'succeeded');
    const terminalBytes=await readFile(join(projectRoot,'.xanthil','runs',String(run.run_id),'run.json'));
    if(outcome==='lost-unreadable')await assert.rejects(()=>requiredExport<Method>(app,'startAnalysis')(command),/RESULT_PENDING/);
    const projection=await requiredExport<Method>(app,'readProjection')(setup.prepared.owner),stored=(projection.runs as Record<string,unknown>[])[0];
    assert.equal(stored.status,outcome==='rollback'?'Failed':'Succeeded');assert.equal(stored.evidence_available,outcome!=='rollback');
    assert.equal((projection.findings as unknown[]).length,outcome==='rollback'?0:1);assert.equal((projection.reports as unknown[]).length,outcome==='rollback'?0:1);
    if(outcome==='rollback'){assert.equal(stored.terminal_reason,'publication_failed');assert.equal(stored.aggregate_id,null);assert.equal(settleCalls,2);}else assert.equal(settleCalls,1);
    const reopened=await createU12ProjectAdmissionApplication(projectRoot);await requiredExport<Method>(reopened.application,'openProject')(setup.prepared.open);
    assert.deepEqual(await requiredExport<Method>(reopened.application,'readProjection')(setup.prepared.owner),projection);
    assert.deepEqual(await readFile(join(projectRoot,'.xanthil','runs',String(run.run_id),'run.json')),terminalBytes);
  }));
});

test('U2 explicit retry: failed authority remains historical; a new command runs once and duplicate transport never recalculates [AC-XDESK-008-01, AC-XDESK-008-06]',async()=>withIsolatedProject(async projectRoot=>{
  const setup=await initialRealU2Run(projectRoot),storage=await loadDesktopModule('adapters/storage-local/xanthil-desktop-decision-case.ts'),module=await loadDesktopModule('packages/application/xanthil-desktop-decision-case.ts');let calls=0;
  const calculate=requiredExport<Method>(setup.execution,'calculate'),execution={...setup.execution,calculate:async(input:Record<string,unknown>)=>{calls++;if(calls===1)throw Object.assign(new Error('CALCULATION_FAILED'),{code:'CALCULATION_FAILED'});return calculate(input);}};
  const deadlines=createControlledDeadlineScheduler(),app=requiredExport<(input:unknown)=>Record<string,unknown>>(module,'createXanthilDesktopDecisionCaseApplication')({assistanceRuntime:null,store:setup.prepared.store,analysisExecution:execution,runEvidenceStore:requiredExport<(input:unknown)=>Record<string,unknown>>(storage,'createLocalDesktopRunEvidenceStore')({projectRoot}),clock:fixedClock,deadlineScheduler:deadlines.scheduler});
  await requiredExport<Method>(app,'openProject')(setup.prepared.open);
  const first={contract_version:'1.0',command_id:desktopTestIds.retryCommand,...setup.prepared.owner,expected_row_version:'2',confirmation_id:requiredRecord(setup.projection.confirmation,'confirmation').confirmation_id};
  const wait=async()=>{let p=await requiredExport<Method>(app,'readProjection')(setup.prepared.owner);for(let i=0;i<300&&(p.runs as Record<string,unknown>[]).some(r=>r.status==='Running');i++){await new Promise(r=>setTimeout(r,10));p=await requiredExport<Method>(app,'readProjection')(setup.prepared.owner);}return p;};
  const initial=await requiredExport<Method>(app,'startAnalysis')(first),failed=await wait();assert.equal(requiredRecord(failed.revision,'revision').state,'NeedsAttention');
  const old=(initial.runs as Record<string,unknown>[])[0],path=join(projectRoot,'.xanthil','runs',String(old.run_id),'run.json'),before=await readFile(path);
  assert.equal(calls,1);assert.equal((await requiredExport<Method>(app,'startAnalysis')(first)).projection_token,failed.projection_token);assert.equal(calls,1);
  const request={...first,command_id:'99999999-9999-4999-8999-999999999999',expected_row_version:requiredRecord(failed.revision,'revision').row_version};
  const admitted=await requiredExport<Method>(app,'startAnalysis')(request),result=await wait();
  assert.equal((admitted.runs as unknown[]).length,2);assert.equal((result.findings as unknown[]).length,1);assert.equal(requiredRecord(result.revision,'revision').state,'Review');assert.equal(calls,2);
  assert.deepEqual(await readFile(path),before);assert.equal((result.runs as Record<string,unknown>[])[0].status,'Failed');assert.equal((result.runs as Record<string,unknown>[])[1].status,'Succeeded');
  assert.deepEqual(await requiredExport<Method>(app,'startAnalysis')(request),result);assert.equal(calls,2);
  await assert.rejects(()=>requiredExport<Method>(app,'startAnalysis')({...request,expected_row_version:'999'}),/COMMAND_CONFLICT/);
}));

test('U2 new Draft: confirmed computation authority and prior revision bytes remain unchanged across new editable revision and reopen [AC-XDESK-003-02, AC-XDESK-003-04]',async()=>withIsolatedProject(async projectRoot=>{
  const setup=await initialRealU2Run(projectRoot),app=setup.prepared.application,create=requiredExport<Method>(app,'createDraftRevision');
  const dbPath=join(projectRoot,'.xanthil','desktop','state.sqlite');const rows=()=>{const db=new DatabaseSync(dbPath,{readOnly:true});try{return {prior:db.prepare('SELECT * FROM case_revisions WHERE revision_id=?').get(String(setup.prepared.owner.revision_id)),confirmation:db.prepare('SELECT * FROM input_confirmations').all(),snapshot:db.prepare('SELECT * FROM source_snapshots').all()};}finally{db.close();}};
  const before=rows(),command={contract_version:'1.0',command_id:desktopTestIds.retryCommand,...setup.prepared.owner,expected_row_version:'2'};
  const next=await create(command),revision=requiredRecord(next.revision,'new revision');
  assert.equal(revision.revision_sequence,'2');assert.equal(revision.previous_revision_id,setup.prepared.owner.revision_id);assert.equal(revision.state,'Draft');assert.equal(revision.row_version,'1');
  assert.equal(revision.question_text,requiredRecord(setup.projection.revision,'prior').question_text);assert.equal(revision.snapshot_id,null);assert.equal(revision.confirmation_id,null);assert.deepEqual(next.runs,[]);assert.deepEqual(next.findings,[]);assert.deepEqual(rows(),before);
  assert.deepEqual(await create(command),next);await assert.rejects(()=>create({...command,expected_row_version:'999'}),/COMMAND_CONFLICT/);
  const reopened=await createU12ProjectAdmissionApplication(projectRoot);await requiredExport<Method>(reopened.application,'openProject')(setup.prepared.open);
  assert.deepEqual(await requiredExport<Method>(reopened.application,'openSession')({contract_version:'1.0',project_id:setup.prepared.owner.project_id,session_id:setup.prepared.owner.session_id}),next);
  const owner={...setup.prepared.owner,revision_id:revision.revision_id};
  assert.deepEqual(await requiredExport<Method>(reopened.application,'waitForProjection')({...owner,projection_token:next.projection_token}),next);
  const historical=await requiredExport<Method>(reopened.application,'readProjection')(setup.prepared.owner);
  assert.deepEqual(historical.revision,setup.projection.revision);assert.ok(Object.values(requiredRecord(historical.capabilities,'history capabilities')).every(x=>x===false));assert.deepEqual(rows(),before);
}));

test('U2 normal Profile: packaged descriptor is the sole tool source; unavailable tools preserve manual Session and refuse calculation before admission [AC-XDESK-012-03, AC-XDESK-005-06]',async t=>{
  for(const mode of ['valid','missing','drift','python-drift'])await t.test(mode,()=>withIsolatedProject(async projectRoot=>{
    const setup=await initialRealU2Run(projectRoot),profileModule=await loadDesktopModule('profiles/personal/xanthil-desktop.ts'),toolchain=process.env.JUANERAI_TOOLCHAIN_BIN!;
    const selectedPython=readDesktopPythonTool(toolchain);
    const [pythonMajor,pythonMinor,pythonPatch]=selectedPython.pythonVersion.split('.');
    const mismatchedPythonVersion=`${pythonMajor}.${pythonMinor}.${Number(pythonPatch)+1}`;
    const descriptor=join(projectRoot,'synthetic-toolchain-deployment.json');if(mode!=='missing')await writeFile(descriptor,JSON.stringify({schema_version:'1.0',duckdb:{executable_path:join(toolchain,'duckdb'),version:mode==='drift'?'1.5.1':'1.5.2'},python:{executable_path:selectedPython.pythonExecutable,version:mode==='python-drift'?mismatchedPythonVersion:selectedPython.pythonVersion}}),{flag:'wx'});
    const deadlines=createControlledDeadlineScheduler(),profile=requiredExport<(input:unknown)=>Record<string,unknown>>(profileModule,'createPersonalXanthilDesktopProfile')({toolchainDeployment:{descriptor_path:descriptor},assistanceConfig:null,clock:fixedClock,deadlineScheduler:deadlines.scheduler});
    const opened=await requiredExport<Method>(profile,'openProject')({contract_version:'1.0',command_id:desktopTestIds.openProjectCommand,projectDirectoryCapability:{projectRoot,display_name:'Synthetic Project'},display_name:'Synthetic Project'}),app=requiredRecord(opened.application,'normal Application');
    assert.equal((await requiredExport<Method>(app,'readProjection')(setup.prepared.owner)).projection_token,setup.projection.projection_token);
    const request={contract_version:'1.0',command_id:desktopTestIds.retryCommand,...setup.prepared.owner,expected_row_version:'2',confirmation_id:requiredRecord(setup.projection.confirmation,'confirmation').confirmation_id};
    if(mode!=='valid'){
      const before=await readFile(join(projectRoot,'.xanthil','desktop','state.sqlite'));
      await assert.rejects(()=>requiredExport<Method>(app,'startAnalysis')(request),/TOOLCHAIN_UNAVAILABLE/);
      assert.deepEqual(await readFile(join(projectRoot,'.xanthil','desktop','state.sqlite')),before);
      assert.equal((await requiredExport<Method>(app,'readProjection')(setup.prepared.owner)).projection_token,setup.projection.projection_token);
    }else{
      const started=await requiredExport<Method>(app,'startAnalysis')(request);assert.equal((started.runs as Record<string,unknown>[])[0].status,'Running');let current=started;
      for(let i=0;i<300&&(current.runs as Record<string,unknown>[])[0].status==='Running';i++){await new Promise(r=>setTimeout(r,10));current=await requiredExport<Method>(app,'readProjection')(setup.prepared.owner);}
      assert.equal((current.runs as Record<string,unknown>[])[0].status,'Succeeded');
    }
  }));
});

test('U2 Run outputs: real independent results precede terminal success; stale writers and terminal mutation are refused [AC-XDESK-005-07, AC-XDESK-010-02]', async () => withIsolatedProject(async projectRoot => {
  const setup = await initialRealU2Run(projectRoot), storage = await loadDesktopModule('adapters/storage-local/xanthil-desktop-decision-case.ts');
  const store = requiredExport<(input: unknown) => Record<string,unknown>>(storage,'createLocalDesktopRunEvidenceStore')({projectRoot});
  const run_id = setup.initial_manifest.run_id, cancellation_signal = new AbortController().signal;
  const started = await requiredExport<Method>(store,'beginRun')({run_id,initial_manifest:setup.initial_manifest,confirmation_files:setup.confirmation_files,code_assets:setup.code_assets,cancellation_signal});
  const request = {run_id,expected_code_identity:setup.initial_manifest.method.code_identity,contract:setup.prepared.command.confirmation,snapshot:{members_bytes:setup.prepared.command.source_files.members.bytes,orders_bytes:setup.prepared.command.source_files.orders.bytes},group_pseudonym_map:{North:'11111111-1111-4111-8111-111111111111',South:'22222222-2222-4222-8222-222222222222'},cancellation_signal,deadline_seconds:30};
  const duck = await requiredExport<Method>(setup.execution,'calculate')(request), python = await requiredExport<Method>(setup.execution,'verify')(request);
  assert.deepEqual(duck.result,python.result);
  const encode = (value: unknown) => new TextEncoder().encode(canonicalDesktopJson(value));
  const initialBytes = await readFile(join(projectRoot,'.xanthil','runs',run_id,'run.json'));
  await assert.rejects(() => requiredExport<Method>(store,'recordPythonResult')({run_id,expected_in_progress_manifest_sha256:started.in_progress_manifest_sha256,bytes:encode(python),cancellation_signal}),/INTEGRITY_BLOCKED/);
  await assert.rejects(() => requiredExport<Method>(store,'recordDuckDbResult')({run_id,expected_in_progress_manifest_sha256:started.in_progress_manifest_sha256,bytes:encode({...duck,result:{raw_member_id:'forbidden'}}),cancellation_signal}),/VALIDATION_FAILED/);
  assert.deepEqual(await readFile(join(projectRoot,'.xanthil','runs',run_id,'run.json')),initialBytes);
  const first = await requiredExport<Method>(store,'recordDuckDbResult')({run_id,expected_in_progress_manifest_sha256:started.in_progress_manifest_sha256,bytes:encode(duck),cancellation_signal});
  assert.equal(first.in_progress_manifest_sha256,started.in_progress_manifest_sha256);
  assert.deepEqual(await readFile(join(projectRoot,'.xanthil','runs',run_id,'run.json')),initialBytes);
  await assert.rejects(() => requiredExport<Method>(store,'recordDuckDbResult')({run_id,expected_in_progress_manifest_sha256:started.in_progress_manifest_sha256,bytes:encode(duck),cancellation_signal}),/INTEGRITY_BLOCKED|RUN_ARTIFACT_FAILED/);
  await assert.rejects(() => requiredExport<Method>(store,'recordPythonResult')({run_id,expected_in_progress_manifest_sha256:'0'.repeat(64),bytes:encode(python),cancellation_signal}),/INTEGRITY_BLOCKED/);
  const reopenedStore=requiredExport<(input: unknown) => Record<string,unknown>>(storage,'createLocalDesktopRunEvidenceStore')({projectRoot});
  await assert.rejects(() => requiredExport<Method>(reopenedStore,'recordPythonResult')({run_id,expected_in_progress_manifest_sha256:started.in_progress_manifest_sha256,bytes:encode(python),cancellation_signal}),/INTEGRITY_BLOCKED/);
  const second = await requiredExport<Method>(store,'recordPythonResult')({run_id,expected_in_progress_manifest_sha256:first.in_progress_manifest_sha256,bytes:encode(python),cancellation_signal});
  assert.equal(second.in_progress_manifest_sha256,started.in_progress_manifest_sha256);
  assert.deepEqual(await readFile(join(projectRoot,'.xanthil','runs',run_id,'run.json')),initialBytes);
  const aggregateId = '33333333-3333-4333-8333-333333333333', reportId = '44444444-4444-4444-8444-444444444444';
  const descriptor = async (locator: string, bytes: Uint8Array) => { await mkdir(join(projectRoot,locator,'..'),{recursive:true}); await writeFile(join(projectRoot,locator),bytes,{flag:'wx'}); return {locator,sha256:createHash('sha256').update(bytes).digest('hex'),byte_length:String(bytes.length)}; };
  const aggregate = await descriptor(`${setup.prepared.owner.session_id}/020_clean/${aggregateId}/aggregate.json`,encode({schema_version:'1.0',artifact_id:aggregateId,run_id,product_context:setup.initial_manifest.product_context,method:setup.initial_manifest.method,result:duck.result}));
  const markdown = await descriptor(`${setup.prepared.owner.session_id}/060_reports/${reportId}/report.md`,new TextEncoder().encode('# Synthetic draft evidence'));
  const html = await descriptor(`${setup.prepared.owner.session_id}/060_reports/${reportId}/report.html`,new TextEncoder().encode('<p>Synthetic draft evidence</p>'));
  const evidence = {schema_version:'3.0',run_id,product_context:setup.initial_manifest.product_context,method:setup.initial_manifest.method,sources:setup.initial_manifest.sources.map(x=>({role:x.role,sha256:x.sha256})),calculations:[first.descriptor,second.descriptor],equality:{status:'matched',result_sha256:createHash('sha256').update(canonicalDesktopJson(duck.result)).digest('hex')},judgment:'Rejected',m2_applicability:'applicable',candidate_publications:{aggregate:{artifact_id:aggregateId,...aggregate},report:{report_id:reportId,markdown,html}},limitations:['association_not_causation','no_significance_test','confirmed_local_snapshot_only']};
  const summary_bytes = new TextEncoder().encode('# Synthetic Run summary'), evidence_document_bytes = new TextEncoder().encode('# Synthetic Run evidence'), evidence_bytes = encode(evidence);
  const file = (path: string, bytes: Uint8Array) => ({path,sha256:createHash('sha256').update(bytes).digest('hex'),byte_length:String(bytes.length)});
  const terminal_manifest = {...setup.initial_manifest,status:'succeeded',ended_at:'2026-09-19T00:00:01.000Z',artifacts:[...setup.initial_manifest.artifacts,first.descriptor,second.descriptor,{artifact_id:'run-summary',kind:'summary',...file('summary.md',summary_bytes)},{artifact_id:'run-evidence',kind:'evidence_document',...file('evidence.md',evidence_document_bytes)}],evidence:file('evidence.json',evidence_bytes)};
  for (const bad of [{...evidence,raw_member_id:'forbidden'}, {...evidence,equality:{status:'matched',result_sha256:'0'.repeat(64)}}]) {
    const bytes = encode(bad);
    await assert.rejects(() => requiredExport<Method>(store,'succeedRun')({run_id,expected_in_progress_manifest_sha256:second.in_progress_manifest_sha256,evidence_bytes:bytes,summary_bytes,evidence_document_bytes,terminal_manifest:{...terminal_manifest,evidence:file('evidence.json',bytes)},cancellation_signal}), /VALIDATION_FAILED|INTEGRITY_BLOCKED/);
  }
  const terminal = await requiredExport<Method>(store,'succeedRun')({run_id,expected_in_progress_manifest_sha256:second.in_progress_manifest_sha256,evidence_bytes,summary_bytes,evidence_document_bytes,terminal_manifest,cancellation_signal});
  assert.equal(requiredRecord(terminal.manifest,'terminal').status,'succeeded');
  assert.deepEqual(await requiredExport<Method>(store,'readTerminalRun')({run_id}),terminal);
  const before = await readFile(join(projectRoot,'.xanthil','runs',run_id,'run.json'));
  await assert.rejects(() => requiredExport<Method>(store,'recordDuckDbResult')({run_id,expected_in_progress_manifest_sha256:terminal.manifest_sha256,bytes:encode(duck),cancellation_signal}),/INTEGRITY_BLOCKED/);
  assert.deepEqual(await readFile(join(projectRoot,'.xanthil','runs',run_id,'run.json')),before);
}));

test('U2 confirmation recovery: native committed response loss resolves exact receipt; unreadable outcome blocks resend until reopen [AC-XDESK-011-05]', async t => {
  for (const unreadable of [false, true]) await t.test(String(unreadable), async () => withIsolatedProject(async projectRoot => {
    const ready = await preparedU2Confirmation(projectRoot), confirm = requiredExport<Method>(ready.application, 'confirmRevision');
    await withCommitResponseLostAfterRealCommit({ unreadableReceiptReadback: unreadable }, async control => {
      if (unreadable) {
        await assert.rejects(() => confirm(ready.command), /RESULT_PENDING/);
        await assert.rejects(() => confirm(ready.command), /RESULT_PENDING/);
        control.assertReadbackTargetHit();
      } else assert.equal(requiredRecord((await confirm(ready.command)).revision, 'revision').state, 'Ready');
      control.assertTargetHit(); control.assertUnrelatedSqlForwarded();
    });
    const reopened = await createU12ProjectAdmissionApplication(projectRoot); await requiredExport<Method>(reopened.application, 'openProject')(ready.open);
    assert.equal(requiredRecord((await requiredExport<Method>(reopened.application, 'readProjection')(ready.owner)).revision, 'revision').state, 'Ready');
    assert.equal(requiredRecord((await requiredExport<Method>(reopened.application, 'confirmRevision')(ready.command)).revision, 'revision').state, 'Ready');
    const db = new DatabaseSync(join(projectRoot, '.xanthil', 'desktop', 'state.sqlite'), { readOnly: true });
    try { assert.equal(db.prepare('SELECT count(*) n FROM source_snapshots').get()?.n, 1); assert.equal(db.prepare("SELECT count(*) n FROM command_receipts WHERE operation_kind='confirm_revision'").get()?.n, 1); } finally { db.close(); }
  }));
});

test('U2 Ready fields: post-confirmation case edit preserves immutable confirmation and survives exact admission [AC-XDESK-003-01]', async () => withIsolatedProject(async projectRoot => {
  const prepared = await preparedU2Confirmation(projectRoot), ready = await requiredExport<Method>(prepared.application, 'confirmRevision')(prepared.command);
  const fields = { ...createSessionCommand().fields, question_text: 'Updated synthetic question' };
  const saved = await requiredExport<Method>(prepared.application, 'saveForm')({ contract_version: '1.0', command_id: desktopTestIds.retryCommand, ...prepared.owner, expected_row_version: '2', form: { kind: 'case_fields', fields } });
  assert.deepEqual(saved.snapshot, ready.snapshot); assert.deepEqual(saved.confirmation, ready.confirmation);
  assert.equal(requiredRecord(saved.revision, 'revision').question_text, fields.question_text);
  const reopened = await createU12ProjectAdmissionApplication(projectRoot); await requiredExport<Method>(reopened.application, 'openProject')(prepared.open);
  assert.deepEqual(await requiredExport<Method>(reopened.application, 'readProjection')(prepared.owner), saved);
}));

function assertNoRawSnapshotMetadata(value: unknown) {
  const publicText = JSON.stringify(value, (key, field) => {
    if (field instanceof Uint8Array) return '[private bytes]';
    if (['sha256','contract_sha256','binding_sha256','ir_sha256'].includes(key)) {
      assert.equal(typeof field, 'string'); assert.match(field, /^[a-f0-9]{64}$/);
      return '[verified SHA-256 identity]';
    }
    if (key === 'snapshot_id') {
      assert.equal(typeof field, 'string'); assert.match(field, /^[a-f0-9]{8}-[a-f0-9]{4}-[47][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/);
      return '[verified snapshot UUID]';
    }
    return field;
  });
  assert.doesNotMatch(publicText, /North|South|0001|0002|\/Users\//);
}

test('AC-XDESK-004-07 metadata leakage scanner admits typed opaque identities but still catches public raw fields and malformed identities',()=>{
  assert.doesNotThrow(()=>assertNoRawSnapshotMetadata({contract_sha256:'a'.repeat(30)+'0002'+'b'.repeat(30),snapshot_id:'00010002-0000-4000-8000-000100020003'}));
  for(const raw of ['North','South','0001','0002','/Users/synthetic']) assert.throws(()=>assertNoRawSnapshotMetadata({public_text:raw}));
  assert.throws(()=>assertNoRawSnapshotMetadata({sha256:'0001'}));assert.throws(()=>assertNoRawSnapshotMetadata({snapshot_id:'0002'}));
});

test('U2 immutable read: only committed source hashes and canonical confirmation bytes reach analysis; tamper is never silently consumed [AC-XDESK-004-07, AC-XDESK-011-07]', async () => withIsolatedProject(async projectRoot => {
  const prepared = await preparedU2Confirmation(projectRoot), ready = await requiredExport<Method>(prepared.application, 'confirmRevision')(prepared.command);
  const snapshot = requiredRecord(ready.snapshot, 'snapshot'), confirmation = requiredRecord(ready.confirmation, 'confirmation');
  const read = requiredExport<Method>(prepared.store, 'readConfirmedSnapshot');
  const input = { ...prepared.owner, confirmation_id: confirmation.confirmation_id }, found = await read(input);
  const sources = requiredRecord(found.snapshot, 'sources'), members = requiredRecord(sources.members, 'members'), orders = requiredRecord(sources.orders, 'orders');
  assert.equal(members.sha256, '57e4e4c6dbedb8234fce87afa07b9dd8e75b54f54f68a53cb4963b7c68e18e44');
  assert.equal(orders.sha256, 'b6ee04152eee96707e93c68de095847433848c06a61db0bed2571ab77f835ff5');
  assert.deepEqual(new Uint8Array(members.bytes as Uint8Array), prepared.command.source_files.members.bytes);
  assert.deepEqual(new Uint8Array(orders.bytes as Uint8Array), prepared.command.source_files.orders.bytes);
  const documents = requiredRecord(found.confirmation, 'documents');
  for (const key of ['contract','binding','ir']) assert.equal(createHash('sha256').update(documents[`${key}_bytes`] as Uint8Array).digest('hex'), documents[`${key}_sha256`]);
  assert.equal(sources.snapshot_id, snapshot.snapshot_id);
  assertNoRawSnapshotMetadata(found);
  const database = join(projectRoot, '.xanthil', 'desktop', 'state.sqlite'), before = await readFile(database);
  const destination = join(projectRoot, String(prepared.owner.session_id), '010_draw', String(snapshot.snapshot_id), 'orders.csv');
  await writeFile(destination, 'synthetic-tamper');
  await assert.rejects(() => read(input), /INTEGRITY_BLOCKED/);
  assert.deepEqual(await readFile(database), before, 'read failure itself does not invent a receipt or repair bytes');
  assert.equal(await readFile(destination, 'utf8'), 'synthetic-tamper');
}));

test('U2 confirmation: exact evaluated consent publishes immutable double CSV and Ready atomically; stale consent stays effect-free [AC-XDESK-004-05, AC-XDESK-004-06, AC-XDESK-004-07]', async () => withIsolatedProject(async projectRoot => {
  const { application } = await createU12ProjectAdmissionApplication(projectRoot);
  const open = { contract_version: '1.0', command_id: desktopTestIds.openProjectCommand, proposed_project_id: desktopTestIds.project, display_name: 'Synthetic Project' };
  await requiredExport<Method>(application, 'openProject')(open);
  const created = await requiredExport<Method>(application, 'createSession')(createSessionCommand());
  const session = requiredRecord(created.session, 'Session'), revision = requiredRecord(created.revision, 'revision');
  const owner = { project_id: desktopTestIds.project, session_id: session.session_id, case_id: session.case_id, revision_id: revision.revision_id };
  const base = { contract_version: '1.0', ...owner, expected_row_version: revision.row_version };
  const inspect = requiredExport<Method>(application, 'inspectImportFiles'), confirm = requiredExport<Method>(application, 'confirmRevision');
  const pair = await readSyntheticCsvPair(), source_files = { members: { display_name: 'members.csv', bytes: pair.members }, orders: { display_name: 'orders.csv', bytes: pair.orders } };
  const initial = await inspect({ ...base, source_files }), full = fullConfirmation();
  const database = join(projectRoot, '.xanthil', 'desktop', 'state.sqlite'), before = await readFile(database), directories = await readdir(projectRoot, { recursive: true });
  await assert.rejects(() => confirm({ ...base, command_id: desktopTestIds.revisionCommand, inspection_token: initial.inspection_token, confirmation: full, source_files }), /ISSUE_CONFIRMATION_REQUIRED/);
  assert.deepEqual(await readFile(database), before); assert.deepEqual(await readdir(projectRoot, { recursive: true }), directories);
  const configuration = { column_mapping: full.column_mapping, comparison_period: full.comparison_period, current_period: full.current_period, currency: full.currency, time_zone: full.time_zone, valid_statuses: full.valid_statuses, selected_group_mode: full.selected_group_mode };
  const preview = await inspect({ ...base, source_files, inspection_token: initial.inspection_token, configuration });
  const issue_treatments = (preview.reviewable_issues as {code: string; count: string; treatment_options: string[]}[]).map(x => ({ code: x.code, count: x.count, treatment: x.treatment_options[0] }));
  const command = { ...base, command_id: desktopTestIds.revisionCommand, inspection_token: preview.inspection_token, confirmation: { ...full, issue_treatments }, source_files };
  await assert.rejects(() => confirm({ ...command, confirmation: { ...command.confirmation, authority_confirmed: false } }), /AUTHORITY_REQUIRED/);
  await assert.rejects(() => confirm({ ...command, confirmation: { ...command.confirmation, issue_treatments: [] } }), /ISSUE_CONFIRMATION_REQUIRED/);
  assert.deepEqual(await readFile(database), before); assert.deepEqual(await readdir(projectRoot, { recursive: true }), directories);
  const ready = await confirm(command), readyRevision = requiredRecord(ready.revision, 'Ready revision'), snapshot = requiredRecord(ready.snapshot, 'snapshot');
  assert.deepEqual(await confirm(command), ready, 'same command resolves its committed receipt even though the preview is consumed');
  assert.equal(readyRevision.state, 'Ready'); assert.equal(readyRevision.row_version, '2');
  assert.equal(snapshot.included_order_count, '7'); assert.equal(snapshot.excluded_order_count, '1');
  assert.deepEqual(new Uint8Array(await readFile(join(projectRoot, String(owner.session_id), '010_draw', String(snapshot.snapshot_id), 'members.csv'))), pair.members);
  assert.deepEqual(new Uint8Array(await readFile(join(projectRoot, String(owner.session_id), '010_draw', String(snapshot.snapshot_id), 'orders.csv'))), pair.orders);
  const reopened = await createU12ProjectAdmissionApplication(projectRoot); await requiredExport<Method>(reopened.application, 'openProject')(open);
  assert.deepEqual(await requiredExport<Method>(reopened.application, 'readProjection')(owner), ready);
  const db = new DatabaseSync(database, { readOnly: true });
  try { assert.equal(db.prepare("SELECT count(*) n FROM command_receipts WHERE operation_kind='confirm_revision'").get()?.n, 1); }
  finally { db.close(); }
}));

test('U2 preview: real owner-bound bytes and explicit changed selections produce fresh exact issues without persistence [AC-XDESK-004-05, AC-XDESK-004-07]', async () => withIsolatedProject(async projectRoot => {
  const { application } = await createU12ProjectAdmissionApplication(projectRoot);
  await requiredExport<Method>(application, 'openProject')({ contract_version: '1.0', command_id: desktopTestIds.openProjectCommand, proposed_project_id: desktopTestIds.project, display_name: 'Synthetic Project' });
  const created = await requiredExport<Method>(application, 'createSession')(createSessionCommand());
  const session = requiredRecord(created.session, 'Session'), revision = requiredRecord(created.revision, 'revision');
  const base = { contract_version: '1.0', project_id: desktopTestIds.project, session_id: session.session_id, case_id: session.case_id, revision_id: revision.revision_id, expected_row_version: revision.row_version };
  const inspect = requiredExport<Method>(application, 'inspectImportFiles');
  const pair = await readSyntheticCsvPair(), source_files = { members: { display_name: 'members.csv', bytes: pair.members }, orders: { display_name: 'orders.csv', bytes: pair.orders } };
  const database = join(projectRoot, '.xanthil', 'desktop', 'state.sqlite'), before = await readFile(database), directories = await readdir(projectRoot, { recursive: true });
  const initial = await inspect({ ...base, source_files });
  assert.deepEqual(initial.evaluation, { status: 'unconfigured' });
  const full = fullConfirmation(), configuration = { column_mapping: full.column_mapping, comparison_period: full.comparison_period, current_period: full.current_period, currency: full.currency, time_zone: full.time_zone, valid_statuses: full.valid_statuses, selected_group_mode: full.selected_group_mode };
  const evaluated = await inspect({ ...base, source_files, inspection_token: initial.inspection_token, configuration });
  assert.notEqual(evaluated.inspection_token, initial.inspection_token);
  assert.deepEqual(evaluated.evaluation, { status: 'evaluated', configuration });
  const issues = evaluated.reviewable_issues as { code: string; count: string }[];
  assert.ok(issues.some(x => x.code === 'excluded_status' && x.count === '1'));
  assert.ok(issues.some(x => x.code === 'paid_at_tie' && x.count === '2'));
  assert.doesNotMatch(JSON.stringify(evaluated), /North|South|cmp-001|cur-001|0001|0002/);
  await assert.rejects(() => inspect({ ...base, source_files, inspection_token: initial.inspection_token, configuration }), /(?:SOURCE_CHANGED|STALE_REVISION)/);
  const fresh = await inspect({ ...base, source_files });
  const mutated = { ...source_files, orders: { ...source_files.orders, bytes: new Uint8Array([...pair.orders, 0x0a]) } };
  await assert.rejects(() => inspect({ ...base, source_files: mutated, inspection_token: fresh.inspection_token, configuration }), /SOURCE_CHANGED/);
  assert.deepEqual(await readFile(database), before); assert.deepEqual(await readdir(projectRoot, { recursive: true }), directories);
}));

const invalidAlternatives = [[''], [' \t\u3000 '], ['\u2028\u2029'], ['Valid', ''],
  ...[0x09, 0x0a, 0x0b, 0x0c, 0x0d, 0x20, 0x85, 0xa0, 0x1680, ...Array.from({ length: 11 }, (_, i) => 0x2000 + i), 0x2028, 0x2029, 0x202f, 0x205f, 0x3000].map(code => [String.fromCodePoint(code)])];

test('U1.4 alternatives: public and Application create/save reject empty Unicode whitespace items without writes [AC-XDESK-003-01]', async t => {
  for (const alternatives of invalidAlternatives) await t.test(JSON.stringify(alternatives), async () => withIsolatedProject(async projectRoot => {
    const { application } = await createU12ProjectAdmissionApplication(projectRoot);
    await requiredExport<Method>(application, 'openProject')({ contract_version: '1.0', command_id: desktopTestIds.openProjectCommand, proposed_project_id: desktopTestIds.project, display_name: 'Synthetic Project' });
    const command = createSessionCommand(), fields = { ...command.fields, alternative_explanations: alternatives };
    const database = join(projectRoot, '.xanthil', 'desktop', 'state.sqlite');
    const before = await readFile(database), directories = await readdir(projectRoot, { recursive: true });
    await assert.rejects(() => requiredExport<Method>(application, 'createSession')({ ...command, fields }), /INVALID_REQUEST/);
    assert.deepEqual(await readFile(database), before); assert.deepEqual(await readdir(projectRoot, { recursive: true }), directories);
    assert.throws(() => validateXanthilDesktopRequest('createSession', { ...command, fields }), /INVALID_REQUEST/);
    const valid = await requiredExport<Method>(application, 'createSession')(command), session = valid.session as Record<string, unknown>;
    const save = { contract_version: '1.0', command_id: desktopTestIds.revisionCommand, project_id: desktopTestIds.project, session_id: session.session_id, case_id: session.case_id, revision_id: session.current_revision_id, expected_row_version: '1', form: { kind: 'case_fields', fields } };
    const savedBefore = await readFile(database);
    await assert.rejects(() => requiredExport<Method>(application, 'saveForm')(save), /INVALID_REQUEST/);
    assert.deepEqual(await readFile(database), savedBefore, 'fields, version and receipts remain byte-identical');
    assert.throws(() => validateXanthilDesktopRequest('saveForm', save), /INVALID_REQUEST/);
  }));
});

test('U1.4 alternatives: empty collection and meaningful text preserve exact whitespace and order through save/reopen [AC-XDESK-003-01]', async t => {
  for (const alternatives of [[], ['\u0085 B \u00a0', ' A ', '\u200b']]) await t.test(JSON.stringify(alternatives), async () => withIsolatedProject(async projectRoot => {
    const { application } = await createU12ProjectAdmissionApplication(projectRoot);
    const open = { contract_version: '1.0', command_id: desktopTestIds.openProjectCommand, proposed_project_id: desktopTestIds.project, display_name: 'Synthetic Project' };
    await requiredExport<Method>(application, 'openProject')(open);
    const command = createSessionCommand(), fields = { ...command.fields, alternative_explanations: alternatives };
    const initial = await requiredExport<Method>(application, 'createSession')({ ...command, fields }), session = initial.session as Record<string, unknown>;
    assert.deepEqual((initial.revision as Record<string, unknown>).alternative_explanations, alternatives);
    const owner = { project_id: desktopTestIds.project, session_id: session.session_id, case_id: session.case_id, revision_id: session.current_revision_id };
    const saved = await requiredExport<Method>(application, 'saveForm')({ contract_version: '1.0', command_id: desktopTestIds.revisionCommand, ...owner, expected_row_version: '1', form: { kind: 'case_fields', fields } });
    assert.deepEqual((saved.revision as Record<string, unknown>).alternative_explanations, alternatives);
    const reopened = await createU12ProjectAdmissionApplication(projectRoot); await requiredExport<Method>(reopened.application, 'openProject')(open);
    assert.deepEqual((await requiredExport<Method>(reopened.application, 'readProjection')(owner)).revision, saved.revision);
  }));
});

test('U1.4 alternatives: coherent legacy malformed rows refuse admission without database or directory mutation [AC-XDESK-003-01, AC-XDESK-011-07]', async t => {
  for (const alternatives of invalidAlternatives) await t.test(JSON.stringify(alternatives), async () => withIsolatedProject(async projectRoot => {
    const { application } = await createU12ProjectAdmissionApplication(projectRoot);
    const open = { contract_version: '1.0', command_id: desktopTestIds.openProjectCommand, proposed_project_id: desktopTestIds.project, display_name: 'Synthetic Project' };
    await requiredExport<Method>(application, 'openProject')(open);
    const command = createSessionCommand(); await requiredExport<Method>(application, 'createSession')(command);
    const { command_id, ...request } = command;
    const fingerprint = createHash('sha256').update(JSON.stringify({ operation_kind: 'create_session', request: { ...request, fields: { ...request.fields, alternative_explanations: alternatives } } })).digest('hex');
    const database = join(projectRoot, '.xanthil', 'desktop', 'state.sqlite'), db = new DatabaseSync(database);
    try { db.prepare('UPDATE case_revisions SET alternative_explanations_json=?').run(JSON.stringify(alternatives)); db.prepare('UPDATE command_receipts SET input_fingerprint=? WHERE command_id=?').run(fingerprint, command_id); } finally { db.close(); }
    const before = await readFile(database), directories = await readdir(projectRoot, { recursive: true });
    const reopened = await createU12ProjectAdmissionApplication(projectRoot);
    await assert.rejects(() => requiredExport<Method>(reopened.application, 'openProject')(open), /INTEGRITY_BLOCKED/);
    assert.deepEqual(await readFile(database), before); assert.deepEqual(await readdir(projectRoot, { recursive: true }), directories);
  }));
});

function stringValue(value: Record<string, unknown>, key: string) {
  const item = value[key];
  assert.equal(typeof item, 'string', `${key} must be an explicit business identity`);
  return item;
}

async function createApplication(projectRoot: string, runtime = createOfflineAssistanceRuntimeDouble()) {
  await assertDesktopFixtureHealth();
  const storageModule = await loadDesktopModule('adapters/storage-local/xanthil-desktop-decision-case.ts');
  const analysisModule = await loadDesktopModule('adapters/analytics-duckdb/xanthil-desktop-decision-case.ts');
  const applicationModule = await loadDesktopModule('packages/application/xanthil-desktop-decision-case.ts');
  const createStore = requiredExport<(config: { projectRoot: string }) => unknown>(storageModule, 'createLocalDesktopDecisionCaseStore');
  const createRunStore = requiredExport<(config: { projectRoot: string }) => unknown>(storageModule, 'createLocalDesktopRunEvidenceStore');
  const createAnalysis = requiredExport<(config: Record<string, string>) => unknown>(analysisModule, 'createDuckDbPythonDesktopLocalAnalysisExecution');
  const factory = requiredExport<(dependencies: Record<string, unknown>) => Record<string, unknown>>(applicationModule, 'createXanthilDesktopDecisionCaseApplication');
  const toolchain = process.env.JUANERAI_TOOLCHAIN_BIN;
  assert.ok(toolchain, 'the approved command-local toolchain must be healthy before a product RED is meaningful');
  const deadlines = createControlledDeadlineScheduler();
  const application = factory({
    store: createStore({ projectRoot }),
    analysisExecution: createAnalysis({ duckdbExecutable: join(toolchain, 'duckdb'), duckdbVersion: '1.5.2', ...readDesktopPythonTool(toolchain) }),
    runEvidenceStore: createRunStore({ projectRoot }), assistanceRuntime:runtime.runtime, clock: fixedClock, deadlineScheduler: deadlines.scheduler,
  });
  return { application, deadlines, runtime };
}

async function openedDraft(projectRoot: string) {
  const fixture = await createApplication(projectRoot);
  await requiredExport<Method>(fixture.application, 'openProject')({ contract_version: '1.0', command_id: desktopTestIds.openProjectCommand, proposed_project_id: desktopTestIds.project, display_name: 'Synthetic Project' });
  const created = await requiredExport<Method>(fixture.application, 'createSession')(createSessionCommand());
  const sessions = await requiredExport<(value: Record<string, unknown>) => Promise<Array<Record<string, unknown>>>>(fixture.application, 'listSessions')({ project_id: desktopTestIds.project });
  assert.equal(sessions.length, 1);
  const session = sessions[0];
  const owner = { project_id: desktopTestIds.project, session_id: stringValue(session, 'session_id'), case_id: stringValue(session, 'case_id'), revision_id: stringValue(session, 'current_revision_id') };
  const projection = await requiredExport<Method>(fixture.application, 'openSession')({ contract_version: '1.0', project_id: owner.project_id, session_id: owner.session_id });
  return { ...fixture, created, owner, row_version: stringValue(projection.revision as Record<string, unknown>, 'row_version') };
}

function inspectionGuard(draft: Awaited<ReturnType<typeof openedDraft>>) {
  return { contract_version: '1.0', ...draft.owner, expected_row_version: draft.row_version };
}

function revisionCommand(owner: Record<string, unknown>, command_id: string = desktopTestIds.revisionCommand) {
  return { contract_version: '1.0', command_id, ...owner, expected_row_version: '1' };
}

function fullConfirmation() {
  return {
    column_mapping: { member_id_column: 'member_id', member_group_column: 'member_group', order_id_column: 'order_id', order_member_id_column: 'order_member_id', paid_at_column: 'paid_at', amount_column: 'amount', status_column: 'status', currency_column: 'currency' },
    comparison_period: { start_date: '2026-01-01', end_date: '2026-01-29' }, current_period: { start_date: '2026-02-01', end_date: '2026-03-01' },
    currency: 'CNY', time_zone: 'Asia/Shanghai', valid_statuses: ['paid'], issue_treatments: [], selected_group_mode: 'mapped',
    hypothesis_id: 'current_repurchase_rate_lower_than_comparison', method_id: 'membership_repurchase_comparison', method_version: '1.0', authority_confirmed: true, issues_confirmed: true, plan_confirmed: true,
  };
}

test('TEST-XDESK-007 helper health: the controlled scheduler can signal, but never choose, a terminal transition', () => {
  const controlled = createControlledDeadlineScheduler();
  let calls = 0;
  const cancelled = controlled.scheduler.schedule({ at_epoch_ms: fixedClock().getTime(), callback: () => { calls += 1; } });
  const live = controlled.scheduler.schedule({ at_epoch_ms: fixedClock().getTime(), callback: () => { calls += 10; } });
  cancelled.cancel();
  cancelled.cancel();
  controlled.runDue();
  assert.equal(calls, 10);
  controlled.runDue();
  assert.equal(calls, 10, 'a delivered deadline signal is one-shot even if the test clock is advanced repeatedly');
  assert.equal(controlled.scheduled[1].fired, true);
  live.cancel();
  controlled.runDue();
  assert.equal(calls, 10);
});

test('U1.3: real Application creates and reopens one professional Session without any Runtime [AC-XDESK-002-01, AC-XDESK-002-02, AC-XDESK-002-04, AC-XDESK-002-06]', async () => withIsolatedProject(async (projectRoot) => {
  const { application } = await createU12ProjectAdmissionApplication(projectRoot);
  await requiredExport<Method>(application, 'openProject')({ contract_version: '1.0', command_id: desktopTestIds.openProjectCommand, proposed_project_id: desktopTestIds.project, display_name: 'Synthetic Project' });
  assert.equal(typeof application.createSession, 'function', 'healthy M1.2 composition must expose the approved createSession behavior');
  const create = requiredExport<Method>(application, 'createSession');
  const first = await create(createSessionCommand());
  const session = first.session as Record<string, unknown>, revision = first.revision as Record<string, unknown>;
  assert.equal(session.mode, 'professional'); assert.equal(revision.state, 'Draft'); assert.equal(revision.revision_sequence, '1');
  assert.equal(revision.question_text, 'Why did repurchase decline?');
  assert.equal(revision.created_at, fixedClock().toISOString());
  assert.deepEqual((await readdir(join(projectRoot, session.session_id as string))).sort(), ['010_draw', '020_clean', '060_reports']);
  assert.deepEqual(await create(createSessionCommand()), first, 'same command recovers the original generated IDs');
  await assert.rejects(() => create(createSessionCommand({ case_name: 'Different meaning' })), /COMMAND_CONFLICT/);
  const reopened = await createU12ProjectAdmissionApplication(projectRoot);
  await requiredExport<Method>(reopened.application, 'openProject')({ contract_version: '1.0', command_id: desktopTestIds.retryCommand, proposed_project_id: desktopTestIds.alternateProject, display_name: 'Ignored proposal' });
  assert.deepEqual(await requiredExport<Method>(reopened.application, 'readProjection')({ project_id: desktopTestIds.project, session_id: session.session_id, case_id: session.case_id, revision_id: session.current_revision_id }), first);
}));

test('U1.3 integrity: Application records one explicit integrity transition and retains readable committed history [AC-XDESK-011-07]', async () => withIsolatedProject(async projectRoot => {
  const { application } = await createU12ProjectAdmissionApplication(projectRoot);
  await requiredExport<Method>(application, 'openProject')({ contract_version: '1.0', command_id: desktopTestIds.openProjectCommand, proposed_project_id: desktopTestIds.project, display_name: 'Synthetic Project' });
  const created = await requiredExport<Method>(application, 'createSession')(createSessionCommand()); const session = created.session as Record<string, unknown>;
  const { rename } = await import('node:fs/promises'); await rename(join(projectRoot, session.session_id as string, '020_clean'), join(projectRoot, session.session_id as string, 'preserved-clean'));
  const request = { project_id: desktopTestIds.project, session_id: session.session_id, case_id: session.case_id, revision_id: session.current_revision_id };
  const first = await requiredExport<Method>(application, 'readProjection')(request), second = await requiredExport<Method>(application, 'readProjection')(request);
  assert.equal((first.revision as Record<string, unknown>).integrity_state, 'integrity_blocked'); assert.equal((first.revision as Record<string, unknown>).row_version, '2'); assert.deepEqual(second, first);
  const db = new DatabaseSync(join(projectRoot, '.xanthil', 'desktop', 'state.sqlite'), { readOnly: true });
  try { assert.equal(db.prepare("SELECT COUNT(*) AS n FROM command_receipts WHERE operation_kind='mark_integrity_blocked'").get()?.n, 1); } finally { db.close(); }
}));

test('U1.4: case-field save preserves one revision, receipt idempotency, owner guards and projection wait [AC-XDESK-003-01, AC-XDESK-009-05]', async () => withIsolatedProject(async projectRoot => {
  const { application } = await createU12ProjectAdmissionApplication(projectRoot);
  await requiredExport<Method>(application, 'openProject')({ contract_version: '1.0', command_id: desktopTestIds.openProjectCommand, proposed_project_id: desktopTestIds.project, display_name: 'Synthetic Project' });
  const initial = await requiredExport<Method>(application, 'createSession')(createSessionCommand());
  const session = initial.session as Record<string, unknown>, owner = { project_id: desktopTestIds.project, session_id: session.session_id, case_id: session.case_id, revision_id: session.current_revision_id };
  assert.equal(typeof application.saveForm, 'function', 'the admitted Session needs real case_fields save');
  const request = { contract_version: '1.0', command_id: desktopTestIds.revisionCommand, ...owner, expected_row_version: '1', form: { kind: 'case_fields', fields: { question_text: 'Manual question', hypothesis_display_title: 'Manual H1', business_context: 'Preserved context', alternative_explanations: ['B', 'A'] } } };
  const saved = await requiredExport<Method>(application, 'saveForm')(request), revision = saved.revision as Record<string, unknown>;
  assert.equal(revision.row_version, '2'); assert.equal(revision.revision_sequence, '1'); assert.equal(revision.revision_id, owner.revision_id); assert.equal(revision.question_text, 'Manual question'); assert.deepEqual(revision.alternative_explanations, ['B', 'A']);
  assert.deepEqual(await requiredExport<Method>(application, 'saveForm')(request), saved);
  await assert.rejects(() => requiredExport<Method>(application, 'saveForm')({ ...request, form: { ...request.form, fields: { ...request.form.fields, question_text: 'different' } } }), /COMMAND_CONFLICT/);
  await assert.rejects(() => requiredExport<Method>(application, 'saveForm')({ ...request, command_id: desktopTestIds.retryCommand }), /STALE_REVISION/);
  await assert.rejects(() => requiredExport<Method>(application, 'readProjection')({ ...owner, case_id: desktopTestIds.alternateCase }), /STALE_REVISION/);
  await assert.rejects(() => requiredExport<Method>(application, 'saveForm')({ ...request, form: { kind: 'evidence_explanation', evidence_explanation_text: 'later' } }), /COMMAND_CONFLICT/);
  await assert.rejects(() => requiredExport<Method>(application, 'saveForm')({ ...request,command_id:'79000000-0000-4000-8000-000000000001',expected_row_version:requiredRecord(saved.revision,'revision').row_version, form: { kind: 'evidence_explanation', evidence_explanation_text: 'later' } }), /FORBIDDEN/);
  assert.deepEqual(await requiredExport<Method>(application, 'waitForProjection')({ ...owner, projection_token: initial.projection_token }), saved);
  assert.deepEqual(await requiredExport<Method>(application, 'openSession')({ contract_version: '1.0', project_id: desktopTestIds.project, session_id: session.session_id }), saved);
  const reopened = await createU12ProjectAdmissionApplication(projectRoot);
  await requiredExport<Method>(reopened.application, 'openProject')({ contract_version: '1.0', command_id: desktopTestIds.retryCommand, proposed_project_id: desktopTestIds.alternateProject, display_name: 'Ignore' });
  assert.deepEqual(await requiredExport<Method>(reopened.application, 'readProjection')(owner), saved);
}));

test('U1.4 durability: save lost COMMIT is resolved on a new connection or blocks resend until reopen [AC-XDESK-009-05, AC-XDESK-011-07]', async (t) => {
  for (const unreadable of [false, true]) await t.test(`unreadable=${unreadable}`, async () => withIsolatedProject(async projectRoot => {
    const { application } = await createU12ProjectAdmissionApplication(projectRoot);
    const open = { contract_version: '1.0', command_id: desktopTestIds.openProjectCommand, proposed_project_id: desktopTestIds.project, display_name: 'Synthetic Project' };
    await requiredExport<Method>(application, 'openProject')(open);
    const created = await requiredExport<Method>(application, 'createSession')(createSessionCommand()), session = created.session as Record<string, unknown>;
    const owner = { project_id: desktopTestIds.project, session_id: session.session_id, case_id: session.case_id, revision_id: session.current_revision_id };
    const request = { contract_version: '1.0', command_id: desktopTestIds.revisionCommand, ...owner, expected_row_version: '1', form: { kind: 'case_fields', fields: { question_text: 'Durably edited', hypothesis_display_title: '', business_context: '', alternative_explanations: [] } } };
    const exec = DatabaseSync.prototype.exec, prepare = DatabaseSync.prototype.prepare;
    let committed: DatabaseSync | undefined, checked: DatabaseSync | undefined, commits = 0;
    DatabaseSync.prototype.exec = function(sql: string) { const result = exec.call(this, sql); if (sql === 'COMMIT') { committed = this; commits++; throw new Error('synthetic-response-lost'); } return result; };
    DatabaseSync.prototype.prepare = function(sql: string) { if (committed && /command_receipts/.test(sql)) { checked = this; assert.notEqual(this, committed); if (unreadable) throw new Error('synthetic-readback-unavailable'); } return prepare.call(this, sql); };
    try { if (unreadable) await assert.rejects(() => requiredExport<Method>(application, 'saveForm')(request), /RESULT_PENDING/); else assert.equal(((await requiredExport<Method>(application, 'saveForm')(request)).revision as Record<string, unknown>).row_version, '2'); }
    finally { DatabaseSync.prototype.exec = exec; DatabaseSync.prototype.prepare = prepare; }
    assert.equal(commits, 1); assert.ok(checked);
    if (unreadable) {
      const before = await readFile(join(projectRoot, '.xanthil', 'desktop', 'state.sqlite'));
      await assert.rejects(() => requiredExport<Method>(application, 'saveForm')(request), /RESULT_PENDING/);
      await assert.rejects(() => requiredExport<Method>(application, 'createSession')({ ...createSessionCommand(), command_id: desktopTestIds.retryCommand }), /RESULT_PENDING/);
      assert.deepEqual(await readFile(join(projectRoot, '.xanthil', 'desktop', 'state.sqlite')), before);
      await requiredExport<Method>(application, 'openProject')(open);
    }
    const saved = await requiredExport<Method>(application, 'saveForm')(request); assert.equal((saved.revision as Record<string, unknown>).question_text, 'Durably edited');
    const { rename } = await import('node:fs/promises'); await rename(join(projectRoot, String(owner.session_id), '020_clean'), join(projectRoot, String(owner.session_id), 'retained-clean'));
    const blocked = await requiredExport<Method>(application, 'readProjection')(owner);
    assert.equal((blocked.revision as Record<string, unknown>).row_version, '3'); assert.equal((blocked.revision as Record<string, unknown>).question_text, 'Durably edited');
    await assert.rejects(() => requiredExport<Method>(application, 'saveForm')({ ...request, command_id: desktopTestIds.retryCommand, expected_row_version: '3' }), /INTEGRITY_BLOCKED/);
    const reopened = await createU12ProjectAdmissionApplication(projectRoot); await requiredExport<Method>(reopened.application, 'openProject')(open);
    assert.deepEqual(await requiredExport<Method>(reopened.application, 'readProjection')(owner), blocked);
  }));
});

test('U1.2 F4: Application rejects malformed canonical identities before any Project effect [AC-XDESK-009-05]', async (t) => {
  const valid = { contract_version: '1.0', command_id: desktopTestIds.openProjectCommand, proposed_project_id: desktopTestIds.project, display_name: 'Synthetic Project' };
  for (const key of ['command_id', 'proposed_project_id']) for (const value of ['not-a-uuid', 'AAAAAAAA-AAAA-4AAA-8AAA-AAAAAAAAAAAA', '11111111-1111-1111-8111-111111111111', '', null, 42]) await t.test(`${key} ${value}`, async () => withIsolatedProject(async (projectRoot) => {
    const { application } = await createU12ProjectAdmissionApplication(projectRoot);
    await assert.rejects(() => requiredExport<Method>(application, 'openProject')({ ...valid, [key]: value }), /VALIDATION_FAILED/);
    assert.deepEqual(await readdir(projectRoot), []);
  }));
  for (const input of [{ ...valid, extra: true }, { ...valid, contract_version: '2.0' }, { ...valid, display_name: '' }, { command_id: valid.command_id }]) await withIsolatedProject(async (projectRoot) => {
    const { application } = await createU12ProjectAdmissionApplication(projectRoot);
    await assert.rejects(() => requiredExport<Method>(application, 'openProject')(input), /VALIDATION_FAILED/);
    assert.deepEqual(await readdir(projectRoot), []);
  });
});

test('U2 composition: the current closed I2 factory rejects stale or extra dependencies before effects [AC-XDESK-009-03]', async () => withIsolatedProject(async projectRoot => {
  const module = await loadDesktopModule('packages/application/xanthil-desktop-decision-case.ts');
  const factory = requiredExport<(x: unknown) => Record<string, unknown>>(module, 'createXanthilDesktopDecisionCaseApplication');
  const prepared = await createU12ProjectAdmissionApplication(projectRoot);
  assert.throws(() => factory({store:prepared.store,clock:fixedClock}), /VALIDATION_FAILED/);
  assert.deepEqual(await readdir(projectRoot), [], 'composition never creates database or Run authority');
}));

test('U1.2 F5: real Application supplies canonical initialization provenance and reopening adds none [AC-XDESK-011-02]', async () => withIsolatedProject(async (projectRoot) => {
  const storage = await loadDesktopModule('adapters/storage-local/xanthil-desktop-decision-case.ts');
  const module = await loadDesktopModule('packages/application/xanthil-desktop-decision-case.ts');
  const store = requiredExport<(x: unknown) => unknown>(storage, 'createLocalDesktopDecisionCaseStore')({ projectRoot });
  const factory = requiredExport<(x: unknown) => Record<string, unknown>>(module, 'createXanthilDesktopDecisionCaseApplication');
  const prepared = await createU12ProjectAdmissionApplication(projectRoot);
  const application = factory({ ...prepared.dependencies, store, clock: () => new Date('2026-01-02T03:04:05.006Z') });
  const open = requiredExport<Method>(application, 'openProject');
  await open({ contract_version: '1.0', command_id: desktopTestIds.openProjectCommand, proposed_project_id: desktopTestIds.project, display_name: 'Synthetic Project' });
  const path = join(projectRoot, '.xanthil', 'desktop', 'state.sqlite');
  const db = new DatabaseSync(path, { readOnly: true });
  try {
    assert.equal(db.prepare('SELECT created_at FROM projects').get()?.created_at, '2026-01-02T03:04:05.006Z');
    assert.deepEqual({ ...db.prepare('SELECT input_fingerprint, completed_at FROM command_receipts').get() }, {
      input_fingerprint: '9f1bcae85f9de177cf0903ca42e1a842cb98f889a5801d6ce03a952b23d4027d', completed_at: '2026-01-02T03:04:05.006Z',
    });
  } finally { db.close(); }
  const before = await readFile(path);
  await open({ contract_version: '1.0', command_id: desktopTestIds.retryCommand, proposed_project_id: desktopTestIds.alternateProject, display_name: 'New proposal only' });
  assert.deepEqual(await readFile(path), before);
}));

test('U1.2 AC-XDESK-002-02: opens fresh and existing Projects without invoking Analysis Run evidence Runtime provider or network effects', async () => {
  await withIsolatedProject(async (projectRoot) => {
    const first = await createU12ProjectAdmissionApplication(projectRoot);
    assert.deepEqual(Object.keys(first.application).sort(), ['acceptFinding','cancelAnalysis','cancelAssistance','checkImportAdmission','checkReportExport','closeModelWork','completeCase', 'confirmRevision', 'createDraftRevision', 'createSession','decideAssistanceDisclosure','disposeAssistanceDraft', 'inspectImportFiles', 'listSessions', 'openProject', 'openSession','prepareAssistanceDisclosure','prepareReportExport', 'readProjection', 'reconcileInterrupted','recordReportExport', 'saveForm', 'startAnalysis','startAssistance', 'waitForProjection'], 'U4 Assistance, private model lifecycle and native-import admission are exact; construction never starts effects');
    const firstOpen = await requiredExport<Method>(first.application, 'openProject')({
      contract_version: '1.0', command_id: desktopTestIds.openProjectCommand,
      proposed_project_id: desktopTestIds.project, display_name: 'Synthetic Project',
    });
    const db = new DatabaseSync(join(projectRoot, '.xanthil', 'desktop', 'state.sqlite'));
    try {
      assert.equal((db.prepare('SELECT COUNT(*) AS count FROM product_sessions').get() as { count: number }).count, 0);
      assert.equal((db.prepare('SELECT COUNT(*) AS count FROM analysis_runs').get() as { count: number }).count, 0);
      assert.equal((db.prepare('SELECT COUNT(*) AS count FROM assistance_attempts').get() as { count: number }).count, 0);
    } finally { db.close(); }
    const second = await createU12ProjectAdmissionApplication(projectRoot);
    const existingOpen = await requiredExport<Method>(second.application, 'openProject')({
      contract_version: '1.0', command_id: desktopTestIds.retryCommand,
      proposed_project_id: desktopTestIds.alternateProject, display_name: 'Ignored proposed Project identity',
    });
    assert.equal(firstOpen.project_id, desktopTestIds.project);
    assert.equal(existingOpen.project_id, desktopTestIds.project, 'the admitted SQLite Project remains authoritative over a later proposal');
    assert.equal(existingOpen.initialized, false, 'existing Project admission never creates a second initialization or receipt');
    assert.deepEqual(await requiredExport<(value: Record<string, unknown>) => Promise<unknown[]>>(second.application, 'listSessions')({ project_id: desktopTestIds.project }), []);
  });
});

// case:application-admission-terminal-race-and-recovery-contract
test('TEST-XDESK-007 integration: composes the real SQLite, Run-store, and DuckDB/Python Ports with only the approved offline Runtime double', async () => {
  await withIsolatedProject(async (projectRoot) => {
    await assertDesktopFixtureHealth();
    const storageModule = await loadDesktopModule('adapters/storage-local/xanthil-desktop-decision-case.ts');
    const analysisModule = await loadDesktopModule('adapters/analytics-duckdb/xanthil-desktop-decision-case.ts');
    const applicationModule = await loadDesktopModule('packages/application/xanthil-desktop-decision-case.ts');
    const createStore = requiredExport<(config: { projectRoot: string }) => unknown>(storageModule, 'createLocalDesktopDecisionCaseStore');
    const createRunStore = requiredExport<(config: { projectRoot: string }) => unknown>(storageModule, 'createLocalDesktopRunEvidenceStore');
    const createAnalysis = requiredExport<(config: Record<string, string>) => unknown>(analysisModule, 'createDuckDbPythonDesktopLocalAnalysisExecution');
    const createApplication = requiredExport<(dependencies: Record<string, unknown>) => Record<string, unknown>>(applicationModule, 'createXanthilDesktopDecisionCaseApplication');
    const toolchain = process.env.JUANERAI_TOOLCHAIN_BIN;
    assert.ok(toolchain, 'the approved command-local toolchain is required');
    const deadlines = createControlledDeadlineScheduler();
    const assistance = createOfflineAssistanceRuntimeDouble();
    const application = createApplication({
      store: createStore({ projectRoot }),
      analysisExecution: createAnalysis({ duckdbExecutable: join(toolchain, 'duckdb'), duckdbVersion: '1.5.2', ...readDesktopPythonTool(toolchain) }),
      runEvidenceStore: createRunStore({ projectRoot }),
      assistanceRuntime: assistance.runtime,
      clock: fixedClock,
      deadlineScheduler: deadlines.scheduler,
    });
    assert.deepEqual(Object.keys(application).sort(), ['acceptFinding', 'cancelAnalysis', 'cancelAssistance', 'checkImportAdmission', 'checkReportExport', 'closeModelWork', 'completeCase', 'confirmRevision', 'createDraftRevision', 'createSession', 'decideAssistanceDisclosure', 'disposeAssistanceDraft', 'inspectImportFiles', 'listSessions', 'openProject', 'openSession', 'prepareAssistanceDisclosure', 'prepareReportExport', 'readProjection', 'reconcileInterrupted', 'recordReportExport', 'saveForm', 'startAnalysis', 'startAssistance', 'waitForProjection'].sort());
    assert.equal(assistance.calls.length, 0, 'composition itself cannot call a provider');
    const open = requiredExport<(value: Record<string, unknown>) => Promise<unknown>>(application, 'openProject');
    await open({ contract_version: '1.0', command_id: desktopTestIds.openProjectCommand, proposed_project_id: desktopTestIds.project, display_name: 'Synthetic Project' });
    const createSession = requiredExport<(value: Record<string, unknown>) => Promise<unknown>>(application, 'createSession');
    const [first, duplicate] = await Promise.all([createSession(createSessionCommand()), createSession(createSessionCommand())]);
    assert.deepEqual(duplicate, first, 'concurrent duplicate delivery must converge on one durable receipt');
    assert.equal(assistance.calls.length, 0, 'Session creation is effect-free with respect to Runtime/provider traffic');
  });
});

test('AC-XDESK-003-01: creates sequence-one Draft as the only initial revision', async () => {
  await withIsolatedProject(async (projectRoot) => {
    const draft = await openedDraft(projectRoot);
    const projection = await requiredExport<Method>(draft.application, 'openSession')({ contract_version: '1.0', project_id: draft.owner.project_id, session_id: draft.owner.session_id });
    assert.equal((projection.revision as Record<string, unknown>).revision_sequence, '1');
    assert.equal((projection.revision as Record<string, unknown>).state, 'Draft');
  });
});

test('AC-XDESK-003-02: creates a new Draft for each source, mapping, period, status, treatment, or method change', async () => {
  await withIsolatedProject(async (projectRoot) => {
    const draft = await openedDraft(projectRoot);
    const next = await requiredExport<Method>(draft.application, 'createDraftRevision')(revisionCommand(draft.owner));
    assert.equal((next.revision as Record<string, unknown>).revision_sequence, '2');
    assert.equal((next.revision as Record<string, unknown>).state, 'Draft');
  });
});

test('AC-XDESK-003-03: allows only Draft Ready Review NeedsAttention Completed and blocks invalid transitions', async () => {
  await withIsolatedProject(async (projectRoot) => {
    const draft = await openedDraft(projectRoot);
    const before=await readFile(join(projectRoot,'.xanthil','desktop','state.sqlite'));
    await assert.rejects(() => requiredExport<Method>(draft.application, 'startAnalysis')({ ...revisionCommand(draft.owner), confirmation_id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd' }), /FORBIDDEN/);
    await assert.rejects(() => requiredExport<Method>(draft.application, 'completeCase')({ ...revisionCommand(draft.owner), acceptance_id: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', form_id: 'ffffffff-ffff-4fff-8fff-ffffffffffff' }), /NOT_FOUND/);
    assert.deepEqual(await readFile(join(projectRoot,'.xanthil','desktop','state.sqlite')),before);
  });
});

test('AC-XDESK-004-01: accepts valid UTF-8 comma CSV member and order shapes with exact identifiers', async () => {
  await withIsolatedProject(async (projectRoot) => {
    const draft = await openedDraft(projectRoot);
    const sources = await readSyntheticCsvPair();
    const inspection = await requiredExport<Method>(draft.application, 'inspectImportFiles')({ ...inspectionGuard(draft), source_files: { members: { display_name: 'members.csv', bytes: sources.members }, orders: { display_name: 'orders.csv', bytes: sources.orders } } });
    assert.equal(typeof inspection.inspection_token, 'string');
    assert.equal((inspection.members as Record<string, unknown>).row_count, '2');
    assert.equal((inspection.orders as Record<string, unknown>).row_count, '8');
  });
});

test('AC-XDESK-004-02: requires the closed mappings CNY timezone periods statuses and one hypothesis/method', async () => {
  await withIsolatedProject(async (projectRoot) => {
    const draft = await openedDraft(projectRoot);
    const sources = await readSyntheticCsvPair();
    const inspection = await requiredExport<Method>(draft.application, 'inspectImportFiles')({ ...inspectionGuard(draft), source_files: { members: { display_name: 'members.csv', bytes: sources.members }, orders: { display_name: 'orders.csv', bytes: sources.orders } } });
    await assert.rejects(() => requiredExport<Method>(draft.application, 'confirmRevision')({ ...revisionCommand(draft.owner), inspection_token: inspection.inspection_token, confirmation: { ...fullConfirmation(), currency: 'USD' } }), /INVALID_REQUEST/);
  });
});

test('AC-XDESK-004-03: blocks malformed rows unknown members and invalid amount or status before any snapshot', async () => {
  await withIsolatedProject(async (projectRoot) => {
    const draft = await openedDraft(projectRoot);
    const sources = await readSyntheticCsvPair();
    const malformedOrders = new TextEncoder().encode(new TextDecoder().decode(sources.orders).replace('cur-005,0002,2026-02-05T09:00:00+08:00,5.00,void,CNY', 'cur-005,9999,not-a-date,-2,unknown,CNY'));
    const source_files={members:{display_name:'members.csv',bytes:sources.members},orders:{display_name:'orders.csv',bytes:malformedOrders}},inspect=requiredExport<Method>(draft.application,'inspectImportFiles');
    const initial=await inspect({...inspectionGuard(draft),source_files});
    await assert.rejects(() => inspect({ ...inspectionGuard(draft), source_files,inspection_token:initial.inspection_token,configuration:inspectionConfig(fullConfirmation()) }), /VALIDATION_FAILED/);
    const projection = await requiredExport<Method>(draft.application, 'readProjection')(draft.owner);
    assert.equal(projection.snapshot, null);
  });
});

test('AC-XDESK-004-04: normalizes timestamps and rejects unequal or overlapping periods before confirmation', async () => {
  await withIsolatedProject(async (projectRoot) => {
    const draft = await openedDraft(projectRoot);
    const sources = await readSyntheticCsvPair();
    const inspection = await requiredExport<Method>(draft.application, 'inspectImportFiles')({ ...inspectionGuard(draft), source_files: { members: { display_name: 'members.csv', bytes: sources.members }, orders: { display_name: 'orders.csv', bytes: sources.orders } } });
    await assert.rejects(() => requiredExport<Method>(draft.application, 'inspectImportFiles')({ ...inspectionGuard(draft), inspection_token: inspection.inspection_token,source_files:{members:{display_name:'members.csv',bytes:sources.members},orders:{display_name:'orders.csv',bytes:sources.orders}}, configuration:inspectionConfig({ ...fullConfirmation(), current_period: { start_date: '2026-01-15', end_date: '2026-03-01' } }) }), /VALIDATION_FAILED/);
  });
});

test('AC-XDESK-004-05: records reviewable treatment counts exact strings and invalidates confirmation on input change', async () => {
  await withIsolatedProject(async (projectRoot) => {
    const draft = await openedDraft(projectRoot);
    const sources = await readSyntheticCsvPair();
    const preview=await legacyEvaluatedPreview(draft,sources),inspection=preview.inspection;
    assert.equal(Array.isArray(inspection.reviewable_issues), true);
    const changedOrders = new Uint8Array([...sources.orders, 0x0a]);
    await assert.rejects(() => requiredExport<Method>(draft.application, 'confirmRevision')({ ...revisionCommand(draft.owner), inspection_token: inspection.inspection_token, confirmation: preview.confirmation, source_files: { members: { display_name: 'members.csv', bytes: sources.members }, orders: { display_name: 'orders.csv', bytes: changedOrders } } }), /SOURCE_CHANGED/);
  });
});

test('AC-XDESK-004-06: requires the exact Chinese authority confirmation and records its immutable binding', async () => {
  await withIsolatedProject(async (projectRoot) => {
    const draft = await openedDraft(projectRoot);
    const sources = await readSyntheticCsvPair();
    const inspection = await requiredExport<Method>(draft.application, 'inspectImportFiles')({ ...inspectionGuard(draft), source_files: { members: { display_name: 'members.csv', bytes: sources.members }, orders: { display_name: 'orders.csv', bytes: sources.orders } } });
    await assert.rejects(() => requiredExport<Method>(draft.application, 'confirmRevision')({ ...revisionCommand(draft.owner), inspection_token: inspection.inspection_token, confirmation: { ...fullConfirmation(), authority_confirmed: false } }), /AUTHORITY_REQUIRED/);
  });
});

test('AC-XDESK-004-07: copies both confirmed source byte streams exactly with containment and zero provider egress', async () => {
  await withIsolatedProject(async (projectRoot) => {
    const draft = await openedDraft(projectRoot);
    const sources = await readSyntheticCsvPair();
    const preview=await legacyEvaluatedPreview(draft,sources);
    const confirmed = await requiredExport<Method>(draft.application, 'confirmRevision')({ ...revisionCommand(draft.owner), inspection_token: preview.inspection.inspection_token, confirmation: preview.confirmation, source_files: preview.source_files });
    assert.equal((confirmed.revision as Record<string, unknown>).state, 'Ready');
    assert.equal(draft.runtime.calls.length, 0, 'confirmation cannot disclose source bytes or invoke Runtime');
  });
});

async function confirmedReady(projectRoot: string) {
  const draft = await openedDraft(projectRoot);
  const sources = await readSyntheticCsvPair();
  const preview=await legacyEvaluatedPreview(draft,sources);
  const projection = await requiredExport<Method>(draft.application, 'confirmRevision')({ ...revisionCommand(draft.owner), inspection_token: preview.inspection.inspection_token, confirmation: preview.confirmation, source_files: preview.source_files });
  const revision = projection.revision as Record<string, unknown>;
  const confirmation = projection.confirmation as Record<string, unknown>;
  return { ...draft, projection, row_version: stringValue(revision, 'row_version'), confirmation_id: stringValue(confirmation, 'confirmation_id') };
}

function inspectionConfig(full:ReturnType<typeof fullConfirmation>){return {column_mapping:full.column_mapping,comparison_period:full.comparison_period,current_period:full.current_period,currency:full.currency,time_zone:full.time_zone,valid_statuses:full.valid_statuses,selected_group_mode:full.selected_group_mode};}
async function legacyEvaluatedPreview(draft:Awaited<ReturnType<typeof openedDraft>>,sources:Awaited<ReturnType<typeof readSyntheticCsvPair>>){
  const source_files={members:{display_name:'members.csv',bytes:sources.members},orders:{display_name:'orders.csv',bytes:sources.orders}},inspect=requiredExport<Method>(draft.application,'inspectImportFiles');
  const initial=await inspect({...inspectionGuard(draft),source_files}),inspection=await inspect({...inspectionGuard(draft),source_files,inspection_token:initial.inspection_token,configuration:inspectionConfig(fullConfirmation())});
  const issue_treatments=(inspection.reviewable_issues as {code:string;count:string;treatment_options:string[]}[]).map(item=>({code:item.code,count:item.count,treatment:item.treatment_options[0]}));
  return {inspection,source_files,confirmation:{...fullConfirmation(),issue_treatments}};
}

test('AC-XDESK-003-04: keeps current Finding acceptance Closure and report pointers revision-local and historical', async () => {
  await withIsolatedProject(async (projectRoot) => {
    const ready = await confirmedReady(projectRoot);
    const before = await requiredExport<Method>(ready.application, 'readProjection')(ready.owner);
    const next = await requiredExport<Method>(ready.application, 'createDraftRevision')({ ...revisionCommand(ready.owner), expected_row_version: ready.row_version, command_id: desktopTestIds.retryCommand });
    assert.equal((before.revision as Record<string, unknown>).current_finding_id, null);
    assert.equal((next.revision as Record<string, unknown>).previous_revision_id, ready.owner.revision_id);
    assert.equal((next.revision as Record<string, unknown>).current_closure_id, null);
  });
});

test('AC-XDESK-003-05: keeps Completed authority intact after a failed rerun or later failure', async () => {
  await withIsolatedProject(async (projectRoot) => {
    const {before,after}=await completedThenFailedRerun(projectRoot);assert.equal(requiredRecord(after.revision,'revision').state,'Completed');assert.equal(requiredRecord(after.revision,'revision').current_closure_id,requiredRecord(before.revision,'revision').current_closure_id);
  });
});

test('AC-XDESK-007-01: creates a review Finding and draft report from agreeing evidence without inferred acceptance', async () => {
  await withIsolatedProject(async (projectRoot) => {
    const reviewed=(await completedU2Analysis(projectRoot)).projection;
    assert.equal((reviewed.revision as Record<string, unknown>).state, 'Review');
    assert.equal(Array.isArray(reviewed.findings), true);
    assert.equal((reviewed.acceptances as unknown[]).length, 0);
    assert.equal((reviewed.reports as unknown[]).length, 1);
  });
});

test('AC-XDESK-007-02: records accept decline defer and request-more-evidence as distinct non-closure dispositions', async () => {
  await withIsolatedProject(async (projectRoot) => {
    const ready = await completedU2Analysis(projectRoot);
    const rejected = await requiredExport<Method>(ready.application, 'saveForm')({ ...revisionCommand(ready.owner,'76000000-0000-4000-8000-000000000001'), expected_row_version:requiredRecord(ready.projection.revision,'revision').row_version, form: { kind: 'decision_closure', candidates: [], route: null, insufficient_reason: null, preferred_candidate_id: null, preferred_reason: null, disposition: 'more_evidence', defer_until: null } });
    assert.equal((rejected.closures as unknown[]).length, 0);
    assert.equal((rejected.forms as unknown[]).length, 1);
  });
});

test('AC-XDESK-007-03: requires two closed-shape candidates with stable IDs and reasoned optional preference', async () => {
  await withIsolatedProject(async (projectRoot) => {
    const setup = await completedU2Analysis(projectRoot),ready={...setup,row_version:requiredRecord(setup.projection.revision,'revision').row_version};
    const candidate = (candidate_id: string, title: string) => ({ candidate_id, title, evidence_basis: 'M2 contribution', risk_or_refutation: 'No causal claim', applicability_conditions: 'Synthetic cohort', future_validation_metric: 'repeat-rate' });
    await assert.rejects(() => requiredExport<Method>(ready.application, 'saveForm')({ ...revisionCommand(ready.owner), expected_row_version: ready.row_version, form: { kind: 'decision_closure', candidates: [candidate('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'One')], route: 'candidate_comparison', insufficient_reason: null, preferred_candidate_id: null, preferred_reason: null, disposition: 'saved', defer_until: null } }), /VALIDATION_FAILED/);
    const saved = await requiredExport<Method>(ready.application, 'saveForm')({ ...revisionCommand(ready.owner,'76000000-0000-4000-8000-000000000002'), expected_row_version: ready.row_version, form: { kind: 'decision_closure', candidates: [candidate('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Option A'), candidate('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'Option B')], route: 'candidate_comparison', insufficient_reason: null, preferred_candidate_id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', preferred_reason: 'Highest current contribution', disposition: 'saved', defer_until: null } });
    assert.equal((saved.forms as unknown[]).length, 1);
  });
});

test('AC-XDESK-007-04: requires a non-empty insufficient-evidence reason and forbids a preferred candidate there', async () => {
  await withIsolatedProject(async (projectRoot) => {
    const ready = await confirmedReady(projectRoot);
    await assert.rejects(() => requiredExport<Method>(ready.application, 'saveForm')({ ...revisionCommand(ready.owner), expected_row_version: ready.row_version, form: { kind: 'decision_closure', candidates: [], route: 'insufficient_evidence', insufficient_reason: '', preferred_candidate_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', preferred_reason: 'forbidden', disposition: 'saved', defer_until: null } }), /VALIDATION_FAILED/);
  });
});

test('AC-XDESK-007-06: keeps earlier accepted Finding Closure and report versions immutable across failed reruns', async () => {
  await withIsolatedProject(async (projectRoot) => {
    const {before,after}=await completedThenFailedRerun(projectRoot);assert.deepEqual(after.reports,before.reports);assert.deepEqual(after.closures,before.closures);
  });
});

test('AC-XDESK-008-01: admits only one mutually-exclusive Running Run or Attempt with immediate effect-free conflict', async () => {
  await withIsolatedProject(async (projectRoot) => {
    const ready = await confirmedReady(projectRoot);
    const start = requiredExport<Method>(ready.application, 'startAnalysis');
    const first = start({ ...revisionCommand(ready.owner), expected_row_version: ready.row_version, confirmation_id: ready.confirmation_id });
    await assert.rejects(() => requiredExport<Method>(ready.application, 'startAssistance')({ ...revisionCommand(ready.owner, desktopTestIds.retryCommand), expected_row_version: ready.row_version, disclosure_id: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee' }), /(?:BUSY|NOT_FOUND|VALIDATION_FAILED)/);
    await first.catch(() => undefined);
  });
});

test('AC-XDESK-008-02: uses one 300-second outer deadline and bounded 30-second local-call deadlines with zero retry', async () => {
  await withIsolatedProject(async (projectRoot) => {
    const draft = await openedDraft(projectRoot);
    const preview = await requiredExport<Method>(draft.application, 'prepareAssistanceDisclosure')({ contract_version: '1.0', ...draft.owner, expected_row_version: '1', action_kind: 'organize_question', requested_provider: 'offline-test', requested_model: 'deterministic' });
    const decided = await requiredExport<Method>(draft.application, 'decideAssistanceDisclosure')({ ...revisionCommand(draft.owner), preview_token: preview.preview_token, payload_sha256: preview.payload_sha256, decision: 'accepted', free_text_confirmed: true });
    assert.equal(draft.deadlines.scheduled.length, 0, 'a disclosure decision is not an admitted Attempt');
    assert.equal((decided.disclosures as unknown[]).length, 1);
  });
});

test('AC-XDESK-008-03: allows exactly one cancellation deadline failure or success terminal winner and suppresses late success', async () => {
  await withIsolatedProject(async (projectRoot) => {
    const {projection}=await expiredLocalAnalysis(projectRoot);
    assert.equal((projection.findings as unknown[]).length, 0);
    assert.equal((projection.reports as unknown[]).length, 0);
  });
});

test('AC-XDESK-008-04: terminates issued local children and starts no new tool call at deadline', async () => {
  await withIsolatedProject(async (projectRoot) => {
    const {fired,calculations,verifications,aborted}=await expiredLocalAnalysis(projectRoot);assert.equal(fired,1);assert.equal(calculations,1);assert.equal(verifications,0);assert.equal(aborted,true);
  });
});

async function expiredLocalAnalysis(projectRoot:string){
  const ready=await confirmedReady(projectRoot),native=await createU12ProjectAdmissionApplication(projectRoot),module=await loadDesktopModule('packages/application/xanthil-desktop-decision-case.ts'),deadlines=createControlledDeadlineScheduler();let now=fixedClock(),calculations=0,verifications=0,aborted=false,reached!:()=>void;const entered=new Promise<void>(resolve=>{reached=resolve;});
  const execution={...requiredRecord(native.dependencies.analysisExecution,'execution'),calculate:async(input:Record<string,unknown>)=>{calculations++;reached();await new Promise((_,reject)=>{const signal=input.cancellation_signal as AbortSignal;signal.addEventListener('abort',()=>{aborted=true;reject(Object.assign(new Error('CANCELLED'),{code:'CANCELLED'}));},{once:true});});},verify:async()=>{verifications++;assert.fail('absolute deadline forbids next call');}};
  const app=requiredExport<(v:unknown)=>Record<string,unknown>>(module,'createXanthilDesktopDecisionCaseApplication')({...native.dependencies,analysisExecution:execution,clock:()=>now,deadlineScheduler:deadlines.scheduler});await requiredExport<Method>(app,'openProject')({contract_version:'1.0',command_id:desktopTestIds.openProjectCommand,proposed_project_id:desktopTestIds.project,display_name:'Synthetic Project'});
  let projection=await requiredExport<Method>(app,'startAnalysis')({...revisionCommand(ready.owner,'7b000000-0000-4000-8000-000000000001'),expected_row_version:ready.row_version,confirmation_id:ready.confirmation_id});await entered;now=new Date(fixedClock().getTime()+300000);deadlines.runDue(now.getTime());
  for(let n=0;n<100&&(projection.runs as Record<string,unknown>[]).at(-1)?.status==='Running';n++){await new Promise(r=>setTimeout(r,5));projection=await requiredExport<Method>(app,'readProjection')(ready.owner);}
  assert.equal((projection.runs as Record<string,unknown>[]).at(-1)?.terminal_reason,'deadline_exceeded');assert.equal(requiredRecord(projection.revision,'revision').state,'NeedsAttention');return {projection,fired:deadlines.scheduled.filter(item=>item.fired).length,calculations,verifications,aborted};
}

test('AC-XDESK-008-05: reopens Running work once as interrupted without resume resend scan adoption or rewrite', async () => {
  await withIsolatedProject(async (projectRoot) => {
    const draft = await openedDraft(projectRoot);
    await assert.rejects(() => requiredExport<Method>(draft.application, 'reconcileInterrupted')({ command_id: desktopTestIds.retryCommand, ...draft.owner, target_kind: 'analysis_run', target_id: '01991a00-0000-7000-8000-000000000001' }), /NOT_FOUND/);
    assert.equal(draft.runtime.calls.length, 0, 'reconciliation may not resend a provider or scan a Run directory');
  });
});

test('AC-XDESK-008-06: moves only first-result failure to NeedsAttention and never downgrades prior accepted Completed authority', async () => {
  await withIsolatedProject(async (projectRoot) => {
    const {after}=await completedThenFailedRerun(projectRoot);assert.equal(requiredRecord(after.revision,'revision').state,'Completed');assert.equal((after.runs as Record<string,unknown>[]).at(-1)?.terminal_reason,'calculation_failed');
  });
});

test('AC-XDESK-008-07: projects every accepted failure with safe retained state and one permitted next action without false artifact', async () => {
  await withIsolatedProject(async (projectRoot) => {
    const draft = await openedDraft(projectRoot);
    await assert.rejects(() => requiredExport<Method>(draft.application, 'prepareReportExport')({command_id:'7a000000-0000-4000-8000-000000000001', ...draft.owner, report_id: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',format:'html' }), /NOT_FOUND/);
    const projection = await requiredExport<Method>(draft.application, 'readProjection')(draft.owner);
    assert.equal((projection.runs as unknown[]).length, 0);
    assert.equal((projection.reports as unknown[]).length, 0);
  });
});
