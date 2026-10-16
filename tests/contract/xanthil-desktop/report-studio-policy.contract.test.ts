import {test,type TestContext} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,realpathSync} from 'node:fs';
import {rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {createReportStudioPolicy} from '../../../adapters/report-studio/policy.ts';
const project='proj_synthetic',id=(n:number)=>`${String(n).padStart(8,'0')}-1111-4111-a111-111111111111`,material={source_id:'src_synthetic',sha256:'a'.repeat(64),kind:'text' as const},boundary={recipients_sha256:'b'.repeat(64),materials:[material]};
function fixture(t:TestContext){const root=realpathSync(mkdtempSync(join(tmpdir(),'studio-policy-')));t.after(()=>rm(root,{recursive:true,force:true}));const open=()=>createReportStudioPolicy({dataRoot:root,now:()=> '2026-10-16T00:00:00Z'});return {root,open,policy:open()};}
function authorize(p:ReturnType<typeof createReportStudioPolicy>){p.setMode(0,true);p.grant(project,0,{...boundary,allow_prompt:true,allow_screenshots:true,allow_network:true},boundary);}
test('RS-POLICY-01 explicit mode and exact recipient/material grant persist; configuration alone never authorizes',t=>{
 const {policy:p,open}=fixture(t);assert.equal(p.permissions(project,boundary).allowed,false);p.setMode(0,true);assert.equal(p.permissions(project,boundary).allowed,false);p.grant(project,0,{...boundary,allow_prompt:true,allow_screenshots:false,allow_network:false},boundary);assert.equal(open().permissions(project,boundary).allowed,true);assert.equal(p.permissions(project,boundary).allow_network,false);assert.equal(p.permissions(project,boundary).allow_screenshots,false);
});
test('RS-POLICY-01 granted subset remains valid, added/changed materials and recipients require differences; stale writes refuse',t=>{
 const {policy:p}=fixture(t);authorize(p);assert.equal(p.permissions(project,{...boundary,materials:[]}).allowed,true);assert.equal(p.permissions(project,{...boundary,materials:[{...material,sha256:'c'.repeat(64)}]}).allowed,false);assert.equal(p.permissions(project,{...boundary,recipients_sha256:'d'.repeat(64)}).allowed,false);assert.throws(()=>p.grant(project,0,{...boundary,allow_prompt:true,allow_screenshots:true,allow_network:true},boundary));p.revoke(project,1);assert.equal(p.permissions(project,boundary).allowed,false);p.setMode(1,false);assert.equal(p.mode().accepted,false);
});
test('RS-POLICY-01 each project has one active operation; stop admission is not physical completion',t=>{
 const {policy:p,open}=fixture(t);authorize(p);const op=p.begin(project,id(1),'main',boundary);assert.equal(op.state,'running');assert.throws(()=>p.begin(project,id(2),'image',boundary));assert.equal(p.stop(id(1)).state,'stopping');assert.equal(open().operation(id(1))?.state,'stopping');const saved=p.finish(id(1),{outcome:'cancelled',physical_settled:true,usage_known:true,sdk_run_id:'synthetic-run'});assert.equal(saved.state,'stopped');assert.equal(p.begin(project,id(2),'image',boundary).state,'running');
});
test('RS-POLICY-01 unresolved physical effects remain UNKNOWN; only saved settlement can be explicitly reconciled, unknown usage retained',t=>{
 const {policy:p}=fixture(t);authorize(p);p.begin(project,id(1),'main',boundary);assert.equal(p.finish(id(1),{outcome:'failed',physical_settled:false,usage_known:false,sdk_run_id:null}).state,'unknown');assert.throws(()=>p.reconcile(id(1)));assert.throws(()=>p.begin(project,id(2),'main',boundary));
 const second=fixture(t).policy;authorize(second);second.begin(project,id(2),'image',boundary);assert.equal(second.finish(id(2),{outcome:'failed',physical_settled:true,usage_known:false,sdk_run_id:'synthetic-failed'}).state,'unknown');const resolved=second.reconcile(id(2));assert.equal(resolved.state,'stopped');assert.equal(resolved.usage_known,false);assert.equal(second.projectOperations(project).length,1);
});
test('RS-POLICY-01 recovery preserves unfinished operation as UNKNOWN; no new grant or automatic replay',t=>{
 const {policy:p,open}=fixture(t);authorize(p);p.begin(project,id(1),'main',boundary);const reopened=open();reopened.recover();assert.equal(reopened.operation(id(1))?.state,'unknown');assert.throws(()=>reopened.begin(project,id(2),'main',boundary));assert.throws(()=>reopened.reconcile(id(1)));assert.equal(reopened.permissions(project,boundary).revision,1);
});

test('RS-POLICY-01 local export/preview need accepted execution mode but no model/material disclosure grant',t=>{
 const {policy:p}=fixture(t);assert.throws(()=>p.begin(project,id(1),'export',boundary));p.setMode(0,true);assert.equal(p.permissions(project,boundary).allowed,false);assert.equal(p.begin(project,id(1),'export',boundary).state,'running');p.finish(id(1),{outcome:'succeeded',physical_settled:true,usage_known:true,sdk_run_id:null});assert.equal(p.begin(project,id(2),'preview',boundary).state,'running');assert.throws(()=>p.begin('proj_other',id(3),'image',boundary));
});

test('RS-POLICY-01 unknown schema and corrupted permission are rejected without clearing history',async t=>{
 const {DatabaseSync}=await import('node:sqlite');
 const {readFile}=await import('node:fs/promises');
 for(const mutation of ['schema','grant']){const f=fixture(t);authorize(f.policy);const file=join(f.root,'.juanerai-policy.sqlite'),db=new DatabaseSync(file);try{db.exec(mutation==='schema'?'PRAGMA user_version=2':"UPDATE grant_history SET body_json='{}'");}finally{db.close();}const bytes=await readFile(file);assert.throws(()=>f.policy.permissions(project,boundary));assert.deepEqual(await readFile(file),bytes);}
});


test('RS-POLICY-01 linked policy database cannot read or modify external contents',async t=>{
 const {writeFile,symlink,readFile}=await import('node:fs/promises');const f=fixture(t),outside=join(f.root,'outside.txt'),content=Buffer.from('synthetic outside contents');await writeFile(outside,content);await symlink(outside,join(f.root,'.juanerai-policy.sqlite'));assert.throws(()=>f.policy.mode(),{code:'RS_POLICY_UNSAFE'});assert.throws(()=>f.policy.setMode(0,true),{code:'RS_POLICY_UNSAFE'});assert.deepEqual(await readFile(outside),content);
});

test('RS-POLICY-01 global lifecycle guard includes active and UNKNOWN across projects',t=>{
 const {policy:p}=fixture(t);assert.deepEqual(p.activeOperations(),[]);p.setMode(0,true);p.begin(project,id(1),'export',boundary);p.begin('proj_other',id(2),'preview',boundary);assert.equal(p.activeOperations().length,2);p.finish(id(1),{outcome:'succeeded',physical_settled:true,usage_known:true,sdk_run_id:null});p.recover();assert.deepEqual(p.activeOperations().map(op=>[op.operation_id,op.state]),[[id(2),'unknown']]);
});

test('RS-POLICY-01 consumption distinguishes new unresolved reservations from retained historical UNKNOWN',async()=>{
 const {reportStudioConsumptionStatus:status}=await import('../../../adapters/report-studio/policy.ts');
 assert.deepEqual(status(0,{reservedOutputTokens:32768},true),{operation_usage_known:false,cumulative_usage_known:false,reserved_output_tokens:32768});
 assert.deepEqual(status(32768,{reservedOutputTokens:32768},true),{operation_usage_known:true,cumulative_usage_known:false,reserved_output_tokens:32768});
 assert.deepEqual(status(0,{reservedOutputTokens:0},true),{operation_usage_known:true,cumulative_usage_known:true,reserved_output_tokens:0});
 for(const [before,usage,known] of [[null,{reservedOutputTokens:0},true],[0,{},true],[0,{reservedOutputTokens:0},false],[1,{reservedOutputTokens:-1},true],[1,{reservedOutputTokens:0},true]] as const)assert.equal(status(before,usage,known).operation_usage_known,false);
});
