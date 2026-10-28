import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {randomUUID} from 'node:crypto';
import {createPiProfessionalAgent} from '../../../adapters/agent-pi/professional-agent.ts';
import {offlineCredentials,offlineResponse} from '../../fixtures/xanthil-desktop/offline-professional-provider.ts';

test('OC-T06/RI-R03: independent source checking uses a separate native context in the same analysis route/work and keeps all physical usage',{timeout:15000},async()=>{
 const root=mkdtempSync(join(process.env.JUANERAI_NEWARCH_SHORT_ROOT!,'blind-')),secret='PRIMARY_RESULT_MUST_NOT_BE_A_VERIFICATION_ANSWER_7af0e',dtos:any[]=[];
 const agent=createPiProfessionalAgent({projectRoot:root,analysisModel:'mimo-v2.6-flash',credentials:offlineCredentials,authorizeWork:()=>true,fetch:async(url:unknown,init?:RequestInit)=>{
  const body=JSON.parse(String(init?.body));assert.match(String(url),/^https:\/\/token-plan-cn\.xiaomimimo\.com\//);assert.equal(body.model,'mimo-v2.6-flash');assert.equal(body.max_tokens??body.max_completion_tokens,32768);dtos.push(body);
  if(dtos.length===3)return offlineResponse(dtos.length,[{name:'read',args:{path:'synthetic/program.py',offset:2,limit:1}}]);
  return offlineResponse(dtos.length,[],dtos.length===1?secret:'Independent method proposal from authorized original source context.');
 }});
 const identity={task_id:randomUUID(),revision:'1',run_id:randomUUID(),attempt_id:randomUUID(),operation_id:randomUUID(),grant_id:randomUUID(),scope_sha256:'a'.repeat(64),config_sha256:await agent.configuration()};
 const common={identity,purpose:'analysis' as const,capabilities:async()=>[],authorize:()=>true,signal:new AbortController().signal};
 try{
  const first=await agent.advance({...common,command_id:randomUUID(),prompt:'Primary analysis; use only synthetic input.',system:'Primary analysis.'});await agent.assertCompleted(identity,first.completion);
  const computation_id=randomUUID(),turn={...common,command_id:randomUUID(),computation_context:{computation_id,role:'independent_source' as const},prompt:'Check the original authorized source with your own method. No primary program, value or intermediate is supplied.',system:'Independent source check; return your own method.'};
  const second=await agent.advance(turn);await agent.assertCompleted(identity,second.completion);
  assert.equal(dtos.length,2);assert.ok(!JSON.stringify(dtos[1]).includes(secret),'a second call in the primary native Session is not independent source evidence');
  assert.equal(second.completion.work_id,identity.task_id);
  const diagnostics=await agent.diagnostics(identity);assert.equal(diagnostics.meter!.model_attempts,2);assert.equal(diagnostics.meter!.recorded_input_tokens,14);assert.equal(diagnostics.meter!.unconfirmed_output_tokens,0);assert.equal(diagnostics.unconfirmed_effects,false);
  assert.deepEqual(agent.recipient('analysis'),{provider:'xiaomi-token-plan-cn',model:'mimo-v2.6-flash'});
  await assert.rejects(()=>agent.assertCompleted(identity,{...second.completion,computation_context:undefined}),{code:'EFFECT_UNCONFIRMED'});
  await assert.rejects(()=>agent.assertCompleted(identity,{...second.completion,computation_context:{computation_id,role:'method_review'}}),{code:'EFFECT_UNCONFIRMED'});
  const audited=await agent.advance({...common,command_id:randomUUID(),computation_context:{computation_id,role:'method_review'},prompt:'Read the authorized synthetic code page. This tests native read receipt binding, not arithmetic qualification.',system:'Read the requested page only.',materials:[{path:join(root,'analyses',identity.task_id,'020_clean/independent',computation_id,'method_review/synthetic/program.py'),content:'first=1\nsecond=2\nlast=3'}]});await agent.assertCompleted(identity,audited.completion);
  assert.equal(dtos.length,4);assert.equal(audited.completion.resource_reads!.length,1);
  const read=audited.completion.resource_reads![0]!;assert.equal(read.path,join(root,'analyses',identity.task_id,'020_clean/independent',computation_id,'method_review/synthetic/program.py'));assert.equal(read.first_line,2);assert.equal(read.last_line,2);
  await assert.rejects(()=>agent.assertCompleted(identity,{...audited.completion,resource_reads:[{...read,first_line:1}]}),{code:'EFFECT_UNCONFIRMED'});
  await assert.rejects(()=>agent.assertCompleted(identity,{...audited.completion,resource_reads:[{...read,sha256:'f'.repeat(64)}]}),{code:'EFFECT_UNCONFIRMED'});
  const final=await agent.diagnostics(identity);assert.equal(final.meter!.model_attempts,4);assert.equal(final.meter!.recorded_input_tokens,28);assert.equal(final.unconfirmed_effects,false);
  writeFileSync(join(root,'BLIND-CONTEXT-RESULT.json'),JSON.stringify({pid:process.pid,root,dtos,diagnostics:final,first:first.completion,second:second.completion,audited:audited.completion,real_provider_requests:0},null,2));
 }finally{await agent.waitForIdle();writeFileSync(join(root,'BLIND-CONTEXT-ATTEMPT.json'),JSON.stringify({root,pid:process.pid,dtos,real_provider_requests:0,closed:true},null,2));}
});
