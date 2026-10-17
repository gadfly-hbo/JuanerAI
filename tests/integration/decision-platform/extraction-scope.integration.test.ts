import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,rmSync,realpathSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {randomUUID} from 'node:crypto';
import {createDecisionExtractionScope,readRuntimeState} from '../../../adapters/decision-platform/extraction-scope.ts';
test('DP-RUNTIME-02: source and teach rechecked at model/publish; persisted reservations block new invocation and reopening',async()=>{
 const root=realpathSync(mkdtempSync(join(tmpdir(),'dp-scope-'))),project=randomUUID(),name='source-'+randomUUID(),taskId='extract:'+project+':'+name,filename=name+'.md';
 try{
 const dir=join(root,'projects',project,'reports');mkdirSync(dir,{recursive:true});writeFileSync(join(dir,filename),'synthetic');
 let teach:unknown={dismissalReasons:[],manualAdditions:[]},count=0;
 const bridge=createDecisionExtractionScope({dataRoot:root,calibration:()=>teach,authorize:async()=>{count++;return true;}});
 const input={taskId,reportName:filename,calibration:teach},signal=new AbortController().signal,model={provider:'synthetic',id:'codec'};
 assert.equal(await bridge.authorize({kind:'model',taskId,request:{model}},signal),false);
 await bridge.run(input,async()=>{
  assert.equal(bridge.state(project).active,true);
  writeFileSync(join(root,'agent-ledger.json'),JSON.stringify({version:1,tasks:{[taskId]:{taskId,active:true,usage:{reservedOutputTokens:8192}}}}));assert.equal(bridge.state(project).unknown,false);
  await assert.rejects(bridge.run(input,async()=>{}),/DP_BUSY_OR_UNKNOWN/);
  assert.equal(await bridge.authorize({kind:'model',taskId,request:{model}},signal),true);
  teach={dismissalReasons:['changed'],manualAdditions:[]};assert.equal(await bridge.authorize({kind:'publish',taskId},signal),false);
  teach=input.calibration;writeFileSync(join(dir,filename),'changed');assert.equal(await bridge.authorize({kind:'model',taskId,request:{model}},signal),false);
 });assert.equal(count,1);
 writeFileSync(join(root,'agent-ledger.json'),JSON.stringify({version:1,tasks:{[taskId]:{taskId,active:false,usage:{reservedOutputTokens:8192}}}}));
 assert.deepEqual(readRuntimeState(root,project),{active:false,unknown:true});await assert.rejects(bridge.run(input,async()=>{}),/DP_BUSY_OR_UNKNOWN/);
 assert.equal(createDecisionExtractionScope({dataRoot:root,calibration:()=>teach,authorize:async()=>true}).state(project).unknown,true);
 writeFileSync(join(root,'agent-ledger.json'),'invalid');assert.equal(readRuntimeState(root).unknown,true);
 }finally{rmSync(root,{recursive:true,force:true});}
});
