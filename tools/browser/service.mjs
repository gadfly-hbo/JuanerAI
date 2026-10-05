import {startIndependentBrowserService} from '../../apps/browser/service-main.ts';
const root=process.env.JUANERAI_DESKTOP_DEV_ROOT;
if(!root||process.argv.length!==2)throw Error('Explicit local profile required');
try{
 const service=await startIndependentBrowserService(root);
 const stop=()=>{void service.close().then(()=>{process.exitCode=0;},()=>{process.exitCode=1;});};
 process.once('SIGTERM',stop);process.once('SIGINT',stop);
}catch(error){process.stderr.write(error?.code==='WEB_TOOLCHAIN_UNAVAILABLE'?error.message+'\n':'本机网页服务未能启动，请检查本地配置与运行条件。\n');process.exitCode=1;}
