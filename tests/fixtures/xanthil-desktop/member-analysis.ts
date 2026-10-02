import {createHash, randomUUID} from 'node:crypto';
import {chmodSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createDuckDbPythonDesktopLocalAnalysisExecution} from '../../../adapters/analytics-duckdb/xanthil-desktop-decision-case.ts';
import {canonicalDesktopJson} from '../../../packages/product-core/xanthil-desktop-decision-case.ts';
import {readDesktopPythonTool, readSyntheticCsvPair} from './desktop-fixtures.ts';

export const digest=(x:string|Uint8Array)=>createHash('sha256').update(x).digest('hex');
export const fixtureSelection=()=>({column_mapping:{member_id_column:'member_id',member_group_column:'member_group',order_id_column:'order_id',order_member_id_column:'order_member_id',paid_at_column:'paid_at',amount_column:'amount',status_column:'status',currency_column:'currency'},comparison_period:{start_date:'2026-01-01',end_date:'2026-01-29'},current_period:{start_date:'2026-02-01',end_date:'2026-03-01'},currency:'CNY' as const,time_zone:'Asia/Shanghai' as const,valid_statuses:['paid'],selected_group_mode:'mapped' as const});
export function fixtureScenario(){return {version:'1.0',id:randomUUID(),revision:'1',maintainer:'Synthetic fixture maintainer',metric:'membership_repurchase_comparison',currency:'CNY',time_zone:'Asia/Shanghai',status_meanings:{paid:'Synthetic settled order'},quality_policy:'desktop_six_treatments_v1',verification:'python_independent_exact'};}
export function fixturePlan(snapshot:{members_bytes:Uint8Array;orders_bytes:Uint8Array},methods:readonly string[]=['M1'],selection=fixtureSelection()){
 const scenario=fixtureScenario();
 return {version:'1.0',id:randomUUID(),owner:{project_id:randomUUID(),session_id:randomUUID(),case_id:randomUUID(),revision_id:randomUUID()},confirmation_id:randomUUID(),snapshot_id:randomUUID(),scenario,scenario_sha256:digest(canonicalDesktopJson(scenario)),contract_sha256:digest(canonicalDesktopJson(selection)),binding_sha256:digest(canonicalDesktopJson(selection.column_mapping)),sources:{members:{sha256:digest(snapshot.members_bytes),byte_length:String(snapshot.members_bytes.length)},orders:{sha256:digest(snapshot.orders_bytes),byte_length:String(snapshot.orders_bytes.length)}},methods,parameters:selection,verification:'python_independent_exact'};
}

/** Synthetic-only boundary observers: delegate to the real installed algorithms. */
export async function observedExecution(){
 const bin=process.env.JUANERAI_TOOLCHAIN_BIN;if(!bin)throw new Error('toolchain prerequisite');
 const python=readDesktopPythonTool(bin),base=process.env.JUANERAI_TEST_EVIDENCE_DIR??tmpdir();mkdirSync(base,{recursive:true});
 const root=mkdtempSync(join(base,'plan-process-'));
 const duck=join(root,'duckdb-observer'),py=join(root,'python-observer');
 writeFileSync(duck,`#!${python.pythonExecutable}\nimport sys,subprocess,pathlib\ndata=sys.stdin.read()\npathlib.Path(${JSON.stringify(join(root,'primary.sql'))}).write_text(data)\np=subprocess.run([${JSON.stringify(join(bin,'duckdb'))}]+sys.argv[1:],input=data,text=True,stdout=subprocess.PIPE)\nsys.stdout.write(p.stdout)\nsys.exit(p.returncode)\n`);
 writeFileSync(py,`#!${python.pythonExecutable}\nimport sys,pathlib,linecache\ncode=sys.argv[sys.argv.index('-c')+1]\npathlib.Path(${JSON.stringify(join(root,'verify.py'))}).write_text(code)\nlines=code.splitlines(); visited=[]\ndef trace(frame,event,arg):\n    if event=='line' and frame.f_code.co_filename=='<member-verifier>': visited.append(frame.f_lineno)\n    return trace\nsys.settrace(trace)\ntry: exec(compile(code,'<member-verifier>','exec'),{'__name__':'__main__'})\nfinally:\n    sys.settrace(None)\n    pathlib.Path(${JSON.stringify(join(root,'python-lines.txt'))}).write_text('\\n'.join(str(n)+':'+lines[n-1] for n in sorted(set(visited))))\n`);
 chmodSync(duck,0o700);chmodSync(py,0o700);
 const execution=createDuckDbPythonDesktopLocalAnalysisExecution({duckdbExecutable:duck,duckdbVersion:'1.5.2',pythonExecutable:py,pythonVersion:python.pythonVersion});
 const description=await execution.describeImplementation({});const pair=await readSyntheticCsvPair();const snapshot={members_bytes:pair.members,orders_bytes:pair.orders};
 return {root,execution,description,snapshot,sql:()=>readFileSync(join(root,'primary.sql'),'utf8'),pythonLines:()=>readFileSync(join(root,'python-lines.txt'),'utf8')};
}
export async function plannedFixture(methods:readonly string[]=['M1']){
 const setup=await observedExecution(),plan=fixturePlan(setup.snapshot,methods);
 const description=await setup.execution.describeImplementation({execution_plan:plan});
 const request={run_id:'01991a00-0000-7000-8000-000000000001',expected_code_identity:description.code_identity,contract:{...plan.parameters,schema_version:'2.0',execution_plan:plan},snapshot:setup.snapshot,group_pseudonym_map:{North:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',South:'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'},cancellation_signal:new AbortController().signal,deadline_seconds:30};
 return {...setup,description,plan,request};
}

import {createU12ProjectAdmissionApplication, requiredExport, requiredRecord} from './desktop-contract-drivers.ts';
import {createSessionCommand, desktopTestIds} from './desktop-fixtures.ts';
export type FixtureMethod=(x:Record<string,unknown>)=>Promise<Record<string,unknown>>;
export async function confirmedPlanFixture(projectRoot:string,methods:readonly string[]=['M1'],selection=fixtureSelection(),ordersTransform?:(s:string)=>string){
 const setup=await createU12ProjectAdmissionApplication(projectRoot),app=setup.application;
 await requiredExport<FixtureMethod>(app,'openProject')({contract_version:'1.0',command_id:desktopTestIds.openProjectCommand,proposed_project_id:desktopTestIds.project,display_name:'Synthetic Plan Project'});
 const created=await requiredExport<FixtureMethod>(app,'createSession')(createSessionCommand());
 const session=requiredRecord(created.session,'session'),revision=requiredRecord(created.revision,'revision');
 const owner={project_id:desktopTestIds.project,session_id:String(session.session_id),case_id:String(session.case_id),revision_id:String(revision.revision_id)};
 const sourcePair=await readSyntheticCsvPair();const pair={...sourcePair};if(ordersTransform)pair.orders=new TextEncoder().encode(ordersTransform(new TextDecoder().decode(pair.orders)));
 const source_files={members:{display_name:'members.csv',bytes:pair.members},orders:{display_name:'orders.csv',bytes:pair.orders}};
 const base={contract_version:'1.0',...owner,expected_row_version:revision.row_version};const inspect=requiredExport<FixtureMethod>(app,'inspectImportFiles');
 const initial=await inspect({...base,source_files}),preview=await inspect({...base,source_files,inspection_token:initial.inspection_token,configuration:selection});
 const issue_treatments=(preview.reviewable_issues as {code:string;count:string;treatment_options:string[]}[]).map(x=>({code:x.code,count:x.count,treatment:x.treatment_options[0]}));
 const ready=await requiredExport<FixtureMethod>(app,'confirmRevision')({...base,command_id:desktopTestIds.revisionCommand,inspection_token:preview.inspection_token,source_files,confirmation:{...selection,issue_treatments,hypothesis_id:'current_repurchase_rate_lower_than_comparison',method_id:'membership_repurchase_comparison',method_version:'1.0',authority_confirmed:true,issues_confirmed:true,plan_confirmed:true}});
 const plan={...fixturePlan({members_bytes:pair.members,orders_bytes:pair.orders},methods,selection),owner,confirmation_id:String(requiredRecord(ready.confirmation,'confirmation').confirmation_id),snapshot_id:String(requiredRecord(ready.snapshot,'snapshot').snapshot_id)};
 const command={contract_version:'2.0',command_id:randomUUID(),...owner,expected_row_version:requiredRecord(ready.revision,'revision').row_version,confirmation_id:plan.confirmation_id,execution_plan:plan};
 return {...setup,owner,plan,command,ready};
}
