import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,realpathSync,existsSync,readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createResearchModel} from '../../../adapters/deep-research/runtime.mjs';
const programRoot=process.env.DR_PROGRAM_ROOT;
test('DR R03/C04: actual fixed SDK checks live host authority before transport and publish',{skip:!programRoot},async()=>{
 const dataRoot=realpathSync(mkdtempSync(join(tmpdir(),'dr-runtime-')));let allowed=false,calls=0;const admissions=[];
 const model=await createResearchModel({programRoot,dataRoot,authorize:async(effect,detail)=>{admissions.push({effect,detail});return allowed;},candidates:[{model:{provider:'minimax-cn',id:'MiniMax-M3',protocol:'anthropic-messages',endpoint:'https://synthetic.invalid',contextWindow:1048576,maxOutputTokens:32768,reasoning:true,input:['text']},transport:async()=>{calls++;return {content:[{kind:'text',text:'{"issues":[],"counterexampleChecked":true}'}],stop:'complete',usage:{inputTokens:1,outputTokens:1}};}}]});
 await assert.rejects(model.runStage('review',{},'host:deny:0'),/AUTHORITY_REQUIRED/);assert.equal(calls,0);
 allowed=true;await model.runStage('review',{},'host:allow:0');assert.equal(calls,1);assert.ok(admissions.some(a=>a.detail.kind==='publish'));
 allowed=false;await assert.rejects(model.runStage('review',{},'host:revoked:0'),/AUTHORITY_REQUIRED/);assert.equal(calls,1);
 assert.ok(existsSync(join(dataRoot,'model-audit.jsonl')));assert.ok(readFileSync(join(dataRoot,'model-audit.jsonl'),'utf8').includes('host:allow:0'));
});
