/** One fixed health payload through fresh-project SourceSet/Application/ledger. Host only. */
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {randomUUID,createHash} from 'node:crypto';
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {createFreshBrowserProjectStore,createLocalDesktopRunEvidenceStore} from '../../../adapters/storage-local/desktop-state.ts';
import {createLocalMembershipTaskStore} from '../../../adapters/storage-local/member-task.ts';
import {createXanthilDesktopDecisionCaseApplication} from '../../../packages/application/xanthil-desktop-decision-case.ts';
import {createMembershipTaskApplication} from '../../../packages/application/member-task.ts';
import {createMemberSourcesApplication} from '../../../packages/application/member-sources.ts';
import {createMemberPreparationApplication} from '../../../packages/application/member-preparation.ts';
import {createMemberSourcePreparation} from '../../../adapters/analytics-duckdb/member-source-inspection.ts';
import {createMeteredMembershipAnalysisExecution} from '../../../adapters/analytics-duckdb/xanthil-desktop-decision-case.ts';
import {bindQualifiedPreparation} from '../../../packages/product-core/member-preparation.ts';
import {fixturePlan,fixtureSelection} from '../../../tests/fixtures/xanthil-desktop/member-analysis.ts';
import {taskHash} from '../../../packages/product-core/member-task.ts';
import {browserBindingFixture,browserCandidateFixture} from '../../../tests/fixtures/xanthil-desktop/browser-sources.ts';
import {fixedPreparationSources,fixedPayload} from '../../../tests/fixtures/xanthil-desktop/preparation-isolation-payloads.mjs';
const [mode,root]=process.argv.slice(2),bin=process.env.JUANERAI_TOOLCHAIN_BIN;
assert.ok(bin&&bin.startsWith('/'));assert.ok(mode==='--check'||mode==='--run');
const sources=fixedPreparationSources().map(({sha256,...source})=>source),code=fixedPayload('health');
assert.equal(sources.length,3);assert.ok(code.length<65536);
if(mode==='--check')console.log(JSON.stringify({status:'STATIC_ONLY',policy_executed:false,cases:['durable-health','atomic-rollback','completed-replay','stop-after-reap','conversion-correction','plan2-run5-report','confirmation-and-start-substitution','confirmation-rollback','confirmation-stop-race','plan2-browser-analysis-review'],maximum_payload_executions:4,source_hashes:sources.map(s=>createHash('sha256').update(s.bytes).digest('hex')),code_sha256:createHash('sha256').update(code).digest('hex')}));
else {
 assert.equal(process.platform,'darwin');assert.equal(process.version,'v26.0.0');assert.equal(resolve(root),root);mkdirSync(root,{mode:0o700});
 const projectRoot=join(root,'project'),config={pythonExecutable:join(bin,'python3'),pythonVersion:'3.14.4'};
 const analysis=createMeteredMembershipAnalysisExecution({...config,duckdbExecutable:join(bin,'duckdb'),duckdbVersion:'1.5.2'});
 const desktop=createXanthilDesktopDecisionCaseApplication({store:createFreshBrowserProjectStore({projectRoot}),analysisExecution:analysis,runEvidenceStore:createLocalDesktopRunEvidenceStore({projectRoot}),assistanceRuntime:null,clock:()=>new Date(),deadlineScheduler:{schedule({at_epoch_ms,callback}){const timer=setTimeout(callback,Math.max(0,at_epoch_ms-Date.now()));return {cancel(){clearTimeout(timer);}};}}});
 let stage='initialize',result={status:'RUNNING',started:new Date().toISOString()};
 const checkpoint=name=>{stage=name;writeFileSync(join(root,'stage-'+name+'.json'),JSON.stringify({stage:name,at:new Date().toISOString()})+'\n',{flag:'wx'});};
 try {
  const project_id=randomUUID();await desktop.openProject({contract_version:'1.0',command_id:randomUUID(),proposed_project_id:project_id,display_name:'Fixed synthetic Preparation integration'});
  const store=createLocalMembershipTaskStore(projectRoot),taskApp=createMembershipTaskApplication({desktop,store,project_id});
  const task=await taskApp.createBrowser('合成多来源会员分析',randomUUID()),runtime=createMemberSourcePreparation(config);
  const selected=await createMemberSourcesApplication(store,runtime.inspectSources).select({version:'1.0',task_id:task.task_id,command_id:randomUUID(),expected_row_version:task.row_version,sources},new AbortController().signal);
  const policy={version:'1.0',id:randomUUID(),revision:'1',provider:'xiaomi-token-plan-cn',model:'mimo-v2.6-pro',purpose:'membership_analysis',consumption_policy:{mode:'uncapped_metered'},model_retries:1,preparation_corrections:1,approval_reference:'retained-fixed-synthetic-host-scope',max_input_bytes:12000,call_output_tokens:2048,call_ms:60000,process_seconds:30};
  const grant=await store.authorizeOperations({task_id:task.task_id,policy,scope_sha256:taskHash(selected),expires_at:new Date(Date.now()+60000).toISOString()});
  const request={version:'1.0',task_id:task.task_id,source_set_id:selected.id,grant_id:grant.grant_id,bindings:browserBindingFixture(sources),code};
  const atomicStore={...store,async completePreparation(input){
   for(const point of ['preparation_after_settle','preparation_after_qualified_insert']){
    const before=readFileSync(join(projectRoot,'.xanthil/desktop/state.sqlite'));
    const failing=createLocalMembershipTaskStore(projectRoot,{formalFault(at){if(at===point)throw Object.assign(new Error('synthetic transaction fault'),{code:'SYNTHETIC_FAULT'});}});
    await assert.rejects(()=>failing.completePreparation(input),{code:'SYNTHETIC_FAULT'});
    assert.deepEqual(readFileSync(join(projectRoot,'.xanthil/desktop/state.sqlite')),before,'qualified insert and ledger settlement must roll back together');
    await assert.rejects(()=>store.readQualifiedPreparation({task_id:input.task_id,execution_id:input.execution_id}),{code:'NOT_FOUND'});
    assert.equal((await store.readOperations({task_id:input.task_id})).usage[0].phase,'issued');
   }
   return store.completePreparation(input);
  }};
  checkpoint('prepare');
  const prepared=await createMemberPreparationApplication(atomicStore,runtime).prepare(request,new AbortController().signal);
  assert.equal(prepared.status,'qualified','E03-f: Application must independently qualify and durably publish Preparation');
  const reopened=createLocalMembershipTaskStore(projectRoot),ledger=await reopened.readOperations({task_id:task.task_id});
  assert.equal(ledger.totals.unresolved,0);assert.equal(ledger.usage.length,1);assert.equal(ledger.usage[0].outcome,'succeeded');assert.equal(ledger.totals.local_runs,'1');assert.equal(ledger.totals.calls,'0');
  const before=readFileSync(join(projectRoot,'.xanthil/desktop/state.sqlite'));
  const persisted=await reopened.readQualifiedPreparation({task_id:task.task_id,execution_id:ledger.usage[0].execution_id});
  assert.deepEqual(persisted.preparation,prepared);assert.deepEqual(persisted.candidate,browserCandidateFixture());assert.deepEqual(readFileSync(join(projectRoot,'.xanthil/desktop/state.sqlite')),before);
  assert.deepEqual(await createMemberPreparationApplication(store,runtime).prepare(request,new AbortController().signal),prepared);
  assert.equal((await store.readOperations({task_id:task.task_id})).usage.length,1,'completed replay must not issue another payload');
  async function another(label){
   const task=await taskApp.createBrowser(label,randomUUID());
   const selected=await createMemberSourcesApplication(store,runtime.inspectSources).select({version:'1.0',task_id:task.task_id,command_id:randomUUID(),expected_row_version:task.row_version,sources},new AbortController().signal);
   const grant=await store.authorizeOperations({task_id:task.task_id,policy:{...policy,id:randomUUID()},scope_sha256:taskHash(selected),expires_at:new Date(Date.now()+60000).toISOString()});
   return {version:'1.0',task_id:task.task_id,source_set_id:selected.id,grant_id:grant.grant_id,bindings:browserBindingFixture(sources),code};
  }
  const preparationReference=bindQualifiedPreparation(prepared),authority={task_id:task.task_id,grant_id:grant.grant_id,epoch:String(grant.epoch)},intent={version:'1.0',analysis_kind:'overall_change',question_sha256:createHash('sha256').update(task.question).digest('hex'),user_hypothesis:null},preparation_context={version:'2.0',intent,preparation:preparationReference,authority};
  const taskProjection=await taskApp.read(task.task_id),source_files={members:{display_name:'members.csv',bytes:persisted.candidate.members_bytes},orders:{display_name:'orders.csv',bytes:persisted.candidate.orders_bytes}};
  const confirmationBase={contract_version:'1.0',...prepared.owner,expected_row_version:taskProjection.case.revision.row_version,source_files};
  const initial=await desktop.inspectImportFiles(confirmationBase),inspection=await desktop.inspectImportFiles({...confirmationBase,inspection_token:initial.inspection_token,configuration:fixtureSelection()});
  const confirmCommand={...confirmationBase,contract_version:'2.0',command_id:randomUUID(),inspection_token:inspection.inspection_token,confirmation:{...fixtureSelection(),issue_treatments:inspection.reviewable_issues.map(x=>({code:x.code,count:x.count,treatment:x.treatment_options[0]})),analysis_kind:'overall_change',method_id:'membership_repurchase_comparison',method_version:'1.0',authority_confirmed:true,issues_confirmed:true,plan_confirmed:true}};
  checkpoint('confirmation-negatives');
  for(const changed of [
   {...preparation_context,intent:{...intent,question_sha256:'0'.repeat(64)}},
   {...preparation_context,intent:{...intent,user_hypothesis:'invented decline'}},
   {...preparation_context,preparation:{...preparationReference,source_set_sha256:'0'.repeat(64)}},
   {...preparation_context,preparation:{...preparationReference,id:randomUUID()}},
   {...preparation_context,preparation:{...preparationReference,execution_id:randomUUID()}},
   {...preparation_context,authority:{...authority,grant_id:randomUUID()}},
   {...preparation_context,authority:{...authority,task_id:randomUUID()}},
   {...preparation_context,authority:{...authority,epoch:'1'},preparation:{...preparationReference,epoch:'1'}}
  ]){
   const before=readFileSync(join(projectRoot,'.xanthil/desktop/state.sqlite'));
   await assert.rejects(()=>desktop.confirmPreparedRevision({command:confirmCommand,preparation_context:changed}));
   assert.deepEqual(readFileSync(join(projectRoot,'.xanthil/desktop/state.sqlite')),before);
  }
  checkpoint('confirmation-rollback');
  const beforeConfirmation=readFileSync(join(projectRoot,'.xanthil/desktop/state.sqlite')),originalPrepare=DatabaseSync.prototype.prepare;
  try {
   DatabaseSync.prototype.prepare=function(sql){if(/^INSERT INTO input_confirmations\b/.test(sql))throw Object.assign(new Error('synthetic confirmation fault'),{code:'SYNTHETIC_FAULT'});return Reflect.apply(originalPrepare,this,[sql]);};
   await assert.rejects(()=>desktop.confirmPreparedRevision({command:confirmCommand,preparation_context}),{code:'PUBLICATION_FAILED'});
  }finally{DatabaseSync.prototype.prepare=originalPrepare;}
  assert.deepEqual(readFileSync(join(projectRoot,'.xanthil/desktop/state.sqlite')),beforeConfirmation);
  checkpoint('confirmation');
  const ready=await desktop.confirmPreparedRevision({command:confirmCommand,preparation_context});
  const plan={...fixturePlan(persisted.candidate),version:'2.0',intent,owner:prepared.owner,confirmation_id:ready.confirmation.confirmation_id,snapshot_id:ready.snapshot.snapshot_id,preparation:preparationReference,authority};
  checkpoint('start3-negatives');
  const startRequest={contract_version:'3.0',command_id:randomUUID(),...prepared.owner,expected_row_version:ready.revision.row_version,confirmation_id:plan.confirmation_id,execution_plan:plan};
  for(const changed of [
   {...plan,intent:{...intent,question_sha256:'0'.repeat(64)}},
   {...plan,intent:{...intent,user_hypothesis:'invented decline'}},
   {...plan,preparation:{...plan.preparation,source_set_sha256:'0'.repeat(64)}},
   {...plan,preparation:{...plan.preparation,id:randomUUID()}},
   {...plan,preparation:{...plan.preparation,execution_id:randomUUID()}},
   {...plan,authority:{...plan.authority,grant_id:randomUUID()}},
   {...plan,authority:{...plan.authority,epoch:'1'},preparation:{...plan.preparation,epoch:'1'}}
  ]){const before=readFileSync(join(projectRoot,'.xanthil/desktop/state.sqlite'));await assert.rejects(()=>desktop.startAnalysis({...startRequest,execution_plan:changed}));assert.deepEqual(readFileSync(join(projectRoot,'.xanthil/desktop/state.sqlite')),before);}
  checkpoint('start3');
  const admitted=await desktop.startAnalysis({contract_version:'3.0',command_id:randomUUID(),...prepared.owner,expected_row_version:ready.revision.row_version,confirmation_id:plan.confirmation_id,execution_plan:plan});
  checkpoint('run5');
  assert.equal(admitted.runs.at(-1).run_contract_version,'5.0','E04-c: actual Start3 must persist Plan2 and Run5 with Preparation identity');
  let finished;const until=Date.now()+10000;while(Date.now()<until){finished=await desktop.readProjection(prepared.owner);if(finished.runs.at(-1).status!=='Running')break;await new Promise(r=>setTimeout(r,20));}
  assert.equal(finished.runs.at(-1).status,'Succeeded');assert.equal(finished.reports.at(-1).state,'draft');assert.equal(ready.confirmation.analysis_kind,'overall_change');assert.equal(ready.confirmation.hypothesis_id,undefined);assert.equal(finished.findings.at(-1).judgment,'Verified');assert.deepEqual(finished.findings.at(-1).facts,{version:'2.0',comparison_direction:'equal',verification_status:'verified',intent});
  const analysisLedger=await store.readOperations({task_id:task.task_id});assert.equal(analysisLedger.operations.filter(x=>x.kind==='analysis').length,1,'actual M1 must have one stable metered operation');assert.equal(analysisLedger.totals.local_runs,'2');assert.equal(analysisLedger.totals.calls,'0');assert.equal(analysisLedger.totals.unresolved,0);
  checkpoint('plan2-browser-analysis-review');
  const {verifyBrowserReview}=await import('../../../tests/fixtures/xanthil-desktop/browser-review-path.mjs');
  await verifyBrowserReview({store,tasks:taskApp,project_id,projectRoot,task});
  checkpoint('stop-after-reap');
  const stoppedRequest=await another('合成停止后回执');
  const stoppingRuntime={...runtime,async executePreparation(input){const actual=await runtime.executePreparation(input);await taskApp.stop(stoppedRequest.task_id);return actual;}};
  await assert.rejects(()=>createMemberPreparationApplication(store,stoppingRuntime).prepare(stoppedRequest,new AbortController().signal),{code:'CANCELLED'});
  const stopped=await store.readOperations({task_id:stoppedRequest.task_id});assert.equal(stopped.totals.unresolved,0);assert.equal(stopped.usage[0].outcome,'stopped');
  await assert.rejects(()=>store.readQualifiedPreparation({task_id:stoppedRequest.task_id,execution_id:stopped.usage[0].execution_id}),{code:'NOT_FOUND'});
  checkpoint('conversion-correction');
  const correctionRequest=await another('合成一次转换纠正'),application=createMemberPreparationApplication(store,runtime);
  await assert.rejects(()=>application.prepare({...correctionRequest,code:fixedPayload('wrong_conversion')},new AbortController().signal),{code:'CONVERSION_UNQUALIFIED'});
  const failed=await store.readOperations({task_id:correctionRequest.task_id});assert.equal(failed.totals.unresolved,0);assert.equal(failed.usage[0].outcome,'conversion_failure');
  const corrected=await application.prepare(correctionRequest,new AbortController().signal),correctedLedger=await store.readOperations({task_id:correctionRequest.task_id});
  assert.equal(corrected.previous_execution_id,failed.usage[0].execution_id);assert.equal(correctedLedger.usage.length,2);assert.equal(correctedLedger.usage[1].execution_index,1);assert.equal(correctedLedger.usage[0].operation_id,correctedLedger.usage[1].operation_id);assert.equal(correctedLedger.usage[1].outcome,'succeeded');
  checkpoint('confirmation-stop-race');
  const correctedTask=await taskApp.read(correctionRequest.task_id),correctedBytes=(await store.readQualifiedPreparation({task_id:correctionRequest.task_id,execution_id:corrected.context.execution_id})).candidate;
  const correctedContext={version:'2.0',intent:{version:'1.0',analysis_kind:'overall_change',question_sha256:createHash('sha256').update(correctedTask.question).digest('hex'),user_hypothesis:null},preparation:bindQualifiedPreparation(corrected),authority:{task_id:correctionRequest.task_id,grant_id:correctionRequest.grant_id,epoch:String(corrected.context.epoch)}};
  const correctedBase={contract_version:'1.0',...corrected.owner,expected_row_version:correctedTask.case.revision.row_version,source_files:{members:{display_name:'members.csv',bytes:correctedBytes.members_bytes},orders:{display_name:'orders.csv',bytes:correctedBytes.orders_bytes}}};
  const ci=await desktop.inspectImportFiles(correctedBase),ce=await desktop.inspectImportFiles({...correctedBase,inspection_token:ci.inspection_token,configuration:fixtureSelection()});
  await taskApp.stop(correctionRequest.task_id);
  const stoppedDb=readFileSync(join(projectRoot,'.xanthil/desktop/state.sqlite'));
  await assert.rejects(()=>desktop.confirmPreparedRevision({command:{...correctedBase,contract_version:'2.0',command_id:randomUUID(),inspection_token:ce.inspection_token,confirmation:{...confirmCommand.confirmation,issue_treatments:ce.reviewable_issues.map(x=>({code:x.code,count:x.count,treatment:x.treatment_options[0]}))}},preparation_context:correctedContext}),{code:'AUTHORITY_REQUIRED'});
  assert.deepEqual(readFileSync(join(projectRoot,'.xanthil/desktop/state.sqlite')),stoppedDb);
  result={...result,status:'PASS',checks:['durable-health','atomic-rollback','completed-replay','stop-after-reap','conversion-correction','plan2-run5-report','confirmation-and-start-substitution','confirmation-rollback','confirmation-stop-race','plan2-browser-analysis-review'],stopped,correctedLedger,task_id:task.task_id,execution_id:ledger.usage[0].execution_id,preparation:prepared,ledger};
 }catch(error){result={...result,status:'FAIL',stage,stack:String(error.stack).split('\n').slice(0,8),code:error.code??'ASSERTION',message:String(error.message)};process.exitCode=1;}
 finally {result.ended=new Date().toISOString();writeFileSync(join(root,'result.json'),JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(result));}
}
