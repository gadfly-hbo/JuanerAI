import assert from 'node:assert/strict';
import test from 'node:test';
import {readFile,writeFile,mkdir,cp} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {_electron} from 'playwright-core';
import {reviewRealAuthorization} from './change002-real-pi.mjs';
const planPath=process.env.JUANERAI_RUNNER_PLAN,directory=process.env.JUANERAI_RUNNER_EVIDENCE;
assert.ok(planPath&&directory);assert.equal(process.env.XIAOMI_TOKEN_PLAN_CN_API_KEY,undefined);
test('ACTIVATE-005 packaged Main -> installed Pi -> request builder -> offline fetch -> Waiting/Stop/reopen',async t=>{
 const p=JSON.parse(await readFile(planPath));await mkdir(directory);const project=join(directory,'Project');await cp(p.project,project,{recursive:true,errorOnExist:true,force:false});await mkdir(join(directory,'empty-cwd'));
 const hook=resolve('tests/fixtures/case-assistant/pi-transport-fetch.cjs'),owned=[];
 async function launch(label,activated){
  const policy={...p.policy,project_root:project,expires_at:new Date(Date.now()+600000).toISOString()};
  const app=await _electron.launch({executablePath:join(p.app,'Contents/MacOS/Xanthil'),cwd:join(directory,'empty-cwd'),args:['--user-data-dir='+join(directory,label+'-user-data')],env:{PATH:'/usr/bin:/bin',LANG:'en_US.UTF-8',...(activated?{JUANERAI_CASE_ASSISTANT_ACTIVATION:JSON.stringify(policy),XIAOMI_TOKEN_PLAN_CN_API_KEY:'offline-preview-placeholder'}:{})},timeout:30000});
  const child=app.process();owned.push({child,label});t.after(async()=>{if(child.exitCode===null&&child.signalCode===null){let timer;try{await Promise.race([app.close(),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('OWNED_CLOSE_TIMEOUT')),5000);})]);}catch{child.kill('SIGTERM');}finally{clearTimeout(timer);}}});
  await app.evaluate(({app},hook)=>process.getBuiltinModule('module').createRequire(app.getAppPath()+'/package.json')(hook).install(),hook);
  await app.evaluate(({dialog},root)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[root]});},project);
  const page=await app.firstWindow();page.setDefaultTimeout(10000);await page.getByRole('button',{name:'选择项目',exact:true}).click();await page.locator('.ca-rail li button').first().click();
  const read=()=>page.evaluate(async id=>{const r=await window.xanthilCaseAssistantApi.request({version:'1.0',operation:'read',session_id:id});if(!r.ok)throw Error('READ_REFUSED');return r.value;},p.session_id);
  const transport=()=>app.evaluate(({app},hook)=>process.getBuiltinModule('module').createRequire(app.getAppPath()+'/package.json')(hook).read(),hook);
  return {app,page,child,read,transport};
 }
 const active=await launch('active',true);await active.page.getByLabel('Case Assistant 任务文本').fill(p.task);await active.page.getByRole('button',{name:'继续此工作',exact:true}).click();const dialog=active.page.getByRole('dialog');await reviewRealAuthorization(dialog,p.policy.authorized_contexts[0]);await dialog.getByRole('checkbox').first().check();await dialog.getByRole('button',{name:'确认并开始',exact:true}).click();
 let state;for(let i=0;i<200;i++){state=await active.read();if(state.attempts.length&&state.attempts.at(-1).status!=='Running')break;await new Promise(r=>setTimeout(r,25));}
 assert.equal(state.attempts.length,1);assert.equal(state.attempts[0].status,'Waiting');assert.equal(state.attempts[0].cost_microunits,36000000000);assert.ok(state.events.some(e=>e.kind==='question'&&e.text==='Synthetic owner?'));assert.equal(state.drafts.length,0);assert.equal(state.decisions.length,0);
 const observed=await active.transport();assert.equal(observed.fetches,1);assert.equal(observed.sockets,0);assert.equal(observed.model,'mimo-v2.6-pro');assert.equal(observed.max_tokens,2048);
 await active.page.getByRole('button',{name:'停止',exact:true}).click();state=await active.read();assert.equal(state.attempts[0].status,'Stopped');await new Promise(r=>setTimeout(r,300));assert.deepEqual(await active.read(),state);assert.deepEqual(await active.transport(),observed);await active.app.close();
 const reopened=await launch('reopened',false);assert.deepEqual(await reopened.read(),state);assert.equal((await reopened.transport()).fetches,0);await reopened.page.getByLabel('Case Assistant 任务文本').fill(p.task);await reopened.page.getByRole('button',{name:'继续此工作',exact:true}).click();assert.match(await reopened.page.getByRole('dialog').innerText(),/Provider 未授权/);assert.equal(await reopened.page.getByRole('button',{name:'确认并开始',exact:true}).isEnabled(),false);await reopened.page.keyboard.press('Escape');await reopened.app.close();
 for(const {child}of owned){assert.equal(child.exitCode,0);assert.equal(child.signalCode,null);}
 await writeFile(join(directory,'result.json'),JSON.stringify({pass:true,transport:observed,installed_sdk_path:true,real_provider_calls:0,waiting_stop_reopen:true,exits:owned.map(x=>({label:x.label,exit:x.child.exitCode,signal:x.child.signalCode})),raw_errors_recorded:false},null,2)+'\n',{flag:'wx'});
});
