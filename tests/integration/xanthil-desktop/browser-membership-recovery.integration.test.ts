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
const policy=():import('../../../packages/product-core/member-operation.ts').OperationPolicy=>({version:'1.0',id:randomUUID(),revision:'1',provider:'xiaomi-token-plan-cn',model:'mimo-v2.6-pro',purpose:'membership_analysis',consumption_policy:{mode:'uncapped_metered'},model_retries:1,preparation_corrections:1,approval_reference:'synthetic-controller-decision',max_input_bytes:12000,call_output_tokens:2048,call_ms:60000,process_seconds:30});
const unknown=()=>({input_tokens:{kind:'unknown',reason:'synthetic-no-provider'},output_tokens:{kind:'unknown',reason:'synthetic-no-provider'},active_ms:{kind:'known',value:'7'},wait_ms:{kind:'known',value:'0'}});
async function fixture(){
 const base=browserEvidenceRoot;const parent=mkdtempSync(join(base,'ledger-')),root=join(parent,'project');
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

test('BF-R07/13 E05-a: retry entitlement and UNKNOWN usage persist in the real project across Store reopen',async()=>{
 const f=await fixture(),request={task_id:f.task_id,grant_id:f.grant.grant_id,kind:'model',stage:'clarify',input_sha256:'b'.repeat(64)};
 const first=await f.store.reserveOperation(request);assert.equal(first.execution_index,0);
 await f.store.issueOperation({task_id:f.task_id,execution_id:first.execution_id});
 await f.store.settleOperation({task_id:f.task_id,execution_id:first.execution_id,physical:'settled',outcome:'temporary_failure',usage:unknown()});
 const reopened=createLocalMembershipTaskStore(f.root) as OperationStore;
 const retry=await reopened.reserveOperation(request);assert.equal(retry.operation_id,first.operation_id);assert.equal(retry.execution_index,1);
 await reopened.issueOperation({task_id:f.task_id,execution_id:retry.execution_id});
 await reopened.settleOperation({task_id:f.task_id,execution_id:retry.execution_id,physical:'settled',outcome:'temporary_failure',usage:unknown()});
 await assert.rejects(()=>reopened.reserveOperation(request),{code:'RETRY_EXHAUSTED'});
 const nextGrant=await reopened.authorizeOperations({task_id:f.task_id,policy:f.grant.policy,scope_sha256:'a'.repeat(64),expires_at:new Date(Date.now()+3600000).toISOString()});
 await assert.rejects(()=>reopened.reserveOperation({...request,grant_id:nextGrant.grant_id}),{code:'RETRY_EXHAUSTED'});
 const before=readFileSync(join(f.root,'.xanthil/desktop/state.sqlite')),state=await reopened.readOperations({task_id:f.task_id});
 assert.equal(state.usage.length,2);assert.equal(state.totals.calls,'2');assert.equal(state.totals.output_tokens.known,'0');assert.equal(state.totals.output_tokens.unknown,2);assert.equal(state.totals.unresolved,0);
 assert.deepEqual(readFileSync(join(f.root,'.xanthil/desktop/state.sqlite')),before,'readback must not change the project');
});

test('BF-R07 E05-a: settlement cannot erase measured consumption when the final amount is unknown',async()=>{
 const f=await fixture(),r=await f.store.reserveOperation({task_id:f.task_id,grant_id:f.grant.grant_id,kind:'model',stage:'clarify',input_sha256:'d'.repeat(64)});
 await f.store.issueOperation({task_id:f.task_id,execution_id:r.execution_id});
 await f.store.settleOperation({task_id:f.task_id,execution_id:r.execution_id,physical:'unresolved',outcome:'temporary_failure',usage:{...unknown(),output_tokens:{kind:'known',value:'17'}}});
 await f.store.settleOperation({task_id:f.task_id,execution_id:r.execution_id,physical:'settled',outcome:'temporary_failure',usage:unknown()});
 const state=await f.store.readOperations({task_id:f.task_id});assert.equal(state.totals.output_tokens.known,'17');assert.equal(state.totals.output_tokens.unknown,1);
});

test('BF-R07 E05-a: uncapped actual admission exceeds the legacy ten-call ceiling and reuses completed work',async()=>{
 const f=await fixture();let request;
 for(let n=0;n<12;n++){
  request={task_id:f.task_id,grant_id:f.grant.grant_id,kind:'model',stage:'clarify',input_sha256:createHash('sha256').update('synthetic distinct selected message '+n).digest('hex')};
  const r=await f.store.reserveOperation(request);await f.store.issueOperation({task_id:f.task_id,execution_id:r.execution_id});
  await f.store.settleOperation({task_id:f.task_id,execution_id:r.execution_id,physical:'settled',outcome:'succeeded',usage:unknown()});
 }
 const reused=await f.store.reserveOperation(request);assert.equal(reused.phase,'settled');assert.equal(reused.outcome,'succeeded');
 const state=await f.store.readOperations({task_id:f.task_id});assert.equal(state.totals.calls,'12');assert.equal(state.operations.length,12);assert.equal(state.usage.length,12);
});

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

test('BF-R07/13 E05-b: Stop receipt survives unknown response and readback has no expiry effects',async()=>{
 const f=await fixture();
 const stop=Reflect.get(f.store,'stopBrowserTask') as (x:unknown)=>Promise<{command_id:string;epoch:number;status:string}>;
 const snapshot=Reflect.get(f.store,'readBrowserTask') as (x:unknown)=>Promise<{task: {epoch:number;status:string};question:string}>;
 const receipt=Reflect.get(f.store,'readBrowserReceipt') as (x:unknown)=>Promise<unknown>;
 assert.equal(typeof stop,'function','D5 Stop needs a transactionally durable command receipt');
 assert.equal(typeof snapshot,'function');assert.equal(typeof receipt,'function');
 const reserved=await f.store.reserveOperation({task_id:f.task_id,grant_id:f.grant.grant_id,kind:'model',stage:'clarify',input_sha256:'e'.repeat(64)});
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
 await f.store.reserveOperation({task_id:f.task_id,grant_id:f.grant.grant_id,kind:'model',stage:'clarify',input_sha256:'f'.repeat(64)});
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


test('BF-R03/07 E05-d: model material grant is distinct from a source or preparation grant',async t=>{
 const f=await fixture();assert.equal(typeof Reflect.get(f.store,'authorizeMemberModel'),'function','E05-d requires durable exact material grant consumer');
 const {browserSourceFixture}=await import('../../fixtures/xanthil-desktop/browser-sources.ts'),{createMemberSourcePreparation}=await import('../../../adapters/analytics-duckdb/member-source-inspection.ts'),{createMembershipModelApplication}=await import('../../../packages/application/member-model.ts'),{createPiStoredCaseAssistantRuntime}=await import('../../../adapters/agent-pi/xiaomi-local.ts'),{createLocalModelAccess}=await import('../../../packages/application/provider-settings.ts');
 const inspection=createMemberSourcePreparation({pythonExecutable:join(process.env.JUANERAI_TOOLCHAIN_BIN!,'python3'),pythonVersion:'3.14.4'}),sourceApp=createMemberSourcesApplication(f.store,inspection.inspectSources),before=await f.store.read(f.task_id),selected=await sourceApp.select({version:'1.0',task_id:f.task_id,command_id:randomUUID(),expected_row_version:before.row_version,sources:browserSourceFixture()},new AbortController().signal);
 let calls=0,wire='';const net=await import('node:net');t.mock.method(net.Socket.prototype,'connect',()=>assert.fail('offline socket forbidden'));t.mock.method(globalThis,'fetch',async(_url:unknown,options:{body:string})=>{calls++;wire=options.body;const chunk={id:'synthetic-model-ledger',object:'chat.completion.chunk',created:0,model:'mimo-v2.6-pro',choices:[{index:0,delta:{role:'assistant',content:JSON.stringify({kind:'question',text:'请确认两期日期。'})},finish_reason:'stop'}],usage:{prompt_tokens:20,completion_tokens:4,total_tokens:24}};return new Response('data: '+JSON.stringify(chunk)+'\n\ndata: [DONE]\n\n',{headers:{'content-type':'text/event-stream'}});});
 const configuredPolicy=policy(),app=createMembershipModelApplication({store:f.store,runtime:createPiStoredCaseAssistantRuntime(()=> 'synthetic-only-key'),modelAccess:createLocalModelAccess(true),policy:async()=>configuredPolicy}),request={task_id:f.task_id,grant_id:f.grant.grant_id,stage:'clarify'};
 await assert.rejects(()=>app.run(request,new AbortController().signal),{code:'AUTHORITY_REQUIRED'});assert.equal(calls,0);
 const state=await f.store.read(f.task_id),grant=await f.store.authorizeMemberModel({version:'1.0',command_id:randomUUID(),task_id:f.task_id,source_set_id:selected.id,expected_row_version:state.row_version,epoch:state.epoch,policy:configuredPolicy,disclose_question:true,disclose_structure:true,expires_at:new Date(Date.now()+3600000).toISOString()});
 const beforePolicy=readFileSync(join(f.root,'.xanthil/desktop/state.sqlite'));await assert.rejects(()=>f.store.beginMemberModel({...request,grant_id:grant.grant_id,policy_sha256:'0'.repeat(64)}),{code:'MODEL_POLICY_CHANGED'});assert.deepEqual(readFileSync(join(f.root,'.xanthil/desktop/state.sqlite')),beforePolicy);
 const result=await app.run({...request,grant_id:grant.grant_id},new AbortController().signal);assert.equal(calls,1);assert.equal(result.output.kind,'question');assert.ok(wire.includes('member_id'));assert.equal(wire.includes('synthetic-only-key'),false);assert.equal(wire.includes('raw_rows'),false);
 const replay=await app.run({...request,grant_id:grant.grant_id},new AbortController().signal);assert.deepEqual(replay,result);assert.equal(calls,1);const ledger=await f.store.readOperations({task_id:f.task_id});assert.equal(ledger.totals.calls,'1');assert.equal(ledger.totals.input_tokens.known,'20');assert.equal(ledger.totals.output_tokens.known,'4');assert.equal(ledger.totals.unresolved,0);
 const reopened=createLocalMembershipTaskStore(f.root);assert.deepEqual((await reopened.readMemberModel({task_id:f.task_id,execution_id:result.context.execution_id})).result,result);const disk=readFileSync(join(f.root,'.xanthil/desktop/state.sqlite'));await assert.rejects(()=>app.run({...request,grant_id:grant.grant_id,payload:{rows:['forbidden']}},new AbortController().signal));assert.equal(calls,1);assert.deepEqual(readFileSync(join(f.root,'.xanthil/desktop/state.sqlite')),disk);
 const {DatabaseSync}=await import('node:sqlite'),db=new DatabaseSync(join(f.root,'.xanthil/desktop/state.sqlite'));const row=db.prepare('SELECT body_json FROM membership_model_attempts WHERE execution_id=?').get(result.context.execution_id)!,altered=JSON.parse(String(row.body_json));altered.payload.selected_text='changed after dispatch';db.prepare('UPDATE membership_model_attempts SET body_json=?,body_sha256=? WHERE execution_id=?').run(JSON.stringify(altered),taskHash(altered),result.context.execution_id);db.close();await assert.rejects(()=>reopened.readMemberModel({task_id:f.task_id,execution_id:result.context.execution_id}),{code:'INTEGRITY_BLOCKED'},'saved payload must resolve its actual operation identity, not just its own new hash');
});

async function modelFixture(){
 const f=await fixture(),{browserSourceFixture}=await import('../../fixtures/xanthil-desktop/browser-sources.ts'),{createMemberSourcePreparation}=await import('../../../adapters/analytics-duckdb/member-source-inspection.ts');
 const inspection=createMemberSourcePreparation({pythonExecutable:join(process.env.JUANERAI_TOOLCHAIN_BIN!,'python3'),pythonVersion:'3.14.4'}),sourceApp=createMemberSourcesApplication(f.store,inspection.inspectSources),before=await f.store.read(f.task_id),selected=await sourceApp.select({version:'1.0',task_id:f.task_id,command_id:randomUUID(),expected_row_version:before.row_version,sources:browserSourceFixture()},new AbortController().signal),state=await f.store.read(f.task_id);
 const grant=await f.store.authorizeMemberModel({version:'1.0',command_id:randomUUID(),task_id:f.task_id,source_set_id:selected.id,expected_row_version:state.row_version,epoch:state.epoch,policy:policy(),disclose_question:true,disclose_structure:true,expires_at:new Date(Date.now()+3600000).toISOString()});return {...f,selected,grant,request:{task_id:f.task_id,grant_id:grant.grant_id,stage:'clarify'}};
}
for(const permanentlyFails of [false,true])test(`BF-R07 E05-d: actual model consumer retries one settled transient failure (${permanentlyFails})`,async t=>{
 const f=await modelFixture(),{createMembershipModelApplication}=await import('../../../packages/application/member-model.ts'),{createPiStoredCaseAssistantRuntime}=await import('../../../adapters/agent-pi/xiaomi-local.ts'),{createLocalModelAccess}=await import('../../../packages/application/provider-settings.ts'),specifier='@earendil-works/pi-coding-agent',sdk=await import(specifier),{pathToFileURL}=await import('node:url'),ai=await import(pathToFileURL(join(sdk.getPackageDir(),'node_modules/@earendil-works/pi-ai/dist/index.js')).href);let calls=0;
 t.mock.method(sdk.ModelRuntime.prototype,'streamSimple',(model:Record<string,unknown>)=>{calls++;const stream=ai.createAssistantMessageEventStream();queueMicrotask(()=>stream.push(calls===1||permanentlyFails?{type:'error',reason:'error',error:{role:'assistant',content:[],stopReason:'error',errorMessage:'fetch failed'}}:{type:'done',reason:'stop',message:{role:'assistant',content:[{type:'text',text:JSON.stringify({kind:'question',text:'请确认期间。'})}],api:model.api,provider:model.provider,model:model.id,usage:{input:12,cacheRead:0,cacheWrite:0,output:3,totalTokens:15,cost:{total:0}},stopReason:'stop',timestamp:Date.now()}}));return stream;});
 const app=createMembershipModelApplication({store:f.store,runtime:createPiStoredCaseAssistantRuntime(()=> 'synthetic-retry-key'),modelAccess:createLocalModelAccess(true),policy:async()=>f.grant.policy});
 if(permanentlyFails){await assert.rejects(()=>app.run(f.request,new AbortController().signal),{code:'NETWORK_UNAVAILABLE'});await assert.rejects(()=>app.run(f.request,new AbortController().signal),{code:'RETRY_EXHAUSTED'});const state=await f.store.read(f.task_id),renewed=await f.store.authorizeMemberModel({version:'1.0',command_id:randomUUID(),task_id:f.task_id,source_set_id:f.selected.id,expected_row_version:state.row_version,epoch:state.epoch,policy:f.grant.policy,disclose_question:true,disclose_structure:true,expires_at:new Date(Date.now()+3600000).toISOString()});await assert.rejects(()=>app.run({...f.request,grant_id:renewed.grant_id},new AbortController().signal),{code:'RETRY_EXHAUSTED'},'new grant ID cannot reset the same failed logical work');}else assert.equal((await app.run(f.request,new AbortController().signal)).output.kind,'question');
 assert.equal(calls,2);const ledger=await f.store.readOperations({task_id:f.task_id});assert.equal(ledger.usage.length,2);assert.equal(ledger.usage[0].operation_id,ledger.usage[1].operation_id);assert.deepEqual(ledger.usage.map(u=>u.execution_index),[0,1]);assert.equal(ledger.totals.unresolved,0);
});

for(const mode of ['unobserved','copied','stop'] as const)test(`BF-R07/08 E05-d: model physical uncertainty and Stop fence (${mode})`,async t=>{
 const f=await modelFixture(),{createMembershipModelApplication}=await import('../../../packages/application/member-model.ts'),{createPiStoredCaseAssistantRuntime}=await import('../../../adapters/agent-pi/xiaomi-local.ts'),{createLocalModelAccess}=await import('../../../packages/application/provider-settings.ts'),specifier='@earendil-works/pi-coding-agent',sdk=await import(specifier),{pathToFileURL}=await import('node:url'),ai=await import(pathToFileURL(join(sdk.getPackageDir(),'node_modules/@earendil-works/pi-ai/dist/index.js')).href);let calls=0,entered!:()=>void,finish!:()=>void;const ready=new Promise<void>(r=>entered=r);
 t.mock.method(sdk.ModelRuntime.prototype,'streamSimple',(model:Record<string,unknown>)=>{calls++;if(mode==='unobserved')throw new Error('unobserved synthetic dispatch');const stream=ai.createAssistantMessageEventStream();finish=()=>stream.push({type:'done',reason:'stop',message:{role:'assistant',content:[{type:'text',text:JSON.stringify({kind:'question',text:'请确认期间。'})}],api:model.api,provider:model.provider,model:model.id,usage:{input:12,cacheRead:0,cacheWrite:0,output:3,totalTokens:15,cost:{total:0}},stopReason:'stop',timestamp:Date.now()}});entered();if(mode!=='stop')queueMicrotask(finish);return stream;});
 const original=createPiStoredCaseAssistantRuntime(()=> 'synthetic-physical-key'),runtime=mode==='copied'?{...original,async membershipTurn(input:import('../../../packages/product-core/member-model.ts').MembershipModelTurn){return structuredClone(await original.membershipTurn(input));}}:original,access=createLocalModelAccess(true),app=createMembershipModelApplication({store:f.store,runtime,modelAccess:access,policy:async()=>f.grant.policy});
 if(mode==='stop'){const pending=app.run(f.request,new AbortController().signal);await ready;await f.store.stopBrowserTask({task_id:f.task_id,command_id:randomUUID()});assert.ok(access.occupant?.());finish();await assert.rejects(pending,{code:'CANCELLED'});assert.equal(access.occupant?.(),null);}else{await assert.rejects(()=>app.run(f.request,new AbortController().signal),{code:'PHYSICAL_PENDING'});assert.ok(access.occupant?.());assert.equal(app.unresolvedExecutions().length,1);await assert.rejects(()=>app.run(f.request,new AbortController().signal),{code:'MODEL_BUSY'});}
 assert.equal(calls,1);const ledger=await f.store.readOperations({task_id:f.task_id}),attempt=await f.store.readMemberModel({task_id:f.task_id,execution_id:ledger.usage[0].execution_id});assert.equal(attempt.result,null);assert.equal(attempt.status,mode==='stop'?'stopped':'unknown');assert.equal(ledger.totals.unresolved,mode==='stop'?0:1);const reopened=createLocalMembershipTaskStore(f.root);assert.deepEqual(await reopened.readMemberModel({task_id:f.task_id,execution_id:ledger.usage[0].execution_id}),attempt);
 if(mode!=='stop')await assert.rejects(()=>reopened.beginMemberModel({...f.request,policy_sha256:taskHash(f.grant.policy)}),{code:'PHYSICAL_PENDING'});
});


for(const mode of ['question','proposal','stop'] as const)test(`BF-R04/06 E05-g: model output reaches real Preparation admission only when eligible (${mode})`,async t=>{
 const f=await modelFixture(),{createMembershipModelApplication}=await import('../../../packages/application/member-model.ts'),{createMemberPreparationApplication}=await import('../../../packages/application/member-preparation.ts'),{createPiStoredCaseAssistantRuntime}=await import('../../../adapters/agent-pi/xiaomi-local.ts'),{createLocalModelAccess}=await import('../../../packages/application/provider-settings.ts');
 const bindings=f.selected.inspection.sources.flatMap(s=>s.sheets.map(sheet=>({source_id:s.source_id,sheet_id:sheet.sheet_id,role:s.format==='csv'&&sheet.rows[0].cells.some(c=>c.value==='member_group')?'members':'orders',columns:Object.fromEntries(sheet.rows[0].cells.map(c=>[c.value,c.value]))})));
 const code='pass',output=mode==='question'?{kind:'question',text:'请确认有效订单状态和两期日期。'}:{kind:'preparation',bindings,code};let models=0,executions=0;
 t.mock.method(globalThis,'fetch',async()=>{models++;const chunk={id:'synthetic-auto-preparation',object:'chat.completion.chunk',created:0,model:'mimo-v2.6-pro',choices:[{index:0,delta:{role:'assistant',content:JSON.stringify(output)},finish_reason:'stop'}],usage:{prompt_tokens:20,completion_tokens:4,total_tokens:24}};return new Response('data: '+JSON.stringify(chunk)+'\n\ndata: [DONE]\n\n',{headers:{'content-type':'text/event-stream'}});});
 const net=await import('node:net');t.mock.method(net.Socket.prototype,'connect',()=>assert.fail('offline network forbidden'));
 const sentinel=Object.assign(new Error('bounded fake runtime did not launch'),{code:'SYNTHETIC_NOT_STARTED'});let context:import('../../../packages/ports/member-preparation.ts').PreparationContext|null=null;
 const preparation=createMemberPreparationApplication(f.store,{async executePreparation(input){executions++;assert.equal(Reflect.get(input as object,'code'),code);context=Reflect.get(input as object,'operation_context');throw sentinel;},describePreparationSuccess(){return null;},describePreparationFailure(error){return error===sentinel?{physical_status:'not_started',operation_context:context}:null;},async qualifySources(){assert.fail('not-started payload cannot qualify');}});
 const store=mode==='stop'?{...f.store,async readMemberModel(input:{task_id:string;execution_id:string}){const result=await f.store.readMemberModel(input);await f.store.stopBrowserTask({task_id:f.task_id,command_id:randomUUID()});return result;}}:f.store;
 const app=createMembershipModelApplication({store,runtime:createPiStoredCaseAssistantRuntime(()=> 'synthetic-workflow-key'),modelAccess:createLocalModelAccess(true),policy:async()=>f.grant.policy,preparation});const advance=Reflect.get(app,'prepare');assert.equal(typeof advance,'function','automatic preparation workflow is missing');
 const input={task_id:f.task_id,grant_id:f.grant.grant_id};
 if(mode==='question'){const result=await advance(input,new AbortController().signal);assert.equal(result.status,'waiting');assert.equal(result.result.output.kind,'question');if(result.result.output.kind!=='question')assert.fail();assert.equal(result.result.output.text,output.text);assert.equal(executions,0);}else await assert.rejects(()=>advance(input,new AbortController().signal),{code:mode==='stop'?'AUTHORITY_REQUIRED':'SYNTHETIC_NOT_STARTED'});
 assert.equal(models,1);assert.equal(executions,mode==='proposal'?1:0);const ledger=await f.store.readOperations({task_id:f.task_id});assert.equal(ledger.totals.unresolved,0);assert.equal(ledger.usage.length,mode==='proposal'?2:1);
});


test('BF-R01/03 E05-h: first text-only grant clarifies without sources and cannot dispatch preparation',async t=>{
 const f=await fixture(),{createMembershipModelApplication}=await import('../../../packages/application/member-model.ts'),{createPiStoredCaseAssistantRuntime}=await import('../../../adapters/agent-pi/xiaomi-local.ts'),{createLocalModelAccess}=await import('../../../packages/application/provider-settings.ts');
 let calls=0,wire='';const net=await import('node:net');t.mock.method(net.Socket.prototype,'connect',()=>assert.fail('offline sockets forbidden'));t.mock.method(globalThis,'fetch',async(_url:unknown,options:{body:string})=>{calls++;wire=options.body;const chunk={id:'synthetic-text-first',object:'chat.completion.chunk',created:0,model:'mimo-v2.6-pro',choices:[{index:0,delta:{role:'assistant',content:JSON.stringify({kind:'question',text:'请添加资料，以便核对字段及必要语义。'})},finish_reason:'stop'}],usage:{prompt_tokens:10,completion_tokens:4,total_tokens:14}};return new Response('data: '+JSON.stringify(chunk)+'\n\ndata: [DONE]\n\n',{headers:{'content-type':'text/event-stream'}});});
 const state=await f.store.read(f.task_id),configured=policy(),app=createMembershipModelApplication({store:f.store,runtime:createPiStoredCaseAssistantRuntime(()=> 'synthetic-text-key'),modelAccess:createLocalModelAccess(true),policy:async()=>configured}),command={version:'1.0',command_id:randomUUID(),task_id:f.task_id,source_set_id:null,expected_row_version:state.row_version,epoch:state.epoch,policy_sha256:taskHash(configured),disclose_question:true,disclose_structure:false,confirmed:true};
 for(const bad of [{...command,disclose_question:false},{...command,disclose_structure:true}])await assert.rejects(()=>app.authorize(bad));assert.equal(calls,0);
 const grant=await app.authorize(command);assert.equal(grant.created,true);assert.equal((await app.authorize(command)).created,false);
 await assert.rejects(()=>app.run({task_id:f.task_id,grant_id:grant.grant_id,stage:'generate_preparation'},new AbortController().signal),{code:'AUTHORITY_REQUIRED'});assert.equal(calls,0);
 const result=await app.run({task_id:f.task_id,grant_id:grant.grant_id,stage:'clarify'},new AbortController().signal);assert.equal(result.output.kind,'question');assert.equal(calls,1);const saved=await f.store.readMemberModel({task_id:f.task_id,execution_id:result.context.execution_id});assert.equal(saved.source_set_id,null);assert.equal(saved.payload.source_set_sha256,null);assert.deepEqual(saved.payload.structure,[]);assert.equal(saved.payload.selected_text,(await f.store.readBrowserTask({task_id:f.task_id})).question);assert.equal(wire.includes('member_id'),false);const beforeRead=readFileSync(join(f.root,'.xanthil/desktop/state.sqlite')),browser=await f.store.readBrowserTask({task_id:f.task_id});assert.equal(Reflect.get(browser,'model')?.question,'请添加资料，以便核对字段及必要语义。');assert.equal(Reflect.get(browser,'model')?.status,'succeeded');assert.equal(Object.hasOwn(browser.model!,'code'),false);assert.deepEqual(readFileSync(join(f.root,'.xanthil/desktop/state.sqlite')),beforeRead);
 assert.deepEqual((await createLocalMembershipTaskStore(f.root).readMemberModel({task_id:f.task_id,execution_id:result.context.execution_id})).result,result);await f.store.stopBrowserTask({task_id:f.task_id,command_id:randomUUID()});await assert.rejects(()=>app.run({task_id:f.task_id,grant_id:grant.grant_id,stage:'clarify'},new AbortController().signal));assert.equal(calls,1);
});


test('BF-R01/07/08 E05-i: authorization background work outlives HTTP ownership, collects terminal output and never restarts',async t=>{
 const f=await modelFixture(),module=await import('../../../packages/application/member-model.ts'),factory=Reflect.get(module,'createMembershipWorkflow');assert.equal(typeof factory,'function','composition-owned workflow missing');
 const {createPiStoredCaseAssistantRuntime}=await import('../../../adapters/agent-pi/xiaomi-local.ts'),{createLocalModelAccess}=await import('../../../packages/application/provider-settings.ts'),specifier='@earendil-works/pi-coding-agent',sdk=await import(specifier),{pathToFileURL}=await import('node:url'),ai=await import(pathToFileURL(join(sdk.getPackageDir(),'node_modules/@earendil-works/pi-ai/dist/index.js')).href);
 let calls=0,entered!:()=>void,finish!:()=>void;const ready=new Promise<void>(r=>entered=r);t.mock.method(sdk.ModelRuntime.prototype,'streamSimple',(model:Record<string,unknown>)=>{calls++;const stream=ai.createAssistantMessageEventStream();finish=()=>stream.push({type:'done',reason:'stop',message:{role:'assistant',content:[{type:'text',text:JSON.stringify({kind:'question',text:'请补充必要期间。'})}],api:model.api,provider:model.provider,model:model.id,usage:{input:12,cacheRead:0,cacheWrite:0,output:3,totalTokens:15,cost:{total:0}},stopReason:'stop',timestamp:Date.now()}});entered();return stream;});
 const access=createLocalModelAccess(true),app=module.createMembershipModelApplication({store:f.store,runtime:createPiStoredCaseAssistantRuntime(()=> 'synthetic-background-key'),modelAccess:access,policy:async()=>f.grant.policy});
 const state=await f.store.read(f.task_id),grant=await app.authorize({version:'1.0',command_id:randomUUID(),task_id:f.task_id,source_set_id:null,expected_row_version:state.row_version,epoch:state.epoch,policy_sha256:taskHash(f.grant.policy),disclose_question:true,disclose_structure:false,confirmed:true});
 const workflow=factory(app),input={task_id:f.task_id,grant_id:grant.grant_id,source_set_id:null};t.after(async()=>{workflow.close();finish?.();await workflow.collect();});workflow.start(input);await ready;assert.equal(workflow.pending().length,1);workflow.start(input);assert.equal(calls,1);
 await f.store.readBrowserTask({task_id:f.task_id});assert.equal(calls,1);const held=await f.store.read(f.task_id),beforeGrant=readFileSync(join(f.root,'.xanthil/desktop/state.sqlite'));await assert.rejects(()=>app.authorize({version:'1.0',command_id:randomUUID(),task_id:f.task_id,source_set_id:null,expected_row_version:held.row_version,epoch:held.epoch,policy_sha256:taskHash(f.grant.policy),disclose_question:true,disclose_structure:false,confirmed:true}),{code:'PHYSICAL_PENDING'},'new authorization cannot replace authority under an unsettled execution');assert.deepEqual(readFileSync(join(f.root,'.xanthil/desktop/state.sqlite')),beforeGrant);const reopened=factory(app);assert.equal(reopened.pending().length,0,'restart must not auto-enumerate or dispatch saved grants');
 workflow.stop(f.task_id);assert.equal(workflow.pending().length,1,'abort is not completion');assert.ok(access.occupant?.());finish();await workflow.collect();assert.equal(workflow.pending().length,0);assert.equal(access.occupant?.(),null);assert.equal(calls,1);assert.equal((await f.store.readOperations({task_id:f.task_id})).totals.unresolved,0);workflow.close();assert.throws(()=>workflow.start(input),{code:'SERVICE_CLOSING'});
});


test('BF-R01/03/08 E05-i: real HTTP text authorization starts once and GET/replay cannot resend',async t=>{
 const f=await fixture(),{createMembershipModelApplication,createMembershipWorkflow}=await import('../../../packages/application/member-model.ts'),{createPiStoredCaseAssistantRuntime}=await import('../../../adapters/agent-pi/xiaomi-local.ts'),{createLocalModelAccess,createMembershipPolicyAccess}=await import('../../../packages/application/provider-settings.ts'),{createLocalMembershipPolicyStore}=await import('../../../adapters/storage-local/member-model-policy.ts'),{createBrowserMembershipWorkspaceApplication}=await import('../../../packages/application/browser-membership.ts'),{startBrowserMembershipServer}=await import('../../../apps/browser/local-server.ts');
 const specifier='@earendil-works/pi-coding-agent',sdk=await import(specifier),{pathToFileURL}=await import('node:url'),ai=await import(pathToFileURL(join(sdk.getPackageDir(),'node_modules/@earendil-works/pi-ai/dist/index.js')).href);let calls=0;
 t.mock.method(sdk.ModelRuntime.prototype,'streamSimple',(model:Record<string,unknown>)=>{calls++;const stream=ai.createAssistantMessageEventStream();queueMicrotask(()=>stream.push({type:'done',reason:'stop',message:{role:'assistant',content:[{type:'text',text:JSON.stringify({kind:'question',text:'请添加资料。'})}],api:model.api,provider:model.provider,model:model.id,usage:{input:10,cacheRead:0,cacheWrite:0,output:2,totalTokens:12,cost:{total:0}},stopReason:'stop',timestamp:Date.now()}}));return stream;});
 const policyStore=createLocalMembershipPolicyStore(mkdtempSync(join(browserEvidenceRoot,'text-policy-')));await policyStore.initializeApproved();const access=createLocalModelAccess(true),policyAccess=createMembershipPolicyAccess(policyStore,access),model=createMembershipModelApplication({store:f.store,runtime:createPiStoredCaseAssistantRuntime(()=> 'synthetic-http-key'),modelAccess:access,policy:async()=>(await policyAccess.read()).policy}),workflow=createMembershipWorkflow(model),state=await f.store.read(f.task_id),workspace=createBrowserMembershipWorkspaceApplication({store:f.store,tasks:f.app,sources:createMemberSourcesApplication(f.store,async()=>assert.fail('text-only cannot inspect files')),project_id:state.owner.project_id,models:{policy:policyAccess,application:model,workflow}}),server=await startBrowserMembershipServer({store:f.store,workspace});
 try{const bootstrap=await fetch(server.origin+'/v1/bootstrap',{method:'POST',headers:{origin:server.origin,'content-type':'application/json'},body:JSON.stringify({token:server.bootstrap})}),cookie=bootstrap.headers.get('set-cookie')!.split(';')[0],control=(await bootstrap.json()).control,command={version:'1.0',command_id:randomUUID(),task_id:f.task_id,source_set_id:null,expected_row_version:state.row_version,epoch:state.epoch,policy_sha256:(await policyAccess.read()).sha256,disclose_question:true,disclose_structure:false,confirmed:true};
 const send=()=>fetch(server.origin+'/v1/tasks/'+f.task_id+'/model-authorization',{method:'POST',headers:{cookie,origin:server.origin,'content-type':'application/json','x-xanthil-control':control},body:JSON.stringify(command)});const response=await send();assert.equal(response.status,200);await workflow.collect();assert.equal(calls,1,'fresh HTTP authorization should launch without a second continue command');const receipt=await response.json();assert.deepEqual(await (await send()).json(),receipt);const readback=await (await fetch(server.origin+'/v1/tasks/'+f.task_id,{headers:{cookie}})).json();assert.equal(readback.model.question,'请添加资料。');assert.equal(readback.source_summary,null);assert.equal(calls,1);
 }finally{workflow.close();await workflow.collect();await server.close();}
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


test('BF-R04/07 E05-l: advancing model readback binds actual execution grant and current epoch',async()=>{
 const f=await modelFixture(),read=Reflect.get(f.store,'readMemberModelForPreparation');assert.equal(typeof read,'function','current model-to-preparation readback missing');
 const attempt=await f.store.beginMemberModel({...f.request,stage:'generate_preparation',policy_sha256:taskHash(f.grant.policy)}),request={task_id:f.task_id,execution_id:attempt.context.execution_id,grant_id:f.grant.grant_id};
 await assert.rejects(()=>read(request));
 const usage={input_tokens:{kind:'known' as const,value:'1'},output_tokens:{kind:'known' as const,value:'1'},active_ms:{kind:'known' as const,value:'1'},wait_ms:{kind:'known' as const,value:'0'}};
 const result={version:'2.0' as const,context:attempt.context,provider:f.grant.policy.provider,model:f.grant.policy.model,output:{kind:'question' as const,text:'请确认语义。'},usage};
 await f.store.finishMemberModel({task_id:f.task_id,execution_id:attempt.context.execution_id,proof:{context:attempt.context,physical_status:'settled',usage,result_sha256:taskHash(result)},result,failure_code:null});
 const before=readFileSync(join(f.root,'.xanthil/desktop/state.sqlite'));assert.deepEqual((await read(request)).result,result);assert.deepEqual(readFileSync(join(f.root,'.xanthil/desktop/state.sqlite')),before);
 for(const changed of [{...request,grant_id:randomUUID()},{...request,execution_id:randomUUID()},{...request,task_id:randomUUID()}])await assert.rejects(()=>read(changed));
 const factory=Reflect.get(await import('../../../packages/application/member-model.ts'),'createPreparedMembershipAnalysis');assert.equal(typeof factory,'function','prepared workflow Application missing');const advance=factory({store:f.store,desktop:f.desktop});assert.deepEqual(await advance({...request,preparation_execution_id:randomUUID()},new AbortController().signal),{status:'waiting',reason:'semantic_clarification_required'});assert.deepEqual(readFileSync(join(f.root,'.xanthil/desktop/state.sqlite')),before,'missing semantics must not confirm or dispatch');
 await f.store.stopBrowserTask({task_id:f.task_id,command_id:randomUUID()});await assert.rejects(()=>read(request),{code:'AUTHORITY_REQUIRED'});assert.equal((await f.store.readMemberModel({task_id:f.task_id,execution_id:attempt.context.execution_id})).status,'succeeded','historical evidence remains readable');
});


test('BF-R06 E05-m: verified aggregate material requires its explicit persistent consent',async()=>{
 const f=await modelFixture(),state=await f.store.read(f.task_id),base={version:'1.0',command_id:randomUUID(),task_id:f.task_id,source_set_id:f.selected.id,expected_row_version:state.row_version,epoch:state.epoch,policy:f.grant.policy,disclose_question:true,disclose_structure:true,expires_at:new Date(Date.now()+3600000).toISOString()};
 const grant=await f.store.authorizeMemberModel({...base,disclose_verified_result:true});const {DatabaseSync}=await import('node:sqlite'),db=new DatabaseSync(join(f.root,'.xanthil/desktop/state.sqlite'),{readOnly:true});try{const old=JSON.parse(String(db.prepare('SELECT body_json FROM membership_model_grants WHERE grant_id=?').get(f.grant.grant_id)!.body_json)),fresh=JSON.parse(String(db.prepare('SELECT body_json FROM membership_model_grants WHERE grant_id=?').get(grant.grant_id)!.body_json));assert.notEqual(old.disclose_verified_result,true);assert.equal(fresh.disclose_verified_result,true);}finally{db.close();}
 await assert.rejects(()=>f.store.beginMemberModel({task_id:f.task_id,grant_id:grant.grant_id,stage:'explain',policy_sha256:taskHash(f.grant.policy)}),{code:'RESULT_REQUIRED'},'consent alone cannot fabricate a verified result');
 const next=await f.store.read(f.task_id);await assert.rejects(()=>f.store.authorizeMemberModel({...base,command_id:randomUUID(),source_set_id:null,expected_row_version:next.row_version,disclose_structure:false,disclose_verified_result:true}),{code:'AUTHORITY_REQUIRED'});
});


test('BF-R01/06 E05-l: prepare coordinator advances qualified work and requires real verified result before explanation',async t=>{
 const f=await modelFixture(),{createMembershipModelApplication}=await import('../../../packages/application/member-model.ts'),{createPiStoredCaseAssistantRuntime}=await import('../../../adapters/agent-pi/xiaomi-local.ts'),{createLocalModelAccess}=await import('../../../packages/application/provider-settings.ts');
 const bindings=f.selected.inspection.sources.flatMap(s=>s.sheets.map(sheet=>({source_id:s.source_id,sheet_id:sheet.sheet_id,role:sheet.rows[0].cells.some(c=>c.value==='member_group')?'members':'orders',columns:Object.fromEntries(sheet.rows[0].cells.map(c=>[c.value,c.value]))}))),events:string[]=[];
 t.mock.method(globalThis,'fetch',async()=>{events.push('model');const chunk={id:'synthetic-coordinator',object:'chat.completion.chunk',created:0,model:'mimo-v2.6-pro',choices:[{index:0,delta:{role:'assistant',content:JSON.stringify({kind:'preparation',bindings,code:'pass'})},finish_reason:'stop'}],usage:{prompt_tokens:20,completion_tokens:4,total_tokens:24}};return new Response('data: '+JSON.stringify(chunk)+'\n\ndata: [DONE]\n\n',{headers:{'content-type':'text/event-stream'}});});
 const recorded=JSON.parse(readFileSync(new URL('../../fixtures/xanthil-desktop/qualified-preparation.json',import.meta.url),'utf8')).preparation;
 const options={store:f.store,runtime:createPiStoredCaseAssistantRuntime(()=> 'synthetic-coordinator-key'),modelAccess:createLocalModelAccess(true),policy:async()=>f.grant.policy,preparation:{async prepare(){events.push('prepare');return recorded;}},async advance(input:unknown){events.push('advance');assert.equal(Reflect.get(input as object,'task_id'),f.task_id);return {status:'analysed' as const,run_id:'01991a00-0000-7000-8000-000000000051'};}};
 const app=createMembershipModelApplication(options),result=await app.prepare({task_id:f.task_id,grant_id:f.grant.grant_id},new AbortController().signal);assert.equal(result.status,'waiting');assert.ok('reason' in result&&result.reason==='verified_result_authorization_required');assert.deepEqual(events,['model','prepare','advance']);assert.equal((await f.store.readOperations({task_id:f.task_id})).totals.calls,'1');
});

test('BF-R07 E05-o: successful model result preserves UNKNOWN usage and reconciled lower bounds on reopen',async()=>{
 for(const lower of [null,'7']){
  const f=await modelFixture(),a=await f.store.beginMemberModel({...f.request,stage:'generate_preparation',policy_sha256:taskHash(f.grant.policy)}),usage={input_tokens:{kind:'unknown' as const,reason:'provider_usage_unavailable'},output_tokens:{kind:'unknown' as const,reason:'provider_usage_unavailable'},active_ms:{kind:'known' as const,value:'10'},wait_ms:{kind:'known' as const,value:'0'}};
  if(lower!==null)await f.store.finishMemberModel({task_id:f.task_id,execution_id:a.context.execution_id,proof:{context:a.context,physical_status:'unknown',usage:{...usage,input_tokens:{kind:'unknown',reason:'provider_usage_unavailable',known_lower_bound:lower}},result_sha256:null},result:null,failure_code:'TRANSPORT_UNKNOWN'});
  const result={version:'2.0' as const,context:a.context,provider:f.grant.policy.provider,model:f.grant.policy.model,output:{kind:'question' as const,text:'请确认语义。'},usage};
  await f.store.finishMemberModel({task_id:f.task_id,execution_id:a.context.execution_id,proof:{context:a.context,physical_status:'settled',usage,result_sha256:taskHash(result)},result,failure_code:null});
  const reopened=createLocalMembershipTaskStore(f.root);assert.deepEqual((await reopened.readMemberModel({task_id:f.task_id,execution_id:a.context.execution_id})).result,result,'raw trusted result must not invent usage');const ledger=await reopened.readOperations({task_id:f.task_id});assert.deepEqual(ledger.usage[0].usage.input_tokens,{kind:'unknown',reason:'provider_usage_unavailable',known_lower_bound:lower??'0'});assert.equal(ledger.totals.unresolved,0);
  const {DatabaseSync}=await import('node:sqlite'),db=new DatabaseSync(join(f.root,'.xanthil/desktop/state.sqlite'));try{const altered={...ledger.usage[0].usage,active_ms:{kind:'known',value:'11'}};db.prepare('UPDATE membership_operation_usage SET usage_json=?,usage_sha256=? WHERE execution_id=?').run(JSON.stringify(altered),taskHash(altered),a.context.execution_id);}finally{db.close();}await assert.rejects(()=>createLocalMembershipTaskStore(f.root).readMemberModel({task_id:f.task_id,execution_id:a.context.execution_id}),{code:'INTEGRITY_BLOCKED'},'known trusted result usage must remain exact');
 }
});

test('BF-R01/06 E05-q: explicit answer persists exact successor and grant without rewriting original question',async()=>{
 const f=await modelFixture(),a=await f.store.beginMemberModel({...f.request,stage:'generate_preparation',policy_sha256:taskHash(f.grant.policy)}),usage={input_tokens:{kind:'known' as const,value:'1'},output_tokens:{kind:'known' as const,value:'1'},active_ms:{kind:'known' as const,value:'1'},wait_ms:{kind:'known' as const,value:'0'}},result={version:'2.0' as const,context:a.context,provider:f.grant.policy.provider,model:f.grant.policy.model,output:{kind:'question' as const,text:'请说明paid的含义。'},usage};
 await f.store.finishMemberModel({task_id:f.task_id,execution_id:a.context.execution_id,proof:{context:a.context,physical_status:'settled',usage,result_sha256:taskHash(result)},result,failure_code:null});
 const answer=Reflect.get(f.store,'answerMemberQuestion');assert.equal(typeof answer,'function','durable answer consumer missing');const state=await f.store.read(f.task_id),original=(await f.store.readBrowserTask({task_id:f.task_id})).question,input={version:'1.0',command_id:randomUUID(),task_id:f.task_id,expected_row_version:state.row_version,epoch:state.epoch,question_execution_id:a.context.execution_id,policy_sha256:taskHash(f.grant.policy),reply:'paid表示已支付',confirmed:true};
 const saved=await answer(input);assert.deepEqual(await answer(input),{...saved,created:false});assert.equal((await f.store.readBrowserTask({task_id:f.task_id})).question,original);await assert.rejects(()=>answer({...input,reply:'different'}),{code:'COMMAND_CONFLICT'});
 const resumed=await f.store.beginMemberModel({task_id:f.task_id,grant_id:saved.grant_id,stage:'generate_preparation',policy_sha256:taskHash(f.grant.policy)});assert.deepEqual(Reflect.get(resumed.payload,'clarifications'),[{sha256:saved.clarification_sha256,reply:input.reply}]);assert.equal(resumed.payload.selected_text,a.payload.selected_text);assert.notEqual(resumed.context.operation_id,a.context.operation_id);assert.equal((await f.store.readOperations({task_id:f.task_id})).totals.calls,'2');
});

test('BF-R01/06/07 E05-q: answer admission rejects Stop source policy and unknown physical substitutions atomically',async()=>{
 for(const mode of ['stop','source','policy','unknown','question','unselected']){
  const f=await modelFixture(),a=await f.store.beginMemberModel({...f.request,stage:'generate_preparation',policy_sha256:taskHash(f.grant.policy)}),usage={input_tokens:{kind:'known' as const,value:'1'},output_tokens:{kind:'known' as const,value:'1'},active_ms:{kind:'known' as const,value:'1'},wait_ms:{kind:'known' as const,value:'0'}},result={version:'2.0' as const,context:a.context,provider:f.grant.policy.provider,model:f.grant.policy.model,output:{kind:'question' as const,text:'请说明paid含义。'},usage};await f.store.finishMemberModel({task_id:f.task_id,execution_id:a.context.execution_id,proof:{context:a.context,physical_status:'settled',usage,result_sha256:taskHash(result)},result,failure_code:null});
  const state=await f.store.read(f.task_id),input={version:'1.0',command_id:randomUUID(),task_id:f.task_id,expected_row_version:state.row_version,epoch:state.epoch,question_execution_id:mode==='question'?randomUUID():a.context.execution_id,policy_sha256:mode==='policy'?'0'.repeat(64):taskHash(f.grant.policy),reply:'paid表示已支付',confirmed:mode!=='unselected'};
  if(mode==='stop')await f.store.stopBrowserTask({task_id:f.task_id,command_id:randomUUID()});
  if(mode==='unknown'){const op=await f.store.reserveOperation({task_id:f.task_id,grant_id:f.grant.grant_id,kind:'model',stage:'clarify',input_sha256:'3'.repeat(64)});await f.store.issueOperation({task_id:f.task_id,execution_id:op.execution_id});}
  if(mode==='source'){const {browserSourceFixture}=await import('../../fixtures/xanthil-desktop/browser-sources.ts');const {createMemberSourcesApplication}=await import('../../../packages/application/member-sources.ts'),{createMemberSourcePreparation}=await import('../../../adapters/analytics-duckdb/member-source-inspection.ts');const runtime=createMemberSourcePreparation({pythonExecutable:join(process.env.JUANERAI_TOOLCHAIN_BIN!,'python3'),pythonVersion:'3.14.4'});await createMemberSourcesApplication(f.store,runtime.inspectSources).select({version:'1.0',task_id:f.task_id,command_id:randomUUID(),expected_row_version:state.row_version,sources:browserSourceFixture().map(s=>({...s,source_id:randomUUID()}))},new AbortController().signal);}
  const before=readFileSync(join(f.root,'.xanthil/desktop/state.sqlite'));await assert.rejects(()=>f.store.answerMemberQuestion(input));assert.deepEqual(readFileSync(join(f.root,'.xanthil/desktop/state.sqlite')),before,mode+' rejected with no persistent effect');
 }
});

test('BF-R01/06 E05-q: actual HTTP answer writes one durable reply receipt and readback never resends',async()=>{
 const f=await modelFixture(),a=await f.store.beginMemberModel({...f.request,stage:'generate_preparation',policy_sha256:taskHash(f.grant.policy)}),usage={input_tokens:{kind:'known' as const,value:'1'},output_tokens:{kind:'known' as const,value:'1'},active_ms:{kind:'known' as const,value:'1'},wait_ms:{kind:'known' as const,value:'0'}},result={version:'2.0' as const,context:a.context,provider:f.grant.policy.provider,model:f.grant.policy.model,output:{kind:'question' as const,text:'请补充有效状态。'},usage};await f.store.finishMemberModel({task_id:f.task_id,execution_id:a.context.execution_id,proof:{context:a.context,physical_status:'settled',usage,result_sha256:taskHash(result)},result,failure_code:null});
 const {createBrowserMembershipWorkspaceApplication}=await import('../../../packages/application/browser-membership.ts'),{createMembershipModelApplication}=await import('../../../packages/application/member-model.ts'),{createLocalModelAccess}=await import('../../../packages/application/provider-settings.ts'),{startBrowserMembershipServer}=await import('../../../apps/browser/local-server.ts');
 const application=createMembershipModelApplication({store:f.store,runtime:{async turn(){assert.fail('no provider');}},modelAccess:createLocalModelAccess(false),policy:async()=>f.grant.policy}),state=await f.store.read(f.task_id),workspace=createBrowserMembershipWorkspaceApplication({store:f.store,tasks:f.app,project_id:state.owner.project_id,sources:{async select(){assert.fail('no upload');},read:(task_id,source_set_id)=>f.store.readSourceSet({task_id,source_set_id})},models:{application,policy:{async read(){return {policy:f.grant.policy,sha256:taskHash(f.grant.policy),material_classes:['selected_task_text','source_structure','verified_m1_aggregate'],available:false};}}}}),server=await startBrowserMembershipServer({store:f.store,workspace});
 try{const boot=await fetch(server.origin+'/v1/bootstrap',{method:'POST',headers:{origin:server.origin,'content-type':'application/json'},body:JSON.stringify({token:server.bootstrap})}),cookie=boot.headers.get('set-cookie')!.split(';')[0],control=(await boot.json()).control,input={version:'1.0',command_id:randomUUID(),task_id:f.task_id,expected_row_version:state.row_version,epoch:state.epoch,question_execution_id:a.context.execution_id,policy_sha256:taskHash(f.grant.policy),reply:'paid表示已支付',confirmed:true},send=(token:string)=>fetch(server.origin+'/v1/tasks/'+f.task_id+'/clarification',{method:'POST',headers:{origin:server.origin,'content-type':'application/json',cookie,'x-xanthil-control':token},body:JSON.stringify(input)});assert.equal((await send('wrong')).status,403);const accepted=await send(control);assert.equal(accepted.status,200);const receipt=await accepted.json();assert.equal(receipt.kind,'clarification_saved');assert.deepEqual(await (await send(control)).json(),receipt);assert.deepEqual(await (await fetch(server.origin+'/v1/commands/'+input.command_id,{headers:{cookie}})).json(),receipt);const view=await (await fetch(server.origin+'/v1/tasks/'+f.task_id,{headers:{cookie}})).json();assert.equal(view.clarifications.at(-1).reply,input.reply);assert.equal(view.model.answerable,false);assert.equal(view.operations.totals.calls,'1');}finally{await server.close();}
});

test('BF-R07/08 E06-c: service exit fences durable authority without inventing physical settlement',async()=>{
 const f=await fixture(),state=await f.store.read(f.task_id),op=await f.store.reserveOperation({task_id:f.task_id,grant_id:f.grant.grant_id,kind:'model',stage:'clarify',input_sha256:'8'.repeat(64)});await f.store.issueOperation({task_id:f.task_id,execution_id:op.execution_id});
 const {createBrowserMembershipWorkspaceApplication}=await import('../../../packages/application/browser-membership.ts'),{startBrowserMembershipServer}=await import('../../../apps/browser/local-server.ts'),workspace=createBrowserMembershipWorkspaceApplication({store:f.store,tasks:f.app,project_id:state.owner.project_id,sources:{async select(){assert.fail('no upload');},read:(task_id,source_set_id)=>f.store.readSourceSet({task_id,source_set_id})}}),server=await startBrowserMembershipServer({store:f.store,workspace});await server.close();const view=await f.store.readBrowserTask({task_id:f.task_id});assert.equal(view.task.status,'stopped');assert.equal(view.task.epoch,state.epoch+1);assert.equal(view.operations.totals.calls,'1');assert.equal(view.operations.totals.unresolved,1);await assert.rejects(()=>f.store.reserveOperation({task_id:f.task_id,grant_id:f.grant.grant_id,kind:'model',stage:'clarify',input_sha256:'9'.repeat(64)}));const reopened=createLocalMembershipTaskStore(f.root),before=readFileSync(join(f.root,'.xanthil/desktop/state.sqlite'));await reopened.readBrowserTask({task_id:f.task_id});assert.deepEqual(readFileSync(join(f.root,'.xanthil/desktop/state.sqlite')),before);
});

test('BF-R07/08 D5 E06-f: startup fences old epoch and preserves issued work as physical UNKNOWN',async()=>{
 const f=await fixture(),{registerCreatedBrowserProject,reopenBrowserProject}=await import('../../../adapters/storage-local/browser-project-origin.ts'),directory=join(f.root,'native-origin-test');mkdirSync(directory);const state=await f.store.read(f.task_id),lease=registerCreatedBrowserProject(directory,f.root,state.owner.project_id);
 const op=await f.store.reserveOperation({task_id:f.task_id,grant_id:f.grant.grant_id,kind:'model',stage:'clarify',input_sha256:'7'.repeat(64)});await f.store.issueOperation({task_id:f.task_id,execution_id:op.execution_id});lease.close();
 const recovered=reopenBrowserProject(directory,f.root);try{storage.fenceReopenedBrowserProject(recovered);const current=await f.store.read(f.task_id),ledger=await f.store.readOperations({task_id:f.task_id});assert.equal(current.epoch,state.epoch+1);assert.equal(current.status,'interrupted');assert.equal(ledger.totals.calls,'1');assert.equal(ledger.totals.unresolved,1);assert.equal(ledger.usage[0].phase,'unresolved');assert.equal(ledger.usage[0].outcome,null);await assert.rejects(()=>f.store.reserveOperation({task_id:f.task_id,grant_id:f.grant.grant_id,kind:'model',stage:'clarify',input_sha256:'7'.repeat(64)}));const before=readFileSync(join(f.root,'.xanthil/desktop/state.sqlite'));await f.store.readOperations({task_id:f.task_id});assert.deepEqual(readFileSync(join(f.root,'.xanthil/desktop/state.sqlite')),before);storage.fenceReopenedBrowserProject(recovered);assert.equal((await f.store.read(f.task_id)).epoch,current.epoch);}finally{recovered.close();}
});

test('BF-R07/08 D5 E06-h: actual reopened Profile serves UNKNOWN without release or automatic dispatch',async()=>{
 const f=await fixture(),{registerCreatedBrowserProject}=await import('../../../adapters/storage-local/browser-project-origin.ts'),{createPersonalBrowserMembershipProfile}=await import('../../../profiles/personal/browser-membership.ts'),{createLocalModelAccess}=await import('../../../packages/application/provider-settings.ts'),directory=join(f.root,'native-recovery-domain');mkdirSync(directory);const state=await f.store.read(f.task_id),lease=registerCreatedBrowserProject(directory,f.root,state.owner.project_id),request={task_id:f.task_id,grant_id:f.grant.grant_id,kind:'model' as const,stage:'clarify' as const,input_sha256:'6'.repeat(64)},op=await f.store.reserveOperation(request);await f.store.issueOperation({task_id:f.task_id,execution_id:op.execution_id});await f.store.settleOperation({task_id:f.task_id,execution_id:op.execution_id,physical:'unresolved',outcome:'temporary_failure',usage:{...unknown(),output_tokens:{kind:'known',value:'17'}}});lease.close();
 let calls=0;const bin=process.env.JUANERAI_TOOLCHAIN_BIN!,profile=await createPersonalBrowserMembershipProfile({projectRoot:f.root,originDirectory:directory,mode:'reopen',display_name:'Synthetic interrupted project',toolchain:{pythonExecutable:join(bin,'python3'),pythonVersion:'3.14.4',duckdbExecutable:join(bin,'duckdb'),duckdbVersion:'1.5.2'},model:{runtime:{async turn(){calls++;assert.fail('reopen/GET cannot dispatch');}},access:createLocalModelAccess(false),policy:{async read(){return f.grant.policy;}}}});
 try{const boot=await fetch(profile.origin+'/v1/bootstrap',{method:'POST',headers:{origin:profile.origin,'content-type':'application/json'},body:JSON.stringify({token:profile.bootstrap})}),cookie=boot.headers.get('set-cookie')!.split(';')[0];assert.equal(boot.status,200);const before=readFileSync(join(f.root,'.xanthil/desktop/state.sqlite'));for(let n=0;n<2;n++){assert.equal((await fetch(profile.origin+'/v1/tasks',{headers:{cookie}})).status,200);}assert.deepEqual(readFileSync(join(f.root,'.xanthil/desktop/state.sqlite')),before);const ledger=await f.store.readOperations({task_id:f.task_id});assert.equal(ledger.totals.calls,'1');assert.equal(ledger.totals.unresolved,1);assert.equal(ledger.totals.output_tokens.known,'17');assert.equal(ledger.usage[0].execution_id,op.execution_id);await assert.rejects(()=>f.store.reserveOperation(request));assert.equal(calls,0);}finally{const outcome=await profile.close();assert.equal(outcome.unresolved,1);}const final=await createLocalMembershipTaskStore(f.root).readOperations({task_id:f.task_id});assert.equal(final.totals.unresolved,1);assert.equal(final.totals.output_tokens.known,'17');assert.equal(calls,0);
});

test('BF-R06/13 P1: coordinator consumes exactly one persisted conversion correction and exposes terminal failure',async t=>{
 const f=await modelFixture(),{createMembershipModelApplication}=await import('../../../packages/application/member-model.ts'),{createPiStoredCaseAssistantRuntime}=await import('../../../adapters/agent-pi/xiaomi-local.ts'),{createLocalModelAccess}=await import('../../../packages/application/provider-settings.ts'),{browserBindingFixture}=await import('../../fixtures/xanthil-desktop/browser-sources.ts');
 const stages:string[]=[],bindings=browserBindingFixture(f.selected.sources);let local=0;
 t.mock.method(globalThis,'fetch',async(_url:unknown,options:{body:string})=>{const payload=JSON.parse(JSON.parse(options.body).messages.find((m:{role:string})=>m.role==='user').content);stages.push(payload.stage);const chunk={id:'synthetic-correction',object:'chat.completion.chunk',created:0,model:'mimo-v2.6-pro',choices:[{index:0,delta:{role:'assistant',content:JSON.stringify({kind:'preparation',bindings,code:'pass # '+stages.length})},finish_reason:'stop'}],usage:{prompt_tokens:20,completion_tokens:4,total_tokens:24}};return new Response('data: '+JSON.stringify(chunk)+'\n\ndata: [DONE]\n\n',{headers:{'content-type':'text/event-stream'}});});
 const preparation={prepare:async(input:unknown)=>{local++;const x=input as {task_id:string;source_set_id:string;grant_id:string;bindings:readonly import('../../../packages/product-core/member-source-qualification.ts').SourceBinding[];code:string};const started=await f.store.beginPreparation({version:'1.0',task_id:x.task_id,source_set_id:x.source_set_id,grant_id:x.grant_id,bindings:x.bindings,code_sha256:taskHash(x.code)});await f.store.failPreparation({task_id:x.task_id,execution_id:started.attempt.context.execution_id,failure:{physical_status:'settled',operation_context:started.attempt.context},code:'CONVERSION_UNQUALIFIED'});throw Object.assign(new Error('CONVERSION_UNQUALIFIED'),{code:'CONVERSION_UNQUALIFIED'});}};
 const app=createMembershipModelApplication({store:f.store,runtime:createPiStoredCaseAssistantRuntime(()=> 'synthetic-correction-key'),modelAccess:createLocalModelAccess(true),policy:async()=>f.grant.policy,preparation});
 await assert.rejects(()=>app.prepare({task_id:f.task_id,grant_id:f.grant.grant_id},new AbortController().signal),{code:'CONVERSION_UNQUALIFIED'});
 assert.deepEqual(stages,['generate_preparation','correct_preparation']);assert.equal(local,2);const ledger=await f.store.readOperations({task_id:f.task_id}),locals=ledger.usage.filter(u=>u.local_runs===1);assert.equal(ledger.totals.calls,'2');assert.equal(ledger.totals.local_runs,'2');assert.equal(locals[0].operation_id,locals[1].operation_id);assert.deepEqual(locals.map(u=>u.execution_index),[0,1]);assert.equal(ledger.totals.unresolved,0);
 const view=await f.store.readBrowserTask({task_id:f.task_id});assert.equal(Reflect.get(view,'preparation')?.failure_code,'CONVERSION_UNQUALIFIED');
 await assert.rejects(()=>app.prepare({task_id:f.task_id,grant_id:f.grant.grant_id},new AbortController().signal));assert.equal(stages.length,2);
});

test('BF-R07/13 P1: correction admission cannot bypass Stop UNKNOWN expiry source drift or isolation failure',async()=>{
 const {browserBindingFixture,browserSourceFixture}=await import('../../fixtures/xanthil-desktop/browser-sources.ts'),{DatabaseSync}=await import('node:sqlite');
 for(const mode of ['none','stop','unknown','expiry','source','isolation']){
  const f=await modelFixture();
  if(mode!=='none'){const started=await f.store.beginPreparation({version:'1.0',task_id:f.task_id,source_set_id:f.selected.id,grant_id:f.grant.grant_id,bindings:browserBindingFixture(f.selected.sources),code_sha256:'0'.repeat(64)});await f.store.failPreparation({task_id:f.task_id,execution_id:started.attempt.context.execution_id,failure:{physical_status:mode==='unknown'?'unknown':'settled',operation_context:started.attempt.context},code:mode==='isolation'?'ISOLATION_UNAVAILABLE':'CONVERSION_UNQUALIFIED'});}
  if(mode==='stop')await f.store.stopBrowserTask({task_id:f.task_id,command_id:randomUUID()});
  if(mode==='expiry'){const db=new DatabaseSync(join(f.root,'.xanthil/desktop/state.sqlite'));const row=db.prepare('SELECT body_json FROM membership_model_grants WHERE grant_id=?').get(f.grant.grant_id)!,g=JSON.parse(String(row.body_json));g.expires_at='2000-01-01T00:00:00.000Z';db.prepare('UPDATE membership_model_grants SET body_json=?,body_sha256=? WHERE grant_id=?').run(JSON.stringify(g),taskHash(g),f.grant.grant_id);db.prepare('UPDATE membership_operation_grants SET expires_at=? WHERE grant_id=?').run(g.expires_at,f.grant.grant_id);db.close();}
  if(mode==='source'){const {createMemberSourcePreparation}=await import('../../../adapters/analytics-duckdb/member-source-inspection.ts');const runtime=createMemberSourcePreparation({pythonExecutable:join(process.env.JUANERAI_TOOLCHAIN_BIN!,'python3'),pythonVersion:'3.14.4'});await createMemberSourcesApplication(f.store,runtime.inspectSources).select({version:'1.0',task_id:f.task_id,command_id:randomUUID(),expected_row_version:(await f.store.read(f.task_id)).row_version,sources:browserSourceFixture().map(s=>({...s,source_id:randomUUID()}))},new AbortController().signal);}
  const before=readFileSync(join(f.root,'.xanthil/desktop/state.sqlite'));await assert.rejects(()=>f.store.beginMemberModel({task_id:f.task_id,grant_id:f.grant.grant_id,stage:'correct_preparation',policy_sha256:taskHash(f.grant.policy)}),mode);assert.deepEqual(readFileSync(join(f.root,'.xanthil/desktop/state.sqlite')),before,mode+' no effects');
 }
});

test('BF-R07/08 P1: explicit renewed authority consumes saved answer after Stop without returning its stale question',async()=>{
 const f=await modelFixture(),a=await f.store.beginMemberModel({...f.request,stage:'generate_preparation',policy_sha256:taskHash(f.grant.policy)}),usage={input_tokens:{kind:'known' as const,value:'1'},output_tokens:{kind:'known' as const,value:'1'},active_ms:{kind:'known' as const,value:'1'},wait_ms:{kind:'known' as const,value:'0'}},result={version:'2.0' as const,context:a.context,provider:f.grant.policy.provider,model:f.grant.policy.model,output:{kind:'question' as const,text:'paid表示什么有效状态？'},usage};
 await f.store.finishMemberModel({task_id:f.task_id,execution_id:a.context.execution_id,proof:{context:a.context,physical_status:'settled',usage,result_sha256:taskHash(result)},result,failure_code:null});let state=await f.store.read(f.task_id);
 const answered=await f.store.answerMemberQuestion({version:'1.0',command_id:randomUUID(),task_id:f.task_id,expected_row_version:state.row_version,epoch:state.epoch,question_execution_id:a.context.execution_id,policy_sha256:taskHash(f.grant.policy),reply:'paid表示已支付',confirmed:true});
 await f.store.stopBrowserTask({task_id:f.task_id,command_id:randomUUID()});const reopened=createLocalMembershipTaskStore(f.root);state=await reopened.read(f.task_id);const before=await reopened.readOperations({task_id:f.task_id});
 const renewed=await reopened.authorizeMemberModel({version:'1.0',command_id:randomUUID(),task_id:f.task_id,source_set_id:f.selected.id,expected_row_version:state.row_version,epoch:state.epoch,policy:f.grant.policy,disclose_question:true,disclose_structure:true,expires_at:new Date(Date.now()+3600000).toISOString()});
 assert.deepEqual((await reopened.readOperations({task_id:f.task_id})).usage,before.usage,'renewal never reissues old work');
 const next=await reopened.beginMemberModel({task_id:f.task_id,grant_id:renewed.grant_id,stage:'generate_preparation',policy_sha256:taskHash(f.grant.policy)});assert.deepEqual(next.payload.clarifications,[{sha256:answered.clarification_sha256,reply:'paid表示已支付'}]);assert.equal(next.context.epoch,state.epoch);assert.notEqual(next.context.execution_id,a.context.execution_id);assert.equal(next.status,'issued');
 await assert.rejects(()=>reopened.beginMemberModel({task_id:f.task_id,grant_id:answered.grant_id,stage:'generate_preparation',policy_sha256:taskHash(f.grant.policy)}));
});

test('BF-R01/07 P1: a renewed clarification may answer a new current question while preserving the old reply chain',async()=>{
 const f=await modelFixture(),finish=async(a:Awaited<ReturnType<typeof f.store.beginMemberModel>>)=>{const usage={input_tokens:{kind:'known' as const,value:'1'},output_tokens:{kind:'known' as const,value:'1'},active_ms:{kind:'known' as const,value:'1'},wait_ms:{kind:'known' as const,value:'0'}},result={version:'2.0' as const,context:a.context,provider:f.grant.policy.provider,model:f.grant.policy.model,output:{kind:'question' as const,text:'请补充含义。'},usage};await f.store.finishMemberModel({task_id:f.task_id,execution_id:a.context.execution_id,proof:{context:a.context,physical_status:'settled',usage,result_sha256:taskHash(result)},result,failure_code:null});},answer=async(execution_id:string,reply:string)=>{const state=await f.store.read(f.task_id);return f.store.answerMemberQuestion({version:'1.0',command_id:randomUUID(),task_id:f.task_id,expected_row_version:state.row_version,epoch:state.epoch,question_execution_id:execution_id,policy_sha256:taskHash(f.grant.policy),reply,confirmed:true});};
 const first=await f.store.beginMemberModel({...f.request,stage:'generate_preparation',policy_sha256:taskHash(f.grant.policy)});await finish(first);const one=await answer(first.context.execution_id,'paid表示已支付');await f.store.stopBrowserTask({task_id:f.task_id,command_id:randomUUID()});const state=await f.store.read(f.task_id),grant=await f.store.authorizeMemberModel({version:'1.0',command_id:randomUUID(),task_id:f.task_id,source_set_id:f.selected.id,expected_row_version:state.row_version,epoch:state.epoch,policy:f.grant.policy,disclose_question:true,disclose_structure:true,expires_at:new Date(Date.now()+3600000).toISOString()});
 const second=await f.store.beginMemberModel({task_id:f.task_id,grant_id:grant.grant_id,stage:'generate_preparation',policy_sha256:taskHash(f.grant.policy)});await finish(second);const two=await answer(second.context.execution_id,'valid表示有效订单');const third=await f.store.beginMemberModel({task_id:f.task_id,grant_id:two.grant_id,stage:'generate_preparation',policy_sha256:taskHash(f.grant.policy)});assert.deepEqual(third.payload.clarifications,[{sha256:one.clarification_sha256,reply:'paid表示已支付'},{sha256:two.clarification_sha256,reply:'valid表示有效订单'}]);
});

test('BF-R07/13 P1: identical failed preparation is not executed again and a changed correction retains the same bounded operation',async()=>{
 const f=await modelFixture(),{browserBindingFixture}=await import('../../fixtures/xanthil-desktop/browser-sources.ts'),input={version:'1.0' as const,task_id:f.task_id,grant_id:f.grant.grant_id,source_set_id:f.selected.id,bindings:browserBindingFixture(f.selected.sources),code_sha256:'a'.repeat(64)},first=await f.store.beginPreparation(input);await f.store.failPreparation({task_id:f.task_id,execution_id:first.attempt.context.execution_id,failure:{physical_status:'settled',operation_context:first.attempt.context},code:'CONVERSION_UNQUALIFIED'});const before=await f.store.readOperations({task_id:f.task_id});await assert.rejects(()=>f.store.beginPreparation(input),{code:'CONVERSION_UNQUALIFIED'});assert.deepEqual(await f.store.readOperations({task_id:f.task_id}),before);const second=await f.store.beginPreparation({...input,code_sha256:'b'.repeat(64)});assert.equal(second.execution.operation_id,first.execution.operation_id);assert.equal(second.execution.execution_index,1);assert.equal((await f.store.readOperations({task_id:f.task_id})).totals.local_runs,'2');await f.store.failPreparation({task_id:f.task_id,execution_id:second.attempt.context.execution_id,failure:{physical_status:'settled',operation_context:second.attempt.context},code:'CONVERSION_UNQUALIFIED'});await assert.rejects(()=>f.store.beginPreparation({...input,code_sha256:'c'.repeat(64)}),{code:'RETRY_EXHAUSTED'});
});

test('BF-R07/08 P1: qualified correction selects its exact settled model provenance, never the original rejected code',async()=>{
 const {DatabaseSync}=await import('node:sqlite'),{resolvePreparedModelReuse}=await import('../../../adapters/storage-local/member-model.ts'),fixture=JSON.parse(readFileSync(new URL('../../fixtures/xanthil-desktop/corrected-preparation-selection.json',import.meta.url),'utf8')),db=new DatabaseSync(':memory:');assert.equal(fixture.provenance.kind,'recorded-fixed-synthetic-correction-selection');
 try{db.exec('CREATE TABLE membership_model_attempts(execution_id TEXT,task_id TEXT,body_json TEXT,body_sha256 TEXT);CREATE TABLE membership_operation_usage(execution_id TEXT,phase TEXT,outcome TEXT);');for(const row of fixture.attempts){db.prepare('INSERT INTO membership_model_attempts VALUES(?,?,?,?)').run(row.execution_id,row.task_id,row.body_json,row.body_sha256);db.prepare('INSERT INTO membership_operation_usage VALUES(?,?,?)').run(row.execution_id,row.phase,row.outcome);}const generated=JSON.parse(fixture.attempts[0].body_json),corrected=JSON.parse(fixture.attempts[1].body_json),p=fixture.preparation;assert.equal(resolvePreparedModelReuse(db,p.context.task_id,generated.context.execution_id,p,generated.payload).context.execution_id,corrected.context.execution_id);for(const change of [{...p,code_sha256:'0'.repeat(64)},{...p,context:{...p.context,epoch:p.context.epoch+1}},{...p,bindings_sha256:'0'.repeat(64)}])assert.throws(()=>resolvePreparedModelReuse(db,p.context.task_id,generated.context.execution_id,change,generated.payload),{code:'SOURCE_CHANGED'});db.prepare("UPDATE membership_operation_usage SET phase='unresolved' WHERE execution_id=?").run(corrected.context.execution_id);assert.throws(()=>resolvePreparedModelReuse(db,p.context.task_id,generated.context.execution_id,p,generated.payload),{code:'SOURCE_CHANGED'});
 }finally{db.close();}
});

test('BF-R01/06/13 P1: correction question answer retains preparation index1 and cannot buy a third execution',async t=>{
 const f=await modelFixture(),{browserBindingFixture}=await import('../../fixtures/xanthil-desktop/browser-sources.ts'),{createMembershipModelApplication}=await import('../../../packages/application/member-model.ts'),{createPiStoredCaseAssistantRuntime}=await import('../../../adapters/agent-pi/xiaomi-local.ts'),{createLocalModelAccess}=await import('../../../packages/application/provider-settings.ts');
 const bindings=browserBindingFixture(f.selected.sources),stages:string[]=[];let calls=0,executions=0;
 const net=await import('node:net');t.mock.method(net.Socket.prototype,'connect',()=>assert.fail('offline sockets forbidden'));
 t.mock.method(globalThis,'fetch',async(_url:unknown,options:{body:string})=>{const payload=JSON.parse(JSON.parse(options.body).messages.find((m:{role:string})=>m.role==='user').content);stages.push(payload.stage);calls++;const output=calls===2?{kind:'question',text:'金额是否以元计？'}:{kind:'preparation',bindings,code:calls===1?'# first invalid':'# second invalid'};if(calls===3)assert.deepEqual(payload.clarifications.map((c:{reply:string})=>c.reply),['金额以元计，保留原始金额']);const chunk={id:'synthetic-correction-question',object:'chat.completion.chunk',created:0,model:'mimo-v2.6-pro',choices:[{index:0,delta:{role:'assistant',content:JSON.stringify(output)},finish_reason:'stop'}],usage:{prompt_tokens:20,completion_tokens:4,total_tokens:24}};return new Response('data: '+JSON.stringify(chunk)+'\n\ndata: [DONE]\n\n',{headers:{'content-type':'text/event-stream'}});});
 const app=createMembershipModelApplication({store:f.store,runtime:createPiStoredCaseAssistantRuntime(()=> 'synthetic-question-key'),modelAccess:createLocalModelAccess(true),policy:async()=>f.grant.policy,preparation:{async prepare(input){const x=input as {grant_id:string;code:string},a=await f.store.beginPreparation({version:'1.0',task_id:f.task_id,grant_id:x.grant_id,source_set_id:f.selected.id,bindings,code_sha256:createHash('sha256').update(x.code).digest('hex')});executions++;await f.store.failPreparation({task_id:f.task_id,execution_id:a.attempt.context.execution_id,failure:{physical_status:'settled',operation_context:a.attempt.context},code:'CONVERSION_UNQUALIFIED'});throw Object.assign(new Error('CONVERSION_UNQUALIFIED'),{code:'CONVERSION_UNQUALIFIED'});}}});
 const waiting=await app.prepare({task_id:f.task_id,grant_id:f.grant.grant_id},new AbortController().signal);assert.equal(waiting.status,'waiting');const view=await f.store.readBrowserTask({task_id:f.task_id});assert.equal(view.model?.answerable,true);assert.equal(view.preparation?.status,'failed');const before=await f.store.readOperations({task_id:f.task_id}),state=await f.store.read(f.task_id),answer=await app.answer({version:'1.0',command_id:randomUUID(),task_id:f.task_id,expected_row_version:state.row_version,epoch:state.epoch,question_execution_id:waiting.result.context.execution_id,policy_sha256:taskHash(f.grant.policy),reply:'金额以元计，保留原始金额',confirmed:true});
 await assert.rejects(()=>app.continue({task_id:f.task_id,grant_id:answer.grant_id},new AbortController().signal),{code:'RETRY_EXHAUSTED'});assert.equal(executions,2);assert.equal(calls,3);assert.deepEqual(stages,['generate_preparation','correct_preparation','generate_preparation']);const ledger=await f.store.readOperations({task_id:f.task_id}),local=ledger.usage.filter(u=>u.local_runs===1);assert.deepEqual(local.map(u=>u.execution_index),[0,1]);assert.equal(local[0].operation_id,local[1].operation_id);for(const u of before.usage)assert.deepEqual(ledger.usage.find(x=>x.execution_id===u.execution_id),u);
 await assert.rejects(()=>f.store.beginPreparation({version:'1.0',task_id:f.task_id,grant_id:answer.grant_id,source_set_id:f.selected.id,bindings,code_sha256:'c'.repeat(64)}),{code:'RETRY_EXHAUSTED'});assert.deepEqual(await f.store.readOperations({task_id:f.task_id}),ledger);await assert.rejects(()=>app.continue({task_id:f.task_id,grant_id:f.grant.grant_id},new AbortController().signal),{code:'AUTHORITY_REQUIRED'});assert.equal(calls,3);
});
