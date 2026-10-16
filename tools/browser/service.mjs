import {startIndependentBrowserService} from '../../apps/browser/service-main.ts';
const root=process.env.JUANERAI_DESKTOP_DEV_ROOT;
if(!root||process.argv.length!==2)throw Error('Explicit local profile required');
try{
 const service=await startIndependentBrowserService(root);
 const stop=()=>{void service.close().then(()=>{process.exitCode=0;},error=>{process.stderr.write(error?.code==='RS_PROJECT_PENDING'?'Report Studio 仍有活动或未核对任务。请回工作台处理停止与结算后再退出；当前服务已保留。\n':'退出未完成，请核对工作台当前状态后重试。\n');process.exitCode=1;});};
 process.on('SIGTERM',stop);process.on('SIGINT',stop);
}catch(error){process.stderr.write(error?.code==='WEB_TOOLCHAIN_UNAVAILABLE'?error.message+'\n':'本机网页服务未能启动，请检查本地配置与运行条件。\n');process.exitCode=1;}
