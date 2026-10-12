import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {browserEvidenceRoot} from '../../fixtures/xanthil-desktop/browser-evidence.ts';
import {createPersistentRuntimeState} from '../../../adapters/agent-pi/persistent-runtime-state.ts';
test('SDK041-FIX06 settings probe uses persistent SDK metering across instances, fixed text and no retries',async()=>{
 const {createPiConnectionProbe}=await import('../../../adapters/agent-pi/native-connection-probe.ts');
 const root=mkdtempSync(join(browserEvidenceRoot,'sdk041-probe-'));let calls=0;
 const make=()=>createPiConnectionProbe({root,modelTransport:async request=>{calls++;assert.equal(request.maxOutputTokens,128);assert.equal(request.model.id,'mimo-v2.6-pro');assert.equal(request.tools?.length??0,0);assert.ok(request.messages.some(m=>m.text==='Reply with OK.'));return {content:[{kind:'text',text:'OK'}],stop:'complete',usage:{inputTokens:2,outputTokens:1}};}});
 await make()('synthetic-key',new AbortController().signal);await make()('synthetic-key',new AbortController().signal);
 const state=createPersistentRuntimeState({projectRoot:root});assert.equal(state.readAudit('connection-test-xiaomi-pro-v1').filter(e=>e.kind==='model.admitted').length,2);assert.equal(calls,2);
 const c=new AbortController();c.abort();await assert.rejects(make()('synthetic-key',c.signal));assert.equal(calls,2);
 for(const file of ['apps/browser/service-main.ts','apps/desktop/browser-native.ts','apps/desktop/main.ts']){const source=readFileSync(new URL('../../../'+file,import.meta.url),'utf8');assert.ok(source.includes('createPiConnectionProbe'));assert.equal(source.includes('probe:probeLocalXiaomi'),false);}
});

test('SDK041-FIX06 provider failure cannot auto retry or clear UNKNOWN across host reconstruction',async()=>{
 const {createPiConnectionProbe}=await import('../../../adapters/agent-pi/native-connection-probe.ts');const {ProviderFailure}=await import('pi-agent-runtime');
 const root=mkdtempSync(join(browserEvidenceRoot,'sdk041-probe-failure-'));let calls=0;
 const make=()=>createPiConnectionProbe({root,modelTransport:async()=>{calls++;throw new ProviderFailure('quota');}});
 await assert.rejects(make()('synthetic-key',new AbortController().signal),{code:'QUOTA_EXCEEDED'});assert.equal(calls,1);
 assert.equal(createPersistentRuntimeState({projectRoot:root}).hasUnsettledModel('connection-test-xiaomi-pro-v1'),true);
 await assert.rejects(make()('synthetic-key',new AbortController().signal),{code:'REQUEST_UNCONFIRMED'});assert.equal(calls,1);
});
test('SDK041-FIX06 actual SDK HTTP builder has fixed 128token probe and retains safe audit without key',async()=>{
 const {createPiConnectionProbe}=await import('../../../adapters/agent-pi/native-connection-probe.ts');const root=mkdtempSync(join(browserEvidenceRoot,'sdk041-probe-wire-'));let calls=0;
 const probe=createPiConnectionProbe({root,fetch:async(url,options)=>{calls++;assert.equal(String(url),'https://token-plan-cn.xiaomimimo.com/v1/chat/completions');const wire=JSON.parse(String(options?.body));assert.equal(wire.max_completion_tokens,128);assert.equal(wire.model,'mimo-v2.6-pro');assert.deepEqual(wire.messages,[{role:'user',content:'Reply with OK.'}]);assert.equal(wire.tools,undefined);assert.equal(JSON.stringify(wire).includes('synthetic-only-key'),false);
 const chunk={id:'synthetic',object:'chat.completion.chunk',created:0,model:'mimo-v2.6-pro',choices:[{index:0,delta:{role:'assistant',content:'OK.'},finish_reason:'stop'}],usage:{prompt_tokens:10,completion_tokens:2,total_tokens:12}};return new Response('data: '+JSON.stringify(chunk)+'\n\ndata: [DONE]\n\n',{headers:{'content-type':'text/event-stream'}});}});
 await probe('synthetic-only-key',new AbortController().signal);assert.equal(calls,1);assert.equal(JSON.stringify(createPersistentRuntimeState({projectRoot:root}).readAudit('connection-test-xiaomi-pro-v1')).includes('synthetic-only-key'),false);
});
test('SDK041-FIX06 corrupt persistent state rejects before model admission',async()=>{
 const {createPiConnectionProbe}=await import('../../../adapters/agent-pi/native-connection-probe.ts');const root=mkdtempSync(join(browserEvidenceRoot,'sdk041-probe-corrupt-'));const state=createPersistentRuntimeState({projectRoot:root});state.readAudit('connection-test-xiaomi-pro-v1');writeFileSync(join(root,'.xanthil','desktop','pi-runtime.sqlite'),'broken');let calls=0;
 await assert.rejects(createPiConnectionProbe({root,modelTransport:async()=>{calls++;throw Error('not allowed');}})('synthetic-key',new AbortController().signal));assert.equal(calls,0);
});

test('SDK041-FIX06 cancelling an admitted probe refuses a late success and blocks overlapping writers',async()=>{
 const {createPiConnectionProbe}=await import('../../../adapters/agent-pi/native-connection-probe.ts');const root=mkdtempSync(join(browserEvidenceRoot,'sdk041-probe-cancel-'));let release!:()=>void,entered!:()=>void,calls=0;const hold=new Promise<void>(r=>release=r),ready=new Promise<void>(r=>entered=r);
 const make=()=>createPiConnectionProbe({root,modelTransport:async()=>{calls++;entered();await hold;return {content:[{kind:'text',text:'OK'}],stop:'complete',usage:{inputTokens:2,outputTokens:1}};}});
 const c=new AbortController(),run=make()('synthetic-key',c.signal);const rejected=assert.rejects(run);await ready;
 await assert.rejects(make()('synthetic-key',new AbortController().signal));assert.equal(calls,1);c.abort();release();await rejected;
});
