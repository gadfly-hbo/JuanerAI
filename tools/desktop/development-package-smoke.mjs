import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile,access} from 'node:fs/promises';
import {join,isAbsolute} from 'node:path';
import {createHash} from 'node:crypto';
import {_electron} from 'playwright-core';
const root=process.env.JUANERAI_DEV_PACKAGE_EVIDENCE,appRoot=process.env.JUANERAI_DEV_PACKAGE_APP;
assert.ok(root&&isAbsolute(root)&&appRoot&&isAbsolute(appRoot));await mkdir(root);
await assert.rejects(access(join(appRoot,'Contents/MacOS/xanthil-keychain')),'smoke never permits production helper access');
const files=['Contents/MacOS/Xanthil','Contents/Info.plist','Contents/Resources/app.asar','Contents/Resources/toolchain-deployment.json'];
const identity=async()=>Promise.all(files.map(async path=>{const bytes=await readFile(join(appRoot,path));return {path,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')};}));
const before=await identity();await writeFile(join(root,'inputs.json'),JSON.stringify(before,null,2));
const deniedRoot=join(root,'must-not-be-created');
const app=await _electron.launch({executablePath:join(appRoot,'Contents/MacOS/Xanthil'),args:['--user-data-dir='+join(root,'user-data')],cwd:root,chromiumSandbox:true,timeout:20000,env:{PATH:'/usr/bin:/bin',HOME:process.env.HOME,LANG:'en_US.UTF-8',JUANERAI_DESKTOP_DEV_ROOT:deniedRoot,MAIN_WINDOW_VITE_DEV_SERVER_URL:'http://127.0.0.1:5173',VITE_DEV_SERVER_URL:'http://evil.invalid'}});
try{
 const page=await app.firstWindow();await page.getByText('Xanthil Desktop',{exact:true}).waitFor();
 const observed=await app.evaluate(({app,BrowserWindow})=>({packaged:app.isPackaged,url:BrowserWindow.getAllWindows()[0].webContents.getURL(),preferences:BrowserWindow.getAllWindows()[0].webContents.getLastWebPreferences()}));
 assert.equal(observed.packaged,true);assert.ok(observed.url.startsWith('file:'));
 for(const [key,value]of Object.entries({sandbox:true,contextIsolation:true,nodeIntegration:false,webSecurity:true}))assert.equal(observed.preferences[key],value);
 assert.equal(await page.getByText(/开发版/).count(),0);await assert.rejects(access(deniedRoot));
 const csp=await page.locator('meta[http-equiv="Content-Security-Policy"]').getAttribute('content');assert.match(csp,/connect-src 'none'/);assert.doesNotMatch(csp,/unsafe-inline/);
 await page.screenshot({path:join(root,'packaged.png')});await writeFile(join(root,'result.json'),JSON.stringify({result:'PASS',observed,csp},null,2));
}finally{await app.close();assert.deepEqual(await identity(),before);}
