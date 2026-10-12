import assert from 'node:assert/strict';
import test from 'node:test';
import {mkdtempSync,readFileSync,writeFileSync,symlinkSync,unlinkSync} from 'node:fs';
import {join} from 'node:path';
import * as settings from '../../../packages/application/provider-settings.ts';
import {browserEvidenceRoot} from '../../fixtures/xanthil-desktop/browser-evidence.ts';
test('BF-R02/03 E05-e: exact non-secret policy persists without credentials or read effects',async()=>{
 const factory=Reflect.get(settings,'createMembershipPolicyAccess');assert.equal(typeof factory,'function','E05-e local policy consumer is missing');
 const {createLocalMembershipPolicyStore}=await import('../../../adapters/storage-local/member-model-policy.ts');const root=mkdtempSync(join(browserEvidenceRoot,'model-policy-')),store=createLocalMembershipPolicyStore(root),access=factory(store,settings.createLocalModelAccess(false));
 await assert.rejects(()=>access.read(),{code:'MODEL_POLICY_REQUIRED'});const created=await store.initializeApproved(),file=join(root,'membership-model-policy.json'),before=readFileSync(file);const read=await access.read();assert.equal(read.available,false);assert.equal(read.policy.provider,'xiaomi-token-plan-cn');assert.equal(read.policy.model,'mimo-v2.6-pro');assert.deepEqual(read.policy.consumption_policy,{mode:'uncapped_metered'});assert.equal(read.policy.model_retries,1);assert.equal(read.policy.preparation_corrections,1);assert.deepEqual(read.policy,created);assert.deepEqual(readFileSync(file),before);assert.equal(before.includes(Buffer.from('api_key')),false);
 await store.initializeApproved();assert.deepEqual(readFileSync(file),before);writeFileSync(file,JSON.stringify({...created,model_retries:9}));await assert.rejects(()=>access.read(),{code:'MODEL_POLICY_INVALID'});await assert.rejects(()=>store.initializeApproved(),{code:'MODEL_POLICY_INVALID'});assert.notDeepEqual(readFileSync(file),before,'invalid settings cannot be silently replaced');
 unlinkSync(file);const target=join(root,'other.json');writeFileSync(target,before);symlinkSync(target,file);await assert.rejects(()=>access.read(),{code:'MODEL_POLICY_INVALID'});assert.deepEqual(readFileSync(target),before);
});
