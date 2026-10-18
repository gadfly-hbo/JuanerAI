import test, {mock, after} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync, writeFileSync, readFileSync} from 'node:fs';
import {join} from 'node:path';
import {randomUUID, createHash} from 'node:crypto';
import * as actualSdk from 'pi-agent-runtime';

// Fault injection observes actual product option callbacks; every operation
// still enters the installed SDK, native Session and real product storage.
// No SDK helper, preparation, retry, accounting or view check is replaced.
let active;
const dto = request => JSON.stringify({model:request.model,messages:request.messages,
  maxOutputTokens:request.maxOutputTokens,thinkingLevel:request.thinkingLevel??null,deferred:request.deferred??null});
const injection = mock.module('pi-agent-runtime', {namedExports:{...actualSdk,
  createSessionRuntime(options) {
    const f=active;
    return actualSdk.createSessionRuntime({...options,
      authorize:async(action,signal)=>{
        const granted=await options.authorize(action,signal);
        if(action.kind==='model'){
          f.authorized.push(dto(action.request));f.authorizations++;
          if(f.mode==='initial-change'&&f.authorizations===1)f.change();
          if(f.authorizations===2&&f.mode==='deny'){f.allowed=false;return false;}
          if(f.authorizations===2&&f.mode==='cancel')f.controller.abort();
        }
        return granted;
      },
      audit:{append:async(event,signal)=>{
        await options.audit.append(event,signal);
        if(event.kind==='model.admitted'&&(f.mode==='send-change'||f.mode==='send-after-primary'&&event.attempt===2))f.change();
      }},
      ...(options.toolAdmission?{toolAdmission:{...options.toolAdmission,view:async context=>{
        const view=await options.toolAdmission.view(context);
        if(f.changed&&f.mode==='throw-view')throw Error('PRIVATE_VIEW_EXCEPTION');
        if(f.changed&&f.mode==='invalid-view')return {...view,tools:[...view.tools,{name:'PRIVATE_UNKNOWN_TOOL',parameters:{type:'object'}}]};
        // Same-version drift is adversarial input at the trusted callback;
        // the real product schema and installed SDK comparator remain intact.
        return f.sameVersion?{...view,version:'same-trusted-version'}:view;
      }}}:{}),
    });
  },
}});
after(()=>injection.restore());
const {createPiSessionOpenAnalysisRuntime}=await import('../../../adapters/agent-pi/native-open-analysis.ts');
const {createPersistentRuntimeState}=await import('../../../adapters/agent-pi/persistent-runtime-state.ts');
const {createLocalAnalysisRequestLedger}=await import('../../../adapters/storage-local/analysis-request-ledger.ts');
const {createApprovedProviderCredentials}=await import('../../../adapters/agent-pi/provider-credentials.ts');
const evidenceParent=process.env.JUANERAI_TEST_EVIDENCE_DIR;
assert.ok(evidenceParent,'a dedicated persistent synthetic evidence root is required');
const evidence=mkdtempSync(join(evidenceParent,'h3-physical-run-'));
const summaries=[];

function fixture(mode, {observations=true,sameVersion=false}={}) {
  const root=mkdtempSync(join(evidence,'h3-'+mode+'-'));
  const controller=new AbortController(),ledger=createLocalAnalysisRequestLedger({projectRoot:root});
  const f={root,mode,sameVersion,controller,ledger,allowed:true,changed:false,effects:0,sent:[],authorized:[],authorizations:0};
  const parameters={type:'object',properties:{value:{type:'string',enum:['A']}},required:['value'],additionalProperties:false};
  f.change=()=>{f.changed=true;parameters.properties.value.enum[0]='B';};
  const inspector={name:'inspect_selected',description:'Synthetic stage inspection',parameters,execute:async()=>{f.effects++;return {};}};
  const calculate={name:'calculate_and_verify',description:'Synthetic complete-program consumer',parameters:{type:'object',properties:{code_path:{type:'string',enum:['draft/analysis.py']}},required:['code_path'],additionalProperties:false},execute:async(_args,signal)=>{
    f.effects++;const code=await f.runtime.readCodeDraft({task_id:f.id.task_id,path:'draft/analysis.py',signal});
    if(mode==='effect-unknown')throw new actualSdk.RuntimeFault('INVALID_TOOL');
    assert.equal(code.code,'# prepared exactly once\nvalue=10\n');return {value:'10'};
  }};
  f.id={task_id:randomUUID(),revision:'1',run_id:randomUUID(),attempt_id:randomUUID(),operation_id:randomUUID(),grant_id:randomUUID(),scope_sha256:'a'.repeat(64),config_sha256:'b'.repeat(64)};
  f.input={identity:f.id,prompt:'Synthetic physical-attempt boundary',system:'No external data or effects',signal:controller.signal,authorize:()=>f.allowed,
    tools:[inspector,calculate],capabilityTools:[{...inspector,parameters:{...parameters,properties:{value:{type:'string',enum:['A','B']}}}},calculate]};
  const outcome=(request,stop='complete',unknown=false)=>({model:request.model,stop,physicalStatus:unknown?'unknown':'response-received',usageFinal:!unknown,
    usage:{inputTokens:unknown?{kind:'unknown'}:{kind:'known',value:3},outputTokens:unknown?{kind:'unknown'}:{kind:'known',value:1}},diagnostic:unknown?'UNKNOWN':'COMPLETE'});
  f.options={projectRoot:root,ledger,firstLoop:'v0.2',credentials:createApprovedProviderCredentials({environment:{}}),
    ...(observations?{r1r4:{contextAdmission:{policyVersion:'h3-physical-dto-v1',protocolOverheadTokens:512,safetyMarginTokens:8192}}}:{}),
    modelTransport:async request=>{
      f.sent.push(dto(request));assert.equal(f.sent.at(-1),f.authorized.at(-1),'authorization and actual transport DTO must agree');
      const count=f.sent.length;
      if((count===1&&mode!=='initial-change'&&mode!=='send-change')||(mode==='exhausted'&&count===2)){
        if(['fallback-change','same-version','throw-view','invalid-view','unknown'].includes(mode))f.change();
        throw new actualSdk.ProviderFailure('unavailable',outcome(request,'error',mode==='unknown'));
      }
      const step=count-1;
      const call=(name,args)=>[{kind:'tool',id:mode+'-'+count,name,arguments:args}];
      const content=step===1?call('write',{path:'draft/analysis.py',content:'# placeholder\n'})
        :step===2?call('edit',{path:'draft/analysis.py',edits:[{oldText:'# placeholder\n',newText:'# prepared exactly once\nvalue=10\n'}]})
        :step===3?call('read',{path:'draft/analysis.py'})
        :step===4?call('calculate_and_verify',{code_path:'draft/analysis.py'})
        :[{kind:'text',text:'Synthetic complete'}];
      const stop=step<5?'tools':'complete';
      return {content,stop,usage:{inputTokens:3,outputTokens:1},...(observations?{outcome:outcome(request,stop)}:{})};
    }};
  active=f;f.runtime=createPiSessionOpenAnalysisRuntime(f.options);
  f.state=createPersistentRuntimeState({projectRoot:root});
  return f;
}
function record(f) {
  const accounting=f.state.readAccounting(f.id.task_id),audit=f.state.readAudit(f.id.task_id),rows=f.ledger.read(f.id.task_id),diagnostics=f.runtime.readDiagnostics(f.id);
  const summary={mode:f.mode,root:f.root,identity:f.id,sent:f.sent.length,effects:f.effects,authorized_dtos:f.authorized.map(JSON.parse),sent_dtos:f.sent.map(JSON.parse),accounting,audit,rows,diagnostics};
  writeFileSync(join(f.root,'PHYSICAL-ATTEMPT-RESULT.json'),JSON.stringify(summary,null,2)+'\n');summaries.push({mode:f.mode,root:f.root,task_id:f.id.task_id,sent:f.sent.length,effects:f.effects});
  return summary;
}
async function rejected(f, code='INVALID_TOOL') {
  await assert.rejects(()=>f.runtime.run(f.input),{code});
  assert.equal(f.effects,0);const value=record(f);
  assert.doesNotMatch(JSON.stringify({audit:value.audit,diagnostics:value.diagnostics}),/PRIVATE_VIEW_EXCEPTION|PRIVATE_UNKNOWN_TOOL/);
  return value;
}

for(const observations of [true,false])test('H3-01 stable '+(observations?'fallback':'same-model extra')+' keeps DTO/once-extra and one native prepare/effect',async()=>{
  const f=fixture('stable-'+(observations?'fallback':'same-model'),{observations});
  const result=await f.runtime.run(f.input);assert.equal(result.text,'Synthetic complete');
  const v=record(f);assert.equal(f.sent.length,6);assert.equal(f.effects,1);
  const first=JSON.parse(f.sent[0]),second=JSON.parse(f.sent[1]);assert.deepEqual(first.messages,second.messages);
  assert.equal(second.model.id,observations?'mimo-v2.6-flash':'MiniMax-M3');assert.equal(second.maxOutputTokens,observations?16384:32768);
  assert.equal(v.accounting.usage.modelCalls,6);assert.equal(v.accounting.usage.reservedOutputTokens,observations?0:32768,'legacy observations-off must retain the unconfirmed first reservation');
  assert.deepEqual(v.audit.filter(e=>e.kind==='tool.admitted').map(e=>e.toolName),['write','edit','read','calculate_and_verify']);
  assert.equal(v.audit.filter(e=>e.kind==='tool.finished'&&e.toolName==='edit').length,1,'repeated native edit.prepare/execute would fail its original-text precondition');
  assert.equal(v.rows.length,6);assert.ok(v.rows.every(r=>r.status==='succeeded'||r.status==='temporary_failure'));
});

test('H3-02 initial authorization drift has zero reservation/send/effect',async()=>{
  const f=fixture('initial-change');const v=await rejected(f);
  assert.equal(f.sent.length,0);assert.equal(v.accounting.usage.modelCalls,0);assert.equal(v.accounting.usage.reservedOutputTokens,0);
  assert.equal(v.audit.filter(e=>e.kind==='model.admitted').length,0);assert.equal(v.rows.length,0);
  assert.equal(v.diagnostics.last_run.code,'REQUEST_REJECTED');
});
for(const sameVersion of [false,true])test('H3-02 '+(sameVersion?'same-version schema':'stage')+' drift blocks extra reservation and preserves primary usage',async()=>{
  const f=fixture(sameVersion?'same-version':'fallback-change',{sameVersion});const v=await rejected(f);
  assert.equal(f.sent.length,1);assert.equal(v.accounting.usage.modelCalls,1);assert.equal(v.accounting.usage.inputTokens,3);assert.equal(v.accounting.usage.outputTokens,1);assert.equal(v.accounting.usage.reservedOutputTokens,0);
  assert.equal(v.rows.length,1);assert.equal(v.rows[0].status,'temporary_failure');assert.equal(v.audit.filter(e=>e.kind==='model.admitted').length,1);
  assert.equal(v.diagnostics.last_run.code,'REQUEST_REJECTED');
});
for(const observations of [true,false])test('H3-03 audit IO drift is not-sent/known-zero; admitted count survives '+observations,async()=>{
  const f=fixture('send-change',{observations});const v=await rejected(f);
  assert.equal(f.sent.length,0);assert.equal(v.rows.length,0);assert.equal(v.accounting.usage.modelCalls,1);assert.equal(v.accounting.usage.reservedOutputTokens,0);assert.equal(v.accounting.usage.outputTokens,0);
  assert.equal(v.audit.filter(e=>e.kind==='model.admitted').length,1);assert.equal(v.audit.filter(e=>e.kind==='model.finished').length,1);
  if(observations){const observed=v.diagnostics.observations.filter(o=>o.kind==='model');assert.equal(observed.length,1);assert.equal(observed[0].physical_state,'not_sent');assert.equal(observed[0].usage_final,true);assert.equal(observed[0].input_tokens.kind,'known');assert.equal(observed[0].input_tokens.value,'0');assert.equal(observed[0].output_tokens.value,'0');assert.equal(observed[0].request_id,undefined);}
  assert.equal(v.diagnostics.last_run.code,'REQUEST_REJECTED');
});

test('H3-03 rejecting a reserved backup preserves the settled primary and both admitted counts',async()=>{
  const f=fixture('send-after-primary');const v=await rejected(f);
  assert.equal(f.sent.length,1);assert.equal(v.rows.length,1);assert.equal(v.accounting.usage.modelCalls,2);
  assert.equal(v.accounting.usage.inputTokens,3);assert.equal(v.accounting.usage.outputTokens,1);assert.equal(v.accounting.usage.reservedOutputTokens,0);
  const observations=v.diagnostics.observations.filter(o=>o.kind==='model');assert.deepEqual(observations.map(o=>o.physical_state),['response_received','not_sent']);
  assert.equal(observations[1].request_id,undefined);assert.equal(observations[1].output_tokens.value,'0');
});
test('H3-01 two classified failures exhaust the existing once-extra with no third send or tool effect',async()=>{
  const f=fixture('exhausted');await assert.rejects(()=>f.runtime.run(f.input),{code:'MODEL_FAILED'});
  const v=record(f);assert.equal(f.sent.length,2);assert.equal(f.effects,0);assert.equal(v.accounting.usage.modelCalls,2);assert.equal(v.rows.length,2);
});

test('H3-04 terminal remains on actual product reopen and native Fork without dispatch/replay',async()=>{
  const f=fixture('fallback-change');await rejected(f);const before=f.state.readAccounting(f.id.task_id);
  f.changed=false;f.input.tools[0].parameters.properties.value.enum[0]='A';
  const reopened=createPiSessionOpenAnalysisRuntime(f.options);f.runtime=reopened;
  const control={identity:f.id,signal:f.controller.signal,authorize:()=>true};
  let snap=await reopened.sessionControl({...control,command:{kind:'snapshot'}});
  assert.equal(snap.facts.availability,'available');assert.equal(snap.facts.admission.terminal,true);
  await reopened.sessionControl({...control,command:{kind:'fork'}});
  snap=await reopened.sessionControl({...control,command:{kind:'snapshot'}});assert.equal(snap.facts.admission.terminal,true);
  await assert.rejects(()=>reopened.run(f.input),{code:'INVALID_TOOL'});assert.equal(f.sent.length,1);assert.equal(f.effects,0);
  const after=f.state.readAccounting(f.id.task_id);assert.equal(after.usage.modelCalls,before.usage.modelCalls);assert.deepEqual(after.reservations,before.reservations);
  assert.equal(await reopened.reconcileStopped({...control}),false);record(f);
});
for(const mode of ['deny','cancel'])test('H3-04 '+mode+' stops the extra attempt without another admission',async()=>{
  const f=fixture(mode);await assert.rejects(()=>f.runtime.run(f.input),{code:mode==='deny'?'AUTHORITY_REQUIRED':'CANCELLED'});
  const v=record(f);assert.equal(f.sent.length,1);assert.equal(f.effects,0);assert.equal(v.accounting.usage.modelCalls,1);assert.equal(v.accounting.usage.reservedOutputTokens,0);
});
for(const mode of ['throw-view','invalid-view'])test('H3-04 '+mode+' is safe and never sends the extra request',async()=>{
  const f=fixture(mode);const v=await rejected(f,mode==='throw-view'?'STATE_FAILED':'INVALID_TOOL');assert.equal(f.sent.length,1);assert.equal(v.accounting.usage.modelCalls,1);assert.equal(v.rows.length,1);
});
test('H3-04 synthetic UNKNOWN survives reopening and refused recovery without a hidden extra',async()=>{
  const f=fixture('unknown');await assert.rejects(()=>f.runtime.run(f.input));
  const v=record(f);assert.equal(f.sent.length,1);assert.equal(v.accounting.usage.modelCalls,1);assert.equal(v.accounting.usage.reservedOutputTokens,32768);assert.equal(v.rows[0].status,'unknown');
  const before=structuredClone({usage:v.accounting.usage,reservations:v.accounting.reservations,rows:v.rows});
  const reopened=createPiSessionOpenAnalysisRuntime(f.options);await assert.rejects(()=>reopened.run(f.input));
  assert.equal(await reopened.reconcileStopped({identity:f.id,signal:f.controller.signal,authorize:()=>true}),false);
  assert.equal(f.sent.length,1);const a=f.state.readAccounting(f.id.task_id);assert.deepEqual({usage:a.usage,reservations:a.reservations,rows:f.ledger.read(f.id.task_id)},before);
});
test('H3-04 an executor INVALID_TOOL cannot turn its unknown started effect into a pre-effect refusal',async()=>{
  const f=fixture('effect-unknown');await f.runtime.run(f.input).catch(()=>undefined);
  const v=record(f);assert.equal(f.effects,1);assert.equal(v.diagnostics.unconfirmed_effects,true);
  assert.ok(v.audit.some(e=>e.kind==='tool.finished'&&e.toolName==='calculate_and_verify'&&e.toolOutcome?.status==='unknown'));
  assert.notEqual(v.diagnostics.last_run.code,'REQUEST_REJECTED');
});
after(()=>writeFileSync(join(evidence,'H3-PHYSICAL-ATTEMPTS-INDEX.json'),JSON.stringify(summaries,null,2)+'\n'));
