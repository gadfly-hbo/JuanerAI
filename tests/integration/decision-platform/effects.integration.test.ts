import {test} from 'node:test';import assert from 'node:assert/strict';import {mkdtempSync,rmSync,realpathSync} from 'node:fs';import {join} from 'node:path';import {tmpdir} from 'node:os';import {randomUUID} from 'node:crypto';
import {createDecisionStore} from '../../../adapters/decision-platform/store.ts';import {createDecisionEffects} from '../../../packages/application/decision-effects.ts';import type {DecisionCommand,DecisionEffectsGateway} from '../../../packages/ports/decision-platform.ts';
test('DP-WRITE-01/02: one POST, saved receipt, lost reply readback; unknown and cross-task retries do not duplicate',async()=>{
 const root=realpathSync(mkdtempSync(join(tmpdir(),'dp-effects-')));
 try{
 const store=createDecisionStore({projectRoot:root,projectId:randomUUID()}),taskId=randomUUID(),plugin=randomUUID();store.prepareBinding({id:randomUUID(),taskId,marker:randomUUID(),pluginProjectId:null});store.bindProject(taskId,plugin);
 let calls=0,known=true,lost=false,runtimeUnknown=false;const observed={id:randomUUID()};
 const gateway:DecisionEffectsGateway={prepare:async(_p,command)=>({command,beforeIds:[]}),execute:async()=>{calls++;if(lost)throw Error('reply lost');},confirm:async()=>known?observed:null,state:async()=>({active:false,unknown:runtimeUnknown})};
 const config={store,gateway,authorize:async()=>{},now:()=>new Date().toISOString()},app=createDecisionEffects(config),command:DecisionCommand={type:'feedback',id:randomUUID(),adopted:true,outcome:'synthetic',metricDelta:'',review:'',score:4},id=randomUUID();
 assert.deepEqual(await app.write(id,taskId,command),observed);assert.deepEqual(await app.write(id,taskId,command),observed);assert.equal(calls,1);
 await assert.rejects(app.write(id,taskId,{...command,score:3}),/DP_OPERATION_CONFLICT/);
 const lostId=randomUUID();lost=true;await assert.rejects(app.write(lostId,taskId,command),/DP_EFFECT_UNKNOWN/);assert.equal(calls,2);assert.equal(store.intent(lostId)?.state,'unknown');
 await assert.rejects(app.write(randomUUID(),taskId,command),/DP_BUSY_OR_UNKNOWN/);assert.equal(calls,2);
 known=false;await assert.rejects(app.reconcile(lostId),/DP_EFFECT_UNKNOWN/);assert.equal(store.intent(lostId)?.state,'unknown');known=true;
 assert.deepEqual(await createDecisionEffects(config).reconcile(lostId),observed);assert.equal(calls,2);
 runtimeUnknown=true;await assert.rejects(app.write(randomUUID(),taskId,command),/DP_BUSY_OR_UNKNOWN/);assert.equal(calls,2);
 }finally{rmSync(root,{recursive:true,force:true});}
});
