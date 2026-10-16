// Native launcher for the approved browser + same-machine service profile.
// No legacy Desktop renderer, login daemon, updater or discovery of another Studio.
import {app,dialog,Menu,shell} from 'electron';
import {join,dirname} from 'node:path';
import {startIndependentBrowserService,runReportStudioExit} from './service-main.ts';
import {prepareDevelopmentRoot} from '../desktop/development.ts';
import type {ReportStudioLifecycle} from '../../adapters/report-studio/gateway.ts';

const root=join(app.getPath('appData'),'JuanerAI','Workbench');
const paths=prepareDevelopmentRoot(root,'installed-browser');
app.setPath('userData',paths.userData);app.setPath('sessionData',paths.cache);app.setAppLogsPath(paths.logs);
let service:Awaited<ReturnType<typeof startIndependentBrowserService>>|null=null,committed=false,quitting=false,cancelWait:(()=>void)|null=null;
function menu(){Menu.setApplicationMenu(Menu.buildFromTemplate([{label:'JuanerAI',submenu:[
 {label:'打开工作台',enabled:!!service&&!quitting,click:()=>{void open().catch(showFailure);}},
 ...(quitting?[{label:'等待制作结束与结算；未知项需在工作台核对',enabled:false},{label:'取消退出',click:()=>cancelWait?.()}]:[]),
 {label:'退出 JuanerAI',enabled:!quitting,click:()=>app.quit()},
]}]));}
async function open(){if(!service||quitting)return;await shell.openExternal(await service.open());}
async function showFailure(){await dialog.showMessageBox({type:'error',message:'操作尚未完成',detail:'已保留工作项目和使用记录，请回到工作台核对状态。未自动重试制作或切换版本。',buttons:['返回工作台']});}
async function choose(state:ReportStudioLifecycle):Promise<'wait'|'stop'|'cancel'>{
 const details=state.operations.map(op=>`${op.title}：${op.state==='unknown'?'结果或消费未知':op.state==='stopping'?'正在停止':'正在制作'}`).join('\n');
 const value=await dialog.showMessageBox({type:'question',message:'报告制作尚未结束，如何退出？',detail:[details,state.configuration_unknown?'制作设置保存结果未知，请先在工作台核对。':'','等待期间不接收新制作；可从 JuanerAI 菜单取消退出。停止请求受理后仍须等待实际结束与结算，未知项不会自动清除。'].filter(Boolean).join('\n'),buttons:['等待完成','停止制作并等待结算','取消退出'],defaultId:2,cancelId:2,noLink:true});
 return (['wait','stop','cancel'] as const)[value.response]??'cancel';
}
function observe(read:()=>Promise<ReportStudioLifecycle>):Promise<'ready'|'cancel'>{
 return new Promise((resolve,reject)=>{
  let live=true,timer:ReturnType<typeof setTimeout>|undefined;
  const finish=(state:'ready'|'cancel')=>{if(!live)return;live=false;if(timer)clearTimeout(timer);cancelWait=null;resolve(state);};
  cancelWait=()=>finish('cancel');
  const poll=async()=>{try{const state=await read();if(!live)return;if(!state.pending){finish('ready');return;}timer=setTimeout(()=>void poll(),750);}catch(error){if(!live)return;live=false;cancelWait=null;reject(error);}};void poll();
 });
}
app.on('window-all-closed',()=>{/* Browser tabs do not own or stop this service. */});
app.on('before-quit',event=>{
 if(committed)return;event.preventDefault();if(quitting||!service)return;quitting=true;menu();
 void runReportStudioExit({...service,choose,observe}).then(done=>{if(done){committed=true;app.quit();}}).catch(showFailure).finally(()=>{quitting=false;cancelWait=null;if(!committed)menu();});
});
if(!app.requestSingleInstanceLock()){committed=true;app.quit();}
else{
 app.on('second-instance',()=>{void open().catch(showFailure);});
 void app.whenReady().then(async()=>{
  // Resources and program paths are fixed by this installed composition only.
  service=await startIndependentBrowserService(root,{deployment:{resourcesRoot:process.resourcesPath,credentialHelper:join(dirname(process.execPath),'xanthil-keychain')}});menu();await open();
 }).catch(async()=>{await showFailure();if(service){try{await service.close();}catch{return;}}committed=true;app.quit();});
}
