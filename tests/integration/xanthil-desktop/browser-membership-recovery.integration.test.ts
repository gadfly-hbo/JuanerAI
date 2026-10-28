import assert from 'node:assert/strict';
import test from 'node:test';
import {randomUUID} from 'node:crypto';
import {createHash} from 'node:crypto';
import {taskHash} from '../../../packages/product-core/member-task.ts';
import {mkdtempSync,readFileSync,mkdirSync} from 'node:fs';
import {join} from 'node:path';
import * as storage from '../../../adapters/storage-local/desktop-state.ts';
import {createLocalMembershipTaskStore} from '../../../adapters/storage-local/member-task.ts';
import {createXanthilDesktopDecisionCaseApplication} from '../../../packages/application/xanthil-desktop-decision-case.ts';
import {createMembershipTaskApplication} from '../../../packages/application/member-task.ts';
import {createU12ProjectAdmissionApplication} from '../../fixtures/xanthil-desktop/desktop-contract-drivers.ts';
import {createMemberSourcesApplication} from '../../../packages/application/member-sources.ts';
import {browserEvidenceRoot} from '../../fixtures/xanthil-desktop/browser-evidence.ts';

type OperationStore=ReturnType<typeof createLocalMembershipTaskStore>;
const policy=():import('../../../packages/product-core/member-operation.ts').OperationPolicy=>({version:'1.0',id:randomUUID(),revision:'1',provider:'xiaomi-token-plan-cn',model:'mimo-v2.6-pro',purpose:'membership_analysis',consumption_policy:{mode:'uncapped_metered'},model_retries:1,preparation_corrections:1,approval_reference:'synthetic-controller-decision',max_input_bytes:12000,call_output_tokens:32768,call_ms:600000,process_seconds:30});
const unknown=()=>({input_tokens:{kind:'unknown',reason:'synthetic-no-provider'},output_tokens:{kind:'unknown',reason:'synthetic-no-provider'},active_ms:{kind:'known',value:'7'},wait_ms:{kind:'known',value:'0'}});
async function fixture(){
 const base=process.env.JUANERAI_NEWARCH_SHORT_ROOT!;const parent=mkdtempSync(join(base,'ledger-')),root=join(parent,'project');
 assert.equal(typeof Reflect.get(createLocalMembershipTaskStore(root),'authorizeOperations'),'function','BF-R07: actual membership Store needs durable uncapped operation admission');
 const create=Reflect.get(storage,'createFreshBrowserProjectStore') as (x:unknown)=>ReturnType<typeof storage.createLocalDesktopDecisionCaseStore>;
 assert.equal(typeof create,'function');const freshStore=create({projectRoot:root}),f=await createU12ProjectAdmissionApplication(root);
 const desktop=createXanthilDesktopDecisionCaseApplication({...f.dependencies,store:freshStore,clock:()=>new Date()}),project_id=randomUUID();
 await desktop.openProject({contract_version:'1.0',command_id:randomUUID(),proposed_project_id:project_id,display_name:'Synthetic browser ledger'});
 const store=createLocalMembershipTaskStore(root) as OperationStore,app=createMembershipTaskApplication({desktop,project_id,store});
 const task=await app.create('合成会员任务',randomUUID());
 const grant=await store.authorizeOperations({task_id:task.task_id,policy:policy(),scope_sha256:'a'.repeat(64),expires_at:new Date(Date.now()+3600000).toISOString()});
 return {root,store,task_id:task.task_id,grant,app,desktop};
}

// Local-process contracts only; actual SDK model/recovery evidence is separate below.
test('BF-R07/13 E05-a: physically unresolved work blocks correction and new admission; Stop fences late success',async()=>{
 const f=await fixture(),request={task_id:f.task_id,grant_id:f.grant.grant_id,kind:'preparation',stage:'prepare',input_sha256:'c'.repeat(64)};
 const first=await f.store.reserveOperation(request);await f.store.issueOperation({task_id:f.task_id,execution_id:first.execution_id});
 await f.store.settleOperation({task_id:f.task_id,execution_id:first.execution_id,physical:'unresolved',outcome:'conversion_failure',usage:unknown()});
 await assert.rejects(()=>f.store.reserveOperation(request),{code:'PHYSICAL_PENDING'});
 await f.store.settleOperation({task_id:f.task_id,execution_id:first.execution_id,physical:'settled',outcome:'conversion_failure',usage:unknown()});
 const correction=await f.store.reserveOperation(request);assert.equal(correction.execution_index,1);assert.equal(correction.operation_id,first.operation_id);
 await f.store.issueOperation({task_id:f.task_id,execution_id:correction.execution_id});
 await f.app.stop(f.task_id);
 const late=await f.store.settleOperation({task_id:f.task_id,execution_id:correction.execution_id,physical:'settled',outcome:'succeeded',usage:unknown()});
 assert.equal(late.outcome,'stopped');await assert.rejects(()=>f.store.reserveOperation(request),{code:'AUTHORITY_REQUIRED'});
 const state=await f.store.readOperations({task_id:f.task_id});assert.equal(state.totals.local_runs,'2');assert.equal(state.totals.calls,'0');assert.equal(state.operations.length,1);
});

test('BF-R07/13 E05-b: local Stop receipt survives unknown response and readback has no expiry effects',async()=>{
 const f=await fixture();
 const stop=Reflect.get(f.store,'stopBrowserTask') as (x:unknown)=>Promise<{command_id:string;epoch:number;status:string}>;
 const snapshot=Reflect.get(f.store,'readBrowserTask') as (x:unknown)=>Promise<{task: {epoch:number;status:string};question:string}>;
 const receipt=Reflect.get(f.store,'readBrowserReceipt') as (x:unknown)=>Promise<unknown>;
 assert.equal(typeof stop,'function','D5 Stop needs a transactionally durable command receipt');
 assert.equal(typeof snapshot,'function');assert.equal(typeof receipt,'function');
 const reserved=await f.store.reserveOperation({task_id:f.task_id,grant_id:f.grant.grant_id,kind:'preparation',stage:'prepare',input_sha256:'e'.repeat(64)});
 const command={task_id:f.task_id,command_id:randomUUID()},first=await stop(command);
 assert.equal(first.status,'stopped');assert.equal(first.epoch,1);
 const reopened=createLocalMembershipTaskStore(f.root);
 assert.deepEqual(await Reflect.get(reopened,'stopBrowserTask')(command),first);
 assert.deepEqual(await receipt(command),first);
 const state=await f.store.readOperations({task_id:f.task_id});assert.equal(state.totals.unresolved,0);assert.equal(state.totals.calls,'0');assert.equal(state.usage[0].outcome,'stopped');
 await assert.rejects(()=>f.store.issueOperation({task_id:f.task_id,execution_id:reserved.execution_id}),{code:'AUTHORITY_REQUIRED'});
 const before=readFileSync(join(f.root,'.xanthil/desktop/state.sqlite'));
 const view=await snapshot({task_id:f.task_id});assert.equal(view.question,'合成会员任务');assert.equal(view.task.epoch,1);
 assert.deepEqual(readFileSync(join(f.root,'.xanthil/desktop/state.sqlite')),before);
 assert.equal(await receipt({task_id:f.task_id,command_id:randomUUID()}),null);
});

test('BF-R07/13 E05-b: existing Application Stop also closes a never-issued browser reservation',async()=>{
 const f=await fixture();
 await f.store.reserveOperation({task_id:f.task_id,grant_id:f.grant.grant_id,kind:'preparation',stage:'prepare',input_sha256:'f'.repeat(64)});
 await f.app.stop(f.task_id);
 const state=await f.store.readOperations({task_id:f.task_id});
 assert.equal(state.totals.unresolved,0,'no physical request was issued, so Stop must not leave a permanent occupied slot');
 assert.equal(state.totals.calls,'0');assert.equal(state.usage[0].outcome,'stopped');
});


test('BF-R04/08/13 E02-c: source selection persists actual originals and extraction across pure reopen',async()=>{
 const f=await fixture();
 assert.equal(typeof Reflect.get(f.store,'saveSourceSet'),'function','durable multi-source consumer missing');
 const {createMemberSourcePreparation}=await import('../../../adapters/analytics-duckdb/member-source-inspection.ts');
 const {browserSourceFixture,browserBindingFixture,browserCandidateFixture}=await import('../../fixtures/xanthil-desktop/browser-sources.ts');
 const prep=createMemberSourcePreparation({pythonExecutable:join(process.env.JUANERAI_TOOLCHAIN_BIN!,'python3'),pythonVersion:'3.14.4'});
 const app=createMemberSourcesApplication(f.store,prep.inspectSources),sources=browserSourceFixture();
 const original=sources.map(s=>Buffer.from(s.bytes));
 const request={version:'1.0',task_id:f.task_id,command_id:randomUUID(),expected_row_version:(await f.store.read(f.task_id)).row_version,sources};
 const saved=await app.select(request,new AbortController().signal);
 assert.equal(saved.version,'1.0');assert.equal(saved.sources.length,3);assert.equal(saved.inspection.sources[1].sheets.length,2);
 assert.deepEqual(await app.select(request,new AbortController().signal),saved,'same command returns same source version');
 const reopened=createLocalMembershipTaskStore(f.root),reader=createMemberSourcesApplication(reopened,prep.inspectSources);
 const before=readFileSync(join(f.root,'.xanthil/desktop/state.sqlite'));
 const value=await reader.read(f.task_id,saved.id);
 assert.deepEqual(value.source_set,saved);assert.deepEqual(value.sources.map(s=>Buffer.from(s.bytes)),original);
 assert.deepEqual(readFileSync(join(f.root,'.xanthil/desktop/state.sqlite')),before);
 const qualified=await prep.qualifySources({sources:value.sources,bindings:browserBindingFixture(sources),candidate:browserCandidateFixture(),cancellation_signal:new AbortController().signal,deadline_seconds:10});
 assert.equal(qualified.source_set.sources.length,3);assert.equal(qualified.lineage.length,8);
 await assert.rejects(()=>reader.read(randomUUID(),saved.id),{code:'NOT_FOUND'});
 await assert.rejects(()=>app.select({...request,sources:[...sources].reverse()},new AbortController().signal),{code:'COMMAND_CONFLICT'});
 await assert.rejects(()=>app.select({...request,command_id:randomUUID()},new AbortController().signal),{code:'STALE_REVISION'});
 const {writeFileSync,chmodSync}=await import('node:fs');
 const damaged=join(f.root,'.xanthil/desktop/member-sources',saved.id,saved.sources[0].source_id+'.csv');
 chmodSync(damaged,0o600);writeFileSync(damaged,'tampered');
 await assert.rejects(()=>reader.read(f.task_id,saved.id),{code:'INTEGRITY_BLOCKED'});
});


test('BF-R04/08 E02-c: cancelled, stopped, pending and unknown source selection never publishes',async()=>{
 const f=await fixture();
 const {createMemberSourcePreparation}=await import('../../../adapters/analytics-duckdb/member-source-inspection.ts');
 const {browserSourceFixture}=await import('../../fixtures/xanthil-desktop/browser-sources.ts');
 const prep=createMemberSourcePreparation({pythonExecutable:join(process.env.JUANERAI_TOOLCHAIN_BIN!,'python3'),pythonVersion:'3.14.4'});
 const app=createMemberSourcesApplication(f.store,prep.inspectSources);
 const request={version:'1.0',task_id:f.task_id,command_id:randomUUID(),expected_row_version:(await f.store.read(f.task_id)).row_version,sources:browserSourceFixture()};
 const {existsSync}=await import('node:fs');const base=join(f.root,'.xanthil/desktop/member-sources');
 await assert.rejects(()=>app.select(request,AbortSignal.abort()),{code:'CANCELLED'});
 await assert.rejects(()=>app.select({...request,version:'2.0'},new AbortController().signal));
 const reservation=await f.store.reserveOperation({task_id:f.task_id,grant_id:f.grant.grant_id,kind:'preparation',stage:'prepare',input_sha256:'7'.repeat(64)});
 await assert.rejects(()=>app.select(request,new AbortController().signal),{code:'PHYSICAL_PENDING'});
 assert.equal(existsSync(base),false);
 await f.app.stop(f.task_id);
 await assert.rejects(async()=>app.select({...request,expected_row_version:(await f.store.read(f.task_id)).row_version},new AbortController().signal),{code:'AUTHORITY_REQUIRED'});
 assert.equal(existsSync(base),false);
 assert.equal((await f.store.readOperations({task_id:f.task_id})).usage.find(u=>u.execution_id===reservation.execution_id)?.outcome,'stopped');
});

test('BF-CAP04 E02-c: source reselection preserves originals; missing, symlink and hardlink snapshots reject',async()=>{
 const {createMemberSourcePreparation}=await import('../../../adapters/analytics-duckdb/member-source-inspection.ts');
 const {browserSourceFixture}=await import('../../fixtures/xanthil-desktop/browser-sources.ts');
 const {unlinkSync,symlinkSync,linkSync}=await import('node:fs');
 for(const variant of ['missing','symlink','hardlink']){
  const f=await fixture(),prep=createMemberSourcePreparation({pythonExecutable:join(process.env.JUANERAI_TOOLCHAIN_BIN!,'python3'),pythonVersion:'3.14.4'}),app=createMemberSourcesApplication(f.store,prep.inspectSources);
  const sources=browserSourceFixture(),request={version:'1.0',task_id:f.task_id,command_id:randomUUID(),expected_row_version:(await f.store.read(f.task_id)).row_version,sources};
  const first=await app.select(request,new AbortController().signal);
  const next=await app.select({...request,command_id:randomUUID(),expected_row_version:(await f.store.read(f.task_id)).row_version},new AbortController().signal);
  assert.notEqual(first.id,next.id);assert.deepEqual((await app.read(f.task_id,first.id)).source_set,first);
  const file=(set:typeof first)=>join(f.root,'.xanthil/desktop/member-sources',set.id,set.sources[0].source_id+'.csv');
  unlinkSync(file(next));
  if(variant==='symlink')symlinkSync(file(first),file(next));
  if(variant==='hardlink')linkSync(file(first),file(next));
  await assert.rejects(()=>app.read(f.task_id,next.id),{code:'INTEGRITY_BLOCKED'},variant);
 }
});

test('BF-R04/07/13 E03-e: actual missing executable failure reconciles its durable preparation attempt',async()=>{
 const f=await fixture();
 const {createMemberSourcePreparation}=await import('../../../adapters/analytics-duckdb/member-source-inspection.ts');
 const {createMemberPreparationApplication}=await import('../../../packages/application/member-preparation.ts');
 const {browserSourceFixture,browserBindingFixture}=await import('../../fixtures/xanthil-desktop/browser-sources.ts');
 const {taskHash}=await import('../../../packages/product-core/member-task.ts');
 const inspector=createMemberSourcePreparation({pythonExecutable:join(process.env.JUANERAI_TOOLCHAIN_BIN!,'python3'),pythonVersion:'3.14.4'});
 const sources=browserSourceFixture(),selected=await createMemberSourcesApplication(f.store,inspector.inspectSources).select({version:'1.0',task_id:f.task_id,command_id:randomUUID(),expected_row_version:(await f.store.read(f.task_id)).row_version,sources},new AbortController().signal);
 const runtime=createMemberSourcePreparation({pythonExecutable:join(f.root,'never-created-python'),pythonVersion:'3.14.4'});
 const app=createMemberPreparationApplication(f.store,runtime);
 const input={version:'1.0',task_id:f.task_id,source_set_id:selected.id,grant_id:f.grant.grant_id,bindings:browserBindingFixture(sources),code:'raise SystemExit(0)\n'};
 await assert.rejects(()=>app.prepare(input,new AbortController().signal),{code:'AUTHORITY_REQUIRED'});
 assert.equal((await f.store.readOperations({task_id:f.task_id})).usage.length,0);
 const grant=await f.store.authorizeOperations({task_id:f.task_id,policy:policy(),scope_sha256:taskHash(selected),expires_at:new Date(Date.now()+3600000).toISOString()});input.grant_id=grant.grant_id;
 await assert.rejects(()=>app.prepare({...input,version:'future'},new AbortController().signal));
 await assert.rejects(()=>app.prepare(input,AbortSignal.abort()),{code:'CANCELLED'});
 assert.equal((await f.store.readOperations({task_id:f.task_id})).usage.length,0);
 await assert.rejects(()=>app.prepare(input,new AbortController().signal),{code:'ISOLATION_UNAVAILABLE'});
 const reopened=createLocalMembershipTaskStore(f.root),state=await reopened.readOperations({task_id:f.task_id});
 assert.equal(state.usage.length,1);assert.equal(state.totals.unresolved,0);assert.equal(state.totals.local_runs,'1');assert.equal(state.totals.calls,'0');
 assert.equal(state.usage[0].outcome,'permanent_failure');assert.equal(state.totals.input_tokens.unknown,0);
 const read=Reflect.get(reopened,'readPreparationAttempt');assert.equal(typeof read,'function');
 const before=readFileSync(join(f.root,'.xanthil/desktop/state.sqlite'));
 const attempt=await read({task_id:f.task_id,execution_id:state.usage[0].execution_id});
 assert.equal(attempt.status,'failed');assert.equal(attempt.source_set_id,selected.id);assert.equal(attempt.failure_code,'ISOLATION_UNAVAILABLE');assert.equal(attempt.physical_status,'not_started');
 assert.deepEqual(readFileSync(join(f.root,'.xanthil/desktop/state.sqlite')),before);
 await assert.rejects(()=>app.prepare(input,new AbortController().signal),{code:'RETRY_EXHAUSTED'});
});

test('BF-R07/13 E03-e: raw failure flags and another execution cannot release a preparation slot',async t=>{
 for(const mode of ['caller-copy','other-execution'] as const)await t.test(mode,async()=>{
  const f=await fixture();
  const {createMemberSourcePreparation}=await import('../../../adapters/analytics-duckdb/member-source-inspection.ts');
  const {createMemberPreparationApplication}=await import('../../../packages/application/member-preparation.ts');
  const {browserSourceFixture,browserBindingFixture}=await import('../../fixtures/xanthil-desktop/browser-sources.ts');
  const {taskHash}=await import('../../../packages/product-core/member-task.ts');
  const real=createMemberSourcePreparation({pythonExecutable:join(process.env.JUANERAI_TOOLCHAIN_BIN!,'python3'),pythonVersion:'3.14.4'}),sources=browserSourceFixture();
  const selected=await createMemberSourcesApplication(f.store,real.inspectSources).select({version:'1.0',task_id:f.task_id,command_id:randomUUID(),expected_row_version:(await f.store.read(f.task_id)).row_version,sources},new AbortController().signal);
  const grant=await f.store.authorizeOperations({task_id:f.task_id,policy:policy(),scope_sha256:taskHash(selected),expires_at:new Date(Date.now()+3600000).toISOString()});
  const runtime={...real,async executePreparation(input:unknown):Promise<never>{
   const request=input as Record<string,unknown>,context=request.operation_context as Record<string,unknown>;
   if(mode==='caller-copy')throw Object.assign(new Error('CANCELLED'),{code:'CANCELLED',physical_status:'not_started',operation_context:context});
   await real.executePreparation({...request,cancellation_signal:AbortSignal.abort(),operation_context:{...context,execution_id:randomUUID()}});
   throw new Error('unreachable');
  }};
  const app=createMemberPreparationApplication(f.store,runtime),request={version:'1.0',task_id:f.task_id,source_set_id:selected.id,grant_id:grant.grant_id,bindings:browserBindingFixture(sources),code:'raise SystemExit(0)\n'};
  await assert.rejects(()=>app.prepare(request,new AbortController().signal),{code:'CANCELLED'});
  const reopened=createLocalMembershipTaskStore(f.root),state=await reopened.readOperations({task_id:f.task_id});
  assert.equal(state.totals.unresolved,1);assert.equal(state.usage[0].phase,'unresolved');
  assert.equal((await reopened.readPreparationAttempt({task_id:f.task_id,execution_id:state.usage[0].execution_id})).status,'unknown');
  await assert.rejects(()=>app.prepare(request,new AbortController().signal),{code:'PHYSICAL_PENDING'});
 });
});

test('BF-R04/07/08 E03-f: a model-shaped successful output cannot publish Preparation or settle physical work',async()=>{
 const f=await fixture();
 const {createMemberSourcePreparation}=await import('../../../adapters/analytics-duckdb/member-source-inspection.ts');
 const {createMemberPreparationApplication}=await import('../../../packages/application/member-preparation.ts');
 const {browserSourceFixture,browserBindingFixture,browserCandidateFixture}=await import('../../fixtures/xanthil-desktop/browser-sources.ts');
 const {taskHash}=await import('../../../packages/product-core/member-task.ts');
 const real=createMemberSourcePreparation({pythonExecutable:join(process.env.JUANERAI_TOOLCHAIN_BIN!,'python3'),pythonVersion:'3.14.4'}),sources=browserSourceFixture();
 const selected=await createMemberSourcesApplication(f.store,real.inspectSources).select({version:'1.0',task_id:f.task_id,command_id:randomUUID(),expected_row_version:(await f.store.read(f.task_id)).row_version,sources},new AbortController().signal);
 const grant=await f.store.authorizeOperations({task_id:f.task_id,policy:policy(),scope_sha256:taskHash(selected),expires_at:new Date(Date.now()+3600000).toISOString()});
 const app=createMemberPreparationApplication(f.store,{...real,async executePreparation(){return {candidate:browserCandidateFixture(),receipt:{version:'1.0',status:'unqualified',physical_settled:true}};}});
 await assert.rejects(()=>app.prepare({version:'1.0',task_id:f.task_id,source_set_id:selected.id,grant_id:grant.grant_id,bindings:browserBindingFixture(sources),code:'pass\n'},new AbortController().signal),{code:'PREPARATION_PROVENANCE_INVALID'});
 const ledger=await f.store.readOperations({task_id:f.task_id});assert.equal(ledger.totals.unresolved,1);
 assert.equal((await f.store.readPreparationAttempt({task_id:f.task_id,execution_id:ledger.usage[0].execution_id})).status,'unknown');
 await assert.rejects(()=>Reflect.get(f.store,'readQualifiedPreparation')({task_id:f.task_id,execution_id:ledger.usage[0].execution_id}),{code:'NOT_FOUND'});
});


test('BF-R07/08/13 E04-b: new SourceSet cannot bypass Preparation/grant guard through legacy Confirm1',async()=>{
 const f=await fixture();
 const {createMemberSourcePreparation}=await import('../../../adapters/analytics-duckdb/member-source-inspection.ts');
 const {browserSourceFixture,browserCandidateFixture}=await import('../../fixtures/xanthil-desktop/browser-sources.ts');
 const {fixtureSelection}=await import('../../fixtures/xanthil-desktop/member-analysis.ts');
 const real=createMemberSourcePreparation({pythonExecutable:join(process.env.JUANERAI_TOOLCHAIN_BIN!,'python3'),pythonVersion:'3.14.4'}),sources=browserSourceFixture();
 await createMemberSourcesApplication(f.store,real.inspectSources).select({version:'1.0',task_id:f.task_id,command_id:randomUUID(),expected_row_version:(await f.store.read(f.task_id)).row_version,sources},new AbortController().signal);
 const task=await f.app.read(f.task_id),candidate=browserCandidateFixture(),source_files={members:{display_name:'members.csv',bytes:candidate.members_bytes},orders:{display_name:'orders.csv',bytes:candidate.orders_bytes}};
 const base={contract_version:'1.0',...task.owner,expected_row_version:task.case.revision!.row_version,source_files};
 const initial=await f.desktop.inspectImportFiles(base),inspection=await f.desktop.inspectImportFiles({...base,inspection_token:initial.inspection_token,configuration:fixtureSelection()});
 const before=readFileSync(join(f.root,'.xanthil/desktop/state.sqlite'));
 await assert.rejects(()=>f.desktop.confirmRevision({...base,command_id:randomUUID(),inspection_token:inspection.inspection_token,confirmation:{...fixtureSelection(),issue_treatments:inspection.reviewable_issues.map(x=>({code:x.code,count:x.count,treatment:x.treatment_options[0]})),hypothesis_id:'current_repurchase_rate_lower_than_comparison',method_id:'membership_repurchase_comparison',method_version:'1.0',authority_confirmed:true,issues_confirmed:true,plan_confirmed:true}}),{code:'AUTHORITY_REQUIRED'});
 assert.deepEqual(readFileSync(join(f.root,'.xanthil/desktop/state.sqlite')),before);
 assert.equal((await f.desktop.readProjection(task.owner)).confirmation,null);
});


test('BF-R07 E05-k: analysis uses stable local operation without borrowing model retry or preparation correction',async()=>{
 const f=await fixture(),request={task_id:f.task_id,grant_id:f.grant.grant_id,kind:'analysis',stage:'calculate',input_sha256:'1'.repeat(64)};
 const first=await f.store.reserveOperation(request);await f.store.issueOperation({task_id:f.task_id,execution_id:first.execution_id});
 let ledger=await f.store.readOperations({task_id:f.task_id});assert.equal(ledger.totals.calls,'0');assert.equal(ledger.totals.local_runs,'1');
 await f.store.settleOperation({task_id:f.task_id,execution_id:first.execution_id,physical:'unresolved',outcome:'temporary_failure',usage:unknown()});
 await assert.rejects(()=>f.store.reserveOperation({...request,input_sha256:'2'.repeat(64)}),{code:'PHYSICAL_PENDING'});
 await f.store.settleOperation({task_id:f.task_id,execution_id:first.execution_id,physical:'settled',outcome:'temporary_failure',usage:unknown()});
 await assert.rejects(()=>f.store.reserveOperation(request),{code:'RETRY_EXHAUSTED'});
 const renewed=await f.store.authorizeOperations({task_id:f.task_id,policy:policy(),scope_sha256:'a'.repeat(64),expires_at:new Date(Date.now()+3600000).toISOString()});
 await assert.rejects(()=>f.store.reserveOperation({...request,grant_id:renewed.grant_id}),{code:'RETRY_EXHAUSTED'});
 const next={...request,grant_id:renewed.grant_id,input_sha256:'2'.repeat(64)},second=await f.store.reserveOperation(next);await f.store.issueOperation({task_id:f.task_id,execution_id:second.execution_id});await f.store.settleOperation({task_id:f.task_id,execution_id:second.execution_id,physical:'settled',outcome:'succeeded',usage:unknown()});
 assert.equal((await f.store.reserveOperation(next)).execution_id,second.execution_id);ledger=await createLocalMembershipTaskStore(f.root).readOperations({task_id:f.task_id});assert.equal(ledger.totals.local_runs,'2');assert.equal(ledger.totals.calls,'0');assert.equal(ledger.totals.unresolved,0);
 await assert.rejects(()=>f.store.reserveOperation({...next,stage:'correct_preparation'}));
});


test('BF-R07/08 E06-c: service exit fences durable authority without inventing physical settlement',async()=>{
 const f=await fixture(),state=await f.store.read(f.task_id),op=await f.store.reserveOperation({task_id:f.task_id,grant_id:f.grant.grant_id,kind:'preparation',stage:'prepare',input_sha256:'8'.repeat(64)});await f.store.issueOperation({task_id:f.task_id,execution_id:op.execution_id});
 const {createBrowserMembershipWorkspaceApplication}=await import('../../../packages/application/browser-membership.ts'),{startBrowserMembershipServer}=await import('../../../apps/browser/local-server.ts'),workspace=createBrowserMembershipWorkspaceApplication({store:f.store,tasks:f.app,project_id:state.owner.project_id,sources:{async select(){assert.fail('no upload');},read:(task_id,source_set_id)=>f.store.readSourceSet({task_id,source_set_id})}}),server=await startBrowserMembershipServer({store:f.store,workspace});await server.close();const view=await f.store.readBrowserTask({task_id:f.task_id});assert.equal(view.task.status,'stopped');assert.equal(view.task.epoch,state.epoch+1);assert.equal(view.operations.totals.local_runs,'1');assert.equal(view.operations.totals.calls,'0');assert.equal(view.operations.totals.unresolved,1);await assert.rejects(()=>f.store.reserveOperation({task_id:f.task_id,grant_id:f.grant.grant_id,kind:'preparation',stage:'prepare',input_sha256:'9'.repeat(64)}));const reopened=createLocalMembershipTaskStore(f.root),before=readFileSync(join(f.root,'.xanthil/desktop/state.sqlite'));await reopened.readBrowserTask({task_id:f.task_id});assert.deepEqual(readFileSync(join(f.root,'.xanthil/desktop/state.sqlite')),before);
});

test('BF-R07/08 D5 E06-f: startup fences old epoch and preserves issued work as physical UNKNOWN',async()=>{
 const f=await fixture(),{registerCreatedBrowserProject,reopenBrowserProject}=await import('../../../adapters/storage-local/browser-project-origin.ts'),directory=join(f.root,'native-origin-test');mkdirSync(directory);const state=await f.store.read(f.task_id),lease=registerCreatedBrowserProject(directory,f.root,state.owner.project_id);
 const op=await f.store.reserveOperation({task_id:f.task_id,grant_id:f.grant.grant_id,kind:'preparation',stage:'prepare',input_sha256:'7'.repeat(64)});await f.store.issueOperation({task_id:f.task_id,execution_id:op.execution_id});lease.close();
 const recovered=reopenBrowserProject(directory,f.root);try{storage.fenceReopenedBrowserProject(recovered);const current=await f.store.read(f.task_id),ledger=await f.store.readOperations({task_id:f.task_id});assert.equal(current.epoch,state.epoch+1);assert.equal(current.status,'interrupted');assert.equal(ledger.totals.local_runs,'1');assert.equal(ledger.totals.calls,'0');assert.equal(ledger.totals.unresolved,1);assert.equal(ledger.usage[0].phase,'unresolved');assert.equal(ledger.usage[0].outcome,null);await assert.rejects(()=>f.store.reserveOperation({task_id:f.task_id,grant_id:f.grant.grant_id,kind:'preparation',stage:'prepare',input_sha256:'7'.repeat(64)}));const before=readFileSync(join(f.root,'.xanthil/desktop/state.sqlite'));await f.store.readOperations({task_id:f.task_id});assert.deepEqual(readFileSync(join(f.root,'.xanthil/desktop/state.sqlite')),before);storage.fenceReopenedBrowserProject(recovered);assert.equal((await f.store.read(f.task_id)).epoch,current.epoch);}finally{recovered.close();}
});

test('BF-R07/08 D5 E06-h: actual reopened Profile serves UNKNOWN without release or automatic dispatch',async()=>{
 const f=await fixture(),{registerCreatedBrowserProject}=await import('../../../adapters/storage-local/browser-project-origin.ts'),{createPersonalBrowserMembershipProfile}=await import('../../../profiles/personal/browser-membership.ts'),{createLocalModelAccess}=await import('../../../packages/application/provider-settings.ts'),directory=join(f.root,'native-recovery-domain');mkdirSync(directory);const state=await f.store.read(f.task_id),lease=registerCreatedBrowserProject(directory,f.root,state.owner.project_id),request={task_id:f.task_id,grant_id:f.grant.grant_id,kind:'preparation' as const,stage:'prepare' as const,input_sha256:'6'.repeat(64)},op=await f.store.reserveOperation(request);await f.store.issueOperation({task_id:f.task_id,execution_id:op.execution_id});await f.store.settleOperation({task_id:f.task_id,execution_id:op.execution_id,physical:'unresolved',outcome:'temporary_failure',usage:unknown()});lease.close();
 let calls=0;const bin=process.env.JUANERAI_TOOLCHAIN_BIN!,profile=await createPersonalBrowserMembershipProfile({projectRoot:f.root,originDirectory:directory,mode:'reopen',display_name:'Synthetic interrupted project',toolchain:{pythonExecutable:join(bin,'python3'),pythonVersion:'3.14.4',duckdbExecutable:join(bin,'duckdb'),duckdbVersion:'1.5.2'},model:{access:createLocalModelAccess(false),policy:{async read(){return f.grant.policy;}}}});
 const allow=Reflect.get(globalThis,Symbol.for('Mini.D006.ownedLoopback'));assert.equal(typeof allow,'function');const release=allow(profile.origin);try{const boot=await fetch(profile.origin+'/v1/bootstrap',{method:'POST',headers:{origin:profile.origin,'content-type':'application/json'},body:JSON.stringify({token:profile.bootstrap})}),cookie=boot.headers.get('set-cookie')!.split(';')[0];assert.equal(boot.status,200);const before=readFileSync(join(f.root,'.xanthil/desktop/state.sqlite'));for(let n=0;n<2;n++){assert.equal((await fetch(profile.origin+'/v1/tasks',{headers:{cookie}})).status,200);}assert.deepEqual(readFileSync(join(f.root,'.xanthil/desktop/state.sqlite')),before);const ledger=await f.store.readOperations({task_id:f.task_id});assert.equal(ledger.totals.local_runs,'1');assert.equal(ledger.totals.calls,'0');assert.equal(ledger.totals.unresolved,1);assert.equal(ledger.usage[0].execution_id,op.execution_id);await assert.rejects(()=>f.store.reserveOperation(request));assert.equal(calls,0);}finally{const outcome=await profile.close();release();assert.equal(outcome.unresolved,1);}const final=await createLocalMembershipTaskStore(f.root).readOperations({task_id:f.task_id});assert.equal(final.totals.unresolved,1);assert.equal(calls,0);
});


test('BF-R07 current actual Adapter/C membership requests exceed ten with uncapped durable meter; passive reopen never reconstructs model attempts',async()=>{
 const {createPiProfessionalAgent}=await import('../../../adapters/agent-pi/professional-agent.ts'),{offlineCredentials,offlineResponse}=await import('../../fixtures/xanthil-desktop/offline-professional-provider.ts');const projectRoot=mkdtempSync(join(process.env.JUANERAI_NEWARCH_SHORT_ROOT!,'meter-')),task_id=randomUUID();let physical=0,effects=0;const config={projectRoot,analysisModel:'mimo-v2.6-flash' as const,authorizeWork:(id:string)=>id===task_id,credentials:offlineCredentials,fetch:async(_u:unknown,init?:RequestInit)=>{physical++;const dto=JSON.parse(String(init!.body));assert.equal(dto.model,'mimo-v2.6-pro');assert.equal(dto.max_tokens??dto.max_completion_tokens,32768);return physical<=12?offlineResponse(physical,[{name:'read_owned',args:{}}]):offlineResponse(physical);}},agent=createPiProfessionalAgent(config),identity={task_id,revision:'1',operation_id:randomUUID(),run_id:randomUUID(),attempt_id:randomUUID(),grant_id:randomUUID(),scope_sha256:'a'.repeat(64),config_sha256:await agent.configuration()},result=await agent.advance({identity,command_id:identity.operation_id,purpose:'membership',prompt:'只读取本次合成能力，没有业务写入。',system:'正常多轮，逐次计量。',capabilities:async()=>[{name:'read_owned',description:'owned synthetic read',effect:'read',parameters:{type:'object',properties:{},additionalProperties:false},execute:async()=>({value:++effects})}],authorize:()=>true,signal:new AbortController().signal});await agent.assertCompleted(identity,result.completion);await agent.waitForIdle();assert.equal(physical,13);assert.equal(effects,12);const before=await agent.diagnostics(identity,'membership');assert.equal(before.meter!.model_attempts,13);assert.equal(before.meter!.recorded_input_tokens,91);assert.equal(before.meter!.charged_output_tokens,39);assert.equal(before.meter!.unconfirmed_output_tokens,0);assert.equal(before.unconfirmed_effects,false);const reopened=createPiProfessionalAgent(config);assert.deepEqual(await reopened.diagnostics(identity,'membership'),before);assert.equal(physical,13);assert.equal(effects,12);
});
