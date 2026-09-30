// Change002 dedicated acceptance command. Plan is offline; execute is host-only
// and requires a Controller-supplied receipt of the user's exact approval.
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir, readdir, lstat, readlink, realpath } from 'node:fs/promises';
import { createHash, randomUUID } from 'node:crypto';
import { resolve, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

export const REAL_BUDGET = Object.freeze({ requests:8, retries:0, input_utf8_bytes:12000, reserved_input_tokens_per_request:16384, completion_tokens_per_request:2048, reserved_total_tokens:147456, credits_per_request:6144000, credits_total:49152000, request_ms:60000, execution_ms:300000, waiting_ms:120000, whole_run_ms:600000 });
const categories=['synthetic_user_text','synthetic_completed_case','accepted_evidence_finding','authorized_aggregate','selected_report_summary','current_attempt_history','production_system_instruction'];
const repo=fileURLToPath(new URL('../../',import.meta.url));
const root='/Users/bendandebaba/JuanerAI-artifacts/xanthil-desktop-case-assistant-decision-record';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const save=(path,value)=>writeFile(path,JSON.stringify(value,null,2)+'\n',{flag:'wx'});
const refuse=code=>{throw new Error(code);};
function inEvidence(path){const p=resolve(path);if(!p.startsWith(root+'/'))refuse('PATH_REFUSED');return p;}
export function assertRealApproval(receipt,plan,hash){
 if(!receipt||receipt.approved!==true||receipt.plan_sha256!==hash||!same(receipt.argv,plan.execute_argv)||!same(receipt.budget,REAL_BUDGET)||!same(plan.budget,REAL_BUDGET)||!same(receipt.data_categories,categories)||receipt.incremental_purchase!==0||receipt.payg_fallback!==false)refuse('APPROVAL_REQUIRED');
}
class ReviewFailure extends Error {
 constructor(check){super('REAL_PI_REVIEW_FAILED');this.diagnostic={check,kind:'CHECK_FAILED'};}
}
// Shared with the offline native regression; this function cannot admit a request.
export async function reviewRealAuthorization(dialog,payload){
 let check='read-authorization';
 try{
  const text=await dialog.innerText();
  check='credits-label';assert.match(text,/Token Plan Credits/);
  check='credits-total';assert.match(text,/49152000/);
  check='request-cap';assert.match(text,/共享最多 8 次请求/);
  check='expand-review';await dialog.locator('details summary').click();
  check='exact-reviewed-payload';assert.equal(await dialog.locator('details pre').innerText(),payload);
 }catch{throw new ReviewFailure(check);}
}
async function inventory(directory){
 const entries=[];
 async function visit(path){const stat=await lstat(path),name=relative(directory,path);if(stat.isSymbolicLink())entries.push({path:name,kind:'symlink',target:await readlink(path)});else if(stat.isDirectory()){for(const child of (await readdir(path)).sort())await visit(join(path,child));}else if(stat.isFile()){const bytes=await readFile(path);entries.push({path:name,kind:'file',bytes:bytes.length,sha256:sha(bytes)});}else refuse('IDENTITY_REFUSED');}
 await visit(directory);return entries;
}
async function verifyInventory(directory,expected){if(!same(await inventory(directory),expected))refuse('IDENTITY_CHANGED');}
async function sourceIdentity(){return Promise.all(['tools/desktop/change002-real-pi.mjs','adapters/agent-pi/case-assistant.ts','profiles/personal/xanthil-desktop.ts','apps/desktop/main.ts','apps/desktop/case-assistant-workspace.tsx','packages/application/case-assistant.ts','tests/fixtures/case-assistant/completed-case.ts','tests/fixtures/xanthil-desktop/desktop-contract-drivers.ts','tests/fixtures/xanthil-desktop/desktop-fixtures.ts'].map(async path=>{const b=await readFile(join(repo,path));return {path,bytes:b.length,sha256:sha(b)};}));}
async function plan(directory,app){
 directory=inEvidence(directory);app=inEvidence(app);
 if(app!==join(root,'package-internal-005/Xanthil-darwin-arm64/Xanthil.app'))refuse('PACKAGE_REFUSED');
 const bindingPath=join(root,'package-source-binding-008.json'),bindingBytes=await readFile(bindingPath),binding=JSON.parse(bindingBytes);
 if(binding.package!==join(app,'Contents/Resources/app.asar')||binding.asar_sha256!==sha(await readFile(binding.package)))refuse('IDENTITY_CHANGED');
 for(const input of binding.sourceBindings){const b=await readFile(input.path);if(b.length!==input.bytes||sha(b)!==input.sha256)refuse('IDENTITY_CHANGED');}
 await mkdir(directory);await mkdir(join(directory,'Project'));await mkdir(join(directory,'empty-cwd'));
 const {completedCase}=await import('../../tests/fixtures/case-assistant/completed-case.ts');
 const {createLocalCaseAssistantStore}=await import('../../adapters/storage-local/case-assistant.ts');
 const {createCaseAssistantApplication}=await import('../../packages/application/case-assistant.ts');
 const {validateXiaomiActivationPolicy}=await import('../../adapters/agent-pi/case-assistant.ts');
 const project=await realpath(join(directory,'Project')),baseline=await completedCase(project);
 const store=createLocalCaseAssistantStore({projectRoot:project});
 const application=createCaseAssistantApplication({store,runtime:null,config:null,clock:()=>new Date()});
 const linked=await application.link(baseline.owner,'Synthetic real Pi acceptance',randomUUID());
 const task='Synthetic acceptance only. First ask one brief question for the decision owner. After my answer, request read_evidence for the authorized source revision, then return one valid no_action draft using only the authorized source and my answer. Do not act or invent facts. Use empty strings for inapplicable outcome fields. Return only the specified JSON protocol.';
 const answer='Synthetic Reviewer owns the decision. Confirmed at 2026-09-29T10:00:00+08:00. Choose no_action because this synthetic evidence does not establish a causal effect. Alternatives: defer or act without causal evidence. Limitation: synthetic evidence only. Expected Outcome is not applicable because no action will be taken. Reassess when new verified evidence is available; Synthetic Reviewer owns reassessment. Use source evidence_refs and finding_id exactly. Read the evidence, then draft; no further question is needed.';
 const authorization=await application.prepare(linked.session.id,task,[],[],false),s=authorization.source;
 const policy={version:'1.0',provider:'xiaomi-token-plan-cn',model:'mimo-v2.6-pro',endpoint:'https://token-plan-cn.xiaomimimo.com/v1',project_root:project,run_id:randomUUID(),expires_at:new Date(Date.now()+600000).toISOString(),authorized_contexts:[authorization.payload],user_messages:[task,answer],tool_results:[null,{owner:s.owner,case_name:s.case_name,limitations:s.limitations},{finding_id:s.finding_id,evidence_refs:s.evidence_refs,summary:s.finding_summary},s.candidates,s.aggregate,authorization.selected_reports],source_revision:s.owner.revision_id,requests:8};
 validateXiaomiActivationPolicy(policy,'offline-validation-placeholder');
 // Expiry is established once at actual launch, within the approved duration.
 delete policy.expires_at;
 await application.close();
 const planPath=join(directory,'plan.json'),approvalPath=join(directory,'approval.json');
 const value={version:'1.0',mode:'NONEXECUTING_PLAN',budget:REAL_BUDGET,data_categories:categories,incremental_purchase:0,payg_fallback:false,app,project,session_id:linked.session.id,source_owner:baseline.owner,policy,task,answer,production_binding:{path:bindingPath,bytes:bindingBytes.length,sha256:sha(bindingBytes)},source_files:await sourceIdentity(),app_inventory:await inventory(app),project_inventory:await inventory(project),execute_argv:[process.execPath,'--experimental-strip-types',fileURLToPath(import.meta.url),'execute','--plan',planPath,'--approval',approvalPath],execution_directory:join(directory,'execution-001'),credential:'Controller-provisioned XIAOMI_TOKEN_PLAN_CN_API_KEY; memory only; never read ~/.zcode here',journey:'First question -> Stop while Waiting; explicit new Attempt -> question/answer -> readonly tool -> draft -> explicit adopt -> close/reopen without activation. Any unexpected result terminates, without retry or repair.'};
 await save(planPath,value);await save(join(directory,'approval-template.json'),{approved:false,plan_sha256:sha(await readFile(planPath)),argv:value.execute_argv,budget:REAL_BUDGET,data_categories:categories,incremental_purchase:0,payg_fallback:false});
 console.log(JSON.stringify({status:'PLAN_ONLY',path:planPath,bytes:(await readFile(planPath)).length,sha256:sha(await readFile(planPath)),budget:REAL_BUDGET,execute_argv:value.execute_argv}));
}
async function execute(planPath,approvalPath){
 planPath=inEvidence(planPath);approvalPath=inEvidence(approvalPath);
 const bytes=await readFile(planPath),p=JSON.parse(bytes),receipt=JSON.parse(await readFile(approvalPath));
 assertRealApproval(receipt,p,sha(bytes));
 if(!same(p.execute_argv,[process.execPath,...process.execArgv,...process.argv.slice(1)])||!same(await sourceIdentity(),p.source_files))refuse('IDENTITY_CHANGED');
 if(await realpath(p.project)!==p.project)refuse('IDENTITY_CHANGED');
 await verifyInventory(p.app,p.app_inventory);await verifyInventory(p.project,p.project_inventory);
 const bindingBytes=await readFile(p.production_binding.path);if(bindingBytes.length!==p.production_binding.bytes||sha(bindingBytes)!==p.production_binding.sha256)refuse('IDENTITY_CHANGED');
 const directory=inEvidence(p.execution_directory);await mkdir(directory); // exclusive before credential admission; failed run cannot replay
 const key=process.env.XIAOMI_TOKEN_PLAN_CN_API_KEY;delete process.env.XIAOMI_TOKEN_PLAN_CN_API_KEY;
 if(typeof key!=='string'||key.length<8||/[\r\n]/.test(key))refuse('CREDENTIAL_UNAVAILABLE');
 const policy={...p.policy,expires_at:new Date(Date.now()+REAL_BUDGET.whole_run_ms).toISOString()};
 const {validateXiaomiActivationPolicy}=await import('../../adapters/agent-pi/case-assistant.ts');validateXiaomiActivationPolicy(policy,key);
 const {_electron}=await import('playwright-core');
 const owned=[];let deadline=false,phase='launch',outcome='FAIL',failure=null;
 const timer=setTimeout(()=>{deadline=true;for(const item of owned)if(item.child.exitCode===null&&item.child.signalCode===null)item.child.kill('SIGTERM');},REAL_BUDGET.whole_run_ms);
 async function launch(label,activated){
  const app=await _electron.launch({executablePath:join(p.app,'Contents/MacOS/Xanthil'),cwd:join(resolve(planPath,'..'),'empty-cwd'),args:['--user-data-dir='+join(directory,label+'-user-data')],env:{PATH:'/usr/bin:/bin',LANG:'en_US.UTF-8',...(activated?{JUANERAI_CASE_ASSISTANT_ACTIVATION:JSON.stringify(policy),XIAOMI_TOKEN_PLAN_CN_API_KEY:key}:{})},timeout:30000});
  const item={app,child:app.process(),label};owned.push(item); // before first window/any assertion
  await app.evaluate(({dialog},project)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[project]});},p.project);
  assert.equal(await app.evaluate(()=>!!process.env.XIAOMI_TOKEN_PLAN_CN_API_KEY||!!process.env.JUANERAI_CASE_ASSISTANT_ACTIVATION),false);
  const page=await app.firstWindow();page.setDefaultTimeout(10000);await page.getByRole('button',{name:'选择项目',exact:true}).click();await page.locator('.ca-rail li button').first().click();
  const read=()=>page.evaluate(async id=>{const r=await window.xanthilCaseAssistantApi.request({version:'1.0',operation:'read',session_id:id});if(!r.ok)throw new Error('READ_REFUSED');return r.value;},p.session_id);
  return {...item,page,read};
 }
 async function settled(active,ready=()=>true){const until=Date.now()+REAL_BUDGET.execution_ms;while(Date.now()<until&&!deadline){const state=await active.read();if(ready(state)&&state.attempts.at(-1)?.status!=='Running')return state;await new Promise(r=>setTimeout(r,100));}refuse('DEADLINE');}
 async function start(active){await active.page.getByLabel('Case Assistant 任务文本').fill(p.task);await active.page.getByRole('button',{name:'继续此工作',exact:true}).click();const dialog=active.page.getByRole('dialog');await reviewRealAuthorization(dialog,p.policy.authorized_contexts[0]);await dialog.getByRole('checkbox').first().check();await dialog.getByRole('button',{name:'确认并开始',exact:true}).click();}
 try{
  await save(join(directory,'admission.json'),{plan_sha256:sha(bytes),approval_sha256:sha(await readFile(approvalPath)),argv:p.execute_argv,budget:REAL_BUDGET,credential_recorded:false});
  const active=await launch('active',true);phase='question-stop';await start(active);let state=await settled(active,s=>s.attempts.length===1);assert.equal(state.attempts.at(-1).status,'Waiting');assert.ok(state.events.some(e=>e.kind==='question'));
  await active.page.getByRole('button',{name:'停止',exact:true}).click();state=await active.read();assert.equal(state.attempts.at(-1).status,'Stopped');const stopped=JSON.stringify(state);await new Promise(r=>setTimeout(r,1000));assert.equal(JSON.stringify(await active.read()),stopped);assert.equal(state.drafts.length,0);assert.equal(state.decisions.length,0);
  phase='question-answer-tool-draft';await start(active);state=await settled(active,s=>s.attempts.length===2);assert.equal(state.attempts.at(-1).status,'Waiting');await active.page.getByLabel('Case Assistant 任务文本').fill(p.answer);await active.page.getByRole('button',{name:'发送',exact:true}).click();state=await settled(active,s=>s.events.some(e=>e.kind==='user'&&e.text===p.answer));assert.equal(state.attempts.at(-1).status,'Succeeded');assert.equal(state.drafts.length,1);assert.equal(state.decisions.length,0);assert.ok(state.events.some(e=>e.kind==='tool'&&e.status==='completed'));
  await active.page.screenshot({path:join(directory,'draft.png')});phase='explicit-adoption';await active.page.getByRole('button',{name:'采纳到 Case',exact:true}).click();await active.page.getByRole('dialog').getByLabel('采纳人',{exact:true}).fill('Synthetic Reviewer');await active.page.getByRole('button',{name:'确认采纳',exact:true}).click();await active.page.getByRole('heading',{name:/正式 Decision Record · v1/}).waitFor();state=await active.read();assert.equal(state.decisions.length,1);assert.equal(state.reports.length,1);assert.equal(state.drafts[0].status,'adopted');
  const serialized=JSON.stringify(state);if(serialized.includes(key))refuse('SECRET_REFUSED');await save(join(directory,'adopted-projection.json'),state);await active.app.close();
  phase='default-reopen';const reopened=await launch('reopened',false);assert.deepEqual(await reopened.read(),state);await reopened.page.getByLabel('Case Assistant 任务文本').fill(p.task);await reopened.page.getByRole('button',{name:'继续此工作',exact:true}).click();assert.match(await reopened.page.getByRole('dialog').innerText(),/Provider 未授权|未授权/);assert.equal(await reopened.page.getByRole('button',{name:'确认并开始',exact:true}).isEnabled(),false);await reopened.page.keyboard.press('Escape');await reopened.page.getByRole('button',{name:'专业模式',exact:true}).click();await reopened.page.locator('.ca-stage-six').waitFor();await reopened.page.screenshot({path:join(directory,'reopened.png')});await reopened.app.close();
  const original=p.project_inventory.find(x=>x.path==='.xanthil/desktop/state.sqlite');assert.equal(sha(await readFile(join(p.project,original.path))),original.sha256);await verifyInventory(p.app,p.app_inventory);
  await save(join(directory,'usage-summary.json'),{attempts:state.attempts.map(a=>({status:a.status,requests:a.turns,execution_ms:a.execution_ms,credits_upper_bound:a.cost_microunits/1000000})),reservation:REAL_BUDGET,model:'mimo-v2.6-pro',provider:'xiaomi-token-plan-cn',real_installed_pi:true});outcome='PASS';
 }catch(error){
  failure=error instanceof ReviewFailure?error.diagnostic:{check:'phase-operation',kind:'CHECK_FAILED'};
  throw new Error('REAL_PI_RUN_FAILED'); // Never propagate raw provider/UI/assertion contents.
 }finally{
  clearTimeout(timer);const cleanup=[];
  try{const {createLocalCaseAssistantStore}=await import('../../adapters/storage-local/case-assistant.ts');const state=await createLocalCaseAssistantStore({projectRoot:p.project}).readSession(p.session_id);if(!JSON.stringify(state).includes(key))await save(join(directory,'terminal-session.json'),state);}catch{/* Result still records the exact phase; never dump a raw exception. */}
  for(const {app,child,label}of owned){if(child.exitCode===null&&child.signalCode===null){let stopTimer;try{await Promise.race([app.close(),new Promise((_,reject)=>{stopTimer=setTimeout(()=>reject(new Error('CLOSE_TIMEOUT')),5000);})]);}catch{child.kill('SIGTERM');cleanup.push({label,pid:child.pid,signal:'SIGTERM',purpose:'owned cleanup only, not recovery proof'});}finally{clearTimeout(stopTimer);}}}
  await save(join(directory,'result.json'),{outcome,phase,failure,deadline,cleanup,exits:owned.map(x=>({label:x.label,pid:x.child.pid,exit:x.child.exitCode,signal:x.child.signalCode})),raw_errors_recorded:false});
 }
 console.log('REAL_PI_ACCEPTANCE_PASS');
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const [mode,...args]=process.argv.slice(2);
 try{if(mode==='plan'&&args.length===4&&args[0]==='--directory'&&args[2]==='--app')await plan(args[1],args[3]);else if(mode==='execute'&&args.length===4&&args[0]==='--plan'&&args[2]==='--approval')await execute(args[1],args[3]);else refuse('COMMAND_REFUSED');}
 catch{console.error('CHANGE002_RUN_REFUSED_OR_FAILED; inspect fixed phase/result evidence; no automatic retry');process.exitCode=1;}
}
