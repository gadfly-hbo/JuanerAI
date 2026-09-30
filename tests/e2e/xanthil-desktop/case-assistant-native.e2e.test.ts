import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {readFrozenProductionPackageIdentity,assertFrozenProductionPackageIdentity} from '../../fixtures/xanthil-desktop/desktop-e2e-harness.ts';
import test, {type TestContext} from 'node:test';
import type {ElectronApplication} from 'playwright-core';
import {_electron as electron} from 'playwright-core';
import {completedCase} from '../../fixtures/case-assistant/completed-case.ts';
import {createTemporaryDesktopProject} from '../../fixtures/xanthil-desktop/desktop-fixtures.ts';
import type {AssistantProjection} from '../../../packages/contracts/case-assistant.ts';

test('AC-01–13/UI native packaged Main + real Store + installed Pi synthetic transport: authorize, answer, edit, adopt, stage6, export, revise/cancel, reopen',async t=>{
 const evidence=process.env.JUANERAI_CASE_ASSISTANT_GUI_EVIDENCE;assert.ok(evidence,'dedicated persistent evidence directory required');await mkdir(evidence,{recursive:true});
 const identity=await readFrozenProductionPackageIdentity();await assertFrozenProductionPackageIdentity(identity);await writeFile(join(evidence,'consumed-package.json'),JSON.stringify(identity,null,2));const fixtureBytes=await readFile(resolve('build/case-assistant-tests/native-synthetic-main.cjs'));await writeFile(join(evidence,'native-synthetic-main.cjs'),fixtureBytes);await writeFile(join(evidence,'fixture-identity.json'),JSON.stringify({bytes:fixtureBytes.length,sha256:createHash('sha256').update(fixtureBytes).digest('hex')}));
 const project=await createTemporaryDesktopProject();t.after(()=>project.dispose());const baseline=await completedCase(project.projectRoot),original=await readFile(join(project.projectRoot,'.xanthil/desktop/state.sqlite'));
 const app=await electron.launch({executablePath:resolve(process.env.JUANERAI_GUI_PACKAGE_ROOT??'out/Xanthil-darwin-arm64/Xanthil.app','Contents/MacOS/Xanthil'),args:['--user-data-dir='+join(evidence,'user-data')],env:{PATH:'/usr/bin:/bin',LANG:'en_US.UTF-8'},cwd:resolve('.')});ownNativeApp(t,app,evidence);let closed=false;const page=await app.firstWindow();page.setDefaultTimeout(10000);const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await app.evaluate(({dialog},root)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[root]});},project.projectRoot);
 await page.getByRole('button',{name:'选择项目',exact:true}).click();await page.getByRole('button',{name:'关联一个 Case',exact:true}).first().click();await page.getByRole('dialog').getByRole('button',{name:baseline.projection.session!.display_name,exact:true}).click();await page.getByRole('button',{name:'关联此 Case',exact:true}).click();
 await captureUiState(app,page,evidence,'quick-unapproved');
 // Default stored-config composition blocks model admission before fixture injection.
 await page.getByLabel('Case Assistant 任务文本').fill('根据合成证据记录决定与预期');await page.getByRole('button',{name:'发送',exact:true}).click();let modal=page.getByRole('dialog');assert.match(await modal.innerText(),/请检查模型接入配置/);assert.equal(await modal.getByRole('button',{name:'确认并开始',exact:true}).isEnabled(),false);await captureUiState(app,page,evidence,'authorization-unconfigured');await page.keyboard.press('Escape');
 await app.evaluate(async({app},input)=>{const require=process.getBuiltinModule('module').createRequire(process.cwd()+'/package.json');const fixture=require(input.modulePath),main=require(require('node:path').join(app.getAppPath(),'.vite/build/main.cjs'));return fixture.install({...input,packageRoot:app.getAppPath()},main.createNativeReportExportWriter());},{modulePath:resolve('build/case-assistant-tests/native-synthetic-main.cjs'),projectRoot:project.projectRoot,exportPath:join(evidence,'adopted-report.html')});
 await page.getByRole('button',{name:'发送',exact:true}).click();modal=page.getByRole('dialog');assert.match(await modal.innerText(),/synthetic \/ offline/);await captureUiState(app,page,evidence,'authorization');await modal.getByRole('checkbox').first().check();
 // Native dialog trap and Escape restore the actual trigger.
 await page.keyboard.press('Shift+Tab');assert.equal(await page.evaluate(()=>!!document.activeElement?.closest('dialog')),true);await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>!!document.activeElement?.closest('dialog')),true);
 await modal.getByRole('button',{name:'确认并开始',exact:true}).click();await page.getByText('由谁负责后续复核？',{exact:true}).waitFor();await captureUiState(app,page,evidence,'waiting-stop');await page.getByLabel('Case Assistant 任务文本').fill('合成用户负责复核');await page.getByRole('button',{name:'发送',exact:true}).click();await page.getByRole('heading',{name:'待采纳决策草案',exact:true}).waitFor();
 for(const [width,height]of [[1440,900],[1280,720]]){await app.evaluate(({BrowserWindow},size)=>BrowserWindow.getAllWindows()[0].setContentSize(size[0],size[1]),[width,height]);await page.locator('.ca-draft').scrollIntoViewIfNeeded();await page.screenshot({path:join(evidence,`pending-${width}x${height}.png`)});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'no page horizontal overflow');const action=await page.getByRole('button',{name:'采纳到 Case',exact:true}).boundingBox();assert.ok(action&&action.y>=0&&action.y+action.height<=height,'adopt action is directly visible');}
 const draftGrid=page.locator('.ca-draft > .ca-draft-grid');await draftGrid.locator('summary').first().focus();await page.keyboard.press('End');await page.waitForFunction(()=>{const grid=document.querySelector('.ca-draft > .ca-draft-grid')!;return grid.scrollTop+grid.clientHeight>=grid.scrollHeight-1;});for(const label of ['Guardrails','结果来源 / Owner','评估安排']){const field=draftGrid.locator('dl > div').filter({has:page.getByText(label,{exact:true})});const box=await field.boundingBox(),viewport=await draftGrid.boundingBox();assert.ok(box&&viewport&&box.y>=viewport.y&&box.y+box.height<=viewport.y+viewport.height,label+' keyboard-scrolled fully into view');}await page.screenshot({path:join(evidence,'outcome-bottom-keyboard-1280x720.png')});
 await page.getByRole('button',{name:'Fork Preview',exact:true}).click();assert.match(await page.getByRole('dialog').innerText(),/不会创建 Session/);await page.keyboard.press('Escape');assert.match(await page.evaluate(()=>document.activeElement?.textContent??''),/Fork/);
 await page.getByRole('button',{name:'编辑',exact:true}).click();await page.getByRole('dialog').getByLabel('决策责任人',{exact:true}).fill('未保存不应生效');await page.getByRole('dialog').getByLabel('确认时间（含时区，例如 2026-09-29T10:00:00+08:00）',{exact:true}).fill('2026-09-30T10:00:00+08:00');await page.getByRole('button',{name:'取消未确认编辑',exact:true}).click();assert.equal(await page.getByText('未保存不应生效',{exact:true}).count(),0);
 await page.getByRole('button',{name:'编辑',exact:true}).click();await page.getByRole('dialog').getByLabel('决策责任人',{exact:true}).fill('合成正式责任人');await page.getByRole('dialog').getByLabel('确认时间（含时区，例如 2026-09-29T10:00:00+08:00）',{exact:true}).fill('2026-09-29T10:00:00+08:00');await page.getByRole('button',{name:'保存字段',exact:true}).click();await page.locator('.ca-draft-grid dd').filter({hasText:'合成正式责任人'}).first().waitFor();
 await page.getByRole('button',{name:'采纳到 Case',exact:true}).click();await page.getByRole('dialog').getByLabel('采纳人',{exact:true}).fill('合成采纳人');await page.getByRole('button',{name:'确认采纳',exact:true}).click();await page.getByRole('heading',{name:/正式 Decision Record · v1/}).waitFor();
 await page.getByLabel('Case Assistant 任务文本').fill('基于当前正式决定继续核对');await page.getByRole('button',{name:'基于当前版本重新开始',exact:true}).click();await page.getByRole('dialog').getByRole('checkbox').first().check();await page.getByRole('dialog').getByRole('button',{name:'确认并开始',exact:true}).click();await page.getByText('由谁负责后续复核？',{exact:true}).nth(1).waitFor();await page.getByRole('button',{name:'停止',exact:true}).click();await page.getByRole('button',{name:'继续此工作',exact:true}).click();assert.doesNotMatch(await page.getByRole('dialog').innerText(),/当前决定已变化/);await page.getByRole('dialog').getByRole('checkbox').first().check();await page.getByRole('dialog').getByRole('button',{name:'确认并开始',exact:true}).click();await page.getByText('由谁负责后续复核？',{exact:true}).nth(2).waitFor();await page.getByRole('button',{name:'停止',exact:true}).click();
 await page.getByRole('button',{name:'返回专业模式查看',exact:true}).click();await page.getByRole('heading',{name:'当前正式决定 · v1',exact:true}).waitFor();assert.match(await page.locator('.ca-stage-six').innerText(),/合成正式责任人/);await captureUiState(app,page,evidence,'professional-adopted');
 await page.locator('.ca-stage-six > details > summary').click();await page.locator('.ca-stage-six').getByRole('button',{name:'导出此报告',exact:true}).click();for(let i=0;i<50;i++){try{await readFile(join(evidence,'adopted-report.html'));break;}catch{await new Promise(r=>setTimeout(r,20));}}assert.match(await readFile(join(evidence,'adopted-report.html'),'utf8'),/合成正式责任人/);await captureUiState(app,page,evidence,'report-selection');
 const revise=page.getByRole('button',{name:'创建待采纳修订',exact:true});await revise.focus();assert.equal(await revise.evaluate(el=>el===document.activeElement),true);const reviseBox=await revise.boundingBox(),statusBox=await page.getByRole('contentinfo',{name:'Status',exact:true}).boundingBox();assert.ok(reviseBox&&statusBox&&reviseBox.y>=64&&reviseBox.y+reviseBox.height<=statusBox.y,'1280 revision action is fully reachable above the fixed footer');await page.screenshot({path:join(evidence,'professional-revision-focused-1280x720.png')});
 await revise.click();await page.getByRole('button',{name:'取消未确认修订',exact:true}).click();assert.match(await page.locator('.ca-draft').innerText(),/已拒绝/);
 const p=await page.evaluate(async(projectId)=>{const api=window.xanthilCaseAssistantApi;const list=await api.request<readonly {id:string}[]>({version:'1.0',operation:'list',project_id:projectId});if(!list.ok)throw new Error(list.error.message);const result=await api.request<AssistantProjection>({version:'1.0',operation:'read',session_id:list.value[0].id});if(!result.ok)throw new Error(result.error.message);return result.value;},baseline.owner.project_id);
 assert.equal(p.decisions.length,1);assert.equal(p.decisions[0].fields.owner,'合成正式责任人');assert.equal(p.decisions[0].fields.confirmed_at,'2026-09-29T02:00:00.000Z');assert.equal(p.drafts[0].fields.confirmed_at,'2026-09-29T00:00:00.000Z','cancelled timestamp edit leaves original version unchanged');assert.equal(p.reports.length,1);assert.equal(p.attempts.length,3);assert.equal(p.attempts[0].turns,3);assert.equal(p.attempts[1].authorization.baseline_decision_id,p.current_decision_id);assert.equal(p.attempts[2].authorization.baseline_decision_id,p.current_decision_id);assert.equal(p.attempts[2].status,'Stopped');assert.equal(p.events.filter(e=>e.kind==='payload').length,5);assert.match(p.events.filter(e=>e.kind==='payload')[2].text,/合成用户负责复核/);await writeFile(join(evidence,'native-projection.json'),JSON.stringify(p,null,2));assert.deepEqual(await readFile(join(project.projectRoot,'.xanthil/desktop/state.sqlite')),original);assert.deepEqual(errors,[]);
 // A late poll from the old Session must not replace an explicitly selected new Session.
 await app.evaluate(async(_,input)=>{const req=process.getBuiltinModule('module').createRequire(process.cwd()+'/package.json');req(input.module).holdNextRead(input.id);},{module:resolve('build/case-assistant-tests/native-synthetic-main.cjs'),id:p.session.id});
 for(let i=0;i<100;i++){if(await app.evaluate((_,module)=>process.getBuiltinModule('module').createRequire(process.cwd()+'/package.json')(module).readIsHeld(),resolve('build/case-assistant-tests/native-synthetic-main.cjs')))break;await new Promise(r=>setTimeout(r,20));if(i===99)assert.fail('old Session poll reached deliberate delayed boundary');}
 await page.getByRole('button',{name:'关联一个 Case',exact:true}).first().click();await page.getByRole('dialog').getByRole('button',{name:baseline.projection.session!.display_name,exact:true}).click();await page.getByRole('button',{name:'关联此 Case',exact:true}).click();await page.waitForFunction(()=>!document.querySelector('.ca-draft'));
 await app.evaluate((_,module)=>process.getBuiltinModule('module').createRequire(process.cwd()+'/package.json')(module).releaseHeldRead(),resolve('build/case-assistant-tests/native-synthetic-main.cjs'));await new Promise(r=>setTimeout(r,150));assert.equal(await page.locator('.ca-draft').count(),0,'late old Session projection cannot replace the newly linked Session');await page.screenshot({path:join(evidence,'new-session-after-late-read.png')});
 await app.close();closed=true;await assertFrozenProductionPackageIdentity(identity);const reopened=await electron.launch({executablePath:resolve(process.env.JUANERAI_GUI_PACKAGE_ROOT??'out/Xanthil-darwin-arm64/Xanthil.app','Contents/MacOS/Xanthil'),args:['--user-data-dir='+join(evidence,'restart-user-data')],env:{PATH:'/usr/bin:/bin',LANG:'en_US.UTF-8'},cwd:resolve('.')});ownNativeApp(t,reopened,evidence,'reopened-last');await reopened.evaluate(({dialog},root)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[root]});},project.projectRoot);const rp=await reopened.firstWindow();rp.setDefaultTimeout(10000);await rp.getByRole('button',{name:'选择项目',exact:true}).click();await rp.locator('.ca-rail li button').first().click();await rp.getByRole('heading',{name:/正式 Decision Record · v1/}).waitFor();await rp.getByRole('button',{name:'历史',exact:true}).click();assert.match(await rp.locator('.ca-inspector').innerText(),/报告 v/);await rp.screenshot({path:join(evidence,'reopened-history.png')});assert.deepEqual(await readFile(join(project.projectRoot,'.xanthil/desktop/state.sqlite')),original);
});

async function captureUiState(app:ElectronApplication,page:Awaited<ReturnType<ElectronApplication['firstWindow']>>,evidence:string,name:string){
 for(const [width,height]of [[1440,900],[1280,720]]){
  await app.evaluate(({BrowserWindow},size)=>BrowserWindow.getAllWindows()[0].setContentSize(size[0],size[1]),[width,height]);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'no horizontal overflow in '+name);
  await page.screenshot({path:join(evidence,`${name}-${width}x${height}.png`)});
 }
}

function ownNativeApp(t:TestContext,app:ElectronApplication,evidence:string,prefix='last') {
 // Register immediately after launch, before firstWindow or any assertion.
 const child=app.process();
 t.after(async()=>{
  if(child.exitCode!==null||child.signalCode!==null)return;
  try {const page=app.windows()[0];if(page&&!page.isClosed()){await page.screenshot({path:join(evidence,prefix+'.png')});await writeFile(join(evidence,prefix+'-dom.html'),await page.content());}}
  finally {
   let timer:ReturnType<typeof setTimeout>|undefined;
   try {await Promise.race([app.close(),new Promise<never>((_,reject)=>{timer=setTimeout(()=>reject(new Error('owned fixture app close timed out')),5000);})]);}
   catch(error){if(child.exitCode===null&&child.signalCode===null){await writeFile(join(evidence,prefix+'-cleanup.json'),JSON.stringify({pid:child.pid,signal:'SIGTERM',reason:'owned fixture cleanup only; not product exit proof'}));child.kill('SIGTERM');}throw error;}
   finally {if(timer)clearTimeout(timer);}
  }
 });
 return child;
}

// Permanent validator regressions use the same actual package/preload/SQLite path.
async function fixtureCall<T>(app:ElectronApplication,method:string,arg?:unknown):Promise<T>{return app.evaluate(async(_,input)=>{const fixture=process.getBuiltinModule('module').createRequire(process.cwd()+'/package.json')(input.module);return fixture[input.method](input.arg);},{module:resolve('build/case-assistant-tests/native-synthetic-main.cjs'),method,arg});}
async function nativeSetup(t:TestContext,label:string){
 const evidence=join(process.env.JUANERAI_CASE_ASSISTANT_GUI_EVIDENCE!,label);await mkdir(evidence,{recursive:true});
 const identity=await readFrozenProductionPackageIdentity();await assertFrozenProductionPackageIdentity(identity);await writeFile(join(evidence,'consumed-package.json'),JSON.stringify(identity,null,2));
 const project=await createTemporaryDesktopProject();t.after(()=>project.dispose());const baseline=await completedCase(project.projectRoot);
 const app=await electron.launch({executablePath:resolve(process.env.JUANERAI_GUI_PACKAGE_ROOT!,'Contents/MacOS/Xanthil'),args:['--user-data-dir='+join(evidence,'user-data')],env:{PATH:'/usr/bin:/bin',LANG:'en_US.UTF-8'},cwd:resolve('.')});
 const child=ownNativeApp(t,app,evidence);const page=await app.firstWindow();page.setDefaultTimeout(5000);
 await app.evaluate(({dialog},root)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[root]});},project.projectRoot);
 await page.getByRole('button',{name:'选择项目',exact:true}).click();
 await app.evaluate(async({app},input)=>{const req=process.getBuiltinModule('module').createRequire(process.cwd()+'/package.json');return req(input.modulePath).install({...input,packageRoot:app.getAppPath()},req(req('node:path').join(app.getAppPath(),'.vite/build/main.cjs')).createNativeReportExportWriter());},{modulePath:resolve('build/case-assistant-tests/native-synthetic-main.cjs'),projectRoot:project.projectRoot,exportPath:join(evidence,'report.html')});
 await page.getByRole('button',{name:'关联一个 Case',exact:true}).first().click();await page.getByRole('dialog').getByRole('button',{name:baseline.projection.session!.display_name,exact:true}).click();await page.getByRole('button',{name:'关联此 Case',exact:true}).click();
 const read=()=>page.evaluate(async(projectId)=>{const api=window.xanthilCaseAssistantApi,list=await api.request<readonly {id:string}[]>({version:'1.0',operation:'list',project_id:projectId});if(!list.ok)throw new Error(list.error.message);const r=await api.request<AssistantProjection>({version:'1.0',operation:'read',session_id:list.value[0].id});if(!r.ok)throw new Error(r.error.message);return r.value;},baseline.owner.project_id);
 const start=async()=>{await page.getByLabel('Case Assistant 任务文本').fill('合成回归任务');await page.getByRole('button',{name:'继续此工作',exact:true}).click();await page.getByRole('dialog').getByRole('checkbox').first().check();await page.getByRole('button',{name:'确认并开始',exact:true}).click();};
 return {app,child,page,project,baseline,evidence,read,start};
}
async function waitNative(check:()=>Promise<boolean>){for(let i=0;i<100;i++){if(await check())return;await new Promise(r=>setTimeout(r,30));}assert.fail('controlled native boundary reached');}

// These geometry checks encode the frozen navigation hierarchy, not a generated
// screenshot golden. Human comparison with all four original images is also required.
test('UI-FIDELITY-001 UI-00/01 native brand and centered modes share one header row',async t=>{
 const {app,page,evidence,read}=await nativeSetup(t,'ui-fidelity-header');
 const before=await read(),observed=[];
 for(const [width,height]of [[1440,900],[1280,720]]){
  await app.evaluate(({BrowserWindow},size)=>BrowserWindow.getAllWindows()[0].setContentSize(size[0],size[1]),[width,height]);
  await page.screenshot({path:join(evidence,`quick-unapproved-${width}x${height}.png`)});
  const brand=await page.getByText('JuanerAI',{exact:true}).boundingBox(),modes=await page.getByLabel('工作模式',{exact:true}).boundingBox();
  assert.ok(brand&&modes,'both brand and mode control must be visible');
  observed.push({width,height,brand,modes});
 }
 await writeFile(join(evidence,'header-geometry.json'),JSON.stringify(observed,null,2));
 for(const {width,brand,modes}of observed){
  assert.ok(brand.y<modes.y+modes.height&&modes.y<brand.y+brand.height,'brand and mode switch must share the single approved header row');
  assert.ok(Math.abs(modes.x+modes.width/2-width/2)<=2,'mode switch must be centered in the window');
 }
 assert.deepEqual((await read()).events,before.events,'view sizing cannot create runtime history');
 assert.equal((await read()).attempts.length,0);
});

test('UI-FIDELITY-002 UI-01/17 native all six professional stages form left vertical navigation',async t=>{
 const {app,page,evidence,read}=await nativeSetup(t,'ui-fidelity-stages');const before=await read();
 await page.getByRole('button',{name:/^专业模式/}).click();await page.locator('.ca-stage-six').waitFor();
 const geometry=[];
 for(const [width,height]of [[1440,900],[1280,720]]){
  await app.evaluate(({BrowserWindow},size)=>BrowserWindow.getAllWindows()[0].setContentSize(size[0],size[1]),[width,height]);
  await page.screenshot({path:join(evidence,`professional-entry-${width}x${height}.png`)});
  const buttons=page.getByRole('navigation',{name:'专业模式阶段',exact:true}).getByRole('button');
  assert.equal(await buttons.count(),6,'retain all six first-Change stage capabilities');
  const boxes=[];for(let i=0;i<6;i++){const box=await buttons.nth(i).boundingBox();assert.ok(box);boxes.push(box);}
  const content=await page.locator('.ca-stage-six').boundingBox();assert.ok(content);geometry.push({width,height,boxes,content});
 }
 await writeFile(join(evidence,'stage-geometry.json'),JSON.stringify(geometry,null,2));
 for(const {width,height,boxes,content}of geometry){
  for(let i=0;i<6;i++){
   assert.ok(boxes[i].x+boxes[i].width<=content.x,'stage navigation belongs to the left of the workspace');
   assert.ok(boxes[i].y>=0&&boxes[i].y+boxes[i].height<=height,'every stage remains visible');
   if(i>0)assert.ok(boxes[i].y>=boxes[i-1].y+boxes[i-1].height,'stage controls must be vertically ordered');
  }
  assert.ok(content.x+content.width<=width,'professional work area remains inside viewport');
 }
 const nav=page.getByRole('navigation',{name:'专业模式阶段',exact:true});
 for(const label of ['新建分析','数据准备','本地处理','循证分析','报告','执行反馈']){
  await nav.getByRole('button',{name:new RegExp(label)}).click();assert.match(await nav.locator('[aria-current=step]').innerText(),new RegExp(label));
 }
 await page.getByRole('button',{name:/^快速模式/}).click();await page.locator('.ca-header').waitFor();
 const after=await read();assert.deepEqual(after.session,before.session);assert.deepEqual(after.events,before.events);assert.deepEqual(after.drafts,before.drafts);assert.equal(after.attempts.length,0);
});

test('UI-FIDELITY-003 UI-17 native stage6 summaries and Case control use actual source projection',async t=>{
 const {app,page,evidence,read}=await nativeSetup(t,'ui-fidelity-summary');const source=(await read()).source;
 await page.getByRole('button',{name:/^专业模式/}).click();await page.locator('.ca-stage-six').waitFor();
 await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows()[0].setContentSize(1440,900));
 await page.screenshot({path:join(evidence,'professional-summary-1440x900.png')});
 const summary=page.getByRole('region',{name:'Case 摘要',exact:true});
 assert.equal(await summary.count(),1,'stage6 must present the approved four summary cards');
 assert.equal(await summary.locator('article').count(),4);
 for(const [label,value]of [['已验证 Evidence',String(source.evidence_refs.length)],['已采纳 Finding','1'],['分析限制',String(source.limitations.length)]]){
  const card=summary.locator('article').filter({has:page.getByText(label,{exact:true})});assert.equal(await card.locator('strong').innerText(),value,'summary uses admitted source '+label);
 }
 const pro=await page.evaluate(async owner=>{const r=await window.xanthilDesktopApi.readProjection({contract_version:'1.0',...owner});if(!r.ok)throw new Error(r.error.message);return r.value;},source.owner);
 const report=pro.reports.find(r=>r.report_id===source.report.report_id);assert.ok(report);
 assert.equal(await summary.locator('article').filter({has:page.getByText('当前报告',{exact:true})}).locator('strong').innerText(),'v'+report.version_sequence);
 assert.equal(await page.getByRole('region',{name:'Case 控制权',exact:true}).count(),1,'professional right pane presents authority and report access');
 assert.equal(await page.getByRole('button',{name:'用 Case Assistant 完成决策',exact:true}).isEnabled(),true,'existing eligible source remains actionable');
 assert.equal((await read()).attempts.length,0,'summary read does not start a model');
});

test('V01 AC-04 native pending confirmation never adopts a later unreviewed draft',async t=>{
 const {app,page,read,start}=await nativeSetup(t,'v01');await fixtureCall(app,'setTurnMode','draft');await start();await page.getByRole('heading',{name:'待采纳决策草案',exact:true}).waitFor();const reviewed=(await read()).drafts.at(-1)!;
 await fixtureCall(app,'setTurnMode','hold');await start();await waitNative(()=>fixtureCall(app,'isTurnHeld'));
 await page.getByRole('button',{name:'采纳到 Case',exact:true}).click();await page.getByLabel('采纳人',{exact:true}).fill('只确认旧草案');await fixtureCall(app,'releaseHeldTurn');await waitNative(async()=>(await read()).drafts.length===2);await new Promise(r=>setTimeout(r,650));
 const confirm=page.getByRole('button',{name:'确认采纳',exact:true});if(await confirm.isEnabled())await confirm.click();
 const result=await read();assert.ok(result.decisions.length===0||result.decisions.every(d=>d.draft_id===reviewed.id),'confirmation must never substitute the newly arrived draft');assert.equal(result.drafts.at(-1)?.status,'pending');
});


for(const operation of ['edit','reject'] as const)test(`V01 AC-04 native ${operation} refuses a changed reviewed version`,async t=>{
 const {app,page,read,start}=await nativeSetup(t,'v01-'+operation);await fixtureCall(app,'setTurnMode','draft');await start();await page.getByRole('heading',{name:'待采纳决策草案',exact:true}).waitFor();const before=await read(),reviewed=before.drafts.at(-1)!;
 await page.getByRole('button',{name:operation==='edit'?'编辑':'拒绝草案',exact:true}).click();
 if(operation==='edit')await page.getByRole('dialog').getByLabel('决策责任人',{exact:true}).fill('本面板未保存字段');
 const changed=await page.evaluate(async input=>{return window.xanthilCaseAssistantApi.request({version:'1.0',operation:'edit',session_id:input.session,draft_id:input.draft.id,draft_version:input.draft.version,fields:{...input.draft.fields,owner:'另一已保存版本'}});},{session:before.session.id,draft:reviewed});assert.equal(changed.ok,true);
 await new Promise(r=>setTimeout(r,650));const submit=page.getByRole('button',{name:operation==='edit'?'保存字段':'确认拒绝',exact:true});assert.equal(await submit.isEnabled(),false,'changed reviewed version requires fresh review');await page.keyboard.press('Escape');
 const after=await read();assert.equal(after.drafts.at(-1)?.version,reviewed.version+1);assert.equal(after.drafts.at(-1)?.fields.owner,'另一已保存版本');assert.equal(after.drafts.at(-1)?.status,'pending');assert.equal(after.decisions.length,0);
});

for(const operation of ['start','send'] as const)for(const method of ['mouse','keyboard'] as const)test(`V02 AC-06 native Stop overtakes delayed ${operation} response via ${method}`,async t=>{
 const {app,page,read,start}=await nativeSetup(t,`v02-${operation}-${method}`);
 if(operation==='send'){await start();await page.getByText('由谁负责后续复核？',{exact:true}).waitFor();}
 await fixtureCall(app,'setTurnMode','hold');await fixtureCall(app,'holdResponse',operation);
 if(operation==='start')await start();else{await page.getByLabel('Case Assistant 任务文本').fill('延迟的可见回答');await page.getByRole('button',{name:'发送',exact:true}).click();}
 await waitNative(()=>fixtureCall(app,'isResponseHeld'));await waitNative(()=>fixtureCall(app,'isTurnHeld'));
 assert.equal(await page.locator('dialog[open]').count(),0,'pending start must not leave a modal covering Stop');
 const stop=page.getByRole('button',{name:'停止',exact:true});await waitNative(()=>stop.isEnabled());
 if(method==='mouse')await stop.click();else{await stop.focus();await page.keyboard.press('Enter');}
 await waitNative(async()=>(await fixtureCall<string[]>(app,'observedOperations')).includes('stop'));
 await waitNative(async()=>(await read()).attempts.at(-1)?.status==='Stopped');
 const stopped=await read();await page.waitForFunction(()=>document.querySelector('.ca-header [role=status]')?.textContent==='已停止');
 await page.evaluate(()=>{const history:string[]=[];(window as unknown as {stopStatusHistory:string[]}).stopStatusHistory=history;new MutationObserver(()=>history.push(document.querySelector('.ca-header [role=status]')?.textContent??'')).observe(document.querySelector('.ca-header')!,{subtree:true,childList:true,characterData:true});});
 await fixtureCall(app,'releaseHeldResponse');await fixtureCall(app,'releaseHeldTurn');await new Promise(r=>setTimeout(r,750));
 const after=await read();assert.equal(after.attempts.at(-1)?.status,'Stopped');assert.equal(after.attempts.at(-1)?.turns,stopped.attempts.at(-1)?.turns);assert.equal(after.events.filter(e=>e.kind==='tool'||e.kind==='payload').length,stopped.events.filter(e=>e.kind==='tool'||e.kind==='payload').length);assert.equal(after.drafts.length,0);assert.equal(after.decisions.length,0);assert.equal(after.reports.length,0);
 assert.equal(await page.locator('.ca-header [role=status]').innerText(),'已停止');assert.equal((await page.evaluate(()=>(window as unknown as {stopStatusHistory:string[]}).stopStatusHistory)).some(s=>/运行中|等待用户/.test(s)),false,'delayed start/send response cannot restore a live UI state');
});

for(const context of ['first-link','previous-other-case','reopen'] as const)test(`V04 UI-01 native top Professional returns associated source stage6 after ${context}`,async t=>{
 const setup=await nativeSetup(t,'v04-'+context);const {app,project,baseline,read,evidence}=setup;let page=setup.page;
 await fixtureCall(app,'setTurnMode','draft');await setup.start();await page.getByRole('heading',{name:'待采纳决策草案',exact:true}).waitFor();const before=await read();
 if(context==='previous-other-case'){
  await page.getByRole('button',{name:/打开专业模式来源/}).click();await page.locator('.ca-stage-six').waitFor();
  await page.getByRole('button',{name:'＋ 新建专业会话',exact:true}).click();await page.getByLabel('分析案例名称',{exact:true}).fill('另一个专业 Case');
  await page.getByLabel('复购问题',{exact:true}).fill('合成的其他问题');await page.getByLabel('假设显示名称',{exact:true}).fill('合成假设');await page.getByLabel('业务背景',{exact:true}).fill('合成背景');await page.getByRole('button',{name:'创建分析',exact:true}).click();await page.locator('.session-list [aria-current=page]').filter({hasText:'另一个专业 Case'}).waitFor();
  await page.getByRole('button',{name:/^快速模式/}).click();
 }
 if(context==='reopen'){
  await app.close();const reopened=await electron.launch({executablePath:resolve(process.env.JUANERAI_GUI_PACKAGE_ROOT!,'Contents/MacOS/Xanthil'),args:['--user-data-dir='+join(evidence,'reopened-user-data')],env:{PATH:'/usr/bin:/bin',LANG:'en_US.UTF-8'},cwd:resolve('.')});ownNativeApp(t,reopened,evidence,'reopened-last');await reopened.evaluate(({dialog},root)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[root]});},project.projectRoot);page=await reopened.firstWindow();page.setDefaultTimeout(5000);await page.getByRole('button',{name:'选择项目',exact:true}).click();await page.locator('.ca-rail li button').first().click();
 }
 await page.getByRole('button',{name:/^专业模式/}).click();await page.locator('.ca-stage-six').waitFor();assert.match(await page.locator('.professional-stages [aria-current=step]').innerText(),/执行反馈/);assert.equal(await page.locator('.session-list [aria-current=page]').innerText(),baseline.projection.session!.display_name);
 await page.getByRole('button',{name:/^快速模式/}).click();assert.match(await page.locator('.ca-header').innerText(),new RegExp(before.session.title));const after=await page.evaluate(async id=>{const r=await window.xanthilCaseAssistantApi.request<AssistantProjection>({version:'1.0',operation:'read',session_id:id});if(!r.ok)throw new Error(r.error.message);return r.value;},before.session.id);assert.equal(after.session.id,before.session.id);assert.deepEqual(after.session.source,before.session.source);assert.deepEqual(after.drafts,before.drafts);assert.deepEqual(after.events,before.events);await page.getByRole('heading',{name:'待采纳决策草案',exact:true}).waitFor();
});

test('V05 UI-05/10 native reverse history selection and reselection permits exact authorization only',async t=>{
 const {app,page,read,start}=await nativeSetup(t,'v05');await start();await page.getByText('由谁负责后续复核？',{exact:true}).waitFor();await page.getByLabel('Case Assistant 任务文本').fill('不重发的历史回答');await page.getByRole('button',{name:'发送',exact:true}).click();await page.getByRole('heading',{name:'待采纳决策草案',exact:true}).waitFor();
 const before=await read(),selected=before.events.filter(e=>e.kind==='user'||e.kind==='question').slice(0,2);
 await page.getByLabel('Case Assistant 任务文本').fill('只选择两条历史');await page.getByRole('button',{name:'继续此工作',exact:true}).click();let dialog=page.getByRole('dialog');const boxes=dialog.locator('.ca-check input');await boxes.nth(1).check();await boxes.nth(0).check();await dialog.getByRole('button',{name:'更新并核对外发清单',exact:true}).click();await dialog.getByRole('checkbox').first().check();assert.equal(await dialog.getByRole('button',{name:'确认并开始',exact:true}).isEnabled(),true,'authorization equality ignores click order');
 await boxes.nth(0).uncheck();assert.equal(await dialog.getByRole('button',{name:'确认并开始',exact:true}).isEnabled(),false,'a genuinely different set requires updated authorization');await boxes.nth(0).check();assert.equal(await dialog.getByRole('button',{name:'确认并开始',exact:true}).isEnabled(),true);
 await dialog.getByRole('button',{name:'确认并开始',exact:true}).click();await waitNative(async()=>(await read()).attempts.length===2);const after=await read(),attempt=after.attempts.at(-1)!;assert.deepEqual(attempt.authorization.selected_history.map(e=>e.id).sort(),selected.map(e=>e.id).sort());assert.doesNotMatch(attempt.authorization.payload,/不重发的历史回答/);await page.getByRole('button',{name:'停止',exact:true}).click();
});


for(const state of ['Running','Waiting'] as const)for(const exit of ['close','crash'] as const)test(`Recovery AC-06/09 native ${state} ${exit} reopens Interrupted with no auto resume`,async t=>{
 const {app,child,page,project,baseline,evidence,read,start}=await nativeSetup(t,`recovery-${state}-${exit}`);
 if(state==='Running')await fixtureCall(app,'setTurnMode','hold');await start();await waitNative(async()=>(await read()).attempts.at(-1)?.status===state);
 if(state==='Running')await waitNative(()=>fixtureCall(app,'isTurnHeld'));
 const before=await read();await writeFile(join(evidence,'before-exit.json'),JSON.stringify(before,null,2));
 if(exit==='close')await app.close();else{const ended=new Promise<void>(resolve=>child.once('exit',()=>resolve()));assert.equal(child.kill('SIGKILL'),true);await ended;assert.equal(child.signalCode,'SIGKILL');}
 await writeFile(join(evidence,'process-exit.json'),JSON.stringify({pid:child.pid,code:child.exitCode,signal:child.signalCode,requested:exit},null,2));
 const reopened=await electron.launch({executablePath:resolve(process.env.JUANERAI_GUI_PACKAGE_ROOT!,'Contents/MacOS/Xanthil'),args:['--user-data-dir='+join(evidence,'recovery-user-data')],env:{PATH:'/usr/bin:/bin',LANG:'en_US.UTF-8'},cwd:resolve('.')});ownNativeApp(t,reopened,evidence,'reopened-last');
 await reopened.evaluate(({dialog},root)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[root]});},project.projectRoot);const rp=await reopened.firstWindow();rp.setDefaultTimeout(5000);await rp.getByRole('button',{name:'选择项目',exact:true}).click();await rp.locator('.ca-rail li button').first().click();await rp.waitForFunction(()=>document.querySelector('.ca-header [role=status]')?.textContent==='已中断');
 await new Promise(r=>setTimeout(r,650));const after=await rp.evaluate(async id=>{const r=await window.xanthilCaseAssistantApi.request<AssistantProjection>({version:'1.0',operation:'read',session_id:id});if(!r.ok)throw new Error(r.error.message);return r.value;},before.session.id);await writeFile(join(evidence,'after-reopen.json'),JSON.stringify(after,null,2));
 assert.equal(after.attempts.length,before.attempts.length);assert.equal(after.attempts.at(-1)?.id,before.attempts.at(-1)?.id);assert.equal(after.attempts.at(-1)?.status,'Interrupted');assert.deepEqual(after.events.filter(e=>e.kind==='payload'||e.kind==='tool'),before.events.filter(e=>e.kind==='payload'||e.kind==='tool'));assert.equal(after.drafts.length,0);assert.equal(after.decisions.length,0);assert.equal(after.reports.length,0);assert.equal(await rp.getByRole('button',{name:'继续此工作',exact:true}).isEnabled(),true);
});

test('V03 AC-06/09 native first-user storage failure is visible and explicitly recoverable',async t=>{
 const {app,page,read,start,evidence}=await nativeSetup(t,'v03');await fixtureCall(app,'failNextFirstUserEvent');await start();await waitNative(async()=>(await read()).attempts.at(-1)?.status==='Failed');
 const failed=await read();assert.equal(failed.attempts.at(-1)?.reason,'SQLITE_BUSY');assert.equal(failed.events.filter(e=>e.kind==='payload').length,0);assert.equal(failed.drafts.length,0);assert.equal(failed.decisions.length,0);assert.equal(failed.reports.length,0);await page.waitForFunction(()=>document.querySelector('.ca-header [role=status]')?.textContent==='失败');assert.match(await page.locator('.ca-callout').innerText(),/来源 Case 未改变/);
 await start();await waitNative(async()=>(await read()).attempts.at(-1)?.status==='Waiting');await page.getByRole('button',{name:'停止',exact:true}).click();const after=await read();assert.equal(after.attempts.length,2);assert.equal(after.attempts[0].status,'Failed');assert.equal(after.attempts[1].status,'Stopped');await writeFile(join(evidence,'recovered.json'),JSON.stringify(after,null,2));
});

async function adoptNative(page:Awaited<ReturnType<ElectronApplication['firstWindow']>>,actor='合成采纳人'){
 await page.getByRole('button',{name:'采纳到 Case',exact:true}).click();await page.getByLabel('采纳人',{exact:true}).fill(actor);await page.getByRole('button',{name:'确认采纳',exact:true}).click();await page.getByRole('heading',{name:/正式 Decision Record · v/}).waitFor();
}

test('VUI01 native new professional Session and cross-Case navigation reject late previous formal state',async t=>{
 const {app,page,baseline,read,start,evidence}=await nativeSetup(t,'vui01');await fixtureCall(app,'setTurnMode','draft');await start();await page.getByRole('heading',{name:'待采纳决策草案',exact:true}).waitFor();await adoptNative(page);
 await page.getByRole('button',{name:'返回专业模式查看',exact:true}).click();await page.getByRole('heading',{name:'当前正式决定 · v1',exact:true}).waitFor();const before=await read();
 await page.getByRole('button',{name:/^快速模式/}).click();await page.locator('.ca-header').waitFor();await fixtureCall(app,'holdNextRead',before.session.id);await page.getByRole('button',{name:/^专业模式/}).click();await waitNative(()=>fixtureCall(app,'readIsHeld'));
 await page.getByRole('button',{name:'＋ 新建专业会话',exact:true}).click();const nav=page.getByRole('navigation',{name:'专业模式阶段',exact:true});await nav.getByRole('button',{name:/执行反馈/}).click();
 await fixtureCall(app,'releaseHeldRead');await new Promise(r=>setTimeout(r,650));assert.equal(await page.getByRole('button',{name:'创建待采纳修订',exact:true}).count(),0);assert.equal(await page.locator('.formal-report').count(),0);assert.equal(await page.getByRole('button',{name:'打开关联 Quick Session',exact:true}).count(),0);assert.deepEqual((await read()).drafts,before.drafts);
 await page.screenshot({path:join(evidence,'new-session-no-formal.png')});
 await nav.getByRole('button',{name:/新建分析/}).click();await page.getByLabel('分析案例名称',{exact:true}).fill('另一个合成 Case');await page.getByLabel('复购问题',{exact:true}).fill('独立问题');await page.getByLabel('假设显示名称',{exact:true}).fill('独立假设');await page.getByLabel('业务背景',{exact:true}).fill('独立合成背景');await page.getByRole('button',{name:'创建分析',exact:true}).click();await page.getByText('会话已创建',{exact:true}).waitFor();await nav.getByRole('button',{name:/执行反馈/}).click();assert.equal(await page.locator('.formal-record').count(),0);assert.equal(await page.locator('.formal-report').count(),0);
 await page.getByRole('button',{name:baseline.projection.session!.display_name,exact:true}).click();await page.getByText('会话已打开',{exact:true}).waitFor();await nav.getByRole('button',{name:/执行反馈/}).click();await page.getByRole('heading',{name:'当前正式决定 · v1',exact:true}).waitFor();assert.equal(await page.getByRole('button',{name:'创建待采纳修订',exact:true}).isEnabled(),true);assert.deepEqual((await read()).decisions,before.decisions);assert.deepEqual((await read()).reports,before.reports);
});

test('VUI02 native failed reply is visible, stops admission and allows explicit authorized continuation',async t=>{
 const {app,page,read,start}=await nativeSetup(t,'vui02');await start();await page.getByText('由谁负责后续复核？',{exact:true}).waitFor();const before=await read();await fixtureCall(app,'failNextFirstUserEvent');await page.getByLabel('Case Assistant 任务文本').fill('未保存的后续回复');await page.getByRole('button',{name:'发送',exact:true}).click();await page.getByRole('alert').filter({hasText:'SQLITE_BUSY'}).waitFor();await waitNative(async()=>(await read()).attempts.at(-1)?.status==='Failed');
 const failed=await read();assert.equal(failed.events.filter(e=>e.kind==='payload').length,1);assert.equal(failed.events.some(e=>e.text==='未保存的后续回复'),false);assert.deepEqual(failed.events.filter(e=>e.kind!=='status'),before.events.filter(e=>e.kind!=='status'));assert.deepEqual(failed.reports,[]);
 await page.getByText(/失败：SQLITE_BUSY/).waitFor();await start();await waitNative(async()=>{const p=await read();return p.attempts.length===2&&p.attempts.at(-1)?.status==='Waiting';});await page.getByRole('button',{name:'停止',exact:true}).click();assert.deepEqual((await read()).attempts.map(a=>a.status),['Failed','Stopped']);assert.equal((await read()).events.filter(e=>e.kind==='payload').length,2);
});

test('VUI03/04 native current and historical report fields/export stay readable and draft captions survive reopen',async t=>{
 const {DatabaseSync}=await import('node:sqlite');const {app,page,project,evidence,read,start}=await nativeSetup(t,'vui03-vui04');await fixtureCall(app,'setTurnMode','draft');await start();await page.getByRole('heading',{name:'待采纳决策草案',exact:true}).waitFor();assert.match(await page.locator('.ca-draft').innerText(),/本草案尚未生成报告/);await adoptNative(page);await page.getByText(/已采纳 · 已生成报告 v3/).waitFor();let p=await read();const original=p.decisions[0];
 // Valid immutable legacy-format report in this synthetic Project only.
 const markdown='# 历史正式报告\n\n'+JSON.stringify(original,null,2),html='<!doctype html><meta charset="utf-8"><pre>'+markdown.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')+'</pre>',hash=(s:string)=>createHash('sha256').update(s).digest('hex');const legacy={...p.reports[0],markdown,html,markdown_sha256:hash(markdown),html_sha256:hash(html)},body=JSON.stringify(legacy),db=new DatabaseSync(join(project.projectRoot,'.xanthil/desktop/case-assistant.sqlite'));try{db.prepare('UPDATE reports SET body=?,sha256=? WHERE id=?').run(body,hash(body),legacy.id);}finally{db.close();}
 await page.getByRole('button',{name:'修订当前正式决定',exact:true}).click();await page.getByRole('button',{name:'取消未确认修订',exact:true}).waitFor();assert.match(await page.locator('.ca-draft').innerText(),/本草案尚未生成报告/);await page.getByRole('button',{name:'取消未确认修订',exact:true}).click();await page.getByText(/修订已取消 · 未新增报告/).waitFor();await page.getByRole('button',{name:'修订当前正式决定',exact:true}).click();await page.getByRole('button',{name:'拒绝草案',exact:true}).click();await page.getByRole('button',{name:'确认拒绝',exact:true}).click();await page.getByText(/草案已拒绝 · 未新增报告/).waitFor();await page.getByRole('button',{name:'修订当前正式决定',exact:true}).click();await page.getByRole('button',{name:'编辑',exact:true}).click();await page.getByLabel('决策责任人',{exact:true}).fill('新报告责任人');await page.getByRole('button',{name:'保存字段',exact:true}).click();await adoptNative(page,'第二次采纳');await page.getByText(/已采纳 · 已生成报告 v4/).waitFor();p=await read();assert.equal(p.reports.length,2);assert.deepEqual(p.reports[0],legacy);
 await page.getByRole('button',{name:'返回专业模式查看',exact:true}).click();await page.getByRole('heading',{name:'当前正式决定 · v2',exact:true}).waitFor();
 for(const [index,owner]of [[0,'合成用户'],[1,'新报告责任人']] as const){const report=p.reports[index],detail=page.locator('#formal-report-'+report.id);await detail.locator('summary').click();const preview=detail.getByRole('article');assert.match(await preview.innerText(),new RegExp(owner));assert.equal(await preview.locator('pre').count(),0);if(index===0)assert.doesNotMatch(await preview.innerText(),/新报告责任人/);
  for(const [width,height]of [[1440,900],[1280,720]]){await app.evaluate(({BrowserWindow},size)=>BrowserWindow.getAllWindows()[0].setContentSize(size[0],size[1]),[width,height]);await detail.locator('summary').scrollIntoViewIfNeeded();await page.screenshot({path:join(evidence,`report-v${report.sequence}-top-${width}x${height}.png`)});await preview.getByRole('heading',{name:'Expected Outcome',exact:true}).scrollIntoViewIfNeeded();await page.screenshot({path:join(evidence,`report-v${report.sequence}-outcome-${width}x${height}.png`)});const last=preview.getByText('采纳时间',{exact:true});await last.scrollIntoViewIfNeeded();await page.screenshot({path:join(evidence,`report-v${report.sequence}-bottom-${width}x${height}.png`)});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);}
  await fixtureCall(app,'setExportPath',join(evidence,`report-v${report.sequence}.html`));await detail.getByRole('button',{name:'导出此报告',exact:true}).click();await waitNative(async()=>{try{return(await readFile(join(evidence,`report-v${report.sequence}.html`),'utf8'))===report.html;}catch{return false;}});await detail.locator('summary').click();
 }
 const windowPromise=app.waitForEvent('window');await app.evaluate(async({BrowserWindow},path)=>{const win=new BrowserWindow({width:1440,height:900,webPreferences:{nodeIntegration:false,contextIsolation:true,sandbox:true}});await win.loadFile(path);},join(evidence,'report-v4.html'));const exported=await windowPromise;
 for(const [width,height]of [[1440,900],[1280,720]]){await exported.setViewportSize({width,height});await exported.screenshot({path:join(evidence,`new-export-${width}x${height}.png`)});assert.match(await exported.locator('body').innerText(),/新报告责任人/);assert.equal(await exported.locator('pre').count(),0);await exported.getByRole('heading',{name:'Expected Outcome',exact:true}).scrollIntoViewIfNeeded();await exported.screenshot({path:join(evidence,`new-export-outcome-${width}x${height}.png`)});}await exported.close();assert.deepEqual((await read()).reports,p.reports);
 await page.getByRole('button',{name:/^快速模式/}).click();await page.locator('.ca-header').waitFor();await page.getByRole('button',{name:'重新打开项目',exact:true}).click();await page.locator('.ca-rail li button').first().click();await page.getByText(/已采纳 · 已生成报告 v4/).waitFor();assert.doesNotMatch(await page.locator('.ca-draft').innerText(),/未生成报告版本/);assert.deepEqual((await read()).reports,p.reports);await writeFile(join(evidence,'mixed-report-projection.json'),JSON.stringify(p,null,2));
});
