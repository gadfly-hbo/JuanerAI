import assert from 'node:assert/strict';
import test from 'node:test';
import {randomUUID} from 'node:crypto';
import {mkdtempSync,readFileSync} from 'node:fs';
import {join} from 'node:path';
import * as storage from '../../../adapters/storage-local/member-operation.ts';
import {browserEvidenceRoot} from '../../fixtures/xanthil-desktop/browser-evidence.ts';
import type {OperationUsage} from '../../../packages/product-core/member-operation.ts';
import type {AnalysisRequestIdentity} from '../../../packages/ports/analysis-request-ledger.ts';

const unknown:OperationUsage={input_tokens:{kind:'unknown',reason:'provider_not_reported'},output_tokens:{kind:'unknown',reason:'provider_not_reported'},active_ms:{kind:'known',value:'7'},wait_ms:{kind:'known',value:'0'}};
function fixture(){const factory=Reflect.get(storage,'createLocalAnalysisRequestLedger');assert.equal(typeof factory,'function','OA-RT05/06: durable open-agent request ledger must exist');const root=mkdtempSync(join(browserEvidenceRoot,'open-ledger-'));const identity:AnalysisRequestIdentity={task_id:randomUUID(),revision:'1',run_id:randomUUID(),attempt_id:randomUUID(),operation_id:randomUUID(),grant_id:randomUUID(),scope_sha256:'a'.repeat(64),config_sha256:'b'.repeat(64),input_sha256:'c'.repeat(64),provider:'minimax-cn',model:'MiniMax-M3'};return {root,factory,ledger:factory({projectRoot:root}),identity};}
test('OA-RT05/06: missing readback creates no database; identity records one actual issued request',()=>{
 const f=fixture();assert.deepEqual(f.ledger.read(f.identity.task_id),[]);const r=f.ledger.reserve(f.identity);assert.equal(r.status,'reserved');assert.equal(r.calls,0);const issued=f.ledger.issue(r.request_id);assert.equal(issued.calls,1);assert.equal(issued.usage.input_tokens.kind,'unknown');
 const settled=f.ledger.settle(r.request_id,{status:'succeeded',usage:unknown});assert.equal(settled.status,'succeeded');assert.equal(settled.usage.output_tokens.kind,'unknown');assert.equal(settled.publishable,true);
 const reopened=f.factory({projectRoot:f.root});assert.deepEqual(reopened.read(f.identity.task_id),[settled]);assert.throws(()=>reopened.reserve({...f.identity,run_id:randomUUID(),attempt_id:randomUUID()}),{code:'OPERATION_COMPLETE'});
 assert.equal(readFileSync(join(f.root,'.xanthil/desktop/analysis-requests.sqlite')).includes(Buffer.from('api_key')),false);
});
test('OA-RT05: backup shares one extra request across Run/Attempt/reopen; third rejected',()=>{
 const f=fixture(),first=f.ledger.reserve(f.identity);f.ledger.issue(first.request_id);f.ledger.settle(first.request_id,{status:'temporary_failure',usage:unknown});
 const reopened=f.factory({projectRoot:f.root}),second=reopened.reserve({...f.identity,run_id:randomUUID(),attempt_id:randomUUID(),provider:'xiaomi-token-plan-cn',model:'mimo-v2.6-flash'});assert.equal(second.sequence,2);reopened.issue(second.request_id);reopened.settle(second.request_id,{status:'temporary_failure',usage:unknown});
 assert.throws(()=>f.factory({projectRoot:f.root}).reserve({...f.identity,attempt_id:randomUUID()}),{code:'RETRY_EXHAUSTED'});assert.equal(reopened.read(f.identity.task_id).reduce((a:number,r:{calls:number})=>a+r.calls,0),2);
});
test('OA-RT04/05: issued/UNKNOWN stays occupied after restart and cannot blind retry',()=>{
 const f=fixture(),r=f.ledger.reserve(f.identity);f.ledger.issue(r.request_id);const reopened=f.factory({projectRoot:f.root});assert.equal(reopened.read(f.identity.task_id)[0].status,'issued');
 assert.throws(()=>reopened.reserve({...f.identity,operation_id:randomUUID()}),{code:'PHYSICAL_PENDING'});reopened.settle(r.request_id,{status:'unknown',usage:unknown});
 assert.throws(()=>reopened.reserve({...f.identity,attempt_id:randomUUID()}),{code:'PHYSICAL_PENDING'});
});
test('OA-RT04/06: stop fences late publication while keeping actual usage; resume explicit',()=>{
 const f=fixture(),r=f.ledger.reserve(f.identity);f.ledger.issue(r.request_id);f.ledger.stop(f.identity.task_id);const late=f.ledger.settle(r.request_id,{status:'succeeded',usage:unknown});assert.equal(late.publishable,false);assert.equal(late.status,'cancelled');assert.equal(late.calls,1);
 const reopened=f.factory({projectRoot:f.root});assert.throws(()=>reopened.reserve({...f.identity,operation_id:randomUUID()}),{code:'STOPPED'});reopened.resume(f.identity.task_id);const next=reopened.reserve({...f.identity,operation_id:randomUUID()});assert.equal(next.sequence,1);assert.deepEqual(reopened.read(f.identity.task_id)[0].usage.active_ms,{kind:'known',value:'7'});
});
test('OA-RT05: changing input/scope/config under an existing logical operation is a conflict',()=>{
 const f=fixture(),r=f.ledger.reserve(f.identity);f.ledger.issue(r.request_id);f.ledger.settle(r.request_id,{status:'temporary_failure',usage:unknown});
 for(const key of ['input_sha256','scope_sha256','config_sha256'])assert.throws(()=>f.ledger.reserve({...f.identity,[key]:'d'.repeat(64)}),{code:'OPERATION_CONFLICT'});
 assert.throws(()=>Reflect.apply(f.ledger.reserve,f.ledger,[{...f.identity,provider:'other'}]),{code:'AUTHORITY_REQUIRED'});
});
test('OA-RT06: sanitized failure reason survives reopen; raw provider text cannot enter the ledger',()=>{
 const f=fixture(),r=f.ledger.reserve(f.identity);f.ledger.issue(r.request_id);f.ledger.settle(r.request_id,{status:'temporary_failure',reason:'NETWORK_UNAVAILABLE',usage:unknown});
 const reopened=f.factory({projectRoot:f.root});assert.equal(reopened.read(f.identity.task_id)[0].reason,'NETWORK_UNAVAILABLE');
 const next=reopened.reserve({...f.identity,provider:'xiaomi-token-plan-cn',model:'mimo-v2.6-flash'});reopened.issue(next.request_id);assert.throws(()=>Reflect.apply(reopened.settle,reopened,[next.request_id,{status:'failed',reason:'raw secret provider response',usage:unknown}]),{code:'AUTHORITY_REQUIRED'});assert.equal(reopened.read(f.identity.task_id)[1].status,'issued');
});

test('OA-RT04/05: explicit resume rejects unsettled physical work, then permits only one remaining request for the interrupted operation',()=>{
 const f=fixture(),r=f.ledger.reserve(f.identity);f.ledger.issue(r.request_id);f.ledger.stop(f.identity.task_id);assert.throws(()=>f.ledger.resume(f.identity.task_id),{code:'PHYSICAL_PENDING'});
 f.ledger.settle(r.request_id,{status:'cancelled',usage:unknown});assert.throws(()=>f.ledger.reserve(f.identity),{code:'STOPPED'});f.ledger.resume(f.identity.task_id);const second=f.ledger.reserve(f.identity);assert.equal(second.sequence,2);f.ledger.issue(second.request_id);f.ledger.stop(f.identity.task_id);f.ledger.settle(second.request_id,{status:'cancelled',usage:unknown});f.ledger.resume(f.identity.task_id);assert.throws(()=>f.ledger.reserve(f.identity),{code:'RETRY_EXHAUSTED'});
});


test('OA-S06/RT04: project physical ownership persists across different task IDs and reopened ledgers',()=>{
 const f=fixture(),r=f.ledger.reserve(f.identity);f.ledger.issue(r.request_id);const next={...f.identity,task_id:randomUUID(),operation_id:randomUUID()};assert.throws(()=>f.factory({projectRoot:f.root}).reserve(next),{code:'PHYSICAL_PENDING'});
 f.ledger.stop(f.identity.task_id);f.ledger.settle(r.request_id,{status:'unknown',usage:unknown});assert.throws(()=>f.factory({projectRoot:f.root}).reserve(next),{code:'PHYSICAL_PENDING'});f.ledger.settle(r.request_id,{status:'cancelled',usage:unknown});assert.equal(f.ledger.reserve(next).status,'reserved');
});
