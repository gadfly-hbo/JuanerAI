import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import {confirmedPlanFixture, type FixtureMethod} from '../../fixtures/xanthil-desktop/member-analysis.ts';
import {withIsolatedProject,requiredExport} from '../../fixtures/xanthil-desktop/desktop-contract-drivers.ts';

test('P1-CHAIN-01: explicit M1 plan traverses actual Application, SQLite, Run4 and unaccepted draft report',async()=>withIsolatedProject(async root=>{
 const f=await confirmedPlanFixture(root);
 const admitted=await requiredExport<FixtureMethod>(f.application,'startAnalysis')(f.command);
 assert.equal((admitted.runs as {status:string}[]).at(-1)?.status,'Running');
 let result=admitted;
 for(let n=0;n<200;n++){result=await requiredExport<FixtureMethod>(f.application,'readProjection')(f.owner);if((result.runs as {status:string}[]).at(-1)?.status!=='Running')break;await new Promise(r=>setTimeout(r,20));}
 const run=(result.runs as {run_id:string;status:string;terminal_reason:string}[]).at(-1)!;
 assert.equal(run.status,'Succeeded',JSON.stringify(result));
 const manifest=JSON.parse(readFileSync(join(root,'.xanthil/runs',run.run_id,'run.json'),'utf8'));
 assert.equal(manifest.schema_version,'4.0');assert.deepEqual(manifest.execution_plan,f.plan);
 const db=new DatabaseSync(join(root,'.xanthil/desktop/state.sqlite'),{readOnly:true});
 try{assert.equal(db.prepare('PRAGMA user_version').get()?.user_version,110);
 const finding=db.prepare('SELECT * FROM findings WHERE run_id=?').get(run.run_id)!;
 assert.equal(JSON.parse(String(finding.metrics_json)).m2.status,'not_selected');
 const report=db.prepare('SELECT * FROM report_versions WHERE finding_id=?').get(finding.finding_id)!;
 assert.equal(report.state,'draft');assert.equal(report.acceptance_id,null);assert.equal(report.closure_id,null);
 const markdown=readFileSync(join(root,String(report.markdown_locator)),'utf8');assert.match(markdown,/未接受/);assert.ok(markdown.includes(f.plan.id));
 }finally{db.close();}
}));

import {randomUUID} from 'node:crypto';
import {mkdtempSync,writeFileSync,existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {createXanthilDesktopDecisionCaseApplication} from '../../../packages/application/xanthil-desktop-decision-case.ts';
import {createLocalDesktopDecisionCaseStore,createLocalDesktopRunEvidenceStore} from '../../../adapters/storage-local/xanthil-desktop-decision-case.ts';
import {fixtureSelection,digest} from '../../fixtures/xanthil-desktop/member-analysis.ts';
import {canonicalDesktopJson} from '../../../packages/product-core/xanthil-desktop-decision-case.ts';
async function evidenceProject(work:(root:string)=>Promise<void>){const root=mkdtempSync(join(process.env.JUANERAI_TEST_EVIDENCE_DIR??tmpdir(),'connected-project-'));console.log('synthetic_project='+root);await work(root);}
async function settled(f:Awaited<ReturnType<typeof confirmedPlanFixture>>,command=f.command){let p=await requiredExport<FixtureMethod>(f.application,'startAnalysis')(command);for(let n=0;n<200;n++){p=await requiredExport<FixtureMethod>(f.application,'readProjection')(f.owner);if((p.runs as {status:string}[]).at(-1)?.status!=='Running')return p;await new Promise(r=>setTimeout(r,20));}assert.fail('real run did not settle within bounded fixture wait');}
function withDb<T>(root:string,f:(db:DatabaseSync)=>T){const db=new DatabaseSync(join(root,'.xanthil/desktop/state.sqlite'),{readOnly:true});try{return f(db);}finally{db.close();}}

test('P1-CHAIN-01: real selected methods, changed period and valid zero/unavailable persist exact independent results',async t=>{
 const zero=(s:string)=>s.split('\n').filter(x=>!/^cur-00[345]/.test(x)).join('\n');
 const unavailable=(s:string)=>s.split('\n').filter(x=>!x.startsWith('cur-')).join('\n');
 for(const variant of [
  {name:'M1+M2',methods:['M1','M2'],selection:fixtureSelection(),transform:undefined,delta:'500',m2:'applicable',rate:{numerator:'1',denominator:'2'}},
  {name:'changed-period',methods:['M1'],selection:{...fixtureSelection(),comparison_period:{start_date:'2026-01-02',end_date:'2026-01-04'},current_period:{start_date:'2026-02-02',end_date:'2026-02-04'}},transform:undefined,delta:'-2000',m2:'not_selected',rate:{numerator:'0',denominator:'1'}},
  {name:'valid-zero',methods:['M1'],selection:fixtureSelection(),transform:zero,delta:'-2000',m2:'not_selected',rate:{numerator:'0',denominator:'1'}},
  {name:'unavailable-M1',methods:['M1'],selection:fixtureSelection(),transform:unavailable,delta:'-2000',m2:'not_selected',rate:'not_applicable'},
  {name:'unavailable-M2',methods:['M1','M2'],selection:fixtureSelection(),transform:unavailable,delta:'-2000',m2:'not_applicable',rate:'not_applicable'},
 ])await t.test(variant.name,async()=>evidenceProject(async root=>{
  const f=await confirmedPlanFixture(root,variant.methods,variant.selection,variant.transform),p=await settled(f);
  const run=(p.runs as {run_id:string;status:string}[]).at(-1)!;assert.equal(run.status,'Succeeded');
  const bundle=await createLocalDesktopRunEvidenceStore({projectRoot:root}).readTerminalRun({run_id:run.run_id});
  assert.equal(bundle.manifest.schema_version,'4.0');
  const a=JSON.parse(readFileSync(join(root,bundle.locator,'outputs/duckdb.json'),'utf8')),b=JSON.parse(readFileSync(join(root,bundle.locator,'outputs/python.json'),'utf8'));
  assert.deepEqual(a.result,b.result);assert.equal(a.plan_sha256,digest(canonicalDesktopJson(f.plan)));assert.equal(b.plan_sha256,a.plan_sha256);
  assert.deepEqual(a.result.periods.current.repurchase_rate,variant.rate);assert.equal(a.result.m2.status,variant.m2);assert.equal(a.result.changes.repeat_revenue_fen.absolute_delta,variant.delta);
  for(const asset of bundle.manifest.artifacts)assert.equal(digest(readFileSync(join(root,bundle.locator,asset.path))),asset.sha256);
  const reopened=await createLocalDesktopDecisionCaseStore({projectRoot:root}).readProjection(f.owner);assert.equal(reopened.revision?.integrity_state,'ok');assert.equal(reopened.runs.at(-1)?.evidence_available,true);
  assert.equal(reopened.reports.length,1);assert.ok(reopened.reports[0].review_content?.markdown_text.includes(f.plan.id));
  withDb(root,db=>{assert.equal(db.prepare('SELECT count(*) n FROM finding_acceptances').get()?.n,0);assert.equal(db.prepare('SELECT count(*) n FROM decision_closures').get()?.n,0);});
  writeFileSync(join(root,'checkpoint.json'),JSON.stringify({plan:f.plan,projection:reopened,bundle},null,2));
 }));
});

test('P1-CHAIN-02: invalid identity/unknown schema/empty input refuse before migration or process',async t=>{
 for(const key of ['owner','snapshot','source','binding','scenario','version','parameters'])await t.test(key,async()=>evidenceProject(async root=>{
  const f=await confirmedPlanFixture(root),command=structuredClone(f.command),before=readFileSync(join(root,'.xanthil/desktop/state.sqlite'));
  if(key==='owner')command.execution_plan.owner.case_id=randomUUID();
  if(key==='snapshot')command.execution_plan.snapshot_id=randomUUID();
  if(key==='source')command.execution_plan.sources.orders.sha256='0'.repeat(64);
  if(key==='binding')command.execution_plan.binding_sha256='0'.repeat(64);
  if(key==='scenario')command.execution_plan.scenario.maintainer='tampered';
  if(key==='version')command.contract_version='9.0';
  if(key==='parameters'){command.execution_plan.parameters.current_period={start_date:'2026-03-01',end_date:'2026-03-29'};command.execution_plan.contract_sha256=digest(canonicalDesktopJson(command.execution_plan.parameters));}
  await assert.rejects(()=>requiredExport<FixtureMethod>(f.application,'startAnalysis')(command));
  assert.deepEqual(readFileSync(join(root,'.xanthil/desktop/state.sqlite')),before);assert.equal(existsSync(join(root,'.xanthil/runs')),false);
 }));
 await t.test('fully empty cannot be confirmed or activate',async()=>evidenceProject(async root=>{
  await assert.rejects(()=>confirmedPlanFixture(root,['M1'],fixtureSelection(),s=>s.split('\n')[0]+'\n'));
  withDb(root,db=>{assert.equal(db.prepare('PRAGMA user_version').get()?.user_version,100);assert.equal(db.prepare('SELECT count(*) n FROM analysis_runs').get()?.n,0);assert.equal(db.prepare('SELECT count(*) n FROM findings').get()?.n,0);});
 }));
});

test('P1-CHAIN-02: equal numeric output with a foreign plan identity never publishes a Finding/report',async()=>evidenceProject(async root=>{
 const f=await confirmedPlanFixture(root),execution=f.dependencies.analysisExecution as {describeImplementation:(x:unknown)=>Promise<unknown>;calculate:(x:unknown)=>Promise<Record<string,unknown>>;verify:(x:unknown)=>Promise<Record<string,unknown>>};
 const app=createXanthilDesktopDecisionCaseApplication({...f.dependencies,analysisExecution:{...execution,verify:async(x:unknown)=>({...await execution.verify(x),plan_sha256:'0'.repeat(64)})}});
 await app.openProject({contract_version:'1.0',command_id:randomUUID(),proposed_project_id:randomUUID(),display_name:'Synthetic reopen'});
 const p=await settled({...f,application:app});assert.equal((p.runs as {status:string}[]).at(-1)?.status,'Failed');
 withDb(root,db=>{assert.equal(db.prepare('SELECT count(*) n FROM findings').get()?.n,0);assert.equal(db.prepare('SELECT count(*) n FROM report_versions').get()?.n,0);});
}));

test('P1-COMPAT-01: explicit activation preserves existing rows/files, legacy run remains valid on schema110',async()=>evidenceProject(async root=>{
 const f=await confirmedPlanFixture(root),oldTables=['projects','product_sessions','source_snapshots','input_confirmations'];
 const original=withDb(root,db=>Object.fromEntries(oldTables.map(t=>[t,db.prepare(`SELECT * FROM ${t}`).all()])));
 assert.equal(withDb(root,db=>db.prepare('PRAGMA user_version').get()?.user_version),100);
 const before=readFileSync(join(root,f.owner.session_id,'010_draw',f.plan.snapshot_id,'orders.csv'));
 await createLocalDesktopDecisionCaseStore({projectRoot:root}).readProjection(f.owner);
 assert.equal(withDb(root,db=>db.prepare('PRAGMA user_version').get()?.user_version),100);
 const first=await settled(f);assert.equal((first.runs as {status:string}[]).at(-1)?.status,'Succeeded');
 assert.deepEqual(withDb(root,db=>Object.fromEntries(oldTables.map(t=>[t,db.prepare(`SELECT * FROM ${t}`).all()]))),original);
 assert.deepEqual(readFileSync(join(root,f.owner.session_id,'010_draw',f.plan.snapshot_id,'orders.csv')),before);
 const legacy={...f.command,contract_version:'1.0',command_id:randomUUID(),expected_row_version:(first.revision as {row_version:string}).row_version} as Record<string,unknown>;delete legacy.execution_plan;
 const result=await settled(f,legacy as typeof f.command);const run=(result.runs as {status:string;run_id:string}[]).at(-1)!;assert.equal(run.status,'Succeeded');
 const bundle=await createLocalDesktopRunEvidenceStore({projectRoot:root}).readTerminalRun({run_id:run.run_id});assert.equal(bundle.manifest.schema_version,'3.0');
 assert.equal(JSON.parse(readFileSync(join(root,bundle.locator,'outputs/duckdb.json'),'utf8')).result.m2.status,'applicable');
}));

import {withCommitResponseLostAfterRealCommit} from '../../fixtures/xanthil-desktop/desktop-contract-drivers.ts';
import {spawn} from 'node:child_process';

test('P1-COMPAT-01: actual commit response loss replays the same plan/run without duplicate execution',async()=>evidenceProject(async root=>{
 const f=await confirmedPlanFixture(root);
 await withCommitResponseLostAfterRealCommit({},async control=>{await requiredExport<FixtureMethod>(f.application,'startAnalysis')(f.command);control.assertTargetHit();});
 let p=await requiredExport<FixtureMethod>(f.application,'readProjection')(f.owner);for(let n=0;n<200&&(p.runs as {status:string}[]).at(-1)?.status==='Running';n++){await new Promise(r=>setTimeout(r,20));p=await requiredExport<FixtureMethod>(f.application,'readProjection')(f.owner);}
 const replay=await requiredExport<FixtureMethod>(f.application,'startAnalysis')(f.command);assert.equal((replay.runs as unknown[]).length,1);assert.equal((replay.runs as {status:string}[])[0].status,'Succeeded');
 withDb(root,db=>{assert.equal(db.prepare('SELECT count(*) n FROM membership_run_plans').get()?.n,1);assert.equal(db.prepare('SELECT count(*) n FROM report_versions').get()?.n,1);});
}));

test('P1-CHAIN-02: cancellation fences a real calculated late result and preserves the earlier draft',async()=>evidenceProject(async root=>{
 const f=await confirmedPlanFixture(root),first=await settled(f),before=withDb(root,db=>db.prepare('SELECT * FROM report_versions').all());
 const original=f.dependencies.analysisExecution as {describeImplementation:(x:unknown)=>Promise<unknown>;calculate:(x:unknown)=>Promise<Record<string,unknown>>;verify:(x:unknown)=>Promise<Record<string,unknown>>};
 let release!:()=>void,entered!:()=>void;const held=new Promise<void>(r=>{release=r;}),ready=new Promise<void>(r=>{entered=r;});
 const app=createXanthilDesktopDecisionCaseApplication({...f.dependencies,analysisExecution:{...original,calculate:async(x:unknown)=>{const result=await original.calculate(x);entered();await held;return result;}}});
 await app.openProject({contract_version:'1.0',command_id:randomUUID(),proposed_project_id:randomUUID(),display_name:'Synthetic reopen'});
 const p=await app.startAnalysis({...f.command,command_id:randomUUID(),expected_row_version:(first.revision as {row_version:string}).row_version});await ready;
 await app.cancelAnalysis({contract_version:'1.0',command_id:randomUUID(),...f.owner,expected_row_version:p.revision!.row_version,run_id:p.runs.at(-1)!.run_id});release();
 await new Promise(r=>setTimeout(r,30));const after=await app.readProjection(f.owner);assert.equal(after.runs.at(-1)!.status,'Cancelled');assert.deepEqual(withDb(root,db=>db.prepare('SELECT * FROM report_versions').all()),before);
}));

test('P1-CHAIN-02: Run4 reopen rejects replacement of a valid plan identity even when payload files remain intact',async()=>evidenceProject(async root=>{
 const f=await confirmedPlanFixture(root),p=await settled(f),run=(p.runs as {run_id:string}[]).at(-1)!;
 const path=join(root,'.xanthil/runs',run.run_id,'run.json'),manifest=JSON.parse(readFileSync(path,'utf8'));
 manifest.execution_plan.id=randomUUID();writeFileSync(path,canonicalDesktopJson(manifest));
 await assert.rejects(()=>createLocalDesktopRunEvidenceStore({projectRoot:root}).readTerminalRun({run_id:run.run_id}));
 assert.equal((await createLocalDesktopDecisionCaseStore({projectRoot:root}).readProjection(f.owner)).revision?.integrity_state,'integrity_blocked');
}));

test('P1-COMPAT-01: process death inside actual migration leaves a hot journal; reopen rolls back to exact legacy rows',async()=>evidenceProject(async root=>{
 const f=await confirmedPlanFixture(root),path=join(root,'.xanthil/desktop/state.sqlite'),before=readFileSync(path),input=join(root,'crash-input.json');writeFileSync(input,JSON.stringify({root,command:f.command}));
 const childPath=join(root,'migration-child.mjs');
 writeFileSync(childPath,`import {DatabaseSync} from 'node:sqlite';import {readFileSync,writeSync} from 'node:fs';\nimport {createU12ProjectAdmissionApplication} from ${JSON.stringify(new URL('../../fixtures/xanthil-desktop/desktop-contract-drivers.ts',import.meta.url).href)};\nconst x=JSON.parse(readFileSync(process.argv[2],'utf8'));const f=await createU12ProjectAdmissionApplication(x.root);await f.application.openProject({contract_version:'1.0',command_id:'11111111-1111-4111-8111-333333333333',proposed_project_id:x.command.project_id,display_name:'Synthetic'});\nconst old=DatabaseSync.prototype.exec;DatabaseSync.prototype.exec=function(sql){if(sql==='BEGIN IMMEDIATE')old.call(this,'PRAGMA cache_size=1; PRAGMA cache_spill=ON');if(sql==='COMMIT'&&this.prepare('PRAGMA user_version').get().user_version===110){writeSync(1,'MIGRATION-BEFORE-COMMIT\\n');Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0);}return old.call(this,sql);};await f.application.startAnalysis(x.command);`);
 const child=spawn(process.execPath,[childPath,input],{env:process.env,stdio:['ignore','pipe','pipe']});let output='',errors='';
 try{await new Promise<void>((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error('bounded migration crash fixture timeout: '+errors)),10000);child.stdout.on('data',x=>{output+=String(x);if(output.includes('MIGRATION-BEFORE-COMMIT')){clearTimeout(timer);resolve();}});child.stderr.on('data',x=>{errors+=String(x);});child.once('exit',code=>{clearTimeout(timer);if(!output.includes('MIGRATION-BEFORE-COMMIT'))reject(new Error('child exit '+code+': '+errors));});});
  const journal=readFileSync(path+'-journal');assert.ok(journal.length>512);assert.notDeepEqual(journal.subarray(0,8),Buffer.alloc(8));assert.notDeepEqual(readFileSync(path),before,'actual spilled pages, not merely a journal filename');
 }finally{const exited=new Promise<void>(r=>child.once('exit',()=>r()));child.kill('SIGKILL');await exited;writeFileSync(join(root,'migration-child-output.log'),output+errors);}
 const projection=await createLocalDesktopDecisionCaseStore({projectRoot:root}).readProjection(f.owner);assert.equal(projection.runs.length,0);assert.equal(projection.revision?.integrity_state,'ok');
 assert.equal(withDb(root,db=>db.prepare('PRAGMA user_version').get()?.user_version),100);assert.deepEqual(readFileSync(path),before);
 const result=await settled(f);assert.equal((result.runs as {status:string}[]).at(-1)?.status,'Succeeded');
}));

test('P1-COMPAT-01: unknown physical schema is rejected without repair',async()=>evidenceProject(async root=>{
 const f=await confirmedPlanFixture(root);const path=join(root,'.xanthil/desktop/state.sqlite'),db=new DatabaseSync(path);db.exec('PRAGMA user_version=120');db.close();const before=readFileSync(path);
 await assert.rejects(()=>createLocalDesktopDecisionCaseStore({projectRoot:root}).readProjection(f.owner),/SCHEMA_UNSUPPORTED/);assert.deepEqual(readFileSync(path),before);
}));

test('P1-CHAIN-02: a planned draft does not enter the legacy acceptance path before combined human review',async()=>evidenceProject(async root=>{
 const f=await confirmedPlanFixture(root),p=await settled(f),finding=(p.findings as {finding_id:string}[])[0];
 await assert.rejects(()=>requiredExport<FixtureMethod>(f.application,'acceptFinding')({contract_version:'1.0',command_id:randomUUID(),...f.owner,expected_row_version:(p.revision as {row_version:string}).row_version,finding_id:finding.finding_id}),/FORBIDDEN/);
 assert.equal((p.capabilities as {can_accept_finding:boolean}).can_accept_finding,false);
 withDb(root,db=>assert.equal(db.prepare('SELECT count(*) n FROM finding_acceptances').get()?.n,0));
}));
