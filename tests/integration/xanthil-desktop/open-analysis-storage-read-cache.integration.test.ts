import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {randomUUID} from 'node:crypto';
import {DatabaseSync} from 'node:sqlite';
import {createLocalOpenAnalysisStore} from '../../../adapters/storage-local/open-analysis.ts';
import {taskHash} from '../../../packages/product-core/member-task.ts';
import {compileOpenAnalysisIR,executeOpenAnalysisIR} from '../../../packages/product-core/open-analysis-ir.ts';
import {verifyOpenAnalysisIntegerSum} from '../../../adapters/analytics-duckdb/open-analysis-verification.ts';
import type {MemberSourceInspection} from '../../../packages/ports/member-source.ts';
function fixture(){
 const root=mkdtempSync(join(tmpdir(),'juaner-read-fresh-')),store=createLocalOpenAnalysisStore({projectRoot:root});
 const source:MemberSourceInspection={version:'1.0',sources:[{source_id:randomUUID(),display_name:'数量.csv',format:'csv',sha256:'a'.repeat(64),byte_length:'1000',sheets:[{sheet_id:randomUUID(),name:'CSV',state:'visible',rows:[{row:1,cells:[{column:'A',type:'string',value:'数量'}]},...Array.from({length:100},(_,i)=>({row:i+2,cells:[{column:'A',type:'number' as const,value:String(i+1)}]}))]}]}]};
 let identity={task_id:randomUUID(),revision:'1',run_id:randomUUID(),attempt_id:randomUUID(),operation_id:randomUUID(),grant_id:randomUUID(),scope_sha256:taskHash(source),config_sha256:'b'.repeat(64)};
 const plan=compileOpenAnalysisIR({version:'1.0',goal:'合计数量',source_id:source.sources[0]!.source_id,sheet_id:source.sources[0]!.sheets[0]!.sheet_id,operation:'sum',column:'A',unit:'个'},source),calculation=executeOpenAnalysisIR(plan,source);
 store.create({identity,question:'合计数量',source});
 for(let n=1;n<=8;n++){
  const lease=store.begin(identity.task_id);store.saveFramework(lease,{version:'1.0',identity,origin:'MODEL_PROPOSAL',plan});store.saveOutcome(lease,{version:'1.0',outcome_id:randomUUID(),identity,framework:plan,calculation,verification:verifyOpenAnalysisIntegerSum(plan,calculation,source),explanation:{kind:'MODEL_EXPLANATION',text:'合计5050个'},human_judgment:'not_recorded'});
  if(n<8){const next={...identity,revision:String(n+1),run_id:randomUUID(),attempt_id:randomUUID(),operation_id:randomUUID()};store.revise(identity.task_id,{command_id:randomUUID(),expected_revision:String(n),question:'合计数量，第'+(n+1)+'版',identity:next,preferences:{skill:"general",prompt:"professional"}});identity=next;}
 }
 return {root,id:identity.task_id,store,dispose:()=>rmSync(root,{recursive:true,force:true})};
}
test('V13-READ094: repeated public reads of unchanged history avoid repeated full validation without changing the saved value',()=>{
 const f=fixture();try{const store=createLocalOpenAnalysisStore({projectRoot:f.root});const began=performance.now(),first=store.read(f.id)!,cold=performance.now()-began;const samples=[];
 for(let n=0;n<5;n++){const start=performance.now(),value=store.read(f.id);samples.push(performance.now()-start);assert.deepEqual(value,first);}
 const median=samples.sort((a,b)=>a-b)[2]!;assert.ok(median<cold/4,'unchanged saved history must have materially cheaper warm reads');assert.equal(first.outcome!.calculation.value,'5050');
 }finally{f.dispose();}
});
test('V13-READ094: latest database state and stop epoch win over prior readback; returned values cannot mutate the saved task',()=>{
 const f=fixture();try{const reader=createLocalOpenAnalysisStore({projectRoot:f.root});const original=reader.read(f.id)!;const changed=reader.read(f.id)!;changed.question='caller mutation';changed.history![0]!.question='caller history mutation';assert.deepEqual(reader.read(f.id),original);
 const writer=createLocalOpenAnalysisStore({projectRoot:f.root});const next={...original.identity,revision:'9',run_id:randomUUID(),attempt_id:randomUUID(),operation_id:randomUUID()};writer.revise(f.id,{command_id:randomUUID(),expected_revision:'8',question:'新的真实问题',identity:next,preferences:{skill:"general",prompt:"professional"}});const lease=writer.begin(f.id);assert.equal(reader.read(f.id)!.state,'running');writer.stop(f.id);const latest=reader.read(f.id)!;assert.equal(latest.state,'unknown');assert.notEqual(latest.epoch,lease.epoch);assert.equal(latest.question,'新的真实问题');assert.throws(()=>reader.saveCheckpoint(lease,{version:'1.0',turn:0,messages:[],calculation:null,verification:null}),{code:'LEASE_EXPIRED'});
 }finally{f.dispose();}
});
for(const mode of ['bytes-only','digest-only','invalid-history-with-valid-digest'] as const)test('V13-READ094: repeated read still rejects '+mode,()=>{
 const f=fixture();try{const reader=createLocalOpenAnalysisStore({projectRoot:f.root});reader.read(f.id);const db=new DatabaseSync(join(f.root,'.xanthil/desktop/open-analysis.sqlite'));try{const row=db.prepare('SELECT body_json,body_sha256 FROM tasks WHERE task_id=?').get(f.id)!;const body=JSON.parse(String(row.body_json));if(mode==='invalid-history-with-valid-digest')body.history[0].state='invented';else body.question='changed';db.prepare('UPDATE tasks SET body_json=?,body_sha256=? WHERE task_id=?').run(mode==='digest-only'?row.body_json:JSON.stringify(body),mode==='invalid-history-with-valid-digest'?taskHash(body):mode==='digest-only'?'0'.repeat(64):row.body_sha256,f.id);}finally{db.close();}assert.throws(()=>reader.read(f.id),{code:'INTEGRITY_BLOCKED'});
 }finally{f.dispose();}
});
