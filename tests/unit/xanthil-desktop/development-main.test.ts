import {createMembershipTaskHandler} from '../../../apps/desktop/member-task-main.ts';
import {installCollaborationClose} from '../../../apps/desktop/collaboration-window-close.ts';
import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync,mkdtempSync,realpathSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import * as path from 'node:path';
import {fileURLToPath} from 'node:url';
import {stripTypeScriptTypes} from 'node:module';
import {runInNewContext} from 'node:vm';
import {EventEmitter} from 'node:events';
import * as deployment from '../../../apps/desktop/development.ts';
import {createProviderSettings} from '../../../packages/application/provider-settings.ts';
import {validateXanthilDesktopRequest} from '../../../packages/contracts/xanthil-desktop-ipc.ts';

// Tests the real Main module against a closed Electron boundary. These prove
// wiring and admission; real native/business evidence remains a separate command.
async function mainBoundary(packaged:boolean,compiled:unknown){
 const root=realpathSync(mkdtempSync(join(tmpdir(),'dev-main-'))),handlers=new Map<string,Function>(),paths:Record<string,string>={},loads:string[]=[],credentialHelpers:string[]=[];
 let activationCalls=0;const windows:Window[]=[];
 const app=Object.assign(new EventEmitter(),{isPackaged:packaged,getPath:()=>root,setName(){},setPath:(k:string,v:string)=>{paths[k]=v;},setAppLogsPath(){},requestSingleInstanceLock:()=>true,whenReady:()=>Promise.resolve(),quit(){}});
 class Window extends EventEmitter{
  webContents={mainFrame:{url:''},on(){},setWindowOpenHandler(){},session:{setPermissionCheckHandler(){},setPermissionRequestHandler(){}}};
  constructor(){super();windows.push(this);}static getAllWindows(){return windows;}
  loadFile(url:string){loads.push('file:'+url);return Promise.resolve();}loadURL(url:string){this.webContents.mainFrame.url=url;loads.push(url);return Promise.resolve();}focus(){}
 }
 const env={JUANERAI_DESKTOP_DEV_ROOT:join(root,'dev'),XIAOMI_TOKEN_PLAN_CN_API_KEY:'synthetic-unusable',JUANERAI_CASE_ASSISTANT_ACTIVATION:'synthetic-invalid',MAIN_WINDOW_VITE_DEV_SERVER_URL:'http://evil.invalid'};
 const source=stripTypeScriptTypes(readFileSync('apps/desktop/main.ts','utf8'),{mode:'strip'}).replace(/^import .*;\s*$/gm,'').replace(/^export /gm,'').replaceAll('import.meta.url',JSON.stringify('file:///synthetic/.vite/build/main.cjs'));
 runInNewContext(source,{createMembershipTaskHandler,installCollaborationClose,...deployment,...path,fileURLToPath,URL,MAIN_WINDOW_VITE_DEV_SERVER_URL:compiled,electron:{app,BrowserWindow:Window,ipcMain:{handle:(name:string,fn:Function)=>handlers.set(name,fn)}},process:{execPath:'/production/Xanthil',resourcesPath:'/production/Resources',env},setTimeout,clearTimeout,validateXanthilDesktopRequest,createProviderSettings,loadPersonalCaseAssistantActivation:()=>{activationCalls++;return null;},createMacOsCredentialStore:(helper:string)=>{credentialHelpers.push(helper);return {async read(){return {status:'absent'};}};},probeLocalXiaomi:()=>assert.fail('no probe'),createPersonalXanthilDesktopProfile:()=>({openProject(){assert.fail('no project effect');},getCaseAssistant(){},getMembershipTask:()=>null,hasModelWork:()=>false,closeModelWork(){}}),createCaseAssistantHandler:()=>()=>undefined});
 await new Promise<void>(resolve=>setImmediate(resolve));
 return {root,handlers,paths,loads,credentialHelpers,activationCalls,env,window:windows[0]};
}
test('DEV-02/03 real Main selects development-only storage/helper and ignores inherited activation/key',async()=>{
 const control=await mainBoundary(false,'http://localhost:5173');
 assert.deepEqual(control.loads,['http://127.0.0.1:5173/']);assert.equal(control.paths.userData,join(control.root,'dev/user-data'));
 assert.deepEqual(control.credentialHelpers,['/synthetic/build/development-keychain/xanthil-keychain']);assert.equal(control.activationCalls,0);
 assert.equal(control.env.XIAOMI_TOKEN_PLAN_CN_API_KEY,undefined);assert.equal(control.env.JUANERAI_CASE_ASSISTANT_ACTIVATION,undefined);
 const handler=control.handlers.get('xanthil-desktop:v1:listSessions')!;const wc=control.window.webContents;
 for(const event of [{sender:{},senderFrame:wc.mainFrame},{sender:wc,senderFrame:{}}])assert.equal((await handler(event,{})).error.code,'FORBIDDEN');
 for(const url of ['http://evil.invalid/','http://127.0.0.1:5174/','http://127.0.0.1:5173/other']){wc.mainFrame.url=url;assert.equal((await handler({sender:wc,senderFrame:wc.mainFrame},{})).error.code,'FORBIDDEN');}
 wc.mainFrame.url='http://127.0.0.1:5173/';assert.equal((await handler({sender:wc,senderFrame:wc.mainFrame},{})).error.code,'INVALID_REQUEST');
});
test('DEV-03 packaged Main refuses development exception even with hostile compiled and environment URL/root',async()=>{
 const control=await mainBoundary(true,'http://evil.invalid/');
 assert.equal(control.loads.length,1);assert.ok(control.loads[0].startsWith('file:'));assert.deepEqual(control.paths,{});
 assert.deepEqual(control.credentialHelpers,['/production/xanthil-keychain']);
});
