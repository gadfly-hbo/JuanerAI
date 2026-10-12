// Chromium test tool only. It contains no product/backend/composition imports.
const {app,BrowserWindow}=require('electron');
const path=require('node:path');
app.setPath('userData',path.join(process.env.JUANERAI_BROWSER_TEST_ROOT,'chromium'));
app.whenReady().then(async()=>{const w=new BrowserWindow({width:1280,height:1000,webPreferences:{nodeIntegration:false,contextIsolation:true,sandbox:true,webSecurity:true}});w.webContents.session.setPermissionRequestHandler((_w,_p,done)=>done(false));w.webContents.session.webRequest.onBeforeRequest((r,done)=>done({cancel:!r.url.startsWith(process.env.JUANERAI_BROWSER_TEST_ORIGIN+'/')&&!r.url.startsWith('data:')&&!r.url.startsWith('blob:')&&r.url!=='about:blank'}));await w.loadURL('about:blank');});
