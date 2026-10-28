import test from 'node:test';import assert from 'node:assert/strict';import {mkdtempSync,writeFileSync,readFileSync,mkdirSync} from 'node:fs';import {join} from 'node:path';
import {createPiCredentialProbe} from '../../../adapters/agent-pi/credential-probe.ts';
import {createPiBusinessPersistence} from '../../../adapters/agent-pi/persistent-runtime-state.ts';
import {offlineResponse} from '../../fixtures/xanthil-desktop/offline-professional-provider.ts';
const root=()=>mkdtempSync(join(process.env.JUANERAI_NEWARCH_SHORT_ROOT!,'probe-'));
test('SDK041 current explicit settings probe uses the same public executor, fixed instruction and persistent physical accounting',async()=>{
 const path=root();let calls=0;const probe=()=>createPiCredentialProbe({projectRoot:path,fetch:async(_url,init)=>{calls++;const dto=JSON.parse(String(init!.body));assert.equal(dto.model,'mimo-v2.6-flash');assert.equal(dto.max_tokens??dto.max_completion_tokens,32768);assert.match(JSON.stringify(dto.messages),/explicitly requested connection test/);assert.doesNotMatch(JSON.stringify(dto.messages),/synthetic-only-key/);return offlineResponse(calls);}});await probe()('synthetic-only-key',new AbortController().signal);await probe()('synthetic-only-key',new AbortController().signal);assert.equal(calls,2);await assert.rejects(()=>probe()('synthetic-only-key',AbortSignal.abort()));assert.equal(calls,2);
 for(const file of ['apps/browser/service-main.ts','apps/desktop/browser-native.ts','apps/desktop/main.ts'])assert.equal(readFileSync(file,'utf8').includes('probe:probeLocalXiaomi'),false);
});
for(const status of [401,429,503])test('SDK041 current explicit probe HTTP '+status+' sends once, never adds a fault extra',async()=>{
 let calls=0;const path=root(),probe=createPiCredentialProbe({projectRoot:path,fetch:async()=>{calls++;return new Response('{"error":{"message":"synthetic failure"}}',{status,headers:{'content-type':'application/json'}});}});await assert.rejects(()=>probe('synthetic-only-key',new AbortController().signal),{code:status===401?'CREDENTIAL_INVALID':'CONNECTION_FAILED'});assert.equal(calls,1);
});
test('SDK041 current probe corrupt persistent state fails before any physical send',async()=>{
 const path=root();createPiBusinessPersistence({projectRoot:path,isAuthorized:()=>false}).readAudit('not-created');mkdirSync(join(path,'.juanerai/pi-v060'),{recursive:true});writeFileSync(join(path,'.juanerai/pi-v060/state.sqlite'),'broken');let calls=0;const probe=createPiCredentialProbe({projectRoot:path,fetch:async()=>{calls++;return offlineResponse(calls);}});await assert.rejects(()=>probe('synthetic-only-key',new AbortController().signal));assert.equal(calls,0);
});
test('SDK041 current admitted probe cancellation rejects late success and keeps its accounting evidence',async()=>{
 const path=root();let entered!:()=>void,release!:()=>void,calls=0;const ready=new Promise<void>(r=>entered=r),gate=new Promise<void>(r=>release=r),controller=new AbortController(),probe=createPiCredentialProbe({projectRoot:path,fetch:async()=>{calls++;entered();await gate;return offlineResponse(calls);}});const running=probe('synthetic-only-key',controller.signal),rejected=assert.rejects(running);await ready;controller.abort();release();await rejected;assert.equal(calls,1);
});
