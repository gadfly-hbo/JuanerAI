import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {createHash,randomUUID} from 'node:crypto';
import {mkdir,readFile,writeFile,copyFile,readdir,stat,realpath} from 'node:fs/promises';
import {join,resolve,isAbsolute} from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import {createServer,build} from 'vite';
import {_electron} from 'playwright-core';
const require=createRequire(import.meta.url);
const evidence=process.env.JUANERAI_DEV_EVIDENCE;
assert.ok(evidence&&isAbsolute(evidence),'JUANERAI_DEV_EVIDENCE must be a new absolute persistent evidence directory');
await mkdir(evidence); // exclusive run identity; never overwrite previous evidence
const record=async(name,value)=>writeFile(join(evidence,name),JSON.stringify(value,null,2)+'\n',{flag:'wx'});
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const identity=async path=>{const bytes=await readFile(path);return {path,bytes:bytes.length,sha256:hash(bytes)};};
// Candidate source, synthetic inputs and emitted code were copied and read back by
// Worker before this host invocation. Refuse a drifted candidate before effects.
const candidate=process.env.JUANERAI_DEV_CANDIDATE;
assert.ok(candidate&&isAbsolute(candidate),'JUANERAI_DEV_CANDIDATE must identify the frozen execution-inputs.json');
const frozenExecution=JSON.parse(await readFile(candidate,'utf8'));
async function verifyCandidate(){for(const file of frozenExecution.files)assert.deepEqual(await identity(file.path),file,`candidate drift: ${file.path}`);}
await verifyCandidate();await record('candidate-manifest.json',await identity(candidate));
async function captureTree(path){
 const files=[];
 async function visit(current){const info=await stat(current);if(info.isDirectory()){for(const name of (await readdir(current)).sort())await visit(join(current,name));}else if(info.isFile())files.push(await identity(current));}
 await visit(path);return files;
}
await record('runtime.json',{node:process.versions,toolchain:process.env.JUANERAI_TOOLCHAIN_BIN,argv:process.argv,cwd:process.cwd()});
await import('./prepare-toolchain-deployment.mjs');
require('./build-keychain-helper.cjs').buildDevelopmentKeychainHelper();
// Reuse the installed Forge config generator and project configs, including its
// compile-time renderer URL. Only the Electron launcher is Playwright-controlled.
const Generator=require('@electron-forge/plugin-vite/dist/ViteConfig.js').default;
const config=require('../../forge.config.cjs');
const generator=new Generator(config.plugins[0].config,process.cwd(),false);
const servers=[];let app;
const sourcePath=resolve('apps/desktop/renderer.tsx'),mainPath=resolve('apps/desktop/main.ts'),preloadPath=resolve('apps/desktop/preload.ts');
const originals=new Map();
const watchdog=setTimeout(()=>{console.error('NATIVE_VERIFICATION_TIMEOUT');process.exitCode=1;void app?.close();},180000);
try {
 for(const cfg of await generator.getRendererConfig()){const server=await createServer({...cfg,configFile:false});await server.listen();servers.push(server);}
 for(const cfg of await generator.getBuildConfigs())await build({...cfg,configFile:false});
 const frozenPaths=['package.json','package-lock.json','forge.config.cjs','vite.main.config.mjs','vite.preload.config.mjs','vite.renderer.config.mjs','apps/desktop/main.ts','apps/desktop/preload.ts','apps/desktop/renderer.tsx','apps/desktop/development.ts','apps/desktop/desktop-work.ts','tools/desktop/development-vite.mjs','.vite/build/main.cjs','.vite/build/preload.js','build/xanthil-toolchain-deployment.json','build/development-keychain/xanthil-keychain'];
 await verifyCandidate();
 await record('frozen-inputs.json',await Promise.all(frozenPaths.map(identity)));
 const transformed=await servers[0].transformRequest('/renderer.tsx');
 await writeFile(join(evidence,'renderer-transformed.js'),transformed.code,{flag:'wx'});
 await record('renderer-transformed-identity.json',await identity(join(evidence,'renderer-transformed.js')));
 const dev=join(await realpath(evidence),'development');
 const {prepareDevelopmentRoot}=await import('../../apps/desktop/development.ts');
 const dirs=prepareDevelopmentRoot(dev),project=join(dirs.projects,'synthetic');await mkdir(project);
 for(const name of ['members.csv','orders.csv'])await copyFile(resolve('tests/fixtures/xanthil-desktop',name),join(dev,name));
 // Build a real non-sensitive protected Project outside the development root.
 const protectedProject=join(await realpath(evidence),'protected-project');await mkdir(protectedProject);
 const {createPersonalXanthilDesktopProfile}=await import('../../profiles/personal/xanthil-desktop.ts');
 const protectedProfile=createPersonalXanthilDesktopProfile({toolchainDeployment:{descriptor_path:resolve('build/xanthil-toolchain-deployment.json')},assistanceConfig:null,clock:()=>new Date(),deadlineScheduler:{schedule:({at_epoch_ms,callback})=>{const timer=setTimeout(callback,Math.max(0,at_epoch_ms-Date.now()));return {cancel(){clearTimeout(timer);}};}}});
 const protectedOpened=await protectedProfile.openProject({contract_version:'1.0',command_id:randomUUID(),display_name:'Synthetic protected Project',projectDirectoryCapability:{projectRoot:protectedProject,display_name:'Synthetic protected Project'}});
 await protectedProfile.closeModelWork();
 await writeFile(join(protectedProject,'synthetic-sentinel.txt'),'Synthetic protected Project; never user business data.\n',{flag:'wx'});
 const protectedBefore=await captureTree(protectedProject);assert.ok(protectedBefore.some(f=>f.path.endsWith('state.sqlite')));
 await record('protected-project-before.json',{project:protectedOpened.value.project,files:protectedBefore});
 const importedInputs=await Promise.all(['members.csv','orders.csv'].map(name=>identity(join(dev,name))));
 for(const input of importedInputs){const source=await identity(resolve('tests/fixtures/xanthil-desktop',input.path.split('/').at(-1)));assert.equal(input.sha256,source.sha256);assert.equal(input.bytes,source.bytes);}
 await record('synthetic-inputs-before-launch.json',importedInputs);
 const exportPath=join(dev,'exported-decision.html');
 const launch=async()=>{
  const instance=await _electron.launch({executablePath:require('electron'),args:[resolve('.')],cwd:resolve('.'),chromiumSandbox:true,timeout:20000,env:{PATH:process.env.PATH,HOME:process.env.HOME,TMPDIR:process.env.TMPDIR,LANG:'en_US.UTF-8',JUANERAI_DESKTOP_DEV_ROOT:dev,XIAOMI_TOKEN_PLAN_CN_API_KEY:'NON_SECRET_MUST_BE_IGNORED',JUANERAI_CASE_ASSISTANT_ACTIVATION:'INVALID_MUST_BE_IGNORED'}});
  instance.process().stdout.on('data',b=>process.stdout.write(b));instance.process().stderr.on('data',b=>process.stderr.write(b));
  await instance.evaluate(({dialog},paths)=>{
   dialog.showOpenDialog=async(_win,options)=>({canceled:false,filePaths:[options.properties?.includes('openDirectory')?paths.project:options.title==='选择成员 CSV'?paths.members:paths.orders]});
   dialog.showSaveDialog=async()=>({canceled:false,filePath:paths.exportPath});
  },{project,members:join(dev,'members.csv'),orders:join(dev,'orders.csv'),exportPath});return instance;
 };
 app=await launch();let page=await app.firstWindow();await page.waitForLoadState('domcontentloaded');
 assert.equal(page.url(),'http://127.0.0.1:5173/');await page.getByText('Xanthil Desktop · 开发版',{exact:true}).waitFor();
 const observed=await app.evaluate(({app,BrowserWindow})=>({pid:process.pid,versions:process.versions,packaged:app.isPackaged,userData:app.getPath('userData'),cache:app.getPath('sessionData'),preferences:BrowserWindow.getAllWindows()[0].webContents.getLastWebPreferences(),activation:process.env.JUANERAI_CASE_ASSISTANT_ACTIVATION,key:process.env.XIAOMI_TOKEN_PLAN_CN_API_KEY}));
 assert.equal(observed.userData,dirs.userData);assert.equal(observed.cache,dirs.cache);assert.equal(observed.activation,undefined);assert.equal(observed.key,undefined);
 for(const [key,value]of Object.entries({contextIsolation:true,sandbox:true,nodeIntegration:false,webSecurity:true}))assert.equal(observed.preferences[key],value);
 await record('native-start.json',observed);
 // Native IPC negatives exercise the formal registered handlers, without
 // replacing Main, Profile, Application, Store, calculation or model behavior.
 const denied=await app.evaluate(async({ipcMain,BrowserWindow})=>{
  const wc=BrowserWindow.getAllWindows()[0].webContents,handler=ipcMain._invokeHandlers.get('xanthil-desktop:v1:listSessions');
  const request={contract_version:'1.0',project_id:'11111111-1111-4111-8111-111111111111'};
  return [await handler({sender:{},senderFrame:wc.mainFrame},request),await handler({sender:wc,senderFrame:{}},request)];
 });assert.ok(denied.every(r=>r.error.code==='FORBIDDEN'));await record('ipc-denials.json',denied);
 await app.evaluate(({dialog,ipcMain},path)=>{
  const previous=dialog.showOpenDialog;
  dialog.showOpenDialog=async(...args)=>{dialog.showOpenDialog=previous;return {canceled:false,filePaths:[path]};};
  const channel='xanthil-desktop:v1:selectProject',original=ipcMain._invokeHandlers.get(channel);
  ipcMain.removeHandler(channel);ipcMain.handle(channel,async(...args)=>{try{const result=await original(...args);globalThis.__protectedSelection=result;return result;}finally{ipcMain.removeHandler(channel);ipcMain.handle(channel,original);}});
 },protectedProject);
 await page.getByRole('button',{name:'专业模式',exact:true}).click();
 await page.getByRole('button',{name:'选择项目',exact:true}).click();
 await page.getByRole('alert').filter({hasText:'当前状态或调用来源不允许这项操作。'}).waitFor();
 const rejection=await app.evaluate(()=>globalThis.__protectedSelection);assert.equal(rejection.ok,false);assert.equal(rejection.error.code,'FORBIDDEN');
 assert.deepEqual(await captureTree(protectedProject),protectedBefore);
 await record('protected-project-rejection.json',rejection);
 const dbPath=join(project,'.xanthil/desktop/state.sqlite');
 const inspect=()=>{const db=new DatabaseSync(dbPath,{readOnly:true});try{return {runs:db.prepare('SELECT * FROM analysis_runs').all(),receipts:db.prepare('SELECT * FROM command_receipts ORDER BY command_id').all(),reports:db.prepare('SELECT * FROM report_versions').all()};}finally{db.close();}};
 const original=await readFile(sourcePath,'utf8');
 const activeState=()=>page.evaluate(()=>({
  mode:document.querySelector('.mode-switch [aria-pressed="true"]')?.textContent,
  project:document.querySelector('.project-button')?.getAttribute('title'),
  session:document.querySelector('.professional-sessions [aria-current="page"]')?.textContent,
  caseName:document.querySelector('.pro-nav h2')?.textContent,
  stage:document.querySelector('.professional-stages [aria-current="step"]')?.getAttribute('aria-label'),
  fields:[...document.querySelectorAll('.case-form input,.case-form textarea')].map(el=>({id:el.id,value:el.value,disabled:el.disabled})),
  projectDisabled:document.querySelector('.project-button')?.disabled,
 }));
 let refreshSequence=0;
 async function hotUpdate(label,check){
  const beforeState=await activeState();assert.match(beforeState.mode,/专业模式/);assert.equal(beforeState.project,'synthetic');assert.equal(beforeState.session,'Synthetic repurchase decision');
  await page.evaluate(()=>{window.__developmentHmrDocument='same-document';});
  const suffix=` · 开发版 HMR核验${++refreshSequence}`;
  const changed=original.replace("' · 开发版'",JSON.stringify(suffix));assert.notEqual(changed,original);originals.set(sourcePath,original);
  await writeFile(sourcePath,changed);await page.getByText(`Xanthil Desktop${suffix}`,{exact:true}).waitFor({timeout:10000});
  assert.equal(await page.evaluate(()=>window.__developmentHmrDocument),'same-document');assert.equal(await app.evaluate(()=>process.pid),observed.pid);
  assert.deepEqual(await activeState(),beforeState,`${label}: active mode/project/session/stage/form/busy state must survive`);await check();
  await page.screenshot({path:join(evidence,`${label}.png`)});
  await writeFile(sourcePath,original);await page.getByText('Xanthil Desktop · 开发版',{exact:true}).waitFor({timeout:10000});
  assert.deepEqual(await activeState(),beforeState,`${label}: restoring source must also preserve state`);await check();originals.delete(sourcePath);
  await record(`${label}.json`,{sameMainPid:observed.pid,sameDocument:true,before:beforeState,after:await activeState()});
 }
 await completeProfessionalJourney(page,async()=>{
  await page.getByLabel('业务背景',{exact:true}).fill('Unsaved synthetic background survives Fast Refresh.');
  await hotUpdate('draft-hmr',async()=>assert.equal(await page.getByLabel('业务背景',{exact:true}).inputValue(),'Unsaved synthetic background survives Fast Refresh.'));
 },async start=>{
  await app.evaluate(({ipcMain})=>{
   const channel='xanthil-desktop:v1:startAnalysis',original=ipcMain._invokeHandlers.get(channel);
   const state=globalThis.__pacedAnalysis={calls:[],response:null,released:false,delivered:false,timedOut:false};
   let release;const gate=new Promise(resolve=>{release=resolve;});
   const timer=setTimeout(()=>{state.timedOut=true;state.released=true;release();},30000);
   state.release=()=>{clearTimeout(timer);state.released=true;release();};
   ipcMain.removeHandler(channel);ipcMain.handle(channel,async(...args)=>{
    state.calls.push(args[1]);const result=await original(...args); // real Main/Application/store/calculation
    if(state.calls.length===1){state.response=result;await gate;state.delivered=true;}return result;
   });
  });
  try{
   await start();
   const until=Date.now()+10000;let held;
   do{held=await app.evaluate(()=>{const s=globalThis.__pacedAnalysis;return {calls:s.calls,response:s.response,released:s.released,delivered:s.delivered,timedOut:s.timedOut};});if(held.response)break;await new Promise(r=>setTimeout(r,50));}while(Date.now()<until);
   assert.equal(held.calls.length,1);assert.equal(held.response?.ok,true);assert.equal(held.delivered,false);assert.equal(held.released,false);
   await record('inflight-submitted.json',held);
   await hotUpdate('inflight-hmr',async()=>{
    assert.equal(await page.getByRole('button',{name:/开始本地处理|开始计算/}).isEnabled(),false);
    const paced=await app.evaluate(()=>({count:globalThis.__pacedAnalysis.calls.length,released:globalThis.__pacedAnalysis.released,delivered:globalThis.__pacedAnalysis.delivered,timedOut:globalThis.__pacedAnalysis.timedOut}));
    assert.deepEqual(paced,{count:1,released:false,delivered:false,timedOut:false});
    const actual=inspect();assert.equal(actual.runs.length,1);assert.equal(actual.runs[0].session_id,held.calls[0].session_id);
    assert.equal(actual.receipts.filter(r=>r.command_id===held.calls[0].command_id).length,1);
   });
   await record('inflight-business.json',inspect());
  }finally{await app.evaluate(()=>globalThis.__pacedAnalysis.release());}
 });
 const before=inspect();assert.equal(before.runs.length,1);assert.equal(before.runs[0].status,'Succeeded');assert.equal(before.reports.length,2);
 await record('business-before-hmr.json',before);
 const paced=await app.evaluate(()=>{const s=globalThis.__pacedAnalysis;return {calls:s.calls,response:s.response,released:s.released,delivered:s.delivered,timedOut:s.timedOut};});
 assert.equal(paced.calls.length,1);assert.equal(paced.delivered,true);assert.equal(paced.timedOut,false);
 assert.equal(before.receipts.filter(r=>r.command_id===paced.calls[0].command_id).length,1);
 await record('inflight-completed.json',{pacing:'Only actual startAnalysis IPC response delivery held; real Application/store/DuckDB/Python unchanged',...paced});
 await hotUpdate('report-hmr',async()=>{
  await page.getByRole('heading',{name:'修订报告 2 · 当前最终报告',exact:true}).waitFor();
  assert.equal(await page.getByRole('button',{name:'导出报告 2（Markdown / HTML）',exact:true}).isEnabled(),true);
  assert.deepEqual(inspect(),before);
 });
 const buildBefore=await Promise.all(['.vite/build/main.cjs','.vite/build/preload.js'].map(identity));
 for(const path of [mainPath,preloadPath]){const bytes=await readFile(path,'utf8');originals.set(path,bytes);await writeFile(path,bytes+'\n// Development explicit-restart verification.\n');}
 await new Promise(r=>setTimeout(r,1000));
 assert.deepEqual(await Promise.all(['.vite/build/main.cjs','.vite/build/preload.js'].map(identity)),buildBefore);
 assert.equal(await app.evaluate(()=>process.pid),observed.pid);assert.equal(await page.evaluate(()=>window.__developmentHmrDocument),'same-document');assert.deepEqual(inspect(),before);
 for(const [path,bytes]of originals){await writeFile(path,bytes);}originals.clear();
 await page.getByRole('button',{name:'导出报告 2（Markdown / HTML）',exact:true}).click();await page.getByText(/^已写入并独立读回 exported-decision.html/u).waitFor();
 await record('export.json',await identity(exportPath));
 const durable=inspect();await app.close();app=undefined;
 // Explicit restart uses the same frozen Main/Preload; reopening reads durable records.
 app=await launch();page=await app.firstWindow();page.setDefaultTimeout(10000);
 assert.notEqual(await app.evaluate(()=>process.pid),observed.pid);
 await page.getByRole('button',{name:'专业模式',exact:true}).click();await page.getByRole('button',{name:'选择项目',exact:true}).click();
 await page.getByRole('button',{name:'Synthetic repurchase decision',exact:true}).click();await page.getByText('会话已打开',{exact:true}).waitFor();
 await page.getByRole('navigation',{name:'专业模式阶段',exact:true}).getByRole('button',{name:/报告/}).click();await page.getByRole('heading',{name:'修订报告 2 · 当前最终报告',exact:true}).waitFor();
 assert.deepEqual(inspect(),durable);await page.screenshot({path:join(evidence,'reopened.png')});await record('business-reopened.json',durable);
 await app.close();app=undefined;
 const protectedAfter=await captureTree(protectedProject);await record('protected-project-after.json',protectedAfter);assert.deepEqual(protectedAfter,protectedBefore);
 assert.deepEqual(await Promise.all(importedInputs.map(f=>identity(f.path))),importedInputs);
 await record('durable-files.json',await captureTree(project));await verifyCandidate();
 await record('result.json',{result:'PASS',scope:'author native verification; not independent acceptance',hmr:['unsaved draft','submitted analysis response pending','completed professional report'],submittedAnalysisCommands:paced.calls.length,protectedSyntheticProjectFiles:protectedBefore.length,limits:'No historical user project, installed application or MacBook inspected; no model invocation'});
} catch(error){await record('failure.json',{message:error.message,stack:error.stack});throw error;}
finally{clearTimeout(watchdog);for(const [path,bytes]of originals)await writeFile(path,bytes);if(app)await app.close();for(const server of servers)await server.close();}
async function completeProfessionalJourney(page,onDraft,onAnalysis) {
  const route='insufficient_evidence';
  page.setDefaultTimeout(5000);
  await page.getByRole('button', { name: '专业模式' }).click();
  const professionalStages = page.getByRole('navigation', { name: '专业模式阶段', exact: true });
  for (const [index, stage] of ['新建分析', '数据准备', '本地处理', '循证分析', '报告', '执行反馈'].entries()) await professionalStages.getByRole('button', { name: new RegExp(`^${index + 1}\\s*${stage}$`, 'u') }).waitFor();
  await page.getByRole('button',{name:'选择项目',exact:true}).click();
  await page.getByLabel('分析案例名称').fill('Synthetic repurchase decision');
  await page.getByLabel('复购问题').fill('Why did repurchase decline?');
  await page.getByLabel('假设显示名称',{exact:true}).fill('Current repurchase rate is lower');
  await page.getByRole('button', { name: /创建分析|开始分析/ }).click();
  await page.getByText('会话已创建',{exact:true}).waitFor();await onDraft();await professionalStages.getByRole('button',{name:/数据准备/}).click();
  await page.getByRole('button',{name:'选择成员与订单 CSV',exact:true}).click();await page.getByText('请显式选择映射、期间与有效状态。',{exact:true}).waitFor();
  for(const [label,value] of [['成员 ID 列','member_id'],['成员分组列','member_group'],['订单 ID 列','order_id'],['订单成员 ID 列','order_member_id'],['支付时间列','paid_at'],['金额列','amount'],['订单状态列','status'],['币种列','currency']])await page.getByLabel(label,{exact:true}).selectOption(value);
  for(const [label,value] of [['对比期开始','2026-01-01'],['对比期结束（不含）','2026-01-29'],['当前期开始','2026-02-01'],['当前期结束（不含）','2026-03-01'],['有效状态（每行一个精确值）','paid']])await page.getByLabel(label,{exact:true}).fill(value);
  await page.getByRole('button',{name:'核对数据范围',exact:true}).click();await page.getByText('数据范围已核对，请逐项确认。',{exact:true}).waitFor();
  const treatments=page.locator('.issue-treatment select');for(let index=0;index<await treatments.count();index++)await treatments.nth(index).selectOption({index:1});
  for(const label of ['我有权将这两份本地数据用于本次分析','我已核对每项数据问题的数量与处理方式','我确认映射、期间、有效状态与分析定义'])await page.getByLabel(label,{exact:true}).check();
  await page.getByRole('button',{name:'确认数据快照',exact:true}).click();try{await page.getByText('不可变数据快照已确认',{exact:true}).waitFor();}catch(error){console.log('U3 confirmation actual state:',await page.locator('body').innerText());throw error;}
  await professionalStages.getByRole('button',{name:/本地处理/}).click();
  await onAnalysis(()=>page.getByRole('button', { name: /开始本地处理|开始计算/ }).click());
  await page.getByText('独立复核完成 · 可审阅结果',{exact:true}).waitFor({timeout:30000});await professionalStages.getByRole('button',{name:/循证分析/}).click();await page.getByRole('table',{name:'两期复购指标',exact:true}).waitFor();
  assert.equal(await page.getByRole('button',{name:'接受本次分析结果',exact:true}).count(),1,'healthy committed Finding needs the explicit U3 acceptance action');
  await page.getByRole('button', { name: '接受本次分析结果',exact:true }).click();await page.getByText('本次结果已显式接受',{exact:true}).waitFor();
  assert.equal(await page.getByText('结果尚未接受 · 没有决策闭环或外部行动。',{exact:true}).count(),0,'accepted Finding must not retain a contradictory constant unaccepted label');
  await page.getByLabel('手工证据解释（不改变计算结果）',{exact:true}).fill('Manual comparison; association is not a causal claim.');await page.getByRole('button',{name:'保存证据解释',exact:true}).click();
  await page.getByText('表单已保存；保存不等于接受或完成。',{exact:true}).waitFor();
  await professionalStages.getByRole('button',{name:/执行反馈/}).click();assert.equal(await page.getByRole('button',{name:'完成分析案例',exact:true}).isEnabled(),false);
  await page.getByLabel('闭环路线',{exact:true}).selectOption(route);
  if(route==='candidate_comparison'){
    await page.getByRole('button',{name:'新增候选',exact:true}).click();const first=page.getByRole('group',{name:'候选 1',exact:true});
    for(const [label,value]of [['候选标题','Investigate mechanism'],['证据依据','Measured repeat-rate comparison'],['风险或反证','Association is not causation'],['适用条件','Confirmed synthetic periods'],['后续验证指标','Independent repeat-rate replication']])await first.getByLabel(label,{exact:true}).fill(value);
    assert.equal(await page.getByRole('button',{name:'保存闭环路线',exact:true}).isEnabled(),false);
    await page.getByRole('button',{name:'复制候选 1',exact:true}).click();await page.getByRole('group',{name:'候选 2',exact:true}).getByLabel('候选标题',{exact:true}).fill('Retain present interpretation');
    await page.getByLabel('首选候选（可不选）',{exact:true}).selectOption({index:1});assert.equal(await page.getByRole('button',{name:'保存闭环路线',exact:true}).isEnabled(),false);await page.getByLabel('首选理由',{exact:true}).fill('A testable comparison is available.');
  }else await page.getByLabel('证据不足原因',{exact:true}).fill('No controlled causal counterfactual is available.');
  await page.getByRole('button',{name:'保存闭环路线',exact:true}).click();await page.getByRole('button',{name:'完成分析案例',exact:true}).waitFor();
  await page.waitForFunction(()=>[...document.querySelectorAll('button')].some(b=>b.textContent==='完成分析案例'&&!b.disabled));
  await page.getByRole('button', { name: '完成分析案例' }).click();
  await page.getByText('分析案例已完成，已生成不可变最终报告；未执行外部行动。',{exact:true}).waitFor();await professionalStages.getByRole('button',{name:/报告/}).click();
}

