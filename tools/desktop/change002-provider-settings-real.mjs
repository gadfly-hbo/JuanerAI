// Dedicated PS01–08 host runner. Plan mode is offline. Worker never executes real mode.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir,readdir,lstat,readlink,cp,realpath} from 'node:fs/promises';
import {createHash,randomUUID} from 'node:crypto';
import {spawn,execFileSync} from 'node:child_process';
import {join,resolve,relative,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const repo=fileURLToPath(new URL('../../',import.meta.url)),R='/Users/bendandebaba/JuanerAI-artifacts/xanthil-desktop-case-assistant-decision-record';
const script=fileURLToPath(import.meta.url),hook=join(repo,'tools/desktop/change002-provider-settings-real-guard.cjs');
const require=createRequire(import.meta.url),sha=b=>createHash('sha256').update(b).digest('hex');
const save=(p,v)=>writeFile(p,JSON.stringify(v,null,2)+'\n',{flag:'wx'});
const check=(v,code)=>{if(!v)throw Error(code);};
export const BOUNDS=Object.freeze({requests:2,probe_requests:1,case_requests:0,helper_requests:1,retries:0,probe_output_tokens:128,task_output_tokens:2048,input_bytes:12000,reserved_input_tokens_per_request:16384,reserved_total_tokens:34944,credits_upper_bound:11136000,probe_ms:30000,case_request_ms:60000,helper_ms:30000,whole_run_ms:240000,payg_fallback:false,incremental_purchase:0});
export async function inventory(root){const out=[];async function walk(d){for(const n of(await readdir(d)).sort()){const p=join(d,n),s=await lstat(p),path=relative(root,p);if(s.isSymbolicLink())out.push({path,link:await readlink(p)});else if(s.isDirectory())await walk(p);else {const b=await readFile(p);out.push({path,bytes:b.length,sha256:sha(b)});}}}await walk(root);return out;}
const verify=async(root,expected)=>assert.deepEqual(await inventory(root),expected);
function within(p){p=resolve(p);check(p.startsWith(R+'/'),'PATH_REFUSED');return p;}
export function verifyReceipt(receipt,p,hash){check(receipt.approved===true&&receipt.plan_sha256===hash&&JSON.stringify(receipt.argv)===JSON.stringify(p.real_argv)&&JSON.stringify(receipt.bounds)===JSON.stringify(BOUNDS)&&receipt.synthetic_only===true&&receipt.credential_channel==='stdin'&&receipt.existing_user_authorization===true,'RECEIPT_REFUSED');}
const sources=['tools/desktop/change002-provider-settings-real.mjs','tools/desktop/change002-provider-settings-real-guard.cjs'];
async function identities(){return Promise.all(sources.map(async path=>{const b=await readFile(join(repo,path));return {path,bytes:b.length,sha256:sha(b)};}));}
export async function plan(directory){
 directory=within(directory);await mkdir(directory);const app=join(R,'package-internal-013/Xanthil-darwin-arm64/Xanthil.app');
 const binding=JSON.parse(await readFile(join(R,'package-source-binding-017.json')));check(binding.asar_sha256===sha(await readFile(join(app,'Contents/Resources/app.asar'))),'PACKAGE_CHANGED');
 for(const e of binding.sourceBindings){const b=await readFile(e.path);check(b.length===e.bytes&&sha(b)===e.sha256,'SOURCE_CHANGED');}
 const {createLocalCaseAssistantStore}=await import('../../adapters/storage-local/case-assistant.ts');
 const {createCaseAssistantApplication}=await import('../../packages/application/case-assistant.ts');
 const {caseAssistantSystemPrompt}=await import('../../adapters/agent-pi/case-assistant.ts');
 const {createRealDesktopApplication,openConfirmedDesktopRevision}=await import('../../tests/fixtures/xanthil-desktop/desktop-contract-drivers.ts');
 const {createSessionCommand,desktopTestIds}=await import('../../tests/fixtures/xanthil-desktop/desktop-fixtures.ts');
 // Reuse the actually adopted synthetic Case; no repeated real Case request.
 const previous=join(R,'provider-settings-real-plan-003'),oldPlan=JSON.parse(await readFile(join(previous,'plan.json'))),priorResult=JSON.parse(await readFile(join(previous,'execution-001/result.json')));
 check(priorResult.outcome==='FAIL'&&priorResult.phase==='organize_question'&&priorResult.requests===6,'CONTINUATION_REFUSED');
 const baseline=JSON.parse(await readFile(join(previous,'execution-001/case-adopted.json')));check(baseline.decisions.length===1&&baseline.reports.length===1,'BASELINE_REFUSED');
 const priorCase=join(previous,'execution-001/Project-case'),caseRoot=join(directory,'Project-case');
 const caseInventory=await inventory(priorCase);await cp(priorCase,caseRoot,{recursive:true,errorOnExist:true,force:false});await verify(caseRoot,caseInventory);
 const store=createLocalCaseAssistantStore({projectRoot:caseRoot}),assistant=createCaseAssistantApplication({store,runtime:null,config:null,clock:()=>new Date()});assert.deepEqual(await assistant.read(oldPlan.case.session_id),baseline);await assistant.close();
 const caseInput={...oldPlan.case,root:caseRoot,inventory:caseInventory,baseline};
 const continued_from=await Promise.all(['plan.json','execution-001/result.json','execution-001/case-adopted.json'].map(async name=>{const path=join(previous,name),b=await readFile(path);return {path,bytes:b.length,sha256:sha(b)};}));
 const helpers=[];
 for(const action of ['draft_candidates']){
  const root=join(directory,'Project-'+action);await mkdir(root);let app,p,owner;
  if(action==='organize_question'){
   app=(await createRealDesktopApplication(root)).application;await app.openProject({contract_version:'1.0',command_id:randomUUID(),proposed_project_id:desktopTestIds.project,display_name:'Synthetic'});p=await app.createSession(createSessionCommand());owner={project_id:p.session.project_id,session_id:p.session.session_id,case_id:p.session.case_id,revision_id:p.revision.revision_id};
  }else{
   const setup=await openConfirmedDesktopRevision(root);app=setup.application;owner=setup.owner;
   p=await app.startAnalysis({contract_version:'1.0',command_id:randomUUID(),...owner,expected_row_version:setup.projection.revision.row_version,confirmation_id:setup.confirmationId});
   for(let i=0;i<200&&p.runs.some(r=>r.status==='Running');i++){await new Promise(r=>setTimeout(r,25));p=await app.readProjection(owner);}assert.equal(p.revision.state,'Review');
   if(action==='draft_candidates')p=await app.acceptFinding({contract_version:'1.0',command_id:randomUUID(),...owner,expected_row_version:p.revision.row_version,finding_id:p.findings.at(-1).finding_id});
  }
  const disclosure=await app.prepareAssistanceDisclosure({contract_version:'1.0',...owner,expected_row_version:p.revision.row_version,action_kind:action,requested_provider:'xiaomi-token-plan-cn',requested_model:'mimo-v2.6-pro'});
  const output=action==='organize_question'?{draft_kind:'question_fields',draft_content:{question_text:'Synthetic question',hypothesis_display_title:'Synthetic hypothesis',business_context:'Synthetic context',alternative_explanations:['Unknown']}}:action==='explain_evidence'?{draft_kind:'evidence_explanation',draft_content:{evidence_explanation_text:'Synthetic evidence is not causal proof.'}}:{draft_kind:'candidates',draft_content:{candidates:[{title:'Synthetic option',evidence_basis:'Disclosed evidence',risk_or_refutation:'Unknown',applicability_conditions:'Synthetic case',future_validation_metric:'Future metric'}]}};
  helpers.push({action,root,owner,session_name:p.session.display_name,payload:disclosure.payload_text,payload_sha256:disclosure.payload_sha256,baseline:p,synthetic_output:output,inventory:await inventory(root)});
 }
 // Preserve the two actual successful helper drafts without repeating their calls.
 const priorHelpers=join(R,'provider-settings-real-plan-005'),helperPlan=JSON.parse(await readFile(join(priorHelpers,'plan.json'))),helperResult=JSON.parse(await readFile(join(priorHelpers,'execution-001/result.json')));
 check(helperResult.outcome==='FAIL'&&helperResult.phase==='draft_candidates'&&helperResult.requests===4,'HELPER_CONTINUATION_REFUSED');
 const preserved_helpers=[];
 for(const action of ['organize_question','explain_evidence']){
  const old=helperPlan.helpers.find(x=>x.action===action),source=join(priorHelpers,'execution-001/Project-'+action),root=join(directory,'Project-history-'+action),baseline=JSON.parse(await readFile(join(priorHelpers,'execution-001/'+action+'-terminal.json')));
  check(baseline.attempts.length===1&&baseline.attempts[0].status==='Succeeded'&&baseline.assistance_drafts.length===1&&baseline.assistance_drafts[0].disposition==='pending','HELPER_BASELINE_REFUSED');
  const files=await inventory(source);await cp(source,root,{recursive:true,errorOnExist:true,force:false});await verify(root,files);
  preserved_helpers.push({action,root,owner:old.owner,session_name:old.session_name,baseline,inventory:files});
 }
 for(const name of ['plan.json','execution-001/result.json','execution-001/organize_question-terminal.json','execution-001/explain_evidence-terminal.json']){const path=join(priorHelpers,name),b=await readFile(path);continued_from.push({path,bytes:b.length,sha256:sha(b)});}
 const adapter=await readFile(join(repo,'adapters/agent-pi/local-analysis.ts'),'utf8'),helper_system=adapter.match(/const desktopAssistanceSystemPrompt = `([^`]+)`;/)?.[1];check(helper_system,'SYSTEM_NOT_FOUND');JSON.parse(helper_system);
 const planPath=join(directory,'plan.json'),approval=join(directory,'approval.json');
 const p={version:'1.0',bounds:BOUNDS,app,app_inventory:await inventory(app),production_binding:binding,source_files:await identities(),case_system:caseAssistantSystemPrompt,helper_system,case:caseInput,continued_from,helpers,preserved_helpers,data_categories:['fixed_probe_text','synthetic_case_fields','accepted_finding_evidence','authorized_aggregate','production_system_instruction'],real_argv:[process.execPath,script,'execute','--plan',planPath,'--approval',approval],synthetic_argv:[process.execPath,script,'rehearse','--plan',planPath],credential:'Controller-only approved Xiaomi CN entry via stdin; app receives key solely by actual visible password input; no automatic import, environment, argv or evidence credential',journey:'continuation: fixed probe/save/reopen; one candidate disclosure and send; reopen two actual prior helper drafts without sends; configured normal LaunchServices reopen; delete owned Key through UI; exact previously adopted Case preserved; zero Case requests',no_retry:true};
 for(const text of [p.case.payload,...p.helpers.map(x=>x.payload)])check(!/(?:\/Users\/|\/private\/|file:\/\/)/.test(text),'UNAPPROVED_DATA');
 await save(planPath,p);await save(join(directory,'approval-template.json'),{approved:false,existing_user_authorization:true,plan_sha256:sha(await readFile(planPath)),argv:p.real_argv,bounds:BOUNDS,synthetic_only:true,credential_channel:'stdin'});
 console.log(JSON.stringify({plan:planPath,sha256:sha(await readFile(planPath)),bounds:BOUNDS,real_argv:p.real_argv,synthetic_argv:p.synthetic_argv}));return p;
}
async function stdinKey(){const chunks=[];let size=0;for await(const b of process.stdin){size+=b.length;check(size<=4096,'STDIN_LIMIT');chunks.push(b);}const key=Buffer.concat(chunks).toString('utf8');for(const b of chunks)b.fill(0);check(key.length>=8&&!/[\r\n\0]/.test(key),'STDIN_REFUSED');return key;}
async function helperCall(app,operation){return new Promise((resolve,reject)=>{const child=spawn(join(app,'Contents/MacOS/xanthil-keychain'),[],{env:{PATH:'/usr/bin:/bin'},stdio:['pipe','pipe','pipe']});let value='';const timer=setTimeout(()=>{child.kill('SIGTERM');reject(Error('KEYCHAIN_TIMEOUT'));},30000);child.stdout.on('data',b=>{value+=b;if(value.length>16384){child.kill('SIGTERM');reject(Error('KEYCHAIN_PROTOCOL'));}});child.stderr.resume();child.on('error',()=>reject(Error('KEYCHAIN_UNAVAILABLE')));child.on('close',code=>{clearTimeout(timer);try{check(code===0,'KEYCHAIN_UNAVAILABLE');resolve(JSON.parse(value));}catch{reject(Error('KEYCHAIN_PROTOCOL'));}});child.stdin.end(JSON.stringify({operation,interactive:false}));});}
export async function recordHelperTerminal(projection,item,persist){
 await persist(item.action+'-terminal.json',projection);
 assert.equal(projection.attempts.at(-1).status,'Succeeded');
 assert.equal(projection.assistance_drafts.length,1);
 assert.equal(projection.assistance_drafts[0].disposition,'pending');
 assert.equal(projection.closures.length,item.baseline.closures.length);
}
export function armNativeStage(app,stage){return app.evaluate((_electron,stage)=>globalThis.psRealControl.arm(stage),stage);}
export async function execute(planPath,approvalPath,synthetic=false){
 planPath=within(planPath);const planBytes=await readFile(planPath),p=JSON.parse(planBytes),directory=join(dirname(planPath),synthetic?'rehearsal-001':'execution-001');
 if(!synthetic){const receipt=JSON.parse(await readFile(within(approvalPath)));verifyReceipt(receipt,p,sha(planBytes));assert.deepEqual(p.real_argv,[process.execPath,...process.execArgv,...process.argv.slice(1)]);}
 assert.deepEqual(await identities(),p.source_files);await verify(p.app,p.app_inventory);
 for(const item of [p.case,...p.helpers,...p.preserved_helpers])await verify(item.root,item.inventory);
 await mkdir(directory);await mkdir(join(directory,'empty-cwd'));
 // Complete accessible raw inputs, before any OS credential access or network admission.
 const snapshot=join(directory,'pre-execution-input');await mkdir(snapshot);
 for(const item of [p.case,...p.helpers,...p.preserved_helpers]){await cp(item.root,join(snapshot,relative(dirname(planPath),item.root)),{recursive:true,errorOnExist:true,force:false});await verify(join(snapshot,relative(dirname(planPath),item.root)),item.inventory);}
 await writeFile(join(snapshot,'plan.json'),planBytes,{flag:'wx'});assert.deepEqual(await readFile(join(snapshot,'plan.json')),planBytes);
 if(!synthetic){await cp(approvalPath,join(snapshot,'approval.json'),{errorOnExist:true,force:false});assert.deepEqual(await readFile(join(snapshot,'approval.json')),await readFile(approvalPath));}
 await save(join(snapshot,'readback.json'),{pass:true,plan_sha256:sha(planBytes),projects:await Promise.all([p.case,...p.helpers,...p.preserved_helpers].map(async x=>({root:relative(dirname(planPath),x.root),files:(await inventory(x.root)).length})))});
 assert.equal((await helperCall(p.app,'inspect')).status,'absent','preexisting user slot must be preserved');
 // Rehearsal and real execution each mutate a separate copy; pristine inputs never run.
 for(const item of [p.case,...p.helpers,...p.preserved_helpers]){item.input_root=item.root;item.snapshot_root=join(snapshot,relative(dirname(planPath),item.root));const work=join(directory,relative(dirname(planPath),item.root));await cp(item.root,work,{recursive:true,errorOnExist:true,force:false});await verify(work,item.inventory);item.root=work;}
 let key=synthetic?'synthetic-real-runner-'+randomUUID():await stdinKey(),ownedKey=false,phase='launch',outcome='FAIL',deadline=false,cleanup=[],failure=null;const apps=[],observations=[];
 const safeSave=async(name,value)=>{check(!JSON.stringify(value).includes(key),'SECRET_EVIDENCE_REFUSED');await save(join(directory,name),value);};
 const {_electron,chromium}=require('playwright-core');
 const timer=setTimeout(()=>{deadline=true;for(const x of apps)if(x.child.exitCode===null&&x.child.signalCode===null)x.child.kill('SIGTERM');},BOUNDS.whole_run_ms);
 async function launch(label){
  const app=await _electron.launch({executablePath:join(p.app,'Contents/MacOS/Xanthil'),args:['--user-data-dir='+join(directory,label+'-user-data')],cwd:join(directory,'empty-cwd'),env:{PATH:'/usr/bin:/bin',LANG:'en_US.UTF-8'},timeout:30000});const child=app.process();const item={app,child,label};apps.push(item);
  child.stdout?.resume();child.stderr?.resume();
  await app.evaluate(({app},{hook,plan,synthetic})=>process.getBuiltinModule('module').createRequire(app.getAppPath()+'/package.json')(hook).install(app.getAppPath(),plan,synthetic),{hook,plan:p,synthetic});
  const page=await app.firstWindow();page.setDefaultTimeout(10000);await page.setViewportSize({width:1440,height:900});await page.getByRole('button',{name:/^模型接入/}).waitFor();
  const arm=stage=>armNativeStage(app,stage),read=()=>app.evaluate(()=>globalThis.psRealControl.read());
  return {...item,page,arm,read};
 }
 async function close(x){observations.push({label:x.label,...await x.read()});await x.app.close();check(x.child.exitCode===0&&x.child.signalCode===null,'APP_EXIT');}
 async function openProject(x,root){await x.app.evaluate(({dialog},root)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[root]});},root);await x.page.getByRole('button',{name:'选择项目',exact:true}).click();}
 const caseRead=x=>x.page.evaluate(async id=>{const r=await window.xanthilCaseAssistantApi.request({version:'1.0',operation:'read',session_id:id});if(!r.ok)throw Error('CASE_READ');return r.value;},p.case.session_id);
 const adopted=p.case.baseline;
 try{
  const first=await launch('configure');await first.page.getByRole('button',{name:/模型接入，模型未配置/}).waitFor();assert.equal((await first.read()).requests,0);
  await first.page.locator('.ca-environment').getByRole('button',{name:'配置模型',exact:true}).click();let panel=first.page.getByRole('dialog',{name:'模型接入',exact:true});
  phase='fixed-probe';await first.arm('probe');await panel.getByLabel('API Key',{exact:true}).fill(key);await panel.getByRole('button',{name:'测试连接',exact:true}).click();await panel.getByText('连接测试通过，尚未保存。点击“保存并启用”后生效。',{exact:true}).waitFor({timeout:35000});assert.equal((await first.read()).requests,1);
  phase='save';ownedKey=true;await panel.getByRole('button',{name:'保存并启用'}).click();await panel.getByText('已保存并启用。下次正常打开 Xanthil 可继续使用，任务不会自动开始。',{exact:true}).waitFor();assert.equal(await panel.getByLabel('API Key',{exact:true}).count(),0);await first.arm('idle');await first.page.screenshot({path:join(directory,'saved.png')});await close(first);
  for(const item of p.helpers){
   phase=item.action;const x=await launch(item.action);await x.page.getByRole('button',{name:/模型接入，模型已配置/}).waitFor();assert.equal((await x.read()).requests,0);await x.page.getByRole('button',{name:'专业模式',exact:true}).click();await openProject(x,item.root);await x.page.getByRole('button',{name:item.session_name,exact:true}).click();await x.page.getByText('会话已打开',{exact:true}).waitFor();
   const stage=item.action==='organize_question'?'新建分析':item.action==='explain_evidence'?'循证分析':'执行反馈',label=item.action==='organize_question'?'帮我整理问题':item.action==='explain_evidence'?'帮我解释证据':'帮我起草候选';
   await x.page.getByRole('navigation',{name:'专业模式阶段',exact:true}).getByRole('button',{name:new RegExp(stage)}).click();await x.page.locator('details.assistance-panel > summary').click();await x.page.getByRole('button',{name:label,exact:true}).click();
   const d=x.page.getByRole('dialog',{name:'逐次模型披露',exact:true});assert.equal(await d.getByLabel('精确发送载荷',{exact:true}).textContent(),item.payload);assert.equal(await d.getByLabel('载荷 SHA-256',{exact:true}).textContent(),item.payload_sha256);assert.equal((await x.read()).requests,0);
   await d.getByLabel('我已检查自由文本，不含不应发送的敏感内容',{exact:true}).check();await d.getByRole('button',{name:'确认此次披露',exact:true}).click();await x.page.getByText('已记录披露；尚未发送。',{exact:true}).waitFor();assert.equal((await x.read()).requests,0);await x.arm(item.action);await x.page.getByRole('button',{name:'发送本次已确认请求',exact:true}).click();
   let projection;for(let i=0;i<400&&!deadline;i++){const r=await x.page.evaluate(owner=>window.xanthilDesktopApi.readProjection({contract_version:'1.0',...owner}),item.owner);check(r.ok,'PROJECTION_READ');projection=r.value;if(projection.attempts.length&&projection.attempts.at(-1).status!=='Running')break;await new Promise(r=>setTimeout(r,100));}
   await recordHelperTerminal(projection,item,safeSave);assert.equal((await x.read()).requests,1);await x.arm('idle');await x.page.screenshot({path:join(directory,item.action+'.png')});await safeSave(item.action+'.json',projection);await close(x);
  }
  async function checkHelperHistory(label){
   for(const item of p.preserved_helpers){
    phase=label+'-'+item.action;const x=await launch(phase);await x.page.getByRole('button',{name:'专业模式',exact:true}).click();await openProject(x,item.root);await x.page.getByRole('button',{name:item.session_name,exact:true}).click();await x.page.getByText('会话已打开',{exact:true}).waitFor();
    const r=await x.page.evaluate(owner=>window.xanthilDesktopApi.readProjection({contract_version:'1.0',...owner}),item.owner);check(r.ok,'HISTORY_READ');assert.deepEqual(r.value,item.baseline);assert.equal((await x.read()).requests,0);await safeSave(phase+'.json',r.value);await close(x);
   }
  }
  await checkHelperHistory('configured-history');
  phase='configured-launchservices';await launchServices(p,directory,chromium); // No activation or credential environment.
  phase='reopen-delete';const end=await launch('final');await end.page.getByRole('button',{name:/模型接入，模型已配置/}).waitFor();await openProject(end,p.case.root);await end.page.locator('.ca-rail li button').first().click();assert.deepEqual(await caseRead(end),adopted);assert.equal((await end.read()).requests,0);
  await end.page.getByRole('button',{name:/^模型接入/}).click();panel=end.page.getByRole('dialog',{name:'模型接入',exact:true});assert.equal(await panel.getByLabel('API Key',{exact:true}).count(),0);await panel.getByRole('button',{name:'删除本机 Key'}).click();await end.page.getByRole('button',{name:'确认删除'}).click();await panel.getByText('本机 Key 已删除。Case、对话和报告保持不变。',{exact:true}).waitFor();ownedKey=false;assert.equal((await helperCall(p.app,'inspect')).status,'absent');await end.page.keyboard.press('Escape');assert.deepEqual(await caseRead(end),adopted);await close(end);await checkHelperHistory('deleted-history');
  assert.equal(observations.reduce((n,x)=>n+x.requests,0),BOUNDS.requests);assert.equal(observations.reduce((n,x)=>n+x.fetches,0),BOUNDS.requests);await verify(p.app,p.app_inventory);
  for(const item of [p.case,...p.helpers,...p.preserved_helpers]){await verify(item.snapshot_root,item.inventory);await verify(item.input_root,item.inventory);}
  const original=p.case.inventory.find(x=>x.path==='.xanthil/desktop/state.sqlite');assert.equal(sha(await readFile(join(p.case.root,original.path))),original.sha256);
  await safeSave('transport-observation.json',observations);outcome='PASS';
 }catch(error){outcome='FAIL';failure=safeFailure(error,phase);}finally{
  clearTimeout(timer);
  for(const x of apps)if(x.child.exitCode===null&&x.child.signalCode===null){try{observations.push({label:x.label,...await x.app.evaluate(()=>globalThis.psRealControl.read())});}catch{observations.push({label:x.label,requests:null,fetches:null,unknown:true});}let timeout;try{await Promise.race([x.app.close(),new Promise((_,reject)=>{timeout=setTimeout(()=>reject(Error('OWNED_CLOSE_TIMEOUT')),5000);})]);}catch{cleanup.push({label:x.label,pid:x.child.pid,signal:'SIGTERM'});x.child.kill('SIGTERM');outcome='FAIL';}finally{clearTimeout(timeout);}}
  if(ownedKey){try{const current=await helperCall(p.app,'read');if(current.status==='found'&&current.key===key){const deleted=await helperCall(p.app,'delete');check(['ok','absent'].includes(deleted.status),'CLEANUP_FAILED');}else check(current.status==='absent','FOREIGN_KEY_PRESERVED');}catch{cleanup.push({kind:'OWNED_KEY_CLEANUP_UNCONFIRMED'});outcome='FAIL';}}
  try{assert.equal((await helperCall(p.app,'inspect')).status,'absent');}catch{outcome='FAIL';}
  // Scan owned textual/binary outputs privately; no key or raw error is printed.
  async function scan(root){for(const n of await readdir(root)){const path=join(root,n),s=await lstat(path);if(s.isSymbolicLink())continue;if(s.isDirectory())await scan(path);else if((await readFile(path)).includes(Buffer.from(key)))throw Error('SECRET_PERSISTENCE');}}
  try{await scan(directory);for(const item of [p.case,...p.helpers,...p.preserved_helpers])await scan(item.root);}catch{outcome='FAIL';cleanup.push({kind:'SECRET_PERSISTENCE_CHECK_FAILED'});}
  await safeSave('result.json',{outcome,phase,failure,deadline,synthetic,requests:observations.some(x=>x.unknown)?null:observations.reduce((n,x)=>n+x.requests,0),observations,cleanup,exits:apps.map(x=>({label:x.label,exit:x.child.exitCode,signal:x.child.signalCode})),raw_errors_recorded:false,credential_recorded:false});key='';
 }
 check(outcome==='PASS','PS_REAL_FAILED');console.log('PS_STORED_CONFIG_JOURNEY_PASS');
}
function safeFailure(error,phase){return {phase,kind:error?.name==='AssertionError'?'ASSERTION':error?.name==='TimeoutError'?'TIMEOUT':'OPERATION',code:/^[A-Z][A-Z0-9_]{2,60}$/.test(error?.message??'')?error.message:'CHECK_FAILED',frame:String(error?.stack??'').match(/change002-provider-settings-real\.mjs:\d+:\d+/)?.[0]??null};}
async function launchServices(p,directory,chromium){
 const root=join(directory,'launchservices');await mkdir(root);const userData=join(root,'user-data'),cwd=join(directory,'empty-cwd'),env={PATH:'/usr/bin:/bin',LANG:'en_US.UTF-8'};
 const jxa=text=>execFileSync('/usr/bin/osascript',['-l','JavaScript','-e',text],{env,cwd,encoding:'utf8',timeout:10000});
 const running=()=>JSON.parse(jxa(`ObjC.import('AppKit'); JSON.stringify($.NSWorkspace.sharedWorkspace.runningApplications.js.filter(a=>ObjC.unwrap(a.bundleURL.path)===${JSON.stringify(p.app)}).map(a=>({pid:Number(a.processIdentifier)})));`));
 assert.deepEqual(running(),[]);let owned,browser;
 try{
  execFileSync('/usr/bin/open',['-n','-a',p.app,'--args','--user-data-dir='+userData,'--remote-debugging-port=0','--remote-debugging-address=127.0.0.1'],{env,cwd,stdio:'pipe',timeout:30000});
  for(let n=0;n<100;n++){const a=running();if(a.length){assert.equal(a.length,1);owned=a[0];break;}await new Promise(r=>setTimeout(r,100));}check(owned,'LS_OWNERSHIP');
  let endpoint;for(let n=0;n<100;n++){try{const [port,path]=(await readFile(join(userData,'DevToolsActivePort'),'utf8')).trim().split('\n');check(/^\d+$/.test(port)&&path.startsWith('/devtools/browser/'),'LS_ENDPOINT');endpoint='ws://127.0.0.1:'+port+path;break;}catch{await new Promise(r=>setTimeout(r,100));}}check(endpoint,'LS_ENDPOINT');
  browser=await chromium.connectOverCDP(endpoint);const page=browser.contexts()[0].pages()[0];await page.getByRole('button',{name:/模型接入，模型已配置/}).waitFor();await page.getByRole('button',{name:/^模型接入/}).click();const panel=page.getByRole('dialog',{name:'模型接入',exact:true});assert.equal(await panel.getByLabel('API Key',{exact:true}).count(),0);await page.screenshot({path:join(root,'configured.png')});await save(join(root,'readback.json'),{normalLaunchServices:true,configured:true,savedKeyNotReturned:true,quarantineModified:false});
 }finally{if(browser)await browser.close();if(owned){jxa(`ObjC.import('AppKit'); $.NSRunningApplication.runningApplicationWithProcessIdentifier(${owned.pid}).terminate;`);for(let n=0;n<100&&running().length;n++)await new Promise(r=>setTimeout(r,100));assert.deepEqual(running(),[]);}}
}
if(resolve(process.argv[1]??'')===script){const [mode,...args]=process.argv.slice(2);try{if(mode==='plan'&&args.length===1)await plan(args[0]);else if(mode==='rehearse'&&args.length===2&&args[0]==='--plan')await execute(args[1],null,true);else if(mode==='execute'&&args.length===4&&args[0]==='--plan'&&args[2]==='--approval')await execute(args[1],args[3]);else throw Error('COMMAND');}catch(error){console.error(JSON.stringify(safeFailure(error,mode??'command')));process.exitCode=1;}}
