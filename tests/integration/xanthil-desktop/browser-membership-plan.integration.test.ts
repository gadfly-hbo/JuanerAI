import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {randomUUID} from 'node:crypto';
import {preparedAnalysisClosure} from '../../../packages/product-core/member-review.ts';
import {bindQualifiedPreparation} from '../../../packages/product-core/member-preparation.ts';
import {validateMembershipPlan,plannedSelection,validatePlanStart,validateAnalysisManifest,validateAnalysisOutput,membershipHash} from '../../../packages/product-core/member-analysis.ts';
import {createDuckDbPythonDesktopLocalAnalysisExecution} from '../../../adapters/analytics-duckdb/xanthil-desktop-decision-case.ts';
import {browserCandidateFixture} from '../../fixtures/xanthil-desktop/browser-sources.ts';
import {fixturePlan} from '../../fixtures/xanthil-desktop/member-analysis.ts';
function plan2(){
 const recorded=JSON.parse(readFileSync(new URL('../../fixtures/xanthil-desktop/qualified-preparation.json',import.meta.url),'utf8'));
 assert.equal(recorded.provenance.kind,'recorded-fixed-synthetic-contract-fixture');
 const preparation=bindQualifiedPreparation(recorded.preparation),snapshot=browserCandidateFixture();
 return {...fixturePlan(snapshot),version:'2.0',intent:{version:'1.0',analysis_kind:'overall_change',question_sha256:'a'.repeat(64),user_hypothesis:null},owner:preparation.owner,preparation,authority:{task_id:preparation.task_id,grant_id:randomUUID(),epoch:preparation.epoch}};
}
test('BF-R08/09 E04-a: Plan2 preserves qualified Preparation through real M1 and independent calculation',async()=>{
 const plan=plan2(),snapshot=browserCandidateFixture();
 assert.deepEqual(validateMembershipPlan(plan,snapshot),plan);
 const contract={...plan.parameters,schema_version:'3.0',execution_plan:plan};assert.equal(plannedSelection(contract,snapshot).schema_version,'3.0');
 const start={contract_version:'3.0',command_id:randomUUID(),...plan.owner,expected_row_version:'1',confirmation_id:plan.confirmation_id,execution_plan:plan};assert.equal(validatePlanStart(start).contract_version,'3.0');
 const bin=process.env.JUANERAI_TOOLCHAIN_BIN!;
 const execution=createDuckDbPythonDesktopLocalAnalysisExecution({pythonExecutable:join(bin,'python3'),pythonVersion:'3.14.4',duckdbExecutable:join(bin,'duckdb'),duckdbVersion:'1.5.2'});
 const implementation=await execution.describeImplementation({execution_plan:plan});
 const request={run_id:'01991a00-0000-7000-8000-000000000051',expected_code_identity:implementation.code_identity,contract,snapshot,group_pseudonym_map:{North:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',South:'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'},cancellation_signal:new AbortController().signal,deadline_seconds:30};
 const calculated=await execution.calculate(request),verified=await execution.verify(request);
 for(const result of [calculated,verified]){assert.equal(result.schema_version,'3.0');assert.ok('plan_sha256' in result&&'preparation_sha256' in result);assert.equal(result.plan_sha256,membershipHash(plan));assert.equal(result.preparation_sha256,plan.preparation.sha256);assert.equal(result.result.m2.status,'not_selected');}
 const artifact=(path:string,value:{sha256:string;byte_length:string})=>({path,sha256:value.sha256,byte_length:value.byte_length});
 const started_at='2026-10-04T00:00:00.000Z',placeholder={sha256:'a'.repeat(64),byte_length:'1'};
 const manifest={schema_version:'5.0',preparation_sha256:plan.preparation.sha256,execution_plan:plan,run_id:request.run_id,analysis_kind:'membership_repurchase_decision_case',status:'in_progress',started_at,product_context:{...plan.owner,confirmation_id:plan.confirmation_id,snapshot_id:plan.snapshot_id},application:{id:'xanthil-desktop',version:'0.1.0'},profile:{id:'personal-desktop'},execution:{kind:'deterministic_local',model_usage:'none'},method:{id:implementation.method_id,version:implementation.method_version,code_identity:implementation.code_identity},tools:{duckdb_version:implementation.duckdb_version,python_version:implementation.python_version},confirmation:{contract:artifact('analysis-contract.json',placeholder),binding:artifact('binding.json',placeholder),ir:artifact('ir.json',placeholder)},sources:(['members','orders'] as const).map(role=>({role,snapshot_id:plan.snapshot_id,...artifact(`${plan.owner.session_id}/010_draw/${plan.snapshot_id}/${role}.csv`,plan.sources[role]),display_name:role+'.csv',confirmed_at:started_at})),artifacts:[{artifact_id:'primary-query',kind:'query',...artifact('assets/primary.sql',implementation.primary_sql)},{artifact_id:'independent-verifier',kind:'verifier',...artifact('assets/verify.py',implementation.python_verifier)}]};
 const checked=validateAnalysisManifest(manifest);assert.equal(checked.schema_version,'5.0');
 assert.deepEqual(validateAnalysisOutput(calculated,checked,2),calculated.result);assert.deepEqual(validateAnalysisOutput(verified,checked,3),verified.result);
 assert.throws(()=>validateAnalysisManifest({...manifest,preparation_sha256:'0'.repeat(64)}));assert.throws(()=>validateAnalysisManifest({...manifest,schema_version:'4.0'}));
 assert.throws(()=>validateAnalysisOutput({...calculated,preparation_sha256:'0'.repeat(64)},checked,2));
 assert.throws(()=>validateAnalysisOutput({...calculated,schema_version:'2.0'},checked,2));
 const closure=preparedAnalysisClosure(validateMembershipPlan(plan),calculated.result);assert.equal(closure.route,'insufficient_evidence');assert.equal(closure.disposition,'draft');assert.match(closure.insufficient_reason!,/活跃成员 2/);assert.match(closure.insufficient_reason!,/总体复购率持平/);assert.match(closure.insufficient_reason!,/用户假设：未提出/);assert.match(closure.insufficient_reason!,/因果/);assert.match(closure.insufficient_reason!,/2026-01-01/);assert.equal(closure.preferred_candidate_id,null);assert.deepEqual(closure.candidates,[]);assert.throws(()=>preparedAnalysisClosure(validateMembershipPlan(fixturePlan(snapshot)),calculated.result));
 const factsBuilder=Reflect.get(await import('../../../packages/product-core/member-analysis.ts'),'membershipFindingFacts');assert.equal(typeof factsBuilder,'function','Finding2 consumer missing');const facts=factsBuilder(calculated.result,validateMembershipPlan(plan));assert.equal(facts.version,'2.0');assert.equal(facts.verification_status,'verified');assert.equal(facts.comparison_direction,'equal');assert.deepEqual(facts.intent,plan.intent);assert.throws(()=>factsBuilder(calculated.result,validateMembershipPlan(fixturePlan(snapshot))));
 assert.deepEqual(calculated.result,verified.result);assert.equal(calculated.result.periods.current.repeat_revenue_fen,'3000');
});
test('BF-R08 E04-a: unknown versions, M2, dropped preparation and cross-version wrappers reject',()=>{
 const plan=plan2(),snapshot=browserCandidateFixture();
 for(const changed of [{...plan,version:'3.0'},{...plan,methods:['M1','M2']},{...plan,task_context:{}},{...plan,authority:{...plan.authority,epoch:String(Number(plan.authority.epoch)+1)}},{...plan,sources:{...plan.sources,members:{...plan.sources.members,sha256:'0'.repeat(64)}}},{...plan,owner:{...plan.owner,revision_id:randomUUID()}}])assert.throws(()=>validateMembershipPlan(changed,snapshot));
 const {preparation,...dropped}=plan;assert.throws(()=>validateMembershipPlan(dropped,snapshot));
 assert.throws(()=>plannedSelection({...plan.parameters,schema_version:'2.0',execution_plan:plan},snapshot));
 const legacy=fixturePlan(snapshot);assert.equal(validateMembershipPlan(legacy,snapshot).version,'1.0');
 assert.throws(()=>plannedSelection({...legacy.parameters,schema_version:'3.0',execution_plan:legacy},snapshot));
 assert.throws(()=>validatePlanStart({contract_version:'2.0',command_id:randomUUID(),...plan.owner,expected_row_version:'1',confirmation_id:plan.confirmation_id,execution_plan:plan}));
});


test('BF-R01/05 E04-d: neutral comparison distinguishes all four factual directions without claiming a hypothesis',async()=>{
 const core=await import('../../../packages/product-core/member-analysis.ts'),direction=Reflect.get(core,'membershipComparisonDirection');assert.equal(typeof direction,'function','neutral comparison consumer missing');
 const period=(active:string,repeat:string)=>({active_member_count:active,repeat_member_count:repeat,repeat_revenue_fen:'0',repurchase_rate:active==='0'?'not_applicable' as const:{numerator:repeat,denominator:active}});
 for(const [a,b,expected] of [['2','1','decrease'],['1','2','increase'],['1','1','equal']])assert.equal(direction({periods:{comparison:period('3',a),current:period('3',b)}}),expected);
 for(const [a,b] of [['0','2'],['2','0']])assert.equal(direction({periods:{comparison:period(a,a==='0'?'0':'1'),current:period(b,b==='0'?'0':'1')}}),'not_comparable');
 const plan=plan2(),intent={version:'1.0',analysis_kind:'overall_change',question_sha256:'a'.repeat(64),user_hypothesis:null};
 assert.deepEqual(validateMembershipPlan({...plan,intent}).version,'2.0');const {intent:removed,...missing}=plan;void removed;assert.throws(()=>validateMembershipPlan(missing),'new path requires an exact intent');
 for(const invalid of [{...intent,analysis_kind:'decline'},{...intent,question_sha256:'unknown'},{...intent,user_hypothesis:''},{...intent,extra:'unknown'}])assert.throws(()=>validateMembershipPlan({...plan,intent:invalid}));
 assert.throws(()=>validateMembershipPlan({...fixturePlan(browserCandidateFixture()),intent}),'legacy Plan1 must not accept new-path intent');
});


test('BF-R01/08 E04-d: prepared confirmation2 requires exact neutral intent, old context cannot silently upgrade',async()=>{
 const {preparedConfirmationContext}=await import('../../../packages/product-core/member-preparation.ts'),plan=plan2(),context={version:'2.0',preparation:plan.preparation,authority:plan.authority,intent:plan.intent};assert.deepEqual(preparedConfirmationContext(context),context);
 for(const bad of [{...context,version:'1.0'},{...context,intent:{...context.intent,analysis_kind:'decline'}},{version:'2.0',preparation:context.preparation,authority:context.authority}])assert.throws(()=>preparedConfirmationContext(bad));
});


test('BF-R01/08 E04-d: new confirmation uses overall-change discriminator and preserves legacy rejection',async()=>{
 const core=await import('../../../packages/product-core/member-preparation.ts'),parse=Reflect.get(core,'validateMemberConfirmation');assert.equal(typeof parse,'function');const plan=plan2(),command={contract_version:'2.0',command_id:randomUUID(),...plan.owner,expected_row_version:'1',inspection_token:randomUUID(),confirmation:{...plan.parameters,issue_treatments:[],analysis_kind:'overall_change',method_id:'membership_repurchase_comparison',method_version:'1.0',authority_confirmed:true,issues_confirmed:true,plan_confirmed:true}};assert.deepEqual(parse(command),command);
 for(const bad of [{...command,contract_version:'1.0'},{...command,confirmation:{...command.confirmation,hypothesis_id:'current_repurchase_rate_lower_than_comparison'}},{...command,confirmation:{...command.confirmation,analysis_kind:'decline'}}])assert.throws(()=>parse(bad));
});

test('BF-R05 E04-d: real M1 and independent verifier retain four neutral directions and undefined zero-denominator differences',async()=>{
 const {membershipFindingFacts}=await import('../../../packages/product-core/member-analysis.ts'),base=plan2(),snapshot=browserCandidateFixture(),bin=process.env.JUANERAI_TOOLCHAIN_BIN!,execution=createDuckDbPythonDesktopLocalAnalysisExecution({pythonExecutable:join(bin,'python3'),pythonVersion:'3.14.4',duckdbExecutable:join(bin,'duckdb'),duckdbVersion:'1.5.2'});
 const january={start_date:'2026-01-02',end_date:'2026-01-04'},february={start_date:'2026-02-01',end_date:'2026-02-03'};
 for(const [expected,comparison,current] of [['decrease',january,february],['increase',february,january],['equal',january,{start_date:'2026-02-02',end_date:'2026-02-04'}],['not_comparable',january,{start_date:'2026-03-01',end_date:'2026-03-03'}]] as const){
  const parameters={...base.parameters,comparison_period:comparison,current_period:current},plan=validateMembershipPlan({...base,parameters,contract_sha256:membershipHash(parameters)},snapshot),implementation=await execution.describeImplementation({execution_plan:plan}),request={run_id:'01991a00-0000-7000-8000-000000000051',expected_code_identity:implementation.code_identity,contract:{...parameters,schema_version:'3.0',execution_plan:plan},snapshot,group_pseudonym_map:{North:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',South:'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'},cancellation_signal:new AbortController().signal,deadline_seconds:30},primary=await execution.calculate(request),independent=await execution.verify(request);assert.deepEqual(primary.result,independent.result);const facts=membershipFindingFacts(primary.result,plan);assert.equal(facts.comparison_direction,expected);assert.equal(facts.verification_status,'verified');if(expected==='not_comparable'){assert.equal(primary.result.periods.current.repurchase_rate,'not_applicable');assert.deepEqual(primary.result.changes.repurchase_rate,{absolute_delta:'not_applicable',relative_change:'not_applicable'});}
 }
});

test('BF-R01 E04-d: neutral confirmation permits absent user hypothesis but still requires inspection',async()=>{
 const {blankTaskFixture}=await import('../../fixtures/xanthil-desktop/member-task-test-support.ts'),{createMembershipTaskApplication}=await import('../../../packages/application/member-task.ts'),{createLocalMembershipTaskStore}=await import('../../../adapters/storage-local/member-task.ts'),{desktopTestIds}=await import('../../fixtures/xanthil-desktop/desktop-fixtures.ts');
 const f=await blankTaskFixture(),app=createMembershipTaskApplication({desktop:f.desktop,project_id:desktopTestIds.project,store:createLocalMembershipTaskStore(f.root)}),task=await app.createBrowser('比较会员复购变化',randomUUID()),plan=plan2();
 const command={contract_version:'2.0',command_id:randomUUID(),...task.owner,expected_row_version:task.case.revision!.row_version,inspection_token:randomUUID(),source_files:{},confirmation:{...plan.parameters,issue_treatments:[],analysis_kind:'overall_change',method_id:'membership_repurchase_comparison',method_version:'1.0',authority_confirmed:true,issues_confirmed:true,plan_confirmed:true}};
 const preparation_context={version:'2.0',preparation:plan.preparation,authority:plan.authority,intent:plan.intent};
 await assert.rejects(()=>f.desktop.confirmPreparedRevision({command,preparation_context}),{code:'SOURCE_CHANGED'});
 const {analysis_kind,...legacy}=command.confirmation;void analysis_kind;
 await assert.rejects(()=>f.desktop.confirmRevision({...command,contract_version:'1.0',confirmation:{...legacy,hypothesis_id:'current_repurchase_rate_lower_than_comparison'}}),{code:'VALIDATION_FAILED'});
});

test('BF-R07 E05-k: native analysis outcome distinguishes observed close, not-started and copied errors',async()=>{
 const processModule=await import('../../../adapters/analytics-duckdb/process.ts'),run=Reflect.get(processModule,'runObservedAnalysisProcess'),describe=Reflect.get(processModule,'describeAnalysisProcessFailure');assert.equal(typeof run,'function');assert.equal(typeof describe,'function');
 const done=await run(process.execPath,['-e','process.stdout.write("synthetic")'],new AbortController().signal,2);assert.equal(done.output,'synthetic');assert.equal(done.physical_status,'settled');assert.ok(Number.isSafeInteger(done.active_ms)&&done.active_ms>=0);
 let failure:unknown;try{await run(process.execPath,['-e','process.exit(13)'],new AbortController().signal,2);}catch(error){failure=error;}assert.equal(describe(failure)?.physical_status,'settled');assert.equal(describe({...failure as object}),null);
 const abort=new AbortController();abort.abort();try{await run(process.execPath,['-e','throw new Error("must not start")'],abort.signal,2);}catch(error){failure=error;}assert.equal(describe(failure)?.physical_status,'not_started');assert.equal(describe(failure)?.active_ms,0);
 try{await run('/nonexistent-xanthil-synthetic-node',[],new AbortController().signal,2);}catch(error){failure=error;}assert.equal(describe(failure)?.physical_status,'not_started');
});

test('BF-R07 E05-k: metered M1 adapter binds actual process settlement to run plan and stage',async()=>{
 const adapter=await import('../../../adapters/analytics-duckdb/xanthil-desktop-decision-case.ts'),make=Reflect.get(adapter,'createMeteredMembershipAnalysisExecution');assert.equal(typeof make,'function');const bin=process.env.JUANERAI_TOOLCHAIN_BIN!,runtime=make({pythonExecutable:join(bin,'python3'),pythonVersion:'3.14.4',duckdbExecutable:join(bin,'duckdb'),duckdbVersion:'1.5.2'}),plan=plan2(),snapshot=browserCandidateFixture(),description=await runtime.describeImplementation({execution_plan:plan});
 const input={run_id:'01991a00-0000-7000-8000-000000000059',expected_code_identity:description.code_identity,contract:plannedSelection({...plan.parameters,schema_version:'3.0',execution_plan:plan},snapshot),snapshot,group_pseudonym_map:{North:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',South:'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'},cancellation_signal:new AbortController().signal,deadline_seconds:30};
 for(const stage of ['calculate','verify'] as const){const result=await runtime[stage](input),proof=runtime.describeMembershipOutcome(result);assert.ok(proof);assert.equal(proof.run_id,input.run_id);assert.equal(proof.plan_sha256,membershipHash(plan));assert.equal(proof.stage,stage);assert.equal(proof.physical_status,'settled');assert.equal(proof.result_sha256,membershipHash(result));assert.ok(Number.isSafeInteger(proof.active_ms)&&proof.active_ms>=0);assert.equal(runtime.describeMembershipOutcome(structuredClone(result)),null);}
 const abort=new AbortController();abort.abort();let error:unknown;try{await runtime.calculate({...input,cancellation_signal:abort.signal});}catch(e){error=e;}assert.equal(runtime.describeMembershipOutcome(error)?.physical_status,'not_started');assert.equal(runtime.describeMembershipOutcome(error)?.run_id,input.run_id);assert.equal(runtime.describeMembershipOutcome({...error as object}),null);
});


test('BF-R01/04 E05-l: model semantics compile only attributed complete neutral analysis inputs',async()=>{
 const compile=Reflect.get(await import('../../../packages/application/member-model.ts'),'compilePreparedMembershipSemantics');assert.equal(typeof compile,'function','production prepared-analysis consumer missing');
 const selected_text='比较2026-01-01至2026-01-29与2026-02-01至2026-03-01；paid表示已支付。';
 const payload={version:'2.0' as const,stage:'generate_preparation' as const,source_set_sha256:'a'.repeat(64),selected_text,structure:[],semantics:null,result:null,diagnostic:null},analysis={currency:'CNY',time_zone:'Asia/Shanghai',comparison_period:{start_date:'2026-01-01',end_date:'2026-01-29'},current_period:{start_date:'2026-02-01',end_date:'2026-03-01'},period_evidence:'2026-01-01至2026-01-29与2026-02-01至2026-03-01',statuses:[{value:'paid',meaning:'已支付',evidence:'paid表示已支付'}]},execution_id=randomUUID();
 assert.equal(compile(undefined,payload,execution_id),null,'missing meaning cannot acquire fixture defaults');
 const actual=compile(analysis,payload,execution_id);assert.ok(actual);assert.deepEqual(actual.selection.comparison_period,analysis.comparison_period);assert.deepEqual(actual.selection.valid_statuses,['paid']);assert.equal(actual.scenario.status_meanings.paid,'已支付');assert.equal(actual.scenario.id,execution_id);assert.match(actual.scenario.maintainer,/system/);assert.equal(actual.selection.column_mapping.order_member_id_column,'order_member_id');assert.equal(actual.selection.selected_group_mode,'none');
 for(const changed of [{...analysis,statuses:[]},{...analysis,current_period:{start_date:'2026-02-30',end_date:'2026-03-30'}},{...analysis,statuses:[{value:'paid',meaning:'已退款',evidence:'paid表示已支付'}]}])assert.throws(()=>compile(changed,payload,execution_id));
 assert.throws(()=>compile(analysis,{...payload,selected_text:null},execution_id));
});

test('BF-R01/06 E05-q: clarification intent has an explicit version and cannot enter legacy intent',async()=>{
 const {membershipAnalysisIntent}=await import('../../../packages/product-core/member-analysis.ts'),base={version:'1.0',analysis_kind:'overall_change',question_sha256:'a'.repeat(64),user_hypothesis:null},next={...base,version:'2.0',clarification_sha256:'b'.repeat(64)};
 assert.deepEqual(membershipAnalysisIntent(next),next);assert.deepEqual(membershipAnalysisIntent(base),base);for(const bad of [{...next,version:'1.0'},{...base,version:'2.0'},{...next,clarification_sha256:'bad'},{...next,version:'3.0'}])assert.throws(()=>membershipAnalysisIntent(bad));
});

test('BF-R07/08 P1: renewed Plan2 carries an exact historical preparation reference without weakening absent-field epoch rules',async()=>{
 const {preparedConfirmationContext}=await import('../../../packages/product-core/member-preparation.ts'),plan=plan2(),authority={...plan.authority,epoch:String(Number(plan.authority.epoch)+1),resume_preparation_sha256:plan.preparation.sha256},resumed={...plan,authority};
 assert.deepEqual(validateMembershipPlan(resumed),resumed);
 const context={version:'2.0',preparation:plan.preparation,intent:plan.intent,authority};assert.deepEqual(preparedConfirmationContext(context),context);
 for(const a of [{...authority,resume_preparation_sha256:'0'.repeat(64)},{task_id:authority.task_id,grant_id:authority.grant_id,epoch:authority.epoch},{...authority,unknown:true}]){assert.throws(()=>validateMembershipPlan({...plan,authority:a}));assert.throws(()=>preparedConfirmationContext({...context,authority:a}));}
 assert.deepEqual(validateMembershipPlan(plan),plan);
});
