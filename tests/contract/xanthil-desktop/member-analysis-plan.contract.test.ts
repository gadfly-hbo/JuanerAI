import assert from 'node:assert/strict';
import test from 'node:test';
import {plannedFixture} from '../../fixtures/xanthil-desktop/member-analysis.ts';
import {digest,fixturePlan} from '../../fixtures/xanthil-desktop/member-analysis.ts';
import {canonicalDesktopJson} from '../../../packages/product-core/xanthil-desktop-decision-case.ts';
import {existsSync,readFileSync} from 'node:fs';
import {join} from 'node:path';

test('P1-PLAN-01 M1-only with mapped groups executes no M2 in either real engine [SC-02 CAP-02]',async()=>{
 const f=await plannedFixture();
 const primary=await f.execution.calculate(f.request),independent=await f.execution.verify(f.request);
 assert.doesNotMatch(f.sql(),/SELECT\s+'group'|GROUP BY period,group_id/i,'actual DuckDB input must omit the group operation');
 assert.doesNotMatch(f.pythonLines(),/gid=request|groups\.setdefault|g\[name\]=|values=\[.*groups\.items/,'actual Python execution must not accumulate or materialize M2');
 assert.ok(f.sql().endsWith(new TextDecoder().decode(f.description.primary_sql.bytes)),'stored selected SQL is the actual executed query suffix');
 assert.equal(digest(readFileSync(join(f.root,'verify.py'))),f.description.python_verifier.sha256,'stored verifier is the actual executed Python code');
 assert.deepEqual(primary.result,independent.result);
 assert.deepEqual(primary.result.m2,{status:'not_selected'});
 assert.equal(primary.result.changes.repeat_revenue_fen.absolute_delta,'500');
});

test('P1-PLAN-02 M1+M2 consumes mapped groups with independently exact contributions [SC-02 CAP-02]',async()=>{
 const f=await plannedFixture(['M1','M2']);const a=await f.execution.calculate(f.request),b=await f.execution.verify(f.request);
 assert.deepEqual(a.result,b.result);assert.match(f.sql(),/SELECT 'group'/);assert.match(f.pythonLines(),/groups\.setdefault/);
 assert.deepEqual(a.result.m2,{status:'applicable',groups:[{group_id:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',comparison_repeat_revenue_fen:'2000',current_repeat_revenue_fen:'0',absolute_delta:'-2000'},{group_id:'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',comparison_repeat_revenue_fen:'0',current_repeat_revenue_fen:'2500',absolute_delta:'2500'}]});
});

test('P1-PLAN-03 changed legal periods control both real engines [SC-04 CAP-03]',async()=>{
 const f=await plannedFixture();const selection={...f.plan.parameters,comparison_period:{start_date:'2026-01-02',end_date:'2026-01-04'},current_period:{start_date:'2026-02-02',end_date:'2026-02-04'}};
 const plan={...f.plan,parameters:selection,contract_sha256:digest(canonicalDesktopJson(selection))};
 const request={...f.request,contract:{...selection,schema_version:'2.0',execution_plan:plan}};
 const a=await f.execution.calculate(request),b=await f.execution.verify(request);assert.deepEqual(a.result,b.result);
 assert.equal(a.result.changes.repeat_revenue_fen.absolute_delta,'-2000');assert.doesNotMatch(f.sql(),/cur-003|cmp-003/);
});

test('P1-PLAN-04 invalid identities and unsupported plans refuse before either subprocess [CAP-02 CAP-03]',async t=>{
 for(const [name,mutate] of Object.entries({version:(p:any)=>{p.version='9.0';},unmapped_m2:(p:any)=>{p.methods=['M1','M2'];p.parameters.selected_group_mode='none';p.parameters.column_mapping.member_group_column=null;p.contract_sha256=digest(canonicalDesktopJson(p.parameters));p.binding_sha256=digest(canonicalDesktopJson(p.parameters.column_mapping));},source:(p:any)=>{p.sources.members.sha256='0'.repeat(64);},binding:(p:any)=>{p.binding_sha256='0'.repeat(64);},contract:(p:any)=>{p.contract_sha256='0'.repeat(64);},scenario:(p:any)=>{p.scenario_sha256='0'.repeat(64);},verification:(p:any)=>{p.verification='none';},extra:(p:any)=>{p.extra=true;},method:(p:any)=>{p.methods=['M1','CAUSE'];},order:(p:any)=>{p.methods=['M2','M1'];},parameters:(p:any)=>{p.parameters.valid_statuses=['void'];},owner:(p:any)=>{p.owner.case_id='invalid';}}))await t.test(name,async()=>{
  const f=await plannedFixture();const plan=structuredClone(f.plan);mutate(plan);
  const request={...f.request,contract:{...f.request.contract,...(name==='unmapped_m2'?plan.parameters:{}),execution_plan:plan}};
  await assert.rejects(()=>f.execution.calculate(request));await assert.rejects(()=>f.execution.verify(request));
  assert.equal(existsSync(join(f.root,'primary.sql')),false);assert.equal(existsSync(join(f.root,'verify.py')),false);
 });
});

test('P1-PLAN-05 unavailable denominator is not a zero rate; M2 is insufficient; all-empty blocks [SC-05]',async t=>{
 for(const methods of [['M1'],['M1','M2']])await t.test(methods.join('+'),async()=>{
  const f=await plannedFixture(methods);const snapshot={...f.snapshot,orders_bytes:new TextEncoder().encode(new TextDecoder().decode(f.snapshot.orders_bytes).split('\n').filter(x=>!x.startsWith('cur-')).join('\n'))};
  const plan=fixturePlan(snapshot,methods);const request={...f.request,snapshot,contract:{...plan.parameters,schema_version:'2.0',execution_plan:plan}};
  const a=await f.execution.calculate(request),b=await f.execution.verify(request);assert.deepEqual(a.result,b.result);
  assert.equal(a.result.periods.current.repurchase_rate,'not_applicable');assert.deepEqual(a.result.changes.repurchase_rate,{absolute_delta:'not_applicable',relative_change:'not_applicable'});
  assert.deepEqual(a.result.m2,{status:methods.length===1?'not_selected':'not_applicable'});
 });
 await t.test('all empty',async()=>{
  const f=await plannedFixture();const snapshot={...f.snapshot,orders_bytes:new TextEncoder().encode(new TextDecoder().decode(f.snapshot.orders_bytes).split('\n')[0]+'\n')};
  const plan=fixturePlan(snapshot);const request={...f.request,snapshot,contract:{...plan.parameters,schema_version:'2.0',execution_plan:plan}};
  await assert.rejects(()=>f.execution.calculate(request));await assert.rejects(()=>f.execution.verify(request));
  assert.equal(existsSync(join(f.root,'primary.sql')),false);assert.equal(existsSync(join(f.root,'verify.py')),false);
 });
});
