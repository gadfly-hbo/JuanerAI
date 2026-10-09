import * as electron from 'electron';
import {basename,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {launchBrowserCompanion} from '../browser/companion-main.ts';
import {readPersonalDesktopToolchain} from '../../profiles/personal/xanthil-desktop.ts';
import {createProviderSettings} from '../../packages/application/provider-settings.ts';
import {createMacOsCredentialStore} from '../../adapters/credentials-macos/index.ts';
import {createPiStoredCaseAssistantRuntime,probeLocalXiaomi} from '../../adapters/agent-pi/xiaomi-local.ts';
import {createLocalMembershipPolicyStore} from '../../adapters/storage-local/member-model-policy.ts';

/** Runs only after the shared Main instance lock and app readiness. */
export async function startBrowserNativeEntry(entryUrl:string,credentialHelper:string) {
  const {app,dialog,shell,Menu}=electron;
  const descriptor=app.isPackaged?join(process.resourcesPath,'toolchain-deployment.json'):fileURLToPath(new URL('../../build/xanthil-toolchain-deployment.json',entryUrl));
  const toolchain=await readPersonalDesktopToolchain(descriptor);
  const settings=createProviderSettings({store:createMacOsCredentialStore(credentialHelper),probe:probeLocalXiaomi});
  await settings.initialize();
  const policy=createLocalMembershipPolicyStore(app.getPath('userData'));
  await policy.initializeApproved();
  try {
    const companion=await launchBrowserCompanion({originDirectory:app.getPath('userData'),toolchain,model:{runtime:createPiStoredCaseAssistantRuntime(()=>settings.taskCredential()),access:settings.access,policy},native:{
      async selectProject(){
        const choice=await dialog.showMessageBox({type:'question',message:'打开本机工作项目',detail:'可重开由本浏览器入口创建并保存的项目。其他版本项目尚未开放切换。',buttons:['新建项目','打开已保存项目','取消'],defaultId:0,cancelId:2});
        if(choice.response===2)return null;
        if(choice.response===1){const selected=await dialog.showOpenDialog({title:'打开已保存的浏览器项目',properties:['openDirectory']});return selected.canceled||selected.filePaths.length!==1?null:{projectRoot:selected.filePaths[0],display_name:basename(selected.filePaths[0]),mode:'reopen' as const};}
        const selection=await dialog.showSaveDialog({title:'新建浏览器工作项目',buttonLabel:'新建并打开',nameFieldLabel:'项目名称',defaultPath:join(app.getPath('documents'),'Xanthil 项目')});return selection.canceled||!selection.filePath?null:{projectRoot:selection.filePath,display_name:basename(selection.filePath),mode:'create' as const};
      },
      openBrowser:url=>shell.openExternal(url),
    }});
    if(!companion){settings.close();app.quit();return null;}
    let committed=false,closing=false;
    app.on('before-quit',event=>{if(committed)return;event.preventDefault();if(closing)return;closing=true;void companion.close().then(async outcome=>{if(outcome.unresolved)await dialog.showMessageBox({type:'warning',message:'服务已停止接收任务。部分执行结果仍待核对，使用记录已保留，重开不会自动重发。'});settings.close();committed=true;app.quit();}).catch(async()=>{closing=false;await dialog.showMessageBox({type:'error',message:'退出结果待核对。请保留服务，稍后重试退出。'});});});
    Menu.setApplicationMenu(Menu.buildFromTemplate([{label:'Xanthil',submenu:[{label:'打开工作区',click:()=>{void companion.open();}},{label:'退出并停止任务',click:()=>app.quit()}]}]));
    return companion;
  } catch(error){settings.close();throw error;}
}
