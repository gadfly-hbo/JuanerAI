import {startBrowserNativeEntry} from './browser-native.ts';
import { basename, dirname, isAbsolute, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as electron from 'electron';


const { app } = electron;

function credentialHelperPath(entryUrl:string){return join(dirname(process.execPath),'xanthil-keychain');}

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  let browserCompanion:Awaited<ReturnType<typeof startBrowserNativeEntry>>=null;
  app.on('second-instance', () => {void browserCompanion?.open();});
  app.on('activate', () => {
    void browserCompanion?.open();
  });
  void app.whenReady().then(async()=>{browserCompanion=await startBrowserNativeEntry(typeof __filename==='string'?`file://${__filename}`:import.meta.url,credentialHelperPath(typeof __filename==='string'?`file://${__filename}`:import.meta.url));}).catch(async()=>{await electron.dialog.showMessageBox({type:'error',message:'工作区未能启动。请核对本机运行环境与所选项目，未自动重试。'});app.quit();});
}
