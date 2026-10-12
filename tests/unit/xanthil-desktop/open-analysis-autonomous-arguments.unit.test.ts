import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {createSharedAnalysisTool} from '../../../adapters/agent-pi/open-analysis.ts';
import type {OpenAnalysisRun} from '../../../packages/ports/open-analysis-runtime.ts';
function fixture(recover=false){let effects=0,authorized=true;
 const input=Object.assign({identity:{task_id:randomUUID(),revision:'1',run_id:randomUUID(),attempt_id:randomUUID(),operation_id:randomUUID(),grant_id:randomUUID(),scope_sha256:'a'.repeat(64),config_sha256:'b'.repeat(64)},prompt:'核对数值',system:'授权工具',signal:new AbortController().signal,authorize:()=>authorized,tools:[{name:'calculate',description:'已支持方法',parameters:{type:'object',properties:{quantity:{type:'integer',minimum:0}},required:['quantity'],additionalProperties:false},execute:async()=>{effects++;return {value:7};}}]} satisfies OpenAnalysisRun,{recoverInvalidArguments:recover});
 const tool=createSharedAnalysisTool(()=>input);return {run:(name:string,args:unknown)=>tool.execute({name,arguments_json:JSON.stringify(args)},input.signal),effects:()=>effects,revoke:()=>authorized=false};
}
test('V13-ARG01 strict legacy defaults and unauthorized names never get a repair exception',async()=>{const f=fixture();await assert.rejects(()=>f.run('calculate',{}),{code:'TOOL_ARGUMENT_INVALID'});assert.equal(f.effects(),0);const g=fixture(true);await assert.rejects(()=>g.run('secret-reader',{}),{code:'TOOL_POLICY_VIOLATION'});assert.equal(g.effects(),0);});
test('V13-ARG01 rejected parameters produce safe actual diagnostic before effects; model correction uses unchanged schema',async()=>{const f=fixture(true);const reply=await f.run('calculate',{wrong:'RAW_SENTINEL'}) as any;assert.equal(reply.status,'invalid_arguments');assert.equal(reply.executed,false);assert.ok(reply.issues.length);assert.equal(JSON.stringify(reply).includes('RAW_SENTINEL'),false);assert.equal(f.effects(),0);assert.deepEqual(await f.run('calculate',{quantity:7}),{value:7});assert.equal(f.effects(),1);});
test('V13-ARG01 repeated invalid arguments terminate; withdrawal still rejects valid correction without effects',async()=>{const f=fixture(true);await f.run('calculate',{});await assert.rejects(()=>f.run('calculate',{}),{code:'TOOL_ARGUMENT_INVALID'});assert.equal(f.effects(),0);const g=fixture(true);await g.run('calculate',{});g.revoke();await assert.rejects(()=>g.run('calculate',{quantity:7}),{code:'AUTHORITY_REQUIRED'});assert.equal(g.effects(),0);});
test('V13-ARG02 missing-field feedback identifies the actual schema field without echoing rejected data',async()=>{const f=fixture(true);const reply=await f.run('calculate',{}) as any;assert.deepEqual(reply.issues[0].required_properties,['quantity']);assert.equal(reply.issues[0].schema_path,'#');assert.equal(f.effects(),0);});

// A missing delimiter must be observable without echoing the rejected payload.
test('V13-ARG03 malformed JSON feedback exposes only parser position before any effect',async()=>{
 let effects=0; const input={identity:{task_id:randomUUID(),revision:'1',run_id:randomUUID(),attempt_id:randomUUID(),operation_id:randomUUID(),grant_id:randomUUID(),scope_sha256:'a'.repeat(64),config_sha256:'b'.repeat(64)},prompt:'核对',system:'授权',signal:new AbortController().signal,authorize:()=>true,recoverInvalidArguments:true,tools:[{name:'calculate',description:'计算',parameters:{type:'object',properties:{items:{type:'array',items:{type:'string'}}},required:['items'],additionalProperties:false},execute:async()=>{effects++;return {value:7};}}]} satisfies OpenAnalysisRun;
 const tool=createSharedAnalysisTool(()=>input),reply=await tool.execute({name:'calculate',arguments_json:'{"items":["PRIVATE_SENTINEL"},"unexpected":true}'},input.signal) as any;
 assert.equal(reply.executed,false);assert.equal(reply.issues[0].keyword,'valid_json');assert.equal(typeof reply.issues[0].position,'number');assert.ok(reply.issues[0].position>=0);assert.equal(JSON.stringify(reply).includes('PRIVATE_SENTINEL'),false);assert.equal(effects,0);
 assert.deepEqual(await tool.execute({name:'calculate',arguments_json:'{"items":["valid"]}'},input.signal),{value:7});assert.equal(effects,1);
});
