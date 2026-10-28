import test from 'node:test';import assert from 'node:assert/strict';import {randomUUID} from 'node:crypto';import {mkdtempSync,writeFileSync,readFileSync,existsSync} from 'node:fs';import {join} from 'node:path';
import {createPiProfessionalAgent} from '../../../adapters/agent-pi/professional-agent.ts';
import {offlineCredentials,offlineResponse} from '../../fixtures/xanthil-desktop/offline-professional-provider.ts';
/** The old host invoke/argument repair wrapper is retired. These are actual
 * public native validation/feedback/effect tests, with synthetic Provider bytes. */
async function scenario(mode:'correct'|'repeat'|'withdraw'|'missing'){
 const root=mkdtempSync(join(process.env.JUANERAI_NEWARCH_SHORT_ROOT!,'args-')),feedback:string[]=[],schemas:unknown[]=[];let physical=0,effects=0,authorized=true;
 const parameters={type:'object',properties:{quantity:{type:'integer',minimum:0}},required:['quantity'],additionalProperties:false};
 const agent=createPiProfessionalAgent({projectRoot:root,analysisModel:'mimo-v2.6-flash',authorizeWork:()=>authorized,credentials:offlineCredentials,fetch:async(_url,init)=>{
  physical++;const dto=JSON.parse(String(init!.body));schemas.push(dto.tools.find((t:any)=>t.function.name==='calculate').function.parameters);
  if(physical===2){feedback.push(dto.messages.findLast((m:any)=>m.role==='tool').content);if(mode==='withdraw')authorized=false;}
  const call=mode==='repeat'?{name:'calculate',args:{}}:physical===1?{name:'calculate',args:mode==='correct'?{wrong:'RAW_SENTINEL'}:{}}:physical===2&&mode!=='missing'?{name:'calculate',args:{quantity:7}}:undefined;
  return offlineResponse(physical,call?[call]:[],'本合成用例只观察真实工具反馈。');
 }});
 const identity={task_id:randomUUID(),revision:'1',run_id:randomUUID(),attempt_id:randomUUID(),operation_id:randomUUID(),grant_id:randomUUID(),scope_sha256:'a'.repeat(64),config_sha256:await agent.configuration()};
 const running=agent.advance({identity,command_id:randomUUID(),purpose:'analysis',prompt:'按真实参数合同在配置额度内显式纠正，不添加授权或扩大范围。',system:'原生参数验证用例',capabilities:async()=>[{name:'calculate',description:'Owned validation side effect only, not business analysis.',effect:'write',parameters,execute:async args=>{effects++;writeFileSync(join(root,'effect.json'),JSON.stringify(args),{flag:'wx'});return {value:args.quantity};}}],authorize:()=>authorized,signal:new AbortController().signal});
 return {root,agent,identity,running,physical:()=>physical,effects:()=>effects,feedback,schemas,parameters};
}
test('V13-ARG01 actual native rejected parameters have no effect; Agent explicitly corrects against the unchanged schema',async()=>{
 const f=await scenario('correct'),result=await f.running;await f.agent.assertCompleted(f.identity,result.completion);assert.equal(f.physical(),3);assert.equal(f.effects(),1);assert.deepEqual(JSON.parse(readFileSync(join(f.root,'effect.json'),'utf8')),{quantity:7});assert.equal(f.feedback.length,1);assert.deepEqual(JSON.parse(f.feedback[0]!),{status:'rejected',code:'STRUCTURE_MISMATCH',executed:false,terminal:false});assert.doesNotMatch(f.feedback[0]!,/RAW_SENTINEL/);for(const schema of f.schemas)assert.deepEqual(schema,f.parameters);
 const facts=await f.agent.diagnostics(f.identity);assert.equal(facts.unconfirmed_effects,false);assert.equal(facts.observations.filter(o=>o.kind==='tool'&&o.completion==='completed').length,1);assert.equal(facts.observations.filter(o=>o.kind==='tool'&&o.completion==='unknown').length,0);
});
test('V13-ARG01 repeated native argument error stops; withdrawal also refuses a valid correction before effect',async()=>{
 for(const mode of ['repeat','withdraw'] as const){const f=await scenario(mode);await assert.rejects(()=>f.running);await f.agent.waitForIdle();assert.equal(f.physical(),mode==='repeat'?6:2);assert.equal(f.effects(),0);assert.equal(existsSync(join(f.root,'effect.json')),false);}
});
test('V13-ARG02 actual native missing-field refusal and unchanged declaration keep the required field visible without host diagnostic wrappers',async()=>{
 const f=await scenario('missing');await f.running;assert.equal(f.effects(),0);assert.equal(f.physical(),2);assert.equal(f.feedback.length,1);assert.deepEqual(JSON.parse(f.feedback[0]!),{status:'rejected',code:'STRUCTURE_MISMATCH',executed:false,terminal:false});for(const schema of f.schemas)assert.deepEqual(schema,f.parameters);assert.deepEqual(f.parameters.required,['quantity']);assert.doesNotMatch(f.feedback[0]!,/RAW_SENTINEL/);assert.equal(existsSync(join(f.root,'effect.json')),false);
});
