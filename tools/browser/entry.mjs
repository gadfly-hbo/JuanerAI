import {spawn} from 'node:child_process';
import {mkdirSync,openSync,closeSync,constants} from 'node:fs';
import {join} from 'node:path';
import {homedir} from 'node:os';
import {fileURLToPath} from 'node:url';
import {browserServiceEnvironment} from './service-environment.ts';
import {prepareDevelopmentRoot} from '../../apps/desktop/development.ts';
import {readBrowserServiceIdentity,acquireBrowserServiceIdentity} from '../../adapters/storage-local/browser-project-origin.ts';
const [action,...options]=process.argv.slice(2);
if(!['start','open','stop','status'].includes(action)||options.length>1||options.length===1&&options[0]!=='--no-open')throw Error('Usage: web:start | web:open | web:stop | web:status');
const root=process.env.JUANERAI_DESKTOP_DEV_ROOT??join(homedir(),'Library','Application Support','Xanthil Development');
const paths=prepareDevelopmentRoot(root),directory=join(paths.userData,'web-service');mkdirSync(directory,{recursive:true,mode:0o700});
async function request(record,operation){const response=await fetch(record.origin+'/v1/service/'+operation,{method:'POST',headers:{'content-type':'application/json','x-xanthil-service':record.credential},body:'{}',signal:AbortSignal.timeout(1500)});if(!response.ok)throw Error('SERVICE_UNAVAILABLE');return response.json();}
async function current(){try{const record=readBrowserServiceIdentity(directory);await request(record,'status');return record;}catch{return null;}}
function quiescent(){try{const lease=acquireBrowserServiceIdentity(directory);lease.close();return true;}catch{return false;}}
let record=await current();
if(action==='start'&&!record){
 if(!quiescent())throw Error('服务状态尚未确认；不会启动第二个写者。');
 const env=browserServiceEnvironment(root);
 const log=openSync(join(directory,'service.log'),constants.O_CREAT|constants.O_APPEND|constants.O_WRONLY|constants.O_NOFOLLOW,0o600);
 try{const child=spawn(process.execPath,[fileURLToPath(new URL('./service.mjs',import.meta.url))],{env,detached:true,stdio:['ignore',log,log]});child.unref();}finally{closeSync(log);}
 const until=Date.now()+12000;while(!record&&Date.now()<until){await new Promise(resolve=>setTimeout(resolve,100));record=await current();}
}
if(action==='stop'){
 if(record)await request(record,'stop');
 const until=Date.now()+10000;while(!quiescent()){if(Date.now()>until)throw Error('服务停止结果尚未确认；保留现有执行状态。');await new Promise(resolve=>setTimeout(resolve,100));}
 process.stdout.write('本机网页服务已停止；重新打开不会自动继续任务。\n');
}else if(!record){process.stderr.write('本机网页服务未就绪，请运行 npm run web:start。\n');process.exitCode=1;}
else{
 if(['start','open'].includes(action)&&!options.includes('--no-open')){
  const {token}=await request(record,'open');if(!/^[a-f0-9]{64}$/.test(token))throw Error('Invalid local response');
  await new Promise((resolve,reject)=>{const child=spawn('/usr/bin/open',[record.origin+'/#'+token],{stdio:'ignore'});child.once('error',reject);child.once('exit',code=>code===0?resolve():reject(Error('Cannot open browser')));});
 }
 process.stdout.write(`本机网页服务：${record.origin}/\n再次打开：npm run web:open；停止：npm run web:stop。关闭网页不会停止任务。\n`);
}
