// Offline product-component/IPC fixture. No activation or test hook is added to product Main.
import {app,BrowserWindow,ipcMain} from 'electron';
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {join} from 'node:path';
import {randomUUID} from 'node:crypto';
import {createPersonalXanthilDesktopProfile} from '../../../profiles/personal/xanthil-desktop.ts';
import {createMembershipTaskHandler} from '../../../apps/desktop/member-task-main.ts';
const root=process.env.JUANERAI_TEST_EVIDENCE_DIR!,repo=process.env.JUANERAI_FIXTURE_REPO!;
app.setPath('userData',join(root,'electron-user-data'));
const profile=createPersonalXanthilDesktopProfile({toolchainDeployment:{descriptor_path:join(root,'toolchain.json')},assistanceConfig:null,clock:()=>new Date(),deadlineScheduler:{schedule({at_epoch_ms,callback}:{at_epoch_ms:number;callback:()=>void}){const t=setTimeout(callback,Math.max(0,at_epoch_ms-Date.now()));return{cancel(){clearTimeout(t);}};}},membershipConfig:{profile:{version:'1.0',provider:'synthetic',model:'offline',activation:'synthetic_only',max_input_bytes:16000,max_output_bytes:8000,call_output_tokens:1000,total_output_tokens:10000,model_calls:10,call_ms:10000,total_active_ms:120000,wait_ms:10000,total_wait_ms:20000,local_runs:2,run_ms:20000,process_seconds:10,grant_ms:300000,cost:'unknown'},synthetic:{async respond(text:string){payloads.push(text);writeFileSync(join(root,'model-payloads.json'),JSON.stringify(payloads));if(payloads.length===2)throw Error('synthetic explanation failure');return JSON.parse(text).result?{kind:'report',text:'合成复核结果已保留。'}:{kind:'tool',tool:'execute_plan'};}}}});
const payloads:string[]=[],requests:unknown[]=[];
const sources=()=>({members:{display_name:'members.csv',bytes:new Uint8Array(readFileSync(join(repo,'tests/fixtures/xanthil-desktop/members.csv')))},orders:{display_name:'orders.csv',bytes:new Uint8Array(readFileSync(join(repo,'tests/fixtures/xanthil-desktop/orders.csv')))}});
app.whenReady().then(async()=>{
 const project=join(root,'Project');if(!existsSync(project))mkdirSync(project);
 await profile.openProject({contract_version:'1.0',projectDirectoryCapability:{projectRoot:project,display_name:'Synthetic'},display_name:'Synthetic',command_id:randomUUID()});
 const task=profile.getMembershipTask()!;
 if(!(await task.list()).length){const seed=await task.create('已明确口径的合成任务',randomUUID()),selection={column_mapping:{member_id_column:'member_id',member_group_column:'member_group',order_id_column:'order_id',order_member_id_column:'order_member_id',paid_at_column:'paid_at',amount_column:'amount',status_column:'status',currency_column:'currency'},comparison_period:{start_date:'2026-01-01',end_date:'2026-01-29'},current_period:{start_date:'2026-02-01',end_date:'2026-03-01'},currency:'CNY',time_zone:'Asia/Shanghai',valid_statuses:['paid'],selected_group_mode:'mapped'},inspection=await task.inspect(seed.task_id,sources(),selection);
 await task.prepare(seed.task_id,{source_files:sources(),selection,scenario:{version:'1.0',id:randomUUID(),revision:'1',maintainer:'合成测试维护者',metric:'membership_repurchase_comparison',currency:'CNY',time_zone:'Asia/Shanghai',status_meanings:{paid:'合成已付款'},quality_policy:'desktop_six_treatments_v1',verification:'python_independent_exact'},methods:['M1'],issue_treatments:inspection.reviewable_issues.map(x=>({code:x.code,count:x.count,treatment:x.treatment_options[0]}))});}
 const window=new BrowserWindow({show:false,width:1366,height:768,webPreferences:{preload:join(root,'build/preload.cjs'),contextIsolation:true,nodeIntegration:false,sandbox:true}});
 window.webContents.session.webRequest.onBeforeRequest((d,reply)=>reply({cancel:!d.url.startsWith('file:')&&!d.url.startsWith('devtools:')}));
 window.webContents.setWindowOpenHandler(()=>({action:'deny'}));window.webContents.on('will-navigate',e=>e.preventDefault());
 const handler=createMembershipTaskHandler({senderPolicy:s=>s===window.webContents,getApplication:()=>profile.getMembershipTask(),selectFiles:async()=>Object.freeze({synthetic_selected_pair:true}),readFiles:async()=>sources()});
 ipcMain.handle('xanthil-membership-task:v1',async(event,input)=>{requests.push(input);writeFileSync(join(root,'ipc-requests.json'),JSON.stringify(requests));if(event.senderFrame!==window.webContents.mainFrame)return {ok:false,error:{code:'FORBIDDEN',message:'forbidden'}};return handler(event.sender,input);});
 Object.assign(globalThis,{membershipFixture:{async read(){return task.list();},async reopen(){await task.reopen();},payloads}});
 await window.loadFile(join(root,'renderer/index.html'));
}).catch(e=>{writeFileSync(join(root,'main-error.txt'),String(e.stack??e));app.exit(1);});
app.on('window-all-closed',()=>app.quit());
