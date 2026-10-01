import {closeOwnedNativeProcess} from '../../fixtures/case-assistant/owned-native-cleanup.ts';
import assert from 'node:assert/strict';
import {mkdir,writeFile,readFile,access} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {createHash} from 'node:crypto';
import test from 'node:test';
import {createRequire} from 'node:module';
import {constants} from 'node:fs';
import {_electron as electron} from 'playwright-core';

test('PS-01 normal installed entry exposes approved model settings before opening a Project',async t=>{
 const root=process.env.JUANERAI_PROVIDER_SETTINGS_GUI_EVIDENCE!,appRoot=process.env.JUANERAI_GUI_PACKAGE_ROOT!;
 assert.ok(root&&appRoot,'explicit frozen host paths required');await mkdir(root,{recursive:true});
 const bytes=await readFile(join(appRoot,'Contents/Resources/app.asar'));
 assert.equal(createHash('sha256').update(bytes).digest('hex'),process.env.JUANERAI_PROVIDER_SETTINGS_ASAR_SHA256,'exact supplied package identity');
 const app=await electron.launch({executablePath:join(appRoot,'Contents/MacOS/Xanthil'),args:['--user-data-dir='+join(root,'user-data')],env:{PATH:'/usr/bin:/bin',LANG:'en_US.UTF-8'},cwd:root});
 const child=app.process();t.after(async()=>{if(child.exitCode!==null||child.signalCode!==null)return;let timer:ReturnType<typeof setTimeout>|undefined;try{await Promise.race([app.close(),new Promise<never>((_,reject)=>{timer=setTimeout(()=>reject(new Error('owned app close timeout')),5000);})]);}catch(e){if(child.exitCode===null&&child.signalCode===null){await writeFile(join(root,'owned-cleanup.json'),JSON.stringify({pid:child.pid,signal:'SIGTERM',reason:'fixture cleanup only'}));child.kill('SIGTERM');}throw e;}finally{if(timer)clearTimeout(timer);}});
 const page=await app.firstWindow();page.setDefaultTimeout(5000);await page.setViewportSize({width:1440,height:900});
 await page.getByRole('button',{name:/^快速模式/}).waitFor();await page.getByRole('button',{name:'选择项目',exact:true}).waitFor();
 await page.screenshot({path:join(root,'normal-unconfigured-before-project.png')});
 assert.equal(await page.getByRole('button',{name:/^模型接入/}).count(),1,'PS-01 normal startup must expose global model settings without a Project');
 await page.getByRole('button',{name:/^模型接入/}).click();const panel=page.getByRole('dialog',{name:'模型接入',exact:true});await panel.waitFor();
 assert.match(await panel.innerText(),/Xiaomi Token Plan/);assert.match(await panel.innerText(),/MiMo 2.6 Pro/);
 assert.equal(await panel.getByLabel('API Key',{exact:true}).inputValue(),'');assert.equal(await panel.getByRole('button',{name:'测试连接',exact:true}).isEnabled(),false);
 await page.keyboard.press('Escape');assert.equal(await panel.count(),0);assert.match(await page.evaluate(()=>document.activeElement?.getAttribute('aria-label')??''),/^模型接入/);
 // The returned focus must support keyboard reopening; every exit preserves ownership.
 await page.keyboard.press('Enter');await panel.waitFor();await panel.getByRole('button',{name:'关闭模型接入',exact:true}).click();
 assert.match(await page.evaluate(()=>document.activeElement?.getAttribute('aria-label')??''),/^模型接入/);
 await page.keyboard.press('Enter');await panel.waitFor();await panel.getByRole('button',{name:'取消',exact:true}).click();
 assert.match(await page.evaluate(()=>document.activeElement?.getAttribute('aria-label')??''),/^模型接入/);
 const callout=page.locator('.ca-environment').getByRole('button',{name:'配置模型',exact:true});
 await callout.click();await panel.waitFor();assert.equal(await page.getByRole('dialog',{name:'模型接入',exact:true}).count(),1,'callout uses the same singleton panel');
 assert.equal(await panel.getByLabel('API Key',{exact:true}).inputValue(),'');
 await page.screenshot({path:join(root,'callout-panel-1440.png')});await page.keyboard.press('Escape');
 assert.equal(await callout.evaluate(e=>document.activeElement===e),true,'focus returns to callout, not header');
 await page.setViewportSize({width:1280,height:720});await page.keyboard.press('Enter');await panel.waitFor();
 await panel.getByRole('button',{name:'关闭模型接入',exact:true}).click();assert.equal(await callout.evaluate(e=>document.activeElement===e),true);
 await page.screenshot({path:join(root,'callout-focus-1280.png')});

});

test('PS-01–05 real Keychain through normal packaged settings: test/save/reopen/replace/delete and exact fixed probe',async t=>{
 const root=join(process.env.JUANERAI_PROVIDER_SETTINGS_GUI_EVIDENCE!,'settings'),appRoot=process.env.JUANERAI_GUI_PACKAGE_ROOT!;await mkdir(root,{recursive:true});
 const executable=join(appRoot,'Contents/MacOS/Xanthil'),helper=join(appRoot,'Contents/MacOS/xanthil-keychain');
 const {spawn}=await import('node:child_process');
 async function helperCall(operation:string){return new Promise<Record<string,unknown>>((resolve,reject)=>{const child=spawn(helper,[],{env:{PATH:'/usr/bin:/bin'},stdio:['pipe','pipe','pipe']});let output='';const timer=setTimeout(()=>{child.kill('SIGTERM');reject(Error('owned helper timeout'));},30000);child.stdout.on('data',v=>output+=v);child.stderr.resume();child.on('error',reject);child.on('close',code=>{clearTimeout(timer);if(code!==0)return reject(Error('helper failed'));try{resolve(JSON.parse(output));}catch{reject(Error('helper protocol'));}});child.stdin.end(JSON.stringify({operation,interactive:false}));});}
 const inspect=await helperCall('inspect');assert.equal(inspect.status,'absent','refuse to touch any preexisting production Keychain item');
 let owned=false;const apps:import('playwright-core').ElectronApplication[]=[];
 t.after(async()=>{if(owned){const result=await helperCall('delete');assert.ok(['ok','absent'].includes(String(result.status)),'cleanup only this initially absent test-owned Keychain slot');}assert.equal((await helperCall('inspect')).status,'absent');});
 async function launch(){
  const app=await electron.launch({executablePath:executable,args:['--user-data-dir='+join(root,'user-data')],env:{PATH:'/usr/bin:/bin',LANG:'en_US.UTF-8'},cwd:root});apps.push(app);const child=app.process();
  t.after(async()=>{if(child.exitCode!==null||child.signalCode!==null)return;let timer:ReturnType<typeof setTimeout>|undefined;try{await Promise.race([app.close(),new Promise<never>((_,reject)=>{timer=setTimeout(()=>reject(Error('owned app timeout')),5000);})]);}finally{if(timer)clearTimeout(timer);if(child.exitCode===null&&child.signalCode===null){await writeFile(join(root,`cleanup-${child.pid}.json`),JSON.stringify({pid:child.pid,reason:'fixture-only',signal:'SIGTERM'}));child.kill('SIGTERM');}}});
  const page=await app.firstWindow();page.setDefaultTimeout(8000);await page.getByRole('button',{name:/^模型接入/}).waitFor();
  // Patch the exact installed SDK instance used by normal Main. Block network first.
  await app.evaluate(({app},hook)=>process.getBuiltinModule('module').createRequire(app.getAppPath()+'/package.json')(hook).install(app.getAppPath()),resolve('tests/fixtures/case-assistant/provider-settings-sdk.cjs'));return {app,page};
 }
 let {app,page}=await launch();await page.setViewportSize({width:1440,height:900});await page.getByRole('button',{name:/^模型接入/}).click();let panel=page.getByRole('dialog',{name:'模型接入',exact:true});
 await page.screenshot({path:join(root,'panel-empty-1440.png')});
 const key='synthetic-settings-owned-'+crypto.randomUUID();await panel.getByLabel('API Key',{exact:true}).fill(key);await panel.getByRole('button',{name:'测试连接',exact:true}).click();await panel.getByText('连接测试通过，尚未保存。点击“保存并启用”后生效。',{exact:true}).waitFor();assert.equal((await helperCall('inspect')).status,'absent');
 await panel.getByLabel('API Key',{exact:true}).fill(key+'changed');assert.equal(await panel.getByRole('button',{name:'保存并启用'}).isEnabled(),false);await panel.getByLabel('API Key',{exact:true}).fill(key);await panel.getByRole('button',{name:'测试连接',exact:true}).click();await panel.getByText('连接测试通过，尚未保存。点击“保存并启用”后生效。',{exact:true}).waitFor();
 owned=true;await panel.getByRole('button',{name:'保存并启用'}).click();await panel.getByText('已保存并启用。下次正常打开 Xanthil 可继续使用，任务不会自动开始。',{exact:true}).waitFor();assert.equal(await panel.getByLabel('API Key',{exact:true}).count(),0);assert.equal((await helperCall('inspect')).status,'present');await page.screenshot({path:join(root,'panel-saved-1440.png')});assert.equal(await app.evaluate(()=>Reflect.get(globalThis,'psCalls')),2);
 await app.close();({app,page}=await launch());await page.setViewportSize({width:1280,height:720});await page.getByRole('button',{name:/模型接入，模型已配置/}).waitFor();assert.equal(await app.evaluate(()=>Reflect.get(globalThis,'psCalls')),0,'reopen must never test or resume');await page.getByRole('button',{name:/^模型接入/}).click();panel=page.getByRole('dialog',{name:'模型接入',exact:true});assert.equal(await panel.getByLabel('API Key',{exact:true}).count(),0);await page.screenshot({path:join(root,'panel-saved-reopen-1280.png')});
 await panel.getByRole('button',{name:'更换 Key'}).click();await panel.getByLabel('API Key',{exact:true}).fill('synthetic-replacement');await app.evaluate(()=>Reflect.set(globalThis,'psMode','invalid'));await panel.getByRole('button',{name:'测试连接',exact:true}).click();await panel.getByText('Key 无效或无权使用此模型，请检查后重新测试。',{exact:true}).waitFor();await page.screenshot({path:join(root,'replacement-invalid-1280.png')});assert.equal(await panel.getByRole('button',{name:'保存并启用'}).isEnabled(),false);await panel.getByRole('button',{name:'取消',exact:true}).click();
 await app.evaluate(()=>Reflect.set(globalThis,'psMode','delay'));await panel.getByRole('button',{name:'测试连接',exact:true}).click();await panel.getByRole('button',{name:'取消测试'}).waitFor();await page.keyboard.press('Escape');await app.evaluate(()=>Reflect.get(globalThis,'psRelease')?.());await page.getByRole('button',{name:/^模型接入/}).click();panel=page.getByRole('dialog',{name:'模型接入',exact:true});assert.equal(await panel.getByLabel('API Key',{exact:true}).count(),0);
 await panel.getByRole('button',{name:'删除本机 Key'}).click();await page.getByRole('button',{name:'取消删除'}).click();assert.equal((await helperCall('inspect')).status,'present');await panel.getByRole('button',{name:'删除本机 Key'}).click();await page.getByRole('button',{name:'确认删除'}).click();await panel.getByText('本机 Key 已删除。Case、对话和报告保持不变。',{exact:true}).waitFor();owned=false;assert.equal((await helperCall('inspect')).status,'absent');await page.screenshot({path:join(root,'panel-deleted-1280.png')});
 await page.keyboard.press('Escape');await page.getByRole('button',{name:/^专业模式/}).click();await page.getByRole('button',{name:/^模型接入/}).click();await page.screenshot({path:join(root,'professional-panel-1280.png')});
 await writeFile(join(root,'result.json'),JSON.stringify({synthetic:true,requests:0,realKeychain:true,ownedItemDeleted:true,normalMain:true,screenshots:['panel-empty-1440.png','panel-saved-1440.png','panel-saved-reopen-1280.png','replacement-invalid-1280.png','panel-deleted-1280.png','professional-panel-1280.png']}));
});

test('F1–F4 packaged Main closes every window: delayed probe/save and all four consumers, no late requests or commits',{timeout:180000},async t=>{
 const root=join(process.env.JUANERAI_PROVIDER_SETTINGS_GUI_EVIDENCE!,'lifecycle'),appRoot=process.env.JUANERAI_GUI_PACKAGE_ROOT!,asar=join(appRoot,'Contents/Resources/app.asar');await mkdir(root,{recursive:true});
 assert.equal(createHash('sha256').update(await readFile(asar)).digest('hex'),process.env.JUANERAI_PROVIDER_SETTINGS_ASAR_SHA256);
 type Projection=import('../../../packages/contracts/xanthil-desktop-ipc.ts').DesktopProjection;
 type Fixture=Record<string,(v:unknown)=>Promise<Projection>>;
 const {createRealDesktopApplication,openConfirmedDesktopRevision}=await import('../../fixtures/xanthil-desktop/desktop-contract-drivers.ts'),{createSessionCommand,desktopTestIds}=await import('../../fixtures/xanthil-desktop/desktop-fixtures.ts'),{completedCase}=await import('../../fixtures/case-assistant/completed-case.ts');
 const seeds=[];
 for(const action of ['organize_question','explain_evidence','draft_candidates'] as const){
  const project=join(root,'Project-'+action);await mkdir(project);let p:Projection;
  if(action==='organize_question'){const seed=(await createRealDesktopApplication(project)).application as Fixture;await seed.openProject({contract_version:'1.0',command_id:crypto.randomUUID(),proposed_project_id:desktopTestIds.project,display_name:'Synthetic'});p=await seed.createSession(createSessionCommand());}
  else{const setup=await openConfirmedDesktopRevision(project),seed=setup.application as Fixture;p=await seed.startAnalysis({contract_version:'1.0',command_id:crypto.randomUUID(),...setup.owner,expected_row_version:(setup.projection as unknown as Projection).revision!.row_version,confirmation_id:setup.confirmationId});for(let i=0;i<200&&p.runs.some(r=>r.status==='Running');i++){await new Promise(r=>setTimeout(r,10));p=await seed.readProjection(setup.owner);}assert.equal(p.revision?.state,'Review');if(action==='draft_candidates')p=await seed.acceptFinding({contract_version:'1.0',command_id:crypto.randomUUID(),...setup.owner,expected_row_version:p.revision!.row_version,finding_id:p.findings.at(-1)!.finding_id});}
  seeds.push({action,project,owner:{project_id:p.session!.project_id,session_id:p.session!.session_id,case_id:p.session!.case_id,revision_id:p.revision!.revision_id}});
 }
 const caseRoot=join(root,'Project-case');await mkdir(caseRoot);const base=await completedCase(caseRoot);
 const req=createRequire(import.meta.url),installedElectron=resolve('node_modules/electron/dist',(await readFile(resolve('node_modules/electron/path.txt'),'utf8')).trim()),mainBytes=req('@electron/asar').extractFile(asar,'.vite/build/main.cjs') as Buffer,mainSha=createHash('sha256').update(mainBytes).digest('hex');
 assert.equal(process.env.ELECTRON_OVERRIDE_DIST_PATH,undefined);await access(installedElectron,constants.X_OK); // Refuse missing toolchain before Electron's module can attempt installation.
 // Omit executablePath: installed Playwright supplies its loader and Electron's
 // default app dispatches the fixture argument. The fixture requires the exact ASAR Main.
 const app=await electron.launch({args:[resolve('tests/fixtures/case-assistant/provider-lifecycle-main.cjs'),'--user-data-dir='+join(root,'user-data')],env:{PATH:'/usr/bin:/bin',LANG:'en_US.UTF-8',JUANERAI_LIFECYCLE_ASAR:asar,JUANERAI_LIFECYCLE_ASAR_SHA256:process.env.JUANERAI_PROVIDER_SETTINGS_ASAR_SHA256!,JUANERAI_LIFECYCLE_MAIN_SHA256:mainSha},cwd:root});const child=app.process();
 t.after(()=>closeOwnedNativeProcess(child,()=>app.close(),value=>writeFile(join(root,'owned-cleanup.json'),JSON.stringify(value,null,2))));
 async function control<T=unknown>(method:string,arg?:unknown):Promise<T>{return app.evaluate((_,input)=>Reflect.get(globalThis,'lifecycle')[input.method](input.arg),{method,arg});}
 type Result<T> = {ok:boolean;value:T;code?:string;proof?:string;error?:{code:string}};
 async function invoke<T>(channel:string,request:unknown){return control<Result<T>>('invoke',{channel,request});}
 const ps=(request:unknown)=>invoke<import('../../../packages/contracts/provider-settings.ts').ProviderSettingsStatus>('xanthil-provider-settings:v1',request);
 const desktop=<T>(method:string,request:unknown)=>invoke<T>('xanthil-desktop:v1:'+method,request);
 const ca=<T>(request:unknown)=>invoke<T>('xanthil-case-assistant:v1',request);
 async function waitHeld(boundary:string){for(let i=0;i<200;i++){if((await control<{held:string}>('stats')).held===boundary)return;await new Promise(r=>setTimeout(r,20));}assert.fail('actual '+boundary+' boundary was not reached');}
 async function quiet(){for(let i=0;i<200;i++){if(!(await ps({operation:'read'})).value.busy)return;await new Promise(r=>setTimeout(r,10));}assert.fail('credential lease leaked');}
 type WindowState = {windows:{id:number;webContentsId:number}[];events:unknown[];allClosedEvents:number;beforeQuitEvents:number};
 const transitions:unknown[]=[];let closedWindowId:number|undefined;let completedCloses=0;
 async function recordTransition(phase:string){
  const state=await control<WindowState>('windowState');
  transitions.push({phase,...state,pageClosed:page.isClosed(),pages:app.windows().map(p=>({current:p===page,closed:p.isClosed()})),exitCode:child.exitCode,signalCode:child.signalCode});
  await writeFile(join(root,'window-lifecycle.json'),JSON.stringify(transitions,null,2));return state;
 }
 async function nativeId(target:typeof page){const handle=await app.browserWindow(target);try{return await handle.evaluate(window=>window.id);}finally{await handle.dispose();}}
 async function closeWindow(){
  const closingPage=page,id=await nativeId(closingPage);await recordTransition('before-close');
  try{
   // Register both completions before the native user-close operation. Neither
   // BrowserWindow.close() returning nor app.windows().length means closed.
   await Promise.all([
    closingPage.waitForEvent('close',{timeout:10000}),
    app.evaluate(({BrowserWindow},id)=>new Promise<void>((resolve,reject)=>{
     const window=BrowserWindow.fromId(id);if(!window){reject(Error('OWNED_WINDOW_MISSING'));return;}
     const timer=setTimeout(()=>reject(Error('NATIVE_CLOSED_EVENT_TIMEOUT')),10000);
     window.once('closed',()=>{clearTimeout(timer);resolve();});window.close();
    }),id),
   ]);
   assert.equal(closingPage.isClosed(),true);closedWindowId=id;
   completedCloses++;
   assert.deepEqual((await recordTransition('closed')).windows,[],'native close must complete before Dock activate');
  }catch(error){await recordTransition('close-failed');throw error;}
 }
 async function reopen(){
  assert.equal(page.isClosed(),true);assert.notEqual(closedWindowId,undefined);
  assert.deepEqual((await recordTransition('before-activate')).windows,[]);
  try{
   // Capture only the newly created/loaded Page, never the old closing Page.
   const [next]=await Promise.all([app.waitForEvent('window',{timeout:15000}),app.evaluate(({app})=>{app.emit('activate');})]);
   assert.notEqual(next,page);assert.equal(next.isClosed(),false);
   const id=await nativeId(next);assert.notEqual(id,closedWindowId);
   const state=await recordTransition('new-window');assert.equal(state.windows.length,1);assert.equal(state.windows[0].id,id);
   assert.equal(state.beforeQuitEvents,0,'global quit cleanup must not mask per-window cleanup');assert.equal(state.allClosedEvents,completedCloses);
   await next.getByRole('button',{name:/^模型接入/}).waitFor();return next;
  }catch(error){await recordTransition('reopen-failed');throw error;}
 }
 async function openProject(project:string){await control('project',project);assert.equal((await desktop('selectProject',{contract_version:'1.0',command_id:crypto.randomUUID()})).ok,true);}
 let page=await app.firstWindow({timeout:15000});
 const bootstrap=await app.evaluate(()=>{const fixture=Reflect.get(globalThis,'lifecycle');return fixture&&typeof fixture.health==='function'?fixture.health():null;});
 assert.ok(bootstrap,'synthetic fixture must be installed before the first lifecycle invocation');
 await writeFile(join(root,'listener-baseline.json'),JSON.stringify(bootstrap.listenerBaseline,null,2));
 assert.equal(bootstrap.syntheticKeepalive,true);
 assert.equal(bootstrap.listenerBaseline.mainPreserved,true,'loading exact Main must preserve the measured pre-existing listener identities');
 assert.deepEqual(bootstrap.listenerBaseline.afterMain,bootstrap.listenerBaseline.beforeMain);
 assert.equal(bootstrap.listenerBaseline.currentPreserved,true,'bootstrap must retain the measured non-host listeners');
 assert.deepEqual(bootstrap.listenerBaseline.current,bootstrap.listenerBaseline.afterMain);
 assert.equal(bootstrap.phase,'ready');assert.equal(bootstrap.mainLoaded,true);assert.equal(bootstrap.mainCached,true);assert.equal(bootstrap.handlersInstalled,true);
 assert.equal(bootstrap.fixture,resolve('tests/fixtures/case-assistant/provider-lifecycle-main.cjs'));assert.equal(bootstrap.executable,installedElectron);assert.equal(bootstrap.electron,'44.4.3');assert.equal(bootstrap.defaultApp,true);assert.equal(bootstrap.isPackaged,false,'synthetic harness uses installed default Electron, not an alternate packaged executable entry');
 assert.equal(bootstrap.appPath,asar);assert.equal(bootstrap.mainPath,join(asar,'.vite/build/main.cjs'));assert.equal(bootstrap.mainBytes,mainBytes.length);assert.equal(bootstrap.mainSha,mainSha);assert.equal(bootstrap.asarSha,process.env.JUANERAI_PROVIDER_SETTINGS_ASAR_SHA256);
 await writeFile(join(root,'bootstrap-readback.json'),JSON.stringify(bootstrap,null,2));
 await page.getByRole('button',{name:/^模型接入/}).waitFor();await quiet();
 const ledger:unknown[]=[];
 // First and later windows must revoke late proofs, including a rapid Dock reopen.
 for(let n=0;n<3;n++){
  await control('arm','runtime');await control('begin',{id:'probe',channel:'xanthil-provider-settings:v1',request:{operation:'test',key:'synthetic-new'}});await waitHeld('runtime');await closeWindow();page=await reopen();await control('release');const result=await control<Result<unknown>>('result','probe');assert.equal(result.ok,false);assert.equal(result.code,'CANCELLED');assert.equal(result.proof,undefined);await quiet();ledger.push({window:n+1,lateProof:false});
 }
 const proof=await ps({operation:'test',key:'synthetic-new'});assert.equal(proof.ok,true);await control('arm','read');await control('begin',{id:'save',channel:'xanthil-provider-settings:v1',request:{operation:'save',key:'synthetic-new',proof:proof.proof}});await waitHeld('read');await closeWindow();page=await reopen();await control('release');assert.equal((await control<Result<unknown>>('result','save')).code,'CANCELLED');await quiet();assert.equal((await control<{saves:number}>('stats')).saves,0);assert.equal((await control<{keyIsOld:boolean}>('stats')).keyIsOld,true);
 await control('fault','NETWORK_UNAVAILABLE');assert.equal((await ps({operation:'test',key:null})).code,'NETWORK_UNAVAILABLE');assert.equal((await ps({operation:'read'})).value.state,'configured');
 await control('fault','CREDENTIAL_INVALID');assert.equal((await ps({operation:'test',key:null})).code,'CREDENTIAL_INVALID');
 for(const fault of ['NETWORK_UNAVAILABLE','CONNECTION_TIMEOUT','QUOTA_EXCEEDED']){await control('fault',fault);assert.equal((await ps({operation:'test',key:null})).code,fault);await control('fault','keychain');assert.equal((await ps({operation:'refresh'})).code,'KEYCHAIN_UNAVAILABLE');await control('fault','');assert.equal((await ps({operation:'refresh'})).value.state,'credential_invalid');}
 assert.equal((await ps({operation:'test',key:null})).ok,true);assert.equal((await ps({operation:'read'})).value.state,'configured');
 for(const seed of seeds){
  await openProject(seed.project);
  const read=async()=>{const r=await desktop<Projection>('readProjection',{contract_version:'1.0',...seed.owner});assert.equal(r.ok,true);return r.value;};
  const authorize=async()=>{let p=await read();const preview=await desktop<import('../../../packages/contracts/xanthil-desktop-ipc.ts').DisclosurePreview>('prepareAssistanceDisclosure',{contract_version:'1.0',...seed.owner,expected_row_version:p.revision!.row_version,action_kind:seed.action,requested_provider:'xiaomi-token-plan-cn',requested_model:'mimo-v2.6-pro'});assert.equal(preview.ok,true);const d=await desktop<Projection>('decideAssistanceDisclosure',{contract_version:'1.0',...seed.owner,command_id:crypto.randomUUID(),expected_row_version:p.revision!.row_version,preview_token:preview.value.preview_token,payload_sha256:preview.value.payload_sha256,decision:'accepted',free_text_confirmed:true});assert.equal(d.ok,true);p=d.value;return {contract_version:'1.0',...seed.owner,command_id:crypto.randomUUID(),expected_row_version:p.revision!.row_version,disclosure_id:p.disclosures.at(-1)!.disclosure_id};};
  for(const boundary of ['preflight','runtime']){
   const start=await authorize(),before=await control<{requests:number}>('stats'),prior=await read();await control('arm',boundary);await control('begin',{id:'helper',channel:'xanthil-desktop:v1:startAssistance',request:start});await waitHeld(boundary);await closeWindow();page=await reopen();await control('release');await control('result','helper');await quiet();
   let p=await read();for(let i=0;i<200&&p.attempts.at(-1)?.status==='Running';i++){await new Promise(r=>setTimeout(r,10));p=await read();}
   assert.equal((await control<{requests:number}>('stats')).requests-before.requests,boundary==='runtime'?1:0);assert.equal(p.attempts.length-prior.attempts.length,boundary==='runtime'?1:0);assert.equal(p.assistance_drafts.length,0);if(boundary==='runtime')assert.equal(p.attempts.at(-1)?.terminal_reason,'interrupted');
   assert.equal((await desktop('startAssistance',{...start,command_id:crypto.randomUUID()})).ok,false,'closed authorization cannot restart');await openProject(seed.project);ledger.push({action:seed.action,boundary,lateRequests:0,drafts:0});
  }
  const start=await authorize();assert.equal((await desktop('startAssistance',start)).ok,true);let p=await read();for(let i=0;i<200&&p.attempts.at(-1)?.status==='Running';i++){await new Promise(r=>setTimeout(r,10));p=await read();}assert.equal(p.attempts.at(-1)?.status,'Succeeded');assert.equal(p.assistance_drafts.length,1);await quiet();ledger.push({action:seed.action,freshAdmission:'Succeeded'});
 }
 await openProject(caseRoot);let linked=await ca<import('../../../packages/contracts/case-assistant.ts').AssistantProjection>({version:'1.0',operation:'link',owner:base.owner,title:'Synthetic',command_id:crypto.randomUUID()});assert.equal(linked.ok,true);const session_id=linked.value.session.id;
 for(const boundary of ['read','runtime']){
  const authorization=await ca<import('../../../packages/contracts/case-assistant.ts').Authorization>({version:'1.0',operation:'prepare',session_id,text:'Synthetic task',history_ids:[],report_ids:[],rebase:false});assert.equal(authorization.ok,true);const before=await control<{requests:number}>('stats');await control('arm',boundary);await control('begin',{id:'case',channel:'xanthil-case-assistant:v1',request:{version:'1.0',operation:'start',session_id,authorization_id:authorization.value.id,free_text_confirmed:true}});await waitHeld(boundary);await closeWindow();page=await reopen();await control('release');await control('result','case');await quiet();await openProject(caseRoot);
  linked=await ca({version:'1.0',operation:'read',session_id});assert.equal(linked.ok,true);assert.equal(linked.value.drafts.length,0);assert.equal(linked.value.decisions.length,0);assert.equal((await control<{requests:number}>('stats')).requests-before.requests,boundary==='runtime'?1:0);if(boundary==='runtime')assert.equal(linked.value.attempts.at(-1)?.status,'Interrupted');ledger.push({action:'case',boundary,drafts:0,lateRequests:0});
 }
 const fresh=await ca<import('../../../packages/contracts/case-assistant.ts').Authorization>({version:'1.0',operation:'prepare',session_id,text:'Synthetic fresh task',history_ids:[],report_ids:[],rebase:false});assert.equal(fresh.ok,true);assert.equal((await ca({version:'1.0',operation:'start',session_id,authorization_id:fresh.value.id,free_text_confirmed:true})).ok,true);
 for(let i=0;i<200;i++){linked=await ca({version:'1.0',operation:'read',session_id});if(linked.value.attempts.at(-1)?.status==='Waiting')break;await new Promise(r=>setTimeout(r,10));}assert.equal(linked.value.attempts.at(-1)?.status,'Waiting');await ca({version:'1.0',operation:'stop',session_id});await quiet();
 const finalStats=await control<{fetches:number;sockets:number}>('stats');assert.equal(finalStats.fetches,0);assert.equal(finalStats.sockets,0);
 await page.screenshot({path:join(root,'reopened-1440.png')});await writeFile(join(root,'result.json'),JSON.stringify({packageSha:process.env.JUANERAI_PROVIDER_SETTINGS_ASAR_SHA256,ledger,stats:await control('stats'),network:false,keychain:false,synthetic:true},null,2));
});
