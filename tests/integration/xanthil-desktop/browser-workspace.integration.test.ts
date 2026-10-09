import assert from 'node:assert/strict';
import test from 'node:test';
import {randomUUID} from 'node:crypto';
import {mkdtempSync,readFileSync} from 'node:fs';
import {join} from 'node:path';
import * as browserApplication from '../../../packages/application/browser-membership.ts';
import {startBrowserMembershipServer} from '../../../apps/browser/local-server.ts';
import {browserEvidenceRoot} from '../../fixtures/xanthil-desktop/browser-evidence.ts';
import {createFreshBrowserProjectStore} from '../../../adapters/storage-local/desktop-state.ts';
import {createLocalMembershipTaskStore} from '../../../adapters/storage-local/member-task.ts';
import {createXanthilDesktopDecisionCaseApplication} from '../../../packages/application/xanthil-desktop-decision-case.ts';
import {createMembershipTaskApplication} from '../../../packages/application/member-task.ts';
import {createMemberSourcesApplication} from '../../../packages/application/member-sources.ts';
import {createMemberSourcePreparation} from '../../../adapters/analytics-duckdb/member-source-inspection.ts';
import {createU12ProjectAdmissionApplication} from '../../fixtures/xanthil-desktop/desktop-contract-drivers.ts';
import {browserSourceFixture} from '../../fixtures/xanthil-desktop/browser-sources.ts';

test('BF-R01/04/08 E01-c: browser creates a durable task and uploads mixed sources with command readback',async()=>{
 const factory=Reflect.get(browserApplication,'createBrowserMembershipWorkspaceApplication');assert.equal(typeof factory,'function','E01-c: ordinary browser workspace Application must exist');
 const projectRoot=join(mkdtempSync(join(browserEvidenceRoot,'workspace-')),'project'),desktopStore=createFreshBrowserProjectStore({projectRoot}),f=await createU12ProjectAdmissionApplication(projectRoot),project_id=randomUUID();
 const desktop=createXanthilDesktopDecisionCaseApplication({...f.dependencies,store:desktopStore});await desktop.openProject({contract_version:'1.0',command_id:randomUUID(),proposed_project_id:project_id,display_name:'Synthetic browser workspace'});
 const store=createLocalMembershipTaskStore(projectRoot),tasks=createMembershipTaskApplication({store,desktop,project_id}),bin=process.env.JUANERAI_TOOLCHAIN_BIN!,runtime=createMemberSourcePreparation({pythonExecutable:join(bin,'python3'),pythonVersion:'3.14.4'}),sources=createMemberSourcesApplication(store,runtime.inspectSources);
 const {createLocalMembershipPolicyStore}=await import('../../../adapters/storage-local/member-model-policy.ts'),{createMembershipPolicyAccess,createLocalModelAccess}=await import('../../../packages/application/provider-settings.ts'),{createMembershipModelApplication}=await import('../../../packages/application/member-model.ts');
 const policyStore=createLocalMembershipPolicyStore(mkdtempSync(join(browserEvidenceRoot,'workspace-policy-')));await policyStore.initializeApproved();const modelAccess=createLocalModelAccess(false),policyAccess=createMembershipPolicyAccess(policyStore,modelAccess),modelApplication=createMembershipModelApplication({store,runtime:{async turn(){assert.fail('no Provider');}},modelAccess,policy:async()=>(await policyAccess.read()).policy});
 const workspace=factory({store,tasks,sources,project_id,models:{policy:policyAccess,application:modelApplication}});const server=await startBrowserMembershipServer({store,...{workspace}});
 const call=async(path:string,body?:unknown,headers:Record<string,string>={})=>{const response=await fetch(server.origin+path,{method:body===undefined?'GET':'POST',headers:{...(body===undefined?{}:{'content-type':'application/json',origin:server.origin}),...headers},...(body===undefined?{}:{body:JSON.stringify(body)})});return {status:response.status,headers:response.headers,body:await response.json()};};
 try{const entry=await fetch(server.origin+'/');assert.equal(entry.status,200,'E01-d: first browser navigation serves only the minimal bootstrap shell');assert.match(await entry.text(),/bootstrap.mjs/);assert.equal((await fetch(server.origin+'/workspace.mjs')).status,401);assert.equal((await fetch(server.origin+'/styles.css')).status,401);const boot=await call('/v1/bootstrap',{token:server.bootstrap}),cookie=boot.headers.get('set-cookie')!.split(';')[0],auth={cookie,'x-xanthil-control':boot.body.control};
  assert.equal((await fetch(server.origin+'/workspace.mjs',{headers:{cookie}})).status,200);
  const command={version:'1.0',command_id:randomUUID(),question:'核实本期会员复购变化'};
  assert.equal((await call('/v1/tasks',command,{cookie})).status,403);
  const created=await call('/v1/tasks',command,auth);assert.equal(created.status,200);assert.ok(created.body.task_id);const task_id=created.body.task_id;
  const receipt=await call('/v1/commands/'+command.command_id,undefined,{cookie});assert.equal(receipt.body.task_id,task_id);assert.equal(receipt.body.kind,'task_created');
  assert.equal((await call('/v1/tasks',command,auth)).body.task_id,task_id);assert.equal((await call('/v1/tasks',{...command,question:'不同问题'},auth)).status,409);
  const state=await call('/v1/tasks/'+task_id,undefined,{cookie});assert.equal(state.body.case.revision.question_text,command.question);assert.equal(state.body.case.revision.hypothesis_display_title,'','browser question must not assert a decline');const files=browserSourceFixture().map(({bytes,...source})=>({...source,base64:Buffer.from(bytes).toString('base64')})),selection={version:'1.0',command_id:randomUUID(),task_id,expected_row_version:state.body.task.row_version,epoch:state.body.task.epoch,sources:files};
  const uploaded=await call('/v1/tasks/'+task_id+'/sources',selection,auth);assert.equal(uploaded.status,200);assert.equal(uploaded.body.sources.length,3);
  const refreshed=await call('/v1/tasks/'+task_id,undefined,{cookie});assert.equal(refreshed.body.source_summary.sources.length,3);assert.equal(refreshed.body.source_summary.sources[1].sheets.length,2);assert.equal('inspection' in refreshed.body.source_summary,false);
  const sourceReceipt=await call('/v1/commands/'+selection.command_id,undefined,{cookie});assert.equal(sourceReceipt.body.kind,'sources_selected');assert.equal(sourceReceipt.body.source_set_id,uploaded.body.id);
  const policy=await call('/v1/model-policy',undefined,{cookie});assert.equal(policy.status,200);assert.equal(policy.body.available,false);assert.equal(policy.body.policy.model,'mimo-v2.6-pro');
  const material={version:'1.0',command_id:randomUUID(),task_id,source_set_id:uploaded.body.id,expected_row_version:refreshed.body.task.row_version,epoch:refreshed.body.task.epoch,policy_sha256:policy.body.sha256,disclose_question:true,disclose_structure:true,confirmed:true};
  const beforeGrant=readFileSync(join(projectRoot,'.xanthil/desktop/state.sqlite'));for(const invalid of [{...material,policy_sha256:'0'.repeat(64)},{...material,epoch:material.epoch+1},{...material,confirmed:false},{...material,policy:{model:'other'}},{...material,disclose_structure:false}])assert.equal((await call('/v1/tasks/'+task_id+'/model-authorization',invalid,auth)).status,400);assert.deepEqual(readFileSync(join(projectRoot,'.xanthil/desktop/state.sqlite')),beforeGrant);assert.equal((await call('/v1/tasks/'+task_id+'/model-authorization',material,{cookie})).status,403);
  const granted=await call('/v1/tasks/'+task_id+'/model-authorization',material,auth);assert.equal(granted.status,200);assert.equal(granted.body.kind,'model_authorized');assert.deepEqual((await call('/v1/commands/'+material.command_id,undefined,{cookie})).body,granted.body);assert.deepEqual((await call('/v1/tasks/'+task_id+'/model-authorization',material,auth)).body,granted.body);assert.equal((await call('/v1/tasks/'+task_id+'/model-authorization',{...material,disclose_question:false},auth)).status,409);
  const before=readFileSync(join(projectRoot,'.xanthil/desktop/state.sqlite'));assert.equal((await call('/v1/tasks/'+task_id+'/stop',{version:'1.0',command_id:material.command_id},auth)).status,409,'one command cannot authorize and stop');assert.deepEqual(readFileSync(join(projectRoot,'.xanthil/desktop/state.sqlite')),before);assert.equal((await call('/v1/tasks/'+task_id+'/sources',{...selection,command_id:randomUUID(),sources:[{...files[0],path:'/private/secret'}]},auth)).status,400);assert.deepEqual(readFileSync(join(projectRoot,'.xanthil/desktop/state.sqlite')),before);
  for(const bad of [
   {...selection,command_id:randomUUID(),epoch:selection.epoch+1},
   {...selection,command_id:randomUUID(),sources:[{...files[0],base64:'AQ==='}]},
   {...selection,command_id:randomUUID(),sources:[{...files[0],display_name:'../source.csv'}]},
   {...selection,command_id:randomUUID(),sources:files,extra:'unknown'},
  ])assert.equal((await call('/v1/tasks/'+task_id+'/sources',bad,auth)).status,400);
  assert.equal((await call('/v1/tasks/'+task_id+'/sources',selection,{cookie})).status,403);assert.deepEqual(readFileSync(join(projectRoot,'.xanthil/desktop/state.sqlite')),before);
  assert.equal((await call('/v1/tasks',undefined,{cookie})).body.tasks.length,1);
  const partial={version:'1.0',command_id:randomUUID(),question:'合成创建中断'},createTask=store.create;try{store.create=async()=>{throw Object.assign(new Error('synthetic creation interruption'),{code:'SYNTHETIC_FAULT'});};assert.equal((await call('/v1/tasks',partial,auth)).status,400);}finally{store.create=createTask;}
  const pending=await call('/v1/commands/'+partial.command_id,undefined,{cookie});assert.equal(pending.status,200);assert.equal(pending.body.kind,'task_creation_pending','E01-c: partial durable creation remains a readable pending outcome, not conflict or success');
  const completed=await call('/v1/tasks',partial,auth);assert.equal(completed.status,200);assert.equal((await call('/v1/tasks',undefined,{cookie})).body.tasks.length,2);
 }finally{await server.close();}
});
